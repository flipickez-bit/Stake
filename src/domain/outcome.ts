import type { BookEvent, BossFightEvent, PresentationEvent } from './book';
import { classify } from './resultClass';
import type { InternalRound } from './round';
import type { RageLevelId, Rarity, ResultClass, Script } from './types';

/** Résultat d'une manche tel que la présentation le voit. Immuable, issu du book. */
export interface Outcome {
  readonly source: 'play' | 'resume' | 'replay' | 'dev';
  readonly roundId: string;
  readonly mode: RageLevelId;
  readonly betAmount: number;
  readonly payout: number;
  readonly payoutMultiplier100: number;
  readonly resultClass: ResultClass;
  readonly script: Script;
  readonly rarity: Rarity;
  readonly seed: number;
  readonly bossFight: {
    readonly rungs100: readonly number[];
    readonly attacks: readonly { readonly result: 'HIT' | 'BLOCKED'; readonly variant: number }[];
    readonly finalRungIndex: number;
    readonly ko: boolean;
  } | null;
}

export class OutcomeError extends Error {}

const SCRIPTS_BY_CLASS: Record<ResultClass, readonly Script[]> = {
  MISS: ['CLEAN_MISS', 'BACKFIRE', 'TEASE'],
  SCRAPE: ['GRAZE'],
  HIT: ['DIRECT', 'COMEBACK', 'BF_ENTRY'],
  BIG: ['DIRECT', 'COMEBACK', 'CHAIN', 'BF_ENTRY'],
  MEGA: ['COMEBACK', 'CHAIN', 'SUPER', 'BF_ENTRY'],
  LEGENDARY: ['SUPER', 'BF_ENTRY'],
};

function isEvent(value: unknown): value is BookEvent {
  return typeof value === 'object' && value !== null && typeof (value as { type?: unknown }).type === 'string';
}

/**
 * Convertit une manche (Mock ou Stake) en Outcome, avec validation stricte.
 * Les mathématiques (multiplicateur, classe, BOSS FIGHT) sont établies ICI, avant tout usage de la graine.
 */
export function parseRound(round: InternalRound, source: Outcome['source']): Outcome {
  const events = round.events.filter(isEvent);
  const presentation = events.find((e): e is PresentationEvent => e.type === 'presentation');
  if (!presentation) throw new OutcomeError(`Manche ${round.roundId} : événement "presentation" manquant`);
  const finalWin = events.find((e) => e.type === 'finalWin');
  const bossFightEvent = events.find((e): e is BossFightEvent => e.type === 'bossFight') ?? null;

  const m100 = round.payoutMultiplier100;
  if (finalWin && finalWin.amount !== m100) {
    throw new OutcomeError(
      `Manche ${round.roundId} : multiplicateur incohérent (book ${finalWin.amount}, serveur ${m100})`,
    );
  }
  const resultClass = classify(m100);
  if (!SCRIPTS_BY_CLASS[resultClass].includes(presentation.script)) {
    throw new OutcomeError(`Manche ${round.roundId} : script ${presentation.script} incompatible avec ${resultClass}`);
  }

  let bossFight: Outcome['bossFight'] = null;
  if (presentation.script === 'BF_ENTRY') {
    if (!bossFightEvent) throw new OutcomeError(`Manche ${round.roundId} : BOSS FIGHT sans déroulé`);
    const hits = bossFightEvent.attacks.filter((a) => a.result === 'HIT').length;
    const finalRungIndex = hits;
    const lastIndex = bossFightEvent.rungs100.length - 1;
    const ko = finalRungIndex === lastIndex;
    const expectedAttacks = ko ? hits : hits + 1;
    const blockedLast = ko || bossFightEvent.attacks[bossFightEvent.attacks.length - 1]?.result === 'BLOCKED';
    if (
      bossFightEvent.attacks.length !== expectedAttacks ||
      !blockedLast ||
      ko !== bossFightEvent.ko ||
      bossFightEvent.rungs100[finalRungIndex] !== m100
    ) {
      throw new OutcomeError(`Manche ${round.roundId} : déroulé du BOSS FIGHT incohérent`);
    }
    bossFight = Object.freeze({
      rungs100: Object.freeze(bossFightEvent.rungs100.slice()),
      attacks: Object.freeze(bossFightEvent.attacks.map((a) => Object.freeze({ result: a.result, variant: a.variant }))),
      finalRungIndex,
      ko,
    });
  } else if (bossFightEvent) {
    throw new OutcomeError(`Manche ${round.roundId} : déroulé de BOSS FIGHT hors script BF_ENTRY`);
  }

  return Object.freeze({
    source,
    roundId: round.roundId,
    mode: round.mode,
    betAmount: round.betAmount,
    payout: round.payout,
    payoutMultiplier100: m100,
    resultClass,
    script: presentation.script,
    rarity: presentation.rarity,
    seed: presentation.seed >>> 0,
    bossFight,
  });
}
