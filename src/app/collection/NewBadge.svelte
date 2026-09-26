<script lang="ts">
  /**
   * Badge de découverte (COLLECTION BOOK). Règles (COLLECTION_BOOK.md §B.1) :
   * - après le résultat (350 ms), visible ≈ 900 ms (1 200 ms si une récompense s'ajoute), puis retour au jeu ;
   * - ne bloque rien (aucun clic capté, FIRE toujours disponible) ;
   * - AUCUN son, AUCUNE couleur de gain : identique après une perte ou un gain (jamais une célébration de perte) ;
   * - même taille et même durée quelle que soit la rareté (pas d'escalade).
   */
  import { COPY, NEW_TITLE } from '../../collection/copy';
  import type { DiscoveryEvent } from '../../collection/types';

  let { event, showOnLoss }: { event: DiscoveryEvent | null; showOnLoss: boolean } = $props();

  let shown = $state<DiscoveryEvent | null>(null);
  let timers: ReturnType<typeof setTimeout>[] = [];

  $effect(() => {
    const e = event;
    timers.forEach(clearTimeout);
    timers = [];
    shown = null;
    if (!e || !e.isNew || (e.loss && !showOnLoss)) return;
    const hold = e.unlocked.length > 0 ? 1200 : 900;
    timers.push(setTimeout(() => (shown = e), 350));
    timers.push(setTimeout(() => (shown = null), 350 + hold));
    return () => timers.forEach(clearTimeout);
  });
</script>

{#if shown}
  {#key shown.roundId}
    <div class="sticker" data-testid="new-badge" data-card={shown.card.id} aria-live="polite">
      <div class="title">★ {NEW_TITLE[shown.card.rarity]}</div>
      <div class="name">{shown.card.name}</div>
      <div class="plus">{COPY.plusOne} · {shown.progress.discovered}/{shown.progress.total}</div>
      {#if shown.unlocked.length === 1}
        <div class="unlock" data-testid="new-badge-unlock">{COPY.unlocked(shown.unlocked[0]!.name)}</div>
      {:else if shown.unlocked.length > 1}
        <div class="unlock" data-testid="new-badge-unlock">{COPY.unlockedMany(shown.unlocked.length)}</div>
      {/if}
    </div>
  {/key}
{/if}

<style>
  .sticker {
    position: absolute;
    left: 10px;
    bottom: 12px;
    z-index: 3;
    max-width: min(62%, 260px);
    padding: 7px 11px 8px;
    background: #fdf8ec;
    color: #1d3b8f;
    border: 2px solid #1d3b8f;
    border-radius: 10px;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.25);
    transform: rotate(-3deg);
    pointer-events: none;
    font-weight: 800;
    animation: stick 0.9s ease-out both;
  }
  .sticker::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 50%;
    width: 44px;
    height: 14px;
    margin-left: -22px;
    background: rgba(200, 210, 230, 0.75);
    transform: rotate(4deg);
  }
  .title { font-size: 11px; letter-spacing: 1.5px; }
  .name { font-size: 15px; letter-spacing: 0.5px; color: #12152b; margin-top: 1px; }
  .plus { font-size: 10px; letter-spacing: 1px; opacity: 0.8; margin-top: 2px; }
  .unlock { font-size: 10px; letter-spacing: 0.5px; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #1d3b8f; }
  @keyframes stick {
    0% { transform: translateX(-24px) rotate(-8deg); opacity: 0; }
    18% { transform: translateX(0) rotate(-3deg); opacity: 1; }
    100% { transform: translateX(0) rotate(-3deg); opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) { .sticker { animation: none; } }
</style>
