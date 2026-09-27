/**
 * COLLECTION BOOK (Phase 0.5C) — la collection OBSERVE, elle n'influence jamais.
 * - Catalogue : une carte par branche, textes complets, indices sans information sur l'issue.
 * - Textes : des faits uniquement (aucune formulation de proximité ou de « dû »).
 * - Observation : seules les manches jouées / reprises au reveal comptent ; jamais un replay.
 * - Déterminisme : même book → même séquence, collection vide ou pleine ; aucune dépendance inverse.
 * Avec COLLECTION_REPORT=<fichier>, écrit aussi docs/generated/COLLECTION_REPORT.md.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import policy from '../../config/presentation_policy.json';
import { buildCatalog, isBossFightBranch } from '../../src/collection/catalog';
import { Collection } from '../../src/collection/Collection';
import { COPY, FORBIDDEN_PHRASES, NEW_TITLE, RARITY_LABEL } from '../../src/collection/copy';
import { COSMETICS, MELTDOWN_PER_GADGET as N, MELTDOWN_RULE, MILESTONES, meltdownProgress, milestoneCounter, progress } from '../../src/collection/rewards';
import { LocalCollectionStore, MemoryCollectionStore, sanitizeCollection } from '../../src/collection/store';
import { attachCollectionTracker, shouldObserve } from '../../src/collection/tracker';
import { CARD_TEXTS, SETUP_HINTS } from '../../src/content/collectionCards';
import { GADGETS } from '../../src/content/gadgets';

/** PRODUCTION 3 GADGETS : 9 gadgets, 147 cartes (129 de Rage Level + 18 BOSS FIGHT). */
const TOTAL = GADGETS.reduce((n, g) => n + g.branches.length, 0);
const ALL_GADGETS_AT = (n: number) => Object.fromEntries(GADGETS.map((g) => [g.id, n]));
import { classify } from '../../src/domain/resultClass';
import { mulberry32 } from '../../src/domain/seed';
import { PLAN_SETS } from '../../src/domain/plans';
import type { RageLevelId, ResultClass, Script } from '../../src/domain/types';
import { GameFlow, type FlowSnapshot } from '../../src/flow/GameFlow';
import { MockRgsAdapter } from '../../src/platform/rgs/mock/MockRgsAdapter';
import { distributionTable } from '../../src/platform/rgs/mock/mockMath';
import { createMemoryStore } from '../../src/platform/storage';
import { branchProbabilities } from '../../src/presentation/compileSequence';
import { Presenter, type AudioSink, type SceneSink } from '../../src/presenter/Presenter';
import { createMock, waitFor } from './helpers';
import { OFFICE_MELTDOWN } from '../../src/content/showcase';
import { CHARACTER_ANIMS } from '../../src/content/office';
import { ALL_GADGET_PROPS } from '../../src/content/gadgets';
import { compileShowcase } from '../../src/presentation/compileSequence';

const catalog = buildCatalog(GADGETS);
const fixedNow = () => new Date('2026-09-26T10:00:00Z');
const newCollection = () => new Collection(new MemoryCollectionStore(), catalog, fixedNow);
const isLossCard = (id: string) => GADGETS.flatMap((g) => g.branches).find((b) => b.id === id)!.classes.includes('MISS');

