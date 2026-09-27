/**
 * PLAN B · CABINET DOMINO (FURIOUS) — gadget de PRODUCTION (15 branches).
 * Trois classeurs minces, debout comme des dominos entre la plante et B.B. : le joueur pousse le premier.
 * Réaction en chaîne de mobilier (FURIOUS : meubles, mécanismes, Wendell, la trappe du décor).
 * Signature sonore : CLONK métallique de chaque chute (clang), RATTLE des tiroirs, SLIDE du tiroir qui file.
 *
 * Tronc neutre : les mains poussent le premier classeur, qui résiste et oscille ; B.B. cligne des yeux, agacé.
 * DÉBUTS VISIBLES (chacun mène à des pertes ET à des gains) :
 *   CHAIN   : CLONK-CLONK-CLONK : les trois tombent, le dernier bascule lentement vers B.B.…
 *   STALL   : le premier tombe sur le deuxième, qui oscille… et tient. Silence.
 *   WENDELL : Wendell arrive, le nez dans ses dossiers, et s'arrête entre le dernier classeur et B.B.
 *   DRAWERS : les tiroirs jaillissent ; l'un d'eux file sur le parquet vers les pieds de B.B.
 */
import type { GadgetDef, SegmentDef } from '../../../presentation/types';
import { anim, BOSS_FIGHT, compose, fx, impactFrame, LOSS, mod, paced, seg, segments, shake, signal, silence, sound, state, tw, WIN_ANY, WIN_BIG, WIN_MID } from '../../dsl';
import { bb, cam, coo, props, wendell, wobble } from '../../kit';
import { DOMINO, FURIOUS_STATIONS } from '../stations';
import { FURIOUS_DECOR, FURIOUS_WORLD_PROPS, LEVER } from './decor';

const D1 = 'teetering';

/** Pivot (coin inférieur droit) de chaque classeur. */
const PX = DOMINO.xs.map((x) => x + DOMINO.w) as [number, number, number];
const FLOOR = 560;
/** Angle d'appui : chaque classeur penché repose sur le suivant (pas de chevauchement visible). */
const LEAN = 0.36;
const BOSS = { x: 650, y: 560 };

/** Chute d'un classeur jusqu'à `to` (radians), avec son CLONK et un nuage de dossiers. */
const topple = (at: number, n: 1 | 2 | 3, to: number, ms = 170, pitch = 1): SegmentDef['cues'] => [
  tw(at, `dom${n}`, { rot: to }, ms, 'inQuad'), sound(at + ms, 'clang', pitch), sound(at + ms, 'thump', 0.9),
  fx(at + ms, 'papers', PX[n - 1] - 30 + 172 * Math.sin(to), FLOOR - 172 * Math.cos(to), 6),
];

const CHAIN = mod('CHAIN', { seg: 'DOM_CHAIN' });
const STALL = mod('STALL', { seg: 'DOM_STALL' });
const WENDELL = mod('WENDELL', { seg: 'DOM_T_WENDELL' });
const DRAWERS = mod('DRAWERS', { seg: 'DOM_DRAWERS' });

