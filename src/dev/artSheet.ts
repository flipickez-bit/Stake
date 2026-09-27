/**
 * DEV : planche d'art (?artsheet=parts). Affiche les pages d'atlas rastérisées, avec le nom et le pivot de chaque pièce.
 * Sert à la revue de cohérence manuelle (ART BIBLE §14). Jamais inclus en production (import dynamique DEV).
 */
import { rasterPages } from '../render/art/atlas';
import { ART_BOOKS } from '../render/art/books';

export async function mountArtSheet(target: HTMLElement, _mode: string): Promise<void> {
  target.innerHTML = '';
  Object.assign(document.body.style, { background: '#E9DCCB', margin: '0', overflow: 'auto' });
  const wrap = document.createElement('div');
  wrap.setAttribute('data-testid', 'artsheet');
  wrap.style.padding = '12px';
  target.appendChild(wrap);
  for (const book of ART_BOOKS) {
    const pages = await rasterPages(book);
    pages.forEach((page, i) => {
      const box = document.createElement('div');
      box.style.cssText = 'position:relative;display:inline-block;margin:8px;background:#fff8ee;border:2px solid #2a1b2f';
      const scale = 0.5;
      const cv = page.canvas;
      const img = document.createElement('canvas');
      img.width = cv.width * scale;
      img.height = cv.height * scale;
      const ctx = img.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(cv, 0, 0, img.width, img.height);
      ctx.font = '11px monospace';
      for (const { part, x, y } of page.placed) {
        const s = page.scale * scale;
        ctx.strokeStyle = 'rgba(92,71,96,0.35)';
        ctx.strokeRect(x * s, y * s, part.w * s, part.h * s);
        ctx.fillStyle = '#e23b3b';
        ctx.beginPath();
        ctx.arc((x + part.ax) * s, (y + part.ay) * s, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a1b2f';
        ctx.fillText(part.id.replace(/^[a-z]+_/, ''), x * s + 2, (y + part.h) * s - 2);
      }
      const label = document.createElement('div');
      label.textContent = `${book.id} p${i + 1} · ${page.canvas.width}×${page.canvas.height}px · ×${page.scale}`;
      label.style.cssText = 'font:12px monospace;padding:4px';
      box.append(label, img);
      wrap.appendChild(box);
    });
  }
}

/** DEV : planche de poses du rig de B.B. (?artsheet=rig&t=700). Une case par animation du manifeste. */
export async function mountRigSheet(target: HTMLElement, t: number, only: string | null): Promise<void> {
  const { Application, Container, Graphics, Text } = await import('pixi.js');
  const { loadTextures } = await import('../render/art/atlas');
  const { ArtKit } = await import('../render/art/kit');
  const { BossRig } = await import('../render/art/BossRig');
  const { CHARACTER_ANIMS } = await import('../content/office');
  target.innerHTML = '';
  Object.assign(document.body.style, { background: '#E9DCCB', margin: '0' });
  const anims = only ? only.split(',') : [...CHARACTER_ANIMS.boss];
  const cols = Math.min(anims.length, 8);
  const cell = { w: 170, h: 330 };
  const app = new Application();
  await app.init({ width: cols * cell.w, height: Math.ceil(anims.length / cols) * cell.h, background: 0xf2e2c4, antialias: true, preference: 'webgl' });
  target.appendChild(app.canvas);
  app.canvas.setAttribute('data-testid', 'artsheet');
  const { textures } = await loadTextures(ART_BOOKS);
  const kit = new ArtKit(textures);
  anims.forEach((anim, i) => {
    const c = new Container();
    c.position.set((i % cols) * cell.w + cell.w / 2, Math.floor(i / cols) * cell.h + cell.h - 40);
    const floor = new Graphics().ellipse(0, 0, 60, 10).fill({ color: 0x2a1b2f, alpha: 0.18 });
    const rig = new BossRig(kit);
    rig.pose(anim, t, { seat: 'none', mug: 'normal', face: 'normal' });
    rig.view.scale.set(0.95);
    const label = new Text({ text: anim, style: { fontFamily: 'monospace', fontSize: 13, fill: 0x2a1b2f } });
    label.anchor.set(0.5, 0);
    label.position.set(0, 12);
    c.addChild(floor, rig.view, label);
    app.stage.addChild(c);
  });
  app.render();
}

/**
 * DEV : CONCEPT FRAME d'un monde RAGE (?artsheet=concept&world=furious&w=1600&h=900). Même cadrage pour les trois,
 * aucune interface. Le tableau est une séquence minuscule évaluée à un instant fixe (rendu identique à chaque fois).
 */
export async function mountConcept(target: HTMLElement, world: 'grumpy' | 'furious' | 'unhinged', w: number, h: number): Promise<void> {
  const { PixiStage } = await import('../render/PixiStage');
  const { GADGETS, restLayout } = await import('../content/gadgets');
  const { buildTimeline, evaluate } = await import('../presentation/timeline');
  target.innerHTML = '';
  Object.assign(document.body.style, { margin: '0', background: '#2a1b2f' });
  const host = document.createElement('div');
  Object.assign(host.style, { width: `${w}px`, height: `${h}px`, position: 'relative' });
  target.appendChild(host);
  const stage = new PixiStage();
  await stage.init(host, { offscreen: true });
  const gadget = GADGETS.find((g) => g.rageLevel === world) ?? GADGETS[0]!;
  stage.setWorldOverride(world);
  stage.setGadget({ ...gadget, props: [] });
  type C = import('../presentation/types').ScheduledCue;
  const cue = (c: import('../presentation/types').Cue): C => ({ ...c, seg: 0 });
  const cast: Record<typeof world, { boss: string; seat: string; wendell: string; wx: number; coo: [number, number, string] }> = {
    grumpy: { boss: 'smug', seat: 'chair', wendell: 'thumbsup', wx: 880, coo: [262, 342, 'idle'] },
    furious: { boss: 'tapfoot', seat: 'none', wendell: 'peek', wx: 205, coo: [70, 364, 'idle'] },
    unhinged: { boss: 'furious', seat: 'none', wendell: 'shrug', wx: 870, coo: [560, 210, 'fly'] },
  };
  const k = cast[world];
  const cues: C[] = [
    cue({ kind: 'state', at: 0, actor: 'boss', state: `seat=${k.seat}` }),
    cue({ kind: 'anim', at: 0, actor: 'boss', anim: k.boss }),
    cue({ kind: 'tween', at: 0, actor: 'wendell', to: { x: k.wx, y: 560 }, ms: 1, ease: 'linear' }),
    cue({ kind: 'anim', at: 0, actor: 'wendell', anim: k.wendell }),
    cue({ kind: 'tween', at: 0, actor: 'coo', to: { x: k.coo[0], y: k.coo[1] }, ms: 1, ease: 'linear' }),
    cue({ kind: 'anim', at: 0, actor: 'coo', anim: k.coo[2] }),
  ];
  const seq = {
    key: `concept-${world}`, gadgetId: gadget.id, branchId: 'CONCEPT', speed: 'normal' as const, totalMs: 2000,
    markers: { d1: 0, reveal: 0, end: 2000 }, cues, segments: [], reaction: null, cooCameo: false,
  };
  const frame = evaluate(buildTimeline(seq, restLayout(gadget)), 1500);
  frame.camera.x = 560;
  frame.camera.y = 350;
  stage.render(frame);
  stage.draw();
  host.setAttribute('data-testid', 'artsheet');
}
