#!/usr/bin/env node
/**
 * DEV : capture d'une page du serveur de dev (planche d'art, scène). Serveur vite supposé lancé (npx vite --port 5199).
 * Usage : node tools/art-shot.mjs "<query>" <out.png> [largeur] [hauteur] [attente-ms]
 */
import { chromium } from '@playwright/test';

const [query = '?artsheet=parts', out = 'shot.png', w = '1400', h = '900', wait = '1500'] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
page.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto(`http://localhost:5199/${query}`);
await page.waitForTimeout(Number(wait));
await page.screenshot({ path: out, fullPage: true, ...(out.endsWith('.jpg') ? { type: 'jpeg', quality: 88 } : {}) });
await browser.close();
console.log(out);
