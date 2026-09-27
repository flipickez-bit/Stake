import { PLAN_SETS, PLAN_SLOTS, type PlanSlot } from '../../domain/plans';
import type { RageLevelId } from '../../domain/types';
import type { ActorId, ActorRest, GadgetDef } from '../../presentation/types';
import { OFFICE_LAYOUT } from '../office';
import { cabinetDomino } from './furious/cabinetDomino';
import { coolerBowling } from './furious/coolerBowling';
import { trapdoorExpress } from './furious/trapdoorExpress';
import { copierCatapult } from './grumpy/copierCatapult';
import { espressoBlaster } from './grumpy/espressoBlaster';
import { swivelSlingshot } from './grumpy/swivelSlingshot';
import { ceilingSafe } from './unhinged/ceilingSafe';
import { hvacHurricane } from './unhinged/hvacHurricane';
import { officeRocket } from './unhinged/officeRocket';

/**
 * PRODUCTION 3 GADGETS : tous les gadgets jouables, par Rage Level (plans A, B, C ; PLAN_SETS).
 * Chaque gadget appartient à un seul Rage Level ; ses branches sont des cartes du COLLECTION BOOK.
 */
export const GADGETS: readonly GadgetDef[] = [swivelSlingshot, espressoBlaster, copierCatapult, trapdoorExpress, cabinetDomino, coolerBowling, officeRocket, ceilingSafe, hvacHurricane];

/**
 * Mode CLASSIQUE (un gadget par Rage Level : Stake tant que A2 n'est pas confirmée, `?plans=off`) : le gadget
 * historique de chaque niveau (plan A).
 */
export const CLASSIC_GADGETS: Readonly<Record<RageLevelId, GadgetDef>> = { grumpy: swivelSlingshot, furious: trapdoorExpress, unhinged: officeRocket };

/**
 * Version du contenu joué, enregistrée dans chaque session de playtest pour comparer les sessions
 * (P05-C = 3 gadgets + collection ; P3 = production 3 gadgets par Rage Level).
 */
export const CONTENT_VERSION = `P3 · ${GADGETS.length} gadgets · ${GADGETS.reduce((n, g) => n + g.branches.length, 0)} branches`;

/** Gadget du mode classique (un par niveau). */
export function gadgetFor(level: RageLevelId): GadgetDef {
  return CLASSIC_GADGETS[level];
}

/** Disposition de repos complète (bureau + surcharges du gadget). */
export function restLayout(gadget: GadgetDef): Record<ActorId, ActorRest> {
  const out: Record<ActorId, ActorRest> = {};
  for (const [id, rest] of Object.entries(OFFICE_LAYOUT)) out[id] = { ...rest, transform: { ...rest.transform }, states: { ...rest.states } };
  for (const [id, rest] of Object.entries(gadget.layout)) {
    const base = out[id] ?? {};
    out[id] = { ...base, ...rest, transform: { ...base.transform, ...rest.transform }, states: { ...base.states, ...rest.states } };
  }
  return out;
}

/** Compatibilité POC : plus aucun gadget hors production. */
export const POC_GADGETS: readonly GadgetDef[] = [];

export function gadgetById(id: string): GadgetDef | null {
  return GADGETS.find((g) => g.id === id) ?? null;
}

/** Gadgets d'un Rage Level (dans l'ordre des plans). */
export function gadgetsOf(level: RageLevelId): GadgetDef[] {
  return PLAN_SETS[level].map((id) => gadgetById(id)).filter((g): g is GadgetDef => g !== null);
}

/**
 * Les trois gadgets des plans A, B, C d'un Rage Level. null si le niveau n'a pas encore ses trois gadgets
 * (le niveau se joue alors en mode classique).
 */
export function planGadgets(level: RageLevelId): readonly [GadgetDef, GadgetDef, GadgetDef] | null {
  const gadgets = PLAN_SETS[level].map((id) => gadgetById(id));
  if (gadgets.some((g) => !g)) return null;
  if (gadgets.some((g) => g!.rageLevel !== level)) throw new Error(`Plans de ${level} : gadget d'un autre niveau`);
  return gadgets as unknown as [GadgetDef, GadgetDef, GadgetDef];
}

/** Rage Levels jouables avec le choix A/B/C (les trois gadgets existent). */
export function planReadyLevels(): RageLevelId[] {
  return (['grumpy', 'furious', 'unhinged'] as const).filter((l) => planGadgets(l) !== null);
}

/** Gadget d'un plan (ou le gadget du niveau hors plans). */
export function gadgetForPlan(level: RageLevelId, plan: PlanSlot | null | undefined): GadgetDef {
  const set = plan ? planGadgets(level) : null;
  return set ? set[PLAN_SLOTS.indexOf(plan!)]! : gadgetFor(level);
}

const pickerCache = new Map<RageLevelId, GadgetDef>();

/**
 * Décor du CHOIX (READY) : les trois gadgets sont physiquement présents dans le bureau, chacun à sa place.
 * Aucune branche : ce « gadget » ne sert qu'au repos. Au tir, seul le gadget choisi reste.
 * B.B. garde la pose de repos du plan A (le gadget historique du niveau).
 */
export function pickerGadget(level: RageLevelId): GadgetDef | null {
  const set = planGadgets(level);
  if (!set) return null;
  const cached = pickerCache.get(level);
  if (cached) return cached;
  const layout: Record<ActorId, ActorRest> = {};
  for (const g of [...set].reverse()) for (const [id, rest] of Object.entries(g.layout)) layout[id] = { ...layout[id], ...rest };
  // Pendant le choix, l'élastique du lance-pierre pend au poteau (sinon il traverserait les autres plans jusqu'à B.B.).
  const post = layout.slingPost;
  if (post) layout.slingPost = { ...post, states: { ...post.states, elastic: 'slack' } };
  const picker: GadgetDef = {
    id: 'plan-picker',
    label: 'PLANS',
    rageLevel: level,
    layout,
    props: set.flatMap((g) => g.props),
    trunk: [],
    hold: set[0].hold,
    branches: [],
    segments: {},
  };
  pickerCache.set(level, picker);
  return picker;
}

/** Tous les accessoires propres à un gadget (masqués quand un autre gadget est actif). */
export const ALL_GADGET_PROPS: readonly ActorId[] = GADGETS.flatMap((g) => g.props);
