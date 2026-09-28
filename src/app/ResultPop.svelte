<script lang="ts">
  import type { Revealed } from '../flow/GameFlow';
  import { hash32 } from '../domain/seed';
  import { formatMoney, formatX } from './format';

  /**
   * `settled` (P3.1, mode 3 gadgets) : la manche est finie (READY) ; en paysage, le résultat remonte en haut de la scène
   * (toujours visible) et laisse le milieu aux gadgets du choix et à REVEAL OTHER PLANS.
   *
   * PALIERS DE GAIN (docs/PROPOSITION_RECOMPENSES_VISUELLES.md, proposition 4) : BIG WIN (x5 à x24,9), MEGA WIN
   * (x25 à x99,9), EPIC WIN (x100 et plus) : bannière, compteur qui défile, tempête de papiers (MEGA, EPIC), rayons
   * (EPIC). Jamais pour un retour inférieur ou égal à la mise (règle UKGC : aucune célébration d'un retour ≤ mise).
   * Affichage seulement : le montant affiché à la fin est exactement celui du book (data-multiplier ne change jamais).
   */
  let { revealed, currency, settled = false }: { revealed: Revealed | null; currency: string; settled?: boolean } = $props();

  const LOSS_LINES = ['B.B. dodged it.', 'Not today.', 'He didn\'t even spill his coffee.', 'Back to work.', 'Denied.'];
  const line = $derived(revealed ? LOSS_LINES[hash32(revealed.roundId) % LOSS_LINES.length] : '');
  const tone = $derived(!revealed ? '' : revealed.multiplier100 === 0 ? 'miss' : revealed.multiplier100 < 100 ? 'scrape' : revealed.multiplier100 < 500 ? 'hit' : revealed.multiplier100 < 2500 ? 'big' : 'mega');
  type Tier = 'big' | 'mega' | 'epic';
  const tier = $derived<Tier | null>(!revealed ? null : revealed.multiplier100 >= 10_000 ? 'epic' : revealed.multiplier100 >= 2500 ? 'mega' : revealed.multiplier100 >= 500 ? 'big' : null);
  const BANNER: Record<Tier, string> = { big: 'BIG WIN', mega: 'MEGA WIN', epic: 'EPIC WIN' };
  /** Durée du compteur (ms) : plus le gain est gros, plus il défile longtemps (jamais plus de 2,2 s). */
  const COUNT_MS: Record<Tier, number> = { big: 800, mega: 1400, epic: 2200 };

  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let k = $state(1);
  $effect(() => {
    const r = revealed;
    const t = tier;
    if (!r || !t || reduced) {
      k = 1;
      return;
    }
    k = 0;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const x = Math.min(1, (now - start) / COUNT_MS[t]);
      k = 1 - (1 - x) ** 3;
      if (x < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  });
  /** Valeurs affichées pendant le défilement (arrondies au dixième de multiplicateur) ; exactes à la fin. */
  const shownX = $derived(!revealed ? 0 : k >= 1 ? revealed.multiplier100 : Math.round((revealed.multiplier100 * k) / 10) * 10);
  const shownPay = $derived(!revealed ? 0 : k >= 1 ? revealed.payout : Math.round(revealed.payout * k));

  /** Tempête de papiers (MEGA, EPIC) : positions déterministes (hachage de la manche), jamais Math.random. */
  const papers = $derived.by(() => {
    if (!revealed || (tier !== 'mega' && tier !== 'epic') || reduced) return [];
    const n = tier === 'epic' ? 34 : 20;
    return Array.from({ length: n }, (_, i) => {
      const h = hash32(`${revealed.roundId}:${i}`);
      return { left: h % 100, delay: ((h >>> 8) % 900) / 1000, dur: 1.6 + ((h >>> 16) % 90) / 100, rot: ((h >>> 4) % 720) - 360, hue: (h >>> 12) % 3 };
    });
  });
</script>

{#if revealed}
  {#key revealed.roundId}
    {#if papers.length}
      <div class="storm" aria-hidden="true" data-testid="win-storm">
        {#each papers as p, i (i)}<i class="h{p.hue}" style="left:{p.left}%;animation-delay:{p.delay}s;animation-duration:{p.dur}s;--r:{p.rot}deg"></i>{/each}
      </div>
    {/if}
    <div class="pop {tone}" class:settled class:tiered={tier !== null} data-testid="result" data-multiplier={revealed.multiplier100} data-tier={tier ?? ''}>
      {#if tier === 'epic' && !reduced}<div class="rays" aria-hidden="true"></div>{/if}
      {#if tier}<div class="banner {tier}" data-testid="win-tier">{BANNER[tier]}</div>{/if}
      <div class="x">{formatX(shownX)}</div>
      {#if revealed.multiplier100 > 0}
        <div class="win">WIN {formatMoney(shownPay, currency)}</div>
      {:else}
        <div class="line">{line}</div>
      {/if}
    </div>
  {/key}
{/if}

<style>
  .pop { position: absolute; left: 50%; top: 38%; transform: translate(-50%, -50%); text-align: center; pointer-events: none; animation: pop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both; }
  .pop.settled { animation: settle 0.35s ease-out both; }
  @keyframes settle { from { top: 38%; transform: translate(-50%, -50%) scale(1); } to { top: 13%; transform: translate(-50%, -50%) scale(0.72); } }
  @media (prefers-reduced-motion: reduce) { .pop.settled { animation: none; top: 13%; transform: translate(-50%, -50%) scale(0.72); } }
  /* Portrait : le résultat est déjà en haut (24 %) ; il ne bouge pas. */
  @media (orientation: portrait) and (max-aspect-ratio: 4/5) { .pop { top: 24%; } .pop.settled { animation: none; top: 24%; transform: translate(-50%, -50%); } }
  .x { font-size: clamp(44px, 11vw, 96px); font-weight: 900; color: #fff; -webkit-text-stroke: 3px var(--bb-ink); text-shadow: 0 6px 0 var(--bb-ink); letter-spacing: 2px; font-variant-numeric: tabular-nums; }
  .win, .line { margin-top: 4px; font-size: clamp(16px, 4vw, 26px); font-weight: 900; color: var(--bb-yellow); -webkit-text-stroke: 1px var(--bb-ink); text-shadow: 0 3px 0 var(--bb-ink); font-variant-numeric: tabular-nums; }
  .miss .x { color: #cfd3e6; font-size: clamp(36px, 9vw, 72px); }
  .miss .line { color: #fff; }
  .hit .x { color: #7cf0a0; }
  .big .x { color: var(--bb-yellow); }
  .mega .x { color: #ff6b9a; animation: wobble 0.6s ease-in-out 0.5s 2; }
  @keyframes pop { from { transform: translate(-50%, -50%) scale(0.2); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
  @keyframes wobble { 50% { transform: rotate(-4deg) scale(1.08); } }

  /* Bannière de palier : tampon qui claque, puis respire. */
  .banner { display: inline-block; margin-bottom: 2px; padding: 3px 16px; border-radius: 12px; border: 3px solid var(--bb-ink); font-size: clamp(18px, 4.6vw, 34px); font-weight: 900; letter-spacing: 3px; color: var(--bb-ink); box-shadow: 0 5px 0 var(--bb-ink); transform: rotate(-3deg); animation: stamp 0.45s cubic-bezier(0.2, 1.8, 0.4, 1) 0.1s both, breathe 1.4s ease-in-out 0.6s infinite; }
  .banner.big { background: #7cf0a0; }
  .banner.mega { background: #ff6b9a; color: #fff; }
  .banner.epic { background: linear-gradient(90deg, #ff6b6b, #ffe66b, #6bff9e, #6bd5ff, #c56bff); background-size: 300% 100%; animation: stamp 0.45s cubic-bezier(0.2, 1.8, 0.4, 1) 0.1s both, holo 2.4s linear infinite; }
  @keyframes stamp { from { transform: rotate(-3deg) scale(3); opacity: 0; } to { transform: rotate(-3deg) scale(1); opacity: 1; } }
  @keyframes breathe { 50% { transform: rotate(-3deg) scale(1.06); } }
  @keyframes holo { to { background-position: 300% 0; } }
  .settled .banner { animation: none; }

  /* EPIC : rayons derrière le chiffre. */
  .rays { position: absolute; left: 50%; top: 50%; width: 520px; height: 520px; margin: -260px 0 0 -260px; z-index: -1; border-radius: 50%; background: repeating-conic-gradient(rgba(255, 255, 255, 0.28) 0 8deg, transparent 8deg 22deg); mask-image: radial-gradient(circle, #000 20%, transparent 70%); animation: spin 8s linear infinite; }
  .settled .rays { display: none; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* MEGA, EPIC : tempête de papiers de bureau (pas de pièces d'or). */
  .storm { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 2; }
  .storm i { position: absolute; top: -8%; width: 14px; height: 18px; border-radius: 2px; background: #fdf8ec; border: 1px solid rgba(27, 31, 59, 0.5); animation: fall 2s cubic-bezier(0.3, 0.1, 0.7, 1) both; }
  .storm i.h1 { background: #ffd3e4; }
  .storm i.h2 { background: #d5f3ff; }
  @keyframes fall { to { transform: translate3d(calc(var(--r) / 12 * 1px), 118vh, 0) rotate(var(--r)); opacity: 0.2; } }
  @media (prefers-reduced-motion: reduce) { .banner, .banner.epic { animation: none; } }
</style>
