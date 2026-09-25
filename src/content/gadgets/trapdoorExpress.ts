/**
 * TRAPDOOR EXPRESS (FURIOUS) — placeholder Phase 0.
 * Levier, trappe, et le fameux temps suspendu au-dessus du vide : tout le monde voit le trou,
 * personne ne sait encore s'il va tomber.
 */
import type { GadgetDef } from '../../presentation/types';
import { anim, fx, punch, seg, segments, shake, sound, state, tw } from '../dsl';

export const trapdoorExpress: GadgetDef = {
  id: 'trapdoor-express',
  label: 'TRAPDOOR EXPRESS',
  rageLevel: 'furious',
  layout: {
    boss: { transform: { x: 650, y: 560 }, states: { seat: 'none', mug: 'normal', face: 'normal' }, anim: 'tapfoot' },
    trapdoor: { transform: { x: 650, y: 560 }, states: { main: 'closed' } },
    lever: { transform: { x: 945, y: 560, rot: -0.35 } },
  },
  props: ['trapdoor', 'lever'],
  trunk: ['TRP_IN', 'TRP_PULL'],
  hold: { sound: 'creak', everyMs: 650 },
  segments: segments([
    seg('TRP_IN', 'intro', 450, 'compress', [
      anim(0, 'hands', 'open'), tw(0, 'hands', { x: 945, y: 445 }, 380, 'outBack'),
      anim(0, 'boss', 'tapfoot'), anim(400, 'hands', 'grab'), sound(400, 'click'),
    ]),
    seg('TRP_PULL', 'setup', 650, 'compress', [
      anim(0, 'hands', 'strain'), tw(0, 'lever', { rot: 0.1 }, 600, 'inOutQuad'), tw(0, 'hands', { x: 925, y: 455 }, 600, 'inOutQuad'),
      sound(0, 'creak'), sound(300, 'creak', 0.9), anim(300, 'boss', 'oblivious'),
      tw(0, 'camera', { x: 600, sx: 1.05 }, 600, 'inOutQuad'),
    ]),
    // ---------------------------------------------------------------- ACTION commune : la trappe s'ouvre, il flotte
    seg('TRP_DROP', 'action', 760, 'compress', [
      tw(0, 'lever', { rot: 0.9 }, 120, 'outBack'), anim(0, 'hands', 'open'), sound(0, 'clunk'),
      state(120, 'trapdoor', 'open'), anim(120, 'boss', 'hover'), anim(320, 'boss', 'lookdown'), anim(560, 'boss', 'lookcam'),
      tw(0, 'camera', { x: 650, y: 380, sx: 1.15 }, 420, 'outQuad'), tw(60, 'hands', { y: 840 }, 260, 'inQuad'),
    ]),
    // ---------------------------------------------------------------- LOSS : il marche dans le vide jusqu'au bord
    seg('TRP_L_TIPTOE', 'action', 900, 'compress', [
      anim(0, 'boss', 'tiptoe'), tw(0, 'boss', { x: 752 }, 520, 'inOutQuad'), sound(520, 'boing', 0.8),
      { kind: 'signal', at: 560, signal: 'reveal' }, anim(560, 'boss', 'smug'), sound(580, 'wahwah'),
      state(650, 'trapdoor', 'closed'), sound(650, 'clunk'), tw(420, 'camera', { x: 500, y: 350, sx: 1 }, 420, 'inOutQuad'),
    ]),
    // ---------------------------------------------------------------- WIN : petit salut, puis chute
    seg('TRP_W_FALL', 'action', 540, 'compress', [
      anim(0, 'boss', 'wave'), anim(250, 'boss', 'fall'), tw(250, 'boss', { y: 900 }, 260, 'inQuad'), sound(230, 'fall'),
      tw(250, 'camera', { x: 620, y: 410, sx: 1.1 }, 280, 'outQuad'),
    ]),
    seg('TRP_CLOSE', 'reaction', 420, 'compress', [
      state(150, 'trapdoor', 'closed'), sound(150, 'clunk'), tw(0, 'camera', { x: 500, y: 350, sx: 1 }, 380, 'inOutQuad'),
    ]),
    // ---------------------------------------------------------------- BIG WIN : la chute interminable (12 étages)
    seg('TRP_BW_FALL', 'action', 960, 'compress', [
      anim(0, 'boss', 'wave'), anim(250, 'boss', 'fall'), tw(250, 'boss', { y: 900 }, 260, 'inQuad'), sound(230, 'fall', 0.8),
      sound(520, 'elevator', 1.3), sound(660, 'elevator', 1.15), sound(800, 'elevator', 1.0),
      tw(250, 'camera', { x: 650, y: 430, sx: 1.2 }, 600, 'inOutQuad'),
    ]),
    // ---------------------------------------------------------------- BOSS FIGHT : une lueur dorée remonte du trou
    seg('TRP_BF_RISE', 'action', 1000, 'compress', [
      anim(0, 'boss', 'wave'), anim(250, 'boss', 'fall'), tw(250, 'boss', { y: 900 }, 260, 'inQuad'), sound(230, 'fall'),
      tw(560, 'glow', { x: 650, y: 540, alpha: 0.9 }, 200, 'outQuad'), sound(600, 'gold'),
      anim(760, 'boss', 'furious'), tw(760, 'boss', { y: 560 }, 220, 'outBack'), shake(780, 250, 6), punch(800, 200, 6),
      tw(760, 'camera', { x: 500, y: 350, sx: 1 }, 240, 'outQuad'), tw(900, 'glow', { alpha: 0 }, 100),
      fx(780, 'dust', 650, 556, 10),
    ]),
  ]),
  branches: [
    { id: 'TRP-L', label: 'Marche sur le vide', categories: ['CLEAN_MISS', 'BACKFIRE', 'TEASE'], classes: ['MISS'], rarity: 'common', d1: 'hovering',
      steps: [{ seg: 'TRP_DROP' }, { seg: 'TRP_L_TIPTOE' }, { reaction: 'auto' }] },
    { id: 'TRP-W', label: 'Au revoir', categories: ['GRAZE', 'DIRECT', 'COMEBACK'], classes: ['SCRAPE', 'HIT'], rarity: 'common', d1: 'hovering',
      steps: [{ seg: 'TRP_DROP' }, { seg: 'TRP_W_FALL' }, { impact: 'floor' }, { seg: 'TRP_CLOSE' }, { reaction: 'away' }] },
    { id: 'TRP-BW', label: 'Douze étages', categories: ['DIRECT', 'COMEBACK', 'CHAIN', 'SUPER'], classes: ['BIG', 'MEGA', 'LEGENDARY'], rarity: 'common', d1: 'hovering',
      steps: [{ seg: 'TRP_DROP' }, { seg: 'TRP_BW_FALL' }, { silence: 380 }, { impact: 'floor' }, { seg: 'TRP_CLOSE' }, { reaction: 'away' }] },
    { id: 'TRP-BF', label: 'Remontée dorée', categories: ['BF_ENTRY'], classes: ['HIT', 'BIG', 'MEGA', 'LEGENDARY'], rarity: 'common', d1: 'hovering',
      steps: [{ seg: 'TRP_DROP' }, { seg: 'TRP_BF_RISE' }, { bossFight: true }] },
  ],
};
