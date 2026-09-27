/**
 * Jalons et récompenses du COLLECTION BOOK (docs/COLLECTION_BOOK.md §E).
 * Récompenses COSMÉTIQUES UNIQUEMENT : aucun free spin, crédit, bonus de mise, multiplicateur ni changement de RTP.
 * Tant que Stake Engine n'a pas confirmé la compatibilité de récompenses persistantes (INFORMATION STAKE ENGINE
 * REQUISE), rien ici n'a ni n'aura de valeur financière — et rien ne dépendra du stockage local, modifiable.
 */
import { gadgetById } from '../content/gadgets';
import { PLAN_SETS } from '../domain/plans';
import { RAGE_LEVEL_IDS } from '../domain/types';
import type { Catalog, CollectionState, CosmeticDef, CosmeticId, CosmeticSlot, MilestoneDef, MilestoneRule, Progress, SectionId } from './types';

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
  { id: 'trophy.collector', slot: 'trophy', name: "COLLECTOR'S TROPHY", description: 'A mark on the album cover for a complete collection.' },
];

/** Emplacements qui ne se « portent » pas : l'épisode se joue, le trophée s'affiche sur l'album. */
export const NON_EQUIPABLE: ReadonlySet<CosmeticSlot> = new Set<CosmeticSlot>(['episode', 'trophy']);

export const COSMETIC_BY_ID: ReadonlyMap<CosmeticId, CosmeticDef> = new Map(COSMETICS.map((c) => [c.id, c]));

/**
 * OFFICE MELTDOWN récompense l'EXPLORATION des 9 gadgets (PRODUCTION 3 GADGETS, décision du 2026-09-27) :
 * au moins MELTDOWN_PER_GADGET découvertes avec CHACUN des neuf gadgets (les trois Rage Levels, les trois plans).
 * Trois gadgets ne suffisent jamais. N choisi par simulation (docs/generated/COLLECTION_REPORT_P3.md).
 * Aucune fréquence de branche n'est modifiée : la règle ne fait que lire ce que le jeu montre déjà.
 */
export const MELTDOWN_PER_GADGET = 4;
export const MELTDOWN_GADGETS: readonly { gadgetId: string; level: (typeof RAGE_LEVEL_IDS)[number]; label: string }[] = RAGE_LEVEL_IDS.flatMap((level) =>
  PLAN_SETS[level].map((gadgetId) => ({ gadgetId, level, label: gadgetById(gadgetId)?.label ?? gadgetId })),
);
export const MELTDOWN_RULE = { kind: 'perGadget', gadgets: MELTDOWN_GADGETS, n: MELTDOWN_PER_GADGET } as const satisfies MilestoneRule;

/** Ancienne règle (P05-C, 3 gadgets) : ≥ 8 découvertes dans chaque Rage Level. Conservée pour les rapports. */
export const LEGACY_MELTDOWN_RULE = { kind: 'perSection', sections: ['grumpy', 'furious', 'unhinged'], n: 8 } as const satisfies MilestoneRule;

/**
 * Jalons. OFFICE MELTDOWN : ≥ 3 découvertes avec chacun des 9 gadgets (les cartes BOSS FIGHT ne sont pas requises).
 * 100 % reste un accomplissement de collectionneur, purement cosmétique (trophée + thème d'album), sans aucune
 * facilité ajoutée. Aucune fréquence de branche n'est modifiée pour l'un ou l'autre.
 */
export const MILESTONES: readonly MilestoneDef[] = [
  { id: 'count-5', label: '5 DISCOVERED', rule: { kind: 'count', n: 5 }, rewards: ['mug.okayest'] },
  { id: 'count-10', label: '10 DISCOVERED', rule: { kind: 'count', n: 10 }, rewards: ['tie.polka'] },
  { id: 'count-25', label: '25 DISCOVERED', rule: { kind: 'count', n: 25 }, rewards: ['desk.duck'] },
  { id: 'half', label: '50 %', rule: { kind: 'fraction', f: 0.5 }, rewards: ['ding.deluxe'] },
  { id: 'explorer', label: 'OFFICE MELTDOWN', rule: MELTDOWN_RULE, rewards: ['episode.meltdown'] },
  { id: 'full-grumpy', label: '100 % GRUMPY', rule: { kind: 'section', section: 'grumpy' }, rewards: ['elastic.candy'] },
  { id: 'full-furious', label: '100 % FURIOUS', rule: { kind: 'section', section: 'furious' }, rewards: ['trapdoor.arctic'] },
  { id: 'full-unhinged', label: '100 % UNHINGED', rule: { kind: 'section', section: 'unhinged' }, rewards: ['rocket.retro'] },
  { id: 'full-bossfight', label: '100 % BOSS FIGHT', rule: { kind: 'section', section: 'bossfight' }, rewards: ['album.arcade'] },
  { id: 'full-mvp', label: '100 % COLLECTION', rule: { kind: 'all' }, rewards: ['trophy.collector', 'album.hallofshame'] },
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
    case 'perSection':
      return sectionCounters(rule, p).reduce((a, c) => ({ current: a.current + c.current, target: a.target + c.target }), { current: 0, target: 0 });
    case 'perGadget':
      return gadgetCounters(rule, p).reduce((a, c) => ({ current: a.current + c.current, target: a.target + c.target }), { current: 0, target: 0 });
    case 'all':
      return { current: p.discovered, target: p.total };
  }
}

/** Détail par section d'une règle `perSection` (plafonné à n) : « GRUMPY 6 / 8 ». */
export function sectionCounters(rule: Extract<MilestoneRule, { kind: 'perSection' }>, p: Progress): { section: SectionId; current: number; target: number; done: boolean }[] {
  return rule.sections.map((section) => {
    const current = Math.min(p.bySection[section]?.discovered ?? 0, rule.n);
    return { section, current, target: rule.n, done: current >= rule.n };
  });
}

/** Détail par gadget d'une règle `perGadget` (plafonné à n) : « ESPRESSO BLASTER 2 / 3 ». Des faits, rien d'autre. */
export function gadgetCounters(rule: Extract<MilestoneRule, { kind: 'perGadget' }>, p: Progress): { gadgetId: string; level: SectionId; label: string; current: number; target: number; done: boolean }[] {
  return rule.gadgets.map((g) => {
    const current = Math.min(p.byGadget[`${g.level}/${g.gadgetId}`]?.discovered ?? 0, rule.n);
    return { gadgetId: g.gadgetId, level: g.level, label: g.label, current, target: rule.n, done: current >= rule.n };
  });
}

/** Progression vers OFFICE MELTDOWN (affichage REWARDS, mesures du PLAYTEST). */
export function meltdownProgress(p: Progress) {
  const byGadget = gadgetCounters(MELTDOWN_RULE, p);
  const count = (id: SectionId) => byGadget.filter((c) => c.level === id).reduce((a, c) => a + c.current, 0);
  const { current, target } = milestoneCounter(MELTDOWN_RULE, p);
  return {
    grumpy: count('grumpy'), furious: count('furious'), unhinged: count('unhinged'),
    current, required: target, unlocked: byGadget.every((c) => c.done), byGadget,
    gadgetsDone: byGadget.filter((c) => c.done).length,
  };
}

export function ruleMet(rule: MilestoneRule, p: Progress): boolean {
  if (rule.kind === 'perSection') return sectionCounters(rule, p).every((c) => c.done);
  if (rule.kind === 'perGadget') return gadgetCounters(rule, p).every((c) => c.done);
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
