# TODO — BAD BOSS

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

## P0 : Phase 0.5 (en cours) — `PHASE_0_5.md`
- [x] PLAYTEST 50 v2 : champs demandés par manche, questionnaire de 6 questions à la fin uniquement, export volontaire (copier / fichier), LOCAL DEV ONLY.
- [x] Cadrage portrait adaptatif (captures avant / après).
- [x] LOOP x500 avec relevés mémoire (chauffe normale, pas de fuite visible).
- [x] **PLAYTEST #1 humain** : Q1 = 2,5 / 5 (problème principal), Q2 / Q4 validés, Q3 validé mais variété insuffisante, Q5 non évaluable.
- [x] **Phase 0.5B — variété V2** (`PHASE_0_5.md` §5-6) :
  - [x] 2e branche LOSS par gadget : SLINGSHOT BACKFIRE, TRAPDOOR TEASE, ROCKET WENDELL CEILING (sans toucher aux probabilités) ;
  - [x] modules SETUP × TWIST × FIN, 15-16 branches jouables par gadget (51 au total avec les BOSS FIGHT) ;
  - [x] débuts partagés, audit de prévisibilité en CI (rapport de vraisemblance ∈ [0,5 ; 2]) ;
  - [x] gags récurrents (LE SIP peut finir en gain), doubles twists rares, ascenseur hors champ, pertes en réaction en chaîne ;
  - [x] rareté cosmétique COMMON / UNCOMMON / RARE / VERY_RARE (présentation seulement) ;
  - [x] anti-répétition : étudiée, non implémentée (menace replay / reprise) → variété sans état ;
  - [x] vitesse générale conservée : modules longs resserrés, durée moyenne ≤ P05-A × 1,15 en CI (SLINGSHOT +11 %, TRAPDOOR 0 %, ROCKET +6 %) ;
  - [x] bouton APERÇU BOSS FIGHT (PLAYTEST / DEV, sans mise, sans donnée de playtest) ;
  - [x] Q7 « nouveauté » + « pas rencontré » pour Q5 ; nouveauté mesurée par manche et dans le rapport.
