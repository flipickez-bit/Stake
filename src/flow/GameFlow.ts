/**
 * GameFlow : machine à états de la manche. Ne dépend QUE de RgsPort (réseau interne) et de RoundPresenter.
 * Invariants (TECH_ARCHITECTURE.md §2.3) :
 *  I1 un seul appel wallet en vol ; I2 Play seulement depuis READY, jamais relancé automatiquement ;
 *  I3 tir désactivé tant qu'une manche est active ou inconnue ; I4 la présentation ne lit que l'Outcome ;
 *  I5 aucun chiffre avant le reveal ; I6 EndRound borné, jamais de Play en récupération ;
 *  I7 mise suivante seulement si manche réglée + durée minimale écoulée ; I8 replay sans wallet.
 */
import { parseRound, type Outcome } from '../domain/outcome';
import type { InternalRound, Money } from '../domain/round';
import type { RageLevelId, ResultClass, Speed } from '../domain/types';
import {
  RgsError,
  type AuthResult,
  type BetConfig,
  type ReplayRequest,
  type RgsPort,
  type RoundSnapshot,
} from '../platform/rgs/RgsPort';
import { allowedSpeeds, capabilitiesFrom, RESTRICTIVE_CAPABILITIES, type Capabilities } from './featureGate';
import type { PresentationHandle, PresentationInfo, RoundPresenter } from './presenterPort';
import { realClock, waitPresentation, withTimeout, type Clock } from './timing';

export type FlowState =
  | 'BOOT'
  | 'AUTHENTICATING'
  | 'READY'
  | 'BET_PENDING'
  | 'ROUND_STATUS_UNKNOWN'
  | 'PRESENTING'
  | 'RESUMING'
  | 'REVEAL'
  | 'READY_GATE'
  | 'REPLAYING'
  | 'ERROR'
  | 'FATAL';

export interface FlowMessage {
  kind: 'info' | 'warning' | 'error';
  text: string;
}

export interface Revealed {
  roundId: string;
  multiplier100: number;
  payout: number;
  resultClass: ResultClass;
}

export interface FlowSnapshot {
  state: FlowState;
  balance: Money | null;
  betConfig: BetConfig | null;
  betAmount: number;
  level: RageLevelId;
  speed: Speed;
  capabilities: Capabilities;
  /** Rempli UNIQUEMENT à partir du reveal (I5). */
  revealed: Revealed | null;
  round: { roundId: string; mode: RageLevelId; source: Outcome['source'] } | null;
  presentation: PresentationInfo | null;
  message: FlowMessage | null;
  resyncAttempts: number;
  canFire: boolean;
  canSkip: boolean;
  retryAvailable: boolean;
}

export interface FlowTimeouts {
  authMs: number;
  playMs: number;
  endRoundMs: number;
}

export interface RoundRecord {
  roundId: string;
  level: RageLevelId;
  source: Outcome['source'];
  resultClass: ResultClass;
  multiplier100: number;
  branchId: string | null;
  gadgetId: string | null;
  betAmount: number;
  payout: number;
  bossFight: boolean;
  /** Vitesse de la présentation (turbo et super turbo compris). */
  speed: Speed;
  /** Le joueur a utilisé le skip / slamstop pendant la manche. */
  skipped: boolean;
  /** Durée réelle de la présentation (début → fin), en ms d'horloge. */
  animationMs: number;
  firedAt: number;
  readyAt: number;
}

export interface GameFlowDeps {
  rgs: RgsPort;
  presenter: RoundPresenter;
  clock?: Clock;
  timeouts?: Partial<FlowTimeouts>;
  /** Nombre maximal de resynchronisations automatiques avant de proposer « Réessayer ». */
  maxAutoResync?: number;
  onRoundComplete?: (record: RoundRecord) => void;
}

const DEFAULT_TIMEOUTS: FlowTimeouts = { authMs: 10_000, playMs: 15_000, endRoundMs: 10_000 };
const MAX_END_ROUND_CALLS = 3;

