#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Verify chapter titles/order and per-chapter question counts against the plan."""

import json
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

WINDOW_RE = re.compile(r"window\.(\w+)\s*=\s*")

PLANS = {
    "data/organic.js": [
        ("第一章 有机化学绪论与结构基础", 12),
        ("第二章 烷烃与环烷烃", 12),
        ("第三章 烯烃", 14),
        ("第四章 炔烃与二烯烃", 12),
        ("第五章 芳香烃", 14),
        ("第六章 立体化学", 14),
        ("第七章 卤代烃", 14),
        ("第八章 醇、酚、醚", 14),
        ("第九章 醛、酮、醌", 14),
        ("第十章 羧酸及其衍生物", 14),
        ("第十一章 取代羧酸与β-二羰基化合物", 12),
        ("第十二章 含氮化合物（胺与重氮盐）", 12),
        ("第十三章 杂环化合物", 10),
        ("第十四章 糖类、氨基酸与蛋白质", 10),
        ("第十五章 天然产物与波谱基础", 10),
    ],
    "data/analytical.js": [
        ("第一章 误差与分析数据处理", 12),
        ("第二章 滴定分析概述", 10),
        ("第三章 酸碱滴定法", 16),
        ("第四章 配位滴定法", 14),
        ("第五章 氧化还原滴定法", 14),
        ("第六章 沉淀滴定与重量分析", 12),
        ("第七章 电位分析法", 10),
        ("第八章 紫外-可见分光光度法", 14),
        ("第九章 红外光谱法", 12),
        ("第十章 核磁共振波谱法", 12),
        ("第十一章 质谱法", 10),
        ("第十二章 气相色谱法", 14),
        ("第十三章 高效液相色谱法", 14),
        ("第十四章 其他分析方法（荧光、原子吸收、平面色谱）", 12),
    ],
    "data/pharm-extra.js": [
        ("补充·药理学总论与药动学", 12),
        ("补充·传出神经系统药理", 12),
        ("补充·中枢神经系统药理", 12),
        ("补充·心血管系统药理", 12),
        ("补充·内分泌与激素药理", 10),
        ("补充·化学治疗药物", 12),
        ("补充·其他系统与高频易错", 10),
    ],
}


HANDBOOKS = [
    ("data/handbook-pharm.js", "pharm"),
    ("data/handbook-organic.js", "organic"),
    ("data/handbook-analytical.js", "analytical"),
]


def load(path):
    text = Path(path).read_text(encoding="utf-8-sig")
    m = WINDOW_RE.search(text)
    if not m:
        raise SystemExit("[%s] missing window.XXX assignment" % path)
    body = text[m.end():].strip()
    if body.endswith(";"):
        body = body[:-1].strip()
    return json.loads(body)


def check_handbook(failed):
    plan_path = Path("data/_parts/handbook/_chapters.json")
    if not plan_path.exists():
        print("[SKIP] %s not found" % plan_path)
        return failed
    plan = json.loads(plan_path.read_text(encoding="utf-8-sig"))
    for hb_path, subject in HANDBOOKS:
        if not Path(hb_path).exists():
            print("[SKIP] %s not found" % hb_path)
            continue
        expected = plan.get(subject) or []
        chapters = load(hb_path).get("chapters") or []
        print("[%s] units: %d (expected %d)" % (hb_path, len(chapters), len(expected)))
        if len(chapters) != len(expected):
            failed = True
            print("  ERROR: unit count mismatch")
        for i, title in enumerate(expected):
            if i >= len(chapters):
                print("  ERROR: missing unit %d: %s" % (i + 1, title))
                failed = True
                continue
            ch = chapters[i]
            actual_title = ch.get("title")
            blocks = ch.get("blocks") or []
            defs = sum(len(b.get("items") or []) for b in blocks if b.get("t") == "defs")
            points = sum(len(b.get("items") or []) for b in blocks if b.get("t") == "points")
            tables = sum(1 for b in blocks if b.get("t") == "table")
            notes = sum(len(b.get("items") or []) for b in blocks if b.get("t") == "notes")
            status = "ok"
            if actual_title != title:
                status = "TITLE MISMATCH"
                failed = True
            if defs < 10:
                status = "DEFS LOW %d<10" % defs
                failed = True
            if points < 8:
                status = "POINTS LOW %d<8" % points
                failed = True
            if tables < 1 or notes < 3:
                status = "BLOCK LOW tables=%d notes=%d" % (tables, notes)
                failed = True
            print("  %s %-2d %s (defs=%d points=%d tables=%d notes=%d)" % (
                "ok" if status == "ok" else "FAIL", i + 1, actual_title, defs, points, tables, notes))
    return failed


def main():
    failed = False
    for path, plan in PLANS.items():
        if not Path(path).exists():
            print("[SKIP] %s not found" % path)
            failed = True
            continue
        data = load(path)
        chapters = data.get("chapters") or []
        print("[%s] chapters: %d (expected %d)" % (path, len(chapters), len(plan)))
        if len(chapters) != len(plan):
            failed = True
            print("  ERROR: chapter count mismatch")
        for i, (title, min_count) in enumerate(plan):
            if i >= len(chapters):
                print("  ERROR: missing chapter %d: %s" % (i + 1, title))
                failed = True
                continue
            actual_title = chapters[i].get("title")
            count = len(chapters[i].get("questions") or chapters[i].get("items") or [])
            status = "ok"
            if actual_title != title:
                status = "TITLE MISMATCH"
                failed = True
            if count < min_count:
                status = ("COUNT LOW %d<%d" % (count, min_count))
                failed = True
            print("  %s %-2d %s (%d/%d)" % ("ok" if status == "ok" else "FAIL", i + 1, actual_title, count, min_count))
    failed = check_handbook(failed)
    print()
    print("PLAN CHECK " + ("FAILED" if failed else "OK"))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
