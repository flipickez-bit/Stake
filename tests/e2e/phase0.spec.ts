import { expect, test, type Page } from '@playwright/test';

type Win = Window & { __BADBOSS__: any };

const state = (page: Page) => page.evaluate(() => (window as unknown as Win).__BADBOSS__.state().state as string);
const calls = (page: Page) => page.evaluate(() => (window as unknown as Win).__BADBOSS__.calls() as { play: number; endRound: number; authenticate: number });
const mock = (page: Page) => page.evaluate(() => (window as unknown as Win).__BADBOSS__.mock());
const presenter = (page: Page) => page.evaluate(() => (window as unknown as Win).__BADBOSS__.presenter());

async function boot(page: Page, query = '') {
  await page.goto(`/${query}`);
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__?.state().state === 'READY', null, { timeout: 30_000 });
}

async function untilState(page: Page, s: string, timeout = 45_000) {
  await page.waitForFunction(
    (target) => {
      const h = (window as unknown as Win).__BADBOSS__;
      return !!h && h.state().state === target;
    },
    s,
    { timeout },
  );
}

/** Attend qu'une branche soit jouée. Le crochet n'existe qu'après le démarrage (rechargement !). */
async function untilBranch(page: Page, timeout = 30_000) {
  await page.waitForFunction(
    () => {
      const h = (window as unknown as Win).__BADBOSS__;
      return !!h && h.presenter().branchId !== null;
    },
    null,
    { timeout },
  );
}

async function force(page: Page, forced: object, mode: string | null = null) {
  await page.evaluate(([f, m]) => (window as unknown as Win).__BADBOSS__.server.update((s: any) => (s.nextForced = { mode: m, forced: f })), [forced, mode] as const);
}

async function fault(page: Page, name: string, value: unknown) {
  await page.evaluate(([n, v]) => (window as unknown as Win).__BADBOSS__.server.update((s: any) => (s.faults[n as string] = v)), [name, value] as const);
}

test('LOAD → AUTH → READY → Rage Level → BET → PLAY → REVEAL → END ROUND → READY', async ({ page }) => {
  await boot(page);
  await page.getByTestId('rage-unhinged').click();
  await force(page, { kind: 'WIN', multiplier: 2 });
  const before = (await mock(page)).balance;
  await page.getByTestId('fire').click();
  await expect(page.getByTestId('result')).toHaveAttribute('data-multiplier', '200');
  await untilState(page, 'READY');
  expect(await calls(page)).toMatchObject({ play: 1, endRound: 1 });
  expect((await mock(page)).balance).toBe(before + 1_000_000);
  expect((await mock(page)).lastRound.mode).toBe('unhinged');
});

test('DOUBLE CLICK BET → 1 Play', async ({ page }) => {
  await boot(page);
  await page.getByTestId('fire').dblclick();
  await page.getByTestId('fire').click({ force: true, trial: false }).catch(() => {});
  await untilState(page, 'READY');
  expect((await calls(page)).play).toBe(1);
});

test('PLAY TIMEOUT after request sent → no second Play, same round resumed', async ({ page }) => {
  await boot(page);
  await fault(page, 'playTimeoutAfterSend', true);
  await page.getByTestId('fire').click();
  await untilState(page, 'ROUND_STATUS_UNKNOWN');
  await expect(page.getByTestId('banner')).toContainText('Checking your round');
  await untilState(page, 'READY', 60_000);
  const m = await mock(page);
  expect(m.calls.play).toBe(1);
  expect(m.settledRounds).toBe(1);
  expect(m.activeRound).toBeNull();
});

test('RELOAD AFTER PLAY → round recovered, never replayed as a new bet', async ({ page }) => {
  await boot(page);
  await force(page, { kind: 'BIG_WIN', multiplier: 10 });
  await fault(page, 'playTimeoutAfterSend', true);
  await page.getByTestId('fire').click();
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__.mock().activeRound !== null);
  const roundId = (await mock(page)).activeRound.roundId;
  await page.reload();
  await page.waitForFunction(() => {
    const h = (window as unknown as Win).__BADBOSS__;
    return !!h && ['RESUMING', 'REVEAL', 'READY'].includes(h.state().state);
  });
  await untilState(page, 'READY');
  const m = await mock(page);
  expect(m.calls.play).toBe(1);
  expect(m.lastRound.roundId).toBe(roundId);
  expect(m.lastRound.payoutMultiplier100).toBe(1000);
  await expect(page.getByTestId('result')).toHaveAttribute('data-multiplier', '1000');
});

