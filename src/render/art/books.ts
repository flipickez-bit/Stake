/**
 * Livres de pièces (un livre = un groupe d'atlas à une échelle donnée).
 * Échelle = pixels par unité du monde : 2 pour les personnages et les accessoires (zooms caméra, écrans denses).
 */
import type { AtlasBook } from './atlas';
import { BOSS_PARTS } from './parts/boss';
import { CAST_PARTS } from './parts/cast';
import { FURIOUS_PARTS } from './parts/furious';
import { OFFICE_PARTS } from './parts/office';
import { PLAN_PARTS } from './parts/plans';
import { VFX_PARTS } from './parts/vfx';

/** Art flou par nature (lointain, lumière, ombres) : 0,6 px par unité suffit. */
const SOFT = new Set(['win_sky', 'light_shaft', 'shadow']);
/** Décor de fond et de milieu (encre douce, jamais au premier plan d'un zoom) : 1,5 px par unité. */
const DECOR = new Set([
  'win_frame', 'win_glass', 'win_shards', 'portrait', 'cork', 'clock', 'clock_hand', 'clock_hand_long', 'certificate',
  'cabinet', 'cabinet_dent', 'plant', 'elevator', 'elevator_lamp', 'elevator_dent', 'elevator_door_l', 'elevator_door_r',
  'extinguisher', 'ext_nozzle', 'ceiling_light', 'ceiling_hole',
]);

export const CHARACTER_BOOK: AtlasBook = { id: 'characters', scale: 2, parts: [...BOSS_PARTS, ...CAST_PARTS, ...VFX_PARTS] };
/** Accessoires du plan d'action et du premier plan (bureau, écran, lance-pierre…) : 1,75 px par unité (page 2048 × 512). */
export const PROPS_BOOK: AtlasBook = { id: 'props', scale: 1.75, parts: OFFICE_PARTS.filter((p) => !SOFT.has(p.id) && !DECOR.has(p.id)) };
export const DECOR_BOOK: AtlasBook = { id: 'decor', scale: 1.5, parts: OFFICE_PARTS.filter((p) => DECOR.has(p.id)) };
export const SOFT_BOOK: AtlasBook = { id: 'soft', scale: 0.6, parts: OFFICE_PARTS.filter((p) => SOFT.has(p.id)) };
/** Compatibilité des tests : tout le bureau. */
export const OFFICE_BOOK: AtlasBook = { id: 'office', scale: 2, parts: [...OFFICE_PARTS] };

/**
 * FURIOUS : trappe et levier définitifs (aussi en mode classique), classeurs-dominos, rampe et bonbonne.
 * Petite page (1024 px, 1,5 px par unité).
 */
export const FURIOUS_BOOK: AtlasBook = { id: 'furious', scale: 1.5, maxPx: 1024, parts: FURIOUS_PARTS };

export const ART_BOOKS: readonly AtlasBook[] = [CHARACTER_BOOK, PROPS_BOOK, DECOR_BOOK, SOFT_BOOK, FURIOUS_BOOK];

/**
 * POC « 3 PLANS » : prototypes des plans B et C, dans leur propre petite page (1024 × 512, 1,5 px par unité),
 * chargée SEULEMENT en mode POC. Le budget des livres de production (≤ 32 Mo) n'est pas touché.
 */
export const PLAN_BOOK: AtlasBook = { id: 'plans', scale: 1.5, maxPx: 1024, parts: PLAN_PARTS };

/** Même art à une autre densité (vignettes du COLLECTION BOOK : leur propre contexte WebGL, peu de pixels). */
export function scaledBooks(k: number): readonly AtlasBook[] {
  return k === 1 ? ART_BOOKS : ART_BOOKS.map((b) => ({ ...b, id: `${b.id}@${k}`, scale: b.scale * k }));
}
