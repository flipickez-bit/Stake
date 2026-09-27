/**
 * PLAYTEST 50 — LOCAL DEV ONLY. (PLAYTEST #3 : même protocole ; en mode « 3 gadgets », le plan et le gadget de chaque
 * manche, les changements de gadget et l'usage de REVEAL OTHER PLANS sont mesurés, et 3 affirmations + 1 question
 * libre s'ajoutent à la fin. En mode classique, rien ne change : les sessions restent comparables aux PLAYTEST #1/#2.)
 * Enregistre localement (localStorage de CE navigateur) des sessions de 50 manches jouées avec le Mock RGS,
 * puis un questionnaire (8 affirmations + 2 champs libres) À LA FIN uniquement. Rien n'est envoyé nulle part : l'export
 * (copier / fichier) est un geste volontaire. Toute collecte future auprès de vrais joueurs devra être
 * traitée à part (information, consentement), hors périmètre de ce mode.
 */
import { meltdownProgress } from '../collection/rewards';
import type { Progress, SectionId } from '../collection/types';
import type { PlanSlot } from '../domain/plans';
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
  'Voir les animations manquantes dans la collection te donne-t-il envie de continuer à jouer ?',
] as const;
/**
 * Questions qui acceptent une absence de réponse, avec son libellé :
 * Q5 (on ne juge pas un gros gain qu'on n'a pas vu), Q8 (on ne juge pas un album qu'on n'a pas ouvert).
 */
export const PLAYTEST_NA_LABEL: Readonly<Record<number, string>> = {
  4: 'Pas rencontré pendant la session',
  7: "Je n'ai pas ouvert la collection",
};
export const PLAYTEST_NA_ALLOWED: readonly number[] = Object.keys(PLAYTEST_NA_LABEL).map(Number);

/**
 * PLAYTEST #3 (mode « 3 gadgets » seulement) : affirmations ajoutées après les 8 premières (mêmes notes de 1 à 5).
 * La 11e mesure une IMPRESSION (les maths A2 sont symétriques : aucun gadget ne rapporte plus) ; une note basse est
 * le résultat attendu. Formulations neutres : aucune promesse, aucun vocabulaire de chance.
 */
export const PLAYTEST3_QUESTIONS = [
  "Les trois gadgets d'un même Rage Level m'ont semblé aussi intéressants les uns que les autres.",
  "J'ai aimé choisir mon gadget avant chaque tir.",
  "J'ai eu l'impression qu'un des gadgets rapportait plus que les autres.",
] as const;
export const PLAYTEST3_FAVORITE_QUESTION = 'Quel gadget as-tu préféré, et pourquoi ?';

/** Affirmations d'une session : les 8 du protocole, plus celles du PLAYTEST #3 si la session se jouait avec les plans. */
export function questionsFor(session: Pick<PlaytestSession, 'plans'> | null): readonly string[] {
  return session?.plans ? [...PLAYTEST_QUESTIONS, ...PLAYTEST3_QUESTIONS] : PLAYTEST_QUESTIONS;
}
export const PLAYTEST_FREE_QUESTION = 'Quel moment t\'a le plus marqué ?';
export const PLAYTEST_WISH_QUESTION = 'Quel élément voudrais-tu débloquer en complétant une collection ?';

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
  /** COLLECTION BOOK : cette manche a ajouté une carte (badge NEW). Absent avant la Phase 0.5C. */
  discovered?: boolean;
  /** PLAYTEST #3 : plan payé (A / B / C) selon le serveur ; absent en mode classique. */
  plan?: PlanSlot | null;
}

/**
 * Progression vers OFFICE MELTDOWN (PRODUCTION : ≥ 3 découvertes avec chacun des 9 gadgets ; compteurs plafonnés).
 * grumpy / furious / unhinged : somme des compteurs plafonnés des trois gadgets du niveau (≤ 9).
 */
