/**
 * Mini-DSL SVG de l'ART BIBLE : formes « cel-shadées » (base + croissant d'ombre en bas à droite + liseré de lumière
 * en haut à gauche + contour encre), toujours avec la MÊME direction de lumière (la fenêtre, en haut à gauche).
 * Aucune dépendance au DOM : les pièces sont de simples chaînes (testables en Node), rastérisées par ./atlas.
 */
import { PAL, type ArtCategory, type PalName } from './palette';

export interface ArtPart {
  id: string;
  category: ArtCategory;
  /** Taille de la pièce (unités du monde). */
  w: number;
  h: number;
  /** Pivot, dans les coordonnées de la pièce. */
  ax: number;
  ay: number;
  /** Contenu SVG, dans le repère [0, w] × [0, h]. */
  body: string;
}

let uid = 0;
/** Identifiant unique (les pièces sont assemblées dans un même document SVG par atlas). */
export const nid = (p = 'i'): string => `${p}${(uid++).toString(36)}`;

export const c = (name: PalName): string => PAL[name];

export interface Tone {
  base: PalName;
  shade?: PalName;
  light?: PalName;
}

export interface CelOptions {
  /** Épaisseur du contour (0 : aucun). */
  stroke?: number;
  ink?: PalName;
  /** Décalage de la forme éclairée vers la lumière : l'ombre reste en bas à droite. */
  shade?: readonly [number, number];
  /** Épaisseur du liseré de lumière (haut gauche). 0 : aucun. */
  rim?: number;
  /** Détails dessinés à l'intérieur de la forme (découpés par elle), sous le contour. */
  inner?: string;
  /** Détails au-dessus du contour (non découpés). */
  over?: string;
}

/** Forme cel-shadée. */
export function cel(d: string, tone: Tone, o: CelOptions = {}): string {
  const [dx, dy] = o.shade ?? [6, 5];
  const out: string[] = [`<path d="${d}" fill="${c(tone.base)}"/>`];
  if (tone.light && (o.rim ?? 0) > 0) {
    const m = nid('m');
    out.push(`<mask id="${m}"><path d="${d}" fill="#fff"/><path d="${d}" transform="translate(${o.rim} ${o.rim})" fill="#000"/></mask>`);
    out.push(`<path d="${d}" fill="${c(tone.light)}" mask="url(#${m})"/>`);
  }
  if (tone.shade && (dx !== 0 || dy !== 0)) {
    const m = nid('m');
    out.push(`<mask id="${m}"><path d="${d}" fill="#fff"/><path d="${d}" transform="translate(${-dx} ${-dy})" fill="#000"/></mask>`);
    out.push(`<path d="${d}" fill="${c(tone.shade)}" mask="url(#${m})"/>`);
  }
  if (o.inner) {
    const k = nid('k');
    out.push(`<clipPath id="${k}"><path d="${d}"/></clipPath><g clip-path="url(#${k})">${o.inner}</g>`);
  }
  const stroke = o.stroke ?? 0;
  if (stroke > 0) out.push(outline(d, stroke, o.ink ?? 'ink'));
  if (o.over) out.push(o.over);
  return out.join('');
}

export function outline(d: string, width: number, ink: PalName = 'ink'): string {
  return `<path d="${d}" fill="none" stroke="${c(ink)}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
}

export function fill(d: string, color: PalName, opacity = 1): string {
  return `<path d="${d}" fill="${c(color)}"${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`;
}

/** Trait (ligne ouverte). */
export function line(d: string, color: PalName, width: number, opacity = 1): string {
  return `<path d="${d}" fill="none" stroke="${c(color)}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`;
}

export function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
}

export function rectPath(x: number, y: number, w: number, h: number, r = 0): string {
  if (r <= 0) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
  const k = Math.min(r, w / 2, h / 2);
  return `M${x + k} ${y}H${x + w - k}A${k} ${k} 0 0 1 ${x + w} ${y + k}V${y + h - k}A${k} ${k} 0 0 1 ${x + w - k} ${y + h}H${x + k}A${k} ${k} 0 0 1 ${x} ${y + h - k}V${y + k}A${k} ${k} 0 0 1 ${x + k} ${y}Z`;
}

/** Ombre de contact floue (pré-calculée dans la texture : aucun filtre temps réel). */
export function softShadow(cx: number, cy: number, rx: number, ry: number, opacity = 0.28, blur = 4): string {
  const f = nid('f');
  return `<filter id="${f}" x="-50%" y="-80%" width="200%" height="260%"><feGaussianBlur stdDeviation="${blur}"/></filter>`
    + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c('ink')}" opacity="${opacity}" filter="url(#${f})"/>`;
}

/** Dégradé linéaire vertical (grandes surfaces, jamais sur un personnage). */
export function vGradient(stops: readonly [number, PalName, number?][]): { id: string; def: string } {
  const id = nid('g');
  const s = stops.map(([o, col, a]) => `<stop offset="${o}" stop-color="${c(col)}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('');
  return { id, def: `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${s}</linearGradient>` };
}

export function radialGradient(stops: readonly [number, PalName, number?][]): { id: string; def: string } {
  const id = nid('g');
  const s = stops.map(([o, col, a]) => `<stop offset="${o}" stop-color="${c(col)}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('');
  return { id, def: `<radialGradient id="${id}">${s}</radialGradient>` };
}

export function part(id: string, category: ArtCategory, w: number, h: number, ax: number, ay: number, body: string): ArtPart {
  return { id, category, w, h, ax, ay, body };
}

/** Miroir horizontal d'un contenu (pièces gauche/droite). */
export function mirrorX(body: string, w: number): string {
  return `<g transform="translate(${w} 0) scale(-1 1)">${body}</g>`;
}
