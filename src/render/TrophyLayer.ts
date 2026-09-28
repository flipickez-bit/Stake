/**
 * TROPHÉES VISIBLES dans le décor (docs/PROPOSITION_RECOMPENSES_VISUELLES.md, propositions 1 et 3) :
 * - HALL OF SHAME : guirlande de Polaroïds sous le plafond, une photo par animation découverte (les plus récentes devant) ;
 * - cicatrices permanentes du bureau, une par gadget ;
 * - étapes du bureau aux jalons (enseigne néon, cartons RH, rubalise, panneau, bureau condamné, plaques 100 %, EX-BOSS).
 *
 * RENDU SEULEMENT, fonction de l'état de la collection et de l'horloge de présentation : aucun cue, aucune durée, aucune
 * branche. Jamais d'or (signal du BOSS FIGHT). Absent des vignettes, du replay par URL et du mode Stake (collection nulle).
 */
import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import type { HallPhoto, OfficeStage, TrophyState, TrophyUnlock } from '../collection/trophies';
import type { RageLevelId } from '../domain/types';
import type { ArtKit } from './art/kit';
import { hex } from './art/palette';

/** Guirlande (coordonnées du monde) : bord à bord de la vue paysage la plus large, juste sous le plafond. */
const GARLAND = { x0: -190, x1: 1190, y: 64, sag: 16, slots: 34 };
const MAX_PHOTOS = GARLAND.slots * 4;
/** Durée d'apparition d'un nouveau trophée (horloge de présentation, ms). */
const REVEAL_MS = 1100;

const LEVEL_TINT: Record<RageLevelId | 'bossfight', number> = { grumpy: 0xbfe3ff, furious: 0xffb07a, unhinged: 0x9d8ce0, bossfight: 0xff6b6b };
const RARITY_TINT: Record<string, number | null> = { COMMON: null, UNCOMMON: 0x2ec4b6, RARE: 0xc77dff, VERY_RARE: 0xffffff };

/** Hachage déterministe (jamais Math.random) : même collection, même mur. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/** Couleur holographique (rendu) : teinte qui tourne avec l'horloge. */
export function holo(clock: number, phase = 0): number {
  const h = ((clock / 1600 + phase) % 1 + 1) % 1;
  const f = (n: number) => {
    const k = (n + h * 6) % 6;
    return Math.round(255 * (1 - 0.55 * Math.max(0, Math.min(k, 4 - k, 1))));
  };
  return (f(5) << 16) | (f(3) << 8) | f(1);
}

const garlandY = (x: number) => {
  const k = (x - GARLAND.x0) / (GARLAND.x1 - GARLAND.x0);
  // Deux festons : la corde retombe entre trois crochets.
  const local = (k * 2) % 1;
  return GARLAND.y + GARLAND.sag * 4 * local * (1 - local);
};

/** Emplacements (monde) des cicatrices de chaque gadget : là où le gag a eu lieu, sans gêner une animation. */
const SCARS: Record<string, { layer: 'wall' | 'floor' | 'ceiling'; tex: string; x: number; y: number; rot?: number; scale?: number }> = {
  'swivel-slingshot': { layer: 'wall', tex: 'stuck_stapler', x: 60, y: 300, rot: -0.5 },
  'espresso-blaster': { layer: 'wall', tex: 'tr_splat', x: 770, y: 262, scale: 0.8 },
  'copier-catapult': { layer: 'ceiling', tex: 'cop_ream', x: 380, y: 52, rot: -0.45, scale: 0.8 },
  'trapdoor-express': { layer: 'floor', tex: 'tr_planks', x: -80, y: 600 },
  'cabinet-domino': { layer: 'floor', tex: 'dom_drawer', x: 1120, y: 598, rot: 0.12, scale: 0.8 },
  'cooler-bowling': { layer: 'floor', tex: 'tr_puddle', x: 330, y: 622 },
  'office-rocket': { layer: 'floor', tex: 'tr_scorch', x: 700, y: 598 },
  'ceiling-safe': { layer: 'floor', tex: 'tr_crack', x: 520, y: 600 },
  'hvac-hurricane': { layer: 'wall', tex: 'tr_plane', x: 352, y: 170, rot: 0.25 },
};

interface Reveal {
  view: Container;
  kind: 'photo' | 'pop';
  start: number | null;
  baseY: number;
  baseScale: number;
}

const neonStyle = (size: number, fill: number) => ({ fontFamily: 'Arial Black, Arial', fontWeight: '900' as const, fontSize: size, fill, letterSpacing: 2 });

