/**
 * Jalons et récompenses du COLLECTION BOOK (docs/COLLECTION_BOOK.md §E).
 * Récompenses COSMÉTIQUES UNIQUEMENT : aucun free spin, crédit, bonus de mise, multiplicateur ni changement de RTP.
 * Tant que Stake Engine n'a pas confirmé la compatibilité de récompenses persistantes (INFORMATION STAKE ENGINE
 * REQUISE), rien ici n'a ni n'aura de valeur financière — et rien ne dépendra du stockage local, modifiable.
 */
import type { Catalog, CollectionState, CosmeticDef, CosmeticId, MilestoneDef, MilestoneRule, Progress, SectionId } from './types';

export const COSMETICS: readonly CosmeticDef[] = [
  { id: 'mug.okayest', slot: 'mug', name: "MUG: WORLD'S OKAYEST BOSS", description: 'A teal mug for B.B.' },
  { id: 'tie.polka', slot: 'tie', name: 'TIE: POLKA PANIC', description: 'A pink tie. He did not choose it.' },
  { id: 'desk.duck', slot: 'desk', name: 'DESK: RUBBER DUCK', description: 'A rubber duck on your desk. Moral support.' },
  { id: 'ding.deluxe', slot: 'ding', name: 'DING: DING-DONG DELUXE', description: 'A two-tone bell for the elevator and the desk bell.' },
  { id: 'elastic.candy', slot: 'elastic', name: 'SLINGSHOT: CANDY ELASTIC', description: 'A pink elastic for the SWIVEL SLINGSHOT.' },
  { id: 'trapdoor.arctic', slot: 'trapdoor', name: 'TRAPDOOR: ARCTIC BLUE', description: 'A fresh coat of paint for the TRAPDOOR EXPRESS.' },
  { id: 'rocket.retro', slot: 'rocket', name: 'ROCKET: RETRO RED', description: 'Racing stripes for the OFFICE ROCKET.' },
  { id: 'album.arcade', slot: 'album', name: 'ALBUM: ARCADE NIGHT', description: 'A neon cover for this album.' },
  { id: 'album.hallofshame', slot: 'album', name: 'ALBUM: HALL OF SHAME', description: 'A velvet cover for this album.' },
  { id: 'episode.meltdown', slot: 'episode', name: 'SPECIAL EPISODE: OFFICE MELTDOWN', description: 'A showcase with every gag at once. No bet, no payout.' },
];

export const COSMETIC_BY_ID: ReadonlyMap<CosmeticId, CosmeticDef> = new Map(COSMETICS.map((c) => [c.id, c]));

/**
 * Jalon qui débloque OFFICE MELTDOWN. Demande actuelle : 100 % de la collection MVP (médiane ≈ 9 800 manches,
 * voir COLLECTION_BOOK.md §E.3). Pour une règle d'exploration, déplacer 'episode.meltdown' vers un autre jalon.
 */
export const MILESTONES: readonly MilestoneDef[] = [
  { id: 'count-5', label: '5 DISCOVERED', rule: { kind: 'count', n: 5 }, rewards: ['mug.okayest'] },
  { id: 'count-10', label: '10 DISCOVERED', rule: { kind: 'count', n: 10 }, rewards: ['tie.polka'] },
  { id: 'count-25', label: '25 DISCOVERED', rule: { kind: 'count', n: 25 }, rewards: ['desk.duck'] },
  { id: 'half', label: '50 %', rule: { kind: 'fraction', f: 0.5 }, rewards: ['ding.deluxe'] },
  { id: 'full-grumpy', label: '100 % GRUMPY', rule: { kind: 'section', section: 'grumpy' }, rewards: ['elastic.candy'] },
  { id: 'full-furious', label: '100 % FURIOUS', rule: { kind: 'section', section: 'furious' }, rewards: ['trapdoor.arctic'] },
  { id: 'full-unhinged', label: '100 % UNHINGED', rule: { kind: 'section', section: 'unhinged' }, rewards: ['rocket.retro'] },
  { id: 'full-bossfight', label: '100 % BOSS FIGHT', rule: { kind: 'section', section: 'bossfight' }, rewards: ['album.arcade'] },
  { id: 'full-mvp', label: '100 % MVP COLLECTION', rule: { kind: 'all' }, rewards: ['episode.meltdown', 'album.hallofshame'] },
];

export function progress(state: CollectionState, catalog: Catalog): Progress {
  const bySection = {} as Progress['bySection'];
  const byGadget: Progress['byGadget'] = {};
  let discovered = 0;
  for (const s of catalog.sections) bySection[s.id] = { discovered: 0, total: s.total };
  for (const c of catalog.cards) {
    const found = state.entries[c.id] !== undefined;
    const g = (byGadget[`${c.section}/${c.gadgetId}`] ??= { discovered: 0, total: 0 });
    g.total++;
    if (found) {
      discovered++;
      g.discovered++;
      const s = bySection[c.section];
      if (s) s.discovered++;
    }
  }
  return { discovered, total: catalog.cards.length, bySection, byGadget };
}

/** Compteur d'un jalon, pour l'affichage : un fait (« 23 / 25 »), jamais une promesse. */
export function milestoneCounter(rule: MilestoneRule, p: Progress): { current: number; target: number } {
  switch (rule.kind) {
    case 'count':
      return { current: Math.min(p.discovered, rule.n), target: rule.n };
    case 'fraction': {
      const target = Math.ceil(rule.f * p.total);
      return { current: Math.min(p.discovered, target), target };
    }
    case 'section': {
      const s = p.bySection[rule.section as SectionId] ?? { discovered: 0, total: 0 };
      return { current: s.discovered, target: s.total };
    }
    case 'all':
      return { current: p.discovered, target: p.total };
  }
}

export function ruleMet(rule: MilestoneRule, p: Progress): boolean {
  const { current, target } = milestoneCounter(rule, p);
  return target > 0 && current >= target;
}

/** Jalons atteints avec cet état et pas encore enregistrés. */
export function newlyReached(state: CollectionState, catalog: Catalog): MilestoneDef[] {
  const p = progress(state, catalog);
  return MILESTONES.filter((m) => state.milestones[m.id] === undefined && ruleMet(m.rule, p));
}

export function unlockedCosmetics(state: CollectionState): CosmeticDef[] {
  const ids = new Set<CosmeticId>();
  for (const m of MILESTONES) if (state.milestones[m.id] !== undefined) m.rewards.forEach((r) => ids.add(r));
  return COSMETICS.filter((c) => ids.has(c.id));
}

export function isUnlocked(state: CollectionState, id: CosmeticId): boolean {
  return unlockedCosmetics(state).some((c) => c.id === id);
}
