# BAD BOSS — GDD partie 4 : système d'animation modulaire et gadgets (étape 5)

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

> Ce document définit **comment** les animations sont construites, partagées et choisies.
> Le catalogue détaillé des 15 gadgets (branches, durées, assets, VFX, SFX, caméra, complexité) est dans
> [`GDD_04b_CATALOGUE_15_GADGETS.md`](GDD_04b_CATALOGUE_15_GADGETS.md).
> Univers et personnages : [`GDD_06_BOSS_ET_UNIVERS.md`](GDD_06_BOSS_ET_UNIVERS.md). Caméra et son : [`GDD_07_UI_CAMERA_SON.md`](GDD_07_UI_CAMERA_SON.md).

---

## 5.0 Les six lois de la mise en scène BAD BOSS

1. **Un gadget n'est pas une animation.** Chaque gadget est un **arbre** : un tronc commun, puis des branches qui divergent entre 500 et 1 500 ms. Toutes les issues du gadget partagent exactement le même début.
2. **Règle des deux issues.** À chaque point de divergence visible, au moins une issue gagnante **et** une issue perdante restent possibles. Aucune image ne révèle le résultat avant l'impact final. C'est vérifié gadget par gadget (§5.6).
3. **Le corps de branche dit COMMENT, l'impact dit COMBIEN.** Une même branche gagnante peut finir en HIT, BIG HIT ou MEGA : seul le segment d'impact change (§5.3.2). C'est la principale source d'économie de production.
4. **Les pertes d'abord.** Environ 50 % du budget créatif va aux x0. Chaque gadget a **au moins 4 branches de perte** avec des archétypes comiques différents (§5.4), contre 3 à 4 branches gagnantes.
5. **Pas de faux suspense systématique.** Les fake-outs n'existent que dans les proportions fixées par les books (TEASE = 15 % des pertes, COMEBACK = 30 % des HIT). La majorité des manches sont directes, et la comédie vient de la situation, pas d'une attente artificielle. **Un seul silence dramatique par manche au maximum.**
6. **Le résultat se lit sur la pose finale.** Elle est tenue ≥ 400 ms (≥ 200 ms en turbo) et suit la grammaire de la partie 2, §3.5 : debout = perte, décoiffé = récupération, au tapis dans le cadre = HIT, hors du cadre = BIG, hors du cadre avec décor détruit = MEGA.

---

## 5.1 L'univers récurrent (résumé ; fiche complète dans GDD_06)

| Élément | Identité | Rôle dans les animations (running gag) |
|---|---|---|
| **Barnaby « B.B. » Bottomline** | Le boss. Costume violet, cravate jaune, casque de cheveux gominés et **LA MÈCHE** (une boucle qui sert d'indicateur d'émotion) | Toujours au centre. Revient vivant à chaque manche |
| **Le mug à son effigie** | Mug blanc imprimé du visage souriant du boss | **Indestructible** : sur chaque gain T1+, il retombe debout sur le bureau, toujours plein (« *tink* »). Il ne se fêle **qu'une fois** : au K.O. maximal du BOSS FIGHT. C'est aussi lui qui déclenche le BOSS FIGHT |
| **Le bureau** | Acajou démesuré, plaque dorée « B.B. BOTTOMLINE — BOSS », **sonnette de réception**, **bouton rouge YOU'RE FIRED** | Détruit dans les MEGA, toujours reconstruit (avec du scotch) à la manche suivante |
| **Wendell, le stagiaire** | Badge « INTERN » trois fois trop grand, pile de dossiers, lunettes épaisses | Victime éternelle : il encaisse ce que le boss esquive (BACKFIRE). Il sauve le boss par accident. Il se réjouit discrètement quand le boss tombe |
| **COO, le pigeon** | Pigeon du rebord de fenêtre, minuscule cravate, « Chief Operating Officer » autoproclamé | Agent du chaos : il aide tantôt le joueur, tantôt le boss. Apparaît dans ~10 % des branches |
| **Le portrait « Employee of the Month »** | Toujours le boss, 12 mois d'affilée | Tombe dans les destructions. Après un MEGA, il est remplacé une manche par… Wendell |
| **La cravate à clip** | La cravate jaune du boss est un clip | Se détache au pire moment : le boss s'en tire (TEASE récurrent) |
| **Le son signature** | La **sonnette de bureau « DING! »** | Le boss sonne Wendell en idle. La même sonnette ponctue les gains (1 ding = HIT, 2 = BIG, cascade = MEGA) |
| **La réaction signature** | **LE SIP** : il réajuste sa cravate, boit une gorgée petit doigt levé, « HMPF » | Réaction de perte la plus fréquente, reconnaissable en une silhouette |
| **Le joueur** | Invisible, sauf **ses mains** (manches de chemise, montre en plastique) en vue subjective depuis son poste | Actionne chaque gadget. Zéro personnalisation, neutre, immersif |

---

## 5.2 Architecture : 7 phases, 3 niveaux de partage

### 5.2.1 Les phases

