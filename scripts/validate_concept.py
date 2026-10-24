#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Validate concept data files (structure / required fields / duplicates / lengths).

Usage:
    python scripts/validate_concept.py data/concept-pharm.js [more ...]
"""

import json
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

WINDOW_RE = re.compile(r"window\.(\w+)\s*=\s*")
TYPES = {"term", "qa", "judge"}
HTML_RE = re.compile(r"<[a-zA-Z/][^>]*>")


def load(path):
    text = Path(path).read_text(encoding="utf-8-sig")
    m = WINDOW_RE.search(text)
    if not m:
        raise SystemExit("[%s] missing 'window.XXX = ' assignment" % path)
    body = text[m.end():].strip()
    if body.endswith(";"):
        body = body[:-1].strip()
    return m.group(1), json.loads(body)


def check(path, data, seen_ids, seen_q):
    errors, warnings = [], []
    chapters = data.get("chapters")
    if not isinstance(chapters, list) or not chapters:
        errors.append("chapters must be a non-empty list")
        return errors, warnings, 0, {}
    total = 0
    type_count = {}
    for ci, ch in enumerate(chapters):
        title = ch.get("title")
        if not isinstance(title, str) or not title.strip():
            errors.append("chapter #%d has empty title" % ci)
            title = "chapter#%d" % ci
        items = ch.get("items")
        if not isinstance(items, list) or not items:
            errors.append("[%s] has no items" % title)
            continue
        for qi, it in enumerate(items):
            loc = "%s item#%d" % (title, qi + 1)
            if not isinstance(it, dict):
                errors.append("%s: not an object" % loc)
                continue
            qid = it.get("id")
            if not isinstance(qid, str) or not qid.strip():
                errors.append("%s: missing id" % loc)
            elif qid in seen_ids:
                errors.append("%s: duplicate id %s (also in %s)" % (loc, qid, seen_ids[qid]))
            else:
                seen_ids[qid] = path
            qtype = it.get("type")
            if qtype not in TYPES:
                errors.append("%s: bad type %r" % (loc, qtype))
                continue
            type_count[qtype] = type_count.get(qtype, 0) + 1
            q = it.get("q")
            if not isinstance(q, str) or len(q.strip()) < 2:
                errors.append("%s: empty q" % loc)
            else:
                norm = re.sub(r"\s+", "", q)
                if norm in seen_q:
                    errors.append("%s: duplicate q (also in %s)" % (loc, seen_q[norm]))
                else:
                    seen_q[norm] = path
                if HTML_RE.search(q):
                    warnings.append("%s: HTML tag in q" % loc)
            a = it.get("a")
            if qtype == "judge":
                if not isinstance(a, bool):
                    errors.append("%s: judge a must be true/false, got %r" % (loc, a))
                why = it.get("why")
                if not isinstance(why, str) or len(why.strip()) < 8:
                    errors.append("%s: judge why missing/too short" % loc)
                elif HTML_RE.search(why):
                    warnings.append("%s: HTML tag in why" % loc)
                if len(q or "") > 160:
                    warnings.append("%s: judge statement very long (%d chars)" % (loc, len(q)))
            else:
                if not isinstance(a, str) or len(a.strip()) < 8:
                    errors.append("%s: a missing/too short" % loc)
                else:
                    if len(a) > 600:
                        warnings.append("%s: answer very long (%d chars)" % (loc, len(a)))
                    if HTML_RE.search(a):
                        warnings.append("%s: HTML tag in a" % loc)
            hint = it.get("hint")
            if hint is not None and (not isinstance(hint, str) or len(hint) > 60):
                warnings.append("%s: hint should be a short string" % loc)
            total += 1
    print("[%s]" % path)
    print("  chapters: %d, items: %d" % (len(chapters), total))
    for ch in chapters:
        print("    - %s: %d" % (ch.get("title"), len(ch.get("items") or [])))
    print("  types: %s" % type_count)
    print("  errors: %d, warnings: %d" % (len(errors), len(warnings)))
    for e in errors[:60]:
        print("  ERROR: %s" % e)
    if len(errors) > 60:
        print("  ... %d more errors" % (len(errors) - 60))
    for w in warnings[:10]:
        print("  WARN: %s" % w)
    return errors, warnings, total, type_count


def main():
    paths = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not paths:
        print("usage: python scripts/validate_concept.py <data file> [...]")
        return 2
    seen_ids, seen_q = {}, {}
    all_errors = []
    total = 0
    for path in paths:
        if not Path(path).exists():
            print("[%s] FILE NOT FOUND" % path)
            all_errors.append(path)
            continue
        var, data = load(path)
        print("global variable: %s" % var)
        errors, warnings, n, _ = check(path, data, seen_ids, seen_q)
        all_errors.extend(errors)
        total += n
    print()
    print("TOTAL items: %d, TOTAL errors: %d" % (total, len(all_errors)))
    if all_errors:
        print("VALIDATION FAILED")
        return 1
    print("VALIDATION OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