describe('catalogue', () => {
  it('une carte par branche, identifiants et noms uniques ; RAGE LEVEL → GADGET → ANIMATIONS (46 / 41 / 42 + 18 BOSS FIGHT)', () => {
    const branches = GADGETS.flatMap((g) => g.branches);
    expect(catalog.cards.map((c) => c.id)).toEqual(branches.map((b) => b.id));
    expect(new Set(catalog.cards.map((c) => c.name)).size).toBe(catalog.cards.length);
    const totals = Object.fromEntries(catalog.sections.map((s) => [s.id, s.total]));
    expect(totals).toEqual({ grumpy: 46, furious: 41, unhinged: 42, bossfight: 18 });
    expect(catalog.cards).toHaveLength(147);
    // Chaque onglet de Rage Level range ses cartes par gadget (les 3 plans du niveau), avec leur propre compteur.
    for (const s of catalog.sections.filter((x) => x.id !== 'bossfight')) expect(s.gadgets.map((g) => g.gadgetId)).toHaveLength(3);
    expect(catalog.sections.find((x) => x.id === 'bossfight')!.gadgets).toHaveLength(9);
    for (const b of branches) {
      expect(CARD_TEXTS[b.id], `texte manquant : ${b.id}`).toBeDefined();
      expect(CARD_TEXTS[b.id]!.blurb.length, b.id).toBeGreaterThan(8);
    }
    expect(Object.keys(CARD_TEXTS).sort()).toEqual(branches.map((b) => b.id).sort());
  });

  it("l'indice d'une carte manquante ne dit rien de l'issue : il décrit le setup, partagé par des pertes ET des gains", () => {
    for (const g of GADGETS) {
      for (const b of g.branches) {
        const card = catalog.byId.get(b.id)!;
        expect(card.hint, b.id).toBe(SETUP_HINTS[g.id]![b.path[0]!]);
      }
      const bySetup = new Map<string, string[]>();
      for (const b of g.branches.filter((x) => !isBossFightBranch(x))) bySetup.set(b.path[0]!, [...(bySetup.get(b.path[0]!) ?? []), b.id]);
      for (const [setup, ids] of bySetup) {
        expect(ids.some(isLossCard), `${g.id} ${setup} : aucune perte`).toBe(true);
        expect(ids.some((id) => !isLossCard(id)), `${g.id} ${setup} : aucun gain`).toBe(true);
      }
    }
  });
});