test('RELOAD DURING ANIMATION → same result, same branch, same seed', async ({ page }) => {
  await boot(page);
  await page.getByTestId('rage-furious').click();
  await force(page, { kind: 'WIN', multiplier: 2, seed: 4242 }, 'furious');
  await page.getByTestId('fire').click();
  await page.waitForFunction(() => {
    const p = (window as unknown as Win).__BADBOSS__.presenter();
    return p.mode === 'playing' && p.t > 1500;
  });
  const before = await presenter(page);
  const roundId = (await mock(page)).activeRound.roundId;
  await page.reload();
  await untilBranch(page);
  const after = await presenter(page);
  expect(after.branchId).toBe(before.branchId);
  expect(after.seed).toBe(4242);
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.state().round?.roundId)).toBe(roundId);
  await untilState(page, 'READY');
  expect((await mock(page)).calls.play).toBe(1);
  expect((await mock(page)).lastRound.roundId).toBe(roundId);
});

test('REPLAY (dev + URL) → same branch and result, no wallet call, no bet possible', async ({ page }) => {
  await boot(page);
  await force(page, { kind: 'BOSS_FIGHT', bossFightRung: 1, seed: 99 });
  await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.flow.setSpeed('turbo'));
  await page.getByTestId('fire').click();
  await untilBranch(page);
  const original = await presenter(page);
  await untilState(page, 'READY', 60_000);
  const revealed = await page.evaluate(() => (window as unknown as Win).__BADBOSS__.state().revealed);
  const c0 = await calls(page);
  await page.evaluate(() => {
    const f = (window as unknown as Win).__BADBOSS__.ctx.flow;
    void f.replayRound(f.lastPresentedRound);
  });
  await untilState(page, 'REPLAYING');
  const replay = await presenter(page);
  expect(replay.branchId).toBe(original.branchId);
  expect(replay.sequenceKey).toBe(original.sequenceKey);
  await untilState(page, 'READY', 60_000);
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.state().revealed)).toEqual(revealed);
  const c1 = await calls(page);
  expect(c1.play).toBe(c0.play);
  expect(c1.endRound).toBe(c0.endRound);

  // Replay par URL (même stockage mock) : jamais de mise possible.
  const url = `/?replay=true&game=bad-boss&version=0&mode=grumpy&event=${revealed.roundId}`;
  await page.goto(url);
  await untilBranch(page);
  expect((await presenter(page)).branchId).toBe(original.branchId);
  await expect(page.getByTestId('fire')).toBeDisabled();
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__.state().revealed !== null, null, { timeout: 60_000 });
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.state().revealed.multiplier100)).toBe(revealed.multiplier100);
  await expect(page.getByTestId('fire')).toBeDisabled();
  expect((await calls(page)).play).toBe(c0.play);
});

test('END ROUND response lost → at most one logical EndRound, round settled once', async ({ page }) => {
  await boot(page);
  await force(page, { kind: 'WIN', multiplier: 3 });
  await fault(page, 'endRoundTimeoutAfterSend', true);
  const before = (await mock(page)).balance;
  await page.getByTestId('fire').click();
  await untilState(page, 'READY', 60_000);
  const m = await mock(page);
  expect(m.calls.play).toBe(1);
  expect(m.calls.endRound).toBe(1);
  expect(m.settledRounds).toBe(1);
  expect(m.balance).toBe(before - 1_000_000 + 3_000_000);
});

test('NETWORK OFFLINE during bet → status unknown, no automatic Play, RETRY resolves', async ({ page }) => {
  await boot(page);
  await fault(page, 'offline', true);
  await page.getByTestId('fire').click();
  await expect(page.getByTestId('retry')).toBeVisible({ timeout: 60_000 });
  expect(await state(page)).toBe('ROUND_STATUS_UNKNOWN');
  expect((await calls(page)).play).toBe(0);
  await fault(page, 'offline', false);
  await page.getByTestId('retry').click();
  await untilState(page, 'READY');
  await expect(page.getByTestId('banner')).toContainText('Bet not placed');
  expect((await calls(page)).play).toBe(0);
});

test('FeatureGate: disabled turbo / super turbo / slamstop are not offered', async ({ page }) => {
  await boot(page);
  await expect(page.getByTestId('skip')).toBeVisible();
  await expect(page.getByTestId('speed-turbo')).toBeVisible();
  await page.evaluate(() =>
    (window as unknown as Win).__BADBOSS__.server.update((s: any) => {
      s.jurisdiction.disabledTurbo = true;
      s.jurisdiction.disabledSuperTurbo = true;
      s.jurisdiction.disabledSlamstop = true;
    }),
  );
  await page.reload();
  await untilState(page, 'READY');
  await expect(page.getByTestId('skip')).toHaveCount(0);
  await expect(page.getByTestId('speed-turbo')).toHaveCount(0);
  await expect(page.getByTestId('speed-super')).toHaveCount(0);
});

