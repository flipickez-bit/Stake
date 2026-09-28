/**
 * POC « 3 PLANS » — maths EXPÉRIMENTALES A2 du MockRGS (jamais les maths de production).
 *
 * Modèle IND_BFC_v1 (docs/ETUDE_CHOIX_3_GADGETS.md §2.6) :
 * - avec la probabilité du BOSS FIGHT (1/400), la manche est un BOSS FIGHT COMMUN : les trois plans portent les
 *   mêmes tours gratuits (même déroulé, même total) ;
 * - sinon, trois tirages INDÉPENDANTS dans la table de base du niveau (BOSS FIGHT exclu, renormalisée).
 * Chaque position a donc exactement la distribution actuelle du Rage Level : RTP identique pour A, B et C,
 * quelle que soit la stratégie du joueur (preuve : étude §2.2).
 *
 * RÈGLE ANTI « FAUX WHAT IF » : `drawTriple` ne reçoit PAS le plan choisi. Le triple est entièrement tiré (ordre de
 * consommation du hasard fixe : A, B, C) avant que `bookForPick` ne sélectionne la composante payée.
 * Aucune entrée ne dépend de l'historique, des pertes, de la collection ni du gadget préféré.
 */
import type { Book, BookEvent, BossFightEvent, TripleEvent, TripleResultEvent } from '../../../domain/book';
import { PLAN_SLOTS, TRIPLE_MODEL, type PlanSlot } from '../../../domain/plans';
import { BOSS_FIGHT_FREQUENCY } from '../../../domain/rageLevels';
import { classify } from '../../../domain/resultClass';
import type { RageLevelId, Script } from '../../../domain/types';
import { bossFightEventFor, distributionTable, freeRoundsTotal100, pickRarityFor, pickScriptFor, randomSeedFor, scriptAllowed, type ForcedFreeRounds, type RandomSource } from './mockMath';

export interface Triple {
  level: RageLevelId;
  event: TripleEvent;
  /** Déroulé du BOSS FIGHT commun (null hors BOSS FIGHT). */
  bossFight: BossFightEvent | null;
}

/** DEV PANEL (MockRGS seulement) : triple imposé pour tester l'affichage des plans. */
export type ForcedTriple =
  /** `scripts` (facultatif) : catégorie de mise en scène imposée par plan (captures, tests), sinon tirée. */
  | { kind: 'multipliers'; multipliers: [number, number, number]; scripts?: (Script | null)[] }
  /** BOSS FIGHT commun : `hits` HIT sur les 8 tours gratuits (base facultative), ou déroulé tiré si `hits` absent. */
  | ({ kind: 'bossFight' } & Partial<ForcedFreeRounds>);

interface BaseRow {
  multiplier100: number;
  p: number;
}

const baseCache = new Map<RageLevelId, { rows: BaseRow[]; bfShare: number }>();

/** Table de base renormalisée (BOSS FIGHT exclu) et part du BOSS FIGHT. */
export function baseTable(level: RageLevelId): { rows: BaseRow[]; bfShare: number } {
  const cached = baseCache.get(level);
  if (cached) return cached;
  const all = distributionTable(level);
  const bfShare = all.filter((r) => r.bossFight).reduce((s, r) => s + r.p, 0);
  const rows = all.filter((r) => !r.bossFight).map((r) => ({ multiplier100: r.multiplier100, p: r.p / (1 - bfShare) }));
  const out = { rows, bfShare };
  baseCache.set(level, out);
  return out;
}

function drawRow<T extends { p: number }>(rows: readonly T[], rnd: RandomSource): T {
  let u = rnd() * rows.reduce((s, r) => s + r.p, 0);
  for (const r of rows) {
    u -= r.p;
    if (u < 0) return r;
  }
  return rows[rows.length - 1]!;
}

function result(slot: PlanSlot, gadgetId: string, multiplier100: number, bossFight: boolean, rnd: RandomSource, forcedScript?: Script | null): TripleResultEvent {
  // Ordre de tirage fixe (script, rareté, graine) pour chaque position ; un script imposé (DEV) ne décale rien.
  const cls = classify(multiplier100);
  const drawn = bossFight ? 'BF_ENTRY' : pickScriptFor(cls, rnd);
  // Script imposé (DEV) ignoré s'il est incompatible avec la classe : le book resterait illisible.
  const script = bossFight ? 'BF_ENTRY' : forcedScript && scriptAllowed(cls, forcedScript) ? forcedScript : drawn;
  return { slot, gadgetId, multiplier100, script, rarity: pickRarityFor(rnd), seed: randomSeedFor(rnd) };
}

/** Tire le triple complet d'une manche. Le plan choisi n'est PAS un paramètre. */
export function drawTriple(level: RageLevelId, gadgets: readonly [string, string, string], rnd: RandomSource, forced?: ForcedTriple | null): Triple {
  let multipliers: [number, number, number] = [0, 0, 0];
  let bossFight: BossFightEvent | null = null;
  if (forced) {
    if (forced.kind === 'bossFight') {
      bossFight = bossFightEventFor(level, rnd, forced.hits !== undefined ? { hits: forced.hits, base: forced.base } : null);
    } else {
      multipliers = forced.multipliers.map((m) => Math.round(m * 100)) as [number, number, number];
      const allowed = new Set(baseTable(level).rows.map((r) => r.multiplier100));
      for (const m of multipliers) if (!allowed.has(m)) throw new Error(`x${m / 100} n'existe pas en ${level}`);
    }
  } else if (rnd() < BOSS_FIGHT_FREQUENCY) {
    // Les tours gratuits sont tirés AVANT les présentations : un seul déroulé, commun aux trois plans.
    bossFight = bossFightEventFor(level, rnd);
  }
  if (bossFight) {
    const m = freeRoundsTotal100(bossFight);
    multipliers = [m, m, m];
  } else if (!forced) {
    const { rows } = baseTable(level);
    multipliers = [drawRow(rows, rnd).multiplier100, drawRow(rows, rnd).multiplier100, drawRow(rows, rnd).multiplier100];
  }
  const scripts = forced?.kind === 'multipliers' ? forced.scripts : undefined;
  const results = PLAN_SLOTS.map((slot, i) => result(slot, gadgets[i] ?? '', multipliers[i] ?? 0, bossFight !== null, rnd, scripts?.[i]));
  return { level, event: { type: 'triple', level, model: TRIPLE_MODEL, bossFight: bossFight !== null, results }, bossFight };
}

/**
 * Book du mode choisi (architecture A2) : même triple quel que soit le plan ; seuls `payoutMultiplier`,
 * l'événement `pick`, la présentation jouée (celle déjà écrite dans le triple) et `finalWin` changent.
 */
export function bookForPick(triple: Triple, slot: PlanSlot, id: number): Book {
  const chosen = triple.event.results[PLAN_SLOTS.indexOf(slot)]!;
  const events: BookEvent[] = [
    structuredClone(triple.event),
    { type: 'pick', slot },
    { type: 'presentation', script: chosen.script, rarity: chosen.rarity, seed: chosen.seed },
  ];
  if (triple.bossFight) events.push(structuredClone(triple.bossFight));
  events.push({ type: 'finalWin', amount: chosen.multiplier100 });
  return { id, payoutMultiplier: chosen.multiplier100, events };
}

/** Espérance exacte d'une position (contrôle des tests : identique pour A, B, C par construction). */
export function expectedMultiplier(level: RageLevelId): number {
  return distributionTable(level).reduce((s, r) => s + (r.multiplier100 / 100) * r.p, 0);
}
