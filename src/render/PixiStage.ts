/**
 * Scène Pixi : implémente SceneSink. Ne contient AUCUNE logique de manche : elle dessine le
 * FrameState qu'on lui donne (fonction pure du temps de séquence).
 */
import { Application, Container, Graphics } from 'pixi.js';
import { ALL_GADGET_PROPS } from '../content/gadgets';
import type { CharacterAnimator } from '../presentation/characterAnimator';
import type { ActorFrame, FrameState } from '../presentation/timeline';
import type { ActorId, GadgetDef } from '../presentation/types';
import type { SceneSink } from '../presenter/Presenter';
import * as office from './office';
import { BossAnimator } from './placeholder/BossAnimator';
import { CooAnimator, HandsAnimator, WendellAnimator } from './placeholder/minorCharacters';
import { C } from './placeholder/palette';

/** Zone de jeu à toujours montrer (coordonnées du monde logique 1000 × 700). */
const SAFE = { width: 920, height: 640 };

type Updater = (frame: ActorFrame, all: FrameState) => void;

export interface StageStats {
  textures: number;
  textureBytes: number;
  displayObjects: number;
  visibleActors: number;
}

function applyTransform(view: Container, f: ActorFrame): void {
  const t = f.transform;
  const depth = 1 / (1 + Math.max(-400, t.z) / 800);
  view.position.set(t.x, t.y);
  view.scale.set(t.sx * depth, t.sy * depth);
  view.rotation = t.rot;
  view.alpha = t.alpha;
  view.visible = t.alpha > 0.002;
}

export class PixiStage implements SceneSink {
  readonly app = new Application();
  private readonly world = new Container();
  private readonly updaters = new Map<ActorId, Updater>();
  private readonly views = new Map<ActorId, Container>();
  private readonly characters: CharacterAnimator<Container>[] = [];
  private readonly particles = new Graphics();
  private readonly elastic = new Graphics();
  private readonly fuseLine = new Graphics();
  private gadgetProps = new Set<ActorId>();
  private width = 1;
  private height = 1;

  async init(host: HTMLElement): Promise<void> {
    await this.app.init({
      background: 0x1b1f3b,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoStart: false,
      resizeTo: host,
      preference: 'webgl',
    });
    this.app.ticker.stop();
    host.appendChild(this.app.canvas);
    this.app.canvas.setAttribute('data-testid', 'stage');
    this.build();
    this.resize();
    new ResizeObserver(() => this.resize()).observe(host);
  }

  private resize(): void {
    // Le plugin resizeTo de Pixi n'écoute que la fenêtre : on suit aussi la taille du conteneur.
    this.app.resize();
    this.width = this.app.screen.width;
    this.height = this.app.screen.height;
  }

  private add(id: ActorId, view: Container, update?: Updater): void {
    this.views.set(id, view);
    this.world.addChild(view);
    this.updaters.set(id, (f, all) => {
      applyTransform(view, f);
      update?.(f, all);
    });
  }

  private addCharacter(animator: CharacterAnimator<Container>): void {
    this.characters.push(animator);
    this.add(animator.id, animator.view, (f) => animator.pose(f.anim, f.animElapsed, f.states));
  }

  private build(): void {
    const w = this.world;
    this.app.stage.addChild(w);
    w.addChild(office.drawBackground());

    const win = office.drawWindow();
    this.add('window', win.view, (f) => {
      win.intact.visible = f.states.main !== 'broken';
      win.broken.visible = f.states.main === 'broken';
    });
    this.add('portrait', office.drawPortrait());
    const cab = office.drawCabinet();
    this.add('cabinet', cab.view, (f) => (cab.dent.visible = f.states.main === 'dented'));
    this.add('bell', office.drawBell());
    this.add('bfBack', office.drawBfBackdrop());
    this.add('dim', new Graphics().rect(-900, -700, 1800, 1400).fill(0x000000));

    // Accessoires des gadgets.
    this.add('slingPost', office.drawSlingPost(), (f, all) => this.drawElastic(f, all));
    w.addChild(this.elastic);
    const trap = office.drawTrapdoor();
    this.add('trapdoor', trap.view, (f) => {
      trap.closed.visible = f.states.main !== 'open';
      trap.open.visible = f.states.main === 'open';
    });
    const lever = office.drawLever();
    this.add('lever', lever.view, (f) => {
      lever.view.rotation = 0;
      lever.stick.rotation = f.transform.rot;
    });
    w.addChild(this.fuseLine);
    this.add('fuse', new Container(), (f, all) => this.drawFuse(f, all));
    this.add('spark', new Graphics().star(0, 0, 6, 9, 4).fill(C.yellow).circle(0, 0, 4).fill(C.white), (f, all) => {
      const s = 1 + 0.25 * Math.sin(all.t / 30);
      this.views.get('spark')?.scale.set(s);
    });
    this.add('glow', office.drawGlow());

    this.addCharacter(new BossAnimator());
    this.addCharacter(new WendellAnimator());
    this.addCharacter(new CooAnimator());

    w.addChild(office.drawFloorFront());
    const ceiling = new Container();
    const hole = office.drawCeilingHole();
    ceiling.addChild(office.drawCeilingStrip());
    const holeWrap = new Container();
    holeWrap.addChild(hole);
    this.add('ceiling', holeWrap, (f) => (hole.visible = f.states.main === 'hole'));
    w.addChild(ceiling);
    w.setChildIndex(holeWrap, w.children.length - 1);

    const projectiles = office.drawProjectiles();
    const proj = new Container();
    for (const g of Object.values(projectiles)) proj.addChild(g);
    this.add('proj', proj, (f) => {
      for (const [kind, g] of Object.entries(projectiles)) g.visible = kind === (f.states.kind ?? 'stapler');
    });
    this.addCharacter(new HandsAnimator());
    w.addChild(this.particles);
    this.add('flash', new Graphics().rect(-900, -700, 1800, 1400).fill(C.white));
  }

