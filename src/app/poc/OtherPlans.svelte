<script lang="ts">
  /**
   * POC « 3 PLANS » : résultats des plans de la manche TERMINÉE (READY).
   * - ON_DEMAND : bouton « REVEAL OTHER PLANS », proposé après TOUTES les manches (perte, gain, gros gain),
   *   jamais seulement après une perte (sinon : révélation sélective) ;
   * - REVEAL_ALL (expérimental, DEV) : affiché automatiquement, de la même façon après toutes les manches.
   * Simple information : aucune animation de victoire, aucun son, aucune couleur de gain, aucun texte de regret.
   * Le wallet et le résultat de la manche ne changent évidemment jamais.
   */
  import type { Revealed } from '../../flow/GameFlow';
  import type { RageLevelId } from '../../domain/types';
  import type { AltDisplay } from '../pocConfig';
  import { formatX } from '../format';
  import { COPY, planLabel } from './planLabels';

  let {
    revealed,
    level,
    mode,
    onOpen,
  }: { revealed: Revealed; level: RageLevelId; mode: AltDisplay; onOpen: (roundId: string) => void } = $props();

  let openFor = $state<string | null>(null);
  let hiddenFor = $state<string | null>(null);
  const plans = $derived(revealed.plans ?? null);
  const open = $derived(plans !== null && hiddenFor !== revealed.roundId && (mode === 'REVEAL_ALL' || openFor === revealed.roundId));

  function reveal() {
    openFor = revealed.roundId;
    onOpen(revealed.roundId);
  }
</script>

{#if plans && mode !== 'PRIVATE'}
  <div class="dock" data-testid="other-plans-dock">
    {#if open}
      <div class="panel" role="region" aria-label="Plans of this round" data-testid="other-plans">
        <div class="row">
          {#each plans.results as r (r.slot)}
            <div class="cell" class:mine={r.slot === plans.selected} data-testid="plan-result-{r.slot}" data-multiplier={r.multiplier100}>
              <span class="who">{r.slot === plans.selected ? COPY.yourPlan : COPY.otherPlan}</span>
              <b class="slot">{r.slot}</b>
              <span class="name">{planLabel(level, r.slot)}</span>
              <span class="x">{formatX(r.multiplier100)}{#if r.bossFight}<small> · BOSS FIGHT</small>{/if}</span>
            </div>
          {/each}
        </div>
        <p class="note">{COPY.note}</p>
        <button class="hide" onclick={() => (hiddenFor = revealed.roundId)} data-testid="other-plans-hide">{COPY.hide}</button>
      </div>
    {:else if mode === 'ON_DEMAND' && hiddenFor !== revealed.roundId}
      <button class="ask" onclick={reveal} data-testid="reveal-other-plans">{COPY.reveal}</button>
    {/if}
  </div>
{/if}

<style>
  /* Paysage : en haut (le résultat est au centre) ; portrait : en bas de la scène (le résultat est en haut). */
  .dock { position: absolute; left: 50%; top: 10px; transform: translateX(-50%); z-index: 3; display: flex; justify-content: center; width: min(560px, calc(100% - 20px)); }
  @media (orientation: portrait) and (max-aspect-ratio: 4/5) { .dock { top: auto; bottom: 8px; } }
  .ask { height: 34px; padding: 0 14px; border-radius: 17px; border: 2px solid #4a5290; background: rgba(31, 36, 71, 0.92); color: #e8ecff; font-weight: 800; font-size: 12px; letter-spacing: 1px; cursor: pointer; }
  .ask:focus-visible, .hide:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  .panel { width: 100%; background: rgba(24, 28, 56, 0.95); border: 2px solid #3a4280; border-radius: 14px; padding: 8px 10px; color: #cfd3e6; display: flex; flex-direction: column; gap: 6px; }
  .row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
  .cell { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 5px 4px; border-radius: 10px; background: #232849; border: 2px solid transparent; min-width: 0; }
  .cell.mine { border-color: #cfd3e6; }
  .who { font-size: 9px; font-weight: 800; letter-spacing: 1px; opacity: 0.8; }
  .mine .who { opacity: 1; color: #fff; }
  .slot { font-size: 16px; color: #fff; }
  .name { font-size: 9px; opacity: 0.75; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  /* Même couleur neutre pour tous les multiplicateurs (aucune couleur de gain). */
  .x { font-size: 18px; font-weight: 900; color: #cfd3e6; }
  .x small { font-size: 9px; font-weight: 700; }
  .note { margin: 0; font-size: 10px; line-height: 1.3; opacity: 0.7; text-align: center; }
  .hide { align-self: center; height: 26px; padding: 0 12px; border-radius: 13px; border: 1px solid #3a4280; background: transparent; color: #cfd3e6; font-weight: 800; font-size: 11px; cursor: pointer; }
</style>
