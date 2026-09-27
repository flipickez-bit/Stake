/**
 * POC « 3 PLANS » — PLAYTEST A/B, LOCAL DEV ONLY (même règle que PLAYTEST 50 : rien n'est envoyé nulle part,
 * l'export est un geste volontaire).
 *
 * Protocole : deux sessions de 30 manches, SESSION PRIVATE (jamais d'alternatives) et SESSION ON-DEMAND
 * (bouton « REVEAL OTHER PLANS » après chaque manche). L'ordre est tiré au hasard pour chaque testeur.
 * Après chaque session : Q1–Q4 ; pour ON-DEMAND, en plus : Q5–Q7 et une question libre.
 * Mesures : ouvertures de OTHER PLANS, plan choisi et résultat, résultats alternatifs, temps avant la mise
 * suivante, changements de gadget (en général, après avoir VU qu'un autre plan faisait mieux, après avoir vu que
 * le plan choisi était le meilleur), manches supplémentaires volontaires après la 30e.
 */
import { PLAN_SLOTS, type OutcomePlans, type PlanSlot } from '../domain/plans';
import type { RoundRecord } from '../flow/GameFlow';
import type { KeyValueStore } from '../platform/storage';

export const POC_SESSION_ROUNDS = 30;
/** Manches supplémentaires comptées au plus (le joueur peut jouer davantage, rien n'est enregistré au-delà). */
export const POC_EXTRA_CAP = 60;
const KEY = 'badboss.poc3.playtest.local-dev-only.v1';

export type PocVariant = 'PRIVATE' | 'ON_DEMAND';
export const POC_VARIANT_LABEL: Record<PocVariant, string> = { PRIVATE: 'PRIVATE', ON_DEMAND: 'ON-DEMAND' };

export type PocQuestionId = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5' | 'Q6' | 'Q7';

export interface PocQuestion {
  id: PocQuestionId;
  text: string;
  /** Libellés des extrémités (et du milieu) de l'échelle 1–5. */
  scale: { 1: string; 3?: string; 5: string };
}

const AGREE = { 1: 'pas du tout', 5: 'tout à fait' } as const;

/** Après CHAQUE variante. */
export const POC_QUESTIONS_COMMON: readonly PocQuestion[] = [
  { id: 'Q1', text: 'Choisir entre les trois gadgets rend-il la manche plus intéressante ?', scale: AGREE },
  { id: 'Q2', text: 'Avais-tu l’impression que ton choix comptait réellement ?', scale: AGREE },
  { id: 'Q3', text: 'Le choix entre les trois gadgets était-il facile à comprendre ?', scale: AGREE },
  { id: 'Q4', text: 'Après avoir choisi, avais-tu davantage envie de voir le résultat ?', scale: AGREE },
];

/** ON-DEMAND seulement. */
export const POC_QUESTIONS_ON_DEMAND: readonly PocQuestion[] = [
  { id: 'Q5', text: 'Avais-tu envie de regarder les deux plans non choisis ?', scale: AGREE },
  { id: 'Q6', text: 'Voir les autres résultats était-il intéressant ou frustrant ?', scale: { 1: 'très frustrant', 3: 'neutre', 5: 'très intéressant' } },
  { id: 'Q7', text: 'Cette mécanique te donne-t-elle envie de changer de gadget à la manche suivante ?', scale: AGREE },
];

export const POC_FREE_QUESTION = 'Qu’as-tu ressenti quand un autre gadget avait un meilleur multiplicateur que celui que tu avais choisi ?';

export function questionsFor(variant: PocVariant): readonly PocQuestion[] {
  return variant === 'ON_DEMAND' ? [...POC_QUESTIONS_COMMON, ...POC_QUESTIONS_ON_DEMAND] : POC_QUESTIONS_COMMON;
}

export interface PocRound {
  n: number;
  roundId: string;
  plan: PlanSlot;
  gadgetId: string;
  /** Multiplicateur payé (×100). */
  multiplier100: number;
  /** Les trois résultats de la manche (×100), connus du joueur seulement s'il les a regardés. */
  alternatives: Record<PlanSlot, number>;
  bossFight: boolean;
  /** Un autre plan avait STRICTEMENT plus. */
  otherBetter: boolean;
  /** Le plan choisi a gagné et aucun autre n'avait plus (ex æquo compris). */
  chosenBest: boolean;
  allLose: boolean;
  /** ON-DEMAND : le joueur a ouvert OTHER PLANS après cette manche. */
  revealOpened: boolean;
  /** Délai READY → ouverture (ms). */
  revealAfterMs: number | null;
  /** READY de la manche précédente → mise (ms) ; null pour la 1re manche et après une reprise. */
  readyToBetMs: number | null;
  /** Plan différent de celui de la manche précédente (null pour la 1re). */
  switched: boolean | null;
  /** Manche jouée volontairement après la 30e. */
  extra: boolean;
  resumed: boolean;
}

