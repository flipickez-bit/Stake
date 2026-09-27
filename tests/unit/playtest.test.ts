import { MELTDOWN_RULE } from '../../src/collection/rewards';
import { PLAN_SETS } from '../../src/domain/plans';
import { describe, expect, it } from 'vitest';
import { PLAYTEST3_QUESTIONS, PLAYTEST_NA_ALLOWED, PLAYTEST_QUESTIONS, PLAYTEST_TARGET, PlaytestRecorder, outcomeOf, questionsFor, summarize } from '../../src/dev/playtest';
import type { Progress } from '../../src/collection/types';
import type { RoundRecord } from '../../src/flow/GameFlow';
import { createMemoryStore } from '../../src/platform/storage';

const DEVICE = { width: 390, height: 844, portrait: true, touch: true };

/** Progression de collection synthétique (GRUMPY, FURIOUS, UNHINGED, BOSS FIGHT). */
/** Progression de production : `counts` = découvertes par gadget, dans l'ordre des plans (GRUMPY A B C, FURIOUS A B C, UNHINGED A B C). */
const IDS = ['grumpy', 'furious', 'unhinged'].flatMap((lv) => PLAN_SETS[lv as 'grumpy'].map((id) => ({ lv, id })));
const PG = (counts: readonly number[], b = 0): Progress => {
  const byGadget: Progress['byGadget'] = {};
  const lv = { grumpy: 0, furious: 0, unhinged: 0 } as Record<string, number>;
  IDS.forEach(({ lv: l, id }, i) => {
    byGadget[`${l}/${id}`] = { discovered: counts[i] ?? 0, total: 15 };
    lv[l] = (lv[l] ?? 0) + (counts[i] ?? 0);
  });
  return {
    discovered: counts.reduce((a, n) => a + n, 0) + b,
    total: 147,
    bySection: { grumpy: { discovered: lv.grumpy!, total: 46 }, furious: { discovered: lv.furious!, total: 41 }, unhinged: { discovered: lv.unhinged!, total: 42 }, bossfight: { discovered: b, total: 18 } },
    byGadget,
    meltdown: MELTDOWN_RULE,
  };
};
const P = (g: number, f: number, u: number, b = 0): Progress => PG([g, 0, 0, f, 0, 0, u, 0, 0], b);

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
  it('huit questions, dans l\'ordre demandé (Q7 : nouveauté ; Q8 : collection)', () => {
    expect(PLAYTEST_QUESTIONS).toHaveLength(8);
    expect(PLAYTEST_QUESTIONS[5]).toContain('51e manche');
    expect(PLAYTEST_QUESTIONS[6]).toContain('découvrir de nouvelles animations');
    expect(PLAYTEST_QUESTIONS[7]).toContain('animations manquantes dans la collection');
    expect(PLAYTEST_NA_ALLOWED).toEqual([4, 7]);
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
    p.submitAnswers({ scores: [5, 4, 0, 9, null, 2, 4, null], memorable: '  le pigeon  ', wish: ' un mug en or ' });
    const s = p.snapshot.sessions[0]!;
    expect(s.answers).toEqual({ scores: [5, 4, 1, 5, null, 2, 4, null], memorable: 'le pigeon', wish: 'un mug en or' });
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
  it('COLLECTION BOOK : découvertes par section, ouvertures, changement de mode après ouverture, progression MELTDOWN', () => {
    const p = new PlaytestRecorder(createMemoryStore(), 'TEST');
    p.start(DEVICE, P(1, 1, 1));
    expect(p.current!.collection).toMatchObject({ atStart: { discovered: 3, total: 147 }, firstOpenAfterRound: null, meltdownAtStart: { current: 3, required: 36, unlocked: false } });
    // Ouverture avant la 1re manche, sur GRUMPY ; la manche suivante (rec(1)) est en GRUMPY : pas de changement.
    p.markCollectionOpened('grumpy');
    p.onDiscovery({ isNew: true, section: 'grumpy' }, P(2, 1, 1));
    p.onRoundComplete(rec(1));
    // Déjà connue : pas une découverte.
    p.onDiscovery({ isNew: false, section: 'unhinged' }, P(2, 1, 1));
    p.onRoundComplete(rec(2));
    // Ouverture après la 2e manche, sur UNHINGED ; la manche suivante (rec(3)) est en GRUMPY : changement.
    p.markCollectionOpened('unhinged');
    p.onDiscovery({ isNew: true, section: 'bossfight' }, P(2, 1, 1, 1));
    p.onRoundComplete(rec(3));
    const s = p.current!;
    expect(s.rounds.map((r) => r.discovered)).toEqual([true, false, true]);
    expect(s.collection).toMatchObject({
      discoveries: 2,
      opens: 2,
      firstOpenAfterRound: 0,
      openLog: [{ afterRound: 0, level: 'grumpy' }, { afterRound: 2, level: 'unhinged' }],
      discoveriesBySection: { grumpy: 1, furious: 0, unhinged: 0, bossfight: 1 },
      atEnd: { discovered: 5, total: 147 },
      meltdownUnlock: null,
    });
    expect(summarize(s).levelChangesAfterOpen).toEqual({ opens: 2, changed: 1 });
  });

  it('OFFICE MELTDOWN : le déblocage NATUREL (4 avec chacun des 9 gadgets) est enregistré une seule fois, jamais forcé', () => {
    const p = new PlaytestRecorder(createMemoryStore(), 'TEST');
    p.start(DEVICE, PG([3, 4, 4, 4, 4, 4, 4, 4, 4]));
    p.onRoundComplete(rec(1));
    p.onRoundComplete(rec(2));
    p.onDiscovery({ isNew: true, section: 'grumpy' }, PG([4, 4, 4, 4, 4, 4, 4, 4, 4], 1));
    p.onRoundComplete(rec(3));
    p.onDiscovery({ isNew: true, section: 'grumpy' }, PG([5, 4, 4, 4, 4, 4, 4, 4, 4], 1));
    p.onRoundComplete(rec(4));
    const c = p.current!.collection!;
    expect(c.meltdownUnlock).toEqual({ roundUnlocked: 3, rageCountsAtUnlock: { grumpy: 12, furious: 12, unhinged: 12 }, collectionCountAtUnlock: 37 });
    expect(c.meltdownAtEnd).toMatchObject({ grumpy: 12, furious: 12, unhinged: 12, current: 36, required: 36, unlocked: true, gadgetsDone: 9 });
    // Le joueur décide lui-même de lancer l'épisode.
    expect(c.episodePlays).toBe(0);
    p.markEpisodePlayed();
    expect(p.current!.collection!.episodePlays).toBe(1);
    for (let i = 5; i <= PLAYTEST_TARGET; i++) p.onRoundComplete(rec(i, { level: 'furious' }));
    const sum = summarize(p.current!);
    expect(sum.levelsUsed).toEqual(['grumpy', 'furious', 'unhinged']);
    // Après la 50e manche (questionnaire) : plus rien n'est compté.
    p.markCollectionOpened('grumpy');
    p.onDiscovery({ isNew: true, section: 'furious' }, P(9, 9, 8, 1));
    expect(p.current!.collection!.opens).toBe(0);
    expect(p.current!.collection!.discoveries).toBe(2);
  });

  it('OFFICE MELTDOWN déjà débloqué au début de la session : aucun « déblocage » enregistré', () => {
    const p = new PlaytestRecorder(createMemoryStore(), 'TEST');
    p.start(DEVICE, P(8, 8, 8));
    p.onDiscovery({ isNew: true, section: 'unhinged' }, P(8, 8, 9));
    p.onRoundComplete(rec(1));
    expect(p.current!.collection!.meltdownUnlock).toBeNull();
  });

  it('collection désactivée : aucune donnée de collection dans la session', () => {
    const p = new PlaytestRecorder(createMemoryStore(), 'TEST');
    p.start(DEVICE, null);
    p.onDiscovery({ isNew: true, section: 'grumpy' }, P(1, 0, 0));
    p.onRoundComplete(rec(1));
    expect(p.current!.collection).toBeUndefined();
    expect(p.current!.rounds[0]!.discovered).toBeUndefined();
    expect(summarize(p.current!).levelChangesAfterOpen).toBeNull();
  });
});

