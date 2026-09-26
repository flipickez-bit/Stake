/**
 * TRAPDOOR EXPRESS (FURIOUS) — placeholder, variété V2 (Phase 0.5B).
 * Tronc neutre (le levier) → 3 SETUPS partagés → twists → fin révélatrice.
 *   A HOVER : la trappe s'ouvre, B.B. flotte au-dessus du vide… puis tombe, ou non.
 *   B DROP  : il tombe tout de suite. La cravate se coince ? L'ascenseur ? Un bruit sourd ?
 *   C JAM   : rien ne se passe. Il tapote, hausse les épaules… LE SIP. (qui ne veut rien dire)
 */
import type { GadgetDef } from '../../presentation/types';
import {
  anim, BOSS_FIGHT, compose, fx, LOSS, mod, paced, punch, seg, segments, shake, silence, sound, state, tw, WIN_ANY, WIN_BIG,
} from '../dsl';

const D1 = 'lever-pulled';

const A = mod('HOVER', { seg: 'TRP_A_HOVER' });
const B = mod('DROP', { seg: 'TRP_B_DROP' });
const C = mod('JAM', { seg: 'TRP_C_JAM' });
const FALL = mod('FALL', { seg: 'TRP_T_FALL' });
const CATCH = mod('TIE_CATCH', { seg: 'TRP_T_CATCH' });
const HELP = mod('WENDELL_HELP', { seg: 'TRP_T_HELP' });
const SIP = mod('SIP', { seg: 'SIP_BEAT' });
const SIP_EMPTY = mod('SIP_EMPTY', { seg: 'SIP_EMPTY' });
const ELEV = mod('ELEV_WAIT', { seg: 'ELEV_WAIT' });

const leverSnap = [tw(0, 'lever', { rot: 0.9 }, 120, 'outBack'), anim(0, 'hands', 'open'), sound(0, 'clunk'), tw(60, 'hands', { y: 1060 }, 260, 'inQuad')];

