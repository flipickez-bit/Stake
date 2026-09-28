/**
 * PRODUCTION 3 GADGETS PAR RAGE LEVEL — garanties de contenu, de son, de collection et de sécurité (9 gadgets).
 * Complète variety.test.ts (prévisibilité, rythme) et poc3Security.test.ts (maths A2, GRUMPY).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import policy from '../../config/presentation_policy.json';
import { SOUND_KIT, variantOf, WIN_SOUNDS } from '../../src/audio/soundKit';
import { buildCatalog } from '../../src/collection/catalog';
import { COPY } from '../../src/collection/copy';
import { LEGACY_MELTDOWN_RULE, MELTDOWN_RULE, meltdownProgress, milestonesFor, newlyReached, progress } from '../../src/collection/rewards';
import { Collection } from '../../src/collection/Collection';
import { MemoryCollectionStore } from '../../src/collection/store';
import { attachCollectionTracker } from '../../src/collection/tracker';
import { CLASSIC_GADGETS, GADGETS, gadgetForPlan, pickerGadget, planGadgets, planReadyLevels, restLayout } from '../../src/content/gadgets';
import { LIBRARY } from '../../src/content/library';
import { OFFICE_LAYOUT } from '../../src/content/office';
import { multiplierFor, planForBranch } from '../../src/dev/forceBranch';
import { parseRound, type Outcome } from '../../src/domain/outcome';
import { PLAN_SETS, PLAN_SLOTS, type PlanSlot } from '../../src/domain/plans';
import { classify } from '../../src/domain/resultClass';
import { hash32 as hashSeed, mulberry32 } from '../../src/domain/seed';
import { RAGE_LEVEL_IDS, type RageLevelId, type ResultClass, type Script } from '../../src/domain/types';
import { GameFlow, type FlowState } from '../../src/flow/GameFlow';
import { AltDisplaySetting, plansRequested } from '../../src/app/pocConfig';
import { createMemoryStore } from '../../src/platform/storage';
import { distributionTable } from '../../src/platform/rgs/mock/mockMath';
import { bookForPick, drawTriple } from '../../src/platform/rgs/mock/tripleMath';
import { branchProbabilities, compileSequence } from '../../src/presentation/compileSequence';
import type { AnimationSequence, BranchDef, GadgetDef, ScheduledCue } from '../../src/presentation/types';
import { FakePresenter } from './fakePresenter';
import { Presenter } from '../../src/presenter/Presenter';
import { createMock, waitFor } from './helpers';

const SCRIPTS = policy.scripts_by_class as Record<ResultClass, Partial<Record<Script, number>>>;
const isBf = (b: BranchDef) => b.categories.includes('BF_ENTRY');
const isLoss = (b: BranchDef) => b.classes.includes('MISS');
const isBigWin = (b: BranchDef) => !isBf(b) && b.classes.includes('BIG') && !b.classes.includes('MISS');
const FAST = { authMs: 200, playMs: 80, endRoundMs: 80 };

/** Manche A2 réelle (book du mock) dont le plan `slot` porte `m` (×1) et le script voulu. */
function planOutcome(level: RageLevelId, slot: PlanSlot, m: number, script: Script | null, seed = 7): Outcome {
  const i = PLAN_SLOTS.indexOf(slot);
  const mults: [number, number, number] = [0, 0, 0];
  mults[i] = m;
  const scripts = PLAN_SLOTS.map((s) => (s === slot ? script : null));
  const book = bookForPick(drawTriple(level, PLAN_SETS[level], mulberry32(seed), { kind: 'multipliers', multipliers: mults, scripts }), slot, 1);
  return parseRound({ roundId: `R-${level}-${seed}`, mode: level, betAmount: 1_000_000, payout: book.payoutMultiplier * 10_000, payoutMultiplier100: book.payoutMultiplier, active: true, events: book.events, plan: slot }, 'play');
}

function bfOutcome(level: RageLevelId, slot: PlanSlot, seed = 4): Outcome {
  const book = bookForPick(drawTriple(level, PLAN_SETS[level], mulberry32(seed), { kind: 'bossFight', rung: 2 }), slot, 1);
  return parseRound({ roundId: `BF-${level}`, mode: level, betAmount: 1_000_000, payout: book.payoutMultiplier * 10_000, payoutMultiplier100: book.payoutMultiplier, active: true, events: book.events, plan: slot }, 'play');
}

const slotOf = (g: GadgetDef) => PLAN_SLOTS[PLAN_SETS[g.rageLevel].indexOf(g.id)]!;

