#!/usr/bin/env node
/**
 * PRODUCTION 3 GADGETS — captures des branches (vraies manches du Mock RGS, branche imposée par le crochet DEV
 * `forceBranch`, séquence mise en pause et positionnée). Images reproductibles, une bande par branche.
 * Usage : node tools/capture-gadgets.mjs --url http://localhost:5199/ --out docs/production/captures
 *         [--device desktop|phone] [--only espresso-blaster,COP-L5] [--at d1+150,reveal-120,reveal+450] [--sheet 1]
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const base = arg('url', 'http://localhost:5199/');
const out = arg('out', 'tools/.scratch/gadgets');
const deviceId = arg('device', 'desktop');
const only = arg('only', '').split(',').filter(Boolean);
const times = arg('at', 'd1+150,reveal-120,reveal+450').split(',');
const sheet = arg('sheet', '1') === '1';
mkdirSync(out, { recursive: true });

const VIEWPORTS = { desktop: { width: 1100, height: 760 }, phone: { width: 390, height: 844 } };
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: VIEWPORTS[deviceId] });
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.goto(base);
await page.waitForFunction(() => window.__BADBOSS__?.state().state === 'READY', null, { timeout: 30000 });
await page.evaluate(() => window.__BADBOSS__.ctx.poc?.altDisplay.set('PRIVATE'));
const gadgets = await page.evaluate(() => window.__BADBOSS__.dev.gadgets());
const want = (g, b) => only.length === 0 || only.includes(g.id) || only.includes(b.id);
const frames = (n = 3) => page.evaluate((n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);

async function timeOf(spec) {
  return page.evaluate((spec) => {
    const seq = window.__BADBOSS__.ctx.presenter.player.sequence;
    const m = /^(d1|reveal|end|impact|ending)([+-]\d+)?$/.exec(spec);
    const off = Number(m[2] ?? 0);
    if (m[1] === 'impact') return (seq.segments.find((s) => s.phase === 'impact')?.start ?? seq.markers.reveal) + off;
    if (m[1] === 'ending') return (seq.segments.find((s) => s.start >= seq.markers.d1 && s.phase !== 'intro' && s.phase !== 'setup')?.start ?? seq.markers.d1) + off;
    return Math.min(seq.markers[m[1]] + off, seq.markers.end - 1);
  }, spec);
}

const shots = [];
for (const g of gadgets) {
  for (const b of g.branches) {
    if (!want(g, b)) continue;
    const ok = await page.evaluate(([gid, bid]) => window.__BADBOSS__.dev.forceBranch(gid, bid), [g.id, b.id]);
    if (!ok) { console.warn(`skip ${b.id} (plans off ?)`); continue; }
    await page.getByTestId('fire').click();
    await page.waitForFunction((id) => window.__BADBOSS__.presenter().branchId === id, b.id, { timeout: 30000 });
    await page.evaluate(() => window.__BADBOSS__.dev.capture.pause());
    for (const [i, spec] of times.entries()) {
      const t = await timeOf(spec);
      await page.evaluate((t) => window.__BADBOSS__.dev.capture.seek(t), t);
      await frames();
      const path = `${out}/${deviceId}-${b.id}-${i}.jpg`;
      await page.screenshot({ path, type: 'jpeg', quality: 78 });
      shots.push(path);
    }
    await page.evaluate(() => { window.__BADBOSS__.dev.capture.resume(); window.__BADBOSS__.ctx.presenter.forceBranchId = null; });
    await page.waitForFunction(() => window.__BADBOSS__.state().state === 'READY', null, { timeout: 60000 });
    console.log(`${b.id} ✓`);
  }
}
await browser.close();
if (sheet && shots.length) {
  execFileSync('node', ['tools/contact-sheet.mjs', `${out}/sheet-${deviceId}.jpg`, String(times.length), deviceId === 'phone' ? '180' : '330', ...shots], { stdio: 'inherit' });
}
