#!/usr/bin/env node
/**
 * Performances du POC « 3 PLANS » comparées au jeu normal (même machine, même navigateur).
 * Sert deux builds avec vite preview : --poc <dist POC (build:poc)> et --base <dist du jeu normal (build:single)>.
 * Mesures : initialisation de la scène (atlas compris), mémoire des textures, objets d'affichage, tas JS,
 * images pendant des manches réelles (Mock RGS, vitesse normale), durée des manches par plan.
 * ATTENTION : Chromium headless + SwiftShader (rendu logiciel) : les FPS ne représentent PAS un téléphone.
 * Usage : node tools/poc-perf.mjs --poc dist-poc --base dist-single [--rounds 9] [--markdown docs/generated/POC3_PERF.md]
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const rounds = Number(arg('rounds', '9'));
const md = arg('markdown', '');

function serve(dir, port) {
  const p = spawn('npx', ['vite', 'preview', '--outDir', resolve(dir), '--port', String(port), '--strictPort'], { stdio: 'ignore', detached: true });
  return { url: `http://localhost:${port}/`, stop: () => { try { process.kill(-p.pid, 'SIGTERM'); } catch {} } };
}

async function measure(browser, url, poc) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
  await page.goto(url);
  await page.waitForFunction(() => window.__BADBOSS__?.state().state === 'READY', null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  const base = await page.evaluate(() => {
    const h = window.__BADBOSS__;
    const mem = performance.memory ? performance.memory.usedJSHeapSize : null;
    return { stageInitMs: h.dev.stageInitMs(), stats: h.dev.stats(), heap: mem };
  });
  await page.evaluate(() => window.__BADBOSS__.ctx.perf.startRecording());
  const durations = {};
  for (let i = 0; i < rounds; i++) {
    const plan = 'ABC'[i % 3];
    if (poc) await page.getByTestId(`plan-${plan}`).click();
    const t0 = Date.now();
    await page.getByTestId('fire').click();
    await page.waitForFunction(() => window.__BADBOSS__.state().state !== 'READY', null, { timeout: 30000 });
    await page.waitForFunction(() => window.__BADBOSS__.state().state === 'READY', null, { timeout: 60000 });
    const key = poc ? plan : 'A';
    (durations[key] ??= []).push(Date.now() - t0);
  }
  const rec = await page.evaluate(() => window.__BADBOSS__.ctx.perf.stopRecording());
  const after = await page.evaluate(() => ({ stats: window.__BADBOSS__.dev.stats(), heap: performance.memory ? performance.memory.usedJSHeapSize : null, errors: window.__BADBOSS__.ctx.contentErrors.length }));
  await page.close();
  return { ...base, rec, after, durations };
}

const P = serve(arg('poc', 'dist-poc'), 4195);
const B = serve(arg('base', 'dist-single'), 4196);
await new Promise((r) => setTimeout(r, 3000));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info'] });
// Chaque build est mesuré deux fois, en alternance ; on garde la 2e mesure (navigateur « chaud » dans les deux cas).
await measure(browser, B.url, false);
await measure(browser, P.url, true);
const base = await measure(browser, B.url, false);
const poc = await measure(browser, P.url, true);
await browser.close();
P.stop();
B.stop();

const mb = (b) => (b === null || b === undefined ? '—' : `${(b / 1048576).toFixed(1)} Mo`);
const avg = (xs) => (xs && xs.length ? `${(xs.reduce((a, b) => a + b, 0) / xs.length / 1000).toFixed(2)} s (${xs.length})` : '—');
const rows = [
  ['Initialisation de la scène (atlas compris)', `${Math.round(base.stageInitMs)} ms`, `${Math.round(poc.stageInitMs)} ms`],
  ['Mémoire des textures (estimation, tampons compris)', mb(base.stats.textureBytes), mb(poc.stats.textureBytes)],
  ['Textures', base.stats.textures, poc.stats.textures],
  ['Objets d’affichage', base.stats.displayObjects, poc.stats.displayObjects],
  ['Tas JS au repos → après les manches', `${mb(base.heap)} → ${mb(base.after.heap)}`, `${mb(poc.heap)} → ${mb(poc.after.heap)}`],
  ['Images/s pendant les manches (moy. / 1 % bas)', `${base.rec.fps.toFixed(0)} / ${base.rec.minFps.toFixed(0)}`, `${poc.rec.fps.toFixed(0)} / ${poc.rec.minFps.toFixed(0)}`],
  ['Temps CPU par image (moy. / p95 / max)', `${base.rec.frameMs.toFixed(1)} / ${base.rec.p95FrameMs.toFixed(1)} / ${base.rec.maxFrameMs.toFixed(1)} ms`, `${poc.rec.frameMs.toFixed(1)} / ${poc.rec.p95FrameMs.toFixed(1)} / ${poc.rec.maxFrameMs.toFixed(1)} ms`],
  ['Particules max', base.rec.maxParticles, poc.rec.maxParticles],
  ['Manche FIRE → READY, plan A (lance-pierre)', avg(base.durations.A), avg(poc.durations.A)],
  ['Manche FIRE → READY, plan B (prototype)', '—', avg(poc.durations.B)],
  ['Manche FIRE → READY, plan C (prototype)', '—', avg(poc.durations.C)],
  ['Replis de contenu (erreurs de séquence)', base.after.errors, poc.after.errors],
];
const table = ['| Mesure | Jeu normal (GRUMPY) | POC 3 PLANS |', '|---|---|---|', ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');
console.log(table);
if (md) {
  writeFileSync(md, `# POC 3 PLANS : performances (${new Date().toISOString().slice(0, 10)})\n\n`
    + `Généré par \`node tools/poc-perf.mjs\` : ${rounds} manches réelles par build (2e mesure de chaque build, en alternance) (Mock RGS, vitesse normale, plans A → B → C en boucle pour le POC).\n\n`
    + `> Chromium headless + SwiftShader (rendu LOGICIEL, 1100 × 760) : les images/s ne représentent pas un téléphone réel ; `
    + `seules les DIFFÉRENCES entre les deux colonnes sont informatives. Les durées de manche incluent la latence simulée du Mock RGS (120 ms par appel).\n\n${table}\n`);
  console.log(`→ ${md}`);
}
process.exit(0);