/** Séquence d'une branche imposée, avec un book compatible (classe préférée si possible). */
function sequenceFor(g: GadgetDef, b: BranchDef, prefer?: ResultClass): AnimationSequence {
  const plan = planForBranch(g.id, b.id, prefer)!;
  const o = plan.resultClass === 'BOSS_FIGHT'
    ? bfOutcome(g.rageLevel, plan.slot)
    : planOutcome(g.rageLevel, plan.slot, (plan.triple.kind === 'multipliers' ? plan.triple.multipliers[PLAN_SLOTS.indexOf(plan.slot)] : 0) ?? 0, plan.triple.kind === 'multipliers' ? (plan.triple.scripts?.[PLAN_SLOTS.indexOf(plan.slot)] ?? null) : null);
  return compileSequence(o, g, 'normal', LIBRARY, { forceBranchId: b.id });
}

describe('PRODUCTION : 9 gadgets, 3 par Rage Level', () => {
  it('les trois niveaux ont leurs trois gadgets ; 15 à 18 branches chacun ; 135 à 160 au total', () => {
    expect(GADGETS).toHaveLength(9);
    expect(planReadyLevels()).toEqual(['grumpy', 'furious', 'unhinged']);
    for (const level of RAGE_LEVEL_IDS) expect(planGadgets(level)!.map((g) => g.id)).toEqual([...PLAN_SETS[level]]);
    for (const g of GADGETS) {
      expect(g.branches.length, g.id).toBeGreaterThanOrEqual(15);
      expect(g.branches.length, g.id).toBeLessThanOrEqual(18);
    }
    const total = GADGETS.reduce((n, g) => n + g.branches.length, 0);
    expect(total).toBeGreaterThanOrEqual(135);
    expect(total).toBeLessThanOrEqual(160);
  });

  it('chaque gadget : pertes, gains, gros gain, RARE, VERY RARE, 2 entrées de BOSS FIGHT, au moins 3 débuts visibles', () => {
    for (const g of GADGETS) {
      expect(g.branches.filter(isBf), g.id).toHaveLength(2);
      expect(g.branches.filter((b) => !isBf(b) && isLoss(b)).length, `${g.id} pertes`).toBeGreaterThanOrEqual(5);
      expect(g.branches.filter((b) => !isBf(b) && !isLoss(b)).length, `${g.id} gains`).toBeGreaterThanOrEqual(5);
      expect(g.branches.some(isBigWin), `${g.id} gros gain`).toBe(true);
      for (const r of ['COMMON', 'UNCOMMON', 'RARE', 'VERY_RARE'] as const) expect(g.branches.some((b) => b.rarity === r), `${g.id} ${r}`).toBe(true);
      expect(new Set(g.branches.map((b) => b.path[0])).size, `${g.id} débuts`).toBeGreaterThanOrEqual(3);
    }
  });

  it('chaque (classe, script) que le Rage Level peut produire a une branche EXACTE pour CHAQUE gadget (jamais de repli)', () => {
    for (const g of GADGETS) {
      const classes = new Set(distributionTable(g.rageLevel).filter((r) => r.bossFightRung === null).map((r) => classify(r.multiplier100)));
      for (const cls of classes) {
        for (const script of Object.keys(SCRIPTS[cls]) as Script[]) {
          expect(g.branches.some((b) => b.categories.includes(script) && b.classes.includes(cls)), `${g.id} ${cls}/${script}`).toBe(true);
        }
      }
    }
  });

  it('métadonnées cohérentes : chaque classe déclarée par une branche est servie par l\'un de ses scripts', () => {
    for (const g of GADGETS) {
      for (const b of g.branches.filter((x) => !isBf(x))) {
        for (const cls of b.classes) expect(b.categories.some((s) => (SCRIPTS[cls]?.[s] ?? 0) > 0), `${b.id} : ${cls} jamais servie`).toBe(true);
      }
    }
  });

  it('toutes les branches sont atteignables (probabilité > 0 dans le jeu normal) et se jouent de bout en bout', () => {
    for (const g of GADGETS) {
      const reach = new Map<string, number>();
      for (const r of distributionTable(g.rageLevel)) {
        const cls = classify(r.multiplier100);
        const weights = r.bossFightRung !== null ? { BF_ENTRY: 1 } : SCRIPTS[cls];
        for (const [id, p] of branchProbabilities(g, cls, weights)) reach.set(id, (reach.get(id) ?? 0) + p * r.p);
      }
      for (const b of g.branches) {
        expect(reach.get(b.id) ?? 0, `${b.id} jamais tirée`).toBeGreaterThan(0);
        const seq = sequenceFor(g, b);
        expect(seq.branchId).toBe(b.id);
        expect(seq.cues.filter((c) => c.kind === 'signal' && c.signal === 'reveal')).toHaveLength(1);
        expect(Number.isFinite(seq.totalMs) && seq.totalMs > 0).toBe(true);
      }
    }
  });

  it('chaque début visible mène à une perte ET à un gain (un début ne prédit jamais le résultat)', () => {
    for (const g of GADGETS) {
      const byStart = new Map<string, BranchDef[]>();
      for (const b of g.branches.filter((x) => !isBf(x))) byStart.set(b.path[0]!, [...(byStart.get(b.path[0]!) ?? []), b]);
      for (const [start, list] of byStart) {
        expect(list.some(isLoss), `${g.id} ${start} : aucune perte`).toBe(true);
        expect(list.some((b) => !isLoss(b)), `${g.id} ${start} : aucun gain`).toBe(true);
      }
    }
  });

  it('présence dans le décor du choix : zone tactile visible en portrait, sans chevauchement dans un même calque', () => {
    for (const level of RAGE_LEVEL_IDS) {
      const set = planGadgets(level)!;
      for (const g of set) {
        expect(g.pick, g.id).toBeDefined();
        const b = g.pick!.box;
        // Portrait (caméra au repos, B.B. suivi) : x visible ≈ 250 … 885.
        expect(b.x + b.w / 2, `${g.id} centre`).toBeGreaterThan(250);
        expect(b.x + b.w / 2, `${g.id} centre`).toBeLessThan(885);
      }
      for (let i = 0; i < 3; i++) {
        for (let j = i + 1; j < 3; j++) {
          const a = set[i]!.pick!;
          const c = set[j]!.pick!;
          if (a.layer !== c.layer) continue;
          const overlap = a.box.x < c.box.x + c.box.w && c.box.x < a.box.x + a.box.w && a.box.y < c.box.y + c.box.h && c.box.y < a.box.y + a.box.h;
          expect(overlap, `${level} : ${set[i]!.id} / ${set[j]!.id}`).toBe(false);
        }
      }
      // Décor du choix : les trois gadgets présents ; au tir, seul le gadget choisi reste.
      const picker = pickerGadget(level)!;
      for (const g of set) for (const p of g.props) expect(picker.props).toContain(p);
      for (const slot of PLAN_SLOTS) expect(gadgetForPlan(level, slot).id).toBe(PLAN_SETS[level][PLAN_SLOTS.indexOf(slot)]);
    }
  });

  it('acteurs : tout acteur animé existe dans la disposition de repos (bureau + gadget)', () => {
    for (const g of GADGETS) {
      const rest = restLayout(g);
      for (const seg of Object.values(g.segments)) {
        for (const c of seg.cues) {
          if (c.kind === 'tween' || c.kind === 'state' || c.kind === 'anim') {
            expect(c.actor === 'camera' || c.actor in rest || c.actor in OFFICE_LAYOUT, `${g.id}/${seg.id} : ${c.actor}`).toBe(true);
          }
        }
      }
    }
  });
});

