/**
 * Assemblage : scène Pixi + audio + Presenter + adaptateur RGS (Mock ou Stake) + GameFlow.
 * GameFlow ne dépend que de RgsPort : Mock et Stake sont interchangeables sans le modifier.
 */
import { AudioDirector } from '../audio/AudioDirector';
import { buildCatalog } from '../collection/catalog';
import { Collection } from '../collection/Collection';
import { LocalCollectionStore } from '../collection/store';
import { attachCollectionTracker } from '../collection/tracker';
import { metaFeaturesFor, type MetaFeatures } from '../flow/featureGate';
import { GameFlow } from '../flow/GameFlow';
import { PerfMeter } from '../dev/perf';
import { PlaytestRecorder } from '../dev/playtest';
import { CLASSIC_GADGETS, CONTENT_VERSION, GADGETS, planReadyLevels } from '../content/gadgets';
import { makeDevRound } from '../dev/devOutcomes';
import { armBranch } from './devArm';
import type { ResultClass } from '../domain/types';
import { runLoop, type LoopOptions } from '../dev/loop';
import type { RageLevelId } from '../domain/types';
import { cryptoRandom, type ForcedOutcome } from '../platform/rgs/mock/mockMath';
import { readLaunchParams, type LaunchParams } from '../platform/launchParams';
import type { MockServer } from '../platform/rgs/mock/MockServer';
import type { RgsPort } from '../platform/rgs/RgsPort';
import { createBrowserStore } from '../platform/storage';
import { Presenter } from '../presenter/Presenter';
import { PixiStage } from '../render/PixiStage';
import { AltDisplaySetting, plansRequested } from './pocConfig';
import { PocPlaytestRecorder } from '../dev/pocPlaytest';

export interface GameContext {
  params: LaunchParams;
  flow: GameFlow;
  presenter: Presenter;
  stage: PixiStage;
  audio: AudioDirector;
  perf: PerfMeter;
  playtest: PlaytestRecorder;
  /** COLLECTION BOOK : null si désactivé (mode Stake tant que non confirmé, voir metaFeaturesFor). */
  collection: Collection | null;
  meta: MetaFeatures;
  /**
   * PRODUCTION 3 GADGETS (choix A/B/C, architecture A2) : réglage ALTERNATIVE DISPLAY et playtest A/B du POC.
   * null en mode classique (Stake, `?plans=off`). MOCK / DEV uniquement.
   */
  poc: { altDisplay: AltDisplaySetting; playtest: PocPlaytestRecorder } | null;
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
  // PRODUCTION 3 GADGETS : choix A/B/C par défaut avec le Mock ; jamais avec le RGS Stake (A2 non validée).
  const poc = plansRequested(window.location.href, params.rgs);
  const stage = new PixiStage();
  // Mesure (DEV) : initialisation de la scène, rastérisation des atlas d'art comprise (Phase 0.6).
  const stageT0 = performance.now();
  // Trophées visibles de la collection : atlas chargé seulement si la collection sera active (jamais Stake ni replay URL).
  const trophies = metaFeaturesFor(params.rgs).collection && !params.replay;
  await stage.init(host, { plans: poc, trophies });
  const stageInitMs = performance.now() - stageT0;
  let artReadyMs: number | null = null;
  const audio = new AudioDirector();
  const contentErrors: string[] = [];
  const presenter = new Presenter(stage, audio, {
    onContentError: (e) => contentErrors.push(e instanceof Error ? e.message : String(e)),
    plans: poc,
  });
  // Musique non permanente (SOUND KIT) : boucle du BOSS FIGHT pilotée par les signaux de la séquence.
  presenter.onSignalEvent((signal) => audio.onSignal(signal));
  const perf = new PerfMeter();
  const playtest = new PlaytestRecorder(createBrowserStore(), CONTENT_VERSION);
  const { rgs, mock } = await createRgs(params);
  // POC « 3 PLANS » : playtest A/B (PRIVATE / ON-DEMAND), LOCAL DEV ONLY.
  const pocPlaytest = poc ? new PocPlaytestRecorder(createBrowserStore(), cryptoRandom) : null;
  const flow = new GameFlow({
    rgs,
    presenter,
    // Mock : délais courts pour que les simulations de panne se voient vite. Stake : valeurs par défaut.
    timeouts: mock ? { playMs: 6000, endRoundMs: 5000, authMs: 8000 } : undefined,
    onRoundComplete: (r) => {
      playtest.onRoundComplete(r);
      pocPlaytest?.onRoundComplete(r);
    },
    // PRODUCTION 3 GADGETS : chaque Rage Level complet se joue en choisissant A, B ou C avant le tir.
    ...(poc ? { planLevels: planReadyLevels() } : {}),
  });

