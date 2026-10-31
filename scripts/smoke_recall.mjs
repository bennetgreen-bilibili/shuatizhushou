import fs from "node:fs";
import vm from "node:vm";

class ClassList {
  constructor(el){ this.el = el; }
  get set(){ return this.el._classes; }
  add(c){ this.set.add(c); }
  remove(c){ this.set.delete(c); }
  contains(c){ return this.set.has(c); }
  toggle(c, force){
    const want = force === undefined ? !this.set.has(c) : !!force;
    if(want) this.set.add(c); else this.set.delete(c);
    return want;
  }
}
class El {
  constructor(id, tag){
    this.id = id || "";
    this.tagName = (tag || "div").toUpperCase();
    this._classes = new Set();
    this.style = {};
    this.textContent = "";
    this.attributes = {};
    this.checked = false;
    this.value = "";
    this.onclick = null;
    this.onchange = null;
    this._html = "";
    this.parentNode = null;
  }
  get classList(){ return new ClassList(this); }
  set innerHTML(v){ this._html = String(v); }
  get innerHTML(){ return this._html; }
  setAttribute(k, v){ this.attributes[k] = String(v); }
  getAttribute(k){ return this.attributes[k]; }
  click(){ if(this.onclick) this.onclick({ target: this }); }
}
class Document {
  constructor(){
    this.title = "";
    this.readyState = "complete";
    this._els = new Map();
  }
  getElementById(id){
    if(!this._els.has(id)) this._els.set(id, new El(id));
    return this._els.get(id);
  }
  createElement(tag){ return new El("", tag); }
  querySelectorAll(){ return []; }
  addEventListener(){}
}
class Storage {
  constructor(){ this.m = new Map(); }
  getItem(k){ return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v){ this.m.set(k, String(v)); }
}
function must(cond, msg){
  if(!cond){ console.error("FAIL: " + msg); process.exitCode = 1; }
  else console.log("ok - " + msg);
}
const doc = new Document();
const ctx = {
  document: doc,
  localStorage: new Storage(),
  location: { search: "?subject=pharm" },
  confirm: () => true,
  setTimeout: () => 0,
  console, JSON, Math, Date, Object, Array, String, Number, parseInt, RegExp, Boolean, decodeURIComponent, encodeURIComponent
};
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ["data/recall-pharm.js", "data/recall-organic.js", "data/recall-analytical.js"]) {
  vm.runInContext(fs.readFileSync(f, "utf8"), ctx);
}
const totalOf = d => d.chapters.reduce((n, ch) => n + (ch.questions || []).length, 0);
const typeOf = (d, t) => d.chapters.reduce((n, ch) => n + (ch.questions || []).filter(q => q.type === t).length, 0);
const pharm = ctx.RECALL_PHARM, organic = ctx.RECALL_ORGANIC;
must(totalOf(pharm) > 500, "药理学自测题数 " + totalOf(pharm));
must(typeOf(pharm, "T") > 30, "药理学判断题 " + typeOf(pharm, "T"));
must(typeOf(pharm, "S") > 30, "药理学简答题 " + typeOf(pharm, "S"));
ctx.RECALL_CONFIG = {
  initial: "pharm",
  subjects: [
    { id: "pharm", name: "药理学", dataVar: "RECALL_PHARM", key: "recall_pharm_v1", color: "#2563eb", emoji: "💊" },
    { id: "organic", name: "有机化学", dataVar: "RECALL_ORGANIC", key: "recall_organic_v1", color: "#0f766e", emoji: "🧪" },
    { id: "analytical", name: "分析化学", dataVar: "RECALL_ANALYTICAL", key: "recall_analytical_v1", color: "#7c3aed", emoji: "⚗️" }
  ]
};
vm.runInContext(fs.readFileSync("assets/recall.js", "utf8"), ctx);
const app = ctx.RECALL_APP;
console.log("\n== 回忆自测 ==");
must(app.count() === totalOf(pharm), "默认科目题数 = 药理学 " + totalOf(pharm));
must(app.markup().includes("rc-card"), "卡片已渲染");
must(!app.markup().includes("rc-card revealed"), "答案默认隐藏");
must(doc.getElementById("recallStats").textContent.includes("共"), "统计已显示: " + doc.getElementById("recallStats").textContent);
app.toggleShow(true);
must(app.markup().includes("rc-card revealed"), "点按钮后答案显示");
must((app.markup().match(/rc-answer/g) || []).length >= 10, "答案区已输出");
app.toggleShow(false);
must(!app.markup().includes("rc-card revealed"), "再点按钮后答案隐藏");
const typeSel = doc.getElementById("typeSel");
typeSel.value = "T";
typeSel.onchange();
must(app.count() === typeOf(pharm, "T"), "题型筛选-判断 " + app.count());
app.selectSubject("organic");
must(app.count() === totalOf(organic), "切换科目-有机 " + app.count());
must(doc.getElementById("subjectTabs").innerHTML.includes("有机化学"), "科目标签正常");
console.log(process.exitCode ? "SMOKE FAILED" : "SMOKE OK");
