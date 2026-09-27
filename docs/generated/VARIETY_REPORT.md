# Variété et prévisibilité — BAD BOSS (variété V2)

> Généré par `VARIETY_REPORT=docs/generated/VARIETY_REPORT.md npx vitest run tests/unit/variety.test.ts` le 2026-09-27. Ne pas éditer.
> Calcul exact depuis le contenu, les poids de rareté cosmétique, la distribution des scripts du book (config/presentation_policy.json)
> et la distribution mathématique du Rage Level (hors BOSS FIGHT). La rareté ne modifie jamais les maths : elle choisit parmi des branches compatibles.

Poids de rareté : COMMON 100 · UNCOMMON 40 · RARE 12 · VERY_RARE 3.

## Durée moyenne d'une manche (hors BOSS FIGHT)

Manches tirées par le mock mathématique (graine fixe). Référence : contenu P05-A (12 branches). Limite testée : P05-A × 1.15.

| Gadget | Vitesse | Reveal moyen | Fin moyenne | P05-A (fin) | Écart |
|---|---|---:|---:|---:|---:|
| SWIVEL SLINGSHOT | normal | 2.56 s | 3.92 s | 3.53 s | +11 % |
| SWIVEL SLINGSHOT | turbo | 1.42 s | 2.35 s | 2.13 s | +10 % |
| ESPRESSO BLASTER | normal | 2.45 s | 3.81 s | — | — |
| ESPRESSO BLASTER | turbo | 1.36 s | 2.29 s | — | — |
| COPIER CATAPULT | normal | 2.21 s | 3.42 s | — | — |
| COPIER CATAPULT | turbo | 1.23 s | 2.07 s | — | — |
| TRAPDOOR EXPRESS | normal | 2.90 s | 4.09 s | 4.10 s | 0 % |
| TRAPDOOR EXPRESS | turbo | 1.61 s | 2.37 s | 2.37 s | 0 % |
| CABINET DOMINO | normal | 2.42 s | 3.45 s | — | — |
| CABINET DOMINO | turbo | 1.34 s | 2.01 s | — | — |
| WATER COOLER BOWLING | normal | 2.34 s | 3.35 s | — | — |
| WATER COOLER BOWLING | turbo | 1.30 s | 1.96 s | — | — |
| OFFICE ROCKET | normal | 3.04 s | 4.37 s | 4.26 s | +3 % |
| OFFICE ROCKET | turbo | 1.69 s | 2.48 s | 2.39 s | +4 % |
| CEILING SAFE | normal | 2.31 s | 3.26 s | — | — |
| CEILING SAFE | turbo | 1.28 s | 1.86 s | — | — |
| HVAC HURRICANE | normal | 2.38 s | 3.56 s | — | — |
| HVAC HURRICANE | turbo | 1.32 s | 2.03 s | — | — |

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

## ESPRESSO BLASTER (grumpy) — 18 branches

