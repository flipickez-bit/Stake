/**
 * BAD BOSS ANIMATION KIT (ANIMATION_KIT.md) — chorégraphies réutilisables, écrites UNE fois et partagées par les
 * 9 gadgets. Chaque fonction ne produit QUE des cues (données) : aucune logique de gadget n'entre dans le moteur.
 *
 * Grammaire Phase 0.6 conservée partout : ANTICIPATION → ACTION → IMPACT → FOLLOW-THROUGH → RÉACTION.
 * Les temps sont relatifs au début du segment qui les contient ; les positions sont en unités du monde (1000 × 700).
 */
import type { EaseName } from '../presentation/easing';
import type { ActorId, Cue, SoundId, VfxId } from '../presentation/types';
import { anim, freeze, fx, impactFrame, punch, shake, silence, sound, state, tw } from './dsl';

export interface Pt {
  x: number;
  y: number;
}

const FLOOR = 560;

// ------------------------------------------------------------------ B.B.

export const bb = {
  /** Anticipation : il se ramasse avant de partir (squash), 120 ms par défaut. */
  anticipate: (at: number): Cue[] => [anim(at, 'boss', 'anticipate'), sound(at + 20, 'squeak', 0.8)],

  /**
   * En l'air : trajectoire en cloche de `from` (position courante) vers `to`, sommet `peak` (y absolu).
   * Le x avance à vitesse constante (lisible), le y monte en outQuad et redescend en inQuad.
   */
  airborne: (at: number, to: Pt, ms: number, peak: number, opts: { rot?: number; whoosh?: boolean } = {}): Cue[] => {
    const half = Math.round(ms / 2);
    const out: Cue[] = [
      anim(at, 'boss', 'airborne'),
      tw(at, 'boss', { x: to.x }, ms, 'linear'),
      tw(at, 'boss', { y: peak }, half, 'outQuad'),
      tw(at + half, 'boss', { y: to.y }, ms - half, 'inQuad'),
    ];
    if (opts.rot !== undefined) out.push(tw(at, 'boss', { rot: opts.rot }, ms, 'linear'));
    if (opts.whoosh !== false) out.push(sound(at, 'whoosh', 0.9));
    return out;
  },

  /** Atterrissage : écrasement au contact, poussière, THUMP (lisible sur téléphone), petite secousse. */
  land: (at: number, at_: Pt, heavy = false): Cue[] => [
    anim(at, 'boss', 'land'), tw(at, 'boss', { x: at_.x, y: at_.y, rot: 0 }, 1, 'linear'),
    fx(at, 'dust', at_.x, at_.y - 4, heavy ? 14 : 8), sound(at, heavy ? 'thud' : 'thump'),
    shake(at, heavy ? 260 : 160, heavy ? 6 : 3),
  ],

  /** K.O. cartoon : à plat, étoiles, BOING. (Jamais de gore : il se relèvera toujours.) */
  ko: (at: number): Cue[] => [anim(at, 'boss', 'ko'), fx(at + 40, 'stars', 0, -150, 5, 'boss'), sound(at + 60, 'boing', 1.25)],

  /** Il se relève, époussette sa veste. */
  recover: (at: number): Cue[] => [anim(at, 'boss', 'recover'), sound(at + 320, 'paper', 1.4)],

  /** Émotions ponctuelles (une ligne, une intention). */
  panic: (at: number): Cue[] => [anim(at, 'boss', 'panic'), sound(at + 30, 'honk', 1.3)],
  confused: (at: number): Cue[] => [anim(at, 'boss', 'confused')],
  relief: (at: number): Cue[] => [anim(at, 'boss', 'relief'), sound(at + 120, 'hmpf', 0.9)],
  smirk: (at: number): Cue[] => [anim(at, 'boss', 'smirk')],
  rage: (at: number): Cue[] => [anim(at, 'boss', 'rage'), sound(at + 110, 'thump', 1.2), sound(at + 330, 'thump', 1.1)],
  blink: (at: number): Cue[] => [anim(at, 'boss', 'blink')],
  duck: (at: number): Cue[] => [anim(at, 'boss', 'duck'), sound(at, 'squeak', 1.2)],
  dodge: (at: number): Cue[] => [anim(at, 'boss', 'dodge'), sound(at, 'whoosh', 1.4)],

  /** Il sort du cadre en volant (fenêtre, plafond…) et devient une étoile au loin. */
  away: (at: number, to: Pt, ms = 650): Cue[] => [
    anim(at, 'boss', 'away'), tw(at, 'boss', { x: to.x, y: to.y, z: 1600, alpha: 0, rot: -4 }, ms, 'outQuad'), sound(at + 60, 'fall', 1.1),
    fx(at + ms - 10, 'sparks', to.x, to.y, 3), sound(at + ms, 'tink', 1.9),
  ],
};

