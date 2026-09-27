<script lang="ts">
  import { POC_FREE_QUESTION, POC_SESSION_ROUNDS, questionsFor, type PocAnswers, type PocQuestionId, type PocSession } from '../../dev/pocPlaytest';

  let { session, onSubmit }: { session: PocSession; onSubmit: (answers: PocAnswers | null) => void } = $props();

  const questions = $derived(questionsFor(session.variant));
  let scores = $state<Partial<Record<PocQuestionId, number>>>({});
  let free = $state('');
  const complete = $derived(questions.every((q) => scores[q.id] !== undefined));
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="poc-q-title" data-testid="poc-questionnaire">
  <form
    class="panel"
    onsubmit={(e) => {
      e.preventDefault();
      if (complete) onSubmit({ scores: { ...scores }, free });
    }}
  >
    <h2 id="poc-q-title">Session {session.index}/2 : tes impressions</h2>
    <p class="intro">Note chaque question de 1 à 5, selon ce que tu as ressenti pendant ces {POC_SESSION_ROUNDS} manches.</p>
    {#each questions as q (q.id)}
      <fieldset>
        <legend>{q.id}. {q.text}</legend>
        <p class="scale"><span>1 = {q.scale[1]}</span>{#if q.scale[3]}<span>3 = {q.scale[3]}</span>{/if}<span>5 = {q.scale[5]}</span></p>
        <div class="scores">
          {#each [1, 2, 3, 4, 5] as v (v)}
            <label class:on={scores[q.id] === v}>
              <input type="radio" name={q.id} value={v} checked={scores[q.id] === v} onchange={() => (scores[q.id] = v)} data-testid="poc-{q.id}-{v}" />
              <span>{v}</span>
            </label>
          {/each}
        </div>
      </fieldset>
    {/each}
    {#if session.variant === 'ON_DEMAND'}
      <label class="free" for="poc-free">{POC_FREE_QUESTION} <small>(facultatif)</small></label>
      <textarea id="poc-free" bind:value={free} maxlength="1000" rows="3" data-testid="poc-free"></textarea>
    {/if}
    <div class="buttons">
      <button type="submit" class="primary" disabled={!complete} data-testid="poc-q-submit">Enregistrer</button>
      <button type="button" onclick={() => onSubmit(null)} data-testid="poc-q-skip">Passer</button>
    </div>
  </form>
</div>

<style>
  .overlay { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; background: rgba(10, 12, 26, 0.88); padding: 12px; overflow-y: auto; }
  .panel { width: min(520px, 100%); max-height: 100%; overflow-y: auto; background: #1f2447; border: 2px solid var(--bb-violet); border-radius: 16px; padding: 16px 18px; color: #fff; display: flex; flex-direction: column; gap: 10px; }
  h2 { margin: 0; color: var(--bb-yellow); letter-spacing: 1px; font-size: 20px; }
  .intro { margin: 0; font-size: 14px; line-height: 1.4; }
  fieldset { border: 0; margin: 0; padding: 8px 0 0; border-top: 1px solid #2b3160; }
  legend { font-size: 14px; line-height: 1.35; padding: 0; margin-bottom: 4px; font-weight: 600; }
  .scale { margin: 0 0 6px; display: flex; justify-content: space-between; font-size: 11px; opacity: 0.7; }
  .scores { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
  .scores label { position: relative; display: grid; place-items: center; height: 40px; border-radius: 10px; background: #2b3160; border: 2px solid #3a4280; font-weight: 800; cursor: pointer; }
  .scores label.on { background: #e8ecff; color: var(--bb-ink); border-color: #e8ecff; }
  .scores input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
  .scores label:focus-within { outline: 3px solid #fff; outline-offset: 2px; }
  .free { font-size: 14px; font-weight: 600; }
  .free small { opacity: 0.6; font-weight: 400; }
  textarea { width: 100%; background: #12152b; color: #fff; border: 2px solid #3a4280; border-radius: 10px; padding: 8px; font: inherit; resize: vertical; }
  .buttons { display: flex; gap: 8px; }
  button { height: 44px; border-radius: 12px; border: 2px solid #3a4280; background: #2b3160; color: #fff; font-weight: 800; cursor: pointer; padding: 0 14px; }
  .primary { flex: 1; background: var(--bb-yellow); color: var(--bb-ink); border-color: var(--bb-yellow); }
  .primary:disabled { opacity: 0.4; cursor: default; }
  button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
</style>
