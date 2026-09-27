# LOOP x100 — BAD BOSS

> Généré par `tools/loop-benchmark.mjs --count 100 --speed turbo --sample 50 --level unhinged` le 2026-09-27. Ne pas éditer.
> Chromium headless, rendu **logiciel SwiftShader** (pas de GPU), viewport 1100 × 760 : les FPS sont très pessimistes
> et **ne représentent pas un téléphone**. Ce qui compte ici : stabilité, absence d'erreur, mémoire stable.
> Présentation seule (`GameFlow.replayRound`), **aucune mise**, résultats tirés par le mock mathématique, Rage Level UNHINGED, **3 gadgets par niveau** (triple A2 du mock, plans A → B → C à tour de rôle).

| Mesure | Valeur |
|---|---|
| Manches demandées / terminées / reveal atteint | 100 / 100 / 100 |
| Erreurs | aucune |
| Erreurs JS de page | aucune |
| Appels wallet pendant la boucle | 0 |
| Vitesse | turbo |
| Durée totale / moyenne par manche | 249.5 s / 2.50 s |
| FPS moyen / bas (p99) pendant la boucle | 6 / 2.1 |
| FPS au repos (READY, 3 s) | 12.1 |
| Temps CPU par image (mise à jour + rendu) moy / p95 / max | 1.26 / 3.1 / 15.6 ms |
| Particules actives max | 145 |
| Tas JS début → fin (brut) | 11.5 → 11.1 MB |
| Textures / mémoire texture estimée | 16 / 34.7 MB |
| Nœuds d'affichage | 441 |

Branches jouées : `HVAC-G1` 10 · `HVAC-G2` 2 · `HVAC-S1` 4 · `HVAC-S2` 2 · `HVAC-S3` 1 · `HVAC-T1` 9 · `HVAC-T2` 1 · `HVAC-W1` 4 · `RKT-A1` 9 · `RKT-A2` 3 · `RKT-B1` 4 · `RKT-B3` 8 · `RKT-B4` 1 · `RKT-B7` 1 · `RKT-C1` 2 · `RKT-C3` 5 · `RKT-C4` 1 · `SAFE-D1` 1 · `SAFE-D2` 9 · `SAFE-D3` 2 · `SAFE-D5` 1 · `SAFE-L1` 7 · `SAFE-L2` 1 · `SAFE-L3` 3 · `SAFE-S1` 8 · `SAFE-S3` 1

## Mémoire tous les 50 rounds

| Round | Tas brut (Mo) | Tas après GC forcé (Mo) | Nœuds d'affichage | Textures | Temps (s) |
|---:|---:|---:|---:|---:|---:|
| 0 | 11.5 | 8.8 | 280 | 15 | 0 |
| 50 | 14.6 | 10.5 | 441 | 16 | 125.4 |
| 100 | 14.6 | 10.7 | 441 | 16 | 249.5 |

Pente après chauffe (à partir du round 0, moindres carrés) : tas brut **3.100 Mo / 100 rounds**, tas après GC **1.900 Mo / 100 rounds**.
