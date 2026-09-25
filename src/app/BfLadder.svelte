<script lang="ts">
  import type { BossFightStatus } from '../presenter/Presenter';
  import { formatX } from './format';

  let { bf }: { bf: BossFightStatus } = $props();
  const rungs = $derived([...bf.rungs100].map((m, i) => ({ m, i })).reverse());
</script>

{#if bf.active}
  <div class="ladder" data-testid="bf-ladder" data-rung={bf.rung}>
    <div class="title">BOSS FIGHT</div>
    {#each rungs as r (r.i)}
      <div class="rung" class:reached={r.i <= bf.rung} class:current={r.i === bf.rung} class:ko={bf.ko && r.i === bf.rung} class:locked={bf.blocked && r.i === bf.rung}>
        {formatX(r.m)}
      </div>
    {/each}
  </div>
{/if}

<style>
  .ladder { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 3px; padding: 8px; background: rgba(18, 21, 43, 0.85); border: 2px solid var(--bb-yellow); border-radius: 12px; pointer-events: none; min-width: 78px; }
  .title { font-size: 10px; font-weight: 900; color: var(--bb-yellow); text-align: center; letter-spacing: 1px; margin-bottom: 2px; }
  .rung { font-size: 12px; font-weight: 800; color: #8088aa; text-align: center; padding: 3px 6px; border-radius: 6px; background: #1f2447; transition: all 0.2s; }
  .reached { color: #fff; background: #3b2a6a; }
  .current { background: var(--bb-yellow); color: var(--bb-ink); transform: scale(1.12); }
  .locked { background: #ff8a00; }
  .ko { background: #31d67b; animation: flash 0.3s 4; }
  @keyframes flash { 50% { filter: brightness(1.6); } }
</style>
