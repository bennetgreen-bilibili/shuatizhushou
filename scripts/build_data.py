#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Assemble chapter JSON parts into a single quiz data JS file.

Usage:
    python scripts/build_data.py --parts data/_parts/organic --out data/organic.js \
        --global ORGANIC_DATA --id-prefix org

Each part file (sorted by filename) must be a JSON object:
    {"title": "第一章 ...", "questions": [ {...}, ... ]}
Question fields: type (A/X), stem, options {A..E}, answer [..], rationale, expl {A..E}.
id / chapter / chapterIdx / num are generated automatically.
"""

import argparse
import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--parts", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--global", dest="global_name", required=True)
    ap.add_argument("--id-prefix", required=True)
    args = ap.parse_args()

    parts_dir = Path(args.parts)
    files = sorted(parts_dir.glob("*.json"))
    if not files:
        raise SystemExit("no *.json parts found in %s" % parts_dir)

    chapters = []
    for f in files:
        try:
            obj = json.loads(f.read_text(encoding="utf-8-sig"))
        except json.JSONDecodeError as exc:
            raise SystemExit("[%s] JSON parse error: %s" % (f, exc))
        if not isinstance(obj, dict):
            raise SystemExit("[%s] chapter file must be a JSON object" % f)
        title = obj.get("title")
        questions = obj.get("questions")
        if not isinstance(title, str) or not title.strip():
            raise SystemExit("[%s] missing title" % f)
        if not isinstance(questions, list) or not questions:
            raise SystemExit("[%s] missing/empty questions" % f)
        chapters.append((title, questions))

    out_chapters = []
    total = 0
    for ci, (title, questions) in enumerate(chapters):
        new_questions = []
        for qi, q in enumerate(questions):
            if not isinstance(q, dict):
                raise SystemExit("[%s] question #%d is not an object" % (title, qi + 1))
            q = dict(q)
            # normalize option / explanation order to A-E so the UI always shows A first
            if isinstance(q.get("options"), dict):
                q["options"] = {k: q["options"][k] for k in "ABCDE" if k in q["options"]}
            if isinstance(q.get("expl"), dict):
                q["expl"] = {k: q["expl"][k] for k in "ABCDE" if k in q["expl"]}
            q["id"] = "%s%02d_q%02d" % (args.id_prefix, ci + 1, qi + 1)
            q["chapter"] = title
            q["chapterIdx"] = ci
            q["num"] = qi + 1
            q.setdefault("type", "A")
            new_questions.append(q)
        out_chapters.append({"title": title, "questions": new_questions})
        total += len(new_questions)
        print("  %s: %d" % (title, len(new_questions)))

    payload = {"chapters": out_chapters}
    text = "window.%s = %s;\n" % (
        args.global_name,
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
    )
    out_path = Path(args.out)
    out_path.write_text(text, encoding="utf-8")
    print("wrote %s: %d chapters, %d questions, %d bytes" % (out_path, len(out_chapters), total, len(text.encode("utf-8"))))


if __name__ == "__main__":
    main()
