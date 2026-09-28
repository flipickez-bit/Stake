# BAD BOSS

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

Jeu instantané cartoon pour **Stake Engine** : on se venge de Barnaby « B.B. » Bottomline, un patron fictif et insupportable, en 3 secondes par manche.
Trois Rage Levels (trois vrais niveaux de risque), un résultat tiré avant l'animation, des animations qui ne révèlent rien avant la fin, et un BOSS FIGHT de **8 tours gratuits** (1 manche sur 400, rage qui monte) jusqu'à x5 000.

## État
**PRODUCTION 3 GADGETS PAR RAGE LEVEL — prête pour le PLAYTEST #3** : 9 gadgets, 150 branches, 150 cartes de collection, SOUND KIT, ANIMATION KIT. Détails : **[PRODUCTION_3_GADGETS.md](PRODUCTION_3_GADGETS.md)** ; correctif final P3.1 (variété d'HVAC HURRICANE, OTHER PLANS) : **[P3_1_CORRECTIF.md](P3_1_CORRECTIF.md)**.
Le choix A/B/C (A2) n'existe qu'avec le Mock RGS (INFORMATION STAKE ENGINE REQUISE) ; avec le RGS Stake, le jeu reste en mode classique (un gadget par Rage Level).
Voir **[PROJECT_STATE.md](PROJECT_STATE.md)** et **[TODO.md](TODO.md)**. Phase 0 : **[PHASE_0_ACCEPTANCE.md](PHASE_0_ACCEPTANCE.md)**.

## Lancer le prototype
```bash
npm install
npm run dev              # http://localhost:5173 — Mock, 3 gadgets par Rage Level (?plans=off : mode classique ; ?dev=1 : DEV PANEL)
npm test                 # tests unitaires et d'intégration (Vitest)
npm run test:e2e         # tests Playwright (Chromium)
npm run build:single     # préversion en un seul fichier : dist-single/index.html (PLAYTEST #3)
```
Le choix entre 3 gadgets n'est jamais proposé avec le RGS Stake (mode classique).
Aucun argent réel : en l'absence de `sessionID`/`rgs_url` dans l'URL, le jeu utilise le **Mock RGS** (solde fictif, stocké dans le navigateur).

## Documents
| Étape | Document | Contenu |
|---|---|---|
| 1-2 | [GDD_01_VISION_ET_RISQUES](docs/GDD_01_VISION_ET_RISQUES.md) | Résumé, leviers de fun, risques |
| 3 | [GDD_02_CORE_GAMEPLAY](docs/GDD_02_CORE_GAMEPLAY.md) | Rage Levels, boucle, grammaire de résultat, charte d'honnêteté |
| 4 | [GDD_03_MATHEMATIQUES](docs/GDD_03_MATHEMATIQUES.md) · [MATH_REPORT](docs/generated/MATH_REPORT.md) | Maths, séries de pertes, variante expérimentale |
| 5 | [GDD_04_ANIMATIONS_ET_GADGETS](docs/GDD_04_ANIMATIONS_ET_GADGETS.md) · [GDD_04b_CATALOGUE](docs/GDD_04b_CATALOGUE_15_GADGETS.md) | Système modulaire, 15 gadgets, 152 branches |
| 6 | [GDD_05_BOSS_FIGHT](docs/GDD_05_BOSS_FIGHT.md) | Le bonus |
| 7 | [GDD_06_BOSS_ET_UNIVERS](docs/GDD_06_BOSS_ET_UNIVERS.md) | Boss, cast, running gags |
| 8 | [GDD_07_UI_CAMERA_SON](docs/GDD_07_UI_CAMERA_SON.md) | UI, juridiction, caméra, son |
| 9 | [STAKE_ENGINE_FAITS_VERIFIES](docs/STAKE_ENGINE_FAITS_VERIFIES.md) | Analyse technique Stake Engine |
| 10-11 | [TECH_ARCHITECTURE](TECH_ARCHITECTURE.md) | Stack, architecture, GameFlow, modèle d'animation, DEV PANEL |
| 12 | [MVP_ROADMAP](MVP_ROADMAP.md) | Phases, portes, budgets de performance, critères MVP, proposition de Phase 1 |
| Phase 0.5 | [PHASE_0_5](PHASE_0_5.md) · [portrait avant/après](docs/phase05/portrait) · [LOOP x500](docs/generated/LOOP_X500.md) | Playtest et game feel (PLAYTEST #2 attendu) |
| Phase 0.6 | [PHASE_0_6](PHASE_0_6.md) · [ART BIBLE](BAD_BOSS_ART_BIBLE.md) · [concepts](docs/phase06/concepts) · [avant/après](docs/phase06) | Visual upgrade : vertical slice GRUMPY + SWIVEL SLINGSHOT (en attente de validation) |
| POC 3 PLANS | [POC_3_GADGETS](POC_3_GADGETS.md) · [étude](docs/ETUDE_CHOIX_3_GADGETS.md) · [résumé Stake](docs/STAKE_A2_TECH_SUMMARY.md) · [captures](docs/poc3) · [SOUND BIBLE](SOUND_BIBLE.md) | Choix entre 3 gadgets : preuve de concept (Mock/DEV), playtest A/B attendu |
| PRODUCTION 3 GADGETS | [PRODUCTION_3_GADGETS](PRODUCTION_3_GADGETS.md) · [SOUND BIBLE](SOUND_BIBLE.md) · [ANIMATION KIT](ANIMATION_KIT.md) · [captures](docs/production) · [perf](docs/generated/P3_PERF.md) · [collection](docs/generated/COLLECTION_REPORT_P3.md) | 9 gadgets, 147 branches, collection, MELTDOWN, PLAYTEST #3 |
| Phase 0 | [PHASE_0_ACCEPTANCE](PHASE_0_ACCEPTANCE.md) · [captures](docs/phase0/screens) · [LOOP x100](docs/generated/LOOP_X100.md) · [taille du build](docs/generated/BUILD_SIZE.md) | Recette du prototype |

## Maths
Paramètres : [`config/rage_levels.json`](config/rage_levels.json) (source de vérité unique).
```bash
python3 math/model/bad_boss_math.py --quick
python3 math/model/bad_boss_math.py --write-report docs/generated/MATH_REPORT.md
python3 tools/check_gadget_catalogue.py
```
