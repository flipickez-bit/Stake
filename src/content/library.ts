/**
 * Bibliothèques partagées (GDD_04 §5.3) : impacts par tier, réactions, caméo du pigeon, BOSS FIGHT.
 * Un gadget n'écrit que son tronc et ses débuts d'ACTION ; tout le reste vient d'ici.
 */
import type { FreeRound, Outcome } from '../domain/outcome';
import type { ResultClass } from '../domain/types';
import type { ContentLibrary, ImpactTier } from '../presentation/compileSequence';
import type { BossReaction, Cue, ImpactDirection, SegmentDef, SoundId } from '../presentation/types';
import { createRng } from '../domain/seed';
import { anim, freeze, fx, impactFrame, paced, punch, seg, segments, shake, signal, silence, sound, state, tw } from './dsl';
import { ELEVATOR, IMPACT_POINTS } from './office';

// ------------------------------------------------------------------ IMPACT : le COMBIEN

interface TierSpec {
  ms: number;
  shake: number;
  shakeMs: number;
  freeze: number;
  flash: number;
  dust: number;
  /**
   * Nombre de DING (SOUND_BIBLE §4) : la classe s'entend les yeux fermés.
   * SCRAPE (x0,5, gain inférieur à la mise) : AUCUN DING, aucune pièce, aucun son de gain (« pfff » + petit clic).
   * HIT 1 · BIG 2 (+ cuivres) · MEGA 3 (+ cuivres, ovation) · LEGENDARY 4 (+ cuivres, ovation).
   */
  dings: number;
}

const TIERS: Record<ImpactTier, TierSpec> = {
  T05: { ms: 520, shake: 3, shakeMs: 160, freeze: 0, flash: 0, dust: 6, dings: 0 },
  T1: { ms: 700, shake: 8, shakeMs: 300, freeze: 60, flash: 0.25, dust: 12, dings: 1 },
  T2: { ms: 950, shake: 14, shakeMs: 460, freeze: 90, flash: 0.45, dust: 20, dings: 2 },
  T3: { ms: 1250, shake: 22, shakeMs: 720, freeze: 120, flash: 0.7, dust: 30, dings: 3 },
  T3G: { ms: 1450, shake: 26, shakeMs: 820, freeze: 140, flash: 0.85, dust: 34, dings: 4 },
};

/** Couche OBJECT de l'impact selon ce qui est frappé (le décor sonne comme ce qu'il est). */
const OBJECT_LAYER: Record<ImpactDirection, SoundId> = {
  none: 'bonk', window: 'glass', overdesk: 'clang', ceiling: 'debris', floor: 'thump', cork: 'paper', wall: 'clang', elevator: 'clang', vent: 'rattle',
};

