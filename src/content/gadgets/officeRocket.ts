/**
 * OFFICE ROCKET (UNHINGED) — placeholder, variété V2 (Phase 0.5B).
 * Tronc neutre (la mèche) → 3 SETUPS partagés → twists → fin révélatrice.
 *   A IGNITE : la fusée démarre tout de suite et zigzague… pour se poser, s'écraser ou traverser la vitre.
 *   B STALL  : elle cale ; B.B. nargue le joueur. Redémarrage brutal ? Fumée ? Elle part sans lui ?
 *   C UP     : droit vers le plafond… le ventilateur, le plafond, ou le toit (et l'ascenseur).
 */
import type { GadgetDef } from '../../presentation/types';
import {
  anim, BOSS_FIGHT, compose, fx, LOSS, mod, paced, punch, seg, segments, shake, silence, sound, state, tw, WIN_ANY, WIN_BIG, WIN_MID, WIN_SMALL,
} from '../dsl';

const D1 = 'fuse-out';

const A = mod('IGNITE', { seg: 'RKT_A_IGNITE' });
const B = mod('STALL', { seg: 'RKT_B_STALL' });
const C = mod('UP', { seg: 'RKT_C_UP' });
const ZIGZAG = mod('ZIGZAG', { seg: 'RKT_T_ZIGZAG' });
const REIGNITE = mod('REIGNITE', { seg: 'RKT_T_REIGNITE' });
const SMOKE = mod('SMOKE', { seg: 'RKT_T_SMOKE' });
const MISS = mod('MISS', { seg: 'RKT_T_MISS' });
const THROUGH = mod('THROUGH_ROOF', { seg: 'RKT_T_THROUGH' });
const ELEV = mod('ELEV_WAIT', { seg: 'ELEV_WAIT' });

const fuseOut = [tw(0, 'spark', { alpha: 0 }, 60, 'linear'), state(0, 'fuse', 'burnt')];

