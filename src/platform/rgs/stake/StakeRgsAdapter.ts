/**
 * Adapter Stake Engine. SEUL fichier du projet qui importe le client `stake-engine` (BETA, statut officiel
 * à confirmer). Toutes les réponses sont converties IMMÉDIATEMENT vers les modèles internes (InternalRound,
 * AuthResult…). Aucun type du SDK ne sort de ce fichier.
 *
 * Ajouts par rapport au client (voir docs/STAKE_ENGINE_FAITS_VERIFIES.md §6) :
 *  - codes d'erreur récupérés par FetchObserver (L1) ;
 *  - resynchronisation par une NOUVELLE instance du client (L3 : verrou local roundActive jamais relâché) ;
 *  - replay via GET /bet/replay/... (non fourni par le client, contrat : INFORMATION STAKE ENGINE REQUISE).
 * Les délais d'expiration sont appliqués par GameFlow, de la même façon pour tous les adapters.
 */
import { RGSClient } from 'stake-engine';
import type { InternalRound, Money } from '../../../domain/round';
import { isRageLevelId, type RageLevelId } from '../../../domain/types';
import {
  RgsError,
  type AuthResult,
  type BetConfig,
  type EndRoundResult,
  type JurisdictionConfig,
  type PlayResult,
  type ReplayRequest,
  type RgsPort,
  type RoundSnapshot,
} from '../RgsPort';
import { FetchObserver } from './fetchObserver';

type Client = ReturnType<typeof RGSClient>;

/** Forme brute d'une manche Stake (sous-ensemble utilisé, lu sans confiance). */
interface RawRound {
  betID?: unknown;
  amount?: unknown;
  payout?: unknown;
  payoutMultiplier?: unknown;
  active?: unknown;
  mode?: unknown;
  state?: unknown;
}

const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

function extractEvents(state: unknown): unknown[] {
  if (Array.isArray(state)) return state;
  if (state && typeof state === 'object' && Array.isArray((state as { events?: unknown }).events)) {
    return (state as { events: unknown[] }).events;
  }
  return [];
}

function finalWinOf(events: unknown[]): number | null {
  for (const e of events) {
    if (e && typeof e === 'object' && (e as { type?: unknown }).type === 'finalWin') {
      const amount = (e as { amount?: unknown }).amount;
      if (typeof amount === 'number') return amount;
    }
  }
  return null;
}

/** Stake → InternalRound. Le multiplicateur vient du serveur (payout / mise) et sera contrôlé contre le book. */
export function toInternalRound(raw: RawRound, fallbackMode?: string, fallbackAmount?: number): InternalRound {
  const modeText = String(raw.mode ?? fallbackMode ?? '').toLowerCase();
  if (!isRageLevelId(modeText)) throw new RgsError('protocol', `Mode inconnu renvoyé par le RGS : ${modeText}`);
  const events = extractEvents(raw.state);
  const betAmount = num(raw.amount, fallbackAmount ?? 0);
  const payout = num(raw.payout);
  const fromServer = betAmount > 0 ? Math.round((payout * 100) / betAmount) : null;
  const fromBook = finalWinOf(events);
  return {
    roundId: String(raw.betID ?? 'unknown'),
    mode: modeText as RageLevelId,
    betAmount,
    payout,
    payoutMultiplier100: fromServer ?? fromBook ?? 0,
    active: raw.active === true,
    events,
  };
}

function toMoney(balance: { amount: number; currency: string }): Money {
  return { amount: balance.amount, currency: String(balance.currency) };
}

function snapshotFrom(balance: Money, round: RawRound | null | undefined): RoundSnapshot {
  if (!round) return { balance, activeRound: null, lastRound: null };
  const internal = toInternalRound(round);
  return internal.active
    ? { balance, activeRound: internal, lastRound: null }
    : { balance, activeRound: null, lastRound: internal };
}

export class StakeRgsAdapter implements RgsPort {
  readonly name = 'stake' as const;
  private client: Client;
  private readonly observer: FetchObserver;
  private readonly rgsBase: string;