describe('textes : des faits uniquement', () => {
  const texts = (): string[] => {
    const out: string[] = [];
    const walk = (v: unknown) => {
      if (typeof v === 'string') out.push(v);
      else if (typeof v === 'function') out.push(String((v as (...a: number[]) => string)(23, 51)));
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(COPY);
    walk(NEW_TITLE);
    walk(RARITY_LABEL);
    for (const c of catalog.cards) out.push(c.name, c.blurb, c.hint);
    for (const c of COSMETICS) out.push(c.name, c.description);
    for (const m of MILESTONES) out.push(m.label);
    // Textes écrits en dur dans les composants de la collection.
    const dir = 'src/app/collection';
    for (const f of readdirSync(dir)) if (f.endsWith('.svelte')) out.push(readFileSync(join(dir, f), 'utf8').replace(/<style[\s\S]*?<\/style>/g, ''));
    return out;
  };

  it('aucune formulation de proximité, de « dû », de chance ni de bonus', () => {
    for (const t of texts()) {
      for (const phrase of FORBIDDEN_PHRASES) {
        expect(new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\']/g, '\\$&')}\\b`, 'i').test(t), `« ${phrase} » dans : ${t.slice(0, 80)}`).toBe(false);
      }
    }
  });

  it('la rareté est présentée comme une rareté d\'ANIMATION, sans lien avec les résultats', () => {
    expect(COPY.rarityLegend).toMatch(/same result/);
    expect(COPY.rarityLegend).toMatch(/never changes results or odds/);
  });
});

describe('observation : seules les manches jouées comptent', () => {
  const base = (patch: Partial<FlowSnapshot>): FlowSnapshot =>
    ({
      state: 'REVEAL',
      revealed: { roundId: 'R1', multiplier100: 0, payout: 0, resultClass: 'MISS' },
      round: { roundId: 'R1', mode: 'grumpy', source: 'play' },
      presentation: { branchId: 'SLG-A1', sequenceKey: 'k', totalMs: 1, gadgetId: 'swivel-slingshot' },
      ...patch,
    }) as FlowSnapshot;

  it('REVEAL d\'une mise ou d\'une reprise → observée ; replay, aperçu, présentation en cours → jamais', () => {
    expect(shouldObserve(base({}))).toEqual({ roundId: 'R1', branchId: 'SLG-A1', source: 'play', loss: true });
    expect(shouldObserve(base({ round: { roundId: 'R1', mode: 'grumpy', source: 'resume' } }))?.source).toBe('resume');
    expect(shouldObserve(base({ state: 'REPLAYING', round: { roundId: 'R1', mode: 'grumpy', source: 'replay' } }))).toBeNull();
    expect(shouldObserve(base({ round: { roundId: 'R1', mode: 'grumpy', source: 'replay' } }))).toBeNull();
    expect(shouldObserve(base({ round: { roundId: 'R1', mode: 'grumpy', source: 'dev' } }))).toBeNull();
    expect(shouldObserve(base({ state: 'PRESENTING', revealed: null }))).toBeNull();
    expect(shouldObserve(base({ state: 'READY' }))).toBeNull();
  });

  it('nouvelle carte, doublon, même manche vue deux fois (reprise après le reveal), carte inconnue', () => {
    const c = newCollection();
    const first = c.observe({ roundId: 'R1', branchId: 'SLG-A1', source: 'play', loss: true });
    expect(first?.isNew).toBe(true);
    expect(first?.progress).toEqual({ discovered: 1, total: TOTAL });
    expect(c.observe({ roundId: 'R1', branchId: 'SLG-A1', source: 'resume', loss: true })).toBeNull();
    const again = c.observe({ roundId: 'R2', branchId: 'SLG-A1', source: 'play', loss: true });
    expect(again?.isNew).toBe(false);
    expect(c.state.entries['SLG-A1']?.seen).toBe(2);
    expect(c.observe({ roundId: 'R3', branchId: 'FALLBACK', source: 'play', loss: true })).toBeNull();
  });

  it('jalons : 5 et 10 découvertes débloquent (et portent) leurs cosmétiques ; N × 9 gadgets débloque OFFICE MELTDOWN ; 100 % = trophée', () => {
    const c = newCollection();
    const events = catalog.cards.map((card, i) => c.observe({ roundId: `R${i}`, branchId: card.id, source: 'play', loss: false })!);
    expect(events[4]!.milestones.map((m) => m.id)).toEqual(['count-5']);
    expect(events[4]!.unlocked.map((u) => u.id)).toEqual(['mug.okayest']);
    expect(events[9]!.unlocked.map((u) => u.id)).toEqual(['tie.polka']);
    expect(c.state.equipped).toMatchObject({ mug: 'mug.okayest', tie: 'tie.polka' });
    // OFFICE MELTDOWN : débloqué par la découverte qui porte le 9e gadget à N (pas par le 100 %).
    const meltIndex = events.findIndex((e) => e.milestones.some((m) => m.id === 'explorer'));
    expect(meltIndex).toBeGreaterThan(0);
    expect(events[meltIndex]!.unlocked.map((u) => u.id)).toEqual(['episode.meltdown']);
    const counts = (upTo: number) => {
      const seen = catalog.cards.slice(0, upTo + 1).filter((x) => x.section !== 'bossfight');
      return GADGETS.map((g) => seen.filter((x) => x.gadgetId === g.id).length);
    };
    expect(Math.min(...counts(meltIndex))).toBe(N);
    expect(Math.min(...counts(meltIndex - 1))).toBe(N - 1);
    // 100 % : trophée et thème d'album, rien d'autre (aucune valeur, aucun avantage).
    const full = events[TOTAL - 1]!;
    expect(full.milestones.map((m) => m.id)).toContain('full-mvp');
    const fullRewards = MILESTONES.find((m) => m.id === 'full-mvp')!.rewards;
    expect([...fullRewards].sort()).toEqual(['album.hallofshame', 'trophy.collector']);
    expect(full.unlocked.map((u) => u.id)).toEqual(expect.arrayContaining(['album.hallofshame', 'trophy.collector']));
    expect(full.unlocked.map((u) => u.id)).not.toContain('episode.meltdown');
    // Le trophée et l'épisode ne se « portent » pas.
    c.equip('trophy', 'trophy.collector');
    c.equip('episode', 'episode.meltdown');
    expect(c.state.equipped.trophy).toBeUndefined();
    expect(c.state.equipped.episode).toBeUndefined();
    expect(Object.keys(c.state.milestones).sort()).toEqual(MILESTONES.map((m) => m.id).sort());
    // Retirer un cosmétique, puis le remettre.
    c.equip('mug', null);
    expect(c.state.equipped.mug).toBeUndefined();
    c.equip('mug', 'mug.okayest');
    expect(c.state.equipped.mug).toBe('mug.okayest');
  });

  it('OFFICE MELTDOWN : ≥ N avec CHACUN des 9 gadgets ; trois gadgets ne suffisent JAMAIS ; BOSS FIGHT non requis ; compteur factuel', () => {
    const c = newCollection();
    // Trois gadgets explorés à 100 % (un par Rage Level, ou les trois d'un niveau) : jamais de déblocage.
    const three = ['swivel-slingshot', 'trapdoor-express', 'office-rocket'];
    c.setGadgetCounts(Object.fromEntries(three.map((id) => [id, 99])), mulberry32(2));
    expect(c.progress.discovered).toBeGreaterThan(40);
    expect(c.state.milestones.explorer).toBeUndefined();
    expect(meltdownProgress(c.progress)).toMatchObject({ current: 3 * N, required: 9 * N, unlocked: false, gadgetsDone: 3 });
    c.setGadgetCounts({ 'swivel-slingshot': 99, 'espresso-blaster': 99, 'copier-catapult': 99 }, mulberry32(3));
    expect(c.state.milestones.explorer).toBeUndefined();
    // 8 gadgets à N et un à N − 1, sans aucune carte BOSS FIGHT, puis une découverte avec ce gadget.
    c.setGadgetCounts({ ...ALL_GADGETS_AT(N), 'hvac-hurricane': N - 1 }, mulberry32(4));
    expect(milestoneCounter(MELTDOWN_RULE, c.progress)).toEqual({ current: 9 * N - 1, target: 9 * N });
    expect(meltdownProgress(c.progress).byGadget.find((g) => g.gadgetId === 'hvac-hurricane')).toMatchObject({ current: N - 1, target: N, done: false });
    const e = c.forceNewDiscovery(mulberry32(5), 'unhinged', 'hvac-hurricane');
    expect(e?.card.gadgetId).toBe('hvac-hurricane');
    expect(e?.milestones.map((m) => m.id)).toEqual(['explorer']);
    expect(c.unlocked.map((u) => u.id)).toContain('episode.meltdown');
    expect(c.progress.bySection.bossfight.discovered).toBe(0);
  });

  it('jalon satisfait mais non enregistré (règle changée) → enregistré au chargement, sans badge', async () => {
    const store = new MemoryCollectionStore();
    const a = new Collection(store, catalog, fixedNow);
    a.setGadgetCounts(ALL_GADGETS_AT(N), mulberry32(5));
    const raw = JSON.parse(JSON.stringify(a.state));
    delete raw.milestones.explorer;
    await store.save(raw);
    const b = new Collection(store, catalog, fixedNow);
    let events = 0;
    b.onDiscovery(() => events++);
    await b.init();
    expect(b.state.milestones.explorer).toBeDefined();
    expect(events).toBe(0);
  });

  it('un cosmétique non débloqué ne peut pas être porté', () => {
    const c = newCollection();
    c.equip('rocket', 'rocket.retro');
    expect(c.state.equipped.rocket).toBeUndefined();
  });

  it('compteurs de jalons : des faits (« 23 / 25 »), 50 % = 74 / 147', () => {
    const c = newCollection();
    c.setDiscoveredCount(23, mulberry32(1));
    const p = progress(c.state, catalog);
    expect(milestoneCounter({ kind: 'count', n: 25 }, p)).toEqual({ current: 23, target: 25 });
    expect(milestoneCounter({ kind: 'fraction', f: 0.5 }, p)).toEqual({ current: 23, target: 74 });
  });
});

describe('stockage (localStorage NON sécurisé, chargement tolérant)', () => {
  it('persistance et rechargement : même état, et une manche déjà comptée ne recompte pas après rechargement', async () => {
    const kv = createMemoryStore();
    const a = new Collection(new LocalCollectionStore(kv), catalog, fixedNow);
    await a.init();
    a.observe({ roundId: 'R9', branchId: 'TRP-B1', source: 'play', loss: true });
    await a.flush();
    const b = new Collection(new LocalCollectionStore(kv), catalog, fixedNow);
    await b.init();
    expect(b.isDiscovered('TRP-B1')).toBe(true);
    expect(b.observe({ roundId: 'R9', branchId: 'TRP-B1', source: 'resume', loss: true })).toBeNull();
  });

  it('données corrompues ou modifiées à la main → valeurs invalides ignorées, jamais d\'erreur', () => {
    expect(sanitizeCollection(null).entries).toEqual({});
    expect(sanitizeCollection('garbage').version).toBe(1);
    expect(sanitizeCollection({ version: 99, entries: { 'SLG-A1': {} } }).entries).toEqual({});
    const s = sanitizeCollection({
      version: 1,
      entries: { 'SLG-A1': { seen: 'lots', source: 'hack' }, 'OLD-X9': { seen: 3, source: 'play', firstSeenAt: 'x', firstRoundId: 'y' }, bad: 5 },
      milestones: { 'count-5': '2026', 'fake-id': '2026' },
      equipped: { mug: 'rocket.retro', tie: 'tie.polka' },
      opens: -4,
      recentRoundIds: ['a', 7, 'b'],
    });
    expect(s.entries['SLG-A1']).toEqual({ firstSeenAt: '', firstRoundId: '', seen: 1, source: 'play' });
    expect(s.entries['OLD-X9']?.seen).toBe(3); // carte retirée du contenu : conservée, ignorée par la progression
    expect(s.entries.bad).toBeUndefined();
    expect(s.milestones).toEqual({ 'count-5': '2026' });
    expect(s.equipped).toEqual({ tie: 'tie.polka' });
    expect(s.opens).toBe(0);
    expect(s.recentRoundIds).toEqual(['a', 'b']);
    expect(progress(s, catalog).discovered).toBe(1);
  });

  it('store en échec → collection vide, le jeu continue', async () => {
    const broken = { kind: 'local' as const, load: () => Promise.reject(new Error('quota')), save: () => Promise.reject(new Error('quota')), clear: () => Promise.resolve() };
    const c = new Collection(broken, catalog, fixedNow);
    await c.init();
    expect(c.progress.discovered).toBe(0);
    expect(c.observe({ roundId: 'R1', branchId: 'SLG-A1', source: 'play', loss: true })?.isNew).toBe(true);
    await c.flush();
  });
});

describe('outils DEV (COLLECTION DEBUG)', () => {
  it('SET 145/147 (OFFICE MELTDOWN déjà ouvert), FORCE NEW DISCOVERY ×2 → 147/147 et trophée ; RESET → 0', async () => {
    const c = newCollection();
    c.setGadgetCounts(ALL_GADGETS_AT(99), mulberry32(6));
    c.setDiscoveredCount(TOTAL - 2, mulberry32(7));
    expect(c.progress.discovered).toBe(TOTAL - 2);
    expect(c.state.milestones['full-mvp']).toBeUndefined();
    const e1 = c.forceNewDiscovery(mulberry32(8));
    expect(e1?.isNew).toBe(true);
    expect(e1?.source).toBe('dev');
    const e2 = c.forceNewDiscovery(mulberry32(9));
    expect(e2?.progress).toEqual({ discovered: TOTAL, total: TOTAL });
    expect(e2?.unlocked.map((u) => u.id)).toContain('trophy.collector');
    expect(c.forceNewDiscovery(mulberry32(10))).toBeNull();
    await c.reset();
    expect(c.progress.discovered).toBe(0);
    c.unlockRandom(10, mulberry32(3));
    expect(c.progress.discovered).toBe(10);
    c.unlockAll();
    expect(c.progress.discovered).toBe(TOTAL);
  });
});

describe('déterminisme et architecture', () => {
  it('aucune couche du jeu (domaine, flux, moteur, contenu, presenter, RGS) n\'importe la collection', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|svelte)$/.test(f) && /from ['"][^'"]*\/collection\//.test(readFileSync(p, 'utf8'))) offenders.push(p);
      }
    };
    for (const d of ['src/domain', 'src/flow', 'src/presentation', 'src/content', 'src/presenter', 'src/platform']) walk(d);
    expect(offenders).toEqual([]);
  });

  const nullScene: SceneSink = { setGadget: () => {}, render: () => {} };
  const nullAudio: AudioSink = { play: () => {}, silence: () => {} };
  const timers: ReturnType<typeof setInterval>[] = [];
  afterEach(() => {
    while (timers.length) clearInterval(timers.pop());
  });

  /** Joue n manches (mock déterministe) et renvoie les séquences présentées. */
  async function playRounds(seed: number, n: number, collection: Collection | null) {
    const { server } = createMock(seed);
    const presenter = new Presenter(nullScene, nullAudio);
    timers.push(setInterval(() => presenter.tick(400), 2));
    const flow = new GameFlow({ rgs: new MockRgsAdapter(server), presenter, timeouts: { authMs: 300, playMs: 200, endRoundMs: 200 } });
    const detach = collection ? attachCollectionTracker(flow, collection) : () => {};
    await flow.start();
    const keys: string[] = [];
    const levels: RageLevelId[] = ['grumpy', 'furious', 'unhinged'];
    for (let i = 0; i < n; i++) {
      flow.setLevel(levels[i % 3]!);
      flow.fire();
      await waitFor(() => flow.snapshot.state === 'REVEAL' || flow.snapshot.state === 'READY_GATE', 5000, 'reveal');
      keys.push(flow.snapshot.presentation!.sequenceKey);
      await waitFor(() => flow.snapshot.state === 'READY', 8000, 'ready');
    }
    // Un replay ne débloque rien.
    const before = collection ? collection.progress.discovered : 0;
    const round = flow.lastPresentedRound!;
    await flow.replayRound({ ...round, roundId: 'REPLAY-X' });
    detach();
    return { keys, replayDelta: collection ? collection.progress.discovered - before : 0 };
  }

  it('même book → même séquence, que la collection soit absente, vide ou pleine ; un replay ne débloque rien', async () => {
    const none = await playRounds(4242, 9, null);
    const empty = newCollection();
    const withEmpty = await playRounds(4242, 9, empty);
    const full = newCollection();
    full.unlockAll();
    const withFull = await playRounds(4242, 9, full);
    expect(withEmpty.keys).toEqual(none.keys);
    expect(withFull.keys).toEqual(none.keys);
    expect(empty.progress.discovered).toBeGreaterThan(0);
    expect(withEmpty.replayDelta).toBe(0);
  }, 60_000);
});