describe('BOSS FIGHT : commun à la manche (1/150), variations visuelles par gadget seulement', () => {
  it('le déroulé (paliers, attaques, K.O.) est identique quel que soit le gadget ; seuls l\'entrée et les projectiles changent', () => {
    for (const level of RAGE_LEVEL_IDS) {
      const signatures = PLAN_SLOTS.map((slot) => {
        const o = bfOutcome(level, slot, 11);
        const g = gadgetForPlan(level, slot);
        const seq = compileSequence(o, g, 'normal', LIBRARY);
        return seq.cues.filter((c) => c.kind === 'signal' && c.signal !== 'reveal' && c.signal !== 'end').map((c) => `${(c as { signal: string }).signal}:${(c as { value?: number }).value ?? ''}`).join(',');
      });
      expect(new Set(signatures).size, level).toBe(1);
    }
  });

  it('projectiles du BOSS FIGHT : chaque gadget en déclare, tous connus de la scène', () => {
    const known = ['stapler', 'plane', 'coffee', 'keyboard', 'mug', 'cup', 'ream', 'drawer', 'jug', 'rocket', 'safe', 'glove', 'monitor'];
    for (const g of GADGETS) {
      expect(g.bfProjectiles?.length, g.id).toBeGreaterThan(0);
      for (const p of g.bfProjectiles ?? []) expect(known, `${g.id} : ${p}`).toContain(p);
    }
    const stage = readFileSync('src/render/PixiStage.ts', 'utf8');
    for (const k of known.slice(4)) expect(stage).toContain(`['${k}', `);
  });
});

