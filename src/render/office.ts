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
  // DESTRUCTION CUMULATIVE (tours gratuits) : 8 fissures qui apparaissent une à une (une par HIT), puis l'effondrement.
  // Tracés fixes (générateur à graine constante, jamais Math.random) : même bonus, même image.
  let seed = 0x5eed;
  const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
  const starts: [number, number][] = [[-560, -300], [560, -280], [-620, 60], [600, 90], [-240, -330], [260, -340], [-700, -120], [700, -60]];
  starts.forEach(([x0, y0], i) => {
    const crack = new Graphics();
    const pts: number[] = [x0, y0];
    let x = x0;
    let y = y0;
    for (let k = 0; k < 7; k++) {
      x += (-x0 / 9) + (rnd() - 0.5) * 70;
      y += (-y0 / 9) + (rnd() - 0.5) * 70;
      pts.push(x, y);
    }
    crack.poly(pts, false).stroke({ width: 9, color: 0x0b0414, join: 'round', cap: 'round' });
    crack.poly(pts, false).stroke({ width: 3, color: 0xff9e5e, join: 'round', cap: 'round' });
    // Branche secondaire.
    const m = 6 + Math.floor(rnd() * 4) * 2;
    const bx = pts[m] ?? x0;
    const by = pts[m + 1] ?? y0;
    crack.moveTo(bx, by).lineTo(bx + (rnd() - 0.5) * 160, by + (rnd() - 0.2) * 120).stroke({ width: 3, color: 0xff9e5e, cap: 'round' });
    crack.visible = false;
    crack.label = `crack-${i + 1}`;
    view.addChild(crack);
  });
  const collapse = new Graphics();
  for (let i = 0; i < 14; i++) {
    const x = -680 + i * 105 + (rnd() - 0.5) * 40;
    collapse.poly([x, -700, x + 60 + rnd() * 40, -700, x + 30, -330 - rnd() * 160], true).fill({ color: 0x0b0414, alpha: 0.85 });
  }
  collapse.visible = false;
  collapse.label = 'collapse';
  view.addChild(collapse);
  return view;
}

/** Dégâts de l'arène (état `dmg` du fond : nombre de HIT, ou `collapse` au K.O.). Rendu seulement. */
export function setBfDamage(view: Container, dmg: string | undefined): void {
  const all = dmg === 'collapse';
  const n = all ? 8 : Math.max(0, Math.min(8, Number(dmg ?? 0) || 0));
  for (const c of view.children) {
    if (c.label?.startsWith('crack-')) c.visible = Number(c.label.slice(6)) <= n;
    else if (c.label === 'collapse') c.visible = all;
  }
  view.children[0]!.position.y = all ? 18 : 0;
}
