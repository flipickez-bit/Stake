/**
 * TROPHÉES VISIBLES (docs/PROPOSITION_RECOMPENSES_VISUELLES.md) — pièces d'art (ART BIBLE : lumière en haut à gauche,
 * encre, palette). Jamais d'or : l'or est le signal du BOSS FIGHT.
 *   HALL OF SHAME : Polaroïd, pince à linge, icônes des 9 gadgets, mini B.B. sonné, étoile de rareté.
 *   Cicatrices du bureau : tache de café, brûlure, flaque, planches scotchées, fissure, avion en papier planté.
 *   Étapes du bureau : cartons de plaintes, panneau, plaque 100 %, plaque de bureau.
 *   B.B. porte les marques : pansements, bandage, œil au beurre noir, bosse, touffe roussie, plâtre, minerve, tache.
 *   Gadgets de légende : aura et scintillement (teintables).
 */
import { c, cel, ellipsePath, fill, line, part, radialGradient, rectPath, type ArtPart } from '../svg';

// ------------------------------------------------------------------ HALL OF SHAME

/** Polaroïd (le contenu de la photo est composé par la scène dans la fenêtre sombre). Pivot : haut, au milieu. */
const polaroid = part('tr_polaroid', 'mid', 36, 42, 18, 2, [
  cel(rectPath(2, 2, 32, 38, 1.5), { base: 'paper', shade: 'paperShade' }, { stroke: 1.5, shade: [0, 3] }),
  fill(rectPath(5, 5, 26, 24, 1), 'screen'),
].join(''));

/** Pince à linge. Pivot : haut, au milieu. */
const pin = part('tr_pin', 'mid', 8, 14, 4, 1, cel(rectPath(1, 1, 6, 12, 1.5), { base: 'wood', shade: 'woodShade', light: 'woodLight' }, {
  stroke: 1.5, shade: [2, 0], rim: 1, over: line('M4 3V11', 'woodDark', 1.5),
}));

/** Étoile de rareté (base claire : teintée par la scène). */
const star = part('tr_star', 'ui', 12, 12, 6, 6, cel('M6 1L7.4 4.4L11 4.6L8.2 7L9.2 10.6L6 8.6L2.8 10.6L3.8 7L1 4.6L4.6 4.4Z', { base: 'paper' }, { stroke: 1.5 }));

/** Mini B.B. sonné (yeux en X), pour les photos. Pivot : centre. */
const face = part('tr_face', 'ui', 22, 22, 11, 11, [
  cel(ellipsePath(11, 12, 9, 9), { base: 'skin', shade: 'skinShade' }, { stroke: 1.5, shade: [2, 2] }),
  line('M5 3C8 0 10 4 11 1C12 4 15 1 16 4', 'hair', 2),
  line('M6 9L9 12M9 9L6 12M13 9L16 12M16 9L13 12', 'ink', 1.5),
  fill(ellipsePath(11, 16, 2.4, 2), 'mouth'),
].join(''));

/** Icônes des gadgets (photos du mur, badges). 20 × 20, pivot centre. */
const icon = (id: string, body: string): ArtPart => part(`tr_ic_${id}`, 'ui', 20, 20, 10, 10, body);
const ICONS: readonly ArtPart[] = [
  icon('swivel-slingshot', line('M10 18V10M10 10L4 3M10 10L16 3', 'wood', 3) + line('M4 3C7 7 13 7 16 3', 'elastic', 1.5)),
  icon('espresso-blaster', cel('M5 6H15L13.5 17H6.5Z', { base: 'paper', shade: 'paperShade' }, { stroke: 1.5, shade: [2, 0] }) + fill(ellipsePath(10, 6, 5, 1.6), 'coffee') + line('M8 4C7 2 9 1 8 0', 'paper', 1.5)),
  icon('copier-catapult', cel(rectPath(2, 7, 16, 10, 1.5), { base: 'metalLight', shade: 'metalShade' }, { stroke: 1.5, shade: [2, 2] }) + cel(rectPath(5, 2, 10, 6), { base: 'paper' }, { stroke: 1.5 })),
  icon('trapdoor-express', cel(rectPath(2, 5, 16, 11, 1), { base: 'screen' }, { stroke: 1.5 }) + line('M4 8H16M4 12H16', 'hazard', 1.5)),
  icon('cabinet-domino', [[2, 0.2], [8, 0], [14, -0.2]].map(([x, r]) => `<g transform="rotate(${(r ?? 0) * 57} ${(x ?? 0) + 2} 16)">${cel(rectPath(x ?? 0, 4, 5, 13, 1), { base: 'metal', shade: 'metalShade' }, { stroke: 1.5, shade: [1, 0] })}</g>`).join('')),
  icon('cooler-bowling', cel('M6 4H14L15 16C15 18 5 18 5 16Z', { base: 'glass', shade: 'sky' }, { stroke: 1.5, shade: [2, 0] }) + fill(rectPath(8, 1, 4, 3), 'teal')),
  icon('office-rocket', cel('M10 1C14 5 14 12 13 15H7C6 12 6 5 10 1Z', { base: 'red', shade: 'redShade', light: 'redLight' }, { stroke: 1.5, shade: [2, 0], rim: 1 }) + fill('M8 15L10 19L12 15Z', 'fire')),
  icon('ceiling-safe', cel(rectPath(3, 4, 14, 14, 2), { base: 'metalDark', shade: 'screen' }, { stroke: 1.5, shade: [2, 2] }) + fill(ellipsePath(10, 11, 3, 3), 'metal') + line('M10 1V4', 'inkSoft', 1.5)),
  icon('hvac-hurricane', line('M4 5C10 3 16 5 14 8C12 11 6 9 7 12C8 15 13 14 12 17', 'smoke', 3)),
];