export interface MeltdownSnapshot {
  grumpy: number;
  furious: number;
  unhinged: number;
  current: number;
  required: number;
  unlocked: boolean;
  /** Gadgets déjà à leur quota (0 à 9). Absent avant la production 3 gadgets. */
  gadgetsDone?: number;
}

/** Mesures locales du COLLECTION BOOK pendant la session (absent si la collection est désactivée). */
export interface PlaytestCollectionStats {
  /** Progression au début de la session et à la fin de la 50e manche. */
  atStart: { discovered: number; total: number };
  atEnd: { discovered: number; total: number };
  /** Nouvelles cartes découvertes pendant les 50 manches. */
  discoveries: number;
  /** Ouvertures de l'album pendant les 50 manches. */
  opens: number;
  // Champs ajoutés pour le PLAYTEST #2 (absents des sessions antérieures).
  /** Nouvelles cartes par section de l'album. */
  discoveriesBySection?: Record<SectionId, number>;
  /** Manches déjà terminées lors de la 1re ouverture de l'album (0 = avant la 1re manche) ; null = jamais ouvert. */
  firstOpenAfterRound?: number | null;
  /** Chaque ouverture : manches déjà terminées et Rage Level sélectionné à ce moment. */
  openLog?: { afterRound: number; level: RageLevelId }[];
  meltdownAtStart?: MeltdownSnapshot;
  meltdownAtEnd?: MeltdownSnapshot;
  /** Déblocage NATUREL d'OFFICE MELTDOWN pendant la session (jamais forcé, jamais ouvert automatiquement). */
  meltdownUnlock?: {
    roundUnlocked: number;
    rageCountsAtUnlock: Record<RageLevelId, number>;
    collectionCountAtUnlock: number;
  } | null;
  /** OFFICE MELTDOWN lancé par le joueur (choix libre) pendant les 50 manches. */
  episodePlays?: number;
}

const meltdownSnapshot = (p: Progress): MeltdownSnapshot => {
  const m = meltdownProgress(p);
  return { grumpy: m.grumpy, furious: m.furious, unhinged: m.unhinged, current: m.current, required: m.required, unlocked: m.unlocked, gadgetsDone: m.gadgetsDone };
};

export interface PlaytestAnswers {
  /** Notes 1 à 5, dans l'ordre de PLAYTEST_QUESTIONS ; null = « pas rencontré » (seulement si autorisé). */
  scores: (number | null)[];
  memorable: string;
  /** « Quel élément voudrais-tu débloquer… » (facultatif). Absent avant la Phase 0.5C. */
  wish?: string;
  /** PLAYTEST #3 : « Quel gadget as-tu préféré, et pourquoi ? » (facultatif, mode 3 gadgets). */
  favorite?: string;
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
  collection?: PlaytestCollectionStats;
  /** PLAYTEST #3 : la session se joue en choisissant un gadget parmi 3 (Mock). Absent avant le PLAYTEST #3. */
  plans?: boolean;
  /** PLAYTEST #3 : ouvertures de REVEAL OTHER PLANS pendant les 50 manches (jamais proposé en PRIVATE). */
  otherPlans?: { opens: number; afterLoss: number; afterWin: number };
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
  /** Une carte a été découverte au reveal de la manche en cours (reportée sur la manche à sa fin). */
  pendingDiscovery?: boolean;
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

  start(device: PlaytestSession['device'], collection: Progress | null = null, options: { plans?: boolean } = {}): void {
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
      ...(options.plans ? { plans: true, otherPlans: { opens: 0, afterLoss: 0, afterWin: 0 } } : {}),
      ...(collection
        ? {
            collection: {
              atStart: { discovered: collection.discovered, total: collection.total },
              atEnd: { discovered: collection.discovered, total: collection.total },
              discoveries: 0,
              opens: 0,
              discoveriesBySection: { grumpy: 0, furious: 0, unhinged: 0, bossfight: 0 },
              firstOpenAfterRound: null,
              openLog: [],
              meltdownAtStart: meltdownSnapshot(collection),
              meltdownAtEnd: meltdownSnapshot(collection),
              meltdownUnlock: null,
              episodePlays: 0,
            },
          }
        : {}),
    };
    this.state = { ...this.state, current: session, trackingExtraFor: null, lastReadyAt: null, pendingDiscovery: false };
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

