/**
 * B.B. — rig « à pièces » (Phase 0.6, ART BIBLE §5.1). Mêmes noms d'animations que le placeholder : le contenu
 * ne change pas. Pose = fonction PURE de (anim, temps écoulé, états, contexte) : replay et reprise identiques.
 *
 * Nouveautés : visage animable (yeux, paupières, pupilles, sourcils indépendants, bouches, joues), bras à deux
 * segments, clignements, fondus courts entre animations, cravate et touffe à ressort (mouvement secondaire).
 */
import { Container, Sprite } from 'pixi.js';
import { CHARACTER_ANIMS } from '../../content/office';
import type { CharacterAnimator, PoseContext } from '../../presentation/characterAnimator';
import type { CosmeticLook } from '../cosmeticLook';
import type { ArtKit } from './kit';

type Eye = 'open' | 'half' | 'heavy' | 'wide' | 'closed' | 'happy' | 'tight' | 'x' | 'spiral';
type Mouth = 'flat' | 'smirk' | 'smile' | 'grin' | 'frown' | 'wavy' | 'o' | 'whistle' | 'gasp' | 'laugh' | 'teeth';
type Hand = 'open' | 'fist' | 'grip';

export interface BossPose {
  bob: number;
  sx: number;
  sy: number;
  jitter: number;
  tilt: number;
  /** Rotation sur soi-même (cos de l'angle : 1 face, −1 dos… lu comme un miroir). */
  spin: number;
  armL: number;
  armR: number;
  elbowL: number;
  elbowR: number;
  handL: Hand;
  handR: Hand;
  legL: number;
  legR: number;
  headTilt: number;
  headDx: number;
  headDy: number;
  eyeL: Eye;
  eyeR: Eye;
  /** Regard (unités) : x > 0 vers la droite de l'écran. */
  px: number;
  py: number;
  /** Inclinaison des paupières : > 0 colère (coin intérieur bas), < 0 inquiétude. */
  lidTilt: number;
  mouth: Mouth;
  /** Sourcils : > 0 froncés (colère), < 0 relevés (surprise, peur). */
  brow: number;
  /** Sourcil droit relevé en plus (le « sourcil levé » de LE SIP). */
  browUpR: number;
  flush: number;
  /** Touffe dressée (0 → 1). */
  meche: number;
  sweat: number;
  vein: number;
  /** Mug : inclinaison supplémentaire (boire). */
  mugTilt: number;
}

const BASE: BossPose = {
  bob: 0, sx: 1, sy: 1, jitter: 0, tilt: 0, spin: 1,
  armL: 0.16, armR: 0.1, elbowL: 0.35, elbowR: 1.75, handL: 'open', handR: 'grip', legL: 0, legR: 0,
  headTilt: 0, headDx: 0, headDy: 0, eyeL: 'open', eyeR: 'open', px: 0, py: 0, lidTilt: 0,
  mouth: 'smirk', brow: 0.15, browUpR: 0, flush: 0, meche: 0, sweat: 0, vein: 0, mugTilt: 0,
};

const NUMERIC: readonly (keyof BossPose)[] = [
  'bob', 'sx', 'sy', 'jitter', 'tilt', 'armL', 'armR', 'elbowL', 'elbowR', 'legL', 'legR', 'headTilt', 'headDx', 'headDy',
  'px', 'py', 'lidTilt', 'brow', 'browUpR', 'flush', 'meche', 'sweat', 'vein', 'mugTilt',
];

const sin = Math.sin;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (e: number, a: number, b: number) => clamp01((e - a) / (b - a));
const smooth = (k: number) => k * k * (3 - 2 * k);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const outBack = (k: number) => {
  const c = 1.9;
  return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2;
};
/** Rebond amorti après un choc (1 → 0, avec dépassement). */
const settle = (e: number, ms: number, freq = 0.02) => Math.exp(-e / (ms * 0.35)) * Math.cos(e * freq);

/** Clignement déterministe (toutes les ~3,4 s, 110 ms). */
const blinking = (e: number, offset = 0) => (e + offset) % 3400 > 3290;

function eyes(p: BossPose, eye: Eye): void {
  p.eyeL = eye;
  p.eyeR = eye;
}

/** Mug tenu à la poitrine (repos). */
function mugAtChest(p: BossPose): void {
  p.armR = 0.1;
  p.elbowR = 1.75;
  p.handR = 'grip';
}

/**
 * LE SIP (ART BIBLE §5.1), 800 ms : regard joueur (0-100) → montée lente (100-330) → pause (330-420) → SIP (420-620)
 * → sourcil levé (640-800). Les contenus calent le son « sip » vers 440 ms.
 */
function leSip(p: BossPose, k: number): void {
  const lift = smooth(seg(k, 100, 330));
  const lower = smooth(seg(k, 640, 800));
  const up = lift * (1 - lower * 0.6);
  p.armR = lerp(0.1, -0.42, up);
  p.elbowR = lerp(1.75, 2.62, up);
  p.px = 0;
  p.py = 1;
  eyes(p, 'half');
  p.mouth = 'smirk';
  p.brow = 0.05;
  if (k >= 420 && k < 640) {
    // SIP : yeux fermés, tête en arrière, mug incliné.
    const s = smooth(seg(k, 420, 480));
    eyes(p, 'closed');
    p.headTilt = -0.1 * s;
    p.headDy = -2 * s;
    p.mugTilt = -0.55 * s;
    p.mouth = 'whistle';
    p.flush = 0.12 * s;
  } else if (k >= 640) {
    p.browUpR = smooth(seg(k, 640, 740));
    p.headTilt = -0.04;
  }
}