export class TrophyLayer {
  /** Mur (derrière la pièce) : guirlande, enseigne, panneaux, cicatrices murales. */
  readonly wall = new Container();
  /** Sol de la pièce (sous les personnages) : cicatrices au sol, cartons. */
  readonly floor = new Container();
  /** Plafond : ramette plantée. */
  readonly ceiling = new Container();
  /** Bureau de B.B. : plaque EX-BOSS. */
  readonly desk = new Container();
  private readonly garland = new Graphics();
  private readonly photos = new Container();
  private readonly photoViews = new Map<string, Container>();
  /** Étoiles des photos VERY RARE (teinte holographique animée). */
  private readonly holoStars = new Map<string, Sprite>();
  private readonly scarViews = new Map<string, Container>();
  private readonly stageViews = new Map<string, Container>();
  private neon: Text | null = null;
  private neonGlow: Text | null = null;
  private reveals: Reveal[] = [];
  private state: TrophyState | null = null;
  private condemned = false;

  constructor(private readonly kit: ArtKit) {
    this.wall.label = 'trophies-wall';
    this.floor.label = 'trophies-floor';
    this.wall.addChild(this.garland, this.photos);
  }

  /** Nouvel état (après une manche, ou au chargement). `unlocks` : ce qui vient d'apparaître (mis en scène). */
  set(state: TrophyState, unlocks: readonly TrophyUnlock[] = []): void {
    this.state = state;
    const fresh = new Set(unlocks.map((u) => (u.kind === 'photo' ? `photo:${u.photo.cardId}` : u.kind === 'scar' ? `scar:${u.gadgetId}` : u.kind === 'stage' ? `stage:${u.stage}` : '')));
    this.drawGarland(state.photos.length > 0);
    this.syncPhotos(state.photos, fresh);
    this.syncScars(state.scars, fresh);
    this.syncStage(state.stage, fresh);
  }

  get current(): TrophyState | null {
    return this.state;
  }

  /** Nombre de photos affichées (tests, DEV). */
  get photoCount(): number {
    return this.photoViews.size;
  }

  private drawGarland(on: boolean): void {
    const g = this.garland;
    g.clear();
    if (!on) return;
    g.moveTo(GARLAND.x0, GARLAND.y);
    for (let x = GARLAND.x0; x <= GARLAND.x1; x += 20) g.lineTo(x, garlandY(x));
    g.stroke({ width: 2, color: hex('inkSoft') });
    for (const x of [GARLAND.x0, (GARLAND.x0 + GARLAND.x1) / 2, GARLAND.x1]) g.circle(x, GARLAND.y, 3).fill(hex('metalDark'));
  }

  private photoView(p: HallPhoto): Container {
    const kit = this.kit;
    const v = new Container();
    v.label = `photo:${p.cardId}`;
    const frame = kit.sprite('tr_polaroid');
    const pic = new Sprite(Texture.WHITE);
    pic.position.set(-13, 3);
    pic.setSize(26, 24);
    pic.tint = LEVEL_TINT[p.section === 'bossfight' ? 'bossfight' : p.level];
    const ic = kit.sprite(`tr_ic_${p.gadgetId}`, -4, 17);
    const face = kit.sprite('tr_face', 6, 10);
    face.scale.set(0.62);
    v.addChild(frame, pic, ic, face, kit.sprite('tr_pin', 0, -4));
    const tint = RARITY_TINT[p.rarity] ?? null;
    if (p.rarity !== 'COMMON' && tint !== null) {
      const star = kit.sprite('tr_star', 11, 34);
      star.tint = tint;
      v.addChild(star);
      if (p.rarity === 'VERY_RARE') this.holoStars.set(p.cardId, star);
    }
    return v;
  }

