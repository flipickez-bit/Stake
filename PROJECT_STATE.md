# PROJECT_STATE — BAD BOSS

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

_Dernière mise à jour : 2026-09-25, **Phase 0.5B terminée** (variété d'animations V2). PLAYTEST #1 fait. **En attente du PLAYTEST #2 humain.** La Phase 1 n'est PAS commencée. Aucun asset définitif._

## Phase 0.5 : état (`PHASE_0_5.md`)
Question : **BAD BOSS est-il déjà satisfaisant à jouer avec des placeholders ?**
- ✅ PLAYTEST 50 v2 (LOCAL DEV ONLY), cadrage portrait adaptatif, LOOP x500 (pas de fuite visible) : voir 0.5A.
- ✅ **PLAYTEST #1** (contenu P05-A, 12 branches) : rythme (Q4) et Rage Levels (Q2) validés ; pertes amusantes mais trop peu variées (Q3) ; **Q1 = 2,5 / 5** (le début annonçait la fin) ; Q5 non évaluable ; demande de « beaucoup plus d'animations nouvelles ».
- ✅ **Phase 0.5B — variété V2** (contenu **P05-B · 51 branches**, dont 45 hors BOSS FIGHT) :
  - 2e branche LOSS par gadget faite : SLINGSHOT BACKFIRE, TRAPDOOR TEASE, ROCKET WENDELL CEILING (le « tell » du rallumage est corrigé) ;
  - 15 à 16 branches jouables par gadget, composées de modules SETUP × TWIST × FIN partagés entre gains et pertes ;
  - audit en CI : chaque début visible mène aux deux issues, rapport de vraisemblance gain/perte entre 0,62 et 1,83 (limite [0,5 ; 2]) ;
  - gags récurrents sans signification fixe (LE SIP peut finir en gain), doubles twists rares, ascenseur hors champ dans les 3 gadgets ;
  - rareté cosmétique COMMON → VERY_RARE qui ne choisit qu'entre des présentations compatibles avec le résultat (découvertes étalées jusqu'à ~200 manches et au-delà) ;
  - anti-répétition étudiée et **non implémentée** (elle casserait replay et reprise) ; variété sans état à la place ;
  - bouton **APERÇU BOSS FIGHT** (sans mise, sans donnée de playtest) ; question Q7 sur la nouveauté ; option « pas rencontré » pour Q5.
- ⏳ **PLAYTEST #2** (vous) : objectif Q1 ≥ 4 / 5 et nouvelles animations encore remarquées après les manches 10, 25 et 50.
- Autoplay : descendu dans les priorités (pas en Phase 0.5).

## Résumé
Jeu instantané pour **Stake Engine**. Le joueur se venge, façon cartoon slapstick, de Barnaby « B.B. » Bottomline, un patron fictif.
- Trois **Rage Levels** : GRUMPY, FURIOUS, UNHINGED. Ce sont 3 bet modes, même RTP, volatilités différentes, chacun avec un gadget cosmétique.
- Le résultat vient d'un book Stake. L'animation, un arbre à divergence retardée, le raconte de façon **déterministe** : reprise et replay identiques.
- Bonus **BOSS FIGHT** (1 manche sur 150), de x5 jusqu'à x200, x1 000 ou x5 000 selon le niveau.

## Phase 0 : état
**Terminée.** Le prototype prouve l'architecture : boucle complète, coupures réseau et reprise, DEV PANEL, déterminisme.
- Recette détaillée : **[PHASE_0_ACCEPTANCE.md](PHASE_0_ACCEPTANCE.md)** (PASS / FAIL / NOT TESTED). Aucun critère en FAIL. NOT TESTED : appareils réels, RGS Stake réel, jugement humain du « fun », vraie session PLAYTEST 50.
- Tests (à la fin de la 0.5B) : **65 unitaires/intégration** (Vitest, dont l'audit de variété) + **14 e2e** (Playwright, Chromium, dont un PLAYTEST 50 complet et l'aperçu BOSS FIGHT) : tous verts.
- LOOP ×100 (sans mise) : 100/100, 0 erreur, 0 appel wallet (`docs/generated/LOOP_X100.md`).
- Build : 719 Ko bruts au total, **≈ 196 Ko gzip** au chargement initial (`docs/generated/BUILD_SIZE.md`). Aucun asset binaire.
- **Préversion jouable** (privée) : https://claude.ai/artifact/2oG78eNrGNuwiL9aL2SWkA (fichier unique `npm run build:single`, Mock RGS, aucun argent réel).

