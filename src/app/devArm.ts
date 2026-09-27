/**
 * DEV (Mock RGS seulement) : armer une VRAIE manche qui jouera une branche donnée (triple imposé, plan choisi,
 * branche imposée au Presenter). Partagé par le DEV PANEL (BRANCH FINDER) et le crochet de test `forceBranch`.
 */
import { planForBranch } from '../dev/forceBranch';
import type { RageLevelId, ResultClass } from '../domain/types';
import type { PlanSlot } from '../domain/plans';
import type { GameFlow } from '../flow/GameFlow';
import type { MockServer } from '../platform/rgs/mock/MockServer';
import type { Presenter } from '../presenter/Presenter';

export interface ArmedBranch {
  level: RageLevelId;
  slot: PlanSlot;
  resultClass: ResultClass | 'BOSS_FIGHT';
}

export function armBranch(
  deps: { flow: GameFlow; presenter: Presenter; mock: MockServer | null },
  gadgetId: string,
  branchId: string,
  prefer?: ResultClass,
): ArmedBranch | null {
  const { flow, presenter, mock } = deps;
  if (!mock || flow.snapshot.state !== 'READY') return null;
  const plan = planForBranch(gadgetId, branchId, prefer);
  if (!plan) return null;
  flow.setLevel(plan.level);
  if (!flow.snapshot.plansEnabled) return null;
  if (!flow.setPlan(plan.slot) && flow.snapshot.plan !== plan.slot) return null;
  mock.update((st) => (st.nextForcedTriple = plan.triple));
  presenter.forceBranchId = branchId;
  return { level: plan.level, slot: plan.slot, resultClass: plan.resultClass };
}
