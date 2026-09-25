/**
 * Petites fonctions d'écriture du contenu. Elles ne produisent QUE des données (Cue, SegmentDef) :
 * aucune logique de gadget n'entre dans le moteur.
 */
import type { EaseName } from '../presentation/easing';
import type { ResultClass, Script } from '../domain/types';
import type { ActorId, BranchDef, BranchRarity, Cue, Phase, SegmentDef, Signal, SoundId, Step, Transform, VfxId } from '../presentation/types';

export const tw = (at: number, actor: ActorId, to: Partial<Transform>, ms: number, ease?: EaseName): Cue => ({ kind: 'tween', at, actor, to, ms, ease });
export const anim = (at: number, actor: ActorId, name: string): Cue => ({ kind: 'anim', at, actor, anim: name });
export const state = (at: number, actor: ActorId, value: string): Cue => ({ kind: 'state', at, actor, state: value });
export const sound = (at: number, id: SoundId, pitch?: number): Cue => ({ kind: 'sound', at, sound: id, pitch });
export const shake = (at: number, ms: number, intensity: number): Cue => ({ kind: 'camera', at, shot: 'shake', ms, intensity });
export const punch = (at: number, ms: number, intensity: number): Cue => ({ kind: 'camera', at, shot: 'punch', ms, intensity });
export const freeze = (at: number, wallMs: number): Cue => ({ kind: 'freeze', at, wallMs });
export const silence = (at: number, ms: number): Cue => ({ kind: 'silence', at, ms });
export const fx = (at: number, id: VfxId, x: number, y: number, count: number, actor?: ActorId): Cue => ({ kind: 'vfx', at, fx: id, x, y, count, actor });
export const signal = (at: number, id: Signal, value?: number): Cue => ({ kind: 'signal', at, signal: id, value });

export function seg(id: string, phase: Phase, ms: number, turbo: SegmentDef['turbo'], cues: Cue[]): SegmentDef {
  return { id, phase, ms, turbo, cues };
}

/** Indexe une liste de segments par identifiant. */
export function segments(list: SegmentDef[]): Record<string, SegmentDef> {
  const out: Record<string, SegmentDef> = {};
  for (const s of list) {
    if (out[s.id]) throw new Error(`Segment en double : ${s.id}`);
    out[s.id] = s;
  }
  return out;
}

// ------------------------------------------------------------------ composition modulaire des branches

/** Un module visible (setup ou twist) : une suite d'étapes partagée tel quel par plusieurs branches. */
export interface Module {
  name: string;
  steps: Step[];
}

export const mod = (name: string, ...steps: Step[]): Module => ({ name, steps });

export const LOSS: ResultClass[] = ['MISS'];
export const WIN_SMALL: ResultClass[] = ['SCRAPE', 'HIT'];
export const WIN_ANY: ResultClass[] = ['SCRAPE', 'HIT', 'BIG'];
export const WIN_MID: ResultClass[] = ['HIT', 'BIG'];
export const WIN_BIG: ResultClass[] = ['BIG', 'MEGA', 'LEGENDARY'];
export const BOSS_FIGHT: ResultClass[] = ['HIT', 'BIG', 'MEGA', 'LEGENDARY'];

/**
 * Branche = modules partagés (le chemin visible avant la révélation) + une fin qui révèle le résultat.
 * `path` est rempli automatiquement : l'audit de prévisibilité s'en sert.
 */
export function compose(
  id: string,
  label: string,
  modules: Module[],
  ending: Step[],
  meta: { categories: Script[]; classes: ResultClass[]; rarity: BranchRarity; d1: string },
): BranchDef {
  return { id, label, ...meta, path: modules.map((m) => m.name), steps: [...modules.flatMap((m) => m.steps), ...ending] };
}
