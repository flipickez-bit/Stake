/**
 * B.B. — pièces du rig (ART BIBLE §5.1). Vue de face. Pieds à y = 0 dans le repère du rig.
 * Silhouette : grosse tête en poire + touffe en flamme, torse-tonneau violet, petites jambes, grosses mains, mug jaune.
 * Chaque pièce déclare son pivot ; ../BossRig.ts les assemble (mêmes noms d'animations que le placeholder).
 */
import { c, cel, ellipsePath, fill, line, mirrorX, nid, part, rectPath, type ArtPart } from '../svg';

const OUT = 4.5;
const IN = 2.5;

// ------------------------------------------------------------------ corps

const TORSO_D = 'M40 12C22 16 8 40 6 70C4 98 22 118 50 120L100 120C128 118 146 98 144 70C142 40 128 16 110 12C95 6 55 6 40 12Z';

const torso = part('bb_torso', 'character', 150, 126, 75, 116, cel(TORSO_D, { base: 'suit', shade: 'suitShade', light: 'suitLight' }, {
  stroke: OUT, shade: [12, 9], rim: 3.5,
  inner: [
    // Chemise (col en V) et revers.
    fill('M54 6L96 6L75 54Z', 'paper'),
    fill('M88 6L96 6L80 44Z', 'paperShade'),
    cel('M54 6L75 54L60 60L42 22Z', { base: 'suitLight', shade: 'suit' }, { stroke: IN, shade: [3, 2] }),
    cel('M96 6L75 54L90 60L108 22Z', { base: 'suit', shade: 'suitShade' }, { stroke: IN, shade: [3, 2] }),
    // Fermeture de la veste et boutons.
    line('M75 58C74 80 73 100 70 124', 'ink', IN),
    `<circle cx="81" cy="74" r="3.6" fill="${c('ink')}"/><circle cx="80" cy="96" r="3.6" fill="${c('ink')}"/>`,
    `<circle cx="80" cy="73" r="1.4" fill="${c('suitLight')}"/><circle cx="79" cy="95" r="1.4" fill="${c('suitLight')}"/>`,
    // Pochette jaune (poche poitrine gauche de B.B., à droite pour nous).
    line('M104 42L126 40', 'suitShade', IN),
    fill('M107 41L112 33L116 39L121 32L124 40Z', 'tie'),
    // Plis du ventre (ombre).
    line('M22 96C30 104 40 108 52 110', 'suitShade', IN),
  ].join(''),
}));

/** Jambe (gauche pour nous) : pantalon court + grosse chaussure. Pivot : hanche. */
function legBody(): string {
  return [
    cel('M6 0L26 0L25 22C25 26 23 28 20 28L11 28C8 28 6 26 6 22Z', { base: 'trousers', shade: 'trousersShade' }, { stroke: OUT, shade: [5, 0] }),
    cel('M2 24C2 18 8 16 16 16C26 16 34 20 36 28C37 34 32 36 24 36L6 36C2 36 0 32 2 24Z', { base: 'shoe', shade: 'ink', light: 'shoeLight' }, {
      stroke: OUT, shade: [0, 5], rim: 3,
    }),
    `<ellipse cx="22" cy="23" rx="5" ry="2.4" fill="${c('shoeLight')}"/>`,
  ].join('');
}
const legL = part('bb_leg_l', 'character', 40, 40, 24, 2, mirrorX(legBody(), 40));
const legR = part('bb_leg_r', 'character', 40, 40, 16, 2, legBody());

// ------------------------------------------------------------------ bras (2 segments) et mains

