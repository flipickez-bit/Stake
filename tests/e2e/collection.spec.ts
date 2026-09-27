import { expect, test, type Page } from '@playwright/test';

/**
 * COLLECTION BOOK (Phase 0.5C) : la collection OBSERVE les manches jouées, n'influence rien,
 * ne se débloque jamais par un replay, et l'épisode spécial n'appelle jamais le wallet.
 */
type Win = Window & { __BADBOSS__: any };

const hook = (page: Page) => page.evaluate(() => {
  const h = (window as unknown as Win).__BADBOSS__;
  return { state: h.state().state as string, calls: h.calls(), discovered: h.ctx.collection.progress.discovered as number };
});

/** Mode CLASSIQUE (un gadget par Rage Level) : les flux RGS testés ici sont identiques avec ou sans plans. */
const classic = (query: string) => (query.includes('plans=') ? query : `${query ? `${query}&` : '?'}plans=off`);

async function boot(page: Page, query = '') {
  await page.goto(`/${classic(query)}`);
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__?.state().state === 'READY', null, { timeout: 30_000 });
}

async function untilState(page: Page, s: string, timeout = 45_000) {
  await page.waitForFunction((target) => (window as unknown as Win).__BADBOSS__?.state().state === target, s, { timeout });
}

async function force(page: Page, forced: object, mode: string | null = null) {
  await page.evaluate(([f, m]) => (window as unknown as Win).__BADBOSS__.server.update((s: any) => (s.nextForced = { mode: m, forced: f })), [forced, mode] as const);
}

test('a played round unlocks its card with a NEW badge; the same card again is not NEW; a replay never unlocks', async ({ page }) => {
  await boot(page);
  await expect(page.getByTestId('collection-open')).toHaveText(/0\/\d+/);
  await force(page, { kind: 'LOSS', multiplier: 0, seed: 11, script: 'CLEAN_MISS' });
  await page.getByTestId('fire').click();
  // Une PERTE peut aussi être une découverte.
  const badge = page.getByTestId('new-badge');
  await expect(badge).toBeVisible();
  const branch = await page.evaluate(() => (window as unknown as Win).__BADBOSS__.state().presentation.branchId);
  await expect(badge).toHaveAttribute('data-card', branch);
  await untilState(page, 'READY');
  expect((await hook(page)).discovered).toBe(1);
  await expect(page.getByTestId('collection-open')).toHaveText(/1\/\d+/);

  // Même book (même graine, même script) → même branche → déjà connue : pas de badge.
  await force(page, { kind: 'LOSS', multiplier: 0, seed: 11, script: 'CLEAN_MISS' });
  await page.getByTestId('fire').click();
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__.state().state === 'REVEAL', null, { timeout: 30_000 });
  await page.waitForTimeout(600);
  await expect(badge).toHaveCount(0);
  await untilState(page, 'READY');
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.collection.state.entries)).toMatchObject({ [branch]: { seen: 2 } });

  // Replay (aucune mise) d'une manche inconnue : REPLAY DOES NOT UNLOCK COLLECTION.
  const before = await hook(page);
  await page.evaluate(() => {
    void (window as unknown as Win).__BADBOSS__.dev.preview('unhinged', { kind: 'BIG_WIN', multiplier: 10 });
  });
  await untilState(page, 'REPLAYING');
  await untilState(page, 'READY');
  const after = await hook(page);
  expect(after.discovered).toBe(before.discovered);
  expect(after.calls).toEqual(before.calls);
});

test('RESUME: a round interrupted before its reveal unlocks its card once, at the resumed reveal', async ({ page }) => {
  await boot(page);
  await page.getByTestId('rage-furious').click();
  await force(page, { kind: 'WIN', multiplier: 2, seed: 4242 }, 'furious');
  await page.getByTestId('fire').click();
  await page.waitForFunction(() => {
    const p = (window as unknown as Win).__BADBOSS__.presenter();
    return p.mode === 'playing' && p.reveal !== null && p.t > 600 && p.t < p.reveal - 500;
  });
  expect((await hook(page)).discovered).toBe(0);
  await page.reload();
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__?.state().state === 'READY', null, { timeout: 60_000 });
  const entries = await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.collection.state.entries);
  const ids = Object.keys(entries);
  expect(ids).toHaveLength(1);
  expect(entries[ids[0]!]).toMatchObject({ seen: 1, source: 'resume' });
});

