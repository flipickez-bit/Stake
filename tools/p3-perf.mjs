#!/usr/bin/env node
/**
 * PRODUCTION 3 GADGETS — performances (desktop + 3 téléphones en portrait), build de production (vite build).
 * Pour chaque format : initialisation de la scène (livres de base), arrivée des livres différés, mémoire des textures,
 * objets d'affichage, tas JS, puis LOOP de 9 manches en vitesse normale (les 9 gadgets : 3 niveaux × plans A, B, C) avec
 * appels de dessin WebGL par image, particules, images/s et temps CPU par image.
 * ATTENTION : Chromium headless + SwiftShader (rendu LOGICIEL) : les images/s ne représentent PAS un téléphone réel
 * (seules les tendances et les budgets de mémoire, d'appels de dessin et de particules sont significatifs).
 * Usage : node tools/p3-perf.mjs [--rounds 9] [--markdown docs/generated/P3_PERF.md]
 */
import { execSync, spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const rounds = Number(arg('rounds', '9'));
const md = arg('markdown', '');
const port = Number(arg('port', '4182'));
const OUT = 'tools/.scratch/dist-perf';

execSync(`npx vite build --outDir ${OUT} --emptyOutDir`, { stdio: 'ignore' });
const server = spawn('npx', ['vite', 'preview', '--outDir', OUT, '--port', String(port), '--strictPort'], { stdio: 'ignore', detached: true });
const stop = () => {
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {}
};
process.on('exit', stop);
await new Promise((r) => setTimeout(r, 2500));

const FORMATS = [
  { id: 'desktop', label: 'Desktop 1100 × 760', viewport: { width: 1100, height: 760 }, dpr: 1, mobile: false },
  { id: 'p360', label: 'Téléphone 360 × 640 (DPR 2)', viewport: { width: 360, height: 640 }, dpr: 2, mobile: true },
  { id: 'p390', label: 'Téléphone 390 × 844 (DPR 2)', viewport: { width: 390, height: 844 }, dpr: 2, mobile: true },
  { id: 'p430', label: 'Téléphone 430 × 932 (DPR 2)', viewport: { width: 430, height: 932 }, dpr: 2, mobile: true },
];

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info'],
});