| Phase | Rôle | Propriétaire | Neutre vis-à-vis du résultat ? | Turbo |
|---|---|---|---|---|
| **INTRO** | Les mains du joueur saisissent le gadget, qui entre en scène | Gadget + bibliothèque HANDS | **Oui** | compressé ×2 |
| **SETUP** (tronc commun) | Montée en tension. Contient la **boucle d'attente** qui masque la latence | Gadget | **Oui**, jusqu'au point de divergence D1 | compressé ×2 |
| **ACTION** | Ce que fait le gadget après D1. Première divergence visible | Branche | Non (mais les deux issues restent possibles) | ×1,6 |
| **TWIST** *(optionnel)* | Rebondissement : silence, PNJ, redémarrage… | Bibliothèque partagée TWIST ou branche | Non | silences supprimés, ×2 |
| **IMPACT** | Moment de vérité. Le tier dépend du multiplicateur | Bibliothèque partagée IMPACT (+ habillage gadget) | Non : **révèle** | conservé (≥ 250 ms) |
| **REACTION** | Réaction du boss, du bureau et des PNJ | Bibliothèque partagée REACTION | Non | ≤ 300 ms |
| **RESULT** | Superposition UI : multiplicateur, gain | UI | Non | raccourci |

```
FIRE ─┬─ INTRO ── SETUP ──[D1]── ACTION ──(TWIST)── IMPACT ── REACTION ── RESULT ── READY
      │   0 ms     ~300 ms  500–1500 ms                                   │
      └─ POST /wallet/play ──── book reçu ──┘ (doit arriver avant D1,      FIRE réactivé
                                              sinon boucle d'attente)
```

### 5.2.2 Latence : la boucle d'attente
Chaque gadget possède une **boucle d'attente neutre** : la mèche qui crépite, l'élastique qui tremble, le levier qui grince. Elle s'insère à la fin du SETUP si le book n'est pas encore arrivé au point D1. Elle est invisible quand le réseau est rapide. Au-delà de 4 s d'attente, un indicateur discret apparaît (voir GDD_07). **Aucun segment après D1 ne démarre sans le book.**

### 5.2.3 Du book à la séquence (sélection déterministe)

```
book.events[0] = { resultClass, script, rarity, variantSeed, multiplier }
                         │          │        │
gadget affiché ──────────┼──────────┼────────┼──► 1. candidates = branches du gadget
(choix client, cosmétique)│          │        │       où category == script
                         │          │        │       et resultClass ∈ validClasses
                         │          │        └──► 2. filtre de rareté (repli : rareté disponible la plus proche)
                         │          └───────────► 3. branche = candidates[variantSeed % n]
                         └──────────────────────► 4. tier d'impact = f(resultClass)
                                                  5. réaction = pool(resultClass), tirage cosmétique
```

- **Déterministe** : un même book et un même gadget donnent toujours la même branche (support, replays, audits).
- **Rareté** : le book tire une rareté (**common 75 % / rare 20 % / epic 5 %**, fixée dans les books et identique pour tous les joueurs). Chaque branche porte une étiquette de rareté. Des pertes « epic » continuent ainsi de surprendre après 500 manches. La rareté ne sert qu'**à l'intérieur d'une catégorie** qui a plusieurs branches. La fréquence d'une catégorie (TEASE, COMEBACK…) est fixée par le book, jamais par la rareté.
- **Micro-variations cosmétiques** (réaction parmi des équivalents, props, angle de caméra, réplique en *Bossish*) : elles sont **dérivées de la graine de présentation écrite dans le book** (PRNG déterministe, un flux par usage). Elles ne portent aucune information de résultat et **ne modifient jamais les mathématiques**. `Math.random()` est interdit dans la présentation d'une manche : une reprise ou un replay reproduit exactement la même animation (décision v3, voir `TECH_ARCHITECTURE.md` §2.7). La variété entre manches vient de la variété des books (plusieurs graines par combinaison multiplicateur × script × rareté).
- **Repli** : si une combinaison manque (contenu en cours de production), on joue la branche générique de la catégorie. Une manche n'est jamais bloquée. Le menu de debug liste les trous.

### 5.2.4 Modèle de données (conceptuel, pas encore du code)

```yaml
gadget: office_rocket           # identifiant, cosmétique au sein du Rage Level
rageLevel: unhinged
trunk:
  segments: [HND_LIGHTER, RKT_SU_STRAP, RKT_SU_FUSE]
  holdLoop: RKT_SU_FUSE_LOOP     # boucle d'attente neutre
  divergenceMs: 1300             # D1
branches:
  - id: RKT-FW1
    category: COMEBACK           # = script tiré dans le book
    validClasses: [HIT, BIG_HIT, MEGA]
    rarity: common
    comicStructure: [S03, S11]   # double fake-out, machine
    sequence:
      - { seg: RKT_AC_STALL, cam: CAM_PUSH, sfx: SFX_RKT_PFFT, vfx: FX_SMOKE }
      - { seg: RE_BOSS_LAUGH }
      - { seg: TW_SILENCE, ms: 300 }
      - { seg: RKT_TW_REIGNITE, cam: CAM_SHAKE_M, vfx: FX_FLAME, sfx: SFX_RKT_ROAR }
      - { impact: auto, direction: window }   # T1/T2/T3 selon le multiplicateur
      - { reaction: auto }
    turbo: { drop: [RE_BOSS_LAUGH, TW_SILENCE], timeScale: 1.8 }
```

