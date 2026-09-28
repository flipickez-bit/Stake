<script lang="ts">
  /**
   * HUD du BOSS FIGHT = TOURS GRATUITS : compteur FREE ROUND n/8, RAGE xN (monte après chaque HIT), cumul des gains.
   * Tout vient des signaux de la séquence (Presenter) : l'affichage n'est jamais en avance sur l'image.
   * Le total affiché pendant les tours est le cumul déjà touché ; le résultat final reste révélé par ResultPop.
   */
  import type { BossFightStatus } from '../presenter/Presenter';
  import { formatX } from './format';

  let { bf }: { bf: BossFightStatus } = $props();
  const pips = $derived(Array.from({ length: bf.freeRounds }, (_, i) => i + 1));
</script>

{#if bf.active}
  <div class="hud" data-testid="bf-hud" data-round={bf.round} data-rage={bf.rage} data-total={bf.total100}>
    <div class="title">BOSS FIGHT</div>
    <div class="sub">FREE ROUNDS</div>
    <div class="count" data-testid="bf-round">{bf.round > 0 ? bf.round : '—'}<small>/{bf.freeRounds}</small></div>
    <div class="pips" aria-hidden="true">
      {#each pips as p (p)}<i class:done={p < bf.round || (p === bf.round && bf.last !== null)} class:now={p === bf.round && bf.last === null}></i>{/each}
    </div>
    <div class="rage" data-testid="bf-rage" style="--heat:{Math.min(bf.rage, 8)}">RAGE <b>x{bf.rage}</b></div>
    <div class="total" data-testid="bf-total">{formatX(bf.total100)}</div>
    {#key `${bf.round}-${bf.last}`}
      {#if bf.last === 'HIT'}<div class="pop hit" data-testid="bf-last">+{formatX(bf.lastWin100)}</div>
      {:else if bf.last === 'BLOCKED'}<div class="pop blocked" data-testid="bf-last">BLOCKED</div>{/if}
    {/key}
    {#if bf.wincap}<div class="cap">MAX WIN</div>{/if}
  </div>
{/if}

<style>
  .hud { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 8px 10px; background: rgba(18, 21, 43, 0.88); border: 2px solid var(--bb-yellow); border-radius: 12px; pointer-events: none; min-width: 92px; color: #fff; }
  .title { font-size: 10px; font-weight: 900; color: var(--bb-yellow); letter-spacing: 1px; }
  .sub { font-size: 9px; font-weight: 800; letter-spacing: 1px; opacity: 0.75; }
  .count { font-size: 26px; font-weight: 900; line-height: 1; }
  .count small { font-size: 12px; opacity: 0.7; }
  .pips { display: flex; gap: 3px; margin: 2px 0; }
  .pips i { width: 7px; height: 7px; border-radius: 50%; background: #2c3160; }
  .pips i.done { background: #8088aa; }
  .pips i.now { background: var(--bb-yellow); }
  .rage { font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px; background: color-mix(in srgb, #ff3b30 calc(var(--heat) * 11%), #3b2a6a); }
  .rage b { font-size: 14px; }
  .total { font-size: 16px; font-weight: 900; color: var(--bb-yellow); }
  .pop { font-size: 13px; font-weight: 900; animation: pop 0.5s ease-out both; }
  .pop.hit { color: #31d67b; }
  .pop.blocked { color: #ff8a00; }
  .cap { font-size: 10px; font-weight: 900; color: var(--bb-ink); background: #31d67b; padding: 1px 6px; border-radius: 5px; }
  @keyframes pop { from { transform: scale(1.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @media (orientation: portrait) and (max-aspect-ratio: 4/5) {
    .hud { right: 6px; top: 44%; min-width: 74px; padding: 5px 6px; gap: 2px; }
    .count { font-size: 20px; }
    .pips i { width: 5px; height: 5px; }
  }
</style>
