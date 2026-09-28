"""BAD BOSS - modele mathematique de reference.

Calculateur autonome (stdlib Python 3 uniquement). Il :
  1. lit les parametres dans config/rage_levels.json, la SOURCE DE VERITE unique
     (RTP cible, frequence du BOSS FIGHT, distributions, tours gratuits) ;
  2. construit la distribution de chaque Rage Level (= un bet mode Stake Engine), BOSS FIGHT
     compris : 8 TOURS GRATUITS dans la meme manche (distribution EXACTE du total par recurrence) ;
  3. verifie le RTP de facon EXACTE (fractions rationnelles, aucun arrondi) ;
  4. calcule hit rate, bandes de gains, variance, ecart-type, max win ;
  5. reproduit les controles locaux du math-sdk officiel Stake Engine
     (utils/rgs_verification.py : rtp, cvar, etl40b, prob5k, prob10k) ;
  6. convertit la distribution en poids entiers uint64 (lookup table CSV : exacts quand le PPCM des
     denominateurs tient sur 64 bits, sinon arrondis au plus proche sur un total fixe, ecart de RTP affiche) ;
  7. analyse les series de pertes (calcul exact) et les temps d'attente avant
     >= x5, >= x25, >= x100 et BOSS FIGHT (calcul exact + simulation) ;
  8. simule des sessions (Monte Carlo) pour illustrer la volatilite ressentie.

Ce n'est PAS le generateur de books final : en phase 2 ces tables seront
portees dans le math-sdk Stake Engine (books .jsonl.zst + CSV).

Usage :
    python3 math/model/bad_boss_math.py                  # rapport texte complet (~2 min)
    python3 math/model/bad_boss_math.py --quick          # sans simulations (instantane)
    python3 math/model/bad_boss_math.py --markdown       # rapport markdown sur stdout
    python3 math/model/bad_boss_math.py --write-report docs/generated/MATH_REPORT.md
    python3 math/model/bad_boss_math.py --list-variants
    python3 math/model/bad_boss_math.py --quick --variant unhinged_x12   # test uniquement
"""

from __future__ import annotations

import bisect
import json
import math
import random
import sys
from fractions import Fraction as F
from functools import reduce
from pathlib import Path

CONFIG_PATH = Path(__file__).resolve().parents[2] / "config" / "rage_levels.json"

# Limites des controles locaux du math-sdk (utils/rgs_verification.py, "3-star volatility limits").
SDK_LIMITS = {"rtp": F(967, 1000), "cvar": 800, "etl40": 0.9, "p5k": 1e-2, "p10k": 0.5e-2}

BANDS = [
    ("PERTE (x0)", F(0), F(0)),
    ("RECUP. (x0.1-x0.9)", F(1, 10), F(9, 10)),
    ("PETIT (x1-x4.9)", F(1), F(49, 10)),
    ("MOYEN (x5-x24.9)", F(5), F(249, 10)),
    ("GROS (x25-x99.9)", F(25), F(999, 10)),
    ("ENORME (x100-x999)", F(100), F(9999, 10)),
    ("LEGENDAIRE (x1000+)", F(1000), F(10**9)),
]

STREAK_LENGTHS = [5, 10, 15, 20]
SESSION_LENGTHS = [100, 300, 1000]
WAIT_EVENTS = [
    ("gain >= x5", lambda m, bf: m >= 5),
    ("gain >= x25", lambda m, bf: m >= 25),
    ("gain >= x100", lambda m, bf: m >= 100),
    ("BOSS FIGHT", lambda m, bf: bf),
]
SIM_ROUNDS = 3_000_000
SIM_SEED = 20260925


# --------------------------------------------------------------------------- config

