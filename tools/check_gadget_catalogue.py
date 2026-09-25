"""Verifie le catalogue des gadgets (docs/GDD_04b_CATALOGUE_15_GADGETS.md).

Regles controlees (GDD_04 §5.6) :
  1. Regle des deux issues : chaque etat visible au point de divergence D1 mene
     a au moins une issue gagnante (W*, FW*, BW, BF) ET au moins une perte (L*, FL).
  2. Equilibre des etats : chaque etat contient au moins une branche gagnante
     DIRECT ou COMEBACK de rarete "common", et au moins une perte "common".
  3. Chaque gadget a au moins 4 branches de perte (L* + FL), une branche par
     categorie obligatoire, et autant de lignes de production que de branches.

Usage : python3 tools/check_gadget_catalogue.py   (code retour 1 si une regle echoue)
"""

from __future__ import annotations

import re
import sys
from collections import defaultdict
from pathlib import Path

CATALOGUE = Path(__file__).resolve().parents[1] / "docs" / "GDD_04b_CATALOGUE_15_GADGETS.md"
REQUIRED = {"CLEAN_MISS", "BACKFIRE", "TEASE", "DIRECT", "COMEBACK", "CHAIN", "BF_ENTRY"}
ROW = re.compile(r"^\| ([A-Z]{3})-([A-Z0-9]+) \|")


def is_loss(branch: str) -> bool:
    return branch.startswith("L") or branch == "FL"


def is_win(branch: str) -> bool:
    return branch.startswith("W") or branch.startswith("FW") or branch in ("BW", "BF")


def main() -> int:
    story = defaultdict(list)       # code -> [(branch, state, category, rarity)]
    production = defaultdict(set)   # code -> {branch}
    for line in CATALOGUE.read_text(encoding="utf-8").splitlines():
        m = ROW.match(line)
        if not m:
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        code, branch = m.group(1), m.group(2)
        if len(cells) == 6:
            story[code].append((branch, cells[1], cells[2].split(" ")[0], cells[3]))
        elif len(cells) == 10:
            production[code].add(branch)

    errors = []
    for code, rows in story.items():
        states = defaultdict(list)
        for branch, state, cat, rarity in rows:
            states[state].append((branch, cat, rarity))
        for state, items in states.items():
            if not (any(is_win(b) for b, _, _ in items) and any(is_loss(b) for b, _, _ in items)):
                errors.append(f"{code} etat '{state}' : regle des deux issues violee {items}")
            if not any(c in ("DIRECT", "COMEBACK") and r == "common" for _, c, r in items):
                errors.append(f"{code} etat '{state}' : aucune branche gagnante common")
            if not any(c in ("CLEAN_MISS", "BACKFIRE", "TEASE") and r == "common" for _, c, r in items):
                errors.append(f"{code} etat '{state}' : aucune perte common")
        losses = sum(1 for b, *_ in rows if is_loss(b))
        if losses < 4:
            errors.append(f"{code} : seulement {losses} branches de perte (minimum 4)")
        missing = REQUIRED - {cat for _, _, cat, _ in rows}
        if missing:
            errors.append(f"{code} : categories manquantes {sorted(missing)}")
        if {b for b, *_ in rows} != production[code]:
            errors.append(f"{code} : tableau de production incoherent avec le tableau narratif")

    total = sum(len(r) for r in story.values())
    print(f"{len(story)} gadgets, {total} branches verifiees.")
    for e in errors:
        print("ERREUR :", e)
    print("OK" if not errors else f"{len(errors)} erreur(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
