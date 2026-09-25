# PROJECT_STATE — BAD BOSS

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

_Dernière mise à jour : 2026-09-25, fin des étapes 9 à 12. **Arrêt demandé** : en attente du feu vert pour coder le MVP. Toujours aucun code de jeu, aucun asset définitif._

## Résumé
Jeu instantané pour **Stake Engine**. Le joueur se venge, façon cartoon slapstick, de Barnaby « B.B. » Bottomline, un patron fictif.
- Trois **Rage Levels** : GRUMPY, FURIOUS, UNHINGED. Ce sont 3 bet modes, même RTP, volatilités différentes, chacun avec un gadget cosmétique.
- Le résultat vient d'un book Stake. L'animation, un arbre à divergence retardée, le raconte de façon **déterministe** : reprise et replay identiques.
- Bonus **BOSS FIGHT** (1 manche sur 150), de x5 jusqu'à x200, x1 000 ou x5 000 selon le niveau.

## Stack (décidée à l'étape 10, versions à figer au scaffold)
- **Svelte 5** (UI HTML) + **PixiJS 8** (scène 2.5D) + **TypeScript strict**, en SPA **Vite** (`base: './'`), sans SvelteKit ni monorepo.
- **Spine 4.x** pour les personnages, derrière une interface `Rig`. `PlaceholderRig` pour le MVP. ❗ Licence Spine Editor à acheter : question commerciale.
- Timeline, physique légère (débris) et particules : **maison**, déterministes, en pools.
- **Howler** pour l'audio. Machine à états **maison**.
- Réseau : client npm **`stake-engine`** 0.1.32 + `StakeRgsAdapter` très fin. `MockRgs` pour le développement et les tests.
- Tests : Vitest + Playwright. Maths : calculateur Python (modèle) + **math-sdk officiel** (production, phase 2).

## Architecture du dépôt
```
/README.md · PROJECT_STATE.md · TODO.md
/TECH_ARCHITECTURE.md                    étapes 10-11 : stack, architecture, GameFlow, modèle d'animation, DEV PANEL
/MVP_ROADMAP.md                          étape 12 : phases 0-9, portes, budgets, matrice d'appareils
/config/rage_levels.json                 SOURCE DE VÉRITÉ des maths (+ variante expérimentale désactivée)
/math/model/bad_boss_math.py             calculateur (RTP exact, contrôles SDK, séries, attentes, variantes)
/tools/check_gadget_catalogue.py         contrôle de non-révélation du catalogue
/docs/GDD_01 … GDD_07, GDD_04b           game design (étapes 1-8)
/docs/STAKE_ENGINE_FAITS_VERIFIES.md     étape 9 : analyse technique Stake (✅ / 🟡 / ❓)
/docs/generated/MATH_REPORT.md           rapport généré (ne pas éditer)
```
Architecture de code **prévue** (non créée) : `TECH_ARCHITECTURE.md` §2.2.

## Décisions verrouillées
1. **RAGE LEVELS** : 3 modes Stake (`grumpy`, `furious`, `unhinged`, coût 1.0), même RTP. Les gadgets sont cosmétiques au sein d'un niveau.
2. **`TARGET_RTP = 0.965`**, défini seulement dans `config/rage_levels.json`. Validation Stake requise avant publication.
3. **Max wins** : x200, x1 000, x5 000. **UNHINGED** : σ ≈ 11,6 et hit rate ≈ 15,5 % **conservés**, pas de x1,2 (variante expérimentale **désactivée**, activable par `--variant unhinged_x12`).
4. **BOSS FIGHT** : 1/150, échelle x5 → x5 000 plafonnée par niveau. Baisse de σ acceptée, sans compensation. Entièrement dans le book, sans cash-out.
5. **MVP** : SWIVEL SLINGSHOT (GRUMPY), TRAPDOOR EXPRESS (FURIOUS), OFFICE ROCKET (UNHINGED). Affectation documentée **conservée** pour une raison de design : lisibilité du risque sur la carte (GDD_04 §5.8).
6. **Nom** : BAD BOSS = *working title*, clearance de marque requise. Pas de branding final pour l'instant.
7. **Réseau** : on n'écrit pas notre propre client. `stake-engine` (npm) derrière un adapter : codes d'erreur, délais, réinstanciation, replay.
8. **Fin de manche** : modes en `auto_close_disabled=True`, `end-round` au reveal, et repli si la manche est déjà fermée. ❓ Sémantique à confirmer.
9. **Reprise** : reconstruction depuis `round.state` (rattrapage en turbo), **jamais** de nouveau `Play`. **Aucune dépendance à `/bet/event`.**
10. **Déterminisme** : graine de présentation écrite dans le book ; `Math.random()` interdit dans la présentation ; pas fixe pour les particules et débris ; blessures du boss seulement en READY.
11. **Timing** : vitesse, skip / slamstop et durée minimale (READY_GATE) sont **trois mécanismes séparés**, sans modifier les animations.
12. **UI conditionnelle** : `FeatureGate`. Une fonctionnalité interdite n'est pas construite.
13. **DEV PANEL** obligatoire dès la phase 0 : forçages complets, reconnexion et reprise, replay, boucle ×20 avec sondes.

## Systèmes terminés
- Conception des étapes 1 à 12 (GDD, analyse Stake, architecture, roadmap).
- Calculateur mathématique v3 : source de vérité JSON, variantes expérimentales, séries de pertes, temps d'attente, poids entiers exacts.
- Contrôleur du catalogue de gadgets : 15 gadgets, 152 branches, OK.

## Systèmes non commencés
- **Tout le code du jeu** (phase 0 et suivantes de `MVP_ROADMAP.md`).
- Books et lookup tables officiels (math-sdk, phase 2).
- Assets définitifs (après la porte G2) et les 12 gadgets hors MVP.

## Bugs connus
- Aucun (pas de code de jeu).

## Questions ouvertes (INFORMATION STAKE ENGINE REQUISE)
`docs/STAKE_ENGINE_FAITS_VERIFIES.md` §11 (16 points). Les plus structurants :
- sémantique de `autoEndRoundDisabled` ;
- statut officiel du paquet `stake-engine` ;
- format de `round.state` et du corps d'erreur ;
- contrat du replay ;
- unité et point de départ de `minimumRoundDuration` ;
- portée de `disabledSlamstop` ;
- contrat de `/bet/event` ;
- plage de RTP autorisée.

## Prochaine tâche
**Attendre le feu vert CODE.** Ensuite : `MVP_ROADMAP.md` §7, en commençant par la phase 0 (scaffold, MockRgs, GameFlow, DEV PANEL, **lien de préversion jouable sur téléphone**).

## Commandes
```bash
python3 math/model/bad_boss_math.py --quick                                   # rapport instantané
python3 math/model/bad_boss_math.py                                           # avec simulations (~20 s)
python3 math/model/bad_boss_math.py --write-report docs/generated/MATH_REPORT.md
python3 math/model/bad_boss_math.py --list-variants                           # variantes expérimentales
python3 math/model/bad_boss_math.py --quick --variant unhinged_x12            # TEST uniquement
python3 tools/check_gadget_catalogue.py                                       # non-révélation du catalogue
```
