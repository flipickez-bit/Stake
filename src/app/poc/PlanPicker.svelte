<script lang="ts">
  /**
   * POC « 3 PLANS » : les trois gadgets SONT les boutons. Ces cibles HTML transparentes se posent sur les gadgets
   * dessinés par la scène (accessibilité, clavier, tactile) ; seule l'étiquette est visible.
   * Choix possible en READY seulement : pendant la manche, le plan est verrouillé (celui du serveur) et les
   * étiquettes disparaissent (la barre du bas rappelle « YOUR PLAN »).
   */
  import { onMount, untrack } from 'svelte';
  import type { PlanSlot } from '../../domain/plans';
  import type { FlowSnapshot, GameFlow } from '../../flow/GameFlow';
  import type { PixiStage, PlanRect } from '../../render/PixiStage';
  import { COPY, isPrototypePlan, planLabel } from './planLabels';
  import { planGadgetId } from '../../domain/plans';

  let {
    flow,
    stage,
    snap,
    onPick,
    found = null,
    attention = 0,
    tierOf = null,
  }: {
    flow: GameFlow;
    stage: PixiStage;
    snap: FlowSnapshot;
    onPick: (slot: PlanSlot, changed: boolean) => void;
    /** COLLECTION : animations découvertes par gadget (des faits : « 6 / 16 »), null si la collection est désactivée. */
    found?: ((gadgetId: string) => { discovered: number; total: number } | null) | null;
    /** « CHOOSE ANOTHER PLAN » : chaque changement fait brièvement pulser les TROIS étiquettes (aucune n'est mise en avant). */
    attention?: number;
    /** GADGETS DE LÉGENDE : niveau cosmétique de chaque gadget (0 = STANDARD, rien d'affiché). Ne change aucun résultat. */
    tierOf?: ((gadgetId: string) => 0 | 1 | 2 | 3) | null;
  } = $props();
  const TIER_LABEL = ['', 'TUNED', 'NEON', 'LEGENDARY'] as const;

  let pulsing = $state(false);
  $effect(() => {
    if (attention <= 0) return;
    pulsing = true;
    const t = setTimeout(() => (pulsing = false), 1600);
    return () => clearTimeout(t);
  });

  let rects = $state<PlanRect[]>([]);
  let width = $state(0);
  /** L'étiquette reste dans l'écran : alignée à gauche ou à droite près des bords (téléphone). */
  const align = (r: PlanRect) => (r.x + r.w / 2 < 80 ? 'start' : r.x + r.w / 2 > width - 80 ? 'end' : 'center');
  /** Décalage horizontal de l'étiquette si la zone du gadget déborde de l'écran. */
  const dx = (r: PlanRect) => (align(r) === 'end' ? Math.min(0, width - 4 - (r.x + r.w)) : align(r) === 'start' ? Math.max(0, 4 - r.x) : 0);
  /**
   * Étiquettes qui se chevauchent (petit téléphone, gadgets proches) : mesurées dans le DOM puis écartées
   * horizontalement ; si l'écran est trop étroit, la plus à droite monte d'un cran. Rendu seulement.
   */
  const tags: Partial<Record<PlanSlot, HTMLElement>> = {};
  let nudge = $state<Partial<Record<PlanSlot, { x: number; y: number }>>>({});
  $effect(() => {
    void rects;
    void width;
    void snap.plan;
    void snap.level;
    const raf = requestAnimationFrame(() => {
      const prev = untrack(() => nudge);
      const boxes = (Object.keys(tags) as PlanSlot[])
        .filter((slot) => rects.some((r) => r.slot === slot) && tags[slot]?.isConnected)
        .map((slot) => {
          const b = tags[slot]!.getBoundingClientRect();
          const n = prev[slot] ?? { x: 0, y: 0 };
          return { slot, left: b.left - n.x, right: b.right - n.x, top: b.top - n.y, bottom: b.bottom - n.y };
        })
        .sort((a, b) => a.left - b.left);
      const next: Partial<Record<PlanSlot, { x: number; y: number }>> = {};
      for (const b of boxes) next[b.slot] = { x: 0, y: 0 };
      const host = tags[boxes[0]?.slot ?? 'A']?.closest('.picker')?.getBoundingClientRect();
      const minX = (host?.left ?? 0) + 2;
      const maxX = (host?.right ?? width) - 2;
      for (let i = 0; i + 1 < boxes.length; i++) {
        const a = boxes[i]!;
        const b = boxes[i + 1]!;
        const na = next[a.slot]!;
        const nb = next[b.slot]!;
        const vertical = a.top + na.y < b.bottom + nb.y && a.bottom + na.y > b.top + nb.y;
        const overlap = a.right + na.x + 4 - (b.left + nb.x);
        if (!vertical || overlap <= 0) continue;
        const left = Math.min(overlap / 2, a.left + na.x - minX);
        const right = Math.min(overlap - Math.max(0, left), maxX - (b.right + nb.x));
        na.x -= Math.max(0, left);
        nb.x += Math.max(0, right);
        if (a.right + na.x + 4 - (b.left + nb.x) > 0) nb.y -= b.bottom - b.top + 4;
      }
      const same = boxes.every((b) => prev[b.slot]?.x === next[b.slot]!.x && prev[b.slot]?.y === next[b.slot]!.y);
      if (!same) nudge = next;
    });
    return () => cancelAnimationFrame(raf);
  });
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

