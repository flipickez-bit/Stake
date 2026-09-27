/**
 * Le bureau en couches 2.5D (ART BIBLE §6) : fond (parallaxe lente), plan d'action, plafond, premier plan.
 * Grandes surfaces : dégradés pré-calculés dans de petites toiles + traits fins en vecteurs ; le reste vient de l'atlas.
 * Rendu seulement.
 */
import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { hex } from './palette';
import type { ArtKit } from './kit';
import { SKY_SIZE, WINDOW_OPENING } from './parts/office';

export const FLOOR_Y = 560;
/** Point de fuite (perspective du sol et du plafond). */
const VP = { x: 500, y: 330 };
const SPAN = { x0: -900, x1: 1900 };

function rgba(color: number, a: number): string {
  return `rgba(${(color >> 16) & 255},${(color >> 8) & 255},${color & 255},${a})`;
}

/**
 * Surface lisse PRÉ-CALCULÉE : les dégradés n'ont pas besoin de résolution. On les peint une fois dans une petite toile
 * (k pixels par unité), affichée comme un seul sprite : un seul passage de remplissage au lieu de plusieurs couches
 * transparentes superposées (coût de remplissage mesuré en Phase 0.6, voir PHASE_0_6.md §8).
 */
function bake(x0: number, y0: number, w: number, h: number, k: number, paint: (ctx: CanvasRenderingContext2D) => void): Sprite {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(w * k));
  cv.height = Math.max(1, Math.ceil(h * k));
  const ctx = cv.getContext('2d');
  if (ctx) {
    ctx.scale(cv.width / w, cv.height / h);
    ctx.translate(-x0, -y0);
    paint(ctx);
  }
  const sprite = new Sprite(Texture.from(cv));
  sprite.position.set(x0, y0);
  sprite.width = w;
  sprite.height = h;
  return sprite;
}

