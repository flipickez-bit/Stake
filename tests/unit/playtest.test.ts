import { describe, expect, it } from 'vitest';
import { PLAYTEST_QUESTIONS, PLAYTEST_TARGET, PlaytestRecorder, outcomeOf, summarize } from '../../src/dev/playtest';
import type { RoundRecord } from '../../src/flow/GameFlow';
import { createMemoryStore } from '../../src/platform/storage';

const DEVICE = { width: 390, height: 844, portrait: true, touch: true };

const rec = (i: number, over: Partial<RoundRecord> = {}): RoundRecord => ({
  roundId: `M-${i}`,
  level: i % 2 ? 'grumpy' : 'unhinged',
  source: 'play',
  resultClass: i % 3 ? 'MISS' : 'HIT',
  multiplier100: i % 3 ? 0 : 200,
  branchId: i % 3 ? 'SLG-L' : 'SLG-W',
  variant: i % 3 ? 'SLG-L' : 'SLG-W',
  gadgetId: 'swivel-slingshot',
  betAmount: 1_000_000,
  payout: i % 3 ? 0 : 2_000_000,
  bossFight: false,
  speed: i % 5 === 0 ? 'turbo' : 'normal',
  skipped: i % 4 === 0,
  animationMs: 3000,
  firedAt: i * 10_000,
  readyAt: i * 10_000 + 4_000,
  ...over,
});

describe('PLAYTEST 50 (LOCAL DEV ONLY)', () => {
  it('sept questions, dans l\'ordre demandé (Q7 : nouvelles animations en fin de session)', () => {
    expect(PLAYTEST_QUESTIONS).toHaveLength(7);
    expect(PLAYTEST_QUESTIONS[5]).toContain('51e manche');
    expect(PLAYTEST_QUESTIONS[6]).toContain('découvrir de nouvelles animations');
  });

  it('rien n\'est enregistré hors session ; replays et aperçus ignorés ; questionnaire seulement après la 50e', () => {
    const store = createMemoryStore();
    const p = new PlaytestRecorder(store, 'TEST');
    p.onRoundComplete(rec(0));
    expect(p.current).toBeNull();
    p.start(DEVICE);
    p.onRoundComplete(rec(1, { source: 'replay' }));
    p.onRoundComplete(rec(1, { source: 'dev' }));
    expect(p.current?.rounds).toHaveLength(0);
    for (let i = 1; i < PLAYTEST_TARGET; i++) p.onRoundComplete(rec(i));
    expect(p.current?.status).toBe('playing');
    p.onRoundComplete(rec(PLAYTEST_TARGET));
    expect(p.current?.status).toBe('questionnaire');
    expect(p.current?.rounds).toHaveLength(PLAYTEST_TARGET);
    // Persistance : un rechargement retrouve la session au stade du questionnaire.
    expect(new PlaytestRecorder(store, 'TEST').current?.status).toBe('questionnaire');
  });

  it('champs par manche : gadget, outcome, multiplicateur, branche, durées, turbo/skip, BOSS FIGHT', () => {
    const p = new PlaytestRecorder(createMemoryStore(), 'TEST');
    p.start(DEVICE);
    p.onRoundComplete(rec(3));
    p.onRoundComplete(rec(4, { bossFight: true, multiplier100: 1000, resultClass: 'BIG', branchId: 'SLG-BF' }));
    const [a, b] = p.current!.rounds;
    expect(a).toMatchObject({ n: 1, gadget: 'swivel-slingshot', outcome: 'WIN', multiplier: 2, branch: 'SLG-W', animationMs: 3000, roundMs: 4000, readyToBetMs: null, speed: 'normal', skipped: false, bossFight: false });
    expect(b).toMatchObject({ n: 2, outcome: 'BOSS FIGHT', bossFight: true, readyToBetMs: 6000, skipped: true });
  });

  it('questionnaire : notes bornées à 1-5, texte libre facultatif ; puis manches supplémentaires comptées sans incitation', () => {
    const p = new PlaytestRecorder(createMemoryStore(), 'TEST');
    p.start(DEVICE);
    for (let i = 1; i <= PLAYTEST_TARGET; i++) p.onRoundComplete(rec(i));
    p.submitAnswers({ scores: [5, 4, 0, 9, null, 2, 4], memorable: '  le pigeon  ' });
    const s = p.snapshot.sessions[0]!;
    expect(s.answers).toEqual({ scores: [5, 4, 1, 5, null, 2, 4], memorable: 'le pigeon' });
    expect(p.current).toBeNull();
    p.onRoundComplete(rec(51));
    p.onRoundComplete(rec(52));
    expect(p.snapshot.sessions[0]!.extraRounds).toBe(2);
    p.start(DEVICE);
    p.onRoundComplete(rec(53));
    expect(p.snapshot.sessions[0]!.extraRounds).toBe(2);
    expect(JSON.parse(p.exportJson()).note).toContain('LOCAL DEV ONLY');
  });

  it('nouveauté : branches nouvelles marquées ; un aperçu BOSS FIGHT n\'altère que le délai suivant', () => {
    const p = new PlaytestRecorder(createMemoryStore(), 'TEST');
    p.start(DEVICE);
    p.onRoundComplete(rec(1, { branchId: 'SLG-A1', variant: 'SLG-A1/SIP' }));
    p.onRoundComplete(rec(2, { branchId: 'SLG-A1', variant: 'SLG-A1/LAUGH' }));
    p.excludeNextDelay();
    p.onRoundComplete(rec(3, { branchId: 'SLG-B1', variant: 'SLG-B1' }));
    const [a, b, c] = p.current!.rounds;
    expect([a!.newBranch, b!.newBranch, c!.newBranch]).toEqual([true, false, true]);
    expect([a!.newVariant, b!.newVariant]).toEqual([true, true]);
    expect(b!.readyToBetMs).toBe(6000);
    expect(c!.readyToBetMs).toBeNull();
    const s = summarize(p.current!);
    expect(s.distinctBranchesAt['10']).toBe(2);
    expect(s.distinctVariants).toBe(3);
  });

  it('résumé : délais READY → mise (global et après perte / gain), parts turbo et skip', () => {
    const p = new PlaytestRecorder(createMemoryStore(), 'TEST');
    p.start(DEVICE);
    for (let i = 1; i <= 10; i++) p.onRoundComplete(rec(i));
    const s = summarize(p.current!);
    expect(s.rounds).toBe(10);
    expect(s.medianReadyToBetMs).toBe(6000);
    expect(s.readyToBetAfter.LOSS).toBe(6000);
    expect(s.turboShare).toBeCloseTo(0.2);
    expect(s.skipShare).toBeCloseTo(0.2);
    expect(s.byLevel).toEqual({ grumpy: 5, furious: 0, unhinged: 5 });
    expect(outcomeOf({ bossFight: false, multiplier100: 50 })).toBe('SCRAPE');
  });
});
