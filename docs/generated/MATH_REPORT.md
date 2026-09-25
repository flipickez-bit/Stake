# BAD BOSS — rapport mathematique genere

> **Fichier genere** par `python3 math/model/bad_boss_math.py --write-report docs/generated/MATH_REPORT.md`. Ne pas modifier a la main : modifier `config/rage_levels.json` puis regenerer.
> RTP cible : 96.50 % (PROVISOIRE - validation Stake Engine requise avant publication).

## 1. Synthese

| Indicateur | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| RTP (exact) | 96.5000 % | 96.5000 % | 96.5000 % |
| House edge | 3.50 % | 3.50 % | 3.50 % |
| P(perte x0) | 41.86 % | 66.77 % | 84.46 % |
| Hit rate (paiement > 0) | 58.14 % (1 / 2) | 33.23 % (1 / 3) | 15.54 % (1 / 6) |
| P(paiement >= mise) | 42.14 % | 25.23 % | 15.54 % |
| Ecart-type (sigma, en mises) | 2.68 | 6.67 | 11.59 |
| Variance | 7.2 | 44.5 | 134.2 |
| Mediane | x0.5 | x0 | x0 |
| Max win | x200 | x1000 | x5000 |
| Frequence max win | 1 / 17 637 | 1 / 64 133 | 1 / 549 715 |
| BOSS FIGHT | 1 / 150 | 1 / 150 | 1 / 150 |
| EV d'un BOSS FIGHT | x14.58 | x24.21 | x35.50 |
| Part RTP du BOSS FIGHT | 9.72 % | 16.14 % | 23.67 % |
| CVaR 99.9 % (limite SDK 800) | 35.4 | 86.7 | 182.7 |
| ETL40 (limite SDK 0.9) | 0.042 | 0.193 | 0.402 |
| P(>= x5000) (limite SDK 1 %) | 0.00e+00 | 0.00e+00 | 1.82e-06 |

## 2. Distributions detaillees

### GRUMPY (volatilite basse), max x200

BOSS FIGHT : EV = 14.5805x, frequence 1 / 150, part de RTP = 9.720 %

| Source | Multiplicateur | Part de RTP | Probabilite | Frequence |
|---|---|---|---|---|
| base | x0.5 | 8.000 % | 16.0000 % | 1 / 6 |
| base | x1.2 *(equilibre)* | 20.280 % | 16.8997 % | 1 / 6 |
| base | x1.5 | 18.000 % | 12.0000 % | 1 / 8 |
| base | x2 | 14.000 % | 7.0000 % | 1 / 14 |
| base | x3 | 10.000 % | 3.3333 % | 1 / 30 |
| base | x5 | 8.000 % | 1.6000 % | 1 / 62 |
| base | x10 | 5.000 % | 0.5000 % | 1 / 200 |
| base | x25 | 3.500 % | 0.1400 % | 1 / 714 |
| BOSS FIGHT | x5 | 1.833 % | 0.3667 % | 1 / 273 |
| BOSS FIGHT | x10 | 1.650 % | 0.1650 % | 1 / 606 |
| BOSS FIGHT | x25 | 2.025 % | 0.0810 % | 1 / 1 235 |
| BOSS FIGHT | x50 | 1.755 % | 0.0351 % | 1 / 2 849 |
| BOSS FIGHT | x100 | 1.323 % | 0.0132 % | 1 / 7 559 |
| BOSS FIGHT | x200 | 1.134 % | 0.0057 % | 1 / 17 637 |
| — | **x0 (perte)** | 0 % | **41.8603 %** | — |
| **Total** | | **96.5000 %** | 100 % | |

| Bande | Probabilite | Part de RTP |
|---|---|---|
| PERTE (x0) | 41.860 % | 0.00 % |
| RECUP. (x0.1-x0.9) | 16.000 % | 8.00 % |
| PETIT (x1-x4.9) | 39.233 % | 62.28 % |
| MOYEN (x5-x24.9) | 2.632 % | 16.48 % |
| GROS (x25-x99.9) | 0.256 % | 7.28 % |
| ENORME (x100-x999) | 0.019 % | 2.46 % |
| LEGENDAIRE (x1000+) | 0.000 % | 0.00 % |