- [x] **Phase 0.5C — COLLECTION BOOK** (`docs/COLLECTION_BOOK.md`, `PHASE_0_5.md` §7) :
  - [x] conception (étapes A-F) : système, UX mobile, modèle TS, impacts (GameFlow, replay, reprise, books, Stake, stockage, tests), jalons, épisode ;
  - [x] 51 cartes (pertes comprises), noms, descriptions, indices par setup (sans information sur l'issue) ;
  - [x] observateur branché sur GameFlow sans le modifier ; replays sans effet ; reprise idempotente ;
  - [x] album (onglets par Rage Level + BOSS FIGHT + REWARDS, vignettes générées, silhouettes), badge NEW neutre et non bloquant ;
  - [x] jalons + cosmétiques (rendu seul) ; SPECIAL EPISODE « OFFICE MELTDOWN » (sans mise, sans payout, sans chiffre) ;
  - [x] **décision validée** : OFFICE MELTDOWN à ≥ 8 découvertes dans chaque Rage Level (BOSS FIGHT non requis, ≈ 63 manches) ; 100 % = trophée + thème d'album ; aucune fréquence modifiée ;
  - [x] `CollectionStore` / `LocalCollectionStore` ; désactivée en mode Stake ; COLLECTION DEBUG (Mock) ;
  - [x] PLAYTEST : Q8, souhait de récompense, découvertes (total et par Rage Level), ouvertures (1re, changement de mode après consultation), progression et déblocage naturel d'OFFICE MELTDOWN, épisode lancé, Rage Levels utilisés.
- [x] **FREEZE du contenu P05-C** : aucune animation, gadget, récompense, mécanique ni modification mathématique avant l'analyse du PLAYTEST #2.
- [ ] **PLAYTEST #2 humain** (vous, contenu P05-C) : 50 manches, 8 questions + 2 champs libres, export. Comparer Q1 (P05-A 2,5 → objectif ≥ 4 / 5), Q7, Q8 ; mesures de collection (`PHASE_0_5.md` §7.5).
- [ ] Sessions supplémentaires si d'autres testeurs sont disponibles.
- [ ] Rapport de Phase 0.5 (`tools/playtest-report.mjs`, P05-A vs P05-C), puis arrêt.

## P0 : Phase 0.6 — VISUAL UPGRADE (vertical slice) — `PHASE_0_6.md`
- [x] Skills PixiJS installés ; Game Assets Enhancer inspecté (fal.ai payant : non utilisé).
- [x] Inspection du renderer (gardé / remplacé).
- [x] `BAD_BOSS_ART_BIBLE.md` + validation automatique de cohérence.
- [x] Concept frames GRUMPY / FURIOUS / UNHINGED.
- [x] Pipeline d'art (SVG → atlas), rigs illustrés (B.B., Wendell, COO, mains), bureau 2.5D, lumière, VFX.
- [x] Slice GRUMPY + SWIVEL SLINGSHOT : PERTE `SLG-C1`, GAIN `SLG-A4`, GROS GAIN `SLG-A5`, NEW DISCOVERY, NEW REWARD.
- [x] Tests, captures avant / après, mesures (appels de dessin, LOOP, tailles), rapport.
- [ ] **Validation de la slice (vous).**
- [ ] Ensuite seulement : fin de SLINGSHOT → TRAPDOOR → ROCKET → BOSS FIGHT (un lot validé à la fois).
- [ ] Atlas pré-rendus au build (WebP @1x / @2x) ; vérifier la CSP de Stake (`blob:` / `data:`).
- [ ] Tests sur téléphones réels (FPS, mémoire, résolution dynamique).

## P0 : POC « 3 PLANS » (BAD BOSS — 3 GADGET POC) — `POC_3_GADGETS.md`
- [x] Étude de faisabilité (`docs/ETUDE_CHOIX_3_GADGETS.md`) ; principe adopté PROVISOIREMENT (9 gadgets cibles, production NON lancée).
- [x] Maths A2 expérimentales dans le Mock RGS (`IND_BFC_v1`, triple tiré sans le plan, RTP A = B = C) ; maths de production inchangées.
- [x] Choix du plan AVANT Play, verrouillé ensuite (I9) : tests unitaires + e2e (animation, rechargement, reprise, double tap).
- [x] Choix dans le décor (A SLINGSHOT réel, prototypes B ESPRESSO BLASTER et C COPIER CATAPULT) ; survol animé.
- [x] PRIVATE (défaut) / ON-DEMAND (« REVEAL OTHER PLANS » après toutes les manches) / REVEAL ALL (DEV) ; aucun son, aucune célébration, aucun texte de regret.
- [x] PLAYTEST A/B 2 × 30 manches, ordre aléatoire, Q1–Q7 + question libre, mesures de changement de gadget, export.
- [x] Résumé technique pour Stake (`docs/STAKE_A2_TECH_SUMMARY.md`) ; SOUND BIBLE v0 (`SOUND_BIBLE.md`).
- [ ] **Playtest A/B humain** (vous, préversion 3 GADGET POC) ; plusieurs testeurs si possible.
- [ ] **Réponses de Stake à Q21–Q29** avant toute production A2.
- [ ] Décision : la mécanique remplace-t-elle le modèle actuel ? (NE PAS produire avant : 6 gadgets complets, 144 branches, maths de production, nouvelle collection.)
- [ ] Écart son relevé : un x0,5 (SCRAPE) joue 1 DING, contrairement au GDD (`SOUND_BIBLE.md` §4).

## P0 : décisions et informations externes
- [ ] Obtenir de Stake Engine (liste complète : `docs/STAKE_ENGINE_FAITS_VERIFIES.md` §11 et hypothèses H1-H13 du §12) :
  - [ ] sémantique de `autoEndRoundDisabled` / `auto_close_disabled=True` sur des modes de base (manches à gain nul comprises) ;
  - [ ] statut officiel du paquet npm `stake-engine`, et une version à erreurs structurées ;
  - [ ] format de `round.state`, de `round.payoutMultiplier` et du corps d'erreur RGS ;
  - [ ] contrat du replay (`/bet/replay/...`, paramètres d'URL, `event`) ;
  - [ ] `minimumRoundDuration` (unité, point de départ, portée) et `disabledSlamstop` (portée) — **bloquant avant production** ;
  - [ ] contrat de `/bet/event` (aucune dépendance BAD BOSS en attendant) et `meta` ;
  - [ ] plage de RTP, acceptation de 3 modes à coût 1,0, volume de books attendu ;
  - [ ] limites d'upload front (taille, polices, CSP), guidelines de contenu ;
  - [ ] **méta-progression** (COLLECTION BOOK) : acceptée ? par juridiction ? stockage joueur persistant ? badge NEW après une perte ? récompenses monétaires un jour (non prévues) ? — §11, Q17-20.
- [ ] Commercial : licence Spine Editor (seulement si Spine est retenu : `CharacterAnimator` laisse le choix). Juridique : **clearance du nom BAD BOSS**.
- [ ] Décision **D-GADGET** (identité du gadget reconstructible depuis la manche) avant le 4e gadget. Recommandation : option A (tirage par la graine du book).

## P1 : Phase 1 (proposée, NON commencée — `MVP_ROADMAP.md` §8)
- [ ] Préversion sur téléphones réels : FPS, latence de FIRE, audio iOS/Android, portrait.
- [ ] PLAYTEST 50 avec 3 à 5 personnes.
- [ ] Passe de game feel guidée par les playtests (variété V2 faite en Phase 0.5B ; contenu supplémentaire plutôt que mémoire si la répétition gêne encore).
- [ ] Expiration de session (ERR_IS) ; couverture de 100 % des transitions.
- [ ] Autoplay derrière `FeatureGate` — **descendu en priorité** : pas avant que le jeu soit satisfaisant quand le joueur prend chaque décision lui-même.
- [ ] Écran de règles (RTP si `displayRTP`, max win, gains par Rage Level), réglages son, i18n (squelette).
- [ ] `check:content` en TypeScript branché en CI.

## P2 : maths et intégration
- [ ] Phase 2 : jeu `bad_boss` dans le **math-sdk officiel**, books au format d'événements v3 (`TECH_ARCHITECTURE.md` §3.4), simulation à grande échelle, comparaison avec le calculateur.
- [ ] Phase 3 : `StakeRgsAdapter` contre le staging Stake ; remplacer les hypothèses H1-H13 par les contrats confirmés.
- [ ] Après les tests joueurs : réévaluer le hit rate d'UNHINGED (variante `unhinged_x12` prête, désactivée) et la fréquence du BOSS FIGHT.

## P3 : après le MVP
- [ ] Assets définitifs du périmètre MVP (après la porte G2).
- [ ] Les 12 gadgets restants : lots A (LOW), B (MEDIUM), C (HIGH), `GDD_04` §5.9.
- [ ] Physique légère de débris, autres super-gadgets, bonus additionnels, Howler + vrais sons.
- [ ] Bonus buy (seulement si `disabledBuyFeature` est faux et si c'est validé).
- [ ] Branding final (après clearance).

## Fait
- [x] Étapes 1 à 12 (conception).
- [x] **Phase 0** (2026-09-25) : voir `PHASE_0_ACCEPTANCE.md`.
