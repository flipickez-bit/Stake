/**
 * LOOP ×N (DEV PANEL) : enchaîne N présentations SANS mise (aucun appel wallet), via GameFlow.replayRound.
 * Mesure la stabilité (erreurs, reveal atteint, fin atteinte) et la performance pendant la boucle.
 */
import type { GameFlow } from '../flow/GameFlow';
import { RAGE_LEVEL_IDS, type RageLevelId } from '../domain/types';
import type { Presenter } from '../presenter/Presenter';
import { cryptoRandom, type ForcedOutcome, type RandomSource } from '../platform/rgs/mock/mockMath';
import { makeDevRound } from './devOutcomes';
import type { PerfMeter } from './perf';

export interface LoopOptions {
  count: number;
  level: RageLevelId | 'all';
  forced: ForcedOutcome | null;
  rnd?: RandomSource;
  onProgress?: (done: number, total: number) => void;
  shouldStop?: () => boolean;
  /** Relevé mémoire toutes les N manches (0 = aucun). Force un GC si le navigateur l'expose (--js-flags=--expose-gc). */
  sampleEvery?: number;
  /** Compteurs de la scène (nœuds, textures) pour les relevés. */
  sceneStats?: () => { displayObjects: number; textures: number };
}

export interface MemorySample {
  round: number;
  /** Tas utilisé tel quel (inclut les déchets pas encore collectés). */
  heapMB: number | null;
  /** Tas après un GC forcé : ce qui est réellement retenu. null si le GC n'est pas exposé. */
  heapAfterGcMB: number | null;
  displayObjects: number | null;
  textures: number | null;
  elapsedS: number;
}

export interface LoopReport {
  requested: number;
  completed: number;
  revealed: number;
  errors: string[];
  durationMs: number;
  avgRoundMs: number;
  speed: string;
  fps: number;
  minFps: number;
  avgFrameMs: number;
  p95FrameMs: number;
  maxFrameMs: number;
  maxParticles: number;
  heapStartMB: number | null;
  heapEndMB: number | null;
  branches: Record<string, number>;
  walletCallsDuringLoop: number;
  samples: MemorySample[];
}

const forceGc = (): boolean => {
  const gc = (globalThis as unknown as { gc?: () => void }).gc;
  if (!gc) return false;
  gc();
  return true;
};

const heapMB = (): number | null => {
  const m = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
  return m ? Math.round((m.usedJSHeapSize / 1048576) * 10) / 10 : null;
};

export async function runLoop(
  flow: GameFlow,
  presenter: Presenter,
  perf: PerfMeter,
  walletCalls: () => number,
  options: LoopOptions,
): Promise<LoopReport> {
  const rnd = options.rnd ?? cryptoRandom;
  const errors: string[] = [];
  const branches: Record<string, number> = {};
  let revealed = 0;
  let completed = 0;
  const calls0 = walletCalls();
  const heapStartMB = heapMB();
  const t0 = performance.now();
  const samples: MemorySample[] = [];
  const sample = (round: number) => {
    const before = heapMB();
    const after = forceGc() ? heapMB() : null;
    const stats = options.sceneStats?.();
    samples.push({
      round,
      heapMB: before,
      heapAfterGcMB: after,
      displayObjects: stats?.displayObjects ?? null,
      textures: stats?.textures ?? null,
      elapsedS: Math.round((performance.now() - t0) / 100) / 10,
    });
  };
  if (options.sampleEvery) sample(0);
  perf.startRecording();
  for (let i = 0; i < options.count; i++) {
    if (options.shouldStop?.()) break;
    const level = options.level === 'all' ? (RAGE_LEVEL_IDS[i % RAGE_LEVEL_IDS.length] as RageLevelId) : options.level;
    if (flow.snapshot.state !== 'READY') {
      errors.push(`#${i + 1}: flow not READY (${flow.snapshot.state})`);
      break;
    }
    try {
      const round = makeDevRound(level, options.forced, rnd, `LOOP-${String(i + 1).padStart(3, '0')}`);
      await flow.replayRound(round);
      const snap = flow.snapshot;
      if (snap.revealed?.roundId === round.roundId) revealed++;
      else errors.push(`#${i + 1}: no reveal for ${round.roundId}`);
      const branch = snap.presentation?.branchId ?? presenter.status.branchId ?? '?';
      branches[branch] = (branches[branch] ?? 0) + 1;
      if (branch === 'FALLBACK') errors.push(`#${i + 1}: content fallback`);
      completed++;
    } catch (e) {
      errors.push(`#${i + 1}: ${e instanceof Error ? e.message : String(e)}`);
    }
    options.onProgress?.(i + 1, options.count);
    if (options.sampleEvery && (i + 1) % options.sampleEvery === 0) sample(i + 1);
  }
  const perfReport = perf.stopRecording();
  const durationMs = performance.now() - t0;
  return {
    requested: options.count,
    completed,
    revealed,
    errors,
    durationMs: Math.round(durationMs),
    avgRoundMs: completed ? Math.round(durationMs / completed) : 0,
    speed: flow.snapshot.speed,
    fps: Math.round((perfReport?.fps ?? 0) * 10) / 10,
    minFps: Math.round((perfReport?.minFps ?? 0) * 10) / 10,
    avgFrameMs: Math.round((perfReport?.frameMs ?? 0) * 100) / 100,
    p95FrameMs: Math.round((perfReport?.p95FrameMs ?? 0) * 100) / 100,
    maxFrameMs: Math.round((perfReport?.maxFrameMs ?? 0) * 100) / 100,
    maxParticles: perfReport?.maxParticles ?? 0,
    heapStartMB,
    heapEndMB: heapMB(),
    branches,
    walletCallsDuringLoop: walletCalls() - calls0,
    samples,
  };
}
