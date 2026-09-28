<script lang="ts">
  import { MELTDOWN_GADGETS, MELTDOWN_PER_GADGET } from '../collection/rewards';
  import { PLAN_SETS, planGadgetId } from '../domain/plans';
  /** DEV : tous les gadgets à N découvertes sauf le plan A de GRUMPY (N − 1) — le prochain pas débloque OFFICE MELTDOWN. */
  const meltdownMinusOne = () => Object.fromEntries(MELTDOWN_GADGETS.map((g, i) => [g.gadgetId, i === 0 ? MELTDOWN_PER_GADGET - 1 : MELTDOWN_PER_GADGET]));
  import { GADGETS, gadgetFor, gadgetForPlan } from '../content/gadgets';
  import { PLAN_SLOTS } from '../domain/plans';
  import { classify } from '../domain/resultClass';
  import { getRageLevel } from '../domain/rageLevels';
  import { RAGE_LEVEL_IDS, type RageLevelId, type Speed } from '../domain/types';
  import type { FlowSnapshot } from '../flow/GameFlow';
  import { makeDevRound } from '../dev/devOutcomes';
  import { runLoop, type LoopReport } from '../dev/loop';
  import { PLAYTEST_TARGET, type PlaytestState } from '../dev/playtest';
  import { copyText, saveTextFile } from '../dev/exportFile';
  import { cryptoRandom, forcedFreeRoundsTotal100, forcibleMultipliers, type ForcedOutcome } from '../platform/rgs/mock/mockMath';
  import type { BranchDef } from '../presentation/types';
  import type { GameContext } from './bootstrap';
  import PocDevSection from './poc/PocDevSection.svelte';
  import BranchFinder from './BranchFinder.svelte';
  import { formatBalance, formatX } from './format';

  let {
    ctx,
    snap,
    onClose,
    onShowSession,
    onPreviewBossFight,
    onOpenCollection,
    onOpenPocStudy,
  }: {
    ctx: GameContext;
    snap: FlowSnapshot;
    onClose: () => void;
    onShowSession: (id: string) => void;
    onPreviewBossFight: () => void;
    onOpenCollection: () => void;
    /** Étude A/B du POC (PRIVATE vs ON-DEMAND, 2 × 30 manches) : outil DEV ; le bouton PLAYTEST lance le PLAYTEST #3. */
    onOpenPocStudy?: () => void;
  } = $props();
  const { flow, presenter, mock, perf, stage, playtest } = $derived(ctx);

  type Kind = ForcedOutcome['kind'] | 'RANDOM';
  let kind = $state<Kind>('WIN');
  let multiplier = $state<number>(2);
  /** BOSS FIGHT forcé : nombre de HIT sur les 8 tours gratuits et base de chaque HIT. */
  let bfHits = $state(4);
  let bfBase = $state(2);
  let branchId = $state<string>('auto');
  let seedText = $state('');
  let loopCount = $state(20);
  let loopAll = $state(true);
  let loopForced = $state(false);
  let loopProgress = $state('');
  let loopRunning = $state(false);
  let loopStop = false;
  let loopReport = $state<LoopReport | null>(null);
  let pt = $state<PlaytestState>({ version: 2, current: null, sessions: [], trackingExtraFor: null, lastReadyAt: null });
  let ptNote = $state('');
  let tick = $state(0);
  let note = $state('');

  const level = $derived(snap.level);
  // Mode 3 gadgets : le gadget est celui du plan choisi (plan A par défaut) ; sinon le gadget classique du niveau.
  const gadget = $derived(snap.plansEnabled ? gadgetForPlan(level, snap.plan ?? 'A') : gadgetFor(level));
  const bfRounds = $derived(getRageLevel(level).freeRounds.rounds);
  const bfBases = $derived(forcibleMultipliers(level, 'BOSS_FIGHT'));
  const bfTotal100 = $derived(forcedFreeRoundsTotal100(level, { hits: bfHits, base: bfBase }));
  const multipliers = $derived(kind === 'RANDOM' || kind === 'BOSS_FIGHT' ? [] : forcibleMultipliers(level, kind));
  const targetClass = $derived(kind === 'BOSS_FIGHT' ? classify(bfTotal100) : kind === 'RANDOM' ? null : classify(Math.round(multiplier * 100)));
  const branches = $derived(
    gadget.branches.filter((b: BranchDef) => {
      if (kind === 'RANDOM' || !targetClass) return true;
      const isBf = b.categories.includes('BF_ENTRY');
      return (kind === 'BOSS_FIGHT') === isBf && b.classes.includes(targetClass);
    }),
  );
  const ready = $derived(snap.state === 'READY');

  $effect(() => {
    if (multipliers.length && !multipliers.includes(multiplier)) multiplier = multipliers[0] ?? 0;
  });
  $effect(() => {
    if (!bfBases.includes(bfBase)) bfBase = bfBases.find((m) => m > 1) ?? bfBases[0] ?? 1;
  });
  $effect(() => {
    if (branchId !== 'auto' && !branches.some((b) => b.id === branchId)) branchId = 'auto';
    presenter.forceBranchId = branchId === 'auto' ? null : branchId;
  });
  $effect(() => playtest.subscribe((s) => (pt = s)));
  // COLLECTION DEBUG : seulement avec le Mock RGS (jamais en production).
  const collection = $derived(mock ? ctx.collection : null);
  let collCount = $state('');
  $effect(() => {
    const c = collection;
    if (!c) return;
    return c.subscribe(() => {
      const p = c.progress;
      collCount = `${p.discovered} / ${p.total} · milestones ${Object.keys(c.state.milestones).length} · opened ${c.state.opens}×`;
    });
  });
  $effect(() => {
    const id = setInterval(() => (tick = tick + 1), 250);
    return () => clearInterval(id);
  });

  const debug = $derived.by(() => {
    void tick;
    const p = perf.snapshot();
    const st = presenter.status;
    const s = stage.stats();
    return { p, st, s, mockState: mock?.snapshot() ?? null };
  });

  function forced(): ForcedOutcome | null {
    // RANDOM : tirage mathématique complet (la graine vient aussi du tirage).
    if (kind === 'RANDOM') return null;
    const seed = seedText.trim() === '' ? undefined : Number(seedText) >>> 0;
    if (kind === 'BOSS_FIGHT') return { kind, bossFightHits: bfHits, bossFightBase: bfBase, seed };
    return { kind, multiplier, seed };
  }

  function pickBranch(b: BranchDef) {
    branchId = b.id;
    if (b.categories.includes('BF_ENTRY')) kind = 'BOSS_FIGHT';
    else if (b.classes.includes('MISS')) kind = 'LOSS';
    else if (b.classes.includes('BIG')) kind = 'BIG_WIN';
    else kind = 'WIN';
  }

  function armNextBet() {
    if (!mock) return;
    const f = forced();
    mock.update((s) => (s.nextForced = f ? { mode: level, forced: f } : null));
    note = f ? `Next ${level.toUpperCase()} bet forced: ${kind}` : 'Forcing cleared';
  }

  function preview() {
    if (!ready) return;
    const f = forced();
    void flow.replayRound(makeDevRound(level, f, cryptoRandom, `DEV-${Date.now().toString(36).slice(-5)}`));
  }

  function replayLast() {
    const r = flow.lastPresentedRound;
    if (r && ready) void flow.replayRound(r);
    else note = r ? 'Wait for READY' : 'No round to replay yet';
  }

  function randomSeed() {
    seedText = String(Math.floor(cryptoRandom() * 4294967296));
  }

  function simulateFaultAndFire(fault: 'playTimeoutAfterSend' | 'endRoundTimeoutAfterSend') {
    if (!mock || !ready) return;
    const before = mock.snapshot().calls.play;
    mock.update((s) => (s.faults[fault] = true));
    flow.fire();
    note = `Fault armed: ${fault}. Play calls before: ${before}. Watch the counters: exactly one Play is sent.`;
  }

  function setOffline(v: boolean) {
    mock?.update((s) => (s.faults.offline = v));
  }

  function setLatency(ms: number) {
    mock?.update((s) => (s.faults.latencyMs = ms));
  }

  function activeRoundAndReload() {
    if (!mock) return;
    mock.createActiveRound(snap.betAmount, level);
    location.reload();
  }

  function setJurisdiction(key: string, value: boolean | number) {
    mock?.update((s) => ((s.jurisdiction as unknown as Record<string, boolean | number>)[key] = value));
    note = 'Jurisdiction changed: reload to re-authenticate.';
  }

  function replayUrl(): string | null {
    const r = flow.lastPresentedRound;
    if (!r) return null;
    const u = new URL(location.href);
    u.search = '';
    u.searchParams.set('replay', 'true');
    u.searchParams.set('game', 'bad-boss');
    u.searchParams.set('version', '0');
    u.searchParams.set('mode', r.mode);
    u.searchParams.set('event', r.roundId);
    u.searchParams.set('amount', String(r.betAmount));
    return u.toString();
  }

  async function startLoop() {
    if (!ready || loopRunning) return;
    loopRunning = true;
    loopStop = false;
    loopReport = null;
    const report = await runLoop(flow, presenter, perf, () => (mock ? mock.snapshot().calls.play + mock.snapshot().calls.endRound : 0), {
      count: loopCount,
      level: loopAll ? 'all' : level,
      forced: loopForced ? forced() : null,
      // PRODUCTION 3 GADGETS : les 3 gadgets de chaque niveau à tour de rôle (A → B → C).
      plans: snap.plansEnabled,
      onProgress: (d, n) => (loopProgress = `${d}/${n}`),
      shouldStop: () => loopStop,
      sampleEvery: loopCount >= 100 ? 50 : 0,
      sceneStats: () => stage.stats(),
    });
    loopReport = report;
    (window as unknown as { __BADBOSS_LOOP__: LoopReport }).__BADBOSS_LOOP__ = report;
    loopRunning = false;
  }

  async function copyAllSessions() {
    ptNote = (await copyText(playtest.exportJson())) ? 'All sessions copied.' : 'Clipboard refused: use SAVE.';
  }

  async function saveAllSessions() {
    const r = await saveTextFile('badboss-playtests-local-dev-only.json', playtest.exportJson());
    ptNote = r === 'saved' ? 'Saved.' : r === 'declined' ? 'Save cancelled.' : 'Save unavailable here: use COPY.';
  }

  const fmtMs = (ms: number) => `${(ms / 1000).toFixed(2)} s`;
  const mb = (b: number) => `${(b / 1048576).toFixed(1)} MB`;
  const current = $derived(pt.current);