describe('SPECIAL EPISODE : OFFICE MELTDOWN (showcase, aucune manche)', () => {
  it('5 tableaux, tous les accessoires, aucun signal de manche (reveal, BOSS FIGHT), animations connues', () => {
    expect(OFFICE_MELTDOWN.map((b) => b.id)).toEqual(['intro', 'slingshot', 'trapdoor', 'rocket', 'finale']);
    const anims = CHARACTER_ANIMS as Record<string, readonly string[]>;
    let total = 0;
    for (const beat of OFFICE_MELTDOWN) {
      expect([...beat.stage.props].sort()).toEqual([...ALL_GADGET_PROPS].sort());
      const seq = compileShowcase(beat.id, beat.stage, beat.segments);
      total += seq.totalMs;
      const signals = seq.cues.filter((c) => c.kind === 'signal').map((c) => (c as { signal: string }).signal);
      expect(signals, beat.id).toEqual(['end']);
      for (const c of seq.cues) if (c.kind === 'anim' && anims[c.actor]) expect(anims[c.actor], `${beat.id}: ${c.actor}.${c.anim}`).toContain(c.anim);
    }
    // ≈ 15 s de spectacle (hors pauses entre les tableaux).
    expect(total).toBeGreaterThan(10_000);
    expect(total).toBeLessThan(20_000);
  });

  it('le Presenter joue un tableau hors GameFlow et rend la main à la fin', async () => {
    const presenter = new Presenter({ setGadget: () => {}, render: () => {} }, { play: () => {}, silence: () => {} });
    const beat = OFFICE_MELTDOWN[0]!;
    let done = false;
    void presenter.playShowcase(beat.stage, compileShowcase(beat.id, beat.stage, beat.segments)).then(() => (done = true));
    for (let i = 0; i < 40 && !done; i++) {
      presenter.tick(100);
      await Promise.resolve();
    }
    expect(done).toBe(true);
  });
});

