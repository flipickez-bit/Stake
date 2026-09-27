/**
 * POC « 3 PLANS » — PLAYTEST A/B (LOCAL DEV ONLY) : ordre tiré et enregistré, 2 × 30 manches, manches
 * supplémentaires volontaires, ouvertures de OTHER PLANS, changements de gadget, questionnaires Q1–Q7.
 */
import { describe, expect, it } from 'vitest';
import { parseRound } from '../../src/domain/outcome';
import { POC_PLAN_SETS, type PlanSlot } from '../../src/domain/plans';
import { mulberry32 } from '../../src/domain/seed';
import type { RoundRecord } from '../../src/flow/GameFlow';
import { POC_SESSION_ROUNDS, PocPlaytestRecorder, questionsFor, summarize } from '../../src/dev/pocPlaytest';
import { createMemoryStore } from '../../src/platform/storage';
import { bookForPick, drawTriple } from '../../src/platform/rgs/mock/tripleMath';

let clock = 0;
function record(n: number, plan: PlanSlot, mults: [number, number, number]): RoundRecord {
  const book = bookForPick(drawTriple('grumpy', POC_PLAN_SETS.grumpy!, mulberry32(n), { kind: 'multipliers', multipliers: mults }), plan, n);
  const o = parseRound({ roundId: `R${n}`, mode: 'grumpy', betAmount: 1_000_000, payout: book.payoutMultiplier * 10_000, payoutMultiplier100: book.payoutMultiplier, active: true, events: book.events, plan }, 'play');
  const firedAt = (clock += 1000);
  const readyAt = (clock += 3000);
  return {
    roundId: o.roundId, level: 'grumpy', source: 'play', resultClass: o.resultClass, multiplier100: o.payoutMultiplier100, branchId: 'X', variant: 'X',
    gadgetId: o.plans!.selectedGadget, plans: o.plans, betAmount: 1_000_000, payout: o.payout, bossFight: false, speed: 'normal', skipped: false,
    animationMs: 2500, firedAt, readyAt,
  };
}

const device = { width: 390, height: 844, portrait: true, touch: true };

