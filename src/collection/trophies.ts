/**
 * TROPHÉES VISIBLES de la collection (docs/PROPOSITION_RECOMPENSES_VISUELLES.md) : ce que le joueur VOIT à chaque manche.
 *
 * - HALL OF SHAME : une photo par animation découverte, accrochée au mur dans l'ordre des découvertes ;
 * - cicatrices du bureau : une par gadget dès sa première découverte ;
 * - B.B. porte les marques : une blessure cartoon par gadget « TUNED » (niveau 1) ;
 * - gadgets de légende : 4 niveaux par gadget selon SES découvertes (STANDARD, TUNED, NEON, LEGENDARY) ;
 * - étapes du bureau : aux jalons (enseigne, plaintes RH, rubalise, bureau condamné, plaques 100 %, plaque EX-BOSS).
 *
 * RENDU SEULEMENT : fonction pure de l'état de la collection. Aucune valeur d'argent, aucune influence sur un résultat,
 * une branche, une durée ou un cue. Jamais d'or (l'or est le signal du BOSS FIGHT).
 */
import type { RageLevelId } from '../domain/types';
import type { BranchRarity } from '../presentation/types';
import type { Catalog, CardId, CollectionState, MilestoneId, SectionId } from './types';

/** 0 STANDARD · 1 TUNED · 2 NEON · 3 LEGENDARY. */
export type GadgetTier = 0 | 1 | 2 | 3;
export const TIER_NAMES: Record<GadgetTier, string> = { 0: 'STANDARD', 1: 'TUNED', 2: 'NEON', 3: 'LEGENDARY' };
/** Découvertes AVEC CE GADGET (toutes ses cartes, BOSS FIGHT compris) pour atteindre chaque niveau. */
export const TIER_AT: readonly [0, number, number, number] = [0, 3, 6, 10];

export type InjuryId = 'bandaid' | 'stain' | 'papercut' | 'headwrap' | 'blackeye' | 'cast' | 'singed' | 'bump' | 'brace';

/** Blessure laissée par chaque gadget (au niveau TUNED). Slapstick de dessin animé, jamais réaliste. */
export const INJURY_BY_GADGET: Readonly<Record<string, InjuryId>> = {
  'swivel-slingshot': 'bandaid',
  'espresso-blaster': 'stain',
  'copier-catapult': 'papercut',
  'trapdoor-express': 'headwrap',
  'cabinet-domino': 'blackeye',
  'cooler-bowling': 'cast',
  'office-rocket': 'singed',
  'ceiling-safe': 'bump',
  'hvac-hurricane': 'brace',
};

export const INJURY_LABEL: Record<InjuryId, string> = {
  bandaid: 'PLASTER ON THE FOREHEAD',
  stain: 'COFFEE ON THE SHIRT',
  papercut: 'PAPER CUT',
  headwrap: 'HEAD BANDAGE',
  blackeye: 'BLACK EYE',
  cast: 'ARM IN A CAST',
  singed: 'SINGED TUFT',
  bump: 'BUMP ON THE HEAD',
  brace: 'NECK BRACE',
};

export interface HallPhoto {
  cardId: CardId;
  gadgetId: string;
  level: RageLevelId;
  section: SectionId;
  rarity: BranchRarity;
}

export interface OfficeStage {
  /** 10 découvertes : enseigne HALL OF SHAME. */
  hallSign: boolean;
  /** 25 découvertes : pile de plaintes RH. */
  hrBoxes: boolean;
  /** 50 % : rubalise et « DAYS WITHOUT INCIDENT: 0 ». */
  caution: boolean;
  /** OFFICE MELTDOWN : bureau condamné, néons qui grésillent. */
  condemned: boolean;
  /** Sections complètes (plaques 100 % au mur). */
  fullSections: SectionId[];
  /** 100 % de la collection : le bureau de B.B. devient le tien (plaque EX-BOSS). */
  exBoss: boolean;
}

export interface TrophyState {
  photos: HallPhoto[];
  tiers: Record<string, GadgetTier>;
  /** Gadgets qui ont marqué le bureau (au moins une découverte). */
  scars: string[];
  injuries: InjuryId[];
  stage: OfficeStage;
}

