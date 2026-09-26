# PHASE 0.5 — Playtest et game feel

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**
> Une seule question : **BAD BOSS est-il déjà satisfaisant à jouer avec des placeholders ?**
> On ne compense pas un manque de fun par des fonctionnalités. Autoplay : **hors Phase 0.5** (descendu dans les priorités).

## Périmètre gelé (validé en Phase 0, pas de restructuration sans raison)
Architecture générale · Svelte 5 + PixiJS 8 + TypeScript · `RgsPort` · Mock RGS · adaptateur Stake isolé · GameFlow · système déterministe · cosmetic seed · DEV PANEL · 3 Rage Levels · 3 gadgets MVP · reprise / replay · budgets techniques.

## État des critères de fin

| # | Critère | État |
|---|---|---|
| 1 | Au moins un PLAYTEST 50 humain terminé | ✅ **PLAYTEST #1** (1 session, contenu P05-A) · ⏳ **PLAYTEST #2** (contenu P05-B) |
| 2 | Plusieurs sessions si possible | ⏳ En attente (chaque testeur exporte sa session) |
| 3 | Questionnaire final | ✅ 7 affirmations 1-5 (Q7 ajoutée en 0.5B) + champ libre, à la fin uniquement |
| 4 | Deuxième branche LOSS par gadget | ✅ BACKFIRE, TEASE, WENDELL CEILING, **et bien au-delà** : variété V2 (§6) |
| 5 | Cadrage portrait amélioré | ✅ `docs/phase05/portrait/compare-*.jpg` (avant / après) |
| 6 | LOOP x500 analysé | ✅ `docs/generated/LOOP_X500.md` (voir §4) |
| 7 | Aucun nouveau problème critique de GameFlow | ✅ GameFlow inchangé en 0.5B ; tests unitaires et e2e verts ; à reconfirmer au PLAYTEST #2 |

## 0. PLAYTEST #1 (contenu P05-A, 12 branches) : ce qu'on a appris

| Question | Résultat | Lecture |
|---|---|---|
| Q1 Envie de connaître le résultat après le lancement | **2,5 / 5** | **Problème principal** : après quelques manches, le début d'une animation annonce sa fin |
| Q2 Les trois Rage Levels semblent différents | Validé (très bon) | Ne pas toucher |
| Q3 Les pertes restent amusantes | Validé, **variété insuffisante** | Les pertes plaisent, mais on les revoit trop |
| Q4 Rapidité des manches | Très bon | Ne pas toucher à la vitesse générale |
| Q5 Les gros résultats semblent spéciaux | Non évaluable | Aucun gros gain vu pendant la session |
| Q6 (commentaire) | « Après ~50 manches, j'ai envie de beaucoup plus d'animations NOUVELLES » | Besoin de découverte à long terme |

Conclusion : le rythme et les Rage Levels fonctionnent ; **le suspense s'use parce que le contenu est trop petit et trop lisible**. Réponse de la Phase 0.5B : variété modulaire + imprévisibilité mesurée (§6). Objectif du PLAYTEST #2 : **Q1 ≥ 4 / 5**, et de nouvelles animations encore remarquées après les manches 10, 25 et 50 (Q7 + colonnes de nouveauté du rapport).

## 1. Protocole PLAYTEST 50 (pour chaque testeur)