/** Pose = fonction pure de (anim, elapsed). */
export function bossPose(anim: string, e: number): BossPose {
  const p: BossPose = { ...BASE, bob: sin(e / 520) * 1.6, sy: 1 + sin(e / 520) * 0.008 };
  switch (anim) {
    case 'idle': {
      mugAtChest(p);
      const g = (e % 6000) / 6000;
      p.px = g > 0.55 && g < 0.75 ? 3 : g > 0.2 && g < 0.3 ? -2 : 0;
      if (blinking(e)) eyes(p, 'closed');
      break;
    }
    case 'sip': {
      // Signature immédiate, puis boucle de repos de 5,2 s qui se termine par une nouvelle signature.
      if (e < 1000) leSip(p, Math.min(e, 800));
      else {
        const k = (e - 1000) % 5200;
        if (k >= 4400) leSip(p, k - 4400);
        else {
          mugAtChest(p);
          p.px = k > 1800 && k < 2600 ? -3 : k > 2600 && k < 3000 ? 2 : 0;
          if (blinking(k, 1200)) eyes(p, 'closed');
          p.browUpR = Math.max(0, 1 - k / 500);
        }
      }
      break;
    }
    case 'oblivious': {
      eyes(p, 'closed');
      p.mouth = 'whistle';
      p.headTilt = sin(e / 260) * 0.07;
      p.bob = -Math.abs(sin(e / 260)) * 2.5;
      p.brow = -0.25;
      p.armR = -0.3;
      p.elbowR = 2.3;
      p.mugTilt = -0.15;
      p.armL = 0.3 + sin(e / 260) * 0.12;
      p.elbowL = 0.6;
      break;
    }
    case 'surprised': {
      // La « prise » : anticipation (écrasé) → étirement → tenue.
      const a = seg(e, 0, 50);
      const b = outBack(seg(e, 50, 220));
      p.sy = e < 50 ? 1 - 0.08 * a : lerp(0.92, 1.07, b) - 0.02 * seg(e, 220, 500);
      p.sx = 1 / Math.sqrt(p.sy);
      eyes(p, e < 50 ? 'tight' : 'wide');
      p.mouth = e < 50 ? 'teeth' : 'gasp';
      p.armL = lerp(0.2, 2.3, b);
      p.armR = lerp(0.1, 2.2, b);
      p.elbowL = p.elbowR = lerp(0.3, 0.5, b);
      p.handL = p.handR = 'open';
      p.brow = -0.6 * b;
      p.meche = b;
      p.py = -2;
      break;
    }
    case 'spin':
      p.spin = Math.cos(e / 45);
      eyes(p, 'wide');
      p.mouth = 'gasp';
      p.armL = p.armR = 1.3;
      p.elbowL = p.elbowR = 0.3;
      p.handL = p.handR = 'open';
      p.meche = 1;
      break;
    case 'dizzy':
    case 'dazed':
      eyes(p, 'spiral');
      p.mouth = anim === 'dizzy' ? 'o' : 'wavy';
      p.headTilt = sin(e / 150) * 0.22;
      p.headDx = sin(e / 150) * 3;
      p.tilt = sin(e / 300) * 0.07;
      p.armL = 0.55 + sin(e / 190) * 0.15;
      p.armR = 0.4;
      p.elbowL = 0.5;
      p.elbowR = 1.2;
      p.handL = 'open';
      p.brow = -0.2;
      p.flush = 0.15;
      break;
    case 'scared': {
      eyes(p, 'wide');
      p.mouth = e % 600 < 300 ? 'gasp' : 'teeth';
      p.armL = 2.3 + sin(e / 45) * 0.45;
      p.armR = 2.2 + sin(e / 45 + 1) * 0.45;
      p.elbowL = p.elbowR = 0.5 + sin(e / 60) * 0.3;
      p.handL = p.handR = 'open';
      p.legL = sin(e / 38) * 0.5;
      p.legR = -sin(e / 38) * 0.5;
      p.meche = 1;
      p.brow = -0.8;
      p.lidTilt = -0.3;
      p.sweat = 1;
      p.py = -1;
      break;
    }
    case 'splat': {
      // Impact : écrasement maximal, puis retour élastique.
      const k = e < 40 ? 1 : settle(e - 40, 420, 0.028);
      p.sx = 1 + 0.34 * k;
      p.sy = 1 - 0.3 * k;
      eyes(p, 'x');
      p.mouth = 'gasp';
      p.armL = p.armR = 1.7;
      p.elbowL = p.elbowR = 0.2;
      p.handL = p.handR = 'open';
      p.legL = 0.5;
      p.legR = -0.5;
      p.meche = 1;
      p.brow = -0.5;
      break;
    }
    case 'ouch':
      p.eyeL = 'tight';
      p.eyeR = 'tight';
      p.mouth = 'teeth';
      p.jitter = e < 320 ? sin(e / 16) * 3 : 0;
      p.brow = 0.8;
      p.lidTilt = -0.2;
      p.handL = 'fist';
      p.armL = 0.5;
      p.elbowL = 1.6;
      p.flush = 0.3;
      break;
    case 'laugh': {
      eyes(p, 'happy');
      p.mouth = 'laugh';
      p.bob = -Math.abs(sin(e / 75)) * 7;
      p.sy = 1 + Math.abs(sin(e / 75)) * 0.03;
      p.headTilt = -0.14 + sin(e / 75) * 0.03;
      p.armL = -0.3;
      p.elbowL = 1.2;
      p.handL = 'open';
      p.armR = 0.5 + sin(e / 75) * 0.2;
      p.elbowR = 1.9;
      p.brow = -0.3;
      p.flush = 0.25;
      break;
    }
    case 'smug':
      eyes(p, 'half');
      p.mouth = 'smirk';
      p.brow = 0.1;
      p.browUpR = 1;
      p.headTilt = -0.08;
      p.armR = -0.35;
      p.elbowR = 2.5;
      p.armL = 0.55;
      p.elbowL = -1.3;
      p.handL = 'fist';
      p.sx = 1.02;
      break;
    case 'flex':
      eyes(p, 'half');
      p.mouth = 'grin';
      p.armL = 1.5 + sin(e / 120) * 0.12;
      p.armR = 1.5 - sin(e / 120) * 0.12;
      p.elbowL = p.elbowR = 2.4;
      p.handL = p.handR = 'fist';
      p.sx = 1.06;
      p.sy = 1.02;
      p.brow = 0.3;
      p.browUpR = 0.6;
      break;
    case 'sulk':
      eyes(p, 'heavy');
      p.mouth = 'frown';
      p.headDy = 7;
      p.headTilt = 0.1;
      p.armL = -0.25;
      p.armR = -0.2;
      p.elbowL = 0.3;
      p.elbowR = 1.3;
      p.brow = -0.2;
      p.lidTilt = -0.35;
      p.py = 3;
      p.sy = 0.97;
      break;
    case 'tapfoot':
      // Irrité : poing sur la hanche, mug à la poitrine, pied qui tape, joues qui chauffent.
      eyes(p, 'heavy');
      p.mouth = 'frown';
      p.px = 3;
      p.legR = (e % 420) / 420 < 0.5 ? -0.28 : 0;
      p.armL = 0.55;
      p.elbowL = -1.3;
      p.handL = 'fist';
      mugAtChest(p);
      p.brow = 0.7;
      p.lidTilt = 0.35;
      p.flush = 0.3;
      break;
    case 'hover':
      p.legL = sin(e / 45) * 0.9;
      p.legR = -sin(e / 45) * 0.9;
      p.armL = p.armR = 1.3 + sin(e / 60) * 0.2;
      p.elbowL = p.elbowR = 0.3;
      p.handL = p.handR = 'open';
      eyes(p, 'wide');
      p.mouth = 'o';
      p.meche = 0.6;
      break;
    case 'lookdown':
      p.headDy = 6;
      p.py = 5;
      eyes(p, 'open');
      p.mouth = 'o';
      p.legL = 0.2;
      p.legR = -0.2;
      p.armL = p.armR = 0.8;
      p.handL = 'open';
      break;
    case 'lookcam':
      eyes(p, 'wide');
      p.px = 0;
      p.py = 0;
      p.mouth = 'flat';
      p.brow = -0.6;
      p.armL = p.armR = 0.9;
      p.handL = 'open';
      p.legL = 0.2;
      p.legR = -0.2;
      p.sweat = 1;
      break;
    case 'tiptoe': {
      const k = sin(e / 90);
      p.legL = k * 0.45;
      p.legR = -k * 0.45;
      eyes(p, 'open');
      p.px = 4;
      p.mouth = 'whistle';
      p.armL = p.armR = 1.0;
      p.elbowL = 1.4;
      p.handL = 'open';
      p.bob = Math.abs(k) * -3;
      break;
    }
    case 'wave':
      p.armL = 2.6 + sin(e / 90) * 0.35;
      p.elbowL = 0.4;
      p.handL = 'open';
      eyes(p, 'half');
      p.mouth = 'smirk';
      p.browUpR = 1;
      break;
    case 'fall':
      p.armL = p.armR = 2.7;
      p.elbowL = p.elbowR = 0.3;
      p.handL = p.handR = 'open';
      eyes(p, 'wide');
      p.mouth = 'gasp';
      p.sy = 1.12;
      p.sx = 0.92;
      p.meche = 1;
      p.brow = -0.8;
      break;
    case 'furious':
      eyes(p, 'open');
      p.lidTilt = 0.45;
      p.mouth = 'teeth';
      p.brow = 1;
      p.flush = 0.85;
      p.vein = 1;
      p.jitter = sin(e / 16) * 2;
      p.meche = 1;
      p.armL = p.armR = 0.45;
      p.elbowL = p.elbowR = 1.2;
      p.handL = p.handR = 'fist';
      p.sx = 1.04;
      break;
    case 'sniff':
      eyes(p, 'closed');
      p.headTilt = -0.15;
      p.mouth = 'smirk';
      p.headDy = -3;
      p.armR = -0.35;
      p.elbowR = 2.5;
      break;
    case 'drink':
      p.armR = -0.5;
      p.elbowR = 2.75;
      p.mugTilt = -0.9;
      p.headTilt = -0.3;
      eyes(p, 'closed');
      p.mouth = 'whistle';
      p.flush = 0.5;
      break;
    case 'grow':
      p.jitter = sin(e / 14) * 3;
      eyes(p, 'wide');
      p.lidTilt = 0.4;
      p.mouth = 'teeth';
      p.brow = 1;
      p.flush = 1;
      p.vein = 1;
      p.meche = 1;
      p.armL = p.armR = 1.8;
      p.handL = p.handR = 'fist';
      break;
    case 'giant-idle':
      eyes(p, 'open');
      p.lidTilt = 0.35;
      p.mouth = 'grin';
      p.brow = 0.9;
      p.bob = sin(e / 400) * 4;
      p.meche = 1;
      p.armL = p.armR = 0.6;
      p.handL = p.handR = 'fist';
      break;
    case 'giant-wind':
      eyes(p, 'open');
      p.lidTilt = 0.4;
      p.mouth = 'teeth';
      p.brow = 1;
      p.armR = 2.9;
      p.armL = 0.4;
      p.tilt = -0.05;
      p.meche = 1;
      p.handL = p.handR = 'fist';
      break;
    case 'giant-hurt':
      eyes(p, 'x');
      p.mouth = 'gasp';
      p.tilt = 0.12 * Math.max(0, 1 - e / 400);
      p.jitter = e < 250 ? sin(e / 15) * 4 : 0;
      p.armL = p.armR = 1.4;
      p.handL = p.handR = 'open';
      break;
    case 'giant-swat': {
      const k = Math.min(1, e / 180);
      p.armR = 2.9 - k * 3.6;
      eyes(p, 'half');
      p.mouth = 'grin';
      p.brow = 0.9;
      p.tilt = 0.06 * k;
      p.meche = 1;
      p.handR = 'open';
      break;
    }
    case 'giant-laugh':
      eyes(p, 'happy');
      p.mouth = 'laugh';
      p.bob = Math.abs(sin(e / 90)) * -8;
      p.armL = p.armR = 0.7;
      p.meche = 1;
      break;
    case 'giant-ko':
      eyes(p, 'x');
      p.mouth = 'gasp';
      p.armL = p.armR = 2.2;
      p.handL = p.handR = 'open';
      p.legL = 0.4;
      p.legR = -0.4;
      break;
    case 'away':
      eyes(p, 'wide');
      p.mouth = 'gasp';
      p.armL = 2.4 + sin(e / 40) * 0.6;
      p.armR = 2.4 - sin(e / 40) * 0.6;
      p.elbowL = p.elbowR = 0.4;
      p.handL = p.handR = 'open';
      p.legL = sin(e / 50);
      p.legR = -sin(e / 50);
      p.meche = 1;
      p.brow = -0.8;
      break;
    // ---- Phase 0.5B
    case 'braced':
      eyes(p, 'tight');
      p.mouth = 'teeth';
      p.brow = 0.9;
      p.armL = 2.2;
      p.elbowL = 2.3;
      p.armR = 1.6;
      p.elbowR = 2.6;
      p.handL = 'fist';
      p.sx = 1.04;
      p.sy = 0.9;
      p.headDy = 5;
      p.jitter = sin(e / 25) * 1.2;
      p.sweat = 1;
      break;
    case 'peek':
      // Un œil fermé, l'autre entrouvert : il vérifie s'il est entier.
      p.eyeL = 'tight';
      p.eyeR = 'heavy';
      p.px = -2;
      p.mouth = 'teeth';
      p.brow = 0.5;
      p.armL = 2.0;
      p.elbowL = 2.2;
      p.armR = 1.2;
      p.elbowR = 2.4;
      p.handL = 'fist';
      p.sy = 0.95;
      p.headDy = 3;
      break;
    case 'phew': {
      const k = smooth(seg(e, 0, 260));
      eyes(p, e < 380 ? 'closed' : 'open');
      p.mouth = 'o';
      p.brow = -0.35;
      p.lidTilt = -0.2;
      // Il s'essuie le front, puis souffle.
      p.armL = lerp(2.0, 2.6, k);
      p.elbowL = 2.4;
      p.handL = 'open';
      p.armR = 0.3;
      p.elbowR = 1.6;
      p.sy = 1 - 0.04 * sin(Math.min(1, e / 500) * Math.PI);
      p.bob = -Math.abs(sin(e / 180)) * 2;
      p.sweat = e < 300 ? 1 : 0;
      break;
    }
    case 'lookback': {
      const k = outBack(seg(e, 0, 160));
      eyes(p, 'wide');
      p.mouth = e < 200 ? 'o' : 'gasp';
      p.px = 5 * k;
      p.headDx = 4 * k;
      p.headTilt = 0.12 * k;
      p.brow = -0.6;
      p.armR = -0.2;
      p.elbowR = 2.2;
      p.armL = 0.9 * k;
      p.handL = 'open';
      p.meche = 0.5 * k;
      break;
    }
    case 'mugcheck':
      p.armR = -0.6;
      p.elbowR = 2.2;
      p.mugTilt = 0.6;
      p.headDy = 6;
      p.py = 5;
      p.px = 3;
      eyes(p, 'wide');
      p.mouth = 'flat';
      p.brow = -0.3;
      break;
    case 'hang':
      p.armL = 2.6 + sin(e / 70) * 0.4;
      p.armR = 2.6 - sin(e / 70) * 0.4;
      p.elbowL = p.elbowR = 0.2;
      p.handL = p.handR = 'grip';
      p.legL = sin(e / 90) * 0.5;
      p.legR = -sin(e / 90) * 0.5;
      p.tilt = sin(e / 320) * 0.1;
      eyes(p, 'wide');
      p.mouth = 'teeth';
      p.meche = 1;
      p.sweat = 1;
      break;
    case 'tiefix':
      p.armL = -0.4;
      p.elbowL = 2.3;
      p.handL = 'grip';
      eyes(p, 'half');
      p.mouth = 'smirk';
      p.headTilt = -0.1 + sin(e / 90) * 0.02;
      p.browUpR = 0.7;
      break;
    case 'taunt':
      p.armL = 1.7 + sin(e / 70) * 0.35;
      p.elbowL = 1.4;
      p.handL = 'open';
      eyes(p, 'half');
      p.mouth = 'grin';
      p.headTilt = sin(e / 140) * 0.1;
      p.bob = -Math.abs(sin(e / 140)) * 3;
      p.browUpR = 1;
      break;
    case 'hop':
      p.sy = 1 + 0.1 * Math.max(0, 1 - e / 200);
      p.bob = -Math.max(0, sin((Math.min(e, 300) / 300) * Math.PI)) * 18;
      p.armL = p.armR = 1.7;
      p.elbowL = p.elbowR = 0.3;
      p.handL = 'open';
      eyes(p, 'wide');
      p.mouth = 'gasp';
      p.meche = 1;
      break;
    case 'lookup':
      p.headDy = -4;
      p.headTilt = -0.08;
      p.py = -5;
      eyes(p, 'open');
      p.mouth = 'o';
      p.brow = -0.5;
      p.armL = 0.3;
      break;
    case 'climb':
      p.armL = 2.7 + sin(e / 90) * 0.4;
      p.armR = 2.7 - sin(e / 90) * 0.4;
      p.elbowL = p.elbowR = 0.5;
      p.handL = p.handR = 'grip';
      p.legL = sin(e / 90) * 0.6;
      p.legR = -sin(e / 90) * 0.6;
      eyes(p, 'tight');
      p.mouth = 'teeth';
      p.flush = 0.4;
      break;
    case 'ring':
      p.armL = 1.1 + Math.abs(sin(e / 60)) * 0.35;
      p.elbowL = 1.2;
      p.handL = 'open';
      eyes(p, 'half');
      p.mouth = 'smirk';
      p.browUpR = 0.8;
      break;
    // ---- ANIMATION KIT (production 3 gadgets) : anticipation, vol, atterrissage, K.O. cartoon, émotions.
    case 'blink': {
      // Double clignement agacé (« je t'ai vu »).
      mugAtChest(p);
      eyes(p, (e > 60 && e < 150) || (e > 260 && e < 340) ? 'closed' : 'heavy');
      p.brow = 0.4;
      p.mouth = 'flat';
      break;
    }
    case 'smirk':
      mugAtChest(p);
      eyes(p, 'half');
      p.mouth = 'smirk';
      p.browUpR = smooth(seg(e, 0, 180));
      p.headTilt = -0.06;
      p.px = -2;
      break;
    case 'anticipate': {
      // Anticipation : il se ramasse (écrasé, genoux fléchis) avant un saut, un choc, un départ.
      const k = smooth(seg(e, 0, 140));
      p.sy = 1 - 0.1 * k;
      p.sx = 1 + 0.06 * k;
      p.bob = 6 * k;
      eyes(p, 'tight');
      p.mouth = 'teeth';
      p.brow = 0.6;
      p.armL = p.armR = lerp(0.2, 0.9, k);
      p.elbowL = p.elbowR = 1.4;
      p.handL = p.handR = 'fist';
      break;
    }
    case 'airborne': {
      // En l'air : bras et jambes qui moulinent, étiré dans le sens du vol.
      p.sy = 1.08;
      p.sx = 0.94;
      eyes(p, 'wide');
      p.mouth = 'gasp';
      p.armL = 2.5 + sin(e / 50) * 0.5;
      p.armR = 2.3 - sin(e / 50) * 0.5;
      p.elbowL = p.elbowR = 0.3;
      p.handL = p.handR = 'open';
      p.legL = sin(e / 45) * 0.8;
      p.legR = -sin(e / 45) * 0.8;
      p.meche = 1;
      p.brow = -0.8;
      p.tilt = sin(e / 160) * 0.1;
      break;
    }
    case 'land': {
      // Atterrissage : écrasement au contact, puis retour élastique ; il reste sonné une fraction de seconde.
      const k = e < 30 ? 1 : settle(e - 30, 360, 0.03);
      p.sy = 1 - 0.22 * k;
      p.sx = 1 + 0.2 * k;
      eyes(p, e < 220 ? 'tight' : 'open');
      p.mouth = e < 220 ? 'teeth' : 'o';
      p.armL = p.armR = 1.2 - 0.6 * seg(e, 0, 300);
      p.elbowL = p.elbowR = 0.6;
      p.handL = p.handR = 'open';
      p.legL = 0.35 * k;
      p.legR = -0.35 * k;
      p.meche = 1 - seg(e, 200, 500);
      break;
    }
    case 'recover': {
      // Il se relève, époussette sa veste, rajuste la cravate : la dignité revient.
      const k = smooth(seg(e, 0, 300));
      p.sy = lerp(0.9, 1, k);
      eyes(p, e < 300 ? 'heavy' : 'half');
      p.mouth = e < 300 ? 'wavy' : 'flat';
      p.armL = lerp(1.2, -0.3, k) + (e > 300 ? sin(e / 70) * 0.15 : 0);
      p.elbowL = 2.2;
      p.handL = 'open';
      mugAtChest(p);
      p.brow = 0.3 * k;
      p.headTilt = 0.08 * (1 - k);
      break;
    }
    case 'ko': {
      // K.O. cartoon : à plat, yeux en X, oiseaux (les étoiles sont un effet), une jambe qui tressaute.
      const k = e < 40 ? 1 : settle(e - 40, 500, 0.022);
      p.sy = 0.78 + 0.1 * (1 - k);
      p.sx = 1.18;
      eyes(p, 'x');
      p.mouth = 'wavy';
      p.armL = 1.9;
      p.armR = 1.7;
      p.elbowL = p.elbowR = 0.2;
      p.handL = p.handR = 'open';
      p.legL = 0.6;
      p.legR = -0.5 + (e % 900 < 120 ? 0.3 : 0);
      p.tilt = -0.12;
      p.headTilt = 0.2;
      p.flush = 0.2;
      break;
    }
    case 'panic': {
      // Panique : tremblement rapide, regards gauche-droite, sueur.
      eyes(p, 'wide');
      p.mouth = e % 400 < 200 ? 'gasp' : 'wavy';
      p.px = e % 500 < 250 ? -4 : 4;
      p.jitter = sin(e / 12) * 2.5;
      p.armL = 1.9 + sin(e / 40) * 0.3;
      p.armR = 1.7 + sin(e / 40 + 2) * 0.3;
      p.elbowL = p.elbowR = 0.8;
      p.handL = p.handR = 'open';
      p.brow = -0.9;
      p.lidTilt = -0.4;
      p.sweat = 1;
      p.meche = 1;
      break;
    }
    case 'confused':
      mugAtChest(p);
      eyes(p, 'open');
      p.eyeL = 'half';
      p.mouth = 'wavy';
      p.headTilt = 0.16 + sin(e / 400) * 0.03;
      p.px = 3;
      p.py = -2;
      p.brow = -0.3;
      p.browUpR = 0.8;
      p.armL = 1.4;
      p.elbowL = 2.5;
      p.handL = 'open';
      break;
    case 'relief': {
      const k = smooth(seg(e, 0, 400));
      eyes(p, 'closed');
      p.mouth = 'o';
      p.sy = 1 - 0.05 * sin(k * Math.PI);
      p.headTilt = -0.1 * k;
      p.armL = 0.2;
      p.brow = -0.3;
      mugAtChest(p);
      p.flush = 0.1;
      break;
    }
    case 'rage':
      // RAGE : il tape du poing sur le bureau (deux fois), veine, touffe dressée.
      eyes(p, 'open');
      p.lidTilt = 0.5;
      p.mouth = 'teeth';
      p.brow = 1;
      p.flush = 1;
      p.vein = 1;
      p.meche = 1;
      p.armL = 1.2 - Math.abs(sin(e / 110)) * 1.0;
      p.elbowL = 0.8;
      p.handL = 'fist';
      mugAtChest(p);
      p.jitter = sin(e / 14) * 1.5;
      p.bob = Math.abs(sin(e / 110)) * 3;
      break;
    case 'duck':
      // Il s'aplatit : tête rentrée, bras sur la tête.
      p.sy = 0.82;
      p.sx = 1.1;
      p.bob = 10;
      eyes(p, 'tight');
      p.mouth = 'teeth';
      p.armL = p.armR = 2.6;
      p.elbowL = p.elbowR = 2.2;
      p.handL = p.handR = 'open';
      p.headDy = 6;
      p.sweat = 1;
      break;
    case 'push': {
      // Il repousse (meuble, projectile) : bras tendus, penché, effort.
      p.tilt = -0.12;
      p.armL = p.armR = 1.55 + sin(e / 60) * 0.06;
      p.elbowL = p.elbowR = 0.15;
      p.handL = p.handR = 'open';
      eyes(p, 'tight');
      p.mouth = 'teeth';
      p.brow = 0.8;
      p.flush = 0.5;
      p.legL = 0.3;
      p.legR = -0.2;
      break;
    }
    case 'catch':
      // Il tend la main libre et attrape (projectile, mug) sans même regarder.
      mugAtChest(p);
      eyes(p, 'half');
      p.mouth = 'smirk';
      p.armL = 1.9;
      p.elbowL = 0.4;
      p.handL = 'grip';
      p.browUpR = 0.8;
      p.px = -3;
      break;
    case 'dodge': {
      // Esquive : il se penche d'un coup (côté opposé au danger), puis reprend l'équilibre.
      const k = e < 90 ? smooth(e / 90) : 1 - 0.3 * smooth(seg(e, 300, 600));
      p.tilt = -0.32 * k;
      p.headDx = -6 * k;
      eyes(p, 'wide');
      p.mouth = 'o';
      mugAtChest(p);
      p.armL = 1.6 * k;
      p.handL = 'open';
      p.meche = k;
      break;
    }
    default:
      mugAtChest(p);
      break;
  }
  return p;
}