| Branche | Chemin visible avant la fin | Fin | Rareté | P / manche | 1re apparition (manches, médiane) | Vue en 50 / 100 / 200 manches |
|---|---|---|---|---:|---:|---|
| ESP-S1 Il attrape le gobelet | SHOT | PERTE | COMMON | 7.28 % | 9 | 98 % / 100 % / 100 % |
| ESP-S2 En plein visage | SHOT | GAIN | COMMON | 14.73 % | 4 | 100 % / 100 % / 100 % |
| ESP-S3 Surpression | SHOT | GROS GAIN | COMMON | 0.68 % | 101 | 29 % / 50 % / 75 % |
| ESP-S4 Latte art | SHOT | PERTE | VERY_RARE | 0.22 % | 317 | 10 % / 20 % / 35 % |
| ESP-S5 Espresso doré | SHOT | BOSS FIGHT | COMMON | (1/150 × part) | — | — / — / — |
| ESP-D1 Deux mains, deux cafés | SHOT › CATCH_TWICE | PERTE | UNCOMMON | 2.91 % | 23 | 77 % / 95 % / 100 % |
| ESP-D2 Le deuxième gobelet | SHOT › CATCH_TWICE | GAIN | UNCOMMON | 5.89 % | 11 | 95 % / 100 % / 100 % |
| ESP-J1 Panne de pression | JAM | PERTE | COMMON | 11.35 % | 6 | 100 % / 100 % / 100 % |
| ESP-J2 Geyser | JAM | GROS GAIN | UNCOMMON | 0.27 % | 254 | 13 % / 24 % / 42 % |
| ESP-J3 Café offert | JAM › PEEK | PERTE | COMMON | 7.63 % | 9 | 98 % / 100 % / 100 % |
| ESP-J4 À bout portant | JAM › PEEK | GAIN | COMMON | 14.31 % | 4 | 100 % / 100 % / 100 % |
| ESP-J5 Torréfaction dorée | JAM | BOSS FIGHT | UNCOMMON | (1/150 × part) | — | — / — / — |
| ESP-R1 Ricochet : dans la main | RICOCHET | PERTE | COMMON | 7.28 % | 9 | 98 % / 100 % / 100 % |
| ESP-R2 Ricochet : sur le crâne | RICOCHET | GAIN | COMMON | 14.73 % | 4 | 100 % / 100 % / 100 % |
| ESP-R3 Wendell, arrosé | RICOCHET › WENDELL | PERTE | RARE | 0.92 % | 75 | 37 % / 60 % / 84 % |
| ESP-R4 Wendell, ricochet | RICOCHET › WENDELL | GAIN | RARE | 1.28 % | 54 | 47 % / 72 % / 92 % |
| ESP-F1 Mousse de lait | FOAM | PERTE | UNCOMMON | 4.54 % | 15 | 90 % / 99 % / 100 % |
| ESP-F2 Glissade | FOAM | GAIN | UNCOMMON | 5.96 % | 11 | 95 % / 100 % / 100 % |

Branches distinctes attendues (même Rage Level, hors BOSS FIGHT) : 10 manches → 6.6 · 25 manches → 10.0 · 50 manches → 11.9 · 100 manches → 13.2 · 200 manches → 14.3.

Même branche deux fois de suite : perte → perte 18 %, gain → gain 21 %.

| Chemin visible | Profondeur | P(chemin | perte) | P(chemin | gain) | Rapport de vraisemblance | P(gain | chemin) (base 58 %) |
|---|---:|---:|---:|---:|---:|
| SHOT | 1 | 24.7 % | 36.8 % | 1.49 | 67 % |
| SHOT › CATCH_TWICE | 2 | 6.9 % | 10.2 % | 1.47 | 67 % |
| JAM | 1 | 45.1 % | 25.2 % | 0.56 | 43 % |
| JAM › PEEK | 2 | 18.1 % | 24.7 % | 1.37 | 65 % |
| RICOCHET | 1 | 19.5 % | 27.7 % | 1.42 | 66 % |
| RICOCHET › WENDELL | 2 | 2.2 % | 2.2 % | 1.02 | 58 % |
| FOAM | 1 | 10.8 % | 10.3 % | 0.96 | 57 % |

## COPIER CATAPULT (grumpy) — 17 branches

| Branche | Chemin visible avant la fin | Fin | Rareté | P / manche | 1re apparition (manches, médiane) | Vue en 50 / 100 / 200 manches |
|---|---|---|---|---:|---:|---|
| COP-L1 Retour à l'envoyeur | LAUNCH | PERTE | COMMON | 11.19 % | 6 | 100 % / 100 % / 100 % |
| COP-L2 Pluie de copies | LAUNCH | PERTE | COMMON | 8.02 % | 8 | 98 % / 100 % / 100 % |
| COP-L3 Lecture | LAUNCH | PERTE | UNCOMMON | 3.21 % | 21 | 80 % / 96 % / 100 % |
| COP-L4 Ramette | LAUNCH | GAIN | COMMON | 20.36 % | 3 | 100 % / 100 % / 100 % |
| COP-L5 Avalanche | LAUNCH | GROS GAIN | COMMON | 0.70 % | 99 | 29 % / 50 % / 75 % |
| COP-L7 Escadrille | LAUNCH | PERTE | VERY_RARE | 0.24 % | 288 | 11 % / 21 % / 38 % |
| COP-L6 Copie dorée | LAUNCH | BOSS FIGHT | COMMON | (1/150 × part) | — | — / — / — |
| COP-C1 Le COO l'emporte | LAUNCH › COO | PERTE | RARE | 1.67 % | 41 | 57 % / 81 % / 97 % |
| COP-C2 Le COO la lâche | LAUNCH › COO | GAIN | RARE | 2.44 % | 28 | 71 % / 92 % / 99 % |
| COP-B1 L'éventail | BLIZZARD | PERTE | UNCOMMON | 3.21 % | 21 | 80 % / 96 % / 100 % |
| COP-B2 Enseveli | BLIZZARD | GAIN | UNCOMMON | 8.15 % | 8 | 99 % / 100 % / 100 % |
| COP-B3 Tornade de papier | BLIZZARD | GROS GAIN | RARE | 0.08 % | 829 | 4 % / 8 % / 15 % |
| COP-J1 Un rot de papier | JAM | PERTE | COMMON | 11.19 % | 6 | 100 % / 100 % / 100 % |
| COP-J2 Tout le bac | JAM | GAIN | COMMON | 20.49 % | 3 | 100 % / 100 % / 100 % |
| COP-J3 Photocopie dorée | JAM | BOSS FIGHT | UNCOMMON | (1/150 × part) | — | — / — / — |
| COP-W1 Wendell répare : dans l'estomac | JAM › WENDELL_FIX | PERTE | UNCOMMON | 3.42 % | 20 | 82 % / 97 % / 100 % |
| COP-W2 Wendell répare : en plein vol | JAM › WENDELL_FIX | GAIN | UNCOMMON | 5.64 % | 12 | 95 % / 100 % / 100 % |

