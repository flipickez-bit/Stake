import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHARACTER_ANIMS } from '../../src/content/office';
import { LIBRARY } from '../../src/content/library';
import { GADGETS, gadgetFor, restLayout } from '../../src/content/gadgets';
import { makeDevOutcome } from '../../src/dev/devOutcomes';
import type { Outcome } from '../../src/domain/outcome';
import { mulberry32 } from '../../src/domain/seed';
import { RAGE_LEVEL_IDS, type RageLevelId, type Speed } from '../../src/domain/types';
import type { ForcedOutcome } from '../../src/platform/rgs/mock/mockMath';
import { compileSequence, compileTrunk, impactTierFor } from '../../src/presentation/compileSequence';
import { SequencePlayer, type PlayerSinks } from '../../src/presentation/SequencePlayer';
import { buildTimeline, evaluate } from '../../src/presentation/timeline';
import type { AnimationSequence, ScheduledCue, Signal } from '../../src/presentation/types';

const SPEEDS: Speed[] = ['normal', 'turbo', 'super'];
const KINDS: ForcedOutcome['kind'][] = ['LOSS', 'WIN', 'BIG_WIN', 'BOSS_FIGHT'];

function outcome(level: RageLevelId, forced: ForcedOutcome, rngSeed = 1): Outcome {
  return makeDevOutcome(level, forced, mulberry32(rngSeed));
}

function compile(o: Outcome, speed: Speed = 'normal'): AnimationSequence {
  return compileSequence(o, gadgetFor(o.mode), speed, LIBRARY);
}

const signals = (seq: AnimationSequence, which?: Signal[]) =>
  seq.cues
    .filter((c): c is Extract<ScheduledCue, { kind: 'signal' }> => c.kind === 'signal' && (!which || which.includes(c.signal)))
    .map((c) => `${c.signal}:${c.value ?? ''}`);

function stripSeeds(cues: ScheduledCue[]): unknown[] {
  return cues.map((c) => {
    const { seed: _seed, ...rest } = c as ScheduledCue & { seed?: number };
    return rest;
  });
}

class RecordingSinks implements PlayerSinks {
  signals: string[] = [];
  sounds: string[] = [];
  frames = 0;
  frame(): void {
    this.frames++;
  }
  sound(id: string): void {
    this.sounds.push(id);
  }
  silence(): void {}
  signal(s: Signal, value: number | undefined): void {
    this.signals.push(`${s}:${value ?? ''}`);
  }
}

describe('contenu placeholder (Phase 0)', () => {
  it('3 gadgets, un par Rage Level, 4 branches chacun (LOSS, WIN, BIG WIN, BOSS FIGHT) : 12 branches', () => {
    expect(GADGETS).toHaveLength(3);
    expect(GADGETS.map((g) => g.rageLevel).sort()).toEqual([...RAGE_LEVEL_IDS].sort());
    expect(GADGETS.flatMap((g) => g.branches)).toHaveLength(12);
  });

  it('chaque combinaison classe × script du book a une branche, à chaque vitesse, avec un seul reveal', () => {
    for (const level of RAGE_LEVEL_IDS) {
      for (const kind of KINDS) {
        for (let s = 1; s <= 12; s++) {
          const o = outcome(level, { kind }, s);
          for (const speed of SPEEDS) {
            const seq = compile(o, speed);
            expect(signals(seq, ['reveal'])).toHaveLength(1);
            expect(seq.markers.reveal).toBeGreaterThan(seq.markers.d1);
            expect(seq.markers.reveal).toBeLessThanOrEqual(seq.markers.end);
          }
        }
      }
    }
  });

  it('les animations référencées existent dans le manifeste des personnages', () => {
    const known = CHARACTER_ANIMS as Record<string, readonly string[]>;
    for (const level of RAGE_LEVEL_IDS) {
      for (const kind of KINDS) {
        const seq = compile(outcome(level, { kind, bossFightRung: 3 }));
        for (const c of seq.cues) {
          if (c.kind !== 'anim') continue;
          expect(known[c.actor], `acteur ${c.actor}`).toBeDefined();
          expect(known[c.actor], `${c.actor}.${c.anim}`).toContain(c.anim);
        }
      }
    }
  });

  it('le tronc est neutre : identique pour toutes les issues et toutes les graines (préfixe de la séquence)', () => {
    for (const gadget of GADGETS) {
      for (const speed of SPEEDS) {
        const trunk = compileTrunk(gadget, speed, LIBRARY);
        for (const kind of KINDS) {
          const seq = compile(outcome(gadget.rageLevel, { kind, seed: 1234 + kind.length }), speed);
          expect(seq.markers.d1).toBeCloseTo(trunk.markers.d1, 6);
          const prefix = seq.cues.filter((c) => c.seg >= 0 && c.seg < trunk.segments.length);
          expect(prefix).toEqual(trunk.cues);
        }
      }
    }
  });
});

