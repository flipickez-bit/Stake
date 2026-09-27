/**
 * FURIOUS — décor partagé par les trois plans du niveau (même pièce, quel que soit le gadget choisi).
 * La trappe sous B.B. et le levier font partie du monde FURIOUS : ils restent visibles avec CABINET DOMINO et
 * COOLER BOWLING (qui peuvent s'en servir : le tiroir qui heurte le levier…). La plante s'écarte pour laisser
 * place aux classeurs-dominos ; l'extincteur a déjà servi (il n'est plus là).
 */
import type { ActorId, ActorRest } from '../../../presentation/types';
import { FURIOUS_STATIONS } from '../stations';

export const LEVER = { x: FURIOUS_STATIONS.A.x, y: FURIOUS_STATIONS.A.y } as const;

export const FURIOUS_DECOR: Record<ActorId, ActorRest> = {
  boss: { transform: { x: 650, y: 560 }, states: { seat: 'none', mug: 'normal', face: 'normal' }, anim: 'tapfoot' },
  trapdoor: { transform: { x: 650, y: 560 }, states: { main: 'closed' } },
  lever: { transform: { x: LEVER.x, y: LEVER.y, rot: -0.35 } },
  plant: { transform: { x: 196, y: 560 } },
  extinguisher: { transform: { x: 520, y: 500, alpha: 0 } },
};

/** Accessoires du monde FURIOUS (visibles quel que soit le plan). */
export const FURIOUS_WORLD_PROPS: readonly ActorId[] = ['trapdoor', 'lever'];