// ------------------------------------------------------------------ WENDELL (réagit vite, reste en retrait)

export const wendell = {
  /** Il entre en courant (depuis la droite, hors champ) jusqu'à x. */
  runIn: (at: number, x: number, ms = 360): Cue[] => [anim(at, 'wendell', 'run'), tw(at, 'wendell', { x }, ms, 'outQuad'), sound(at + 10, 'whoosh', 1.5)],
  walkIn: (at: number, x: number, ms = 520): Cue[] => [anim(at, 'wendell', 'walk'), tw(at, 'wendell', { x }, ms, 'outQuad')],
  panic: (at: number): Cue[] => [anim(at, 'wendell', 'panic'), sound(at + 40, 'honk', 1.6)],
  duck: (at: number): Cue[] => [anim(at, 'wendell', 'duck'), sound(at, 'squeak', 1.5)],
  /** Plongeon héroïque (souvent trop tard). */
  dive: (at: number, toX: number, ms = 220): Cue[] => [
    anim(at, 'wendell', 'dive'), tw(at, 'wendell', { x: toX, y: FLOOR - 20 }, ms, 'outQuad'), tw(at + ms, 'wendell', { y: FLOOR, rot: -1.3 }, 90, 'inQuad'),
    sound(at, 'whoosh', 1.3), sound(at + ms + 90, 'thump', 1.4), fx(at + ms + 90, 'dust', toX, FLOOR - 4, 6),
  ],
  look: (at: number): Cue[] => [anim(at, 'wendell', 'look')],
  celebrate: (at: number): Cue[] => [anim(at, 'wendell', 'cheer'), sound(at + 20, 'laugh', 1.5)],
  /** Il repart en marchant vers la droite (sortie discrète). */
  exit: (at: number, ms = 500): Cue[] => [anim(at, 'wendell', 'walk'), tw(at, 'wendell', { x: 1560, rot: 0 }, ms, 'inQuad')],
};

// ------------------------------------------------------------------ COO (agent double, minuscule)

export const coo = {
  flyTo: (at: number, to: Pt, ms = 380): Cue[] => [anim(at, 'coo', 'fly'), tw(at, 'coo', { x: to.x, y: to.y }, ms, 'outQuad'), sound(at + 20, 'coo', 1.2)],
  /** Il s'enfuit, plumes. */
  escape: (at: number, to: Pt, ms = 300): Cue[] => [
    anim(at, 'coo', 'escape'), sound(at, 'coo', 1.5), fx(at, 'feathers', 0, -20, 8, 'coo'), tw(at, 'coo', { x: to.x, y: to.y, rot: -0.3 }, ms, 'outQuad'),
  ],
  land: (at: number, to: Pt): Cue[] => [anim(at, 'coo', 'land'), tw(at, 'coo', { x: to.x, y: to.y, rot: 0 }, 220, 'outQuad'), sound(at + 200, 'plop', 1.9)],
  react: (at: number): Cue[] => [anim(at, 'coo', 'shock'), sound(at, 'coo', 1.7)],
  salute: (at: number): Cue[] => [anim(at, 'coo', 'salute'), sound(at + 20, 'plop', 1.8)],
};

// ------------------------------------------------------------------ PROPS : MUG, CHAIR, PLANT, MONITOR, PAPER, DEBRIS, SMOKE