describe('déterminisme de la présentation', () => {
  it('COSMETIC SEED : même book → même séquence et mêmes images, deux fois', () => {
    for (const level of RAGE_LEVEL_IDS) {
      for (const kind of KINDS) {
        const o = outcome(level, { kind, seed: 42 });
        const a = compile(o);
        const b = compile(o);
        expect(a.key).toBe(b.key);
        const rest = restLayout(gadgetFor(level));
        const ta = buildTimeline(a, rest);
        const tb = buildTimeline(b, rest);
        for (let t = 0; t <= a.totalMs; t += 97) {
          expect(JSON.parse(JSON.stringify(evaluate(ta, t)))).toEqual(JSON.parse(JSON.stringify(evaluate(tb, t))));
        }
      }
    }
  });

  it('DIFFERENT COSMETIC SEED : seuls les éléments autorisés changent', () => {
    for (const level of RAGE_LEVEL_IDS) {
      for (const kind of KINDS) {
        const a = outcome(level, { kind, bossFightRung: 2, seed: 1 }, 7);
        const b = outcome(level, { kind, bossFightRung: 2, seed: 987654321 }, 7);
        // Mathématiques identiques : la graine n'y touche pas.
        const { seed: sa, ...mathA } = a;
        const { seed: sb, ...mathB } = b;
        expect(sa).not.toBe(sb);
        expect(mathA).toEqual(mathB);
        const qa = compile(a);
        const qb = compile(b);
        // Autorisé : branche parmi les équivalentes (une seule en Phase 0), réaction, caméo, particules, bruit de caméra.
        expect(qa.branchId).toBe(qb.branchId);
        expect(qa.markers.d1).toBe(qb.markers.d1);
        expect(qa.markers.reveal).toBe(qb.markers.reveal);
        expect(signals(qa, ['bfStart', 'bfRung', 'bfBlocked', 'bfKo', 'reveal'])).toEqual(signals(qb, ['bfStart', 'bfRung', 'bfBlocked', 'bfKo', 'reveal']));
        const tier = impactTierFor(a.resultClass);
        const impacts = (q: AnimationSequence) => q.segments.filter((s) => s.phase === 'impact').map((s) => s.id);
        expect(impacts(qa)).toEqual(impacts(qb));
        if (tier && !a.bossFight) expect(impacts(qa).some((id) => id.startsWith(`IMP_${tier}_`))).toBe(true);
        // Tout ce qui précède le reveal est identique, graines d'effets mises à part.
        const upTo = (q: AnimationSequence) => stripSeeds(q.cues.filter((c) => c.at <= q.markers.reveal));
        expect(upTo(qa)).toEqual(upTo(qb));
      }
    }
  });

  it('TURBO / SUPER TURBO : même résultat, même branche, mêmes signaux ; seules les durées changent', () => {
    for (const level of RAGE_LEVEL_IDS) {
      for (const kind of KINDS) {
        const o = outcome(level, { kind, bossFightRung: 3 });
        const [n, t, s] = SPEEDS.map((sp) => compile(o, sp)) as [AnimationSequence, AnimationSequence, AnimationSequence];
        expect(t.branchId).toBe(n.branchId);
        expect(s.branchId).toBe(n.branchId);
        const sig = (q: AnimationSequence) => signals(q, ['reveal', 'bfStart', 'bfRung', 'bfBlocked', 'bfKo', 'end']);
        expect(sig(t)).toEqual(sig(n));
        expect(sig(s)).toEqual(sig(n));
        expect(t.totalMs).toBeLessThan(n.totalMs);
        expect(s.totalMs).toBeLessThan(t.totalMs);
      }
    }
  });

  it('BOSS FIGHT : tout le déroulé est dans la séquence compilée, avant la moindre image', () => {
    for (const level of RAGE_LEVEL_IDS) {
      const o = outcome(level, { kind: 'BOSS_FIGHT', bossFightRung: 2 });
      const bf = o.bossFight!;
      const seq = compile(o);
      const rungs = signals(seq, ['bfRung']);
      expect(rungs).toEqual(Array.from({ length: bf.finalRungIndex + 1 }, (_, i) => `bfRung:${i}`));
      expect(seq.segments.filter((s) => s.id.startsWith('BF_WINDUP_'))).toHaveLength(bf.attacks.length);
      expect(signals(seq, ['bfKo'])).toHaveLength(bf.ko ? 1 : 0);
      expect(signals(seq, ['bfBlocked'])).toHaveLength(bf.ko ? 0 : 1);
    }
  });

  it('aucune source de hasard ou d\'horloge dans la présentation ni dans le contenu', () => {
    const offenders: string[] = [];
    const scan = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) scan(path);
        else if (/\.(ts|svelte)$/.test(name)) {
          const text = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
          if (/Math\.random|Date\.now|performance\.now|crypto\./.test(text)) offenders.push(path);
        }
      }
    };
    scan('src/presentation');
    scan('src/content');
    expect(offenders).toEqual([]);
  });
});

