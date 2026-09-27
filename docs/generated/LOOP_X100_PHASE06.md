# LOOP x100 — BAD BOSS

> Généré par `tools/loop-benchmark.mjs --count 100 --speed turbo` le 2026-09-27. Ne pas éditer.
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
| Durée totale / moyenne par manche | 253.9 s / 2.54 s |
| FPS moyen / bas (p99) pendant la boucle | 6.9 / 3.2 |
| FPS au repos (READY, 3 s) | 11.1 |
| Temps CPU par image (mise à jour + rendu) moy / p95 / max | 1.01 / 1.8 / 6.3 ms |
| Particules actives max | 94 |
| Tas JS début → fin (brut) | 11.4 → 11.9 MB |
| Textures / mémoire texture estimée | 18 / 27.5 MB |
| Nœuds d'affichage | 314 |

Branches jouées : `RKT-A1` 7 · `RKT-A2` 2 · `RKT-B1` 6 · `RKT-B3` 4 · `RKT-B4` 2 · `RKT-B9` 3 · `RKT-C1` 5 · `RKT-C3` 4 · `SLG-A1` 3 · `SLG-A4` 4 · `SLG-A6` 1 · `SLG-B1` 4 · `SLG-B2` 10 · `SLG-C1` 4 · `SLG-C2` 4 · `SLG-C3` 1 · `SLG-C4` 1 · `SLG-D1` 1 · `SLG-D2` 1 · `TRP-A1` 1 · `TRP-A2` 2 · `TRP-A4` 3 · `TRP-B1` 4 · `TRP-B2` 2 · `TRP-B3` 3 · `TRP-B4` 6 · `TRP-B5` 2 · `TRP-C1` 4 · `TRP-C2` 6
