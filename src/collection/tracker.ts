/**
 * Branche le COLLECTION BOOK sur GameFlow SANS le modifier : abonnement aux snapshots publics.
 * Règle (COLLECTION_BOOK.md §A.2) : seule une manche jouée (`play`) ou reprise (`resume`, récapitulatif compris)
 * qui atteint l'état REVEAL est observée. Un replay (URL, DEV, LOOP, aperçu BOSS FIGHT) reste en REPLAYING :
 * il ne débloque jamais rien (REPLAY DOES NOT UNLOCK COLLECTION).
 */
import type { FlowSnapshot } from '../flow/GameFlow';
import type { ObservedRound } from './Collection';

export function shouldObserve(s: FlowSnapshot): ObservedRound | null {
  if (s.state !== 'REVEAL' || !s.revealed || !s.round || !s.presentation) return null;
  if (s.round.source !== 'play' && s.round.source !== 'resume') return null;
  if (s.revealed.roundId !== s.round.roundId) return null;
  return {
    roundId: s.round.roundId,
    branchId: s.presentation.branchId,
    source: s.round.source,
    loss: s.revealed.multiplier100 <= 0,
    // POC « 3 PLANS » : le gadget RÉELLEMENT joué (celui de la présentation), jamais une alternative non jouée.
    ...(s.round.plan ? { plan: s.round.plan, gadgetId: s.presentation.gadgetId } : {}),
  };
}

export function attachCollectionTracker(
  flow: { subscribe(fn: (s: FlowSnapshot) => void): () => void },
  collection: { observe(round: ObservedRound): unknown },
): () => void {
  let last: string | null = null;
  return flow.subscribe((s) => {
    const round = shouldObserve(s);
    if (!round || round.roundId === last) return;
    last = round.roundId;
    collection.observe(round);
  });
}
