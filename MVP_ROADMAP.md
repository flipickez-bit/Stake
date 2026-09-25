# MVP_ROADMAP — BAD BOSS

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**
> Étape 12. Statut : **proposé, en attente du feu vert CODE.**
> Architecture : `TECH_ARCHITECTURE.md`. Contraintes Stake : `docs/STAKE_ENGINE_FAITS_VERIFIES.md`.

## 1. Périmètre et critère de réussite

**Dans le MVP** :
- 3 Rage Levels (GRUMPY, FURIOUS, UNHINGED) et 3 gadgets (SWIVEL SLINGSHOT, TRAPDOOR EXPRESS, OFFICE ROCKET) avec leurs **32 branches** ;
- le BOSS FIGHT complet ;
- le super-gadget UFO ;
- l'UI mobile et desktop, et les fonctionnalités conditionnées par la juridiction ;
- reprise et replay ;
- le **BAD BOSS DEV PANEL** ;
- l'intégration Stake Engine (staging) ;
- des fichiers mathématiques officiels.

**Hors MVP** :
- les 12 autres gadgets ;
- les autres super-gadgets et bonus ;
- les assets **définitifs** (le MVP est construit sur des placeholders, voir la porte G2) ;
- le bonus buy ;
- le branding final.

**Le MVP est réussi quand chacun de ces tests d'acceptation passe** (automatisé avec Playwright et MockRgs, puis manuel sur le staging Stake et sur un vrai téléphone) :

| # | Parcours | Preuve attendue |
|---|---|---|
| AC-01 | Ouvrir BAD BOSS sur mobile | Premier écran jouable dans les budgets du §4, en portrait et en paysage |
| AC-02 | Miser | La mise respecte `betLevels`, `minBet`, `maxBet` et `stepBet`, et elle est verrouillée pendant la manche |
| AC-03 | Choisir GRUMPY / FURIOUS / UNHINGED | `Play` est envoyé avec `mode` = `grumpy`, `furious` ou `unhinged` |
| AC-04 | Voir le gadget correspondant | La carte et l'INTRO montrent le gadget du niveau |
| AC-05 | Recevoir le résultat Stake Engine | `Outcome` analysé depuis `round.state`, puis validé |
| AC-06 | Jouer l'animation correcte | La branche jouée a la bonne catégorie et une classe compatible. Hash de séquence conforme |
| AC-07 | Afficher le multiplicateur | Aucun chiffre avant le reveal. Valeur égale à celle du book et gain égal à `round.payout` |
| AC-08 | Terminer proprement la manche | `end-round` appelé une seule fois, balance mise à jour depuis le serveur |
| AC-09 | Rejouer | FIRE réactivé seulement après règlement de la manche et durée minimale écoulée |
| AC-10 | Fermer pendant une manche | Coupure provoquée pendant ACTION, TWIST, IMPACT, REVEAL et BOSS FIGHT |
| AC-11 | Rouvrir | `Authenticate` renvoie la manche active |
| AC-12 | Reprendre correctement | **Un seul `Play` par manche** (compteur du mock), même Outcome, même gain, aucun nouveau tir possible |
| AC-13 | Rejouer une ancienne manche | Replay (URL ou DEV PANEL) : même hash de séquence que la manche d'origine, aucun appel wallet |
| AC-14 | Déclencher chaque branche depuis le DEV PANEL | Les 32 branches × leurs classes valides jouent sans erreur. Boucle ×20 sans fuite (§4) |

## 2. Vue d'ensemble

Estimations **indicatives** pour 1 développeur principal à plein temps, 1 animateur / tech-artist à temps partiel (placeholders) et un appui maths et audio à temps partiel. Ce sont des durées calendaires, dont une partie se fait en parallèle.

```
Semaine :  1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16
P0 Fond.   ███
P1 Core        ██████
P2 Maths       ░░░░░░░░░░░                         (piste parallèle)
P3 Stake                   █████                   (dépend de l'accès ACP)
P4 Anim.               ████████████
P5 Audio/VFX                       ██████
P6 BossFight                           ██████
P7 Perf mob.                                 ████
P8 QA                                            ██████
P9 RC                                                  ███
Portes :   G0  G1          G3      G2                 G4
```

