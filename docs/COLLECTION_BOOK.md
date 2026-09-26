# BAD BOSS COLLECTION BOOK — conception (Phase 0.5C)

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**
> Méta-progression **cosmétique** : les animations deviennent des cartes à découvrir.
> Principe non négociable : **la collection OBSERVE le résultat, elle ne l'influence jamais.**

Chiffres de ce document : calcul exact à partir du contenu P05-B (51 branches), des poids de rareté, des scripts du book et de la distribution mathématique de chaque Rage Level. Tableau régénéré en CI : `docs/generated/COLLECTION_REPORT.md`.

---

## A. Le système

### A.1 Ce qu'est une carte
- **1 carte = 1 branche d'animation** (`BranchDef.id`). 51 cartes aujourd'hui.
  - Les variations cosmétiques (réaction, caméo de COO) ne sont pas des cartes : ce sont des variantes d'une même animation.
  - L'identifiant d'une carte est **stable pour toujours** : une branche publiée n'est jamais renommée ni réutilisée (test en CI).
- **Toutes les issues comptent** : perte, gain, gros gain et entrée de BOSS FIGHT. Une perte peut afficher `x0` puis « NEW ANIMATION ».
- **Sections** (le joueur voit d'un coup d'œil ce qui lui manque dans chaque mode) :

| Section | Contenu | Cartes |
|---|---|---:|
| GRUMPY COLLECTION | SWIVEL SLINGSHOT (hors entrées de BOSS FIGHT) | 15 |
| FURIOUS COLLECTION | TRAPDOOR EXPRESS | 14 |
| UNHINGED COLLECTION | OFFICE ROCKET | 16 |
| BOSS FIGHT COLLECTION | 2 entrées par gadget | 6 |
| **MVP COLLECTION** | tout | **51** |

Un joueur qui ne joue qu'un mode plafonne à 16-18 cartes sur 51 : le reste de l'album le lui montre, sans jamais toucher aux probabilités.

### A.2 Le moment de découverte (règle d'observation)
1. GameFlow joue la manche **exactement comme aujourd'hui** : la branche est choisie par `compileSequence` (graine du book, script, classe, rareté). La collection n'est pas une entrée de ce calcul.
2. Au **reveal**, un observateur (`CollectionTracker`) lit l'état public de GameFlow : `state === 'REVEAL'`, `round.source`, `presentation.branchId`.
3. Il enregistre la découverte **seulement si** la manche est une vraie manche du joueur :

| Source de la manche | Compte ? | Pourquoi |
|---|---|---|
| Mise normale (`play`) | ✅ | manche jouée |
| Reprise après rechargement / coupure (`resume`) | ✅ | c'est la manche misée par ce joueur ; idempotent |
| Récapitulatif d'une manche déjà réglée par le serveur (`recap`, source `resume`) | ✅ | idem (l'animation est montrée à partir du reveal) |
| Replay par URL (Stake) | ❌ | peut être la manche d'un autre joueur ; **REPLAY DOES NOT UNLOCK COLLECTION** |
| Aperçu DEV, LOOP, APERÇU BOSS FIGHT, OFFICE MELTDOWN | ❌ | aucune mise |

4. Si la carte est inconnue : `markDiscovered` → événement `NEW`. Sinon, seulement `seen + 1`.
   - Le comptage est dédoublonné par `roundId` : une reprise après le reveal ne compte pas deux fois.
5. Les jalons (milestones) sont réévalués. Les récompenses débloquées sont annoncées dans le même badge.

