/** Stockage clé/valeur tolérant : localStorage si disponible, sinon mémoire (navigation privée, tests, iframe). */
export interface KeyValueStore {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

export function createMemoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    get: <T>(key: string) => {
      const v = map.get(key);
      return v === undefined ? null : (JSON.parse(v) as T);
    },
    set: (key, value) => void map.set(key, JSON.stringify(value)),
    remove: (key) => void map.delete(key),
  };
}

export function createBrowserStore(): KeyValueStore {
  const memory = createMemoryStore();
  const ls = (() => {
    try {
      const probe = '__bb_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    } catch {
      return null;
    }
  })();
  if (!ls) return memory;
  return {
    get: <T>(key: string) => {
      try {
        const v = ls.getItem(key);
        return v === null ? null : (JSON.parse(v) as T);
      } catch {
        return memory.get<T>(key);
      }
    },
    set: (key, value) => {
      try {
        ls.setItem(key, JSON.stringify(value));
      } catch {
        memory.set(key, value);
      }
    },
    remove: (key) => {
      try {
        ls.removeItem(key);
      } catch {
        memory.remove(key);
      }
    },
  };
}
