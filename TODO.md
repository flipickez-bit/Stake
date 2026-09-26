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
- [ ] **PLAYTEST #2 humain** (vous, contenu P05-B) : 50 manches, 7 questions, export. Cible : Q1 ≥ 4 / 5 ; nouvelles animations encore remarquées après les manches 10, 25 et 50.
- [ ] Sessions supplémentaires si d'autres testeurs sont disponibles.
- [ ] Rapport de Phase 0.5 (`tools/playtest-report.mjs`, P05-A vs P05-B), puis arrêt.

## P0 : décisions et informations externes
- [ ] Obtenir de Stake Engine (liste complète : `docs/STAKE_ENGINE_FAITS_VERIFIES.md` §11 et hypothèses H1-H13 du §12) :
  - [ ] sémantique de `autoEndRoundDisabled` / `auto_close_disabled=True` sur des modes de base (manches à gain nul comprises) ;
  - [ ] statut officiel du paquet npm `stake-engine`, et une version à erreurs structurées ;
  - [ ] format de `round.state`, de `round.payoutMultiplier` et du corps d'erreur RGS ;
  - [ ] contrat du replay (`/bet/replay/...`, paramètres d'URL, `event`) ;
  - [ ] `minimumRoundDuration` (unité, point de départ, portée) et `disabledSlamstop` (portée) — **bloquant avant production** ;
  - [ ] contrat de `/bet/event` (aucune dépendance BAD BOSS en attendant) et `meta` ;
  - [ ] plage de RTP, acceptation de 3 modes à coût 1,0, volume de books attendu ;
  - [ ] limites d'upload front (taille, polices, CSP), guidelines de contenu.
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