### FURIOUS (volatilite moyenne), max x1000

BOSS FIGHT : EV = 24.2129x, frequence 1 / 150, part de RTP = 16.142 %

| Source | Multiplicateur | Part de RTP | Probabilite | Frequence |
|---|---|---|---|---|
| base | x0.5 | 4.000 % | 8.0000 % | 1 / 12 |
| base | x1.5 | 13.000 % | 8.6667 % | 1 / 12 |
| base | x2 *(equilibre)* | 17.358 % | 8.6790 % | 1 / 12 |
| base | x3 | 12.000 % | 4.0000 % | 1 / 25 |
| base | x5 | 10.000 % | 2.0000 % | 1 / 50 |
| base | x10 | 8.000 % | 0.8000 % | 1 / 125 |
| base | x25 | 7.000 % | 0.2800 % | 1 / 357 |
| base | x50 | 5.000 % | 0.1000 % | 1 / 1 000 |
| base | x100 | 4.000 % | 0.0400 % | 1 / 2 500 |
| BOSS FIGHT | x5 | 1.500 % | 0.3000 % | 1 / 333 |
| BOSS FIGHT | x10 | 1.833 % | 0.1833 % | 1 / 545 |
| BOSS FIGHT | x25 | 2.521 % | 0.1008 % | 1 / 992 |
| BOSS FIGHT | x50 | 2.269 % | 0.0454 % | 1 / 2 204 |
| BOSS FIGHT | x100 | 2.228 % | 0.0223 % | 1 / 4 489 |
| BOSS FIGHT | x250 | 2.413 % | 0.0097 % | 1 / 10 360 |
| BOSS FIGHT | x500 | 1.819 % | 0.0036 % | 1 / 27 486 |
| BOSS FIGHT | x1000 | 1.559 % | 0.0016 % | 1 / 64 133 |
| — | **x0 (perte)** | 0 % | **66.7676 %** | — |
| **Total** | | **96.5000 %** | 100 % | |

| Bande | Probabilite | Part de RTP |
|---|---|---|
| PERTE (x0) | 66.768 % | 0.00 % |
| RECUP. (x0.1-x0.9) | 8.000 % | 4.00 % |
| PETIT (x1-x4.9) | 21.346 % | 42.36 % |
| MOYEN (x5-x24.9) | 3.283 % | 21.33 % |
| GROS (x25-x99.9) | 0.526 % | 16.79 % |
| ENORME (x100-x999) | 0.076 % | 10.46 % |
| LEGENDAIRE (x1000+) | 0.002 % | 1.56 % |

### UNHINGED (volatilite haute), max x5000

BOSS FIGHT : EV = 35.5048x, frequence 1 / 150, part de RTP = 23.670 %

| Source | Multiplicateur | Part de RTP | Probabilite | Frequence |
|---|---|---|---|---|
| base | x1.5 | 4.500 % | 3.0000 % | 1 / 33 |
| base | x2 | 9.000 % | 4.5000 % | 1 / 22 |
| base | x3 *(equilibre)* | 13.330 % | 4.4434 % | 1 / 23 |
| base | x5 | 8.000 % | 1.6000 % | 1 / 62 |
| base | x10 | 8.000 % | 0.8000 % | 1 / 125 |
| base | x25 | 7.500 % | 0.3000 % | 1 / 333 |
| base | x50 | 7.000 % | 0.1400 % | 1 / 714 |
| base | x100 | 6.000 % | 0.0600 % | 1 / 1 667 |
| base | x250 | 5.000 % | 0.0200 % | 1 / 5 000 |
| base | x500 | 4.500 % | 0.0090 % | 1 / 11 111 |
| BOSS FIGHT | x5 | 1.000 % | 0.2000 % | 1 / 500 |
| BOSS FIGHT | x10 | 1.867 % | 0.1867 % | 1 / 536 |
| BOSS FIGHT | x25 | 3.150 % | 0.1260 % | 1 / 794 |
| BOSS FIGHT | x50 | 4.235 % | 0.0847 % | 1 / 1 181 |
| BOSS FIGHT | x100 | 4.505 % | 0.0450 % | 1 / 2 220 |
| BOSS FIGHT | x250 | 4.548 % | 0.0182 % | 1 / 5 497 |
| BOSS FIGHT | x500 | 2.425 % | 0.0049 % | 1 / 20 614 |
| BOSS FIGHT | x1000 | 1.031 % | 0.0010 % | 1 / 97 009 |
| BOSS FIGHT | x5000 | 0.910 % | 0.0002 % | 1 / 549 715 |
| — | **x0 (perte)** | 0 % | **84.4610 %** | — |
| **Total** | | **96.5000 %** | 100 % | |

