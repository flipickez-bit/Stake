# BAD BOSS — GDD partie 3 : mathématiques (étape 4)

> **Tous les chiffres de ce document sont produits par `math/model/bad_boss_math.py`.** C'est un calculateur Python sans dépendance, en fractions exactes : aucune probabilité n'est « inventée ».
> Relancer : `python3 math/model/bad_boss_math.py` (rapport) ou `python3 math/model/bad_boss_math.py --markdown` (tableaux ci-dessous).

---

## 4.0 Contraintes Stake Engine qui s'appliquent aux maths (vérifiées)

Sources : `StakeEngine/math-sdk` (docs + `utils/rgs_verification.py`). Détail dans `docs/STAKE_ENGINE_FAITS_VERIFIES.md`.

| Contrainte | Conséquence pour BAD BOSS |
|---|---|
| Tous les résultats possibles sont **pré-calculés** (books). Le RGS tire un book **proportionnellement à son poids** dans le lookup table du mode | Le résultat est connu avant l'animation, par construction |
| `payoutMultiplier` est un **entier** : 1150 = x11,5 | On manipule des entiers ×100 |
| Gain non nul ≥ 10 et **multiple de 10** (contrôle SDK) | Multiplicateurs par **pas de x0,1**. x4,8 est valide, x1,25 ne l'est pas |
| Poids du lookup table : **entiers uint64**, somme ≤ 2^64 − 1 | Nos poids sont exacts (PPCM des dénominateurs, §4.7) |
| Contrôles « 3-star volatility limits » du SDK : RTP ≤ 0,967, CVaR 99,9 % ≤ 800, ETL40 ≤ 0,9, P(≥x5000) ≤ 1 %, P(≥x10000) ≤ 0,5 % | Les 3 modes passent tous les contrôles (§4.3) |
| Le SDK avertit si l'écart de RTP entre modes dépasse 0,05 (« allowed difference for approvals ») | Nos 3 modes ont **exactement** le même RTP |

## 4.1 Méthode : le budget de RTP (pas de probabilités arbitraires)

Le designer ne choisit pas des probabilités « au feeling ». Il **répartit un budget de RTP** entre les multiplicateurs, et les probabilités en découlent :

```
RTP              = Σ m_i · p_i                         (espérance du gain, en mises)
p_i              = r_i / m_i                           (r_i = part de RTP allouée au multiplicateur m_i)
BOSS FIGHT       : EV_BF = Σ_k L_k · P(finir au palier k)
                   part_BF = f_BF · EV_BF              (f_BF = fréquence du bonus = 1/150)
Ligne d'équilibre : r_eq = RTP_cible − part_BF − Σ(autres r_i)
P(perte)         = 1 − Σ p_i                           (variable libre, absorbe le reste)
Hit rate         = Σ p_i = RTP / E[m | gain]           (plus le gain moyen est gros, plus les gains sont rares)
Variance         = Σ p_i · (m_i − RTP)²      σ = √Variance   (en unités de mise)
House edge       = 1 − RTP
```

Procédure pour chaque mode :
1. Fixer l'échelle et la fréquence du BOSS FIGHT, ce qui donne sa part de RTP.
2. Allouer des parts de RTP aux multiplicateurs de base, du plus fréquent au plus rare.
3. Une seule ligne « d'équilibre » reçoit le reste, pour atteindre **exactement** 96,5 %.
4. Calculer p = part / m, puis P(perte) = 1 − Σp.
5. Contrôler σ, les bandes, le max win et les limites du SDK. Itérer sur les parts si besoin.

## 4.2 Exemple calculé pas à pas : FURIOUS

**a) BOSS FIGHT FURIOUS** : paliers x5 → x12 → x30 → x75 → x200 → x500 → x1 000. Probabilités d'enchaîner : 50 %, 45 %, 40 %, 35 %, 30 %, 25 %.

| Palier | P(finir ici) | Calcul | m × P |
|---|---|---|---|
| x5 | 0,5 | 1 × (1 − 0,50) | 2,5 |
| x12 | 0,275 | 0,50 × (1 − 0,45) | 3,3 |
| x30 | 0,135 | 0,50 × 0,45 × (1 − 0,40) | 4,05 |
| x75 | 0,0585 | 0,225 × 0,40 × (1 − 0,35) | 4,3875 |
| x200 | 0,02205 | 0,09 × 0,35 × (1 − 0,30) | 4,41 |
| x500 | 0,0070875 | 0,0315 × 0,30 × (1 − 0,25) | 3,54375 |
| x1 000 (K.O.) | 0,0023625 | 0,0315 × 0,30 × 0,25 | 2,3625 |
| **EV_BF** | Σ = 1 | | **24,55375** |

