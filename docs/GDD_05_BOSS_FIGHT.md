# BAD BOSS — GDD partie 5 : le BOSS FIGHT (étape 6)

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

> Paramètres mathématiques : `config/rage_levels.json` (source de vérité). Chiffres générés : `docs/generated/MATH_REPORT.md`.
> Règle absolue : **le combat entier est dans le book renvoyé par `/wallet/play`**. Le joueur ne décide rien qui change le gain.

> **VERSION EN VIGUEUR (2026-09-28) : 8 TOURS GRATUITS, 1 manche sur 400.** Demande utilisateur : « faire des tours gratuits
> avec les bonus, en mettre moins, mais qu'ils aient une vraie valeur ». Le §6.FR ci-dessous fait foi. Les §6.0 à §6.9
> décrivent l'**ancienne échelle** (1/150, attaques jusqu'au premier coup bloqué) et restent comme historique de conception :
> l'entrée par gadget, GIGA-BOTTOMLINE, la musique et les deux fins sont conservées.

---

## 6.FR BOSS FIGHT = 8 TOURS GRATUITS (version en vigueur)

### Ce que Stake Engine propose (recherche du 2026-09-28)

| Fait | Source |
|---|---|
| Un jeu Stake Engine est **sans état** : chaque mise est indépendante des précédentes ; pas de jackpot, de gamble, de « continuation » ni de cash-out anticipé. Des tours gratuits ne peuvent donc **pas** être reportés sur les mises suivantes. | [Approval Guidelines](https://stake-engine.com/docs/approval-guidelines) |
| Les **free spins** du math-sdk se jouent **dans le même book** que la mise qui les déclenche : un seul `/wallet/play`, un seul `payoutMultiplier` (le total), des événements `freeSpinTrigger` → `updateFreeSpin` (compteur) → `freeSpinEnd`. | [math-sdk : Configs](https://stakeengine.github.io/math-sdk/math_docs/gamestate_section/configuration_section/config_overview/), [Adding New Events](https://stakeengine.github.io/math-sdk/fe_docs/steps/) |
| La fréquence du bonus se règle par les quotas de `Distribution` (`force_freegame`), avec un plafond (`wincap`). | [math-sdk : Distribution](https://stakeengine.github.io/math-sdk/math_docs/gamestate_section/configuration_section/betmode_dist/) |
| Le front affiche un **compteur de tours** (`freeSpinCounterShow` / `freeSpinCounterUpdate`), une intro et une outro. | [web-sdk](https://github.com/StakeEngine/web-sdk) |
| L'**achat de bonus** est un mode à part (ex. coût 100x, `is_buybonus`), désactivable par juridiction (`disabledBuyFeature`). **Non retenu ici** (non demandé). | [math-sdk : BetMode](https://stakeengine.github.io/math-sdk/math_docs/gamestate_section/configuration_section/betmode_overview/) |

**Conséquence pour BAD BOSS** : le BOSS FIGHT reste le déclencheur (entrées par gadget, musique), et il donne **8 tours gratuits
joués dans la même manche**, exactement comme des free spins Stake : un book, un Play, un EndRound, un total.

### Règles (`config/rage_levels.json`, `free_rounds_doc`)

- **8 tours gratuits.** Chaque tour : **HIT** avec la probabilité P(HIT) du niveau, sinon **BLOCKED** (0).
- **Gain d'un HIT = base × RAGE.** La base est tirée dans la table du niveau. La **RAGE** commence à **x1** et **monte de +1 après chaque HIT** : plus B.B. encaisse, plus les coups suivants valent cher.
- **Jamais de bonus nul** : si les 7 premiers tours sont bloqués, le 8e est un HIT.
- **Plafond** : le max win du niveau (x200 / x1 000 / x5 000). Le gain du coup qui l'atteint est écrêté, et le bonus s'arrête là.
- Tout le déroulé (issue, base, rage, gain de chaque tour) est **écrit dans le book** ; le client le vérifie strictement (`parseFreeRounds`, `src/domain/outcome.ts`) et ne tire rien.

### Mathématiques (calcul exact : `math/model/bad_boss_math.py`, rapport `docs/generated/MATH_REPORT.md` §3)

**Pourquoi 1/400 (justification de la modification de fréquence).** Demande : moins de bonus, plus de valeur. On garde la **part de RTP**
du bonus (≈ 9,7 / 16,1 / 23,8 %) et on la concentre sur 2,67 fois moins de bonus : la valeur moyenne d'un bonus est donc multipliée
par ≈ 2,7. Le RTP reste **exactement 96,5 %** (la ligne d'équilibre de la table de base absorbe l'écart, +0,05 point au plus).

| | GRUMPY | FURIOUS | UNHINGED |
|---|---:|---:|---:|
| Fréquence (avant → après) | 1/150 → **1/400** | 1/150 → **1/400** | 1/150 → **1/400** |
| P(HIT) par tour | 75 % | 70 % | 65 % |
| Bases d'un HIT | x1 à x50 | x1 à x250 | x1 à x1 000 |
| **Valeur moyenne d'un bonus** (avant → après) | x14,6 → **x38,7** | x24,2 → **x64,4** | x35,5 → **x95,4** |
| Médiane d'un bonus (avant → après) | x5 → **x33** | x10 → **x38** | x10 → **x37** |
| P10 / P90 d'un bonus | x16 / x63 | x15 / x114 | x13 / x155 |
| P(bonus < x10) | 1,8 % | 2,8 % | 4,9 % |
| Plafond atteint (par bonus) | 1 / 169 | 1 / 188 | 1 / 741 |
| Max win par manche (avant → après) | 1/17 637 → 1/67 622 | 1/64 133 → 1/75 250 | 1/549 715 → **1/296 419** |
| Part de RTP du bonus | 9,67 % | 16,10 % | 23,85 % |
| Attente médiane / P90 (manches) | 277 / 920 | 277 / 920 | 277 / 920 |
| Écart-type par manche (avant → après) | 2,69 → 2,73 | 6,67 → 6,92 | 11,6 → 17,5 |
| Contrôles du SDK (RTP, CVaR, ETL40, P5k, P10k) | OK | OK | OK |

Effets de bord, assumés et visibles : le taux de gain par manche baisse légèrement (58,1 → 57,8 % ; 33,2 → 32,8 % ; 15,5 → 15,1 %),
car les bonus sont plus rares ; la volatilité d'UNHINGED augmente (le x5 000 devient plus fréquent). La lookup table ne peut plus
avoir des poids EXACTS sur 64 bits (produits de 8 tirages) : ils sont arrondis sur 10^15, écart de RTP ≤ 4·10⁻¹² (rapport §7).

### Mise en scène

- **Entrée** : inchangée (2 entrées de BOSS FIGHT par gadget, GIGA-BOTTOMLINE, musique de combat).
- **Tours** : un lancer par tour avec les projectiles du gadget. L'issue reste inconnue pendant ~700 ms (tronc commun du lancer), puis HIT (choc, DING de plus en plus aigu avec la rage) ou BLOCKED (B.B. renvoie le projectile).
- **HUD** (`src/app/BfLadder.svelte`) : **FREE ROUNDS n/8**, points de progression, **RAGE xN**, cumul touché, « +xN » au choc ou « BLOCKED ». Tout est piloté par les signaux de la séquence (`frRound`, `frHit`, `bfBlocked`) : jamais en avance sur l'image.
- **Fins** : le dernier tour touche → K.O. (confettis) ; sinon B.B. rit puis boude. Le total est révélé une seule fois (signal `reveal`).
- **Durée** : ≈ 1,26 s par tour en normal, ≈ 14 s pour un bonus complet ; turbo et super turbo compressent comme avant.
- **Reprise / replay** : le book contient tout ; recharger en plein bonus rejoue le même déroulé, sans nouvelle mise (test `presenterFlow`).

### Questions pour Stake (INFORMATION STAKE ENGINE REQUISE)

- Le format des événements (`bossFight` avec `rounds[]`) est propre à BAD BOSS (le champ `events` est libre) : confirmer qu'aucun nom d'événement `freeSpin*` n'est exigé pour un jeu instantané.
- Achat de bonus : non prévu. À discuter seulement si Stake le recommande pour ce type de jeu.

---

## 6.0 La promesse (historique : ancienne échelle, 1/150)

Le boss boit une gorgée de trop de son « Executive Blend » et devient **GIGA-BOTTOMLINE** : trois fois sa taille, la tête dans les dalles du plafond, le mug devenu bouclier. Le joueur l'attaque coup après coup. Chaque coup qui passe fait monter le gain d'un palier. Le premier coup bloqué termine le combat. Au sommet de l'échelle, c'est le **K.O.**, et ce jour-là, **le mug se fêle pour la première fois**.

Ce que le BOSS FIGHT est :
- une **famille rare de résultats** (1 manche sur 150, dans les 3 Rage Levels) ;
- un gain **d'au moins x5**, jamais une perte.

Ce qu'il n'est pas :
- une promesse de gros gain : **30 à 55 % des combats s'arrêtent à x5**.

Quand il apparaît, le joueur sait qu'un événement spécial est arrivé. Il ne connaît toujours pas le résultat final.

## 6.1 Règles et mathématiques

| | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| Échelle | x5 → x10 → x25 → x50 → x100 → **x200** | x5 → x10 → x25 → x50 → x100 → x250 → x500 → **x1 000** | x5 → x10 → x25 → x50 → x100 → x250 → x500 → x1 000 → **x5 000** |
| Nombre de paliers | 6 | 8 | 9 |
| P(enchaîner) palier par palier | 45, 45, 40, 35, 30 % | 55, 50, 45, 45, 40, 35, 30 % | 70, 60, 55, 45, 35, 25, 20, 15 % |
| P(finir à x5) | 55 % | 45 % | 30 % |
| P(K.O.) | 0,85 % | 0,23 % | 0,027 % |
| EV d'un combat | x14,58 | x24,21 | x35,50 |
| Nombre moyen d'attaques | 1,76 | 2,03 | 2,50 |
| Durée moyenne / médiane (normal) | 8,0 s / 6,4 s | 8,6 s / 8,4 s | 9,5 s / 8,4 s |
| Durée max (K.O.) | 18,0 s | 22,9 s | 25,5 s |

Les durées reposent sur ces hypothèses : entrée 2,5 s, attaque vers le palier k = 1,8 + 0,1·k s, sortie « bloqué » 2,0 s, sortie K.O. 5,0 s. Le tableau complet des probabilités figure dans le rapport généré, §3.

Pourquoi des probabilités d'enchaînement **décroissantes** : chaque coup est plus dur que le précédent. La tension monte donc avec l'enjeu, et les paliers hauts restent de vrais événements.

## 6.2 Déroulé complet

```
[Manche normale : tronc commun du gadget → D1 → amorce BF propre au gadget]
        │
        ▼
ENTRY (BF_ENTRY_MUG, 2,0 s, commun à tous les gadgets)
   Le mug s'illumine d'or, glou-glou, la mèche se dresse, le boss grandit
   et traverse le plafond. Titre : « BOSS FIGHT! » (jamais « JACKPOT »)
        │
        ▼
ARENA (0,5 s) : l'échelle apparaît, palier 1 (x5) tamponné « APPROVED »
        │
        ▼
┌─► ATTAQUE (1,9 à 2,7 s) ──► HIT ── palier suivant tamponné ──┐
│        │                                                     │
│        └──► BLOCK (le mug-bouclier dévie : CLANG) ──► OUTRO « BLOQUÉ »
│                                                              │
└──────────────── (si le palier atteint n'est pas le dernier) ◄┘
                               │
                   dernier palier atteint ──► OUTRO « K.O. »
        │
        ▼
RESULT : gain final, présenté selon la grammaire des classes
(x5 à x24 : BIG · x25 à x99 : MEGA · x100 et plus : LEGENDARY · K.O. : écran K.O.)
        │
        ▼
POST /wallet/end-round (seulement maintenant) ──► READY
```

## 6.3 Anatomie d'une attaque (le cœur du bonus)

| Temps | Contenu | Neutre ? |
|---|---|---|
| 0 | **Tap** du joueur (ou déclenchement auto après 1,5 s sans action, et toujours en autoplay). Le tap ne sert **qu'au rythme** : pas de visée, pas de timing | — |
| 0–600 ms | **Élan commun** : les mains du joueur lancent l'attaque. GIGA-BOTTOMLINE lève son mug-bouclier, **à chaque attaque sans exception** | **Oui** |
| 600–900 ms | Trajectoire. Le mug-bouclier se place. Aux paliers hauts (≥ x100), léger ralenti et battement de cœur | **Oui** |
| **900 ms : divergence** | **HIT** : l'attaque contourne ou brise la garde, et une plaque de la barre de vie éclate. **BLOCK** : CLANG, le coup est dévié par le mug | Non |
| 900–1 700 ms | HIT : le boss vacille, grimace, et le palier suivant est tamponné « APPROVED » (or). BLOCK : il ricane, et le combat se termine | Non |

**Anti-prévisibilité** : la posture de garde, l'angle d'attaque et la réaction pré-impact sont **identiques** pour un HIT et pour un BLOCK. La variante visuelle de l'attaque est tirée dans le book (graine), jamais corrélée à l'issue.

**Montée de tension par palier** (données, pas de code spécifique) :

| Palier visé | Élan | Caméra | Musique | Particularités |
|---|---|---|---|---|
| x10, x25 | 600 ms | plan large | thème, tonalité de base | — |
| x50, x100 | 700 ms | push-in | **+1 demi-ton par palier** | le boss transpire |
| x250, x500 | 800 ms | contre-plongée | +1 demi-ton, percussions doublées | ralenti ×0,5 sur 200 ms avant la divergence |
| x1 000 | 900 ms | gros plan sur le mug | tout coupe : **silence de 300 ms** | le mug tremble |
| K.O. (dernier palier) | 1 000 ms | ralenti ×0,25 | silence, puis orchestre | seule attaque où le mug peut **se fêler** |

## 6.4 Les attaques

- **Source** : les gadgets du Rage Level sélectionné, en versions **XL** (assets du jeu de base agrandis + un effet d'impact XL). Au MVP, le gadget du niveau + 3 attaques génériques « bombes de bureau », pour que le combat ne soit pas monotone :
  - **Agrafeuse lancée** ;
  - **Pluie de post-its** ;
  - **Imprimante catapultée**.
- **Choix de l'attaque** : cosmétique, déterminé par la graine du book. À terme, le joueur pourra **choisir l'animation** de l'attaque suivante parmi 3 icônes. Les règles le diront explicitement : ce choix est **purement cosmétique**. Ce choix n'est pas prévu au MVP : il faut d'abord tester s'il est perçu comme honnête.
- **Réactions du géant** :
  - HIT : grimace, dents qui claquent, plaque de vie qui éclate ;
  - BLOCK : ricanement, « HMPF » amplifié, gorgée de mug.

## 6.5 GIGA-BOTTOMLINE (mise en scène)

- **Cadrage** : en 2,5D, le rig du boss est agrandi ×3 et cadré à partir de la taille. La tête passe à travers les dalles du plafond, et le ciel est visible par le trou. Cela évite un nouveau décor : on réutilise l'open-space avec un calque « plafond éventré ».
- **Nouvelles poses** : rugissement, garde au mug-bouclier, touché, chute (arbre qui tombe).
- **Barre de vie** : c'est une **« PERFORMANCE REVIEW »**, une rangée de plaques-étoiles au-dessus de sa tête, une par palier restant. Chaque HIT en brise une.
- **La mèche** : dressée en permanence et électrique pendant le combat. Au K.O., elle retombe en spirale.

## 6.6 L'échelle (UI)

- **Portrait** : échelle verticale sur le bord droit. **Paysage** : sur le bord gauche. Les paliers du Rage Level vont de x5 en bas au K.O. en haut.
- **Palier acquis** : tampon « APPROVED » doré. La valeur affichée en grand est **toujours le palier acquis**, jamais le suivant.
- **Palier suivant** : il pulse doucement. C'est un objectif visible, pas une promesse.
- **Sommet** : pictogramme « K.O. » avec le mug.
- **Honnêteté** : le palier acquis ne redescend jamais et ne dépasse jamais le gain final (charte, règle 2). Les probabilités d'enchaînement ne s'affichent **pas** en jeu. Elles figurent dans l'écran des règles.

## 6.7 Les deux fins

**BLOQUÉ** (2,0 s / 0,8 s en turbo) : l'effet de l'Executive Blend retombe. GIGA-BOTTOMLINE se dégonfle comme un ballon avec un sifflement comique, et retombe à son bureau, sonné mais ravi d'avoir « gagné ». Le gain acquis s'affiche selon la classe.

**K.O.** (5,0 s / 2,0 s en turbo) :
1. Dernier HIT au ralenti ×0,25.
2. Le géant vacille… **silence**… « *tink* »… puis **CRACK** : le mug se fêle pour la première fois de l'histoire du jeu.
3. Le boss tombe comme un arbre, avec un « TIMBER! » en *Bossish*.
4. Confettis, le bureau entier applaudit, et Wendell brandit le portrait « Employee of the Month » avec **sa** photo.
5. Écran « K.O. » et gain maximal du Rage Level.

Manche suivante : le boss revient avec un mug **neuf**, orné d'un petit autocollant « NEW ». Le running gag continue.

## 6.8 Rythme, turbo, autoplay, reprise

| Situation | Comportement |
|---|---|
| Normal | Tap pour attaquer, ou auto après 1,5 s sans action |
| Turbo (si `disabledTurbo` est faux) | Entrée 1,0 s, attaques de 0,7 à 0,9 s, pas de ralenti ni de silence, BLOQUÉ 0,8 s, K.O. 2,0 s |
| Super turbo (si `disabledSuperTurbo` est faux) | Entrée 0,6 s, puis montée directe de l'échelle palier par palier (0,25 s chacun), puis résultat |
| Passer (skip / slam stop) | Capacité **séparée** de la vitesse (normal / turbo) : saut direct au RESULT, proposé **seulement si `disabledSlamstop` est faux**. **INFORMATION STAKE ENGINE REQUISE** : comportement contractuel exact de « slamstop » |
| Autoplay (si `disabledAutoplay` est faux) | Attaques automatiques. L'autoplay continue après le combat selon ses propres règles d'arrêt (GDD_07) |
| `minimumRoundDuration` | Les animations ne sont **jamais** modifiées. Après le RESULT, le GameFlow attend éventuellement le temps réglementaire restant avant d'autoriser la mise suivante (état READY_GATE). **INFORMATION STAKE ENGINE REQUISE** : contrat exact (unité, point de départ) |
| Déconnexion en plein combat | Voir §6.9 |

## 6.9 Intégration Stake Engine

- **Book** : un événement `bossFightTrigger` (palier 1 = x5), puis un `bossFightHit` par attaque (`outcome` HIT ou BLOCKED, `variant`), puis `finalWin`. Format provisoire : GDD_02, §3.9. Le `payoutMultiplier` du book **est** le palier final.
- **Clôture** : `POST /wallet/end-round` n'est appelé **qu'après** l'outro (schéma `bonusWin` du web-sdk). La manche reste donc active, et reprenable, pendant le combat.
- **Progression** : **aucune dépendance à `/bet/event`** (décision v3). Son contrat pour notre cas reste une **INFORMATION STAKE ENGINE REQUISE**. Une fois ce contrat confirmé, il pourra servir d'optimisation facultative pour reprendre directement à la bonne attaque.
- **Reprise** : si `/wallet/authenticate` renvoie une manche `active`, le client relit le book (`round.state`) et **rejoue tout le combat en mode rattrapage** (vitesse turbo, bandeau « Reprise de votre manche »), puis appelle `end-round`. Le combat étant entièrement déterminé par le book, la reprise est identique à l'original : même issue, même gain, aucun nouveau tir possible.
- **Gain affiché** : il correspond toujours au `payoutMultiplier` du book multiplié par la mise.

## 6.10 Production

| Élément | Détail | Cx |
|---|---|---|
| `BF_ENTRY_MUG` | Commun aux 15 gadgets : lueur du mug, gorgée, croissance, plafond qui cède | MEDIUM |
| Poses géantes | Rugissement, garde au mug, touché, chute (rig existant agrandi) | MEDIUM |
| Calque « plafond éventré » et ciel | Réutilise l'open-space | LOW |
| Barre « Performance Review » et échelle UI | Plaques-étoiles, tampons « APPROVED » | LOW |
| 3 attaques génériques | Agrafeuse, post-its, imprimante (objets du décor) | LOW |
| Versions XL des gadgets MVP | Agrandissement + impact XL | LOW |
| Fêlure du mug (K.O.) | Déformation, fissure, éclat | LOW |
| Thème musical | **Une seule boucle**, transposée d'un demi-ton par palier par le moteur audio, plus des couches de percussions | LOW (audio) |
| Outros BLOQUÉ et K.O. | Dégonflement, chute en arbre, applaudissements | MEDIUM |

## 6.11 Pourquoi ce bonus fonctionne

- **Montée continue** : chaque HIT est un mini-gain visible. L'échelle transforme une probabilité abstraite en progression tangible.
- **Moment signature** : la fêlure du mug. Elle est rare, mémorable et partageable : au mieux 1 manche sur 17 637 en GRUMPY (environ 4 mois à 1 000 manches par semaine, en moyenne), et 1 sur 549 715 en UNHINGED.
- **Honnête** : aucun cash-out factice, aucun faux choix. Le palier affiché est toujours acquis.
- **Pas cher** : un rig, un décor et un thème musical sont réutilisés. Presque tout le contenu vient du jeu de base.

---

## Annexe : 10 concepts de bonus pour plus tard

Tous respectent les mêmes règles : **déclenchés dans la manche**, **entièrement déterminés par le book**, **aucune jauge persistante entre manches**, **aucun faux choix présenté comme réel**.

| Concept | Principe | Compatibilité / risque | Priorité |
|---|---|---|---|
| **BOSS FIGHT** | Ce document | Retenu | MVP |
| **CEO FLOOR** | L'ascenseur monte au dernier étage : le PDG (la boss du boss) apparaît, et **chaque étage traversé ajoute un multiplicateur** | OK si présenté comme une montée automatique. Pas de « choisis une porte » | Post-lancement |
| **OVERTIME** | Après une manche gagnante, la cloche de fin de journée sonne : 3 à 5 tirs supplémentaires gratuits enchaînés, dont les gains s'additionnent (tous déjà dans le book) | Compatible | Post-lancement |
| **REVENGE MODE** | Le boss attaque d'abord le joueur (fausse perte évidente, cartoon), puis le joueur riposte avec un gadget de chaque Rage Level | Attention : ne jamais montrer une perte d'argent. La « vengeance du boss » reste un décor | Post-lancement |
| **MONDAY MADNESS** | Un multiplicateur de lundi matin (x2, x3, x5) s'applique au gain de la manche, avec animation de réveil qui sonne | Le multiplicateur doit être inclus dans le `payoutMultiplier`, sans « bonus » séparé | Post-lancement |
| **SECRET WEAPON ROOM** | Le mur s'ouvre sur l'armurerie secrète : un super-gadget garanti (≥ x25) | Doublon partiel avec SUPER : à fusionner | À évaluer |
| **OFFICE APOCALYPSE** | Tous les gadgets du Rage Level se déclenchent en même temps : chaos total, et les gains s'additionnent | Coûteux (15 gadgets à l'écran). Performance mobile à vérifier | Plus tard |
| **RAGE MODE** | L'écran vire au rouge et les 3 prochains impacts de la **même manche** sont amplifiés | Surtout **pas** une jauge entre manches | Post-lancement |
| **TEAM BUILDING** | Wendell et les collègues rejoignent le joueur : chaque collègue qui réussit ajoute un multiplicateur | Bon usage des PNJ | Post-lancement |
| **PERFORMANCE REVIEW** | Le boss note le joueur sur une grille de 5 critères, et chaque « exceeds expectations » ajoute un multiplicateur (ironie) | Très drôle, peu coûteux (UI) | Post-lancement |
