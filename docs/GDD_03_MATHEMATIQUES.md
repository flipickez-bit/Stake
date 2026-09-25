# BAD BOSS — GDD partie 3 : mathématiques (étape 4, v2)

> **Source de vérité des paramètres : `config/rage_levels.json`** (RTP cible, fréquence du BOSS FIGHT, distributions, échelles). Aucun autre fichier ne doit recopier ces valeurs.
> **Tableaux complets** (générés, à ne pas modifier à la main) : [`docs/generated/MATH_REPORT.md`](generated/MATH_REPORT.md).
> Régénérer : `python3 math/model/bad_boss_math.py --write-report docs/generated/MATH_REPORT.md`.
> Statut : **validé** (étapes 1 à 4). `TARGET_RTP = 0.965`, **provisoire, validation Stake Engine requise avant publication**.

## Changements v1 → v2

| Changement | Raison | Impact |
|---|---|---|
| Échelle du BOSS FIGHT : x5 → x10 → x25 → x50 → x100 → x250 → x500 → x1 000 → x5 000 (auparavant x5 → x12 → x30 → x75 → x200 → x500 → x1 000 → x2 000 → x5 000) | Demande de validation : paliers plus lisibles, alignés sur les multiplicateurs de base | Probabilités d'enchaînement recalibrées pour **conserver l'espérance du bonus** (écart ≤ 1,4 %) **et la fréquence du max win**. La ligne d'équilibrage absorbe l'écart : **RTP toujours exactement 96,5 %** |
| GRUMPY : échelle x5 → x10 → x25 → x50 → x100 → x200 | x200 = max validé (hors échelle de référence) | σ 2,74 → 2,68 |
| FURIOUS : x5 → … → x1 000 (8 paliers) | | σ 6,81 → 6,67 |
| UNHINGED : x5 → … → x1 000 → x5 000 (9 paliers, sans x2 000) | Suppression du palier x2 000 | **σ 13,31 → 11,59**. Le saut final x1 000 → x5 000 devient le K.O. Si l'on veut retrouver σ ≈ 13, le levier est d'augmenter P(x5 000) (voir §4.8) |
| Paramètres déplacés dans `config/rage_levels.json` | Consigne : ne pas dupliquer `TARGET_RTP` | Le calculateur, puis le générateur de books et le client, lisent le même fichier |
| Ajout de l'analyse des séries de pertes et des temps d'attente | Demande de validation | §4.6 |

## 4.0 Contraintes Stake Engine qui s'appliquent aux maths (vérifiées)

| Contrainte | Conséquence |
|---|---|
| Résultats **pré-calculés** (books). Le RGS tire un book proportionnellement à son poids, dans le lookup table du mode | Le résultat est connu avant l'animation, et le BOSS FIGHT entier est dans le book |
| `payoutMultiplier` entier : 1150 = x11,5. Gain non nul ≥ 10 et multiple de 10 | Multiplicateurs par pas de x0,1 (le calculateur le vérifie) |
| Poids uint64, somme ≤ 2^64 − 1 | Poids entiers exacts (PPCM), totaux ≤ 7,2·10^10 |
| Contrôles « 3-star » du SDK : RTP ≤ 0,967, CVaR ≤ 800, ETL40 ≤ 0,9, P(≥x5 000) ≤ 1 %, P(≥x10 000) ≤ 0,5 % | Les 3 modes passent tous les contrôles |
| Avertissement si l'écart de RTP entre modes dépasse 0,05 | RTP identique sur les 3 modes |

## 4.1 Méthode : le budget de RTP

```
RTP              = Σ m_i · p_i
p_i              = r_i / m_i                   (r_i = part de RTP allouée au multiplicateur m_i)
BOSS FIGHT       : EV_BF = Σ_k L_k · P(finir au palier k)
                   P(finir au palier k) = (Π_{j<k} c_j) · (1 − c_k)     c = probabilités d'enchaînement
                   part_BF = f_BF · EV_BF                                f_BF = 1/150
Ligne d'équilibre : r_eq = RTP_cible − part_BF − Σ(autres r_i)
P(perte)         = 1 − Σ p_i
Variance         = Σ p_i · (m_i − RTP)²        σ = √Variance (en mises)
```

## 4.2 Exemple calculé pas à pas : FURIOUS (v2)

**a) BOSS FIGHT** : paliers x5, x10, x25, x50, x100, x250, x500, x1 000. Enchaînements : 55, 50, 45, 45, 40, 35, 30 %.

