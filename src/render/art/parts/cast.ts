/**
 * Seconds rôles (ART BIBLE §5.2–5.4) : Wendell (grand, mince, voûté, lunettes rondes), COO (pigeon minuscule,
 * mini-cravate rouge) et les mains du joueur (manchettes bleu marine). Pieds à y = 0.
 */
import { c, cel, ellipsePath, fill, line, nid, part, rectPath, type ArtPart } from '../svg';

const OUT = 4.5;
const IN = 2.5;

// ------------------------------------------------------------------ WENDELL

const wLeg = part('w_leg', 'character', 26, 112, 11, 3, [
  cel('M4 2H18L17 98H6Z', { base: 'wPants', shade: 'wPantsShade', light: 'paperShade' }, { stroke: OUT - 1, shade: [5, 0], rim: 2 }),
  cel('M2 100C2 94 8 92 13 92C20 92 25 96 25 102C25 106 22 108 17 108H6C3 108 2 104 2 100Z', { base: 'woodDark', light: 'wood' }, { stroke: OUT - 1, rim: 2 }),
].join(''));

const W_TORSO = 'M16 10C22 4 42 4 48 10C54 16 56 30 54 52L52 92C52 96 48 98 44 98H20C16 98 12 96 12 92L10 52C8 30 10 16 16 10Z';
const wTorso = part('w_torso', 'character', 64, 102, 32, 96, cel(W_TORSO, { base: 'wShirt', shade: 'wShirtShade', light: 'wShirtLight' }, {
  stroke: OUT - 1, shade: [7, 4], rim: 2.5,
  inner: [
    // Col, cravate verte, poche à stylos, badge sans texte, ceinture.
    fill('M24 4L32 16L40 4Z', 'wShirtLight'),
    line('M22 6L32 18L42 6', 'ink', IN),
    cel('M29 16H35L37 22L35 60L32 66L29 60L27 22Z', { base: 'wTie', shade: 'wTieShade' }, { stroke: 2, shade: [3, 0] }),
    line('M38 34H50', 'wShirtShade', 2),
    line('M42 34V26M46 34V28', 'cuff', 2.5),
    `<circle cx="42" cy="25" r="1.6" fill="${c('red')}"/>`,
    cel(rectPath(14, 40, 12, 16, 2), { base: 'paper', shade: 'paperShade' }, { stroke: 1.5, shade: [0, 2] }),
    fill(rectPath(16, 43, 8, 4, 1), 'wShirtShade'),
    cel(rectPath(8, 84, 48, 12, 2), { base: 'woodDark', light: 'wood' }, { stroke: 2, rim: 1.5 }),
    fill(rectPath(28, 85, 8, 10, 1), 'metal'),
  ].join(''),
}));