// ------------------------------------------------------------------ cicatrices du bureau

/** ESPRESSO BLASTER : tache de café au mur, avec coulures. Pivot : centre. */
const splat = part('tr_splat', 'mid', 64, 56, 32, 24, [
  fill('M30 6C36 2 40 10 46 8C54 6 58 16 52 22C60 26 58 36 50 36C48 44 38 44 34 40C28 46 18 42 18 36C8 36 6 26 14 22C8 16 14 6 22 10C24 6 26 6 30 6Z', 'coffee', 0.85),
  line('M24 40V52M36 42V48M46 36V50', 'coffee', 2.5, 0.85),
].join(''));

/** OFFICE ROCKET : brûlure au sol (vue rasante). Pivot : centre. */
const scorch = part('tr_scorch', 'mid', 90, 28, 45, 14, [
  fill(ellipsePath(45, 14, 42, 12), 'ink', 0.55),
  fill('M45 2L50 10L66 6L56 13L72 16L54 17L58 26L45 19L32 26L36 17L18 16L34 13L24 6L40 10Z', 'ink', 0.7),
].join(''));

/** WATER COOLER BOWLING : flaque. Pivot : centre. */
const puddle = part('tr_puddle', 'mid', 84, 22, 42, 11, cel('M8 12C6 4 24 2 36 5C48 1 70 2 76 8C82 14 70 20 52 18C40 22 20 21 12 18C6 17 8 14 8 12Z', { base: 'glass', shade: 'sky' }, {
  stroke: 1.5, ink: 'inkSoft', shade: [0, 3], over: line('M22 9C28 7 34 7 38 8', 'paper', 2),
}));

/** TRAPDOOR EXPRESS : planches clouées et scotch sur la trappe. Pivot : centre. */
const planks = part('tr_planks', 'mid', 96, 26, 48, 13, [
  `<g transform="rotate(-4 48 13)">${cel(rectPath(4, 4, 88, 8, 1), { base: 'wood', shade: 'woodShade', light: 'woodLight' }, { stroke: 2, shade: [0, 2], rim: 1 })}</g>`,
  `<g transform="rotate(5 48 13)">${cel(rectPath(6, 14, 84, 8, 1), { base: 'woodLight', shade: 'wood' }, { stroke: 2, shade: [0, 2] })}</g>`,
  line('M36 2L60 24M60 2L36 24', 'hazard', 2.5),
].join(''));

/** CEILING SAFE : parquet fendu (impact du coffre). Pivot : centre. */
const crack = part('tr_crack', 'mid', 80, 24, 40, 12, [
  fill(ellipsePath(40, 13, 30, 8), 'floorShade', 0.8),
  line('M12 12L24 10L30 14L40 8L50 14L58 11L70 13M30 14L28 20M50 14L54 21M40 8L38 3', 'ink', 2),
].join(''));

