/**
 * Textes de l'interface du COLLECTION BOOK, regroupés pour être vérifiés en CI (tests/unit/collection.test.ts).
 * Règle : des FAITS uniquement (« 23 / 51 discovered », « 28 to find »). Jamais de proximité, de « dû »,
 * de chance ni de promesse sur un résultat futur. Liste des formulations interdites : FORBIDDEN_PHRASES.
 */
import type { BranchRarity } from '../presentation/types';
import type { MilestoneRule } from './types';

export const RARITY_LABEL: Record<BranchRarity, string> = {
  COMMON: 'COMMON',
  UNCOMMON: 'UNCOMMON',
  RARE: 'RARE',
  VERY_RARE: 'VERY RARE',
};

/** Le badge a la même taille et la même durée quelle que soit la rareté : pas d'escalade de célébration. */
export const NEW_TITLE: Record<BranchRarity, string> = {
  COMMON: 'NEW ANIMATION',
  UNCOMMON: 'NEW ANIMATION',
  RARE: 'RARE DISCOVERY',
  VERY_RARE: 'VERY RARE DISCOVERY',
};

export const COPY = {
  button: 'COLLECTION',
  title: 'BAD BOSS COLLECTION',
  discovered: (d: number, t: number) => `${d} / ${t} discovered`,
  toFind: (n: number) => (n === 0 ? 'Complete' : `${n} to find`),
  section: (label: string) => `${label} COLLECTION`,
  rarityHeading: 'ANIMATION RARITY',
  rarityLegend:
    'Animation rarity: how often this animation is chosen among the animations for the same result. It never changes results or odds.',
  missingName: '???',
  seen: (n: number) => `Seen ${n}×`,
  firstSeen: (date: string) => `first seen ${date}`,
  plusOne: '+1 COLLECTION',
  unlocked: (name: string) => `UNLOCKED: ${name}`,
  unlockedMany: (n: number) => `UNLOCKED: ${n} REWARDS`,
  filterAll: 'ALL',
  filterFound: 'FOUND',
  filterMissing: 'MISSING',
  rewards: 'REWARDS',
  milestones: 'MILESTONES',
  cosmetics: 'COSMETICS',
  cosmeticsNote: 'Cosmetic only. Rewards never change results, odds or payouts.',
  on: 'ON',
  off: 'OFF',
  locked: 'LOCKED',
  close: 'CLOSE',
  episode: 'SPECIAL EPISODE',
  episodeName: 'OFFICE MELTDOWN',
  episodePlay: 'PLAY EPISODE',
  requiredDiscoveries: (c: number, t: number) => `${c} / ${t} required discoveries`,
  meltdownRule: (rule: MilestoneRule) =>
    rule.kind === 'perGadget'
      ? `${rule.n} discoveries with each of the ${rule.gadgets.length} gadgets · BOSS FIGHT cards not required`
      : rule.kind === 'perSection'
        ? `${rule.n} discoveries in each Rage Level · BOSS FIGHT cards not required`
        : 'BOSS FIGHT cards not required',
  collectorMark: "COLLECTOR'S TROPHY · 100 %",
  showcaseNote: 'SHOWCASE · NO BET · NO PAYOUT',
  nextGag: 'NEXT GAG ▶',
  exit: 'EXIT',
  theEnd: 'THE END',
  replayAgain: 'WATCH AGAIN',
  devTag: 'DEV',
  newReward: 'NEW REWARD',
  rewardUnlocked: 'REWARD UNLOCKED',
} as const;

/** Formulations interdites dans tout texte de la collection (tests). */
export const FORBIDDEN_PHRASES: readonly string[] = [
  'ALMOST',
  'ONE MORE',
  'NEXT ONE',
  'COULD BE',
  'JACKPOT',
  'SOON',
  'DUE',
  'LUCKY',
  'LUCK',
  'KEEP PLAYING',
  "DON'T STOP",
  'CHANCE',
  'ODDS ARE',
  'WIN MORE',
  'BONUS',
  'FREE SPIN',
  'CLOSE TO',
  'NEARLY',
  'SO CLOSE',
  'CASH',
  'FREE MONEY',
  'BONUS WIN',
  // PRODUCTION 3 GADGETS (décision du 2026-09-27) : ni regret sur les autres plans, ni pression à rejouer.
  'ALMOST THERE',
  "YOU'RE DUE",
  'HOT',
  'MISSED WIN',
  'WRONG CHOICE',
  'TRY B NEXT',
  'JACKPOT MISSED',
  'NEAR MISS',
  'SHOULD HAVE',
  'NEXT TIME',
];
