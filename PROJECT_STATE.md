# PROJECT_STATE — BAD BOSS

_Dernière mise à jour : 2026-09-25, fin des étapes 5 à 8 (conception). Toujours aucun code de jeu._

## Résumé
Jeu instantané pour **Stake Engine**. Le joueur se venge, façon cartoon slapstick, de **Barnaby « B.B. » Bottomline**, un patron fictif.
- À chaque manche, trois **Rage Levels** sont proposés, chacun étant un vrai niveau de risque : GRUMPY, FURIOUS, UNHINGED. Chaque niveau affiche un gadget tiré au sort, cosmétique au sein de son niveau.
- Le résultat est pré-calculé par Stake Engine, et l'animation ne fait que le raconter : c'est un **arbre à divergence retardée**, dont les branches partagent un même début de 500 à 1 500 ms.
- Bonus **BOSS FIGHT** (1 manche sur 150) : échelle de x5 jusqu'à x200, x1 000 ou x5 000 selon le niveau.

## Stack
- **Pas encore choisie** (étape 10). Hypothèse de travail : 2D/2.5D (Spine ou spritesheets pré-rendues depuis la 3D), TypeScript, site statique.
- Référence officielle : web-sdk Stake (Svelte 5 + PixiJS 8), optionnel.
- Maths : calculateur Python (bibliothèque standard uniquement) qui lit `config/rage_levels.json`. La production finale se fera avec le math-sdk officiel.

## Architecture actuelle du dépôt
```
/README.md                                 présentation + index
/PROJECT_STATE.md                          ce fichier
/TODO.md                                   tâches par priorité
/config/rage_levels.json                   SOURCE DE VÉRITÉ des maths (TARGET_RTP, BOSS FIGHT, distributions)
/math/model/bad_boss_math.py               calculateur (RTP exact, contrôles SDK, séries, attentes, poids entiers)
/tools/check_gadget_catalogue.py           vérifie les règles de non-révélation du catalogue
/docs/GDD_01_VISION_ET_RISQUES.md          étapes 1-2
/docs/GDD_02_CORE_GAMEPLAY.md              étape 3 (verrouillée, v2)
/docs/GDD_03_MATHEMATIQUES.md              étape 4 (validée, v2 : nouvelle échelle du BOSS FIGHT)
/docs/GDD_04_ANIMATIONS_ET_GADGETS.md      étape 5 : système modulaire, bibliothèques, archétypes, MVP
/docs/GDD_04b_CATALOGUE_15_GADGETS.md      étape 5 : 15 gadgets × 10-11 branches (152), fiches de production
/docs/GDD_05_BOSS_FIGHT.md                 étape 6
/docs/GDD_06_BOSS_ET_UNIVERS.md            étape 7 : boss, cast, running gags, joueur, marque
/docs/GDD_07_UI_CAMERA_SON.md              étape 8 : UI mobile/desktop, juridiction, caméra, son
/docs/STAKE_ENGINE_FAITS_VERIFIES.md       faits Stake sourcés + informations requises
/docs/generated/MATH_REPORT.md             rapport mathématique GÉNÉRÉ (ne pas éditer)
```