/** HVAC HURRICANE : avion en papier planté dans le mur. Pivot : la pointe. */
const plane = part('tr_plane', 'mid', 34, 18, 2, 9, cel('M2 9L32 2L24 9L32 16Z', { base: 'paper', shade: 'paperShade' }, { stroke: 1.5, shade: [0, 2], over: line('M2 9L24 9', 'inkSoft', 1.5) }));

// ------------------------------------------------------------------ étapes du bureau

/** Pile de cartons de plaintes RH. Pivot : sol, au milieu. */
const box = (x: number, y: number, w: number, h: number) => cel(rectPath(x, y, w, h, 1.5), { base: 'cork', shade: 'corkShade', light: 'postit' }, {
  stroke: 2, shade: [4, 3], rim: 1.5, inner: line(`M${x} ${y + 8}H${x + w}`, 'corkShade', 2),
});
const boxes = part('tr_boxes', 'mid', 96, 76, 48, 74, [box(4, 38, 44, 36), box(48, 42, 44, 32), box(22, 6, 46, 34)].join(''));

/** Panneau blanc (texte posé par la scène). Pivot : haut, au milieu. */
const board = part('tr_board', 'mid', 132, 46, 66, 2, cel(rectPath(3, 3, 126, 40, 3), { base: 'paper', shade: 'paperShade' }, { stroke: 2.5, shade: [0, 4] }));

/** Plaque 100 % (platine, jamais dorée). Pivot : haut, au milieu. */
const plaque = part('tr_plaque', 'mid', 58, 36, 29, 2, [
  cel(rectPath(2, 2, 54, 32, 3), { base: 'wood', shade: 'woodShade', light: 'woodLight' }, { stroke: 2, shade: [3, 3], rim: 1.5 }),
  cel(rectPath(8, 7, 42, 22, 2), { base: 'metalLight', shade: 'metal' }, { stroke: 1.5, shade: [2, 2] }),
].join(''));

/** Plaque de bureau (EX-BOSS). Pivot : bas, au milieu. */
const nameplate = part('tr_nameplate', 'prop', 84, 24, 42, 23, [
  cel('M6 22L12 4H72L78 22Z', { base: 'wood', shade: 'woodShade', light: 'woodLight' }, { stroke: 2.5, shade: [4, 2], rim: 1.5 }),
  cel(rectPath(16, 7, 52, 12, 1.5), { base: 'metalLight', shade: 'metal' }, { stroke: 1.5, shade: [2, 1] }),
].join(''));

// ------------------------------------------------------------------ B.B. porte les marques (repère de la tête / du rig)

/** Pansement en croix (front). Pivot : centre. */
const bandaid = part('bb_inj_bandaid', 'character', 32, 32, 16, 16, [
  `<g transform="rotate(35 16 16)">${cel(rectPath(2, 11, 28, 10, 4), { base: 'skinLight', shade: 'skinShade' }, { stroke: 2, shade: [0, 2] })}</g>`,
  `<g transform="rotate(-35 16 16)">${cel(rectPath(2, 11, 28, 10, 4), { base: 'skinLight', shade: 'skinShade' }, { stroke: 2, shade: [0, 2] })}</g>`,
  fill(rectPath(12, 12, 8, 8, 1.5), 'paperShade'),
].join(''));

/** Pansement simple (coupure de papier, joue). Pivot : centre. */
const papercut = part('bb_inj_papercut', 'character', 24, 12, 12, 6, cel(rectPath(1, 2, 22, 8, 3.5), { base: 'skinLight', shade: 'skinShade' }, {
  stroke: 2, shade: [0, 2], over: fill(rectPath(9, 3, 6, 6, 1), 'paperShade'),
}));

/** Tache de café sur la chemise et la veste. Pivot : centre. */
const stain = part('bb_inj_stain', 'character', 38, 34, 19, 17, [
  fill('M18 4C24 2 28 8 32 8C36 12 34 18 30 20C32 26 26 30 22 28C18 32 10 30 10 26C4 24 4 16 8 14C6 8 12 4 18 4Z', 'coffee', 0.8),
  fill(ellipsePath(28, 30, 2.5, 2.5), 'coffee', 0.8),
].join(''));