test('COLLECTION BOOK + DEBUG: tabs, card detail; OFFICE MELTDOWN at 4 with each of the 9 gadgets (no BOSS FIGHT card), played with no wallet call; 100 % = trophy', async ({ page }) => {
  await boot(page);
  const T = await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.collection.catalog.cards.length as number);
  await page.getByTestId('dev-toggle').click();
  await page.getByTestId('dev-coll-random10').click();
  await expect(page.getByTestId('dev-coll-count')).toContainText(`10 / ${T}`);
  await page.getByTestId('dev-coll-view').click();
  const book = page.getByTestId('collection-book');
  await expect(book).toBeVisible();
  await expect(page.getByTestId('collection-progress')).toContainText(`10 / ${T} discovered · ${T - 10} to find`);
  // Rareté cachée et indice seulement sur les cartes manquantes.
  const missing = book.locator('[data-found=false]').first();
  await expect(missing).toContainText('???');
  await expect(missing).not.toContainText(/COMMON|RARE/);
  await page.getByTestId('tab-bossfight').click();
  await page.getByTestId('tab-rewards').click();
  await expect(page.getByTestId('milestone-count-10')).toHaveAttribute('data-reached', 'true');
  await expect(page.getByTestId('meltdown-progress')).toBeVisible();
  // Une carte découverte : fiche détaillée.
  await page.getByTestId('tab-grumpy').click();
  const found = book.locator('[data-found=true]');
  if (await found.count()) {
    await found.first().click();
    await expect(page.getByTestId('card-detail')).toBeVisible();
    await page.getByTestId('card-detail-close').click();
  }
  await page.getByTestId('collection-close').click();

  // 4 découvertes avec 8 gadgets, 3 avec le 9e, aucune carte BOSS FIGHT : progression factuelle, épisode verrouillé.
  await page.getByTestId('dev-toggle').click();
  await page.getByTestId('dev-coll-788').click();
  await expect(page.getByTestId('dev-coll-count')).toContainText(`35 / ${T}`);
  await page.getByTestId('dev-coll-view').click();
  await page.getByTestId('tab-rewards').click();
  await expect(page.getByTestId('meltdown-swivel-slingshot')).toContainText('3 / 4');
  await expect(page.getByTestId('meltdown-swivel-slingshot')).not.toContainText('✓');
  await expect(page.getByTestId('meltdown-espresso-blaster')).toContainText('4 / 4 ✓');
  await expect(page.getByTestId('meltdown-hvac-hurricane')).toContainText('4 / 4 ✓');
  await expect(page.getByTestId('meltdown-total')).toHaveText('35 / 36 required discoveries');
  await expect(page.getByTestId('episode-play')).toHaveCount(0);
  await page.getByTestId('collection-close').click();

  // Une découverte avec le SWIVEL SLINGSHOT (GRUMPY) → 4 avec chacun des 9 gadgets : l'épisode est débloqué, jamais ouvert automatiquement.
  await page.getByTestId('dev-toggle').click();
  await page.getByTestId('dev-coll-new').click();
  await page.getByLabel('Close dev panel').click();
  await expect(page.getByTestId('new-badge-unlock')).toContainText('OFFICE MELTDOWN');
  await expect(page.getByTestId('showcase')).toHaveCount(0);

  const calls = (await hook(page)).calls;
  await page.getByTestId('collection-open').click();
  await page.getByTestId('tab-rewards').click();
  await expect(page.getByTestId('meltdown-total')).toHaveText('36 / 36 required discoveries');
  await page.getByTestId('episode-play').click();
  const show = page.getByTestId('showcase');
  await expect(show).toBeVisible();
  // Aucun chiffre ni bouton FIRE pendant l'épisode.
  await expect(page.getByTestId('result')).toHaveCount(0);
  await expect(page.getByTestId('fire')).toHaveCount(0);
  for (let i = 0; i < 4; i++) {
    await expect(show).toHaveAttribute('data-phase', 'between', { timeout: 30_000 });
    await page.getByTestId('showcase-next').click();
  }
  await expect(page.getByTestId('showcase-end')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('showcase-exit').click();
  await untilState(page, 'READY');
  const after = await hook(page);
  expect(after.calls).toEqual(calls);
  await expect(page.getByTestId('fire')).toBeEnabled();

  // 100 % : trophée de collectionneur sur l'album (cosmétique uniquement).
  await page.getByTestId('dev-toggle').click();
  await page.getByTestId('dev-coll-49').click();
  await page.getByTestId('dev-coll-new').click();
  await page.getByTestId('dev-coll-new').click();
  await expect(page.getByTestId('dev-coll-count')).toContainText(`${T} / ${T}`);
  await page.getByTestId('dev-coll-view').click();
  await expect(page.getByTestId('collector-trophy')).toBeVisible();
});

test('URL replay: no collection at all (no button, no badge, no storage)', async ({ page }) => {
  await boot(page);
  await page.getByTestId('fire').click();
  await untilState(page, 'READY');
  const roundId = await page.evaluate(() => (window as unknown as Win).__BADBOSS__.mock().lastRound.roundId);
  await page.goto(`/?replay=true&game=bad-boss&version=1&mode=grumpy&event=${roundId}`);
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__?.state().state === 'REPLAYING', null, { timeout: 30_000 });
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.collection)).toBeNull();
  await expect(page.getByTestId('collection-open')).toHaveCount(0);
});