| Palier | P(finir ici) | Calcul | m × P |
|---|---|---|---|
| x5 | 0,45 | 1 × (1 − 0,55) | 2,25 |
| x10 | 0,275 | 0,55 × (1 − 0,50) | 2,75 |
| x25 | 0,15125 | 0,275 × (1 − 0,45) | 3,78125 |
| x50 | 0,0680625 | 0,12375 × (1 − 0,45) | 3,403125 |
| x100 | 0,0334125 | 0,0556875 × (1 − 0,40) | 3,34125 |
| x250 | 0,01447875 | 0,022275 × (1 − 0,35) | 3,6196875 |
| x500 | 0,005457375 | 0,00779625 × (1 − 0,30) | 2,7286875 |
| x1 000 (K.O.) | 0,002338875 | 0,00779625 × 0,30 | 2,338875 |
| **EV_BF** | Σ = 1 | | **24,212875** |

Part de RTP du bonus = 24,212875 / 150 = **16,142 %**.

**b) Base** : parts fixées de x0,5 = 4 %, x1,5 = 13 %, x3 = 12 %, x5 = 10 %, x10 = 8 %, x25 = 7 %, x50 = 5 %, x100 = 4 %, soit 63 % au total.
Ligne d'équilibre x2 : 96,5 − 16,142 − 63 = **17,358 %**, donc p(x2) = **8,6790 %**.

**c) Probabilités** : Σ base = 8 + 8,6667 + 8,6790 + 4 + 2 + 0,8 + 0,28 + 0,1 + 0,04 = 32,5657 %. BOSS FIGHT = 0,6667 %. **Hit rate = 33,232 %**, donc **P(perte) = 66,768 %**.

**d) Vérification** : Σ parts = 4 + 13 + 17,358 + 12 + 10 + 8 + 7 + 5 + 4 + 16,142 = **96,500 %**. RTP exact = 193/200.

**e) D'où vient la volatilité** (variance totale 44,51) : x0 → 0,62 · x0,5 à x10 → 1,48 · x25 à x100 → 11,80 · **x250 à x1 000 (BOSS FIGHT) → 30,61 (69 %)**. σ = **6,67**.

## 4.3 Synthèse des 3 Rage Levels (v2)

| Indicateur | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| RTP (exact) | 96,50 % | 96,50 % | 96,50 % |
| P(perte x0) | 41,86 % | 66,77 % | 84,46 % |
| Hit rate | 58,14 % | 33,23 % | 15,54 % |
| P(paiement ≥ mise) | 42,14 % | 25,23 % | 15,54 % |
| σ (en mises) | 2,68 | 6,67 | 11,59 |
| Max win | x200 | x1 000 | x5 000 |
| Fréquence max win | 1 / 17 637 | 1 / 64 133 | 1 / 549 715 |
| BOSS FIGHT | 1 / 150 | 1 / 150 | 1 / 150 |
| EV d'un BOSS FIGHT | x14,58 | x24,21 | x35,50 |
| P(BOSS FIGHT terminé à x5) | 55 % | 45 % | 30 % |
| CVaR 99,9 % (limite 800) | 35,4 | 86,7 | 182,7 |

Distributions complètes, bandes de gains et poids entiers : voir `docs/generated/MATH_REPORT.md`.

## 4.4 BOSS FIGHT : une famille de résultats, pas un « gros gain »

- Entrer en BOSS FIGHT garantit **x5 minimum** (jamais une perte, conformément à la charte : un signal fort n'est jamais suivi d'une perte).
- **Ce n'est pas un gros gain garanti** : 55 % (GRUMPY), 45 % (FURIOUS) et 30 % (UNHINGED) des combats s'arrêtent à x5.
- Le joueur voit l'échelle complète de son Rage Level, sans jamais savoir où il s'arrêtera.
- Tout le combat est dans le book : aucun cash-out, aucune décision réelle.

## 4.5 Rythme ressenti : les moments forts

| Nombre médian de manches jusqu'à… (inclus) | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| un gain ≥ x5 | 24 | 18 | 19 |
| un gain ≥ x25 | 252 | 115 | 86 |
| un gain ≥ x100 | 3 668 | 899 | 438 |
| un BOSS FIGHT | 104 | 104 | 104 |

Ce sont des médianes exactes (loi géométrique). Elles sont confirmées par une simulation de 3 000 000 manches par mode (écart ≤ 6 %, cf. rapport §5). Pour ≥ x100 en GRUMPY, l'écart atteint 6 % car l'échantillon ne compte que 589 événements.

Les moments forts (≥ x5) arrivent au **même rythme** dans les 3 modes. UNHINGED se distingue par le **vide entre eux** et par le plafond.

## 4.6 Séries de pertes (analyse demandée)

Perte sèche = x0. Calcul exact (chaîne de Markov). « À partir de maintenant » = probabilité que les k prochaines manches soient toutes perdues.