describe('SOUND KIT : règles de gain et déterminisme', () => {
  const winSounds = (seq: AnimationSequence) => seq.cues.filter((c): c is Extract<ScheduledCue, { kind: 'sound' }> => c.kind === 'sound' && WIN_SOUNDS.has(c.sound));

  it('x0,5 (SCRAPE) ne joue JAMAIS le DING (ni or, ni ovation, ni cuivres) ; une perte non plus', () => {
    for (const g of GADGETS) {
      for (const b of g.branches.filter((x) => !isBf(x))) {
        for (const cls of ['MISS', 'SCRAPE'] as const) {
          if (!b.classes.includes(cls) || multiplierFor(g.rageLevel, cls) === null) continue;
          expect(planForBranch(g.id, b.id, cls)!.resultClass, `${b.id} ${cls}`).toBe(cls);
          const seq = sequenceFor(g, b, cls);
          expect(winSounds(seq).map((c) => c.sound), `${b.id} ${cls}`).toEqual([]);
        }
      }
    }
  });

  it('DING = classe du gain : HIT 1, BIG 2, MEGA 3, LEGENDARY 4', () => {
    const dings = (tier: 'T1' | 'T2' | 'T3' | 'T3G') => LIBRARY.impact(tier, 'none').cues.filter((c) => c.kind === 'sound' && c.sound === 'ding').length;
    expect([dings('T1'), dings('T2'), dings('T3'), dings('T3G')]).toEqual([1, 2, 3, 4]);
    expect(LIBRARY.impact('T05', 'none').cues.some((c) => c.kind === 'sound' && WIN_SOUNDS.has(c.sound))).toBe(false);
  });

  it('chaque son du kit a une catégorie ; les sons d\'identité (DING, or) n\'ont qu\'une variante', () => {
    for (const [id, spec] of Object.entries(SOUND_KIT)) {
      expect(spec.variants, id).toBeGreaterThanOrEqual(1);
      expect(spec.spread, id).toBeLessThanOrEqual(0.1);
    }
    expect(SOUND_KIT.ding.variants).toBe(1);
    expect(SOUND_KIT.gold.variants).toBe(1);
    expect(SOUND_KIT.bell.category).toBe('OFFICE');
  });

  it('variantes déterministes : même book → mêmes sons (graines comprises) ; reprise et replay identiques', () => {
    const g = GADGETS.find((x) => x.id === 'cooler-bowling')!;
    const o = planOutcome('furious', 'C', 2, 'DIRECT', 21);
    const a = compileSequence(o, g, 'normal', LIBRARY);
    const b = compileSequence(o, g, 'normal', LIBRARY);
    const sounds = (q: AnimationSequence) => q.cues.filter((c) => c.kind === 'sound').map((c) => `${(c as { sound: string }).sound}|${(c as { seed?: number }).seed}`);
    expect(sounds(a)).toEqual(sounds(b));
    for (const c of a.cues) if (c.kind === 'sound') expect(variantOf(c.sound, c.seed)).toEqual(variantOf(c.sound, c.seed));
    // Sur beaucoup de graines, le pool de variantes est réellement utilisé.
    const seen = new Set<number>();
    for (let s = 0; s < 200; s++) seen.add(variantOf('whoosh', s).index);
    expect(seen.size).toBe(SOUND_KIT.whoosh.variants);
  });

  it('LE SIP : micro-variantes déterministes, jamais geste + gorgée + CLINK à chaque fois', () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed < 400; seed++) {
      const r = LIBRARY.reaction('SIP', seed);
      const ids = r.cues.filter((c) => c.kind === 'sound').map((c) => (c as { sound: string }).sound).join('+');
      kinds.add(ids || 'silence');
      expect(LIBRARY.reaction('SIP', seed)).toBe(r);
    }
    // Les 4 variantes (gorgée + HMPF, gorgée + CLINK, grande gorgée, silence) sont toutes atteintes.
    expect(kinds).toEqual(new Set(['sip+hmpf', 'sip+clink', 'gulp+hmpf', 'silence']));
    expect([...kinds].every((k) => !(k.includes('sip') && k.includes('clink') && k.includes('hmpf')))).toBe(true);
  });

  it('aucun Math.random() dans le code du jeu (sons, contenu, présentation, domaine, rendu, flux)', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
    const files = walk('src').filter((f) => /\.(ts|svelte)$/.test(f));
    expect(files.length).toBeGreaterThan(50);
    for (const f of files) {
      // Les commentaires peuvent citer l'interdit ; le code, jamais.
      const code = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(code.includes('Math.random'), f).toBe(false);
    }
  });

  it('le carillon de l\'ascenseur n\'est pas le DING de gain', () => {
    const wait = LIBRARY.segments.ELEV_WAIT!;
    expect(wait.cues.some((c) => c.kind === 'sound' && c.sound === 'ding')).toBe(false);
    expect(wait.cues.some((c) => c.kind === 'sound' && c.sound === 'bell')).toBe(true);
  });
});