def load_config(path: Path = CONFIG_PATH, variant: str | None = None) -> dict:
    """Charge la configuration. `variant` applique une variante experimentale
    (section experimental_variants) SANS modifier le fichier : usage test uniquement."""
    raw = json.loads(path.read_text(encoding="utf-8"))
    if variant is not None:
        variants = raw.get("experimental_variants", {})
        if variant not in variants or variant.startswith("_"):
            raise SystemExit(f"Variante inconnue : {variant}. Disponibles : "
                             + ", ".join(k for k in variants if not k.startswith("_")))
        v = variants[variant]
        level = next(lv for lv in raw["rage_levels"] if lv["id"] == v["level"])
        level["base"] = list(v.get("add_base", [])) + level["base"]
    cfg = {
        "target_rtp": F(raw["target_rtp"]),
        "target_rtp_status": raw.get("target_rtp_status", ""),
        "bf_freq": F(raw["boss_fight_frequency"]),
        "levels": [],
    }
    for lv in raw["rage_levels"]:
        base = [(F(r["multiplier"]), None if r["rtp_share"] == "balance" else F(r["rtp_share"])) for r in lv["base"]]
        bf = lv["boss_fight"]
        weights = [(F(r["multiplier"]), int(r["weight"])) for r in bf["hit_bases"]]
        wsum = sum(w for _, w in weights)
        fr = {"rounds": int(bf["free_rounds"]), "p_hit": F(bf["p_hit"]),
              "rage_start": int(bf["rage_start"]), "rage_step": int(bf["rage_step"]),
              "bases": [(m, F(w, wsum)) for m, w in weights]}
        level = {"id": lv["id"], "label": lv["label"], "volatility": lv["volatility"],
                 "max_win": F(lv["max_win"]), "base": base, "fr": fr}
        _validate_level(level)
        cfg["levels"].append(level)
    return cfg


def _validate_level(lv: dict) -> None:
    name = lv["id"]
    assert sum(1 for _, s in lv["base"] if s is None) == 1, f"{name}: exactly one 'balance' row required"
    fr = lv["fr"]
    assert fr["rounds"] >= 1 and 0 < fr["p_hit"] < 1, f"{name}: free rounds need >= 1 round and p_hit in ]0,1["
    assert fr["rage_start"] >= 1 and fr["rage_step"] >= 0, f"{name}: rage must start at >= x1"
    assert all(p > 0 for _, p in fr["bases"]), f"{name}: every hit base needs a positive weight"
    top_rage = fr["rage_start"] + fr["rage_step"] * (fr["rounds"] - 1)
    assert max(m for m, _ in fr["bases"]) * top_rage >= lv["max_win"], f"{name}: wincap unreachable in the free rounds"
    assert max(m for m, _ in lv["base"]) <= lv["max_win"], f"{name}: base multiplier above max_win"
    for m in [m for m, _ in lv["base"]] + [m for m, _ in fr["bases"]]:
        assert (m * 10).denominator == 1 and m >= F(1, 10), f"{name}: x{m} is not a multiple of x0.1 (Stake)"


# --------------------------------------------------------------------------- distribution

def boss_fight_distribution(fr: dict, cap: F) -> list[tuple[F, F]]:
    """Distribution EXACTE du total des tours gratuits (recurrence sur : rage, total, au moins un HIT).
    Regles (config free_rounds_doc) : HIT avec p_hit, gain = base x rage, rage += rage_step apres un HIT ;
    dernier tour force en HIT si aucun HIT avant ; plafond `cap` (wincap) : le bonus s'arrete des qu'il est atteint."""
    states: dict[tuple[int, F, bool], F] = {(fr["rage_start"], F(0), False): F(1)}
    ended: dict[F, F] = {}
    for k in range(fr["rounds"]):
        forced_last = k == fr["rounds"] - 1
        nxt: dict[tuple[int, F, bool], F] = {}
        for (rage, total, hit), p in states.items():
            p_hit = F(1) if forced_last and not hit else fr["p_hit"]
            if p_hit < 1:
                nxt[(rage, total, hit)] = nxt.get((rage, total, hit), F(0)) + p * (1 - p_hit)
            for base, w in fr["bases"]:
                new_total = total + base * rage
                if new_total >= cap:
                    ended[cap] = ended.get(cap, F(0)) + p * p_hit * w
                else:
                    key = (rage + fr["rage_step"], new_total, True)
                    nxt[key] = nxt.get(key, F(0)) + p * p_hit * w
        states = nxt
    for (_, total, _), p in states.items():
        ended[total] = ended.get(total, F(0)) + p
    assert sum(ended.values()) == 1 and F(0) not in ended
    return sorted(ended.items())


