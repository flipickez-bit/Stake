/**
 * POC « 3 PLANS » — contenu, présentation, collection, textes.
 * - Prototypes B et C : chaque résultat possible en GRUMPY a une présentation honnête (jamais le repli), une seule
 *   révélation, des animations et des acteurs connus ; chaque début visible mène à une perte ET à un gain.
 * - Seul le gadget du plan PAYÉ est joué ; le décor du choix montre les trois plans au repos.
 * - Collection : on enregistre le gadget choisi ; une alternative non jouée n'y entre jamais.
 * - Textes : aucune formule de regret ; aucun son ni couleur de gain pour les autres plans.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import policy from '../../config/presentation_policy.json';
import { buildCatalog } from '../../src/collection/catalog';
import { Collection } from '../../src/collection/Collection';
import { MemoryCollectionStore, sanitizeCollection } from '../../src/collection/store';
import { shouldObserve } from '../../src/collection/tracker';
import { ALL_GADGET_PROPS, GADGETS, gadgetForPlan, pickerGadget, planGadgets, POC_GADGETS, restLayout } from '../../src/content/gadgets';
import { LIBRARY } from '../../src/content/library';
import { CHARACTER_ANIMS, OFFICE_LAYOUT } from '../../src/content/office';
import { parseRound, type Outcome } from '../../src/domain/outcome';
import { PLAN_SLOTS, POC_PLAN_SETS, type PlanSlot } from '../../src/domain/plans';
import { classify } from '../../src/domain/resultClass';
import { mulberry32 } from '../../src/domain/seed';
import type { ResultClass, Script, Speed } from '../../src/domain/types';
import type { FlowSnapshot } from '../../src/flow/GameFlow';
import { distributionTable } from '../../src/platform/rgs/mock/mockMath';
import { bookForPick, drawTriple } from '../../src/platform/rgs/mock/tripleMath';
import { branchProbabilities, candidateBranches, compileSequence, compileTrunk } from '../../src/presentation/compileSequence';
import type { BranchDef, GadgetDef } from '../../src/presentation/types';
import { Presenter, type AudioSink, type SceneSink } from '../../src/presenter/Presenter';

const SCRIPTS = policy.scripts_by_class as Record<ResultClass, Partial<Record<Script, number>>>;
const SPEEDS: Speed[] = ['normal', 'turbo', 'super'];
const GRUMPY = POC_PLAN_SETS.grumpy!;
const isLoss = (b: BranchDef) => b.classes.includes('MISS');

function tripleOutcome(slot: PlanSlot, mults: [number, number, number], scripts?: (Script | null)[], seed = 9): Outcome {
  const book = bookForPick(drawTriple('grumpy', GRUMPY, mulberry32(seed), { kind: 'multipliers', multipliers: mults, scripts }), slot, 1);
  return parseRound({ roundId: `R-${seed}`, mode: 'grumpy', betAmount: 1_000_000, payout: book.payoutMultiplier * 10_000, payoutMultiplier100: book.payoutMultiplier, active: true, events: book.events, plan: slot }, 'play');
}

describe('POC 3 PLANS : prototypes B et C (présentation honnête de chaque résultat)', () => {
  it('B et C sont hors du contenu de production ; les plans A, B, C de GRUMPY sont SLINGSHOT, ESPRESSO, COPIER', () => {
    for (const g of POC_GADGETS) expect(GADGETS.includes(g)).toBe(false);
    expect(planGadgets('grumpy')!.map((g) => g.id)).toEqual(['swivel-slingshot', 'espresso-blaster', 'copier-catapult']);
    expect(planGadgets('furious')!.map((g) => g.id)).toEqual(['trapdoor-express', 'cabinet-domino', 'cooler-bowling']);
  });

  it('chaque (classe, script) que GRUMPY peut produire a une branche EXACTE (jamais de repli), BOSS FIGHT compris', () => {
    const classes = new Set(distributionTable('grumpy').map((r) => classify(r.multiplier100)));
    for (const g of POC_GADGETS) {
      for (const cls of classes) {
        const scripts = Object.keys(SCRIPTS[cls]) as Script[];
        for (const script of scripts) {
          const exact = g.branches.filter((b) => b.categories.includes(script) && b.classes.includes(cls));
          expect(exact.length, `${g.id} ${cls}/${script}`).toBeGreaterThan(0);
        }
      }
      expect(candidateBranches({ script: 'BF_ENTRY', resultClass: 'LEGENDARY' }, g).some((b) => b.id.endsWith('-BF')), g.id).toBe(true);
    }
  });

  it('chaque branche se compile à chaque vitesse : une seule révélation, animations et acteurs connus', () => {
    const anims = CHARACTER_ANIMS as Record<string, readonly string[]>;
    for (const g of POC_GADGETS) {
      const rest = restLayout(g);
      const slot = PLAN_SLOTS[GRUMPY.indexOf(g.id)]!;
      for (const b of g.branches) {
        const bf = b.categories.includes('BF_ENTRY');
        const cls = b.classes[0]!;
        const m = cls === 'MISS' ? 0 : cls === 'SCRAPE' ? 0.5 : cls === 'HIT' ? 2 : cls === 'BIG' ? 10 : 25;
        const script = b.categories.find((s) => (SCRIPTS[cls]?.[s] ?? 0) > 0) ?? null;
        const mults: [number, number, number] = [0, 0, 0];
        mults[PLAN_SLOTS.indexOf(slot)] = m;
        for (const speed of SPEEDS) {
          const o = bf
            ? parseRound((() => {
                const book = bookForPick(drawTriple('grumpy', GRUMPY, mulberry32(4), { kind: 'bossFight', rung: 2 }), slot, 1);
                return { roundId: 'BF', mode: 'grumpy' as const, betAmount: 1_000_000, payout: book.payoutMultiplier * 10_000, payoutMultiplier100: book.payoutMultiplier, active: true, events: book.events, plan: slot };
              })(), 'play')
            : tripleOutcome(slot, mults, PLAN_SLOTS.map((s) => (s === slot ? script : null)));
          const seq = compileSequence(o, g, speed, LIBRARY, { forceBranchId: b.id });
          expect(seq.cues.filter((c) => c.kind === 'signal' && c.signal === 'reveal'), `${b.id} ${speed}`).toHaveLength(1);
          for (const c of seq.cues) {
            if (c.kind === 'anim' && anims[c.actor]) expect(anims[c.actor], `${b.id}: ${c.actor}.${c.anim}`).toContain(c.anim);
            if (c.kind === 'tween' || c.kind === 'state' || c.kind === 'anim') {
              expect(c.actor === 'camera' || c.actor in rest || c.actor in OFFICE_LAYOUT, `${b.id}: acteur ${c.actor}`).toBe(true);
            }
          }
        }
      }
    }
  });

  it('règle des deux issues : le tronc et le module commun mènent à une perte ET à un gain ; tronc indépendant du résultat', () => {
    for (const g of POC_GADGETS) {
      const byPath = new Map<string, BranchDef[]>();
      for (const b of g.branches) byPath.set(b.path.join('›'), [...(byPath.get(b.path.join('›')) ?? []), b]);
      for (const [path, bs] of byPath) {
        expect(bs.some(isLoss), `${g.id} ${path}`).toBe(true);
        expect(bs.some((b) => !isLoss(b)), `${g.id} ${path}`).toBe(true);
      }
      expect(compileTrunk(g, 'normal', LIBRARY).key).toBe(compileTrunk(g, 'normal', LIBRARY).key);
    }
  });

  it('vitesse : une manche B ou C ne dure pas plus longtemps en moyenne qu’une manche du lance-pierre (+15 % max)', () => {
    const MULT: Record<ResultClass, number> = { MISS: 0, SCRAPE: 50, HIT: 200, BIG: 1000, MEGA: 5000, LEGENDARY: 20000 };
    const rows = distributionTable('grumpy').filter((r) => r.bossFightRung === null);
    const total = rows.reduce((a, r) => a + r.p, 0);
    const cp: Partial<Record<ResultClass, number>> = {};
    for (const r of rows) cp[classify(r.multiplier100)] = (cp[classify(r.multiplier100)] ?? 0) + r.p / total;
    const meanEnd = (g: GadgetDef, speed: Speed) => {
      let end = 0;
      for (const [cls, pc] of Object.entries(cp) as [ResultClass, number][]) {
        for (const [id, pb] of branchProbabilities(g, cls, SCRIPTS[cls])) {
          const script = g.branches.find((x) => x.id === id)!.categories.find((s) => (SCRIPTS[cls][s] ?? 0) > 0)!;
          const o = Object.freeze({ source: 'dev', roundId: 'T', mode: 'grumpy', betAmount: 1e6, payout: 0, payoutMultiplier100: MULT[cls], resultClass: cls, script, rarity: 'common', seed: 5, bossFight: null, plans: null }) as Outcome;
          end += pc * pb * compileSequence(o, g, speed, LIBRARY, { forceBranchId: id }).totalMs;
        }
      }
      return end;
    };
    const slingshot = planGadgets('grumpy')![0];
    for (const speed of ['normal', 'turbo'] as const) {
      for (const g of POC_GADGETS) expect(meanEnd(g, speed), `${g.id} ${speed}`).toBeLessThanOrEqual(meanEnd(slingshot, speed) * 1.15);
    }
  });

  it('accessoires : ceux de B et C sont déclarés (masqués quand leur plan n’est pas actif)', () => {
    for (const g of POC_GADGETS) for (const p of g.props) expect(ALL_GADGET_PROPS).toContain(p);
  });
});

describe('POC 3 PLANS : seul le plan PAYÉ est joué', () => {
  class Scene implements SceneSink {
    gadgets: GadgetDef[] = [];
    setGadget(g: GadgetDef) {
      this.gadgets.push(g);
    }
    render() {}
  }
  const audio: AudioSink = { play: () => {}, silence: () => {} };

  it('repos : le décor du choix montre les trois plans ; au tir, le gadget choisi ; présentation : le gadget du plan payé', () => {
    const scene = new Scene();
    const p = new Presenter(scene, audio, { plans: true });
    const picker = scene.gadgets.at(-1)!;
    expect(picker.id).toBe('plan-picker');
    expect(picker).toBe(pickerGadget('grumpy'));
    for (const g of planGadgets('grumpy')!) for (const prop of g.props) expect(picker.props).toContain(prop);
    expect(picker.branches).toHaveLength(0);
    p.beginNeutral('grumpy', 'normal', 'C');
    expect(scene.gadgets.at(-1)!.id).toBe('copier-catapult');
    const handle = p.present(tripleOutcome('B', [10, 0, 5]), { speed: 'normal', mode: 'play' });
    expect(handle.info.gadgetId).toBe('espresso-blaster');
    expect(handle.info.branchId).toMatch(/^ESP-/);
    expect(gadgetForPlan('grumpy', 'A').id).toBe('swivel-slingshot');
  });

  it('hors POC : aucun changement (un gadget par niveau)', () => {
    const scene = new Scene();
    new Presenter(scene, audio);
    expect(scene.gadgets.at(-1)!.id).toBe('swivel-slingshot');
  });
});

describe('POC 3 PLANS : collection (le gadget choisi est enregistré ; une alternative non jouée n’entre jamais)', () => {
  const snap = (roundId: string, plan: PlanSlot, gadgetId: string, branchId: string): FlowSnapshot => ({
    state: 'REVEAL',
    balance: null,
    betConfig: null,
    betAmount: 1_000_000,
    level: 'grumpy',
    speed: 'normal',
    capabilities: {} as FlowSnapshot['capabilities'],
    revealed: { roundId, multiplier100: 0, payout: 0, resultClass: 'MISS', plans: tripleOutcome(plan, [0, 25, 10]).plans },
    round: { roundId, mode: 'grumpy', source: 'play', plan },
    plansEnabled: true,
    plan,
    presentation: { branchId, sequenceKey: 'k', totalMs: 1, gadgetId },
    message: null,
    resyncAttempts: 0,
    canFire: false,
    canSkip: false,
    retryAvailable: false,
  });

  it('le tracker transmet le gadget JOUÉ ; le compteur de choix avance une fois par manche ; seules les cartes jouées sont découvertes', async () => {
    const c = new Collection(new MemoryCollectionStore(), buildCatalog());
    await c.init();
    // Plan A joué (lance-pierre, carte du catalogue) alors que B et C portaient x25 et x10.
    const obsA = shouldObserve(snap('R1', 'A', 'swivel-slingshot', 'SLG-A1'))!;
    expect(obsA.gadgetId).toBe('swivel-slingshot');
    expect(c.observe(obsA)?.card.id).toBe('SLG-A1');
    expect(c.observe(obsA)).toBeNull();
    // Plan B joué : prototype, aucune carte ; seul le choix est compté.
    expect(c.observe(shouldObserve(snap('R2', 'B', 'espresso-blaster', 'ESP-L1'))!)).toBeNull();
    expect(c.state.gadgetPicks).toEqual({ 'swivel-slingshot': 1, 'espresso-blaster': 1 });
    expect(Object.keys(c.state.entries)).toEqual(['SLG-A1']);
    // Aucune carte d'un autre plan n'a été ajoutée par le triple.
    for (const id of Object.keys(c.state.entries)) expect(id.startsWith('SLG')).toBe(true);
    expect(sanitizeCollection(JSON.parse(JSON.stringify(c.state))).gadgetPicks).toEqual({ 'swivel-slingshot': 1, 'espresso-blaster': 1 });
  });

  it('un replay ne compte rien', () => {
    const s = snap('R3', 'C', 'copier-catapult', 'COP-L1');
    expect(shouldObserve({ ...s, round: { ...s.round!, source: 'replay' } })).toBeNull();
  });
});

describe('POC 3 PLANS : textes et affichage des autres plans', () => {
  const FORBIDDEN = [/should have/i, /so close/i, /wrong choice/i, /missed/i, /next time/i, /almost/i, /presque/i, /dommage/i, /raté/i];
  const files = [
    'src/app/poc/planLabels.ts',
    'src/app/poc/PlanPicker.svelte',
    'src/app/poc/OtherPlans.svelte',
    'src/app/poc/PocSessionCard.svelte',
    'src/app/poc/PocPlaytestIntro.svelte',
  ];

  it('aucune formule de regret dans les textes du POC', () => {
    for (const f of files) {
      // Commentaires retirés : on vérifie ce que le joueur peut lire.
      const text = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*\/\/.*$/gm, '');
      for (const re of FORBIDDEN) expect(re.test(text), `${f} : ${re}`).toBe(false);
    }
  });

  it('OTHER PLANS : aucun son, aucune couleur de gain, même traitement pour tous les multiplicateurs', () => {
    const src = readFileSync('src/app/poc/OtherPlans.svelte', 'utf8');
    expect(/audio|\.play\(|sound/i.test(src.replace(/\/\*[\s\S]*?\*\//g, ''))).toBe(false);
    expect(/bb-yellow|gold|#7cf0a0|confetti|animation:/i.test(src.split('<style>')[1] ?? '')).toBe(false);
    // Le choix de l'affichage ne dépend jamais du résultat (pas de révélation sélective).
    const logic = src.split('</script>')[0]!;
    expect(/multiplier100\s*[<>=]/.test(logic)).toBe(false);
    const app = readFileSync('src/app/App.svelte', 'utf8');
    const handler = /function onRevealOtherPlans[\s\S]*?\n {2}\}/.exec(app)?.[0] ?? '';
    expect(handler).not.toBe('');
    expect(/audio/.test(handler)).toBe(false);
  });
});
