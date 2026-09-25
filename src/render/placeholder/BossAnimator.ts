/**
 * B.B. placeholder : formes simples (corps violet, mèche, mug jaune). Rig « à pièces » :
 * les pièces sont dessinées UNE fois, les poses ne font que les déplacer (comme le ferait Spine).
 */
import { Container, Graphics } from 'pixi.js';
import { CHARACTER_ANIMS } from '../../content/office';
import type { CharacterAnimator } from '../../presentation/characterAnimator';
import { C } from './palette';

type Eyes = 'open' | 'closed' | 'x' | 'spiral' | 'wide' | 'half';
type Mouth = 'flat' | 'grin' | 'o' | 'frown' | 'laugh' | 'teeth' | 'whistle';

interface Pose {
  bob: number;
  sx: number;
  sy: number;
  jitter: number;
  tilt: number;
  spin: number;
  armL: number;
  armR: number;
  legL: number;
  legR: number;
  headTilt: number;
  headDy: number;
  eyes: Eyes;
  px: number;
  py: number;
  mouth: Mouth;
  brow: number;
  flush: number;
  meche: number;
}

const BASE: Pose = {
  bob: 0, sx: 1, sy: 1, jitter: 0, tilt: 0, spin: 1, armL: 0.12, armR: 0.12, legL: 0, legR: 0,
  headTilt: 0, headDy: 0, eyes: 'open', px: 0, py: 0, mouth: 'flat', brow: 0.35, flush: 0, meche: 0,
};

const sin = Math.sin;
const loop = (e: number, period: number) => (e % period) / period;

