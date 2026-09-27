/**
 * Palette de l'ART BIBLE (BAD_BOSS_ART_BIBLE.md §4) : SOURCE UNIQUE des couleurs de l'art.
 * Toute couleur d'un asset SVG doit venir d'ici (vérifié par tests/unit/artBible.test.ts).
 * Règles : jamais de noir pur (l'encre est un violet-brun), jamais de blanc pur sur un personnage (`paper`).
 */
export const PAL = {
  ink: '#2A1B2F',
  inkSoft: '#5C4760',
  paper: '#FFF8EE',
  paperShade: '#E9DCCB',
  /** B.B. */
  suit: '#6A3FA3',
  suitShade: '#4B2A7C',
  suitLight: '#8A5FC7',
  trousers: '#3E2566',
  trousersShade: '#2E1A4D',
  tie: '#FFC21F',
  tieShade: '#E08F12',
  tieLight: '#FFE37A',
  skin: '#F7C8A2',
  skinShade: '#DD9B7C',
  skinLight: '#FFE3C8',
  blush: '#F2877A',
  nose: '#F0A088',
  hair: '#3A2150',
  hairLight: '#5E3A7E',
  shoe: '#3B2230',
  shoeLight: '#6B4456',
  mouth: '#7A2638',
  tongue: '#E46A6F',
  /** Mug jaune de B.B. (signature) : même famille que la cravate. */
  mug: '#FFB81C',
  mugShade: '#D98A0B',
  coffee: '#6B3A1E',
  /** Wendell */
  wShirt: '#A8D8F2',
  wShirtShade: '#78AFD6',
  wShirtLight: '#D2EEFF',
  wTie: '#4DAA6E',
  wTieShade: '#2F8750',
  wHair: '#7A5230',
  wHairLight: '#A0703F',
  wPants: '#8C7A5E',
  wPantsShade: '#6B5B44',
  /** COO */
  coo: '#A69BC4',
  cooShade: '#7C7199',
  cooLight: '#C9C1E0',
  cooNeck: '#56B7A0',
  cooNeck2: '#8A5BB8',
  beak: '#FF9F2E',
  red: '#E23B3B',
  redShade: '#A82323',
  redLight: '#FF7A6B',
  /** Joueur : mug turquoise (couleur RÉSERVÉE), manchettes bleu marine. */
  teal: '#2EC4B6',
  tealShade: '#1E8F86',
  cuff: '#2F3F73',
  cuffShade: '#1F2A52',
  /** Décor */
  wall: '#F2E2C4',
  wallShade: '#D9C3A0',
  wallLight: '#FFF3DC',
  wainscot: '#C9A27A',
  wainscotShade: '#A67F5A',
  floor: '#B98256',
  floorShade: '#94633D',
  floorLight: '#D39E6E',
  wood: '#A2603A',
  woodShade: '#7C4526',
  woodLight: '#C07A45',
  woodDark: '#5E331C',
  metal: '#B4BDC9',
  metalShade: '#8792A3',
  metalLight: '#DCE3EC',
  metalDark: '#5F6878',
  screen: '#27324A',
  screenLight: '#3E5A7A',
  screenGlow: '#6FE0B0',
  sky: '#8FD0FF',
  skyLight: '#DDF3FF',
  skyline: '#88AFCF',
  skylineFar: '#B5D2E8',
  skylineWin: '#E9F6FF',
  plant: '#52B45C',
  plantShade: '#2F8745',
  plantLight: '#8ED66A',
  pot: '#D8703E',
  potShade: '#A9522A',
  cork: '#C99A5E',
  corkShade: '#A87B45',
  postit: '#FFE36E',
  postitShade: '#E8C84A',
  pink: '#FFB3C7',
  leather: '#4A2F5E',
  leatherShade: '#33203F',
  leatherLight: '#6A4A82',
  elastic: '#E23B3B',
  /** Or : RÉSERVÉ au BOSS FIGHT. */
  gold: '#FFD23F',
  goldShade: '#C9981A',
  goldLight: '#FFF1A8',
  smoke: '#8E8494',
  smokeLight: '#C8BFCB',
  glass: '#CDEFFF',
  spark: '#FFE9A0',
  fire: '#FF8A3D',
  /** Mondes FURIOUS / UNHINGED */
  dusk: '#FF9E5E',
  duskDeep: '#C8577A',
  night: '#2B2A55',
  nightDeep: '#1B1A3A',
  alarm: '#FF4B4B',
  hazard: '#FFC21F',
} as const;

export type PalName = keyof typeof PAL;

/** Couleurs autorisées dans les SVG (contrôle automatique de cohérence). */
export const PALETTE_VALUES: ReadonlySet<string> = new Set(Object.values(PAL).map((c) => c.toUpperCase()));

/** Couleur de la palette en nombre (Pixi). */
export function hex(name: PalName): number {
  return Number.parseInt(PAL[name].slice(1), 16);
}

/**
 * Échelle des traits par catégorie d'asset (ART BIBLE §3). Personnages : contour 4,5 ; traits de visage 4 / 3,5 / 3 ;
 * traits intérieurs 2,5 / 2 ; détails 1,5. Accessoires : contour 3,5. Milieu et fond : 2,5 au plus (encre douce).
 * Lointain : aucun trait. Les « tubes » à double trait (anses, tuyau, reflets de vitre) portent `data-tube` et
 * sont exemptés de cette échelle (pas de la palette).
 */
export type ArtCategory = 'character' | 'prop' | 'mid' | 'background' | 'far' | 'vfx' | 'ui';

export const STROKES: Record<ArtCategory, readonly number[]> = {
  character: [4.5, 4, 3.5, 3, 2.5, 2, 1.5],
  prop: [3.5, 3, 2.5, 2, 1.5],
  mid: [2.5, 2, 1.5],
  background: [2.5, 2, 1.5],
  far: [],
  vfx: [3, 2, 1.5],
  ui: [3, 2, 1.5],
};
