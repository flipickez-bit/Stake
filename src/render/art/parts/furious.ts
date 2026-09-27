/**
 * PRODUCTION 3 GADGETS — pièces d'art de FURIOUS (ART BIBLE : même lumière en haut à gauche, même encre, palette).
 *   TRAPDOOR EXPRESS : trappe (fermée, ouverte, coincée) et levier au sol (remplacent les formes placeholder).
 *   CABINET DOMINO   : classeurs minces à « pips » de domino (1, 2, 3), tiroir qui jaillit.
 *   COOLER BOWLING   : rampe de lancement sur le bureau du joueur, bonbonne de fontaine à eau.
 */
import { cel, ellipsePath, fill, line, part, rectPath, softShadow, type ArtPart } from '../svg';

// ------------------------------------------------------------------ TRAPDOOR EXPRESS

/** Trappe fermée : panneau de plancher ovale (perspective), cerclage à bandes de danger. Pivot : centre du sol. */
const trapClosed = part('trap_closed', 'prop', 160, 44, 80, 22, [
  cel(ellipsePath(80, 22, 76, 19), { base: 'hazard', shade: 'tieShade' }, { stroke: 3, shade: [0, 3] }),
  ...[-50, -25, 0, 25, 50].map((dx) => line(`M${80 + dx - 6} ${dx === 0 ? 4 : 6}L${80 + dx + 8} ${dx === 0 ? 40 : 38}`, 'ink', 3)),
  cel(ellipsePath(80, 22, 64, 14), { base: 'wood', shade: 'woodShade', light: 'woodLight' }, {
    stroke: 2.5, shade: [0, 4], rim: 1.5,
    inner: line('M16 18H144M16 26H144', 'woodShade', 2) + line('M80 8V36', 'woodDark', 2.5),
  }),
  fill(ellipsePath(74, 22, 4, 3), 'metalDark'),
  fill(ellipsePath(86, 22, 4, 3), 'metalDark'),
].join(''));

/** Trappe ouverte : le vide, les deux battants qui pendent. Pivot : centre du sol. */
const trapOpen = part('trap_open', 'prop', 160, 76, 80, 22, [
  cel(ellipsePath(80, 22, 76, 19), { base: 'hazard', shade: 'tieShade' }, { stroke: 3, shade: [0, 3] }),
  ...[-50, -25, 0, 25, 50].map((dx) => line(`M${80 + dx - 6} ${dx === 0 ? 4 : 6}L${80 + dx + 8} ${dx === 0 ? 40 : 38}`, 'ink', 3)),
  fill(ellipsePath(80, 22, 64, 14), 'ink'),
  fill(ellipsePath(80, 26, 50, 8), 'night'),
  // Battants qui pendent dans le vide (bois vu par la tranche).
  cel('M18 22L30 70L42 70L32 24Z', { base: 'wood', shade: 'woodShade' }, { stroke: 2.5, shade: [3, 0] }),
  cel('M142 22L130 70L118 70L128 24Z', { base: 'wood', shade: 'woodShade' }, { stroke: 2.5, shade: [3, 0] }),
].join(''));

/** Trappe coincée : entrouverte de travers, un pied-de-biche dans la fente. Pivot : centre du sol. */
const trapJam = part('trap_jam', 'prop', 160, 50, 80, 22, [
  line('M40 18L72 30L90 16L118 30', 'ink', 3),
  cel('M86 10L128 2L132 8L90 16Z', { base: 'red', shade: 'redShade', light: 'redLight' }, { stroke: 2, shade: [0, 2], rim: 1.5 }),
  line('M128 2C136 -2 140 6 134 10', 'metalDark', 3),
].join(''));

/** Socle du levier (au sol, bandes de danger). Pivot : sol, au milieu. */
const leverBase = part('lever_base', 'prop', 76, 38, 38, 36, [
  softShadow(38, 34, 34, 4, 0.3, 3),
  cel(rectPath(6, 12, 64, 22, 5), { base: 'metalShade', shade: 'metalDark', light: 'metal' }, {
    stroke: 3, shade: [6, 0], rim: 1.5,
    inner: [12, 26, 40, 54].map((x) => line(`M${x} 34L${x + 10} 12`, 'hazard', 3.5)).join(''),
  }),
  cel(ellipsePath(38, 12, 10, 6), { base: 'metalDark', light: 'metalShade' }, { stroke: 2.5, rim: 1.5 }),
].join(''));

/** Manche du levier. Pivot : l'axe (en bas). La rotation positive le bascule vers la droite. */
const leverStick = part('lever_stick', 'prop', 40, 112, 20, 104, [
  cel(rectPath(15, 20, 10, 86, 4), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 2.5, shade: [3, 0], rim: 1.5 }),
  cel(ellipsePath(20, 18, 15, 14), { base: 'red', shade: 'redShade', light: 'redLight' }, { stroke: 3, shade: [4, 4], rim: 2 }),
  fill(ellipsePath(15, 13, 4, 3), 'redLight'),
].join(''));

// ------------------------------------------------------------------ CABINET DOMINO

