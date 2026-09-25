/**
 * Export volontaire d'un fichier texte par le testeur.
 * - Dans la préversion claude.ai : capacité `downloads` (le viewer confirme l'enregistrement).
 * - En local : lien de téléchargement classique.
 * Aucun envoi réseau.
 */
type DownloadsApi = { save(req: { filename: string; data: string }): Promise<unknown> };
type ClaudeHost = { use?: (name: string) => Promise<unknown> };

export type SaveResult = 'saved' | 'declined' | 'unavailable';

export async function saveTextFile(filename: string, text: string): Promise<SaveResult> {
  const host = (globalThis as unknown as { claude?: ClaudeHost }).claude;
  if (host?.use) {
    const downloads = (await host.use('downloads').catch(() => null)) as DownloadsApi | null;
    if (!downloads) return 'unavailable';
    try {
      await downloads.save({ filename, data: text });
      return 'saved';
    } catch (e) {
      return (e as { code?: string })?.code === 'declined' ? 'declined' : 'unavailable';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return 'saved';
}

/** À appeler dans un gestionnaire de clic. false : sélectionner le texte à la main. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
