/**
 * Modèle de mise en scène data-driven (TECH_ARCHITECTURE.md §2.8).
 * Gadget → Branch → Step → Segment → Cues. Aucune logique propre à un gadget dans le moteur.
 */
import type { RageLevelId, ResultClass, Script, Speed } from '../domain/types';
import type { EaseName } from './easing';

export type ActorId = string;

export interface Transform {
  x: number;
  y: number;
  /** Profondeur simulée (2.5D) : >0 = plus loin (plus petit), <0 = plus près. */
  z: number;
  rot: number;
  sx: number;
  sy: number;
  alpha: number;
}

export const IDENTITY: Transform = { x: 0, y: 0, z: 0, rot: 0, sx: 1, sy: 1, alpha: 1 };

export type SoundId =
  | 'click' | 'creak' | 'twang' | 'screech' | 'thud' | 'tink' | 'ding' | 'whoosh' | 'glass' | 'crash'
  | 'pfft' | 'roar' | 'fuse' | 'clunk' | 'plop' | 'hmpf' | 'laugh' | 'wahwah' | 'boing' | 'clang'
  | 'crack' | 'gold' | 'deflate' | 'giantRoar' | 'elevator' | 'cheer' | 'fall'
  | 'sip' | 'spin' | 'spray' | 'coo' | 'bonk'
  // Phase 0.6 : repères de synchronisation son/image (sons provisoires synthétisés).
  | 'stretch' | 'snap' | 'clink' | 'paper' | 'debris'
  // PRODUCTION 3 GADGETS (SOUND KIT) : carillon d'ascenseur (≠ DING de gain), couches d'impact, mécanismes, air, eau.
  | 'bell' | 'boom' | 'rumble' | 'rattle' | 'squeak' | 'honk' | 'slide' | 'crank' | 'whirr' | 'gust' | 'gulp'
  | 'splash' | 'roll' | 'strike' | 'chain' | 'tension' | 'brass' | 'thump' | 'room';

export type VfxId =
  | 'dust' | 'sparks' | 'glass' | 'papers' | 'confetti' | 'smoke' | 'flame' | 'stars' | 'gold' | 'soot' | 'foam' | 'feathers' | 'hair'
  | 'burst' | 'debris' | 'leaves'
  // POC « 3 PLANS » : vapeur (ESPRESSO BLASTER) et éclaboussure de café.
  | 'steam' | 'coffee'
  // PRODUCTION : gerbe d'eau (WATER COOLER), traînées de vent (HVAC HURRICANE).
  | 'water' | 'swirl';

/**
 * BOSS FIGHT (tours gratuits) : `bfStart` (arène), `frRound` (valeur = index du tour qui commence), `frHit` /
 * `bfBlocked` (valeur = index du tour résolu), `bfKo` (dernier coup).
 */
export type Signal = 'd1' | 'reveal' | 'bfStart' | 'frRound' | 'frHit' | 'bfBlocked' | 'bfKo' | 'end';

