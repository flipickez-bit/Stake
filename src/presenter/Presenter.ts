/**
 * Presenter : implémente RoundPresenter (le port attendu par GameFlow) au-dessus du SequencePlayer.
 * Il ne connaît ni Pixi ni WebAudio : il parle à un SceneSink et à un AudioSink.
 */
import { gadgetById, gadgetFor, gadgetForPlan, pickerGadget, restLayout } from '../content/gadgets';
import { LIBRARY } from '../content/library';
import type { Outcome } from '../domain/outcome';
import type { PlanSlot } from '../domain/plans';
import type { RageLevelId, Speed } from '../domain/types';
import type { PresentationHandle, PresentationInfo, PresentOptions, RoundPresenter } from '../flow/presenterPort';
import { compileSequence, compileTrunk, type ContentLibrary } from '../presentation/compileSequence';
import { SequencePlayer } from '../presentation/SequencePlayer';
import type { FrameState } from '../presentation/timeline';
import type { AnimationSequence, GadgetDef, Signal, SoundId } from '../presentation/types';

export interface SceneSink {
  /** Affiche les accessoires du gadget actif (les autres sont masqués). */
  setGadget(gadget: GadgetDef): void;
  render(frame: FrameState): void;
}

export interface AudioSink {
  /** `seed` : variante déterministe (graine d'effets de la séquence). Absente : variante de base. */
  play(sound: SoundId, pitch: number, seed?: number): void;
  silence(ms: number): void;
}

export type PresenterMode = 'idle' | 'neutral' | 'waiting' | 'playing' | 'finished';

/** HUD du BOSS FIGHT (tours gratuits), mis à jour par les signaux de la séquence : jamais en avance sur l'image. */
export interface BossFightStatus {
  active: boolean;
  /** Tours gratuits accordés (8). */
  freeRounds: number;
  /** Tour en cours (1 à 8) ; 0 avant le premier. */
  round: number;
  /** Rage du tour en cours (x1, puis +1 après chaque HIT). */
  rage: number;
  /** Cumul des gains déjà touchés (entier ×100). */
  total100: number;
  /** Issue du dernier tour résolu. */
  last: 'HIT' | 'BLOCKED' | null;
  /** Gain du dernier HIT (entier ×100). */
  lastWin100: number;
  ko: boolean;
  wincap: boolean;
}

export interface PresenterStatus {
  mode: PresenterMode;
  gadgetId: string;
  branchId: string | null;
  sequenceKey: string | null;
  speed: Speed;
  t: number;
  totalMs: number;
  reveal: number | null;
  waitingMs: number;
  particles: number;
  seed: number | null;
  reaction: string | null;
  cooCameo: boolean;
  bossFight: BossFightStatus;
}

export const NO_BF: BossFightStatus = { active: false, freeRounds: 0, round: 0, rage: 1, total100: 0, last: null, lastWin100: 0, ko: false, wincap: false };

/** Séquence de repos : aucun cue, le temps reste à 0, les poses vivent (attente sans fin). */
function idleSequence(gadget: GadgetDef): AnimationSequence {
  return {
    key: `idle-${gadget.id}`,
    gadgetId: gadget.id,
    branchId: 'IDLE',
    speed: 'normal',
    totalMs: 0,
    markers: { d1: 0, reveal: Number.POSITIVE_INFINITY, end: Number.POSITIVE_INFINITY },
    cues: [],
    segments: [],
    reaction: null,
    cooCameo: false,
  };
}

/** Repli si le contenu est incomplet : une manche n'est JAMAIS bloquée (GDD_04 §5.2.3). */
function fallbackSequence(gadget: GadgetDef, outcome: Outcome, speed: Speed): AnimationSequence {
  return {
    key: `fallback-${outcome.roundId}`,
    gadgetId: gadget.id,
    branchId: 'FALLBACK',
    speed,
    totalMs: 600,
    markers: { d1: 0, reveal: 0, end: 600 },
    cues: [
      { kind: 'signal', at: 0, signal: 'reveal', seg: 0 },
      { kind: 'sound', at: 0, sound: 'ding', seg: 0 },
      { kind: 'signal', at: 600, signal: 'end', seg: -1 },
    ],
    segments: [{ id: 'FALLBACK', phase: 'impact', start: 0, ms: 600 }],
    reaction: null,
    cooCameo: false,
  };
}

interface Pending {
  token: number;
  resolveReveal: () => void;
  resolveDone: () => void;
  revealed: boolean;
}

export interface PresenterOptions {
  library?: ContentLibrary;
  /** POC « 3 PLANS » : au repos, les trois plans du niveau sont présents dans le décor (choix). */
  plans?: boolean;
  /** Signalé en cas de repli de contenu (DEV PANEL). */
  onContentError?: (error: unknown) => void;
}