export interface PocAnswers {
  scores: Partial<Record<PocQuestionId, number>>;
  free: string;
}

export interface PocSession {
  index: 1 | 2;
  variant: PocVariant;
  startedAt: string;
  /** Fin de la 30e manche. */
  completedAt: string | null;
  /** 'playing' → 'extra' (30 manches jouées : questionnaire proposé, jeu libre) → 'questionnaire' → 'done'. */
  status: 'playing' | 'extra' | 'questionnaire' | 'done';
  rounds: PocRound[];
  extraRounds: number;
  answers: PocAnswers | null;
  questionnaireSkipped: boolean;
}

export interface PocStudy {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  /** Ordre tiré au hasard pour ce testeur. */
  order: [PocVariant, PocVariant];
  device: { width: number; height: number; portrait: boolean; touch: boolean };
  sessions: PocSession[];
  status: 'running' | 'done' | 'aborted';
  devPanelOpened: boolean;
}

export interface PocPlaytestState {
  version: 1;
  study: PocStudy | null;
  history: PocStudy[];
  lastReadyAt: number | null;
  /** READY de la dernière manche (horloge de GameFlow) : base du délai d'ouverture de OTHER PLANS. */
  lastRoundReadyAt: number | null;
}

const empty = (): PocPlaytestState => ({ version: 1, study: null, history: [], lastReadyAt: null, lastRoundReadyAt: null });

function altOf(plans: OutcomePlans): Record<PlanSlot, number> {
  const out = { A: 0, B: 0, C: 0 } as Record<PlanSlot, number>;
  for (const r of plans.results) out[r.slot] = r.multiplier100;
  return out;
}

export class PocPlaytestRecorder {
  private state: PocPlaytestState;
  private readonly listeners = new Set<(s: PocPlaytestState) => void>();

  constructor(
    private readonly store: KeyValueStore,
    private readonly random: () => number,
    private readonly now: () => Date = () => new Date(),
  ) {
    const loaded = store.get<PocPlaytestState>(KEY);
    // Les instants (performance.now) ne survivent pas à un rechargement : délais repris à zéro.
    this.state = loaded && loaded.version === 1 ? { ...loaded, lastReadyAt: null, lastRoundReadyAt: null } : empty();
  }

  get snapshot(): PocPlaytestState {
    return this.state;
  }

  get study(): PocStudy | null {
    return this.state.study;
  }

  /** Session en cours (null hors étude). */
  get session(): PocSession | null {
    const st = this.state.study;
    if (!st || st.status !== 'running') return null;
    return st.sessions[st.sessions.length - 1] ?? null;
  }

  subscribe(fn: (s: PocPlaytestState) => void): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  /** Nouvelle étude : l'ordre PRIVATE / ON-DEMAND est tiré au hasard (et enregistré). */
  start(device: PocStudy['device']): PocStudy {
    const order: [PocVariant, PocVariant] = this.random() < 0.5 ? ['PRIVATE', 'ON_DEMAND'] : ['ON_DEMAND', 'PRIVATE'];
    const at = this.now().toISOString();
    const study: PocStudy = {
      id: `POC-${at.replace(/[-:T.Z]/g, '').slice(0, 14)}`,
      startedAt: at,
      finishedAt: null,
      order,
      device,
      sessions: [this.newSession(1, order[0])],
      status: 'running',
      devPanelOpened: false,
    };
    this.state = { ...this.state, study, lastReadyAt: null, lastRoundReadyAt: null };
    this.save();
    return study;
  }

  abort(): void {
    const st = this.state.study;
    if (!st) return;
    this.state = { ...this.state, study: null, history: [...this.state.history, { ...st, status: 'aborted' }] };
    this.save();
  }

  clearAll(): void {
    this.state = empty();
    this.save();
  }

  markDevPanelOpened(): void {
    const st = this.state.study;
    if (st?.status === 'running' && !st.devPanelOpened) {
      this.state = { ...this.state, study: { ...st, devPanelOpened: true } };
      this.save();
    }
  }