| Porte | Moment | Décision |
|---|---|---|
| **G0** | fin P0 | La tranche technique tourne (mock). **Premier lien de préversion** jouable sur téléphone |
| **G1** | fin P1 | La boucle complète, la reprise et le replay passent en e2e (présentation de débogage) |
| **G2** | fin P4 | **Test de fun avec placeholders** et mesure de la non-révélation. Décision de lancer les **assets définitifs** du périmètre MVP |
| **G3** | fin P2 + P3 | Bout en bout sur le **staging Stake** avec les vrais fichiers mathématiques |
| **G4** | fin P8 | Critères RC atteints : AC-01 à AC-14, budgets, conformité |

## 3. Phases

### PHASE 0 : fondations et tranche technique (≈ 1 semaine)
- **Objectifs** :
  - scaffold Vite + Svelte 5 + PixiJS 8 + TS strict ;
  - CI (lint, types, tests unitaires, contrôle de contenu, taille du bundle) ;
  - `RgsPort` et **MockRgs** servant des books de fixture ;
  - GameFlow minimal ;
  - scène placeholder ;
  - squelette du DEV PANEL ;
  - **déploiement automatique d'une préversion** (MockRgs), avec un lien pour tester sur téléphone.
- **Fichiers et systèmes** : `package.json`, `vite.config.ts` (`base: './'`), `src/app/*`, `src/platform/rgs/{RgsPort,MockRgs}.ts`, `src/domain/*`, `src/flow/GameFlow.ts` (squelette), `src/dev/DevPanel.svelte`, `tests/unit`, workflow CI, script de génération des fixtures (depuis `config/rage_levels.json`).
- **Validation** : FIRE puis résultat factice affiché, en moins de 3 s sur mobile, via le lien de préversion. CI verte. Règle ESLint anti-`Math.random` active.
- **Risques** : versions récentes incompatibles entre elles (TS 7 et `svelte-check`). → Figer des versions compatibles dès le jour 1.

