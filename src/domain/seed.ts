/**
 * PRNG déterministe pour la présentation cosmétique.
 * La graine vient du book (événement `presentation`). Elle ne touche JAMAIS aux mathématiques :
 * multiplicateur, gain/perte, bonus, palier et payout sont lus dans le book AVANT tout usage de la graine.
 * Chaque usage a son propre flux nommé, pour que l'ajout d'un effet ne décale pas les autres.
 */

/** Hash FNV-1a 32 bits d'une chaîne. */
export function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 : générateur 32 bits rapide et reproductible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  /** Réel uniforme dans [0, 1). */
  next(): number;
  /** Entier uniforme dans [0, n). */
  int(n: number): number;
  /** Réel uniforme dans [min, max). */
  range(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
}

export function createRng(seed: number, stream: string): Rng {
  const next = mulberry32((seed ^ hash32(stream)) >>> 0);
  return {
    next,
    int: (n) => Math.floor(next() * n),
    range: (min, max) => min + (max - min) * next(),
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error('pick() sur une liste vide');
      return items[Math.floor(next() * items.length)] as T;
    },
  };
}

/** Bruit lisse 1D déterministe (secousses de caméra) : fonction pure de (seed, t). */
export function smoothNoise(seed: number, t: number): number {
  const i = Math.floor(t);
  const f = t - i;
  const a = mulberry32((seed + Math.imul(i, 374761393)) >>> 0)() * 2 - 1;
  const b = mulberry32((seed + Math.imul(i + 1, 374761393)) >>> 0)() * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}