/** Haut du bras : manche violette. Pivot : épaule. */
const upperArm = part('bb_arm_up', 'character', 34, 46, 17, 7, cel('M5 8C5 2 29 2 29 8L28 38C28 44 6 44 6 38Z', { base: 'suit', shade: 'suitShade', light: 'suitLight' }, {
  stroke: OUT, shade: [6, 0], rim: 3,
}));
/** Avant-bras : manche + manchette blanche. Pivot : coude. */
const foreArm = part('bb_arm_fore', 'character', 32, 44, 16, 6, [
  cel('M5 6C5 1 27 1 27 6L26 30L6 30Z', { base: 'suit', shade: 'suitShade', light: 'suitLight' }, { stroke: OUT, shade: [6, 0], rim: 3 }),
  cel(rectPath(4, 28, 24, 12, 3), { base: 'paper', shade: 'paperShade' }, { stroke: OUT, shade: [4, 2] }),
].join(''));

/** Main ouverte (paume vers nous), doigts vers le bas. Pivot : poignet (haut). */
const HAND_OPEN = 'M10 4C18 2 30 2 36 6C40 12 40 18 38 22L44 30C47 34 43 38 39 35L36 32L37 44C37 49 31 49 31 44L30 36L29 48C29 53 23 53 23 48L22 36L20 46C20 51 14 51 14 46L15 34C10 34 6 30 5 24C3 16 4 8 10 4Z';
const handOpen = part('bb_hand_open', 'character', 50, 56, 22, 6, cel(HAND_OPEN, { base: 'skin', shade: 'skinShade', light: 'skinLight' }, {
  stroke: OUT, shade: [5, 4], rim: 2.5,
  over: line('M17 22C20 25 26 26 31 24', 'skinShade', IN),
}));
/** Poing. */
const HAND_FIST = 'M8 8C14 2 34 2 40 8C45 14 45 30 40 36C34 42 14 42 8 36C3 30 3 14 8 8Z';
const handFist = part('bb_hand_fist', 'character', 48, 46, 24, 6, cel(HAND_FIST, { base: 'skin', shade: 'skinShade', light: 'skinLight' }, {
  stroke: OUT, shade: [5, 4], rim: 2.5,
  over: line('M14 24C18 21 22 21 24 24M24 24C28 21 32 21 34 24M10 16C14 14 18 14 20 18', 'ink', IN),
}));
/** Main qui tient (anse du mug, cravate) : doigts repliés vers nous. */
const handGrip = part('bb_hand_grip', 'character', 48, 46, 24, 6, cel('M8 8C14 2 34 2 40 8C45 14 46 26 42 34C38 40 30 42 22 40C12 40 5 32 5 22C5 16 6 11 8 8Z', { base: 'skin', shade: 'skinShade', light: 'skinLight' }, {
  stroke: OUT, shade: [5, 4], rim: 2.5,
  over: line('M12 20C18 18 28 18 38 20M12 29C18 27 28 27 36 29', 'ink', IN),
}));

// ------------------------------------------------------------------ mug (jaune : signature ; or : BOSS FIGHT uniquement)

function mugBody(base: 'mug' | 'gold', shade: 'mugShade' | 'goldShade', light: 'tieLight' | 'goldLight', emblem: boolean): string {
  const body = 'M6 8L36 8L34 44C34 48 30 50 26 50L16 50C12 50 8 48 8 44Z';
  return [
    `<path data-tube="1" d="M34 16C46 14 48 34 34 36" fill="none" stroke="${c('ink')}" stroke-width="${OUT + 4}" stroke-linecap="round"/>`,
    `<path data-tube="1" d="M34 16C46 14 48 34 34 36" fill="none" stroke="${c(base)}" stroke-width="4.5" stroke-linecap="round"/>`,
    cel(body, { base, shade, light }, { stroke: OUT, shade: [7, 0], rim: 3 }),
    `<ellipse cx="21" cy="8.5" rx="15" ry="4" fill="${c('coffee')}" stroke="${c('ink')}" stroke-width="${IN}"/>`,
    emblem
      // Petite couronne (le « boss ») : aucun texte.
      ? cel('M13 32L15 22L19 28L21 20L23 28L27 22L29 32Z', { base: 'paper', shade: 'paperShade' }, { stroke: IN, shade: [2, 2] })
      : '',
  ].join('');
}
const mug = part('bb_mug', 'character', 50, 56, 21, 30, mugBody('mug', 'mugShade', 'tieLight', true));
const mugGold = part('bb_mug_gold', 'character', 50, 56, 21, 30, mugBody('gold', 'goldShade', 'goldLight', true)
  + `<path d="M40 4L42 9L47 11L42 13L40 18L38 13L33 11L38 9Z" fill="${c('goldLight')}" stroke="${c('ink')}" stroke-width="1.5"/>`);
