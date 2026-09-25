# Stake Engine : faits vérifiés et analyse technique (étape 9)

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**
>
> Règle du projet : aucun endpoint, SDK, champ ou comportement n'est utilisé s'il n'est pas documenté ou lu dans du code officiel.
> Légende :
> - ✅ **VÉRIFIÉ** : écrit dans la documentation officielle ou lu dans le code officiel ;
> - 🟡 **DÉDUIT** : observé dans le code officiel (web-sdk), mais pas garanti comme contrat d'API ;
> - ❓ **INFORMATION STAKE ENGINE REQUISE**.

## Sources consultées

| Source | Version | Accès |
|---|---|---|
| `github.com/StakeEngine/math-sdk` (docs, `utils/rgs_verification.py`, `src/write_data/write_configs.py`, `src/config/betmode.py`) | commit `a6dccd86` (2026-09-22) | clone public |
| `github.com/StakeEngine/web-sdk` (README, `packages/rgs-requests`, `rgs-fetcher/schema.ts`, `components-shared/Authenticate.svelte`, `utils-xstate/createPrimaryMachines.ts`, `state-shared/stateUrl.svelte.ts`) | commit `1843d60c` (2025-11-28) | clone public |
| Paquet npm **`stake-engine`** 0.1.32 (« Stake Engine SDK (BETA) », client TypeScript) | publié le 2025-10-26, mainteneur npm `iamthehouse` | code source lu intégralement (`src/client.ts`, `types.ts`, `helpers.ts`) |
| Paquet npm `pixi-svelte` 2.1.0 | publié depuis `StakeEngine/web-sdk` | métadonnées |
| `stake-engine.com/docs`, `stakeengine.github.io/*` | — | **bloqués par le proxy de l'environnement**. À relire depuis un poste non restreint |

Clients tiers repérés, **non retenus** (non officiels) : `stake-engine-client` (raw-fun-gaming), `@mnemoo/rgs`, `@stakeplate/core`.

---

## 1. Modèle de jeu ✅
- « Games uploaded to Stake Engine must consist of static files. » Tous les résultats sont pré-calculés dans des books, un fichier par mode.
- Le RGS tire un book **proportionnellement à son poids** dans le lookup table du mode et le renvoie dans la réponse de `/wallet/play`.
- **Conséquences** : le résultat est connu à la réception de `/wallet/play`, **aucune décision en cours de manche ne peut changer le gain**, et le RNG est entièrement côté Stake.

## 2. Fichiers mathématiques ✅
- `index.json` : `{"modes": [{"name", "cost", "events", "weights"}]}`. CSV `id,weight,payoutMultiplier` en **uint64**. Books en **JSON-lines compressé zstd**, avec les clés obligatoires `id`, `events`, `payoutMultiplier` (entier, 1150 = x11,5).
- Le **champ `events` est libre** : c'est là que BAD BOSS écrit ses données de présentation (catégorie de script, rareté, graine, chemin du BOSS FIGHT).
- Contrôles du SDK (`rgs_verification.py`) :
  - gain non nul ≥ 10 et multiple de 10 ;
  - limites « 3-star » (RTP ≤ 0,967, CVaR ≤ 800…) ;
  - écart de RTP entre modes ≤ 0,05.
- **Config backend** générée par le math-sdk (`write_configs.py`), par mode : `name`, `cost`, `rtp`, `std`, `bookLength`, `feature`, **`autoEndRoundDisabled`** (issu de `BetMode(auto_close_disabled=…)`), `buyBonus`, `maxWin`, fichiers et hash SHA-256.
- Doc du math-sdk sur `auto_close_disabled` : « When this flag is False (default) the RGS endpoint API /endround is called automatically to close out the bet… It may be desirable… to set this flag to True so that the player can resume interrupted play **even if the payout is 0**. This means that the front-end will have to manually close out the bet. »
  - ❓ Sémantique exacte côté RGS, et acceptation de `true` sur des modes de base.
- **Upload des maths** : via l'ACP. Le script S3 du SDK est décrit comme « temporary/alternate ».

## 3. Lancement du jeu et paramètres d'URL
- ✅ `https://{TeamName}.cdn.stake-engine.com/{GameID}/{GameVersion}/index.html?sessionID=…&lang=…&device=…&rgs_url=…`. `rgs_url` ne doit **pas** être codée en dur. `device` = `mobile` | `desktop`. `lang` = 16 codes ISO 639-1.
- 🟡 Le web-sdk lit aussi `currency`, `social`, `demo`, et pour le **replay** : `replay=true`, `amount`, `game`, `mode`, `version`, `event`.
- ✅ Conséquence de build : les assets doivent être **référencés en chemins relatifs**, car le jeu est servi sous un sous-chemin versionné.

## 4. API RGS