def build(level: dict, cfg: dict) -> dict:
    bd = boss_fight_distribution(level["fr"], level["max_win"])
    ev_bonus = sum(m * p for m, p in bd)
    share_bonus = cfg["bf_freq"] * ev_bonus
    fixed = sum(s for _, s in level["base"] if s is not None)
    balance = cfg["target_rtp"] - share_bonus - fixed
    if balance <= 0:
        raise ValueError(f"{level['id']}: budget RTP negatif sur la ligne d'equilibrage")
    rows = []
    for m, s in level["base"]:
        s = balance if s is None else s
        rows.append({"src": "base", "m": m, "share": s, "p": s / m, "balance": s is balance})
    for m, p in bd:
        rows.append({"src": "boss_fight", "m": m, "share": cfg["bf_freq"] * p * m, "p": cfg["bf_freq"] * p,
                     "balance": False})
    p_win = sum(r["p"] for r in rows)
    rows.append({"src": "loss", "m": F(0), "share": F(0), "p": 1 - p_win, "balance": False})
    dist: dict[F, F] = {}
    for r in rows:
        dist[r["m"]] = dist.get(r["m"], F(0)) + r["p"]
    return {"rows": rows, "bd": bd, "ev_bonus": ev_bonus, "share_bonus": share_bonus,
            "balance": balance, "p_win": p_win, "dist": dict(sorted(dist.items()))}


def stats(dist: dict[F, F]) -> dict:
    rtp = sum(m * p for m, p in dist.items())
    mean = float(rtp)
    var = sum(float(p) * (float(m) - mean) ** 2 for m, p in dist.items())
    ordered = list(dist.items())
    cum, median = F(0), F(0)
    for m, p in ordered:
        cum += p
        if cum >= F(1, 2):
            median = m
            break
    # CVaR 99.9 % calcule exactement comme utils/analysis/distribution_functions.py (math-sdk)
    cum, tail_start = F(0), ordered[0][0]
    for m, p in ordered:
        cum += p
        if cum >= F(999, 1000):
            tail_start = m
            break
    tail_p = sum(p for m, p in ordered if m >= tail_start)
    tail_v = sum(p * m for m, p in ordered if m >= tail_start)
    max_m = ordered[-1][0]
    return {
        "rtp": rtp,
        "house_edge": 1 - rtp,
        "p_loss": dist.get(F(0), F(0)),
        "p_win": 1 - dist.get(F(0), F(0)),
        "p_ge_bet": sum(p for m, p in ordered if m >= 1),
        "p_below_bet": sum(p for m, p in ordered if m < 1),
        "var": var,
        "sd": math.sqrt(var),
        "median": median,
        "max": max_m,
        "p_max": dist[max_m],
        "cvar": float(tail_v / tail_p),
        "etl40": float(sum(m * p for m, p in ordered if m >= 40)),
        "p5k": float(sum(p for m, p in ordered if m >= 5000)),
        "p10k": float(sum(p for m, p in ordered if m >= 10000)),
        "bands": [(n, sum(p for m, p in ordered if lo <= m <= hi), sum(m * p for m, p in ordered if lo <= m <= hi))
                  for n, lo, hi in BANDS],
    }


LUT_ROUNDED_TOTAL = 10**15  # < 2^64 avec une large marge


