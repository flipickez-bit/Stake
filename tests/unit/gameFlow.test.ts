import { describe, expect, it } from 'vitest';
import { GameFlow, type FlowState } from '../../src/flow/GameFlow';
import { MockServer } from '../../src/platform/rgs/mock/MockServer';
import { MockRgsAdapter } from '../../src/platform/rgs/mock/MockRgsAdapter';
import { mulberry32 } from '../../src/domain/seed';
import { FakePresenter } from './fakePresenter';
import { createMock, sleep, waitFor } from './helpers';

const FAST = { authMs: 200, playMs: 80, endRoundMs: 80 };

async function readyFlow(opts: { presenter?: FakePresenter; seed?: number } = {}) {
  const mock = createMock(opts.seed ?? 11);
  const presenter = opts.presenter ?? new FakePresenter();
  const flow = new GameFlow({ rgs: mock.adapter, presenter, timeouts: FAST, maxAutoResync: 4 });
  await flow.start();
  expect(flow.snapshot.state).toBe('READY');
  return { ...mock, presenter, flow };
}

const until = (flow: GameFlow, state: FlowState, ms = 3000) => waitFor(() => flow.snapshot.state === state, ms, state);

describe('GameFlow : boucle nominale', () => {
  it('READY → BET → PLAY → présentation → REVEAL → END ROUND → READY', async () => {
    const { flow, server, presenter } = await readyFlow();
    const states: FlowState[] = [];
    flow.subscribe((s) => states.push(s.state));
    flow.setLevel('unhinged');
    expect(flow.fire()).toBe(true);
    await waitFor(() => flow.snapshot.state === 'READY' && server.snapshot().settledRounds === 1);
    expect(states).toEqual(expect.arrayContaining(['BET_PENDING', 'PRESENTING', 'REVEAL', 'READY']));
    expect(server.snapshot().calls.play).toBe(1);
    expect(server.snapshot().calls.endRound).toBe(1);
    expect(presenter.calls[0]?.outcome.mode).toBe('unhinged');
    expect(flow.snapshot.revealed?.roundId).toBe(server.snapshot().lastRound?.roundId);
  });

  it('aucun chiffre avant le reveal (I5)', async () => {
    const presenter = new FakePresenter(60, 80);
    const { flow } = await readyFlow({ presenter });
    flow.fire();
    await until(flow, 'PRESENTING');
    expect(flow.snapshot.revealed).toBeNull();
    await until(flow, 'REVEAL');
    expect(flow.snapshot.revealed).not.toBeNull();
  });
});

