/**
 * PLAN C · WATER COOLER BOWLING (FURIOUS) — gadget de PRODUCTION (15 branches).
 * Une rampe de bowling sur le bureau du joueur ; la boule, c'est la bonbonne de la fontaine à eau. Elle roule du
 * bureau du joueur jusqu'aux pieds de B.B. (elle rapetisse en s'éloignant : profondeur 2.5D).
 * Signature sonore : ROLL (grondement), GULP (glouglou), STRIKE (quilles), SPLASH.
 *
 * Tronc neutre : la main place la bonbonne en haut de la rampe, prend son élan ; B.B. tape du pied.
 * DÉBUTS VISIBLES (chacun mène à des pertes ET à des gains) :
 *   STRAIGHT : la bonbonne dévale la rampe et file droit sur B.B.
 *   PAUSE    : elle s'arrête à mi-chemin… glouglou… elle oscille.
 *   HOOK     : elle part à gauche, puis tourne (effet !) vers B.B.
 *   WENDELL  : Wendell traverse la piste, les bras chargés de dossiers.
 *   BURST    : le bouchon saute : la bonbonne devient une fusée à eau qui zigzague dans le bureau.
 */
import type { GadgetDef, SegmentDef } from '../../../presentation/types';
import { anim, BOSS_FIGHT, compose, fx, impactFrame, LOSS, mod, paced, seg, segments, shake, signal, silence, sound, state, tw, WIN_ANY, WIN_BIG, WIN_MID, WIN_SMALL } from '../../dsl';
import { bb, cam, props, wendell } from '../../kit';
import { COOLER, FRONT_DY, PLAN_SCALE as S } from '../stations';
import { FURIOUS_DECOR, FURIOUS_WORLD_PROPS } from './decor';

const D1 = 'wound-up';

// ------------------------------------------------------------------ piste (monde)
/** Haut et bas de la rampe (la bonbonne y repose, puis la dévale). */
const TOP = { x: COOLER.ramp.x + 54, y: COOLER.ramp.y - 86 + FRONT_DY };
const LOW = { x: COOLER.ramp.x - 66, y: COOLER.ramp.y - 50 + FRONT_DY };
/** Au sol de la pièce, en s'éloignant (z : profondeur ; plus loin = plus petit). */
const MID = { x: 690, y: 596, z: 140 };
const FEET = { x: 668, y: 548, z: 280 };
const SHIN = { x: 652, y: 530 };

/** La bonbonne roule vers un point (rotation proportionnelle au trajet). */
const roll = (at: number, to: { x: number; y: number; z?: number }, ms: number, turns: number, ease: 'linear' | 'inQuad' | 'outQuad' = 'linear') => [
  tw(at, 'jug', { x: to.x, y: to.y, ...(to.z !== undefined ? { z: to.z } : {}) }, ms, ease),
  tw(at, 'jug', { rot: -6.2832 * turns }, ms, 'linear'),
];

const STRAIGHT = mod('STRAIGHT', { seg: 'BWL_STRAIGHT' });
const PAUSE = mod('PAUSE', { seg: 'BWL_T_PAUSE' });
const HOOK = mod('HOOK', { seg: 'BWL_HOOK' });
const WENDELL = mod('WENDELL', { seg: 'BWL_T_WENDELL' });
const BURST = mod('BURST', { seg: 'BWL_BURST' });

