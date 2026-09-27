<script lang="ts">
  import { onMount } from 'svelte';
  import type { FlowSnapshot } from '../flow/GameFlow';
  import type { BossFightStatus } from '../presenter/Presenter';
  import { bootstrap, type GameContext } from './bootstrap';
  import BfLadder from './BfLadder.svelte';
  import DevPanel from './DevPanel.svelte';
  import Hud from './Hud.svelte';
  import ResultPop from './ResultPop.svelte';
  import PlaytestIntro from './PlaytestIntro.svelte';
  import PlaytestResults from './PlaytestResults.svelte';
  import Questionnaire from './Questionnaire.svelte';
  import { formatBalance } from './format';
  import { PLAYTEST_TARGET, type PlaytestAnswers, type PlaytestState } from '../dev/playtest';
  import { makeBossFightPreview } from '../dev/devOutcomes';
  import { cryptoRandom } from '../platform/rgs/mock/mockMath';
  import CollectionBook from './collection/CollectionBook.svelte';
  import DiscoveryFlight from './collection/DiscoveryFlight.svelte';
  import GiftNotice from './collection/GiftNotice.svelte';
  import ShowcaseOverlay from './collection/ShowcaseOverlay.svelte';
  import { lookFrom } from './collection/look';
  import { progress as collectionProgress } from '../collection/rewards';
  import type { CollectionState, DiscoveryEvent } from '../collection/types';
  import { ThumbnailRenderer } from '../render/ThumbnailRenderer';
  import PlanPicker from './poc/PlanPicker.svelte';
  import OtherPlans from './poc/OtherPlans.svelte';
  import PocPlaytestIntro from './poc/PocPlaytestIntro.svelte';
  import PocQuestionnaire from './poc/PocQuestionnaire.svelte';
  import PocResults from './poc/PocResults.svelte';
  import PocSessionCard from './poc/PocSessionCard.svelte';
  import { POC_SESSION_ROUNDS, type PocAnswers, type PocPlaytestState, type PocStudy } from '../dev/pocPlaytest';
  import type { AltDisplay } from './pocConfig';
  import type { PlanSlot } from '../domain/plans';

  let host: HTMLDivElement;
  let ctx = $state<GameContext | null>(null);
  let snap = $state<FlowSnapshot | null>(null);
  let bf = $state<BossFightStatus>({ active: false, rungs100: [], rung: -1, blocked: false, ko: false });
  let devOpen = $state(false);
  let muted = $state(false);
  let bootError = $state<string | null>(null);
  let pt = $state<PlaytestState | null>(null);
  let ptIntro = $state(false);
  let ptResultsId = $state<string | null>(null);
  // COLLECTION BOOK (absent si désactivé : mode Stake tant que non confirmé, replay par URL).
  let coll = $state<CollectionState | null>(null);
  let discovery = $state<DiscoveryEvent | null>(null);
  let bookOpen = $state(false);
  let bookTab = $state<'rewards' | null>(null);
  // Phase 0.6 : le compteur et le cadeau attendent que la carte NEW ait atteint le bouton COLLECTION.
  let collButton = $state<HTMLButtonElement | null>(null);
  let countHold = $state(0);
  let bump = $state(false);
  let giftFresh = $state(false);
  let lastUnseen = -1;
  let showcaseOn = $state(false);
  let thumbs = $state.raw<ThumbnailRenderer | null>(null);
  // POC « 3 PLANS » (BAD BOSS — 3 GADGET POC) : réglage DEV ALTERNATIVE DISPLAY.
  let altMode = $state<AltDisplay>('PRIVATE');
  const poc = $derived(ctx?.poc ?? null);
  let pocPt = $state<PocPlaytestState | null>(null);
  let pocIntro = $state(false);
  let pocResults = $state<PocStudy | null>(null);
  const pocStudy = $derived(pocPt?.study ?? null);
  const pocSession = $derived(pocStudy && pocStudy.status === 'running' ? (pocStudy.sessions[pocStudy.sessions.length - 1] ?? null) : null);
  const showPocQuestionnaire = $derived(pocSession?.status === 'questionnaire' && snap?.state === 'READY');

  const ptCurrent = $derived(pt?.current ?? null);
  const showQuestionnaire = $derived(ptCurrent?.status === 'questionnaire' && snap?.state === 'READY');
  const ptResults = $derived(ptResultsId ? (pt?.sessions.find((x) => x.id === ptResultsId) ?? null) : null);
  const overlayOpen = $derived(ptIntro || showQuestionnaire || ptResults !== null || bookOpen || showcaseOn || pocIntro || showPocQuestionnaire || pocResults !== null);
  const collProgress = $derived(ctx?.collection && coll ? collectionProgress(coll, ctx.collection.catalog) : null);
  const shownCount = $derived(collProgress ? Math.max(0, collProgress.discovered - countHold) : 0);
  /** Animations découvertes avec un gadget (cartes de Rage Level) : un fait, affiché sous son nom pendant le choix. */
  function gadgetFound(gadgetId: string): { discovered: number; total: number } | null {
    const g = ctx?.collection?.catalog.cards.find((c) => c.gadgetId === gadgetId);
    return g && collProgress ? (collProgress.byGadget[`${g.level}/${gadgetId}`] ?? null) : null;
  }
  const unseenRewards = $derived(ctx?.collection && coll ? ctx.collection.unseenRewards.length : 0);
  const giftCount = $derived(countHold > 0 ? 0 : unseenRewards);
  $effect(() => {
    // « REWARD UNLOCKED » : court libellé quand une nouvelle récompense arrive (puis seulement l'icône).
    // Au chargement, les récompenses déjà en attente affichent l'icône, sans libellé.
    if (!coll) return;
    if (lastUnseen >= 0 && giftCount > lastUnseen) {
      giftFresh = true;
      const t = setTimeout(() => (giftFresh = false), 2600);
      lastUnseen = giftCount;
      return () => clearTimeout(t);
    }
    lastUnseen = giftCount;
  });

  function onDiscovery(e: DiscoveryEvent) {
    discovery = e;
    // La carte vole jusqu'au bouton : le compteur n'avance qu'à son arrivée (jamais plus de 2,5 s).
    if (e.isNew && (!e.loss || ctx?.meta.newBadgeOnLoss)) countHold = 1;
  }

  function onCardArrive() {
    countHold = 0;
    bump = true;
    setTimeout(() => (bump = false), 420);
  }

  onMount(() => {
    let off: (() => void)[] = [];
    bootstrap(host)
      .then((c) => {
        ctx = c;
        devOpen = c.devEnabled && new URL(location.href).searchParams.get('dev') === '1';
        off.push(c.flow.subscribe((s) => (snap = s)));
        off.push(c.presenter.onSignalEvent(() => (bf = c.presenter.status.bossFight)));
        off.push(c.flow.subscribe((s) => { if (s.state === 'READY' || s.state === 'BET_PENDING') bf = c.presenter.status.bossFight; }));
        off.push(c.playtest.subscribe((s) => (pt = s)));
        if (c.poc) {
          document.title = 'BAD BOSS — 3 GADGET POC (working title)';
          off.push(c.poc.altDisplay.subscribe((v) => (altMode = v)));
          off.push(c.poc.playtest.subscribe((v) => (pocPt = v)));
        }
        if (c.collection) {
          off.push(
            c.collection.subscribe((s) => {
              coll = s;
              // Cosmétiques : rendu seulement (jamais un cue, une durée ni une branche).
              const look = lookFrom(s);
              c.stage.setCosmetics(look);
              c.audio.setDingVariant(look.ding);
            }),
          );
          off.push(c.collection.onDiscovery(onDiscovery));
        }
      })
      .catch((e) => (bootError = e instanceof Error ? e.message : String(e)));
    const onKey = (e: KeyboardEvent) => {
      if (!ctx || overlayOpen || (e.target as HTMLElement)?.closest('input, select, textarea, .dev')) return;
      // POC « 3 PLANS » : A / B / C au clavier (READY seulement ; GameFlow refuse sinon).
      const slot = ({ KeyA: 'A', KeyB: 'B', KeyC: 'C' } as Record<string, PlanSlot | undefined>)[e.code];
      if (slot && ctx.poc && snap?.plansEnabled) {
        onPickPlan(slot, ctx.flow.snapshot.plan !== slot && ctx.flow.setPlan(slot));
        return;
      }
      if (e.code !== 'Space' || !snap?.capabilities.spacebar) return;
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

  /** POC : retour d'interface discret au choix d'un plan (jamais un son de gain). */
  function onPickPlan(_slot: PlanSlot, changed: boolean) {
    gesture();
    if (changed) ctx?.audio.play('click', 0.8);
  }

  function onRevealOtherPlans(roundId: string) {
    // Mesure du playtest POC : aucune autre conséquence (jamais de son, jamais d'effet sur le jeu).
    ctx?.poc?.playtest.markRevealOpened(roundId, performance.now());
  }

  /** Session propre (solde fictif remis à $1,000, aucun forçage, aucune panne) avec l'affichage de la variante. */
  async function resetForPocSession(variant: AltDisplay) {
    if (!ctx?.poc) return;
    ctx.presenter.forceBranchId = null;
    ctx.mock?.update((s) => {
      s.nextForced = null;
      s.nextForcedTriple = null;
      s.faults = { offline: false, playTimeoutAfterSend: false, endRoundTimeoutAfterSend: false, latencyMs: 120 };
      s.balance = 1000 * 1_000_000;
    });
    ctx.poc.altDisplay.set(variant);
    await ctx.flow.start();
  }

  async function startPocPlaytest() {
    if (!ctx?.poc) return;
    pocIntro = false;
    devOpen = false;
    const study = ctx.poc.playtest.start({
      width: window.innerWidth,
      height: window.innerHeight,
      portrait: window.innerHeight > window.innerWidth,
      touch: navigator.maxTouchPoints > 0,
    });
    await resetForPocSession(study.order[0]);
  }

  async function submitPocAnswers(answers: PocAnswers | null) {
    if (!ctx?.poc) return;
    const id = pocStudy?.id ?? null;
    const next = ctx.poc.playtest.submitAnswers(answers);
    if (next) {
      await resetForPocSession(next);
      return;
    }
    ctx.poc.altDisplay.set('PRIVATE');
    pocResults = ctx.poc.playtest.snapshot.history.find((x) => x.id === id) ?? null;
  }

  function toggleMute() {
    gesture();
    muted = !muted;
    ctx?.audio.setMuted(muted);
  }

  function toggleDev() {
    devOpen = !devOpen;
    if (devOpen) {
      ctx?.playtest.markDevPanelOpened();
      ctx?.poc?.playtest.markDevPanelOpened();
    }
  }

  /** Session propre : aucun forçage, aucune panne simulée, solde fictif remis à $1,000. */
  async function startPlaytest() {
    if (!ctx) return;
    ptIntro = false;
    devOpen = false;
    ctx.presenter.forceBranchId = null;
    ctx.mock?.update((s) => {
      s.nextForced = null;
      s.faults = { offline: false, playTimeoutAfterSend: false, endRoundTimeoutAfterSend: false, latencyMs: 120 };
      s.balance = 1000 * 1_000_000;
    });
    const p = ctx.collection?.progress ?? null;
    ctx.playtest.start(
      {
        width: window.innerWidth,
        height: window.innerHeight,
        portrait: window.innerHeight > window.innerWidth,
        touch: navigator.maxTouchPoints > 0,
      },
      p,
    );
    await ctx.flow.start();
  }

  /** Aperçu d'un BOSS FIGHT : aucune mise, aucun appel wallet, rien dans les données du playtest. */
  function previewBossFight() {
    if (!ctx || snap?.state !== 'READY') return;
    ptIntro = false;
    ptResultsId = null;
    devOpen = false;
    gesture();
    if (ctx.playtest.current) ctx.playtest.excludeNextDelay();
    void ctx.flow.replayRound(makeBossFightPreview(snap.level, cryptoRandom));
  }

  function openCollection(tab: 'rewards' | null = null) {
    if (!ctx?.collection || snap?.state !== 'READY') return;
    gesture();
    devOpen = false;
    ptIntro = false;
    bookTab = tab;
    bookOpen = true;
    thumbs ??= new ThumbnailRenderer();
    ctx.collection.markOpened();
    ctx.playtest.markCollectionOpened(snap.level);
  }

  /** SPECIAL EPISODE : aucune mise, aucun appel wallet ; exclu des données de playtest (comme l'aperçu BOSS FIGHT). */
  function playEpisode() {
    if (!ctx || snap?.state !== 'READY') return;
    bookOpen = false;
    gesture();
    if (ctx.playtest.current) {
      ctx.playtest.excludeNextDelay();
      ctx.playtest.markEpisodePlayed();
    }
    showcaseOn = true;
  }

  function exitEpisode() {
    showcaseOn = false;
    if (ctx && snap) ctx.presenter.toIdle(snap.level);
  }

  function submitAnswers(answers: PlaytestAnswers | null) {
    const id = ptCurrent?.id ?? null;
    ctx?.playtest.submitAnswers(answers);
    ptResultsId = id;
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
    <span class="title" data-testid="title">BAD BOSS <small>WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED · {poc ? 'PLAYTEST #3 BUILD · 3 GADGETS · MOCK' : 'CLASSIC MODE · 1 GADGET PER RAGE LEVEL'}</small></span>
    <span class="balance" data-testid="balance">{formatBalance(snap?.balance ?? null)}</span>
    {#if poc && pocSession}
      <span class="pt-chip" data-testid="poc-counter">PLAYTEST S{pocSession.index}/2 · {Math.min(pocSession.rounds.length + (pocSession.status === 'playing' ? 1 : 0), POC_SESSION_ROUNDS)}/{POC_SESSION_ROUNDS}</span>
    {:else if poc}
      <button class="icon pt" onclick={() => (pocIntro = true)} disabled={snap?.state !== 'READY'} data-testid="playtest-open">PLAYTEST</button>
    {:else if ptCurrent}
      <span class="pt-chip" data-testid="playtest-counter">PLAYTEST {Math.min(ptCurrent.rounds.length + (ptCurrent.status === 'playing' ? 1 : 0), PLAYTEST_TARGET)}/{PLAYTEST_TARGET}</span>
    {:else if ctx?.mock}
      <button class="icon pt" onclick={() => (ptIntro = true)} disabled={snap?.state !== 'READY'} data-testid="playtest-open">PLAYTEST</button>
    {/if}
    {#if ctx?.collection && collProgress && !ctx.flow.isReplayOnly}
      <span class="coll-wrap">
        <button class="icon coll" class:bump bind:this={collButton} onclick={() => openCollection()} disabled={snap?.state !== 'READY'} aria-label="Collection: {shownCount} of {collProgress.total} discovered" data-testid="collection-open">
          <svg class="book" viewBox="0 0 20 16" aria-hidden="true" focusable="false"><path d="M1 2.5C4 1 7 1 10 3C13 1 16 1 19 2.5V14C16 12.5 13 12.5 10 14.5C7 12.5 4 12.5 1 14Z" fill="#fff8ee" stroke="#1d3b8f" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 3V14.5" stroke="#1d3b8f" stroke-width="1.6"/></svg>
          {shownCount}/{collProgress.total}
        </button>
        <GiftNotice count={snap?.state === 'READY' || giftFresh ? giftCount : 0} fresh={giftFresh} onOpen={() => openCollection('rewards')} />
      </span>
    {/if}
    <button class="icon" onclick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? '🔇' : '🔊'}</button>
    {#if ctx?.devEnabled}<button class="icon dev" onclick={toggleDev} data-testid="dev-toggle">DEV</button>{/if}
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
    {#if ctx && snap && poc && snap.plansEnabled && !showcaseOn && !bootError}
      <PlanPicker flow={ctx.flow} stage={ctx.stage} {snap} onPick={onPickPlan} found={collProgress ? gadgetFound : null} />
    {/if}
    {#if ctx && snap && poc && snap.state === 'READY' && snap.revealed?.plans && !showcaseOn}
      <OtherPlans revealed={snap.revealed} level={snap.level} mode={altMode} onOpen={onRevealOtherPlans} />
    {/if}
    {#if poc && pocSession?.status === 'extra' && snap?.state === 'READY'}
      <PocSessionCard session={pocSession} onAnswer={() => ctx?.poc?.playtest.openQuestionnaire()} />
    {/if}
    {#if !showcaseOn}
      <!-- SPECIAL EPISODE : aucun chiffre à l'écran (ni résultat précédent, ni échelle, ni badge). -->
      <ResultPop revealed={snap?.revealed ?? null} currency={snap?.balance?.currency ?? 'USD'} />
      <BfLadder {bf} />
      {#if ctx?.collection}
        <DiscoveryFlight event={discovery} showOnLoss={ctx.meta.newBadgeOnLoss} target={() => collButton?.getBoundingClientRect() ?? null} onArrive={onCardArrive} />
      {/if}
    {/if}
    {#if bootError}<div class="banner error">Boot failed: {bootError}</div>{/if}
    {#if snap?.capabilities.displayRtp}<div class="rtp">RTP 96.50% (provisional)</div>{/if}
    <div class="wt" aria-hidden="true">BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED</div>
  </div>

  {#if ctx && snap && !showcaseOn}
    <Hud flow={ctx.flow} {snap} onGesture={gesture} poc={poc !== null} />
  {/if}
</div>

{#if ctx && snap && devOpen}
  <DevPanel {ctx} {snap} onClose={() => (devOpen = false)} onShowSession={(id) => { devOpen = false; ptResultsId = id; }} onPreviewBossFight={previewBossFight} onOpenCollection={() => openCollection()} />
{/if}

{#if ctx?.collection && thumbs && bookOpen}
  <CollectionBook
    collection={ctx.collection}
    {thumbs}
    initialTab={bookTab ?? snap?.level ?? 'grumpy'}
    canPlayEpisode={snap?.state === 'READY'}
    onClose={() => (bookOpen = false)}
    onPlayEpisode={playEpisode}
  />
{/if}
{#if ctx && showcaseOn}
  <ShowcaseOverlay presenter={ctx.presenter} onExit={exitEpisode} />
{/if}

{#if pocIntro}
  <PocPlaytestIntro onStart={startPocPlaytest} onCancel={() => (pocIntro = false)} />
{/if}
{#if showPocQuestionnaire && pocSession}
  {#key pocSession.index}<PocQuestionnaire session={pocSession} onSubmit={submitPocAnswers} />{/key}
{/if}
{#if ctx?.poc && pocResults}
  <PocResults recorder={ctx.poc.playtest} study={pocResults} onClose={() => (pocResults = null)} />
{/if}
{#if ptIntro}
  <PlaytestIntro onStart={startPlaytest} onCancel={() => (ptIntro = false)} onPreviewBossFight={previewBossFight} />
{/if}
{#if showQuestionnaire}
  <Questionnaire onSubmit={submitAnswers} />
{/if}
{#if ctx && ptResults}
  <PlaytestResults recorder={ctx.playtest} session={ptResults} onClose={() => (ptResultsId = null)} onPreviewBossFight={previewBossFight} />
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
  .icon.pt { font-size: 11px; letter-spacing: 1px; }
  .icon.coll { font-size: 11px; letter-spacing: 0.5px; white-space: nowrap; background: #2a2f55; display: inline-flex; align-items: center; gap: 5px; }
  .icon.coll .book { width: 16px; height: 13px; }
  /* Petits téléphones : barre resserrée (le bouton COLLECTION porte le cadeau des récompenses sur son coin). */
  @media (max-width: 440px) {
    .title { display: none; }
    .topbar { gap: 6px; padding-left: 8px; padding-right: 8px; justify-content: space-between; }
    .icon { padding: 4px 6px; }
    .icon.coll { gap: 3px; }
    .icon.coll .book { width: 13px; height: 11px; }
    .balance { font-size: 14px; }
  }
  .coll-wrap { position: relative; display: inline-flex; align-items: center; }
  /* Arrivée de la carte NEW : petite réaction du bouton (encre bleue, jamais l'or d'un gain). */
  .icon.coll.bump { animation: bump 0.42s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 0 0 3px rgba(120, 150, 255, 0.55); }
  @keyframes bump { 0% { transform: scale(1); } 35% { transform: scale(1.18, 0.9); } 70% { transform: scale(0.96, 1.05); } 100% { transform: scale(1); } }
  @media (prefers-reduced-motion: reduce) { .icon.coll.bump { animation: none; } }
  .icon:disabled { opacity: 0.4; }
  .pt-chip { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #ff8a00; white-space: nowrap; }
  .stage { position: relative; min-height: 0; overflow: hidden; }
  .wt { display: none; position: absolute; right: 8px; bottom: 4px; font-size: 8px; letter-spacing: 0.5px; color: #fff; opacity: 0.45; pointer-events: none; }
  /* Portrait : scène à hauteur maîtrisée (plus de plafond vide), HUD juste en dessous. */
  @media (orientation: portrait) and (max-aspect-ratio: 4/5) {
    .game { grid-template-rows: auto auto minmax(0, 1fr); }
    .stage { height: min(140vw, 64vh, calc(100dvh - 262px)); }
    .title small { display: none; }
    .wt { display: block; }
  }
  .canvas-host { position: absolute; inset: 0; }
  .canvas-host :global(canvas) { display: block; width: 100%; height: 100%; }
  .banner { position: absolute; left: 50%; top: 10px; transform: translateX(-50%); max-width: min(92%, 560px); display: flex; gap: 10px; align-items: center; padding: 8px 12px; border-radius: 10px; font-weight: 700; font-size: 13px; color: #1b1f3b; background: #e8ecff; box-shadow: 0 4px 0 rgba(0, 0, 0, 0.25); z-index: 2; }
  .banner.warning { background: #ffd08a; }
  .banner.error { background: #ff8fa0; }
  .banner button { background: #1b1f3b; color: #fff; border: 0; border-radius: 8px; padding: 6px 10px; font-weight: 900; cursor: pointer; }
  .badge { position: absolute; left: 10px; bottom: 10px; background: var(--bb-violet); color: #fff; font-weight: 900; font-size: 11px; letter-spacing: 1px; padding: 4px 8px; border-radius: 8px; }
  .rtp { position: absolute; right: 10px; bottom: 8px; font-size: 11px; color: #fff; opacity: 0.7; }
</style>