| Bande | Probabilite | Part de RTP |
|---|---|---|
| PERTE (x0) | 84.461 % | 0.00 % |
| RECUP. (x0.1-x0.9) | 0.000 % | 0.00 % |
| PETIT (x1-x4.9) | 11.943 % | 26.83 % |
| MOYEN (x5-x24.9) | 2.787 % | 18.87 % |
| GROS (x25-x99.9) | 0.651 % | 21.88 % |
| ENORME (x100-x999) | 0.157 % | 26.98 % |
| LEGENDAIRE (x1000+) | 0.001 % | 1.94 % |

## 3. Echelles BOSS FIGHT

**GRUMPY**

| Palier | Multiplicateur | P(enchainer le coup suivant) | P(atteindre ce palier) | P(finir ici) |
|---|---|---|---|---|
| 1 | x5 | 45 % | 100.000 % | 55.000 % |
| 2 | x10 | 45 % | 45.000 % | 24.750 % |
| 3 | x25 | 40 % | 20.250 % | 12.150 % |
| 4 | x50 | 35 % | 8.100 % | 5.265 % |
| 5 | x100 | 30 % | 2.835 % | 1.985 % |
| 6 | x200 | K.O. (fin) | 0.851 % | 0.851 % |

EV du BOSS FIGHT = 14.5805x la mise

**FURIOUS**

| Palier | Multiplicateur | P(enchainer le coup suivant) | P(atteindre ce palier) | P(finir ici) |
|---|---|---|---|---|
| 1 | x5 | 55 % | 100.000 % | 45.000 % |
| 2 | x10 | 50 % | 55.000 % | 27.500 % |
| 3 | x25 | 45 % | 27.500 % | 15.125 % |
| 4 | x50 | 45 % | 12.375 % | 6.806 % |
| 5 | x100 | 40 % | 5.569 % | 3.341 % |
| 6 | x250 | 35 % | 2.228 % | 1.448 % |
| 7 | x500 | 30 % | 0.780 % | 0.546 % |
| 8 | x1000 | K.O. (fin) | 0.234 % | 0.234 % |

EV du BOSS FIGHT = 24.2129x la mise

**UNHINGED**

| Palier | Multiplicateur | P(enchainer le coup suivant) | P(atteindre ce palier) | P(finir ici) |
|---|---|---|---|---|
| 1 | x5 | 70 % | 100.000 % | 30.000 % |
| 2 | x10 | 60 % | 70.000 % | 28.000 % |
| 3 | x25 | 55 % | 42.000 % | 18.900 % |
| 4 | x50 | 45 % | 23.100 % | 12.705 % |
| 5 | x100 | 35 % | 10.395 % | 6.757 % |
| 6 | x250 | 25 % | 3.638 % | 2.729 % |
| 7 | x500 | 20 % | 0.910 % | 0.728 % |
| 8 | x1000 | 15 % | 0.182 % | 0.155 % |
| 9 | x5000 | K.O. (fin) | 0.027 % | 0.027 % |

EV du BOSS FIGHT = 35.5048x la mise

## 4. Series de pertes

Deux definitions : **perte seche** = paiement x0 ; **manche perdante** = paiement < mise (x0 et x0.5 RECOVERED). Calcul exact (chaine de Markov).

#### Series de perte seche (x0)

| | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| P(une manche) | 41.86 % | 66.77 % | 84.46 % |
| P(5 d'affilee a partir de maintenant) | 1.285 % | 13.27 % | 42.98 % |
| P(10 d'affilee a partir de maintenant) | 0.01652 % | 1.761 % | 18.47 % |
| P(15 d'affilee a partir de maintenant) | 0.0002123 % | 0.2336 % | 7.94 % |
| P(20 d'affilee a partir de maintenant) | 2.729e-06 % | 0.031 % | 3.413 % |
| P(au moins une serie >= 5 sur 100 manches) | 52.93 % | 99.76 % | 100.00 % |
| P(au moins une serie >= 10 sur 100 manches) | 0.88 % | 43.95 % | 98.77 % |
| P(au moins une serie >= 15 sur 100 manches) | 0.01 % | 6.68 % | 75.56 % |
| P(au moins une serie >= 20 sur 100 manches) | 0.00 % | 0.85 % | 40.00 % |
| P(au moins une serie >= 5 sur 300 manches) | 90.11 % | 100.00 % | 100.00 % |
| P(au moins une serie >= 10 sur 300 manches) | 2.77 % | 83.93 % | 100.00 % |
| P(au moins une serie >= 15 sur 300 manches) | 0.04 % | 20.25 % | 98.95 % |
| P(au moins une serie >= 20 sur 300 manches) | 0.00 % | 2.88 % | 81.92 % |
| P(au moins une serie >= 5 sur 1000 manches) | 99.96 % | 100.00 % | 100.00 % |
| P(au moins une serie >= 10 sur 1000 manches) | 9.09 % | 99.80 % | 100.00 % |
| P(au moins une serie >= 15 sur 1000 manches) | 0.12 % | 53.99 % | 100.00 % |
| P(au moins une serie >= 20 sur 1000 manches) | 0.00 % | 9.65 % | 99.73 % |
| Plus longue serie typique (mediane) sur 100 manches | 5 | 9 | 18 |
| Plus longue serie typique (mediane) sur 300 manches | 6 | 12 | 24 |
| Plus longue serie typique (mediane) sur 1000 manches | 7 | 15 | 32 |

#### Series de manche perdante (< mise)

| | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| P(une manche) | 57.86 % | 74.77 % | 84.46 % |
| P(5 d'affilee a partir de maintenant) | 6.485 % | 23.37 % | 42.98 % |
| P(10 d'affilee a partir de maintenant) | 0.4205 % | 5.459 % | 18.47 % |
| P(15 d'affilee a partir de maintenant) | 0.02727 % | 1.276 % | 7.94 % |
| P(20 d'affilee a partir de maintenant) | 0.001769 % | 0.298 % | 3.413 % |
| P(au moins une serie >= 5 sur 100 manches) | 95.79 % | 100.00 % | 100.00 % |
| P(au moins une serie >= 10 sur 100 manches) | 15.35 % | 78.17 % | 98.77 % |
| P(au moins une serie >= 15 sur 100 manches) | 1.00 % | 25.95 % | 75.56 % |
| P(au moins une serie >= 20 sur 100 manches) | 0.06 % | 6.20 % | 40.00 % |
| P(au moins une serie >= 5 sur 300 manches) | 99.99 % | 100.00 % | 100.00 % |
| P(au moins une serie >= 10 sur 300 manches) | 41.01 % | 99.17 % | 100.00 % |
| P(au moins une serie >= 15 sur 300 manches) | 3.25 % | 62.43 % | 98.95 % |
| P(au moins une serie >= 20 sur 300 manches) | 0.21 % | 19.49 % | 81.92 % |
| P(au moins une serie >= 5 sur 1000 manches) | 100.00 % | 100.00 % | 100.00 % |
| P(au moins une serie >= 10 sur 1000 manches) | 83.34 % | 100.00 % | 100.00 % |
| P(au moins une serie >= 15 sur 1000 manches) | 10.74 % | 96.50 % | 100.00 % |
| P(au moins une serie >= 20 sur 1000 manches) | 0.73 % | 52.84 % | 99.73 % |
| Plus longue serie typique (mediane) sur 100 manches | 7 | 12 | 18 |
| Plus longue serie typique (mediane) sur 300 manches | 9 | 16 | 24 |
| Plus longue serie typique (mediane) sur 1000 manches | 11 | 20 | 32 |

## 5. Attente avant evenement

Nombre de manches **jusqu'a l'evenement inclus**. Exact = loi geometrique ; simule = 3 000 000 manches tirees dans la distribution complete (graine 20260925).

| Rage Level | Evenement | Probabilite / manche | Moyenne | Mediane exacte | Mediane simulee | P90 exact | P90 simule | Echantillons |
|---|---|---|---|---|---|---|---|---|
| GRUMPY | gain >= x5 | 1 / 34 | 34 | 24 | 24 | 79 | 78 | 87 402 |
| GRUMPY | gain >= x25 | 1 / 364 | 364 | 252 | 252 | 837 | 847 | 8 167 |
| GRUMPY | gain >= x100 | 1 / 5 291 | 5291 | 3668 | 3453 | 12182 | 12418 | 589 |
| GRUMPY | BOSS FIGHT | 1 / 150 | 150 | 104 | 103 | 345 | 343 | 20 094 |
| FURIOUS | gain >= x5 | 1 / 26 | 26 | 18 | 18 | 59 | 58 | 116 821 |
| FURIOUS | gain >= x25 | 1 / 166 | 166 | 115 | 116 | 381 | 385 | 17 863 |
| FURIOUS | gain >= x100 | 1 / 1 297 | 1297 | 899 | 906 | 2985 | 3106 | 2 239 |
| FURIOUS | BOSS FIGHT | 1 / 150 | 150 | 104 | 106 | 345 | 350 | 19 767 |
| UNHINGED | gain >= x5 | 1 / 28 | 28 | 19 | 19 | 63 | 63 | 108 337 |
| UNHINGED | gain >= x25 | 1 / 124 | 124 | 86 | 86 | 284 | 285 | 24 225 |
| UNHINGED | gain >= x100 | 1 / 632 | 632 | 438 | 441 | 1454 | 1465 | 4 752 |
| UNHINGED | BOSS FIGHT | 1 / 150 | 150 | 104 | 104 | 345 | 343 | 20 175 |

Plus longue serie de x0 observee dans la simulation : GRUMPY 16, FURIOUS 34, UNHINGED 86 (sur 3 000 000 manches chacun).

## 6. Sessions (Monte Carlo, 10 000 sessions, mise fixe 1, resultat net en mises)

| Rage Level | Manches | P(finir gagnant) | P5 | Mediane | P95 |
|---|---|---|---|---|---|
| GRUMPY | 100 | 31.7 % | -30.8 | -9.1 | +37.3 |
| GRUMPY | 300 | 30.9 % | -64.7 | -19.3 | +71.2 |
| GRUMPY | 1000 | 26.8 % | -147.0 | -49.6 | +126.6 |
| FURIOUS | 100 | 29.7 % | -50.0 | -19.0 | +78.0 |
| FURIOUS | 300 | 31.9 % | -113.0 | -35.5 | +154.5 |
| FURIOUS | 1000 | 30.1 % | -262.0 | -82.0 | +352.5 |
| UNHINGED | 100 | 27.5 % | -70.0 | -33.0 | +180.5 |
| UNHINGED | 300 | 31.3 % | -167.5 | -60.0 | +335.5 |
| UNHINGED | 1000 | 34.6 % | -403.0 | -111.0 | +532.5 |

## 7. Lookup tables : poids entiers exacts

| Rage Level | Total des poids (PPCM) | < 2^64 | RTP recalcule depuis les entiers |
|---|---|---|---|
| GRUMPY | 90 000 000 | OK | 96.500000 % |
| FURIOUS | 1 200 000 000 | OK | 96.500000 % |
| UNHINGED | 72 000 000 000 | OK | 96.500000 % |

Detail FURIOUS :

| payoutMultiplier (entier Stake) | Poids entier | RTP partiel exact |
|---|---|---|
| 0 | 801 211 500 | 0.0000 % |
| 50 | 96 000 000 | 4.0000 % |
| 150 | 104 000 000 | 13.0000 % |
| 200 | 104 148 500 | 17.3581 % |
| 300 | 48 000 000 | 12.0000 % |
| 500 | 27 600 000 | 11.5000 % |
| 1000 | 11 800 000 | 9.8333 % |
| 2500 | 4 570 000 | 9.5208 % |
| 5000 | 1 744 500 | 7.2687 % |
| 10000 | 747 300 | 6.2275 % |
| 25000 | 115 830 | 2.4131 % |
| 50000 | 43 659 | 1.8191 % |
| 100000 | 18 711 | 1.5593 % |
