# PRODUCTION 3 GADGETS — performances (généré)

> Généré par `node tools/p3-perf.mjs --rounds 9` le 2026-09-27. Ne pas éditer.
> Build de production (Mock RGS, 3 gadgets par Rage Level). LOOP : présentation seule, aucune mise, vitesse normale, 3 niveaux en alternance, plans A → B → C (les 9 gadgets).
> **Chromium headless + SwiftShader (rendu LOGICIEL)** : les images/s sont très pessimistes et ne représentent PAS un téléphone réel. Les mesures de mémoire, d'appels de dessin et de particules, elles, sont indépendantes du GPU.
> Mémoire des textures : estimation (largeur × hauteur × 4 octets par texture gérée par Pixi, plus les tampons d'affichage), sans les mipmaps.

| Mesure | Desktop 1100 × 760 | Téléphone 360 × 640 (DPR 2) | Téléphone 390 × 844 (DPR 2) | Téléphone 430 × 932 (DPR 2) |
|---|---:|---:|---:|---:|
| Chargement → READY | 4.4 s | 3.3 s | 2.3 s | 2.4 s |
| Scène prête (livres de base) | 2925 ms | 1514 ms | 1199 ms | 1233 ms |
| Livres différés arrivés (FURIOUS, UNHINGED, plans) | 2989 ms | 1610 ms | 1256 ms | 1282 ms |
| Mémoire des textures (au repos → après la LOOP) | 32.7 Mo → 36.7 Mo | 32.8 Mo → 36.8 Mo | 35.1 Mo → 39.1 Mo | 36.5 Mo → 40.5 Mo |
| Textures gérées | 15 → 17 | 15 → 17 | 15 → 17 | 15 → 17 |
| Objets d'affichage | 280 → 369 | 280 → 430 | 280 → 376 | 280 → 428 |
| Tas JS (repos → après) | 9.3 → 10.1 Mo | 9 → 9.9 Mo | 9.9 → 10 Mo | 9 → 12.1 Mo |
| Appels de dessin / image, choix (moy. / p95 / max) | 8 / 8 / 8 | 8 / 8 / 8 | 8 / 8 / 8 | 8 / 8 / 8 |
| Appels de dessin / image, manches (moy. / p95 / max) | 7.1 / 8 / 10 | 6.7 / 8 / 10 | 6.8 / 8 / 10 | 7 / 10 / 10 |
| Particules actives max | 73 | 134 | 80 | 132 |
| Images/s pendant les manches (moy. / 1 % bas) — SwiftShader | 8.8 / 2.6 | 10.5 / 2 | 8.5 / 1.6 | 6.8 / 1.2 |
| Temps CPU par image (moy. / p95 / max) | 1.16 / 3.3 / 7.3 ms | 1.05 / 2.2 / 8.2 ms | 1.03 / 2.2 / 6.1 ms | 1.12 / 2.7 / 5.7 ms |
| Manches terminées / reveal / erreurs | 9 / 9 / 0 | 9 / 9 / 0 | 9 / 9 / 0 | 9 / 9 / 0 |
| Appels wallet pendant la LOOP | 0 | 0 | 0 | 0 |

Branches jouées (desktop) : `BWL-S2` 1 · `COP-L2` 1 · `DOM-C1` 1 · `ESP-R1` 1 · `HVAC-T1` 1 · `RKT-C4` 1 · `SAFE-L3` 1 · `SLG-B2` 1 · `TRP-C1` 1

