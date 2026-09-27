/**
 * Vignettes du COLLECTION BOOK, générées depuis le contenu : on compile la branche, on évalue l'image clé
 * (le reveal, ou l'entrée du BOSS FIGHT) et on la dessine dans une scène Pixi hors écran.
 * Aucun art manuel par carte : 51 ou 500 animations, même coût. Aspect par défaut (sans cosmétique).
 * Cadrage serré sur l'action (le boss s'il est visible), pour qu'une petite carte reste lisible.
 * Rendu seul : ces manches synthétiques ne passent jamais par GameFlow, le RGS ni la collection.
 */
import { GADGETS, restLayout } from '../content/gadgets';
import { LIBRARY } from '../content/library';
import type { Outcome } from '../domain/outcome';
import type { ResultClass } from '../domain/types';
import { compileSequence } from '../presentation/compileSequence';
import { buildTimeline, evaluate } from '../presentation/timeline';
import type { AnimationSequence, BranchDef, GadgetDef } from '../presentation/types';
import { PixiStage } from './PixiStage';

const MULT: Record<ResultClass, number> = { MISS: 0, SCRAPE: 50, HIT: 200, BIG: 1000, MEGA: 5000, LEGENDARY: 20000 };
const SIZE = { width: 320, height: 208 };

function thumbOutcome(g: GadgetDef, b: BranchDef): Outcome {
  const resultClass = b.classes[0] as ResultClass;
  const bf = b.categories.includes('BF_ENTRY');
  return {
    source: 'dev',
    roundId: `THUMB-${b.id}`,
    mode: g.rageLevel,
    betAmount: 1_000_000,
    payout: MULT[resultClass] * 10_000,
    payoutMultiplier100: MULT[resultClass],
    resultClass,
    script: b.categories[0] as Outcome['script'],
    rarity: 'common',
    seed: 1,
    bossFight: bf
      ? { rungs100: [500, 1000, 2500], attacks: [{ result: 'HIT', variant: 0 }, { result: 'BLOCKED', variant: 1 }], finalRungIndex: 0, ko: false }
      : null,
    plans: null,
  };
}

/** Instant de la vignette : juste avant l'arène pour une entrée de BOSS FIGHT, sinon le reveal. */
function keyTime(seq: AnimationSequence): number {
  const bf = seq.cues.find((c) => c.kind === 'signal' && c.signal === 'bfStart');
  return bf ? Math.max(0, bf.at - 40) : seq.markers.reveal;
}

export class ThumbnailRenderer {
  private stage: PixiStage | null = null;
  private host: HTMLDivElement | null = null;
  private ready: Promise<boolean> | null = null;
  private readonly cache = new Map<string, string>();
  private chain: Promise<unknown> = Promise.resolve();

  private init(): Promise<boolean> {
    this.ready ??= (async () => {
      try {
        const host = document.createElement('div');
        host.setAttribute('aria-hidden', 'true');
        Object.assign(host.style, { position: 'fixed', left: '-10000px', top: '0', width: `${SIZE.width}px`, height: `${SIZE.height}px`, opacity: '0', pointerEvents: 'none' });
        document.body.appendChild(host);
        const stage = new PixiStage();
        await stage.init(host, { offscreen: true });
        this.host = host;
        this.stage = stage;
        return true;
      } catch {
        return false;
      }
    })();
    return this.ready;
  }

  /** Vignette d'une carte découverte (data URL), ou null si le rendu est impossible (le livre affiche un repli). */
  card(cardId: string): Promise<string | null> {
    return this.queue(`card:${cardId}`, () => {
      const g = GADGETS.find((x) => x.branches.some((b) => b.id === cardId));
      const b = g?.branches.find((x) => x.id === cardId);
      if (!g || !b) return null;
      const seq = compileSequence(thumbOutcome(g, b), g, 'normal', LIBRARY, { forceBranchId: b.id });
      return this.draw(g, seq, keyTime(seq));
    });
  }

  destroy(): void {
    this.stage?.destroy();
    this.host?.remove();
    this.stage = null;
    this.host = null;
    this.ready = null;
  }

  /** Une vignette à la fois (une seule scène hors écran), résultats mis en cache pour la session. */
  private queue(key: string, make: () => string | null): Promise<string | null> {
    const cached = this.cache.get(key);
    if (cached) return Promise.resolve(cached);
    const job = this.chain.then(async () => {
      if (this.cache.has(key)) return this.cache.get(key) ?? null;
      if (!(await this.init())) return null;
      try {
        const url = make();
        if (url) this.cache.set(key, url);
        return url;
      } catch {
        return null;
      }
    });
    this.chain = job.catch(() => undefined);
    return job;
  }

  private draw(g: GadgetDef, seq: AnimationSequence, t: number): string | null {
    const stage = this.stage;
    if (!stage) return null;
    const frame = evaluate(buildTimeline(seq, restLayout(g)), t);
    // Cadrage de vignette : zoom ×1,7, recentré vers B.B. tant qu'il est dans le bureau.
    const cam = frame.camera;
    const boss = frame.actors.boss?.transform;
    if (boss && boss.alpha > 0.2 && boss.y < 720) {
      cam.x += 0.7 * (boss.x - cam.x);
      cam.y += 0.6 * (boss.y - 120 - cam.y);
    }
    cam.zoom *= 1.7;
    cam.shakeX = 0;
    cam.shakeY = 0;
    stage.setGadget(g);
    stage.render(frame);
    stage.draw();
    return stage.app.canvas.toDataURL('image/jpeg', 0.82);
  }
}