describe('POC 3 PLANS : playtest A/B', () => {
  it('l’ordre PRIVATE / ON-DEMAND est tiré au hasard et enregistré (les deux ordres sont possibles)', () => {
    const a = new PocPlaytestRecorder(createMemoryStore(), () => 0.2).start(device);
    const b = new PocPlaytestRecorder(createMemoryStore(), () => 0.8).start(device);
    expect(a.order).toEqual(['PRIVATE', 'ON_DEMAND']);
    expect(b.order).toEqual(['ON_DEMAND', 'PRIVATE']);
    expect(a.sessions[0]!.variant).toBe('PRIVATE');
  });

  it('questions : Q1–Q4 après chaque variante ; Q5–Q7 et la question libre pour ON-DEMAND seulement', () => {
    expect(questionsFor('PRIVATE').map((q) => q.id)).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
    expect(questionsFor('ON_DEMAND').map((q) => q.id)).toEqual(['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7']);
    expect(questionsFor('ON_DEMAND').find((q) => q.id === 'Q6')!.scale).toEqual({ 1: 'très frustrant', 3: 'neutre', 5: 'très intéressant' });
  });

  it('30 manches, puis manches volontaires, ouverture de OTHER PLANS, changements, questionnaires, session 2, fin', () => {
    const rec = new PocPlaytestRecorder(createMemoryStore(), () => 0.9); // ON_DEMAND d'abord
    rec.start(device);
    // Manche 1 : plan A perd, B avait x5 (vu) → manche 2 : changement vers B.
    rec.onRoundComplete(record(1, 'A', [0, 5, 0]));
    rec.markRevealOpened('R1', clock + 800);
    rec.onRoundComplete(record(2, 'B', [0, 2, 0]));
    // Manche 2 : B gagne et c'est le meilleur (vu) → manche 3 : garde B.
    rec.markRevealOpened('R2', clock + 500);
    rec.onRoundComplete(record(3, 'B', [10, 0, 0]));
    // Manche 3 : un autre plan faisait mieux mais NON vu → manche 4 : change (témoin).
    rec.onRoundComplete(record(4, 'C', [0, 0, 0]));
    for (let n = 5; n <= POC_SESSION_ROUNDS; n++) rec.onRoundComplete(record(n, 'C', [0, 0, 0]));
    let s = rec.session!;
    expect(s.status).toBe('extra');
    expect(s.rounds).toHaveLength(POC_SESSION_ROUNDS);
    // Manches volontaires après la 30e.
    rec.onRoundComplete(record(31, 'C', [0, 0, 2]));
    rec.onRoundComplete(record(32, 'A', [0, 0, 0]));
    s = rec.session!;
    expect(s.extraRounds).toBe(2);
    const sum = summarize(s);
    expect(sum.rounds).toBe(POC_SESSION_ROUNDS);
    expect(sum.reveals.n).toBe(2);
    expect(sum.revealAfterMsMean).toBeCloseTo(650, 0);
    expect(sum.switchAfterSeenOtherBetter).toMatchObject({ n: 1, of: 1 });
    expect(sum.switchAfterSeenChosenBest).toMatchObject({ n: 0, of: 1 });
    expect(sum.switchAfterUnseenOtherBetter).toMatchObject({ n: 1, of: 1 });
    expect(sum.readyToBetMsMean).toBe(1000);
    expect(s.rounds[1]!.switched).toBe(true);
    expect(s.rounds[0]!.otherBetter).toBe(true);
    expect(s.rounds[1]!.chosenBest).toBe(true);
    expect(s.rounds[4]!.allLose).toBe(true);
    // Questionnaire : les notes absentes restent absentes ; Q5–Q7 acceptées en ON-DEMAND.
    rec.openQuestionnaire();
    const next = rec.submitAnswers({ scores: { Q1: 4, Q2: 5, Q3: 5, Q4: 3, Q5: 4, Q6: 2, Q7: 1 }, free: '  Un peu frustré.  ' });
    expect(next).toBe('PRIVATE');
    const study = rec.study!;
    expect(study.sessions[0]!.answers).toEqual({ scores: { Q1: 4, Q2: 5, Q3: 5, Q4: 3, Q5: 4, Q6: 2, Q7: 1 }, free: 'Un peu frustré.' });
    expect(rec.session!.index).toBe(2);
    expect(rec.session!.variant).toBe('PRIVATE');
    // Session 2 (PRIVATE) : Q5–Q7 ignorées même si envoyées.
    for (let n = 1; n <= POC_SESSION_ROUNDS; n++) rec.onRoundComplete(record(100 + n, 'B', [0, 0, 0]));
    rec.openQuestionnaire();
    expect(rec.submitAnswers({ scores: { Q1: 2, Q2: 2, Q3: 4, Q4: 2, Q6: 5 }, free: 'ignored' })).toBeNull();
    expect(rec.study).toBeNull();
    const done = rec.snapshot.history.at(-1)!;
    expect(done.status).toBe('done');
    expect(done.sessions[1]!.answers).toEqual({ scores: { Q1: 2, Q2: 2, Q3: 4, Q4: 2 }, free: '' });
    const exported = JSON.parse(rec.exportJson(done));
    expect(exported.summary).toHaveLength(2);
    expect(exported.kind).toMatch(/LOCAL DEV ONLY/);
  });

  it('ignore les replays, les aperçus et les manches sans plans ; une manche ouverte deux fois ne compte qu’une fois', () => {
    const rec = new PocPlaytestRecorder(createMemoryStore(), () => 0.1);
    rec.start(device);
    rec.onRoundComplete({ ...record(1, 'A', [0, 0, 0]), source: 'replay' });
    rec.onRoundComplete({ ...record(2, 'A', [0, 0, 0]), plans: null });
    expect(rec.session!.rounds).toHaveLength(0);
    rec.onRoundComplete(record(3, 'A', [0, 0, 0]));
    rec.markRevealOpened('R3', clock + 100);
    rec.markRevealOpened('R3', clock + 900);
    expect(rec.session!.rounds[0]!.revealAfterMs).toBe(100);
  });
});
