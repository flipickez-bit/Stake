/** Mesures de performance (DEV PANEL, boucle ×N). Aucune dépendance au rendu. */
export interface PerfSnapshot {
  fps: number;
  minFps: number;
  frameMs: number;
  maxFrameMs: number;
  p95FrameMs: number;
  samples: number;
}

export class PerfMeter {
  private readonly dts: number[] = [];
  private readonly cpu: number[] = [];
  private recording: { dts: number[]; cpu: number[]; maxParticles: number } | null = null;

  constructor(private readonly window = 120) {}

  /** dt : intervalle entre deux images ; cpuMs : temps passé dans la mise à jour + le rendu. */
  frame(dt: number, cpuMs: number, particles: number): void {
    this.dts.push(dt);
    this.cpu.push(cpuMs);
    if (this.dts.length > this.window) this.dts.shift();
    if (this.cpu.length > this.window) this.cpu.shift();
    if (this.recording) {
      this.recording.dts.push(dt);
      this.recording.cpu.push(cpuMs);
      this.recording.maxParticles = Math.max(this.recording.maxParticles, particles);
    }
  }

  snapshot(): PerfSnapshot {
    return summarize(this.dts, this.cpu);
  }

  startRecording(): void {
    this.recording = { dts: [], cpu: [], maxParticles: 0 };
  }

  stopRecording(): (PerfSnapshot & { maxParticles: number }) | null {
    const r = this.recording;
    this.recording = null;
    return r ? { ...summarize(r.dts, r.cpu), maxParticles: r.maxParticles } : null;
  }
}

function summarize(dts: number[], cpu: number[]): PerfSnapshot {
  if (dts.length === 0) return { fps: 0, minFps: 0, frameMs: 0, maxFrameMs: 0, p95FrameMs: 0, samples: 0 };
  const avgDt = dts.reduce((a, b) => a + b, 0) / dts.length;
  const sorted = [...dts].sort((a, b) => a - b);
  const p99dt = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99))] ?? avgDt;
  const cpuSorted = [...cpu].sort((a, b) => a - b);
  return {
    fps: 1000 / avgDt,
    minFps: 1000 / p99dt,
    frameMs: cpu.reduce((a, b) => a + b, 0) / Math.max(1, cpu.length),
    maxFrameMs: cpuSorted[cpuSorted.length - 1] ?? 0,
    p95FrameMs: cpuSorted[Math.min(cpuSorted.length - 1, Math.floor(cpuSorted.length * 0.95))] ?? 0,
    samples: dts.length,
  };
}
