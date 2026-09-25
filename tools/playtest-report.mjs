#!/usr/bin/env node
/**
 * Rapport PLAYTEST à partir des exports JSON (bouton « Copier » ou « Enregistrer » en fin de session).
 * Usage : node tools/playtest-report.mjs exports/*.json [--markdown docs/generated/PLAYTEST_REPORT.md]
 * Données LOCAL DEV ONLY transmises volontairement par les testeurs ; ne pas publier.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const mdIndex = args.indexOf('--markdown');
const markdown = mdIndex >= 0 ? args[mdIndex + 1] : null;
const files = args.filter((a, i) => a !== '--markdown' && (mdIndex < 0 || i !== mdIndex + 1));
if (!files.length) {
  console.error('Usage : node tools/playtest-report.mjs <export.json>... [--markdown out.md]');
  process.exit(1);
}

let questions = [];
const sessions = [];
for (const f of files) {
  const data = JSON.parse(readFileSync(f, 'utf8'));
  if (data.questions) questions = data.questions;
  for (const s of data.sessions ?? []) if (!sessions.some((x) => x.id === s.id)) sessions.push({ ...s, file: f });
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const sec = (ms) => (ms === null || ms === undefined ? '—' : `${(ms / 1000).toFixed(1)} s`);
const pct = (x) => `${Math.round(x * 100)} %`;
const f2 = (x) => (x === null ? '—' : x.toFixed(2));

const complete = sessions.filter((s) => s.rounds.length >= 50);
const answered = sessions.filter((s) => s.answers);
const allRounds = complete.flatMap((s) => s.rounds.map((r, i) => ({ ...r, prev: s.rounds[i - 1] ?? null, session: s.id })));

const lines = [];
lines.push('# PLAYTEST — rapport', '', `> Généré par \`tools/playtest-report.mjs\` le ${new Date().toISOString().slice(0, 10)}. Données LOCAL DEV ONLY transmises volontairement. Ne pas éditer.`, '');
lines.push(`Sessions : ${sessions.length} (dont ${complete.length} de 50 manches, ${answered.length} avec questionnaire). Versions de contenu : ${[...new Set(sessions.map((s) => s.contentVersion))].join(', ')}.`, '');

lines.push('## Questionnaire (1 = pas du tout d\'accord, 5 = tout à fait d\'accord)', '');
lines.push(`| Affirmation | Moyenne | Min | Max | n | ${answered.map((s) => s.id).join(' | ')} |`);
lines.push(`|---|---:|---:|---:|---:|${answered.map(() => '---:').join('|')}|`);
const valid = (x) => typeof x === 'number';
questions.forEach((q, i) => {
  const cells = answered.map((s) => s.answers.scores[i]);
  const xs = cells.filter(valid);
  lines.push(`| ${i + 1}. ${q} | ${f2(mean(xs))} | ${xs.length ? Math.min(...xs) : '—'} | ${xs.length ? Math.max(...xs) : '—'} | ${xs.length} | ${cells.map((x) => (valid(x) ? x : x === null ? 'pas rencontré' : '—')).join(' | ')} |`);
});
const overall = answered.flatMap((s) => s.answers.scores).filter(valid);
lines.push('', `Moyenne générale (réponses données) : **${f2(mean(overall))}**.`, '');
// Comparaison par version de contenu (PLAYTEST #1 = P05-A, #2 = P05-B…), métrique principale Q1.
const versions = [...new Set(answered.map((s) => s.contentVersion))];
if (versions.length) {
  lines.push('### Par version de contenu', '', `| Version | Sessions | ${questions.map((_, i) => `Q${i + 1}`).join(' | ')} |`, `|---|---:|${questions.map(() => '---:').join('|')}|`);
  for (const v of versions) {
    const ss = answered.filter((s) => s.contentVersion === v);
    lines.push(`| ${v} | ${ss.length} | ${questions.map((_, i) => f2(mean(ss.map((s) => s.answers.scores[i]).filter(valid)))).join(' | ')} |`);
  }
  lines.push('');
}

lines.push('## « Quel moment t\'a le plus marqué ? »', '');
const comments = answered.filter((s) => s.answers.memorable);
if (comments.length) for (const s of comments) lines.push(`- (${s.id}) ${s.answers.memorable.replace(/\n/g, ' ')}`);
else lines.push('- aucun commentaire');
lines.push('');

lines.push('## Métriques comportementales (sessions de 50 manches)', '');
lines.push('| Session | Contenu | Appareil | G / F / U | Changements de niveau | Anim. médiane | READY → mise (médiane) | Turbo / Super / Skip | BOSS FIGHT | Branches distinctes à 10 / 25 / 50 | Nouvelles (41–50) | Manches après la 50e | DEV ouvert |');
lines.push('|---|---|---|---|---:|---:|---:|---|---:|---|---:|---:|---|');
for (const s of complete) {
  const r = s.rounds;
  const by = (lv) => r.filter((x) => x.level === lv).length;
  const switches = r.filter((x, i) => i > 0 && r[i - 1].level !== x.level).length;
  const ready = r.map((x) => x.readyToBetMs).filter((x) => x !== null);
  const distinct = (n) => new Set(r.slice(0, n).map((x) => x.branch)).size;
  const newLate = r.slice(40, 50).filter((x, i) => !r.slice(0, 40 + i).some((y) => y.branch === x.branch)).length;
  lines.push(
    `| ${s.id} | ${s.contentVersion} | ${s.device.width}×${s.device.height}${s.device.touch ? ' tactile' : ''} | ${by('grumpy')} / ${by('furious')} / ${by('unhinged')} | ${switches} | ${sec(median(r.map((x) => x.animationMs)))} | ${sec(median(ready))} | ${pct(r.filter((x) => x.speed === 'turbo').length / r.length)} / ${pct(r.filter((x) => x.speed === 'super').length / r.length)} / ${pct(r.filter((x) => x.skipped).length / r.length)} | ${r.filter((x) => x.bossFight).length} | ${distinct(10)} / ${distinct(25)} / ${distinct(50)} | ${newLate} | ${s.extraRounds} | ${s.devPanelOpened ? 'oui' : 'non'} |`,
  );
}
lines.push('');

const group = (key) => {
  const m = new Map();
  for (const r of allRounds) {
    const k = key(r);
    if (k === null) continue;
    m.set(k, [...(m.get(k) ?? []), r]);
  }
  return m;
};
lines.push('### Par Rage Level', '', '| Rage Level | Manches | Part | Hit rate | Anim. médiane | READY → mise suivante (médiane) |', '|---|---:|---:|---:|---:|---:|');
for (const [lv, rs] of group((r) => r.level)) {
  const next = allRounds.filter((r) => r.prev && r.prev.level === lv && r.readyToBetMs !== null).map((r) => r.readyToBetMs);
  lines.push(`| ${lv} | ${rs.length} | ${pct(rs.length / allRounds.length)} | ${pct(rs.filter((r) => r.multiplier > 0).length / rs.length)} | ${sec(median(rs.map((r) => r.animationMs)))} | ${sec(median(next))} |`);
}
lines.push('', '### Hésitation selon le résultat précédent', '', '| Résultat de la manche précédente | Occurrences | READY → mise suivante (médiane) | (moyenne) |', '|---|---:|---:|---:|');
for (const [o, rs] of group((r) => (r.prev && r.readyToBetMs !== null ? r.prev.outcome : null))) {
  const xs = rs.map((r) => r.readyToBetMs);
  lines.push(`| ${o} | ${rs.length} | ${sec(median(xs))} | ${sec(mean(xs))} |`);
}
lines.push('', '### Par branche', '', '| Branche | Manches | Anim. médiane |', '|---|---:|---:|');
for (const [b, rs] of [...group((r) => r.branch ?? '—')].sort()) lines.push(`| ${b} | ${rs.length} | ${sec(median(rs.map((r) => r.animationMs)))} |`);
lines.push('');

const md = lines.join('\n');
console.log(md);
if (markdown) {
  writeFileSync(markdown, md + '\n');
  console.error(`→ ${markdown}`);
}
