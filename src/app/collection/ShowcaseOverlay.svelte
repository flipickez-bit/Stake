<script lang="ts">
  /**
   * SPECIAL EPISODE « OFFICE MELTDOWN » (COLLECTION_BOOK.md §F) — SHOWCASE / ENTERTAINMENT ONLY.
   * Aucune mise, aucun appel au RGS ni au wallet, aucun payout, aucun chiffre. GameFlow reste en READY ;
   * l'overlay couvre le HUD (FIRE et la barre d'espace sont inactifs). Le joueur rythme les tableaux.
   */
  import { onDestroy, onMount } from 'svelte';
  import { COPY } from '../../collection/copy';
  import { OFFICE_MELTDOWN } from '../../content/showcase';
  import { compileShowcase } from '../../presentation/compileSequence';
  import type { Presenter } from '../../presenter/Presenter';

  let { presenter, onExit }: { presenter: Presenter; onExit: () => void } = $props();

  const AUTO_NEXT_MS = 1500;
  let index = $state(0);
  let phase = $state<'playing' | 'between' | 'end'>('playing');
  let alive = true;
  let auto: ReturnType<typeof setTimeout> | null = null;
  const beat = $derived(OFFICE_MELTDOWN[index]);

  async function play(i: number) {
    if (auto) clearTimeout(auto);
    index = i;
    phase = 'playing';
    const b = OFFICE_MELTDOWN[i];
    if (!b) return;
    await presenter.playShowcase(b.stage, compileShowcase(b.id, b.stage, b.segments));
    if (!alive || index !== i) return;
    if (i < OFFICE_MELTDOWN.length - 1) {
      phase = 'between';
      auto = setTimeout(() => void play(i + 1), AUTO_NEXT_MS);
    } else {
      phase = 'end';
    }
  }

  function next() {
    if (phase === 'between') void play(index + 1);
  }

  function exit() {
    alive = false;
    if (auto) clearTimeout(auto);
    onExit();
  }

  onMount(() => void play(0));
  onDestroy(() => {
    alive = false;
    if (auto) clearTimeout(auto);
  });
</script>

<div class="showcase" role="dialog" aria-modal="true" aria-label={COPY.episodeName} data-testid="showcase" data-beat={beat?.id} data-phase={phase}>
  <div class="top">
    <span class="ep">{COPY.episode} · {COPY.episodeName}</span>
    <span class="note">{COPY.showcaseNote}</span>
  </div>
  {#key index}
    {#if beat && phase !== 'end'}<div class="beat-title">{beat.title}</div>{/if}
  {/key}
  {#if phase === 'end'}
    <div class="the-end" data-testid="showcase-end">{COPY.theEnd}</div>
  {/if}
  <div class="bottom">
    {#if phase === 'end'}
      <button class="primary" onclick={() => void play(0)} data-testid="showcase-again">{COPY.replayAgain}</button>
    {:else}
      <button class="primary" disabled={phase !== 'between'} onclick={next} data-testid="showcase-next">{COPY.nextGag}</button>
    {/if}
    <button onclick={exit} data-testid="showcase-exit">{COPY.exit}</button>
  </div>
</div>

<style>
  .showcase { position: fixed; inset: 0; z-index: 56; display: flex; flex-direction: column; justify-content: space-between; pointer-events: auto; }
  .top { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: calc(8px + env(safe-area-inset-top)) 12px 8px; background: #12152b; color: #fff; }
  .ep { font-weight: 900; letter-spacing: 2px; font-size: 14px; }
  .note { font-weight: 800; letter-spacing: 1px; font-size: 10px; opacity: 0.75; }
  .beat-title { position: absolute; left: 50%; top: 22%; transform: translateX(-50%); padding: 6px 14px; border-radius: 10px; background: #fdf8ec; color: #12152b; border: 3px solid #12152b; font-weight: 900; letter-spacing: 2px; font-size: clamp(16px, 4.5vw, 26px); white-space: nowrap; pointer-events: none; animation: title 1.4s ease-out both; }
  .the-end { position: absolute; left: 50%; top: 18%; white-space: nowrap; transform: translateX(-50%); font-weight: 900; letter-spacing: 6px; font-size: clamp(34px, 10vw, 72px); color: #fff; -webkit-text-stroke: 3px #12152b; text-shadow: 0 6px 0 #12152b; pointer-events: none; }
  .bottom { display: flex; gap: 10px; justify-content: center; padding: 14px 12px calc(16px + env(safe-area-inset-bottom)); background: #12152b; }
  button { height: 48px; padding: 0 20px; border-radius: 14px; border: 2px solid #3a4280; background: #2b3160; color: #fff; font-weight: 900; letter-spacing: 1px; cursor: pointer; }
  .primary { background: #fdf8ec; color: #12152b; border-color: #fdf8ec; min-width: 160px; }
  .primary:disabled { opacity: 0.35; cursor: default; }
  button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  @keyframes title { 0% { opacity: 0; transform: translateX(-50%) scale(0.6); } 15% { opacity: 1; transform: translateX(-50%) scale(1); } 80% { opacity: 1; } 100% { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .beat-title { animation: none; } }
</style>
