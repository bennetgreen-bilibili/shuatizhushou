#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Export concept data to a printable Markdown review list.

Usage:
    python scripts/export_concept_md.py --out 概念题速记清单.md
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

WINDOW_RE = re.compile(r"window\.(\w+)\s*=\s*")
SOURCES = [
    ("药理学", "data/concept-pharm.js", "pharm"),
    ("有机化学", "data/concept-organic.js", "organic"),
    ("分析化学", "data/concept-analytical.js", "analytical"),
]
TYPE_NAME = {"term": "名词解释", "qa": "简答", "judge": "概念辨析"}


def load(path):
    text = Path(path).read_text(encoding="utf-8-sig")
    m = WINDOW_RE.search(text)
    body = text[m.end():].strip()
    if body.endswith(";"):
        body = body[:-1].strip()
    return json.loads(body)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="概念题速记清单.md")
    args = ap.parse_args()

    lines = []
    lines.append("# 考研药学综合 · 概念题速记清单")
    lines.append("")
    lines.append("> 由概念题专区数据自动生成，共 260 条：名词解释 156、简答 52、概念辨析 52。")
    lines.append("> 建议用法：先遮住答案自述，再对照要点；✅/❌ 标记掌握情况。")
    lines.append("")
    total = 0
    for subject, src, _ in SOURCES:
        data = load(src)
        n = sum(len(ch.get("items") or []) for ch in data.get("chapters") or [])
        total += n
        lines.append("## " + subject + "（%d 条）" % n)
        lines.append("")
        for ch in data.get("chapters") or []:
            lines.append("### " + ch.get("title", ""))
            lines.append("")
            for i, it in enumerate(ch.get("items") or [], 1):
                t = it.get("type")
                if t == "term":
                    lines.append("%d. **%s**：%s" % (i, it.get("q", ""), it.get("a", "")))
                elif t == "qa":
                    lines.append("%d. **问：%s**" % (i, it.get("q", "")))
                    lines.append("   - 答：%s" % it.get("a", ""))
                else:
                    mark = "✅ 正确" if it.get("a") else "❌ 错误"
                    lines.append("%d. **判断：%s** —— %s" % (i, it.get("q", ""), mark))
                    lines.append("   - 解析：%s" % it.get("why", ""))
            lines.append("")
    Path(args.out).write_text("\n".join(lines), encoding="utf-8")
    print("wrote %s: %d items, %d bytes" % (args.out, total, Path(args.out).stat().st_size))


if __name__ == "__main__":
    main()