function impactSegment(tier: ImpactTier, direction: ImpactDirection): SegmentDef {
  const t = TIERS[tier];
  const p = IMPACT_POINTS[direction];
  const big = tier === 'T2' || tier === 'T3' || tier === 'T3G';
  const cues: Cue[] = [
    // Le moment de vérité : révélation au contact, gel bref, puis silence et DING.
    signal(0, 'reveal'),
    shake(0, t.shakeMs, t.shake),
    fx(0, 'dust', p.x, p.y, t.dust),
    anim(0, 'boss', tier === 'T05' ? 'ouch' : 'splat'),
  ];
  // Couches sonores (SOUND KIT) : BODY + OBJECT + LOW + DEBRIS + ROOM (+ COMEDIC pour les petits chocs).
  if (tier === 'T05') {
    cues.push(sound(0, 'tink'), sound(40, 'bonk', 1.3), sound(240, 'pfft', 1.2), sound(330, 'click', 0.9));
  } else {
    cues.push(sound(0, big ? 'crash' : 'thud'), sound(8, OBJECT_LAYER[direction]), sound(0, 'thump'));
    if (big) cues.push(sound(0, 'boom'), sound(50, 'debris'), sound(90, 'room'));
    else cues.push(sound(140, 'boing', 1.4));
  }
  // Phase 0.6 : image d'impact (silhouettes, ~2 images) puis HIT STOP ; éclat d'impact au point de contact.
  if (t.freeze > 0) cues.push(...impactFrame(0, 40, Math.max(0, t.freeze - 40)), fx(0, 'burst', p.x, p.y, 1));
  if (t.flash > 0) cues.push(tw(0, 'flash', { alpha: t.flash }, 30, 'linear'), tw(40, 'flash', { alpha: 0 }, 260, 'outQuad'));
  if (tier !== 'T05') cues.push(fx(0, 'sparks', p.x, p.y, big ? 16 : 8), punch(0, 220, big ? 8 : 4));
  if (big) cues.push(fx(60, 'papers', p.x, p.y, tier === 'T2' ? 14 : 24), sound(560, 'brass'));
  if (tier === 'T3' || tier === 'T3G') {
    cues.push(fx(280, 'confetti', 500, 260, tier === 'T3G' ? 70 : 44), tw(120, 'portrait', { rot: 0.32 }, 380, 'outBounce'), sound(820, 'cheer'));
  }
  // Accessoires du bureau selon la direction (le bureau est partagé par tous les gadgets).
  if (direction === 'window') cues.push(state(0, 'window', 'broken'), fx(0, 'glass', p.x, p.y, big ? 22 : 12));
  if (direction === 'ceiling') cues.push(state(0, 'ceiling', 'hole'), fx(30, 'dust', p.x, p.y + 20, 14));
  if (direction === 'wall') cues.push(state(0, 'cabinet', 'dented'), tw(0, 'cabinet', { rot: -0.08 }, 90, 'outQuad'), tw(90, 'cabinet', { rot: 0 }, 400, 'outElastic'));
  if (direction === 'floor') cues.push(fx(40, 'dust', p.x, p.y - 10, t.dust), fx(80, 'smoke', p.x, p.y - 20, big ? 10 : 4));
  if (direction === 'elevator') cues.push(state(0, 'elevator', 'dent=yes'), fx(30, 'smoke', p.x, p.y - 30, big ? 12 : 6));
  if (direction === 'vent') cues.push(state(0, 'vent', 'dented'), fx(20, 'dust', p.x, p.y, 12), tw(0, 'vent', { rot: 0.06 }, 80, 'outQuad'), tw(80, 'vent', { rot: 0 }, 400, 'outElastic'));
  cues.push(silence(0, 220));
  for (let i = 0; i < t.dings; i++) cues.push(sound(260 + i * 150, 'ding', 1 + i * 0.12));
  return seg(`IMP_${tier}_${direction.toUpperCase()}`, 'impact', t.ms, 'keep', cues);
}

// ------------------------------------------------------------------ REACTION

/**
 * LE SIP (ART BIBLE §5.1) : regard, montée lente, pause, SIP, sourcil levé — sons calés sur la pose.
 * Micro-variantes DÉTERMINISTES (graine du book) : le geste, la gorgée et le CLINK ne sont jamais tous là à chaque
 * fois ; le silence fait partie du gag. Même durée pour toutes (le rythme de la manche ne change pas).
 */
const SIP_VARIANTS: readonly { weight: number; seg: SegmentDef }[] = [
  { weight: 40, seg: seg('RE_SIP', 'reaction', 1000, 'compress', [anim(0, 'boss', 'sip'), sound(440, 'sip'), sound(680, 'hmpf', 1.1)]) },
  // Gorgée, puis le mug reposé sur le bureau : CLINK (pas de HMPF).
  { weight: 25, seg: seg('RE_SIP_CLINK', 'reaction', 1000, 'compress', [anim(0, 'boss', 'sip'), sound(440, 'sip', 0.95), sound(860, 'clink', 0.8)]) },
  // Grande gorgée bruyante.
  { weight: 20, seg: seg('RE_SIP_GULP', 'reaction', 1000, 'compress', [anim(0, 'boss', 'sip'), sound(430, 'gulp'), sound(700, 'hmpf', 1.2)]) },
  // Silence : il lève le mug… s'arrête, regarde le joueur, ne boit pas. Aucun son.
  { weight: 15, seg: seg('RE_SIP_SILENT', 'reaction', 1000, 'compress', [anim(0, 'boss', 'sip'), anim(360, 'boss', 'smirk'), silence(0, 900)]) },
];

