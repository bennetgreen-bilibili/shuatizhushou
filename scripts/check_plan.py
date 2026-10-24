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
    "data/pharm.js": [
        ("第一章 绪言", 4),
        ("第二章 药物效应动力学", 65),
        ("第三章 药物代谢动力学", 73),
        ("第四章 影响药物作用的因素", 21),
        ("第五章 传出神经系统药理学概论", 32),
        ("第六章 胆碱受体激动药", 20),
        ("第七章 抗胆碱酯酶药", 24),
        ("第八章 胆碱受体阻断药", 36),
        ("第九章 肾上腺素受体激动药", 44),
        ("第十章 肾上腺素受体阻断药", 33),
        ("第十一章 中枢神经系统药理学概论", 4),
        ("第十二章 麻醉药", 24),
        ("第十三章 镇静催眠药", 52),
        ("第十四章 抗癫痫药与抗惊厥药", 33),
        ("第十五章 治疗中枢神经系统退行性疾病药", 4),
        ("第十六章 抗精神失常药", 46),
        ("第十七章 镇痛药", 51),
        ("第十八章 中枢兴奋药", 4),
        ("第十九章 解热镇痛抗炎药与抗痛风药", 41),
        ("第二十章 利尿药与脱水药", 4),
        ("第二十一章 抗高血压药", 4),
        ("第二十二章 抗心律失常药", 4),
        ("第二十三章 调血脂药与抗动脉粥样硬化药", 4),
        ("第二十四章 抗心绞痛药", 4),
        ("第二十五章 治疗充血性心力衰竭药", 4),
        ("第二十六章 作用于血液系统的药物", 4),
        ("第二十七章 作用于呼吸系统的药物", 4),
        ("第二十八章 作用于消化系统的药物", 4),
        ("第二十九章 自体活性物质及其影响药物", 4),
        ("第三十章 雌激素、孕激素和女性生殖道药物", 4),
        ("第三十一章 雄激素和男科药物", 4),
        ("第三十二章 肾上腺皮质激素类药物", 4),
        ("第三十三章 甲状腺激素与抗甲状腺药", 4),
        ("第三十四章 胰岛素与口服降糖药", 4),
        ("第三十五章 调节骨代谢与形成药", 4),
        ("第三十六章 抗病原微生物药概论", 4),
        ("第三十七章 人工合成抗菌药", 4),
        ("第三十八章 β-内酰胺类抗生素", 4),
        ("第三十九章 大环内酯类与林可霉素类抗生素", 4),
        ("第四十章 氨基糖苷类与多肽类抗生素", 4),
        ("第四十一章 四环素类与氯霉素类抗生素", 4),
        ("第四十二章 抗病毒药与抗真菌药", 4),
        ("第四十三章 抗结核药与抗麻风药", 4),
        ("第四十四章 抗寄生虫药", 4),
        ("第四十五章 抗肿瘤药", 4),
        ("第四十六章 免疫功能调节剂", 4),
        ("第四十七章 生物技术药物", 4),
    ],
    "data/organic.js": [
        ("第一章 绪论", 5),
        ("第二章 有机化合物的化学键", 7),
        ("第三章 烷烃", 8),
        ("第四章 烯烃", 14),
        ("第五章 炔烃和二烯烃", 12),
        ("第六章 脂环烃", 4),
        ("第七章 芳香烃", 14),
        ("第八章 立体化学基础", 14),
        ("第九章 卤代烃", 14),
        ("第十章 醇、酚、醚", 14),
        ("第十一章 醛、酮、醌", 14),
        ("第十二章 羧酸及羧酸衍生物", 14),
        ("第十三章 取代羧酸", 12),
        ("第十四章 含氮有机化合物", 12),
        ("第十五章 氨基酸、多肽、蛋白质", 4),
        ("第十六章 杂环化合物", 10),
        ("第十七章 糖类化合物", 6),
        ("第十八章 萜类和甾体化合物", 4),
    ],
    "data/analytical.js": [
        ("第一章 绪论", 4),
        ("第二章 分析过程", 4),
        ("第三章 误差和分析数据的处理", 12),
        ("第四章 重量分析法", 4),
        ("第五章 滴定分析概论", 10),
        ("第六章 酸碱滴定法", 16),
        ("第七章 配位滴定法", 14),
        ("第八章 氧化还原滴定法", 14),
        ("第九章 沉淀滴定法", 9),
        ("第十章 电位法及双指示电极电流滴定法", 10),
        ("第十一章 仪器分析绪论", 4),
        ("第十二章 光谱分析法概论", 4),
        ("第十三章 紫外-可见分光光度法", 14),
        ("第十四章 荧光分析法", 4),
        ("第十五章 红外分光光度法", 12),
        ("第十六章 原子光谱法", 6),
        ("第十七章 核磁共振波谱法", 12),
        ("第十八章 质谱法", 10),
        ("第十九章 波谱综合解析", 7),
        ("第二十章 色谱法概论", 4),
        ("第二十一章 经典液相色谱法", 4),
        ("第二十二章 气相色谱法", 14),
        ("第二十三章 高效液相色谱法", 14),
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