| P(k pertes x0 d'affilée, à partir de maintenant) | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| 5 | 1,29 % | 13,27 % | **42,98 %** |
| 10 | 0,017 % | 1,76 % | **18,47 %** |
| 15 | 0,0002 % | 0,23 % | **7,94 %** |
| 20 | ~0 % | 0,031 % | **3,41 %** |

| Sur une session de 300 manches (~15-20 min) | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| P(au moins une série ≥ 10 x0) | 2,8 % | 83,9 % | 100 % |
| P(au moins une série ≥ 15 x0) | 0,04 % | 20,3 % | 99,0 % |
| P(au moins une série ≥ 20 x0) | ~0 % | 2,9 % | **81,9 %** |
| Plus longue série typique (médiane) | 6 | 12 | **24** |

Si l'on compte les x0,5 comme des manches perdantes (paiement < mise), GRUMPY monte à une plus longue série typique de 9 sur 300 manches. FURIOUS monte à 16. UNHINGED ne change pas : il n'a pas de x0,5.

**Lecture :**
1. **UNHINGED fait vivre une longue traversée du désert à presque tous les joueurs.** Sur 300 manches, 82 % des joueurs subissent au moins 20 pertes sèches consécutives. À ~2,5 s par perte, cela représente **près d'une minute de ratés d'affilée**.
2. Ce n'est pas un défaut de calcul, c'est la signature d'un hit rate de 15,5 %. **Cela confirme ta priorité** : les animations x0 et l'anti-répétition sont critiques, surtout pour le pool UNHINGED.
3. **Aucune compensation adaptative** ne sera ajoutée (charte §3.6 : la présentation ne dépend jamais de l'historique).
4. **Levier disponible, non appliqué** : ajouter une ligne x1,2 dans UNHINGED, financée par la ligne d'équilibre x3. **σ reste inchangé**, car il dépend de la queue de distribution.

   | Variante UNHINGED | Hit rate | P(10 x0 d'affilée) | P(série ≥ 20 sur 300) | Plus longue série typique | σ |
   |---|---|---|---|---|---|
   | Actuelle | 15,5 % | 18,5 % | 81,9 % | 24 | 11,59 |
   | + x1,2 à 6 % du RTP | 18,5 % | 12,9 % | 60,7 % | 21 | 11,58 |
   | + x1,2 à 10 % du RTP | 20,5 % | 10,0 % | 45,9 % | 19 | 11,58 |

   Décision à prendre après les premiers tests joueurs.

## 4.7 Du modèle au lookup table Stake

Poids entiers exacts (PPCM des dénominateurs) : GRUMPY 90 000 000 · FURIOUS 1 200 000 000 · UNHINGED 72 000 000 000. Le RTP recalculé depuis les entiers vaut exactement 96,500000 % pour les 3 modes (détail dans le rapport §7).

En phase 2, chaque ligne est répartie entre plusieurs books (un par combinaison script × variante). Pour le BOSS FIGHT, c'est un book par chemin de combat, avec des variantes d'attaque. Le poids total de la ligne ne change pas, donc le RTP non plus.

## 4.8 Leviers d'ajustement (tous dans `config/rage_levels.json`)

| Besoin | Levier | Effet |
|---|---|---|
| Changer le RTP (ex. 96,0 %) | `target_rtp` | La ligne d'équilibre absorbe. Pour garder la forme, on peut aussi multiplier toutes les probabilités de gain par k = RTP'/RTP |
| Moins de séries de pertes en UNHINGED | Ajouter une ligne x1,2 (§4.6) | Hit rate en hausse, σ stable |
| Retrouver σ ≈ 13 en UNHINGED | Augmenter la dernière probabilité d'enchaînement (15 % → 30 %) | σ 11,59 → 13,34, P(x5 000) passe de ~1/550 000 à ~1/275 000, la part de RTP du bonus passe de 23,7 % à 24,4 % et la ligne x3 baisse d'autant |
| Changer la fréquence du BOSS FIGHT | `boss_fight_frequency` | Part de RTP du bonus proportionnelle |

## 4.9 Choix de multiplicateurs (rappel)

x0,8 et x1 sont retirés. x0,5 (« RECOVERED ») n'existe qu'en GRUMPY et FURIOUS, et n'est jamais célébré. Les max wins restent x200, x1 000 et x5 000. x10 000 n'est pas retenu (voir v1).

## 4.10 INFORMATION STAKE ENGINE REQUISE

- Plage de RTP autorisée et portée des contrôles « 3-star ».
- Acceptation de 3 modes à coût 1,0 comme niveaux de volatilité.
- Nombre minimal ou recommandé de books par mode, et exigences sur la fréquence du max win.
- Règles d'affichage (le RTP s'affiche si `jurisdiction.displayRTP` ; les autres mentions obligatoires sont à confirmer).

## 4.11 Plan de la phase 2

1. Jeu `games/bad_boss/` dans le math-sdk officiel, qui lit `config/rage_levels.json`.
2. Books : un par (multiplicateur × script × variante) pour la base, un par chemin de combat pour le BOSS FIGHT. Events selon le schéma de la partie 2, §3.9.
3. Poids entiers exacts répartis entre les books, puis `utils/rgs_verification.py`.
4. Publication de `index.json`, des 3 CSV et des 3 fichiers `.jsonl.zst`.