export const officeRocket: GadgetDef = {
  id: 'office-rocket',
  label: 'OFFICE ROCKET',
  rageLevel: 'unhinged',
  layout: {
    boss: { transform: { x: 650, y: 560 }, states: { seat: 'rocket', mug: 'normal', face: 'normal' }, anim: 'sip' },
    fuse: { transform: { x: 700, y: 556 }, states: { main: 'unlit' } },
    spark: { transform: { x: 900, y: 552, alpha: 0 } },
  },
  props: ['fuse', 'spark'],
  trunk: ['RKT_IN', 'RKT_FUSE'],
  hold: { sound: 'fuse', everyMs: 500 },
  segments: segments([
    seg('RKT_IN', 'intro', 450, 'compress', [
      anim(0, 'hands', 'lighter'), tw(0, 'hands', { x: 906, y: 520 }, 380, 'outBack'), anim(0, 'boss', 'sip'), sound(380, 'click', 1.4),
    ]),
    seg('RKT_FUSE', 'setup', 900, 'compress', [
      state(0, 'fuse', 'lit'), tw(0, 'spark', { alpha: 1 }, 60, 'linear'), sound(0, 'fuse'),
      tw(0, 'spark', { x: 716 }, 880, 'linear'), tw(100, 'hands', { y: 1060 }, 300, 'inQuad'),
      tw(0, 'camera', { x: 620, sx: 1.08 }, 800, 'inOutQuad'), anim(450, 'boss', 'sniff'),
    ]),

    // ---------------------------------------------------------------- SETUPS
    seg('RKT_A_IGNITE', 'action', 560, 'compress', [
      ...fuseOut, sound(0, 'roar'), fx(0, 'flame', 60, 0, 22, 'boss'), shake(0, 450, 7), anim(0, 'boss', 'scared'),
      tw(60, 'boss', { y: 460 }, 420, 'outQuad'), tw(0, 'camera', { x: 560, sx: 1 }, 400, 'inOutQuad'),
    ]),
    /** La fusée cale. B.B. nargue le joueur. */
    paced(0.8, seg('RKT_B_STALL', 'action', 1100, 'compress', [
      ...fuseOut, fx(0, 'smoke', 60, -10, 10, 'boss'), sound(0, 'pfft'), anim(80, 'boss', 'lookdown'), punch(0, 180, 3),
      sound(520, 'pfft', 1.4), fx(520, 'smoke', 60, -10, 5, 'boss'), anim(700, 'boss', 'taunt'), sound(720, 'laugh'),
      tw(600, 'camera', { x: 580, sx: 1.12 }, 400, 'inOutQuad'),
    ])),
    seg('RKT_C_UP', 'action', 480, 'compress', [
      ...fuseOut, sound(0, 'roar', 1.2), fx(0, 'flame', 60, 0, 22, 'boss'), shake(0, 400, 6), anim(0, 'boss', 'scared'),
      tw(40, 'boss', { x: 640, y: 270 }, 440, 'inQuad'), tw(60, 'camera', { x: 600, y: 300 }, 400, 'outQuad'),
    ]),
    // ---------------------------------------------------------------- TWISTS
    seg('RKT_T_ZIGZAG', 'twist', 520, 'compress', [
      tw(0, 'boss', { x: 820, y: 380, rot: 0.4 }, 250, 'inOutQuad'), tw(250, 'boss', { x: 380, y: 300, rot: -0.4 }, 250, 'inOutQuad'),
      fx(250, 'smoke', 0, -40, 6, 'boss'), sound(250, 'whoosh'), shake(0, 520, 7),
    ]),
    /** Silence… puis redémarrage brutal. */
    paced(0.85, seg('RKT_T_REIGNITE', 'twist', 560, 'compress', [
      silence(0, 300), sound(300, 'roar'), fx(300, 'flame', 60, 0, 22, 'boss'), shake(300, 250, 8), anim(300, 'boss', 'scared'),
    ])),
    /** Énorme fumée : pendant un instant, impossible de savoir ce qui s'est passé. */
    paced(0.7, seg('RKT_T_SMOKE', 'twist', 800, 'compress', [
      tw(0, 'fog', { alpha: 0.96 }, 160, 'outQuad'), fx(0, 'smoke', 650, 450, 30), sound(0, 'pfft', 0.6), sound(40, 'roar', 0.7),
      shake(0, 500, 6), silence(260, 540),
    ])),
    /** Elle part… sans lui. B.B. rit. */
    paced(0.7, seg('RKT_T_MISS', 'twist', 1000, 'compress', [
      anim(0, 'boss', 'hop'), state(0, 'boss', 'seat=none'), tw(0, 'boss', { x: 720, y: 560 }, 200, 'outQuad'),
      state(0, 'chairProp', 'kind=rocket'), tw(0, 'chairProp', { x: 650, y: 560, alpha: 1, rot: 0 }, 1, 'linear'),
      tw(30, 'chairProp', { x: 420, y: 250, rot: -0.8 }, 380, 'inQuad'), tw(410, 'chairProp', { x: 900, y: 180, rot: 0.6 }, 380, 'inOutQuad'),
      sound(30, 'whoosh'), sound(410, 'whoosh', 1.2), anim(450, 'boss', 'laugh'), sound(480, 'laugh'),
      tw(0, 'camera', { x: 620, sx: 1 }, 300, 'inOutQuad'),
    ])),
    /** À travers le toit. Silence. */
    paced(0.7, seg('RKT_T_THROUGH', 'twist', 800, 'compress', [
      tw(0, 'boss', { x: 640, y: -360 }, 260, 'inQuad'), state(200, 'ceiling', 'hole'), sound(220, 'crash'), fx(220, 'dust', 650, 70, 18),
      shake(220, 300, 8), silence(400, 400),
    ])),

    // ---------------------------------------------------------------- FINS
    seg('RKT_E_LAND', 'action', 700, 'compress', [
      tw(0, 'boss', { x: 650, y: 560, rot: 0 }, 420, 'outBounce'), sound(420, 'plop'), anim(440, 'boss', 'smug'),
      { kind: 'signal', at: 460, signal: 'reveal' }, sound(460, 'pfft', 1.6), tw(0, 'camera', { x: 560, sx: 1 }, 400, 'inOutQuad'),
    ]),
    seg('RKT_E_ZZCABINET', 'action', 320, 'compress', [
      tw(0, 'boss', { x: 180, y: 480, rot: -0.6 }, 320, 'inQuad'), tw(0, 'camera', { x: 400 }, 300, 'outQuad'),
    ]),
    seg('RKT_E_ZZWINDOW', 'action', 560, 'compress', [
      tw(0, 'boss', { x: 700, y: 220, rot: 0.3 }, 220, 'inOutQuad'), tw(220, 'boss', { x: 236, y: 330, rot: -0.6 }, 340, 'inQuad'),
      sound(220, 'whoosh'), tw(220, 'camera', { x: 420 }, 380, 'outQuad'),
    ]),
    seg('RKT_AWAY', 'impact', 700, 'compress', [
      anim(0, 'boss', 'away'), tw(0, 'boss', { x: 120, y: 160, z: 1800, alpha: 0, rot: -5 }, 650, 'outQuad'), sound(60, 'fall', 1.2),
      tw(300, 'camera', { x: 500 }, 400, 'inOutQuad'),
    ]),
    seg('RKT_E_HOVERBF', 'action', 900, 'compress', [
      tw(60, 'boss', { y: 330 }, 420, 'outQuad'), anim(520, 'boss', 'furious'), punch(520, 220, 6), tw(520, 'dim', { alpha: 0.35 }, 300),
    ]),
    seg('RKT_E_FIZZLE', 'action', 620, 'compress', [
      tw(100, 'boss', { y: 540 }, 100, 'outQuad'), tw(200, 'boss', { y: 560 }, 150, 'inQuad'), sound(220, 'plop'),
      fx(220, 'soot', 60, -10, 6, 'boss'), { kind: 'signal', at: 360, signal: 'reveal' }, anim(360, 'boss', 'smug'), sound(380, 'wahwah'),
      tw(0, 'camera', { x: 540, sx: 1.05 }, 400, 'inOutQuad'),
    ]),
    seg('RKT_E_CEILING', 'action', 400, 'compress', [
      state(0, 'boss', 'face=soot'), anim(0, 'boss', 'scared'), tw(0, 'boss', { x: 640, y: 250 }, 380, 'inQuad'),
      tw(0, 'camera', { x: 560, y: 330 }, 380, 'outQuad'),
    ]),
    /** WENDELL CEILING : la fumée se dissipe. B.B. est tranquillement à son bureau ; Wendell est collé au plafond. */
    paced(0.8, seg('RKT_E_WCEIL', 'action', 900, 'compress', [
      tw(0, 'boss', { x: 650, y: 560, rot: 0, alpha: 1 }, 1, 'linear'), state(0, 'boss', 'seat=chair'), anim(0, 'boss', 'idle'),
      tw(0, 'wendell', { x: 600, y: 250, rot: 0 }, 1, 'linear'), anim(0, 'wendell', 'stuck'),
      tw(0, 'fog', { alpha: 0 }, 450, 'inQuad'), { kind: 'signal', at: 350, signal: 'reveal' },
      anim(600, 'boss', 'lookup'), sound(650, 'hmpf', 0.9), fx(600, 'dust', 600, 70, 8), tw(0, 'camera', { x: 560, y: 330, sx: 1 }, 400, 'inOutQuad'),
    ])),
    /** …ou B.B. a tranquillement éteint sa fusée à l'extincteur. Mousse partout. */
    paced(0.8, seg('RKT_E_FOAM', 'action', 800, 'compress', [
      tw(0, 'boss', { x: 650, y: 560, rot: 0, alpha: 1 }, 1, 'linear'), state(0, 'boss', 'seat=chair'), anim(0, 'boss', 'smug'),
      state(0, 'extinguisher', 'fired'), tw(0, 'fog', { alpha: 0 }, 450, 'inQuad'), fx(80, 'foam', 650, 520, 26), sound(80, 'spray', 0.8),
      { kind: 'signal', at: 350, signal: 'reveal' }, tw(0, 'camera', { x: 580, y: 350, sx: 1.05 }, 400, 'inOutQuad'),
    ])),
    /** …ou c'est B.B. qui est collé au plafond. */
    seg('RKT_E_BBCEIL', 'action', 300, 'compress', [
      tw(0, 'boss', { x: 640, y: 250, rot: 0, alpha: 1 }, 1, 'linear'), state(0, 'boss', 'face=soot'), anim(0, 'boss', 'splat'),
      tw(0, 'fog', { alpha: 0 }, 450, 'inQuad'), tw(0, 'camera', { x: 560, y: 330, sx: 1 }, 400, 'inOutQuad'),
    ]),
    /** …ou il n'y a plus personne, et un trou dans la vitre. COO regarde par le trou. */
    seg('RKT_E_CRATER', 'action', 350, 'compress', [
      tw(0, 'boss', { alpha: 0 }, 1, 'linear'), tw(0, 'fog', { alpha: 0 }, 450, 'inQuad'),
      anim(150, 'coo', 'fly'), tw(150, 'coo', { x: 236, y: 250 }, 300, 'outQuad'), tw(0, 'camera', { x: 440, sx: 1 }, 400, 'inOutQuad'),
    ]),
    seg('RKT_E_SMOKEBF', 'action', 500, 'compress', [
      tw(0, 'boss', { x: 650, y: 560, rot: 0, alpha: 1 }, 1, 'linear'), tw(0, 'fog', { alpha: 0 }, 400, 'inQuad'),
      tw(100, 'glow', { x: 650, y: 420, alpha: 0.9 }, 200, 'outQuad'), sound(150, 'gold'), anim(200, 'boss', 'furious'),
    ]),
    /** Elle sort seule par la fenêtre : la vitre explose… et c'est une perte. */
    seg('RKT_E_OUTWINDOW', 'action', 700, 'compress', [
      tw(0, 'chairProp', { x: 236, y: 250, rot: -2 }, 320, 'inQuad'), sound(320, 'glass'), state(320, 'window', 'broken'),
      fx(320, 'glass', 220, 230, 18), tw(340, 'chairProp', { alpha: 0 }, 120, 'linear'), anim(360, 'boss', 'laugh'),
      { kind: 'signal', at: 380, signal: 'reveal' }, sound(400, 'laugh'), tw(0, 'camera', { x: 500 }, 300, 'inOutQuad'),
    ]),
    /** RARE, double retournement : COO percute la fusée, qui fait demi-tour… vers B.B. */
    seg('RKT_E_COOSAVE', 'action', 640, 'compress', [
      anim(0, 'coo', 'fly'), tw(0, 'coo', { x: 820, y: 220 }, 300, 'outQuad'), sound(150, 'coo'), sound(320, 'bonk'),
      fx(320, 'feathers', 840, 200, 14), anim(320, 'coo', 'crash'), tw(330, 'coo', { x: 760, y: 560, rot: 1.2 }, 400, 'outBounce'),
      tw(330, 'chairProp', { x: 700, y: 470, rot: 2.4 }, 300, 'inQuad'), anim(450, 'boss', 'surprised'), tw(630, 'chairProp', { alpha: 0 }, 60, 'linear'),
    ]),
    /** Sous le ventilateur : les pales lui taillent la mèche. Il redescend, digne. */
    seg('RKT_E_FANTRIM', 'action', 900, 'compress', [
      sound(0, 'pfft', 1.2), anim(0, 'boss', 'scared'), sound(150, 'crack'), state(150, 'boss', 'meche=cut'), fx(150, 'hair', 0, -230, 14, 'boss'),
      anim(260, 'boss', 'smug'), tw(250, 'boss', { x: 600, y: 560 }, 600, 'outQuad'), { kind: 'signal', at: 400, signal: 'reveal' },
      sound(850, 'plop'), tw(250, 'camera', { x: 560, y: 350 }, 500, 'inOutQuad'),
    ]),
  ]),
  branches: [
    compose('RKT-A1', 'Balade et atterrissage', [A, ZIGZAG], [{ seg: 'RKT_E_LAND' }, { reaction: 'auto' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('RKT-A2', 'Zigzag, classeur', [A, ZIGZAG], [{ seg: 'RKT_E_ZZCABINET' }, { impact: 'wall' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('RKT-A3', 'Zigzag, fenêtre', [A, ZIGZAG], [{ seg: 'RKT_E_ZZWINDOW' }, { impact: 'window' }, { seg: 'RKT_AWAY' }, { reaction: 'away' }], { categories: ['DIRECT', 'COMEBACK', 'CHAIN', 'SUPER'], classes: WIN_BIG, rarity: 'COMMON', d1: D1 }),
    compose('RKT-A4', 'Vol stationnaire', [A], [{ seg: 'RKT_E_HOVERBF' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'COMMON', d1: D1 }),
    compose('RKT-B1', 'Pétard mouillé', [B], [{ seg: 'RKT_E_FIZZLE' }, { reaction: 'auto' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('RKT-B2', 'Rallumage, plafond', [B, REIGNITE], [{ seg: 'RKT_E_CEILING' }, { impact: 'ceiling' }, { reaction: 'away' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('RKT-B3', 'WENDELL CEILING', [B, REIGNITE, SMOKE], [{ seg: 'RKT_E_WCEIL' }, { reaction: 'SIP' }], { categories: ['BACKFIRE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('RKT-B9', 'Fumée : l\'extincteur', [B, REIGNITE, SMOKE], [{ seg: 'RKT_E_FOAM' }, { reaction: 'SIP' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('RKT-B4', 'Fumée : B.B. au plafond', [B, REIGNITE, SMOKE], [{ seg: 'RKT_E_BBCEIL' }, { impact: 'ceiling' }, { reaction: 'away' }], { categories: ['COMEBACK', 'DIRECT', 'GRAZE'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('RKT-B5', 'Fumée : le cratère', [B, REIGNITE, SMOKE], [{ seg: 'RKT_E_CRATER' }, { impact: 'window' }, { reaction: 'away' }], { categories: ['CHAIN', 'SUPER', 'COMEBACK'], classes: WIN_BIG, rarity: 'RARE', d1: D1 }),
    compose('RKT-B6', 'Fumée dorée', [B, REIGNITE, SMOKE], [{ seg: 'RKT_E_SMOKEBF' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'UNCOMMON', d1: D1 }),
    compose('RKT-B7', 'Elle part sans lui', [B, REIGNITE, MISS], [{ seg: 'RKT_E_OUTWINDOW' }, { reaction: 'SIP' }], { categories: ['BACKFIRE', 'TEASE'], classes: LOSS, rarity: 'RARE', d1: D1 }),
    compose('RKT-B8', 'COO fait demi-tour', [B, REIGNITE, MISS], [{ seg: 'RKT_E_COOSAVE' }, { impact: 'none' }, { reaction: 'auto' }], { categories: ['COMEBACK', 'CHAIN', 'DIRECT'], classes: WIN_MID, rarity: 'RARE', d1: D1 }),
    compose('RKT-C1', 'Coupe ventilateur', [C], [{ seg: 'RKT_E_FANTRIM' }, { reaction: 'auto' }], { categories: ['TEASE', 'CLEAN_MISS'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('RKT-C2', 'Plafond direct', [C], [{ seg: 'RKT_E_CEILING' }, { impact: 'ceiling' }, { reaction: 'away' }], { categories: ['DIRECT', 'GRAZE'], classes: WIN_SMALL, rarity: 'UNCOMMON', d1: D1 }),
    compose('RKT-C3', 'Le toit, puis l\'ascenseur : intact', [C, THROUGH, ELEV], [{ seg: 'ELEV_SAFE' }], { categories: ['CLEAN_MISS', 'BACKFIRE'], classes: LOSS, rarity: 'UNCOMMON', d1: D1 }),
    compose('RKT-C4', 'Le toit, puis l\'ascenseur : en miettes', [C, THROUGH, ELEV], [{ seg: 'ELEV_WRECK' }, { impact: 'elevator' }, { reaction: 'auto' }], { categories: ['DIRECT', 'COMEBACK', 'GRAZE'], classes: WIN_ANY, rarity: 'UNCOMMON', d1: D1 }),
    compose('RKT-C5', 'Le toit, puis l\'ascenseur : avalanche', [C, THROUGH, ELEV], [{ seg: 'ELEV_MEGA' }, { impact: 'elevator' }, { reaction: 'OFFICE_CHEER' }], { categories: ['CHAIN', 'SUPER'], classes: WIN_BIG, rarity: 'RARE', d1: D1 }),
  ],
};
