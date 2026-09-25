/** Décor fixe du bureau (formes simples) et accessoires animables. */
import { Container, Graphics, Text } from 'pixi.js';
import { C } from './placeholder/palette';

export function drawBackground(): Container {
  const c = new Container();
  const g = new Graphics();
  // Mur (débordant, pour les zooms arrière et les secousses).
  g.rect(-400, -300, 1800, 860).fill(C.wall);
  for (let x = -400; x < 1400; x += 60) g.rect(x, -300, 2, 860).fill({ color: C.wallShade, alpha: 0.6 });
  g.rect(-400, 540, 1800, 20).fill(0xcbbd9c);
  // Sol (arrière).
  g.rect(-400, 560, 1800, 500).fill(C.floor);
  for (let x = -400; x < 1400; x += 80) g.moveTo(x, 560).lineTo(x - 60, 1060).stroke({ width: 2, color: C.floorDark, alpha: 0.5 });
  // Tableau de liège.
  g.roundRect(380, 90, 110, 80, 4).fill(0xc08a4a).stroke({ width: 4, color: 0x7a5230 });
  g.rect(392, 100, 30, 22).fill(C.white).rect(430, 104, 26, 30).fill(0xfff5c0).rect(462, 98, 20, 20).fill(0xffd1dc);
  g.moveTo(398, 150).lineTo(420, 136).lineTo(440, 146).lineTo(476, 124).stroke({ width: 3, color: C.red });
  // Porte (Wendell entre par la droite).
  g.rect(930, 250, 110, 310).fill(0xb58b62).stroke({ width: 5, color: 0x7a5230 });
  g.circle(946, 410, 6).fill(C.gold);
  // Suspensions (profondeur verticale, surtout visibles en portrait).
  for (const x of [300, 830]) {
    g.moveTo(x, -300).lineTo(x, 8).stroke({ width: 2, color: 0x6d6352 });
    g.poly([x - 28, 34, x - 12, 8, x + 12, 8, x + 28, 34]).fill(0x3b3f4a);
    g.ellipse(x, 34, 28, 5).fill({ color: 0xfff2b0, alpha: 0.9 });
    g.poly([x - 28, 36, x + 28, 36, x + 110, 540, x - 110, 540]).fill({ color: 0xfff6d0, alpha: 0.06 });
  }
  // Plante.
  g.roundRect(300, 500, 44, 60, 6).fill(0xb5542c);
  for (const [dx, h] of [[-14, 60], [0, 80], [14, 64]] as const) g.ellipse(322 + dx, 500 - h / 2, 10, h / 2).fill(0x3c9a4b);
  // Bureau du boss.
  g.rect(560, 452, 340, 108).fill(C.desk).stroke({ width: 3, color: 0x4f2f18 });
  g.rect(548, 436, 364, 20).fill(C.deskTop).stroke({ width: 3, color: 0x4f2f18 });
  g.rect(760, 470, 120, 70).fill(0x6b3f22);
  g.rect(810, 500, 20, 6).fill(C.gold);
  g.rect(596, 414, 90, 22).fill(0x2b2b2b).rect(606, 404, 70, 12).fill(0x3a3a3a);
  c.addChild(g);
  const plate = new Text({ text: 'B.B. · CEO', style: { fontFamily: 'Arial', fontWeight: '900', fontSize: 14, fill: C.gold, letterSpacing: 1 } });
  plate.anchor.set(0.5);
  plate.position.set(820, 482);
  c.addChild(plate);
  return c;
}

/** Plafond (au premier plan, pour que le boss puisse s'y encastrer). */
export function drawCeilingStrip(): Graphics {
  return new Graphics().rect(-400, -300, 1800, 360).fill(0xf4efe3).rect(-400, 54, 1800, 6).fill(0xd7ccb4);
}

/**
 * Premier plan : le bureau du joueur (vue subjective). Hors cadre en paysage ; en portrait il remplit
 * le bas de l'écran et donne la profondeur. Les mains du joueur surgissent de derrière.
 */
export function drawPlayerDesk(): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(-400, 722, 1800, 400).fill(0x4a3526);
  g.rect(-400, 712, 1800, 14).fill(0x6b4a32);
  g.rect(-400, 726, 1800, 4).fill({ color: 0x000000, alpha: 0.25 });
  // Clavier, post-it, cactus, tasse du joueur (turquoise : le mug jaune reste celui de B.B.).
  g.roundRect(150, 690, 210, 30, 5).fill(0x2b2f3a);
  for (let i = 0; i < 12; i++) g.rect(160 + i * 16, 696, 12, 7).fill(0x4a5060).rect(164 + i * 16, 707, 12, 7).fill(0x4a5060);
  g.rect(420, 684, 46, 40).fill(0xfff08a).poly([420, 684, 466, 684, 466, 692, 420, 690]).fill(0xf5e070);
  g.moveTo(428, 698).lineTo(456, 698).moveTo(428, 708).lineTo(450, 708).stroke({ width: 2, color: 0x8a7a30 });
  g.roundRect(600, 660, 26, 56, 10).fill(0x3c9a4b).roundRect(611, 646, 10, 26, 5).fill(0x3c9a4b).roundRect(582, 672, 16, 10, 5).fill(0x3c9a4b);
  g.poly([590, 712, 640, 712, 634, 730, 596, 730]).fill(0xb5542c);
  g.roundRect(760, 676, 40, 46, 6).fill(0x2ec4b6).roundRect(796, 688, 14, 20, 7).stroke({ width: 4, color: 0x2ec4b6 });
  g.ellipse(780, 680, 16, 4).fill(0x5a3b20);
  c.addChild(g);
  return c;
}