function sipVariant(seed: number): SegmentDef {
  const total = SIP_VARIANTS.reduce((a, v) => a + v.weight, 0);
  let u = createRng(seed, 'sip').next() * total;
  for (const v of SIP_VARIANTS) {
    u -= v.weight;
    if (u < 0) return v.seg;
  }
  return SIP_VARIANTS[0]!.seg;
}

const REACTION_LIST: SegmentDef[] = [
  SIP_VARIANTS[0]!.seg,
  seg('RE_LAUGH', 'reaction', 1000, 'compress', [anim(0, 'boss', 'laugh'), sound(0, 'laugh')]),
  seg('RE_FLEX', 'reaction', 1000, 'compress', [anim(0, 'boss', 'flex'), sound(150, 'hmpf', 0.8)]),
  seg('RE_SULK', 'reaction', 900, 'compress', [anim(0, 'boss', 'sulk'), sound(80, 'deflate')]),
  seg('RE_DAZED', 'reaction', 1100, 'compress', [anim(0, 'boss', 'dazed'), fx(0, 'stars', 0, -236, 5, 'boss'), sound(60, 'boing', 1.3)]),
  seg('RE_OFFICE_CHEER', 'reaction', 1200, 'compress', [
    anim(0, 'wendell', 'run'), tw(0, 'wendell', { x: 860 }, 420, 'outQuad'), anim(430, 'wendell', 'cheer'), sound(450, 'cheer'),
  ]),
  seg('RE_WENDELL_PEEK', 'reaction', 1200, 'compress', [
    anim(0, 'wendell', 'walk'), tw(0, 'wendell', { x: 790 }, 560, 'outQuad'), anim(580, 'wendell', 'peek'), anim(880, 'wendell', 'thumbsup'), sound(900, 'plop', 1.4),
  ]),
];

const REACTIONS = Object.fromEntries(REACTION_LIST.map((s) => [s.id.slice(3), s])) as Record<BossReaction, SegmentDef>;

/** Réaction jouée : LE SIP a ses micro-variantes (graine du book) ; les autres réactions sont uniques. */
function reactionFor(r: BossReaction, seed: number): SegmentDef {
  return r === 'SIP' ? sipVariant(seed) : REACTIONS[r];
}

const REACTION_POOLS: Record<ResultClass, readonly BossReaction[]> = {
  MISS: ['SIP', 'LAUGH', 'FLEX'],
  SCRAPE: ['SULK'],
  HIT: ['DAZED', 'SULK'],
  BIG: ['DAZED'],
  MEGA: ['DAZED'],
  LEGENDARY: ['DAZED'],
};

const AWAY_POOL: readonly BossReaction[] = ['OFFICE_CHEER', 'WENDELL_PEEK'];

// ------------------------------------------------------------------ CAMÉO : COO, agent double, salue le gagnant

const COO_CAMEO = seg('COO_FLYBY', 'reaction', 1000, 'compress', [
  anim(0, 'coo', 'fly'), tw(0, 'coo', { x: 470, y: 250 }, 420, 'outQuad'), anim(440, 'coo', 'salute'), sound(460, 'plop', 1.8),
  anim(760, 'coo', 'fly'), tw(760, 'coo', { x: 262, y: 342 }, 240, 'inQuad'), anim(1000, 'coo', 'idle'),
]);

// ------------------------------------------------------------------ BOSS FIGHT (GDD_05)

const BF_POS = { x: 500, y: 560 };
export const BF_PROJECTILES = ['stapler', 'plane', 'coffee', 'keyboard'] as const;

