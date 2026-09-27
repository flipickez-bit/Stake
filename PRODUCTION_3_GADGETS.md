# BAD BOSS — PRODUCTION 3 GADGETS PAR RAGE LEVEL

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

**Date** : 2026-09-27. **Statut** : version complète pour le **PLAYTEST #3**. On revient en arrière avec `git checkout 2c91db0` (Phase 0.6) ou `git checkout ed2b1b3` (POC 3 gadgets).

**Ce qui est livré**
- **9 gadgets réels**, 3 par Rage Level.
- **147 branches**, **147 cartes** de collection.
- Son : SOUND KIT et `SOUND_BIBLE.md` v1.
- Animation : ANIMATION KIT, `ANIMATION_KIT.md`.
- Collection niveau → gadget → animations, avec une nouvelle règle d'OFFICE MELTDOWN.
- BOSS FIGHT commun (1/150) avec entrée et projectiles propres à chaque gadget.
- 3 mondes et leurs transitions ; perf ; mobile ; DEV PANEL ; tests ; PLAYTEST #3.

**A2 = INFORMATION STAKE ENGINE REQUISE.** Le choix A/B/C (maths A2 : un triple tiré sans connaître le plan) n'est **jamais** présenté comme accepté par Stake.
- Il n'existe qu'avec le **Mock RGS**, où il est actif par défaut.
- Avec le RGS Stake, le jeu reste en **mode classique** : un gadget par Rage Level, les maths de production inchangées. `?plans=off` donne ce même mode classique dans le Mock.
- Toute l'architecture A2 reste isolée derrière les abstractions existantes : `domain/plans.ts`, `RgsPort.play(amount, mode, plan)`, `outcome.parsePlans`, `tripleMath.ts`.

---

## 1. Les 9 gadgets

| Rage Level | Plan | Gadget | Idée comique | Débuts visibles · puis rebondissements | Branches | Signature sonore |
|---|---|---|---|---|---:|---|
| GRUMPY | A | **SWIVEL SLINGSHOT** (Phase 0.6) | Précision : l'élastique, le fauteuil pivotant | LAUNCH, SPIN, BACKFIRE, ELEVATOR · puis PHEW, SIP, SIP_EMPTY, ELEV_WAIT | 17 | stretch · creak · twang · snap |
| GRUMPY | B | **ESPRESSO BLASTER** | Pression : un canon à espresso sur le bureau du joueur | SHOT, JAM, RICOCHET, FOAM · puis CATCH×2, PEEK, WENDELL | 18 | pfft · clunk · rattle · plop |
| GRUMPY | C | **COPIER CATAPULT** | Paperasse : le capot du copieur lance une ramette | LAUNCH, BLIZZARD, JAM · puis COO, WENDELL_FIX | 17 | clunk · paper · snap · boing |
| FURIOUS | A | **TRAPDOOR EXPRESS** | Le sol : trappe, levier, 12 étages | HOVER, DROP, JAM · puis FALL, TIE_CATCH, WENDELL_HELP, ELEV_WAIT, SIP, SIP_EMPTY | 16 | creak · clunk · fall · elevator |
| FURIOUS | B | **CABINET DOMINO** | Réaction en chaîne : trois classeurs-dominos | CHAIN, STALL, DRAWERS · puis WENDELL | 15 | clang · rattle · slide · creak |
| FURIOUS | C | **WATER COOLER BOWLING** | Roulement : la bonbonne en boule de bowling | STRAIGHT, HOOK, BURST · puis PAUSE, WENDELL | 16 | roll · gulp · strike · splash |
| UNHINGED | A | **OFFICE ROCKET** | Propulsion : le fauteuil-fusée | IGNITE, STALL, UP · puis ZIGZAG, REIGNITE, SMOKE, MISS, THROUGH_ROOF, ELEV_WAIT | 18 | fuse · roar · whoosh · crash |
| UNHINGED | B | **CEILING SAFE** | Gravité : un coffre-fort pend au-dessus de B.B. | DROP, SWING, LOWER · puis COO | 15 | creak · chain · boom · crank |
| UNHINGED | C | **HVAC HURRICANE** | Le vent : la ventilation poussée au maximum | GUST, TORNADO, SUCK · puis WENDELL, ORBIT | 15 | whirr · gust · rattle · crank |

### Pourquoi ces 6 nouveaux gadgets (et pourquoi aucun n'est « le bon, le moyen, le mauvais »)

- **Mêmes maths pour les trois plans d'un niveau** (A2 symétrique : 96,5 % par position, BOSS FIGHT commun 1/150). Aucun gadget ne rapporte plus : les trois se distinguent seulement par leur **texture comique**.
- **Chaque niveau propose trois directions d'attaque différentes**, pour que le choix soit un goût, pas un calcul :
  - GRUMPY : précision, pression, paperasse ;
  - FURIOUS : par le sol, par une chaîne de meubles, par une boule qui roule ;
  - UNHINGED : propulsion, gravité, vent.
