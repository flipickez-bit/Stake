/** Types de base du domaine BAD BOSS. Aucune dépendance (ni Pixi, ni Svelte, ni Stake). */

export type RageLevelId = 'grumpy' | 'furious' | 'unhinged';
export const RAGE_LEVEL_IDS: readonly RageLevelId[] = ['grumpy', 'furious', 'unhinged'];

/** Classe de résultat, dérivée UNIQUEMENT du multiplicateur (GDD_02 §3.5). */
export type ResultClass = 'MISS' | 'SCRAPE' | 'HIT' | 'BIG' | 'MEGA' | 'LEGENDARY';

/** Catégorie de mise en scène tirée par la génération mathématique (GDD_02 §3.6). */
export type Script =
  | 'CLEAN_MISS'
  | 'BACKFIRE'
  | 'TEASE'
  | 'GRAZE'
  | 'DIRECT'
  | 'COMEBACK'
  | 'CHAIN'
  | 'SUPER'
  | 'BF_ENTRY';

export type Rarity = 'common' | 'rare' | 'epic';

export type Speed = 'normal' | 'turbo' | 'super';

export function isRageLevelId(value: unknown): value is RageLevelId {
  return typeof value === 'string' && (RAGE_LEVEL_IDS as readonly string[]).includes(value);
}
