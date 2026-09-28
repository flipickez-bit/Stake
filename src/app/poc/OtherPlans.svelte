<script lang="ts">
  /**
   * OTHER PLANS — résultats des trois plans de la manche TERMINÉE (READY).
   *
   * P3.1 (retour utilisateur : « on ne voit pas les autres gains ») :
   * - ON-DEMAND (expérience principale) : action secondaire BIEN VISIBLE, juste sous le résultat, après TOUTES les
   *   manches (perte, x0,5, gain, gros gain) et après le vol de la carte NEW éventuelle ; elle reste jusqu'au tir suivant ;
   * - panneau : les trois plans DANS L'ORDRE DE L'ÉCRAN (de gauche à droite), YOUR PLAN marqué, valeurs exactes du book ;
   *   il reste ouvert jusqu'à un geste du joueur (fermer, REPLAY, CHOOSE ANOTHER PLAN, FIRE) ;
   * - REVEAL_ALL (PAR DÉFAUT depuis le 2026-09-28, décision utilisateur) : panneau ouvert d'office après CHAQUE manche ;
   *   ON_DEMAND et PRIVATE : réglages DEV.
   * Simple INFORMATION : aucun son, aucune animation ni couleur de gain, aucun texte de regret, aucune suggestion de plan.
   */
  import type { Revealed } from '../../flow/GameFlow';
  import type { PlanSlot } from '../../domain/plans';
  import { gadgetById } from '../../content/gadgets';
  import type { AltDisplay } from '../pocConfig';
  import { formatX } from '../format';
  import { COPY } from './planLabels';

  let {
    revealed,
    mode,
    order,
    waiting = false,
    hint = false,
    canReplay = false,
    onOpen,
    onReplay,
    onChoose,
  }: {
    revealed: Revealed;
    mode: AltDisplay;
    /** Ordre des plans à l'écran (de gauche à droite), tel que le joueur les avait devant lui. */
    order: readonly PlanSlot[];
    /** La carte NEW de la collection est en vol : l'action attend son arrivée (≤ 2,5 s). */
    waiting?: boolean;
    /** PLAYTEST #3 : indication unique après la première manche. */
    hint?: boolean;
    canReplay?: boolean;
    onOpen: (roundId: string) => void;
    onReplay: () => void;
    onChoose: () => void;
  } = $props();

  let openFor = $state<string | null>(null);
  let hiddenFor = $state<string | null>(null);
  const plans = $derived(revealed.plans ?? null);
  const open = $derived(plans !== null && hiddenFor !== revealed.roundId && (mode === 'REVEAL_ALL' || openFor === revealed.roundId));
  /** Résultats dans l'ordre de l'écran (A/B/C manquants en fin de liste : jamais perdus). */
  const cells = $derived.by(() => {
    if (!plans) return [];
    const rank = (s: PlanSlot) => (order.includes(s) ? order.indexOf(s) : 9);
    return [...plans.results].sort((a, b) => rank(a.slot) - rank(b.slot) || a.slot.localeCompare(b.slot));
  });
  const others = $derived(cells.filter((c) => c.slot !== plans?.selected).map((c) => c.slot));
  const label = (gadgetId: string, slot: PlanSlot) => gadgetById(gadgetId)?.label ?? `PLAN ${slot}`;

  function reveal() {
    openFor = revealed.roundId;
    onOpen(revealed.roundId);
  }
  function close() {
    hiddenFor = revealed.roundId;
  }
  function choose() {
    hiddenFor = revealed.roundId;
    onChoose();
  }
</script>

