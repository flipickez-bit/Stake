# ÉTUDE DE FAISABILITÉ : CHOIX ENTRE 3 GADGETS (A / B / C) PAR RAGE LEVEL

> **Statut : étude seulement.** Aucun code de jeu n'a été écrit ou modifié, et aucune donnée mathématique, aucun Rage Level, aucune probabilité ni aucune animation n'a changé. Vous déciderez si cette mécanique remplace le modèle actuel.
> Date : 2026-09-27. La proposition précédente des « 9 profils mathématiques indépendants » est **abandonnée** (STOP).

**Légende**
- ✅ : vérifié dans une source citée.
- 🟡 : partiellement vérifié (exemple du web-sdk, non contractuel).
- ❓ : **INFORMATION STAKE ENGINE REQUISE**.

**Sources**
- `docs/STAKE_ENGINE_FAITS_VERIFIES.md`, noté « faits §n » ou « Qn ».
- math-sdk officiel, commit `a6dccd8` du 2026-09-22 :
  - `docs/rgs_docs/RGS.md` ;
  - `docs/math_docs/gamestate_section/configuration_section/betmode_overview.md` ;
  - `docs/math_docs/gamestate_section/events_info.md`.
- web-sdk, commit `1843d60`.
- `config/rage_levels.json` et `math/model/bad_boss_math.py` (distributions actuelles, non modifiées).

**Méthode**
- Tous les RTP, probabilités et fréquences sont **exacts** : fractions rationnelles construites à partir de `build()` du calculateur existant.
- Les simulations (§5–9) ne servent que de contrôle.
- Les scripts d'analyse sont jetables et **non versionnés**, conformément à la consigne « ne code rien ». Je peux les ajouter sous `math/` si vous le souhaitez.

---

## 0. Verdict en bref

1. **La mécanique est faisable sur Stake Engine, sous une seule forme vérifiée : l'architecture A2.**
   - Le gadget choisi est un **mode** de `Play`, envoyé **avant** le tirage.
   - Chaque book contient le **triple complet** (A, B, C).
   - Les 3 modes d'un Rage Level partagent les **mêmes ids**, les **mêmes poids** et le **même triple**. Seul `payoutMultiplier` change : c'est la composante choisie.
   - Cela fait **9 modes** (3 niveaux × 3 gadgets).
2. **Un choix fait après `Play` est impossible et dangereux.**
   - Impossible : le gain est figé au tirage.
   - Dangereux : un client modifié qui verrait le triple avant de choisir obtiendrait un RTP de **207 % à 273 %**.
3. **Le RTP vaut exactement 96,5 %** pour toute stratégie qui ne voit pas le triple : toujours A, toujours B, toujours C, aléatoire, alternance, « suivre le dernier gagnant »…
   - L'écart-type par manche est **inchangé** (2,685 / 6,672 / 11,585).
   - Les profils de volatilité des Rage Levels sont **conservés**.
4. **Le regret est structurel.**
   - Si l'on montre tout, **34 % des manches GRUMPY** sont « j'ai perdu, une autre option gagnait », soit 82 % des pertes.
   - On ne peut réduire ce chiffre qu'en augmentant la fréquence des « trois pertes » (identité exacte, §10).
5. **Modèle recommandé : indépendant, avec le BOSS FIGHT commun à la manche** (§2.6).
   - Il est simple à énoncer et neutre.
   - Il supprime le « BOSS FIGHT manqué », qui arriverait sinon 1 manche sur 76.
   - Il réduit la taille des books.
6. **UX : je ne tranche pas pour REVEAL ALL.**
   - Je recommande **PRIVATE par défaut**, avec une **révélation à la demande, inconditionnelle**.
   - REVEAL ALL ne viendrait qu'après un playtest et une validation de conformité.
   - **Une révélation sélective** (par exemple « seulement quand une autre option a gagné gros ») est **interdite**.
7. **Avant tout développement**, Stake doit répondre aux 9 questions du §19.3 : 9 modes à coût 1,0, ids et poids partagés, affichage de résultats non joués, replay, indépendance du tirage vis-à-vis du mode, provably fair, etc.
8. **Coût de contenu : 9 gadgets au lieu de 3**, soit 6 nouveaux gadgets et leurs branches. Rien n'est commencé.

---

## 1. Architecture possible avec Stake Engine

### 1.1 Faits qui contraignent la mécanique

| Fait | Statut | Source |
|---|---|---|
| Les résultats sont des books statiques précalculés, un fichier par mode | ✅ | faits §1 ; RGS.md |
| Le RGS tire un book **proportionnellement à son poids** dans la table du mode, lors de `/wallet/play` | ✅ | faits §1 |
| `play` = `{sessionID, amount, mode}` ; débit = mise × coût du mode | ✅ | RGS.md (« Player debit amount = Base bet amount × Bet mode cost multiplier ») |
| **Un seul** `payoutMultiplier` entier par book, identique dans le CSV, contrôlé par hash | ✅ | RGS.md (« We require the payoutMultiplier value in the third column to exactly match… ») |
| **Aucune décision en cours de manche ne peut changer le gain** | ✅ (conséquence) | faits §1 |
| `events` est libre. « Anything not contained within or implied by the events cannot be shown to the player » | ✅ | events_info.md |
| `/bet/event` : « Tracks in-progress player actions during a round. Useful for resuming gameplay… » ; aucun effet sur le gain n'est décrit | ✅ existence / ❓ contrat | RGS.md ; Q10 |
| `meta` dans `play` | 🟡 / ❓ | Q11 |
| Poids du CSV en **uint64** | ✅ | RGS.md |
| Plusieurs modes dans `index.json` | ✅ | RGS.md |
| Écart de RTP entre modes ≤ 0,05 ; limites « 3-star » | ✅ (SDK) | faits §2 |
| `is_feature` : le front conserve le mode d'une manche à l'autre sans confirmation | ✅ (doc SDK) | betmode_overview.md |
| **Aucun mécanisme provably fair** (graines, engagement, nonce) n'est documenté pour les jeux Stake Engine | ✅ absence dans les sources consultées ; ❓ existence ailleurs | recherche « provabl » dans math-sdk et web-sdk : 0 résultat |
| Replay `GET /bet/replay/{game}/{version}/{mode}/{event}` | 🟡 / ❓ | faits §7 ; Q6 |
| `round` contient `mode`, `event`, `state` | 🟡 | faits §4 |

**Conséquence directe : le joueur ne peut influencer son gain qu'à un seul moment, le choix du mode avant `Play`.** Un choix réel doit donc être encodé dans le mode.

### 1.2 Architecture A : un book contient resultA / resultB / resultC

#### A1 : choix APRÈS `Play` (le client reçoit le triple, puis choisit). ❌ REJETÉE

- **Gain** : le `payoutMultiplier` du book est unique et figé au tirage, il ne peut pas dépendre d'un choix fait ensuite. Il reste deux possibilités :
  - le gain ignore le choix : c'est un choix factice, donc un faux « what if » ;
  - le RGS calcule le gain à partir d'un événement joueur : **non supporté** d'après les sources (❓ si Stake le propose ailleurs).
- **Sécurité** : le triple arrive avant le choix, donc un client modifié choisit toujours le maximum. Son RTP devient **207,0 % / 250,1 % / 273,3 %** (GRUMPY / FURIOUS / UNHINGED, E[max] exact). C'est rédhibitoire.
- **Reprise** : il faudrait mémoriser un choix en cours de manche (`/bet/event`, ❓).

#### A2 : choix = MODE avant `Play`, book triple partagé. ✅ RETENUE (sous réserve de §19.3)

**Principe**
- **9 modes à coût 1,0** : `grumpy_a`, `grumpy_b`, `grumpy_c`, `furious_a`, …, `unhinged_c` (❓ acceptation, Q21).
- Pour un Rage Level, les trois fichiers de books et les trois CSV ont :
  - **les mêmes ids** ;
  - **les mêmes poids** ;
  - **le même bloc `triple`**, octet pour octet.
