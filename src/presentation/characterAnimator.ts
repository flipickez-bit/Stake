/**
 * Abstraction des personnages (B.B., Wendell, COO, mains du joueur).
 *
 * Le moteur (compileSequence, SequencePlayer) ne produit que des triplets (anim, elapsedMs, states).
 * Il ignore totalement comment un personnage est dessiné : placeholder procédural (Phase 0), Spine,
 * spritesheet ou animation pré-rendue ne sont que des implémentations de cette interface.
 *
 * Contrat :
 * - pose() est une fonction PURE de ses arguments (même entrée → même image) : reprise, replay et
 *   skip donnent la même pose. Une implémentation Spine positionnera la piste à `elapsedMs` au lieu
 *   d'intégrer des deltas.
 * - `animations` liste les noms supportés ; le contrôle de contenu vérifie chaque cue `anim`.
 * - Un nom inconnu doit retomber sur une pose neutre, jamais lever d'erreur en production.
 */
export interface CharacterAnimator<View = unknown> {
  readonly id: string;
  /** Objet d'affichage (conteneur Pixi pour les implémentations actuelles). */
  readonly view: View;
  readonly animations: readonly string[];
  pose(anim: string, elapsedMs: number, states: Readonly<Record<string, string>>): void;
  destroy(): void;
}
