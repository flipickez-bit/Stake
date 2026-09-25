import type { ResultClass } from './types';

/**
 * Classe de résultat à partir du multiplicateur entier ×100 (format Stake : 1150 = x11,5).
 * Seuils : x1 (100), x5 (500), x25 (2500), x100 (10000). GDD_02 §3.5.
 */
export function classify(multiplier100: number): ResultClass {
  if (multiplier100 <= 0) return 'MISS';
  if (multiplier100 < 100) return 'SCRAPE';
  if (multiplier100 < 500) return 'HIT';
  if (multiplier100 < 2500) return 'BIG';
  if (multiplier100 < 10000) return 'MEGA';
  return 'LEGENDARY';
}

export function isWinClass(c: ResultClass): boolean {
  return c === 'HIT' || c === 'BIG' || c === 'MEGA' || c === 'LEGENDARY';
}

export function formatMultiplier(multiplier100: number): string {
  const value = multiplier100 / 100;
  return `x${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}`;
}