const SEGMENTS: SegmentDef[] = [
  // ---------------------------------------------------------------- tronc (neutre)
  seg('BWL_IN', 'intro', 450, 'compress', [
    anim(0, 'hands', 'open'), tw(0, 'hands', { x: TOP.x + 10, y: TOP.y + 64 }, 360, 'outBack'), anim(360, 'hands', 'grab'), sound(380, 'gulp', 0.8),
    anim(0, 'boss', 'tapfoot'),
  ]),
  seg('BWL_WINDUP', 'setup', 700, 'compress', [
    anim(0, 'hands', 'roll'), tw(0, 'hands', { x: TOP.x + 40 }, 400, 'inOutQuad'), tw(0, 'jug', { x: TOP.x + 30, rot: 0.4 }, 400, 'inOutQuad'),
    tw(400, 'hands', { x: TOP.x + 20 }, 240, 'inOutQuad'), tw(400, 'jug', { x: TOP.x + 14, rot: 0.1 }, 240, 'inOutQuad'),
    sound(0, 'gulp', 0.7), sound(300, 'squeak', 0.9), sound(520, 'gulp', 0.9), fx(200, 'water', TOP.x + 30, TOP.y - 24, 2),
    anim(260, 'boss', 'blink'), tw(0, 'camera', { x: 660, y: 420, sx: 1.05 }, 600, 'inOutQuad'),
  ]),

  // ---------------------------------------------------------------- DÉBUTS
  /** Elle dévale la rampe, saute du bureau et file droit sur B.B. (grondement). */
  seg('BWL_STRAIGHT', 'action', 620, 'compress', [
    anim(0, 'hands', 'open'), tw(0, 'hands', { y: 1060 }, 240, 'inQuad'),
    ...roll(0, LOW, 200, 0.8, 'inQuad'), sound(0, 'roll'), sound(210, 'thump', 1.2),
    ...roll(210, MID, 220, 0.9), ...roll(430, { x: 680, y: 566, z: 230 }, 190, 0.7),
    anim(300, 'boss', 'lookdown'), tw(100, 'camera', { x: 650, y: 440, sx: 1.08 }, 500, 'inOutQuad'),
  ]),
  /** Elle part à gauche… et tourne vers B.B. (effet), en glougloutant. */
  seg('BWL_HOOK', 'action', 820, 'compress', [
    anim(0, 'hands', 'open'), tw(0, 'hands', { y: 1060 }, 240, 'inQuad'),
    ...roll(0, LOW, 200, 0.8, 'inQuad'), sound(0, 'roll'), sound(210, 'thump', 1.2),
    ...roll(210, { x: 560, y: 600, z: 150 }, 300, 1.1, 'outQuad'), sound(300, 'gulp', 1.2),
    ...roll(510, { x: 600, y: 562, z: 250 }, 310, 0.8, 'inQuad'), anim(380, 'boss', 'confused'),
    tw(100, 'camera', { x: 600, y: 440, sx: 1.06 }, 600, 'inOutQuad'),
  ]),
  /** Le bouchon saute : fusée à eau, elle zigzague dans le bureau en crachant. */
  seg('BWL_BURST', 'action', 820, 'compress', [
    anim(0, 'hands', 'open'), tw(0, 'hands', { y: 1060 }, 240, 'inQuad'),
    ...roll(0, LOW, 200, 0.8, 'inQuad'), sound(0, 'roll'), sound(200, 'pfft', 1.6), sound(210, 'spray'),
    tw(210, 'jug', { x: 520, y: 420, z: 120 }, 200, 'outQuad'), tw(410, 'jug', { x: 760, y: 330, z: 200 }, 200, 'inOutQuad'), tw(610, 'jug', { x: 600, y: 300, z: 220 }, 210, 'inOutQuad'),
    tw(210, 'jug', { rot: -9 }, 610, 'linear'), fx(220, 'water', 600, 520, 10), fx(420, 'water', 520, 420, 10), fx(620, 'water', 760, 330, 10),
    sound(420, 'whoosh', 1.4), sound(620, 'whoosh', 1.2), anim(250, 'boss', 'panic'),
    tw(100, 'camera', { x: 620, y: 380, sx: 1.02 }, 600, 'inOutQuad'),
  ]),

  // ---------------------------------------------------------------- TWISTS
  /** Elle s'arrête à mi-chemin. Glouglou. Elle oscille… Silence. */
  paced(0.85, seg('BWL_T_PAUSE', 'twist', 900, 'compress', [
    tw(0, 'jug', { x: 676, y: 572, rot: -2.4 }, 200, 'outQuad'), sound(200, 'gulp', 1.1), silence(200, 500),
    tw(300, 'jug', { rot: -2.2 }, 150, 'inOutQuad'), tw(450, 'jug', { rot: -2.5 }, 150, 'inOutQuad'), tw(600, 'jug', { rot: -2.35 }, 150, 'inOutQuad'),
    sound(700, 'gulp', 0.9), anim(300, 'boss', 'smirk'), tw(0, 'camera', { x: 660, y: 480, sx: 1.14 }, 500, 'inOutQuad'),
  ])),
  /** Wendell traverse la piste, les bras chargés de dossiers. */
  paced(0.85, seg('BWL_T_WENDELL', 'twist', 900, 'compress', [
    ...wendell.walkIn(0, 710, 520), anim(540, 'wendell', 'carry'), sound(560, 'paper', 1.2),
    tw(0, 'jug', { x: 620, y: 556, z: 260, rot: -9.5 }, 520, 'linear'), sound(20, 'roll', 1.1), sound(620, 'tension'),
    anim(300, 'boss', 'lookback'), tw(0, 'camera', { x: 660, y: 430, sx: 1.06 }, 600, 'inOutQuad'),
  ])),

  // ---------------------------------------------------------------- FINS
  /** PERTE : B.B. saute par-dessus ; la bonbonne file s'écraser contre le grand classeur. Il rit. */
  seg('BWL_E_HOP', 'action', 900, 'compress', [
    anim(0, 'boss', 'hop'), ...roll(0, { x: 180, y: 556, z: 280 }, 520, 2.2), sound(0, 'roll', 1.2),
    signal(300, 'reveal'), sound(520, 'clang', 0.9), sound(520, 'splash'), fx(520, 'water', 150, 470, 18), state(520, 'cabinet', 'dented'),
    anim(420, 'boss', 'laugh'), sound(440, 'laugh'), tw(200, 'camera', { x: 520, y: 400, sx: 1.02 }, 500, 'inOutQuad'),
  ]),
  /** PERTE (TEASE) : il la bloque du pied, la soulève… et boit au goulot. Deux gorgées. */
  seg('BWL_E_STOP', 'action', 1000, 'compress', [
    ...roll(0, FEET, 160, 0.4, 'outQuad'), anim(80, 'boss', 'push'), sound(160, 'thump', 1.3),
    tw(260, 'jug', { x: 640, y: 440, rot: 3.14, z: 280 }, 260, 'outQuad'), anim(280, 'boss', 'drink'), signal(320, 'reveal'),
    sound(540, 'gulp'), sound(720, 'gulp', 1.1), anim(860, 'boss', 'smug'), sound(880, 'hmpf'),
    tw(0, 'camera', { x: 640, y: 440, sx: 1.12 }, 400, 'inOutQuad'),
  ]),
  /** GAIN : STRIKE ! En plein dans les tibias : B.B. fait un tour complet et retombe à plat. */
  seg('BWL_E_STRIKE', 'action', 460, 'compress', [
    ...roll(0, SHIN, 140, 0.4, 'inQuad'), sound(140, 'strike'), anim(140, 'boss', 'airborne'), fx(140, 'water', SHIN.x, SHIN.y, 10),
    tw(150, 'boss', { rot: -6.2832, y: 470 }, 280, 'outQuad'), tw(150, 'jug', { x: 560, alpha: 0 }, 200, 'outQuad'),
    tw(0, 'camera', { x: 640, y: 440, sx: 1.14 }, 400, 'inQuad'),
  ]),
  /**
   * GROS GAIN (mise en scène) : ralenti, image d'impact, STRIKE ; B.B. tournoie par-dessus son bureau, l'ascenseur
   * s'ouvre au bon moment, il y entre en vrille et les portes se referment.
   */
  seg('BWL_E_BIGSTRIKE', 'action', 780, 'compress', [
    ...roll(0, SHIN, 140, 0.4, 'inQuad'), ...cam.slowmo(100, 140, 0.35), ...impactFrame(140, 30, 50), sound(140, 'strike'), sound(140, 'boom'),
    fx(140, 'water', SHIN.x, SHIN.y, 24), shake(140, 300, 8), tw(150, 'jug', { x: 560, alpha: 0 }, 200, 'outQuad'),
    tw(0, 'elevL', { sx: 0.08 }, 160, 'outQuad'), tw(0, 'elevR', { sx: 0.08 }, 160, 'outQuad'), sound(40, 'bell'),
    ...bb.airborne(160, { x: 985, y: 560 }, 440, 300, { rot: -6.2832 }), tw(600, 'boss', { rot: 0 }, 1, 'linear'),
    tw(620, 'elevL', { sx: 1 }, 140, 'inQuad'), tw(620, 'elevR', { sx: 1 }, 140, 'inQuad'), sound(760, 'clunk'),
    tw(120, 'camera', { x: 780, y: 360, sx: 1.08 }, 560, 'inOutQuad'),
  ]),
  /** BOSS FIGHT : la bonbonne s'arrête à ses pieds ; l'eau se met à briller, DORÉE. Il boit. */
  seg('BWL_E_GOLD', 'twist', 900, 'compress', [
    ...roll(0, FEET, 160, 0.4, 'outQuad'), silence(160, 220), fx(200, 'gold', FEET.x, FEET.y - 20, 12), sound(220, 'gold'),
    tw(200, 'glow', { x: FEET.x, y: 520, alpha: 0.85 }, 360, 'outQuad'), tw(420, 'jug', { x: 640, y: 440, rot: 3.14 }, 220, 'outQuad'),
    anim(440, 'boss', 'drink'), sound(560, 'gulp'), state(640, 'boss', 'mug=gold'), tw(640, 'jug', { alpha: 0 }, 120),
    anim(700, 'boss', 'furious'), tw(760, 'glow', { alpha: 0 }, 140), tw(0, 'camera', { x: 640, y: 440, sx: 1.1 }, 500, 'inOutQuad'),
  ]),
  /**
   * VERY RARE (perte) : il ramasse la bonbonne… et la renvoie vers le JOUEUR. Elle roule vers l'objectif, grossit,
   * grossit — SPLASH sur l'écran. B.B. rit. (Le coup du joueur lui revient.)
   */
  seg('BWL_E_RETURN', 'action', 1500, 'compress', [
    ...roll(0, FEET, 160, 0.4, 'outQuad'), anim(160, 'boss', 'push'), tw(260, 'jug', { x: 640, y: 480, z: 260 }, 200, 'outQuad'),
    anim(460, 'boss', 'taunt'), sound(480, 'laugh', 0.9), signal(500, 'reveal'),
    tw(620, 'jug', { x: 540, y: 640, z: -400, sx: S * 4, sy: S * 4 }, 520, 'inQuad'), tw(620, 'jug', { rot: 12 }, 520, 'linear'), sound(620, 'roll', 0.8),
    sound(1140, 'splash', 0.9), sound(1140, 'boom', 1.2), fx(1140, 'water', 520, 420, 60), fx(1160, 'water', 380, 360, 40), fx(1160, 'water', 660, 360, 40),
    tw(1140, 'flash', { alpha: 0.5 }, 30, 'linear'), tw(1180, 'flash', { alpha: 0 }, 300), shake(1140, 400, 12), tw(1140, 'jug', { alpha: 0 }, 60),
    anim(1200, 'boss', 'laugh'), sound(1220, 'laugh'), ...cam.push(620, 560, 480, 1.1, 500), ...cam.recover(1200, 280),
  ]),
  /** PERTE : elle repart en arrière… et remonte la rampe jusqu'au bureau du joueur. B.B. sourit. */
  seg('BWL_E_ROLLBACK', 'action', 800, 'compress', [
    ...roll(0, MID, 260, -0.8, 'inQuad'), ...roll(260, LOW, 200, -0.6), ...roll(460, { x: TOP.x - 30, y: TOP.y + 10 }, 240, -0.8, 'outQuad'),
    sound(0, 'roll', 0.9), sound(460, 'thump', 1.3), signal(360, 'reveal'), anim(380, 'boss', 'smug'), sound(400, 'hmpf'),
    tw(100, 'camera', { x: 700, y: 480, sx: 1.04 }, 500, 'inOutQuad'),
  ]),
  /** GAIN : il se penche pour regarder ; elle repart d'un coup, droit dans son tibia. */
  seg('BWL_E_NUDGE', 'action', 360, 'compress', [
    anim(0, 'boss', 'lookdown'), ...roll(160, SHIN, 150, 0.5, 'inQuad'), sound(160, 'roll', 1.4), anim(260, 'boss', 'scared'),
    tw(310, 'jug', { x: 600, alpha: 0 }, 50, 'linear'), fx(310, 'water', SHIN.x, SHIN.y, 8),
  ]),
  /** PERTE : trop d'effet ; elle passe à côté, roule sous le bureau et tape la sonnette (« ting »). LE SIP. */
  seg('BWL_E_GUTTER', 'action', 700, 'compress', [
    ...roll(0, { x: 830, y: 548, z: 300 }, 360, 1.2), tw(340, 'jug', { alpha: 0 }, 60), sound(0, 'roll', 1.1),
    sound(380, 'bonk', 0.8), tw(390, 'bell', { rot: 0.35 }, 60, 'linear'), tw(450, 'bell', { rot: 0 }, 220, 'outElastic'), sound(390, 'tink', 1.7),
    signal(420, 'reveal'), anim(420, 'boss', 'smirk'), tw(0, 'camera', { x: 680, y: 430, sx: 1.06 }, 400, 'inOutQuad'),
  ]),
  /** GAIN : l'effet la ramène pile dans ses pieds : il tourne sur lui-même et s'effondre. */
  seg('BWL_E_SPLIT', 'action', 380, 'compress', [
    ...roll(0, SHIN, 180, 0.5, 'inQuad'), sound(180, 'strike', 1.2), anim(180, 'boss', 'spin'), sound(190, 'spin'),
    tw(190, 'jug', { x: 700, alpha: 0 }, 150, 'outQuad'), tw(0, 'camera', { x: 640, y: 440, sx: 1.12 }, 360, 'inQuad'),
  ]),
  /** PERTE (BACKFIRE) : c'est Wendell qui est renversé (STRIKE, dossiers partout). B.B. éclate de rire. */
  seg('BWL_E_WSTRIKE', 'action', 900, 'compress', [
    ...roll(0, { x: 700, y: 548 }, 140, 0.4, 'inQuad'), sound(140, 'strike'), anim(140, 'wendell', 'fall'), tw(140, 'wendell', { rot: -1.3, x: 740 }, 220, 'outQuad'),
    fx(150, 'papers', 700, 460, 26), sound(160, 'paper'), tw(160, 'jug', { x: 760, alpha: 0 }, 200),
    signal(260, 'reveal'), anim(300, 'boss', 'laugh'), sound(320, 'laugh'), tw(0, 'camera', { x: 680, y: 430, sx: 1.08 }, 400, 'inOutQuad'),
  ]),
  /** GAIN (CHAIN) : Wendell saute par-dessus la bonbonne, qui file droit dans les tibias de B.B. */
  seg('BWL_E_WJUMP', 'action', 440, 'compress', [
    anim(0, 'wendell', 'panic'), tw(0, 'wendell', { y: 480 }, 150, 'outQuad'), tw(150, 'wendell', { y: 560 }, 150, 'inQuad'), sound(20, 'honk', 1.6),
    ...roll(60, SHIN, 240, 0.6, 'inQuad'), anim(200, 'boss', 'scared'), tw(300, 'jug', { x: 600, alpha: 0 }, 80),
    tw(0, 'camera', { x: 650, y: 440, sx: 1.12 }, 400, 'inQuad'),
  ]),
  /** PERTE : la fusée à eau arrose la plante (qui se redresse, ravie), puis retombe à ses pieds. Il rit. */
  seg('BWL_E_PLANT', 'action', 900, 'compress', [
    tw(0, 'jug', { x: 230, y: 430, z: 200 }, 260, 'inOutQuad'), fx(120, 'water', 200, 440, 20), sound(120, 'splash', 1.3),
    tw(160, 'plant', { sy: 1.18 }, 300, 'outElastic'), fx(200, 'leaves', 196, 440, 5),
    tw(300, 'jug', { x: FEET.x, y: FEET.y, z: FEET.z, rot: -12 }, 320, 'inQuad'), sound(620, 'thump', 1.3), sound(640, 'deflate'),
    signal(640, 'reveal'), anim(660, 'boss', 'laugh'), sound(680, 'laugh'), tw(0, 'camera', { x: 420, y: 420, sx: 1.02 }, 400, 'inOutQuad'),
  ]),
  /** GROS GAIN : la fusée le frappe en pleine poitrine ; une vague l'emporte à travers la pièce jusqu'à la fenêtre. */
  seg('BWL_E_WAVE', 'action', 760, 'compress', [
    tw(0, 'jug', { x: 640, y: 420 }, 160, 'inQuad'), ...impactFrame(160, 30, 40), sound(160, 'splash'), sound(160, 'boom', 1.1),
    fx(160, 'water', 640, 420, 40), fx(260, 'water', 520, 420, 40), fx(360, 'water', 380, 380, 40), tw(170, 'jug', { alpha: 0 }, 60),
    anim(170, 'boss', 'airborne'), tw(180, 'boss', { x: 236, y: 330, rot: -0.5 }, 480, 'inQuad'), sound(200, 'gust'),
    anim(560, 'boss', 'lookcam'), ...cam.hitStop(580, 110), tw(120, 'camera', { x: 440, y: 360, sx: 1.12 }, 560, 'inOutQuad'),
  ]),
  /** Sortie par la fenêtre. */
  seg('BWL_AWAY', 'impact', 700, 'compress', [
    ...bb.away(0, { x: 150, y: 240 }), ...props.portraitSwing(0), fx(40, 'water', 220, 260, 16), sound(60, 'splash', 1.4),
    tw(300, 'camera', { x: 500, y: 350, sx: 1 }, 400, 'inOutQuad'),
  ]),
  /** BOSS FIGHT : la fusée monte au plafond et éclate : pluie DORÉE sur B.B. */
  seg('BWL_E_GOLDRAIN', 'twist', 900, 'compress', [
    tw(0, 'jug', { x: 650, y: 120 }, 220, 'outQuad'), sound(220, 'pfft', 0.8), tw(220, 'jug', { alpha: 0 }, 60), silence(220, 200),
    fx(260, 'gold', 650, 160, 30), fx(300, 'water', 650, 180, 20), sound(280, 'gold'), tw(260, 'glow', { x: 650, y: 400, alpha: 0.8 }, 360, 'outQuad'),
    state(560, 'boss', 'mug=gold'), anim(600, 'boss', 'furious'), tw(760, 'glow', { alpha: 0 }, 140),
    tw(0, 'camera', { x: 620, y: 320, sx: 1.04 }, 500, 'inOutQuad'),
  ]),
];