/** Durée du fondu d'entrée (ms) : court par défaut, nul pour les chocs (la cassure fait l'effet). */
function blendIn(anim: string): number {
  switch (anim) {
    case 'splat':
    case 'ouch':
    case 'giant-hurt':
    case 'surprised':
    case 'spin':
    case 'land':
    case 'ko':
    case 'dodge':
      return 0;
    case 'scared':
    case 'braced':
    case 'lookback':
      return 60;
    case 'sip':
    case 'idle':
    case 'sulk':
      return 180;
    default:
      return 110;
  }
}

function blend(a: BossPose, b: BossPose, k: number): BossPose {
  const out = { ...b };
  for (const f of NUMERIC) (out[f] as number) = lerp(a[f] as number, b[f] as number, k);
  if (k < 0.5) {
    out.eyeL = a.eyeL;
    out.eyeR = a.eyeR;
    out.mouth = a.mouth;
    out.handL = a.handL;
    out.handR = a.handR;
  }
  return out;
}

const EYE_TEX: Record<Eye, string | null> = {
  open: 'bb_eye', half: 'bb_eye', heavy: 'bb_eye', wide: 'bb_eye_wide',
  closed: null, happy: null, tight: null, x: null, spiral: null,
};
const EYE_FLAT: Partial<Record<Eye, string>> = {
  closed: 'bb_eye_closed', happy: 'bb_eye_happy', tight: 'bb_eye_tight', x: 'bb_eye_x', spiral: 'bb_eye_spiral',
};
const MOUTH_TEX: Record<Mouth, string> = {
  flat: 'bb_mouth_flat', smirk: 'bb_mouth_smirk', smile: 'bb_mouth_smile', grin: 'bb_mouth_grin', frown: 'bb_mouth_frown',
  wavy: 'bb_mouth_wavy', o: 'bb_mouth_o', whistle: 'bb_mouth_whistle', gasp: 'bb_mouth_gasp', laugh: 'bb_mouth_laugh', teeth: 'bb_mouth_teeth',
};
const HAND_TEX: Record<Hand, string> = { open: 'bb_hand_open', fist: 'bb_hand_fist', grip: 'bb_hand_grip' };

