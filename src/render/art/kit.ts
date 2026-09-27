/**
 * Accès aux textures d'art d'une scène : un Sprite par pièce, pivot déjà réglé (ancre = pivot de la pièce).
 */
import { Sprite, Texture } from 'pixi.js';
import type { ArtTexture } from './atlas';

export class ArtKit {
  constructor(private readonly map: ReadonlyMap<string, ArtTexture>) {}

  has(id: string): boolean {
    return this.map.has(id);
  }

  texture(id: string): Texture {
    return this.map.get(id)?.texture ?? Texture.EMPTY;
  }

  /** Sprite de la pièce, ancré sur son pivot. */
  sprite(id: string, x = 0, y = 0): Sprite {
    const s = new Sprite(this.texture(id));
    this.anchor(s, id);
    s.position.set(x, y);
    return s;
  }

  /** Change la texture d'un sprite (et son ancre) : bascule d'expression, d'état. */
  swap(s: Sprite, id: string): void {
    const t = this.texture(id);
    if (s.texture === t) return;
    s.texture = t;
    this.anchor(s, id);
  }

  private anchor(s: Sprite, id: string): void {
    const p = this.map.get(id)?.part;
    if (p) s.anchor.set(p.ax / p.w, p.ay / p.h);
  }
}
