/**
 * PLAN B · ESPRESSO BLASTER (GRUMPY) — PROTOTYPE du POC « 3 PLANS ». Pas les 15–20 branches d'un gadget final :
 * juste de quoi tester le choix, l'UX et la compréhension, avec une présentation honnête pour chaque résultat.
 *
 * Tronc neutre : les mains tirent le levier, la pression monte (aiguille, vapeur), B.B. sirote sans rien voir.
 * Module commun (toutes les issues) : LE TIR (recul, nuage de vapeur qui cache la bouche du canon).
 * Fins : la tasse part en cloche dans TOUTES les fins sauf la panne et la surpression ; on ne sait qu'à l'arrivée si
 * B.B. l'attrape (LE SIP), la reçoit en plein visage, ou si elle devient dorée (BOSS FIGHT).
 */
import type { GadgetDef } from '../../../presentation/types';
import { anim, BOSS_FIGHT, compose, freeze, fx, LOSS, mod, punch, seg, segments, shake, signal, sound, state, tw, WIN_ANY, WIN_BIG } from '../../dsl';
import { ESP, ESP_MUZZLE, PLAN_SCALE as S } from './stations';

const D1 = 'pressure-max';
const SHOT = mod('SHOT', { seg: 'ESP_SHOT' });
const handsAway = (at: number) => tw(at, 'hands', { y: 1060 }, 220, 'inQuad');

/** Tasse en cloche vers B.B. (commune à trois fins) : départ de la bouche du canon, sommet au-dessus du bureau. */
const LOB_MS = 520;
const lob = (at: number, to: { x: number; y: number }) => [
  tw(at, 'espCup', { x: ESP_MUZZLE.x, y: ESP_MUZZLE.y, alpha: 1, rot: 0 }, 1, 'linear'),
  tw(at + 2, 'espCup', { x: (ESP_MUZZLE.x + to.x) / 2, y: 250 }, LOB_MS / 2, 'outQuad'),
  tw(at + 2 + LOB_MS / 2, 'espCup', { x: to.x, y: to.y }, LOB_MS / 2, 'inQuad'),
  tw(at + 2, 'espCup', { rot: 6.2832 }, LOB_MS, 'linear'),
  sound(at, 'whoosh', 1.3),
];

const FACE = { x: 630, y: 392 };
const HAND = { x: 596, y: 446 };

