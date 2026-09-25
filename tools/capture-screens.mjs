#!/usr/bin/env node
/**
 * Captures d'écran de la Phase 0 (desktop + mobile portrait), sans mise réelle.
 * Usage : npm run build && node tools/capture-screens.mjs  → docs/phase0/screens/*.jpg
 */
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const port = 4174;
const OUT = 'docs/phase0/screens';
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore', detached: true });
process.on('exit', () => {
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {}
});
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

async function open(viewport, query = '') {
  const page = await browser.newPage({ viewport });
  await page.goto(`http://localhost:${port}/${query}`);
  await page.waitForFunction(() => window.__BADBOSS__?.state().state === 'READY', null, { timeout: 30000 });
  await page.waitForTimeout(400);
  return page;
}
const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 72 });
const at = (page, ms) => page.waitForFunction((t) => window.__BADBOSS__.presenter().t >= t, ms, { timeout: 30000 });
const ready = (page) => page.waitForFunction(() => window.__BADBOSS__.state().state === 'READY', null, { timeout: 60000 });
async function preview(page, level, forced) {
  await page.evaluate(([l, f]) => { window.__BADBOSS__.ctx.flow.setLevel(l); void window.__BADBOSS__.dev.preview(l, f); }, [level, forced]);
}

const desktop = { width: 1100, height: 760 };
const mobile = { width: 390, height: 844 };

let page = await open(desktop);
await shot(page, '01-desktop-ready-grumpy');
await preview(page, 'grumpy', { kind: 'WIN', multiplier: 2, seed: 7 });
await at(page, 950);
await shot(page, '02-desktop-slingshot-pull');
await ready(page);
await preview(page, 'furious', { kind: 'LOSS', multiplier: 0, seed: 7 });
await at(page, 1500);
await shot(page, '03-desktop-trapdoor-hover');
await ready(page);
await preview(page, 'unhinged', { kind: 'WIN', multiplier: 2, seed: 7 });
await page.waitForFunction(() => window.__BADBOSS__.state().revealed !== null, null, { timeout: 30000 });
await page.waitForTimeout(250);
await shot(page, '04-desktop-rocket-ceiling-reveal-x2');
await ready(page);
await preview(page, 'furious', { kind: 'BOSS_FIGHT', bossFightRung: 3, seed: 7 });
await page.waitForFunction(() => window.__BADBOSS__.presenter().bossFight.rung >= 2, null, { timeout: 60000 });
await shot(page, '05-desktop-boss-fight-ladder');
await ready(page);
await page.close();

page = await open(desktop, '?dev=1');
await page.waitForTimeout(1200);
await shot(page, '06-desktop-dev-panel');
await page.evaluate(() => window.__BADBOSS__.server.update((s) => (s.faults.offline = true)));
await page.getByTestId('fire').click();
await page.getByTestId('retry').waitFor({ timeout: 60000 });
await shot(page, '07-desktop-round-status-unknown-retry');
await page.close();

page = await open(mobile);
await shot(page, '08-mobile-ready');
await preview(page, 'unhinged', { kind: 'BIG_WIN', multiplier: 100, seed: 3 });
await page.waitForFunction(() => window.__BADBOSS__.state().revealed !== null, null, { timeout: 30000 });
await page.waitForTimeout(200);
await shot(page, '09-mobile-rocket-big-win-reveal');
await page.close();

await browser.close();
console.log(`captures → ${OUT}`);
process.exit(0);
