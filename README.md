# 考研药学综合刷题

药理学、有机化学、分析化学三科刷题网页 + 三科概念手册，基于报考院校参考书目与考研大纲整理，可直接在线使用或本地离线打开。

- 三科分页面：**药理学**、**有机化学**、**分析化学**，首页统一入口
- **概念手册**：按 4 本参考书**逐章对齐**的 **88 个单元 / 1529 条核心概念 / 1211 条要点 / 175 个对比表 / 522 条易混提示**，不是题目，而是按单元整理、可直接背诵与速查的体系化资料，支持搜索、已背标记、打印
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
| 药理学 | 47 章 | 1077 | 参考书 47 章：总论、传出/中枢神经、心血管、血液/呼吸/消化、内分泌、生殖与骨代谢、化学治疗、免疫与生物技术药物 |
| 有机化学 | 18 章 | 272 | 参考书 18 章：绪论与化学键、烃类、立体化学、卤代烃、醇酚醚、醛酮醌、羧酸及衍生物、取代羧酸、含氮化合物、氨基酸多肽蛋白质、杂环、糖类、萜类与甾体 |
| 分析化学 | 23 章 | 305 | 化学分析 10 章 + 仪器分析 13 章：误差与数据处理、重量分析、四大滴定、电位法；UV-Vis、荧光、IR、原子光谱、NMR、MS、波谱综合解析、色谱概论、经典液相、GC、HPLC |
| **合计** | **88 章** | **1654** | 与参考书目逐章对应 |

- 选择题与概念手册的章节划分一致：第 N 章 = 教材第 N 章（分析化学第 1–10 章为化学分析、第 11–23 章为仪器分析）。
- 题型包含 A 型单选与 X 型多选；药理学原题库的 B/C 型配对题仍保留。
- 原「16 章基础 + 7 组高频补充」已拆分并入对应教材章节；原 15/14 章题库也按教材拆分（如"沉淀滴定与重量分析"拆成两章）。

### 2026-10-31 题库升级

结合新增的复习资料（`学习资料/`：药理学笔记与三色笔记、武汉大学《分析化学》试题库与期末卷、有机化学复习总结与试题）做了一轮系统扩容与复核，题量 1111 → **1654**：

- **药理学** 723 → 1077：第 20–47 章由每章 4 题补到 13–16 题（按《药理学笔记》逐章撰写）；第 1–19 章逐题核对答案与解析，修正答案错误、把"选项解析过短/空话"改写为机制依据。
- **分析化学** 206 → 305：新增题以《分析化学练习题及答案》《期末试题及参考答案》清洗后的真题为主，逐题核对答案；仪器分析 11–23 章的空白章补足计算与仪器原理题。
- **有机化学** 182 → 272：用复习总结与试题资料补足薄弱章（脂环烃、氨基酸、糖类、萜类甾体等），并复核全部原题答案。
- 所有新增题都过 `validate.py` 校验：答案/选项解析齐全、无重复题干、X 型无全选；三科页面冒烟测试通过。
- 逐章题量与主要修正记录见 [`题库复核记录-2026-10-31.md`](题库复核记录-2026-10-31.md)。

## 概念手册构成

概念手册独立于选择题，按「单元 → 核心概念 / 要点梳理 / 分类对比表 / 易混与记忆」组织。单元与报考院校参考书**章章对应**（对照表见 [`参考书目与目录对照.md`](参考书目与目录对照.md)）：

| 科目 | 单元 | 核心概念 | 要点 | 对比表 | 易混提示 | 覆盖内容 |
| --- | --- | --- | --- | --- | --- | --- |
| 药理学 | 47 | 804 | 668 | 93 | 288 | 参考书 47 章：总论、传出/中枢神经、心血管、血液/呼吸/消化、内分泌、生殖与骨代谢、化学治疗、免疫与生物技术药物 |
| 有机化学 | 18 | 326 | 244 | 36 | 114 | 参考书 18 章：绪论与化学键、烃类、立体化学、卤代烃、醇酚醚、醛酮醌、羧酸及衍生物、取代羧酸、含氮化合物、氨基酸多肽蛋白质、杂环、糖类、萜类与甾体 |
| 分析化学 | 23 | 399 | 299 | 46 | 120 | 化学分析 10 章 + 仪器分析 13 章：误差与数据处理、重量分析、四大滴定、电位法；UV-Vis、荧光、IR、原子光谱、NMR、MS、波谱综合解析、色谱概论、经典液相、GC、HPLC |
| **合计** | **88** | **1529** | **1211** | **175** | **522** | 参考书章章有对应单元 |

