# TECH_ARCHITECTURE — BAD BOSS

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**
> Étapes 10 (stack) et 11 (architecture). Statut : **proposé, en attente du feu vert CODE.**
> Références : `docs/STAKE_ENGINE_FAITS_VERIFIES.md` (contraintes Stake), `docs/GDD_04*.md` (animations), `config/rage_levels.json` (maths).

## 0. La décision en 10 lignes

1. **Svelte 5 + PixiJS 8 + TypeScript**, la stack du web-sdk officiel, en **SPA Vite simple**, sans SvelteKit ni monorepo.
2. **Rendu 2.5D stylisé** : couches en parallaxe, profondeur simulée, caméra virtuelle, particules. Aucun moteur 3D.
3. **Personnages** : animation squelettique (**Spine**) derrière une interface `Rig`. Le MVP démarre avec des rigs provisoires en formes simples, sans assets définitifs.
4. **Le « ragdoll » est scripté.** Une **physique légère maison** (pas fixe, graine) sert seulement aux débris et petits objets.
5. **Réseau** : le client npm **`stake-engine`** est utilisé tel quel, derrière un **adapter très fin**. Pas de réécriture d'Authenticate, Play ou EndRound.
6. **GameFlow** : une machine à états typée, petite et testée, garante des invariants (pas de double mise, reprise, durée minimale).
7. **Mise en scène data-driven** : `Gadget → Branch → Step → Segment → Cues`, compilée par une **fonction pure** en `AnimationSequence`. Elle est **déterministe**, rejouable et positionnable (*seekable*).
8. **Déterminisme** : toute variété cosmétique vient d'une **graine écrite dans le book**. `Math.random()` est interdit dans la présentation d'une manche.
9. **Timing séparé du contenu** : vitesse (normal, turbo, super), skip (slamstop) et durée minimale sont trois mécanismes distincts, pilotés par le GameFlow et la juridiction.
10. **BAD BOSS DEV PANEL** et **MockRgs** dès la phase 0 : tout forcer, tout rejouer, boucler 20 fois.

---

# 1. Étape 10 : choix de la stack

## 1.1 Exigences concrètes de BAD BOSS

| # | Exigence | Conséquence technique |
|---|---|---|
| E1 | Site **statique** hébergé par Stake | Build Vite, chemins relatifs |
| E2 | **60 FPS sur smartphone moyen** | Rendu WebGL par lots, atlas, pools, pas de filtres coûteux |
| E3 | Look « 3D cartoon » à coût 2D | 2.5D : parallaxe, profondeur simulée, sprites pré-rendus |
| E4 | Personnages très expressifs (boss, Wendell, COO) | Animation squelettique, mouvement secondaire (mèche, cravate) |
| E5 | Particules, débris, destruction de décor | Conteneur de particules performant, physique légère |
| E6 | Caméra dynamique (secousse, ralenti, figé, suivi) | Transformations d'un conteneur racine |
| E7 | Séquenceur **déterministe, positionnable, à vitesse variable** | Timeline maison, pas de dépendance au temps réel |
| E8 | Audio en sprites, déverrouillage mobile | Howler (déjà utilisé par le web-sdk) |
| E9 | UI nette, accessible, localisée (16 langues, RTL) | HTML/CSS par-dessus le canvas, via Svelte |
| E10 | Reprise et replay exacts | Présentation = f(données de manche), sans état caché |
| E11 | Petit bundle initial | Peu de dépendances, découpage par gadget |

## 1.2 Comparatif

| Critère | **Svelte 5 + PixiJS 8** (web-sdk) | Phaser 3/4 | PixiJS seul (sans Svelte) | Three.js | Babylon.js |
|---|---|---|---|---|---|
| 2D / 2.5D mobile | ●●● WebGL par lots, `ParticleContainer` v8 | ●●● | ●●● | ● (3D, surdimensionné) | ● (3D, lourd) |
| UI HTML accessible et localisée | ●●● (Svelte) | ● (UI dans le canvas) | ●● (à la main) | ●● | ●● |
| Alignement Stake Engine | ●●● (stack officielle, `pixi-svelte` publié, Spine v8) | ● | ●● | ● | ● |
| Taille du bundle | ●● | ●● (framework complet) | ●●● | ●● | ● |
| Contrôle du séquenceur | ●●● | ●● (scènes et tweens Phaser) | ●●● | ●●● | ●●● |
| Coût d'équipe et risque | ●●● | ●● | ●● | ● (pipeline 3D, modèles, rigs 3D) | ● |
| **Verdict** | **RETENU** | Pas d'exigence qui le justifie | Svelte apporte l'UI gratuitement | Refusé : « la vraie 3D » n'est pas une exigence | Refusé |

**Aucune exigence de BAD BOSS ne justifie de quitter la stack du web-sdk.**

## 1.3 Stack retenue