Branches distinctes attendues (même Rage Level, hors BOSS FIGHT) : 10 manches → 6.1 · 25 manches → 9.2 · 50 manches → 11.1 · 100 manches → 12.4 · 200 manches → 13.2.

Même branche deux fois de suite : perte → perte 20 %, gain → gain 28 %.

| Chemin visible | Profondeur | P(chemin | perte) | P(chemin | gain) | Rapport de vraisemblance | P(gain | chemin) (base 58 %) |
|---|---:|---:|---:|---:|---:|
| LAUNCH | 1 | 57.7 % | 40.6 % | 0.70 | 49 % |
| LAUNCH › COO | 2 | 4.0 % | 4.2 % | 1.07 | 59 % |
| BLIZZARD | 1 | 7.6 % | 14.2 % | 1.87 | 72 % |
| JAM | 1 | 34.7 % | 45.2 % | 1.30 | 64 % |
| JAM › WENDELL_FIX | 2 | 8.1 % | 9.7 % | 1.20 | 62 % |

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

## CABINET DOMINO (furious) — 15 branches

| Branche | Chemin visible avant la fin | Fin | Rareté | P / manche | 1re apparition (manches, médiane) | Vue en 50 / 100 / 200 manches |
|---|---|---|---|---:|---:|---|
| DOM-C1 Retour à l'envoyeur | CHAIN | PERTE | COMMON | 23.58 % | 3 | 100 % / 100 % / 100 % |
| DOM-C2 Écrasé | CHAIN | GAIN | COMMON | 9.53 % | 7 | 99 % / 100 % / 100 % |
| DOM-C3 Direct à l'ascenseur | CHAIN | GROS GAIN | COMMON | 1.19 % | 58 | 45 % / 70 % / 91 % |
| DOM-C4 Il souffle dessus | CHAIN | PERTE | COMMON | 11.04 % | 6 | 100 % / 100 % / 100 % |
| DOM-C5 Rembobinage | CHAIN | PERTE | VERY_RARE | 0.33 % | 209 | 15 % / 28 % / 48 % |
| DOM-C6 Dossier doré | CHAIN | BOSS FIGHT | COMMON | (1/150 × part) | — | — / — / — |
| DOM-S1 Ça tient | STALL | PERTE | COMMON | 11.04 % | 6 | 100 % / 100 % / 100 % |
| DOM-S2 Ça cède | STALL | GAIN | COMMON | 9.53 % | 7 | 99 % / 100 % / 100 % |
| DOM-W1 Wendell dessous | STALL › WENDELL | PERTE | UNCOMMON | 7.37 % | 9 | 98 % / 100 % / 100 % |
| DOM-W2 Wendell se baisse | STALL › WENDELL | GAIN | UNCOMMON | 2.85 % | 24 | 76 % / 94 % / 100 % |
| DOM-D1 Repose-pied | DRAWERS | PERTE | COMMON | 11.04 % | 6 | 100 % / 100 % / 100 % |
| DOM-D2 Croche-pied | DRAWERS | GAIN | COMMON | 9.53 % | 7 | 99 % / 100 % / 100 % |
| DOM-D3 Le levier de la trappe | DRAWERS | GROS GAIN | RARE | 0.14 % | 487 | 7 % / 13 % / 25 % |
| DOM-D4 Surf | DRAWERS | PERTE | RARE | 2.83 % | 24 | 76 % / 94 % / 100 % |
| DOM-D5 Tiroir doré | DRAWERS | BOSS FIGHT | UNCOMMON | (1/150 × part) | — | — / — / — |

