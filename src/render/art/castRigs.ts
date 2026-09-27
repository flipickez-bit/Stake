/**
 * Rigs de Wendell, du COO et des mains du joueur (Phase 0.6). Mêmes animations que les placeholders.
 * Wendell réagit vite et reste en retrait ; le COO est minuscule ; les mains viennent de la caméra.
 */
import { Container, Sprite } from 'pixi.js';
import { CHARACTER_ANIMS } from '../../content/office';
import type { CharacterAnimator, PoseContext } from '../../presentation/characterAnimator';
import type { ArtKit } from './kit';

const sin = Math.sin;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface Arm {
  side: 1 | -1;
  root: Container;
  elbow: Container;
  hand: Sprite;
}

export class WendellRig implements CharacterAnimator<Container> {
  readonly id = 'wendell';
  readonly view = new Container();
  readonly animations = CHARACTER_ANIMS.wendell;
  private readonly inner = new Container();
  private readonly legL: Sprite;
  private readonly legR: Sprite;
  private readonly upper = new Container();
  private readonly head = new Container();
  private readonly armL: Arm;
  private readonly armR: Arm;
  private readonly folders: Sprite;
  private readonly eyeL: Sprite;
  private readonly eyeR: Sprite;
  private readonly browL: Sprite;
  private readonly browR: Sprite;
  private readonly mouth: Sprite;
  private readonly helmet: Sprite;
  /** UNHINGED : casque de chantier (habillage du monde, rendu seulement). */
  helmetOn = false;

  constructor(private readonly kit: ArtKit) {
    this.view.addChild(this.inner);
    this.legL = kit.sprite('w_leg', -9, -106);
    this.legR = kit.sprite('w_leg', 9, -106);
    this.legR.scale.x = -1;
    this.upper.position.set(0, -104);
    const torso = kit.sprite('w_torso', 0, 4);
    this.armL = this.arm(-22, 1);
    this.armR = this.arm(22, -1);
    this.head.position.set(0, -86);
    const headBase = kit.sprite('w_head');
    this.eyeL = kit.sprite('w_eye', -14, -38);
    this.eyeR = kit.sprite('w_eye', 14, -38);
    const glasses = kit.sprite('w_glasses', 0, -38);
    this.browL = kit.sprite('w_brow', -15, -55);
    this.browR = kit.sprite('w_brow', 15, -55);
    this.browR.scale.x = -1;
    this.mouth = kit.sprite('w_mouth_worried', 0, -13);
    this.helmet = kit.sprite('w_helmet', 0, -58);
    this.head.addChild(headBase, this.eyeL, this.eyeR, glasses, this.browL, this.browR, this.mouth, this.helmet);
    this.folders = kit.sprite('w_folders', 0, -44);
    this.upper.addChild(torso, this.armL.root, this.head, this.folders, this.armR.root);
    this.inner.addChild(this.legL, this.legR, this.upper);
  }

  private arm(x: number, side: 1 | -1): Arm {
    const root = new Container();
    root.position.set(x, -86);
    root.scale.x = side;
    const elbow = new Container();
    elbow.position.set(0, 38);
    const hand = this.kit.sprite('w_hand', 0, 36);
    elbow.addChild(this.kit.sprite('w_arm_fore'), hand);
    root.addChild(this.kit.sprite('w_arm_up'), elbow);
    return { side, root, elbow, hand };
  }

