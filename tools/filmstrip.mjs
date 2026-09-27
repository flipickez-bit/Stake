#!/usr/bin/env node
/**
 * DEV : bande d'images d'une branche forcée (seek image par image), pour régler le timing.
 * node tools/filmstrip.mjs --url http://localhost:5199/ --branch SLG-A4 --kind WIN --mult 2 --script DIRECT
 *   --from d1-200 --to reveal+600 --step 60 --out <dossier> [--w 390 --h 844] [--level grumpy]
 */
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const url = arg('url', 'http://localhost:5199/');
const branch = arg('branch', 'SLG-A4');
const forced = { kind: arg('kind', 'WIN'), multiplier: Number(arg('mult', '2')), seed: Number(arg('seed', '7')), script: arg('script', 'DIRECT') };
const out = arg('out', 'filmstrip');
const step = Number(arg('step', '60'));
const level = arg('level', 'grumpy');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: Number(arg('w', '390')), height: Number(arg('h', '844')) } });
await page.goto(url);
await page.waitForFunction(() => window.__BADBOSS__?.state().state === 'READY', null, { timeout: 60000 });
await page.addStyleTag({ content: '[data-testid=mode-badge]{display:none!important}' });
if (level !== 'grumpy') await page.evaluate((l) => window.__BADBOSS__.ctx.flow.setLevel(l), level);
/** Relance la présentation (le garde-fou de GameFlow force le reveal au bout de ~15 s de pause). */
async function start() {
  await page.evaluate(() => window.__BADBOSS__.dev.capture.resume());
  await page.waitForFunction(() => window.__BADBOSS__.state().state === 'READY', null, { timeout: 60000 });
  await page.evaluate((b) => (window.__BADBOSS__.ctx.presenter.forceBranchId = b), branch);
  await page.evaluate(([l, f]) => void window.__BADBOSS__.dev.preview(l, f), [level, forced]);
  await page.waitForFunction((b) => window.__BADBOSS__.presenter().branchId === b, branch, { timeout: 30000 });
  await page.evaluate(() => window.__BADBOSS__.dev.capture.pause());
}
await start();
const resolve = (spec) => page.evaluate((spec) => {
  const seq = window.__BADBOSS__.ctx.presenter.player.sequence;
  const m = /^(d1|reveal|end|impact|start)([+-]\d+)?$/.exec(spec);
  const off = Number(m[2] ?? 0);
  if (m[1] === 'start') return off;
  if (m[1] === 'impact') return (seq.segments.find((s) => s.phase === 'impact')?.start ?? seq.markers.reveal) + off;
  return seq.markers[m[1]] + off;
}, spec);
const t0 = await resolve(arg('from', 'd1-200'));
const t1 = await resolve(arg('to', 'reveal+600'));
const stage = await page.$('[data-testid=stage]');
let i = 0;
for (let t = t0; t <= t1; t += step) {
  if (i > 0 && i % 8 === 0) await start();
  await page.evaluate((t) => window.__BADBOSS__.dev.capture.seek(t), t);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await stage.screenshot({ path: `${out}/${String(i++).padStart(3, '0')}-t${Math.round(t)}.jpg`, type: 'jpeg', quality: 70 });
}
await browser.close();
console.log(`${i} images → ${out}`);
