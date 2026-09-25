import type { Rarity, Script } from './types';

/**
 * Format des événements d'un book BAD BOSS (champ `events`, libre côté Stake Engine).
 * Ce que le book contient est le STRICT MINIMUM : les données mathématiques (déjà dans payoutMultiplier),
 * la catégorie de mise en scène, la rareté, la graine cosmétique et le chemin du BOSS FIGHT.
 * Tout le reste (branche précise, variantes, particules, réactions, secousses) est calculé localement
 * à partir de ces données. Voir TECH_ARCHITECTURE.md §2.7.
 */
export interface PresentationEvent {
  type: 'presentation';
  script: Script;
  rarity: Rarity;
  /** Graine cosmétique uint32 : ne change JAMAIS multiplicateur, gain, bonus, palier ni payout. */
  seed: number;
}

export interface BossFightAttack {
  result: 'HIT' | 'BLOCKED';
  variant: number;
}

export interface BossFightEvent {
  type: 'bossFight';
  /** Paliers du Rage Level, entiers ×100. */
  rungs100: number[];
  /** Déroulé complet du combat, déterminé par la génération mathématique. */
  attacks: BossFightAttack[];
  ko: boolean;
}

export interface FinalWinEvent {
  type: 'finalWin';
  /** Multiplicateur final entier ×100. */
  amount: number;
}

export type BookEvent = PresentationEvent | BossFightEvent | FinalWinEvent;

export interface Book {
  id: number;
  payoutMultiplier: number;
  events: BookEvent[];
}