  pose(anim: string, elapsedMs: number, _states: Readonly<Record<string, string>>, ctx?: PoseContext): void {
    const e = Math.max(0, elapsedMs);
    let legs = 0;
    let armL = 0.12;
    let armR = 0.12;
    let elbowL = 1.9;
    let elbowR = 1.9;
    let bob = sin(e / 600) * 1.2;
    let lean = 0;
    let hunch = 0.06;
    let headDy = 0;
    let mouth = 'w_mouth_worried';
    let brow = -0.25;
    let eyesClosed = e % 2900 > 2790;
    let look = sin(e / 900) > 0.6 ? 2 : 0;
    let folders = true;
    let thumb = false;
    switch (anim) {
      case 'walk':
        legs = sin(e / 100) * 0.45; bob = Math.abs(sin(e / 100)) * -4; lean = 0.06; look = 2; break;
      case 'run':
        legs = sin(e / 55) * 0.8; bob = Math.abs(sin(e / 55)) * -6; lean = 0.18; armL = armR = 0.6 + sin(e / 55) * 0.5; elbowL = elbowR = 1.4; mouth = 'w_mouth_o'; look = 3; break;
      case 'cheer':
        armL = 2.7 + sin(e / 90) * 0.2; armR = 2.7 - sin(e / 90) * 0.2; elbowL = elbowR = 0.3;
        bob = -Math.abs(sin(e / 140)) * 20; mouth = 'w_mouth_smile'; brow = -0.5; folders = false; eyesClosed = true; hunch = -0.04; break;
      case 'peek':
        lean = 0.3; headDy = 6; armL = armR = 0.6; elbowL = elbowR = 1.2; mouth = 'w_mouth_o'; brow = -0.6; look = -3; break;
      case 'thumbsup':
        armR = 1.2; elbowR = 1.6; mouth = 'w_mouth_smile'; thumb = true; brow = -0.3; hunch = 0; break;
      case 'stuck':
        armL = 2.4 + sin(e / 200) * 0.1; armR = 2.4 - sin(e / 200) * 0.1; elbowL = elbowR = 0.2; legs = 0.55; bob = 0; folders = false; mouth = 'w_mouth_grimace'; break;
      case 'pull':
        lean = -0.28; armL = armR = 1.4 + sin(e / 60) * 0.1; elbowL = elbowR = 0.3; legs = 0.35; folders = false; bob = sin(e / 50) * 1.5; mouth = 'w_mouth_grimace'; brow = 0.3; break;
      case 'hit':
        lean = 0.5; armL = armR = 2.6; elbowL = elbowR = 0.2; folders = false; mouth = 'w_mouth_o'; eyesClosed = true; break;
      case 'shrug':
        armL = armR = 0.9; elbowL = elbowR = 2.2; bob = -Math.abs(sin(e / 300)) * 4; folders = false; mouth = 'w_mouth_worried'; brow = -0.6; break;
      case 'fall':
        armL = armR = 2.8; elbowL = elbowR = 0.3; lean = -0.2; legs = sin(e / 50) * 0.5; folders = false; mouth = 'w_mouth_o'; break;
      // ---- ANIMATION KIT
      case 'panic':
        armL = 2.5 + sin(e / 35) * 0.4; armR = 2.5 - sin(e / 35) * 0.4; elbowL = elbowR = 0.4; legs = sin(e / 40) * 0.35;
        bob = -Math.abs(sin(e / 70)) * 5; folders = false; mouth = 'w_mouth_o'; brow = -0.9; look = e % 400 < 200 ? -3 : 3; break;
      case 'duck':
        hunch = 0.5; headDy = 14; armL = armR = 2.7; elbowL = elbowR = 2.4; legs = 0.3; bob = 12; folders = false; mouth = 'w_mouth_grimace'; eyesClosed = true; break;
      case 'dive':
        lean = -1.2; armL = armR = 2.9; elbowL = elbowR = 0.1; legs = 0.5; folders = false; mouth = 'w_mouth_o'; brow = -0.8; break;
      case 'look':
        lean = 0.1; headDy = -2; look = 3; brow = -0.5; mouth = 'w_mouth_o'; armL = armR = 0.3; elbowL = elbowR = 2.2; break;
      case 'bowl': {
        // Lancer de bowling : élan (bras en arrière), pas glissé, bras qui accompagne vers l'avant.
        const k = Math.min(1, e / 420);
        armR = k < 0.5 ? 0.2 - k * 2.4 : -1 + (k - 0.5) * 5.2; elbowR = 0.2; armL = 1.2; elbowL = 0.6;
        lean = 0.35 * Math.sin(k * Math.PI); legs = 0.5 * Math.sin(k * Math.PI); folders = false; mouth = 'w_mouth_grimace'; brow = 0.4; break;
      }
      case 'push':
        lean = 0.35; armL = armR = 1.5 + sin(e / 60) * 0.08; elbowL = elbowR = 0.2; legs = 0.4; folders = false; mouth = 'w_mouth_grimace'; brow = 0.5; break;
      case 'carry':
        armL = armR = 1.9; elbowL = elbowR = 1.5; bob = Math.abs(sin(e / 110)) * -3; legs = sin(e / 110) * 0.3; lean = -0.08; folders = false; mouth = 'w_mouth_grimace'; break;
      case 'dizzy':
        lean = sin(e / 180) * 0.2; armL = 0.8 + sin(e / 150) * 0.3; armR = 0.5; elbowL = elbowR = 1; eyesClosed = e % 500 < 250; mouth = 'w_mouth_o'; folders = false; brow = -0.4; break;
      default:
        // Idle : dossiers serrés contre lui, coups d'œil nerveux.
        armL = armR = 0.25; elbowL = elbowR = 2.2;
    }
    this.inner.position.set(0, bob);
    this.inner.rotation = lean + clamp(-(ctx?.lagX ?? 0) / 400, -0.1, 0.1);
    this.legL.rotation = legs;
    this.legR.rotation = legs;
    this.upper.rotation = hunch;
    this.head.position.set(0, -86 + headDy + 4);
    this.head.rotation = hunch * 0.8;
    this.setArm(this.armL, armL, elbowL);
    this.setArm(this.armR, armR, elbowR);
    this.kit.swap(this.armR.hand, thumb ? 'w_thumb' : 'w_hand');
    this.folders.visible = folders && !thumb;
    for (const eye of [this.eyeL, this.eyeR]) {
      this.kit.swap(eye, eyesClosed ? 'w_eye_closed' : 'w_eye');
      eye.x = Math.sign(eye.x) * 14 + (eyesClosed ? 0 : look);
    }
    this.browL.rotation = brow * 0.5;
    this.browR.rotation = -brow * 0.5;
    this.browL.y = this.browR.y = -55 - Math.max(0, -brow) * 4;
    this.kit.swap(this.mouth, mouth);
    this.helmet.visible = this.helmetOn;
  }

