/**
 * Timeline évaluable : l'état de la scène est une FONCTION PURE du temps de séquence.
 * evaluate(t) ne dépend d'aucun état accumulé : seek, reprise, replay et skip donnent la même image.
 */
import { smoothNoise } from '../domain/seed';
import { EASES, type EaseName } from './easing';
import { particlesAt, prepareBurst, type ParticleBurst, type ParticleState } from './particles';
import type { ActorId, ActorRest, AnimationSequence, CameraCue, ScheduledCue, Transform } from './types';
import { IDENTITY } from './types';

type Prop = keyof Transform;
const PROPS: readonly Prop[] = ['x', 'y', 'z', 'rot', 'sx', 'sy', 'alpha'];

interface TweenSeg {
  t0: number;
  t1: number;
  from: number;
  to: number;
  ease: (p: number) => number;
}

interface Keyed<T> {
  t: number;
  value: T;
}

export interface ActorFrame {
  transform: Transform;
  states: Record<string, string>;
  anim: string;
  animElapsed: number;
}

export interface FrameState {
  t: number;
  actors: Record<ActorId, ActorFrame>;
  camera: { x: number; y: number; zoom: number; rot: number; shakeX: number; shakeY: number };
  particles: ParticleState[];
  particleCount: number;
  /** Silence dramatique en cours (ambiance coupée). */
  silence: boolean;
}

export interface Timeline {
  seq: AnimationSequence;
  actors: ActorId[];
  rest: Record<ActorId, ActorRest>;
  tracks: Map<string, TweenSeg[]>;
  states: Map<string, Keyed<string>[]>;
  anims: Map<ActorId, Keyed<string>[]>;
  shakes: CameraCue[];
  bursts: ParticleBurst[];
  silences: { t0: number; t1: number }[];
  /** Événements ponctuels (sons, signaux, silences, gel), triés par temps. */
  events: ScheduledCue[];
}

export const CAMERA: ActorId = 'camera';
export const CAMERA_REST: Transform = { ...IDENTITY, x: 500, y: 350 };

function restTransform(rest: Record<ActorId, ActorRest>, actor: ActorId): Transform {
  const base = actor === CAMERA ? CAMERA_REST : IDENTITY;
  return { ...base, ...(rest[actor]?.transform ?? {}) };
}