</script>

<aside class="dev" data-testid="dev-panel">
  <header>
    <b>BAD BOSS DEV PANEL</b>
    <span class="tag">{mock ? 'MOCK RGS' : 'STAKE RGS'}</span>
    <button class="x" onclick={onClose} aria-label="Close dev panel">✕</button>
  </header>
  {#if note}<p class="note">{note}</p>{/if}
  {#if ctx.poc && mock}<BranchFinder {ctx} ready={snap.state === 'READY'} onArmed={(m) => (note = m)} />{/if}
  {#if ctx.poc && mock}<PocDevSection {ctx} />{/if}
  {#if ctx.poc && mock && onOpenPocStudy}
    <section>
      <h3>POC A/B STUDY (PRIVATE vs ON-DEMAND)</h3>
      <button onclick={onOpenPocStudy} disabled={snap.state !== 'READY'} data-testid="dev-poc-study">START A/B STUDY (2 × 30)</button>
    </section>
  {/if}

  <section>
    <h3>FORCE</h3>
    <label>RAGE LEVEL
      <select value={level} onchange={(e) => flow.setLevel((e.currentTarget as HTMLSelectElement).value as RageLevelId)} disabled={!ready}>
        {#each RAGE_LEVEL_IDS as id (id)}<option value={id}>{id.toUpperCase()}</option>{/each}
      </select>
    </label>
    <label>GADGET
      <select value={gadget.id} onchange={(e) => { const g = GADGETS.find((x) => x.id === (e.currentTarget as HTMLSelectElement).value); if (!g) return; flow.setLevel(g.rageLevel); if (flow.snapshot.plansEnabled) flow.setPlan(PLAN_SLOTS[PLAN_SETS[g.rageLevel].indexOf(g.id)] ?? 'A'); }} disabled={!ready}>
        {#each GADGETS as g (g.id)}<option value={g.id}>{g.label} ({g.rageLevel})</option>{/each}
      </select>
    </label>
    <label>OUTCOME
      <select bind:value={kind} data-testid="dev-kind">
        <option value="RANDOM">RANDOM (math)</option>
        <option value="LOSS">LOSS</option>
        <option value="WIN">WIN</option>
        <option value="BIG_WIN">BIG WIN</option>
        <option value="BOSS_FIGHT">BOSS FIGHT</option>
      </select>
    </label>
    {#if kind === 'BOSS_FIGHT'}
      <label>FREE ROUNDS: HITS
        <select bind:value={bfHits} data-testid="dev-bf-hits">{#each Array.from({ length: bfRounds }, (_, i) => i + 1) as h (h)}<option value={h}>{h} / {bfRounds}</option>{/each}</select>
      </label>
      <label>BASE PER HIT
        <select bind:value={bfBase} data-testid="dev-bf-base">{#each bfBases as m (m)}<option value={m}>x{m}</option>{/each}</select>
      </label>
      <span class="hint">total {formatX(bfTotal100)}</span>
    {:else if kind !== 'RANDOM'}
      <label>MULTIPLIER
        <select bind:value={multiplier} data-testid="dev-mult">{#each multipliers as m (m)}<option value={m}>x{m}</option>{/each}</select>
      </label>
    {/if}
    <label>BRANCH
      <select value={branchId} onchange={(e) => { const v = (e.currentTarget as HTMLSelectElement).value; const b = gadget.branches.find((x) => x.id === v); if (b) pickBranch(b); else branchId = 'auto'; }}>
        <option value="auto">auto (book + seed)</option>
        {#each gadget.branches as b (b.id)}<option value={b.id}>{b.id} — {b.label} · {b.rarity}</option>{/each}
      </select>
    </label>
    <label>COSMETIC SEED
      <span class="row"><input bind:value={seedText} placeholder="random" inputmode="numeric" data-testid="dev-seed" /><button onclick={randomSeed}>🎲</button></span>
    </label>
    <label>SPEED
      <select value={snap.speed} onchange={(e) => flow.setSpeed((e.currentTarget as HTMLSelectElement).value as Speed)} disabled={!ready}>
        <option value="normal">NORMAL</option><option value="turbo">TURBO</option><option value="super">SUPER TURBO</option>
      </select>
    </label>
    <button class="bf" onclick={onPreviewBossFight} disabled={!ready} data-testid="bf-preview-dev">▶ PREVIEW BOSS FIGHT (no bet, not recorded)</button>
    <div class="buttons">
      <button onclick={preview} disabled={!ready} data-testid="dev-preview">▶ PLAY ANIMATION (no bet)</button>
      {#if mock}<button onclick={armNextBet} data-testid="dev-arm">ARM NEXT BET</button>{/if}
      <button onclick={replayLast} disabled={!ready}>↺ REPLAY LAST</button>
    </div>
  </section>

  {#if mock}
    <section>
      <h3>SIMULATE</h3>
      <label class="check"><input type="checkbox" checked={debug.mockState?.faults.offline} onchange={(e) => setOffline((e.currentTarget as HTMLInputElement).checked)} data-testid="dev-offline" /> NETWORK OFFLINE</label>
      <label>LATENCY
        <select value={debug.mockState?.faults.latencyMs} onchange={(e) => setLatency(Number((e.currentTarget as HTMLSelectElement).value))}>
          {#each [0, 120, 600, 1500, 3000] as ms (ms)}<option value={ms}>{ms} ms</option>{/each}
        </select>
      </label>
      <div class="buttons">
        <button onclick={() => simulateFaultAndFire('playTimeoutAfterSend')} disabled={!ready} data-testid="dev-play-timeout">SIMULATE PLAY TIMEOUT AFTER REQUEST SENT</button>
        <button onclick={() => simulateFaultAndFire('endRoundTimeoutAfterSend')} disabled={!ready} data-testid="dev-endround-timeout">SIMULATE END ROUND TIMEOUT</button>
        <button onclick={() => location.reload()} data-testid="dev-reload">PAGE RELOAD</button>
        <button onclick={activeRoundAndReload} disabled={!ready}>ACTIVE ROUND + RELOAD</button>
        {#if replayUrl()}<a class="btn" href={replayUrl()} target="_blank" rel="noopener">OPEN REPLAY URL ↗</a>{/if}
        <button onclick={() => { mock.reset(); location.reload(); }}>RESET MOCK WALLET</button>
      </div>
      <details>
        <summary>Jurisdiction (FeatureGate)</summary>
        {#each ['disabledTurbo', 'disabledSuperTurbo', 'disabledSlamstop', 'disabledSpacebar', 'displayRTP'] as key (key)}
          <label class="check"><input type="checkbox" checked={Boolean((debug.mockState?.jurisdiction as unknown as Record<string, unknown>)?.[key])} onchange={(e) => setJurisdiction(key, (e.currentTarget as HTMLInputElement).checked)} /> {key}</label>
        {/each}
        <label>minimumRoundDuration
          <select value={debug.mockState?.jurisdiction.minimumRoundDuration} onchange={(e) => setJurisdiction('minimumRoundDuration', Number((e.currentTarget as HTMLSelectElement).value))}>
            {#each [0, 3, 5000] as v (v)}<option value={v}>{v}</option>{/each}
          </select>
        </label>
        <label class="check"><input type="checkbox" checked={debug.mockState?.autoCloseZeroPayout} onchange={(e) => mock.update((s) => (s.autoCloseZeroPayout = (e.currentTarget as HTMLInputElement).checked))} /> RGS auto-closes x0 rounds (fallback)</label>
        <button onclick={() => location.reload()}>Apply (reload)</button>
      </details>
      <table class="kv">
        <tbody>
          <tr><td>Play calls</td><td data-testid="dev-calls-play">{debug.mockState?.calls.play}</td></tr>
          <tr><td>EndRound calls</td><td data-testid="dev-calls-end">{debug.mockState?.calls.endRound}</td></tr>
          <tr><td>Auth / resync</td><td>{debug.mockState?.calls.authenticate}</td></tr>
          <tr><td>Settled rounds</td><td>{debug.mockState?.settledRounds}</td></tr>
          <tr><td>Active round (server)</td><td>{debug.mockState?.activeRound?.roundId ?? '—'}</td></tr>
          <tr><td>Server balance</td><td>{formatBalance(debug.mockState ? { amount: debug.mockState.balance, currency: debug.mockState.currency } : null)}</td></tr>
        </tbody>
      </table>
    </section>
  {/if}

  <section>
    <h3>DEBUG</h3>
    <table class="kv">
      <tbody>
        <tr><td>FPS</td><td data-testid="dbg-fps">{debug.p.fps.toFixed(0)} (low {debug.p.minFps.toFixed(0)})</td></tr>
        <tr><td>Frame time (CPU)</td><td>{debug.p.frameMs.toFixed(2)} ms · p95 {debug.p.p95FrameMs.toFixed(2)} · max {debug.p.maxFrameMs.toFixed(1)}</td></tr>
        <tr><td>Texture memory (est.)</td><td>{mb(debug.s.textureBytes)} · {debug.s.textures} tex</td></tr>
        <tr><td>Active particles</td><td>{debug.st.particles}</td></tr>
        <tr><td>Active objects</td><td>{debug.s.visibleActors} actors · {debug.s.displayObjects} nodes</td></tr>
        <tr><td>Game state</td><td data-testid="dbg-state">{snap.state}</td></tr>
        <tr><td>Round ID</td><td data-testid="dbg-round">{snap.round?.roundId ?? '—'}</td></tr>
        <tr><td>Animation time</td><td>{fmtMs(debug.st.t)} / {fmtMs(debug.st.totalMs)} {debug.st.reveal !== null ? `(reveal ${fmtMs(debug.st.reveal)})` : ''} {debug.st.waitingMs > 0 && debug.st.mode !== 'idle' ? `· hold ${fmtMs(debug.st.waitingMs)}` : ''}</td></tr>
        <tr><td>Presenter</td><td>{debug.st.mode} · {debug.st.gadgetId}</td></tr>
        <tr><td>Branch</td><td data-testid="dbg-branch">{debug.st.branchId ?? '—'}</td></tr>
        <tr><td>Sequence key</td><td>{debug.st.sequenceKey ?? '—'}</td></tr>
        <tr><td>Cosmetic seed</td><td>{debug.st.seed ?? '—'}</td></tr>
        <tr><td>Seed variations</td><td>{debug.st.reaction ?? '—'}{debug.st.cooCameo ? ' + COO cameo' : ''}</td></tr>
        <tr><td>Revealed</td><td>{snap.revealed ? formatX(snap.revealed.multiplier100) : '—'}</td></tr>
        {#if ctx.contentErrors.length}<tr><td>Content errors</td><td>{ctx.contentErrors.length}</td></tr>{/if}
      </tbody>
    </table>
  </section>

  <section>
    <h3>LOOP (no bets)</h3>
    <div class="row">
      <select bind:value={loopCount} data-testid="loop-count"><option value={20}>x20</option><option value={100}>x100</option><option value={500}>x500</option></select>
      <label class="check"><input type="checkbox" bind:checked={loopAll} /> all levels</label>
      <label class="check"><input type="checkbox" bind:checked={loopForced} /> use FORCE</label>
    </div>
    <div class="buttons">
      <button onclick={startLoop} disabled={!ready || loopRunning} data-testid="loop-run">RUN LOOP</button>
      <button onclick={() => (loopStop = true)} disabled={!loopRunning}>STOP</button>
      <span data-testid="loop-progress">{loopProgress}</span>
    </div>
    {#if loopReport}
      <table class="kv" data-testid="loop-report">
        <tbody>
          <tr><td>Completed / revealed</td><td>{loopReport.completed} / {loopReport.revealed} of {loopReport.requested}</td></tr>
          <tr><td>Errors</td><td>{loopReport.errors.length ? loopReport.errors.join('; ') : 'none'}</td></tr>
          <tr><td>Wallet calls during loop</td><td>{loopReport.walletCallsDuringLoop}</td></tr>
          <tr><td>Duration</td><td>{fmtMs(loopReport.durationMs)} (avg {fmtMs(loopReport.avgRoundMs)}, {loopReport.speed})</td></tr>
          <tr><td>FPS avg / low</td><td>{loopReport.fps} / {loopReport.minFps}</td></tr>
          <tr><td>Frame CPU avg / p95 / max</td><td>{loopReport.avgFrameMs} / {loopReport.p95FrameMs} / {loopReport.maxFrameMs} ms</td></tr>
          <tr><td>Max particles</td><td>{loopReport.maxParticles}</td></tr>
          <tr><td>JS heap start → end</td><td>{loopReport.heapStartMB ?? 'n/a'} → {loopReport.heapEndMB ?? 'n/a'} MB</td></tr>
          <tr><td>Branches</td><td>{Object.entries(loopReport.branches).map(([k, v]) => `${k}:${v}`).join(' ')}</td></tr>
          {#if loopReport.samples.length}<tr><td>Heap every 50 (MB)</td><td>{loopReport.samples.map((x) => x.heapAfterGcMB ?? x.heapMB ?? '?').join(' → ')}</td></tr>{/if}
        </tbody>
      </table>
    {/if}
  </section>

  <section>
    <h3>PLAYTEST {PLAYTEST_TARGET} <span class="tag warn">LOCAL DEV ONLY</span></h3>
    <p class="small">Start from the PLAYTEST button in the top bar (clean mock state). Recorded only in this browser; nothing is sent anywhere. Any future collection from real players needs its own privacy notice and consent.</p>
    <table class="kv">
      <tbody>
        <tr><td>Current session</td><td data-testid="playtest-progress">{current ? `${current.id} · ${current.rounds.length}/${PLAYTEST_TARGET} · ${current.status}` : '—'}</td></tr>
        <tr><td>Completed sessions</td><td>{pt.sessions.length}</td></tr>
      </tbody>
    </table>
    {#each pt.sessions as s (s.id)}
      <div class="row">
        <button onclick={() => onShowSession(s.id)}>{s.id}</button>
        <span>{s.rounds.length} rounds · {s.answers ? `Q ${s.answers.scores.join('/')}` : s.questionnaireSkipped ? 'no answers' : 'aborted'}{s.extraRounds ? ` · +${s.extraRounds} after 50` : ''}</span>
      </div>
    {/each}
    <div class="buttons">
      <button onclick={() => playtest.abort()} disabled={!current} data-testid="dev-pt-abort">ABORT CURRENT</button>
      <button onclick={copyAllSessions} disabled={!pt.sessions.length}>COPY ALL</button>
      <button onclick={saveAllSessions} disabled={!pt.sessions.length}>SAVE ALL</button>
      <button onclick={() => playtest.clearAll()}>CLEAR ALL</button>
    </div>
    {#if ptNote}<p class="small">{ptNote}</p>{/if}
  </section>

  {#if collection}
    <section>
      <h3>COLLECTION DEBUG <span class="tag warn">MOCK ONLY</span></h3>
      <p class="small">Local collection only (never affects rounds, branches or maths). Not available in production. FORCE NEW picks a missing card of the current Rage Level first.</p>
      <table class="kv"><tbody><tr><td>Progress</td><td data-testid="dev-coll-count">{collCount}</td></tr></tbody></table>
      <div class="buttons">
        <button onclick={() => void collection.reset()} data-testid="dev-coll-reset">RESET COLLECTION</button>
        <button onclick={() => collection.unlockAll()} data-testid="dev-coll-all">UNLOCK ALL</button>
        <button onclick={() => collection.unlockRandom(10, cryptoRandom)} data-testid="dev-coll-random10">UNLOCK RANDOM 10</button>
        <button onclick={() => collection.setDiscoveredCount(collection.catalog.cards.length - 2, cryptoRandom)} data-testid="dev-coll-49">SET {collection.catalog.cards.length - 2}/{collection.catalog.cards.length}</button>
        {#if collection.catalog.meltdown.kind === 'perSection'}
          <!-- Mode classique : règle historique (N par Rage Level). -->
          {@const n = collection.catalog.meltdown.n}
          <button onclick={() => collection.setSectionCounts({ grumpy: n - 1, furious: n, unhinged: n }, cryptoRandom)} data-testid="dev-coll-788">SET MELTDOWN − 1 ({n - 1} GRUMPY, {n} FURIOUS, {n} UNHINGED)</button>
        {:else}
          <button onclick={() => collection.setGadgetCounts(meltdownMinusOne(), cryptoRandom)} data-testid="dev-coll-788">SET MELTDOWN − 1 ({MELTDOWN_PER_GADGET} × 8 GADGETS, {MELTDOWN_PER_GADGET - 1} × GRUMPY A)</button>
        {/if}
        <button onclick={() => collection.forceNewDiscovery(cryptoRandom, snap.level, snap.plan ? planGadgetId(snap.level, snap.plan) ?? undefined : PLAN_SETS[snap.level][0])} data-testid="dev-coll-new">FORCE NEW DISCOVERY</button>
        <button onclick={onOpenCollection} disabled={!ready} data-testid="dev-coll-view">VIEW COLLECTION</button>
      </div>
    </section>
  {/if}
</aside>

<style>
  .dev { position: fixed; top: 0; right: 0; bottom: 0; width: min(380px, 100vw); overflow-y: auto; background: rgba(10, 12, 26, 0.96); color: #dfe3f5; font: 12px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace; z-index: 50; border-left: 2px solid #5b2a86; padding-bottom: 40px; }
  header { position: sticky; top: 0; display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #5b2a86; color: #fff; z-index: 1; }
  header b { flex: 1; letter-spacing: 1px; }
  .x { background: none; border: 0; color: #fff; font-size: 18px; cursor: pointer; }
  .tag { font-size: 10px; padding: 2px 6px; border-radius: 6px; background: #1b1f3b; }
  .tag.warn { background: #ff8a00; color: #1b1f3b; font-weight: 800; }
  section { padding: 8px 12px; border-bottom: 1px solid #262b52; }
  h3 { margin: 4px 0 8px; font-size: 12px; letter-spacing: 2px; color: #ffc400; }
  label { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin: 4px 0; }
  label.check { justify-content: flex-start; }
  select, input:not([type='checkbox']) { background: #1f2447; color: #fff; border: 1px solid #3a4280; border-radius: 6px; padding: 4px 6px; font: inherit; max-width: 200px; }
  .row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .buttons { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; align-items: center; }
  button, .btn { background: #2b3160; color: #fff; border: 1px solid #3a4280; border-radius: 6px; padding: 6px 8px; font: inherit; font-weight: 700; cursor: pointer; text-decoration: none; }
  button:disabled { opacity: 0.4; cursor: default; }
  .bf { width: 100%; margin: 6px 0 2px; border: 2px dashed #ffc400; color: #ffc400; background: transparent; }
  .kv { width: 100%; border-collapse: collapse; margin-top: 6px; }
  .kv td { padding: 2px 0; vertical-align: top; }
  .kv td:first-child { color: #8f97c4; width: 45%; }
  .note { margin: 0; padding: 6px 12px; background: #262b52; color: #ffc400; }
  .small { font-size: 11px; color: #9aa2cc; margin: 0 0 6px; }
  details { margin-top: 8px; }
  summary { cursor: pointer; color: #9aa2cc; }
</style>
