<script lang="ts">
  /**
   * TROPHÉES VISIBLES : bandeau factuel de ce qui vient d'apparaître dans le bureau (après la manche, en READY).
   * Des faits seulement (« HALL OF SHAME +1 », « B.B.: BLACK EYE ») : aucun chiffre d'argent, aucune promesse,
   * aucun « presque ». Silencieux (le son neutre est joué par la scène), jamais une couleur de gain.
   */
  import { gadgetById } from '../../content/gadgets';
  import { INJURY_LABEL, TIER_NAMES, type TrophyUnlock } from '../../collection/trophies';

  let { batch }: { batch: { id: number; items: readonly TrophyUnlock[] } | null } = $props();

  const label = (g: string) => gadgetById(g)?.label ?? g.toUpperCase();
  const STAGE: Record<string, string> = {
    hallSign: 'NEW SIGN: HALL OF SHAME',
    hrBoxes: 'HR COMPLAINTS PILE UP',
    caution: 'CAUTION TAPE: DAYS WITHOUT INCIDENT 0',
    condemned: 'THE OFFICE IS CONDEMNED',
    exBoss: 'NEW NAMEPLATE: EX-BOSS',
  };

  function lines(items: readonly TrophyUnlock[]): string[] {
    const out: string[] = [];
    const photos = items.filter((u) => u.kind === 'photo').length;
    if (photos) out.push(`HALL OF SHAME +${photos}`);
    for (const u of items) {
      if (u.kind === 'scar') out.push(`THE OFFICE REMEMBERS: ${label(u.gadgetId)}`);
      else if (u.kind === 'injury') out.push(`B.B.: ${INJURY_LABEL[u.injury]}`);
      else if (u.kind === 'tier') out.push(`${label(u.gadgetId)}: ${TIER_NAMES[u.tier]}`);
      else if (u.kind === 'stage') out.push(u.stage.startsWith('full:') ? `100% ${u.stage.slice(5).toUpperCase()} PLAQUE` : (STAGE[u.stage] ?? u.stage));
    }
    return out.slice(0, 4);
  }

  let shown = $state<{ id: number; lines: string[] } | null>(null);
  $effect(() => {
    if (!batch || batch.items.length === 0) return;
    shown = { id: batch.id, lines: lines(batch.items) };
    const t = setTimeout(() => (shown = null), 3600);
    return () => clearTimeout(t);
  });
</script>

{#if shown}
  {#key shown.id}
    <div class="toast" role="status" aria-live="polite" data-testid="trophy-toast">
      {#each shown.lines as l (l)}<div class="line">{l}</div>{/each}
    </div>
  {/key}
{/if}

<style>
  .toast { position: absolute; left: 10px; top: 52px; z-index: 4; display: flex; flex-direction: column; gap: 3px; padding: 7px 11px; border-radius: 10px; background: rgba(18, 21, 43, 0.9); border: 2px solid #ff5fa2; color: #fdf8ec; font-size: 11px; font-weight: 900; letter-spacing: 0.6px; pointer-events: none; max-width: min(320px, calc(100% - 20px)); animation: in 0.3s ease-out both, out 0.4s ease-in 3.2s both; }
  .line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .line:first-child { color: #ff9fcb; }
  @keyframes in { from { transform: translateX(-20px); opacity: 0; } }
  @keyframes out { to { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .toast { animation: none; } }
  @media (max-width: 520px) { .toast { font-size: 10px; top: 48px; } }
</style>