### A.3 Ce que la collection ne fait JAMAIS
- Choisir, favoriser ou exclure une branche (« il ne l'a pas encore, montrons-la » est interdit).
- Modifier une probabilité, un multiplicateur, un payout, le RTP, la fréquence du BOSS FIGHT ou la fréquence d'une branche.
- Retarder la manche suivante : le badge NEW ne bloque rien (ni FIRE, ni `READY_GATE`).
- Annoncer un résultat futur, une proximité ou un « dû » (voir A.5).
- Donner une valeur financière à une récompense (voir E).

Garanties **structurelles**, vérifiées en CI :
- aucun import de `src/collection` depuis `domain`, `flow`, `presentation`, `content`, `presenter` ni `platform/rgs` ;
- même book, même branche et même séquence, collection vide ou pleine (test d'intégration).

### A.4 La rareté, et comment la présenter
Même système : COMMON · UNCOMMON · RARE · VERY RARE. Libellé : **ANIMATION RARITY**.

Légende affichée dans l'album :
> *Animation rarity: how often this animation is chosen among the animations for the same result. It never changes results or odds.*

Le badge « VERY RARE » d'une carte ne veut donc pas dire « gros gain ». Exemples mesurés :
- `SLG-A3` LAP OF HONOUR est VERY RARE et c'est une **perte** (≈ 1 manche GRUMPY sur 350).
- `SLG-A5` WINDOW SEAT est COMMON parmi les gros gains, mais ne se voit qu'≈ 1 manche sur 125, parce que les gros gains sont rares.

La rareté est **cachée sur les cartes manquantes**. Elle ne sert pas à estimer « combien de temps il faut encore jouer ».

### A.5 Règles de texte (faits uniquement)
- **Autorisé** : `23 / 51 discovered`, `28 to find`, `9 / 15`, `Seen 3×`, date de première découverte.
- **Interdit** (liste testée en CI sur tous les textes de la collection) :
  - ALMOST THERE, ONE MORE, YOUR NEXT ONE, COULD BE IT, JACKPOT, SOON, DUE, LUCKY, KEEP PLAYING, DON'T STOP ;
  - toute mention de gain, de chance ou de probabilité future.
- Les indices des cartes manquantes ne révèlent **ni l'issue (perte ou gain) ni la rareté**.
  - Plusieurs cartes d'issues opposées partagent le même indice (« Going up? » pour les 4 cartes d'ascenseur d'un gadget).

### A.6 Stockage et triche
- Interface `CollectionStore` (asynchrone, pour pouvoir passer au serveur). `LocalCollectionStore` : `localStorage` (clé `badboss.collection.v1`), repli en mémoire (navigation privée, iframe sans stockage).
- **Le stockage local n'est pas sûr** : un joueur peut le modifier. Conséquence de conception : **aucune récompense ayant une valeur ne dépendra du stockage local**. Tricher ne donne ici qu'un mug d'une autre couleur.
- `ServerCollectionStore` (futur, seulement si Stake le permet) : le client enverrait des **roundId**, jamais des branchId.
  - Le serveur recalculerait la branche à partir du book, car la sélection est une fonction pure du book et de la version du contenu. Le client n'a donc pas à être cru sur parole.
  - **INFORMATION STAKE ENGINE REQUISE** : existence d'un stockage persistant par joueur, et autorisation d'un appel réseau hors RGS.
- Données corrompues, version inconnue ou carte retirée du contenu : chargement tolérant (entrées inconnues ignorées, jamais d'erreur bloquante).

### A.7 Activation (FeatureGate)
- **Mock / prototype** : collection active.
- **Mode Stake** : **désactivée par défaut** tant que Stake Engine n'a pas confirmé que la méta-progression persistante est acceptée (règle du FeatureGate : clé inconnue → valeur la plus restrictive). **INFORMATION STAKE ENGINE REQUISE.**
- Désactivée, la collection disparaît complètement : pas de bouton, pas de badge, aucune écriture. Le jeu est identique sans elle.

---

## B. UX mobile (wireframes texte, 390 × 844)

### B.1 Écran de jeu
```
┌────────────────────────────────────────┐
│ BAD BOSS          $1,000.00  [📖 23/51] 🔊│  ← bouton discret : un fait, pas un appel
├────────────────────────────────────────┤
│ ┌──────────────────┐                   │
│ │★ NEW ANIMATION    │   x0              │  ← badge « sticker » incliné, en haut à gauche,
│ │  WENDELL CEILING  │  Back to work.    │    350 ms après le résultat, visible ≈ 900 ms
│ │  +1 COLLECTION    │                   │    (1 200 ms si une récompense s'ajoute)
│ └──────────────────┘                   │  ← AUCUN son, AUCUNE couleur de gain
│            (scène)                      │    identique après une perte ou un gain
│                                         │
├────────────────────────────────────────┤
│ [GRUMPY] [FURIOUS] [UNHINGED]           │
│              [ FIRE! ]                  │  ← jamais bloqué par le badge
└────────────────────────────────────────┘
```
- Variantes du titre : `NEW ANIMATION` · `RARE DISCOVERY` · `VERY RARE DISCOVERY`. Même taille et même durée : pas d'escalade de célébration.
- Avec un jalon : 2e ligne `UNLOCKED: POLKA TIE` (même badge, pas de popup).
- Le badge ne capte aucun clic (`pointer-events: none`). Il n'apparaît jamais pendant un replay.

### B.2 Album (plein écran, style album de stickers sur chemise cartonnée « manila »)
```
┌────────────────────────────────────────┐
│ ✕                 BAD BOSS COLLECTION   │
│          23 / 51 discovered · 28 to find │
│ ┌────────┬────────┬─────────┬────────┐  │
│ │GRUMPY  │FURIOUS │UNHINGED │BOSS    │  │  ← onglets : chaque mode affiche x / total
│ │ 9/15   │ 8/14   │  5/16   │FIGHT 1/6│ │
│ └────────┴────────┴─────────┴────────┘  │
│ [REWARDS 2/9]            [ALL|FOUND|MISSING]
├────────────────────────────────────────┤
│ SWIVEL SLINGSHOT                  9 / 15│  ← section par gadget (repliable)
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░                    │
│ ┌───────┐ ┌───────┐ ┌ ─ ─ ─ ┐          │
│ │[image]│ │[image]│ │ ▒▒?▒▒ │          │  ← carte découverte : vraie image de l'animation
│ │BOING- │ │FILED  │ │  ???  │          │    carte manquante : silhouette du gadget,
│ │BACK   │ │UNDER B│ │"Going │          │    identique pour toutes les cartes manquantes
│ │COMMON │ │COMMON │ │  up?" │          │    de ce gadget (aucune info sur l'animation)
│ └───────┘ └───────┘ └ ─ ─ ─ ┘          │
│   …                                     │
│ ⓘ Animation rarity: how often this      │
│   animation is chosen among the         │
│   animations for the same result.       │
│   It never changes results or odds.     │
└────────────────────────────────────────┘
```
Fiche d'une carte découverte (toucher une carte) :
```
┌────────────────────────────────────────┐
│ [           grande image             ] │
│ WENDELL CEILING            ◆ UNCOMMON   │
│ OFFICE ROCKET · UNHINGED                │
│ "The smoke clears. B.B. is fine.        │
│  Wendell lives on the ceiling now."     │
│ Seen 3× · first seen 2026-09-26         │
│                               [ CLOSE ] │
└────────────────────────────────────────┘
```
Onglet REWARDS :
```
│ MILESTONES                               │
│ ✓ 5 DISCOVERED     MUG: WORLD'S OKAYEST  [ON ]│
│ ✓ 10 DISCOVERED    TIE: POLKA PANIC      [ON ]│
│ · 25 DISCOVERED     23 / 25    DESK: RUBBER DUCK
│ · 50 %              23 / 26    DING: DING-DONG DELUXE
│ · 100 % GRUMPY       9 / 15    SLINGSHOT: CANDY ELASTIC
│ · 100 % FURIOUS      8 / 14    TRAPDOOR: ARCTIC BLUE
│ · 100 % UNHINGED     5 / 16    ROCKET: RETRO RED
│ · 100 % BOSS FIGHT   1 / 6     ALBUM: ARCADE NIGHT
│ · OFFICE MELTDOWN   17 / 24    SPECIAL EPISODE: OFFICE MELTDOWN
│ · 100 % MVP         23 / 51    COLLECTOR'S TROPHY + ALBUM: HALL OF SHAME
│
│ SPECIAL EPISODE · OFFICE MELTDOWN
│   GRUMPY    6 / 8
│   FURIOUS   8 / 8 ✓
│   UNHINGED  3 / 8
│   17 / 24 required discoveries
│   (8 discoveries in each Rage Level · BOSS FIGHT cards not required)
```
(des faits : un compteur, jamais « presque ».)

### B.3 Passage à 200, 300, 500 animations
- **Arborescence** : RAGE LEVEL (onglet) → GADGET (section repliable avec sa progression) → cartes. À 15 gadgets, chaque onglet compte 5 gadgets et ≈ 30 cartes par gadget : lisible.
- **Filtres** ALL / FOUND / MISSING ; sections repliées par défaut au-delà de 3 gadgets.
- **Images générées depuis le contenu** : rendu hors écran de l'image clé de la branche, en différé, seulement pour les cartes visibles et découvertes. Coût artistique par nouvelle carte : zéro.
- **Textes** (nom, description, indice) dans une table de contenu. Le CI échoue si une branche n'a pas sa carte, si un nom est en double ou si un indice utilise un mot interdit.
- Catalogue versionné : une carte retirée reste dans les données du joueur sans erreur ; une carte ajoutée apparaît « manquante ».

---

## C. Modèle de données TypeScript

```ts
// src/collection/types.ts
export type CardId = string;                         // = BranchDef.id, stable pour toujours
export type SectionId = RageLevelId | 'bossfight';

// src/content/collectionCards.ts : textes par carte + indice PAR SETUP (jamais par carte)
export interface CardText { name: string; blurb: string }
export const SETUP_HINTS: Record<GadgetId, Record<SetupModule, string>>;

export interface CardDef {
  id: CardId;
  name: string;
  blurb: string;
  hint: string;                                      // = SETUP_HINTS[gadget][branch.path[0]]
  section: SectionId;
  level: RageLevelId;
  gadgetId: string;
  gadgetLabel: string;
  rarity: BranchRarity;                              // rareté de PRÉSENTATION (à résultat égal)
  order: number;                                     // ordre d'album (ordre du contenu)
}
export interface SectionDef {
  id: SectionId;
  label: string;                                     // "GRUMPY COLLECTION"…
  gadgets: { gadgetId: string; label: string; cardIds: CardId[] }[];
  total: number;
}
export interface Catalog { version: string; cards: readonly CardDef[]; sections: readonly SectionDef[] }

export type DiscoverySource = 'play' | 'resume' | 'dev';
export interface CollectionEntry {
  firstSeenAt: string;                               // ISO
  firstRoundId: string;
  seen: number;                                      // manches (dédoublonnées) où cette animation a été vue
  source: DiscoverySource;                           // 'dev' = outils de test (DEV PANEL)
}

export type MilestoneId = 'count-5' | 'count-10' | 'count-25' | 'half'
  | 'full-grumpy' | 'full-furious' | 'full-unhinged' | 'full-bossfight' | 'full-mvp';
export type MilestoneRule =
  | { kind: 'count'; n: number } | { kind: 'fraction'; f: number }
  | { kind: 'section'; section: SectionId } | { kind: 'all' };
export interface MilestoneDef { id: MilestoneId; label: string; rule: MilestoneRule; rewards: CosmeticId[] }

export type CosmeticSlot = 'mug' | 'tie' | 'desk' | 'ding' | 'elastic' | 'trapdoor' | 'rocket' | 'album' | 'episode';
export interface CosmeticDef { id: CosmeticId; slot: CosmeticSlot; name: string; description: string }

export interface CollectionState {
  version: 1;
  entries: Record<CardId, CollectionEntry>;
  milestones: Partial<Record<MilestoneId, string>>;  // date d'atteinte
  equipped: Partial<Record<CosmeticSlot, CosmeticId>>;
  opens: number;                                     // ouvertures de l'album (mesure locale)
  recentRoundIds: string[];                          // dédoublonnage (reprise après reveal)
}

export interface CollectionStore {
  readonly kind: 'local' | 'memory' | 'server';
  load(): Promise<unknown>;                          // brut : toujours passé par sanitizeCollection()
  save(state: CollectionState): Promise<void>;
  clear(): Promise<void>;
}

export interface DiscoveryEvent {
  card: CardDef;
  isNew: boolean;
  roundId: string;
  source: DiscoverySource;
  progress: { discovered: number; total: number };
  milestones: MilestoneDef[];                        // jalons atteints par CETTE découverte
  unlocked: CosmeticDef[];
}
```
Fonctions pures (testées) : `buildCatalog(gadgets, texts)`, `progress(state, catalog)`, `evaluateMilestones(state, catalog)`, `unlockedCosmetics(state)`, `shouldObserve(snapshot)`.

Service `Collection` : état en mémoire, persistance différée par le store, `observe(roundId, branchId, source)`, abonnements, et opérations DEV (`reset`, `unlockAll`, `unlockRandom(n, rnd)`, `setDiscovered(n, rnd)`, `forceNewDiscovery(rnd)`).

---

## D. Impacts

| Domaine | Impact | Détail |
|---|---|---|
| **Maths / books** | **Aucun** | Aucun champ ajouté au book, aucun appel au calculateur, aucun changement de RTP, de distribution ni de 1/150. Les poids de rareté ne bougent pas. |
| **Sélection des branches** | **Aucun** | `compileSequence` ne reçoit pas la collection. Test d'architecture (imports) + test d'intégration (même book → même séquence, collection vide ou pleine). |
| **GameFlow** | **Aucune modification** | Le tracker s'abonne aux snapshots publics (`subscribe`). La collection ne peut ni retarder ni bloquer une transition : le badge est une couche d'UI non bloquante. |
| **Replay (URL / Stake)** | Aucune découverte | État `REPLAYING` : jamais observé. Bouton COLLECTION masqué et cosmétiques non appliqués en mode replay : un replay a le même aspect pour tout le monde. |
| **Replay DEV / LOOP / APERÇU BF** | Aucune découverte | Même chemin `replayRound` → `REPLAYING`. |
| **Resume** | Découverte au reveal repris | Rechargement avant le reveal : la découverte a lieu au reveal de la reprise. Après le reveal : déjà enregistrée, et `recentRoundIds` empêche un second comptage. |
| **Déterminisme de l'image** | Aucun | Les cosmétiques sont des teintes et des accessoires de rendu (Pixi), jamais des cues ni des durées. Ils ne réutilisent aucun signal de résultat (mug doré, halo doré, suie, fumée dorée). |
| **Timing / juridiction** | Aucun | Le badge ne bloque rien. `minimumRoundDuration`, slamstop et turbo sont inchangés. |
| **Stake Engine** | Désactivée par défaut | Aucun appel réseau. `localStorage` dans l'iframe Stake : peut être partitionné ou effacé (Safari ITP, navigation privée), repli mémoire. ❓ Méta-progression persistante autorisée ? ❓ Stockage joueur côté serveur ? ❓ Contraintes par juridiction ? → **INFORMATION STAKE ENGINE REQUISE**. |
| **Réglementation** | À valider | (1) **Pertes célébrées comme des gains** (règles de type UKGC 2021) : le badge est neutre, sans son, sans couleur de gain, identique après une perte et après un gain, libellé « COLLECTION » ; un drapeau permet de ne jamais l'afficher après une perte si une juridiction l'exige. (2) Fonctions qui **incitent à prolonger le jeu** : voir la mesure de complétion (E.3). (3) Pas de « dû » : règles de texte A.5. |
| **localStorage** | Nouvelle clé `badboss.collection.v1` | Versionnée, tolérante à la corruption. Taille ≈ 60 octets par carte (≈ 30 Ko à 500 cartes). Aucune donnée personnelle. |
| **PLAYTEST** | Nouvelles mesures locales | Découvertes, ouvertures de l'album, progression de début et de fin, Rage Levels utilisés, Q8, souhait de récompense. |
| **Bundle** | + quelques Ko | Aucun asset : images générées au rendu, cosmétiques dessinés. |
| **Tests** | Nouveaux | Unitaires : catalogue, règles d'observation, jalons, store, textes interdits, frontière d'imports, déterminisme. e2e : découverte en jeu, pas de découverte en replay, album, debug, OFFICE MELTDOWN sans appel wallet. |

---

## E. Jalons et récompenses cosmétiques

### E.1 Jalons (V1)

| Jalon | Condition | Récompense (cosmétique uniquement) | Manches pour l'atteindre (médiane, jeu réparti) |
|---|---|---|---:|
| 5 DISCOVERED | 5 cartes | **MUG: WORLD'S OKAYEST BOSS** (mug de B.B. blanc à bande rouge ; jamais doré ni turquoise) | ≈ 5 |
| 10 DISCOVERED | 10 cartes | **TIE: POLKA PANIC** (cravate rose) | ≈ 12 |
| 25 DISCOVERED | 25 cartes | **DESK: RUBBER DUCK** (canard sur le bureau du joueur) | ≈ 52 |
| 50 % | 26 / 51 | **DING: DING-DONG DELUXE** (sonnerie à deux tons) | ≈ 57 |
| **OFFICE MELTDOWN** | **≥ 8 dans GRUMPY ET ≥ 8 dans FURIOUS ET ≥ 8 dans UNHINGED** (cartes BOSS FIGHT non requises) | **SPECIAL EPISODE: OFFICE MELTDOWN** | **≈ 63** (90 % : 95) |
| 100 % GRUMPY | 15 / 15 | **SLINGSHOT: CANDY ELASTIC** | ≈ 6 700 |
| 100 % FURIOUS | 14 / 14 | **TRAPDOOR: ARCTIC BLUE** | ≈ 3 000 |
| 100 % UNHINGED | 16 / 16 | **ROCKET: RETRO RED** | ≈ 4 500 |
| 100 % BOSS FIGHT | 6 / 6 | **ALBUM: ARCADE NIGHT** (thème de l'album) | ≈ 2 600 |
| 100 % MVP | 51 / 51 | **COLLECTOR'S TROPHY** (marque sur la couverture de l'album) + **ALBUM: HALL OF SHAME** (variante exclusive) | ≈ 9 800 |

Règles des récompenses :
- **cosmétiques uniquement** : pas de free spin, pas de crédit, pas de bonus de mise, pas de multiplicateur, pas de changement de RTP ;
- activées automatiquement à l'obtention, désactivables dans REWARDS ;
- purement de rendu : aucune n'imite un signal de résultat, et elles n'existent pas dans un replay.

### E.2 Idées cosmétiques pour plus tard
Nouvelle réaction idle, nouvelle pose de B.B., nouveau bureau, décorations, confettis spéciaux.

### E.3 Point d'attention : la fin de collection
La découverte est rapide au début, puis très lente :

| Découvertes (sur 51, jeu réparti) | 10 | 25 | 30 | 40 | 45 | 49 | 51 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Manches (médiane) | 12 | 52 | 86 | 403 | 1 112 | 3 260 | **9 844** |

Pourquoi : les dernières cartes sont des gags de **gros gain** présentés rarement, par exemple l'avalanche de l'ascenseur du SLINGSHOT (0,03 % des manches GRUMPY). Compléter à 100 % revient donc surtout à **beaucoup miser** et à obtenir certains gros gains.

C'est cohérent avec la règle « la collection ne change jamais les probabilités » : on ne peut pas raccourcir la fin sans toucher à la fréquence des branches, ce qui est interdit.

**Décision (2026-09-26, avant le PLAYTEST #2)** : OFFICE MELTDOWN récompense l'**exploration des trois Rage Levels**, pas des milliers de mises ni l'attente de branches liées à des résultats extrêmement rares. Le 100 % reste un **accomplissement de collectionneur**, purement cosmétique : trophée sur l'album et thème exclusif. Il n'a aucune valeur financière, aucun free spin, aucun multiplicateur, aucun changement de RTP ni aucun avantage sur les manches futures. Aucune fréquence de branche n'a été modifiée, ni pour faciliter l'un, ni pour faciliter l'autre.

| Règles étudiées | Médiane | 90e centile | Effet |
|---|---:|---:|---|
| ≥ 5 découvertes dans chaque Rage Level | 28 | 41 | pousse à essayer les 3 modes |
| **≥ 8 découvertes dans chaque Rage Level (RETENUE)** | **63** | **95** | idem, sur une session prolongée |
| 30 découvertes au total | 86 | 119 | impossible avec un seul mode (18 cartes max) |
| 100 % MVP (règle initiale, abandonnée) | 9 844 | 22 880 | surtout du volume de mises |

Implémentation : `MELTDOWN_RULE` (règle `perSection`, `src/collection/rewards.ts`). Dans REWARDS, la progression est factuelle : `GRUMPY 6 / 8`, `FURIOUS 8 / 8 ✓`, `UNHINGED 3 / 8`, `17 / 24 required discoveries` (compteurs plafonnés à 8 par Rage Level). Le déblocage est annoncé dans le badge ; l'épisode n'est **jamais ouvert automatiquement**. Pour le tester : DEV PANEL `SET 7/8/8` puis `FORCE NEW DISCOVERY` (carte manquante du Rage Level courant en priorité).

---

## F. Niveau spécial : OFFICE MELTDOWN

**Nom retenu** : « SPECIAL EPISODE: OFFICE MELTDOWN ».
- Le mot **BONUS est évité dans l'interface** : dans un jeu d'argent, il évoque des gains, des free spins ou du crédit.
- « REVENGE DAY » reste un nom possible pour la famille d'épisodes.

**Déblocage** : ≥ 8 découvertes dans chacun des trois Rage Levels (cartes BOSS FIGHT non requises), ≈ 63 manches en médiane en jeu réparti. Jamais ouvert automatiquement : le joueur décide.

**Nature** : SHOWCASE / ENTERTAINMENT ONLY.
- Aucune mise, aucun appel au RGS ni au wallet, aucun payout.
- Aucun chiffre, aucun multiplicateur, aucune pièce.
- Mention permanente à l'écran : `SHOWCASE · NO BET · NO PAYOUT`.

**Déroulé (≈ 15 s, 5 tableaux, jouable plusieurs fois)** — tous les running gags réunis :

| # | Tableau | Durée | Contenu |
|---|---|---:|---|
| 1 | MONDAY, 9:00 | ≈ 1,5 s | B.B. sirote à son bureau, les trois gadgets en place ; Wendell entre et lève le pouce ; COO se pose et salue ; la cloche sonne. |
| 2 | THE SLINGSHOT | ≈ 3 s | L'élastique, le tir, le classeur cabossé ; B.B. étourdi. |
| 3 | THE TRAPDOOR | ≈ 4 s | Le levier, la trappe ; B.B. tombe, Wendell se penche et tombe aussi ; silence, **DING** : les portes de l'ascenseur s'ouvrent sur les deux, B.B. couvert de suie. |
| 4 | THE ROCKET | ≈ 3,5 s | La fusée sous B.B. ; mèche, décollage sous le ventilateur, à travers le plafond ; Wendell jette un œil. |
| 5 | FINALE | ≈ 3,5 s | Tout est cassé (écran, ventilateur, vitre, classeur, plafond) ; Wendell collé au plafond ; extincteur, avalanche de papiers ; COO se pose sur la tête de B.B. ; B.B. regarde dans son mug **vide**, puis la caméra ; confettis. « THE END ». |

Aucun chiffre à l'écran pendant l'épisode : le résultat de la manche précédente, l'échelle du BOSS FIGHT, le badge NEW et le HUD sont masqués.

**Interaction** : entre deux tableaux, un bouton `NEXT GAG ▶`. Le joueur rythme l'épisode ; passage automatique après 1,5 s. EXIT à tout moment. Pas de choix « pick » : il ressemblerait à un bonus de casino à prix cachés.

**Technique** :
- chaque tableau est une séquence compilée par le même moteur (fonction pure du temps), dans un pseudo-gadget qui montre tous les accessoires ;
- `Presenter.playShowcase()` le joue hors GameFlow, qui reste en READY ;
- l'overlay couvre le HUD, donc FIRE et la barre d'espace sont inactifs ;
- en sortant, retour au repos du Rage Level courant.

**Plus tard** : une version avec récompense monétaire ou free spins persistants ne sera étudiée **que si** Stake Engine confirme que c'est autorisé et supporté (**INFORMATION STAKE ENGINE REQUISE**). Elle passerait alors par le book et le math-sdk, jamais par le stockage local.

---

## G. Implémentation V1 (prototype)

| Élément | Fichiers |
|---|---|
| Textes des cartes, indices par setup | `src/content/collectionCards.ts` |
| Modèle, catalogue, jalons et récompenses, stockage, service, observateur, textes | `src/collection/{types,catalog,rewards,store,Collection,tracker,copy}.ts` |
| Activation par plateforme | `metaFeaturesFor()` dans `src/flow/featureGate.ts` |
| Branchement (sans modifier GameFlow) | `src/app/bootstrap.ts` : `attachCollectionTracker(flow, collection)` avant `flow.start()` |
| Album, badge, épisode, silhouettes | `src/app/collection/{CollectionBook,NewBadge,ShowcaseOverlay,GadgetSilhouette}.svelte`, `look.ts` |
| Vignettes générées depuis le contenu | `src/render/ThumbnailRenderer.ts` (scène Pixi hors écran, image clé cadrée sur l'action) |
| Cosmétiques (rendu seul) | `src/render/cosmeticLook.ts`, `BossAnimator.setLook`, `PixiStage.setCosmetics`, `AudioDirector.setDingVariant` |
| Épisode | `src/content/showcase.ts`, `compileShowcase()` (moteur), `Presenter.playShowcase()` |
| DEV PANEL | section COLLECTION DEBUG (Mock uniquement) |
| PLAYTEST | Q8, souhait de récompense, mesures de collection ; `tools/playtest-report.mjs` |
| Tests | `tests/unit/collection.test.ts`, `tests/e2e/collection.spec.ts` ; rapport `docs/generated/COLLECTION_REPORT.md` |

Suite et état : `PHASE_0_5.md` §7.
