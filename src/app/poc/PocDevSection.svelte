<script lang="ts">
  /**
   * DEV PANEL — POC « 3 PLANS » (MOCK ONLY) : réglage ALTERNATIVE DISPLAY, triple imposé pour la prochaine manche,
   * plans choisis (collection), données du playtest A/B.
   */
  import { copyText, saveTextFile } from '../../dev/exportFile';
  import type { PocPlaytestState } from '../../dev/pocPlaytest';
  import { baseTable, type ForcedTriple } from '../../platform/rgs/mock/tripleMath';
  import { getRageLevel } from '../../domain/rageLevels';
  import type { GameContext } from '../bootstrap';
  import { ALT_DISPLAYS, ALT_LABEL, type AltDisplay } from '../pocConfig';
  import { formatX } from '../format';

  let { ctx }: { ctx: GameContext } = $props();
  const poc = $derived(ctx.poc!);

  let mode = $state<AltDisplay>('PRIVATE');
  let pt = $state<PocPlaytestState | null>(null);
  let note = $state('');
  let picks = $state<Record<string, number>>({});
  const allowed = baseTable('grumpy').rows.map((r) => r.multiplier100 / 100);
  const ladder = getRageLevel('grumpy').bossFightLadder;
  let a = $state(0);
  let b = $state(5);
  let c = $state(0);
  let rung = $state(2);

  $effect(() => poc.altDisplay.subscribe((v) => (mode = v)));
  $effect(() => poc.playtest.subscribe((s) => (pt = s)));
  $effect(() => ctx.collection?.subscribe((s) => (picks = { ...(s.gadgetPicks ?? {}) })));

  const PRESETS: { label: string; triple: ForcedTriple }[] = [
    { label: 'A x0 · B x5 · C x0', triple: { kind: 'multipliers', multipliers: [0, 5, 0] } },
    { label: 'A x2 · B x0 · C x0', triple: { kind: 'multipliers', multipliers: [2, 0, 0] } },
    { label: 'A x0 · B x0 · C x0', triple: { kind: 'multipliers', multipliers: [0, 0, 0] } },
    { label: 'A x1.2 · B x3 · C x10', triple: { kind: 'multipliers', multipliers: [1.2, 3, 10] } },
    { label: 'A x25 · B x0 · C x2', triple: { kind: 'multipliers', multipliers: [25, 0, 2] } },
  ];

  function arm(t: ForcedTriple, label: string) {
    ctx.mock?.update((s) => (s.nextForcedTriple = t));
    note = `Next plan round forced: ${label}`;
  }

  async function exportAll() {
    const json = JSON.stringify(pt, null, 2);
    if (await copyText(json)) note = 'POC playtest data copied.';
    else {
      const r = await saveTextFile('badboss-poc3-playtests-local-dev-only.json', json);
      note = r === 'saved' ? 'Saved.' : 'Copy/save unavailable here.';
    }
  }
</script>

<section data-testid="poc-dev">
  <h3>3 PLANS POC <span class="tag warn">MOCK ONLY · A2 NOT VALIDATED BY STAKE</span></h3>
  <div class="row" role="radiogroup" aria-label="Alternative display">
    <span>ALTERNATIVE DISPLAY</span>
    {#each ALT_DISPLAYS as m (m)}
      <label class:on={mode === m}>
        <input type="radio" name="altdisplay" checked={mode === m} onchange={() => poc.altDisplay.set(m)} data-testid="altdisplay-{m}" />
        {ALT_LABEL[m]}{m === 'REVEAL_ALL' ? ' (EXPERIMENTAL)' : ''}
      </label>
    {/each}
  </div>
  <div class="row">
    <span>FORCE NEXT TRIPLE</span>
    {#each PRESETS as p (p.label)}<button onclick={() => arm(p.triple, p.label)}>{p.label}</button>{/each}
  </div>
  <div class="row">
    {#each [['A', () => a, (v: number) => (a = v)], ['B', () => b, (v: number) => (b = v)], ['C', () => c, (v: number) => (c = v)]] as const as [slot, get, set] (slot)}
      <label>{slot}
        <select value={get()} onchange={(e) => set(Number((e.currentTarget as HTMLSelectElement).value))}>
          {#each allowed as m (m)}<option value={m}>{formatX(Math.round(m * 100))}</option>{/each}
        </select>
      </label>
    {/each}
    <button onclick={() => arm({ kind: 'multipliers', multipliers: [a, b, c] }, `A x${a} · B x${b} · C x${c}`)}>ARM</button>
    <label>BF rung
      <select bind:value={rung}>{#each ladder as m, i (i)}<option value={i}>x{m}</option>{/each}</select>
    </label>
    <button onclick={() => arm({ kind: 'bossFight', rung }, `BOSS FIGHT x${ladder[rung]} (common)`)}>ARM BOSS FIGHT</button>
  </div>
  <p class="small">Picks by gadget (collection): {Object.entries(picks).map(([g, n]) => `${g} ${n}`).join(' · ') || '—'}</p>
  <p class="small">A/B playtest: {pt?.study ? `running ${pt.study.id} (${pt.study.order.join(' → ')})` : 'none running'} · {pt?.history.length ?? 0} finished/aborted</p>
  <div class="row">
    <button onclick={exportAll}>COPY POC PLAYTEST DATA</button>
    {#if pt?.study}<button onclick={() => poc.playtest.abort()}>ABORT STUDY</button>{/if}
  </div>
  {#if note}<p class="small">{note}</p>{/if}
</section>

<style>
  section { padding: 8px 12px; border-bottom: 1px solid #262b52; }
  h3 { margin: 0 0 6px; font-size: 12px; letter-spacing: 1px; color: #9aa2cc; }
  .tag { font-size: 9px; padding: 1px 5px; border-radius: 5px; background: #3a2150; color: #ffb3c7; margin-left: 4px; }
  .row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 6px; font-size: 11px; }
  .row > span { opacity: 0.7; margin-right: 4px; }
  label { display: inline-flex; gap: 4px; align-items: center; padding: 2px 6px; border-radius: 6px; background: #1f2447; cursor: pointer; }
  label.on { background: #3a4280; }
  button { font-size: 11px; padding: 4px 8px; border-radius: 6px; border: 1px solid #3a4280; background: #1f2447; color: #fff; cursor: pointer; }
  select { background: #12152b; color: #fff; border: 1px solid #3a4280; border-radius: 4px; font-size: 11px; }
  .small { margin: 2px 0; font-size: 11px; opacity: 0.8; }
</style>
