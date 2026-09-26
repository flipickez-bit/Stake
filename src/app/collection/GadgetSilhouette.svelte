<script lang="ts">
  /**
   * Silhouette d'une carte MANQUANTE : la même pour toutes les cartes d'un gadget, donc aucune information
   * sur l'animation (ni l'issue, ni la rareté). Un nouveau gadget sans forme dédiée reçoit la forme générique.
   */
  let { gadgetId }: { gadgetId: string } = $props();
</script>

<svg viewBox="0 0 160 104" aria-hidden="true" focusable="false">
  {#if gadgetId === 'swivel-slingshot'}
    <rect x="40" y="58" width="10" height="38" rx="3" />
    <polygon points="40,62 22,22 31,18 50,58" />
    <polygon points="50,62 68,22 59,18 40,58" />
    <rect x="28" y="94" width="34" height="6" rx="2" />
    <g transform="translate(26 0)">
      <circle cx="94" cy="36" r="14" />
      <polygon points="84,24 90,8 95,20 102,4 104,24" />
      <rect x="76" y="50" width="36" height="42" rx="12" />
      <rect x="70" y="90" width="48" height="8" rx="3" />
    </g>
  {:else if gadgetId === 'trapdoor-express'}
    <ellipse cx="72" cy="94" rx="46" ry="8" />
    <circle cx="72" cy="28" r="14" />
    <polygon points="62,16 68,0 73,12 80,-4 82,16" />
    <rect x="54" y="42" width="36" height="44" rx="12" />
    <rect x="134" y="54" width="7" height="44" rx="3" transform="rotate(20 137 98)" />
    <circle cx="150" cy="56" r="7" />
  {:else if gadgetId === 'office-rocket'}
    <rect x="24" y="66" width="100" height="22" rx="11" />
    <polygon points="122,66 150,77 122,88" />
    <polygon points="30,66 14,54 42,66" />
    <polygon points="30,88 14,100 42,88" />
    <circle cx="74" cy="26" r="14" />
    <polygon points="64,14 70,-2 75,10 82,-6 84,14" />
    <rect x="56" y="40" width="36" height="28" rx="12" />
  {:else}
    <circle cx="80" cy="34" r="16" />
    <rect x="60" y="52" width="40" height="44" rx="14" />
  {/if}
</svg>

<style>
  svg { width: 100%; height: 100%; fill: currentColor; opacity: 0.28; }
</style>
