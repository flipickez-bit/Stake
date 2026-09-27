/**
 * PLAN C · COPIER CATAPULT (GRUMPY) — gadget de PRODUCTION (17 branches).
 * Une photocopieuse dont le capot sert de bras de catapulte, posée sur le bureau du joueur.
 * Signature sonore : CLUNK du capot, PAPER des copies, SNAP du ressort, BOING du lancer.
 *
 * Tronc neutre : le joueur enfonce le gros bouton vert ; la machine chauffe, tremble, crache une feuille.
 * DÉBUTS VISIBLES (chacun mène à des pertes ET à des gains) :
 *   LAUNCH   : le capot se relève d'un coup et catapulte la ramette en cloche (même sommet pour toutes les fins).
 *   COO      : le COO intercepte la ramette en vol et se débat avec… (il la lâche où ?)
 *   BLIZZARD : la machine s'emballe et crache des centaines de copies vers B.B.
 *   JAM      : bourrage ; la machine broie, voyant rouge, fumée. B.B. ricane déjà.
 *   FIX      : Wendell vient réparer la machine… d'un coup de pied.
 */
import type { GadgetDef, SegmentDef } from '../../../presentation/types';
import { anim, BOSS_FIGHT, compose, fx, impactFrame, LOSS, mod, paced, punch, seg, segments, shake, signal, silence, sound, state, tw, WIN_ANY, WIN_BIG, WIN_MID, WIN_SMALL } from '../../dsl';
import { bb, cam, coo, props, wendell, wobble } from '../../kit';
import { COP, COP_REAM as REAM, FRONT_DY, PLAN_SCALE as S } from '../stations';

const D1 = 'warmed-up';

/** Sommet commun de la cloche (identique dans toutes les fins : la divergence n'arrive qu'à la retombée). */
const APEX = { x: 700, y: 230 };
const RISE_MS = 300;
const FACE = { x: 632, y: 388 };
const HEAD = { x: 644, y: 332 };
const MUG = { x: 600, y: 430 };
const BUTTON_W = { x: COP.button.x - 30, y: COP.button.y + 36 + FRONT_DY };
/** Bac de sortie (monde) : les copies en sortent. */
const TRAY = { x: COP.sheet.x - 20, y: COP.sheet.y + FRONT_DY };

const handsAway = (at: number) => tw(at, 'hands', { y: 1060 }, 220, 'inQuad');

/** Retombée de la ramette depuis sa position courante. */
const fall = (at: number, to: { x: number; y: number }, ms: number, rot = -3.4) => [
  tw(at, 'ream', { x: to.x, y: to.y }, ms, 'inQuad'), tw(at, 'ream', { rot }, ms, 'linear'),
];
const reamGone = (at: number) => tw(at, 'ream', { alpha: 0 }, 20, 'linear');
/** Le capot se relève d'un coup (ressort). */
const lidSnap = (at: number) => [
  tw(at, 'copLid', { rot: -1.25 }, 70, 'outQuad'), tw(at + 70, 'copLid', { rot: -1.05 }, 200, 'outElastic'),
  sound(at, 'snap'), sound(at + 10, 'boing', 0.8), shake(at, 140, 3),
];
const lidClose = (at: number) => [tw(at, 'copLid', { rot: 0 }, 70, 'inQuad'), sound(at + 70, 'clunk', 1.1)];
/** Une nouvelle ramette réapparaît sur le capot (la machine en a plein ses tiroirs). */
const reload = (at: number) => tw(at, 'ream', { x: REAM.x, y: REAM.y, rot: 0, alpha: 1 }, 1, 'linear');

const LAUNCH = mod('LAUNCH', { seg: 'COP_LAUNCH' });
const COO = mod('COO', { seg: 'COP_T_COO' });
const BLIZZARD = mod('BLIZZARD', { seg: 'COP_BLIZZARD' });
const JAM = mod('JAM', { seg: 'COP_JAM' });
const FIX = mod('WENDELL_FIX', { seg: 'COP_T_FIX' });