Chaque cue (CameraCue, SoundCue, VFXCue) est une donnée : `{id, startMs relatif au segment, params}`. Le code ne contient **aucune** logique propre à un gadget. Il ne connaît que le séquenceur, les bibliothèques et les tiers d'impact.

### 5.2.5 Turbo sans deuxième jeu
Chaque segment porte un drapeau `turbo: keep | compress | drop`. Le séquenceur applique :
- `drop` sur les segments de pure respiration (rires, silences, attentes) ;
- un `timeScale` global de 1,6 à 2,0 sur ACTION ;
- IMPACT conservé (≥ 250 ms), pose finale tenue ≥ 200 ms ;
- caméra simplifiée (pas de slow-mo ni de dutch, secousses réduites de 50 %) ;
- sons : versions courtes des stingers (GDD_07).

Le **super turbo**, s'il est autorisé, saute ACTION et TWIST : tronc court (250 ms), IMPACT, puis RESULT. Les drapeaux `disabledTurbo` / `disabledSuperTurbo` décident des vitesses **proposées**. Le skip (slamstop) est une capacité séparée. `minimumRoundDuration` est géré par le GameFlow (état READY_GATE), **sans modifier les animations** (`TECH_ARCHITECTURE.md` §2.9).

---

## 5.3 Bibliothèques partagées (segments réutilisables)

Convention : `FAMILLE_NOM`. Les segments propres à un gadget sont préfixés par le code du gadget (`RKT_`, `TRP_`…). Tous les segments ci-dessous sont **produits une seule fois** et servent aux 15 gadgets.

### 5.3.1 HANDS : les mains du joueur (13 poses)
`HND_PULL` (tirer), `HND_PRESS` (gros bouton), `HND_LEVER`, `HND_WHISTLE` (siffler avec les doigts), `HND_TYPE` (clavier), `HND_SIGN` (signer, tamponner), `HND_RADIO` (talkie-walkie), `HND_DIAL` (tourner un cadran), `HND_SCISSORS`, `HND_LIGHTER` (briquet), `HND_COIN` (insérer une pièce), `HND_PLUG` (brancher), `HND_BOOT` (allumer un PC). Chaque pose dure de 250 à 400 ms. Les mains entrent par le bas de l'écran. Une seule planche de sprites.

### 5.3.2 IMPACT : les tiers (le COMBIEN)

