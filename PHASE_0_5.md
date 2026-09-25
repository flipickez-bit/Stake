# PHASE 0.5 — Playtest et game feel

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**
> Une seule question : **BAD BOSS est-il déjà satisfaisant à jouer avec des placeholders ?**
> On ne compense pas un manque de fun par des fonctionnalités. Autoplay : **hors Phase 0.5** (descendu dans les priorités).

## Périmètre gelé (validé en Phase 0, pas de restructuration sans raison)
Architecture générale · Svelte 5 + PixiJS 8 + TypeScript · `RgsPort` · Mock RGS · adaptateur Stake isolé · GameFlow · système déterministe · cosmetic seed · DEV PANEL · 3 Rage Levels · 3 gadgets MVP · reprise / replay · budgets techniques.

## État des critères de fin

| # | Critère | État |
|---|---|---|
| 1 | Au moins un PLAYTEST 50 humain terminé | ⏳ **En attente de vous** (outil prêt, préversion publiée) |
| 2 | Plusieurs sessions si possible | ⏳ En attente (chaque testeur exporte sa session) |
| 3 | Questionnaire final | ✅ Outil prêt (6 affirmations 1-5 + champ libre, à la fin uniquement). Réponses : en attente |
| 4 | Deuxième branche LOSS par gadget | ⏸ **Volontairement après le premier playtest** (directions comiques notées ci-dessous) |
| 5 | Cadrage portrait amélioré | ✅ `docs/phase05/portrait/compare-*.jpg` (avant / après) |
| 6 | LOOP x500 analysé | ✅ `docs/generated/LOOP_X500.md` (voir §4) |
| 7 | Aucun nouveau problème critique de GameFlow | ✅ à ce stade (tests unitaires et e2e verts) ; à reconfirmer après les playtests |

## 1. Protocole PLAYTEST 50 (pour chaque testeur)

1. Ouvrir la préversion (de préférence **sur téléphone**, son activé). Ne pas ouvrir le DEV PANEL.
2. Toucher **PLAYTEST** en haut, puis **Commencer** (le solde fictif revient à $1,000.00, aucun résultat n'est forcé).
3. Jouer **50 manches** librement : Rage Levels, mise, vitesse, skip. **Aucune question pendant la partie.**
4. Après la 50e manche : **6 affirmations** notées de 1 à 5 et un champ facultatif, puis **Copier les résultats** (ou **Enregistrer le fichier**) et me transmettre le texte ou le fichier.
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
| (session) | version du contenu, taille d'écran, tactile, DEV PANEL ouvert pendant la session, réponses, manches après la 50e |

Questionnaire (1 = pas du tout d'accord, 5 = tout à fait d'accord) :
1. J'avais envie de connaître le résultat après avoir lancé le gadget.
2. Les trois Rage Levels m'ont semblé différents.
3. Les animations de perte restaient amusantes.
4. Les manches m'ont semblé suffisamment rapides.
5. Les gros résultats semblaient réellement spéciaux.
6. J'aurais volontairement lancé une 51e manche.

Champ facultatif : « Quel moment t'a le plus marqué ? »

Agrégation : `node tools/playtest-report.mjs exports/*.json --markdown docs/generated/PLAYTEST_REPORT.md` (moyennes des 6 questions, commentaires, métriques par Rage Level, hésitation selon le résultat précédent, usage de turbo / skip, BOSS FIGHT, manches après la 50e).

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

## 5. Deuxième branche LOSS par gadget (APRÈS le premier playtest)

Directions comiques retenues (à adapter à l'architecture actuelle, sans système lourd) :
- **SWIVEL SLINGSHOT — BACKFIRE** : le mécanisme part dans le mauvais sens ; B.B. croit être touché ; petit silence ; il ouvre les yeux, intact ; derrière lui, quelque chose est complètement détruit ; LE SIP ; x0.
- **TRAPDOOR EXPRESS — TEASE** : la trappe s'ouvre, B.B. tombe, on croit que c'est fini ; sa cravate se coince au bord ; il reste suspendu ; Wendell vient aider et, après une courte tension, le remonte par accident ; B.B. remet sa cravate ; LE SIP ; x0.
- **OFFICE ROCKET — WENDELL CEILING** : la fusée cale ; B.B. provoque le joueur ; redémarrage brutal ; énorme fumée, on ne sait pas ce qui s'est passé ; la fumée se dissipe : B.B. est tranquillement derrière son bureau, Wendell collé au plafond ; B.B. lève les yeux ; LE SIP ; x0.

Règle : **aucune modification des probabilités mathématiques.** Les nouvelles branches se partagent les résultats x0 existants par la logique déterministe prévue : sélection parmi les branches compatibles (script du book × classe × rareté, puis `seed % n`). Chaque nouvelle branche portera un `d1` identique au tronc actuel (non-révélation) et sera couverte par les tests existants (un seul reveal, anims du manifeste, tronc neutre, graine).
