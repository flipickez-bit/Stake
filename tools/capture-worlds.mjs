#!/usr/bin/env node
/**
 * PRODUCTION 3 GADGETS — le décor du choix de chaque Rage Level (les 3 gadgets présents), avec l'interface et
 * SANS interface (test de lisibilité du monde). Portrait prioritaire : 360×640, 390×844, 430×932 + paysage 1100×760.
 * Usage : node tools/capture-worlds.mjs --url http://localhost:5199/ --out docs/production/worlds [--devices desktop,p390]
 */
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const base = arg('url', 'http://localhost:5199/');
const out = arg('out', 'tools/.scratch/worlds');
const devices = arg('devices', 'desktop,p360,p390,p430').split(',');
const levels = arg('levels', 'grumpy,furious,unhinged').split(',');
mkdirSync(out, { recursive: true });
const VIEWPORTS = { desktop: { width: 1100, height: 760 }, p360: { width: 360, height: 640 }, p390: { width: 390, height: 844 }, p430: { width: 430, height: 932 } };

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const d of devices) {
  const page = await browser.newPage({ viewport: VIEWPORTS[d] });
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  await page.goto(base);
  await page.waitForFunction(() => window.__BADBOSS__?.state().state === 'READY', null, { timeout: 30000 });
  for (const level of levels) {
    await page.evaluate((l) => { const f = window.__BADBOSS__.ctx.flow; f.setLevel(l); f.setPlan('B'); }, level);
    await page.mouse.move(2, 2);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}/${d}-${level}-ui.jpg`, type: 'jpeg', quality: 80 });
    // Sans interface : seul le canevas (le monde doit se lire sans aucun texte).
    await page.addStyleTag({ content: 'body *:not(canvas){visibility:hidden !important} canvas{visibility:visible !important}' });
    await page.evaluate(() => window.__BADBOSS__.ctx.stage.setPlanUi({ selected: null, hover: null }));
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/${d}-${level}-noui.jpg`, type: 'jpeg', quality: 80 });
    await page.reload();
    await page.waitForFunction(() => window.__BADBOSS__?.state().state === 'READY', null, { timeout: 30000 });
  }
  await page.close();
  console.log(`${d} ✓`);
}
await browser.close();