  private syncPhotos(photos: readonly HallPhoto[], fresh: ReadonlySet<string>): void {
    const shown = photos.slice(-MAX_PHOTOS);
    const keep = new Set(shown.map((p) => p.cardId));
    for (const [id, v] of this.photoViews) {
      if (keep.has(id)) continue;
      v.destroy({ children: true });
      this.photoViews.delete(id);
      this.holoStars.delete(id);
    }
    const offset = photos.length - shown.length;
    shown.forEach((p, k) => {
      const i = k + offset;
      let v = this.photoViews.get(p.cardId);
      if (!v) {
        v = this.photoView(p);
        this.photoViews.set(p.cardId, v);
      }
      const slot = i % GARLAND.slots;
      const layer = Math.floor(i / GARLAND.slots);
      const x = GARLAND.x0 + 30 + slot * ((GARLAND.x1 - GARLAND.x0 - 60) / (GARLAND.slots - 1)) + layer * 11;
      const y = garlandY(x) + layer * 7;
      v.position.set(x, y);
      v.rotation = (hash(p.cardId) - 0.5) * 0.36;
      // Ordre d'affichage = ordre des découvertes : la plus récente devant.
      this.photos.addChild(v);
      if (fresh.has(`photo:${p.cardId}`)) this.reveals.push({ view: v, kind: 'photo', start: null, baseY: y, baseScale: 1 });
    });
  }

  private syncScars(scars: readonly string[], fresh: ReadonlySet<string>): void {
    for (const g of scars) {
      if (this.scarViews.has(g)) continue;
      const def = SCARS[g];
      if (!def || !this.kit.has(def.tex)) continue;
      const s = this.kit.sprite(def.tex, def.x, def.y);
      s.rotation = def.rot ?? 0;
      s.scale.set(def.scale ?? 1);
      s.label = `scar:${g}`;
      const layer = def.layer === 'wall' ? this.wall : def.layer === 'floor' ? this.floor : this.ceiling;
      layer.addChild(s);
      this.scarViews.set(g, s);
      if (fresh.has(`scar:${g}`)) this.reveals.push({ view: s, kind: 'pop', start: null, baseY: def.y, baseScale: def.scale ?? 1 });
    }
    for (const [g, v] of this.scarViews) {
      if (scars.includes(g)) continue;
      v.destroy();
      this.scarViews.delete(g);
    }
  }

