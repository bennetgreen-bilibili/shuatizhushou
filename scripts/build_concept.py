#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Assemble concept (名词解释 / 简答 / 辨析) chapter JSON parts into one JS data file.

Usage:
    python scripts/build_concept.py --parts data/_parts/concept/pharm --out data/concept-pharm.js \
        --global CONCEPT_PHARM --id-prefix phc

Each part file (sorted by filename) must be a JSON object:
    {"title": "第一章 ...", "items": [ {...}, ... ]}
Item fields by type:
    term : {type, q, a, hint?}
    qa   : {type, q, a, hint?}
    judge: {type, q, a (bool), why}
id / chapterIdx / num are generated automatically.
"""

import argparse
import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

TYPES = ("term", "qa", "judge")


def norm_item(item, prefix, ci, qi):
    qtype = item.get("type")
    if qtype not in TYPES:
        raise SystemExit("[%s] item #%d: bad type %r" % (prefix, qi + 1, qtype))
    out = {"id": "%s%02di%02d" % (prefix, ci + 1, qi + 1), "type": qtype, "q": item.get("q")}
    if qtype == "judge":
        out["a"] = bool(item.get("a"))
        out["why"] = item.get("why")
    else:
        out["a"] = item.get("a")
    hint = item.get("hint")
    if isinstance(hint, str) and hint.strip():
        out["hint"] = hint.strip()
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--parts", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--global", dest="global_name", required=True)
    ap.add_argument("--id-prefix", required=True)
    args = ap.parse_args()

    files = sorted(Path(args.parts).glob("*.json"))
    if not files:
        raise SystemExit("no *.json parts found in %s" % args.parts)

    chapters = []
    total = 0
    for f in files:
        obj = json.loads(f.read_text(encoding="utf-8-sig"))
        title = obj.get("title")
        items = obj.get("items")
        if not isinstance(title, str) or not title.strip():
            raise SystemExit("[%s] missing title" % f)
        if not isinstance(items, list) or not items:
            raise SystemExit("[%s] missing/empty items" % f)
        chapters.append((title.strip(), items))

    out_chapters = []
    for ci, (title, items) in enumerate(chapters):
        new_items = [norm_item(it, args.id_prefix, ci, qi) for qi, it in enumerate(items)]
        out_chapters.append({"title": title, "items": new_items})
        total += len(new_items)
        print("  %s: %d" % (title, len(new_items)))

    payload = {"chapters": out_chapters}
    text = "window.%s = %s;\n" % (
        args.global_name,
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
    )
    Path(args.out).write_text(text, encoding="utf-8")
    print("wrote %s: %d chapters, %d items, %d bytes" % (args.out, len(out_chapters), total, len(text.encode("utf-8"))))


if __name__ == "__main__":
    main()
