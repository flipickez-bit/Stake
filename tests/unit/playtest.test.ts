import { describe, expect, it } from 'vitest';
import { PLAYTEST_TARGET, PlaytestRecorder } from '../../src/dev/playtest';
import type { RoundRecord } from '../../src/flow/GameFlow';
import { createMemoryStore } from '../../src/platform/storage';

const rec = (i: number, over: Partial<RoundRecord> = {}): RoundRecord => ({
  roundId: `M-${i}`,
  level: i % 2 ? 'grumpy' : 'unhinged',
  source: 'play',
  resultClass: i % 3 ? 'MISS' : 'HIT',
  multiplier100: i % 3 ? 0 : 200,
  branchId: i % 3 ? 'SLG-L' : 'SLG-W',
  firedAt: i * 10_000,
  readyAt: i * 10_000 + 4_000,
  ...over,
});

describe('PLAYTEST 50 (LOCAL DEV ONLY)', () => {
  it('enregistre uniquement les vraies manches, localement, et s\'arrête à 50', () => {
    const store = createMemoryStore();
    const p = new PlaytestRecorder(store);
    p.onRoundComplete(rec(0));
    expect(p.snapshot.entries).toHaveLength(0); // pas démarré
    p.start();
    p.onRoundComplete(rec(1, { source: 'replay' }));
    p.onRoundComplete(rec(1, { source: 'dev' }));
    expect(p.snapshot.entries).toHaveLength(0);
    for (let i = 1; i <= PLAYTEST_TARGET + 5; i++) p.onRoundComplete(rec(i));
    expect(p.snapshot.entries).toHaveLength(PLAYTEST_TARGET);
    expect(p.snapshot.active).toBe(false);
    expect(new PlaytestRecorder(store).snapshot.entries).toHaveLength(PLAYTEST_TARGET);
  });

  it('résumé : durées, temps avant la manche suivante, hit rate, niveaux', () => {
    const p = new PlaytestRecorder(createMemoryStore());
    p.start();
    for (let i = 1; i <= 6; i++) p.onRoundComplete(rec(i));
    const s = p.summary();
    expect(s.rounds).toBe(6);
    expect(s.avgRoundMs).toBe(4000);
    expect(s.avgIdleMs).toBe(6000);
    expect(s.hitRate).toBeCloseTo(2 / 6);
    expect(s.byLevel).toEqual({ grumpy: 3, furious: 0, unhinged: 3 });
    expect(p.snapshot.entries[0]?.idleBeforeMs).toBeNull();
    expect(JSON.parse(p.exportJson()).note).toContain('LOCAL DEV ONLY');
  });
});
