# LOOP x100 — BAD BOSS

> Généré par `tools/loop-benchmark.mjs --count 100 --speed turbo` le 2026-09-26. Ne pas éditer.
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
| Durée totale / moyenne par manche | 246.2 s / 2.46 s |
| FPS moyen / bas (p99) pendant la boucle | 16.9 / 7.5 |
| FPS au repos (READY, 3 s) | 21.4 |
| Temps CPU par image (mise à jour + rendu) moy / p95 / max | 0.77 / 1.2 / 7.6 ms |
| Particules actives max | 137 |
| Tas JS début → fin (brut) | 8.3 → 11.8 MB |
| Textures / mémoire texture estimée | 6 / 5.0 MB |
| Nœuds d'affichage | 163 |

Branches jouées : `RKT-A1` 3 · `RKT-A2` 1 · `RKT-A3` 2 · `RKT-B1` 6 · `RKT-B2` 1 · `RKT-B3` 7 · `RKT-B9` 6 · `RKT-C1` 2 · `RKT-C3` 3 · `RKT-C4` 2 · `SLG-A1` 4 · `SLG-A2` 4 · `SLG-A4` 4 · `SLG-A6` 1 · `SLG-B2` 6 · `SLG-C1` 4 · `SLG-C2` 4 · `SLG-C3` 3 · `SLG-D2` 4 · `TRP-A1` 2 · `TRP-A4` 3 · `TRP-B1` 4 · `TRP-B2` 2 · `TRP-B3` 5 · `TRP-B4` 4 · `TRP-B5` 3 · `TRP-C1` 1 · `TRP-C2` 7 · `TRP-C3` 2
