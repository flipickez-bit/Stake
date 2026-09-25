/**
 * SequencePlayer : fait avancer le temps de séquence et déclenche les événements au franchissement.
 * Il ne dessine rien et ne sait rien de Pixi, de Spine ni de l'audio : il parle à des « sinks ».
 *
 * - L'image est TOUJOURS evaluate(timeline, t) : aucune accumulation d'état visuel.
 * - Hit stop (freeze) : le temps de séquence s'arrête pendant `wallMs` de temps réel.
 * - Attente (séquence « ouverte ») : à D1, sans résultat, le temps s'arrête ; les poses continuent de vivre.
 * - seek / skipToReveal : les signaux franchis sont émis (une seule fois), les sons ne sont pas joués.
 */
import { buildTimeline, createFrame, evaluate, type FrameState, type Timeline } from './timeline';
import type { ActorId, ActorRest, AnimationSequence, GadgetDef, ScheduledCue, Signal, SoundId } from './types';

export interface PlayerSinks {
  frame(frame: FrameState): void;
  sound(sound: SoundId, pitch: number): void;
  silence(ms: number): void;
  signal(signal: Signal, value: number | undefined, t: number): void;
}

export class SequencePlayer {
  private tl: Timeline | null = null;
  private readonly frameState = createFrame();
  private t = 0;
  /** Tous les événements d'indice < nextEvent ont été traités. */
  private nextEvent = 0;
  private freezeLeft = 0;
  private open = false;
  private holdOffset = 0;
  private holdSound: GadgetDef['hold'] | null = null;
  private nextHoldSound = 0;
  private finished = false;

  constructor(private readonly sinks: PlayerSinks) {}

  get time(): number {
    return this.t;
  }

  get sequence(): AnimationSequence | null {
    return this.tl?.seq ?? null;
  }

  get isOpen(): boolean {
    return this.open;
  }

  get isFinished(): boolean {
    return this.finished;
  }

  get waitingMs(): number {
    return this.holdOffset;
  }

  get lastFrame(): FrameState {
    return this.frameState;
  }

  /**
   * Charge une séquence et se place à t = startAt.
   * `open` : le résultat n'est pas encore connu (tronc neutre) ; le temps s'arrêtera à D1.
   */
  load(seq: AnimationSequence, rest: Record<ActorId, ActorRest>, options: { open?: boolean; hold?: GadgetDef['hold']; startAt?: number } = {}): void {
    this.tl = buildTimeline(seq, rest);
    this.open = options.open ?? false;
    this.holdSound = options.hold ?? null;
    this.holdOffset = 0;
    this.nextHoldSound = 0;
    this.freezeLeft = 0;
    this.finished = false;
    this.t = 0;
    this.nextEvent = 0;
    const startAt = options.startAt ?? 0;
    if (startAt > 0) this.seek(startAt);
    else this.render();
  }

  /**
   * Remplace le tronc ouvert par la séquence complète (même tronc, donc aucune rupture visuelle)
   * et reprend au temps courant. Les événements déjà traités ne sont pas rejoués.
   */
  extend(full: AnimationSequence, rest: Record<ActorId, ActorRest>): void {
    const processed = this.tl ? this.tl.events.slice(0, this.nextEvent) : [];
    this.tl = buildTimeline(full, rest);
    this.open = false;
    const events = this.tl.events;
    // Le tronc est un préfixe exact de la séquence complète : on garde la position de lecture.
    let i = 0;
    while (i < processed.length && i < events.length && sameEvent(processed[i] as ScheduledCue, events[i] as ScheduledCue)) i++;
    if (i < processed.length) {
      // Repli (tronc compilé autrement) : tout ce qui est strictement passé est considéré comme traité.
      i = 0;
      while (i < events.length && (events[i] as ScheduledCue).at < this.t) i++;
    }
    this.nextEvent = i;
    this.render();
  }

