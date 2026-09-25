import type { Outcome } from '../../src/domain/outcome';
import type { PresentationHandle, PresentOptions, RoundPresenter } from '../../src/flow/presenterPort';

export interface FakeCall {
  outcome: Outcome;
  options: PresentOptions;
}

/** Présentation factice : reveal après revealMs, fin après doneMs. `hang` simule une page fermée. */
export class FakePresenter implements RoundPresenter {
  calls: FakeCall[] = [];
  neutralStarts = 0;
  neutralAborts = 0;
  idles = 0;
  hang = false;

  constructor(public revealMs = 5, public doneMs = 10) {}

  beginNeutral(): void {
    this.neutralStarts++;
  }
  abortNeutral(): void {
    this.neutralAborts++;
  }
  toIdle(): void {
    this.idles++;
  }
  present(outcome: Outcome, options: PresentOptions): PresentationHandle {
    this.calls.push({ outcome, options });
    let resolveReveal!: () => void;
    const reveal = new Promise<void>((r) => (resolveReveal = r));
    const done = new Promise<void>((r) => {
      if (this.hang) return;
      setTimeout(resolveReveal, this.revealMs);
      setTimeout(r, this.doneMs);
    });
    return {
      info: { branchId: `FAKE-${outcome.script}`, sequenceKey: `k-${outcome.roundId}`, totalMs: this.doneMs, gadgetId: 'fake' },
      reveal,
      done,
      skipToReveal: () => {
        resolveReveal();
        return true;
      },
    };
  }
}
