# Proposition : des récompenses très visuelles et stimulantes (collection)

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

**Date** : 2026-09-28. **Statut** : proposition, à choisir par l'utilisateur. Rien n'est codé.
**Contexte** : l'utilisateur trouve les récompenses de la collection « nulles ». Les tours gratuits gagnés grâce à la
collection sont très probablement interdits sur Stake (jeu « sans état ») : question envoyée à Stake,
`docs/STAKE_QUESTION_COLLECTION_FREE_ROUNDS.md`.

## 1. Pourquoi les récompenses actuelles ne marchent pas

| Aujourd'hui | Problème |
|---|---|
| Mug turquoise, cravate, canard, DING, élastique, peinture de trappe, bandes de fusée, couvertures d'album | **Minuscules** à l'écran, et rangées dans un menu (il faut les « équiper ») |
| Épisode OFFICE MELTDOWN, trophée | Vus **une fois**, puis oubliés |
| Jalons 5 / 10 / 25 / 50 % / 100 % | Aucun lien avec le **fantasme du jeu** (se venger de B.B.) ; le 100 % demande ~42 600 manches |

La collection ne se voit **pas pendant le jeu**. C'est le vrai défaut.

## 2. Ce que dit la recherche

| Constat | Source |
|---|---|
| Le « juice » (flash, secousse, particules, texte flottant, son) rend un jeu vivant ; règle : en mettre beaucoup, puis doser. | Jonasson & Purho, *Juice it or lose it*, GDC 2012 ([résumé](https://en.wikipedia.org/wiki/Game_feel)) |
| Une personnalisation qui **évolue avec la progression** renforce l'attachement émotionnel (elle ne change pas le comportement de jeu). | [Étude Baldur's Gate 3](https://www.researchgate.net/publication/407530680_The_Impact_of_Evolving_Character_Customization_on_Emotional_Engagement_and_Player_Behaviour_in_RPGs) ; [personnalisation et identification](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8765231/) |
| La motivation monte à l'approche d'un objectif (*goal gradient*) ; une progression **visible** motive plus qu'une récompense cachée. | [Kivetz 2006, goal gradient](https://yukaichou.com/behavioral-analysis/goal-gradient-hypothesis-hull-kivetz-motivation-acceleration/) ; [iGaming : la reconnaissance plus que la récompense](https://www.optimove.com/resources/blog/gamification-strategies-to-drive-player-engagement) |
| Les célébrations de gain doivent être **proportionnelles** au gain (paliers petit / gros / méga / max). | [GammaStack](https://www.gammastack.com/blog/top-slot-features-every-successful-slot-game-should-have/) |
| **Royaume-Uni** : interdit de célébrer un retour ≤ mise (son ou image « de gain »), depuis le 31/10/2021. | [UK Gambling Commission](https://www.gamblingcommission.gov.uk/consultation-response/online-games-design-and-reverse-withdrawals/summary-of-responses-prohibiting-effects-that-give-the-illusion-of-false) |
| **Stake** : jeu sans état, ni jackpot, ni gamble, ni continuation ; rien qui attire les mineurs (personnages enfantins interdits). | [Stake Engine Approval Guidelines](https://stake-engine.com/docs/approval-guidelines) |

**Idée directrice** : la collection doit **transformer ce que le joueur voit à chaque manche** (le bureau, B.B., ses gadgets),
et raconter **sa** vengeance. Aucune valeur d'argent, aucune influence sur les résultats.

## 3. Propositions (classées)

### 1. « LE BUREAU SE SOUVIENT » — le décor garde les traces de ta vengeance ⭐ recommandé
- Chaque carte découverte accroche une **photo Polaroid** de l'animation (la vraie image, déjà produite par `ThumbnailRenderer`)
  sur un **HALL OF SHAME** au mur ; la photo la plus récente arrive en volant, avec un flash d'appareil photo.
- Chaque gadget laisse des **cicatrices permanentes** : plafond fissuré, trace de brûlure, fenêtre scotchée, ventilateur tordu,
  flaque de café séchée.
- Les jalons transforment tout le bureau par étapes : 25 cartes → piles de plaintes RH ; 50 % → bureau à moitié détruit ;
  OFFICE MELTDOWN → rubalise « CONDAMNÉ » et néons qui grésillent ; 100 % → le bureau de B.B. devient **le tien** (plaque à ton nom).
- **Pourquoi** : visible à **chaque manche**, lié au fantasme, progression lisible d'un coup d'œil.
- **Coût** : moyen (le décor a déjà des états ; les vignettes existent). Mémoire des 150 vignettes à mesurer (budget textures ≤ 64 Mo).

### 2. « B.B. PORTE LES MARQUES » — le patron s'abîme au fil de ta collection
- Pansement, œil au beurre noir, perruque roussie, sourcil en moins, bras dans le plâtre, minerve, cravate déchirée…
  Un « stigmate » par jalon et par gadget maîtrisé, **cumulatif**.
- **Pourquoi** : B.B. est au centre de l'écran à chaque manche ; c'est le trophée le plus direct de la vengeance.
- **Coût** : moyen (pièces d'art ajoutées au rig existant). Ton : slapstick de dessin animé, jamais réaliste.

### 3. « GADGETS DE LÉGENDE » — chaque gadget évolue avec ses propres découvertes
- 4 niveaux par gadget (ex. 4 / 8 / 12 / toutes ses cartes) : STANDARD → TUNÉ (traînée) → OR (matière dorée, étincelles) →
  LÉGENDAIRE (aura néon, son d'impact unique, animation d'attente unique).
- Visible au moment du choix du plan et pendant toute l'animation.
- **Garde-fou** : mention « cosmétique : ne change aucun résultat » dans les règles ; maths identiques (tests existants).
- **Coût** : moyen (couches de rendu par gadget).

### 4. Plus de « juice » dans le BOSS FIGHT et les gros gains (pour tout le monde, sans collection)
- Tours gratuits : **destruction cumulative** (chaque HIT casse quelque chose jusqu'à la fin du bonus ; au K.O., le bureau s'effondre).
- Gros gains : paliers BIG / MEGA / EPIC avec compteur qui défile, tempête de papiers, ralenti sur le coup final.
- **Garde-fou** : jamais de célébration pour un retour ≤ mise (déjà la règle du jeu : x0,5 sans DING).
- **Coût** : faible à moyen.

### 5. « TA BOBINE DE VENGEANCE » — un épisode avec TES meilleures manches
- Au jalon OFFICE MELTDOWN (puis à chaque 25 cartes) : un montage de **tes** 5 plus grosses manches réelles, rejouées depuis leurs
  books (le replay existe déjà), avec titres de « film ». Sans mise, sans gain.
- **Coût** : moyen à élevé.

## 4. À ne pas faire

- Aucune valeur d'argent, aucun tour gratuit, crédit ou multiplicateur (Stake : sans état).
- Aucune célébration d'un retour ≤ mise ; aucun « presque », « encore une », « tu y es presque » (vocabulaire déjà interdit et testé).
- Pas de fausse progression offerte (effet de « progression dotée ») ni de missions quotidiennes ou de séries à ne pas casser : ce sont
  des leviers qui poussent à jouer plus, risqués dans un jeu d'argent.
- Rien d'enfantin dans le style (règle Stake sur l'attrait pour les mineurs).

## 5. Recommandation

Construire **1 + 2 ensemble** (« le bureau et B.B. portent les traces de ta vengeance »), puis **4** (bénéfice immédiat pour tous
les joueurs). Garder **3** et **5** pour après le PLAYTEST #3.

Rappel : la collection reste **désactivée en mode Stake** tant que Stake n'a pas confirmé la méta-progression cosmétique (question 17).