/** Pose = fonction pure de (anim, elapsed). */
export function bossPose(anim: string, e: number): Pose {
  const p: Pose = { ...BASE, bob: sin(e / 520) * 1.6 };
  switch (anim) {
    case 'sip': {
      const k = loop(e, 2200);
      const up = k < 0.25 ? k / 0.25 : k < 0.6 ? 1 : k < 0.8 ? 1 - (k - 0.6) / 0.2 : 0;
      p.armR = -2.3 * up + 0.12 * (1 - up);
      p.eyes = up > 0.8 ? 'closed' : 'half';
      p.headTilt = -0.08 * up;
      p.mouth = up > 0.8 ? 'o' : 'flat';
      break;
    }
    case 'oblivious':
      p.eyes = 'closed'; p.mouth = 'whistle'; p.headTilt = sin(e / 300) * 0.08; p.brow = -0.1; p.armR = -2.3; break;
    case 'surprised':
      p.eyes = 'wide'; p.mouth = 'o'; p.armL = 2.2; p.armR = 2.2; p.brow = -0.4; p.meche = 1; p.sy = 1.06; break;
    case 'spin':
      p.spin = Math.cos(e / 45); p.eyes = 'wide'; p.mouth = 'o'; p.armL = 1.2; p.armR = 1.2; break;
    case 'dizzy':
      p.eyes = 'spiral'; p.headTilt = sin(e / 140) * 0.25; p.tilt = sin(e / 260) * 0.08; p.mouth = 'o'; p.armL = 0.6; p.armR = 0.6; break;
    case 'scared':
      p.eyes = 'wide'; p.mouth = 'o'; p.armL = 2.4 + sin(e / 50) * 0.5; p.armR = 2.4 + sin(e / 50 + 1) * 0.5;
      p.legL = sin(e / 40) * 0.5; p.legR = -sin(e / 40) * 0.5; p.meche = 1; p.brow = -0.5; break;
    case 'splat': {
      const k = Math.max(0, 1 - e / 320);
      p.sx = 1 + 0.35 * k; p.sy = 1 - 0.3 * k; p.eyes = 'x'; p.mouth = 'o'; p.armL = 1.6; p.armR = 1.6; break;
    }
    case 'ouch':
      p.eyes = 'closed'; p.mouth = 'frown'; p.jitter = e < 300 ? sin(e / 18) * 3 : 0; p.brow = 0.7; break;
    case 'laugh':
      p.eyes = 'closed'; p.mouth = 'laugh'; p.bob = Math.abs(sin(e / 70)) * -6; p.armL = 0.5; p.armR = 0.9 + sin(e / 70) * 0.3; p.headTilt = -0.12; break;
    case 'smug':
      p.eyes = 'half'; p.mouth = 'grin'; p.brow = -0.3; p.headTilt = -0.1; p.armR = -2.3; break;
    case 'flex':
      p.eyes = 'half'; p.mouth = 'grin'; p.armL = 2.6 + sin(e / 120) * 0.15; p.armR = 2.6 - sin(e / 120) * 0.15; p.sx = 1.05; break;
    case 'sulk':
      p.eyes = 'half'; p.mouth = 'frown'; p.headDy = 6; p.headTilt = 0.12; p.armL = -0.3; p.armR = -0.3; p.brow = 0.8; break;
    case 'dazed':
      p.eyes = 'spiral'; p.mouth = 'o'; p.headTilt = sin(e / 180) * 0.2; p.tilt = sin(e / 350) * 0.06; p.armL = 0.3; p.armR = 0.3; break;
    case 'tapfoot':
      p.eyes = 'half'; p.mouth = 'frown'; p.px = 3; p.legR = loop(e, 420) < 0.5 ? -0.25 : 0; p.armL = -0.35; p.armR = -0.35; p.brow = 0.7; break;
    case 'hover':
      p.legL = sin(e / 45) * 0.9; p.legR = -sin(e / 45) * 0.9; p.armL = 1.2; p.armR = 1.2; p.eyes = 'open'; break;
    case 'lookdown':
      p.headDy = 5; p.py = 5; p.eyes = 'open'; p.legL = 0.2; p.legR = -0.2; p.armL = 0.8; p.armR = 0.8; break;
    case 'lookcam':
      p.eyes = 'wide'; p.px = 0; p.py = 0; p.mouth = 'flat'; p.brow = -0.5; p.armL = 0.9; p.armR = 0.9; p.legL = 0.2; p.legR = -0.2; break;
    case 'tiptoe': {
      const k = sin(e / 90);
      p.legL = k * 0.45; p.legR = -k * 0.45; p.eyes = 'open'; p.px = 4; p.mouth = 'o'; p.armL = 1.0; p.armR = 1.0; p.bob = Math.abs(k) * -3; break;
    }
    case 'wave':
      p.armR = 2.7 + sin(e / 90) * 0.35; p.eyes = 'half'; p.mouth = 'frown'; p.brow = -0.2; break;
    case 'fall':
      p.armL = 2.8; p.armR = 2.8; p.eyes = 'wide'; p.mouth = 'o'; p.sy = 1.12; p.sx = 0.92; p.meche = 1; break;
    case 'furious':
      p.eyes = 'open'; p.mouth = 'teeth'; p.brow = 1; p.flush = 0.8; p.jitter = sin(e / 16) * 2; p.meche = 1; p.armL = 0.5; p.armR = 0.5; break;
    case 'sniff':
      p.eyes = 'closed'; p.headTilt = -0.15; p.mouth = 'flat'; p.headDy = -3; p.armR = -2.3; break;
    case 'drink':
      p.armR = -2.45; p.headTilt = -0.3; p.eyes = 'closed'; p.mouth = 'o'; p.flush = 0.5; break;
    case 'grow':
      p.jitter = sin(e / 14) * 3; p.eyes = 'wide'; p.mouth = 'teeth'; p.brow = 1; p.flush = 1; p.meche = 1; p.armL = 1.8; p.armR = 1.8; break;
    case 'giant-idle':
      p.eyes = 'open'; p.mouth = 'grin'; p.brow = 0.9; p.bob = sin(e / 400) * 4; p.meche = 1; p.armL = 0.6; p.armR = 0.6; break;
    case 'giant-wind':
      p.eyes = 'open'; p.mouth = 'teeth'; p.brow = 1; p.armR = 2.9; p.armL = 0.4; p.tilt = -0.05; p.meche = 1; break;
    case 'giant-hurt':
      p.eyes = 'x'; p.mouth = 'o'; p.tilt = 0.12 * Math.max(0, 1 - e / 400); p.jitter = e < 250 ? sin(e / 15) * 4 : 0; p.armL = 1.4; p.armR = 1.4; break;
    case 'giant-swat': {
      const k = Math.min(1, e / 180);
      p.armR = 2.9 - k * 3.6; p.eyes = 'half'; p.mouth = 'grin'; p.brow = 0.9; p.tilt = 0.06 * k; p.meche = 1; break;
    }
    case 'giant-laugh':
      p.eyes = 'closed'; p.mouth = 'laugh'; p.bob = Math.abs(sin(e / 90)) * -8; p.armL = 0.7; p.armR = 0.7; p.meche = 1; break;
    case 'giant-ko':
      p.eyes = 'x'; p.mouth = 'o'; p.armL = 2.2; p.armR = 2.2; p.legL = 0.4; p.legR = -0.4; break;
    case 'away':
      p.eyes = 'wide'; p.mouth = 'o'; p.armL = 2.4 + sin(e / 40) * 0.6; p.armR = 2.4 - sin(e / 40) * 0.6; p.legL = sin(e / 50); p.legR = -sin(e / 50); break;
    default:
      break;
  }
  return p;
}

