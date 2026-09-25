# LOOP x100 — BAD BOSS Phase 0

> Généré par `tools/loop-benchmark.mjs --count 100 --speed turbo` le 2026-09-25. Ne pas éditer.
> Chromium headless, rendu **logiciel SwiftShader** (pas de GPU), viewport 1100 × 760 : les FPS sont très pessimistes
> et **ne représentent pas un téléphone**. Ce qui compte ici : stabilité, absence d'erreur, mémoire stable.
> Présentation seule (`GameFlow.replayRound`), **aucune mise**, résultats tirés par le mock mathématique, 3 Rage Levels en alternance.

| Mesure | Valeur |
|---|---|
| Manches demandées / terminées / reveal atteint | 100 / 100 / 100 |
| Erreurs | aucune |
| Erreurs JS de page | aucune |
| Appels wallet pendant la boucle | 0 |
| Vitesse | turbo |
| Durée totale / moyenne par manche | 241.0 s / 2.41 s |
| FPS moyen / bas (p99) pendant la boucle | 11.2 / 5 |
| FPS au repos (READY, 3 s) | 15.6 |
| Temps CPU par image (mise à jour + rendu) moy / p95 / max | 0.92 / 1.5 / 11.4 ms |
| Particules actives max | 91 |
| Tas JS début → fin | 8.9 → 10.8 MB |
| Textures / mémoire texture estimée | 6 / 5.0 MB |
| Nœuds d'affichage | 131 |

Branches jouées : `RKT-BW` 1 · `RKT-L` 28 · `RKT-W` 4 · `SLG-BF` 2 · `SLG-BW` 1 · `SLG-L` 17 · `SLG-W` 14 · `TRP-BW` 1 · `TRP-L` 23 · `TRP-W` 9
