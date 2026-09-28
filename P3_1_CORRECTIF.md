# BAD BOSS — P3.1 · CORRECTIF FINAL AVANT PLAYTEST #3

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

**Date** : 2026-09-28. **Préversion privée P3.1** : https://claude.ai/artifact/KC9VuCh8R6v71gcTwjpBME (Mock RGS, argent fictif ; bouton PLAYTEST).

**Portée** : passe ciblée. Deux problèmes remontés par l'utilisateur, rien d'autre :
1. la variété perçue du gadget « niveau 3, en haut à gauche » ;
2. l'affichage des autres plans (OTHER PLANS).

**Aucune modification** :
- des maths (RTP, probabilités, A2, fréquence du BOSS FIGHT, volatilité) ;
- des 8 autres gadgets ;
- de GameFlow ou du RGS.

---

## 1. Le gadget « niveau 3, en haut à gauche » : HVAC HURRICANE (plan C)

Identification par les zones réellement affichées (`dev.planRects()` sur le décor UNHINGED), sans interprétation :

| Format | Plan A · OFFICE ROCKET | Plan B · CEILING SAFE | **Plan C · HVAC HURRICANE** |
|---|---|---|---|
| Desktop 1100×760 | centre (822, 366) | centre (634, 497) | **centre (520, 204)** : le plus à gauche et le plus haut |
| 390×844 | (370, 322) | (218, 428) | **(130, 193)** |
| 360×640 | (319, 231) | (223, 298) | **(165, 148)** |

La bouche d'aération et son thermostat sont accrochés au mur du fond, en haut à gauche de B.B.

## 2. Pourquoi sa variété semblait faible (audit)

Le gadget avait bien 15 branches. Mais la **variété perçue** était la plus faible des 9 gadgets. Quatre causes, mesurées :

1. **UNHINGED = 85 % de pertes.** Ce que le joueur voit, ce sont surtout les pertes. Or trois pertes faisaient **76 % des manches** : G1 29 %, T1 29 %, S1 18 %.
2. **G1 et T1 étaient presque la même animation** : vent → B.B. s'agrippe ou se baisse → le vent tombe → petit geste → LE SIP. Même cadrage, mêmes papiers, même réaction. À elles deux, **59 % des manches**.
3. **Les premières 1,5 s étaient identiques pour toutes les branches.**
   - Le tronc durait 1,15 s : la main tourne le cadran, tout en haut à gauche et en petit.
   - Les trois débuts se ressemblaient ensuite : SUCK était le miroir de GUST (même « braced », même caméra, même trajectoire de papiers inversée), et TORNADO avait le même cadrage.
4. **Les gains courants se ressemblaient** (G2, T2, S2) : une poussée de moins de 0,4 s, puis le même choc de bibliothèque et la même réaction.

Mesures avant (rapport de variété) :
- 4,8 branches différentes vues en 10 manches (autres gadgets : 5,1 à 6,6) ;
- 29 % de « même perte deux fois de suite » (autres : 18 à 24 %).

Captures avant : `docs/production/p3_1/hvac-before.jpg`. Les 4 branches les plus fréquentes, à 0,75 s, 1,5 s et au résultat, sont identiques à 0,75 s et presque identiques à 1,5 s.

### Tableau d'audit AVANT (15 branches)

Commun à toutes les branches (0 à 1,15 s) : la main tourne le cadran au MAX (en haut à gauche), l'aiguille monte, la grille tremble, 4 papiers ; B.B. sirote, indifférent ; légère poussée de caméra.