const BF_ENTRY_MUG = seg('BF_ENTRY_MUG', 'twist', 2000, 'compress', [
  tw(0, 'dim', { alpha: 0.35 }, 300),
  state(0, 'boss', 'seat=none'), fx(0, 'smoke', 0, -60, 10, 'boss'), sound(0, 'pfft', 0.8),
  tw(0, 'fog', { alpha: 0 }, 300), tw(0, 'chairProp', { alpha: 0 }, 200),
  tw(0, 'boss', { x: BF_POS.x, y: BF_POS.y, rot: 0, z: 0, alpha: 1, sx: 1, sy: 1 }, 420, 'outQuad'),
  anim(0, 'boss', 'furious'),
  state(450, 'boss', 'mug=gold'), tw(450, 'glow', { x: BF_POS.x, y: 400, alpha: 0.9 }, 300, 'outQuad'), sound(450, 'gold'),
  anim(620, 'boss', 'drink'),
  anim(1100, 'boss', 'grow'), tw(1100, 'boss', { sx: 2.1, sy: 2.1 }, 620, 'outBack'), sound(1100, 'giantRoar'),
  shake(1150, 650, 12), state(1300, 'ceiling', 'hole'), fx(1300, 'dust', 650, 70, 20),
  tw(1100, 'camera', { x: 500, y: 330, sx: 0.9 }, 600, 'inOutQuad'),
  tw(1500, 'glow', { alpha: 0 }, 400),
]);

const BF_ARENA = seg('BF_ARENA', 'twist', 700, 'compress', [
  tw(0, 'bfBack', { alpha: 1 }, 400), signal(0, 'bfStart'), anim(0, 'boss', 'giant-idle'),
  // Carillon d'ouverture des tours gratuits (`bell`, pas le DING de gain : aucun gain n'est encore touché).
  sound(400, 'bell', 1.2),
]);

/**
 * Un TOUR GRATUIT : lancer (tronc commun, l'issue reste inconnue ~700 ms), puis HIT (gain = base × rage, affiché au
 * moment du choc) ou BLOCKED. Plus la rage monte, plus le choc est lourd (secousse, étincelles, hauteur du DING).
 */
/** Éclats de l'arène à chaque HIT (positions fixes, pas de hasard) : l'arène se fissure un peu plus à chaque coup. */
const BF_CHIPS: readonly [number, number][] = [[250, 140], [760, 120], [180, 330], [820, 300], [400, 90], [640, 70], [120, 200], [880, 210]];

function freeRoundSegments(index: number, round: FreeRound, projectiles: readonly string[] = BF_PROJECTILES, hitsBefore = 0): SegmentDef[] {
  const kind = projectiles[round.variant % projectiles.length] ?? 'stapler';
  const heat = Math.min(round.rage, 8);
  const windup = seg(`BF_WINDUP_${index}`, 'action', 700, 'compress', [
    signal(0, 'frRound', index),
    state(0, 'proj', `kind=${kind}`),
    tw(0, 'proj', { x: 60, y: 650, alpha: 1, rot: 0 }, 1, 'linear'),
    tw(2, 'proj', { x: 360, y: 470, rot: 6 }, 680, 'outQuad'),
    sound(60, 'whoosh', 0.95 + heat * 0.03),
    anim(0, 'boss', 'giant-idle'), anim(320, 'boss', 'giant-wind'),
  ]);
  if (round.result === 'HIT') {
    return [windup, seg(`BF_HIT_${index}`, 'impact', 560, 'keep', [
      tw(0, 'proj', { x: 480, y: 420 }, 80, 'inQuad'),
      freeze(80, 60 + heat * 6), tw(80, 'flash', { alpha: 0.4 + heat * 0.04 }, 20, 'linear'), tw(100, 'flash', { alpha: 0 }, 220),
      sound(80, 'clang'), shake(80, 220 + heat * 20, 7 + heat), anim(80, 'boss', 'giant-hurt'),
      tw(100, 'proj', { alpha: 0 }, 100), fx(80, 'sparks', 480, 420, 12 + heat * 3),
      signal(150, 'frHit', index), sound(170, 'ding', 1 + (heat - 1) * 0.07),
      // DESTRUCTION CUMULATIVE : chaque HIT fissure l'arène un peu plus (rendu du fond selon `dmg`) et fait tomber des éclats.
      state(150, 'bfBack', `dmg=${hitsBefore + 1}`),
      fx(160, 'debris', BF_CHIPS[hitsBefore % BF_CHIPS.length]![0], BF_CHIPS[hitsBefore % BF_CHIPS.length]![1], 4 + heat),
    ])];
  }
  return [windup, seg(`BF_BLOCK_${index}`, 'impact', 560, 'keep', [
    anim(0, 'boss', 'giant-swat'),
    tw(80, 'proj', { x: -220, y: 60, rot: -8 }, 420, 'outQuad'),
    sound(80, 'boing'), punch(80, 200, 5), signal(150, 'bfBlocked', index),
  ])];
}

