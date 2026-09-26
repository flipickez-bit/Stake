/**
 * Catalogue du COLLECTION BOOK, construit depuis le contenu : une carte par branche, sans art manuel.
 * Ajouter un gadget ou une branche ajoute ses cartes ; le CI vérifie que chaque branche a son texte.
 */
import { CARD_TEXTS, SETUP_HINTS } from '../content/collectionCards';
import { CONTENT_VERSION, GADGETS } from '../content/gadgets';
import { RAGE_LEVEL_IDS } from '../domain/types';
import type { BranchDef, GadgetDef } from '../presentation/types';
import type { CardDef, Catalog, SectionDef, SectionId } from './types';

export const SECTION_LABEL: Record<SectionId, string> = {
  grumpy: 'GRUMPY',
  furious: 'FURIOUS',
  unhinged: 'UNHINGED',
  bossfight: 'BOSS FIGHT',
};

export const SECTION_ORDER: readonly SectionId[] = [...RAGE_LEVEL_IDS, 'bossfight'];

export const isBossFightBranch = (b: BranchDef): boolean => b.categories.includes('BF_ENTRY');

export function buildCatalog(gadgets: readonly GadgetDef[] = GADGETS, version = CONTENT_VERSION): Catalog {
  const cards: CardDef[] = [];
  for (const g of gadgets) {
    for (const b of g.branches) {
      const text = CARD_TEXTS[b.id];
      cards.push({
        id: b.id,
        // Repli si un texte manque (le CI l'interdit) : la collection ne casse jamais le jeu.
        name: text?.name ?? b.label.toUpperCase(),
        blurb: text?.blurb ?? '',
        hint: SETUP_HINTS[g.id]?.[b.path[0] ?? ''] ?? '???',
        section: isBossFightBranch(b) ? 'bossfight' : g.rageLevel,
        level: g.rageLevel,
        gadgetId: g.id,
        gadgetLabel: g.label,
        rarity: b.rarity,
        order: cards.length,
      });
    }
  }
  const sections: SectionDef[] = SECTION_ORDER.map((id) => {
    const inSection = cards.filter((c) => c.section === id);
    const gadgetIds = [...new Set(inSection.map((c) => c.gadgetId))];
    return {
      id,
      label: SECTION_LABEL[id],
      gadgets: gadgetIds.map((gid) => ({
        gadgetId: gid,
        label: inSection.find((c) => c.gadgetId === gid)?.gadgetLabel ?? gid,
        cardIds: inSection.filter((c) => c.gadgetId === gid).map((c) => c.id),
      })),
      total: inSection.length,
    };
  });
  return { version, cards, byId: new Map(cards.map((c) => [c.id, c])), sections };
}
