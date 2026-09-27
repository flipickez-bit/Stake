<script lang="ts">
  import { copyText, saveTextFile } from '../../dev/exportFile';
  import { POC_VARIANT_LABEL, questionsFor, summarize, type PocPlaytestRecorder, type PocRate, type PocStudy } from '../../dev/pocPlaytest';

  let { recorder, study, onClose }: { recorder: PocPlaytestRecorder; study: PocStudy; onClose: () => void } = $props();

  const summaries = $derived(study.sessions.map(summarize));
  const json = $derived(recorder.exportJson(study));
  let status = $state('');
  let area: HTMLTextAreaElement;

  const s = (ms: number | null) => (ms === null ? '—' : `${(ms / 1000).toFixed(1)} s`);
  const r = (x: PocRate) => (x.rate === null ? '— (0 cas)' : `${Math.round(x.rate * 100)} % (${x.n}/${x.of})`);

  async function copy() {
    if (await copyText(json)) status = 'Résultats copiés dans le presse-papiers.';
    else {
      area.select();
      status = 'Copie automatique refusée : le texte est sélectionné, copie-le à la main.';
    }
  }

  async function save() {
    const res = await saveTextFile(`badboss-poc3-${study.id}.json`, json);
    status = res === 'saved' ? 'Fichier enregistré.' : res === 'declined' ? 'Enregistrement annulé.' : 'Enregistrement indisponible ici : utilise « Copier ».';
  }
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="poc-r-title" data-testid="poc-results">
  <div class="panel">
    <h2 id="poc-r-title">Playtest 3 PLANS enregistré</h2>
    <p class="small">{study.id} · ordre : {study.order.map((v) => POC_VARIANT_LABEL[v]).join(' → ')} · LOCAL DEV ONLY : rien n'a été envoyé.{study.devPanelOpened ? ' DEV PANEL ouvert pendant l’étude.' : ''}</p>
    <div class="scroll">
      <table>
        <thead><tr><th></th>{#each summaries as x (x.index)}<th>S{x.index} · {POC_VARIANT_LABEL[x.variant]}</th>{/each}</tr></thead>
        <tbody>
          <tr><td>Manches (+ en plus, volontaires)</td>{#each summaries as x (x.index)}<td>{x.rounds} (+{x.extraRounds})</td>{/each}</tr>
          <tr><td>Plans choisis A / B / C</td>{#each summaries as x (x.index)}<td>{x.picks.A} / {x.picks.B} / {x.picks.C}</td>{/each}</tr>
          <tr><td>Changements de plan</td>{#each summaries as x (x.index)}<td>{r(x.switches)}</td>{/each}</tr>
          <tr><td>OTHER PLANS ouverts</td>{#each summaries as x (x.index)}<td>{x.variant === 'ON_DEMAND' ? r(x.reveals) : 'n/a'}</td>{/each}</tr>
          <tr><td>Délai avant ouverture (moy.)</td>{#each summaries as x (x.index)}<td>{s(x.revealAfterMsMean)}</td>{/each}</tr>
          <tr><td>Change après avoir VU un meilleur plan</td>{#each summaries as x (x.index)}<td>{r(x.switchAfterSeenOtherBetter)}</td>{/each}</tr>
          <tr><td>Change après avoir VU que son plan était le meilleur</td>{#each summaries as x (x.index)}<td>{r(x.switchAfterSeenChosenBest)}</td>{/each}</tr>
          <tr><td>Témoin : meilleur plan NON vu</td>{#each summaries as x (x.index)}<td>{r(x.switchAfterUnseenOtherBetter)}</td>{/each}</tr>
          <tr><td>READY → mise (moy.)</td>{#each summaries as x (x.index)}<td>{s(x.readyToBetMsMean)}</td>{/each}</tr>
          <tr><td>… après une perte / un gain</td>{#each summaries as x (x.index)}<td>{s(x.readyToBetAfterLossMs)} / {s(x.readyToBetAfterWinMs)}</td>{/each}</tr>
          <tr><td>… après avoir ouvert OTHER PLANS</td>{#each summaries as x (x.index)}<td>{s(x.readyToBetAfterRevealMs)}</td>{/each}</tr>
          {#each ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'] as q (q)}
            <tr>
              <td>{q}</td>
              {#each summaries as x (x.index)}
                <td>{questionsFor(x.variant).some((y) => y.id === q) ? (x.answers ? `${x.answers.scores[q as 'Q1'] ?? '—'} / 5` : 'passé') : 'n/a'}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
      {#each study.sessions as ses (ses.index)}
        {#if ses.answers?.free}<p class="free"><b>S{ses.index} · réponse libre :</b> {ses.answers.free}</p>{/if}
      {/each}
    </div>
    <div class="buttons">
      <button class="primary" onclick={copy} data-testid="poc-copy">Copier les résultats</button>
      <button onclick={save} data-testid="poc-save">Enregistrer le fichier</button>
    </div>
    {#if status}<p class="status" role="status">{status}</p>{/if}
    <textarea bind:this={area} readonly rows="4" aria-label="Résultats JSON" data-testid="poc-json">{json}</textarea>
    <div class="buttons"><button class="close" onclick={onClose} data-testid="poc-close">Fermer</button></div>
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; background: rgba(10, 12, 26, 0.88); padding: 12px; overflow-y: auto; }
  .panel { width: min(620px, 100%); max-height: 100%; overflow-y: auto; background: #1f2447; border: 2px solid var(--bb-violet); border-radius: 16px; padding: 16px 18px; color: #fff; display: flex; flex-direction: column; gap: 10px; }
  h2 { margin: 0; color: var(--bb-yellow); letter-spacing: 1px; font-size: 20px; }
  .small { margin: 0; font-size: 12px; opacity: 0.75; }
  .scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; font-variant-numeric: tabular-nums; }
  th { text-align: right; font-size: 11px; opacity: 0.8; padding-bottom: 4px; }
  td { padding: 3px 4px; border-bottom: 1px solid #2b3160; }
  td:first-child { opacity: 0.75; }
  td:not(:first-child) { text-align: right; white-space: nowrap; }
  .free { margin: 6px 0 0; font-size: 12px; line-height: 1.4; }
  .buttons { display: flex; gap: 8px; }
  button { height: 44px; border-radius: 12px; border: 2px solid #3a4280; background: #2b3160; color: #fff; font-weight: 800; cursor: pointer; padding: 0 12px; flex: 1; }
  .primary { background: var(--bb-yellow); color: var(--bb-ink); border-color: var(--bb-yellow); }
  .close { flex: none; margin-left: auto; }
  .status { margin: 0; font-size: 13px; color: #9fe0b0; }
  textarea { width: 100%; background: #12152b; color: #cfd3e6; border: 1px solid #3a4280; border-radius: 8px; font: 11px/1.3 ui-monospace, monospace; padding: 6px; }
  button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
</style>
