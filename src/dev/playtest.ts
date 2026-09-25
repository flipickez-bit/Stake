/**
 * PLAYTEST 50 — LOCAL DEV ONLY.
 * Enregistre localement (localStorage de CE navigateur) une session de 50 manches jouées avec le MockRGS.
 * Rien n'est envoyé nulle part. Toute collecte future auprès de vrais joueurs devra être traitée à part,
 * avec information et consentement conformes (hors périmètre Phase 0).
 */
import type { RoundRecord } from '../flow/GameFlow';
import type { RageLevelId, ResultClass } from '../domain/types';
import type { KeyValueStore } from '../platform/storage';

export const PLAYTEST_TARGET = 50;
const KEY = 'badboss.playtest.local-dev-only.v1';

export interface PlaytestEntry {
  index: number;
  roundId: string;
  level: RageLevelId;
  resultClass: ResultClass;
  multiplier100: number;
  branchId: string | null;
  /** FIRE → retour à READY (ms). */
  roundMs: number;
  /** Temps passé en READY avant ce tir (ms) ; null pour la première manche. */
  idleBeforeMs: number | null;
}

export interface PlaytestState {
  active: boolean;
  startedAt: string | null;
  entries: PlaytestEntry[];
  lastReadyAt: number | null;
}

export interface PlaytestSummary {
  rounds: number;
  byLevel: Record<RageLevelId, number>;
  hitRate: number;
  avgMultiplier: number;
  avgRoundMs: number;
  medianRoundMs: number;
  avgIdleMs: number | null;
  medianIdleMs: number | null;
  bossFights: number;
  byClass: Record<string, number>;
  byBranch: Record<string, number>;
  levelSwitches: number;
}

const median = (xs: number[]) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
};

export class PlaytestRecorder {
  private state: PlaytestState;
  private readonly listeners = new Set<(s: PlaytestState) => void>();

  constructor(private readonly store: KeyValueStore) {
    this.state = store.get<PlaytestState>(KEY) ?? { active: false, startedAt: null, entries: [], lastReadyAt: null };
  }

  get snapshot(): PlaytestState {
    return this.state;
  }

  get done(): boolean {
    return this.state.entries.length >= PLAYTEST_TARGET;
  }

  subscribe(fn: (s: PlaytestState) => void): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  start(): void {
    this.state = { active: true, startedAt: new Date().toISOString(), entries: [], lastReadyAt: null };
    this.save();
  }

  stop(): void {
    this.state = { ...this.state, active: false };
    this.save();
  }

  clear(): void {
    this.state = { active: false, startedAt: null, entries: [], lastReadyAt: null };
    this.save();
  }

  /** Branché sur GameFlow.onRoundComplete. Ignore les replays et aperçus (aucune mise). */
  onRoundComplete(r: RoundRecord): void {
    if (!this.state.active || r.source === 'replay' || r.source === 'dev' || this.done) return;
    const entry: PlaytestEntry = {
      index: this.state.entries.length + 1,
      roundId: r.roundId,
      level: r.level,
      resultClass: r.resultClass,
      multiplier100: r.multiplier100,
      branchId: r.branchId,
      roundMs: Math.round(r.readyAt - r.firedAt),
      idleBeforeMs: this.state.lastReadyAt === null ? null : Math.max(0, Math.round(r.firedAt - this.state.lastReadyAt)),
    };
    const entries = [...this.state.entries, entry];
    this.state = { ...this.state, entries, lastReadyAt: r.readyAt, active: entries.length < PLAYTEST_TARGET };
    this.save();
  }

  summary(): PlaytestSummary {
    return summarize(this.state.entries);
  }

  exportJson(): string {
    return JSON.stringify({ note: 'LOCAL DEV ONLY — BAD BOSS Phase 0 playtest (Mock RGS, no real money)', ...this.state, summary: this.summary() }, null, 2);
  }

  private save(): void {
    this.store.set(KEY, this.state);
    for (const fn of this.listeners) fn(this.state);
  }
}

export function summarize(entries: PlaytestEntry[]): PlaytestSummary {
  const byLevel: Record<RageLevelId, number> = { grumpy: 0, furious: 0, unhinged: 0 };
  const byClass: Record<string, number> = {};
  const byBranch: Record<string, number> = {};
  let switches = 0;
  entries.forEach((e, i) => {
    byLevel[e.level]++;
    byClass[e.resultClass] = (byClass[e.resultClass] ?? 0) + 1;
    const b = e.branchId ?? '—';
    byBranch[b] = (byBranch[b] ?? 0) + 1;
    if (i > 0 && entries[i - 1]?.level !== e.level) switches++;
  });
  const n = entries.length;
  const idles = entries.map((e) => e.idleBeforeMs).filter((x): x is number => x !== null);
  return {
    rounds: n,
    byLevel,
    hitRate: n ? entries.filter((e) => e.multiplier100 > 0).length / n : 0,
    avgMultiplier: n ? entries.reduce((s, e) => s + e.multiplier100, 0) / n / 100 : 0,
    avgRoundMs: n ? entries.reduce((s, e) => s + e.roundMs, 0) / n : 0,
    medianRoundMs: median(entries.map((e) => e.roundMs)),
    avgIdleMs: idles.length ? idles.reduce((a, b) => a + b, 0) / idles.length : null,
    medianIdleMs: idles.length ? median(idles) : null,
    bossFights: entries.filter((e) => e.branchId?.endsWith('-BF')).length,
    byClass,
    byBranch,
    levelSwitches: switches,
  };
}
