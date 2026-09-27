/**
 * E2E — POC « 3 PLANS » (BAD BOSS — 3 GADGET POC), Mock RGS seulement (?poc=3gadget).
 * Sécurité : le choix précède Play ; impossible de changer A/B/C après Play (animation, rechargement, reprise,
 * double tap). Affichage : PRIVATE (jamais d'alternatives), ON-DEMAND (bouton après TOUTES les manches),
 * REVEAL ALL (DEV) ; les autres plans ne déclenchent aucun son.
 */
import { expect, test, type Page } from '@playwright/test';

type Win = Window & { __BADBOSS__: any; __plays?: number };

const state = (page: Page) => page.evaluate(() => (window as unknown as Win).__BADBOSS__.state());
const mock = (page: Page) => page.evaluate(() => (window as unknown as Win).__BADBOSS__.mock());

async function boot(page: Page) {
  await page.goto('/?poc=3gadget');
  await page.waitForFunction(() => (window as unknown as Win).__BADBOSS__?.state().state === 'READY', null, { timeout: 30_000 });
}

async function untilState(page: Page, s: string, timeout = 45_000) {
  await page.waitForFunction((t) => (window as unknown as Win).__BADBOSS__?.state().state === t, s, { timeout });
}

async function forceTriple(page: Page, multipliers: [number, number, number]) {
  await page.evaluate((m) => (window as unknown as Win).__BADBOSS__.server.update((s: any) => (s.nextForcedTriple = { kind: 'multipliers', multipliers: m })), multipliers);
}

async function setAlt(page: Page, mode: 'PRIVATE' | 'ON_DEMAND' | 'REVEAL_ALL') {
  await page.evaluate((m) => (window as unknown as Win).__BADBOSS__.ctx.poc.altDisplay.set(m), mode);
}

async function playRound(page: Page, plan: 'A' | 'B' | 'C', multipliers: [number, number, number]) {
  await forceTriple(page, multipliers);
  await page.getByTestId(`plan-${plan}`).click();
  await page.getByTestId('fire').click();
  await page.waitForFunction(() => {
    const s = (window as unknown as Win).__BADBOSS__.state();
    return s.state === 'READY' && s.revealed !== null;
  }, null, { timeout: 60_000 });
}

test('POC : le plan est choisi AVANT Play, part avec la mise et ne change plus pendant l’animation', async ({ page }) => {
  await boot(page);
  await expect(page.getByTestId('title')).toContainText('3 GADGET POC');
  await expect(page.getByTestId('fire')).toBeDisabled();
  await expect(page.getByTestId('fire')).toHaveText('PICK A PLAN');
  await page.getByTestId('plan-B').click();
  await expect(page.getByTestId('plan-B-mine')).toBeVisible();
  await forceTriple(page, [0, 5, 0]);
  await page.getByTestId('fire').click();
  await untilState(page, 'PRESENTING');
  // Pendant l'animation : les cibles ont disparu, le clavier et l'API refusent tout changement.
  await expect(page.getByTestId('plan-C')).toHaveCount(0);
  await page.keyboard.press('KeyC');
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.flow.setPlan('C'))).toBe(false);
  expect((await state(page)).round.plan).toBe('B');
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.presenter().gadgetId)).toBe('espresso-blaster');
  await expect(page.getByTestId('result')).toHaveAttribute('data-multiplier', '500');
  await untilState(page, 'READY');
  const m = await mock(page);
  expect(m.calls.play).toBe(1);
  expect(m.lastRound.plan).toBe('B');
  expect((await state(page)).plan).toBe('B');
});

test('POC : double tap FIRE → un seul Play, plan inchangé', async ({ page }) => {
  await boot(page);
  await page.getByTestId('plan-A').click();
  await page.getByTestId('fire').dblclick();
  await untilState(page, 'READY');
  const m = await mock(page);
  expect(m.calls.play).toBe(1);
  expect(m.lastRound.plan).toBe('A');
});

