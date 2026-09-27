/**
 * PLAN B · ESPRESSO BLASTER (GRUMPY) — gadget de PRODUCTION (18 branches).
 * Un canon à espresso sur chariot, posé sur le bureau du joueur. Signature sonore : PFFT de pression, CLUNK du
 * levier, RATTLE de la chaudière, PLOP du gobelet.
 *
 * Tronc neutre : les mains tirent le levier, la pression monte (aiguille, vapeur), B.B. sirote sans rien voir.
 * DÉBUTS VISIBLES (chacun mène à des pertes ET à des gains ; aucun ne permet de deviner le résultat) :
 *   SHOT      : le gobelet part en cloche et marque une pause au sommet… (attrapé ? plein visage ? surpression ?)
 *   CATCH×2   : il l'attrape, sourit… la chaudière gronde et tire un DEUXIÈME gobelet.
 *   JAM       : le levier coince, la chaudière tremble, B.B. s'intrigue. (panne ? explosion ? il vient voir ?)
 *   PEEK      : silence ; B.B. se penche vers la machine…
 *   RICOCHET  : le gobelet rebondit sur le ventilateur et y reste posé, à tourner au-dessus de lui.
 *   WENDELL   : Wendell passe sous le ventilateur, le nez dans ses dossiers.
 *   FOAM      : la buse à lait s'emballe : un nuage de mousse engloutit le bureau.
 */
import type { GadgetDef, SegmentDef } from '../../../presentation/types';
import { anim, BOSS_FIGHT, compose, fx, impactFrame, LOSS, mod, paced, punch, seg, segments, shake, signal, silence, sound, state, tw, WIN_ANY, WIN_BIG, WIN_MID, WIN_SMALL } from '../../dsl';
import { bb, cam, coo, props, wendell, wobble } from '../../kit';
import { ESP, ESP_MUZZLE as M, FRONT_DY, PLAN_SCALE as S } from '../stations';

const D1 = 'pressure-max';

// ------------------------------------------------------------------ repères (monde)
const APEX = { x: 614, y: 236 };
const HAND = { x: 596, y: 446 };
const FACE = { x: 630, y: 392 };
const HEAD = { x: 644, y: 330 };
/** Le mug de B.B. (poitrine, main droite). */
const MUG = { x: 606, y: 432 };
/** Le gobelet posé sur une pale du ventilateur. */
const FAN = { x: 668, y: 90 };
const LEVER_W = { x: ESP.lever.x + 8, y: ESP.lever.y + 34 + FRONT_DY };
const RISE = 300;

const handsAway = (at: number) => tw(at, 'hands', { y: 1060 }, 220, 'inQuad');

/** Le gobelet tombe depuis sa position courante jusqu'à `to` (en tournant). */
const fall = (at: number, to: { x: number; y: number }, ms: number, rot = 6.2832) => [
  tw(at, 'espCup', { x: to.x, y: to.y }, ms, 'inQuad'), tw(at, 'espCup', { rot }, ms, 'linear'),
];
/** Départ d'un gobelet depuis la bouche du canon jusqu'à `to` (sommet), avec son. */
const launch = (at: number, to: { x: number; y: number }, ms = RISE) => [
  tw(at, 'espCup', { x: M.x, y: M.y, alpha: 1, rot: 0, sx: 1, sy: 1 }, 1, 'linear'),
  tw(at + 2, 'espCup', { x: to.x, y: to.y }, ms, 'outQuad'), tw(at + 2, 'espCup', { rot: 3.1416 }, ms + 110, 'linear'),
  sound(at + 8, 'whoosh', 1.3), fx(at, 'steam', M.x, M.y, 8),
];
/** Recul du canon (tir). */
const recoil = (at: number) => [
  tw(at, 'espNeedle', { rot: 1.2 }, 80, 'outQuad'), sound(at, 'pfft', 0.8), sound(at + 20, 'snap', 0.7), sound(at + 10, 'thump', 0.9),
  tw(at, 'espBarrel', { rot: ESP.aim + 0.22 }, 60, 'outQuad'), tw(at + 60, 'espBarrel', { rot: ESP.aim }, 220, 'outElastic'),
  tw(at, 'espresso', { x: ESP.body.x - 10 }, 60, 'outQuad'), tw(at + 60, 'espresso', { x: ESP.body.x }, 200, 'outQuad'),
  fx(at, 'smoke', M.x, M.y, 3), punch(at, 160, 3),
];
const cupGone = (at: number) => tw(at, 'espCup', { alpha: 0 }, 40, 'linear');