export const coolerBowling: GadgetDef = {
  id: 'cooler-bowling',
  label: 'WATER COOLER BOWLING',
  rageLevel: 'furious',
  layout: {
    ...FURIOUS_DECOR,
    coolRamp: { transform: { x: COOLER.ramp.x, y: COOLER.ramp.y, sx: S, sy: S } },
    jug: { transform: { x: TOP.x, y: TOP.y, rot: 0, sx: S, sy: S } },
  },
  props: [...FURIOUS_WORLD_PROPS, 'coolRamp', 'jug'],
  trunk: ['BWL_IN', 'BWL_WINDUP'],
  hold: { sound: 'gulp', everyMs: 700 },
  signature: ['roll', 'gulp', 'strike', 'splash'],
  pick: {
    layer: 'front',
    box: { x: COOLER.ramp.x - 76, y: COOLER.ramp.y - 128, w: 152, h: 138 },
    spot: { x: COOLER.ramp.x, y: COOLER.ramp.y - 2, sx: 1 },
    idle: [{ actor: 'jug', prop: 'rot', amp: 0.08, periodMs: 700 }],
  },
  segments: segments(SEGMENTS),
  branches: [
    compose('BWL-S1', 'Saut de haie', [STRAIGHT], [{ seg: 'BWL_E_HOP' }], { categories: ['CLEAN_MISS', 'BACKFIRE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('BWL-S2', 'Au goulot', [STRAIGHT], [{ seg: 'BWL_E_STOP' }], { categories: ['TEASE', 'CLEAN_MISS'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('BWL-S3', 'Strike', [STRAIGHT], [{ seg: 'BWL_E_STRIKE' }, { impact: 'floor' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('BWL-S4', 'Strike : l\'ascenseur', [STRAIGHT], [{ seg: 'BWL_E_BIGSTRIKE' }, { impact: 'elevator' }, { reaction: 'OFFICE_CHEER' }], { categories: ['DIRECT', 'COMEBACK', 'CHAIN', 'SUPER'], classes: WIN_BIG, rarity: 'COMMON', d1: D1 }),
    compose('BWL-S5', 'Eau dorée', [STRAIGHT], [{ seg: 'BWL_E_GOLD' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'COMMON', d1: D1 }),
    compose('BWL-S6', 'Retour au joueur', [STRAIGHT], [{ seg: 'BWL_E_RETURN' }], { categories: ['BACKFIRE', 'TEASE'], classes: LOSS, rarity: 'VERY_RARE', d1: D1 }),
    compose('BWL-P1', 'Marche arrière', [STRAIGHT, PAUSE], [{ seg: 'BWL_E_ROLLBACK' }], { categories: ['TEASE', 'CLEAN_MISS'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('BWL-P2', 'Le dernier tour', [STRAIGHT, PAUSE], [{ seg: 'BWL_E_NUDGE' }, { impact: 'none' }, { reaction: 'auto' }], { categories: ['COMEBACK', 'GRAZE', 'DIRECT'], classes: WIN_SMALL, rarity: 'UNCOMMON', d1: D1 }),
    compose('BWL-H1', 'Gouttière', [HOOK], [{ seg: 'BWL_E_GUTTER' }, { reaction: 'SIP' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('BWL-H2', 'Effet rétro', [HOOK], [{ seg: 'BWL_E_SPLIT' }, { impact: 'none' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('BWL-W1', 'Wendell, quille', [HOOK, WENDELL], [{ seg: 'BWL_E_WSTRIKE' }], { categories: ['BACKFIRE', 'TEASE'], classes: LOSS, rarity: 'RARE', d1: D1 }),
    compose('BWL-W2', 'Wendell saute', [HOOK, WENDELL], [{ seg: 'BWL_E_WJUMP' }, { impact: 'none' }, { reaction: 'auto' }], { categories: ['CHAIN', 'COMEBACK', 'DIRECT'], classes: WIN_MID, rarity: 'RARE', d1: D1 }),
    compose('BWL-B1', 'Arrosage', [BURST], [{ seg: 'BWL_E_PLANT' }], { categories: ['CLEAN_MISS', 'BACKFIRE'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('BWL-B2', 'La vague', [BURST], [{ seg: 'BWL_E_WAVE' }, { impact: 'window' }, { seg: 'BWL_AWAY' }, { reaction: 'away' }], { categories: ['CHAIN', 'SUPER', 'COMEBACK', 'DIRECT'], classes: WIN_BIG, rarity: 'UNCOMMON', d1: D1 }),
    compose('BWL-B3', 'Pluie dorée', [BURST], [{ seg: 'BWL_E_GOLDRAIN' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'UNCOMMON', d1: D1 }),
  ],
};
