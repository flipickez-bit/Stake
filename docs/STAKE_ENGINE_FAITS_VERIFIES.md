# Stake Engine : faits vérifiés (préparatoire à l'étape 9)

> Règle du projet : **aucun endpoint, SDK, champ ou comportement n'est utilisé s'il n'est pas documenté.**
> Tout ce qui n'a pas été trouvé est marqué **INFORMATION STAKE ENGINE REQUISE**.

## Sources consultées

| Source | Version | Accès |
|---|---|---|
| `github.com/StakeEngine/math-sdk` (dossier `docs/`, `utils/rgs_verification.py`, `utils/analysis/distribution_functions.py`, `games/fifty_fifty/`) | commit `a6dccd86` (2026-09-22) | lu localement (clone public) |
| `github.com/StakeEngine/web-sdk` (`README.md`, `packages/rgs-requests`, `packages/rgs-fetcher/src/schema.ts`) | commit `1843d60c` (2025-11-28) | lu localement (clone public) |
| `stake-engine.com/docs`, `stakeengine.github.io/*` | — | **bloqués par le proxy réseau de l'environnement de développement** (refus sortant). À relire depuis un poste non restreint : ces sites peuvent contenir des règles d'approbation absentes des dépôts |

## 1. Modèle de jeu : résultats statiques pré-calculés

- « Games uploaded to Stake Engine must consist of static files. » Tous les résultats possibles sont dans des fichiers compressés, séparés par mode (`docs/index.md`).
- Chaque résultat est associé à une ligne CSV `simulation number, probability (weight), payout multiplier`. « When a betting round is initiated a simulation number is selected at a frequency proportional to the simulation weighting, and the corresponding game events are returned through the /play API response. »
- **Conséquence pour BAD BOSS** : le résultat est connu à la réponse de `/play`. Aucune décision du joueur en cours de manche ne peut modifier le gain.

## 2. Fichiers mathématiques (`docs/rgs_docs/data_format.md`)

