/**
 * Variété et prévisibilité (Phase 0.5B).
 * - Toutes les branches se compilent, à toutes les vitesses, avec une seule révélation.
 * - Règle des deux issues : tout chemin visible avant la révélation peut encore mener à une perte ET à un gain.
 * - Rapport de vraisemblance des setups : voir un setup ne change pas les chances de gain de plus de ×2.
 * - La fin révèle vite (le suspense est dans les modules partagés, pas dans une fin qui « s'annonce »).
 * Avec VARIETY_REPORT=<fichier>, écrit aussi le rapport docs/generated/VARIETY_REPORT.md.
 */
import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import policy from '../../config/presentation_policy.json';
import { CHARACTER_ANIMS, OFFICE_LAYOUT } from '../../src/content/office';
import { LIBRARY } from '../../src/content/library';
import { GADGETS, restLayout } from '../../src/content/gadgets';
import { makeDevOutcome } from '../../src/dev/devOutcomes';
import type { Outcome } from '../../src/domain/outcome';
import { classify } from '../../src/domain/resultClass';
import { mulberry32 } from '../../src/domain/seed';
import type { RageLevelId, ResultClass, Script, Speed } from '../../src/domain/types';
import { distributionTable } from '../../src/platform/rgs/mock/mockMath';
import { branchProbabilities, compileSequence, compileTrunk } from '../../src/presentation/compileSequence';
import type { BranchDef, GadgetDef } from '../../src/presentation/types';
import { RARITY_WEIGHT } from '../../src/presentation/types';

const SPEEDS: Speed[] = ['normal', 'turbo', 'super'];
const SCRIPTS = policy.scripts_by_class as Record<ResultClass, Partial<Record<Script, number>>>;
const WIN_CLASSES: ResultClass[] = ['SCRAPE', 'HIT', 'BIG', 'MEGA', 'LEGENDARY'];
const MULT: Record<ResultClass, number> = { MISS: 0, SCRAPE: 50, HIT: 200, BIG: 1000, MEGA: 5000, LEGENDARY: 20000 };

const isBf = (b: BranchDef) => b.categories.includes('BF_ENTRY');
const isLoss = (b: BranchDef) => b.classes.includes('MISS');

function outcomeFor(g: GadgetDef, b: BranchDef, seed: number): Outcome {
  if (isBf(b)) return makeDevOutcome(g.rageLevel, { kind: 'BOSS_FIGHT', bossFightRung: 2, seed }, mulberry32(seed));
  const cls = b.classes[0] as ResultClass;
  const script = b.categories.find((s) => (SCRIPTS[cls][s] ?? 0) > 0) ?? (b.categories[0] as Script);
  return Object.freeze({ source: 'dev', roundId: 'T', mode: g.rageLevel, betAmount: 1_000_000, payout: MULT[cls] * 10_000, payoutMultiplier100: MULT[cls], resultClass: cls, script, rarity: 'common', seed, bossFight: null }) as Outcome;
}

/** Probabilités des classes (hors BOSS FIGHT) pour un Rage Level, depuis la distribution mathématique. */
function classProbs(level: RageLevelId): Record<ResultClass, number> {
  const out = { MISS: 0, SCRAPE: 0, HIT: 0, BIG: 0, MEGA: 0, LEGENDARY: 0 } as Record<ResultClass, number>;
  const rows = distributionTable(level).filter((r) => r.bossFightRung === null);
  const total = rows.reduce((a, r) => a + r.p, 0);
  for (const r of rows) out[classify(r.multiplier100)] += r.p / total;
  return out;
}

/** P(branche | perte) et P(branche | gain), et P(branche) par manche. */
function branchDistribution(g: GadgetDef) {
  const cp = classProbs(g.rageLevel);
  const loss = branchProbabilities(g, 'MISS', SCRIPTS.MISS);
  const win = new Map<string, number>();
  const perRound = new Map<string, number>();
  const pWin = WIN_CLASSES.reduce((a, c) => a + cp[c], 0);
  for (const c of WIN_CLASSES) {
    for (const [id, p] of branchProbabilities(g, c, SCRIPTS[c])) {
      win.set(id, (win.get(id) ?? 0) + (p * cp[c]) / pWin);
      perRound.set(id, (perRound.get(id) ?? 0) + p * cp[c]);
    }
  }
  for (const [id, p] of loss) perRound.set(id, (perRound.get(id) ?? 0) + p * cp.MISS);
  return { loss, win, perRound, pWin, pLoss: cp.MISS };
}

function prefixes(g: GadgetDef): Map<string, BranchDef[]> {
  const out = new Map<string, BranchDef[]>();
  for (const b of g.branches.filter((x) => !isBf(x))) {
    for (let i = 1; i <= b.path.length; i++) {
      const key = b.path.slice(0, i).join(' › ');
      out.set(key, [...(out.get(key) ?? []), b]);
    }
  }
  return out;
}