export const trapdoorExpress: GadgetDef = {
  id: 'trapdoor-express',
  label: 'TRAPDOOR EXPRESS',
  rageLevel: 'furious',
  layout: {
    boss: { transform: { x: 650, y: 560 }, states: { seat: 'none', mug: 'normal', face: 'normal' }, anim: 'tapfoot' },
    trapdoor: { transform: { x: 650, y: 560 }, states: { main: 'closed' } },
    lever: { transform: { x: 885, y: 560, rot: -0.35 } },
  },
  props: ['trapdoor', 'lever'],
  trunk: ['TRP_IN', 'TRP_PULL'],
  hold: { sound: 'creak', everyMs: 650 },
  segments: segments([
    seg('TRP_IN', 'intro', 450, 'compress', [
      anim(0, 'hands', 'open'), tw(0, 'hands', { x: 885, y: 445 }, 380, 'outBack'),
      anim(0, 'boss', 'tapfoot'), anim(400, 'hands', 'grab'), sound(400, 'click'),
    ]),
    seg('TRP_PULL', 'setup', 650, 'compress', [
      anim(0, 'hands', 'strain'), tw(0, 'lever', { rot: 0.1 }, 600, 'inOutQuad'), tw(0, 'hands', { x: 865, y: 455 }, 600, 'inOutQuad'),
      sound(0, 'creak'), sound(300, 'creak', 0.9), anim(300, 'boss', 'oblivious'),
      tw(0, 'camera', { x: 600, sx: 1.05 }, 600, 'inOutQuad'),
    ]),

    // ---------------------------------------------------------------- SETUPS
    seg('TRP_A_HOVER', 'action', 760, 'compress', [
      ...leverSnap, state(120, 'trapdoor', 'open'), anim(120, 'boss', 'hover'), anim(320, 'boss', 'lookdown'), anim(560, 'boss', 'lookcam'),
      tw(0, 'camera', { x: 650, y: 380, sx: 1.15 }, 420, 'outQuad'),
    ]),
    seg('TRP_B_DROP', 'action', 520, 'compress', [
      ...leverSnap, state(100, 'trapdoor', 'open'), anim(100, 'boss', 'fall'), tw(110, 'boss', { y: 780 }, 240, 'inQuad'), sound(100, 'fall', 1.1),
      tw(0, 'camera', { x: 650, y: 420, sx: 1.15 }, 360, 'outQuad'),
    ]),
    paced(0.75, seg('TRP_C_JAM', 'action', 800, 'compress', [
      ...leverSnap, state(100, 'trapdoor', 'jammed'), sound(150, 'creak', 0.7), anim(150, 'boss', 'lookdown'),
      anim(400, 'boss', 'tapfoot'), sound(450, 'tink', 0.8), sound(600, 'tink', 0.8), anim(700, 'boss', 'smug'),
      tw(0, 'camera', { x: 620, sx: 1.08 }, 400, 'outQuad'),
    ])),
    // ---------------------------------------------------------------- TWISTS
    seg('TRP_T_FALL', 'twist', 520, 'compress', [
      anim(0, 'boss', 'wave'), anim(250, 'boss', 'fall'), tw(250, 'boss', { y: 780 }, 240, 'inQuad'), sound(230, 'fall'),
      tw(250, 'camera', { x: 620, y: 410, sx: 1.1 }, 280, 'outQuad'),
    ]),
    /** La cravate se coince au bord : il reste suspendu. */
    paced(0.8, seg('TRP_T_CATCH', 'twist', 700, 'compress', [
      sound(0, 'boing', 0.7), tw(0, 'boss', { y: 700 }, 180, 'outBack'), state(0, 'boss', 'tie=stretched'), anim(0, 'boss', 'hang'),
      shake(0, 150, 3), silence(200, 400), sound(420, 'hmpf', 1.2),
    ])),
    /** Wendell accourt et tire sur la cravate. Tension. */
    paced(0.78, seg('TRP_T_HELP', 'twist', 900, 'compress', [
      anim(0, 'wendell', 'run'), tw(0, 'wendell', { x: 760 }, 380, 'outQuad'), anim(400, 'wendell', 'pull'), sound(450, 'creak', 1.3),
      silence(400, 480), tw(500, 'boss', { y: 690 }, 80, 'linear'), tw(580, 'boss', { y: 700 }, 80, 'linear'),
      tw(660, 'boss', { y: 688 }, 80, 'linear'), tw(740, 'boss', { y: 700 }, 80, 'linear'),
    ])),

    // ---------------------------------------------------------------- FINS
    seg('TRP_E_TIPTOE', 'action', 900, 'compress', [
      anim(0, 'boss', 'tiptoe'), tw(0, 'boss', { x: 752 }, 520, 'inOutQuad'), sound(520, 'boing', 0.8),
      { kind: 'signal', at: 560, signal: 'reveal' }, anim(560, 'boss', 'smug'), sound(580, 'wahwah'),
      state(650, 'trapdoor', 'closed'), sound(650, 'clunk'), tw(420, 'camera', { x: 500, y: 350, sx: 1 }, 420, 'inOutQuad'),
    ]),
    /** VERY RARE : COO, agent double, le repêche par le col et le dépose au bord. Il salue… B.B. */
    seg('TRP_E_COO', 'action', 1300, 'compress', [
      anim(0, 'coo', 'fly'), tw(0, 'coo', { x: 640, y: 380 }, 350, 'outQuad'), sound(200, 'coo'), anim(350, 'coo', 'carry'),
      tw(350, 'boss', { x: 752 }, 500, 'inOutQuad'), tw(350, 'coo', { x: 752, y: 370 }, 500, 'inOutQuad'),
      anim(850, 'boss', 'smug'), { kind: 'signal', at: 860, signal: 'reveal' }, state(900, 'trapdoor', 'closed'), sound(900, 'clunk'),
      anim(950, 'coo', 'salute'), sound(980, 'coo', 1.2), tw(420, 'camera', { x: 560, y: 350, sx: 1 }, 420, 'inOutQuad'),
    ]),
    seg('TRP_E_THUD', 'action', 300, 'compress', [silence(0, 300), sound(260, 'thud', 0.6)]),
    seg('TRP_E_FLOORS', 'action', 560, 'compress', [
      sound(60, 'elevator', 1.3), sound(180, 'elevator', 1.15), sound(300, 'elevator', 1.0), silence(320, 240),
      tw(0, 'camera', { x: 650, y: 430, sx: 1.2 }, 400, 'inOutQuad'),
    ]),
    /** Il rebondit sur on ne sait quoi et atterrit sur le bord. */
    seg('TRP_E_BOUNCE', 'action', 900, 'compress', [
      sound(60, 'boing', 0.6), anim(60, 'boss', 'scared'), tw(60, 'boss', { y: 480 }, 300, 'outQuad'),
      tw(360, 'boss', { x: 752, y: 560 }, 300, 'inOutQuad'), state(620, 'trapdoor', 'closed'), sound(620, 'clunk'),
      anim(660, 'boss', 'smug'), { kind: 'signal', at: 660, signal: 'reveal' }, sound(700, 'laugh'),
      tw(500, 'camera', { x: 560, y: 350, sx: 1 }, 400, 'inOutQuad'),
    ]),
    seg('TRP_E_BFRISE', 'action', 500, 'compress', [
      tw(60, 'glow', { x: 650, y: 540, alpha: 0.9 }, 200, 'outQuad'), sound(100, 'gold'),
      anim(260, 'boss', 'furious'), tw(260, 'boss', { y: 560 }, 220, 'outBack'), shake(280, 250, 6), punch(300, 200, 6),
      tw(260, 'camera', { x: 500, y: 350, sx: 1 }, 240, 'outQuad'), tw(400, 'glow', { alpha: 0 }, 100), fx(280, 'dust', 650, 556, 10),
    ]),
    /** TEASE : Wendell tire trop fort et le remonte par accident. B.B. remet sa cravate. LE SIP. x0. */
    seg('TRP_E_PULLUP', 'action', 800, 'compress', [
      sound(0, 'boing', 1.3), tw(0, 'boss', { y: 560 }, 260, 'outBack'), anim(0, 'wendell', 'fall'), tw(0, 'wendell', { x: 860, rot: -0.3 }, 260, 'outQuad'),
      state(300, 'trapdoor', 'closed'), sound(300, 'clunk'), state(320, 'boss', 'tie=normal'), anim(320, 'boss', 'tiefix'),
      { kind: 'signal', at: 320, signal: 'reveal' }, tw(320, 'camera', { x: 600, y: 350, sx: 1.05 }, 360, 'inOutQuad'),
    ]),
    /** Double retournement : la cravate cède. Wendell reste avec le bout dans les mains. */
    seg('TRP_E_TIESNAP', 'action', 560, 'compress', [
      sound(0, 'crack'), state(0, 'boss', 'tie=snapped'), anim(0, 'wendell', 'fall'), tw(0, 'wendell', { x: 880, rot: -0.4 }, 240, 'outQuad'),
      anim(0, 'boss', 'fall'), tw(20, 'boss', { y: 900 }, 260, 'inQuad'), sound(40, 'fall'), silence(300, 260), sound(520, 'thud', 0.6),
    ]),
    /** Il remonte seul à la force des bras, puis sonne Wendell. DING. (ce DING-là ne paie rien) */
    paced(0.85, seg('TRP_E_CLIMB', 'action', 1300, 'compress', [
      anim(0, 'boss', 'climb'), tw(0, 'boss', { y: 620 }, 300, 'outQuad'), tw(300, 'boss', { y: 560 }, 300, 'outQuad'),
      state(600, 'boss', 'tie=normal'), state(650, 'trapdoor', 'closed'), sound(650, 'clunk'), { kind: 'signal', at: 620, signal: 'reveal' },
      tw(650, 'boss', { x: 830 }, 300, 'inOutQuad'), anim(650, 'boss', 'tiptoe'), anim(960, 'boss', 'ring'),
      tw(1000, 'bell', { rot: 0.35 }, 60, 'linear'), tw(1060, 'bell', { rot: 0 }, 220, 'outElastic'), sound(1000, 'ding', 1.25),
      tw(600, 'camera', { x: 700, y: 350, sx: 1.05 }, 400, 'inOutQuad'),
    ])),
    /** Le mug est vide… et la trappe s'ouvre enfin. */
    seg('TRP_E_LATEDROP', 'action', 320, 'compress', [
      state(0, 'trapdoor', 'open'), sound(0, 'clunk', 0.8), anim(0, 'boss', 'fall'), tw(30, 'boss', { y: 900 }, 250, 'inQuad'), sound(30, 'fall'),
    ]),
    /** Le mug est vide : il sonne pour un café. Wendell accourt… sur la trappe. B.B., lui, flotte. */
    paced(0.8, seg('TRP_E_WENDELLDROP', 'action', 1200, 'compress', [
      anim(0, 'boss', 'ring'), tw(60, 'bell', { rot: 0.35 }, 60, 'linear'), tw(120, 'bell', { rot: 0 }, 220, 'outElastic'), sound(60, 'ding', 1.25),
      anim(250, 'wendell', 'run'), tw(250, 'wendell', { x: 700 }, 350, 'outQuad'), state(620, 'trapdoor', 'open'), sound(620, 'clunk', 0.8),
      anim(620, 'boss', 'hover'), anim(640, 'wendell', 'fall'), tw(640, 'wendell', { y: 900 }, 250, 'inQuad'), sound(640, 'fall', 1.3),
      { kind: 'signal', at: 700, signal: 'reveal' }, anim(760, 'boss', 'tiptoe'), tw(760, 'boss', { x: 752 }, 360, 'inOutQuad'),
      anim(1120, 'boss', 'laugh'), sound(1120, 'laugh'), state(1150, 'trapdoor', 'closed'), sound(1150, 'clunk'),
      tw(400, 'camera', { x: 640, y: 380, sx: 1.1 }, 400, 'inOutQuad'),
    ])),
    seg('TRP_CLOSE', 'reaction', 420, 'compress', [
      state(150, 'trapdoor', 'closed'), sound(150, 'clunk'), tw(0, 'camera', { x: 500, y: 350, sx: 1 }, 380, 'inOutQuad'),
    ]),
  ]),
  branches: [
    compose('TRP-A1', 'Marche sur le vide', [A], [{ seg: 'TRP_E_TIPTOE' }, { reaction: 'auto' }], { categories: ['CLEAN_MISS'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('TRP-A2', 'Au revoir', [A, FALL], [{ seg: 'TRP_E_THUD' }, { impact: 'floor' }, { seg: 'TRP_CLOSE' }, { reaction: 'away' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('TRP-A3', 'Douze étages', [A, FALL], [{ seg: 'TRP_E_FLOORS' }, { impact: 'floor' }, { seg: 'TRP_CLOSE' }, { reaction: 'away' }], { categories: ['DIRECT', 'COMEBACK', 'CHAIN', 'SUPER'], classes: WIN_BIG, rarity: 'COMMON', d1: D1 }),
    compose('TRP-A4', 'Rebond', [A, FALL], [{ seg: 'TRP_E_BOUNCE' }], { categories: ['TEASE', 'CLEAN_MISS'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('TRP-A5', 'COO le repêche', [A], [{ seg: 'TRP_E_COO' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'VERY_RARE', d1: D1 }),
    compose('TRP-A6', 'Remontée dorée', [A, FALL], [{ seg: 'TRP_E_BFRISE' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'COMMON', d1: D1 }),
    compose('TRP-B1', 'TEASE : la cravate', [B, CATCH, HELP], [{ seg: 'TRP_E_PULLUP' }, { reaction: 'SIP' }], { categories: ['TEASE', 'CLEAN_MISS'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('TRP-B2', 'La cravate cède', [B, CATCH, HELP], [{ seg: 'TRP_E_TIESNAP' }, { impact: 'floor' }, { seg: 'TRP_CLOSE' }, { reaction: 'away' }], { categories: ['COMEBACK', 'DIRECT'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('TRP-B3', 'Remonte seul, DING', [B, CATCH], [{ seg: 'TRP_E_CLIMB' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('TRP-B4', 'Ascenseur : intact', [B, ELEV], [{ seg: 'ELEV_SAFE' }], { categories: ['CLEAN_MISS', 'TEASE', 'BACKFIRE'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('TRP-B5', 'Ascenseur : en miettes', [B, ELEV], [{ seg: 'ELEV_WRECK' }, { impact: 'elevator' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('TRP-B6', 'Ascenseur : avalanche', [B, ELEV], [{ seg: 'ELEV_MEGA' }, { impact: 'elevator' }, { reaction: 'OFFICE_CHEER' }], { categories: ['CHAIN', 'SUPER'], classes: WIN_BIG, rarity: 'RARE', d1: D1 }),
    compose('TRP-B7', 'Ascenseur doré', [B, ELEV], [{ seg: 'ELEV_GOLD' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'UNCOMMON', d1: D1 }),
    compose('TRP-C1', 'Mug vide, trappe', [C, SIP, SIP_EMPTY], [{ seg: 'TRP_E_LATEDROP' }, { impact: 'floor' }, { seg: 'TRP_CLOSE' }, { reaction: 'away' }], { categories: ['COMEBACK', 'DIRECT', 'GRAZE'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('TRP-C2', 'Mug vide, Wendell', [C, SIP, SIP_EMPTY], [{ seg: 'TRP_E_WENDELLDROP' }], { categories: ['BACKFIRE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('TRP-C3', 'Rien. LE SIP.', [C, SIP], [{ seg: 'SIP_SMUG' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
  ],
};