/** Bandage autour du crâne (croissant qui suit le haut de la tête) et son nœud. Pivot : bas du croissant, au milieu. */
const headwrap = part('bb_inj_headwrap', 'character', 128, 50, 64, 42, [
  cel('M6 42C12 14 42 4 64 4C86 4 116 14 122 42L110 46C104 22 84 15 64 15C44 15 24 22 18 46Z', { base: 'paper', shade: 'paperShade' }, {
    stroke: 2.5, shade: [0, 3], inner: line('M20 30C30 18 46 12 64 12M44 10C56 8 74 8 88 12', 'paperShade', 1.5),
  }),
  cel('M112 30L126 22L124 36Z', { base: 'paper', shade: 'paperShade' }, { stroke: 2, shade: [0, 2] }),
  cel('M112 34L124 44L110 44Z', { base: 'paper', shade: 'paperShade' }, { stroke: 2, shade: [0, 2] }),
].join(''));

/** Œil au beurre noir (anneau autour de l'œil gauche, sous le blanc de l'œil). Pivot : centre. */
const blackeye = part('bb_inj_blackeye', 'character', 44, 48, 22, 24, `<ellipse cx="22" cy="24" rx="19" ry="21" fill="${c('night')}" opacity="0.8"/><ellipse cx="22" cy="26" rx="21" ry="18" fill="${c('suitShade')}" opacity="0.35"/>`);

/** Bosse sur le crâne. Pivot : bas, au milieu. */
const bump = part('bb_inj_bump', 'character', 30, 22, 15, 20, cel('M3 20C3 8 9 3 15 3C21 3 27 8 27 20Z', { base: 'nose', shade: 'skinShade', light: 'skinLight' }, {
  stroke: 2.5, shade: [4, 2], rim: 1.5, over: `<ellipse cx="11" cy="9" rx="3" ry="2" fill="${c('paper')}" opacity="0.8"/>`,
}));

/** Touffe roussie : pointes brûlées posées sur la touffe (même repère : pivot 28, 52). */
const singed = part('bb_inj_singed', 'character', 64, 58, 28, 52, [
  fill('M36 10C38 4 42 2 42 2C40 8 42 14 44 16C40 18 36 16 36 10Z', 'ink', 0.85),
  fill('M52 18C56 15 60 14 60 14C57 18 56 24 56 26C52 26 50 22 52 18Z', 'ink', 0.85),
  fill('M16 24C17 22 18 20 18 20C17 26 18 30 20 32C16 32 14 28 16 24Z', 'ink', 0.85),
  line('M45 7C47 4 50 5 49 1', 'smoke', 2, 0.8),
].join(''));

/** Plâtre sur l'avant-bras (enfant du coude). Pivot : haut, au milieu. */
const cast = part('bb_inj_cast', 'character', 34, 30, 17, 2, cel(rectPath(2, 2, 30, 26, 6), { base: 'paper', shade: 'paperShade' }, {
  stroke: 3, shade: [4, 0], inner: line('M8 10C12 8 14 14 18 10M12 20L22 18', 'teal', 1.5) + fill(ellipsePath(24, 12, 2, 2), 'red'),
}));

/** Minerve (sous le menton). Pivot : centre. */
const brace = part('bb_inj_brace', 'character', 96, 26, 48, 13, cel('M6 6C30 2 66 2 90 6L88 22C64 26 32 26 8 22Z', { base: 'paper', shade: 'paperShade' }, {
  stroke: 3, shade: [0, 4], inner: fill(rectPath(40, 6, 16, 16, 2), 'teal') + line('M16 14H34M62 14H80', 'paperShade', 2),
}));

// ------------------------------------------------------------------ gadgets de légende

/** Aura douce (teintée par la scène : chrome, néon, holographique — jamais dorée). Pivot : centre. */
const auraG = radialGradient([[0, 'paper', 0.9], [0.45, 'paper', 0.35], [1, 'paper', 0]]);
const aura = part('tr_aura', 'vfx', 160, 160, 80, 80, `<defs>${auraG.def}</defs><circle cx="80" cy="80" r="78" fill="url(#${auraG.id})"/>`);

/** Scintillement (teinté par la scène). Pivot : centre. */
const twinkle = part('tr_twinkle', 'vfx', 18, 18, 9, 9, `<path d="M9 0L10.6 7.4L18 9L10.6 10.6L9 18L7.4 10.6L0 9L7.4 7.4Z" fill="${c('paper')}"/>`);

export const TROPHY_PARTS: readonly ArtPart[] = [
  polaroid, pin, star, face, ...ICONS,
  splat, scorch, puddle, planks, crack, plane,
  boxes, board, plaque, nameplate,
  bandaid, papercut, stain, headwrap, blackeye, bump, singed, cast, brace,
  aura, twinkle,
];