interface EyeRig {
  root: Container;
  sclera: Sprite;
  pupil: Sprite;
  lid: Sprite;
  flat: Sprite;
  side: 1 | -1;
}

interface ArmRig {
  side: 1 | -1;
  root: Container;
  elbow: Container;
  wrist: Container;
  hand: Sprite;
}

/** Fauteuil de direction : plus large que B.B. et plus haut que sa tête (silhouette « trône »). */
export const CHAIR_SCALE = 1.42;

/** Positions (repère du rig, pieds à y = 0). */
const HIP_Y = -26;
const SHOULDER = { x: 56, y: -114 };
const NECK_Y = -136;
const EYE = { x: 18, y: -54 };

export class BossRig implements CharacterAnimator<Container> {
  readonly id = 'boss';
  readonly view = new Container();
  readonly animations = CHARACTER_ANIMS.boss;
  private readonly inner = new Container();
  private readonly chair: Sprite;
  private readonly rocket: Sprite;
  private readonly legL: Sprite;
  private readonly legR: Sprite;
  private readonly torso: Sprite;
  private readonly tie: Sprite;
  private readonly tieStretched: Sprite;
  private readonly tieSnapped: Sprite;
  private readonly head = new Container();
  private readonly headBase: Sprite;
  private readonly flush: Sprite;
  private readonly soot: Sprite;
  private readonly tuft: Sprite;
  private readonly tuftCut: Sprite;
  private readonly browL: Sprite;
  private readonly browR: Sprite;
  private readonly mouth: Sprite;
  private readonly sweat: Sprite;
  private readonly vein: Sprite;
  private readonly eyeL: EyeRig;
  private readonly eyeR: EyeRig;
  private readonly armL: ArmRig;
  private readonly armR: ArmRig;
  private readonly mug: Sprite;
  private readonly steam: Sprite;
  private look: Pick<CosmeticLook, 'mug' | 'tie' | 'rocket'> = { mug: 'default', tie: 'default', rocket: 'default' };