function part(draw: (g: Graphics) => void): Graphics {
  const g = new Graphics();
  draw(g);
  return g;
}

export class BossAnimator implements CharacterAnimator<Container> {
  readonly id = 'boss';
  readonly view = new Container();
  readonly animations = CHARACTER_ANIMS.boss;
  private readonly inner = new Container();
  private readonly chair: Graphics;
  private readonly rocket: Graphics;
  private readonly legL = new Container();
  private readonly legR = new Container();
  private readonly armL = new Container();
  private readonly armR = new Container();
  private readonly mug: Graphics;
  private readonly mugGold: Graphics;
  private readonly head = new Container();
  private readonly flush: Graphics;
  private readonly soot: Graphics;
  private readonly meche = new Container();
  private readonly browL: Graphics;
  private readonly browR: Graphics;
  private readonly eyes: Record<Eyes, Container> = {} as Record<Eyes, Container>;
  private readonly pupils: { g: Graphics; x: number }[] = [];
  private readonly mouths: Record<Mouth, Graphics> = {} as Record<Mouth, Graphics>;

  constructor() {
    this.view.addChild(this.inner);
    this.chair = part((g) => {
      g.roundRect(-52, -178, 104, 104, 16).fill(C.chair).stroke({ width: 3, color: C.chairDark });
      g.roundRect(-60, -48, 120, 18, 8).fill(C.chair);
      g.rect(-5, -30, 10, 24).fill(C.metal);
      g.rect(-46, -9, 92, 7).fill(C.chairDark);
      for (const x of [-44, 0, 44]) g.circle(x, -2, 5).fill(C.shoe);
    });
    this.rocket = part((g) => {
      g.roundRect(-80, -30, 150, 30, 12).fill(0xb8c0c8).stroke({ width: 3, color: 0x6c757d });
      g.poly([70, -30, 104, -15, 70, 0]).fill(C.red);
      g.poly([-80, -30, -100, -44, -66, -30]).fill(C.red);
      g.poly([-80, 0, -100, 12, -66, 0]).fill(C.red);
      g.rect(-40, -24, 40, 18).fill(C.yellow);
    });
    this.rocket.visible = false;

    for (const [leg, x] of [[this.legL, -16], [this.legR, 16]] as const) {
      leg.position.set(x, -34);
      leg.addChild(part((g) => {
        g.roundRect(-8, 0, 16, 30, 4).fill(C.trousers);
        g.ellipse(x < 0 ? -4 : 4, 32, 13, 6).fill(C.shoe);
      }));
    }
    const body = part((g) => {
      g.roundRect(-50, -132, 100, 104, 26).fill(C.violet).stroke({ width: 3, color: C.violetDark });
      g.poly([-14, -132, 0, -110, 14, -132]).fill(C.white);
      g.poly([-5, -122, 5, -122, 7, -84, 0, -76, -7, -84]).fill(C.yellow);
    });
    for (const [arm, x] of [[this.armL, -46], [this.armR, 46]] as const) {
      arm.position.set(x, -120);
      arm.addChild(part((g) => {
        g.roundRect(-10, -4, 20, 62, 9).fill(C.violet).stroke({ width: 2, color: C.violetDark });
        g.circle(0, 60, 9).fill(C.skin);
      }));
    }
    this.mug = part((g) => {
      g.rect(-11, -13, 22, 26).fill(C.yellow).stroke({ width: 2, color: 0xb38600 });
      g.roundRect(10, -7, 8, 12, 4).stroke({ width: 3, color: C.yellow });
    });
    this.mugGold = part((g) => {
      g.circle(0, 0, 26).fill({ color: C.gold, alpha: 0.25 });
      g.rect(-12, -14, 24, 28).fill(C.gold).stroke({ width: 3, color: 0xfff3a0 });
      g.roundRect(11, -7, 8, 12, 4).stroke({ width: 3, color: C.gold });
    });
    for (const m of [this.mug, this.mugGold]) {
      m.position.set(0, 66);
      this.armR.addChild(m);
    }

    this.head.position.set(0, -170);
    const face = part((g) => {
      g.circle(-38, 4, 9).fill(C.skinShade);
      g.circle(38, 4, 9).fill(C.skinShade);
      g.circle(0, 0, 38).fill(C.skin).stroke({ width: 3, color: C.skinShade });
    });
    this.flush = part((g) => g.circle(0, 0, 37).fill(0xff3b3b));
    this.soot = part((g) => {
      g.circle(0, 0, 37).fill({ color: 0x222222, alpha: 0.75 });
      g.circle(-14, -4, 9).fill({ color: 0xffffff, alpha: 0.15 });
    });
    this.meche.position.set(0, -34);
    this.meche.addChild(part((g) => {
      g.poly([-18, 6, -4, -22, 6, -6, 20, -30, 14, 6]).fill(C.violetDark);
    }));
    this.browL = part((g) => g.roundRect(-11, -3, 22, 6, 3).fill(C.violetDark));
    this.browR = part((g) => g.roundRect(-11, -3, 22, 6, 3).fill(C.violetDark));
    this.browL.position.set(-14, -18);
    this.browR.position.set(14, -18);
    this.head.addChild(face, this.flush, this.soot, this.meche, this.browL, this.browR);

    const eyePair = (draw: (g: Graphics, x: number, c: Container) => void) => {
      const c = new Container();
      for (const x of [-14, 14]) {
        const g = new Graphics();
        c.addChild(g);
        draw(g, x, c);
      }
      this.head.addChild(c);
      return c;
    };
    this.eyes.open = eyePair((g, x, c) => {
      g.circle(x, -4, 8).fill(C.white).stroke({ width: 2, color: C.ink });
      const pupil = part((p) => p.circle(x, -4, 3.5).fill(C.ink));
      this.pupils.push({ g: pupil, x });
      c.addChild(pupil);
    });
    this.eyes.wide = eyePair((g, x) => {
      g.circle(x, -5, 11).fill(C.white).stroke({ width: 2, color: C.ink });
      g.circle(x, -5, 2.5).fill(C.ink);
    });
    this.eyes.half = eyePair((g, x) => {
      g.circle(x, -4, 8).fill(C.white).stroke({ width: 2, color: C.ink });
      g.rect(x - 9, -13, 18, 9).fill(C.skin);
      g.moveTo(x - 9, -4).lineTo(x + 9, -4).stroke({ width: 2, color: C.ink });
      g.circle(x, -1, 3).fill(C.ink);
    });
    this.eyes.closed = eyePair((g, x) => {
      g.moveTo(x - 8, -4).quadraticCurveTo(x, 2, x + 8, -4).stroke({ width: 3, color: C.ink });
    });
    this.eyes.x = eyePair((g, x) => {
      g.moveTo(x - 6, -10).lineTo(x + 6, 2).moveTo(x + 6, -10).lineTo(x - 6, 2).stroke({ width: 3, color: C.ink });
    });
    this.eyes.spiral = eyePair((g, x) => {
      g.circle(x, -4, 8).fill(C.white).stroke({ width: 2, color: C.ink });
      g.arc(x, -4, 5, 0, Math.PI * 1.5).stroke({ width: 2, color: C.ink });
      g.arc(x, -4, 2, Math.PI, Math.PI * 2.5).stroke({ width: 2, color: C.ink });
    });

    const mouth = (draw: (g: Graphics) => void) => {
      const g = part(draw);
      g.position.set(0, 16);
      this.head.addChild(g);
      return g;
    };
    this.mouths.flat = mouth((g) => g.moveTo(-10, 0).lineTo(10, 0).stroke({ width: 3, color: C.ink }));
    this.mouths.grin = mouth((g) => g.moveTo(-14, -3).quadraticCurveTo(0, 10, 14, -3).stroke({ width: 3, color: C.ink }));
    this.mouths.frown = mouth((g) => g.moveTo(-12, 4).quadraticCurveTo(0, -6, 12, 4).stroke({ width: 3, color: C.ink }));
    this.mouths.o = mouth((g) => g.ellipse(0, 1, 6, 8).fill(0x5a1a1a).stroke({ width: 2, color: C.ink }));
    this.mouths.whistle = mouth((g) => g.circle(4, 0, 4).fill(0x5a1a1a));
    this.mouths.laugh = mouth((g) => {
      g.moveTo(-16, -4).quadraticCurveTo(0, 20, 16, -4).closePath().fill(0x5a1a1a).stroke({ width: 2, color: C.ink });
      g.rect(-10, -4, 20, 4).fill(C.white);
    });
    this.mouths.teeth = mouth((g) => {
      g.roundRect(-14, -6, 28, 12, 4).fill(C.white).stroke({ width: 2, color: C.ink });
      g.moveTo(-14, 0).lineTo(14, 0).stroke({ width: 1.5, color: C.ink });
      for (const x of [-7, 0, 7]) g.moveTo(x, -6).lineTo(x, 6).stroke({ width: 1.5, color: C.ink });
    });

    // Bras droit (mug) au premier plan : le mug passe devant la bouche quand il boit.
    this.inner.addChild(this.chair, this.legL, this.legR, this.rocket, body, this.armL, this.head, this.armR);
  }

