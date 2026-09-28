/**
 * « Serveur mathématique » du MockRGS (phase 0). Représente ce que feront les books Stake Engine :
 * il tire un résultat selon la distribution de config/rage_levels.json et écrit les événements du book.
 * Ce module n'est PAS de la présentation : il peut utiliser un RNG non déterministe (comme le RGS réel).
 *
 * BOSS FIGHT = TOURS GRATUITS dans la MÊME manche (modèle des free spins Stake Engine : un book, un Play, un
 * payoutMultiplier). Tout le déroulé (HIT/BLOCKED, base, rage, gain de chaque tour) est écrit ici, jamais par le client.
 */
import policy from '../../../../config/presentation_policy.json';
import type { Book, BookEvent, BossFightEvent, FreeRoundEvent } from '../../../domain/book';
import { getRageLevel, rageAt, BOSS_FIGHT_FREQUENCY, TARGET_RTP } from '../../../domain/rageLevels';
import { classify } from '../../../domain/resultClass';
import type { RageLevelId, Rarity, ResultClass, Script } from '../../../domain/types';

export type RandomSource = () => number;

export const cryptoRandom: RandomSource = () => {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return (buf[0] ?? 0) / 4294967296;
};

interface Row {
  multiplier100: number;
  p: number;
  /** Ligne du BOSS FIGHT (un total possible des tours gratuits). */
  bossFight: boolean;
}

const bfCache = new Map<RageLevelId, Map<number, number>>();

/**
 * Distribution du TOTAL des tours gratuits (entier ×100 → probabilité), par récurrence sur (rage, total, au moins un HIT).
 * Flottants : suffisant pour un mock ; la version exacte (fractions) est dans math/model/bad_boss_math.py.
 */
export function freeRoundsDistribution(levelId: RageLevelId): Map<number, number> {
  const cached = bfCache.get(levelId);
  if (cached) return cached;
  const level = getRageLevel(levelId);
  const fr = level.freeRounds;
  const cap = level.maxWin * 100;
  const wSum = fr.bases.reduce((s, b) => s + b.weight, 0);
  type Key = string;
  let states = new Map<Key, { hits: number; total: number; p: number }>([['0|0', { hits: 0, total: 0, p: 1 }]]);
  const ended = new Map<number, number>();
  const add = (m: Map<Key, { hits: number; total: number; p: number }>, hits: number, total: number, p: number) => {
    const k = `${hits}|${total}`;
    const cur = m.get(k);
    if (cur) cur.p += p;
    else m.set(k, { hits, total, p });
  };
  for (let k = 0; k < fr.rounds; k++) {
    const next = new Map<Key, { hits: number; total: number; p: number }>();
    for (const s of states.values()) {
      const pHit = k === fr.rounds - 1 && s.hits === 0 ? 1 : fr.pHit;
      if (pHit < 1) add(next, s.hits, s.total, s.p * (1 - pHit));
      const rage = rageAt(fr, s.hits);
      for (const b of fr.bases) {
        const p = s.p * pHit * (b.weight / wSum);
        const total = s.total + Math.round(b.multiplier * 100) * rage;
        if (total >= cap) ended.set(cap, (ended.get(cap) ?? 0) + p);
        else add(next, s.hits + 1, total, p);
      }
    }
    states = next;
  }
  for (const s of states.values()) ended.set(s.total, (ended.get(s.total) ?? 0) + s.p);
  const out = new Map([...ended.entries()].sort((a, b) => a[0] - b[0]));
  bfCache.set(levelId, out);
  return out;
}

/** Espérance d'un BOSS FIGHT (en mises). */
export function freeRoundsExpectation(levelId: RageLevelId): number {
  let e = 0;
  for (const [m100, p] of freeRoundsDistribution(levelId)) e += (m100 / 100) * p;
  return e;
}

const tableCache = new Map<RageLevelId, Row[]>();

/** Table de distribution (flottants : suffisant pour un mock ; la version exacte est dans le calculateur Python). */
export function distributionTable(levelId: RageLevelId): Row[] {
  const cached = tableCache.get(levelId);
  if (cached) return cached;
  const level = getRageLevel(levelId);
  const shareBf = BOSS_FIGHT_FREQUENCY * freeRoundsExpectation(levelId);
  const fixed = level.baseRows.reduce((s, r) => s + (r.rtpShare === 'balance' ? 0 : r.rtpShare), 0);
  const balance = TARGET_RTP - shareBf - fixed;
  const rows: Row[] = level.baseRows.map((r) => ({
    multiplier100: Math.round(r.multiplier * 100),
    p: (r.rtpShare === 'balance' ? balance : r.rtpShare) / r.multiplier,
    bossFight: false,
  }));
  for (const [m100, p] of freeRoundsDistribution(levelId)) rows.push({ multiplier100: m100, p: BOSS_FIGHT_FREQUENCY * p, bossFight: true });
  const pWin = rows.reduce((s, r) => s + r.p, 0);
  rows.unshift({ multiplier100: 0, p: 1 - pWin, bossFight: false });
  tableCache.set(levelId, rows);
  return rows;
}

