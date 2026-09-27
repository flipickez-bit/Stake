/**
 * PLAN B · CEILING SAFE (UNHINGED) — gadget de PRODUCTION (15 branches).
 * Un coffre-fort pend sous le ventilateur, juste au-dessus de B.B. ; le joueur a un détonateur sur son bureau.
 * UNHINGED : plafond, objets lourds, machines absurdes — slapstick, jamais de blessure (il se relève toujours).
 * Signature sonore : CREAK de la corde, CHAIN du crochet, BOOM du coffre, CRANK du dérouleur.
 *
 * Tronc neutre : les mains arment le détonateur ; la corde grince, le coffre oscille ; B.B. sirote, sans lever les yeux.
 * DÉBUTS VISIBLES (chacun mène à des pertes ET à des gains) :
 *   DROP  : la corde casse net. Le coffre tombe.
 *   SWING : le ventilateur s'emballe ; le coffre tourne en rond au-dessus de la pièce.
 *   COO   : le COO se pose sur le coffre qui tourne… et le pilote.
 *   LOWER : la corde se déroule doucement ; le coffre vient se poser sur le bureau, à côté de B.B. Il le regarde…
 */
import type { GadgetDef, SegmentDef } from '../../../presentation/types';
import { anim, BOSS_FIGHT, compose, fx, impactFrame, LOSS, mod, paced, seg, segments, shake, signal, silence, sound, state, tw, WIN_ANY, WIN_BIG, WIN_MID } from '../../dsl';
import { bb, cam, coo, props, wendell, wobble } from '../../kit';
import { FRONT_DY, PLUNGER, SAFE_HANG as H } from '../stations';
import { UNHINGED_DECOR } from './decor';

const D1 = 'armed';

/** Poignée du détonateur (calque du premier plan) : repos, armée (tirée), enfoncée. */
const HANDLE = { x: PLUNGER.x, rest: PLUNGER.y - 50, up: PLUNGER.y - 70, down: PLUNGER.y - 28 };
const HANDS_AT = (y: number) => ({ x: PLUNGER.x + 4, y: y + FRONT_DY + 30 });
/** Le haut de la tête de B.B. (assis sur son fauteuil-fusée) et le bureau. */
const HEAD_Y = 214;
const DESK = { x: 780, y: 330 };

const SAFE = 'safe';
const handsAway = (at: number) => tw(at, 'hands', { y: 1060 }, 220, 'inQuad');

const DROP = mod('DROP', { seg: 'SAFE_DROP' });
const SWING = mod('SWING', { seg: 'SAFE_SWING' });
const COO = mod('COO', { seg: 'SAFE_T_COO' });
const LOWER = mod('LOWER', { seg: 'SAFE_LOWER' });

/** Le coffre s'ouvre (porte rabattue), petit nuage. */
const openDoor = (at: number) => [state(at, SAFE, 'door=open'), sound(at, 'clunk', 0.9), sound(at + 20, 'creak', 1.4), fx(at, 'dust', DESK.x, DESK.y + 50, 6)];

