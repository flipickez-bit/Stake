/**
 * Particules ANALYTIQUES : la position d'une particule est une fonction pure de (graine, âge).
 * Pas d'intégration pas à pas, pas d'état : un seek, une reprise ou un replay donnent la même image.
 */
import { createRng } from '../domain/seed';
import type { VfxId } from './types';

export interface ParticlePreset {
  colors: readonly number[];
  speed: [number, number];
  /** Angle en degrés (0 = droite, -90 = haut). */
  angle: [number, number];
  gravity: number;
  life: [number, number];
  size: [number, number];
  spin: number;
  shape: 'rect' | 'circle';
}

export const PARTICLE_PRESETS: Record<VfxId, ParticlePreset> = {
  dust: { colors: [0xcfc6b8, 0xb8ad9c], speed: [40, 160], angle: [-170, -10], gravity: -30, life: [500, 900], size: [10, 22], spin: 0, shape: 'circle' },
  sparks: { colors: [0xffe066, 0xffb700, 0xffffff], speed: [250, 520], angle: [-180, 0], gravity: 900, life: [250, 500], size: [3, 6], spin: 0, shape: 'rect' },
  glass: { colors: [0xbfe9ff, 0xe8f8ff, 0x8fd3f5], speed: [200, 480], angle: [-160, -20], gravity: 1200, life: [600, 1000], size: [5, 12], spin: 12, shape: 'rect' },
  papers: { colors: [0xffffff, 0xf2f2f2, 0xfff5c0], speed: [120, 300], angle: [-150, -30], gravity: 260, life: [900, 1500], size: [10, 16], spin: 5, shape: 'rect' },
  confetti: { colors: [0xff2e4d, 0xffc400, 0x1e90ff, 0x31d67b, 0xb057ff], speed: [260, 560], angle: [-140, -40], gravity: 500, life: [1100, 1700], size: [6, 11], spin: 14, shape: 'rect' },
  smoke: { colors: [0x9a9a9a, 0xbdbdbd, 0x7a7a7a], speed: [20, 90], angle: [-120, -60], gravity: -60, life: [600, 1100], size: [18, 34], spin: 0, shape: 'circle' },
  flame: { colors: [0xff8a00, 0xffc400, 0xff2e4d], speed: [120, 260], angle: [60, 120], gravity: -200, life: [150, 320], size: [8, 16], spin: 0, shape: 'circle' },
  stars: { colors: [0xffe066, 0xffffff], speed: [0, 0], angle: [0, 0], gravity: 0, life: [1400, 1400], size: [8, 10], spin: 0, shape: 'rect' },
  gold: { colors: [0xffd700, 0xffe98a, 0xffb700], speed: [100, 420], angle: [-170, -10], gravity: 380, life: [900, 1600], size: [5, 10], spin: 10, shape: 'circle' },
  soot: { colors: [0x2b2b2b, 0x444444], speed: [30, 120], angle: [-180, 0], gravity: 60, life: [400, 700], size: [8, 16], spin: 0, shape: 'circle' },
};

export interface ParticleParams {
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: number;
  spin: number;
  /** Phase propre (orbite des étoiles). */
  phase: number;
}

export interface ParticleBurst {
  fx: VfxId;
  at: number;
  x: number;
  y: number;
  maxLife: number;
  shape: ParticlePreset['shape'];
  gravity: number;
  params: ParticleParams[];
}

export function prepareBurst(fx: VfxId, at: number, x: number, y: number, count: number, seed: number): ParticleBurst {
  const p = PARTICLE_PRESETS[fx];
  const rng = createRng(seed, `vfx:${fx}`);
  const params: ParticleParams[] = [];
  for (let i = 0; i < count; i++) {
    const speed = rng.range(p.speed[0], p.speed[1]);
    const angle = (rng.range(p.angle[0], p.angle[1]) * Math.PI) / 180;
    params.push({
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rng.range(p.life[0], p.life[1]),
      size: rng.range(p.size[0], p.size[1]),
      color: rng.pick(p.colors),
      spin: rng.range(-p.spin, p.spin),
      phase: rng.range(0, Math.PI * 2),
    });
  }
  return { fx, at, x, y, maxLife: p.life[1], shape: p.shape, gravity: p.gravity, params };
}

export interface ParticleState {
  x: number;
  y: number;
  size: number;
  rot: number;
  alpha: number;
  color: number;
  shape: ParticlePreset['shape'];
}

/** Écrit les particules vivantes à l'instant t dans `out` (réutilisé). Renvoie le nombre de particules vivantes. */
export function particlesAt(bursts: readonly ParticleBurst[], t: number, out: ParticleState[]): number {
  let n = 0;
  for (const b of bursts) {
    const age = t - b.at;
    if (age < 0 || age >= b.maxLife) continue;
    for (const p of b.params) {
      if (age >= p.life) continue;
      const s = age / 1000;
      let x: number;
      let y: number;
      if (b.fx === 'stars') {
        // Étoiles de l'étourdissement : orbite au-dessus de la tête.
        const a = p.phase + s * 6;
        x = b.x + Math.cos(a) * 34;
        y = b.y + Math.sin(a) * 9;
      } else {
        x = b.x + p.vx * s;
        y = b.y + p.vy * s + 0.5 * b.gravity * s * s;
      }
      const item = out[n] ?? (out[n] = { x: 0, y: 0, size: 0, rot: 0, alpha: 0, color: 0, shape: 'rect' });
      item.x = x;
      item.y = y;
      item.size = p.size;
      item.rot = p.spin * s;
      item.alpha = 1 - age / p.life;
      item.color = p.color;
      item.shape = b.shape;
      n++;
    }
  }
  return n;
}
