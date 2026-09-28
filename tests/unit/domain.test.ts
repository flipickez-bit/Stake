import { describe, expect, it } from 'vitest';
import { parseRound, OutcomeError } from '../../src/domain/outcome';
import { classify } from '../../src/domain/resultClass';
import { createRng, mulberry32 } from '../../src/domain/seed';
import { BOSS_FIGHT_FREQUENCY, RAGE_LEVELS, TARGET_RTP, getRageLevel } from '../../src/domain/rageLevels';
import type { BossFightEvent } from '../../src/domain/book';
import {
  distributionTable,
  forcedFreeRoundsTotal100,
  forcibleMultipliers,
  freeRoundsDistribution,
  freeRoundsExpectation,
  generateBook,
} from '../../src/platform/rgs/mock/mockMath';
import type { InternalRound } from '../../src/domain/round';
import type { RageLevelId } from '../../src/domain/types';

function roundFromBook(mode: RageLevelId, book: ReturnType<typeof generateBook>, id = 'T-1'): InternalRound {
  return { roundId: id, mode, betAmount: 1_000_000, payout: book.payoutMultiplier * 10_000, payoutMultiplier100: book.payoutMultiplier, active: true, events: book.events };
}

describe('config/rage_levels.json (source de vérité)', () => {
  it('expose le RTP cible et les max wins validés', () => {
    expect(TARGET_RTP).toBeCloseTo(0.965, 10);
    expect(RAGE_LEVELS.map((l) => [l.id, l.maxWin])).toEqual([['grumpy', 200], ['furious', 1000], ['unhinged', 5000]]);
    const fr = getRageLevel('unhinged').freeRounds;
    expect([fr.rounds, fr.rageStart, fr.rageStep]).toEqual([8, 1, 1]);
    expect(fr.bases.map((b) => b.multiplier)).toEqual([1, 2, 3, 5, 10, 25, 50, 100, 250, 500, 1000]);
  });

  it('BOSS FIGHT 1/400 : valeur moyenne des tours gratuits ≈ ancienne part de RTP × 400 (calculateur Python)', () => {
    expect(BOSS_FIGHT_FREQUENCY).toBeCloseTo(1 / 400, 15);
    // Valeurs exactes de math/model/bad_boss_math.py (EV d'un BOSS FIGHT) : GRUMPY 38,68 · FURIOUS 64,40 · UNHINGED 95,39.
    expect(freeRoundsExpectation('grumpy')).toBeCloseTo(38.6786, 3);
    expect(freeRoundsExpectation('furious')).toBeCloseTo(64.4035, 3);
    expect(freeRoundsExpectation('unhinged')).toBeCloseTo(95.3918, 3);
    for (const level of RAGE_LEVELS) {
      const d = freeRoundsDistribution(level.id);
      expect([...d.values()].reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
      expect(Math.min(...d.keys())).toBeGreaterThanOrEqual(100); // jamais de bonus nul (au moins un HIT)
      expect(Math.max(...d.keys())).toBe(level.maxWin * 100); // plafond atteignable
    }
  });

  it('la table de distribution du mock retombe sur RTP 96,5 % et BOSS FIGHT 1/400', () => {
    for (const level of RAGE_LEVELS) {
      const rows = distributionTable(level.id);
      const total = rows.reduce((s, r) => s + r.p, 0);
      const rtp = rows.reduce((s, r) => s + (r.multiplier100 / 100) * r.p, 0);
      const bf = rows.filter((r) => r.bossFight).reduce((s, r) => s + r.p, 0);
      expect(total).toBeCloseTo(1, 12);
      expect(rtp).toBeCloseTo(0.965, 10);
      expect(bf).toBeCloseTo(1 / 400, 12);
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
        if (outcome.bossFight) expect(outcome.bossFight.rounds.at(-1)!.total100).toBe(book.payoutMultiplier);
      }
    }
  });

  it('fréquences observées proches des cibles (400 000 manches UNHINGED)', () => {
    const rnd = mulberry32(7);
    let wins = 0;
    let bf = 0;
    let paid = 0;
    const n = 400_000;
    for (let i = 0; i < n; i++) {
      const book = generateBook('unhinged', rnd);
      if (book.payoutMultiplier > 0) wins++;
      if (book.events.some((e) => e.type === 'bossFight')) bf++;
      paid += book.payoutMultiplier / 100;
    }
    expect(wins / n).toBeGreaterThan(0.150);
    expect(wins / n).toBeLessThan(0.161);
    expect(bf / n).toBeGreaterThan(1 / 440);
    expect(bf / n).toBeLessThan(1 / 364);
    expect(paid / n).toBeGreaterThan(0.80); // RTP empirique très bruité en haute volatilité : garde-fou large
  });

  it('résultats forcés cohérents (DEV PANEL)', () => {
    const rnd = mulberry32(3);
    for (const level of RAGE_LEVELS) {
      for (const kind of ['LOSS', 'WIN', 'BIG_WIN', 'BOSS_FIGHT'] as const) {
        for (const m of forcibleMultipliers(level.id, kind)) {
          if (kind === 'BOSS_FIGHT') {
            // m = base de chaque HIT ; 1 à 8 HIT.
            for (let hits = 1; hits <= level.freeRounds.rounds; hits++) {
              const book = generateBook(level.id, rnd, { kind, bossFightHits: hits, bossFightBase: m });
              const o = parseRound(roundFromBook(level.id, book), 'dev');
              expect(o.payoutMultiplier100).toBe(forcedFreeRoundsTotal100(level.id, { hits, base: m }));
              if (!o.bossFight!.wincap) expect(o.bossFight!.rounds.filter((r) => r.result === 'HIT')).toHaveLength(hits);
              expect(o.bossFight!.rounds.at(-1)!.result).toBe('HIT');
            }
            continue;
          }
          const book = generateBook(level.id, rnd, { kind, multiplier: m });
          const o = parseRound(roundFromBook(level.id, book), 'dev');
          expect(o.payoutMultiplier100).toBe(Math.round(m * 100));
          expect(o.bossFight).toBeNull();
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

  it('refuse des tours gratuits falsifiés (gain, rage, total, plafond, aucun HIT)', () => {
    const book = generateBook('furious', mulberry32(5), { kind: 'BOSS_FIGHT', bossFightHits: 3, bossFightBase: 5 });
    const r = roundFromBook('furious', book);
    expect(parseRound(r, 'play').payoutMultiplier100).toBe(book.payoutMultiplier);
    const tamper = (f: (bf: BossFightEvent) => void, m100 = book.payoutMultiplier) => {
      const events = structuredClone(book.events);
      const bf = events.find((e): e is BossFightEvent => e.type === 'bossFight')!;
      f(bf);
      const fw = events.find((e) => e.type === 'finalWin') as { amount: number };
      fw.amount = m100;
      return () => parseRound({ ...r, payoutMultiplier100: m100, events }, 'play');
    };
    const firstHit = (bf: BossFightEvent) => bf.rounds.find((x) => x.result === 'HIT')!;
    expect(tamper((bf) => (firstHit(bf).win100 += 100), book.payoutMultiplier + 100)).toThrow(OutcomeError);
    expect(tamper((bf) => (firstHit(bf).rage += 1))).toThrow(OutcomeError);
    expect(tamper((bf) => (firstHit(bf).base100 = 700))).toThrow(OutcomeError);
    expect(tamper((bf) => bf.rounds.pop())).toThrow(OutcomeError);
    expect(tamper((bf) => (bf.wincap = true))).toThrow(OutcomeError);
    expect(tamper(() => undefined, book.payoutMultiplier + 100)).toThrow(OutcomeError);
    expect(tamper((bf) => bf.rounds.forEach((x) => Object.assign(x, { result: 'BLOCKED', base100: 0, win100: 0, rage: 1 })), 0)).toThrow(OutcomeError);
  });

  it('plafond : le bonus s\'arrête dès que le max win est atteint, gain du dernier HIT écrêté', () => {
    // GRUMPY, base x50 : 50 + 100 + 150 → le 3e HIT est écrêté à x50 (plafond x200), et le bonus s'arrête là.
    const book = generateBook('grumpy', mulberry32(9), { kind: 'BOSS_FIGHT', bossFightHits: 8, bossFightBase: 50 });
    const o = parseRound(roundFromBook('grumpy', book), 'dev');
    expect(o.payoutMultiplier100).toBe(20_000);
    expect(o.bossFight!.wincap).toBe(true);
    expect(o.bossFight!.rounds.map((x) => x.win100)).toEqual([5_000, 10_000, 5_000]);
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
