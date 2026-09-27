# PHASE 0.6 — VISUAL UPGRADE (vertical slice GRUMPY + SWIVEL SLINGSHOT)

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**
> Statut : **vertical slice livrée, en attente de validation.** Les 48 autres branches et la Phase 1 ne sont PAS commencées.
> Rien n'a changé dans les maths, le RTP, les probabilités, les Rage Levels, GameFlow, le RGS, la sélection des
> branches ni leurs fréquences. Le contenu P05-C (préversion du PLAYTEST #2) reste publié à part, inchangé.

## 0. Ce qui a été demandé, ce qui a été fait
| Étape | Livrable | Où |
|---|---|---|
| 1 | Skills PixiJS installés, Game Assets Enhancer inspecté (payant : STOP) | `.claude/skills/`, §1 |
| 2 | Inspection du renderer : quoi garder, quoi remplacer | §2 |
| 3 | Art bible + validation automatique | `BAD_BOSS_ART_BIBLE.md`, `tests/unit/artBible.test.ts` |
| 4 | Concept frames GRUMPY / FURIOUS / UNHINGED | `docs/phase06/concepts/` |
| 5 | Vertical slice jouable (PERTE, GAIN, GROS GAIN, NEW DISCOVERY, NEW REWARD) | code, préversion, §4 |
| 6 | Tests mobile / desktop / performance / replay / reprise / déterminisme / GameFlow | §8, §10 |
| 7 | Captures avant / après | `docs/phase06/captures/`, §5 |

## 1. Skills
**Installés** (dépôt `pixijs/pixijs-skills`, commit df555b8, licence MIT copiée) : 15 skills PixiJS dans `.claude/skills/`
(`pixijs`, `pixijs-performance`, `pixijs-scene-graphics`, `pixijs-scene-sprite`, `pixijs-assets`, `pixijs-filters`,
`pixijs-blend-modes`, `pixijs-scene-particle-container`, `pixijs-scene-mesh`, `pixijs-scene-container`,
`pixijs-scene-core-concepts`, `pixijs-application`, `pixijs-math`, `pixijs-ticker`, `pixijs-color`).

**Réellement utilisés** :
- *performance* : atlas plutôt que Graphics complexes, regroupement par texture, aucun filtre temps réel, flous pré-calculés ;
- *sprite / assets* : textures de pages d'atlas avec cadres ; densité par `resolution` de la source (cadres en unités du monde) ;
- *graphics* : `FillGradient` pour les grandes surfaces (mur, sol, plafond, bureau du joueur) ;
- *blend-modes* : `add` pour le rayon de lumière, la poussière dans la lumière, l'alarme et le voile chaud ;
- *container* : teinte héritée (`tint`) pour l'étalonnage des mondes et l'image d'impact.

**Game Assets Enhancer** : **non installé, non utilisé.** Ses opérations de génération passent par **fal.ai (payant** :
`fal-ai/nano-banana-pro`, `pixelcut/background-removal`, « quelques dollars » par refonte). Conformément à la consigne,
STOP sur cette partie : aucune API payante, aucun crédit dépensé. Pour l'utiliser, il faudrait : un compte fal.ai, une
clé `FAL_KEY` dans l'environnement, et votre accord explicite sur le budget. Sa **méthode** (gratuite) a été reprise à
la main dans l'art bible : sous-teinte chaude commune, une seule direction de lumière, vraie plage de valeurs (cel),
perspective atmosphérique, étalonnage en code (voile chaud + vignettage), écrasement à l'atterrissage, réactions en
couches, vie au repos de l'élément focal.

## 2. Renderer : gardé / remplacé
**Gardé (le moteur ne change pas)** : `compileSequence` (pur), `SequencePlayer` (seek, gel, attente à D1), la timeline
évaluable, les particules analytiques, `CharacterAnimator` (même contrat, mêmes 44 + 11 + 6 + 4 animations), les
identifiants d'acteurs et leurs états, le cadrage portrait adaptatif, `SceneSink`.

**Remplacé** :
- personnages placeholders (`BossAnimator`, `minorCharacters`, supprimés) → rigs illustrés `BossRig`, `WendellRig`,
  `CooRig`, `HandsRig` ;
- décor en formes simples → bureau en couches 2.5D (`officeScene.ts`) et accessoires d'atlas ;
- particules dessinées en `Graphics` à chaque image → sprites d'atlas (un seul lot de dessin) ;
- badge NEW fixe → carte qui vole jusqu'au bouton COLLECTION.

**Ajouté au moteur (pur, testé)** : dans chaque image, pour les personnages, l'animation précédente (fondu court) et
un **mouvement secondaire à ressort** (cravate, touffe) calculé par convolution sur l'historique des pistes ; une
**horloge de présentation** (vie ambiante pendant l'attente). Replay, reprise et seek donnent toujours la même image.

**Encore placeholder** (hors slice) : trappe, levier, mèche, projectiles et décor du BOSS FIGHT, fumée plein écran.

## 3. Art bible
`BAD_BOSS_ART_BIBLE.md` : silhouettes, proportions, palette (source unique `src/render/art/palette.ts`), échelle des
traits, ombres cel, détail, expressions (fiche), LE SIP, perspective et couches, règles du décor, trois mondes RAGE,
VFX, son, UI, interdits, validation automatique + revue manuelle, pipeline.

## 4. La vertical slice
**Préversion jouable (privée)** : https://claude.ai/artifact/GyhNWNHRZfpJddDK2M5oNh — fichier unique, Mock RGS,
aucun argent réel. La préversion P05-C du PLAYTEST #2 reste https://claude.ai/artifact/2oG78eNrGNuwiL9aL2SWkA (inchangée).

Jouable normalement (GRUMPY, FIRE). Pour voir un cas précis : DEV PANEL → résultat forcé (+ branche forcée).
- **PERTE — `SLG-C1`** : le lance-pierre part à l'envers, B.B. saute, se protège… rien. La chaise revient et pulvérise
  l'écran, qui pivote ; son câble arrache la plante ; Wendell accourt et plonge ; la plante atterrit… sur le bureau.
  B.B. a tout regardé. **LE SIP.** x0.
- **GAIN — `SLG-A4`** : l'élastique tremble ; B.B. REMARQUE (la prise) ; image d'impact + hit stop ; il est projeté
  (la cravate traîne) ; le mug reste suspendu en l'air, tombe, **CLINK** ; Wendell accourt et regarde ; poussée de
  caméra ; choc contre le classeur (image d'impact, hit stop, éclat) ; le multiplicateur s'affiche au contact.
- **GROS GAIN — `SLG-A5`** : même départ ; le COO voit arriver B.B. et s'enfuit (plumes) ; la caméra pousse vers la
  fenêtre ; B.B. regarde l'objectif une fraction de seconde (gel) ; fracas de la vitre ; la caméra continue de pousser
  pendant les DING ; le décor réagit (portrait, plante, papiers) ; B.B. devient une étoile qui scintille au loin ;
  retour caméra progressif ; Wendell fête (ou vérifie) selon la graine.
- **NEW DISCOVERY** : résultat → 350 ms → carte NEW → elle rétrécit et vole jusqu'au bouton COLLECTION → le bouton
  réagit → le compteur passe à +1 (≈ 1,5 s ; 1,8 s si une récompense s'ajoute). Couleurs de la collection, aucun son.
- **NEW REWARD** : petit cadeau sur le bouton COLLECTION, pulsation douce (1,6 s), étincelle, pastille du nombre de
  récompenses non vues, libellé « REWARD UNLOCKED » 2,6 s ; « vu » dès l'ouverture de l'onglet REWARDS (sauvegardé).

Contraintes respectées (tests) : tronc et setups partagés inchangés en durée et neutres ; chaque début mène toujours
aux deux issues ; fin → reveal ≤ 800 ms ; durée moyenne ≤ P05-A × 1,15 ; un seul reveal ; le multiplicateur n'apparaît
qu'au signal reveal de GameFlow.

## 5. Captures avant / après
Mêmes branches forcées, mêmes graines, mêmes instants (séquence en pause et positionnée : `tools/capture-phase06.mjs`),
4 formats : 390 × 844, 360 × 640, 430 × 932, 1100 × 760. Dans `docs/phase06/captures/` : `before-*` (placeholders,
commit de départ) et `after-*` (slice), pour `1-idle`, `2-anticipation`, `3-impact`, `4-win`, `5-bigwin-impact`,
`6-bigwin`, `7-loss-chain`, `8-loss-sip`, `9-new-discovery`, `9b-new-discovery-late`. Planches de comparaison :
`docs/phase06/compare-*.jpg`. Concept frames : `docs/phase06/concepts/` (1600 × 900 et portrait).

## 6. Nouveaux assets (130 pièces SVG, 4 atlas, aucun fichier binaire)
| Atlas (densité) | Pièces |
|---|---|
| personnages + VFX (2 px/unité, 2048 × 1024) | **B.B. (49)** : torse, 2 jambes, bras (haut, avant-bras), 3 mains (ouverte, poing, prise), 3 mugs (jaune, or BOSS FIGHT, « okayest »), vapeur, 4 cravates (normale, pois, tendue, coupée), tête, rougeur, suie, sueur, veine, touffe, touffe coupée, 2 blancs d'yeux, 2 pupilles, 2 paupières, 5 yeux « plats » (fermés, heureux, serrés, X, spirale), sourcil, 11 bouches, fauteuil, 2 fusées · **Wendell (17)** : jambe, torse, tête, lunettes, œil, œil fermé, sourcil, 4 bouches, bras (haut, avant-bras), main, pouce levé, dossiers, casque de chantier · **COO (3)** : corps à mini-cravate, tête, aile · **mains du joueur (4)** : manche, dos de main ouverte, poing, briquet · **VFX (16)** : nuage, étincelle, étoile, scintillement, éclat de verre, papier, confetti, bulle, plume, mèche, flamme, débris, feuille, éclat d'impact, lignes de vitesse, anneau |
| accessoires (1,75, 2048 × 512) | bureau de B.B., écran (normal, cassé, fêlé), sonnette, poteau du lance-pierre, poche de cuir, ventilateur (moteur, pales, cassé), bureau du joueur (clavier, mug turquoise, post-it, cactus, pot à crayons), canard (cosmétique), agrafeuse plantée |
| décor (1,5, 2048 × 1024) | fenêtre (cadre et store, reflets, vitre brisée), portrait de B.B., tableau de liège, horloge et aiguilles, graphique encadré, classeur (+ bosse), plante, ascenseur (+ voyant, bosse, 2 portes), extincteur et tuyau, plafonnier, trou dans le plafond |
| lumière (0,6, 1024 × 512) | ciel et skyline, rayon de lumière, ombre de contact |

Surfaces en vecteurs (dégradés `FillGradient`) : mur, lambris, plinthe, sol en perspective, plafond en perspective,
plateau du bureau du joueur. Textures d'étalonnage générées au démarrage : vignettage, voile chaud (256 × 256).

## 7. VFX, filtres, shaders
- **Aucun filtre temps réel, aucun shader personnalisé.** Les flous (ombres de contact, rayon de lumière) sont
  pré-calculés à la rastérisation (SVG `feGaussianBlur`).
- Modes de fusion : `add` (rayon de lumière, poussière dans le rayon, voile chaud, alarme d'UNHINGED) ; tout le reste
  en normal (lots de dessin intacts).
- Teintes : étalonnage des mondes (fond, pièce, personnages, plafond, premier plan, ciel) et **image d'impact**
  (personnages en encre sur un plan papier, 40 ms, puis hit stop).
- Particules : sprites d'atlas (un seul lot), taille, rotation et teinte depuis le préréglage ; nuages qui gonflent en
  vieillissant ; nouveaux préréglages `burst` (éclat d'impact), `debris`, `leaves`.
- Traînée : lignes de vitesse orientées + étirement du corps à volume constant au-delà de 0,9 unité/ms.
- Mouvement secondaire : cravate et touffe (ressort 2,6 Hz, amortissement 0,3), fondus de 60 à 180 ms entre
  animations (0 ms pour les chocs).
- Caméra : poussée avant l'impact, secousse et punch au contact (bibliothèque), poussée lente pendant les DING du
  gros gain, retour progressif, parallaxe (fond 0,96, premier plan 1,08, ciel 0,8).
- Repères son/image (sons synthétisés provisoires derrière `AudioSink`) : STRETCH, SNAP, CLINK, PAPER, DEBRIS
  ajoutés ; WHOOSH, THUD, DING, SIP, GLASS existants, calés sur les poses.

## 8. Performances
> Mesures en Chromium headless avec **rendu logiciel SwiftShader** (pas de GPU) : les FPS absolus ne représentent pas
> un téléphone. Ce qui compte : appels de dessin, particules, mémoire, stabilité, coût CPU de notre code.

**Appels de dessin par image** (`tools/drawcalls.mjs`, 390 × 844) — budget MVP : ≤ 30 en moyenne, ≤ 60 en pic.

| Instant | Appels de dessin | Particules |
|---|---:|---:|
| READY (repos) | 11 | — |
| `SLG-A4` anticipation (D1 − 80 ms) | 11 | 0 |
| `SLG-A4` image d'impact (reveal) | 3 | 28 |
| `SLG-A4` hit stop / après le choc | 11 | 22–28 |
| `SLG-A5` juste avant / au choc / + 200 ms | 11 | 10 / 67 / 80 |
| `SLG-C1` reveal / chaîne / LE SIP | 11 / 12 / 12 | 31 / 32 / 14 |

**Mémoire des textures** : 4 atlas, ≈ 22 Mo (≈ 29 Mo avec mipmaps), dans le budget mobile de 64 Mo ; + ≈ 7 Mo
pendant l'ouverture du COLLECTION BOOK (vignettes à demi-densité). Particules : 80 au pic du GROS GAIN
(budget ≤ 150 en moyenne, ≤ 300 en pic).

**Images par seconde, mêmes conditions** (même machine, même moment, build de production, 1100 × 760, READY) :

| Build | FPS (rendu logiciel) | CPU de notre code / image |
|---|---:|---:|
| P05-C (avant, placeholders) | 20,4 – 20,9 | 0,9 ms |
| Phase 0.6, première version | 10,5 – 11,3 | 1,5 ms |
| **Phase 0.6, optimisée** | **14,5 – 15,1** | 1,2 ms |

Le coût est du **remplissage** (pixels), pas du CPU ni des appels de dessin : scène entièrement masquée = 33 FPS,
fond seul = 20, tout = 9,5 dans la première version. Optimisation faite : chaque grande surface lisse (mur, sol,
plafond, bureau du joueur) est pré-calculée dans UNE petite toile (0,25 px par unité : un dégradé n'a pas besoin de
résolution), les traits fins restent en vecteurs, le lambris est une toile nette (1 px par unité), et le vignettage et
le voile chaud ne font plus qu'une passe. Pistes suivantes si les téléphones réels le demandent : réduire le rayon de
lumière additif, résolution dynamique (déjà prévue par l'architecture), atlas pré-rendus avec mipmaps au build.

**LOOP ×100** (turbo, 3 Rage Levels, sans mise, première version) : 100 / 100 manches, 0 erreur, 0 erreur JS,
**0 appel wallet**, tas JS stable 11,4 → 11,9 Mo, textures 27,5 Mo, particules max 94, CPU de notre code 1,0 ms /
image (p95 1,8 ms). Rapport : `docs/generated/LOOP_X100_PHASE06.md` (l'ancien `LOOP_X100.md` reste la référence P05).

**Démarrage** : initialisation de la scène, rastérisation des atlas comprise : 1,2 à 2,7 s en rendu logiciel headless
(à mesurer sur téléphone ; le pré-rendu au build la supprime).

## 9. Taille du build (avant → après)
| | Avant (commit de départ) | Après (slice) | Écart |
|---|---:|---:|---:|
| `dist/` total (brut / gzip) | 832,0 / 250,2 Ko | 900,7 / 273,4 Ko | +68,7 / +23,2 Ko |
| Chargement initial (brut / gzip) | 761,9 / 229,9 Ko | 830,6 / 253,2 Ko | +68,7 / +23,3 Ko |
| Fichier unique (`build:single`) | 842,4 Ko | 911,1 Ko | +68,7 Ko |

L'art est du **code** (≈ 197 000 caractères de SVG générés à partir de ≈ 60 Ko de source TypeScript) : aucun fichier
image. Budget JS initial ≤ 300 Ko gzip (MVP_ROADMAP §4) : **253,2 Ko**, tenu. (Ko = 1 024 octets.)

## 10. Tests
- **Unitaires / intégration (Vitest) : 98**, tous verts (89 avant ; +5 cohérence de l'art bible, +4 vertical slice).
  Nouveaux : couleurs de la palette uniquement, échelle des traits, ni texte ni image, pivots, atlas (une page par
  livre, pas de chevauchement, mémoire ≤ 32 Mo) ; image d'impact + hit stop ; reveal unique et chaîne après le
  reveal ; mouvement secondaire nul au repos, présent au lancement, **lecture continue = seek** ; LE SIP calé.
  Étendu : **aucune source de hasard ni d'horloge dans `src/render`** (en plus de `src/presentation` et `src/content`).
- Audit de variété inchangé et vert : deux issues possibles après chaque début, rapport de vraisemblance ∈ [0,5 ; 2],
  fin → reveal ≤ 800 ms, durée moyenne ≤ P05-A × 1,15.
- **E2E (Playwright) : 18**, tous verts, dont reprise pendant l'animation (même branche, même graine, même résultat),
  replay (DEV et URL, aucun appel wallet), coupures réseau, fin de manche perdue, LOOP x20, PLAYTEST 50 complet,
  aperçu BOSS FIGHT, collection (NEW, replay sans effet, reprise idempotente, OFFICE MELTDOWN, trophée).
- `svelte-check` : 0 erreur, 0 avertissement.
- GameFlow, RGS, maths, books, sélection des branches : **aucune ligne modifiée**.

## 11. Problèmes connus
1. **Rastérisation au démarrage** : les atlas sont produits dans le navigateur à partir des SVG (1,2 à 2,7 s en rendu
   logiciel headless). Elle suppose que la politique de sécurité autorise les
   images `blob:` (repli `data:`) : **à vérifier chez Stake**. Correctif prévu (production) : pré-rendu des atlas au
   build en WebP @1x / @2x, mêmes pièces, mêmes pivots.
2. **Coût de remplissage plus élevé** : en rendu logiciel, ≈ 15 FPS contre ≈ 21 avant (mêmes conditions, §8), après
   une première optimisation. Performance réelle inconnue : tests sur téléphones réels requis (iPhone SE / récent,
   Android milieu de gamme), avec la résolution dynamique prévue par l'architecture.
3. **Hors slice, cohérence partielle** : les 48 autres branches utilisent déjà les nouveaux personnages, le nouveau
   bureau et les impacts améliorés, mais **pas** la nouvelle chorégraphie. Les accessoires de FURIOUS / UNHINGED
   (trappe, levier, mèche), les projectiles et l'arène du BOSS FIGHT restent des placeholders : mélange de styles
   visible dans ces niveaux.
4. **Habillage des mondes en jeu** : FURIOUS (fin d'après-midi, désordre) et UNHINGED (nuit, alarme, casque de
   Wendell) s'appliquent aussi en jeu, en rendu seulement. Changement visible pour ces niveaux, sans effet sur les
   manches ; à valider avec les concept frames.
5. Rig de B.B. : vue de face uniquement (la toupie est un retournement horizontal) ; quelques poses encore raides
   (poing sur la hanche) ; pas de synchronisation labiale.
6. Le multiplicateur (UI inchangée) recouvre B.B. à la fenêtre dans le cadrage portrait du GROS GAIN.
7. Le gel « regard caméra » et les hit stops ajoutent ≈ 0,2 à 0,3 s de temps réel au GROS GAIN (l'audit de vitesse
   mesure le temps de séquence).
8. Hors slice : dans `SLG-C3`, le son « sip » n'est pas calé sur le nouveau LE SIP (segment trop court).
9. Vol de la carte NEW : Web Animations API (sans elle : pas de vol, le compteur avance quand même, filet de 2,5 s).
10. Barre du haut à 360 px : le bouton DEV (outil de développement, absent en production) est légèrement coupé.
11. Sons toujours synthétisés : les nouveaux repères (STRETCH, SNAP, CLINK, PAPER, DEBRIS) sont provisoires.
12. Mémoire : ≈ 29 Mo d'atlas (mipmaps comprises) ; + ≈ 7 Mo quand le COLLECTION BOOK est ouvert (vignettes, contexte
    WebGL séparé, demi-densité).

## 12. Estimation pour porter ce niveau aux 51 branches
Déjà acquis pour toutes les branches : personnages, bureau, lumière, particules, image d'impact et éclat dans la
bibliothèque d'impacts, LE SIP, départ A (partagé par 6 branches), outils de revue.

| Lot | Contenu | Effort (1 développeur-animateur) |
|---|---|---:|
| SLINGSHOT (reste) | 14 branches : setups B / C / D, twists, fins | 6 à 8 jours |
| TRAPDOOR EXPRESS (FURIOUS) | art trappe / levier / chute, 17 branches (dont entrées BOSS FIGHT) | 9 à 11 jours |
| OFFICE ROCKET (UNHINGED) | art fusée / mèche / fumée / plafond, 17 branches | 9 à 11 jours |
| BOSS FIGHT | B.B. géant, arène, projectiles, échelle mise en scène | 4 à 6 jours |
| Bibliothèque | 7 réactions, caméo du COO, signature de l'ascenseur | 2 à 3 jours |
| Production | atlas pré-rendus WebP @1x / @2x, chargeur, vérification CSP | 2 à 3 jours |
| Appareils réels | mesures, résolution dynamique, réglages | 2 à 3 jours |
| **Total** | hors sons définitifs | **≈ 34 à 45 jours** (7 à 9 semaines) |

En sessions comme celle-ci : 5 à 7 étapes, une par gadget (ou demi-gadget), chacune validée avant la suivante.

## 13. Proposition pour la suite
1. **Valider la slice** : jouer la préversion (GRUMPY) ; DEV PANEL pour revoir `SLG-A4`, `SLG-A5`, `SLG-C1`.
2. **Ne pas mélanger avec le PLAYTEST #2** : il se fait sur la préversion P05-C (inchangée), sinon Q1 mesurerait l'art
   et le contenu en même temps. Ensuite, une courte session « art » (mêmes questions) sur la slice.
3. Si la slice est validée : **fin de SLINGSHOT** (même gadget, mêmes accessoires) → revue → TRAPDOOR → ROCKET →
   BOSS FIGHT, chaque lot validé avant le suivant.
4. **Pipeline de production** (atlas pré-rendus) avant toute intégration Stake staging.
5. **Tests sur téléphones réels** (performances, mémoire, encoches, audio iOS).
6. Passe **son** sur la liste de repères (sound design ou banque de sons sous licence : à décider).

**STOP** : les 48 autres branches et la Phase 1 attendent votre validation.
