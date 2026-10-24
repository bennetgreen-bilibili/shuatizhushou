import fs from "node:fs";
import vm from "node:vm";

function must(cond, msg){
  if(!cond){ console.error("FAIL: " + msg); process.exitCode = 1; }
  else console.log("ok - " + msg);
}
class El {
  constructor(){ this.textContent = ""; this.style = {}; }
}
class Document {
  constructor(){ this._els = new Map(); }
  getElementById(id){
    if(!this._els.has(id)) this._els.set(id, new El());
    return this._els.get(id);
  }
}
class Storage {
  constructor(){ this.m = new Map(); }
  getItem(k){ return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v){ this.m.set(k, String(v)); }
}
const doc = new Document();
const ctx = { document: doc, localStorage: new Storage(), console, JSON, Math, Object, Array, String, parseInt };
ctx.window = ctx;
vm.createContext(ctx);
const files = ["data/pharm.js", "data/organic.js", "data/analytical.js",
  "data/handbook-pharm.js", "data/handbook-organic.js", "data/handbook-analytical.js"];
for(const f of files){
  if(!fs.existsSync(f)){ console.error("MISSING " + f); process.exitCode = 1; continue; }
  vm.runInContext(fs.readFileSync(f, "utf8"), ctx);
}
const html = fs.readFileSync("index.html", "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const hubJs = scripts.find(s => s.includes("SUBJECTS"));
must(!!hubJs, "首页内联脚本已找到");
vm.runInContext(hubJs, ctx);
const t = id => doc.getElementById(id).textContent;
must(t("total-pharm") !== "—" && t("total-pharm") !== "", "药理学总题数: " + t("total-pharm"));
must(t("total-organic") !== "—" && t("total-organic") !== "", "有机化学总题数: " + t("total-organic"));
must(t("total-analytical") !== "—" && t("total-analytical") !== "", "分析化学总题数: " + t("total-analytical"));
must(t("grandTotal") !== "—", "首页总题数: " + t("grandTotal"));
must(String(t("grandChapters")) === "88", "首页章节数: " + t("grandChapters"));
must(String(t("total-pharm")) === "723", "药理学 723 题: " + t("total-pharm"));
must(String(t("total-organic")) === "182", "有机化学 182 题: " + t("total-organic"));
must(String(t("total-analytical")) === "206", "分析化学 206 题: " + t("total-analytical"));
must(String(t("grandTotal")) === "1111", "总题数 1111: " + t("grandTotal"));
const total = Number(t("total-pharm")) + Number(t("total-organic")) + Number(t("total-analytical"));
must(total === Number(t("grandTotal")), "各科题数之和 = 总题数 (" + total + ")");

const defsOf = d => d.chapters.reduce((n, ch) => n + ch.blocks.filter(b => b.t === "defs").reduce((m, b) => m + b.items.length, 0), 0);
const units = ctx.HANDBOOK_PHARM.chapters.length + ctx.HANDBOOK_ORGANIC.chapters.length + ctx.HANDBOOK_ANALYTICAL.chapters.length;
const defs = defsOf(ctx.HANDBOOK_PHARM) + defsOf(ctx.HANDBOOK_ORGANIC) + defsOf(ctx.HANDBOOK_ANALYTICAL);
must(units === 88, "概念手册单元数 88（实际 " + units + "）");
must(String(t("total-handbook")) === "88", "首页概念手册单元: " + t("total-handbook"));
must(String(t("defs-handbook")) === String(defs), "首页概念条数: " + t("defs-handbook"));
must(String(t("grandConcept")) === String(defs), "首页 hero 概念条数: " + t("grandConcept"));
must(String(t("learned-handbook")) === "0", "首页概念手册初始已背: " + t("learned-handbook"));

// 选择题进度统计
const p = { wrong: [], stats: {} };
p.stats["ph01_q01"] = { c: 1, w: 0 };
ctx.localStorage.setItem("pharm_progress_v3", JSON.stringify(p));
vm.runInContext(hubJs, ctx);
must(String(t("answered-pharm")) === "1", "首页读取已答进度: " + t("answered-pharm"));
must(String(t("rate-pharm")) === "100%", "首页正确率: " + t("rate-pharm"));

// 概念手册已背统计
ctx.localStorage.setItem("handbook_pharm_v2", JSON.stringify({ learned: [0, 1] }));
vm.runInContext(hubJs, ctx);
must(String(t("learned-handbook")) === "2", "首页概念手册已背统计: " + t("learned-handbook"));
process.exit(process.exitCode || 0);