  private stageView(key: string): Container | null {
    const kit = this.kit;
    const v = new Container();
    v.label = `stage:${key}`;
    switch (key) {
      case 'hallSign': {
        const glow = new Text({ text: 'HALL OF SHAME', style: neonStyle(30, 0xff5fa2) });
        glow.anchor.set(0.5);
        glow.alpha = 0.35;
        glow.scale.set(1.08);
        glow.blendMode = 'add';
        const t = new Text({ text: 'HALL OF SHAME', style: { ...neonStyle(30, 0xffe1f0), stroke: { color: 0xff3d8b, width: 4 } } });
        t.anchor.set(0.5);
        v.addChild(glow, t);
        v.position.set(-60, 176);
        this.neon = t;
        this.neonGlow = glow;
        return v;
      }
      case 'hrBoxes': {
        v.addChild(kit.sprite('tr_boxes'));
        const t = new Text({ text: 'HR\nCOMPLAINTS', style: { fontFamily: 'Arial Black, Arial', fontWeight: '900', fontSize: 11, fill: hex('ink'), align: 'center', lineHeight: 12 } });
        t.anchor.set(0.5);
        t.position.set(-4, -18);
        t.rotation = -0.04;
        v.addChild(t);
        v.position.set(-120, 560);
        return v;
      }
      case 'caution': {
        // Rubalise en X sur la fenêtre, et panneau « DAYS WITHOUT INCIDENT: 0 ».
        const tape = new Graphics();
        const band = (x0: number, y0: number, x1: number, y1: number) => {
          tape.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 14, color: hex('hazard') });
          const n = 9;
          for (let i = 0; i < n; i++) {
            const k = (i + 0.3) / n;
            const x = x0 + (x1 - x0) * k;
            const y = y0 + (y1 - y0) * k;
            tape.moveTo(x - 4, y - 6).lineTo(x + 4, y + 6).stroke({ width: 5, color: hex('ink') });
          }
        };
        band(120, 110, 320, 290);
        band(320, 110, 120, 290);
        const board = kit.sprite('tr_board', -80, 214);
        const t = new Text({ text: 'DAYS WITHOUT\nINCIDENT:  0', style: { fontFamily: 'Arial Black, Arial', fontWeight: '900', fontSize: 14, fill: hex('ink'), align: 'center', lineHeight: 16 } });
        t.anchor.set(0.5, 0);
        t.position.set(-80, 220);
        v.addChild(tape, board, t);
        return v;
      }
      case 'condemned': {
        const board = kit.sprite('tr_board', 985, 118);
        board.scale.set(0.9);
        const t = new Text({ text: 'CONDEMNED', style: { fontFamily: 'Arial Black, Arial', fontWeight: '900', fontSize: 20, fill: hex('alarm'), letterSpacing: 3 } });
        t.anchor.set(0.5, 0);
        t.position.set(985, 128);
        v.addChild(board, t);
        return v;
      }
      case 'exBoss': {
        const plate = kit.sprite('tr_nameplate');
        const t = new Text({ text: 'EX-BOSS', style: { fontFamily: 'Arial Black, Arial', fontWeight: '900', fontSize: 9, fill: hex('ink'), letterSpacing: 1 } });
        t.anchor.set(0.5);
        t.position.set(0, -10);
        v.addChild(plate, t);
        v.position.set(826, 434);
        return v;
      }
      default: {
        if (!key.startsWith('full:')) return null;
        const section = key.slice(5);
        const i = ['grumpy', 'furious', 'unhinged', 'bossfight'].indexOf(section);
        const plate = kit.sprite('tr_plaque');
        const t = new Text({ text: `100%\n${section === 'bossfight' ? 'BOSS FIGHT' : section.toUpperCase()}`, style: { fontFamily: 'Arial Black, Arial', fontWeight: '900', fontSize: 7, fill: hex('ink'), align: 'center', lineHeight: 8 } });
        t.anchor.set(0.5);
        t.position.set(0, 18);
        v.addChild(plate, t);
        v.position.set(-170 + Math.max(0, i) * 62, 318);
        return v;
      }
    }
  }

  private syncStage(stage: OfficeStage, fresh: ReadonlySet<string>): void {
    const keys = [
      ...(['hallSign', 'hrBoxes', 'caution', 'condemned', 'exBoss'] as const).filter((k) => stage[k]),
      ...stage.fullSections.map((s) => `full:${s}`),
    ];
    this.condemned = stage.condemned;
    for (const key of keys) {
      if (this.stageViews.has(key)) continue;
      const v = this.stageView(key);
      if (!v) continue;
      (key === 'hrBoxes' ? this.floor : key === 'exBoss' ? this.desk : this.wall).addChild(v);
      this.stageViews.set(key, v);
      if (fresh.has(`stage:${key}`)) this.reveals.push({ view: v, kind: 'pop', start: null, baseY: v.position.y, baseScale: 1 });
    }
    for (const [key, v] of this.stageViews) {
      if (keys.includes(key)) continue;
      v.destroy({ children: true });
      this.stageViews.delete(key);
      if (key === 'hallSign') this.neon = this.neonGlow = null;
    }
  }

  /** Animations (horloge de présentation) : apparitions, néon, étoiles holographiques. */
  render(clock: number): void {
    for (const s of this.holoStars.values()) s.tint = holo(clock, (s.parent?.position.x ?? 0) / 300);
    if (this.neonGlow && this.neon) {
      // Néon : respiration lente et, bureau condamné, un grésillement déterministe.
      const buzz = this.condemned && Math.floor(clock / 90) % 23 === 0 ? 0.4 : 1;
      this.neonGlow.alpha = (0.28 + 0.12 * Math.sin(clock / 420)) * buzz;
      this.neon.alpha = buzz;
    }
    this.reveals = this.reveals.filter((r) => {
      if (r.view.destroyed) return false;
      r.start ??= clock;
      const k = Math.min(1, (clock - r.start) / REVEAL_MS);
      const e = 1 - (1 - k) ** 3;
      if (r.kind === 'photo') {
        // Le Polaroïd tombe en tournoyant sur la corde, comme accroché à la volée.
        r.view.scale.set(r.baseScale * (2.4 - 1.4 * e));
        r.view.position.y = r.baseY - 60 * (1 - e);
        r.view.alpha = Math.min(1, k * 3);
        r.view.skew.set(0, Math.sin(k * Math.PI * 3) * 0.2 * (1 - k));
      } else {
        const over = k < 0.6 ? e * 1.25 : 1.25 - 0.25 * ((k - 0.6) / 0.4);
        r.view.scale.set(r.baseScale * Math.max(0.01, over));
        r.view.alpha = Math.min(1, k * 2.5);
      }
      if (k >= 1) {
        r.view.scale.set(r.baseScale);
        r.view.position.y = r.baseY;
        r.view.alpha = 1;
        r.view.skew.set(0, 0);
        return false;
      }
      return true;
    });
  }

  /** Bureau condamné : intensité des néons du plafond (grésillement déterministe). */
  lightFlicker(clock: number): number {
    if (!this.condemned) return 1;
    const t = Math.floor(clock / 70);
    return t % 37 === 0 || t % 53 === 0 ? 0.35 : 1;
  }
}