function pickWeighted<K extends string>(weights: Record<K, number>, rnd: RandomSource): K {
  const entries = Object.entries(weights) as [K, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let u = rnd() * total;
  for (const [key, w] of entries) {
    u -= w;
    if (u < 0) return key;
  }
  return entries[entries.length - 1]![0];
}

function pickScript(resultClass: ResultClass, rnd: RandomSource): Script {
  return pickWeighted(policy.scripts_by_class[resultClass] as Record<Script, number>, rnd);
}

function pickRarity(rnd: RandomSource): Rarity {
  return pickWeighted(policy.rarity as Record<Rarity, number>, rnd);
}

function randomSeed(rnd: RandomSource): number {
  return Math.floor(rnd() * 4294967296) >>> 0;
}

/** Tours gratuits imposés (DEV) : nombre de HIT (1 à 8, répartis régulièrement, le dernier tour touche) et base unique. */
export interface ForcedFreeRounds {
  hits: number;
  /** Base de chaque HIT (multiplicateur de la table du niveau). Par défaut : la plus petite base au-dessus de x1. */
  base?: number;
}

export function defaultForcedBase(levelId: RageLevelId): number {
  const bases = getRageLevel(levelId).freeRounds.bases.map((b) => b.multiplier);
  return bases.find((m) => m > 1) ?? bases[0] ?? 1;
}

/** HIT au tour k (0..n-1) pour `hits` HIT répartis régulièrement ; le dernier tour est toujours un HIT. */
function spreadHit(k: number, hits: number, n: number): boolean {
  return Math.floor(((k + 1) * hits) / n) > Math.floor((k * hits) / n);
}

/** Total exact d'un BOSS FIGHT imposé (sans tirage) : pour l'affichage du DEV PANEL. */
export function forcedFreeRoundsTotal100(levelId: RageLevelId, forced: ForcedFreeRounds): number {
  const level = getRageLevel(levelId);
  const base100 = Math.round((forced.base ?? defaultForcedBase(levelId)) * 100);
  const cap = level.maxWin * 100;
  let total = 0;
  for (let h = 0; h < forced.hits && total < cap; h++) total = Math.min(cap, total + base100 * rageAt(level.freeRounds, h));
  return total;
}

/** Déroulé complet des tours gratuits (tiré, ou imposé en DEV). */
function freeRoundsEvent(levelId: RageLevelId, rnd: RandomSource, forced?: ForcedFreeRounds | null): BossFightEvent {
  const level = getRageLevel(levelId);
  const fr = level.freeRounds;
  const cap = level.maxWin * 100;
  const wSum = fr.bases.reduce((s, b) => s + b.weight, 0);
  if (forced) {
    if (!Number.isInteger(forced.hits) || forced.hits < 1 || forced.hits > fr.rounds) throw new Error(`Nombre de HIT invalide : ${forced.hits}`);
    const base = forced.base ?? defaultForcedBase(levelId);
    if (!fr.bases.some((b) => b.multiplier === base)) throw new Error(`Base x${base} absente des tours gratuits de ${levelId}`);
  }
  const rounds: FreeRoundEvent[] = [];
  let total = 0;
  let hits = 0;
  for (let k = 0; k < fr.rounds && total < cap; k++) {
    // Ordre de tirage fixe par tour : HIT ?, base, variante (la variante est toujours consommée).
    const hit = forced ? spreadHit(k, forced.hits, fr.rounds) : (k === fr.rounds - 1 && hits === 0) || rnd() < fr.pHit;
    let base100 = 0;
    if (hit) {
      if (forced) base100 = Math.round((forced.base ?? defaultForcedBase(levelId)) * 100);
      else {
        let u = rnd() * wSum;
        const b = fr.bases.find((x) => (u -= x.weight) < 0) ?? fr.bases[fr.bases.length - 1]!;
        base100 = Math.round(b.multiplier * 100);
      }
    }
    const variant = Math.floor(rnd() * 4);
    const rage = rageAt(fr, hits);
    const win100 = hit ? Math.min(base100 * rage, cap - total) : 0;
    rounds.push({ result: hit ? 'HIT' : 'BLOCKED', base100, rage, win100, variant });
    total += win100;
    if (hit) hits++;
  }
  return { type: 'bossFight', freeRounds: fr.rounds, rounds, wincap: total === cap };
}

export const freeRoundsTotal100 = (ev: BossFightEvent): number => ev.rounds.reduce((s, r) => s + r.win100, 0);

/** Résultat forcé depuis le DEV PANEL (MockRGS uniquement, jamais sur le RGS réel). */
export interface ForcedOutcome {
  kind: 'LOSS' | 'WIN' | 'BIG_WIN' | 'BOSS_FIGHT';
  /** Multiplicateur (ex. 2 pour x2). LOSS accepte 0 ou un multiplicateur < 1 (récupération). Ignoré pour BOSS_FIGHT. */
  multiplier?: number;
  /** BOSS FIGHT : nombre de HIT sur les 8 tours gratuits (1 à 8). Absent : déroulé tiré au hasard. */
  bossFightHits?: number;
  /** BOSS FIGHT : base de chaque HIT (avec `bossFightHits`). */
  bossFightBase?: number;
  script?: Script;
  rarity?: Rarity;
  seed?: number;
}

/** Multiplicateurs possibles d'un Rage Level pour chaque type forcé (listes du DEV PANEL). BOSS_FIGHT : bases des HIT. */
export function forcibleMultipliers(levelId: RageLevelId, kind: ForcedOutcome['kind']): number[] {
  const level = getRageLevel(levelId);
  switch (kind) {
    case 'LOSS':
      return [0, ...level.baseMultipliers.filter((m) => m < 1)];
    case 'WIN':
      return level.baseMultipliers.filter((m) => m >= 1 && m < 5);
    case 'BIG_WIN':
      return level.baseMultipliers.filter((m) => m >= 5);
    case 'BOSS_FIGHT':
      return level.freeRounds.bases.map((b) => b.multiplier);
  }
}

/** Script autorisé pour une classe par la politique de mise en scène (contrôle des scripts imposés en DEV). */
export function scriptAllowed(resultClass: ResultClass, script: Script): boolean {
  return ((policy.scripts_by_class[resultClass] as Partial<Record<Script, number>>)[script] ?? 0) > 0;
}

/** Réutilisés par les maths expérimentales A2 (tripleMath.ts) : mêmes tirages cosmétiques, même ordre. */
export const pickScriptFor = pickScript;
export const pickRarityFor = pickRarity;
export const randomSeedFor = randomSeed;
export const bossFightEventFor = freeRoundsEvent;

let bookCounter = 1;

export function generateBook(levelId: RageLevelId, rnd: RandomSource, forced?: ForcedOutcome | null): Book {
  let multiplier100: number;
  let bossFight: BossFightEvent | null = null;

  if (forced) {
    if (forced.kind === 'BOSS_FIGHT') {
      bossFight = freeRoundsEvent(levelId, rnd, forced.bossFightHits !== undefined ? { hits: forced.bossFightHits, base: forced.bossFightBase } : null);
      multiplier100 = freeRoundsTotal100(bossFight);
    } else {
      const allowed = forcibleMultipliers(levelId, forced.kind);
      const m = forced.multiplier ?? allowed[0] ?? 0;
      if (!allowed.includes(m)) throw new Error(`x${m} n'existe pas pour ${forced.kind} en ${levelId}`);
      multiplier100 = Math.round(m * 100);
    }
  } else {
    // Un seul tirage choisit la ligne ; les lignes BOSS FIGHT forment une seule masse (1/400), dont le total vient
    // ensuite du déroulé des tours gratuits (même distribution que les lignes de la table).
    const rows = distributionTable(levelId);
    let u = rnd();
    let chosen: Row | null = null;
    for (const row of rows) {
      if (row.bossFight) continue;
      u -= row.p;
      if (u < 0) {
        chosen = row;
        break;
      }
    }
    if (chosen) multiplier100 = chosen.multiplier100;
    else {
      bossFight = freeRoundsEvent(levelId, rnd);
      multiplier100 = freeRoundsTotal100(bossFight);
    }
  }

  const resultClass = classify(multiplier100);
  // Tirages cosmétiques dans un ordre FIXE, toujours consommés : forcer la graine (DEV PANEL)
  // ne décale pas les autres tirages. La graine ne touche jamais au multiplicateur, déjà fixé ci-dessus.
  const isBossFight = bossFight !== null;
  const drawnScript = isBossFight ? 'BF_ENTRY' : pickScript(resultClass, rnd);
  const drawnRarity = pickRarity(rnd);
  const drawnSeed = randomSeed(rnd);
  const events: BookEvent[] = [
    {
      type: 'presentation',
      script: isBossFight ? 'BF_ENTRY' : forced?.script ?? drawnScript,
      rarity: forced?.rarity ?? drawnRarity,
      seed: forced?.seed ?? drawnSeed,
    },
  ];
  if (bossFight) events.push(bossFight);
  events.push({ type: 'finalWin', amount: multiplier100 });
  return { id: bookCounter++, payoutMultiplier: multiplier100, events };
}