Part de RTP du bonus = 24,55375 / 150 = **16,369 %**.

**b) Base** : parts fixées de x0,5 = 4 %, x1,5 = 13 %, x3 = 12 %, x5 = 10 %, x10 = 8 %, x25 = 7 %, x50 = 5 %, x100 = 4 %, soit 63 % au total.
Ligne d'équilibre x2 : 96,5 − 16,369 − 63 = **17,131 %**, donc p(x2) = 17,131 / 2 = **8,5654 %**.

**c) Probabilités** : x0,5 = 4/0,5 = 8 % · x1,5 = 13/1,5 = 8,6667 % · x3 = 4 % · x5 = 2 % · x10 = 0,8 % · x25 = 0,28 % · x50 = 0,1 % · x100 = 0,04 %.
Σ base = 32,4521 %. BOSS FIGHT = 1/150 = 0,6667 %. **Hit rate = 33,119 %**, donc **P(perte) = 66,881 %**.

**d) Vérification** : Σ parts = 4 + 13 + 17,131 + 12 + 10 + 8 + 7 + 5 + 4 + 16,369 = **96,500 %**. En fraction exacte : RTP = 193/200.

**e) D'où vient la volatilité** (contributions à la variance, FURIOUS, total 46,33) :

| Multiplicateur | Contribution | Commentaire |
|---|---|---|
| x0 | 0,62 | les pertes pèsent peu |
| x0,5 à x10 | 1,33 | la « vie quotidienne » du mode |
| x12 à x100 | 11,07 | |
| x200, x500, x1 000 (BOSS FIGHT) | **33,31 (72 %)** | la volatilité vient presque entièrement des hauts paliers du bonus |

σ = √46,33 = **6,81 mises**.

## 4.3 Synthèse des 3 profils

| Indicateur | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| RTP (exact) | 96.5000 % | 96.5000 % | 96.5000 % |
| House edge | 3.50 % | 3.50 % | 3.50 % |
| P(perte x0) | 41.86 % | 66.88 % | 84.44 % |
| Hit rate (paiement > 0) | 58.14 % (1 / 2) | 33.12 % (1 / 3) | 15.56 % (1 / 6) |
| P(paiement ≥ mise) | 42.14 % | 25.12 % | 15.56 % |
| Écart-type (σ, en mises) | 2.74 | 6.81 | 13.31 |
| Variance | 7.5 | 46.3 | 177.1 |
| Médiane | x0.5 | x0 | x0 |
| Max win | x200 | x1000 | x5000 |
| Fréquence max win | 1 / 12 698 | 1 / 63 492 | 1 / 577 201 |
| BOSS FIGHT | 1 / 150 | 1 / 150 | 1 / 150 |
| Part RTP du BOSS FIGHT | 9.73 % | 16.37 % | 23.62 % |
| CVaR 99.9 % (limite SDK 800) | 52.9 | 94.0 | 235.1 |
| ETL40 (limite SDK 0.9) | 0.033 | 0.188 | 0.394 |
| P(≥ x5000) (limite SDK 1 %) | 0 | 0 | 1.73e-06 |

Lecture : σ est multiplié par ~2,5 entre GRUMPY et FURIOUS, puis par ~2 entre FURIOUS et UNHINGED. Ce sont trois paliers de risque nettement distincts, pour un avantage maison identique.

## 4.4 Distributions détaillées

### GRUMPY (volatilité basse), max x200

BOSS FIGHT : EV = 14.5878x, fréquence 1 / 150, part de RTP = 9.725 %

