/**
 * Presenter : implémente RoundPresenter (le port attendu par GameFlow) au-dessus du SequencePlayer.
 * Il ne connaît ni Pixi ni WebAudio : il parle à un SceneSink et à un AudioSink.
 */
import { gadgetFor, restLayout } from '../content/gadgets';
import { LIBRARY } from '../content/library';
import type { Outcome } from '../domain/outcome';
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
  play(sound: SoundId, pitch: number): void;
  silence(ms: number): void;
}

export type PresenterMode = 'idle' | 'neutral' | 'waiting' | 'playing' | 'finished';

export interface BossFightStatus {
  active: boolean;
  rungs100: readonly number[];
  rung: number;
  blocked: boolean;
  ko: boolean;
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

const NO_BF: BossFightStatus = { active: false, rungs100: [], rung: -1, blocked: false, ko: false };

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

  constructor(
    private readonly scene: SceneSink,
    private readonly audio: AudioSink,
    private readonly options: PresenterOptions = {},
  ) {
    this.library = options.library ?? LIBRARY;
    this.player = new SequencePlayer({
      frame: (f) => this.scene.render(f),
      sound: (s, pitch) => this.audio.play(s, pitch),
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

  /** Appelé par la boucle de rendu (ou par les tests) avec le temps réel écoulé. */
  tick(wallMs: number): void {
    this.player.tick(Math.min(Math.max(0, wallMs), 250));
    if (this.mode === 'neutral' && this.player.isOpen && this.player.waitingMs > 0) this.mode = 'waiting';
  }

  beginNeutral(level: RageLevelId, speed: Speed): void {
    this.cancelPending();
    this.useGadget(gadgetFor(level));
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
    this.useGadget(gadgetFor(level));
    this.outcome = null;
    this.bf = NO_BF;
    this.player.load(idleSequence(this.gadget), restLayout(this.gadget), { open: true });
    this.mode = 'idle';
  }

  present(outcome: Outcome, options: PresentOptions): PresentationHandle {
    this.cancelPending();
    const gadget = gadgetFor(outcome.mode);
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

    const info: PresentationInfo = { branchId: seq.branchId, sequenceKey: seq.key, totalMs: seq.totalMs, gadgetId: gadget.id };
    return {
      info,
      reveal,
      done,
      skipToReveal: () => (this.token === token && this.mode === 'playing' ? this.player.skipToReveal() : false),
    };
  }

  private useGadget(gadget: GadgetDef): void {
    if (gadget !== this.gadget) this.gadget = gadget;
    this.scene.setGadget(gadget);
  }

  private cancelPending(): void {
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
        this.bf = { active: true, rungs100: this.outcome?.bossFight?.rungs100 ?? [], rung: -1, blocked: false, ko: false };
        break;
      case 'bfRung':
        this.bf = { ...this.bf, rung: value ?? this.bf.rung };
        break;
      case 'bfBlocked':
        this.bf = { ...this.bf, blocked: true };
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
