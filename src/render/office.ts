/** Décor fixe du bureau (formes simples) et accessoires animables. */
import { Container, Graphics, Text } from 'pixi.js';
import { C } from './placeholder/palette';

export function drawBackground(): Container {
  const c = new Container();
  const g = new Graphics();
  // Mur (débordant, pour les zooms arrière et les secousses).
  g.rect(-800, -300, 2600, 860).fill(C.wall);
  for (let x = -800; x < 1800; x += 60) g.rect(x, -300, 2, 860).fill({ color: C.wallShade, alpha: 0.6 });
  g.rect(-800, 540, 2600, 20).fill(0xcbbd9c);
  // Sol (arrière).
  g.rect(-800, 560, 2600, 500).fill(C.floor);
  for (let x = -800; x < 1800; x += 80) g.moveTo(x, 560).lineTo(x - 60, 1060).stroke({ width: 2, color: C.floorDark, alpha: 0.5 });
  // Tableau de liège.
  g.roundRect(380, 90, 110, 80, 4).fill(0xc08a4a).stroke({ width: 4, color: 0x7a5230 });
  g.rect(392, 100, 30, 22).fill(C.white).rect(430, 104, 26, 30).fill(0xfff5c0).rect(462, 98, 20, 20).fill(0xffd1dc);
  g.moveTo(398, 150).lineTo(420, 136).lineTo(440, 146).lineTo(476, 124).stroke({ width: 3, color: C.red });
  // Suspensions (profondeur verticale, surtout visibles en portrait).
  for (const x of [300, 830]) {
    g.moveTo(x, -300).lineTo(x, 8).stroke({ width: 2, color: 0x6d6352 });
    g.poly([x - 28, 34, x - 12, 8, x + 12, 8, x + 28, 34]).fill(0x3b3f4a);
    g.ellipse(x, 34, 28, 5).fill({ color: 0xfff2b0, alpha: 0.9 });
    g.poly([x - 28, 36, x + 28, 36, x + 110, 540, x - 110, 540]).fill({ color: 0xfff6d0, alpha: 0.06 });
  }
  // Bureau du boss.
  g.rect(560, 452, 340, 108).fill(C.desk).stroke({ width: 3, color: 0x4f2f18 });
  g.rect(548, 436, 364, 20).fill(C.deskTop).stroke({ width: 3, color: 0x4f2f18 });
  g.rect(760, 470, 120, 70).fill(0x6b3f22);
  g.rect(810, 500, 20, 6).fill(C.gold);
  c.addChild(g);
  const plate = new Text({ text: 'B.B. · CEO', style: { fontFamily: 'Arial', fontWeight: '900', fontSize: 14, fill: C.gold, letterSpacing: 1 } });
  plate.anchor.set(0.5);
  plate.position.set(820, 482);
  c.addChild(plate);
  return c;
}

/** Plafond (au premier plan, pour que le boss puisse s'y encastrer). */
export function drawCeilingStrip(): Graphics {
  return new Graphics().rect(-800, -300, 2600, 360).fill(0xf4efe3).rect(-800, 54, 2600, 6).fill(0xd7ccb4);
}

/**
 * Premier plan : le bureau du joueur (vue subjective). Hors cadre en paysage ; en portrait il remplit
 * le bas de l'écran et donne la profondeur. Les mains du joueur surgissent de derrière.
 */
export function drawPlayerDesk(): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(-800, 722, 2600, 400).fill(0x4a3526);
  g.rect(-800, 712, 2600, 14).fill(0x6b4a32);
  g.rect(-800, 726, 2600, 4).fill({ color: 0x000000, alpha: 0.25 });
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
  const g = new Graphics().rect(-800, 578, 2600, 500).fill(C.floor);
  for (let x = -800; x < 1800; x += 80) g.moveTo(x + 2, 578).lineTo(x - 56, 1060).stroke({ width: 2, color: C.floorDark, alpha: 0.5 });
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

export function drawTrapdoor(): { view: Container; closed: Graphics; open: Graphics; jammed: Graphics } {
  const view = new Container();
  const closed = new Graphics().ellipse(0, 14, 70, 16).fill(0x7d6049).stroke({ width: 3, color: 0x4f3a2a });
  closed.moveTo(-40, 4).lineTo(-40, 26).moveTo(0, -2).lineTo(0, 30).moveTo(40, 4).lineTo(40, 26).stroke({ width: 2, color: 0x4f3a2a });
  const open = new Graphics().ellipse(0, 14, 70, 16).fill(0x0c0c0c).stroke({ width: 3, color: 0x4f3a2a });
  const jammed = new Graphics().moveTo(-30, 6).lineTo(-6, 18).lineTo(10, 8).lineTo(34, 22).stroke({ width: 3, color: 0x2a1c12 });
  view.addChild(closed, open, jammed);
  return { view, closed, open, jammed };
}

/** Ascenseur (fond) : cadre, cabine sombre, voyant d'étage. Les portes sont des acteurs séparés, au premier plan. */
export function drawElevator(): { view: Container; lamp: Graphics; dent: Graphics } {
  const view = new Container();
  const g = new Graphics();
  g.rect(-62, -200, 124, 200).fill(0x9aa3ad).stroke({ width: 4, color: 0x5c6773 });
  g.rect(-55, -190, 110, 190).fill(0x2b2f3a);
  g.rect(-55, -190, 110, 10).fill(0x3a3f4b);
  g.roundRect(-22, -232, 44, 22, 5).fill(0x1b1f3b).stroke({ width: 2, color: 0x5c6773});
  g.circle(78, -110, 6).fill(0xdfe3f5).stroke({ width: 2, color: 0x5c6773 });
  const lamp = new Graphics().poly([-8, -216, 0, -226, 8, -216]).fill(0xffc400);
  const dent = new Graphics().poly([-62, -150, -40, -120, -62, -90]).fill(0x5c6773).circle(40, -140, 10).fill(0x5c6773);
  view.addChild(g, lamp, dent);
  return { view, lamp, dent };
}