export const props = {
  /** Le mug de B.B. reste suspendu (physique cartoon), tombe, CLINK et petit rebond. */
  mugDrop: (at: number, from: Pt, floorY = 546): Cue[] => [
    state(at, 'boss', 'mug=none'), tw(at, 'mugProp', { x: from.x, y: from.y, alpha: 1, rot: 0 }, 1, 'linear'),
    tw(at + 2, 'mugProp', { y: from.y - 10, rot: 0.25 }, 140, 'outQuad'), tw(at + 150, 'mugProp', { y: floorY, rot: 1.3 }, 170, 'inQuad'),
    sound(at + 320, 'clink'), tw(at + 320, 'mugProp', { y: floorY - 14, rot: 1.5 }, 55, 'outQuad'), tw(at + 378, 'mugProp', { y: floorY, rot: 1.57 }, 55, 'inQuad'),
  ],
  /** Le mug revient dans la main de B.B. (ramassé, ou rattrapé) : l'accessoire disparaît. */
  mugBack: (at: number): Cue[] => [tw(at, 'mugProp', { alpha: 0 }, 40, 'linear'), state(at, 'boss', 'mug=normal')],
  /** La chaise part seule (vers `to`), roule et tournoie. */
  chairFly: (at: number, from: Pt, to: Pt, ms: number, spin = 4): Cue[] => [
    state(at, 'chairProp', 'kind=chair'), tw(at, 'chairProp', { x: from.x, y: from.y, alpha: 1, rot: 0 }, 1, 'linear'),
    tw(at + 2, 'chairProp', { x: to.x, y: to.y, rot: spin }, ms, 'inQuad'), sound(at, 'roll', 1.1),
  ],
  /** La plante vacille (elle revient toujours à sa place). */
  plantWobble: (at: number, k = 1): Cue[] => [
    tw(at, 'plant', { rot: -0.14 * k }, 90, 'outQuad'), tw(at + 90, 'plant', { rot: 0 }, 420, 'outElastic'), fx(at, 'leaves', 322, 470, Math.round(3 * k)),
  ],
  /** L'écran pivote sous un choc (et revient). */
  monitorKnock: (at: number, broken = false): Cue[] => [
    ...(broken ? [state(at, 'monitor', 'broken'), fx(at, 'sparks', 770, 400, 12), fx(at + 15, 'smoke', 770, 390, 5)] : []),
    tw(at, 'monitor', { rot: 0.4 }, 100, 'outBack'), tw(at + 100, 'monitor', { rot: 0 }, 500, 'outElastic'), sound(at, broken ? 'crash' : 'clang', broken ? 1 : 1.4),
  ],
  /** Le portrait de B.B. penche (et revient). */
  portraitSwing: (at: number, k = 1): Cue[] => [tw(at, 'portrait', { rot: 0.22 * k }, 110, 'outQuad'), tw(at + 110, 'portrait', { rot: 0 }, 520, 'outElastic')],
  paper: (at: number, x: number, y: number, n = 12): Cue[] => [fx(at, 'papers', x, y, n), sound(at, 'paper')],
  debris: (at: number, x: number, y: number, n = 10): Cue[] => [fx(at, 'debris', x, y, n), sound(at, 'debris')],
  smoke: (at: number, x: number, y: number, n = 8): Cue[] => [fx(at, 'smoke', x, y, n), sound(at, 'pfft', 0.7)],
};

// ------------------------------------------------------------------ CAMÉRA : push, follow, shake, hit stop, impact frame, slow motion, freeze, recovery

