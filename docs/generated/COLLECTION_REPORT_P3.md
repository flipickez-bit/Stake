# COLLECTION BOOK — temps de découverte (PRODUCTION 3 GADGETS)

> Généré par `COLLECTION_REPORT=docs/generated/COLLECTION_REPORT_P3.md npx vitest run tests/unit/collection.test.ts` le 2026-09-28. Ne pas éditer.
> Calcul exact (contenu, rareté, scripts du book, distribution mathématique, BOSS FIGHT compris). La collection ne change aucune de ces
> probabilités : ces chiffres décrivent ce que le jeu montre déjà. Seul le gadget JOUÉ découvre ses cartes (jamais les autres plans).

Catalogue : **150 cartes** (GRUMPY 46 · FURIOUS 41 · UNHINGED 45 · BOSS FIGHT 18).

## Jalons — joueur qui répartit ses manches (1/3 par Rage Level, 1/3 par plan : 1/9 par gadget)

| Jalon | Manches (médiane) | Manches (90 %) |
|---|---:|---:|
| 5 DISCOVERED | 5 | 8 |
| 10 DISCOVERED | 10 | 15 |
| 25 DISCOVERED | 30 | 39 |
| 50 % | 188 | 227 |
| OFFICE MELTDOWN (≥ 4 avec chacun des 9 gadgets) | 86 | 123 |
| 100 % GRUMPY | 23961 | 66360 |
| 100 % FURIOUS | 11634 | 29288 |
| 100 % UNHINGED | 18844 | 38493 |
| 100 % BOSS FIGHT | 33013 | 56129 |
| 100 % COLLECTION | 42613 | 75260 |

## Règles étudiées pour OFFICE MELTDOWN (retenue : ≥ 4 avec chacun des 9 gadgets)

| Règle | Joueur réparti : médiane | 90 % | Joueur « plan préféré » (A 60 %, B 25 %, C 15 %) : médiane | 90 % | Joueur « plan A seulement » |
|---|---:|---:|---:|---:|---:|
| ≥ 2 avec chacun des 9 gadgets | 42 | 63 | 68 | 115 | jamais |
| ≥ 3 avec chacun des 9 gadgets | 62 | 90 | 105 | 166 | jamais |
| ≥ 4 avec chacun des 9 gadgets | 86 | 123 | 150 | 229 | jamais |
| ≥ 5 avec chacun des 9 gadgets | 119 | 173 | 209 | 317 | jamais |
| (ancienne règle) ≥ 8 dans chaque Rage Level | 37 | 50 | 39 | 54 | 69 |

Avec la règle retenue, un joueur qui ne joue que trois gadgets (un par niveau, ou les trois d'un niveau) ne débloque jamais OFFICE MELTDOWN.

## 100 % (accomplissement de collectionneur, cosmétique)

| Profil | 100 % : médiane | 90 % |
|---|---:|---:|
| Joueur réparti (1/9 par gadget) | 42613 | 75260 |
| Joueur « plan préféré » | 60296 | 104848 |

## Courbe de découverte (joueur réparti)

| Manches | 10 | 25 | 50 | 100 | 200 | 500 | 1 000 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Cartes découvertes (espérance, sur 150) | 9.3 | 21.0 | 36.1 | 55.8 | 76.2 | 98.1 | 110.5 |

## MODE CLASSIQUE (un gadget par Rage Level : Stake tant qu'A2 n'est pas confirmée, ou ?plans=off)

Catalogue : **51 cartes** (GRUMPY 15 · FURIOUS 14 · UNHINGED 16 · BOSS FIGHT 6). Joueur qui répartit ses manches (1/3 par Rage Level).

| Jalon | Manches (médiane) | Manches (90 %) |
|---|---:|---:|
| 25 DISCOVERED | 56 | 76 |
| 50 % | 62 | 85 |
| OFFICE MELTDOWN (≥ 8 dans GRUMPY, FURIOUS, UNHINGED) | 69 | 113 |
| 100 % COLLECTION | 11707 | 23746 |

## Par gadget (joueur réparti) : cartes de Rage Level découvertes (espérance)

| Gadget | Cartes | 25 manches | 50 | 100 | 200 |
|---|---:|---:|---:|---:|---:|
| SWIVEL SLINGSHOT | 15 | 2.4 | 4.1 | 6.5 | 8.8 |
| ESPRESSO BLASTER | 16 | 2.4 | 4.3 | 6.8 | 9.5 |
| COPIER CATAPULT | 15 | 2.3 | 4.0 | 6.3 | 8.7 |
| TRAPDOOR EXPRESS | 14 | 2.4 | 4.3 | 6.8 | 9.4 |
| CABINET DOMINO | 13 | 2.3 | 4.0 | 6.3 | 8.4 |
| WATER COOLER BOWLING | 14 | 2.3 | 4.0 | 6.2 | 8.5 |
| OFFICE ROCKET | 16 | 2.3 | 3.8 | 5.8 | 7.8 |
| CEILING SAFE | 13 | 2.2 | 3.6 | 5.2 | 6.9 |
| HVAC HURRICANE | 16 | 2.3 | 3.8 | 5.7 | 7.7 |

