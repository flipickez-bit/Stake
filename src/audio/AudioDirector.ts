/**
 * Sons placeholders synthétisés en WebAudio (aucun fichier audio en Phase 0).
 * - Déverrouillage au premier geste (politique des navigateurs mobiles).
 * - Ambiance de bureau discrète, coupée pendant les silences dramatiques (ducking).
 * - Les sons sont déclenchés au franchissement par le SequencePlayer (jamais pendant un seek).
 * Howler n'est pas nécessaire tant qu'il n'y a pas de fichiers : il viendra avec les vrais sons.
 */
import { mulberry32 } from '../domain/seed';
import type { SoundId } from '../presentation/types';
import type { AudioSink } from '../presenter/Presenter';

type Ctx = AudioContext;

export class AudioDirector implements AudioSink {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private ambience: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private mutedFlag = false;
  private duckUntil = 0;
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
      this.noise = this.makeNoise(ctx);
      this.startAmbience(ctx);
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

  play(sound: SoundId, pitch = 1): void {
    const ctx = this.ctx;
    const out = this.sfx;
    if (!ctx || !out || ctx.state !== 'running') return;
    this.played++;
    const t = ctx.currentTime + 0.005;
    const p = pitch;
    switch (sound) {
      case 'ding': this.tone(t, 'sine', 1318 * p, 1318 * p, 0.9, 0.35); this.tone(t, 'sine', 2637 * p, 2637 * p, 0.6, 0.12); break;
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
    }
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
    node.connect(g).connect(this.sfx!);
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
    src.connect(filter).connect(g).connect(this.sfx!);
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
    this.ambience = ctx.createGain();
    this.ambience.gain.value = 0.05;
    src.connect(f).connect(this.ambience).connect(this.master!);
    src.start();
  }
}