async function measure(f) {
  const ctx = await browser.newContext({ viewport: f.viewport, deviceScaleFactor: f.dpr, isMobile: f.mobile, hasTouch: f.mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // Appels de dessin WebGL : compteur global, relevé à chaque image.
  await page.addInitScript(() => {
    window.__draws = 0;
    window.__frameDraws = [];
    for (const C of [WebGL2RenderingContext, WebGLRenderingContext]) {
      for (const fn of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
        const orig = C.prototype[fn];
        if (!orig) continue;
        C.prototype[fn] = function (...a) {
          window.__draws++;
          return orig.apply(this, a);
        };
      }
    }
    let last = 0;
    const tick = () => {
      if (window.__recordDraws) window.__frameDraws.push(window.__draws - last);
      last = window.__draws;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const t0 = Date.now();
  await page.goto(`http://localhost:${port}/`);
  await page.waitForFunction(() => window.__BADBOSS__?.state().state === 'READY', null, { timeout: 90000 });
  const readyMs = Date.now() - t0;
  await page.waitForTimeout(1500);
  const boot = await page.evaluate(() => ({
    stageInitMs: Math.round(window.__BADBOSS__.dev.stageInitMs()),
    artReadyMs: Math.round(window.__BADBOSS__.dev.artReadyMs() ?? -1),
    stats: window.__BADBOSS__.dev.stats(),
    heapMB: performance.memory ? Math.round((performance.memory.usedJSHeapSize / 1048576) * 10) / 10 : null,
  }));
  // Appels de dessin au repos (écran du choix, 3 gadgets visibles).
  await page.evaluate(() => {
    window.__frameDraws = [];
    window.__recordDraws = true;
  });
  await page.waitForTimeout(1500);
  const idleDraws = await page.evaluate(() => {
    window.__recordDraws = false;
    return window.__frameDraws.slice(2);
  });
  await page.evaluate(() => {
    window.__frameDraws = [];
    window.__recordDraws = true;
  });
  const report = await page.evaluate((n) => window.__BADBOSS__.dev.loop({ count: n, level: 'all' }), rounds);
  const loopDraws = await page.evaluate(() => {
    window.__recordDraws = false;
    return window.__frameDraws.slice(2);
  });
  const after = await page.evaluate(() => ({
    stats: window.__BADBOSS__.dev.stats(),
    heapMB: performance.memory ? Math.round((performance.memory.usedJSHeapSize / 1048576) * 10) / 10 : null,
  }));
  await ctx.close();
  const stat = (xs) => {
    if (!xs.length) return { avg: 0, p95: 0, max: 0 };
    const s = [...xs].sort((a, b) => a - b);
    return { avg: Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10, p95: s[Math.floor(s.length * 0.95)] ?? 0, max: s[s.length - 1] ?? 0 };
  };
  return { f, readyMs, boot, idleDraws: stat(idleDraws), loopDraws: stat(loopDraws), report, after, errors };
}

const results = [];
for (const f of FORMATS) {
  results.push(await measure(f));
  console.log(`${f.id} ✓`);
}
await browser.close();
stop();

const mb = (b) => `${(b / 1048576).toFixed(1)} Mo`;
const lines = [
  '# PRODUCTION 3 GADGETS — performances (généré)',
  '',
  `> Généré par \`node tools/p3-perf.mjs --rounds ${rounds}\` le ${new Date().toISOString().slice(0, 10)}. Ne pas éditer.`,
  '> Build de production (Mock RGS, 3 gadgets par Rage Level). LOOP : présentation seule, aucune mise, vitesse normale, 3 niveaux en alternance, plans A → B → C (les 9 gadgets).',
  '> **Chromium headless + SwiftShader (rendu LOGICIEL)** : les images/s sont très pessimistes et ne représentent PAS un téléphone réel. Les mesures de mémoire, d\'appels de dessin et de particules, elles, sont indépendantes du GPU.',
  '> Mémoire des textures : estimation (largeur × hauteur × 4 octets par texture gérée par Pixi, plus les tampons d\'affichage), sans les mipmaps.',
  '',
  `| Mesure | ${results.map((r) => r.f.label).join(' | ')} |`,
  `|---|${results.map(() => '---:').join('|')}|`,
  `| Chargement → READY | ${results.map((r) => `${(r.readyMs / 1000).toFixed(1)} s`).join(' | ')} |`,
  `| Scène prête (livres de base) | ${results.map((r) => `${r.boot.stageInitMs} ms`).join(' | ')} |`,
  `| Livres différés arrivés (FURIOUS, UNHINGED, plans) | ${results.map((r) => `${r.boot.artReadyMs} ms`).join(' | ')} |`,
  `| Mémoire des textures (au repos → après la LOOP) | ${results.map((r) => `${mb(r.boot.stats.textureBytes)} → ${mb(r.after.stats.textureBytes)}`).join(' | ')} |`,
  `| Textures gérées | ${results.map((r) => `${r.boot.stats.textures} → ${r.after.stats.textures}`).join(' | ')} |`,
  `| Objets d'affichage | ${results.map((r) => `${r.boot.stats.displayObjects} → ${r.after.stats.displayObjects}`).join(' | ')} |`,
  `| Tas JS (repos → après) | ${results.map((r) => `${r.boot.heapMB ?? 'n/a'} → ${r.after.heapMB ?? 'n/a'} Mo`).join(' | ')} |`,
  `| Appels de dessin / image, choix (moy. / p95 / max) | ${results.map((r) => `${r.idleDraws.avg} / ${r.idleDraws.p95} / ${r.idleDraws.max}`).join(' | ')} |`,
  `| Appels de dessin / image, manches (moy. / p95 / max) | ${results.map((r) => `${r.loopDraws.avg} / ${r.loopDraws.p95} / ${r.loopDraws.max}`).join(' | ')} |`,
  `| Particules actives max | ${results.map((r) => r.report.maxParticles).join(' | ')} |`,
  `| Images/s pendant les manches (moy. / 1 % bas) — SwiftShader | ${results.map((r) => `${r.report.fps} / ${r.report.minFps}`).join(' | ')} |`,
  `| Temps CPU par image (moy. / p95 / max) | ${results.map((r) => `${r.report.avgFrameMs} / ${r.report.p95FrameMs} / ${r.report.maxFrameMs} ms`).join(' | ')} |`,
  `| Manches terminées / reveal / erreurs | ${results.map((r) => `${r.report.completed} / ${r.report.revealed} / ${r.report.errors.length + r.errors.length}`).join(' | ')} |`,
  `| Appels wallet pendant la LOOP | ${results.map((r) => r.report.walletCallsDuringLoop).join(' | ')} |`,
  '',
  `Branches jouées (desktop) : ${Object.entries(results[0].report.branches).sort().map(([k, v]) => `\`${k}\` ${v}`).join(' · ')}`,
  '',
];
const errs = results.flatMap((r) => [...r.report.errors, ...r.errors].map((e) => `${r.f.id}: ${e}`));
if (errs.length) lines.push('## Erreurs', '', ...errs.map((e) => `- ${e}`), '');
console.log(lines.join('\n'));
if (md) writeFileSync(md, `${lines.join('\n')}\n`);
process.exit(errs.length ? 1 : 0);