function bossFightSegments(bf: NonNullable<Outcome['bossFight']>, projectiles?: readonly string[]): SegmentDef[] {
  const out: SegmentDef[] = [BF_ENTRY_MUG, BF_ARENA];
  let hits = 0;
  bf.rounds.forEach((r, i) => {
    out.push(...freeRoundSegments(i, r, projectiles?.length ? projectiles : BF_PROJECTILES, hits));
    if (r.result === 'HIT') hits++;
  });
  if (bf.ko) {
    out.push(seg('BF_KO', 'impact', 1700, 'keep', [
      anim(0, 'boss', 'giant-ko'), tw(0, 'boss', { rot: -1.45, y: 600 }, 600, 'inQuad'),
      sound(600, 'crash'), shake(600, 650, 18), freeze(600, 130), fx(600, 'dust', 380, 560, 30),
      signal(600, 'bfKo'), signal(650, 'reveal'), fx(700, 'confetti', 500, 280, 60), fx(720, 'gold', 500, 260, 40),
      // Effondrement : l'arène cède, pluie de gravats et de dossiers.
      state(600, 'bfBack', 'dmg=collapse'), fx(620, 'debris', 300, 40, 18), fx(660, 'debris', 700, 30, 18), fx(700, 'papers', 500, 60, 24),
      sound(700, 'cheer'), sound(760, 'ding', 1.2),
      tw(1000, 'boss', { sx: 1, sy: 1 }, 500, 'outQuad'), tw(1000, 'bfBack', { alpha: 0 }, 500), tw(1000, 'dim', { alpha: 0 }, 500),
    ]));
  } else {
    out.push(seg('BF_OUTRO', 'impact', 1500, 'keep', [
      anim(0, 'boss', 'giant-laugh'), sound(0, 'laugh', 0.6),
      signal(500, 'reveal'), sound(520, 'ding'), fx(520, 'gold', 500, 300, 30),
      tw(800, 'boss', { sx: 1, sy: 1 }, 500, 'outQuad'), anim(800, 'boss', 'sulk'), sound(800, 'deflate'),
      tw(900, 'bfBack', { alpha: 0 }, 400), tw(900, 'dim', { alpha: 0 }, 400),
    ]));
  }
  return out;
}

// ------------------------------------------------------------------ SIGNATURE HORS CHAMP : L'ASCENSEUR
// B.B. a quitté le cadre. Silence. L'ascenseur descend. DING. Les portes s'ouvrent… sur n'importe quel résultat.

const doorsOpen = (at: number): Cue[] => [
  tw(at, 'elevL', { sx: 0.08 }, 260, 'outQuad'), tw(at, 'elevR', { sx: 0.08 }, 260, 'outQuad'), sound(at, 'whoosh', 0.55),
];

const ELEV_WAIT = paced(0.75, seg('ELEV_WAIT', 'twist', 1000, 'compress', [
  // B.B. est placé dans la cabine pendant que les portes sont fermées (invisible).
  tw(0, 'boss', { x: ELEVATOR.x, y: ELEVATOR.y, rot: 0, z: 0, alpha: 1, sx: 1, sy: 1 }, 1, 'linear'),
  state(0, 'boss', 'seat=none'), anim(0, 'boss', 'idle'),
  tw(0, 'camera', { x: 800, y: 350, sx: 1.1 }, 420, 'inOutQuad'),
  silence(0, 800), state(100, 'elevator', 'moving'),
  sound(260, 'elevator', 1.3), sound(460, 'elevator', 1.15), sound(660, 'elevator', 1.0),
  // Carillon d'arrivée (`bell`) : ce n'est PAS le DING de gain (il sonne aussi quand B.B. sort intact).
  state(860, 'elevator', 'arrived'), sound(880, 'bell'),
]));

