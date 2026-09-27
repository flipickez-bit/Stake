# BAD BOSS (working title) — "3 plans" mechanic: technical summary for Stake Engine

Status: **prototype running on our own mock RGS only.**
- Nothing below is implemented against the Stake RGS.
- Our Stake adapter refuses these modes before sending anything.
- We are asking whether this design is acceptable before building it.

## 1. Mechanic
- In each volatility level ("Rage Level"), the player picks one of three gadgets (plans A, B, C) **before** placing the bet.
- Only the picked plan is played and paid.
- The two other results of the same round may be shown afterwards, as plain information and only if the player asks (see §5).

## 2. Architecture ("A2")
- **The plan is part of the bet mode.** The player's choice is sent as the mode of `POST /wallet/play`, for example `grumpy_b`. It is never a mid-round decision.
- **Each book holds the full triple.** The `events` field of every book contains the three results (A, B, C) of the round, each with its presentation data. A `pick` event names the paid plan.
- **Modes of one level share their books.** The three modes of a level (`grumpy_a`, `grumpy_b`, `grumpy_c`):
  - use **the same book ids and the same weights**;
  - carry **the same `triple` block, byte for byte**.

  Only the following differ:
  - `payoutMultiplier`, which equals the component of the picked plan;
  - the `pick` event;
  - the `finalWin` event.
- **The choice cannot influence the alternatives.** The distribution of the drawn triple is identical whatever the mode, because the lookup tables are identical.
- **The client cannot change anything after Play.**
  - The payout is fixed by the book.
  - Knowing the two other results after the bet gives no advantage, because rounds are independent.
- **Mode count:** 3 levels × 3 plans = **9 modes, all at cost 1.0**.

Book entry example (`books_grumpy_b`; the same id `48213` also exists in `_a` and `_c`):
```json
{"id": 48213, "payoutMultiplier": 500, "events": [
  {"type": "triple", "level": "grumpy", "model": "IND_BFC_v1", "bossFight": false, "results": [
    {"slot": "A", "gadgetId": "swivel-slingshot", "multiplier100": 0,   "script": "CLEAN_MISS", "rarity": "common", "seed": 17},
    {"slot": "B", "gadgetId": "espresso-blaster", "multiplier100": 500, "script": "DIRECT",     "rarity": "common", "seed": 2718281828},
    {"slot": "C", "gadgetId": "copier-catapult",  "multiplier100": 0,   "script": "BACKFIRE",   "rarity": "rare",   "seed": 99}]},
  {"type": "pick", "slot": "B"},
  {"type": "presentation", "script": "DIRECT", "rarity": "common", "seed": 2718281828},
  {"type": "finalWin", "amount": 500}]}
```
The matching lookup table lines share the id and weight and differ only in the payout: `48213,<w>,0` in `grumpy_a`, `48213,<w>,500` in `grumpy_b`, `48213,<w>,0` in `grumpy_c`.

## 3. Maths and RTP
- **Joint model per level (`IND_BFC_v1`).**
  - With probability 1/150 the round is a BOSS FIGHT that is **common** to the three plans (same rung).
  - Otherwise, the three plans are drawn **independently** from the level's base table.
- **Each plan has exactly the current distribution of its level.** Consequences:
  - RTP A = RTP B = RTP C = 96.5 %;
  - the per-round standard deviation is unchanged;
  - every math-sdk per-mode check gives the same results as today.
- **The expected return does not depend on how the player chooses:** 96.5 % for any strategy (always A, random, alternating, following the history…), because the triple is drawn independently of the choice and of the past.
- **Weights and books.**
  - Exact integer weights need up to 79 bits for the highest-volatility level.
  - We would round each triple's weight symmetrically on a 2^62 total. RTP error ≤ 1e-15, and the three modes stay exactly equal.
  - Distinct triples per level: 735 / 1 008 / 1 340, versus 15–20 single outcomes today.
  - Each book is about 2.8× larger, and there are 3 files per level instead of 1.

## 4. Replay and resume
- **Resume:** `round.mode` gives the paid plan and `round.state` gives the triple. The resumed presentation replays the paid plan only, with no new choice and no new Play.
- **Replay:** `/bet/replay/{game}/{version}/{mode}/{event}`. The mode identifies the plan and the event identifies the book, so the replay is identical to the round.

## 5. Alternative display (client side only; no maths change)
- **PRIVATE** (our default): alternatives are never shown.
- **ON-DEMAND** (under test):
  - a "REVEAL OTHER PLANS" button is offered after **every** round, with the same treatment for losses, wins and big wins, and never only after a loss;
  - the three multipliers are shown with neutral styling;
  - there is no sound, no celebration and no "you should have picked…" copy.
- **REVEAL ALL:** internal experiment only.
- **Per-jurisdiction switch:** the display is a presentation setting, so it could be disabled per jurisdiction without a new maths version.

## 6. Security model
- The choice is locked in the bet mode before the draw.
- The client never sees a triple before the bet.
- There is no way to re-pick, re-roll or play twice for the same round.
- There is no player state on the server; books are static and hashed, so the model cannot adapt to history, losses, collection or favourite gadget.

## 7. Questions for Stake Engine (Q21–Q29)
21. Are **9 modes at cost 1.0** acceptable? How are they shown to operators and players (bet history)?
22. May several modes share **identical book ids and weights** and carry almost identical books that differ only in `payoutMultiplier`?
23. For identical lookup tables, does the RGS draw **the same id whatever the mode** (same random number)? If not, is the draw at least independent of the mode and of the player's history?
24. Is it acceptable to show players **unplayed results** of the same round, taken from the book? In which jurisdictions? Which near-miss and "illusion of control" rules apply?
25. Is there any **provably fair** or per-round commitment mechanism for Stake Engine games?
26. Does `/bet/replay` return the full `events`, including the triple, for the played mode? Does the bet history show the mode?
27. Autoplay: may the last mode be repeated? What are the exact semantics of `is_feature` on the RGS/operator side?
28. Is a choice step before each bet compatible with `minimumRoundDuration` and your UI rules?
29. Is an RTP computed from rounded integer weights (error ≤ 1e-14 on 96.5 %) accepted as is?
