import type { RageLevelId } from './types';

/**
 * Manche interne, indépendante de Stake Engine. Les adapters (Mock, Stake) convertissent
 * immédiatement leurs réponses vers ce modèle : aucun type du SDK Stake ne sort de l'adapter.
 */
export interface InternalRound {
  roundId: string;
  mode: RageLevelId;
  /** Mise en unités RGS (1 000 000 = 1,00). */
  betAmount: number;
  /** Gain en unités RGS, tel que renvoyé par le serveur (source de vérité de l'argent). */
  payout: number;
  /** Multiplicateur entier ×100, dérivé par l'adapter (payout / mise) et contrôlé contre le book. */
  payoutMultiplier100: number;
  /** true tant que la manche n'est pas réglée côté serveur. */
  active: boolean;
  /** Événements du book (format BAD BOSS, voir book.ts). */
  events: unknown[];
}

export interface Money {
  /** Unités RGS (1 000 000 = 1,00). */
  amount: number;
  currency: string;
}

export const RGS_AMOUNT_MULTIPLIER = 1_000_000;
