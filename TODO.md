# TODO — BAD BOSS

## P0 : bloquant pour la suite
- [ ] Obtenir de Stake Engine (ou lire `stake-engine.com/docs` depuis un poste non restreint) :
  - [ ] la plage de RTP autorisée et la portée des « 3-star volatility limits » (`TARGET_RTP = 0.965` est provisoire) ;
  - [ ] l'acceptation de 3 modes à coût 1,0 comme niveaux de volatilité ;
  - [ ] la sémantique des clés `jurisdiction` (clés **vérifiées**) : unité de `minimumRoundDuration`, portée de `disabledSlamstop`, emplacements imposés par `displayRTP`, `displayNetPosition` et `displaySessionTimer`, lexique `socialCasino` ;
  - [ ] les règles d'autoplay (limites de pertes obligatoires ?) ;
  - [ ] le format et la taille du champ `event` de `/bet/event`, et le renvoi de `meta` dans `round` ;
  - [ ] l'unité monétaire (6 décimales contre le commentaire « 1000 = $10.00 ») ;
  - [ ] les guidelines de contenu (violence cartoon) et d'approbation.
- [ ] Étape 9 : analyse Stake Engine complète (init, mise, reprise, erreurs, délai dépassé sur `/wallet/play` sans double mise, déploiement).
- [ ] Étape 10 : choix de la stack (Phaser / PixiJS / Three.js / Babylon.js ; 2D / 2.5D / 3D). Vérifier au passage le support d'Opus par Safari iOS.
- [ ] Étape 11 : architecture :
  - séquenceur data-driven (GadgetDefinition / BranchDefinition / cues) ;
  - `FeatureGate` ;
  - state machine anti double mise ;
  - lecture de `config/rage_levels.json` côté client (max wins, échelles, RTP affiché).
- [ ] Étape 12 : roadmap MVP (phases 0 à 9).

## P1 : prototype (étape 13 et suivantes)
- [ ] Tranche verticale P1 : bibliothèques partagées + 13 branches (GDD_04, §5.9).
- [ ] Debug menu :
  - choix du Rage Level, du gadget, de la catégorie, de la rareté, de la branche et du multiplicateur ;
  - lecture d'un book réel ;
  - liste des combinaisons manquantes ;
  - **test automatique de la matrice de non-révélation** ;
  - **mesure de P(gain | état D1)** (± 15 points autour du hit rate).
- [ ] Porter les contrôles de `tools/check_gadget_catalogue.py` sur les définitions de gadgets du jeu (données), plutôt que sur le markdown.
- [ ] Prototype de `BF_ENTRY_MUG` et du BOSS FIGHT (échelle, attaque, fins BLOQUÉ et K.O.).

## P2 : maths, phase 2
- [ ] Jeu `games/bad_boss/` dans le math-sdk officiel, qui lit `config/rage_levels.json`.
- [ ] Books : base = multiplicateur × script × rareté × variante ; BOSS FIGHT = chemin de combat × variantes d'attaque. Répartition des poids entiers exacts, puis `utils/rgs_verification.py`.
- [ ] Après tests joueurs, décider :
  - hit rate d'UNHINGED (ligne x1,2 ?) ;
  - σ d'UNHINGED (dernière continuation 15 → 30 % ?) ;
  - fréquence du BOSS FIGHT.

## P3 : production du contenu
- [ ] MVP complet (P2) : 19 branches restantes des 3 gadgets MVP, Wendell, COO, super-gadget UFO.
- [ ] Lot de lancement A (LOW) : STAPLER, FAN, VENDING, PIANO, WRECKING BALL.
- [ ] Lot de lancement B (MEDIUM) : ESPRESSO, COO AIRLINES, COPIER, HAUNTED PC, TELEPORTER.
- [ ] Lot de lancement C (HIGH) : ROGUE ROBOT (nouveau rig), DELIVERY TRUCK.
- [ ] Vérification juridique du nom « BAD BOSS » et des règles anti-ressemblance du boss.

## P4 : plus tard
- [ ] Autres super-gadgets (T-Rex, Black Hole, Mecha-HR, Meteor, Kaiju COO, Time Machine, Confetti).
- [ ] Bonus additionnels (annexe du GDD_05), toujours déclenchés **dans** la manche.
- [ ] Choix cosmétique de l'attaque en BOSS FIGHT, à tester pour vérifier qu'il est perçu comme honnête.
- [ ] Bonus buy (seulement si `disabledBuyFeature` est faux et si c'est validé).
- [ ] Gadgets de la réserve (30 idées, GDD_04 §5.10), nouveaux environnements.
