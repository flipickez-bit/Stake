# BAD BOSS — GDD partie 7 : UI, caméra et sound design (étape 8)

> Principe directeur : **l'animation d'abord**. L'interface occupe le minimum d'espace, ne montre aucun chiffre de résultat avant la révélation, et ne propose **que** les fonctionnalités autorisées par la juridiction.

---

# 8.1 UI / UX

## 8.1.1 Principes

1. **Un pouce suffit** : sur mobile, tout le jeu se joue d'une main, en portrait.
2. **Au plus 5 éléments interactifs visibles en jeu** : 3 cartes, la mise et FIRE. Tout le reste est secondaire.
3. **Aucun chiffre de résultat avant REVEAL** (charte, règle 2). Pendant la manche, le champ de gain affiche « — ».
4. **La couleur n'est jamais seule** : un Rage Level se reconnaît par sa position, son pictogramme, son libellé **et** sa couleur.
5. **Une information honnête à un tap** : bouton « i » sur chaque carte, règles complètes dans le menu.
6. **Une fonctionnalité interdite n'est pas proposée** : pas de bouton grisé, la mise en page se réorganise (§8.1.6).

## 8.1.2 Mobile portrait (référence 390 × 844 px CSS, mise à l'échelle proportionnelle)

```
┌──────────────────────────────────────┐  ← zone de sécurité (encoche)
│ ☰        BALANCE  $1 234.56      🔊 │  Barre haute : 44 px
│          [⏱ 12:04] [±  -$8.20]      │  (seulement si displaySessionTimer / displayNetPosition)
├──────────────────────────────────────┤
│                                      │
│          🖼 portrait « EotM »          │
│               ⌇ la mèche             │
│           ┌───[BOSS]───┐             │  SCÈNE : environ 52 % de la hauteur
│           │  bureau ☕ 🔔│             │  Zone sûre du résultat : 60 % central
│           └────────────┘             │
│   ✋                              ✋   │  (les mains du joueur entrent par le bas)
│        [ bandeau de résultat ]       │  ← tiers inférieur de la scène
├──────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐     │
│ │😒GRUMPY│ │😠FURIOUS│ │🤯UNHING.│  i │  CARTES : environ 17 %
│ │[Chair] │ │[Trap-  ]│ │[Rocket ]│    │  sélection : carte relevée de 8 px,
│ │MAX x200│ │MAX x1000│ │MAX x5000│    │  bordure lumineuse + coche
│ └────────┘ └────────┘ └────────┘     │
├──────────────────────────────────────┤
│      WIN  $0.00      MAX $200.00     │  gain de la manche · gain max = mise × max
│         [ − ]   $1.00   [ + ]        │  MISE (tap sur le montant : liste des betLevels)
│   [⚡]        (  FIRE!  )       [↻]   │  TURBO · FIRE (cercle de 88 px) · AUTO
└──────────────────────────────────────┘  ← zone de sécurité basse
```

**Cartes Rage Level**
- **Couleurs** : GRUMPY bleu électrique `#1E90FF`, FURIOUS orange `#FF8A00`, UNHINGED rouge `#FF2E4D` avec accent violet. Le violet profond reste réservé au boss.
- **Pictogrammes** : têtes de colère dessinées maison (1, 2 ou 3 marques de colère), pas d'emoji système.
- **Contenu** : illustration du gadget de la manche, nom du gadget, « MAX xN ». Rien d'autre.
- **Changement de gadget** : pendant le REVEAL, les cartes se retournent (200 ms) pour révéler les nouveaux gadgets. La sélection du niveau est conservée.
- **Bouton « i »** : fiche du niveau (volatilité en 3 barres, hit rate, max win, équivalence des gadgets).

**Bouton FIRE : états**

| État | Aspect | Tap |
|---|---|---|
| READY | Jaune, « FIRE! », légère pulsation | Lance la manche |
| EN MANCHE (avant le book) | Assombri, pas de libellé | Rien (anti double tap) |
| EN MANCHE (book reçu) | Icône ⏭ **seulement si `disabledSlamstop` est faux** | Saute au REVEAL (la pose finale et le résultat restent affichés) |
| AUTOPLAY | Compteur des manches restantes | Arrête l'autoplay à la fin de la manche en cours |
| INDISPONIBLE | Normal | Ouvre une explication (solde insuffisant, etc.) |

