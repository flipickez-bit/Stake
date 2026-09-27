/**
 * PLAN C · HVAC HURRICANE (UNHINGED) — gadget de PRODUCTION (15 branches).
 * La bouche d'aération du mur du fond et son thermostat : le joueur tourne le cadran à fond.
 * UNHINGED : ventilation, fenêtres, plafond, objets qui volent — slapstick, jamais de blessure.
 * Signature sonore : WHIRR qui monte, GUST, RATTLE de la grille, SWIRL (papiers).
 *
 * Tronc neutre : la main tourne le cadran jusqu'au MAX ; la grille claque, des papiers s'envolent ; B.B. sirote.
 * DÉBUTS VISIBLES (chacun mène à des pertes ET à des gains) :
 *   GUST    : un souffle droit sur B.B. : il s'agrippe à son fauteuil-fusée, qui recule.
 *   WENDELL : Wendell traverse la rafale avec une pile de dossiers.
 *   TORNADO : l'air s'enroule en mini-tornade, qui traverse la pièce vers B.B.
 *   ORBIT   : l'écran et la plante se mettent à tourner autour de lui.
 *   SUCK    : à l'envers ! La bouche ASPIRE tout.
 */
import type { GadgetDef, SegmentDef } from '../../../presentation/types';
import { anim, BOSS_FIGHT, compose, fx, impactFrame, LOSS, mod, paced, seg, segments, shake, signal, silence, sound, state, tw, WIN_ANY, WIN_BIG, WIN_MID } from '../../dsl';
import { bb, cam, coo, wendell, wobble } from '../../kit';
import { HVAC } from '../stations';
import { UNHINGED_DECOR } from './decor';

const D1 = 'max';
const V = HVAC.vent;
const T = HVAC.thermo;
const MUG = { x: 604, y: 432 };
const FLOOR = 560;

/** Traînées de vent le long d'une ligne (de → vers), en `n` bouffées. */
const gustLine = (at: number, from: { x: number; y: number }, to: { x: number; y: number }, n = 4, step = 90) =>
  Array.from({ length: n }, (_, i) => fx(at + i * step, 'swirl', from.x + ((to.x - from.x) * (i + 1)) / (n + 1), from.y + ((to.y - from.y) * (i + 1)) / (n + 1), 6));

const GUST = mod('GUST', { seg: 'HVAC_GUST' });
const WENDELL = mod('WENDELL', { seg: 'HVAC_T_WENDELL' });
const TORNADO = mod('TORNADO', { seg: 'HVAC_TORNADO' });
const ORBIT = mod('ORBIT', { seg: 'HVAC_T_ORBIT' });
const SUCK = mod('SUCK', { seg: 'HVAC_SUCK' });

