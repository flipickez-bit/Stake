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

/** Couleurs : palette de l'ART BIBLE (teinte appliquée aux textures claires ; les autres gardent leurs couleurs). */
export const PARTICLE_PRESETS: Record<VfxId, ParticlePreset> = {
  dust: { colors: [0xfff8ee, 0xe9dcca, 0xd9c3a0], speed: [40, 170], angle: [-170, -10], gravity: -40, life: [500, 900], size: [22, 42], spin: 0.6, shape: 'circle' },
  sparks: { colors: [0xffe9a0, 0xffc21f, 0xfff8ee], speed: [250, 520], angle: [-180, 0], gravity: 900, life: [250, 500], size: [10, 18], spin: 6, shape: 'rect' },
  glass: { colors: [0xcdefff, 0xfff8ee, 0x8fd0ff], speed: [200, 480], angle: [-160, -20], gravity: 1200, life: [600, 1000], size: [10, 18], spin: 12, shape: 'rect' },
  papers: { colors: [0xfff8ee, 0xfff8ee, 0xffe36e], speed: [120, 300], angle: [-150, -30], gravity: 260, life: [900, 1500], size: [16, 24], spin: 5, shape: 'rect' },
  confetti: { colors: [0xe23b3b, 0xffc21f, 0x2f3f73, 0x52b45c, 0x8a5fc7], speed: [260, 560], angle: [-140, -40], gravity: 500, life: [1100, 1700], size: [9, 14], spin: 14, shape: 'rect' },
  smoke: { colors: [0x8e8494, 0xc8bfcb, 0xa69bc4], speed: [20, 90], angle: [-120, -60], gravity: -60, life: [600, 1100], size: [30, 56], spin: 0.5, shape: 'circle' },
  flame: { colors: [0xff8a3d, 0xffc21f, 0xe23b3b], speed: [120, 260], angle: [60, 120], gravity: -200, life: [150, 320], size: [14, 24], spin: 0, shape: 'circle' },
  stars: { colors: [0xffc21f, 0xfff8ee], speed: [0, 0], angle: [0, 0], gravity: 0, life: [1400, 1400], size: [18, 22], spin: 2, shape: 'rect' },
  gold: { colors: [0xffd23f, 0xfff1a8, 0xc9981a], speed: [100, 420], angle: [-170, -10], gravity: 380, life: [900, 1600], size: [10, 18], spin: 10, shape: 'circle' },
  soot: { colors: [0x2a1b2f, 0x5c4760], speed: [30, 120], angle: [-180, 0], gravity: 60, life: [400, 700], size: [16, 30], spin: 0.5, shape: 'circle' },
  foam: { colors: [0xfff8ee, 0xddf3ff, 0xcdefff], speed: [140, 380], angle: [-200, -100], gravity: 260, life: [700, 1200], size: [14, 26], spin: 0, shape: 'circle' },
  feathers: { colors: [0xa69bc4, 0xc9c1e0, 0xfff8ee], speed: [40, 160], angle: [-170, -10], gravity: 90, life: [900, 1500], size: [14, 22], spin: 6, shape: 'rect' },
  hair: { colors: [0x3a2150, 0x5e3a7e], speed: [60, 200], angle: [-160, -20], gravity: 420, life: [500, 900], size: [10, 16], spin: 10, shape: 'rect' },
  /** Phase 0.6 : éclat d'impact (1 particule immobile, très brève). */
  burst: { colors: [0xfff8ee], speed: [0, 0], angle: [0, 0], gravity: 0, life: [110, 110], size: [150, 170], spin: 0, shape: 'rect' },
  debris: { colors: [0xa2603a, 0xb4bdc9, 0x7c4526], speed: [180, 420], angle: [-160, -20], gravity: 1100, life: [600, 900], size: [12, 20], spin: 12, shape: 'rect' },
  leaves: { colors: [0x52b45c, 0x8ed66a, 0x2f8745], speed: [60, 200], angle: [-160, -20], gravity: 160, life: [900, 1400], size: [14, 20], spin: 7, shape: 'rect' },
  /** POC « 3 PLANS » : vapeur de l'ESPRESSO BLASTER, éclaboussure de café. */
  steam: { colors: [0xfff8ee, 0xddf3ff, 0xe9dccb], speed: [20, 80], angle: [-115, -65], gravity: -90, life: [500, 950], size: [18, 36], spin: 0.3, shape: 'circle' },
  coffee: { colors: [0x6b3a1e, 0x7c4526, 0xe9dccb], speed: [160, 380], angle: [-170, -10], gravity: 950, life: [380, 700], size: [9, 17], spin: 0, shape: 'circle' },
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
  fx: VfxId;
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
      const item = out[n] ?? (out[n] = { fx: b.fx, x: 0, y: 0, size: 0, rot: 0, alpha: 0, color: 0, shape: 'rect' });
      item.fx = b.fx;
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
