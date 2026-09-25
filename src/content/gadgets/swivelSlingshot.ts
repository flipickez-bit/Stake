/**
 * SWIVEL SLINGSHOT (GRUMPY) — placeholder, variété V2 (Phase 0.5B).
 * Tronc neutre (on tend l'élastique) → 4 SETUPS partagés → twists → fin révélatrice.
 * Chaque setup mène à des pertes ET à des gains : aucun début ne permet de deviner le résultat.
 *   A LAUNCH   : la chaise part vers la gauche avec B.B.
 *   B SPIN     : l'élastique se vrille, la chaise tourne sur elle-même.
 *   C BACKFIRE : le mécanisme part dans le mauvais sens ; B.B. saute, se protège… la chaise part seule.
 *   D ELEVATOR : B.B. est projeté dans l'ascenseur. Silence. DING. (signature hors champ)
 */
import type { GadgetDef } from '../../presentation/types';
import {
  anim, BOSS_FIGHT, compose, fx, LOSS, mod, punch, seg, segments, shake, silence, sound, state, tw, WIN_ANY, WIN_BIG, WIN_SMALL,
} from '../dsl';

const D1 = 'released';

// ------------------------------------------------------------------ setups et twists (modules partagés)
const A = mod('LAUNCH', { seg: 'SLG_A_LAUNCH' });
const B = mod('SPIN', { seg: 'SLG_B_SPIN' });
const C = mod('BACKFIRE', { seg: 'SLG_C_BACKFIRE' });
const D = mod('ELEVATOR', { seg: 'SLG_D_ELEVATOR' });
const PHEW = mod('PHEW', { seg: 'SLG_C_PHEW' });
const SIP = mod('SIP', { seg: 'SIP_BEAT' });
const SIP_EMPTY = mod('SIP_EMPTY', { seg: 'SIP_EMPTY' });
const ELEV = mod('ELEV_WAIT', { seg: 'ELEV_WAIT' });

const handsAway = (at: number) => tw(at, 'hands', { y: 1060 }, 220, 'inQuad');