  constructor(private readonly kit: ArtKit) {
    this.view.addChild(this.inner);
    this.chair = kit.sprite('bb_chair', 0, 4);
    this.chair.scale.set(CHAIR_SCALE);
    this.rocket = kit.sprite('bb_rocket', 0, -8);
    this.legL = kit.sprite('bb_leg_l', -20, HIP_Y - 4);
    this.legR = kit.sprite('bb_leg_r', 20, HIP_Y - 4);
    this.torso = kit.sprite('bb_torso', 0, HIP_Y);
    this.tie = kit.sprite('bb_tie', 0, -130);
    this.tieStretched = kit.sprite('bb_tie_stretched', 0, -122);
    this.tieSnapped = kit.sprite('bb_tie_snapped', 0, -130);

    this.armL = this.makeArm(-SHOULDER.x, 1);
    this.armR = this.makeArm(SHOULDER.x, -1);
    this.mug = kit.sprite('bb_mug', 4, 26);
    // Contre-miroir : l'anse du mug reste à l'extérieur.
    this.mug.scale.x = -1;
    this.steam = kit.sprite('bb_steam', 0, -30);
    this.mug.addChild(this.steam);
    this.armR.hand.addChild(this.mug);

    this.head.position.set(0, NECK_Y);
    this.headBase = kit.sprite('bb_head');
    this.flush = kit.sprite('bb_flush');
    this.soot = kit.sprite('bb_soot');
    this.tuft = kit.sprite('bb_tuft', 2, -96);
    this.tuftCut = kit.sprite('bb_tuft_cut', 2, -96);
    this.eyeL = this.makeEye(-EYE.x, 1);
    this.eyeR = this.makeEye(EYE.x, -1);
    this.browL = kit.sprite('bb_brow', -20, -74);
    this.browR = kit.sprite('bb_brow', 20, -74);
    this.browR.scale.x = -1;
    this.mouth = kit.sprite('bb_mouth_smirk', 0, -13);
    this.sweat = kit.sprite('bb_sweat', 44, -80);
    this.vein = kit.sprite('bb_vein', -26, -88);
    this.head.addChild(
      this.tuft, this.tuftCut, this.headBase, this.flush, this.soot,
      this.eyeL.root, this.eyeR.root, this.browL, this.browR, this.mouth, this.sweat, this.vein,
    );

    this.inner.addChild(
      this.chair, this.legL, this.legR, this.rocket, this.torso, this.tie, this.tieSnapped, this.tieStretched,
      this.armL.root, this.head, this.armR.root,
    );
  }