const SEGMENTS: SegmentDef[] = [
  // ---------------------------------------------------------------- tronc (neutre)
  seg('DOM_IN', 'intro', 450, 'compress', [
    anim(0, 'hands', 'open'), tw(0, 'hands', { x: DOMINO.xs[0] - 24, y: 500 }, 380, 'outBack'), anim(380, 'hands', 'push'), sound(390, 'thump', 1.4),
    anim(0, 'boss', 'tapfoot'),
  ]),
  seg('DOM_PUSH', 'setup', 700, 'compress', [
    tw(0, 'hands', { x: DOMINO.xs[0] - 10 }, 200, 'inOutQuad'), tw(200, 'hands', { x: DOMINO.xs[0] - 26 }, 160, 'inOutQuad'), tw(360, 'hands', { x: DOMINO.xs[0] - 4 }, 220, 'inOutQuad'),
    ...wobble(0, 'dom1', 0, 0.06, 5, 100), sound(0, 'creak', 0.8), sound(300, 'rattle', 0.9), sound(520, 'creak', 1.1),
    anim(250, 'boss', 'blink'), tw(0, 'camera', { x: 470, y: 380, sx: 1.05 }, 600, 'inOutQuad'),
  ]),

  // ---------------------------------------------------------------- DÉBUTS
  /** CLONK-CLONK-CLONK : le dernier classeur bascule lentement vers B.B. (rien n'est joué). */
  seg('DOM_CHAIN', 'action', 700, 'compress', [
    anim(0, 'hands', 'open'), tw(40, 'hands', { y: 1060 }, 220, 'inQuad'),
    ...topple(0, 1, LEAN), ...topple(150, 2, LEAN, 160, 1.12), ...topple(290, 3, 0.18, 200, 1.25),
    tw(490, 'dom3', { rot: 0.27 }, 210, 'linear'), sound(500, 'creak', 1.3),
    anim(330, 'boss', 'surprised'), tw(100, 'camera', { x: 560, y: 380, sx: 1.08 }, 560, 'inOutQuad'),
  ]),
  /** Le premier tombe sur le deuxième, qui oscille… et tient. Silence. B.B. sourit en coin. */
  paced(0.85, seg('DOM_STALL', 'action', 940, 'compress', [
    anim(0, 'hands', 'open'), tw(40, 'hands', { y: 1060 }, 220, 'inQuad'),
    ...topple(0, 1, LEAN), ...wobble(170, 'dom2', 0, 0.09, 5, 90), sound(200, 'rattle', 1.1),
    silence(640, 300), anim(560, 'boss', 'smirk'), tw(100, 'camera', { x: 520, y: 380, sx: 1.08 }, 600, 'inOutQuad'),
  ])),
  /** Les tiroirs jaillissent du premier classeur ; un tiroir file sur le parquet vers les pieds de B.B. */
  seg('DOM_DRAWERS', 'action', 780, 'compress', [
    anim(0, 'hands', 'open'), tw(40, 'hands', { y: 1060 }, 220, 'inQuad'),
    ...topple(0, 1, LEAN * 0.6, 200), sound(180, 'slide'), fx(200, 'papers', 330, 420, 18),
    tw(200, 'domDrawer', { x: 356, y: 548, alpha: 1, rot: 0 }, 1, 'linear'), tw(202, 'domDrawer', { x: 560 }, 560, 'outQuad'), tw(202, 'domDrawer', { rot: 0.3 }, 560, 'linear'),
    sound(220, 'slide', 0.9), sound(400, 'rattle', 1.2), anim(360, 'boss', 'lookdown'),
    tw(160, 'camera', { x: 520, y: 400, sx: 1.08 }, 600, 'inOutQuad'),
  ]),

  // ---------------------------------------------------------------- TWIST
  /** Wendell arrive, le nez dans ses dossiers, et s'arrête entre le dernier classeur et B.B. */
  paced(0.85, seg('DOM_T_WENDELL', 'twist', 900, 'compress', [
    ...wendell.walkIn(0, 590, 540), anim(560, 'wendell', 'look'), sound(580, 'paper', 1.3),
    ...wobble(600, 'dom2', 0, 0.05, 3, 90), sound(640, 'tension'), anim(300, 'boss', 'confused'),
    tw(0, 'camera', { x: 560, y: 380, sx: 1.06 }, 600, 'inOutQuad'),
  ])),

  // ---------------------------------------------------------------- FINS (chacune contient la révélation)
  /** PERTE (BACKFIRE) : B.B. retient le dernier classeur d'une main et renvoie toute la chaîne… sur le grand classeur. */
  seg('DOM_E_SHOVE', 'action', 1000, 'compress', [
    anim(0, 'boss', 'push'), tw(0, 'dom3', { rot: 0.3 }, 60, 'outQuad'), sound(40, 'thump', 1.1),
    tw(220, 'dom3', { rot: -0.2 }, 160, 'outQuad'), tw(300, 'dom2', { rot: -0.3 }, 160, 'outQuad'), tw(380, 'dom1', { rot: -0.55 }, 180, 'inQuad'),
    sound(380, 'clang', 1.2), sound(460, 'clang', 1.1), sound(560, 'crash', 0.9), state(560, 'cabinet', 'dented'), shake(560, 200, 4), fx(560, 'papers', 150, 420, 16),
    signal(420, 'reveal'), ...bb.recover(620), sound(700, 'laugh'), tw(200, 'camera', { x: 460, y: 380, sx: 1.02 }, 500, 'inOutQuad'),
  ]),
  /** GAIN : le dernier classeur s'abat sur B.B. (reveal au contact, bibliothèque IMPACT). */
  seg('DOM_E_SQUASH', 'action', 260, 'compress', [
    tw(0, 'dom3', { rot: 0.95 }, 250, 'inQuad'), anim(120, 'boss', 'duck'), sound(40, 'whoosh', 0.8),
    tw(0, 'camera', { x: 600, y: 420, sx: 1.12 }, 250, 'inQuad'),
  ]),
  /**
   * GROS GAIN (mise en scène) : ralenti au contact, image d'impact ; le classeur projette B.B. à travers la pièce,
   * droit dans l'ascenseur, dont les portes se referment.
   */
  seg('DOM_E_ELEVATOR', 'action', 780, 'compress', [
    tw(0, 'dom3', { rot: 0.5 }, 140, 'inQuad'), ...cam.slowmo(80, 160, 0.35), anim(100, 'boss', 'lookcam'),
    ...impactFrame(140, 30, 50), sound(140, 'boom'), sound(142, 'clang'), shake(140, 300, 8), tw(140, 'dom3', { rot: 1.2 }, 260, 'outBounce'),
    tw(0, 'elevL', { sx: 0.08 }, 160, 'outQuad'), tw(0, 'elevR', { sx: 0.08 }, 160, 'outQuad'),
    ...bb.airborne(150, { x: 985, y: 560 }, 420, 420, { rot: 1.2 }), tw(570, 'boss', { rot: 0 }, 1, 'linear'),
    tw(600, 'elevL', { sx: 1 }, 140, 'inQuad'), tw(600, 'elevR', { sx: 1 }, 140, 'inQuad'), sound(730, 'clunk'),
    tw(100, 'camera', { x: 780, y: 360, sx: 1.1 }, 560, 'inOutQuad'),
  ]),
  /** PERTE (TEASE) : le classeur penche jusqu'à son épaule… il souffle dessus, le classeur se redresse. */
  seg('DOM_E_SHY', 'action', 900, 'compress', [
    tw(0, 'dom3', { rot: 0.36 }, 160, 'inQuad'), sound(160, 'tink', 0.9), silence(160, 380), anim(200, 'boss', 'smirk'),
    anim(480, 'boss', 'sniff'), sound(500, 'pfft', 1.6), tw(520, 'dom3', { rot: -0.04 }, 220, 'outBack'), tw(740, 'dom3', { rot: 0 }, 120, 'outQuad'),
    signal(560, 'reveal'), sound(740, 'clunk', 1.3), tw(0, 'camera', { x: 590, y: 390, sx: 1.14 }, 400, 'inOutQuad'),
  ]),
  /**
   * VERY RARE (perte) : il claque des doigts. Au ralenti, les trois classeurs se relèvent l'un après l'autre (trois
   * notes qui montent). Il salue. Le COO applaudit… B.B.
   */
  seg('DOM_E_REWIND', 'action', 1500, 'compress', [
    tw(0, 'dom3', { rot: 0.34 }, 120, 'inQuad'), anim(120, 'boss', 'catch'), sound(160, 'snap', 1.6), silence(160, 300),
    ...cam.slowmo(300, 600, 0.45), tw(320, 'dom3', { rot: 0 }, 200, 'outBack'), sound(330, 'boing', 1.1),
    tw(500, 'dom2', { rot: 0 }, 200, 'outBack'), sound(510, 'boing', 1.3), tw(680, 'dom1', { rot: 0 }, 200, 'outBack'), sound(690, 'boing', 1.5),
    signal(700, 'reveal'), anim(900, 'boss', 'smug'), sound(920, 'hmpf', 1.2), ...coo.flyTo(900, { x: 520, y: 340 }, 320), anim(1220, 'coo', 'applaud'),
    ...cam.push(0, 460, 380, 1.04, 500), ...cam.recover(1100, 380),
  ]),
  /** BOSS FIGHT : un dossier DORÉ glisse du dernier classeur jusqu'à ses pieds. Le mug s'embrase. */
  seg('DOM_E_GOLDFILE', 'twist', 900, 'compress', [
    tw(0, 'dom3', { rot: 0.3 }, 120, 'outQuad'), fx(120, 'gold', 560, 450, 10), sound(140, 'gold'), silence(0, 200),
    tw(120, 'glow', { x: 600, y: 480, alpha: 0.85 }, 380, 'outQuad'), anim(300, 'boss', 'lookdown'),
    state(560, 'boss', 'mug=gold'), fx(560, 'gold', 610, 430, 14), anim(600, 'boss', 'furious'), tw(740, 'glow', { alpha: 0 }, 160),
    tw(0, 'camera', { x: 600, y: 400, sx: 1.08 }, 500, 'inOutQuad'),
  ]),
  /** PERTE : le deuxième tient. Il ne se passe plus rien. */
  seg('DOM_E_HOLD', 'action', 360, 'compress', [
    ...wobble(0, 'dom2', 0, 0.02, 2, 80), signal(200, 'reveal'), anim(160, 'boss', 'smug'), sound(220, 'hmpf'),
  ]),
  /** GAIN (COMEBACK) : un grincement… le deuxième cède enfin, le troisième suit et s'abat sur B.B. */
  seg('DOM_E_LATE', 'action', 700, 'compress', [
    sound(0, 'creak', 0.7), ...topple(120, 2, LEAN, 220), tw(340, 'dom3', { rot: 0.95 }, 300, 'inQuad'), sound(360, 'whoosh', 0.8),
    anim(360, 'boss', 'panic'), tw(200, 'camera', { x: 600, y: 420, sx: 1.12 }, 480, 'inQuad'),
  ]),
  /** PERTE (BACKFIRE) : la chaîne repart… et c'est Wendell qui se retrouve sous le classeur. B.B. rit. */
  seg('DOM_E_WLEAN', 'action', 900, 'compress', [
    ...topple(0, 2, LEAN, 200), tw(200, 'dom3', { rot: 0.62 }, 220, 'inQuad'), sound(420, 'clang'), sound(420, 'bonk', 1.4),
    anim(420, 'wendell', 'fall'), tw(420, 'wendell', { rot: 1.3, y: 572 }, 200, 'outQuad'), fx(430, 'papers', 600, 470, 18), shake(420, 200, 4),
    signal(460, 'reveal'), anim(500, 'boss', 'laugh'), sound(520, 'laugh'), tw(0, 'camera', { x: 580, y: 400, sx: 1.08 }, 400, 'inOutQuad'),
  ]),
  /** GAIN (CHAIN) : Wendell se baisse au dernier moment ; le classeur passe au-dessus de lui et frappe B.B. */
  seg('DOM_E_WDUCK', 'action', 560, 'compress', [
    ...topple(0, 2, LEAN, 200), ...wendell.duck(160), tw(200, 'dom3', { rot: 0.95 }, 300, 'inQuad'), sound(220, 'whoosh', 0.8),
    anim(300, 'boss', 'scared'), tw(100, 'camera', { x: 610, y: 420, sx: 1.12 }, 440, 'inQuad'),
  ]),
  /** PERTE : le tiroir s'arrête pile contre ses orteils ; il y pose le pied, satisfait. */
  seg('DOM_E_FOOTREST', 'action', 600, 'compress', [
    tw(0, 'domDrawer', { x: 604, rot: 0 }, 220, 'outQuad'), sound(220, 'thump', 1.5), silence(220, 260),
    anim(300, 'boss', 'smug'), signal(320, 'reveal'), sound(340, 'hmpf'), tw(0, 'camera', { x: 610, y: 440, sx: 1.14 }, 300, 'inOutQuad'),
  ]),
  /** GAIN : le tiroir le fauche ; il bascule en avant, droit dessus. */
  seg('DOM_E_TRIP', 'action', 520, 'compress', [
    tw(0, 'domDrawer', { x: 628, rot: 0 }, 160, 'inQuad'), sound(160, 'bonk'), anim(160, 'boss', 'airborne'),
    tw(170, 'boss', { x: 600, rot: -1.1, y: 540 }, 300, 'inQuad'), sound(180, 'whoosh', 1.1),
    tw(60, 'camera', { x: 600, y: 440, sx: 1.12 }, 400, 'inOutQuad'),
  ]),
  /**
   * GROS GAIN : le tiroir passe entre ses jambes, file jusqu'au LEVIER de la trappe (décor FURIOUS) et le fait
   * basculer. B.B. regarde le levier, puis ses pieds… La trappe s'ouvre. Douze étages.
   */
  seg('DOM_E_LEVER', 'action', 780, 'compress', [
    tw(0, 'domDrawer', { x: LEVER.x - 34, rot: 0.2 }, 260, 'linear'), anim(0, 'boss', 'hop'), sound(20, 'slide', 1.3),
    sound(260, 'clunk'), tw(260, 'lever', { rot: 0.9 }, 120, 'outBack'), anim(300, 'boss', 'lookback'), silence(320, 240),
    anim(460, 'boss', 'lookcam'), ...cam.hitStop(470, 110), state(560, 'trapdoor', 'open'), sound(560, 'clunk', 0.8),
    anim(580, 'boss', 'fall'), tw(590, 'boss', { y: 900 }, 190, 'inQuad'), sound(590, 'fall'),
    tw(0, 'camera', { x: 700, y: 420, sx: 1.08 }, 400, 'inOutQuad'),
  ]),
  /** Chute sous la trappe : douze étages (même grammaire que TRAPDOOR EXPRESS). */
  seg('DOM_FLOORS', 'action', 520, 'compress', [
    sound(60, 'elevator', 1.3), sound(180, 'elevator', 1.15), sound(300, 'elevator', 1.0), silence(320, 200),
    tw(0, 'camera', { x: 650, y: 430, sx: 1.2 }, 400, 'inOutQuad'),
  ]),
  seg('DOM_CLOSE', 'reaction', 420, 'compress', [
    state(150, 'trapdoor', 'closed'), sound(150, 'clunk'), tw(150, 'lever', { rot: -0.35 }, 200, 'outBack'), tw(0, 'camera', { x: 500, y: 350, sx: 1 }, 380, 'inOutQuad'),
  ]),
  /** RARE (perte) : il saute sur le tiroir et fait le tour de la pièce en surf… pour s'arrêter pile à sa place. */
  seg('DOM_E_SURF', 'action', 1300, 'compress', [
    anim(0, 'boss', 'hop'), tw(0, 'boss', { x: 560 }, 180, 'outQuad'), tw(0, 'domDrawer', { x: 560 }, 180, 'outQuad'),
    anim(200, 'boss', 'airborne'), sound(200, 'slide'), tw(200, 'boss', { x: 250 }, 380, 'inOutQuad'), tw(200, 'domDrawer', { x: 250 }, 380, 'inOutQuad'),
    tw(580, 'boss', { x: 650 }, 420, 'inOutQuad'), tw(580, 'domDrawer', { x: 650 }, 420, 'inOutQuad'), sound(580, 'slide', 1.2),
    anim(1000, 'boss', 'smug'), signal(1020, 'reveal'), sound(1040, 'laugh', 1.1), tw(1000, 'domDrawer', { alpha: 0 }, 200),
    ...cam.follow(100, [{ x: 420, y: 400, zoom: 1.04, ms: 450 }, { x: 600, y: 390, ms: 450 }]),
  ]),
];

