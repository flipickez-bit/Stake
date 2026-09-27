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

/** Les plans B et C du POC ne sont que des prototypes visuels (quelques branches). */
export function isPrototypePlan(level: RageLevelId, slot: PlanSlot): boolean {
  return planGadgetId(level, slot) !== 'swivel-slingshot';
}

export const COPY = {
  pick: 'PICK A PLAN',
  yourPlan: 'YOUR PLAN',
  otherPlan: 'OTHER PLAN',
  reveal: 'REVEAL OTHER PLANS',
  hide: 'HIDE',
  prototype: 'PROTOTYPE',
  /** Formulation de l'étude (§1.2, sens faible tant que Stake n'a pas répondu à Q23). */
  note: 'The three results are drawn together, from the same table whatever the plan. Only YOUR PLAN is played and paid.',
} as const;