Les versions seront **figées au moment du scaffold** (phase 0). Relevé npm au 2026-09-25 : svelte 5.57.1 · pixi.js 8.21.0 · vite 8.3.1 · howler 2.2.4 · @esotericsoftware/spine-pixi-v8 4.3.13 · vitest 5.0.2 · @playwright/test 1.63.0 · stake-engine 0.1.32.

| Rôle | Choix | Pourquoi |
|---|---|---|
| Langage | **TypeScript strict** (version supportée par `svelte-check` au moment du scaffold) | Types partagés entre domaine, contenu et présentation |
| Build | **Vite** (SPA, `base: './'`) | Build statique compatible avec le CDN Stake |
| UI | **Svelte 5** (runes) | HUD, cartes, menus, DEV PANEL. Léger, réactif |
| Scène | **PixiJS 8** | Rendu 2D WebGL, `ParticleContainer`, atlas |
| Personnages | **Spine 4.x** via `@esotericsoftware/spine-pixi-v8`, derrière l'interface `Rig`. Les *physics constraints* animent la mèche et la cravate | Standard du web-sdk. ❗ **Licence Spine Editor requise** pour utiliser les runtimes (question commerciale, pas Stake) |
| Rig provisoire (MVP) | `PlaceholderRig` : formes Pixi articulées (*cutout*) | Aucun asset définitif avant validation. Même interface que Spine |
| Tweens et timeline | **Maison** (`Timeline` + easing) | Seek, skip, turbo et reprise exacts. Pas de dépendance ni de licence |
| Physique | **Maison** (`DebrisSystem` : gravité, rebond, pas fixe) | Seulement débris et petits objets |
| Particules | `ParticleContainer` PixiJS 8 + pools maison | Performances, contrôle du déterminisme |
| Audio | **Howler 2.2.4** | Sprites audio, déverrouillage mobile, repli de formats |
| Machine à états | **Maison** (table de transitions typée) | Flux court et linéaire. xstate serait surdimensionné |
| Client RGS | **`stake-engine`** + `StakeRgsAdapter` | Voir `docs/STAKE_ENGINE_FAITS_VERIFIES.md` §6 |
| i18n | Dictionnaires JSON + `Intl` | 16 langues, et le boss parle *Bossish* |
| Tests | **Vitest** (unitaires) + **Playwright** (e2e, émulation mobile) | Chromium préinstallé dans l'environnement |
| Qualité | ESLint (règle anti-`Math.random` dans la présentation), Prettier, `svelte-check`, contrôle de taille du bundle en CI | Budgets tenus automatiquement |
| Assets | Atlas WebP (@1x / @2x), sprites audio Opus + AAC | Budgets mobiles (MVP_ROADMAP §4) |

## 1.4 Ce que nous reprenons du web-sdk, et ce que nous laissons

| Repris | Laissé | Raison |
|---|---|---|
| Svelte 5, PixiJS 8, Spine v8, Howler | TurboRepo, monorepo | Un seul jeu : un seul paquet suffit |
| Schémas de reprise, de replay et de fin de manche (étudiés, pas copiés) | SvelteKit | Une seule page, pas de routage |
| Paramètres d'URL de replay | xstate | Machine à états maison plus simple et testée |
| Client `stake-engine` (npm) | `pixi-svelte` (scène déclarative) | Notre scène est pilotée **impérativement** par le séquenceur ; Svelte reste pour l'UI HTML |
| — | Utilitaires spécifiques aux slots | Hors sujet |

## 1.5 « Avoir l'air plus complexe qu'il ne l'est » : les techniques 2.5D

| Technique | Coût | Effet |
|---|---|---|
| **5 couches de parallaxe** (extérieur, mur, plan principal, premier plan, overlay) | quasi nul | Profondeur réelle au moindre mouvement de caméra |
| **Profondeur simulée** : chaque acteur a un `z`. Échelle = f / (f + z), décalage vertical, tri par z | quasi nul | Objets qui « viennent vers la caméra » |
| **Ombres portées** (ellipse sous chaque acteur, taille et opacité selon la hauteur) | très faible | Ancre les objets au sol, lit les sauts |
| **Sprites pré-rendus depuis la 3D** (option artistique) | nul à l'exécution | Rendu « 3D » avec un coût 2D |
| **Squash & stretch, ressorts** (mèche, cravate, antennes) | faible | Vie organique permanente |
| **Caméra** : secousse (bruit seedé), ralenti, figé, zoom, dutch | quasi nul | Impacts spectaculaires |
| **Superpositions d'écran** (fissure, suie, coulures) | faible | Implique le joueur (BACKFIRE) |
| **Arrière-plans flous pré-calculés** (pas de filtre en temps réel) | nul | Profondeur de champ bon marché |
| **Lumière** : teinte globale, flashs additifs | faible | Alarme rouge, éclat doré du BOSS FIGHT |
| **Débris physiques** (feuilles, gobelets, canettes) | maîtrisé (pools, plafond) | Chaos crédible |

