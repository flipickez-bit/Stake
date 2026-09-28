import type { BookEvent, BossFightEvent, PickEvent, PresentationEvent, TripleEvent } from './book';
import { PLAN_SLOTS, isPlanSlot, type OutcomePlans } from './plans';
import { getRageLevel, rageAt } from './rageLevels';
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
  /** BOSS FIGHT = tours gratuits de la même manche (null hors bonus). */
  readonly bossFight: {
    /** Tours accordés (8). */
    readonly freeRounds: number;
    /** Tours joués, dans l'ordre ; `total100` = cumul après le tour. */
    readonly rounds: readonly FreeRound[];
    /** Plafond (max win) atteint : le bonus s'est arrêté là. */
    readonly wincap: boolean;
    /** Mise en scène : le dernier tour joué est un HIT, B.B. finit K.O. (ne change aucun gain). */
    readonly ko: boolean;
  } | null;
  /** POC « 3 PLANS » (A2, MOCK / DEV) : plan choisi et triple complet. null hors POC. */
  readonly plans: OutcomePlans | null;
}

export interface FreeRound {
  readonly result: 'HIT' | 'BLOCKED';
  readonly base100: number;
  readonly rage: number;
  readonly win100: number;
  readonly total100: number;
  readonly variant: number;
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
    bossFight = parseFreeRounds(round.roundId, round.mode, bossFightEvent, m100);
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
 * Contrôle strict des tours gratuits : chaque gain se recalcule (base × rage, écrêté au plafond), la rage suit la
 * règle du niveau, au moins un HIT, et le total est exactement le multiplicateur payé par le serveur.
 */
function parseFreeRounds(id: string, mode: RageLevelId, ev: BossFightEvent, m100: number): NonNullable<Outcome['bossFight']> {
  const bad = (why: string): never => {
    throw new OutcomeError(`Manche ${id} : tours gratuits incohérents (${why})`);
  };
  const level = getRageLevel(mode);
  const fr = level.freeRounds;
  const cap100 = level.maxWin * 100;
  const bases = new Set(fr.bases.map((b) => Math.round(b.multiplier * 100)));
  if (ev.freeRounds !== fr.rounds) bad(`${String(ev.freeRounds)} tours au lieu de ${fr.rounds}`);
  if (!Array.isArray(ev.rounds) || ev.rounds.length < 1 || ev.rounds.length > fr.rounds) bad('nombre de tours joués');
  const rounds: FreeRound[] = [];
  let total = 0;
  let hits = 0;
  for (const [i, r] of ev.rounds.entries()) {
    if (total >= cap100) bad(`tour ${i + 1} joué après le plafond`);
    const rage = rageAt(fr, hits);
    if (r.rage !== rage) bad(`rage du tour ${i + 1}`);
    if (!Number.isInteger(r.variant) || r.variant < 0) bad(`variante du tour ${i + 1}`);
    if (r.result === 'HIT') {
      if (!bases.has(r.base100)) bad(`base du tour ${i + 1}`);
      if (r.win100 !== Math.min(r.base100 * rage, cap100 - total)) bad(`gain du tour ${i + 1}`);
      hits++;
    } else if (r.result === 'BLOCKED') {
      if (r.base100 !== 0 || r.win100 !== 0) bad(`tour ${i + 1} bloqué avec un gain`);
    } else {
      bad(`résultat du tour ${i + 1}`);
    }
    total += r.win100;
    rounds.push(Object.freeze({ result: r.result, base100: r.base100, rage: r.rage, win100: r.win100, total100: total, variant: r.variant }));
  }
  const wincap = total === cap100;
  if (hits === 0) bad('aucun HIT');
  if (ev.wincap !== wincap) bad('plafond');
  if (!wincap && rounds.length !== fr.rounds) bad('bonus interrompu sans plafond');
  if (total !== m100) bad(`total ${total} ≠ payé ${m100}`);
  return Object.freeze({ freeRounds: fr.rounds, rounds: Object.freeze(rounds), wincap, ko: rounds[rounds.length - 1]!.result === 'HIT' });
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
  // BOSS FIGHT commun à la manche : les trois plans le portent, avec les mêmes tours gratuits (même total).
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