## Stack (figée en Phase 0)
- **Svelte 5.57** (UI HTML) + **PixiJS 8.21** (scène) + **TypeScript 5.9 strict**, SPA **Vite 8** (`base: './'`), sans SvelteKit ni monorepo.
- Personnages derrière **`CharacterAnimator`** (placeholders à pièces). **Spine n'est pas une dépendance.**
- Séquenceur, particules analytiques, caméra : **maison**, déterministes. Audio : **WebAudio synthétisé** (Howler reviendra avec les vrais sons).
- Réseau : **`RgsPort`** ← `MockRgsAdapter` (développement) ou `StakeRgsAdapter` (client npm `stake-engine` 0.1.32 BETA, confiné).
- Tests : Vitest 5 + Playwright 1.56. CI GitHub Actions. Maths : calculateur Python (modèle) ; math-sdk officiel en Phase 2.

## Architecture du dépôt
```
README.md · PROJECT_STATE.md · TODO.md · PHASE_0_ACCEPTANCE.md
TECH_ARCHITECTURE.md        §1-2 conception ; §3 ce qui est construit, écarts, provenance des données, format des books
MVP_ROADMAP.md              phases, budgets ; §8 proposition de Phase 1
config/                     rage_levels.json (maths, source unique) · presentation_policy.json
src/domain                  modèle pur (Rage Levels, classes, book, Outcome, graine)
src/platform/rgs            RgsPort · mock/ (RGS simulé persistant, pannes) · stake/ (adaptateur du SDK)
src/flow                    GameFlow (machine à états), FeatureGate, délais
src/presentation            moteur : compileSequence (pur), timeline, SequencePlayer, particules, CharacterAnimator
src/content                 données : bureau, bibliothèques partagées, modules (dsl), 3 gadgets (51 branches)
src/presenter · src/render  pont GameFlow ↔ séquenceur · scène Pixi et placeholders
src/audio · src/dev · src/app   sons synthétisés · outils dev (boucle, perf, playtest) · UI Svelte + DEV PANEL
tests/unit · tests/e2e · tools/ · docs/ (GDD, Stake, captures, rapports générés) · math/
```

## Décisions verrouillées
1. **RAGE LEVELS** : 3 modes Stake (`grumpy`, `furious`, `unhinged`, coût 1.0), même RTP. Les gadgets sont cosmétiques.
2. **`TARGET_RTP = 0.965`**, défini seulement dans `config/rage_levels.json`. Validation Stake requise avant publication.
3. **Max wins** : x200, x1 000, x5 000. **UNHINGED** : σ ≈ 11,6 et hit rate ≈ 15,5 % conservés, variante x1,2 **désactivée**.
4. **BOSS FIGHT** : 1/150, échelle x5 → x5 000 plafonnée par niveau, entièrement dans le book, sans cash-out.
5. **MVP (définitif)** : GRUMPY → SWIVEL SLINGSHOT, FURIOUS → TRAPDOOR EXPRESS, UNHINGED → OFFICE ROCKET. Ne change plus sauf problème révélé par les playtests.
6. **Nom** : BAD BOSS = *working title*, clearance de marque requise.
7. **Réseau** : `stake-engine` derrière un adapter ; GameFlow ne voit que `RgsPort` ; aucun type Stake ne fuit.
8. **Play au résultat inconnu** : jamais supposé échoué, **jamais de nouveau Play automatique**, resynchronisation d'abord (ROUND_STATUS_UNKNOWN).
9. **Fin de manche** : `end-round` au reveal, au plus 3 appels, chacun après vérification serveur. ❓ Contrat exact.
10. **Déterminisme** : graine cosmétique dans le book ; elle ne touche jamais multiplicateur, gain/perte, bonus, palier, payout. `Math.random()` interdit dans la présentation (test en CI).
11. **Timing** : vitesse, skip / slamstop et durée minimale (READY_GATE) sont trois mécanismes séparés.
12. **UI conditionnelle** : `FeatureGate`. Une fonctionnalité interdite n'est pas proposée.
13. **PLAYTEST 50** : LOCAL DEV ONLY. Toute collecte future auprès de vrais joueurs sera traitée à part (information, consentement).