/** Bande de sol au premier plan : masque le boss qui tombe dans la trappe. */
export function drawFloorFront(): Graphics {
  const g = new Graphics().rect(-400, 578, 1800, 500).fill(C.floor);
  for (let x = -400; x < 1400; x += 80) g.moveTo(x + 2, 578).lineTo(x - 56, 1060).stroke({ width: 2, color: C.floorDark, alpha: 0.5 });
  return g;
}

export function drawWindow(): { view: Container; intact: Graphics; broken: Graphics } {
  const view = new Container();
  const frame = new Graphics();
  frame.rect(-104, -114, 208, 228).fill(0x7a5230);
  frame.rect(-94, -104, 188, 208).fill(C.sky);
  for (const [x, w, h] of [[-80, 36, 120], [-36, 30, 160], [4, 44, 100], [56, 32, 140]] as const) frame.rect(x, 104 - h, w, h).fill(0x6f8fb3);
  frame.circle(60, -70, 16).fill(0xfff2a8);
  view.addChild(frame);
  const intact = new Graphics();
  intact.rect(-4, -104, 8, 208).fill(0x7a5230).rect(-94, -4, 188, 8).fill(0x7a5230);
  intact.poly([-80, -90, -50, -90, -80, -40]).fill({ color: C.white, alpha: 0.35 });
  const broken = new Graphics();
  broken.poly([-60, -70, -20, -96, 10, -60, 50, -84, 70, -30, 40, 10, 76, 60, 20, 70, -10, 96, -40, 50, -80, 40, -56, -10]).fill({ color: 0x2b3a4a, alpha: 0.85 });
  broken.moveTo(-94, -104).lineTo(-60, -70).moveTo(94, -104).lineTo(50, -84).moveTo(94, 104).lineTo(76, 60).moveTo(-94, 104).lineTo(-80, 40).stroke({ width: 3, color: C.white, alpha: 0.8 });
  view.addChild(intact, broken);
  return { view, intact, broken };
}

export function drawPortrait(): Container {
  const view = new Container();
  const g = new Graphics();
  g.moveTo(0, -12).lineTo(-30, 0).moveTo(0, -12).lineTo(30, 0).stroke({ width: 2, color: 0x555555 });
  g.rect(-45, 0, 90, 110).fill(C.gold).stroke({ width: 3, color: 0xb38600 });
  g.rect(-36, 9, 72, 76).fill(0xeadcf5);
  g.roundRect(-22, 46, 44, 40, 10).fill(C.violet);
  g.circle(0, 36, 17).fill(C.skin);
  g.poly([-8, 22, -2, 10, 3, 18, 10, 6, 8, 22]).fill(C.violetDark);
  view.addChild(g);
  const label = new Text({ text: 'EMPLOYEE OF THE MONTH', style: { fontFamily: 'Arial', fontWeight: '800', fontSize: 7, fill: 0x5a3b00 } });
  label.anchor.set(0.5);
  label.position.set(0, 97);
  view.addChild(label);
  return view;
}

export function drawCabinet(): { view: Container; dent: Graphics } {
  const view = new Container();
  const g = new Graphics();
  g.rect(-45, -170, 90, 170).fill(0x8d99a6).stroke({ width: 3, color: 0x5c6773 });
  for (let i = 0; i < 3; i++) {
    g.rect(-38, -162 + i * 55, 76, 48).fill(0x9fabb8).stroke({ width: 2, color: 0x5c6773 });
    g.roundRect(-12, -142 + i * 55, 24, 7, 3).fill(0x4a5561);
  }
  const dent = new Graphics();
  dent.poly([30, -120, 45, -100, 38, -70, 45, -44, 28, -80]).fill(0x5c6773);
  dent.rect(-38, -107, 76, 10).fill(0x4a5561);
  view.addChild(g, dent);
  return { view, dent };
}

export function drawCeilingHole(): Graphics {
  return new Graphics().poly([-70, -40, -60, 16, -34, 6, -16, 24, 8, 10, 30, 26, 52, 8, 72, 18, 70, -40]).fill(0x2a2a2a);
}

export function drawBell(): Graphics {
  return new Graphics().ellipse(0, -2, 16, 5).fill(0x777777).arc(0, -4, 12, Math.PI, 0).fill(0xc9ced4).circle(0, -18, 3).fill(0x777777);
}

export function drawSlingPost(): Container {
  const view = new Container();
  const g = new Graphics();
  g.rect(-8, -80, 16, 80).fill(0x8a5a2b).stroke({ width: 2, color: 0x4f2f18 });
  g.moveTo(0, -80).lineTo(-22, -122).moveTo(0, -80).lineTo(22, -122).stroke({ width: 14, color: 0x8a5a2b, cap: 'round' });
  g.rect(-30, -4, 60, 8).fill(0x4f2f18);
  view.addChild(g);
  return view;
}

export function drawTrapdoor(): { view: Container; closed: Graphics; open: Graphics } {
  const view = new Container();
  const closed = new Graphics().ellipse(0, 14, 70, 16).fill(0x7d6049).stroke({ width: 3, color: 0x4f3a2a });
  closed.moveTo(-40, 4).lineTo(-40, 26).moveTo(0, -2).lineTo(0, 30).moveTo(40, 4).lineTo(40, 26).stroke({ width: 2, color: 0x4f3a2a });
  const open = new Graphics().ellipse(0, 14, 70, 16).fill(0x0c0c0c).stroke({ width: 3, color: 0x4f3a2a });
  view.addChild(closed, open);
  return { view, closed, open };
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
  const g = new Graphics().rect(-900, -700, 1800, 1400).fill(0x1a0b2e);
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
