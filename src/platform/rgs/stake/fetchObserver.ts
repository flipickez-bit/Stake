/**
 * Observateur NON INTRUSIF des réponses du RGS (limite L1 du client `stake-engine` : il perd les codes
 * d'erreur en levant `new Error(objet)`). Il ne modifie ni la requête ni la réponse : il clone seulement
 * les réponses non-2xx dont l'URL commence par la base du RGS, pour en garder le statut et le code.
 * Solution temporaire en attendant un client à erreurs structurées (INFORMATION STAKE ENGINE REQUISE).
 */
export interface ObservedFailure {
  status: number;
  code: string | null;
  message: string | null;
  network: boolean;
}

export class FetchObserver {
  private last: ObservedFailure | null = null;
  private started = 0;
  private installed = false;

  constructor(private readonly rgsBase: string) {}

  install(target: { fetch: typeof fetch } = globalThis): void {
    if (this.installed) return;
    this.installed = true;
    const original = target.fetch.bind(target);
    target.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (!url.startsWith(this.rgsBase)) return original(input, init);
      this.started++;
      try {
        const res = await original(input, init);
        if (!res.ok) {
          let code: string | null = null;
          let message: string | null = null;
          try {
            const body = (await res.clone().json()) as { error?: unknown; code?: unknown; message?: unknown };
            code = typeof body.error === 'string' ? body.error : typeof body.code === 'string' ? body.code : null;
            message = typeof body.message === 'string' ? body.message : null;
          } catch {
            /* corps non JSON */
          }
          this.last = { status: res.status, code, message, network: false };
        }
        return res;
      } catch (err) {
        this.last = { status: 0, code: null, message: String(err), network: true };
        throw err;
      }
    };
  }

  /** Début d'un appel logique : remet les compteurs à zéro. */
  begin(): void {
    this.last = null;
    this.started = 0;
  }

  /** Fin d'un appel logique : ce qui a été observé. */
  end(): { failure: ObservedFailure | null; requestStarted: boolean } {
    return { failure: this.last, requestStarted: this.started > 0 };
  }
}
