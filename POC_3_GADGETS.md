# BAD BOSS — 3 GADGET POC (preuve de concept « 3 PLANS »)

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**
> Date : 2026-09-27. Statut : **POC livré, en attente du playtest A/B et de la réponse de Stake (Q21–Q29).**

**Objectif** : vérifier si **choisir entre 3 gadgets rend réellement BAD BOSS plus amusant**.

**Ce que le POC NE fait PAS**
- les 6 nouveaux gadgets complets ;
- les 144 branches ;
- les maths de production définitives ;
- la nouvelle collection complète.

**Rien n'a changé dans le jeu normal**
- mêmes maths, même RTP, mêmes probabilités, mêmes Rage Levels ;
- mêmes branches et même GameFlow par défaut ;
- même préversion principale.

Le POC est un **mode MOCK / DEV séparé**, activé par `?poc=3gadget` ou par le build `npm run build:poc`. Il n'est **jamais** disponible avec le RGS Stake.

**Préversion privée « BAD BOSS — 3 GADGET POC »** : https://claude.ai/artifact/Ntj63VPabWu2V1ZxxKXL3V. Elle ne remplace pas le prototype principal.

---

## 1. Ce qui a été construit

| Élément | Où |
|---|---|
| Maths A2 **expérimentales** du Mock RGS : modèle `IND_BFC_v1`, triple tiré SANS connaître le plan, book du mode choisi | `src/platform/rgs/mock/tripleMath.ts`, `MockServer.ts` |
| Modes A2 candidats `grumpy_a/b/c` : le plan part AVEC la mise ; le client Stake refuse tout plan avant envoi | `src/domain/plans.ts`, `RgsPort.play(amount, mode, plan)`, `StakeRgsAdapter.ts` |
| Lecture stricte du book : plan du serveur = pick ; gain = plan payé ; présentation = celle du plan payé | `src/domain/outcome.ts` (`parsePlans`) |
| GameFlow : choix en READY seulement, lu au FIRE, verrouillé ensuite (invariant **I9**) | `src/flow/GameFlow.ts` (`setPlan`, `fire`, `presentRound`) |
| Choix **dans le décor** : les trois plans physiquement présents, touchables, animation d'attente au survol | `src/render/PixiStage.ts`, `src/content/gadgets/poc/stations.ts`, `src/app/poc/PlanPicker.svelte` |
| Prototypes **B · ESPRESSO BLASTER** et **C · COPIER CATAPULT** (5 branches chacun) | `src/content/gadgets/poc/*.ts`, `src/render/art/parts/plans.ts` |
| Affichage des autres plans : PRIVATE / ON-DEMAND / REVEAL ALL (DEV) | `src/app/poc/OtherPlans.svelte`, `src/app/pocConfig.ts` |
| Réglage DEV **ALTERNATIVE DISPLAY**, triples imposés, compteur des choix | `src/app/poc/PocDevSection.svelte` |
| **PLAYTEST A/B** 2 × 30 manches, ordre tiré au hasard, questions Q1–Q7, export | `src/dev/pocPlaytest.ts`, `src/app/poc/Poc*.svelte` |
| Collection : on enregistre le gadget choisi (jamais une alternative) | `src/collection/{tracker,Collection,store}.ts` |
| Résumé technique pour Stake | `docs/STAKE_A2_TECH_SUMMARY.md` |
| SOUND BIBLE v0 (règle : OTHER PLANS silencieux) | `SOUND_BIBLE.md` |

## 2. Fonctionnement A/B/C