function likelihoodRatios(g: GadgetDef) {
  const d = branchDistribution(g);
  return [...prefixes(g)].map(([prefix, branches]) => {
    const pl = branches.reduce((a, b) => a + (d.loss.get(b.id) ?? 0), 0);
    const pw = branches.reduce((a, b) => a + (d.win.get(b.id) ?? 0), 0);
    const pWinGivenPrefix = (pw * d.pWin) / (pw * d.pWin + pl * d.pLoss);
    return { prefix, depth: prefix.split(' › ').length, pl, pw, lr: pl > 0 ? pw / pl : Number.POSITIVE_INFINITY, pWinGivenPrefix };
  });
}

describe('variété V2 : contenu', () => {
  it('8 à 18 branches visuellement distinctes par gadget, dont 2 entrées de BOSS FIGHT, toutes les raretés présentes', () => {
    for (const g of GADGETS) {
      const nonBf = g.branches.filter((b) => !isBf(b));
      expect(nonBf.length, g.id).toBeGreaterThanOrEqual(8);
      expect(g.branches.length, g.id).toBeLessThanOrEqual(18);
      expect(g.branches.filter(isBf), g.id).toHaveLength(2);
      expect(new Set(g.branches.map((b) => b.id)).size).toBe(g.branches.length);
      for (const r of ['COMMON', 'UNCOMMON', 'RARE'] as const) expect(g.branches.some((b) => b.rarity === r), `${g.id} ${r}`).toBe(true);
      expect(nonBf.filter(isLoss).length, `${g.id} pertes`).toBeGreaterThanOrEqual(5);
    }
  });

  it('chaque branche se compile à chaque vitesse, une seule révélation, animations et acteurs connus', () => {
    const anims = CHARACTER_ANIMS as Record<string, readonly string[]>;
    for (const g of GADGETS) {
      const rest = restLayout(g);
      for (const b of g.branches) {
        for (const speed of SPEEDS) {
          const o = outcomeFor(g, b, 12345);
          const seq = compileSequence(o, g, speed, LIBRARY, { forceBranchId: b.id });
          const reveals = seq.cues.filter((c) => c.kind === 'signal' && c.signal === 'reveal');
          expect(reveals, `${b.id} ${speed}`).toHaveLength(1);
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

  it('la fin révèle vite : ≤ 800 ms après son début (≤ 1 300 ms pour RARE et VERY_RARE)', () => {
    for (const g of GADGETS) {
      const trunkSegs = compileTrunk(g, 'normal', LIBRARY).segments.length;
      for (const b of g.branches.filter((x) => !isBf(x))) {
        const seq = compileSequence(outcomeFor(g, b, 7), g, 'normal', LIBRARY, { forceBranchId: b.id });
        const endingStart = seq.segments[trunkSegs + b.path.length]!.start;
        const limit = b.rarity === 'RARE' || b.rarity === 'VERY_RARE' ? 1300 : 800;
        expect(seq.markers.reveal - endingStart, b.id).toBeLessThanOrEqual(limit);
      }
    }
  });
});

describe('prévisibilité', () => {
  it('règle des deux issues : chaque chemin visible avant la révélation peut mener à une perte ET à un gain', () => {
    for (const g of GADGETS) {
      for (const [prefix, branches] of prefixes(g)) {
        expect(branches.some(isLoss), `${g.id}: ${prefix} → aucune perte`).toBe(true);
        expect(branches.some((b) => !isLoss(b)), `${g.id}: ${prefix} → aucun gain`).toBe(true);
      }
    }
  });

  it('aucun moment visible (setup, puis chaque twist) ne change les chances de gain de plus de ×2', () => {
    for (const g of GADGETS) {
      for (const r of likelihoodRatios(g)) {
        expect(r.lr, `${g.id}: ${r.prefix}`).toBeGreaterThanOrEqual(0.5);
        expect(r.lr, `${g.id}: ${r.prefix}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it('la rareté ne change pas les maths : le choix de branche ne dépend que du résultat déjà fixé et de la graine', () => {
    const g = GADGETS[2]!;
    const a = makeDevOutcome(g.rageLevel, { kind: 'LOSS', multiplier: 0, seed: 99 }, mulberry32(3));
    const b = makeDevOutcome(g.rageLevel, { kind: 'LOSS', multiplier: 0, seed: 99 }, mulberry32(3));
    expect(compileSequence(a, g, 'normal', LIBRARY).branchId).toBe(compileSequence(b, g, 'normal', LIBRARY).branchId);
    // Sur beaucoup de graines, la fréquence observée suit les poids de rareté.
    const counts = new Map<string, number>();
    for (let seed = 1; seed <= 4000; seed++) {
      const o = { ...a, seed, script: 'CLEAN_MISS' as Script };
      const id = compileSequence(o, g, 'normal', LIBRARY).branchId;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const expected = branchProbabilities(g, 'MISS', { CLEAN_MISS: 1 });
    for (const [id, p] of expected) expect(Math.abs((counts.get(id) ?? 0) / 4000 - p), id).toBeLessThan(0.03);
  });
});

// ------------------------------------------------------------------ rapport (optionnel)
const reportPath = process.env.VARIETY_REPORT;
if (reportPath) {
  it('écrit le rapport de variété', () => {
    const lines: string[] = [
      '# Variété et prévisibilité — BAD BOSS (variété V2)', '',
      `> Généré par \`VARIETY_REPORT=${reportPath} npx vitest run tests/unit/variety.test.ts\` le ${new Date().toISOString().slice(0, 10)}. Ne pas éditer.`,
      '> Calcul exact depuis le contenu, les poids de rareté cosmétique, la distribution des scripts du book (config/presentation_policy.json)',
      '> et la distribution mathématique du Rage Level (hors BOSS FIGHT). La rareté ne modifie jamais les maths : elle choisit parmi des branches compatibles.', '',
      `Poids de rareté : ${Object.entries(RARITY_WEIGHT).map(([k, v]) => `${k} ${v}`).join(' · ')}.`, '',
    ];
    for (const g of GADGETS) {
      const d = branchDistribution(g);
      lines.push(`## ${g.label} (${g.rageLevel}) — ${g.branches.length} branches`, '');
      lines.push('| Branche | Chemin visible avant la fin | Fin | Rareté | P / manche | 1re apparition (manches, médiane) | Vue en 50 / 100 / 200 manches |', '|---|---|---|---|---:|---:|---|');
      for (const b of g.branches) {
        const p = d.perRound.get(b.id) ?? 0;
        const kind = isBf(b) ? 'BOSS FIGHT' : isLoss(b) ? 'PERTE' : b.classes.includes('BIG') && !b.classes.includes('HIT') ? 'GROS GAIN' : 'GAIN';
        const seen = (n: number) => (p > 0 ? `${Math.round((1 - (1 - p) ** n) * 100)} %` : '—');
        lines.push(`| ${b.id} ${b.label} | ${b.path.join(' › ')} | ${kind} | ${b.rarity} | ${p > 0 ? `${(p * 100).toFixed(2)} %` : '(1/150 × part)'} | ${p > 0 ? Math.round(Math.log(0.5) / Math.log(1 - p)) : '—'} | ${seen(50)} / ${seen(100)} / ${seen(200)} |`);
      }
      const distinct = (n: number) => [...d.perRound.values()].reduce((a, p) => a + 1 - (1 - p) ** n, 0);
      lines.push('', `Branches distinctes attendues (même Rage Level, hors BOSS FIGHT) : ${[10, 25, 50, 100, 200].map((n) => `${n} manches → ${distinct(n).toFixed(1)}`).join(' · ')}.`, '');
      const col = (m: Map<string, number>) => [...m.values()].reduce((a, p) => a + p * p, 0);
      lines.push(`Même branche deux fois de suite : perte → perte ${(col(d.loss) * 100).toFixed(0)} %, gain → gain ${(col(d.win) * 100).toFixed(0)} %.`, '');
      lines.push('| Chemin visible | Profondeur | P(chemin | perte) | P(chemin | gain) | Rapport de vraisemblance | P(gain | chemin) (base ' + `${(d.pWin * 100).toFixed(0)} %) |`, '|---|---:|---:|---:|---:|---:|');
      for (const r of likelihoodRatios(g)) {
        lines.push(`| ${r.prefix} | ${r.depth} | ${(r.pl * 100).toFixed(1)} % | ${(r.pw * 100).toFixed(1)} % | ${Number.isFinite(r.lr) ? r.lr.toFixed(2) : '∞'} | ${(r.pWinGivenPrefix * 100).toFixed(0)} % |`);
      }
      lines.push('');
    }
    // Session mixte : le joueur répartit ses manches sur les 3 Rage Levels (1/3 chacun).
    const all = GADGETS.flatMap((g) => [...branchDistribution(g).perRound.values()].map((p) => p / GADGETS.length));
    const seen = (n: number) => all.reduce((a, p) => a + 1 - (1 - p) ** n, 0);
    lines.push('## Session mixte (1/3 des manches par Rage Level)', '');
    lines.push(`Branches distinctes attendues (hors BOSS FIGHT, sur ${all.length}) : ${[10, 25, 50, 100, 200].map((n) => `${n} manches → ${seen(n).toFixed(1)}`).join(' · ')}.`);
    lines.push(`Nouvelles branches attendues entre la 41e et la 50e manche : ${(seen(50) - seen(40)).toFixed(1)} ; entre la 91e et la 100e : ${(seen(100) - seen(90)).toFixed(1)}.`, '');
    writeFileSync(reportPath, `${lines.join('\n')}\n`);
  });
}
