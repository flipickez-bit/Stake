/**
 * Persistance du COLLECTION BOOK.
 * LocalCollectionStore : localStorage (repli mémoire). NON SÉCURISÉ : un joueur peut le modifier.
 * Conséquence de conception : aucune récompense ayant une valeur ne dépend de ce stockage.
 * Un futur ServerCollectionStore enverrait des roundId (jamais des branchId) : le serveur recalculerait la branche
 * depuis le book, la sélection étant une fonction pure du book (INFORMATION STAKE ENGINE REQUISE).
 */
import type { KeyValueStore } from '../platform/storage';
import { COSMETIC_BY_ID, MILESTONES } from './rewards';
import type { CollectionEntry, CollectionState, CollectionStore, CosmeticId, CosmeticSlot, MilestoneId } from './types';

export const COLLECTION_KEY = 'badboss.collection.v1';
export const RECENT_ROUNDS = 20;

export function emptyCollection(): CollectionState {
  return { version: 1, entries: {}, milestones: {}, equipped: {}, opens: 0, recentRoundIds: [], rewardsSeen: [] };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Chargement tolérant : données corrompues, version inconnue ou valeurs invalides → ignorées, jamais d'erreur.
 * Les cartes inconnues du contenu actuel sont conservées (une carte retirée ne fait rien perdre).
 */
export function sanitizeCollection(raw: unknown): CollectionState {
  const out = emptyCollection();
  if (!isObj(raw) || raw.version !== 1) return out;
  if (isObj(raw.entries)) {
    for (const [id, e] of Object.entries(raw.entries)) {
      if (!isObj(e)) continue;
      const seen = typeof e.seen === 'number' && Number.isFinite(e.seen) ? Math.max(1, Math.floor(e.seen)) : 1;
      const source = e.source === 'play' || e.source === 'resume' || e.source === 'dev' ? e.source : 'play';
      out.entries[id] = {
        firstSeenAt: typeof e.firstSeenAt === 'string' ? e.firstSeenAt : '',
        firstRoundId: typeof e.firstRoundId === 'string' ? e.firstRoundId : '',
        seen,
        source,
      } satisfies CollectionEntry;
    }
  }
  if (isObj(raw.milestones)) {
    const known = new Set<string>(MILESTONES.map((m) => m.id));
    for (const [id, at] of Object.entries(raw.milestones)) if (known.has(id) && typeof at === 'string') out.milestones[id as MilestoneId] = at;
  }
  if (isObj(raw.equipped)) {
    for (const [slot, id] of Object.entries(raw.equipped)) {
      const c = typeof id === 'string' ? COSMETIC_BY_ID.get(id as CosmeticId) : undefined;
      if (c && c.slot === slot) out.equipped[slot as CosmeticSlot] = c.id;
    }
  }
  out.opens = typeof raw.opens === 'number' && Number.isFinite(raw.opens) ? Math.max(0, Math.floor(raw.opens)) : 0;
  out.recentRoundIds = Array.isArray(raw.recentRoundIds) ? raw.recentRoundIds.filter((x): x is string => typeof x === 'string').slice(-RECENT_ROUNDS) : [];
  // Champ ajouté en Phase 0.6 (absent des sauvegardes plus anciennes : rien n'est « vu »).
  out.rewardsSeen = Array.isArray(raw.rewardsSeen)
    ? [...new Set(raw.rewardsSeen.filter((x): x is CosmeticId => typeof x === 'string' && COSMETIC_BY_ID.has(x as CosmeticId)))]
    : [];
  return out;
}

export class LocalCollectionStore implements CollectionStore {
  readonly kind = 'local' as const;
  constructor(
    private readonly kv: KeyValueStore,
    private readonly key = COLLECTION_KEY,
  ) {}

  async load(): Promise<unknown> {
    return this.kv.get<unknown>(this.key);
  }

  async save(state: CollectionState): Promise<void> {
    this.kv.set(this.key, state);
  }

  async clear(): Promise<void> {
    this.kv.remove(this.key);
  }
}

export class MemoryCollectionStore implements CollectionStore {
  readonly kind = 'memory' as const;
  private data: unknown = null;

  async load(): Promise<unknown> {
    return this.data === null ? null : JSON.parse(JSON.stringify(this.data));
  }

  async save(state: CollectionState): Promise<void> {
    this.data = JSON.parse(JSON.stringify(state));
  }

  async clear(): Promise<void> {
    this.data = null;
  }
}