  /** COLLECTION BOOK : ouverture de l'album pendant les 50 manches (avec le Rage Level sélectionné à ce moment). */
  markCollectionOpened(level: RageLevelId): void {
    const s = this.state.current;
    if (s?.status !== 'playing' || !s.collection) return;
    const c = s.collection;
    const afterRound = s.rounds.length;
    this.state = {
      ...this.state,
      current: {
        ...s,
        collection: {
          ...c,
          opens: c.opens + 1,
          firstOpenAfterRound: c.firstOpenAfterRound ?? afterRound,
          openLog: [...(c.openLog ?? []), { afterRound, level }],
        },
      },
    };
    this.save();
  }

  /** PLAYTEST #3 : REVEAL OTHER PLANS ouvert (après une perte ou un gain) pendant les 50 manches. Aucune autre conséquence. */
  markOtherPlansOpened(win: boolean): void {
    const s = this.state.current;
    if (s?.status !== 'playing' || !s.otherPlans) return;
    const o = s.otherPlans;
    this.state = { ...this.state, current: { ...s, otherPlans: { opens: o.opens + 1, afterLoss: o.afterLoss + (win ? 0 : 1), afterWin: o.afterWin + (win ? 1 : 0) } } };
    this.save();
  }

  /** OFFICE MELTDOWN lancé par le joueur pendant les 50 manches. */
  markEpisodePlayed(): void {
    const s = this.state.current;
    if (s?.status !== 'playing' || !s.collection) return;
    this.state = { ...this.state, current: { ...s, collection: { ...s.collection, episodePlays: (s.collection.episodePlays ?? 0) + 1 } } };
    this.save();
  }