---

# 2. Étape 11 : architecture technique

## 2.1 Vue d'ensemble

```
┌──────────────────────────────────── ui/ (Svelte 5, HTML) ─────────────────────────────────────┐
│  HUD · cartes Rage Level · mise · FIRE · résultat · échelle BOSS FIGHT · menus · ReplayBar     │
│                               ▲ lit des stores          │ envoie des intentions (fire, bet…)  │
└───────────────────────────────┼─────────────────────────┼────────────────────────────────────┘
                                │                         ▼
┌──────────────────────── flow/ GameFlow (machine à états, invariants) ────────────────────────┐
│  BOOT → AUTH → READY → BET_PENDING → PRESENTING → REVEAL → SETTLING → READY_GATE → READY      │
│  RESUMING · RECONCILING · REPLAY_* · ERROR · FATAL      │ roundTiming : vitesse / skip / min.  │
└──────┬──────────────────────────────┬───────────────────┴──────────────────────┬─────────────┘
       │ RgsPort                      │ Outcome (immuable)                      │ jouer / seek / skip
       ▼                              ▼                                         ▼
┌ platform/ ───────────┐   ┌ domain/ (TS pur) ─────────┐   ┌ presentation/ (PixiJS, audio) ───────┐
│ StakeRgsAdapter      │   │ parseRound → Outcome      │   │ compileSequence (pure) → Sequence    │
│  └ npm stake-engine  │   │ resultClass, rageLevels   │   │ SequencePlayer · Stage · Camera      │
│ MockRgs (dev/tests)  │   │ seed (PRNG déterministe)  │   │ Rig (Placeholder/Spine) · FX · Audio │
│ FeatureGate · url    │   │ bet (niveaux, validation) │   │ library/ (segments partagés)         │
└──────────────────────┘   └───────────────────────────┘   └───────────────▲──────────────────────┘
                                                                           │ données
                                                           ┌ content/gadgets/<id>/ ──────────────┐
                                                           │ GadgetDef + segments + assets       │
                                                           └─────────────────────────────────────┘
```

**Règles de dépendance** :
- `domain/` ne dépend de rien ;
- `presentation/` dépend de `domain/` ;
- `content/` ne dépend que des **types** de `presentation/` ;
- `flow/` orchestre ;
- `ui/` lit des stores et émet des intentions ;
- `platform/` est le **seul** endroit qui connaît Stake ;
- `dev/` est exclu du build de production.

## 2.2 Arborescence

```
/index.html · package.json · vite.config.ts · tsconfig.json · eslint.config.js
/config/rage_levels.json               source de vérité des maths (existant, partagé Python/TS)
/src
  main.ts                              point d'entrée
  app/App.svelte                       canvas Pixi + overlay UI
  app/bootstrap.ts                     paramètres d'URL → mode play | replay | dev
  platform/
    rgs/RgsPort.ts                     interface réseau unique
    rgs/StakeRgsAdapter.ts             enveloppe du client npm `stake-engine`
    rgs/replayRequest.ts               GET /bet/replay/... (non fourni par le client)
    rgs/errorObserver.ts               capture non intrusive des codes ERR_* (limite L1)
    rgs/MockRgs.ts                     RGS simulé : books locaux, latence, erreurs, manches actives
    jurisdiction/FeatureGate.ts        can(feature), minRoundDurationMs()
    money.ts                           unités 1e6, formatage (DisplayAmount)
  domain/
    rageLevels.ts                      lit config/rage_levels.json (max win, échelles, libellés)
    outcome.ts                         parseRound(round) → Outcome (validation stricte)
    resultClass.ts                     multiplicateur → MISS | SCRAPE | HIT | BIG | MEGA | LEGENDARY
    seed.ts                            mulberry32 + hash, flux nommés
    bet.ts                             niveaux, validation, verrouillage
  flow/
    GameFlow.ts                        états, transitions, gardes, invariants
    roundTiming.ts                     SpeedMode, SkipController, READY_GATE
    resume.ts                          reprise d'une manche active, récapitulatif, réconciliation
    autoplay.ts                        seulement si la juridiction l'autorise
  presentation/
    types.ts                           Gadget, Branch, Step, Segment, Cues, BossReaction
    compileSequence.ts                 (outcome, gadget, speed) → AnimationSequence (pure)
    SequencePlayer.ts                  lecture, seek, skipToReveal, timeScale
    timeline/Timeline.ts · easing.ts
    scene/Stage.ts · Camera.ts · depth.ts · layers.ts
    actors/Rig.ts · PlaceholderRig.ts · SpineRig.ts · Boss.ts · Npc.ts · Prop.ts
    fx/ParticleSystem.ts · DebrisSystem.ts · ScreenOverlay.ts · pools.ts
    audio/AudioDirector.ts             Howler, bus, ducking, silence
    library/                           segments PARTAGÉS : hands, impacts, reactions, twists, npc, bossfight
  content/gadgets/
    index.ts                           registre des gadgets
    swivel-slingshot/gadget.ts · segments.ts · assets.json
    trapdoor-express/…
    office-rocket/…
  ui/                                  composants Svelte + stores.svelte.ts + i18n/
  dev/                                 DevPanel.svelte · forceOutcome.ts · loopRunner.ts · probes.ts · fixtures/
/public/assets/{core,gadgets/<id>,bossfight}/   atlas, sprites audio, polices (générés)
/art-src/                              sources des artistes (hors bundle)
/tools/                                check_gadget_catalogue.py (existant) · check-content.ts · build-atlases · build-audio
/tests/unit · /tests/e2e
/math/ (existant) · /math-sdk-game/games/bad_boss/ (phase 2, production Stake)
```

