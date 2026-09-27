/**
 * Mécanique expérimentale « 3 PLANS » (POC, docs/ETUDE_CHOIX_3_GADGETS.md, architecture A2).
 *
 * Le joueur choisit un plan (A, B ou C) AVANT le tir. Le choix est envoyé avec la mise : il fait partie du mode
 * de `play` (candidat Stake : `grumpy_a`, `grumpy_b`, `grumpy_c`). Le book tiré contient le TRIPLE complet
 * (les trois résultats, tirés ensemble dans une table identique quel que soit le choix) ; seul le résultat du
 * plan choisi est payé et joué.
 *
 * STATUT : MOCK / DEV UNIQUEMENT. Neuf modes, ids et poids partagés, affichage de résultats non joués :
 * INFORMATION STAKE ENGINE REQUISE (Q21–Q29). Les maths de production ne sont pas modifiées. En mode Stake, les
 * plans restent désactivés (un gadget par Rage Level, comportement historique) tant que Stake n'a pas répondu.
 */
import type { RageLevelId } from './types';

export type PlanSlot = 'A' | 'B' | 'C';
export const PLAN_SLOTS: readonly PlanSlot[] = ['A', 'B', 'C'];

export function isPlanSlot(value: unknown): value is PlanSlot {
  return value === 'A' || value === 'B' || value === 'C';
}

/** Nom de mode A2 (candidat, non validé par Stake : Q21). */
export function planModeName(level: RageLevelId, slot: PlanSlot): string {
  return `${level}_${slot.toLowerCase()}`;
}

/** `grumpy_b` → { grumpy, B } ; tout autre nom → null. */
export function parsePlanMode(mode: string): { level: RageLevelId; slot: PlanSlot } | null {
  const m = /^(grumpy|furious|unhinged)_([abc])$/.exec(mode);
  if (!m) return null;
  return { level: m[1] as RageLevelId, slot: (m[2] ?? 'a').toUpperCase() as PlanSlot };
}

/** Modèle joint retenu par l'étude : positions indépendantes, BOSS FIGHT commun à la manche. */
export const TRIPLE_MODEL = 'IND_BFC_v1';

/**
 * Gadgets de chaque plan, par Rage Level (PRODUCTION 3 GADGETS : les trois niveaux). Simples identifiants : le
 * serveur les écrit dans le book pour que le client sache quel gadget porte chaque résultat. Ils ne changent
 * aucune probabilité. Le plan A est le gadget historique du niveau (celui du mode classique, un gadget par niveau).
 */
export const PLAN_SETS: Readonly<Record<RageLevelId, readonly [string, string, string]>> = {
  grumpy: ['swivel-slingshot', 'espresso-blaster', 'copier-catapult'],
  furious: ['trapdoor-express', 'cabinet-domino', 'cooler-bowling'],
  unhinged: ['office-rocket', 'ceiling-safe', 'hvac-hurricane'],
};

/** Compatibilité (POC) : même table. */
export const POC_PLAN_SETS: Partial<Record<RageLevelId, readonly [string, string, string]>> = PLAN_SETS;

export function planGadgetId(level: RageLevelId, slot: PlanSlot): string | null {
  const set = PLAN_SETS[level];
  return set ? (set[PLAN_SLOTS.indexOf(slot)] ?? null) : null;
}

/** Ce que la manche dit des trois plans (lu dans le book, immuable). */
export interface PlanResult {
  readonly slot: PlanSlot;
  readonly gadgetId: string;
  readonly multiplier100: number;
  readonly bossFight: boolean;
}

export interface OutcomePlans {
  /** Plan choisi AVANT le tir, confirmé par le serveur (mode de la manche). Immuable après Play. */
  readonly selected: PlanSlot;
  readonly selectedGadget: string;
  readonly model: string;
  /** Les trois résultats, dans l'ordre A, B, C. */
  readonly results: readonly PlanResult[];
}