  /** Branché sur GameFlow.onRoundComplete. Ignore les replays, les aperçus et les manches sans plans. */
  onRoundComplete(r: RoundRecord): void {
    if (r.source === 'replay' || r.source === 'dev' || !r.plans) return;
    const s = this.session;
    const st = this.state.study;
    if (!s || !st || s.status === 'questionnaire' || s.status === 'done') {
      this.state = { ...this.state, lastReadyAt: r.readyAt, lastRoundReadyAt: r.readyAt };
      this.save();
      return;
    }
    const extra = s.status === 'extra';
    if (extra && s.extraRounds >= POC_EXTRA_CAP) return;
    const alternatives = altOf(r.plans);
    const chosen = r.multiplier100;
    const others = PLAN_SLOTS.filter((x) => x !== r.plans!.selected).map((x) => alternatives[x]);
    const prev = s.rounds[s.rounds.length - 1];
    const round: PocRound = {
      n: s.rounds.length + 1,
      roundId: r.roundId,
      plan: r.plans.selected,
      gadgetId: r.plans.selectedGadget,
      multiplier100: chosen,
      alternatives,
      bossFight: r.bossFight,
      otherBetter: Math.max(...others) > chosen,
      chosenBest: chosen > 0 && chosen >= Math.max(...others),
      allLose: chosen === 0 && others.every((x) => x === 0),
      revealOpened: false,
      revealAfterMs: null,
      readyToBetMs: this.state.lastReadyAt === null || r.source === 'resume' ? null : Math.max(0, Math.round(r.firedAt - this.state.lastReadyAt)),
      switched: prev ? prev.plan !== r.plans.selected : null,
      extra,
      resumed: r.source === 'resume',
    };
    const rounds = [...s.rounds, round];
    const reached = !extra && rounds.length >= POC_SESSION_ROUNDS;
    const next: PocSession = {
      ...s,
      rounds,
      extraRounds: s.extraRounds + (extra ? 1 : 0),
      status: reached ? 'extra' : s.status,
      completedAt: reached ? this.now().toISOString() : s.completedAt,
    };
    this.replaceSession(next, { lastReadyAt: r.readyAt, lastRoundReadyAt: r.readyAt });
  }

  /** ON-DEMAND : le joueur a ouvert OTHER PLANS après la manche `roundId` (au plus une fois par manche). */
  markRevealOpened(roundId: string, atMs: number): void {
    const s = this.session;
    if (!s) return;
    const i = s.rounds.findIndex((x) => x.roundId === roundId);
    if (i < 0 || s.rounds[i]!.revealOpened) return;
    const after = this.state.lastRoundReadyAt === null ? null : Math.max(0, Math.round(atMs - this.state.lastRoundReadyAt));
    const rounds = s.rounds.map((x, k) => (k === i ? { ...x, revealOpened: true, revealAfterMs: after } : x));
    this.replaceSession({ ...s, rounds });
  }

  /** Le joueur choisit de répondre (après la 30e manche). */
  openQuestionnaire(): void {
    const s = this.session;
    if (s?.status !== 'extra') return;
    this.replaceSession({ ...s, status: 'questionnaire' });
  }

  /** Réponses (null = passer). Démarre la session 2, ou termine l'étude. Renvoie la variante suivante. */
  submitAnswers(answers: PocAnswers | null): PocVariant | null {
    const s = this.session;
    const st = this.state.study;
    if (!s || !st || s.status !== 'questionnaire') return null;
    const allowed = new Set(questionsFor(s.variant).map((q) => q.id));
    const scores: PocAnswers['scores'] = {};
    for (const [id, v] of Object.entries(answers?.scores ?? {}) as [PocQuestionId, number | undefined][]) {
      // Jamais de note inventée : une réponse absente reste absente.
      if (allowed.has(id) && typeof v === 'number' && Number.isFinite(v)) scores[id] = Math.min(5, Math.max(1, Math.round(v)));
    }
    const done: PocSession = {
      ...s,
      status: 'done',
      answers: answers ? { scores, free: s.variant === 'ON_DEMAND' ? answers.free.trim().slice(0, 1000) : '' } : null,
      questionnaireSkipped: answers === null,
    };
    const sessions = [...st.sessions.slice(0, -1), done];
    if (s.index === 1) {
      const variant = st.order[1];
      this.state = { ...this.state, study: { ...st, sessions: [...sessions, this.newSession(2, variant)] }, lastReadyAt: null, lastRoundReadyAt: null };
      this.save();
      return variant;
    }
    const finished: PocStudy = { ...st, sessions, status: 'done', finishedAt: this.now().toISOString() };
    this.state = { ...this.state, study: null, history: [...this.state.history, finished] };
    this.save();
    return null;
  }

