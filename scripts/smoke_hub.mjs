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
for(const f of ["data/pharm.js", "data/pharm-extra.js", "data/organic.js", "data/analytical.js"]){
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
must(String(t("grandChapters")) === "52", "首页章节数: " + t("grandChapters"));
const total = Number(t("total-pharm")) + Number(t("total-organic")) + Number(t("total-analytical"));
must(total === Number(t("grandTotal")), "各科题数之和 = 总题数 (" + total + ")");
// 进度统计：写入一条 pharm 进度，重新执行脚本
const p = { wrong: [], stats: {} };
p.stats["ch01_q01"] = { c: 1, w: 0 };
ctx.localStorage.setItem("pharm_progress_v2", JSON.stringify(p));
vm.runInContext(hubJs, ctx);
must(String(t("answered-pharm")) === "1", "首页读取已答进度: " + t("answered-pharm"));
must(String(t("rate-pharm")) === "100%", "首页正确率: " + t("rate-pharm"));
process.exit(process.exitCode || 0);