export const swivelSlingshot: GadgetDef = {
  id: 'swivel-slingshot',
  label: 'SWIVEL SLINGSHOT',
  rageLevel: 'grumpy',
  layout: {
    boss: { transform: { x: 650, y: 560 }, states: { seat: 'chair', mug: 'normal', face: 'normal' }, anim: 'sip' },
    slingPost: { transform: { x: 430, y: 560 }, states: { elastic: 'attached' } },
  },
  props: ['slingPost'],
  trunk: ['SLG_IN', 'SLG_PULL'],
  hold: { sound: 'creak', everyMs: 700 },
  segments: segments([
    // ---------------------------------------------------------------- tronc (neutre, avant le résultat)
    seg('SLG_IN', 'intro', 450, 'compress', [
      anim(0, 'hands', 'open'), tw(0, 'hands', { x: 770, y: 470 }, 360, 'outBack'),
      anim(0, 'boss', 'sip'), anim(380, 'hands', 'grab'), sound(380, 'click'),
    ]),
    seg('SLG_PULL', 'setup', 700, 'compress', [
      anim(0, 'hands', 'strain'), tw(0, 'hands', { x: 850 }, 650, 'inOutQuad'), tw(0, 'boss', { x: 770 }, 650, 'inOutQuad'),
      sound(0, 'creak'), sound(350, 'creak', 1.2), anim(200, 'boss', 'oblivious'),
      tw(0, 'camera', { x: 560, sx: 1.06 }, 600, 'inOutQuad'),
    ]),

    // ---------------------------------------------------------------- SETUPS
    seg('SLG_A_LAUNCH', 'action', 300, 'compress', [
      anim(0, 'hands', 'open'), sound(0, 'twang'), tw(0, 'boss', { x: 470 }, 260, 'inQuad'), anim(0, 'boss', 'surprised'),
      tw(0, 'camera', { x: 500, sx: 1 }, 300, 'outQuad'), handsAway(40),
    ]),
    seg('SLG_B_SPIN', 'action', 650, 'compress', [
      anim(0, 'hands', 'open'), sound(0, 'twang', 0.7), anim(0, 'boss', 'spin'), sound(80, 'spin'),
      tw(0, 'boss', { x: 620 }, 600, 'outQuad'), tw(0, 'camera', { x: 600, sx: 1.1 }, 400, 'outQuad'), handsAway(40),
    ]),
    seg('SLG_C_BACKFIRE', 'action', 620, 'compress', [
      anim(0, 'hands', 'open'), sound(0, 'twang', 0.55), state(40, 'slingPost', 'elastic=snapped'),
      anim(30, 'boss', 'hop'), state(60, 'boss', 'seat=none'),
      state(58, 'chairProp', 'kind=chair'), tw(58, 'chairProp', { x: 770, y: 560, alpha: 1, rot: 0 }, 1, 'linear'),
      tw(70, 'chairProp', { x: 1560, rot: 4 }, 380, 'inQuad'), sound(100, 'whoosh'),
      tw(60, 'boss', { x: 700 }, 220, 'outQuad'), anim(280, 'boss', 'braced'),
      tw(200, 'camera', { x: 640, sx: 1.14 }, 400, 'inOutQuad'), handsAway(40),
    ]),
    seg('SLG_D_ELEVATOR', 'action', 720, 'compress', [
      anim(0, 'hands', 'open'), sound(0, 'twang'), state(30, 'slingPost', 'elastic=snapped'),
      tw(0, 'elevL', { sx: 0.08 }, 150, 'outQuad'), tw(0, 'elevR', { sx: 0.08 }, 150, 'outQuad'), sound(0, 'whoosh', 0.6),
      anim(60, 'boss', 'scared'), tw(60, 'boss', { x: 985 }, 400, 'inQuad'), tw(60, 'camera', { x: 800, sx: 1.08 }, 400, 'inOutQuad'),
      tw(480, 'elevL', { sx: 1 }, 150, 'inQuad'), tw(480, 'elevR', { sx: 1 }, 150, 'inQuad'), sound(620, 'clunk'), handsAway(40),
    ]),
    // ---------------------------------------------------------------- TWISTS
    /** Offscreen, quelque chose se brise. Silence. B.B. entrouvre un œil… il est intact. */
    seg('SLG_C_PHEW', 'twist', 900, 'compress', [
      silence(0, 700), sound(60, 'crash', 0.85), shake(60, 260, 4), anim(380, 'boss', 'peek'), anim(640, 'boss', 'phew'), sound(700, 'hmpf', 1.2),
    ]),

    // ---------------------------------------------------------------- FINS (chacune contient la révélation)
    seg('SLG_E_YANK', 'action', 820, 'compress', [
      tw(0, 'boss', { x: 440 }, 60, 'linear'), sound(60, 'boing'), anim(60, 'boss', 'spin'),
      tw(80, 'boss', { x: 700 }, 620, 'outElastic'), anim(560, 'boss', 'dizzy'), { kind: 'signal', at: 640, signal: 'reveal' }, sound(660, 'wahwah'),
    ]),
    seg('SLG_E_WENDELL', 'action', 900, 'compress', [
      anim(0, 'wendell', 'walk'), tw(0, 'wendell', { x: 900 }, 320, 'outQuad'),
      tw(0, 'boss', { x: 440 }, 60, 'linear'), sound(60, 'boing'), anim(60, 'boss', 'spin'), tw(80, 'boss', { x: 812 }, 380, 'outQuad'),
      sound(460, 'bonk'), fx(460, 'papers', 860, 470, 18), shake(460, 200, 4), anim(460, 'wendell', 'hit'),
      tw(470, 'wendell', { x: 1060, rot: 0.5 }, 300, 'outQuad'), { kind: 'signal', at: 520, signal: 'reveal' },
      anim(560, 'boss', 'laugh'), sound(600, 'laugh'),
    ]),
    /** VERY RARE : l'élastique lui fait faire le tour du bureau… et il se repose pile à sa place. COO applaudit B.B. */
    seg('SLG_E_LOOP', 'action', 1500, 'compress', [
      tw(0, 'boss', { x: 440 }, 60, 'linear'), sound(60, 'boing'), anim(60, 'boss', 'spin'),
      tw(80, 'boss', { x: 300, y: 330 }, 260, 'inOutQuad'), tw(340, 'boss', { x: 650, y: 190 }, 260, 'inOutQuad'),
      tw(600, 'boss', { x: 920, y: 330 }, 260, 'inOutQuad'), tw(860, 'boss', { x: 650, y: 560 }, 360, 'outBounce'),
      sound(340, 'whoosh'), sound(600, 'whoosh', 1.2), tw(100, 'camera', { x: 600, sx: 0.95 }, 400, 'inOutQuad'),
      anim(1220, 'boss', 'smug'), { kind: 'signal', at: 1240, signal: 'reveal' },
      anim(1000, 'coo', 'fly'), tw(1000, 'coo', { x: 560, y: 300 }, 380, 'outQuad'), anim(1380, 'coo', 'applaud'), sound(1400, 'coo'),
    ]),
    seg('SLG_E_CABINET', 'action', 420, 'compress', [
      state(20, 'slingPost', 'elastic=snapped'), sound(20, 'twang', 1.6), anim(60, 'boss', 'scared'),
      tw(0, 'boss', { x: 176 }, 420, 'inQuad'), fx(40, 'dust', 0, -8, 5, 'boss'), tw(60, 'camera', { x: 390 }, 360, 'outQuad'),
    ]),
    seg('SLG_E_WINDOW', 'action', 560, 'compress', [
      state(20, 'slingPost', 'elastic=snapped'), sound(20, 'twang', 1.6), anim(60, 'boss', 'scared'),
      tw(0, 'boss', { x: 330, y: 400, rot: -0.5 }, 400, 'outQuad'), tw(400, 'boss', { x: 236, y: 330 }, 160, 'inQuad'),
      sound(120, 'whoosh'), tw(60, 'camera', { x: 420 }, 420, 'outQuad'),
    ]),
    seg('SLG_AWAY', 'impact', 700, 'compress', [
      anim(0, 'boss', 'away'), tw(0, 'boss', { x: 150, y: 240, z: 1600, alpha: 0, rot: -4 }, 650, 'outQuad'), sound(60, 'fall', 1.1),
      tw(300, 'camera', { x: 500 }, 400, 'inOutQuad'),
    ]),
    seg('SLG_E_BFSKID', 'action', 700, 'compress', [
      state(20, 'slingPost', 'elastic=snapped'), sound(20, 'twang', 1.6),
      tw(0, 'boss', { x: 360 }, 320, 'outCubic'), sound(60, 'screech'), fx(80, 'smoke', 0, -10, 8, 'boss'),
      punch(320, 240, 6), anim(320, 'boss', 'furious'), shake(320, 200, 5), tw(320, 'dim', { alpha: 0.35 }, 380),
    ]),
    seg('SLG_E_SPINOUT', 'action', 900, 'compress', [
      anim(0, 'boss', 'spin'), sound(0, 'spin', 0.8), anim(320, 'boss', 'dizzy'),
      tw(300, 'boss', { x: 540, rot: 0.28 }, 360, 'outQuad'), tw(660, 'boss', { rot: 0 }, 220, 'outBounce'),
      { kind: 'signal', at: 700, signal: 'reveal' }, anim(700, 'boss', 'smug'), sound(720, 'hmpf'),
    ]),
    seg('SLG_E_DRILL', 'action', 440, 'compress', [
      anim(0, 'boss', 'spin'), sound(0, 'spin', 1.6), fx(0, 'dust', 0, 0, 8, 'boss'), tw(40, 'boss', { y: 250 }, 400, 'inQuad'),
      state(400, 'fan', 'broken'), fx(400, 'sparks', 650, 96, 12), tw(100, 'camera', { y: 300 }, 300, 'outQuad'),
    ]),
    /** L'extincteur se déclenche : la mousse propulse B.B. par la fenêtre. */
    seg('SLG_E_FOAM', 'action', 660, 'compress', [
      anim(0, 'boss', 'spin'), tw(0, 'boss', { x: 540 }, 250, 'inQuad'), sound(250, 'bonk'), sound(260, 'spray'),
      state(250, 'extinguisher', 'fired'), fx(260, 'foam', 530, 470, 30), anim(260, 'boss', 'scared'),
      tw(300, 'boss', { x: 236, y: 330, rot: -0.5 }, 360, 'inQuad'), tw(300, 'camera', { x: 420 }, 360, 'outQuad'),
    ]),
    /** La chaise revient… et passe derrière lui pour pulvériser son ordinateur. LE SIP. x0. */
    seg('SLG_E_MONITOR', 'action', 900, 'compress', [
      state(0, 'chairProp', 'kind=chair'), tw(0, 'chairProp', { x: 1560, y: 520, alpha: 1, rot: 0 }, 1, 'linear'),
      tw(20, 'chairProp', { x: 790, y: 430, rot: 0.7 }, 280, 'inQuad'), sound(20, 'whoosh'), anim(40, 'boss', 'braced'),
      sound(300, 'crash'), state(300, 'monitor', 'broken'), fx(300, 'sparks', 770, 400, 16), fx(320, 'smoke', 770, 390, 8), shake(300, 250, 5),
      { kind: 'signal', at: 460, signal: 'reveal' }, anim(480, 'boss', 'lookback'), tw(320, 'camera', { x: 700, sx: 1.2 }, 300, 'outQuad'),
    ]),
    /** Le mug est vide… la chaise revient du hors champ. BOOM. */
    seg('SLG_E_RETURN', 'action', 340, 'compress', [
      state(0, 'chairProp', 'kind=chair'), tw(0, 'chairProp', { x: 1560, y: 520, alpha: 1, rot: 0 }, 1, 'linear'),
      tw(20, 'chairProp', { x: 720, y: 500, rot: -0.4 }, 300, 'inQuad'), sound(20, 'whoosh'), anim(200, 'boss', 'surprised'),
      tw(330, 'chairProp', { alpha: 0 }, 100, 'linear'),
    ]),
    /** RARE : il se penche sur son mug vide pile au bon moment ; la chaise passe au-dessus et traverse la vitre. */
    seg('SLG_E_OVER', 'action', 1000, 'compress', [
      state(0, 'chairProp', 'kind=chair'), tw(0, 'chairProp', { x: 1560, y: 480, alpha: 1, rot: 0 }, 1, 'linear'),
      tw(20, 'chairProp', { x: 236, y: 250, rot: -3 }, 560, 'linear'), sound(20, 'whoosh'), anim(0, 'boss', 'mugcheck'),
      sound(580, 'glass'), state(580, 'window', 'broken'), fx(580, 'glass', 220, 230, 16), tw(600, 'chairProp', { alpha: 0 }, 100, 'linear'),
      tw(300, 'camera', { x: 520, sx: 1 }, 400, 'inOutQuad'), anim(700, 'boss', 'idle'), { kind: 'signal', at: 720, signal: 'reveal' },
      anim(760, 'boss', 'sip'), sound(900, 'sip'),
    ]),
  ]),
  branches: [
    compose('SLG-A1', 'Rappel élastique', [A], [{ seg: 'SLG_E_YANK' }, { reaction: 'auto' }], { categories: ['CLEAN_MISS'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('SLG-A2', 'Wendell amortit', [A], [{ seg: 'SLG_E_WENDELL' }], { categories: ['BACKFIRE'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('SLG-A3', 'Le grand tour', [A], [{ seg: 'SLG_E_LOOP' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'VERY_RARE', d1: D1 }),
    compose('SLG-A4', 'Classeur', [A], [{ seg: 'SLG_E_CABINET' }, { impact: 'wall' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_SMALL, rarity: 'COMMON', d1: D1 }),
    compose('SLG-A5', 'Par la fenêtre', [A], [{ seg: 'SLG_E_WINDOW' }, { impact: 'window' }, { seg: 'SLG_AWAY' }, { reaction: 'away' }], { categories: ['DIRECT', 'COMEBACK', 'CHAIN', 'SUPER'], classes: WIN_BIG, rarity: 'COMMON', d1: D1 }),
    compose('SLG-A6', 'Freinage furieux', [A], [{ seg: 'SLG_E_BFSKID' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'COMMON', d1: D1 }),
    compose('SLG-B1', 'Toupie', [B], [{ seg: 'SLG_E_SPINOUT' }, { reaction: 'auto' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('SLG-B2', 'Perceuse', [B], [{ seg: 'SLG_E_DRILL' }, { impact: 'ceiling' }, { reaction: 'away' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('SLG-B3', 'Extincteur', [B], [{ seg: 'SLG_E_FOAM' }, { impact: 'window' }, { seg: 'SLG_AWAY' }, { reaction: 'away' }], { categories: ['CHAIN', 'SUPER', 'COMEBACK'], classes: WIN_BIG, rarity: 'UNCOMMON', d1: D1 }),
    compose('SLG-C1', 'BACKFIRE : l\'ordinateur', [C, PHEW], [{ seg: 'SLG_E_MONITOR' }, { reaction: 'SIP' }], { categories: ['BACKFIRE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('SLG-C2', 'Mug vide, boomerang', [C, PHEW, SIP, SIP_EMPTY], [{ seg: 'SLG_E_RETURN' }, { impact: 'none' }, { reaction: 'auto' }], { categories: ['COMEBACK', 'DIRECT', 'GRAZE'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('SLG-C3', 'Mug vide, la vitre', [C, PHEW, SIP, SIP_EMPTY], [{ seg: 'SLG_E_OVER' }], { categories: ['BACKFIRE', 'TEASE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('SLG-C4', 'Intact. LE SIP.', [C, PHEW, SIP], [{ seg: 'SIP_SMUG' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('SLG-D1', 'Ascenseur : intact', [D, ELEV], [{ seg: 'ELEV_SAFE' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('SLG-D2', 'Ascenseur : en miettes', [D, ELEV], [{ seg: 'ELEV_WRECK' }, { impact: 'elevator' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'UNCOMMON', d1: D1 }),
    compose('SLG-D3', 'Ascenseur : avalanche', [D, ELEV], [{ seg: 'ELEV_MEGA' }, { impact: 'elevator' }, { reaction: 'OFFICE_CHEER' }], { categories: ['CHAIN', 'SUPER'], classes: WIN_BIG, rarity: 'RARE', d1: D1 }),
    compose('SLG-D4', 'Ascenseur doré', [D, ELEV], [{ seg: 'ELEV_GOLD' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'UNCOMMON', d1: D1 }),
  ],
};
