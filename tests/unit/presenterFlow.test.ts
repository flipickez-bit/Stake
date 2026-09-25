/**
 * GameFlow + VRAI Presenter (séquenceur, contenu) + MockRGS, sans rendu : scène et audio nuls.
 * Le temps de présentation est accéléré (×10) par un pilote de ticks.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { GameFlow } from '../../src/flow/GameFlow';
import { MockRgsAdapter } from '../../src/platform/rgs/mock/MockRgsAdapter';
import { MockServer } from '../../src/platform/rgs/mock/MockServer';
import { mulberry32 } from '../../src/domain/seed';
import { Presenter, type AudioSink, type SceneSink } from '../../src/presenter/Presenter';
import { gadgetFor } from '../../src/content/gadgets';
import type { KeyValueStore } from '../../src/platform/storage';
import { createMock, waitFor } from './helpers';

const FAST = { authMs: 300, playMs: 150, endRoundMs: 150 };
const nullScene: SceneSink = { setGadget: () => {}, render: () => {} };
const nullAudio: AudioSink = { play: () => {}, silence: () => {} };
const drivers: ReturnType<typeof setInterval>[] = [];

function drive(presenter: Presenter): void {
  drivers.push(setInterval(() => presenter.tick(160), 16 / 10 + 14));
}

afterEach(() => {
  while (drivers.length) clearInterval(drivers.pop());
});

async function boot(store: KeyValueStore, server: MockServer, awaitStart = true) {
  const presenter = new Presenter(nullScene, nullAudio);
  drive(presenter);
  const flow = new GameFlow({ rgs: new MockRgsAdapter(server), presenter, timeouts: FAST, maxAutoResync: 4 });
  const started = flow.start();
  if (awaitStart) await started;
  return { presenter, flow, store };
}

describe('Presenter réel + GameFlow + MockRGS', () => {
  it('boucle complète avec le séquenceur : la branche jouée correspond au book', async () => {
    const { store, server } = createMock(21);
    const { flow, presenter } = await boot(store, server);
    flow.setLevel('furious');
    server.update((s) => (s.nextForced = { mode: 'furious', forced: { kind: 'BIG_WIN', multiplier: 10 } }));
    flow.fire();
    await waitFor(() => presenter.status.mode === 'playing', 3000, 'playing');
    const branch = gadgetFor('furious').branches.find((b) => b.id === presenter.status.branchId);
    expect(branch?.classes).toContain('BIG');
    await waitFor(() => flow.snapshot.state === 'READY' && server.snapshot().settledRounds === 1, 8000, 'ready');
    expect(flow.snapshot.revealed?.multiplier100).toBe(1000);
    expect(server.snapshot().calls.play).toBe(1);
    expect(server.snapshot().calls.endRound).toBe(1);
  });

  it('RELOAD DURING ANIMATION → même résultat et même branche, aucune nouvelle mise', async () => {
    const { store, server } = createMock(33);
    const a = await boot(store, server);
    a.flow.setLevel('unhinged');
    server.update((s) => (s.nextForced = { mode: 'unhinged', forced: { kind: 'WIN', multiplier: 2, seed: 777 } }));
    a.flow.fire();
    await waitFor(() => a.presenter.status.mode === 'playing' && a.presenter.status.t > 1600, 5000, 'milieu de l\'animation');
    const before = { branch: a.presenter.status.branchId, seed: a.presenter.status.seed, round: a.flow.snapshot.round?.roundId };
    // « Rechargement » : on abandonne l'instance A (onglet fermé) et on relance sur le même stockage.
    for (const d of drivers.splice(0)) clearInterval(d);
    const server2 = new MockServer(store, mulberry32(999));
    const b = await boot(store, server2, false);
    await waitFor(() => b.presenter.status.branchId !== null, 3000, 'reprise');
    expect(b.flow.snapshot.round?.roundId).toBe(before.round);
    expect(b.presenter.status.branchId).toBe(before.branch);
    expect(b.presenter.status.seed).toBe(before.seed);
    await waitFor(() => b.flow.snapshot.state === 'READY', 8000, 'ready');
    expect(b.flow.snapshot.revealed?.multiplier100).toBe(200);
    expect(server2.snapshot().calls.play).toBe(1);
    expect(server2.snapshot().settledRounds).toBe(1);
  });

  it('RELOAD DURING BOSS FIGHT → même déroulé, même palier final, aucune nouvelle mise', async () => {
    const { store, server } = createMock(66);
    const a = await boot(store, server);
    a.flow.setLevel('unhinged');
    server.update((s) => (s.nextForced = { mode: 'unhinged', forced: { kind: 'BOSS_FIGHT', bossFightRung: 4, seed: 31337 } }));
    a.flow.fire();
    await waitFor(() => a.presenter.status.bossFight.rung >= 2, 8000, 'milieu du BOSS FIGHT');
    const before = { branch: a.presenter.status.branchId, rungs: a.presenter.status.bossFight.rungs100, round: a.flow.snapshot.round?.roundId };
    for (const d of drivers.splice(0)) clearInterval(d);
    const server2 = new MockServer(store, mulberry32(1));
    const b = await boot(store, server2, false);
    await waitFor(() => b.presenter.status.branchId !== null, 3000, 'reprise');
    expect(b.presenter.status.branchId).toBe(before.branch);
    expect(b.flow.snapshot.round?.roundId).toBe(before.round);
    await waitFor(() => b.presenter.status.bossFight.active, 5000, 'échelle');
    expect(b.presenter.status.bossFight.rungs100).toEqual(before.rungs);
    await waitFor(() => b.flow.snapshot.state === 'READY', 20000, 'ready');
    expect(b.flow.snapshot.revealed?.multiplier100).toBe(10_000); // UNHINGED, palier 4 = x100
    expect(server2.snapshot().calls.play).toBe(1);
  }, 30000);

  it('REPLAY → même branche, même résultat, aucun appel wallet', async () => {
    const { store, server } = createMock(44);
    const { flow, presenter } = await boot(store, server);
    flow.setLevel('grumpy');
    server.update((s) => (s.nextForced = { mode: 'grumpy', forced: { kind: 'BOSS_FIGHT', bossFightRung: 2 } }));
    flow.fire();
    await waitFor(() => presenter.status.branchId !== null, 3000, 'playing');
    const original = { branch: presenter.status.branchId, key: presenter.status.sequenceKey };
    await waitFor(() => flow.snapshot.state === 'READY' && server.snapshot().settledRounds === 1, 20000, 'ready');
    const revealed = flow.snapshot.revealed;
    const calls = server.snapshot().calls;
    const round = flow.lastPresentedRound!;
    const replay = flow.replayRound(round);
    await waitFor(() => flow.snapshot.state === 'REPLAYING', 1000, 'replaying');
    expect(presenter.status.branchId).toBe(original.branch);
    expect(presenter.status.sequenceKey).toBe(original.key);
    await replay;
    expect(flow.snapshot.revealed).toEqual(revealed);
    expect(server.snapshot().calls.play).toBe(calls.play);
    expect(server.snapshot().calls.endRound).toBe(calls.endRound);
  }, 30000);

  it('SLAMSTOP / SKIP → résultat identique, fin de manche normale', async () => {
    const { store, server } = createMock(55);
    const { flow, presenter } = await boot(store, server);
    server.update((s) => (s.nextForced = { mode: null, forced: { kind: 'WIN', multiplier: 3 } }));
    flow.fire();
    await waitFor(() => flow.snapshot.canSkip, 3000, 'skip possible');
    expect(flow.skip()).toBe(true);
    await waitFor(() => flow.snapshot.revealed !== null, 1000, 'reveal immédiat');
    expect(flow.snapshot.revealed?.multiplier100).toBe(300);
    await waitFor(() => flow.snapshot.state === 'READY', 8000, 'ready');
    expect(server.snapshot().lastRound?.payoutMultiplier100).toBe(300);
    expect(server.snapshot().calls.endRound).toBe(1);
    expect(presenter.status.mode).toBe('idle');
  });
});
