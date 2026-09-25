# PROJECT_STATE — BAD BOSS

_Dernière mise à jour : 2026-09-25, fin des étapes 1 à 4 (conception, pas encore de code de jeu)._

## Résumé
Jeu instantané pour **Stake Engine**. Le joueur se venge, façon cartoon slapstick, d'un patron fictif. Trois plans par manche, chacun correspondant à un **vrai niveau de risque** (GRUMPY, FURIOUS, UNHINGED), avec un gadget qui change à chaque manche. Le résultat est pré-calculé par Stake Engine, et l'animation ne fait que le raconter. Le bonus BOSS FIGHT (1 manche sur 150) offre une échelle jusqu'à x5 000.

## Stack
- **Pas encore choisie** (étape 10). Hypothèse de travail : rendu 2D/2.5D (Spine ou sprites pré-rendus depuis la 3D), TypeScript, build en site statique.
- Référence officielle disponible : web-sdk Stake (Svelte 5 + PixiJS 8), optionnel.
- Maths : calculateur Python stdlib (`math/model/bad_boss_math.py`). Production finale prévue avec le math-sdk officiel Stake Engine (Python).

## Architecture actuelle du dépôt
```
/README.md                           présentation + index
/PROJECT_STATE.md                    ce fichier
/TODO.md                             tâches par priorité
/docs/GDD_01_VISION_ET_RISQUES.md    étapes 1-2
/docs/GDD_02_CORE_GAMEPLAY.md        étape 3 (verrouillée)
/docs/GDD_03_MATHEMATIQUES.md        étape 4 (verrouillée)
/docs/STAKE_ENGINE_FAITS_VERIFIES.md faits Stake sourcés + infos requises
/math/model/bad_boss_math.py         calculateur mathématique de référence
```

## Décisions prises (verrouillées)
1. **Modèle de choix E, « RAGE LEVELS »** : 3 emplacements fixes = 3 bet modes Stake (`grumpy`, `furious`, `unhinged`, coût 1.0), même RTP. Gadgets tirés à chaque manche dans le pool du niveau, **cosmétiques** au sein d'un niveau.
2. **RTP 96,5 %** exact pour les 3 modes (house edge 3,5 %).
3. **Profils** : GRUMPY σ 2,74, hit 58,1 %, max x200 · FURIOUS σ 6,81, hit 33,1 %, max x1 000 · UNHINGED σ 13,31, hit 15,6 %, max x5 000.
4. **BOSS FIGHT** : 1/150 dans chaque mode, x5 garanti, échelle x5 → x12 → x30 → x75 → x200 → x500 → x1 000 → x2 000 → x5 000, plafonnée par mode. Pas de cash-out (incompatible avec les books pré-calculés).
5. **La mise ne fait que définir l'argent engagé.** Seuils de mise en scène basés sur le multiplicateur. Pas de bonus buy au MVP.
6. **Le script de présentation est choisi dans le book** (math SDK) selon des probabilités conditionnelles fixes. Le client ne fait que combiner catégorie, gadget et variante.
7. **Charte de présentation honnête** : aucun chiffre avant REVEAL, TEASE ≤ 15 % des pertes, non adaptatif, gains < mise jamais célébrés, super-gadget = ≥ x25 garanti.
8. Multiplicateurs par pas de x0,1 (contrainte Stake). x0,8 et x1 retirés.
9. Exclus : mini-jeu d'adresse, jauge persistante entre manches, near-miss adaptatif, arme améliorée par la mise.

## Systèmes terminés
- Conception : vision, risques, core gameplay, mathématiques (étapes 1 à 4).
- Calculateur mathématique vérifié : RTP exact (fractions), contrôles du SDK Stake, poids entiers exacts, Monte Carlo.

## Systèmes incomplets / non commencés
- Étapes 5 à 12 du plan (gadgets et branches, bonus détaillé, boss, UI/caméra/son, analyse Stake complète, stack, architecture, roadmap).
- Aucun code de jeu (étape 13).
- Books et lookup tables Stake réels (phase 2 maths).

## Bugs connus
- Aucun (pas de code de jeu).

## Questions ouvertes (INFORMATION STAKE ENGINE REQUISE)
Voir `docs/STAKE_ENGINE_FAITS_VERIFIES.md` §6. Les plus bloquantes : plage de RTP autorisée, acceptation de 3 modes à coût 1,0, clés de `jurisdiction`.
Note : `stake-engine.com/docs` est inaccessible depuis l'environnement de développement actuel (proxy). Les faits proviennent des dépôts publics officiels `StakeEngine/math-sdk` et `StakeEngine/web-sdk`.

## Prochaine tâche
**Étapes 5 à 8** : les 15 gadgets et leurs branches d'animation (système INTRO/SETUP/ACTION/TWIST/IMPACT/REACTION/RESULT mappé sur les classes et scripts de §3.5-3.6), le BOSS FIGHT détaillé, le boss mascotte, puis UI + caméra + son.

## Commandes
```bash
# Rapport mathématique complet (RTP, contrôles SDK, poids entiers, Monte Carlo ~1 min)
python3 math/model/bad_boss_math.py

# Tableaux markdown utilisés dans docs/GDD_03_MATHEMATIQUES.md
python3 math/model/bad_boss_math.py --markdown
```