describe('COLLECTION : seul le gadget JOUÉ découvre ses cartes, sur les trois Rage Levels', () => {
  const until = (flow: GameFlow, state: FlowState, ms = 4000) => waitFor(() => flow.snapshot.state === state, ms, state);

  it('en jouant B (perte) alors que A et C portaient des gains : seule une carte du gadget B est découverte', async () => {
    for (const level of RAGE_LEVEL_IDS) {
      const mock = createMock(40 + RAGE_LEVEL_IDS.indexOf(level));
      // Vrai Presenter (vraies branches, vrai gadget joué), piloté en temps accéléré.
      const presenter = new Presenter({ setGadget: () => {}, render: () => {} }, { play: () => {}, silence: () => {} }, { plans: true });
      const clock = setInterval(() => presenter.tick(250), 2);
      const flow = new GameFlow({ rgs: mock.adapter, presenter, timeouts: FAST, planLevels: [...RAGE_LEVEL_IDS] });
      const catalog = buildCatalog();
      const c = new Collection(new MemoryCollectionStore(), catalog);
      await c.init();
      attachCollectionTracker(flow, c);
      await flow.start();
      flow.setLevel(level);
      const big = distributionTable(level).filter((r) => r.bossFightRung === null && classify(r.multiplier100) === 'BIG')[0]!.multiplier100 / 100;
      mock.server.update((s) => (s.nextForcedTriple = { kind: 'multipliers', multipliers: [big, 0, big] }));
      expect(flow.setPlan('B')).toBe(true);
      flow.fire();
      await until(flow, 'REVEAL', 8000);
      await until(flow, 'READY', 8000);
      clearInterval(clock);
      const gB = PLAN_SETS[level][1]!;
      const found = Object.keys(c.state.entries);
      expect(found.length, level).toBe(1);
      for (const id of found) expect(catalog.byId.get(id)?.gadgetId, `${level} : ${id}`).toBe(gB);
      expect(c.state.gadgetPicks).toEqual({ [gB]: 1 });
    }
  });
});

describe('COLLECTION : le livre suit le mode (jamais une règle impossible à remplir)', () => {
  it('plans (Mock) : 9 gadgets, 150 cartes, MELTDOWN = 4 avec chacun des 9 ; classique (Stake) : 3 gadgets, 51 cartes, 8 par Rage Level', () => {
    const plans = buildCatalog(GADGETS);
    expect(plans.cards).toHaveLength(150);
    expect(plans.meltdown).toBe(MELTDOWN_RULE);
    const classic = buildCatalog(Object.values(CLASSIC_GADGETS));
    expect(classic.cards).toHaveLength(51);
    expect(classic.meltdown).toBe(LEGACY_MELTDOWN_RULE);
    expect(new Set(classic.cards.map((c) => c.gadgetId))).toEqual(new Set(['swivel-slingshot', 'trapdoor-express', 'office-rocket']));
    // Mode classique : le jalon OFFICE MELTDOWN se remplit avec les 3 gadgets jouables (8 / 8 / 8), jamais la règle des 9.
    const c = new Collection(new MemoryCollectionStore(), classic);
    const ids = (lv: string, n: number) => classic.cards.filter((x) => x.section === lv).slice(0, n).map((x) => x.id);
    const state = { ...c.state, entries: Object.fromEntries([...ids('grumpy', 8), ...ids('furious', 8), ...ids('unhinged', 7)].map((id) => [id, { firstAt: 'x', count: 1 }])) };
    const p = progress(state as never, classic);
    expect(meltdownProgress(p)).toMatchObject({ current: 23, required: 24, unlocked: false, gadgetsDone: 0 });
    expect(milestonesFor(classic.meltdown).find((m) => m.id === 'explorer')!.rule).toBe(LEGACY_MELTDOWN_RULE);
    const full = { ...state, entries: { ...state.entries, [ids('unhinged', 8)[7]!]: { firstAt: 'x', count: 1 } } };
    expect(newlyReached(full as never, classic).map((m) => m.id)).toContain('explorer');
    expect(COPY.meltdownRule(classic.meltdown)).toBe('8 discoveries in each Rage Level · BOSS FIGHT cards not required');
    expect(COPY.meltdownRule(plans.meltdown)).toBe('4 discoveries with each of the 9 gadgets · BOSS FIGHT cards not required');
  });
});

