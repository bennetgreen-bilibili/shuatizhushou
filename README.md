# 考研药学综合刷题

药理学、有机化学、分析化学三科刷题网页 + 三科概念手册，基于教材与考研大纲整理，可直接在线使用或本地离线打开。

- 三科分页面：**药理学**、**有机化学**、**分析化学**，首页统一入口
- **概念手册**：三科 **66 个单元 / 1060 条核心概念 / 877 条要点 / 131 个对比表 / 383 条易混提示**，不是题目，而是按单元整理、可直接背诵与速查的体系化资料，支持搜索、已背标记、打印
- 每题附 **答案、题干解析，以及每个选项的讲解**
- 支持按章节 / 题型 / 进度筛选、随机顺序、即时判分、**错题本**、做题进度统计
- 进度保存在浏览器本地，支持**导出 / 导入 JSON** 备份与跨设备恢复
- 快捷键：`A`–`E` 选择选项，`Enter` 提交 / 下一题

## 在线使用

本仓库已按 GitHub Pages 部署，直接访问：

```
https://bennetgreen-bilibili.github.io/shuatizhushou/
```

（若尚未开启，见文末「如何部署」。）

## 题库构成

| 科目 | 章节 | 题量 | 覆盖内容 |
| --- | --- | --- | --- |
| 药理学 | 16 章基础 + 7 组高频补充 | 641 | 总论与药动学、传出/中枢神经、心血管、内分泌、化学治疗等 |
| 有机化学 | 15 章 | 188 | 结构基础、烃类、立体化学、卤代烃、醇酚醚、醛酮、羧酸、胺、杂环、糖与波谱 |
| 分析化学 | 14 章 | 176 | 误差与数据处理、四大滴定、电位分析、UV/IR/NMR/MS、GC/HPLC 等 |
| **合计** | **52 章** | **1005** | 药学综合考研高频考点 |

题型包含 A 型单选与 X 型多选；药理学基础题库中另保留原文档的 B/C 型配对题。

## 概念手册构成

概念手册独立于选择题，按「单元 → 核心概念 / 要点梳理 / 分类对比表 / 易混与记忆」组织，覆盖教材主干而不是零散考点：

| 科目 | 单元 | 核心概念 | 要点 | 对比表 | 易混提示 | 覆盖内容 |
| --- | --- | --- | --- | --- | --- | --- |
| 药理学 | 37 | 580 | 512 | 73 | 223 | 总论、传出神经、中枢神经、心血管、内分泌、化学治疗、血液/消化/呼吸系统 |
| 有机化学 | 15 | 249 | 191 | 30 | 90 | 结构基础、烃类、立体化学、卤代烃、醇酚醚、醛酮醌、羧酸衍生物、胺、杂环、糖/氨基酸、天然产物与波谱 |
| 分析化学 | 14 | 231 | 174 | 28 | 70 | 误差与统计、四大滴定、电位分析、UV/IR/NMR/MS、GC/HPLC、荧光/原子吸收/平面色谱 |
| **合计** | **66** | **1060** | **877** | **131** | **383** | 教材主干概念全覆盖 |

药理学概念手册比选择题的 23 个章节更完整（拆出抗心律失常、抗心绞痛、抗高血压、利尿、抗心衰、调血脂、激素、各类抗菌药、抗肿瘤、血液/消化/呼吸等单元），便于系统通读而不是只补考点。

## 页面结构

| 文件 | 用途 |
| --- | --- |
| `index.html` | 首页（三科入口、总体进度、概念手册入口、复习资料链接） |
| `pharm.html` | 药理学刷题 |
| `organic.html` | 有机化学刷题 |
| `analytical.html` | 分析化学刷题 |
| `concept.html` | 概念手册（三科单元通读、搜索、已背标记、打印） |
| `assets/quiz.css`、`assets/quiz.js` | 全站共享样式与刷题引擎 |
| `assets/handbook.css`、`assets/handbook.js` | 概念手册样式与渲染引擎 |
| `data/pharm.js` | 药理学基础题库（原 16 章 561 题） |
| `data/pharm-extra.js` | 药理学考研高频补充题 |
| `data/organic.js` | 有机化学题库 |
| `data/analytical.js` | 分析化学题库 |
| `data/handbook-pharm.js`、`data/handbook-organic.js`、`data/handbook-analytical.js` | 概念手册数据（由分章源文件构建） |
| `概念手册.md` | 可打印 / 手机阅读的 Markdown 版（自动生成） |
| `概念手册.docx` | Word 打印版（自动生成，A4 排版、表格可直接打印） |
| `药理学简答题整理.docx` | 原简答 / 名词解释 / 填空题（已系统整理进概念手册） |
| `药理学选择题勘误说明.md` | 原题库答案勘误与修正说明 |
| `scripts/` | 题库构建、校验、导出、冒烟测试脚本（改内容时用） |
| `data/_parts/` | 分章选择题源文件（重建题库用；可直接编辑） |
| `data/_parts/handbook/` | 概念手册分单元源文件（重建手册用；格式说明见该目录 README） |

## 使用说明