- **Chaque gadget a 3 ou 4 débuts visibles, suivis de rebondissements.** Chaque préfixe visible (début, puis chaque rebondissement) mène à des pertes ET à des gains ; un test le vérifie, et le rapport de vraisemblance reste dans [0,5 ; 2].
- **Chaque gadget a aussi :**
  - 5 pertes ou plus ;
  - 5 gains ou plus ;
  - au moins un gros gain ;
  - une branche de chaque rareté (COMMON, UNCOMMON, RARE, VERY RARE) ;
  - 2 entrées de BOSS FIGHT.
- **Gags croisés entre gadgets d'un même monde** : dans DOM-D3 le tiroir actionne le levier de la trappe ; dans SAFE-S3 le coffre allume le fauteuil-fusée.
- **Mise en place physique** : chaque gadget est posé dans le décor du choix et touchable.
  - Les appareils du bureau du joueur restent **sous la ligne du sol** ; ils ne cachent plus B.B. ni son bureau (défaut du POC corrigé).
  - Chaque gadget a une animation d'attente (élastique qui vibre, vapeur, feuille, aiguille, bonbonne qui oscille, coffre qui se balance, grille qui claque).

## 2. Branches exactes par gadget

**Total : 147 branches** (dans la cible de 135 à 160) :
- 65 fins de perte ;
- 44 fins de gain ;
- 20 gros gains ;
- 18 entrées de BOSS FIGHT.

Détail des durées, des sons et des probabilités :
- `docs/generated/SOUND_CUES_P3.md` : ordre des sons, DING, durée ;
- `docs/generated/VARIETY_REPORT.md` : chemin visible, probabilité, première apparition.

Chaque branche a sa carte de collection (147 noms uniques, `src/content/collectionCards.ts`).

**SWIVEL SLINGSHOT** (GRUMPY, 17 branches)

- `SLG-A1` Rappel élastique — début : LAUNCH — perte, COMMON
- `SLG-A2` Wendell amortit — début : LAUNCH — perte, UNCOMMON
- `SLG-A3` Le grand tour — début : LAUNCH — perte, VERY RARE
- `SLG-A4` Classeur — début : LAUNCH — gain, COMMON
- `SLG-A5` Par la fenêtre — début : LAUNCH — gros gain, COMMON
- `SLG-A6` Freinage furieux — début : LAUNCH — BOSS FIGHT, COMMON
- `SLG-B1` Toupie — début : SPIN — perte, COMMON
- `SLG-B2` Perceuse — début : SPIN — gain, COMMON
- `SLG-B3` Extincteur — début : SPIN — gros gain, UNCOMMON
- `SLG-C1` BACKFIRE : l'ordinateur — début : BACKFIRE › PHEW — perte, COMMON
- `SLG-C2` Mug vide, boomerang — début : BACKFIRE › PHEW › SIP › SIP_EMPTY — gain, COMMON
- `SLG-C3` Mug vide, la vitre — début : BACKFIRE › PHEW › SIP › SIP_EMPTY — perte, COMMON
- `SLG-C4` Intact. LE SIP. — début : BACKFIRE › PHEW › SIP — perte, UNCOMMON
- `SLG-D1` Ascenseur : intact — début : ELEVATOR › ELEV_WAIT — perte, UNCOMMON
- `SLG-D2` Ascenseur : en miettes — début : ELEVATOR › ELEV_WAIT — gain, UNCOMMON
- `SLG-D3` Ascenseur : avalanche — début : ELEVATOR › ELEV_WAIT — gros gain, RARE
- `SLG-D4` Ascenseur doré — début : ELEVATOR › ELEV_WAIT — BOSS FIGHT, UNCOMMON

**ESPRESSO BLASTER** (GRUMPY, 18 branches)

- `ESP-S1` Il attrape le gobelet — début : SHOT — perte, COMMON
- `ESP-S2` En plein visage — début : SHOT — gain, COMMON
- `ESP-S3` Surpression — début : SHOT — gros gain, COMMON
- `ESP-S4` Latte art — début : SHOT — perte, VERY RARE
- `ESP-S5` Espresso doré — début : SHOT — BOSS FIGHT, COMMON
- `ESP-D1` Deux mains, deux cafés — début : SHOT › CATCH_TWICE — perte, UNCOMMON
- `ESP-D2` Le deuxième gobelet — début : SHOT › CATCH_TWICE — gain, UNCOMMON
- `ESP-J1` Panne de pression — début : JAM — perte, COMMON
- `ESP-J2` Geyser — début : JAM — gros gain, UNCOMMON
- `ESP-J3` Café offert — début : JAM › PEEK — perte, COMMON
- `ESP-J4` À bout portant — début : JAM › PEEK — gain, COMMON
- `ESP-J5` Torréfaction dorée — début : JAM — BOSS FIGHT, UNCOMMON
- `ESP-R1` Ricochet : dans la main — début : RICOCHET — perte, COMMON
- `ESP-R2` Ricochet : sur le crâne — début : RICOCHET — gain, COMMON
- `ESP-R3` Wendell, arrosé — début : RICOCHET › WENDELL — perte, RARE
- `ESP-R4` Wendell, ricochet — début : RICOCHET › WENDELL — gain, RARE
- `ESP-F1` Mousse de lait — début : FOAM — perte, UNCOMMON
- `ESP-F2` Glissade — début : FOAM — gain, UNCOMMON

