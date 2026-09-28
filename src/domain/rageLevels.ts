/**
 * Lecture de config/rage_levels.json : SOURCE DE VÉRITÉ UNIQUE (partagée avec le calculateur Python).
 * Aucune valeur mathématique n'est recopiée dans le code.
 */
import raw from '../../config/rage_levels.json';
import type { RageLevelId } from './types';

export interface RageLevelInfo {
  id: RageLevelId;
  label: string;
  volatility: string;
  maxWin: number;
  /** Multiplicateurs de base (hors x0), dans l'ordre du fichier. */
  baseMultipliers: number[];
  /** Parts de RTP ('balance' = ligne d'équilibre). */
  baseRows: { multiplier: number; rtpShare: number | 'balance' }[];
  /** BOSS FIGHT = tours gratuits dans la même manche (règles : `free_rounds_doc` de config/rage_levels.json). */
  freeRounds: FreeRoundsConfig;
}

export interface FreeRoundsConfig {
  /** Nombre de tours gratuits (8). */
  rounds: number;
  /** Probabilité qu'un tour soit un HIT (sinon BLOCKED, 0). */
  pHit: number;
  /** Rage du premier tour (x1) et hausse après chaque HIT (+1). */
  rageStart: number;
  rageStep: number;
  /** Bases d'un HIT (multiplicateurs) et leurs poids entiers. */
  bases: { multiplier: number; weight: number }[];
}

export function parseFraction(text: string): number {
  const parts = text.split('/');
  if (parts.length === 2) return Number(parts[0]) / Number(parts[1]);
  return Number(text);
}

/** RTP cible (affichage des règles uniquement). PROVISOIRE : validation Stake Engine requise. */
export const TARGET_RTP: number = parseFraction(raw.target_rtp);
export const TARGET_RTP_STATUS: string = raw.target_rtp_status;
export const BOSS_FIGHT_FREQUENCY: number = parseFraction(raw.boss_fight_frequency);

export const RAGE_LEVELS: readonly RageLevelInfo[] = raw.rage_levels.map((lv) => ({
  id: lv.id as RageLevelId,
  label: lv.label,
  volatility: lv.volatility,
  maxWin: lv.max_win,
  baseMultipliers: lv.base.map((r) => Number(r.multiplier)),
  baseRows: lv.base.map((r) => ({
    multiplier: Number(r.multiplier),
    rtpShare: r.rtp_share === 'balance' ? ('balance' as const) : Number(r.rtp_share),
  })),
  freeRounds: {
    rounds: lv.boss_fight.free_rounds,
    pHit: parseFraction(lv.boss_fight.p_hit),
    rageStart: lv.boss_fight.rage_start,
    rageStep: lv.boss_fight.rage_step,
    bases: lv.boss_fight.hit_bases.map((b) => ({ multiplier: Number(b.multiplier), weight: b.weight })),
  },
}));

/** Rage d'un tour gratuit (index 0) sachant le nombre de HIT déjà joués. */
export function rageAt(fr: FreeRoundsConfig, hitsBefore: number): number {
  return fr.rageStart + fr.rageStep * hitsBefore;
}

export function getRageLevel(id: RageLevelId): RageLevelInfo {
  const level = RAGE_LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`Rage Level inconnu : ${id}`);
  return level;
}