const SHOT = mod('SHOT', { seg: 'ESP_SHOT' });
const CATCH2 = mod('CATCH_TWICE', { seg: 'ESP_T_CATCH2' });
const JAM = mod('JAM', { seg: 'ESP_JAM' });
const PEEK = mod('PEEK', { seg: 'ESP_T_PEEK' });
const RICOCHET = mod('RICOCHET', { seg: 'ESP_RICOCHET' });
const WENDELL = mod('WENDELL', { seg: 'ESP_T_WENDELL' });
const FOAM = mod('FOAM', { seg: 'ESP_FOAM' });

const SEGMENTS: SegmentDef[] = [
  // ---------------------------------------------------------------- tronc (neutre, avant le résultat)
  seg('ESP_IN', 'intro', 450, 'compress', [
    anim(0, 'hands', 'open'), tw(0, 'hands', { x: LEVER_W.x, y: LEVER_W.y }, 360, 'outBack'),
    anim(0, 'boss', 'sip'), anim(380, 'hands', 'grab'), sound(380, 'click'),
  ]),
  seg('ESP_PRESSURE', 'setup', 700, 'compress', [
    anim(0, 'hands', 'strain'), tw(0, 'hands', { y: LEVER_W.y + 18 }, 600, 'inOutQuad'),
    tw(0, 'espNeedle', { rot: 0.7 }, 650, 'inOutQuad'),
    tw(0, 'espresso', { sy: S * 1.03, sx: S * 0.98 }, 160, 'inOutQuad'), tw(160, 'espresso', { sy: S * 0.98, sx: S * 1.02 }, 160, 'inOutQuad'),
    tw(320, 'espresso', { sy: S * 1.04, sx: S * 0.97 }, 160, 'inOutQuad'), tw(480, 'espresso', { sy: S, sx: S }, 200, 'outQuad'),
    fx(80, 'steam', ESP.steam.x, ESP.steam.y + FRONT_DY, 3), fx(420, 'steam', ESP.steam.x, ESP.steam.y + FRONT_DY, 4),
    sound(0, 'creak'), sound(120, 'pfft', 1.3), sound(430, 'pfft', 1.5),
    anim(200, 'boss', 'oblivious'), tw(0, 'camera', { x: 560, y: 390, sx: 1.05 }, 600, 'inOutQuad'),
  ]),

  // ---------------------------------------------------------------- DÉBUTS
  /** Commun à 5 fins : tir, le gobelet monte et marque une pause au sommet (rien n'est encore joué). */
  seg('ESP_SHOT', 'action', 430, 'compress', [
    anim(0, 'hands', 'open'), handsAway(40), ...recoil(0), ...launch(0, APEX),
    anim(80, 'boss', 'surprised'), anim(270, 'boss', 'lookup'),
    tw(0, 'camera', { x: 590, y: 330, sx: 1.04 }, 400, 'outQuad'),
  ]),
  /** Le levier coince : la chaudière tremble, l'aiguille reste dans le rouge. B.B. l'entend. */
  seg('ESP_JAM', 'action', 760, 'compress', [
    tw(0, 'hands', { y: LEVER_W.y + 6 }, 80, 'outQuad'), tw(80, 'hands', { y: LEVER_W.y + 24 }, 80, 'inQuad'),
    tw(160, 'hands', { y: LEVER_W.y + 6 }, 80, 'outQuad'), sound(0, 'clunk', 0.8), sound(170, 'clunk', 0.9),
    anim(300, 'hands', 'open'), handsAway(320),
    tw(0, 'espNeedle', { rot: 1.6 }, 160, 'outQuad'), ...wobble(180, 'espresso', 0, 0.05, 7, 70),
    sound(200, 'rattle'), sound(430, 'rattle', 1.1), fx(250, 'steam', ESP.steam.x, ESP.steam.y + FRONT_DY, 6), sound(260, 'pfft', 1.6),
    anim(240, 'boss', 'confused'), tw(200, 'camera', { x: 540, y: 420, sx: 1.08 }, 520, 'inOutQuad'),
  ]),
  /** Le gobelet part de travers, sonne sur le ventilateur… et reste posé sur une pale, à tourner. */
  seg('ESP_RICOCHET', 'action', 760, 'compress', [
    anim(0, 'hands', 'open'), handsAway(40), ...recoil(0), tw(0, 'espBarrel', { rot: ESP.aim - 0.3 }, 60, 'outQuad'),
    tw(0, 'espCup', { x: M.x, y: M.y, alpha: 1, rot: 0, sx: 1, sy: 1 }, 1, 'linear'), sound(8, 'whoosh', 1.5),
    tw(2, 'espCup', { x: 640, y: 100 }, 240, 'outQuad'), tw(2, 'espCup', { rot: 4 }, 240, 'linear'),
    sound(242, 'clang', 1.5), fx(242, 'sparks', 650, 100, 8), shake(242, 140, 3),
    tw(242, 'espCup', { x: FAN.x, y: FAN.y - 20 }, 120, 'outQuad'), tw(362, 'espCup', { y: FAN.y, rot: 0 }, 120, 'outBounce'),
    tw(242, 'fan', { rot: 0.14 }, 80, 'outQuad'), tw(322, 'fan', { rot: 0 }, 400, 'outElastic'),
    tw(490, 'espCup', { x: FAN.x + 16 }, 130, 'inOutQuad'), tw(620, 'espCup', { x: FAN.x - 12 }, 130, 'inOutQuad'), sound(500, 'rattle', 1.5),
    anim(90, 'boss', 'surprised'), anim(300, 'boss', 'lookup'), anim(560, 'boss', 'confused'),
    tw(0, 'camera', { x: 620, y: 250, sx: 1.05 }, 480, 'outQuad'),
  ]),
  /** La buse à lait s'emballe : la mousse engloutit le bureau de B.B. */
  seg('ESP_FOAM', 'action', 820, 'compress', [
    anim(0, 'hands', 'open'), handsAway(40), ...recoil(0), sound(60, 'spray'), sound(300, 'spray', 0.9),
    fx(40, 'foam', M.x, M.y, 18), fx(160, 'foam', 600, 470, 28), fx(300, 'foam', 650, 440, 34), fx(460, 'foam', 690, 470, 30),
    fx(300, 'steam', 650, 420, 10), anim(120, 'boss', 'surprised'), anim(300, 'boss', 'duck'),
    tw(0, 'camera', { x: 600, y: 400, sx: 1.08 }, 500, 'outQuad'), sound(620, 'honk', 0.8),
  ]),

  // ---------------------------------------------------------------- TWISTS
  /** Il attrape le gobelet, sourit… et la chaudière tire un deuxième gobelet. */
  seg('ESP_T_CATCH2', 'twist', 960, 'compress', [
    ...fall(0, HAND, 260), anim(100, 'boss', 'catch'), cupGone(262), sound(262, 'plop', 1.3),
    anim(340, 'boss', 'smirk'), tw(260, 'camera', { x: 580, y: 380, sx: 1.06 }, 260, 'outQuad'),
    tw(500, 'espNeedle', { rot: 1.5 }, 100, 'outQuad'), sound(500, 'rattle'), fx(500, 'steam', M.x, M.y, 6),
    tw(500, 'espresso', { sx: S * 1.05, sy: S * 0.95 }, 80, 'outQuad'), tw(580, 'espresso', { sx: S, sy: S }, 140, 'outElastic'),
    anim(600, 'boss', 'surprised'), ...launch(620, { x: APEX.x + 24, y: APEX.y + 20 }, 280), sound(620, 'pfft', 0.8),
    tw(620, 'camera', { x: 600, y: 330, sx: 1.04 }, 300, 'outQuad'),
  ]),
  /** La chaudière se tait. Silence. B.B. se penche vers la machine. */
  paced(0.85, seg('ESP_T_PEEK', 'twist', 900, 'compress', [
    silence(0, 700), tw(0, 'espNeedle', { rot: 0.9 }, 300, 'inOutQuad'),
    anim(120, 'boss', 'lookdown'), tw(120, 'boss', { x: 620 }, 420, 'inOutQuad'),
    tw(100, 'camera', { x: 560, y: 470, sx: 1.16 }, 600, 'inOutQuad'),
    ...wobble(620, 'espNeedle', 0.9, 0.12, 3, 60), sound(640, 'squeak', 1.4),
  ])),
  /** Wendell passe sous le ventilateur, le nez dans ses dossiers, et s'arrête pile dessous. */
  paced(0.85, seg('ESP_T_WENDELL', 'twist', 900, 'compress', [
    ...wendell.walkIn(0, 780, 520), anim(560, 'wendell', 'look'), sound(560, 'paper', 1.3),
    anim(200, 'boss', 'smirk'), tw(560, 'espCup', { x: 744 }, 200, 'inOutQuad'), sound(640, 'rattle', 1.6),
    tw(0, 'camera', { x: 680, y: 300, sx: 1.04 }, 600, 'inOutQuad'), sound(700, 'tension'),
  ])),

  // ---------------------------------------------------------------- FINS (chacune contient la révélation)
  /** PERTE : il attrape le gobelet sans même regarder. */
  seg('ESP_E_CATCH', 'action', 440, 'compress', [
    ...fall(0, HAND, 260), anim(90, 'boss', 'catch'), cupGone(262), sound(262, 'plop', 1.3),
    signal(300, 'reveal'), tw(200, 'camera', { x: 560, y: 370, sx: 1.08 }, 260, 'outQuad'),
  ]),
  /** GAIN : plein visage (le reveal est au contact, bibliothèque IMPACT). */
  seg('ESP_E_SPLASH', 'action', 300, 'compress', [
    ...fall(0, FACE, 260), anim(80, 'boss', 'scared'), cupGone(262), fx(260, 'coffee', FACE.x, FACE.y, 16), sound(262, 'splash'),
    tw(40, 'camera', { x: 610, y: 380, sx: 1.12 }, 220, 'inQuad'),
  ]),
  /**
   * GROS GAIN : surpression. Mise en scène : l'aiguille casse le cadran, la machine gonfle, un temps de silence,
   * puis le jet continu emporte B.B. et son fauteuil ; il regarde l'objectif (gel) avant la vitre.
   */
  paced(0.86, seg('ESP_E_OVERLOAD', 'action', 900, 'compress', [
    ...fall(0, { x: 700, y: 620 }, 300), cupGone(300),
    tw(0, 'espNeedle', { rot: 2.4 }, 140, 'outQuad'), sound(0, 'screech', 1.4), shake(0, 260, 4),
    tw(0, 'espresso', { sx: S * 1.1, sy: S * 0.9 }, 160, 'outQuad'), silence(140, 180),
    tw(300, 'espresso', { sx: S, sy: S }, 240, 'outElastic'), ...impactFrame(300, 30, 40),
    fx(300, 'coffee', M.x, M.y, 22), fx(380, 'coffee', 610, 430, 24), fx(320, 'steam', M.x, M.y, 14),
    sound(300, 'spray'), sound(300, 'boom'), sound(330, 'whoosh'), anim(300, 'boss', 'scared'),
    tw(330, 'boss', { x: 330, y: 400, rot: -0.5 }, 380, 'outQuad'), tw(730, 'boss', { x: 236, y: 330 }, 150, 'inQuad'),
    tw(300, 'camera', { x: 420, y: 350, sx: 1.12 }, 480, 'outQuad'), anim(680, 'boss', 'lookcam'), ...cam.hitStop(700, 110),
    tw(860, 'camera', { sx: 1.2 }, 900, 'outQuad'),
  ])),
  /** Sortie par la fenêtre : le décor réagit, B.B. devient une étoile au loin. */
  seg('ESP_AWAY', 'impact', 700, 'compress', [
    ...bb.away(0, { x: 150, y: 240 }), ...props.portraitSwing(0), fx(40, 'papers', 440, 150, 8), sound(60, 'paper'),
    tw(300, 'camera', { x: 500, y: 350, sx: 1 }, 400, 'inOutQuad'),
  ]),
  /**
   * VERY RARE (perte) : le gobelet redescend au ralenti… et tombe PILE dans son mug. B.B. trinque avec le joueur ;
   * le COO se pose sur l'écran et applaudit (B.B., pas le joueur).
   */
  seg('ESP_E_LATTE', 'action', 1500, 'compress', [
    ...cam.slowmo(0, 420, 0.4), tw(0, 'espCup', { x: MUG.x, y: MUG.y - 30, sx: 0.6, sy: 0.6 }, 420, 'inOutQuad'), tw(0, 'espCup', { rot: 12.566 }, 420, 'linear'),
    tw(420, 'espCup', { y: MUG.y, alpha: 0 }, 60, 'inQuad'), sound(470, 'clink', 1.2), fx(480, 'steam', MUG.x, MUG.y - 20, 6),
    anim(0, 'boss', 'mugcheck'), anim(560, 'boss', 'lookcam'), signal(600, 'reveal'),
    anim(820, 'boss', 'smirk'), sound(840, 'hmpf', 1.3), ...cam.push(0, 600, 400, 1.18, 500, 'inOutQuad'),
    ...coo.flyTo(760, { x: 770, y: 380 }, 360), anim(1140, 'coo', 'applaud'), sound(1160, 'coo'),
    ...cam.recover(1100, 380),
  ]),
  /** BOSS FIGHT : le gobelet qu'il attrape devient DORÉ. */
  seg('ESP_E_GOLD', 'twist', 700, 'compress', [
    ...fall(0, HAND, 260), anim(90, 'boss', 'catch'), cupGone(262), sound(262, 'plop', 1.3),
    state(320, 'boss', 'mug=gold'), sound(340, 'gold'), fx(340, 'gold', HAND.x, HAND.y - 20, 18),
    anim(380, 'boss', 'furious'), tw(260, 'camera', { x: 540, y: 360, sx: 1.08 }, 260, 'outQuad'),
  ]),
  /** Deuxième gobelet : plein visage (COMEBACK). */
  seg('ESP_E_DOUBLEHIT', 'action', 300, 'compress', [
    ...fall(0, FACE, 250), anim(60, 'boss', 'scared'), cupGone(252), fx(250, 'coffee', FACE.x, FACE.y, 18), sound(252, 'splash'),
    tw(40, 'camera', { x: 610, y: 380, sx: 1.12 }, 210, 'inQuad'),
  ]),
  /** Deuxième gobelet : il l'attrape de l'autre main et boit aux deux. */
  seg('ESP_E_DOUBLECATCH', 'action', 900, 'compress', [
    ...fall(0, { x: MUG.x + 10, y: MUG.y - 6 }, 250), anim(60, 'boss', 'catch'), cupGone(252), sound(252, 'plop', 1.5),
    signal(300, 'reveal'), anim(360, 'boss', 'drink'), sound(420, 'gulp'), sound(620, 'gulp', 1.1),
    anim(760, 'boss', 'smug'), sound(780, 'hmpf', 1.2), tw(250, 'camera', { x: 580, y: 380, sx: 1.1 }, 300, 'outQuad'),
  ]),
  /** PERTE : panne. Le canon pique du nez, un filet de café, un nuage de vapeur. B.B. rit. */
  seg('ESP_E_FIZZLE', 'action', 900, 'compress', [
    tw(0, 'espBarrel', { rot: ESP.aim + 0.9 }, 260, 'outBounce'), sound(20, 'deflate'),
    tw(0, 'espNeedle', { rot: -1.2 }, 400, 'inOutQuad'),
    fx(240, 'coffee', M.x + 30, M.y + 50, 5), sound(260, 'plop', 0.8),
    fx(320, 'steam', ESP.body.x, ESP.body.y - 90 + FRONT_DY, 14), fx(340, 'smoke', ESP.body.x, ESP.body.y - 72 + FRONT_DY, 5), sound(330, 'pfft', 0.7),
    anim(380, 'boss', 'laugh'), signal(420, 'reveal'), sound(440, 'laugh'),
    tw(300, 'camera', { x: 540, y: 360, sx: 1 }, 400, 'inOutQuad'),
  ]),
  /**
   * GROS GAIN (mise en scène) : l'aiguille fait le tour du cadran et saute, la chaudière enfle, SILENCE… puis le
   * geyser de café propulse B.B. et son fauteuil jusqu'au plafond (ralenti au sommet, image d'impact au contact).
   */
  paced(0.8, seg('ESP_E_KABOOM', 'action', 980, 'compress', [
    tw(0, 'espNeedle', { rot: 7.5 }, 260, 'inQuad'), sound(0, 'whirr', 1.3), sound(40, 'tension'),
    tw(0, 'espresso', { sx: S * 1.14, sy: S * 0.88 }, 300, 'inQuad'), shake(0, 300, 3),
    silence(260, 200), ...cam.push(0, 520, 470, 1.18, 280, 'inQuad'),
    ...impactFrame(460, 30, 50), sound(460, 'boom'), sound(462, 'spray'), shake(460, 420, 10),
    tw(460, 'espresso', { sx: S, sy: S }, 300, 'outElastic'), fx(460, 'coffee', M.x, M.y, 30), fx(470, 'steam', M.x, M.y, 18), fx(520, 'coffee', 640, 470, 26),
    ...bb.airborne(480, { x: 650, y: 160 }, 440, 150, { whoosh: true }), ...cam.slowmo(760, 160, 0.4),
    tw(480, 'camera', { x: 620, y: 240, sx: 1.06 }, 460, 'outQuad'),
  ])),
  /** BOSS FIGHT : la vapeur devient DORÉE et monte jusqu'au mug de B.B. */
  seg('ESP_E_JAMGOLD', 'twist', 900, 'compress', [
    silence(0, 260), fx(120, 'gold', ESP.steam.x, ESP.steam.y + FRONT_DY - 20, 14), sound(140, 'gold'),
    tw(120, 'glow', { x: 600, y: 440, alpha: 0.85 }, 420, 'outQuad'), state(520, 'boss', 'mug=gold'), fx(520, 'gold', MUG.x, MUG.y - 10, 16),
    anim(560, 'boss', 'furious'), tw(700, 'glow', { alpha: 0 }, 200), tw(0, 'camera', { x: 560, y: 380, sx: 1.06 }, 500, 'inOutQuad'),
  ]),
  /** PERTE (TEASE) : la machine lui sert poliment un petit café ; il l'examine, et le boit. */
  seg('ESP_E_REFILL', 'action', 700, 'compress', [
    sound(0, 'pfft', 1.5), tw(0, 'espCup', { x: M.x, y: M.y, alpha: 1, rot: 0, sx: 0.7, sy: 0.7 }, 1, 'linear'),
    tw(2, 'espCup', { x: 610, y: 330 }, 260, 'outQuad'), tw(262, 'espCup', { x: HAND.x, y: HAND.y }, 200, 'inQuad'),
    anim(200, 'boss', 'catch'), cupGone(462), sound(462, 'plop', 1.6), signal(480, 'reveal'), anim(520, 'boss', 'confused'),
    tw(200, 'camera', { x: 600, y: 400, sx: 1.12 }, 300, 'outQuad'),
  ]),
  /** GAIN : à bout portant, pendant qu'il regarde dans le canon. */
  seg('ESP_E_POINTBLANK', 'action', 240, 'compress', [
    ...recoil(0), tw(0, 'espCup', { x: M.x, y: M.y, alpha: 1, rot: 0, sx: 1, sy: 1 }, 1, 'linear'),
    tw(2, 'espCup', { x: FACE.x - 14, y: FACE.y + 10 }, 200, 'outQuad'), sound(4, 'whoosh', 1.7), anim(120, 'boss', 'scared'),
    cupGone(204), fx(204, 'coffee', FACE.x, FACE.y, 16), sound(206, 'splash', 1.2),
  ]),
  /** PERTE : le ventilateur lâche le gobelet, qui tombe dans sa main (il n'a pas levé les yeux). */
  seg('ESP_E_RICOHAND', 'action', 560, 'compress', [
    anim(0, 'boss', 'smirk'), ...fall(60, HAND, 340, 3.14), anim(260, 'boss', 'catch'), cupGone(402), sound(402, 'plop', 1.2),
    signal(420, 'reveal'), tw(60, 'camera', { x: 580, y: 380, sx: 1.08 }, 360, 'inOutQuad'),
  ]),
  /** GAIN : le gobelet tombe du ventilateur sur son crâne. */
  seg('ESP_E_RICOHEAD', 'action', 420, 'compress', [
    ...fall(0, HEAD, 380, 2), anim(260, 'boss', 'lookup'), cupGone(382), fx(380, 'coffee', HEAD.x, HEAD.y, 14), sound(382, 'bonk', 1.2),
    tw(0, 'camera', { x: 640, y: 330, sx: 1.12 }, 380, 'inQuad'),
  ]),
  /** PERTE (BACKFIRE) : c'est Wendell qui le reçoit. Café partout. B.B. rit. */
  seg('ESP_E_WSPLASH', 'action', 900, 'compress', [
    ...fall(0, { x: 776, y: 392 }, 300, 3), cupGone(302), fx(300, 'coffee', 776, 392, 20), sound(302, 'splash'), sound(310, 'bonk', 1.5),
    anim(310, 'wendell', 'dizzy'), signal(340, 'reveal'), anim(380, 'boss', 'laugh'), sound(400, 'laugh'),
    tw(560, 'wendell', { x: 830 }, 300, 'outQuad'), tw(300, 'camera', { x: 660, y: 380, sx: 1.06 }, 400, 'inOutQuad'),
  ]),
  /** GAIN (CHAIN) : Wendell esquive ; le gobelet rebondit sur ses dossiers et part dans la figure de B.B. */
  seg('ESP_E_WDEFLECT', 'action', 520, 'compress', [
    ...wendell.duck(120), ...fall(0, { x: 770, y: 440 }, 280, 3), sound(282, 'paper', 1.2), fx(282, 'papers', 770, 440, 10),
    tw(282, 'espCup', { x: FACE.x, y: FACE.y }, 200, 'outQuad'), anim(300, 'boss', 'scared'), cupGone(482), fx(482, 'coffee', FACE.x, FACE.y, 16), sound(484, 'splash'),
    tw(200, 'camera', { x: 660, y: 390, sx: 1.1 }, 300, 'inQuad'),
  ]),
  /** PERTE : la mousse retombe ; B.B., couvert de mousse, n'a pas bougé. */
  seg('ESP_E_FOAMBEARD', 'action', 700, 'compress', [
    silence(0, 500), fx(0, 'foam', 650, 420, 14), anim(120, 'boss', 'blink'), signal(300, 'reveal'),
    fx(420, 'foam', 640, 380, 8), sound(440, 'plop', 1.7), tw(0, 'camera', { x: 620, y: 400, sx: 1.14 }, 400, 'inOutQuad'),
  ]),
  /** GAIN : il veut se lever, glisse sur la mousse et file jusqu'au classeur. */
  seg('ESP_E_FOAMSLIDE', 'action', 700, 'compress', [
    anim(0, 'boss', 'anticipate'), sound(80, 'squeak', 0.9), state(140, 'boss', 'seat=none'),
    anim(160, 'boss', 'airborne'), tw(160, 'boss', { x: 176, rot: -0.3 }, 520, 'inQuad'), sound(160, 'slide'), fx(200, 'foam', 600, 540, 14),
    ...props.chairFly(140, { x: 650, y: 560 }, { x: 760, y: 560 }, 300, 0.6), tw(460, 'chairProp', { alpha: 0 }, 200),
    tw(160, 'camera', { x: 380, y: 380, sx: 1.06 }, 480, 'inOutQuad'),
  ]),
];

