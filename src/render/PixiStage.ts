/**
 * Scène Pixi : implémente SceneSink. Ne contient AUCUNE logique de manche : elle dessine le
 * FrameState qu'on lui donne (fonction pure du temps de séquence).
 *
 * Phase 0.6 (ART BIBLE) : bureau en couches 2.5D avec parallaxe discrète, lumière pré-calculée (rayon de la fenêtre,
 * ombres de contact, vignettage), rigs illustrés, particules en sprites d'atlas, traînées de vitesse, image d'impact.
 * Tout reste une fonction du FrameState : replay, reprise et seek donnent la même image.
 */
import { Application, Container, Graphics, Point, Sprite, Texture } from 'pixi.js';
import { ALL_GADGET_PROPS, planGadgets } from '../content/gadgets';
import { FUSE, SAFE_HANG } from '../content/gadgets/stations';
import { PLAN_SLOTS, type PlanSlot } from '../domain/plans';
import type { RageLevelId } from '../domain/types';
import type { CharacterAnimator, PoseContext } from '../presentation/characterAnimator';
import type { VfxId } from '../presentation/types';
import type { ActorFrame, FrameState } from '../presentation/timeline';
import type { ActorId, GadgetDef } from '../presentation/types';
import type { SceneSink } from '../presenter/Presenter';
import { loadTextures } from './art/atlas';
import { DEFERRED_BOOKS, PLAN_BOOK, scaledBooks, TROPHY_BOOK } from './art/books';
import { BossRig, CHAIR_SCALE } from './art/BossRig';
import { CooRig, HandsRig, WendellRig } from './art/castRigs';
import { ArtKit } from './art/kit';
import { drawCeiling, drawFloor, drawPlayerDesk, drawWall, FLOOR_Y, makeGradeCanvas, paintGrade, WindowView } from './art/officeScene';
import { hex } from './art/palette';
import { DEFAULT_LOOK, type CosmeticLook } from './cosmeticLook';
import * as office from './office';
import { holo, TrophyLayer } from './TrophyLayer';
import type { GadgetTier, TrophyState, TrophyUnlock } from '../collection/trophies';

/**
 * Zone de jeu à toujours montrer (coordonnées du monde logique 1000 × 700).
 * En portrait, on recadre plus serré : la caméra suit l'action (contenu), pas les bords du bureau.
 */
const SAFE_LANDSCAPE = { width: 920, height: 640 };

/**
 * Cadrage PORTRAIT adaptatif (rendu seulement : fonction pure du FrameState, donc reprise et replay identiques).
 * - largeur utile resserrée sur l'action ;
 * - sol ancré à 62 % de la hauteur : le boss remonte, le premier plan (bureau du joueur) remplit le bas ;
 * - la caméra suit partiellement le boss (point focal) tant qu'il est visible, et retombe sur la caméra du contenu
 *   quand il quitte le cadre (fenêtre, trappe, plafond).
 */
const PORTRAIT = { width: 640, minHeight: 600, floorY: 560, floorAt: 0.62, follow: 0.45, restY: 350, topMargin: 14 };