**Mise**
- Boutons − et + : on parcourt les `betLevels` de `/wallet/authenticate`.
- Tap sur le montant : feuille de sélection avec tous les niveaux.
- Toute mise respecte `minBet`, `maxBet` et `stepBet`.
- La mise se verrouille pendant une manche.

## 8.1.3 Mobile paysage

La scène occupe les 65 % gauches. La colonne de droite contient, de haut en bas :
- la balance ;
- les 3 cartes empilées ;
- la mise ;
- FIRE, avec TURBO et AUTO de part et d'autre.

En BOSS FIGHT, l'échelle passe sur le bord gauche de la scène.

## 8.1.4 Desktop (16:9, ≥ 1 280 px)

```
┌────────────────────────────────────────────────────────────────────┐
│ ☰ BAD BOSS                                   ⏱  ±   🔊   ⛶        │
│                                                                    │
│                         SCÈNE (≈ 78 % hauteur)                     │
│                                                                    │
├───────────────┬──────────────────────────────────────┬─────────────┤
│ BALANCE       │ [😒 GRUMPY] [😠 FURIOUS] [🤯 UNHINGED] │ [⚡] (FIRE!) │
│ − $1.00 +     │   cartes horizontales, survol = fiche │     [↻]     │
│ WIN $0.00     │                                       │             │
└───────────────┴──────────────────────────────────────┴─────────────┘
```

**Raccourcis clavier** : `Espace` = FIRE ou passer (**seulement si `disabledSpacebar` est faux**) · `1` / `2` / `3` = Rage Level · `↑` / `↓` = mise · `T` = turbo · `M` = muet · `I` = infos. Les raccourcis sont listés dans les règles.

**Survol d'une carte** : fiche compacte (volatilité, max win, hit rate). **Survol de FIRE** : rappel de la mise et du gain max.

## 8.1.5 Présentation des résultats

Les seuils dépendent **du multiplicateur, jamais du montant**.

| Classe | Superposition | Décompte du montant | Son (§8.3.5) | Durée N / T |
|---|---|---|---|---|
| MISS | rien, ou « MISSED » gris pendant 600 ms | — | HMPF + wah-wah | 0,6 / 0,2 s |
| SCRAPE | pastille gris-bleu « x0.5 RECOVERED » + montant neutre | non | « pfff » | 0,6 / 0,3 s |
| HIT | multiplicateur jaune (taille M) + « +$X » | 0,4 s | 1 DING + pièces | 0,8 / 0,4 s |
| BIG HIT (≥ x5) | bandeau orange « BIG HIT! » | 0,8 s | 2 DING + cuivres | 1,5 / 0,6 s |
| MEGA HIT (≥ x25) | bandeau rouge « MEGA HIT! », confettis, collègues | 1,5 s | cascade de DING, chœur | 2,5 / 0,9 s |
| LEGENDARY (≥ x100) | plein écran violet « LEGENDARY! » | 2,5 s | jingle complet | 4,0 / 1,2 s |
| K.O. (max du BOSS FIGHT) | écran « K.O.! » + mug fêlé | 3,0 s | CRACK + orchestre | 5,0 / 2,0 s |

- **Décompte** : de 0 jusqu'au montant final, sans jamais le dépasser. Un tap l'accélère jusqu'à la valeur finale.
- **Formatage** : conforme aux métadonnées de devise de la doc Stake (symbole, décimales, position). Les devises XGC et XSC s'affichent « GC » et « SC ».
- **FIRE est réactivé** dès le début du REVEAL : le joueur peut relancer pendant le décompte (qui se termine alors instantanément), sauf si `minimumRoundDuration` l'interdit.

## 8.1.6 Fonctionnalités conditionnées par la juridiction

Les clés proviennent de `config.jurisdiction` dans la réponse de `/wallet/authenticate`. Elles ont été **vérifiées** dans le schéma et l'exemple du web-sdk officiel (`packages/rgs-fetcher/src/schema.ts`, `Authenticate.svelte`).

