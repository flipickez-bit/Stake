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
  wendell: { transform: { x: 1560, y: 560 }, anim: 'idle' },
  coo: { transform: { x: 262, y: 342 }, anim: 'idle' },
  hands: { transform: { x: 500, y: 1060 }, anim: 'open' },
  window: { transform: { x: 220, y: 230 }, states: { main: 'intact' } },
  portrait: { transform: { x: 560, y: 150 } },
  cabinet: { transform: { x: 70, y: 560 }, states: { main: 'normal' } },
  ceiling: { transform: { x: 650, y: 58 }, states: { main: 'intact' } },
  bell: { transform: { x: 862, y: 440 } },
  proj: { transform: { x: -120, y: 640, alpha: 0 }, states: { kind: 'stapler' } },
  glow: { transform: { x: 650, y: 420, alpha: 0 } },
  flash: { transform: { x: 500, y: 350, alpha: 0 } },
  dim: { transform: { x: 500, y: 350, alpha: 0 } },
  bfBack: { transform: { x: 500, y: 350, alpha: 0 } },
  // Phase 0.5B : accessoires de réactions en chaîne et hors champ.
  elevator: { transform: { x: 985, y: 560 }, states: { main: 'idle', dent: 'no' } },
  /** Portes de l'ascenseur (au premier plan) : pivot sur le bord extérieur, s'ouvrent en réduisant sx. */
  elevL: { transform: { x: 930, y: 560 } },
  elevR: { transform: { x: 1040, y: 560 } },
  monitor: { transform: { x: 770, y: 436 }, states: { main: 'normal' } },
  fan: { transform: { x: 650, y: 60 }, states: { main: 'on' } },
  plant: { transform: { x: 322, y: 560 } },
  extinguisher: { transform: { x: 520, y: 500 }, states: { main: 'normal' } },
  /** Chaise ou fusée qui part SANS B.B. */
  chairProp: { transform: { x: 770, y: 560, alpha: 0 }, states: { kind: 'chair' } },
  /** Fumée plein écran : cache la scène pendant qu'on replace les acteurs. */
  fog: { transform: { x: 500, y: 350, alpha: 0 } },
};

/** Position de B.B. dans la cabine d'ascenseur. */
export const ELEVATOR = { x: 985, y: 560 } as const;

/** Où frappent les impacts partagés, selon la direction. */
export const IMPACT_POINTS: Record<ImpactDirection, { x: number; y: number }> = {
  none: { x: BOSS_HOME.x, y: 470 },
  window: { x: 220, y: 230 },
  overdesk: { x: 730, y: 420 },
  ceiling: { x: BOSS_HOME.x, y: 66 },
  floor: { x: BOSS_HOME.x, y: 556 },
  cork: { x: 560, y: 150 },
  wall: { x: 128, y: 470 },
  elevator: { x: 985, y: 470 },
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
    'braced', 'peek', 'phew', 'lookback', 'mugcheck', 'hang', 'tiefix', 'taunt', 'hop', 'lookup', 'climb', 'ring',
  ],
  wendell: ['idle', 'walk', 'run', 'cheer', 'peek', 'thumbsup', 'stuck', 'pull', 'hit', 'shrug', 'fall'],
  coo: ['idle', 'fly', 'salute', 'crash', 'applaud', 'carry'],
  hands: ['open', 'grab', 'strain', 'lighter'],
} as const satisfies Record<string, readonly string[]>;

export type CharacterId = keyof typeof CHARACTER_ANIMS;
export const CHARACTER_IDS = Object.keys(CHARACTER_ANIMS) as CharacterId[];
