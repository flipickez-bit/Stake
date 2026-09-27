# PRODUCTION 3 GADGETS — performances (généré)

> Généré par `node tools/p3-perf.mjs --rounds 9` le 2026-09-27. Ne pas éditer.
> Build de production (Mock RGS, 3 gadgets par Rage Level). LOOP : présentation seule, aucune mise, vitesse normale, 3 niveaux en alternance, plans A → B → C (les 9 gadgets).
> **Chromium headless + SwiftShader (rendu LOGICIEL)** : les images/s sont très pessimistes et ne représentent PAS un téléphone réel. Les mesures de mémoire, d'appels de dessin et de particules, elles, sont indépendantes du GPU.
> Mémoire des textures : estimation (largeur × hauteur × 4 octets par texture gérée par Pixi, plus les tampons d'affichage), sans les mipmaps.

| Mesure | Desktop 1100 × 760 | Téléphone 360 × 640 (DPR 2) | Téléphone 390 × 844 (DPR 2) | Téléphone 430 × 932 (DPR 2) |
|---|---:|---:|---:|---:|
| Chargement → READY | 4.4 s | 2.2 s | 2.2 s | 2.4 s |
| Scène prête (livres de base) | 2894 ms | 1209 ms | 1207 ms | 1213 ms |
| Livres différés arrivés (FURIOUS, UNHINGED, plans) | 2958 ms | 1264 ms | 1276 ms | 1264 ms |
| Mémoire des textures (au repos → après la LOOP) | 32.7 Mo → 36.7 Mo | 32.8 Mo → 36.8 Mo | 35.6 Mo → 39.6 Mo | 37.5 Mo → 41.5 Mo |
| Textures gérées | 15 → 17 | 15 → 17 | 15 → 17 | 15 → 17 |
| Objets d'affichage | 280 → 357 | 280 → 344 | 280 → 448 | 280 → 342 |
| Tas JS (repos → après) | 8.9 → 10.4 Mo | 10.6 → 12.2 Mo | 11.9 → 10.4 Mo | 9.2 → 10.6 Mo |
| Appels de dessin / image, choix (moy. / p95 / max) | 8 / 8 / 8 | 8 / 8 / 8 | 8 / 8 / 8 | 8 / 8 / 8 |
| Appels de dessin / image, manches (moy. / p95 / max) | 6.9 / 9 / 10 | 6.8 / 8 / 10 | 6.8 / 8 / 10 | 7 / 8 / 10 |
| Particules actives max | 61 | 48 | 152 | 46 |
| Images/s pendant les manches (moy. / 1 % bas) — SwiftShader | 12 / 5 | 13.4 / 3.2 | 8 / 1.5 | 6.2 / 1.1 |
| Temps CPU par image (moy. / p95 / max) | 0.97 / 1.9 / 10.3 ms | 0.92 / 1.8 / 7.3 ms | 1.07 / 2.5 / 6.4 ms | 1.09 / 2.2 / 7.9 ms |
| Manches terminées / reveal / erreurs | 9 / 9 / 0 | 9 / 9 / 0 | 9 / 9 / 0 | 9 / 9 / 0 |
| Appels wallet pendant la LOOP | 0 | 0 | 0 | 0 |

Branches jouées (desktop) : `BWL-P2` 1 · `COP-J2` 1 · `DOM-W1` 1 · `ESP-R2` 1 · `HVAC-G1` 1 · `RKT-C4` 1 · `SAFE-S2` 1 · `SLG-C1` 1 · `TRP-B2` 1

