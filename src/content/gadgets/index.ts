import type { RageLevelId } from '../../domain/types';
import type { ActorId, ActorRest, GadgetDef } from '../../presentation/types';
import { OFFICE_LAYOUT } from '../office';
import { officeRocket } from './officeRocket';
import { swivelSlingshot } from './swivelSlingshot';
import { trapdoorExpress } from './trapdoorExpress';

/**
 * Version du contenu joué, enregistrée dans chaque session de playtest pour comparer les sessions
 * (A = 12 branches de la Phase 0 ; les versions suivantes l'incrémentent).
 */
export const CONTENT_VERSION = 'P05-A · 12 branches';

/** MVP : un gadget par Rage Level (affectation validée, TECH_ARCHITECTURE.md §2.5, décision D-GADGET en attente). */
export const GADGETS: readonly GadgetDef[] = [swivelSlingshot, trapdoorExpress, officeRocket];

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

/** Tous les accessoires propres à un gadget (masqués quand un autre gadget est actif). */
export const ALL_GADGET_PROPS: readonly ActorId[] = GADGETS.flatMap((g) => g.props);
