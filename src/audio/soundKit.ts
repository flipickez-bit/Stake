/**
 * BAD BOSS SOUND KIT (SOUND_BIBLE.md §3) : catalogue PUR des sons (catégorie, bus, pool de variantes).
 * Aucune dépendance au DOM : testable en Node (déterminisme, règle « x0,5 sans DING »).
 *
 * Variantes : chaque son a un pool de 1 à 6 variantes (hauteur ±5 %, timbre, longueur). La variante jouée est
 * choisie par la GRAINE D'EFFETS de la séquence (dérivée de la graine du book) : même book → même variante.
 * Replay et reprise sonnent donc pareil. Jamais Math.random().
 */
import { hash32 } from '../domain/seed';
import type { SoundId } from '../presentation/types';

export type SoundCategory =
  | 'UI' | 'OFFICE' | 'CHARACTERS' | 'MOVEMENT' | 'GADGET' | 'IMPACT' | 'DEBRIS' | 'SUSPENSE'
  | 'WIN' | 'BIG_WIN' | 'BOSS_FIGHT' | 'COLLECTION';

/** Bus de mixage (GDD_07 §8.3.2). Priorités : stingers > voix > impacts > gadget > ambiance. */
export type Bus = 'ui' | 'sfx' | 'impact' | 'voice' | 'stinger' | 'music';

export interface SoundSpec {
  category: SoundCategory;
  bus: Bus;
  /** Taille du pool de variantes (1 = son d'identité, jamais varié). */
  variants: number;
  /** Écart de hauteur maximal entre variantes (0,05 = ±5 %). */
  spread: number;
}

const S = (category: SoundCategory, bus: Bus, variants: number, spread = 0.05): SoundSpec => ({ category, bus, variants, spread });

export const SOUND_KIT: Record<SoundId, SoundSpec> = {
  // UI : retour d'interface seulement (jamais un son de gain).
  click: S('UI', 'ui', 2, 0.03),
  // OFFICE : le bureau vit et réagit.
  bell: S('OFFICE', 'sfx', 1, 0),
  elevator: S('OFFICE', 'sfx', 3, 0.04),
  room: S('OFFICE', 'impact', 3, 0.06),
  // CHARACTERS : voix placeholder (Bossish, Wendell, COO) et LE SIP.
  hmpf: S('CHARACTERS', 'voice', 4, 0.06),
  laugh: S('CHARACTERS', 'voice', 4, 0.05),
  sip: S('CHARACTERS', 'voice', 4, 0.04),
  gulp: S('CHARACTERS', 'voice', 3, 0.05),
  coo: S('CHARACTERS', 'voice', 3, 0.06),
  plop: S('CHARACTERS', 'sfx', 4, 0.08),
  honk: S('CHARACTERS', 'voice', 3, 0.05),
  // MOVEMENT
  whoosh: S('MOVEMENT', 'sfx', 6, 0.08),
  spin: S('MOVEMENT', 'sfx', 3, 0.06),
  fall: S('MOVEMENT', 'sfx', 3, 0.05),
  twang: S('MOVEMENT', 'sfx', 4, 0.06),
  snap: S('MOVEMENT', 'sfx', 5, 0.07),
  screech: S('MOVEMENT', 'sfx', 3, 0.05),
  spray: S('MOVEMENT', 'sfx', 3, 0.06),
  roll: S('MOVEMENT', 'sfx', 3, 0.05),
  slide: S('MOVEMENT', 'sfx', 4, 0.07),
  gust: S('MOVEMENT', 'sfx', 4, 0.07),
  // GADGET : mécanismes, signatures.
  creak: S('GADGET', 'sfx', 5, 0.07),
  stretch: S('GADGET', 'sfx', 3, 0.05),
  pfft: S('GADGET', 'sfx', 5, 0.08),
  fuse: S('GADGET', 'sfx', 3, 0.05),
  clunk: S('GADGET', 'sfx', 5, 0.07),
  roar: S('GADGET', 'sfx', 3, 0.04),
  crank: S('GADGET', 'sfx', 4, 0.06),
  whirr: S('GADGET', 'sfx', 3, 0.05),
  rattle: S('GADGET', 'sfx', 4, 0.07),
  squeak: S('GADGET', 'sfx', 4, 0.08),
  chain: S('GADGET', 'sfx', 3, 0.06),
  deflate: S('GADGET', 'sfx', 3, 0.05),
  boing: S('GADGET', 'sfx', 4, 0.06),
  // IMPACT : couches BODY (thud, bonk), OBJECT (clang, tink, clink, glass), LOW (boom, thump), COMEDIC (boing, honk).
  thud: S('IMPACT', 'impact', 6, 0.07),
  bonk: S('IMPACT', 'impact', 5, 0.07),
  crash: S('IMPACT', 'impact', 4, 0.05),
  clang: S('IMPACT', 'impact', 4, 0.05),
  tink: S('IMPACT', 'impact', 4, 0.06),
  clink: S('IMPACT', 'impact', 5, 0.05),
  glass: S('IMPACT', 'impact', 4, 0.05),
  boom: S('IMPACT', 'impact', 3, 0.05),
  thump: S('IMPACT', 'impact', 4, 0.06),
  splash: S('IMPACT', 'impact', 3, 0.06),
  strike: S('IMPACT', 'impact', 3, 0.05),
  // DEBRIS
  debris: S('DEBRIS', 'impact', 5, 0.08),
  paper: S('DEBRIS', 'sfx', 5, 0.08),
  rumble: S('DEBRIS', 'impact', 3, 0.05),
  // SUSPENSE
  tension: S('SUSPENSE', 'music', 2, 0.02),
  // WIN (réservés au résultat réellement joué ; le DING est un son d'identité : une seule variante)
  ding: S('WIN', 'stinger', 1, 0),
  wahwah: S('WIN', 'stinger', 2, 0.02),
  cheer: S('WIN', 'stinger', 3, 0.04),
  // BIG WIN
  brass: S('BIG_WIN', 'stinger', 2, 0.02),
  // BOSS FIGHT (l'or est réservé au BOSS FIGHT)
  gold: S('BOSS_FIGHT', 'stinger', 1, 0),
  giantRoar: S('BOSS_FIGHT', 'voice', 2, 0.03),
  crack: S('BOSS_FIGHT', 'impact', 2, 0.03),
};

/** Sons de GAIN : jamais pour un montant inférieur à la mise (x0,5), jamais pour un plan non joué. */
export const WIN_SOUNDS: ReadonlySet<SoundId> = new Set<SoundId>(['ding', 'gold', 'cheer', 'brass']);

export interface Variant {
  /** Indice dans le pool (0 … variants − 1). */
  index: number;
  /** Multiplicateur de hauteur (déjà centré : ±spread). */
  pitch: number;
  /** Multiplicateur de longueur (±6 %) : deux variantes n'ont pas la même queue. */
  length: number;
}

/** Variante déterministe d'un son pour une graine donnée. Graine absente : variante 0 (hauteur 1). */
export function variantOf(sound: SoundId, seed: number | undefined): Variant {
  const spec = SOUND_KIT[sound];
  if (seed === undefined || spec.variants <= 1) return { index: 0, pitch: 1, length: 1 };
  const h = hash32(`${sound}|${seed >>> 0}`);
  const index = h % spec.variants;
  // Hauteurs réparties régulièrement dans [−spread, +spread] : aucune variante « au hasard ».
  const k = spec.variants === 1 ? 0 : index / (spec.variants - 1) - 0.5;
  return { index, pitch: 1 + 2 * spec.spread * k, length: 1 + 0.12 * (((h >>> 8) % 100) / 100 - 0.5) };
}
