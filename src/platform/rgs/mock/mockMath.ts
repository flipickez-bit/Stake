/**
 * « Serveur mathématique » du MockRGS (phase 0). Représente ce que feront les books Stake Engine :
 * il tire un résultat selon la distribution de config/rage_levels.json et écrit les événements du book.
 * Ce module n'est PAS de la présentation : il peut utiliser un RNG non déterministe (comme le RGS réel).
 */
import policy from '../../../../config/presentation_policy.json';
import type { Book, BookEvent, BossFightAttack } from '../../../domain/book';
import { getRageLevel, BOSS_FIGHT_FREQUENCY, TARGET_RTP } from '../../../domain/rageLevels';
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
  bossFightRung: number | null;
}

function bossFightEnds(ladder: number[], cont: number[]): number[] {
  const ends: number[] = [];
  let reach = 1;
  for (let k = 0; k < ladder.length; k++) {
    if (k < ladder.length - 1) {
      const c = cont[k] ?? 0;
      ends.push(reach * (1 - c));
      reach *= c;
    } else {
      ends.push(reach);
    }
  }
  return ends;
}

const tableCache = new Map<RageLevelId, Row[]>();

/** Table de distribution (flottants : suffisant pour un mock ; la version exacte est dans le calculateur Python). */
export function distributionTable(levelId: RageLevelId): Row[] {
  const cached = tableCache.get(levelId);
  if (cached) return cached;
  const level = getRageLevel(levelId);
  const ends = bossFightEnds(level.bossFightLadder, level.bossFightContinue);
  const evBf = level.bossFightLadder.reduce((s, m, k) => s + m * (ends[k] ?? 0), 0);
  const shareBf = BOSS_FIGHT_FREQUENCY * evBf;
  const fixed = level.baseRows.reduce((s, r) => s + (r.rtpShare === 'balance' ? 0 : r.rtpShare), 0);
  const balance = TARGET_RTP - shareBf - fixed;
  const rows: Row[] = level.baseRows.map((r) => ({
    multiplier100: Math.round(r.multiplier * 100),
    p: (r.rtpShare === 'balance' ? balance : r.rtpShare) / r.multiplier,
    bossFightRung: null,
  }));
  level.bossFightLadder.forEach((m, k) =>
    rows.push({ multiplier100: m * 100, p: BOSS_FIGHT_FREQUENCY * (ends[k] ?? 0), bossFightRung: k }),
  );
  const pWin = rows.reduce((s, r) => s + r.p, 0);
  rows.unshift({ multiplier100: 0, p: 1 - pWin, bossFightRung: null });
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

function bossFightEvents(levelId: RageLevelId, finalRung: number, rnd: RandomSource): BookEvent {
  const ladder = getRageLevel(levelId).bossFightLadder;
  const attacks: BossFightAttack[] = [];
  for (let k = 0; k < finalRung; k++) attacks.push({ result: 'HIT', variant: Math.floor(rnd() * 4) });
  const ko = finalRung === ladder.length - 1;
  if (!ko) attacks.push({ result: 'BLOCKED', variant: Math.floor(rnd() * 4) });
  return { type: 'bossFight', rungs100: ladder.map((m) => m * 100), attacks, ko };
}

/** Résultat forcé depuis le DEV PANEL (MockRGS uniquement, jamais sur le RGS réel). */
export interface ForcedOutcome {
  kind: 'LOSS' | 'WIN' | 'BIG_WIN' | 'BOSS_FIGHT';
  /** Multiplicateur (ex. 2 pour x2). LOSS accepte 0 ou un multiplicateur < 1 (récupération). */
  multiplier?: number;
  /** Palier final du BOSS FIGHT (index, 0 = x5). */
  bossFightRung?: number;
  script?: Script;
  rarity?: Rarity;
  seed?: number;
}

/** Multiplicateurs possibles d'un Rage Level pour chaque type forcé (listes du DEV PANEL). */
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
      return level.bossFightLadder.slice();
  }
}

let bookCounter = 1;

export function generateBook(levelId: RageLevelId, rnd: RandomSource, forced?: ForcedOutcome | null): Book {
  const level = getRageLevel(levelId);
  let multiplier100: number;
  let bossFightRung: number | null = null;

  if (forced) {
    if (forced.kind === 'BOSS_FIGHT') {
      const rung = forced.bossFightRung ?? Math.max(0, level.bossFightLadder.indexOf(forced.multiplier ?? 5));
      if (rung < 0 || rung >= level.bossFightLadder.length) throw new Error(`Palier invalide : ${rung}`);
      bossFightRung = rung;
      multiplier100 = (level.bossFightLadder[rung] ?? 5) * 100;
    } else {
      const allowed = forcibleMultipliers(levelId, forced.kind);
      const m = forced.multiplier ?? allowed[0] ?? 0;
      if (!allowed.includes(m)) throw new Error(`x${m} n'existe pas pour ${forced.kind} en ${levelId}`);
      multiplier100 = Math.round(m * 100);
    }
  } else {
    const rows = distributionTable(levelId);
    let u = rnd();
    let chosen = rows[rows.length - 1]!;
    for (const row of rows) {
      u -= row.p;
      if (u < 0) {
        chosen = row;
        break;
      }
    }
    multiplier100 = chosen.multiplier100;
    bossFightRung = chosen.bossFightRung;
  }

  const resultClass = classify(multiplier100);
  const events: BookEvent[] = [];
  if (bossFightRung !== null) {
    events.push({ type: 'presentation', script: 'BF_ENTRY', rarity: forced?.rarity ?? pickRarity(rnd), seed: forced?.seed ?? randomSeed(rnd) });
    events.push(bossFightEvents(levelId, bossFightRung, rnd));
  } else {
    events.push({
      type: 'presentation',
      script: forced?.script ?? pickScript(resultClass, rnd),
      rarity: forced?.rarity ?? pickRarity(rnd),
      seed: forced?.seed ?? randomSeed(rnd),
    });
  }
  events.push({ type: 'finalWin', amount: multiplier100 });
  return { id: bookCounter++, payoutMultiplier: multiplier100, events };
}
