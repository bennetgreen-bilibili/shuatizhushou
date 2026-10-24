#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Assemble handbook chapter JSON parts into one JS data file.

Usage:
    python scripts/build_handbook.py --parts data/_parts/handbook/pharm \
        --out data/handbook-pharm.js --global HANDBOOK_PHARM

Each part file (sorted by filename) is:
    {"title": "...", "summary": "...", "blocks": [ {...}, ... ]}
"""

import argparse
import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

BLOCK_TYPES = ("defs", "points", "table", "notes")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--parts", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--global", dest="global_name", required=True)
    args = ap.parse_args()

    files = sorted(Path(args.parts).glob("*.json"))
    if not files:
        raise SystemExit("no *.json parts found in %s" % args.parts)

    chapters = []
    for f in files:
        obj = json.loads(f.read_text(encoding="utf-8-sig"))
        title = obj.get("title")
        summary = obj.get("summary")
        blocks = obj.get("blocks")
        if not isinstance(title, str) or not title.strip():
            raise SystemExit("[%s] missing title" % f)
        if not isinstance(summary, str) or not summary.strip():
            raise SystemExit("[%s] missing summary" % f)
        if not isinstance(blocks, list) or not blocks:
            raise SystemExit("[%s] missing/empty blocks" % f)
        for b in blocks:
            if not isinstance(b, dict) or b.get("t") not in BLOCK_TYPES:
                raise SystemExit("[%s] bad block: %r" % (f, b))
        chapters.append({
            "title": title.strip(),
            "summary": summary.strip(),
            "blocks": blocks,
        })
        n_defs = sum(len(b.get("items") or []) for b in blocks if b.get("t") == "defs")
        n_points = sum(len(b.get("items") or []) for b in blocks if b.get("t") == "points")
        n_tables = sum(1 for b in blocks if b.get("t") == "table")
        n_notes = sum(len(b.get("items") or []) for b in blocks if b.get("t") == "notes")
        print("  %-38s defs=%-2d points=%-2d tables=%d notes=%d" % (title, n_defs, n_points, n_tables, n_notes))

    payload = {"chapters": chapters}
    text = "window.%s = %s;\n" % (
        args.global_name,
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
    )
    Path(args.out).write_text(text, encoding="utf-8")
    print("wrote %s: %d chapters, %d bytes" % (args.out, len(chapters), len(text.encode("utf-8"))))


if __name__ == "__main__":
    main()