| Source | Multiplicateur | Part de RTP | Probabilité | Fréquence |
|---|---|---|---|---|
| base | x0.5 | 8.000 % | 16.0000 % | 1 / 6 |
| base | x1.2 *(équilibre)* | 20.275 % | 16.8957 % | 1 / 6 |
| base | x1.5 | 18.000 % | 12.0000 % | 1 / 8 |
| base | x2 | 14.000 % | 7.0000 % | 1 / 14 |
| base | x3 | 10.000 % | 3.3333 % | 1 / 30 |
| base | x5 | 8.000 % | 1.6000 % | 1 / 62 |
| base | x10 | 5.000 % | 0.5000 % | 1 / 200 |
| base | x25 | 3.500 % | 0.1400 % | 1 / 714 |
| BOSS FIGHT | x5 | 1.833 % | 0.3667 % | 1 / 273 |
| BOSS FIGHT | x12 | 2.340 % | 0.1950 % | 1 / 513 |
| BOSS FIGHT | x30 | 2.205 % | 0.0735 % | 1 / 1 361 |
| BOSS FIGHT | x75 | 1.772 % | 0.0236 % | 1 / 4 233 |
| BOSS FIGHT | x200 | 1.575 % | 0.0079 % | 1 / 12 698 |
| — | **x0 (perte)** | 0 % | **41.8643 %** | — |
| **Total** | | **96.5000 %** | 100 % | |

| Bande | Probabilité | Part de RTP |
|---|---|---|
| PERTE (x0) | 41.864 % | 0.00 % |
| RÉCUP. (x0.1-x0.9) | 16.000 % | 8.00 % |
| PETIT (x1-x4.9) | 39.229 % | 62.27 % |
| MOYEN (x5-x24.9) | 2.662 % | 17.17 % |
| GROS (x25-x99.9) | 0.237 % | 7.48 % |
| ÉNORME (x100-x999) | 0.008 % | 1.57 % |
| LÉGENDAIRE (x1000+) | 0.000 % | 0.00 % |

### FURIOUS (volatilité moyenne), max x1 000

BOSS FIGHT : EV = 24.5538x, fréquence 1 / 150, part de RTP = 16.369 %

| Source | Multiplicateur | Part de RTP | Probabilité | Fréquence |
|---|---|---|---|---|
| base | x0.5 | 4.000 % | 8.0000 % | 1 / 12 |
| base | x1.5 | 13.000 % | 8.6667 % | 1 / 12 |
| base | x2 *(équilibre)* | 17.131 % | 8.5654 % | 1 / 12 |
| base | x3 | 12.000 % | 4.0000 % | 1 / 25 |
| base | x5 | 10.000 % | 2.0000 % | 1 / 50 |
| base | x10 | 8.000 % | 0.8000 % | 1 / 125 |
| base | x25 | 7.000 % | 0.2800 % | 1 / 357 |
| base | x50 | 5.000 % | 0.1000 % | 1 / 1 000 |
| base | x100 | 4.000 % | 0.0400 % | 1 / 2 500 |
| BOSS FIGHT | x5 | 1.667 % | 0.3333 % | 1 / 300 |
| BOSS FIGHT | x12 | 2.200 % | 0.1833 % | 1 / 545 |
| BOSS FIGHT | x30 | 2.700 % | 0.0900 % | 1 / 1 111 |
| BOSS FIGHT | x75 | 2.925 % | 0.0390 % | 1 / 2 564 |
| BOSS FIGHT | x200 | 2.940 % | 0.0147 % | 1 / 6 803 |
| BOSS FIGHT | x500 | 2.362 % | 0.0047 % | 1 / 21 164 |
| BOSS FIGHT | x1000 | 1.575 % | 0.0016 % | 1 / 63 492 |
| — | **x0 (perte)** | 0 % | **66.8813 %** | — |
| **Total** | | **96.5000 %** | 100 % | |

| Bande | Probabilité | Part de RTP |
|---|---|---|
| PERTE (x0) | 66.881 % | 0.00 % |
| RÉCUP. (x0.1-x0.9) | 8.000 % | 4.00 % |
| PETIT (x1-x4.9) | 21.232 % | 42.13 % |
| MOYEN (x5-x24.9) | 3.317 % | 21.87 % |
| GROS (x25-x99.9) | 0.509 % | 17.62 % |
| ÉNORME (x100-x999) | 0.059 % | 9.30 % |
| LÉGENDAIRE (x1000+) | 0.002 % | 1.57 % |

### UNHINGED (volatilité haute), max x5 000

BOSS FIGHT : EV = 35.4315x, fréquence 1 / 150, part de RTP = 23.621 %