def integer_weights(dist: dict[F, F]) -> tuple[int, dict[F, int]]:
    """Poids entiers de la lookup table.
    EXACTS si le PPCM des denominateurs tient sur 64 bits. Sinon (tours gratuits : produits de 8 tirages),
    arrondis au plus proche sur LUT_ROUNDED_TOTAL (methode du plus fort reste, somme exacte) : l'ecart de RTP
    est affiche dans le rapport ; en production, l'optimiseur du math-sdk pondere de toute facon des books simules."""
    lcm = reduce(lambda a, b: a * b // math.gcd(a, b), (p.denominator for p in dist.values()), 1)
    if lcm < 2**64:
        weights = {m: int(p * lcm) for m, p in dist.items()}
        assert sum(weights.values()) == lcm
        return lcm, weights
    total = LUT_ROUNDED_TOTAL
    raw = {m: p * total for m, p in dist.items()}
    weights = {m: math.floor(v) for m, v in raw.items()}
    rest = total - sum(weights.values())
    for m in sorted(raw, key=lambda m: raw[m] - weights[m], reverse=True)[:rest]:
        weights[m] += 1
    assert sum(weights.values()) == total
    return total, weights


# --------------------------------------------------------------------------- streaks & waiting times

def p_run_at_least(q: float, k: int, n: int) -> float:
    """P(au moins une serie de >= k pertes consecutives en n manches), chaine de Markov exacte."""
    state = [1.0] + [0.0] * (k - 1)  # state[j] = P(serie en cours = j, pas encore absorbe)
    absorbed = 0.0
    for _ in range(n):
        total = sum(state)
        absorbed += q * state[k - 1]
        state = [(1 - q) * total] + [q * state[j - 1] for j in range(1, k)]
    return absorbed


def median_longest_run(q: float, n: int) -> int:
    """Mediane de la plus longue serie de pertes sur n manches."""
    m = 0
    while p_run_at_least(q, m + 1, n) > 0.5:
        m += 1
    return m


def geometric_wait(p: float) -> dict:
    """Nombre de manches jusqu'a l'evenement inclus (loi geometrique)."""
    return {"mean": 1 / p,
            "median": math.ceil(math.log(0.5) / math.log(1 - p)),
            "p90": math.ceil(math.log(0.1) / math.log(1 - p))}


def event_probability(rows: list[dict], pred) -> F:
    return sum(r["p"] for r in rows if r["src"] != "loss" and pred(r["m"], r["src"] == "boss_fight"))


def simulate_waits(rows: list[dict], rounds: int = SIM_ROUNDS, seed: int = SIM_SEED) -> dict:
    """Tire `rounds` manches dans la distribution complete (base + BOSS FIGHT distingues)
    et mesure les ecarts entre evenements. Les manches etant independantes, l'ecart
    entre deux evenements suit la meme loi que l'attente depuis n'importe quel instant."""
    rnd = random.Random(seed)
    cdf, flags, c = [], [], 0.0
    for r in rows:
        c += float(r["p"])
        cdf.append(c)
        flags.append(tuple(pred(r["m"], r["src"] == "boss_fight") for _, pred in WAIT_EVENTS) + (r["m"] == 0,))
    n_ev = len(WAIT_EVENTS)
    last = [0] * n_ev
    gaps = [[] for _ in range(n_ev)]
    run = longest = 0
    for t in range(1, rounds + 1):
        f = flags[min(bisect.bisect_left(cdf, rnd.random()), len(flags) - 1)]
        for e in range(n_ev):
            if f[e]:
                gaps[e].append(t - last[e])
                last[e] = t
        if f[n_ev]:
            run += 1
            longest = max(longest, run)
        else:
            run = 0
    out = {}
    for e, (name, _) in enumerate(WAIT_EVENTS):
        g = sorted(gaps[e])
        out[name] = {"n": len(g), "median": g[len(g) // 2] if g else None,
                     "p90": g[int(0.9 * (len(g) - 1))] if g else None}
    out["longest_x0_run"] = longest
    return out


def monte_carlo(dist: dict[F, F], rounds: int, sessions: int = 10000, seed: int = 42) -> dict:
    rnd = random.Random(seed)
    mults = [float(m) for m in dist]
    cdf, c = [], 0.0
    for p in dist.values():
        c += float(p)
        cdf.append(c)
    finals = []
    for _ in range(sessions):
        net = 0.0
        for _ in range(rounds):
            i = min(bisect.bisect_left(cdf, rnd.random()), len(mults) - 1)
            net += mults[i] - 1.0
        finals.append(net)
    finals.sort()
    q = lambda x: finals[int(x * (len(finals) - 1))]
    return {"p_profit": sum(f > 0 for f in finals) / len(finals), "p5": q(0.05), "median": q(0.5), "p95": q(0.95)}


# --------------------------------------------------------------------------- formatting

def one_in(p) -> str:
    return f"1 / {1 / float(p):,.0f}".replace(",", " ")


def pct(p, d=3) -> str:
    return f"{float(p) * 100:.{d}f} %"


def fmt_m(m: F) -> str:
    return f"x{float(m):g}"


def fmt_int(n) -> str:
    return f"{n:,}".replace(",", " ")


def analyse_all(cfg: dict) -> list[tuple[dict, dict, dict]]:
    return [(lv, b, stats(b["dist"])) for lv in cfg["levels"] for b in [build(lv, cfg)]]


def md_summary(data) -> str:
    lines = ["| Indicateur | " + " | ".join(lv["label"] for lv, _, _ in data) + " |",
             "|---" * (len(data) + 1) + "|"]

    def row(label, f):
        lines.append(f"| {label} | " + " | ".join(f(lv, b, s) for lv, b, s in data) + " |")

    row("RTP (exact)", lambda lv, b, s: pct(s["rtp"], 4))
    row("House edge", lambda lv, b, s: pct(s["house_edge"], 2))
    row("P(perte x0)", lambda lv, b, s: pct(s["p_loss"], 2))
    row("Hit rate (paiement > 0)", lambda lv, b, s: f"{pct(s['p_win'], 2)} ({one_in(s['p_win'])})")
    row("P(paiement >= mise)", lambda lv, b, s: pct(s["p_ge_bet"], 2))
    row("Ecart-type (sigma, en mises)", lambda lv, b, s: f"{s['sd']:.2f}")
    row("Variance", lambda lv, b, s: f"{s['var']:.1f}")
    row("Mediane", lambda lv, b, s: fmt_m(s["median"]))
    row("Max win", lambda lv, b, s: fmt_m(s["max"]))
    row("Frequence max win", lambda lv, b, s: one_in(s["p_max"]))
    row("BOSS FIGHT", lambda lv, b, s: one_in(sum(r["p"] for r in b["rows"] if r["src"] == "boss_fight")))
    row("EV d'un BOSS FIGHT", lambda lv, b, s: f"x{float(b['ev_bonus']):.2f}")
    row("Part RTP du BOSS FIGHT", lambda lv, b, s: pct(b["share_bonus"], 2))
    row("CVaR 99.9 % (limite SDK 800)", lambda lv, b, s: f"{s['cvar']:.1f}")
    row("ETL40 (limite SDK 0.9)", lambda lv, b, s: f"{s['etl40']:.3f}")
    row("P(>= x5000) (limite SDK 1 %)", lambda lv, b, s: f"{s['p5k']:.2e}")
    return "\n".join(lines)


def md_distributions(data, cfg) -> str:
    out = []
    for lv, b, s in data:
        vol = {"low": "basse", "medium": "moyenne", "high": "haute"}.get(lv["volatility"], lv["volatility"])
        out.append(f"### {lv['label']} (volatilite {vol}), max {fmt_m(lv['max_win'])}\n")
        out.append(f"BOSS FIGHT : EV = {float(b['ev_bonus']):.4f}x, frequence {one_in(cfg['bf_freq'])}, "
                   f"part de RTP = {pct(b['share_bonus'])}\n")
        out.append("| Source | Multiplicateur | Part de RTP | Probabilite | Frequence |")
        out.append("|---|---|---|---|---|")
        for r in b["rows"]:
            if r["src"] != "base":
                continue
            tag = " *(equilibre)*" if r["balance"] else ""
            out.append(f"| base | {fmt_m(r['m'])}{tag} | {pct(r['share'])} | {pct(r['p'], 4)} | {one_in(r['p'])} |")
        bf_p = sum(r["p"] for r in b["rows"] if r["src"] == "boss_fight")
        out.append(f"| BOSS FIGHT (8 tours gratuits, {len(b['bd'])} totaux possibles, detail §3) | "
                   f"{fmt_m(b['bd'][0][0])} a {fmt_m(b['bd'][-1][0])} | "
                   f"{pct(b['share_bonus'])} | {pct(bf_p, 4)} | {one_in(bf_p)} |")
        out.append(f"| — | **x0 (perte)** | 0 % | **{pct(s['p_loss'], 4)}** | — |")
        out.append(f"| **Total** | | **{pct(s['rtp'], 4)}** | 100 % | |\n")
        out.append("| Bande | Probabilite | Part de RTP |")
        out.append("|---|---|---|")
        for n, p, r in s["bands"]:
            out.append(f"| {n} | {pct(p)} | {pct(r, 2)} |")
        out.append("")
    return "\n".join(out)


def bonus_quantile(bd: list[tuple[F, F]], q: F) -> F:
    cum = F(0)
    for m, p in bd:
        cum += p
        if cum >= q:
            return m
    return bd[-1][0]


def md_free_rounds(data, cfg) -> str:
    lines = ["Le BOSS FIGHT se joue dans la MEME manche que la mise qui le declenche (un book, un Play, "
             "comme les free spins Stake Engine). Regles : `free_rounds_doc` de `config/rage_levels.json`.\n"]
    for lv, b, _ in data:
        fr = lv["fr"]
        mu = sum(m * p for m, p in fr["bases"])
        lines.append(f"**{lv['label']}** : {fr['rounds']} tours, P(HIT) = {pct(fr['p_hit'], 0)}, rage x{fr['rage_start']} "
                     f"puis +{fr['rage_step']} par HIT, plafond {fmt_m(lv['max_win'])}\n")
        lines.append("| Base d'un HIT | Probabilite (sachant HIT) |")
        lines.append("|---|---|")
        for m, p in fr["bases"]:
            lines.append(f"| {fmt_m(m)} | {pct(p, 1)} |")
        lines.append(f"\nBase moyenne d'un HIT = x{float(mu):.3f}\n")
        cap_p = dict(b["bd"]).get(lv["max_win"], F(0))
        lines.append("| Total du bonus | Valeur |")
        lines.append("|---|---|")
        lines.append(f"| EV d'un BOSS FIGHT | **x{float(b['ev_bonus']):.2f}** |")
        for label, q in (("P10", F(1, 10)), ("P25", F(1, 4)), ("Mediane", F(1, 2)), ("P75", F(3, 4)),
                         ("P90", F(9, 10)), ("P99", F(99, 100))):
            lines.append(f"| {label} | {fmt_m(bonus_quantile(b['bd'], q))} |")
        lines.append(f"| P(total < x10) | {pct(sum(p for m, p in b['bd'] if m < 10), 2)} |")
        lines.append(f"| P(plafond {fmt_m(lv['max_win'])}) par bonus | {pct(cap_p, 4)} ({one_in(cap_p) if cap_p else '—'}) |")
        lines.append(f"| P(plafond) par manche | {one_in(cap_p * cfg['bf_freq']) if cap_p else '—'} |\n")
    return "\n".join(lines)


def md_streaks(data) -> str:
    out = ["Deux definitions : **perte seche** = paiement x0 ; **manche perdante** = paiement < mise "
           "(x0 et x0.5 RECOVERED). Calcul exact (chaine de Markov).\n"]
    for key, label in (("p_loss", "perte seche (x0)"), ("p_below_bet", "manche perdante (< mise)")):
        out.append(f"#### Series de {label}\n")
        out.append("| | " + " | ".join(lv["label"] for lv, _, _ in data) + " |")
        out.append("|---" * (len(data) + 1) + "|")
        out.append("| P(une manche) | " + " | ".join(pct(s[key], 2) for _, _, s in data) + " |")
        for k in STREAK_LENGTHS:
            out.append(f"| P({k} d'affilee a partir de maintenant) | "
                       + " | ".join(f"{float(s[key]) ** k * 100:.4g} %" for _, _, s in data) + " |")
        for n in SESSION_LENGTHS:
            for k in STREAK_LENGTHS:
                out.append(f"| P(au moins une serie >= {k} sur {n} manches) | "
                           + " | ".join(f"{p_run_at_least(float(s[key]), k, n) * 100:.2f} %" for _, _, s in data)
                           + " |")
        for n in SESSION_LENGTHS:
            out.append(f"| Plus longue serie typique (mediane) sur {n} manches | "
                       + " | ".join(str(median_longest_run(float(s[key]), n)) for _, _, s in data) + " |")
        out.append("")
    return "\n".join(out)


def md_waits(data, sims) -> str:
    out = ["Nombre de manches **jusqu'a l'evenement inclus**. Exact = loi geometrique ; "
           f"simule = {fmt_int(SIM_ROUNDS)} manches tirees dans la distribution complete (graine {SIM_SEED}).\n",
           "| Rage Level | Evenement | Probabilite / manche | Moyenne | Mediane exacte | Mediane simulee | "
           "P90 exact | P90 simule | Echantillons |",
           "|---|---|---|---|---|---|---|---|---|"]
    for (lv, b, _), sim in zip(data, sims):
        for name, pred in WAIT_EVENTS:
            p = float(event_probability(b["rows"], pred))
            g = geometric_wait(p)
            sm = sim[name] if sim else None
            out.append(f"| {lv['label']} | {name} | {one_in(p)} | {g['mean']:.0f} | {g['median']} | "
                       f"{sm['median'] if sm else '—'} | {g['p90']} | {sm['p90'] if sm else '—'} | "
                       f"{fmt_int(sm['n']) if sm else '—'} |")
    if sims and all(sims):
        out.append("\nPlus longue serie de x0 observee dans la simulation : "
                   + ", ".join(f"{lv['label']} {sim['longest_x0_run']}" for (lv, _, _), sim in zip(data, sims))
                   + f" (sur {fmt_int(SIM_ROUNDS)} manches chacun).")
    return "\n".join(out)


def md_sessions(data) -> str:
    out = ["| Rage Level | Manches | P(finir gagnant) | P5 | Mediane | P95 |", "|---|---|---|---|---|---|"]
    for lv, b, _ in data:
        for n in SESSION_LENGTHS:
            mc = monte_carlo(b["dist"], n)
            out.append(f"| {lv['label']} | {n} | {mc['p_profit'] * 100:.1f} % | {mc['p5']:+.1f} | "
                       f"{mc['median']:+.1f} | {mc['p95']:+.1f} |")
    return "\n".join(out)


def md_lut(data) -> str:
    out = ["Avec 8 tours gratuits, le PPCM des denominateurs depasse 2^64 : les poids sont arrondis au plus proche "
           f"sur un total fixe de {fmt_int(LUT_ROUNDED_TOTAL)} (plus fort reste). Le RTP EXACT du modele reste 96,5 % ; "
           "l'ecart du RTP recalcule depuis les entiers est affiche ci-dessous. En production, les books du math-sdk "
           "seront ponderes par son optimiseur.\n",
           "| Rage Level | Total des poids | < 2^64 | RTP recalcule depuis les entiers | Ecart au RTP exact |",
           "|---|---|---|---|---|"]
    for lv, b, s in data:
        total, w = integer_weights(b["dist"])
        rtp = F(sum(int(m * 100) * wt for m, wt in w.items()), 100 * total)
        out.append(f"| {lv['label']} | {fmt_int(total)} | {'OK' if total < 2**64 else 'NON'} | {pct(rtp, 6)} | "
                   f"{float(rtp - s['rtp']):+.2e} |")
    lv, b, _ = data[1] if len(data) > 1 else data[0]
    total, w = integer_weights(b["dist"])
    base_pays = {F(0)} | {m for m, _ in lv["base"]}
    out += ["", f"Detail {lv['label']} (lignes de base ; les totaux du BOSS FIGHT sont resumes en une ligne) :", "",
            "| payoutMultiplier (entier Stake) | Poids entier | RTP partiel |", "|---|---|---|"]
    for m, wt in w.items():
        if m in base_pays:
            pay = int(m * 100)
            out.append(f"| {pay} | {fmt_int(wt)} | {pct(F(pay * wt, 100 * total), 4)} |")
    rest = {m: wt for m, wt in w.items() if m not in base_pays}
    rest_rtp = F(sum(int(m * 100) * wt for m, wt in rest.items()), 100 * total)
    out.append(f"| autres totaux du BOSS FIGHT ({len(rest)} valeurs, de {int(min(rest) * 100)} a {int(max(rest) * 100)}) | "
               f"{fmt_int(sum(rest.values()))} | {pct(rest_rtp, 4)} |")
    return "\n".join(out)


def markdown_report(cfg: dict, with_sim: bool) -> str:
    data = analyse_all(cfg)
    sims = [simulate_waits(b["rows"]) if with_sim else None for _, b, _ in data]
    parts = [
        "# BAD BOSS — rapport mathematique genere",
        "",
        "> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**",
        "",
        "> **Fichier genere** par `python3 math/model/bad_boss_math.py --write-report docs/generated/MATH_REPORT.md`."
        " Ne pas modifier a la main : modifier `config/rage_levels.json` puis regenerer.",
        f"> RTP cible : {pct(cfg['target_rtp'], 2)} ({cfg['target_rtp_status']}).",
        "",
        "## 1. Synthese", "", md_summary(data), "",
        "## 2. Distributions detaillees", "", md_distributions(data, cfg),
        "## 3. BOSS FIGHT : 8 tours gratuits", "", md_free_rounds(data, cfg),
        "## 4. Series de pertes", "", md_streaks(data),
        "## 5. Attente avant evenement", "", md_waits(data, sims), "",
    ]
    if with_sim:
        parts += ["## 6. Sessions (Monte Carlo, 10 000 sessions, mise fixe 1, resultat net en mises)", "",
                  md_sessions(data), ""]
    parts += ["## 7. Lookup tables : poids entiers exacts", "", md_lut(data), ""]
    return "\n".join(parts)


def text_report(cfg: dict, with_sim: bool) -> None:
    print(f"TARGET_RTP = {cfg['target_rtp']} ({pct(cfg['target_rtp'], 2)}) — {cfg['target_rtp_status']}")
    for lv, b, s in analyse_all(cfg):
        total, _ = integer_weights(b["dist"])
        print(f"\n=== {lv['label']} ({lv['id']}) ===")
        print(f"  RTP exact = {s['rtp']} = {pct(s['rtp'], 6)}   BOSS FIGHT EV = x{float(b['ev_bonus']):.4f}")
        print(f"  P(x0) = {pct(s['p_loss'])}  hit = {pct(s['p_win'])}  P(>=1x) = {pct(s['p_ge_bet'])}")
        print(f"  sigma = {s['sd']:.3f}  max = {fmt_m(s['max'])} ({one_in(s['p_max'])})")
        checks = {"rtp": s["rtp"] <= SDK_LIMITS["rtp"], "cvar": s["cvar"] <= SDK_LIMITS["cvar"],
                  "etl40": s["etl40"] <= SDK_LIMITS["etl40"], "p5k": s["p5k"] <= SDK_LIMITS["p5k"],
                  "p10k": s["p10k"] <= SDK_LIMITS["p10k"]}
        print(f"  SDK checks: {checks}  cvar={s['cvar']:.1f} etl40={s['etl40']:.3f}")
        print(f"  integer weight total = {total} (< 2^64: {total < 2**64})")
        q0 = float(s["p_loss"])
        print("  x0 streaks, next k rounds: " + ", ".join(f"{k}: {q0 ** k * 100:.3g} %" for k in STREAK_LENGTHS))
        print("  P(>=1 run of k x0 in 300 rounds): "
              + ", ".join(f"{k}: {p_run_at_least(q0, k, 300) * 100:.2f} %" for k in STREAK_LENGTHS))
        for name, pred in WAIT_EVENTS:
            g = geometric_wait(float(event_probability(b["rows"], pred)))
            print(f"  wait {name:<12}: mean {g['mean']:.0f}, median {g['median']}, p90 {g['p90']}")
        if with_sim:
            sim = simulate_waits(b["rows"])
            print("  simulated medians: " + ", ".join(f"{n}: {sim[n]['median']} (n={sim[n]['n']})"
                                                     for n, _ in WAIT_EVENTS)
                  + f", longest x0 run: {sim['longest_x0_run']}")


def main():
    args = sys.argv[1:]
    if "--list-variants" in args:
        raw = json.loads(CONFIG_PATH.read_text(encoding="utf-8")).get("experimental_variants", {})
        for key, v in raw.items():
            if not key.startswith("_"):
                print(f"{key}: [{v.get('status')}] {v.get('description')}")
        return
    variant = args[args.index("--variant") + 1] if "--variant" in args else None
    cfg = load_config(variant=variant)
    if variant:
        cfg["target_rtp_status"] += f" | VARIANTE EXPERIMENTALE ACTIVE : {variant} (ne pas publier)"
    with_sim = "--quick" not in args
    if "--write-report" in args:
        target = Path(args[args.index("--write-report") + 1])
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(markdown_report(cfg, with_sim), encoding="utf-8")
        print(f"Rapport ecrit : {target}")
    elif "--markdown" in args:
        print(markdown_report(cfg, with_sim))
    else:
        text_report(cfg, with_sim)


if __name__ == "__main__":
    main()