/** Cosmétique « WORLD'S OKAYEST BOSS » : blanc à bande rouge (jamais doré, jamais turquoise). */
const mugOkayest = part('bb_mug_okayest', 'character', 50, 56, 21, 30, [
  `<path data-tube="1" d="M34 16C46 14 48 34 34 36" fill="none" stroke="${c('ink')}" stroke-width="${OUT + 4}" stroke-linecap="round"/>`,
  `<path data-tube="1" d="M34 16C46 14 48 34 34 36" fill="none" stroke="${c('paper')}" stroke-width="4.5" stroke-linecap="round"/>`,
  cel('M6 8L36 8L34 44C34 48 30 50 26 50L16 50C12 50 8 48 8 44Z', { base: 'paper', shade: 'paperShade' }, {
    stroke: OUT, shade: [7, 0], inner: fill(rectPath(0, 24, 44, 9), 'red'),
  }),
  `<ellipse cx="21" cy="8.5" rx="15" ry="4" fill="${c('coffee')}" stroke="${c('ink')}" stroke-width="${IN}"/>`,
].join(''));
/** Vapeur du café (animée par le rig). */
const steam = part('bb_steam', 'vfx', 26, 34, 13, 34, line('M9 32C3 26 15 20 9 12C6 8 9 4 12 2M18 30C14 25 22 21 18 15', 'paper', 3, 0.85));

// ------------------------------------------------------------------ cravate (clip-on, jaune)