<div class="picker" class:locked={!ready} class:pulsing data-testid="plan-picker" data-attention={pulsing} bind:clientWidth={width}>
  {#each rects as r (r.slot)}
    {#if ready}
      <button
        class="plan"
        class:selected={selected === r.slot}
        style="left:{r.x}px;top:{r.y}px;width:{r.w}px;height:{r.h}px;justify-content:{align(r) === 'center' ? 'center' : `flex-${align(r)}`}"
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
        <span class="tag" bind:this={tags[r.slot]} style="--dx:{dx(r) + (nudge[r.slot]?.x ?? 0)}px;--dy:{nudge[r.slot]?.y ?? 0}px">
          <b>PLAN {r.slot}</b>
          <span class="name">{planLabel(snap.level, r.slot)}</span>
          {#if isPrototypePlan(snap.level, r.slot)}<i>{COPY.prototype}</i>{/if}
          {#if found}
            {@const f = found(planGadgetId(snap.level, r.slot) ?? '')}
            {#if f}<i class="found" data-testid="plan-{r.slot}-found">{f.discovered} / {f.total}</i>{/if}
          {/if}
          {#if tierOf}
            {@const t = tierOf(planGadgetId(snap.level, r.slot) ?? '')}
            {#if t > 0}<span class="tier t{t}" data-testid="plan-{r.slot}-tier">{TIER_LABEL[t]}</span>{/if}
          {/if}
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
  .tag { display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 2px 5px; max-width: 150%; transform: translate(var(--dx, 0px), calc(55% + var(--dy, 0px))); padding: 3px 7px; border-radius: 9px; background: rgba(18, 21, 43, 0.82); color: #e8ecff; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; white-space: nowrap; border: 2px solid transparent; }
  .tag b { color: #fff; letter-spacing: 1px; }
  .tag .name { opacity: 0.85; }
  .tag i { font-style: normal; font-size: 8px; opacity: 0.6; letter-spacing: 1px; }
  .tag i.found { opacity: 0.75; font-variant-numeric: tabular-nums; }
  .tag em { font-style: normal; font-size: 9px; background: #e8ecff; color: #1b1f3b; border-radius: 6px; padding: 0 5px; }
  .plan:hover .tag, .plan:focus-visible .tag { border-color: rgba(232, 236, 255, 0.5); }
  .selected .tag { border-color: #e8ecff; }
  .pulsing .tag { animation: attn 0.8s ease-in-out 2; }
  @keyframes attn { 50% { border-color: #fdf8ec; box-shadow: 0 0 0 4px rgba(253, 248, 236, 0.35); } }
  @media (prefers-reduced-motion: reduce) { .pulsing .tag { animation: none; border-color: #fdf8ec; } }
  .locked .tag { opacity: 0.8; }
  /* Niveaux des gadgets (cosmétiques) : chrome, néon, holographique — jamais l'or du BOSS FIGHT. */
  .tier { font-size: 8px; letter-spacing: 1px; padding: 0 5px; border-radius: 6px; color: #12152b; }
  .tier.t1 { background: linear-gradient(90deg, #dfe9f5, #9fb4cc); }
  .tier.t2 { background: linear-gradient(90deg, #ff4fd8, #4ff0ff); }
  .tier.t3 { background: linear-gradient(90deg, #ff6b6b, #ffe66b, #6bff9e, #6bd5ff, #c56bff); background-size: 300% 100%; animation: holo 3s linear infinite; }
  @keyframes holo { to { background-position: 300% 0; } }
  @media (prefers-reduced-motion: reduce) { .tier.t3 { animation: none; } }
  @media (max-width: 520px) { .tag { font-size: 9px; padding: 2px 5px; max-width: none; } .tag .name { flex-basis: 100%; text-align: center; font-size: 8px; } .tag i { display: none; } }
</style>