// ------------------------------------------------------------------ rapport (optionnel)
const reportPath = process.env.COLLECTION_REPORT;
if (reportPath) {
  it('écrit le rapport de complétion (PRODUCTION 3 GADGETS)', () => {
    const SCRIPTS = policy.scripts_by_class as Record<ResultClass, Partial<Record<Script, number>>>;
    /** P(branche) par manche jouée AVEC ce gadget (distribution du Rage Level, BOSS FIGHT compris). */
    const perRoundOf = (gadgetId: string) => {
      const g = GADGETS.find((x) => x.id === gadgetId)!;
      const out = new Map<string, number>();
      const bf: Record<string, number> = {};
      for (const r of distributionTable(g.rageLevel)) {
        const c = classify(r.multiplier100);
        if (r.bossFightRung !== null) {
          bf[c] = (bf[c] ?? 0) + r.p;
          continue;
        }
        for (const [id, p] of branchProbabilities(g, c, SCRIPTS[c])) out.set(id, (out.get(id) ?? 0) + p * r.p);
      }
      for (const [c, p] of Object.entries(bf)) for (const [id, q] of branchProbabilities(g, c as ResultClass, { BF_ENTRY: 1 })) out.set(id, (out.get(id) ?? 0) + q * p);
      return out;
    };
    const perGadget = new Map<string, Map<string, number>>(GADGETS.map((g) => [g.id, perRoundOf(g.id)]));
    // Poisson-binomial : P(au moins k cartes découvertes après t manches).
    const atLeast = (ps: number[], t: number, k: number) => {
      let d = [1];
      for (const x of ps) {
        const q = 1 - Math.exp(-x * t);
        const next = new Array<number>(d.length + 1).fill(0);
        d.forEach((v, j) => {
          next[j]! += v * (1 - q);
          next[j + 1]! += v * q;
        });
        d = next;
      }
      return d.slice(k).reduce((a, b) => a + b, 0);
    };
    const quantile = (f: (t: number) => number, prob: number) => {
      let lo = 0;
      let hi = 1;
      while (f(hi) < prob && hi < 1e8) hi *= 2;
      if (f(hi) < prob) return Number.POSITIVE_INFINITY;
      for (let i = 0; i < 50; i++) {
        const m = (lo + hi) / 2;
        if (f(m) < prob) lo = m;
        else hi = m;
      }
      return Math.round(hi);
    };
    /** Profil de jeu : part des manches par gadget. */
    const uniform = Object.fromEntries(GADGETS.map((g) => [g.id, 1 / GADGETS.length]));
    const favourite = Object.fromEntries(GADGETS.map((g) => {
      const slot = PLAN_SETS[g.rageLevel].indexOf(g.id);
      return [g.id, (1 / 3) * [0.6, 0.25, 0.15][slot]!];
    }));
    const onlyA = Object.fromEntries(GADGETS.map((g) => [g.id, PLAN_SETS[g.rageLevel][0] === g.id ? 1 / 3 : 0]));
    const cardsP = (share: Record<string, number>, filter: (c: (typeof catalog.cards)[number]) => boolean) =>
      catalog.cards.filter(filter).map((c) => (perGadget.get(c.gadgetId)!.get(c.id) ?? 0) * share[c.gadgetId]!);
    const fmt = (n: number) => (Number.isFinite(n) ? String(n) : 'jamais');
    const row = (label: string, f: (t: number) => number) => `| ${label} | ${fmt(quantile(f, 0.5))} | ${fmt(quantile(f, 0.9))} |`;
    const meltdown = (share: Record<string, number>, n: number) => (t: number) =>
      GADGETS.map((g) => atLeast(cardsP(share, (c) => c.gadgetId === g.id && c.section !== 'bossfight'), t, n)).reduce((a, b) => a * b, 1);
    const all = (share: Record<string, number>) => cardsP(share, () => true);
    const lines = [
      '# COLLECTION BOOK — temps de découverte (PRODUCTION 3 GADGETS)', '',
      `> Généré par \`COLLECTION_REPORT=${reportPath} npx vitest run tests/unit/collection.test.ts\` le ${new Date().toISOString().slice(0, 10)}. Ne pas éditer.`,
      '> Calcul exact (contenu, rareté, scripts du book, distribution mathématique, BOSS FIGHT compris). La collection ne change aucune de ces',
      '> probabilités : ces chiffres décrivent ce que le jeu montre déjà. Seul le gadget JOUÉ découvre ses cartes (jamais les autres plans).', '',
      `Catalogue : **${catalog.cards.length} cartes** (${catalog.sections.map((x) => `${x.label} ${x.total}`).join(' · ')}).`, '',
      '## Jalons — joueur qui répartit ses manches (1/3 par Rage Level, 1/3 par plan : 1/9 par gadget)', '',
      '| Jalon | Manches (médiane) | Manches (90 %) |', '|---|---:|---:|',
      ...MILESTONES.map((m) => {
        const r = m.rule;
        const ps = all(uniform);
        if (r.kind === 'count') return row(m.label, (t) => atLeast(ps, t, r.n));
        if (r.kind === 'fraction') return row(m.label, (t) => atLeast(ps, t, Math.ceil(r.f * ps.length)));
        if (r.kind === 'section') {
          const sp = cardsP(uniform, (c) => c.section === r.section);
          return row(m.label, (t) => atLeast(sp, t, sp.length));
        }
        if (r.kind === 'perGadget') return row(`${m.label} (≥ ${r.n} avec chacun des 9 gadgets)`, meltdown(uniform, r.n));
        if (r.kind === 'perSection') return row(m.label, () => 0);
        return row(m.label, (t) => atLeast(ps, t, ps.length));
      }),
      '', '## Règles étudiées pour OFFICE MELTDOWN (retenue : ≥ 4 avec chacun des 9 gadgets)', '',
      '| Règle | Joueur réparti : médiane | 90 % | Joueur « plan préféré » (A 60 %, B 25 %, C 15 %) : médiane | 90 % | Joueur « plan A seulement » |', '|---|---:|---:|---:|---:|---:|',
      ...[2, 3, 4, 5].map((n) => `| ≥ ${n} avec chacun des 9 gadgets | ${fmt(quantile(meltdown(uniform, n), 0.5))} | ${fmt(quantile(meltdown(uniform, n), 0.9))} | ${fmt(quantile(meltdown(favourite, n), 0.5))} | ${fmt(quantile(meltdown(favourite, n), 0.9))} | ${fmt(quantile(meltdown(onlyA, n), 0.5))} |`),
      (() => {
        const legacy = (share: Record<string, number>) => (t: number) => (['grumpy', 'furious', 'unhinged'] as const).map((lv) => atLeast(cardsP(share, (c) => c.section === lv), t, 8)).reduce((a, b) => a * b, 1);
        return `| (ancienne règle) ≥ 8 dans chaque Rage Level | ${fmt(quantile(legacy(uniform), 0.5))} | ${fmt(quantile(legacy(uniform), 0.9))} | ${fmt(quantile(legacy(favourite), 0.5))} | ${fmt(quantile(legacy(favourite), 0.9))} | ${fmt(quantile(legacy(onlyA), 0.5))} |`;
      })(),
      '', 'Avec la règle retenue, un joueur qui ne joue que trois gadgets (un par niveau, ou les trois d\'un niveau) ne débloque jamais OFFICE MELTDOWN.', '',
      '## 100 % (accomplissement de collectionneur, cosmétique)', '',
      '| Profil | 100 % : médiane | 90 % |', '|---|---:|---:|',
      row('Joueur réparti (1/9 par gadget)', (t) => atLeast(all(uniform), t, all(uniform).length)),
      row('Joueur « plan préféré »', (t) => atLeast(all(favourite), t, all(favourite).length)),
      '', '## Courbe de découverte (joueur réparti)', '',
      '| Manches | 10 | 25 | 50 | 100 | 200 | 500 | 1 000 |', '|---|---:|---:|---:|---:|---:|---:|---:|',
      `| Cartes découvertes (espérance, sur ${catalog.cards.length}) | ${[10, 25, 50, 100, 200, 500, 1000].map((n) => all(uniform).reduce((a, x) => a + 1 - Math.exp(-x * n), 0).toFixed(1)).join(' | ')} |`,
      '', '## Par gadget (joueur réparti) : cartes de Rage Level découvertes (espérance)', '',
      '| Gadget | Cartes | 25 manches | 50 | 100 | 200 |', '|---|---:|---:|---:|---:|---:|',
      ...GADGETS.map((g) => {
        const ps = cardsP(uniform, (c) => c.gadgetId === g.id && c.section !== 'bossfight');
        return `| ${g.label} | ${ps.length} | ${[25, 50, 100, 200].map((n) => ps.reduce((a, x) => a + 1 - Math.exp(-x * n), 0).toFixed(1)).join(' | ')} |`;
      }),
      '',
    ];
    writeFileSync(reportPath, `${lines.join('\n')}\n`);
  }, 120_000);
}