  private makeArm(x: number, side: 1 | -1): ArmRig {
    const root = new Container();
    root.position.set(x, SHOULDER.y);
    root.scale.x = side;
    const upper = this.kit.sprite('bb_arm_up');
    const elbow = new Container();
    elbow.position.set(0, 30);
    const fore = this.kit.sprite('bb_arm_fore');
    const wrist = new Container();
    wrist.position.set(0, 32);
    const hand = this.kit.sprite('bb_hand_open');
    wrist.addChild(hand);
    elbow.addChild(fore, wrist);
    hand.scale.set(1.22);
    root.addChild(upper, elbow);
    return { side, root, elbow, wrist, hand };
  }

  private makeEye(x: number, side: 1 | -1): EyeRig {
    const root = new Container();
    root.position.set(x, EYE.y);
    root.scale.x = side;
    const sclera = this.kit.sprite('bb_eye');
    const pupil = this.kit.sprite('bb_pupil');
    const lid = this.kit.sprite('bb_lid_half');
    const flat = this.kit.sprite('bb_eye_closed');
    root.addChild(sclera, pupil, lid, flat);
    return { root, sclera, pupil, lid, flat, side };
  }

  /** Cosmétiques du COLLECTION BOOK (rendu seulement). Le mug doré du BOSS FIGHT n'est jamais modifié. */
  setLook(look: Pick<CosmeticLook, 'mug' | 'tie' | 'rocket'>): void {
    this.look = { mug: look.mug, tie: look.tie, rocket: look.rocket };
    this.kit.swap(this.tie, look.tie === 'polka' ? 'bb_tie_polka' : 'bb_tie');
    this.kit.swap(this.rocket, look.rocket === 'retro' ? 'bb_rocket_retro' : 'bb_rocket');
  }