- `index.json` : `{"modes": [{"name", "cost", "events": "<x>.jsonl.zst", "weights": "<x>.csv"}]}`.
- Lookup table CSV : lignes `id,weight,payoutMultiplier`, **entiers uint64**. Le `payoutMultiplier` doit correspondre exactement à celui du book (hash comparé).
- Books : JSON-lines compressé **zstd** (`.jsonl.zst`). Clés **obligatoires** par book : `id` (int), `events` (liste d'objets), `payoutMultiplier` (int, **1150 = x11,5**).
- Contrôles du SDK (`utils/rgs_verification.py`, « duplicate RGS verification before upload ») :
  - payout entier ≥ 0 ; payout non nul **≥ 10** ; payout **multiple de 10** (donc des pas de x0,1) ;
  - somme des poids ≤ max uint64 ;
  - « 3-star volatility limits » par mode : `rtp ≤ 0.967`, `cvar ≤ 800`, `etl40b ≤ 0.9`, `etl10k ≤ 0.8`, `prob5k ≤ 1e-2`, `prob10k ≤ 0.5e-2` (avertissement, pas d'erreur) ;
  - avertissement si l'écart de RTP entre modes dépasse **0.05** (« exceeds allowed difference for approvals »).

## 3. Modes de mise (`docs/math_docs/.../betmode_overview.md`, `RGS.md`)

- Chaque `BetMode` a un `name`, un `cost`, un `rtp`, un `max_win` et des flags `auto_close_disabled`, `is_feature`, `is_buybonus`.
- `is_feature = True` : le front conserve le mode sélectionné sans interaction à chaque mise. C'est pertinent pour nos 3 niveaux de rage.
- `auto_close_disabled = False` (défaut) : « the RGS endpoint API /endround is called automatically to close out the bet ». Une manche fermée ne peut pas être reprise.
- Débit du joueur = mise de base × coût du mode.

## 4. API RGS (`docs/rgs_docs/RGS.md` + `web-sdk/packages/rgs-requests`)

URL du jeu : `https://{TeamName}.cdn.stake-engine.com/{GameID}/{GameVersion}/index.html?sessionID=…&lang=…&device=…&rgs_url=…`
- `rgs_url` **ne doit pas être codée en dur** (elle peut changer).
- `device` = `mobile` ou `desktop`. `lang` = ISO 639-1 (ar, de, en, es, fi, fr, hi, id, ja, ko, pl, pt, ru, tr, vi, zh).

| Endpoint | Requête | Réponse |
|---|---|---|
| `POST /wallet/authenticate` | `{sessionID}` | `balance {amount, currency}`, `config {minBet, maxBet, stepBet, defaultBetLevel, betLevels, jurisdiction{…}}`, `round` (manche active **ou** dernière manche terminée : « Frontends should continue the round if it remains active ») |
| `POST /wallet/balance` | `{sessionID}` | `balance` |
| `POST /wallet/play` | `{amount, sessionID, mode}` | `balance`, `round` |
| `POST /wallet/end-round` | `{sessionID}` | `balance` (déclenche le paiement et termine la manche) |
| `POST /bet/event` | `{sessionID, event}` | `{event}` : suivi de progression pour la reprise après déconnexion |

- `/wallet/authenticate` doit être appelé en premier, sinon les autres renvoient `ERR_IS`.
- Montants : **entiers à 6 décimales** (1 000 000 = 1,00). La devise n'affecte que l'affichage.
  - Incohérence relevée : les commentaires de `web-sdk/.../schema.ts` disent « 1000 = $10.00 ». `RGS.md` fait foi. **INFORMATION STAKE ENGINE REQUISE** : confirmation.
- Mise valide : `minBet ≤ mise ≤ maxBet` et multiple de `stepBet`.
- `round` (schéma web-sdk) : `roundID`, `amount`, `payout`, `payoutMultiplier`, `active`, `mode`, `event`, `state` (« Describes the state of the game. This is up to the developer »).
- Erreurs 400 : `ERR_VAL`, `ERR_IPB` (solde insuffisant), `ERR_IS` (session invalide ou expirée), `ERR_ATE`, `ERR_GLE` (limites de jeu), `ERR_LOC` (localisation). Erreurs 500 : `ERR_GEN`, `ERR_MAINTENANCE`. Le schéma web-sdk mentionne aussi `ERR_BE` (« Player already has an active bet »).
- `jurisdiction` contient au moins `socialCasino`, `disabledFullscreen`, `disabledTurbo`, puis « … ». **INFORMATION STAKE ENGINE REQUISE** : liste complète (autoplay ? bonus buy ? durée minimale de manche ?).

## 5. Front-end (`web-sdk/README.md`)

- Le web-sdk officiel est basé sur **Svelte 5, PixiJS 8 et TurboRepo**. Il est **optionnel** : « You can use anything as long as it compiles to a static website. »
- Moment d'appel de `end-round` (extrait de `createPrimaryMachines.ts`) :
  - `noWin` : aucun appel ;
  - `singleRoundWin` : `end-round` au début (dès réception), solde affiché à la fin de l'animation ;
  - `bonusWin` : `end-round` à la fin du bonus, ce qui rend la manche reprenable via `/wallet/authenticate`.
- L'animation par spritesheet est citée comme alternative à Spine.
- Le web-sdk utilise **xstate** (machines `bet`, `autoBet`, `resumeBet`).

## 6. À vérifier avant l'étape 9 (liste consolidée)

1. **INFORMATION STAKE ENGINE REQUISE** : plage de RTP autorisée et signification des « 3-star limits ».
2. **INFORMATION STAKE ENGINE REQUISE** : acceptation de 3 modes à coût 1,0 comme niveaux de volatilité.
3. **INFORMATION STAKE ENGINE REQUISE** : clés complètes de `jurisdiction` (turbo, autoplay, bonus buy, durée minimale de manche, affichage obligatoire du RTP).
4. **INFORMATION STAKE ENGINE REQUISE** : fermeture automatique côté RGS des manches à gain nul (le web-sdk n'appelle pas `end-round` pour `noWin`).
5. **INFORMATION STAKE ENGINE REQUISE** : unités monétaires (6 décimales contre le commentaire « 1000 = $10.00 »).
6. **INFORMATION STAKE ENGINE REQUISE** : limites de taille des assets, polices et requêtes externes autorisées, processus d'upload du front (ACP).
7. **INFORMATION STAKE ENGINE REQUISE** : guidelines de contenu (thème violence cartoon) et d'approbation des jeux.
8. **INFORMATION STAKE ENGINE REQUISE** : existence d'un mode « replay / historique de manche » imposé au front.
