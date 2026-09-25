# Variété et prévisibilité — BAD BOSS (variété V2)

> Généré par `VARIETY_REPORT=docs/generated/VARIETY_REPORT.md npx vitest run tests/unit/variety.test.ts` le 2026-09-25. Ne pas éditer.
> Calcul exact depuis le contenu, les poids de rareté cosmétique, la distribution des scripts du book (config/presentation_policy.json)
> et la distribution mathématique du Rage Level (hors BOSS FIGHT). La rareté ne modifie jamais les maths : elle choisit parmi des branches compatibles.

Poids de rareté : COMMON 100 · UNCOMMON 40 · RARE 12 · VERY_RARE 3.

## SWIVEL SLINGSHOT (grumpy) — 17 branches

| Branche | Chemin visible avant la fin | Fin | Rareté | P / manche | 1re apparition (manches, médiane) | Vue en 50 / 100 / 200 manches |
|---|---|---|---|---:|---:|---|
| SLG-A1 Rappel élastique | LAUNCH | PERTE | COMMON | 7.45 % | 9 | 98 % / 100 % / 100 % |
| SLG-A2 Wendell amortit | LAUNCH | PERTE | UNCOMMON | 2.46 % | 28 | 71 % / 92 % / 99 % |
| SLG-A3 Le grand tour | LAUNCH | PERTE | VERY_RARE | 0.29 % | 238 | 14 % / 25 % / 44 % |
| SLG-A4 Classeur | LAUNCH | GAIN | COMMON | 16.35 % | 4 | 100 % / 100 % / 100 % |
| SLG-A5 Par la fenêtre | LAUNCH | GROS GAIN | COMMON | 0.81 % | 85 | 33 % / 56 % / 80 % |
| SLG-A6 Freinage furieux | LAUNCH | BOSS FIGHT | COMMON | (1/150 × part) | — | — / — / — |
| SLG-B1 Toupie | SPIN | PERTE | COMMON | 9.68 % | 7 | 99 % / 100 % / 100 % |
| SLG-B2 Perceuse | SPIN | GAIN | COMMON | 16.86 % | 4 | 100 % / 100 % / 100 % |
| SLG-B3 Extincteur | SPIN | GROS GAIN | UNCOMMON | 0.20 % | 347 | 10 % / 18 % / 33 % |
| SLG-C1 BACKFIRE : l'ordinateur | BACKFIRE › PHEW | PERTE | COMMON | 6.15 % | 11 | 96 % / 100 % / 100 % |
| SLG-C2 Mug vide, boomerang | BACKFIRE › PHEW › SIP › SIP_EMPTY | GAIN | COMMON | 16.86 % | 4 | 100 % / 100 % / 100 % |
| SLG-C3 Mug vide, la vitre | BACKFIRE › PHEW › SIP › SIP_EMPTY | PERTE | COMMON | 8.38 % | 8 | 99 % / 100 % / 100 % |
| SLG-C4 Intact. LE SIP. | BACKFIRE › PHEW › SIP | PERTE | UNCOMMON | 3.87 % | 18 | 86 % / 98 % / 100 % |
| SLG-D1 Ascenseur : intact | ELEVATOR › ELEV_WAIT | PERTE | UNCOMMON | 3.87 % | 18 | 86 % / 98 % / 100 % |
| SLG-D2 Ascenseur : en miettes | ELEVATOR › ELEV_WAIT | GAIN | UNCOMMON | 6.74 % | 10 | 97 % / 100 % / 100 % |
| SLG-D3 Ascenseur : avalanche | ELEVATOR › ELEV_WAIT | GROS GAIN | RARE | 0.03 % | 2185 | 2 % / 3 % / 6 % |
| SLG-D4 Ascenseur doré | ELEVATOR › ELEV_WAIT | BOSS FIGHT | UNCOMMON | (1/150 × part) | — | — / — / — |

Branches distinctes attendues (même Rage Level, hors BOSS FIGHT) : 10 manches → 6.3 · 25 manches → 9.3 · 50 manches → 10.9 · 100 manches → 11.9 · 200 manches → 12.6.

Même branche deux fois de suite : perte → perte 17 %, gain → gain 26 %.

| Chemin visible | Profondeur | P(chemin | perte) | P(chemin | gain) | Rapport de vraisemblance | P(gain | chemin) (base 58 %) |
|---|---:|---:|---:|---:|---:|
| LAUNCH | 1 | 24.2 % | 29.7 % | 1.23 | 63 % |
| SPIN | 1 | 23.0 % | 29.5 % | 1.28 | 64 % |
| BACKFIRE | 1 | 43.7 % | 29.1 % | 0.67 | 48 % |
| BACKFIRE › PHEW | 2 | 43.7 % | 29.1 % | 0.67 | 48 % |
| BACKFIRE › PHEW › SIP | 3 | 29.1 % | 29.1 % | 1.00 | 58 % |
| BACKFIRE › PHEW › SIP › SIP_EMPTY | 4 | 19.9 % | 29.1 % | 1.47 | 67 % |
| ELEVATOR | 1 | 9.2 % | 11.7 % | 1.27 | 64 % |
| ELEVATOR › ELEV_WAIT | 2 | 9.2 % | 11.7 % | 1.27 | 64 % |

