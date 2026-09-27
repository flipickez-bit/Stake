import type { BookEvent, BossFightEvent, PickEvent, PresentationEvent, TripleEvent } from './book';
import { PLAN_SLOTS, isPlanSlot, type OutcomePlans } from './plans';
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
  /** POC « 3 PLANS » (A2, MOCK / DEV) : plan choisi et triple complet. null hors POC. */
  readonly plans: OutcomePlans | null;
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

  const plans = parsePlans(round, events, presentation, m100, bossFight !== null);

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
    plans,
  });
}

/**
 * POC « 3 PLANS » : contrôle strict du triple. Le plan payé vient du SERVEUR (mode de la manche) et doit
 * correspondre à l'événement `pick` ; le multiplicateur payé et la présentation jouée sont ceux du plan choisi.
 */
function parsePlans(round: InternalRound, events: BookEvent[], presentation: PresentationEvent, m100: number, isBossFight: boolean): OutcomePlans | null {
  const triple = events.find((e): e is TripleEvent => e.type === 'triple') ?? null;
  const pick = events.find((e): e is PickEvent => e.type === 'pick') ?? null;
  const plan = round.plan ?? null;
  if (!triple && !pick && plan === null) return null;
  const id = round.roundId;
  if (!triple || !pick || plan === null) throw new OutcomeError(`Manche ${id} : plan, triple et pick doivent être présents ensemble`);
  if (!isPlanSlot(plan) || pick.slot !== plan) throw new OutcomeError(`Manche ${id} : plan du serveur (${String(plan)}) différent du pick (${String(pick.slot)})`);
  if (triple.level !== round.mode) throw new OutcomeError(`Manche ${id} : triple d'un autre Rage Level`);
  if (!Array.isArray(triple.results) || triple.results.length !== 3 || triple.results.some((r, i) => r.slot !== PLAN_SLOTS[i])) {
    throw new OutcomeError(`Manche ${id} : triple incomplet (A, B, C attendus)`);
  }
  if (new Set(triple.results.map((r) => r.gadgetId)).size !== 3) throw new OutcomeError(`Manche ${id} : un gadget par plan`);
  for (const r of triple.results) {
    if (!Number.isInteger(r.multiplier100) || r.multiplier100 < 0) throw new OutcomeError(`Manche ${id} : multiplicateur invalide (plan ${r.slot})`);
    if (!SCRIPTS_BY_CLASS[classify(r.multiplier100)].includes(r.script)) throw new OutcomeError(`Manche ${id} : script du plan ${r.slot} incompatible`);
  }
  const chosen = triple.results[PLAN_SLOTS.indexOf(plan)]!;
  if (chosen.multiplier100 !== m100) throw new OutcomeError(`Manche ${id} : le gain payé n'est pas celui du plan ${plan}`);
  if (chosen.script !== presentation.script || chosen.rarity !== presentation.rarity || (chosen.seed >>> 0) !== (presentation.seed >>> 0)) {
    throw new OutcomeError(`Manche ${id} : la présentation jouée n'est pas celle du plan ${plan}`);
  }
  // BOSS FIGHT commun à la manche : les trois plans le portent, avec le même palier.
  const bfSlots = triple.results.filter((r) => r.script === 'BF_ENTRY').length;
  if (triple.bossFight !== isBossFight || (isBossFight && (bfSlots !== 3 || triple.results.some((r) => r.multiplier100 !== m100))) || (!isBossFight && bfSlots !== 0)) {
    throw new OutcomeError(`Manche ${id} : BOSS FIGHT du triple incohérent`);
  }
  return Object.freeze({
    selected: plan,
    selectedGadget: chosen.gadgetId,
    model: String(triple.model),
    results: Object.freeze(
      triple.results.map((r) => Object.freeze({ slot: r.slot, gadgetId: r.gadgetId, multiplier100: r.multiplier100, bossFight: r.script === 'BF_ENTRY' })),
    ),
  });
}
