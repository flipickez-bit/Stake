#!/usr/bin/env node
/**
 * LOOP ×N dans Chromium headless (aucune mise) + mesures. Construit sa propre copie (dist-bench/).
 * Usage : node tools/loop-benchmark.mjs [--count 100] [--speed turbo] [--sample 50] [--markdown docs/generated/LOOP_X100.md]
 * --sample N : relevé mémoire toutes les N manches, avant et après un GC forcé (Chrome --expose-gc).
 * ⚠ Chromium headless utilise un rendu LOGICIEL (SwiftShader) : les FPS sont très pessimistes
 *    et ne représentent pas un téléphone. Seules la stabilité et les tendances sont significatives.
 * Pas lancé en CI (trop long) : outil manuel.
 */
import { execSync, spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const count = Number(arg('count', '100'));
const speed = arg('speed', 'turbo');
const sampleEvery = Number(arg('sample', '0'));
const markdown = arg('markdown', null);
const port = Number(arg('port', '4180'));

execSync('npx vite build --outDir dist-bench --emptyOutDir', { stdio: 'ignore' });
const server = spawn('npx', ['vite', 'preview', '--outDir', 'dist-bench', '--port', String(port), '--strictPort'], { stdio: 'ignore', detached: true });
const stop = () => {
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {}
};
process.on('exit', stop);
await new Promise((r) => setTimeout(r, 2500));

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info', '--js-flags=--expose-gc'],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
await page.goto(`http://localhost:${port}/`);
await page.waitForFunction(() => window.__BADBOSS__?.state().state === 'READY', null, { timeout: 30000 });
await page.evaluate((s) => window.__BADBOSS__.ctx.flow.setSpeed(s), speed);
const idle = await page.evaluate(async () => {
  await new Promise((r) => setTimeout(r, 3000));
  return window.__BADBOSS__.dev.perf();
});
const t0 = Date.now();
const report = await page.evaluate(([n, every]) => window.__BADBOSS__.dev.loop({ count: n, level: 'all', sampleEvery: every }), [count, sampleEvery]);
const stats = await page.evaluate(() => window.__BADBOSS__.dev.stats());
const wall = Date.now() - t0;
await browser.close();
stop();

/** Pente (Mo par 100 manches) par moindres carrés, en ignorant les relevés de chauffe. */
function slopePer100(samples, key, skip) {
  const pts = samples.slice(skip).filter((s) => s[key] !== null).map((s) => [s.round, s[key]]);
  if (pts.length < 3) return null;
  const n = pts.length;
  const mx = pts.reduce((a, p) => a + p[0], 0) / n;
  const my = pts.reduce((a, p) => a + p[1], 0) / n;
  const num = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0);
  const den = pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
  return den ? (num / den) * 100 : null;
}

const summary = { count, speed, wallMs: wall, idlePerf: idle, report, stageStats: stats, pageErrors };
console.log(JSON.stringify(summary, null, 2));
if (markdown) {
  const r = report;
  const s = r.samples ?? [];
  const warm = Math.min(2, Math.max(0, s.length - 3));
  const slopeRaw = slopePer100(s, 'heapMB', warm);
  const slopeGc = slopePer100(s, 'heapAfterGcMB', warm);
  const memTable = s.length
    ? `\n## Mémoire tous les ${sampleEvery} rounds\n\n| Round | Tas brut (Mo) | Tas après GC forcé (Mo) | Nœuds d'affichage | Textures | Temps (s) |\n|---:|---:|---:|---:|---:|---:|\n${s
        .map((x) => `| ${x.round} | ${x.heapMB ?? 'n/a'} | ${x.heapAfterGcMB ?? 'n/a'} | ${x.displayObjects ?? 'n/a'} | ${x.textures ?? 'n/a'} | ${x.elapsedS} |`)
        .join('\n')}\n\nPente après chauffe (à partir du round ${s[warm]?.round ?? 0}, moindres carrés) : tas brut **${slopeRaw === null ? 'n/a' : slopeRaw.toFixed(3)} Mo / 100 rounds**, tas après GC **${slopeGc === null ? 'n/a' : slopeGc.toFixed(3)} Mo / 100 rounds**.\n`
    : '';
  const md = `# LOOP x${count} — BAD BOSS

> Généré par \`tools/loop-benchmark.mjs --count ${count} --speed ${speed}${sampleEvery ? ` --sample ${sampleEvery}` : ''}\` le ${new Date().toISOString().slice(0, 10)}. Ne pas éditer.
> Chromium headless, rendu **logiciel SwiftShader** (pas de GPU), viewport 1100 × 760 : les FPS sont très pessimistes
> et **ne représentent pas un téléphone**. Ce qui compte ici : stabilité, absence d'erreur, mémoire stable.
> Présentation seule (\`GameFlow.replayRound\`), **aucune mise**, résultats tirés par le mock mathématique, 3 Rage Levels en alternance.

| Mesure | Valeur |
|---|---|
| Manches demandées / terminées / reveal atteint | ${r.requested} / ${r.completed} / ${r.revealed} |
| Erreurs | ${r.errors.length ? r.errors.join('; ') : 'aucune'} |
| Erreurs JS de page | ${pageErrors.length ? pageErrors.join('; ') : 'aucune'} |
| Appels wallet pendant la boucle | ${r.walletCallsDuringLoop} |
| Vitesse | ${r.speed} |
| Durée totale / moyenne par manche | ${(r.durationMs / 1000).toFixed(1)} s / ${(r.avgRoundMs / 1000).toFixed(2)} s |
| FPS moyen / bas (p99) pendant la boucle | ${r.fps} / ${r.minFps} |
| FPS au repos (READY, 3 s) | ${idle.fps.toFixed(1)} |
| Temps CPU par image (mise à jour + rendu) moy / p95 / max | ${r.avgFrameMs} / ${r.p95FrameMs} / ${r.maxFrameMs} ms |
| Particules actives max | ${r.maxParticles} |
| Tas JS début → fin (brut) | ${r.heapStartMB ?? 'n/a'} → ${r.heapEndMB ?? 'n/a'} MB |
| Textures / mémoire texture estimée | ${stats.textures} / ${(stats.textureBytes / 1048576).toFixed(1)} MB |
| Nœuds d'affichage | ${stats.displayObjects} |

Branches jouées : ${Object.entries(r.branches).sort().map(([k, v]) => `\`${k}\` ${v}`).join(' · ')}
${memTable}`;
  writeFileSync(markdown, md);
  console.log(`→ ${markdown}`);
}
process.exit(report.errors.length || pageErrors.length ? 1 : 0);
