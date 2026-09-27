# LOOP x100 — BAD BOSS

> Généré par `tools/loop-benchmark.mjs --count 100 --speed turbo --sample 50 --level grumpy` le 2026-09-27. Ne pas éditer.
> Chromium headless, rendu **logiciel SwiftShader** (pas de GPU), viewport 1100 × 760 : les FPS sont très pessimistes
> et **ne représentent pas un téléphone**. Ce qui compte ici : stabilité, absence d'erreur, mémoire stable.
> Présentation seule (`GameFlow.replayRound`), **aucune mise**, résultats tirés par le mock mathématique, Rage Level GRUMPY, **3 gadgets par niveau** (triple A2 du mock, plans A → B → C à tour de rôle).

| Mesure | Valeur |
|---|---|
| Manches demandées / terminées / reveal atteint | 100 / 100 / 100 |
| Erreurs | aucune |
| Erreurs JS de page | aucune |
| Appels wallet pendant la boucle | 0 |
| Vitesse | turbo |
| Durée totale / moyenne par manche | 251.9 s / 2.52 s |
| FPS moyen / bas (p99) pendant la boucle | 5.8 / 2.2 |
| FPS au repos (READY, 3 s) | 7.4 |
| Temps CPU par image (mise à jour + rendu) moy / p95 / max | 1.13 / 2.7 / 19.4 ms |
| Particules actives max | 226 |
| Tas JS début → fin (brut) | 9.8 → 10.8 MB |
| Textures / mémoire texture estimée | 15 / 32.7 MB |
| Nœuds d'affichage | 506 |

Branches jouées : `COP-B2` 3 · `COP-C1` 1 · `COP-J1` 9 · `COP-J2` 2 · `COP-L1` 5 · `COP-L2` 1 · `COP-L4` 7 · `COP-L5` 1 · `COP-W1` 1 · `COP-W2` 3 · `ESP-D1` 1 · `ESP-D2` 4 · `ESP-F1` 4 · `ESP-F2` 3 · `ESP-J1` 6 · `ESP-J4` 2 · `ESP-R1` 2 · `ESP-R2` 2 · `ESP-S1` 1 · `ESP-S2` 8 · `SLG-A1` 1 · `SLG-A2` 2 · `SLG-A4` 7 · `SLG-B1` 2 · `SLG-B2` 5 · `SLG-C2` 8 · `SLG-C3` 3 · `SLG-C4` 1 · `SLG-D1` 1 · `SLG-D2` 4

## Mémoire tous les 50 rounds

| Round | Tas brut (Mo) | Tas après GC forcé (Mo) | Nœuds d'affichage | Textures | Temps (s) |
|---:|---:|---:|---:|---:|---:|
| 0 | 9.8 | 8.8 | 280 | 15 | 0 |
| 50 | 13 | 10.2 | 506 | 15 | 129.4 |
| 100 | 13.2 | 10.3 | 506 | 15 | 251.9 |

Pente après chauffe (à partir du round 0, moindres carrés) : tas brut **3.400 Mo / 100 rounds**, tas après GC **1.500 Mo / 100 rounds**.
