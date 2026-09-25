/**
 * PLAYTEST 50 — LOCAL DEV ONLY.
 * Enregistre localement (localStorage de CE navigateur) des sessions de 50 manches jouées avec le Mock RGS,
 * puis un questionnaire de 6 questions À LA FIN uniquement. Rien n'est envoyé nulle part : l'export
 * (copier / fichier) est un geste volontaire. Toute collecte future auprès de vrais joueurs devra être
 * traitée à part (information, consentement), hors périmètre de ce mode.
 */
import type { RageLevelId, ResultClass, Speed } from '../domain/types';
import type { RoundRecord } from '../flow/GameFlow';
import type { KeyValueStore } from '../platform/storage';

export const PLAYTEST_TARGET = 50;
const KEY = 'badboss.playtest.local-dev-only.v2';

/** Les 6 affirmations, notées de 1 (pas du tout d'accord) à 5 (tout à fait d'accord). */
export const PLAYTEST_QUESTIONS = [
  "J'avais envie de connaître le résultat après avoir lancé le gadget.",
  'Les trois Rage Levels m\'ont semblé différents.',
  'Les animations de perte restaient amusantes.',
  'Les manches m\'ont semblé suffisamment rapides.',
  'Les gros résultats semblaient réellement spéciaux.',
  "J'aurais volontairement lancé une 51e manche.",
  "À la fin de la session, avais-tu encore l'impression de découvrir de nouvelles animations ?",
] as const;
/** Questions qui acceptent « pas rencontré » (Q5 : on ne peut pas juger un gros gain qu'on n'a pas vu). */
export const PLAYTEST_NA_ALLOWED: readonly number[] = [4];
export const PLAYTEST_FREE_QUESTION = 'Quel moment t\'a le plus marqué ?';

export type PlaytestOutcome = 'LOSS' | 'SCRAPE' | 'WIN' | 'BIG WIN' | 'BOSS FIGHT';

export interface PlaytestRound {
  /** Numéro de manche dans la session (1 à 50). */
  n: number;
  roundId: string;
  level: RageLevelId;
  gadget: string | null;
  outcome: PlaytestOutcome;
  resultClass: ResultClass;
  multiplier: number;
  branch: string | null;
  /** Durée réelle de l'animation (ms). */
  animationMs: number;
  /** FIRE → retour à READY (ms). */
  roundMs: number;
  /** READY précédent → mise suivante (ms). null pour la première manche. */
  readyToBetMs: number | null;
  speed: Speed;
  skipped: boolean;
  bossFight: boolean;
  /** Reprise après rechargement (et non un tir normal). */
  resumed: boolean;
  bet: number;
  payout: number;
  /** Présentation vue (branche + variations cosmétiques). Absent dans les sessions P05-A. */
  variant?: string | null;
  /** Première fois que cette branche apparaît dans la session. */
  newBranch?: boolean;
  /** Première fois que cette présentation exacte apparaît dans la session. */
  newVariant?: boolean;
}

export interface PlaytestAnswers {
  /** Notes 1 à 5, dans l'ordre de PLAYTEST_QUESTIONS ; null = « pas rencontré » (seulement si autorisé). */
  scores: (number | null)[];
  memorable: string;
}

export interface PlaytestSession {
  id: string;
  contentVersion: string;
  startedAt: string;
  finishedAt: string | null;
  device: { width: number; height: number; portrait: boolean; touch: boolean };
  rounds: PlaytestRound[];
  /** Le DEV PANEL a été ouvert pendant la session (données à interpréter avec prudence). */
  devPanelOpened: boolean;
  /** 'playing' → 'questionnaire' → 'done'. */
  status: 'playing' | 'questionnaire' | 'done';
  answers: PlaytestAnswers | null;
  questionnaireSkipped: boolean;
  /** Manches jouées volontairement après la 50e, sans aucune incitation (même navigateur). */
  extraRounds: number;
}

export interface PlaytestState {
  version: 2;
  /** Session en cours (jeu ou questionnaire). */
  current: PlaytestSession | null;
  /** Sessions terminées, la plus récente en dernier. */
  sessions: PlaytestSession[];
  /** Id de la dernière session terminée qui compte encore les manches supplémentaires. */
  trackingExtraFor: string | null;
  lastReadyAt: number | null;
  /** Un aperçu (BOSS FIGHT sans mise) a eu lieu : le prochain délai READY → mise n'est pas significatif. */
  skipNextDelay?: boolean;
}

export function outcomeOf(r: Pick<RoundRecord, 'bossFight' | 'multiplier100'>): PlaytestOutcome {
  if (r.bossFight) return 'BOSS FIGHT';
  if (r.multiplier100 <= 0) return 'LOSS';
  if (r.multiplier100 < 100) return 'SCRAPE';
  if (r.multiplier100 < 500) return 'WIN';
  return 'BIG WIN';
}

