"""BAD BOSS - modele mathematique de reference (etape 4 du GDD).

Calculateur autonome (stdlib Python 3 uniquement) qui :
  1. construit la distribution de chaque niveau de rage (= un bet mode Stake Engine),
  2. verifie le RTP de facon EXACTE (fractions rationnelles, aucun arrondi),
  3. calcule hit rate, bandes de gains, variance, ecart-type, max win,
  4. reproduit les controles locaux du math-sdk officiel Stake Engine
     (utils/rgs_verification.py : rtp, cvar, etl40b, prob5k, prob10k),
  5. convertit la distribution en poids entiers uint64 prets pour un lookup table CSV,
  6. simule des sessions (Monte Carlo) pour illustrer la volatilite ressentie.

Ce n'est PAS le generateur de books final : en phase 2 ces tables seront
portees dans le math-sdk Stake Engine (generation des books .jsonl.zst + CSV).

Usage :
    python3 math/model/bad_boss_math.py            # rapport texte complet
    python3 math/model/bad_boss_math.py --markdown # tableaux markdown pour le GDD
"""

from __future__ import annotations

import bisect
import math
import random
import sys
from fractions import Fraction as F
from functools import reduce

TARGET_RTP = F(965, 1000)  # 96.5 % pour CHAQUE mode (house edge 3.5 %)

# Echelle du BOSS FIGHT : chaque coup reussi fait monter d'un palier.
BOSS_FIGHT_LADDER = [5, 12, 30, 75, 200, 500, 1000, 2000, 5000]

# Frequence du BOSS FIGHT identique dans les 3 modes : 1 manche sur 150.
BOSS_FIGHT_FREQ = F(1, 150)

# Chaque ligne de base = (multiplicateur, part de RTP allouee).
# Une seule ligne par mode a une part None : c'est la ligne d'equilibrage
# qui recoit le reste du budget RTP pour atteindre exactement TARGET_RTP.
TIERS = {
    "GRUMPY": {
        "label": "GRUMPY (volatilite basse)",
        "rungs": 5,  # x5 -> x200
        "cont": [F(45, 100), F(35, 100), F(30, 100), F(25, 100)],
        "base": [
            (F(1, 2), F(80, 1000)),
            (F(12, 10), None),
            (F(15, 10), F(180, 1000)),
            (F(2), F(140, 1000)),
            (F(3), F(100, 1000)),
            (F(5), F(80, 1000)),
            (F(10), F(50, 1000)),
            (F(25), F(35, 1000)),
        ],
    },
    "FURIOUS": {
        "label": "FURIOUS (volatilite moyenne)",
        "rungs": 7,  # x5 -> x1000
        "cont": [F(50, 100), F(45, 100), F(40, 100), F(35, 100), F(30, 100), F(25, 100)],
        "base": [
            (F(1, 2), F(40, 1000)),
            (F(15, 10), F(130, 1000)),
            (F(2), None),
            (F(3), F(120, 1000)),
            (F(5), F(100, 1000)),
            (F(10), F(80, 1000)),
            (F(25), F(70, 1000)),
            (F(50), F(50, 1000)),
            (F(100), F(40, 1000)),
        ],
    },
    "UNHINGED": {
        "label": "UNHINGED (volatilite haute)",
        "rungs": 9,  # x5 -> x5000
        "cont": [F(55, 100), F(50, 100), F(45, 100), F(40, 100), F(35, 100), F(30, 100), F(25, 100), F(20, 100)],
        "base": [
            (F(15, 10), F(45, 1000)),
            (F(2), F(90, 1000)),
            (F(3), None),
            (F(5), F(80, 1000)),
            (F(10), F(80, 1000)),
            (F(25), F(75, 1000)),
            (F(50), F(70, 1000)),
            (F(100), F(60, 1000)),
            (F(250), F(50, 1000)),
            (F(500), F(45, 1000)),
        ],
    },
}

BANDS = [
    ("PERTE (x0)", F(0), F(0)),
    ("RECUP. (x0.1-x0.9)", F(1, 10), F(9, 10)),
    ("PETIT (x1-x4.9)", F(1), F(49, 10)),
    ("MOYEN (x5-x24.9)", F(5), F(249, 10)),
    ("GROS (x25-x99.9)", F(25), F(999, 10)),
    ("ENORME (x100-x999)", F(100), F(9999, 10)),
    ("LEGENDAIRE (x1000+)", F(1000), F(10**9)),
]


