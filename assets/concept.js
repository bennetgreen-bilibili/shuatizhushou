(function(){
"use strict";

var CFG = window.CONCEPT_CONFIG || {};
var SUBJECTS = CFG.subjects || [];

var state = {
  subject: null,
  chapters: [],
  all: [],
  list: [],
  idx: 0,
  revealed: false,
  answered: false,
  knowCount: 0,
  weakRound: 0,
  answeredCount: 0,
  judgeBtns: []
};

function $(id){ return document.getElementById(id); }
function esc(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function subjectById(id){
  for(var i=0;i<SUBJECTS.length;i++){ if(SUBJECTS[i].id === id) return SUBJECTS[i]; }
  return null;
}
function typeName(t){
  return t === "term" ? "名词解释" : (t === "qa" ? "简答题" : "概念辨析");
}

/* ---------- 进度存储（按科目分 key） ---------- */
function pKey(){ return state.subject.key; }
function getP(){
  var p = null;
  try{ p = JSON.parse(localStorage.getItem(pKey())); }catch(e){ p = null; }
  if(!p || typeof p !== "object" || !Array.isArray(p.weak) || !p.stats || typeof p.stats !== "object"){
    p = { weak: [], stats: {} };
  }
  return p;
}
function saveP(p){ try{ localStorage.setItem(pKey(), JSON.stringify(p)); }catch(e){} }
function isWeak(id){ return getP().weak.indexOf(id) >= 0; }
function addWeak(id){
  var p = getP();
  if(p.weak.indexOf(id) < 0){ p.weak.push(id); saveP(p); }
}
function removeWeak(id){
  var p = getP();
  p.weak = p.weak.filter(function(x){ return x !== id; });
  saveP(p);
}
function recordAnswer(id, known){
  var p = getP();
  var st = p.stats[id] || { k: 0, u: 0 };
  if(known){ st.k++; } else { st.u++; }
  p.stats[id] = st;
  saveP(p);
}
function getStat(id){ return getP().stats[id]; }
function autoRemoveOn(){ var el = $("autoRemoveChk"); return !!(el && el.checked); }

/* ---------- 导出 / 导入 ---------- */
function exportProgress(){
  var p = getP();
  var payload = {
    app: "概念题", subject: state.subject.name, version: 1,
    total: state.all.length, weak: p.weak, stats: p.stats,
    exportedAt: new Date().toISOString()
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  var d = new Date();
  a.download = "概念题_" + state.subject.name + "_进度_" + d.getFullYear() + ("0"+(d.getMonth()+1)).slice(-2) + ("0"+d.getDate()).slice(-2) + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 500);
}
function importProgress(file){
  var reader = new FileReader();
  reader.onload = function(e){
    try{
      var data = JSON.parse(e.target.result);
      if(!data || typeof data !== "object") throw new Error("bad");
      var byId = {};
      state.all.forEach(function(x){ byId[x.item.id] = 1; });
      var weak = (Array.isArray(data.weak) ? data.weak : []).filter(function(id){ return byId[id]; });
      var stats = {};
      var raw = (data.stats && typeof data.stats === "object") ? data.stats : {};
      for(var id in raw){ if(byId[id]) stats[id] = raw[id]; }
      saveP({ weak: weak, stats: stats });
      updateHeader();
      buildList();
      alert("导入成功：不熟 " + weak.length + " 条，已练 " + Object.keys(stats).length + " 条。");
    }catch(err){
      alert("导入失败：文件格式不正确，请选择本页面导出的 .json 进度文件。");
    }
  };
  reader.readAsText(file);
}

/* ---------- 渲染 ---------- */
function render(){
  var card = $("conceptCard"), empty = $("emptyCard"), sum = $("summaryCard");
  var bar = $("progressBar");
  if(!card) return;

  if(state.list.length === 0){
    card.style.display = "none";
    if(sum) sum.classList.remove("show");
    if(bar) bar.style.width = "0%";
    var msg;
    if($("weakChk") && $("weakChk").checked){
      msg = '<div class="empty"><div class="big">🎉</div>「不熟」清单是空的。<br>自测时点「🤔 不熟」的条目会收进这里，方便集中复习。</div>';
    } else if($("progSelect") && $("progSelect").value === "unseen"){
      msg = '<div class="empty"><div class="big">🎉</div>当前筛选下没有未练的概念了。<br>换「全部进度」可以再练一遍。</div>';
    } else {
      msg = '<div class="empty"><div class="big">📭</div>当前筛选条件下没有题目。<br>试试切换科目 / 章节 / 题型。</div>';
    }
    empty.innerHTML = msg;
    empty.style.display = "";
    return;
  }
  empty.style.display = "none";
  if(state.idx >= state.list.length){ showSummary(); return; }
  card.style.display = "";

  var entry = state.list[state.idx];
  var it = entry.item;
  state.revealed = false;
  state.answered = false;
  state.judgeBtns = [];

  var weak = isWeak(it.id);
  var st = getStat(it.id);
  var status = weak ? '<span class="badge weak-tag">🤔 不熟</span>'
             : (st ? '<span class="badge done-tag">✅ 已练</span>'
                   : '<span class="badge new-tag">🆕 未练</span>');
  $("qMeta").innerHTML = '<span class="badge ' + it.type + '">' + typeName(it.type) + '</span>' +
      status + '<span>' + (state.idx + 1) + ' / ' + state.list.length + ' 题</span>';
  $("qWhere").textContent = entry.chapter;
  $("stem").textContent = it.q;

  var hint = $("hintBox");
  hint.style.display = "none";
  hint.textContent = "";
  var hintBtn = $("hintBtn");
  hintBtn.style.display = it.hint ? "" : "none";
  hintBtn.textContent = "💡 提示";

  var judgeRow = $("judgeRow");
  judgeRow.innerHTML = "";
  judgeRow.style.display = "none";
  var showBtn = $("showBtn");
  showBtn.style.display = "";
  showBtn.textContent = "显示答案";
  $("explain").classList.remove("show");
  $("verdict").textContent = "";
  $("verdict").className = "verdict";
  $("answer").textContent = "";
  $("whyBox").textContent = "";
  $("whyBox").style.display = "none";
  $("evalRow").style.display = "none";
  $("nextBtn").style.display = "none";

  if(it.type === "judge"){
    showBtn.style.display = "none";
    judgeRow.style.display = "";
    var mk = function(val){
      var b = document.createElement("button");
      b.className = "judge-btn";
      b.setAttribute("data-v", val ? "true" : "false");
      b.innerHTML = val ? "✔ 正确" : "✘ 错误";
      b.onclick = function(){ answerJudge(val); };
      judgeRow.appendChild(b);
      state.judgeBtns.push(b);
    };
    mk(true);
    mk(false);
  }
  $("kbHint").textContent = it.type === "judge"
    ? "快捷键：1 正确 · 2 错误 · Enter 下一题"
    : "快捷键：Enter / 空格 显示答案 · 1 记住了 · 2 不熟 · H 提示";
  if(bar) bar.style.width = Math.round(state.idx / state.list.length * 100) + "%";
}

function toggleHint(){
  var entry = state.list[state.idx];
  if(!entry) return;
  var it = entry.item;
  var box = $("hintBox");
  if(!it.hint) return;
  var btn = $("hintBtn");
  if(box.style.display === "none" || !box.style.display){
    box.innerHTML = "💡 提示：<b>" + esc(it.hint) + "</b>";
    box.style.display = "";
    btn.textContent = "隐藏提示";
  } else {
    box.textContent = "";
    box.style.display = "none";
    btn.textContent = "💡 提示";
  }
}

function reveal(){
  if(state.answered || state.revealed) return;
  var entry = state.list[state.idx];
  if(!entry) return;
  var it = entry.item;
  if(it.type === "judge") return;
  state.revealed = true;
  $("showBtn").style.display = "none";
  $("explain").classList.add("show");
  $("verdict").textContent = "📝 参考答案要点";
  $("verdict").className = "verdict ref";
  $("answer").textContent = it.a;
  $("evalRow").style.display = "";
}

function grade(known){
  if(!state.revealed || state.answered) return;
  var entry = state.list[state.idx];
  if(!entry) return;
  var it = entry.item;
  state.answered = true;
  state.answeredCount++;
  if(known){
    state.knowCount++;
    if(autoRemoveOn()) removeWeak(it.id);
  } else {
    state.weakRound++;
    addWeak(it.id);
  }
  recordAnswer(it.id, known);
  updateHeader();
  next();
}

function answerJudge(chosen){
  if(state.answered) return;
  var entry = state.list[state.idx];
  if(!entry) return;
  var it = entry.item;
  state.answered = true;
  state.answeredCount++;
  var ok = (chosen === it.a);
  if(ok){
    state.knowCount++;
    if(autoRemoveOn()) removeWeak(it.id);
  } else {
    state.weakRound++;
    addWeak(it.id);
  }
  recordAnswer(it.id, ok);

  var btns = state.judgeBtns;
  for(var i=0;i<btns.length;i++){
    var b = btns[i];
    var v = b.getAttribute("data-v") === "true";
    if(v === it.a) b.classList.add("is-correct");
    else if(v === chosen) b.classList.add("is-wrong");
    else b.classList.add("disabled");
  }
  $("explain").classList.add("show");
  $("verdict").textContent = ok ? "✔ 判断正确" : "✘ 判断错误";
  $("verdict").className = "verdict " + (ok ? "ok" : "no");
  $("answer").textContent = "参考答案：" + (it.a ? "正确" : "错误");
  $("whyBox").textContent = it.why || "";
  $("whyBox").style.display = "";
  var nb = $("nextBtn");
  nb.style.display = "";
  nb.textContent = (state.idx >= state.list.length - 1) ? "查看总结 →" : "下一题 →";
  updateHeader();
}

function next(){
  if(!state.answered && !state.revealed) return;
  state.idx++;
  render();
}

function showSummary(){
  $("conceptCard").style.display = "none";
  var sum = $("summaryCard");
  sum.classList.add("show");
  $("sTotal").textContent = state.answeredCount;
  $("sKnow").textContent = state.knowCount;
  $("sWeak").textContent = state.weakRound;
  var rate = state.answeredCount ? Math.round(state.knowCount / state.answeredCount * 100) : 0;
  $("sRate").textContent = rate + "%";
  var bar = $("progressBar");
  if(bar) bar.style.width = "100%";
}

function updateHeader(){
  var p = getP();
  var done = 0;
  state.all.forEach(function(x){ if(p.stats[x.item.id]) done++; });
  $("cTotal").textContent = state.all.length;
  $("cDone").textContent = done;
  $("cWeak").textContent = p.weak.length;
  var wp = $("weakPill");
  if(wp) wp.style.display = p.weak.length ? "" : "none";
}

/* ---------- 章节 / 列表 ---------- */
function buildSelect(){
  var sel = $("chapSelect");
  if(!sel) return;
  sel.innerHTML = "";
  var o0 = document.createElement("option");
  o0.value = "all";
  o0.textContent = "全部章节（" + state.all.length + " 条）";
  sel.appendChild(o0);
  state.chapters.forEach(function(ch, i){
    var o = document.createElement("option");
    o.value = String(i);
    o.textContent = ch.title + "（" + (ch.items || []).length + " 条）";
    sel.appendChild(o);
  });
}

function buildList(){
  var chap = $("chapSelect") ? $("chapSelect").value : "all";
  var type = $("typeSelect") ? $("typeSelect").value : "all";
  var prog = $("progSelect") ? $("progSelect").value : "all";
  var p = getP();
  var qs = state.all.slice();

  if(chap !== "all"){
    var ci = parseInt(chap, 10);
    if(state.chapters[ci]){
      var title = state.chapters[ci].title;
      qs = qs.filter(function(x){ return x.chapter === title; });
    }
  }
  if(type !== "all"){
    qs = qs.filter(function(x){ return x.item.type === type; });
  }
  if(prog === "unseen"){
    qs = qs.filter(function(x){ return !p.stats[x.item.id]; });
  } else if(prog === "done"){
    qs = qs.filter(function(x){ return !!p.stats[x.item.id]; });
  }
  if($("weakChk") && $("weakChk").checked){
    qs = qs.filter(function(x){ return p.weak.indexOf(x.item.id) >= 0; });
  }
  if($("shuffleChk") && $("shuffleChk").checked){
    qs = qs.slice();
    for(var i = qs.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var t = qs[i]; qs[i] = qs[j]; qs[j] = t;
    }
  }
  state.list = qs;
  state.idx = 0;
  state.knowCount = 0;
  state.weakRound = 0;
  state.answeredCount = 0;
  var sum = $("summaryCard");
  if(sum) sum.classList.remove("show");
  render();
}

/* ---------- 科目切换 ---------- */
function renderTabs(){
  var wrap = $("subjectTabs");
  if(!wrap) return;
  wrap.innerHTML = "";
  SUBJECTS.forEach(function(sc){
    var b = document.createElement("button");
    b.className = "subject-tab" + (state.subject.id === sc.id ? " active" : "");
    b.textContent = (sc.emoji ? sc.emoji + " " : "") + sc.name;
    b.onclick = function(){ loadSubject(sc.id); };
    wrap.appendChild(b);
  });
}

function loadSubject(id){
  var sc = subjectById(id) || SUBJECTS[0];
  if(!sc) return;
  state.subject = sc;
  var data = window[sc.dataVar] || { chapters: [] };
  state.chapters = data.chapters || [];
  state.all = [];
  state.chapters.forEach(function(ch){
    (ch.items || []).forEach(function(it){
      state.all.push({ chapter: ch.title, item: it });
    });
  });
  document.documentElement.style.setProperty("--brand", sc.color);
  document.documentElement.style.setProperty("--brand-2", sc.color2 || sc.color);
  document.title = sc.name + "概念题 · 考研药学综合";
  renderTabs();
  buildSelect();
  updateHeader();
  buildList();
  var cs = $("chapSelect"); if(cs) cs.value = "all";
}

/* ---------- 事件 ---------- */
function bindEvents(){
  if($("chapSelect")) $("chapSelect").onchange = buildList;
  if($("typeSelect")) $("typeSelect").onchange = buildList;
  if($("progSelect")) $("progSelect").onchange = buildList;
  if($("shuffleChk")) $("shuffleChk").onchange = buildList;
  if($("weakChk")) $("weakChk").onchange = buildList;
  if($("showBtn")) $("showBtn").onclick = reveal;
  if($("hintBtn")) $("hintBtn").onclick = toggleHint;
  if($("knowBtn")) $("knowBtn").onclick = function(){ grade(true); };
  if($("againBtn")) $("againBtn").onclick = function(){ grade(false); };
  if($("nextBtn")) $("nextBtn").onclick = next;
  if($("clearWeakBtn")) $("clearWeakBtn").onclick = function(){
    var p = getP(); p.weak = []; saveP(p);
    updateHeader(); buildList();
  };
  if($("restartBtn")) $("restartBtn").onclick = buildList;
  if($("againRestart")) $("againRestart").onclick = buildList;
  if($("exportBtn")) $("exportBtn").onclick = exportProgress;
  if($("importBtn")) $("importBtn").onclick = function(){ if($("importFile")) $("importFile").click(); };
  if($("importFile")) $("importFile").onchange = function(e){
    if(e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = "";
  };

  document.addEventListener("keydown", function(e){
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target || {};
    var tag = t.tagName || "";
    if(tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if(!state.list.length || state.idx >= state.list.length) return;
    var it = state.list[state.idx].item;
    var k = e.key;
    if(it.type === "judge"){
      if(!state.answered && (k === "1" || k === "a" || k === "A")){ e.preventDefault(); answerJudge(true); return; }
      if(!state.answered && (k === "2" || k === "b" || k === "B")){ e.preventDefault(); answerJudge(false); return; }
      if(state.answered && (k === "Enter" || k === " ")){ e.preventDefault(); next(); return; }
      return;
    }
    if(!state.revealed){
      if(k === "Enter" || k === " "){ e.preventDefault(); reveal(); return; }
      if(k === "h" || k === "H"){ e.preventDefault(); toggleHint(); return; }
      return;
    }
    if(state.revealed && (k === "1" || k === "Enter")){ e.preventDefault(); grade(true); return; }
    if(state.revealed && (k === "2" || k === " ")){ e.preventDefault(); grade(false); return; }
  });
}

/* ---------- 启动 ---------- */
bindEvents();
if(SUBJECTS.length) loadSubject((CFG.initial && subjectById(CFG.initial)) ? CFG.initial : SUBJECTS[0].id);
})();