**COPIER CATAPULT** (GRUMPY, 17 branches)

- `COP-L1` Retour à l'envoyeur — début : LAUNCH — perte, COMMON
- `COP-L2` Pluie de copies — début : LAUNCH — perte, COMMON
- `COP-L3` Lecture — début : LAUNCH — perte, UNCOMMON
- `COP-L4` Ramette — début : LAUNCH — gain, COMMON
- `COP-L5` Avalanche — début : LAUNCH — gros gain, COMMON
- `COP-L7` Escadrille — début : LAUNCH — perte, VERY RARE
- `COP-L6` Copie dorée — début : LAUNCH — BOSS FIGHT, COMMON
- `COP-C1` Le COO l'emporte — début : LAUNCH › COO — perte, RARE
- `COP-C2` Le COO la lâche — début : LAUNCH › COO — gain, RARE
- `COP-B1` L'éventail — début : BLIZZARD — perte, UNCOMMON
- `COP-B2` Enseveli — début : BLIZZARD — gain, UNCOMMON
- `COP-B3` Tornade de papier — début : BLIZZARD — gros gain, RARE
- `COP-J1` Un rot de papier — début : JAM — perte, COMMON
- `COP-J2` Tout le bac — début : JAM — gain, COMMON
- `COP-J3` Photocopie dorée — début : JAM — BOSS FIGHT, UNCOMMON
- `COP-W1` Wendell répare : dans l'estomac — début : JAM › WENDELL_FIX — perte, UNCOMMON
- `COP-W2` Wendell répare : en plein vol — début : JAM › WENDELL_FIX — gain, UNCOMMON

**TRAPDOOR EXPRESS** (FURIOUS, 16 branches)

- `TRP-A1` Marche sur le vide — début : HOVER — perte, COMMON
- `TRP-A2` Au revoir — début : HOVER › FALL — gain, COMMON
- `TRP-A3` Douze étages — début : HOVER › FALL — gros gain, COMMON
- `TRP-A4` Rebond — début : HOVER › FALL — perte, COMMON
- `TRP-A5` COO le repêche — début : HOVER — perte, VERY RARE
- `TRP-A6` Remontée dorée — début : HOVER › FALL — BOSS FIGHT, COMMON
- `TRP-B1` TEASE : la cravate — début : DROP › TIE_CATCH › WENDELL_HELP — perte, COMMON
- `TRP-B2` La cravate cède — début : DROP › TIE_CATCH › WENDELL_HELP — gain, COMMON
- `TRP-B3` Remonte seul, DING — début : DROP › TIE_CATCH — perte, UNCOMMON
- `TRP-B4` Ascenseur : intact — début : DROP › ELEV_WAIT — perte, UNCOMMON
- `TRP-B5` Ascenseur : en miettes — début : DROP › ELEV_WAIT — gain, COMMON
- `TRP-B6` Ascenseur : avalanche — début : DROP › ELEV_WAIT — gros gain, RARE
- `TRP-B7` Ascenseur doré — début : DROP › ELEV_WAIT — BOSS FIGHT, UNCOMMON
- `TRP-C1` Mug vide, trappe — début : JAM › SIP › SIP_EMPTY — gain, COMMON
- `TRP-C2` Mug vide, Wendell — début : JAM › SIP › SIP_EMPTY — perte, COMMON
- `TRP-C3` Rien. LE SIP. — début : JAM › SIP — perte, UNCOMMON

**CABINET DOMINO** (FURIOUS, 15 branches)

- `DOM-C1` Retour à l'envoyeur — début : CHAIN — perte, COMMON
- `DOM-C2` Écrasé — début : CHAIN — gain, COMMON
- `DOM-C3` Direct à l'ascenseur — début : CHAIN — gros gain, COMMON
- `DOM-C4` Il souffle dessus — début : CHAIN — perte, COMMON
- `DOM-C5` Rembobinage — début : CHAIN — perte, VERY RARE
- `DOM-C6` Dossier doré — début : CHAIN — BOSS FIGHT, COMMON
- `DOM-S1` Ça tient — début : STALL — perte, COMMON
- `DOM-S2` Ça cède — début : STALL — gain, COMMON
- `DOM-W1` Wendell dessous — début : STALL › WENDELL — perte, UNCOMMON
- `DOM-W2` Wendell se baisse — début : STALL › WENDELL — gain, UNCOMMON
- `DOM-D1` Repose-pied — début : DRAWERS — perte, COMMON
- `DOM-D2` Croche-pied — début : DRAWERS — gain, COMMON
- `DOM-D3` Le levier de la trappe — début : DRAWERS — gros gain, RARE
- `DOM-D4` Surf — début : DRAWERS — perte, RARE
- `DOM-D5` Tiroir doré — début : DRAWERS — BOSS FIGHT, UNCOMMON

