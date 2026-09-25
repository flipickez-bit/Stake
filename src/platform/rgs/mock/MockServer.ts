/**
 * Serveur RGS simulé (phase 0). Logique synchrone, état persistant (survit au rechargement de page),
 * pour tester reprise, pannes et replay SANS vraie mise. Ne pas confondre avec le RGS Stake Engine.
 */
import type { InternalRound, Money } from '../../../domain/round';
import type { RageLevelId } from '../../../domain/types';
import type { KeyValueStore } from '../../storage';
import { RgsError, type AuthResult, type BetConfig, type JurisdictionConfig, type RoundSnapshot } from '../RgsPort';
import { cryptoRandom, generateBook, type ForcedOutcome, type RandomSource } from './mockMath';

export interface MockFaults {
  /** Toutes les requêtes échouent (réseau coupé). */
  offline: boolean;
  /** Le prochain Play est EXÉCUTÉ par le serveur, mais la réponse est perdue. */
  playTimeoutAfterSend: boolean;
  /** Le prochain EndRound est EXÉCUTÉ par le serveur, mais la réponse est perdue. */
  endRoundTimeoutAfterSend: boolean;
  /** Latence simulée de chaque requête (ms). */
  latencyMs: number;
}

export interface MockCalls {
  authenticate: number;
  play: number;
  endRound: number;
  replay: number;
}

export interface MockState {
  version: 1;
  balance: number;
  currency: string;
  roundSeq: number;
  activeRound: InternalRound | null;
  lastRound: InternalRound | null;
  history: InternalRound[];
  calls: MockCalls;
  settledRounds: number;
  jurisdiction: JurisdictionConfig;
  /** Simule un RGS qui ferme lui-même les manches à gain nul (politique de repli). */
  autoCloseZeroPayout: boolean;
  nextForced: { mode: RageLevelId | null; forced: ForcedOutcome } | null;
  faults: MockFaults;
}

const STORE_KEY = 'badboss.mockrgs.v1';
const HISTORY_LIMIT = 40;

export const MOCK_BET_CONFIG: BetConfig = {
  minBet: 100_000,
  maxBet: 100_000_000,
  stepBet: 100_000,
  defaultBetLevel: 1_000_000,
  betLevels: [100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000, 100_000_000],
};

export const DEFAULT_JURISDICTION: JurisdictionConfig = {
  socialCasino: false,
  disabledFullscreen: false,
  disabledTurbo: false,
  disabledSuperTurbo: false,
  disabledAutoplay: false,
  disabledSlamstop: false,
  disabledSpacebar: false,
  disabledBuyFeature: false,
  displayNetPosition: false,
  displayRTP: false,
  displaySessionTimer: false,
  minimumRoundDuration: 0,
};

function initialState(): MockState {
  return {
    version: 1,
    balance: 1_000 * 1_000_000,
    currency: 'USD',
    roundSeq: 1,
    activeRound: null,
    lastRound: null,
    history: [],
    calls: { authenticate: 0, play: 0, endRound: 0, replay: 0 },
    settledRounds: 0,
    jurisdiction: { ...DEFAULT_JURISDICTION },
    autoCloseZeroPayout: false,
    nextForced: null,
    faults: { offline: false, playTimeoutAfterSend: false, endRoundTimeoutAfterSend: false, latencyMs: 120 },
  };
}

export class MockServer {
  private state: MockState;

  constructor(
    private readonly store: KeyValueStore,
    private readonly random: RandomSource = cryptoRandom,
  ) {
    this.state = store.get<MockState>(STORE_KEY) ?? initialState();
  }

  /** Copie de l'état (lecture seule, pour le DEV PANEL et les tests). */
  snapshot(): MockState {
    return structuredClone(this.state);
  }

  update(mutator: (s: MockState) => void): void {
    mutator(this.state);
    this.persist();
  }

  reset(): void {
    this.state = initialState();
    this.persist();
  }

