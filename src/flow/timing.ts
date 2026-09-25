import { RgsError } from '../platform/rgs/RgsPort';

export interface Clock {
  now(): number;
  delay(ms: number): Promise<void>;
}

export const realClock: Clock = {
  now: () => performance.now(),
  delay: (ms) => new Promise((r) => setTimeout(r, ms)),
};

/** Rejette avec RgsError('timeout') si la promesse n'aboutit pas à temps. L'état serveur est alors INCONNU. */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new RgsError('timeout', `${label} : aucune réponse après ${ms} ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** Attend une promesse de présentation sans jamais bloquer le flux d'argent si l'animation plante. */
export async function waitPresentation(p: Promise<void>, ms: number): Promise<'ok' | 'timeout'> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const guard = new Promise<'timeout'>((r) => (timer = setTimeout(() => r('timeout'), ms)));
  const res = await Promise.race([p.then(() => 'ok' as const, () => 'ok' as const), guard]);
  clearTimeout(timer);
  return res;
}