| Endpoint | Requête | Réponse | Statut |
|---|---|---|---|
| `POST /wallet/authenticate` | `{sessionID, language?}` | `balance`, `config {minBet, maxBet, stepBet, defaultBetLevel, betLevels, jurisdiction}`, `round` (manche **active** ou **dernière manche terminée**) | ✅ |
| `POST /wallet/balance` | `{sessionID}` | `balance` | ✅ |
| `POST /wallet/play` | `{sessionID, amount, mode}` (le web-sdk ajoute `currency` et un `meta?` libre) | `balance` (après débit), `round` | ✅ / 🟡 (`currency`, `meta`) |
| `POST /wallet/end-round` | `{sessionID}` | `balance` (après gain) | ✅ |
| `POST /bet/event` | `{sessionID, event: string}` | `{event}` | ✅ (existence) / ❓ (contrat pour notre usage) |
| `GET /bet/replay/{game}/{version}/{mode}/{event}` | — | données de manche rejouable | 🟡 (web-sdk, avec `@ts-ignore` et « TODO: update the schema ») / ❓ |

- **Round** (types du client `stake-engine` et exemple du web-sdk) : `betID`, `amount`, `payout`, `payoutMultiplier`, `active`, `mode`, `event`, `state`. 🟡 Dans l'exemple du web-sdk, `round.payoutMultiplier` vaut `33.4` (**flottant**) alors que le book stocke `3340` (**entier ×100**). Le client BAD BOSS traite donc les deux représentations explicitement. ❓ Format exact de `state` : liste des `events` du book seule, ou book complet ?
- **Argent** : ✅ entiers à 6 décimales (1 000 000 = 1,00). 🟡 Un commentaire du schéma web-sdk dit « 1000 = $10.00 ». `RGS.md` et le client `stake-engine` (`API_MULTIPLIER`) utilisent 1e6, et c'est ce que nous retenons.
- **Mises** ✅ : `minBet ≤ mise ≤ maxBet`, multiple de `stepBet`, `betLevels` recommandés.
- **Erreurs** ✅ :
  - 400 : `ERR_VAL`, `ERR_IPB`, `ERR_IS`, `ERR_ATE`, `ERR_GLE`, `ERR_LOC` ;
  - 500 : `ERR_GEN`, `ERR_MAINTENANCE` ;
  - schéma web-sdk : `ERR_BE` (« Player already has an active bet »), `ERR_BNF`, `ERR_UE`, `ERR_GE`.
  - 🟡 Format du corps d'erreur : le web-sdk teste `data?.error`, d'où un objet `{error: CODE, …}`. ❓ Format exact.

## 5. Juridiction ✅ (clés), ❓ (sémantique)
Clés lues dans le web-sdk **et** typées dans le client `stake-engine` (`JurisdictionFlags`) :
- booléens : `socialCasino`, `disabledFullscreen`, `disabledTurbo`, `disabledSuperTurbo`, `disabledAutoplay`, `disabledSlamstop`, `disabledSpacebar`, `disabledBuyFeature`, `displayNetPosition`, `displayRTP`, `displaySessionTimer` ;
- nombre : `minimumRoundDuration`.

❓ Unité et point de départ de `minimumRoundDuration`. ❓ Portée exacte de « slamstop ». ❓ Emplacements imposés par les clés `display*`. ❓ Lexique imposé par `socialCasino`.

## 6. Client TypeScript `stake-engine` : analyse

**Ce qu'il fait (lu dans le code source 0.1.32)** :
- `RGSClient({url, enforceBetLevels?, protocol?})` lit `sessionID`, `rgs_url`, `lang` et `device` dans l'URL. Il lève une exception si `sessionID` ou `rgs_url` manquent, ou si `device` est inconnu.
- `Authenticate()` stocke `jurisdictionFlags`, la config de mise et la balance, et renvoie `round`.
- `Play({amount, mode})` :
  - vérifie `stepBet`, `minBet` et `maxBet`, ainsi que les `betLevels` si `enforceBetLevels` (valeur par défaut) ;
  - **refuse de jouer si une manche est active localement** (garde anti double mise) ;
  - met à jour la balance.
- `EndRound()`, `Event(value)`, et un rafraîchissement de balance toutes les 60 s après chaque Play ou EndRound.
- Émet les `CustomEvent` `balanceUpdate` et `roundActive` sur `window`.
- Fournit `DisplayAmount` (formatage de devise, 36 devises dont XGC/XSC).
- Aucune dépendance d'exécution. Licence ISC.

**Limites constatées dans le code** (importantes pour une reprise robuste) :