| Source | Multiplicateur | Part de RTP | Probabilité | Fréquence |
|---|---|---|---|---|
| base | x1.5 | 4.500 % | 3.0000 % | 1 / 33 |
| base | x2 | 9.000 % | 4.5000 % | 1 / 22 |
| base | x3 *(équilibre)* | 13.379 % | 4.4597 % | 1 / 22 |
| base | x5 | 8.000 % | 1.6000 % | 1 / 62 |
| base | x10 | 8.000 % | 0.8000 % | 1 / 125 |
| base | x25 | 7.500 % | 0.3000 % | 1 / 333 |
| base | x50 | 7.000 % | 0.1400 % | 1 / 714 |
| base | x100 | 6.000 % | 0.0600 % | 1 / 1 667 |
| base | x250 | 5.000 % | 0.0200 % | 1 / 5 000 |
| base | x500 | 4.500 % | 0.0090 % | 1 / 11 111 |
| BOSS FIGHT | x5 | 1.500 % | 0.3000 % | 1 / 333 |
| BOSS FIGHT | x12 | 2.200 % | 0.1833 % | 1 / 545 |
| BOSS FIGHT | x30 | 3.025 % | 0.1008 % | 1 / 992 |
| BOSS FIGHT | x75 | 3.712 % | 0.0495 % | 1 / 2 020 |
| BOSS FIGHT | x200 | 4.290 % | 0.0215 % | 1 / 4 662 |
| BOSS FIGHT | x500 | 4.043 % | 0.0081 % | 1 / 12 369 |
| BOSS FIGHT | x1000 | 2.599 % | 0.0026 % | 1 / 38 480 |
| BOSS FIGHT | x2000 | 1.386 % | 0.0007 % | 1 / 144 300 |
| BOSS FIGHT | x5000 | 0.866 % | 0.0002 % | 1 / 577 201 |
| — | **x0 (perte)** | 0 % | **84.4447 %** | — |
| **Total** | | **96.5000 %** | 100 % | |

| Bande | Probabilité | Part de RTP |
|---|---|---|
| PERTE (x0) | 84.445 % | 0.00 % |
| RÉCUP. (x0.1-x0.9) | 0.000 % | 0.00 % |
| PETIT (x1-x4.9) | 11.960 % | 26.88 % |
| MOYEN (x5-x24.9) | 2.883 % | 19.70 % |
| GROS (x25-x99.9) | 0.590 % | 21.24 % |
| ÉNORME (x100-x999) | 0.119 % | 23.83 % |
| LÉGENDAIRE (x1000+) | 0.003 % | 4.85 % |

## 4.5 Échelles du BOSS FIGHT

Probabilités d'enchaînement **décroissantes** : chaque coup est plus dur que le précédent, et le suspense monte avec l'enjeu.

**GRUMPY**

| Palier | Multiplicateur | P(enchaîner le coup suivant) | P(atteindre ce palier) | P(finir ici) |
|---|---|---|---|---|
| 1 | x5 | 45 % | 100.000 % | 55.000 % |
| 2 | x12 | 35 % | 45.000 % | 29.250 % |
| 3 | x30 | 30 % | 15.750 % | 11.025 % |
| 4 | x75 | 25 % | 4.725 % | 3.544 % |
| 5 | x200 | K.O. (fin) | 1.181 % | 1.181 % |

EV du BOSS FIGHT = 14.5878x la mise

**FURIOUS**

| Palier | Multiplicateur | P(enchaîner le coup suivant) | P(atteindre ce palier) | P(finir ici) |
|---|---|---|---|---|
| 1 | x5 | 50 % | 100.000 % | 50.000 % |
| 2 | x12 | 45 % | 50.000 % | 27.500 % |
| 3 | x30 | 40 % | 22.500 % | 13.500 % |
| 4 | x75 | 35 % | 9.000 % | 5.850 % |
| 5 | x200 | 30 % | 3.150 % | 2.205 % |
| 6 | x500 | 25 % | 0.945 % | 0.709 % |
| 7 | x1000 | K.O. (fin) | 0.236 % | 0.236 % |

EV du BOSS FIGHT = 24.5538x la mise

**UNHINGED**

| Palier | Multiplicateur | P(enchaîner le coup suivant) | P(atteindre ce palier) | P(finir ici) |
|---|---|---|---|---|
| 1 | x5 | 55 % | 100.000 % | 45.000 % |
| 2 | x12 | 50 % | 55.000 % | 27.500 % |
| 3 | x30 | 45 % | 27.500 % | 15.125 % |
| 4 | x75 | 40 % | 12.375 % | 7.425 % |
| 5 | x200 | 35 % | 4.950 % | 3.218 % |
| 6 | x500 | 30 % | 1.732 % | 1.213 % |
| 7 | x1000 | 25 % | 0.520 % | 0.390 % |
| 8 | x2000 | 20 % | 0.130 % | 0.104 % |
| 9 | x5000 | K.O. (fin) | 0.026 % | 0.026 % |