- Seuls `payoutMultiplier`, l'événement `pick` et `finalWin` changent : ils suivent la composante du gadget choisi.
- **Déroulé d'une manche**
  1. Le joueur choisit A, B ou C sans voir de multiplicateur.
  2. Le client envoie `play {mode: "grumpy_b"}`.
  3. Le RGS tire un id dans une table **identique quel que soit le choix**.
  4. Le book renvoyé contient les trois résultats.
  5. B est payé et animé ; A et C sont révélés ou non, selon l'UX (§17).

**Pourquoi ce n'est pas un faux « what if »**
- Chaque triple existe **dans un fichier statique, publié et haché avant toute manche**. Le RGS ne fabrique rien.
- La loi du triple tiré est **la même quel que soit le choix**, puisque les tables sont identiques. Le choix ne peut donc pas influencer les alternatives.
- Un auditeur peut le vérifier mécaniquement (§16) :
  - ids et poids identiques dans les 3 CSV ;
  - bloc `triple` identique dans les 3 books ;
  - `payoutMultiplier` égal à la composante choisie.

**Limite honnête**
- Le tirage a lieu **après** la réception du mode. La pré-sélection est donc **distributionnelle** (la table est figée avant), pas **individuelle** : le joueur ne peut pas prouver que *ce* triple précis était fixé avant son clic.
- Si le RGS utilise le même nombre aléatoire quel que soit le mode, les tables étant identiques, le même id aurait été tiré avec A, B ou C. La phrase « si vous aviez choisi B, vous auriez gagné x5 » serait alors vraie au sens fort. ❓ **INFORMATION STAKE ENGINE REQUISE** (Q23).
- Sans cette confirmation, les règles doivent rester au sens faible : *« Les trois résultats sont tirés ensemble, dans une table identique quel que soit votre choix. »* La révélation affiche « B : x5 », sans « vous auriez gagné ».

**Rôle du client**
- Il ne fait qu'envoyer le mode.
- Il reçoit le triple **après** le verrouillage du choix. Le connaître à ce moment ne donne aucun avantage : chaque manche est un tirage indépendant, sans report d'information vers la suivante.

### 1.3 Architecture B : le choix est un paramètre de `Play`, le serveur ne détermine que le résultat choisi

- **Forme** : 3 modes par niveau à books à résultat unique, ou un seul mode avec le choix transmis dans `meta` (❓ Q11).
- **Conséquence mathématique** :
  - si les trois modes d'un niveau ont la même distribution, **le choix n'a aucune conséquence** (même loi, tirages indépendants) : il est cosmétique ;
  - si leurs distributions diffèrent, on retombe sur les « 9 profils » abandonnés.
- **Aucune alternative ne peut être montrée.** Une manche jouée avec A ne contient pas de « résultat de B ». Afficher « B cachait x5 » serait une invention, donc interdit.
- **UX** : compatible avec PRIVATE uniquement.
- **Books** : inchangés dans leur contenu, avec ×3 fichiers en modes ou ×1 avec `meta`.
- **Replay** : il doit connaître le gadget choisi. C'est le cas avec le mode (présent dans l'URL, 🟡), pas encore garanti avec `meta` (❓).

### 1.4 Architecture C : autres pistes examinées

| Piste | Supportée ? | Verdict |
|---|---|---|
| **C1.** Manche à décision : `Play`, puis choix enregistré par `/bet/event`, gain selon le choix | Non. `/bet/event` sert à la reprise et le gain est figé au tirage (✅). Un gain dépendant d'un événement joueur n'est documenté nulle part (❓) | ❌ choix factice |
| **C2.** « Pick » cosmétique classique : le prix est dans le book, la case choisie l'affiche, les autres cases sont remplies ensuite | Oui, techniquement | ❌ c'est **exactement le faux « what if » interdit** si les autres cases sont montrées. Acceptable seulement en PRIVATE (= B) |
| **C3.** Engagement cryptographique : hash du triple montré avant le choix, dévoilé après | Non documenté pour Stake Engine (✅ absence) | ❓ Q25. Ce serait la seule **vraie pré-sélection individuelle** |
| **C4.** Un seul mode par niveau, choix dans `meta` de `play` | `meta` ❓. Même accepté, le `payoutMultiplier` du book ne peut pas en dépendre | ❌ pour un choix réel. Utilisable pour enregistrer un choix **cosmétique** (B) |
| **C5.** Pré-tirage : le triple de la manche N+1 livré dans le book de la manche N | Non : chaque `Play` tire un book indépendant et on ne peut pas forcer le suivant | ❌ |
| **C6.** Mode « feature » persistant (`is_feature = true`) | ✅ (doc SDK) | Pas une architecture en soi : option d'A2 ou de B pour conserver le gadget d'une manche à l'autre (autoplay) |

→ Aucune piste C officiellement supportée ne fait mieux qu'A2. C3 serait supérieure en vérifiabilité si Stake l'offrait.

### 1.5 Comparaison des architectures

| Critère | A1 (choix après Play) | **A2 (choix = mode, triple partagé)** | B (choix = mode, résultat unique) | C3 (engagement, si offert) |
|---|---|---|---|---|
| **Sécurité** | ❌ le client voit le triple avant de choisir (RTP 207–273 %) | ✅ choix verrouillé côté serveur avant le tirage ; triple visible seulement après | ✅ | ✅ |
| **Alternatives réelles** | factices ou exploitables | ✅ pré-sélection distributionnelle | ❌ aucune | ✅ pré-sélection individuelle |
| **Provably fair** | ❌ | 🟡 audit statique complet ; pas de preuve par manche (❓ Q23, Q25) | 🟡 audit statique | ✅ ❓ |
| **math-sdk** | books non standard | ✅ format standard (`id`, `events`, `payoutMultiplier`) ; génération des books sur mesure ; contrôles SDK par mode inchangés | ✅ | ❓ |
| **Books** | 1 fichier par niveau | 3 fichiers par niveau (9 au total), à triples | 3 (ou 1) par niveau | ❓ |
| **RGS** | ❌ gain dépendant d'un choix fait après le tirage | ✅ `play` standard | ✅ | ❓ |
| **Replay** | ❓ | ✅ mode + id → triple et choix (🟡 contrat, Q6) | ✅ si choix = mode | ❓ |
| **Resume** | ❓ (`/bet/event`) | ✅ `round.mode` + `round.state` ; aucun nouveau choix possible | ✅ | ❓ |
| **RTP** | non maîtrisable | 96,5 % pour toute stratégie non informée | 96,5 % | 96,5 % |
| **Taille des books** | — | nombre minimal de books n → n³ (≈ ×49 à ×67 avec BF commun) ; ≈ ×2,8 octets par book ; ×3 fichiers | ×1 à ×3 fichiers | ❓ |
| **Compatibilité Stake** | ❌ | ✅ sur les faits vérifiés ; ❓ 9 questions (§19.3) | ✅ (❓ 9 modes) | ❓ |

---

## 2. Modèle mathématique possible

### 2.1 Principe

Pour chaque Rage Level, on définit une **loi jointe** P(A = a, B = b, C = c) qui respecte trois règles.

1. **Marginales exactes.** Les lois de A, de B et de C sont **chacune exactement la distribution actuelle du niveau** (`config/rage_levels.json`) : même RTP de 96,5 %, même hit rate, mêmes multiplicateurs, même BOSS FIGHT 1/150 avec la même échelle.
2. **Échangeabilité.** P(a, b, c) ne change pas quand on permute les positions. Aucune position n'est privilégiée : les positions gagnantes sont **distribuées équitablement**.
3. **Loi statique.** La loi est écrite dans les books avant publication et ne dépend de rien d'autre (historique, collection, pertes, gadget le plus joué…). Sur Stake Engine, c'est garanti par construction : books et poids sont figés et hachés, et le RGS n'a aucun état joueur qui pourrait les modifier.

### 2.2 Conséquence : le RTP est invariant (preuve)

- Soit S le choix du joueur à la manche t. S peut dépendre de tout le passé (historique, collection, humeur…).
- En revanche, S ne peut pas dépendre du triple de la manche t, qui est tiré après le choix, indépendamment du choix et du passé.
- Alors :

  **E[gain] = Σ_s P(S = s) · E[X_s] = Σ_s P(S = s) · 0,965 = 0,965.**