function errorText(e: unknown): string {
  if (e instanceof RgsError) {
    switch (e.code) {
      case 'ERR_IPB': return 'Insufficient balance for this bet.';
      case 'ERR_IS':
      case 'ERR_ATE': return 'Session expired. Please reload the game from the casino.';
      case 'ERR_GLE': return 'Gambling limit reached.';
      case 'ERR_LOC': return 'Game not available in your location.';
      case 'ERR_MAINTENANCE': return 'Service under maintenance. Please try again later.';
      case 'ERR_BE': return 'A round is already in progress.';
      default: return e.code ? `Request refused (${e.code}).` : e.message;
    }
  }
  return e instanceof Error ? e.message : String(e);
}

export class GameFlow {
  readonly rgs: RgsPort;
  private readonly presenter: RoundPresenter;
  private readonly clock: Clock;
  private readonly timeouts: FlowTimeouts;
  private readonly maxAutoResync: number;
  private readonly listeners = new Set<(s: FlowSnapshot) => void>();
  private s: FlowSnapshot;

  private handle: PresentationHandle | null = null;
  private currentOutcome: Outcome | null = null;
  private currentRoundId: string | null = null;
  private roundActiveOnServer = false;
  private roundStartedAt = 0;
  private firedAt = 0;
  private presentStartedAt = 0;
  private presentEndedAt = 0;
  private presentSpeed: Speed = 'normal';
  private skipUsed = false;
  private lastKnownRoundId: string | null = null;
  /** Lancé en mode replay (URL) : aucune mise possible, jamais d'appel wallet. */
  private replayOnly = false;
  private settlePromise: Promise<boolean> | null = null;
  private retryAction: (() => Promise<void>) | null = null;
  private lastOutcome: Outcome | null = null;
  private lastRound: InternalRound | null = null;
  private walletCallInFlight = false;

  constructor(private readonly deps: GameFlowDeps) {
    this.rgs = deps.rgs;
    this.presenter = deps.presenter;
    this.clock = deps.clock ?? realClock;
    this.timeouts = { ...DEFAULT_TIMEOUTS, ...deps.timeouts };
    this.maxAutoResync = deps.maxAutoResync ?? 6;
    this.s = {
      state: 'BOOT',
      balance: null,
      betConfig: null,
      betAmount: 0,
      level: 'grumpy',
      speed: 'normal',
      capabilities: { ...RESTRICTIVE_CAPABILITIES },
      revealed: null,
      round: null,
      presentation: null,
      message: null,
      resyncAttempts: 0,
      canFire: false,
      canSkip: false,
      retryAvailable: false,
    };
  }

  // ------------------------------------------------------------------ état observable

  get snapshot(): FlowSnapshot {
    return this.s;
  }

  subscribe(fn: (s: FlowSnapshot) => void): () => void {
    this.listeners.add(fn);
    fn(this.s);
    return () => this.listeners.delete(fn);
  }

  private set(patch: Partial<FlowSnapshot>): void {
    const next = { ...this.s, ...patch };
    next.canFire =
      !this.replayOnly &&
      next.state === 'READY' &&
      !this.walletCallInFlight &&
      next.balance !== null &&
      next.betAmount > 0 &&
      next.balance.amount >= next.betAmount;
    next.canSkip =
      next.capabilities.slamstop &&
      this.handle !== null &&
      (next.state === 'PRESENTING' || next.state === 'RESUMING' || next.state === 'REPLAYING');
    next.retryAvailable = this.retryAction !== null;
    this.s = next;
    for (const fn of this.listeners) fn(next);
  }

  /** Dernier Outcome présenté (DEV PANEL, replay). */
  get lastPresentedOutcome(): Outcome | null {
    return this.lastOutcome;
  }

  get lastPresentedRound(): InternalRound | null {
    return this.lastRound;
  }

  // ------------------------------------------------------------------ démarrage

  async start(replay?: ReplayRequest | null): Promise<void> {
    if (replay) return this.startReplayFromRequest(replay);
    this.retryAction = null;
    this.set({ state: 'AUTHENTICATING', message: null });
    let auth: AuthResult;
    try {
      auth = await this.walletCall(() => withTimeout(this.rgs.authenticate(), this.timeouts.authMs, 'authenticate'));
    } catch (e) {
      const fatal = e instanceof RgsError && (e.code === 'ERR_IS' || e.code === 'ERR_ATE' || e.code === 'ERR_LOC');
      this.retryAction = fatal ? null : () => this.start();
      this.set({ state: fatal ? 'FATAL' : 'ERROR', message: { kind: 'error', text: errorText(e) } });
      return;
    }
    const capabilities = capabilitiesFrom(auth.jurisdiction);
    const levels = auth.betConfig.betLevels;
    const betAmount = levels.includes(auth.betConfig.defaultBetLevel) ? auth.betConfig.defaultBetLevel : (levels[0] ?? 0);
    const speed = allowedSpeeds(capabilities).includes(this.s.speed) ? this.s.speed : 'normal';
    this.lastKnownRoundId = auth.lastRound?.roundId ?? null;
    this.set({ balance: auth.balance, betConfig: auth.betConfig, capabilities, betAmount, speed });
    if (auth.activeRound) {
      await this.resumeRound(auth.activeRound);
    } else {
      this.toReady(null);
    }
  }