**WATER COOLER BOWLING** (FURIOUS, 16 branches)

- `BWL-S1` Saut de haie — début : STRAIGHT — perte, COMMON
- `BWL-S2` Au goulot — début : STRAIGHT — perte, COMMON
- `BWL-S3` Strike — début : STRAIGHT — gain, COMMON
- `BWL-S4` Strike : l'ascenseur — début : STRAIGHT — gros gain, COMMON
- `BWL-S5` Eau dorée — début : STRAIGHT — BOSS FIGHT, COMMON
- `BWL-S6` Retour au joueur — début : STRAIGHT — perte, VERY RARE
- `BWL-P1` Marche arrière — début : STRAIGHT › PAUSE — perte, UNCOMMON
- `BWL-P2` Le dernier tour — début : STRAIGHT › PAUSE — gain, UNCOMMON
- `BWL-H1` Gouttière — début : HOOK — perte, COMMON
- `BWL-H2` Effet rétro — début : HOOK — gain, COMMON
- `BWL-W1` Wendell, quille — début : HOOK › WENDELL — perte, RARE
- `BWL-W2` Wendell saute — début : HOOK › WENDELL — gain, RARE
- `BWL-B1` Arrosage — début : BURST — perte, UNCOMMON
- `BWL-B4` La douche — début : BURST — gain, UNCOMMON
- `BWL-B2` La vague — début : BURST — gros gain, UNCOMMON
- `BWL-B3` Pluie dorée — début : BURST — BOSS FIGHT, UNCOMMON

**OFFICE ROCKET** (UNHINGED, 18 branches)

- `RKT-A1` Balade et atterrissage — début : IGNITE › ZIGZAG — perte, COMMON
- `RKT-A2` Zigzag, classeur — début : IGNITE › ZIGZAG — gain, COMMON
- `RKT-A3` Zigzag, fenêtre — début : IGNITE › ZIGZAG — gros gain, COMMON
- `RKT-A4` Vol stationnaire — début : IGNITE — BOSS FIGHT, COMMON
- `RKT-B1` Pétard mouillé — début : STALL — perte, COMMON
- `RKT-B2` Rallumage, plafond — début : STALL › REIGNITE — gain, COMMON
- `RKT-B3` WENDELL CEILING — début : STALL › REIGNITE › SMOKE — perte, COMMON
- `RKT-B9` Fumée : l'extincteur — début : STALL › REIGNITE › SMOKE — perte, VERY RARE
- `RKT-B4` Fumée : B.B. au plafond — début : STALL › REIGNITE › SMOKE — gain, COMMON
- `RKT-B5` Fumée : le cratère — début : STALL › REIGNITE › SMOKE — gros gain, RARE
- `RKT-B6` Fumée dorée — début : STALL › REIGNITE › SMOKE — BOSS FIGHT, UNCOMMON
- `RKT-B7` Elle part sans lui — début : STALL › REIGNITE › MISS — perte, RARE
- `RKT-B8` COO fait demi-tour — début : STALL › REIGNITE › MISS — gain, RARE
- `RKT-C1` Coupe ventilateur — début : UP — perte, UNCOMMON
- `RKT-C2` Plafond direct — début : UP — gain, UNCOMMON
- `RKT-C3` Le toit, puis l'ascenseur : intact — début : UP › THROUGH_ROOF › ELEV_WAIT — perte, UNCOMMON
- `RKT-C4` Le toit, puis l'ascenseur : en miettes — début : UP › THROUGH_ROOF › ELEV_WAIT — gain, UNCOMMON
- `RKT-C5` Le toit, puis l'ascenseur : avalanche — début : UP › THROUGH_ROOF › ELEV_WAIT — gros gain, RARE

**CEILING SAFE** (UNHINGED, 15 branches)

