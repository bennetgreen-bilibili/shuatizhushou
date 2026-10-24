#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Validate handbook source parts (structure, coverage, duplicates).

Usage:
    python scripts/validate_handbook.py
    python scripts/validate_handbook.py --subject pharm --only 01,02,03
"""

import argparse
import json
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
PARTS = ROOT / "data" / "_parts" / "handbook"
SUBJECTS = ("pharm", "organic", "analytical")
LABELS = {"pharm": "药理学", "organic": "有机化学", "analytical": "分析化学"}

MIN_DEFS, MAX_DEFS = 10, 24
MIN_POINTS, MAX_POINTS = 8, 20
MIN_NOTES, MAX_NOTES = 3, 10
MIN_CHARS = 1500
MIN_SUMMARY, MAX_SUMMARY = 15, 120

BAD_PATTERNS = [
    ("**", "Markdown 加粗"),
    ("（略）", "占位符"), ("(略)", "占位符"), ("见教材", "占位符"),
    ("TODO", "占位符"), ("待补", "占位符"), ("XXX", "占位符"),
]
HTML_TAG_RE = re.compile(r"<[A-Za-z/!]")

WS_RE = re.compile(r"\s+")


def nlen(s):
    return len(WS_RE.sub("", s))


def norm_key(s):
    return WS_RE.sub("", s).replace("（", "(").replace("）", ")").lower()


def err(errors, msg):
    errors.append(msg)


def check_text(errors, where, value, lo, hi, label):
    if not isinstance(value, str):
        err(errors, "%s: %s 不是字符串" % (where, label))
        return 0
    v = value.strip()
    if v != value:
        err(errors, "%s: %s 首尾有空白" % (where, label))
    n = nlen(v)
    if n < lo or n > hi:
        err(errors, "%s: %s 长度 %d，应在 %d-%d" % (where, label, n, lo, hi))
    for bad, why in BAD_PATTERNS:
        if bad in v:
            err(errors, "%s: %s 含禁止内容 %r（%s）" % (where, label, bad, why))
    if HTML_TAG_RE.search(v):
        err(errors, "%s: %s 含 HTML 标签" % (where, label))
    return n


def check_blocks(errors, blocks, stats):
    if not isinstance(blocks, list) or not blocks:
        err(errors, "blocks 缺失或为空")
        return
    types = [b.get("t") for b in blocks if isinstance(b, dict)]
    for i, b in enumerate(blocks):
        if not isinstance(b, dict):
            err(errors, "blocks[%d] 不是对象" % i)
            continue
        if not isinstance(b.get("title"), str) or not b["title"].strip():
            err(errors, "blocks[%d] 缺少 title" % i)
        t = b.get("t")
        if t == "defs":
            stats["defs"] += 1
            items = b.get("items")
            if not isinstance(items, list):
                err(errors, "defs.items 不是数组")
                continue
            if not (MIN_DEFS <= len(items) <= MAX_DEFS):
                err(errors, "defs 条数 %d，应在 %d-%d" % (len(items), MIN_DEFS, MAX_DEFS))
            seen = set()
            for j, it in enumerate(items, 1):
                if not isinstance(it, dict):
                    err(errors, "defs[%d] 不是对象" % j)
                    continue
                k = it.get("k")
                stats["n_defs"] += 1
                if not isinstance(k, str) or not (1 <= nlen(k) <= 40):
                    err(errors, "defs[%d] 概念名缺失或长度不符" % j)
                    continue
                key = norm_key(k)
                if key in seen:
                    err(errors, "defs 概念重复：%s" % k)
                seen.add(key)
                stats["chars"] += check_text(errors, "defs[%s]" % k, it.get("v"), 10, 260, "解释")
        elif t == "points":
            stats["points"] += 1
            items = b.get("items")
            if not isinstance(items, list):
                err(errors, "points.items 不是数组")
                continue
            if not (MIN_POINTS <= len(items) <= MAX_POINTS):
                err(errors, "points 条数 %d，应在 %d-%d" % (len(items), MIN_POINTS, MAX_POINTS))
            seen = set()
            for j, it in enumerate(items, 1):
                if not isinstance(it, str):
                    err(errors, "points[%d] 不是字符串" % j)
                    continue
                stats["n_points"] += 1
                key = norm_key(it)
                if key in seen:
                    err(errors, "points 第 %d 条与前面重复" % j)
                seen.add(key)
                stats["chars"] += check_text(errors, "points[%d]" % j, it, 8, 300, "要点")
        elif t == "table":
            stats["tables"] += 1
            head = b.get("head")
            rows = b.get("rows")
            if not isinstance(head, list) or not (3 <= len(head) <= 6):
                err(errors, "table.head 应为 3-6 列字符串")
                continue
            for h in head:
                check_text(errors, "table.head", h, 1, 40, "表头")
            if not isinstance(rows, list) or not (3 <= len(rows) <= 12):
                err(errors, "table.rows 应为 3-12 行")
                continue
            for ri, row in enumerate(rows, 1):
                if not isinstance(row, list) or len(row) != len(head):
                    err(errors, "table 第 %d 行列数与表头不一致" % ri)
                    continue
                for cell in row:
                    check_text(errors, "table 第 %d 行" % ri, cell, 1, 80, "单元格")
        elif t == "notes":
            stats["notes"] += 1
            items = b.get("items")
            if not isinstance(items, list):
                err(errors, "notes.items 不是数组")
                continue
            if not (MIN_NOTES <= len(items) <= MAX_NOTES):
                err(errors, "notes 条数 %d，应在 %d-%d" % (len(items), MIN_NOTES, MAX_NOTES))
            seen = set()
            for j, it in enumerate(items, 1):
                if not isinstance(it, str):
                    err(errors, "notes[%d] 不是字符串" % j)
                    continue
                stats["n_notes"] += 1
                key = norm_key(it)
                if key in seen:
                    err(errors, "notes 第 %d 条与前面重复" % j)
                seen.add(key)
                stats["chars"] += check_text(errors, "notes[%d]" % j, it, 8, 300, "提示")
        else:
            err(errors, "未知 block 类型：%r" % (t,))

    if stats["defs"] != 1 or stats["points"] != 1 or stats["notes"] != 1:
        err(errors, "defs/points/notes 必须各出现一次（实际 %d/%d/%d）" % (stats["defs"], stats["points"], stats["notes"]))
    if not (1 <= stats["tables"] <= 2):
        err(errors, "table 必须出现 1-2 次（实际 %d）" % stats["tables"])
    expected = ["defs", "points"] + ["table"] * stats["tables"] + ["notes"]
    if types != expected:
        err(errors, "block 顺序应为 %s，实际 %s" % (expected, types))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--subject", choices=SUBJECTS)
    ap.add_argument("--only", help="逗号分隔的文件序号，如 01,02,03（需配合 --subject）")
    args = ap.parse_args()

    chapters = json.loads((PARTS / "_chapters.json").read_text(encoding="utf-8-sig"))
    only = None
    if args.only:
        if not args.subject:
            raise SystemExit("--only 需要同时指定 --subject")
        only = {x.strip().zfill(2) for x in args.only.split(",") if x.strip()}

    subjects = [args.subject] if args.subject else list(SUBJECTS)
    total_errors = 0
    grand = {"units": 0, "n_defs": 0, "n_points": 0, "tables": 0, "n_notes": 0, "chars": 0}
    term_where = {}

    for subject in subjects:
        expected = chapters.get(subject) or []
        files = sorted((PARTS / subject).glob("*.json"))
        if only:
            files = [f for f in files if f.stem in only]
        print("\n== %s：%d 个单元（期望 %d）==" % (LABELS[subject], len(files), len(expected)))
        if not only and len(files) != len(expected):
            print("  [FAIL] 单元数量不符：%d != %d" % (len(files), len(expected)))
            total_errors += 1
        for f in files:
            idx = int(f.stem)
            stats = {"defs": 0, "points": 0, "tables": 0, "notes": 0,
                     "n_defs": 0, "n_points": 0, "n_notes": 0, "chars": 0}
            errors = []
            try:
                obj = json.loads(f.read_text(encoding="utf-8-sig"))
            except Exception as exc:
                print("  [FAIL] %s/%s 无法解析：%s" % (subject, f.name, exc))
                total_errors += 1
                continue
            title = obj.get("title")
            exp_title = expected[idx - 1] if 0 < idx <= len(expected) else None
            if not isinstance(title, str) or not title.strip():
                errors.append("title 缺失")
            elif exp_title and title.strip() != exp_title:
                errors.append("标题不匹配：%r != %r" % (title.strip(), exp_title))
            summary = obj.get("summary")
            if not isinstance(summary, str):
                errors.append("summary 缺失")
            else:
                n = nlen(summary.strip())
                if not (MIN_SUMMARY <= n <= MAX_SUMMARY):
                    errors.append("summary 长度 %d，应在 %d-%d" % (n, MIN_SUMMARY, MAX_SUMMARY))
                stats["chars"] += n
            check_blocks(errors, obj.get("blocks"), stats)
            if stats["chars"] < MIN_CHARS:
                errors.append("有效字数 %d < %d" % (stats["chars"], MIN_CHARS))

            for b in obj.get("blocks") or []:
                if isinstance(b, dict) and b.get("t") == "defs":
                    for it in b.get("items") or []:
                        if isinstance(it, dict) and isinstance(it.get("k"), str):
                            term_where.setdefault(norm_key(it["k"]), []).append("%s/%s" % (subject, f.name))

            grand["units"] += 1
            for k in ("n_defs", "n_points", "tables", "n_notes", "chars"):
                grand[k] += stats[k]
            if errors:
                total_errors += len(errors)
                print("  [FAIL] %s/%s %s" % (subject, f.name, title or "?"))
                for e in errors:
                    print("     - " + e)
            else:
                print("  [ok] %s/%s %-34s defs=%-2d points=%-2d tables=%d notes=%-2d chars=%d" % (
                    subject, f.name, title, stats["n_defs"], stats["n_points"],
                    stats["tables"], stats["n_notes"], stats["chars"]))

    dups = {k: v for k, v in term_where.items() if len(v) > 1}
    if dups:
        print("\n== 跨单元重复概念（可能跨科目；仅提示，可按需合并或保留）==")
        for k, v in sorted(dups.items()):
            print("  %s: %s" % (k, ", ".join(v)))

    print("\n== 汇总：%d 个单元，概念 %d 条，要点 %d 条，对比表 %d 个，提示 %d 条，有效字数 %d ==" % (
        grand["units"], grand["n_defs"], grand["n_points"], grand["tables"], grand["n_notes"], grand["chars"]))
    if dups:
        print("跨单元重复概念 %d 个（仅提示，不视为错误）" % len(dups))
    print("VALIDATE " + ("FAILED (%d errors)" % total_errors if total_errors else "OK"))
    return 1 if total_errors else 0


if __name__ == "__main__":
    sys.exit(main())