test('DEV PANEL: LOOP x20 without bets completes with no error', async ({ page }) => {
  await boot(page, '?dev=1');
  await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.flow.setSpeed('super'));
  await page.getByTestId('loop-run').click();
  await expect(page.getByTestId('loop-progress')).toHaveText('20/20', { timeout: 110_000 });
  const report = await page.evaluate(() => (window as unknown as { __BADBOSS_LOOP__: any }).__BADBOSS_LOOP__);
  expect(report.completed).toBe(20);
  expect(report.revealed).toBe(20);
  expect(report.errors).toEqual([]);
  expect(report.walletCallsDuringLoop).toBe(0);
});

test('DEV PANEL: force outcome + branch + seed through the panel, then preview without bet', async ({ page }) => {
  await boot(page, '?dev=1');
  await page.getByTestId('rage-furious').click();
  await page.getByTestId('dev-kind').selectOption('BIG_WIN');
  await page.getByTestId('dev-mult').selectOption('25');
  await page.getByTestId('dev-seed').fill('777');
  await page.getByTestId('dev-arm').click();
  await page.getByTestId('fire').click();
  await expect(page.getByTestId('result')).toHaveAttribute('data-multiplier', '2500');
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.presenter().seed)).toBe(777);
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.presenter().branchId)).toBe('TRP-BW');
  await untilState(page, 'READY');
  const c = await calls(page);
  await page.getByTestId('dev-preview').click();
  await untilState(page, 'REPLAYING');
  await untilState(page, 'READY');
  expect((await calls(page)).play).toBe(c.play);
});

test('DEV PANEL button: SIMULATE PLAY TIMEOUT AFTER REQUEST SENT → exactly one Play', async ({ page }) => {
  await boot(page, '?dev=1');
  await page.getByTestId('dev-play-timeout').click();
  await untilState(page, 'ROUND_STATUS_UNKNOWN');
  await untilState(page, 'READY', 60_000);
  await expect(page.getByTestId('dev-calls-play')).toHaveText('1');
  expect((await mock(page)).settledRounds).toBe(1);
});

test('PLAYTEST 50 (LOCAL DEV ONLY): 50 uninterrupted rounds, questionnaire at the end only, local export', async ({ page }) => {
  test.setTimeout(420_000);
  await boot(page);
  await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.flow.setSpeed('super'));
  await page.getByTestId('playtest-open').click();
  await page.getByTestId('playtest-go').click();
  await untilState(page, 'READY');
  expect((await mock(page)).balance).toBe(1000 * 1_000_000);
  for (let i = 1; i <= 50; i++) {
    // Aucune interruption pendant les 50 manches.
    await expect(page.getByTestId('questionnaire')).toHaveCount(0);
    await page.getByTestId('fire').click();
    await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__.state().state !== 'READY');
    await untilState(page, 'READY');
  }
  await expect(page.getByTestId('questionnaire')).toBeVisible();
  await expect(page.getByTestId('q-submit')).toBeDisabled();
  for (let q = 1; q <= 6; q++) await page.getByTestId(`q${q}-${(q % 5) + 1}`).check({ force: true });
  await page.getByTestId('q-memorable').fill('Le pigeon qui salue.');
  await page.getByTestId('q-submit').click();
  await expect(page.getByTestId('playtest-results')).toBeVisible();
  const exported = JSON.parse(await page.getByTestId('pt-json').inputValue());
  const session = exported.sessions[0];
  expect(session.rounds).toHaveLength(50);
  expect(session.answers.scores).toEqual([2, 3, 4, 5, 1, 2]);
  expect(session.answers.memorable).toBe('Le pigeon qui salue.');
  expect(Object.keys(session.rounds[0])).toEqual(expect.arrayContaining(['n', 'level', 'gadget', 'outcome', 'multiplier', 'branch', 'animationMs', 'readyToBetMs', 'speed', 'skipped', 'bossFight']));
  expect(session.rounds.every((r: { speed: string }) => r.speed === 'super')).toBe(true);
  await page.getByTestId('pt-close').click();
  // Manche volontaire après la 50e : comptée localement, sans aucune incitation.
  await page.getByTestId('fire').click();
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__.state().state !== 'READY');
  await untilState(page, 'READY');
  const stored = JSON.parse((await page.evaluate(() => localStorage.getItem('badboss.playtest.local-dev-only.v2')))!);
  expect(stored.sessions[0].extraRounds).toBe(1);
});
