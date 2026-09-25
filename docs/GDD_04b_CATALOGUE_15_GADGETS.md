# BAD BOSS — GDD partie 4b : catalogue des 15 gadgets (étape 5)

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

> Système, bibliothèques partagées, archétypes, matrice de non-révélation et choix du MVP : [`GDD_04_ANIMATIONS_ET_GADGETS.md`](GDD_04_ANIMATIONS_ET_GADGETS.md).

## Mode d'emploi

- **ID** : `CODE-BRANCHE`.
  - L1 à L4 : pertes (CLEAN_MISS ou BACKFIRE) ;
  - FL : TEASE (faux espoir, puis perte) ;
  - S : GRAZE (x0,1 à x0,9, GRUMPY et FURIOUS uniquement) ;
  - W1, W2 : DIRECT ;
  - FW : COMEBACK (faux échec, puis gain) ;
  - BW : CHAIN (BIG et MEGA) ;
  - BF : entrée BOSS FIGHT.
- **D1** : état visible au premier point de divergence (voir le tronc commun du gadget).
- **Catégorie → classes** : script tiré dans le book et classes de résultat que la branche peut servir. Le tier d'impact est choisi automatiquement : T1 pour un HIT, T2 pour un BIG, T3 pour un MEGA.
- **Rareté** : common, rare ou epic, tirée dans le book (GDD_04, §5.2.3).
- **N / T** : durée en secondes, mode normal / turbo, **tronc commun compris**, **hors latence**. Pour une branche gagnante, la durée indiquée est celle de la plus petite classe servie. Ajouter +0,8 / +0,3 s pour un BIG et +1,5 / +0,5 s pour un MEGA (segments d'impact partagés).
- **Segments réutilisés** : identifiants des bibliothèques partagées (GDD_04, §5.3). Les caméras `CAM_*` sont définies dans GDD_07.
- **Cx** : complexité de production (LOW, MEDIUM, HIGH, voir GDD_04, §5.9). **Prio** : P1 à P3 (GDD_04, §5.9).

---

# GRUMPY 😒 : petites vengeances de bureau (bleu électrique)

## G1 · SWIVEL SLINGSHOT (SLG) · ⭐ MVP

**Pitch** : le fauteuil en cuir du boss, accroché à un élastique de bureau géant tendu entre deux portemanteaux. Le boss, rivé à son téléphone, ne remarque rien.
**Moteur comique** : physique cartoon (vrille, rebonds, élastique). Le boss ne lâche jamais son téléphone.

**Tronc commun (0 → 1 000 ms)**
- 0–300 : `HND_PULL`, les mains accrochent le fauteuil (boss compris) à l'élastique.
- 300–900 : `SLG_SU_STRETCH`, recul, cuir qui grince, l'élastique s'étire. Le boss recule sans lever les yeux, la mèche frémit.
- Boucle d'attente `SLG_SU_HOLD` : l'élastique vibre, grincement rythmé.
- 900 : **TWANG**, lâcher.
- **D1 = 1 000 ms** : (a) le fauteuil file droit vers la fenêtre, (b) il part en vrille, (c) l'élastique claque en arrière.

**Assets du gadget** : élastique (2 os étirables), 2 portemanteaux, fauteuil du boss (existant, + état « roulettes fumantes »), nacelle de laveur de vitres (BW).
**Signature sonore** : cuir qui grince, puis « TWANG » grave.

| ID | D1 | Catégorie → classes | Rareté | Archétype · structure | Déroulé après D1 |
|---|---|---|---|---|---|
| SLG-L1 | a | CLEAN_MISS → MISS | common | ARC-04 · S01 | Le fauteuil fonce vers la fenêtre et freine pile au bord, le nez du boss à 1 cm de la vitre. Il n'a pas levé les yeux du téléphone. Le fauteuil revient tout seul au bureau. `RE_BOSS_SIP` |
| SLG-L2 | c | BACKFIRE → MISS | common | ARC-03 · S06 | L'élastique claque en arrière : un portemanteau fouette l'écran (fissure cartoon, étoiles). Le boss rit en montrant la caméra |
| SLG-L3 | b | CLEAN_MISS → MISS | common | ARC-10 · S12 | Le fauteuil tourne sur place comme une toupie. « Wheee ! » Le boss adore et sonne la sonnette. Wendell accourt et relance la toupie |
| SLG-FL | a | TEASE → MISS | common | ARC-08 · S01 | Le boss s'écrase contre la vitre, visage aplati, fissures qui courent… `TW_SILENCE`… La vitre se bombe comme un élastique et le renvoie droit dans son fauteuil. Il reprend son appel |
| SLG-S | b | GRAZE → SCRAPE | common | — · S12 | La toupie percute le classeur : tous les tiroirs jaillissent. Le boss se relève, mèche en ressort, cravate sur l'épaule (`IMP_T05_HAIR`) |
| SLG-W1 | a | DIRECT → HIT, BIG, MEGA | common | — · S02 | Le fauteuil heurte l'angle du bureau et catapulte le boss par-dessus : pieds en l'air (`IMP_T1_DESK_FLIP`). BIG : il continue à travers la fenêtre. MEGA : il emporte le décor au passage |
| SLG-W2 | b | DIRECT → HIT, BIG | common | — · S04 | La toupie traverse la rangée de chaises vides comme une boule de bowling : STRIKE ! Le boss finit tête en bas dans le pot de la plante (`IMP_T1_UNDER`). BIG : la dernière chaise l'expédie par la porte |
| SLG-FW | c | COMEBACK → HIT, BIG, MEGA | common | — · S06 | L'élastique claque en arrière comme dans L2, et le boss commence à rire… Le portemanteau revient en pendule (`TW_BOOMERANG`) et donne une pichenette au fauteuil : décollage |
| SLG-BW | a | CHAIN → BIG, MEGA | common | — · S04, S07 | Le boss traverse la fenêtre, rebondit sur le mât du drapeau et atterrit dans la nacelle du laveur de vitres, qui dégringole (`IMP_T2_SKY_TWINKLE`). MEGA : il emporte les rideaux, le portrait et la fontaine à eau |
| SLG-BF | b | BF_ENTRY | common | — · S08 | La toupie s'arrête. Le boss titube, vert de vertige, cherche son mug à tâtons… et le trouve : `BF_ENTRY_MUG` |

| ID | N | T | Segments réutilisés | Assets spécifiques | VFX | SFX | Caméra | Cx | Prio |
|---|---|---|---|---|---|---|---|---|---|
| SLG-L1 | 2,4 | 1,0 | HND_PULL, RE_BOSS_SIP | anim de freinage du fauteuil | FX_SPEEDLINES, FX_SMOKE | crissement, slurp, HMPF | CAM_FOLLOW → CAM_REACTION | LOW | P1 |
| SLG-L2 | 2,3 | 1,0 | CAM_POV_HIT, RE_BOSS_LAUGH | portemanteau-fouet | FX_SCREEN_OVERLAY (fissure), FX_STARS | TWANG inversé, BONK, rire | CAM_SHAKE_M | LOW | P2 |
| SLG-L3 | 2,6 | 1,1 | WEN_WALK_IN, RE_BOSS_LAUGH | rotation cyclique du fauteuil | FX_SPEEDLINES | « wheee », DING de sonnette | CAM_WIDE | LOW | P2 |
| SLG-FL | 3,4 | 1,3 | TW_SILENCE, RE_BOSS_OBLIVIOUS | déformation de vitre (maillage 2D) | FX_GLASS (fissures qui se résorbent) | SPLAT, craquements, silence 300 ms, BOING | CAM_FOLLOW → CAM_PUSH → CAM_WIDE | MEDIUM | P2 |
| SLG-S | 2,6 | 1,1 | IMP_T05_HAIR, RE_BOSS_SULK | tiroirs qui jaillissent | FX_PAPERS | CLANG, ressorts, « pfff » | CAM_WIDE, CAM_SHAKE_S | LOW | P1 |
| SLG-W1 | 2,8 | 1,2 | IMP_T1_DESK_FLIP, IMP_T2_WINDOW, IMP_T3_WRECK, BEAT_MUG_LAND, RE_BOSS_DAZED | — | FX_DUST, FX_STARS | THUD, DING | CAM_FOLLOW, CAM_SHAKE_M | LOW | P1 |
| SLG-W2 | 3,1 | 1,2 | IMP_T1_UNDER, IMP_T2_DOOR, BEAT_MUG_LAND | rangée de chaises (instances) | FX_DUST | STRIKE de bowling | CAM_WHIP | MEDIUM | P2 |
| SLG-FW | 3,7 | 1,4 | TW_BOOMERANG, RE_BOSS_LAUGH (coupé net) | portemanteau pendule | FX_SPEEDLINES | TWANG, rire coupé, WHOOSH | CAM_POV_HIT → CAM_WHIP | MEDIUM | P2 |
| SLG-BW | 4,4 | 1,7 | IMP_T2_SKY_TWINKLE, IMP_T3_WRECK, RE_OFFICE_CHEER | nacelle, mât (skyline déjà en fond) | FX_GLASS, FX_PAPERS, FX_CONFETTI | verre cartoon, BOING métallique, chute sifflée | CAM_FOLLOW, CAM_SLOWMO, CAM_FREEZE | HIGH | P2 |
| SLG-BF | 3,0 + 2,0 | 1,8 | BF_ENTRY_MUG | — | FX_STARS | glou-glou, grondement | CAM_REACTION | LOW | P2 |

## G2 · MEGA STAPLER (STP)

**Pitch** : une agrafeuse de bureau grosse comme un crocodile, poussée sur un chariot. « KA-CHUNK ».
**Moteur comique** : impact immédiat. Le suspense porte sur **ce qui a été agrafé**.

**Tronc commun (0 → 800 ms)**
- 0–300 : `STP_SU_ROLLIN`, l'agrafeuse arrive sur son chariot.
- 300–700 : la mâchoire s'ouvre en respirant mécaniquement et vise le boss, qui signe des papiers. Boucle d'attente : `STP_SU_BREATH`.
- 700 : `HND_PRESS`, les mains écrasent le dessus.
- **D1 = 800 ms** : « KA-CHUNK » puis `TW_DUST_CLOUD` (nuage de papiers, 400 à 600 ms), **ou** « clac » à vide (enrayée).

**Assets du gadget** : agrafeuse (rig : charnière de mâchoire, ressort), chariot, agrafes géantes, tiroir de cravates de rechange.
**Signature sonore** : KA-CHUNK grave et métallique.

| ID | D1 | Catégorie → classes | Rareté | Archétype · structure | Déroulé après D1 |
|---|---|---|---|---|---|
| STP-L1 | KA-CHUNK | CLEAN_MISS → MISS | common | ARC-11 · S02 | Le nuage se dissipe : l'agrafe a parfaitement relié sa pile de rapports. Il soulève le dossier, satisfait. `RE_BOSS_SIP` |
| STP-L2 | KA-CHUNK | BACKFIRE → MISS | common | ARC-07 · S09 | Le nuage se dissipe : Wendell est agrafé au mur par son badge géant, pieds dans le vide, et fait un petit coucou (`WEN_STUCK`). Le boss rit |
| STP-L3 | clac | CLEAN_MISS → MISS | common | ARC-09 · S11 | L'agrafeuse s'enraye et crache des agrafes comme des confettis. Le boss en attrape une avec les dents, façon cure-dent. `RE_BOSS_FLEX` |
| STP-FL | KA-CHUNK | TEASE → MISS | common | ARC-08 · S01 | Sa cravate est agrafée au bureau et il est plaqué face contre le plateau. Il tire… `TW_SILENCE`… « clic » : la cravate à clip se détache (`TW_CLIP_TIE`). Il se redresse et en clippe une neuve (il en a 50 dans son tiroir) |
| STP-S | KA-CHUNK | GRAZE → SCRAPE | common | — · S02 | La mèche est agrafée au mur. Il s'arrache, mais la mèche reste au mur (`IMP_T05_HAIR`) |
| STP-W1 | KA-CHUNK | DIRECT → HIT, BIG | common | — · S02 | Le boss est agrafé par la veste au mur, à côté de son propre portrait, jambes qui pédalent (`IMP_T1_WALL_PIN`). BIG : le panneau cède et il glisse avec lui par la porte |
| STP-W2 | KA-CHUNK | DIRECT → HIT, BIG, MEGA | rare | — · S04 | Double KA-CHUNK : agrafé à son fauteuil, qui part en marche arrière. BIG : par la porte. MEGA : il traverse l'open-space |
| STP-FW | clac | COMEBACK → HIT, BIG, MEGA | common | — · S08 | L'agrafeuse est enrayée et fume. Le boss se penche pour inspecter la mâchoire et la tapote avec son stylo… KA-CHUNK : agrafé au plafond (`IMP_T1_CEILING`). BIG/MEGA : à travers le plafond |
| STP-BW | KA-CHUNK | CHAIN → BIG, MEGA | common | — · S04, S07 | Mode rafale : les agrafes clouent ses manches, puis son pantalon, au mur des trophées. Le recul fait partir l'agrafeuse en arrière, et tout le mur bascule par la fenêtre avec le boss |
| STP-BF | KA-CHUNK | BF_ENTRY | common | — · S02 | Le nuage se dissipe : l'agrafe est tordue contre **le mug** qu'il a levé comme un bouclier (`TW_MUG_BLOCK`). Regard noir, gorgée : `BF_ENTRY_MUG` |

| ID | N | T | Segments réutilisés | Assets spécifiques | VFX | SFX | Caméra | Cx | Prio |
|---|---|---|---|---|---|---|---|---|---|
| STP-L1 | 2,3 | 1,0 | HND_PRESS, TW_DUST_CLOUD, RE_BOSS_SIP | rapport relié | FX_DUST, FX_PAPERS | KA-CHUNK, froissement, slurp | CAM_PUSH → CAM_WIDE | LOW | P3A |
| STP-L2 | 2,4 | 1,0 | WEN_STUCK, RE_BOSS_LAUGH | — | FX_DUST | KA-CHUNK, petit « help » | CAM_WHIP | LOW | P3A |
| STP-L3 | 2,3 | 1,0 | RE_BOSS_FLEX | agrafes-confettis | FX_SPARKS | clac, crachotements, « ting » | CAM_REACTION | LOW | P3A |
| STP-FL | 3,3 | 1,3 | TW_SILENCE, TW_CLIP_TIE, RE_BOSS_DUST | tiroir de cravates | FX_DUST | grognements, silence, « clic » | CAM_PUSH | MEDIUM | P3A |
| STP-S | 2,5 | 1,1 | IMP_T05_HAIR, RE_BOSS_SULK | mèche au mur | FX_DUST | « schlork » de gel | CAM_WIDE | LOW | P3A |
| STP-W1 | 2,7 | 1,2 | IMP_T1_WALL_PIN, IMP_T2_DOOR, BEAT_MUG_LAND | — | FX_DUST | KA-CHUNK, pédalage, DING | CAM_SHAKE_S | LOW | P3A |
| STP-W2 | 3,0 | 1,2 | IMP_T1, IMP_T2_DOOR, IMP_T3_WRECK | — | FX_SPEEDLINES | KA-CHUNK ×2, roulettes | CAM_FOLLOW | LOW | P3A |
| STP-FW | 3,6 | 1,4 | IMP_T1_CEILING, IMP_T2_CEILING_HOLE | fumée de bourrage | FX_SMOKE | clac, toux mécanique, KA-CHUNK | CAM_PUSH → CAM_TILT_UP | MEDIUM | P3A |
| STP-BW | 4,4 | 1,7 | IMP_T2_WINDOW, IMP_T3_WRECK, RE_OFFICE_CHEER | mur de trophées | FX_SPARKS, FX_GLASS | rafale de KA-CHUNK, fracas | CAM_SHAKE_L, CAM_SLOWMO | HIGH | P3A |
| STP-BF | 2,6 + 2,0 | 1,8 | TW_MUG_BLOCK, BF_ENTRY_MUG | agrafe tordue | FX_SPARKS | KA-CHUNK, TING du mug | CAM_REACTION | LOW | P3A |

## G3 · TURBO FAN (FAN)

**Pitch** : le ventilateur industriel « HURRICANE 5000 », réglé sur MAX. Tout s'envole… sauf la coiffure du boss.
**Moteur comique** : le casque de cheveux gominés contre le vent. La mèche comme baromètre.

**Tronc commun (0 → 1 100 ms)**
- 0–300 : `HND_PLUG`.
- 300–1 000 : `FAN_SU_SPINUP`, les pales accélèrent, le vrombissement monte, les papiers volettent, la plante plie. Le boss plisse les yeux et agrippe son bureau, la mèche vibre.
- Boucle d'attente `FAN_SU_HOLD` : vent continu, papiers en orbite.
- **D1 = 1 100 ms** : (a) rafale maximale, **ou** (b) coupure de courant (`TW_POWER_FLICKER`).

**Assets du gadget** : ventilateur (sprite en rotation + socle), multiprise, rideaux (déformation 2D), avion en papier.
**Signature sonore** : vrombissement qui monte (Doppler) et couches de vent.

| ID | D1 | Catégorie → classes | Rareté | Archétype · structure | Déroulé après D1 |
|---|---|---|---|---|---|
| FAN-L1 | a | CLEAN_MISS → MISS | common | ARC-04 · S01 | Tout s'envole : papiers, plante, café de Wendell… sauf le casque de cheveux. Le boss tourne une page de son journal. Le ventilateur s'essouffle. `RE_BOSS_SIP` |
| FAN-L2 | b | BACKFIRE → MISS | common | ARC-07 · S09 | Coupure. Wendell apparaît, la prise à la main : il a débranché le ventilateur pour brancher la machine à café du boss (`WEN_SORRY`). Le boss est servi |
| FAN-L3 | a | CLEAN_MISS → MISS | rare | ARC-08 · S04 | Le vent plie une feuille en avion en papier, qui fait le tour du bureau et atterrit dans la main du boss. Il tamponne « APPROVED » et le relance… droit dans la caméra |
| FAN-FL | a | TEASE → MISS | common | ARC-08 · S10 | Le boss flotte à l'horizontale comme un drapeau, accroché au bureau du bout des doigts : 3 doigts… 2… 1… `TW_SILENCE`… COO se pose sur la multiprise et picore l'interrupteur. Le ventilateur s'arrête, le boss retombe dans son fauteuil, et COO salue le boss (traître !) |
| FAN-S | a | GRAZE → SCRAPE | common | — · S01 | La mèche s'arrache et se plante au mur comme une fléchette. La coiffure devient une serpillière (`IMP_T05_HAIR`) |
| FAN-W1 | a | DIRECT → HIT, BIG, MEGA | common | — · S02 | Arraché du fauteuil, il vole comme un cerf-volant (cravate au vent) et finit derrière le bureau (`IMP_T1_DESK_FLIP`). BIG : par la fenêtre, une étoile scintille au loin |
| FAN-W2 | a | DIRECT → HIT, BIG | rare | — · S12 | Il tourne comme une hélice dans son fauteuil et s'enroule dans les rideaux (`IMP_T1_TANGLE`). BIG : le rideau fait voile et l'emporte par la porte |
| FAN-FW | b | COMEBACK → HIT, BIG, MEGA | common | — · S06, S09 | Coupure (comme L2). Le boss rit et écarte les bras : « c'est tout ? » Wendell rebranche en s'excusant (`WEN_OOPS`), et le ventilateur repart à 200 % |
| FAN-BW | a | CHAIN → BIG, MEGA | common | — · S04, S07 | La rafale devient une tornade de papiers. Le boss, aspiré, fait trois fois le tour du bureau puis sort par les dalles du plafond. MEGA : tous les bureaux glissent, l'open-space est dans la tempête |
| FAN-BF | a | BF_ENTRY | common | — · S08 | Le vent sculpte sa coiffure en « savant fou ». Il se voit dans le reflet de l'écran : rage, gorgée, `BF_ENTRY_MUG` |

| ID | N | T | Segments réutilisés | Assets spécifiques | VFX | SFX | Caméra | Cx | Prio |
|---|---|---|---|---|---|---|---|---|---|
| FAN-L1 | 2,6 | 1,1 | HND_PLUG, RE_BOSS_SIP | plante couchée | FX_PAPERS (pool de 40) | vent, tourne-page, slurp | CAM_WIDE | LOW | P3A |
| FAN-L2 | 2,7 | 1,1 | TW_POWER_FLICKER, WEN_SORRY | prise | — | « bzzt », expresso | CAM_WHIP | LOW | P3A |
| FAN-L3 | 3,0 | 1,2 | RE_BOSS_LAUGH | avion en papier (sur spline) | FX_PAPERS, FX_SCREEN_OVERLAY | « fwip », tampon, « tap » sur l'écran | CAM_FOLLOW | MEDIUM | P3A |
| FAN-FL | 3,6 | 1,4 | TW_SILENCE, COO_LAND, COO_PECK, COO_SALUTE | pose « drapeau » | FX_PAPERS | doigts qui glissent (3 notes), silence, clic, roucoulement | CAM_PUSH | MEDIUM | P3A |
| FAN-S | 2,8 | 1,1 | IMP_T05_HAIR, RE_BOSS_SULK | coiffure « serpillière » | FX_PAPERS | « schlork », « pfff » | CAM_REACTION | LOW | P3A |
| FAN-W1 | 2,9 | 1,2 | IMP_T1_DESK_FLIP, IMP_T2_SKY_TWINKLE, BEAT_MUG_LAND | pose « cerf-volant » | FX_SPEEDLINES | cri cartoon, THUD, DING | CAM_FOLLOW | LOW | P3A |
| FAN-W2 | 3,1 | 1,2 | IMP_T1_TANGLE, IMP_T2_DOOR | rideaux | FX_PAPERS | tringle qui tombe | CAM_WIDE | MEDIUM | P3A |
| FAN-FW | 3,8 | 1,4 | TW_POWER_FLICKER, WEN_OOPS, RE_BOSS_LAUGH | — | FX_PAPERS | rire, « sorry! », turbine qui redémarre | CAM_WIDE → CAM_SHAKE_M | MEDIUM | P3A |
| FAN-BW | 4,6 | 1,7 | IMP_T2_CEILING_HOLE, IMP_T3_WRECK, RE_OFFICE_CHEER | vortex (sprite en rotation) | FX_PAPERS (pool de 120), FX_DUST | tornade, cri qui tourne en stéréo | CAM_SHAKE_L, CAM_SLOWMO | HIGH | P3A |
| FAN-BF | 3,0 + 2,0 | 1,8 | BF_ENTRY_MUG | coiffure « savant fou » | FX_PAPERS | cri de rage étouffé | CAM_REACTION | LOW | P3A |

## G4 · ESPRESSO 9000 (ESP)

**Pitch** : la nouvelle machine à café à 47 boutons. Les mains écrasent « EXTRA STRONG ». Le boss tend son mug, persuadé qu'on lui prépare son café.
**Moteur comique** : une machine sous pression, un boss qui en profite, et le lien direct avec le mug.

**Tronc commun (0 → 1 200 ms)**
- 0–300 : `HND_PRESS`.
- 300–1 100 : `ESP_SU_PRESSURE`, grondement, manomètres qui grimpent, sifflet de vapeur. Le boss tend son mug sous le bec et tapote d'impatience.
- Boucle d'attente : aiguilles qui oscillent, sifflet.
- **D1 = 1 200 ms** : (a) un jet part, **ou** (b) la machine se met à sautiller, puis à marcher.

**Assets du gadget** : machine (états : repos, pression, marche sur 2 petites pattes, cassée), jet (traînée de sprites), mousse, manomètres.
**Signature sonore** : sifflet de vapeur, gargouillis, « PSSSHHH ».

| ID | D1 | Catégorie → classes | Rareté | Archétype · structure | Déroulé après D1 |
|---|---|---|---|---|---|
| ESP-L1 | a | CLEAN_MISS → MISS | common | ARC-11 · S11 | Le jet… verse un latte parfait, avec le visage du boss en latte art. Il goûte : enfin quelque chose qui marche. `RE_BOSS_SIP` |
| ESP-L2 | a | BACKFIRE → MISS | common | ARC-03 · S06 | Le jet pivote vers la caméra, et l'écran est couvert de café. Une main (Wendell) l'essuie avec un essuie-tout. Le boss rit |
| ESP-L3 | b | CLEAN_MISS → MISS | common | ARC-06 · S11 | La machine sautille sur le bureau. Le boss lui donne une claque, comme à une vieille télé : elle se calme aussitôt et le sert. `RE_BOSS_PLANNED` |
| ESP-FL | b | TEASE → MISS | common | ARC-08 · S01 | La machine enfle et explose en vague de mousse de lait qui ensevelit le boss… `TW_SILENCE`… Une main émerge avec le mug, puis le boss, impeccable, avec juste une moustache de mousse. Sip |
| ESP-S | a | GRAZE → SCRAPE | common | — · S11 | Éclaboussure : le boss est trempé de café, il dégouline et recrache un grain (`IMP_T05_WET`) |
| ESP-W1 | a | DIRECT → HIT, BIG, MEGA | common | — · S02 | Le jet frappe comme une lance à incendie et projette le boss derrière le bureau. BIG : par la fenêtre |
| ESP-W2 | b | DIRECT → HIT, BIG | rare | — · S08 | La machine poursuit le boss autour du bureau. Il se prend les pieds dans son câble et finit dessous, jambes qui gigotent (`IMP_T1_UNDER`). BIG : ils glissent ensemble par la porte |
| ESP-FW | b | COMEBACK → HIT, BIG, MEGA | common | — · S08 | La machine sautille, tousse, meurt (« pfff »). Le boss ricane, remet son mug sous le bec et tapote… un dernier PSSSHHH (`TW_RESTART`) le propulse |
| ESP-BW | a | CHAIN → BIG, MEGA | common | — · S04, S07 | La pression fait sauter les tuyaux. Une colonne de café soulève le boss jusqu'au plafond, puis à travers. MEGA : les gicleurs arrosent de café, les bureaux flottent |
| ESP-BF | b | BF_ENTRY | common | — · S11 | La machine sautille jusqu'au boss, s'incline et verse dans son mug un **« EXECUTIVE BLEND »** doré et lumineux. Il boit : `BF_ENTRY_MUG` |

| ID | N | T | Segments réutilisés | Assets spécifiques | VFX | SFX | Caméra | Cx | Prio |
|---|---|---|---|---|---|---|---|---|---|
| ESP-L1 | 2,7 | 1,1 | HND_PRESS, RE_BOSS_SIP | latte art (sprite) | FX_STEAM, FX_LIQUID | sifflet, versement, slurp | CAM_PUSH | LOW | P3B |
| ESP-L2 | 2,7 | 1,1 | RE_BOSS_LAUGH | essuie-tout | FX_LIQUID, FX_SCREEN_OVERLAY (coulures) | PSSSHHH, « splotch », rire | CAM_POV_HIT | LOW | P3B |
| ESP-L3 | 2,8 | 1,1 | RE_BOSS_PLANNED | anim de sautillement | FX_STEAM | BOING ×3, claque, ronronnement | CAM_WIDE | MEDIUM | P3B |
| ESP-FL | 3,8 | 1,4 | TW_SILENCE, RE_BOSS_SIP | mousse (masse déformable) | FX_FOAM | explosion molle, silence, « plop » | CAM_PUSH | MEDIUM | P3B |
| ESP-S | 2,8 | 1,1 | IMP_T05_WET, RE_BOSS_SULK | — | FX_LIQUID | « splash », « ptt » (grain) | CAM_REACTION | LOW | P3B |
| ESP-W1 | 3,0 | 1,2 | IMP_T1_DESK_FLIP, IMP_T2_WINDOW, BEAT_MUG_LAND | — | FX_LIQUID | jet puissant, THUD, DING | CAM_SHAKE_M | LOW | P3B |
| ESP-W2 | 3,2 | 1,2 | IMP_T1_UNDER, IMP_T2_DOOR | marche de la machine | FX_STEAM | petits pas mécaniques, trébuchement | CAM_FOLLOW | MEDIUM | P3B |
| ESP-FW | 3,9 | 1,5 | TW_RESTART, impact auto | machine « morte » | FX_STEAM, FX_LIQUID | « pfff », ricanement, PSSSHHH | CAM_PUSH → CAM_SHAKE_M | MEDIUM | P3B |
| ESP-BW | 4,6 | 1,7 | IMP_T2_CEILING_HOLE, IMP_T3_WRECK | colonne de café | FX_LIQUID, FX_STEAM | geyser, gicleurs | CAM_TILT_UP, CAM_SLOWMO | HIGH | P3B |
| ESP-BF | 3,1 + 2,0 | 1,8 | BF_ENTRY_MUG | canette « Executive Blend » | FX_STEAM (doré) | carillon doré | CAM_REACTION | LOW | P3B |

## G5 · COO AIRLINES (AIR)

**Pitch** : le joueur siffle. COO et son escadrille (3 pigeons en cravate) répondent à l'appel.
**Moteur comique** : un animal, la loyauté très douteuse de COO, et un donut.

**Tronc commun (0 → 1 000 ms)**
- 0–300 : `HND_WHISTLE`.
- 300–600 : `COO_LAND` sur le rebord, puis `COO_SALUTE`.
- 600–1 000 : l'escadrille passe en formation au-dessus des bureaux. Boucle d'attente `AIR_SU_CIRCLE` : les pigeons tournent.
- **D1 = 1 000 ms** : (a) piqué sur le boss, **ou** (b) ils repèrent le donut sur le bureau.

**Assets du gadget** : COO (PNJ existant), 3 instances recolorées, donut, nid, œuf.
**Signature sonore** : roucoulements, battements d'ailes superposés, sifflet.

| ID | D1 | Catégorie → classes | Rareté | Archétype · structure | Déroulé après D1 |
|---|---|---|---|---|---|
| AIR-L1 | b | CLEAN_MISS → MISS | common | ARC-05 · S10 | Les pigeons se posent et dévorent le donut. Le boss les regarde sans comprendre, les chasse d'un revers de main, ils repartent. Sip |
| AIR-L2 | a | BACKFIRE → MISS | common | ARC-07 · S09 | Ils attrapent… Wendell par son badge géant et l'emportent par la fenêtre (`WEN_CARRIED`). Le boss fait au revoir |
| AIR-L3 | a | CLEAN_MISS → MISS | rare | ARC-09 · S10 | Ils saisissent le boss par la cravate et battent des ailes de toutes leurs forces… il ne bouge pas d'un centimètre. La cravate s'étire comme un élastique et les renvoie, sonnés. `RE_BOSS_FLEX` |
| AIR-FL | a | TEASE → MISS | common | ARC-08 · S10 | Ils le soulèvent ! Il flotte au-dessus du bureau… `TW_SILENCE`… La cravate à clip se détache (`TW_CLIP_TIE`), il retombe dans son fauteuil, et les pigeons s'envolent avec la cravate. Il en clippe une neuve |
| AIR-S | b | GRAZE → SCRAPE | common | — · S10 | En se disputant le donut, ils construisent un nid sur sa tête (`COO_NEST`), avec un œuf. Il se lève, furieux |
| AIR-W1 | a | DIRECT → HIT, BIG, MEGA | common | — · S10 | Ils l'attrapent par le col et le basculent par-dessus le bureau. BIG : par la fenêtre |
| AIR-W2 | b | DIRECT → HIT, BIG | rare | — · S10 | COO siffle, toute l'escadrille décolle d'un coup, et le souffle fait basculer le fauteuil du boss. BIG : dans une tempête de plumes, le fauteuil sort par la porte |
| AIR-FW | b | COMEBACK → HIT, BIG, MEGA | common | — · S08 | Les pigeons mangent le donut (comme L1). Le boss le leur reprend pour le manger lui-même… toute l'escadrille pique sur le donut et l'emporte, boss compris |
| AIR-BW | a | CHAIN → BIG, MEGA | common | — · S10, S04 | COO siffle : 30 pigeons (`COO_SQUAD`) enlèvent le boss et le promènent au-dessus des toits. MEGA : ils le ramènent à travers la vitre de l'étage du dessous |
| AIR-BF | b | BF_ENTRY | common | — · S10 | Un pigeon fait tomber le mug. Le boss plonge et le rattrape, intact et plein. Furieux, il boit : `BF_ENTRY_MUG` |

| ID | N | T | Segments réutilisés | Assets spécifiques | VFX | SFX | Caméra | Cx | Prio |
|---|---|---|---|---|---|---|---|---|---|
| AIR-L1 | 2,6 | 1,1 | HND_WHISTLE, COO_LAND, RE_BOSS_SIP | donut, miettes | FX_PAPERS (plumes) | picorements, roucoulements | CAM_PUSH | LOW | P3B |
| AIR-L2 | 2,7 | 1,1 | WEN_CARRIED, RE_BOSS_WAVE | — | plumes | « waaah » qui s'éloigne | CAM_FOLLOW | MEDIUM | P3B |
| AIR-L3 | 3,0 | 1,2 | RE_BOSS_FLEX | cravate élastique | plumes, FX_STARS | battements frénétiques, TWANG | CAM_WIDE | MEDIUM | P3B |
| AIR-FL | 3,6 | 1,4 | TW_SILENCE, TW_CLIP_TIE | — | plumes | ailes, silence, « clic », chute molle | CAM_TILT_UP → CAM_PUSH | MEDIUM | P3B |
| AIR-S | 2,8 | 1,1 | COO_NEST, IMP_T05_HAIR, RE_BOSS_SULK | nid, œuf | plumes | chamaillerie de pigeons, « pop » d'œuf | CAM_REACTION | LOW | P3B |
| AIR-W1 | 2,9 | 1,2 | IMP_T1_DESK_FLIP, IMP_T2_WINDOW, BEAT_MUG_LAND | — | plumes | ailes, THUD, DING | CAM_FOLLOW | MEDIUM | P3B |
| AIR-W2 | 3,1 | 1,2 | IMP_T1_DESK_FLIP, IMP_T2_DOOR | — | plumes (pool) | décollage massif (souffle) | CAM_WIDE | MEDIUM | P3B |
| AIR-FW | 3,8 | 1,4 | COO_SQUAD, impact auto | donut | plumes | « mmh », piqué, cri | CAM_PUSH → CAM_FOLLOW | MEDIUM | P3B |
| AIR-BW | 4,6 | 1,7 | COO_SQUAD (30), IMP_T2_SKY_TWINKLE, IMP_T3_WRECK | skyline (fond existant) | plumes (pool de 150) | nuée, fanfare de roucoulements | CAM_FOLLOW, CAM_SLOWMO | HIGH | P3B |
| AIR-BF | 3,0 + 2,0 | 1,8 | BF_ENTRY_MUG | — | plumes | « tink » du mug rattrapé | CAM_REACTION | LOW | P3B |

---

# FURIOUS 😠 : machines et mécanismes déréglés (orange)

## F1 · ROGUE ROBOT (ROB)

**Pitch** : R-0B, le robot livreur de courrier du service informatique (une roue, une pince, un écran-visage à émoticônes). Le joueur tape « rage.exe ».
**Moteur comique** : une machine dont les émotions s'affichent sur un écran (😠 ❤️ 🪫 ⏳). Lecture universelle, zéro texte.

**Tronc commun (0 → 1 200 ms)**
- 0–300 : `HND_TYPE`.
- 300–700 : `ROB_SU_BOOT`, l'écran passe à 😠 et la roue patine sur place en fumant. Boucle d'attente : `ROB_SU_REV`.
- 700–1 200 : `ROB_SU_CHARGE`, il fonce jusqu'au bureau et tend la pince.
- **D1 = 1 200 ms** : (a) la pince se referme, **ou** (b) l'écran affiche ⏳ « LOADING… ».

**Assets du gadget** : R-0B (**nouveau rig** : caisse, roue, bras en 3 segments, pince ; écran = planche d'émoticônes), chariot à courrier, tube pneumatique (BW).
**Signature sonore** : servomoteurs, bips, « bloop » à chaque émoticône.

| ID | D1 | Catégorie → classes | Rareté | Archétype · structure | Déroulé après D1 |
|---|---|---|---|---|---|
| ROB-L1 | b | CLEAN_MISS → MISS | common | ARC-05 · S11 | Gel : « INSTALLING UPDATE 1/487 ». Le boss pose son mug sur la tête du robot, comme sur un guéridon. Sip |
| ROB-L2 | a | BACKFIRE → MISS | common | ARC-10 · S11 | La pince saisit la main du boss… qui la serre. L'écran passe à ❤️, R-0B fait volte-face et poursuit Wendell hors champ (`WEN_HIT_OFF`) |
| ROB-L3 | a | CLEAN_MISS → MISS | rare | ARC-10 · S11 | La pince saisit… la chaussure du boss et la cire jusqu'à ce qu'elle brille. « Good boy. » Petite tape sur la tête |
| ROB-FL | a | TEASE → MISS | common | ARC-08 · S11 | La pince soulève le boss par la ceinture, très haut, et le fait tournoyer… 🪫, bip de batterie faible (`TW_BATTERY`)… Le robot le repose doucement dans son fauteuil et s'endort |
| ROB-S | b | GRAZE → SCRAPE | common | — · S11 | Pendant le redémarrage, le bras balaie l'air et assomme le boss d'un « bonk » (`IMP_T05_BUMP`) |
| ROB-W1 | a | DIRECT → HIT, BIG, MEGA | common | — · S02 | La pince l'attrape, tamponne « RETURN TO SENDER » sur son front et le dépose dans le chariot à courrier (`IMP_T1_UNDER`). BIG : le chariot part par la porte |
| ROB-W2 | a | DIRECT → HIT, BIG | rare | — · S02 | Pichenette d'un seul doigt de pince, comme une bille : le boss roule derrière le bureau. BIG : par la fenêtre |
| ROB-FW | b | COMEBACK → HIT, BIG, MEGA | common | — · S08, S11 | « LOADING… » Le boss tapote l'écran avec impatience… « UPDATE COMPLETE : RAGE 2.0 » 😡, et c'est l'éjection |
| ROB-BW | a | CHAIN → BIG, MEGA | common | — · S04 | R-0B se transforme (bras supplémentaires), jongle avec le boss et le poste dans le tube pneumatique. FWOOMP : il traverse les tuyaux de l'immeuble et ressort dans la rue. MEGA : R-0B ravage les box |
| ROB-BF | b | BF_ENTRY | common | — · S08 | Court-circuit et fumée. Le boss donne un coup de pied au robot, se fait mal à l'orteil, sautille… saisit son mug : `BF_ENTRY_MUG` |

| ID | N | T | Segments réutilisés | Assets spécifiques | VFX | SFX | Caméra | Cx | Prio |
|---|---|---|---|---|---|---|---|---|---|
| ROB-L1 | 2,8 | 1,1 | HND_TYPE, RE_BOSS_SIP | écran « update » | — | bip de gel, slurp | CAM_WIDE | MEDIUM | P3C |
| ROB-L2 | 2,9 | 1,1 | WEN_HIT_OFF, RE_BOSS_LAUGH | écran ❤️ | FX_DUST | « bloop » amoureux, fracas hors champ | CAM_WHIP | MEDIUM | P3C |
| ROB-L3 | 2,9 | 1,1 | RE_BOSS_PLANNED | chaussure brillante | FX_SPARKS (éclat) | cirage, « ding » d'éclat | CAM_PUSH | MEDIUM | P3C |
| ROB-FL | 3,7 | 1,4 | TW_BATTERY, TW_SILENCE | écran 🪫 | — | servos, bip de batterie, « bzzz » d'endormissement | CAM_TILT_UP → CAM_WIDE | MEDIUM | P3C |
| ROB-S | 2,8 | 1,1 | IMP_T05_BUMP, RE_BOSS_SULK | — | FX_STARS | BONK métallique | CAM_REACTION | LOW | P3C |
| ROB-W1 | 3,0 | 1,2 | IMP_T1_UNDER, IMP_T2_DOOR, BEAT_MUG_LAND | chariot, tampon | FX_DUST | tampon, chariot, DING | CAM_FOLLOW | MEDIUM | P3C |
| ROB-W2 | 3,0 | 1,2 | IMP_T1_DESK_FLIP, IMP_T2_WINDOW | — | FX_SPEEDLINES | « tic » de pichenette, roulé-boulé | CAM_WHIP | LOW | P3C |
| ROB-FW | 3,8 | 1,4 | TW_RESTART, impact auto | écran 😡 | FX_SMOKE | tapotements, jingle de mise à jour, WHOOSH | CAM_PUSH → CAM_SHAKE_M | MEDIUM | P3C |
| ROB-BW | 4,8 | 1,8 | IMP_T2_OFFSCREEN_AUDIO, IMP_T3_WRECK | bras supplémentaires, tube pneumatique | FX_SMOKE, FX_SPARKS | FWOOMP, tuyauterie (hors champ) | CAM_FOLLOW, CAM_SHAKE_L | HIGH | P3C |
| ROB-BF | 3,1 + 2,0 | 1,8 | BF_ENTRY_MUG | — | FX_SMOKE, FX_SPARKS | court-circuit, « aïe » | CAM_REACTION | LOW | P3C |

## F2 · PHOTOCOPIER MONSTER (CPY)

**Pitch** : la vieille photocopieuse du couloir, qui a des dents. Le joueur appuie sur « COPY ×1000 ».
**Moteur comique** : une machine monstrueuse (surnaturel léger) et la **duplication**.

**Tronc commun (0 → 1 300 ms)**
- 0–300 : `HND_PRESS`.
- 300–900 : `CPY_SU_WAKE`, la machine gronde, le capot s'ouvre comme une mâchoire, la barre de scan balaie la pièce comme un œil.
- 900–1 300 : une langue de papier se déroule vers le boss. Boucle d'attente : la langue ondule, grognement.
- **D1 = 1 300 ms** : (a) la langue s'enroule autour du boss, **ou** (b) autour de son rapport.

**Assets du gadget** : photocopieuse (rig : capot-mâchoire, langue de papier sur spline, lumière de scan), sprite « boss aplati en papier », copies (portraits).
**Signature sonore** : grondement de moteur, « brrrt brrrt » d'impression.

| ID | D1 | Catégorie → classes | Rareté | Archétype · structure | Déroulé après D1 |
|---|---|---|---|---|---|
| CPY-L1 | b | CLEAN_MISS → MISS | common | ARC-05 · S11 | La machine avale le rapport et imprime 50 copies… du portrait du boss. Ravi, il en punaise partout. Sip |
| CPY-L2 | a | BACKFIRE → MISS | common | ARC-07 · S09 | Gloups : PAPER JAM (voyant rouge). Elle recrache le boss et avale Wendell à la place, qui ressort en photocopie plate et s'éloigne en marchant |
| CPY-L3 | b | CLEAN_MISS → MISS | rare | ARC-05 · S11 | Elle mange le rapport, puis le donut du boss, rote et s'endort en ronflant. Le boss hausse les épaules |
| CPY-FL | a | TEASE → MISS | common | ARC-08 · S13 | La machine avale le boss en entier… `TW_SILENCE`… « brrrt brrrt brrrt » : elle imprime **trois** boss, qui boivent en même temps dans trois mugs |
| CPY-S | b | GRAZE → SCRAPE | common | — · S11 | Le boss reprend son rapport de force, mais la machine lui tamponne un code-barres sur le front (`IMP_T05_STAMP`), visage taché de toner |
| CPY-W1 | a | DIRECT → HIT, BIG, MEGA | common | — · S11 | Elle l'avale et recrache un boss aplati en papier, qui descend en voletant jusqu'au sol (`IMP_T1_FLAT`). BIG : le boss-papier s'envole par la fenêtre |
| CPY-W2 | b | DIRECT → HIT, BIG | rare | — · S11 | Tir à la corde pour le rapport : la machine ravale le rapport… et le boss avec. Le module de reliure le transforme en livret, déposé dans le bac « OUT ». BIG : archivé dans un classeur qui part tout seul |
| CPY-FW | b | COMEBACK → HIT, BIG, MEGA | common | — · S08 | Le rapport se coince : PAPER JAM, tout semble fini. Le boss ouvre lui-même le panneau latéral pour récupérer son rapport… aspiré, il ressort en confettis |
| CPY-BW | a | CHAIN → BIG, MEGA | common | — · S04, S07 | 100 copies papier du boss ensevelissent le vrai, et l'avalanche le pousse hors de la pièce. MEGA : la photocopieuse se met à marcher et renverse les cloisons |
| CPY-BF | b | BF_ENTRY | common | — · S13 | Elle imprime une copie géante du boss qui le toise avec mépris. Vexé, il boit : `BF_ENTRY_MUG` |

| ID | N | T | Segments réutilisés | Assets spécifiques | VFX | SFX | Caméra | Cx | Prio |
|---|---|---|---|---|---|---|---|---|---|
| CPY-L1 | 2,9 | 1,1 | HND_PRESS, RE_BOSS_SIP | 50 portraits | FX_PAPERS | impression rapide, punaise | CAM_WIDE | LOW | P3B |
| CPY-L2 | 3,0 | 1,2 | WEN_WALK_IN, RE_BOSS_LAUGH | Wendell aplati | FX_PAPERS | alarme de bourrage, « gloups », pas de papier | CAM_WHIP | MEDIUM | P3B |
| CPY-L3 | 3,0 | 1,2 | RE_BOSS_SHRUG | bulles « Z » | — | mastication, rot, ronflement | CAM_PUSH | LOW | P3B |
| CPY-FL | 3,8 | 1,4 | TW_SILENCE, RE_BOSS_SIP (×3) | 3 boss (instances) | FX_PAPERS | gloups, silence, brrrt ×3, slurp ×3 synchrones | CAM_PUSH → CAM_WIDE | MEDIUM | P3B |
| CPY-S | 2,9 | 1,1 | IMP_T05_STAMP, RE_BOSS_SULK | code-barres | FX_DUST (toner) | tampon, bip de caisse | CAM_REACTION | LOW | P3B |
| CPY-W1 | 3,1 | 1,2 | IMP_T1_FLAT, IMP_T2_WINDOW, BEAT_MUG_LAND | boss-papier | FX_PAPERS | gloups, impression, froissement | CAM_TILT_DOWN | MEDIUM | P3B |
| CPY-W2 | 3,2 | 1,2 | IMP_T1_UNDER, IMP_T2_DOOR | livret relié | — | agrafage, reliure | CAM_PUSH | MEDIUM | P3B |
| CPY-FW | 4,0 | 1,5 | impact auto | panneau latéral | FX_CONFETTI | alarme, cliquetis, aspiration | CAM_PUSH → CAM_SHAKE_M | MEDIUM | P3B |
| CPY-BW | 4,8 | 1,8 | IMP_T2_DOOR, IMP_T3_WRECK, RE_OFFICE_CHEER | pas de la photocopieuse | FX_PAPERS (pool de 150) | avalanche de papier | CAM_SHAKE_L, CAM_SLOWMO | HIGH | P3B |
| CPY-BF | 3,3 + 2,0 | 1,8 | BF_ENTRY_MUG | copie géante | FX_PAPERS | impression grave, « hmpf » vexé | CAM_REACTION | LOW | P3B |

## F3 · VENDING MACHINE (VND)

**Pitch** : « SNAK-O-TRON », le distributeur qui a avalé 400 pièces du joueur. L'heure de la vengeance.
**Moteur comique** : un objet lourd qui bascule, et des projectiles en série (**test du pooling physique**).

**Tronc commun (0 → 1 000 ms)**
- 0–300 : `HND_COIN` (la dernière pièce).
- 300–1 000 : `VND_SU_ROCK`, la machine gronde et commence à tanguer vers le bureau du boss. Boucle d'attente : balancement et grincements.
- **D1 = 1 000 ms** : (a) elle bascule vers le boss, **ou** (b) elle mitraille des canettes.

**Assets du gadget** : distributeur (caisse + états : incliné, vitre brisée, vide), canettes (objets physiques en pool, 60), barre chocolatée, sachet de chips.
**Signature sonore** : grondement de compresseur, « clunk » de canette.

| ID | D1 | Catégorie → classes | Rareté | Archétype · structure | Déroulé après D1 |
|---|---|---|---|---|---|
| VND-L1 | a | CLEAN_MISS → MISS | common | ARC-11 · S01 | Elle bascule… et s'arrête à 45°, appuyée sur le portemanteau. Le boss se sert gratuitement une barre chocolatée par la trappe ouverte |
| VND-L2 | b | BACKFIRE → MISS | common | ARC-03 · S06 | Les canettes partent vers la caméra et rebondissent sur l'écran (bosses). Le boss en attrape une, l'ouvre (PSHHT) et boit. *(Pas de pièces : iconographie réservée)* |
| VND-L3 | b | CLEAN_MISS → MISS | rare | ARC-01 · S02 | Les canettes filent vers le boss. Il les esquive une par une d'un minimum de mouvement, sans lever les yeux de sa lecture |
| VND-FL | a | TEASE → MISS | common | ARC-08 · S01 | La machine s'écrase sur lui : CRASH, poussière (`TW_DUST_CLOUD`)… `TW_SILENCE`… Le boss est debout, pile dans le cadre de la vitrine dont le verre a éclaté tout autour de lui, un sachet de chips à la main. Crunch |
| VND-S | b | GRAZE → SCRAPE | common | — · S02 | Une canette lui cogne le front, le soda gicle au visage (`IMP_T05_WET` + `BUMP`) |
| VND-W1 | a | DIRECT → HIT, BIG, MEGA | common | — · S12 | La machine tombe sur lui : seuls ses pieds dépassent et gigotent (`IMP_T1_UNDER`). BIG : la machine glisse avec lui par la porte |
| VND-W2 | b | DIRECT → HIT, BIG | common | — · S04 | Un barrage de canettes le renverse derrière le bureau. BIG : les canettes qui roulent l'emportent par la porte comme un tapis roulant |
| VND-FW | a | COMEBACK → HIT, BIG, MEGA | common | — · S08 | Bloquée à 45° (comme L1). Le boss plonge le bras pour attraper la barre coincée… et la machine finit sa chute sur lui |
| VND-BW | b | CHAIN → BIG, MEGA | common | — · S04 | Jackpot : la machine crache 200 canettes, et un tsunami de soda emporte le boss dans le couloir puis dans l'escalier. MEGA : elle explose en geyser pétillant, la moquette est inondée |
| VND-BF | b | BF_ENTRY | common | — · S02 | Une canette frappe le mug posé sur le bureau. Le mug ne bouge pas, la canette s'écrase (`TW_MUG_BLOCK`). Le boss boit : `BF_ENTRY_MUG` |

| ID | N | T | Segments réutilisés | Assets spécifiques | VFX | SFX | Caméra | Cx | Prio |
|---|---|---|---|---|---|---|---|---|---|
| VND-L1 | 2,6 | 1,1 | HND_COIN, RE_BOSS_SIP | état « 45° », barre chocolatée | FX_DUST | grincement, arrêt sec, emballage | CAM_WIDE | LOW | P3A |
| VND-L2 | 2,5 | 1,0 | CAM_POV_HIT, RE_BOSS_LAUGH | canettes (pool) | FX_SCREEN_OVERLAY (bosses) | « clonk » ×6, PSHHT | CAM_SHAKE_S | LOW | P3A |
| VND-L3 | 2,7 | 1,1 | RE_BOSS_OBLIVIOUS | poses d'esquive (4) | FX_SPEEDLINES | sifflements de canettes | CAM_WIDE | MEDIUM | P3A |
| VND-FL | 3,4 | 1,3 | TW_DUST_CLOUD, TW_SILENCE | vitrine brisée, chips | FX_GLASS, FX_DUST | CRASH, silence, crunch | CAM_SHAKE_M → CAM_PUSH | MEDIUM | P3A |
| VND-S | 2,6 | 1,1 | IMP_T05_WET, IMP_T05_BUMP, RE_BOSS_SULK | — | FX_LIQUID | clonk, pschitt | CAM_REACTION | LOW | P3A |
| VND-W1 | 2,8 | 1,2 | IMP_T1_UNDER, IMP_T2_DOOR, BEAT_MUG_LAND | — | FX_DUST | CRASH, pieds qui gigotent, DING | CAM_SHAKE_M | LOW | P3A |
| VND-W2 | 2,9 | 1,2 | IMP_T1_DESK_FLIP, IMP_T2_DOOR | canettes (pool) | FX_DUST | mitraille de canettes | CAM_SHAKE_S | MEDIUM | P3A |
| VND-FW | 3,6 | 1,4 | impact auto | — | FX_DUST | « nnngh », craquement, CRASH | CAM_PUSH → CAM_SHAKE_M | LOW | P3A |
| VND-BW | 4,4 | 1,7 | IMP_T2_DOOR, IMP_T3_WRECK, RE_OFFICE_CHEER | vague de soda | FX_LIQUID, canettes (pool de 200) | jackpot de canettes, vague | CAM_FOLLOW, CAM_SLOWMO | HIGH | P3A |
| VND-BF | 2,8 + 2,0 | 1,8 | TW_MUG_BLOCK, BF_ENTRY_MUG | canette écrasée | FX_SPARKS | « tink » du mug | CAM_REACTION | LOW | P3A |

## F4 · TRAPDOOR EXPRESS (TRP) · ⭐ MVP

**Pitch** : sous le bureau du joueur, un levier « DO NOT PULL ». Sous le fauteuil du boss, une trappe. Où mène-t-elle ? Personne ne le sait.
**Moteur comique** : **le hors-champ**. La caméra reste sur le trou et **le son raconte**. C'est le gadget le moins cher du jeu, et l'un des plus drôles.

**Tronc commun (0 → 900 ms)**
- 0–300 : `HND_LEVER`, CLUNK.
- 300–900 : `TRP_SU_OPEN`, les engrenages grincent et le sol se découpe en carré sous le fauteuil. Boucle d'attente : le mécanisme cliquette, et une goutte de sueur perle sur Wendell qui passe.
- **D1 = 900 ms** : (a) le boss disparaît dans le trou, **ou** (b) il reste suspendu au-dessus du vide (physique cartoon : tant qu'il ne regarde pas en bas…).

**Assets du gadget** : trappe (décal de sol + volet), levier, masque de trou, porte d'ascenseur (élément du décor, réutilisé par le BOSS FIGHT).
**Signature sonore** : **bibliothèque hors champ riche** : chutes, fracas, chat, batterie, bowling, chorale, plongeon dans la fontaine. Budget audio > budget visuel.

| ID | D1 | Catégorie → classes | Rareté | Archétype · structure | Déroulé après D1 |
|---|---|---|---|---|---|
| TRP-L1 | b | CLEAN_MISS → MISS | common | ARC-04 · S01 | Le boss flotte au-dessus du vide et continue de taper. La trappe se referme sous lui. Il n'a jamais rien remarqué. Sip |
| TRP-L2 | b | BACKFIRE → MISS | common | ARC-03 · S05 | Le boss flotte… puis la caméra sursaute : le levier a aussi ouvert une trappe **sous le joueur**. Chute en vue subjective (`CAM_POV_FALL`), noir, « aaaah… » lointain, puis « splash ». Retour à l'image : le boss se penche au-dessus du trou du joueur et rit |
| TRP-L3 | a | CLEAN_MISS → MISS | common | ARC-08 · S06 | Il tombe. Hors champ : fracas, fracas… puis DING : les portes de l'ascenseur s'ouvrent sur le boss, un café frais à la main. Il fait coucou. Sip |
| TRP-L4 | a | BACKFIRE → MISS | rare | ARC-07 · S09 | Il tombe à moitié et remonte… en se servant de Wendell, accouru pour l'aider, comme d'une échelle. Wendell tombe à sa place (long sifflement, puis « I'm okay! » au loin) |
| TRP-FL | a | TEASE → MISS | common | ARC-08 · S05 | Il tombe, avec un long cri qui s'éloigne… `TW_SILENCE` (500 ms)… « BOING » : un trampoline de la salle de sport du dessous le renvoie hors du trou, droit dans son fauteuil. Sip |
| TRP-S | a | GRAZE → SCRAPE | common | — · S05 | Il tombe jusqu'à la taille et remonte couvert de poussière et de toiles d'araignée, une souris sur la tête (`IMP_T05_DUST`) |
| TRP-W1 | a | DIRECT → HIT, BIG | common | — · S02 | Il tombe… et reste coincé au niveau du ventre, comme un bouchon, bras qui s'agitent (`IMP_T1_CORK`). BIG : « pop », il passe (`IMP_T2_FLOOR_HOLE`) |
| TRP-W2 | a | DIRECT → BIG, MEGA | rare | — · S05 | **Aller simple** : il tombe tout droit. La caméra reste sur le trou (`CAM_HOLD`) pendant que le son raconte 12 étages : chat, batterie, bowling, chorale, plongeon dans la fontaine du hall. MEGA : on ajoute la destruction du décor |
| TRP-FW | b | COMEBACK → HIT, BIG, MEGA | common | — · S01 | Il flotte (comme L1)… puis regarde en bas, regarde la caméra (`TW_LOOK_DOWN`), déglutit… et tombe |
| TRP-BW | a | CHAIN → BIG, MEGA | common | — · S05, S07 | Après sa chute, le trou s'agrandit. Le bureau, le portrait et la fontaine à eau y glissent l'un après l'autre, chacun avec son fracas hors champ. Un geyser de papiers jaillit, et la chaussure du boss retombe sur le bureau. MEGA : toute la section de sol cède, les luminaires se balancent |
| TRP-BF | a | BF_ENTRY | common | — · S06 | Il tombe, fracas hors champ… DING : les portes de l'ascenseur s'ouvrent (**comme L3 !**) sur le boss, trempé et furieux, mug à la main, qui se met à briller : `BF_ENTRY_MUG` |

| ID | N | T | Segments réutilisés | Assets spécifiques | VFX | SFX | Caméra | Cx | Prio |
|---|---|---|---|---|---|---|---|---|---|
| TRP-L1 | 2,4 | 1,0 | HND_LEVER, RE_BOSS_OBLIVIOUS, RE_BOSS_SIP | — | — | CLUNK, clavier, trappe qui se referme | CAM_WIDE | LOW | P1 |
| TRP-L2 | 2,8 | 1,1 | CAM_POV_FALL, RE_BOSS_LAUGH | trou « côté joueur » | FX_SCREEN_OVERLAY (noir) | CLUNK ×2, cri qui s'éloigne, splash | CAM_POV_FALL | LOW | P1 |
| TRP-L3 | 2,9 | 1,1 | IMP_T2_OFFSCREEN_AUDIO, RE_BOSS_WAVE | ouverture de l'ascenseur | — | fracas hors champ, DING d'ascenseur | CAM_HOLD → CAM_WHIP (ascenseur) | LOW | P2 |
| TRP-L4 | 3,0 | 1,2 | WEN_FALL, RE_BOSS_DUST | — | FX_DUST | « oof », long sifflement, « I'm okay! » | CAM_WIDE | MEDIUM | P2 |
| TRP-FL | 3,5 | 1,3 | TW_SILENCE, RE_BOSS_SIP | — | FX_DUST | cri qui s'éloigne, silence 500 ms, BOING, atterrissage | CAM_HOLD → CAM_TILT_UP | LOW | P2 |
| TRP-S | 2,6 | 1,1 | IMP_T05_DUST, RE_BOSS_SULK | souris | FX_DUST | « ouf », couinement de souris | CAM_REACTION | LOW | P1 |
| TRP-W1 | 2,6 | 1,1 | IMP_T1_CORK, IMP_T2_FLOOR_HOLE, BEAT_MUG_LAND | — | FX_DUST | « plop » de bouchon, gigotements, DING | CAM_PUSH | LOW | P1 |
| TRP-W2 | 3,6 | 1,3 | IMP_T2_OFFSCREEN_AUDIO, IMP_T3_WRECK | — | — | **12 étages sonores** | CAM_HOLD | LOW (visuel) / MEDIUM (audio) | P2 |
| TRP-FW | 3,4 | 1,3 | TW_LOOK_DOWN, impact auto | — | — | silence, déglutition, chute | CAM_REACTION → CAM_TILT_DOWN | LOW | P2 |
| TRP-BW | 4,4 | 1,7 | IMP_T2_FLOOR_HOLE, IMP_T3_WRECK, RE_OFFICE_CHEER | trou qui s'agrandit (masque animé) | FX_PAPERS (geyser), FX_DUST | fracas en cascade, geyser | CAM_HOLD, CAM_SHAKE_L | MEDIUM | P2 |
| TRP-BF | 3,0 + 2,0 | 1,8 | BF_ENTRY_MUG | ascenseur (partagé avec L3) | FX_LIQUID (gouttes) | fracas, DING, ruissellement | CAM_WHIP → CAM_REACTION | LOW | P1 |

## F5 · HAUNTED PC (GHO)

**Pitch** : le vieux PC du coin, hanté par le fantôme de l'employé n°404, licencié en 1998. Il porte toujours sa cravate et son badge.
**Moteur comique** : le surnaturel **cartoon** (jamais effrayant), et un boss qui domine même les fantômes.

**Tronc commun (0 → 1 200 ms)**
- 0–300 : `HND_BOOT`.
- 300–800 : `GHO_SU_BOOT`, ronronnement d'écran cathodique, image qui glitche, lumières qui clignotent (`TW_POWER_FLICKER` court).
- 800–1 200 : le fantôme (un drap avec cravate et badge « #404 ») sort de l'écran : « Boooss… ». Boucle d'attente : flottement et chuchotements.
- **D1 = 1 200 ms** : (a) poltergeist, les objets se mettent à flotter, **ou** (b) le fantôme fonce sur le boss.

**Assets du gadget** : fantôme (sprite + déformation sinusoïdale), PC cathodique, teinte de clignotement (globale), ectoplasme vert pailleté, 20 instances de fantômes (BW).
**Signature sonore** : thérémine, « Boooss… », ronronnement cathodique.

| ID | D1 | Catégorie → classes | Rareté | Archétype · structure | Déroulé après D1 |
|---|---|---|---|---|---|
| GHO-L1 | b | CLEAN_MISS → MISS | common | ARC-09 · S13 | « BOO ! » Le boss ne lève pas les yeux, puis lui lance un regard noir. C'est le fantôme qui prend peur et se cache dans un tiroir |
| GHO-L2 | a | BACKFIRE → MISS | common | ARC-07 · S09 | Tous les objets volants partent… sur Wendell (fracas hors champ, dossiers qui volent). Le boss rit |
| GHO-L3 | b | CLEAN_MISS → MISS | rare | ARC-11 · S13 | Le boss tend au fantôme une pile de dossiers : « Overtime ». Le fantôme soupire et se met à classer. `RE_BOSS_PLANNED` |
| GHO-FL | b | TEASE → MISS | common | ARC-08 · S13 | Le fantôme possède le boss : yeux lumineux, lévitation, tête qui tourne comme une girouette (cartoon, jamais horrifique)… `TW_SILENCE`… Il éternue et le fantôme est expulsé. Il retombe dans son fauteuil et se mouche |
| GHO-S | b | GRAZE → SCRAPE | common | — · S13 | Il se fait asperger d'ectoplasme pailleté (`IMP_T05_SLIME`) |
| GHO-W1 | a | DIRECT → HIT, BIG, MEGA | common | — · S13 | Poltergeist : chaises et dossiers le renversent. BIG : une chaise volante l'emporte par la fenêtre |
| GHO-W2 | b | DIRECT → HIT, BIG | rare | — · S13 | Le fantôme l'attrape par les chevilles et le tire sous le bureau (`IMP_T1_UNDER`). BIG : à travers le plancher |
| GHO-FW | b | COMEBACK → HIT, BIG, MEGA | common | — · S11, S13 | Le fantôme fonce… et se fait aspirer dans le PC : écran bleu, tout semble fini. Le boss se moque et tapote l'écran… qui lui avale le bras et le tire tête la première à l'intérieur |
| GHO-BW | a | CHAIN → BIG, MEGA | common | — · S13, S07 | 20 fantômes d'employés licenciés sortent des classeurs et l'emportent à travers le mur (`IMP_T2_WALL_BREACH`). MEGA : tout l'étage lévite puis retombe |
| GHO-BF | b | BF_ENTRY | common | — · S13 | Le fantôme possède le mug, qui se met à briller… Le boss, pas impressionné, le boit quand même (il a bu le fantôme) : `BF_ENTRY_MUG` |

| ID | N | T | Segments réutilisés | Assets spécifiques | VFX | SFX | Caméra | Cx | Prio |
|---|---|---|---|---|---|---|---|---|---|
| GHO-L1 | 2,9 | 1,1 | HND_BOOT, RE_BOSS_SIP | tiroir | FX_GHOST_GLOW | « BOO », regard (« ding » grave), claquement de tiroir | CAM_REACTION | MEDIUM | P3B |
| GHO-L2 | 2,9 | 1,1 | WEN_HIT_OFF, RE_BOSS_LAUGH | objets flottants | FX_PAPERS | poltergeist, fracas hors champ | CAM_WHIP | MEDIUM | P3B |
| GHO-L3 | 3,0 | 1,2 | RE_BOSS_PLANNED | pile de dossiers | FX_GHOST_GLOW | soupir fantomatique, classement | CAM_WIDE | LOW | P3B |
| GHO-FL | 3,8 | 1,4 | TW_SILENCE | yeux lumineux (calque) | FX_GHOST_GLOW | thérémine, silence, ATCHOUM | CAM_PUSH → CAM_SHAKE_S | MEDIUM | P3B |
| GHO-S | 2,9 | 1,1 | IMP_T05_SLIME, RE_BOSS_SULK | — | FX_SLIME | « splotch » pailleté | CAM_REACTION | LOW | P3B |
| GHO-W1 | 3,1 | 1,2 | IMP_T1_DESK_FLIP, IMP_T2_WINDOW, BEAT_MUG_LAND | chaises flottantes | FX_PAPERS | tourbillon, THUD, DING | CAM_SHAKE_M | MEDIUM | P3B |
| GHO-W2 | 3,1 | 1,2 | IMP_T1_UNDER, IMP_T2_FLOOR_HOLE | — | FX_GHOST_GLOW | « wooosh » vers le bas | CAM_TILT_DOWN | LOW | P3B |
| GHO-FW | 4,0 | 1,5 | TW_POWER_FLICKER, impact auto | écran bleu | FX_GHOST_GLOW | son d'erreur, tapotement, aspiration | CAM_PUSH → CAM_SHAKE_M | MEDIUM | P3B |
| GHO-BW | 4,8 | 1,8 | IMP_T2_WALL_BREACH, IMP_T3_WRECK | 20 fantômes (instances) | FX_GHOST_GLOW, FX_DUST | chœur de « Boooss », fracas | CAM_SHAKE_L, CAM_SLOWMO | HIGH | P3B |
| GHO-BF | 3,1 + 2,0 | 1,8 | BF_ENTRY_MUG | — | FX_GHOST_GLOW → doré | gorgée « fantôme » | CAM_REACTION | LOW | P3B |

---

# UNHINGED 🤯 : catastrophes absurdes (violet / rouge)

> UNHINGED n'a pas de récupération (x0,5). Chaque gadget a donc **5 branches de perte** (L1 à L4 + FL) : c'est le niveau où les pertes sont les plus fréquentes (84 %, séries médianes de 24 sur 300 manches).

## U1 · OFFICE ROCKET (RKT) · ⭐ MVP

**Pitch** : une fusée de feu d'artifice géante, sanglée au dossier du fauteuil du boss. Il est au téléphone.
**Moteur comique** : **double fake-out** et retours inattendus. Le seul gadget à **deux points de divergence**.

**Tronc commun (0 → 1 300 ms, puis 2 000 ms pour la branche a)**
- 0–300 : `HND_LIGHTER`.
- 300–700 : `RKT_SU_STRAP`, les mains sanglent la fusée au fauteuil. Le boss se décale distraitement.
- 700–1 300 : `RKT_SU_FUSE`, la mèche crépite et se consume. Boucle d'attente : mèche étincelante.
- **D1 = 1 300 ms** : (a) **ALLUMAGE** (rugissement, le fauteuil décolle), **ou** (b) **CALAGE** (« pfft », bouffée de fumée).
- **D2 = 2 000 ms** (branche a) : (a1) cap sur la fenêtre, **ou** (a2) tout droit vers le plafond.

**Assets du gadget** : fusée (sprite + flamme), mèche, parachute, décal de trou au plafond, **fond ESPACE** (1 plan parallaxe + satellite), boule de feu, grappe de ballons, guimauve, placard secret de canettes « EXECUTIVE BLEND ».
**Signature sonore** : crépitement de mèche, puis rugissement de fusée ; « pfft » de calage.

| ID | D1/D2 | Catégorie → classes | Rareté | Archétype · structure | Déroulé après divergence |
|---|---|---|---|---|---|
| RKT-L1 | a1 | CLEAN_MISS → MISS | common | ARC-08 · S06 | Cap sur la fenêtre… un parachute s'ouvre **dans le bureau** (« Executive Safety Package ») et freine le fauteuil contre la vitre. Le boss redescend en douceur dans son fauteuil. Sip |
| RKT-L2 | a1 | BACKFIRE → MISS | common | ARC-03 · S06 | La fusée fait demi-tour vers la caméra. Le boss se détache juste avant, et la fusée frappe l'objectif : noir, suie sur l'écran. Le boss rit |
| RKT-L3 | b | CLEAN_MISS → MISS | common | ARC-11 · S11 | Calage, la mèche s'éteint. Le boss utilise la tuyère fumante pour griller une guimauve. Miam |
| RKT-L4 | b | CLEAN_MISS → MISS | rare | ARC-06 · S11 | Calage. Le boss tapote la fusée, curieux, et la « répare » : elle se rallume doucement et part… toute seule, puisqu'il s'était détaché. Elle sort par la fenêtre, il lui fait au revoir |
| RKT-FL | a2 | TEASE → MISS | common | ARC-08 · S03 | Le fauteuil traverse le plafond. `TW_SILENCE` (400 ms), débris qui tombent, caméra sur le trou… Le boss redescend lentement par le trou, toujours assis, pendu à une grappe de ballons de la fête de l'étage du dessus. Il atterrit à son bureau. Sip |
| RKT-W1 | a1 | DIRECT → HIT, BIG, MEGA | common | — · S02 | Sur le chemin de la fenêtre, le fauteuil accroche l'angle du bureau : le boss bascule derrière (`IMP_T1_DESK_FLIP`). BIG : il traverse la fenêtre, une étoile scintille dans le ciel. MEGA : il emporte le décor |
| RKT-W2 | a2 | DIRECT → HIT, BIG | common | — · S02 | Tout droit : coincé dans le plafond, jambes pendantes (`IMP_T1_CEILING`). BIG : il passe au travers |
| RKT-FW1 | b | COMEBACK → HIT, BIG, MEGA | common | — · S03, S11 | Calage (« pfft »). Le boss rit, se renverse en arrière et pose les pieds sur le bureau… `TW_SILENCE` (300 ms)… **rallumage brutal** (`TW_RESTART`) |
| RKT-FW2 | a1 | COMEBACK → HIT, BIG, MEGA | rare | — · S10, S03 | Cap sur la fenêtre, le parachute s'ouvre (**comme L1**), le boss ricane… COO passe en rase-mottes et coupe les suspentes d'un coup de bec (`COO_CUT`). HIT : il s'écrase contre le cadre et glisse, coincé. BIG/MEGA : il traverse la vitre |
| RKT-BW | a2 | CHAIN → BIG, MEGA | common | — · S14, S06 | Le plafond, `TW_SILENCE`… Plan suivant : l'espace. Le boss dérive devant un satellite, toujours au téléphone. MEGA : **rentrée atmosphérique**, il redescend en boule de feu à travers tous les étages et atterrit dans un cratère devant son bureau. Le mug retombe debout sur le bord du cratère |
| RKT-BF | a1 | BF_ENTRY | common | — · S06 | La fusée dévie dans le mur et défonce le placard secret du boss : des rangées de canettes « EXECUTIVE BLEND » dorées. Il s'en verse une dans le mug : `BF_ENTRY_MUG` |

| ID | N | T | Segments réutilisés | Assets spécifiques | VFX | SFX | Caméra | Cx | Prio |
|---|---|---|---|---|---|---|---|---|---|
| RKT-L1 | 3,2 | 1,2 | HND_LIGHTER, RE_BOSS_SIP | parachute | FX_FLAME, FX_SMOKE | rugissement, « flomp » du parachute, descente, slurp | CAM_FOLLOW → CAM_WIDE | MEDIUM | P2 |
| RKT-L2 | 3,0 | 1,1 | CAM_POV_HIT, RE_BOSS_LAUGH | — | FX_FLAME, FX_SCREEN_OVERLAY (suie) | rugissement qui approche, BOOM étouffé | CAM_POV_HIT | LOW | P2 |
| RKT-L3 | 2,8 | 1,1 | RE_BOSS_SIP | guimauve | FX_SMOKE | « pfft », grésillement | CAM_PUSH | LOW | P1 |
| RKT-L4 | 3,2 | 1,2 | RE_BOSS_WAVE | — | FX_FLAME (petite) | « pfft », tapotement, décollage doux | CAM_FOLLOW | LOW | P2 |
| RKT-FL | 4,0 | 1,5 | TW_SILENCE, IMP_T2_CEILING_HOLE (visuel seul) | grappe de ballons | FX_DUST, FX_SMOKE | BOOM, silence 400 ms, grincement de ballons | CAM_TILT_UP → CAM_HOLD → CAM_TILT_DOWN | MEDIUM | P2 |
| RKT-W1 | 3,3 | 1,2 | IMP_T1_DESK_FLIP, IMP_T2_SKY_TWINKLE, IMP_T3_WRECK, BEAT_MUG_LAND | — | FX_FLAME, FX_SMOKE | rugissement, THUD, DING | CAM_FOLLOW, CAM_SHAKE_M | LOW | P1 |
| RKT-W2 | 3,3 | 1,2 | IMP_T1_CEILING, IMP_T2_CEILING_HOLE | — | FX_DUST | BOOM, jambes qui pédalent | CAM_TILT_UP | LOW | P2 |
| RKT-FW1 | 4,0 | 1,5 | TW_SILENCE, TW_RESTART, RE_BOSS_LAUGH | — | FX_SMOKE, FX_FLAME | « pfft », rire, silence 300 ms, RUGISSEMENT | CAM_PUSH → CAM_SHAKE_L | MEDIUM | P1 |
| RKT-FW2 | 4,2 | 1,5 | COO_CUT, COO_FLYBY, impact auto | parachute (partagé avec L1) | FX_FLAME, plumes | « flomp », ricanement, « snip », chute | CAM_FOLLOW → CAM_WHIP | MEDIUM | P2 |
| RKT-BW | 4,8 | 1,8 | TW_SILENCE, IMP_T3_WRECK, RE_OFFICE_CHEER | **fond ESPACE**, boule de feu, cratère | FX_FIREBALL, FX_SHOCKWAVE, FX_CONFETTI | BOOM, silence, ambiance spatiale, sifflement de rentrée, IMPACT XL | CAM_TILT_UP, cut, CAM_SLOWMO, CAM_FREEZE | HIGH | P1 |
| RKT-BF | 3,4 + 2,0 | 1,8 | BF_ENTRY_MUG | placard secret, canettes dorées | FX_DUST, éclat doré | CRASH, chœur céleste court | CAM_WHIP → CAM_REACTION | MEDIUM | P1 |

## U2 · PIANO DELIVERY (PNO)

**Pitch** : le boss s'est offert un piano à queue. Les déménageurs le hissent par la fenêtre de l'étage du dessus. Les mains du joueur tiennent de grands ciseaux.
**Moteur comique** : l'**anticipation** classique (l'ombre qui grandit) et le hors-champ musical.

**Tronc commun (0 → 1 400 ms)**
- 0–500 : `CAM_TILT_UP`, le piano se balance au-dessus du bureau, la corde grince, le boss fredonne en dessous.
- 500–1 000 : `HND_SCISSORS`, snip, snip. Boucle d'attente : les brins cèdent un à un (`TW_LAST_STRAND`).
- 1 000–1 400 : l'ombre grandit sur le boss.
- **D1 = 1 400 ms** : (a) la corde cède, **ou** (b) il reste un brin.

**Assets du gadget** : piano (couvercle, touches), corde et poulie, silhouettes des déménageurs (haut du cadre), trou de plancher, lustre (BW).
**Signature sonore** : grincement de corde, accord « DOMMM ».

| ID | D1 | Catégorie → classes | Rareté | Archétype · structure | Déroulé après D1 |
|---|---|---|---|---|---|
| PNO-L1 | a | CLEAN_MISS → MISS | common | ARC-02 · S01 | Le piano tombe. Le boss recule d'un mètre pour attraper son téléphone qui sonne, et le piano atterrit là où il était : DOMMM. Il pianote un petit air. Sip |
| PNO-L2 | b | BACKFIRE → MISS | common | ARC-07 · S05 | Le brin tient. Les déménageurs remontent le piano… et lâchent une pile de cartons sur Wendell, hors champ. Le boss rit |
| PNO-L3 | a | CLEAN_MISS → MISS | rare | ARC-12 · S05 | Le piano tombe… sur le box vide d'à côté (fracas + accord hors champ). Le boss jette un œil, hausse les épaules. Sip |
| PNO-L4 | b | CLEAN_MISS → MISS | common | ARC-11 · S01 | Le brin tient. Les déménageurs descendent le piano en douceur, et le boss s'en sert de nouveau bureau, mug posé dessus. Sip |
| PNO-FL | a | TEASE → MISS | common | ARC-08 · S01 | Le piano tombe droit sur lui — `TW_SILENCE` — et s'arrête à **5 cm** de sa tête, accroché au portemanteau. Il ne remarque rien. Les déménageurs le remontent |
| PNO-W1 | a | DIRECT → HIT, BIG, MEGA | common | — · S02 | Atterrissage en accord majeur. Le couvercle s'ouvre : le boss est allongé dans les cordes, qui vibrent (`IMP_T1_UNDER`). BIG : le piano traverse le plancher avec lui |
| PNO-W2 | a | DIRECT → HIT, BIG | rare | — · S12 | Le piano atterrit à côté de lui, roule sur ses roulettes et le renverse. BIG : il l'emporte par la porte |
| PNO-FW | b | COMEBACK → HIT, BIG, MEGA | common | — · S08 | Il reste un brin (comme L2 et L4). Le boss lève les yeux, rit (« HA! ») et claque des doigts vers les déménageurs… la vibration fait céder le dernier brin |
| PNO-BW | a | CHAIN → BIG, MEGA | common | — · S04 | Le piano traverse le plancher avec le boss. La caméra suit la chute sur 3 étages, et les touches jouent une gamme montante à chaque étage. MEGA : il atterrit dans le lustre du hall, qui s'effondre dans la fontaine |
| PNO-BF | b | BF_ENTRY | common | — · S08 | Le brin tient. Furieux, le boss monte sur son bureau pour hurler sur les déménageurs, puis boit son mug : `BF_ENTRY_MUG` |

| ID | N | T | Segments réutilisés | Assets spécifiques | VFX | SFX | Caméra | Cx | Prio |
|---|---|---|---|---|---|---|---|---|---|
| PNO-L1 | 3,0 | 1,2 | HND_SCISSORS, TW_LAST_STRAND, RE_BOSS_SIP | — | FX_DUST | snip, DOMMM, petit air | CAM_TILT_DOWN | LOW | P3A |
| PNO-L2 | 3,1 | 1,2 | WEN_HIT_OFF, RE_BOSS_LAUGH | cartons | FX_DUST | poulie, avalanche de cartons hors champ | CAM_TILT_UP → CAM_WHIP | LOW | P3A |
| PNO-L3 | 3,1 | 1,2 | IMP_T2_OFFSCREEN_AUDIO, RE_BOSS_SHRUG | — | FX_DUST (qui entre dans le cadre) | CRASH + accord dissonant hors champ | CAM_HOLD | LOW | P3A |
| PNO-L4 | 3,2 | 1,2 | RE_BOSS_SIP | — | — | poulie qui descend, « tok » du mug | CAM_WIDE | LOW | P3A |
| PNO-FL | 3,8 | 1,4 | TW_SILENCE | portemanteau-crochet | FX_DUST | sifflement de chute, silence, TWANG | CAM_TILT_DOWN → CAM_PUSH | MEDIUM | P3A |
| PNO-W1 | 3,2 | 1,2 | IMP_T1_UNDER, IMP_T2_FLOOR_HOLE, BEAT_MUG_LAND | piano ouvert, boss dans les cordes | FX_DUST | DOMMM majeur, cordes qui vibrent, DING | CAM_SHAKE_M | MEDIUM | P3A |
| PNO-W2 | 3,3 | 1,2 | IMP_T1_DESK_FLIP, IMP_T2_DOOR | — | FX_DUST | accord, roulettes, THUD | CAM_FOLLOW | LOW | P3A |
| PNO-FW | 4,0 | 1,5 | TW_LAST_STRAND, impact auto | — | FX_DUST | « HA! », claquement de doigts, TWANG, chute | CAM_TILT_UP → CAM_SHAKE_M | LOW | P3A |
| PNO-BW | 5,0 | 1,8 | IMP_T2_FLOOR_HOLE, IMP_T3_WRECK | coupe de 3 étages, lustre | FX_DUST, FX_GLASS | gamme montante (3 notes), lustre qui éclate | CAM_TILT_DOWN (suivi), CAM_SLOWMO | HIGH | P3A |
| PNO-BF | 3,6 + 2,0 | 1,8 | BF_ENTRY_MUG | — | — | vocifération en *Bossish* | CAM_REACTION | LOW | P3A |

## U3 · DELIVERY TRUCK (TRK)

**Pitch** : « Colis pour M. Bottomline ! » Le joueur tamponne « URGENT » sur un bon de livraison. Au loin, un klaxon.
**Moteur comique** : **la destruction du décor** et l'accident.

**Tronc commun (0 → 1 200 ms)**
- 0–300 : `HND_SIGN` (tampon).
- 300–1 200 : `TRK_SU_RUMBLE`, klaxon lointain, grondement en crescendo, les stylos dansent sur le bureau, la plante tremble, le boss fronce les sourcils. Boucle d'attente : grondement continu.
- **D1 = 1 200 ms** : (a) un mur explose, **ou** (b) le camion s'arrête pile contre le mur (le mur se bombe et tient).

**Assets du gadget** : face avant du camion (**gros asset**), décal de brèche + débris, livreur (silhouette générique), caisse, colis.
**Signature sonore** : klaxon grave, bips de marche arrière.

| ID | D1 | Catégorie → classes | Rareté | Archétype · structure | Déroulé après D1 |
|---|---|---|---|---|---|
| TRK-L1 | b | CLEAN_MISS → MISS | common | ARC-11 · S12 | Le livreur entre par la porte et remet au boss un petit colis : un mug neuf, identique. Il signe, ravi |
| TRK-L2 | a | BACKFIRE → MISS | common | ARC-03 · S05 | Le mur explose… **derrière la caméra** : le box du joueur est aplati, la poussière envahit l'écran. Le boss rit |
| TRK-L3 | a | CLEAN_MISS → MISS | common | ARC-04 · S12 | Le camion défonce le mur et s'arrête à 10 cm du bureau. Bip-bip-bip de marche arrière, il ressort par le trou. Le boss n'a pas levé les yeux |
| TRK-L4 | b | BACKFIRE → MISS | rare | ARC-07 · S09 | Un colis énorme. Le boss le fait ouvrir par Wendell : un gant de boxe sur ressort l'envoie hors du cadre |
| TRK-FL | a | TEASE → MISS | common | ARC-09 · S01 | Le camion fonce droit sur le boss, impact, poussière (`TW_DUST_CLOUD`)… `TW_SILENCE`… Le boss est debout sur le capot, bras croisés, et le surfe jusqu'à l'arrêt. Il descend. Flex |
| TRK-W1 | a | DIRECT → HIT, BIG, MEGA | common | — · S12 | Le camion accroche le bureau, qui se retourne sur le boss (`IMP_T1_UNDER`). BIG : bureau et boss sont poussés à travers le mur opposé |
| TRK-W2 | a | DIRECT → BIG, MEGA | rare | — · S12 | La porte arrière s'ouvre au passage : le boss est happé dans la cargaison, tamponné « FRAGILE », et le camion repart |
| TRK-FW | b | COMEBACK → HIT, BIG, MEGA | common | — · S08 | Le camion s'arrête contre le mur (comme L1). Agacé, le boss passe le bras par la fissure et klaxonne lui-même… le camion bondit |
| TRK-BW | a | CHAIN → BIG, MEGA | common | — · S07 | Un camion, puis un deuxième, puis une file indienne de camions traverse l'open-space. Le boss s'éloigne sur le toit du dernier. MEGA : tout le mur s'effondre, et la lumière du jour inonde le bureau |
| TRK-BF | b | BF_ENTRY | common | — · S12 | Le livreur apporte une caisse « EXECUTIVE BLEND — BULK ». Le boss l'ouvre au pied-de-biche et remplit son mug : `BF_ENTRY_MUG` |

| ID | N | T | Segments réutilisés | Assets spécifiques | VFX | SFX | Caméra | Cx | Prio |
|---|---|---|---|---|---|---|---|---|---|
| TRK-L1 | 3,0 | 1,2 | HND_SIGN, RE_BOSS_SIP | livreur, petit colis | — | grondement qui s'arrête, sonnette de porte | CAM_WIDE | MEDIUM | P3C |
| TRK-L2 | 2,8 | 1,1 | CAM_POV_HIT, RE_BOSS_LAUGH | — | FX_DUST, FX_SCREEN_OVERLAY | explosion de mur derrière nous | CAM_SHAKE_L | LOW | P3C |
| TRK-L3 | 3,0 | 1,2 | RE_BOSS_OBLIVIOUS | brèche, face avant du camion | FX_DUST | CRASH, bip-bip-bip | CAM_SHAKE_M → CAM_WIDE | HIGH | P3C |
| TRK-L4 | 3,1 | 1,2 | WEN_WALK_IN, WEN_HIT_OFF | gant sur ressort | FX_STARS | BOING, « oof » qui s'éloigne | CAM_WHIP | MEDIUM | P3C |
| TRK-FL | 3,8 | 1,4 | TW_DUST_CLOUD, TW_SILENCE, RE_BOSS_FLEX | pose « surf » | FX_DUST | CRASH, silence, crissement | CAM_SHAKE_L → CAM_PUSH | HIGH | P3C |
| TRK-W1 | 3,2 | 1,2 | IMP_T1_UNDER, IMP_T2_WALL_BREACH, BEAT_MUG_LAND | bureau retourné | FX_DUST | CRASH, DING | CAM_SHAKE_M | HIGH | P3C |
| TRK-W2 | 3,6 | 1,3 | IMP_T2_OFFSCREEN_AUDIO | cargaison, tampon « FRAGILE » | FX_DUST | happement, tampon, klaxon qui s'éloigne | CAM_FOLLOW | MEDIUM | P3C |
| TRK-FW | 4,0 | 1,5 | impact auto | — | FX_DUST | « tsk », KLAXON, CRASH | CAM_PUSH → CAM_SHAKE_L | HIGH | P3C |
| TRK-BW | 5,0 | 1,8 | IMP_T2_WALL_BREACH, IMP_T3_WRECK, RE_OFFICE_CHEER | file de camions (instances) | FX_DUST, lumière du jour | klaxons en cascade | CAM_WHIP, CAM_SLOWMO | HIGH | P3C |
| TRK-BF | 3,4 + 2,0 | 1,8 | BF_ENTRY_MUG | caisse « BULK » | éclat doré | pied-de-biche, carillon doré | CAM_REACTION | LOW | P3C |

## U4 · WRECKING BALL (WRB)

**Pitch** : le chantier de démolition d'à côté. Le joueur parle au grutier au talkie-walkie : « Un peu à gauche… »
**Moteur comique** : le **pendule**. Ce qui s'éloigne revient toujours.

**Tronc commun (0 → 1 300 ms)**
- 0–300 : `HND_RADIO` (grésillement).
- 300–1 300 : `WRB_SU_SWING`, dehors, la boule géante passe une première fois devant la fenêtre (whoosh, ombre qui balaie le bureau) puis revient. Boucle d'attente : le pendule oscille dehors.
- **D1 = 1 300 ms** : (a) la boule entre, **ou** (b) elle s'arrête pile au ras de la vitre.

**Assets du gadget** : boule + chaîne (simple), vitre qui éclate (pièce de décor), silhouette de grue (fond), talkie-walkie.
**Signature sonore** : WHOOSH grave de pendule, grésillement radio.

| ID | D1 | Catégorie → classes | Rareté | Archétype · structure | Déroulé après D1 |
|---|---|---|---|---|---|
| WRB-L1 | b | CLEAN_MISS → MISS | common | ARC-04 · S01 | *Tink* : la boule effleure la vitre. Le boss ouvre la fenêtre et accroche son manteau à la boule |
| WRB-L2 | a | BACKFIRE → MISS | common | ARC-03 · S06 | CRASH : la boule rate le boss, repart… et revient **côté caméra** : noir, fracas hors champ. Le boss rit |
| WRB-L3 | a | CLEAN_MISS → MISS | common | ARC-02 · S12 | La boule entre. Le boss se baisse pile à ce moment pour ramasser un stylo (`TW_LUCKY_BEND`), la boule passe au-dessus et ressort. Il se relève sans rien avoir vu |
| WRB-L4 | a | BACKFIRE → MISS | rare | ARC-07 · S09 | Wendell entre avec un café. Au retour, la boule accroche son badge et l'emporte (« wheee », `WEN_CARRIED`) |
| WRB-FL | a | TEASE → MISS | common | — · S03 | La boule entre (ratée), ressort (soulagement), rentre (frisson)… et s'arrête à **1 cm** du nez du boss. Il lui fait « boop » du doigt, elle repart |
| WRB-W1 | a | DIRECT → HIT, BIG, MEGA | common | — · S02 | La boule frappe le bureau, qui projette le boss contre le mur (`IMP_T1_WALL_PIN`). BIG : à travers le mur |
| WRB-W2 | a | DIRECT → BIG, MEGA | rare | — · S12 | Au retour, la boule accroche la veste du boss et l'emporte par la fenêtre |
| WRB-FW | b | COMEBACK → HIT, BIG, MEGA | common | — · S06, S08 | La boule s'arrête au ras de la vitre (**comme L1**). Le boss ouvre la fenêtre pour y accrocher son manteau et se moque du grutier (« raté ! »)… la boule repart en arrière, puis revient **par l'autre côté** après avoir fait le tour de l'immeuble |
| WRB-BW | a | CHAIN → BIG, MEGA | common | — · S07 | La boule traverse trois murs. Le boss la chevauche comme un taureau de rodéo et se balance au-dessus de la ville. MEGA : toute la façade de l'open-space s'effondre |
| WRB-BF | b | BF_ENTRY | common | — · S01 | La boule touche la vitre. La vibration fait tomber le mug du bureau… il atterrit debout, plein (**indestructible**). Le boss le ramasse et boit : `BF_ENTRY_MUG` |

| ID | N | T | Segments réutilisés | Assets spécifiques | VFX | SFX | Caméra | Cx | Prio |
|---|---|---|---|---|---|---|---|---|---|
| WRB-L1 | 3,0 | 1,2 | HND_RADIO, RE_BOSS_SIP | manteau accroché | — | whoosh, *tink*, fenêtre qui s'ouvre | CAM_WIDE | LOW | P3A |
| WRB-L2 | 3,1 | 1,2 | CAM_POV_HIT, RE_BOSS_LAUGH | vitre brisée | FX_GLASS, FX_SCREEN_OVERLAY | CRASH, whoosh ×2, fracas | CAM_SHAKE_L | MEDIUM | P3A |
| WRB-L3 | 3,0 | 1,2 | TW_LUCKY_BEND, RE_BOSS_OBLIVIOUS | vitre brisée | FX_GLASS | CRASH, whoosh au ras de la tête | CAM_WIDE | MEDIUM | P3A |
| WRB-L4 | 3,2 | 1,2 | WEN_WALK_IN, WEN_CARRIED | — | FX_GLASS | « wheee » qui s'éloigne | CAM_FOLLOW | MEDIUM | P3A |
| WRB-FL | 4,0 | 1,5 | TW_SILENCE | — | FX_GLASS | whoosh ×3, silence, « boop » | CAM_PUSH (nez) | MEDIUM | P3A |
| WRB-W1 | 3,2 | 1,2 | IMP_T1_WALL_PIN, IMP_T2_WALL_BREACH, BEAT_MUG_LAND | — | FX_GLASS, FX_DUST | CRASH, THUD, DING | CAM_SHAKE_M | MEDIUM | P3A |
| WRB-W2 | 3,6 | 1,3 | IMP_T2_WINDOW, IMP_T2_SKY_TWINKLE | — | FX_GLASS | accroche, whoosh qui s'éloigne | CAM_FOLLOW | LOW | P3A |
| WRB-FW | 4,2 | 1,5 | TW_BOOMERANG, RE_BOSS_LAUGH, impact auto | manteau accroché (partagé avec L1) | FX_GLASS | *tink*, moquerie, whoosh qui revient par l'autre côté | CAM_WIDE → CAM_WHIP | MEDIUM | P3A |
| WRB-BW | 5,0 | 1,8 | IMP_T2_WALL_BREACH, IMP_T3_WRECK, RE_OFFICE_CHEER | pose « rodéo », façade | FX_DUST, FX_GLASS | « yeehaw », fracas en série | CAM_FOLLOW, CAM_SLOWMO | HIGH | P3A |
| WRB-BF | 3,3 + 2,0 | 1,8 | BF_ENTRY_MUG | — | — | *tink*, chute du mug, « tok » | CAM_TILT_DOWN → CAM_REACTION | LOW | P3A |

## U5 · TELEPORT-O-MATIC (TLP)

**Pitch** : le prototype de téléporteur de la R&D, un encadrement de porte bardé d'antennes, avec un gros cadran réglé sur « ANYWHERE ».
**Moteur comique** : **science-fiction** et retours inattendus.

**Tronc commun (0 → 1 200 ms)**
- 0–300 : `HND_DIAL`.
- 300–1 200 : `TLP_SU_CHARGE`, l'encadrement bourdonne, un portail tourbillonnant s'ouvre derrière le fauteuil, et le vent aspire les papiers. Boucle d'attente : tourbillon.
- **D1 = 1 200 ms** : (a) le portail aspire, **ou** (b) le portail tousse et recrache quelque chose.

**Assets du gadget** : encadrement du portail, tourbillon (sprite en rotation ou shader simple), 4 cartes postales (illustrations 2D), bouc (calque pour le boss parallèle), cactus, armure.
**Signature sonore** : bourdonnement électrique, « bloop » de téléportation.

| ID | D1 | Catégorie → classes | Rareté | Archétype · structure | Déroulé après D1 |
|---|---|---|---|---|---|
| TLP-L1 | a | CLEAN_MISS → MISS | common | ARC-11 · S06 | Le boss est aspiré — pop — et réapparaît aussitôt, bronzé, collier de fleurs au cou et petite ombrelle à cocktail dans le mug. Sip |
| TLP-L2 | b | BACKFIRE → MISS | common | ARC-03 · S14 | Le portail recrache un cactus, qui file droit dans la caméra et se colle à l'objectif. Le boss rit |
| TLP-L3 | a | CLEAN_MISS → MISS | rare | ARC-08 · S14 | Aspiré… le portail se rouvre au plafond, juste au-dessus de son fauteuil, et il retombe à sa place. Au deuxième passage, il boit une gorgée en pleine chute |
| TLP-L4 | b | CLEAN_MISS → MISS | rare | ARC-05 · S14 | Le portail recrache un second boss, venu d'un univers parallèle : bouc au menton, et **gentil**. Il propose une augmentation à Wendell. Le vrai boss le renvoie d'une poussée dans le portail. Sip |
| TLP-FL | a | TEASE → MISS | common | — · S14 | Le boss est aspiré jusqu'à la taille, jambes qui battent… `TW_SILENCE`… La batterie du portail lâche (`TW_BATTERY`, étincelles), et il est recraché dans son fauteuil, cheveux fumants |
| TLP-W1 | a | DIRECT → HIT, BIG, MEGA | common | — · S14 | Aspiré, il réapparaît la tête la première dans la corbeille (`IMP_T1_UNDER`). BIG : il réapparaît dehors et passe devant la fenêtre en tombant |
| TLP-W2 | a | DIRECT → BIG, MEGA | rare | — · S14 | « Destination inconnue » : défilé de cartes postales (Arctique, désert, île déserte) avec le boss dessus. MEGA : le mobilier le suit |
| TLP-FW | b | COMEBACK → HIT, BIG, MEGA | common | — · S08 | Le portail tousse de la fumée et s'effondre (fizzle). Le boss donne un coup de pied dans l'encadrement… qui se réactive et l'aspire |
| TLP-BW | a | CHAIN → BIG, MEGA | common | — · S04, S14 | Téléportations en série : jungle, Lune, Moyen Âge… puis retour par le plafond, en armure. MEGA : le portail avale tout le mobilier, qui retombe en pluie |
| TLP-BF | b | BF_ENTRY | common | — · S14 | Le portail recrache… son propre mug, venu du futur, rempli d'« EXECUTIVE BLEND 3000 » lumineux. Il boit : `BF_ENTRY_MUG` |

| ID | N | T | Segments réutilisés | Assets spécifiques | VFX | SFX | Caméra | Cx | Prio |
|---|---|---|---|---|---|---|---|---|---|
| TLP-L1 | 2,9 | 1,1 | HND_DIAL, RE_BOSS_SIP | collier, ombrelle, calque « bronzé » | FX_PORTAL | bloop ×2, ukulélé (1 s) | CAM_WIDE | LOW | P3B |
| TLP-L2 | 2,8 | 1,1 | CAM_POV_HIT, RE_BOSS_LAUGH | cactus | FX_PORTAL, FX_SCREEN_OVERLAY | toux du portail, « thwip », « aïe » | CAM_POV_HIT | LOW | P3B |
| TLP-L3 | 3,2 | 1,2 | RE_BOSS_SIP | portail de plafond | FX_PORTAL | bloop, chute, bloop, slurp en chute | CAM_TILT_UP → CAM_WIDE | MEDIUM | P3B |
| TLP-L4 | 3,4 | 1,3 | WEN_WALK_IN, RE_BOSS_SIP | bouc (calque), boss parallèle (instance) | FX_PORTAL | voix « gentille » en *Bossish* aigu, poussée | CAM_WIDE | MEDIUM | P3B |
| TLP-FL | 3,8 | 1,4 | TW_SILENCE, TW_BATTERY | — | FX_PORTAL, FX_SPARKS, FX_SMOKE | aspiration, silence, court-circuit | CAM_PUSH | MEDIUM | P3B |
| TLP-W1 | 3,1 | 1,2 | IMP_T1_UNDER, IMP_T2_WINDOW, BEAT_MUG_LAND | corbeille | FX_PORTAL | bloop, « bonk » dans la corbeille, DING | CAM_WHIP | LOW | P3B |
| TLP-W2 | 3,6 | 1,3 | IMP_T2_OFFSCREEN_AUDIO, IMP_T3_WRECK | 4 cartes postales | FX_PORTAL | bloop, déclic de diapo ×3 | CAM_PUSH | MEDIUM | P3B |
| TLP-FW | 4,0 | 1,5 | TW_RESTART, impact auto | encadrement éteint | FX_SMOKE, FX_PORTAL | toux, coup de pied, réactivation | CAM_PUSH → CAM_SHAKE_M | MEDIUM | P3B |
| TLP-BW | 4,8 | 1,8 | IMP_T2_CEILING_HOLE, IMP_T3_WRECK | 3 vignettes (jungle, Lune, Moyen Âge), armure | FX_PORTAL, FX_DUST | bloop ×4 + ambiance de chaque lieu | CAM_WHIP (entre vignettes), CAM_SLOWMO | HIGH | P3B |
| TLP-BF | 3,1 + 2,0 | 1,8 | BF_ENTRY_MUG | mug « du futur » | FX_PORTAL, éclat doré | bloop, carillon doré | CAM_REACTION | LOW | P3B |

---

## Récapitulatif de production

| Rage Level | Gadgets | Branches | dont pertes (L + FL) | LOW | MEDIUM | HIGH |
|---|---|---|---|---|---|---|
| GRUMPY | 5 | 50 | 20 | 26 | 19 | 5 |
| FURIOUS | 5 | 51 | 21 | 26 | 21 | 4 |
| UNHINGED | 5 | 51 | 25 | 21 | 21 | 9 |
| **Total** | **15** | **152** | **66** | **73** | **61** | **18** |

Comptage automatique sur les tableaux de production ci-dessus. TRP-W2 est compté LOW (visuel), son audio étant MEDIUM.

**MVP (SLG + TRP + RKT)** : 32 branches. En P1 : 13 branches. Tout le reste du MVP est en P2.