  private persist(): void {
    this.store.set(STORE_KEY, this.state);
  }

  private money(): Money {
    return { amount: this.state.balance, currency: this.state.currency };
  }

  private roundSnapshot(): RoundSnapshot {
    return {
      balance: this.money(),
      activeRound: this.state.activeRound ? structuredClone(this.state.activeRound) : null,
      lastRound: this.state.lastRound ? structuredClone(this.state.lastRound) : null,
    };
  }

  authenticate(): AuthResult {
    this.state.calls.authenticate++;
    this.persist();
    return { ...this.roundSnapshot(), betConfig: structuredClone(MOCK_BET_CONFIG), jurisdiction: { ...this.state.jurisdiction } };
  }

  play(amount: number, mode: RageLevelId): { balance: Money; round: InternalRound } {
    this.state.calls.play++;
    if (this.state.activeRound) {
      this.persist();
      throw new RgsError('rgs', 'Player already has an active bet', 'ERR_BE');
    }
    if (amount < MOCK_BET_CONFIG.minBet || amount > MOCK_BET_CONFIG.maxBet || amount % MOCK_BET_CONFIG.stepBet !== 0) {
      this.persist();
      throw new RgsError('rgs', 'Invalid bet amount', 'ERR_VAL');
    }
    if (this.state.balance < amount) {
      this.persist();
      throw new RgsError('rgs', 'Insufficient player balance', 'ERR_IPB');
    }
    const round = this.createRound(amount, mode);
    this.persist();
    return { balance: this.money(), round: structuredClone(round) };
  }

  /** DEV : crée une manche active comme si elle venait d'une session précédente interrompue. */
  createActiveRound(amount: number, mode: RageLevelId): InternalRound {
    if (this.state.activeRound) return structuredClone(this.state.activeRound);
    const round = this.createRound(Math.min(amount, this.state.balance), mode);
    this.persist();
    return structuredClone(round);
  }

  private createRound(amount: number, mode: RageLevelId): InternalRound {
    const forced = this.state.nextForced && (this.state.nextForced.mode === null || this.state.nextForced.mode === mode)
      ? this.state.nextForced.forced
      : null;
    if (forced) this.state.nextForced = null;
    const book = generateBook(mode, this.random, forced);
    this.state.balance -= amount;
    const payout = Math.round((amount * book.payoutMultiplier) / 100);
    const round: InternalRound = {
      roundId: `M-${String(this.state.roundSeq++).padStart(5, '0')}`,
      mode,
      betAmount: amount,
      payout,
      payoutMultiplier100: book.payoutMultiplier,
      active: true,
      events: structuredClone(book.events),
    };
    if (this.state.autoCloseZeroPayout && payout === 0) {
      round.active = false;
      this.settle(round);
    } else {
      this.state.activeRound = round;
    }
    return round;
  }

  endRound(): { balance: Money } {
    this.state.calls.endRound++;
    const round = this.state.activeRound;
    if (!round) {
      this.persist();
      throw new RgsError('rgs', 'No active round', 'ERR_VAL');
    }
    this.state.balance += round.payout;
    round.active = false;
    this.state.activeRound = null;
    this.settle(round);
    this.persist();
    return { balance: this.money() };
  }

  private settle(round: InternalRound): void {
    this.state.lastRound = structuredClone(round);
    this.state.history.unshift(structuredClone(round));
    this.state.history.length = Math.min(this.state.history.length, HISTORY_LIMIT);
    this.state.settledRounds++;
  }

  replay(roundId: string): InternalRound {
    this.state.calls.replay++;
    this.persist();
    const found = this.state.history.find((r) => r.roundId === roundId);
    if (!found) throw new RgsError('rgs', `Round ${roundId} not found`, 'ERR_VAL');
    return structuredClone({ ...found, active: false });
  }

  resync(): RoundSnapshot {
    this.state.calls.authenticate++;
    this.persist();
    return this.roundSnapshot();
  }
}