### PHASE 1 : core gameplay et GameFlow (≈ 2 semaines)
- **Objectifs** :
  - machine à états complète (§2.3 de l'architecture) et invariants I1 à I8 ;
  - UI réelle (cartes, mise, FIRE, bandeau de résultat) ;
  - `FeatureGate` ;
  - READY_GATE (durée minimale) ;
  - SpeedMode et SkipController ;
  - **reprise** (tous les cas de §2.5) et **replay** avec une *présentation de débogage* (chronologie textuelle et formes simples) ;
  - autoplay derrière `FeatureGate`.
- **Fichiers et systèmes** : `src/flow/*`, `src/ui/*`, `src/platform/jurisdiction/FeatureGate.ts`, `src/domain/{outcome,bet,resultClass}.ts`, `tests/e2e` (AC-02, 03, 08 à 13 avec le mock).
- **Validation** :
  - AC-02, 03, 08, 09, 10, 11, 12, 13 verts sur MockRgs ;
  - tests de transitions : 100 % des transitions et gardes couvertes ;
  - un délai dépassé sur `Play` ne produit **jamais** de deuxième `Play`.
- **Risques** :
  - sémantique de fin de manche inconnue (❓ `autoEndRoundDisabled`) → les deux politiques sont implémentées (active ou déjà fermée) et testées ;
  - `round.state` inconnu ❓ → `parseRound` tolérant et strict en même temps (validation, messages clairs).

### PHASE 2 : production mathématique officielle (piste parallèle, ≈ 2 à 3 semaines)
Le calculateur (`math/model`) **ne remplace pas** les artefacts Stake Engine.
- **Objectifs** : créer le jeu `math-sdk-game/games/bad_boss/` avec le **math-sdk officiel** :
  - 3 `BetMode` : `grumpy`, `furious`, `unhinged`, coût 1.0, rtp 0.965 (lu dans `config/rage_levels.json`), `max_win` 200 / 1 000 / 5 000, `auto_close_disabled=True`, `is_feature=True`.
  - **Books** : chaque book contient les événements `presentation` (script, rareté, **graine**) et, pour le BOSS FIGHT, le chemin complet des attaques. **Plusieurs graines** par combinaison multiplicateur × script × rareté, pour la variété.
  - **Simulation à grande échelle** avec le SDK : de 10^5 à 10^6 books par mode, selon les recommandations Stake (❓ volume attendu). Poids du lookup table fixés par l'optimiseur officiel, ou par les poids entiers exacts du modèle si Stake l'accepte (❓).
  - **Vérification** : `utils/rgs_verification.py` (format, correspondance books ↔ CSV, contrôles de volatilité), puis comparaison statistique avec la cible du modèle (RTP à 96,5 % près de la tolérance convenue, hit rate, bandes, fréquence du max win, P(BOSS FIGHT)). Enfin, **ré-échantillonnage indépendant** de 10^7 à 10^8 manches depuis les CSV.
  - Sorties : `index.json`, 3 CSV, 3 `.jsonl.zst`, config backend (`autoEndRoundDisabled`), résumé statistique (fiche PAR).
- **Validation** : `rgs_verification.py` sans erreur. Écarts statistiques dans les tolérances. Upload des fichiers dans l'ACP de staging accepté.
- **Risques** :
  - volume de books et exigences de validation inconnus ❓ ;
  - refus de `auto_close_disabled=True` sur des modes de base ❓ → basculer sur la politique de repli ;
  - taille des fichiers compressés → mesurer tôt.

### PHASE 3 : intégration Stake Engine (≈ 1 à 2 semaines, dès que l'ACP de staging est accessible)
- **Objectifs** :
  - `StakeRgsAdapter` (client npm `stake-engine` + observateur d'erreurs + délais + réinstanciation) ;
  - replay via `/bet/replay` (derrière un drapeau) ;
  - build statique uploadé dans l'ACP, « Publish Front End », session de test ;
  - développement local avec la *query string* du staging ;
  - mapping des erreurs ;
  - `socialCasino` et devises (XGC, XSC).
- **Fichiers et systèmes** : `src/platform/rgs/{StakeRgsAdapter,errorObserver,replayRequest}.ts`, `src/platform/money.ts`, script de build et de paquet d'upload.
- **Validation** :
  - AC-05, 08, 10, 11, 12 **sur le staging Stake** ;
  - chaque code d'erreur provoqué (mise > solde, session expirée…) affiche le bon message ;
  - **deuxième lien de test : le staging Stake**.
- **Risques** :
  - client officiel non confirmé ou modifié ❓ → l'adapter isole tout ;
  - CORS ou CSP en local ❓ ;
  - contrat du replay ❓ → le replay reste disponible via le DEV PANEL tant que le contrat n'est pas confirmé.

### PHASE 4 : moteur d'animation et contenu MVP (≈ 3 à 4 semaines)
- **Objectifs** :
  - `compileSequence` et `SequencePlayer` (seek, skip, turbo), `Timeline` ;
  - scène 2.5D (couches, profondeur, ombres) et `Camera` ;
  - interface `Rig` avec `PlaceholderRig`, puis `SpineRig` sur un rig de test ;
  - bibliothèques partagées : mains, impacts T0,5 à T3, réactions, twists, Wendell, COO ;
  - **les 13 branches P1**, puis **les 32 branches** ;
  - DEV PANEL complet (forçages, boucle ×20, sondes, matrice de non-révélation, P(gain | D1)) ;
  - `check:content`.
- **Fichiers et systèmes** : `src/presentation/**`, `src/content/gadgets/{swivel-slingshot,trapdoor-express,office-rocket}/**`, `src/dev/**`, `tools/check-content.ts`.
- **Validation** :
  - AC-04, 06, 07, 14 ;
  - 100 % des branches jouables ;
  - hashes de séquence stables (tests de référence) ;
  - P(gain | état D1) dans ± 15 points du hit rate de chaque niveau ;
  - **porte G2** : session de test de fun (5 à 8 joueurs, ≥ 200 manches chacun), grille « drôle même en perte », « je ne devine pas l'issue avant la fin ».
- **Risques** :
  - la comédie ne fonctionne pas en placeholders → prévoir un « lot de fidélité » (quelques poses clés dessinées) pour le test G2 ;
  - licence Spine (question commerciale) → `PlaceholderRig` reste une solution de secours.

### PHASE 5 : audio et VFX (≈ 1,5 à 2 semaines)
- **Objectifs** :
  - `AudioDirector` (Howler, bus, ducking, **règle du silence unique**, stingers par classe, identité DING, HMPF, *tink*) ;
  - `ParticleSystem` et `DebrisSystem` (pas fixe, graine, pools) ;
  - `ScreenOverlay` ;
  - recettes de caméra BIG WIN ;
  - mode mouvements réduits.
- **Validation** :
  - chaque classe de résultat est reconnaissable **au son seul** (test à l'aveugle, ≥ 90 % de bonnes réponses) ;
  - particules et débris déterministes : même hash de positions à l'image N en replay ;
  - budgets audio et particules tenus.
- **Risques** : audio iOS (déverrouillage, formats) → tests sur appareil réel dès cette phase.

### PHASE 6 : BOSS FIGHT (≈ 1,5 à 2 semaines)
- **Objectifs** :
  - `BF_ENTRY_MUG` ;
  - GIGA-BOTTOMLINE (poses géantes), échelle UI, anatomie d'attaque (élan commun, divergence à 900 ms) ;
  - montée de tension par palier ;
  - fins BLOQUÉ et K.O. (fêlure du mug) ;
  - **reprise en rattrapage** ;
  - turbo, super turbo et skip conditionnés.
- **Validation** :
  - tous les paliers forçables et jouables (DEV PANEL) ;
  - reprise en plein combat conforme à AC-12 ;
  - durées dans le §6.1 du GDD_05 (médiane ≈ 8 s).
- **Risques** : durée ressentie trop longue aux paliers hauts → réglage par les données.

### PHASE 7 : optimisation mobile (≈ 1 à 1,5 semaine)
- **Objectifs** :
  - atteindre les budgets du §4 sur la matrice d'appareils (§5) ;
  - résolution dynamique ;
  - chargement différé (`bossfight` en arrière-plan) ;
  - compression des atlas (évaluation de KTX2/Basis contre WebP) ;
  - préchargement des textures sur le GPU hors manche.
- **Validation** : budgets tenus sur l'appareil de référence moyen **et** au-dessus du plancher sur l'appareil d'entrée de gamme.
- **Risques** : Safari iOS (mémoire, audio, WebGL) → mesures sur appareil réel.

### PHASE 8 : QA (≈ 1,5 à 2 semaines)
- **Objectifs** :
  - plan de test complet : fonctionnel, **coupures réseau et fermetures à chaque phase** (automatisées), juridictions (chaque clé), erreurs, localisation (16 langues, RTL), accessibilité, endurance (1 000 manches), appareils ;
  - **conformité à la charte d'honnêteté** : aucun chiffre avant le reveal, TEASE ≤ 15 %, gains inférieurs à la mise jamais célébrés, iconographie réservée ;
  - **re-vérification mathématique** sur les fichiers finaux.
- **Validation** : AC-01 à AC-14 verts partout. Zéro défaut bloquant. Budgets tenus.
- **Risques** : informations Stake encore manquantes (liste ❓) → bloquantes pour la RC si non résolues.

### PHASE 9 : release candidate du MVP (≈ 1 semaine)
- **Objectifs** :
  - build RC ;
  - fichiers mathématiques finaux uploadés ;
  - dossier d'approbation Stake (règles du jeu, RTP, captures, description des mécaniques et de la charte) ;
  - `PROJECT_STATE.md` à jour ;
  - notes de version.
- **Validation** : session de staging complète et **revue go / no-go** avant la production des 12 gadgets restants et des assets définitifs à grande échelle.
- **Risques** : retours d'approbation (contenu, UI) → temps tampon prévu.

## 4. Budgets de performance (priorité mobile)

| Poste | Mobile (référence moyenne) | Desktop | Mesure |
|---|---|---|---|
| **JS initial (gzip)** | ≤ 300 Ko (plafond 400 Ko) | idem | Contrôle de taille en CI |
| CSS (gzip) | ≤ 20 Ko | idem | CI |
| **Charge avant « PLAY »** (JS + `core` @1x + audio de base + police) | ≤ 2,5 Mo | ≤ 4 Mo (@2x) | Build |
| Charge totale MVP (`core` + 3 gadgets + `bossfight`) | ≤ 6 Mo | ≤ 9 Mo | Build |
| Textures téléchargées | `core` ≤ 1,2 Mo · chaque gadget ≤ 350 Ko · `bossfight` ≤ 500 Ko (@1x) | ×2 environ (@2x) | Build |
| **Mémoire GPU des textures** | ≤ 64 Mo (≈ 4 atlas 2048²) | ≤ 128 Mo | DEV PANEL |
| **Audio** (compressé) | `core` ≤ 1,2 Mo · chaque gadget ≤ 250 Ko (Trapdoor ≤ 400 Ko) · `bossfight` ≤ 600 Ko (musique en streaming) | idem | Build |
| Audio décodé (PCM des effets) | ≤ 25 Mo | ≤ 50 Mo | DEV PANEL |
| **Particules actives** | ≤ 150 en moyenne · ≤ 300 en pic (MEGA, K.O.) | ≤ 600 en pic | DEV PANEL |
| Débris physiques simultanés | ≤ 40 | ≤ 80 | DEV PANEL |
| **Draw calls** | ≤ 30 en moyenne · ≤ 60 en pic | ≤ 100 | DEV PANEL |
| **Tas JS** | ≤ 80 Mo, stable à ± 2 Mo après la boucle ×20 | ≤ 150 Mo | DEV PANEL, Chrome DevTools |
| Mémoire totale de l'onglet | ≤ 250 Mo | — | Safari et Chrome remote |
| **Écran de chargement visible** | ≤ 1 s | ≤ 1 s | Playwright + appareil |
| **Premier écran jouable** | ≤ 3 s en 4G (≈ 10 Mb/s) · ≤ 7 s en 4G lente (≈ 3 Mb/s) | ≤ 2 s | Playwright (réseau bridé) + appareil |
| Assets `bossfight` prêts | ≤ 10 s après le premier écran jouable (sinon rattrapage) | — | — |
| **FPS** | 60 visés · durée d'image p95 ≤ 20 ms · ≥ 45 FPS en pic MEGA · aucune image > 50 ms pendant une manche | 60, p95 ≤ 17 ms | DEV PANEL |
| Plancher entrée de gamme | ≥ 30 FPS stables (résolution dynamique) | — | — |
| **Latence de FIRE** | réaction visible ≤ 100 ms | ≤ 50 ms | Mesure |
| Fuite (boucle ×20) | objets d'affichage, textures et pools revenus à la ligne de base | idem | DEV PANEL |

## 5. Matrice d'appareils

| Classe | Appareils | Navigateur | Exigence |
|---|---|---|---|
| **Référence moyenne** | iPhone 11 ou 12 · Samsung Galaxy A54 ou A35 · Google Pixel 7a | Safari iOS 17+, Chrome Android | Tous les budgets du §4 |
| Entrée de gamme (plancher) | Samsung Galaxy A14 ou A15 · Xiaomi Redmi Note 11 ou 12 | Chrome Android | ≥ 30 FPS, jeu complet |
| Tablette | iPad 9e génération | Safari | Paysage correct |
| Desktop | Chrome, Firefox, Safari et Edge (versions courantes) | — | Budgets desktop |

## 6. Piste artistique (sans assets définitifs avant G2)

- **P0 à P4** : placeholders : formes articulées, couleurs de marque, silhouettes lisibles (rectangle violet, cravate jaune, mèche). Ils suffisent à juger le rythme et la lisibilité.
- **Pour G2** : un « lot de fidélité » minimal (poses clés du boss, 3 gadgets esquissés) pour juger la comédie. Ce ne sont pas des assets définitifs.
- **Après G2** : production des assets définitifs du périmètre MVP (boss Spine, décor, 3 gadgets, BOSS FIGHT). **Les 12 autres gadgets restent hors MVP.**

## 7. Premières tâches après le feu vert CODE

1. Figer les versions (Svelte, Pixi, Vite, TS compatible avec `svelte-check`, Howler, `stake-engine`) et créer le scaffold (P0).
2. Générer des books de fixture (3 modes, toutes les classes, BOSS FIGHT, graines) depuis `config/rage_levels.json`, au format d'événements prévu pour la phase 2.
3. Écrire `RgsPort`, `MockRgs` et `parseRound`, avec leurs tests.
4. Écrire la machine à états et ses tests d'invariants, **avant** toute animation.
5. Déployer la préversion et partager le lien de test.
