import { describe, expect, it } from 'vitest';
import { parseRound, OutcomeError } from '../../src/domain/outcome';
import { classify } from '../../src/domain/resultClass';
import { createRng, mulberry32 } from '../../src/domain/seed';
import { RAGE_LEVELS, TARGET_RTP, getRageLevel } from '../../src/domain/rageLevels';
import { distributionTable, forcibleMultipliers, generateBook } from '../../src/platform/rgs/mock/mockMath';
import type { InternalRound } from '../../src/domain/round';
import type { RageLevelId } from '../../src/domain/types';

function roundFromBook(mode: RageLevelId, book: ReturnType<typeof generateBook>, id = 'T-1'): InternalRound {
  return { roundId: id, mode, betAmount: 1_000_000, payout: book.payoutMultiplier * 10_000, payoutMultiplier100: book.payoutMultiplier, active: true, events: book.events };
}

describe('config/rage_levels.json (source de vérité)', () => {
  it('expose le RTP cible et les max wins validés', () => {
    expect(TARGET_RTP).toBeCloseTo(0.965, 10);
    expect(RAGE_LEVELS.map((l) => [l.id, l.maxWin])).toEqual([['grumpy', 200], ['furious', 1000], ['unhinged', 5000]]);
    expect(getRageLevel('unhinged').bossFightLadder).toEqual([5, 10, 25, 50, 100, 250, 500, 1000, 5000]);
  });

  it('la table de distribution du mock retombe sur RTP 96,5 % et BOSS FIGHT 1/150', () => {
    for (const level of RAGE_LEVELS) {
      const rows = distributionTable(level.id);
      const total = rows.reduce((s, r) => s + r.p, 0);
      const rtp = rows.reduce((s, r) => s + (r.multiplier100 / 100) * r.p, 0);
      const bf = rows.filter((r) => r.bossFightRung !== null).reduce((s, r) => s + r.p, 0);
      expect(total).toBeCloseTo(1, 12);
      expect(rtp).toBeCloseTo(0.965, 10);
      expect(bf).toBeCloseTo(1 / 150, 12);
    }
  });
});

describe('classes de résultat', () => {
  it('seuils x1, x5, x25, x100', () => {
    expect([0, 50, 100, 490, 500, 2490, 2500, 9990, 10000].map(classify)).toEqual(
      ['MISS', 'SCRAPE', 'HIT', 'HIT', 'BIG', 'BIG', 'MEGA', 'MEGA', 'LEGENDARY'],
    );
  });
});

describe('books générés et parseRound', () => {
  it('10 000 books aléatoires par niveau sont tous valides', () => {
    for (const level of RAGE_LEVELS) {
      const rnd = mulberry32(99);
      for (let i = 0; i < 10_000; i++) {
        const book = generateBook(level.id, rnd);
        const outcome = parseRound(roundFromBook(level.id, book), 'play');
        expect(outcome.payoutMultiplier100).toBe(book.payoutMultiplier);
        if (outcome.bossFight) expect(outcome.bossFight.rungs100[outcome.bossFight.finalRungIndex]).toBe(book.payoutMultiplier);
      }
    }
  });

  it('fréquences observées proches des cibles (200 000 manches UNHINGED)', () => {
    const rnd = mulberry32(7);
    let wins = 0;
    let bf = 0;
    let paid = 0;
    const n = 200_000;
    for (let i = 0; i < n; i++) {
      const book = generateBook('unhinged', rnd);
      if (book.payoutMultiplier > 0) wins++;
      if (book.events.some((e) => e.type === 'bossFight')) bf++;
      paid += book.payoutMultiplier / 100;
    }
    expect(wins / n).toBeGreaterThan(0.150);
    expect(wins / n).toBeLessThan(0.161);
    expect(bf / n).toBeGreaterThan(1 / 170);
    expect(bf / n).toBeLessThan(1 / 132);
    expect(paid / n).toBeGreaterThan(0.80); // RTP empirique très bruité en haute volatilité : garde-fou large
  });

  it('résultats forcés cohérents (DEV PANEL)', () => {
    const rnd = mulberry32(3);
    for (const level of RAGE_LEVELS) {
      for (const kind of ['LOSS', 'WIN', 'BIG_WIN', 'BOSS_FIGHT'] as const) {
        for (const m of forcibleMultipliers(level.id, kind)) {
          const book = generateBook(level.id, rnd, kind === 'BOSS_FIGHT' ? { kind, bossFightRung: level.bossFightLadder.indexOf(m) } : { kind, multiplier: m });
          const o = parseRound(roundFromBook(level.id, book), 'dev');
          expect(o.payoutMultiplier100).toBe(Math.round(m * 100));
          expect(o.bossFight !== null).toBe(kind === 'BOSS_FIGHT');
        }
      }
    }
  });

  it('refuse un book incohérent', () => {
    const book = generateBook('grumpy', mulberry32(1), { kind: 'WIN', multiplier: 2 });
    const r = roundFromBook('grumpy', book);
    expect(() => parseRound({ ...r, payoutMultiplier100: 300 }, 'play')).toThrow(OutcomeError);
    expect(() => parseRound({ ...r, events: [] }, 'play')).toThrow(OutcomeError);
  });
});

describe('PRNG déterministe', () => {
  it('même graine et même flux : même suite ; flux différents : suites différentes', () => {
    const a = createRng(42, 'reaction');
    const b = createRng(42, 'reaction');
    const c = createRng(42, 'camera');
    const sa = Array.from({ length: 5 }, () => a.next());
    expect(Array.from({ length: 5 }, () => b.next())).toEqual(sa);
    expect(Array.from({ length: 5 }, () => c.next())).not.toEqual(sa);
  });
});