export class Presenter implements RoundPresenter {
  private readonly player: SequencePlayer;
  private readonly library: ContentLibrary;
  private gadget: GadgetDef;
  private mode: PresenterMode = 'idle';
  private speed: Speed = 'normal';
  private outcome: Outcome | null = null;
  private pending: Pending | null = null;
  private token = 0;
  private bf: BossFightStatus = NO_BF;
  private readonly listeners = new Set<(signal: Signal, value: number | undefined) => void>();
  /** DEV : branche imposée pour la prochaine présentation compatible. */
  forceBranchId: string | null = null;
  /** SPECIAL EPISODE en cours (COLLECTION BOOK) : résolu à la fin du tableau ou s'il est interrompu. */
  private showcaseDone: (() => void) | null = null;

  constructor(
    private readonly scene: SceneSink,
    private readonly audio: AudioSink,
    private readonly options: PresenterOptions = {},
  ) {
    this.library = options.library ?? LIBRARY;
    this.player = new SequencePlayer({
      frame: (f) => this.scene.render(f),
      sound: (s, pitch, seed) => this.audio.play(s, pitch, seed),
      silence: (ms) => this.audio.silence(ms),
      signal: (s, v) => this.onSignal(s, v),
    });
    this.gadget = gadgetFor('grumpy');
    this.toIdle('grumpy');
  }

  get status(): PresenterStatus {
    const seq = this.player.sequence;
    const real = seq && seq.branchId !== 'IDLE' && seq.branchId !== 'TRUNK';
    return {
      mode: this.mode,
      gadgetId: this.gadget.id,
      branchId: real ? seq.branchId : null,
      sequenceKey: real ? seq.key : null,
      speed: this.speed,
      t: this.mode === 'idle' ? 0 : this.player.time,
      totalMs: seq && Number.isFinite(seq.totalMs) ? seq.totalMs : 0,
      reveal: real && Number.isFinite(seq.markers.reveal) ? seq.markers.reveal : null,
      waitingMs: this.mode === 'idle' ? 0 : this.player.waitingMs,
      particles: this.player.lastFrame.particleCount,
      seed: this.outcome?.seed ?? null,
      reaction: real ? seq.reaction : null,
      cooCameo: real ? seq.cooCameo : false,
      bossFight: this.bf,
    };
  }

  get frame(): FrameState {
    return this.player.lastFrame;
  }

  /** Écoute des signaux de séquence (échelle du BOSS FIGHT, reveal…). */
  onSignalEvent(fn: (signal: Signal, value: number | undefined) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Outils de capture (DEV) : place la séquence courante à l'instant t (même image qu'en lecture normale). */
  debugSeek(t: number): void {
    this.player.seek(t);
  }

  /** Appelé par la boucle de rendu (ou par les tests) avec le temps réel écoulé. */
  tick(wallMs: number): void {
    this.player.tick(Math.min(Math.max(0, wallMs), 250));
    if (this.mode === 'neutral' && this.player.isOpen && this.player.waitingMs > 0) this.mode = 'waiting';
  }

  beginNeutral(level: RageLevelId, speed: Speed, plan?: PlanSlot | null): void {
    this.cancelPending();
    // POC « 3 PLANS » : le tronc neutre est celui du gadget CHOISI (le choix précède toujours le tir).
    this.useGadget(gadgetForPlan(level, plan));
    this.speed = speed;
    this.outcome = null;
    this.bf = NO_BF;
    this.player.load(compileTrunk(this.gadget, speed, this.library), restLayout(this.gadget), { open: true, hold: this.gadget.hold });
    this.mode = 'neutral';
  }

  abortNeutral(): void {
    if (this.mode === 'neutral' || this.mode === 'waiting') this.toIdle(this.gadget.rageLevel);
  }

  toIdle(level: RageLevelId): void {
    this.cancelPending();
    this.useGadget((this.options.plans ? pickerGadget(level) : null) ?? gadgetFor(level));
    this.outcome = null;
    this.bf = NO_BF;
    this.player.load(idleSequence(this.gadget), restLayout(this.gadget), { open: true });
    this.mode = 'idle';
  }

