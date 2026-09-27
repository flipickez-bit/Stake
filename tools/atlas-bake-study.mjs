#!/usr/bin/env node
/**
 * ÉTUDE (LOT 6) : atlas PRÉ-RENDUS au build. Rastérise chaque livre d'art dans Chromium (comme le jeu aujourd'hui),
 * mesure le temps de rastérisation, puis la taille de chaque page encodée en WebP (q 0,9 / 0,8) et en PNG.
 * Rien n'est écrit dans le jeu : c'est une mesure pour décider (docs/generated/ATLAS_BAKE_STUDY.md).
 * Usage : node tools/atlas-bake-study.mjs [--markdown docs/generated/ATLAS_BAKE_STUDY.md]
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const md = arg('markdown', '');
const port = 5211;
const server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-server.pid, 'SIGTERM'); } catch {} };
process.on('exit', stop);
await new Promise((r) => setTimeout(r, 4000));

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
await page.goto(`http://localhost:${port}/?plans=off`);
await page.waitForFunction(() => window.__BADBOSS__?.state().state === 'READY', null, { timeout: 90000 });
const rows = await page.evaluate(async () => {
  const { rasterPages } = await import('/src/render/art/atlas.ts');
  const { ART_BOOKS, PLAN_BOOK } = await import('/src/render/art/books.ts');
  const blobSize = (canvas, type, q) => new Promise((res) => canvas.toBlob((b) => res(b ? b.size : -1), type, q));
  const out = [];
  for (const book of [...ART_BOOKS, PLAN_BOOK]) {
    // Nouvelle rastérisation (id distinct : le cache de session ne sert pas) pour mesurer le temps réel.
    const t0 = performance.now();
    const pages = await rasterPages({ ...book, id: `${book.id}#study` });
    const ms = performance.now() - t0;
    for (const [i, p] of pages.entries()) {
      out.push({
        book: book.id, page: i, w: p.canvas.width, h: p.canvas.height, parts: p.placed.length, rasterMs: i === 0 ? Math.round(ms) : null,
        webp90: await blobSize(p.canvas, 'image/webp', 0.9), webp80: await blobSize(p.canvas, 'image/webp', 0.8), png: await blobSize(p.canvas, 'image/png'),
      });
    }
  }
  return out;
});
await browser.close();
stop();

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const sum = (k) => rows.reduce((a, r) => a + r[k], 0);
const lines = [
  '# ÉTUDE — atlas pré-rendus au build (généré)',
  '',
  `> Généré par \`node tools/atlas-bake-study.mjs\` le ${new Date().toISOString().slice(0, 10)}. Ne pas éditer.`,
  '> Pages rastérisées dans Chromium headless à partir des SVG du jeu (exactement ce que le jeu fait au démarrage aujourd\'hui), puis encodées par le navigateur. Temps de rastérisation : machine de build (CPU), SwiftShader ; un téléphone peut être 2 à 5 fois plus lent.',
  '',
  '| Livre | Page | Taille (px) | Pièces | Rastérisation | WebP q0,9 | WebP q0,8 | PNG | Mémoire GPU (RGBA) |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...rows.map((r) => `| ${r.book} | ${r.page} | ${r.w} × ${r.h} | ${r.parts} | ${r.rasterMs === null ? '' : `${r.rasterMs} ms`} | ${kb(r.webp90)} | ${kb(r.webp80)} | ${kb(r.png)} | ${(r.w * r.h * 4 / 1048576).toFixed(2)} Mo |`),
  `| **Total** | | | ${sum('parts')} | ${rows.reduce((a, r) => a + (r.rasterMs ?? 0), 0)} ms | **${kb(sum('webp90'))}** | **${kb(sum('webp80'))}** | ${kb(sum('png'))} | ${(rows.reduce((a, r) => a + r.w * r.h * 4, 0) / 1048576).toFixed(2)} Mo |`,
  '',
];
console.log(lines.join('\n'));
if (md) writeFileSync(md, `${lines.join('\n')}\n`);
