#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Export the handbook to a printable Markdown file (概念手册.md)."""

import json
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
SUBJECTS = [
    ("pharm", "药理学", ROOT / "data/handbook-pharm.js"),
    ("organic", "有机化学", ROOT / "data/handbook-organic.js"),
    ("analytical", "分析化学", ROOT / "data/handbook-analytical.js"),
]
WINDOW_RE = re.compile(r"window\.(\w+)\s*=\s*")
OUT = ROOT / "概念手册.md"


def load(path):
    text = path.read_text(encoding="utf-8-sig")
    m = WINDOW_RE.search(text)
    if not m:
        raise SystemExit("[%s] missing window.XXX assignment" % path)
    body = text[m.end():].strip()
    if body.endswith(";"):
        body = body[:-1].strip()
    return json.loads(body)


def cell(s):
    return str(s).replace("|", "\\|").replace("\n", " ").strip()


def main():
    data = []
    for key, name, path in SUBJECTS:
        if not path.exists():
            raise SystemExit("missing %s, run build_handbook.py first" % path)
        data.append((key, name, load(path)))

    total_units = sum(len(d["chapters"]) for _, _, d in data)
    total_defs = sum(len(b.get("items") or []) for _, _, d in data for ch in d["chapters"] for b in ch["blocks"] if b.get("t") == "defs")
    total_points = sum(len(b.get("items") or []) for _, _, d in data for ch in d["chapters"] for b in ch["blocks"] if b.get("t") == "points")
    total_tables = sum(1 for _, _, d in data for ch in d["chapters"] for b in ch["blocks"] if b.get("t") == "table")
    total_notes = sum(len(b.get("items") or []) for _, _, d in data for ch in d["chapters"] for b in ch["blocks"] if b.get("t") == "notes")

    lines = []
    lines.append("# 考研药学综合 · 概念手册")
    lines.append("")
    lines.append("> 三科 %d 单元 · 核心概念 %d 条 · 要点 %d 条 · 对比表 %d 个 · 易混提示 %d 条" % (total_units, total_defs, total_points, total_tables, total_notes))
    lines.append(">")
    lines.append("> 本文件由 scripts/export_handbook_md.py 根据 data/_parts/handbook/ 自动生成，可直接打印或在手机上通读；网页版见 concept.html。")
    lines.append("")
    lines.append("## 目录")
    lines.append("")
    for key, name, d in data:
        lines.append("- [%s](#%s)（%d 单元）" % (name, name, len(d["chapters"])))
        for i, ch in enumerate(d["chapters"], 1):
            anchor = ch["title"].replace(" ", "-")
            lines.append("  %d. [%s](#%s)" % (i, ch["title"], anchor))
    lines.append("")
    lines.append("---")
    lines.append("")

    for key, name, d in data:
        lines.append("# %s" % name)
        lines.append("")
        for ch in d["chapters"]:
            lines.append("## " + ch["title"])
            lines.append("")
            if ch.get("summary"):
                lines.append("> " + ch["summary"])
                lines.append("")
            for b in ch["blocks"]:
                t = b.get("t")
                if t == "defs":
                    lines.append("### " + (b.get("title") or "核心概念"))
                    lines.append("")
                    for it in b.get("items") or []:
                        lines.append("- **%s**：%s" % (it.get("k"), it.get("v")))
                    lines.append("")
                elif t == "points":
                    lines.append("### " + (b.get("title") or "要点梳理"))
                    lines.append("")
                    for i, it in enumerate(b.get("items") or [], 1):
                        lines.append("%d. %s" % (i, it))
                    lines.append("")
                elif t == "table":
                    lines.append("### " + (b.get("title") or "对比表"))
                    lines.append("")
                    head = b.get("head") or []
                    lines.append("| " + " | ".join(cell(h) for h in head) + " |")
                    lines.append("| " + " | ".join("---" for _ in head) + " |")
                    for row in b.get("rows") or []:
                        lines.append("| " + " | ".join(cell(c) for c in row) + " |")
                    lines.append("")
                elif t == "notes":
                    lines.append("### " + (b.get("title") or "易混与记忆"))
                    lines.append("")
                    for it in b.get("items") or []:
                        lines.append("- " + it)
                    lines.append("")
        lines.append("---")
        lines.append("")

    text = "\n".join(lines).rstrip() + "\n"
    OUT.write_text(text, encoding="utf-8")
    print("wrote %s: %d chars, %d units, %d defs, %d points" % (OUT, len(text), total_units, total_defs, total_points))


if __name__ == "__main__":
    main()
