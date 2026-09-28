/**
 * E2E — OTHER PLANS (Mock RGS, 3 gadgets par Rage Level).
 * Décision utilisateur (2026-09-28, après P3.1) : les résultats des autres plans s'affichent OBLIGATOIREMENT après chaque
 * manche (REVEAL_ALL par défaut), après le vol de la carte NEW éventuelle. Le panneau montre les trois plans dans l'ordre de
 * l'écran, avec les valeurs EXACTES du book. Information seulement : aucun son de gain, aucune découverte de collection,
 * aucune suggestion de plan.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

type Win = Window & { __BADBOSS__: any; __sounds?: string[] };
const B = (page: Page) => page.evaluate(() => (window as unknown as Win).__BADBOSS__.state());
/** Sons réservés aux gains (src/audio/soundKit.ts, WIN_SOUNDS). */
const WIN_SOUNDS = ['ding', 'gold', 'cheer', 'brass'];

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
  if ((await B(page)).plan !== plan) {
    // Le panneau (affiché d'office) couvre les gadgets : pour CHANGER de plan, on passe par CHOOSE ANOTHER PLAN.
    if (await page.getByTestId('other-plans').count()) await page.getByTestId('other-plans-choose').click();
    await page.getByTestId(`plan-${plan}`).click();
  }
  await page.getByTestId('fire').click();
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__.state().state !== 'READY', null, { timeout: 10_000 });
  await untilRevealedReady(page);
}

/** Enregistre le nom de chaque son joué. */
async function spyAudio(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as Win;
    const audio = w.__BADBOSS__.ctx.audio;
    const orig = audio.play.bind(audio);
    w.__sounds = [];
    audio.play = (sound: string, ...rest: unknown[]) => {
      w.__sounds!.push(sound);
      return orig(sound, ...rest);
    };
  });
}
const sounds = (page: Page): Promise<string[]> => page.evaluate(() => (window as unknown as Win).__sounds ?? []);

const overlap = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

async function boxOf(l: Locator) {
  const b = await l.boundingBox();
  expect(b).not.toBeNull();
  return b!;
}

test('défaut (sans PLAYTEST) : affichage OBLIGATOIRE — les 3 résultats s\'affichent seuls après LOSS, x0.5, WIN et BIG WIN', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.poc.altDisplay.current)).toBe('REVEAL_ALL');
  await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.flow.setSpeed('super'));
  for (const [label, m] of [['LOSS', [2, 0, 5]], ['x0.5', [0, 0.5, 0]], ['WIN', [0, 2, 0]], ['BIG WIN', [0, 10, 0]]] as const) {
    await playRound(page, 'B', [...m] as [number, number, number]);
    const panel = page.getByTestId('other-plans');
    await expect(panel, label).toBeVisible({ timeout: 5_000 });
    await expect(panel, label).toBeInViewport({ ratio: 1 });
    // Aucun geste requis : pas de bouton « REVEAL », le panneau est déjà là.
    await expect(page.getByTestId('reveal-other-plans'), label).toHaveCount(0);
    await expect(page.getByTestId('plan-result-B'), label).toHaveAttribute('data-mine', 'true');
  }
});

test('NEW COLLECTION : le panneau s\'affiche APRÈS le vol de la carte NEW, et y reste', async ({ page }) => {
  await boot(page);
  await forceTriple(page, [0, 2, 0]);
  await page.getByTestId('plan-B').click();
  await page.getByTestId('fire').click();
  await untilRevealedReady(page);
  const card = page.getByTestId('new-badge');
  if (await card.count()) await expect(page.getByTestId('other-plans')).toHaveCount(0);
  await expect(card).toHaveCount(0, { timeout: 5_000 });
  await expect(page.getByTestId('other-plans')).toBeVisible();
  await page.waitForTimeout(4_000);
  await expect(page.getByTestId('other-plans')).toBeVisible();
});