export const espressoBlaster: GadgetDef = {
  id: 'espresso-blaster',
  label: 'ESPRESSO BLASTER',
  rageLevel: 'grumpy',
  layout: {
    boss: { transform: { x: 650, y: 560 }, states: { seat: 'chair', mug: 'normal', face: 'normal' }, anim: 'sip' },
    espresso: { transform: { x: ESP.body.x, y: ESP.body.y, sx: S, sy: S } },
    espBarrel: { transform: { x: ESP.barrel.x, y: ESP.barrel.y, rot: ESP.aim, sx: S, sy: S } },
    espNeedle: { transform: { x: ESP.needle.x, y: ESP.needle.y, rot: -1.2, sx: S, sy: S } },
    espCup: { transform: { x: ESP_MUZZLE.x, y: ESP_MUZZLE.y, alpha: 0 } },
  },
  props: ['espresso', 'espBarrel', 'espNeedle', 'espCup'],
  trunk: ['ESP_IN', 'ESP_PRESSURE'],
  hold: { sound: 'pfft', everyMs: 700 },
  segments: segments([
    // ---------------------------------------------------------------- tronc (neutre, avant le résultat)
    seg('ESP_IN', 'intro', 450, 'compress', [
      anim(0, 'hands', 'open'), tw(0, 'hands', { x: ESP.lever.x + 8, y: ESP.lever.y + 34 }, 360, 'outBack'),
      anim(0, 'boss', 'sip'), anim(380, 'hands', 'grab'), sound(380, 'click'),
    ]),
    seg('ESP_PRESSURE', 'setup', 700, 'compress', [
      anim(0, 'hands', 'strain'), tw(0, 'hands', { y: ESP.lever.y + 52 }, 600, 'inOutQuad'),
      tw(0, 'espNeedle', { rot: 0.7 }, 650, 'inOutQuad'),
      tw(0, 'espresso', { sy: S * 1.03, sx: S * 0.98 }, 160, 'inOutQuad'), tw(160, 'espresso', { sy: S * 0.98, sx: S * 1.02 }, 160, 'inOutQuad'),
      tw(320, 'espresso', { sy: S * 1.04, sx: S * 0.97 }, 160, 'inOutQuad'), tw(480, 'espresso', { sy: S, sx: S }, 200, 'outQuad'),
      fx(80, 'steam', ESP.steam.x, ESP.steam.y, 3), fx(420, 'steam', ESP.steam.x, ESP.steam.y, 4),
      sound(0, 'creak'), sound(120, 'pfft', 1.3), sound(430, 'pfft', 1.5),
      anim(200, 'boss', 'oblivious'), tw(0, 'camera', { x: 560, y: 380, sx: 1.06 }, 600, 'inOutQuad'),
    ]),

    // ---------------------------------------------------------------- module commun : LE TIR
    seg('ESP_SHOT', 'action', 320, 'compress', [
      anim(0, 'hands', 'open'), handsAway(40),
      tw(0, 'espNeedle', { rot: 1.2 }, 80, 'outQuad'), sound(0, 'pfft', 0.8), sound(20, 'snap', 0.7),
      tw(0, 'espBarrel', { rot: ESP.aim + 0.22 }, 60, 'outQuad'), tw(60, 'espBarrel', { rot: ESP.aim }, 220, 'outElastic'),
      tw(0, 'espresso', { x: ESP.body.x - 10 }, 60, 'outQuad'), tw(60, 'espresso', { x: ESP.body.x }, 200, 'outQuad'),
      fx(0, 'steam', ESP_MUZZLE.x, ESP_MUZZLE.y, 10), fx(0, 'smoke', ESP_MUZZLE.x, ESP_MUZZLE.y, 3),
      punch(0, 160, 3), anim(80, 'boss', 'surprised'),
    ]),

    // ---------------------------------------------------------------- FINS (chacune contient la révélation)
    /** Perte : il attrape la tasse au vol… et la boit (LE SIP). */
    seg('ESP_E_CATCH', 'action', LOB_MS + 220, 'compress', [
      ...lob(0, HAND), anim(LOB_MS - 180, 'boss', 'sip'),
      tw(LOB_MS + 4, 'espCup', { alpha: 0 }, 60, 'linear'), sound(LOB_MS + 10, 'plop', 1.3),
      signal(LOB_MS + 60, 'reveal'), tw(LOB_MS, 'camera', { x: 540, y: 360, sx: 1.08 }, 200, 'outQuad'),
    ]),
    /** Perte : panne. Le canon pique du nez, un filet de café, un nuage de vapeur sur les mains du joueur. */
    seg('ESP_E_FIZZLE', 'action', 900, 'compress', [
      tw(0, 'espBarrel', { rot: ESP.aim + 0.9 }, 260, 'outBounce'), sound(20, 'deflate'),
      tw(0, 'espNeedle', { rot: -1.2 }, 400, 'inOutQuad'),
      fx(240, 'coffee', ESP_MUZZLE.x + 40, ESP_MUZZLE.y + 60, 5), sound(260, 'plop', 0.8),
      fx(320, 'steam', ESP.body.x, ESP.body.y - 90, 14), fx(340, 'smoke', ESP.body.x, ESP.body.y - 72, 5), sound(330, 'pfft', 0.7),
      anim(380, 'boss', 'laugh'), signal(420, 'reveal'), sound(440, 'laugh'),
      tw(300, 'camera', { x: 540, y: 360, sx: 1 }, 400, 'inOutQuad'),
    ]),
    /** Gain : la tasse retombe en plein sur B.B. (le reveal est au contact, bibliothèque IMPACT). */
    seg('ESP_E_SPLASH', 'action', LOB_MS + 20, 'compress', [
      ...lob(0, FACE), anim(LOB_MS - 140, 'boss', 'scared'),
      tw(LOB_MS + 2, 'espCup', { alpha: 0 }, 40, 'linear'), fx(LOB_MS, 'coffee', FACE.x, FACE.y, 16),
      tw(LOB_MS - 200, 'camera', { x: 600, y: 380, sx: 1.1 }, 200, 'inQuad'),
    ]),
    /** Gros gain : surpression. Le canon crache un jet continu qui emporte B.B. et son fauteuil par la fenêtre. */
    seg('ESP_E_OVERLOAD', 'action', 760, 'compress', [
      tw(0, 'espNeedle', { rot: 1.9 }, 120, 'outQuad'), sound(0, 'screech', 1.4), shake(0, 260, 4),
      tw(0, 'espresso', { sx: S * 1.06, sy: S * 0.94 }, 90, 'outQuad'), tw(90, 'espresso', { sx: S, sy: S }, 200, 'outElastic'),
      fx(60, 'coffee', ESP_MUZZLE.x, ESP_MUZZLE.y, 20), fx(160, 'coffee', 620, 420, 20), fx(80, 'steam', ESP_MUZZLE.x, ESP_MUZZLE.y, 12),
      sound(80, 'spray'), sound(120, 'whoosh'), anim(140, 'boss', 'scared'),
      tw(160, 'boss', { x: 330, y: 400, rot: -0.5 }, 380, 'outQuad'), tw(560, 'boss', { x: 236, y: 330 }, 160, 'inQuad'),
      tw(160, 'camera', { x: 420, y: 350, sx: 1.12 }, 480, 'outQuad'), anim(520, 'boss', 'lookcam'), freeze(540, 110),
      tw(700, 'camera', { sx: 1.2 }, 900, 'outQuad'),
    ]),
    /** Sortie par la fenêtre (même grammaire que le lance-pierre) : le décor réagit, B.B. devient une étoile. */
    seg('ESP_AWAY', 'impact', 700, 'compress', [
      anim(0, 'boss', 'away'), tw(0, 'boss', { x: 150, y: 240, z: 1600, alpha: 0, rot: -4 }, 650, 'outQuad'), sound(60, 'fall', 1.1),
      tw(0, 'portrait', { rot: 0.22 }, 110, 'outQuad'), tw(110, 'portrait', { rot: 0 }, 520, 'outElastic'),
      fx(40, 'papers', 440, 150, 8), sound(60, 'paper'),
      tw(300, 'camera', { x: 500, y: 350, sx: 1 }, 400, 'inOutQuad'), fx(640, 'sparks', 150, 240, 3), sound(650, 'tink', 1.9),
    ]),
    /** BOSS FIGHT : la tasse qu'il attrape est DORÉE. */
    seg('ESP_E_GOLD', 'twist', LOB_MS + 420, 'compress', [
      ...lob(0, HAND), anim(LOB_MS - 180, 'boss', 'sip'),
      tw(LOB_MS + 4, 'espCup', { alpha: 0 }, 60, 'linear'), sound(LOB_MS + 10, 'plop', 1.3),
      state(LOB_MS + 60, 'boss', 'mug=gold'), sound(LOB_MS + 80, 'gold'), fx(LOB_MS + 80, 'gold', HAND.x, HAND.y - 20, 18),
      anim(LOB_MS + 120, 'boss', 'furious'), tw(LOB_MS, 'camera', { x: 540, y: 360, sx: 1.08 }, 260, 'outQuad'),
    ]),
  ]),
  branches: [
    compose('ESP-L1', 'Il attrape la tasse', [SHOT], [{ seg: 'ESP_E_CATCH' }, { reaction: 'SIP' }], { categories: ['CLEAN_MISS', 'TEASE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('ESP-L2', 'Panne de pression', [SHOT], [{ seg: 'ESP_E_FIZZLE' }], { categories: ['BACKFIRE'], classes: LOSS, rarity: 'COMMON', d1: D1 }),
    compose('ESP-W1', 'En plein visage', [SHOT], [{ seg: 'ESP_E_SPLASH' }, { impact: 'overdesk' }, { reaction: 'auto' }], { categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: WIN_ANY, rarity: 'COMMON', d1: D1 }),
    compose('ESP-W2', 'Surpression', [SHOT], [{ seg: 'ESP_E_OVERLOAD' }, { impact: 'window' }, { seg: 'ESP_AWAY' }, { reaction: 'away' }], { categories: ['DIRECT', 'COMEBACK', 'CHAIN', 'SUPER'], classes: WIN_BIG, rarity: 'COMMON', d1: D1 }),
    compose('ESP-BF', 'Espresso doré', [SHOT], [{ seg: 'ESP_E_GOLD' }, { bossFight: true }], { categories: ['BF_ENTRY'], classes: BOSS_FIGHT, rarity: 'COMMON', d1: D1 }),
  ],
};
