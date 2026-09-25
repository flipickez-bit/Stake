# PHASE 0 — Recette (acceptance)

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**
> Date : 2026-09-25 · Branche : `claude/sharp-ptolemy-ky4nxy`
> Légende : **PASS** (vérifié par un test automatisé ou une mesure reproductible) · **FAIL** · **NOT TESTED** (non vérifiable ici, ou non vérifié).
> Tests : `npm test` (Vitest, **55 tests unitaires et d'intégration**) · `npm run test:e2e` (Playwright, **13 tests** dans Chromium headless).
> « U: » renvoie à un test unitaire, « E2E: » à un test Playwright (`tests/e2e/phase0.spec.ts`).

## 1. Boucle de jeu

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1.1 | LOAD → AUTH simulée → READY → choix du Rage Level → BET → PLAY → RESULT → ANIMATION placeholder → REVEAL → END ROUND → READY | **PASS** | E2E: `LOAD → AUTH → READY → …` · U: `READY → BET → PLAY → présentation → REVEAL → END ROUND → READY` · U: `boucle complète avec le séquenceur` |
| 1.2 | Aucun chiffre du résultat affiché avant le reveal | **PASS** | U: `aucun chiffre avant le reveal (I5)` |
| 1.3 | Le solde et l'historique du Mock RGS sont corrects (débit au Play, crédit à l'EndRound) | **PASS** | U: `Play débite… EndRound crédite` · E2E: nominal (solde vérifié) |

## 2. Coupures réseau et reprise (« relancer et reprendre exactement la même manche »)

| # | Moment de la coupure | Statut | Preuve |
|---|---|---|---|
| 2.1 | Réseau coupé AVANT exécution du Play | **PASS** | E2E: `NETWORK OFFLINE during bet` (0 Play, RETRY, « Bet not placed ») · U: `PLAY hors ligne…` |
| 2.2 | Play envoyé, réponse perdue (**ROUND_STATUS_UNKNOWN**) | **PASS** | E2E: `PLAY TIMEOUT after request sent` · E2E: bouton DEV `SIMULATE PLAY TIMEOUT AFTER REQUEST SENT → exactly one Play` · U: `PLAY TIMEOUT…` |
| 2.3 | Rechargement de page après le Play | **PASS** | E2E: `RELOAD AFTER PLAY` · U: `manche active au démarrage → reprise (jamais de Play)` |
| 2.4 | Rechargement PENDANT l'animation : même résultat, même branche, même graine | **PASS** | E2E: `RELOAD DURING ANIMATION` · U: `RELOAD DURING ANIMATION` (vrai séquenceur) |
| 2.5 | Rechargement PENDANT le BOSS FIGHT : même déroulé, même palier final | **PASS** | U: `RELOAD DURING BOSS FIGHT` |
| 2.6 | Réponse d'EndRound perdue | **PASS** | E2E: `END ROUND response lost` (1 seul EndRound) · U: `END ROUND (réponse perdue)` |
| 2.7 | EndRound hors ligne : pas de rafale, RETRY | **PASS** | U: `END ROUND hors ligne → pas de rafale` |
| 2.8 | Rechargement entre le reveal et la réponse d'EndRound | **PASS** (par construction) | La manche reste active côté serveur → même chemin que 2.3 (reprise, puis un seul EndRound). Pas de test dédié. |
| 2.9 | Serveur qui ferme lui-même une manche à x0 (politique de repli) | **PASS** | U: `politique de repli… aucun EndRound` |

