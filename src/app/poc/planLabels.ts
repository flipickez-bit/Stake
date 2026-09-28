/**
 * POC « 3 PLANS » : libellés affichés. Texte volontairement NEUTRE : aucune formule de regret
 * (voir tests/unit/poc3Ui.test.ts : liste des expressions interdites).
 */
import { gadgetById } from '../../content/gadgets';
import { planGadgetId, type PlanSlot } from '../../domain/plans';
import type { RageLevelId } from '../../domain/types';

export function planLabel(level: RageLevelId, slot: PlanSlot): string {
  const id = planGadgetId(level, slot);
  return (id && gadgetById(id)?.label) || `PLAN ${slot}`;
}

/** PRODUCTION : plus aucun plan prototype (conservé pour compatibilité des composants). */
export function isPrototypePlan(_level: RageLevelId, _slot: PlanSlot): boolean {
  return false;
}

export const COPY = {
  pick: 'PICK A PLAN',
  yourPlan: 'YOUR PLAN',
  otherPlan: 'OTHER PLAN',
  reveal: 'REVEAL OTHER PLANS',
  /** Sous-titre du bouton : les deux autres plans, dans l'ordre de l'écran (« See what plans A and C held »). */
  revealSub: (slots: readonly string[]) => (slots.length === 2 ? `See what plans ${slots[0]} and ${slots[1]} held` : 'See what the other plans held'),
  /** PLAYTEST #3 : indication unique après la première manche. */
  hint: 'See what the other plans held',
  panelTitle: 'THIS ROUND · 3 PLANS',
  replay: (slot: string) => `REPLAY PLAN ${slot}`,
  choose: 'CHOOSE ANOTHER PLAN',
  hide: 'HIDE',
  prototype: 'PROTOTYPE',
  /** Formulation de l'étude (§1.2, sens faible tant que Stake n'a pas répondu à Q23). */
  note: 'The three results are drawn together, from the same table whatever the plan. Only YOUR PLAN is played and paid.',
} as const;