## TRAPDOOR EXPRESS (furious) — 16 branches

| Branche | Chemin visible avant la fin | Fin | Rareté | P / manche | 1re apparition (manches, médiane) | Vue en 50 / 100 / 200 manches |
|---|---|---|---|---:|---:|---|
| TRP-A1 Marche sur le vide | HOVER | PERTE | COMMON | 7.95 % | 8 | 98 % / 100 % / 100 % |
| TRP-A2 Au revoir | HOVER › FALL | GAIN | COMMON | 8.54 % | 8 | 99 % / 100 % / 100 % |
| TRP-A3 Douze étages | HOVER › FALL | GROS GAIN | COMMON | 1.25 % | 55 | 47 % / 72 % / 92 % |
| TRP-A4 Rebond | HOVER › FALL | PERTE | COMMON | 11.07 % | 6 | 100 % / 100 % / 100 % |
| TRP-A5 COO le repêche | HOVER | PERTE | VERY_RARE | 0.33 % | 208 | 15 % / 28 % / 49 % |
| TRP-A6 Remontée dorée | HOVER › FALL | BOSS FIGHT | COMMON | (1/150 × part) | — | — / — / — |
| TRP-B1 TEASE : la cravate | DROP › TIE_CATCH › WENDELL_HELP | PERTE | COMMON | 11.07 % | 6 | 100 % / 100 % / 100 % |
| TRP-B2 La cravate cède | DROP › TIE_CATCH › WENDELL_HELP | GAIN | COMMON | 5.85 % | 11 | 95 % / 100 % / 100 % |
| TRP-B3 Remonte seul, DING | DROP › TIE_CATCH | PERTE | UNCOMMON | 4.43 % | 15 | 90 % / 99 % / 100 % |
| TRP-B4 Ascenseur : intact | DROP › ELEV_WAIT | PERTE | UNCOMMON | 11.15 % | 6 | 100 % / 100 % / 100 % |
| TRP-B5 Ascenseur : en miettes | DROP › ELEV_WAIT | GAIN | COMMON | 8.54 % | 8 | 99 % / 100 % / 100 % |
| TRP-B6 Ascenseur : avalanche | DROP › ELEV_WAIT | GROS GAIN | RARE | 0.07 % | 934 | 4 % / 7 % / 14 % |
| TRP-B7 Ascenseur doré | DROP › ELEV_WAIT | BOSS FIGHT | UNCOMMON | (1/150 × part) | — | — / — / — |
| TRP-C1 Mug vide, trappe | JAM › SIP › SIP_EMPTY | GAIN | COMMON | 8.54 % | 8 | 99 % / 100 % / 100 % |
| TRP-C2 Mug vide, Wendell | JAM › SIP › SIP_EMPTY | PERTE | COMMON | 16.80 % | 4 | 100 % / 100 % / 100 % |
| TRP-C3 Rien. LE SIP. | JAM › SIP | PERTE | UNCOMMON | 4.43 % | 15 | 90 % / 99 % / 100 % |

Branches distinctes attendues (même Rage Level, hors BOSS FIGHT) : 10 manches → 6.6 · 25 manches → 9.9 · 50 manches → 11.3 · 100 manches → 12.0 · 200 manches → 12.5.

Même branche deux fois de suite : perte → perte 17 %, gain → gain 24 %.

| Chemin visible | Profondeur | P(chemin | perte) | P(chemin | gain) | Rapport de vraisemblance | P(gain | chemin) (base 33 %) |
|---|---:|---:|---:|---:|---:|
| HOVER | 1 | 28.8 % | 29.9 % | 1.04 | 34 % |
| HOVER › FALL | 2 | 16.5 % | 29.9 % | 1.81 | 47 % |
| DROP | 1 | 39.6 % | 44.1 % | 1.11 | 35 % |
| DROP › TIE_CATCH | 2 | 23.1 % | 17.8 % | 0.77 | 27 % |
| DROP › TIE_CATCH › WENDELL_HELP | 3 | 16.5 % | 17.8 % | 1.08 | 35 % |
| DROP › ELEV_WAIT | 2 | 16.6 % | 26.3 % | 1.58 | 44 % |
| JAM | 1 | 31.6 % | 26.0 % | 0.82 | 29 % |
| JAM › SIP | 2 | 31.6 % | 26.0 % | 0.82 | 29 % |
| JAM › SIP › SIP_EMPTY | 3 | 25.0 % | 26.0 % | 1.04 | 34 % |

## OFFICE ROCKET (unhinged) — 18 branches

