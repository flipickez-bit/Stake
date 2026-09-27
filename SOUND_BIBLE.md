# BAD BOSS — SOUND BIBLE (v1, PRODUCTION 3 GADGETS)

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

**Statut** : version 1 du 2026-09-27. Elle remplace la v0 (POC « 3 PLANS »). Ses sources :
- la philosophie du GDD (`docs/GDD_07_UI_CAMERA_SON.md` §8.3) ;
- les repères de synchronisation de la Phase 0.6 (`PHASE_0_6.md`) ;
- les règles d'affichage des autres plans (POC, conservées en §9) ;
- le **BAD BOSS SOUND KIT** (`src/audio/soundKit.ts`) et son moteur de rendu (`src/audio/AudioDirector.ts`).

**Sons actuels : des placeholders.** Tous les sons sont **synthétisés** en WebAudio (aucun fichier, aucun service externe, aucun coût). L'architecture n'est pas liée à ces sons.
- Remplacer un son par un fichier produit garde le même `SoundId`, le même bus et le même pool de variantes.
- Cela ne change ni un cue, ni une durée, ni une branche, ni un book.

**Feuilles de cues** (générées depuis les séquences réellement compilées, jamais tenues à la main) : `docs/generated/SOUND_CUES_P3.md`.

---

## 1. Philosophie (GDD_07 §8.3.1)

1. **Le son, c'est le timing comique.** Chaque gag a une chute sonore (*boing*, *tink*, HMPF).
2. **Le silence est un effet.** Une pause de 200 à 400 ms (`silence`) précède certains rebondissements, jamais tous : c'est la « pause comique » du GDD. Pendant ce silence, l'ambiance reste audible (5 %).
3. **Identité** : la sonnette **DING** (le gain), le **HMPF** (B.B.), **LE SIP** (running gag), le **roucoulement** du COO.
4. **Les pertes sonnent drôle, jamais punitif.** Pas de buzzer, pas de son « d'échec ». Une perte se termine par une réaction comique (wah-wah, rire, gorgée).
5. **Les gains montent en couches, pas en volume.** Le nombre de DING donne la classe du gain.
6. **Lisible les yeux fermés.** On reconnaît le gadget (signature, §6) et la classe du résultat (§4) au son seul.

## 2. Mixage (implémenté)

| Bus | Niveau | Contenu | Priorité |
|---|---:|---|---|
| `stinger` | 1,00 | DING, cuivres, ovation, or, wah-wah | 1 : baisse la musique et l'ambiance 350 ms |
| `voice` | 0,90 | HMPF, rires, LE SIP, COO, rugissement géant | 2 |
| `impact` | 1,00 | Couches d'impact, débris, « room » | 3 |
| `sfx` | 0,85 | Mécanismes des gadgets, mouvements, bureau | 4 |
| `music` | 0,50 | Tension, boucle du BOSS FIGHT | Baissée à 0,2 sous un stinger |
| `ui` | 0,55 | `click` seulement | — |
| Ambiance | 0,05 | Bruit d'open-space filtré par Rage Level (§8) | Coupée pendant les silences comiques |

**Cibles de la production définitive** (à vérifier avec les vrais fichiers ; non mesurables sur les placeholders) :
- environ −16 LUFS intégrés ;
- crêtes ≤ −1 dBTP ;
- 16 voix simultanées au plus ;
- chaque grave doublé d'un « thump » médium, audible sur un haut-parleur de téléphone.

## 3. BAD BOSS SOUND KIT (catalogue)

**Une seule source de vérité** : `SOUND_KIT` associe à chaque son sa **catégorie**, son **bus**, la **taille de son pool de variantes** et son **écart de hauteur**.
- Un test vérifie que chaque `SoundId` du jeu y figure.
- Il vérifie aussi que les sons d'identité (DING, or) n'ont qu'une variante.