const TIE_D = 'M8 2L22 2L20 12L27 52L15 66L3 52L10 12Z';
const tie = part('bb_tie', 'character', 30, 70, 15, 3, cel(TIE_D, { base: 'tie', shade: 'tieShade', light: 'tieLight' }, {
  stroke: IN + 1, shade: [5, 0], rim: 2.5,
  inner: fill('M3 12H27V15H3Z', 'tieShade') + fill(rectPath(6, 20, 18, 5, 1.5), 'metal') + fill(rectPath(6, 20, 18, 2, 1), 'metalLight'),
}));
const tiePolka = part('bb_tie_polka', 'character', 30, 70, 15, 3, cel(TIE_D, { base: 'pink', shade: 'blush', light: 'paper' }, {
  stroke: IN + 1, shade: [5, 0], rim: 2.5,
  inner: [[15, 32], [11, 44], [19, 46], [15, 57], [15, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${c('paper')}"/>`).join(''),
}));
/** Cravate tendue vers le haut (coincée au bord de la trappe). Pivot : col (en bas). */
const tieStretched = part('bb_tie_stretched', 'character', 22, 196, 11, 192, cel('M7 0H15L14 190L11 194L8 190Z', { base: 'tie', shade: 'tieShade' }, { stroke: IN, shade: [3, 0] }));
/** Cravate coupée net. */
const tieSnapped = part('bb_tie_snapped', 'character', 30, 34, 15, 3, cel('M8 2L22 2L20 12L23 26L19 23L16 30L12 24L7 28Z', { base: 'tie', shade: 'tieShade', light: 'tieLight' }, {
  stroke: IN + 1, shade: [4, 0], rim: 2,
}));

// ------------------------------------------------------------------ tête

const HEAD_D = 'M60 8C88 8 102 26 104 48C110 60 114 76 110 90C104 108 84 116 60 116C36 116 16 108 10 90C6 76 10 60 16 48C18 26 32 8 60 8Z';

function ear(x: number, flip: boolean): string {
  const d = flip ? 'M104 60C114 54 122 62 120 72C118 82 110 86 104 82Z' : 'M16 60C6 54 -2 62 0 72C2 82 10 86 16 82Z';
  return cel(d, { base: 'skin', shade: 'skinShade' }, { stroke: OUT, shade: flip ? [4, 3] : [-3, 3] })
    + line(flip ? 'M108 66C114 66 116 72 112 78' : 'M12 66C6 66 4 72 8 78', 'skinShade', IN);
}

const head = part('bb_head', 'character', 128, 124, 64, 112, `<g transform="translate(4 2)">${[
  ear(0, false),
  ear(0, true),
  cel(HEAD_D, { base: 'skin', shade: 'skinShade', light: 'skinLight' }, {
    stroke: OUT, shade: [10, 8], rim: 3,
    inner: [
      // Reflet du crâne (calvitie brillante).
      `<ellipse cx="44" cy="22" rx="12" ry="6" fill="${c('skinLight')}" transform="rotate(-18 44 22)"/>`,
      `<ellipse cx="60" cy="16" rx="4" ry="2.4" fill="${c('paper')}" opacity="0.8"/>`,
      // Bajoues et double menton.
      line('M34 106C46 112 74 112 86 106', 'skinShade', IN),
      line('M18 86C20 94 24 98 30 100', 'skinShade', IN),
      // Couronne de cheveux sur les tempes.
      cel('M10 64C8 50 12 40 18 36C18 46 20 54 24 60C18 62 14 64 10 64Z', { base: 'hair', light: 'hairLight' }, { stroke: IN, rim: 2 }),
      cel('M110 64C112 50 108 40 102 36C102 46 100 54 96 60C102 62 106 64 110 64Z', { base: 'hair', light: 'hairLight' }, { stroke: IN, rim: 2 }),
      // Joues roses (permanentes, discrètes).
      `<ellipse cx="28" cy="84" rx="11" ry="7" fill="${c('blush')}" opacity="0.45"/>`,
      `<ellipse cx="92" cy="84" rx="11" ry="7" fill="${c('blush')}" opacity="0.45"/>`,
    ].join(''),
  }),
  // Gros nez rond.
  cel(ellipsePath(60, 74, 13, 11), { base: 'nose', shade: 'skinShade', light: 'skinLight' }, { stroke: IN + 0.5, shade: [4, 4], rim: 2 }),
  `<ellipse cx="55" cy="70" rx="3.6" ry="2.4" fill="${c('paper')}" opacity="0.85"/>`,
].join('')}</g>`);

/** Rougeur de colère (moitié basse du visage), alpha piloté par le rig. */
const flushClip = nid('k');
const flush = part('bb_flush', 'character', 128, 124, 64, 112, `<g transform="translate(4 2)"><clipPath id="${flushClip}"><path d="${HEAD_D}"/></clipPath>`
  + `<g clip-path="url(#${flushClip})"><path d="M0 56C30 46 90 46 120 56L120 120L0 120Z" fill="${c('red')}" opacity="0.6"/>`
  + `<path d="M0 30C30 22 90 22 120 30L120 56C90 46 30 46 0 56Z" fill="${c('red')}" opacity="0.3"/></g></g>`);

/** Suie (explosion) : taches sombres, reflets clairs. */
const sootClip = nid('k');
const soot = part('bb_soot', 'character', 128, 124, 64, 112, `<g transform="translate(4 2)"><clipPath id="${sootClip}"><path d="${HEAD_D}"/></clipPath><g clip-path="url(#${sootClip})">`
  + `<path d="M0 40C20 30 40 44 60 34C80 24 100 40 120 30L120 120L0 120Z" fill="${c('ink')}" opacity="0.72"/>`
  + `<path d="M4 20C24 12 36 26 52 18C66 12 90 22 116 14L116 40C92 50 70 34 56 44C40 54 20 38 4 48Z" fill="${c('ink')}" opacity="0.45"/>`
  + `<ellipse cx="36" cy="50" rx="14" ry="8" fill="${c('smoke')}" opacity="0.5"/></g></g>`);

/** Goutte de sueur (fausse confiance, panique). */
const sweat = part('bb_sweat', 'character', 22, 30, 11, 4, cel('M11 2C15 10 20 16 20 21C20 26 16 29 11 29C6 29 2 26 2 21C2 16 7 10 11 2Z', { base: 'glass', shade: 'sky' }, {
  stroke: IN, shade: [3, 3],
  over: `<ellipse cx="8" cy="20" rx="2" ry="3.5" fill="${c('paper')}"/>`,
}));

/** Veine de colère (sur le crâne). */
const vein = part('bb_vein', 'character', 28, 28, 14, 14, line('M4 10C8 12 10 8 10 4M24 10C20 12 18 8 18 4M4 18C8 16 10 20 10 24M24 18C20 16 18 20 18 24', 'red', 4));

// ------------------------------------------------------------------ touffe (flamme qui penche vers l'avant)

const TUFT_D = 'M10 52C4 40 8 26 18 20C16 30 20 34 24 34C22 22 28 8 42 2C38 14 40 22 46 26C48 18 54 14 60 14C54 24 58 36 54 44C52 50 48 54 42 54Z';
const tuft = part('bb_tuft', 'character', 64, 58, 28, 52, cel(TUFT_D, { base: 'hair', shade: 'ink', light: 'hairLight' }, {
  stroke: IN + 1, shade: [5, 4], rim: 3,
  over: line('M26 44C30 36 34 30 40 24', 'hairLight', 2),
}));
const tuftCut = part('bb_tuft_cut', 'character', 64, 58, 28, 52, cel('M14 54L16 46L20 50L24 44L28 50L32 44L36 50L40 45L44 54Z', { base: 'hair', light: 'hairLight' }, { stroke: IN, rim: 2 }));

// ------------------------------------------------------------------ yeux, sourcils, bouches (textures interchangeables)

const SCLERA_D = ellipsePath(16, 18, 13, 15);
const sclera = part('bb_eye', 'character', 32, 36, 16, 18, cel(SCLERA_D, { base: 'paper', shade: 'paperShade' }, { stroke: IN, shade: [0, 4] }));
const scleraWide = part('bb_eye_wide', 'character', 40, 44, 20, 22, cel(ellipsePath(20, 22, 17, 19), { base: 'paper', shade: 'paperShade' }, { stroke: IN + 0.5, shade: [0, 4] }));
const pupil = part('bb_pupil', 'character', 16, 18, 8, 9, `<ellipse cx="8" cy="9" rx="5.5" ry="6.5" fill="${c('ink')}"/><circle cx="6" cy="6" r="1.8" fill="${c('paper')}"/>`);
const pupilSmall = part('bb_pupil_small', 'character', 10, 10, 5, 5, `<circle cx="5" cy="5" r="3" fill="${c('ink')}"/>`);
/** Paupière (peau + bord encre) : couvre le haut de l'œil. `k` = proportion couverte. */
function lid(id: string, k: number): ArtPart {
  const edge = -18 + 36 * k;
  const d = `M-2 -22H34V${edge - 2}C24 ${edge + 3} 8 ${edge + 3} -2 ${edge - 2}Z`;
  return part(id, 'character', 36, 40, 17, 20, `<g transform="translate(1 20)">${fill(d, 'skin')}${line(`M0 ${edge - 1.5}C8 ${edge + 3} 24 ${edge + 3} 32 ${edge - 1.5}`, 'ink', IN + 0.5)}</g>`);
}
const lidHalf = lid('bb_lid_half', 0.5);
const lidHeavy = lid('bb_lid_heavy', 0.68);
/** Yeux fermés : détendu (‿), heureux (∩), serré (>). */
const eyeClosed = part('bb_eye_closed', 'character', 32, 20, 16, 10, line('M4 7C10 14 22 14 28 7', 'ink', 3.5));
const eyeHappy = part('bb_eye_happy', 'character', 32, 20, 16, 10, line('M4 14C10 5 22 5 28 14', 'ink', 3.5));
const eyeTight = part('bb_eye_tight', 'character', 32, 24, 16, 12, line('M5 4L25 12L5 20', 'ink', 3.5));
const eyeX = part('bb_eye_x', 'character', 30, 30, 15, 15, line('M6 6L24 24M24 6L6 24', 'ink', 3.5));
const eyeSpiral = part('bb_eye_spiral', 'character', 32, 36, 16, 18, cel(SCLERA_D, { base: 'paper' }, { stroke: IN + 0.5 })
  + line('M16 18C16 15 20 15 20 18C20 22 13 23 12 18C11 12 20 10 23 16C26 23 18 29 11 25', 'ink', 2));
const brow = part('bb_brow', 'character', 40, 18, 20, 9, cel('M3 12C6 5 16 2 26 3C32 4 37 7 37 10C33 9 28 9 24 10C16 11 9 13 3 12Z', { base: 'hair', light: 'hairLight' }, { stroke: IN, rim: 2 }));

function mouthPart(id: string, w: number, h: number, body: string): ArtPart {
  return part(id, 'character', w, h, w / 2, h / 2, body);
}
const MOUTHS: ArtPart[] = [
  mouthPart('bb_mouth_flat', 40, 16, line('M6 9C14 7 26 7 34 8', 'ink', 3.5)),
  mouthPart('bb_mouth_smirk', 44, 22, line('M6 12C14 14 26 13 36 6', 'ink', 3.5) + line('M34 3C38 5 39 8 38 10', 'ink', IN)),
  mouthPart('bb_mouth_smile', 44, 22, line('M5 6C12 16 32 16 39 6', 'ink', 3.5) + line('M3 4L7 8M41 4L37 8', 'ink', IN)),
  mouthPart('bb_mouth_frown', 40, 20, line('M6 15C14 5 26 5 34 15', 'ink', 3.5)),
  mouthPart('bb_mouth_wavy', 44, 18, line('M4 10C9 4 13 4 17 10C21 16 25 16 29 10C33 4 37 4 40 10', 'ink', 3.5)),
  mouthPart('bb_mouth_o', 26, 30, cel(ellipsePath(13, 15, 8, 11), { base: 'mouth' }, { stroke: IN + 0.5, inner: `<ellipse cx="13" cy="24" rx="7" ry="5" fill="${c('tongue')}"/>` })),
  mouthPart('bb_mouth_whistle', 20, 20, cel(ellipsePath(10, 10, 5, 5.5), { base: 'mouth' }, { stroke: IN + 1.5 })),
  mouthPart('bb_mouth_gasp', 44, 50, cel('M22 3C34 3 40 14 40 26C40 40 32 47 22 47C12 47 4 40 4 26C4 14 10 3 22 3Z', { base: 'mouth' }, {
    stroke: OUT - 0.5,
    inner: `<ellipse cx="22" cy="44" rx="15" ry="10" fill="${c('tongue')}"/>` + fill(rectPath(6, 0, 32, 8, 3), 'paper'),
  })),
  mouthPart('bb_mouth_grin', 56, 30, cel('M4 5C18 9 38 9 52 5C50 20 40 27 28 27C16 27 6 20 4 5Z', { base: 'mouth' }, {
    stroke: IN + 1,
    inner: fill('M2 2H54V12C38 15 18 15 2 12Z', 'paper') + line('M15 4V13M28 4V14M41 4V13', 'paperShade', 1.5) + `<ellipse cx="28" cy="28" rx="12" ry="6" fill="${c('tongue')}"/>`,
  })),
  mouthPart('bb_mouth_laugh', 60, 42, cel('M4 6C20 10 40 10 56 6C56 26 44 38 30 38C16 38 4 26 4 6Z', { base: 'mouth' }, {
    stroke: IN + 1.5,
    inner: fill('M2 2H58V13C40 16 20 16 2 13Z', 'paper') + `<ellipse cx="30" cy="38" rx="16" ry="9" fill="${c('tongue')}"/>`,
  })),
  mouthPart('bb_mouth_teeth', 52, 26, cel(rectPath(4, 4, 44, 18, 8), { base: 'paper', shade: 'paperShade' }, {
    stroke: IN + 1, shade: [0, 3],
    over: line('M6 13H46M15 5V21M26 4V22M37 5V21', 'ink', 1.5),
  })),
];

// ------------------------------------------------------------------ fauteuil de direction et fusée

const CHAIR_BACK = 'M22 10C22 4 28 2 36 2L94 2C102 2 108 4 108 10L112 118C112 126 106 130 98 130L32 130C24 130 18 126 18 118Z';
function chairBody(): string {
  return [
    // Dossier capitonné.
    cel(CHAIR_BACK, { base: 'leather', shade: 'leatherShade', light: 'leatherLight' }, {
      stroke: 3.5, shade: [10, 6], rim: 3,
      inner: [[45, 36], [85, 36], [65, 60], [45, 84], [85, 84], [65, 108]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${c('leatherShade')}"/><circle cx="${(x ?? 0) - 1}" cy="${(y ?? 0) - 1}" r="1.2" fill="${c('leatherLight')}"/>`).join('')
        + line('M45 36L65 60L85 36M45 84L65 60L85 84M45 84L65 108L85 84', 'leatherShade', 1.5),
    }),
    // Assise.
    cel(rectPath(8, 136, 114, 20, 9), { base: 'leather', shade: 'leatherShade', light: 'leatherLight' }, { stroke: 3.5, shade: [4, 6], rim: 2 }),
    // Vérin et piétement étoile à roulettes.
    cel(rectPath(59, 155, 12, 26, 2), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 2, shade: [4, 0], rim: 1.5 }),
    cel('M65 178L16 188L14 194L65 186L116 194L114 188Z', { base: 'metalShade', shade: 'metalDark' }, { stroke: 2, shade: [0, 3] }),
    ...[18, 65, 112].map((x) => cel(ellipsePath(x, 196, 7, 6), { base: 'ink', light: 'inkSoft' }, { rim: 2 })),
  ].join('');
}
const chair = part('bb_chair', 'prop', 130, 204, 65, 202, chairBody());

function rocketBody(retro: boolean): string {
  const base = retro ? 'red' : 'metal';
  const shade = retro ? 'redShade' : 'metalShade';
  const fin = retro ? 'paper' : 'red';
  return [
    cel('M8 30L28 14L28 46Z', { base: fin, shade: retro ? 'paperShade' : 'redShade' }, { stroke: 3.5, shade: [0, 4] }),
    cel(rectPath(20, 16, 150, 30, 14), { base, shade, light: retro ? 'redLight' : 'metalLight' }, {
      stroke: 3.5, shade: [0, 7], rim: 2.5,
      inner: retro ? [50, 90, 130].map((x) => fill(rectPath(x, 10, 10, 40), 'paper')).join('') : fill(rectPath(60, 22, 44, 18, 4), 'tie'),
    }),
    cel('M168 18C184 22 192 28 194 31C192 34 184 40 168 44Z', { base: fin, shade: retro ? 'paperShade' : 'redShade' }, { stroke: 3.5, shade: [0, 4] }),
    cel(ellipsePath(22, 31, 8, 12), { base: 'metalDark' }, { stroke: 3.5 }),
  ].join('');
}
const rocket = part('bb_rocket', 'prop', 200, 60, 105, 46, rocketBody(false));
const rocketRetro = part('bb_rocket_retro', 'prop', 200, 60, 105, 46, rocketBody(true));

export const BOSS_PARTS: readonly ArtPart[] = [
  torso, legL, legR, upperArm, foreArm, handOpen, handFist, handGrip, mug, mugGold, mugOkayest, steam,
  tie, tiePolka, tieStretched, tieSnapped, head, flush, soot, sweat, vein, tuft, tuftCut,
  sclera, scleraWide, pupil, pupilSmall, lidHalf, lidHeavy, eyeClosed, eyeHappy, eyeTight, eyeX, eyeSpiral, brow,
  ...MOUTHS, chair, rocket, rocketRetro,
];