Branches distinctes attendues (même Rage Level, hors BOSS FIGHT) : 10 manches → 6.1 · 25 manches → 8.8 · 50 manches → 10.1 · 100 manches → 11.0 · 200 manches → 11.6.

Même branche deux fois de suite : perte → perte 22 %, gain → gain 26 %.

| Chemin visible | Profondeur | P(chemin | perte) | P(chemin | gain) | Rapport de vraisemblance | P(gain | chemin) (base 33 %) |
|---|---:|---:|---:|---:|---:|
| CHAIN | 1 | 52.0 % | 32.7 % | 0.63 | 23 % |
| STALL | 1 | 27.4 % | 37.8 % | 1.38 | 40 % |
| STALL › WENDELL | 2 | 11.0 % | 8.7 % | 0.79 | 28 % |
| DRAWERS | 1 | 20.6 % | 29.5 % | 1.43 | 41 % |

## WATER COOLER BOWLING (furious) — 16 branches

| Branche | Chemin visible avant la fin | Fin | Rareté | P / manche | 1re apparition (manches, médiane) | Vue en 50 / 100 / 200 manches |
|---|---|---|---|---:|---:|---|
| BWL-S1 Saut de haie | STRAIGHT | PERTE | COMMON | 24.02 % | 3 | 100 % / 100 % / 100 % |
| BWL-S2 Au goulot | STRAIGHT | PERTE | COMMON | 12.80 % | 5 | 100 % / 100 % / 100 % |
| BWL-S3 Strike | STRAIGHT | GAIN | COMMON | 10.85 % | 6 | 100 % / 100 % / 100 % |
| BWL-S4 Strike : l'ascenseur | STRAIGHT | GROS GAIN | COMMON | 1.19 % | 58 | 45 % / 70 % / 91 % |
| BWL-S5 Eau dorée | STRAIGHT | BOSS FIGHT | COMMON | (1/150 × part) | — | — / — / — |
| BWL-S6 Retour au joueur | STRAIGHT | PERTE | VERY_RARE | 0.57 % | 120 | 25 % / 44 % / 68 % |
| BWL-P1 Marche arrière | STRAIGHT › PAUSE | PERTE | UNCOMMON | 5.12 % | 13 | 93 % / 99 % / 100 % |
| BWL-P2 Le dernier tour | STRAIGHT › PAUSE | GAIN | UNCOMMON | 4.09 % | 17 | 88 % / 98 % / 100 % |
| BWL-H1 Gouttière | HOOK | PERTE | COMMON | 12.80 % | 5 | 100 % / 100 % / 100 % |
| BWL-H2 Effet rétro | HOOK | GAIN | COMMON | 10.85 % | 6 | 100 % / 100 % / 100 % |
| BWL-W1 Wendell, quille | HOOK › WENDELL | PERTE | RARE | 2.30 % | 30 | 69 % / 90 % / 99 % |
| BWL-W2 Wendell saute | HOOK › WENDELL | GAIN | RARE | 0.99 % | 70 | 39 % / 63 % / 86 % |
| BWL-B1 Arrosage | BURST | PERTE | UNCOMMON | 9.61 % | 7 | 99 % / 100 % / 100 % |
| BWL-B4 La douche | BURST | GAIN | UNCOMMON | 4.34 % | 16 | 89 % / 99 % / 100 % |
| BWL-B2 La vague | BURST | GROS GAIN | UNCOMMON | 0.48 % | 145 | 21 % / 38 % / 62 % |
| BWL-B3 Pluie dorée | BURST | BOSS FIGHT | UNCOMMON | (1/150 × part) | — | — / — / — |

Branches distinctes attendues (même Rage Level, hors BOSS FIGHT) : 10 manches → 6.1 · 25 manches → 9.0 · 50 manches → 10.7 · 100 manches → 12.0 · 200 manches → 13.1.

Même branche deux fois de suite : perte → perte 23 %, gain → gain 25 %.

