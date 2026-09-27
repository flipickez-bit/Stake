/**
 * BAD BOSS SOUND KIT — sons placeholders synthétisés en WebAudio (aucun fichier, aucun service payant).
 * - Déverrouillage au premier geste (politique des navigateurs mobiles).
 * - Bus de mixage (GDD_07 §8.3.2) : UI, SFX, IMPACT, VOICE, STINGER, MUSIC ; les stingers baissent la musique.
 * - Variantes DÉTERMINISTES (soundKit.variantOf : graine d'effets du book) : jamais Math.random().
 * - Musique NON permanente : ambiance du Rage Level, couche de tension, boucle du BOSS FIGHT, cue de gros gain.
 * - Les sons sont déclenchés au franchissement par le SequencePlayer (jamais pendant un seek).
 * Les vrais sons remplaceront ces synthèses avec les MÊMES identifiants (aucun cue, aucune durée ne change).
 */
import { mulberry32 } from '../domain/seed';
import type { RageLevelId } from '../domain/types';
import type { Signal, SoundId } from '../presentation/types';
import type { AudioSink } from '../presenter/Presenter';
import { SOUND_KIT, variantOf, type Bus } from './soundKit';

type Ctx = AudioContext;

export class AudioDirector implements AudioSink {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private buses: Partial<Record<Bus, GainNode>> = {};
  private ambience: GainNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private music: GainNode | null = null;
  private bfLoop: { stop: () => void } | null = null;
  private level: RageLevelId = 'grumpy';
  private noise: AudioBuffer | null = null;
  private mutedFlag = false;
  private duckUntil = 0;
  private dingVariant: 'default' | 'deluxe' = 'default';
  /** Nombre de sons joués (debug). */
  played = 0;

  get muted(): boolean {
    return this.mutedFlag;
  }

  get unlocked(): boolean {
    return this.ctx?.state === 'running';
  }