const SEGMENTS: SegmentDef[] = [
  // ---------------------------------------------------------------- tronc (neutre)
  seg('HVAC_IN', 'intro', 450, 'compress', [
    anim(0, 'hands', 'open'), tw(0, 'hands', { x: T.x + 10, y: T.y + 36 }, 360, 'outBack'), anim(360, 'hands', 'turn'), sound(380, 'click'),
    anim(0, 'boss', 'sip'),
  ]),
  seg('HVAC_CRANK', 'setup', 700, 'compress', [
    tw(0, 'thermoNeedle', { rot: 1.2 }, 600, 'inOutQuad'), sound(0, 'crank', 0.9), sound(200, 'crank', 1.0), sound(400, 'crank', 1.1),
    sound(100, 'whirr', 0.8), ...wobble(200, 'vent', 0, 0.03, 6, 70), fx(300, 'papers', V.x, V.y + 40, 4), sound(320, 'rattle', 1.2),
    anim(220, 'boss', 'oblivious'), tw(0, 'camera', { x: 520, y: 340, sx: 1.05 }, 600, 'inOutQuad'),
  ]),

  // ---------------------------------------------------------------- DÉBUTS
  /** Une rafale droit sur B.B. : il s'agrippe, son fauteuil-fusée recule, la plante se couche. */
  seg('HVAC_GUST', 'action', 680, 'compress', [
    tw(0, 'hands', { y: 1060 }, 220, 'inQuad'), state(0, 'vent', 'open'), sound(0, 'gust'), sound(260, 'gust', 1.1),
    ...gustLine(0, V, { x: 650, y: 420 }, 5, 100), fx(80, 'papers', 520, 380, 14),
    anim(120, 'boss', 'braced'), tw(120, 'boss', { x: 690 }, 440, 'outQuad'), tw(60, 'plant', { rot: 0.28 }, 300, 'outQuad'),
    tw(0, 'camera', { x: 560, y: 380, sx: 1.04 }, 500, 'inOutQuad'),
  ]),
  /** L'air s'enroule en mini-tornade qui grandit sous la grille et traverse la pièce vers B.B. */
  seg('HVAC_TORNADO', 'action', 820, 'compress', [
    tw(0, 'hands', { y: 1060 }, 220, 'inQuad'), state(0, 'vent', 'open'), sound(0, 'whirr', 1.2), sound(200, 'gust', 0.9),
    tw(0, 'twister', { x: V.x, y: FLOOR, alpha: 0.9, sx: 0.4, sy: 0.4 }, 1, 'linear'), tw(2, 'twister', { sx: 0.9, sy: 0.9 }, 320, 'outBack'),
    tw(320, 'twister', { x: 590 }, 500, 'inOutQuad'), fx(100, 'swirl', V.x, 480, 10), fx(400, 'papers', 520, 460, 16), fx(600, 'swirl', 590, 440, 10),
    tw(200, 'plant', { rot: -0.4 }, 300, 'outQuad'), anim(420, 'boss', 'panic'),
    tw(0, 'camera', { x: 560, y: 360, sx: 1.04 }, 600, 'inOutQuad'),
  ]),
  /** À l'envers : la grille ASPIRE. Papiers happés, la plante penche, le fauteuil de B.B. glisse vers le mur. */
  seg('HVAC_SUCK', 'action', 760, 'compress', [
    tw(0, 'hands', { y: 1060 }, 220, 'inQuad'), state(0, 'vent', 'open'), sound(0, 'deflate', 0.6), sound(100, 'gust', 0.7),
    ...gustLine(60, { x: 650, y: 420 }, V, 5, 100), fx(200, 'papers', 560, 420, 10),
    tw(80, 'plant', { rot: 0.35 }, 300, 'outQuad'), anim(160, 'boss', 'braced'), tw(160, 'boss', { x: 610 }, 500, 'inQuad'),
    tw(0, 'camera', { x: 540, y: 370, sx: 1.04 }, 500, 'inOutQuad'),
  ]),

  // ---------------------------------------------------------------- TWISTS
  /** Wendell traverse la rafale, les bras chargés de dossiers ; il avance penché, les papiers s'arrachent. */
  paced(0.85, seg('HVAC_T_WENDELL', 'twist', 900, 'compress', [
    ...wendell.walkIn(0, 540, 520), anim(520, 'wendell', 'push'), fx(560, 'papers', 540, 440, 16), sound(560, 'paper', 1.2),
    sound(620, 'tension'), anim(300, 'boss', 'smirk'), tw(0, 'camera', { x: 600, y: 380, sx: 1.04 }, 600, 'inOutQuad'),
  ])),
  /** Autour de lui, l'écran et la plante se mettent à tourner (orbite). */
  paced(0.85, seg('HVAC_T_ORBIT', 'twist', 900, 'compress', [
    tw(0, 'monitor', { x: 760, y: 320, rot: 1.2 }, 220, 'outQuad'), tw(220, 'monitor', { x: 560, y: 240, rot: 2.6 }, 220, 'inOutQuad'),
    tw(440, 'monitor', { x: 520, y: 400, rot: 3.8 }, 220, 'inOutQuad'), tw(660, 'monitor', { x: 700, y: 300, rot: 5 }, 220, 'inOutQuad'),
    tw(0, 'plant', { x: 540, y: 420, rot: 1.5 }, 300, 'outQuad'), tw(300, 'plant', { x: 760, y: 260, rot: 3 }, 300, 'inOutQuad'), tw(600, 'plant', { x: 600, y: 200, rot: 4.5 }, 300, 'inOutQuad'),
    sound(0, 'whoosh', 0.8), sound(300, 'whoosh', 1.0), sound(600, 'whoosh', 1.2), fx(200, 'swirl', 650, 330, 8), fx(500, 'swirl', 650, 330, 8),
    anim(100, 'boss', 'confused'), tw(0, 'twister', { x: 650, sx: 1.1, sy: 1.1 }, 400, 'outQuad'),
    tw(0, 'camera', { x: 640, y: 320, sx: 1 }, 500, 'inOutQuad'),
  ])),

  // ---------------------------------------------------------------- FINS
  /** PERTE : la rafale tombe ; il se recoiffe, rajuste sa cravate. */
  seg('HVAC_E_HOLD', 'action', 600, 'compress', [
    state(0, 'vent', 'closed'), sound(0, 'deflate'), tw(0, 'plant', { rot: 0 }, 400, 'outElastic'), tw(0, 'boss', { x: 650 }, 400, 'inOutQuad'),
    anim(120, 'boss', 'tiefix'), signal(240, 'reveal'), sound(260, 'hmpf', 1.1), tw(0, 'camera', { x: 620, y: 380, sx: 1.08 }, 400, 'inOutQuad'),
  ]),
  /** GAIN : la rafale redouble : il part en arrière et s'écrase contre son propre bureau. */
  seg('HVAC_E_SLIDE', 'action', 320, 'compress', [
    sound(0, 'gust', 1.3), ...gustLine(0, V, { x: 700, y: 420 }, 3, 60), tw(0, 'boss', { x: 740, rot: -0.2 }, 300, 'inQuad'), anim(60, 'boss', 'scared'),
    tw(0, 'camera', { x: 680, y: 400, sx: 1.1 }, 300, 'inQuad'),
  ]),
  /**
   * GROS GAIN (mise en scène) : les volets de la grille claquent grand ouverts, un temps de silence, puis la rafale
   * soulève B.B. ET son fauteuil-fusée : il traverse la pièce en l'air et finit contre l'ascenseur (ralenti, gel).
   */
  seg('HVAC_E_WALLOP', 'action', 780, 'compress', [
    sound(0, 'whirr', 1.6), ...wobble(0, 'vent', 0, 0.06, 4, 50), silence(200, 160), ...cam.push(0, 520, 340, 1.14, 300, 'inQuad'),
    ...impactFrame(360, 30, 40), sound(360, 'gust', 1.4), sound(360, 'boom', 1.1), shake(360, 300, 8), ...gustLine(360, V, { x: 900, y: 420 }, 5, 50),
    ...bb.airborne(380, { x: 960, y: 520 }, 380, 300, { rot: 1.2 }), anim(560, 'boss', 'lookcam'), ...cam.slowmo(540, 140, 0.4),
    tw(360, 'camera', { x: 780, y: 380, sx: 1.08 }, 420, 'inOutQuad'),
  ]),
  /** PERTE (BACKFIRE) : c'est Wendell que la rafale emporte… droit dans l'ascenseur, qui se referme. B.B. rit. */
  seg('HVAC_E_WBLOWN', 'action', 900, 'compress', [
    sound(0, 'gust', 1.2), anim(0, 'wendell', 'fall'), tw(0, 'elevL', { sx: 0.08 }, 160, 'outQuad'), tw(0, 'elevR', { sx: 0.08 }, 160, 'outQuad'),
    tw(40, 'wendell', { x: 985, y: 520, rot: 1.2 }, 380, 'inQuad'), fx(60, 'papers', 700, 420, 20), tw(420, 'wendell', { y: 560, rot: 0 }, 1, 'linear'),
    tw(460, 'elevL', { sx: 1 }, 140, 'inQuad'), tw(460, 'elevR', { sx: 1 }, 140, 'inQuad'), sound(600, 'clunk'), sound(640, 'bell'),
    signal(480, 'reveal'), anim(520, 'boss', 'laugh'), sound(540, 'laugh'), tw(0, 'camera', { x: 760, y: 380, sx: 1.04 }, 420, 'inOutQuad'),
  ]),
  /** GAIN (CHAIN) : les dossiers de Wendell font voile : la rafale le projette sur B.B. */
  seg('HVAC_E_WSAIL', 'action', 360, 'compress', [
    sound(0, 'gust', 1.3), anim(0, 'wendell', 'fall'), tw(0, 'wendell', { x: 630, rot: 0.6 }, 300, 'inQuad'), fx(40, 'papers', 560, 420, 20),
    anim(160, 'boss', 'scared'), tw(0, 'camera', { x: 620, y: 400, sx: 1.1 }, 300, 'inQuad'),
  ]),
  /** PERTE : la tornade le contourne et s'essouffle, en lui laissant une pluie de papiers sur la tête. */
  seg('HVAC_E_PASS', 'action', 900, 'compress', [
    tw(0, 'twister', { x: 800 }, 420, 'inOutQuad'), tw(300, 'twister', { alpha: 0, sx: 0.3, sy: 0.3 }, 300, 'inQuad'), sound(0, 'whirr', 0.9),
    anim(100, 'boss', 'duck'), fx(420, 'papers', 650, 360, 26), sound(440, 'paper'), signal(480, 'reveal'),
    anim(560, 'boss', 'recover'), tw(0, 'plant', { rot: 0 }, 500, 'outElastic'), tw(0, 'camera', { x: 640, y: 370, sx: 1.06 }, 400, 'inOutQuad'),
  ]),
  /** GAIN : la tornade l'avale, le fait tourner… et le recrache au sol. */
  seg('HVAC_E_LIFT', 'action', 640, 'compress', [
    tw(0, 'twister', { x: 650 }, 160, 'inQuad'), anim(160, 'boss', 'spin'), sound(160, 'spin'), tw(160, 'boss', { y: 400 }, 260, 'outQuad'),
    tw(420, 'boss', { y: 560 }, 180, 'inQuad'), tw(420, 'twister', { alpha: 0 }, 200), sound(430, 'whoosh', 1.2),
    tw(0, 'camera', { x: 640, y: 380, sx: 1.08 }, 500, 'inOutQuad'),
  ]),
  /** GROS GAIN : la tornade l'aspire et le propulse en vrille à travers le plafond (ralenti, image d'impact). */
  seg('HVAC_E_CEILING', 'action', 760, 'compress', [
    tw(0, 'twister', { x: 650, sx: 1.3, sy: 1.3 }, 200, 'inQuad'), anim(180, 'boss', 'spin'), sound(180, 'spin', 1.3), sound(200, 'whirr', 1.6),
    tw(200, 'boss', { y: 380 }, 280, 'outQuad'), silence(460, 120), ...cam.slowmo(460, 140, 0.4),
    tw(560, 'boss', { y: 150 }, 200, 'inQuad'), sound(560, 'whoosh', 0.8), tw(560, 'twister', { alpha: 0 }, 200),
    tw(0, 'camera', { x: 640, y: 300, sx: 1.04 }, 600, 'inOutQuad'),
  ]),
  /** BOSS FIGHT : la tornade s'illumine d'OR et lui rend son mug… doré. */
  seg('HVAC_E_GOLDNADO', 'twist', 900, 'compress', [
    tw(0, 'twister', { x: 640 }, 200, 'inQuad'), silence(200, 200), fx(200, 'gold', 640, 460, 24), sound(220, 'gold'),
    tw(200, 'glow', { x: 640, y: 440, alpha: 0.85 }, 300, 'outQuad'), state(500, 'boss', 'mug=gold'), tw(500, 'twister', { alpha: 0 }, 200),
    anim(540, 'boss', 'furious'), tw(740, 'glow', { alpha: 0 }, 140), tw(0, 'camera', { x: 620, y: 380, sx: 1.06 }, 500, 'inOutQuad'),
  ]),
  /**
   * VERY RARE (perte) : au ralenti, l'écran et la plante reviennent EXACTEMENT à leur place. La tornade s'éteint.
   * B.B. hoche la tête, satisfait ; le COO applaudit (B.B.).
   */
  seg('HVAC_E_REPLACE', 'action', 1500, 'compress', [
    ...cam.slowmo(0, 700, 0.45), tw(0, 'monitor', { x: 770, y: 436, rot: 6.2832 }, 600, 'inOutQuad'), tw(0, 'plant', { x: 322, y: 560, rot: 6.2832 }, 700, 'inOutQuad'),
    tw(0, 'twister', { alpha: 0, sx: 0.2, sy: 0.2 }, 600, 'inQuad'), sound(600, 'thump', 1.3), sound(700, 'thump', 1.1), silence(700, 300),
    signal(760, 'reveal'), tw(760, 'monitor', { rot: 0 }, 1, 'linear'), tw(760, 'plant', { rot: 0 }, 1, 'linear'),
    anim(800, 'boss', 'smug'), sound(820, 'hmpf', 1.2), ...coo.flyTo(900, { x: 700, y: 330 }, 300), anim(1200, 'coo', 'applaud'),
    ...cam.recover(1000, 400),
  ]),
  /** GAIN (CHAIN) : l'écran, puis la plante, lui arrivent dessus l'un après l'autre. */
  seg('HVAC_E_PELT', 'action', 440, 'compress', [
    tw(0, 'monitor', { x: 660, y: 380, rot: 6.2 }, 180, 'inQuad'), sound(180, 'bonk'), tw(200, 'plant', { x: 640, y: 420, rot: 6 }, 200, 'inQuad'), sound(400, 'thump'),
    anim(180, 'boss', 'ouch'), tw(200, 'twister', { alpha: 0 }, 200), tw(0, 'camera', { x: 650, y: 380, sx: 1.1 }, 400, 'inQuad'),
  ]),
  /** PERTE (TEASE) : son mug lui échappe vers la grille… s'arrête en l'air. Il le rattrape, et boit. */
  seg('HVAC_E_MUG', 'action', 900, 'compress', [
    state(0, 'boss', 'mug=none'), tw(0, 'mugProp', { x: MUG.x, y: MUG.y, alpha: 1, rot: 0 }, 1, 'linear'),
    tw(2, 'mugProp', { x: 520, y: 380, rot: -1 }, 260, 'outQuad'), sound(0, 'whoosh', 1.5), silence(262, 260), state(262, 'vent', 'closed'),
    anim(300, 'boss', 'catch'), tw(420, 'mugProp', { x: MUG.x, y: MUG.y, rot: 0 }, 160, 'inQuad'), state(582, 'boss', 'mug=normal'), tw(582, 'mugProp', { alpha: 0 }, 40),
    signal(560, 'reveal'), sound(600, 'clink', 1.1), anim(640, 'boss', 'smug'), tw(0, 'camera', { x: 580, y: 380, sx: 1.1 }, 400, 'inOutQuad'),
  ]),
  /** GAIN : la bouche l'aspire à travers la pièce, face la première contre la grille. */
  seg('HVAC_E_FACE', 'action', 380, 'compress', [
    sound(0, 'gust', 0.8), anim(0, 'boss', 'airborne'), tw(0, 'boss', { x: V.x + 30, y: V.y + 150, rot: -0.3 }, 340, 'inQuad'), sound(20, 'whoosh', 1.2),
    tw(0, 'camera', { x: 520, y: 340, sx: 1.12 }, 340, 'inQuad'),
  ]),
  /** RARE (perte) : c'est le COO qui est aspiré… et recraché, tout gris de poussière. B.B. rit. */
  seg('HVAC_E_COO', 'action', 1000, 'compress', [
    anim(0, 'coo', 'escape'), tw(0, 'coo', { x: V.x, y: V.y }, 300, 'inQuad'), sound(0, 'coo', 1.6), tw(300, 'coo', { alpha: 0 }, 40),
    silence(340, 260), sound(560, 'pfft', 0.7), fx(560, 'smoke', V.x, V.y + 20, 10), tw(560, 'coo', { alpha: 1, x: 540, y: 470 }, 260, 'outQuad'),
    anim(600, 'coo', 'shock'), signal(620, 'reveal'), anim(660, 'boss', 'laugh'), sound(680, 'laugh'),
    tw(0, 'camera', { x: 540, y: 380, sx: 1.06 }, 400, 'inOutQuad'),
  ]),
  /** BOSS FIGHT : la bouche tousse une lueur DORÉE qui file jusqu'au mug de B.B. */
  seg('HVAC_E_GOLDVENT', 'twist', 800, 'compress', [
    silence(0, 220), sound(120, 'pfft', 0.6), fx(140, 'gold', V.x, V.y + 20, 16), sound(160, 'gold'),
    tw(140, 'glow', { x: 520, y: 380, alpha: 0.85 }, 300, 'outQuad'), tw(440, 'glow', { x: MUG.x, y: MUG.y }, 200, 'inQuad'),
    state(640, 'boss', 'mug=gold'), anim(660, 'boss', 'furious'), tw(700, 'glow', { alpha: 0 }, 100), tw(0, 'camera', { x: 560, y: 380, sx: 1.06 }, 400, 'inOutQuad'),
  ]),
];

