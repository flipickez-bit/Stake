export const EASES = {
  linear: (p: number) => p,
  inQuad: (p: number) => p * p,
  outQuad: (p: number) => 1 - (1 - p) * (1 - p),
  inOutQuad: (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2),
  inCubic: (p: number) => p * p * p,
  outCubic: (p: number) => 1 - (1 - p) ** 3,
  inBack: (p: number) => 2.70158 * p * p * p - 1.70158 * p * p,
  outBack: (p: number) => 1 + 2.70158 * (p - 1) ** 3 + 1.70158 * (p - 1) ** 2,
  outElastic: (p: number) =>
    p === 0 || p === 1 ? p : 2 ** (-10 * p) * Math.sin(((p * 10 - 0.75) * (2 * Math.PI)) / 3) + 1,
  outBounce: (p: number) => {
    const n = 7.5625;
    const d = 2.75;
    if (p < 1 / d) return n * p * p;
    if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75;
    if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375;
    return n * (p -= 2.625 / d) * p + 0.984375;
  },
} as const;

export type EaseName = keyof typeof EASES;