1. **READY.** Le bureau GRUMPY montre les trois plans, de gauche à droite :
   - **A · SWIVEL SLINGSHOT** (le vrai gadget, au pied du bureau ; l'élastique pend au poteau pendant le choix) ;
   - **B · ESPRESSO BLASTER** et **C · COPIER CATAPULT** (prototypes, au premier plan).
2. **Choisir.** Le joueur touche un gadget (ou les touches A / B / C du clavier). Au survol ou à la sélection :
   - l'élastique vibre, la vapeur monte, ou une feuille sort du bac ;
   - un halo doux (jamais doré) se pose au sol ;
   - une étiquette « YOUR PLAN » apparaît.
3. **Sans plan choisi, pas de tir** : le bouton affiche « PICK A PLAN ».
4. **FIRE.** GameFlow lit le plan **au même instant que la mise** et l'envoie avec `play` (mode A2 candidat `grumpy_b`).
   - Les deux plans non choisis s'effacent en fondu (260 ms) ; les étiquettes disparaissent.
   - La barre du bas rappelle « YOUR PLAN: B · ESPRESSO BLASTER ».
5. **Le Mock RGS tire le triple entier, sans connaître le plan.**
   - BOSS FIGHT commun avec la probabilité 1/150 ; sinon trois tirages indépendants dans la table de base de GRUMPY.
   - Il écrit le book du mode choisi : triple, `pick`, présentation du plan payé, `finalWin`.
6. **Seul le gadget du plan payé est joué**, avec sa présentation déjà écrite dans le triple. Reveal, gain, fin de manche, READY : exactement comme dans le jeu normal.
7. **Après la manche**, selon le réglage : PRIVATE (§3), ON-DEMAND (§4) ou REVEAL ALL (§5).

RTP identique pour A, B et C (96,5 %), quelle que soit la stratégie (preuve dans l'étude, contrôle exact et simulé dans les tests). La volatilité de GRUMPY est inchangée.

## 3. PRIVATE (UX retenue pour le prototype)

- Seul le multiplicateur du plan choisi est révélé, automatiquement, comme aujourd'hui.
- Les deux autres ne sont **jamais** montrés : ni bouton, ni panneau (test e2e « PRIVATE ne montre jamais les autres plans »).
- Les trois résultats existent quand même dans le book (A2) : le choix est mathématiquement réel.

## 4. ON-DEMAND (bouton « REVEAL OTHER PLANS »)

- **Quand** : après **toutes** les manches (perte, gain, gros gain), au même endroit et de la même façon.
  - Jamais seulement après une perte : ce serait une révélation sélective.
  - Vérifié en e2e après une perte ET après un gain, et en test statique : l'affichage ne lit jamais la valeur d'un résultat.
- **Contenu, sur demande du joueur uniquement** :
  - `A · SWIVEL SLINGSHOT · x0 — OTHER PLAN` / `B · ESPRESSO BLASTER · x0 — YOUR PLAN` / `C · COPIER CATAPULT · x5 — OTHER PLAN` ;
  - la note : « The three results are drawn together, from the same table whatever the plan. Only YOUR PLAN is played and paid. »
- **Simple information** :
  - même couleur neutre pour tous les multiplicateurs ;
  - aucune animation de victoire, aucun DING, aucun BIG WIN, aucun confetti, aucune secousse ;
  - aucune couleur de paiement (ni or ni vert) ;
  - aucun son (0 appel audio vérifié en e2e) ;
  - aucune réaction de B.B. ;
  - le wallet et le résultat ne changent pas.
- **Textes interdits** (test automatique, commentaires exclus) : « should have », « so close », « wrong choice », « missed », « next time », « almost », et leurs équivalents français.
- **Position** : en haut de la scène en paysage, en bas en portrait. Bouton « HIDE ».

## 5. REVEAL ALL (DEV, expérimental)

- Le même panneau s'affiche **automatiquement** après chaque manche (toutes issues), dès le retour à READY.
- Mêmes règles de neutralité et de silence.
- Accessible uniquement par le DEV PANEL (section **3 PLANS POC → ALTERNATIVE DISPLAY : PRIVATE / ON-DEMAND / REVEAL ALL (EXPERIMENTAL)**). Hors du protocole de playtest.

## 6. Prototypes B et C (pas de nouvelle animation pour les alternatives)

| | B · ESPRESSO BLASTER | C · COPIER CATAPULT |
|---|---|---|
| **Au repos** (survol) | vapeur, aiguille du manomètre qui frémit | une feuille sort du bac |
| **Tronc neutre** | mains sur le levier, la pression monte, vapeur ; B.B. sirote | bouton vert, la machine chauffe et tremble, feuilles |
| **Module commun** (toutes issues) | LE TIR : recul, nuage de vapeur | LE LANCER : le capot catapulte la ramette en cloche |
| **Perte** | il attrape la tasse… LE SIP ; panne de pression | bourrage ; pluie de copies, il continue de siroter |
| **Gain** | la tasse lui retombe dessus (impact partagé) | la ramette lui retombe dessus |
| **Gros gain** | surpression : jet continu, sortie par la fenêtre | la machine s'emballe, avalanche |
| **BOSS FIGHT** | la tasse attrapée est dorée | la ramette frappe le mug, qui devient doré |

- Chaque résultat possible en GRUMPY a une branche **exacte**, sans repli (test).
- Chaque début visible mène à une perte ET à un gain (règle des deux issues, test).
- Durée moyenne d'une manche (calcul exact sur les branches, pondéré par les probabilités) :

  | Plan | Normal | Turbo |
  |---|---|---|
  | A | 3,9 s | 2,3 s |
  | B | 3,3 s | 2,0 s |
  | C | 3,0 s | 1,8 s |

  Garde-fou en test : B et C ≤ A × 1,15.
- **Art** : 9 pièces SVG (palette et traits de l'ART BIBLE, contrôlées automatiquement), dans leur propre page d'atlas 1024 × 512 chargée **seulement** en mode POC.
- B et C sont à l'échelle 0,8, posés au premier plan. En paysage, le cadrage du POC est un peu plus large et un peu plus haut (rendu seulement).

## 7. Collection

- Une animation **non jouée** ne peut jamais entrer dans la collection. La collection observe la présentation réellement jouée ; les alternatives ne passent jamais par le Presenter (test).
- Nouveau et minimal : `gadgetPicks`, le nombre de manches par gadget **choisi**.
  - Compté une fois par manche, jamais pour un replay.
  - Champ facultatif et tolérant au chargement ; affiché dans le DEV PANEL.
- Les branches des prototypes B et C ne sont pas des cartes. Seules les branches du lance-pierre (plan A) peuvent être découvertes, comme aujourd'hui.

## 8. Son

- **Survol** : aucun son.
- **Choix d'un plan** : un `click` discret, seulement si le plan change.
- **Manche** : seulement les sons du gadget joué.
- **OTHER PLANS** (ON-DEMAND et REVEAL ALL) : **silence total**, vérifié en e2e.
- **SOUND BIBLE** : je n'ai pas retrouvé de demande antérieure dans l'historique de cette session. J'ai donc démarré `SOUND_BIBLE.md` (v0) à partir du GDD_07 §8.3, des cues de la Phase 0.6 et des règles du POC.
- **Écart relevé, non corrigé** : un x0,5 joue encore 1 DING, contrairement au GDD.

## 9. Sécurité

**Invariant I9** : le plan est choisi en READY seulement et part AVEC la mise. Après Play, **une manche possède un unique plan (selectedGadget)** : celui enregistré par le serveur, immuable.

| Tentative | Résultat | Test |
|---|---|---|
| Tirer sans plan | Refus local, aucun Play | unitaire |
| Changer de plan pendant la mise, l'animation ou le reveal | `setPlan` refusé ; cibles désactivées puis retirées ; touches A/B/C sans effet | unitaire + e2e |
| Double tap FIRE (puis tap sur un autre plan) | Un seul Play, plan inchangé | unitaire + e2e |
| Rechargement pendant la manche | Reprise avec le plan du SERVEUR, aucun nouveau choix, aucun nouveau Play | unitaire + e2e |
| Réponse de Play perdue | Resynchronisation : le plan envoyé est repris | unitaire |
| Book incohérent (pick ≠ mode, gain ≠ plan choisi, présentation d'un autre plan, triple incomplet) | Refusé par `parseRound` | unitaire |
| Modifier l'Outcome | Objet gelé (TypeError) | unitaire |
| Plan sur un niveau sans plans / sur le RGS Stake | `ERR_VAL` (mock) / refus client avant envoi (Stake) | unitaire |
| « Play → voir A/B/C → choisir » | Impossible : aucune alternative avant le reveal (I5) et le plan est déjà verrouillé | unitaire + e2e |
| Faux « what if » | Le triple est tiré sans le plan (même hasard → même triple pour A, B, C) | unitaire |

Replay, reprise, déterminisme (graine du book), GameFlow (I1–I8) : inchangés et toujours couverts par les tests existants.

## 10. Tests

- **Unitaires : 126 / 126** (98 existants + 28 POC) : `poc3Security`, `poc3Content`, `poc3Playtest`, art bible étendu.
- **E2E : 25 / 25** (18 existants + 7 POC, `tests/e2e/poc.spec.ts`), Chromium + SwiftShader.
- `svelte-check` : 0 erreur, 0 avertissement.

## 11. Performances (`docs/generated/POC3_PERF.md`, `node tools/poc-perf.mjs`)

| Mesure (même machine, 2e mesure de chaque build) | Jeu normal | POC |
|---|---|---|
| Initialisation de la scène | 1 469 ms | 1 436 ms |
| Mémoire des textures (estimation) | 30,7 Mo | 33,0 Mo (+1 page 1024 × 512 ; atlas du POC ≤ 32 Mo, testé) |
| Objets d'affichage | 228 | 241 |
| Temps CPU par image (moy. / p95) | 1,3 / 2,9 ms | 1,3 / 3,2 ms |
| Replis de contenu | 0 | 0 |
| Build fichier unique | — | 999 Ko (298 Ko gzip) |

- Les images/s mesurées en rendu logiciel (7–9) ne représentent pas un téléphone ; seules les différences comptent.
- Durées de manche : voir §6. Sur 3 manches réelles par plan, les écarts viennent des résultats tirés.

## 12. Protocole de playtest A/B

Dans la préversion : **PLAYTEST** → lire → **Commencer**.

1. **Ordre tiré au hasard** (PRIVATE puis ON-DEMAND, ou l'inverse), enregistré. Solde fictif remis à $1,000 au début de chaque session, sans aucun forçage.
2. **Session 1 : 30 manches** (compteur « PLAYTEST S1/2 · n/30 »). Après la 30e :
   - la carte « SESSION 1/2 TERMINÉE » propose **Répondre aux questions** ;
   - le joueur peut aussi continuer à jouer : ce sont les manches **supplémentaires volontaires**, comptées à part.
3. **Questions après chaque session** (1–5) :
   - Q1 « Choisir entre les trois gadgets rend-il la manche plus intéressante ? »
   - Q2 « Avais-tu l'impression que ton choix comptait réellement ? »
   - Q3 « Le choix entre les trois gadgets était-il facile à comprendre ? »
   - Q4 « Après avoir choisi, avais-tu davantage envie de voir le résultat ? »
   - **ON-DEMAND seulement** :
     - Q5 « Avais-tu envie de regarder les deux plans non choisis ? »
     - Q6 « Voir les autres résultats était-il intéressant ou frustrant ? » (1 = très frustrant, 3 = neutre, 5 = très intéressant)
     - Q7 « Cette mécanique te donne-t-elle envie de changer de gadget à la manche suivante ? »
     - question libre : « Qu'as-tu ressenti quand un autre gadget avait un meilleur multiplicateur que celui que tu avais choisi ? »
4. **Session 2 : 30 manches** avec l'autre variante, puis ses questions.
5. **Résultats** : tableau comparatif S1 / S2, puis **Copier** ou **Enregistrer** le JSON. Rien n'est envoyé nulle part.

**Mesures enregistrées par manche** :
- plan choisi, résultat payé, résultats A/B/C ;
- un autre plan faisait mieux / le plan choisi était le meilleur / trois pertes ;
- OTHER PLANS ouvert, et délai d'ouverture ;
- délai READY → mise suivante ;
- changement de gadget ;
- manche volontaire après la 30e ; reprise.

**Synthèse par session** :
- taux de changement de gadget : en général, **après avoir VU qu'un autre plan faisait mieux**, **après avoir VU que son plan était le meilleur**, et un **témoin** (un autre plan faisait mieux mais le joueur ne l'a PAS vu) ;
- ouvertures de OTHER PLANS ;
- délais avant la mise (après une perte, un gain, une ouverture) ;
- manches supplémentaires ; réponses.

**Lecture suggérée** (à décider par vous) :
- la mécanique **améliore** BAD BOSS si Q1, Q2 et Q4 sont ≥ 4 dans les deux sessions ;
- Q6 ≤ 2 est un **signal d'alarme** (frustration) ;
- si l'on change beaucoup plus souvent de gadget « après avoir vu un meilleur plan » que dans le témoin, le choix devient **piloté par le regret**. C'est un point de vigilance pour la conformité.

Pour plusieurs testeurs, l'ordre aléatoire équilibre l'effet d'apprentissage. Chaque étude est exportée séparément.

## 13. Stake Engine

- A2 **n'est pas validée pour la production** : 9 modes, books triples, affichage de résultats non joués. **INFORMATION STAKE ENGINE REQUISE** (Q21–Q29).
- Le résumé à transmettre, en anglais, est prêt : `docs/STAKE_A2_TECH_SUMMARY.md` (architecture, books, 9 modes, RTP, affichage des alternatives, modèle de sécurité, questions).
- Le client Stake refuse tout plan avant envoi (test).

## 14. Limites connues

- **B et C sont des prototypes** : 5 branches chacun, art simple, pas de carte de collection, pas de variété.
- **Positionnement en paysage** : B et C sont posés devant le bureau de B.B. et le cachent un peu ; le canon de B vise B.B. Acceptable pour tester la compréhension, à revoir en production.
- **Mesures du playtest** : locales et déclaratives. Il faut plusieurs testeurs pour conclure.
- **Maths du POC** : MOCK uniquement. Les books math-sdk, les poids uint64 et les 9 modes ne sont pas produits.

## 15. Préversion et captures

- **Préversion privée** : https://claude.ai/artifact/Ntj63VPabWu2V1ZxxKXL3V — fichier unique `npm run build:poc` → `dist-poc/index.html`, Mock RGS, argent fictif. Le réglage ALTERNATIVE DISPLAY est dans le DEV PANEL (bouton DEV).
- **Captures** : `docs/poc3/captures/` (bureau et téléphone), avec les planches `docs/poc3/contact-sheet.jpg` (bureau) et `docs/poc3/contact-sheet-phone.jpg` (téléphone). Elles couvrent :
  - le choix, le survol, la sélection ;
  - le plan A pendant la manche ;
  - B et C : pression / lancer, pertes, gains, gros gains ;
  - PRIVATE, ON-DEMAND (bouton puis panneau, après une perte et après un gain), REVEAL ALL.
- **Reproduire** : `node tools/capture-poc.mjs --dist dist-poc --out docs/poc3/captures`.

**STOP.** Décision attendue après le playtest : choisir entre 3 gadgets rend-il BAD BOSS plus amusant ?