| Branche | Début | Issue | Durée | Premières 1,5 s | Action principale | B.B. | Wendell | COO | Twist | Fin | Caméra | VFX | Son |
|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|
| G1 Tenir bon | GUST | Perte (COMMON, 29 %) | 3,43 s | tronc + rafale | la rafale retombe | agrippé, cravate, HMPF, SIP | — | — | — | il se recoiffe | centrée 1,04→1,08 | tourbillons, papiers | gust ×2, deflate, hmpf |
| G2 Contre son bureau | GUST | Gain | 3,75 s | idem | poussé contre son bureau | agrippé → choc | — | — | — | choc bureau | 1,1 | tourbillons, choc | gust ×3, thud… ding |
| G3 Vol plané | GUST | Gros gain | 4,76 s | idem | soulevé avec le fauteuil jusqu'à l'ascenseur | regard caméra en vol | — | (ovation) | — | choc ascenseur, ralenti | poussée 1,14 + suivi | tourbillons, poussière | whirr, boom… brass, cheer |
| W1 Wendell s'envole | GUST › WENDELL | Perte (UNCOMMON) | 3,50 s | idem | Wendell emporté dans l'ascenseur | sourit, rit | traverse, emporté | — | WENDELL | portes, sonnette | suivi à droite | papiers | gust, tension, laugh, bell |
| W2 Wendell à la voile | GUST › WENDELL | Gain | 4,55 s | idem | Wendell projeté sur B.B. | peur → choc | voile | — | WENDELL | choc | 1,1 | papiers | … ding |
| T1 La tornade passe | TORNADO | Perte (COMMON, 29 %) | 3,87 s | tronc + tornade | la tornade le contourne | se baisse, se relève, SIP | — | — | — | papiers sur la tête | 1,06 | tourbillons, papiers | whirr, gust, paper |
| T2 Essorage | TORNADO | Gain | 4,21 s | idem | aspiré, tourne, recraché | toupie → choc | — | — | — | choc sol | 1,08 | tourbillons | spin, whoosh… ding |
| T3 Le toit | TORNADO | Gros gain | 4,88 s | idem | à travers le plafond | toupie | — | — | — | choc plafond, ralenti | 1,04 | tourbillons, débris | … brass |
| T4 Tornade dorée | TORNADO | BOSS FIGHT | 11,6 s | idem | tornade dorée, mug doré | furieux | — | — | — | BOSS FIGHT | 1,06 | or | gold… |
| O1 Tout en place | TORNADO › ORBIT | Perte (VERY RARE) | 4,24 s | idem | écran et plante reviennent exactement à leur place | satisfait | — | applaudit | ORBIT | ralenti | retour | tourbillons | whoosh ×3, thump ×2 |
| O2 Bombardement | TORNADO › ORBIT | Gain (VERY RARE) | 4,78 s | idem | écran puis plante lui tombent dessus | aïe → choc | — | — | ORBIT | choc | 1,1 | tourbillons | … ding |
| S1 Le mug s'envole | SUCK | Perte (COMMON, 18 %) | 2,81 s | tronc + aspiration (miroir de GUST) | le mug file vers la grille, il le rattrape | attrape, content | — | — | — | CLINK | 1,1 | papiers | deflate, gust, clink |
| S2 Face contre la grille | SUCK | Gain | 3,89 s | idem | aspiré face contre la grille | vol → choc | — | — | — | choc grille | 1,12 | papiers | … ding |
| S3 Le COO aspiré | SUCK | Perte (RARE, 1,9 %) | 2,91 s | idem | le COO aspiré, recraché gris | rit | — | aspiré | — | fumée | 1,06 | fumée | coo, pfft, laugh |
| S4 Souffle doré | SUCK | BOSS FIGHT | 11,5 s | idem | lueur dorée jusqu'au mug | furieux | — | — | — | BOSS FIGHT | 1,06 | or | gold… |

**Paires perçues comme identiques** :
- G1 ≈ T1 (fin et réaction identiques) ;
- les débuts GUST ≈ SUCK (miroir) ;
- G2 ≈ S2 ≈ T2 (poussée courte + choc générique) ;
- les premières 1,5 s de TOUTES les branches.

## 3. Ce qui a changé (HVAC HURRICANE, 15 → 18 branches)

**Mêmes maths** : les classes, les scripts du book et le BOSS FIGHT sont inchangés. Seuls ont changé la mise en scène et les poids cosmétiques de deux branches : S3 RARE → UNCOMMON ; la nouvelle D3 est RARE.

