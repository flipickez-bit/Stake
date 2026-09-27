/**
 * Le bureau de B.B. — pièces du décor et des accessoires (ART BIBLE §6).
 * Lumière unique : la fenêtre, en haut à gauche. Traits : accessoires 3,5 / 2 ; milieu 2,5 ; fond 2 (encre douce).
 */
import { c, cel, ellipsePath, fill, line, nid, part, rectPath, softShadow, vGradient, type ArtPart } from '../svg';

// ------------------------------------------------------------------ FENÊTRE (fond)

/** Ciel + skyline, plus large que l'ouverture : la vue glisse en parallaxe (cadre de texture déplacé). */
const SKY_W = 260;
const SKY_H = 240;
function skyBody(): string {
  const g = vGradient([[0, 'sky'], [1, 'skyLight']]);
  const far = [[0, 120], [20, 96], [44, 132], [60, 80], [84, 110], [110, 70], [130, 118], [156, 92], [182, 126], [204, 84], [230, 110], [260, 96]];
  const farD = `M0 ${SKY_H}` + far.map(([x, h]) => `L${x} ${SKY_H - (h ?? 0)}L${(x ?? 0) + 18} ${SKY_H - (h ?? 0)}`).join('') + `L${SKY_W} ${SKY_H}Z`;
  const towers: [number, number, number][] = [[8, 34, 150], [48, 28, 186], [80, 40, 120], [128, 30, 200], [164, 44, 140], [214, 36, 170]];
  const near = towers.map(([x, w, h]) => {
    const y = SKY_H - h;
    const windows: string[] = [];
    for (let wy = y + 12; wy < SKY_H - 8; wy += 14) for (let wx = x + 6; wx < x + w - 6; wx += 10) windows.push(`<rect x="${wx}" y="${wy}" width="5" height="7" fill="${c('skylineWin')}" opacity="0.55"/>`);
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c('skyline')}"/>${windows.join('')}<rect x="${x + w - 7}" y="${y}" width="7" height="${h}" fill="${c('screenLight')}" opacity="0.25"/>`;
  }).join('');
  const cloud = (x: number, y: number, s: number) => `<path d="M${x} ${y}c${4 * s} ${-10 * s} ${16 * s} ${-10 * s} ${20 * s} ${-2 * s}c${6 * s} ${-8 * s} ${18 * s} ${-4 * s} ${18 * s} ${6 * s}c${6 * s} 0 ${8 * s} ${8 * s} ${2 * s} ${8 * s}h${-40 * s}c${-6 * s} 0 ${-6 * s} ${-12 * s} 0 ${-12 * s}z" fill="${c('paper')}" opacity="0.9"/>`;
  return `<defs>${g.def}</defs><rect width="${SKY_W}" height="${SKY_H}" fill="url(#${g.id})"/>`
    + `<circle cx="196" cy="46" r="18" fill="${c('tieLight')}"/><circle cx="196" cy="46" r="28" fill="${c('tieLight')}" opacity="0.25"/>`
    + cloud(30, 50, 1.1) + cloud(150, 86, 0.8)
    + `<path d="${farD}" fill="${c('skylineFar')}"/>` + near;
}
const sky = part('win_sky', 'far', SKY_W, SKY_H, SKY_W / 2, SKY_H / 2, skyBody());