| Catégorie | Sons | Variantes |
|---|---|---|
| UI | `click` | 2 |
| OFFICE | `bell` (carillon de l'ascenseur, **pas** le DING), `elevator`, `room` | 1–3 |
| CHARACTERS | `hmpf`, `laugh`, `sip`, `gulp`, `coo`, `plop`, `honk` | 3–4 |
| MOVEMENT | `whoosh`, `spin`, `fall`, `twang`, `snap`, `screech`, `spray`, `roll`, `slide`, `gust` | 3–6 |
| GADGET | `creak`, `stretch`, `pfft`, `fuse`, `clunk`, `roar`, `crank`, `whirr`, `rattle`, `squeak`, `chain`, `deflate`, `boing` | 3–5 |
| IMPACT | `thud`, `bonk`, `crash`, `clang`, `tink`, `clink`, `glass`, `boom`, `thump`, `splash`, `strike` | 3–6 |
| DEBRIS | `debris`, `paper`, `rumble` | 3–5 |
| SUSPENSE | `tension` | 2 |
| WIN | `ding` (identité, 1 variante), `wahwah`, `cheer` | 1–3 |
| BIG WIN | `brass` | 2 |
| BOSS FIGHT | `gold` (identité, 1 variante), `giantRoar`, `crack` | 1–2 |
| COLLECTION | Aucun son dans la manche. La découverte d'une carte est **visuelle** (carte qui vole vers le livre), pour ne jamais se confondre avec un son de gain | — |

**Sons de gain** (`WIN_SOUNDS`) : `ding`, `gold`, `cheer`, `brass`. Ils sont **réservés au résultat réellement payé du gadget joué**.

## 4. Stingers de résultat

| Classe | Multiplicateur | Ce qu'on entend (vitesse normale) |
|---|---|---|
| MISS | x0 | Réaction comique (wah-wah, rire, HMPF, LE SIP…). **Pas de buzzer** |
| SCRAPE | x0,5 | `tink` + `bonk` + « pfff » + petit `click`. **Aucun DING, aucune pièce, aucun son de gain** |
| HIT | x1 à moins de x5 | Couches d'impact + **1 DING** |
| BIG | x5 à moins de x25 | Couches lourdes + **2 DING** + cuivres (`brass`, +560 ms) |
| MEGA | x25 à moins de x100 | **3 DING** + cuivres + ovation (`cheer`, +820 ms) |
| LEGENDARY | x100 et plus | **4 DING** + cuivres + ovation |
| BOSS FIGHT | palier atteint | Carillon doré (`gold`) à l'entrée, boucle de combat, K.O. : ovation + DING |

**x0,5 ne joue pas le DING.** L'écart relevé en v0 est **corrigé** : le tier `T05` de `src/content/library.ts` n'a plus de DING. Deux tests automatiques le vérifient (`tests/unit/production.test.ts`, bloc SOUND KIT) :
1. toutes les branches SCRAPE des 9 gadgets, et toutes leurs réactions, ne contiennent aucun son de `WIN_SOUNDS` ;
2. le nombre de DING est égal à la classe : HIT 1, BIG 2, MEGA 3, LEGENDARY 4.

En turbo, la même règle s'applique ; les couches sont compressées.

## 5. Impacts en couches

Chaque impact de la bibliothèque (`impactSegment`) superpose des couches. Toutes sont déclenchées au contact (t = 0), jamais avant.

| Couche | Petit choc (x0,5) | Choc (x1–x2) | Gros choc (x3+) |
|---|---|---|---|
| BODY | `tink` | `thud` | `crash` |
| OBJECT | `bonk` | selon ce qui est frappé : vitre `glass`, mur `clang`, liège `paper`, plafond `debris`, sol `thump`, bouche d'aération `rattle` | idem |
| LOW | — | `thump` | `thump` + `boom` |
| DEBRIS | — | — | `debris` (+50 ms) |
| ROOM | — | — | `room` (+90 ms) : la pièce qui résonne |
| COMEDIC | `pfft` + `click` | `boing` (+140 ms) | — |

L'image d'impact et le hit stop (Phase 0.6) tombent sur la même image que les couches BODY/OBJECT.

## 6. Signatures des 9 gadgets

Une signature est la famille de sons qui identifie le gadget les yeux fermés. Elle est déclarée dans chaque `GadgetDef` (`signature`). Le tronc (avant D1) est **identique pour toutes les issues** d'un gadget.

| Rage Level | Gadget | Signature | Tronc (extrait) | Attente réseau |
|---|---|---|---|---|
| GRUMPY | SWIVEL SLINGSHOT | `stretch` `creak` `twang` `snap` | élastique qu'on tend, fauteuil qui grince | `creak` / 700 ms |
| GRUMPY | ESPRESSO BLASTER | `pfft` `clunk` `rattle` `plop` | levier, pression qui monte, aiguille qui tremble | `pfft` / 700 ms |
| GRUMPY | COPIER CATAPULT | `clunk` `paper` `snap` `boing` | bouton, copieur qui chauffe, feuilles | `clunk` / 650 ms |
| FURIOUS | TRAPDOOR EXPRESS | `creak` `clunk` `fall` `elevator` | levier, trappe qui grince | `creak` / 650 ms |
| FURIOUS | CABINET DOMINO | `clang` `rattle` `slide` `creak` | classeur poussé, tiroirs qui cliquettent | `rattle` / 620 ms |
| FURIOUS | WATER COOLER BOWLING | `roll` `gulp` `strike` `splash` | bonbonne qui roule, glouglou | `gulp` / 700 ms |
| UNHINGED | OFFICE ROCKET | `fuse` `roar` `whoosh` `crash` | mèche qui crépite, moteur | `fuse` / 500 ms |
| UNHINGED | CEILING SAFE | `creak` `chain` `boom` `crank` | détonateur, corde qui s'effiloche, chaîne | `creak` / 680 ms |
| UNHINGED | HVAC HURRICANE | `whirr` `gust` `rattle` `crank` | thermostat tourné, ventilation qui monte | `whirr` / 800 ms |

Le détail, branche par branche (ordre des sons de la fin, nombre de DING, durée), est dans `docs/generated/SOUND_CUES_P3.md`.

## 7. LE SIP et ses micro-variations

LE SIP reste le running gag. Il ne signale **jamais** une perte : il apparaît après des pertes comme après des gains. Pour qu'il ne s'use pas, sa version est choisie **par la graine du book** (`createRng(seed, 'sip')`), jamais par `Math.random()` :

| Variante | Poids | Son |
|---|---:|---|
| `RE_SIP` | 40 | gorgée + HMPF |
| `RE_SIP_CLINK` | 25 | gorgée + le mug reposé : CLINK (pas de HMPF) |
| `RE_SIP_GULP` | 20 | grande gorgée bruyante + HMPF aigu |
| `RE_SIP_SILENT` | 15 | il lève le mug, s'arrête, regarde le joueur. **Aucun son** |

La pause « SIP_BEAT » au milieu d'une branche a 3 variantes, choisies par `createRng(seed, 'sipbeat')` :
- la gorgée d'origine ;
- la gorgée suivie d'un CLINK ;
- la gorgée muette.

Un test vérifie que les 4 variantes de réaction apparaissent sur 400 graines, et que la même graine donne toujours la même variante.

## 8. Musique non permanente

Il n'y a pas de musique en boucle permanente. Quatre couches existent, chacune pour un moment précis :

| Couche | Quand | Rendu actuel (placeholder) |
|---|---|---|
| **Ambiance** du Rage Level | Toujours, à 5 % ; coupée pendant un silence comique | Bruit d'open-space filtré : GRUMPY 220 Hz (calme), FURIOUS 320 Hz (agité), UNHINGED 180 Hz (grondement sourd) |
| **Tension** | Certains rebondissements seulement (Wendell qui s'en mêle : espresso, classeurs, bonbonne ; surpression KABOOM de l'espresso) ; jamais dans le tronc | Deux battements graves + nappe (`tension`) |
| **BOSS FIGHT** | Du signal `bfStart` (arène) jusqu'au K.O. ou au reveal | Ostinato de basse (8 pas, 190 ms), coups sourds tous les 4 pas |
| **Big Win cue** | Gros gains seulement (BIG et plus) | Cuivres (`brass`) + ovation (`cheer`) pour MEGA et LEGENDARY ; la musique est baissée 350 ms |

**Transitions de monde** (300 à 700 ms, image seulement) : aucun son dédié. Le changement de filtre de l'ambiance (0,3 s) suffit et évite un signal sonore qui pourrait être lu comme un gain.

## 9. Choix du plan et affichage des autres plans

| Situation | Son |
|---|---|
| Idle des gadgets dans le décor (READY) | **Aucun.** Seulement une petite animation (élastique qui vibre, vapeur, feuille qui sort, aiguille, mèche…) |
| Choix d'un gadget | `click` discret (retour d'interface), une seule fois ; rien si le gadget était déjà choisi |
| Manche | Seulement les sons du **gadget joué** |
| Résultat | Stinger de la classe du résultat **payé** (§4) |
| **Autres plans** (ON-DEMAND, PRIVATE, REVEAL ALL) | **Aucun son.** Ni DING, ni célébration, ni son de déception, pour AUCUN des plans affichés (x0 comme x100) |