| Chemin visible | Profondeur | P(chemin | perte) | P(chemin | gain) | Rapport de vraisemblance | P(gain | chemin) (base 33 %) |
|---|---:|---:|---:|---:|---:|
| STRAIGHT | 1 | 63.2 % | 49.2 % | 0.78 | 28 % |
| STRAIGHT › PAUSE | 2 | 7.6 % | 12.5 % | 1.64 | 44 % |
| HOOK | 1 | 22.5 % | 36.1 % | 1.61 | 44 % |
| HOOK › WENDELL | 2 | 3.4 % | 3.0 % | 0.88 | 30 % |
| BURST | 1 | 14.3 % | 14.7 % | 1.03 | 33 % |

## OFFICE ROCKET (unhinged) — 18 branches

| Branche | Chemin visible avant la fin | Fin | Rareté | P / manche | 1re apparition (manches, médiane) | Vue en 50 / 100 / 200 manches |
|---|---|---|---|---:|---:|---|
| RKT-A1 Balade et atterrissage | IGNITE › ZIGZAG | PERTE | COMMON | 20.02 % | 3 | 100 % / 100 % / 100 % |
| RKT-A2 Zigzag, classeur | IGNITE › ZIGZAG | GAIN | COMMON | 3.62 % | 19 | 84 % / 97 % / 100 % |
| RKT-A3 Zigzag, fenêtre | IGNITE › ZIGZAG | GROS GAIN | COMMON | 1.16 % | 59 | 44 % / 69 % / 90 % |
| RKT-A4 Vol stationnaire | IGNITE | BOSS FIGHT | COMMON | (1/150 × part) | — | — / — / — |
| RKT-B1 Pétard mouillé | STALL | PERTE | COMMON | 20.02 % | 3 | 100 % / 100 % / 100 % |
| RKT-B2 Rallumage, plafond | STALL › REIGNITE | GAIN | COMMON | 3.62 % | 19 | 84 % / 97 % / 100 % |
| RKT-B3 WENDELL CEILING | STALL › REIGNITE › SMOKE | PERTE | COMMON | 19.58 % | 3 | 100 % / 100 % / 100 % |
| RKT-B9 Fumée : l'extincteur | STALL › REIGNITE › SMOKE | PERTE | VERY_RARE | 0.60 % | 115 | 26 % / 45 % / 70 % |
| RKT-B4 Fumée : B.B. au plafond | STALL › REIGNITE › SMOKE | GAIN | COMMON | 3.62 % | 19 | 84 % / 97 % / 100 % |
| RKT-B5 Fumée : le cratère | STALL › REIGNITE › SMOKE | GROS GAIN | RARE | 0.11 % | 646 | 5 % / 10 % / 19 % |
| RKT-B6 Fumée dorée | STALL › REIGNITE › SMOKE | BOSS FIGHT | UNCOMMON | (1/150 × part) | — | — / — / — |
| RKT-B7 Elle part sans lui | STALL › REIGNITE › MISS | PERTE | RARE | 2.95 % | 23 | 78 % / 95 % / 100 % |
| RKT-B8 COO fait demi-tour | STALL › REIGNITE › MISS | GAIN | RARE | 0.47 % | 148 | 21 % / 37 % / 61 % |
| RKT-C1 Coupe ventilateur | UP | PERTE | UNCOMMON | 8.01 % | 8 | 98 % / 100 % / 100 % |
| RKT-C2 Plafond direct | UP | GAIN | UNCOMMON | 0.86 % | 80 | 35 % / 58 % / 82 % |
| RKT-C3 Le toit, puis l'ascenseur : intact | UP › THROUGH_ROOF › ELEV_WAIT | PERTE | UNCOMMON | 13.84 % | 5 | 100 % / 100 % / 100 % |
| RKT-C4 Le toit, puis l'ascenseur : en miettes | UP › THROUGH_ROOF › ELEV_WAIT | GAIN | UNCOMMON | 1.45 % | 48 | 52 % / 77 % / 95 % |
| RKT-C5 Le toit, puis l'ascenseur : avalanche | UP › THROUGH_ROOF › ELEV_WAIT | GROS GAIN | RARE | 0.07 % | 1044 | 3 % / 6 % / 12 % |

