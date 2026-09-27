/**
 * Service COLLECTION BOOK : état en mémoire, persistance par un CollectionStore, événements de découverte.
 * Il OBSERVE des manches déjà décidées et déjà présentées : il n'a aucun moyen d'influencer une branche
 * (il ne connaît ni compileSequence, ni le Presenter, ni le book).
 */
import { newlyReached, progress, unlockedCosmetics, COSMETIC_BY_ID, MILESTONES, NON_EQUIPABLE } from './rewards';
import { emptyCollection, RECENT_ROUNDS, sanitizeCollection } from './store';
import type {
  CardDef,
  Catalog,
  CollectionState,
  CollectionStore,
  CosmeticDef,
  CosmeticId,
  CosmeticSlot,
  DiscoveryEvent,
  DiscoverySource,
  Progress,
  SectionId,
} from './types';

/** Source de hasard des outils DEV (jamais utilisée pour une vraie découverte). */
type RandomSource = () => number;

export interface ObservedRound {
  roundId: string;
  branchId: string;
  source: 'play' | 'resume';
  loss: boolean;
  /** POC « 3 PLANS » : plan choisi et gadget effectivement JOUÉ (absent hors POC). */
  plan?: 'A' | 'B' | 'C';
  gadgetId?: string;
}

export class Collection {
  private s: CollectionState = emptyCollection();
  private readonly listeners = new Set<(s: CollectionState) => void>();
  private readonly discoveryListeners = new Set<(e: DiscoveryEvent) => void>();
  private saving: Promise<void> = Promise.resolve();
  private devCounter = 0;

