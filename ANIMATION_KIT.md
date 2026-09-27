# BAD BOSS — ANIMATION KIT (PRODUCTION 3 GADGETS)

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

**Statut** : 2026-09-27.
- **Code** : `src/content/kit.ts` (chorégraphies), `src/content/office.ts` (vocabulaire des personnages), `src/render/art/BossRig.ts` et `src/render/art/castRigs.ts` (poses).
- **Référence de qualité** : la Phase 0.6 (`PHASE_0_6.md`). C'est un minimum : aucune branche des 6 nouveaux gadgets ne descend en dessous.

**Principe.** Le kit ne produit **que des cues** (des données). Il n'y a aucune logique de gadget dans le moteur.
- Une chorégraphie est écrite une fois et partagée par les 9 gadgets.
- Chaque gadget y ajoute sa mise en scène propre (ses accessoires, ses débuts, ses rebondissements).
- Remplacer une pose ou un sprite par un asset définitif ne change ni un cue, ni une durée, ni une branche, ni un book.

---

## 1. Grammaire (Phase 0.6, conservée partout)

**ANTICIPATION → ACTION → IMPACT → FOLLOW-THROUGH → RÉACTION.**

| Temps | Règle | Vérification |
|---|---|---|
| Tronc (avant D1) | Identique pour toutes les issues : aucune graine, aucun ralenti | test `presentation` (tronc identique) ; le compilateur refuse un ralenti dans le tronc |
| Début (D1) | Un début visible mène **toujours** à au moins une perte ET un gain | test `production` + audit de prévisibilité (`variety`) |
| Révélation | Au plus 800 ms après le début de la fin révélatrice (1 300 ms pour RARE/VERY RARE) | audit `variety` |
| Durée d'une manche | 3,2 à 5 s en normal (hors BOSS FIGHT) ; ≤ 3 s en turbo | audit `variety` (bande de rythme) |
| Prévisibilité | Rapport de vraisemblance gain/perte de chaque préfixe visible dans [0,5 ; 2] | audit `variety` |

## 2. Personnages

### B.B. (le boss)

Le vocabulaire est défini dans `CHARACTER_ANIMS.boss`. Chaque animation a sa pose dans `BossRig.ts`.

| Famille | Animations |
|---|---|
| Repos et running gags | `idle`, `sip`, `drink`, `mugcheck`, `tiefix`, `tapfoot`, `blink`, `smirk`, `oblivious` |
| Regards (lecture de la scène) | `lookup`, `lookdown`, `lookcam`, `lookback`, `peek`, `sniff` |
| **Kit** : mouvement | `anticipate` (squash), `airborne`, `land`, `recover`, `hop`, `tiptoe`, `climb`, `hang`, `hover`, `away` |
| **Kit** : émotions | `panic`, `confused`, `relief`, `rage`, `surprised`, `scared`, `smug`, `laugh`, `flex`, `sulk`, `phew`, `taunt`, `wave` |
| **Kit** : défense et action | `duck`, `dodge`, `catch`, `push`, `braced`, `ring` |
| Impacts et K.O. | `splat`, `ouch`, `dazed`, `dizzy`, `spin`, `fall`, `ko` (cartoon : il se relève toujours) |
| BOSS FIGHT (géant) | `grow`, `giant-idle`, `giant-wind`, `giant-hurt`, `giant-swat`, `giant-laugh`, `giant-ko` |

