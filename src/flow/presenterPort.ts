import type { Outcome } from '../domain/outcome';
import type { RageLevelId, Speed } from '../domain/types';

/** Ce que GameFlow attend de la présentation. Implémenté par le moteur Pixi (et par un faux dans les tests). */
export interface PresentOptions {
  speed: Speed;
  mode: 'play' | 'resume' | 'recap' | 'replay' | 'preview';
}

export interface PresentationInfo {
  branchId: string;
  sequenceKey: string;
  totalMs: number;
  gadgetId: string;
}

export interface PresentationHandle {
  readonly info: PresentationInfo;
  /** Résolue quand le marqueur « reveal » est atteint (ou immédiatement après un skip). */
  readonly reveal: Promise<void>;
  /** Résolue à la fin de la séquence. */
  readonly done: Promise<void>;
  /** Saute au reveal. Renvoie false si impossible. */
  skipToReveal(): boolean;
}

export interface RoundPresenter {
  /** INTRO + SETUP neutres (identiques pour toutes les issues), avant de connaître le résultat. */
  beginNeutral(level: RageLevelId): void;
  /** Mise refusée de façon CERTAINE : on range le gadget. */
  abortNeutral(): void;
  present(outcome: Outcome, options: PresentOptions): PresentationHandle;
  /** Retour au repos (état READY). */
  toIdle(level: RageLevelId): void;
}