/** Parallaxe (ART BIBLE §6) : fond lent, premier plan rapide ; le ciel de la fenêtre encore plus lent. */
const PARALLAX = { bg: 0.96, fg: 1.08, sky: 0.8, restX: 500 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const INK = hex('ink');

type Updater = (frame: ActorFrame, all: FrameState) => void;

/** POC « 3 PLANS » : état du choix affiché dans le décor (READY seulement). Rendu seulement. */
export interface PlanUi {
  selected: PlanSlot | null;
  hover: PlanSlot | null;
}

/** Zone cliquable d'un plan, en pixels CSS du canevas. */
export interface PlanRect {
  slot: PlanSlot;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * PRODUCTION 3 GADGETS, paysage : cadrage un peu plus bas et plus haut, pour que les appareils posés sur le bureau
 * du joueur restent entiers SOUS la ligne du sol de la pièce (ils ne cachent plus B.B. ni son bureau).
 * Rendu seulement, identique au repos et pendant la manche.
 */
const PLANS_LANDSCAPE = { width: 920, height: 740, dy: 56, fgY: -4 };

/** Fondu des plans non choisis au tir (ms de temps de séquence). */
const PLAN_FADE_MS = 260;

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

/** Texture d'atlas et mode de teinte de chaque effet. */
const FX_ART: Record<VfxId, { tex: string; tint: boolean; grow?: number }> = {
  dust: { tex: 'fx_puff', tint: true, grow: 0.7 },
  smoke: { tex: 'fx_puff', tint: true, grow: 0.9 },
  soot: { tex: 'fx_puff', tint: true, grow: 0.5 },
  sparks: { tex: 'fx_spark', tint: false },
  glass: { tex: 'fx_shard', tint: false },
  papers: { tex: 'fx_paper', tint: false },
  confetti: { tex: 'fx_confetti', tint: true },
  flame: { tex: 'fx_flame', tint: false },
  stars: { tex: 'fx_star', tint: false },
  gold: { tex: 'fx_sparkle', tint: false },
  foam: { tex: 'fx_bubble', tint: false },
  feathers: { tex: 'fx_feather', tint: true },
  hair: { tex: 'fx_strand', tint: true },
  burst: { tex: 'fx_burst', tint: false, grow: 0.25 },
  debris: { tex: 'fx_debris', tint: false },
  leaves: { tex: 'fx_leaf', tint: false },
  steam: { tex: 'fx_puff', tint: true, grow: 0.9 },
  coffee: { tex: 'fx_puff', tint: true, grow: 0.2 },
  water: { tex: 'fx_bubble', tint: true, grow: 0.1 },
  swirl: { tex: 'fx_strand', tint: true, grow: 0.6 },
};

/** Habillage des mondes RAGE (ART BIBLE §9) : teintes d'étalonnage et accessoires. Rendu seulement. */
interface WorldGrade {
  bg: number;
  room: number;
  cast: number;
  ceiling: number;
  fg: number;
  sky: number;
  shaft: number;
  shaftAlpha: number;
  warm: number;
  warmAlpha: number;
  vignette: number;
}

const WORLDS: Record<RageLevelId, WorldGrade> = {
  grumpy: { bg: 0xffffff, room: 0xffffff, cast: 0xffffff, ceiling: 0xffffff, fg: 0xf2e6dc, sky: 0xffffff, shaft: 0xffffff, shaftAlpha: 0.42, warm: 0xffe37a, warmAlpha: 0.3, vignette: 0.8 },
  furious: { bg: 0xffd6b8, room: 0xffe2cc, cast: 0xfff0e2, ceiling: 0xf6d2bc, fg: 0xe0b89e, sky: 0xffb48a, shaft: 0xff9e5e, shaftAlpha: 0.5, warm: 0xff9e5e, warmAlpha: 0.32, vignette: 1 },
  unhinged: { bg: 0x7f78ae, room: 0x9088bc, cast: 0xd6ceee, ceiling: 0x7a72a4, fg: 0x6a608e, sky: 0x3b3a78, shaft: 0x8fd0ff, shaftAlpha: 0.22, warm: 0xff4b4b, warmAlpha: 0.0, vignette: 1.15 },
};

export class PixiStage implements SceneSink {
  readonly app = new Application();
  private readonly world = new Container();
  private readonly bg = new Container();
  private readonly action = new Container();
  private readonly room = new Container();
  private readonly overlays = new Container();
  private readonly gadget = new Container();
  private readonly shadows = new Container();
  private readonly speed = new Container();
  private readonly cast = new Container();
  private readonly front = new Container();
  /** Appareils posés sur le bureau du joueur (calque du premier plan : même parallaxe que le bureau). */
  private readonly plansLayer = new Container();
  /** Halo de sélection dans la pièce (sous les gadgets) et sur le bureau du joueur. */
  private readonly spotRoom = new Container();
  private planSpot: Sprite | null = null;
  private planSteam: Sprite | null = null;
  private planUi: PlanUi = { selected: null, hover: null };
  private pickerActive = false;
  /** Les trois gadgets du choix en cours (null hors choix). */
  private pickSet: readonly GadgetDef[] | null = null;
  private readonly fading = new Map<ActorId, number | null>();
  private copierScreen: Graphics | null = null;
  /** Cadrage « plans » (actif si les plans sont chargés). */
  private planFraming = false;
  /** Fondu d'apparition de l'élastique quand le plan A est choisi (temps de séquence, null = à démarrer). */
  private elasticFadeFrom: number | null | undefined = undefined;
  private readonly light = new Container();
  private readonly ceiling = new Container();
  private readonly fg = new Container();
  /** Objets qui volent DEVANT la pièce (gobelet, ramette, bonbonne) : au-dessus de B.B. et du bureau du joueur. */
  private readonly frontWorld = new Container();
  private readonly particleLayer = new Container();
  private readonly screen = new Container();
  private readonly updaters = new Map<ActorId, Updater>();
  private readonly views = new Map<ActorId, Container>();
  private readonly characters: CharacterAnimator<Container>[] = [];
  private readonly poseContexts = new Map<string, PoseContext>();
  private readonly elastic = new Graphics();
  private readonly fuseLine = new Graphics();
  private readonly impactPlane = new Graphics();
  private readonly cable = new Graphics();
  /** Corde du coffre-fort (du moteur du ventilateur jusqu'au coffre). */
  private readonly safeRope = new Graphics();
  private readonly particlePool: Sprite[] = [];
  private readonly shadowOf = new Map<ActorId, Sprite>();
  private readonly speedLines: Sprite[] = [];
  private readonly dressing = new Container();
  private readonly ceilingDressing = new Container();
  private readonly motes: Sprite[] = [];
  private kit: ArtKit | null = null;
  private windowView: WindowView | null = null;
  private portraitInner: Container | null = null;
  private corkSprite: Sprite | null = null;
  private certSprite: Sprite | null = null;
  private plantInner: Container | null = null;
  private fanInner: Container | null = null;
  private ceilingLights: Sprite[] = [];
  /** Objets hauts du premier plan : seulement en portrait (en paysage, seule la bordure du bureau apparaît). */
  private fgTall: Sprite[] = [];
  private shaft: Sprite | null = null;
  private vignette: Sprite | null = null;
  private gradeCanvas: HTMLCanvasElement | null = null;
  private alarm: Graphics | null = null;
  private pouch: Sprite | null = null;
  private gadgetProps = new Set<ActorId>();
  private width = 1;
  private height = 1;
  private look: CosmeticLook = DEFAULT_LOOK;
  private boss: BossRig | null = null;
  private wendell: WendellRig | null = null;
  private duck: Sprite | null = null;
  private trapView: Container | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private worldLevel: RageLevelId = 'grumpy';
  /**
   * Transition de monde (rendu seulement, 500 ms d'horloge de présentation) : GRUMPY→FURIOUS dégradation,
   * →UNHINGED chaos, retour vers un niveau plus calme : nettoyage cartoon. Le nouvel habillage s'applique à mi-course.
   */
  private transition: { kind: 'degrade' | 'chaos' | 'cleanup'; to: RageLevelId; start: number | null; applied: boolean } | null = null;
  private readonly transitionFx = new Graphics();
  private readonly transitionPapers: Sprite[] = [];
  private started = false;
  /** Scène hors écran (vignettes) : jamais de transition (chaque vignette doit montrer son monde tout de suite). */
  private offscreen = false;
  /** DEV (concepts, captures) : impose l'habillage d'un monde, quel que soit le gadget. */
  worldOverride: RageLevelId | null = null;
  /** TROPHÉES VISIBLES de la collection (HALL OF SHAME, cicatrices, étapes du bureau) : null si la collection est inactive. */
  private trophyLayer: TrophyLayer | null = null;
  /** GADGETS DE LÉGENDE : niveau de chaque gadget (rendu seulement) et aura de chaque plan affiché. */
  private tiers: Record<string, GadgetTier> = {};
  private readonly tierBursts = new Map<string, number | null>();
  private readonly auraPool: { aura: Sprite; twinkles: Sprite[] }[] = [];
  private currentGadget: GadgetDef | null = null;
  /** Livres différés (FURIOUS, UNHINGED, plans B/C) arrivés : attendu avant la première manche. */
  artReady: Promise<void> = Promise.resolve();

  /**
   * `offscreen` : scène secondaire (vignettes du COLLECTION BOOK) — tampon conservé pour la lecture des pixels,
   * résolution 1, pas d'identifiant de test.
   */
  async init(host: HTMLElement, options: { offscreen?: boolean; plans?: boolean; trophies?: boolean } = {}): Promise<void> {
    this.offscreen = options.offscreen === true;
    await this.app.init({
      background: hex('ink'),
      antialias: true,
      autoDensity: true,
      resolution: options.offscreen ? 1 : Math.min(window.devicePixelRatio || 1, 2),
      autoStart: false,
      resizeTo: host,
      preference: 'webgl',
      preserveDrawingBuffer: options.offscreen === true,
    });
    this.app.ticker.stop();
    host.appendChild(this.app.canvas);
    if (!options.offscreen) this.app.canvas.setAttribute('data-testid', 'stage');
    // Vignettes (hors écran) : atlas à demi-densité, largement suffisants pour une carte de 320 px.
    // Plans B/C : petite page d'atlas des gadgets posés sur le bureau du joueur, chargée seulement dans ce mode.
    const books = scaledBooks(options.offscreen ? 0.5 : 1);
    // Trophées de la collection : seulement si elle est active (jamais dans les vignettes, le replay par URL ni sur Stake).
    const all = [...books, ...(options.plans ? [PLAN_BOOK] : []), ...(options.trophies && !options.offscreen ? [TROPHY_BOOK] : [])];
    // LOT 6 (perf) : la scène de jeu se construit avec les livres de base (bureau, personnages, décor) ; les livres
    // d'un Rage Level (FURIOUS, UNHINGED) et des plans B/C arrivent juste après, en arrière-plan (`artReady`).
    // Les vignettes chargent tout d'un coup (elles photographient n'importe quel monde tout de suite).
    const deferred = options.offscreen ? [] : all.filter((b) => DEFERRED_BOOKS.has(b.id));
    const { textures } = await loadTextures(all.filter((b) => !deferred.includes(b)));
    this.kit = new ArtKit(textures, deferred.flatMap((b) => b.parts));
    this.build(this.kit);
    const kit = this.kit;
    this.artReady = deferred.length ? loadTextures(deferred).then(({ textures: more }) => kit.provide(more)) : Promise.resolve();
    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
  }

  /** Cosmétiques (COLLECTION BOOK) : rendu seulement, jamais un cue ni une durée. */
  setCosmetics(look: CosmeticLook): void {
    this.look = look;
    this.boss?.setLook(look);
    if (this.duck) this.duck.visible = look.duck;
    if (this.trapView) this.trapView.tint = look.trapdoor === 'arctic' ? 0x9be7ff : 0xffffff;
  }

  /**
   * TROPHÉES VISIBLES (collection) : HALL OF SHAME, cicatrices, étapes du bureau, blessures de B.B., niveaux des gadgets.
   * `unlocks` : ce qui vient d'apparaître (mis en scène). Rendu seulement, jamais un cue ni une durée.
   */
  setTrophies(state: TrophyState, unlocks: readonly TrophyUnlock[] = []): void {
    this.trophyLayer?.set(state, unlocks);
    this.boss?.setInjuries(state.injuries, unlocks.flatMap((u) => (u.kind === 'injury' ? [u.injury] : [])));
    this.tiers = { ...state.tiers };
    for (const u of unlocks) if (u.kind === 'tier') this.tierBursts.set(u.gadgetId, null);
  }

  /** DEV, tests : photos affichées au mur. */
  get trophyPhotoCount(): number {
    return this.trophyLayer?.photoCount ?? 0;
  }

  /**
   * GADGETS DE LÉGENDE : aura derrière chaque gadget selon son niveau (TUNED chrome, NEON magenta/cyan, LEGENDARY
   * holographique ; jamais l'or du BOSS FIGHT). Au choix du plan : les trois ; pendant la manche : le gadget joué, atténué.
   */
  private drawTierAuras(frame: FrameState): void {
    const kit = this.kit;
    if (!kit || !kit.has('tr_aura')) return;
    const list = this.pickerActive && this.pickSet ? this.pickSet : this.currentGadget ? [this.currentGadget] : [];
    const clock = frame.clock;
    for (let i = 0; i < 3; i++) {
      let pool = this.auraPool[i];
      if (!pool) {
        const aura = kit.sprite('tr_aura');
        aura.blendMode = 'add';
        const twinkles = [0, 1, 2, 3].map(() => {
          const t = kit.sprite('tr_twinkle');
          t.blendMode = 'add';
          return t;
        });
        pool = { aura, twinkles };
        this.auraPool[i] = pool;
      }
      const g = list[i];
      const tier = g ? (this.tiers[g.id] ?? 0) : 0;
      const pick = g?.pick;
      const show = !!pick && tier > 0 && (this.pickerActive || i === 0);
      pool.aura.visible = show;
      pool.twinkles.forEach((t) => (t.visible = show && tier >= 2));
      if (!show || !pick || !g) continue;
      const layer = pick.layer === 'front' ? this.plansLayer : this.spotRoom;
      if (pool.aura.parent !== layer) {
        layer.addChildAt(pool.aura, 0);
        for (const t of pool.twinkles) layer.addChild(t);
      }
      const b = pick.box;
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const r = Math.max(b.w, b.h);
      let burst = 0;
      const start = this.tierBursts.get(g.id);
      if (start !== undefined) {
        const t0 = start ?? clock;
        if (start === null) this.tierBursts.set(g.id, clock);
        const k = (clock - t0) / 1200;
        burst = k < 1 ? Math.sin(Math.PI * k) : 0;
        if (k >= 1) this.tierBursts.delete(g.id);
      }
      const dim = this.pickerActive ? 1 : 0.5;
      const pulse = 1 + 0.05 * Math.sin(clock / 520 + i);
      pool.aura.position.set(cx, cy);
      pool.aura.scale.set(((r * 1.45) / 160) * pulse * (1 + 1.2 * burst));
      pool.aura.tint = tier === 1 ? 0xbfe8ff : tier === 2 ? (Math.sin(clock / 500 + i) > 0 ? 0xff4fd8 : 0x4ff0ff) : holo(clock, i / 3);
      pool.aura.alpha = Math.min(1, (tier === 1 ? 0.45 : tier === 2 ? 0.6 : 0.7) * dim + 0.5 * burst);
      pool.twinkles.forEach((t, j) => {
        const a = clock / 900 + (j * Math.PI) / 2 + i;
        t.position.set(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.38);
        t.scale.set(0.7 + 0.35 * Math.sin(clock / 180 + j * 1.7));
        t.tint = tier === 3 ? holo(clock, j / 4) : j % 2 ? 0x4ff0ff : 0xff9ff0;
        t.alpha = 0.85 * dim;
      });
    }
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.app.destroy(true, { children: true });
  }

  private resize(): void {
    // Le plugin resizeTo de Pixi n'écoute que la fenêtre : on suit aussi la taille du conteneur.
    this.app.resize();
    this.width = this.app.screen.width;
    this.height = this.app.screen.height;
    this.vignette?.setSize(this.width, this.height);
  }

  private add(id: ActorId, view: Container, update?: Updater, layer: Container = this.room): void {
    this.views.set(id, view);
    layer.addChild(view);
    this.updaters.set(id, (f, all) => {
      applyTransform(view, f);
      update?.(f, all);
    });
  }

  private addCharacter(animator: CharacterAnimator<Container>, layer: Container = this.cast): void {
    this.characters.push(animator);
    const ctx: PoseContext = { prevAnim: null, prevElapsed: 0, vx: 0, vy: 0, lagX: 0, lagY: 0 };
    this.poseContexts.set(animator.id, ctx);
    this.add(animator.id, animator.view, (f) => {
      ctx.prevAnim = f.prevAnim;
      ctx.prevElapsed = f.prevElapsed;
      ctx.vx = f.motion.vx;
      ctx.vy = f.motion.vy;
      ctx.lagX = f.motion.lagX;
      ctx.lagY = f.motion.lagY;
      animator.pose(f.anim, f.animElapsed, f.states, ctx);
    }, layer);
  }

  /** Accessoire posé sur un conteneur intérieur (l'habillage peut l'incliner sans toucher au transform de l'acteur). */
  private wrap(...children: Container[]): { outer: Container; inner: Container } {
    const outer = new Container();
    const inner = new Container();
    inner.addChild(...children);
    outer.addChild(inner);
    return { outer, inner };
  }

  private build(kit: ArtKit): void {
    const w = this.world;
    this.app.stage.addChild(w, this.screen);
    this.action.addChild(this.room, this.overlays, this.spotRoom, this.gadget, this.shadows, this.impactPlane, this.speed, this.cast, this.front, this.light);
    w.addChild(this.bg, this.action, this.ceiling, this.fg);

    // ---------------------------------------------------------------- fond (parallaxe lente)
    this.bg.addChild(drawWall());
    const win = new WindowView(kit);
    this.windowView = win;
    this.add('window', win.view, (f) => win.setBroken(f.states.main === 'broken'), this.bg);
    this.corkSprite = kit.sprite('cork', 440, 132);
    this.bg.addChild(this.corkSprite);
    const clock = new Container();
    clock.position.set(716, 140);
    const hourHand = kit.sprite('clock_hand');
    const minuteHand = kit.sprite('clock_hand_long');
    hourHand.rotation = 0.9;
    minuteHand.rotation = -0.4;
    clock.addChild(kit.sprite('clock'), hourHand, minuteHand);
    this.bg.addChild(clock);
    this.certSprite = kit.sprite('certificate', 846, 206);
    this.bg.addChild(this.certSprite);
    const portrait = this.wrap(kit.sprite('portrait'));
    this.portraitInner = portrait.inner;
    this.add('portrait', portrait.outer, undefined, this.bg);
    this.bg.addChild(this.dressing);

    // ---------------------------------------------------------------- plan d'action : sol et pièces du bureau
    this.room.addChild(drawFloor());
    const cab = kit.sprite('cabinet');
    const dent = kit.sprite('cabinet_dent');
    this.add('cabinet', this.wrap(cab, dent).outer, (f) => (dent.visible = f.states.main === 'dented'));
    const elevator = new Container();
    const elevLamp = kit.sprite('elevator_lamp', 0, -305);
    const elevDent = kit.sprite('elevator_dent');
    elevator.addChild(kit.sprite('elevator'), elevLamp, elevDent);
    this.add('elevator', elevator, (f) => {
      elevLamp.tint = f.states.main === 'arrived' ? hex('plant') : f.states.main === 'moving' ? hex('tie') : hex('inkSoft');
      elevLamp.scale.y = f.states.main === 'moving' ? -1 : 1;
      elevDent.visible = f.states.dent === 'yes';
    });
    const plant = this.wrap(kit.sprite('plant'));
    this.plantInner = plant.inner;
    this.add('plant', plant.outer);
    const nozzle = kit.sprite('ext_nozzle', 6, -80);
    this.add('extinguisher', this.wrap(kit.sprite('extinguisher', 0, 0), nozzle).outer, (f) => (nozzle.rotation = f.states.main === 'fired' ? -0.6 : 0));
    const fanMotor = kit.sprite('fan_motor');
    const blades = kit.sprite('fan_blades', 0, 36);
    const droop = kit.sprite('fan_droop', 0, 32);
    const fan = this.wrap(fanMotor, blades, droop);
    this.fanInner = fan.inner;
    this.add('fan', fan.outer, (f) => {
      const broken = f.states.main === 'broken';
      blades.visible = !broken;
      droop.visible = broken;
      // Rotation = fonction du temps propre de l'acteur (séquence + attente) : reprise et replay identiques.
      blades.scale.x = Math.cos(f.animElapsed * (this.worldLevel === 'unhinged' ? 0.006 : 0.012));
    });
    const desk = kit.sprite('desk', 730, FLOOR_Y);
    this.room.addChild(desk);
    const monitor = kit.sprite('monitor');
    const crack = kit.sprite('monitor_crack');
    this.add('monitor', this.wrap(monitor, crack).outer, (f) => {
      const broken = f.states.main === 'broken';
      kit.swap(monitor, broken ? 'monitor_broken' : 'monitor');
      crack.visible = !broken && this.worldLevel !== 'grumpy';
    });
    this.add('bell', kit.sprite('bell'));

    // TROPHÉES VISIBLES (collection active) : mur, sol, plafond et bureau de B.B. gardent les traces de la vengeance.
    if (kit.has('tr_polaroid')) {
      const tl = new TrophyLayer(kit);
      this.trophyLayer = tl;
      this.bg.addChild(tl.wall);
      this.room.addChildAt(tl.floor, 1);
      this.room.addChild(tl.desk);
    }

    // Superpositions plein cadre du contenu (BOSS FIGHT, assombrissement).
    this.add('bfBack', office.drawBfBackdrop(), undefined, this.overlays);
    this.add('dim', new Graphics().rect(-1400, -700, 2800, 1400).fill(INK), undefined, this.overlays);

    // ---------------------------------------------------------------- accessoires des gadgets
    this.add('slingPost', kit.sprite('sling_post'), (f, all) => this.drawElastic(f, all), this.gadget);
    this.gadget.addChild(this.elastic);
    this.pouch = kit.sprite('sling_pouch');
    this.gadget.addChild(this.pouch);
    this.buildTrapdoor(kit);
    this.gadget.addChild(this.fuseLine);
    this.add('fuse', new Container(), (f, all) => this.drawFuse(f, all), this.gadget);
    const spark = kit.sprite('fx_spark');
    this.add('spark', spark, (_f, all) => spark.scale.set(1 + 0.25 * Math.sin(all.t / 30)), this.gadget);
    this.add('glow', office.drawGlow(), undefined, this.gadget);
    const chairTex = kit.sprite('bb_chair', 0, 4);
    chairTex.scale.set(CHAIR_SCALE);
    const rocketTex = kit.sprite('bb_rocket', 0, -8);
    const chair = new Container();
    chair.addChild(chairTex, rocketTex);
    this.add('chairProp', chair, (f) => {
      rocketTex.visible = f.states.kind === 'rocket';
      chairTex.visible = true;
      kit.swap(rocketTex, this.look.rocket === 'retro' ? 'bb_rocket_retro' : 'bb_rocket');
    }, this.gadget);

    // FURIOUS : classeurs-dominos (pivot au coin inférieur droit) et tiroir qui jaillit.
    if (kit.has('dom_cab1')) {
      for (const n of [1, 2, 3] as const) this.add(`dom${n}`, kit.sprite(`dom_cab${n}`), undefined, this.gadget);
      this.add('domDrawer', kit.sprite('dom_drawer'), undefined, this.gadget);
    }

    // Mug échappé (reste suspendu, tombe) : même taille que dans la main de B.B.
    const mugProp = kit.sprite('bb_mug');
    mugProp.scale.set(1.22);
    this.add('mugProp', mugProp, () => kit.swap(mugProp, this.look.mug === 'okayest' ? 'bb_mug_okayest' : 'bb_mug'), this.gadget);
    // Câble de l'écran (réaction en chaîne) : tendu ou détendu, de l'écran jusqu'au pot de la plante.
    this.gadget.addChild(this.cable);

    // PRODUCTION 3 GADGETS : appareils des plans B et C, seulement si leur atlas est chargé.
    if (kit.has('esp_body')) {
      this.planFraming = true;
      this.buildPlans(kit);
    }
    if (kit.has('cool_ramp')) {
      this.add('coolRamp', kit.sprite('cool_ramp'), undefined, this.plansLayer);
      this.add('jug', kit.sprite('cool_jug'), undefined, this.frontWorld);
    }
    if (kit.has('safe_body')) this.buildUnhinged(kit);

    // Ombres de contact (personnages).
    for (const [id, sx] of [['boss', 1.25], ['wendell', 0.75], ['coo', 0.36], ['chairProp', 0.9]] as const) {
      const s = kit.sprite('shadow');
      s.scale.set(sx, sx * 0.8);
      s.visible = false;
      this.shadows.addChild(s);
      this.shadowOf.set(id, s);
    }

    // Image d'impact : fond papier + silhouettes encre (1 à 3 images au contact).
    this.impactPlane.rect(-1600, -900, 3600, 2400).fill(hex('paper'));
    this.impactPlane.visible = false;

    // Traînées de vitesse (derrière les corps rapides).
    for (let i = 0; i < 2; i++) {
      const s = kit.sprite('fx_speed');
      s.tint = INK;
      s.visible = false;
      this.speed.addChild(s);
      this.speedLines.push(s);
    }

    // ---------------------------------------------------------------- personnages
    this.boss = new BossRig(kit);
    this.boss.setLook(this.look);
    this.addCharacter(this.boss);
    this.wendell = new WendellRig(kit);
    this.addCharacter(this.wendell);
    this.addCharacter(new CooRig(kit));
    // Portes de l'ascenseur devant les personnages : B.B. peut y attendre caché.
    this.add('elevL', kit.sprite('elevator_door_l'), undefined, this.front);
    this.add('elevR', kit.sprite('elevator_door_r'), undefined, this.front);
    // Sol de premier plan : masque le boss qui tombe dans la trappe.
    this.front.addChild(drawFloor(FLOOR_Y + 18));

    // Rayon de lumière de la fenêtre (additif) et poussière qui y flotte.
    const shaft = kit.sprite('light_shaft', 96, 292);
    shaft.scale.set(1, 0.66);
    shaft.blendMode = 'add';
    this.shaft = shaft;
    this.light.addChild(shaft);
    for (let i = 0; i < 12; i++) {
      const m = kit.sprite('fx_bubble');
      m.scale.set(0.12 + (i % 3) * 0.04);
      m.tint = hex('tieLight');
      m.alpha = 0.5;
      m.blendMode = 'add';
      this.light.addChild(m);
      this.motes.push(m);
    }

    // ---------------------------------------------------------------- plafond (devant : B.B. peut s'y encastrer)
    const ceiling = drawCeiling(kit);
    this.ceilingLights = ceiling.lights;
    this.ceiling.addChild(ceiling.view, this.ceilingDressing);
    if (this.trophyLayer) this.ceiling.addChild(this.trophyLayer.ceiling);
    const hole = kit.sprite('ceiling_hole');
    this.add('ceiling', this.wrap(hole).outer, (f) => (hole.visible = f.states.main === 'hole'), this.ceiling);

    // ---------------------------------------------------------------- premier plan
    const desk2 = drawPlayerDesk(kit, this.planFraming);
    this.fgTall = desk2.tall;
    this.duck = desk2.duck;
    this.duck.visible = this.look.duck;
    // Les appareils des plans sont posés SUR le bureau du joueur (même calque, même parallaxe).
    this.fg.addChild(desk2.view, this.plansLayer);
    w.addChild(this.frontWorld);

    const projectiles: Record<string, Container> = office.drawProjectiles();
    // BOSS FIGHT : chaque gadget lance ses propres objets sur le boss géant (variation visuelle seulement).
    const art: [string, string, number][] = [
      ['mug', 'bb_mug', 1.4], ['cup', 'esp_cup', 1.3], ['ream', 'cop_ream', 1], ['drawer', 'dom_drawer', 1.1], ['jug', 'cool_jug', 0.9],
      ['rocket', 'bb_rocket', 0.42], ['safe', 'safe_body', 0.5], ['glove', 'safe_glove', 0.8], ['monitor', 'monitor', 0.55],
    ];
    for (const [kind, tex, k] of art) {
      if (!kit.has(tex)) continue;
      const sp = kit.sprite(tex);
      sp.anchor.set(0.5);
      sp.scale.set(k);
      projectiles[kind] = sp;
    }
    const proj = new Container();
    for (const g of Object.values(projectiles)) proj.addChild(g);
    this.add('proj', proj, (f) => {
      for (const [kind, g] of Object.entries(projectiles)) g.visible = kind === (f.states.kind ?? 'stapler');
    }, w);
    this.addCharacter(new HandsRig(kit), w);
    this.add('fog', office.drawFog(), undefined, w);
    w.addChild(this.particleLayer);
    this.add('flash', new Graphics().rect(-1400, -700, 2800, 1400).fill(hex('paper')), undefined, w);

    // ---------------------------------------------------------------- étalonnage (écran) : une seule passe
    this.gradeCanvas = makeGradeCanvas();
    this.vignette = new Sprite(Texture.from(this.gradeCanvas));
    this.alarm = new Graphics().rect(0, 0, 16, 16).fill(hex('alarm'));
    this.alarm.blendMode = 'add';
    this.alarm.visible = false;
    this.screen.addChild(this.alarm, this.vignette, this.transitionFx);
    for (let i = 0; i < 10; i++) {
      const p = kit.sprite('fx_paper');
      p.visible = false;
      this.screen.addChild(p);
      this.transitionPapers.push(p);
    }
    this.applyWorld('grumpy');
  }

  // ------------------------------------------------------------------ habillage des mondes (rendu seulement)

  private applyWorld(level: RageLevelId): void {
    this.worldLevel = level;
    const g = WORLDS[level];
    const kit = this.kit;
    if (!kit) return;
    this.bg.tint = g.bg;
    this.room.tint = g.room;
    this.gadget.tint = g.room;
    this.cast.tint = g.cast;
    this.ceiling.tint = g.ceiling;
    this.fg.tint = g.fg;
    this.windowView?.setSkyTint(g.sky);
    if (this.shaft) {
      this.shaft.tint = g.shaft;
      this.shaft.alpha = g.shaftAlpha;
    }
    if (this.gradeCanvas && this.vignette) {
      paintGrade(this.gradeCanvas, g.warm, g.warmAlpha, g.vignette);
      this.vignette.texture.source.update();
    }
    if (this.wendell) this.wendell.helmetOn = level === 'unhinged';
    if (this.portraitInner) this.portraitInner.rotation = level === 'grumpy' ? 0 : level === 'furious' ? 0.1 : -0.22;
    if (this.plantInner) this.plantInner.rotation = level === 'grumpy' ? 0 : level === 'furious' ? 0.16 : 0.34;
    if (this.fanInner) this.fanInner.rotation = level === 'unhinged' ? 0.28 : 0;
    if (this.corkSprite) this.corkSprite.rotation = level === 'grumpy' ? 0 : level === 'furious' ? -0.06 : 0.1;
    if (this.certSprite) this.certSprite.rotation = level === 'grumpy' ? 0 : level === 'furious' ? 0.12 : -0.3;
    // Accessoires d'habillage.
    this.dressing.removeChildren().forEach((c) => c.destroy());
    this.ceilingDressing.removeChildren().forEach((c) => c.destroy());
    this.room.children.find((c) => c.label === 'dressing-papers')?.destroy();
    if (level === 'grumpy') return;
    const papers: [number, number, number][] = level === 'furious'
      ? [[160, 572, 0.3], [250, 590, -0.5], [880, 580, 0.8], [40, 600, 1.9]]
      : [[140, 574, 0.3], [230, 596, -0.5], [300, 612, 2.2], [880, 584, 0.8], [30, 604, 1.9], [950, 612, -1.1], [520, 640, 0.6], [760, 630, -0.3]];
    // Papiers au sol : dans la couche du sol (sous les personnages).
    const floorPapers = new Container();
    for (const [x, y, r] of papers) {
      const p = kit.sprite('fx_paper', x, y);
      p.scale.set(1.3, 0.55);
      p.rotation = r;
      floorPapers.addChild(p);
    }
    floorPapers.label = 'dressing-papers';
    this.room.addChildAt(floorPapers, 1);
    if (level === 'unhinged') {
      // Fissures du plafond, câbles pendants, fumée, gyrophare.
      const g2 = new Graphics();
      g2.moveTo(420, 60).lineTo(460, 20).lineTo(450, -30).lineTo(500, -90).moveTo(460, 20).lineTo(520, 6)
        .moveTo(760, 60).lineTo(730, 10).lineTo(760, -60).moveTo(730, 10).lineTo(690, -10)
        .stroke({ width: 3, color: hex('inkSoft') });
      g2.moveTo(520, 40).bezierCurveTo(530, 140, 560, 150, 575, 110).stroke({ width: 5, color: INK });
      g2.moveTo(880, 40).bezierCurveTo(870, 170, 840, 190, 830, 150).stroke({ width: 5, color: hex('red') });
      g2.moveTo(360, 40).bezierCurveTo(350, 120, 380, 140, 392, 118).stroke({ width: 4, color: hex('tie') });
      this.ceilingDressing.addChild(g2);
      for (const [x, y, s] of [[380, 20, 1.6], [620, -10, 2.2], [880, 30, 1.8], [160, 0, 1.4]] as const) {
        const puff = kit.sprite('fx_puff', x, y);
        puff.scale.set(s);
        puff.tint = hex('smoke');
        puff.alpha = 0.55;
        this.ceilingDressing.addChild(puff);
      }
      const stapler = kit.sprite('stuck_stapler', 330, 300);
      stapler.rotation = -0.35;
      this.dressing.addChild(stapler);
      const beacon = new Graphics();
      beacon.roundRect(-14, -4, 28, 10, 3).fill(hex('metalDark')).stroke({ width: 2, color: INK });
      beacon.arc(0, -4, 12, Math.PI, 0).fill(hex('alarm')).stroke({ width: 2, color: INK });
      beacon.position.set(640, 76);
      this.dressing.addChild(beacon);
    }
  }

  /** UNHINGED : embout de mèche, coffre-fort (et sa corde), détonateur, gant, grille, thermostat, mini-tornade. */
  private buildUnhinged(kit: ArtKit): void {
    this.add('fuseEnd', kit.sprite('fuse_end'), undefined, this.gadget);
    // Le coffre et sa corde passent DEVANT B.B. (ils lui tombent dessus).
    this.frontWorld.addChild(this.safeRope);
    const safe = new Container();
    const body = kit.sprite('safe_body');
    const open = kit.sprite('safe_open');
    safe.addChild(body, open);
    this.add('safe', safe, (f) => {
      open.visible = f.states.door === 'open';
      body.visible = !open.visible;
      const g = this.safeRope;
      g.clear();
      g.alpha = 1;
      if (!safe.visible || f.transform.alpha < 0.05) return;
      const r = SAFE_HANG.rope;
      if (f.states.rope === 'cut') {
        g.moveTo(r.x, r.y).lineTo(r.x + 4, r.y + 30).stroke({ width: 5, color: INK, cap: 'round' });
        g.moveTo(r.x, r.y).lineTo(r.x + 4, r.y + 30).stroke({ width: 2.5, color: hex('woodLight'), cap: 'round' });
        return;
      }
      const path = () => g.moveTo(r.x, r.y).quadraticCurveTo((r.x + f.transform.x) / 2 + 6, (r.y + f.transform.y) / 2, f.transform.x, f.transform.y);
      path().stroke({ width: 5, color: INK, cap: 'round' });
      path().stroke({ width: 2.5, color: hex('woodLight'), cap: 'round' });
    }, this.frontWorld);
    this.add('safeGlove', kit.sprite('safe_glove'), undefined, this.frontWorld);
    this.add('plunger', kit.sprite('plunger_box'), undefined, this.plansLayer);
    this.add('plungerHandle', kit.sprite('plunger_handle'), undefined, this.plansLayer);
    // Grille et thermostat : au mur du fond, derrière les personnages.
    this.add('vent', kit.sprite('vent_grille'), undefined, this.gadget);
    this.add('thermo', kit.sprite('thermo'), undefined, this.gadget);
    this.add('thermoNeedle', kit.sprite('thermo_needle'), undefined, this.gadget);
    const twister = kit.sprite('hvac_twister');
    twister.blendMode = 'normal';
    this.add('twister', twister, (f, all) => {
      // Tourbillon : respiration de la largeur (fonction de l'horloge : reprise et replay identiques).
      twister.scale.x *= 0.88 + 0.12 * Math.sin(all.clock / 45);
      twister.skew.x = 0.06 * Math.sin(all.clock / 90);
      void f;
    }, this.frontWorld);
  }

  /** TRAPDOOR EXPRESS : trappe (fermée, ouverte, coincée) et levier au sol ; formes placeholder si l'art manque. */
  private buildTrapdoor(kit: ArtKit): void {
    if (!kit.has('trap_closed')) {
      const trap = office.drawTrapdoor();
      this.trapView = trap.view;
      this.add('trapdoor', trap.view, (f) => {
        trap.closed.visible = f.states.main !== 'open';
        trap.open.visible = f.states.main === 'open';
        trap.jammed.visible = f.states.main === 'jammed';
      }, this.gadget);
      const lever = office.drawLever();
      this.add('lever', lever.view, (f) => {
        lever.view.rotation = 0;
        lever.stick.rotation = f.transform.rot;
      }, this.gadget);
      return;
    }
    const trap = new Container();
    const closed = kit.sprite('trap_closed');
    const open = kit.sprite('trap_open');
    const jam = kit.sprite('trap_jam');
    trap.addChild(open, closed, jam);
    this.trapView = trap;
    this.add('trapdoor', trap, (f) => {
      open.visible = f.states.main === 'open';
      closed.visible = f.states.main !== 'open';
      jam.visible = f.states.main === 'jammed';
    }, this.gadget);
    const lever = new Container();
    const stick = kit.sprite('lever_stick', 0, -26);
    lever.addChild(stick, kit.sprite('lever_base'));
    this.add('lever', lever, (f) => {
      lever.rotation = 0;
      stick.rotation = f.transform.rot;
    }, this.gadget);
  }

  private buildPlans(kit: ArtKit): void {
    const L = this.plansLayer;
    const spot = kit.sprite('plan_spot');
    spot.visible = false;
    spot.blendMode = 'add';
    this.planSpot = spot;
    L.addChild(spot);
    const steam = kit.sprite('fx_puff');
    steam.tint = hex('paper');
    steam.visible = false;
    this.planSteam = steam;
    const esp = new Container();
    esp.addChild(kit.sprite('esp_body'));
    this.add('espresso', esp, undefined, L);
    this.add('espNeedle', kit.sprite('esp_needle'), undefined, L);
    this.add('espBarrel', kit.sprite('esp_barrel'), undefined, L);
    L.addChild(steam);
    const copier = new Container();
    const screen = new Graphics().roundRect(-2, -2, 22, 12, 2).fill(hex('screenGlow'));
    screen.position.set(132 - 88, 38 - 164);
    this.copierScreen = screen;
    copier.addChild(kit.sprite('cop_body'), screen);
    this.add('copier', copier, (f, all) => {
      const st = f.states.main ?? 'idle';
      screen.visible = st !== 'idle' || this.planActive('C');
      screen.tint = st === 'jam' || st === 'berserk' ? hex('alarm') : 0xffffff;
      screen.alpha = st === 'berserk' ? (Math.sin(all.clock / 60) > 0 ? 0.9 : 0.25) : st === 'scan' ? 0.55 + 0.4 * Math.sin(all.clock / 90) : 0.7;
    }, L);
    this.add('copSheet', kit.sprite('cop_sheet'), undefined, L);
    this.add('copLid', kit.sprite('cop_lid'), undefined, L);
    // Projectiles : ils volent dans la PIÈCE (coordonnées du monde), devant B.B. (calque avant du monde).
    this.add('ream', kit.sprite('cop_ream'), undefined, this.frontWorld);
    this.add('espCup', kit.sprite('esp_cup'), undefined, this.frontWorld);
  }

  /** Animation d'attente du plan survolé ou choisi, seulement pendant le choix (READY). */
  private planActive(slot: PlanSlot): boolean {
    return this.pickerActive && (this.planUi.hover === slot || this.planUi.selected === slot);
  }

  /** Gadget d'un plan du choix en cours. */
  private pickGadget(slot: PlanSlot): GadgetDef | null {
    return this.pickSet?.[PLAN_SLOTS.indexOf(slot)] ?? null;
  }

  /** Vie d'attente (survol / sélection) : petites oscillations déclarées par chaque gadget (rendu seulement). */
  private applyPickIdle(frame: FrameState): void {
    if (!this.pickerActive || !this.pickSet) return;
    for (const slot of PLAN_SLOTS) {
      if (!this.planActive(slot)) continue;
      const pick = this.pickGadget(slot)?.pick;
      if (!pick) continue;
      for (const idle of pick.idle) {
        const v = this.views.get(idle.actor);
        if (!v?.visible) continue;
        const k = idle.amp * Math.sin((frame.clock / idle.periodMs) * Math.PI * 2);
        if (idle.prop === 'x') v.x += k;
        else if (idle.prop === 'y') v.y += k;
        else if (idle.prop === 'rot') v.rotation += k;
        else if (idle.prop === 'sx') v.scale.x *= 1 + k;
        else v.scale.y *= 1 + k;
      }
    }
  }

  /** POC « 3 PLANS » : plan survolé / choisi (rendu seulement, jamais une entrée de la manche). */
  setPlanUi(ui: PlanUi): void {
    this.planUi = ui;
  }

  /** Zones des trois plans à l'écran (pixels CSS du canevas), pour les cibles tactiles HTML. */
  planRects(): PlanRect[] {
    const out: PlanRect[] = [];
    if (!this.pickSet) return out;
    for (const slot of PLAN_SLOTS) {
      const pick = this.pickGadget(slot)?.pick;
      if (!pick) continue;
      const b = pick.box;
      const layer = pick.layer === 'front' ? this.fg : this.world;
      const p0 = layer.toGlobal(new Point(b.x, b.y));
      const p1 = layer.toGlobal(new Point(b.x + b.w, b.y + b.h));
      out.push({ slot, x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y), w: Math.abs(p1.x - p0.x), h: Math.abs(p1.y - p0.y) });
    }
    return out;
  }

  private drawPlanPicker(frame: FrameState): void {
    const spot = this.planSpot;
    const steam = this.planSteam;
    if (!spot || !steam) return;
    const sel = this.pickerActive ? this.planUi.selected : null;
    const pick = sel ? this.pickGadget(sel)?.pick : null;
    spot.visible = !!pick;
    if (pick) {
      // Halo, respiration lente (lumière douce, jamais l'or d'un gain) : au sol de la pièce ou sur le bureau.
      spot.position.set(pick.spot.x, pick.spot.y);
      const k = 1 + 0.04 * Math.sin(frame.clock / 400);
      spot.scale.set(pick.spot.sx * k, (pick.spot.sy ?? 1) * k);
      spot.alpha = 0.75;
      const layer = pick.layer === 'front' ? this.plansLayer : this.spotRoom;
      if (spot.parent !== layer) layer.addChildAt(spot, 0);
    }
    // Bouffée d'attente (vapeur, fumée) du plan survolé ou choisi, si le gadget en déclare une.
    const puffSlot = PLAN_SLOTS.find((s) => this.planActive(s) && this.pickGadget(s)?.pick?.puff);
    const puffPick = puffSlot ? this.pickGadget(puffSlot)?.pick : null;
    steam.visible = !!puffPick?.puff;
    if (puffPick?.puff) {
      const layer = puffPick.layer === 'front' ? this.plansLayer : this.spotRoom;
      if (steam.parent !== layer) layer.addChild(steam);
      const k = (frame.clock % 900) / 900;
      steam.position.set(puffPick.puff.x - 6 + 8 * Math.sin(frame.clock / 300), puffPick.puff.y - 10 - 46 * k);
      steam.scale.set(0.5 + 0.5 * k);
      steam.alpha = 0.7 * Math.sin(Math.PI * k);
    }
  }

  private drawElastic(f: ActorFrame, all: FrameState): void {
    const g = this.elastic;
    g.clear();
    if (this.pouch) this.pouch.visible = false;
    if (!this.gadgetProps.has('slingPost') || f.states.elastic === 'none') return;
    const px = f.transform.x;
    const py = f.transform.y - 122;
    const color = this.elasticColor();
    const band = (pts: number[][], width: number) => {
      const [a, b, c2] = pts as [number[], number[], number[]];
      g.moveTo(a[0] ?? 0, a[1] ?? 0).quadraticCurveTo(b[0] ?? 0, b[1] ?? 0, c2[0] ?? 0, c2[1] ?? 0).stroke({ width: width + 3.5, color: INK, cap: 'round' });
      g.moveTo(a[0] ?? 0, a[1] ?? 0).quadraticCurveTo(b[0] ?? 0, b[1] ?? 0, c2[0] ?? 0, c2[1] ?? 0).stroke({ width, color, cap: 'round' });
    };
    // POC : pendant le choix, l'élastique pend au poteau ; quand A est choisi, il réapparaît en fondu.
    g.alpha = 1;
    if (this.elasticFadeFrom !== undefined && f.states.elastic !== 'slack') {
      if (this.elasticFadeFrom === null) this.elasticFadeFrom = all.clock;
      const k = (all.clock - this.elasticFadeFrom) / PLAN_FADE_MS;
      g.alpha = Math.min(1, Math.max(0, k));
      if (k >= 1) this.elasticFadeFrom = undefined;
    }
    if (f.states.elastic === 'snapped' || f.states.elastic === 'slack') {
      const wob = Math.sin(all.clock / 45) * 6 * Math.exp(-((all.t % 100000) / 100000));
      band([[px - 22, py], [px - 34 + wob, py + 26], [px - 18, py + 52]], 5);
      band([[px + 22, py], [px + 34 - wob, py + 22], [px + 20, py + 48]], 5);
      return;
    }
    const boss = all.actors.boss?.transform;
    if (!boss) return;
    const bx = boss.x - 52;
    const by = boss.y - 58;
    // Tension : l'élastique tremble d'autant plus qu'il est étiré (fonction du temps : déterministe).
    const len = Math.hypot(bx - px, by - py);
    const tension = clamp01((len - 260) / 160);
    // POC « 3 PLANS » : au survol / à la sélection du plan A (READY), l'élastique vibre.
    const tremble = Math.sin(all.clock / 16) * 5 * tension + (this.planActive('A') ? Math.sin(all.clock / 34) * 5 : 0);
    const sag = 18 * (1 - tension);
    for (const dx of [-22, 22]) {
      const ax = px + dx;
      band([[ax, py], [(ax + bx) / 2, (py + by) / 2 + sag + tremble], [bx, by]], 6 - tension * 2);
    }
    if (this.pouch) {
      this.pouch.visible = true;
      this.pouch.position.set(bx, by);
      this.pouch.rotation = Math.atan2(by - py, bx - px) - Math.PI;
    }
  }

  private elasticColor(): number {
    return this.look.elastic === 'candy' ? 0xff7eb6 : hex('elastic');
  }

  private drawFuse(f: ActorFrame, all: FrameState): void {
    const g = this.fuseLine;
    g.clear();
    if (!this.gadgetProps.has('fuse') || f.states.main === 'burnt') return;
    const end = f.states.main === 'lit' ? (all.actors.spark?.transform.x ?? FUSE.to.x) : FUSE.to.x;
    const path = () => g.moveTo(FUSE.from.x, FUSE.from.y).quadraticCurveTo((FUSE.from.x + end) / 2, 572, end, FUSE.to.y);
    path().stroke({ width: 6, color: INK, cap: 'round' });
    path().stroke({ width: 3, color: hex('coffee'), cap: 'round' });
  }

  setGadget(gadget: GadgetDef): void {
    this.currentGadget = gadget;
    // Au tir, les plans non choisis s'effacent en fondu (au lieu de disparaître d'un coup).
    const wasPicker = this.pickerActive;
    this.pickerActive = gadget.id === 'plan-picker';
    this.pickSet = this.pickerActive ? planGadgets(gadget.rageLevel) : null;
    this.fading.clear();
    if (wasPicker && !this.pickerActive) {
      for (const id of this.gadgetProps) if (!gadget.props.includes(id)) this.fading.set(id, null);
      if (gadget.props.includes('slingPost')) this.elasticFadeFrom = null;
    } else {
      this.elasticFadeFrom = undefined;
    }
    this.gadgetProps = new Set(gadget.props);
    for (const id of ALL_GADGET_PROPS) {
      const v = this.views.get(id);
      if (v) v.visible = this.gadgetProps.has(id);
    }
    const level = this.worldOverride ?? gadget.rageLevel;
    const target = this.transition?.to ?? this.worldLevel;
    if (level !== target) {
      if (!this.started || this.worldOverride || this.offscreen) this.applyWorld(level);
      else {
        const order: RageLevelId[] = ['grumpy', 'furious', 'unhinged'];
        const up = order.indexOf(level) > order.indexOf(target);
        this.transition = { kind: !up ? 'cleanup' : level === 'unhinged' ? 'chaos' : 'degrade', to: level, start: null, applied: false };
      }
    }
  }

  /** Transition de monde en cours (rendu seulement ; fonction de l'horloge de présentation). */
  private drawTransition(frame: FrameState): { dx: number; dy: number; rot: number } {
    const tr = this.transition;
    const g = this.transitionFx;
    g.clear();
    for (const p of this.transitionPapers) p.visible = false;
    if (!tr) return { dx: 0, dy: 0, rot: 0 };
    if (tr.start === null || frame.clock < tr.start) tr.start = frame.clock;
    const k = Math.min(1, (frame.clock - tr.start) / 500);
    if (!tr.applied && k >= 0.5) {
      tr.applied = true;
      this.applyWorld(tr.to);
    }
    const w = this.width;
    const h = this.height;
    const bump = Math.sin(Math.PI * k);
    let dx = 0;
    let dy = 0;
    let rot = 0;
    if (tr.kind === 'degrade') {
      // Dégradation : bouffée chaude, papiers qui tombent, secousse.
      g.rect(0, 0, w, h).fill({ color: hex('dusk'), alpha: 0.45 * bump });
      this.transitionPapers.forEach((p, i) => {
        p.visible = true;
        p.position.set(((i * 97) % 10) * (w / 10) + 20, -40 + k * (h + 80) * (0.6 + ((i * 37) % 5) / 10));
        p.rotation = k * 6 + i;
        p.alpha = bump;
        p.scale.set(1.4);
      });
      dx = Math.sin(frame.clock / 18) * 6 * bump;
      rot = 0.012 * Math.sin(frame.clock / 40) * bump;
    } else if (tr.kind === 'chaos') {
      // Chaos : deux coupures de courant (≤ 3 Hz), alarme rouge, secousse sèche.
      const dark = (k > 0.18 && k < 0.3) || (k > 0.5 && k < 0.62) ? 0.7 : 0;
      g.rect(0, 0, w, h).fill({ color: hex('nightDeep'), alpha: dark });
      g.rect(0, 0, w, h).fill({ color: hex('alarm'), alpha: 0.28 * bump });
      dy = Math.sin(frame.clock / 14) * 8 * bump;
      rot = -0.018 * bump;
    } else {
      // Nettoyage cartoon : une bande « papier » balaie l'écran de gauche à droite, avec des éclats.
      const x = -w * 0.3 + k * w * 1.6;
      g.rect(x - w * 0.18, 0, w * 0.18, h).fill({ color: hex('paper'), alpha: 0.85 * bump });
      g.rect(x - w * 0.24, 0, w * 0.05, h).fill({ color: hex('paper'), alpha: 0.4 * bump });
      for (let i = 0; i < 6; i++) g.star(x + 6, (h / 6) * i + 30, 4, 8, 3).fill({ color: hex('skyLight'), alpha: bump });
    }
    if (k >= 1) this.transition = null;
    return { dx, dy, rot };
  }

  /** DEV : habillage imposé (concepts). null : suit le gadget. */
  setWorldOverride(level: RageLevelId | null, fallback: RageLevelId = 'grumpy'): void {
    this.worldOverride = level;
    this.applyWorld(level ?? fallback);
  }

  render(frame: FrameState): void {
    for (const [id, update] of this.updaters) {
      const f = frame.actors[id];
      const view = this.views.get(id);
      if (!view) continue;
      const fade = this.fading.get(id);
      if (fade !== undefined) {
        // Plan non choisi : même pose qu'au dernier instant du choix, opacité qui décroît.
        const start = fade ?? frame.clock;
        if (fade === null) this.fading.set(id, start);
        const k = 1 - (frame.clock - start) / PLAN_FADE_MS;
        view.visible = k > 0;
        view.alpha = Math.max(0, k);
        if (k <= 0) this.fading.delete(id);
        if (id === 'safe') this.safeRope.alpha = view.alpha;
        if (id === 'slingPost') {
          // L'élastique n'appartient qu'au plan A : il disparaît tout de suite (il suivrait sinon un B.B. qui bouge).
          this.elastic.clear();
          if (this.pouch) this.pouch.visible = false;
        }
        continue;
      }
      if (!f || (ALL_GADGET_PROPS.includes(id) && !this.gadgetProps.has(id))) {
        view.visible = false;
        if (id === 'slingPost') {
          this.elastic.clear();
          if (this.pouch) this.pouch.visible = false;
        }
        if (id === 'fuse') this.fuseLine.clear();
        if (id === 'safe') this.safeRope.clear();
        continue;
      }
      update(f, frame);
    }
    this.drawCable(frame);
    this.applyPickIdle(frame);
    this.drawPlanPicker(frame);
    this.drawTierAuras(frame);
    this.trophyLayer?.render(frame.clock);
    this.boss?.tickInjuries(frame.clock);
    this.drawShadows(frame);
    this.drawSpeed(frame);
    this.drawParticles(frame);
    this.drawAmbient(frame);
    this.drawImpactFrame(frame);
    this.started = true;
    const jolt = this.drawTransition(frame);

    const cam = frame.camera;
    let base: number;
    let camX = cam.x;
    let camY = cam.y;
    const portrait = this.width / this.height < 0.8;
    if (portrait) {
      base = Math.min(this.width / PORTRAIT.width, this.height / PORTRAIT.minHeight);
      const visibleH = this.height / base;
      // Écran très haut : le sol remonte dans le cadre pour que le haut reste au plafond (le bas montre le bureau du joueur).
      const floorAt = Math.min(PORTRAIT.floorAt, (PORTRAIT.floorY + PORTRAIT.topMargin) / visibleH);
      camY = PORTRAIT.floorY - (floorAt - 0.5) * visibleH + (cam.y - PORTRAIT.restY);
      const boss = frame.actors.boss?.transform;
      if (boss) {
        const w = clamp01((boss.alpha - 0.2) / 0.3) * clamp01((720 - boss.y) / 120) * clamp01(1 - boss.z / 400);
        camX = cam.x + PORTRAIT.follow * w * (boss.x - cam.x);
      }
    } else if (this.planFraming) {
      base = Math.min(this.width / PLANS_LANDSCAPE.width, this.height / PLANS_LANDSCAPE.height);
      camY = cam.y + PLANS_LANDSCAPE.dy;
    } else {
      base = Math.min(this.width / SAFE_LANDSCAPE.width, this.height / SAFE_LANDSCAPE.height);
    }
    // Parallaxe : décalage des couches selon la position de la caméra (fonction pure du cadrage).
    const d = camX - PARALLAX.restX;
    this.bg.x = (1 - PARALLAX.bg) * d;
    this.ceiling.x = (1 - PARALLAX.bg) * d;
    this.fg.x = (1 - PARALLAX.fg) * d;
    this.fg.y = portrait ? 0 : this.planFraming ? PLANS_LANDSCAPE.fgY : -64;
    this.fgTall.forEach((item) => (item.visible = portrait));
    this.windowView?.setParallax((PARALLAX.bg - PARALLAX.sky) * d);

    const s = base * cam.zoom;
    this.world.scale.set(s);
    this.world.pivot.set(camX, camY);
    this.world.rotation = cam.rot + jolt.rot;
    this.world.position.set(this.width / 2 + cam.shakeX * base + jolt.dx, this.height / 2 + cam.shakeY * base + jolt.dy);
  }

  private drawCable(frame: FrameState): void {
    const g = this.cable;
    g.clear();
    const mon = frame.actors.monitor;
    const plant = frame.actors.plant?.transform;
    const mode = mon?.states.cable;
    if (!mon || !plant || (mode !== 'taut' && mode !== 'slack')) return;
    const ax = mon.transform.x - 30;
    const ay = mon.transform.y - 30;
    const bx = plant.x + 12;
    const by = plant.y - 40;
    const sag = mode === 'taut' ? 0 : 70;
    const path = () => g.moveTo(ax, ay).quadraticCurveTo((ax + bx) / 2, Math.max(ay, by) + sag, bx, by);
    path().stroke({ width: 6, color: INK, cap: 'round' });
    path().stroke({ width: 3, color: hex('metalDark'), cap: 'round' });
  }

  private drawShadows(frame: FrameState): void {
    for (const [id, s] of this.shadowOf) {
      const f = frame.actors[id];
      const view = this.views.get(id);
      if (!f || !view?.visible || f.transform.alpha < 0.2 || f.transform.y > FLOOR_Y + 30 || f.transform.z > 200) {
        s.visible = false;
        continue;
      }
      const h = Math.max(0, FLOOR_Y - f.transform.y);
      const k = clamp01(1 - h / 360);
      s.visible = k > 0.05;
      s.position.set(f.transform.x + h * 0.08, FLOOR_Y + 3);
      s.alpha = 0.85 * k * f.transform.alpha;
      const base = id === 'boss' ? 1.25 : id === 'wendell' ? 0.75 : id === 'coo' ? 0.36 : 0.9;
      s.scale.set(base * (0.55 + 0.45 * k), base * 0.8 * (0.55 + 0.45 * k));
    }
  }

  /** Traînée : lignes de vitesse derrière B.B. (et la chaise) + étirement dans le sens du mouvement. */
  private drawSpeed(frame: FrameState): void {
    const ids: ActorId[] = ['boss', 'chairProp'];
    ids.forEach((id, i) => {
      const line = this.speedLines[i];
      const f = frame.actors[id];
      const view = this.views.get(id);
      if (!line) return;
      if (!f || !view?.visible) {
        line.visible = false;
        return;
      }
      const vx = f.motion.vx;
      const vy = f.motion.vy;
      const v = Math.hypot(vx, vy);
      const k = clamp01((v - 0.9) / 1.4);
      line.visible = k > 0.02 && f.transform.alpha > 0.3;
      if (!line.visible) return;
      line.position.set(f.transform.x - vx * 20, f.transform.y - 120 - vy * 20);
      line.rotation = Math.atan2(vy, vx);
      line.scale.set(0.6 + k * 0.9, 0.9 + k * 0.4);
      line.alpha = 0.18 + 0.35 * k;
      // Étirement (smear) : volume conservé.
      const stretch = 1 + 0.28 * k;
      if (Math.abs(vx) >= Math.abs(vy)) {
        view.scale.x *= stretch;
        view.scale.y /= Math.sqrt(stretch);
      } else {
        view.scale.y *= stretch;
        view.scale.x /= Math.sqrt(stretch);
      }
    });
  }

  private drawParticles(frame: FrameState): void {
    const kit = this.kit;
    if (!kit) return;
    let n = 0;
    for (let i = 0; i < frame.particleCount; i++) {
      const p = frame.particles[i];
      if (!p) break;
      const art = FX_ART[p.fx];
      let s = this.particlePool[n];
      if (!s) {
        s = new Sprite();
        this.particlePool.push(s);
        this.particleLayer.addChild(s);
      }
      n++;
      const tex: Texture = kit.texture(art.tex);
      if (s.texture !== tex) {
        s.texture = tex;
        s.anchor.set(0.5);
      }
      const life = 1 - p.alpha;
      const scale = (p.size / Math.max(1, tex.frame.width)) * (1 + (art.grow ?? 0) * life);
      s.visible = true;
      s.position.set(p.x, p.y);
      s.scale.set(scale);
      s.rotation = p.rot;
      s.alpha = p.fx === 'burst' ? Math.min(1, p.alpha * 2) : p.fx === 'dust' || p.fx === 'smoke' ? p.alpha * 0.9 : p.alpha;
      s.tint = art.tint ? p.color : 0xffffff;
    }
    for (let i = n; i < this.particlePool.length; i++) {
      const s = this.particlePool[i];
      if (s) s.visible = false;
    }
  }

  /** Vie ambiante (fonction de l'horloge de présentation) : poussière dans le rayon, néons, alarme. */
  private drawAmbient(frame: FrameState): void {
    const t = frame.clock;
    this.motes.forEach((m, i) => {
      const k = ((t * 0.012 + i * 37) % 260) / 260;
      m.position.set(170 + ((i * 53) % 260) + k * 120 + Math.sin(t / 900 + i) * 10, 330 + ((i * 71) % 220) - k * 40);
      m.alpha = (0.2 + 0.3 * Math.sin(Math.PI * k)) * (this.shaft?.alpha ?? 0) * 2;
    });
    if (this.worldLevel === 'unhinged') {
      // Néons qui grésillent et alarme rouge (pulsation lente, jamais plus de 3 Hz).
      this.ceilingLights.forEach((l, i) => (l.alpha = (Math.sin(t / 97 + i * 2.1) > 0.85 ? 0.35 : 1) * (this.trophyLayer?.lightFlicker(t + i * 131) ?? 1)));
      if (this.alarm) {
        this.alarm.visible = true;
        this.alarm.setSize(this.width, this.height);
        this.alarm.alpha = 0.06 + 0.08 * (0.5 + 0.5 * Math.sin(t / 380));
      }
    } else {
      // Bureau condamné (trophée OFFICE MELTDOWN) : les néons grésillent aussi dans les autres mondes.
      this.ceilingLights.forEach((l, i) => (l.alpha = this.trophyLayer?.lightFlicker(t + i * 131) ?? 1));
      if (this.alarm) this.alarm.visible = false;
    }
  }

  /** Image d'impact (état `frame=impact` de l'acteur « flash ») : silhouettes encre sur papier. */
  private drawImpactFrame(frame: FrameState): void {
    const on = frame.actors.flash?.states.frame === 'impact';
    this.impactPlane.visible = on;
    const tint = on ? INK : WORLDS[this.worldLevel].cast;
    this.cast.tint = tint;
    this.gadget.tint = on ? INK : WORLDS[this.worldLevel].room;
    this.frontWorld.tint = on ? INK : WORLDS[this.worldLevel].cast;
    for (const layer of [this.room, this.bg, this.ceiling, this.fg, this.light, this.front]) layer.visible = !on;
    this.screen.visible = !on;
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