test('POC : rechargement pendant la manche → reprise avec le plan du SERVEUR, aucun nouveau choix ni nouveau Play', async ({ page }) => {
  await boot(page);
  await page.getByTestId('plan-C').click();
  await forceTriple(page, [0, 0, 2]);
  await page.getByTestId('fire').click();
  await untilState(page, 'PRESENTING');
  await page.reload();
  await page.waitForFunction(() => {
    const s = (window as unknown as Win).__BADBOSS__?.state();
    return !!s && (s.state === 'RESUMING' || s.state === 'REVEAL');
  }, null, { timeout: 30_000 });
  const s = await state(page);
  expect(s.round.plan).toBe('C');
  expect(s.plan).toBe('C');
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.flow.setPlan('A'))).toBe(false);
  await untilState(page, 'READY');
  const m = await mock(page);
  expect(m.calls.play).toBe(1);
  expect(m.lastRound.plan).toBe('C');
  expect(m.lastRound.payoutMultiplier100).toBe(200);
});

test('POC : PRIVATE ne montre jamais les autres plans', async ({ page }) => {
  await boot(page);
  await setAlt(page, 'PRIVATE');
  await playRound(page, 'A', [0, 25, 10]);
  await expect(page.getByTestId('reveal-other-plans')).toHaveCount(0);
  await expect(page.getByTestId('other-plans')).toHaveCount(0);
});

test('POC : ON-DEMAND propose REVEAL OTHER PLANS après une perte ET après un gain ; les valeurs sont celles du book ; aucun son', async ({ page }) => {
  await boot(page);
  await setAlt(page, 'ON_DEMAND');
  await playRound(page, 'B', [0, 0, 5]);
  await expect(page.getByTestId('reveal-other-plans')).toBeVisible();
  await expect(page.getByTestId('other-plans')).toHaveCount(0);
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
  await page.getByTestId('reveal-other-plans').click();
  const panel = page.getByTestId('other-plans');
  await expect(panel).toBeVisible();
  await expect(page.getByTestId('plan-result-A')).toHaveAttribute('data-multiplier', '0');
  await expect(page.getByTestId('plan-result-B')).toHaveAttribute('data-multiplier', '0');
  await expect(page.getByTestId('plan-result-C')).toHaveAttribute('data-multiplier', '500');
  await expect(page.getByTestId('plan-result-B')).toContainText('YOUR PLAN');
  await expect(page.getByTestId('plan-result-C')).toContainText('OTHER PLAN');
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => (window as unknown as Win).__plays)).toBe(0);
  const last = (await mock(page)).lastRound;
  const triple = last.events.find((e: { type: string }) => e.type === 'triple');
  expect(triple.results.map((r: { multiplier100: number }) => r.multiplier100)).toEqual([0, 0, 500]);
  // Après un gain : même proposition, même traitement.
  await playRound(page, 'B', [10, 2, 0]);
  await expect(page.getByTestId('reveal-other-plans')).toBeVisible();
  await expect(page.getByTestId('other-plans')).toHaveCount(0);
});

test('POC : REVEAL ALL (DEV, expérimental) affiche les trois plans automatiquement après chaque manche', async ({ page }) => {
  await boot(page);
  await setAlt(page, 'REVEAL_ALL');
  await playRound(page, 'C', [2, 0, 0]);
  await expect(page.getByTestId('other-plans')).toBeVisible();
  await expect(page.getByTestId('plan-result-C')).toContainText('YOUR PLAN');
  await playRound(page, 'A', [2, 0, 0]);
  await expect(page.getByTestId('other-plans')).toBeVisible();
});

test('POC : PLAYTEST A/B — ordre tiré, compteur de session, affichage de la variante', async ({ page }) => {
  await boot(page);
  await page.getByTestId('playtest-open').click();
  await expect(page.getByTestId('poc-playtest-intro')).toBeVisible();
  await page.getByTestId('poc-playtest-go').click();
  await untilState(page, 'READY');
  const study = await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.poc.playtest.study);
  expect(['PRIVATE', 'ON_DEMAND']).toContain(study.order[0]);
  expect(study.order[0]).not.toBe(study.order[1]);
  expect(await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.poc.altDisplay.current)).toBe(study.order[0]);
  await expect(page.getByTestId('poc-counter')).toContainText('S1/2 · 1/30');
  await playRound(page, 'A', [0, 0, 0]);
  await expect(page.getByTestId('poc-counter')).toContainText('S1/2 · 2/30');
  const rounds = await page.evaluate(() => (window as unknown as Win).__BADBOSS__.ctx.poc.playtest.session.rounds);
  expect(rounds).toHaveLength(1);
  expect(rounds[0].plan).toBe('A');
  expect(rounds[0].alternatives).toEqual({ A: 0, B: 0, C: 0 });
});