Branches distinctes attendues (même Rage Level, hors BOSS FIGHT) : 10 manches → 5.6 · 25 manches → 8.2 · 50 manches → 10.1 · 100 manches → 11.9 · 200 manches → 13.3.

Même branche deux fois de suite : perte → perte 20 %, gain → gain 20 %.

| Chemin visible | Profondeur | P(chemin | perte) | P(chemin | gain) | Rapport de vraisemblance | P(gain | chemin) (base 15 %) |
|---|---:|---:|---:|---:|---:|
| IGNITE | 1 | 23.6 % | 31.9 % | 1.36 | 19 % |
| IGNITE › ZIGZAG | 2 | 23.6 % | 31.9 % | 1.36 | 19 % |
| STALL | 1 | 50.8 % | 52.2 % | 1.03 | 15 % |
| STALL › REIGNITE | 2 | 27.2 % | 52.2 % | 1.92 | 25 % |
| STALL › REIGNITE › SMOKE | 3 | 23.7 % | 24.9 % | 1.05 | 16 % |
| STALL › REIGNITE › MISS | 3 | 3.5 % | 3.1 % | 0.90 | 14 % |
| UP | 1 | 25.7 % | 15.9 % | 0.62 | 10 % |
| UP › THROUGH_ROOF | 2 | 16.3 % | 10.1 % | 0.62 | 10 % |
| UP › THROUGH_ROOF › ELEV_WAIT | 3 | 16.3 % | 10.1 % | 0.62 | 10 % |

## CEILING SAFE (unhinged) — 15 branches

| Branche | Chemin visible avant la fin | Fin | Rareté | P / manche | 1re apparition (manches, médiane) | Vue en 50 / 100 / 200 manches |
|---|---|---|---|---:|---:|---|
| SAFE-D1 Sur le crâne | DROP | GAIN | COMMON | 3.83 % | 18 | 86 % / 98 % / 100 % |
| SAFE-D2 Coup de talon | DROP | PERTE | COMMON | 24.90 % | 2 | 100 % / 100 % / 100 % |
| SAFE-D3 Boing | DROP | PERTE | COMMON | 16.18 % | 4 | 100 % / 100 % / 100 % |
| SAFE-D4 À travers le plancher | DROP | GROS GAIN | COMMON | 0.99 % | 70 | 39 % / 63 % / 86 % |
| SAFE-D5 Coffre doré | DROP | BOSS FIGHT | COMMON | (1/150 × part) | — | — / — / — |
| SAFE-S1 Par la fenêtre | SWING | PERTE | COMMON | 24.90 % | 2 | 100 % / 100 % / 100 % |
| SAFE-S2 Au passage | SWING | GAIN | COMMON | 3.83 % | 18 | 86 % / 98 % / 100 % |
| SAFE-S3 La fusée s'allume | SWING | GROS GAIN | UNCOMMON | 0.39 % | 175 | 18 % / 33 % / 55 % |
| SAFE-C1 Créneau du COO | SWING › COO | PERTE | RARE | 1.94 % | 35 | 62 % / 86 % / 98 % |
| SAFE-C2 Coup de patte | SWING › COO | GAIN | RARE | 0.48 % | 143 | 21 % / 38 % / 62 % |
| SAFE-L1 Café au coffre | LOWER | PERTE | COMMON | 16.18 % | 4 | 100 % / 100 % / 100 % |
| SAFE-L2 Le gant | LOWER | GAIN | COMMON | 3.83 % | 18 | 86 % / 98 % / 100 % |
| SAFE-L3 La porte | LOWER | GAIN | UNCOMMON | 1.61 % | 43 | 56 % / 80 % / 96 % |
| SAFE-L4 Poupées russes | LOWER | PERTE | VERY_RARE | 0.93 % | 75 | 37 % / 61 % / 84 % |
| SAFE-L5 Trésor doré | LOWER | BOSS FIGHT | UNCOMMON | (1/150 × part) | — | — / — / — |

Branches distinctes attendues (même Rage Level, hors BOSS FIGHT) : 10 manches → 5.1 · 25 manches → 7.2 · 50 manches → 8.9 · 100 manches → 10.5 · 200 manches → 11.8.

Même branche deux fois de suite : perte → perte 24 %, gain → gain 21 %.