  /**
   * COLLECTION BOOK : une manche jouée a atteint son reveal (la collection ne compte jamais les replays ni les outils DEV).
   * Enregistre aussi, une seule fois, le déblocage naturel d'OFFICE MELTDOWN (8 / 8 / 8).
   */
  onDiscovery(e: { isNew: boolean; section: SectionId }, progress: Progress): void {
    const s = this.state.current;
    if (s?.status !== 'playing' || !s.collection) return;
    const c = s.collection;
    const melt = meltdownSnapshot(progress);
    const by = c.discoveriesBySection ?? { grumpy: 0, furious: 0, unhinged: 0, bossfight: 0 };
    const unlockNow = !c.meltdownUnlock && c.meltdownAtStart?.unlocked === false && melt.unlocked;
    this.state = {
      ...this.state,
      pendingDiscovery: this.state.pendingDiscovery || e.isNew,
      current: {
        ...s,
        collection: {
          ...c,
          atEnd: { discovered: progress.discovered, total: progress.total },
          discoveriesBySection: e.isNew ? { ...by, [e.section]: by[e.section] + 1 } : by,
          meltdownAtEnd: melt,
          meltdownUnlock: unlockNow
            ? {
                roundUnlocked: s.rounds.length + 1,
                rageCountsAtUnlock: {
                  grumpy: progress.bySection.grumpy?.discovered ?? 0,
                  furious: progress.bySection.furious?.discovered ?? 0,
                  unhinged: progress.bySection.unhinged?.discovered ?? 0,
                },
                collectionCountAtUnlock: progress.discovered,
              }
            : (c.meltdownUnlock ?? null),
        },
      },
    };
    this.save();
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
      ...(s.collection ? { discovered: this.state.pendingDiscovery === true } : {}),
      ...(s.plans ? { plan: r.plans?.selected ?? null } : {}),
    };
    const rounds = [...s.rounds, round];
    const full = rounds.length >= PLAYTEST_TARGET;
    const collection = s.collection && round.discovered ? { ...s.collection, discoveries: s.collection.discoveries + 1 } : s.collection;
    this.state = {
      ...this.state,
      current: { ...s, rounds, collection, status: full ? 'questionnaire' : 'playing', finishedAt: full ? this.now().toISOString() : null },
      lastReadyAt: r.readyAt,
      skipNextDelay: false,
      pendingDiscovery: false,
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
            scores: questionsFor(s).map((_q, i) => {
              const x = answers.scores[i];
              // Jamais de note inventée : une réponse absente reste absente (l'UI ne permet « pas rencontré » que pour Q5).
              if (x === null || x === undefined) return null;
              return Math.min(5, Math.max(1, Math.round(x)));
            }),
            memorable: answers.memorable.trim().slice(0, 1000),
            wish: (answers.wish ?? '').trim().slice(0, 1000),
            ...(s.plans ? { favorite: (answers.favorite ?? '').trim().slice(0, 1000) } : {}),
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
        wishQuestion: PLAYTEST_WISH_QUESTION,
        playtest3Questions: PLAYTEST3_QUESTIONS,
        favoriteQuestion: PLAYTEST3_FAVORITE_QUESTION,
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
  /** Rage Levels joués au moins une fois. */
  levelsUsed: RageLevelId[];
  /** COLLECTION BOOK (null si la collection était désactivée ou session antérieure). */
  collection: PlaytestCollectionStats | null;
  /** Ouvertures de l'album suivies d'une manche, et combien de fois cette manche a changé de Rage Level. */
  levelChangesAfterOpen: { opens: number; changed: number } | null;
  extraRounds: number;
  /** PLAYTEST #3 (null en mode classique) : manches par gadget, changements de gadget dans un même niveau, REVEAL OTHER PLANS. */
  gadgets: {
    byGadget: Record<string, number>;
    byPlan: Record<string, number>;
    /** Gadgets différents joués (sur 9). */
    distinct: number;
    /** Manche suivante au même Rage Level avec un autre gadget. */
    switchesSameLevel: number;
    /** Manche suivante au même Rage Level avec le même gadget (rejouer = un geste). */
    repeatsSameLevel: number;
    otherPlans: { opens: number; afterLoss: number; afterWin: number };
  } | null;
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
    levelsUsed: (Object.keys(byLevel) as RageLevelId[]).filter((lv) => byLevel[lv] > 0),
    collection: session.collection ?? null,
    levelChangesAfterOpen: session.collection?.openLog
      ? session.collection.openLog.reduce(
          (a, o) => {
            const next = rounds[o.afterRound];
            return next ? { opens: a.opens + 1, changed: a.changed + (next.level !== o.level ? 1 : 0) } : a;
          },
          { opens: 0, changed: 0 },
        )
      : null,
    extraRounds: session.extraRounds,
    gadgets: session.plans ? gadgetStats(session) : null,
  };
}

function gadgetStats(session: PlaytestSession): NonNullable<PlaytestSummary['gadgets']> {
  const byGadget: Record<string, number> = {};
  const byPlan: Record<string, number> = {};
  let switches = 0;
  let repeats = 0;
  session.rounds.forEach((r, i) => {
    const g = r.gadget ?? '—';
    byGadget[g] = (byGadget[g] ?? 0) + 1;
    const plan = r.plan ?? '—';
    byPlan[plan] = (byPlan[plan] ?? 0) + 1;
    const prev = session.rounds[i - 1];
    if (prev && prev.level === r.level) {
      if (prev.gadget !== r.gadget) switches++;
      else repeats++;
    }
  });
  return {
    byGadget,
    byPlan,
    distinct: Object.keys(byGadget).filter((g) => g !== '—').length,
    switchesSameLevel: switches,
    repeatsSameLevel: repeats,
    otherPlans: session.otherPlans ?? { opens: 0, afterLoss: 0, afterWin: 0 },
  };
}
