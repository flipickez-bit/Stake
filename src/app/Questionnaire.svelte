<script lang="ts">
  import { PLAYTEST3_FAVORITE_QUESTION, PLAYTEST_FREE_QUESTION, PLAYTEST_NA_LABEL, PLAYTEST_QUESTIONS, PLAYTEST_WISH_QUESTION, type PlaytestAnswers } from '../dev/playtest';

  // PLAYTEST #3 : `questions` = les 8 du protocole + 3 sur les gadgets (mode 3 gadgets) ; `plans` ajoute la question libre du gadget préféré.
  let { onSubmit, questions = PLAYTEST_QUESTIONS, plans = false }: { onSubmit: (answers: PlaytestAnswers | null) => void; questions?: readonly string[]; plans?: boolean } = $props();

  // svelte-ignore state_referenced_locally
  let scores = $state<(number | null)[]>(questions.map(() => null));
  // svelte-ignore state_referenced_locally
  let notSeen = $state<boolean[]>(questions.map(() => false));
  let memorable = $state('');
  let wish = $state('');
  let favorite = $state('');
  const complete = $derived(scores.every((s, i) => s !== null || notSeen[i]));
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="pt-q-title" data-testid="questionnaire">
  <form
    class="panel"
    onsubmit={(e) => {
      e.preventDefault();
      if (complete) onSubmit({ scores: scores.map((x, i) => (notSeen[i] ? null : x)), memorable, wish, ...(plans ? { favorite } : {}) });
    }}
  >
    <h2 id="pt-q-title">Session terminée</h2>
    <p class="intro">{questions.length} affirmations. Note chacune selon ce que tu as ressenti pendant ces 50 manches.</p>
    <p class="scale"><span>1 = pas du tout d'accord</span><span>5 = tout à fait d'accord</span></p>
    {#each questions as q, i (i)}
      <fieldset>
        <legend>{i + 1}. {q}</legend>
        <div class="scores">
          {#each [1, 2, 3, 4, 5] as v (v)}
            <label class:on={scores[i] === v && !notSeen[i]}>
              <input type="radio" name="q{i}" id="q{i}-{v}" value={v} checked={scores[i] === v && !notSeen[i]} onchange={() => { scores[i] = v; notSeen[i] = false; }} data-testid="q{i + 1}-{v}" />
              <span>{v}</span>
            </label>
          {/each}
        </div>
        {#if PLAYTEST_NA_LABEL[i]}
          <label class="na"><input type="checkbox" id="q{i}-na" checked={notSeen[i]} onchange={(e) => (notSeen[i] = (e.currentTarget as HTMLInputElement).checked)} data-testid="q{i + 1}-na" /> {PLAYTEST_NA_LABEL[i]}</label>
        {/if}
      </fieldset>
    {/each}
    <label class="free" for="pt-memorable">{PLAYTEST_FREE_QUESTION} <small>(facultatif)</small></label>
    <textarea id="pt-memorable" bind:value={memorable} maxlength="1000" rows="3" data-testid="q-memorable"></textarea>
    <label class="free" for="pt-wish">{PLAYTEST_WISH_QUESTION} <small>(facultatif)</small></label>
    <textarea id="pt-wish" bind:value={wish} maxlength="1000" rows="2" data-testid="q-wish"></textarea>
    {#if plans}
      <label class="free" for="pt-favorite">{PLAYTEST3_FAVORITE_QUESTION} <small>(facultatif)</small></label>
      <textarea id="pt-favorite" bind:value={favorite} maxlength="1000" rows="2" data-testid="q-favorite"></textarea>
    {/if}
    <div class="buttons">
      <button type="submit" class="primary" disabled={!complete} data-testid="q-submit">Enregistrer les réponses</button>
      <button type="button" onclick={() => onSubmit(null)} data-testid="q-skip">Passer</button>
    </div>
  </form>
</div>

<style>
  .overlay { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; background: rgba(10, 12, 26, 0.88); padding: 12px; overflow-y: auto; }
  .panel { width: min(520px, 100%); max-height: 100%; overflow-y: auto; background: #1f2447; border: 2px solid var(--bb-violet); border-radius: 16px; padding: 16px 18px; color: #fff; display: flex; flex-direction: column; gap: 10px; }
  h2 { margin: 0; color: var(--bb-yellow); letter-spacing: 2px; }
  .intro { margin: 0; font-size: 14px; line-height: 1.4; }
  .scale { margin: 0; display: flex; justify-content: space-between; font-size: 11px; opacity: 0.7; }
  fieldset { border: 0; margin: 0; padding: 8px 0 0; border-top: 1px solid #2b3160; }
  legend { font-size: 14px; line-height: 1.35; padding: 0; margin-bottom: 6px; font-weight: 600; }
  .scores { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
  .scores label { position: relative; display: grid; place-items: center; height: 40px; border-radius: 10px; background: #2b3160; border: 2px solid #3a4280; font-weight: 800; cursor: pointer; }
  .scores label.on { background: #e8ecff; color: var(--bb-ink); border-color: #e8ecff; }
  .scores input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
  .scores label:focus-within { outline: 3px solid #fff; outline-offset: 2px; }
  .na { display: flex; gap: 6px; align-items: center; margin-top: 6px; font-size: 13px; opacity: 0.85; }
  .free { font-size: 14px; font-weight: 600; }
  .free small { opacity: 0.6; font-weight: 400; }
  textarea { width: 100%; background: #12152b; color: #fff; border: 2px solid #3a4280; border-radius: 10px; padding: 8px; font: inherit; resize: vertical; }
  .buttons { display: flex; gap: 8px; }
  button { height: 44px; border-radius: 12px; border: 2px solid #3a4280; background: #2b3160; color: #fff; font-weight: 800; cursor: pointer; padding: 0 14px; }
  .primary { flex: 1; background: var(--bb-yellow); color: var(--bb-ink); border-color: var(--bb-yellow); }
  .primary:disabled { opacity: 0.4; cursor: default; }
  button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
</style>
