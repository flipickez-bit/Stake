#!/usr/bin/env node
/**
 * Appels de dessin WebGL par image (budget MVP_ROADMAP §4 : ≤ 30 en moyenne, ≤ 60 en pic) sur des instants clés
 * de la vertical slice. node tools/drawcalls.mjs --url http://localhost:4173/ [--w 390 --h 844]
 */
import { chromium } from '@playwright/test';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const url = arg('url', 'http://localhost:4173/');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: Number(arg('w', '390')), height: Number(arg('h', '844')) } });
await page.addInitScript(() => {
  window.__draws = 0;
  for (const C of [WebGL2RenderingContext, WebGLRenderingContext]) {
    for (const fn of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
      const orig = C.prototype[fn];
      if (!orig) continue;
      C.prototype[fn] = function (...a) { window.__draws++; return orig.apply(this, a); };
    }
  }
});
await page.goto(url);
await page.waitForFunction(() => window.__BADBOSS__?.state().state === 'READY', null, { timeout: 60000 });
const count = () => page.evaluate(() => new Promise((r) => {
  window.__draws = 0;
  window.__BADBOSS__.ctx.stage.draw();
  r(window.__draws);
}));
const rows = [['READY (repos)', await count()]];
const cases = [
  ['SLG-A4', { kind: 'WIN', multiplier: 2, seed: 7, script: 'DIRECT' }, ['d1-80', 'reveal', 'reveal+1', 'reveal+300']],
  ['SLG-A5', { kind: 'BIG_WIN', multiplier: 10, seed: 7, script: 'DIRECT' }, ['reveal-100', 'reveal+1', 'reveal+200']],
  ['SLG-C1', { kind: 'LOSS', multiplier: 0, seed: 7, script: 'BACKFIRE' }, ['reveal', 'reveal+300', 'end-300']],
];
for (const [branch, forced, times] of cases) {
  await page.evaluate(() => window.__BADBOSS__.dev.capture.resume());
  await page.waitForFunction(() => window.__BADBOSS__.state().state === 'READY', null, { timeout: 60000 });
  await page.evaluate((b) => (window.__BADBOSS__.ctx.presenter.forceBranchId = b), branch);
  await page.evaluate((f) => void window.__BADBOSS__.dev.preview('grumpy', f), forced);
  await page.waitForFunction((b) => window.__BADBOSS__.presenter().branchId === b, branch, { timeout: 30000 });
  await page.evaluate(() => window.__BADBOSS__.dev.capture.pause());
  for (const spec of times) {
    const t = await page.evaluate((spec) => {
      const seq = window.__BADBOSS__.ctx.presenter.player.sequence;
      const m = /^(d1|reveal|end)([+-]\d+)?$/.exec(spec);
      return seq.markers[m[1]] + Number(m[2] ?? 0);
    }, spec);
    await page.evaluate((t) => window.__BADBOSS__.dev.capture.seek(t), t);
    rows.push([`${branch} ${spec}`, await count(), await page.evaluate(() => window.__BADBOSS__.presenter().particles)]);
  }
}
await browser.close();
console.log('| Instant | Appels de dessin | Particules |\n|---|---:|---:|');
for (const [k, v, p] of rows) console.log(`| ${k} | ${v} | ${p ?? '—'} |`);
