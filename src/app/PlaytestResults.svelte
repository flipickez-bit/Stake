<script lang="ts">
  import { copyText, saveTextFile } from '../dev/exportFile';
  import { PLAYTEST_QUESTIONS, summarize, type PlaytestRecorder, type PlaytestSession } from '../dev/playtest';

  let { recorder, session, onClose, onPreviewBossFight }: { recorder: PlaytestRecorder; session: PlaytestSession; onClose: () => void; onPreviewBossFight: () => void } = $props();

  const summary = $derived(summarize(session));
  const json = $derived(recorder.exportJson([session]));
  let status = $state('');
  let area: HTMLTextAreaElement;

  const s = (ms: number | null) => (ms === null ? '—' : `${(ms / 1000).toFixed(1)} s`);
  const pct = (x: number) => `${Math.round(x * 100)} %`;

  async function copy() {
    if (await copyText(json)) status = 'Résultats copiés dans le presse-papiers.';
    else {
      area.select();
      status = 'Copie automatique refusée : le texte est sélectionné, copie-le à la main.';
    }
  }

  async function save() {
    const r = await saveTextFile(`badboss-playtest-${session.id}.json`, json);
    status = r === 'saved' ? 'Fichier enregistré.' : r === 'declined' ? 'Enregistrement annulé.' : 'Enregistrement indisponible ici : utilise « Copier ».';
  }
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="pt-r-title" data-testid="playtest-results">
  <div class="panel">
    <h2 id="pt-r-title">Session enregistrée</h2>
    <p class="small">{session.id} · {session.contentVersion} · LOCAL DEV ONLY : rien n'a été envoyé.</p>
    <table>
      <tbody>
        <tr><td>Manches</td><td>{summary.rounds}</td></tr>
        <tr><td>Rage Levels</td><td>G {summary.byLevel.grumpy} · F {summary.byLevel.furious} · U {summary.byLevel.unhinged}</td></tr>
        <tr><td>Durée d'animation (médiane)</td><td>{s(summary.medianAnimationMs)}</td></tr>
        <tr><td>READY → mise suivante (médiane)</td><td>{s(summary.medianReadyToBetMs)}</td></tr>
        <tr><td>Turbo / Super / Skip</td><td>{pct(summary.turboShare)} / {pct(summary.superShare)} / {pct(summary.skipShare)}</td></tr>
        <tr><td>BOSS FIGHT</td><td>{summary.bossFights}</td></tr>
        <tr><td>Branches distinctes à 10 / 25 / 50</td><td>{summary.distinctBranchesAt['10']} / {summary.distinctBranchesAt['25']} / {summary.distinctBranchesAt['50']}</td></tr>
        <tr><td>Nouvelles branches (manches 41–50)</td><td>{summary.newBranchesLast10}</td></tr>
        {#if session.answers}
          {#each PLAYTEST_QUESTIONS as q, i (i)}<tr><td>Q{i + 1}</td><td>{session.answers.scores[i] === null ? 'pas rencontré' : `${session.answers.scores[i]} / 5`}</td></tr>{/each}
        {:else}
          <tr><td>Questionnaire</td><td>passé</td></tr>
        {/if}
      </tbody>
    </table>
    <p class="small">Pour transmettre la session, copie les résultats ou enregistre le fichier.</p>
    <div class="buttons">
      <button class="primary" onclick={copy} data-testid="pt-copy">Copier les résultats</button>
      <button onclick={save} data-testid="pt-save">Enregistrer le fichier</button>
    </div>
    {#if status}<p class="status" role="status">{status}</p>{/if}
    <textarea bind:this={area} readonly rows="4" aria-label="Résultats JSON" data-testid="pt-json">{json}</textarea>
    <div class="buttons">
      <button onclick={onPreviewBossFight} data-testid="bf-preview-results">▶ PREVIEW BOSS FIGHT</button>
      <button class="close" onclick={onClose} data-testid="pt-close">Fermer</button>
    </div>
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; background: rgba(10, 12, 26, 0.88); padding: 12px; overflow-y: auto; }
  .panel { width: min(480px, 100%); max-height: 100%; overflow-y: auto; background: #1f2447; border: 2px solid var(--bb-violet); border-radius: 16px; padding: 16px 18px; color: #fff; display: flex; flex-direction: column; gap: 10px; }
  h2 { margin: 0; color: var(--bb-yellow); letter-spacing: 2px; }
  .small { margin: 0; font-size: 12px; opacity: 0.75; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
  td { padding: 3px 0; border-bottom: 1px solid #2b3160; }
  td:first-child { opacity: 0.75; }
  td:last-child { text-align: right; }
  .buttons { display: flex; gap: 8px; }
  button { height: 44px; border-radius: 12px; border: 2px solid #3a4280; background: #2b3160; color: #fff; font-weight: 800; cursor: pointer; padding: 0 12px; flex: 1; }
  .primary { background: var(--bb-yellow); color: var(--bb-ink); border-color: var(--bb-yellow); }
  .close { flex: none; }
  .status { margin: 0; font-size: 13px; color: #9fe0b0; }
  textarea { width: 100%; background: #12152b; color: #cfd3e6; border: 1px solid #3a4280; border-radius: 8px; font: 11px/1.3 ui-monospace, monospace; padding: 6px; }
  button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
</style>
