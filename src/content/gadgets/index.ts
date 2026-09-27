import { PLAN_SLOTS, POC_PLAN_SETS, type PlanSlot } from '../../domain/plans';
import type { RageLevelId } from '../../domain/types';
import type { ActorId, ActorRest, GadgetDef } from '../../presentation/types';
import { OFFICE_LAYOUT } from '../office';
import { officeRocket } from './officeRocket';
import { copierCatapult } from './poc/copierCatapult';
import { espressoBlaster } from './poc/espressoBlaster';
import { swivelSlingshot } from './swivelSlingshot';
import { trapdoorExpress } from './trapdoorExpress';

/** MVP : un gadget par Rage Level (affectation validée, TECH_ARCHITECTURE.md §2.5, décision D-GADGET en attente). */
export const GADGETS: readonly GadgetDef[] = [swivelSlingshot, trapdoorExpress, officeRocket];

/**
 * Version du contenu joué, enregistrée dans chaque session de playtest pour comparer les sessions
 * (P05-A = 12 branches de la Phase 0 ; P05-B = variété V2 ; P05-C = mêmes branches + COLLECTION BOOK).
 */
export const CONTENT_VERSION = `P05-C · ${GADGETS.reduce((n, g) => n + g.branches.length, 0)} branches + collection`;

export function gadgetFor(level: RageLevelId): GadgetDef {
  const g = GADGETS.find((x) => x.rageLevel === level);
  if (!g) throw new Error(`Aucun gadget pour ${level}`);
  return g;
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

/**
 * POC « 3 PLANS » (MOCK / DEV) : prototypes des plans B et C de GRUMPY. Hors de GADGETS : ils ne comptent ni dans le
 * contenu de production, ni dans la collection, ni dans les audits de variété du jeu normal.
 */
export const POC_GADGETS: readonly GadgetDef[] = [espressoBlaster, copierCatapult];

export function gadgetById(id: string): GadgetDef | null {
  return GADGETS.find((g) => g.id === id) ?? POC_GADGETS.find((g) => g.id === id) ?? null;
}

/** Les trois gadgets des plans A, B, C d'un Rage Level (null si le niveau n'a pas de plans). */
export function planGadgets(level: RageLevelId): readonly [GadgetDef, GadgetDef, GadgetDef] | null {
  const ids = POC_PLAN_SETS[level];
  if (!ids) return null;
  const gadgets = ids.map((id) => gadgetById(id));
  if (gadgets.some((g) => !g || g.rageLevel !== level)) throw new Error(`Plans de ${level} : gadget manquant`);
  return gadgets as unknown as [GadgetDef, GadgetDef, GadgetDef];
}

/** Gadget d'un plan (ou le gadget du niveau hors plans). */
export function gadgetForPlan(level: RageLevelId, plan: PlanSlot | null | undefined): GadgetDef {
  const set = plan ? planGadgets(level) : null;
  return set ? set[PLAN_SLOTS.indexOf(plan!)]! : gadgetFor(level);
}

const pickerCache = new Map<RageLevelId, GadgetDef>();

/**
 * Décor du CHOIX (READY) : les trois plans sont physiquement présents dans le bureau, chacun à sa place.
 * Aucune branche : ce « gadget » ne sert qu'au repos. Au tir, seul le gadget choisi reste.
 */
export function pickerGadget(level: RageLevelId): GadgetDef | null {
  const set = planGadgets(level);
  if (!set) return null;
  const cached = pickerCache.get(level);
  if (cached) return cached;
  const layout: Record<ActorId, ActorRest> = {};
  for (const g of set) for (const [id, rest] of Object.entries(g.layout)) layout[id] = { ...layout[id], ...rest };
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
export const ALL_GADGET_PROPS: readonly ActorId[] = [...GADGETS, ...POC_GADGETS].flatMap((g) => g.props);