- Seul un joueur qui **verrait le triple avant de choisir** changerait le RTP (l'« oracle » des §5–9).
- D'où une règle de sécurité absolue : **le triple n'est jamais disponible avant le verrouillage du choix.** En A2, il n'existe tout simplement pas avant `Play`.

### 2.3 Types de manche (vos exemples), modèle recommandé

Probabilités exactes dans le modèle « indépendant + BOSS FIGHT commun » (§2.6), pour la manche exacte indiquée. La dernière colonne additionne toutes les permutations de positions du même motif.

| Type | A | B | C | GRUMPY | FURIOUS | UNHINGED | Même motif, toutes positions (G / F / U) |
|---|---|---|---|---|---|---|---|
| ROUND TYPE 1 | x0 | x0 | x2 | 1,243 % (1/80) | 3,921 % (1/26) | 3,253 % (1/31) | 3,73 % / 11,76 % / 9,76 % |
| ROUND TYPE 2 | x5 | x0 | x0 | 0,284 % (1/352) | 0,904 % (1/111) | 1,157 % (1/86) | 0,85 % / 2,71 % / 3,47 % |
| ROUND TYPE 3 | x0 | x10 | x0 | 0,089 % (1/1 126) | 0,361 % (1/277) | 0,578 % (1/173) | 0,27 % / 1,08 % / 1,74 % |
| ROUND TYPE 4 | x2 | x5 | x0 | 0,048 % (1/2 105) | 0,118 % (1/851) | 0,062 % (1/1 623) | 0,29 % / 0,71 % / 0,37 % |
| ROUND TYPE 5 | x0 | x0 | x0 | 7,43 % (1/13) | 30,17 % (1/3) | 61,06 % (1/2) | idem |

- **Équité des positions (vérifiée exactement)** : chaque permutation d'un motif a **la même probabilité**. Par exemple, (x5, x0, x0), (x0, x5, x0) et (x0, x0, x5) valent chacune 0,284 % en GRUMPY.
- **Autres types, par nombre k de gadgets gagnants** : « trois gagnants » (k = 3) et « BOSS FIGHT de manche » (les trois positions portent le même BOSS FIGHT, 1/150). Leurs fréquences sont au §2.4.

### 2.4 Le seul vrai réglage : comment les gains sont groupés

Les marginales étant fixées, la liberté restante est la **distribution du nombre k de positions gagnantes** (q0, q1, q2, q3).
- **Contrainte** : q1 + 2·q2 + 3·q3 = 3·h, où h est le hit rate du niveau.
- **Identité exacte** : **P(perdre alors qu'une autre option gagnait) = (1 − h) − q0.**
  - Ce regret est donc fixé par la fréquence des « trois pertes ».
  - Pour le baisser, il faut augmenter les « trois pertes », et réciproquement.

**Modèles étudiés** (tous ont exactement les marginales actuelles, donc un RTP de 96,5 % par position)

| Modèle | Définition |
|---|---|
| **INDÉPENDANT** | trois tirages indépendants dans la table du niveau |
| **CORRÉLÉ ρ** | avec la probabilité ρ, gain ou perte commun aux trois positions (montants indépendants) ; sinon, indépendant. ρ = 3/5, 2/5 et 1/5 sont pris pour illustration |
| **TOUT-OU-RIEN** (ρ = 1) | gain ou perte commun aux trois positions ; seuls les montants diffèrent |
| **UN SEUL GAGNANT** | au plus une position gagnante. Impossible en GRUMPY (h = 58 % > 1/3) |
| **INDÉPENDANT + BF COMMUN** | le BOSS FIGHT appartient à la manche (1/150, même palier pour A, B et C) ; hors BOSS FIGHT, trois tirages indépendants dans la table de base |

**Distribution de k** (en %, pour k = 0 / 1 / 2 / 3 gagnants, « gagnant » = paiement > 0)

| Modèle | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| INDÉPENDANT | 7,3 / 30,6 / 42,4 / 19,7 | 29,8 / 44,4 / 22,1 / 3,7 | 60,3 / 33,3 / 6,1 / 0,4 |
| CORRÉLÉ (ρ = 3/5 · 2/5 · 1/5) | 28,1 / 12,2 / 17,0 / 42,7 | 44,6 / 26,7 / 13,3 / 15,5 | 65,1 / 26,6 / 4,9 / 3,4 |
| TOUT-OU-RIEN | 41,9 / 0 / 0 / 58,1 | 66,8 / 0 / 0 / 33,2 | 84,5 / 0 / 0 / 15,5 |
| UN SEUL GAGNANT | impossible | 0,3 / 99,7 / 0 / 0 | 53,4 / 46,6 / 0 / 0 |
| **INDÉPENDANT + BF COMMUN** | **7,4 / 30,6 / 42,0 / 19,9** | **30,2 / 44,1 / 21,5 / 4,2** | **61,1 / 32,3 / 5,7 / 1,0** |

### 2.5 Interdits : pourquoi ils sont impossibles dans A2

| Interdit | Garantie |
|---|---|
| Gadget « chaud » | Les poids sont identiques et invariants par permutation (contrôle automatique, §16). Les books sont statiques |
| Adaptation selon l'historique | Le RGS tire avec des poids figés ; aucun book ne peut changer entre deux manches (fichiers hachés) |
| Favoriser le gadget le moins joué, punir le préféré | Les mathématiques ignorent ce qu'a joué le joueur. Le mode choisi ne sélectionne qu'une composante d'un triple dont la loi ne dépend pas du mode |
| Changer selon la collection | La collection est un observateur côté client, déjà isolé par un test d'architecture (`TECH_ARCHITECTURE.md` §3.7). Elle n'a aucun accès au RGS |
| Changer selon les pertes précédentes | Même garantie que l'historique |
| Indice côté client | Le client n'affiche aucun multiplicateur, aucune statistique « B a gagné 5 fois de suite », aucune mise en avant. Seule entrée : le mode. Seul contenu : la présentation du résultat déjà fixé (invariant I4) |

### 2.6 Modèle recommandé : INDÉPENDANT + BOSS FIGHT COMMUN

**Texte de règle proposé** :
> *« Chaque gadget a son propre résultat, tiré indépendamment dans la même table que les deux autres. Le BOSS FIGHT appartient à la manche : s'il se déclenche, il se déclenche quel que soit le gadget choisi, avec le même résultat. Aucun gadget n'a plus de chances qu'un autre, et rien ne dépend des manches précédentes. »*

**Pourquoi**
- **Neutre** : aucun réglage du regret, ni à la hausse ni à la baisse. Il est aussi le plus simple à énoncer et à vérifier.
- **Supprime le contrefactuel le plus frustrant**, le « BOSS FIGHT manqué ». En modèle indépendant pur, il arrive **1 manche sur 76**, et le BOSS FIGHT est le moment phare du jeu.
- **Réduit les gros multiplicateurs non choisis** :
  - ≥ x100 : 0 au lieu de 1/2 646 en GRUMPY, 1/1 251 au lieu de 1/649 en FURIOUS, 1/563 au lieu de 1/317 en UNHINGED ;
  - voir §12.
- **Réduit les books** : 735 / 1 008 / 1 340 triples distincts au lieu de 3 375 / 5 832 / 8 000.
- **Poids entiers exacts en uint64** pour GRUMPY et FURIOUS (§14).

**Coûts**
- Pendant un BOSS FIGHT (1/150), le choix ne change rien.
- En REVEAL ALL, le regret de GRUMPY reste élevé (§10).

**Si REVEAL ALL est retenu** et que le playtest montre trop de frustration, on peut passer à un modèle corrélé, **fixé avant publication et jamais réglé à la hausse du regret**. Tout modèle corrélé est plus difficile à expliquer dans les règles.

---

## 3. Exemple de book entry (A2, modèle recommandé, GRUMPY)

**Manche : A = x0, B = x5, C = x0. Le joueur a choisi B.**

Le même id `48213` existe dans les trois fichiers. Le **bloc `triple` est identique octet pour octet** ; seuls `payoutMultiplier`, `pick` et `finalWin` changent.

`books_grumpy_b.jsonl.zst` (ligne décompressée) :
```json
{"id": 48213, "payoutMultiplier": 500, "events": [
  {"type": "triple", "level": "grumpy", "model": "IND_BFC_v1", "seed": 2718281828, "results": [
    {"slot": "A", "gadget": "SWIVEL_SLINGSHOT", "payoutMultiplier": 0,   "script": "CLEAN_MISS"},
    {"slot": "B", "gadget": "GADGET_G_B",       "payoutMultiplier": 500, "script": "DIRECT"},
    {"slot": "C", "gadget": "GADGET_G_C",       "payoutMultiplier": 0,   "script": "BACKFIRE"}]},
  {"type": "pick", "slot": "B"},
  {"type": "presentation", "slot": "B", "script": "DIRECT", "rarity": "common", "seed": 2718281828},
  {"type": "finalWin", "amount": 500}]}
```
`books_grumpy_a.jsonl.zst` : même ligne, avec `"payoutMultiplier": 0`, `{"type": "pick", "slot": "A"}`, présentation du slot A et `finalWin` 0.
`books_grumpy_c.jsonl.zst` : idem avec C.

Lookup tables (`id, poids, payoutMultiplier`). Le poids est **exact** : il vient d'un total de 46 035 993 600 000 000 (PPCM des dénominateurs, 56 bits) :
```
lookUpTable_grumpy_a.csv : 48213,130807214259840,0
lookUpTable_grumpy_b.csv : 48213,130807214259840,500
lookUpTable_grumpy_c.csv : 48213,130807214259840,0
```
- Probabilité de ce triple : 22 709 585 809 / 7 992 360 000 000 ≈ 0,284 %.
- La présentation de chaque gadget (script, graine) est **déjà dans le triple**. Ce que le joueur aurait vu avec A ou C est donc fixé avant son choix, pas seulement le multiplicateur.

`index.json` (extrait) :
```json
{"modes": [
  {"name": "grumpy_a", "cost": 1.0, "events": "books_grumpy_a.jsonl.zst", "weights": "lookUpTable_grumpy_a.csv"},
  {"name": "grumpy_b", "cost": 1.0, "events": "books_grumpy_b.jsonl.zst", "weights": "lookUpTable_grumpy_b.csv"},
  {"name": "grumpy_c", "cost": 1.0, "events": "books_grumpy_c.jsonl.zst", "weights": "lookUpTable_grumpy_c.csv"},
  "… furious_a/b/c, unhinged_a/b/c …"]}
```

**BOSS FIGHT commun** (UNHINGED, palier x250 : 6 attaques HIT puis BLOCKED). Le triple porte le même résultat dans les trois positions, et l'événement `bossFight` est commun. Poids arrondi sur un total de 2^62 (voir §14) : `838923332827172`, soit une probabilité exacte de 14 553 / 80 000 000.
```json
{"type": "triple", "level": "unhinged", "model": "IND_BFC_v1", "seed": 99, "bossFight": true, "results": [
  {"slot": "A", "gadget": "ROCKET",     "payoutMultiplier": 25000, "script": "BF_ENTRY"},
  {"slot": "B", "gadget": "GADGET_U_B", "payoutMultiplier": 25000, "script": "BF_ENTRY"},
  {"slot": "C", "gadget": "GADGET_U_C", "payoutMultiplier": 25000, "script": "BF_ENTRY"}]},
{"type": "bossFight", "rungs100": [500,1000,2500,5000,10000,25000,50000,100000,500000],
 "attacks": [{"result":"HIT","variant":2},{"result":"HIT","variant":0},{"result":"HIT","variant":1},
             {"result":"HIT","variant":3},{"result":"HIT","variant":0},{"result":"HIT","variant":2},
             {"result":"BLOCKED","variant":1}], "ko": false}
```
Ce format prolonge le format v3 actuel (`TECH_ARCHITECTURE.md` §3.4). Le nom des 6 nouveaux gadgets est volontairement neutre (`GADGET_G_B`…).

---

## 4. Exemple de 20 manches A/B/C

**Méthode (aucune sélection)**
- Ce sont les **20 premiers tirages** d'une graine fixe (20260927), dans le modèle recommandé.
- Le choix du joueur est un tirage uniforme, sur une graine séparée (20260928).
- La colonne « lecture » dit ce que le joueur comprendrait **si** tout était révélé.
- « gagnants » = nombre de positions à paiement > 0. Aucun BOSS FIGHT n'est sorti dans ces 20 tirages (attendu : 1/150).

### GRUMPY
| # | A | B | C | gagnants | choix | payé | lecture en REVEAL ALL |
|---|---|---|---|---|---|---|---|
| 1 | x2 | x0 | x0.5 | 2 | C | **x0.5** | gain, une autre option avait davantage |
| 2 | x0 | x0 | x1.2 | 1 | C | **x1.2** | gain, meilleur choix ou ex æquo |
| 3 | x0 | x1.2 | x0.5 | 2 | B | **x1.2** | gain, meilleur choix ou ex æquo |
| 4 | x3 | x0 | x0 | 1 | C | **x0** | perte, une autre option gagnait |
| 5 | x0.5 | x2 | x2 | 3 | A | **x0.5** | gain, une autre option avait davantage |
| 6 | x1.2 | x0 | x1.5 | 2 | A | **x1.2** | gain, une autre option avait davantage |
| 7 | x0.5 | x0 | x0 | 1 | A | **x0.5** | gain, meilleur choix ou ex æquo |
| 8 | x0.5 | x0 | x0 | 1 | B | **x0** | perte, une autre option gagnait |
| 9 | x0 | x0.5 | x0.5 | 2 | B | **x0.5** | gain, meilleur choix ou ex æquo |
| 10 | x0.5 | x0.5 | x3 | 3 | C | **x3** | gain, meilleur choix ou ex æquo |
| 11 | x0 | x0.5 | x0 | 1 | A | **x0** | perte, une autre option gagnait |
| 12 | x1.2 | x1.2 | x0 | 2 | C | **x0** | perte, une autre option gagnait |
| 13 | x0 | x0.5 | x0 | 1 | B | **x0.5** | gain, meilleur choix ou ex æquo |
| 14 | x2 | x2 | x1.2 | 3 | C | **x1.2** | gain, une autre option avait davantage |
| 15 | x0 | x1.5 | x0 | 1 | A | **x0** | perte, une autre option gagnait |
| 16 | x0.5 | x0.5 | x0.5 | 3 | B | **x0.5** | gain, meilleur choix ou ex æquo |
| 17 | x1.2 | x0 | x0.5 | 2 | A | **x1.2** | gain, meilleur choix ou ex æquo |
| 18 | x0 | x0.5 | x0.5 | 2 | B | **x0.5** | gain, meilleur choix ou ex æquo |
| 19 | x1.5 | x0 | x2 | 2 | C | **x2** | gain, meilleur choix ou ex æquo |
| 20 | x1.5 | x0 | x0 | 1 | C | **x0** | perte, une autre option gagnait |

Total payé : x14,5 pour 20 mises. Répartition : 10 « meilleur choix », 4 « une autre avait davantage », 6 « perte, une autre gagnait », 0 « trois pertes » (attendu : 7,3 / 4,3 / 6,9 / 1,5 sur 20).

### FURIOUS
| # | A | B | C | gagnants | choix | payé | lecture en REVEAL ALL |
|---|---|---|---|---|---|---|---|
| 1 | x0 | x0 | x0.5 | 1 | C | **x0.5** | gain, meilleur choix ou ex æquo |
| 2 | x0 | x0 | x5 | 1 | C | **x5** | gain, meilleur choix ou ex æquo |
| 3 | x0 | x3 | x0.5 | 2 | B | **x3** | gain, meilleur choix ou ex æquo |
| 4 | x0 | x0 | x0 | 0 | C | **x0** | trois pertes |
| 5 | x0.5 | x0 | x0 | 1 | A | **x0.5** | gain, meilleur choix ou ex æquo |
| 6 | x3 | x0 | x0 | 1 | A | **x3** | gain, meilleur choix ou ex æquo |
| 7 | x0.5 | x0 | x0 | 1 | A | **x0.5** | gain, meilleur choix ou ex æquo |
| 8 | x1.5 | x0 | x0 | 1 | B | **x0** | perte, une autre option gagnait |
| 9 | x0 | x1.5 | x1.5 | 2 | B | **x1.5** | gain, meilleur choix ou ex æquo |
| 10 | x0.5 | x1.5 | x0 | 2 | C | **x0** | perte, une autre option gagnait |
| 11 | x0 | x1.5 | x0 | 1 | A | **x0** | perte, une autre option gagnait |
| 12 | x5 | x2 | x0 | 2 | C | **x0** | perte, une autre option gagnait |
| 13 | x0 | x0.5 | x0 | 1 | B | **x0.5** | gain, meilleur choix ou ex æquo |
| 14 | x0 | x0 | x3 | 1 | C | **x3** | gain, meilleur choix ou ex æquo |
| 15 | x0 | x0 | x0 | 0 | A | **x0** | trois pertes |
| 16 | x1.5 | x0.5 | x1.5 | 3 | B | **x0.5** | gain, une autre option avait davantage |
| 17 | x10 | x0 | x0.5 | 2 | A | **x10** | gain, meilleur choix ou ex æquo |
| 18 | x0 | x0.5 | x1.5 | 2 | B | **x0.5** | gain, une autre option avait davantage |
| 19 | x0 | x0 | x0 | 0 | C | **x0** | trois pertes |
| 20 | x0 | x0 | x0 | 0 | C | **x0** | trois pertes |

Total payé : x28,5 pour 20 mises. Répartition : 10 « meilleur choix », 2 « une autre avait davantage », 4 « perte, une autre gagnait », 4 « trois pertes » (attendu : 5,1 / 1,5 / 7,3 / 6,0).

### UNHINGED
| # | A | B | C | gagnants | choix | payé | lecture en REVEAL ALL |
|---|---|---|---|---|---|---|---|
| 1 | x0 | x0 | x2 | 1 | C | **x2** | gain, meilleur choix ou ex æquo |
| 2 | x0 | x0 | x0 | 0 | C | **x0** | trois pertes |
| 3 | x0 | x0 | x1.5 | 1 | B | **x0** | perte, une autre option gagnait |
| 4 | x0 | x0 | x0 | 0 | C | **x0** | trois pertes |
| 5 | x1.5 | x0 | x0 | 1 | A | **x1.5** | gain, meilleur choix ou ex æquo |
| 6 | x0 | x0 | x0 | 0 | A | **x0** | trois pertes |
| 7 | x2 | x0 | x0 | 1 | A | **x2** | gain, meilleur choix ou ex æquo |
| 8 | x5 | x0 | x0 | 1 | B | **x0** | perte, une autre option gagnait |
| 9 | x0 | x10 | x5 | 2 | B | **x10** | gain, meilleur choix ou ex æquo |
| 10 | x2 | x0 | x0 | 1 | C | **x0** | perte, une autre option gagnait |
| 11 | x0 | x3 | x0 | 1 | A | **x0** | perte, une autre option gagnait |
| 12 | x0 | x0 | x0 | 0 | C | **x0** | trois pertes |
| 13 | x0 | x1.5 | x0 | 1 | B | **x1.5** | gain, meilleur choix ou ex æquo |
| 14 | x0 | x0 | x0 | 0 | C | **x0** | trois pertes |
| 15 | x0 | x0 | x0 | 0 | A | **x0** | trois pertes |
| 16 | x0 | x3 | x3 | 2 | B | **x3** | gain, meilleur choix ou ex æquo |
| 17 | x0 | x0 | x2 | 1 | A | **x0** | perte, une autre option gagnait |
| 18 | x0 | x1.5 | x3 | 2 | B | **x1.5** | gain, une autre option avait davantage |
| 19 | x0 | x0 | x0 | 0 | C | **x0** | trois pertes |
| 20 | x0 | x0 | x0 | 0 | C | **x0** | trois pertes |

Total payé : x21,5 pour 20 mises. Répartition : 6 « meilleur choix », 1 « une autre avait davantage », 5 « perte, une autre gagnait », 8 « trois pertes » (attendu : 2,8 / 0,3 / 4,7 / 12,2).

> Sur 20 manches, l'écart au RTP est énorme par nature (x14,5, x28,5 ou x21,5 pour 20 mises) : c'est la volatilité normale de chaque niveau. En REVEAL ALL, **6 manches GRUMPY sur 20** auraient affiché « tu as perdu, une autre option gagnait ».

---

## 5–9. RTP selon la stratégie du joueur

### Valeurs exactes

La preuve est au §2.2. Le calcul exact en fractions donne **E[A] = E[B] = E[C] = 193/200** dans chacun des 5 modèles et chacun des 3 niveaux.

| # | Stratégie | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|---|
| 5 | toujours A | **96,5 %** | **96,5 %** | **96,5 %** |
| 6 | toujours B | **96,5 %** | **96,5 %** | **96,5 %** |
| 7 | toujours C | **96,5 %** | **96,5 %** | **96,5 %** |
| 8 | choix aléatoire | **96,5 %** | **96,5 %** | **96,5 %** |
| 9 | alternance A → B → C | **96,5 %** | **96,5 %** | **96,5 %** |
| — | suivre le dernier gadget gagnant / l'éviter | 96,5 % | 96,5 % | 96,5 % |
| ⚠ | **ORACLE** (verrait le triple avant de choisir) | 207,0 % | 250,1 % | 273,3 % |
| ⚠ | anti-oracle (choisirait toujours le pire) | 15,7 % | 3,7 % | 0,7 % |

- En modèle recommandé, l'oracle obtiendrait 189,9 % / 220,1 % / 228,0 %.
- L'oracle n'existe **que** si le triple fuit avant le choix. C'est précisément ce qui disqualifie l'architecture A1.

### Contrôle par simulation

- Modèle indépendant, **10 000 000 de manches** par niveau.
- Les 9 stratégies sont évaluées **sur les mêmes triples** (nombres aléatoires communs), avec une graine fixe.

| Stratégie | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| toujours A | 96,71 % ± 0,17 | 96,20 % ± 0,41 | 96,27 % ± 0,67 |
| toujours B | 96,55 % ± 0,17 | 96,50 % ± 0,41 | 96,23 % ± 0,71 |
| toujours C | 96,42 % ± 0,17 | 96,48 % ± 0,42 | 95,85 % ± 0,68 |
| aléatoire | 96,46 % ± 0,17 | 96,24 % ± 0,41 | 96,41 % ± 0,69 |
| alternance A/B/C | 96,65 % ± 0,17 | 96,28 % ± 0,41 | 95,50 % ± 0,63 |
| suivre le dernier gagnant | 96,63 % ± 0,17 | 96,50 % ± 0,41 | 95,47 % ± 0,63 |
| éviter le dernier gagnant | 96,55 % ± 0,17 | 96,25 % ± 0,41 | 96,17 % ± 0,71 |
| ORACLE | 207,18 % | 249,78 % | 272,20 % |
| anti-oracle | 15,69 % | 3,74 % | 0,72 % |

(± = intervalle de confiance à 95 %.)

**Lecture des écarts**
- Tous les écarts sont compatibles avec la valeur exacte, compte tenu des queues lourdes (x200, x1 000, x5 000).
- GRUMPY « toujours A » est à +2,4 σ. C'est du bruit : A a reçu quelques gros gains rares de plus (écart-type d'échantillon 2,742 contre 2,685 théorique), et la moyenne de A, B et C vaut 96,56 %.
- Sur 21 comparaisons, la probabilité d'observer au moins un écart de cette taille est d'environ 30 %.
- La valeur exacte est démontrée et ne dépend pas de la simulation.

---

## 10–12. Fréquences de regret (vue REVEAL ALL)

- Chaque probabilité est exacte, **par manche, pour le gadget choisi**. Par symétrie, elle est la même pour A, B ou C.
- **« Gain » = paiement > 0**, définition du hit rate actuel. Un second tableau utilise le seuil ≥ x1.
- Entre parenthèses : la part des pertes ou des gains concernés.

### GRUMPY (hit rate 58,14 %)
| Modèle | 10. perte, une autre option gagnait | 11. gain, une autre avait davantage | 12. trois pertes | plusieurs gagnants |
|---|---|---|---|---|
| INDÉPENDANT | 34,53 % (82 % des pertes) | 22,14 % (38 % des gains) | 7,34 % | 62,10 % |
| CORRÉLÉ ρ = 3/5 | 13,81 % (33 %) | 28,62 % (49 %) | 28,05 % | 59,72 % |
| TOUT-OU-RIEN | 0 % | 32,94 % (57 %) | 41,86 % | 58,14 % |
| UN SEUL GAGNANT | impossible | — | — | — |
| **IND. + BF COMMUN** | **34,43 % (82 %)** | **21,68 % (37 %)** | **7,43 %** | **61,95 %** |

### FURIOUS (hit rate 33,23 %)
| Modèle | 10. perte, une autre option gagnait | 11. gain, une autre avait davantage | 12. trois pertes | plusieurs gagnants |
|---|---|---|---|---|
| INDÉPENDANT | 37,00 % (55 % des pertes) | 7,87 % (24 % des gains) | 29,76 % | 25,79 % |
| CORRÉLÉ ρ = 2/5 | 22,20 % (33 %) | 12,24 % (37 %) | 44,57 % | 28,77 % |
| TOUT-OU-RIEN | 0 % | 18,79 % (57 %) | 66,77 % | 33,23 % |
| UN SEUL GAGNANT | 66,46 % (100 %) | 0 % | 0,30 % | 0 % |
| **IND. + BF COMMUN** | **36,60 % (55 %)** | **7,55 % (23 %)** | **30,17 %** | **25,70 %** |

### UNHINGED (hit rate 15,54 %)
| Modèle | 10. perte, une autre option gagnait | 11. gain, une autre avait davantage | 12. trois pertes | plusieurs gagnants |
|---|---|---|---|---|
| INDÉPENDANT | 24,21 % (29 % des pertes) | 1,80 % (12 % des gains) | 60,25 % | 6,49 % |
| CORRÉLÉ ρ = 1/5 | 19,37 % (23 %) | 3,17 % (20 %) | 65,09 % | 8,30 % |
| TOUT-OU-RIEN | 0 % | 8,68 % (56 %) | 84,46 % | 15,54 % |
| UN SEUL GAGNANT | 31,08 % (37 %) | 0 % | 53,38 % | 0 % |
| **IND. + BF COMMUN** | **23,40 % (28 %)** | **1,63 % (10 %)** | **61,06 %** | **6,68 %** |

### Avec « gain » = paiement ≥ x1 (vrai gain net ; les x0,5 comptent alors comme des pertes)
| Modèle | GRUMPY : 10 / 11 / 12 | FURIOUS : 10 / 11 / 12 |
|---|---|---|
| INDÉPENDANT | 38,49 % / 11,50 % / 19,37 % | 32,97 % / 4,34 % / 41,80 % |
| **IND. + BF COMMUN** | **38,23 % / 11,11 % / 19,63 %** | **32,41 % / 4,08 % / 42,36 %** |
| TOUT-OU-RIEN | 14,79 % / 18,15 % / 43,07 % | 7,54 % / 11,25 % / 67,23 % |

UNHINGED n'a pas de gain inférieur à x1, donc ses chiffres ne changent pas.

### Gros multiplicateurs non choisis

- Probabilité par manche qu'**une option non choisie** atteigne le seuil alors que l'option choisie ne l'atteint pas.
- Entre parenthèses : « 1 manche sur N ».
- Colonne « pendant une perte » : l'option choisie paie x0.

| Niveau · modèle | ≥ x10 | ≥ x25 | ≥ x100 | BOSS FIGHT manqué | pendant une perte : ≥ x25 | ≥ x100 |
|---|---|---|---|---|---|---|
| GRUMPY · INDÉPENDANT | 1,85 % (1/54) | 0,55 % (1/183) | 0,04 % (1/2 646) | 1,32 % (1/76) | 1/435 | 1/6 320 |
| **GRUMPY · IND. + BF COMMUN** | **1,27 % (1/79)** | **0,28 % (1/358)** | **0** | **0** | **1/848** | **0** |
| FURIOUS · INDÉPENDANT | 3,10 % (1/32) | 1,20 % (1/84) | 0,15 % (1/649) | 1,32 % (1/76) | 1/124 | 1/971 |
| **FURIOUS · IND. + BF COMMUN** | **2,40 % (1/42)** | **0,83 % (1/120)** | **0,08 % (1/1 251)** | **0** | **1/177** | **1/1 860** |
| UNHINGED · INDÉPENDANT | 3,50 % (1/29) | 1,60 % (1/63) | 0,32 % (1/317) | 1,32 % (1/76) | 1/73 | 1/374 |
| **UNHINGED · IND. + BF COMMUN** | **2,60 % (1/38)** | **1,05 % (1/95)** | **0,18 % (1/563)** | **0** | **1/111** | **1/661** |

**Sur 100 manches en REVEAL ALL** (modèle recommandé, valeurs moyennes) :

| Sur 100 manches | GRUMPY | FURIOUS | UNHINGED |
|---|---|---|---|
| « j'ai perdu, une autre option gagnait » | ≈ 34 | ≈ 37 | ≈ 23 |
| « j'ai gagné, une autre avait davantage » | ≈ 22 | ≈ 8 | ≈ 2 |
| « trois pertes » | ≈ 7 | ≈ 30 | ≈ 61 |
| « une option non jouée ≥ x25 » | ≈ 0,3 | ≈ 0,8 | ≈ 1 |

**Enseignements**
1. Le regret « perte, une autre gagnait » est **fréquent dans tous les niveaux** (23 à 37 manches sur 100). Ce n'est pas une sélection artificielle, mais c'est structurel : avec trois tirages indépendants, la perte isolée est courante.
2. On ne peut le réduire qu'en **corrélant les gains**, ce qui augmente les « trois pertes » et les « une autre avait davantage ».
3. Aucun modèle ne réduit les trois regrets à la fois. Le modèle **UN SEUL GAGNANT** est le pire en REVEAL (100 % des pertes FURIOUS montrent « une autre gagnait ») et doit être écarté.
4. Les gros multiplicateurs non choisis sont **rares** : ≥ x100 moins d'une fois sur 500 manches dans le modèle recommandé. Le BOSS FIGHT commun en supprime la source principale.

---

## 13. Impact sur la variance

- **Par manche : aucun impact.** La loi du gain payé est exactement la distribution actuelle du niveau, pour toute stratégie non informée. Les écarts-types restent **2,685 / 6,672 / 11,585**, et les limites « 3-star » du SDK (CVaR, etc.), calculées par mode, sont identiques aux valeurs actuelles.
- **Par session : aucun impact.** Les manches restent indépendantes et de même loi, donc séries de pertes, temps d'attente avant ≥ x5, ≥ x25, ≥ x100 et BOSS FIGHT, et courbes de session (`docs/generated/MATH_REPORT.md`) sont **inchangés**. Les trois Rage Levels gardent leurs profils.
- **Ce qui change, c'est la variance perçue (REVEAL ALL seulement)** :
  - le joueur voit en moyenne **3·h résultats gagnants par manche** (1,74 / 1,00 / 0,47) au lieu de h ;
  - le « meilleur des trois » affiché vaut en moyenne 190 % / 220 % / 228 % de la mise (modèle recommandé) ;
  - l'écran montre donc plus souvent du gain que le portefeuille n'en reçoit. C'est un risque de perception (§18).
- **Corrélation entre gadgets** : 0 en modèle indépendant (hors BOSS FIGHT commun), 0,056 en CORRÉLÉ GRUMPY. Elle n'a d'effet que sur ce qui est montré, jamais sur l'argent.
- **Sécurité** : la seule fuite qui changerait la variance et le RTP est la connaissance du triple avant le choix (oracle, §5–9). A2 la rend impossible.

---

## 14. Impact sur la taille des books

| | Actuel (1 mode par niveau) | A2 · INDÉPENDANT | **A2 · IND. + BF COMMUN** |
|---|---|---|---|
| Fichiers de books | 3 | 9 (3 par niveau) | **9** |
| Books distincts minimum par niveau (1 par résultat ou par triple) | 15 / 18 / 20 | 3 375 / 5 832 / 8 000 | **735 / 1 008 / 1 340** |
| Taille moyenne d'un book (JSON mesuré) | 243 à 286 octets | 674 à 797 octets (×2,8) | ≈ ×2,8 |
| Poids entiers exacts (PPCM) | 27 / 31 / 37 bits : ✅ exacts | 80 / 91 / 109 bits : ❌ > 64 bits | **56 / 64 / 79 bits : ✅ / ✅ / ❌** |

**Poids qui dépassent 64 bits** (IND partout ; UNHINGED en BF commun)
- On arrondit **chaque triple** sur un total de 2^62. Les permutations d'un même triple ayant la même probabilité, elles reçoivent le même poids.
- **A, B et C restent donc strictement égaux**, même après arrondi.
- Mesures :
  - erreur de RTP ≤ 1,3·10⁻¹⁴ (UNHINGED IND) et ≤ 1,0·10⁻¹⁵ (UNHINGED BF commun) ;
  - aucun triple perdu (poids minimal ≥ 28) ;
  - limite du SDK (RTP ≤ 0,967) respectée.

**Variété de présentation**
- Aujourd'hui, la variété vient de la quantité de books : plusieurs graines par résultat.
- Avec les triples, elle est **presque gratuite** : un même résultat choisi apparaît dans n² triples différents, chacun avec sa graine. Par exemple, « x0 choisi » en GRUMPY apparaît dans 81 triples en BF commun.

**Ordre de grandeur**
- Mesures de compression, avec xz comme substitut de zstd, sur les supports complets du modèle indépendant : 3 375 / 5 832 / 8 000 books font **125 / 229 / 318 Kio compressés** (2,2 / 4,3 / 6,2 Mio bruts) par fichier.
- À nombre de books égal, le stockage est multiplié par environ **8,4** (×3 fichiers × 2,8 octets). Avec 100 000 books par mode, cela ferait quelques Mio compressés par fichier.
- Limites de taille côté Stake : ❓ (Q14).
- La génération se fait avec le math-sdk (format standard) mais par un **générateur sur mesure** qui écrit les triples, comme c'était déjà prévu en Phase 2.

---

## 15. Replay / Resume

| Situation | Comportement A2 | Statut |
|---|---|---|
| Coupure **après le choix, avant `Play`** | Aucune mise, aucune manche : le choix est simplement perdu. Rien à reprendre | ✅ |
| Coupure pendant `Play` (réponse perdue) | Resynchronisation par `authenticate` (H13) : la manche active donne le mode, donc le gadget choisi, et l'état | ✅ / 🟡 |
| Coupure pendant l'animation | `round.mode` + `round.state` → la séquence du gadget **choisi** est rejouée depuis le book ; **aucun nouveau choix possible** (le mode est figé côté serveur) ; la révélation suit si l'UX la prévoit | ✅ / ❓ format de `state` (Q7) |
| Coupure après la révélation, avant `end-round` | Même chose ; la révélation est de la présentation pure, déterministe | ✅ |
| **Replay** (`/bet/replay/{game}/{version}/{mode}/{event}`) | `mode` donne le gadget choisi, `event` le book, donc le triple. Animation et révélation identiques | 🟡 / ❓ (Q6, Q26) |
| Historique opérateur | Le mode (par exemple `grumpy_b`) trace le choix : preuve en cas de litige | ❓ (Q26) |
| Collection | Les replays ne débloquent rien (règle existante). Les **alternatives révélées ne débloquent rien** non plus : elles n'ont pas été jouées | décision |

- Aucune dépendance à `/bet/event` : H12 est maintenue.
- Les invariants de sécurité de `STAKE_ENGINE_FAITS_VERIFIES.md` §10 restent vrais tels quels : pas de deuxième mise, pas de nouveau tir en reprise, pas de résultat différent.

---

## 16. Provably fair

**Ce qui existe.** Les sources consultées (math-sdk, web-sdk, RGS.md) ne documentent **aucun** mécanisme provably fair (graine serveur hachée, graine client, nonce) pour les jeux Stake Engine. Le tirage est entièrement côté RGS. ❓ **INFORMATION STAKE ENGINE REQUISE** (Q25).

**Ce qu'A2 permet de vérifier (audit statique, automatisable dans notre CI en Phase 2)**

| # | Contrôle |
|---|---|
| 1 | Dans un niveau, les 3 CSV ont exactement les mêmes colonnes `id` et `poids` |
| 2 | Pour chaque id, le bloc `triple` est identique octet pour octet dans les 3 fichiers de books |
| 3 | Le `payoutMultiplier` du mode X est égal à la composante X du triple, et à `finalWin` |
| 4 | Les poids sont invariants par permutation de A/B/C, donc RTP A = B = C (égalité entière) |
| 5 | La marginale de chaque position est égale à la distribution publiée du niveau (tolérance 10⁻¹⁴) |
| 6 | Les fichiers sont statiques et hachés (SHA-256 dans la config générée par le SDK) : rien ne peut dépendre de l'historique |

**Ce qui manque**
- Une preuve **par manche** que *ce* triple était fixé avant le choix. Deux voies sont possibles, toutes deux ❓ :
  - Q23 : le RGS tire le même id quel que soit le mode quand les tables sont identiques ;
  - Q25 : un engagement cryptographique (architecture C3).

**Conséquence sur le texte affiché**
- Tant que ces points ne sont pas confirmés, **ne pas écrire « tu aurais gagné x5 avec B »**.
- Écrire plutôt « B : x5 », avec dans les règles la phrase du §1.2.
- Ne jamais utiliser l'expression « provably fair » dans le jeu sans confirmation de Stake.

---

## 17. Comparaison PRIVATE ALTERNATIVES / REVEAL ALL

| Critère | VERSION 1 : PRIVATE ALTERNATIVES | VERSION 2 : REVEAL ALL |
|---|---|---|
| Architecture requise | B suffit (A2 possible) | **A2 obligatoire** (sinon faux « what if ») |
| Honnêteté du discours « ton choix compte » | Vraie en A2 mais **invisible** ; en B, le choix est cosmétique et il ne faut pas prétendre le contraire | Visible et vraie (au sens du §1.2) |
| Suspense (Q1) | « Ai-je gagné ? » + « mon gadget est-il le bon ? » pendant l'animation, sans réponse sur les autres | Deuxième temps de suspense après le résultat : « qu'y avait-il ailleurs ? » |
| Regret « j'ai perdu, une autre gagnait » | Jamais montré | **23 à 37 manches sur 100** selon le niveau (§10) |
| Frustration perçue | Faible | Élevée en GRUMPY (82 % des pertes montrent un gain ailleurs) |
| « Envie de rejouer » | Neutre | Plus forte, mais **par le regret**. Terrain sensible en jeu responsable (§18) |
| Illusion de contrôle / sophisme du joueur | Modérée (le joueur choisit) | **Forte** : il verra des séries « B a gagné 4 fois » purement dues au hasard |
| Perception d'équité | Risque : « le choix sert-il à quelque chose ? » | Risque : « le jeu met le gain là où je ne clique pas ». En réalité c'est exactement symétrique, mais la perception peut être négative |
| Lisibilité des règles | Simple | Il faut expliquer la loi jointe (indépendance, BOSS FIGHT commun) |
| Conformité | Faible risque | Risque « near miss » et « illusion de contrôle » à faire valider (❓) |
| Coût de développement | Faible (écran de choix) | Écran de choix + révélation statique (pas de nouvelle animation, mais une UI et des règles) |
| Réversibilité | En A2, on peut passer à REVEAL **sans nouvelle version mathématique** : la révélation est de la présentation | En A2, on peut la couper par juridiction de la même façon |

**Variante intermédiaire à tester : RÉVÉLATION À LA DEMANDE**
- Un bouton discret « voir A / B / C », identique après **chaque** manche quel que soit le résultat, ou une révélation dans l'historique.
- Le joueur qui veut savoir sait ; les autres ne subissent pas le regret à chaque manche.

**Obligatoires, quelle que soit la version montrée**

| Interdit | Pourquoi |
|---|---|
| **Révélation sélective** : seulement après une perte, seulement quand une autre option a gagné, seulement au-delà d'un seuil | C'est une sélection des alternatives montrées, donc un near miss fabriqué, même si les valeurs sont vraies |
| Mise en scène différente selon la valeur non jouée (ralenti, son de victoire, halo sur « x100 juste à côté ») | Amplifie artificiellement le regret |
| Son ou célébration pour un gain **non joué** | Célébrer un gain qui n'est pas payé |
| Statistiques par gadget (« B : 5 gains d'affilée ») | Alimente la croyance au gadget « chaud » |
| Délai ou ordre de révélation qui dépend du résultat | Même raison |

La révélation, si elle existe, doit être **identique en forme et en durée à chaque manche** : trois valeurs, même taille, même temps, sans son de gain pour les options non jouées.

---

## 18. Risques réglementaires et UX

| Risque | Gravité | Mitigation | Statut |
|---|---|---|---|
| **Illusion de contrôle** : un choix qui semble compter alors que l'espérance est identique. D'après les annonces de l'UKGC (2021, à vérifier), les fonctions donnant « l'illusion de contrôle » sur le résultat sont interdites dans les slots en ligne au Royaume-Uni | Élevée si le jeu est distribué dans une juridiction concernée | Règles explicites (« aucun gadget n'a plus de chances ») ; pas d'indice ; possibilité de désactiver le choix (gadget imposé ou tiré) par juridiction | ❓ Q24 + conformité |
| **Near miss** : plusieurs référentiels encadrent les résultats montrés comme « presque gagnants » plus souvent que le hasard. Ici la fréquence est exactement celle du modèle, mais elle est **élevée** en REVEAL ALL | Moyenne à élevée (REVEAL) | PRIVATE ou révélation à la demande ; modèle neutre publié ; aucune révélation sélective | ❓ Q24 |
| **Pertes déguisées en gains** : x0,5 en GRUMPY affiché comme un « gain » ; en REVEAL, les x0,5 non joués | Moyenne | Aucune célébration sous x1, ni pour le résultat payé ni pour les alternatives | ❓ (jurisdiction flags) |
| **Sophisme du joueur / gadget « chaud »** : des séries apparaissent par hasard | Moyenne | Aucune statistique par gadget ; la collection ne montre que des animations découvertes, jamais des gains | décision |
| **Perception de triche** : « il met toujours le gain ailleurs » | Moyenne (REVEAL) | Page de règles avec les fréquences publiées (§10) ; historique complet ; audit §16 | — |
| **Mode utilisé comme choix de gadget** : 9 modes à coût 1,0, et leur affichage côté opérateur | Bloquant si refusé | Repli : B (choix cosmétique en PRIVATE) | ❓ Q21, Q22 |
| **Autoplay** avec un choix par manche | Moyenne | Répéter le dernier choix (`is_feature` ou mémorisation locale) ; jamais « le gadget qui a le plus gagné » | ❓ Q13, Q27 |
| **Friction** : un clic de plus par manche, et une durée minimale de manche | Faible à moyenne | Dernier choix pré-sélectionné ; à clarifier : la durée minimale part-elle de la mise, donc après le choix ? | ❓ Q8, Q28 |
| **Collection par gadget** : incite à essayer A, B et C (neutre pour le RTP d'après §2.2), mais la méta-progression n'est toujours pas confirmée | Faible | Collection = observateur ; aucune récompense liée aux gains | ❓ Q17 |
| **Coût de contenu** : 9 gadgets au lieu de 3, soit environ 16 branches par gadget ; ≈ 144 branches au lieu de 51 pour le même niveau de variété | Élevé (production) | Décision produit ; livrer par niveau | — |
| **Q1 (suspense)** : le choix peut renforcer « ai-je choisi le bon gadget ? », mais la révélation systématique peut aussi transformer chaque perte en « mauvais choix » | À mesurer | Playtest A/B : PRIVATE contre REVEAL ALL contre À LA DEMANDE | playtest |

---

## 19. Recommandation d'architecture (sans produire le jeu)

### 19.1 Architecture

1. **Si la mécanique est adoptée, retenir A2 : choix = mode avant `Play`, et books triples partagés par les 3 modes du niveau.**
   - C'est la seule architecture compatible avec les faits vérifiés dans laquelle les alternatives sont **réelles, pré-engagées dans des fichiers publiés et auditables**, sans exposer le triple avant le choix.
   - Je la recommande **même en PRIVATE** : le discours « ton choix a une conséquence » devient vrai et vérifiable, et l'UX de révélation reste réglable (y compris par juridiction) **sans nouvelle version mathématique**.
2. **Si Stake refuse A2** (9 modes, ids et poids partagés, ou affichage de résultats non joués), repli sur **B en PRIVATE uniquement** : le choix devient cosmétique, et il ne faut **ni montrer ni suggérer** d'alternatives.
3. **Écarter** A1, C1, C2 (en REVEAL), C4 (pour un choix réel) et C5.
4. **Garder C3 en réserve** si Stake propose un engagement par manche.

### 19.2 Mathématiques

- **Modèle INDÉPENDANT + BOSS FIGHT COMMUN**, fixé par version mathématique.
- **Marginales = distributions actuelles**, sans aucun changement de `config/rage_levels.json`. Donc RTP de 96,5 % pour toute stratégie, et même volatilité par niveau.
- Poids exacts pour GRUMPY et FURIOUS ; arrondi symétrique pour UNHINGED (erreur ≤ 10⁻¹⁵).
- Un modèle corrélé ne se justifierait que pour **réduire** le regret, décidé avant publication, jamais par réglage continu.

### 19.3 Questions à poser à Stake avant toute implémentation (suite de la liste Q1–Q20)

21. **9 modes à coût 1,0** (3 Rage Levels × 3 gadgets) : acceptés ? Comment l'opérateur affiche-t-il ces modes (historique, interface) ?
22. Plusieurs modes peuvent-ils partager **les mêmes ids et les mêmes poids**, avec des `payoutMultiplier` différents et des books presque identiques ?
23. Pour des tables identiques, le RGS tire-t-il **le même id quel que soit le mode** (même nombre aléatoire) ? Sinon, le tirage est-il au moins indépendant du mode et de l'historique du joueur ?
24. Afficher après la manche des **résultats non joués** (alternatives réelles issues du book) est-il accepté ? Dans quelles juridictions ? Quelles règles de near miss et d'« illusion de contrôle » s'appliquent ?
25. Existe-t-il un mécanisme **provably fair** ou un engagement par manche (graines) pour les jeux Stake Engine ?
26. `/bet/replay` renvoie-t-il l'intégralité des `events`, triple compris, pour le mode joué ? L'historique joueur ou opérateur montre-t-il le mode ?
27. Autoplay : peut-on répéter le dernier mode ? Quelle est la sémantique exacte de `is_feature` côté RGS et opérateur ?
28. Une étape de choix avant chaque mise est-elle compatible avec `minimumRoundDuration` et les règles d'interface ?
29. Un RTP calculé à partir de poids arrondis (écart ≤ 10⁻¹⁴ sur 96,5 %) est-il accepté tel quel ?

### 19.4 UX

- **Par défaut : PRIVATE**, avec la **révélation à la demande** (inconditionnelle) comme option.
- **REVEAL ALL** seulement après :
  1. un playtest comparatif (PRIVATE / À LA DEMANDE / REVEAL ALL) mesurant Q1, la frustration, la perception d'équité (« le jeu triche-t-il ? ») et l'envie de rejouer ;
  2. la réponse de Stake à Q24.
- Les interdits du §17 s'appliquent dans tous les cas.

### 19.5 Ce que l'adoption impliquerait (non commencé)

- **6 nouveaux gadgets** et leurs branches. Les gadgets actuels deviennent A dans chaque niveau : SWIVEL SLINGSHOT, TRAPDOOR, ROCKET.
- **Une étape CHOIX** avant FIRE dans le flux de jeu (sans toucher au principe « résultat du book, présentation déterministe »).
- **Des modes 3 → 9** côté client et RGS.
- **Le générateur de books** de la Phase 2 écrit des triples, avec les 6 contrôles du §16 en CI.
- **La collection** par gadget et les règles du jeu.

Rien de tout cela n'est commencé. Les animations supplémentaires ne sont pas construites.

**STOP. Décision attendue : cette mécanique remplace-t-elle le modèle actuel ?**
