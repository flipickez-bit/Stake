/**
 * PRODUCTION 3 GADGETS — emplacements des gadgets dans le décor du choix (unités du monde 1000 × 700).
 *
 * Règles de mise en place (ART BIBLE §6, retours du POC) :
 * - le plan A (gadget historique) reste à sa place dans la pièce ;
 * - les appareils posés sur le BUREAU DU JOUEUR (premier plan) ont leur base à FRONT_Y et restent SOUS la ligne
 *   du sol de la pièce (y = 560) : ils ne cachent plus ni B.B., ni son bureau, ni ses pieds (correction du POC) ;
 * - tout ce qu'on touche pour choisir reste dans la zone visible en portrait (x ≈ 260 … 870).
 *
 * Les coordonnées « front » sont celles du calque du bureau du joueur (même parallaxe que lui) ; le monde est
 * décalé de FRONT_DY par rapport à elles (cadrage des plans).
 */
export const PLAN_SCALE = 0.8;
const S = PLAN_SCALE;
const r = (v: number) => Math.round(v * S);

/** Base des appareils posés sur le bureau du joueur (calque du premier plan). */
export const FRONT_Y = 736;
/** Décalage vertical du calque du premier plan en cadrage « plans » (paysage) : monde = front + FRONT_DY. */
export const FRONT_DY = -4;

// ------------------------------------------------------------------ GRUMPY

export const GRUMPY_STATIONS = {
  /** SWIVEL SLINGSHOT : poteau dans la pièce (Phase 0.6). */
  A: { x: 430, y: 560 },
  /** ESPRESSO BLASTER : sur le bureau du joueur, à gauche. */
  B: { x: 500, y: FRONT_Y },
  /** COPIER CATAPULT : sur le bureau du joueur, à droite. */
  C: { x: 790, y: FRONT_Y },
} as const;

/** Compatibilité POC. */
export const STATION = GRUMPY_STATIONS;

/** ESPRESSO BLASTER (coordonnées du calque du premier plan). */
export const ESP = {
  body: GRUMPY_STATIONS.B,
  barrel: { x: GRUMPY_STATIONS.B.x + r(56), y: GRUMPY_STATIONS.B.y - r(104) },
  needle: { x: GRUMPY_STATIONS.B.x - r(18), y: GRUMPY_STATIONS.B.y - r(102) },
  lever: { x: GRUMPY_STATIONS.B.x - r(57), y: GRUMPY_STATIONS.B.y - r(166) },
  steam: { x: GRUMPY_STATIONS.B.x - r(12), y: GRUMPY_STATIONS.B.y - r(150) },
  /** Canon au repos : vers le haut et vers B.B. */
  aim: -1.15,
} as const;
/** Bouche du canon, en coordonnées du MONDE (le gobelet vole dans la pièce). */
export const ESP_MUZZLE = {
  x: ESP.barrel.x + Math.round(90 * S * Math.cos(ESP.aim)),
  y: ESP.barrel.y + Math.round(90 * S * Math.sin(ESP.aim)) + FRONT_DY,
} as const;

/** COPIER CATAPULT (coordonnées du calque du premier plan, sauf mention). */
export const COP = {
  body: GRUMPY_STATIONS.C,
  lid: { x: GRUMPY_STATIONS.C.x - r(74), y: GRUMPY_STATIONS.C.y - r(122) },
  sheet: { x: GRUMPY_STATIONS.C.x - r(70), y: GRUMPY_STATIONS.C.y - r(76) },
  button: { x: GRUMPY_STATIONS.C.x + r(70), y: GRUMPY_STATIONS.C.y - r(118) },
} as const;
/** Ramette posée sur le capot, prête à partir (coordonnées du MONDE : elle vole dans la pièce). */
export const COP_REAM = { x: GRUMPY_STATIONS.C.x + r(36), y: GRUMPY_STATIONS.C.y - r(152) + FRONT_DY } as const;

// ------------------------------------------------------------------ FURIOUS

export const FURIOUS_STATIONS = {
  /** TRAPDOOR EXPRESS : la trappe sous B.B., le levier à droite du bureau (dans la zone visible en portrait). */
  A: { x: 860, y: 560 },
  /** CABINET DOMINO : trois classeurs debout, de gauche à droite, jusqu'à B.B. */
  B: { x: 380, y: 560 },
  /** WATER COOLER BOWLING : la bonbonne sur sa rampe, sur le bureau du joueur. */
  C: { x: 790, y: FRONT_Y },
} as const;

/** Dominos (classeurs) : pied gauche au sol ; ils basculent vers la droite autour de leur coin inférieur droit. */
export const DOMINO = {
  xs: [290, 380, 470] as const,
  w: 62,
  h: 172,
} as const;

/** Rampe et bonbonne (coordonnées du calque du premier plan ; bonbonne en coordonnées du MONDE). */
export const COOLER = {
  ramp: FURIOUS_STATIONS.C,
  /** Bonbonne au repos, sur la rampe. */
  jug: { x: FURIOUS_STATIONS.C.x - 18, y: FURIOUS_STATIONS.C.y - 66 + FRONT_DY },
} as const;

// ------------------------------------------------------------------ UNHINGED

export const UNHINGED_STATIONS = {
  /** OFFICE ROCKET : la mèche va de la fusée (sous le fauteuil) jusqu'à x = 860. */
  A: { x: 860, y: 552 },
  /** CEILING SAFE : le coffre suspendu au-dessus de B.B. */
  B: { x: 650, y: 206 },
  /** HVAC HURRICANE : la bouche d'aération du mur du fond, le thermostat en dessous. */
  C: { x: 430, y: 300 },
} as const;

/** Coffre-fort : poulie au plafond au-dessus de B.B., renvoi au plafond à gauche, taquet au mur. */
export const SAFE = {
  hang: UNHINGED_STATIONS.B,
  pulley: { x: 650, y: 52 },
  pulley2: { x: 352, y: 52 },
  cleat: { x: 352, y: 432 },
} as const;

export const HVAC = {
  vent: UNHINGED_STATIONS.C,
  thermo: { x: 430, y: 392 },
} as const;

/** Fusée : la mèche part de la fusée et finit au taquet de mise à feu. */
export const FUSE = { from: { x: 716, y: 556 }, to: { x: UNHINGED_STATIONS.A.x, y: 552 } } as const;