  // Ambiance du Rage Level courant (rendu sonore seulement).
  let ambienceLevel: RageLevelId | null = null;
  flow.subscribe((snap) => {
    if (snap.level !== ambienceLevel) audio.setLevel((ambienceLevel = snap.level));
  });

  // COLLECTION BOOK : observateur branché sur les snapshots publics de GameFlow (aucune modification du flux).
  // Jamais en mode replay par URL : un replay peut être la manche d'un autre joueur.
  const meta = metaFeaturesFor(params.rgs);
  let collection: Collection | null = null;
  if (meta.collection && !params.replay) {
    // Le livre ne montre que ce qui peut se jouer : 9 gadgets avec les plans, les 3 gadgets classiques sinon (Stake
    // tant qu'A2 n'est pas confirmée). La règle d'OFFICE MELTDOWN suit le catalogue (jamais impossible à remplir).
    const c = new Collection(new LocalCollectionStore(createBrowserStore()), buildCatalog(poc ? GADGETS : Object.values(CLASSIC_GADGETS)));
    await c.init();
    attachCollectionTracker(flow, c);
    // Mesures du PLAYTEST : seulement les manches jouées (jamais les outils DEV).
    c.onDiscovery((e) => {
      if (e.source !== 'dev') playtest.onDiscovery({ isNew: e.isNew, section: e.card.section }, c.progress);
    });
    collection = c;
  }

  // Boucle de rendu unique : le temps réel avance la séquence, puis Pixi dessine.
  // `capturePaused` : outils de capture (DEV) seulement ; l'image reste une fonction pure du temps de séquence.
  let last = performance.now();
  let capturePaused = false;
  const loop = (now: number) => {
    const dt = now - last;
    last = now;
    const t0 = performance.now();
    presenter.tick(capturePaused ? 0 : dt);
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
    collection,
    meta,
    poc: poc && pocPlaytest ? { altDisplay: new AltDisplaySetting(createBrowserStore()), playtest: pocPlaytest } : null,
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
          plans: poc,
          sceneStats: () => stage.stats(),
          ...options,
        }),
      perf: () => perf.snapshot(),
      /** Zones des plans à l'écran (tests e2e, captures). */
      planRects: () => stage.planRects(),
      /**
       * DEV (Mock) : la prochaine manche jouera `branchId` de `gadgetId` (triple imposé, plan choisi, branche imposée).
       * Le joueur (ou le test) n'a plus qu'à appuyer sur FIRE. null si impossible (mode classique, Stake, branche inconnue).
       */
      /** Contenu (DEV, captures) : gadgets et branches. */
      gadgets: () => GADGETS.map((g) => ({ id: g.id, level: g.rageLevel, label: g.label, branches: g.branches.map((b) => ({ id: b.id, label: b.label, rarity: b.rarity, bf: b.categories.includes('BF_ENTRY'), loss: b.classes.includes('MISS') })) })),
      forceBranch: (gadgetId: string, branchId: string, prefer?: ResultClass) => armBranch({ flow, presenter, mock }, gadgetId, branchId, prefer),
      stats: () => stage.stats(),
      stageInitMs: () => stageInitMs,
      /** Fin du préchargement des livres différés (depuis le début de l'initialisation de la scène). */
      artReadyMs: () => artReadyMs,
      /** Captures d'écran reproductibles (avant / après) : pause de la boucle et positionnement de la séquence. */
      capture: {
        pause: () => void (capturePaused = true),
        resume: () => void (capturePaused = false),
        seek: (t: number) => presenter.debugSeek(t),
      },
    },
  };
  // Livres d'art différés (FURIOUS, UNHINGED, plans B/C) : la scène s'affiche déjà ; la première manche (reprise
  // comprise) attend qu'ils soient là, pour qu'aucune séquence ne se joue avec un accessoire vide.
  // Un livre différé en échec ne bloque jamais le jeu (ses pièces restent vides, erreur visible dans la console).
  void stage.artReady
    .catch((e) => console.error('art différé :', e))
    .then(() => {
      artReadyMs = performance.now() - stageT0;
      return flow.start(params.replay);
    });
  return ctx;
}
