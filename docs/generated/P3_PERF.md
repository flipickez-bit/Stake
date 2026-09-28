# PRODUCTION 3 GADGETS — performances (généré)

> Généré par `node tools/p3-perf.mjs --rounds 9` le 2026-09-28. Ne pas éditer.
> Build de production (Mock RGS, 3 gadgets par Rage Level). LOOP : présentation seule, aucune mise, vitesse normale, 3 niveaux en alternance, plans A → B → C (les 9 gadgets).
> **Chromium headless + SwiftShader (rendu LOGICIEL)** : les images/s sont très pessimistes et ne représentent PAS un téléphone réel. Les mesures de mémoire, d'appels de dessin et de particules, elles, sont indépendantes du GPU.
> Mémoire des textures : estimation (largeur × hauteur × 4 octets par texture gérée par Pixi, plus les tampons d'affichage), sans les mipmaps.

| Mesure | Desktop 1100 × 760 | Téléphone 360 × 640 (DPR 2) | Téléphone 390 × 844 (DPR 2) | Téléphone 430 × 932 (DPR 2) |
|---|---:|---:|---:|---:|
| Chargement → READY | 4.8 s | 2.5 s | 2.4 s | 2.5 s |
| Scène prête (livres de base) | 3126 ms | 1336 ms | 1266 ms | 1259 ms |
| Livres différés arrivés (FURIOUS, UNHINGED, plans) | 3196 ms | 1421 ms | 1323 ms | 1340 ms |
| Mémoire des textures (au repos → après la LOOP) | 32.7 Mo → 36.7 Mo | 32.8 Mo → 36.8 Mo | 35.6 Mo → 39.6 Mo | 37.5 Mo → 41.5 Mo |
| Textures gérées | 15 → 17 | 15 → 17 | 15 → 17 | 15 → 17 |
| Objets d'affichage | 280 → 356 | 280 → 355 | 280 → 339 | 280 → 335 |
| Tas JS (repos → après) | 10.1 → 10.3 Mo | 9.9 → 10.3 Mo | 9.5 → 11.1 Mo | 9.8 → 10.7 Mo |
| Appels de dessin / image, choix (moy. / p95 / max) | 8 / 8 / 8 | 8 / 8 / 8 | 8 / 8 / 8 | 8 / 8 / 8 |
| Appels de dessin / image, manches (moy. / p95 / max) | 6.9 / 8 / 10 | 7.2 / 10 / 10 | 7.1 / 8 / 10 | 6.9 / 8 / 10 |
| Particules actives max | 60 | 59 | 43 | 39 |
| Images/s pendant les manches (moy. / 1 % bas) — SwiftShader | 12.3 / 6 | 11.9 / 2.6 | 8.2 / 1.4 | 6.8 / 1.3 |
| Temps CPU par image (moy. / p95 / max) | 1.3 / 2.3 / 7.3 ms | 1.45 / 3.2 / 8.7 ms | 1.26 / 2.8 / 5.6 ms | 1.4 / 3.8 / 7.9 ms |
| Manches terminées / reveal / erreurs | 9 / 9 / 0 | 9 / 9 / 0 | 9 / 9 / 0 | 9 / 9 / 0 |
| Appels wallet pendant la LOOP | 0 | 0 | 0 | 0 |

Branches jouées (desktop) : `BWL-H1` 1 · `COP-J2` 1 · `DOM-S1` 1 · `ESP-R2` 1 · `HVAC-T1` 1 · `RKT-A1` 1 · `SAFE-D2` 1 · `SLG-C3` 1 · `TRP-B5` 1

