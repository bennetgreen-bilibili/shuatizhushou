#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Validate quiz data files (structure + answers + explanations).

Usage:
    python scripts/validate.py data/organic.js [data/analytical.js ...]

Each file must assign a JSON object to a window variable, e.g.
    window.ORGANIC_DATA = { "chapters": [ ... ] };
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
REQUIRED = ("id", "type", "stem", "options", "answer", "rationale", "expl")
ALLOWED_TYPES = {"A", "B", "C", "X"}
OPTION_LETTERS = "ABCDE"


def load(path):
    text = Path(path).read_text(encoding="utf-8-sig")
    m = WINDOW_RE.search(text)
    if not m:
        raise SystemExit("[%s] missing 'window.XXX = ' assignment" % path)
    body = text[m.end():].strip()
    if body.endswith(";"):
        body = body[:-1].strip()
    try:
        return m.group(1), json.loads(body)
    except json.JSONDecodeError as exc:
        raise SystemExit("[%s] JSON parse error: %s" % (path, exc))


def check_file(path, data, seen_ids, seen_stems, legacy=False):
    errors = []
    warnings = []
    chapters = data.get("chapters")
    if not isinstance(chapters, list) or not chapters:
        errors.append("chapters must be a non-empty list")
        return errors, warnings, 0

    titles = []
    total = 0
    type_count = {}
    answer_count = {}

    for ci, ch in enumerate(chapters):
        title = ch.get("title")
        if not isinstance(title, str) or not title.strip():
            errors.append("chapter #%d has empty title" % ci)
            title = "chapter#%d" % ci
        if title in titles:
            errors.append("duplicate chapter title: %s" % title)
        titles.append(title)
        questions = ch.get("questions")
        if not isinstance(questions, list) or not questions:
            errors.append("[%s] has no questions" % title)
            continue
        for qi, q in enumerate(questions):
            loc = "%s q#%d" % (title, qi + 1)
            if not isinstance(q, dict):
                errors.append("%s: question is not an object" % loc)
                continue
            qid = q.get("id")
            if not isinstance(qid, str) or not qid.strip():
                errors.append("%s: missing id" % loc)
            elif qid in seen_ids:
                errors.append("%s: duplicate id %s (also in %s)" % (loc, qid, seen_ids[qid]))
            else:
                seen_ids[qid] = path
            for field in REQUIRED:
                if field not in q:
                    errors.append("%s: missing field '%s'" % (loc, field))
            qtype = q.get("type")
            if qtype not in ALLOWED_TYPES:
                errors.append("%s: bad type %r" % (loc, qtype))
            else:
                type_count[qtype] = type_count.get(qtype, 0) + 1

            stem = q.get("stem")
            if not isinstance(stem, str) or (len(stem.strip()) < 8 and qtype in ("A", "X")):
                if legacy:
                    warnings.append("%s: stem too short" % loc)
                else:
                    errors.append("%s: stem too short" % loc)
            if isinstance(stem, str):
                norm = re.sub(r"\s+", "", stem)
                if norm in seen_stems:
                    if seen_stems[norm] != path:
                        errors.append("%s: duplicate stem (also in %s)" % (loc, seen_stems[norm]))
                    elif not legacy:
                        warnings.append("%s: duplicate stem within file (unchanged)" % loc)
                else:
                    seen_stems[norm] = path

            options = q.get("options")
            if not isinstance(options, dict):
                errors.append("%s: options must be an object" % loc)
            else:
                keys = list(options.keys())
                expected = list(OPTION_LETTERS[: len(keys)])
                if keys != expected:
                    errors.append("%s: option keys must be %s, got %s" % (loc, "".join(expected), keys))
                if not (4 <= len(keys) <= 5):
                    errors.append("%s: needs 4-5 options, got %d" % (loc, len(keys)))
                seen_option_text = {}
                for k, v in options.items():
                    if not isinstance(v, str) or not v.strip():
                        errors.append("%s: option %s is empty" % (loc, k))
                    elif len(v) > 200:
                        warnings.append("%s: option %s is very long (%d chars)" % (loc, k, len(v)))
                    else:
                        normalized = re.sub(r"\s+", "", v)
                        if normalized in seen_option_text:
                            errors.append("%s: options %s and %s are identical" % (loc, seen_option_text[normalized], k))
                        else:
                            seen_option_text[normalized] = k

            answer = q.get("answer")
            if not isinstance(answer, list) or not answer:
                errors.append("%s: answer must be a non-empty list" % loc)
            else:
                if len(set(answer)) != len(answer):
                    errors.append("%s: duplicate letters in answer" % loc)
                for a in answer:
                    if a not in (options or {}):
                        errors.append("%s: answer %r not in options" % (loc, a))
                if qtype in ("A", "B", "C") and len(answer) != 1:
                    errors.append("%s: type %s needs exactly 1 answer" % (loc, qtype))
                if qtype == "X" and len(answer) < 2:
                    warnings.append("%s: X question with only 1 answer" % loc)
                if options and set(answer) == set(options.keys()):
                    warnings.append("%s: all options are correct" % loc)
                answer_count[str(sorted(answer))] = answer_count.get(str(sorted(answer)), 0) + 1

            rationale = q.get("rationale")
            if not isinstance(rationale, str) or len(rationale.strip()) < 8:
                errors.append("%s: rationale too short" % loc)

            expl = q.get("expl")
            if not isinstance(expl, dict):
                errors.append("%s: expl must be an object" % loc)
            elif options:
                for k in options.keys():
                    txt = expl.get(k)
                    if not isinstance(txt, str) or len(txt.strip()) < 5:
                        if legacy:
                            warnings.append("%s: expl missing/short for option %s" % (loc, k))
                        else:
                            errors.append("%s: expl missing/too short for option %s" % (loc, k))
                for k in expl:
                    if k not in options:
                        errors.append("%s: expl has unknown option key %s" % (loc, k))

            if q.get("chapter") not in (None, title):
                warnings.append("%s: q.chapter %r != chapter title %r" % (loc, q.get("chapter"), title))

            for field in ("stem", "rationale"):
                text = q.get(field) or ""
                if re.search(r"<[a-zA-Z/][^>]*>", text):
                    warnings.append("%s: HTML tag found in %s" % (loc, field))
            total += 1

    print("[%s]" % path)
    print("  chapters: %d, questions: %d" % (len(chapters), total))
    for ch in chapters:
        print("    - %s: %d" % (ch.get("title"), len(ch.get("questions") or [])))
    print("  types: %s" % type_count)
    print("  top answers: %s" % sorted(answer_count.items(), key=lambda kv: -kv[1])[:8])
    print("  errors: %d, warnings: %d" % (len(errors), len(warnings)))
    for e in errors[:80]:
        print("  ERROR: %s" % e)
    if len(errors) > 80:
        print("  ... %d more errors" % (len(errors) - 80))
    for w in warnings[:15]:
        print("  WARN: %s" % w)
    return errors, warnings, total


def main():
    args = sys.argv[1:]
    legacy_all = "--legacy" in args
    legacy_first = "--legacy-first" in args
    paths = [a for a in args if not a.startswith("--")]
    if not paths:
        print("usage: python scripts/validate.py [--legacy|--legacy-first] <data file> [more files ...]")
        return 2
    seen_ids = {}
    seen_stems = {}
    all_errors = []
    total_questions = 0
    for idx, path in enumerate(paths):
        if not Path(path).exists():
            print("[%s] FILE NOT FOUND" % path)
            all_errors.append(path)
            continue
        legacy = legacy_all or (legacy_first and idx == 0)
        var, data = load(path)
        print("global variable: %s (legacy mode: %s)" % (var, legacy))
        errors, warnings, total = check_file(path, data, seen_ids, seen_stems, legacy)
        all_errors.extend(errors)
        total_questions += total
    print()
    print("TOTAL questions: %d, TOTAL errors: %d" % (total_questions, len(all_errors)))
    if all_errors:
        print("VALIDATION FAILED")
        return 1
    print("VALIDATION OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