function trackValue(segs: TweenSeg[] | undefined, t: number, fallback: number): number {
  if (!segs || segs.length === 0) return fallback;
  // Dernier segment commencé (t0 ≤ t). À t0 égal, le dernier écrit gagne.
  let lo = 0;
  let hi = segs.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if ((segs[mid] as TweenSeg).t0 <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (found < 0) return fallback;
  const s = segs[found] as TweenSeg;
  if (t >= s.t1 || s.t1 <= s.t0) return s.to;
  return s.from + (s.to - s.from) * s.ease((t - s.t0) / (s.t1 - s.t0));
}

function lastKeyed<T>(list: Keyed<T>[] | undefined, t: number): Keyed<T> | null {
  if (!list) return null;
  let found: Keyed<T> | null = null;
  for (const k of list) {
    if (k.t <= t) found = k;
    else break;
  }
  return found;
}

function splitState(state: string): [string, string] {
  const i = state.indexOf('=');
  return i < 0 ? ['main', state] : [state.slice(0, i), state.slice(i + 1)];
}

export function buildTimeline(seq: AnimationSequence, restLayout: Record<ActorId, ActorRest>): Timeline {
  const rest = restLayout;
  const tracks = new Map<string, TweenSeg[]>();
  const states = new Map<string, Keyed<string>[]>();
  const anims = new Map<ActorId, Keyed<string>[]>();
  const actorSet = new Set<ActorId>(Object.keys(rest));
  actorSet.add(CAMERA);
  const shakes: CameraCue[] = [];
  const bursts: ParticleBurst[] = [];
  const silences: { t0: number; t1: number }[] = [];
  const events: ScheduledCue[] = [];

  for (const cue of seq.cues) {
    switch (cue.kind) {
      case 'tween': {
        actorSet.add(cue.actor);
        const ease = EASES[(cue.ease ?? 'inOutQuad') as EaseName];
        for (const prop of PROPS) {
          const to = cue.to[prop];
          if (to === undefined) continue;
          const key = `${cue.actor}|${prop}`;
          const segs = tracks.get(key) ?? [];
          const from = trackValue(segs, cue.at, restTransform(rest, cue.actor)[prop]);
          segs.push({ t0: cue.at, t1: cue.at + cue.ms, from, to, ease });
          tracks.set(key, segs);
        }
        break;
      }
      case 'state': {
        actorSet.add(cue.actor);
        const [slot, value] = splitState(cue.state);
        const key = `${cue.actor}|${slot}`;
        const list = states.get(key) ?? [];
        list.push({ t: cue.at, value });
        states.set(key, list);
        break;
      }
      case 'anim': {
        actorSet.add(cue.actor);
        const list = anims.get(cue.actor) ?? [];
        list.push({ t: cue.at, value: cue.anim });
        anims.set(cue.actor, list);
        break;
      }
      case 'camera':
        shakes.push(cue);
        break;
      case 'vfx': {
        let { x, y } = cue;
        if (cue.actor) {
          const base = restTransform(rest, cue.actor);
          x += trackValue(tracks.get(`${cue.actor}|x`), cue.at, base.x);
          y += trackValue(tracks.get(`${cue.actor}|y`), cue.at, base.y);
        }
        bursts.push(prepareBurst(cue.fx, cue.at, x, y, cue.count, cue.seed ?? 0));
        break;
      }
      case 'silence':
        silences.push({ t0: cue.at, t1: cue.at + cue.ms });
        events.push(cue);
        break;
      default:
        events.push(cue);
    }
  }
  return { seq, actors: [...actorSet], rest, tracks, states, anims, shakes, bursts, silences, events };
}

export interface HoldInfo {
  /** Temps de séquence où l'attente a commencé (D1). */
  at: number;
  /** Durée d'attente écoulée : les animations commencées avant D1 continuent de vivre. */
  offset: number;
}

/** Crée un FrameState réutilisable (évite les allocations à chaque image). */
export function createFrame(): FrameState {
  return {
    t: 0,
    actors: {},
    camera: { x: CAMERA_REST.x, y: CAMERA_REST.y, zoom: 1, rot: 0, shakeX: 0, shakeY: 0 },
    particles: [],
    particleCount: 0,
    silence: false,
  };
}

export function evaluate(tl: Timeline, t: number, out: FrameState = createFrame(), hold: HoldInfo | null = null): FrameState {
  out.t = t;
  for (const actor of tl.actors) {
    if (actor === CAMERA) continue;
    const rest = restTransform(tl.rest, actor);
    const frame = out.actors[actor] ?? (out.actors[actor] = { transform: { ...IDENTITY }, states: {}, anim: 'idle', animElapsed: 0 });
    for (const prop of PROPS) frame.transform[prop] = trackValue(tl.tracks.get(`${actor}|${prop}`), t, rest[prop]);
    const restStates = tl.rest[actor]?.states ?? {};
    for (const slot of Object.keys(frame.states)) delete frame.states[slot];
    Object.assign(frame.states, restStates);
    const anim = lastKeyed(tl.anims.get(actor), t);
    frame.anim = anim ? anim.value : (tl.rest[actor]?.anim ?? 'idle');
    frame.animElapsed = t - (anim ? anim.t : 0);
    if (hold && (anim ? anim.t : 0) <= hold.at) frame.animElapsed += hold.offset;
  }
  for (const [key, list] of tl.states) {
    const k = lastKeyed(list, t);
    if (!k) continue;
    const bar = key.indexOf('|');
    const actorFrame = out.actors[key.slice(0, bar)];
    if (actorFrame) actorFrame.states[key.slice(bar + 1)] = k.value;
  }

  const cam = out.camera;
  cam.x = trackValue(tl.tracks.get('camera|x'), t, CAMERA_REST.x);
  cam.y = trackValue(tl.tracks.get('camera|y'), t, CAMERA_REST.y);
  cam.zoom = trackValue(tl.tracks.get('camera|sx'), t, 1);
  cam.rot = trackValue(tl.tracks.get('camera|rot'), t, 0);
  cam.shakeX = 0;
  cam.shakeY = 0;
  for (const c of tl.shakes) {
    const age = t - c.at;
    if (age < 0 || age >= c.ms) continue;
    const k = 1 - age / c.ms;
    if (c.shot === 'shake') {
      const amp = c.intensity * k * k;
      const seed = c.seed ?? 0;
      cam.shakeX += amp * smoothNoise(seed, age / 28);
      cam.shakeY += amp * smoothNoise((seed + 0x9e37) >>> 0, age / 28);
    } else {
      // Punch : zoom bref vers l'avant, puis retour.
      cam.zoom *= 1 + c.intensity * 0.01 * Math.sin(Math.PI * (age / c.ms));
    }
  }
  out.particleCount = particlesAt(tl.bursts, t, out.particles);
  out.silence = tl.silences.some((s) => t >= s.t0 && t < s.t1);
  return out;
}