  // ------------------------------------------------------------------ actions joueur

  setLevel(level: RageLevelId): void {
    if (this.s.state !== 'READY') return;
    this.set({ level });
    this.presenter.toIdle(level);
  }

  setBet(amount: number): void {
    if (this.s.state !== 'READY' || !this.s.betConfig?.betLevels.includes(amount)) return;
    this.set({ betAmount: amount });
  }

  stepBet(direction: 1 | -1): void {
    const levels = this.s.betConfig?.betLevels ?? [];
    const i = levels.indexOf(this.s.betAmount);
    const next = levels[Math.min(levels.length - 1, Math.max(0, i + direction))];
    if (next !== undefined) this.setBet(next);
  }

  setSpeed(speed: Speed): void {
    if (allowedSpeeds(this.s.capabilities).includes(speed)) this.set({ speed });
  }

  /** Tir. Garde SYNCHRONE : un double clic ne peut produire qu'un seul Play (I2). */
  fire(): boolean {
    if (!this.s.canFire) return false;
    const level = this.s.level;
    const amount = this.s.betAmount;
    this.firedAt = this.clock.now();
    this.set({ state: 'BET_PENDING', revealed: null, round: null, presentation: null, message: null, resyncAttempts: 0 });
    void this.runBet(level, amount);
    return true;
  }

  skip(): boolean {
    if (!this.s.canSkip || !this.handle) return false;
    const skipped = this.handle.skipToReveal();
    if (skipped) this.skipUsed = true;
    return skipped;
  }

  async retry(): Promise<void> {
    const action = this.retryAction;
    if (!action) return;
    this.retryAction = null;
    this.set({ message: null });
    await action();
  }

  /** Replay depuis READY (DEV PANEL ou URL). N'appelle jamais le wallet (I8). */
  async replayRound(round: InternalRound): Promise<void> {
    if (this.s.state !== 'READY' && this.s.state !== 'BOOT') return;
    let outcome: Outcome;
    try {
      outcome = parseRound({ ...round, active: false }, 'replay');
    } catch (e) {
      this.set({ message: { kind: 'error', text: errorText(e) } });
      return;
    }
    this.set({ state: 'REPLAYING', revealed: null, round: { roundId: outcome.roundId, mode: outcome.mode, source: 'replay' } });
    const handle = this.presenter.present(outcome, { speed: this.s.speed, mode: 'replay' });
    this.handle = handle;
    this.set({ presentation: handle.info });
    await waitPresentation(handle.reveal, handle.info.totalMs * 3 + 5000);
    this.set({ revealed: { roundId: outcome.roundId, multiplier100: outcome.payoutMultiplier100, payout: outcome.payout, resultClass: outcome.resultClass } });
    await waitPresentation(handle.done, handle.info.totalMs * 3 + 5000);
    this.handle = null;
    this.toReady(null);
  }

  get isReplayOnly(): boolean {
    return this.replayOnly;
  }

  private async startReplayFromRequest(req: ReplayRequest): Promise<void> {
    this.replayOnly = true;
    this.set({ state: 'AUTHENTICATING', message: { kind: 'info', text: 'Loading replay…' } });
    try {
      const round = await withTimeout(this.rgs.getReplay(req), this.timeouts.authMs, 'replay');
      this.set({ state: 'BOOT', message: null });
      await this.replayRound(round);
    } catch (e) {
      this.retryAction = () => this.startReplayFromRequest(req);
      this.set({ state: 'ERROR', message: { kind: 'error', text: errorText(e) } });
    }
  }

  // ------------------------------------------------------------------ manche