describe('SequencePlayer', () => {
  const o = outcome('furious', { kind: 'BIG_WIN', seed: 5 });
  const gadget = gadgetFor('furious');
  const rest = restLayout(gadget);

  it('lecture continue et seek donnent la même image (état = fonction pure du temps)', () => {
    const seq = compile(o);
    const a = new SequencePlayer(new RecordingSinks());
    a.load(seq, rest);
    for (let i = 0; i < 90; i++) a.tick(16);
    const t = a.time;
    const b = new SequencePlayer(new RecordingSinks());
    b.load(seq, rest);
    b.seek(t);
    expect(JSON.parse(JSON.stringify(b.lastFrame))).toEqual(JSON.parse(JSON.stringify(a.lastFrame)));
  });

  it('hit stop : le temps de séquence s\'arrête pendant le gel', () => {
    const seq = compile(o);
    const freeze = seq.cues.find((c) => c.kind === 'freeze')!;
    const p = new SequencePlayer(new RecordingSinks());
    p.load(seq, rest);
    p.seek(freeze.at - 1);
    p.tick(10);
    expect(p.time).toBe(freeze.at);
    p.tick(20);
    expect(p.time).toBe(freeze.at);
  });

  it('attente réseau : le tronc s\'arrête à D1, puis la séquence complète reprend sans rejouer les événements', () => {
    const sinks = new RecordingSinks();
    const p = new SequencePlayer(sinks);
    const trunk = compileTrunk(gadget, 'normal', LIBRARY);
    p.load(trunk, rest, { open: true, hold: gadget.hold });
    for (let i = 0; i < 200; i++) p.tick(16);
    expect(p.time).toBe(trunk.markers.d1);
    expect(p.waitingMs).toBeGreaterThan(1000);
    const soundsBefore = sinks.sounds.length;
    const full = compile(o);
    p.extend(full, rest);
    for (let i = 0; i < 1000 && !p.isFinished; i++) p.tick(16);
    expect(p.isFinished).toBe(true);
    const trunkSounds = trunk.cues.filter((c) => c.kind === 'sound').length;
    const fullSounds = full.cues.filter((c) => c.kind === 'sound').length;
    // Sons du tronc joués une fois, sons d'attente, puis le reste de la séquence (aucun doublon).
    expect(sinks.sounds.length - soundsBefore).toBe(fullSounds - trunkSounds);
    expect(sinks.signals.filter((s) => s.startsWith('reveal'))).toHaveLength(1);
  });

  it('SLAMSTOP / SKIP : même reveal, mêmes signaux de BOSS FIGHT, émis une seule fois', () => {
    const bf = outcome('unhinged', { kind: 'BOSS_FIGHT', bossFightRung: 4 });
    const seq = compile(bf);
    const full = new RecordingSinks();
    const a = new SequencePlayer(full);
    a.load(seq, restLayout(gadgetFor('unhinged')));
    for (let i = 0; i < 5000 && !a.isFinished; i++) a.tick(16);
    const skipped = new RecordingSinks();
    const b = new SequencePlayer(skipped);
    b.load(seq, restLayout(gadgetFor('unhinged')));
    b.tick(300);
    expect(b.skipToReveal()).toBe(true);
    expect(b.time).toBe(seq.markers.reveal);
    expect(b.skipToReveal()).toBe(true);
    expect(b.isFinished).toBe(true);
    expect(skipped.signals).toEqual(full.signals);
  });
});
