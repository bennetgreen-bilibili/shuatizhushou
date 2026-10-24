import fs from "node:fs";
import vm from "node:vm";

class ClassList {
  constructor(el){ this.el = el; }
  get set(){ return this.el._classes; }
  add(){ for(const c of arguments) this.set.add(c); }
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
    this.tagName = (tag || "DIV").toUpperCase();
    this._classes = new Set();
    this._children = [];
    this.style = {};
    this._text = "";
    this.attributes = {};
    this.checked = false;
    this.value = "";
    this.onclick = null;
    this.oninput = null;
    this.onchange = null;
  }
  get classList(){ return new ClassList(this); }
  get textContent(){ return this._text; }
  set textContent(v){ this._text = String(v); }
  set innerHTML(v){ this._html = String(v); if(v === "") this._children = []; }
  get innerHTML(){ return this._html || ""; }
  setAttribute(k, v){ this.attributes[k] = String(v); }
  getAttribute(k){ return this.attributes[k]; }
  appendChild(c){ this._children.push(c); return c; }
  querySelector(){ return null; }
  scrollIntoView(){}
  focus(){}
  get children(){ return this._children; }
}
class Document {
  constructor(){
    this._els = new Map();
    this.readyState = "complete";
    this._keydown = [];
    this.body = new El("body");
  }
  getElementById(id){
    if(!this._els.has(id)) this._els.set(id, new El(id));
    return this._els.get(id);
  }
  createElement(tag){ return new El("", tag); }
  addEventListener(ev, fn){ if(ev === "keydown") this._keydown.push(fn); }
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
  document: doc, localStorage: new Storage(),
  setTimeout: () => 0, clearTimeout: () => {},
  console, JSON, Math, Date, Object, Array, String, Number, RegExp, Boolean, parseInt
};
ctx.window = ctx;
vm.createContext(ctx);
for(const f of ["data/handbook-pharm.js", "data/handbook-organic.js", "data/handbook-analytical.js"]){
  if(!fs.existsSync(f)){ console.error("MISSING " + f); process.exit(1); }
  vm.runInContext(fs.readFileSync(f, "utf8"), ctx);
}
ctx.HANDBOOK_CONFIG = {
  initial: "pharm",
  subjects: [
    { id: "pharm", name: "药理学", dataVar: "HANDBOOK_PHARM", key: "handbook_pharm_v1", color: "#2563eb", emoji: "💊" },
    { id: "organic", name: "有机化学", dataVar: "HANDBOOK_ORGANIC", key: "handbook_organic_v1", color: "#0f766e", emoji: "🧪" },
    { id: "analytical", name: "分析化学", dataVar: "HANDBOOK_ANALYTICAL", key: "handbook_analytical_v1", color: "#7c3aed", emoji: "⚗️" }
  ]
};
vm.runInContext(fs.readFileSync("assets/handbook.js", "utf8"), ctx);

const app = ctx.HANDBOOK_APP;
const el = id => doc.getElementById(id);
const defsOf = d => d.chapters.reduce((n, ch) => n + ch.blocks.filter(b => b.t === "defs").reduce((m, b) => m + b.items.length, 0), 0);
const totalUnits = ctx.HANDBOOK_PHARM.chapters.length + ctx.HANDBOOK_ORGANIC.chapters.length + ctx.HANDBOOK_ANALYTICAL.chapters.length;
const totalDefs = defsOf(ctx.HANDBOOK_PHARM) + defsOf(ctx.HANDBOOK_ORGANIC) + defsOf(ctx.HANDBOOK_ANALYTICAL);

must(totalUnits === 66, "三科单元总数 66（实际 " + totalUnits + "）");
must(el("hbUnits").textContent === totalUnits + " 个单元", "顶部单元统计 " + el("hbUnits").textContent);
must(el("hbDefs").textContent === totalDefs + " 条概念", "顶部概念统计 " + el("hbDefs").textContent);
must(app.subject() === "pharm", "默认科目为药理学");
must(el("subjectTabs").innerHTML.includes("药理学") && el("subjectTabs").innerHTML.includes("分析化学"), "三科切换标签渲染");
must(el("sideList").innerHTML.includes("药理学绪论"), "侧栏目录渲染");
must(app.contentHTML().includes("药理学绪论") && app.contentHTML().includes("核心概念"), "正文渲染单元与板块");
must(app.contentHTML().includes("<mark>") === false, "无搜索时不出现高亮");

app.toggleLearned(0);
const p1 = JSON.parse(ctx.localStorage.getItem("handbook_pharm_v1"));
must(p1 && p1.learned.length === 1 && p1.learned[0] === 0, "已背标记写入本地进度");
must(el("hbLearned").textContent === "1", "顶部已背计数 1");
must(app.isLearned(0) === true, "已背状态可查询");
app.setHideLearned(true);
must(app.contentHTML().includes('id="unit-0"') === false, "隐藏已背后可隐藏单元");
app.setHideLearned(false);

app.setSearch("首过");
must(app.contentHTML().includes("<mark>"), "搜索结果高亮");
must(app.contentHTML().includes("首过"), "搜索命中相关概念");
const hits = app.hits();
const hitUnits = Object.keys(hits).filter(k => hits[k] > 0).length;
must(hitUnits > 0 && hitUnits < 37, "搜索只保留命中的单元（" + hitUnits + " 个）");
must(el("searchInfo").textContent.includes("命中"), "搜索信息显示命中数");
app.setSearch("");

app.selectSubject("organic");
must(app.subject() === "organic", "切换到有机化学");
must(el("hbLearned").textContent === "0", "切换科目后已背计数独立");
must(app.contentHTML().includes("有机化学绪论与结构基础"), "有机化学正文渲染");
app.selectSubject("analytical");
must(app.subject() === "analytical", "切换到分析化学");
must(app.contentHTML().includes("误差与分析数据处理"), "分析化学正文渲染");

console.log("\nhandbook smoke test " + (process.exitCode ? "FAILED" : "OK"));
process.exit(process.exitCode || 0);
