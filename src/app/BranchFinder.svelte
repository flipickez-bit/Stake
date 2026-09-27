<script lang="ts">
  /**
   * DEV PANEL — BRANCH FINDER (Mock RGS, mode 3 gadgets) : recherche parmi toutes les branches des 9 gadgets
   * (identifiant, nom de carte, gadget, Rage Level, issue, rareté). Un clic arme une VRAIE manche du Mock : le
   * prochain FIRE joue cette branche (triple imposé, plan choisi, branche imposée). Rien ne touche aux maths réelles.
   */
  import { CARD_TEXTS } from '../content/collectionCards';
  import { GADGETS } from '../content/gadgets';
  import type { BranchDef } from '../presentation/types';
  import type { GameContext } from './bootstrap';
  import { armBranch } from './devArm';

  let { ctx, ready, onArmed }: { ctx: GameContext; ready: boolean; onArmed: (msg: string) => void } = $props();

  type Kind = 'ALL' | 'LOSS' | 'WIN' | 'BIG' | 'BF';
  let query = $state('');
  let kind = $state<Kind>('ALL');
  let rare = $state(false);
  let level = $state<'all' | 'grumpy' | 'furious' | 'unhinged'>('all');

  const kindOf = (b: BranchDef): Kind =>
    b.categories.includes('BF_ENTRY') ? 'BF' : b.classes.includes('MISS') ? 'LOSS' : b.classes.includes('BIG') && !b.classes.includes('SCRAPE') ? 'BIG' : 'WIN';
  const rows = $derived(
    GADGETS.flatMap((g) => g.branches.map((b) => ({ g, b, name: CARD_TEXTS[b.id]?.name ?? b.label, kind: kindOf(b) }))).filter((r) => {
      if (level !== 'all' && r.g.rageLevel !== level) return false;
      if (kind !== 'ALL' && r.kind !== kind) return false;
      if (rare && r.b.rarity !== 'RARE' && r.b.rarity !== 'VERY_RARE') return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return [r.b.id, r.b.label, r.name, r.g.label, r.g.rageLevel, r.b.rarity, r.b.path.join(' ')].some((t) => t.toLowerCase().includes(q));
    }),
  );

  function arm(gadgetId: string, branchId: string) {
    const r = armBranch({ flow: ctx.flow, presenter: ctx.presenter, mock: ctx.mock }, gadgetId, branchId);
    onArmed(r ? `Armed ${branchId} (${r.level.toUpperCase()} · plan ${r.slot} · ${r.resultClass}). Press FIRE.` : `Cannot arm ${branchId} (READY + 3-gadget mode + Mock RGS required).`);
  }
</script>

<section class="finder" data-testid="branch-finder">
  <h3>BRANCH FINDER · {rows.length}</h3>
  <input placeholder="search: id, card, gadget, start…" bind:value={query} data-testid="finder-q" />
  <div class="chips">
    <select bind:value={level} aria-label="Rage Level">
      <option value="all">ALL LEVELS</option><option value="grumpy">GRUMPY</option><option value="furious">FURIOUS</option><option value="unhinged">UNHINGED</option>
    </select>
    <select bind:value={kind} aria-label="Outcome">
      <option value="ALL">ALL</option><option value="LOSS">LOSS</option><option value="WIN">WIN</option><option value="BIG">BIG WIN</option><option value="BF">BOSS FIGHT</option>
    </select>
    <label class="rare"><input type="checkbox" bind:checked={rare} /> RARE+</label>
  </div>
  <ul>
    {#each rows.slice(0, 60) as r (r.b.id)}
      <li>
        <button onclick={() => arm(r.g.id, r.b.id)} disabled={!ready} data-testid="finder-{r.b.id}">
          <b>{r.b.id}</b> {r.name}
          <small>{r.g.label} · {r.b.path.join(' › ')} · {r.kind} · {r.b.rarity}</small>
        </button>
      </li>
    {/each}
  </ul>
</section>

<style>
  .finder input:not([type]) { width: 100%; box-sizing: border-box; margin: 4px 0; }
  .chips { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .rare { display: flex; gap: 4px; align-items: center; font-size: 11px; }
  ul { list-style: none; margin: 6px 0 0; padding: 0; max-height: 260px; overflow: auto; }
  li button { width: 100%; text-align: left; padding: 4px 6px; margin: 1px 0; font-size: 11px; }
  li small { display: block; opacity: 0.65; font-size: 9px; }
</style>