export const hvacHurricane: GadgetDef = {
  id: 'hvac-hurricane',
  label: 'HVAC HURRICANE',
  rageLevel: 'unhinged',
  layout: {
    ...UNHINGED_DECOR,
    vent: { transform: { x: V.x, y: V.y }, states: { main: 'closed' } },
    thermo: { transform: { x: T.x, y: T.y } },
    thermoNeedle: { transform: { x: T.x, y: T.y, rot: -1.2 } },
    twister: { transform: { x: V.x, y: FLOOR, alpha: 0 } },
  },
  props: ['vent', 'thermo', 'thermoNeedle', 'twister'],
  trunk: ['HVAC_IN', 'HVAC_CRANK'],
  hold: { sound: 'whirr', everyMs: 800 },
  signature: ['whirr', 'gust', 'rattle', 'crank'],
  bfProjectiles: ['monitor', 'plane', 'keyboard'],
  pick: {
    layer: 'room',
    box: { x: V.x - 76, y: V.y - 56, w: T.x - V.x + 110, h: 116 },
    spot: { x: V.x, y: FLOOR - 2, sx: 0.9 },
    idle: [
      { actor: 'thermoNeedle', prop: 'rot', amp: 0.18, periodMs: 520 },
      { actor: 'vent', prop: 'y', amp: 1.5, periodMs: 140 },
    ],
  },
  segments: segments(SEGMENTS),
  branches: [
    compose('HVAC-G1', 'Tenir bon', [GUST], [{ seg: 'HVAC_E_HOLD' }, { reaction: 'SIP' }], { categories: ['CLEAN_MISS', 'TEASE', 'BACKFIRE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('HVAC-G2', 'Contre son bureau', [GUST], [{ seg: 'HVAC_E_SLIDE' }, { impact: 'overdesk' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('HVAC-G3', 'Vol plané', [GUST], [{ seg: 'HVAC_E_WALLOP' }, { impact: 'elevator' }, { reaction: 'OFFICE_CHEER' }], { categories: ['DIRECT', 'COMEBACK', 'CHAIN', 'SUPER'], classes: WIN_BIG, rarity: 'COMMON', d1: D1 }),
    compose('HVAC-W1', 'Wendell s\'envole', [GUST, WENDELL], [{ seg: 'HVAC_E_WBLOWN' }], { categories: ['BACKFIRE', 'TEASE'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('HVAC-W2', 'Wendell à la voile', [GUST, WENDELL], [{ seg: 'HVAC_E_WSAIL' }, { impact: 'none' }, { reaction: 'auto' }], { categories: ['CHAIN', 'COMEBACK', 'DIRECT', 'GRAZE'], classes: WIN_ANY, rarity: 'UNCOMMON', d1: D1 }),
    compose('HVAC-T1', 'La tornade passe', [TORNADO], [{ seg: 'HVAC_E_PASS' }, { reaction: 'SIP' }], { categories: ['CLEAN_MISS', 'TEASE', 'BACKFIRE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('HVAC-T2', 'Essorage', [TORNADO], [{ seg: 'HVAC_E_LIFT' }, { impact: 'floor' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('HVAC-T3', 'Le toit', [TORNADO], [{ seg: 'HVAC_E_CEILING' }, { impact: 'ceiling' }, { reaction: 'away' }], { categories: ['CHAIN', 'SUPER', 'COMEBACK', 'DIRECT'], classes: WIN_BIG, rarity: 'UNCOMMON', d1: D1 }),
    compose('HVAC-T4', 'Tornade dorée', [TORNADO], [{ seg: 'HVAC_E_GOLDNADO' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'COMMON', d1: D1 }),
    compose('HVAC-O1', 'Tout en place', [TORNADO, ORBIT], [{ seg: 'HVAC_E_REPLACE' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'VERY_RARE', d1: D1 }),
    compose('HVAC-O2', 'Bombardement', [TORNADO, ORBIT], [{ seg: 'HVAC_E_PELT' }, { impact: 'none' }, { reaction: 'auto' }], { categories: ['CHAIN', 'COMEBACK', 'DIRECT'], classes: WIN_MID, rarity: 'VERY_RARE', d1: D1 }),
    compose('HVAC-S1', 'Le mug s\'envole', [SUCK], [{ seg: 'HVAC_E_MUG' }], { categories: ['TEASE', 'CLEAN_MISS'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('HVAC-S2', 'Face contre la grille', [SUCK], [{ seg: 'HVAC_E_FACE' }, { impact: 'vent' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK', 'CHAIN'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('HVAC-S3', 'Le COO aspiré', [SUCK], [{ seg: 'HVAC_E_COO' }], { categories: ['BACKFIRE', 'TEASE'], classes: LOSS, rarity: 'RARE', d1: D1 }),
    compose('HVAC-S4', 'Souffle doré', [SUCK], [{ seg: 'HVAC_E_GOLDVENT' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'UNCOMMON', d1: D1 }),
  ],
};