const W_HEAD = 'M35 10C52 10 60 24 60 42C60 62 50 76 35 76C20 76 10 62 10 42C10 24 18 10 35 10Z';
const wHead = part('w_head', 'character', 72, 88, 36, 80, `<g transform="translate(1 4)">${[
  cel('M10 40C4 38 2 46 6 52C8 56 12 56 12 52Z', { base: 'skin', shade: 'skinShade' }, { stroke: IN + 0.5, shade: [-2, 2] }),
  cel('M60 40C66 38 68 46 64 52C62 56 58 56 58 52Z', { base: 'skin', shade: 'skinShade' }, { stroke: IN + 0.5, shade: [2, 2] }),
  cel(W_HEAD, { base: 'skin', shade: 'skinShade', light: 'skinLight' }, { stroke: OUT - 0.5, shade: [7, 6], rim: 2.5 }),
  // Cheveux en bataille.
  cel('M10 36C8 20 18 6 34 6C50 4 62 16 60 34C56 26 52 22 46 22C48 28 46 30 44 30C42 24 36 20 30 22C30 28 26 30 22 28C22 24 18 24 16 28C14 30 12 34 10 36Z', { base: 'wHair', light: 'wHairLight' }, { stroke: IN + 0.5, rim: 2.5 }),
  cel('M30 8C26 0 30 -4 36 -2C34 2 36 4 38 6Z', { base: 'wHair', light: 'wHairLight' }, { stroke: IN, rim: 1.5 }),
  // Long nez.
  cel('M35 44C38 50 42 56 40 60C38 62 32 62 31 58Z', { base: 'skin', shade: 'skinShade', light: 'skinLight' }, { stroke: IN, shade: [3, 2], rim: 1.5 }),
].join('')}</g>`);
/** Lunettes rondes (verres légèrement teintés) : par-dessus les yeux. */
const wGlasses = part('w_glasses', 'character', 60, 30, 30, 15, [
  `<circle cx="15" cy="15" r="11" fill="${c('glass')}" opacity="0.35" stroke="${c('ink')}" stroke-width="3"/>`,
  `<circle cx="45" cy="15" r="11" fill="${c('glass')}" opacity="0.35" stroke="${c('ink')}" stroke-width="3"/>`,
  line('M26 14C28 12 32 12 34 14', 'ink', IN),
  line('M9 9L13 7M39 9L43 7', 'paper', 2, 0.9),
].join(''));
const wEye = part('w_eye', 'character', 14, 14, 7, 7, `<circle cx="7" cy="7" r="3.8" fill="${c('ink')}"/><circle cx="6" cy="5.5" r="1.2" fill="${c('paper')}"/>`);
const wEyeClosed = part('w_eye_closed', 'character', 16, 10, 8, 5, line('M2 3C5 7 11 7 14 3', 'ink', IN + 0.5));
const wBrow = part('w_brow', 'character', 18, 10, 9, 5, line('M2 7C6 3 12 2 16 4', 'wHair', 3.5));
const wMouths: ArtPart[] = [
  part('w_mouth_worried', 'character', 24, 12, 12, 6, line('M3 8C6 4 9 4 12 7C15 10 18 9 21 5', 'ink', IN + 0.5)),
  part('w_mouth_smile', 'character', 24, 14, 12, 7, line('M3 4C8 12 16 12 21 4', 'ink', IN + 0.5)),
  part('w_mouth_o', 'character', 16, 18, 8, 9, cel(ellipsePath(8, 9, 5, 6.5), { base: 'mouth' }, { stroke: IN })),
  part('w_mouth_grimace', 'character', 26, 16, 13, 8, cel(rectPath(3, 3, 20, 10, 4), { base: 'paper', shade: 'paperShade' }, { stroke: IN, shade: [0, 2], over: line('M4 8H22M10 3V13M16 3V13', 'ink', 1.5) })),
];
/** Bras de Wendell : manche courte + avant-bras nu. */
const wArmUp = part('w_arm_up', 'character', 24, 44, 12, 5, [
  cel('M3 6C3 1 21 1 21 6L20 22H4Z', { base: 'wShirt', shade: 'wShirtShade', light: 'wShirtLight' }, { stroke: OUT - 1.5, shade: [5, 0], rim: 2 }),
  cel('M7 22H17L16 42H8Z', { base: 'skin', shade: 'skinShade' }, { stroke: OUT - 1.5, shade: [3, 0] }),
].join(''));
const wArmFore = part('w_arm_fore', 'character', 18, 42, 9, 3, cel('M4 2H14L13 38H5Z', { base: 'skin', shade: 'skinShade', light: 'skinLight' }, { stroke: OUT - 1.5, shade: [3, 0], rim: 1.5 }));
const wHand = part('w_hand', 'character', 24, 26, 12, 3, cel('M6 3C9 1 15 1 18 3C21 8 21 16 18 21C15 24 9 24 6 21C3 16 3 8 6 3Z', { base: 'skin', shade: 'skinShade', light: 'skinLight' }, {
  stroke: OUT - 1.5, shade: [3, 3], rim: 1.5, over: line('M9 15V20M13 15V21', 'skinShade', 1.5),
}));
const wThumb = part('w_thumb', 'character', 26, 34, 13, 26, cel('M6 14C6 10 10 10 12 12L12 4C12 0 18 0 18 4V14C22 14 22 20 20 22C22 24 20 30 16 30H9C6 30 5 26 5 22Z', { base: 'skin', shade: 'skinShade', light: 'skinLight' }, {
  stroke: OUT - 1.5, shade: [3, 3], rim: 1.5,
}));
const wFolders = part('w_folders', 'character', 60, 40, 30, 20, [
  ...[0, 1, 2, 3].map((i) => cel(rectPath(4 + (i % 2) * 2, 26 - i * 7, 52, 8, 1.5), { base: i % 2 ? 'postit' : 'paperShade', shade: i % 2 ? 'postitShade' : 'wallShade' }, { stroke: 2, shade: [0, 3] })),
].join(''));
/** Casque de chantier (UNHINGED). */
const wHelmet = part('w_helmet', 'character', 76, 40, 38, 36, cel('M8 34C8 16 20 4 38 4C56 4 68 16 68 34H74C74 38 72 38 70 38H6C4 38 2 38 2 34Z', { base: 'hazard', shade: 'tieShade', light: 'tieLight' }, {
  stroke: OUT - 1, shade: [6, 4], rim: 2.5, inner: fill(rectPath(33, 2, 10, 34, 3), 'tieShade'),
}));

// ------------------------------------------------------------------ COO (pigeon, profil tourné vers la droite)

