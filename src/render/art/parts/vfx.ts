/**
 * Textures des effets (ART BIBLE §10) : poussière en nuages cartoon, étincelles, étoiles, éclats, papiers…
 * Les textures « teintables » ont une base claire (`paper`) : la couleur du préréglage de particules s'y applique.
 */
import { c, cel, ellipsePath, line, part, rectPath, type ArtPart } from '../svg';

function starPath(cx: number, cy: number, points: number, outer: number, inner: number, rot = -Math.PI / 2): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / points;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

const PUFF = 'M12 44C4 44 2 34 8 30C4 22 12 14 20 18C22 8 36 6 40 14C46 8 58 12 56 22C64 24 62 36 56 38C58 46 50 50 44 46C38 52 26 52 22 46C18 48 14 48 12 44Z';

export const VFX_PARTS: readonly ArtPart[] = [
  part('fx_puff', 'vfx', 64, 56, 32, 28, cel(PUFF, { base: 'paper', shade: 'paperShade' }, { stroke: 2, ink: 'inkSoft', shade: [4, 5] })),
  part('fx_spark', 'vfx', 34, 34, 17, 17, cel(starPath(17, 17, 4, 15, 4.5, 0), { base: 'spark', light: 'paper' }, { stroke: 1.5, rim: 2 })),
  part('fx_star', 'vfx', 34, 34, 17, 17, cel(starPath(17, 18, 5, 15, 7), { base: 'tie', shade: 'tieShade', light: 'tieLight' }, { stroke: 2, shade: [2, 2], rim: 2 })),
  part('fx_sparkle', 'vfx', 30, 30, 15, 15, cel(starPath(15, 15, 4, 13, 3.5, 0), { base: 'gold', light: 'goldLight' }, { stroke: 1.5, rim: 2 })),
  part('fx_shard', 'vfx', 26, 22, 13, 11, `<path d="M2 20L12 2L24 16Z" fill="${c('glass')}" stroke="${c('paper')}" stroke-width="2" stroke-linejoin="round"/>`),
  part('fx_paper', 'vfx', 28, 34, 14, 17, cel(rectPath(3, 3, 22, 28, 1.5), { base: 'paper', shade: 'paperShade' }, {
    stroke: 1.5, shade: [0, 3], inner: line('M7 10H21M7 15H21M7 20H16', 'inkSoft', 1.5, 0.7),
  })),
  part('fx_confetti', 'vfx', 18, 12, 9, 6, cel(rectPath(2, 2, 14, 8, 1.5), { base: 'paper' }, { stroke: 1.5, ink: 'inkSoft' })),
  part('fx_bubble', 'vfx', 30, 30, 15, 15, `<circle cx="15" cy="15" r="12" fill="${c('paper')}" stroke="${c('glass')}" stroke-width="2"/><circle cx="11" cy="10" r="3" fill="${c('skyLight')}"/>`),
  part('fx_feather', 'vfx', 34, 16, 17, 8, cel('M2 8C8 2 22 0 32 6C22 12 10 14 2 8Z', { base: 'paper', shade: 'paperShade' }, { stroke: 1.5, ink: 'inkSoft', shade: [0, 2], over: line('M4 8H30', 'inkSoft', 1.5) })),
  part('fx_strand', 'vfx', 24, 12, 12, 6, line('M2 8C6 2 10 2 12 6C14 10 18 10 22 4', 'paper', 3)),
  part('fx_flame', 'vfx', 30, 40, 15, 22, `<path d="M15 38C4 34 4 20 10 12C12 18 14 18 15 14C14 8 18 4 22 2C20 10 28 16 26 28C24 34 20 38 15 38Z" fill="${c('fire')}" stroke="${c('ink')}" stroke-width="2"/>`
    + `<path d="M15 34C10 32 10 24 14 20C16 24 18 22 18 20C22 24 22 32 15 34Z" fill="${c('tieLight')}"/>`),
  part('fx_debris', 'vfx', 24, 18, 12, 9, cel('M2 8L10 2L22 6L18 16L6 16Z', { base: 'wood', shade: 'woodShade', light: 'woodLight' }, { stroke: 2, shade: [3, 3], rim: 1.5 })),
  part('fx_leaf', 'vfx', 26, 16, 13, 8, cel('M2 8C8 0 20 0 24 8C20 16 8 16 2 8Z', { base: 'plant', shade: 'plantShade', light: 'plantLight' }, { stroke: 1.5, shade: [0, 3], rim: 1.5, over: line('M4 8H22', 'plantShade', 1.5) })),
  /** Éclat d'impact (1 à 3 images) : étoile irrégulière, sans texte. */
  part('fx_burst', 'vfx', 220, 220, 110, 110, [
    cel('M110 4L126 70L184 30L150 88L216 96L156 120L200 178L136 146L126 214L104 150L50 196L78 132L6 122L70 96L24 40L90 74Z', { base: 'paper', shade: 'paperShade' }, { stroke: 3, shade: [8, 8] }),
    `<path d="${starPath(110, 112, 8, 60, 30, 0.2)}" fill="${c('tieLight')}"/>`,
    `<circle cx="110" cy="112" r="22" fill="${c('paper')}"/>`,
  ].join('')),
  /** Lignes de vitesse (derrière un corps rapide). Pivot : bord d'attaque (droite). */
  part('fx_speed', 'vfx', 170, 110, 170, 55, [
    [14, 120, 3], [30, 80, 2], [44, 150, 3], [58, 100, 2], [72, 140, 3], [88, 70, 2], [98, 130, 3],
  ].map(([y, len, w]) => line(`M${170 - (len ?? 0)} ${y}H164`, 'paper', w ?? 2)).join('')),
  part('fx_ring', 'vfx', 140, 40, 70, 20, cel(ellipsePath(70, 20, 64, 15), { base: 'paper' }, { stroke: 2, ink: 'inkSoft' }).replace(`fill="${c('paper')}"`, 'fill="none"')),
];