/** Cadre de fenêtre (224 × 256), ouverture 180 × 214. Pivot : centre. */
const WIN = { w: 224, h: 262, ox: 22, oy: 22, ow: 180, oh: 214 };
function windowFrame(): string {
  const { w, ox, oy, ow, oh } = WIN;
  const frameD = `M4 8H${w - 4}V${oy + oh + 10}H4Z M${ox} ${oy}V${oy + oh}H${ox + ow}V${oy}Z`;
  return [
    softShadow(w / 2 + 6, oy + oh + 22, w / 2, 7, 0.18, 5),
    `<path d="${frameD}" fill-rule="evenodd" fill="${c('woodLight')}" stroke="${c('inkSoft')}" stroke-width="2"/>`,
    // Ombre intérieure du cadre (en bas à droite de l'ouverture : la lumière vient de dehors, en haut à gauche).
    fill(`M${ox + ow - 8} ${oy}H${ox + ow}V${oy + oh}H${ox}V${oy + oh - 6}H${ox + ow - 8}Z`, 'wood'),
    // Montants.
    cel(rectPath(ox + ow / 2 - 5, oy, 10, oh), { base: 'woodLight', shade: 'wood' }, { stroke: 2, ink: 'inkSoft', shade: [4, 0] }),
    cel(rectPath(ox, oy + oh * 0.52 - 5, ow, 10), { base: 'woodLight', shade: 'wood' }, { stroke: 2, ink: 'inkSoft', shade: [0, 4] }),
    // Rebord.
    cel(rectPath(0, oy + oh + 4, w, 16, 3), { base: 'woodLight', shade: 'wood', light: 'wallLight' }, { stroke: 2, ink: 'inkSoft', shade: [0, 6], rim: 2 }),
    // Store vénitien relevé (lamelles).
    cel(rectPath(ox - 6, oy - 4, ow + 12, 40, 3), { base: 'paperShade', shade: 'wallShade', light: 'paper' }, {
      stroke: 2, ink: 'inkSoft', shade: [0, 6], rim: 2,
      inner: [8, 16, 24, 32].map((y) => line(`M${ox - 6} ${oy - 4 + y}H${ox + ow + 6}`, 'wallShade', 1.5)).join(''),
    }),
    line(`M${ox + 20} ${oy + 36}V${oy + 90}M${ox + ow - 30} ${oy + 36}V${oy + 70}`, 'inkSoft', 1.5),
    `<circle cx="${ox + 20}" cy="${oy + 92}" r="3" fill="${c('wallShade')}" stroke="${c('inkSoft')}" stroke-width="1.5"/>`,
  ].join('');
}
const windowFrameP = part('win_frame', 'background', WIN.w, WIN.h, WIN.w / 2, WIN.h / 2 - 10, windowFrame());
/** Reflets de la vitre intacte. */
const windowGlass = part('win_glass', 'background', WIN.w, WIN.h, WIN.w / 2, WIN.h / 2 - 10,
  [[WIN.ox + 14, WIN.oy + 40, 40], [WIN.ox + 34, WIN.oy + 40, 18], [WIN.ox + 104, WIN.oy + 130, 36]]
    .map(([x, y, l]) => `<path data-tube="1" d="M${x} ${(y ?? 0) + (l ?? 0)}L${(x ?? 0) + (l ?? 0) * 0.6} ${y}" stroke="${c('paper')}" stroke-width="7" stroke-linecap="round" opacity="0.45"/>`).join(''));
/** Vitre brisée : éclats restés dans le cadre, trou étoilé. */
const windowShards = part('win_shards', 'background', WIN.w, WIN.h, WIN.w / 2, WIN.h / 2 - 10, (() => {
  const { ox, oy, ow, oh } = WIN;
  const shard = (d: string) => `<path d="${d}" fill="${c('glass')}" opacity="0.8" stroke="${c('paper')}" stroke-width="1.5"/>`;
  return [
    shard(`M${ox} ${oy}L${ox + 50} ${oy}L${ox + 18} ${oy + 44}Z`),
    shard(`M${ox + ow} ${oy}L${ox + ow - 40} ${oy}L${ox + ow} ${oy + 60}Z`),
    shard(`M${ox} ${oy + oh}L${ox} ${oy + oh - 56}L${ox + 34} ${oy + oh}Z`),
    shard(`M${ox + ow} ${oy + oh}L${ox + ow - 60} ${oy + oh}L${ox + ow} ${oy + oh - 30}Z`),
    shard(`M${ox + ow / 2 - 5} ${oy + oh * 0.52 + 5}L${ox + ow / 2 - 40} ${oy + oh * 0.52 + 5}L${ox + ow / 2 - 5} ${oy + oh * 0.52 + 40}Z`),
    line(`M${ox + 18} ${oy + 44}L${ox + 44} ${oy + 70}M${ox + ow} ${oy + 60}L${ox + ow - 20} ${oy + 90}`, 'paper', 1.5),
  ].join('');
})());

// ------------------------------------------------------------------ MUR : cadres, horloge, tableau

/** Portrait de B.B. « employé du mois » (sans texte). Pivot : le clou (le cadre se balance autour). */
const portrait = part('portrait', 'background', 110, 150, 55, 8, [
  line('M55 8L22 30M55 8L88 30', 'inkSoft', 2),
  `<circle cx="55" cy="8" r="3.5" fill="${c('metalShade')}" stroke="${c('inkSoft')}" stroke-width="1.5"/>`,
  softShadow(60, 88, 44, 58, 0.16, 5),
  cel(rectPath(8, 26, 94, 116, 6), { base: 'tie', shade: 'tieShade', light: 'tieLight' }, { stroke: 2, ink: 'inkSoft', shade: [5, 5], rim: 2.5 }),
  fill(rectPath(18, 36, 74, 84, 3), 'wallLight'),
  `<ellipse cx="55" cy="84" rx="40" ry="34" fill="${c('skyLight')}"/>`,
  // Buste de B.B. (héroïque).
  cel('M26 120C26 98 38 90 55 90C72 90 84 98 84 120Z', { base: 'suit', shade: 'suitShade' }, { stroke: 1.5, ink: 'inkSoft', shade: [4, 3] }),
  fill('M50 90L60 90L55 112Z', 'tie'),
  cel(ellipsePath(55, 74, 16, 17), { base: 'skin', shade: 'skinShade' }, { stroke: 1.5, ink: 'inkSoft', shade: [3, 3] }),
  fill('M48 58C50 48 56 44 62 42C60 50 62 54 66 56C62 60 54 60 48 58Z', 'hair'),
  line('M47 78C51 82 59 82 63 78', 'inkSoft', 1.5),
  // Plaque (sans texte).
  cel(rectPath(34, 124, 42, 11, 2), { base: 'paperShade', shade: 'wallShade' }, { stroke: 1.5, ink: 'inkSoft', shade: [0, 2] }),
].join(''));

