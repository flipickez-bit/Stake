/** Paramètres de lancement lus dans l'URL (Stake Engine : sessionID, rgs_url, lang, device ; replay : web-sdk 🟡). */
export interface LaunchParams {
  rgs: 'stake' | 'mock';
  sessionID: string | null;
  rgsUrl: string | null;
  lang: string;
  device: 'mobile' | 'desktop' | null;
  replay: { game: string; version: string; mode: string; event: string; amount?: number } | null;
  /** Outils de développement demandés explicitement (?dev=1). */
  devRequested: boolean;
}

export function readLaunchParams(href: string): LaunchParams {
  const url = new URL(href);
  const q = url.searchParams;
  const sessionID = q.get('sessionID');
  const rgsUrl = q.get('rgs_url');
  const device = q.get('device');
  const replay =
    q.get('replay') === 'true'
      ? {
          game: q.get('game') ?? '',
          version: q.get('version') ?? '',
          mode: q.get('mode') ?? '',
          event: q.get('event') ?? '',
          amount: q.get('amount') ? Number(q.get('amount')) : undefined,
        }
      : null;
  return {
    rgs: sessionID && rgsUrl ? 'stake' : 'mock',
    sessionID,
    rgsUrl,
    lang: q.get('lang') ?? 'en',
    device: device === 'mobile' || device === 'desktop' ? device : null,
    replay,
    devRequested: q.get('dev') === '1',
  };
}
