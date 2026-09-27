/**
 * POC « 3 PLANS » — prototypes visuels des plans B et C de GRUMPY (ART BIBLE : même lumière, même encre, palette).
 * Volontairement simples : ils servent à tester la sélection, l'UX et la compréhension, pas à finir les gadgets.
 *   B · ESPRESSO BLASTER : machine à espresso rouge sur chariot, canon chromé, manomètre, vapeur.
 *   C · COPIER CATAPULT  : photocopieuse dont le capot sert de bras de catapulte, ramette en projectile.
 */
import { cel, ellipsePath, fill, line, part, radialGradient, rectPath, softShadow, type ArtPart } from '../svg';

// ------------------------------------------------------------------ B · ESPRESSO BLASTER

/** Corps + chariot. Pivot : sol, sous le milieu du chariot. Le canon se fixe à (+56, −104) du pivot. */
const espBody = part('esp_body', 'prop', 150, 176, 72, 172, [
  softShadow(76, 170, 60, 6, 0.3, 4),
  // Chariot : montants, tablette basse, roues.
  cel(rectPath(30, 118, 8, 44, 3), { base: 'metalShade', light: 'metal' }, { stroke: 2, rim: 1.5 }),
  cel(rectPath(108, 118, 8, 44, 3), { base: 'metalShade', light: 'metal' }, { stroke: 2, rim: 1.5 }),
  cel(rectPath(24, 140, 100, 8, 3), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 2, shade: [0, 3], rim: 1.5 }),
  cel(ellipsePath(34, 162, 11, 11), { base: 'metalDark', light: 'metalShade' }, { stroke: 3, rim: 2 }),
  cel(ellipsePath(112, 162, 11, 11), { base: 'metalDark', light: 'metalShade' }, { stroke: 3, rim: 2 }),
  fill(ellipsePath(34, 162, 4, 4), 'metal'),
  fill(ellipsePath(112, 162, 4, 4), 'metal'),
  cel(rectPath(16, 110, 116, 11, 4), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 3, shade: [0, 4], rim: 2 }),
  // Machine : caisse rouge, couronne chromée, tasses sur le chauffe-tasses.
  cel(rectPath(26, 40, 94, 74, 12), { base: 'red', shade: 'redShade', light: 'redLight' }, {
    stroke: 3.5, shade: [8, 6], rim: 2.5,
    inner: line('M26 98H120', 'redShade', 2) + line('M34 104H112', 'redShade', 1.5),
  }),
  cel(rectPath(20, 28, 106, 16, 6), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 3, shade: [0, 5], rim: 2 }),
  cel('M40 28L42 14H56L58 28Z', { base: 'paper', shade: 'paperShade' }, { stroke: 2, shade: [3, 0] }),
  cel('M64 28L66 16H78L80 28Z', { base: 'paper', shade: 'paperShade' }, { stroke: 2, shade: [3, 0] }),
  line('M44 20H54M68 21H76', 'red', 2),
  // Façade : plaque chromée, manomètre (l'aiguille est une pièce à part), bouton.
  cel(rectPath(34, 50, 64, 40, 8), { base: 'metalLight', shade: 'metal', light: 'paper' }, { stroke: 2.5, shade: [5, 4], rim: 1.5 }),
  cel(ellipsePath(54, 70, 14, 14), { base: 'paper', shade: 'paperShade' }, { stroke: 2.5, shade: [3, 3] }),
  line('M44 75A11 11 0 0 1 48 60', 'plant', 2),
  line('M59 60A11 11 0 0 1 65 73', 'red', 2),
  line('M54 58V61M43 70H46M62 70H65', 'inkSoft', 1.5),
  cel(ellipsePath(84, 64, 7, 7), { base: 'plant', shade: 'plantShade', light: 'plantLight' }, { stroke: 2, shade: [2, 2], rim: 1.5 }),
  cel(rectPath(78, 76, 14, 6, 2), { base: 'metalDark' }, { stroke: 1.5 }),
  // Tête de groupe (support du canon), à droite.
  cel(rectPath(112, 56, 22, 26, 6), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 3, shade: [4, 4], rim: 2 }),
  // Levier de tir (le joueur le tire).
  line('M30 30C26 18 22 10 16 6', 'metalDark', 5).replace('<path ', '<path data-tube="1" '),
  cel(ellipsePath(15, 6, 7, 6), { base: 'red', shade: 'redShade', light: 'redLight' }, { stroke: 2, shade: [2, 2], rim: 1.5 }),
  // Buse vapeur.
  line('M26 60C14 62 12 76 16 90', 'metalShade', 4).replace('<path ', '<path data-tube="1" '),
].join(''));

/** Aiguille du manomètre. Pivot : son axe. Rotation −1,2 (repos) → +1,2 (surpression). */
const espNeedle = part('esp_needle', 'prop', 6, 16, 3, 13, line('M3 13V3', 'ink', 2) + fill(ellipsePath(3, 13, 2.5, 2.5), 'ink'));

/** Canon chromé. Pivot : sa fixation sur la tête de groupe ; il vise vers le haut et vers B.B. */
const espBarrel = part('esp_barrel', 'prop', 104, 48, 8, 24, [
  cel(rectPath(4, 14, 76, 20, 8), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 3.5, shade: [0, 6], rim: 2 }),
  cel(rectPath(30, 12, 10, 24, 3), { base: 'red', shade: 'redShade' }, { stroke: 2, shade: [3, 0] }),
  cel('M76 12L98 4C101 16 101 32 98 44L76 36Z', { base: 'metalLight', shade: 'metal', light: 'paper' }, { stroke: 3.5, shade: [4, 5], rim: 2 }),
  fill(ellipsePath(96, 24, 3, 12), 'metalDark'),
].join(''));