  /** Avance de `wallMs` millisecondes de temps réel. */
  tick(wallMs: number): void {
    if (!this.tl || this.finished) return;
    let dt = wallMs;
    while (dt > 0 && !this.finished && this.tl) {
      if (this.freezeLeft > 0) {
        const used = Math.min(this.freezeLeft, dt);
        this.freezeLeft -= used;
        dt -= used;
        continue;
      }
      const d1 = this.tl.seq.markers.d1;
      let target = this.t + dt;
      let overflow = 0;
      if (this.open && target > d1) {
        overflow = target - Math.max(this.t, d1);
        target = Math.max(this.t, d1);
      }
      const frozeAt = this.advanceTo(target, true);
      if (frozeAt !== null) {
        // Gel (hit stop) : on consomme le temps jusqu'au gel, puis le gel lui-même au tour suivant.
        dt -= Math.max(0, frozeAt - this.t);
        this.t = frozeAt;
        continue;
      }
      this.t = target;
      dt = 0;
      if (overflow > 0) this.hold(overflow);
    }
    this.render();
  }

  private hold(ms: number): void {
    // Attente du résultat : le temps s'arrête à D1, les poses continuent de vivre (holdOffset).
    this.holdOffset += ms;
    if (!this.holdSound) return;
    while (this.nextHoldSound <= this.holdOffset) {
      this.sinks.sound(this.holdSound.sound, 1);
      this.nextHoldSound += this.holdSound.everyMs;
    }
  }

  /** Se place à `target` sans jouer les sons intermédiaires. Les signaux franchis sont émis. */
  seek(target: number): void {
    if (!this.tl) return;
    const end = this.tl.seq.markers.end;
    const clamped = Math.min(Math.max(0, target), end);
    const events = this.tl.events;
    while (this.nextEvent < events.length && (events[this.nextEvent] as ScheduledCue).at < clamped) {
      const ev = events[this.nextEvent] as ScheduledCue;
      this.nextEvent++;
      if (ev.kind === 'signal') this.emitSignal(ev);
    }
    this.freezeLeft = 0;
    this.t = clamped;
    // Les événements exactement à `clamped` sont joués normalement (le DING du reveal, par exemple).
    this.advanceTo(clamped, true);
    this.freezeLeft = 0;
    this.render();
  }

  /** Saute au reveal (ou à la fin si le reveal est passé). false si impossible (séquence ouverte ou finie). */
  skipToReveal(): boolean {
    if (!this.tl || this.open || this.finished) return false;
    const { reveal, end } = this.tl.seq.markers;
    this.seek(this.t < reveal ? reveal : end);
    return true;
  }

  stop(): void {
    this.tl = null;
    this.open = false;
    this.finished = true;
  }

  /** Traite les événements jusqu'à `target` inclus. Renvoie le temps d'un gel rencontré, sinon null. */
  private advanceTo(target: number, audible: boolean): number | null {
    const tl = this.tl;
    if (!tl) return null;
    const events = tl.events;
    while (this.nextEvent < events.length && (events[this.nextEvent] as ScheduledCue).at <= target) {
      const ev = events[this.nextEvent] as ScheduledCue;
      this.nextEvent++;
      switch (ev.kind) {
        case 'sound':
          if (audible) this.sinks.sound(ev.sound, ev.pitch ?? 1);
          break;
        case 'silence':
          if (audible) this.sinks.silence(ev.ms);
          break;
        case 'signal':
          this.emitSignal(ev);
          break;
        case 'freeze':
          if (audible && ev.wallMs > 0) {
            this.freezeLeft = ev.wallMs;
            return ev.at;
          }
          break;
        default:
          break;
      }
      if (this.finished) return null;
    }
    return null;
  }

  private emitSignal(ev: Extract<ScheduledCue, { kind: 'signal' }>): void {
    if (ev.signal === 'end') this.finished = true;
    this.sinks.signal(ev.signal, ev.value, ev.at);
  }

  private render(): void {
    if (!this.tl) return;
    const hold = this.holdOffset > 0 ? { at: this.tl.seq.markers.d1, offset: this.holdOffset } : null;
    this.sinks.frame(evaluate(this.tl, this.t, this.frameState, hold));
  }
}

function sameEvent(a: ScheduledCue, b: ScheduledCue): boolean {
  return a.kind === b.kind && a.at === b.at && a.seg === b.seg;
}
