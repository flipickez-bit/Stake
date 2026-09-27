#!/usr/bin/env node
/**
 * Captures du POC « 3 PLANS » (BAD BOSS — 3 GADGET POC). Vraies manches du Mock RGS avec triple imposé (DEV),
 * branche imposée, séquence mise en pause et positionnée (crochet DEV `capture`) : images reproductibles.
 * Usage : node tools/capture-poc.mjs --url http://localhost:5199/?poc=3gadget --out docs/poc3/captures [--devices desktop,phone] [--only id1,id2]
 *    ou : node tools/capture-poc.mjs --dist dist-poc --out … (sert le build avec vite preview)
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const out = arg('out', 'docs/poc3/captures');
const url = arg('url', '');
const dist = resolve(arg('dist', 'dist-poc'));
const port = Number(arg('port', '4193'));
const devices = arg('devices', 'desktop,phone').split(',');
const only = arg('only', '');
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

const DEVICES = [
  { id: 'desktop', viewport: { width: 1100, height: 760 } },
  { id: 'phone', viewport: { width: 390, height: 844 } },
].filter((d) => devices.includes(d.id));

const T = (m) => ({ kind: 'multipliers', multipliers: m });
/** Instant : d1, reveal, end, impact (+/- ms). */
const ROUNDS = [
  { id: '10-A-slingshot-anticipation', plan: 'A', triple: T([2, 0, 5]), branch: 'SLG-A4', at: 'd1-60' },
  { id: '11-A-slingshot-win', plan: 'A', triple: T([2, 0, 5]), branch: 'SLG-A4', at: 'reveal+500' },
  { id: '20-B-pressure', plan: 'B', triple: T([0, 0, 2]), branch: 'ESP-L1', at: 'd1-60' },
  { id: '21-B-shot', plan: 'B', triple: T([0, 0, 2]), branch: 'ESP-L1', at: 'd1+260' },
  { id: '22-B-loss-catch', plan: 'B', triple: T([0, 0, 2]), branch: 'ESP-L1', at: 'reveal+400' },
  { id: '23-B-loss-fizzle', plan: 'B', triple: T([0, 0, 2]), branch: 'ESP-L2', at: 'reveal+200' },
  { id: '24-B-win-splash', plan: 'B', triple: T([0, 2, 0]), branch: 'ESP-W1', at: 'impact+60' },
  { id: '25-B-bigwin', plan: 'B', triple: T([0, 25, 0]), branch: 'ESP-W2', at: 'reveal-300' },
  { id: '26-B-bigwin-after', plan: 'B', triple: T([0, 25, 0]), branch: 'ESP-W2', at: 'reveal+500' },
  { id: '30-C-warm', plan: 'C', triple: T([5, 0, 0]), branch: 'COP-L2', at: 'd1-60' },
  { id: '31-C-launch', plan: 'C', triple: T([5, 0, 0]), branch: 'COP-L2', at: 'd1+300' },
  { id: '32-C-loss-rain', plan: 'C', triple: T([5, 0, 0]), branch: 'COP-L2', at: 'reveal+300' },
  { id: '33-C-loss-jam', plan: 'C', triple: T([5, 0, 0]), branch: 'COP-L1', at: 'reveal+200' },
  { id: '34-C-win-ream', plan: 'C', triple: T([0, 0, 2]), branch: 'COP-W1', at: 'impact+60' },
  { id: '35-C-bigwin', plan: 'C', triple: T([0, 0, 10]), branch: 'COP-W2', at: 'reveal-250' },
];

