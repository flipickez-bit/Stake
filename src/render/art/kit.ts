/**
 * Accès aux textures d'art d'une scène : un Sprite par pièce, pivot déjà réglé (ancre = pivot de la pièce).
 *
 * LOT 6 (perf) : les livres d'un Rage Level (FURIOUS, UNHINGED) et des plans B/C peuvent arriver APRÈS la
 * construction de la scène. Leurs pièces sont « déclarées » (connues, pivot compris) : la scène se construit tout
 * de suite, leurs sprites restent vides puis reçoivent leur texture à l'arrivée du livre (`provide`). Aucun effet
 * sur une séquence : rendu seulement.
 */
import { Sprite, Texture } from 'pixi.js';
import type { ArtTexture } from './atlas';
import type { ArtPart } from './svg';

export class ArtKit {
  private readonly map: Map<string, ArtTexture>;
  private readonly declared = new Map<string, ArtPart>();
  /** Sprites qui attendent la texture d'une pièce déclarée. */
  private readonly waiting = new Map<Sprite, string>();

  constructor(map: ReadonlyMap<string, ArtTexture>, pending: readonly ArtPart[] = []) {
    this.map = new Map(map);
    for (const p of pending) if (!this.map.has(p.id)) this.declared.set(p.id, p);
  }

  has(id: string): boolean {
    return this.map.has(id) || this.declared.has(id);
  }

  /** Pièce chargée (texture disponible) ? */
  loaded(id: string): boolean {
    return this.map.has(id);
  }

  /** Livres encore attendus ? */
  get pendingCount(): number {
    return this.declared.size;
  }

  texture(id: string): Texture {
    return this.map.get(id)?.texture ?? Texture.EMPTY;
  }

  /** Sprite de la pièce, ancré sur son pivot. */
  sprite(id: string, x = 0, y = 0): Sprite {
    const s = new Sprite(this.texture(id));
    this.anchor(s, id);
    this.track(s, id);
    s.position.set(x, y);
    return s;
  }

  /** Change la texture d'un sprite (et son ancre) : bascule d'expression, d'état. */
  swap(s: Sprite, id: string): void {
    this.track(s, id);
    const t = this.texture(id);
    if (s.texture === t) return;
    s.texture = t;
    this.anchor(s, id);
  }

  /** Arrivée d'un livre différé : les sprites qui l'attendaient reçoivent leur texture. */
  provide(textures: ReadonlyMap<string, ArtTexture>): void {
    for (const [id, t] of textures) {
      this.map.set(id, t);
      this.declared.delete(id);
    }
    for (const [s, id] of this.waiting) {
      if (!this.map.has(id)) continue;
      this.waiting.delete(s);
      if (s.destroyed) continue;
      s.texture = this.texture(id);
      this.anchor(s, id);
    }
  }

  private track(s: Sprite, id: string): void {
    if (this.declared.has(id)) this.waiting.set(s, id);
    else this.waiting.delete(s);
  }

  private anchor(s: Sprite, id: string): void {
    const p = this.map.get(id)?.part ?? this.declared.get(id);
    if (p) s.anchor.set(p.ax / p.w, p.ay / p.h);
  }
}
