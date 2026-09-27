/**
 * POC « 3 PLANS » (A2, MOCK / DEV) — SÉCURITÉ ET MATHS.
 * Exigences : le choix A/B/C précède TOUJOURS Play ; une manche possède un unique plan (selectedGadget) immuable
 * après Play — pendant l'animation, après rechargement, pendant la reprise, en double tap ; le triple est tiré
 * sans connaître le plan (aucun faux « what if ») ; RTP identique pour A, B et C.
 */
import { describe, expect, it } from 'vitest';
import { parseRound } from '../../src/domain/outcome';
import { PLAN_SLOTS, POC_PLAN_SETS, parsePlanMode, planModeName, type PlanSlot } from '../../src/domain/plans';
import { mulberry32 } from '../../src/domain/seed';
import type { InternalRound } from '../../src/domain/round';
import { GameFlow, type FlowState } from '../../src/flow/GameFlow';
import { MockRgsAdapter } from '../../src/platform/rgs/mock/MockRgsAdapter';
import { MockServer } from '../../src/platform/rgs/mock/MockServer';
import { RgsError } from '../../src/platform/rgs/RgsPort';
import { baseTable, bookForPick, drawTriple, expectedMultiplier } from '../../src/platform/rgs/mock/tripleMath';
import { FakePresenter } from './fakePresenter';
import { createMock, waitFor } from './helpers';

const FAST = { authMs: 200, playMs: 80, endRoundMs: 80 };
const GRUMPY = POC_PLAN_SETS.grumpy!;

async function pocFlow(opts: { presenter?: FakePresenter; seed?: number; mock?: ReturnType<typeof createMock> } = {}) {
  const mock = opts.mock ?? createMock(opts.seed ?? 21);
  const presenter = opts.presenter ?? new FakePresenter(40, 80);
  const flow = new GameFlow({ rgs: mock.adapter, presenter, timeouts: FAST, maxAutoResync: 4, planLevels: ['grumpy'] });
  await flow.start();
  return { ...mock, presenter, flow };
}
const until = (flow: GameFlow, state: FlowState, ms = 3000) => waitFor(() => flow.snapshot.state === state, ms, state);

describe('POC 3 PLANS : modes A2 (candidats, INFORMATION STAKE ENGINE REQUISE)', () => {
  it('noms de modes grumpy_a / _b / _c, lecture inverse', () => {
    expect(PLAN_SLOTS.map((s) => planModeName('grumpy', s))).toEqual(['grumpy_a', 'grumpy_b', 'grumpy_c']);
    expect(parsePlanMode('grumpy_b')).toEqual({ level: 'grumpy', slot: 'B' });
    expect(parsePlanMode('grumpy')).toBeNull();
    expect(parsePlanMode('grumpy_d')).toBeNull();
  });
});

