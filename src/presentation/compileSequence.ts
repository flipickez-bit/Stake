/**
 * compileSequence : Outcome + gadget + vitesse → AnimationSequence plate, à temps absolus.
 * Fonction PURE et déterministe : même entrée, même séquence (reprise, replay, tests de référence).
 *
 * Provenance des données (TECH_ARCHITECTURE.md §2.7) :
 * - résultat (classe, multiplicateur, script, rareté, déroulé du BOSS FIGHT) : le BOOK, déjà validé par parseRound ;
 * - branche parmi les candidates équivalentes, réaction, caméo, trajectoires de particules, bruit de caméra :
 *   la GRAINE COSMÉTIQUE du book (flux nommés) ;
 * - durées, courbes, vitesse : calcul LOCAL (contenu + réglage du joueur).
 * La graine n'est lue qu'APRÈS que le résultat est établi et ne peut rien y changer.
 */
import { hash32, createRng } from '../domain/seed';
import type { Outcome } from '../domain/outcome';
import type { ResultClass, Script, Speed } from '../domain/types';
import type {
  AnimationSequence,
  BossReaction,
  BranchDef,
  Cue,
  GadgetDef,
  ImpactDirection,
  Phase,
  ScheduledCue,
  SegmentDef,
  Step,
} from './types';
import { RARITY_WEIGHT } from './types';

export type ImpactTier = 'T05' | 'T1' | 'T2' | 'T3' | 'T3G';

/** Le COMBIEN : le tier d'impact ne dépend que de la classe de résultat (donc du multiplicateur). */
export function impactTierFor(resultClass: ResultClass): ImpactTier | null {
  switch (resultClass) {
    case 'MISS': return null;
    case 'SCRAPE': return 'T05';
    case 'HIT': return 'T1';
    case 'BIG': return 'T2';
    case 'MEGA': return 'T3';
    case 'LEGENDARY': return 'T3G';
  }
}

/** Ce que le contenu partagé fournit au compilateur (bibliothèques du GDD_04 §5.3). */
export interface ContentLibrary {
  segments: Readonly<Record<string, SegmentDef>>;
  impact(tier: ImpactTier, direction: ImpactDirection): SegmentDef;
  reaction(reaction: BossReaction): SegmentDef;
  reactionPool(resultClass: ResultClass): readonly BossReaction[];
  /** Réactions quand le boss a quitté le cadre (fenêtre, trappe, plafond). */
  awayPool: readonly BossReaction[];
  bossFight(bossFight: NonNullable<Outcome['bossFight']>): SegmentDef[];
  cooCameo: { chance: number; segment: SegmentDef };
}

export class CompileError extends Error {}

/** Branches capables de servir ce résultat (script ET classe). Repli : toutes les branches de la classe. */
export function candidateBranches(outcome: Pick<Outcome, 'script' | 'resultClass'>, gadget: GadgetDef): BranchDef[] {
  const exact = gadget.branches.filter((b) => b.categories.includes(outcome.script) && b.classes.includes(outcome.resultClass));
  if (exact.length > 0) return exact;
  // Repli (GDD_04 §5.2.3) : branche générique de la classe. Une manche n'est jamais bloquée.
  return gadget.branches.filter((b) => b.classes.includes(outcome.resultClass));
}

/**
 * Choix de la branche : tirage pondéré par la rareté cosmétique, avec le flux « branch » de la graine du book.
 * Entrées : résultat déjà fixé (classe, script) + graine. Aucun historique, aucun état local : une reprise ou un
 * replay retrouve toujours la même branche. La rareté du book (legacy) n'est plus utilisée pour ce choix.
 */
