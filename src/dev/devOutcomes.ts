/**
 * Résultats de développement : books générés localement par le mock mathématique, SANS wallet.
 * Servent à l'aperçu, à la boucle ×20/×100 et aux tests. Jamais envoyés au RGS.
 */
import { parseRound, type Outcome } from '../domain/outcome';
import type { InternalRound } from '../domain/round';
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
