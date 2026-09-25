/** Wendell (lignes fines, fragile), COO le pigeon (rond, chaos) et les mains du joueur. Placeholders. */
import { Container, Graphics, Text } from 'pixi.js';
import { CHARACTER_ANIMS } from '../../content/office';
import type { CharacterAnimator } from '../../presentation/characterAnimator';
import { C } from './palette';

const sin = Math.sin;

function part(draw: (g: Graphics) => void): Graphics {
  const g = new Graphics();
  draw(g);
  return g;
}

export class WendellAnimator implements CharacterAnimator<Container> {
  readonly id = 'wendell';
  readonly view = new Container();
  readonly animations = CHARACTER_ANIMS.wendell;
  private readonly inner = new Container();
  private readonly legL = new Container();
  private readonly legR = new Container();
  private readonly armL = new Container();
  private readonly armR = new Container();
  private readonly folders: Graphics;
  private readonly thumb: Graphics;
  private readonly head = new Container();
  private readonly smile: Graphics;
  private readonly worried: Graphics;

  constructor() {
    this.view.addChild(this.inner);
    for (const [leg, x] of [[this.legL, -7], [this.legR, 7]] as const) {
      leg.position.set(x, -64);
      leg.addChild(part((g) => g.rect(-2.5, 0, 5, 62).fill(C.ink).roundRect(-6, 60, 14, 5, 2).fill(C.shoe)));
    }
    const body = part((g) => {
      g.roundRect(-17, -138, 34, 76, 8).fill(C.wendellShirt).stroke({ width: 2, color: C.ink });
      g.moveTo(0, -136).lineTo(-8, -96).moveTo(0, -136).lineTo(8, -96).stroke({ width: 2, color: 0x1e90ff });
      g.roundRect(-20, -98, 40, 26, 3).fill(C.white).stroke({ width: 2, color: 0x1e90ff });
    });
    const badge = new Text({ text: 'INTERN', style: { fontFamily: 'Arial', fontWeight: '900', fontSize: 11, fill: 0x1e90ff } });
    badge.anchor.set(0.5);
    badge.position.set(0, -85);
    for (const [arm, x] of [[this.armL, -17], [this.armR, 17]] as const) {
      arm.position.set(x, -130);
      arm.addChild(part((g) => g.rect(-2.5, 0, 5, 56).fill(C.ink).circle(0, 58, 5).fill(C.skin)));
    }
    this.thumb = part((g) => g.roundRect(-4, 50, 8, 14, 3).fill(C.skin).stroke({ width: 1.5, color: C.ink }));
    this.thumb.position.set(0, -2);
    this.armR.addChild(this.thumb);
    this.folders = part((g) => {
      for (let i = 0; i < 4; i++) g.rect(-24, -8 - i * 7, 48, 7).fill(i % 2 ? 0xf2e3b3 : 0xe8d49a).stroke({ width: 1, color: 0xa8905a });
    });
    this.folders.position.set(0, -80);
    this.head.position.set(0, -160);
    this.smile = part((g) => g.moveTo(-7, 8).quadraticCurveTo(0, 14, 7, 8).stroke({ width: 2, color: C.ink }));
    this.worried = part((g) => g.moveTo(-6, 11).quadraticCurveTo(0, 6, 6, 11).stroke({ width: 2, color: C.ink }));
    this.head.addChild(
      part((g) => {
        g.circle(0, 0, 21).fill(C.skin).stroke({ width: 2, color: C.skinShade });
        g.poly([-20, -6, -10, -24, 4, -20, 18, -26, 20, -6]).fill(C.wendellHair);
        g.circle(-8, -1, 7).fill({ color: C.white, alpha: 0.5 }).stroke({ width: 3, color: C.ink });
        g.circle(8, -1, 7).fill({ color: C.white, alpha: 0.5 }).stroke({ width: 3, color: C.ink });
        g.moveTo(-1, -1).lineTo(1, -1).stroke({ width: 3, color: C.ink });
        g.circle(-8, -1, 2).fill(C.ink).circle(8, -1, 2).fill(C.ink);
      }),
      this.smile,
      this.worried,
    );
    this.inner.addChild(this.legL, this.legR, body, badge, this.armL, this.armR, this.folders, this.head);
  }

