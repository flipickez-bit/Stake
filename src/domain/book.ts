import type { PlanSlot } from './plans';
import type { RageLevelId, Rarity, Script } from './types';

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

/**
 * POC « 3 PLANS » (architecture A2, MOCK / DEV) : les trois résultats de la manche, tirés ENSEMBLE avant de savoir
 * quel plan est payé. Dans les trois fichiers de modes d'un niveau, ce bloc serait identique octet pour octet.
 * Chaque plan porte déjà sa présentation (script, rareté, graine) : ce qu'on aurait vu est fixé, pas seulement le chiffre.
 */
export interface TripleResultEvent {
  slot: PlanSlot;
  gadgetId: string;
  /** Multiplicateur entier ×100. */
  multiplier100: number;
  script: Script;
  rarity: Rarity;
  seed: number;
}

export interface TripleEvent {
  type: 'triple';
  level: RageLevelId;
  model: string;
  /** BOSS FIGHT commun à la manche : les trois plans portent le même palier (déroulé dans l'événement bossFight). */
  bossFight: boolean;
  results: TripleResultEvent[];
}

/** Plan payé (= mode de la manche). Seul ce champ, `payoutMultiplier` et `finalWin` changent d'un mode à l'autre. */
export interface PickEvent {
  type: 'pick';
  slot: PlanSlot;
}

export type BookEvent = PresentationEvent | BossFightEvent | FinalWinEvent | TripleEvent | PickEvent;

export interface Book {
  id: number;
  payoutMultiplier: number;
  events: BookEvent[];
}
