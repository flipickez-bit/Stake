# BAD BOSS — ART BIBLE (Phase 0.6)

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**
> Règle d'or : **tout ce qui est à l'écran vient du MÊME jeu**. Un bel asset hors bible est un bug.
> Source unique des couleurs : `src/render/art/palette.ts`. Vérification automatique : `tests/unit/artBible.test.ts`.

## 1. Direction en une phrase
**CARTOON OFFICE CHAOS** — comédie physique de bureau, en 2D/2.5D premium :
- encrage franc et chaud ;
- aplats saturés baignés d'une **lumière de fin de matinée venant de la fenêtre (en haut à gauche)** ;
- ombres en aplats froids ;
- personnages aux silhouettes lisibles même entièrement noires ;
- animation exagérée : anticipation, squash & stretch, impact, suite du mouvement, réaction.

**Ce n'est pas** : du clipart, des emoji, des formes géométriques « finales », de l'interface bootstrap, du jeu éducatif, du mobile générique, de la 3D, une copie d'une licence existante.

## 2. Lumière (reprise de la méthode « Game Assets Enhancer », sans son service payant)
1. **Une seule direction de lumière** : la fenêtre, en haut à gauche.
   - Plans éclairés en haut à gauche de chaque volume.
   - Ombres en bas à droite.
   - Liseré chaud (`light.rim`) sur les bords hauts.
2. **Sous-teinte chaude partagée** : aucune couleur « brute ». Les ombres sont violettes et froides (`*.shade`), jamais grises ni noires.
3. **Vraie plage de valeurs** : chaque volume a **une forme d'ombre nette** (cel shading) et, s'il est arrondi, **une forme de lumière**. Pas de dégradé « aérographe » sur les personnages.
   - Les dégradés doux sont réservés aux grandes surfaces : murs, sol, ciel, halos.
4. **Perspective atmosphérique** :
   - plus une couche est loin, plus elle est claire, désaturée, peu contrastée, avec un trait fin ou sans trait ;
   - le premier plan (bureau du joueur) est plus sombre et plus doux.
5. **Étalonnage en code** : voile chaud radial depuis la fenêtre + vignettage léger, par-dessus la scène composée.
   - Pré-calculés (textures), jamais en filtre temps réel.
6. **Événements** :
   - flash d'impact bref (≤ 60 ms à pleine intensité) ;
   - « impact frame » (1 à 2 images, silhouette encre sur blanc) ;
   - variations d'éclairage par monde (§9).

## 3. Trait
Échelle unique (`STROKES` dans `palette.ts`, vérifiée en test) :

| Catégorie | Contour | Traits du visage | Traits intérieurs | Détails | Couleur |
|---|---:|---:|---:|---:|---|
| Personnages | 4,5 | 4 / 3,5 / 3 | 2,5 / 2 | 1,5 | `ink` |
| Accessoires du plan d'action (`prop`) | 3,5 | — | 3 / 2,5 / 2 | 1,5 | `ink` |
| Milieu de décor (`mid`) | 2,5 | — | 2 | 1,5 | `ink` / `inkSoft` |
| Fond (`background` : mur, fenêtre, cadres) | 2,5 max | — | 2 | 1,5 | `inkSoft` |
| Lointain (`far` : skyline) | aucun | — | — | — | — |
| VFX (`vfx`) | 3 (éclats) / 2 | — | — | 1,5 | `ink` ; aucun trait sur fumée et lumière |

