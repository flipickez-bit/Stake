#!/usr/bin/env node
/**
 * Planche contact (revue des captures) : node tools/contact-sheet.mjs <sortie.png|jpg> <colonnes> <largeur-case> <images…>
 * Chaque image est légendée par son nom de fichier. Aucune dépendance autre que Playwright.
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { chromium } from '@playwright/test';

const [out, colsArg = '4', cellArg = '300', ...files] = process.argv.slice(2);
const cols = Number(colsArg);
const cell = Number(cellArg);
const cells = files.map((f) => {
  const ext = f.endsWith('.png') ? 'png' : 'jpeg';
  const data = readFileSync(f).toString('base64');
  return `<figure><img src="data:image/${ext};base64,${data}"><figcaption>${basename(f)}</figcaption></figure>`;
}).join('');
const html = `<!doctype html><html><body style="margin:0;background:#2a1b2f"><div style="display:grid;grid-template-columns:repeat(${cols},${cell}px);gap:6px;padding:6px">${cells}</div>
<style>figure{margin:0}img{width:${cell}px;display:block}figcaption{font:11px monospace;color:#fff8ee;padding:2px 0}</style></body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: cols * (cell + 6) + 6, height: 400 } });
await page.setContent(html);
await page.waitForTimeout(300);
await page.screenshot({ path: out, fullPage: true, type: out.endsWith('.png') ? 'png' : 'jpeg', ...(out.endsWith('.png') ? {} : { quality: 82 }) });
await browser.close();
console.log(out);
