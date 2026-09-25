/**
 * Assemblage : scène Pixi + audio + Presenter + adaptateur RGS (Mock ou Stake) + GameFlow.
 * GameFlow ne dépend que de RgsPort : Mock et Stake sont interchangeables sans le modifier.
 */
import { AudioDirector } from '../audio/AudioDirector';
import { GameFlow } from '../flow/GameFlow';
import { PerfMeter } from '../dev/perf';
import { PlaytestRecorder } from '../dev/playtest';
import { makeDevRound } from '../dev/devOutcomes';
import { runLoop, type LoopOptions } from '../dev/loop';
import type { RageLevelId } from '../domain/types';
import { cryptoRandom, type ForcedOutcome } from '../platform/rgs/mock/mockMath';
import { readLaunchParams, type LaunchParams } from '../platform/launchParams';
import type { MockServer } from '../platform/rgs/mock/MockServer';
import type { RgsPort } from '../platform/rgs/RgsPort';
import { createBrowserStore } from '../platform/storage';
import { Presenter } from '../presenter/Presenter';
import { PixiStage } from '../render/PixiStage';

export interface GameContext {
  params: LaunchParams;
  flow: GameFlow;
  presenter: Presenter;
  stage: PixiStage;
  audio: AudioDirector;
  perf: PerfMeter;
  playtest: PlaytestRecorder;
  mock: MockServer | null;
  devEnabled: boolean;
  contentErrors: string[];
}

async function createRgs(params: LaunchParams): Promise<{ rgs: RgsPort; mock: MockServer | null }> {
  if (params.rgs === 'stake') {
    // Chargé seulement en mode Stake : le client BETA `stake-engine` reste confiné à cet adaptateur.
    const { StakeRgsAdapter } = await import('../platform/rgs/stake/StakeRgsAdapter');
    return { rgs: new StakeRgsAdapter(window.location.href), mock: null };
  }
  const [{ MockServer }, { MockRgsAdapter }] = await Promise.all([
    import('../platform/rgs/mock/MockServer'),
    import('../platform/rgs/mock/MockRgsAdapter'),
  ]);
  const server = new MockServer(createBrowserStore());
  return { rgs: new MockRgsAdapter(server), mock: server };
}

export async function bootstrap(host: HTMLElement): Promise<GameContext> {
  const params = readLaunchParams(window.location.href);
  const stage = new PixiStage();
  await stage.init(host);
  const audio = new AudioDirector();
  const contentErrors: string[] = [];
  const presenter = new Presenter(stage, audio, {
    onContentError: (e) => contentErrors.push(e instanceof Error ? e.message : String(e)),
  });
  const perf = new PerfMeter();
  const playtest = new PlaytestRecorder(createBrowserStore());
  const { rgs, mock } = await createRgs(params);
  const flow = new GameFlow({
    rgs,
    presenter,
    // Mock : délais courts pour que les simulations de panne se voient vite. Stake : valeurs par défaut.
    timeouts: mock ? { playMs: 6000, endRoundMs: 5000, authMs: 8000 } : undefined,
    onRoundComplete: (r) => playtest.onRoundComplete(r),
  });

  // Boucle de rendu unique : le temps réel avance la séquence, puis Pixi dessine.
  let last = performance.now();
  const loop = (now: number) => {
    const dt = now - last;
    last = now;
    const t0 = performance.now();
    presenter.tick(dt);
    stage.draw();
    perf.frame(dt, performance.now() - t0, presenter.frame.particleCount);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  const ctx: GameContext = {
    params,
    flow,
    presenter,
    stage,
    audio,
    perf,
    playtest,
    mock,
    devEnabled: mock !== null || params.devRequested,
    contentErrors,
  };
  // Crochets de test (e2e) et de débogage.
  (window as unknown as { __BADBOSS__: unknown }).__BADBOSS__ = {
    ctx,
    state: () => flow.snapshot,
    presenter: () => presenter.status,
    calls: () => mock?.snapshot().calls ?? null,
    mock: () => mock?.snapshot() ?? null,
    server: mock,
    dev: {
      /** Présentation seule (aucune mise). */
      preview: (level: RageLevelId, forced: ForcedOutcome | null) =>
        flow.replayRound(makeDevRound(level, forced, cryptoRandom, `DEV-${Math.floor(performance.now()).toString(36)}`)),
      loop: (options: Partial<LoopOptions> & { count: number }) =>
        runLoop(flow, presenter, perf, () => (mock ? mock.snapshot().calls.play + mock.snapshot().calls.endRound : 0), {
          level: 'all',
          forced: null,
          ...options,
        }),
      perf: () => perf.snapshot(),
      stats: () => stage.stats(),
    },
  };
  void flow.start(params.replay);
  return ctx;
}
