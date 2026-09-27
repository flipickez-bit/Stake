# LOOP x100 — BAD BOSS

> Généré par `tools/loop-benchmark.mjs --count 100 --speed turbo --sample 50 --level furious` le 2026-09-27. Ne pas éditer.
> Chromium headless, rendu **logiciel SwiftShader** (pas de GPU), viewport 1100 × 760 : les FPS sont très pessimistes
> et **ne représentent pas un téléphone**. Ce qui compte ici : stabilité, absence d'erreur, mémoire stable.
> Présentation seule (`GameFlow.replayRound`), **aucune mise**, résultats tirés par le mock mathématique, Rage Level FURIOUS, **3 gadgets par niveau** (triple A2 du mock, plans A → B → C à tour de rôle).

| Mesure | Valeur |
|---|---|
| Manches demandées / terminées / reveal atteint | 100 / 100 / 100 |
| Erreurs | aucune |
| Erreurs JS de page | aucune |
| Appels wallet pendant la boucle | 0 |
| Vitesse | turbo |
| Durée totale / moyenne par manche | 225.3 s / 2.25 s |
| FPS moyen / bas (p99) pendant la boucle | 7.3 / 2.7 |
| FPS au repos (READY, 3 s) | 7.3 |
| Temps CPU par image (mise à jour + rendu) moy / p95 / max | 1.07 / 2.3 / 18.9 ms |
| Particules actives max | 104 |
| Tas JS début → fin (brut) | 9.3 → 10.7 MB |
| Textures / mémoire texture estimée | 16 / 34.7 MB |
| Nœuds d'affichage | 389 |

Branches jouées : `BWL-B1` 5 · `BWL-B4` 1 · `BWL-H1` 3 · `BWL-P1` 2 · `BWL-S1` 15 · `BWL-S2` 5 · `BWL-S3` 2 · `DOM-C1` 6 · `DOM-C2` 2 · `DOM-C4` 2 · `DOM-C5` 1 · `DOM-D1` 3 · `DOM-D2` 5 · `DOM-S1` 4 · `DOM-S2` 6 · `DOM-W1` 3 · `DOM-W2` 1 · `TRP-A1` 3 · `TRP-A2` 4 · `TRP-A3` 1 · `TRP-A4` 2 · `TRP-B1` 4 · `TRP-B2` 3 · `TRP-B3` 1 · `TRP-B4` 5 · `TRP-B5` 1 · `TRP-C1` 2 · `TRP-C2` 7 · `TRP-C3` 1

## Mémoire tous les 50 rounds

| Round | Tas brut (Mo) | Tas après GC forcé (Mo) | Nœuds d'affichage | Textures | Temps (s) |
|---:|---:|---:|---:|---:|---:|
| 0 | 9.3 | 8.7 | 280 | 15 | 0 |
| 50 | 11.9 | 10 | 389 | 16 | 115.2 |
| 100 | 13.1 | 10.2 | 389 | 16 | 225.3 |

Pente après chauffe (à partir du round 0, moindres carrés) : tas brut **3.800 Mo / 100 rounds**, tas après GC **1.500 Mo / 100 rounds**.
