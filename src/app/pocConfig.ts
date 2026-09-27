/**
 * POC « 3 PLANS » (BAD BOSS — 3 GADGET POC) : activation et réglage DEV « ALTERNATIVE DISPLAY ».
 * MOCK / DEV UNIQUEMENT : jamais en mode Stake (architecture A2 non validée, INFORMATION STAKE ENGINE REQUISE Q21–Q29).
 */
import type { KeyValueStore } from '../platform/storage';

/**
 * PRIVATE : jamais d'alternatives (UX retenue pour le prototype).
 * ON_DEMAND : bouton « REVEAL OTHER PLANS », proposé après TOUTES les manches (jamais seulement après une perte).
 * REVEAL_ALL : A/B/C affichés automatiquement après chaque manche — EXPÉRIMENTAL, DEV seulement.
 */
export type AltDisplay = 'PRIVATE' | 'ON_DEMAND' | 'REVEAL_ALL';
export const ALT_DISPLAYS: readonly AltDisplay[] = ['PRIVATE', 'ON_DEMAND', 'REVEAL_ALL'];
export const ALT_LABEL: Record<AltDisplay, string> = { PRIVATE: 'PRIVATE', ON_DEMAND: 'ON-DEMAND', REVEAL_ALL: 'REVEAL ALL' };

const KEY = 'badboss.poc3.altdisplay.v1';

/** POC demandé : build de préversion (VITE_BADBOSS_POC=1) ou `?poc=3gadget`. Jamais avec le RGS Stake. */
export function pocRequested(href: string, buildFlag: string | undefined, platform: 'mock' | 'stake'): boolean {
  if (platform !== 'mock') return false;
  return buildFlag === '1' || new URL(href).searchParams.get('poc') === '3gadget';
}

export class AltDisplaySetting {
  private value: AltDisplay;
  private readonly listeners = new Set<(v: AltDisplay) => void>();

  constructor(private readonly store: KeyValueStore) {
    const saved = store.get<AltDisplay>(KEY);
    this.value = saved && ALT_DISPLAYS.includes(saved) ? saved : 'PRIVATE';
  }

  get current(): AltDisplay {
    return this.value;
  }

  set(v: AltDisplay): void {
    if (!ALT_DISPLAYS.includes(v) || v === this.value) return;
    this.value = v;
    this.store.set(KEY, v);
    for (const fn of this.listeners) fn(v);
  }

  subscribe(fn: (v: AltDisplay) => void): () => void {
    this.listeners.add(fn);
    fn(this.value);
    return () => this.listeners.delete(fn);
  }
}