## 3. Réseau et architecture

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 3.1 | SDK Stake → `StakeRgsAdapter` → `GameFlow` ; GameFlow ne dépend jamais du SDK | **PASS** | U: `aucun fichier hors de platform/rgs/stake n'importe le SDK stake-engine` · GameFlow n'importe que `RgsPort` |
| 3.2 | Interface interne stable : `authenticate`, `play`, `endRound`, `getActiveRound`, `getReplay` | **PASS** | `src/platform/rgs/RgsPort.ts` |
| 3.3 | Mock et Stake interchangeables sans modifier GameFlow | **PASS** | `src/app/bootstrap.ts` (choix par l'URL, imports dynamiques) ; mêmes tests GameFlow |
| 3.4 | Aucun type Stake ne fuit ; conversion immédiate en `InternalRound` | **PASS** | U: `convertit Authenticate vers les modèles internes` ; `toInternalRound` |
| 3.5 | `StakeRgsAdapter` contre un vrai RGS Stake (staging) | **NOT TESTED** | Pas d'accès staging. Testé contre un `fetch` simulé seulement |
| 3.6 | Play au résultat inconnu : jamais supposé échoué, **jamais de nouveau Play automatique**, resync d'abord | **PASS** | U + E2E 2.1, 2.2 |
| 3.7 | EndRound idempotent côté client : ≤ 3 appels, chacun après vérification serveur | **PASS** | U: 2.6, 2.7 · contrat Stake exact : **INFORMATION STAKE ENGINE REQUISE** |
| 3.8 | Double clic sur BET → 1 seul Play | **PASS** | E2E: `DOUBLE CLICK BET → 1 Play` · U: `DOUBLE CLICK BET` |
| 3.9 | Mode replay par URL : aucune mise possible, aucun appel wallet | **PASS** | E2E: `REPLAY (dev + URL)` |

## 4. Déterminisme

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 4.1 | Pas de `Math.random()` (ni `Date.now`, `performance.now`, `crypto`) dans la présentation et le contenu | **PASS** | U: `aucune source de hasard ou d'horloge…` (analyse des sources) |
| 4.2 | COSMETIC SEED : même animation deux fois | **PASS** | U: `COSMETIC SEED : même book → même séquence et mêmes images` |
| 4.3 | DIFFERENT COSMETIC SEED : seuls les éléments autorisés changent | **PASS** | U: `DIFFERENT COSMETIC SEED` (maths identiques, tout jusqu'au reveal identique hors graines d'effets) |
| 4.4 | La graine n'influence jamais multiplicateur, gain/perte, bonus, palier, payout | **PASS** | U: 4.3 + ordre des tirages du mock (`mockMath.generateBook`) · `TECH_ARCHITECTURE.md` §3.3 |
| 4.5 | TURBO / SUPER TURBO / SLAMSTOP-SKIP → résultat identique | **PASS** | U: `TURBO / SUPER TURBO…` · U: `SLAMSTOP / SKIP…` (×2) |
| 4.6 | BOSS FIGHT entièrement déterminé avant l'animation | **PASS** | U: `BOSS FIGHT entièrement déterminé AVANT l'animation` · U: `BOSS FIGHT : tout le déroulé est dans la séquence compilée` |
| 4.7 | REPLAY → même branche, même résultat | **PASS** | E2E: `REPLAY (dev + URL)` · U: `REPLAY → même branche…` |
| 4.8 | État de scène = fonction pure du temps (seek = lecture continue) | **PASS** | U: `lecture continue et seek donnent la même image` |
| 4.9 | Tronc neutre identique pour toutes les issues (non-révélation avant D1) | **PASS** | U: `le tronc est neutre…` |

## 5. DEV PANEL

| # | Élément | Statut | Preuve |
|---|---|---|---|
| 5.1 | FORCE : RAGE LEVEL, GADGET, OUTCOME, MULTIPLIER, BRANCH, COSMETIC SEED, SPEED | **PASS** | E2E: `DEV PANEL: force outcome + branch + seed through the panel` (sélecteurs réels) · capture `06` |
| 5.2 | SIMULATE : NETWORK OFFLINE, PLAY TIMEOUT, END ROUND TIMEOUT, PAGE RELOAD, ACTIVE ROUND, REPLAY | **PASS** | E2E 2.1 à 2.6, 3.9 et bouton DEV 2.2 ; `ACTIVE ROUND + RELOAD` = même chemin que U: `manche active au démarrage` |
| 5.3 | DEBUG : FPS, FRAME TIME, TEXTURE MEMORY ESTIMATE, ACTIVE PARTICLES, ACTIVE OBJECTS, GAME STATE, ROUND ID, ANIMATION TIME | **PASS** | Capture `06` (valeurs en direct, 4 Hz) |
| 5.4 | LOOP ×20 sans vraie mise | **PASS** | E2E: `DEV PANEL: LOOP x20` (20/20, 0 erreur, 0 appel wallet) |
| 5.5 | LOOP ×100 | **PASS** | `docs/generated/LOOP_X100.md` (100/100, 0 erreur, 0 appel wallet) |
| 5.6 | Compteurs d'appels Play / EndRound visibles (preuve « pas de deuxième mise ») | **PASS** | E2E bouton DEV 2.2 (`dev-calls-play` = 1) |

## 6. Présentation placeholder

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 6.1 | ≤ 12 branches : 3 gadgets × (LOSS, WIN, BIG WIN, BOSS FIGHT) | **PASS** | U: `3 gadgets… 12 branches` |
| 6.2 | Formes simples : bureau, bureau du boss, B.B. violet, mug jaune, Wendell, COO le pigeon, 3 cartes Rage Level | **PASS** | Captures `01`, `03`, `05`, `08` |
| 6.3 | Game feel : camera shake, hit stop, courbes d'easing, anticipation, impact, silence, DING, reveal du multiplicateur | **PASS** (présents) | Cues `camera`, `freeze`, `silence`, sons `ding` ; U: `hit stop` · captures `04`, `09` |
| 6.4 | Le game feel est-il drôle et lisible ? | **NOT TESTED** | Jugement humain : PLAYTEST 50 à faire, puis porte G2 |
| 6.5 | Spine n'est pas une dépendance ; `CharacterAnimator` abstrait le rendu des personnages | **PASS** | `package.json` (aucune dépendance Spine) · `src/presentation/characterAnimator.ts` |
| 6.6 | Mise en page mobile portrait (390 × 844) : cartes, FIRE, mise, vitesse, skip visibles | **PASS** | Captures `08`, `09` |
| 6.7 | Déverrouillage audio sur iOS Safari / Android réels | **NOT TESTED** | Pas d'appareil |

## 7. PLAYTEST 50 (LOCAL DEV ONLY)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 7.1 | Enregistre Rage Level, durée de manche, résultat, multiplicateur, branche, temps avant la manche suivante | **PASS** | U: `PLAYTEST 50…` (×2) · E2E: `PLAYTEST 50…` (3 manches réelles du mock) |
| 7.2 | Local uniquement (localStorage de ce navigateur), rien n'est envoyé | **PASS** | `src/dev/playtest.ts` (aucun appel réseau) ; mention LOCAL DEV ONLY dans l'UI et l'export |
| 7.3 | Petit résumé technique à la fin | **PASS** | Tableau du DEV PANEL + export JSON |
| 7.4 | Une vraie session de 50 manches jouée par un humain | **NOT TESTED** | À faire par vous (DEV PANEL → PLAYTEST 50 → START) |

## 8. Technique et performance

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 8.1 | Svelte 5, PixiJS 8, TypeScript strict, Vite, build statique, sans SvelteKit ni monorepo | **PASS** | `package.json`, `vite.config.ts` (`base: './'`) |
| 8.2 | `tsc --noEmit` et `svelte-check` sans erreur ni avertissement | **PASS** | `npx tsc --noEmit` · `npm run check` |
| 8.3 | JS initial ≤ 300 Ko gzip (budget MVP_ROADMAP §4) | **PASS** | `docs/generated/BUILD_SIZE.md` (≈ 196 Ko gzip au chargement initial, 719 Ko bruts au total) |
| 8.4 | Stabilité mémoire après boucle (tas ± 2 Mo) | **PASS** (headless) | `docs/generated/LOOP_X100.md` (8,9 → 10,8 Mo après 100 manches ; 6 textures, 131 nœuds, constants) |
| 8.5 | 60 FPS sur téléphone de référence | **NOT TESTED** | Pas d'appareil. Headless = rendu logiciel SwiftShader, non représentatif ; coût CPU de notre code ≈ 1 ms/image |
| 8.6 | Lien de préversion jouable | **PASS** (publié) | Artifact privé (fichier unique `npm run build:single`), testé dans Chromium sous une CSP stricte sans `eval`. Rendu dans le viewer claude.ai et sur téléphone : **NOT TESTED** par moi |
| 8.7 | CI (types, svelte-check, tests, build, taille, contrôle du catalogue) | **PASS** (écrite) | `.github/workflows/ci.yml` — exécution GitHub non observée ici |

## 9. Hors périmètre Phase 0 (volontairement non fait)
Assets définitifs, 15 gadgets, 152 animations, système de particules complet, physique de débris, branding final, boutique, progression, personnalisation, cinématiques, optimisation prématurée, backend maison.
