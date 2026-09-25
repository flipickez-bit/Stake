# BAD BOSS (nom de travail)

Jeu instantané cartoon pour **Stake Engine** : on se venge de Barnaby « B.B. » Bottomline, un patron fictif et insupportable, en 3 secondes par manche.
Trois Rage Levels (trois vrais niveaux de risque), un résultat tiré avant l'animation, des animations qui ne révèlent rien avant la fin, et un BOSS FIGHT jusqu'à x5 000.

## État
Conception : étapes 1 à 8 terminées. Pas encore de code de jeu.
Voir **[PROJECT_STATE.md](PROJECT_STATE.md)** et **[TODO.md](TODO.md)**.

## Documents
| Étape | Document | Contenu |
|---|---|---|
| 1-2 | [GDD_01_VISION_ET_RISQUES](docs/GDD_01_VISION_ET_RISQUES.md) | Résumé, leviers de fun, 5 risques majeurs |
| 3 | [GDD_02_CORE_GAMEPLAY](docs/GDD_02_CORE_GAMEPLAY.md) | Rage Levels, boucle, grammaire de résultat, charte d'honnêteté |
| 4 | [GDD_03_MATHEMATIQUES](docs/GDD_03_MATHEMATIQUES.md) | Méthode, calculs, 3 profils à RTP 96,5 %, séries de pertes |
| 4 | [generated/MATH_REPORT](docs/generated/MATH_REPORT.md) | Rapport généré (tables complètes) |
| 5 | [GDD_04_ANIMATIONS_ET_GADGETS](docs/GDD_04_ANIMATIONS_ET_GADGETS.md) | Système modulaire, bibliothèques partagées, archétypes de perte, MVP |
| 5 | [GDD_04b_CATALOGUE_15_GADGETS](docs/GDD_04b_CATALOGUE_15_GADGETS.md) | 15 gadgets, 152 branches, fiches de production |
| 6 | [GDD_05_BOSS_FIGHT](docs/GDD_05_BOSS_FIGHT.md) | Le bonus complet + 10 concepts futurs |
| 7 | [GDD_06_BOSS_ET_UNIVERS](docs/GDD_06_BOSS_ET_UNIVERS.md) | Le boss, le cast, les running gags, le joueur, la marque |
| 8 | [GDD_07_UI_CAMERA_SON](docs/GDD_07_UI_CAMERA_SON.md) | UI mobile/desktop, fonctionnalités de juridiction, caméra, son |
| — | [STAKE_ENGINE_FAITS_VERIFIES](docs/STAKE_ENGINE_FAITS_VERIFIES.md) | Faits Stake sourcés + informations à obtenir |

## Maths
Paramètres : [`config/rage_levels.json`](config/rage_levels.json) (source de vérité unique).
```bash
python3 math/model/bad_boss_math.py --quick                                   # rapport instantané
python3 math/model/bad_boss_math.py --write-report docs/generated/MATH_REPORT.md
```