const frames = (page, n = 3) => page.evaluate((n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
const shot = (page, d, id) => page.screenshot({ path: `${out}/${d.id}-${id}.jpg`, type: 'jpeg', quality: 80 });
const want = (id) => !only || only.split(',').some((o) => id.startsWith(o));

async function resolveTime(page, spec) {
  return page.evaluate((spec) => {
    const seq = window.__BADBOSS__.ctx.presenter.player.sequence;
    const m = /^(d1|reveal|end|impact)([+-]\d+)?$/.exec(spec);
    const off = Number(m[2] ?? 0);
    if (m[1] === 'impact') return (seq.segments.find((s) => s.phase === 'impact')?.start ?? seq.markers.reveal) + off;
    return seq.markers[m[1]] + off;
  }, spec);
}

/** Script du book compatible avec la branche imposée (le plan choisi seulement ; les autres restent tirés). */
const SCRIPT = { 'SLG-A4': 'DIRECT', 'ESP-L1': 'CLEAN_MISS', 'ESP-L2': 'BACKFIRE', 'ESP-W1': 'DIRECT', 'ESP-W2': 'CHAIN', 'COP-L1': 'BACKFIRE', 'COP-L2': 'TEASE', 'COP-W1': 'DIRECT', 'COP-W2': 'CHAIN' };

async function playRound(page, r) {
  const slot = 'ABC'.indexOf(r.plan);
  const triple = r.triple.kind === 'multipliers' ? { ...r.triple, scripts: [0, 1, 2].map((i) => (i === slot ? SCRIPT[r.branch] ?? null : null)) } : r.triple;
  r = { ...r, triple };
  await page.evaluate(({ triple, branch }) => {
    const h = window.__BADBOSS__;
    h.server.update((s) => (s.nextForcedTriple = triple));
    h.ctx.presenter.forceBranchId = branch;
  }, r);
  await page.getByTestId(`plan-${r.plan}`).click();
  await page.getByTestId('fire').click();
}

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const d of DEVICES) {
  const page = await browser.newPage({ viewport: d.viewport });
  await page.goto(base);
  await page.waitForFunction(() => window.__BADBOSS__?.state().state === 'READY', null, { timeout: 30000 });
  await page.evaluate(() => window.__BADBOSS__.ctx.poc.altDisplay.set('PRIVATE'));
  await page.waitForTimeout(800);
  if (want('01')) await shot(page, d, '01-picker');
  if (want('02') && d.id === 'desktop') {
    await page.getByTestId('plan-B').hover();
    await page.waitForTimeout(500);
    await shot(page, d, '02-hover-B-steam');
    await page.getByTestId('plan-C').hover();
    await page.waitForTimeout(700);
    await shot(page, d, '03-hover-C-sheet');
  }
  if (want('04')) {
    await page.getByTestId('plan-A').click();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(400);
    await shot(page, d, '04-selected-A');
  }
  for (const r of ROUNDS) {
    if (!want(r.id)) continue;
    await playRound(page, r);
    await page.waitForFunction((b) => window.__BADBOSS__.presenter().branchId === b, r.branch, { timeout: 30000 });
    await page.evaluate(() => window.__BADBOSS__.dev.capture.pause());
    const t = await resolveTime(page, r.at);
    await page.evaluate((t) => window.__BADBOSS__.dev.capture.seek(t), t);
    await frames(page);
    await shot(page, d, r.id);
    await page.evaluate(() => {
      window.__BADBOSS__.dev.capture.resume();
      window.__BADBOSS__.ctx.presenter.forceBranchId = null;
    });
    await page.waitForFunction(() => window.__BADBOSS__.state().state === 'READY', null, { timeout: 60000 });
  }
  // Affichage des autres plans après la manche : PRIVATE, ON-DEMAND (bouton puis panneau), REVEAL ALL.
  if (want('4')) {
    const loss = { plan: 'B', triple: T([0, 0, 5]), branch: 'ESP-L1' };
    const win = { plan: 'B', triple: T([10, 2, 0]), branch: 'ESP-W1' };
    for (const [mode, id, r] of [['PRIVATE', '40-private-after-loss', loss], ['ON_DEMAND', '41-ondemand-after-loss', loss], ['ON_DEMAND', '43-ondemand-after-win', win], ['REVEAL_ALL', '45-revealall-after-loss', loss]]) {
      await page.evaluate((m) => window.__BADBOSS__.ctx.poc.altDisplay.set(m), mode);
      await playRound(page, r);
      await page.waitForFunction(() => window.__BADBOSS__.state().state === 'READY' && window.__BADBOSS__.state().revealed, null, { timeout: 60000 });
      await page.evaluate(() => (window.__BADBOSS__.ctx.presenter.forceBranchId = null));
      await page.mouse.move(5, 5);
      await page.waitForTimeout(500);
      await shot(page, d, id);
      if (mode === 'ON_DEMAND') {
        await page.getByTestId('reveal-other-plans').click();
        await page.waitForTimeout(300);
        await shot(page, d, id.replace(/^4(\d)/, (_m, n) => `4${Number(n) + 1}`).replace('ondemand', 'ondemand-open'));
      }
    }
  }
  await page.close();
  console.log(`${d.id} ✓`);
}
await browser.close();
console.log(`captures → ${out}`);
stop();
process.exit(0);
