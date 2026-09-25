# BAD BOSS — GDD partie 5 : le BOSS FIGHT (étape 6)

> Paramètres mathématiques : `config/rage_levels.json` (source de vérité). Chiffres générés : `docs/generated/MATH_REPORT.md`.
> Règle absolue : **le combat entier est dans le book renvoyé par `/wallet/play`**. Le joueur ne décide rien qui change le gain.

---

## 6.0 La promesse

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
| Passer (slam stop) | Bouton « Skip » disponible après l'entrée, **seulement si `disabledSlamstop` est faux** : saut direct au RESULT. **INFORMATION STAKE ENGINE REQUISE** : confirmer que « slamstop » couvre bien ce saut d'animation |
| Autoplay (si `disabledAutoplay` est faux) | Attaques automatiques. L'autoplay continue après le combat selon ses propres règles d'arrêt (GDD_07) |
| `minimumRoundDuration` | Le RESULT n'est jamais affiché avant la durée minimale. Au besoin, l'outro est prolongé, pas les attaques |
| Déconnexion en plein combat | Voir §6.9 |

## 6.9 Intégration Stake Engine

- **Book** : un événement `bossFightTrigger` (palier 1 = x5), puis un `bossFightHit` par attaque (`outcome` HIT ou BLOCKED, `variant`), puis `finalWin`. Format provisoire : GDD_02, §3.9. Le `payoutMultiplier` du book **est** le palier final.
- **Clôture** : `POST /wallet/end-round` n'est appelé **qu'après** l'outro (schéma `bonusWin` du web-sdk). La manche reste donc active, et reprenable, pendant le combat.
- **Progression** : après chaque attaque affichée, `POST /bet/event` enregistre le dernier événement joué (ex. `"bf:3"`). **INFORMATION STAKE ENGINE REQUISE** : taille maximale et format accepté du champ `event`. Le schéma web-sdk le déclare seulement comme une chaîne.
- **Reprise** : si `/wallet/authenticate` renvoie une manche `active`, le client relit le book (`round.state`), saute à l'attaque qui suit le dernier événement enregistré, rejoue une entrée courte (0,8 s) puis continue. Si l'événement est absent, il reprend au début du combat. Le gain n'en dépend pas.
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
