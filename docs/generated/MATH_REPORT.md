# BAD BOSS — rapport mathematique genere

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

> **Fichier genere** par `python3 math/model/bad_boss_math.py --write-report docs/generated/MATH_REPORT.md`. Ne pas modifier a la main : modifier `config/rage_levels.json` puis regenerer.
> RTP cible : 96.50 % (PROVISOIRE - validation Stake Engine requise avant publication).

## 1. Synthese

| Indicateur | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| RTP (exact) | 96.5000 % | 96.5000 % | 96.5000 % |
| House edge | 3.50 % | 3.50 % | 3.50 % |
| P(perte x0) | 42.23 % | 67.16 % | 84.94 % |
| Hit rate (paiement > 0) | 57.77 % (1 / 2) | 32.84 % (1 / 3) | 15.06 % (1 / 7) |
| P(paiement >= mise) | 41.77 % | 24.84 % | 15.06 % |
| Ecart-type (sigma, en mises) | 2.73 | 6.92 | 17.45 |
| Variance | 7.5 | 47.9 | 304.6 |
| Mediane | x0.5 | x0 | x0 |
| Max win | x200 | x1000 | x5000 |
| Frequence max win | 1 / 67 622 | 1 / 75 250 | 1 / 296 419 |
| BOSS FIGHT | 1 / 400 | 1 / 400 | 1 / 400 |
| EV d'un BOSS FIGHT | x38.68 | x64.40 | x95.39 |
| Part RTP du BOSS FIGHT | 9.67 % | 16.10 % | 23.85 % |
| CVaR 99.9 % (limite SDK 800) | 58.8 | 139.1 | 246.0 |
| ETL40 (limite SDK 0.9) | 0.056 | 0.219 | 0.433 |
| P(>= x5000) (limite SDK 1 %) | 0.00e+00 | 0.00e+00 | 3.37e-06 |

## 2. Distributions detaillees

### GRUMPY (volatilite basse), max x200

BOSS FIGHT : EV = 38.6786x, frequence 1 / 400, part de RTP = 9.670 %

| Source | Multiplicateur | Part de RTP | Probabilite | Frequence |
|---|---|---|---|---|
| base | x0.5 | 8.000 % | 16.0000 % | 1 / 6 |
| base | x1.2 *(equilibre)* | 20.330 % | 16.9420 % | 1 / 6 |
| base | x1.5 | 18.000 % | 12.0000 % | 1 / 8 |
| base | x2 | 14.000 % | 7.0000 % | 1 / 14 |
| base | x3 | 10.000 % | 3.3333 % | 1 / 30 |
| base | x5 | 8.000 % | 1.6000 % | 1 / 62 |
| base | x10 | 5.000 % | 0.5000 % | 1 / 200 |
| base | x25 | 3.500 % | 0.1400 % | 1 / 714 |
| BOSS FIGHT (8 tours gratuits, 200 totaux possibles, detail §3) | x1 a x200 | 9.670 % | 0.2500 % | 1 / 400 |
| — | **x0 (perte)** | 0 % | **42.2347 %** | — |
| **Total** | | **96.5000 %** | 100 % | |

| Bande | Probabilite | Part de RTP |
|---|---|---|
| PERTE (x0) | 42.235 % | 0.00 % |
| RECUP. (x0.1-x0.9) | 16.000 % | 8.00 % |
| PETIT (x1-x4.9) | 39.276 % | 62.33 % |
| MOYEN (x5-x24.9) | 2.169 % | 14.22 % |
| GROS (x25-x99.9) | 0.312 % | 10.79 % |
| ENORME (x100-x999) | 0.008 % | 1.15 % |
| LEGENDAIRE (x1000+) | 0.000 % | 0.00 % |

### FURIOUS (volatilite moyenne), max x1000

BOSS FIGHT : EV = 64.4035x, frequence 1 / 400, part de RTP = 16.101 %