- Unités du monde : B.B. mesure ≈ 250 unités du pied au haut du crâne (≈ 270 avec la touffe).
- Jointures et extrémités **arrondies**.
- **Jamais de noir pur** (`#000`) : l'encre est un violet-brun très sombre (`ink`).
- Exception déclarée : les « tubes » à double trait (anse des mugs, tuyau d'extincteur, reflets de vitre) portent
  l'attribut `data-tube` ; ils restent soumis à la palette.

## 4. Palette (extrait — la source est `palette.ts`)
| Rôle | Base | Ombre | Lumière |
|---|---|---|---|
| Encre | `#2A1B2F` | — | — |
| Costume de B.B. | `#6A3FA3` | `#4B2A7C` | `#8A5FC7` |
| Cravate / mug de B.B. (signature) | `#FFC21F` | `#E08F12` | `#FFE37A` |
| Peau | `#F7C8A2` | `#DD9B7C` | `#FFE3C8` |
| Cheveux de B.B. | `#3A2150` | — | `#5E3A7E` |
| Chemise de Wendell | `#A8D8F2` | `#78AFD6` | `#D2EEFF` |
| COO | `#A69BC4` | `#7C7199` | `#C9C1E0` |
| Mur | `#F2E2C4` | `#D9C3A0` | `#FFF3DC` |
| Bois | `#A2603A` | `#7C4526` | `#C07A45` |
| Métal | `#B4BDC9` | `#8792A3` | `#DCE3EC` |
| Plante | `#52B45C` | `#2F8745` | `#8ED66A` |
| Rouge (extincteur) | `#E23B3B` | `#A82323` | `#FF7A6B` |
| Turquoise (mug du JOUEUR uniquement) | `#2EC4B6` | `#1E8F86` | — |

Couleurs **réservées** (ne jamais les utiliser ailleurs) :
- l'or `gold.*` signale le BOSS FIGHT (mug doré, halo) ;
- le turquoise est le mug du joueur ;
- les jaunes et verts « de gain » du HUD ne servent jamais au feedback de collection.

## 5. Personnages

### 5.1 B.B. (Barnaby Bottomline) — la vedette
- **Silhouette** : énorme tête en poire (mâchoire et bajoues larges), **une touffe en flamme** qui penche vers l'avant, torse-tonneau violet, **petites jambes**, **mains surdimensionnées**, le mug jaune toujours à la main. Reconnaissable en noir complet : tête + touffe + tonneau + mug.
- **Proportions** : ≈ 2,5 têtes de haut (≈ 250 unités, 270 avec la touffe). Tête ≈ 100 × 108, touffe ≈ 45, torse ≈ 140 × 116, jambes ≈ 30, mains ≈ 40 (× 1,22). Fauteuil de direction plus large que lui et plus haut que sa tête (« trône »).
- **Signatures** : costume violet, **cravate jaune à clip**, pochette jaune, **gros nez rond rosé**, sourcils épais, calvitie brillante, mug jaune.
- **Visage animable** :
  - yeux (blanc, pupille, paupière supérieure) ;
  - sourcils (angle et hauteur, indépendants) ;
  - bouche (jeu de formes) ;
  - joues (rougeur, gonflement) ;
  - touffe (ressort) ;
  - inclinaison et rebond de la tête.
- **Expressions (fiche)** :

| Expression | Yeux | Sourcils | Bouche | Corps |
|---|---|---|---|---|
| Arrogance | mi-clos, pupilles basses | un sourcil levé | sourire en coin | torse bombé, menton haut |
| Confusion | ouverts, pupilles écartées | asymétriques | ondulée | tête penchée |
| Peur | très ouverts, pupilles minuscules | relevés au centre | dents serrées | bras levés, jambes qui flageolent |
| Soulagement | fermés | détendus | « ouf » (petite bouche) | épaules qui retombent |
| Colère | ouverts | en V, bas | dents | rouge au visage, tremblement |
| Fausse confiance | trop ouverts | hauts | sourire trop large | goutte de sueur |
| Panique | très ouverts | tout en haut | O | touffe dressée |
| KO cartoon | spirales ou X | — | langue | étoiles autour de la tête |

- **LE SIP** (signature, jamais un signe de perte) : il regarde le joueur, sourire en coin, lève lentement le mug, **pause**, **SIP** (tête en arrière, yeux fermés), redescend le mug, **un sourcil se lève**, puis l'action continue.
  - Tempo (800 ms) : 0-100 ms regard ; 100-330 montée lente ; 330-420 pause ; 420-620 SIP ; 640-800 sourcil levé.
    Le son « sip » est calé vers 440 ms (réaction RE_SIP, battement SIP_BEAT).
  - Au repos (READY), il revient en boucle toutes les ≈ 5,2 s, entre des coups d'œil et des clignements.

### 5.2 Wendell — le survivant
- **Silhouette** : grand et mince (≈ 1,1 × B.B.), **voûté**, long cou, **grosses lunettes rondes**, cheveux en bataille, chemise bleu pâle à manches courtes, cravate verte, badge sans texte.
- **Jeu** : nerveux, rapide, toujours en retrait. Personnage de réaction, victime collatérale, source de twists. **Il ne vole jamais la vedette** : il n'est jamais au centre du cadre au moment de la révélation.

### 5.3 COO — le pigeon du conseil d'administration
- **Silhouette** : minuscule boule lavande, **gros œil rond** étonné, bec orange, **mini-cravate rouge**. Jamais réaliste.
- Chaque apparition est un petit événement : entrée, salut à l'aile, sortie.

### 5.4 Mains du joueur
Peau légèrement plus mate, **manchettes bleu marine** (le joueur est l'employé). Elles entrent par le bas de l'écran, au premier plan.

## 6. Décor (2.5D en couches)
| Couche | Contenu | Parallaxe (x caméra) | Traitement |
|---|---|---:|---|
| Lointain | ciel, skyline (vue par la fenêtre) | 0,55 | clair, désaturé, sans trait |
| Fond | mur, lambris, fenêtre, stores, cadres, tableau en liège, horloge | 0,92 | trait fin `inkSoft`, contraste bas |
| Milieu | armoire, plante, photocopieuse, ascenseur, extincteur, fontaine | 0,96 | trait moyen |
| Action | B.B., bureau, chaise, gadget, Wendell, COO | 1 | trait plein, contraste maximal |
| Premier plan | bureau du joueur, clavier, post-it, mug turquoise, cactus, mains | 1,12 | plus sombre, bords adoucis |

- **Profondeur** :
  - ombres de contact douces sous chaque objet posé ;
  - occlusion dans les angles ;
  - halo de fenêtre au sol ;
  - poussière lente dans le rayon de lumière (≤ 12 grains, déterministes).
- **Parallaxe subtile** : le décor ne doit jamais « glisser » visiblement sous les personnages. Maximum ≈ 10 px d'écart en portrait.
- **Pas de plafond vide** en portrait (cadrage de la Phase 0.5 conservé).

## 7. Animation
Chaque action importante suit **ANTICIPATION → ACTION → IMPACT → SUITE DU MOUVEMENT → RÉACTION**.
- **Anticipation** : 80 à 200 ms, dans le sens opposé à l'action.
- **Action** : rapide, accélération (ease-in) ; traînées (smear) au-delà de ≈ 1,2 unité/ms.
- **Impact** : 1 à 2 images d'impact frame, **hit stop** de 50 à 120 ms selon le tier, secousse courte.
- **Suite du mouvement** : la cravate, la touffe et le mug suivent avec retard (ressort amorti), 150 à 400 ms.
- **Réaction** : pose tenue au moins 300 ms pour être lisible sur téléphone.
- **Squash & stretch** : volume conservé (sx × sy ≈ 1). Atterrissage : 0,78 × 1,12 puis rebond, **sans dépassement du sol**.
- **Vie au repos** : respiration, clignements, coups d'œil. Tout est **fonction pure du temps** (jamais `Math.random`, jamais l'horloge murale) : replay, reprise et graine restent déterministes.

## 8. Caméra
Chaque mouvement a une fonction :
- repos ;
- **push-in** léger (4-8 %) avant un impact ;
- **secousse** à l'impact, proportionnelle au tier ;
- **BIG WIN** : punch-in (≈ 12 %), puis lente poussée pendant la révélation, puis retour en douceur (≈ 600 ms) ;
- suivi hors champ si l'action sort du cadre.

Jamais d'agitation permanente.

## 9. Trois mondes RAGE (même bureau, même cadrage)
| | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| Heure / lumière | matinée chaude, calme | fin d'après-midi orange, contraste fort | nuit, lumière froide, **alarme rouge** qui pulse |
| Décor | presque propre, plante droite, écran intact | papiers au sol, cadres de travers, plante penchée, écran fissuré | plafond fissuré, câbles pendants, fumée, ventilateur tordu, agrafeuse plantée dans le mur, papiers partout |
| Wendell | détendu | inquiet | **casque de chantier** |
| B.B. | confiant | tendu | débraillé (touffe ébouriffée) |

Les trois doivent être reconnaissables **sans lire leur nom** : couleur de la lumière, désordre et accessoires de Wendell.

## 10. VFX
- **Catalogue** :
  - poussière (crème) ;
  - éclat d'impact (étoile blanche à contour encre) ;
  - lignes de vitesse (encre à 60 %) ;
  - étoiles de KO (jaune + encre) ;
  - papiers (papier + trait) ;
  - débris (bois, métal) ;
  - étincelles, éclats de verre, fumée (bouffées grises), feuilles (plante), confettis (couleurs de la palette).
- **Budget** : ≤ 120 particules simultanées, ≤ 60 par éclat. Aucun émetteur permanent, sauf la poussière de lumière (≤ 12).
- Le VFX **accentue** une pose, il ne la remplace pas. Les particules sont analytiques (position = f(graine, âge)) : replay et reprise identiques.

## 11. Son (préparation, sons définitifs plus tard)
Chaque geste a son **cue**, calé à l'image près : STRETCH (tension), SNAP, WHOOSH, THUD, CLINK (mug), DING, SIP, PAPER, DEBRIS, GLASS. Ce sont des sons synthétisés provisoires derrière `AudioSink` ; les remplacer ne touche pas au contenu.

## 12. Interface
- HUD : bleu nuit, lisible, sobre.
- Collection : album de stickers sur chemise cartonnée, encre bleue. **Jamais** d'or, de pièces ou de couleurs de gain pour une découverte.
- Cadeau de récompense : pastel, pulsation douce (≥ 1,5 s), pas de clignotement au-delà de 3 Hz.
- Mots interdits : JACKPOT, CASH, FREE MONEY, BONUS WIN.

## 13. Interdits stylistiques
- Noir pur, blanc pur sur les personnages (utiliser `paper` / `shirt`).
- Dégradés sur les corps des personnages (cel shading seulement).
- Textures photographiques, grain réaliste, 3D, Three.js.
- Texte incrusté dans l'art (sauf enseignes abstraites sans mots).
- Emoji.
- Éclairage contradictoire (lumière venant de droite).
- Néon en GRUMPY.
- Proportions réalistes.
- Copie ou pastiche reconnaissable d'une licence existante.

## 14. Cohérence : vérification automatique + revue manuelle
**Automatique** (`tests/unit/artBible.test.ts`, en CI) : chaque pièce SVG de `src/render/art/parts`
- n'utilise **que** des couleurs de `palette.ts` (ou `none`, ou un dégradé dont les arrêts sont dans la palette) ;
  seuls les masques de luminance (techniques, invisibles) contiennent du blanc et du noir ;
- n'utilise que les **épaisseurs de trait** de l'échelle de sa catégorie (le lointain n'a aucun trait) ;
- ne contient ni `#000`, ni `black`, ni `white`, ni `<text>`, ni `<image>`, ni ressource externe ;
- déclare une catégorie (`character`, `prop`, `mid`, `background`, `far`, `vfx`, `ui`), un pivot dans la pièce,
  un identifiant unique, et appartient à un seul atlas ;
- les atlas tiennent dans une page chacun et dans le budget mémoire (≤ 32 Mo, mipmaps comprises).

Autres garde-fous : aucune source de hasard ni d'horloge dans `src/render` (test de déterminisme) ; les séquences de la
vertical slice sont testées (image d'impact + hit stop, reveal unique, LE SIP calé sur la gorgée).

**Manuelle** (à chaque nouvel asset, capture à côté de B.B.) :
- [ ] même direction de lumière ;
- [ ] même poids de trait que les voisins de sa couche ;
- [ ] silhouette lisible en noir ;
- [ ] lisible à 360 × 640 ;
- [ ] ne réutilise pas une couleur réservée ;
- [ ] semble venir du même jeu que B.B. (test de la planche : B.B., Wendell, COO, gadget, décor côte à côte).

## 15. Remplacement placeholder → final
- Un asset ne connaît que son **acteur** et ses **états** (`seat`, `mug`, `face`, `tie`, `meche`, états des accessoires).
- Le remplacer ne modifie jamais : Outcome, multiplicateur, RTP, identifiant de branche, book, graine, GameFlow.
- Les mêmes identifiants d'acteurs servent aux placeholders et à l'art final.

## 16. Pipeline (prototype Phase 0.6)
1. **Pièces SVG** écrites dans `src/render/art/parts/*.ts` avec le mini-DSL `svg.ts` :
   `cel(forme, {base, shade, light})` produit la base, le croissant d'ombre (bas-droite), le liseré de lumière
   (haut-gauche) et le contour encre. La direction de la lumière est donc la même partout, par construction.
2. **Atlas** (`atlas.ts`) : les pièces sont rangées en étagères, assemblées dans UN document SVG par page, rastérisées
   par le navigateur (dégradés, flous pré-calculés), puis chargées comme textures Pixi (mipmaps). Densités (`books.ts`) :
   - personnages et VFX : 2 px par unité ;
   - accessoires : 1,75 ;
   - décor de fond et de milieu : 1,5 ;
   - lumière, ciel, ombres : 0,6.
3. **Rigs** (`BossRig.ts`, `castRigs.ts`) : sprites ancrés sur leurs pivots ; pose = fonction pure de
   `(anim, temps écoulé, états, contexte)`. Le contexte (fondu depuis l'animation précédente, ressort de la cravate
   et de la touffe, vitesse) est calculé par `timeline.evaluate` à partir des pistes : pur et déterministe.
4. **Scène** (`PixiStage.ts`, `officeScene.ts`) : couches fond / action / plafond / premier plan, parallaxe, lumière
   additive pré-calculée, vignettage, ombres de contact, traînées de vitesse, image d'impact, habillage des mondes.
5. **Revue** (DEV, jamais en production) :
   - `?artsheet=parts` : pages d'atlas ;
   - `?artsheet=rig&t=700` : planche de poses de B.B. ;
   - `?artsheet=concept&world=furious` : concept frame ;
   - outils `tools/filmstrip.mjs` (image par image) et `tools/capture-phase06.mjs` (avant / après).

**Production** : pré-rendre ces pages au build en WebP @1x / @2x (même code, mêmes pivots), ce qui supprime le coût de
rastérisation au démarrage et la dépendance à `blob:` / `data:` pour les images (politique de sécurité des casinos).