EV du BOSS FIGHT = 35.4315x la mise

## 4.6 Rythme ressenti et sessions

**Propriété de design importante** : les moments forts (≥ x5) arrivent **à peu près au même rythme** dans les trois modes. Ce qui change, c'est ce qu'il y a entre eux (petits gains ou rien) et le plafond.

| | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| Gain ≥ x5 | 1 manche / 34 | 1 / 26 | 1 / 28 |
| Gain ≥ x25 | 1 / 408 | 1 / 175 | 1 / 140 |
| Gain ≥ x100 | 1 / 12 698 | 1 / 1 639 | 1 / 820 |
| P(10 pertes x0 d'affilée) | 0,02 % | 1,79 % | 18,4 % |
| P(20 pertes x0 d'affilée) | ~0 % | 0,03 % | 3,4 % |
| P(paiement < mise) | 57,9 % | 74,9 % | 84,4 % |

BOSS FIGHT : P(au moins un en 100 manches) = 1 − (149/150)^100 = **48,8 %**. En 300 manches (~15 min) : **86,6 %**.

**Monte Carlo** (10 000 sessions, mise fixe de 1, résultat net en mises) :

| Mode | Manches | P(finir gagnant) | P5 | Médiane | P95 |
|---|---|---|---|---|---|
| GRUMPY | 100 | 31,6 % | −30,8 | −9,0 | +36,5 |
| GRUMPY | 1 000 | 26,5 % | −145,8 | −50,4 | +133,2 |
| FURIOUS | 100 | 29,3 % | −50,5 | −19,0 | +78,5 |
| FURIOUS | 1 000 | 30,1 % | −265,0 | −84,5 | +374,5 |
| UNHINGED | 100 | 25,4 % | −70,0 | −35,5 | +162,0 |
| UNHINGED | 1 000 | 32,3 % | −423,0 | −140,5 | +659,5 |

Perte moyenne attendue : 3,5 mises par 100 manches, quel que soit le mode. À ~1 000 manches par heure, cela fait **~35 mises par heure**. C'est un argument pour que le turbo et l'autoplay restent soumis aux règles de juridiction.

## 4.7 Du modèle au lookup table Stake (poids entiers exacts)

Le poids total est le **PPCM des dénominateurs** des probabilités exactes. Tous les poids sont donc des entiers et le RTP est **exactement** 96,5 %, sans erreur d'arrondi. Totaux : GRUMPY 14 400 000 · FURIOUS 12 000 000 · UNHINGED 1 200 000 000 (tous < 2^64).

Exemple FURIOUS (lignes agrégées par multiplicateur : x5 = base + BOSS FIGHT) :

| payoutMultiplier (entier Stake) | Poids entier | RTP partiel exact |
|---|---|---|
| 0 | 8 025 750 | 0.0000 % |
| 50 | 960 000 | 4.0000 % |
| 150 | 1 040 000 | 13.0000 % |
| 200 | 1 027 850 | 17.1308 % |
| 300 | 480 000 | 12.0000 % |
| 500 | 280 000 | 11.6667 % |
| 1000 | 96 000 | 8.0000 % |
| 1200 | 22 000 | 2.2000 % |
| 2500 | 33 600 | 7.0000 % |
| 3000 | 10 800 | 2.7000 % |
| 5000 | 12 000 | 5.0000 % |
| 7500 | 4 680 | 2.9250 % |
| 10000 | 4 800 | 4.0000 % |
| 20000 | 1 764 | 2.9400 % |
| 50000 | 567 | 2.3625 % |
| 100000 | 189 | 1.5750 % |

RTP recalculé à partir des entiers = 1 158 000 000 / (100 × 12 000 000) = **96.500000 %**

En phase 2, chaque ligne sera **répartie entre plusieurs books** (un par combinaison script × variante, §3.6 de la partie 2). La somme des poids d'une ligne reste inchangée, donc le RTP aussi. Exemple : les 8 025 750 de poids de x0 sont répartis entre CLEAN_MISS (50 %), BACKFIRE (35 %) et TEASE (15 %), puis entre leurs variantes.

## 4.8 Changer le RTP cible (ex. 96,0 %)

Si Stake Engine ou un opérateur impose un autre RTP, on multiplie **toutes les probabilités de gain** par k = RTP' / RTP, et la perte absorbe la différence. La forme de la distribution est conservée.

- Pour 96,0 % : k = 0,960 / 0,965 = 0,99482.
- FURIOUS : hit rate 33,119 % → 32,947 %, P(perte) 66,881 % → 67,053 %, σ 6,81 → 6,79.
- Les fréquences de BOSS FIGHT passent de 1/150 à ~1/150,8. Si l'on veut garder exactement 1/150, on préfère réduire **seulement la ligne d'équilibre** (une ligne par mode, prévue pour cela).

Dans le code : modifier `TARGET_RTP` dans `math/model/bad_boss_math.py`. La ligne d'équilibre s'ajuste automatiquement.

## 4.9 Challenge des multiplicateurs proposés dans le brief

| Proposé | Décision | Raison |
|---|---|---|
| x0,5 | **Gardé** (GRUMPY, FURIOUS), présenté comme « RECOVERED » | Amortit la volatilité basse. Mais c'est une **perte nette** : jamais célébré (charte §3.6) |
| x0,8 | **Retiré** | Perte déguisée en gain (−20 %), confusion et aucun apport émotionnel |
| x1 | **Retiré** | « Rien ne se passe » : aucun intérêt visuel, et perçu comme une perte de temps |
| x1,2 | Gardé en GRUMPY (ligne d'équilibre) | Plus petit vrai gain. Donne le rythme « ça tape souvent » |
| x1,5 à x100 | Gardés selon le mode | Base des distributions |
| x250 / x500 | UNHINGED uniquement (base) | Réservés au mode volatil |
| x1 000 | FURIOUS (K.O. du bonus) et UNHINGED (palier 7) | |
| x5 000 | **Max win UNHINGED**, uniquement par K.O. en BOSS FIGHT | Récit clair : « pour x5 000, il faut mettre K.O. le boss géant » |
| Max win unique pour tout le jeu | **Non** : un max par mode (x200 / x1 000 / x5 000) | Affiché sur chaque carte, c'est la meilleure communication du risque |

Pourquoi pas x10 000 ? P(≥x10 000) et l'ETL10k restent loin des limites du SDK. Mais pour une fréquence raisonnable (~1/2 M), le palier coûterait ~0,5 % de RTP pour un gain rarissime. **À réévaluer** après les tests joueurs. C'est une simple modification de l'échelle d'UNHINGED.

## 4.10 Points non couverts par la documentation consultée

- **INFORMATION STAKE ENGINE REQUISE** : plage de RTP autorisée pour la publication (le SDK ne contient qu'un contrôle local nommé « 3-star » à 0,967 ; on ne sait pas s'il est bloquant ni ce que « 3-star » implique commercialement).
- **INFORMATION STAKE ENGINE REQUISE** : acceptation de **plusieurs modes à coût 1,0** représentant des profils de volatilité (et non des bonus buys). Le mécanisme est documenté (`mode` dans `/play`) mais aucun exemple officiel ne le montre pour cet usage.
- **INFORMATION STAKE ENGINE REQUISE** : nombre minimal ou recommandé de books distincts par mode, et exigences éventuelles sur la fréquence minimale du max win.
- **INFORMATION STAKE ENGINE REQUISE** : règles d'affichage obligatoires (RTP, max win, probabilités dans les règles du jeu).

## 4.11 Plan de la phase 2 (production des fichiers mathématiques)

1. Porter `TIERS` et l'échelle du BOSS FIGHT dans un jeu du math-sdk officiel (`games/bad_boss/`) avec 3 `BetMode` : `grumpy`, `furious`, `unhinged` (cost 1.0, rtp 0.965, max_win = x200 / x1 000 / x5 000).
2. Générer les books : un book par (multiplicateur × script × variante). Les events suivent le schéma de la partie 2, §3.9.
3. Écrire les poids entiers (§4.7), répartis entre les books.
4. Lancer `utils/rgs_verification.py` : format, correspondance books/CSV, contrôles de volatilité.
5. Publier `index.json` + 3 CSV + 3 `.jsonl.zst`.