  constructor(private readonly href: string, private readonly protocol: 'https' | 'http' = 'https') {
    const rgsUrl = new URL(href).searchParams.get('rgs_url') ?? '';
    this.rgsBase = `${protocol}://${rgsUrl}`;
    this.observer = new FetchObserver(this.rgsBase);
    this.observer.install();
    this.client = this.newClient();
  }

  private newClient(): Client {
    return RGSClient({ url: this.href, protocol: this.protocol });
  }

  private async call<T>(run: () => Promise<T>): Promise<T> {
    this.observer.begin();
    try {
      return await run();
    } catch (err) {
      if (err instanceof RgsError) throw err;
      const { failure, requestStarted } = this.observer.end();
      if (!requestStarted) throw new RgsError('client', String(err instanceof Error ? err.message : err));
      if (failure && !failure.network && failure.status >= 400 && failure.status < 500) {
        throw new RgsError('rgs', failure.message ?? `HTTP ${failure.status}`, failure.code ?? `HTTP_${failure.status}`);
      }
      if (failure && !failure.network && failure.status >= 500) {
        // 5xx : exécution côté serveur incertaine → traité comme état inconnu par GameFlow.
        throw new RgsError('protocol', failure.message ?? `HTTP ${failure.status}`, failure.code ?? `HTTP_${failure.status}`);
      }
      if (err instanceof SyntaxError) throw new RgsError('protocol', err.message);
      throw new RgsError('network', String(err instanceof Error ? err.message : err));
    }
  }

  async authenticate(): Promise<AuthResult> {
    return this.call(async () => {
      const res = await this.client.Authenticate();
      const balance = toMoney(res.balance);
      const betConfig: BetConfig = {
        minBet: res.config.minBet,
        maxBet: res.config.maxBet,
        stepBet: res.config.stepBet,
        defaultBetLevel: res.config.defaultBetLevel,
        betLevels: res.config.betLevels.slice(),
      };
      const j = res.jurisdictionFlags;
      const jurisdiction: JurisdictionConfig = {
        socialCasino: j.socialCasino === true,
        disabledFullscreen: j.disabledFullscreen === true,
        disabledTurbo: j.disabledTurbo === true,
        disabledSuperTurbo: j.disabledSuperTurbo === true,
        disabledAutoplay: j.disabledAutoplay === true,
        disabledSlamstop: j.disabledSlamstop === true,
        disabledSpacebar: j.disabledSpacebar === true,
        disabledBuyFeature: j.disabledBuyFeature === true,
        displayNetPosition: j.displayNetPosition === true,
        displayRTP: j.displayRTP === true,
        displaySessionTimer: j.displaySessionTimer === true,
        minimumRoundDuration: num(j.minimumRoundDuration),
      };
      return { ...snapshotFrom(balance, res.round as RawRound | null), betConfig, jurisdiction };
    });
  }

  async play(amount: number, mode: RageLevelId): Promise<PlayResult> {
    return this.call(async () => {
      const res = await this.client.Play({ amount, mode });
      return { balance: toMoney(res.balance), round: toInternalRound(res.round as RawRound, mode, amount) };
    });
  }

  async endRound(): Promise<EndRoundResult> {
    return this.call(async () => {
      const res = await this.client.EndRound();
      return { balance: toMoney(res.balance) };
    });
  }

  /** Nouvelle instance du client (état local vierge) + Authenticate. */
  async getActiveRound(): Promise<RoundSnapshot> {
    return this.call(async () => {
      const fresh = this.newClient();
      const res = await fresh.Authenticate();
      this.client = fresh;
      return snapshotFrom(toMoney(res.balance), res.round as RawRound | null);
    });
  }

  /** GET /bet/replay/{game}/{version}/{mode}/{event} (observé dans le web-sdk 🟡, contrat ❓). */
  async getReplay(req: ReplayRequest): Promise<InternalRound> {
    return this.call(async () => {
      const path = [req.game, req.version, req.mode, req.event].map(encodeURIComponent).join('/');
      const res = await fetch(`${this.rgsBase}/bet/replay/${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as RawRound;
      return { ...toInternalRound({ ...data, mode: data.mode ?? req.mode }, req.mode, req.amount), active: false };
    });
  }
}
