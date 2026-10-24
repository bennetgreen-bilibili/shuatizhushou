# 概念手册分章源文件

本目录是「概念手册」网页（`concept.html`）与可打印版（`概念手册.md`）的**唯一内容源**。
内容不是题目，而是按单元整理的概念、要点、对比表与易混提示，用于速查、背诵和考前回顾。

## 目录结构

```
data/_parts/handbook/
  _chapters.json        # 各科单元标题（权威列表，标题必须逐字一致）
  pharm/01.json ... 47.json       # 药理学：对齐参考书 47 章
  organic/01.json ... 18.json     # 有机化学：对齐参考书 18 章
  analytical/01.json ... 23.json  # 分析化学：01–10 化学分析 10 章 + 11–23 仪器分析 13 章
```

## 单元与参考书目录的对应

概念手册按报考院校指定的 4 本参考书**逐章对齐**（对照表见根目录 `参考书目与目录对照.md`）：

- 药理学：47 章 = 47 个单元（第 1–47 单元）
- 有机化学：18 章 = 18 个单元（第 1–18 单元，附录不计）
- 分析化学：化学分析（上册）10 章 + 仪器分析 13 章 = 23 个单元（第 1–10 单元为化学分析，第 11–23 单元为仪器分析）

新增/替换单元时，先改 `_chapters.json` 再建同名序号文件，标题必须逐字一致。

## 单个文件格式

```json
{
  "title": "第一单元 绪言",
  "summary": "一句话概括本单元主线（15–120 字）",
  "blocks": [
    {
      "t": "defs",
      "title": "核心概念",
      "items": [{"k": "药理学", "v": "研究药物与机体相互作用及作用规律的科学……"}]
    },
    {
      "t": "points",
      "title": "要点梳理",
      "items": ["药理学研究内容包括药效学与药动学两部分：……"]
    },
    {
      "t": "table",
      "title": "药理学主要分支学科",
      "head": ["分支学科", "研究内容", "意义"],
      "rows": [["药效学", "药物对机体的作用、机制与量效关系", "解释药物效应，指导剂量选择"]]
    },
    {
      "t": "notes",
      "title": "易混与记忆",
      "items": ["药效学与药动学方向相反：……"]
    }
  ]
}
```

### 硬性规则（`scripts/validate_handbook.py` 会校验）

- `title` 必须与 `_chapters.json` 中该科第 N 个标题**完全一致**。
- `summary` 15–120 字。
- `blocks` 固定顺序：**1 个 defs → 1 个 points → 1–2 个 table → 1 个 notes**。
- defs：10–24 条，`k` 为本单元概念名（2–40 字，单元内不可重复），`v` 为解释（10–260 字）。
- points：8–20 条，每条 8–300 字，单元内不可重复。
- table：表头 3–6 列，行数 3–12，每行列数一致，单元格 1–80 字。
- notes：3–10 条，每条 8–300 字。
- 全文有效字数（defs + points + notes）不少于 1500 字。
- 不要出现 HTML 标签、Markdown 标记（`**`）、占位符（`（略）`、`见教材`、`TODO`）。

## 写作要求

1. **准确第一**：以人卫版教材与考研大纲为准，数字、分类、代表药必须是学界公认结论；不确定的具体剂量宁可写“常用量”等定性表述，不要编造。
2. **不是题目**：不要写“简答：……”“答：……”；直接以陈述句给出概念与要点。
3. **覆盖面**：defs 尽量覆盖本单元所有核心术语（包括英文缩写与中文全称），points 覆盖分类、机制、应用、不良反应、重要比较。
4. **对比表**：优先做“分类—代表药—特点/机制—应用”或“方法—原理—特点”类表格，便于横向记忆。
5. **易混与记忆**：写清 A 与 B 的区别、常见混淆点、记忆口诀或框架。
6. 术语统一：药名用通用名；化学式用文本（如 `CH3CH2OH`）；不要使用图片。
7. 中文标点，段落之间不要空行（一个 item 一个段落）。

## 校验与构建

```bash
# 校验全部（含单元数量、标题、重复概念检查）
python scripts/validate_handbook.py

# 只校验某科的部分文件（写作时用）
python scripts/validate_handbook.py --subject pharm --only 01,02,03

# 构建三科数据（生成 data/handbook-*.js）
python scripts/build_handbook.py --parts data/_parts/handbook/pharm --out data/handbook-pharm.js --global HANDBOOK_PHARM
python scripts/build_handbook.py --parts data/_parts/handbook/organic --out data/handbook-organic.js --global HANDBOOK_ORGANIC
python scripts/build_handbook.py --parts data/_parts/handbook/analytical --out data/handbook-analytical.js --global HANDBOOK_ANALYTICAL

# 生成可打印 Markdown
python scripts/export_handbook_md.py
```

参考样例：`pharm/01.json`（药理学绪论），新建单元时可先复制其结构再替换内容。