| Tier | Classe | Pose finale du boss | Variantes de direction (réutilisées par tous les gadgets) | Durée N / T |
|---|---|---|---|---|
| `IMP_T0` | MISS | Debout, intact | — (pas d'impact) | 0 |
| `IMP_T05` | SCRAPE | Debout mais abîmé | `HAIR` (mèche en ressort), `SOOT` (suie), `WET` (café, soda), `SLIME` (ectoplasme pailleté), `BUMP` (bosse), `STAMP` (code-barres, tampon), `DUST` (toiles d'araignée) | 0,5 s / 0,3 s |
| `IMP_T1` | HIT | Au tapis **dans le cadre** | `DESK_FLIP` (pieds en l'air derrière le bureau : **pose emblématique**), `WALL_PIN`, `CORK` (coincé dans le sol), `CEILING` (coincé au plafond), `UNDER` (sous un objet, pieds qui gigotent), `FLAT` (aplati comme une feuille), `TANGLE` (emmêlé) | 0,8 s / 0,4 s |
| `IMP_T2` | BIG HIT | **Hors du cadre** | `WINDOW`, `CEILING_HOLE`, `DOOR`, `FLOOR_HOLE`, `WALL_BREACH`, `SKY_TWINKLE` (étoile qui scintille « *ding* » au loin), `OFFSCREEN_AUDIO` (la caméra reste sur place, le son raconte la sortie) | +0,8 s / +0,3 s |
| `IMP_T3` | MEGA | Hors du cadre **+ décor détruit** | Calque additif `WRECK` : le portrait tombe, le bureau se fend, la fontaine à eau explose, gicleurs, tempête de papiers, les collègues surgissent et applaudissent | +1,5 s / +0,5 s |
| `IMP_T4` | LEGENDARY | Détournement par un super-gadget | voir §5.7 | 3 à 5 s / 1,5 s |

Beat commun à tout impact T1+ : **`BEAT_MUG_LAND`**. Le mug retombe debout sur le bureau, « *tink* », toujours plein. C'est la signature visuelle du « ça a marché ».

### 5.3.3 REACTION : réactions du boss et du bureau
**Victoires du boss (le joueur perd) :**
- `RE_BOSS_SIP` : **LE SIP**, réaction emblématique ;
- `RE_BOSS_LAUGH` : il pointe la caméra du doigt et rit ;
- `RE_BOSS_FLEX` : « invincible », il embrasse son biceps ;
- `RE_BOSS_WATCH` : il tapote sa montre, « *tick-tock* » ;
- `RE_BOSS_FIRED` : il appuie sur le bouton rouge et Wendell tombe par une trappe, hors champ ;
- `RE_BOSS_DUST` : il s'époussette l'épaule ;
- `RE_BOSS_OBLIVIOUS` : il n'a rien vu ;
- `RE_BOSS_SHRUG` ;
- `RE_BOSS_PLANNED` : « je l'avais prévu », il s'attribue le mérite ;
- `RE_BOSS_WAVE` : il fait au revoir.

**Réaction à une récupération :** `RE_BOSS_SULK`.

**Défaites du boss (le joueur gagne) :**
- `RE_BOSS_DAZED` : étoiles, la mèche en spirale ;
- `RE_OFFICE_CHEER` : silhouettes des collègues derrière les vitres (BIG+) ;
- `RE_WEN_PEEK` : Wendell jubile en cachette derrière la plante.

### 5.3.4 PNJ
- **Wendell** : `WEN_WALK_IN`, `WEN_DIVE_SAVE`, `WEN_HIT_OFF` (hors champ : cri + dossiers qui volent dans le cadre), `WEN_FALL`, `WEN_OOPS` (déclenche par accident), `WEN_PEEK`, `WEN_CARRIED` (emporté), `WEN_STUCK` (agrafé, suspendu), `WEN_SORRY`.
- **COO** : `COO_LAND`, `COO_PECK`, `COO_CUT` (coupe une corde), `COO_STEAL`, `COO_SALUTE`, `COO_FLYBY`, `COO_NEST`, `COO_SQUAD` (nuée instanciée, jusqu'à 30).

### 5.3.5 TWIST : rebondissements réutilisables

| ID | Effet | Utilisé par (exemples) |
|---|---|---|
| `TW_SILENCE` | Vide sonore de 250 à 400 ms, micro push-in | fake-outs de 10 gadgets |
| `TW_DUST_CLOUD` | Nuage d'ambiguïté de 400 à 600 ms qui cache l'issue | Stapler, Vending, Truck |
| `TW_RESTART` | La machine tousse… puis repart | Rocket, Fan, Robot, Espresso |
| `TW_POWER_FLICKER` | Les lumières clignotent ou s'éteignent | Fan, Haunted PC |
| `TW_LOOK_DOWN` | Le boss regarde en bas, puis regarde la caméra | Trapdoor |
| `TW_BOOMERANG` | L'objet sort du cadre et revient | Slingshot, Wrecking Ball |
| `TW_LAST_STRAND` | Il ne tient plus qu'à un fil | Piano |
| `TW_LUCKY_BEND` | Le boss se baisse pile au bon moment | Wrecking Ball, Vending |
| `TW_CLIP_TIE` | La cravate à clip se détache | Stapler, COO Airlines, Rocket |
| `TW_MUG_BLOCK` | Le mug arrête le coup | entrées BOSS FIGHT |
| `TW_BATTERY` | Batterie à plat | Robot, Teleporter |

### 5.3.6 VFX partagés (tous en pool d'objets, pré-alloués au chargement)

| ID | Effet | Budget indicatif |
|---|---|---|
| `FX_DUST`, `FX_SMOKE`, `FX_STEAM` | nuages cartoon (sprites animés) | ≤ 12 simultanés |
| `FX_PAPERS` | feuilles volantes (pool de 40, jusqu'à 150 pour les MEGA) | pool partagé |
| `FX_SPARKS`, `FX_STARS` | étincelles, étoiles de K.O. | ≤ 30 |
| `FX_GLASS` | éclats de verre cartoon (sans arêtes réalistes) | ≤ 40 |
| `FX_LIQUID`, `FX_FOAM`, `FX_SLIME` | jets et éclaboussures (traînées de sprites) | 1 émetteur |
| `FX_FLAME`, `FX_FIREBALL`, `FX_SHOCKWAVE` | propulsion, rentrée, onde de choc | 1 émetteur |
| `FX_SPEEDLINES` | lignes de vitesse | superposition |
| `FX_CONFETTI` | confettis (BIG+, K.O.) | pool de 200 |
| `FX_GHOST_GLOW`, `FX_PORTAL` | halo fantôme, tourbillon du portail | 1 chacun |
| `FX_SCREEN_OVERLAY` | effets « sur l'objectif » : fissure, suie, coulures, bosses, cactus | 1 calque |

### 5.3.7 Entrée BOSS FIGHT partagée : `BF_ENTRY_MUG` (2,0 s / 0,8 s)
Chaque gadget a une courte amorce spécifique (0,8 à 1,5 s après D1) qui se termine toujours de la même façon. Le boss, furieux, saisit son mug, qui **s'illumine d'or** (iconographie réservée au BOSS FIGHT). Il boit « l'Executive Blend » d'un trait. Sa mèche se dresse, il grandit et traverse le plafond. Détail : GDD_05.

---

## 5.4 Archétypes de perte (la priorité absolue)

| Code | Archétype | Principe comique | Gadgets qui l'utilisent |
|---|---|---|---|
| ARC-01 | **Esquive** | Le boss évite sans même lever les yeux | Vending, Wrecking Ball, Robot |
| ARC-02 | **Se sauve par accident** | Il se baisse, éternue, roule vers son téléphone pile au bon moment | Piano, Wrecking Ball, Slingshot |
| ARC-03 | **Retour à l'envoyeur** | Le piège se retourne contre l'employé hors champ, donc contre la caméra | Slingshot, Espresso, Trapdoor, Rocket, Truck, Teleporter, Wrecking Ball |
| ARC-04 | **Imperturbable** | Il continue son café au milieu du chaos | Fan, Slingshot, Trapdoor, Truck, Wrecking Ball |
| ARC-05 | **L'ignorant** | Il regarde la catastrophe sans comprendre | Copier, Robot, COO Airlines, Piano |
| ARC-06 | **Le réparateur** | Il répare ou neutralise le gadget par accident, puis s'en attribue le mérite | Espresso, Rocket, Robot |
| ARC-07 | **Sauvé par Wendell** | Le stagiaire intervient et encaisse | Stapler, Fan, COO Airlines, Copier, Trapdoor, Haunted PC, Wrecking Ball, Truck |
| ARC-08 | **Chance absurde** | Coïncidence improbable | Slingshot, Espresso, Fan, Vending, Trapdoor, Teleporter, Rocket |
| ARC-09 | **Invincible** | Le coup rebondit sur lui, il se croit invincible | Stapler, COO Airlines, Haunted PC, Truck |
| ARC-10 | **Le gadget change de camp** | La machine l'adore et le sert | Robot, Slingshot, Copier |
| ARC-11 | **Le boss en profite** | Il transforme le piège en avantage : snack gratuit, bronzage, massage | Vending, Teleporter, Espresso |
| ARC-12 | **Hors champ** | La catastrophe a lieu ailleurs, on l'entend seulement | Trapdoor, Piano, Truck |

**Règle d'équilibre** : aucun archétype ne dépasse 20 % des branches de perte d'un Rage Level. ARC-07 (Wendell) et ARC-03 sont les plus fréquents : ils construisent les running gags.

**Règle de lisibilité d'une perte** : même dans ARC-09 (le coup touche mais rebondit), le boss finit **debout et intact**. La grammaire MISS n'est jamais ambiguë.

---

## 5.5 Structures comiques : couverture

Codes :
- S01 anticipation puis échec
- S02 impact immédiat
- S03 double fake-out
- S04 réaction en chaîne
- S05 hors champ
- S06 retour inattendu
- S07 destruction du décor
- S08 le boss provoque sa propre catastrophe
- S09 intervention d'un PNJ
- S10 animal
- S11 machine
- S12 accident
- S13 surnaturel
- S14 science-fiction

| Gadget | Structures dominantes |
|---|---|
| SWIVEL SLINGSHOT | S01, S06, S08, S12 |
| MEGA STAPLER | S02, S08, S09 |
| TURBO FAN | S01, S04, S10, S11 |
| ESPRESSO 9000 | S08, S11, S04 |
| COO AIRLINES | S10, S01, S08 |
| ROGUE ROBOT | S11, S08, S04 |
| PHOTOCOPIER MONSTER | S11, S13, S08 |
| VENDING MACHINE | S01, S04, S08, S12 |
| TRAPDOOR EXPRESS | S05, S06, S03, S09 |
| HAUNTED PC | S13, S09, S07 |
| OFFICE ROCKET | S03, S06, S14, S10 |
| PIANO DELIVERY | S01, S05, S12, S08 |
| DELIVERY TRUCK | S07, S12, S05, S08 |
| WRECKING BALL | S06, S03, S07, S12 |
| TELEPORT-O-MATIC | S14, S06, S04 |

Chacune des 14 structures est utilisée par au moins 2 gadgets, et aucun Rage Level ne repose sur une seule structure.

---

## 5.6 Matrice de non-révélation (règle des deux issues)

Légende : **L** = perte, **S** = récupération, **W** = gain, **FW** = gain après faux échec, **FL** = TEASE (faux espoir, puis perte), **BF** = entrée BOSS FIGHT.

| Gadget | D1 (ms) | État visible à D1 | Issues possibles depuis cet état |
|---|---|---|---|
| SLINGSHOT | 1 000 | (a) part droit vers la fenêtre | L1, FL, W1, BW |
| | | (b) part en vrille | L3, S, W2, BF |
| | | (c) l'élastique claque en arrière | L2, FW |
| STAPLER | 800 | « KA-CHUNK » plus nuage | L1, L2, FL, S, W1, W2, BW, BF |
| | | « clac » à vide (enrayé) | L3, FW |
| FAN | 1 100 | (a) rafale maximale | L1, L3, FL, S, W1, W2, BW, BF |
| | | (b) coupure de courant | L2, FW |
| ESPRESSO | 1 200 | (a) jet | L1, L2, S, W1, BW |
| | | (b) la machine sautille et marche | L3, FL, W2, FW, BF |
| COO AIRLINES | 1 000 | (a) piqué sur le boss | L2, L3, FL, W1, BW |
| | | (b) distraits par le donut | L1, S, W2, FW, BF |
| ROBOT | 1 200 | (a) la pince se referme | L2, L3, FL, W1, W2, BW |
| | | (b) « LOADING… » | L1, S, FW, BF |
| COPIER | 1 300 | (a) la langue de papier saisit le boss | L2, FL, W1, BW |
| | | (b) elle saisit le rapport | L1, L3, S, W2, FW, BF |
| VENDING | 1 000 | (a) bascule | L1, FL, W1, FW |
| | | (b) mitraille des canettes | L2, L3, S, W2, BW, BF |
| TRAPDOOR | 900 | (a) le boss tombe | L3, L4, FL, S, W1, W2, BW, BF |
| | | (b) le boss flotte au-dessus du vide | L1, L2, FW |
| HAUNTED PC | 1 200 | (a) poltergeist (objets volants) | L2, W1, BW |
| | | (b) le fantôme fonce sur le boss | L1, L3, FL, S, W2, FW, BF |
| ROCKET | 1 300 | (a) allumage | puis D2 à 2 000 ms : (a1) vers la fenêtre → L1, L2, FW2, W1, BF · (a2) vers le plafond → FL, W2, BW |
| | | (b) calage | L3, L4, FW1 |
| PIANO | 1 400 | (a) la corde cède | L1, L3, FL, W1, W2, BW |
| | | (b) il reste un brin | L2, L4, FW, BF |
| TRUCK | 1 200 | (a) le camion traverse le mur | L2, L3, FL, W1, W2, BW |
| | | (b) le camion s'arrête au mur | L1, L4, FW, BF |
| WRECKING BALL | 1 300 | (a) la boule entre | L2, L3, L4, FL, W1, W2, BW |
| | | (b) la boule s'arrête au ras de la vitre | L1, FW, BF |
| TELEPORTER | 1 200 | (a) le portail aspire | L1, L3, FL, W1, W2, BW |
| | | (b) le portail recrache quelque chose | L2, L4, FW, BF |

Chaque état contient au moins une issue W, FW ou BF **et** au moins une issue L ou FL. La matrice est à maintenir à chaque ajout de branche : c'est un test automatisable du futur debug menu.

**Règle complémentaire : l'équilibre des états.** « Deux issues possibles » ne suffit pas si un état mène à 99 % à une perte. En pratique, un état dont la seule issue gagnante est un BOSS FIGHT (1 manche sur 150) révèle quasiment le résultat. On impose donc deux conditions :
1. Chaque état contient au moins une branche gagnante **common** (hors BF).
2. En phase de test, le debug menu mesure P(gain | état D1) sur 100 000 manches simulées. Cette probabilité doit rester dans une fourchette de ± 15 points autour du hit rate du Rage Level. Au-delà, on rééquilibre les branches ou leurs raretés.

Première correction appliquée : sur WRECKING BALL et PHOTOCOPIER, le COMEBACK part désormais du même état que la perte la plus fréquente.

---

## 5.7 Super-gadgets : détournement (résultats ≥ x25 uniquement)

- **Déclenchement** : le script SUPER est tiré dans le book. Il représente 25 % des MEGA et 100 % des LEGENDARY de base.
- **Mise en scène** : le gadget choisi joue son tronc commun normalement. À D1, **tout s'arrête** : les lumières rougissent, une alarme d'open-space retentit, puis le super-gadget détourne la scène. Le gadget du joueur reste figé en arrière-plan : « ce n'est plus ton plan, c'est pire ».
- **Signal honnête** : une silhouette de super-gadget garantit ≥ x25. Ces silhouettes ne sont **jamais** utilisées ailleurs.

| Super-gadget | Pitch | Fin |
|---|---|---|
| **UFO ABDUCTION** | Une soucoupe aspire le boss avec son fauteuil. Au MVP, c'est le seul super-gadget | Les extraterrestres le relâchent 1 s plus tard en le jugeant « inintéressant »… trop tard, le résultat est acquis |
| **T-REX COURIER** | Un T-Rex livreur en casquette : « Colis pour M. Bottomline » | Il mange le boss et le recrache dans l'ascenseur |
| **BLACK HOLE** | La broyeuse à papier devient un trou noir | Le bureau entier est aspiré, le mug reste en orbite |
| **MECHA-HR** | Un robot géant des Ressources Humaines | Il tamponne « TERMINATED » sur le boss |
| **METEOR** | Une météorite traverse les 40 étages | Cratère fumant, le boss en bas avec son mug intact |
| **KAIJU COO** | COO devient géant | Il emporte l'immeuble… ou juste le boss |
| **TIME MACHINE** | Un portail temporel | Le boss revient en homme préhistorique à la manche suivante (cosmétique) |
| **CONFETTI MEGA-CANNON** | Canon à confettis nucléaire | Le boss disparaît sous 3 m de confettis |

---

## 5.8 MVP : les 3 gadgets du prototype

Contrainte structurelle : le MVP a besoin **d'un gadget par Rage Level**. Sinon, un emplacement serait vide.

### Grille d'évaluation (candidats sérieux)

| Critère | SLINGSHOT (G) | STAPLER (G) | TRAPDOOR (F) | VENDING (F) | ROBOT (F) | ROCKET (U) | PIANO (U) |
|---|---|---|---|---|---|---|---|
| Mécanique simple | ● | ●● | **●●●** | ●● | ● | ● | ●● |
| Fake-out spectaculaire | ● | ● | ●● | ●● | ● | **●●●** | ●● |
| Physique, ragdoll | **●●●** | ● | ● | ●● (canettes) | ● | ●● | ● |
| BIG WIN | ●● | ● | ●● | ●● | ●● | **●●●** | ●● |
| Entrée BOSS FIGHT | ● | ● | ●● | ● | ● | ●● | ● |
| Systèmes testés (voir ci-dessous) | 6 | 3 | 7 | 5 | 4 | 8 | 5 |
| Assets **nouveaux** | élastique, 2 portemanteaux (**la chaise existe déjà**) | agrafeuse (rig) | **un levier et une trappe** | distributeur, canettes | **nouveau personnage rigué** | fusée, flammes, trou au plafond, 1 fond « espace » | piano, corde |
| Coût | LOW | LOW | **LOWEST** | MEDIUM | HIGH | MEDIUM | LOW-MED |

### Décision : SWIVEL SLINGSHOT (GRUMPY) + TRAPDOOR EXPRESS (FURIOUS) + OFFICE ROCKET (UNHINGED)

**Affectation confirmée (v3).** La validation proposait l'inverse pour les deux premiers (TRAPDOOR en GRUMPY, SLINGSHOT en FURIOUS), en autorisant l'affectation documentée s'il existe une raison de game design claire. Elle existe :
1. **Le gadget est la représentation visuelle du niveau de risque.** Une chaise tirée à l'élastique est une farce à taille humaine : elle se lit « risque faible ». Une trappe qui envoie le boss traverser 12 étages est déjà une catastrophe : elle se lit « risque moyen ». Inverser brouillerait l'échelle visuelle GRUMPY < FURIOUS < UNHINGED qui s'affiche sur les cartes.
2. **Cohérence des pools** : GRUMPY = objets de bureau à taille humaine, FURIOUS = mécanismes déréglés.
3. **Tout le catalogue est construit ainsi** : les 32 branches MVP, leurs durées, la matrice de non-révélation et les priorités. L'inversion n'apporterait rien techniquement, car les deux gadgets ont chacun une branche de récupération (x0,5).

Les trois gadgets du MVP restent donc SWIVEL SLINGSHOT (GRUMPY), TRAPDOOR EXPRESS (FURIOUS) et OFFICE ROCKET (UNHINGED).

| Exigence | Couverte par | Comment |
|---|---|---|
| 1 mécanique simple | **TRAPDOOR** | Levier, puis trou. Tout se lit en une image |
| 1 fake-out spectaculaire | **ROCKET** | Calage, rire, silence, redémarrage brutal. Ou : parachute, puis COO coupe les suspentes. Ou : traversée du plafond, silence, retour |
| 1 système physique / ragdoll | **SLINGSHOT** | Le boss dans son fauteuil : vrille, rebonds sur la vitre élastique, tiroirs qui jaillissent, papiers |
| 1 BIG WIN | **ROCKET** | Mise en orbite (T2), puis rentrée en boule de feu à travers les étages (T3) |
| 1 entrée BOSS FIGHT | **TRAPDOOR** et **ROCKET** | L'entrée `BF_ENTRY_MUG` est partagée : une seule production sert les 3 gadgets |

**Systèmes techniques testés ensemble** :
- séquenceur et arbre de divergence ;
- boucle d'attente de latence ;
- les 5 tiers d'impact ;
- ragdoll simulé et mouvement secondaire ;
- pool de particules (papiers, débris) ;
- **hors champ piloté par l'audio** (Trapdoor, le système le moins cher à produire et l'un des plus drôles) ;
- PNJ Wendell et COO ;
- caméra : follow, hold, shake, slow-mo, freeze ;
- turbo, entrée BOSS FIGHT, calque de destruction T3.

**Pourquoi pas Rogue Robot**, que j'avais proposé à l'étape 3 : il exige un nouveau personnage animé (rig, expressions d'écran) et ne teste aucun système que les trois autres ne couvrent pas déjà.

**Assets nouveaux pour tout le MVP** :
- élastique + 2 portemanteaux ;
- levier + trappe ;
- fusée + mèche ;
- 1 fond « espace » ;
- trou de plafond (décal) ;
- VFX flammes et fumée.

Tout le reste (boss, bureau, mug, Wendell, COO, open-space) est le socle obligatoire du jeu, de toute façon.

---

## 5.9 Ordre de production

Critère de complexité :
- **LOW** : segments partagés + états du gadget, au plus 2 actions nouvelles, pas de nouveau décor.
- **MEDIUM** : 3 à 5 temps d'animation nouveaux, mouvement secondaire, ou une déformation spéciale.
- **HIGH** : nouveau décor, destruction à grande échelle, nuée, séquence multi-plans ou VFX lourds.

| Priorité | Contenu | Pourquoi |
|---|---|---|
| **P1 : tranche verticale** | Bibliothèques partagées (HANDS, IMPACT T0.5 à T3, `BEAT_MUG_LAND`, `RE_BOSS_SIP` / `LAUGH` / `DAZED`, `BF_ENTRY_MUG`). SLG-L1, SLG-W1, SLG-S. TRP-L1, TRP-L2, TRP-S, TRP-W1, TRP-BF. RKT-L3, RKT-W1, RKT-FW1, RKT-BW, RKT-BF (13 branches) | Chaque classe de résultat est jouable sur chaque Rage Level, y compris le BOSS FIGHT |
| **P2 : MVP complet** | Toutes les autres branches des 3 gadgets MVP (≈ 20), WEN, COO, UFO | Assez de variété pour les tests joueurs (fun, répétition) |
| **P3 : lot de lancement A (LOW)** | STAPLER, FAN, VENDING, PIANO, WRECKING BALL | Rapport variété / coût maximal |
| **P3 : lot de lancement B (MEDIUM)** | ESPRESSO, COO AIRLINES, COPIER, HAUNTED PC, TELEPORTER | |
| **P3 : lot de lancement C (HIGH)** | ROBOT (nouveau rig), TRUCK (destruction de mur) | Coûteux, à produire en dernier |
| **P4 : post-lancement** | Autres super-gadgets, branches « epic » supplémentaires, nouveaux environnements | Rétention long terme |

Estimation du catalogue complet :
- 15 gadgets × 10 à 11 branches = **152 branches** ;
- environ **185 segments uniques** : ~15 × 9 propres aux gadgets + ~50 partagés.

Grâce aux tiers d'impact et aux réactions, cela produit plusieurs milliers de séquences visuellement distinctes.

---

## 5.10 Réserve de gadgets (post-lancement)

| Gadget | Pitch en une ligne | Niveau pressenti |
|---|---|---|
| Giant Magnet | Tout ce qui est métallique vole vers le boss : boucle de ceinture, montre, classeurs | F |
| Office Tornado | La climatisation passe en « mode ouragan » | U |
| Forklift | Le chariot élévateur soulève le bureau… avec le boss dessus | F |
| Broken Elevator | L'ascenseur fait le yo-yo | F |
| Malfunctioning Escalator | L'escalator accélère à 80 km/h | F |
| Drone Delivery | Un drone livre un colis de 200 kg | F |
| Giant Spring | Un ressort géant sous la chaise | G |
| Shrink Ray | Le boss rétrécit à 5 cm, Wendell devient son supérieur | U |
| Laser Printer From Hell | L'imprimante tire des lasers de toner | F |
| Office Cannon | Un canon de cirque chargé de fournitures | U |
| Giant Hammer | Un marteau de foire géant | U |
| Rocket Desk | Le bureau entier décolle | U |
| Industrial Vacuum | L'aspirateur industriel aspire la mèche en premier | G |
| Paper Airplane Squadron | Une escadrille d'avions en papier | G |
| Water Cooler Geyser | La fontaine à eau devient un geyser | G |
| Hypno Poster | L'affiche motivationnelle hypnotise le boss | G |
| Conference Call of Doom | Une conférence téléphonique de 400 participants | G |
| Shredder Vortex | La broyeuse aspire la cravate à clip | F |
| Label Maker Gun | La tireuse d'étiquettes marque « LOSER » | G |
| Pneumatic Mail Tube | Le tube pneumatique aspire le boss | F |
| Ceiling Fan Chopper | Le ventilateur de plafond décolle comme un hélicoptère | F |
| Sticky Note Swarm | Un essaim de post-its | G |
| Filing Cabinet Avalanche | Avalanche de classeurs | F |
| Fire Drill Chaos | Exercice incendie : tout le monde court sauf le boss | F |
| Trust Fall | Team-building : personne ne le rattrape | G |
| Birthday Cake Surprise | Gâteau géant dont surgit… Wendell | G |
| Mime from HR | Un mime des RH l'enferme dans une boîte invisible | G |
| Catapult Stapler Array | Batterie de 20 agrafeuses-catapultes | F |
| Volcano Aquarium | L'aquarium décoratif entre en éruption | U |
| Gravity Switch | Un interrupteur « GRAVITY: OFF » | U |