  pose(anim: string, elapsedMs: number): void {
    const e = Math.max(0, elapsedMs);
    let legs = 0;
    let armL = 0.15;
    let armR = 0.15;
    let bob = sin(e / 600) * 1.2;
    let lean = 0;
    let headDy = 0;
    let happy = false;
    let folders = true;
    let thumb = false;
    switch (anim) {
      case 'walk':
        legs = sin(e / 110) * 0.45; bob = Math.abs(sin(e / 110)) * -3; armL = armR = 0.9; break;
      case 'run':
        legs = sin(e / 60) * 0.8; bob = Math.abs(sin(e / 60)) * -5; lean = 0.15; armL = armR = 0.9; break;
      case 'cheer':
        armL = 2.8 + sin(e / 90) * 0.2; armR = 2.8 - sin(e / 90) * 0.2; bob = -Math.abs(sin(e / 150)) * 18; happy = true; folders = false; break;
      case 'peek':
        lean = 0.35; headDy = 6; armL = armR = 0.6; break;
      case 'thumbsup':
        armR = 2.3; happy = true; thumb = true; break;
      case 'stuck':
        // Collé au plafond, bras et jambes écartés, qui gigote un peu.
        armL = 2.4 + sin(e / 200) * 0.1; armR = 2.4 - sin(e / 200) * 0.1; legs = 0.55; bob = 0; folders = false; break;
      case 'pull':
        lean = -0.28; armL = armR = 1.5 + sin(e / 60) * 0.1; legs = 0.35; folders = false; bob = sin(e / 50) * 1.5; break;
      case 'hit':
        lean = 0.5; armL = armR = 2.6; folders = false; break;
      case 'shrug':
        armL = armR = 1.2; bob = -Math.abs(sin(e / 300)) * 4; folders = false; break;
      case 'fall':
        armL = armR = 2.8; lean = -0.2; legs = sin(e / 50) * 0.5; folders = false; break;
      default:
        armL = armR = 0.9;
    }
    this.inner.position.set(0, bob);
    this.inner.rotation = lean;
    this.legL.rotation = legs;
    this.legR.rotation = -legs;
    this.armL.rotation = armL;
    this.armR.rotation = -armR;
    this.head.y = -160 + headDy;
    this.smile.visible = happy;
    this.worried.visible = !happy;
    this.folders.visible = folders && !thumb;
    this.thumb.visible = thumb;
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }
}

export class CooAnimator implements CharacterAnimator<Container> {
  readonly id = 'coo';
  readonly view = new Container();
  readonly animations = CHARACTER_ANIMS.coo;
  private readonly inner = new Container();
  private readonly wingL: Graphics;
  private readonly wingR: Graphics;
  private readonly head = new Container();

  constructor() {
    this.view.addChild(this.inner);
    const legs = part((g) => g.moveTo(-6, -8).lineTo(-6, 0).moveTo(6, -8).lineTo(6, 0).stroke({ width: 2.5, color: C.orange }));
    const body = part((g) => {
      g.ellipse(0, -26, 24, 20).fill(C.pigeon).stroke({ width: 2, color: C.pigeonDark });
      g.poly([-3, -24, 3, -24, 5, -10, 0, -6, -5, -10]).fill(C.yellow);
    });
    this.wingL = part((g) => g.ellipse(-12, 0, 13, 7).fill(C.pigeonDark));
    this.wingR = part((g) => g.ellipse(12, 0, 13, 7).fill(C.pigeonDark));
    this.wingL.position.set(-16, -30);
    this.wingR.position.set(16, -30);
    this.head.position.set(8, -50);
    this.head.addChild(part((g) => {
      g.circle(0, 0, 13).fill(C.pigeon).stroke({ width: 2, color: C.pigeonDark });
      g.poly([11, -2, 22, 2, 11, 5]).fill(C.orange);
      g.circle(-3, -3, 6).fill(C.white).circle(-3, -3, 2.5).fill(C.ink);
      g.circle(6, -4, 3).fill(C.white).circle(6, -4, 1.4).fill(C.ink);
    }));
    this.inner.addChild(legs, body, this.wingL, this.wingR, this.head);
  }

