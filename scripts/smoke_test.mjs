import fs from "node:fs";
import vm from "node:vm";

class ClassList {
  constructor(el){ this.el = el; }
  get set(){ return this.el._classes; }
  add(c){ this.set.add(c); this.el._sync(); }
  remove(c){ this.set.delete(c); this.el._sync(); }
  contains(c){ return this.set.has(c); }
  toggle(c, force){
    const want = force === undefined ? !this.set.has(c) : !!force;
    if(want) this.set.add(c); else this.set.delete(c);
    this.el._sync();
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
    this._html = "";
    this.attributes = {};
    this.className = "";
    this.checked = false;
    this.value = "all";
    this.files = null;
    this.onclick = null;
    this.onchange = null;
    this.parent = null;
  }
  get classList(){ return new ClassList(this); }
  set className(v){ this._classes = new Set(String(v).split(/\s+/).filter(Boolean)); this._sync(); }
  get className(){ return [...this._classes].join(" "); }
  _sync(){ /* className getter reflects set */ }
  set innerHTML(v){ this._html = String(v); if(v === "") this._children = []; }
  get innerHTML(){ return this._html; }
  setAttribute(k, v){ this.attributes[k] = String(v); }
  getAttribute(k){ return this.attributes[k]; }
  appendChild(c){ c.parent = this; this._children.push(c); return c; }
  removeChild(c){ this._children = this._children.filter(x => x !== c); return c; }
  click(){ if(this.onclick) this.onclick(); }
  addEventListener(ev, fn){ this["on" + ev] = fn; }
}
class Document {
  constructor(){
    this.title = "";
    this._els = new Map();
    this._keydown = [];
    this.documentElement = new El("html", "html");
    this.documentElement.style.setProperty = () => {};
    this.body = new El("body", "body");
  }
  getElementById(id){
    if(!this._els.has(id)) this._els.set(id, new El(id));
    return this._els.get(id);
  }
  createElement(tag){ return new El("", tag); }
  querySelectorAll(sel){
    if(sel === "#options .opt") return this.getElementById("options")._children.filter(c => c._classes.has("opt"));
    return [];
  }
  addEventListener(ev, fn){ if(ev === "keydown") this._keydown.push(fn); }
}
class Storage {
  constructor(){ this.m = new Map(); }
  getItem(k){ return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v){ this.m.set(k, String(v)); }
}
function makeCtx(){
  const doc = new Document();
  const ctx = {
    document: doc,
    localStorage: new Storage(),
    alert: () => {},
    Blob: function(){},
    URL: { createObjectURL: () => "blob:x", revokeObjectURL: () => {} },
    FileReader: function(){},
    setTimeout: () => 0,
    console,
    JSON, Math, Date, Object, Array, String, Number, parseInt, RegExp, Boolean
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  return ctx;
}
function must(cond, msg){
  if(!cond){ console.error("FAIL: " + msg); process.exitCode = 1; }
  else console.log("ok - " + msg);
}

const ctx = makeCtx();
vm.runInContext(fs.readFileSync("data/pharm.js", "utf8"), ctx);
ctx.window.QUIZ_CONFIG = {
  subject: "药理学", storageKey: "pharm_progress_v3", oldWrongKey: "pharm_wrong_qids_v1_bak",
  dataVar: "PHARM_DATA", exportName: "药理学", brand: "#2563eb", brand2: "#1d4ed8"
};
vm.runInContext(fs.readFileSync("assets/quiz.js", "utf8"), ctx);
const d = ctx.document;
const el = id => d.getElementById(id);

must(el("qTotal").textContent === 1077, "题总数显示为 1077");
const chapOptions = el("chapSelect")._children;
must(chapOptions.length === 48, "章节下拉为 47+全部 = 48 项，实际 " + chapOptions.length);
must(el("stem").textContent.length > 0, "首题题干已渲染: " + el("stem").textContent.slice(0, 20));
const opts = d.querySelectorAll("#options .opt");
must(opts.length === 5, "选项渲染 5 个");
must(el("qMeta").innerHTML.includes("1 / 1077"), "进度显示 1 / 1077");

// 点击 B 选项 → 提交
opts[1].click();
must(opts[1]._classes.has("selected"), "点击后 B 选项选中");
el("submitBtn").onclick();
must(el("explain")._classes.has("show"), "提交后显示解析");
must(el("expList")._children.length >= 4, "解析列出每个选项");
must(el("nextBtn").style.display === "", "提交后显示下一题按钮");
const wasWrong = el("wrongNote").textContent.includes("错题");
if(wasWrong) must(ctx.localStorage.getItem("pharm_progress_v3").includes("ph01_q01"), "答错写入错题本");
el("nextBtn").onclick();
must(el("qMeta").innerHTML.includes("2 / 1077"), "下一题后显示 2 / 1077");

// 章节筛选
el("chapSelect").value = "0";
el("chapSelect").onchange();
must(el("qMeta").innerHTML.includes("1 / 11"), "第一章筛选后 11 题");
must(el("qScore").textContent.includes("第一章"), "章节名显示正确");
// 后期章节（第四十五章 抗肿瘤药，索引 44）
el("chapSelect").value = "44";
el("chapSelect").onchange();
must(el("qMeta").innerHTML.includes("1 / 14"), "第四十五章筛选后 14 题");
must(el("qScore").textContent.includes("第四十五章"), "章节名称显示正确");

// 错题本为空时的空状态，再切回来（回归原版空状态破坏 DOM 的 bug）
el("clearWrongBtn").onclick();
el("wrongChk").checked = true;
el("wrongChk").onchange();
must(el("emptyCard").style.display === "" && el("questionCard").style.display === "none", "错题本为空时显示空状态");
el("wrongChk").checked = false;
el("wrongChk").onchange();
must(el("emptyCard").style.display === "none" && el("questionCard").style.display === "", "取消只看错题后恢复题目卡片");

// 键盘快捷键
el("chapSelect").value = "all";
el("chapSelect").onchange();
const kd = d._keydown[0];
must(typeof kd === "function", "已注册键盘事件");
kd({ key: "a", target: { tagName: "BODY" }, preventDefault: () => {} });
const cur = d.querySelectorAll("#options .opt")[0];
must(cur._classes.has("selected"), "键盘 A 选中 A 选项");
kd({ key: "Enter", target: { tagName: "BODY" }, preventDefault: () => {} });
must(el("explain")._classes.has("show"), "键盘 Enter 提交并显示解析");

// 随机 + 进度筛选
el("progSelect").value = "answered";
el("progSelect").onchange();
must(el("qMeta").innerHTML.includes(" / "), "已做筛选可渲染");

process.exit(process.exitCode || 0);