export const cabinetDomino: GadgetDef = {
  id: 'cabinet-domino',
  label: 'CABINET DOMINO',
  rageLevel: 'furious',
  layout: {
    ...FURIOUS_DECOR,
    dom1: { transform: { x: PX[0], y: FLOOR, rot: 0 } },
    dom2: { transform: { x: PX[1], y: FLOOR, rot: 0 } },
    dom3: { transform: { x: PX[2], y: FLOOR, rot: 0 } },
    domDrawer: { transform: { x: 356, y: 548, alpha: 0 } },
  },
  props: [...FURIOUS_WORLD_PROPS, 'dom1', 'dom2', 'dom3', 'domDrawer'],
  trunk: ['DOM_IN', 'DOM_PUSH'],
  hold: { sound: 'rattle', everyMs: 620 },
  signature: ['clang', 'rattle', 'slide', 'creak'],
  pick: {
    layer: 'room',
    box: { x: DOMINO.xs[0] - 10, y: FLOOR - 186, w: PX[2] - DOMINO.xs[0] + 16, h: 196 },
    spot: { x: FURIOUS_STATIONS.B.x + 30, y: FLOOR - 2, sx: 1.4, sy: 0.9 },
    idle: [
      { actor: 'dom1', prop: 'rot', amp: 0.03, periodMs: 520 },
      { actor: 'dom2', prop: 'rot', amp: 0.02, periodMs: 610 },
    ],
  },
  segments: segments(SEGMENTS),
  branches: [
    compose('DOM-C1', 'Retour à l\'envoyeur', [CHAIN], [{ seg: 'DOM_E_SHOVE' }], { categories: ['BACKFIRE', 'CLEAN_MISS'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('DOM-C2', 'Écrasé', [CHAIN], [{ seg: 'DOM_E_SQUASH' }, { impact: 'none' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('DOM-C3', 'Direct à l\'ascenseur', [CHAIN], [{ seg: 'DOM_E_ELEVATOR' }, { impact: 'elevator' }, { reaction: 'OFFICE_CHEER' }], { categories: ['DIRECT', 'COMEBACK', 'CHAIN', 'SUPER'], classes: WIN_BIG, rarity: 'COMMON', d1: D1 }),
    compose('DOM-C4', 'Il souffle dessus', [CHAIN], [{ seg: 'DOM_E_SHY' }], { categories: ['TEASE', 'CLEAN_MISS'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('DOM-C5', 'Rembobinage', [CHAIN], [{ seg: 'DOM_E_REWIND' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'VERY_RARE', d1: D1 }),
    compose('DOM-C6', 'Dossier doré', [CHAIN], [{ seg: 'DOM_E_GOLDFILE' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'COMMON', d1: D1 }),
    compose('DOM-S1', 'Ça tient', [STALL], [{ seg: 'DOM_E_HOLD' }, { reaction: 'SIP' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('DOM-S2', 'Ça cède', [STALL], [{ seg: 'DOM_E_LATE' }, { impact: 'none' }, { reaction: 'auto' }], { categories: ['COMEBACK', 'DIRECT', 'GRAZE'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('DOM-W1', 'Wendell dessous', [STALL, WENDELL], [{ seg: 'DOM_E_WLEAN' }], { categories: ['BACKFIRE', 'TEASE'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('DOM-W2', 'Wendell se baisse', [STALL, WENDELL], [{ seg: 'DOM_E_WDUCK' }, { impact: 'none' }, { reaction: 'auto' }], { categories: ['CHAIN', 'COMEBACK', 'DIRECT'], classes: WIN_MID, rarity: 'UNCOMMON', d1: D1 }),
    compose('DOM-D1', 'Repose-pied', [DRAWERS], [{ seg: 'DOM_E_FOOTREST' }, { reaction: 'SIP' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('DOM-D2', 'Croche-pied', [DRAWERS], [{ seg: 'DOM_E_TRIP' }, { impact: 'floor' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('DOM-D3', 'Le levier de la trappe', [DRAWERS], [{ seg: 'DOM_E_LEVER' }, { seg: 'DOM_FLOORS' }, { impact: 'floor' }, { seg: 'DOM_CLOSE' }, { reaction: 'away' }], { categories: ['CHAIN', 'SUPER', 'COMEBACK', 'DIRECT'], classes: WIN_BIG, rarity: 'RARE', d1: D1 }),
    compose('DOM-D4', 'Surf', [DRAWERS], [{ seg: 'DOM_E_SURF' }], { categories: ['CLEAN_MISS', 'BACKFIRE'], classes: LOSS, rarity: 'RARE', d1: D1 }),
    compose('DOM-D5', 'Tiroir doré', [DRAWERS], [{ seg: 'DOM_E_GOLDFILE' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'UNCOMMON', d1: D1 }),
  ],
};
