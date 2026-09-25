# BAD BOSS — GDD partie 2 : core gameplay verrouillé (étape 3)

> Statut : **VERROUILLÉ pour le prototype** (modifiable seulement par décision explicite, à consigner dans `PROJECT_STATE.md`).
> Les faits Stake Engine cités ici sont sourcés dans `docs/STAKE_ENGINE_FAITS_VERIFIES.md`.

---

## 3.1 Donner du sens au choix : analyse des 5 modèles

Contrainte structurante (vérifiée) : sur Stake Engine, `/play` reçoit `{amount, sessionID, mode}`. Le serveur tire un résultat pré-calculé (un « book ») **dans le lookup table du mode demandé**. Le seul moyen pour qu'un choix du joueur change réellement les maths est donc qu'il sélectionne **un mode différent**. Tout autre choix est cosmétique.

| Modèle | Avantages | Inconvénients | Verdict |
|---|---|---|---|
| **A** : 3 méthodes, maths identiques | Un seul mode à certifier, aucune confusion | Agence illusoire, vite découverte. Le « choix » devient creux. Ne sert pas des profils de joueurs différents | Rejeté. Reste un **plan de repli** si Stake refusait plusieurs modes à coût 1 (il faudrait alors dire dans les règles que les gadgets sont cosmétiques) |
| **B** : chaque méthode a sa propre volatilité | Agence maximale | 15 modes à certifier. Les joueurs se fixent sur « la meilleure arme ». Un tirage aléatoire de 3 méthodes peut ne proposer que du risque élevé. Illisible | Rejeté |
| **C** : choisir le risque, puis une méthode cosmétique | Clair, honnête | **Deux décisions par manche**, ce qui casse le rythme de 3 s. La 2e décision est ouvertement inutile | Bon principe, mais trop lent |
| **D** : 3 profils mathématiques générés à chaque manche | Variété | Il faut autant de modes que de profils. Le joueur doit relire des chiffres à chaque manche (effet tableur). Il soupçonne « pourquoi je n'ai que des mauvaises offres ? ». Aucune habitude possible | Rejeté |
| **E** : **RAGE LEVELS** (recommandé) | Agence réelle en **1 geste**, habitude possible (« je joue UNHINGED »), variété par rotation des gadgets, seulement 3 modes à certifier, communication immédiate | Les gadgets d'un même niveau sont cosmétiques (à dire dans les règles). Risque de superstition (« la fusée porte chance »). 3 lookup tables à produire | **RETENU** |

## 3.2 Décision : RAGE LEVELS, 3 emplacements de risque réel et un arsenal rotatif

```
┌───────────────┬───────────────┬───────────────┐
│   GRUMPY  😒   │  FURIOUS  😠   │ UNHINGED  🤯   │   ← niveau de rage = profil de risque
│  bleu électr. │    orange     │ violet / rouge│   ← couleur fixe, position fixe
│               │               │               │
│ [Chair        │ [Rogue        │ [Office       │   ← gadget tiré à chaque manche
│  Launcher]    │  Robot]       │  Rocket]      │     dans le pool du niveau
│               │               │               │
│  MAX x200     │  MAX x1 000   │  MAX x5 000   │   ← seule donnée chiffrée sur la carte
└───────────────┴───────────────┴───────────────┘
```