export function selectBranch(outcome: Outcome, gadget: GadgetDef, forceBranchId?: string): BranchDef {
  const candidates = candidateBranches(outcome, gadget);
  if (forceBranchId) {
    const forced = candidates.find((b) => b.id === forceBranchId);
    if (!forced) throw new CompileError(`Branche ${forceBranchId} incompatible avec ${outcome.resultClass}/${outcome.script}`);
    return forced;
  }
  if (candidates.length === 0) throw new CompileError(`${gadget.id} : aucune branche pour ${outcome.resultClass}/${outcome.script}`);
  const total = candidates.reduce((a, b) => a + RARITY_WEIGHT[b.rarity], 0);
  let u = createRng(outcome.seed, 'branch').next() * total;
  for (const b of candidates) {
    u -= RARITY_WEIGHT[b.rarity];
    if (u < 0) return b;
  }
  return candidates[candidates.length - 1] as BranchDef;
}

/**
 * Probabilité de chaque branche pour une classe de résultat, étant donné la distribution des scripts du book.
 * Pure ; sert à l'audit de prévisibilité et au rapport de variété (jamais au jeu lui-même).
 */
export function branchProbabilities(gadget: GadgetDef, resultClass: ResultClass, scriptWeights: Partial<Record<Script, number>>): Map<string, number> {
  const out = new Map<string, number>();
  const totalScript = Object.values(scriptWeights).reduce((a, b) => a + (b ?? 0), 0);
  for (const [script, w] of Object.entries(scriptWeights) as [Script, number][]) {
    if (!w) continue;
    const cands = candidateBranches({ script, resultClass }, gadget);
    const sum = cands.reduce((a, b) => a + RARITY_WEIGHT[b.rarity], 0);
    for (const b of cands) out.set(b.id, (out.get(b.id) ?? 0) + (w / totalScript) * (RARITY_WEIGHT[b.rarity] / sum));
  }
  return out;
}

interface SpeedRule {
  drop: boolean;
  /** Diviseur de durée (1 = inchangé). */
  scale: number;
  muteSounds: boolean;
}

export function speedRule(seg: SegmentDef, speed: Speed): SpeedRule {
  if (speed === 'normal') return { drop: false, scale: 1, muteSounds: false };
  if (seg.turbo === 'drop') return { drop: true, scale: 1, muteSounds: true };
  if (speed === 'turbo') return { drop: false, scale: seg.turbo === 'compress' ? 1.8 : 1, muteSounds: false };
  // SUPER : tronc très court, ACTION et TWIST quasi instantanés (mais la pose finale est conservée),
  // IMPACT conservé, réaction plafonnée à 300 ms.
  switch (seg.phase) {
    case 'intro':
    case 'setup': return { drop: false, scale: 3, muteSounds: false };
    case 'action':
    case 'twist': return { drop: false, scale: 6, muteSounds: true };
    case 'impact': return { drop: false, scale: 1, muteSounds: false };
    case 'reaction': return { drop: false, scale: Math.max(1, seg.ms / 300), muteSounds: false };
  }
}

const FREEZE_FACTOR: Record<Speed, number> = { normal: 1, turbo: 0.5, super: 0.35 };
const SHAKE_FACTOR: Record<Speed, number> = { normal: 1, turbo: 0.5, super: 0.4 };

function validateSegment(seg: SegmentDef): void {
  if (seg.turbo === 'drop' && seg.cues.some((c) => c.kind === 'tween' || c.kind === 'state')) {
    throw new CompileError(`Segment ${seg.id} : un segment "drop" ne doit contenir ni tween ni state`);
  }
  for (const c of seg.cues) {
    if (c.at < 0 || c.at > seg.ms) throw new CompileError(`Segment ${seg.id} : cue hors du segment (${c.kind} à ${c.at} ms)`);
  }
}

interface Placed {
  seg: SegmentDef;
  /** true : segment du tronc (neutre, indépendant de la graine). */
  trunk: boolean;
  /** true : superposé au segment précédent, sans avancer le temps (caméo). */
  overlay?: boolean;
}

