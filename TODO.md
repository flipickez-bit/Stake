# TODO — BAD BOSS

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

## P0 : décisions et informations externes
- [ ] **Validation de la Phase 0** par vous (`PHASE_0_ACCEPTANCE.md`), puis feu vert Phase 1.
- [ ] Jouer une vraie session **PLAYTEST 50** (DEV PANEL → PLAYTEST 50 → START), sur téléphone si possible, et exporter le JSON.
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
- [ ] Passe de game feel des 12 branches ; 2e branche de perte par gadget (BACKFIRE avec Wendell, TEASE) ; corriger le « tell » du rallumage de l'OFFICE ROCKET.
- [ ] Cadrage portrait (moins de plafond vide ; place pour le résultat et l'échelle du BOSS FIGHT).
- [ ] Autoplay derrière `FeatureGate` ; expiration de session (ERR_IS) ; couverture de 100 % des transitions.
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
