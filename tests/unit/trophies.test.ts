/**
 * TROPHÉES VISIBLES (docs/PROPOSITION_RECOMPENSES_VISUELLES.md) : logique pure, sans rendu.
 * Ce que la collection montre dans le bureau est une fonction de l'état de la collection, et de rien d'autre.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildCatalog } from '../../src/collection/catalog';
import { EMPTY_TROPHIES, INJURY_BY_GADGET, TIER_AT, tierFor, trophiesFrom, trophyUnlocks } from '../../src/collection/trophies';
import type { CollectionState } from '../../src/collection/types';
import { GADGETS } from '../../src/content/gadgets';
import { PLAN_SETS } from '../../src/domain/plans';

const catalog = buildCatalog(GADGETS);

function stateWith(ids: string[], milestones: CollectionState['milestones'] = {}): CollectionState {
  const entries: CollectionState['entries'] = {};
  ids.forEach((id, i) => (entries[id] = { firstSeenAt: new Date(Date.UTC(2026, 8, 1, 0, 0, i)).toISOString(), firstRoundId: `R-${i}`, seen: 1, source: 'play' }));
  return { version: 1, entries, milestones, equipped: {}, opens: 0, recentRoundIds: [], rewardsSeen: [] };
}

const cardsOf = (gadgetId: string) => catalog.cards.filter((c) => c.gadgetId === gadgetId).map((c) => c.id);

describe('trophées visibles de la collection', () => {
  it('collection désactivée ou vide : aucun trophée', () => {
    expect(trophiesFrom(null, catalog)).toBe(EMPTY_TROPHIES);
    const t = trophiesFrom(stateWith([]), catalog);
    expect(t.photos).toEqual([]);
    expect(t.scars).toEqual([]);
    expect(t.injuries).toEqual([]);
    expect(Object.values(t.tiers).every((x) => x === 0)).toBe(true);
  });

  it('HALL OF SHAME : une photo par carte découverte, dans l\'ordre des découvertes', () => {
    const ids = [cardsOf('espresso-blaster')[2]!, cardsOf('swivel-slingshot')[0]!, cardsOf('office-rocket')[1]!];
    const t = trophiesFrom(stateWith(ids), catalog);
    expect(t.photos.map((p) => p.cardId)).toEqual(ids);
    expect(t.photos.map((p) => p.gadgetId)).toEqual(['espresso-blaster', 'swivel-slingshot', 'office-rocket']);
  });

  it('niveaux des gadgets : 3 / 6 / 10 découvertes avec CE gadget ; une blessure de B.B. dès TUNED ; une cicatrice dès la 1re', () => {
    expect([0, 2, 3, 5, 6, 9, 10, 18].map(tierFor)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(TIER_AT).toEqual([0, 3, 6, 10]);
    const esp = cardsOf('espresso-blaster');
    const t = trophiesFrom(stateWith([...esp.slice(0, 6), cardsOf('cabinet-domino')[0]!]), catalog);
    expect(t.tiers['espresso-blaster']).toBe(2);
    expect(t.tiers['cabinet-domino']).toBe(0);
    expect(t.scars.sort()).toEqual(['cabinet-domino', 'espresso-blaster']);
    expect(t.injuries).toEqual(['stain']);
  });

  it('chacun des 9 gadgets a sa blessure et sa cicatrice (toutes différentes)', () => {
    const all = Object.values(PLAN_SETS).flat();
    expect(Object.keys(INJURY_BY_GADGET).sort()).toEqual([...all].sort());
    expect(new Set(Object.values(INJURY_BY_GADGET)).size).toBe(9);
    const t = trophiesFrom(stateWith(catalog.cards.map((c) => c.id), { 'count-10': 'x', 'count-25': 'x', half: 'x', explorer: 'x', 'full-mvp': 'x' }), catalog);
    expect(t.injuries).toHaveLength(9);
    expect(t.scars).toHaveLength(9);
    expect(Object.values(t.tiers).every((x) => x === 3)).toBe(true);
    expect(t.stage).toEqual({ hallSign: true, hrBoxes: true, caution: true, condemned: true, fullSections: ['grumpy', 'furious', 'unhinged', 'bossfight'], exBoss: true });
  });

  it('nouveautés : photos, cicatrice, niveau, blessure et étape du bureau apparues entre deux états', () => {
    const esp = cardsOf('espresso-blaster');
    const before = trophiesFrom(stateWith(esp.slice(0, 2)), catalog);
    const after = trophiesFrom(stateWith([...esp.slice(0, 3), cardsOf('ceiling-safe')[0]!], { 'count-10': 'x' }), catalog);
    const u = trophyUnlocks(before, after);
    expect(u.filter((x) => x.kind === 'photo')).toHaveLength(2);
    expect(u).toContainEqual({ kind: 'scar', gadgetId: 'ceiling-safe' });
    expect(u).toContainEqual({ kind: 'tier', gadgetId: 'espresso-blaster', tier: 1 });
    expect(u).toContainEqual({ kind: 'injury', injury: 'stain', gadgetId: 'espresso-blaster' });
    expect(u).toContainEqual({ kind: 'stage', stage: 'hallSign' });
    expect(trophyUnlocks(after, after)).toEqual([]);
  });

  it('jamais d\'or (signal du BOSS FIGHT) ni de valeur d\'argent dans les trophées', () => {
    const art = readFileSync('src/render/art/parts/trophies.ts', 'utf8');
    expect(/'gold(Light|Shade)?'/.test(art)).toBe(false);
    for (const f of ['src/collection/trophies.ts', 'src/render/TrophyLayer.ts', 'src/app/collection/TrophyToast.svelte']) {
      const src = readFileSync(f, 'utf8');
      // Textes montrés au joueur (littéraux de chaîne, commentaires exclus) : aucun gain, montant, tour gratuit ni bonus.
      const code = src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$|<!--[\s\S]*?-->/gm, '');
      expect(/Math\.random/.test(code), f).toBe(false);
      const literals = [...code.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g)].map((m) => m[1] ?? m[2] ?? m[3] ?? '');
      for (const text of literals) expect(/\bWIN\b|\$\d|FREE (ROUND|SPIN)|CREDIT|BONUS|JACKPOT/i.test(text), `${f} : « ${text} »`).toBe(false);
    }
  });
});
