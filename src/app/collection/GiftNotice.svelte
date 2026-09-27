<script lang="ts">
  /**
   * NOUVELLE RÉCOMPENSE (Phase 0.6) : petit cadeau sur le bouton COLLECTION, pulsation douce (1,6 s, jamais plus de
   * 3 Hz), une étincelle, une pastille avec le nombre de récompenses non vues. Marquée « vue » quand l'onglet REWARDS
   * est ouvert. Formulations : « NEW REWARD » / « REWARD UNLOCKED » uniquement (liste interdite : FORBIDDEN_PHRASES).
   * Cosmétique uniquement : aucune valeur, aucun effet sur les résultats.
   */
  import { COPY } from '../../collection/copy';

  let { count, fresh, onOpen }: { count: number; fresh: boolean; onOpen: () => void } = $props();
</script>

{#if count > 0}
  <button class="gift" onclick={onOpen} aria-label="{COPY.newReward}: {count}" title={COPY.newReward} data-testid="reward-gift">
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="5" y="13" width="22" height="15" rx="2.5" fill="#ffb3c7" stroke="#2a1b2f" stroke-width="2" />
      <rect x="3" y="9" width="26" height="6" rx="2" fill="#fff8ee" stroke="#2a1b2f" stroke-width="2" />
      <rect x="14" y="9" width="4" height="19" fill="#1d3b8f" />
      <path d="M16 9C12 3 6 4 8 8C9 10 13 9 16 9ZM16 9C20 3 26 4 24 8C23 10 19 9 16 9Z" fill="#1d3b8f" stroke="#2a1b2f" stroke-width="1.5" />
    </svg>
    <span class="spark" aria-hidden="true"></span>
    <span class="dot" data-testid="reward-count">{count}</span>
    {#if fresh}<span class="label" data-testid="reward-label">{COPY.rewardUnlocked}</span>{/if}
  </button>
{/if}

<style>
  /* Posé sur le coin du bouton COLLECTION : n'ajoute aucune largeur à la barre (écrans de 360 px). */
  .gift {
    position: absolute;
    top: -9px;
    right: -11px;
    z-index: 4;
    width: 24px;
    height: 24px;
    padding: 1px;
    border: 0;
    background: transparent;
    cursor: pointer;
    animation: pulse 1.6s ease-in-out infinite;
  }
  svg { width: 100%; height: 100%; display: block; }
  .dot {
    position: absolute;
    top: -4px;
    left: -7px;
    min-width: 15px;
    height: 15px;
    padding: 0 3px;
    border-radius: 8px;
    background: #1d3b8f;
    color: #fff8ee;
    font: 800 10px/15px system-ui, sans-serif;
    border: 1.5px solid #fff8ee;
  }
  .spark {
    position: absolute;
    left: -2px;
    top: 0;
    width: 9px;
    height: 9px;
    background: #fff8ee;
    clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
    animation: twinkle 1.6s ease-in-out infinite;
  }
  .label {
    position: absolute;
    top: 30px;
    right: -4px;
    white-space: nowrap;
    padding: 3px 7px;
    border-radius: 7px;
    background: #fff8ee;
    color: #1d3b8f;
    border: 2px solid #1d3b8f;
    font: 800 10px/1 system-ui, sans-serif;
    letter-spacing: 1px;
    animation: label 2.6s ease-out both;
    pointer-events: none;
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.07); }
  }
  @keyframes twinkle {
    0%, 55%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); }
    70% { opacity: 1; transform: scale(1) rotate(30deg); }
  }
  @keyframes label {
    0% { opacity: 0; transform: translateY(-4px); }
    10%, 80% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-2px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .gift, .spark, .label { animation: none; }
    .spark { opacity: 0.8; }
  }
</style>