function linear(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

const css = (name: Parameters<typeof hex>[0], a = 1) => rgba(hex(name), a);

/** Mur : dégradés et rayures (toile lissée) + lambris, cimaise et plinthe (toile nette). Masqué au-dessus du plafond. */
export function drawWall(): Container {
  const c = new Container();
  const top = 40;
  c.addChild(bake(SPAN.x0, top, SPAN.x1 - SPAN.x0, 404 - top, 0.25, (ctx) => {
    ctx.fillStyle = linear(ctx, 0, top, 0, 560, [[0, css('wallLight')], [0.55, css('wall')], [1, css('wallShade')]]);
    ctx.fillRect(SPAN.x0, top, SPAN.x1 - SPAN.x0, 404 - top);
    // Rayures de papier peint, très discrètes.
    ctx.fillStyle = css('wallLight', 0.35);
    for (let x = SPAN.x0; x < SPAN.x1; x += 52) ctx.fillRect(x, 60, 14, 340);
    // Le mur s'assombrit loin de la fenêtre (et vers la gauche du cadre).
    ctx.fillStyle = linear(ctx, 420, 0, SPAN.x1, 0, [[0, css('wallShade', 0)], [1, css('wallShade', 0.55)]]);
    ctx.fillRect(420, top, SPAN.x1 - 420, 404 - top);
    ctx.fillStyle = linear(ctx, SPAN.x0, 0, 0, 0, [[0, css('wallShade', 0.45)], [1, css('wallShade', 0)]]);
    ctx.fillRect(SPAN.x0, top, -SPAN.x0, 404 - top);
    // Occlusion sous le plafond.
    ctx.fillStyle = linear(ctx, 0, 60, 0, 120, [[0, css('wallShade', 0.6)], [1, css('wallShade', 0)]]);
    ctx.fillRect(SPAN.x0, 60, SPAN.x1 - SPAN.x0, 60);
  }));
  // Soubassement en bois (lambris), cimaise et plinthe : 1 px par unité (bords nets).
  c.addChild(bake(SPAN.x0, 396, SPAN.x1 - SPAN.x0, 164, 1, (ctx) => {
    ctx.fillStyle = css('wainscot');
    ctx.fillRect(SPAN.x0, 404, SPAN.x1 - SPAN.x0, 146);
    for (let x = SPAN.x0 + 12; x < SPAN.x1; x += 96) {
      ctx.fillStyle = css('wainscotShade');
      ctx.fillRect(x, 420, 80, 112);
      ctx.fillStyle = css('wainscot');
      ctx.fillRect(x + 3, 423, 74, 106);
      ctx.fillStyle = css('wallLight', 0.5);
      ctx.fillRect(x + 4, 423, 72, 2);
    }
    ctx.fillStyle = css('woodLight');
    ctx.fillRect(SPAN.x0, 396, SPAN.x1 - SPAN.x0, 12);
    ctx.fillStyle = css('wallLight', 0.8);
    ctx.fillRect(SPAN.x0, 396, SPAN.x1 - SPAN.x0, 3);
    ctx.fillStyle = css('woodShade', 0.7);
    ctx.fillRect(SPAN.x0, 406, SPAN.x1 - SPAN.x0, 4);
    ctx.fillStyle = css('woodShade');
    ctx.fillRect(SPAN.x0, 540, SPAN.x1 - SPAN.x0, 20);
    ctx.fillStyle = css('wood');
    ctx.fillRect(SPAN.x0, 540, SPAN.x1 - SPAN.x0, 3);
  }));
  return c;
}

const FLOOR_BOTTOM = 1160;

/** Dégradé du sol (toile lissée partagée par le sol du fond et la bande de premier plan). */
function floorBase(fromY: number): Sprite {
  return bake(SPAN.x0, fromY, SPAN.x1 - SPAN.x0, FLOOR_BOTTOM - fromY, 0.25, (ctx) => {
    ctx.fillStyle = linear(ctx, 0, FLOOR_Y, 0, FLOOR_BOTTOM, [[0, css('floorShade')], [0.1, css('floor')], [1, css('floorLight')]]);
    ctx.fillRect(SPAN.x0, fromY, SPAN.x1 - SPAN.x0, FLOOR_BOTTOM - fromY);
    if (fromY === FLOOR_Y) {
      // Occlusion le long de la plinthe.
      ctx.fillStyle = linear(ctx, 0, FLOOR_Y, 0, FLOOR_Y + 26, [[0, css('ink', 0.28)], [1, css('ink', 0)]]);
      ctx.fillRect(SPAN.x0, FLOOR_Y, SPAN.x1 - SPAN.x0, 26);
    }
  });
}

/** Sol en lattes, en perspective. `fromY` : le premier plan redessine le sol devant la trappe (masque). */
export function drawFloor(fromY = FLOOR_Y): Container {
  const c = new Container();
  c.addChild(floorBase(fromY));
  const g = new Graphics();
  const bottom = FLOOR_BOTTOM;
  // Lattes fuyant vers le point de fuite (traits fins : restent en vecteurs, nets à tout zoom).
  for (let x = SPAN.x0; x <= SPAN.x1; x += 64) {
    const k0 = (fromY - VP.y) / (FLOOR_Y - VP.y);
    const k1 = (bottom - VP.y) / (FLOOR_Y - VP.y);
    g.moveTo(VP.x + (x - VP.x) * k0, fromY).lineTo(VP.x + (x - VP.x) * k1, bottom);
  }
  g.stroke({ width: 2, color: hex('floorShade'), alpha: 0.55 });
  // Joints décalés (lignes horizontales de plus en plus espacées vers nous).
  for (let i = 0, y = FLOOR_Y + 14; y < bottom; i++, y += 14 + i * 6) {
    if (y < fromY) continue;
    const k = (y - VP.y) / (FLOOR_Y - VP.y);
    for (let x = SPAN.x0 + (i % 2) * 32; x < SPAN.x1; x += 128) {
      const sx = VP.x + (x - VP.x) * k;
      g.moveTo(sx, y).lineTo(sx + 64 * k * 0.5, y);
    }
  }
  g.stroke({ width: 1.5, color: hex('floorShade'), alpha: 0.35 });
  c.addChild(g);
  return c;
}

/** Plafond vu d'en bas : dalles en perspective, plafonniers. Devant les acteurs (B.B. peut s'y encastrer). */
export function drawCeiling(kit: ArtKit): { view: Container; lights: Sprite[] } {
  const view = new Container();
  const top = -420;
  view.addChild(bake(SPAN.x0, top, SPAN.x1 - SPAN.x0, 60 - top, 0.25, (ctx) => {
    ctx.fillStyle = linear(ctx, 0, top, 0, 60, [[0, css('paperShade')], [0.8, css('paper')], [1, css('wallLight')]]);
    ctx.fillRect(SPAN.x0, top, SPAN.x1 - SPAN.x0, 60 - top);
  }));
  const g = new Graphics();
  // Rails des dalles : lignes fuyantes et transversales (plus serrées vers le fond).
  for (let x = SPAN.x0; x <= SPAN.x1; x += 110) {
    const k = (top - VP.y) / (60 - VP.y);
    g.moveTo(x, 60).lineTo(VP.x + (x - VP.x) * k, top);
  }
  for (let i = 0, y = 52; y > top; i++, y -= 16 + i * 14) g.moveTo(SPAN.x0, y).lineTo(SPAN.x1, y);
  g.stroke({ width: 2, color: hex('paperShade'), alpha: 0.9 });
  // Corniche.
  g.rect(SPAN.x0, 52, SPAN.x1 - SPAN.x0, 10).fill(hex('wallLight'));
  g.rect(SPAN.x0, 60, SPAN.x1 - SPAN.x0, 3).fill({ color: hex('wallShade'), alpha: 0.9 });
  view.addChild(g);
  const lights: Sprite[] = [];
  for (const [x, y, s] of [[300, -30, 1], [820, -30, 1], [220, -170, 1.3], [880, -170, 1.3]] as const) {
    const l = kit.sprite('ceiling_light', x, y);
    l.scale.set(s, s * (y < 0 ? 1.3 : 1));
    view.addChild(l);
    lights.push(l);
  }
  return { view, lights };
}

/** Bureau du joueur (premier plan, vue subjective) : plus sombre et plus doux (perspective atmosphérique inversée). */
export function drawPlayerDesk(kit: ArtKit): { view: Container; duck: Sprite; tall: Sprite[] } {
  const view = new Container();
  view.addChild(bake(SPAN.x0, 716, SPAN.x1 - SPAN.x0, 460, 0.25, (ctx) => {
    ctx.fillStyle = linear(ctx, 0, 716, 0, 1176, [[0, css('wood')], [1, css('woodShade')]]);
    ctx.fillRect(SPAN.x0, 716, SPAN.x1 - SPAN.x0, 460);
  }));
  const g = new Graphics();
  g.rect(SPAN.x0, 708, SPAN.x1 - SPAN.x0, 12).fill(hex('woodLight'));
  g.rect(SPAN.x0, 708, SPAN.x1 - SPAN.x0, 3).fill({ color: hex('wallLight'), alpha: 0.6 });
  g.rect(SPAN.x0, 720, SPAN.x1 - SPAN.x0, 6).fill({ color: hex('ink'), alpha: 0.25 });
  // Veinage du bois.
  for (let i = 0; i < 9; i++) {
    const y = 740 + i * 38 + (i % 3) * 7;
    g.moveTo(SPAN.x0, y).bezierCurveTo(0, y - 6, 500, y + 8, SPAN.x1, y - 4);
  }
  g.stroke({ width: 2, color: hex('woodShade'), alpha: 0.45 });
  view.addChild(g);
  const items: [string, number, number][] = [
    ['fg_keyboard', 250, 724], ['fg_postits', 440, 722], ['fg_pens', 110, 722], ['fg_cactus', 620, 724], ['fg_mug', 780, 726],
  ];
  const tall: Sprite[] = [];
  for (const [id, x, y] of items) {
    const s = kit.sprite(id, x, y);
    if (id === 'fg_cactus' || id === 'fg_pens' || id === 'fg_postits') tall.push(s);
    view.addChild(s);
  }
  const duck = kit.sprite('fg_duck', 530, 724);
  duck.visible = false;
  view.addChild(duck);
  return { view, duck, tall };
}

/** Vue par la fenêtre : texture plus large que l'ouverture ; le cadre de texture glisse (parallaxe lointaine). */
export class WindowView {
  readonly view = new Container();
  private readonly skyTexture: Texture;
  private readonly sky: Sprite;
  readonly glass: Sprite;
  readonly shards: Sprite;
  private readonly baseFrame: Rectangle;

  constructor(kit: ArtKit) {
    const base = kit.texture('win_sky');
    this.baseFrame = base.frame.clone();
    const o = WINDOW_OPENING;
    this.skyTexture = new Texture({ source: base.source, frame: new Rectangle(this.baseFrame.x + (SKY_SIZE.w - o.w) / 2, this.baseFrame.y + (SKY_SIZE.h - o.h) / 2, o.w, o.h) });
    this.sky = new Sprite(this.skyTexture);
    this.sky.position.set(o.x, o.y);
    this.glass = kit.sprite('win_glass');
    this.shards = kit.sprite('win_shards');
    this.view.addChild(this.sky, kit.sprite('win_frame'), this.glass, this.shards);
  }

  /** Décalage de la vue lointaine (unités), borné par la marge de la texture. */
  setParallax(dx: number): void {
    const o = WINDOW_OPENING;
    const margin = (SKY_SIZE.w - o.w) / 2 - 1;
    const x = Math.max(-margin, Math.min(margin, dx));
    const f = this.skyTexture.frame;
    const nx = this.baseFrame.x + (SKY_SIZE.w - o.w) / 2 - x;
    if (Math.abs(f.x - nx) < 0.01) return;
    f.x = nx;
    this.skyTexture.updateUvs();
  }

  setSkyTint(tint: number): void {
    this.sky.tint = tint;
  }

  setBroken(broken: boolean): void {
    this.glass.visible = !broken;
    this.shards.visible = broken;
  }
}

/**
 * Étalonnage (écran) en UNE texture : vignettage encre + voile chaud venant de la fenêtre (en haut à gauche).
 * Une seule passe plein écran (au lieu de deux) ; repeinte au changement de monde.
 */
export function paintGrade(cv: HTMLCanvasElement, warm: number, warmAlpha: number, vignette: number): void {
  const s = cv.width;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, s, s);
  if (warmAlpha > 0) {
    const w = ctx.createRadialGradient(s * 0.15, s * 0.2, 0, s * 0.15, s * 0.2, s * 0.95);
    w.addColorStop(0, rgba(warm, 0.55 * warmAlpha));
    w.addColorStop(1, rgba(warm, 0));
    ctx.fillStyle = w;
    ctx.fillRect(0, 0, s, s);
  }
  const v = ctx.createRadialGradient(s / 2, s / 2, s * 0.28, s / 2, s / 2, s * 0.74);
  v.addColorStop(0, rgba(hex('ink'), 0));
  v.addColorStop(1, rgba(hex('ink'), Math.min(1, 0.62 * vignette)));
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, s, s);
}

export function makeGradeCanvas(): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  return cv;
}