export const EMPTY_TROPHIES: TrophyState = {
  photos: [],
  tiers: {},
  scars: [],
  injuries: [],
  stage: { hallSign: false, hrBoxes: false, caution: false, condemned: false, fullSections: [], exBoss: false },
};

export function tierFor(discoveredWithGadget: number): GadgetTier {
  return discoveredWithGadget >= TIER_AT[3] ? 3 : discoveredWithGadget >= TIER_AT[2] ? 2 : discoveredWithGadget >= TIER_AT[1] ? 1 : 0;
}

const has = (state: CollectionState, id: MilestoneId) => state.milestones[id] !== undefined;

/** Trophées d'un état de collection (null : collection désactivée → rien). Fonction pure. */
export function trophiesFrom(state: CollectionState | null, catalog: Catalog): TrophyState {
  if (!state) return EMPTY_TROPHIES;
  const found = catalog.cards.filter((c) => state.entries[c.id] !== undefined);
  // Ordre des découvertes (date, puis ordre du catalogue) : la plus récente est accrochée en dernier.
  const photos = found
    .map((c) => ({ c, at: state.entries[c.id]!.firstSeenAt }))
    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.c.order - b.c.order))
    .map(({ c }) => ({ cardId: c.id, gadgetId: c.gadgetId, level: c.level, section: c.section, rarity: c.rarity }));
  const perGadget = new Map<string, number>();
  for (const c of found) perGadget.set(c.gadgetId, (perGadget.get(c.gadgetId) ?? 0) + 1);
  const gadgets = [...new Set(catalog.cards.map((c) => c.gadgetId))];
  const tiers: Record<string, GadgetTier> = {};
  for (const g of gadgets) tiers[g] = tierFor(perGadget.get(g) ?? 0);
  const scars = gadgets.filter((g) => (perGadget.get(g) ?? 0) > 0);
  const injuries = gadgets.filter((g) => tiers[g]! >= 1 && INJURY_BY_GADGET[g]).map((g) => INJURY_BY_GADGET[g]!);
  const fullSections = catalog.sections.filter((s) => s.total > 0 && found.filter((c) => c.section === s.id).length >= s.total).map((s) => s.id);
  return {
    photos,
    tiers,
    scars,
    injuries,
    stage: {
      hallSign: has(state, 'count-10'),
      hrBoxes: has(state, 'count-25'),
      caution: has(state, 'half'),
      condemned: has(state, 'explorer'),
      fullSections,
      exBoss: has(state, 'full-mvp'),
    },
  };
}

/** Ce qui vient d'apparaître (pour la mise en scène « nouveau trophée » après la manche). */
export type TrophyUnlock =
  | { kind: 'photo'; photo: HallPhoto }
  | { kind: 'scar'; gadgetId: string }
  | { kind: 'injury'; injury: InjuryId; gadgetId: string }
  | { kind: 'tier'; gadgetId: string; tier: GadgetTier }
  | { kind: 'stage'; stage: keyof Omit<OfficeStage, 'fullSections'> | `full:${SectionId}` };

export function trophyUnlocks(prev: TrophyState, next: TrophyState): TrophyUnlock[] {
  const out: TrophyUnlock[] = [];
  const seen = new Set(prev.photos.map((p) => p.cardId));
  for (const p of next.photos) if (!seen.has(p.cardId)) out.push({ kind: 'photo', photo: p });
  for (const g of next.scars) if (!prev.scars.includes(g)) out.push({ kind: 'scar', gadgetId: g });
  for (const [g, t] of Object.entries(next.tiers)) {
    if (t > (prev.tiers[g] ?? 0)) {
      out.push({ kind: 'tier', gadgetId: g, tier: t });
      const injury = INJURY_BY_GADGET[g];
      if (injury && t >= 1 && (prev.tiers[g] ?? 0) < 1) out.push({ kind: 'injury', injury, gadgetId: g });
    }
  }
  for (const k of ['hallSign', 'hrBoxes', 'caution', 'condemned', 'exBoss'] as const) if (next.stage[k] && !prev.stage[k]) out.push({ kind: 'stage', stage: k });
  for (const s of next.stage.fullSections) if (!prev.stage.fullSections.includes(s)) out.push({ kind: 'stage', stage: `full:${s}` });
  return out;
}