  /** Données complètes (export volontaire). */
  exportJson(study: PocStudy): string {
    return JSON.stringify({ kind: 'BAD BOSS — 3 GADGET POC · PLAYTEST A/B · LOCAL DEV ONLY', study, summary: study.sessions.map(summarize) }, null, 2);
  }

  private newSession(index: 1 | 2, variant: PocVariant): PocSession {
    return { index, variant, startedAt: this.now().toISOString(), completedAt: null, status: 'playing', rounds: [], extraRounds: 0, answers: null, questionnaireSkipped: false };
  }

  private replaceSession(next: PocSession, extra: Partial<PocPlaytestState> = {}): void {
    const st = this.state.study;
    if (!st) return;
    this.state = { ...this.state, ...extra, study: { ...st, sessions: [...st.sessions.slice(0, -1), next] } };
    this.save();
  }

  private save(): void {
    this.store.set(KEY, this.state);
    for (const fn of this.listeners) fn(this.state);
  }
}

// ------------------------------------------------------------------ synthèse (pure)

export interface PocRate {
  n: number;
  of: number;
  /** null si aucun cas. */
  rate: number | null;
}

const rate = (n: number, of: number): PocRate => ({ n, of, rate: of > 0 ? n / of : null });
const mean = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export interface PocSummary {
  index: 1 | 2;
  variant: PocVariant;
  rounds: number;
  extraRounds: number;
  picks: Record<PlanSlot, number>;
  hitRate: number | null;
  /** Ouvertures de OTHER PLANS (ON-DEMAND). */
  reveals: PocRate;
  revealAfterMsMean: number | null;
  readyToBetMsMean: number | null;
  readyToBetAfterLossMs: number | null;
  readyToBetAfterWinMs: number | null;
  readyToBetAfterRevealMs: number | null;
  switches: PocRate;
  /** Changement de plan après avoir VU qu'un autre plan faisait mieux. */
  switchAfterSeenOtherBetter: PocRate;
  /** Changement de plan après avoir VU que le plan choisi était le meilleur. */
  switchAfterSeenChosenBest: PocRate;
  /** Témoin : un autre plan faisait mieux mais le joueur ne l'a PAS vu. */
  switchAfterUnseenOtherBetter: PocRate;
  answers: PocAnswers | null;
}

export function summarize(s: PocSession): PocSummary {
  const rs = s.rounds;
  const main = rs.filter((r) => !r.extra);
  const picks = { A: 0, B: 0, C: 0 } as Record<PlanSlot, number>;
  for (const r of rs) picks[r.plan]++;
  const pairs = rs.slice(1).map((r, i) => ({ prev: rs[i]!, cur: r }));
  const delays = (pred: (p: PocRound) => boolean) => pairs.filter(({ prev, cur }) => pred(prev) && cur.readyToBetMs !== null).map(({ cur }) => cur.readyToBetMs!);
  const sw = (pred: (p: PocRound) => boolean) => {
    const cases = pairs.filter(({ prev }) => pred(prev));
    return rate(cases.filter(({ cur }) => cur.switched === true).length, cases.length);
  };
  return {
    index: s.index,
    variant: s.variant,
    rounds: main.length,
    extraRounds: s.extraRounds,
    picks,
    hitRate: rs.length ? rs.filter((r) => r.multiplier100 > 0).length / rs.length : null,
    reveals: rate(rs.filter((r) => r.revealOpened).length, rs.length),
    revealAfterMsMean: mean(rs.filter((r) => r.revealAfterMs !== null).map((r) => r.revealAfterMs!)),
    readyToBetMsMean: mean(rs.filter((r) => r.readyToBetMs !== null).map((r) => r.readyToBetMs!)),
    readyToBetAfterLossMs: mean(delays((p) => p.multiplier100 === 0)),
    readyToBetAfterWinMs: mean(delays((p) => p.multiplier100 > 0)),
    readyToBetAfterRevealMs: mean(delays((p) => p.revealOpened)),
    switches: rate(pairs.filter(({ cur }) => cur.switched === true).length, pairs.length),
    switchAfterSeenOtherBetter: sw((p) => p.revealOpened && p.otherBetter),
    switchAfterSeenChosenBest: sw((p) => p.revealOpened && p.chosenBest),
    switchAfterUnseenOtherBetter: sw((p) => !p.revealOpened && p.otherBetter),
    answers: s.answers,
  };
}