const ELEV_SAFE = paced(0.82, seg('ELEV_SAFE', 'action', 1100, 'compress', [
  ...doorsOpen(0), anim(0, 'boss', 'sip'), signal(320, 'reveal'), sound(560, 'sip'), sound(700, 'hmpf'),
  anim(820, 'boss', 'smug'), tw(820, 'camera', { x: 500, y: 350, sx: 1 }, 280, 'inOutQuad'),
]));

const ELEV_WRECK = seg('ELEV_WRECK', 'action', 320, 'compress', [
  state(0, 'boss', 'face=soot'), anim(0, 'boss', 'dazed'), ...doorsOpen(0), fx(60, 'smoke', ELEVATOR.x, 470, 10),
]);

const ELEV_MEGA = seg('ELEV_MEGA', 'action', 360, 'compress', [
  state(0, 'boss', 'face=soot'), anim(0, 'boss', 'splat'),
  tw(0, 'coo', { x: ELEVATOR.x + 6, y: ELEVATOR.y - 205 }, 1, 'linear'), anim(0, 'coo', 'salute'),
  ...doorsOpen(0), fx(40, 'papers', ELEVATOR.x, 450, 40), sound(80, 'crash', 0.8),
]);

const ELEV_GOLD = seg('ELEV_GOLD', 'twist', 700, 'compress', [
  ...doorsOpen(0), state(0, 'boss', 'mug=gold'), tw(0, 'glow', { x: ELEVATOR.x, y: 440, alpha: 0.9 }, 220, 'outQuad'),
  anim(100, 'boss', 'furious'), sound(150, 'gold'), tw(420, 'camera', { x: 500, y: 350, sx: 1 }, 280, 'inOutQuad'),
]);

// ------------------------------------------------------------------ RUNNING GAG : LE SIP (ne veut PAS dire « perdu »)

const SIP_BEAT = paced(0.6, seg('SIP_BEAT', 'twist', 900, 'compress', [anim(0, 'boss', 'sip'), sound(720, 'sip')]));
/** Variantes du temps mort « LE SIP » (même durée, même pose ; seuls les sons changent — jamais un indice). */
const SIP_BEAT_VARIANTS: readonly SegmentDef[] = [
  SIP_BEAT,
  paced(0.6, seg('SIP_BEAT', 'twist', 900, 'compress', [anim(0, 'boss', 'sip'), sound(720, 'sip', 1.05), sound(880, 'clink', 0.8)])),
  paced(0.6, seg('SIP_BEAT', 'twist', 900, 'compress', [anim(0, 'boss', 'sip'), silence(0, 900)])),
];
/** Le mug est vide. Il regarde dedans… (la suite peut être un gain comme une perte). */
const SIP_EMPTY = paced(0.7, seg('SIP_EMPTY', 'twist', 650, 'compress', [
  state(0, 'boss', 'mug=empty'), anim(0, 'boss', 'mugcheck'), sound(180, 'hmpf', 1.35), silence(0, 500),
]));
const SIP_SMUG = seg('SIP_SMUG', 'action', 700, 'compress', [
  anim(0, 'boss', 'smug'), signal(80, 'reveal'), sound(120, 'laugh', 1.1),
]);

export const LIBRARY: ContentLibrary = {
  segments: segments([...REACTION_LIST, COO_CAMEO, BF_ENTRY_MUG, BF_ARENA, ELEV_WAIT, ELEV_SAFE, ELEV_WRECK, ELEV_MEGA, ELEV_GOLD, SIP_BEAT, SIP_EMPTY, SIP_SMUG]),
  impact: impactSegment,
  reaction: reactionFor,
  variant: (id, seed) => (id === 'SIP_BEAT' ? SIP_BEAT_VARIANTS[createRng(seed, 'sipbeat').int(SIP_BEAT_VARIANTS.length)] ?? null : null),
  reactionPool: (c) => REACTION_POOLS[c],
  awayPool: AWAY_POOL,
  bossFight: bossFightSegments,
  cooCameo: { chance: 0.1, segment: COO_CAMEO },
};
