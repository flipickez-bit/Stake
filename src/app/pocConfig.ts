/**
 * POC « 3 PLANS » (BAD BOSS — 3 GADGET POC) : activation et réglage DEV « ALTERNATIVE DISPLAY ».
 * MOCK / DEV UNIQUEMENT : jamais en mode Stake (architecture A2 non validée, INFORMATION STAKE ENGINE REQUISE Q21–Q29).
 */
import type { KeyValueStore } from '../platform/storage';

/**
 * ON_DEMAND : bouton « REVEAL OTHER PLANS », proposé après TOUTES les manches (jamais seulement après une perte).
 *   P3.1 : c'est l'expérience PRINCIPALE, et la valeur par défaut.
 * PRIVATE : jamais d'alternatives (réglage DEV, et variante de l'étude A/B du POC).
 * REVEAL_ALL : A/B/C affichés automatiquement après chaque manche — EXPÉRIMENTAL, DEV seulement.
 */
export type AltDisplay = 'PRIVATE' | 'ON_DEMAND' | 'REVEAL_ALL';
export const ALT_DISPLAYS: readonly AltDisplay[] = ['PRIVATE', 'ON_DEMAND', 'REVEAL_ALL'];
export const ALT_LABEL: Record<AltDisplay, string> = { PRIVATE: 'PRIVATE', ON_DEMAND: 'ON-DEMAND', REVEAL_ALL: 'REVEAL ALL' };

/**
 * v2 (P3.1) : la valeur par défaut passe de PRIVATE à ON_DEMAND. Une ancienne valeur PRIVATE (v1), laissée par le POC ou
 * un réglage DEV, n'est PAS reprise : c'était la cause réelle de « on ne voit pas les autres plans ».
 */
const KEY = 'badboss.altdisplay.v2';
export const DEFAULT_ALT_DISPLAY: AltDisplay = 'ON_DEMAND';

/** POC demandé : build de préversion (VITE_BADBOSS_POC=1) ou `?poc=3gadget`. Jamais avec le RGS Stake. */
export function pocRequested(href: string, buildFlag: string | undefined, platform: 'mock' | 'stake'): boolean {
  if (platform !== 'mock') return false;
  return buildFlag === '1' || new URL(href).searchParams.get('poc') === '3gadget';
}

/**
 * PRODUCTION 3 GADGETS : choix A/B/C activé par défaut avec le Mock RGS (architecture A2 isolée derrière RgsPort).
 * JAMAIS avec le RGS Stake tant que Stake n'a pas répondu (INFORMATION STAKE ENGINE REQUISE, Q21–Q29) : le jeu y
 * reste en mode CLASSIQUE (un gadget par Rage Level). `?plans=off` rejoue le mode classique avec le Mock.
 */
export function plansRequested(href: string, platform: 'mock' | 'stake'): boolean {
  if (platform !== 'mock') return false;
  return new URL(href).searchParams.get('plans') !== 'off';
}

export class AltDisplaySetting {
  private value: AltDisplay;
  private readonly listeners = new Set<(v: AltDisplay) => void>();

  constructor(private readonly store: KeyValueStore) {
    const saved = store.get<AltDisplay>(KEY);
    this.value = saved && ALT_DISPLAYS.includes(saved) ? saved : DEFAULT_ALT_DISPLAY;
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