Règles :
1. **Trois emplacements fixes**, de gauche à droite et par risque croissant : GRUMPY (volatilité basse), FURIOUS (moyenne), UNHINGED (haute).
2. **Chaque emplacement est un bet mode Stake Engine** (coût 1,0) avec son propre lookup table. **Le RTP est identique : 96,5 %**. Seules la distribution et la volatilité changent (voir partie 3).
3. **À chaque manche, chaque emplacement reçoit un gadget** tiré dans le pool de son niveau. À terme : 5 gadgets par niveau (15 au total). Au MVP : 1 par niveau. Le tirage est **purement cosmétique** : il se fait côté client, hors RNG mathématique. Les règles du jeu indiquent que **tous les gadgets d'un même niveau ont exactement les mêmes probabilités**.
4. **Les pools sont thématiques**, pour que l'animation colle aux montants possibles :
   - GRUMPY : petites vengeances de bureau (chaise-lance-pierre, agrafeuse géante, ventilateur, machine à café, pigeons).
   - FURIOUS : machines et mécanismes déréglés (robot, photocopieuse, distributeur, trappe, PC hanté).
   - UNHINGED : catastrophes absurdes (fusée, piano, camion de livraison, boule de démolition, téléporteur).
   - Liste définitive et branches d'animation : `docs/GDD_04_ANIMATIONS_ET_GADGETS.md` (étape 5).
   - **Super-gadgets** (UFO, T-Rex, trou noir, kaiju…) : **non sélectionnables**. Ils surgissent dans la manche, uniquement sur des résultats ≥ x25 (§3.6).
