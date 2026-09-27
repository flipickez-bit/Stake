/**
 * SPECIAL EPISODE « OFFICE MELTDOWN » (COLLECTION BOOK, COLLECTION_BOOK.md §F).
 * SHOWCASE / ENTERTAINMENT ONLY : aucune mise, aucun RGS, aucun payout, aucun chiffre. Ce n'est pas une manche.
 * Tableaux courts, rythmés par le joueur (« NEXT GAG »), qui réunissent tous les running gags.
 * Les tableaux réutilisent les segments des gadgets et de la bibliothèque : même moteur, même rendu.
 * PRODUCTION 3 GADGETS : l'épisode récompense l'exploration des 9 gadgets ; trois tableaux mettent donc en scène des
 * gadgets B/C, choisis pour leurs gags croisés (le tiroir actionne la trappe, le coffre allume la fusée).
 */
import type { ImpactTier } from '../presentation/compileSequence';
import type { BossReaction, GadgetDef, SegmentDef } from '../presentation/types';
import { anim, fx, seg, shake, silence, sound, state, tw } from './dsl';
import { ALL_GADGET_PROPS, GADGETS, gadgetById, gadgetFor } from './gadgets';
import { LIBRARY } from './library';

export interface ShowcaseBeat {
  id: string;
  /** Titre affiché par l'interface (pas dans la scène). */
  title: string;
  /** Scène du tableau : tous les accessoires visibles, disposition de repos du gadget principal. */
  stage: GadgetDef;
  segments: SegmentDef[];
}

/** Tous les accessoires des trois gadgets à la fois ; la disposition du gadget principal a le dernier mot. */
function stageFor(main: GadgetDef): GadgetDef {
  const layout: GadgetDef['layout'] = {};
  for (const g of GADGETS) {
    if (g === main) continue;
    for (const [id, rest] of Object.entries(g.layout)) if (id !== 'boss') layout[id] = rest;
  }
  // L'élastique n'est attaché à B.B. que dans le tableau du SLINGSHOT.
  if (main.rageLevel !== 'grumpy' && layout.slingPost) layout.slingPost = { ...layout.slingPost, states: { ...layout.slingPost.states, elastic: 'none' } };
  return { ...main, label: 'OFFICE MELTDOWN', props: [...ALL_GADGET_PROPS], layout: { ...layout, ...main.layout } };
}

const sling = gadgetFor('grumpy');
const trap = gadgetFor('furious');
const rocket = gadgetFor('unhinged');
const s = (g: GadgetDef, id: string): SegmentDef => {
  const found = g.segments[id] ?? LIBRARY.segments[id];
  if (!found) throw new Error(`OFFICE MELTDOWN : segment inconnu ${id}`);
  return found;
};

/**
 * Tableau tiré d'une VRAIE branche (tronc + modules + fin) : mêmes segments que dans une manche. Le choc est joué au
 * palier donné, la réaction « auto / away » est fixée (aucun hasard, aucun résultat : c'est un épisode sans mise).
 */
function fromBranch(gadgetId: string, branchId: string, tier: ImpactTier, reaction: BossReaction): { stage: GadgetDef; segments: SegmentDef[] } {
  const g = gadgetById(gadgetId);
  const b = g?.branches.find((x) => x.id === branchId);
  if (!g || !b) throw new Error(`OFFICE MELTDOWN : branche inconnue ${gadgetId}/${branchId}`);
  const steps = b.steps.flatMap((step): SegmentDef[] => {
    if ('seg' in step) return [s(g, step.seg)];
    if ('impact' in step) return [LIBRARY.impact(tier, step.impact)];
    if ('reaction' in step) return [LIBRARY.reaction(step.reaction === 'auto' || step.reaction === 'away' ? reaction : step.reaction, 1)];
    if ('silence' in step) return [seg(`SHOW_PAUSE_${step.silence}`, 'twist', step.silence, 'keep', [silence(0, step.silence)])];
    return [];
  });
  return { stage: stageFor(g), segments: [...g.trunk.map((id) => s(g, id)), ...steps] };
}

const INTRO = seg('SHOW_INTRO', 'setup', 1500, 'keep', [
  tw(0, 'camera', { x: 560, y: 350, sx: 0.95 }, 600, 'inOutQuad'),
  anim(0, 'boss', 'sip'), sound(420, 'sip'),
  anim(0, 'wendell', 'walk'), tw(0, 'wendell', { x: 1110 }, 700, 'outQuad'), anim(700, 'wendell', 'thumbsup'),
  anim(300, 'coo', 'fly'), tw(300, 'coo', { x: 560, y: 110 }, 600, 'inOutQuad'), anim(900, 'coo', 'salute'), sound(900, 'coo'),
  sound(1150, 'ding', 1.2), anim(1150, 'boss', 'lookcam'),
]);