  pose(anim: string, elapsedMs: number): void {
    const e = Math.max(0, elapsedMs);
    let flap = 0;
    let bob = 0;
    let peck = 0;
    let spin = 0;
    let salute = false;
    let clap = false;
    switch (anim) {
      case 'fly':
        flap = sin(e / 35) * 1.1; bob = sin(e / 70) * 4; break;
      case 'salute':
        salute = true; bob = -2; break;
      case 'crash':
        flap = sin(e / 20) * 1.4; spin = e / 90; break;
      case 'applaud':
        clap = true; flap = Math.abs(sin(e / 70)); bob = -Math.abs(sin(e / 140)) * 3; break;
      case 'carry':
        flap = sin(e / 25) * 1.3; bob = sin(e / 50) * 2; break;
      default:
        peck = (e % 2600) < 300 ? sin(((e % 2600) / 300) * Math.PI) * 0.5 : 0;
    }
    this.inner.y = bob;
    this.inner.rotation = spin;
    this.wingL.rotation = clap ? 1.2 * flap : -flap;
    this.wingR.rotation = salute ? -2.2 : clap ? -1.2 * flap : flap;
    this.wingR.position.set(16, salute ? -44 : -30);
    this.head.rotation = peck;
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }
}

/** Les mains du joueur : deux gants cartoon. */
export class HandsAnimator implements CharacterAnimator<Container> {
  readonly id = 'hands';
  readonly view = new Container();
  readonly animations = CHARACTER_ANIMS.hands;
  private readonly left = new Container();
  private readonly right = new Container();
  private readonly openL: Graphics;
  private readonly openR: Graphics;
  private readonly fistL: Graphics;
  private readonly fistR: Graphics;
  private readonly lighter: Graphics;
  private readonly flame: Graphics;

  constructor() {
    const glove = (open: boolean) =>
      part((g) => {
        g.roundRect(-14, 18, 28, 26, 6).fill(0xdddddd).stroke({ width: 2, color: C.ink });
        if (open) {
          for (const x of [-12, -4, 4, 12]) g.roundRect(x - 4, -22, 8, 24, 4).fill(C.white).stroke({ width: 2, color: C.ink });
          g.roundRect(-20, -4, 40, 26, 10).fill(C.white).stroke({ width: 2, color: C.ink });
        } else {
          g.roundRect(-20, -12, 40, 34, 12).fill(C.white).stroke({ width: 2, color: C.ink });
          for (const x of [-10, 0, 10]) g.moveTo(x, -12).lineTo(x, -2).stroke({ width: 2, color: C.ink });
        }
      });
    this.openL = glove(true);
    this.openR = glove(true);
    this.fistL = glove(false);
    this.fistR = glove(false);
    this.left.position.set(-34, 0);
    this.right.position.set(34, 0);
    this.left.addChild(this.openL, this.fistL);
    this.right.addChild(this.openR, this.fistR);
    this.lighter = part((g) => g.roundRect(-8, -40, 16, 30, 3).fill(C.red).stroke({ width: 2, color: C.ink }).rect(-6, -46, 12, 6).fill(C.metal));
    this.flame = part((g) => g.ellipse(0, -56, 6, 11).fill(C.orange).ellipse(0, -53, 3, 6).fill(C.yellow));
    this.right.addChild(this.lighter, this.flame);
    this.view.addChild(this.left, this.right);
  }

  pose(anim: string, elapsedMs: number): void {
    const e = Math.max(0, elapsedMs);
    const closed = anim === 'grab' || anim === 'strain' || anim === 'lighter';
    this.openL.visible = this.openR.visible = !closed;
    this.fistL.visible = this.fistR.visible = closed;
    this.lighter.visible = this.flame.visible = anim === 'lighter';
    this.left.visible = anim !== 'lighter';
    this.flame.scale.set(1, 1 + sin(e / 40) * 0.15);
    const shake = anim === 'strain' ? sin(e / 22) * 2.5 : 0;
    this.left.position.set(-34 + shake, anim === 'strain' ? 4 : 0);
    this.right.position.set(34 - shake, anim === 'strain' ? 4 : 0);
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }
}