  private async walletCall<T>(run: () => Promise<T>): Promise<T> {
    if (this.walletCallInFlight) throw new RgsError('client', 'Un appel wallet est déjà en cours (I1)');
    this.walletCallInFlight = true;
    try {
      return await run();
    } finally {
      this.walletCallInFlight = false;
    }
  }

  private async runBet(level: RageLevelId, amount: number): Promise<void> {
    this.roundStartedAt = this.firedAt;
    this.presenter.beginNeutral(level, this.s.speed);
    let round: InternalRound;
    try {
      const res = await this.walletCall(() => withTimeout(this.rgs.play(amount, level), this.timeouts.playMs, 'play'));
      this.set({ balance: res.balance });
      round = res.round;
    } catch (e) {
      if (e instanceof RgsError && e.definitelyNotExecuted) {
        this.presenter.abortNeutral();
        this.toReady({ kind: 'error', text: errorText(e) });
        return;
      }
      // Réponse absente ou illisible : on NE SUPPOSE PAS que la mise a échoué (ROUND_STATUS_UNKNOWN).
      this.set({ state: 'ROUND_STATUS_UNKNOWN', message: { kind: 'warning', text: 'Connection lost. Checking your round with the server…' } });
      await this.resolveUnknownPlay();
      return;
    }
    await this.presentRound(round, 'play');
  }

  /** Resynchronisation après un Play au résultat inconnu. N'envoie JAMAIS de nouveau Play. */
  private async resolveUnknownPlay(): Promise<void> {
    const snap = await this.resyncUntilKnown();
    if (!snap) {
      this.retryAction = () => this.resolveUnknownPlay();
      this.set({ state: 'ROUND_STATUS_UNKNOWN', message: { kind: 'error', text: 'Unable to reach the server. Your bet status is unknown: no new bet will be placed. Tap RETRY to check again.' } });
      return;
    }
    this.set({ balance: snap.balance });
    if (snap.activeRound) {
      this.presenter.abortNeutral();
      await this.resumeRound(snap.activeRound);
      return;
    }
    if (snap.lastRound && snap.lastRound.roundId !== this.lastKnownRoundId) {
      // La mise a eu lieu et le serveur a déjà fermé la manche (politique de repli) : récapitulatif.
      this.presenter.abortNeutral();
      await this.presentRound(snap.lastRound, 'recap');
      return;
    }
    this.presenter.abortNeutral();
    this.toReady({ kind: 'warning', text: 'Bet not placed: the connection failed before it was recorded.' });
  }

  private async resyncUntilKnown(): Promise<RoundSnapshot | null> {
    for (let attempt = 1; attempt <= this.maxAutoResync; attempt++) {
      this.set({ resyncAttempts: attempt });
      try {
        return await this.walletCall(() => withTimeout(this.rgs.getActiveRound(), this.timeouts.authMs, 'resync'));
      } catch {
        await this.clock.delay(Math.min(250 * 2 ** (attempt - 1), 4000));
      }
    }
    return null;
  }

  private async resumeRound(round: InternalRound): Promise<void> {
    this.roundStartedAt = this.clock.now();
    this.firedAt = this.roundStartedAt;
    this.set({ state: 'RESUMING', message: { kind: 'info', text: 'Resuming your round…' } });
    await this.presentRound(round, 'resume');
  }

