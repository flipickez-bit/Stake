<script lang="ts">
  /**
   * COLLECTION BOOK : album de stickers (COLLECTION_BOOK.md §B.2).
   * Des faits uniquement : « 23 / 51 discovered », « 28 to find ». Rareté cachée sur les cartes manquantes.
   * Passage à l'échelle : onglet par Rage Level → section repliable par gadget → cartes ; images générées
   * à la demande (seulement les cartes visibles) ; filtres ALL / FOUND / MISSING.
   */
  import { SECTION_LABEL } from '../../collection/catalog';
  import type { Collection } from '../../collection/Collection';
  import { COPY, RARITY_LABEL } from '../../collection/copy';
  import { COSMETICS, MILESTONES, milestoneCounter, progress as computeProgress, unlockedCosmetics } from '../../collection/rewards';
  import type { CardDef, CollectionState, CosmeticDef, SectionId } from '../../collection/types';
  import { hash32 } from '../../domain/seed';
  import type { ThumbnailRenderer } from '../../render/ThumbnailRenderer';
  import GadgetSilhouette from './GadgetSilhouette.svelte';
  import { albumTheme } from './look';

  type Tab = SectionId | 'rewards';
  let {
    collection,
    thumbs,
    initialTab,
    canPlayEpisode,
    onClose,
    onPlayEpisode,
  }: {
    collection: Collection;
    thumbs: ThumbnailRenderer;
    initialTab: Tab;
    canPlayEpisode: boolean;
    onClose: () => void;
    onPlayEpisode: () => void;
  } = $props();

  // La collection passée en prop ne change pas pendant la vie de l'album.
  // svelte-ignore state_referenced_locally
  const catalog = collection.catalog;
  // svelte-ignore state_referenced_locally
  let cs = $state<CollectionState>(collection.state);
  $effect(() => collection.subscribe((s) => (cs = s)));
  const prog = $derived(computeProgress(cs, catalog));
  // svelte-ignore state_referenced_locally
  let tab = $state<Tab>(initialTab);
  let filter = $state<'all' | 'found' | 'missing'>('all');
  let selected = $state<CardDef | null>(null);
  let images = $state<Record<string, string | null>>({});
  let collapsed = $state<Record<string, boolean>>({});

  const section = $derived(catalog.sections.find((s) => s.id === tab) ?? null);
  const theme = $derived(albumTheme(cs));
  const isFound = (id: string) => cs.entries[id] !== undefined;
  const cardsOf = (ids: readonly string[]) =>
    ids
      .map((id) => catalog.byId.get(id))
      .filter((c): c is CardDef => !!c)
      .filter((c) => filter === 'all' || (filter === 'found') === isFound(c.id));
  const tilt = (id: string) => `${(hash32(id) % 5) - 2}deg`;
  const cosmetics = COSMETICS.filter((c) => c.slot !== 'episode');
  const unlockedIds = $derived(new Set(unlockedCosmetics(cs).map((c) => c.id)));
  const episodeUnlocked = $derived(unlockedIds.has('episode.meltdown'));
  const milestoneFor = (c: CosmeticDef) => MILESTONES.find((m) => m.rewards.includes(c.id));

  function load(key: string, make: () => Promise<string | null>): void {
    if (key in images) return;
    images[key] = null;
    void make().then((url) => (images[key] = url));
  }

  /** Charge l'image quand la carte devient visible (album de 500 cartes : jamais tout d'un coup). */
  function lazy(node: HTMLElement, run: () => void) {
    if (typeof IntersectionObserver === 'undefined') {
      run();
      return {};
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        run();
        io.disconnect();
      }
    }, { rootMargin: '240px' });
    io.observe(node);
    return { destroy: () => io.disconnect() };
  }

  function toggle(c: CosmeticDef) {
    collection.equip(c.slot, cs.equipped[c.slot] === c.id ? null : c.id);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key !== 'Escape') return;
    if (selected) selected = null;
    else onClose();
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="book theme-{theme}" role="dialog" aria-modal="true" aria-labelledby="cb-title" data-testid="collection-book">
  <header>
    <button class="close" onclick={onClose} aria-label="Close" data-testid="collection-close">✕</button>
    <h2 id="cb-title">{COPY.title}</h2>
    <p class="count" data-testid="collection-progress">{COPY.discovered(prog.discovered, prog.total)} · {COPY.toFind(prog.total - prog.discovered)}</p>
  </header>

  <nav class="tabs" aria-label="Collection sections">
    {#each catalog.sections as s (s.id)}
      <button class="tab" class:on={tab === s.id} onclick={() => (tab = s.id)} data-testid="tab-{s.id}">
        <span>{SECTION_LABEL[s.id]}</span>
        <b>{prog.bySection[s.id]?.discovered ?? 0}/{s.total}</b>
      </button>
    {/each}
    <button class="tab rewards" class:on={tab === 'rewards'} onclick={() => (tab = 'rewards')} data-testid="tab-rewards">
      <span>{COPY.rewards}</span>
      <b>{Object.keys(cs.milestones).length}/{MILESTONES.length}</b>
    </button>
  </nav>

  <div class="pages">
    {#if section}
      <div class="section-head">
        <h3>{COPY.section(section.label)}</h3>
        <div class="filters" role="radiogroup" aria-label="Filter">
          {#each [['all', COPY.filterAll], ['found', COPY.filterFound], ['missing', COPY.filterMissing]] as [id, label] (id)}
            <button role="radio" aria-checked={filter === id} class:on={filter === id} onclick={() => (filter = id as typeof filter)} data-testid="filter-{id}">{label}</button>
          {/each}
        </div>
      </div>
      {#each section.gadgets as g (g.gadgetId)}
        {@const gp = prog.byGadget[`${section.id}/${g.gadgetId}`] ?? { discovered: 0, total: g.cardIds.length }}
        {@const key = `${section.id}/${g.gadgetId}`}
        <section class="gadget">
          <button class="gadget-head" onclick={() => (collapsed[key] = !collapsed[key])} aria-expanded={!collapsed[key]}>
            <span class="gname">{g.label}</span>
            <span class="gcount">{gp.discovered} / {gp.total}</span>
            <span class="bar" aria-hidden="true"><i style="width: {(100 * gp.discovered) / Math.max(1, gp.total)}%"></i></span>
          </button>
          {#if !collapsed[key]}
            <div class="grid">
              {#each cardsOf(g.cardIds) as c (c.id)}
                {#if isFound(c.id)}
                  <button class="card found" style="--tilt: {tilt(c.id)}" onclick={() => (selected = c)} data-testid="card-{c.id}" data-found="true">
                    <span class="art" use:lazy={() => load(`card:${c.id}`, () => thumbs.card(c.id))}>
                      {#if images[`card:${c.id}`]}<img src={images[`card:${c.id}`]} alt="" />{:else}<span class="art-fallback">{c.gadgetLabel}</span>{/if}
                    </span>
                    <span class="cname">{c.name}</span>
                    <span class="rarity r-{c.rarity}">{RARITY_LABEL[c.rarity]}</span>
                  </button>
                {:else}
                  <div class="card missing" data-testid="card-{c.id}" data-found="false">
                    <span class="art sil">
                      <GadgetSilhouette gadgetId={c.gadgetId} />
                      <span class="q">?</span>
                    </span>
                    <span class="cname">{COPY.missingName}</span>
                    <span class="hint">“{c.hint}”</span>
                  </div>
                {/if}
              {/each}
            </div>
          {/if}
        </section>
      {/each}
      <p class="legend"><b>{COPY.rarityHeading}</b> — {COPY.rarityLegend}</p>
    {:else}
      <section class="rewards-page">
        <h3>{COPY.milestones}</h3>
        <ul class="milestones">
          {#each MILESTONES as m (m.id)}
            {@const reached = cs.milestones[m.id] !== undefined}
            {@const counter = milestoneCounter(m.rule, prog)}
            <li class:reached data-testid="milestone-{m.id}" data-reached={reached}>
              <span class="mark" aria-hidden="true">{reached ? '✓' : '·'}</span>
              <span class="mlabel">{m.label}</span>
              <span class="mcount">{counter.current} / {counter.target}</span>
              <span class="mreward">{m.rewards.map((r) => COSMETICS.find((c) => c.id === r)?.name ?? r).join(' + ')}</span>
            </li>
          {/each}
        </ul>

        <h3>{COPY.episode}</h3>
        <div class="episode" class:locked={!episodeUnlocked} data-testid="episode-card">
          <div class="ep-title">{COPY.episodeName}</div>
          <div class="ep-note">{COPY.showcaseNote}</div>
          {#if episodeUnlocked}
            <button class="play" disabled={!canPlayEpisode} onclick={onPlayEpisode} data-testid="episode-play">{COPY.episodePlay}</button>
          {:else}
            {@const m = milestoneFor(COSMETICS.find((c) => c.id === 'episode.meltdown')!)}
            <div class="ep-lock">{COPY.locked} · {m?.label} · {m ? `${milestoneCounter(m.rule, prog).current} / ${milestoneCounter(m.rule, prog).target}` : ''}</div>
          {/if}
        </div>

        <h3>{COPY.cosmetics}</h3>
        <ul class="cosmetics">
          {#each cosmetics as c (c.id)}
            {@const open = unlockedIds.has(c.id)}
            {@const on = cs.equipped[c.slot] === c.id}
            <li class:open data-testid="cosmetic-{c.id}">
              <span class="cn">{c.name}</span>
              <span class="cd">{open ? c.description : `${COPY.locked} · ${milestoneFor(c)?.label ?? ''}`}</span>
              {#if open}
                <button class="switch" class:on role="switch" aria-checked={on} onclick={() => toggle(c)} data-testid="equip-{c.id}">{on ? COPY.on : COPY.off}</button>
              {/if}
            </li>
          {/each}
        </ul>
        <p class="legend">{COPY.cosmeticsNote}</p>
      </section>
    {/if}
  </div>

  {#if selected}
    {@const e = cs.entries[selected.id]}
    <div class="sheet-backdrop" role="presentation" onclick={() => (selected = null)}></div>
    <div class="sheet" role="dialog" aria-label={selected.name} data-testid="card-detail">
      <div class="big-art">
        {#if images[`card:${selected.id}`]}<img src={images[`card:${selected.id}`]} alt="" />{/if}
      </div>
      <div class="sheet-title">
        <h4>{selected.name}</h4>
        <span class="rarity r-{selected.rarity}">{RARITY_LABEL[selected.rarity]}</span>
      </div>
      <p class="sheet-meta">{selected.gadgetLabel} · {SECTION_LABEL[selected.level]}</p>
      <p class="blurb">“{selected.blurb}”</p>
      {#if e}
        <p class="sheet-meta">{COPY.seen(e.seen)} · {COPY.firstSeen(e.firstSeenAt.slice(0, 10))}{#if e.source === 'dev'} · <span class="dev">{COPY.devTag}</span>{/if}</p>
      {/if}
      <button class="sheet-close" onclick={() => (selected = null)} data-testid="card-detail-close">{COPY.close}</button>
    </div>
  {/if}
</div>

<style>
  .book {
    --paper: #e8d6a8;
    --paper-line: rgba(120, 90, 40, 0.12);
    --ink: #2a1f10;
    --tab: #d9c28c;
    --tab-on: #f4e7c3;
    --accent: #1d3b8f;
    --card: #fffdf6;
    position: fixed;
    inset: 0;
    z-index: 55;
    display: flex;
    flex-direction: column;
    background: var(--paper);
    background-image: linear-gradient(var(--paper-line) 1px, transparent 1px), linear-gradient(90deg, var(--paper-line) 1px, transparent 1px);
    background-size: 22px 22px;
    color: var(--ink);
    font-family: inherit;
  }
  .theme-arcade { --paper: #151633; --paper-line: rgba(90, 120, 255, 0.14); --ink: #f2f4ff; --tab: #252a5c; --tab-on: #3a3f86; --accent: #56e3ff; --card: #20244d; }
  .theme-hallofshame { --paper: #5a1422; --paper-line: rgba(255, 255, 255, 0.05); --ink: #fff3e4; --tab: #7a2033; --tab-on: #9b2c43; --accent: #ffd0a0; --card: #3d0d17; }
  header { position: relative; padding: calc(10px + env(safe-area-inset-top)) 56px 6px; text-align: center; }
  h2 { margin: 0; font-size: 18px; letter-spacing: 2px; font-weight: 900; }
  .count { margin: 2px 0 0; font-size: 13px; font-weight: 700; opacity: 0.85; }
  .close { position: absolute; right: 10px; top: calc(8px + env(safe-area-inset-top)); width: 40px; height: 40px; border-radius: 12px; border: 2px solid var(--ink); background: var(--card); color: var(--ink); font-weight: 900; cursor: pointer; }
  .tabs { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px; padding: 6px 8px 0; }
  .tab { display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 2px; padding: 6px 2px 5px; letter-spacing: 0; border: 2px solid var(--ink); border-bottom: 0; border-radius: 10px 10px 0 0; background: var(--tab); color: var(--ink); font-size: 9.5px; font-weight: 800; cursor: pointer; min-width: 0; }
  .tab span { max-width: 100%; line-height: 1.05; text-align: center; overflow-wrap: anywhere; }
  .tab b { font-size: 12px; }
  .tab.on { background: var(--tab-on); transform: translateY(1px); }
  .pages { flex: 1; overflow-y: auto; border-top: 2px solid var(--ink); padding: 10px 12px calc(24px + env(safe-area-inset-bottom)); }
  .section-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
  h3 { margin: 6px 0; font-size: 14px; letter-spacing: 1.5px; font-weight: 900; }
  .filters { display: flex; gap: 4px; }
  .filters button { padding: 4px 8px; border-radius: 999px; border: 2px solid var(--ink); background: transparent; color: var(--ink); font-size: 10px; font-weight: 800; cursor: pointer; }
  .filters button.on { background: var(--ink); color: var(--paper); }
  .gadget { margin-bottom: 14px; }
  .gadget-head { width: 100%; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 2px 8px; padding: 6px 2px; background: none; border: 0; color: var(--ink); cursor: pointer; text-align: left; }
  .gname { font-weight: 900; letter-spacing: 1px; font-size: 13px; }
  .gcount { font-weight: 900; font-size: 13px; }
  .bar { grid-column: 1 / -1; height: 6px; border-radius: 3px; background: rgba(0, 0, 0, 0.15); overflow: hidden; }
  .bar i { display: block; height: 100%; background: var(--accent); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 12px 10px; padding-top: 6px; }
  .card { display: flex; flex-direction: column; gap: 4px; padding: 5px 5px 7px; border-radius: 10px; text-align: center; transform: rotate(var(--tilt, 0deg)); min-width: 0; }
  .card.found { background: var(--card); border: 3px solid #fff; box-shadow: 0 3px 0 rgba(0, 0, 0, 0.3); color: var(--ink); cursor: pointer; font: inherit; }
  .theme-arcade .card.found, .theme-hallofshame .card.found { border-color: var(--accent); }
  .card.missing { border: 2px dashed rgba(0, 0, 0, 0.35); background: rgba(255, 255, 255, 0.12); }
  .theme-arcade .card.missing, .theme-hallofshame .card.missing { border-color: rgba(255, 255, 255, 0.3); }
  .art { position: relative; display: block; aspect-ratio: 320 / 208; border-radius: 6px; overflow: hidden; background: #1b1f3b; }
  .art img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .art-fallback { display: grid; place-items: center; height: 100%; color: #fff; font-size: 9px; font-weight: 800; padding: 4px; }
  .sil { background: rgba(0, 0, 0, 0.08); color: #000; padding: 8px 10px 6px; }
  .theme-arcade .sil, .theme-hallofshame .sil { background: rgba(255, 255, 255, 0.06); color: #fff; }
  .q { position: absolute; inset: 0; display: grid; place-items: center; font-size: 30px; font-weight: 900; color: rgba(0, 0, 0, 0.45); }
  .theme-arcade .q, .theme-hallofshame .q { color: rgba(255, 255, 255, 0.5); }
  .cname { font-size: 11px; font-weight: 900; letter-spacing: 0.5px; line-height: 1.15; word-break: break-word; }
  .hint { font-size: 10px; font-style: italic; opacity: 0.75; line-height: 1.2; }
  .rarity { align-self: center; font-size: 8.5px; font-weight: 900; letter-spacing: 1px; padding: 2px 6px; border-radius: 999px; border: 1.5px solid currentColor; }
  .r-COMMON { color: #6b6b6b; }
  .r-UNCOMMON { color: #2e7d4f; }
  .r-RARE { color: #2554c7; }
  .r-VERY_RARE { color: #8a2be2; }
  .theme-arcade .rarity, .theme-hallofshame .rarity { color: var(--accent); }
  .legend { margin: 10px 0 0; font-size: 11px; line-height: 1.4; opacity: 0.8; }
  .milestones, .cosmetics { list-style: none; margin: 0 0 12px; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .milestones li { display: grid; grid-template-columns: 18px 1fr auto; gap: 2px 6px; align-items: baseline; padding: 7px 9px; border-radius: 10px; background: rgba(255, 255, 255, 0.35); border: 2px solid transparent; }
  .theme-arcade .milestones li, .theme-hallofshame .milestones li, .theme-arcade .cosmetics li, .theme-hallofshame .cosmetics li { background: rgba(255, 255, 255, 0.07); }
  .milestones li.reached { border-color: var(--accent); }
  .mark { font-weight: 900; color: var(--accent); }
  .mlabel { font-weight: 900; font-size: 12px; letter-spacing: 0.5px; }
  .mcount { font-weight: 800; font-size: 12px; }
  .mreward { grid-column: 2 / -1; font-size: 11px; opacity: 0.8; }
  .episode { padding: 12px; border-radius: 14px; border: 3px solid var(--ink); background: var(--card); text-align: center; margin-bottom: 12px; }
  .episode.locked { border-style: dashed; opacity: 0.8; }
  .ep-title { font-weight: 900; letter-spacing: 2px; font-size: 16px; }
  .ep-note { font-size: 11px; font-weight: 800; letter-spacing: 1px; opacity: 0.75; margin: 2px 0 8px; }
  .ep-lock { font-size: 12px; font-weight: 700; }
  .play { height: 42px; padding: 0 18px; border-radius: 12px; border: 2px solid var(--ink); background: var(--accent); color: #fff; font-weight: 900; letter-spacing: 1px; cursor: pointer; }
  .play:disabled { opacity: 0.4; }
  .cosmetics li { display: grid; grid-template-columns: 1fr auto; gap: 1px 8px; align-items: center; padding: 7px 9px; border-radius: 10px; background: rgba(255, 255, 255, 0.35); opacity: 0.55; }
  .cosmetics li.open { opacity: 1; }
  .cn { font-weight: 900; font-size: 12px; }
  .cd { grid-column: 1; font-size: 11px; opacity: 0.8; }
  .switch { grid-column: 2; grid-row: 1 / span 2; min-width: 52px; height: 32px; border-radius: 999px; border: 2px solid var(--ink); background: transparent; color: var(--ink); font-weight: 900; cursor: pointer; }
  .switch.on { background: var(--accent); color: #fff; border-color: var(--accent); }
  .sheet-backdrop { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.45); }
  .sheet { position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); width: min(520px, 100%); max-height: 88%; overflow-y: auto; padding: 14px 16px calc(16px + env(safe-area-inset-bottom)); background: var(--card); color: var(--ink); border-radius: 18px 18px 0 0; border: 3px solid var(--ink); border-bottom: 0; display: flex; flex-direction: column; gap: 6px; }
  .big-art { aspect-ratio: 320 / 208; border-radius: 10px; overflow: hidden; background: #1b1f3b; }
  .big-art img { width: 100%; height: 100%; display: block; object-fit: cover; }
  .sheet-title { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  h4 { margin: 0; font-size: 18px; font-weight: 900; letter-spacing: 1px; }
  .sheet-meta { margin: 0; font-size: 12px; font-weight: 700; opacity: 0.8; }
  .blurb { margin: 2px 0; font-size: 14px; line-height: 1.4; }
  .dev { background: #5b2a86; color: #fff; padding: 0 5px; border-radius: 4px; font-size: 10px; }
  .sheet-close { margin-top: 4px; height: 42px; border-radius: 12px; border: 2px solid var(--ink); background: var(--tab-on); color: var(--ink); font-weight: 900; cursor: pointer; }
  button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  @media (min-width: 760px) {
    .pages { padding-left: max(12px, calc(50% - 380px)); padding-right: max(12px, calc(50% - 380px)); }
    .tabs { padding-left: max(8px, calc(50% - 380px)); padding-right: max(8px, calc(50% - 380px)); }
  }
</style>
