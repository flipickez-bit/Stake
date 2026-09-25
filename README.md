# BAD BOSS

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

Jeu instantané cartoon pour **Stake Engine** : on se venge de Barnaby « B.B. » Bottomline, un patron fictif et insupportable, en 3 secondes par manche.
Trois Rage Levels (trois vrais niveaux de risque), un résultat tiré avant l'animation, des animations qui ne révèlent rien avant la fin, et un BOSS FIGHT jusqu'à x5 000.

## État
Conception terminée : étapes 1 à 12. **En attente du feu vert pour coder le MVP.** Aucun code de jeu pour l'instant.
Voir **[PROJECT_STATE.md](PROJECT_STATE.md)** et **[TODO.md](TODO.md)**.

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
| 12 | [MVP_ROADMAP](MVP_ROADMAP.md) | Phases, portes, budgets de performance, critères MVP |

## Maths
Paramètres : [`config/rage_levels.json`](config/rage_levels.json) (source de vérité unique).
```bash
python3 math/model/bad_boss_math.py --quick
python3 math/model/bad_boss_math.py --write-report docs/generated/MATH_REPORT.md
python3 tools/check_gadget_catalogue.py
```