describe('SÉCURITÉ : A/B/C choisi AVANT Play, immuable ensuite, sur les trois Rage Levels', () => {
  const until = (flow: GameFlow, state: FlowState, ms = 4000) => waitFor(() => flow.snapshot.state === state, ms, state);

  it('le plan part avec la mise ; pendant la manche aucun changement ; le gadget présenté est celui du plan payé', async () => {
    for (const level of RAGE_LEVEL_IDS) {
      for (const slot of PLAN_SLOTS) {
        const mock = createMock(70);
        const presenter = new FakePresenter(30, 60);
        const flow = new GameFlow({ rgs: mock.adapter, presenter, timeouts: FAST, planLevels: [...RAGE_LEVEL_IDS] });
        await flow.start();
        flow.setLevel(level);
        expect(flow.setPlan(slot)).toBe(true);
        expect(flow.fire()).toBe(true);
        for (const other of PLAN_SLOTS) expect(flow.setPlan(other)).toBe(false);
        expect(flow.fire()).toBe(false);
        await until(flow, 'READY');
        expect(mock.server.snapshot().calls.play).toBe(1);
        expect(mock.server.snapshot().lastRound?.plan).toBe(slot);
        expect(presenter.calls[0]!.outcome.plans?.selected).toBe(slot);
        expect(presenter.calls[0]!.outcome.plans?.selectedGadget).toBe(PLAN_SETS[level][PLAN_SLOTS.indexOf(slot)]);
      }
    }
  });

  it('chaque Rage Level se souvient de son dernier plan (rejouer = un geste) ; changer de niveau ne transporte pas le plan', async () => {
    const mock = createMock(71);
    const flow = new GameFlow({ rgs: mock.adapter, presenter: new FakePresenter(10, 20), timeouts: FAST, planLevels: [...RAGE_LEVEL_IDS] });
    await flow.start();
    flow.setPlan('C');
    flow.setLevel('furious');
    expect(flow.snapshot.plan).toBeNull();
    flow.setPlan('B');
    flow.setLevel('grumpy');
    expect(flow.snapshot.plan).toBe('C');
    flow.setLevel('furious');
    expect(flow.snapshot.plan).toBe('B');
  });

  it('mode Stake : jamais de plans (INFORMATION STAKE ENGINE REQUISE) ; Mock : plans par défaut, ?plans=off = mode classique', () => {
    expect(plansRequested('https://x.test/?sessionID=1', 'stake')).toBe(false);
    expect(plansRequested('https://x.test/', 'mock')).toBe(true);
    expect(plansRequested('https://x.test/?plans=off', 'mock')).toBe(false);
  });
});

describe('LOOP ×100 par Rage Level et par plan (maths A2 réelles du mock, 3 vitesses)', () => {
  it('chaque manche compile, révèle une fois, joue le gadget de son plan ; aucune erreur ; branches variées', () => {
    const report: string[] = [];
    for (const level of RAGE_LEVEL_IDS) {
      for (const slot of PLAN_SLOTS) {
        const rnd = mulberry32(hashSeed(`${level}/${slot}`));
        const seen = new Set<string>();
        let wins = 0;
        for (let i = 0; i < 100; i++) {
          const book = bookForPick(drawTriple(level, PLAN_SETS[level], rnd), slot, 1);
          const o = parseRound({ roundId: `L-${level}-${slot}-${i}`, mode: level, betAmount: 1_000_000, payout: book.payoutMultiplier * 10_000, payoutMultiplier100: book.payoutMultiplier, active: false, events: book.events, plan: slot }, 'replay');
          const g = gadgetForPlan(level, slot)!;
          expect(o.plans?.selectedGadget).toBe(g.id);
          for (const speed of ['normal', 'turbo', 'super'] as const) {
            const seq = compileSequence(o, g, speed, LIBRARY);
            expect(seq.gadgetId).toBe(g.id);
            expect(seq.cues.filter((c) => c.kind === 'signal' && c.signal === 'reveal')).toHaveLength(1);
            expect(seq.markers.reveal).toBeLessThanOrEqual(seq.markers.end);
            if (speed === 'normal') seen.add(seq.branchId);
          }
          if (book.payoutMultiplier >= 100) wins++;
        }
        report.push(`${level}/${slot} ${seen.size} branches, ${wins} gains`);
        expect(seen.size, `${level}/${slot}`).toBeGreaterThanOrEqual(8);
      }
    }
    expect(report).toHaveLength(9);
  });
});

