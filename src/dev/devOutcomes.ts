/**
 * Résultats de développement : books générés localement par le mock mathématique, SANS wallet.
 * Servent à l'aperçu, à la boucle ×20/×100 et aux tests. Jamais envoyés au RGS.
 */
import { parseRound, type Outcome } from '../domain/outcome';
import type { InternalRound } from '../domain/round';
import { getRageLevel } from '../domain/rageLevels';
import type { RageLevelId } from '../domain/types';
import { generateBook, type ForcedOutcome, type RandomSource } from '../platform/rgs/mock/mockMath';

export function makeDevRound(level: RageLevelId, forced: ForcedOutcome | null, rnd: RandomSource, roundId: string): InternalRound {
  const book = generateBook(level, rnd, forced);
  const betAmount = 1_000_000;
  return {
    roundId,
    mode: level,
    betAmount,
    payout: Math.round((betAmount * book.payoutMultiplier) / 100),
    payoutMultiplier100: book.payoutMultiplier,
    active: false,
    events: book.events,
  };
}

export function makeDevOutcome(level: RageLevelId, forced: ForcedOutcome | null, rnd: RandomSource, roundId = 'DEV'): Outcome {
  return parseRound(makeDevRound(level, forced, rnd, roundId), 'dev');
}

/** Palier final d'un BOSS FIGHT tiré selon les probabilités de continuation du Rage Level (aperçu réaliste). */
export function randomBossFightRung(level: RageLevelId, rnd: RandomSource): number {
  const lv = getRageLevel(level);
  let k = 0;
  while (k < lv.bossFightLadder.length - 1 && rnd() < (lv.bossFightContinue[k] ?? 0)) k++;
  return k;
}

/** Manche de BOSS FIGHT pour l'aperçu : aucune mise, aucun appel wallet. */
export function makeBossFightPreview(level: RageLevelId, rnd: RandomSource): InternalRound {
  return makeDevRound(level, { kind: 'BOSS_FIGHT', bossFightRung: randomBossFightRung(level, rnd) }, rnd, `BF-PREVIEW-${Math.floor(rnd() * 1e6).toString(36)}`);
}