describe('Tests obligatoires Phase 0', () => {
  it('DOUBLE CLICK BET → un seul Play', async () => {
    const { flow, server } = await readyFlow();
    expect(flow.fire()).toBe(true);
    expect(flow.fire()).toBe(false);
    expect(flow.fire()).toBe(false);
    await until(flow, 'READY');
    expect(server.snapshot().calls.play).toBe(1);
  });

  it('PLAY TIMEOUT (réponse perdue après envoi) → aucun second Play, reprise de la même manche', async () => {
    const { flow, server, presenter } = await readyFlow();
    server.update((s) => (s.faults.playTimeoutAfterSend = true));
    flow.fire();
    await waitFor(() => server.snapshot().activeRound !== null, 1000, 'manche créée');
    const serverRoundId = server.snapshot().activeRound!.roundId;
    await waitFor(() => flow.snapshot.state === 'READY' && server.snapshot().settledRounds === 1, 3000);
    expect(server.snapshot().calls.play).toBe(1);
    expect(server.snapshot().calls.endRound).toBe(1);
    expect(presenter.calls).toHaveLength(1);
    expect(presenter.calls[0]!.outcome.roundId).toBe(serverRoundId);
    expect(presenter.calls[0]!.options.mode).toBe('resume');
  });

  it('PLAY hors ligne (non exécuté) → ROUND_STATUS_UNKNOWN, jamais de Play automatique, puis « mise non placée »', async () => {
    const { flow, server } = await readyFlow();
    server.update((s) => (s.faults.offline = true));
    flow.fire();
    await until(flow, 'ROUND_STATUS_UNKNOWN');
    await sleep(150);
    server.update((s) => (s.faults.offline = false));
    await until(flow, 'READY', 5000);
    expect(server.snapshot().calls.play).toBe(0);
    expect(flow.snapshot.message?.text).toMatch(/not placed/);
  });

  it('PLAY hors ligne prolongé → ROUND_STATUS_UNKNOWN + Réessayer (resync seulement)', async () => {
    const { flow, server } = await readyFlow();
    server.update((s) => (s.faults.offline = true));
    flow.fire();
    await waitFor(() => flow.snapshot.retryAvailable, 5000, 'retry');
    expect(flow.snapshot.state).toBe('ROUND_STATUS_UNKNOWN');
    expect(flow.snapshot.canFire).toBe(false);
    server.update((s) => (s.faults.offline = false));
    await flow.retry();
    await until(flow, 'READY');
    expect(server.snapshot().calls.play).toBe(0);
  });

  it('RELOAD AFTER PLAY / DURING ANIMATION → même manche, même résultat, un seul Play', async () => {
    const hanging = new FakePresenter();
    hanging.hang = true; // la page « se ferme » pendant l'animation
    const first = await readyFlow({ presenter: hanging });
    first.flow.fire();
    await waitFor(() => hanging.calls.length === 1, 1000, 'présentation lancée');
    const original = hanging.calls[0]!.outcome;
    // « Rechargement » : nouveau serveur sur le même stockage, nouveau GameFlow.
    const server2 = new MockServer(first.store, mulberry32(999));
    const presenter2 = new FakePresenter();
    const flow2 = new GameFlow({ rgs: new MockRgsAdapter(server2), presenter: presenter2, timeouts: FAST });
    await flow2.start();
    await waitFor(() => flow2.snapshot.state === 'READY' && server2.snapshot().settledRounds === 1);
    const resumed = presenter2.calls[0]!.outcome;
    expect(resumed.roundId).toBe(original.roundId);
    expect({ ...resumed, source: 'x' }).toEqual({ ...original, source: 'x' });
    expect(server2.snapshot().calls.play).toBe(1);
    expect(server2.snapshot().calls.endRound).toBe(1);
  });

  it('END ROUND (réponse perdue) → un seul EndRound logique', async () => {
    const { flow, server } = await readyFlow();
    server.update((s) => (s.faults.endRoundTimeoutAfterSend = true));
    flow.fire();
    await waitFor(() => flow.snapshot.state === 'READY' && server.snapshot().settledRounds === 1, 3000);
    expect(server.snapshot().calls.endRound).toBe(1);
    expect(flow.snapshot.balance?.amount).toBe(server.snapshot().balance);
  });

  it('END ROUND hors ligne → pas de rafale : ERROR + Réessayer, puis un seul règlement', async () => {
    const presenter = new FakePresenter(5, 10);
    const { flow, server } = await readyFlow({ presenter });
    flow.fire();
    await until(flow, 'REVEAL');
    server.update((s) => (s.faults.offline = true));
    await waitFor(() => flow.snapshot.state === 'ERROR' || (flow.snapshot.state === 'READY' && server.snapshot().settledRounds === 1), 6000);
    if (flow.snapshot.state === 'ERROR') {
      expect(server.snapshot().calls.endRound).toBe(0);
      server.update((s) => (s.faults.offline = false));
      await flow.retry();
      await until(flow, 'READY');
    }
    expect(server.snapshot().settledRounds).toBe(1);
    expect(server.snapshot().calls.endRound).toBeLessThanOrEqual(1);
  });

  it('durée minimale : READY_GATE sans modifier la présentation', async () => {
    const { flow, server } = await readyFlow();
    server.update((s) => (s.jurisdiction.minimumRoundDuration = 0.4));
    await flow.start();
    const t0 = performance.now();
    flow.fire();
    await until(flow, 'READY_GATE');
    await until(flow, 'READY');
    expect(performance.now() - t0).toBeGreaterThanOrEqual(390);
  });

  it('SKIP interdit si disabledSlamstop, autorisé sinon, résultat identique', async () => {
    const presenter = new FakePresenter(400, 450);
    const { flow, server } = await readyFlow({ presenter });
    server.update((s) => (s.jurisdiction.disabledSlamstop = true));
    await flow.start();
    flow.fire();
    await until(flow, 'PRESENTING');
    expect(flow.skip()).toBe(false);
    await until(flow, 'READY');
    server.update((s) => (s.jurisdiction.disabledSlamstop = false));
    await flow.start();
    flow.fire();
    await until(flow, 'PRESENTING');
    const t = performance.now();
    expect(flow.skip()).toBe(true);
    await until(flow, 'REVEAL');
    expect(performance.now() - t).toBeLessThan(200);
    expect(flow.snapshot.revealed?.multiplier100).toBe(presenter.calls[1]!.outcome.payoutMultiplier100);
  });

  it('BOSS FIGHT entièrement déterminé AVANT l\'animation', async () => {
    const { flow, server, presenter } = await readyFlow();
    server.update((s) => (s.nextForced = { mode: null, forced: { kind: 'BOSS_FIGHT', bossFightRung: 3 } }));
    flow.fire();
    await waitFor(() => presenter.calls.length === 1);
    const o = presenter.calls[0]!.outcome;
    expect(o.bossFight).not.toBeNull();
    expect(o.bossFight!.attacks.length).toBe(4); // 3 coups réussis + 1 bloqué
    expect(o.bossFight!.rungs100[o.bossFight!.finalRungIndex]).toBe(o.payoutMultiplier100);
    expect(o.payoutMultiplier100).toBe(5000); // x50 = 4e palier
    await until(flow, 'READY');
  });

  it('politique de repli : manche à gain nul fermée par le serveur → aucun EndRound', async () => {
    const { flow, server } = await readyFlow();
    server.update((s) => {
      s.autoCloseZeroPayout = true;
      s.nextForced = { mode: null, forced: { kind: 'LOSS', multiplier: 0 } };
    });
    flow.fire();
    await waitFor(() => flow.snapshot.state === 'READY' && server.snapshot().settledRounds === 1);
    expect(server.snapshot().calls.endRound).toBe(0);
  });

  it('REPLAY → même résultat, aucun appel wallet', async () => {
    const { flow, server, presenter } = await readyFlow();
    flow.fire();
    await waitFor(() => flow.snapshot.state === 'READY' && server.snapshot().settledRounds === 1);
    const calls = { ...server.snapshot().calls };
    await flow.replayRound(flow.lastPresentedRound!);
    expect(presenter.calls).toHaveLength(2);
    expect({ ...presenter.calls[1]!.outcome, source: 'x' }).toEqual({ ...presenter.calls[0]!.outcome, source: 'x' });
    expect(server.snapshot().calls.play).toBe(calls.play);
    expect(server.snapshot().calls.endRound).toBe(calls.endRound);
  });

  it('manche active au démarrage → reprise (jamais de Play)', async () => {
    const mock = createMock(5);
    const active = mock.server.createActiveRound(1_000_000, 'furious');
    const presenter = new FakePresenter();
    const flow = new GameFlow({ rgs: mock.adapter, presenter, timeouts: FAST });
    await flow.start();
    await waitFor(() => flow.snapshot.state === 'READY' && mock.server.snapshot().settledRounds === 1);
    expect(presenter.calls[0]!.outcome.roundId).toBe(active.roundId);
    expect(mock.server.snapshot().calls.play).toBe(0);
  });
});