1. **Tronc raccourci** de 1,15 s à 0,84 s : le début visible arrive avant 1 s.
2. **Chaque début a son cadrage, sa direction et son premier acteur dès sa première image** :

| Début | Cadrage | Direction | Premier acteur | Ce qu'on voit à 1,5 s |
|---|---|---|---|---|
| GUST | **plan serré** sur B.B. (1,16) | → | la rafale sur B.B. | B.B. agrippé, le fauteuil recule |
| TORNADO | **plan large** (0,94) | au sol | une tornade qui naît au pied de la grille et grandit lentement | B.B. regarde par terre |
| SUCK | **gros plan sur la grille** (1,18) | ← | les papiers quittent d'abord son bureau | la grille avale tout |
| **DUCTS** (nouveau) | **caméra vers le plafond** | au-dessus | la grille crachote… se tait (faux départ) ; un vacarme voyage dans le plafond | poussière qui tombe du plafond, B.B. lève les yeux |

3. **Les pertes fréquentes ont chacune leur silhouette** :
   - **G1 « Pfft » (FAST FAILURE)** : la rafale meurt sur un « pfft » pitoyable ; il n'a jamais lâché son mug ; réaction FLEX.
   - **T1 « La bougie » (faux suspense)** : la tornade s'arrête devant lui… il souffle dessus comme sur une bougie, elle s'éteint.
   - **D1 « Avion en papier » (OFF-SCREEN + LE SIP)** : le vacarme s'arrête au-dessus de lui ; un avion en papier sort du plafond, plane et atterrit DANS son mug. Il regarde, il boit quand même.
   - Inchangées : S1 (mug), W1 (Wendell dans l'ascenseur), S3 (COO aspiré, désormais UNCOMMON), O1 (tout en place).
4. **Gains** :
   - **G2 « Girouette »** : il tourne sur son fauteuil comme une girouette, puis se couche sur son bureau ;
   - **D2 « La dalle »** (réaction en chaîne) : la dalle du plafond cède, une ramette lui tombe sur la tête ;
   - **D3 « Courant d'air »** (BIG DESTRUCTION, RARE) : la gaine éclate, le courant d'air l'emporte, lui et son fauteuil, par la fenêtre.

**Silhouettes narratives désormais présentes** :
- FAST FAILURE (G1) ;
- SLOW BUILD-UP (TORNADO) ;
- FALSE START (DUCTS) ;
- DOUBLE TWIST (TORNADO › ORBIT) ;
- OFF-SCREEN EVENT (DUCTS) ;
- WENDELL INTERVENTION (W1, W2) ;
- COO INTERRUPTION (S3) ;
- ENVIRONMENT CHAIN REACTION (D2, G2) ;
- LE SIP TWIST (D1, S1) ;
- BIG DESTRUCTION (G3, T3, D3).

### Tableau APRÈS (18 branches)

Tronc commun : 0,84 s. Probabilités par manche jouée avec ce gadget.

| Branche | Début | Issue (P / manche) | Durée | Premières 1,5 s | Action principale | B.B. | Wendell | COO | Twist | Fin | Caméra | VFX | Son |
|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|
| G1 Pfft | GUST | Perte (21 %) | 3,52 s | plan serré, rafale → | la rafale meurt sur un pfft | sourire en coin, FLEX | — | — | — | une feuille retombe | serré 1,16 | tourbillons | gust ×3, deflate, pfft |
| G2 Girouette | GUST | Gain (3,1 %) | 3,88 s | idem | il tourne comme une girouette | toupie → peur → choc | — | — | — | choc bureau | 1,12 | tourbillons | gust, spin… ding |
| G3 Vol plané | GUST | Gros gain | 4,69 s | idem | fauteuil soulevé jusqu'à l'ascenseur | regard caméra en vol | — | (ovation) | — | choc ascenseur, ralenti | poussée + suivi | poussière | … brass, cheer |
| W1 Wendell s'envole | GUST › WENDELL | Perte (4,2 %) | 3,42 s | idem | Wendell emporté dans l'ascenseur | rit | emporté | — | WENDELL | sonnette | suivi | papiers | tension, laugh, bell |
| W2 Wendell à la voile | GUST › WENDELL | Gain | 4,49 s | idem | Wendell projeté sur B.B. | choc | voile | — | WENDELL | choc | 1,1 | papiers | … ding |
| T1 La bougie | TORNADO | Perte (21 %) | 3,72 s | plan large, tornade qui grandit au sol | il souffle la tornade | sourire, souffle, content, SIP | — | — | — | fumée, elle s'éteint | 1,12 | tourbillons, fumée | whirr, pfft, whoosh |
| T2 Essorage | TORNADO | Gain | 4,10 s | idem | aspiré, tourne, recraché | toupie → choc | — | — | — | choc sol | 1,08 | tourbillons | spin… ding |
| T3 Le toit | TORNADO | Gros gain | 4,77 s | idem | à travers le plafond | toupie | — | — | — | choc plafond, ralenti | 1,04 | débris | … brass |
| T4 Tornade dorée | TORNADO | BOSS FIGHT | 11,5 s | idem | tornade dorée | furieux | — | — | — | BOSS FIGHT | — | or | gold… |
| O1 Tout en place | TORNADO › ORBIT | Perte (VERY RARE) | 4,13 s | idem | tout revient à sa place | satisfait | — | applaudit | ORBIT | ralenti | retour | — | whoosh, thump |
| O2 Bombardement | TORNADO › ORBIT | Gain (VERY RARE) | 4,67 s | idem | écran puis plante | aïe → choc | — | — | ORBIT | choc | 1,1 | — | … ding |
| S1 Le mug s'envole | SUCK | Perte (13 %) | 2,70 s | gros plan grille, papiers ← | le mug file vers la grille | attrape, content | — | — | — | CLINK | 1,18 → 1,1 | papiers | deflate, rattle, clink |
| S2 Face contre la grille | SUCK | Gain | 3,78 s | idem | aspiré face contre la grille | vol → choc | — | — | — | choc grille | 1,12 | papiers | … ding |
| S3 Le COO aspiré | SUCK | Perte (4,2 %) | 2,80 s | idem | le COO aspiré, recraché gris | rit | — | aspiré | — | fumée | 1,06 | fumée | coo, pfft, laugh |
| S4 Souffle doré | SUCK | BOSS FIGHT | 11,4 s | idem | lueur dorée | furieux | — | — | — | BOSS FIGHT | — | or | gold… |
| **D1 Avion en papier** | DUCTS | Perte (21 %) | 2,88 s | pfft… silence ; caméra au plafond ; vacarme qui voyage | un avion en papier atterrit dans son mug | lève les yeux, regarde son mug, boit | — | — | — | il boit quand même | plafond → mug | poussière | pfft, rattle ×4, plop, sip |
| **D2 La dalle** | DUCTS | Gain (3,1 %) | 3,82 s | idem | la dalle cède, une ramette tombe | lève les yeux → choc | — | — | — | choc | 1,08 | poussière, papiers | clunk, debris… ding |
| **D3 Courant d'air** | DUCTS | Gros gain (RARE) | 4,71 s | idem | la gaine éclate, il part par la fenêtre | panique, vol | — | (ovation / Wendell) | — | choc fenêtre, ralenti | poussée + suivi | poussière, papiers, verre | boom, rumble, gust… brass |

**Mesures après** (même rapport de variété) :

| Mesure | Avant | Après |
|---|---:|---:|
| Branches | 15 | **18** |
| Débuts visibles | 3 | **4** |
| Perte la plus fréquente | 29 % (deux pertes presque identiques à 29 %) | **21 %** (trois pertes différentes à 21 %) |
| Branches différentes vues en 10 / 25 / 50 manches | 4,8 / 6,9 / 8,6 | **5,5 / 8,1 / 10,2** |
| Même perte deux fois de suite | 29 % | **21 %** |
| Durée moyenne d'une manche (normal / turbo) | 3,56 / 2,03 s | 3,38 / 1,93 s |

Tous les contrôles automatiques passent :
- deux issues par préfixe visible ;
- rapport de vraisemblance dans [0,5 ; 2] ;
- révélation au plus 800 ms après le début de la fin ;
- durée moyenne entre 3,2 et 5 s ;
- x0,5 sans DING ;
- chaque (classe, script) servi.

Captures : `docs/production/p3_1/hvac-after.jpg` (mêmes instants qu'avant) et `docs/production/p3_1/hvac-variety.jpg` (moments clés de 7 branches).

**Autres gadgets** : aucun changement de contenu. Seul le cadre de résultat se déplace en fin de manche (§5), pour tous.

**Collection** : 147 → **150 cartes** (UNHINGED 42 → 45). OFFICE MELTDOWN : P50 **86** / P90 **123** manches (avant 89 / 131). 100 % : 32 830 / 69 327.

## 4. OTHER PLANS : la cause réelle

| Hypothèse | Vérifiée ? |
|---|---|
| **Configuration restée PRIVATE** | **OUI, cause n° 1.** Le réglage valait **PRIVATE par défaut** (décision du POC) et était **mémorisé** dans le navigateur. Hors PLAYTEST, un navigateur neuf n'avait **aucun bouton** : 0 bouton mesuré après une manche normale. Seul le bouton PLAYTEST passait en ON-DEMAND |
| Bouton trop discret | **OUI, cause n° 2.** 34 px de haut, bleu foncé sur fond bleu foncé, texte de 12 px, collé au bord de la scène (en haut en paysage, en bas en portrait) |
| Masqué par le résultat / les étiquettes | En partie : en UNHINGED, l'étiquette HVAC HURRICANE recouvrait le texte du résultat, qui restait au milieu de la scène |
| Disparaît trop vite / mauvais état GameFlow | Non : visible en READY jusqu'au tir suivant |
| Masqué par la Collection | Non, mais le vol de la carte NEW passait par-dessus : l'action attend maintenant l'arrivée de la carte |
| Hors écran mobile / z-index | Non, mais peu lisible |
| PLAYTEST et ancien réglage | Le PLAYTEST forçait déjà ON-DEMAND, sans rétablir l'ancien réglage à la fin (corrigé) |

## 5. Nouvelle UX OTHER PLANS

1. **ON-DEMAND est la valeur par défaut** en mode 3 gadgets. Nouvelle clé de stockage : une ancienne valeur PRIVATE n'est pas reprise.
   - PRIVATE et REVEAL ALL restent des réglages DEV.
   - **PLAYTEST #3** impose ON-DEMAND à son lancement, l'enregistre dans la session, et **rétablit le réglage précédent** à la fin (questionnaire ou abandon).
2. **Après chaque manche** (perte, x0,5, gain, gros gain), une fois la carte NEW éventuelle arrivée dans le livre, une action secondaire **bien visible** apparaît :
   - un bouton papier et encre de 48 px, sous le résultat, avec **REVEAL OTHER PLANS** et en dessous « See what plans A and C held » ;
   - il reste jusqu'au tir suivant.
3. **En fin de manche (paysage), le résultat remonte en haut de la scène** en restant visible. Le milieu de la scène est libre pour les gadgets et l'action.
4. **PLAYTEST #3, première manche seulement** : une indication unique, « See what the other plans held ». Elle ne revient jamais.
5. **Le panneau** montre :
   - les trois plans **dans l'ordre où le joueur les avait devant lui** (de gauche à droite à l'écran : C, B, A en UNHINGED) ;
   - YOUR PLAN, marqué d'un cadre et d'une étiquette pleine ;
   - OTHER PLAN, discret ;
   - pour chaque plan, le nom du gadget et la valeur (`x25`, avec « BOSS FIGHT » le cas échéant), **de la même couleur pour tous** ;
   - la note « The three results are drawn together… Only YOUR PLAN is played and paid ».
6. **Le panneau reste ouvert** jusqu'à un geste du joueur : fermer, **REPLAY PLAN X** (même plan), **CHOOSE ANOTHER PLAN** (le panneau se ferme, les trois gadgets clignotent ensemble) ou FIRE, qui reste accessible.
7. **Rien n'est célébré** :
   - aucun son, aucune animation sur les valeurs ;
   - aucune couleur de gain, aucun montant en argent ;
   - aucune réaction de B.B. ;
   - aucun texte de regret ou de suggestion.
8. **Authenticité** : les valeurs sont celles du triple du book de la manche, tiré avant le choix, identique quel que soit le plan (test sur 180 manches et 3 plans).
9. **Collection** : les autres plans ne débloquent rien, même à x100 ou en BOSS FIGHT.

Captures :
- `docs/production/p3_1/otherplans-hint-desktop.jpg` : action et indication unique ;
- `otherplans-panel-desktop.jpg` : panneau ;
- `otherplans-button-*.jpg` et `otherplans-panel-*.jpg` en 360×640, 390×844, 430×932.

## 6. Tests ajoutés

**Unitaires** (`tests/unit/production.test.ts`, `poc3Content.test.ts`) :
- ON-DEMAND par défaut ; ancienne valeur PRIVATE ignorée ;
- valeurs révélées = triple exact du book ; triple identique quel que soit le plan (3 niveaux × 60 graines × 3 plans) ;
- panneau sans animation ni couleur de gain ;
- 150 cartes, nouvelles cartes aux noms uniques.

**E2E** (`tests/e2e/otherplans.spec.ts`, 8 tests) :
- réglages par défaut → ON-DEMAND ;
- bouton visible (et d'au moins 44 px) après LOSS, x0,5, WIN, BIG WIN ;
- NEW COLLECTION → l'action apparaît après le vol de la carte ;
- A/B/C dans l'ordre de l'écran, YOUR PLAN et OTHER PLAN corrects, valeurs = triple du book, 0 appel audio, 0 découverte de collection, panneau encore affiché après 6 s ;
- REPLAY PLAN et FIRE lancent la manche suivante ; CHOOSE ANOTHER PLAN rend le choix ;
- PLAYTEST → ON-DEMAND imposé même après PRIVATE ; indication unique ; réglage rétabli à la fin ;
- mobile 360×640, 390×844, 430×932 : action et panneau entièrement visibles, sans recouvrir le résultat, FIRE ni COLLECTION.

## 7. Performances après P3.1

Mesures : `node tools/p3-perf.mjs`, build de production, 9 manches (les 9 gadgets), desktop et 3 téléphones.

| Mesure | Cible | Avant P3.1 | Après P3.1 |
|---|---|---|---|
| Mémoire des textures | ≤ 64 Mo | 32,7 à 41,5 Mo | **32,7 à 41,5 Mo** (inchangée : aucun nouvel atlas, l'avion et la ramette sont des objets existants) |
| Appels de dessin / image | ≤ 60 | ≤ 10 | **≤ 10** |
| Particules | ≤ 300 | ≤ 152 | **≤ 60** sur cet échantillon |
| Temps CPU / image (moy. / p95) | — | ≈ 1 / ≤ 2,5 ms | **≈ 1,3 / ≤ 3,8 ms** |
| Erreurs / appels wallet pendant la LOOP | 0 | 0 / 0 | **0 / 0** |
| JS initial (gzip) | ≤ 300 KB | 279,4 KB | **282,1 KB** (build complet : 338,1 KB) |

Les images/s sont mesurées en rendu logiciel (SwiftShader), donc non représentatives ; elles restent à vérifier sur un vrai téléphone.

Détail : `docs/generated/P3_PERF.md`.

## 8. Maths

Inchangées : RTP, probabilités, A2 (triple tiré sans connaître le plan), BOSS FIGHT 1/150, volatilité des Rage Levels. Le rapport de vraisemblance de chaque préfixe visible reste dans [0,5 ; 2].
