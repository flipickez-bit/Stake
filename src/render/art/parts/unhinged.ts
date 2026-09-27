/**
 * PRODUCTION 3 GADGETS — pièces d'art de UNHINGED (ART BIBLE : lumière en haut à gauche, encre, palette).
 *   OFFICE ROCKET  : embout de mèche (la mèche elle-même est tracée par la scène).
 *   CEILING SAFE   : coffre-fort suspendu (fermé, porte ouverte), détonateur à poignée sur le bureau du joueur,
 *                    gant de boxe à ressort (surprise du coffre).
 *   HVAC HURRICANE : bouche d'aération murale, thermostat et son aiguille, mini-tornade.
 */
import { cel, ellipsePath, fill, line, part, radialGradient, rectPath, softShadow, type ArtPart } from '../svg';

// ------------------------------------------------------------------ OFFICE ROCKET

/** Embout de mise à feu (la mèche y est enroulée). Pivot : sol, au milieu. */
const fuseEnd = part('fuse_end', 'prop', 44, 34, 22, 32, [
  softShadow(22, 30, 18, 3, 0.3, 2),
  cel(rectPath(8, 12, 28, 18, 4), { base: 'tie', shade: 'tieShade', light: 'tieLight' }, { stroke: 2.5, shade: [4, 0], rim: 1.5 }),
  line('M12 12C10 4 20 2 22 8C24 2 34 4 32 12', 'coffee', 3),
  fill(ellipsePath(22, 21, 4, 4), 'ink'),
].join(''));

// ------------------------------------------------------------------ CEILING SAFE

/** Coffre-fort (fermé). Pivot : le haut (point d'attache de la corde), au milieu. */
const safeBody = part('safe_body', 'prop', 100, 110, 50, 6, [
  cel(rectPath(6, 8, 88, 96, 8), { base: 'metalDark', shade: 'screen', light: 'metalShade' }, {
    stroke: 3.5, shade: [8, 6], rim: 2.5,
    inner: line('M6 94H94', 'screen', 2.5),
  }),
  cel(rectPath(16, 18, 68, 70, 5), { base: 'metalShade', shade: 'metalDark', light: 'metal' }, { stroke: 2.5, shade: [4, 4], rim: 2 }),
  // Cadran et poignée.
  cel(ellipsePath(50, 46, 16, 16), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 2.5, shade: [3, 3], rim: 1.5 }),
  fill(ellipsePath(50, 46, 5, 5), 'metalDark'),
  line('M50 32V36M64 46H60M50 60V56M36 46H40', 'ink', 2),
  cel(rectPath(70, 40, 8, 26, 3), { base: 'tie', shade: 'tieShade', light: 'tieLight' }, { stroke: 2, shade: [2, 0], rim: 1.5 }),
  // Rivets, anneau d'attache.
  ...[[14, 14], [86, 14], [14, 98], [86, 98]].map(([x, y]) => fill(ellipsePath(x!, y!, 2.5, 2.5), 'metal')),
  cel(ellipsePath(50, 6, 8, 5), { base: 'metal', shade: 'metalDark' }, { stroke: 2.5, shade: [0, 2] }),
].join(''));

/** Porte ouverte (le coffre vu ouvert : intérieur sombre, porte rabattue à gauche). Même pivot que le corps. */
const safeOpen = part('safe_open', 'prop', 150, 110, 75, 6, [
  cel(rectPath(31, 8, 88, 96, 8), { base: 'metalDark', shade: 'screen', light: 'metalShade' }, { stroke: 3.5, shade: [8, 6], rim: 2.5 }),
  fill(rectPath(41, 18, 68, 70, 5), 'nightDeep'),
  line('M41 60H109', 'metalDark', 2.5),
  // Porte rabattue (vue de biais).
  cel('M31 16L4 6L4 106L31 100Z', { base: 'metalShade', shade: 'metalDark', light: 'metal' }, { stroke: 3, shade: [3, 0], rim: 1.5 }),
  cel(ellipsePath(16, 52, 6, 12), { base: 'metal', shade: 'metalShade' }, { stroke: 2, shade: [2, 2] }),
  cel(ellipsePath(75, 6, 8, 5), { base: 'metal', shade: 'metalDark' }, { stroke: 2.5, shade: [0, 2] }),
].join(''));

/** Détonateur à poignée (sur le bureau du joueur). Pivot : base, au milieu. */
const plungerBox = part('plunger_box', 'prop', 112, 76, 56, 72, [
  softShadow(58, 70, 50, 5, 0.3, 3),
  cel(rectPath(10, 26, 92, 44, 5), { base: 'red', shade: 'redShade', light: 'redLight' }, {
    stroke: 3, shade: [8, 4], rim: 2,
    inner: [22, 44, 66, 88].map((x) => line(`M${x - 10} 70L${x + 4} 26`, 'hazard', 3.5)).join(''),
  }),
  cel(rectPath(6, 20, 100, 10, 3), { base: 'woodShade', light: 'wood' }, { stroke: 2.5, rim: 1.5 }),
  // Fil qui part vers la pièce.
  line('M102 50C114 48 110 30 108 16', 'ink', 3),
].join(''));