| Source | Multiplicateur | Part de RTP | Probabilite | Frequence |
|---|---|---|---|---|
| base | x0.5 | 4.000 % | 8.0000 % | 1 / 12 |
| base | x1.5 | 13.000 % | 8.6667 % | 1 / 12 |
| base | x2 *(equilibre)* | 17.399 % | 8.6996 % | 1 / 11 |
| base | x3 | 12.000 % | 4.0000 % | 1 / 25 |
| base | x5 | 10.000 % | 2.0000 % | 1 / 50 |
| base | x10 | 8.000 % | 0.8000 % | 1 / 125 |
| base | x25 | 7.000 % | 0.2800 % | 1 / 357 |
| base | x50 | 5.000 % | 0.1000 % | 1 / 1 000 |
| base | x100 | 4.000 % | 0.0400 % | 1 / 2 500 |
| BOSS FIGHT (8 tours gratuits, 1000 totaux possibles, detail §3) | x1 a x1000 | 16.101 % | 0.2500 % | 1 / 400 |
| — | **x0 (perte)** | 0 % | **67.1638 %** | — |
| **Total** | | **96.5000 %** | 100 % | |

| Bande | Probabilite | Part de RTP |
|---|---|---|
| PERTE (x0) | 67.164 % | 0.00 % |
| RECUP. (x0.1-x0.9) | 8.000 % | 4.00 % |
| PETIT (x1-x4.9) | 21.368 % | 42.40 % |
| MOYEN (x5-x24.9) | 2.862 % | 19.05 % |
| GROS (x25-x99.9) | 0.537 % | 19.35 % |
| ENORME (x100-x999) | 0.068 % | 10.37 % |
| LEGENDAIRE (x1000+) | 0.001 % | 1.33 % |

### UNHINGED (volatilite haute), max x5000

BOSS FIGHT : EV = 95.3918x, frequence 1 / 400, part de RTP = 23.848 %

| Source | Multiplicateur | Part de RTP | Probabilite | Frequence |
|---|---|---|---|---|
| base | x1.5 | 4.500 % | 3.0000 % | 1 / 33 |
| base | x2 | 9.000 % | 4.5000 % | 1 / 22 |
| base | x3 *(equilibre)* | 13.152 % | 4.3840 % | 1 / 23 |
| base | x5 | 8.000 % | 1.6000 % | 1 / 62 |
| base | x10 | 8.000 % | 0.8000 % | 1 / 125 |
| base | x25 | 7.500 % | 0.3000 % | 1 / 333 |
| base | x50 | 7.000 % | 0.1400 % | 1 / 714 |
| base | x100 | 6.000 % | 0.0600 % | 1 / 1 667 |
| base | x250 | 5.000 % | 0.0200 % | 1 / 5 000 |
| base | x500 | 4.500 % | 0.0090 % | 1 / 11 111 |
| BOSS FIGHT (8 tours gratuits, 5000 totaux possibles, detail §3) | x1 a x5000 | 23.848 % | 0.2500 % | 1 / 400 |
| — | **x0 (perte)** | 0 % | **84.9370 %** | — |
| **Total** | | **96.5000 %** | 100 % | |

| Bande | Probabilite | Part de RTP |
|---|---|---|
| PERTE (x0) | 84.937 % | 0.00 % |
| RECUP. (x0.1-x0.9) | 0.000 % | 0.00 % |
| PETIT (x1-x4.9) | 11.887 % | 26.66 % |
| MOYEN (x5-x24.9) | 2.472 % | 17.16 % |
| GROS (x25-x99.9) | 0.575 % | 20.87 % |
| ENORME (x100-x999) | 0.126 % | 24.14 % |
| LEGENDAIRE (x1000+) | 0.003 % | 7.67 % |

## 3. BOSS FIGHT : 8 tours gratuits

Le BOSS FIGHT se joue dans la MEME manche que la mise qui le declenche (un book, un Play, comme les free spins Stake Engine). Regles : `free_rounds_doc` de `config/rage_levels.json`.

**GRUMPY** : 8 tours, P(HIT) = 75 %, rage x1 puis +1 par HIT, plafond x200

| Base d'un HIT | Probabilite (sachant HIT) |
|---|---|
| x1 | 64.0 % |
| x2 | 23.0 % |
| x3 | 8.0 % |
| x5 | 3.2 % |
| x10 | 1.2 % |
| x25 | 0.5 % |
| x50 | 0.1 % |

