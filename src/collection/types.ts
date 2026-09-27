/**
 * COLLECTION BOOK — modèle de données (docs/COLLECTION_BOOK.md §C).
 * La collection OBSERVE les manches jouées ; elle n'est jamais une entrée de la sélection des branches.
 * Dépendances autorisées : collection → content, domain, flow (types), platform/storage. Jamais l'inverse.
 */
import type { RageLevelId } from '../domain/types';
import type { BranchRarity } from '../presentation/types';

/** = BranchDef.id. Stable pour toujours : une branche publiée n'est jamais renommée ni réutilisée. */
export type CardId = string;
export type SectionId = RageLevelId | 'bossfight';

export interface CardDef {
  id: CardId;
  name: string;
  blurb: string;
  /** Indice d'une carte manquante : décrit seulement le setup visible (jamais l'issue ni la rareté). */
  hint: string;
  section: SectionId;
  level: RageLevelId;
  gadgetId: string;
  gadgetLabel: string;
  /** Rareté de PRÉSENTATION : fréquence de choix parmi les animations d'un même résultat. */
  rarity: BranchRarity;
  order: number;
}

export interface SectionDef {
  id: SectionId;
  label: string;
  gadgets: { gadgetId: string; label: string; cardIds: CardId[] }[];
  total: number;
}

export interface Catalog {
  version: string;
  cards: readonly CardDef[];
  byId: ReadonlyMap<CardId, CardDef>;
  sections: readonly SectionDef[];
}

export type DiscoverySource = 'play' | 'resume' | 'dev';

export interface CollectionEntry {
  firstSeenAt: string;
  firstRoundId: string;
  /** Manches (dédoublonnées par roundId) où cette animation a été vue. */
  seen: number;
  /** 'dev' : outils de test du DEV PANEL. */
  source: DiscoverySource;
}

export type MilestoneId =
  | 'count-5'
  | 'count-10'
  | 'count-25'
  | 'half'
  | 'full-grumpy'
  | 'full-furious'
  | 'full-unhinged'
  | 'full-bossfight'
  | 'full-mvp'
  /** OFFICE MELTDOWN : explorer les trois Rage Levels (cartes BOSS FIGHT non requises). */
  | 'explorer';

export type MilestoneRule =
  | { kind: 'count'; n: number }
  | { kind: 'fraction'; f: number }
  | { kind: 'section'; section: SectionId }
  /** Au moins n découvertes dans CHACUNE des sections (compteur plafonné à n par section). */
  | { kind: 'perSection'; sections: readonly SectionId[]; n: number }
  | { kind: 'all' };

export type CosmeticId =
  | 'mug.okayest'
  | 'tie.polka'
  | 'desk.duck'
  | 'ding.deluxe'
  | 'elastic.candy'
  | 'trapdoor.arctic'
  | 'rocket.retro'
  | 'album.arcade'
  | 'album.hallofshame'
  | 'episode.meltdown'
  | 'trophy.collector';

export type CosmeticSlot = 'mug' | 'tie' | 'desk' | 'ding' | 'elastic' | 'trapdoor' | 'rocket' | 'album' | 'episode' | 'trophy';

export interface CosmeticDef {
  id: CosmeticId;
  slot: CosmeticSlot;
  name: string;
  description: string;
}

export interface MilestoneDef {
  id: MilestoneId;
  label: string;
  rule: MilestoneRule;
  rewards: CosmeticId[];
}

export interface CollectionState {
  version: 1;
  entries: Record<CardId, CollectionEntry>;
  /** Jalons atteints (date). Un jalon atteint le reste, même si le catalogue grandit. */
  milestones: Partial<Record<MilestoneId, string>>;
  /** Cosmétique porté par emplacement (absent = aspect par défaut). */
  equipped: Partial<Record<CosmeticSlot, CosmeticId>>;
  /** Ouvertures de l'album (mesure locale). */
  opens: number;
  /** Dernières manches observées : une reprise après le reveal ne compte pas deux fois. */
  recentRoundIds: string[];
  /** Phase 0.6 : récompenses déjà vues (onglet REWARDS ouvert) — la notification « NEW REWARD » s'éteint. */
  rewardsSeen: CosmeticId[];
  /** POC « 3 PLANS » : nombre de manches jouées par gadget choisi (absent hors POC). Aucun effet sur le jeu. */
  gadgetPicks?: Record<string, number>;
}

/** Persistance interchangeable : LocalCollectionStore aujourd'hui, ServerCollectionStore peut-être demain. */
export interface CollectionStore {
  readonly kind: 'local' | 'memory' | 'server';
  load(): Promise<unknown>;
  save(state: CollectionState): Promise<void>;
  clear(): Promise<void>;
}

export interface Progress {
  discovered: number;
  total: number;
  bySection: Record<SectionId, { discovered: number; total: number }>;
  byGadget: Record<string, { discovered: number; total: number }>;
}

export interface DiscoveryEvent {
  card: CardDef;
  isNew: boolean;
  roundId: string;
  source: DiscoverySource;
  /** Issue de la manche (la collection ne s'en sert que pour l'option « pas de badge après une perte »). */
  loss: boolean;
  progress: { discovered: number; total: number };
  /** Jalons atteints par CETTE découverte. */
  milestones: MilestoneDef[];
  unlocked: CosmeticDef[];
}