  pose(anim: string, elapsedMs: number, states: Readonly<Record<string, string>>): void {
    const p = bossPose(anim, Math.max(0, elapsedMs));
    const seat = states.seat ?? 'none';
    this.chair.visible = seat === 'chair' || seat === 'rocket';
    this.rocket.visible = seat === 'rocket';
    const gold = states.mug === 'gold';
    this.mug.visible = !gold;
    this.mugGold.visible = gold;
    this.soot.visible = states.face === 'soot';

    this.inner.position.set(p.jitter, p.bob);
    this.inner.scale.set(p.sx * p.spin, p.sy);
    this.inner.rotation = p.tilt;
    this.armL.rotation = p.armL;
    this.armR.rotation = -p.armR;
    this.mug.rotation = p.armR;
    this.mugGold.rotation = p.armR;
    this.legL.rotation = p.legL;
    this.legR.rotation = p.legR;
    this.head.position.set(0, -170 + p.headDy);
    this.head.rotation = p.headTilt;
    this.browL.rotation = p.brow * 0.5;
    this.browR.rotation = -p.brow * 0.5;
    this.browL.y = this.browR.y = -18 - Math.max(0, -p.brow) * 6;
    this.flush.alpha = p.flush;
    this.flush.visible = p.flush > 0;
    this.meche.scale.set(1, 1 + p.meche * 0.5);
    for (const [name, c] of Object.entries(this.eyes)) c.visible = name === p.eyes;
    for (const pupil of this.pupils) pupil.g.position.set(p.px, p.py);
    for (const [name, g] of Object.entries(this.mouths)) g.visible = name === p.mouth;
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }
}