  /** À appeler dans un gestionnaire de geste utilisateur. */
  unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.mutedFlag ? 0 : 0.8;
      this.master.connect(ctx.destination);
      this.sfx = ctx.createGain();
      this.sfx.gain.value = 0.7;
      this.sfx.connect(this.master);
      // Bus : niveaux relatifs (placeholder ; cible finale −16 LUFS intégrés, crêtes ≤ −1 dBTP).
      const levels: Record<Bus, number> = { ui: 0.55, sfx: 0.85, impact: 1, voice: 0.9, stinger: 1, music: 0.5 };
      for (const [bus, gain] of Object.entries(levels) as [Bus, number][]) {
        const g = ctx.createGain();
        g.gain.value = gain;
        g.connect(this.sfx);
        this.buses[bus] = g;
      }
      this.music = this.buses.music ?? null;
      this.noise = this.makeNoise(ctx);
      this.startAmbience(ctx);
      this.setLevel(this.level);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.mutedFlag = muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.02);
  }

  silence(ms: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.ambience) return;
    const now = ctx.currentTime;
    this.duckUntil = Math.max(this.duckUntil, now + ms / 1000);
    this.ambience.gain.cancelScheduledValues(now);
    this.ambience.gain.setTargetAtTime(0, now, 0.03);
    this.ambience.gain.setTargetAtTime(0.05, this.duckUntil, 0.15);
  }

  /** Cosmétique (COLLECTION BOOK) : timbre de la sonnerie. Aucun effet sur la séquence. */
  setDingVariant(variant: 'default' | 'deluxe'): void {
    this.dingVariant = variant;
  }

  /**
   * Ambiance du Rage Level (GRUMPY : clim calme ; FURIOUS : ronronnement plus serré ; UNHINGED : grave instable).
   * Rendu seulement : aucun effet sur la manche.
   */
  setLevel(level: RageLevelId): void {
    this.level = level;
    const ctx = this.ctx;
    if (!ctx || !this.ambienceFilter) return;
    const f = level === 'grumpy' ? 220 : level === 'furious' ? 320 : 180;
    this.ambienceFilter.frequency.setTargetAtTime(f, ctx.currentTime, 0.3);
  }

  /** Musique non permanente pilotée par les signaux de séquence : boucle du BOSS FIGHT (de l'arène au reveal). */
  onSignal(signal: Signal): void {
    if (signal === 'bfStart') this.startBossFightLoop();
    if (signal === 'reveal' || signal === 'end' || signal === 'bfKo') this.stopBossFightLoop();
  }

  play(sound: SoundId, pitch = 1, seed?: number): void {
    const ctx = this.ctx;
    const spec = SOUND_KIT[sound];
    const bus = spec ? this.buses[spec.bus] : undefined;
    if (!ctx || !bus || ctx.state !== 'running') return;
    this.played++;
    this.out = bus;
    const v = variantOf(sound, seed);
    const t = ctx.currentTime + 0.005;
    const p = pitch * v.pitch;
    const L = v.length;
    // Priorité : un stinger baisse brièvement la musique et l'ambiance (les gains passent devant).
    if (spec.bus === 'stinger') this.duckMusic(0.35);
    switch (sound) {
      case 'ding':
        if (this.dingVariant === 'deluxe') {
          // Cosmétique « DING-DONG DELUXE » (COLLECTION BOOK) : même instant, même durée, deux tons.
          this.tone(t, 'sine', 1318 * p, 1318 * p, 0.45, 0.32);
          this.tone(t + 0.22, 'sine', 1046 * p, 1046 * p, 0.7, 0.3);
        } else {
          this.tone(t, 'sine', 1318 * p, 1318 * p, 0.9, 0.35);
          this.tone(t, 'sine', 2637 * p, 2637 * p, 0.6, 0.12);
        }
        break;
      case 'elevator': this.tone(t, 'sine', 880 * p, 880 * p, 0.35, 0.15); break;
      case 'twang': this.tone(t, 'sawtooth', 140 * p, 70 * p, 0.45, 0.25, 900); break;
      case 'whoosh': this.noiseBurst(t, 0.3, 0.25, 'bandpass', 500 * p, 2400 * p); break;
      case 'thud': this.tone(t, 'sine', 110 * p, 40 * p, 0.28, 0.55); this.noiseBurst(t, 0.06, 0.2, 'lowpass', 900, 400); break;
      case 'crash': this.noiseBurst(t, 0.7, 0.5, 'lowpass', 3000, 300); this.tone(t, 'sine', 90, 35, 0.4, 0.6); break;
      case 'tink': this.tone(t, 'triangle', 2100 * p, 2000 * p, 0.12, 0.25); break;
      case 'glass': for (const f of [2400, 3100, 3700, 4500]) this.tone(t + f / 90000, 'sine', f * p, f * p, 0.35, 0.08); this.noiseBurst(t, 0.3, 0.2, 'highpass', 3000, 5000); break;
      case 'pfft': this.noiseBurst(t, 0.28, 0.3, 'bandpass', 900 * p, 500 * p); break;
      case 'roar': this.noiseBurst(t, 0.9, 0.45, 'lowpass', 500, 250); this.tone(t, 'sawtooth', 60, 80, 0.9, 0.15, 400); break;
      case 'fuse': this.noiseBurst(t, 0.35, 0.12, 'highpass', 4000, 6000, true); break;
      case 'clunk': this.tone(t, 'square', 140 * p, 90 * p, 0.12, 0.2, 800); this.noiseBurst(t, 0.05, 0.2, 'lowpass', 1500, 800); break;
      case 'plop': this.tone(t, 'sine', 650 * p, 180 * p, 0.14, 0.4); break;
      case 'hmpf': this.noiseBurst(t, 0.2, 0.25, 'bandpass', 320 * p, 260 * p); this.tone(t, 'sine', 150 * p, 120 * p, 0.2, 0.2); break;
      case 'laugh': for (let i = 0; i < 4; i++) this.tone(t + i * 0.11, 'sawtooth', (300 - i * 18) * p, (260 - i * 18) * p, 0.09, 0.14, 1400); break;
      case 'wahwah': [233, 220, 207, 185].forEach((f, i) => this.tone(t + i * 0.24, 'sawtooth', f, f * 0.98, i === 3 ? 0.6 : 0.22, 0.13, 700)); break;
      case 'boing': this.tone(t, 'sine', 180 * p, 520 * p, 0.12, 0.35); this.tone(t + 0.12, 'sine', 520 * p, 200 * p, 0.25, 0.3); break;
      case 'clang': for (const f of [523, 1330, 2090]) this.tone(t, 'square', f * p, f * p, 0.5, 0.06, 5000); break;
      case 'crack': this.noiseBurst(t, 0.06, 0.4, 'highpass', 1500, 1500); break;
      case 'gold': [1046, 1318, 1568, 2093].forEach((f, i) => this.tone(t + i * 0.07, 'sine', f, f, 0.4, 0.18)); break;
      case 'deflate': this.tone(t, 'sawtooth', 420 * p, 70 * p, 0.55, 0.15, 1200); break;
      case 'giantRoar': this.noiseBurst(t, 1.1, 0.5, 'lowpass', 400, 150); this.tone(t, 'sawtooth', 55, 45, 1.1, 0.25, 300); break;
      case 'cheer': this.noiseBurst(t, 0.9, 0.2, 'bandpass', 1400, 2600); [1500, 1800].forEach((f, i) => this.tone(t + 0.1 + i * 0.2, 'sine', f, f * 1.3, 0.2, 0.08)); break;
      case 'fall': this.tone(t, 'sine', 1600 * p, 300 * p, 0.85, 0.16); break;
      case 'click': this.tone(t, 'square', 1200 * p, 900 * p, 0.03, 0.15, 3000); break;
      case 'creak': this.tone(t, 'sawtooth', 95 * p, 120 * p, 0.35, 0.12, 600, 18); break;
      case 'screech': this.tone(t, 'sawtooth', 1300 * p, 1000 * p, 0.4, 0.08, 3000, 30); break;
      case 'sip': this.noiseBurst(t, 0.32, 0.22, 'bandpass', 500 * p, 1700 * p, true); this.tone(t + 0.22, 'sine', 700 * p, 300 * p, 0.1, 0.12); break;
      case 'spin': this.tone(t, 'sawtooth', 180 * p, 260 * p, 0.6, 0.1, 900, 22); break;
      case 'spray': this.noiseBurst(t, 0.75, 0.3, 'highpass', 2500, 4000); break;
      case 'coo': [0, 0.2].forEach((d) => this.tone(t + d, 'sine', 380 * p, 460 * p, 0.17, 0.2, undefined, 12)); break;
      case 'bonk': this.tone(t, 'sine', 330 * p, 120 * p, 0.14, 0.45); this.noiseBurst(t, 0.04, 0.25, 'lowpass', 2000, 900); break;
      // Phase 0.6 : repères de synchronisation (provisoires, remplacés par les vrais sons sans toucher au contenu).
      case 'stretch': this.tone(t, 'sawtooth', 70 * p, 150 * p, 0.5, 0.1, 500, 9); break;
      case 'snap': this.noiseBurst(t, 0.05, 0.45, 'highpass', 2500, 1800); this.tone(t, 'square', 900 * p, 300 * p, 0.05, 0.12, 4000); break;
      case 'clink': [2900, 4100].forEach((f, i) => this.tone(t + i * 0.012, 'triangle', f * p, f * p * 0.98, 0.18, 0.12)); break;
      case 'paper': this.noiseBurst(t, 0.22, 0.14, 'bandpass', 3000 * p, 1800 * p, true); break;
      case 'debris': for (let i = 0; i < 3 + v.index % 3; i++) this.noiseBurst(t + i * 0.045 * L, 0.06, 0.2, 'bandpass', (1600 - i * 250) * p, 700, false); break;
      // ---- PRODUCTION (SOUND KIT) ----
      /** Carillon d'ascenseur : deux notes graves et courtes. Ce n'est PAS le DING de gain (x0,5 et pertes compris). */
      case 'bell': this.tone(t, 'triangle', 659, 659, 0.3, 0.16); this.tone(t + 0.16, 'triangle', 523, 523, 0.45, 0.14); break;
      /** Couche LOW d'un impact : lisible sur un haut-parleur de téléphone grâce au « thump » médium qui la double. */
      case 'boom': this.tone(t, 'sine', 70 * p, 32 * p, 0.7 * L, 0.6); this.tone(t, 'triangle', 180 * p, 90 * p, 0.12, 0.25); break;
      case 'thump': this.tone(t, 'triangle', 160 * p, 70 * p, 0.14 * L, 0.45); this.noiseBurst(t, 0.05, 0.18, 'lowpass', 1200, 500); break;
      case 'room': this.noiseBurst(t, 0.5 * L, 0.07, 'lowpass', 900 * p, 250); break;
      case 'rumble': this.noiseBurst(t, 0.9 * L, 0.3, 'lowpass', 260 * p, 90); this.tone(t, 'sine', 48 * p, 38 * p, 0.9 * L, 0.25); break;
      case 'rattle': for (let i = 0; i < 6; i++) this.tone(t + i * 0.035, 'square', (420 + (i % 2) * 90) * p, 380 * p, 0.03, 0.08, 2500); break;
      case 'squeak': this.tone(t, 'sine', 1400 * p, 2100 * p, 0.09 * L, 0.12, undefined, 40); break;
      case 'honk': this.tone(t, 'sawtooth', 330 * p, 300 * p, 0.18 * L, 0.18, 1400); this.tone(t, 'square', 165 * p, 150 * p, 0.18 * L, 0.08, 900); break;
      case 'slide': this.noiseBurst(t, 0.28 * L, 0.2, 'bandpass', 700 * p, 1400 * p); this.tone(t, 'sawtooth', 90 * p, 70 * p, 0.25 * L, 0.06, 500); break;
      case 'crank': for (let i = 0; i < 4; i++) this.tone(t + i * 0.07, 'square', 260 * p, 240 * p, 0.03, 0.12, 1800); break;
      case 'whirr': this.tone(t, 'sawtooth', 110 * p, 190 * p, 0.8 * L, 0.08, 700, 14); this.noiseBurst(t, 0.8 * L, 0.1, 'bandpass', 600 * p, 1200 * p); break;
      case 'gust': this.noiseBurst(t, 0.7 * L, 0.28, 'bandpass', 300 * p, 1600 * p); break;
      case 'gulp': this.tone(t, 'sine', 300 * p, 140 * p, 0.12, 0.35); this.tone(t + 0.1, 'sine', 260 * p, 120 * p, 0.12, 0.25); break;
      case 'splash': this.noiseBurst(t, 0.45 * L, 0.35, 'bandpass', 2200 * p, 700); this.tone(t, 'sine', 500 * p, 160 * p, 0.2, 0.2); break;
      case 'roll': this.noiseBurst(t, 0.8 * L, 0.18, 'lowpass', 400 * p, 250 * p, true); break;
      case 'strike': this.noiseBurst(t, 0.25, 0.4, 'bandpass', 1800 * p, 900); for (const f of [700, 950, 1250]) this.tone(t, 'triangle', f * p, f * p * 0.9, 0.2, 0.08); break;
      case 'chain': for (let i = 0; i < 5; i++) this.tone(t + i * 0.05, 'triangle', (2600 - i * 180) * p, 2300 * p, 0.05, 0.07); break;
      /** SUSPENSE : pulsation grave (deux battements), jamais un son de résultat. */
      case 'tension': [0, 0.42].forEach((d) => this.tone(t + d, 'sine', 62 * p, 58 * p, 0.35, 0.3)); this.tone(t, 'sawtooth', 124 * p, 118 * p, 0.8, 0.05, 400); break;
      /** BIG WIN : cuivres montants (réservé aux gains BIG et plus, joué par la bibliothèque d'impact). */
      case 'brass': [392, 494, 587, 784].forEach((f, i) => this.tone(t + i * 0.09, 'sawtooth', f * p, f * p, i === 3 ? 0.7 : 0.18, 0.12, 2400)); break;
    }
  }

  private out: AudioNode | null = null;

  private duckMusic(seconds: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.music) return;
    const now = ctx.currentTime;
    this.music.gain.cancelScheduledValues(now);
    this.music.gain.setTargetAtTime(0.2, now, 0.02);
    this.music.gain.setTargetAtTime(0.5, now + seconds, 0.2);
  }

  /** Boucle du BOSS FIGHT : ostinato de basse synthétisé, planifié tant que le combat dure. */
  private startBossFightLoop(): void {
    const ctx = this.ctx;
    const bus = this.buses.music;
    if (!ctx || !bus || this.bfLoop || ctx.state !== 'running') return;
    const notes = [55, 55, 82.4, 55, 73.4, 55, 82.4, 98];
    const beat = 0.19;
    let step = 0;
    let next = ctx.currentTime + 0.05;
    let stopped = false;
    const schedule = () => {
      if (stopped || !this.ctx) return;
      while (next < this.ctx.currentTime + 0.4) {
        const f = notes[step % notes.length] ?? 55;
        this.out = bus;
        this.tone(next, 'sawtooth', f, f, beat * 0.9, 0.16, 600);
        if (step % 4 === 0) this.noiseBurst(next, 0.08, 0.14, 'lowpass', 180, 60);
        step++;
        next += beat;
      }
      timer = setTimeout(schedule, 120);
    };
    let timer: ReturnType<typeof setTimeout> = setTimeout(schedule, 0);
    this.bfLoop = { stop: () => { stopped = true; clearTimeout(timer); } };
  }

  private stopBossFightLoop(): void {
    this.bfLoop?.stop();
    this.bfLoop = null;
  }

  private tone(t: number, type: OscillatorType, f0: number, f1: number, dur: number, gain: number, lowpass?: number, vibrato?: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = osc;
    if (lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lowpass;
      osc.connect(f);
      node = f;
    }
    if (vibrato) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = vibrato;
      depth.gain.value = f0 * 0.08;
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + dur);
    }
    node.connect(g).connect(this.out ?? this.sfx!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noiseBurst(t: number, dur: number, gain: number, type: BiquadFilterType, f0: number, f1: number, crackle = false): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(f0, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    if (crackle) for (let i = 1; i < 8; i++) g.gain.setValueAtTime(i % 2 ? gain * 0.2 : gain, t + (dur * i) / 8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(this.out ?? this.sfx!);
    src.start(t, 0, dur + 0.05);
  }

  private makeNoise(ctx: Ctx): AudioBuffer {
    // Bruit généré par un PRNG déterministe (pas de Math.random).
    const rnd = mulberry32(0xbadb055);
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = rnd() * 2 - 1;
    return buf;
  }

  private startAmbience(ctx: Ctx): void {
    // Ronronnement de bureau (clim, néons) : bruit brun très discret.
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 220;
    this.ambienceFilter = f;
    this.ambience = ctx.createGain();
    this.ambience.gain.value = 0.05;
    src.connect(f).connect(this.ambience).connect(this.master!);
    src.start();
  }
}