export type Cue =
  /** Interpolation d'un acteur (la caméra est l'acteur "camera" : x, y, sx = zoom). */
  | { kind: 'tween'; at: number; actor: ActorId; to: Partial<Transform>; ms: number; ease?: EaseName }
  /** Animation d'un personnage (CharacterAnimator) : la pose est une fonction pure du temps écoulé. */
  | { kind: 'anim'; at: number; actor: ActorId; anim: string }
  /** État visuel d'un acteur (trappe ouverte, mug doré, suie…). */
  | { kind: 'state'; at: number; actor: ActorId; state: string }
  | { kind: 'camera'; at: number; shot: 'shake' | 'punch'; ms: number; intensity: number; seed?: number }
  /** Hit stop : le temps de la séquence s'arrête pendant wallMs (temps réel). */
  | { kind: 'freeze'; at: number; wallMs: number }
  /**
   * `seed` (rempli par le compilateur) : choix DÉTERMINISTE de la variante du son (hauteur, timbre, durée) dans
   * son pool. Même book, même variante : replay et reprise sonnent pareil. Jamais Math.random().
   */
  | { kind: 'sound'; at: number; sound: SoundId; pitch?: number; seed?: number }
  /** Silence dramatique : tout se tait sauf l'ambiance (un seul par manche). */
  | { kind: 'silence'; at: number; ms: number }
  /** Particules. Avec `actor`, (x, y) est un décalage par rapport à la position de l'acteur à cet instant. */
  | { kind: 'vfx'; at: number; fx: VfxId; x: number; y: number; count: number; actor?: ActorId; seed?: number }
  | { kind: 'signal'; at: number; signal: Signal; value?: number }
  /**
   * Ralenti : pendant `ms` de temps de SÉQUENCE, le temps avance à `factor` × le temps réel (0 < factor ≤ 1).
   * L'image reste une fonction du temps de séquence (seek, reprise, replay identiques). Ignoré en turbo.
   */
  | { kind: 'slowmo'; at: number; ms: number; factor: number };

export type CameraCue = Extract<Cue, { kind: 'camera' }>;
export type AudioCue = Extract<Cue, { kind: 'sound' }>;
export type VFXCue = Extract<Cue, { kind: 'vfx' }>;

/** Phase narrative (GDD_04 §5.2.1). Elle décide du traitement en turbo et en super turbo. */
export type Phase = 'intro' | 'setup' | 'action' | 'twist' | 'impact' | 'reaction';

export interface SegmentDef {
  id: string;
  phase: Phase;
  ms: number;
  /**
   * Comportement en turbo : conservé, compressé ou supprimé.
   * Un segment `drop` est une pure respiration : il ne contient ni `tween` ni `state`
   * (sinon, le supprimer changerait la pose des segments suivants). Vérifié par compileSequence.
   */
  turbo: 'keep' | 'compress' | 'drop';
  /** Cues à temps RELATIF au début du segment. */
  cues: Cue[];
}

export type ImpactDirection = 'none' | 'window' | 'overdesk' | 'ceiling' | 'floor' | 'cork' | 'wall' | 'elevator' | 'vent';

/** Réactions partagées (bibliothèque REACTION). Les deux dernières servent quand le boss a quitté le cadre. */
export type BossReaction = 'SIP' | 'LAUGH' | 'FLEX' | 'SULK' | 'DAZED' | 'OFFICE_CHEER' | 'WENDELL_PEEK';

export type Step =
  | { seg: string }
  | { impact: ImpactDirection }
  /** 'auto' : pool du boss selon la classe ; 'away' : pool « boss hors champ ». Choix par la graine. */
  | { reaction: BossReaction | 'auto' | 'away' }
  | { silence: number }
  | { bossFight: true };

/** Disposition de repos d'un acteur (avant tout cue). */
export interface ActorRest {
  transform?: Partial<Transform>;
  /** États initiaux, par emplacement : { main: 'closed', seat: 'chair' }. */
  states?: Record<string, string>;
  anim?: string;
}

/**
 * Rareté COSMÉTIQUE d'une branche : elle ne sert qu'à choisir, avec la graine du book, parmi des présentations
 * déjà compatibles avec le résultat fixé. Elle ne dépend jamais d'un gain passé ou futur et ne touche pas aux maths.
 */
export type BranchRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'VERY_RARE';
export const RARITY_WEIGHT: Record<BranchRarity, number> = { COMMON: 100, UNCOMMON: 40, RARE: 12, VERY_RARE: 3 };

export interface BranchDef {
  id: string;
  label: string;
  /** Scripts du book que cette branche sait servir. */
  categories: Script[];
  classes: ResultClass[];
  rarity: BranchRarity;
  /**
   * Modules visibles AVANT la fin révélatrice (setup, puis twists), dans l'ordre. Deux branches qui partagent un
   * préfixe montrent exactement la même chose jusque-là : c'est la base de l'audit de prévisibilité.
   */
  path: string[];
  /** État visible au point de divergence (contrôle de non-révélation). */
  d1: string;
  steps: Step[];
}