Base moyenne d'un HIT = x1.795

| Total du bonus | Valeur |
|---|---|
| EV d'un BOSS FIGHT | **x38.68** |
| P10 | x16 |
| P25 | x23 |
| Mediane | x33 |
| P75 | x46 |
| P90 | x63 |
| P99 | x169 |
| P(total < x10) | 1.81 % |
| P(plafond x200) par bonus | 0.5915 % (1 / 169) |
| P(plafond) par manche | 1 / 67 622 |

**FURIOUS** : 8 tours, P(HIT) = 70 %, rage x1 puis +1 par HIT, plafond x1000

| Base d'un HIT | Probabilite (sachant HIT) |
|---|---|
| x1 | 52.0 % |
| x2 | 25.0 % |
| x3 | 11.0 % |
| x5 | 6.5 % |
| x10 | 3.0 % |
| x25 | 1.4 % |
| x50 | 0.6 % |
| x100 | 0.3 % |
| x250 | 0.2 % |

Base moyenne d'un HIT = x3.425

| Total du bonus | Valeur |
|---|---|
| EV d'un BOSS FIGHT | **x64.40** |
| P10 | x15 |
| P25 | x24 |
| Mediane | x38 |
| P75 | x61 |
| P90 | x114 |
| P99 | x620 |
| P(total < x10) | 2.84 % |
| P(plafond x1000) par bonus | 0.5316 % (1 / 188) |
| P(plafond) par manche | 1 / 75 250 |

**UNHINGED** : 8 tours, P(HIT) = 65 %, rage x1 puis +1 par HIT, plafond x5000

| Base d'un HIT | Probabilite (sachant HIT) |
|---|---|
| x1 | 50.0 % |
| x2 | 24.0 % |
| x3 | 11.0 % |
| x5 | 7.0 % |
| x10 | 4.0 % |
| x25 | 2.0 % |
| x50 | 1.0 % |
| x100 | 0.6 % |
| x250 | 0.2 % |
| x500 | 0.1 % |
| x1000 | 0.1 % |

Base moyenne d'un HIT = x5.660

| Total du bonus | Valeur |
|---|---|
| EV d'un BOSS FIGHT | **x95.39** |
| P10 | x13 |
| P25 | x22 |
| Mediane | x37 |
| P75 | x67 |
| P90 | x155 |
| P99 | x1266 |
| P(total < x10) | 4.93 % |
| P(plafond x5000) par bonus | 0.1349 % (1 / 741) |
| P(plafond) par manche | 1 / 296 419 |

## 4. Series de pertes

Deux definitions : **perte seche** = paiement x0 ; **manche perdante** = paiement < mise (x0 et x0.5 RECOVERED). Calcul exact (chaine de Markov).

#### Series de perte seche (x0)

| | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| P(une manche) | 42.23 % | 67.16 % | 84.94 % |
| P(5 d'affilee a partir de maintenant) | 1.344 % | 13.67 % | 44.21 % |
| P(10 d'affilee a partir de maintenant) | 0.01806 % | 1.868 % | 19.54 % |
| P(15 d'affilee a partir de maintenant) | 0.0002427 % | 0.2553 % | 8.639 % |
| P(20 d'affilee a partir de maintenant) | 3.261e-06 % | 0.03489 % | 3.819 % |
| P(au moins une serie >= 5 sur 100 manches) | 54.35 % | 99.79 % | 100.00 % |
| P(au moins une serie >= 10 sur 100 manches) | 0.95 % | 45.62 % | 99.02 % |
| P(au moins une serie >= 15 sur 100 manches) | 0.01 % | 7.20 % | 77.99 % |
| P(au moins une serie >= 20 sur 100 manches) | 0.00 % | 0.95 % | 42.95 % |
| P(au moins une serie >= 5 sur 300 manches) | 91.00 % | 100.00 % | 100.00 % |
| P(au moins une serie >= 10 sur 300 manches) | 3.00 % | 85.39 % | 100.00 % |
| P(au moins une serie >= 15 sur 300 manches) | 0.04 % | 21.70 % | 99.25 % |
| P(au moins une serie >= 20 sur 300 manches) | 0.00 % | 3.20 % | 84.71 % |
| P(au moins une serie >= 5 sur 1000 manches) | 99.97 % | 100.00 % | 100.00 % |
| P(au moins une serie >= 10 sur 1000 manches) | 9.84 % | 99.85 % | 100.00 % |
| P(au moins une serie >= 15 sur 1000 manches) | 0.14 % | 56.79 % | 100.00 % |
| P(au moins une serie >= 20 sur 1000 manches) | 0.00 % | 10.67 % | 99.85 % |
| Plus longue serie typique (mediane) sur 100 manches | 5 | 9 | 18 |
| Plus longue serie typique (mediane) sur 300 manches | 6 | 12 | 25 |
| Plus longue serie typique (mediane) sur 1000 manches | 7 | 15 | 32 |

#### Series de manche perdante (< mise)

| | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| P(une manche) | 58.23 % | 75.16 % | 84.94 % |
| P(5 d'affilee a partir de maintenant) | 6.697 % | 23.99 % | 44.21 % |
| P(10 d'affilee a partir de maintenant) | 0.4486 % | 5.756 % | 19.54 % |
| P(15 d'affilee a partir de maintenant) | 0.03004 % | 1.381 % | 8.639 % |
| P(20 d'affilee a partir de maintenant) | 0.002012 % | 0.3313 % | 3.819 % |
| P(au moins une serie >= 5 sur 100 manches) | 96.16 % | 100.00 % | 100.00 % |
| P(au moins une serie >= 10 sur 100 manches) | 16.17 % | 79.65 % | 99.02 % |
| P(au moins une serie >= 15 sur 100 manches) | 1.09 % | 27.49 % | 77.99 % |
| P(au moins une serie >= 20 sur 100 manches) | 0.07 % | 6.78 % | 42.95 % |
| P(au moins une serie >= 5 sur 300 manches) | 100.00 % | 100.00 % | 100.00 % |
| P(au moins une serie >= 10 sur 300 manches) | 42.80 % | 99.34 % | 100.00 % |
| P(au moins une serie >= 15 sur 300 manches) | 3.55 % | 64.90 % | 99.25 % |
| P(au moins une serie >= 20 sur 300 manches) | 0.24 % | 21.15 % | 84.71 % |
| P(au moins une serie >= 5 sur 1000 manches) | 100.00 % | 100.00 % | 100.00 % |
| P(au moins une serie >= 10 sur 1000 manches) | 84.99 % | 100.00 % | 100.00 % |
| P(au moins une serie >= 15 sur 1000 manches) | 11.67 % | 97.23 % | 100.00 % |
| P(au moins une serie >= 20 sur 1000 manches) | 0.82 % | 56.11 % | 99.85 % |
| Plus longue serie typique (mediane) sur 100 manches | 7 | 12 | 18 |
| Plus longue serie typique (mediane) sur 300 manches | 9 | 16 | 25 |
| Plus longue serie typique (mediane) sur 1000 manches | 11 | 20 | 32 |

## 5. Attente avant evenement

Nombre de manches **jusqu'a l'evenement inclus**. Exact = loi geometrique ; simule = 3 000 000 manches tirees dans la distribution complete (graine 20260925).

| Rage Level | Evenement | Probabilite / manche | Moyenne | Mediane exacte | Mediane simulee | P90 exact | P90 simule | Echantillons |
|---|---|---|---|---|---|---|---|---|
| GRUMPY | gain >= x5 | 1 / 40 | 40 | 28 | 28 | 92 | 92 | 74 818 |
| GRUMPY | gain >= x25 | 1 / 313 | 313 | 217 | 213 | 719 | 719 | 9 602 |
| GRUMPY | gain >= x100 | 1 / 12 749 | 12749 | 8837 | 8727 | 29356 | 27904 | 247 |
| GRUMPY | BOSS FIGHT | 1 / 400 | 400 | 277 | 277 | 920 | 915 | 7 482 |
| FURIOUS | gain >= x5 | 1 / 29 | 29 | 20 | 20 | 66 | 65 | 104 511 |
| FURIOUS | gain >= x25 | 1 / 165 | 165 | 114 | 116 | 379 | 381 | 18 013 |
| FURIOUS | gain >= x100 | 1 / 1 434 | 1434 | 994 | 991 | 3301 | 3372 | 2 102 |
| FURIOUS | BOSS FIGHT | 1 / 400 | 400 | 277 | 278 | 920 | 920 | 7 461 |
| UNHINGED | gain >= x5 | 1 / 31 | 31 | 22 | 22 | 72 | 71 | 95 686 |
| UNHINGED | gain >= x25 | 1 / 142 | 142 | 99 | 99 | 326 | 323 | 21 225 |
| UNHINGED | gain >= x100 | 1 / 773 | 773 | 536 | 527 | 1780 | 1748 | 3 942 |
| UNHINGED | BOSS FIGHT | 1 / 400 | 400 | 277 | 274 | 920 | 898 | 7 631 |

Plus longue serie de x0 observee dans la simulation : GRUMPY 16, FURIOUS 34, UNHINGED 86 (sur 3 000 000 manches chacun).

## 6. Sessions (Monte Carlo, 10 000 sessions, mise fixe 1, resultat net en mises)

| Rage Level | Manches | P(finir gagnant) | P5 | Mediane | P95 |
|---|---|---|---|---|---|
| GRUMPY | 100 | 32.3 % | -32.3 | -10.4 | +45.2 |
| GRUMPY | 300 | 33.6 % | -69.4 | -19.1 | +76.8 |
| GRUMPY | 1000 | 29.1 % | -156.3 | -46.6 | +122.0 |
| FURIOUS | 100 | 30.5 % | -52.0 | -20.5 | +84.5 |
| FURIOUS | 300 | 32.4 % | -118.0 | -36.0 | +156.5 |
| FURIOUS | 1000 | 31.2 % | -275.0 | -83.5 | +355.0 |
| UNHINGED | 100 | 24.6 % | -72.0 | -38.0 | +151.5 |
| UNHINGED | 300 | 26.5 % | -178.0 | -77.0 | +348.5 |
| UNHINGED | 1000 | 29.6 % | -449.0 | -166.5 | +676.0 |

## 7. Lookup tables : poids entiers exacts

Avec 8 tours gratuits, le PPCM des denominateurs depasse 2^64 : les poids sont arrondis au plus proche sur un total fixe de 1 000 000 000 000 000 (plus fort reste). Le RTP EXACT du modele reste 96,5 % ; l'ecart du RTP recalcule depuis les entiers est affiche ci-dessous. En production, les books du math-sdk seront ponderes par son optimiseur.

| Rage Level | Total des poids | < 2^64 | RTP recalcule depuis les entiers | Ecart au RTP exact |
|---|---|---|---|---|
| GRUMPY | 1 000 000 000 000 000 | OK | 96.500000 % | -1.75e-13 |
| FURIOUS | 1 000 000 000 000 000 | OK | 96.500000 % | -3.25e-12 |
| UNHINGED | 1 000 000 000 000 000 | OK | 96.500000 % | -3.49e-12 |

Detail FURIOUS (lignes de base ; les totaux du BOSS FIGHT sont resumes en une ligne) :

| payoutMultiplier (entier Stake) | Poids entier | RTP partiel |
|---|---|---|
| 0 | 671 637 676 347 782 | 0.0000 % |
| 50 | 80 000 000 000 000 | 4.0000 % |
| 150 | 86 666 666 666 667 | 13.0000 % |
| 200 | 86 996 463 441 802 | 17.3993 % |
| 300 | 40 007 116 111 630 | 12.0021 % |
| 500 | 20 004 890 558 465 | 10.0024 % |
| 1000 | 8 035 963 987 630 | 8.0360 % |
| 2500 | 2 846 295 923 472 | 7.1157 % |
| 5000 | 1 025 640 350 432 | 5.1282 % |
| 10000 | 403 746 515 190 | 4.0375 % |
| autres totaux du BOSS FIGHT (993 valeurs, de 100 a 100000) | 2 375 540 096 930 | 15.7788 % |
