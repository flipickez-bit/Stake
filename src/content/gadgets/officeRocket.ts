/**
 * OFFICE ROCKET (UNHINGED) — placeholder Phase 0.
 * Mèche, pfft, calage, rire… et silence. Le fake-out spectaculaire du MVP.
 */
import type { GadgetDef } from '../../presentation/types';
import { anim, fx, punch, seg, segments, shake, sound, state, tw } from '../dsl';

export const officeRocket: GadgetDef = {
  id: 'office-rocket',
  label: 'OFFICE ROCKET',
  rageLevel: 'unhinged',
  layout: {
    boss: { transform: { x: 650, y: 560 }, states: { seat: 'rocket', mug: 'normal', face: 'normal' }, anim: 'sip' },
    fuse: { transform: { x: 700, y: 556 }, states: { main: 'unlit' } },
    spark: { transform: { x: 952, y: 552, alpha: 0 } },
  },
  props: ['fuse', 'spark'],
  trunk: ['RKT_IN', 'RKT_FUSE'],
  hold: { sound: 'fuse', everyMs: 500 },
  segments: segments([
    seg('RKT_IN', 'intro', 450, 'compress', [
      anim(0, 'hands', 'lighter'), tw(0, 'hands', { x: 958, y: 520 }, 380, 'outBack'), anim(0, 'boss', 'sip'), sound(380, 'click', 1.4),
    ]),
    seg('RKT_FUSE', 'setup', 900, 'compress', [
      state(0, 'fuse', 'lit'), tw(0, 'spark', { alpha: 1 }, 60, 'linear'), sound(0, 'fuse'),
      tw(0, 'spark', { x: 716 }, 880, 'linear'), tw(100, 'hands', { y: 840 }, 300, 'inQuad'),
      tw(0, 'camera', { x: 620, sx: 1.08 }, 800, 'inOutQuad'), anim(450, 'boss', 'sniff'),
    ]),
    // ---------------------------------------------------------------- ACTION commune : pfft… et calage
    seg('RKT_PFFT', 'action', 420, 'compress', [
      tw(0, 'spark', { alpha: 0 }, 60, 'linear'), state(0, 'fuse', 'burnt'), fx(0, 'smoke', 60, -10, 10, 'boss'),
      sound(0, 'pfft'), anim(80, 'boss', 'lookdown'), punch(0, 180, 3),
    ]),
    seg('RKT_STALL', 'action', 650, 'compress', [
      sound(150, 'pfft', 1.4), fx(150, 'smoke', 60, -10, 5, 'boss'), anim(300, 'boss', 'laugh'), sound(300, 'laugh'),
      tw(200, 'camera', { x: 500, sx: 1 }, 400, 'inOutQuad'),
    ]),
    // ---------------------------------------------------------------- LOSS : elle s'éteint
    seg('RKT_L_FIZZLE', 'action', 620, 'compress', [
      tw(100, 'boss', { y: 540 }, 100, 'outQuad'), tw(200, 'boss', { y: 560 }, 150, 'inQuad'), sound(220, 'plop'),
      fx(220, 'soot', 60, -10, 6, 'boss'), { kind: 'signal', at: 360, signal: 'reveal' }, anim(360, 'boss', 'smug'), sound(380, 'wahwah'),
    ]),
    // ---------------------------------------------------------------- WIN : rallumage, droit au plafond
    seg('RKT_W_REIGNITE', 'action', 520, 'compress', [
      sound(0, 'roar'), fx(0, 'flame', 60, 0, 22, 'boss'), shake(0, 420, 8), anim(0, 'boss', 'scared'),
      tw(60, 'boss', { y: 250 }, 440, 'inQuad'), state(0, 'boss', 'face=soot'),
    ]),
    // ---------------------------------------------------------------- BIG WIN : rallumage, zigzag, fenêtre
    seg('RKT_BW_ZIGZAG', 'action', 1080, 'compress', [
      sound(0, 'roar'), fx(0, 'flame', 60, 0, 22, 'boss'), shake(0, 900, 9), anim(0, 'boss', 'scared'), state(0, 'boss', 'face=soot'),
      tw(0, 'boss', { x: 820, y: 380, rot: 0.4 }, 250, 'inOutQuad'), tw(250, 'boss', { x: 380, y: 300, rot: -0.4 }, 250, 'inOutQuad'),
      tw(500, 'boss', { x: 700, y: 220, rot: 0.3 }, 220, 'inOutQuad'), tw(720, 'boss', { x: 236, y: 330, rot: -0.6 }, 360, 'inQuad'),
      fx(250, 'smoke', 0, -40, 6, 'boss'), fx(500, 'smoke', 0, -40, 6, 'boss'), fx(720, 'smoke', 0, -40, 6, 'boss'),
      sound(500, 'whoosh'),
    ]),
    seg('RKT_BW_AWAY', 'impact', 700, 'compress', [
      anim(0, 'boss', 'away'), tw(0, 'boss', { x: 120, y: 160, z: 1800, alpha: 0, rot: -5 }, 650, 'outQuad'), sound(60, 'fall', 1.2),
    ]),
    // ---------------------------------------------------------------- BOSS FIGHT : rallumage, il plane… et se fâche
    seg('RKT_BF_HOVER', 'action', 900, 'compress', [
      sound(0, 'roar'), fx(0, 'flame', 60, 0, 22, 'boss'), shake(0, 400, 7), anim(0, 'boss', 'scared'),
      tw(60, 'boss', { y: 330 }, 420, 'outQuad'), anim(520, 'boss', 'furious'), punch(520, 220, 6),
      tw(520, 'dim', { alpha: 0.35 }, 300),
    ]),
  ]),
  branches: [
    { id: 'RKT-L', label: 'Pétard mouillé', categories: ['CLEAN_MISS', 'BACKFIRE', 'TEASE'], classes: ['MISS'], rarity: 'common', d1: 'fuse-out',
      steps: [{ seg: 'RKT_PFFT' }, { seg: 'RKT_STALL' }, { seg: 'RKT_L_FIZZLE' }, { reaction: 'auto' }] },
    { id: 'RKT-W', label: 'Plafond', categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: ['SCRAPE', 'HIT'], rarity: 'common', d1: 'fuse-out',
      steps: [{ seg: 'RKT_PFFT' }, { seg: 'RKT_STALL' }, { silence: 350 }, { seg: 'RKT_W_REIGNITE' }, { impact: 'ceiling' }, { reaction: 'away' }] },
    { id: 'RKT-BW', label: 'Zigzag', categories: ['DIRECT', 'COMEBACK', 'CHAIN', 'SUPER'], classes: ['BIG', 'MEGA', 'LEGENDARY'], rarity: 'common', d1: 'fuse-out',
      steps: [{ seg: 'RKT_PFFT' }, { seg: 'RKT_STALL' }, { silence: 350 }, { seg: 'RKT_BW_ZIGZAG' }, { impact: 'window' }, { seg: 'RKT_BW_AWAY' }, { reaction: 'away' }] },
    { id: 'RKT-BF', label: 'Vol stationnaire', categories: ['BF_ENTRY'], classes: ['HIT', 'BIG', 'MEGA', 'LEGENDARY'], rarity: 'common', d1: 'fuse-out',
      steps: [{ seg: 'RKT_PFFT' }, { seg: 'RKT_STALL' }, { silence: 350 }, { seg: 'RKT_BF_HOVER' }, { bossFight: true }] },
  ],
};