const cork = part('cork', 'background', 128, 96, 64, 48, [
  softShadow(68, 52, 60, 44, 0.14, 4),
  cel(rectPath(4, 4, 120, 88, 4), { base: 'wood', shade: 'woodShade' }, { stroke: 2, ink: 'inkSoft', shade: [3, 3] }),
  fill(rectPath(12, 12, 104, 72, 2), 'cork'),
  ...[[18, 18, 28, 22, 'paper', -4], [52, 16, 24, 30, 'postit', 5], [82, 20, 26, 24, 'pink', -3], [22, 50, 30, 26, 'wShirtLight', 3]].map(([x, y, w, h, col, r]) =>
    `<g transform="rotate(${r} ${(x as number) + (w as number) / 2} ${(y as number) + (h as number) / 2})">${cel(rectPath(x as number, y as number, w as number, h as number, 1), { base: col as 'paper', shade: 'paperShade' }, { stroke: 1.5, ink: 'inkSoft', shade: [0, 2] })}${line(`M${(x as number) + 5} ${(y as number) + 9}H${(x as number) + (w as number) - 5}M${(x as number) + 5} ${(y as number) + 15}H${(x as number) + (w as number) - 9}`, 'inkSoft', 1.5, 0.6)}</g>`),
  // Graphique des ventes… en chute.
  cel(rectPath(62, 52, 46, 28, 1), { base: 'paper', shade: 'paperShade' }, { stroke: 1.5, ink: 'inkSoft', shade: [0, 2] }),
  line('M66 58L76 62L84 60L92 70L104 76', 'red', 2.5),
  ...[[24, 18], [64, 16], [95, 20], [37, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${c('red')}" stroke="${c('inkSoft')}" stroke-width="1.5"/>`),
].join(''));

const clock = part('clock', 'background', 64, 64, 32, 32, [
  softShadow(35, 35, 26, 26, 0.16, 3),
  cel(ellipsePath(32, 32, 27, 27), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 2, ink: 'inkSoft', shade: [3, 3], rim: 2 }),
  `<circle cx="32" cy="32" r="21" fill="${c('paper')}"/>`,
  ...Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return `<circle cx="${32 + Math.cos(a) * 17}" cy="${32 + Math.sin(a) * 17}" r="${i % 3 === 0 ? 2 : 1.2}" fill="${c('inkSoft')}"/>`;
  }),
].join(''));
const clockHand = part('clock_hand', 'background', 8, 20, 4, 17, line('M4 17V3', 'ink', 2.5));
const clockHandLong = part('clock_hand_long', 'background', 8, 24, 4, 21, line('M4 21V2', 'inkSoft', 2));

/** Diplôme / graphique encadré (sans texte). */
const certificate = part('certificate', 'background', 84, 66, 42, 33, [
  softShadow(45, 36, 38, 28, 0.14, 3),
  cel(rectPath(4, 4, 76, 58, 3), { base: 'woodDark', shade: 'ink' }, { stroke: 2, ink: 'inkSoft', shade: [3, 3] }),
  fill(rectPath(11, 11, 62, 44, 1), 'paper'),
  line('M18 44L30 36L40 40L52 26L64 20', 'plantShade', 2.5),
  line('M18 48H66', 'paperShade', 1.5),
  cel(ellipsePath(60, 46, 6, 6), { base: 'red', shade: 'redShade' }, { stroke: 1.5, ink: 'inkSoft', shade: [2, 2] }),
].join(''));

// ------------------------------------------------------------------ MILIEU : classeur, plante, ascenseur, extincteur

const cabinet = part('cabinet', 'mid', 104, 196, 52, 190, '<g transform="translate(0 6)">' + [
  softShadow(58, 184, 52, 7, 0.3, 4),
  cel(rectPath(6, 6, 92, 178, 5), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 2.5, shade: [10, 0], rim: 2.5 }),
  ...[0, 1, 2].map((i) => {
    const y = 16 + i * 56;
    return cel(rectPath(14, y, 76, 48, 3), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 1.5, shade: [0, 4], rim: 1.5 })
      + cel(rectPath(40, y + 10, 24, 9, 4), { base: 'metalDark', light: 'metalShade' }, { stroke: 1.5, rim: 1.5 })
      + fill(rectPath(42, y + 26, 20, 11, 1), 'paper') + `<rect x="42" y="${y + 26}" width="20" height="11" fill="none" stroke="${c('metalDark')}" stroke-width="1.5"/>`;
  }),
  // Dossiers posés dessus.
  cel(rectPath(18, -2, 50, 10, 2), { base: 'postit', shade: 'postitShade' }, { stroke: 1.5, shade: [0, 3] }),
].join('') + '</g>');
const cabinetDent = part('cabinet_dent', 'mid', 104, 196, 52, 190, '<g transform="translate(0 6)">' + [
  fill('M84 50C92 62 90 80 96 96C88 90 80 72 84 50Z', 'metalDark'),
  line('M78 44C88 60 86 82 96 100', 'ink', 2.5),
  fill(rectPath(14, 72, 76, 6, 2), 'metalDark'),
].join('') + '</g>');