describe('RGS / réseau en mode 3 gadgets (régression) : ROUND_STATUS_UNKNOWN, jamais de Play automatique, EndRound unique', () => {
  async function plansFlow(level: RageLevelId, seed = 21) {
    const mock = createMock(seed);
    const presenter = new FakePresenter();
    const flow = new GameFlow({ rgs: mock.adapter, presenter, timeouts: FAST, planLevels: [...RAGE_LEVEL_IDS], maxAutoResync: 4 });
    await flow.start();
    flow.setLevel(level);
    expect(flow.setPlan('C')).toBe(true);
    return { ...mock, presenter, flow };
  }
  const until = (flow: GameFlow, state: FlowState, ms = 3000) => waitFor(() => flow.snapshot.state === state, ms, state);

  it('PLAY hors ligne → ROUND_STATUS_UNKNOWN, aucun Play, plan conservé, puis RETRY (resync seulement)', async () => {
    for (const level of RAGE_LEVEL_IDS) {
      const { flow, server } = await plansFlow(level);
      server.update((s) => (s.faults.offline = true));
      flow.fire();
      await waitFor(() => flow.snapshot.retryAvailable, 5000, 'retry');
      expect(flow.snapshot.state).toBe('ROUND_STATUS_UNKNOWN');
      expect(flow.snapshot.canFire).toBe(false);
      expect(flow.setPlan('A')).toBe(false);
      server.update((s) => (s.faults.offline = false));
      await flow.retry();
      await until(flow, 'READY');
      expect(server.snapshot().calls.play, level).toBe(0);
      expect(flow.snapshot.plan).toBe('C');
    }
  }, 30_000);

  it('PLAY : réponse perdue après envoi → la manche du SERVEUR est reprise (même plan), un seul Play, un seul EndRound', async () => {
    for (const level of RAGE_LEVEL_IDS) {
      const { flow, server, presenter } = await plansFlow(level, 33);
      server.update((s) => (s.faults.playTimeoutAfterSend = true));
      flow.fire();
      await waitFor(() => flow.snapshot.state === 'READY' && server.snapshot().settledRounds === 1, 4000);
      expect(server.snapshot().calls.play, level).toBe(1);
      expect(server.snapshot().calls.endRound, level).toBe(1);
      expect(presenter.calls).toHaveLength(1);
      expect(presenter.calls[0]!.outcome.plans?.selected).toBe('C');
      expect(presenter.calls[0]!.options.mode).toBe('resume');
    }
  }, 30_000);

  it('END ROUND : réponse perdue → un seul EndRound logique, solde réglé une fois', async () => {
    const { flow, server } = await plansFlow('unhinged', 44);
    server.update((s) => (s.faults.endRoundTimeoutAfterSend = true));
    flow.fire();
    await waitFor(() => flow.snapshot.state === 'READY' && server.snapshot().settledRounds === 1, 4000);
    expect(server.snapshot().calls.endRound).toBe(1);
    expect(flow.snapshot.balance?.amount).toBe(server.snapshot().balance);
  }, 30_000);
});

describe('OTHER PLANS (P3.1) : ON-DEMAND par défaut ; valeurs = triple AUTHENTIQUE du book, indépendant du plan choisi', () => {
  it('réglage : ON_DEMAND par défaut ; une ancienne valeur PRIVATE (v1, POC) n\'est pas reprise ; un choix v2 est gardé', () => {
    const store = createMemoryStore();
    store.set('badboss.poc3.altdisplay.v1', 'PRIVATE');
    expect(new AltDisplaySetting(store).current).toBe('ON_DEMAND');
    const a = new AltDisplaySetting(store);
    a.set('REVEAL_ALL');
    expect(new AltDisplaySetting(store).current).toBe('REVEAL_ALL');
  });

  it('les résultats révélés sont EXACTEMENT ceux du triple du book, et le triple ne dépend jamais du plan choisi', () => {
    for (const level of RAGE_LEVEL_IDS) {
      for (let seed = 1; seed <= 60; seed++) {
        const triples = PLAN_SLOTS.map((slot) => {
          const book = bookForPick(drawTriple(level, PLAN_SETS[level], mulberry32(seed)), slot, 1);
          const o = parseRound({ roundId: `OP-${seed}`, mode: level, betAmount: 1_000_000, payout: book.payoutMultiplier * 10_000, payoutMultiplier100: book.payoutMultiplier, active: false, events: book.events, plan: slot }, 'replay');
          const ev = book.events.find((e) => e.type === 'triple') as unknown as { results: { multiplier100: number }[] };
          // Révélé = triple du book, dans l'ordre A, B, C ; le plan payé = celui du pick.
          expect(o.plans!.results.map((r) => r.multiplier100)).toEqual(ev.results.map((r) => r.multiplier100));
          expect(o.payoutMultiplier100).toBe(ev.results[PLAN_SLOTS.indexOf(slot)]!.multiplier100);
          return o.plans!.results.map((r) => `${r.slot}:${r.multiplier100}:${r.bossFight}`).join(',');
        });
        // Même graine, trois plans différents → le MÊME triple (jamais modifié selon le choix ou le résultat).
        expect(new Set(triples).size, `${level} ${seed}`).toBe(1);
      }
    }
  });
});