## Systèmes terminés
- Conception : étapes 1 à 12 (GDD, analyse Stake, architecture, roadmap). Calculateur mathématique v3. Contrôleur du catalogue (152 branches).
- **Phase 0** : GameFlow complet ; Mock RGS persistant avec pannes ; adaptateur Stake ; séquenceur déterministe ; scène placeholder (bureau, B.B., mug, Wendell, COO, 3 cartes) ; 12 branches + BOSS FIGHT ; sons synthétisés ; HUD mobile ; DEV PANEL (forçages, simulations, debug, boucle ×20/×100, PLAYTEST 50) ; replay par URL ; CI.
- **Phase 0.5** : PLAYTEST 50 v2 et rapport ; cadrage portrait ; LOOP x500 ; variété V2 (51 branches modulaires, rareté cosmétique, ascenseur, accessoires de bureau : écran, ventilateur, plante, extincteur, chaise volante, fumée) ; audit de prévisibilité ; APERÇU BOSS FIGHT.

## Systèmes non commencés
- Phase 1 (voir `MVP_ROADMAP.md` §8) et suivantes : tests sur téléphones réels, passe de game feel, archétypes de perte supplémentaires, autoplay, écran de règles.
- Books et lookup tables officiels (math-sdk, Phase 2). Intégration Stake staging (Phase 3).
- Assets définitifs, 12 gadgets hors MVP, branding final.

## Bugs et limites connus
- **Performance réelle inconnue** : seules des mesures headless (rendu logiciel SwiftShader, ≈ 9-15 FPS non représentatifs ; coût CPU de notre code ≈ 1 ms/image).
- Portrait : corrigé en Phase 0.5 ; à valider sur de vrais téléphones (encoches, barres système, audio).
- Variété P05-B non encore validée par un humain (PLAYTEST #2). Les gags de gros gain RARE ne se voient qu'après des centaines de manches : utiliser le DEV PANEL (branche forcée) pour les revoir.
- Répétition immédiate d'une même branche encore possible (≈ 17 % perte → perte, 20-26 % gain → gain) : pas d'anti-répétition, par choix (déterminisme du replay).
- Chaque nouvelle branche est un placeholder : la lisibilité de certains gags (chaise qui revient, fumée, ascenseur) sera à revoir avec les vrais assets.
- Sons placeholders synthétisés ; ambiance minimale ; déverrouillage audio non vérifié sur iOS.
- `minimumRoundDuration` : interprétation provisoire (≤ 60 → secondes). **Bloquant avant production.**
- `StakeRgsAdapter` non testé contre un vrai RGS.
- Préversion claude.ai : pas de paramètres d'URL (utiliser le bouton **DEV**), pas de replay par URL ; l'enregistrement de fichier passe par la confirmation du viewer (capacité `downloads`) ; le solde fictif et les sessions de playtest sont propres à chaque navigateur.

## Questions ouvertes (INFORMATION STAKE ENGINE REQUISE)
`docs/STAKE_ENGINE_FAITS_VERIFIES.md` §11 (16 questions) et §12 (13 hypothèses portées par le code, chacune isolée à un seul endroit).

## Prochaine tâche
**Attendre le PLAYTEST #2** (vos résultats exportés, contenu P05-B). Ensuite : rapport de Phase 0.5 comparant P05-A et P05-B, puis arrêt. Pas de Phase 1 automatique.

## Commandes
```bash
npm install                     # une fois
npm run dev                     # développement : http://localhost:5173  (?dev=1 ouvre le DEV PANEL)
npm run build && npm run preview   # build statique : http://localhost:4173
npm run build:single            # un seul fichier : dist-single/index.html (s'ouvre aussi en double-cliquant)
npm test                        # Vitest : 65 tests
npm run test:e2e                # Playwright : 14 tests (Chromium)
npm run check                   # svelte-check
npm run size                    # taille du build (après build)
npm run loop:bench -- --count 100 --speed turbo --markdown docs/generated/LOOP_X100.md
npm run loop:500                # LOOP x500 + mémoire tous les 50 rounds (≈ 20 min, pas en CI)
node tools/playtest-report.mjs exports/*.json --markdown docs/generated/PLAYTEST_REPORT.md
VARIETY_REPORT=docs/generated/VARIETY_REPORT.md npx vitest run tests/unit/variety.test.ts   # rapport de variété
node tools/capture-portrait.mjs --dist dist --prefix after   # captures portrait
node tools/capture-screens.mjs  # captures → docs/phase0/screens
python3 math/model/bad_boss_math.py --quick
python3 tools/check_gadget_catalogue.py
```
Mode Stake (non testé) : `?sessionID=…&rgs_url=…` bascule sur `StakeRgsAdapter`. Replay : `?replay=true&game=…&version=…&mode=…&event=<roundId>`.