describe('PLAYTEST #3 (3 gadgets par Rage Level, LOCAL DEV ONLY)', () => {
  const plansOf = (slot: 'A' | 'B' | 'C') => ({ selected: slot, selectedGadget: 'x', triple: [] }) as unknown as RoundRecord['plans'];

  it('mode classique : protocole inchangé (8 affirmations, aucune donnée de gadget)', () => {
    const p = new PlaytestRecorder(createMemoryStore(), 'TEST');
    p.start(DEVICE);
    expect(questionsFor(p.current)).toEqual(PLAYTEST_QUESTIONS);
    p.onRoundComplete(rec(1));
    expect(p.current!.rounds[0]).not.toHaveProperty('plan');
    expect(summarize(p.current!).gadgets).toBeNull();
  });

  it('mode 3 gadgets : 11 affirmations, plan par manche, changements de gadget, REVEAL OTHER PLANS, gadget préféré', () => {
    const p = new PlaytestRecorder(createMemoryStore(), 'TEST');
    p.start(DEVICE, null, { plans: true });
    expect(questionsFor(p.current)).toEqual([...PLAYTEST_QUESTIONS, ...PLAYTEST3_QUESTIONS]);
    // GRUMPY : A, A, B ; puis FURIOUS : C.
    p.onRoundComplete(rec(1, { level: 'grumpy', gadgetId: 'swivel-slingshot', plans: plansOf('A') }));
    p.onRoundComplete(rec(2, { level: 'grumpy', gadgetId: 'swivel-slingshot', plans: plansOf('A') }));
    p.onRoundComplete(rec(3, { level: 'grumpy', gadgetId: 'espresso-blaster', plans: plansOf('B') }));
    p.markOtherPlansOpened(false);
    p.markOtherPlansOpened(true);
    p.onRoundComplete(rec(4, { level: 'furious', gadgetId: 'cooler-bowling', plans: plansOf('C') }));
    expect(p.current!.rounds.map((r) => r.plan)).toEqual(['A', 'A', 'B', 'C']);
    const g = summarize(p.current!).gadgets!;
    expect(g.distinct).toBe(3);
    expect(g.byPlan).toEqual({ A: 2, B: 1, C: 1 });
    expect(g.repeatsSameLevel).toBe(1);
    expect(g.switchesSameLevel).toBe(1);
    expect(g.otherPlans).toEqual({ opens: 2, afterLoss: 1, afterWin: 1 });
    for (let i = 5; i <= PLAYTEST_TARGET; i++) p.onRoundComplete(rec(i));
    expect(p.current!.status).toBe('questionnaire');
    // Hors session de jeu : REVEAL OTHER PLANS n'est plus compté.
    p.markOtherPlansOpened(true);
    expect(p.current!.otherPlans!.opens).toBe(2);
    p.submitAnswers({ scores: Array.from({ length: 11 }, (_x, i) => (i % 5) + 1), memorable: ' Le coffre. ', wish: '', favorite: ' La bonbonne ! ' });
    const done = p.snapshot.sessions[0]!;
    expect(done.answers!.scores).toHaveLength(11);
    expect(done.answers!.favorite).toBe('La bonbonne !');
    const exported = JSON.parse(p.exportJson());
    expect(exported.playtest3Questions).toHaveLength(3);
    expect(exported.summaries[0].gadgets.distinct).toBeGreaterThanOrEqual(3);
  });

  it('formulations neutres : aucune promesse ni vocabulaire de chance dans les affirmations', () => {
    for (const q of PLAYTEST3_QUESTIONS) expect(q).not.toMatch(/chance|lucky|jackpot|presque|almost/i);
  });
});

