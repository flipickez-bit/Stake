import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RGS = 'rgs.example.test';
const HREF = `https://game.example.test/index.html?sessionID=abc&rgs_url=${RGS}&lang=fr&device=mobile`;

type Handler = (url: string, body: unknown) => { status: number; json: unknown } | 'hang';
let handler: Handler;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  (globalThis as { window?: unknown }).window ??= { dispatchEvent: () => true };
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const out = handler(url, init?.body ? JSON.parse(String(init.body)) : null);
    if (out === 'hang') return new Promise<Response>(() => {});
    return new Response(JSON.stringify(out.json), { status: out.status, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

const AUTH = {
  balance: { amount: 5_000_000, currency: 'EUR' },
  config: {
    minBet: 100_000, maxBet: 10_000_000, stepBet: 100_000, defaultBetLevel: 1_000_000,
    betLevels: [100_000, 1_000_000],
    jurisdiction: { disabledTurbo: true, minimumRoundDuration: 3, disabledSlamstop: true },
  },
  round: null as unknown,
};
const book = [{ type: 'presentation', script: 'DIRECT', rarity: 'common', seed: 7 }, { type: 'finalWin', amount: 200 }];

describe('StakeRgsAdapter (client stake-engine enveloppé)', () => {
  it('convertit Authenticate vers les modèles internes', async () => {
    handler = () => ({ status: 200, json: { ...AUTH, round: { betID: 9, amount: 1_000_000, payout: 2_000_000, payoutMultiplier: 2, active: true, mode: 'FURIOUS', state: book } } });
    const { StakeRgsAdapter } = await import('../../src/platform/rgs/stake/StakeRgsAdapter');
    const a = new StakeRgsAdapter(HREF);
    const auth = await a.authenticate();
    expect(auth.balance).toEqual({ amount: 5_000_000, currency: 'EUR' });
    expect(auth.jurisdiction.disabledTurbo).toBe(true);
    expect(auth.jurisdiction.minimumRoundDuration).toBe(3);
    expect(auth.activeRound).toMatchObject({ roundId: '9', mode: 'furious', payoutMultiplier100: 200, active: true });
    expect(auth.activeRound?.events).toEqual(book);
  });

  it('récupère le code ERR_* perdu par le client (observateur de fetch)', async () => {
    handler = (url) =>
      url.endsWith('/wallet/authenticate') ? { status: 200, json: AUTH } : { status: 400, json: { error: 'ERR_IPB', message: 'Insufficient Player Balance' } };
    const { StakeRgsAdapter } = await import('../../src/platform/rgs/stake/StakeRgsAdapter');
    const a = new StakeRgsAdapter(HREF);
    await a.authenticate();
    await expect(a.play(1_000_000, 'grumpy')).rejects.toMatchObject({ kind: 'rgs', code: 'ERR_IPB' });
  });

  it('après un Play sans réponse, la resynchronisation crée un client neuf (plus de verrou bloqué)', async () => {
    let plays = 0;
    handler = (url) => {
      if (url.endsWith('/wallet/authenticate')) return { status: 200, json: AUTH };
      if (url.endsWith('/wallet/play')) {
        plays++;
        return plays === 1 ? 'hang' : { status: 200, json: { balance: AUTH.balance, round: { betID: 2, amount: 1_000_000, payout: 0, active: true, mode: 'grumpy', state: [{ type: 'presentation', script: 'CLEAN_MISS', rarity: 'common', seed: 1 }] } } };
      }
      return { status: 200, json: {} };
    };
    const { StakeRgsAdapter } = await import('../../src/platform/rgs/stake/StakeRgsAdapter');
    const a = new StakeRgsAdapter(HREF);
    await a.authenticate();
    void a.play(1_000_000, 'grumpy'); // pend indéfiniment
    await new Promise((r) => setTimeout(r, 10));
    await expect(a.play(1_000_000, 'grumpy')).rejects.toMatchObject({ kind: 'client' }); // verrou local du client
    await a.getActiveRound(); // client neuf
    await expect(a.play(1_000_000, 'grumpy')).resolves.toBeTruthy();
  });

  it('aucun fichier hors de platform/rgs/stake n\'importe le SDK stake-engine', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|svelte)$/.test(name) && !p.includes(join('platform', 'rgs', 'stake'))) {
          if (/from ['"]stake-engine['"]/.test(readFileSync(p, 'utf8'))) offenders.push(p);
        }
      }
    };
    walk(join(process.cwd(), 'src'));
    expect(offenders).toEqual([]);
  });
});
