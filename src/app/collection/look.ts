/** Cosmétiques portés (COLLECTION BOOK) → aspect de rendu. Pont entre la collection et la scène. */
import type { CollectionState } from '../../collection/types';
import { DEFAULT_LOOK, type CosmeticLook } from '../../render/cosmeticLook';

export function lookFrom(state: CollectionState | null): CosmeticLook {
  if (!state) return DEFAULT_LOOK;
  const e = state.equipped;
  return {
    mug: e.mug === 'mug.okayest' ? 'okayest' : 'default',
    tie: e.tie === 'tie.polka' ? 'polka' : 'default',
    duck: e.desk === 'desk.duck',
    elastic: e.elastic === 'elastic.candy' ? 'candy' : 'default',
    trapdoor: e.trapdoor === 'trapdoor.arctic' ? 'arctic' : 'default',
    rocket: e.rocket === 'rocket.retro' ? 'retro' : 'default',
    ding: e.ding === 'ding.deluxe' ? 'deluxe' : 'default',
  };
}

export type AlbumTheme = 'manila' | 'arcade' | 'hallofshame';

export function albumTheme(state: CollectionState | null): AlbumTheme {
  const a = state?.equipped.album;
  return a === 'album.arcade' ? 'arcade' : a === 'album.hallofshame' ? 'hallofshame' : 'manila';
}