5. **Sélection persistante** : le niveau choisi reste sélectionné d'une manche à l'autre. Changer de niveau = 1 tap sur une carte (gratuit, instantané, sans mise).
6. **MVP (décidé à l'étape 5)** : GRUMPY = *Swivel Slingshot* (chaise-lance-pierre), FURIOUS = *Trapdoor Express*, UNHINGED = *Office Rocket*. Justification dans `GDD_04`, §5.8.

## 3.3 Système de mise : la mise ne définit que l'argent engagé

- La mise **ne change ni les probabilités, ni les gadgets, ni les animations**.
- Les seuils de mise en scène (big win, etc.) sont définis **sur le multiplicateur**, jamais sur le montant. Un x500 à 0,10 $ reçoit le même spectacle qu'un x500 à 100 $.
- Aucune « amélioration d'arme » achetable. Aucun gadget débloqué par la mise.
- La mise respecte `minBet`, `maxBet` et `stepBet`, et propose les `betLevels` renvoyés par `/wallet/authenticate`. Montants entiers, 6 décimales (1 000 000 = 1 unité).
- **Bonus buy** (achat direct du BOSS FIGHT) : **hors MVP**. S'il est ajouté un jour : 4e mode, coût ~100x, RTP identique. Il ne sera **proposé** que si `jurisdiction.disabledBuyFeature` est faux (clé vérifiée dans le web-sdk).

## 3.4 La boucle, analysée et améliorée

Boucle du brief : BET → 3 MÉTHODES → CHOIX → DÉCLENCHEMENT → ANIMATION → SUSPENSE → HIT/MISS/BONUS → RÉVÉLATION → PAYOUT → REPLAY.

Corrections :
- **BET n'est pas une étape de chaque manche** : la mise persiste, on la change rarement.
- **CHOIX et DÉCLENCHEMENT fusionnent** quand le niveau ne change pas : un seul geste (FIRE).
- **La requête part au geste FIRE**, et l'animation démarre immédiatement avec un segment neutre qui masque la latence.
- **SUSPENSE et HIT/MISS ne sont pas des étapes** : ce sont des segments du script de présentation déjà choisi.
- **REPLAY est disponible dès la RÉVÉLATION**. Le décompte des gros gains se saute au tap.

Boucle retenue :

```
READY  (mise + niveau mémorisés, 3 gadgets distribués, boss en idle)
  │   tap carte = changer de niveau (optionnel)
  ▼   FIRE (1 geste)
LAUNCH ─► POST /play {amount, sessionID, mode}
  │        + WIND-UP neutre, 0 à 600 ms, identique quel que soit le résultat
  │        (si la réponse tarde : boucle d'attente « chargement du gadget »)
  ▼   book reçu : résultat CONNU et verrouillé
SCRIPT : ACTION → (TWIST) → IMPACT → REACTION        (script lu dans le book)
  ▼
REVEAL : pose finale du boss + multiplicateur + gain  (compréhensible en < 300 ms)
  │        en parallèle : nouveaux gadgets distribués, FIRE réactivé
  ▼
READY
```

Budgets de durée (mode normal, hors latence) :

| Catégorie | Durée cible | Turbo |
|---|---|---|
| MISS / SCRAPE | 2,2 à 2,8 s | ~1,0 s |
| HIT direct | 2,5 à 3,2 s | ~1,2 s |
| Fake-out (TEASE, COMEBACK) | 3,2 à 4,0 s | ~1,4 s (twist compressé) |
| BIG HIT / CHAIN | 4,0 à 5,0 s | ~1,6 s |
| MEGA / LEGENDARY / super-gadget | 5 à 8 s (skippable dès l'impact) | ~2,0 s |
| BOSS FIGHT | 6 à 26 s selon le nombre de coups (médiane ~8 s) | ~3 à 10 s |

## 3.5 Grammaire du résultat : le boss est le compteur

Le résultat se lit en 3 couches, dans cet ordre : **pose du boss → couleur/son → chiffre**. La destruction est **strictement croissante** avec le multiplicateur.

| Classe | Multiplicateur | Ce que l'on voit | Son | Affichage |
|---|---|---|---|---|
| **MISS** | x0 | Boss debout, intact, qui ricane | petit « wah-wah », rire du boss | rien, ou « MISSED » gris |
| **SCRAPE** | x0,1 à x0,9 | Boss debout mais décoiffé, roussi, cravate de travers | « pfff » neutre | « x0.5 RECOVERED » gris-bleu, **sans pièces ni WIN** |
| **HIT** | x1 à x4,9 | Boss renversé derrière son bureau | impact + pièces courtes | multiplicateur jaune |
| **BIG HIT** | x5 à x24,9 | Boss éjecté hors du plan | impact lourd + fanfare courte | orange, secousse |
| **MEGA** | x25 à x99,9 | Éjection + destruction du bureau | slow-mo + basse | rouge, freeze frame |
| **LEGENDARY** | ≥ x100 | Super-gadget, orbite, trou noir… | séquence big win | violet, plein écran |
| **BOSS FIGHT** | bonus (≥ x5 garanti) | Transition dédiée : le boss devient géant | thème bonus | échelle de paliers |

## 3.6 Scripts de présentation et charte d'honnêteté

### Le résultat choisit le script, jamais l'inverse
Lors de la génération des books (math SDK), chaque résultat reçoit **une catégorie de script**, tirée selon des probabilités conditionnelles **fixes**, ainsi qu'une graine de variante. Le client combine ensuite catégorie, gadget affiché et variante pour produire une séquence concrète. Le même book donne **toujours** la même mise en scène (utile pour les replays et le support).

| Classe de résultat | Scripts possibles (probabilité conditionnelle fixe) |
|---|---|
| MISS | CLEAN_MISS 50 % · BACKFIRE 35 % · **TEASE 15 %** |
| SCRAPE | GRAZE 100 % |
| HIT | DIRECT 70 % · COMEBACK 30 % |
| BIG HIT | DIRECT 50 % · COMEBACK 35 % · CHAIN 15 % |
| MEGA (base) | COMEBACK 40 % · CHAIN 35 % · SUPER 25 % |
| LEGENDARY (base) | SUPER 100 % |
| BOSS FIGHT | ENTRY (variantes) puis un script par coup |

Définitions :
- **CLEAN_MISS** : le gadget rate franchement, de façon absurde et drôle.
- **BACKFIRE** : le gadget se retourne contre le bureau du joueur, ou le boss esquive et se moque.
- **TEASE** (faux espoir, puis perte) : le gadget frôle le boss, qui vacille… puis se rattrape.
- **GRAZE** : touche partielle, le boss est ébouriffé mais reste debout.
- **DIRECT** : ça marche du premier coup.
- **COMEBACK** (faux désespoir, puis gain) : échec apparent, silence, rebondissement, succès.
- **CHAIN** : succès, puis un second événement qui amplifie (escalade).
- **SUPER** : un super-gadget détourne la scène (UFO, T-Rex…).

Fréquence effective des TEASE sur l'ensemble des manches : GRUMPY 6,3 %, FURIOUS 10,0 %, UNHINGED 12,7 %. On l'obtient en multipliant P(MISS) par 15 %.

### Charte de présentation honnête (non négociable)
1. **Le résultat est connu avant la première image du script.** L'animation ne décide de rien.
2. **Aucun multiplicateur, montant, pièce ou compteur n'apparaît avant REVEAL.** Aucun compteur ne dépasse la valeur finale ni ne redescend. *Seule exception : l'échelle du BOSS FIGHT, qui affiche le palier **acquis** au fil des coups. Ce palier ne dépasse jamais le gain final et ne redescend jamais.*
3. **TEASE ≤ 15 % des pertes**, à fréquence fixe codée dans les books. Il n'est **jamais adapté** à l'historique, à la mise, au solde ou aux séries du joueur.
4. **Un gain inférieur à la mise n'est jamais présenté comme une victoire** : ni pièces, ni « WIN », son neutre, libellé « RECOVERED ».
5. **Signaux honnêtes** : un super-gadget garantit un gain ≥ x25, et l'entrée en BOSS FIGHT garantit ≥ x5. Un signal fort n'est **jamais** suivi d'une perte.
6. **Near-miss honnête** : le « presque » est physique (l'objet rate de quelques centimètres, le boss vacille). Il ne s'exprime jamais en valeurs : pas de « x500 raté de peu ».
7. **Les règles du jeu expliquent** les niveaux de risque, l'équivalence des gadgets, les max wins et le RTP. Elles précisent aussi que les animations mettent en scène un résultat déjà déterminé.
8. **Iconographie réservée** : la lueur dorée du mug est réservée au BOSS FIGHT, les silhouettes de super-gadgets (UFO, T-Rex, trou noir…) aux résultats ≥ x25, et les pièces ou l'or aux gains ≥ mise. Une branche de perte n'emprunte **jamais** ces signaux, pas même pour un TEASE.
9. **Tronc commun** : toutes les branches d'un gadget partagent les mêmes 500 à 1 500 premières ms. À chaque point de divergence, au moins une issue gagnante et une issue perdante restent possibles (vérifié par la matrice de non-révélation, `GDD_04` §5.6).

## 3.7 BOSS FIGHT (aperçu ; conception complète à l'étape 6)

- Déclenché **dans la manche**, avec la même fréquence sur les 3 niveaux : **1 manche sur 150**.
- Le boss devient géant. Le joueur tape pour déclencher chaque attaque. **Le tap ne règle que le rythme** : pas de visée, pas de timing, pas d'adresse.
- Entrée = **x5 garanti**. Chaque coup réussi fait monter d'un palier. Échelles (source : `config/rage_levels.json`) :
  - GRUMPY : x5 → x10 → x25 → x50 → x100 → x200
  - FURIOUS : x5 → x10 → x25 → x50 → x100 → x250 → x500 → x1 000
  - UNHINGED : x5 → x10 → x25 → x50 → x100 → x250 → x500 → x1 000 → x5 000

  Le dernier palier = **K.O.** Le BOSS FIGHT n'est **pas** un gros gain garanti : 30 à 55 % des combats s'arrêtent à x5. Conception complète : `docs/GDD_05_BOSS_FIGHT.md`.
- Un coup bloqué termine le combat. Le joueur garde le dernier palier atteint.

**Pourquoi pas de cash-out** : le book renvoyé par `/play` contient déjà la totalité du combat, et son `payoutMultiplier` est le gain versé. Un cash-out qui paierait autre chose que ce montant est impossible. Un cash-out qui paierait quand même ce montant serait un faux choix, donc une tromperie. Toute mécanique de décision réelle (gamble, quitte ou double) exigerait des manches séparées avec une nouvelle mise, et donc une validation Stake. **INFORMATION STAKE ENGINE REQUISE** avant d'envisager cette piste. Elle est hors MVP.

**Clôture** : une manche BOSS FIGHT n'appelle `/wallet/end-round` qu'**après** le combat, pour permettre la reprise après déconnexion. C'est le schéma `bonusWin` du web-sdk.

## 3.8 Volontairement exclu

| Exclu | Pourquoi |
|---|---|
| Mini-jeu d'adresse ou de timing avant le tir | Ferait croire que l'adresse influe sur le résultat : trompeur |
| Jauge persistante entre les manches (« rage meter », « boss presque cuit ») | Les manches sont indépendantes. Une jauge suggère une progression vers un gain qui n'existe pas. Les thèmes RAGE MODE ou REVENGE MODE deviendront des **bonus déclenchés dans la manche** |
| Cash-out, quitte ou double | Incompatible avec les books pré-calculés (§3.7) |
| Gadget plus puissant selon la mise | Confus et trompeur (§3.3) |
| Near-miss adaptatif | Manipulation (§3.6) |

**Autorisé, et cosmétique uniquement** : l'état visuel du boss persiste quelques manches (pansement, casque, plâtre absurde) puis guérit. Il n'est lié à aucune probabilité. Il doit se lire comme une **réaction** et jamais comme une barre de progression : pas de chiffre, pas de jauge.

## 3.9 Correspondance avec Stake Engine (résumé ; détails à l'étape 9)

| Élément de jeu | Côté Stake Engine |
|---|---|
| GRUMPY / FURIOUS / UNHINGED | 3 modes dans `index.json` (`cost: 1.0`), 3 lookup tables CSV, 3 fichiers de books `.jsonl.zst` |
| Tir (FIRE) | `POST /wallet/play {amount, sessionID, mode}` : débit, puis book renvoyé dans `round` |
| Résultat, script, variante | Dans `events` du book : **schéma défini par nous** (Stake n'impose que `id`, `events`, `payoutMultiplier`) |
| Gadget affiché | Client uniquement : non transmis au RGS, sans effet sur le résultat |
| Gain normal | `/wallet/end-round` appelé dès la réception du book, solde affiché au REVEAL (schéma `singleRoundWin` du web-sdk) |
| BOSS FIGHT | `/wallet/end-round` appelé après le combat (schéma `bonusWin`). Progression éventuellement tracée via `/bet/event` pour la reprise |
| Perte (x0) | Schéma `noWin` du web-sdk : aucun appel `end-round` côté client. **INFORMATION STAKE ENGINE REQUISE** : confirmer la fermeture automatique côté RGS |

Exemple de book (schéma provisoire, entiers ×100 comme `payoutMultiplier`) :

```json
{
  "id": 48213,
  "payoutMultiplier": 500,
  "events": [
    {"index": 0, "type": "attack", "mode": "furious", "resultClass": "BIG_HIT",
     "script": "COMEBACK", "variant": 3, "multiplier": 500},
    {"index": 1, "type": "finalWin", "amount": 500}
  ]
}
```

```json
{
  "id": 900417,
  "payoutMultiplier": 5000,
  "events": [
    {"index": 0, "type": "bossFightTrigger", "mode": "unhinged", "entry": "CEO_ELEVATOR",
     "variant": 1, "rung": 1, "multiplier": 500},
    {"index": 1, "type": "bossFightHit", "rung": 2, "outcome": "HIT", "multiplier": 1000, "variant": 4},
    {"index": 2, "type": "bossFightHit", "rung": 3, "outcome": "HIT", "multiplier": 2500, "variant": 2},
    {"index": 3, "type": "bossFightHit", "rung": 4, "outcome": "HIT", "multiplier": 5000, "variant": 7},
    {"index": 4, "type": "bossFightHit", "rung": 5, "outcome": "BLOCKED", "variant": 1},
    {"index": 5, "type": "finalWin", "amount": 5000}
  ]
}
```
