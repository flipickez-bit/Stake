/**
 * ART BIBLE §14 — contrôle AUTOMATIQUE de cohérence des assets (Phase 0.6).
 * Chaque pièce SVG : couleurs de la palette uniquement, échelle de traits de sa catégorie, ni noir pur ni blanc pur
 * (hors masques de luminance), ni texte ni image incrustés, pivot dans la pièce, identifiant unique.
 */
import { describe, expect, it } from 'vitest';
import { packShelves } from '../../src/render/art/atlas';
import { PALETTE_VALUES, STROKES } from '../../src/render/art/palette';
import { BOSS_PARTS } from '../../src/render/art/parts/boss';
import { CAST_PARTS } from '../../src/render/art/parts/cast';
import { OFFICE_PARTS } from '../../src/render/art/parts/office';
import { PLAN_PARTS } from '../../src/render/art/parts/plans';
import { FURIOUS_PARTS } from '../../src/render/art/parts/furious';
import { UNHINGED_PARTS } from '../../src/render/art/parts/unhinged';
import { VFX_PARTS } from '../../src/render/art/parts/vfx';
import { TROPHY_PARTS } from '../../src/render/art/parts/trophies';
import { ART_BOOKS, PLAN_BOOK, TROPHY_BOOK } from '../../src/render/art/books';

const ALL = [...BOSS_PARTS, ...CAST_PARTS, ...OFFICE_PARTS, ...VFX_PARTS, ...PLAN_PARTS, ...FURIOUS_PARTS, ...UNHINGED_PARTS, ...TROPHY_PARTS];

/** Retire les masques de luminance (blanc/noir techniques) et les dégradés qu'ils utilisent. */
function visible(body: string): string {
  const masks = [...body.matchAll(/<mask[\s\S]*?<\/mask>/g)].map((m) => m[0]);
  let out = body;
  for (const m of masks) {
    out = out.replace(m, '');
    for (const ref of m.matchAll(/url\(#([^)]+)\)/g)) out = out.replace(new RegExp(`<(linear|radial)Gradient id="${ref[1]}"[\\s\\S]*?</\\1Gradient>`), '');
  }
  return out;
}

describe('ART BIBLE : cohérence automatique des assets', () => {
  it('identifiants uniques, pivots dans la pièce', () => {
    const ids = new Set<string>();
    for (const p of ALL) {
      expect(ids.has(p.id), p.id).toBe(false);
      ids.add(p.id);
      expect(p.ax >= 0 && p.ax <= p.w && p.ay >= 0 && p.ay <= p.h, `${p.id} pivot`).toBe(true);
    }
  });

  it('couleurs : uniquement la palette (ni noir pur, ni blanc pur, ni couleur nommée)', () => {
    for (const p of ALL) {
      const body = visible(p.body);
      for (const m of body.matchAll(/(?:fill|stroke|stop-color)="([^"]+)"/g)) {
        const v = m[1]!;
        if (v === 'none' || v.startsWith('url(#')) continue;
        expect(PALETTE_VALUES.has(v.toUpperCase()), `${p.id} : couleur hors palette ${v}`).toBe(true);
      }
      expect(/#000\b|#000000|"black"|"white"|#fff\b|#ffffff/i.test(body), `${p.id} : noir/blanc pur`).toBe(false);
    }
  });

  it('traits : échelle de la catégorie (lointain sans trait, fond plus fin que les personnages)', () => {
    for (const p of ALL) {
      const body = visible(p.body).replace(/<[^>]*data-tube="1"[^>]*>/g, '');
      for (const m of body.matchAll(/stroke-width="([\d.]+)"/g)) {
        expect(STROKES[p.category], `${p.id} (${p.category}) : trait ${m[1]}`).toContain(Number(m[1]));
      }
    }
    expect(Math.max(...STROKES.background)).toBeLessThan(Math.max(...STROKES.character));
    expect(STROKES.far).toHaveLength(0);
  });

  it('ni texte ni image incrustés, aucune ressource externe', () => {
    for (const p of ALL) {
      expect(/<text|<image|href="http|xlink:href/.test(p.body), p.id).toBe(false);
    }
  });

  it('atlas : chaque pièce dans un seul livre ; une page par livre, sans chevauchement ; budget mémoire', () => {
    const pow2 = (n: number) => { let v = 64; while (v < n) v *= 2; return v; };
    const seen = new Set<string>();
    /** Mémoire GPU d'un livre (mipmaps comprises, Mo), comme au chargement (largeur de page ≤ maxPx). */
    const mb = (book: typeof PLAN_BOOK) => {
      const maxW = (book.maxPx ?? 2048) / book.scale;
      const { pages } = packShelves(book.parts, maxW, 2048 / book.scale);
      expect(pages.length, book.id).toBe(1);
      for (const page of pages) {
        const boxes = page.placed.map(({ part, x, y }) => ({ x, y, w: part.w, h: part.h }));
        for (const b of boxes) expect(b.x + b.w <= maxW && b.y + b.h <= 2048 / book.scale).toBe(true);
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i]!;
            const b = boxes[j]!;
            const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
            expect(overlap, `${book.id} : chevauchement`).toBe(false);
          }
        }
      }
      return pages.reduce((a, pg) => a + pow2(pg.width * book.scale) * pow2(pg.height * book.scale) * 4, 0) * (4 / 3) / 1048576;
    };
    for (const book of [...ART_BOOKS, PLAN_BOOK, TROPHY_BOOK]) {
      for (const p of book.parts) {
        expect(seen.has(p.id), `${p.id} dans deux livres`).toBe(false);
        seen.add(p.id);
      }
    }
    expect(seen.size).toBe(ALL.length);
    const base = ART_BOOKS.reduce((a, b) => a + mb(b), 0);
    const plans = mb(PLAN_BOOK);
    const trophies = mb(TROPHY_BOOK);
    // Mémoire GPU des atlas (mipmaps comprises). Cible MVP_ROADMAP §4 : ≤ 64 Mo de textures actives sur mobile,
    // tampons d'affichage compris : les atlas restent sous 40 Mo, tout chargé (pire cas : plans ET trophées).
    expect(base).toBeLessThanOrEqual(36);
    expect(base + plans + trophies).toBeLessThanOrEqual(40);
    expect(pow2(packShelves(PLAN_BOOK.parts, (PLAN_BOOK.maxPx ?? 2048) / PLAN_BOOK.scale, 2048 / PLAN_BOOK.scale).pages[0]!.width * PLAN_BOOK.scale)).toBeLessThanOrEqual(1024);
  });
});