/** Tasse projectile (gobelet de papier plein). Pivot : centre. */
const espCup = part('esp_cup', 'prop', 38, 42, 19, 21, [
  cel('M6 10H32L28 38H10Z', { base: 'paper', shade: 'paperShade' }, { stroke: 3, shade: [5, 0] }),
  cel(rectPath(8, 18, 22, 7, 2), { base: 'red', shade: 'redShade' }, { stroke: 1.5 }),
  cel(ellipsePath(19, 10, 13, 5), { base: 'coffee' }, { stroke: 2.5 }),
].join(''));

// ------------------------------------------------------------------ C · COPIER CATAPULT

/** Photocopieuse. Pivot : sol, au milieu. Le capot (bras) est articulé à (−74, −118) du pivot. */
const copBody = part('cop_body', 'prop', 176, 168, 88, 164, [
  softShadow(90, 162, 72, 6, 0.3, 4),
  // Meuble (tiroirs à papier) et pieds.
  cel(rectPath(18, 72, 142, 84, 8), { base: 'paperShade', shade: 'metal', light: 'paper' }, {
    stroke: 3.5, shade: [8, 6], rim: 2,
    inner: line('M18 100H160M18 128H160', 'metal', 2),
  }),
  cel(rectPath(70, 84, 38, 6, 3), { base: 'metalDark' }, { stroke: 1.5 }),
  cel(rectPath(70, 110, 38, 6, 3), { base: 'metalDark' }, { stroke: 1.5 }),
  cel(rectPath(70, 136, 38, 6, 3), { base: 'metalDark' }, { stroke: 1.5 }),
  cel(rectPath(24, 154, 16, 8, 2), { base: 'metalDark' }, { stroke: 2 }),
  cel(rectPath(138, 154, 16, 8, 2), { base: 'metalDark' }, { stroke: 2 }),
  // Scanner (sous le capot) et vitre.
  cel(rectPath(12, 46, 154, 30, 6), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 3.5, shade: [0, 6], rim: 2 }),
  fill(rectPath(22, 50, 104, 5, 2), 'glass'),
  // Pupitre : écran, gros bouton vert (le joueur l'enfonce), bouton rouge.
  cel('M128 38L166 38L170 50L126 50Z', { base: 'metalShade', light: 'metal' }, { stroke: 2.5, rim: 1.5 }),
  cel(rectPath(132, 40, 18, 8, 2), { base: 'screen', light: 'screenLight' }, { stroke: 1.5, rim: 1.5 }),
  line('M135 44H146', 'screenGlow', 1.5),
  cel(ellipsePath(158, 44, 5, 4), { base: 'plant', shade: 'plantShade', light: 'plantLight' }, { stroke: 1.5, shade: [2, 1], rim: 1.5 }),
  // Bac de sortie, à gauche (la feuille qui dépasse est une pièce à part).
  cel('M18 86L2 80L2 90L18 96Z', { base: 'metalShade', light: 'metal' }, { stroke: 2.5, rim: 1.5 }),
  // Ressort de catapulte visible sous le capot (côté charnière).
  line('M20 46C26 40 16 36 22 30C28 24 18 20 24 14', 'metalDark', 3),
].join(''));

/** Capot = bras de catapulte. Pivot : la charnière (à gauche). Rotation négative = il se relève. */
const copLid = part('cop_lid', 'prop', 162, 26, 8, 18, [
  cel(rectPath(4, 6, 154, 16, 5), { base: 'paperShade', shade: 'metal', light: 'paper' }, { stroke: 3.5, shade: [0, 5], rim: 2 }),
  cel(rectPath(120, 2, 30, 8, 3), { base: 'metalDark', light: 'metalShade' }, { stroke: 2, rim: 1.5 }),
  fill(ellipsePath(8, 18, 4, 4), 'metalDark'),
].join(''));

/** Feuille qui sort du bac. Pivot : son bord intérieur (elle glisse vers la gauche). */
const copSheet = part('cop_sheet', 'prop', 60, 14, 56, 7, cel('M56 2L6 2C3 4 3 10 6 12L56 12Z', { base: 'paper', shade: 'paperShade' }, { stroke: 2, shade: [0, 3] }) + line('M14 6H40M14 9H32', 'metal', 1.5));

/** Ramette (projectile). Pivot : centre. */
const copReam = part('cop_ream', 'prop', 66, 40, 33, 20, [
  cel(rectPath(4, 8, 58, 26, 4), { base: 'paper', shade: 'paperShade' }, { stroke: 3, shade: [5, 5], inner: line('M4 16H62M4 22H62M4 28H62', 'paperShade', 1.5) }),
  cel(rectPath(24, 6, 16, 30, 2), { base: 'hazard', shade: 'tieShade' }, { stroke: 2, shade: [3, 0] }),
].join(''));

// ------------------------------------------------------------------ Sélection : halo au sol (lumière douce, pas d'or)

const spotBody = (() => {
  const g = radialGradient([[0, 'paper', 0.85], [0.55, 'skyLight', 0.35], [1, 'skyLight', 0]]);
  return `<defs>${g.def}</defs><ellipse cx="100" cy="30" rx="100" ry="30" fill="url(#${g.id})"/>`;
})();
const planSpot = part('plan_spot', 'vfx', 200, 60, 100, 30, spotBody);

export const PLAN_PARTS: readonly ArtPart[] = [espBody, espNeedle, espBarrel, espCup, copBody, copLid, copSheet, copReam, planSpot];

/** Points d'ancrage (unités, relatifs au pivot du corps). */
export const ESP_ANCHORS = { barrel: { x: 56, y: -104 }, needle: { x: -18, y: -102 } } as const;
export const COP_ANCHORS = { lid: { x: -74, y: -122 }, sheet: { x: -70, y: -76 } } as const;
