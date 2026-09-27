/**
 * UNHINGED — décor partagé par les trois plans du niveau. B.B. est assis sur son fauteuil-fusée (le monde UNHINGED :
 * il a déjà boulonné une fusée sous son fauteuil) ; seule la mèche appartient au plan A (OFFICE ROCKET).
 * Le coffre pend sous le ventilateur ; la bouche d'aération et son thermostat sont au mur du fond.
 */
import type { ActorId, ActorRest } from '../../../presentation/types';

export const UNHINGED_DECOR: Record<ActorId, ActorRest> = {
  boss: { transform: { x: 650, y: 560 }, states: { seat: 'rocket', mug: 'normal', face: 'normal' }, anim: 'sip' },
};