- `SAFE-D1` Sur le crâne — début : DROP — gain, COMMON
- `SAFE-D2` Coup de talon — début : DROP — perte, COMMON
- `SAFE-D3` Boing — début : DROP — perte, COMMON
- `SAFE-D4` À travers le plancher — début : DROP — gros gain, COMMON
- `SAFE-D5` Coffre doré — début : DROP — BOSS FIGHT, COMMON
- `SAFE-S1` Par la fenêtre — début : SWING — perte, COMMON
- `SAFE-S2` Au passage — début : SWING — gain, COMMON
- `SAFE-S3` La fusée s'allume — début : SWING — gros gain, UNCOMMON
- `SAFE-C1` Créneau du COO — début : SWING › COO — perte, RARE
- `SAFE-C2` Coup de patte — début : SWING › COO — gain, RARE
- `SAFE-L1` Café au coffre — début : LOWER — perte, COMMON
- `SAFE-L2` Le gant — début : LOWER — gain, COMMON
- `SAFE-L3` La porte — début : LOWER — gain, UNCOMMON
- `SAFE-L4` Poupées russes — début : LOWER — perte, VERY RARE
- `SAFE-L5` Trésor doré — début : LOWER — BOSS FIGHT, UNCOMMON

**HVAC HURRICANE** (UNHINGED, 15 branches)

- `HVAC-G1` Tenir bon — début : GUST — perte, COMMON
- `HVAC-G2` Contre son bureau — début : GUST — gain, COMMON
- `HVAC-G3` Vol plané — début : GUST — gros gain, COMMON
- `HVAC-W1` Wendell s'envole — début : GUST › WENDELL — perte, UNCOMMON
- `HVAC-W2` Wendell à la voile — début : GUST › WENDELL — gain, UNCOMMON
- `HVAC-T1` La tornade passe — début : TORNADO — perte, COMMON
- `HVAC-T2` Essorage — début : TORNADO — gain, COMMON
- `HVAC-T3` Le toit — début : TORNADO — gros gain, UNCOMMON
- `HVAC-T4` Tornade dorée — début : TORNADO — BOSS FIGHT, COMMON
- `HVAC-O1` Tout en place — début : TORNADO › ORBIT — perte, VERY RARE
- `HVAC-O2` Bombardement — début : TORNADO › ORBIT — gain, VERY RARE
- `HVAC-S1` Le mug s'envole — début : SUCK — perte, COMMON
- `HVAC-S2` Face contre la grille — début : SUCK — gain, COMMON
- `HVAC-S3` Le COO aspiré — début : SUCK — perte, RARE
- `HVAC-S4` Souffle doré — début : SUCK — BOSS FIGHT, UNCOMMON

## 3. Flux de jeu (Mock, mode 3 gadgets)

1. **BET**.
2. **CHOOSE RAGE**. Chaque niveau se souvient de son dernier gadget : rejouer le même gadget ne demande qu'un geste.
3. **CHOOSE PLAN**, en touchant le gadget dans le décor.
4. **FIRE**. Le plan part AVEC la mise et devient immuable (invariant I9).
5. **RESULT**.
6. **Découverte** : une carte vole vers le livre.
7. **REVEAL OTHER PLANS** : uniquement à la demande, sans son ni célébration.
8. **NEXT**.

Règles d'affichage des autres plans (`src/app/poc/OtherPlans.svelte`) :
- ON-DEMAND est l'expérience principale ; c'est celle du PLAYTEST #3 ;
- PRIVATE et REVEAL ALL sont des réglages DEV ;
- le vocabulaire est neutre, contrôlé par `FORBIDDEN_PHRASES` et ses tests.

## 4. Collection (niveau → gadget → animations)

Le livre suit le mode, pour qu'aucune règle ne soit impossible à remplir :

| Mode | Catalogue | OFFICE MELTDOWN | P50 / P90 (manches) | 100 % P50 / P90 |
|---|---|---|---:|---:|
| **3 gadgets** (Mock) | **147 cartes** : GRUMPY 46 · FURIOUS 41 · UNHINGED 42 · BOSS FIGHT 18 | **≥ 4 découvertes avec CHACUN des 9 gadgets** (cartes BOSS FIGHT non requises) | **89 / 131** (joueur réparti) · 161 / 261 (plan préféré 60/25/15) · jamais (3 gadgets seulement) | **31 710 / 69 068** (réparti) · 34 833 / 66 452 (plan préféré) |
| Classique (Stake tant qu'A2 n'est pas confirmée ; `?plans=off`) | 51 cartes (3 gadgets) | ≥ 8 dans chaque Rage Level (règle historique) | 70 / 113 | 9 844 / 22 880 |

**OFFICE MELTDOWN : pourquoi N = 4.** L'épisode doit récompenser l'exploration des 9 gadgets sans jamais s'ouvrir avec trois gadgets seulement. Le choix vient d'un calcul exact (Poisson-binomial ; `docs/generated/COLLECTION_REPORT_P3.md`) :
- N = 2 → 42 / 64 manches ; trop tôt ;
- N = 3 → 63 / 92 ;
- **N = 4 → 89 / 131** : environ deux PLAYTEST de 50 manches ;
- N = 5 → 126 / 195 ; trop long.