| # | Limite | Conséquence pour BAD BOSS |
|---|---|---|
| L1 | En cas d'erreur, `throw new Error(data)` avec `data` objet : le message devient « [object Object] » et **le code RGS est perdu** | Impossible de distinguer `ERR_IPB`, `ERR_GLE`, `ERR_MAINTENANCE`… sans aide |
| L2 | Aucun délai d'expiration, aucune annulation (`fetch` sans `AbortSignal`) | Une requête peut rester pendante indéfiniment |
| L3 | Le verrou local `roundActive` passe à `true` **avant** `/wallet/play`. `Authenticate()` ne le remet **jamais** à `false` | Après un Play resté sans réponse, l'instance reste bloquée (« A round is already active ») |
| L4 | `response.json()` est appelé avant de tester le statut | Une réponse d'erreur non-JSON (page de proxy 502) lève une exception de parsing |
| L5 | Succès reconnu seulement si `status / 100 === 2`, donc exactement 200 | Sans effet si le RGS répond toujours 200 |
| L6 | Pas de replay (`GET /bet/replay/...`), pas de `meta`, pas de `currency` dans Play | Le replay est à implémenter à part |
| L7 | Aucun dépôt source déclaré sur npm. Son caractère **officiel** n'a pas pu être confirmé depuis cet environnement | ❓ À confirmer auprès de Stake Engine |

**Décision : utiliser `stake-engine` tel quel, derrière un adapter très fin (`StakeRgsAdapter`, environ 150 lignes).** On ne réécrit ni Authenticate, ni Play, ni EndRound. L'adapter ajoute seulement ce qui manque :
1. **Codes d'erreur (L1, L4)** : un observateur de réponses installé une fois sur `fetch`, limité aux URL du RGS. Il **ne modifie rien**, il clone simplement les réponses non-2xx pour mémoriser `{status, code}`. Solution temporaire, en attendant un correctif en amont (erreurs structurées) que nous demanderons.
2. **Délais (L2)** : `Promise.race` avec un délai. **Un Play expiré n'est jamais relancé.** L'adapter passe en réconciliation.
3. **Réconciliation (L3)** : une **nouvelle instance** du client (état local vierge) appelle `Authenticate()`, qui dit si une manche est active.
4. **Replay (L6)** : une petite fonction `GET` séparée, isolée et désactivable. ❓ Contrat.
5. **Interface unique `RgsPort`**, implémentée aussi par `MockRgs` (développement, tests, DEV PANEL).

Si Stake Engine confirme un autre client officiel, ou corrige L1 à L3, seul l'adapter change.

## 7. Session, reprise et replay dans le web-sdk officiel 🟡
- **Reprise** : `Authenticate` → si `round.state` existe, `betToResume = round`. Si `round.active`, le jeu rejoue la manche puis la ferme. Le moment de `end-round` dépend du type : `noWin` (aucun appel), `singleRoundWin` (au début), `bonusWin` (à la fin). Le type est déduit de `active` et `payoutMultiplier`.
- **Replay** : `?replay=true&game&version&mode&event&amount&rgs_url`, puis `GET /bet/replay/...`. Les données sont injectées comme une manche à reprendre (`event: '0'`, `active: true`), et **aucun appel `end-round`** n'est fait en replay. ❓ Qui génère ces URL (historique opérateur ?) et que désigne `event` (identifiant de simulation ?).
- **`/bet/event`** : le web-sdk y stocke l'index de l'événement du book en cours. **BAD BOSS n'en dépend pas** (décision de validation), faute de contrat confirmé ❓.

## 8. Déploiement et test ✅ (README du web-sdk)
1. Build statique : un dossier contenant `index.html` et ses assets.
2. ACP (`engine.stake.com`) → page **Files** du jeu → import du dossier de build.
3. **Publish Game → Front End**.
4. Page **Developer** → **Start game session** → **Launch in New Tab** : le jeu tourne en staging.
5. Pour développer en local contre le RGS de staging, on copie la *query string* de l'onglet de staging dans l'URL locale.

❓ Limites de taille des fichiers, polices, requêtes externes autorisées, en-têtes CSP.

## 9. Synthèse : ce que gère Stake Engine, ce que gère BAD BOSS

