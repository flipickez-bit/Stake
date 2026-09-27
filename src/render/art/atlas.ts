/**
 * Rastérisation des pièces SVG en ATLAS (une image par page, 2048 px de large au plus, hauteur en puissance de 2).
 * Toutes les pièces d'une page sont assemblées dans UN document SVG (un seul décodage par page).
 * Les toiles rastérisées sont partagées par toutes les scènes (jeu, vignettes) ; chaque scène crée ses propres
 * sources Pixi (un contexte WebGL par scène).
 *
 * Prototype : en production, ces pages seront pré-rendues au build en WebP (@1x / @2x), sans changer les rigs.
 */
import { CanvasSource, Rectangle, Texture } from 'pixi.js';
import type { ArtPart } from './svg';

const MAX_PX = 2048;
/** Marge entre pièces (unités) : évite les fuites de filtrage et de mipmaps. */
const PAD = 4;

export interface AtlasBook {
  /** Groupe de pièces rastérisées à la même échelle (px par unité du monde). */
  id: string;
  scale: number;
  parts: readonly ArtPart[];
  /** Largeur maximale de page (px). 2048 par défaut. */
  maxPx?: number;
}

interface Placed {
  part: ArtPart;
  x: number;
  y: number;
}

export interface RasterPage {
  canvas: HTMLCanvasElement;
  scale: number;
  placed: Placed[];
}

/** Rangement en étagères (pièces triées par hauteur décroissante). Pur : testable. */
export function packShelves(parts: readonly ArtPart[], maxW: number, maxH: number): { pages: { placed: Placed[]; width: number; height: number }[] } {
  const sorted = [...parts].sort((a, b) => b.h - a.h || b.w - a.w || a.id.localeCompare(b.id));
  const pages: { placed: Placed[]; width: number; height: number }[] = [];
  let page = { placed: [] as Placed[], width: 0, height: 0 };
  let x = PAD;
  let y = PAD;
  let shelf = 0;
  for (const p of sorted) {
    if (p.w + 2 * PAD > maxW) throw new Error(`pièce trop large pour l'atlas : ${p.id}`);
    if (x + p.w + PAD > maxW) {
      x = PAD;
      y += shelf + PAD;
      shelf = 0;
    }
    if (y + p.h + PAD > maxH) {
      pages.push(page);
      page = { placed: [], width: 0, height: 0 };
      x = PAD;
      y = PAD;
      shelf = 0;
    }
    page.placed.push({ part: p, x, y });
    page.height = Math.max(page.height, y + p.h + PAD);
    page.width = Math.max(page.width, x + p.w + PAD);
    x += p.w + PAD;
    shelf = Math.max(shelf, p.h);
  }
  if (page.placed.length) pages.push(page);
  return { pages };
}

function pow2(n: number): number {
  let p = 64;
  while (p < n) p *= 2;
  return p;
}

export function atlasDocument(placed: readonly Placed[], widthU: number, heightU: number, scale: number): string {
  const inner = placed
    .map(({ part, x, y }) => `<svg x="${x}" y="${y}" width="${part.w}" height="${part.h}" viewBox="0 0 ${part.w} ${part.h}" overflow="hidden">${part.body}</svg>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(widthU * scale)}" height="${Math.round(heightU * scale)}" viewBox="0 0 ${widthU} ${heightU}">${inner}</svg>`;
}

async function decode(doc: string): Promise<HTMLImageElement> {
  const tryUrl = async (url: string) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  };
  const blobUrl = URL.createObjectURL(new Blob([doc], { type: 'image/svg+xml' }));
  try {
    return await tryUrl(blobUrl);
  } catch {
    // Politique de sécurité stricte sur blob: → repli en data: URL.
    return tryUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(doc)}`);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

async function rasterize(book: AtlasBook): Promise<RasterPage[]> {
  const maxU = (book.maxPx ?? MAX_PX) / book.scale;
  const { pages } = packShelves(book.parts, maxU, MAX_PX / book.scale);
  const out: RasterPage[] = [];
  for (const page of pages) {
    // Page à la taille de son contenu (puissances de 2 : mipmaps possibles partout).
    const wPx = Math.min(book.maxPx ?? MAX_PX, pow2(Math.ceil(page.width * book.scale)));
    const hPx = pow2(Math.ceil(page.height * book.scale));
    const img = await decode(atlasDocument(page.placed, wPx / book.scale, hPx / book.scale, book.scale));
    const canvas = document.createElement('canvas');
    canvas.width = wPx;
    canvas.height = hPx;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2D indisponible');
    ctx.drawImage(img, 0, 0, wPx, hPx);
    out.push({ canvas, scale: book.scale, placed: page.placed });
  }
  return out;
}

const cache = new Map<string, Promise<RasterPage[]>>();

/** Pages rastérisées d'un livre de pièces (une seule fois par session). */
export function rasterPages(book: AtlasBook): Promise<RasterPage[]> {
  let p = cache.get(book.id);
  if (!p) {
    p = rasterize(book);
    cache.set(book.id, p);
    p.catch(() => cache.delete(book.id));
  }
  return p;
}

export interface ArtTexture {
  texture: Texture;
  part: ArtPart;
}

/** Textures Pixi (propres à une scène) de plusieurs livres. */
export async function loadTextures(books: readonly AtlasBook[]): Promise<{ textures: Map<string, ArtTexture>; sources: CanvasSource[] }> {
  const textures = new Map<string, ArtTexture>();
  const sources: CanvasSource[] = [];
  for (const book of books) {
    for (const page of await rasterPages(book)) {
      const source = new CanvasSource({ resource: page.canvas, resolution: page.scale, autoGenerateMipmaps: true, scaleMode: 'linear' });
      sources.push(source);
      for (const { part, x, y } of page.placed) {
        textures.set(part.id, { part, texture: new Texture({ source, frame: new Rectangle(x, y, part.w, part.h) }) });
      }
    }
  }
  return { textures, sources };
}