export const cam = {
  push: (at: number, x: number, y: number, zoom: number, ms: number, ease: EaseName = 'inOutQuad'): Cue[] => [tw(at, 'camera', { x, y, sx: zoom }, ms, ease)],
  /** Suivi : la caméra passe par une suite de points (un tween par étape). */
  follow: (at: number, points: readonly (Pt & { zoom?: number; ms: number })[]): Cue[] => {
    let t = at;
    return points.map((p) => {
      const c = tw(t, 'camera', { x: p.x, y: p.y, ...(p.zoom !== undefined ? { sx: p.zoom } : {}) }, p.ms, 'inOutQuad');
      t += p.ms;
      return c;
    });
  },
  shake: (at: number, ms: number, intensity: number): Cue[] => [shake(at, ms, intensity)],
  punch: (at: number, ms: number, intensity: number): Cue[] => [punch(at, ms, intensity)],
  /** Hit stop : l'image se fige (temps réel), sans image d'impact. */
  hitStop: (at: number, ms: number): Cue[] => [freeze(at, ms)],
  /** Image d'impact (silhouettes encre sur papier) puis hit stop. */
  impactFrame: (at: number, frameMs = 40, stopMs = 60): Cue[] => impactFrame(at, frameMs, stopMs),
  /** Ralenti (normal seulement ; ignoré en turbo). */
  slowmo: (at: number, ms: number, factor = 0.35): Cue[] => [{ kind: 'slowmo', at, ms, factor }],
  /** Silence dramatique + gel : le « moment suspendu » avant la chute. */
  freeze: (at: number, ms: number): Cue[] => [silence(at, ms + 120), freeze(at, ms)],
  /** Retour au cadre de repos. */
  recover: (at: number, ms = 380): Cue[] => [tw(at, 'camera', { x: 500, y: 350, sx: 1, rot: 0 }, ms, 'inOutQuad')],
  /** Petite rotation « dutch » (malaise, rare). */
  dutch: (at: number, rot: number, ms: number): Cue[] => [tw(at, 'camera', { rot }, ms, 'inOutQuad')],
};

// ------------------------------------------------------------------ IMPACTS COMPOSÉS (couches sonores BODY / OBJECT / LOW / DEBRIS / ROOM / COMEDIC)

export interface Layers {
  body?: SoundId;
  object?: SoundId;
  low?: boolean;
  debris?: boolean;
  room?: boolean;
  comedic?: SoundId;
}

/** Impact d'objet (hors bibliothèque de résultat) : couches sonores + particules au point de contact. */
export function hit(at: number, p: Pt, layers: Layers, vfx: VfxId = 'dust', count = 10): Cue[] {
  const out: Cue[] = [fx(at, vfx, p.x, p.y, count)];
  if (layers.body) out.push(sound(at, layers.body));
  if (layers.object) out.push(sound(at + 8, layers.object));
  if (layers.low) out.push(sound(at, 'boom'), sound(at, 'thump'));
  if (layers.debris) out.push(sound(at + 40, 'debris'), fx(at + 10, 'debris', p.x, p.y, 6));
  if (layers.room) out.push(sound(at + 60, 'room'));
  if (layers.comedic) out.push(sound(at + 120, layers.comedic));
  return out;
}

/** Oscillation (tremblement d'un accessoire) : n allers-retours autour de sa rotation `base`. */
export function wobble(at: number, actor: ActorId, base: number, amp: number, n: number, stepMs = 70): Cue[] {
  const out: Cue[] = [];
  for (let i = 0; i < n; i++) out.push(tw(at + i * stepMs, actor, { rot: base + (i % 2 ? -amp : amp) * (1 - i / (n + 1)) }, stepMs, 'inOutQuad'));
  out.push(tw(at + n * stepMs, actor, { rot: base }, stepMs, 'outQuad'));
  return out;
}

/** Arc d'un projectile (actor) de `from` à `to`, sommet `peak`, avec rotation. */
export function lob(at: number, actor: ActorId, from: Pt, to: Pt, peak: number, ms: number, spin = 6.2832): Cue[] {
  const half = Math.round(ms / 2);
  return [
    tw(at, actor, { x: from.x, y: from.y, alpha: 1, rot: 0 }, 1, 'linear'),
    tw(at + 1, actor, { x: (from.x + to.x) / 2, y: peak }, half, 'outQuad'),
    tw(at + 1 + half, actor, { x: to.x, y: to.y }, ms - half, 'inQuad'),
    tw(at + 1, actor, { rot: spin }, ms, 'linear'),
  ];
}