const SEGMENTS: SegmentDef[] = [
  // ---------------------------------------------------------------- tronc (neutre, avant le résultat)
  seg('COP_IN', 'intro', 450, 'compress', [
    anim(0, 'hands', 'open'), tw(0, 'hands', { x: BUTTON_W.x, y: BUTTON_W.y }, 360, 'outBack'),
    anim(0, 'boss', 'sip'), anim(360, 'hands', 'grab'), tw(360, 'hands', { y: BUTTON_W.y + 8 }, 60, 'inQuad'), sound(380, 'click'),
    state(390, 'copier', 'scan'),
  ]),
  seg('COP_WARM', 'setup', 700, 'compress', [
    tw(0, 'copier', { sy: S * 0.97, sx: S * 1.02 }, 110, 'inOutQuad'), tw(110, 'copier', { sy: S * 1.02, sx: S * 0.99 }, 110, 'inOutQuad'),
    tw(220, 'copier', { sy: S * 0.97, sx: S * 1.02 }, 110, 'inOutQuad'), tw(330, 'copier', { sy: S, sx: S }, 160, 'outQuad'),
    tw(80, 'copSheet', { x: COP.sheet.x - 24 }, 180, 'outQuad'), tw(420, 'copSheet', { x: COP.sheet.x }, 160, 'inQuad'),
    tw(0, 'copLid', { rot: -0.06 }, 90, 'outQuad'), tw(90, 'copLid', { rot: 0 }, 90, 'inQuad'),
    tw(300, 'copLid', { rot: -0.08 }, 90, 'outQuad'), tw(390, 'copLid', { rot: 0 }, 90, 'inQuad'),
    sound(0, 'clunk'), sound(80, 'paper'), sound(300, 'clunk', 1.2), sound(420, 'paper', 1.2), fx(120, 'papers', TRAY.x, TRAY.y, 2),
    anim(200, 'boss', 'oblivious'), tw(0, 'camera', { x: 640, y: 390, sx: 1.05 }, 600, 'inOutQuad'),
  ]),

  // ---------------------------------------------------------------- DÉBUTS
  /** Commun à 6 fins : le capot catapulte la ramette jusqu'au sommet de la cloche. */
  seg('COP_LAUNCH', 'action', 380, 'compress', [
    anim(0, 'hands', 'open'), handsAway(30), state(0, 'copier', 'idle'), ...lidSnap(0),
    tw(20, 'ream', { x: APEX.x, y: APEX.y }, RISE_MS, 'outQuad'), tw(20, 'ream', { rot: -2.4 }, RISE_MS, 'linear'),
    sound(40, 'whoosh', 1.2), fx(20, 'papers', REAM.x, REAM.y, 4), anim(120, 'boss', 'lookup'),
    tw(0, 'camera', { x: 640, y: 330, sx: 1.04 }, 340, 'outQuad'),
  ]),
  /** La machine s'emballe : un torrent de copies part vers le bureau de B.B. */
  seg('COP_BLIZZARD', 'action', 820, 'compress', [
    anim(0, 'hands', 'open'), handsAway(30), state(0, 'copier', 'berserk'), shake(0, 600, 3),
    ...wobble(0, 'copSheet', 0, 0.2, 8, 60),
    fx(0, 'papers', TRAY.x, TRAY.y, 16), fx(150, 'papers', TRAY.x - 40, TRAY.y - 30, 22), fx(300, 'papers', 700, 450, 26), fx(450, 'papers', 650, 430, 30), fx(600, 'papers', 620, 420, 30),
    sound(0, 'paper', 0.8), sound(150, 'paper', 0.9), sound(300, 'paper', 1.0), sound(450, 'paper', 1.1), sound(600, 'paper', 1.2), sound(20, 'whirr', 1.4),
    anim(200, 'boss', 'surprised'), anim(420, 'boss', 'duck'),
    tw(0, 'camera', { x: 640, y: 400, sx: 1.08 }, 600, 'inOutQuad'),
  ]),
  /** Bourrage : la machine broie, voyant rouge, fumée ; le capot claque. B.B. ricane. */
  seg('COP_JAM', 'action', 760, 'compress', [
    anim(0, 'hands', 'open'), handsAway(30), state(40, 'copier', 'jam'),
    ...wobble(40, 'copLid', 0, -0.1, 5, 80), sound(40, 'crank', 0.8), sound(260, 'crank', 0.7), sound(460, 'rattle', 0.8),
    tw(80, 'copSheet', { x: COP.sheet.x - 10, rot: 0.25 }, 160, 'outQuad'), fx(200, 'smoke', COP.body.x, COP.body.y - 120 + FRONT_DY, 6),
    sound(220, 'pfft', 0.6), anim(300, 'boss', 'smirk'), tw(0, 'camera', { x: 680, y: 420, sx: 1.08 }, 520, 'inOutQuad'),
  ]),

  // ---------------------------------------------------------------- TWISTS
  /** Le COO intercepte la ramette au sommet et se débat avec, au-dessus du bureau. */
  seg('COP_T_COO', 'twist', 820, 'compress', [
    ...coo.flyTo(0, { x: APEX.x - 6, y: APEX.y - 20 }, 260), anim(270, 'coo', 'carry'), sound(270, 'coo', 1.6),
    tw(270, 'ream', { x: 640, y: 260 }, 250, 'inOutQuad'), tw(270, 'coo', { x: 634, y: 240 }, 250, 'inOutQuad'),
    tw(520, 'ream', { x: 690, y: 280 }, 250, 'inOutQuad'), tw(520, 'coo', { x: 684, y: 260 }, 250, 'inOutQuad'),
    fx(300, 'feathers', 640, 250, 6), sound(560, 'coo', 1.3), anim(300, 'boss', 'confused'),
    tw(0, 'camera', { x: 660, y: 300, sx: 1.06 }, 500, 'inOutQuad'),
  ]),
  /** Wendell arrive avec sa caisse à outils… et donne un grand coup de pied dans la machine. */
  paced(0.85, seg('COP_T_FIX', 'twist', 960, 'compress', [
    ...wendell.walkIn(0, 900, 480), anim(500, 'wendell', 'look'), silence(500, 300),
    anim(760, 'wendell', 'push'), sound(800, 'bonk', 0.8), shake(800, 200, 5), tw(800, 'copier', { rot: 0.06 }, 60, 'outQuad'), tw(860, 'copier', { rot: 0 }, 300, 'outElastic'),
    tw(0, 'camera', { x: 720, y: 420, sx: 1.04 }, 600, 'inOutQuad'),
  ])),

  // ---------------------------------------------------------------- FINS (chacune contient la révélation)
  /** PERTE : la ramette retombe sur la machine, le capot claque, bourrage. B.B. rit. */
  seg('COP_E_BOUNCEBACK', 'action', 950, 'compress', [
    ...fall(0, { x: REAM.x - 20, y: REAM.y }, 320),
    tw(300, 'copLid', { rot: 0 }, 60, 'inQuad'), sound(320, 'crash', 0.9), shake(320, 200, 4),
    state(330, 'copier', 'jam'), fx(340, 'smoke', COP.body.x, COP.body.y - 120 + FRONT_DY, 8), fx(330, 'papers', COP.body.x, COP.body.y - 112 + FRONT_DY, 10), sound(360, 'deflate'),
    tw(380, 'copSheet', { x: COP.sheet.x - 13, rot: 0.3 }, 120, 'outQuad'),
    anim(420, 'boss', 'laugh'), signal(460, 'reveal'), sound(480, 'laugh'),
    tw(400, 'camera', { x: 600, y: 360, sx: 1 }, 400, 'inOutQuad'),
  ]),
  /** PERTE : la ramette éclate au-dessus de B.B. — pluie de copies ; il continue de siroter. */
  seg('COP_E_RAIN', 'action', 1000, 'compress', [
    tw(0, 'ream', { x: 650, y: 250 }, 180, 'linear'), reamGone(180),
    sound(180, 'paper'), fx(180, 'papers', 650, 250, 40), anim(200, 'boss', 'sip'),
    signal(520, 'reveal'), sound(600, 'sip'), sound(760, 'hmpf', 1.1),
    tw(200, 'camera', { x: 580, y: 360, sx: 1.06 }, 500, 'inOutQuad'),
  ]),
  /** PERTE (TEASE) : il attrape la ramette d'une main, l'ouvre, lit une copie… et la froisse. */
  seg('COP_E_READ', 'action', 900, 'compress', [
    ...fall(0, { x: 600, y: 440 }, 300, -6.28), anim(120, 'boss', 'catch'), sound(300, 'thump', 1.3), reamGone(302),
    signal(330, 'reveal'), anim(360, 'boss', 'confused'), sound(420, 'paper', 1.3), fx(420, 'papers', 600, 430, 3),
    anim(640, 'boss', 'smug'), sound(660, 'paper', 0.8), tw(200, 'camera', { x: 600, y: 390, sx: 1.12 }, 400, 'outQuad'),
  ]),
  /** GAIN : la ramette retombe sur B.B. (reveal au contact, bibliothèque IMPACT). */
  seg('COP_E_HIT', 'action', 300, 'compress', [
    ...fall(0, FACE, 280), anim(120, 'boss', 'scared'), reamGone(290),
    fx(280, 'papers', FACE.x, FACE.y, 16), tw(0, 'camera', { x: 600, y: 380, sx: 1.1 }, 280, 'inQuad'),
  ]),
  /**
   * GROS GAIN : la machine s'emballe (capot qui claque, deux ramettes de plus), SILENCE, puis les trois ramettes
   * retombent en cascade sur B.B. (ralenti sur la dernière).
   */
  seg('COP_E_AVALANCHE', 'action', 790, 'compress', [
    state(0, 'copier', 'berserk'), shake(0, 420, 5),
    ...lidClose(0), ...lidSnap(120), sound(120, 'snap', 1.2), ...lidClose(240), ...lidSnap(330), sound(330, 'snap', 1.4),
    fx(120, 'papers', 760, 380, 30), fx(330, 'papers', 740, 360, 30), sound(360, 'paper', 0.8), anim(200, 'boss', 'scared'),
    silence(430, 160), ...cam.slowmo(560, 180, 0.45),
    ...fall(480, FACE, 300), reamGone(782), fx(780, 'papers', FACE.x, FACE.y, 40),
    tw(300, 'camera', { x: 600, y: 360, sx: 1.12 }, 480, 'inOutQuad'),
  ]),
  /** BOSS FIGHT : la ramette frappe le mug… qui devient DORÉ. */
  seg('COP_E_GOLD', 'twist', 700, 'compress', [
    ...fall(0, MUG, 280), reamGone(282), sound(280, 'tink', 1.2), punch(280, 180, 4),
    fx(280, 'papers', MUG.x, MUG.y, 12), state(320, 'boss', 'mug=gold'), sound(340, 'gold'), fx(340, 'gold', MUG.x, MUG.y - 10, 18),
    anim(380, 'boss', 'furious'), tw(300, 'camera', { x: 560, y: 360, sx: 1.08 }, 300, 'outQuad'),
  ]),
  /**
   * VERY RARE (perte) : au sommet, la ramette se déplie en escadrille d'avions en papier. Ralenti ; ils tournent
   * autour de B.B. et se posent un à un dans sa bannette. Il leur rend leur salut ; le COO aussi.
   */
  seg('COP_E_SQUADRON', 'action', 1500, 'compress', [
    reamGone(0), ...cam.slowmo(0, 500, 0.45), sound(0, 'paper', 1.5), sound(0, 'whoosh', 0.7),
    fx(0, 'papers', APEX.x, APEX.y, 18), fx(160, 'papers', 560, 300, 14), fx(320, 'papers', 760, 320, 14), fx(480, 'papers', 640, 380, 12),
    sound(200, 'whoosh', 1.2), sound(420, 'whoosh', 1.4), anim(0, 'boss', 'lookup'), anim(560, 'boss', 'confused'),
    signal(640, 'reveal'), anim(760, 'boss', 'wave'), sound(780, 'hmpf', 1.3), fx(700, 'papers', 760, 420, 8), sound(720, 'paper', 1.6),
    ...coo.salute(900), ...cam.push(0, 640, 330, 1.02, 600, 'inOutQuad'), ...cam.recover(1100, 380),
  ]),
  /** PERTE : le COO file par la fenêtre avec la ramette (il construit un nid ?). */
  seg('COP_E_COOAWAY', 'action', 800, 'compress', [
    anim(0, 'coo', 'fly'), tw(0, 'coo', { x: 230, y: 230 }, 420, 'inOutQuad'), tw(0, 'ream', { x: 236, y: 250 }, 420, 'inOutQuad'),
    sound(0, 'coo', 1.8), tw(420, 'coo', { alpha: 0 }, 120), tw(420, 'ream', { alpha: 0 }, 120), sound(430, 'whoosh', 1.6),
    anim(200, 'boss', 'laugh'), signal(460, 'reveal'), sound(480, 'laugh', 1.1),
    tw(0, 'camera', { x: 460, y: 330, sx: 1.04 }, 420, 'inOutQuad'), tw(620, 'coo', { x: 262, y: 342, rot: 0 }, 1, 'linear'), tw(640, 'coo', { alpha: 1 }, 160),
  ]),
  /** GAIN : le COO lâche la ramette… pile sur le crâne de B.B. (et salue). */
  seg('COP_E_COODROP', 'action', 360, 'compress', [
    anim(0, 'coo', 'salute'), sound(0, 'coo', 1.2), ...fall(40, HEAD, 280), anim(160, 'boss', 'lookup'), reamGone(322),
    fx(320, 'papers', HEAD.x, HEAD.y, 14), tw(0, 'camera', { x: 640, y: 340, sx: 1.12 }, 320, 'inQuad'),
  ]),
  /** PERTE : B.B. se protège derrière une feuille… et s'évente avec, satisfait. */
  seg('COP_E_FAN', 'action', 800, 'compress', [
    state(0, 'copier', 'idle'), fx(0, 'papers', 650, 420, 10), anim(80, 'boss', 'smirk'),
    signal(240, 'reveal'), anim(300, 'boss', 'catch'), sound(320, 'paper', 1.5), sound(480, 'paper', 1.4),
    anim(620, 'boss', 'smug'), sound(640, 'hmpf'), tw(0, 'camera', { x: 620, y: 400, sx: 1.12 }, 400, 'inOutQuad'),
  ]),
  /** GAIN : les copies l'ensevelissent ; la dernière ramette atterrit au sommet du tas. */
  seg('COP_E_BURY', 'action', 520, 'compress', [
    fx(0, 'papers', 650, 440, 40), fx(120, 'papers', 640, 400, 40), sound(0, 'paper', 0.7), anim(0, 'boss', 'duck'),
    ...lidSnap(140), reload(140), tw(160, 'ream', { x: 680, y: 260 }, 180, 'outQuad'), tw(160, 'ream', { rot: -2 }, 360, 'linear'),
    tw(340, 'ream', { x: HEAD.x, y: HEAD.y }, 170, 'inQuad'), reamGone(512), sound(340, 'whoosh', 1.3),
    tw(100, 'camera', { x: 640, y: 380, sx: 1.12 }, 400, 'inQuad'),
  ]),
  /**
   * GROS GAIN : le torrent de copies devient une tornade de papier qui arrache B.B. de son fauteuil et l'emporte
   * par la fenêtre (le COO s'enfuit ; B.B. regarde l'objectif, gel).
   */
  seg('COP_E_TORNADO', 'action', 780, 'compress', [
    fx(0, 'swirl', 650, 420, 14), fx(80, 'papers', 640, 400, 40), sound(0, 'gust'), sound(160, 'gust', 1.2),
    state(120, 'boss', 'seat=none'), anim(120, 'boss', 'airborne'), tw(120, 'boss', { y: 430, rot: 0.6 }, 240, 'outQuad'),
    tw(360, 'boss', { x: 236, y: 330, rot: -0.5 }, 340, 'inQuad'), ...coo.escape(300, { x: 90, y: 180 }),
    anim(520, 'boss', 'lookcam'), ...cam.hitStop(540, 110), fx(360, 'papers', 400, 360, 30),
    tw(100, 'camera', { x: 440, y: 350, sx: 1.12 }, 560, 'inOutQuad'),
  ]),
  /** Sortie par la fenêtre. */
  seg('COP_AWAY', 'impact', 700, 'compress', [
    ...bb.away(0, { x: 150, y: 240 }), ...props.portraitSwing(0), fx(40, 'papers', 440, 150, 12), sound(60, 'paper'),
    tw(300, 'camera', { x: 500, y: 350, sx: 1 }, 400, 'inOutQuad'),
  ]),
  /** PERTE : la machine rote une seule feuille, qui plane jusqu'aux pieds de B.B. Il éclate de rire. */
  seg('COP_E_BURP', 'action', 900, 'compress', [
    state(0, 'copier', 'idle'), sound(0, 'honk', 0.7), fx(0, 'papers', TRAY.x, TRAY.y, 1),
    tw(0, 'copSheet', { x: COP.sheet.x - 30, rot: -0.2 }, 200, 'outQuad'), tw(200, 'copSheet', { x: COP.sheet.x, rot: 0 }, 200, 'inQuad'),
    anim(240, 'boss', 'laugh'), signal(300, 'reveal'), sound(320, 'laugh'), fx(260, 'smoke', COP.body.x, COP.body.y - 120 + FRONT_DY, 4),
    tw(300, 'camera', { x: 600, y: 360, sx: 1 }, 400, 'inOutQuad'),
  ]),
  /** GAIN : la machine bloquée recrache tout le bac d'un coup : une ramette file droit sur B.B. */
  seg('COP_E_SPIT', 'action', 360, 'compress', [
    state(0, 'copier', 'berserk'), ...lidSnap(0), sound(0, 'boom', 1.2), fx(0, 'papers', REAM.x, REAM.y, 20),
    tw(10, 'ream', { x: FACE.x, y: FACE.y }, 300, 'outQuad'), tw(10, 'ream', { rot: -5 }, 300, 'linear'), sound(20, 'whoosh', 1.4),
    anim(140, 'boss', 'scared'), reamGone(312), fx(310, 'papers', FACE.x, FACE.y, 18),
    tw(0, 'camera', { x: 640, y: 380, sx: 1.1 }, 300, 'inQuad'),
  ]),
  /** BOSS FIGHT : le bourrage produit UNE feuille dorée, qui plane jusqu'à la main de B.B. */
  seg('COP_E_GOLDCOPY', 'twist', 900, 'compress', [
    silence(0, 240), state(0, 'copier', 'idle'), fx(100, 'gold', TRAY.x, TRAY.y, 10), sound(120, 'gold'),
    tw(100, 'glow', { x: 620, y: 440, alpha: 0.85 }, 420, 'outQuad'), fx(400, 'gold', MUG.x, MUG.y, 14),
    state(500, 'boss', 'mug=gold'), anim(540, 'boss', 'furious'), tw(700, 'glow', { alpha: 0 }, 200),
    tw(0, 'camera', { x: 620, y: 400, sx: 1.06 }, 500, 'inOutQuad'),
  ]),
  /** PERTE (BACKFIRE) : le coup de pied débloque la machine… qui crache la ramette dans l'estomac de Wendell. */
  seg('COP_E_WKICK', 'action', 800, 'compress', [
    ...lidSnap(0), tw(10, 'ream', { x: 900, y: 470 }, 180, 'outQuad'), sound(190, 'bonk', 1.3), anim(190, 'wendell', 'hit'),
    tw(190, 'wendell', { x: 1080, rot: 0.4 }, 300, 'outQuad'), reamGone(200), fx(190, 'papers', 900, 470, 16),
    anim(260, 'boss', 'laugh'), signal(300, 'reveal'), sound(320, 'laugh'),
    tw(0, 'camera', { x: 700, y: 380, sx: 1.04 }, 400, 'inOutQuad'),
  ]),
  /** GAIN : le coup de pied part droit : la ramette traverse la pièce et touche B.B. */
  seg('COP_E_WASSIST', 'action', 360, 'compress', [
    ...lidSnap(0), tw(10, 'ream', { x: FACE.x, y: FACE.y }, 300, 'outQuad'), tw(10, 'ream', { rot: -4 }, 300, 'linear'), sound(20, 'whoosh', 1.3),
    anim(140, 'boss', 'scared'), anim(60, 'wendell', 'thumbsup'), reamGone(312), fx(310, 'papers', FACE.x, FACE.y, 18),
    tw(0, 'camera', { x: 640, y: 380, sx: 1.1 }, 300, 'inQuad'),
  ]),
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
    ream: { transform: { x: REAM.x, y: REAM.y, rot: 0, sx: S, sy: S } },
  },
  props: ['copier', 'copLid', 'copSheet', 'ream'],
  trunk: ['COP_IN', 'COP_WARM'],
  hold: { sound: 'clunk', everyMs: 650 },
  signature: ['clunk', 'paper', 'snap', 'boing'],
  pick: {
    layer: 'front',
    box: { x: COP.body.x - 80, y: COP.body.y - 160, w: 165, h: 170 },
    spot: { x: COP.body.x, y: COP.body.y - 2, sx: 1.05 },
    idle: [
      { actor: 'copSheet', prop: 'x', amp: -8, periodMs: 900 },
      { actor: 'copLid', prop: 'rot', amp: -0.03, periodMs: 520 },
    ],
  },
  segments: segments(SEGMENTS),
  branches: [
    compose('COP-L1', 'Retour à l\'envoyeur', [LAUNCH], [{ seg: 'COP_E_BOUNCEBACK' }], { categories: ['BACKFIRE', 'CLEAN_MISS'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('COP-L2', 'Pluie de copies', [LAUNCH], [{ seg: 'COP_E_RAIN' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('COP-L3', 'Lecture', [LAUNCH], [{ seg: 'COP_E_READ' }], { categories: ['TEASE', 'CLEAN_MISS'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('COP-L4', 'Ramette', [LAUNCH], [{ seg: 'COP_E_HIT' }, { impact: 'overdesk' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('COP-L5', 'Avalanche', [LAUNCH], [{ seg: 'COP_E_AVALANCHE' }, { impact: 'overdesk' }, { reaction: 'auto' }], { categories: ['DIRECT', 'COMEBACK', 'CHAIN', 'SUPER'], classes: WIN_BIG, rarity: 'COMMON', d1: D1 }),
    compose('COP-L7', 'Escadrille', [LAUNCH], [{ seg: 'COP_E_SQUADRON' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'VERY_RARE', d1: D1 }),
    compose('COP-L6', 'Copie dorée', [LAUNCH], [{ seg: 'COP_E_GOLD' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'COMMON', d1: D1 }),
    compose('COP-C1', 'Le COO l\'emporte', [LAUNCH, COO], [{ seg: 'COP_E_COOAWAY' }], { categories: ['CLEAN_MISS', 'TEASE', 'BACKFIRE'], classes: LOSS, rarity: 'RARE', d1: D1 }),
    compose('COP-C2', 'Le COO la lâche', [LAUNCH, COO], [{ seg: 'COP_E_COODROP' }, { impact: 'none' }, { reaction: 'auto' }], { categories: ['COMEBACK', 'DIRECT', 'GRAZE'], classes: WIN_ANY, rarity: 'RARE', d1: D1 }),
    compose('COP-B1', 'L\'éventail', [BLIZZARD], [{ seg: 'COP_E_FAN' }, { reaction: 'SIP' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('COP-B2', 'Enseveli', [BLIZZARD], [{ seg: 'COP_E_BURY' }, { impact: 'overdesk' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_MID.concat('SCRAPE'), rarity: 'UNCOMMON', d1: D1 }),
    compose('COP-B3', 'Tornade de papier', [BLIZZARD], [{ seg: 'COP_E_TORNADO' }, { impact: 'window' }, { seg: 'COP_AWAY' }, { reaction: 'away' }], { categories: ['CHAIN', 'SUPER', 'COMEBACK', 'DIRECT'], classes: WIN_BIG, rarity: 'RARE', d1: D1 }),
    compose('COP-J1', 'Un rot de papier', [JAM], [{ seg: 'COP_E_BURP' }], { categories: ['BACKFIRE', 'CLEAN_MISS'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('COP-J2', 'Tout le bac', [JAM], [{ seg: 'COP_E_SPIT' }, { impact: 'overdesk' }, { reaction: 'auto' }], { categories: ['COMEBACK', 'DIRECT', 'GRAZE', 'CHAIN'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('COP-J3', 'Photocopie dorée', [JAM], [{ seg: 'COP_E_GOLDCOPY' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'UNCOMMON', d1: D1 }),
    compose('COP-W1', 'Wendell répare : dans l\'estomac', [JAM, FIX], [{ seg: 'COP_E_WKICK' }], { categories: ['BACKFIRE', 'TEASE'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('COP-W2', 'Wendell répare : en plein vol', [JAM, FIX], [{ seg: 'COP_E_WASSIST' }, { impact: 'overdesk' }, { reaction: 'OFFICE_CHEER' }], { categories: ['COMEBACK', 'CHAIN', 'DIRECT'], classes: WIN_SMALL.concat('BIG'), rarity: 'UNCOMMON', d1: D1 }),
  ],
};