- **单元标题与参考书章标题逐字一致**，第 N 单元 = 教材第 N 章；分析化学第 1–10 单元为化学分析（上册），第 11–23 单元为仪器分析。
选择题库与概念手册现在统一按参考书章目录组织（88 章 / 88 单元）：**题库用来刷题，手册用来按教材顺序通读**。

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
| `data/pharm.js` | 药理学题库（按参考书 47 章重组，含原题库与高频补充） |
| `data/organic.js` | 有机化学题库（18 章） |
| `data/analytical.js` | 分析化学题库（23 章） |
| `data/handbook-pharm.js`、`data/handbook-organic.js`、`data/handbook-analytical.js` | 概念手册数据（由分章源文件构建） |
| `参考书目与目录对照.md` | 4 本参考书的章节目录与概念手册单元对应关系（本次对齐依据） |
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
5. 通读完一个单元勾选「已背完」；勾选「隐藏已背完单元」可只看没过的部分。进度按科目保存在本机浏览器（`handbook_<科目>_v2`；因单元按参考书重排，旧版 v1 进度不再兼容）。
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
   python scripts/build_data.py --parts data/_parts/pharm --out data/pharm.js --global PHARM_DATA --id-prefix ph
   python scripts/build_data.py --parts data/_parts/organic --out data/organic.js --global ORGANIC_DATA --id-prefix org
   python scripts/build_data.py --parts data/_parts/analytical --out data/analytical.js --global ANALYTICAL_DATA --id-prefix ana
   ```

3. 校验结构、答案、选项讲解、重复题：

   ```bash
   python scripts/validate.py --legacy data/pharm.js          # 药理学保留原文档 B/C 型题与原始表述
   python scripts/validate.py data/organic.js data/analytical.js
   python scripts/check_plan.py
   ```

   三科分片源文件在 `data/_parts/pharm`、`data/_parts/organic`、`data/_parts/analytical`，每个文件 = 教材一章（47 / 18 / 23 个）。

4. 修改共享引擎后运行冒烟测试（需要 Node.js）：

   ```bash
   node scripts/smoke_test.mjs      # 药理学页面与引擎
   node scripts/smoke_chem.mjs      # 有机化学 / 分析化学页面
   node scripts/smoke_hub.mjs       # 首页统计
   ```

## 新增 / 修改概念手册

1. 编辑 `data/_parts/handbook/<科目>/NN.json`，格式与硬性要求见 `data/_parts/handbook/README.md`，可参考样例 `data/_parts/handbook/pharm/02.json`；单元标题以 `data/_parts/handbook/_chapters.json` 为准（药理学 47、有机化学 18、分析化学 23 个单元，与参考书章一一对应，见 `参考书目与目录对照.md`）。
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
- 概念手册与选择题库均已按报考院校参考书目逐章重排（药理学 47 章、有机化学 18 章、分析化学 23 章）；旧版 66 单元手册结构与 52 章题库结构不再使用，进度键升级（手册 v2、选择题 v3）。
- 数据由教材与考研大纲整理，仅供复习参考，不保证覆盖所有院校自命题范围。

---

## 如何部署到 GitHub Pages

1. 在 GitHub 新建一个仓库（如 `shuatizhushou`），**Public 公开**；
2. 把本目录下的全部文件上传到仓库根目录（含 `assets/`、`data/`）；
3. 仓库 → **Settings** → **Pages**；
4. `Source` 选择 `Deploy from a branch`，分支选 `main`，目录选 `/ (root)`，点 **Save**；
5. 等待 1 分钟左右，页面会显示访问地址 `https://<你的用户名>.github.io/<仓库名/>`。