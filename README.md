# BAD BOSS

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

Jeu instantané cartoon pour **Stake Engine** : on se venge de Barnaby « B.B. » Bottomline, un patron fictif et insupportable, en 3 secondes par manche.
Trois Rage Levels (trois vrais niveaux de risque), un résultat tiré avant l'animation, des animations qui ne révèlent rien avant la fin, et un BOSS FIGHT jusqu'à x5 000.

## État
**Phase 0 terminée** (prototype technique en formes simples, Mock RGS, DEV PANEL). Recette : **[PHASE_0_ACCEPTANCE.md](PHASE_0_ACCEPTANCE.md)**.
Voir **[PROJECT_STATE.md](PROJECT_STATE.md)** et **[TODO.md](TODO.md)**.

## Lancer le prototype
```bash
npm install
npm run dev              # http://localhost:5173  — ajoutez ?dev=1 pour ouvrir le DEV PANEL
npm test                 # 58 tests unitaires et d'intégration
npm run test:e2e         # 13 tests Playwright (Chromium)
npm run build:single     # préversion en un seul fichier : dist-single/index.html
```
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
| Phase 0.5 | [PHASE_0_5](PHASE_0_5.md) · [portrait avant/après](docs/phase05/portrait) · [LOOP x500](docs/generated/LOOP_X500.md) | Playtest et game feel (en cours) |
| Phase 0 | [PHASE_0_ACCEPTANCE](PHASE_0_ACCEPTANCE.md) · [captures](docs/phase0/screens) · [LOOP x100](docs/generated/LOOP_X100.md) · [taille du build](docs/generated/BUILD_SIZE.md) | Recette du prototype |

## Maths
Paramètres : [`config/rage_levels.json`](config/rage_levels.json) (source de vérité unique).
```bash
python3 math/model/bad_boss_math.py --quick
python3 math/model/bad_boss_math.py --write-report docs/generated/MATH_REPORT.md
python3 tools/check_gadget_catalogue.py
```