| Chemin visible | Profondeur | P(chemin | perte) | P(chemin | gain) | Rapport de vraisemblance | P(gain | chemin) (base 15 %) |
|---|---:|---:|---:|---:|---:|
| DROP | 1 | 48.3 % | 32.2 % | 0.67 | 11 % |
| SWING | 1 | 31.6 % | 31.5 % | 1.00 | 15 % |
| SWING › COO | 2 | 2.3 % | 3.2 % | 1.41 | 20 % |
| LOWER | 1 | 20.1 % | 36.3 % | 1.81 | 24 % |

## HVAC HURRICANE (unhinged) — 15 branches

| Branche | Chemin visible avant la fin | Fin | Rareté | P / manche | 1re apparition (manches, médiane) | Vue en 50 / 100 / 200 manches |
|---|---|---|---|---:|---:|---|
| HVAC-G1 Tenir bon | GUST | PERTE | COMMON | 29.43 % | 2 | 100 % / 100 % / 100 % |
| HVAC-G2 Contre son bureau | GUST | GAIN | COMMON | 3.93 % | 17 | 87 % / 98 % / 100 % |
| HVAC-G3 Vol plané | GUST | GROS GAIN | COMMON | 0.93 % | 74 | 37 % / 61 % / 85 % |
| HVAC-W1 Wendell s'envole | GUST › WENDELL | PERTE | UNCOMMON | 6.16 % | 11 | 96 % / 100 % / 100 % |
| HVAC-W2 Wendell à la voile | GUST › WENDELL | GAIN | UNCOMMON | 1.62 % | 42 | 56 % / 81 % / 96 % |
| HVAC-T1 La tornade passe | TORNADO | PERTE | COMMON | 29.43 % | 2 | 100 % / 100 % / 100 % |
| HVAC-T2 Essorage | TORNADO | GAIN | COMMON | 3.93 % | 17 | 87 % / 98 % / 100 % |
| HVAC-T3 Le toit | TORNADO | GROS GAIN | UNCOMMON | 0.37 % | 185 | 17 % / 31 % / 53 % |
| HVAC-T4 Tornade dorée | TORNADO | BOSS FIGHT | COMMON | (1/150 × part) | — | — / — / — |
| HVAC-O1 Tout en place | TORNADO › ORBIT | PERTE | VERY_RARE | 0.53 % | 131 | 23 % / 41 % / 65 % |
| HVAC-O2 Bombardement | TORNADO › ORBIT | GAIN | VERY_RARE | 0.12 % | 569 | 6 % / 11 % / 22 % |
| HVAC-S1 Le mug s'envole | SUCK | PERTE | COMMON | 17.62 % | 4 | 100 % / 100 % / 100 % |
| HVAC-S2 Face contre la grille | SUCK | GAIN | COMMON | 4.06 % | 17 | 87 % / 98 % / 100 % |
| HVAC-S3 Le COO aspiré | SUCK | PERTE | RARE | 1.85 % | 37 | 61 % / 85 % / 98 % |
| HVAC-S4 Souffle doré | SUCK | BOSS FIGHT | UNCOMMON | (1/150 × part) | — | — / — / — |

Branches distinctes attendues (même Rage Level, hors BOSS FIGHT) : 10 manches → 4.8 · 25 manches → 6.9 · 50 manches → 8.6 · 100 manches → 10.0 · 200 manches → 11.2.

Même branche deux fois de suite : perte → perte 29 %, gain → gain 23 %.

| Chemin visible | Profondeur | P(chemin | perte) | P(chemin | gain) | Rapport de vraisemblance | P(gain | chemin) (base 15 %) |
|---|---:|---:|---:|---:|---:|
| GUST | 1 | 41.9 % | 43.3 % | 1.04 | 15 % |
| GUST › WENDELL | 2 | 7.2 % | 10.8 % | 1.50 | 21 % |
| TORNADO | 1 | 35.2 % | 29.6 % | 0.84 | 13 % |
| TORNADO › ORBIT | 2 | 0.6 % | 0.8 % | 1.31 | 19 % |
| SUCK | 1 | 22.9 % | 27.1 % | 1.18 | 17 % |

## Session mixte (1/3 des manches par Rage Level)

Branches distinctes attendues (hors BOSS FIGHT, sur 129) : 10 manches → 9.3 · 25 manches → 21.0 · 50 manches → 35.8 · 100 manches → 55.0 · 200 manches → 74.7.
Nouvelles branches attendues entre la 41e et la 50e manche : 5.4 ; entre la 91e et la 100e : 3.1.