const cooBody = part('coo_body', 'character', 70, 52, 38, 48, [
  line('M30 40L28 48M40 40L42 48', 'beak', 3.5),
  line('M24 48H32M38 48H46', 'beak', 3),
  // Queue.
  cel('M14 24L0 18L2 30L12 34Z', { base: 'cooShade', light: 'coo' }, { stroke: IN, rim: 1.5 }),
  cel('M10 26C10 14 22 6 36 8C50 8 60 16 60 28C60 38 50 44 36 44C22 44 10 38 10 26Z', { base: 'coo', shade: 'cooShade', light: 'cooLight' }, {
    stroke: IN + 0.5, shade: [5, 5], rim: 2.5,
    inner: `<path d="M44 8C54 10 60 16 60 26C54 22 48 20 42 20Z" fill="${c('cooNeck')}"/><path d="M42 20C48 20 54 22 60 26C60 30 58 32 56 32C52 28 46 26 40 26Z" fill="${c('cooNeck2')}"/>`,
  }),
  // Mini-cravate rouge (trait absurde de bureau).
  cel('M48 24L54 24L53 28L56 38L51 42L47 38L49 28Z', { base: 'red', shade: 'redShade' }, { stroke: 1.5, shade: [2, 0] }),
].join(''));
const cooHead = part('coo_head', 'character', 40, 34, 14, 26, [
  cel(ellipsePath(18, 16, 13, 12), { base: 'coo', shade: 'cooShade', light: 'cooLight' }, { stroke: IN + 0.5, shade: [3, 3], rim: 2 }),
  cel('M29 14L39 18L29 21Z', { base: 'beak', shade: 'pot' }, { stroke: 1.5, shade: [0, 2] }),
  `<ellipse cx="29" cy="13" rx="2.5" ry="2" fill="${c('paper')}"/>`,
  cel(ellipsePath(20, 13, 6.5, 7), { base: 'paper' }, { stroke: 2 }),
  `<circle cx="21.5" cy="13.5" r="3.4" fill="${c('ink')}"/><circle cx="20.5" cy="12" r="1.1" fill="${c('paper')}"/>`,
].join(''));
const cooWing = part('coo_wing', 'character', 40, 24, 6, 8, cel('M4 6C14 2 30 4 38 12C30 20 14 20 4 14Z', { base: 'cooShade', light: 'coo' }, {
  stroke: IN, rim: 2, over: line('M12 13C18 15 24 15 30 13', 'coo', 1.5),
}));

// ------------------------------------------------------------------ MAINS DU JOUEUR (dos des mains, manches bleu marine)

/**
 * Manche courte qui s'efface vers la caméra (masque de luminance : aucune couleur hors palette). Pivot : manchette.
 * Mains « flottantes » lisibles au milieu de la scène, sans colonnes sombres devant le décor.
 */
const sleeveMask = nid('m');
const sleeveGrad = nid('g');
const sleeve = part('hand_sleeve', 'character', 70, 96, 35, 6, `<defs><linearGradient id="${sleeveGrad}" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>`
  + `<mask id="${sleeveMask}"><rect width="70" height="96" fill="url(#${sleeveGrad})"/></mask></defs><g mask="url(#${sleeveMask})">`
  + cel('M18 4H52L62 96H8Z', { base: 'cuff', shade: 'cuffShade', light: 'wShirtShade' }, { stroke: OUT, shade: [8, 0], rim: 2.5 })
  + '</g>' + cel(rectPath(14, 0, 42, 16, 4), { base: 'paper', shade: 'paperShade' }, { stroke: OUT, shade: [0, 4] }));
const handBackOpen = part('hand_back_open', 'character', 64, 70, 32, 64, cel(
  'M14 62C8 52 8 42 12 34L6 20C4 14 12 12 14 18L20 30L20 8C20 2 28 2 28 8L29 26L31 4C31 -2 39 -2 39 4L38 26L42 8C42 2 50 4 49 10L46 30L52 20C55 14 62 18 58 24L50 44C48 54 44 60 40 62Z',
  { base: 'skin', shade: 'skinShade', light: 'skinLight' }, { stroke: OUT, shade: [6, 4], rim: 2.5, over: line('M22 44C26 42 32 42 36 44', 'skinShade', IN) },
));
const handBackFist = part('hand_back_fist', 'character', 64, 60, 32, 56, cel('M12 54C6 44 6 24 12 16C18 8 46 8 52 16C58 24 58 44 52 54Z', { base: 'skin', shade: 'skinShade', light: 'skinLight' }, {
  stroke: OUT, shade: [6, 4], rim: 2.5, over: line('M16 22C20 18 24 18 26 22M26 22C30 18 34 18 36 22M36 22C40 18 44 18 48 22', 'ink', IN),
}));
const lighter = part('hand_lighter', 'prop', 34, 70, 17, 66, [
  cel(rectPath(8, 30, 18, 36, 4), { base: 'red', shade: 'redShade', light: 'redLight' }, { stroke: 3.5, shade: [5, 0], rim: 2 }),
  cel(rectPath(9, 22, 16, 10, 2), { base: 'metal', shade: 'metalShade' }, { stroke: 2, shade: [3, 0] }),
  `<path d="M17 20C10 12 14 4 17 0C20 4 24 12 17 20Z" fill="${c('fire')}" stroke="${c('ink')}" stroke-width="2"/>`,
  `<path d="M17 18C14 14 15 9 17 6C19 9 20 14 17 18Z" fill="${c('tieLight')}"/>`,
].join(''));

export const CAST_PARTS: readonly ArtPart[] = [
  wLeg, wTorso, wHead, wGlasses, wEye, wEyeClosed, wBrow, ...wMouths, wArmUp, wArmFore, wHand, wThumb, wFolders, wHelmet,
  cooBody, cooHead, cooWing, sleeve, handBackOpen, handBackFist, lighter,
];