describe('POC 3 PLANS : maths A2 (triple tiré AVANT de connaître le plan)', () => {
  it('même hasard → même triple pour A, B et C ; seuls pick, présentation, finalWin et payoutMultiplier changent', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const books = PLAN_SLOTS.map((slot) => bookForPick(drawTriple('grumpy', GRUMPY, mulberry32(seed)), slot, 1));
      const tripleOf = (b: (typeof books)[number]) => JSON.stringify(b.events.find((e) => e.type === 'triple'));
      expect(new Set(books.map(tripleOf)).size).toBe(1);
      const triple = books[0]!.events.find((e) => e.type === 'triple')!;
      books.forEach((b, i) => {
        expect(b.payoutMultiplier).toBe(triple.type === 'triple' ? triple.results[i]!.multiplier100 : -1);
        expect(b.events.find((e) => e.type === 'pick')).toEqual({ type: 'pick', slot: PLAN_SLOTS[i] });
      });
    }
  });

  it('le serveur mock tire le même triple quel que soit le plan choisi (même graine, trois serveurs)', async () => {
    const triples = await Promise.all(
      PLAN_SLOTS.map(async (slot) => {
        const { adapter } = createMock(77);
        await adapter.authenticate();
        const res = await adapter.play(1_000_000, 'grumpy', slot);
        expect(res.round.plan).toBe(slot);
        return JSON.stringify(res.round.events.find((e) => (e as { type: string }).type === 'triple'));
      }),
    );
    expect(new Set(triples).size).toBe(1);
  });

  it('RTP A = B = C = RTP du niveau ; BOSS FIGHT 1/150 commun aux trois ; « trois pertes » ≈ 7,4 % (GRUMPY)', () => {
    const rnd = mulberry32(20260927);
    const N = 300_000;
    const sum = [0, 0, 0];
    let bf = 0;
    let allLose = 0;
    for (let i = 0; i < N; i++) {
      const t = drawTriple('grumpy', GRUMPY, rnd);
      const m = t.event.results.map((r) => r.multiplier100 / 100);
      m.forEach((x, k) => (sum[k]! += x));
      if (t.event.bossFight) {
        bf++;
        expect(new Set(m).size).toBe(1);
        expect(t.bossFight).not.toBeNull();
      }
      if (m.every((x) => x === 0)) allLose++;
    }
    const exact = expectedMultiplier('grumpy');
    expect(exact).toBeCloseTo(0.965, 6);
    // Écart-type par manche 2,685 → erreur type ≈ 0,005 sur 300 000 tirages : tolérance 4 σ.
    for (const s of sum) expect(Math.abs(s / N - exact)).toBeLessThan(0.021);
    expect(Math.abs(bf / N - 1 / 150)).toBeLessThan(0.0007);
    const p0 = baseTable('grumpy').rows.find((r) => r.multiplier100 === 0)!.p;
    const expectedAllLose = (1 - 1 / 150) * p0 ** 3;
    expect(expectedAllLose).toBeCloseTo(0.0743, 3);
    expect(Math.abs(allLose / N - expectedAllLose)).toBeLessThan(0.002);
  });
});

describe('POC 3 PLANS : lecture stricte du book (parseRound)', () => {
  function tripleRound(slot: PlanSlot, seed = 5): InternalRound {
    const book = bookForPick(drawTriple('grumpy', GRUMPY, mulberry32(seed)), slot, 1);
    return { roundId: 'R-1', mode: 'grumpy', betAmount: 1_000_000, payout: book.payoutMultiplier * 10_000, payoutMultiplier100: book.payoutMultiplier, active: true, events: book.events, plan: slot };
  }

  it('manche valide : plan payé, gadget choisi et triple complet, immuables', () => {
    const o = parseRound(tripleRound('B'), 'play');
    expect(o.plans?.selected).toBe('B');
    expect(o.plans?.selectedGadget).toBe('espresso-blaster');
    expect(o.plans?.results.map((r) => r.slot)).toEqual(['A', 'B', 'C']);
    expect(Object.isFrozen(o) && Object.isFrozen(o.plans) && Object.isFrozen(o.plans!.results)).toBe(true);
    expect(() => {
      (o.plans as { selected: PlanSlot }).selected = 'C';
    }).toThrow(TypeError);
  });

  it('refuse un plan serveur différent du pick, un gain qui n’est pas celui du plan, une présentation d’un autre plan', () => {
    const r = tripleRound('B');
    expect(() => parseRound({ ...r, plan: 'C' }, 'play')).toThrow(/pick/);
    expect(() => parseRound({ ...r, payoutMultiplier100: r.payoutMultiplier100 + 10, events: r.events.map((e) => ((e as { type: string }).type === 'finalWin' ? { type: 'finalWin', amount: r.payoutMultiplier100 + 10 } : e)) }, 'play')).toThrow();
    const otherSeed = r.events.map((e) => ((e as { type: string }).type === 'presentation' ? { ...(e as object), seed: 123456 } : e));
    expect(() => parseRound({ ...r, events: otherSeed }, 'play')).toThrow(/présentation/);
    expect(() => parseRound({ ...r, events: r.events.filter((e) => (e as { type: string }).type !== 'triple') }, 'play')).toThrow();
  });
});