## Décisions prises (verrouillées)
1. **RAGE LEVELS** : 3 bet modes Stake (`grumpy`, `furious`, `unhinged`, coût 1.0), même RTP, volatilités réellement différentes. Les gadgets sont cosmétiques au sein d'un niveau.
2. **TARGET_RTP = 0.965**, défini **une seule fois** dans `config/rage_levels.json`. Provisoire : validation Stake Engine requise avant publication.
3. **Max wins** : GRUMPY x200, FURIOUS x1 000, UNHINGED x5 000.
4. **BOSS FIGHT** : 1/150 dans chaque mode, x5 garanti, **pas un gros gain garanti** (30 à 55 % s'arrêtent à x5). Échelle x5 → x10 → x25 → x50 → x100 → x250 → x500 → x1 000 → x5 000, plafonnée par niveau (GRUMPY : … → x100 → x200). Entièrement dans le book, sans cash-out.
5. **UNHINGED garde un hit rate de 15,5 %** (provisoire). Levier documenté : une ligne x1,2 remonte le hit rate sans toucher σ.
6. **Animation** :
   - 7 phases (INTRO, SETUP, ACTION, TWIST, IMPACT, REACTION, RESULT) ;
   - tronc commun neutre jusqu'au point de divergence (D1), avec une boucle d'attente qui masque la latence ;
   - **règle des deux issues** et **équilibre des états** (vérifiés automatiquement) ;
   - « le corps de branche dit COMMENT, l'impact dit COMBIEN » (tiers T0.5 à T4 partagés) ;
   - sélection déterministe à partir du book (catégorie, rareté, graine).
7. **MVP** : SWIVEL SLINGSHOT (GRUMPY), TRAPDOOR EXPRESS (FURIOUS) et OFFICE ROCKET (UNHINGED). Cela fait 32 branches, dont 13 en P1.
8. **Identité** :
   - le boss Barnaby « B.B. » Bottomline (costume violet, cravate jaune à clip, la mèche, le monosourcil) ;
   - le mug indestructible, qui ne se fêle qu'au K.O. ;
   - Wendell le stagiaire et COO le pigeon ;
   - la sonnette DING, LE SIP, et le *Bossish* (aucun mot réel).
9. **Le joueur** n'est représenté que par ses mains (vue subjective).
10. **UI conditionnelle** : un module unique `FeatureGate` lit `jurisdiction`. Une fonctionnalité interdite **n'est pas construite**. Les clés sont vérifiées dans le web-sdk.
11. **Charte d'honnêteté** :
    - aucun chiffre avant REVEAL (sauf le palier acquis du BOSS FIGHT) ;
    - TEASE ≤ 15 % des pertes, jamais adaptatif ;
    - gains inférieurs à la mise jamais célébrés ;
    - iconographie réservée : or du mug = BOSS FIGHT, super-gadgets = ≥ x25, pièces = gains ;
    - provocations du boss jamais liées aux résultats.

## Systèmes terminés
- Conception complète des étapes 1 à 8.
- Calculateur mathématique v2 : source de vérité JSON, RTP exact, contrôles du SDK, **analyse des séries de pertes, temps d'attente (exacts et simulés)**, Monte Carlo, poids entiers exacts, rapport markdown généré.
- Catalogue des 15 gadgets : 152 branches, dont 66 pertes, avec durées normal/turbo, segments, assets, VFX, SFX, caméra, complexité et priorité.
- Vérificateur du catalogue `tools/check_gadget_catalogue.py` : règle des deux issues, équilibre des états, minimum de 4 pertes, catégories obligatoires, cohérence narratif / production. **Résultat actuel : OK (15 gadgets, 152 branches).**

## Systèmes incomplets / non commencés
- Étapes 9 à 12 : analyse Stake complète, choix de la stack, architecture, roadmap.
- Aucun code de jeu (étape 13).
- Books et lookup tables Stake réels (phase 2 des maths).
- Mesure réelle de P(gain | état D1) : nécessite le debug menu.

## Bugs connus
- Aucun (pas de code de jeu).

## Questions ouvertes (INFORMATION STAKE ENGINE REQUISE)
Voir `docs/STAKE_ENGINE_FAITS_VERIFIES.md` §6 (10 points). Les plus bloquantes :
- plage de RTP autorisée ;
- acceptation de 3 modes à coût 1,0 ;
- sémantique de `minimumRoundDuration` et de `disabledSlamstop` ;
- format de `/bet/event`.

Note : `stake-engine.com/docs` reste inaccessible depuis cet environnement (proxy). Les faits proviennent des dépôts publics officiels `StakeEngine/math-sdk` et `StakeEngine/web-sdk`.

## Prochaine tâche
**Étapes 9 à 12** :
- analyse Stake Engine complète (initialisation, reprise, erreurs, déploiement) ;
- choix de la stack ;
- architecture du projet (séquenceur data-driven, FeatureGate, state machine) ;
- roadmap MVP.

Ensuite seulement, l'étape 13 (code du prototype).

## Commandes
```bash
# Rapport mathématique texte (instantané, sans simulation)
python3 math/model/bad_boss_math.py --quick

# Rapport complet avec simulations (~20 s)
python3 math/model/bad_boss_math.py

# Vérifier le catalogue des gadgets (après toute modification de GDD_04b)
python3 tools/check_gadget_catalogue.py

# Régénérer le rapport markdown (après toute modification de config/rage_levels.json)
python3 math/model/bad_boss_math.py --write-report docs/generated/MATH_REPORT.md
```