| Clé | Si vrai (ou valeur > 0) | Effet sur l'UI | Sémantique à confirmer |
|---|---|---|---|
| `disabledTurbo` | turbo interdit | le bouton ⚡ n'existe pas | — |
| `disabledSuperTurbo` | super turbo interdit | ⚡ ne cycle qu'entre OFF et TURBO | — |
| `disabledAutoplay` | autoplay interdit | le bouton ↻ n'existe pas, et FIRE se recentre | — |
| `disabledSlamstop` | arrêt anticipé interdit | pas de ⏭, pas de tap-pour-passer, pas de « Skip » en BOSS FIGHT | **INFORMATION REQUISE** : le « slam stop » couvre-t-il le saut d'animation d'un jeu non-slot ? Par prudence : oui |
| `disabledSpacebar` | barre d'espace interdite | aucun raccourci `Espace` | — |
| `disabledFullscreen` | plein écran interdit | pas de ⛶ | — |
| `disabledBuyFeature` | bonus buy interdit | le mode bonus buy (hors MVP) n'est jamais proposé | — |
| `displayRTP` | affichage du RTP requis | RTP visible sur la fiche de chaque carte et dans le menu (pas seulement dans les règles) | **INFORMATION REQUISE** : emplacement exigé |
| `displayNetPosition` | position nette requise | compteur « ± » de la session dans la barre haute | **INFORMATION REQUISE** : définition exacte (depuis l'ouverture ?) |
| `displaySessionTimer` | minuteur requis | minuteur ⏱ dans la barre haute | **INFORMATION REQUISE** : départ du chronomètre |
| `minimumRoundDuration` | durée minimale | le séquenceur **tient la pose finale** jusqu'à la durée minimale depuis FIRE. Turbo et passer ne descendent jamais en dessous | **INFORMATION REQUISE** : unité (ms ou s) |
| `socialCasino` | casino social | vocabulaire adapté (ex. « play » plutôt que « bet ») et devises GC / SC | **INFORMATION REQUISE** : lexique imposé |

**Règle d'implémentation (étape 11)** : un unique module `FeatureGate` lit `jurisdiction` une seule fois, puis expose `can(feature)`. L'UI ne construit que les widgets autorisés. **Aucun widget n'est créé puis masqué.**

## 8.1.7 Autoplay (seulement si autorisé)

- Nombre de manches : 10, 25, 50 ou 100.
- **Conditions d'arrêt** :
  - sur BOSS FIGHT (activé par défaut) ;
  - sur un gain ≥ xN (optionnel) ;
  - si le solde baisse de plus de X (**recommandé obligatoire**).
- Garde le Rage Level sélectionné. Le gadget change à chaque manche comme en jeu manuel.
- S'arrête sur toute erreur, sur perte de focus de l'onglet, et si la mise dépasse le solde.
- **INFORMATION STAKE ENGINE REQUISE** : limites d'autoplay imposées par juridiction au-delà de `disabledAutoplay`.

## 8.1.8 Menu, règles, réglages

- **Règles**, en pages illustrées, sans tableur :
  - comment jouer en 3 images ;
  - les Rage Levels, avec la distribution complète de chaque niveau (tableaux générés depuis `config/rage_levels.json`) ;
  - « les gadgets d'un même niveau ont exactement les mêmes probabilités » ;
  - le BOSS FIGHT, son échelle et ses probabilités d'enchaînement ;
  - les gains max ;
  - le RTP ;
  - la charte : « les animations mettent en scène un résultat déjà déterminé ; les blessures du boss sont cosmétiques » ;
  - la gestion des déconnexions ;
  - les raccourcis.
- **Réglages** :
  - son global, musique et effets séparément ;
  - **mouvements réduits** ;
  - **mode gaucher** (contrôles inversés en miroir) ;
  - vibrations (Android).
- **Langue** : paramètre `lang`, aucun sélecteur.

## 8.1.9 Chargement, latence, erreurs

- **Chargement** :
  - écran-titre (logo, silhouette du boss en idle, barre de progression) ;
  - objectif : premier écran jouable en **moins de 3 s en 4G**, gadgets hors MVP chargés en arrière-plan ;
  - un tap sur « PLAY » est obligatoire, et il sert aussi à déverrouiller l'audio mobile.
- **Latence** :
  - la boucle d'attente du gadget la masque ;
  - au-delà de 4 s, une petite roue « … » apparaît dans un coin ;
  - au-delà de 15 s, on bascule dans le parcours d'erreur réseau.
- **Erreurs RGS** (codes documentés) :

| Code | Message joueur | Action |
|---|---|---|
| `ERR_IPB` | Solde insuffisant | Ouvre le sélecteur de mise sur la mise max possible |
| `ERR_IS` / `ERR_ATE` | Session expirée | Invite à recharger le jeu depuis le casino |
| `ERR_GLE` | Limite de jeu atteinte | Aucune relance proposée |
| `ERR_LOC` | Indisponible dans votre région | Blocage |
| `ERR_VAL` | Requête invalide | Réinitialise l'état, rapport de debug |
| `ERR_GEN` / `ERR_MAINTENANCE` | Service indisponible | Réessayer plus tard |
| `ERR_BE` (schéma web-sdk) | Une manche est déjà en cours | Parcours de reprise |

- **Délai dépassé sur `/wallet/play`** : **jamais** de nouvelle tentative automatique (risque de double mise). On rappelle `/wallet/authenticate` pour savoir si une manche est active, puis on la reprend ou on affiche l'erreur. Détail à l'étape 9.

## 8.1.10 Accessibilité et localisation

- **Accessibilité** :
  - cibles tactiles ≥ 44 px ;
  - contraste AA ;
  - au plus 3 flashs par seconde ;
  - mode mouvements réduits : pas de secousses, pas de ralentis, confettis réduits ;
  - Rage Levels distinguables en daltonisme (position + pictogramme + libellé).
- **Localisation** :
  - **16 langues** documentées par Stake ;
  - marge de +35 % sur la longueur des textes ;
  - arabe : HUD en miroir, scène non inversée ;
  - aucun texte incrusté dans les images : les panneaux (« DO NOT PULL », « APPROVED ») sont des calques localisables ou des pictogrammes ;
  - le boss parle *Bossish*, donc aucun doublage.

---

# 8.2 Caméra

## 8.2.1 Modèle (2,5D)

Une caméra virtuelle (position x/y, zoom, rotation) survole **5 couches en parallaxe** :
1. ciel et extérieur ;
2. mur du fond ;
3. plan principal (boss, bureau, gadget) ;
4. premier plan (props, plante) ;
5. mains du joueur et superpositions d'écran.

L'UI n'est jamais affectée par la caméra. Les indices de caméra sont des **données** attachées aux segments (GDD_04, §5.2.4).

## 8.2.2 Cadrage

- **Portrait** : le boss à 40 % de la hauteur de scène.
- **Paysage** : cadrage plus large, bureau centré.
- **Zone sûre du résultat** : les 60 % centraux de la scène. Toute pose finale doit y atterrir, pour que le résultat ne soit jamais caché par l'UI.

## 8.2.3 Bibliothèque de plans

| Indice | Effet | Durée typique | Turbo | Mouvements réduits |
|---|---|---|---|---|
| `CAM_WIDE` | plan d'ensemble de référence | — | identique | identique |
| `CAM_PUSH` | zoom avant lent (5 à 15 %) | 300 à 800 ms | ×2 | zoom 5 % au maximum |
| `CAM_FOLLOW` | suit l'objet principal, avec retard élastique | continu | identique | suivi sans rebond |
| `CAM_TILT_UP` / `CAM_TILT_DOWN` | panoramique vertical (piano, plafond, chute) | 300 à 600 ms | ×2 | coupe franche |
| `CAM_HOLD` | **reste fixe sur l'endroit vide** pendant que le son raconte | 600 à 900 ms | 300 ms | identique |
| `CAM_WHIP` | panoramique filé vers un autre point (Wendell, ascenseur) | 150 ms | coupe | coupe franche |
| `CAM_REACTION` | gros plan sur le visage du boss | 300 à 500 ms | 200 ms | identique |
| `CAM_POV_HIT` | la caméra « prend » le coup : fissure, suie ou coulures sur l'écran | 400 ms | 200 ms | sans tremblement |
| `CAM_POV_FALL` | chute en vue subjective (trappe sous le joueur) | 600 ms | 250 ms | fondu au noir |
| `CAM_SHAKE_S` / `M` / `L` | secousse de 2, 6 ou 14 px | 150 à 400 ms | −50 % | aucune |
| `CAM_SLOWMO` | ralenti ×0,25 à ×0,5 | ≤ 400 ms | aucun | aucun |
| `CAM_FREEZE` | image figée | 80 à 150 ms | 50 ms | identique |
| `CAM_DUTCH` | inclinaison de 5 à 8° (BIG+ uniquement) | 400 ms | aucune | aucune |

## 8.2.4 Règles

1. **Le trajet caméra du tronc commun est identique pour toutes les branches d'un gadget.** Si la caméra zoomait sur le boss avant D1 seulement quand il va perdre, elle révélerait l'issue.
2. On ne coupe **jamais** au moment du résultat, et la pose finale est tenue ≥ 400 ms (≥ 200 ms en turbo).
3. L'intensité de secousse suit la classe : MISS aucune · SCRAPE S · HIT M · BIG M · MEGA L · LEGENDARY L + figé.
4. Le ralenti est réservé aux BIG+, au silence d'un TEASE ou d'un COMEBACK (≤ 400 ms) et aux hauts paliers du BOSS FIGHT.
5. Un seul `CAM_WHIP` et un seul `CAM_DUTCH` par manche au maximum.
6. Pour les gags hors champ, `CAM_HOLD` dure 600 à 900 ms : c'est le son qui travaille.

## 8.2.5 Chronologies de référence (mode normal, book reçu à temps)

**A. HIT direct (SLG-W1, 2,8 s)**

| t (ms) | Image | Caméra | Son |
|---|---|---|---|
| 0 | FIRE, les mains entrent | CAM_WIDE | clic du bouton FIRE |
| 150 | accrochage du fauteuil | CAM_PUSH 5 % (**commun**) | grincement du cuir |
| 900 | TWANG, lâcher | — | TWANG |
| 1 000 | **D1** : cap sur la fenêtre | CAM_FOLLOW | whoosh |
| 1 900 | impact contre le bureau, bascule | CAM_SHAKE_M + CAM_FREEZE 80 ms | THUD |
| 2 100 | pieds en l'air, le mug retombe | CAM_REACTION | *tink* du mug, DING |
| 2 300 | **REVEAL** : « x2 » | — | pièces courtes |
| 2 400 | FIRE réactivé, les cartes se retournent | — | — |

**B. Double fake-out (RKT-FW1, 4,0 s)**, qui correspond à l'exemple sonore du brief

| t (ms) | Image | Caméra | Son |
|---|---|---|---|
| 0 → 1 300 | briquet, sanglage, mèche (**commun**) | CAM_WIDE puis CAM_PUSH 5 % | crépitement qui monte |
| 1 300 | **D1** : calage, bouffée de fumée | — | « pfft », la montée s'effondre |
| 1 500 | le boss rit et pose les pieds sur le bureau | CAM_REACTION | HOH-HOH-HMPF |
| 2 300 | **SILENCE** | micro-push de 3 % | ambiance à 5 %, tout le reste coupé (300 ms) |
| 2 600 | **rallumage brutal** | CAM_SHAKE_L + CAM_WHIP | rugissement |
| 3 100 | impact (tier selon le multiplicateur) | CAM_FREEZE 100 ms | impact M, DING |
| 3 500 | **REVEAL** | — | stinger de la classe |

**C. MEGA (RKT-BW, environ 6,3 s)** : plafond, silence, espace, rentrée atmosphérique, ralenti ×0,25 pendant 400 ms sur la boule de feu, figé 150 ms sur l'impact, secousse L, collègues, bandeau « MEGA HIT! ». Le bouton passer est disponible dès l'impact.

**D. Turbo (HIT, environ 1,2 s)** : tronc compressé à 350 ms (si le book est arrivé), action ×1,8, impact 250 ms, pose 200 ms, stinger court.

## 8.2.6 Recette « BIG WIN »

1. Ralenti ×0,25 pendant 400 ms à l'impact.
2. Figé de 150 ms.
3. `CAM_SHAKE_L`.
4. Coupe sur `CAM_REACTION` (boss sonné, mèche en spirale).
5. `RE_OFFICE_CHEER` : les collègues surgissent derrière les vitres.
6. Bandeau et décompte.
7. Confettis.

**Durée totale ≤ 8 s**, passable après 1,5 s (si le slam stop est autorisé).

---

# 8.3 Sound design

## 8.3.1 Philosophie

**Le son, c'est le timing comique.** Six principes :
1. **Chaque gag a une chute sonore** : *boing*, *tink*, HMPF.
2. **Le silence est un effet** : un vide de 250 à 400 ms avant la résolution d'un rebondissement.
3. **Identité sonore** : la sonnette de bureau DING, le HMPF, le tick-tock de la montre.
4. **Les pertes sonnent drôle, jamais punitif** : pas de buzzer d'échec, pas de son « négatif ». Le boss est ridicule, le joueur n'est pas humilié.
5. **Les gains montent en couches, pas en volume** : 1 DING, puis 2 DING et des cuivres, puis une cascade et un chœur, puis un jingle.
6. **Lisible les yeux fermés** : on doit reconnaître la classe de résultat au son seul.

## 8.3.2 Architecture de mixage

```
MASTER
├── MUSIC ........ idle, BOSS FIGHT, jingles (baissé de 8 dB sous les stingers)
├── SFX
│   ├── GADGET ... bruitages de chaque gadget (sprite audio par gadget)
│   ├── IMPACT ... S / M / L / XL, en couches (corps + cartoon + verre + débris)
│   └── FOLEY .... papiers, pas, mug
├── VOICE ........ Bossish, Wendell, COO (baisse l'ambiance de 6 dB)
├── AMBIENCE ..... open-space : claviers, imprimantes, téléphones, brouhaha en charabia
├── UI ........... clics, cartes, mise
└── STINGERS ..... résultats (priorité maximale)
```

- **Niveau** : environ −16 LUFS intégrés sur une session type, crêtes ≤ −1 dBTP.
- **Haut-parleurs de téléphone** : chaque « bass hit » est doublé d'un « thump » médium audible sur mobile.
- **Voix** : 16 voix simultanées au maximum. Priorité : stingers > voix > impacts > gadget > ambiance.
- **Anti-fatigue** : pitch aléatoire de ±5 % et pools de 3 à 6 variantes pour tous les sons répétés.

## 8.3.3 Identité sonore

| Son | Usage |
|---|---|
| **Sonnette DING** (son de marque) | idle (le boss sonne Wendell), et **nombre de DING = classe de gain** |
| **« HMPF »** | fin de LE SIP, signature de chaque victoire du boss |
| **Tick-tock** | idle et provocation |
| **« Tink » du mug** | chaque fois que le mug retombe debout |
| **CRACK du mug** | **une seule utilisation** : K.O. du BOSS FIGHT |
| **Carillon doré** | réservé au BOSS FIGHT (Executive Blend) |

## 8.3.4 Familles de sons

| Famille | Exemples | Variantes |
|---|---|---|
| UI | clic de FIRE (gros bouton mécanique), sélection de carte (3 hauteurs, grave à aigu selon le niveau), mise +/− (hauteur par pas) | 2 à 3 chacun |
| Anticipation | montées (risers), cordes qui grincent, mèche, compresseur, portail | par gadget |
| Whooshes | S, M, L, filé | 4 chacun |
| Impacts | S, M, L, XL en couches | 5 chacun |
| Voix du boss (*Bossish*) | environ 40 répliques : grognements, 6 HMPF, rires, jappements, « TIMBER! » | — |
| Wendell | oops, sorry, help, « I'm okay! » | 3 chacun |
| COO | roucoulements, sifflet de salut, battements d'ailes | 4 |
| Hors champ | chute longue, chat, batterie, bowling, chorale, plongeon, cartons, klaxon | 12 étages pour Trapdoor |
| Ambiance | open-space en boucle de 60 s, 3 couches | — |

## 8.3.5 Stingers de résultat

| Classe | Normal | Turbo |
|---|---|---|
| MISS | HMPF + trompette bouchée « wah-wah » (2 notes, 0,6 s). **Pas de buzzer** | HMPF seul (0,2 s) |
| SCRAPE | ballon qui se dégonfle « pfff » + petit clic (0,5 s). **Ni pièces ni sonnette** | clic (0,15 s) |
| HIT | **1 DING** + petite pluie de pièces (0,8 s) | DING (0,3 s) |
| BIG | **2 DING** + coup de cuivres + cascade de pièces (1,5 s) | 2 DING (0,5 s) |
| MEGA | **cascade de DING** + chœur « aaah » + basse qui tombe + applaudissements (2,5 s) | 0,9 s |
| LEGENDARY | jingle complet (4 s), chœur de bureau en charabia | 1,2 s |
| K.O. | *tink*… **CRACK** + coup d'orchestre + ovation (5 s) | 2,0 s |

## 8.3.6 Règles du silence

- **Un seul silence par manche**, de 250 à 400 ms (500 ms pour le TEASE de Trapdoor).
- Réservé aux TEASE, aux COMEBACK, aux BW et aux hauts paliers du BOSS FIGHT. **Jamais** dans une perte directe, sinon le silence deviendrait un faux signal.
- L'ambiance reste à 5 % : un silence total sonne comme un bug.
- En turbo, le silence est remplacé par un accroc de 80 ms.

## 8.3.7 Feuille de cues : l'exemple du brief (RKT-BW, MEGA)

| t (ms) | Événement | Son |
|---|---|---|
| 0 → 1 300 | tronc commun | clic de FIRE, briquet, boucles, mèche en stéréo + montée |
| 1 300 | allumage | rugissement (jet + explosion + whoosh cartoon) |
| 2 000 | D2 : vers le plafond | Doppler montant |
| 2 200 | traversée du plafond | CRASH, débris |
| 2 300 → 2 600 | **SILENCE** | ambiance à 5 % |
| 2 600 | plan « espace » | nappe spatiale, bip de satellite, *Bossish* au téléphone (étouffé) |
| 3 600 | rentrée | sifflement descendant de plus en plus aigu |
| 4 400 | ralenti sur la boule de feu | tout ralentit (pitch −12) |
| 4 800 | **IMPACT XL** | basse + thump médium + verre + débris |
| 5 000 | le mug retombe debout sur le bord du cratère | ***tink*** |
| 5 200 | **REVEAL** « x50 » | stinger MEGA, applaudissements |

## 8.3.8 Musique

- **Idle** : boucle « musique d'ascenseur » lounge (Rhodes, balais, 90 BPM), discrète.
- **Au tap sur FIRE** : filtre passe-bas qui se ferme et montée de tension. La musique s'efface pendant l'action et revient après le REVEAL.
- **BOSS FIGHT** : thème arcade-rock « office punk ». **Une seule boucle**, transposée d'un demi-ton à chaque palier, et des percussions supplémentaires à partir de x250.
- **Réglages** : la musique a son propre interrupteur, séparé des effets.

## 8.3.9 Technique (indépendant de la stack, précisée à l'étape 10)

- **Web Audio API** et **sprites audio par gadget**, chargés avec le gadget (lazy loading).
- **Formats** : Opus (WebM) en priorité, AAC (.m4a) en secours. **À vérifier à l'étape 10** : support d'Opus par Safari iOS selon les versions ciblées.
- **Déverrouillage audio mobile** au premier tap (bouton PLAY de l'écran-titre).
- **Budgets** : socle ≤ 1,5 Mo, chaque gadget ≤ 250 Ko (Trapdoor ≤ 400 Ko), BOSS FIGHT ≤ 600 Ko.
- **Vibrations (option)** : 20 à 40 ms sur les impacts HIT+, Android seulement, désactivables.