| Branche | Chemin visible avant la fin | Fin | Rareté | P / manche | 1re apparition (manches, médiane) | Vue en 50 / 100 / 200 manches |
|---|---|---|---|---:|---:|---|
| RKT-A1 Balade et atterrissage | IGNITE › ZIGZAG | PERTE | COMMON | 14.81 % | 4 | 100 % / 100 % / 100 % |
| RKT-A2 Zigzag, classeur | IGNITE › ZIGZAG | GAIN | COMMON | 3.62 % | 19 | 84 % / 97 % / 100 % |
| RKT-A3 Zigzag, fenêtre | IGNITE › ZIGZAG | GROS GAIN | COMMON | 1.16 % | 59 | 44 % / 69 % / 90 % |
| RKT-A4 Vol stationnaire | IGNITE | BOSS FIGHT | COMMON | (1/150 × part) | — | — / — / — |
| RKT-B1 Pétard mouillé | STALL | PERTE | COMMON | 14.81 % | 4 | 100 % / 100 % / 100 % |
| RKT-B2 Rallumage, plafond | STALL › REIGNITE | GAIN | COMMON | 3.62 % | 19 | 84 % / 97 % / 100 % |
| RKT-B3 WENDELL CEILING | STALL › REIGNITE › SMOKE | PERTE | COMMON | 19.58 % | 3 | 100 % / 100 % / 100 % |
| RKT-B9 Fumée : l'extincteur | STALL › REIGNITE › SMOKE | PERTE | COMMON | 14.81 % | 4 | 100 % / 100 % / 100 % |
| RKT-B4 Fumée : B.B. au plafond | STALL › REIGNITE › SMOKE | GAIN | COMMON | 3.62 % | 19 | 84 % / 97 % / 100 % |
| RKT-B5 Fumée : le cratère | STALL › REIGNITE › SMOKE | GROS GAIN | RARE | 0.11 % | 646 | 5 % / 10 % / 19 % |
| RKT-B6 Fumée dorée | STALL › REIGNITE › SMOKE | BOSS FIGHT | UNCOMMON | (1/150 × part) | — | — / — / — |
| RKT-B7 Elle part sans lui | STALL › REIGNITE › MISS | PERTE | RARE | 2.78 % | 25 | 76 % / 94 % / 100 % |
| RKT-B8 COO fait demi-tour | STALL › REIGNITE › MISS | GAIN | RARE | 0.47 % | 148 | 21 % / 37 % / 61 % |
| RKT-C1 Coupe ventilateur | UP | PERTE | UNCOMMON | 5.92 % | 11 | 95 % / 100 % / 100 % |
| RKT-C2 Plafond direct | UP | GAIN | UNCOMMON | 0.86 % | 80 | 35 % / 58 % / 82 % |
| RKT-C3 Le toit, puis l'ascenseur : intact | UP › THROUGH_ROOF › ELEV_WAIT | PERTE | UNCOMMON | 12.31 % | 5 | 100 % / 100 % / 100 % |
| RKT-C4 Le toit, puis l'ascenseur : en miettes | UP › THROUGH_ROOF › ELEV_WAIT | GAIN | UNCOMMON | 1.45 % | 48 | 52 % / 77 % / 95 % |
| RKT-C5 Le toit, puis l'ascenseur : avalanche | UP › THROUGH_ROOF › ELEV_WAIT | GROS GAIN | RARE | 0.07 % | 1044 | 3 % / 6 % / 12 % |

Branches distinctes attendues (même Rage Level, hors BOSS FIGHT) : 10 manches → 6.0 · 25 manches → 8.9 · 50 manches → 10.8 · 100 manches → 12.4 · 200 manches → 13.6.

Même branche deux fois de suite : perte → perte 17 %, gain → gain 20 %.

| Chemin visible | Profondeur | P(chemin | perte) | P(chemin | gain) | Rapport de vraisemblance | P(gain | chemin) (base 15 %) |
|---|---:|---:|---:|---:|---:|
| IGNITE | 1 | 17.4 % | 31.9 % | 1.83 | 24 % |
| IGNITE › ZIGZAG | 2 | 17.4 % | 31.9 % | 1.83 | 24 % |
| STALL | 1 | 61.1 % | 52.2 % | 0.85 | 13 % |
| STALL › REIGNITE | 2 | 43.7 % | 52.2 % | 1.19 | 17 % |
| STALL › REIGNITE › SMOKE | 3 | 40.4 % | 24.9 % | 0.62 | 10 % |
| STALL › REIGNITE › MISS | 3 | 3.3 % | 3.1 % | 0.95 | 14 % |
| UP | 1 | 21.4 % | 15.9 % | 0.74 | 12 % |
| UP › THROUGH_ROOF | 2 | 14.5 % | 10.1 % | 0.70 | 11 % |
| UP › THROUGH_ROOF › ELEV_WAIT | 3 | 14.5 % | 10.1 % | 0.70 | 11 % |

## Session mixte (1/3 des manches par Rage Level)

Branches distinctes attendues (hors BOSS FIGHT, sur 45) : 10 manches → 8.5 · 25 manches → 16.6 · 50 manches → 24.0 · 100 manches → 30.3 · 200 manches → 34.6.
Nouvelles branches attendues entre la 41e et la 50e manche : 2.4 ; entre la 91e et la 100e : 0.8.