describe('POC 3 PLANS : le plan est choisi AVANT Play et ne change plus ensuite (selectedGadget immuable)', () => {
  it('pas de tir sans plan ; le plan part AVEC la mise', async () => {
    const { flow, server } = await pocFlow();
    expect(flow.snapshot.plansEnabled).toBe(true);
    expect(flow.snapshot.canFire).toBe(false);
    expect(flow.fire()).toBe(false);
    expect(server.snapshot().calls.play).toBe(0);
    expect(flow.setPlan('B')).toBe(true);
    expect(flow.snapshot.canFire).toBe(true);
    expect(flow.fire()).toBe(true);
    await until(flow, 'READY');
    expect(server.snapshot().calls.play).toBe(1);
    expect(server.snapshot().lastRound?.plan).toBe('B');
  });

  it('pendant la mise, l’animation et le reveal : impossible de changer de plan', async () => {
    const presenter = new FakePresenter(60, 120);
    const { flow, server } = await pocFlow({ presenter });
    flow.setPlan('B');
    flow.fire();
    expect(flow.snapshot.state).toBe('BET_PENDING');
    expect(flow.setPlan('C')).toBe(false);
    await until(flow, 'PRESENTING');
    expect(flow.setPlan('A')).toBe(false);
    expect(flow.snapshot.round?.plan).toBe('B');
    // I5 : aucune alternative (ni aucun chiffre) avant le reveal.
    expect(flow.snapshot.revealed).toBeNull();
    await until(flow, 'REVEAL');
    expect(flow.setPlan('C')).toBe(false);
    expect(flow.snapshot.revealed?.plans?.selected).toBe('B');
    await until(flow, 'READY');
    expect(flow.snapshot.plan).toBe('B');
    expect(presenter.calls[0]!.outcome.plans?.selected).toBe('B');
    expect(server.snapshot().lastRound?.plan).toBe('B');
  });

  it('double tap FIRE (puis tap sur un autre plan) → un seul Play, plan inchangé', async () => {
    const { flow, server } = await pocFlow();
    flow.setPlan('A');
    expect(flow.fire()).toBe(true);
    expect(flow.setPlan('C')).toBe(false);
    expect(flow.fire()).toBe(false);
    await until(flow, 'READY');
    expect(server.snapshot().calls.play).toBe(1);
    expect(server.snapshot().lastRound?.plan).toBe('A');
  });

  it('rechargement pendant la manche : la reprise rejoue le plan du SERVEUR, sans nouveau Play ni nouveau choix', async () => {
    const mock = createMock(33);
    await mock.adapter.authenticate();
    await mock.adapter.play(1_000_000, 'grumpy', 'C'); // manche active laissée par une page fermée
    const presenter = new FakePresenter(60, 120);
    const flow = new GameFlow({ rgs: new MockRgsAdapter(mock.server), presenter, timeouts: FAST, planLevels: ['grumpy'] });
    const started = flow.start();
    await waitFor(() => flow.snapshot.state === 'RESUMING', 2000, 'RESUMING');
    expect(flow.setPlan('A')).toBe(false);
    expect(flow.snapshot.plan).toBe('C');
    expect(flow.snapshot.round?.plan).toBe('C');
    await started;
    await until(flow, 'READY');
    expect(mock.server.snapshot().calls.play).toBe(1);
    expect(presenter.calls).toHaveLength(1);
    expect(presenter.calls[0]!.options.mode).toBe('resume');
    expect(presenter.calls[0]!.outcome.plans?.selected).toBe('C');
    expect(mock.server.snapshot().lastRound?.plan).toBe('C');
  });

  it('réponse de Play perdue : la reprise garde le plan envoyé', async () => {
    const { flow, server, presenter } = await pocFlow();
    server.update((s) => (s.faults.playTimeoutAfterSend = true));
    flow.setPlan('B');
    flow.fire();
    await waitFor(() => flow.snapshot.state === 'READY' && server.snapshot().settledRounds === 1, 4000, 'réglée');
    expect(server.snapshot().calls.play).toBe(1);
    expect(presenter.calls[0]!.outcome.plans?.selected).toBe('B');
  });

  it('le serveur refuse un plan invalide ; le client Stake refuse tout plan AVANT envoi', async () => {
    const server = new MockServer((createMock(1)).store, mulberry32(2));
    expect(() => server.play(1_000_000, 'furious', 'D' as never)).toThrow(RgsError);
    (globalThis as { window?: unknown }).window ??= { dispatchEvent: () => true };
    const { StakeRgsAdapter } = await import('../../src/platform/rgs/stake/StakeRgsAdapter');
    const stake = new StakeRgsAdapter('https://game.example.test/index.html?sessionID=abc&rgs_url=rgs.example.test');
    await expect(stake.play(1_000_000, 'grumpy', 'B')).rejects.toMatchObject({ kind: 'client' });
  });
});