/** Poignée en T du détonateur. Pivot : bas de la tige (elle descend quand on appuie). */
const plungerHandle = part('plunger_handle', 'prop', 72, 64, 36, 60, [
  cel(rectPath(32, 10, 8, 52, 3), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 2, shade: [2, 0], rim: 1.5 }),
  cel(rectPath(4, 2, 64, 12, 5), { base: 'woodDark', shade: 'woodDark', light: 'wood' }, { stroke: 3, rim: 2 }),
].join(''));

/** Gant de boxe au bout d'un ressort (surprise du coffre). Pivot : base du ressort (à gauche). */
const safeGlove = part('safe_glove', 'prop', 110, 50, 4, 25, [
  line('M4 25C10 12 16 38 22 25C28 12 34 38 40 25C46 12 52 38 58 25', 'metalShade', 3.5),
  cel('M60 12C62 4 84 2 96 8C106 14 108 34 98 42C88 48 66 46 60 38Z', { base: 'red', shade: 'redShade', light: 'redLight' }, { stroke: 3, shade: [5, 4], rim: 2 }),
  cel(rectPath(56, 14, 8, 24, 3), { base: 'paper', shade: 'paperShade' }, { stroke: 2, shade: [2, 0] }),
  line('M78 14C84 20 84 28 80 34', 'redShade', 2),
].join(''));

// ------------------------------------------------------------------ HVAC HURRICANE

/** Bouche d'aération murale (grille à lames). Pivot : centre. */
const ventGrille = part('vent_grille', 'prop', 140, 96, 70, 48, [
  softShadow(72, 54, 64, 42, 0.25, 5),
  cel(rectPath(4, 4, 132, 88, 8), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 3, shade: [6, 5], rim: 2 }),
  fill(rectPath(14, 14, 112, 68, 4), 'nightDeep'),
  ...[0, 1, 2, 3, 4].map((i) => cel(rectPath(14, 16 + i * 13, 112, 7, 2), { base: 'metalShade', light: 'metalLight' }, { stroke: 1.5, rim: 1.5 })),
  ...[[10, 10], [130, 10], [10, 86], [130, 86]].map(([x, y]) => fill(ellipsePath(x!, y!, 2.5, 2.5), 'metalDark')),
].join(''));

/** Thermostat mural (cadran). Pivot : centre du cadran. */
const thermo = part('thermo', 'prop', 64, 72, 32, 32, [
  cel(rectPath(4, 2, 56, 66, 8), { base: 'paper', shade: 'paperShade' }, { stroke: 2.5, shade: [4, 4] }),
  cel(ellipsePath(32, 32, 22, 22), { base: 'metalLight', shade: 'metal' }, { stroke: 2.5, shade: [3, 3] }),
  line('M16 44A20 20 0 0 1 22 16', 'sky', 3),
  line('M24 14A20 20 0 0 1 44 16', 'hazard', 3),
  line('M46 18A20 20 0 0 1 48 44', 'red', 3),
  fill(ellipsePath(32, 60, 4, 3), 'plant'),
].join(''));

/** Aiguille du thermostat. Pivot : son axe ; −1,2 (froid) → +1,2 (MAX). */
const thermoNeedle = part('thermo_needle', 'prop', 8, 24, 4, 20, line('M4 20V4', 'ink', 2.5) + fill(ellipsePath(4, 20, 3.5, 3.5), 'ink'));

/** Mini-tornade (air en spirale, papiers pris dedans). Pivot : sa pointe, au sol. */
const twister = part('hvac_twister', 'vfx', 170, 270, 85, 262, (() => {
  const g = radialGradient([[0, 'skyLight', 0.55], [0.7, 'skyLight', 0.18], [1, 'skyLight', 0]]);
  const rings = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const y = 30 + i * 34;
    const rx = 78 - i * 10;
    return line(`M${85 - rx} ${y}C${85 - rx / 2} ${y + 14} ${85 + rx / 2} ${y + 14} ${85 + rx} ${y}`, i % 2 ? 'paper' : 'smokeLight', i % 3 === 0 ? 3 : 2);
  });
  return `<defs>${g.def}</defs><path d="M6 20C40 34 130 34 164 20L92 262H78Z" fill="url(#${g.id})"/>`
    + rings.join('')
    + line('M40 60C60 50 80 70 96 58', 'paper', 2) + line('M60 150C72 142 88 158 100 150', 'paper', 2)
    + fill(rectPath(116, 40, 14, 10, 1), 'paper') + fill(rectPath(46, 120, 12, 9, 1), 'postit');
})());

export const UNHINGED_PARTS: readonly ArtPart[] = [
  fuseEnd, safeBody, safeOpen, plungerBox, plungerHandle, safeGlove, ventGrille, thermo, thermoNeedle, twister,
];