## 2.3 GameFlow : la machine à états

```
BOOT ──url replay=true──► REPLAY_LOADING ──ok──► REPLAYING ──fin──► REPLAY_DONE ⟲ (rejouer)
  │
  └──► AUTHENTICATING ──round.active──► RESUMING ──présentation finie + réglée──► READY_GATE
            │                                                                       │
            └──inactive──► READY ◄──────────── min. écoulée + réglée ◄──────────────┘
                             │ FIRE (garde : solde ≥ mise, rien d'actif, geste explicite)
                             ▼
                       BET_PENDING  (INTRO + SETUP neutres, boucle d'attente ; Play en vol)
                        │ ok             │ erreur ERR_*           │ délai / inconnu
                        ▼                ▼                        ▼
                    PRESENTING      READY + message         RECONCILING (nouvelle instance → Authenticate)
                  (ACTION, TWIST,                             │ active → RESUMING
                   IMPACT, BOSS_FIGHT)                        │ nouvelle manche fermée → RESUMING (récap.)
                        │ marqueur reveal                     │ rien → READY (« mise non placée »)
                        ▼
                     REVEAL ──(en parallèle) SETTLING : end-round si round.active
                        │ animation de résultat terminée ET manche réglée
                        ▼
                    READY_GATE ── attend max(0, durée min. − écoulé depuis la mise) ──► READY
```

**Invariants** (vérifiés par des tests unitaires de transitions) :

| # | Invariant | Mécanisme |
|---|---|---|
| I1 | Un seul appel wallet en vol | File d'attente séquentielle dans l'adapter |
| I2 | `Play` seulement depuis READY, sur geste explicite (ou autoplay autorisé) ; **jamais** en reprise ni en nouvelle tentative | Garde de transition, et aucun chemin de code ne rappelle `Play` |
| I3 | Tir désactivé et mise verrouillée tant qu'une manche est active ou non réconciliée | Stores UI dérivés de l'état |
| I4 | La présentation ne lit que l'`Outcome` (immuable), issu du book | `Object.freeze`, `compileSequence` pur |
| I5 | Aucun chiffre de gain avant le marqueur `reveal` | Store `winDisplay` verrouillé jusqu'au marqueur |
| I6 | `end-round` au plus une fois par manche, après le reveal ; en cas d'échec : réconciliation, jamais `Play` | État SETTLING |
| I7 | Mise suivante seulement si manche réglée **et** durée minimale écoulée **et** présentation terminée (ou skip autorisé) | État READY_GATE |
| I8 | Replay et DEV PANEL ne touchent jamais le wallet réel | Le mode replay n'instancie pas le client wallet ; le DEV PANEL passe par MockRgs |

## 2.4 Cycle de vie d'une manche et politique de fin de manche

```
t0 FIRE ─► POST /wallet/play ─────► book reçu (Outcome) ─► … ─► reveal ─► POST /wallet/end-round ─► READY_GATE ─► READY
   INTRO/SETUP neutres (0–1,4 s)     D1 : divergence           pose finale    (en parallèle du décompte)
```

- **Politique retenue** : les 3 modes sont configurés avec `auto_close_disabled=True` dans le math-sdk, ce qui écrit `autoEndRoundDisabled: true` dans la config backend. Chaque manche, **perte comprise**, reste active jusqu'à notre `end-round`, envoyé **au reveal** (pose finale et multiplicateur visibles). Conséquences :
  - avant le reveal, la manche est reprenable ;
  - après le reveal, la manche est réglée et le joueur a déjà vu son résultat. ❓ À confirmer (STAKE_ENGINE_FAITS_VERIFIES §11, point 3).
- **Repli prévu** : si `Play` renvoie `round.active = false` (fermeture automatique côté RGS), pas d'`end-round`. En cas de fermeture de page, la réouverture propose un **récapitulatif** de la manche déjà réglée, sans effet sur l'argent.
- **Montants** : la balance affichée provient toujours d'une réponse serveur. Le gain affiché est celui du serveur (`round.payout`), contrôlé contre le book (`finalWin`). En cas d'écart : le serveur fait foi, et l'écart est journalisé.

