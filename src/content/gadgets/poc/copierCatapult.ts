/**
 * PLAN C · COPIER CATAPULT (GRUMPY) — PROTOTYPE du POC « 3 PLANS » (quelques branches, pas un gadget final).
 *
 * Tronc neutre : le joueur appuie sur le gros bouton vert ; la photocopieuse chauffe, tremble, crache une feuille.
 * Module commun (toutes les issues) : LE LANCER (le capot se relève d'un coup et catapulte la ramette en cloche).
 * Fins : on ne sait qu'à la retombée si la ramette revient sur la machine (bourrage), explose en pluie de copies
 * au-dessus d'un B.B. imperturbable, l'atteint (gain), déclenche l'avalanche (gros gain) ou frappe le mug (BOSS FIGHT).
 */
import type { GadgetDef } from '../../../presentation/types';
import { anim, BOSS_FIGHT, compose, fx, LOSS, mod, punch, seg, segments, shake, signal, sound, state, tw, WIN_ANY, WIN_BIG } from '../../dsl';
import { COP, PLAN_SCALE as S } from './stations';

const D1 = 'warmed-up';
const LAUNCH = mod('LAUNCH', { seg: 'COP_LAUNCH' });
const handsAway = (at: number) => tw(at, 'hands', { y: 1060 }, 220, 'inQuad');

/** Sommet commun de la cloche (identique dans toutes les fins : la divergence n'arrive qu'à la retombée). */
const APEX = { x: 700, y: 230 };
const RISE_MS = 300;
const FACE = { x: 632, y: 388 };
const MUG = { x: 600, y: 430 };

/** Retombée de la ramette depuis le sommet. */
const fall = (at: number, to: { x: number; y: number }, ms: number) => [
  tw(at, 'ream', { x: to.x, y: to.y }, ms, 'inQuad'), tw(at, 'ream', { rot: -3.4 }, ms, 'linear'),
];