/** Un panneau de porte d'ascenseur ; pivot sur le bord extérieur (side = 1 : gauche, −1 : droite). */
export function drawElevatorDoor(side: 1 | -1): Graphics {
  const w = 55 * side;
  return new Graphics().rect(Math.min(0, w), -190, Math.abs(w), 190).fill(0xc2c9d1).stroke({ width: 2, color: 0x8a939d })
    .rect(Math.min(0, w) + (side === 1 ? 44 : 4), -120, 6, 40).fill(0x8a939d);
}

export function drawMonitor(): { view: Container; normal: Graphics; broken: Graphics } {
  const view = new Container();
  const base = new Graphics().rect(-8, -14, 16, 14).fill(0x3a3f4b).rect(-26, -4, 52, 5).fill(0x3a3f4b);
  const normal = new Graphics().roundRect(-48, -78, 96, 64, 5).fill(0x1b1f3b).stroke({ width: 3, color: 0x3a3f4b });
  normal.moveTo(-36, -30).lineTo(-18, -42).lineTo(0, -36).lineTo(20, -60).lineTo(36, -64).stroke({ width: 3, color: 0x31d67b });
  const broken = new Graphics().roundRect(-48, -78, 96, 64, 5).fill(0x111111).stroke({ width: 3, color: 0x3a3f4b });
  broken.moveTo(-10, -70).lineTo(4, -48).lineTo(-12, -34).moveTo(4, -48).lineTo(30, -40).moveTo(4, -48).lineTo(16, -74).stroke({ width: 2, color: 0xdfe3f5 });
  view.addChild(base, normal, broken);
  return { view, normal, broken };
}

/** Ventilateur de plafond : les pales tournent (angle = fonction du temps de l'acteur). */
export function drawFan(): { view: Container; blades: Container; droop: Graphics } {
  const view = new Container();
  const stem = new Graphics().rect(-3, 0, 6, 30).fill(0x6d6352).circle(0, 34, 10).fill(0x3b3f4a);
  const blades = new Container();
  blades.position.set(0, 34);
  const g = new Graphics();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    g.poly([c * 10 - s * 7, s * 10 * 0.3 + c * 7 * 0.3, c * 78 - s * 13, s * 78 * 0.3 + c * 13 * 0.3, c * 78 + s * 13, s * 78 * 0.3 - c * 13 * 0.3, c * 10 + s * 7, s * 10 * 0.3 - c * 7 * 0.3])
      .fill(0x2f3441).stroke({ width: 2, color: 0x151821 });
  }
  blades.addChild(g);
  const droop = new Graphics().poly([0, 34, -60, 70, -52, 78, 0, 40]).fill(0x2f3441).poly([0, 34, 50, 82, 42, 88, 0, 40]).fill(0x2f3441);
  view.addChild(stem, blades, droop);
  return { view, blades, droop };
}

export function drawPlant(): Container {
  const view = new Container();
  const g = new Graphics().roundRect(-22, -60, 44, 60, 6).fill(0xb5542c);
  for (const [dx, h] of [[-14, 60], [0, 80], [14, 64]] as const) g.ellipse(dx, -60 - h / 2, 10, h / 2).fill(0x3c9a4b);
  view.addChild(g);
  return view;
}

export function drawExtinguisher(): { view: Container; nozzle: Graphics } {
  const view = new Container();
  const g = new Graphics().rect(-4, -70, 8, 10).fill(0x333333).roundRect(-12, -62, 24, 58, 8).fill(0xd62828).stroke({ width: 2, color: 0x8a1c24 });
  g.rect(-12, -36, 24, 10).fill(0xffffff);
  const nozzle = new Graphics().moveTo(4, -64).quadraticCurveTo(26, -70, 30, -40).stroke({ width: 4, color: 0x333333 }).circle(30, -38, 5).fill(0xffffff);
  view.addChild(g, nozzle);
  return { view, nozzle };
}

/** Chaise (ou chaise-fusée) qui part sans B.B. */
export function drawChairProp(): { view: Container; chair: Graphics; rocket: Graphics } {
  const view = new Container();
  const chair = new Graphics();
  chair.roundRect(-52, -178, 104, 104, 16).fill(C.chair).stroke({ width: 3, color: C.chairDark });
  chair.roundRect(-60, -48, 120, 18, 8).fill(C.chair).rect(-5, -30, 10, 24).fill(C.metal).rect(-46, -9, 92, 7).fill(C.chairDark);
  const rocket = new Graphics();
  rocket.roundRect(-80, -30, 150, 30, 12).fill(0xb8c0c8).stroke({ width: 3, color: 0x6c757d }).poly([70, -30, 104, -15, 70, 0]).fill(C.red);
  rocket.poly([-80, -30, -100, -44, -66, -30]).fill(C.red).poly([-80, 0, -100, 12, -66, 0]).fill(C.red).rect(-40, -24, 40, 18).fill(C.yellow);
  rocket.ellipse(-96, -15, 16, 8).fill(C.orange);
  view.addChild(chair, rocket);
  return { view, chair, rocket };
}

/** Fumée plein écran (masque la scène pendant les échanges de position). */
export function drawFog(): Container {
  const view = new Container();
  const g = new Graphics().rect(-1400, -700, 2800, 1400).fill(0xd9d9d9);
  for (let i = 0; i < 14; i++) g.circle(-450 + i * 70, -120 + ((i * 53) % 5) * 60, 90 + ((i * 37) % 4) * 20).fill(0xeeeeee);
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
