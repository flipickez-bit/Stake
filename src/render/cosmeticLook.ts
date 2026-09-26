/**
 * Aspect cosmétique (COLLECTION BOOK) : RENDU UNIQUEMENT. Aucun cue, aucune durée, aucune branche.
 * Règle : aucun cosmétique ne réutilise un signal de résultat (mug doré, halo doré, suie, fumée dorée, flash).
 * Non appliqué en replay par URL : un replay a le même aspect pour tout le monde.
 */
export interface CosmeticLook {
  mug: 'default' | 'okayest';
  tie: 'default' | 'polka';
  duck: boolean;
  elastic: 'default' | 'candy';
  trapdoor: 'default' | 'arctic';
  rocket: 'default' | 'retro';
  ding: 'default' | 'deluxe';
}

export const DEFAULT_LOOK: CosmeticLook = {
  mug: 'default',
  tie: 'default',
  duck: false,
  elastic: 'default',
  trapdoor: 'default',
  rocket: 'default',
  ding: 'default',
};
