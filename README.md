# BAD BOSS (nom de travail)

Jeu instantané cartoon pour **Stake Engine** : on se venge d'un patron fictif et insupportable, en 3 secondes par manche.
Trois plans de vengeance par manche, trois vrais niveaux de risque, un résultat tiré avant l'animation, et un BOSS FIGHT jusqu'à x5 000.

## État
Conception : étapes 1 à 4 terminées (vision, risques, core gameplay, mathématiques). Pas encore de code de jeu.
Voir **[PROJECT_STATE.md](PROJECT_STATE.md)** et **[TODO.md](TODO.md)**.

## Documents
| Document | Contenu |
|---|---|
| [docs/GDD_01_VISION_ET_RISQUES.md](docs/GDD_01_VISION_ET_RISQUES.md) | Résumé en 5 lignes, leviers de fun, 5 risques majeurs |
| [docs/GDD_02_CORE_GAMEPLAY.md](docs/GDD_02_CORE_GAMEPLAY.md) | Modèle RAGE LEVELS, boucle, grammaire de résultat, charte d'honnêteté |
| [docs/GDD_03_MATHEMATIQUES.md](docs/GDD_03_MATHEMATIQUES.md) | Méthode, calculs, 3 profils à RTP 96,5 %, BOSS FIGHT, lookup tables |
| [docs/STAKE_ENGINE_FAITS_VERIFIES.md](docs/STAKE_ENGINE_FAITS_VERIFIES.md) | Faits Stake Engine sourcés + informations à obtenir |

## Maths
```bash
python3 math/model/bad_boss_math.py            # rapport complet
python3 math/model/bad_boss_math.py --markdown # tableaux du GDD
```