describe('déterminisme de la présentation (reprise / replay)', () => {
  it('même book, même gadget → même branche, même séquence (clé), pour les 9 gadgets', () => {
    for (const g of GADGETS) {
      for (let seed = 1; seed <= 12; seed++) {
        const o = planOutcome(g.rageLevel, slotOf(g), 0, null, seed);
        const a = compileSequence(o, g, 'normal', LIBRARY);
        const b = compileSequence({ ...o }, g, 'normal', LIBRARY);
        expect(a.key).toBe(b.key);
        expect(a.branchId).toBe(b.branchId);
      }
    }
  });
});

/**
 * Feuilles de cues sonores (SOUND BIBLE §5) : avec SOUND_REPORT=<fichier>, écrit docs/generated/SOUND_CUES_P3.md
 * à partir des séquences RÉELLEMENT compilées (jamais d'une liste tenue à la main).
 */
const soundReportPath = process.env.SOUND_REPORT;
describe.skipIf(!soundReportPath)('rapport : feuilles de cues sonores des 9 gadgets', () => {
  it('écrit le rapport', async () => {
    const { writeFileSync } = await import('node:fs');
    const sounds = (seq: AnimationSequence, from: number, to: number) =>
      seq.cues.filter((c): c is Extract<ScheduledCue, { kind: 'sound' }> => c.kind === 'sound' && c.at >= from && c.at < to);
    const fmt = (list: Extract<ScheduledCue, { kind: 'sound' }>[]) => {
      const out: string[] = [];
      for (const c of list) {
        const last = out[out.length - 1];
        const m = last?.match(/^`(\w+)`(?: ×(\d+))?$/);
        if (m && m[1] === c.sound) out[out.length - 1] = `\`${c.sound}\` ×${Number(m[2] ?? 1) + 1}`;
        else out.push(`\`${c.sound}\``);
      }
      return out.join(' · ') || '—';
    };
    const lines = [
      '# SOUND CUES — PRODUCTION 3 GADGETS (généré)',
      '',
      `> Généré par \`SOUND_REPORT=${soundReportPath} npx vitest run tests/unit/production.test.ts\` le ${new Date().toISOString().slice(0, 10)}. Ne pas éditer.`,
      '> Séquences compilées en vitesse normale, un book compatible par branche (classe la plus basse servie). « Tronc » : avant le point de divergence D1 (identique pour toutes les issues). « Fin » : après D1. DING = nombre de `ding` de la séquence.',
      '',
    ];
    for (const level of RAGE_LEVEL_IDS) {
      lines.push(`## ${level.toUpperCase()}`, '');
      for (const g of planGadgets(level)!) {
        const first = sequenceFor(g, g.branches[0]!);
        lines.push(`### ${g.label} (\`${g.id}\`)`, '');
        lines.push(`- **Signature** : ${(g.signature ?? []).map((s) => `\`${s}\``).join(' · ')}`);
        lines.push(`- **Tronc (commun à toutes les issues)** : ${fmt(sounds(first, 0, first.markers.d1))}`);
        lines.push(`- **Attente réseau** : \`${g.hold.sound}\` toutes les ${g.hold.everyMs} ms`, '');
        lines.push('| Branche | Classes | Rareté | Durée | DING | Fin (ordre des sons) |', '|---|---|---|---:|---:|---|');
        for (const b of g.branches) {
          const seq = sequenceFor(g, b);
          const end = sounds(seq, seq.markers.d1, Infinity);
          const dings = seq.cues.filter((c) => c.kind === 'sound' && c.sound === 'ding').length;
          lines.push(`| ${b.id} ${b.label} | ${b.classes.join(', ')} | ${b.rarity} | ${(seq.totalMs / 1000).toFixed(2)} s | ${dings} | ${fmt(end)} |`);
        }
        lines.push('');
      }
    }
    writeFileSync(soundReportPath!, `${lines.join('\n')}\n`);
  });
});