  private async presentRound(round: InternalRound, source: 'play' | 'resume' | 'recap'): Promise<void> {
    this.currentRoundId = round.roundId;
    this.roundActiveOnServer = round.active;
    this.settlePromise = null;
    let outcome: Outcome;
    try {
      outcome = parseRound(round, source === 'play' ? 'play' : 'resume');
    } catch (e) {
      // Illisible : on ne peut pas animer, mais l'argent doit être réglé correctement.
      this.set({ message: { kind: 'error', text: `Round ${round.roundId}: ${errorText(e)}` } });
      if (round.active) await this.finishSettlement();
      this.toReady(this.s.message);
      return;
    }
    this.currentOutcome = outcome;
    this.lastOutcome = outcome;
    this.lastRound = { ...round, active: false };
    const speed: Speed = source === 'play' ? this.s.speed : this.s.capabilities.turbo ? 'turbo' : 'normal';
    this.presentSpeed = speed;
    this.skipUsed = false;
    this.presentStartedAt = this.clock.now();
    this.presentEndedAt = this.presentStartedAt;
    const handle = this.presenter.present(outcome, { speed, mode: source });
    this.handle = handle;
    this.set({
      state: source === 'play' ? 'PRESENTING' : 'RESUMING',
      round: { roundId: outcome.roundId, mode: outcome.mode, source: outcome.source },
      presentation: handle.info,
    });
    const guard = handle.info.totalMs * 3 + 5000;
    await waitPresentation(handle.reveal, guard);
    // I5 : les chiffres n'existent pour l'UI qu'à partir d'ici.
    this.set({
      state: 'REVEAL',
      message: source === 'recap' ? { kind: 'info', text: 'This round was already settled by the server.' } : this.s.message?.kind === 'info' ? null : this.s.message,
      revealed: { roundId: outcome.roundId, multiplier100: outcome.payoutMultiplier100, payout: outcome.payout, resultClass: outcome.resultClass },
    });
    const [settled] = await Promise.all([
      this.roundActiveOnServer ? this.finishSettlement() : Promise.resolve(true),
      waitPresentation(handle.done, guard).then((r) => {
        this.presentEndedAt = this.clock.now();
        return r;
      }),
    ]);
    this.handle = null;
    if (!settled) return; // ERROR avec « Réessayer » déjà affiché
    await this.completeRound(outcome, handle.info.branchId);
  }

  private async completeRound(outcome: Outcome, branchId: string | null): Promise<void> {
    this.lastKnownRoundId = outcome.roundId;
    const minMs = this.s.capabilities.minRoundDurationMs;
    const elapsed = this.clock.now() - this.roundStartedAt;
    if (minMs > elapsed) {
      // I7 : les animations ne sont pas modifiées, on attend seulement le temps restant.
      this.set({ state: 'READY_GATE' });
      await this.clock.delay(minMs - elapsed);
    }
    this.deps.onRoundComplete?.({
      roundId: outcome.roundId,
      level: outcome.mode,
      source: outcome.source,
      resultClass: outcome.resultClass,
      multiplier100: outcome.payoutMultiplier100,
      branchId,
      gadgetId: this.s.presentation?.gadgetId ?? null,
      betAmount: outcome.betAmount,
      payout: outcome.payout,
      bossFight: outcome.bossFight !== null,
      speed: this.presentSpeed,
      skipped: this.skipUsed,
      animationMs: Math.max(0, this.presentEndedAt - this.presentStartedAt),
      firedAt: this.firedAt,
      readyAt: this.clock.now(),
    });
    this.toReady(this.s.message?.kind === 'info' ? null : this.s.message);
  }

  /** Règlement borné de la manche : au plus MAX_END_ROUND_CALLS appels, chacun après confirmation serveur. */
  private finishSettlement(): Promise<boolean> {
    if (!this.settlePromise) this.settlePromise = this.settleRound();
    return this.settlePromise;
  }

  private async settleRound(): Promise<boolean> {
    const roundId = this.currentRoundId;
    for (let call = 1; call <= MAX_END_ROUND_CALLS; call++) {
      try {
        const res = await this.walletCall(() => withTimeout(this.rgs.endRound(), this.timeouts.endRoundMs, 'endRound'));
        this.set({ balance: res.balance });
        this.roundActiveOnServer = false;
        return true;
      } catch {
        // Réponse perdue ou refus : on demande l'état au serveur AVANT tout nouvel EndRound.
        const snap = await this.resyncUntilKnown();
        if (!snap) break;
        this.set({ balance: snap.balance });
        if (!snap.activeRound || snap.activeRound.roundId !== roundId) {
          this.roundActiveOnServer = false;
          return true;
        }
      }
    }
    this.retryAction = async () => {
      this.settlePromise = null;
      this.set({ state: 'REVEAL', message: { kind: 'info', text: 'Settling your round…' } });
      const ok = await this.finishSettlement();
      if (ok && this.currentOutcome) await this.completeRound(this.currentOutcome, this.s.presentation?.branchId ?? null);
    };
    this.set({ state: 'ERROR', message: { kind: 'error', text: 'Could not confirm the end of the round. Your result is safe on the server. Tap RETRY.' } });
    return false;
  }

  private toReady(message: FlowMessage | null): void {
    this.handle = null;
    this.currentOutcome = null;
    this.settlePromise = null;
    this.set({ state: 'READY', message, resyncAttempts: 0 });
    this.presenter.toIdle(this.s.level);
  }
}