const PIP_POS: Record<number, [number, number][]> = {
  1: [[31, 26]],
  2: [[22, 18], [40, 34]],
  3: [[20, 16], [31, 26], [42, 36]],
};

/** Classeur mince, « domino » (pips 1 à 3 sur le tiroir du haut). Pivot : coin inférieur DROIT (il bascule à droite). */
function domino(n: 1 | 2 | 3): ArtPart {
  return part(`dom_cab${n}`, 'prop', 66, 176, 64, 174, [
    softShadow(34, 170, 30, 5, 0.28, 3),
    cel(rectPath(2, 2, 62, 172, 5), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 3, shade: [8, 0], rim: 2 }),
    ...[0, 1, 2].map((i) => {
      const y = 10 + i * 54;
      return cel(rectPath(8, y, 50, 46, 3), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 2, shade: [0, 4], rim: 1.5 })
        + cel(rectPath(22, y + 30, 22, 7, 3), { base: 'metalDark', light: 'metalShade' }, { stroke: 1.5, rim: 1.5 });
    }),
    ...PIP_POS[n]!.map(([x, y]) => cel(ellipsePath(x, y - 2, 6, 6), { base: 'paper', shade: 'paperShade' }, { stroke: 2, shade: [1, 2] })),
    // Pile de dossiers sur le dessus (elle s'envole au premier choc).
    cel(rectPath(10, -2, 40, 8, 2), { base: 'postit', shade: 'postitShade' }, { stroke: 1.5, shade: [0, 2] }),
  ].join(''));
}

/** Tiroir qui jaillit (papiers qui dépassent). Pivot : centre. */
const domDrawer = part('dom_drawer', 'prop', 60, 40, 30, 22, [
  cel('M8 12L16 4L22 12Z', { base: 'paper', shade: 'paperShade' }, { stroke: 1.5 }),
  cel('M26 12L36 2L42 12Z', { base: 'paper', shade: 'paperShade' }, { stroke: 1.5 }),
  cel(rectPath(4, 10, 52, 26, 3), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 2.5, shade: [0, 4], rim: 1.5 }),
  cel(rectPath(20, 20, 20, 7, 3), { base: 'metalDark', light: 'metalShade' }, { stroke: 1.5, rim: 1.5 }),
].join(''));

// ------------------------------------------------------------------ WATER COOLER BOWLING

/** Rampe de lancement (bowling de bureau) posée sur le bureau du joueur. Pivot : base, au milieu. */
const coolRamp = part('cool_ramp', 'prop', 176, 96, 88, 92, [
  softShadow(90, 88, 78, 6, 0.3, 4),
  // Pieds et chevalet.
  cel(rectPath(18, 58, 10, 32, 3), { base: 'woodShade', light: 'wood' }, { stroke: 2.5, rim: 1.5 }),
  cel(rectPath(146, 40, 10, 50, 3), { base: 'woodShade', light: 'wood' }, { stroke: 2.5, rim: 1.5 }),
  // Gouttière inclinée (vers la gauche : la bonbonne part vers le bureau de B.B.).
  cel('M6 58L160 24L170 38L16 72Z', { base: 'wood', shade: 'woodShade', light: 'woodLight' }, {
    stroke: 3, shade: [0, 5], rim: 2,
    inner: line('M16 64L164 31', 'woodDark', 2),
  }),
  cel('M160 24L170 38L172 22L164 12Z', { base: 'red', shade: 'redShade', light: 'redLight' }, { stroke: 2.5, shade: [2, 2], rim: 1.5 }),
  // Butée rouge et flèches de piste.
  ...[40, 80, 120].map((x) => fill(`M${x} ${60 - (x - 6) * 0.22}l8 -4l-2 8z`, 'hazard')),
].join(''));

/** Bonbonne de fontaine à eau (18 L), bouchon bleu, bulles. Pivot : centre (elle roule). */
const coolJug = part('cool_jug', 'prop', 64, 80, 32, 42, [
  cel('M14 14C8 22 6 60 12 70C18 78 46 78 52 70C58 60 56 22 50 14Z', { base: 'glass', shade: 'sky', light: 'skyLight' }, {
    stroke: 3, shade: [6, 0], rim: 2.5,
    inner: fill(rectPath(6, 34, 52, 44), 'sky', 0.55) + line('M8 34H56', 'skyLight', 2) + line('M10 46H54M10 58H54', 'sky', 1.5),
  }),
  cel(rectPath(22, 2, 20, 14, 4), { base: 'skyline', shade: 'screenLight', light: 'skyLight' }, { stroke: 2.5, shade: [2, 3], rim: 1.5 }),
  fill(ellipsePath(24, 50, 3, 3), 'skyLight'),
  fill(ellipsePath(38, 60, 2, 2), 'skyLight'),
  fill(ellipsePath(30, 40, 2.5, 2.5), 'skyLight'),
  line('M18 22C16 32 16 44 18 54', 'paper', 2.5, 0.7),
].join(''));

export const FURIOUS_PARTS: readonly ArtPart[] = [
  trapClosed, trapOpen, trapJam, leverBase, leverStick, domino(1), domino(2), domino(3), domDrawer, coolRamp, coolJug,
];