const SEGMENTS: SegmentDef[] = [
  // ---------------------------------------------------------------- tronc (neutre)
  seg('SAFE_IN', 'intro', 450, 'compress', [
    anim(0, 'hands', 'open'), tw(0, 'hands', HANDS_AT(HANDLE.rest), 360, 'outBack'), anim(360, 'hands', 'grab'), sound(380, 'click'),
    anim(0, 'boss', 'sip'),
  ]),
  seg('SAFE_ARM', 'setup', 820, 'compress', [
    anim(0, 'hands', 'pull'), tw(0, 'plungerHandle', { y: HANDLE.up }, 560, 'inOutQuad'), tw(0, 'hands', HANDS_AT(HANDLE.up), 560, 'inOutQuad'),
    sound(0, 'crank', 0.8), sound(260, 'crank', 0.9), sound(420, 'creak', 0.8),
    ...wobble(100, SAFE, 0, 0.05, 7, 90), fx(200, 'dust', H.rope.x, H.rope.y, 4), sound(620, 'chain', 0.8), sound(700, 'creak', 0.7),
    anim(200, 'boss', 'oblivious'), tw(0, 'camera', { x: 620, y: 320, sx: 1.05 }, 700, 'inOutQuad'),
  ]),

  // ---------------------------------------------------------------- DÉBUTS
  /**
   * La poignée s'enfonce : la corde s'effiloche (trois brins sautent, trois « snap »), un temps suspendu… CLAC,
   * elle casse ; le coffre tombe (le temps d'un souffle).
   */
  seg('SAFE_DROP', 'action', 560, 'compress', [
    anim(0, 'hands', 'push'), tw(0, 'plungerHandle', { y: HANDLE.down }, 80, 'inQuad'), tw(0, 'hands', HANDS_AT(HANDLE.down), 80, 'inQuad'),
    sound(80, 'thump', 1.1), handsAway(160), sound(140, 'snap', 1.5), sound(230, 'snap', 1.3), fx(140, 'dust', H.rope.x, H.rope.y + 20, 3),
    ...wobble(140, SAFE, 0, 0.08, 3, 80), silence(320, 120), anim(200, 'boss', 'lookup'),
    state(350, SAFE, 'rope=cut'), sound(350, 'snap', 0.8), tw(360, SAFE, { y: H.y + 40, rot: 0 }, 200, 'inQuad'), sound(370, 'whoosh', 0.7),
    tw(0, 'camera', { x: 640, y: 320, sx: 1.08 }, 500, 'inOutQuad'),
  ]),
  /** Le ventilateur s'emballe : le coffre part en rond au-dessus de la pièce (ballon captif). */
  seg('SAFE_SWING', 'action', 900, 'compress', [
    anim(0, 'hands', 'push'), tw(0, 'plungerHandle', { y: HANDLE.down }, 80, 'inQuad'), sound(80, 'thump', 1.1), handsAway(160),
    sound(100, 'whirr', 1.4), tw(100, 'fan', { rot: 0.2 }, 200, 'outQuad'),
    tw(120, SAFE, { x: 820, y: 210, rot: -0.5 }, 260, 'inOutQuad'), tw(380, SAFE, { x: 650, y: 250, rot: 0 }, 260, 'inOutQuad'),
    tw(640, SAFE, { x: 470, y: 210, rot: 0.5 }, 260, 'inOutQuad'), sound(380, 'whoosh', 0.8), sound(640, 'whoosh', 0.9),
    anim(200, 'boss', 'lookup'), anim(560, 'boss', 'duck'), tw(0, 'camera', { x: 640, y: 300, sx: 1.02 }, 600, 'inOutQuad'),
  ]),
  /** Le dérouleur grince : le coffre descend lentement et se pose sur le bureau, à côté de B.B. Il le regarde. */
  paced(0.9, seg('SAFE_LOWER', 'action', 960, 'compress', [
    anim(0, 'hands', 'push'), tw(0, 'plungerHandle', { y: HANDLE.down }, 300, 'inOutQuad'), handsAway(320),
    sound(0, 'crank', 0.7), sound(220, 'crank', 0.75), sound(440, 'crank', 0.8), sound(660, 'crank', 0.85),
    tw(80, SAFE, { x: DESK.x, y: DESK.y, rot: 0 }, 760, 'inOutQuad'), sound(840, 'thump', 0.8), fx(840, 'dust', DESK.x, DESK.y + 106, 6),
    anim(300, 'boss', 'lookup'), anim(760, 'boss', 'confused'), tw(0, 'camera', { x: 700, y: 360, sx: 1.08 }, 800, 'inOutQuad'),
  ])),

  // ---------------------------------------------------------------- TWIST
  /** Le COO se pose sur le coffre qui tourne, le chevauche… et prend les commandes. */
  paced(0.85, seg('SAFE_T_COO', 'twist', 900, 'compress', [
    ...coo.flyTo(0, { x: 470, y: 196 }, 240), anim(240, 'coo', 'salute'), sound(260, 'coo', 1.4),
    tw(240, SAFE, { x: 650, y: 250, rot: 0 }, 300, 'inOutQuad'), tw(240, 'coo', { x: 650, y: 236 }, 300, 'inOutQuad'),
    tw(540, SAFE, { x: 820, y: 220, rot: -0.4 }, 300, 'inOutQuad'), tw(540, 'coo', { x: 820, y: 206 }, 300, 'inOutQuad'),
    anim(300, 'boss', 'confused'), tw(0, 'camera', { x: 650, y: 300, sx: 1.04 }, 600, 'inOutQuad'),
  ])),

  // ---------------------------------------------------------------- FINS
  /** GAIN : sur le crâne (reveal au contact, bibliothèque IMPACT). */
  seg('SAFE_E_SQUASH', 'action', 180, 'compress', [
    tw(0, SAFE, { y: HEAD_Y }, 170, 'inQuad'), anim(60, 'boss', 'duck'), tw(0, 'camera', { x: 640, y: 360, sx: 1.12 }, 170, 'inQuad'),
  ]),
  /** PERTE (BACKFIRE) : il fait rouler son fauteuil-fusée d'un coup de talon ; le coffre traverse le plancher. */
  seg('SAFE_E_DODGE', 'action', 900, 'compress', [
    ...bb.dodge(0), tw(0, 'boss', { x: 470 }, 180, 'outQuad'), sound(0, 'roll', 1.3),
    tw(0, SAFE, { y: 460 }, 150, 'inQuad'), ...impactFrame(150, 30, 40), sound(150, 'boom'), sound(152, 'crash'), shake(150, 380, 10),
    fx(150, 'debris', 650, 556, 16), fx(160, 'dust', 650, 540, 20), tw(160, SAFE, { y: 620, alpha: 0 }, 160, 'inQuad'),
    signal(200, 'reveal'), sound(420, 'rumble', 0.8), anim(360, 'boss', 'lookdown'), anim(620, 'boss', 'laugh'), sound(640, 'laugh'),
    tw(100, 'camera', { x: 580, y: 400, sx: 1.06 }, 400, 'inOutQuad'),
  ]),
  /** PERTE (TEASE) : la corde n'avait pas cassé : elle s'étire, BOING, le coffre rebondit à un cheveu. Il ne lève pas les yeux. */
  seg('SAFE_E_BOING', 'action', 1000, 'compress', [
    state(0, SAFE, 'rope=on'), tw(0, SAFE, { y: HEAD_Y - 12 }, 130, 'inQuad'), sound(130, 'boing', 0.6), tw(130, SAFE, { y: H.y + 20 }, 260, 'outQuad'),
    tw(390, SAFE, { y: HEAD_Y - 30 }, 200, 'inOutQuad'), sound(590, 'boing', 0.8), tw(590, SAFE, { y: H.y + 10 }, 240, 'outQuad'),
    anim(0, 'boss', 'sip'), silence(130, 500), signal(260, 'reveal'), sound(700, 'sip'), sound(880, 'hmpf', 1.2),
    tw(0, 'camera', { x: 640, y: 330, sx: 1.12 }, 300, 'inOutQuad'),
  ]),
  /**
   * GROS GAIN (mise en scène) : le coffre l'emporte À TRAVERS le plancher. Ralenti au contact, image d'impact, trou,
   * puis les étages défilent (ascenseur qui s'affole) ; le plafond d'en dessous encaisse.
   */
  seg('SAFE_E_THROUGH', 'action', 760, 'compress', [
    ...cam.slowmo(0, 170, 0.35), tw(0, SAFE, { y: HEAD_Y }, 170, 'inQuad'), anim(80, 'boss', 'lookcam'),
    ...impactFrame(170, 30, 60), sound(170, 'boom'), sound(172, 'crash'), shake(170, 420, 12), fx(180, 'debris', 650, 556, 20),
    anim(200, 'boss', 'fall'), tw(200, 'boss', { y: 900 }, 300, 'inQuad'), tw(200, SAFE, { y: 740, alpha: 0 }, 300, 'inQuad'),
    fx(200, 'dust', 650, 540, 26), sound(420, 'elevator', 1.3), sound(540, 'elevator', 1.15), sound(660, 'elevator', 1.0),
    tw(100, 'camera', { x: 650, y: 430, sx: 1.18 }, 500, 'inOutQuad'),
  ]),
  /** BOSS FIGHT : il recule ; le coffre tombe devant lui, la porte saute : une lumière DORÉE. */
  seg('SAFE_E_GOLDDROP', 'twist', 900, 'compress', [
    ...bb.dodge(0), tw(0, 'boss', { x: 560 }, 160, 'outQuad'), tw(0, SAFE, { y: 450 }, 160, 'inQuad'), sound(160, 'boom'), shake(160, 260, 7),
    state(260, SAFE, 'door=open'), sound(280, 'clunk'), silence(280, 200), fx(420, 'gold', 650, 500, 16), sound(430, 'gold'),
    tw(420, 'glow', { x: 650, y: 500, alpha: 0.9 }, 300, 'outQuad'), state(640, 'boss', 'mug=gold'), anim(660, 'boss', 'furious'),
    tw(800, 'glow', { alpha: 0 }, 100), tw(0, 'camera', { x: 610, y: 400, sx: 1.08 }, 500, 'inOutQuad'),
  ]),
  /** PERTE : la corde cède au bout du tour ; le coffre file par la fenêtre. B.B. lui fait au revoir. */
  seg('SAFE_E_OUT', 'action', 900, 'compress', [
    state(0, SAFE, 'rope=cut'), sound(0, 'snap', 0.8), tw(0, SAFE, { x: 236, y: 260, rot: 2 }, 300, 'outQuad'),
    sound(300, 'glass'), state(300, 'window', 'broken'), fx(300, 'glass', 220, 250, 16), tw(300, SAFE, { x: 120, y: 330, alpha: 0 }, 200, 'inQuad'),
    signal(340, 'reveal'), anim(380, 'boss', 'wave'), sound(420, 'laugh', 1.1), tw(0, 'camera', { x: 470, y: 330, sx: 1.04 }, 400, 'inOutQuad'),
  ]),
  /** GAIN : au retour, le coffre lui frôle le crâne (BONK). */
  seg('SAFE_E_CLIP', 'action', 300, 'compress', [
    tw(0, SAFE, { x: 646, y: HEAD_Y - 10, rot: -0.2 }, 280, 'inQuad'), anim(160, 'boss', 'scared'), sound(20, 'whoosh', 1.1),
    tw(0, 'camera', { x: 640, y: 340, sx: 1.1 }, 280, 'inQuad'),
  ]),
  /**
   * GROS GAIN : le coffre heurte le fauteuil-fusée (décor UNHINGED) : la fusée s'allume ! B.B. regarde l'objectif…
   * et décolle à travers le plafond.
   */
  seg('SAFE_E_IGNITE', 'action', 760, 'compress', [
    tw(0, SAFE, { x: 700, y: 420, rot: 0.3 }, 200, 'inQuad'), sound(200, 'clang'), shake(200, 200, 5),
    fx(260, 'flame', 60, 0, 18, 'boss'), sound(260, 'roar'), anim(280, 'boss', 'lookcam'), ...cam.hitStop(300, 120),
    anim(420, 'boss', 'scared'), tw(420, 'boss', { y: 150 }, 320, 'inQuad'), fx(420, 'flame', 60, 0, 22, 'boss'), sound(430, 'whoosh', 0.8),
    tw(200, 'camera', { x: 640, y: 280, sx: 1.04 }, 500, 'inOutQuad'),
  ]),
  /** PERTE : le COO pilote le coffre et le gare délicatement sur le bureau. B.B. applaudit le pilote. */
  seg('SAFE_E_COOPARK', 'action', 900, 'compress', [
    tw(0, SAFE, { x: DESK.x, y: DESK.y, rot: 0 }, 420, 'inOutQuad'), tw(0, 'coo', { x: DESK.x, y: DESK.y - 14 }, 420, 'inOutQuad'),
    sound(420, 'thump', 1.2), anim(440, 'coo', 'salute'), signal(460, 'reveal'), anim(500, 'boss', 'smirk'), sound(520, 'hmpf'),
    tw(0, 'camera', { x: 720, y: 360, sx: 1.08 }, 400, 'inOutQuad'),
  ]),
  /** GAIN : le COO saute et donne un coup de patte : le coffre part droit sur B.B. */
  seg('SAFE_E_COOKICK', 'action', 300, 'compress', [
    ...coo.escape(0, { x: 900, y: 120 }), tw(20, SAFE, { x: 650, y: HEAD_Y, rot: 0 }, 260, 'inQuad'), anim(140, 'boss', 'scared'),
    tw(0, 'camera', { x: 660, y: 340, sx: 1.1 }, 280, 'inQuad'),
  ]),
  /** PERTE (TEASE) : il ouvre le coffre : dedans, un café fumant. Il le prend. */
  seg('SAFE_E_COFFEE', 'action', 700, 'compress', [
    anim(0, 'boss', 'catch'), ...openDoor(120), fx(200, 'steam', DESK.x, DESK.y + 40, 8), signal(260, 'reveal'),
    anim(360, 'boss', 'smug'), sound(380, 'hmpf', 1.1), tw(0, 'camera', { x: 720, y: 380, sx: 1.12 }, 400, 'inOutQuad'),
  ]),
  /** GAIN : il ouvre : un gant de boxe à ressort. */
  seg('SAFE_E_GLOVE', 'action', 400, 'compress', [
    anim(0, 'boss', 'catch'), ...openDoor(100), tw(120, 'safeGlove', { x: DESK.x - 50, y: DESK.y + 50, alpha: 1, sx: 0.2 }, 1, 'linear'),
    tw(122, 'safeGlove', { sx: -1.1 }, 140, 'outBack'), sound(122, 'boing', 1.2), sound(262, 'bonk'), anim(262, 'boss', 'scared'),
    tw(0, 'camera', { x: 700, y: 380, sx: 1.12 }, 300, 'inOutQuad'),
  ]),
  /** GAIN : la porte s'ouvre d'un coup et le frappe en pleine figure. */
  seg('SAFE_E_DOOR', 'action', 300, 'compress', [
    anim(0, 'boss', 'lookdown'), tw(0, 'boss', { x: 690 }, 200, 'inOutQuad'), silence(0, 200), ...openDoor(220), sound(222, 'clang', 1.1),
    tw(0, 'camera', { x: 720, y: 380, sx: 1.14 }, 280, 'inOutQuad'),
  ]),
  /**
   * VERY RARE (perte) : dans le coffre, un coffre plus petit ; dedans, un plus petit encore… et au fond, une
   * sonnette de bureau. Il sonne (« ting »). Wendell arrive au pas de course, un café à la main. LE SIP.
   */
  seg('SAFE_E_NESTED', 'action', 1500, 'compress', [
    anim(0, 'boss', 'catch'), ...openDoor(100), silence(160, 300),
    fx(300, 'dust', DESK.x, DESK.y + 60, 3), sound(320, 'clunk', 1.4), fx(520, 'dust', DESK.x, DESK.y + 64, 2), sound(540, 'clunk', 1.8),
    anim(560, 'boss', 'confused'), signal(600, 'reveal'), anim(760, 'boss', 'ring'), tw(780, 'bell', { rot: 0.35 }, 60, 'linear'),
    tw(840, 'bell', { rot: 0 }, 220, 'outElastic'), sound(780, 'tink', 1.7), ...wendell.runIn(900, 760, 300), anim(1220, 'wendell', 'thumbsup'),
    ...cam.push(0, 720, 380, 1.14, 500), ...cam.recover(1100, 380),
  ]),
  /** BOSS FIGHT : il ouvre le coffre : une lumière DORÉE en sort. */
  seg('SAFE_E_GOLDLOWER', 'twist', 800, 'compress', [
    anim(0, 'boss', 'catch'), ...openDoor(100), silence(120, 220), fx(220, 'gold', DESK.x, DESK.y + 40, 18), sound(240, 'gold'),
    tw(220, 'glow', { x: DESK.x, y: DESK.y + 40, alpha: 0.9 }, 300, 'outQuad'), state(480, 'boss', 'mug=gold'), anim(500, 'boss', 'furious'),
    tw(680, 'glow', { alpha: 0 }, 120), tw(0, 'camera', { x: 700, y: 380, sx: 1.08 }, 400, 'inOutQuad'),
  ]),
  seg('SAFE_FLOORS', 'reaction', 500, 'compress', [
    fx(0, 'dust', 650, 540, 10), sound(120, 'rumble', 0.9), tw(0, 'camera', { x: 500, y: 350, sx: 1 }, 400, 'inOutQuad'),
  ]),
];