def boss_fight_distribution(rungs: int, cont: list[F]) -> list[tuple[F, F]]:
    """P(finir au palier k) = (prod des continuations avant k) * (1 - continuation k)."""
    ladder = BOSS_FIGHT_LADDER[:rungs]
    out, reach = [], F(1)
    for k, m in enumerate(ladder):
        if k < rungs - 1:
            out.append((F(m), reach * (1 - cont[k])))
            reach *= cont[k]
        else:
            out.append((F(m), reach))  # K.O. = dernier palier
    return out


def build(tier: dict) -> dict:
    bd = boss_fight_distribution(tier["rungs"], tier["cont"])
    ev_bonus = sum(m * p for m, p in bd)
    share_bonus = BOSS_FIGHT_FREQ * ev_bonus
    fixed = sum(s for _, s in tier["base"] if s is not None)
    balance = TARGET_RTP - share_bonus - fixed
    if balance <= 0:
        raise ValueError("Budget RTP negatif sur la ligne d'equilibrage")
    rows = []
    for m, s in tier["base"]:
        s = balance if s is None else s
        rows.append({"src": "base", "m": m, "share": s, "p": s / m})
    for m, p in bd:
        rows.append({"src": "boss_fight", "m": m, "share": BOSS_FIGHT_FREQ * p * m, "p": BOSS_FIGHT_FREQ * p})
    p_win = sum(r["p"] for r in rows)
    dist: dict[F, F] = {F(0): 1 - p_win}
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