  present(outcome: Outcome, options: PresentOptions): PresentationHandle {
    this.cancelPending();
    // POC « 3 PLANS » : SEUL le gadget du plan payé est joué (jamais une alternative).
    const gadget = outcome.plans ? (gadgetById(outcome.plans.selectedGadget) ?? gadgetForPlan(outcome.mode, outcome.plans.selected)) : gadgetFor(outcome.mode);
    let seq: AnimationSequence;
    try {
      const force = this.forceBranchId ?? undefined;
      seq = compileSequence(outcome, gadget, options.speed, this.library, { forceBranchId: force });
    } catch (e) {
      this.options.onContentError?.(e);
      seq = fallbackSequence(gadget, outcome, options.speed);
    }
    const continuing = options.mode === 'play' && (this.mode === 'neutral' || this.mode === 'waiting') && this.gadget.id === gadget.id && this.speed === options.speed;
    this.useGadget(gadget);
    this.outcome = outcome;
    this.speed = options.speed;
    this.bf = NO_BF;
    this.mode = 'playing';

    const token = ++this.token;
    let resolveReveal!: () => void;
    let resolveDone!: () => void;
    const reveal = new Promise<void>((r) => (resolveReveal = r));
    const done = new Promise<void>((r) => (resolveDone = r));
    this.pending = { token, resolveReveal, resolveDone, revealed: false };

    if (continuing) this.player.extend(seq, restLayout(gadget));
    else this.player.load(seq, restLayout(gadget));
    // Récapitulatif (manche déjà réglée par le serveur) : on montre directement le résultat.
    if (options.mode === 'recap') this.player.seek(seq.markers.reveal);

    const variant = `${seq.branchId}${seq.reaction ? `/${seq.reaction}` : ''}${seq.cooCameo ? '/COO' : ''}`;
    const info: PresentationInfo = { branchId: seq.branchId, sequenceKey: seq.key, totalMs: seq.totalMs, gadgetId: gadget.id, variant };
    return {
      info,
      reveal,
      done,
      skipToReveal: () => (this.token === token && this.mode === 'playing' ? this.player.skipToReveal() : false),
    };
  }

  /**
   * SPECIAL EPISODE (COLLECTION BOOK) : joue un tableau hors manche, depuis READY.
   * GameFlow n'est pas impliqué : aucun book, aucune mise, aucun reveal. L'appelant revient ensuite au repos (toIdle).
   */
  playShowcase(stage: GadgetDef, seq: AnimationSequence): Promise<void> {
    this.cancelPending();
    this.useGadget(stage);
    this.outcome = null;
    this.bf = NO_BF;
    this.speed = 'normal';
    this.player.load(seq, restLayout(stage));
    this.mode = 'playing';
    return new Promise((resolve) => (this.showcaseDone = resolve));
  }

  private useGadget(gadget: GadgetDef): void {
    if (gadget !== this.gadget) this.gadget = gadget;
    this.scene.setGadget(gadget);
  }

  private cancelPending(): void {
    const done = this.showcaseDone;
    this.showcaseDone = null;
    done?.();
    const p = this.pending;
    this.pending = null;
    if (p) {
      // Une présentation interrompue ne bloque jamais GameFlow.
      p.resolveReveal();
      p.resolveDone();
    }
  }

  private onSignal(signal: Signal, value: number | undefined): void {
    const p = this.pending;
    switch (signal) {
      case 'bfStart':
        this.bf = { ...NO_BF, active: true, freeRounds: this.outcome?.bossFight?.freeRounds ?? 0 };
        break;
      case 'frRound': {
        // Un nouveau tour commence : compteur et rage de CE tour (issue encore inconnue à l'écran).
        const r = this.outcome?.bossFight?.rounds[value ?? -1];
        if (r) this.bf = { ...this.bf, round: (value ?? 0) + 1, rage: r.rage, last: null };
        break;
      }
      case 'frHit': {
        const r = this.outcome?.bossFight?.rounds[value ?? -1];
        const capped = this.outcome?.bossFight?.wincap === true && r?.total100 === this.outcome?.payoutMultiplier100;
        if (r) this.bf = { ...this.bf, total100: r.total100, last: 'HIT', lastWin100: r.win100, wincap: capped };
        break;
      }
      case 'bfBlocked':
        this.bf = { ...this.bf, last: 'BLOCKED', lastWin100: 0 };
        break;
      case 'bfKo':
        this.bf = { ...this.bf, ko: true };
        break;
      case 'reveal':
        if (p && !p.revealed) {
          p.revealed = true;
          p.resolveReveal();
        }
        break;
      case 'end':
        this.mode = 'finished';
        if (this.showcaseDone) {
          const done = this.showcaseDone;
          this.showcaseDone = null;
          done();
        }
        if (p) {
          if (!p.revealed) p.resolveReveal();
          p.resolveDone();
          this.pending = null;
        }
        break;
      default:
        break;
    }
    for (const fn of this.listeners) fn(signal, value);
  }
}
