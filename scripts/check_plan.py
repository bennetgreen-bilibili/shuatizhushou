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


CONCEPT_LINKS = {
    "data/concept-pharm.js": ["data/pharm.js", "data/pharm-extra.js"],
    "data/concept-organic.js": ["data/organic.js"],
    "data/concept-analytical.js": ["data/analytical.js"],
}


def load(path):
    text = Path(path).read_text(encoding="utf-8-sig")
    m = WINDOW_RE.search(text)
    if not m:
        raise SystemExit("[%s] missing window.XXX assignment" % path)
    body = text[m.end():].strip()
    if body.endswith(";"):
        body = body[:-1].strip()
    return json.loads(body)


def check_concept(failed):
    for concept_path, source_paths in CONCEPT_LINKS.items():
        if not Path(concept_path).exists():
            print("[SKIP] %s not found" % concept_path)
            continue
        expected = []
        for src in source_paths:
            for ch in load(src).get("chapters") or []:
                expected.append(ch.get("title"))
        data = load(concept_path)
        chapters = data.get("chapters") or []
        print("[%s] chapters: %d (expected %d)" % (concept_path, len(chapters), len(expected)))
        if len(chapters) != len(expected):
            failed = True
            print("  ERROR: chapter count mismatch")
        for i, title in enumerate(expected):
            if i >= len(chapters):
                print("  ERROR: missing chapter %d: %s" % (i + 1, title))
                failed = True
                continue
            actual_title = chapters[i].get("title")
            count = len(chapters[i].get("items") or [])
            status = "ok"
            if actual_title != title:
                status = "TITLE MISMATCH"
                failed = True
            if count < 5:
                status = "COUNT LOW %d<5" % count
                failed = True
            print("  %s %-2d %s (%d/5)" % ("ok" if status == "ok" else "FAIL", i + 1, actual_title, count))
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
    failed = check_concept(failed)
    print()
    print("PLAN CHECK " + ("FAILED" if failed else "OK"))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