const empty = (): PlaytestState => ({ version: 2, current: null, sessions: [], trackingExtraFor: null, lastReadyAt: null });

export class PlaytestRecorder {
  private state: PlaytestState;
  private readonly listeners = new Set<(s: PlaytestState) => void>();

  constructor(
    private readonly store: KeyValueStore,
    private readonly contentVersion: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    const loaded = store.get<PlaytestState>(KEY);
    this.state = loaded && loaded.version === 2 ? loaded : empty();
  }

  get snapshot(): PlaytestState {
    return this.state;
  }

  get current(): PlaytestSession | null {
    return this.state.current;
  }

  subscribe(fn: (s: PlaytestState) => void): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  start(device: PlaytestSession['device']): void {
    const session: PlaytestSession = {
      id: `PT-${this.now().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`,
      contentVersion: this.contentVersion,
      startedAt: this.now().toISOString(),
      finishedAt: null,
      device,
      rounds: [],
      devPanelOpened: false,
      status: 'playing',
      answers: null,
      questionnaireSkipped: false,
      extraRounds: 0,
    };
    this.state = { ...this.state, current: session, trackingExtraFor: null, lastReadyAt: null };
    this.save();
  }

  /** Abandon : la session partielle est conservée (marquée non terminée) pour ne rien perdre. */
  abort(): void {
    const s = this.state.current;
    if (!s) return;
    this.state = { ...this.state, current: null, sessions: [...this.state.sessions, { ...s, status: 'done', finishedAt: null }] };
    this.save();
  }

  clearAll(): void {
    this.state = empty();
    this.save();
  }

  /** Appelé quand un aperçu sans mise est joué pendant une session : n'affecte aucune donnée, sauf ce délai. */
  excludeNextDelay(): void {
    this.state = { ...this.state, skipNextDelay: true };
    this.save();
  }

  markDevPanelOpened(): void {
    const s = this.state.current;
    if (s && s.status === 'playing' && !s.devPanelOpened) {
      this.state = { ...this.state, current: { ...s, devPanelOpened: true } };
      this.save();
    }
  }

  /** Branché sur GameFlow.onRoundComplete. Ignore les replays et les aperçus (aucune mise). */
  onRoundComplete(r: RoundRecord): void {
    if (r.source === 'replay' || r.source === 'dev') return;
    const s = this.state.current;
    if (!s || s.status !== 'playing') {
      this.countExtra();
      this.state = { ...this.state, lastReadyAt: r.readyAt };
      this.save();
      return;
    }
    const branch = r.branchId;
    const variant = r.variant ?? branch;
    const round: PlaytestRound = {
      n: s.rounds.length + 1,
      roundId: r.roundId,
      level: r.level,
      gadget: r.gadgetId,
      outcome: outcomeOf(r),
      resultClass: r.resultClass,
      multiplier: r.multiplier100 / 100,
      branch: r.branchId,
      animationMs: Math.round(r.animationMs),
      roundMs: Math.round(r.readyAt - r.firedAt),
      readyToBetMs:
        this.state.lastReadyAt === null || r.source === 'resume' || this.state.skipNextDelay
          ? null
          : Math.max(0, Math.round(r.firedAt - this.state.lastReadyAt)),
      speed: r.speed,
      skipped: r.skipped,
      bossFight: r.bossFight,
      resumed: r.source === 'resume',
      bet: r.betAmount,
      payout: r.payout,
      variant,
      newBranch: branch !== null && !s.rounds.some((x) => x.branch === branch),
      newVariant: variant !== null && !s.rounds.some((x) => (x.variant ?? x.branch) === variant),
    };
    const rounds = [...s.rounds, round];
    const full = rounds.length >= PLAYTEST_TARGET;
    this.state = {
      ...this.state,
      current: { ...s, rounds, status: full ? 'questionnaire' : 'playing', finishedAt: full ? this.now().toISOString() : null },
      lastReadyAt: r.readyAt,
      skipNextDelay: false,
    };
    this.save();
  }

  submitAnswers(answers: PlaytestAnswers | null): void {
    const s = this.state.current;
    if (!s || s.status !== 'questionnaire') return;
    const done: PlaytestSession = {
      ...s,
      status: 'done',
      answers: answers
        ? {
            scores: PLAYTEST_QUESTIONS.map((_q, i) => {
              const x = answers.scores[i];
              // Jamais de note inventée : une réponse absente reste absente (l'UI ne permet « pas rencontré » que pour Q5).
              if (x === null || x === undefined) return null;
              return Math.min(5, Math.max(1, Math.round(x)));
            }),
            memorable: answers.memorable.trim().slice(0, 1000),
          }
        : null,
      questionnaireSkipped: answers === null,
    };
    this.state = { ...this.state, current: null, sessions: [...this.state.sessions, done], trackingExtraFor: done.id };
    this.save();
  }