  pose(anim: string, elapsedMs: number, states: Readonly<Record<string, string>>, ctx?: PoseContext): void {
    const e = Math.max(0, elapsedMs);
    let p = bossPose(anim, e);
    const bi = blendIn(anim);
    if (ctx?.prevAnim && bi > 0 && e < bi) p = blend(bossPose(ctx.prevAnim, Math.max(0, ctx.prevElapsed)), p, smooth(e / bi));

    // États.
    const seat = states.seat ?? 'none';
    this.chair.visible = seat === 'chair' || seat === 'rocket';
    this.rocket.visible = seat === 'rocket';
    const mugState = states.mug ?? 'normal';
    this.kit.swap(this.mug, mugState === 'gold' ? 'bb_mug_gold' : this.look.mug === 'okayest' ? 'bb_mug_okayest' : 'bb_mug');
    this.steam.visible = mugState === 'normal';
    this.soot.visible = states.face === 'soot';
    const tieState = states.tie ?? 'normal';
    this.tie.visible = tieState === 'normal';
    this.tieStretched.visible = tieState === 'stretched';
    this.tieSnapped.visible = tieState === 'snapped';
    const cut = states.meche === 'cut';
    this.tuft.visible = !cut;
    this.tuftCut.visible = cut;

    // Corps (pivot aux pieds : l'écrasement garde les pieds au sol).
    this.inner.position.set(p.jitter, p.bob);
    this.inner.scale.set(p.sx * p.spin, p.sy);
    this.inner.rotation = p.tilt;
    this.legL.rotation = p.legL;
    this.legR.rotation = p.legR;

    // Mouvement secondaire : cravate et touffe suivent avec retard (ressort amorti, déterministe).
    const lagX = Math.max(-80, Math.min(80, ctx?.lagX ?? 0));
    const lagY = Math.max(-80, Math.min(80, ctx?.lagY ?? 0));
    const idleSway = sin(e / 700) * 0.03;
    this.tie.rotation = Math.max(-1.4, Math.min(1.4, -lagX / 34 + idleSway - p.tilt * 0.5));
    this.tie.scale.y = Math.max(0.7, Math.min(1.25, 1 - lagY / 120));
    this.tieSnapped.rotation = this.tie.rotation * 0.6;

    const holding = mugState !== 'none';
    this.pose2Arm(this.armL, p.armL, p.elbowL, p.handL);
    this.pose2Arm(this.armR, p.armR, p.elbowR, holding ? 'grip' : p.handR);
    // Mug droit à l'écran (contre-rotation de la chaîne du bras, dont la partie sous le miroir compte à l'envers),
    // incliné pour boire.
    this.mug.rotation = this.armR.root.rotation - this.armR.elbow.rotation - this.armR.wrist.rotation - p.mugTilt;
    this.mug.visible = holding;
    this.steam.alpha = 0.55 + sin(e / 260) * 0.3;
    this.steam.position.set(sin(e / 330) * 2, -30);

    // Tête et visage.
    this.head.position.set(p.headDx, NECK_Y + p.headDy);
    this.head.rotation = p.headTilt;
    this.tuft.rotation = Math.max(-0.9, Math.min(0.9, lagX / 45 + sin(e / 610) * 0.04));
    this.tuft.scale.set(1, 1 + p.meche * 0.35 + Math.max(-0.2, Math.min(0.25, lagY / 100)));
    this.flush.visible = p.flush > 0.01;
    this.flush.alpha = p.flush;
    this.sweat.visible = p.sweat > 0.5;
    this.sweat.position.y = -80 + (e % 900) * 0.012;
    this.vein.visible = p.vein > 0.5;
    this.vein.scale.set(1 + 0.12 * sin(e / 70));
    const browY = -74 - Math.max(0, -p.brow) * 7;
    this.browL.position.y = browY;
    this.browR.position.y = browY - p.browUpR * 7;
    this.browL.rotation = p.brow * 0.42;
    this.browR.rotation = -(p.brow * 0.42) - p.browUpR * 0.25;
    this.kit.swap(this.mouth, MOUTH_TEX[p.mouth]);
    this.poseEye(this.eyeL, p.eyeL, p, e);
    this.poseEye(this.eyeR, p.eyeR, p, e);
  }

