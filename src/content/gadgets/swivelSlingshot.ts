/**
 * SWIVEL SLINGSHOT (GRUMPY) — placeholder Phase 0.
 * La chaise du boss est tirée à l'élastique, puis lâchée. Tronc commun jusqu'au lâcher (D1),
 * puis ACTION commune (la chaise part) : l'issue se lit ~250 ms plus tard (rappel ou rupture de l'élastique).
 */
import type { GadgetDef } from '../../presentation/types';
import { anim, fx, punch, seg, segments, shake, sound, state, tw } from '../dsl';

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
    // ---------------------------------------------------------------- ACTION commune : le lâcher
    seg('SLG_RELEASE', 'action', 260, 'compress', [
      anim(0, 'hands', 'open'), sound(0, 'twang'), tw(0, 'boss', { x: 470 }, 260, 'inQuad'), anim(0, 'boss', 'surprised'),
      tw(0, 'camera', { x: 500, sx: 1 }, 300, 'outQuad'), tw(40, 'hands', { y: 840 }, 220, 'inQuad'),
    ]),
    // ---------------------------------------------------------------- LOSS : l'élastique le ramène
    seg('SLG_L_YANK', 'action', 760, 'compress', [
      tw(0, 'boss', { x: 440 }, 60, 'linear'), sound(60, 'boing'), anim(60, 'boss', 'spin'),
      tw(80, 'boss', { x: 700 }, 620, 'outElastic'),
    ]),
    seg('SLG_L_REVEAL', 'action', 380, 'compress', [anim(0, 'boss', 'dizzy'), { kind: 'signal', at: 260, signal: 'reveal' }, sound(260, 'wahwah')]),
    // ---------------------------------------------------------------- WIN : l'élastique casse, la chaise file au classeur
    seg('SLG_W_SNAP', 'action', 420, 'compress', [
      state(20, 'slingPost', 'elastic=snapped'), sound(20, 'twang', 1.6), anim(60, 'boss', 'scared'),
      tw(0, 'boss', { x: 176 }, 420, 'inQuad'), fx(40, 'dust', 0, -8, 5, 'boss'),
    ]),
    // ---------------------------------------------------------------- BIG WIN : décollage vers la fenêtre
    seg('SLG_BW_LAUNCH', 'action', 560, 'compress', [
      state(20, 'slingPost', 'elastic=snapped'), sound(20, 'twang', 1.6), anim(60, 'boss', 'scared'),
      tw(0, 'boss', { x: 330, y: 400, rot: -0.5 }, 400, 'outQuad'), tw(400, 'boss', { x: 236, y: 330 }, 160, 'inQuad'),
      sound(120, 'whoosh'),
    ]),
    seg('SLG_BW_AWAY', 'impact', 700, 'compress', [
      anim(0, 'boss', 'away'), tw(0, 'boss', { x: 150, y: 240, z: 1600, alpha: 0, rot: -4 }, 650, 'outQuad'), sound(60, 'fall', 1.1),
    ]),
    // ---------------------------------------------------------------- BOSS FIGHT : il freine des deux pieds
    seg('SLG_BF_SKID', 'action', 700, 'compress', [
      state(20, 'slingPost', 'elastic=snapped'), sound(20, 'twang', 1.6),
      tw(0, 'boss', { x: 360 }, 320, 'outCubic'), sound(60, 'screech'), fx(80, 'smoke', 0, -10, 8, 'boss'),
      punch(320, 240, 6), anim(320, 'boss', 'furious'), shake(320, 200, 5), tw(320, 'dim', { alpha: 0.35 }, 380),
    ]),
  ]),
  branches: [
    { id: 'SLG-L', label: 'Rappel élastique', categories: ['CLEAN_MISS', 'BACKFIRE', 'TEASE'], classes: ['MISS'], rarity: 'common', d1: 'released',
      steps: [{ seg: 'SLG_RELEASE' }, { seg: 'SLG_L_YANK' }, { seg: 'SLG_L_REVEAL' }, { reaction: 'auto' }] },
    { id: 'SLG-W', label: 'Classeur', categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: ['SCRAPE', 'HIT'], rarity: 'common', d1: 'released',
      steps: [{ seg: 'SLG_RELEASE' }, { seg: 'SLG_W_SNAP' }, { impact: 'wall' }, { reaction: 'auto' }] },
    { id: 'SLG-BW', label: 'Par la fenêtre', categories: ['DIRECT', 'COMEBACK', 'CHAIN', 'SUPER'], classes: ['BIG', 'MEGA', 'LEGENDARY'], rarity: 'common', d1: 'released',
      steps: [{ seg: 'SLG_RELEASE' }, { seg: 'SLG_BW_LAUNCH' }, { impact: 'window' }, { seg: 'SLG_BW_AWAY' }, { reaction: 'away' }] },
    { id: 'SLG-BF', label: 'Freinage furieux', categories: ['BF_ENTRY'], classes: ['HIT', 'BIG', 'MEGA', 'LEGENDARY'], rarity: 'common', d1: 'released',
      steps: [{ seg: 'SLG_RELEASE' }, { seg: 'SLG_BF_SKID' }, { bossFight: true }] },
  ],
};
