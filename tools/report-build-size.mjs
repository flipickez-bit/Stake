#!/usr/bin/env node
/**
 * Taille du build statique (dist/) : brut et gzip, par fichier et au total.
 * Usage : npm run build && npm run size [-- --markdown docs/generated/BUILD_SIZE.md]
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else {
      const buf = readFileSync(p);
      files.push({ file: relative(DIST, p), raw: buf.length, gzip: gzipSync(buf, { level: 9 }).length });
    }
  }
};
try {
  walk(DIST);
} catch {
  console.error('dist/ introuvable : lancez `npm run build` d\'abord.');
  process.exit(1);
}
files.sort((a, b) => b.raw - a.raw);
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const total = files.reduce((s, f) => ({ raw: s.raw + f.raw, gzip: s.gzip + f.gzip }), { raw: 0, gzip: 0 });
// Chargement initial : index.html + CSS + JS d'entrée et ses imports statiques (hors chunks dynamiques Stake/WebGPU).
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const entry = [...html.matchAll(/(?:src|href)="\.\/(assets\/[^"]+)"/g)].map((m) => m[1]);
const initial = files.filter((f) => f.file === 'index.html' || entry.includes(f.file));
const initialTotal = initial.reduce((s, f) => ({ raw: s.raw + f.raw, gzip: s.gzip + f.gzip }), { raw: 0, gzip: 0 });

const lines = [
  '| Fichier | Brut | gzip |',
  '|---|---:|---:|',
  ...files.map((f) => `| ${f.file} | ${kb(f.raw)} | ${kb(f.gzip)} |`),
  `| **Total dist/** | **${kb(total.raw)}** | **${kb(total.gzip)}** |`,
  `| **Chargement initial** (index.html + entrée) | **${kb(initialTotal.raw)}** | **${kb(initialTotal.gzip)}** |`,
];
console.log(lines.join('\n'));
const i = process.argv.indexOf('--markdown');
if (i > 0 && process.argv[i + 1]) {
  const md = `# Taille du build — BAD BOSS Phase 0\n\n> Généré par \`tools/report-build-size.mjs\` le ${new Date().toISOString().slice(0, 10)}. Ne pas éditer.\n> Aucun asset binaire (images, sons) en Phase 0 : formes et sons synthétisés.\n\n${lines.join('\n')}\n`;
  writeFileSync(process.argv[i + 1], md);
  console.log(`\n→ ${process.argv[i + 1]}`);
}