  constructor(
    private readonly store: CollectionStore,
    readonly catalog: Catalog,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Charge l'état persistant. Toute erreur de stockage → collection vide, jamais de blocage du jeu. */
  async init(): Promise<void> {
    try {
      this.s = sanitizeCollection(await this.store.load());
    } catch {
      this.s = emptyCollection();
    }
    // Jalons déjà satisfaits mais pas encore enregistrés (règle changée, catalogue modifié) : enregistrés sans badge.
    if (this.reachMilestones(this.now().toISOString()).length > 0) this.commit();
    else this.emit();
  }

  get state(): CollectionState {
    return this.s;
  }

  get progress(): Progress {
    return progress(this.s, this.catalog);
  }

  get unlocked(): CosmeticDef[] {
    return unlockedCosmetics(this.s);
  }

  subscribe(fn: (s: CollectionState) => void): () => void {
    this.listeners.add(fn);
    fn(this.s);
    return () => this.listeners.delete(fn);
  }

  onDiscovery(fn: (e: DiscoveryEvent) => void): () => void {
    this.discoveryListeners.add(fn);
    return () => this.discoveryListeners.delete(fn);
  }

  isDiscovered(id: string): boolean {
    return this.s.entries[id] !== undefined;
  }

  /**
   * Une manche jouée (ou reprise) a atteint son reveal. Idempotent par roundId.
   * Renvoie l'événement (null si la branche n'est pas une carte : repli de contenu, etc.).
   */
  observe(round: ObservedRound): DiscoveryEvent | null {
    if (this.s.recentRoundIds.includes(round.roundId)) return null;
    const card = this.catalog.byId.get(round.branchId);
    // POC « 3 PLANS » : on enregistre simplement quel gadget a été choisi (une fois par manche). Seule l'animation
    // réellement jouée peut être découverte : une alternative non jouée n'arrive jamais ici.
    if (round.plan && round.gadgetId) {
      const picks = { ...(this.s.gadgetPicks ?? {}) };
      picks[round.gadgetId] = (picks[round.gadgetId] ?? 0) + 1;
      this.s = { ...this.s, gadgetPicks: picks };
      if (!card) {
        this.s = { ...this.s, recentRoundIds: [...this.s.recentRoundIds, round.roundId].slice(-RECENT_ROUNDS) };
        this.commit();
        return null;
      }
    }
    if (!card) return null;
    return this.record(card, round.roundId, round.source, round.loss);
  }

  markOpened(): void {
    this.s = { ...this.s, opens: this.s.opens + 1 };
    this.commit();
  }

  /** Récompenses débloquées mais pas encore vues (notification « NEW REWARD »). */
  get unseenRewards(): CosmeticDef[] {
    const seen = new Set(this.s.rewardsSeen);
    return this.unlocked.filter((c) => !seen.has(c.id));
  }

  /** L'onglet REWARDS a été ouvert : toutes les récompenses débloquées sont vues. */
  markRewardsSeen(): void {
    const ids = this.unlocked.map((c) => c.id);
    if (ids.every((id) => this.s.rewardsSeen.includes(id))) return;
    this.s = { ...this.s, rewardsSeen: [...new Set([...this.s.rewardsSeen, ...ids])] };
    this.commit();
  }

  /** Porter / retirer un cosmétique débloqué. `null` = aspect par défaut. */
  equip(slot: CosmeticSlot, id: CosmeticId | null): void {
    const equipped = { ...this.s.equipped };
    if (id === null) delete equipped[slot];
    else {
      const c = COSMETIC_BY_ID.get(id);
      if (!c || c.slot !== slot || NON_EQUIPABLE.has(slot) || !this.unlocked.some((u) => u.id === id)) return;
      equipped[slot] = id;
    }
    this.s = { ...this.s, equipped };
    this.commit();
  }

  // ------------------------------------------------------------------ DEV PANEL (jamais en production)

  async reset(): Promise<void> {
    this.s = emptyCollection();
    await this.store.clear().catch(() => undefined);
    this.emit();
  }

  unlockAll(): void {
    this.setDiscovered(this.catalog.cards.map((c) => c.id));
  }

  unlockRandom(n: number, rnd: RandomSource): void {
    const missing = this.catalog.cards.filter((c) => !this.isDiscovered(c.id)).map((c) => c.id);
    const found = this.catalog.cards.filter((c) => this.isDiscovered(c.id)).map((c) => c.id);
    this.setDiscovered([...found, ...shuffle(missing, rnd).slice(0, n)]);
  }

  /** Exactement n cartes découvertes (tirées au hasard), jalons recalculés. */
  setDiscoveredCount(n: number, rnd: RandomSource): void {
    this.s = { ...this.s, entries: {}, milestones: {}, equipped: {} };
    this.setDiscovered(shuffle(this.catalog.cards.map((c) => c.id), rnd).slice(0, n));
  }

  /**
   * Exactement n cartes découvertes dans chaque section indiquée (les autres sections vides), jalons recalculés.
   * Sert à tester le passage à 8 / 8 / 8 d'OFFICE MELTDOWN.
   */
  setSectionCounts(counts: Partial<Record<SectionId, number>>, rnd: RandomSource): void {
    const ids: string[] = [];
    for (const [section, n] of Object.entries(counts)) {
      const inSection = this.catalog.cards.filter((c) => c.section === section).map((c) => c.id);
      ids.push(...shuffle(inSection, rnd).slice(0, n));
    }
    this.s = { ...this.s, entries: {}, milestones: {}, equipped: {} };
    this.setDiscovered(ids);
  }

  /**
   * Découvre une carte manquante au hasard par le même chemin qu'une vraie découverte (badge compris),
   * de préférence dans la section indiquée (ex. le Rage Level courant).
   */
  forceNewDiscovery(rnd: RandomSource, prefer?: SectionId): DiscoveryEvent | null {
    const all = this.catalog.cards.filter((c) => !this.isDiscovered(c.id));
    const preferred = prefer ? all.filter((c) => c.section === prefer) : [];
    const missing = preferred.length > 0 ? preferred : all;
    if (missing.length === 0) return null;
    const card = missing[Math.floor(rnd() * missing.length)] as CardDef;
    return this.record(card, `DEV-NEW-${++this.devCounter}`, 'dev', false);
  }

  // ------------------------------------------------------------------ interne

  private record(card: CardDef, roundId: string, source: DiscoverySource, loss: boolean): DiscoveryEvent {
    const at = this.now().toISOString();
    const prev = this.s.entries[card.id];
    const isNew = prev === undefined;
    const entries = {
      ...this.s.entries,
      [card.id]: isNew ? { firstSeenAt: at, firstRoundId: roundId, seen: 1, source } : { ...prev, seen: prev.seen + 1 },
    };
    this.s = { ...this.s, entries, recentRoundIds: [...this.s.recentRoundIds, roundId].slice(-RECENT_ROUNDS) };
    const reached = this.reachMilestones(at);
    const unlocked = reached.flatMap((m) => m.rewards.map((r) => COSMETIC_BY_ID.get(r)).filter((c): c is CosmeticDef => !!c));
    this.commit();
    const p = this.progress;
    const event: DiscoveryEvent = { card, isNew, roundId, source, loss, progress: { discovered: p.discovered, total: p.total }, milestones: reached, unlocked };
    for (const fn of this.discoveryListeners) fn(event);
    return event;
  }

  /** Enregistre les jalons nouvellement atteints et porte automatiquement leurs cosmétiques (désactivables). */
  private reachMilestones(at: string) {
    const reached = newlyReached(this.s, this.catalog);
    if (reached.length === 0) return reached;
    const milestones = { ...this.s.milestones };
    const equipped = { ...this.s.equipped };
    for (const m of reached) {
      milestones[m.id] = at;
      for (const r of m.rewards) {
        const c = COSMETIC_BY_ID.get(r);
        if (c && !NON_EQUIPABLE.has(c.slot)) equipped[c.slot] = c.id;
      }
    }
    this.s = { ...this.s, milestones, equipped };
    return reached;
  }

  private setDiscovered(ids: string[]): void {
    const at = this.now().toISOString();
    const entries: CollectionState['entries'] = {};
    for (const id of ids) entries[id] = this.s.entries[id] ?? { firstSeenAt: at, firstRoundId: `DEV-SET-${++this.devCounter}`, seen: 1, source: 'dev' };
    // Jalons recalculés depuis zéro : l'état DEV reste cohérent (49/51 = pas de 100 %).
    this.s = { ...this.s, entries, milestones: {}, equipped: {} };
    this.reachMilestones(at);
    this.commit();
  }

  private commit(): void {
    const snapshot = this.s;
    // Écritures sérialisées : l'ordre est conservé même avec un store asynchrone.
    this.saving = this.saving.then(() => this.store.save(snapshot)).catch(() => undefined);
    this.emit();
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.s);
  }

  /** Attendre la fin des écritures (tests). */
  flush(): Promise<void> {
    return this.saving;
  }
}

function shuffle<T>(xs: readonly T[], rnd: RandomSource): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/** Jalons dans l'ordre d'affichage (REWARDS). */
export const MILESTONE_LIST = MILESTONES;
