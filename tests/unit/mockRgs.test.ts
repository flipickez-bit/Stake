import { describe, expect, it } from 'vitest';
import { RgsError } from '../../src/platform/rgs/RgsPort';
import { createMock, sleep } from './helpers';

describe('MockRGS', () => {
  it('Play débite, crée une manche active ; EndRound crédite et ferme', async () => {
    const { adapter, server } = createMock();
    await adapter.authenticate();
    const play = await adapter.play(1_000_000, 'furious');
    expect(play.round.active).toBe(true);
    expect(play.balance.amount).toBe(999_000_000);
    const end = await adapter.endRound();
    expect(end.balance.amount).toBe(999_000_000 + play.round.payout);
    const s = server.snapshot();
    expect(s.activeRound).toBeNull();
    expect(s.lastRound?.roundId).toBe(play.round.roundId);
    expect(s.calls.play).toBe(1);
    expect(s.calls.endRound).toBe(1);
  });

  it('refuse un deuxième Play tant qu\'une manche est active (ERR_BE)', async () => {
    const { adapter } = createMock();
    await adapter.play(1_000_000, 'grumpy');
    await expect(adapter.play(1_000_000, 'grumpy')).rejects.toMatchObject({ kind: 'rgs', code: 'ERR_BE' });
  });

  it('solde insuffisant : ERR_IPB, rien n\'est débité', async () => {
    const { adapter, server } = createMock();
    server.update((s) => (s.balance = 50_000));
    await expect(adapter.play(100_000, 'grumpy')).rejects.toBeInstanceOf(RgsError);
    expect(server.snapshot().balance).toBe(50_000);
  });

  it('PLAY TIMEOUT après envoi : le serveur a exécuté la mise, la réponse ne vient jamais', async () => {
    const { adapter, server } = createMock();
    server.update((s) => (s.faults.playTimeoutAfterSend = true));
    let settled = false;
    adapter.play(1_000_000, 'unhinged').then(() => (settled = true), () => (settled = true));
    await sleep(30);
    expect(settled).toBe(false);
    const snap = await adapter.getActiveRound();
    expect(snap.activeRound).not.toBeNull();
    expect(server.snapshot().calls.play).toBe(1);
    expect(server.snapshot().faults.playTimeoutAfterSend).toBe(false); // panne consommée
  });

  it('END ROUND TIMEOUT après envoi : la manche est réglée côté serveur', async () => {
    const { adapter, server } = createMock();
    await adapter.play(1_000_000, 'grumpy');
    server.update((s) => (s.faults.endRoundTimeoutAfterSend = true));
    adapter.endRound().catch(() => undefined);
    await sleep(30);
    const snap = await adapter.getActiveRound();
    expect(snap.activeRound).toBeNull();
    expect(server.snapshot().calls.endRound).toBe(1);
  });

  it('hors ligne : erreur réseau, aucune mise exécutée', async () => {
    const { adapter, server } = createMock();
    server.update((s) => (s.faults.offline = true));
    await expect(adapter.play(1_000_000, 'grumpy')).rejects.toMatchObject({ kind: 'network' });
    expect(server.snapshot().calls.play).toBe(0);
  });

  it('état persistant : un nouveau serveur sur le même stockage retrouve la manche active', async () => {
    const { adapter, store } = createMock();
    const play = await adapter.play(1_000_000, 'furious');
    const { MockServer } = await import('../../src/platform/rgs/mock/MockServer');
    const reborn = new MockServer(store);
    expect(reborn.snapshot().activeRound?.roundId).toBe(play.round.roundId);
  });

  it('replay : renvoie une manche passée, inactive, identique', async () => {
    const { adapter } = createMock();
    const play = await adapter.play(1_000_000, 'grumpy');
    await adapter.endRound();
    const replay = await adapter.getReplay({ game: 'bad-boss', version: '0', mode: 'grumpy', event: play.round.roundId });
    expect(replay.active).toBe(false);
    expect(replay.events).toEqual(play.round.events);
  });
});