  exportJson(sessions: PlaytestSession[] = this.state.sessions): string {
    return JSON.stringify(
      {
        note: 'LOCAL DEV ONLY — BAD BOSS playtest (Mock RGS, fake money). Exported manually by the tester.',
        questions: PLAYTEST_QUESTIONS,
        freeQuestion: PLAYTEST_FREE_QUESTION,
        sessions,
        summaries: sessions.map((x) => ({ id: x.id, ...summarize(x) })),
      },
      null,
      2,
    );
  }

  private countExtra(): void {
    const id = this.state.trackingExtraFor;
    if (!id) return;
    this.state = {
      ...this.state,
      sessions: this.state.sessions.map((x) => (x.id === id ? { ...x, extraRounds: x.extraRounds + 1 } : x)),
    };
  }

  private save(): void {
    this.store.set(KEY, this.state);
    for (const fn of this.listeners) fn(this.state);
  }
}

export interface PlaytestSummary {
  rounds: number;
  byLevel: Record<RageLevelId, number>;
  levelSwitches: number;
  byOutcome: Record<string, number>;
  byBranch: Record<string, number>;
  hitRate: number;
  avgMultiplier: number;
  avgAnimationMs: number;
  medianAnimationMs: number;
  avgRoundMs: number;
  medianReadyToBetMs: number | null;
  avgReadyToBetMs: number | null;
  /** Délai médian avant la mise suivante, selon le résultat de la manche précédente. */
  readyToBetAfter: Record<string, number | null>;
  turboShare: number;
  superShare: number;
  skipShare: number;
  bossFights: number;
  netResult: number;
  scores: (number | null)[] | null;
  /** Nouveauté : branches distinctes vues après 10, 25 et 50 manches ; nouvelles branches entre la 41e et la 50e. */
  distinctBranchesAt: Record<'10' | '25' | '50', number>;
  newBranchesLast10: number;
  distinctVariants: number;
}

const median = (xs: number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
};
const mean = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function summarize(session: PlaytestSession): PlaytestSummary {
  const rounds = session.rounds;
  const byLevel: Record<RageLevelId, number> = { grumpy: 0, furious: 0, unhinged: 0 };
  const byOutcome: Record<string, number> = {};
  const byBranch: Record<string, number> = {};
  const after: Record<string, number[]> = {};
  let switches = 0;
  rounds.forEach((r, i) => {
    byLevel[r.level]++;
    byOutcome[r.outcome] = (byOutcome[r.outcome] ?? 0) + 1;
    const b = r.branch ?? '—';
    byBranch[b] = (byBranch[b] ?? 0) + 1;
    const prev = rounds[i - 1];
    if (prev && prev.level !== r.level) switches++;
    if (prev && r.readyToBetMs !== null) (after[prev.outcome] ??= []).push(r.readyToBetMs);
  });
  const n = rounds.length;
  const ready = rounds.map((r) => r.readyToBetMs).filter((x): x is number => x !== null);
  return {
    rounds: n,
    byLevel,
    levelSwitches: switches,
    byOutcome,
    byBranch,
    hitRate: n ? rounds.filter((r) => r.multiplier > 0).length / n : 0,
    avgMultiplier: n ? rounds.reduce((a, r) => a + r.multiplier, 0) / n : 0,
    avgAnimationMs: mean(rounds.map((r) => r.animationMs)) ?? 0,
    medianAnimationMs: median(rounds.map((r) => r.animationMs)) ?? 0,
    avgRoundMs: mean(rounds.map((r) => r.roundMs)) ?? 0,
    medianReadyToBetMs: median(ready),
    avgReadyToBetMs: mean(ready),
    readyToBetAfter: Object.fromEntries(Object.entries(after).map(([k, v]) => [k, median(v)])),
    turboShare: n ? rounds.filter((r) => r.speed === 'turbo').length / n : 0,
    superShare: n ? rounds.filter((r) => r.speed === 'super').length / n : 0,
    skipShare: n ? rounds.filter((r) => r.skipped).length / n : 0,
    bossFights: rounds.filter((r) => r.bossFight).length,
    netResult: rounds.reduce((a, r) => a + r.payout - r.bet, 0),
    scores: session.answers?.scores ?? null,
    distinctBranchesAt: {
      '10': new Set(rounds.slice(0, 10).map((r) => r.branch)).size,
      '25': new Set(rounds.slice(0, 25).map((r) => r.branch)).size,
      '50': new Set(rounds.slice(0, 50).map((r) => r.branch)).size,
    },
    newBranchesLast10: rounds.slice(40, 50).filter((r, i) => !rounds.slice(0, 40 + i).some((x) => x.branch === r.branch)).length,
    distinctVariants: new Set(rounds.map((r) => r.variant ?? r.branch)).size,
  };
}