test('panneau : ordre de l\'écran, YOUR PLAN, valeurs = triple du book ; aucun son de gain ; aucune découverte ; reste affiché', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.flow.setSpeed('super'));
  await spyAudio(page);
  // Plan B perd (x0) ; A et C portaient des gains (x10, x5) : jamais célébrés, jamais débloqués.
  await playRound(page, 'B', [10, 0, 5]);
  const panel = page.getByTestId('other-plans');
  await expect(panel).toBeVisible({ timeout: 5_000 });
  const screenOrder = await page.evaluate(() =>
    [...(window as unknown as Win).__BADBOSS__.dev.planRects()].sort((a: any, b: any) => a.x + a.w / 2 - (b.x + b.w / 2)).map((r: any) => r.slot),
  );
  const shown = await panel.locator('[data-testid^="plan-result-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!.slice(-1)));
  expect(shown).toEqual(screenOrder);
  await expect(page.getByTestId('plan-result-B')).toHaveAttribute('data-mine', 'true');
  await expect(page.getByTestId('plan-result-B')).toContainText('YOUR PLAN');
  for (const s of ['A', 'C']) {
    await expect(page.getByTestId(`plan-result-${s}`)).toHaveAttribute('data-mine', 'false');
    await expect(page.getByTestId(`plan-result-${s}`)).toContainText('OTHER PLAN');
  }
  const last = await page.evaluate(() => (window as unknown as Win).__BADBOSS__.mock().lastRound);
  const triple = last.events.find((e: { type: string }) => e.type === 'triple');
  for (const [i, s] of ['A', 'B', 'C'].entries()) {
    await expect(page.getByTestId(`plan-result-${s}`)).toHaveAttribute('data-multiplier', String(triple.results[i].multiplier100));
  }
  await expect(panel).not.toContainText('WIN');
  await expect(panel).not.toContainText('$');
  // Manche perdue, alternatives gagnantes : la manche a bien sonné (espion actif), mais AUCUN son de gain…
  const during = await sounds(page);
  expect(during.length).toBeGreaterThan(0);
  expect(during.filter((x) => WIN_SOUNDS.includes(x))).toEqual([]);
  // … et plus rien du tout pendant l'affichage du panneau, qui reste là.
  await page.waitForTimeout(6_000);
  await expect(panel).toBeVisible();
  expect(await sounds(page)).toEqual(during);
  // Seul le gadget JOUÉ découvre une carte.
  const gadgets = await page.evaluate(() => {
    const c = (window as unknown as Win).__BADBOSS__.ctx.collection;
    return Object.keys(c.state.entries).map((id: string) => c.catalog.byId.get(id).gadgetId);
  });
  expect(new Set(gadgets)).toEqual(new Set(['espresso-blaster']));
});

test('REPLAY PLAN et FIRE lancent la manche suivante ; CHOOSE ANOTHER PLAN rend le choix au joueur', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.flow.setSpeed('super'));
  await playRound(page, 'B', [0, 2, 0]);
  await expect(page.getByTestId('other-plans')).toBeVisible({ timeout: 5_000 });
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
  // Panneau affiché → FIRE (barre du bas) reste accessible et lance la manche suivante.
  await expect(page.getByTestId('other-plans')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByTestId('fire')).toBeEnabled();
  await forceTriple(page, [0, 0, 0]);
  await page.getByTestId('fire').click();
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__.state().state !== 'READY', null, { timeout: 10_000 });
  await untilRevealedReady(page);
  // CHOOSE ANOTHER PLAN : le panneau se ferme, les trois gadgets se signalent, le joueur choisit librement.
  await expect(page.getByTestId('other-plans')).toBeVisible({ timeout: 5_000 });
  await page.getByTestId('other-plans-choose').click();
  await expect(page.getByTestId('other-plans')).toHaveCount(0);
  await expect(page.getByTestId('plan-picker')).toHaveAttribute('data-attention', 'true');
  await page.getByTestId('plan-C').click();
  expect((await B(page)).plan).toBe('C');
});

test('PLAYTEST #3 impose l\'affichage obligatoire (même après PRIVATE) et rend le réglage à la fin', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.poc.altDisplay.set('PRIVATE'));
  await page.getByTestId('playtest-open').click();
  await page.getByTestId('playtest-go').click();
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__?.state().state === 'READY', null, { timeout: 30_000 });
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.poc.altDisplay.current)).toBe('REVEAL_ALL');
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.playtest.current.altDisplay)).toBe('REVEAL_ALL');
  await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.flow.setSpeed('super'));
  await playRound(page, 'A', [0, 2, 5]);
  await expect(page.getByTestId('other-plans')).toBeVisible({ timeout: 5_000 });
  await playRound(page, 'A', [0, 0, 0]);
  await expect(page.getByTestId('other-plans')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByTestId('reveal-other-plans')).toHaveCount(0);
  // Fin de session (abandon DEV) : le réglage d'avant est rendu.
  await page.getByTestId('dev-toggle').click();
  await page.getByTestId('dev-pt-abort').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.poc.altDisplay.current)).toBe('PRIVATE');
});

for (const vp of [{ width: 360, height: 640 }, { width: 390, height: 844 }, { width: 430, height: 932 }]) {
  test(`mobile ${vp.width}×${vp.height} : panneau affiché seul, entièrement visible, sans recouvrir le résultat, FIRE ni COLLECTION`, async ({ page }) => {
    await page.setViewportSize(vp);
    await boot(page);
    await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.flow.setSpeed('super'));
    await playRound(page, 'B', [5, 0, 2]);
    await expect(page.getByTestId('new-badge')).toHaveCount(0, { timeout: 5_000 });
    const panel = page.getByTestId('other-plans');
    await expect(panel).toBeInViewport({ ratio: 1 });
    for (const k of [page.getByTestId('result'), page.getByTestId('fire'), page.getByTestId('collection-open')]) {
      expect(overlap(await boxOf(panel), await boxOf(k))).toBe(false);
    }
    await page.screenshot({ path: `docs/production/p3_1/otherplans-auto-${vp.width}x${vp.height}.jpg`, type: 'jpeg', quality: 80 });
  });
}