Avec N = 4, un joueur qui ne joue que trois gadgets (un par niveau, ou les trois d'un niveau) ne débloque **jamais** l'épisode (test).

**Garanties de la collection :**
- l'épisode reste sans mise, sans payout et sans chiffre ;
- il met maintenant en scène **8 tableaux**, dont 3 gadgets B/C avec leurs gags croisés (espresso, dominos → trappe, coffre → fusée) ;
- le 100 % reste purement cosmétique (trophée + thème d'album) ;
- aucune fréquence de branche n'a été modifiée pour la collection.

**Seul le gadget JOUÉ découvre ses cartes.** Les plans révélés ne débloquent rien ; un test le vérifie avec le vrai Presenter, sur les trois niveaux.

La progression est affichée en faits (« 6 / 16 », « ESPRESSO BLASTER 3 / 4 »). Le vocabulaire interdit est testé : ONE MORE, ALMOST THERE, YOU'RE DUE, LUCKY, HOT, WIN MORE, MISSED WIN, SO CLOSE, WRONG CHOICE, TRY B NEXT, JACKPOT MISSED…

## 5. BOSS FIGHT

- **Fréquence inchangée : 1/150**, commune à la manche. Elle ne dépend ni du plan ni du gadget.
- Le déroulé est identique pour les 9 gadgets (test) : paliers, attaques, K.O.
- Seules changent l'**entrée** (2 par gadget) et les **projectiles** lancés sur le boss géant (mugs, gobelets, ramettes, tiroirs, bonbonnes, fusées, coffres, gants, écrans).
- Musique : ostinato de combat, de l'arène au K.O. Captures : `docs/production/bossfight/`.

## 6. Mondes et transitions

| Monde | Caractère | Transition d'arrivée (500 ms, image seulement) |
|---|---|---|
| GRUMPY | Bureau propre, lumière chaude | depuis un niveau plus fou : **nettoyage cartoon** (une bande « papier » balaie l'écran, avec des éclats) |
| FURIOUS | Lumière orangée, classeurs cabossés, trappe et levier | depuis GRUMPY : **dégradation** (bouffée chaude, papiers qui tombent, secousse) |
| UNHINGED | Violet, plafond fissuré, fils, coffre, ventilation | **chaos** (deux coupures de courant à 3 Hz au plus, alarme rouge, secousse sèche) |

Le nouvel habillage s'applique à mi-course. Il n'y a aucune transition en capture hors écran (vignettes), ni au démarrage.

Captures avec et sans interface (test de lisibilité du monde) : `docs/production/worlds/`, en desktop et en 360×640, 390×844 et 430×932.

## 7. Performances (mesurées)

| Mesure | Cible | Mesuré |
|---|---|---|
| JS initial (gzip) | ≤ 300 KB | **279,4 KB** (écrans DEV, playtest, collection et épisode chargés à la première ouverture) |
| Total du build (gzip) | — | 335,4 KB (`docs/generated/BUILD_SIZE.md`) |
| Mémoire des textures | ≤ 64 Mo | **32,7 à 40,5 Mo** selon le format, après les 9 gadgets (`docs/generated/P3_PERF.md`) |
| Appels de dessin / image | ≤ 60 | **≤ 10** (8 au choix, 7 en moyenne en manche) |
| Particules | ≤ 300 | **≤ 226** (LOOP ×100 GRUMPY), ≤ 134 en vitesse normale |
| Temps CPU / image | — | ≈ 1,1 ms en moyenne, p95 ≤ 3,3 ms |
| Scène prête / livres différés | — | 1,2 à 1,5 s en téléphone émulé, puis +50 à 100 ms pour FURIOUS, UNHINGED et plans |
| 60 FPS (45 minimum) | appareil réel | **NON MESURÉ** : Chromium headless utilise un rendu logiciel (SwiftShader, 7 à 10 images/s pour tous les builds). À mesurer sur un vrai téléphone |

**Chargement des atlas** :
- Les livres de base (personnages, accessoires, décor, art doux) sont rastérisés avant la première image.
- Les livres de FURIOUS, d'UNHINGED et des plans B/C sont **préchargés juste après**, en parallèle de la connexion au RGS. Leurs pièces sont déclarées d'avance, donc la scène se construit tout de suite.
- La première manche, reprise comprise, attend ces livres.

**Étude des atlas pré-rendus au build** (`docs/generated/ATLAS_BAKE_STUDY.md`) :

| Option | Chiffres | Contraintes |
|---|---|---|
| Pré-rendu WebP | 269 KB (q 0,8) à 342 KB (q 0,9) à télécharger | Supprimerait le recours à `blob:` et `data:` |
| Rastérisation au démarrage (actuelle) | ≈ 115 ms au total sur la machine de build | Demande `img-src blob:` ou `data:` (avec repli automatique) |

**Décision** : on garde la rastérisation au démarrage. On passera au WebP si un vrai téléphone dépasse environ 300 ms, ou si la politique CSP de Stake interdit `blob:` et `data:` (INFORMATION STAKE ENGINE REQUISE).

## 8. Mobile

- Portrait prioritaire (360×640, 390×844, 430×932) :
  - la scène prend toute la hauteur que laisse le HUD, sans bande vide sur les grands téléphones ;
  - la caméra borne le haut du cadre au plafond ; un écran plus haut montre le bureau du joueur.
- Les étiquettes des plans se mesurent et s'écartent quand elles se chevauchent (360 px) ; sinon, la plus à droite monte d'un cran.
- En paysage, les gadgets B/C ne cachent plus le bas du bureau : ils sont posés sur le bureau du joueur, sous le sol de la pièce.

## 9. DEV PANEL

Réglages disponibles :
- Rage Level ;
- gadget (qui choisit le plan) ;
- **recherche de branche** (147 branches, filtre par niveau, gadget, issue et rareté, texte) ;
- issue, multiplicateur et graine imposés ;
- vitesse ;
- BOSS FIGHT (aperçu sans mise) ;
- NEW DISCOVERY forcée pour le gadget choisi ;
- affichage des autres plans (PRIVATE / ON-DEMAND / REVEAL ALL) ;
- récompenses (SET MELTDOWN − 1, 100 %) ;
- replay et reprise ;
- pannes réseau (hors ligne, Play perdu, EndRound perdu, latence) ;
- LOOP ×20 / ×100 (plans A → B → C) ;
- étude A/B du POC (2 × 30 manches).

Crochets de capture et de test : `window.__BADBOSS__.dev.forceBranch(gadget, branche)`, `dev.loop({ plans })`.

## 10. Tests

- **Unitaires** : 14 fichiers, tous verts (liste et nombres dans le rapport final). En particulier :
  - contenu des 9 gadgets ;
  - atteignabilité de chaque branche ;
  - deux issues par début ;
  - rythme ;
  - x0,5 sans DING ;
  - déterminisme des sons ;
  - pas de `Math.random` dans `src/` ;
  - collection : seul le gadget joué découvre ses cartes ; mode classique ;
  - immuabilité du plan sur les 3 niveaux ;
  - LOOP ×100 par niveau et par plan (3 vitesses) ;
  - pannes réseau en mode 3 gadgets ;
  - PLAYTEST #3.
- **E2E** (Playwright) : flux RGS classique ; plans (choix avant Play, double tap, rechargement) ; ON-DEMAND silencieux ; collection et MELTDOWN (9 gadgets et classique) ; PLAYTEST 50 et PLAYTEST #3.
- **LOOP ×100 par Rage Level dans le navigateur** (turbo, plans A → B → C, les 9 gadgets ; `docs/generated/LOOP_X100_P3_{GRUMPY,FURIOUS,UNHINGED}.md`) :

| Niveau | Manches / reveal | Erreurs | Appels wallet | Tas après GC (0 → 50 → 100) | Nœuds (repos → stable) | Particules max |
|---|---|---|---:|---|---|---:|
| GRUMPY | 100 / 100 | 0 | 0 | 8,8 → 10,2 → 10,3 Mo | 280 → 506 | 226 |
| FURIOUS | 100 / 100 | 0 | 0 | 8,7 → 10,0 → 10,2 Mo | 280 → 389 | 104 |
| UNHINGED | 100 / 100 | 0 | 0 | 8,8 → 10,5 → 10,7 Mo | 280 → 441 | 145 |

  Pas de fuite : après la chauffe (réservoirs de particules et vues créés une fois), le tas et les nœuds ne bougent plus.

## 11. PLAYTEST #3

Le bouton **PLAYTEST** du Mock lance la session. Tout reste local : export manuel, argent fictif.
- 50 manches comme un joueur normal, en ON-DEMAND.
- Mesures par manche : niveau, **plan et gadget**, issue, durée, vitesse, découverte.
- Changements de gadget dans un même niveau, usage de REVEAL OTHER PLANS (après perte ou gain).
- Questionnaire à la fin seulement :
  - les 8 affirmations des PLAYTEST #1/#2, pour la comparaison ;
  - 3 affirmations sur les gadgets (intérêt égal des trois gadgets, plaisir de choisir, impression qu'un gadget rapporte plus : une note basse est attendue, puisque les maths sont symétriques) ;
  - la question libre « Quel gadget as-tu préféré, et pourquoi ? ».

## 12. Informations encore requises de Stake (INFORMATION STAKE ENGINE REQUISE)

1. **A2 en production** (Q21–Q29 de `docs/STAKE_A2_TECH_SUMMARY.md`) :
   - 9 modes au coût 1,0 ;
   - books quasi identiques ;
   - tirage identique entre modes ;
   - affichage des résultats non joués (règles de « near miss » et d'« illusion de contrôle » par juridiction) ;
   - provably fair ;
   - `/bet/replay` avec le triple ;
   - autoplay du dernier mode ;
   - étape de choix et `minimumRoundDuration` ;
   - RTP à poids entiers.
2. **Méta-progression** (COLLECTION BOOK) :
   - acceptée ? par juridiction ?
   - stockage persistant côté joueur ;
   - badge NEW après une perte ;
   - récompenses cosmétiques (`docs/STAKE_ENGINE_FAITS_VERIFIES.md` §11).
3. **Hébergement et sécurité** : CSP (`img-src blob:` / `data:` pour la rastérisation des atlas), hébergement des fichiers statiques (atlas WebP éventuels), taille maximale du build.
4. **Audio** : formats, taille, lecture automatique, bouton muet imposé.
5. **Validation de la fréquence du BOSS FIGHT** (1/150 inchangée) dans le cadre A2.

## 13. Problèmes connus

1. **Images/s jamais mesurées sur un appareil réel.** L'environnement de test n'a pas de GPU (SwiftShader). La cible 60 FPS (45 minimum) reste à vérifier sur un téléphone moyen de gamme.
2. **Rythme** : durée moyenne d'une manche de 3,26 à 4,37 s selon le gadget (test : 3,2 à 5 s). Quatre gadgets sont sous 3,5 s en moyenne : COPIER 3,42, DOMINO 3,45, BOWLING 3,35, SAFE 3,26. Quelques pertes directes durent environ 2,5 s ; le SWIVEL SLINGSHOT (Phase 0.6) garde des branches courtes (SLG-A2 : 2,35 s).
3. **Sons synthétisés** (placeholders WebAudio). Voix en tons, pas de vraie musique ; les cibles de sonie (−16 LUFS) ne sont pas vérifiables.
4. **Mock : même stockage de collection en mode 3 gadgets et en mode classique.** Un jalon atteint dans un mode reste acquis dans l'autre. Stake n'est pas concerné (mode classique seulement).
5. **Mode LOOP « all »** : une transition de monde (500 ms) se joue à chaque manche. C'est du rendu seulement.
6. **Étiquettes des plans à 360 px** : l'écartement automatique peut éloigner légèrement une étiquette de son gadget.
7. **REVEAL OTHER PLANS et affichage des résultats non joués** : conforme aux règles internes (neutre, silencieux, à la demande), mais **non validé par Stake ni par une juridiction** (Q24).

## 14. Dette technique

1. Les 3 gadgets historiques (Phase 0.6) n'utilisent pas l'ANIMATION KIT. Plusieurs chorégraphies du kit ne sont pas encore utilisées (`ANIMATION_KIT.md` §7).
2. Le contenu des 9 gadgets est dans le bundle initial (~23 KB de marge sous 300 KB). Prochaine étape possible : charger le contenu d'un Rage Level à la demande.
3. Atlas rastérisés au démarrage (SVG → canvas) ; pré-rendu au build étudié, non fait (§7).
4. Les atlas ne sont jamais déchargés (≤ 40,5 Mo, sous le budget).
5. Le nom « POC » survit dans le code (`poc`, `PocDevSection`, `?poc=3gadget`, `build:poc`) alors que le système est en production. Renommage à faire hors d'un lot fonctionnel.
6. Deux enregistreurs de playtest (`dev/playtest.ts` pour le PLAYTEST #3, `dev/pocPlaytest.ts` pour l'étude A/B) : à fusionner après le PLAYTEST #3.
7. `DevPanel.svelte` est volumineux (chargé seulement à la demande) : à découper.
8. Rapports générés à la main (`VARIETY_REPORT`, `COLLECTION_REPORT_P3`, `SOUND_CUES_P3`, `P3_PERF`, `LOOP_X100_P3_*`) : pas encore en CI.

## 15. Commandes

```bash
npm run dev                         # Mock, 3 gadgets par Rage Level (?plans=off : mode classique ; ?dev=1 : DEV PANEL)
npm test                            # tests unitaires
npm run test:e2e                    # Playwright
npm run build:single                # préversion en un fichier (dist-single/index.html)
node tools/p3-perf.mjs --markdown docs/generated/P3_PERF.md
node tools/loop-benchmark.mjs --count 100 --level furious --sample 50 --markdown docs/generated/LOOP_X100_P3_FURIOUS.md
node tools/capture-gadgets.mjs --url http://localhost:4199/ --only DOM-D3 --at ending+250,reveal,reveal+500
node tools/capture-worlds.mjs --url http://localhost:4199/ --out docs/production/worlds
node tools/atlas-bake-study.mjs --markdown docs/generated/ATLAS_BAKE_STUDY.md
SOUND_REPORT=docs/generated/SOUND_CUES_P3.md npx vitest run tests/unit/production.test.ts
```
