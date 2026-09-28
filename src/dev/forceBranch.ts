/**
 * DEV (MockRGS seulement) : préparer une VRAIE manche qui jouera une branche donnée d'un gadget donné.
 * Le triple du prochain Play est imposé (le plan du gadget reçoit un multiplicateur de la bonne classe, les autres
 * plans x0), le script du book est choisi compatible avec la branche, puis la branche est imposée au Presenter.
 * Sert au DEV PANEL (recherche gadget / branche), aux captures et aux tests e2e. Jamais en mode Stake.
 */
import policy from '../../config/presentation_policy.json';
import { gadgetById } from '../content/gadgets';
import { PLAN_SETS, PLAN_SLOTS, type PlanSlot } from '../domain/plans';
import { classify } from '../domain/resultClass';
import type { RageLevelId, ResultClass, Script } from '../domain/types';
import { distributionTable } from '../platform/rgs/mock/mockMath';
import type { ForcedTriple } from '../platform/rgs/mock/tripleMath';
import type { BranchDef } from '../presentation/types';

const SCRIPTS = policy.scripts_by_class as Record<ResultClass, Partial<Record<Script, number>>>;

/** Multiplicateur (×100) représentatif d'une classe dans un Rage Level (médiane des lignes de la classe), ou null. */
export function multiplierFor(level: RageLevelId, cls: ResultClass): number | null {
  if (cls === 'MISS') return 0;
  const rows = distributionTable(level).filter((r) => !r.bossFight && r.multiplier100 > 0 && classify(r.multiplier100) === cls);
  if (rows.length === 0) return null;
  return rows[Math.floor((rows.length - 1) / 2)]!.multiplier100;
}

export interface ForcedBranchPlan {
  level: RageLevelId;
  slot: PlanSlot;
  triple: ForcedTriple;
  branch: BranchDef;
  resultClass: ResultClass | 'BOSS_FIGHT';
}

/**
 * Prépare le triple imposé et le plan pour jouer `branchId` de `gadgetId`. `prefer` : classe de résultat voulue
 * (sinon la première que le Rage Level sait produire). null si la branche est introuvable ou injouable dans ce niveau.
 */
export function planForBranch(gadgetId: string, branchId: string, prefer?: ResultClass): ForcedBranchPlan | null {
  const g = gadgetById(gadgetId);
  const b = g?.branches.find((x) => x.id === branchId);
  if (!g || !b) return null;
  const level = g.rageLevel;
  const index = PLAN_SETS[level].indexOf(g.id);
  if (index < 0) return null;
  const slot = PLAN_SLOTS[index]!;
  if (b.categories.includes('BF_ENTRY')) {
    return { level, slot, triple: { kind: 'bossFight', hits: 4 }, branch: b, resultClass: 'BOSS_FIGHT' };
  }
  const order = prefer && b.classes.includes(prefer) ? [prefer, ...b.classes] : b.classes;
  for (const cls of order) {
    const m100 = multiplierFor(level, cls);
    if (m100 === null) continue;
    const script = b.categories.find((s) => (SCRIPTS[cls]?.[s] ?? 0) > 0) ?? null;
    if (!script) continue;
    const multipliers: [number, number, number] = [0, 0, 0];
    multipliers[index] = m100 / 100;
    const scripts: (Script | null)[] = [null, null, null];
    scripts[index] = script;
    return { level, slot, triple: { kind: 'multipliers', multipliers, scripts }, branch: b, resultClass: cls };
  }
  return null;
}