function resolveStep(step: Step, outcome: Outcome, gadget: GadgetDef, lib: ContentLibrary, picks: { reaction: string | null }): SegmentDef[] {
  if ('seg' in step) {
    const seg = gadget.segments[step.seg] ?? lib.segments[step.seg];
    if (!seg) throw new CompileError(`${gadget.id} : segment inconnu ${step.seg}`);
    return [seg];
  }
  if ('impact' in step) {
    const tier = impactTierFor(outcome.resultClass);
    return tier ? [lib.impact(tier, step.impact)] : [];
  }
  if ('reaction' in step) {
    let reaction = step.reaction;
    if (reaction === 'auto' || reaction === 'away') {
      const pool = reaction === 'away' ? lib.awayPool : lib.reactionPool(outcome.resultClass);
      reaction = createRng(outcome.seed, 'reaction').pick(pool);
    }
    picks.reaction = reaction;
    return [lib.reaction(reaction)];
  }
  if ('silence' in step) {
    return [{ id: `SILENCE_${step.silence}`, phase: 'twist', ms: step.silence, turbo: 'drop', cues: [{ kind: 'silence', at: 0, ms: step.silence }] }];
  }
  if (!outcome.bossFight) throw new CompileError(`${gadget.id} : étape bossFight sans BOSS FIGHT dans le book`);
  return lib.bossFight(outcome.bossFight);
}

function place(
  placed: readonly Placed[],
  speed: Speed,
  cosmeticSeed: number | null,
  gadgetId: string,
): { cues: ScheduledCue[]; segments: AnimationSequence['segments']; end: number; trunkEnd: number } {
  const cues: ScheduledCue[] = [];
  const segments: AnimationSequence['segments'] = [];
  let cursor = 0;
  let trunkEnd = 0;
  let lastStart = 0;
  placed.forEach((p, segIndex) => {
    validateSegment(p.seg);
    const rule = speedRule(p.seg, speed);
    if (rule.drop) return;
    const ms = p.seg.ms / rule.scale;
    const start = p.overlay ? lastStart : cursor;
    segments.push({ id: p.seg.id, phase: p.seg.phase, start, ms });
    p.seg.cues.forEach((cue, cueIndex) => {
      if (rule.muteSounds && cue.kind === 'sound') return;
      if (speed !== 'normal' && cue.kind === 'silence') return;
      // Graine des effets : fixe dans le tronc (joué avant le résultat), sinon dérivée de la graine cosmétique.
      const salt = p.trunk || cosmeticSeed === null ? `trunk|${gadgetId}` : `seed|${cosmeticSeed}`;
      const fxSeed = hash32(`${salt}|${segIndex}|${cueIndex}`);
      const at = start + cue.at / rule.scale;
      cues.push(scaleCue(cue, at, rule.scale, speed, fxSeed, segIndex));
    });
    if (!p.overlay) {
      lastStart = cursor;
      cursor += ms;
    }
    if (p.trunk) trunkEnd = cursor;
  });
  // Tri stable par temps : l'ordre d'écriture départage les cues simultanés.
  const ordered = cues.map((c, i) => ({ c, i })).sort((a, b) => a.c.at - b.c.at || a.i - b.i).map((x) => x.c);
  const lastCueEnd = ordered.reduce((m, c) => Math.max(m, c.at + cueLength(c)), 0);
  return { cues: ordered, segments, end: Math.max(cursor, lastCueEnd), trunkEnd };
}

function cueLength(c: Cue): number {
  return c.kind === 'tween' || c.kind === 'camera' || c.kind === 'silence' ? c.ms : 0;
}

function scaleCue(cue: Cue, at: number, scale: number, speed: Speed, fxSeed: number, seg: number): ScheduledCue {
  switch (cue.kind) {
    case 'tween': return { ...cue, at, ms: cue.ms / scale, seg };
    case 'camera': return { ...cue, at, ms: cue.ms / scale, intensity: cue.intensity * SHAKE_FACTOR[speed], seed: fxSeed, seg };
    case 'freeze': return { ...cue, at, wallMs: cue.wallMs * FREEZE_FACTOR[speed], seg };
    case 'silence': return { ...cue, at, ms: cue.ms / scale, seg };
    case 'vfx': return { ...cue, at, seed: fxSeed, seg };
    default: return { ...cue, at, seg };
  }
}