{#if plans && mode !== 'PRIVATE' && !waiting && hiddenFor !== revealed.roundId}
  <div class="dock" data-testid="other-plans-dock">
    {#if open}
      <div class="panel" role="region" aria-label="The three plans of this round" data-testid="other-plans">
        <div class="head">
          <span>{COPY.panelTitle}</span>
          <button class="close" onclick={close} aria-label="Close" data-testid="other-plans-hide">×</button>
        </div>
        <div class="row">
          {#each cells as r (r.slot)}
            {@const mine = r.slot === plans.selected}
            <div class="cell" class:mine data-testid="plan-result-{r.slot}" data-multiplier={r.multiplier100} data-mine={mine}>
              <span class="who">{mine ? COPY.yourPlan : COPY.otherPlan}</span>
              <b class="slot">PLAN {r.slot}</b>
              <span class="name">{label(r.gadgetId, r.slot)}</span>
              <span class="mult">{formatX(r.multiplier100)}</span>
              {#if r.bossFight}<span class="bf">BOSS FIGHT</span>{/if}
            </div>
          {/each}
        </div>
        <p class="note">{COPY.note}</p>
        <div class="actions">
          <button onclick={onReplay} disabled={!canReplay} data-testid="other-plans-replay">{COPY.replay(plans.selected)}</button>
          <button onclick={choose} data-testid="other-plans-choose">{COPY.choose}</button>
        </div>
      </div>
    {:else if mode === 'ON_DEMAND'}
      <div class="ask-wrap">
        {#if hint}<div class="hint" role="note" data-testid="other-plans-hint">{COPY.hint}</div>{/if}
        <button class="ask" onclick={reveal} data-testid="reveal-other-plans">
          <span class="cards" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="txt"><b>{COPY.reveal}</b><small>{COPY.revealSub(others)}</small></span>
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
  /*
   * Sous le résultat principal (ResultPop « posé » : 13 % de la scène en paysage, 24 % en portrait), jamais sur FIRE (HUD) ni
   * sur le bouton COLLECTION (barre du haut). Couleurs « papier et encre » du jeu : jamais l'or ni le vert d'un gain.
   */
  .dock { position: absolute; left: 50%; top: calc(13% + 46px); transform: translateX(-50%); z-index: 3; display: flex; justify-content: center; width: min(540px, calc(100% - 20px)); }
  @media (orientation: portrait) and (max-aspect-ratio: 4/5) { .dock { top: calc(24% + 52px); } }
  .ask-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ask { display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 6px 18px 6px 12px; border-radius: 14px; border: 3px solid var(--bb-ink); background: #fdf8ec; color: var(--bb-ink); box-shadow: 0 4px 0 var(--bb-ink); cursor: pointer; font: inherit; animation: rise 0.28s ease-out both; }
  .ask:hover { background: #fff; }
  .ask:active { transform: translateY(2px); box-shadow: 0 2px 0 var(--bb-ink); }
  .txt { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.15; }
  .txt b { font-size: 15px; font-weight: 900; letter-spacing: 1px; }
  .txt small { font-size: 11px; font-weight: 700; opacity: 0.75; }
  .cards { display: flex; gap: 3px; }
  .cards i { display: block; width: 11px; height: 15px; border-radius: 3px; border: 2px solid var(--bb-ink); background: #e8ecff; }
  .cards i:nth-child(2) { background: var(--bb-ink); }
  .hint { position: relative; padding: 5px 10px; border-radius: 10px; background: var(--bb-ink); color: #fdf8ec; font-size: 12px; font-weight: 800; letter-spacing: 0.3px; white-space: nowrap; animation: rise 0.35s ease-out both; }
  .hint::after { content: ''; position: absolute; left: 50%; bottom: -6px; margin-left: -6px; border: 6px solid transparent; border-bottom: 0; border-top-color: var(--bb-ink); }
  .panel { width: 100%; background: rgba(27, 31, 59, 0.97); border: 3px solid #fdf8ec; border-radius: 16px; padding: 8px 10px 10px; color: #e8ecff; display: flex; flex-direction: column; gap: 7px; box-shadow: 0 6px 0 rgba(0, 0, 0, 0.35); }
  .head { display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 900; letter-spacing: 1.5px; opacity: 0.9; }
  .close { width: 30px; height: 30px; border-radius: 15px; border: 2px solid #4a5290; background: transparent; color: #e8ecff; font-size: 18px; line-height: 1; cursor: pointer; }
  .row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }
  .cell { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 7px 4px 8px; border-radius: 12px; background: #262b52; border: 2px solid #3a4280; min-width: 0; text-align: center; }
  .cell.mine { border: 3px solid #fdf8ec; background: #2f3563; }
  .who { font-size: 9px; font-weight: 900; letter-spacing: 1px; padding: 1px 6px; border-radius: 6px; border: 1px solid #4a5290; color: #cfd3e6; }
  .mine .who { background: #fdf8ec; color: var(--bb-ink); border-color: #fdf8ec; }
  .slot { font-size: 13px; letter-spacing: 1px; color: #fff; }
  .name { font-size: 10px; font-weight: 700; opacity: 0.8; line-height: 1.2; min-height: 2.4em; overflow-wrap: anywhere; }
  /* Même couleur pour tous les multiplicateurs (x0 comme x100) : une information, jamais un gain affiché. */
  .mult { font-size: 26px; font-weight: 900; color: #e8ecff; font-variant-numeric: tabular-nums; }
  .bf { font-size: 9px; font-weight: 800; letter-spacing: 1px; opacity: 0.8; }
  .note { margin: 0; font-size: 10px; line-height: 1.3; opacity: 0.7; text-align: center; }
  .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .actions button { min-height: 38px; border-radius: 11px; border: 2px solid #cfd3e6; background: transparent; color: #fdf8ec; font-weight: 900; font-size: 12px; letter-spacing: 0.5px; cursor: pointer; padding: 0 6px; }
  .actions button:disabled { opacity: 0.4; cursor: default; }
  .ask:focus-visible, .close:focus-visible, .actions button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  @media (max-width: 400px) {
    .ask { min-height: 44px; padding: 5px 12px 5px 10px; }
    .txt b { font-size: 13px; }
    .close { width: 28px; height: 28px; font-size: 16px; }
    .cell { padding: 5px 2px 6px; }
    .mult { font-size: 22px; }
    .note { font-size: 9px; }
  }
  /* Écrans courts (360 × 640) : panneau compact, tout reste dans la scène. */
  @media (max-height: 700px) {
    .panel { padding: 5px 8px 7px; gap: 5px; }
    .head { font-size: 10px; }
    .close { width: 26px; height: 26px; font-size: 15px; }
    .cell { padding: 4px 2px 5px; gap: 1px; }
    .name { min-height: 0; font-size: 9px; }
    .mult { font-size: 20px; }
    .note { font-size: 9px; line-height: 1.2; }
    .actions button { min-height: 32px; font-size: 11px; }
  }
  @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .ask, .hint { animation: none; } }
</style>