const PLANT_LEAF = 'M0 0C-10 -16 -8 -40 6 -56C14 -40 16 -18 0 0Z';
function plantBody(): string {
  const leaves: [number, number, number, number][] = [
    [46, 108, -40, 1.1], [52, 104, -12, 1.25], [58, 106, 18, 1.15], [44, 96, -62, 0.95], [62, 96, 44, 1.0], [50, 84, -26, 0.9], [58, 80, 8, 1.05], [40, 116, -78, 0.8], [66, 112, 70, 0.85],
  ];
  return [
    softShadow(52, 186, 30, 6, 0.3, 4),
    ...leaves.map(([x, y, r, s]) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${cel(PLANT_LEAF, { base: 'plant', shade: 'plantShade', light: 'plantLight' }, { stroke: 2.5, shade: [4, 0], rim: 2 })}${line('M0 -2C2 -18 3 -32 5 -48', 'plantShade', 1.5)}</g>`),
    line('M52 128C50 116 48 110 46 104M52 128C54 116 58 110 60 102', 'plantShade', 2.5),
    cel('M26 128H78L72 184C72 187 69 189 66 189H38C35 189 32 187 32 184Z', { base: 'pot', shade: 'potShade', light: 'tieLight' }, { stroke: 2.5, shade: [8, 0], rim: 2 }),
    cel(rectPath(22, 122, 60, 14, 4), { base: 'pot', shade: 'potShade' }, { stroke: 2.5, shade: [0, 4] }),
  ].join('');
}
const plant = part('plant', 'mid', 104, 192, 52, 188, plantBody());

/** Ascenseur : cadre + cabine sombre (les portes sont des acteurs séparés, au premier plan). Pivot : sol, centre. */
const elevator = part('elevator', 'mid', 184, 320, 92, 316, [
  cel(rectPath(8, 22, 168, 294, 4), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 2.5, shade: [8, 0], rim: 2 }),
  fill(rectPath(20, 34, 144, 282), 'screen'),
  fill(rectPath(20, 34, 144, 20), 'night'),
  `<path d="M20 316L164 316L150 270L34 270Z" fill="${c('screenLight')}" opacity="0.35"/>`,
  // Afficheur d'étage (flèche = acteur « lamp »).
  cel(rectPath(66, 2, 52, 18, 4), { base: 'night', light: 'screenLight' }, { stroke: 2.5, rim: 1.5 }),
  // Bouton d'appel.
  cel(rectPath(166, 150, 16, 34, 3), { base: 'metal', shade: 'metalShade' }, { stroke: 1.5, shade: [2, 0] }),
  `<circle cx="174" cy="162" r="4" fill="${c('paper')}" stroke="${c('inkSoft')}" stroke-width="1.5"/><circle cx="174" cy="174" r="4" fill="${c('paper')}" stroke="${c('inkSoft')}" stroke-width="1.5"/>`,
].join(''));
const elevatorLamp = part('elevator_lamp', 'mid', 20, 14, 10, 7, fill('M3 11L10 3L17 11Z', 'paper'));
const elevatorDent = part('elevator_dent', 'mid', 184, 320, 92, 316, [
  fill('M8 120C24 130 22 160 8 176Z', 'metalDark'),
  line('M10 118C26 132 24 160 10 178', 'ink', 2.5),
  fill(ellipsePath(140, 60, 14, 8), 'metalDark'),
].join(''));
/** Porte d'ascenseur (gauche) : pivot sur le bord extérieur. Largeur 72, hauteur 282. */
function doorBody(left: boolean): string {
  const x = 0;
  return [
    cel(rectPath(x, 0, 72, 282, 2), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 2.5, shade: [left ? 6 : 0, 0], rim: 2 }),
    line(left ? 'M64 12V270' : 'M8 12V270', 'metalShade', 2),
    fill(rectPath(left ? 50 : 14, 120, 8, 44, 3), 'metalShade'),
  ].join('');
}
const doorL = part('elevator_door_l', 'mid', 72, 282, 17, 282, doorBody(true));
const doorR = part('elevator_door_r', 'mid', 72, 282, 55, 282, doorBody(false));

const extinguisher = part('extinguisher', 'mid', 44, 92, 22, 88, [
  softShadow(24, 88, 16, 4, 0.2, 3),
  cel(rectPath(10, 22, 24, 66, 11), { base: 'red', shade: 'redShade', light: 'redLight' }, { stroke: 2.5, shade: [6, 0], rim: 2 }),
  fill(rectPath(10, 48, 24, 12), 'paper'),
  `<rect x="10" y="48" width="24" height="12" fill="none" stroke="${c('ink')}" stroke-width="1.5"/>`,
  cel(rectPath(15, 10, 14, 14, 3), { base: 'metalDark', light: 'metalShade' }, { stroke: 2.5, rim: 1.5 }),
  cel(rectPath(8, 4, 26, 7, 3), { base: 'metalDark' }, { stroke: 2 }),
].join(''));
const extNozzle = part('ext_nozzle', 'mid', 40, 40, 6, 8, line('M6 8C22 2 34 12 32 32', 'ink', 5).replace('<path ', '<path data-tube="1" ') + `<circle cx="32" cy="33" r="5" fill="${c('metalDark')}" stroke="${c('ink')}" stroke-width="2"/>`);

// ------------------------------------------------------------------ PLAN D'ACTION : bureau, écran, sonnette, lance-pierre

const DESK_W = 384;
const desk = part('desk', 'prop', DESK_W, 184, DESK_W / 2, 180, '<g transform="translate(0 44)">' + [
  softShadow(DESK_W / 2 + 8, 134, DESK_W / 2 - 4, 8, 0.35, 5),
  // Façade.
  cel(rectPath(14, 22, DESK_W - 28, 112, 4), { base: 'wood', shade: 'woodShade', light: 'woodLight' }, {
    stroke: 3.5, shade: [0, 12], rim: 2.5,
    inner: [
      cel(rectPath(34, 40, 120, 76, 4), { base: 'wood', shade: 'woodShade', light: 'woodLight' }, { stroke: 2, shade: [0, 5], rim: 2 }),
      cel(rectPath(DESK_W - 154, 40, 120, 76, 4), { base: 'wood', shade: 'woodShade', light: 'woodLight' }, { stroke: 2, shade: [0, 5], rim: 2 }),
      // Écusson (couronne, sans texte) au centre.
      cel(rectPath(DESK_W / 2 - 34, 58, 68, 30, 5), { base: 'tie', shade: 'tieShade', light: 'tieLight' }, { stroke: 2, shade: [0, 4], rim: 2 }),
      cel(`M${DESK_W / 2 - 14} 82L${DESK_W / 2 - 11} 66L${DESK_W / 2 - 5} 75L${DESK_W / 2} 63L${DESK_W / 2 + 5} 75L${DESK_W / 2 + 11} 66L${DESK_W / 2 + 14} 82Z`, { base: 'suit', shade: 'suitShade' }, { stroke: 1.5, shade: [2, 2] }),
      line(`M20 128H${DESK_W - 20}`, 'woodDark', 2),
    ].join(''),
  }),
  // Plateau.
  cel(rectPath(0, 2, DESK_W, 24, 6), { base: 'woodLight', shade: 'wood', light: 'wallLight' }, { stroke: 3.5, shade: [0, 7], rim: 2.5 }),
  // Pile de dossiers et porte-stylos sur le plateau (à gauche, loin de l'écran).
  cel(rectPath(26, -18, 58, 20, 2), { base: 'paper', shade: 'paperShade' }, { stroke: 2, shade: [0, 4], inner: line('M26 -12H84M26 -6H84', 'paperShade', 1.5) }),
  cel(rectPath(100, -26, 22, 28, 4), { base: 'suit', shade: 'suitShade', light: 'suitLight' }, { stroke: 2, shade: [5, 0], rim: 1.5 }),
  line('M106 -26L102 -40M112 -26L114 -42M117 -26L122 -36', 'ink', 2.5),
].join('') + '</g>');

/** Écran (sur le bureau). Pivot : pied. Normal : un graphique ; cassé : fissures. */
function monitorBody(broken: boolean): string {
  return [
    cel(rectPath(44, 86, 20, 16, 2), { base: 'metalDark', light: 'metalShade' }, { stroke: 2, rim: 1.5 }),
    cel(rectPath(24, 98, 60, 8, 4), { base: 'metalDark', light: 'metalShade' }, { stroke: 2, rim: 1.5 }),
    cel(rectPath(0, 4, 108, 84, 7), { base: 'metalDark', shade: 'ink', light: 'metalShade' }, { stroke: 3.5, shade: [6, 6], rim: 2 }),
    fill(rectPath(8, 12, 92, 66, 3), broken ? 'nightDeep' : 'screen'),
    broken
      ? line('M50 16L58 40L44 52L60 76M58 40L88 34M58 40L80 60M44 52L16 46', 'glass', 2) + `<circle cx="58" cy="40" r="5" fill="${c('glass')}" opacity="0.6"/>`
      : [
        fill(rectPath(8, 12, 92, 66, 3), 'screenLight', 0.35),
        line('M16 62L32 50L46 56L62 34L78 38L92 22', 'screenGlow', 3),
        line('M16 70H92', 'screenLight', 1.5),
        fill(rectPath(14, 18, 26, 6, 2), 'screenGlow', 0.7),
      ].join(''),
    `<path d="M12 16L40 16L12 44Z" fill="${c('paper')}" opacity="${broken ? 0.08 : 0.14}"/>`,
  ].join('');
}
const monitor = part('monitor', 'prop', 108, 108, 54, 106, monitorBody(false));
const monitorBroken = part('monitor_broken', 'prop', 108, 108, 54, 106, monitorBody(true));

const bell = part('bell', 'prop', 44, 34, 22, 32, [
  cel(ellipsePath(22, 28, 20, 5), { base: 'woodDark', light: 'wood' }, { stroke: 2, rim: 1.5 }),
  cel('M6 26C6 12 13 6 22 6C31 6 38 12 38 26Z', { base: 'metalLight', shade: 'metalShade', light: 'paper' }, { stroke: 2, shade: [5, 3], rim: 2 }),
  cel(rectPath(19, 0, 6, 7, 2), { base: 'metalDark' }, { stroke: 2 }),
].join(''));

/** Poteau du lance-pierre : Y en bois, ligatures de cuir. Les pointes sont à (±22, −122) du pied. */
const slingPost = part('sling_post', 'prop', 84, 140, 42, 136, [
  softShadow(44, 134, 30, 5, 0.32, 3),
  cel('M34 60L50 60L52 128L32 128Z', { base: 'wood', shade: 'woodShade', light: 'woodLight' }, { stroke: 3.5, shade: [6, 0], rim: 2 }),
  cel('M36 64C30 44 22 30 16 16L28 10C34 26 40 40 46 58Z', { base: 'wood', shade: 'woodShade', light: 'woodLight' }, { stroke: 3.5, shade: [5, 0], rim: 2 }),
  cel('M48 64C54 44 60 30 66 16L56 10C50 26 44 40 38 58Z', { base: 'wood', shade: 'woodShade', light: 'woodLight' }, { stroke: 3.5, shade: [5, 0], rim: 2 }),
  cel(rectPath(30, 58, 24, 12, 3), { base: 'leather', light: 'leatherLight' }, { stroke: 2, rim: 1.5 }),
  cel(rectPath(12, 12, 20, 9, 3), { base: 'leather', light: 'leatherLight' }, { stroke: 2, rim: 1.5, over: '' }),
  cel(rectPath(52, 12, 20, 9, 3), { base: 'leather', light: 'leatherLight' }, { stroke: 2, rim: 1.5 }),
  cel(rectPath(18, 126, 48, 10, 3), { base: 'metalDark', light: 'metalShade' }, { stroke: 2, rim: 1.5 }),
].join(''));
/** Poche de cuir de l'élastique (au dos du fauteuil). */
const slingPouch = part('sling_pouch', 'prop', 34, 30, 17, 15, cel('M4 6C12 2 22 2 30 6L28 24C20 28 14 28 6 24Z', { base: 'leather', shade: 'leatherShade', light: 'leatherLight' }, { stroke: 2.5, shade: [4, 3], rim: 1.5 }));

// ------------------------------------------------------------------ PLAFOND : ventilateur

const fanMotor = part('fan_motor', 'prop', 40, 50, 20, 4, [
  cel(rectPath(16, 0, 8, 34, 2), { base: 'metalShade', light: 'metal' }, { stroke: 2, rim: 1.5 }),
  cel('M6 34C6 26 12 22 20 22C28 22 34 26 34 34C34 42 28 46 20 46C12 46 6 42 6 34Z', { base: 'woodDark', shade: 'ink', light: 'wood' }, { stroke: 2, shade: [3, 3], rim: 2 }),
].join(''));
/** Pales vues de dessous, en perspective (ellipse aplatie). Le rig les fait tourner par scale.x. */
const fanBlades = part('fan_blades', 'prop', 176, 36, 88, 18, [
  cel('M88 12C60 6 20 6 4 14C4 20 20 24 88 22Z', { base: 'wood', shade: 'woodShade', light: 'woodLight' }, { stroke: 2, shade: [0, 3], rim: 1.5 }),
  cel('M88 12C116 6 156 6 172 14C172 20 156 24 88 22Z', { base: 'wood', shade: 'woodShade', light: 'woodLight' }, { stroke: 2, shade: [0, 3], rim: 1.5 }),
  cel(ellipsePath(88, 17, 12, 7), { base: 'woodDark', light: 'wood' }, { stroke: 2, rim: 1.5 }),
].join(''));
const fanDroop = part('fan_droop', 'prop', 150, 80, 75, 10, [
  cel('M75 10C60 20 30 44 8 70L16 76C40 54 64 30 78 18Z', { base: 'wood', shade: 'woodShade' }, { stroke: 2, shade: [4, 0] }),
  cel('M75 10C90 24 110 50 140 66L134 74C106 58 84 36 72 20Z', { base: 'wood', shade: 'woodShade' }, { stroke: 2, shade: [4, 0] }),
  cel(ellipsePath(75, 12, 12, 7), { base: 'woodDark', light: 'wood' }, { stroke: 2, rim: 1.5 }),
].join(''));

// ------------------------------------------------------------------ PREMIER PLAN : bureau du joueur

const keyboard = part('fg_keyboard', 'prop', 236, 50, 118, 46, [
  softShadow(122, 44, 112, 7, 0.35, 4),
  cel(rectPath(4, 4, 228, 40, 8), { base: 'metalDark', shade: 'ink', light: 'metalShade' }, { stroke: 3.5, shade: [0, 6], rim: 2 }),
  ...Array.from({ length: 3 }, (_, r) => Array.from({ length: 13 - r }, (_, k) => {
    const x = 14 + r * 8 + k * 16;
    return `<rect x="${x}" y="${10 + r * 10}" width="13" height="8" rx="2" fill="${c('metalShade')}"/><rect x="${x}" y="${10 + r * 10}" width="13" height="3" rx="1.5" fill="${c('metal')}"/>`;
  }).join('')),
].join(''));
const tealMug = part('fg_mug', 'prop', 64, 70, 28, 66, [
  softShadow(32, 64, 26, 5, 0.35, 3),
  `<path data-tube="1" d="M44 24C62 22 62 50 44 50" fill="none" stroke="${c('ink')}" stroke-width="12" stroke-linecap="round"/>`,
  `<path data-tube="1" d="M44 24C62 22 62 50 44 50" fill="none" stroke="${c('teal')}" stroke-width="5" stroke-linecap="round"/>`,
  cel('M6 12H50L47 58C47 62 43 64 39 64H17C13 64 9 62 9 58Z', { base: 'teal', shade: 'tealShade', light: 'skyLight' }, { stroke: 3.5, shade: [9, 0], rim: 2.5 }),
  `<ellipse cx="28" cy="12.5" rx="22" ry="5" fill="${c('coffee')}" stroke="${c('ink')}" stroke-width="2"/>`,
].join(''));
const postits = part('fg_postits', 'prop', 70, 56, 35, 52, [
  softShadow(36, 50, 30, 4, 0.3, 3),
  `<g transform="rotate(-6 35 30)">${cel(rectPath(8, 10, 54, 40, 2), { base: 'postit', shade: 'postitShade' }, { stroke: 2, shade: [0, 5], inner: line('M16 22H52M16 30H46M16 38H40', 'postitShade', 2) })}</g>`,
  `<g transform="rotate(8 40 20)">${cel(rectPath(26, 4, 34, 24, 2), { base: 'pink', shade: 'blush' }, { stroke: 2, shade: [0, 4] })}</g>`,
].join(''));
const cactus = part('fg_cactus', 'prop', 64, 104, 32, 100, [
  softShadow(34, 98, 22, 4, 0.35, 3),
  cel('M24 70V26C24 14 40 14 40 26V70Z', { base: 'plant', shade: 'plantShade', light: 'plantLight' }, { stroke: 3.5, shade: [6, 0], rim: 2 }),
  cel('M24 48H14C8 48 8 40 8 34V30C8 24 16 24 16 30V40H24Z', { base: 'plant', shade: 'plantShade', light: 'plantLight' }, { stroke: 3.5, shade: [3, 3], rim: 2 }),
  cel('M40 40H48V26C48 20 56 20 56 26V34C56 42 52 46 46 46H40Z', { base: 'plant', shade: 'plantShade', light: 'plantLight' }, { stroke: 3.5, shade: [3, 3], rim: 2 }),
  `<circle cx="32" cy="14" r="5" fill="${c('pink')}" stroke="${c('ink')}" stroke-width="2"/>`,
  cel('M12 70H52L48 98H16Z', { base: 'pot', shade: 'potShade', light: 'tieLight' }, { stroke: 3.5, shade: [7, 0], rim: 2 }),
].join(''));
const penCup = part('fg_pens', 'prop', 44, 84, 22, 80, [
  softShadow(24, 78, 18, 4, 0.35, 3),
  line('M16 40L8 6M24 40L26 2M30 40L38 10', 'ink', 3),
  `<circle cx="8" cy="6" r="3" fill="${c('red')}"/><circle cx="26" cy="3" r="3" fill="${c('wTie')}"/><circle cx="38" cy="10" r="3" fill="${c('cuff')}"/>`,
  cel(rectPath(6, 36, 32, 42, 5), { base: 'metal', shade: 'metalShade', light: 'metalLight' }, { stroke: 3.5, shade: [7, 0], rim: 2 }),
].join(''));

/** Habillage FURIOUS : écran fêlé (par-dessus l'écran intact). Même repère que `monitor`. */
const monitorCrack = part('monitor_crack', 'prop', 108, 108, 54, 106, line('M100 14L84 30L90 40L72 50M84 30L96 44M90 40L100 60', 'glass', 2) + `<circle cx="84" cy="30" r="3" fill="${c('glass')}" opacity="0.7"/>`);
/** Habillage UNHINGED : agrafeuse plantée dans le mur (objet coincé). */
const stuckStapler = part('stuck_stapler', 'prop', 70, 40, 12, 22, [
  cel('M10 14L56 6C62 5 66 9 64 14L60 26L12 30Z', { base: 'metalDark', shade: 'ink', light: 'metalShade' }, { stroke: 3.5, shade: [0, 4], rim: 2 }),
  cel('M14 10L56 2C60 2 62 4 60 8L16 16Z', { base: 'red', shade: 'redShade', light: 'redLight' }, { stroke: 3.5, shade: [0, 3], rim: 2 }),
  line('M4 20L12 22M6 12L12 16M6 28L12 26', 'inkSoft', 2),
].join(''));

/** Canard en caoutchouc (cosmétique du COLLECTION BOOK). */
const duck = part('fg_duck', 'prop', 76, 56, 38, 52, [
  softShadow(38, 50, 30, 4, 0.3, 3),
  cel('M8 34C8 22 20 18 34 22C40 10 60 10 62 24C64 32 58 36 54 38C56 46 46 50 34 50C18 50 8 44 8 34Z', { base: 'tie', shade: 'tieShade', light: 'tieLight' }, { stroke: 3, shade: [6, 5], rim: 2 }),
  cel('M60 22L74 26L60 31Z', { base: 'beak', shade: 'pot' }, { stroke: 2, shade: [0, 2] }),
  `<circle cx="54" cy="20" r="3" fill="${c('ink')}"/><circle cx="53" cy="19" r="1" fill="${c('paper')}"/>`,
].join(''));

// ------------------------------------------------------------------ plafond et lumières

/** Plafonnier (dalle lumineuse) vu en perspective. */
const ceilingLight = part('ceiling_light', 'background', 200, 44, 100, 22, [
  `<path d="M24 6H176L196 38H4Z" fill="${c('metalLight')}" stroke="${c('inkSoft')}" stroke-width="2"/>`,
  `<path d="M34 11H166L180 33H20Z" fill="${c('paper')}"/>`,
  line('M100 11V33M60 11L54 33M140 11L146 33', 'wallLight', 1.5),
].join(''));

/** Trou dans le plafond (état « hole »). */
const ceilingHole = part('ceiling_hole', 'background', 176, 112, 88, 68, '<g transform="translate(3 8)">' + [
  cel('M8 40L20 22L40 30L56 8L80 24L100 4L118 24L140 12L152 32L164 44L150 70L128 62L110 84L88 70L66 90L48 70L26 76Z', { base: 'night', light: 'inkSoft' }, { stroke: 2, ink: 'inkSoft', rim: 3 }),
  line('M20 22L6 12M100 4L104 -4M164 44L170 52M66 90L62 98', 'inkSoft', 2),
].join('') + '</g>');

/** Rayon de lumière de la fenêtre (additif, pré-flouté). */
const lightShaft = (() => {
  const f = nid('f');
  const g = nid('g');
  return part('light_shaft', 'vfx', 620, 520, 0, 0, `<defs><filter id="${f}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>`
    + `<linearGradient id="${g}" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="${c('tieLight')}" stop-opacity="0.9"/><stop offset="1" stop-color="${c('tieLight')}" stop-opacity="0"/></linearGradient></defs>`
    + `<path d="M40 30L230 30L600 470L300 500Z" fill="url(#${g})" filter="url(#${f})"/>`
    + `<ellipse cx="400" cy="470" rx="170" ry="34" fill="${c('tieLight')}" opacity="0.6" filter="url(#${f})"/>`);
})();

/** Ombre de contact douce (personnages, accessoires mobiles). */
const contactShadow = part('shadow', 'vfx', 140, 36, 70, 18, softShadow(70, 18, 58, 10, 0.55, 6));

export const OFFICE_PARTS: readonly ArtPart[] = [
  sky, windowFrameP, windowGlass, windowShards, portrait, cork, clock, clockHand, clockHandLong, certificate,
  cabinet, cabinetDent, plant, elevator, elevatorLamp, elevatorDent, doorL, doorR, extinguisher, extNozzle,
  desk, monitor, monitorBroken, bell, slingPost, slingPouch, fanMotor, fanBlades, fanDroop,
  keyboard, tealMug, postits, cactus, penCup, duck, ceilingLight, ceilingHole, lightShaft, contactShadow, monitorCrack, stuckStapler,
];

export const WINDOW_OPENING = { w: WIN.ow, h: WIN.oh, x: WIN.ox - WIN.w / 2, y: WIN.oy - (WIN.h / 2 - 10) };
export const SKY_SIZE = { w: SKY_W, h: SKY_H };