## 2.5 Reprise de manche

| Moment de la coupure | État serveur | Au retour, `Authenticate` renvoie | Comportement BAD BOSS |
|---|---|---|---|
| Avant l'arrivée de la réponse de `Play` | Manche créée ou non (inconnu) | Manche active, ou dernière manche | Manche active : reprise. Sinon : READY. Aucune nouvelle mise automatique |
| ACTION, TWIST, IMPACT | Manche active | `round.active = true` + `state` | **RESUMING** : bandeau « Reprise de votre manche », séquence complète rejouée **en vitesse turbo** depuis le book, puis `end-round` |
| REVEAL, avant l'accusé de `end-round` | Active, ou réglée si la requête est passée | Selon le cas | Active : reprise. Réglée : récapitulatif |
| Après `end-round` | Réglée | Dernière manche (inactive) | READY. Le résultat avait déjà été montré |
| BOSS FIGHT (n'importe quelle attaque) | Active | `active = true` + `state` complet | Combat **rejoué en entier en rattrapage** (turbo), puis fin normale et `end-round`. **Aucune dépendance à `/bet/event`** |
| Perte réseau sur `end-round` | Inconnu | — | RECONCILING (Authenticate) : active → nouvel `end-round` ; inactive → réglée |

**Identité du gadget à la reprise ou au replay.** Le gadget affiché doit pouvoir être reconstruit à partir des données de la manche :
- **MVP** : un gadget par Rage Level, donc gadget = f(mode). Reconstruction exacte.
- **Après le MVP** (5 gadgets par niveau) : **décision D-GADGET à prendre avant le 4e gadget.** Recommandation : **option A**, le gadget est **tiré à partir de la graine du book** au moment du FIRE. La carte affiche alors le Rage Level et son pool de gadgets, et le tirage fait partie de l'INTRO, ce qui ajoute une surprise.
  - Option B : envoyer le gadget via `meta` (❓ renvoi non confirmé).
  - Option C : `/bet/event` (écartée).

## 2.6 Replay

- **Entrée** : `?replay=true&game&version&mode&event&amount&rgs_url` (paramètres observés dans le web-sdk ❓).
- **Chargement** : `RgsPort.replay()` → même `parseRound` → même `Outcome` → même `compileSequence` → **même animation**. Aucun appel wallet, et un `ReplayBar` (rejouer, vitesse).
- **DEV PANEL** : rejoue n'importe quel `Outcome` enregistré, ou un book de fixture.
- **Test de déterminisme** : `hash(compileSequence(outcome, gadget, speed))` est comparé à des références figées (*golden tests*). Le rendu de 3 images clés est comparé par capture Playwright.

## 2.7 Déterminisme et graine

- **Source** : chaque book contient un événement `presentation` avec `seed` (uint32), `script` et `rarity`, **écrits par la génération mathématique**. Le même book donne toujours la même animation. La variété vient de la **quantité de books** : plusieurs graines par combinaison multiplicateur × script × rareté.
- **La graine ne touche jamais aux mathématiques** : le multiplicateur, la classe et le gain sont lus dans le book avant tout usage de la graine. La graine choisit seulement des **variantes cosmétiques compatibles**.
- **Flux indépendants** : `rng(seed, 'reaction')`, `rng(seed, 'camera.shake')`, `rng(seed, 'vfx.debris')`, `rng(seed, 'audio.variant')`. Ajouter un effet dans un flux ne décale pas les autres.
- **Indépendance vis-à-vis de la fréquence d'images** : particules et débris sont simulés à **pas fixe (1/60 s)** sur l'horloge de la séquence, jamais sur l'horloge murale. Le rendu interpole.
- **Interdits** : `Math.random()` et `Date.now()` dans `presentation/` et `content/`, bloqués par ESLint (`no-restricted-properties`, `no-restricted-globals`).
- **État hors manche** (idles, blessures du boss) : il n'existe qu'en READY. Au FIRE, l'INTRO neutre remet le boss dans un état **canonique** (GDD_06 §7.7).

## 2.8 Modèle de mise en scène (le cœur)

### Les types (conception ; le code suivra ces formes)

```ts
// domain/outcome.ts : ce que dit le book (source de vérité unique, immuable)
export type RageLevelId = 'grumpy' | 'furious' | 'unhinged';
export type ResultClass = 'MISS' | 'SCRAPE' | 'HIT' | 'BIG' | 'MEGA' | 'LEGENDARY';
export type Script = 'CLEAN_MISS' | 'BACKFIRE' | 'TEASE' | 'GRAZE' | 'DIRECT'
                   | 'COMEBACK' | 'CHAIN' | 'SUPER' | 'BF_ENTRY';
export type Rarity = 'common' | 'rare' | 'epic';

export interface Outcome {
  source: 'play' | 'resume' | 'replay' | 'dev';
  betId: number | null;
  mode: RageLevelId;
  payoutMultiplier100: number;   // entier ×100 (book)
  resultClass: ResultClass;      // dérivé du multiplicateur, contrôlé contre le book
  script: Script;
  rarity: Rarity;
  seed: number;                  // uint32, graine de présentation écrite dans le book
  bossFight: { attacks: { result: 'HIT' | 'BLOCKED'; variant: number }[]; ko: boolean } | null;
}
```

```ts
// presentation/types.ts : le contenu (données) que le moteur sait jouer
export interface GadgetDef {
  id: string;                          // 'office-rocket'
  rageLevel: RageLevelId;
  bundle: string;                      // manifest d'assets chargé à la demande
  trunk: { steps: Step[]; holdLoop: string; divergenceMs: number };
  branches: BranchDef[];
  segments: Record<string, SegmentDef>; // segments propres au gadget
}

export interface BranchDef {
  id: string;                          // 'RKT-FW1', même identifiant que le GDD
  category: Script;
  classes: ResultClass[];              // classes que la branche sait servir
  rarity: Rarity;
  d1: string;                          // état visible à D1 (contrôle de non-révélation)
  steps: Step[];                       // ce qui se passe après D1
}

export type Step =
  | { seg: string }                    // segment propre ou partagé (library/)
  | { impact: ImpactDirection }        // le TIER est choisi par l'Outcome (le COMBIEN)
  | { reaction: BossReaction | 'auto' }// 'auto' : pool selon la classe, choix par la graine
  | { silence: number }                // ms ; supprimé en turbo
  | { bossFight: true };               // enchaîne la séquence du BOSS FIGHT

export interface SegmentDef {
  id: string;
  ms: number;
  turbo: 'keep' | 'compress' | 'drop';
  reveals?: true;                      // pose le marqueur « reveal » (IMPACT)
  actors?: ActorCue[];
  camera?: CameraCue[];
  audio?: AudioCue[];
  vfx?: VFXCue[];
}

export type ActorCue =
  | { at: number; actor: string; anim: string; loop?: boolean }          // animation de rig (Spine ou provisoire)
  | { at: number; actor: string; tween: Partial<Transform25D>; ms: number; ease?: Ease }
  | { at: number; actor: string; state: string };                       // bascule d'état ou de texture

export interface CameraCue { at: number; shot: CameraShot; ms?: number; intensity?: number; target?: string }
export interface AudioCue  { at: number; sound: string; bus?: AudioBus; variants?: number } // variante choisie par la graine
export interface VFXCue    { at: number; fx: string; where: string; count?: number }

// Une BossReaction est simplement un segment partagé joué sur l'acteur « boss »
export type BossReaction = 'SIP' | 'LAUGH' | 'FLEX' | 'WATCH' | 'FIRED' | 'DUST'
                         | 'OBLIVIOUS' | 'SHRUG' | 'PLANNED' | 'WAVE' | 'SULK' | 'DAZED';

// Résultat compilé, plat et déterministe, pour UNE manche
export interface AnimationSequence {
  key: string;                         // hash(outcome, gadget, vitesse) : tests de référence
  totalMs: number;
  markers: { d1: number; reveal: number; end: number };
  cues: ScheduledCue[];                // tous les cues à temps absolu, triés
}
```

**Neuf notions, cinq types de données, deux fonctions.** Il n'y a ni classe abstraite, ni héritage, ni système de plugins :
- `compileSequence(outcome, gadget, speed)` : **pure**, testée, déterministe ;
- `SequencePlayer.play(sequence)`, avec `seek(ms)` et `skipToReveal()`.

### Compilation (algorithme)

1. Candidats : branches du gadget telles que `category === outcome.script` et `outcome.resultClass ∈ classes`.
2. Filtre de rareté, avec repli sur la rareté disponible la plus proche. Puis `branch = candidats[outcome.seed % n]`.
3. Déplier `trunk.steps`, puis `branch.steps`, en segments à temps absolu :
   - `impact` → segment partagé `IMP_T{tier}_{direction}`, le tier venant de `resultClass` (T0,5 à T3), avec le calque WRECK pour un MEGA ;
   - `reaction: 'auto'` → pool de la classe, choix par `rng(seed, 'reaction')` ;
   - `bossFight` → séquence BF compilée depuis `outcome.bossFight.attacks`.
4. Appliquer la vitesse : en turbo, `drop` supprime, `compress` accélère (×1,6 à ×2) et `keep` ne change rien. Les silences sont retirés.
5. Poser les marqueurs `d1`, `reveal` (premier segment `reveals`) et `end`.

### Exemple de contenu (extrait d'OFFICE ROCKET)

```ts
export const officeRocket: GadgetDef = {
  id: 'office-rocket', rageLevel: 'unhinged', bundle: 'gadgets/office-rocket',
  trunk: { steps: [{ seg: 'HND_LIGHTER' }, { seg: 'RKT_SU_STRAP' }, { seg: 'RKT_SU_FUSE' }],
           holdLoop: 'RKT_SU_FUSE_LOOP', divergenceMs: 1300 },
  branches: [
    { id: 'RKT-L3', category: 'CLEAN_MISS', classes: ['MISS'], rarity: 'common', d1: 'b',
      steps: [{ seg: 'RKT_AC_STALL' }, { seg: 'RKT_AC_MARSHMALLOW' }, { reaction: 'SIP' }] },
    { id: 'RKT-FW1', category: 'COMEBACK', classes: ['HIT', 'BIG', 'MEGA'], rarity: 'common', d1: 'b',
      steps: [{ seg: 'RKT_AC_STALL' }, { reaction: 'LAUGH' }, { silence: 300 },
              { seg: 'RKT_TW_REIGNITE' }, { impact: 'window' }, { reaction: 'auto' }] },
    // … les 9 autres branches du catalogue GDD_04b
  ],
  segments: { /* RKT_SU_STRAP, RKT_AC_STALL, RKT_TW_REIGNITE… : durées + cues */ },
};
```

### Ajouter un 16e gadget

1. Déposer ses assets dans `art-src/`, puis générer `public/assets/gadgets/<id>/` (atlas + sprite audio).
2. Créer `content/gadgets/<id>/gadget.ts` et `segments.ts`, en réutilisant la `library/` (mains, impacts, réactions, twists, PNJ).
3. L'inscrire dans `content/gadgets/index.ts`.
4. Lancer `pnpm check:content` : non-révélation, équilibre des états, catégories obligatoires, budget de TEASE, iconographie réservée, références de segments et d'assets valides.
5. Le DEV PANEL liste automatiquement ses branches, qu'on peut toutes jouer et boucler 20 fois.

**Aucune modification** du moteur, du GameFlow, de l'UI ni du réseau.

## 2.9 Timing : trois mécanismes séparés

| Mécanisme | Qui décide | Effet | Juridiction |
|---|---|---|---|
| **Vitesse** (NORMAL, TURBO, SUPER) | Réglage du joueur, filtré par `FeatureGate` | Paramètre de `compileSequence` (drop / compress). Même contenu | `disabledTurbo`, `disabledSuperTurbo` : l'option n'est pas proposée |
| **Skip / slamstop** | `SkipController` | `SequencePlayer.skipToReveal()`, seulement une fois le book reçu | `disabledSlamstop` : le bouton n'existe pas. ❓ Sémantique |
| **Durée minimale** | GameFlow (READY_GATE) | **Aucune** modification des animations : on attend le temps restant avant d'autoriser la mise suivante | `minimumRoundDuration`. ❓ Unité et point de départ |

**Unité de `minimumRoundDuration` (❓)** : une fonction unique, `FeatureGate.minRoundDurationMs()`, isole l'interprétation.
- Garde provisoire tant que le contrat n'est pas confirmé : valeur ≤ 60 → secondes, sinon millisecondes, avec un avertissement en développement.
- Point de départ provisoire : l'envoi de la mise.
- **Bloquant pour la mise en production** : à remplacer par le contrat officiel.

## 2.10 FeatureGate

- Un seul module lit `jurisdiction` (après Authenticate) et expose `can('turbo' | 'superTurbo' | 'autoplay' | 'slamstop' | 'spacebar' | 'fullscreen' | 'buyFeature')`, `display('rtp' | 'netPosition' | 'sessionTimer')`, `socialCasino` et `minRoundDurationMs()`.
- L'UI **ne construit que** ce qui est autorisé. Rien n'est créé puis grisé.
- **Absence de clé** : on retient la valeur la plus restrictive (fonctionnalité non proposée, affichage activé).

## 2.11 Couche réseau : `RgsPort`, `StakeRgsAdapter`, `MockRgs`

```ts
export interface RgsPort {
  authenticate(): Promise<AuthResult>;                          // balance, config, jurisdiction, round | null
  play(amount: number, mode: RageLevelId): Promise<PlayResult>; // jamais relancé automatiquement
  endRound(): Promise<BalanceResult>;
  balance(): Promise<BalanceResult>;
  replay?(params: ReplayParams): Promise<RoundData>;            // replay uniquement
}
type RgsError = { kind: 'rgs'; code: string } | { kind: 'timeout' } | { kind: 'network' } | { kind: 'protocol' };
```

- **`StakeRgsAdapter`** (≈ 150 lignes) : délègue au client `stake-engine`. Il ajoute :
  - un délai de 15 s ;
  - l'observateur de codes d'erreur ;
  - la **réinstanciation du client** avant toute réconciliation ;
  - la conversion en `RgsError`.

  Il n'invente aucun endpoint. Le replay est la seule requête directe, isolée et désactivable.
- **`MockRgs`** : même interface. Il sert des books locaux (fixtures générées depuis le calculateur, puis depuis le math-sdk en phase 2). Il simule :
  - latence, délais dépassés, erreurs `ERR_*` ;
  - manches actives à la connexion ;
  - fermeture automatique ou non.

  Il sert au DEV PANEL, aux tests e2e et à la **préversion jouable** hors Stake.

## 2.12 Assets et chargement

| Paquet | Contenu | Chargement |
|---|---|---|
| `core` | décor de l'open-space, boss, UI, mains, impacts, réactions, sons de base, police | avant le premier écran jouable |
| `gadgets/<id>` | atlas et sprite audio d'un gadget | MVP : les 3 gadgets juste après `core`. Plus tard : à la demande, avec préchargement du prochain gadget possible |
| `bossfight` | poses géantes, échelle, thème musical | en arrière-plan après le premier tir. **Joué en rattrapage s'il n'est pas prêt** |
| `super/<id>` | super-gadgets | à la demande (post-MVP) |

Atlas WebP 2048² au maximum, variantes @1x et @2x choisies selon l'écran. Audio : Opus + AAC, la musique en streaming (HTML5 audio) pour éviter la mémoire PCM. Chaque paquet a un budget (MVP_ROADMAP §4).

## 2.13 Architecture de performance

- **Pools** pour particules, débris, textes flottants et superpositions. Chaque objet mis en pool implémente `reset()`, et le DEV PANEL vérifie la remise à zéro.
- **Zéro allocation dans la boucle de rendu** pendant une manche : pas de closures ni de tableaux temporaires dans `update()`.
- Regroupement par atlas **et par couche**, pour réduire les draw calls. Pas de filtres temps réel en jeu ; flous et halos sont pré-rendus.
- Résolution plafonnée à `min(devicePixelRatio, 2)`. **Résolution dynamique** (2 → 1,5 → 1,25) si la durée d'image p95 dépasse 20 ms pendant 2 s.
- Onglet masqué : rendu suspendu. La séquence s'appuie sur son horloge et reprend proprement.
- Sondes du DEV PANEL : FPS, durée d'image p95, draw calls, nombre de textures et d'objets d'affichage, tas JS (si disponible), particules actives.

## 2.14 BAD BOSS DEV PANEL (développement uniquement)

- **Exclusion de la production** : `import.meta.env.DEV`, plus un contrôle CI qui vérifie que le bundle final ne contient pas `dev/`. Les résultats forcés passent **exclusivement** par `MockRgs`.

| Forçage | Détail |
|---|---|
| Rage Level, Gadget | Listes issues de `config/rage_levels.json` et du registre de contenu |
| Outcome | Classe, script, rareté, graine (ou « aléatoire »), **multiplicateur** (valeurs existantes du niveau) |
| Branche d'animation | Toutes les branches du gadget, avec les combinaisons invalides signalées |
| BOSS FIGHT | Oui ou non, **palier final**, bloqué ou K.O., variantes d'attaque |
| Vitesse | Normal, turbo, super |
| Appareil | Cadres mobile portrait, mobile paysage, desktop |
| Juridiction | Simulation de chaque clé (turbo, slamstop, autoplay, `minimumRoundDuration`…) |
| Réseau | Latence, délai dépassé sur Play ou EndRound, erreurs `ERR_*` |
| **Reconnect / Resume** | « Couper maintenant » à n'importe quelle phase (ACTION, TWIST, IMPACT, REVEAL, BOSS FIGHT), puis relancer le boot avec la manche active |
| **Replay** | Rejouer la dernière manche, une manche enregistrée ou un book de fixture ; comparer le hash de séquence |
| **Boucle ×20** | Jouer 20 fois la même séquence, puis rapport : dérive de timing par marqueur, objets et textures en fin de boucle (doivent revenir à la ligne de base), croissance du tas, pools non restitués |
| Outils | Chronologie des cues (qui joue quoi, quand), matrice de non-révélation en direct, mesure de P(gain \| état D1) sur 100 000 tirages simulés |

## 2.15 Stratégie de tests

| Niveau | Contenu |
|---|---|
| Unitaires (Vitest) | `parseRound` (books valides et invalides) ; `resultClass` ; `compileSequence` (déterminisme, références figées, turbo) ; GameFlow (toutes les transitions et I1 à I8) ; `FeatureGate` ; PRNG |
| Contenu | `check:content` (TS), sur le modèle de `tools/check_gadget_catalogue.py` |
| E2E (Playwright + MockRgs, émulation mobile) | Les **critères MVP** (MVP_ROADMAP §1) : jouer, les 3 niveaux, reprise à chaque phase, replay, erreurs, juridictions |
| Endurance | 1 000 manches en autoplay simulé : mémoire stable, aucune fuite de pool |
| Staging Stake | Parcours complet sur le RGS de staging (phase 3) |
| Maths | `rgs_verification.py` du math-sdk + comparaison statistique avec `config/rage_levels.json` |