function sequenceKey(parts: unknown): string {
  return hash32(JSON.stringify(parts)).toString(16).padStart(8, '0');
}

/** Tronc neutre seul : ce qui se joue entre FIRE et la réception du book. Indépendant du résultat. */
export function compileTrunk(gadget: GadgetDef, speed: Speed, lib: ContentLibrary): AnimationSequence {
  const placed = gadget.trunk.map((id) => {
    const seg = gadget.segments[id] ?? lib.segments[id];
    if (!seg) throw new CompileError(`${gadget.id} : segment de tronc inconnu ${id}`);
    return { seg, trunk: true };
  });
  const { cues, segments, trunkEnd } = place(placed, speed, null, gadget.id);
  return {
    key: sequenceKey({ g: gadget.id, speed, cues }),
    gadgetId: gadget.id,
    branchId: 'TRUNK',
    speed,
    totalMs: trunkEnd,
    markers: { d1: trunkEnd, reveal: Number.POSITIVE_INFINITY, end: trunkEnd },
    cues,
    segments,
    reaction: null,
    cooCameo: false,
  };
}

export interface CompileOptions {
  forceBranchId?: string;
}

export function compileSequence(
  outcome: Outcome,
  gadget: GadgetDef,
  speed: Speed,
  lib: ContentLibrary,
  options: CompileOptions = {},
): AnimationSequence {
  if (gadget.rageLevel !== outcome.mode) {
    throw new CompileError(`Gadget ${gadget.id} (${gadget.rageLevel}) utilisé pour une manche ${outcome.mode}`);
  }
  const branch = selectBranch(outcome, gadget, options.forceBranchId);
  const picks = { reaction: null as string | null };
  const placed: Placed[] = gadget.trunk.map((id) => {
    const seg = gadget.segments[id] ?? lib.segments[id];
    if (!seg) throw new CompileError(`${gadget.id} : segment de tronc inconnu ${id}`);
    return { seg, trunk: true };
  });
  for (const step of branch.steps) {
    const isReaction = 'reaction' in step;
    for (const seg of resolveStep(step, outcome, gadget, lib, picks)) placed.push({ seg, trunk: false });
    // Caméo du pigeon : superposé à la réaction, tiré par la graine cosmétique. Salue toujours le gagnant.
    if (isReaction && outcome.resultClass !== 'MISS' && createRng(outcome.seed, 'coo').next() < lib.cooCameo.chance) {
      placed.push({ seg: lib.cooCameo.segment, trunk: false, overlay: true });
    }
  }
  const cooCameo = placed.some((p) => p.seg === lib.cooCameo.segment);
  const { cues, segments, end, trunkEnd } = place(placed, speed, outcome.seed, gadget.id);

  const reveals = cues.filter((c) => c.kind === 'signal' && c.signal === 'reveal');
  if (reveals.length !== 1) throw new CompileError(`${gadget.id}/${branch.id} : ${reveals.length} signal(aux) reveal (1 attendu)`);
  const reveal = (reveals[0] as ScheduledCue).at;
  const endCue: ScheduledCue = { kind: 'signal', at: end, signal: 'end', seg: -1 };
  const all = [...cues, endCue];

  return {
    key: sequenceKey({ g: gadget.id, b: branch.id, speed, cues: all }),
    gadgetId: gadget.id,
    branchId: branch.id,
    speed,
    totalMs: end,
    markers: { d1: trunkEnd, reveal, end },
    cues: all,
    segments,
    reaction: picks.reaction,
    cooCameo,
  };
}

/** Phases dont le contenu dépend du résultat (après D1). Utilitaire de test et de contrôle de contenu. */
export const RESULT_PHASES: readonly Phase[] = ['action', 'twist', 'impact', 'reaction'];
