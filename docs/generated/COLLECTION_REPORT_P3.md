# COLLECTION BOOK — temps de découverte (PRODUCTION 3 GADGETS)

> Généré par `COLLECTION_REPORT=docs/generated/COLLECTION_REPORT_P3.md npx vitest run tests/unit/collection.test.ts` le 2026-09-27. Ne pas éditer.
> Calcul exact (contenu, rareté, scripts du book, distribution mathématique, BOSS FIGHT compris). La collection ne change aucune de ces
> probabilités : ces chiffres décrivent ce que le jeu montre déjà. Seul le gadget JOUÉ découvre ses cartes (jamais les autres plans).

Catalogue : **147 cartes** (GRUMPY 46 · FURIOUS 41 · UNHINGED 42 · BOSS FIGHT 18).

## Jalons — joueur qui répartit ses manches (1/3 par Rage Level, 1/3 par plan : 1/9 par gadget)

| Jalon | Manches (médiane) | Manches (90 %) |
|---|---:|---:|
| 5 DISCOVERED | 5 | 8 |
| 10 DISCOVERED | 10 | 15 |
| 25 DISCOVERED | 30 | 39 |
| 50 % | 185 | 223 |
| OFFICE MELTDOWN (≥ 4 avec chacun des 9 gadgets) | 90 | 132 |
| 100 % GRUMPY | 23968 | 66360 |
| 100 % FURIOUS | 11642 | 29289 |
| 100 % UNHINGED | 15566 | 34990 |
| 100 % BOSS FIGHT | 12380 | 21048 |
| 100 % COLLECTION | 31710 | 69068 |

## Règles étudiées pour OFFICE MELTDOWN (retenue : ≥ 4 avec chacun des 9 gadgets)

| Règle | Joueur réparti : médiane | 90 % | Joueur « plan préféré » (A 60 %, B 25 %, C 15 %) : médiane | 90 % | Joueur « plan A seulement » |
|---|---:|---:|---:|---:|---:|
| ≥ 2 avec chacun des 9 gadgets | 42 | 64 | 69 | 117 | jamais |
| ≥ 3 avec chacun des 9 gadgets | 63 | 92 | 109 | 175 | jamais |
| ≥ 4 avec chacun des 9 gadgets | 90 | 132 | 161 | 261 | jamais |
| ≥ 5 avec chacun des 9 gadgets | 127 | 197 | 235 | 394 | jamais |
| (ancienne règle) ≥ 8 dans chaque Rage Level | 37 | 52 | 39 | 54 | 70 |

Avec la règle retenue, un joueur qui ne joue que trois gadgets (un par niveau, ou les trois d'un niveau) ne débloque jamais OFFICE MELTDOWN.

## 100 % (accomplissement de collectionneur, cosmétique)

| Profil | 100 % : médiane | 90 % |
|---|---:|---:|
| Joueur réparti (1/9 par gadget) | 31710 | 69068 |
| Joueur « plan préféré » | 34833 | 66452 |

## Courbe de découverte (joueur réparti)

| Manches | 10 | 25 | 50 | 100 | 200 | 500 | 1 000 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Cartes découvertes (espérance, sur 147) | 9.3 | 20.9 | 35.8 | 55.3 | 75.7 | 98.2 | 111.8 |

## MODE CLASSIQUE (un gadget par Rage Level : Stake tant qu'A2 n'est pas confirmée, ou ?plans=off)

Catalogue : **51 cartes** (GRUMPY 15 · FURIOUS 14 · UNHINGED 16 · BOSS FIGHT 6). Joueur qui répartit ses manches (1/3 par Rage Level).

| Jalon | Manches (médiane) | Manches (90 %) |
|---|---:|---:|
| 25 DISCOVERED | 55 | 75 |
| 50 % | 61 | 83 |
| OFFICE MELTDOWN (≥ 8 dans GRUMPY, FURIOUS, UNHINGED) | 70 | 113 |
| 100 % COLLECTION | 9844 | 22880 |

## Par gadget (joueur réparti) : cartes de Rage Level découvertes (espérance)

| Gadget | Cartes | 25 manches | 50 | 100 | 200 |
|---|---:|---:|---:|---:|---:|
| SWIVEL SLINGSHOT | 15 | 2.4 | 4.1 | 6.4 | 8.8 |
| ESPRESSO BLASTER | 16 | 2.4 | 4.2 | 6.8 | 9.5 |
| COPIER CATAPULT | 15 | 2.3 | 4.0 | 6.3 | 8.7 |
| TRAPDOOR EXPRESS | 14 | 2.4 | 4.3 | 6.8 | 9.4 |
| CABINET DOMINO | 13 | 2.3 | 4.0 | 6.3 | 8.4 |
| WATER COOLER BOWLING | 14 | 2.3 | 4.0 | 6.2 | 8.5 |
| OFFICE ROCKET | 16 | 2.3 | 3.8 | 5.8 | 7.8 |
| CEILING SAFE | 13 | 2.2 | 3.6 | 5.2 | 6.9 |
| HVAC HURRICANE | 13 | 2.1 | 3.4 | 4.9 | 6.5 |

