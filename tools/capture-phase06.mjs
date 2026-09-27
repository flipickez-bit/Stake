#!/usr/bin/env node
/**
 * Captures PHASE 0.6 (vertical slice GRUMPY + SWIVEL SLINGSHOT) aux mêmes instants, pour comparer deux builds.
 * Mêmes branches forcées, mêmes graines, séquence mise en pause et positionnée (crochet DEV `capture`).
 * Usage : node tools/capture-phase06.mjs --dist <build> --out <dossier> --prefix <before|after> [--port 4191] [--devices phone,small,large,desktop]
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const dist = resolve(arg('dist', 'dist'));
const out = arg('out', 'docs/phase06/captures');
const prefix = arg('prefix', 'after');
const port = Number(arg('port', '4191'));
const only = arg('devices', 'phone,small,large,desktop').split(',');
const only2 = arg('moments', '');
/** --url : serveur déjà lancé (dev), sinon on sert --dist avec vite preview. */
const url = arg('url', '');
mkdirSync(out, { recursive: true });

const server = url ? null : spawn('npx', ['vite', 'preview', '--outDir', dist, '--port', String(port), '--strictPort'], { stdio: 'ignore', detached: true });
const stop = () => {
  try {
    if (server) process.kill(-server.pid, 'SIGTERM');
  } catch {}
};
process.on('exit', stop);
if (server) await new Promise((r) => setTimeout(r, 2500));
const base = url || `http://localhost:${port}/`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

const DEVICES = [
  { id: 'phone', name: 'phone-390x844', viewport: { width: 390, height: 844 } },
  { id: 'small', name: 'small-360x640', viewport: { width: 360, height: 640 } },
  { id: 'large', name: 'large-430x932', viewport: { width: 430, height: 932 } },
  { id: 'desktop', name: 'desktop-1100x760', viewport: { width: 1100, height: 760 } },
].filter((d) => only.includes(d.id));

const WIN = { kind: 'WIN', multiplier: 2, seed: 7, script: 'DIRECT' };
const BIG = { kind: 'BIG_WIN', multiplier: 10, seed: 7, script: 'DIRECT' };
const LOSS = { kind: 'LOSS', multiplier: 0, seed: 7, script: 'BACKFIRE' };

/** `at(m)` : instant de séquence à partir des marqueurs et des segments compilés. */
const MOMENTS = [
  { id: '1-idle' },
  { id: '2-anticipation', branch: 'SLG-A4', forced: WIN, at: 'd1-80' },
  { id: '3-impact', branch: 'SLG-A4', forced: WIN, at: 'impact+40' },
  { id: '4-win', branch: 'SLG-A4', forced: WIN, at: 'reveal+550' },
  { id: '5-bigwin-impact', branch: 'SLG-A5', forced: BIG, at: 'impact+60' },
  { id: '6-bigwin', branch: 'SLG-A5', forced: BIG, at: 'reveal+700' },
  { id: '7-loss-chain', branch: 'SLG-C1', forced: LOSS, at: 'reveal-120' },
  { id: '8-loss-sip', branch: 'SLG-C1', forced: LOSS, at: 'end-350' },
];

async function resolveTime(page, spec) {
  return page.evaluate((spec) => {
    const seq = window.__BADBOSS__.ctx.presenter.player.sequence;
    const m = /^(d1|reveal|end|impact)([+-]\d+)?$/.exec(spec);
    const off = Number(m[2] ?? 0);
    if (m[1] === 'impact') return (seq.segments.find((s) => s.phase === 'impact')?.start ?? seq.markers.reveal) + off;
    return seq.markers[m[1]] + off;
  }, spec);
}

const frames = (page, n = 3) => page.evaluate((n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);

for (const d of DEVICES) {
  const page = await browser.newPage({ viewport: d.viewport });
  await page.goto(base);
  await page.waitForFunction(() => window.__BADBOSS__?.state().state === 'READY', null, { timeout: 30000 });
  await page.addStyleTag({ content: '[data-testid=mode-badge]{display:none!important}' });
  await page.evaluate(() => window.__BADBOSS__.ctx.flow.setLevel('grumpy'));
  for (const m of MOMENTS) {
    if (only2 && !only2.split(',').includes(m.id)) continue;
    if (!m.forced) {
      await page.waitForTimeout(1400);
      await page.screenshot({ path: `${out}/${prefix}-${d.name}-${m.id}.jpg`, type: 'jpeg', quality: 78 });
      continue;
    }
    await page.evaluate((b) => (window.__BADBOSS__.ctx.presenter.forceBranchId = b), m.branch);
    await page.evaluate((f) => void window.__BADBOSS__.dev.preview('grumpy', f), m.forced);
    await page.waitForFunction((b) => window.__BADBOSS__.presenter().branchId === b, m.branch, { timeout: 30000 });
    await page.evaluate(() => window.__BADBOSS__.dev.capture.pause());
    const t = await resolveTime(page, m.at);
    await page.evaluate((t) => window.__BADBOSS__.dev.capture.seek(t), t);
    await frames(page);
    await page.screenshot({ path: `${out}/${prefix}-${d.name}-${m.id}.jpg`, type: 'jpeg', quality: 78 });
    await page.evaluate(() => {
      window.__BADBOSS__.dev.capture.resume();
      window.__BADBOSS__.ctx.presenter.forceBranchId = null;
    });
    await page.waitForFunction(() => window.__BADBOSS__.state().state === 'READY', null, { timeout: 60000 });
  }
  if (only2 && !only2.includes('9')) {
    await page.close();
    console.log(`${d.name} ✓`);
    continue;
  }
  // NEW DISCOVERY : une vraie manche (Mock), découverte au reveal.
  await page.evaluate(() => window.__BADBOSS__.server.update((s) => (s.nextForced = { mode: 'grumpy', forced: { kind: 'WIN', multiplier: 2, seed: 7, script: 'DIRECT' } })));
  await page.evaluate(() => (window.__BADBOSS__.ctx.presenter.forceBranchId = 'SLG-A4'));
  await page.click('[data-testid=fire]');
  await page.waitForFunction(() => window.__BADBOSS__.state().state === 'REVEAL', null, { timeout: 30000 });
  await page.waitForTimeout(650);
  await page.screenshot({ path: `${out}/${prefix}-${d.name}-9-new-discovery.jpg`, type: 'jpeg', quality: 78 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${prefix}-${d.name}-9b-new-discovery-late.jpg`, type: 'jpeg', quality: 78 });
  await page.evaluate(() => (window.__BADBOSS__.ctx.presenter.forceBranchId = null));
  await page.waitForFunction(() => window.__BADBOSS__.state().state === 'READY', null, { timeout: 60000 });
  await page.close();
  console.log(`${d.name} ✓`);
}
await browser.close();
console.log(`captures → ${out}`);
stop();
process.exit(0);