  private setArm(arm: Arm, shoulder: number, elbow: number): void {
    arm.root.rotation = shoulder * arm.side;
    arm.elbow.rotation = -elbow;
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }
}

export class CooRig implements CharacterAnimator<Container> {
  readonly id = 'coo';
  readonly view = new Container();
  readonly animations = CHARACTER_ANIMS.coo;
  private readonly inner = new Container();
  private readonly wingFar: Sprite;
  private readonly wingNear: Sprite;
  private readonly head: Sprite;

  constructor(kit: ArtKit) {
    this.view.addChild(this.inner);
    this.wingFar = kit.sprite('coo_wing', -4, -30);
    this.wingFar.tint = 0xc9c1e0;
    const body = kit.sprite('coo_body');
    this.head = kit.sprite('coo_head', 12, -34);
    this.wingNear = kit.sprite('coo_wing', -2, -26);
    this.inner.addChild(this.wingFar, body, this.head, this.wingNear);
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
        flap = sin(e / 32) * 1.1; bob = sin(e / 64) * 4; break;
      case 'salute':
        salute = true; bob = -2; break;
      case 'crash':
        flap = sin(e / 20) * 1.4; spin = e / 90; break;
      case 'applaud':
        clap = true; flap = Math.abs(sin(e / 70)); bob = -Math.abs(sin(e / 140)) * 3; break;
      case 'carry':
        flap = sin(e / 25) * 1.3; bob = sin(e / 50) * 2; break;
      // ---- ANIMATION KIT
      case 'escape':
        // Décollage paniqué : battements très rapides, corps penché vers l'avant.
        flap = sin(e / 18) * 1.5; bob = sin(e / 36) * 5; spin = -0.35; break;
      case 'land': {
        // Atterrissage : ailes ouvertes pour freiner, petit rebond.
        const k = Math.min(1, e / 260);
        flap = (1 - k) * sin(e / 30) * 1.2; bob = -Math.abs(sin(k * Math.PI)) * 6; break;
      }
      case 'shock':
        // Plumes hérissées : il se gonfle d'un coup.
        flap = 0.9; bob = -4; peck = -0.3; break;
      default: {
        const k = e % 2600;
        peck = k < 300 ? sin((k / 300) * Math.PI) * 0.45 : 0;
        bob = k < 300 ? 0 : sin(e / 400) * 0.8;
      }
    }
    this.inner.y = bob;
    this.inner.rotation = spin;
    this.wingNear.rotation = salute ? -2.3 : clap ? -0.9 * flap : -0.2 - flap;
    this.wingNear.position.set(salute ? 4 : -2, salute ? -32 : -26);
    this.wingFar.rotation = clap ? -0.6 * flap : -0.3 + flap;
    this.head.rotation = peck;
    this.head.x = 12 + peck * 6;
    // Gonflé de surprise (shock) : le corps s'arrondit.
    this.inner.scale.set(anim === 'shock' ? 1.18 : 1, anim === 'shock' ? 1.12 : 1);
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }
}

