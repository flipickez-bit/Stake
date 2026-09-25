# LOOP x500 — BAD BOSS

> Généré par `tools/loop-benchmark.mjs --count 500 --speed turbo --sample 50` le 2026-09-25. Ne pas éditer.
> Chromium headless, rendu **logiciel SwiftShader** (pas de GPU), viewport 1100 × 760 : les FPS sont très pessimistes
> et **ne représentent pas un téléphone**. Ce qui compte ici : stabilité, absence d'erreur, mémoire stable.
> Présentation seule (`GameFlow.replayRound`), **aucune mise**, résultats tirés par le mock mathématique, 3 Rage Levels en alternance.

| Mesure | Valeur |
|---|---|
| Manches demandées / terminées / reveal atteint | 500 / 500 / 500 |
| Erreurs | aucune |
| Erreurs JS de page | aucune |
| Appels wallet pendant la boucle | 0 |
| Vitesse | turbo |
| Durée totale / moyenne par manche | 1202.3 s / 2.40 s |
| FPS moyen / bas (p99) pendant la boucle | 8.9 / 3.2 |
| FPS au repos (READY, 3 s) | 14.1 |
| Temps CPU par image (mise à jour + rendu) moy / p95 / max | 0.97 / 1.7 / 36.3 ms |
| Particules actives max | 149 |
| Tas JS début → fin (brut) | 8.8 → 9.8 MB |
| Textures / mémoire texture estimée | 6 / 5.0 MB |
| Nœuds d'affichage | 131 |

Branches jouées : `RKT-BF` 1 · `RKT-BW` 6 · `RKT-L` 137 · `RKT-W` 22 · `SLG-BW` 3 · `SLG-L` 66 · `SLG-W` 98 · `TRP-BW` 3 · `TRP-L` 120 · `TRP-W` 44

## Mémoire tous les 50 rounds

| Round | Tas brut (Mo) | Tas après GC forcé (Mo) | Nœuds d'affichage | Textures | Temps (s) |
|---:|---:|---:|---:|---:|---:|
| 0 | 8.8 | 6.6 | 131 | 6 | 0 |
| 50 | 9.6 | 8.2 | 131 | 6 | 116.9 |
| 100 | 10.5 | 8.3 | 131 | 6 | 233 |
| 150 | 10.4 | 8.4 | 131 | 6 | 352.6 |
| 200 | 10.7 | 8.4 | 131 | 6 | 467.3 |
| 250 | 10.5 | 8.4 | 131 | 6 | 582.7 |
| 300 | 11.4 | 8.6 | 131 | 6 | 708 |
| 350 | 10.4 | 8.6 | 131 | 6 | 827.8 |
| 400 | 10.9 | 8.6 | 131 | 6 | 945.3 |
| 450 | 11 | 8.5 | 131 | 6 | 1075.1 |
| 500 | 11.1 | 8.7 | 131 | 6 | 1202.3 |

Pente après chauffe (à partir du round 100, moindres carrés) : tas brut **0.150 Mo / 100 rounds**, tas après GC **0.083 Mo / 100 rounds**.