  private pose2Arm(arm: ArmRig, shoulder: number, elbow: number, hand: Hand): void {
    // Le miroir du bras droit s'applique AVANT la rotation du conteneur : on inverse le signe de l'épaule.
    arm.root.rotation = shoulder * arm.side;
    arm.elbow.rotation = -elbow;
    arm.wrist.rotation = -elbow * 0.15;
    this.kit.swap(arm.hand, HAND_TEX[hand]);
  }

  private poseEye(eye: EyeRig, state: Eye, p: BossPose, e: number): void {
    const flat = EYE_FLAT[state];
    const tex = EYE_TEX[state];
    eye.flat.visible = !!flat;
    if (flat) this.kit.swap(eye.flat, flat);
    eye.sclera.visible = eye.pupil.visible = !!tex;
    if (!tex) {
      eye.lid.visible = false;
      eye.flat.rotation = state === 'spiral' ? e / 120 : 0;
      return;
    }
    this.kit.swap(eye.sclera, tex);
    const wide = state === 'wide';
    this.kit.swap(eye.pupil, wide ? 'bb_pupil_small' : 'bb_pupil');
    // Regard : pupilles dans le blanc de l'œil (le miroir de l'œil droit est compensé).
    const range = wide ? 7 : 5;
    const px = Math.max(-range, Math.min(range, p.px)) * eye.side;
    const py = Math.max(-range, Math.min(range, p.py + (state === 'half' ? 3 : state === 'heavy' ? 4 : 0)));
    eye.pupil.position.set(px, py);
    const lidded = state === 'half' || state === 'heavy' || Math.abs(p.lidTilt) > 0.05;
    eye.lid.visible = lidded;
    if (lidded) {
      this.kit.swap(eye.lid, state === 'heavy' ? 'bb_lid_heavy' : 'bb_lid_half');
      // Paupière « ouverte » avec inclinaison seulement : on la remonte (colère / inquiétude sans mi-clos).
      eye.lid.position.y = state === 'half' || state === 'heavy' ? 0 : -9;
      eye.lid.rotation = p.lidTilt;
    }
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }
}
