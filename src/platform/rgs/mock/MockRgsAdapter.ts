/**
 * Transport simulé autour de MockServer : latence et pannes injectables.
 * Implémente la même interface RgsPort que StakeRgsAdapter.
 */
import type { InternalRound } from '../../../domain/round';
import type { RageLevelId } from '../../../domain/types';
import {
  RgsError,
  type AuthResult,
  type EndRoundResult,
  type PlayResult,
  type ReplayRequest,
  type RgsPort,
  type RoundSnapshot,
} from '../RgsPort';
import type { MockServer } from './MockServer';

const NEVER = <T>(): Promise<T> => new Promise<T>(() => {});

export class MockRgsAdapter implements RgsPort {
  readonly name = 'mock' as const;

  constructor(readonly server: MockServer) {}

  private async transport<T>(run: () => T): Promise<T> {
    const { latencyMs, offline } = this.server.snapshot().faults;
    await new Promise((r) => setTimeout(r, latencyMs));
    if (this.server.snapshot().faults.offline || offline) {
      throw new RgsError('network', 'Mock: network offline');
    }
    return run();
  }

  authenticate(): Promise<AuthResult> {
    return this.transport(() => this.server.authenticate());
  }

  async play(amount: number, mode: RageLevelId): Promise<PlayResult> {
    const result = await this.transport(() => {
      const armed = this.server.snapshot().faults.playTimeoutAfterSend;
      const res = this.server.play(amount, mode); // la mise EST exécutée côté serveur
      if (armed) this.server.update((s) => (s.faults.playTimeoutAfterSend = false));
      return { res, lost: armed };
    });
    if (result.lost) return NEVER<PlayResult>(); // réponse perdue : l'appelant ne saura jamais
    return result.res;
  }

  async endRound(): Promise<EndRoundResult> {
    const result = await this.transport(() => {
      const armed = this.server.snapshot().faults.endRoundTimeoutAfterSend;
      const res = this.server.endRound(); // la manche EST réglée côté serveur
      if (armed) this.server.update((s) => (s.faults.endRoundTimeoutAfterSend = false));
      return { res, lost: armed };
    });
    if (result.lost) return NEVER<EndRoundResult>();
    return result.res;
  }

  getActiveRound(): Promise<RoundSnapshot> {
    return this.transport(() => this.server.resync());
  }

  getReplay(request: ReplayRequest): Promise<InternalRound> {
    return this.transport(() => this.server.replay(request.event));
  }
}