1. Ouvrir la préversion (de préférence **sur téléphone**, son activé). Ne pas ouvrir le DEV PANEL.
2. Toucher **PLAYTEST** en haut, puis **Commencer** (le solde fictif revient à $1,000.00, aucun résultat n'est forcé).
3. Jouer **50 manches** librement : Rage Levels, mise, vitesse, skip. **Aucune question pendant la partie.**
4. Après la 50e manche : **7 affirmations** notées de 1 à 5 et un champ facultatif, puis **Copier les résultats** (ou **Enregistrer le fichier**) et me transmettre le texte ou le fichier.
5. Rien n'oblige à continuer ensuite. Si le testeur relance d'elle-même ou de lui-même des manches, elles sont comptées (« manches après la 50e »), sans aucune incitation à l'écran.

Conception volontairement neutre : pas de récompense, pas de score du questionnaire, pas de message qui cherche une bonne note ; « Passer » est toujours possible.

## 2. Données collectées (LOCAL DEV ONLY)

Stockées **uniquement** dans le `localStorage` du navigateur du testeur (`badboss.playtest.local-dev-only.v2`). Aucun envoi réseau : l'export est un geste volontaire (copier / enregistrer). Toute collecte future auprès de vrais joueurs sera traitée à part (information, consentement).

| Par manche | Détail |
|---|---|
| `n` | numéro de manche (1 à 50) |
| `level`, `gadget` | Rage Level et gadget joués |
| `outcome` | LOSS · SCRAPE (x < 1) · WIN · BIG WIN · BOSS FIGHT |
| `multiplier`, `branch` | multiplicateur et branche d'animation |
| `animationMs` | durée réelle de l'animation (début → fin de la présentation) |
| `readyToBetMs` | délai entre le retour à READY et la mise suivante |
| `speed`, `skipped` | normal / turbo / super, et usage du skip |
| `bossFight` | BOSS FIGHT déclenché ou non |
| `variant`, `newBranch`, `newVariant` | variante cosmétique complète (branche / réaction / caméo de COO), et si la branche ou la variante apparaît pour la première fois dans la session |
| (session) | version du contenu, taille d'écran, tactile, DEV PANEL ouvert pendant la session, réponses, manches après la 50e |

Questionnaire (1 = pas du tout d'accord, 5 = tout à fait d'accord) :
1. J'avais envie de connaître le résultat après avoir lancé le gadget.
2. Les trois Rage Levels m'ont semblé différents.
3. Les animations de perte restaient amusantes.
4. Les manches m'ont semblé suffisamment rapides.
5. Les gros résultats semblaient réellement spéciaux.
6. J'aurais volontairement lancé une 51e manche.
7. À la fin de la session, j'avais encore l'impression de découvrir de nouvelles animations. *(ajoutée en 0.5B)*

Q5 propose aussi « Pas rencontré pendant la session » (aucun gros résultat vu) : la réponse est alors enregistrée `null`, jamais remplacée par une note inventée.

Champ facultatif : « Quel moment t'a le plus marqué ? »

Agrégation : `node tools/playtest-report.mjs exports/*.json --markdown docs/generated/PLAYTEST_REPORT.md` (moyennes des 7 questions en ignorant les « pas rencontré », commentaires, métriques par Rage Level, hésitation selon le résultat précédent, usage de turbo / skip, BOSS FIGHT, manches après la 50e, **tableau par version de contenu** pour comparer P05-A et P05-B, et **nouveauté** : branches distinctes vues à 10 / 25 / 50 manches, nouvelles branches entre la 41e et la 50e).

Un **APERÇU BOSS FIGHT** (sans mise, §6.7) joué pendant une session n'est pas enregistré, et le délai READY → mise de la manche suivante est exclu (`null`) pour ne pas fausser l'hésitation.

## 3. Cadrage portrait (fait)

Pas un simple zoom de toute la scène. Changements :
- **Scène à hauteur maîtrisée** en portrait (`min(140vw, 64vh, 100dvh − 262px)`) : le HUD remonte, les **cartes Rage Level sont collées à la zone d'action**, FIRE et SKIP restent sous le pouce, puis vitesse et mise.
- **Caméra portrait adaptative** (rendu seulement, fonction pure de l'image : reprise et replay inchangés) : largeur utile 640, **sol ancré à 62 %** de la hauteur (le boss remonte et grandit, le plafond vide disparaît), **suivi partiel du boss** (45 %) tant qu'il est visible, retour à la caméra du contenu quand il quitte le cadre.
- **Profondeur** : le **bureau du joueur au premier plan** (clavier, post-it, cactus, tasse turquoise : le mug jaune reste celui de B.B.), d'où surgissent les mains ; **suspensions** au plafond.
- Mise en page compacte pour les petits écrans (360 × 640) : plus rien n'est coupé.
- La mention *WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED* passe en surimpression discrète dans la scène sur écran étroit (le titre de la barre était tronqué).
- Paysage : inchangé (le bureau du joueur est hors cadre).

Captures : `docs/phase05/portrait/before-*.jpg` (build de fin de Phase 0) et `after-*.jpg`, mêmes instants, deux tailles d'écran ; planches `compare-phone-390x844.jpg` et `compare-small-360x640.jpg`. Outil : `node tools/capture-portrait.mjs --dist <build> --prefix <before|after>`.

## 4. LOOP x500

`docs/generated/LOOP_X500.md` : 500 manches en turbo, sans mise, **500/500, 0 erreur, 0 appel wallet**, relevé mémoire tous les 50 rounds **avant et après un GC forcé** (Chrome `--expose-gc`).

| Round | 0 | 50 | 100 | 150 | 200 | 250 | 300 | 350 | 400 | 450 | 500 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Tas après GC (Mo) | 6.6 | 8.2 | 8.3 | 8.4 | 8.4 | 8.4 | 8.6 | 8.6 | 8.6 | 8.5 | 8.7 |
| Tas brut (Mo) | 8.8 | 9.6 | 10.5 | 10.4 | 10.7 | 10.5 | 11.4 | 10.4 | 10.9 | 11.0 | 11.1 |

**Conclusion : chauffe normale, pas de croissance continue significative.**
- +1,6 Mo pendant les 50 premières manches (compilation JIT, caches, premiers tampons), puis un plateau : 8,2 → 8,7 Mo sur les 450 manches suivantes (**≈ 0,08 Mo / 100 manches**).
- Le « 8,9 → 10,8 Mo » du LOOP x100 était surtout du tas brut non encore collecté : le tas brut oscille entre 9,6 et 11,4 Mo selon le moment du GC.
- Nœuds d'affichage (131) et textures (6) **constants** du début à la fin : aucun objet de scène ne fuit.
- La pente résiduelle (≈ 0,5 Mo sur 500 manches) inclut au moins en partie **l'instrumentation elle-même** (le `PerfMeter` enregistre chaque image pendant la boucle). À vérifier en désactivant l'enregistrement si la question revient ; à 0,08 Mo / 100 manches, une session de 1 000 manches coûterait < 1 Mo.
- Aucune optimisation tentée, comme demandé.

## 5. Deuxième branche LOSS par gadget (fait en 0.5B)

Les trois directions comiques sont implémentées, fidèles à la note d'origine, avec **aucune modification des probabilités mathématiques** :
- **SWIVEL SLINGSHOT — BACKFIRE** (`SLG-C1`) : B.B. saute de sa chaise, se protège ; la chaise vide part dans le mauvais sens ; silence ; il rouvre les yeux, intact ; la chaise revient et détruit l'ordinateur derrière lui ; LE SIP ; x0.
- **TRAPDOOR EXPRESS — TEASE** (`TRP-B1`) : la trappe s'ouvre, B.B. tombe ; sa cravate se coince, il pend ; Wendell vient tirer, tension ; il le remonte par accident ; B.B. rajuste sa cravate ; LE SIP ; x0.
- **OFFICE ROCKET — WENDELL CEILING** (`RKT-B3`) : calage, provocation, rallumage brutal, fumée totale ; elle se dissipe : B.B. tranquille à son bureau, Wendell collé au plafond ; B.B. lève les yeux ; LE SIP ; x0. Réservée au script BACKFIRE (sinon elle occupait 31 % des manches de la fusée).

Le « tell » de la fusée (un rallumage annonçait toujours un gain) est corrigé : après STALL › REIGNITE, P(gain) = 17 % pour une base de 15 %.

## 6. PHASE 0.5B — variété V2 (contenu P05-B)

### 6.1 Ce qui ne change pas
Rage Levels, maths (RTP, distributions, 1/150), GameFlow, architecture, cadrage ; tronc neutre, impacts et réactions (segments partagés) inchangés. **Vitesse générale** : mesurée et bornée en CI (§6.9). Les 12 autres gadgets ne sont pas commencés.

### 6.2 Structure : SETUPS × TWISTS × FINS
Chaque branche est composée de **modules visibles partagés** (`compose(id, label, modules, fin, …)` dans `src/content/dsl.ts`) ; `BranchDef.path` retient la suite des modules visibles avant la fin.

| Gadget | Branches (dont BOSS FIGHT) | Setups | Twists | Pertes / gains |
|---|---:|---|---|---|
| SWIVEL SLINGSHOT | **17** (2) | LAUNCH · SPIN · BACKFIRE · ELEVATOR | PHEW · SIP · SIP_EMPTY · ELEV_WAIT | 8 pertes · 7 gains |
| TRAPDOOR EXPRESS | **16** (2) | HOVER · DROP · JAM | FALL · TIE_CATCH · WENDELL_HELP · SIP · SIP_EMPTY · ELEV_WAIT | 8 pertes · 6 gains |
| OFFICE ROCKET | **18** (2) | IGNITE · STALL · UP | ZIGZAG · REIGNITE · SMOKE · MISS · THROUGH_ROOF · ELEV_WAIT | 7 pertes · 9 gains |

Total : 51 branches (45 hors BOSS FIGHT), contre 12 en P05-A. Détail branche par branche : `docs/generated/VARIETY_REPORT.md`.

### 6.3 Débuts partagés, fins opposées (mesuré)
Règle testée en CI (`tests/unit/variety.test.ts`) pour **chaque préfixe visible** de chaque gadget :
- au moins une issue gagnante ET une issue perdante partagent ce début ;
- **rapport de vraisemblance P(début | gain) / P(début | perte) ∈ [0,5 ; 2]**, calculé avec la vraie distribution mathématique des classes et les poids de script du book. Résultat : 0,62 à 1,83. Autrement dit, voir un début déplace l'estimation du joueur de quelques points seulement (ex. fusée : base 15 % de gains, 10 % à 24 % selon le début) ;
- la fin qui tranche arrive tard : fin → reveal ≤ 800 ms (≤ 1 300 ms pour les gags RARE / VERY_RARE).

### 6.4 Gags récurrents, sans signification fixe
- **LE SIP** n'annonce plus une perte : SIP → mug vide → le gadget revient du hors-champ → BOUM → **gain** (`SLG-C2`, `TRP-C1`), ou → perte (`SLG-C3`, `TRP-C2`), ou fin sur un SIP satisfait (`SLG-C4`, `TRP-C3`).
- **Wendell** amortit, aide, tombe, finit au plafond ; **COO** applaudit, repêche B.B., fait demi-tour avec la fusée ; le **mug**, la **cloche DING**, l'**ordinateur**, la **vitre**, le **ventilateur**, l'**extincteur**, la **plante** et le **plafond** servent de gags à réaction en chaîne.
- **Doubles twists** (rares par construction) : la cravate retient puis cède (`TRP-B2`), la fusée part sans lui puis COO la ramène (`RKT-B8`), la chaise part, silence, SIP, mug vide, puis retour (`SLG-C2`).

### 6.5 Signature hors champ : l'ascenseur
Les trois gadgets peuvent envoyer B.B. dans l'ascenseur. Les portes se ferment, **silence**, l'indicateur d'étage bouge, **DING**, les portes s'ouvrent : intact (perte), en miettes (gain), avalanche de papiers avec COO sur la tête (gros gain, RARE), halo doré (BOSS FIGHT). Le même début mène aux quatre fins.

### 6.6 Rareté cosmétique et découverte
Poids : COMMON 100 · UNCOMMON 40 · RARE 12 · VERY_RARE 3. Sélection : branches compatibles avec **le script du book ET la classe de résultat déjà déterminée**, puis tirage pondéré avec le flux `branch` de la graine du book.
- **Ne modifie jamais les maths** : la classe, le multiplicateur, le payout et le bonus sont fixés avant ; la rareté ne choisit qu'entre des présentations équivalentes.
- **Jamais liée à la proximité d'un gain futur** : le tirage ne lit que la graine et le résultat de la manche en cours ; aucun historique, aucun compteur.
- Découverte (médiane de 1re apparition, même Rage Level) : les UNCOMMON vers 10-30 manches ; les VERY_RARE vers ~200 (`SLG-A3` 238, `TRP-A5` 208) ; les gags rares de gros gain après 350-2 000 manches.
- Session mixte (1/3 par Rage Level) : **8,5** branches distinctes attendues à 10 manches, **16,6** à 25, **24,0** à 50 (sur 45) ; **2,4 nouvelles** branches attendues entre la 41e et la 50e manche.
- Axes de variation indépendants en plus : réaction de B.B. (pool de la classe) et caméo de COO (gains), tirés sur leurs propres flux ; la variante complète est enregistrée par manche (`variant`).

### 6.7 Anti-répétition : étudiée, **non implémentée**
Une anti-répétition « locale » (éviter la branche de la manche précédente) choisirait la présentation à partir de l'**historique du joueur**. Le book seul ne suffirait plus à reconstruire l'animation : un **replay** (`?replay=…&event=…`) ou une **reprise** après rechargement / changement d'appareil montrerait une autre branche que celle vue en direct. Cela menace le déterminisme actuel : **non implémenté**, conformément à la consigne.

Solution retenue à la place, sans aucun état :
1. **Variété combinatoire** (§6.2) et poids de rareté (§6.6) : la répétition immédiate devient rare sans mémoire.
2. **Axes indépendants** (réaction, caméo) : même branche ≠ même variante.
3. **Mesure** : probabilité qu'une branche se répète deux manches de suite (Σp²) publiée dans le rapport : perte → perte ≈ 17 %, gain → gain ≈ 20-26 % selon le gadget (surtout les issues les plus fréquentes, où tout répéter est inévitable avec un seul résultat possible).
4. Si le PLAYTEST #2 montre encore une répétition gênante : ajouter du **contenu** (branches, modules) plutôt que de la mémoire. Une variante déterministe possible pour plus tard serait d'écrire l'indice de branche dans le book (math-sdk, Phase 2), jamais de le dériver de l'historique.

### 6.8 APERÇU BOSS FIGHT (PLAYTEST / DEV uniquement)
Fréquence du BOSS FIGHT inchangée (1/150). Bouton **APERÇU BOSS FIGHT** dans l'écran d'accueil du PLAYTEST, l'écran de résultats et le DEV PANEL : joue un BOSS FIGHT complet en **replay local** (échelle et palier tirés localement, identifiant `BF-PREVIEW-…`) **sans mise, sans appel wallet, sans solde modifié** et **sans aucune donnée de playtest** : la manche n'est pas enregistrée et le délai READY → mise suivant est exclu. Vérifié en e2e.

### 6.9 Vitesse générale
Les twists ajoutent des temps forts avant la révélation. Première version de P05-B : manches **+10 % à +24 %** plus longues en moyenne (le SLINGSHOT surtout, à cause de la chaîne BACKFIRE › PHEW › SIP › mug vide). Correction : les modules les plus longs sont **resserrés** (`paced(k, segment)` dans `dsl.ts`, k = 0,6 à 0,85 : SIP, mug vide, attente d'ascenseur, PHEW, calage, fumée, toit…), sans toucher au tronc, aux impacts ni aux réactions.

| Durée moyenne d'une manche (hors BOSS FIGHT) | P05-A | P05-B avant resserrage | P05-B |
|---|---:|---:|---:|
| SLINGSHOT normal / turbo | 3,53 / 2,13 s | 4,38 / 2,61 s | 3,93 / 2,35 s (**+11 % / +10 %**) |
| TRAPDOOR normal / turbo | 4,10 / 2,37 s | 4,51 / 2,60 s | 4,09 / 2,37 s (**0 %**) |
| ROCKET normal / turbo | 4,26 / 2,39 s | 4,94 / 2,79 s | 4,50 / 2,55 s (**+6 % / +7 %**) |

Le supplément restant se place **avant** la révélation (le suspense), la partie après la révélation est un peu plus courte qu'en P05-A. Garde-fou en CI : durée moyenne ≤ P05-A × 1,15 par gadget, en normal et en turbo (`variety.test.ts`, tableau dans `VARIETY_REPORT.md`). Le PLAYTEST #2 (Q4) dira si les +0,4 s du SLINGSHOT se sentent ; sinon, le levier suivant est de resserrer encore la chaîne du mug.

### 6.10 Validation (P05-B)
- Tests unitaires : 66 (dont `variety.test.ts` : audit de prévisibilité, qui échoue si un préfixe devient trop révélateur, et garde-fou de vitesse). e2e : 14 (PLAYTEST 50 avec Q7 et « pas rencontré », aperçu BOSS FIGHT sans appel wallet).
- Chaque branche : un seul reveal, anims du manifeste, tronc neutre identique, d1 commun, sélection reproductible (même graine → même variante, y compris en replay).
