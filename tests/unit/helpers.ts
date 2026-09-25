import { mulberry32 } from '../../src/domain/seed';
import { MockServer } from '../../src/platform/rgs/mock/MockServer';
import { MockRgsAdapter } from '../../src/platform/rgs/mock/MockRgsAdapter';
import { createMemoryStore } from '../../src/platform/storage';

/** Serveur mock déterministe (tests), latence nulle par défaut. */
export function createMock(seed = 1234, latencyMs = 0) {
  const store = createMemoryStore();
  const server = new MockServer(store, mulberry32(seed));
  server.update((s) => (s.faults.latencyMs = latencyMs));
  const adapter = new MockRgsAdapter(server);
  return { store, server, adapter };
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function waitFor(predicate: () => boolean, timeoutMs = 3000, label = 'condition'): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error(`Timeout en attendant : ${label}`);
    await sleep(2);
  }
}
