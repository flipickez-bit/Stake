/**
 * Le bureau de B.B. (placeholder de formes simples). Monde logique 1000 × 700, sol à y = 560.
 * Les personnages ont leur pivot aux pieds ; les accessoires, à leur centre (ou à leur base au sol).
 */
import type { ActorId, ActorRest, ImpactDirection } from '../presentation/types';

export const WORLD = { width: 1000, height: 700, floorY: 560 } as const;

export const BOSS_HOME = { x: 650, y: 560 } as const;

/** Disposition de repos commune à tous les gadgets. */
export const OFFICE_LAYOUT: Record<ActorId, ActorRest> = {
  boss: { transform: { x: BOSS_HOME.x, y: BOSS_HOME.y }, states: { seat: 'none', mug: 'normal', face: 'normal' }, anim: 'idle' },
  wendell: { transform: { x: 1110, y: 560 }, anim: 'idle' },
  coo: { transform: { x: 262, y: 342 }, anim: 'idle' },
  hands: { transform: { x: 500, y: 840 }, anim: 'open' },
  window: { transform: { x: 220, y: 230 }, states: { main: 'intact' } },
  portrait: { transform: { x: 560, y: 150 } },
  cabinet: { transform: { x: 70, y: 560 }, states: { main: 'normal' } },
  ceiling: { transform: { x: 650, y: 0 }, states: { main: 'intact' } },
  bell: { transform: { x: 862, y: 440 } },
  proj: { transform: { x: -120, y: 640, alpha: 0 }, states: { kind: 'stapler' } },
  glow: { transform: { x: 650, y: 420, alpha: 0 } },
  flash: { transform: { x: 500, y: 350, alpha: 0 } },
  dim: { transform: { x: 500, y: 350, alpha: 0 } },
  bfBack: { transform: { x: 500, y: 350, alpha: 0 } },
};

/** Où frappent les impacts partagés, selon la direction. */
export const IMPACT_POINTS: Record<ImpactDirection, { x: number; y: number }> = {
  none: { x: BOSS_HOME.x, y: 470 },
  window: { x: 220, y: 230 },
  overdesk: { x: 730, y: 420 },
  ceiling: { x: BOSS_HOME.x, y: 24 },
  floor: { x: BOSS_HOME.x, y: 556 },
  cork: { x: 560, y: 150 },
  wall: { x: 128, y: 470 },
};

/**
 * Manifeste des personnages : les animations que chaque CharacterAnimator doit savoir jouer.
 * Le contrôle de contenu vérifie que chaque cue `anim` y figure. Un futur rig (Spine, spritesheet…)
 * n'a qu'à fournir les mêmes noms.
 */
export const CHARACTER_ANIMS = {
  boss: [
    'idle', 'sip', 'oblivious', 'surprised', 'spin', 'dizzy', 'scared', 'splat', 'ouch', 'laugh', 'smug', 'flex',
    'sulk', 'dazed', 'tapfoot', 'hover', 'lookdown', 'lookcam', 'tiptoe', 'wave', 'fall', 'furious', 'sniff',
    'drink', 'grow', 'giant-idle', 'giant-wind', 'giant-hurt', 'giant-swat', 'giant-laugh', 'giant-ko', 'away',
  ],
  wendell: ['idle', 'walk', 'run', 'cheer', 'peek', 'thumbsup'],
  coo: ['idle', 'fly', 'salute'],
  hands: ['open', 'grab', 'strain', 'lighter'],
} as const satisfies Record<string, readonly string[]>;

export type CharacterId = keyof typeof CHARACTER_ANIMS;
export const CHARACTER_IDS = Object.keys(CHARACTER_ANIMS) as CharacterId[];
