<script lang="ts">
  import { RAGE_LEVELS } from '../domain/rageLevels';
  import type { RageLevelId, Speed } from '../domain/types';
  import { allowedSpeeds } from '../flow/featureGate';
  import type { FlowSnapshot, GameFlow } from '../flow/GameFlow';
  import { gadgetFor } from '../content/gadgets';
  import { formatMoney } from './format';

  let { flow, snap, onGesture }: { flow: GameFlow; snap: FlowSnapshot; onGesture: () => void } = $props();

  const speeds = $derived(allowedSpeeds(snap.capabilities));
  const busy = $derived(snap.state !== 'READY');
  const SPEED_LABEL: Record<Speed, string> = { normal: 'NORMAL', turbo: 'TURBO', super: 'SUPER' };

  function pickLevel(id: RageLevelId) {
    onGesture();
    flow.setLevel(id);
  }

  function fire() {
    onGesture();
    flow.fire();
  }

  function fireLabel(s: FlowSnapshot): string {
    switch (s.state) {
      case 'READY': return 'FIRE!';
      case 'BET_PENDING': return '…';
      case 'ROUND_STATUS_UNKNOWN': return 'CHECKING…';
      case 'READY_GATE': return 'WAIT…';
      case 'RESUMING': return 'RESUMING';
      case 'REPLAYING': return 'REPLAY';
      case 'PRESENTING':
      case 'REVEAL': return '…';
      case 'ERROR': return 'ERROR';
      default: return s.state === 'AUTHENTICATING' || s.state === 'BOOT' ? 'LOADING' : '—';
    }
  }
</script>

<div class="hud">
  <div class="cards" role="radiogroup" aria-label="Rage Level">
    {#each RAGE_LEVELS as lv (lv.id)}
      <button
        class="card {lv.id}"
        class:selected={snap.level === lv.id}
        role="radio"
        aria-checked={snap.level === lv.id}
        disabled={busy && snap.level !== lv.id}
        data-testid="rage-{lv.id}"
        onclick={() => pickLevel(lv.id)}
      >
        <span class="name">{lv.label}</span>
        <span class="gadget">{gadgetFor(lv.id).label}</span>
        <span class="meta">{lv.volatility} · MAX x{lv.maxWin.toLocaleString('en-US')}</span>
      </button>
    {/each}
  </div>

  <div class="controls">
    {#if speeds.length > 1}
      <div class="speed" role="radiogroup" aria-label="Speed">
        {#each speeds as sp (sp)}
          <button class:on={snap.speed === sp} role="radio" aria-checked={snap.speed === sp} data-testid="speed-{sp}" onclick={() => flow.setSpeed(sp)} disabled={busy}>{SPEED_LABEL[sp]}</button>
        {/each}
      </div>
    {/if}

    <div class="bet">
      <button aria-label="Decrease bet" onclick={() => flow.stepBet(-1)} disabled={busy}>−</button>
      <div class="amount"><small>BET</small><b data-testid="bet">{formatMoney(snap.betAmount, snap.balance?.currency)}</b></div>
      <button aria-label="Increase bet" onclick={() => flow.stepBet(1)} disabled={busy}>+</button>
    </div>

    <button class="fire" data-testid="fire" disabled={!snap.canFire} onclick={fire}>{fireLabel(snap)}</button>

    {#if snap.capabilities.slamstop}
      <button class="skip" data-testid="skip" disabled={!snap.canSkip} onclick={() => flow.skip()}>SKIP ⏭</button>
    {/if}
  </div>
</div>

<style>
  .hud { display: flex; flex-direction: column; gap: 8px; padding: 8px 12px calc(10px + env(safe-area-inset-bottom)); background: #12152b; border-top: 2px solid #2b3160; }
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .card { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 8px 10px; border-radius: 12px; border: 3px solid transparent; background: #1f2447; color: #fff; text-align: left; cursor: pointer; min-width: 0; }
  .card .name { font-weight: 900; font-size: 15px; letter-spacing: 1px; }
  .card .gadget { font-size: 11px; opacity: 0.85; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .card .meta { font-size: 10px; opacity: 0.7; }
  .card.grumpy { --c: var(--grumpy); }
  .card.furious { --c: var(--furious); }
  .card.unhinged { --c: var(--unhinged); }
  .card .name { color: var(--c); }
  .card.selected { border-color: var(--c); background: color-mix(in srgb, var(--c) 22%, #1f2447); transform: translateY(-2px); }
  .card:disabled { opacity: 0.45; cursor: default; }
  .controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; }
  .speed { display: flex; border-radius: 10px; overflow: hidden; border: 2px solid #2b3160; }
  .speed button { background: #1f2447; color: #aab; border: 0; padding: 8px 8px; font-weight: 800; font-size: 11px; cursor: pointer; }
  .speed button.on { background: #2b3160; color: #fff; }
  .bet { display: flex; align-items: center; gap: 6px; background: #1f2447; border-radius: 12px; padding: 4px; }
  .bet button { width: 36px; height: 36px; border-radius: 9px; border: 0; background: #2b3160; color: #fff; font-size: 20px; font-weight: 900; cursor: pointer; }
  .amount { display: flex; flex-direction: column; align-items: center; min-width: 76px; color: #fff; }
  .amount small { font-size: 9px; opacity: 0.6; letter-spacing: 1px; }
  .fire { flex: 1 1 140px; max-width: 260px; height: 54px; border-radius: 16px; border: 0; font-size: 22px; font-weight: 900; letter-spacing: 2px; background: var(--bb-yellow); color: var(--bb-ink); box-shadow: 0 5px 0 #b38600; cursor: pointer; transition: transform 0.06s; }
  .fire:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 1px 0 #b38600; }
  .fire:disabled { background: #6b6f86; box-shadow: 0 5px 0 #4a4e63; color: #d0d2dc; cursor: default; font-size: 16px; }
  .skip { height: 44px; border-radius: 12px; border: 2px solid #2b3160; background: #1f2447; color: #fff; font-weight: 800; padding: 0 12px; cursor: pointer; }
  .skip:disabled { opacity: 0.35; }
  button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
</style>
