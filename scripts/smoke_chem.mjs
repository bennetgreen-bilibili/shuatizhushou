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
  }
  getElementById(id){
    if(!this._els.has(id)) this._els.set(id, new El(id));
    return this._els.get(id);
  }
  createElement(tag){ return new El("", tag); }
  querySelectorAll(sel){ return sel === "#options .opt" ? this.getElementById("options")._children : []; }
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
function runCase({ file, dataVar, key, subject, expectedCount, expectedChapters }){
  const doc = new Document();
  const ctx = { document: doc, localStorage: new Storage(), alert: () => {}, Blob: function(){}, URL: { createObjectURL: () => "", revokeObjectURL: () => {} }, FileReader: function(){}, setTimeout: () => 0, console, JSON, Math, Date, Object, Array, String, Number, parseInt, RegExp, Boolean };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, "utf8"), ctx);
  ctx.window.QUIZ_CONFIG = { subject, storageKey: key, dataVar, exportName: subject, brand: "#000", brand2: "#000" };
  vm.runInContext(fs.readFileSync("assets/quiz.js", "utf8"), ctx);
  const el = id => doc.getElementById(id);
  console.log("\n== " + subject + " ==");
  must(Number(el("qTotal").textContent) === expectedCount, subject + " 总题数 " + el("qTotal").textContent);
  must(el("chapSelect")._children.length === expectedChapters + 1, subject + " 章节下拉 " + el("chapSelect")._children.length + " 项");
  must(el("stem").textContent.length > 5, subject + " 首题已渲染: " + el("stem").textContent.slice(0, 24));
  const opts = doc.querySelectorAll("#options .opt");
  must(opts.length === 5, subject + " 选项数 5");
  opts[0].click();
  el("submitBtn").onclick();
  must(el("explain")._classes.has("show"), subject + " 提交后显示解析");
  must(el("expList")._children.length === 5, subject + " 五个选项均有讲解");
  el("nextBtn").onclick();
  must(el("qMeta").innerHTML.includes("2 / "), subject + " 下一题正常");
  // 章节筛选
  el("chapSelect").value = "0";
  el("chapSelect").onchange();
  must(el("qScore").textContent.includes("第一章"), subject + " 章节筛选正常");
  // X 型筛选
  el("chapSelect").value = "all";
  el("typeSelect").value = "multi";
  el("typeSelect").onchange();
  must(el("multiHint").style.display === "", subject + " 多选提示显示");
  must(el("qMeta").innerHTML.includes("X 型"), subject + " 筛选到 X 型题");
}
runCase({ file: "data/organic.js", dataVar: "ORGANIC_DATA", key: "organic_progress_v3", subject: "有机化学", expectedCount: 182, expectedChapters: 18 });
runCase({ file: "data/analytical.js", dataVar: "ANALYTICAL_DATA", key: "analytical_progress_v3", subject: "分析化学", expectedCount: 206, expectedChapters: 23 });
process.exit(process.exitCode || 0);