Vérifications automatiques :
- test unitaire : le composant OTHER PLANS ne référence aucun son ;
- test e2e : zéro appel à `AudioDirector.play` à l'ouverture du panneau.

## 10. Déterminisme (replay, reprise)

- Chaque cue `sound` compilé porte une **graine** (la graine d'effets de la séquence, dérivée du book).
- `variantOf(sound, seed)` = `hash32("<son>|<graine>")`. Il donne l'indice de variante, la hauteur (répartie régulièrement dans ±spread) et la longueur (±6 %).
- Même book → mêmes sons, mêmes variantes, même ordre. Cela vaut pour une reprise après coupure comme pour un replay.
- `Math.random()` est interdit dans tout `src/`. Un test parcourt le code (commentaires exclus) et échoue s'il en trouve un.
- Les turbos retirent les ralentis et compressent les segments ; ils ne changent jamais le choix d'une variante.

## 11. Tests liés au son

Dans `tests/unit/production.test.ts`, bloc « SOUND KIT » :
- x0,5 sans DING ni aucun son de gain ; perte sans son de gain ;
- DING = classe ;
- catalogue complet ; sons d'identité sans variante ;
- déterminisme des variantes : même book → mêmes sons et mêmes graines ;
- LE SIP : variantes déterministes, les 4 atteintes ;
- aucun `Math.random()` dans `src/` ;
- carillon de l'ascenseur ≠ DING de gain.

Ailleurs :
- `tests/unit/poc3Content.test.ts` et e2e `poc3` : aucun son à l'ouverture des autres plans ;
- `tests/unit/presentation.test.ts` : le tronc est identique pour toutes les issues, sons compris (hors variantes de SIP_BEAT, qui sont cosmétiques et viennent après D1).

## 12. À faire (production audio définitive)

Aucun service ni asset payant n'a été utilisé. Pour la version définitive :
- remplacer les sons synthétisés par des sons produits (sound design original), avec les **mêmes identifiants** et des pools de 3 à 6 variantes ;
- enregistrer les voix (Bossish, Wendell, COO), qui sont aujourd'hui des tons synthétiques ;
- composer un vrai thème de BOSS FIGHT et un Big Win cue (aujourd'hui : ostinato et cuivres synthétiques) ;
- mesurer la sonie (−16 LUFS) sur les vrais fichiers ;
- tester sur les haut-parleurs d'un téléphone réel ;
- [INFORMATION STAKE ENGINE REQUISE] contraintes audio de la plateforme : formats, taille, lecture automatique, bouton muet imposé.
