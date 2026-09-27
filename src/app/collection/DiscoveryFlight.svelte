<script lang="ts">
  /**
   * NEW DISCOVERY (Phase 0.6) — remplace le badge fixe de la Phase 0.5C, mêmes règles (COLLECTION_BOOK.md §B.1) :
   * résultat → pause (350 ms) → la carte NEW apparaît → elle rétrécit et vole jusqu'au bouton COLLECTION → le bouton
   * réagit et le compteur passe à +1 (≈ 1,5 s au total, 1,8 s si une récompense s'ajoute).
   * - Couleurs de la collection (papier, encre bleue) : JAMAIS l'or, les pièces ou le vert d'un gain ;
   * - aucun son ; même taille et même durée quelle que soit la rareté (pas d'escalade) ;
   * - ne bloque rien (aucun clic capté, FIRE reste disponible) ;
   * - mouvement réduit : la carte apparaît puis s'efface sur place.
   */
  import { COPY, NEW_TITLE } from '../../collection/copy';
  import type { DiscoveryEvent } from '../../collection/types';
  import GadgetSilhouette from './GadgetSilhouette.svelte';

  let {
    event,
    showOnLoss,
    target,
    onArrive,
  }: {
    event: DiscoveryEvent | null;
    showOnLoss: boolean;
    /** Rectangle du bouton COLLECTION (cible du vol), ou null s'il n'est pas affiché. */
    target: () => DOMRect | null;
    /** La carte est arrivée (ou a été annulée) : le compteur affiché peut avancer. */
    onArrive: (roundId: string) => void;
  } = $props();

  const TIMING = { delay: 350, pop: 200, hold: 520, holdUnlock: 780, fly: 460 } as const;

  let shown = $state<DiscoveryEvent | null>(null);
  let card = $state<HTMLDivElement | null>(null);
  let flying = $state(false);
  let timers: ReturnType<typeof setTimeout>[] = [];
  let anim: Animation | null = null;

  const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function finish(e: DiscoveryEvent) {
    anim?.cancel();
    anim = null;
    flying = false;
    if (shown?.roundId === e.roundId) shown = null;
    onArrive(e.roundId);
  }

  function fly(e: DiscoveryEvent) {
    const el = card;
    const to = target();
    if (!el || !to || reduced() || typeof el.animate !== 'function') {
      finish(e);
      return;
    }
    const from = el.getBoundingClientRect();
    // Le vol passe au-dessus de la scène (position fixe : la scène coupe ses débordements).
    Object.assign(el.style, { position: 'fixed', left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, bottom: 'auto', margin: '0' });
    flying = true;
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const s = Math.max(0.12, Math.min(0.4, to.height / from.height));
    anim = el.animate(
      [
        { transform: 'translate(0, 0) scale(1) rotate(-3deg)', opacity: 1 },
        { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 40}px) scale(0.7) rotate(-9deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(0deg)`, opacity: 0.25 },
      ],
      { duration: TIMING.fly, easing: 'cubic-bezier(0.45, 0, 0.75, 0.35)', fill: 'forwards' },
    );
    anim.onfinish = () => finish(e);
  }

  $effect(() => {
    const e = event;
    timers.forEach(clearTimeout);
    timers = [];
    anim?.cancel();
    anim = null;
    flying = false;
    shown = null;
    if (!e || !e.isNew || (e.loss && !showOnLoss)) return;
    const hold = e.unlocked.length > 0 ? TIMING.holdUnlock : TIMING.hold;
    timers.push(setTimeout(() => (shown = e), TIMING.delay));
    timers.push(setTimeout(() => fly(e), TIMING.delay + TIMING.pop + hold));
    // Filet de sécurité : le compteur n'attend jamais plus de 2,5 s.
    timers.push(setTimeout(() => finish(e), 2500));
    return () => {
      timers.forEach(clearTimeout);
      anim?.cancel();
    };
  });
</script>

{#if shown}
  {#key shown.roundId}
    <div class="card" class:flying bind:this={card} data-testid="new-badge" data-card={shown.card.id} aria-live="polite">
      <div class="art"><GadgetSilhouette gadgetId={shown.card.gadgetId} /></div>
      <div class="text">
        <div class="title">★ {NEW_TITLE[shown.card.rarity]}</div>
        <div class="name">{shown.card.name}</div>
        <div class="plus">{COPY.plusOne} · {shown.progress.discovered}/{shown.progress.total}</div>
        {#if shown.unlocked.length === 1}
          <div class="unlock" data-testid="new-badge-unlock">{COPY.unlocked(shown.unlocked[0]!.name)}</div>
        {:else if shown.unlocked.length > 1}
          <div class="unlock" data-testid="new-badge-unlock">{COPY.unlockedMany(shown.unlocked.length)}</div>
        {/if}
      </div>
    </div>
  {/key}
{/if}

<style>
  .card {
    position: absolute;
    left: 10px;
    bottom: 12px;
    z-index: 6;
    display: flex;
    gap: 8px;
    align-items: center;
    max-width: min(78%, 290px);
    padding: 7px 11px 8px 8px;
    background: #fff8ee;
    color: #1d3b8f;
    border: 2.5px solid #1d3b8f;
    border-radius: 10px;
    box-shadow: 0 3px 0 rgba(42, 27, 47, 0.35);
    transform: rotate(-3deg);
    transform-origin: 50% 50%;
    pointer-events: none;
    font-weight: 800;
    animation: pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  .card::before {
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
  .card.flying { animation: none; }
  .art { flex: 0 0 auto; width: 52px; height: 36px; background: #e9dcca; border: 2px solid #1d3b8f; border-radius: 6px; padding: 2px; }
  .art :global(svg) { width: 100%; height: 100%; fill: #1d3b8f; }
  .title { font-size: 11px; letter-spacing: 1.5px; }
  .name { font-size: 15px; letter-spacing: 0.5px; color: #2a1b2f; margin-top: 1px; }
  .plus { font-size: 10px; letter-spacing: 1px; opacity: 0.8; margin-top: 2px; }
  .unlock { font-size: 10px; letter-spacing: 0.5px; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #1d3b8f; }
  @keyframes pop {
    0% { transform: scale(0.6) rotate(-8deg); opacity: 0; }
    70% { transform: scale(1.04) rotate(-2deg); opacity: 1; }
    100% { transform: scale(1) rotate(-3deg); opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) { .card { animation: none; } }
</style>
