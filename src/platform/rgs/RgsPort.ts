import type { InternalRound, Money } from '../../domain/round';
import type { RageLevelId } from '../../domain/types';

/**
 * Interface réseau INTERNE et stable de BAD BOSS.
 * GameFlow ne connaît que cette interface. MockRgsAdapter et StakeRgsAdapter l'implémentent tous deux :
 * on peut les échanger sans modifier GameFlow.
 */

export interface BetConfig {
  minBet: number;
  maxBet: number;
  stepBet: number;
  defaultBetLevel: number;
  betLevels: number[];
}

/** Clés vérifiées dans le web-sdk et dans le client `stake-engine`. Sémantique : INFORMATION STAKE ENGINE REQUISE. */
export interface JurisdictionConfig {
  socialCasino: boolean;
  disabledFullscreen: boolean;
  disabledTurbo: boolean;
  disabledSuperTurbo: boolean;
  disabledAutoplay: boolean;
  disabledSlamstop: boolean;
  disabledSpacebar: boolean;
  disabledBuyFeature: boolean;
  displayNetPosition: boolean;
  displayRTP: boolean;
  displaySessionTimer: boolean;
  minimumRoundDuration: number;
}

export interface RoundSnapshot {
  balance: Money;
  /** Manche active à reprendre (null si aucune). */
  activeRound: InternalRound | null;
  /** Dernière manche terminée connue du serveur (null si aucune). */
  lastRound: InternalRound | null;
}

export interface AuthResult extends RoundSnapshot {
  betConfig: BetConfig;
  jurisdiction: JurisdictionConfig;
}

export interface PlayResult {
  balance: Money;
  round: InternalRound;
}

export interface EndRoundResult {
  balance: Money;
}

export interface ReplayRequest {
  game: string;
  version: string;
  mode: string;
  event: string;
}

export type RgsErrorKind =
  /** Le serveur a répondu avec un code d'erreur : la requête est traitée ET refusée. */
  | 'rgs'
  /** Aucune réponse dans le délai : état du serveur INCONNU. */
  | 'timeout'
  /** Échec réseau : état du serveur INCONNU (on ne sait pas si la requête est partie). */
  | 'network'
  /** Réponse illisible : état du serveur INCONNU. */
  | 'protocol'
  /** Refus local avant tout envoi (paramètres invalides) : rien n'est parti. */
  | 'client';

export class RgsError extends Error {
  constructor(
    readonly kind: RgsErrorKind,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'RgsError';
  }

  /** true si l'on sait avec certitude que le serveur n'a PAS exécuté la requête. */
  get definitelyNotExecuted(): boolean {
    return this.kind === 'rgs' || this.kind === 'client';
  }
}

export interface RgsPort {
  readonly name: 'mock' | 'stake';
  authenticate(): Promise<AuthResult>;
  /** Place une mise. Ne doit JAMAIS être relancée automatiquement par l'appelant. */
  play(amount: number, mode: RageLevelId): Promise<PlayResult>;
  endRound(): Promise<EndRoundResult>;
  /** Resynchronisation : nouvelle authentification, renvoie la manche active et la dernière manche. */
  getActiveRound(): Promise<RoundSnapshot>;
  /** Replay d'une manche passée (aucun effet sur le wallet). */
  getReplay(request: ReplayRequest): Promise<InternalRound>;
}
