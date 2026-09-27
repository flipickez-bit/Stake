<script lang="ts">
  /**
   * POC « 3 PLANS » : les trois gadgets SONT les boutons. Ces cibles HTML transparentes se posent sur les gadgets
   * dessinés par la scène (accessibilité, clavier, tactile) ; seule l'étiquette est visible.
   * Choix possible en READY seulement : pendant la manche, le plan est verrouillé (celui du serveur) et les
   * étiquettes disparaissent (la barre du bas rappelle « YOUR PLAN »).
   */
  import { onMount } from 'svelte';
  import type { PlanSlot } from '../../domain/plans';
  import type { FlowSnapshot, GameFlow } from '../../flow/GameFlow';
  import type { PixiStage, PlanRect } from '../../render/PixiStage';
  import { COPY, isPrototypePlan, planLabel } from './planLabels';

  let {
    flow,
    stage,
    snap,
    onPick,
  }: { flow: GameFlow; stage: PixiStage; snap: FlowSnapshot; onPick: (slot: PlanSlot, changed: boolean) => void } = $props();

  let rects = $state<PlanRect[]>([]);
  let hover = $state<PlanSlot | null>(null);
  const ready = $derived(snap.state === 'READY' && snap.plansEnabled);
  const selected = $derived(snap.plan);

  onMount(() => {
    let raf = 0;
    let key = '';
    const tick = () => {
      const next = stage.planRects();
      const k = next.map((r) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`).join('|');
      if (k !== key) {
        key = k;
        rects = next;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  });

  $effect(() => {
    // Rendu seulement : halo du plan choisi, petite animation d'attente du plan survolé.
    stage.setPlanUi({ selected: ready ? selected : null, hover: ready ? hover : null });
  });

  function pick(slot: PlanSlot) {
    const changed = selected !== slot;
    if (flow.setPlan(slot)) onPick(slot, changed);
  }
</script>

<div class="picker" class:locked={!ready} data-testid="plan-picker">
  {#each rects as r (r.slot)}
    {#if ready}
      <button
        class="plan"
        class:selected={selected === r.slot}
        style="left:{r.x}px;top:{r.y}px;width:{r.w}px;height:{r.h}px"
        disabled={!ready}
        aria-pressed={selected === r.slot}
        aria-label="Plan {r.slot}: {planLabel(snap.level, r.slot)}{selected === r.slot ? ` (${COPY.yourPlan})` : ''}"
        data-testid="plan-{r.slot}"
        onpointerenter={() => (hover = r.slot)}
        onpointerleave={() => (hover = hover === r.slot ? null : hover)}
        onfocus={() => (hover = r.slot)}
        onblur={() => (hover = hover === r.slot ? null : hover)}
        onclick={() => pick(r.slot)}
      >
        <span class="tag">
          <b>PLAN {r.slot}</b>
          <span class="name">{planLabel(snap.level, r.slot)}</span>
          {#if isPrototypePlan(snap.level, r.slot)}<i>{COPY.prototype}</i>{/if}
          {#if selected === r.slot}<em data-testid="plan-{r.slot}-mine">{COPY.yourPlan}</em>{/if}
        </span>
      </button>
    {/if}
  {/each}
</div>

<style>
  .picker { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
  .plan { position: absolute; pointer-events: auto; background: transparent; border: 0; padding: 0; cursor: pointer; border-radius: 18px; display: flex; align-items: flex-end; justify-content: center; }
  .plan:focus-visible { outline: 3px solid #e8ecff; outline-offset: -3px; }
  .locked .plan { pointer-events: none; cursor: default; }
  .tag { display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 2px 5px; max-width: 150%; transform: translateY(55%); padding: 3px 7px; border-radius: 9px; background: rgba(18, 21, 43, 0.82); color: #e8ecff; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; white-space: nowrap; border: 2px solid transparent; }
  .tag b { color: #fff; letter-spacing: 1px; }
  .tag .name { opacity: 0.85; }
  .tag i { font-style: normal; font-size: 8px; opacity: 0.6; letter-spacing: 1px; }
  .tag em { font-style: normal; font-size: 9px; background: #e8ecff; color: #1b1f3b; border-radius: 6px; padding: 0 5px; }
  .plan:hover .tag, .plan:focus-visible .tag { border-color: rgba(232, 236, 255, 0.5); }
  .selected .tag { border-color: #e8ecff; }
  .locked .tag { opacity: 0.8; }
  @media (max-width: 520px) { .tag { font-size: 9px; padding: 2px 5px; max-width: 120%; } .tag .name { flex-basis: 100%; text-align: center; font-size: 8px; } .tag i { display: none; } }
</style>