def integer_weights(dist: dict[F, F]) -> tuple[int, dict[F, int]]:
    """Poids entiers EXACTS : total = PPCM des denominateurs (aucune erreur d'arrondi)."""
    total = reduce(lambda a, b: a * b // math.gcd(a, b), (p.denominator for p in dist.values()), 1)
    weights = {m: int(p * total) for m, p in dist.items()}
    assert sum(weights.values()) == total
    return total, weights


def monte_carlo(dist: dict[F, F], rounds: int, sessions: int = 20000, seed: int = 42) -> dict:
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


def one_in(p) -> str:
    return f"1 / {1 / float(p):,.0f}".replace(",", " ")


def pct(p, d=3) -> str:
    return f"{float(p) * 100:.{d}f} %"


def fmt_m(m: F) -> str:
    return f"x{float(m):g}"


def report_markdown() -> str:
    out = []
    for name, tier in TIERS.items():
        b = build(tier)
        s = stats(b["dist"])
        out.append(f"### {tier['label']}\n")
        out.append(f"BOSS FIGHT : EV = {float(b['ev_bonus']):.4f}x, frequence {one_in(BOSS_FIGHT_FREQ)}, "
                   f"part de RTP = {pct(b['share_bonus'])}\n")
        out.append("| Source | Multiplicateur | Part de RTP | Probabilite | Frequence |")
        out.append("|---|---|---|---|---|")
        for r in b["rows"]:
            src = "base" if r["src"] == "base" else "BOSS FIGHT"
            out.append(f"| {src} | {fmt_m(r['m'])} | {pct(r['share'])} | {pct(r['p'], 4)} | {one_in(r['p'])} |")
        out.append(f"| — | **x0 (perte)** | 0 % | **{pct(s['p_loss'], 4)}** | — |")
        out.append(f"| **Total** | | **{pct(s['rtp'], 4)}** | 100 % | |\n")
        out.append("| Bande | Probabilite | Part de RTP |")
        out.append("|---|---|---|")
        for n, p, r in s["bands"]:
            out.append(f"| {n} | {pct(p)} | {pct(r, 2)} |")
        out.append("")
    return "\n".join(out)


def summary_table() -> str:
    lines = ["| Indicateur | GRUMPY | FURIOUS | UNHINGED |", "|---|---|---|---|"]
    data = {n: (build(t), stats(build(t)["dist"])) for n, t in TIERS.items()}

    def row(label, f):
        lines.append(f"| {label} | " + " | ".join(f(*data[n]) for n in TIERS) + " |")

    row("RTP (exact)", lambda b, s: pct(s["rtp"], 4))
    row("House edge", lambda b, s: pct(s["house_edge"], 2))
    row("P(perte x0)", lambda b, s: pct(s["p_loss"], 2))
    row("Hit rate (paiement > 0)", lambda b, s: f"{pct(s['p_win'], 2)} ({one_in(s['p_win'])})")
    row("P(paiement >= mise)", lambda b, s: pct(s["p_ge_bet"], 2))
    row("Ecart-type (sigma, en mises)", lambda b, s: f"{s['sd']:.2f}")
    row("Variance", lambda b, s: f"{s['var']:.1f}")
    row("Mediane", lambda b, s: fmt_m(s["median"]))
    row("Max win", lambda b, s: fmt_m(s["max"]))
    row("Frequence max win", lambda b, s: one_in(s["p_max"]))
    row("BOSS FIGHT", lambda b, s: one_in(BOSS_FIGHT_FREQ))
    row("Part RTP du BOSS FIGHT", lambda b, s: pct(b["share_bonus"], 2))
    row("CVaR 99.9 % (limite SDK 800)", lambda b, s: f"{s['cvar']:.1f}")
    row("ETL40 (limite SDK 0.9)", lambda b, s: f"{s['etl40']:.3f}")
    row("P(>= x5000) (limite SDK 1 %)", lambda b, s: f"{s['p5k']:.2e}")
    return "\n".join(lines)


def ladder_table() -> str:
    lines = []
    for name, tier in TIERS.items():
        bd = boss_fight_distribution(tier["rungs"], tier["cont"])
        lines.append(f"**{name}**\n")
        lines.append("| Palier | Multiplicateur | P(enchainer le coup suivant) | P(atteindre ce palier) | P(finir ici) |")
        lines.append("|---|---|---|---|---|")
        reach = F(1)
        for k, (m, p_end) in enumerate(bd):
            c = tier["cont"][k] if k < len(tier["cont"]) else None
            lines.append(f"| {k + 1} | {fmt_m(m)} | {pct(c, 0) if c is not None else 'K.O. (fin)'} | "
                         f"{pct(reach, 3)} | {pct(p_end, 3)} |")
            if c is not None:
                reach *= c
        ev = sum(m * p for m, p in bd)
        lines.append(f"\nEV du BOSS FIGHT = {float(ev):.4f}x la mise\n")
    return "\n".join(lines)


def lut_preview(name: str) -> str:
    b = build(TIERS[name])
    total, w = integer_weights(b["dist"])
    lines = [f"Total des poids (PPCM des denominateurs) = {total:,}".replace(",", " "),
             f"(< 2^64 = {2**64:,} : {'OK' if total < 2**64 else 'TROP GRAND'})".replace(",", " "), "",
             "| payoutMultiplier (entier Stake) | Poids entier | RTP partiel exact |", "|---|---|---|"]
    rtp_num = 0
    for m, wt in w.items():
        pay_int = int(m * 100)
        rtp_num += pay_int * wt
        lines.append(f"| {pay_int} | {wt:,} | {pct(F(pay_int * wt, 100 * total), 4)} |".replace(",", " "))
    lines.append(f"\nRTP recalcule a partir des entiers = {rtp_num} / (100 x {total}) = "
                 f"**{pct(F(rtp_num, 100 * total), 6)}**")
    return "\n".join(lines)


def main():
    if "--markdown" in sys.argv:
        print("## Synthese\n")
        print(summary_table())
        print("\n## Distributions detaillees\n")
        print(report_markdown())
        print("## Echelles BOSS FIGHT\n")
        print(ladder_table())
        print("## Lookup table FURIOUS (poids entiers)\n")
        print(lut_preview("FURIOUS"))
        return
    for name, tier in TIERS.items():
        b = build(tier)
        s = stats(b["dist"])
        total, _ = integer_weights(b["dist"])
        print(f"=== {name} ===")
        print(f"  RTP exact = {s['rtp']} = {pct(s['rtp'], 6)}")
        print(f"  P(loss) = {pct(s['p_loss'])}  hit = {pct(s['p_win'])}  P(>=1x) = {pct(s['p_ge_bet'])}")
        print(f"  sigma = {s['sd']:.3f}  max = {fmt_m(s['max'])} ({one_in(s['p_max'])})")
        print(f"  SDK checks: cvar={s['cvar']:.1f} (<=800) etl40={s['etl40']:.3f} (<=0.9) "
              f"p5k={s['p5k']:.2e} (<=0.01) p10k={s['p10k']:.2e} (<=0.005) rtp<=0.967: {s['rtp'] <= F(967, 1000)}")
        print(f"  integer weight total = {total} (< 2^64: {total < 2**64})")
        for rounds in (100, 300, 1000):
            mc = monte_carlo(b["dist"], rounds, sessions=10000)
            print(f"  MC {rounds:>4} manches: P(benefice)={mc['p_profit']:.3f}  "
                  f"P5={mc['p5']:+.1f}  mediane={mc['median']:+.1f}  P95={mc['p95']:+.1f} (en mises)")


if __name__ == "__main__":
    main()
