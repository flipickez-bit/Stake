<script lang="ts">
  import type { Revealed } from '../flow/GameFlow';
  import { hash32 } from '../domain/seed';
  import { formatMoney, formatX } from './format';

  let { revealed, currency }: { revealed: Revealed | null; currency: string } = $props();

  const LOSS_LINES = ['B.B. dodged it.', 'Not today.', 'He didn\'t even spill his coffee.', 'Back to work.', 'Denied.'];
  const line = $derived(revealed ? LOSS_LINES[hash32(revealed.roundId) % LOSS_LINES.length] : '');
  const tone = $derived(!revealed ? '' : revealed.multiplier100 === 0 ? 'miss' : revealed.multiplier100 < 100 ? 'scrape' : revealed.multiplier100 < 500 ? 'hit' : revealed.multiplier100 < 2500 ? 'big' : 'mega');
</script>

{#if revealed}
  {#key revealed.roundId}
    <div class="pop {tone}" data-testid="result" data-multiplier={revealed.multiplier100}>
      <div class="x">{formatX(revealed.multiplier100)}</div>
      {#if revealed.multiplier100 > 0}
        <div class="win">WIN {formatMoney(revealed.payout, currency)}</div>
      {:else}
        <div class="line">{line}</div>
      {/if}
    </div>
  {/key}
{/if}

<style>
  .pop { position: absolute; left: 50%; top: 38%; transform: translate(-50%, -50%); text-align: center; pointer-events: none; animation: pop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both; }
  .x { font-size: clamp(44px, 11vw, 96px); font-weight: 900; color: #fff; -webkit-text-stroke: 3px var(--bb-ink); text-shadow: 0 6px 0 var(--bb-ink); letter-spacing: 2px; }
  .win, .line { margin-top: 4px; font-size: clamp(16px, 4vw, 26px); font-weight: 900; color: var(--bb-yellow); -webkit-text-stroke: 1px var(--bb-ink); text-shadow: 0 3px 0 var(--bb-ink); }
  .miss .x { color: #cfd3e6; font-size: clamp(36px, 9vw, 72px); }
  .miss .line { color: #fff; }
  .hit .x { color: #7cf0a0; }
  .big .x { color: var(--bb-yellow); }
  .mega .x { color: #ff6b9a; animation: wobble 0.6s ease-in-out 0.5s 2; }
  @keyframes pop { from { transform: translate(-50%, -50%) scale(0.2); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
  @keyframes wobble { 50% { transform: rotate(-4deg) scale(1.08); } }
</style>