export const copierCatapult: GadgetDef = {
  id: 'copier-catapult',
  label: 'COPIER CATAPULT',
  rageLevel: 'grumpy',
  layout: {
    boss: { transform: { x: 650, y: 560 }, states: { seat: 'chair', mug: 'normal', face: 'normal' }, anim: 'sip' },
    copier: { transform: { x: COP.body.x, y: COP.body.y, sx: S, sy: S }, states: { main: 'idle' } },
    copLid: { transform: { x: COP.lid.x, y: COP.lid.y, rot: 0, sx: S, sy: S } },
    copSheet: { transform: { x: COP.sheet.x, y: COP.sheet.y, sx: S, sy: S } },
    ream: { transform: { x: COP.ream.x, y: COP.ream.y, rot: 0, sx: S, sy: S } },
  },
  props: ['copier', 'copLid', 'copSheet', 'ream'],
  trunk: ['COP_IN', 'COP_WARM'],
  hold: { sound: 'clunk', everyMs: 650 },
  segments: segments([
    // ---------------------------------------------------------------- tronc (neutre, avant le résultat)
    seg('COP_IN', 'intro', 450, 'compress', [
      anim(0, 'hands', 'open'), tw(0, 'hands', { x: COP.button.x - 30, y: COP.button.y + 36 }, 360, 'outBack'),
      anim(0, 'boss', 'sip'), anim(360, 'hands', 'grab'), tw(360, 'hands', { y: COP.button.y + 44 }, 60, 'inQuad'), sound(380, 'click'),
      state(390, 'copier', 'scan'),
    ]),
    seg('COP_WARM', 'setup', 700, 'compress', [
      tw(0, 'copier', { sy: S * 0.97, sx: S * 1.02 }, 110, 'inOutQuad'), tw(110, 'copier', { sy: S * 1.02, sx: S * 0.99 }, 110, 'inOutQuad'),
      tw(220, 'copier', { sy: S * 0.97, sx: S * 1.02 }, 110, 'inOutQuad'), tw(330, 'copier', { sy: S, sx: S }, 160, 'outQuad'),
      tw(80, 'copSheet', { x: COP.sheet.x - 24 }, 180, 'outQuad'), tw(420, 'copSheet', { x: COP.sheet.x }, 160, 'inQuad'),
      tw(0, 'copLid', { rot: -0.06 }, 90, 'outQuad'), tw(90, 'copLid', { rot: 0 }, 90, 'inQuad'),
      tw(300, 'copLid', { rot: -0.08 }, 90, 'outQuad'), tw(390, 'copLid', { rot: 0 }, 90, 'inQuad'),
      sound(0, 'clunk'), sound(80, 'paper'), sound(300, 'clunk', 1.2), sound(420, 'paper', 1.2), fx(120, 'papers', COP.sheet.x - 40, COP.sheet.y - 10, 2),
      anim(200, 'boss', 'oblivious'), tw(0, 'camera', { x: 640, y: 380, sx: 1.05 }, 600, 'inOutQuad'),
    ]),

    // ---------------------------------------------------------------- module commun : LE LANCER
    seg('COP_LAUNCH', 'action', 340, 'compress', [
      anim(0, 'hands', 'open'), handsAway(30), state(0, 'copier', 'idle'),
      tw(0, 'copLid', { rot: -1.25 }, 70, 'outQuad'), tw(70, 'copLid', { rot: -1.05 }, 200, 'outElastic'),
      sound(0, 'snap'), sound(10, 'boing', 0.8), shake(0, 140, 3),
      tw(20, 'ream', { x: APEX.x, y: APEX.y }, RISE_MS, 'outQuad'), tw(20, 'ream', { rot: -2.4 }, RISE_MS, 'linear'),
      sound(40, 'whoosh', 1.2), fx(20, 'papers', COP.ream.x, COP.ream.y, 4), anim(120, 'boss', 'lookup'),
      tw(0, 'camera', { x: 620, y: 330, sx: 1.04 }, 320, 'outQuad'),
    ]),

    // ---------------------------------------------------------------- FINS (chacune contient la révélation)
    /** Perte : bourrage. La ramette retombe sur la machine, le capot claque, fumée. B.B. rit. */
    seg('COP_E_JAM', 'action', 950, 'compress', [
      ...fall(0, { x: COP.ream.x - 20, y: COP.ream.y }, 320),
      tw(300, 'copLid', { rot: 0 }, 60, 'inQuad'), sound(320, 'crash', 0.9), shake(320, 200, 4),
      state(330, 'copier', 'jam'), fx(340, 'smoke', COP.body.x, COP.body.y - 120, 8), fx(330, 'papers', COP.body.x, COP.body.y - 112, 10), sound(360, 'deflate'),
      tw(380, 'copSheet', { x: COP.sheet.x - 13, rot: 0.3 }, 120, 'outQuad'),
      anim(420, 'boss', 'laugh'), signal(460, 'reveal'), sound(480, 'laugh'),
      tw(400, 'camera', { x: 600, y: 360, sx: 1 }, 400, 'inOutQuad'),
    ]),
    /** Perte : la ramette éclate au-dessus de B.B. — pluie de copies ; il continue de siroter. */
    seg('COP_E_RAIN', 'action', 1000, 'compress', [
      tw(0, 'ream', { x: 650, y: 250 }, 180, 'linear'), tw(180, 'ream', { alpha: 0 }, 40, 'linear'),
      sound(180, 'paper'), fx(180, 'papers', 650, 250, 40), anim(200, 'boss', 'sip'),
      signal(520, 'reveal'), sound(600, 'sip'), sound(760, 'hmpf', 1.1),
      tw(200, 'camera', { x: 580, y: 360, sx: 1.06 }, 500, 'inOutQuad'),
    ]),
    /** Gain : la ramette retombe sur B.B. (reveal au contact, bibliothèque IMPACT). */
    seg('COP_E_HIT', 'action', 300, 'compress', [
      ...fall(0, FACE, 280), anim(120, 'boss', 'scared'), tw(290, 'ream', { alpha: 0 }, 10, 'linear'),
      fx(280, 'papers', FACE.x, FACE.y, 16), tw(0, 'camera', { x: 600, y: 380, sx: 1.1 }, 280, 'inQuad'),
    ]),
    /** Gros gain : la machine s'emballe (deux ramettes de plus, avalanche de copies), puis la ramette retombe sur B.B. */
    seg('COP_E_AVALANCHE', 'action', 900, 'compress', [
      state(0, 'copier', 'berserk'), shake(0, 420, 5),
      tw(0, 'copLid', { rot: 0 }, 60, 'inQuad'), tw(80, 'copLid', { rot: -1.2 }, 70, 'outQuad'), sound(80, 'snap', 1.2),
      tw(180, 'copLid', { rot: 0 }, 60, 'inQuad'), tw(260, 'copLid', { rot: -1.2 }, 70, 'outQuad'), sound(260, 'snap', 1.4),
      fx(100, 'papers', 760, 380, 30), fx(280, 'papers', 740, 360, 30), sound(300, 'paper', 0.8), anim(200, 'boss', 'scared'),
      ...fall(560, FACE, 320), tw(882, 'ream', { alpha: 0 }, 10, 'linear'), fx(880, 'papers', FACE.x, FACE.y, 40),
      tw(300, 'camera', { x: 600, y: 360, sx: 1.12 }, 560, 'inOutQuad'),
    ]),
    /** BOSS FIGHT : la ramette frappe le mug… qui devient DORÉ. */
    seg('COP_E_GOLD', 'twist', 700, 'compress', [
      ...fall(0, MUG, 280), tw(282, 'ream', { alpha: 0 }, 10, 'linear'), sound(280, 'tink', 1.2), punch(280, 180, 4),
      fx(280, 'papers', MUG.x, MUG.y, 12), state(320, 'boss', 'mug=gold'), sound(340, 'gold'), fx(340, 'gold', MUG.x, MUG.y - 10, 18),
      anim(380, 'boss', 'furious'), tw(300, 'camera', { x: 560, y: 360, sx: 1.08 }, 300, 'outQuad'),
    ]),
  ]),
  branches: [
    compose('COP-L1', 'Bourrage', [LAUNCH], [{ seg: 'COP_E_JAM' }], { categories: ['BACKFIRE', 'CLEAN_MISS'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('COP-L2', 'Pluie de copies', [LAUNCH], [{ seg: 'COP_E_RAIN' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('COP-W1', 'Ramette', [LAUNCH], [{ seg: 'COP_E_HIT' }, { impact: 'overdesk' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('COP-W2', 'Avalanche', [LAUNCH], [{ seg: 'COP_E_AVALANCHE' }, { impact: 'overdesk' }, { reaction: 'auto' }], { categories: ['DIRECT', 'COMEBACK', 'CHAIN', 'SUPER'], classes: WIN_BIG, rarity: 'COMMON', d1: D1 }),
    compose('COP-BF', 'Copie dorée', [LAUNCH], [{ seg: 'COP_E_GOLD' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'COMMON', d1: D1 }),
  ],
};