| Domaine | Stake Engine gère | BAD BOSS gère | Statut |
|---|---|---|---|
| Initialisation | Fournit l'URL (`sessionID`, `rgs_url`, `lang`, `device`) | Lire l'URL (via le client), choisir le mode play / replay / dev | ✅ |
| Session | Valide `sessionID`, expiration (`ERR_IS`, `ERR_ATE`) | Appeler `Authenticate` en premier. En cas d'expiration, écran « recharger depuis le casino » | ✅ |
| Mise | Valide le montant, débite le solde, applique les limites (`ERR_IPB`, `ERR_GLE`) | Proposer les `betLevels`, respecter `stepBet`, verrouiller la mise pendant une manche | ✅ |
| Balance | Source de vérité du solde | Afficher la balance renvoyée par Play, EndRound et Balance | ✅ |
| Création de manche | Tire un book pondéré dans le mode demandé | Envoyer le mode du Rage Level (`grumpy`, `furious`, `unhinged`) | ✅ |
| RNG et résultat | **100 % Stake** (sélection pondérée des books) | **Aucun RNG mathématique.** Graine cosmétique lue dans le book | ✅ |
| Payout | Verse `amount × payoutMultiplier` à la fin de la manche | Afficher le montant renvoyé par le serveur, jamais recalculé pour le solde | ✅ |
| Fin de manche | Ferme la manche sur `end-round` (ou automatiquement, selon `autoEndRoundDisabled`) | Appeler `end-round` au REVEAL, une seule fois par manche | ✅ / ❓ |
| Historique | Côté opérateur ❓ | Aucun historique local obligatoire | ❓ |
| Replay | Fournit les données via `/bet/replay` 🟡 | Rejouer l'animation à l'identique depuis ces données | 🟡 / ❓ |
| Reprise | Renvoie la manche active dans `Authenticate` | Reconstruire la présentation depuis `round.state`, sans nouvelle mise | ✅ |
| Erreurs | Codes `ERR_*` | Messages joueurs, réconciliation, jamais de nouvelle tentative de Play | ✅ / 🟡 |
| Juridiction | Envoie `jurisdiction` | `FeatureGate` : une fonctionnalité interdite n'est pas construite | ✅ / ❓ |
| Responsive | Indique `device` | Mises en page portrait, paysage et desktop | ✅ |
| Langue et devise | `lang`, `balance.currency` | 16 langues, formatage via `DisplayAmount` | ✅ |
| Hébergement | CDN, versions, ACP | Build statique, chemins relatifs, budgets de taille | ✅ / ❓ |
| Maths | Vérifie les fichiers, calcule les statistiques | Produire books, CSV et index avec le math-sdk officiel | ✅ |

## 10. Invariants de sécurité d'une manche (exigence de validation)

Une fermeture de page ou une perte réseau pendant ACTION, TWIST, IMPACT, RESULT_REVEAL ou le BOSS FIGHT ne doit **jamais** permettre une deuxième mise, un résultat différent, un nouveau tir ou un payout différent.

| Garantie | Comment |
|---|---|
| Pas de résultat différent, pas de payout différent | Le résultat et le gain sont **dans le book côté serveur**. Le client ne calcule rien et ne peut rien changer |
| Pas de deuxième mise | `Play` n'est appelé **que** depuis l'état READY, par un geste explicite. Il n'est jamais rappelé automatiquement. Tant qu'une manche est active ou non réconciliée, le tir est désactivé. Côté serveur : manche active, puis `ERR_BE` 🟡 |
| Pas de nouveau tir en reprise | Le chemin de reprise n'appelle **jamais** `Play` : il relit `round.state` |
| Reprise possible à tout moment avant le REVEAL | Modes configurés avec `auto_close_disabled=True` : la manche reste active jusqu'à notre `end-round` ❓. Repli : si la manche est déjà fermée, on affiche un récapitulatif sans effet sur l'argent |

## 11. Questions ouvertes (INFORMATION STAKE ENGINE REQUISE)

1. Plage de RTP autorisée, portée des « 3-star limits ».
2. Acceptation de 3 modes à coût 1,0 comme niveaux de volatilité.
3. **`autoEndRoundDisabled = true` sur des modes de base** : accepté ? Les manches à gain nul restent-elles actives ?
4. **Le paquet npm `stake-engine` est-il le client officiel ?** Existe-t-il une version avec erreurs structurées (L1 à L3) ?
5. Format du corps d'erreur RGS (`{error, message}` ?).
6. Contrat du **replay** : qui fournit l'URL, que vaut `event`, format de la réponse de `/bet/replay`.
7. Format exact de `round.state`, et représentation de `round.payoutMultiplier` (flottant contre entier ×100).
8. **`minimumRoundDuration`** : unité, point de départ (envoi de la mise ? affichage du résultat ?), portée (autoplay seulement ?).
9. **`disabledSlamstop`** : quels raccourcissements sont interdits (skip seulement, ou aussi turbo) ?
10. `/bet/event` : contrat, taille, usage attendu. **Aucune dépendance BAD BOSS tant que ce n'est pas confirmé.**
11. `meta` dans `/wallet/play` : accepté, et renvoyé dans `round` ou dans le replay ?
12. Sémantique des clés `display*` et lexique `socialCasino`.
13. Règles d'autoplay (limites de pertes obligatoires ?).
14. Limites de taille des fichiers front, polices, requêtes externes, CSP.
15. Guidelines de contenu (violence cartoon) et processus d'approbation.
16. Unité monétaire : confirmation de 1e6.