/** Les mains du joueur : dos des mains, manches bleu marine qui viennent de la caméra. */
export class HandsRig implements CharacterAnimator<Container> {
  readonly id = 'hands';
  readonly view = new Container();
  readonly animations = CHARACTER_ANIMS.hands;
  private readonly left = new Container();
  private readonly right = new Container();
  private readonly handL: Sprite;
  private readonly handR: Sprite;
  private readonly lighter: Sprite;

  constructor(private readonly kit: ArtKit) {
    const build = (c: Container, x: number, mirror: boolean) => {
      c.position.set(x, 0);
      const sleeve = kit.sprite('hand_sleeve', 0, 22);
      sleeve.rotation = mirror ? -0.12 : 0.12;
      const hand = kit.sprite('hand_back_open', 0, 26);
      if (mirror) hand.scale.x = -1;
      c.addChild(sleeve, hand);
      c.scale.set(0.72);
      return hand;
    };
    this.handL = build(this.left, -36, false);
    this.handR = build(this.right, 36, true);
    this.lighter = kit.sprite('hand_lighter', 0, -10);
    this.right.addChild(this.lighter);
    this.view.addChild(this.left, this.right);
  }

  pose(anim: string, elapsedMs: number): void {
    const e = Math.max(0, elapsedMs);
    const closed = anim === 'grab' || anim === 'strain' || anim === 'lighter' || anim === 'pull' || anim === 'turn';
    for (const h of [this.handL, this.handR]) this.kit.swap(h, closed ? 'hand_back_fist' : 'hand_back_open');
    this.lighter.visible = anim === 'lighter';
    this.lighter.scale.set(1, 1 + sin(e / 40) * 0.05);
    this.left.visible = anim !== 'lighter';
    const shake = anim === 'strain' ? sin(e / 22) * 2.5 : 0;
    this.left.position.set(-36 + shake, anim === 'strain' ? 4 : 0);
    this.right.position.set(36 - shake, anim === 'strain' ? 4 : 0);
    this.left.rotation = anim === 'strain' ? -0.08 : 0;
    this.right.rotation = anim === 'strain' ? 0.08 : 0;
    // ANIMATION KIT : pousser (paumes en avant), tirer (poings qui reculent), tourner (poignet), rouler (élan).
    if (anim === 'push') {
      this.left.position.set(-30, -6 + sin(e / 50) * 2);
      this.right.position.set(30, -6 - sin(e / 50) * 2);
    } else if (anim === 'pull') {
      const k = Math.min(1, e / 200);
      this.left.position.set(-36, 10 * k);
      this.right.position.set(36, 10 * k);
    } else if (anim === 'turn') {
      this.right.rotation = 0.9 * Math.min(1, e / 300);
      this.left.visible = false;
    } else if (anim === 'roll') {
      this.left.visible = false;
      this.right.rotation = -0.4 + 0.9 * Math.min(1, e / 260);
    }
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }
}