  private drawElastic(f: ActorFrame, all: FrameState): void {
    const g = this.elastic;
    g.clear();
    if (!this.gadgetProps.has('slingPost')) return;
    const px = f.transform.x;
    const py = f.transform.y - 122;
    if (f.states.elastic === 'snapped') {
      g.moveTo(px - 22, py).quadraticCurveTo(px - 30, py + 30, px - 16, py + 50);
      g.moveTo(px + 22, py).quadraticCurveTo(px + 30, py + 30, px + 20, py + 46);
      g.stroke({ width: 5, color: C.red });
      return;
    }
    const boss = all.actors.boss?.transform;
    if (!boss) return;
    const bx = boss.x - 40;
    const by = boss.y - 70;
    g.moveTo(px - 22, py).lineTo(bx, by).moveTo(px + 22, py).lineTo(bx, by).stroke({ width: 5, color: C.red });
  }

  private drawFuse(f: ActorFrame, all: FrameState): void {
    const g = this.fuseLine;
    g.clear();
    if (!this.gadgetProps.has('fuse') || f.states.main === 'burnt') return;
    const end = f.states.main === 'lit' ? (all.actors.spark?.transform.x ?? 952) : 952;
    g.moveTo(716, 556).quadraticCurveTo((716 + end) / 2, 572, end, 552).stroke({ width: 4, color: 0x3b2a1a });
  }

  setGadget(gadget: GadgetDef): void {
    this.gadgetProps = new Set(gadget.props);
    for (const id of ALL_GADGET_PROPS) {
      const v = this.views.get(id);
      if (v) v.visible = this.gadgetProps.has(id);
    }
  }

  render(frame: FrameState): void {
    for (const [id, update] of this.updaters) {
      const f = frame.actors[id];
      const view = this.views.get(id);
      if (!view) continue;
      if (!f || (ALL_GADGET_PROPS.includes(id) && !this.gadgetProps.has(id))) {
        view.visible = false;
        if (id === 'slingPost') this.elastic.clear();
        if (id === 'fuse') this.fuseLine.clear();
        continue;
      }
      update(f, frame);
    }
    this.drawParticles(frame);
    const cam = frame.camera;
    const base = Math.min(this.width / SAFE.width, this.height / SAFE.height);
    const s = base * cam.zoom;
    this.world.scale.set(s);
    this.world.pivot.set(cam.x, cam.y);
    this.world.rotation = cam.rot;
    this.world.position.set(this.width / 2 + cam.shakeX * base, this.height / 2 + cam.shakeY * base);
  }

  private drawParticles(frame: FrameState): void {
    const g = this.particles;
    g.clear();
    for (let i = 0; i < frame.particleCount; i++) {
      const p = frame.particles[i];
      if (!p) break;
      if (p.shape === 'circle') {
        g.circle(p.x, p.y, p.size / 2).fill({ color: p.color, alpha: p.alpha });
      } else {
        const h = p.size / 2;
        const w = p.size / 3;
        const c = Math.cos(p.rot);
        const s = Math.sin(p.rot);
        g.poly([
          p.x - h * c + w * s, p.y - h * s - w * c,
          p.x + h * c + w * s, p.y + h * s - w * c,
          p.x + h * c - w * s, p.y + h * s + w * c,
          p.x - h * c - w * s, p.y - h * s + w * c,
        ]).fill({ color: p.color, alpha: p.alpha });
      }
    }
  }

  /** Dessine l'image courante. */
  draw(): void {
    this.app.render();
  }

  stats(): StageStats {
    let textures = 0;
    let textureBytes = 0;
    const managed = (this.app.renderer as unknown as { texture?: { managedTextures?: readonly { pixelWidth: number; pixelHeight: number }[] } }).texture?.managedTextures ?? [];
    for (const t of managed) {
      textures++;
      textureBytes += t.pixelWidth * t.pixelHeight * 4;
    }
    // Tampons d'affichage (couleur, double tampon) : estimation.
    const res = this.app.renderer.resolution;
    textureBytes += this.width * this.height * res * res * 4 * 2;
    let displayObjects = 0;
    const count = (c: Container) => {
      displayObjects++;
      for (const child of c.children) count(child);
    };
    count(this.app.stage);
    let visibleActors = 0;
    for (const v of this.views.values()) if (v.visible && v.alpha > 0.002) visibleActors++;
    return { textures, textureBytes, displayObjects, visibleActors };
  }
}
