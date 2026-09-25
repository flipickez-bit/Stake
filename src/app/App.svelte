<script lang="ts">
  import { onMount } from 'svelte';
  import type { FlowSnapshot } from '../flow/GameFlow';
  import type { BossFightStatus } from '../presenter/Presenter';
  import { bootstrap, type GameContext } from './bootstrap';
  import BfLadder from './BfLadder.svelte';
  import DevPanel from './DevPanel.svelte';
  import Hud from './Hud.svelte';
  import ResultPop from './ResultPop.svelte';
  import { formatBalance } from './format';

  let host: HTMLDivElement;
  let ctx = $state<GameContext | null>(null);
  let snap = $state<FlowSnapshot | null>(null);
  let bf = $state<BossFightStatus>({ active: false, rungs100: [], rung: -1, blocked: false, ko: false });
  let devOpen = $state(false);
  let muted = $state(false);
  let bootError = $state<string | null>(null);

  onMount(() => {
    let off: (() => void)[] = [];
    bootstrap(host)
      .then((c) => {
        ctx = c;
        devOpen = c.devEnabled && new URL(location.href).searchParams.get('dev') === '1';
        off.push(c.flow.subscribe((s) => (snap = s)));
        off.push(c.presenter.onSignalEvent(() => (bf = c.presenter.status.bossFight)));
        off.push(c.flow.subscribe((s) => { if (s.state === 'READY' || s.state === 'BET_PENDING') bf = c.presenter.status.bossFight; }));
      })
      .catch((e) => (bootError = e instanceof Error ? e.message : String(e)));
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || !ctx || !snap?.capabilities.spacebar) return;
      if ((e.target as HTMLElement)?.closest('input, select, textarea, .dev')) return;
      e.preventDefault();
      gesture();
      if (snap.canFire) ctx.flow.fire();
      else if (snap.canSkip) ctx.flow.skip();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      off.forEach((f) => f());
      window.removeEventListener('keydown', onKey);
    };
  });

  function gesture() {
    ctx?.audio.unlock();
  }

  function toggleMute() {
    gesture();
    muted = !muted;
    ctx?.audio.setMuted(muted);
  }

  const banner = $derived.by(() => {
    if (!snap) return null;
    if (snap.state === 'ROUND_STATUS_UNKNOWN' && snap.message?.kind !== 'error') {
      return { kind: 'warning', text: `${snap.message?.text ?? 'Checking your round…'} (attempt ${snap.resyncAttempts})` };
    }
    return snap.message;
  });
</script>

<div class="game" onpointerdown={gesture} role="presentation">
  <div class="topbar">
    <span class="title">BAD BOSS <small>WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED · PHASE 0</small></span>
    <span class="balance" data-testid="balance">{formatBalance(snap?.balance ?? null)}</span>
    <button class="icon" onclick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? '🔇' : '🔊'}</button>
    {#if ctx?.devEnabled}<button class="icon dev" onclick={() => (devOpen = !devOpen)} data-testid="dev-toggle">DEV</button>{/if}
  </div>

  <div class="stage">
    <div class="canvas-host" bind:this={host}></div>
    {#if banner}
      <div class="banner {banner.kind}" data-testid="banner">
        <span>{banner.text}</span>
        {#if snap?.retryAvailable}<button onclick={() => ctx?.flow.retry()} data-testid="retry">RETRY</button>{/if}
      </div>
    {/if}
    {#if snap?.state === 'RESUMING' || snap?.state === 'REPLAYING'}
      <div class="badge" data-testid="mode-badge">{snap.state === 'RESUMING' ? 'RESUMED ROUND' : 'REPLAY · NO BET'}</div>
    {/if}
    <ResultPop revealed={snap?.revealed ?? null} currency={snap?.balance?.currency ?? 'USD'} />
    <BfLadder {bf} />
    {#if bootError}<div class="banner error">Boot failed: {bootError}</div>{/if}
    {#if snap?.capabilities.displayRtp}<div class="rtp">RTP 96.50% (provisional)</div>{/if}
  </div>

  {#if ctx && snap}
    <Hud flow={ctx.flow} {snap} onGesture={gesture} />
  {/if}
</div>

{#if ctx && snap && devOpen}
  <DevPanel {ctx} {snap} onClose={() => (devOpen = false)} />
{/if}

<style>
  .game { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; grid-template-columns: minmax(0, 1fr); height: 100%; width: 100%; overflow: hidden; }
  .topbar { display: flex; align-items: center; gap: 10px; padding: 6px 12px; padding-top: calc(6px + env(safe-area-inset-top)); background: #12152b; border-bottom: 2px solid #2b3160; color: #fff; }
  .title { flex: 1; font-weight: 900; letter-spacing: 2px; font-size: 15px; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .title small { font-weight: 700; letter-spacing: 0; font-size: 9px; opacity: 0.55; margin-left: 6px; }
  @media (max-width: 520px) { .title small { display: block; margin-left: 0; font-size: 8px; } .title { font-size: 13px; } }
  .balance { font-weight: 900; color: var(--bb-yellow); font-size: 15px; }
  .icon { background: #1f2447; border: 1px solid #2b3160; color: #fff; border-radius: 8px; padding: 4px 8px; cursor: pointer; font-weight: 800; }
  .icon.dev { background: var(--bb-violet); }
  .stage { position: relative; min-height: 0; overflow: hidden; }
  .canvas-host { position: absolute; inset: 0; }
  .canvas-host :global(canvas) { display: block; width: 100%; height: 100%; }
  .banner { position: absolute; left: 50%; top: 10px; transform: translateX(-50%); max-width: min(92%, 560px); display: flex; gap: 10px; align-items: center; padding: 8px 12px; border-radius: 10px; font-weight: 700; font-size: 13px; color: #1b1f3b; background: #e8ecff; box-shadow: 0 4px 0 rgba(0, 0, 0, 0.25); z-index: 2; }
  .banner.warning { background: #ffd08a; }
  .banner.error { background: #ff8fa0; }
  .banner button { background: #1b1f3b; color: #fff; border: 0; border-radius: 8px; padding: 6px 10px; font-weight: 900; cursor: pointer; }
  .badge { position: absolute; left: 10px; bottom: 10px; background: var(--bb-violet); color: #fff; font-weight: 900; font-size: 11px; letter-spacing: 1px; padding: 4px 8px; border-radius: 8px; }
  .rtp { position: absolute; right: 10px; bottom: 8px; font-size: 11px; color: #fff; opacity: 0.7; }
</style>