export const espressoBlaster: GadgetDef = {
  id: 'espresso-blaster',
  label: 'ESPRESSO BLASTER',
  rageLevel: 'grumpy',
  layout: {
    boss: { transform: { x: 650, y: 560 }, states: { seat: 'chair', mug: 'normal', face: 'normal' }, anim: 'sip' },
    espresso: { transform: { x: ESP.body.x, y: ESP.body.y, sx: S, sy: S } },
    espBarrel: { transform: { x: ESP.barrel.x, y: ESP.barrel.y, rot: ESP.aim, sx: S, sy: S } },
    espNeedle: { transform: { x: ESP.needle.x, y: ESP.needle.y, rot: -1.2, sx: S, sy: S } },
    espCup: { transform: { x: M.x, y: M.y, alpha: 0 } },
  },
  props: ['espresso', 'espBarrel', 'espNeedle', 'espCup'],
  trunk: ['ESP_IN', 'ESP_PRESSURE'],
  hold: { sound: 'pfft', everyMs: 700 },
  signature: ['pfft', 'clunk', 'rattle', 'plop'],
  pick: {
    layer: 'front',
    box: { x: ESP.body.x - 70, y: ESP.body.y - 150, w: 150, h: 160 },
    spot: { x: ESP.body.x, y: ESP.body.y - 2, sx: 0.9 },
    idle: [
      { actor: 'espNeedle', prop: 'rot', amp: 0.12, periodMs: 440 },
      { actor: 'espresso', prop: 'sy', amp: 0.012, periodMs: 700 },
    ],
  },
  segments: segments(SEGMENTS),
  branches: [
    compose('ESP-S1', 'Il attrape le gobelet', [SHOT], [{ seg: 'ESP_E_CATCH' }, { reaction: 'SIP' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('ESP-S2', 'En plein visage', [SHOT], [{ seg: 'ESP_E_SPLASH' }, { impact: 'overdesk' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('ESP-S3', 'Surpression', [SHOT], [{ seg: 'ESP_E_OVERLOAD' }, { impact: 'window' }, { seg: 'ESP_AWAY' }, { reaction: 'away' }], { categories: ['DIRECT', 'COMEBACK', 'CHAIN', 'SUPER'], classes: WIN_BIG, rarity: 'COMMON', d1: D1 }),
    compose('ESP-S4', 'Latte art', [SHOT], [{ seg: 'ESP_E_LATTE' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'VERY_RARE', d1: D1 }),
    compose('ESP-S5', 'Espresso doré', [SHOT], [{ seg: 'ESP_E_GOLD' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'COMMON', d1: D1 }),
    compose('ESP-D1', 'Deux mains, deux cafés', [SHOT, CATCH2], [{ seg: 'ESP_E_DOUBLECATCH' }], { categories: ['TEASE', 'CLEAN_MISS'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('ESP-D2', 'Le deuxième gobelet', [SHOT, CATCH2], [{ seg: 'ESP_E_DOUBLEHIT' }, { impact: 'overdesk' }, { reaction: 'auto' }], { categories: ['COMEBACK', 'DIRECT', 'GRAZE'], classes: WIN_ANY, rarity: 'UNCOMMON', d1: D1 }),
    compose('ESP-J1', 'Panne de pression', [JAM], [{ seg: 'ESP_E_FIZZLE' }], { categories: ['BACKFIRE', 'CLEAN_MISS'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('ESP-J2', 'Geyser', [JAM], [{ seg: 'ESP_E_KABOOM' }, { impact: 'ceiling' }, { reaction: 'away' }], { categories: ['CHAIN', 'SUPER', 'COMEBACK', 'DIRECT'], classes: WIN_BIG, rarity: 'UNCOMMON', d1: D1 }),
    compose('ESP-J3', 'Café offert', [JAM, PEEK], [{ seg: 'ESP_E_REFILL' }, { reaction: 'SIP' }], { categories: ['TEASE', 'BACKFIRE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('ESP-J4', 'À bout portant', [JAM, PEEK], [{ seg: 'ESP_E_POINTBLANK' }, { impact: 'overdesk' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_SMALL, rarity: 'COMMON', d1: D1 }),
    compose('ESP-J5', 'Torréfaction dorée', [JAM], [{ seg: 'ESP_E_JAMGOLD' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'UNCOMMON', d1: D1 }),
    compose('ESP-R1', 'Ricochet : dans la main', [RICOCHET], [{ seg: 'ESP_E_RICOHAND' }, { reaction: 'auto' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('ESP-R2', 'Ricochet : sur le crâne', [RICOCHET], [{ seg: 'ESP_E_RICOHEAD' }, { impact: 'none' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('ESP-R3', 'Wendell, arrosé', [RICOCHET, WENDELL], [{ seg: 'ESP_E_WSPLASH' }], { categories: ['BACKFIRE', 'TEASE'], classes: LOSS, rarity: 'RARE', d1: D1 }),
    compose('ESP-R4', 'Wendell, ricochet', [RICOCHET, WENDELL], [{ seg: 'ESP_E_WDEFLECT' }, { impact: 'overdesk' }, { reaction: 'auto' }], { categories: ['CHAIN', 'COMEBACK', 'DIRECT'], classes: WIN_MID, rarity: 'RARE', d1: D1 }),
    compose('ESP-F1', 'Mousse de lait', [FOAM], [{ seg: 'ESP_E_FOAMBEARD' }, { reaction: 'SIP' }], { categories: ['CLEAN_MISS', 'BACKFIRE'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('ESP-F2', 'Glissade', [FOAM], [{ seg: 'ESP_E_FOAMSLIDE' }, { impact: 'wall' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK', 'CHAIN'], classes: WIN_ANY, rarity: 'UNCOMMON', d1: D1 }),
  ],
};
