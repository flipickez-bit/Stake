#!/usr/bin/env node
/**
 * Captures PORTRAIT (téléphone) aux mêmes instants, pour comparer deux builds (avant / après).
 * Usage : node tools/capture-portrait.mjs --dist <dossier build> --out <dossier> [--prefix after] [--port 4190]
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
const out = arg('out', 'docs/phase05/portrait');
const prefix = arg('prefix', 'after');
const port = Number(arg('port', '4190'));
mkdirSync(out, { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--outDir', dist, '--port', String(port), '--strictPort'], { stdio: 'ignore', detached: true });
process.on('exit', () => {
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {}
});
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

const DEVICES = [
  { name: 'phone-390x844', viewport: { width: 390, height: 844 } },
  { name: 'small-360x640', viewport: { width: 360, height: 640 } },
];
const MOMENTS = [
  { id: '1-ready', level: 'grumpy', forced: null },
  { id: '2-slingshot-pull', level: 'grumpy', forced: { kind: 'WIN', multiplier: 2, seed: 7 }, at: 950 },
  { id: '3-slingshot-win-cabinet', level: 'grumpy', forced: { kind: 'WIN', multiplier: 2, seed: 7 }, reveal: true },
  { id: '4-trapdoor-hover', level: 'furious', forced: { kind: 'LOSS', multiplier: 0, seed: 7 }, at: 1500 },
  { id: '5-rocket-ceiling-reveal', level: 'unhinged', forced: { kind: 'WIN', multiplier: 2, seed: 7 }, reveal: true },
  { id: '6-boss-fight', level: 'furious', forced: { kind: 'BOSS_FIGHT', bossFightRung: 3, seed: 7 }, rung: 2 },
];

for (const d of DEVICES) {
  const page = await browser.newPage({ viewport: d.viewport });
  await page.goto(`http://localhost:${port}/`);
  await page.waitForFunction(() => window.__BADBOSS__?.state().state === 'READY', null, { timeout: 30000 });
  for (const m of MOMENTS) {
    await page.evaluate((l) => window.__BADBOSS__.ctx.flow.setLevel(l), m.level);
    if (m.forced) {
      await page.evaluate(([l, f]) => void window.__BADBOSS__.dev.preview(l, f), [m.level, m.forced]);
      if (m.at) await page.waitForFunction((t) => window.__BADBOSS__.presenter().t >= t, m.at, { timeout: 30000 });
      if (m.reveal) {
        await page.waitForFunction(() => window.__BADBOSS__.state().revealed !== null, null, { timeout: 30000 });
        await page.waitForTimeout(250);
      }
      if (m.rung) await page.waitForFunction((r) => window.__BADBOSS__.presenter().bossFight.rung >= r, m.rung, { timeout: 60000 });
    } else {
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: `${out}/${prefix}-${d.name}-${m.id}.jpg`, type: 'jpeg', quality: 70 });
    await page.waitForFunction(() => window.__BADBOSS__.state().state === 'READY', null, { timeout: 60000 });
  }
  await page.close();
}
await browser.close();
console.log(`captures → ${out}`);
process.exit(0);