export const ceilingSafe: GadgetDef = {
  id: 'ceiling-safe',
  label: 'CEILING SAFE',
  rageLevel: 'unhinged',
  layout: {
    ...UNHINGED_DECOR,
    safe: { transform: { x: H.x, y: H.y, rot: 0 }, states: { rope: 'on', door: 'closed' } },
    plunger: { transform: { x: PLUNGER.x, y: PLUNGER.y, sx: 0.9, sy: 0.9 } },
    plungerHandle: { transform: { x: HANDLE.x, y: HANDLE.rest, sx: 0.9, sy: 0.9 } },
    safeGlove: { transform: { x: DESK.x - 50, y: DESK.y + 50, alpha: 0 } },
  },
  props: ['safe', 'plunger', 'plungerHandle', 'safeGlove'],
  trunk: ['SAFE_IN', 'SAFE_ARM'],
  hold: { sound: 'creak', everyMs: 680 },
  signature: ['creak', 'chain', 'boom', 'crank'],
  bfProjectiles: ['safe', 'glove', 'safe'],
  pick: {
    layer: 'front',
    box: { x: PLUNGER.x - 62, y: PLUNGER.y - 104, w: 124, h: 114 },
    spot: { x: PLUNGER.x, y: PLUNGER.y - 2, sx: 0.8 },
    idle: [
      { actor: 'safe', prop: 'rot', amp: 0.05, periodMs: 1400 },
      { actor: 'plungerHandle', prop: 'y', amp: -3, periodMs: 500 },
    ],
  },
  segments: segments(SEGMENTS),
  branches: [
    compose('SAFE-D1', 'Sur le crâne', [DROP], [{ seg: 'SAFE_E_SQUASH' }, { impact: 'none' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('SAFE-D2', 'Coup de talon', [DROP], [{ seg: 'SAFE_E_DODGE' }], { categories: ['BACKFIRE', 'CLEAN_MISS'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('SAFE-D3', 'Boing', [DROP], [{ seg: 'SAFE_E_BOING' }], { categories: ['TEASE', 'CLEAN_MISS'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('SAFE-D4', 'À travers le plancher', [DROP], [{ seg: 'SAFE_E_THROUGH' }, { impact: 'floor' }, { seg: 'SAFE_FLOORS' }, { reaction: 'away' }], { categories: ['DIRECT', 'COMEBACK', 'CHAIN', 'SUPER'], classes: WIN_BIG, rarity: 'COMMON', d1: D1 }),
    compose('SAFE-D5', 'Coffre doré', [DROP], [{ seg: 'SAFE_E_GOLDDROP' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'COMMON', d1: D1 }),
    compose('SAFE-S1', 'Par la fenêtre', [SWING], [{ seg: 'SAFE_E_OUT' }], { categories: ['CLEAN_MISS', 'BACKFIRE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('SAFE-S2', 'Au passage', [SWING], [{ seg: 'SAFE_E_CLIP' }, { impact: 'none' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('SAFE-S3', 'La fusée s\'allume', [SWING], [{ seg: 'SAFE_E_IGNITE' }, { impact: 'ceiling' }, { reaction: 'away' }], { categories: ['CHAIN', 'SUPER', 'COMEBACK', 'DIRECT'], classes: WIN_BIG, rarity: 'UNCOMMON', d1: D1 }),
    compose('SAFE-C1', 'Créneau du COO', [SWING, COO], [{ seg: 'SAFE_E_COOPARK' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'RARE', d1: D1 }),
    compose('SAFE-C2', 'Coup de patte', [SWING, COO], [{ seg: 'SAFE_E_COOKICK' }, { impact: 'none' }, { reaction: 'auto' }], { categories: ['COMEBACK', 'CHAIN', 'DIRECT'], classes: WIN_MID, rarity: 'RARE', d1: D1 }),
    compose('SAFE-L1', 'Café au coffre', [LOWER], [{ seg: 'SAFE_E_COFFEE' }, { reaction: 'SIP' }], { categories: ['TEASE', 'CLEAN_MISS'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('SAFE-L2', 'Le gant', [LOWER], [{ seg: 'SAFE_E_GLOVE' }, { impact: 'overdesk' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('SAFE-L3', 'La porte', [LOWER], [{ seg: 'SAFE_E_DOOR' }, { impact: 'overdesk' }, { reaction: 'auto' }], { categories: ['DIRECT', 'COMEBACK', 'CHAIN'], classes: WIN_MID, rarity: 'UNCOMMON', d1: D1 }),
    compose('SAFE-L4', 'Poupées russes', [LOWER], [{ seg: 'SAFE_E_NESTED' }], { categories: ['CLEAN_MISS', 'TEASE', 'BACKFIRE'], classes: LOSS, rarity: 'VERY_RARE', d1: D1 }),
    compose('SAFE-L5', 'Trésor doré', [LOWER], [{ seg: 'SAFE_E_GOLDLOWER' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'UNCOMMON', d1: D1 }),
  ],
};