export type GadgetId =
  | 'swivel-slingshot' | 'trapdoor-express' | 'office-rocket'
  // PRODUCTION 3 GADGETS : les plans B et C de chaque Rage Level, et le décor du choix (les trois plans).
  | 'espresso-blaster' | 'copier-catapult'
  | 'cabinet-domino' | 'cooler-bowling'
  | 'ceiling-safe' | 'hvac-hurricane'
  | 'plan-picker';

/** Vie d'attente d'un gadget pendant le choix (survol / sélection, READY seulement). Rendu seulement. */
export interface PickIdle {
  actor: ActorId;
  prop: 'x' | 'y' | 'rot' | 'sx' | 'sy';
  /** Amplitude (unités du monde, radians ou facteur d'échelle). */
  amp: number;
  periodMs: number;
}

/**
 * Présence d'un gadget dans le décor du CHOIX : zone tactile, halo de sélection, étiquette, vie d'attente.
 * Données de mise en scène uniquement : aucun effet sur le résultat, la branche ou les maths.
 */
export interface PickSpec {
  /** Calque : la pièce ('room', coordonnées du monde) ou le bureau du joueur ('front', calque du premier plan). */
  layer: 'room' | 'front';
  /** Zone tactile (coordonnées du calque) : tout le gadget, avec de la marge pour le doigt. */
  box: { x: number; y: number; w: number; h: number };
  /** Halo de sélection (lumière douce, jamais l'or d'un gain). */
  spot: { x: number; y: number; sx: number; sy?: number };
  idle: PickIdle[];
  /** Bouffée de vapeur / fumée d'attente (coordonnées du calque), facultative. */
  puff?: { x: number; y: number };
}

export interface GadgetDef {
  id: GadgetId;
  label: string;
  rageLevel: RageLevelId;
  /** Surcharges de la disposition de repos du bureau pour ce gadget. */
  layout: Record<ActorId, ActorRest>;
  /** Acteurs propres au gadget, visibles quand il est actif. */
  props: ActorId[];
  /**
   * Segments du tronc commun, joués AVANT de connaître le résultat.
   * Ils ne dépendent donc JAMAIS de la graine : ils sont identiques pour toutes les issues.
   */
  trunk: string[];
  /** Boucle d'attente (réseau lent) : son répété pendant que la pose de D1 continue de vivre. */
  hold: { sound: SoundId; everyMs: number };
  /** Présence dans le décor du choix (3 gadgets par Rage Level). */
  pick?: PickSpec;
  /** Signature sonore (SOUND BIBLE) : famille de sons qui identifie le gadget les yeux fermés. */
  signature?: SoundId[];
  /**
   * BOSS FIGHT (commun à la manche, mêmes maths pour les 9 gadgets) : ce que le joueur lance sur le boss géant avec
   * CE gadget (variation visuelle uniquement). Absent : projectiles de bureau génériques.
   */
  bfProjectiles?: readonly string[];
  branches: BranchDef[];
  segments: Record<string, SegmentDef>;
}

/** Cue placé à un temps ABSOLU de la séquence, avec la phase de son segment. */
export type ScheduledCue = Cue & { seg: number };

export interface AnimationSequence {
  key: string;
  gadgetId: GadgetId;
  branchId: string;
  speed: Speed;
  totalMs: number;
  markers: { d1: number; reveal: number; end: number };
  /** Tous les cues, à temps absolu, triés par temps (stable). */
  cues: ScheduledCue[];
  /** Segments dans l'ordre, avec leur début et leur durée compilée (debug, tests). */
  segments: { id: string; phase: Phase; start: number; ms: number }[];
  /** Réaction choisie (variation cosmétique autorisée). */
  reaction: string | null;
  /** Caméo du pigeon (variation cosmétique autorisée). */
  cooCameo: boolean;
}
