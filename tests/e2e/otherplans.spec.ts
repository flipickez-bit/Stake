/**
 * E2E — P3.1 OTHER PLANS (Mock RGS, 3 gadgets par Rage Level).
 * ON-DEMAND est l'expérience principale : l'action « REVEAL OTHER PLANS » est visible après TOUTES les manches, après le
 * vol de la carte NEW, et le panneau montre les trois plans dans l'ordre de l'écran, avec les valeurs EXACTES du book.
 * Information seulement : aucun son, aucune découverte de collection, aucune suggestion de plan.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

type Win = Window & { __BADBOSS__: any; __plays?: number };
const B = (page: Page) => page.evaluate(() => (window as unknown as Win).__BADBOSS__.state());

async function boot(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__?.state().state === 'READY', null, { timeout: 30_000 });
}

async function forceTriple(page: Page, multipliers: [number, number, number]) {
  await page.evaluate((m) => (window as unknown as Win).__BADBOSS__.server.update((s: any) => (s.nextForcedTriple = { kind: 'multipliers', multipliers: m })), multipliers);
}

async function untilRevealedReady(page: Page) {
  await page.waitForFunction(() => {
    const s = (window as unknown as Win).__BADBOSS__.state();
    return s.state === 'READY' && s.revealed !== null;
  }, null, { timeout: 60_000 });
}

async function playRound(page: Page, plan: 'A' | 'B' | 'C', multipliers: [number, number, number]) {
  await forceTriple(page, multipliers);
  // Le panneau ouvert couvre les gadgets : on ne les touche que pour CHANGER de plan (sinon FIRE rejoue le même plan).
  if ((await B(page)).plan !== plan) await page.getByTestId(`plan-${plan}`).click();
  await page.getByTestId('fire').click();
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__.state().state !== 'READY', null, { timeout: 10_000 });
  await untilRevealedReady(page);
}

async function spyAudio(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as Win;
    const audio = w.__BADBOSS__.ctx.audio;
    const orig = audio.play.bind(audio);
    w.__plays = 0;
    audio.play = (...args: unknown[]) => {
      w.__plays = (w.__plays ?? 0) + 1;
      return orig(...args);
    };
  });
}

const overlap = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

async function boxOf(l: Locator) {
  const b = await l.boundingBox();
  expect(b).not.toBeNull();
  return b!;
}

test('P3.1 : réglages par défaut (sans PLAYTEST) → ON-DEMAND ; bouton visible après LOSS, x0.5, WIN et BIG WIN', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.poc.altDisplay.current)).toBe('ON_DEMAND');
  await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.flow.setSpeed('super'));
  for (const [label, m] of [['LOSS', [2, 0, 5]], ['x0.5', [0, 0.5, 0]], ['WIN', [0, 2, 0]], ['BIG WIN', [0, 10, 0]]] as const) {
    await playRound(page, 'B', [...m] as [number, number, number]);
    const ask = page.getByTestId('reveal-other-plans');
    await expect(ask, label).toBeVisible({ timeout: 5_000 });
    await expect(ask, label).toBeInViewport({ ratio: 1 });
    // Lisible : au moins 44 px de haut (cible tactile), jamais un lien minuscule.
    expect((await boxOf(ask)).height, label).toBeGreaterThanOrEqual(44);
  }
});

test('P3.1 : NEW COLLECTION → l\'action apparaît APRÈS le vol de la carte NEW, et y reste', async ({ page }) => {
  await boot(page);
  await forceTriple(page, [0, 2, 0]);
  await page.getByTestId('plan-B').click();
  await page.getByTestId('fire').click();
  await untilRevealedReady(page);
  // La carte NEW vole vers le livre ; l'action attend son arrivée, puis s'affiche.
  const card = page.getByTestId('new-badge');
  if (await card.count()) await expect(page.getByTestId('reveal-other-plans')).toHaveCount(0);
  await expect(card).toHaveCount(0, { timeout: 5_000 });
  await expect(page.getByTestId('reveal-other-plans')).toBeVisible();
  await page.waitForTimeout(4_000);
  await expect(page.getByTestId('reveal-other-plans')).toBeVisible();
});

test('P3.1 : panneau — A/B/C dans l\'ordre de l\'écran, YOUR PLAN, valeurs = triple du book, 0 son, 0 découverte, reste ouvert', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.flow.setSpeed('super'));
  // Plan B perd (x0) ; A et C portaient des gains (x10, x5) : jamais célébrés, jamais débloqués.
  await playRound(page, 'B', [10, 0, 5]);
  await expect(page.getByTestId('new-badge')).toHaveCount(0, { timeout: 5_000 });
  const before = await page.evaluate(() => Object.keys((window as unknown as Win).__BADBOSS__.ctx.collection.state.entries));
  await spyAudio(page);
  await page.getByTestId('reveal-other-plans').click();
  const panel = page.getByTestId('other-plans');
  await expect(panel).toBeVisible();
  // Ordre = positions à l'écran (de gauche à droite).
  const screenOrder = await page.evaluate(() =>
    [...(window as unknown as Win).__BADBOSS__.dev.planRects()].sort((a: any, b: any) => a.x + a.w / 2 - (b.x + b.w / 2)).map((r: any) => r.slot),
  );
  const shown = await panel.locator('[data-testid^="plan-result-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!.slice(-1)));
  expect(shown).toEqual(screenOrder);
  // YOUR PLAN / OTHER PLAN.
  await expect(page.getByTestId('plan-result-B')).toHaveAttribute('data-mine', 'true');
  await expect(page.getByTestId('plan-result-B')).toContainText('YOUR PLAN');
  for (const s of ['A', 'C']) {
    await expect(page.getByTestId(`plan-result-${s}`)).toHaveAttribute('data-mine', 'false');
    await expect(page.getByTestId(`plan-result-${s}`)).toContainText('OTHER PLAN');
  }
  // Valeurs = triple exact du book de la manche.
  const last = await page.evaluate(() => (window as unknown as Win).__BADBOSS__.mock().lastRound);
  const triple = last.events.find((e: { type: string }) => e.type === 'triple');
  for (const [i, s] of ['A', 'B', 'C'].entries()) {
    await expect(page.getByTestId(`plan-result-${s}`)).toHaveAttribute('data-multiplier', String(triple.results[i].multiplier100));
  }
  // Information seulement : aucun gain affiché en argent, aucun son, aucune découverte.
  await expect(panel).not.toContainText('WIN');
  await expect(panel).not.toContainText('$');
  await page.waitForTimeout(6_000);
  await expect(panel).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as Win).__plays)).toBe(0);
  const after = await page.evaluate(() => Object.keys((window as unknown as Win).__BADBOSS__.ctx.collection.state.entries));
  expect(after).toEqual(before);
  const gadgets = await page.evaluate(() => {
    const c = (window as unknown as Win).__BADBOSS__.ctx.collection;
    return Object.keys(c.state.entries).map((id: string) => c.catalog.byId.get(id).gadgetId);
  });
  expect(new Set(gadgets)).toEqual(new Set(['espresso-blaster']));
});

test('P3.1 : REPLAY PLAN et FIRE lancent la manche suivante ; CHOOSE ANOTHER PLAN rend le choix au joueur', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.flow.setSpeed('super'));
  await playRound(page, 'B', [0, 2, 0]);
  await page.getByTestId('reveal-other-plans').click();
  await expect(page.getByTestId('other-plans')).toBeVisible();
  // REPLAY PLAN B : nouvelle manche, même plan.
  await forceTriple(page, [0, 0, 0]);
  const calls0 = (await page.evaluate(() => (window as unknown as Win).__BADBOSS__.mock())).calls.play;
  await page.getByTestId('other-plans-replay').click();
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__.state().state !== 'READY', null, { timeout: 10_000 });
  await untilRevealedReady(page);
  expect((await page.evaluate(() => (window as unknown as Win).__BADBOSS__.mock())).calls.play).toBe(calls0 + 1);
  const replayed = (await page.evaluate(() => (window as unknown as Win).__BADBOSS__.mock())).lastRound;
  expect(replayed.events.find((e: { type: string }) => e.type === 'pick').slot).toBe('B');
  expect((await B(page)).plan).toBe('B');
  // Panneau ouvert → FIRE (barre du bas) reste accessible et lance la manche suivante.
  await page.getByTestId('reveal-other-plans').click();
  await expect(page.getByTestId('other-plans')).toBeVisible();
  await expect(page.getByTestId('fire')).toBeEnabled();
  await forceTriple(page, [0, 0, 0]);
  await page.getByTestId('fire').click();
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__.state().state !== 'READY', null, { timeout: 10_000 });
  await untilRevealedReady(page);
  // CHOOSE ANOTHER PLAN : le panneau se ferme, les trois gadgets se signalent, le joueur choisit librement.
  await page.getByTestId('reveal-other-plans').click();
  await page.getByTestId('other-plans-choose').click();
  await expect(page.getByTestId('other-plans')).toHaveCount(0);
  await expect(page.getByTestId('plan-picker')).toHaveAttribute('data-attention', 'true');
  await page.getByTestId('plan-C').click();
  expect((await B(page)).plan).toBe('C');
});

test('P3.1 : PLAYTEST #3 impose ON-DEMAND (même après PRIVATE), indication unique après la 1re manche, réglage rendu à la fin', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.poc.altDisplay.set('PRIVATE'));
  await page.getByTestId('playtest-open').click();
  await page.getByTestId('playtest-go').click();
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__?.state().state === 'READY', null, { timeout: 30_000 });
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.poc.altDisplay.current)).toBe('ON_DEMAND');
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.playtest.current.altDisplay)).toBe('ON_DEMAND');
  await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.flow.setSpeed('super'));
  await playRound(page, 'A', [0, 2, 5]);
  await expect(page.getByTestId('other-plans-hint')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByTestId('other-plans-hint')).toContainText('See what the other plans held');
  await page.getByTestId('reveal-other-plans').click();
  await expect(page.getByTestId('other-plans-hint')).toHaveCount(0);
  await playRound(page, 'A', [0, 0, 0]);
  await expect(page.getByTestId('reveal-other-plans')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByTestId('other-plans-hint')).toHaveCount(0);
  // Fin de session (abandon DEV) : le réglage d'avant est rendu.
  await page.getByTestId('dev-toggle').click();
  await page.getByTestId('dev-pt-abort').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.poc.altDisplay.current)).toBe('PRIVATE');
});

for (const vp of [{ width: 360, height: 640 }, { width: 390, height: 844 }, { width: 430, height: 932 }]) {
  test(`P3.1 mobile ${vp.width}×${vp.height} : action et panneau visibles, sans recouvrir le résultat, FIRE ni COLLECTION`, async ({ page }) => {
    await page.setViewportSize(vp);
    await boot(page);
    await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.flow.setSpeed('super'));
    await playRound(page, 'B', [5, 0, 2]);
    await expect(page.getByTestId('new-badge')).toHaveCount(0, { timeout: 5_000 });
    const ask = page.getByTestId('reveal-other-plans');
    await expect(ask).toBeInViewport({ ratio: 1 });
    const keep = [page.getByTestId('result'), page.getByTestId('fire'), page.getByTestId('collection-open')];
    for (const k of keep) expect(overlap(await boxOf(ask), await boxOf(k))).toBe(false);
    await page.screenshot({ path: `docs/production/p3_1/otherplans-button-${vp.width}x${vp.height}.jpg`, type: 'jpeg', quality: 80 });
    await ask.click();
    const panel = page.getByTestId('other-plans');
    await expect(panel).toBeInViewport({ ratio: 1 });
    for (const k of keep) expect(overlap(await boxOf(panel), await boxOf(k))).toBe(false);
    await page.screenshot({ path: `docs/production/p3_1/otherplans-panel-${vp.width}x${vp.height}.jpg`, type: 'jpeg', quality: 80 });
  });
}