/** Wendell se penche au bord de la trappe… et tombe aussi. */
const WENDELL_FALLS = seg('SHOW_WENDELL_FALLS', 'twist', 800, 'keep', [
  anim(0, 'wendell', 'run'), tw(0, 'wendell', { x: 720 }, 380, 'inQuad'), anim(380, 'wendell', 'peek'),
  anim(560, 'wendell', 'fall'), tw(560, 'wendell', { y: 800 }, 220, 'inQuad'), sound(560, 'fall', 1.3),
]);

/** DING : les portes s'ouvrent sur B.B. couvert de suie… et Wendell derrière lui. */
const BOTH_IN_ELEVATOR = seg('SHOW_BOTH_OUT', 'action', 900, 'keep', [
  tw(0, 'wendell', { x: 1040, y: 560 }, 1, 'linear'), anim(0, 'wendell', 'shrug'),
  state(0, 'boss', 'face=soot'), anim(0, 'boss', 'dazed'),
  tw(0, 'elevL', { sx: 0.08 }, 260, 'outQuad'), tw(0, 'elevR', { sx: 0.08 }, 260, 'outQuad'), sound(0, 'whoosh', 0.55),
  fx(60, 'smoke', 985, 470, 12), sound(300, 'hmpf'),
]);

/** FINALE : tout à la fois. Wendell au plafond, mousse, papiers, confettis, COO sur la tête, mug vide. */
const FINALE = seg('SHOW_FINALE', 'reaction', 3400, 'keep', [
  tw(0, 'boss', { x: 650, y: 560, rot: 0, alpha: 1, sx: 1, sy: 1, z: 0 }, 1, 'linear'), state(0, 'boss', 'seat=chair'), state(0, 'boss', 'face=soot'),
  tw(0, 'wendell', { x: 600, y: 250, rot: 0 }, 1, 'linear'), anim(0, 'wendell', 'stuck'), state(0, 'slingPost', 'elastic=snapped'),
  tw(0, 'camera', { x: 540, y: 340, sx: 0.92 }, 500, 'inOutQuad'),
  state(0, 'monitor', 'broken'), state(0, 'fan', 'broken'), state(0, 'window', 'broken'), state(0, 'cabinet', 'dented'), state(0, 'ceiling', 'hole'),
  silence(0, 500), anim(0, 'boss', 'dazed'),
  state(500, 'extinguisher', 'fired'), fx(520, 'foam', 600, 500, 30), sound(520, 'spray', 0.9),
  fx(900, 'papers', 650, 60, 40), sound(900, 'crash', 0.7), shake(900, 300, 5),
  anim(1300, 'coo', 'carry'), tw(1300, 'coo', { x: 656, y: 355 }, 500, 'inOutQuad'), sound(1500, 'coo'), anim(1800, 'coo', 'salute'),
  state(1900, 'boss', 'mug=empty'), anim(1900, 'boss', 'mugcheck'), sound(2050, 'hmpf', 1.3),
  anim(2500, 'boss', 'lookcam'), fx(2500, 'confetti', 520, 60, 40), sound(2500, 'cheer'), anim(2500, 'wendell', 'cheer'),
  tw(2500, 'camera', { x: 640, y: 380, sx: 1.12 }, 800, 'inOutQuad'),
]);

export const OFFICE_MELTDOWN: readonly ShowcaseBeat[] = [
  { id: 'intro', title: 'MONDAY, 9:00', stage: stageFor(sling), segments: [INTRO] },
  {
    id: 'slingshot',
    title: 'THE SLINGSHOT',
    stage: stageFor(sling),
    segments: [s(sling, 'SLG_IN'), s(sling, 'SLG_PULL'), s(sling, 'SLG_A_LAUNCH'), s(sling, 'SLG_E_CABINET'), LIBRARY.impact('T1', 'wall'), LIBRARY.reaction('DAZED', 1)],
  },
  {
    id: 'trapdoor',
    title: 'THE TRAPDOOR',
    stage: stageFor(trap),
    segments: [s(trap, 'TRP_IN'), s(trap, 'TRP_PULL'), s(trap, 'TRP_B_DROP'), WENDELL_FALLS, s(trap, 'ELEV_WAIT'), BOTH_IN_ELEVATOR],
  },
  {
    id: 'rocket',
    title: 'THE ROCKET',
    stage: stageFor(rocket),
    segments: [s(rocket, 'RKT_IN'), s(rocket, 'RKT_FUSE'), s(rocket, 'RKT_C_UP'), s(rocket, 'RKT_E_CEILING'), LIBRARY.impact('T2', 'ceiling'), LIBRARY.reaction('WENDELL_PEEK', 1)],
  },
  { id: 'espresso', title: 'THE ESPRESSO', ...fromBranch('espresso-blaster', 'ESP-S3', 'T2', 'WENDELL_PEEK') },
  { id: 'dominoes', title: 'THE DOMINOES', ...fromBranch('cabinet-domino', 'DOM-D3', 'T2', 'OFFICE_CHEER') },
  { id: 'safe', title: 'THE SAFE', ...fromBranch('ceiling-safe', 'SAFE-S3', 'T2', 'WENDELL_PEEK') },
  { id: 'finale', title: 'FINALE', stage: stageFor(sling), segments: [FINALE] },
];
