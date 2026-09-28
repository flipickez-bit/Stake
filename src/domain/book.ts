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

/**
 * Un tour gratuit du BOSS FIGHT. HIT : gain = base × rage (écrêté au plafond du niveau) ; BLOCKED : 0.
 * `variant` : projectile du gadget (cosmétique, ne change aucun gain).
 */
export interface FreeRoundEvent {
  result: 'HIT' | 'BLOCKED';
  /** Base tirée (entier ×100), 0 si BLOCKED. */
  base100: number;
  /** Rage de ce tour (x1 au premier tour, +1 après chaque HIT). */
  rage: number;
  /** Gain de ce tour (entier ×100). */
  win100: number;
  variant: number;
}

/**
 * BOSS FIGHT = TOURS GRATUITS joués dans la MÊME manche que la mise qui les déclenche : un seul book, un seul Play,
 * un seul payoutMultiplier (modèle des free spins Stake Engine : jeu sans état, chaque mise indépendante).
 * Tout le déroulé est écrit par la génération mathématique ; le client ne tire rien.
 */
export interface BossFightEvent {
  type: 'bossFight';
  /** Tours gratuits accordés (8). Moins de tours joués seulement si le plafond est atteint. */
  freeRounds: number;
  rounds: FreeRoundEvent[];
  /** Plafond du niveau (max win, entier ×100) atteint : le bonus s'arrête là. */
  wincap: boolean;
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
  /** BOSS FIGHT commun à la manche : les trois plans portent les mêmes tours gratuits (déroulé dans l'événement bossFight). */
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
