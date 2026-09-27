/**
 * POC « 3 PLANS » : emplacements des trois plans de GRUMPY dans le bureau (unités du monde 1000 × 700).
 * A reste au pied du bureau (position réelle du lance-pierre) ; B et C sont posés au premier plan, devant le
 * bureau de B.B. De gauche à droite : A, B, C (ordre de lecture = ordre des plans).
 * B et C sont à l'échelle PLAN_SCALE ; les décalages des pièces (canon, aiguille, capot, feuille) reprennent les
 * pivots des pièces d'art (render/art/parts/plans.ts), multipliés par cette échelle.
 */
export const PLAN_SCALE = 0.8;
const S = PLAN_SCALE;
const r = (v: number) => Math.round(v * S);

export const STATION = {
  A: { x: 430, y: 560 },
  B: { x: 548, y: 640 },
  C: { x: 792, y: 640 },
} as const;

/** ESPRESSO BLASTER (B). */
export const ESP = {
  body: STATION.B,
  barrel: { x: STATION.B.x + r(56), y: STATION.B.y - r(104) },
  needle: { x: STATION.B.x - r(18), y: STATION.B.y - r(102) },
  lever: { x: STATION.B.x - r(57), y: STATION.B.y - r(166) },
  steam: { x: STATION.B.x - r(12), y: STATION.B.y - r(150) },
  /** Canon au repos : vers le haut et vers B.B. (sans le traverser). */
  aim: -1.3,
} as const;
/** Bouche du canon au repos (longueur 90 × échelle depuis le pivot). */
export const ESP_MUZZLE = { x: ESP.barrel.x + Math.round(90 * S * Math.cos(ESP.aim)), y: ESP.barrel.y + Math.round(90 * S * Math.sin(ESP.aim)) } as const;

/** COPIER CATAPULT (C). */
export const COP = {
  body: STATION.C,
  lid: { x: STATION.C.x - r(74), y: STATION.C.y - r(122) },
  sheet: { x: STATION.C.x - r(70), y: STATION.C.y - r(76) },
  button: { x: STATION.C.x + r(70), y: STATION.C.y - r(118) },
  /** Ramette posée sur le capot, prête à partir. */
  ream: { x: STATION.C.x + r(36), y: STATION.C.y - r(152) },
} as const;
