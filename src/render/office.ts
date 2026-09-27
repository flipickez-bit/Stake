/**
 * Accessoires encore en PLACEHOLDER (formes simples) : gadgets FURIOUS / UNHINGED, BOSS FIGHT, fumée.
 * Le décor du bureau et les personnages sont passés en art final (Phase 0.6, ./art) ; ces accessoires le seront
 * avec leurs branches, après validation de la vertical slice.
 */
import { Container, Graphics, Text } from 'pixi.js';
import { C } from './placeholder/palette';

export function drawTrapdoor(): { view: Container; closed: Graphics; open: Graphics; jammed: Graphics } {
  const view = new Container();
  const closed = new Graphics().ellipse(0, 14, 70, 16).fill(0x7d6049).stroke({ width: 3, color: 0x4f3a2a });
  closed.moveTo(-40, 4).lineTo(-40, 26).moveTo(0, -2).lineTo(0, 30).moveTo(40, 4).lineTo(40, 26).stroke({ width: 2, color: 0x4f3a2a });
  const open = new Graphics().ellipse(0, 14, 70, 16).fill(0x0c0c0c).stroke({ width: 3, color: 0x4f3a2a });
  const jammed = new Graphics().moveTo(-30, 6).lineTo(-6, 18).lineTo(10, 8).lineTo(34, 22).stroke({ width: 3, color: 0x2a1c12 });
  view.addChild(closed, open, jammed);
  return { view, closed, open, jammed };
}

export function drawFog(): Container {
  const view = new Container();
  const g = new Graphics().rect(-1400, -700, 2800, 1400).fill(0xc8bfcb);
  for (let i = 0; i < 14; i++) g.circle(-450 + i * 70, -120 + ((i * 53) % 5) * 60, 90 + ((i * 37) % 4) * 20).fill(0xe9dcca);
  view.addChild(g);
  return view;
}

export function drawLever(): { view: Container; stick: Container } {
  const view = new Container();
  const base = new Graphics().roundRect(-28, -26, 56, 26, 5).fill(0x5c6773).stroke({ width: 2, color: 0x2e353d });
  base.circle(0, -26, 8).fill(0x2e353d);
  const stick = new Container();
  stick.position.set(0, -26);
  stick.addChild(new Graphics().rect(-4, -84, 8, 84).fill(C.metal).circle(0, -90, 13).fill(C.red).stroke({ width: 2, color: 0x8a1c24 }));
  view.addChild(base, stick);
  return { view, stick };
}

export function drawProjectiles(): Record<string, Graphics> {
  return {
    stapler: new Graphics().roundRect(-24, -8, 48, 16, 5).fill(0x3a3f4b).roundRect(-24, -14, 44, 8, 4).fill(C.red),
    plane: new Graphics().poly([-26, -8, 28, 0, -26, 10, -14, 0]).fill(C.white).stroke({ width: 2, color: 0x8899aa }),
    coffee: new Graphics().poly([-11, -14, 11, -14, 8, 14, -8, 14]).fill(0x8b5a2b).rect(-13, -18, 26, 6).fill(C.white),
    keyboard: new Graphics().roundRect(-32, -10, 64, 20, 4).fill(0x2b2b2b).rect(-26, -5, 52, 4).fill(0x777777).rect(-26, 2, 52, 4).fill(0x777777),
  };
}

export function drawGlow(): Graphics {
  const g = new Graphics();
  for (let i = 6; i >= 1; i--) g.circle(0, 0, 30 * i).fill({ color: C.gold, alpha: 0.07 });
  return g;
}

export function drawBfBackdrop(): Container {
  const view = new Container();
  const g = new Graphics().rect(-1400, -700, 2800, 1400).fill(0x1a0b2e);
  for (let i = -6; i <= 6; i++) g.poly([0, -600, i * 90 - 30, 700, i * 90 + 30, 700]).fill({ color: 0x5b2a86, alpha: 0.25 });
  g.ellipse(0, 210, 330, 60).fill({ color: 0xffd700, alpha: 0.12 });
  view.addChild(g);
  const title = new Text({ text: 'BOSS FIGHT', style: { fontFamily: 'Arial Black, Arial', fontWeight: '900', fontSize: 64, fill: 0xffc400, letterSpacing: 6 } });
  title.anchor.set(0.5);
  title.alpha = 0.18;
  title.position.set(0, -250);
  view.addChild(title);
  return view;
}
