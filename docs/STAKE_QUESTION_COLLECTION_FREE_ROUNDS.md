# Question à Stake Engine : tours gratuits gagnés grâce à la collection

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

**Date** : 2026-09-28. **Statut** : rédigée, **à envoyer par l'utilisateur** au support Stake Engine ; en attente de réponse.
**Origine** : demande utilisateur (« les bonus de la collection des animations sont nuls, je veux des tours gratuits grâce à ça »).
Décision : **rien n'est codé avant la réponse de Stake** (INFORMATION STAKE ENGINE REQUISE, question 20 de
`docs/STAKE_ENGINE_FAITS_VERIFIES.md`).

## Pourquoi on demande

- Les Approval Guidelines disent : « Engine games are strictly stateless: each bet must be independent of previous outcomes », et
  interdisent la « continuation ». Des tours gratuits gagnés en accumulant des cartes dépendent de l'historique des manches.
- Aucun mécanisme connu dans l'API RGS pour offrir une manche : `/wallet/play` débite toujours une mise.
- La collection est aujourd'hui stockée dans le navigateur (modifiable) et **désactivée en mode Stake** (`metaFeaturesFor`).
- Des tours offerts ajouteraient de la valeur au-delà du RTP déclaré (96,5 %).

## Message à envoyer (anglais)

> **Subject: Persistent progression rewarding free rounds — allowed, and through which mechanism?**
>
> Hello Stake Engine team,
>
> We are building an instant game for Stake Engine (working title "BAD BOSS"): 3 bet modes (cost 1.0 each), RTP 96.5 %,
> every outcome pre-computed in books. Our in-round bonus already follows the math-sdk free spins model: when triggered
> (1 in 400), 8 free rounds are played inside the same book, with one `/wallet/play`, one `/wallet/end-round` and one total
> `payoutMultiplier`.
>
> We also have a "Collection Book": each round plays one of ~150 animations (chosen deterministically from the book's
> cosmetic seed; it never changes the outcome), and new animations are added to a collection that persists across sessions.
> Rewards are purely cosmetic today, and the feature is disabled on Stake until you confirm it is acceptable.
>
> We would like collection milestones to award **free rounds** (for example 3 to 10 rounds at the bet of the round that
> reached the milestone). Before building anything, could you confirm:
>
> 1. Your approval guidelines say games are strictly stateless and each bet must be independent of previous outcomes.
>    Does this rule out **any reward with monetary value** (free rounds, free bets, credits) earned through **persistent
>    progression** across rounds or sessions, even if its cost were included in the published RTP?
> 2. If some form is possible: is there an RGS or operator mechanism for a game to **grant free rounds** (a zero-cost
>    `/wallet/play`, a free-bet / promotions API, or server-side player storage we could use instead of client storage)?
>    We could not find one in the RGS documentation.
> 3. Is **purely cosmetic** persistent progression (no monetary value) acceptable? Are there jurisdiction or `social`
>    mode restrictions, and may we store it client-side (`localStorage` inside your iframe)?
> 4. If monetary rewards are not allowed, would a **free showcase round** (no bet, no payout, an animation episode
>    unlocked by the collection) be acceptable?
> 5. If any rewarded variant were allowed, how should its value be reflected in the declared RTP of each mode?
>
> Thank you!

## Ce qu'on fera selon la réponse

| Réponse de Stake | Suite |
|---|---|
| Interdit (le plus probable) | Récompenses de la collection plus fortes mais sans argent (épisodes jouables, skins animés…), à valider avec l'utilisateur. |
| Autorisé via un mécanisme Stake (free bets, stockage serveur) | Conception avec ce mécanisme uniquement ; jamais via le stockage local ; coût intégré au RTP déclaré et documenté. |
| Cosmétique seulement accepté | La collection est réactivée en mode Stake avec des récompenses cosmétiques. |

Sources : [Approval Guidelines](https://stake-engine.com/docs/approval-guidelines) · [RGS](https://stake-engine.com/docs/rgs) ·
[math-sdk (free spins)](https://stakeengine.github.io/math-sdk/math_docs/gamestate_section/configuration_section/config_overview/).
