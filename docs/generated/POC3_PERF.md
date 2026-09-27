# POC 3 PLANS : performances (2026-09-27)

Généré par `node tools/poc-perf.mjs` : 9 manches réelles par build (2e mesure de chaque build, en alternance) (Mock RGS, vitesse normale, plans A → B → C en boucle pour le POC).

> Chromium headless + SwiftShader (rendu LOGICIEL, 1100 × 760) : les images/s ne représentent pas un téléphone réel ; seules les DIFFÉRENCES entre les deux colonnes sont informatives. Les durées de manche incluent la latence simulée du Mock RGS (120 ms par appel).

| Mesure | Jeu normal (GRUMPY) | POC 3 PLANS |
|---|---|---|
| Initialisation de la scène (atlas compris) | 1469 ms | 1436 ms |
| Mémoire des textures (estimation, tampons compris) | 30.7 Mo | 33.0 Mo |
| Textures | 14 | 15 |
| Objets d’affichage | 228 | 241 |
| Tas JS au repos → après les manches | 9.2 Mo → 12.4 Mo | 12.2 Mo → 11.9 Mo |
| Images/s pendant les manches (moy. / 1 % bas) | 9 / 2 | 7 / 2 |
| Temps CPU par image (moy. / p95 / max) | 1.3 / 2.9 / 7.2 ms | 1.3 / 3.2 / 7.2 ms |
| Particules max | 55 | 41 |
| Manche FIRE → READY, plan A (lance-pierre) | 5.08 s (9) | 4.74 s (3) |
| Manche FIRE → READY, plan B (prototype) | — | 7.04 s (3) |
| Manche FIRE → READY, plan C (prototype) | — | 4.08 s (3) |
| Replis de contenu (erreurs de séquence) | 0 | 0 |