Chorégraphies (`bb.*`) :
- `anticipate` ;
- `airborne(at, to, ms, peak)` : cloche lisible ; x à vitesse constante, y en outQuad/inQuad ;
- `land` (écrasement, poussière, THUMP) ;
- `ko` (étoiles, BOING) ;
- `recover` (il s'époussette) ;
- `away` (il part au loin et devient une étoile) ;
- émotions en une ligne : `panic`, `confused`, `relief`, `smirk`, `rage`, `blink`, `duck`, `dodge`.

### WENDELL (le stagiaire : réagit vite, reste en retrait)

Animations : `idle`, `walk`, `run`, `cheer`, `peek`, `thumbsup`, `stuck`, `pull`, `hit`, `shrug`, `fall`, plus celles du kit : `panic`, `duck`, `dive`, `look`, `bowl`, `push`, `carry`, `dizzy`.

Chorégraphies (`wendell.*`) :
- `runIn` ;
- `walkIn` ;
- `panic` ;
- `duck` ;
- `dive` (plongeon héroïque, souvent trop tard) ;
- `look` ;
- `celebrate` (rire, **pas** d'ovation : une ovation serait un son de gain) ;
- `exit`.

### COO (le pigeon, agent double minuscule)

Animations : `idle`, `fly`, `salute`, `crash`, `applaud`, `carry`, `escape`, `land`, `shock`.

Chorégraphies (`coo.*`) : `flyTo`, `escape` (plumes), `land`, `react`, `salute`.

## 3. Accessoires

Chorégraphies `props.*` :

| Accessoire | Chorégraphie | Règle |
|---|---|---|
| MUG | `mugDrop` (suspendu, chute, CLINK, rebond), `mugBack` | Le mug revient toujours dans la main de B.B. |
| CHAIR | `chairFly` (roule et tournoie) | — |
| PLANT | `plantWobble` (feuilles) | Revient toujours à sa place |
| MONITOR | `monitorKnock(broken?)` | Étincelles et fumée seulement si cassé |
| PORTRAIT | `portraitSwing` | — |
| PAPER / DEBRIS / SMOKE | `paper`, `debris`, `smoke` : particules + son | Budget : 300 particules au plus à l'écran |

Outils composés :
- `wobble(actor, base, amp, n)` : un accessoire qui tremble ;
- `lob(actor, from, to, peak)` : arc de projectile avec rotation ;
- `hit(at, p, layers)` : impact d'objet en couches sonores BODY / OBJECT / LOW / DEBRIS / ROOM / COMEDIC (voir SOUND_BIBLE §5).

**Accessoires propres aux gadgets** (atlas par Rage Level) :
- GRUMPY : élastique, espresso (canon, aiguille, levier, vapeur), copieur (capot, feuille, bouton, ramette).
- FURIOUS : trappe (fermée, ouverte, coincée), levier, 3 classeurs-dominos et leur tiroir, rampe et bonbonne.
- UNHINGED : mèche et fusée ; coffre (fermé, ouvert), corde, gant, détonateur ; grille d'aération, thermostat et son aiguille, mini-tornade.

## 4. Caméra

| Outil | Effet | Règle |
|---|---|---|
| `cam.push(x, y, zoom, ms)` | Poussée vers l'action | Zoom de caméra ≤ 1,3 dans tout le contenu actuel |
| `cam.follow(points)` | Suivi d'un vol en plusieurs étapes | — |
| `cam.shake` / `cam.punch` | Secousse / coup de zoom | Amplitude liée à la classe (impact) |
| `cam.hitStop(ms)` | Image figée (temps réel) | Sur les impacts HIT et plus |
| `cam.impactFrame` | Silhouettes encre sur papier (environ 2 images), puis hit stop | Phase 0.6 |
| `cam.slowmo(ms, factor)` | Ralenti : la séquence avance à `factor` × le temps réel | **Normal seulement** (retiré en turbo) ; **interdit dans le tronc** (erreur de compilation) ; réservé aux moments forts d'une fin ou d'un rebondissement |
| `cam.freeze(ms)` | Silence + gel : le « moment suspendu » | Au plus un silence comique par manche |
| `cam.recover` | Retour au cadre de repos | Toujours avant la réaction |
| `cam.dutch(rot)` | Petite rotation « malaise » | Rare |

## 5. Mise en scène des résultats

**Pertes : elles doivent divertir.** Aucune perte n'est une simple absence d'événement : chacune a sa chute comique. Exemples (identifiant, nom de carte) :
- **rater avec style** :
  - COP-L1 RETURN TO SENDER : la ramette revient, bourrage, il rit ;
  - DOM-C5 REWIND (VERY RARE) : il claque des doigts, les classeurs se relèvent ;
  - BWL-S6 RETURN TO PLAYER (VERY RARE) : il renvoie la bonbonne… vers la caméra ;
- **B.B. triomphe** :
  - ESP-S4 LATTE ART (VERY RARE) : le gobelet atterrit dans son mug, le COO applaudit ;
  - COP-L7 SQUADRON (VERY RARE) : la ramette devient une escadrille d'avions en papier qui le saluent ;
- **l'objet tombe « parfaitement »** :
  - HVAC-O1 EVERYTHING IN ITS PLACE (VERY RARE) : tout retombe exactement à sa place ;
  - SAFE-L4 NESTED SAFES (VERY RARE) : un coffre dans un coffre dans un coffre, et une sonnette de bureau ;
- **Wendell s'en mêle** : il amortit, se fait arroser, sert de quille, s'envole (ESP-R3, DOM-W1, BWL-W1, HVAC-W1) ;
- **le COO vole la scène** : il emporte la ramette, fait un créneau sous le coffre, se fait aspirer par la ventilation (COP-C1, SAFE-C1, HVAC-S3).

**Gros gains (BIG et plus) : de la mise en scène, pas seulement des particules.** Chaque gros gain combine une trajectoire, un ralenti ou un hit stop, une image d'impact, un dégât visible du décor, puis les stingers (2 à 4 DING, cuivres). Exemples :
- SWIVEL SLINGSHOT, SLG-A5 « Par la fenêtre » : B.B. traverse la vitre ; pluie de verre et de papiers ;
- ESPRESSO BLASTER, ESP-S3 OVERPRESSURE : l'aiguille casse le cadran, le jet casse la vitre. ESP-J2 GEYSER : la chaudière explose, il monte avec le café ;
- COPIER CATAPULT, COP-L5 PAPER AVALANCHE : trois ramettes, un boss. COP-B3 PAPER TORNADO (RARE) : les copies l'emportent dehors ;
- CABINET DOMINO, DOM-C3 EXPRESS DELIVERY : le dernier classeur l'envoie dans l'ascenseur. DOM-D3 WRONG LEVER (RARE) : le tiroir actionne le levier de la trappe, clin d'œil entre gadgets ;
- WATER COOLER BOWLING, BWL-S4 ELEVATOR STRIKE : strike, vrille, ascenseur, les portes se ferment. BWL-B2 THE WAVE : une bonbonne, un boss, une fenêtre ouverte ;
- CEILING SAFE, SAFE-D4 GROUND FLOOR : le coffre l'emmène jusqu'en bas. SAFE-S3 IGNITION : le coffre tombe sur le fauteuil-fusée, qui décolle (clin d'œil) ;
- HVAC HURRICANE, HVAC-G3 AIR MAIL : il traverse l'open-space jusqu'à l'ascenseur. HVAC-T3 UPPER MANAGEMENT : la tornade le « promeut » à travers le plafond.

**BOSS FIGHT** : le déroulé (paliers, attaques, K.O.) est commun aux 9 gadgets.
- Seules l'**entrée** (2 par gadget) et les **projectiles** lancés sur le boss géant changent : mugs, gobelets, ramettes, tiroirs, bonbonnes, fusées, coffres, gants, écrans.
- Le compilateur utilise `bossFight(bf, projectiles)` de la bibliothèque. Un test vérifie que la chronologie est identique d'un gadget à l'autre.

## 6. Ajouter une branche (méthode)

1. Choisir un **début** existant (ou en créer un) qui mène déjà à des pertes ET des gains.
2. Écrire les modules : quelques segments `seg(id, phase, ms, policy, cues)`, en réutilisant d'abord le kit (`bb`, `wendell`, `coo`, `props`, `cam`, `hit`).
3. Déclarer la branche : `path` (préfixe visible), `d1`, `classes`, `categories` (scripts du book), `rarity`.
4. Lancer `npx vitest run tests/unit/variety.test.ts tests/unit/production.test.ts`. Ces tests contrôlent :
   - la prévisibilité, le rythme et le délai de révélation ;
   - l'atteignabilité, la règle x0,5 sans DING et les acteurs.
5. Ajouter la carte : `CARD_TEXTS` dans `src/content/collectionCards.ts` (nom unique). Un test échoue sinon.
6. Capture : `node tools/capture-gadgets.mjs --only <gadget> --at <ms>`.

## 7. Usage du kit (relevé du 2026-09-27)

Les 6 nouveaux gadgets appellent le kit **72 fois** (espresso 15, copieur 13, dominos 15, bonbonne 8, coffre 11, ventilation 10). Les appels les plus fréquents :
- ralenti ×11 ;
- poussée de caméra ×7 ;
- retour de caméra ×6 ;
- entrée de Wendell ×5 ;
- vol du COO ×5 ;
- hit stop ×5 ;
- vol de B.B. ×4.

Les 3 gadgets historiques (Phase 0.6) gardent leur chorégraphie écrite à la main. Elle est déjà au niveau de qualité, et la réécrire aurait changé leurs séquences.

Certaines chorégraphies du kit sont prêtes mais **pas encore utilisées** : `bb.land`, `bb.ko`, `bb.relief`, `bb.rage`, `wendell.dive`, `wendell.panic`, `wendell.exit`, `coo.land`, `coo.react`, `props.mugDrop`, `props.monitorKnock`, `cam.dutch`. Elles serviront aux prochaines branches (voir la dette technique dans `PRODUCTION_3_GADGETS.md`).
