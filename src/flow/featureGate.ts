/**
 * FeatureGate : SEUL module qui interprète `jurisdiction`. L'UI ne construit que ce qui est autorisé
 * (une fonctionnalité interdite n'est pas proposée, pas seulement grisée).
 * Clé absente → valeur la plus restrictive. Sémantique exacte : INFORMATION STAKE ENGINE REQUISE.
 */
import type { JurisdictionConfig } from '../platform/rgs/RgsPort';
import type { Speed } from '../domain/types';

export interface Capabilities {
  turbo: boolean;
  superTurbo: boolean;
  autoplay: boolean;
  /** Skip / slamstop : capacité SÉPARÉE de la vitesse. */
  slamstop: boolean;
  spacebar: boolean;
  fullscreen: boolean;
  buyFeature: boolean;
  displayRtp: boolean;
  displayNetPosition: boolean;
  displaySessionTimer: boolean;
  socialCasino: boolean;
  minRoundDurationMs: number;
}

export const RESTRICTIVE_CAPABILITIES: Capabilities = {
  turbo: false,
  superTurbo: false,
  autoplay: false,
  slamstop: false,
  spacebar: false,
  fullscreen: false,
  buyFeature: false,
  displayRtp: true,
  displayNetPosition: true,
  displaySessionTimer: true,
  socialCasino: false,
  minRoundDurationMs: 0,
};

/**
 * Unité de minimumRoundDuration NON CONFIRMÉE (INFORMATION STAKE ENGINE REQUISE).
 * Garde provisoire : ≤ 60 → secondes, sinon millisecondes. BLOQUANT pour la production : à remplacer
 * par le contrat officiel.
 */
export function minRoundDurationMs(value: number | undefined): number {
  if (!value || value <= 0 || !Number.isFinite(value)) return 0;
  return value <= 60 ? Math.round(value * 1000) : Math.round(value);
}

export function capabilitiesFrom(j: JurisdictionConfig | null | undefined): Capabilities {
  if (!j) return { ...RESTRICTIVE_CAPABILITIES };
  const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
  const turbo = !bool(j.disabledTurbo, true);
  return {
    turbo,
    superTurbo: turbo && !bool(j.disabledSuperTurbo, true),
    autoplay: !bool(j.disabledAutoplay, true),
    slamstop: !bool(j.disabledSlamstop, true),
    spacebar: !bool(j.disabledSpacebar, true),
    fullscreen: !bool(j.disabledFullscreen, true),
    buyFeature: !bool(j.disabledBuyFeature, true),
    displayRtp: bool(j.displayRTP, true),
    displayNetPosition: bool(j.displayNetPosition, true),
    displaySessionTimer: bool(j.displaySessionTimer, true),
    socialCasino: bool(j.socialCasino, false),
    minRoundDurationMs: minRoundDurationMs(j.minimumRoundDuration),
  };
}

export function allowedSpeeds(c: Capabilities): Speed[] {
  const speeds: Speed[] = ['normal'];
  if (c.turbo) speeds.push('turbo');
  if (c.superTurbo) speeds.push('super');
  return speeds;
}