1. 在首页选择科目，或直接访问对应科目页面。
2. 顶部可按 **章节 / 题型 / 进度** 筛选；勾选 **随机** 打乱顺序，勾选 **只看错题** 集中复习。
3. 答错自动进入错题本；开启「答对移出错题本」后，在错题本中答对会自动移除。
4. 每轮结束显示本轮题数、答对/答错与正确率，可「再来一轮」。
5. 进度按科目分别保存在浏览器本地，三科互不影响。

### 进度备份 / 跨设备恢复

1. 在网页里点「**导出进度**」，下载 `科目进度_日期.json`；
2. 换设备后点「**导入进度**」，选择该文件即可恢复（导入时会自动过滤非本页面的题目）。

## 概念手册怎么用

1. 首页点「🧠 概念手册」卡片，或任意页面顶部导航「概念手册」。
2. 顶部切换科目（药理学 / 有机化学 / 分析化学），左侧目录可跳到任意单元。
3. 每个单元固定四块：**核心概念**（名词解释式，可直接背）→ **要点梳理**（分类、机制、应用、不良反应）→ **分类对比表**（横向比较）→ **易混与记忆**（易混点、口诀、陷阱）。
4. 搜索框支持多个关键词（空格分隔），如 `首过 生物利用度`、`HPLC 检测器`；命中的单元会保留并高亮。
5. 通读完一个单元勾选「已背完」；勾选「隐藏已背完单元」可只看没过的部分。进度按科目保存在本机浏览器（`handbook_<科目>_v1`）。
6. 需要打印或离线背：用页面右上「🖨 打印 / 存为 PDF」，或直接打开 `概念手册.docx` / `概念手册.md`。
7. 快捷键：`/` 聚焦搜索框，`Esc` 清空搜索。

## 新增 / 修改题目

题库数据在 `data/` 下。若要修改题目，推荐用分片文件重建：

1. 把每章题目写到 `data/_parts/<科目>/NN.json`，格式：

   ```json
   {
     "title": "第一章 xxx",
     "questions": [
       {
         "type": "A",
         "stem": "题干",
         "options": {"A": "…", "B": "…", "C": "…", "D": "…", "E": "…"},
         "answer": ["C"],
         "rationale": "为什么选 C",
         "expl": {"A": "…", "B": "…", "C": "…", "D": "…", "E": "…"}
       }
     ]
   }
   ```

   `id / chapter / chapterIdx / num` 由构建脚本自动生成。

2. 构建数据文件：

   ```bash
   python scripts/build_data.py --parts data/_parts/organic --out data/organic.js --global ORGANIC_DATA --id-prefix org
   ```

3. 校验结构、答案、选项讲解、重复题：

   ```bash
   python scripts/validate.py data/organic.js
   python scripts/check_plan.py
   ```

   `data/pharm.js` 为保留原文档格式的旧数据，校验时加 `--legacy`。

4. 修改共享引擎后运行冒烟测试（需要 Node.js）：

   ```bash
   node scripts/smoke_test.mjs      # 药理学页面与引擎
   node scripts/smoke_chem.mjs      # 有机化学 / 分析化学页面
   node scripts/smoke_hub.mjs       # 首页统计
   ```

## 新增 / 修改概念手册

1. 编辑 `data/_parts/handbook/<科目>/NN.json`，格式与硬性要求见 `data/_parts/handbook/README.md`，可参考样例 `data/_parts/handbook/pharm/01.json`；单元标题以 `data/_parts/handbook/_chapters.json` 为准。
2. 校验（可只校验部分单元）：

   ```bash
   python scripts/validate_handbook.py
   python scripts/validate_handbook.py --subject pharm --only 01,02
   ```

3. 重新构建三科数据：

   ```bash
   python scripts/build_handbook.py --parts data/_parts/handbook/pharm --out data/handbook-pharm.js --global HANDBOOK_PHARM
   python scripts/build_handbook.py --parts data/_parts/handbook/organic --out data/handbook-organic.js --global HANDBOOK_ORGANIC
   python scripts/build_handbook.py --parts data/_parts/handbook/analytical --out data/handbook-analytical.js --global HANDBOOK_ANALYTICAL
   ```

4. 重新生成打印版（Markdown / Word）并跑冒烟测试：

   ```bash
   python scripts/export_handbook_md.py
   python scripts/export_handbook_docx.py
   node scripts/smoke_handbook.mjs
   ```

## 说明

- 原药理学选择题文档的参考答案存在部分错误，已按教材标准答案修正（详见勘误说明）。
- 有机化学中结构式以文本表示（如 `CH3CH2OH`、`Ph-OH`），不使用图片。
- 概念手册为陈述式速查资料，剂量等数值多采用定性与公认值表述，具体用药请以教材和临床为准。
- 数据由教材与考研大纲整理，仅供复习参考，不保证覆盖所有院校自命题范围。

---

## 如何部署到 GitHub Pages

1. 在 GitHub 新建一个仓库（如 `shuatizhushou`），**Public 公开**；
2. 把本目录下的全部文件上传到仓库根目录（含 `assets/`、`data/`）；
3. 仓库 → **Settings** → **Pages**；
4. `Source` 选择 `Deploy from a branch`，分支选 `main`，目录选 `/ (root)`，点 **Save**；
5. 等待 1 分钟左右，页面会显示访问地址 `https://<你的用户名>.github.io/<仓库名/>`。
