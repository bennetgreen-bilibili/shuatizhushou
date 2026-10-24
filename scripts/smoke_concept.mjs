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
    this._children = [];
    this.style = {};
    this.textContent = "";
    this.attributes = {};
    this.checked = false;
    this.value = "all";
    this.files = null;
    this.onclick = null;
    this.onchange = null;
  }
  get classList(){ return new ClassList(this); }
  set className(v){ this._classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className(){ return [...this._classes].join(" "); }
  set innerHTML(v){ if(v === "") this._children = []; this._html = String(v); }
  get innerHTML(){ return this._html || ""; }
  setAttribute(k, v){ this.attributes[k] = String(v); }
  getAttribute(k){ return this.attributes[k]; }
  click(){ if(this.onclick) this.onclick(); }
  appendChild(c){ this._children.push(c); return c; }
  removeChild(c){ this._children = this._children.filter(x => x !== c); return c; }
}
class Document {
  constructor(){
    this.title = "";
    this._els = new Map();
    this._keydown = [];
    this.documentElement = { style: { setProperty: () => {} } };
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
  document: doc, localStorage: new Storage(), alert: () => {},
  Blob: function(){}, URL: { createObjectURL: () => "", revokeObjectURL: () => {} },
  FileReader: function(){}, setTimeout: () => 0,
  console, JSON, Math, Date, Object, Array, String, Number, parseInt, RegExp, Boolean
};
ctx.window = ctx;
vm.createContext(ctx);
for(const f of ["data/concept-pharm.js", "data/concept-organic.js", "data/concept-analytical.js"]){
  if(!fs.existsSync(f)){ console.error("MISSING " + f); process.exit(1); }
  vm.runInContext(fs.readFileSync(f, "utf8"), ctx);
}
ctx.window.CONCEPT_CONFIG = {
  initial: "pharm",
  subjects: [
    { id: "pharm", name: "药理学", dataVar: "CONCEPT_PHARM", key: "concept_pharm_v1", color: "#2563eb", color2: "#1d4ed8", emoji: "💊" },
    { id: "organic", name: "有机化学", dataVar: "CONCEPT_ORGANIC", key: "concept_organic_v1", color: "#0f766e", color2: "#0d9488", emoji: "🧪" },
    { id: "analytical", name: "分析化学", dataVar: "CONCEPT_ANALYTICAL", key: "concept_analytical_v1", color: "#7c3aed", color2: "#6d28d9", emoji: "⚗️" }
  ]
};
vm.runInContext(fs.readFileSync("assets/concept.js", "utf8"), ctx);

const el = id => doc.getElementById(id);
const dataTotal = ["CONCEPT_PHARM", "CONCEPT_ORGANIC", "CONCEPT_ANALYTICAL"].reduce((n, k) => {
  return n + (ctx[k].chapters || []).reduce((m, ch) => m + (ch.items || []).length, 0);
}, 0);
const pharmTotal = (ctx.CONCEPT_PHARM.chapters || []).reduce((m, ch) => m + ch.items.length, 0);

must(dataTotal === 260, "三科概念题总数 260（实际 " + dataTotal + "）");
must(Number(el("cTotal").textContent) === pharmTotal, "药理学概念条数 " + el("cTotal").textContent);
must(el("chapSelect")._children.length === 24, "药理学章节下拉 24 项");
must(el("subjectTabs")._children.length === 3, "三科切换标签 3 个");
must(el("stem").textContent.length > 1, "首条已渲染: " + el("stem").textContent);

// 名词解释：显示答案 → 记住了 → 进入下一条并记录进度
el("showBtn").onclick();
must(el("explain")._classes.has("show"), "显示答案后展示答案区");
must(el("answer").textContent.length > 10, "答案内容非空");
must(el("evalRow").style.display === "", "显示自评按钮");
el("knowBtn").onclick();
must(el("qMeta").innerHTML.includes("2 / " + pharmTotal), "自评后进入下一条");
const p1 = JSON.parse(ctx.localStorage.getItem("concept_pharm_v1"));
must(p1 && p1.stats && p1.stats["phc01i01"] && p1.stats["phc01i01"].k === 1, "记住了计入已练进度");

// 切换科目：有机化学
el("subjectTabs")._children[1].click();
const orgTotal = (ctx.CONCEPT_ORGANIC.chapters || []).reduce((m, ch) => m + ch.items.length, 0);
must(Number(el("cTotal").textContent) === orgTotal, "切换到有机化学 " + el("cTotal").textContent + " 条");
must(el("chapSelect")._children.length === 16, "有机化学章节下拉 16 项");

// 概念辨析：故意答错 → 进入不熟
el("typeSelect").value = "judge";
el("typeSelect").onchange();
const judgeItem = ctx.CONCEPT_ORGANIC.chapters[0].items.find(i => i.type === "judge");
must(el("judgeRow").style.display === "", "辨析题显示正确/错误按钮");
const wrongIdx = judgeItem.a ? 1 : 0;
el("judgeRow")._children[wrongIdx].click();
must(el("verdict").textContent.includes("错误"), "辨析答错提示");
must(el("whyBox").textContent.length > 10, "辨析展示解析");
let p2 = JSON.parse(ctx.localStorage.getItem("concept_organic_v1"));
must(p2 && p2.weak.length === 1, "答错自动进入不熟清单");
el("nextBtn").onclick();
must(/2 \/ 15/.test(el("qMeta").innerHTML), "辨析题下一题正常");

// 简答题：显示答案 → 不熟
el("typeSelect").value = "qa";
el("typeSelect").onchange();
el("showBtn").onclick();
el("againBtn").onclick();
p2 = JSON.parse(ctx.localStorage.getItem("concept_organic_v1"));
must(p2.weak.length === 2, "自评不熟计入不熟清单");

// 只看不熟（先重置题型，避免与简答筛选叠加）
el("typeSelect").value = "all";
el("typeSelect").onchange();
el("weakChk").checked = true;
el("weakChk").onchange();
must(/\/ 2/.test(el("qMeta").innerHTML), "只看不熟筛选出 2 条");
el("clearWeakBtn").onclick();
must(el("emptyCard").style.display === "", "清空不熟后显示空状态");

// 本章 5 条全部完成 → 总结 → 再来一轮
el("weakChk").checked = false;
el("typeSelect").value = "all";
el("typeSelect").onchange();
el("chapSelect").value = "0";
el("chapSelect").onchange();
must(/\/ 5/.test(el("qMeta").innerHTML), "章节筛选出 5 条");
for(let i = 0; i < 5; i++){
  if(el("judgeRow").style.display === ""){
    el("judgeRow")._children[0].click();
    el("nextBtn").onclick();
  } else {
    el("showBtn").onclick();
    el("knowBtn").onclick();
  }
}
must(el("summaryCard")._classes.has("show"), "答完全部后显示总结");
must(String(el("sTotal").textContent) === "5", "总结本轮条数 5");
el("againRestart").onclick();
must(/1 \/ 5/.test(el("qMeta").innerHTML), "再来一轮重新开始");

console.log("\nconcept smoke test " + (process.exitCode ? "FAILED" : "OK"));
process.exit(process.exitCode || 0);
