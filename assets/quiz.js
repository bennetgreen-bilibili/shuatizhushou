(function(){
"use strict";

/* ============ 配置 ============ */
var CFG = window.QUIZ_CONFIG || {};
var SUBJECT = CFG.subject || "刷题";
var STORAGE_KEY = CFG.storageKey || "quiz_progress_v2";
var OLD_WRONG_KEY = CFG.oldWrongKey || "";
var EXPORT_NAME = CFG.exportName || SUBJECT;

if(CFG.brand) document.documentElement.style.setProperty("--brand", CFG.brand);
if(CFG.brand2) document.documentElement.style.setProperty("--brand-2", CFG.brand2);
document.title = SUBJECT + "刷题 · 考研药学综合";

/* ============ 题库（主数据 + 可选补充数据） ============ */
var DATA = (CFG.dataVar && window[CFG.dataVar]) || window.QUIZ_DATA || { chapters: [] };
var EXTRA = (CFG.extraVar && window[CFG.extraVar]) || null;
var chapters = [];
function addChapters(src){
  if(!src || !src.chapters || !src.chapters.length) return;
  src.chapters.forEach(function(ch){
    if(!ch || !ch.title || !ch.questions || !ch.questions.length) return;
    chapters.push({ title: ch.title, questions: ch.questions });
  });
}
addChapters(DATA);
addChapters(EXTRA);

var allQuestions = [];
var byIdMap = {};
chapters.forEach(function(ch){
  ch.questions.forEach(function(q){
    allQuestions.push({ chapter: ch.title, q: q });
    byIdMap[q.id] = { chapter: ch.title, q: q };
  });
});

var qTotalEl = document.getElementById("qTotal");
if(qTotalEl) qTotalEl.textContent = allQuestions.length;

/* ============ 进度存储 ============ */
function saveProgress(p){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }catch(e){} }
function getProgress(){
  var p = null;
  try{ p = JSON.parse(localStorage.getItem(STORAGE_KEY)); }catch(e){ p = null; }
  if(!p || typeof p !== "object" || !Array.isArray(p.wrong) || !p.stats || typeof p.stats !== "object"){
    var old = [];
    if(OLD_WRONG_KEY){
      try{ old = JSON.parse(localStorage.getItem(OLD_WRONG_KEY)); }catch(e){ old = []; }
    }
    p = { wrong: (Array.isArray(old) ? old.filter(function(id){ return !!byIdMap[id]; }) : []), stats: {} };
    saveProgress(p);
  }
  return p;
}
function getWrong(){ return getProgress().wrong; }
function isWrong(id){ return getProgress().wrong.indexOf(id) >= 0; }
function addWrong(id){
  var p = getProgress();
  if(p.wrong.indexOf(id) < 0){ p.wrong.push(id); saveProgress(p); }
  updateProgressUI();
}
function removeWrong(id){
  var p = getProgress();
  p.wrong = p.wrong.filter(function(x){ return x !== id; });
  saveProgress(p);
  updateProgressUI();
}
function clearWrong(){
  var p = getProgress(); p.wrong = []; saveProgress(p);
  updateProgressUI(); buildList();
}
function recordAnswer(id, ok){
  var p = getProgress();
  var st = p.stats[id] || { c: 0, w: 0 };
  if(ok){ st.c++; } else { st.w++; }
  p.stats[id] = st;
  saveProgress(p);
}
function getStat(id){ return getProgress().stats[id]; }
function updateProgressUI(){
  var p = getProgress();
  var wc = document.getElementById("wrongCount");
  var ac = document.getElementById("answeredCount");
  var wp = document.getElementById("wrongPill");
  if(wc) wc.textContent = p.wrong.length;
  if(ac) ac.textContent = Object.keys(p.stats).length;
  if(wp) wp.style.display = p.wrong.length > 0 ? "" : "none";
}

/* ============ 导出 / 导入进度 ============ */
function exportProgress(){
  var p = getProgress();
  var payload = {
    app: EXPORT_NAME + "刷题", subject: SUBJECT, version: 2,
    totalQuestions: allQuestions.length, wrong: p.wrong, stats: p.stats,
    exportedAt: new Date().toISOString()
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  var d = new Date();
  a.download = EXPORT_NAME + "进度_" + d.getFullYear() + ("0"+(d.getMonth()+1)).slice(-2) + ("0"+d.getDate()).slice(-2) + ".json";
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
      var wrong = Array.isArray(data.wrong) ? data.wrong : [];
      var stats = (data.stats && typeof data.stats === "object") ? data.stats : {};
      wrong = wrong.filter(function(id){ return !!byIdMap[id]; });
      var cleanStats = {};
      for(var id in stats){ if(byIdMap[id]) cleanStats[id] = stats[id]; }
      saveProgress({ wrong: wrong, stats: cleanStats });
      updateProgressUI();
      buildList();
      alert("导入成功：错题 " + wrong.length + " 道，已答 " + Object.keys(cleanStats).length + " 道。");
    }catch(err){
      alert("导入失败：文件格式不正确，请选择本页面导出的 .json 进度文件。");
    }
  };
  reader.readAsText(file);
}

/* ============ 刷题逻辑 ============ */
var state = { list: [], idx: 0, answered: false, selected: {}, correctCount: 0, answeredCount: 0 };

function isMulti(q){ return q.type === "X" || (q.answer && q.answer.length > 1); }

function buildSelect(){
  var sel = document.getElementById("chapSelect");
  if(!sel) return;
  sel.innerHTML = "";
  var o0 = document.createElement("option");
  o0.value = "all";
  o0.textContent = "全部章节（" + allQuestions.length + " 题）";
  sel.appendChild(o0);
  chapters.forEach(function(ch, i){
    var o = document.createElement("option");
    o.value = i;
    o.textContent = ch.title + "（" + ch.questions.length + " 题）";
    sel.appendChild(o);
  });
}
function buildList(){
  var elChap = document.getElementById("chapSelect");
  var elType = document.getElementById("typeSelect");
  var elProg = document.getElementById("progSelect");
  var elShuffle = document.getElementById("shuffleChk");
  var elWrong = document.getElementById("wrongChk");
  var chap = elChap ? elChap.value : "all";
  var type = elType ? elType.value : "all";
  var prog = elProg ? elProg.value : "all";
  var p = getProgress();
  var qs = allQuestions.slice();
  if(chap !== "all"){
    var ci = parseInt(chap, 10);
    if(chapters[ci]) qs = qs.filter(function(x){ return x.chapter === chapters[ci].title; });
  }
  if(type === "single"){ qs = qs.filter(function(x){ return !isMulti(x.q); }); }
  else if(type === "multi"){ qs = qs.filter(function(x){ return isMulti(x.q); }); }
  if(prog === "unanswered"){ qs = qs.filter(function(x){ return !p.stats[x.q.id]; }); }
  else if(prog === "answered"){ qs = qs.filter(function(x){ return !!p.stats[x.q.id]; }); }
  if(elWrong && elWrong.checked){ qs = qs.filter(function(x){ return p.wrong.indexOf(x.q.id) >= 0; }); }
  if(elShuffle && elShuffle.checked){
    qs = qs.slice();
    for(var i = qs.length-1; i > 0; i--){
      var j = Math.floor(Math.random()*(i+1));
      var t = qs[i]; qs[i] = qs[j]; qs[j] = t;
    }
  }
  state.list = qs;
  state.idx = 0; state.correctCount = 0; state.answeredCount = 0;
  var sum = document.getElementById("summaryCard");
  if(sum) sum.classList.remove("show");
  render();
}
function render(){
  var card = document.getElementById("questionCard");
  var empty = document.getElementById("emptyCard");
  var sum = document.getElementById("summaryCard");
  var bar = document.getElementById("progressBar");
  if(!card || !empty || !sum) return;

  if(state.list.length === 0){
    card.style.display = "none";
    sum.classList.remove("show");
    if(bar) bar.style.width = "0%";
    var msg;
    var wc = document.getElementById("wrongChk");
    var ps = document.getElementById("progSelect");
    if(wc && wc.checked){ msg = '<div class="empty"><div class="big">📒</div>错题本还是空的。<br>先去做题，答错的题目会自动收进错题本。</div>'; }
    else if(ps && ps.value === "unanswered"){ msg = '<div class="empty"><div class="big">🎉</div>当前筛选下没有未做的题了。<br>换「全部进度」可以再刷一遍。</div>'; }
    else { msg = '<div class="empty"><div class="big">📭</div>当前筛选条件下没有题目。<br>试试切换章节/题型/进度筛选。</div>'; }
    empty.innerHTML = msg;
    empty.style.display = "";
    return;
  }
  empty.style.display = "none";
  card.style.display = "";

  if(state.idx >= state.list.length){ showSummary(); return; }

  var item = state.list[state.idx];
  var q = item.q;
  state.answered = false;
  state.selected = {};
  var wrong = isWrong(q.id);
  var st = getStat(q.id);
  var statusBadge;
  if(wrong){ statusBadge = '<span class="badge wrong-tag">📒 错题</span>'; }
  else if(st){ statusBadge = '<span class="badge ok-tag">✅ 已答对</span>'; }
  else { statusBadge = '<span class="badge new-tag">🆕 未做</span>'; }
  document.getElementById("qMeta").innerHTML =
    '<span class="badge ' + q.type + '">' + q.type + ' 型</span>' +
    (isMulti(q) ? '<span class="badge X">多选</span>' : '<span class="badge">单选</span>') +
    statusBadge +
    '<span>' + (state.idx+1) + ' / ' + state.list.length + ' 题</span>';
  document.getElementById("qScore").textContent = "本章：" + item.chapter;
  document.getElementById("stem").textContent = (q.num ? q.num + ". " : "") + q.stem;
  var multi = isMulti(q);
  var mh = document.getElementById("multiHint");
  if(mh) mh.style.display = multi ? "" : "none";

  var optsEl = document.getElementById("options");
  optsEl.innerHTML = "";
  Object.keys(q.options).forEach(function(L){
    var d = document.createElement("div");
    d.className = "opt";
    d.setAttribute("data-l", L);
    d.innerHTML = '<div class="k">' + L + '</div><div class="t">' + esc(q.options[L]) + '</div>';
    d.onclick = function(){ if(state.answered) return; toggle(L, multi); };
    optsEl.appendChild(d);
  });
  document.getElementById("submitBtn").style.display = "";
  document.getElementById("nextBtn").style.display = "none";
  document.getElementById("explain").classList.remove("show");
  document.getElementById("wrongNote").classList.remove("show");
  if(bar) bar.style.width = Math.round(state.idx/state.list.length*100) + "%";
}
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function toggle(L, multi){
  if(multi){ state.selected[L] = !state.selected[L]; }
  else { state.selected = {}; state.selected[L] = true; }
  var opts = document.querySelectorAll("#options .opt");
  for(var i = 0; i < opts.length; i++){
    var o = opts[i];
    o.classList.toggle("selected", !!state.selected[o.getAttribute("data-l")]);
  }
}
function submit(){
  if(state.answered || state.idx >= state.list.length) return;
  var item = state.list[state.idx];
  var q = item.q;
  if(!Object.keys(state.selected).length){ alert("请先选择答案再提交。"); return; }
  var chosen = Object.keys(state.selected).filter(function(L){ return state.selected[L]; }).sort();
  var ans = q.answer.slice().sort();
  var ok = chosen.join("") === ans.join("");
  state.answered = true;
  state.answeredCount++;
  if(ok) state.correctCount++;

  recordAnswer(q.id, ok);
  var wasWrong = isWrong(q.id);
  var note = document.getElementById("wrongNote");
  if(ok){
    var auto = document.getElementById("autoRemoveChk");
    if(wasWrong && auto && auto.checked){
      removeWrong(q.id);
      note.textContent = "✔ 已答对，已从错题本移除。";
    } else if(wasWrong){
      note.textContent = "✔ 已答对，仍保留在错题本中（可在做题后手动清空）。";
    } else {
      note.textContent = "✔ 回答正确。";
    }
    note.classList.add("show");
  } else {
    addWrong(q.id);
    note.textContent = "✘ 已加入错题本，可勾选「📒 只看错题」集中复习。";
    note.classList.add("show");
  }
  updateProgressUI();

  var opts = document.querySelectorAll("#options .opt");
  for(var i = 0; i < opts.length; i++){
    var o = opts[i];
    o.classList.add("disabled");
    var L = o.getAttribute("data-l");
    if(ans.indexOf(L) >= 0){ o.classList.add("correct"); }
    else if(state.selected[L]){ o.classList.add("wrong"); }
  }
  var v = document.getElementById("verdict");
  v.textContent = ok ? "✔ 回答正确" : "✘ 回答错误";
  v.className = "verdict " + (ok ? "ok" : "no");
  document.getElementById("rationale").textContent = q.rationale || "";
  var el = document.getElementById("expList");
  el.innerHTML = "";
  Object.keys(q.options).forEach(function(L){
    var txt = (q.expl && q.expl[L]) || "";
    if(!txt) return;
    var row = document.createElement("div");
    row.className = "exp-item " + (ans.indexOf(L) >= 0 ? "is-ok" : "is-no");
    row.innerHTML = '<div class="ek">' + L + '</div><div>' + esc(txt) + '</div>';
    el.appendChild(row);
  });
  document.getElementById("explain").classList.add("show");
  document.getElementById("submitBtn").style.display = "none";
  var nb = document.getElementById("nextBtn");
  nb.style.display = "";
  nb.textContent = (state.idx >= state.list.length-1) ? "查看总结 →" : "下一题 →";
}
function next(){
  if(!state.answered) return;
  state.idx++;
  render();
}
function showSummary(){
  document.getElementById("questionCard").style.display = "none";
  var sum = document.getElementById("summaryCard");
  sum.classList.add("show");
  document.getElementById("sTotal").textContent = state.list.length;
  document.getElementById("sCorrect").textContent = state.correctCount;
  document.getElementById("sWrong").textContent = state.answeredCount - state.correctCount;
  var rate = state.answeredCount ? Math.round(state.correctCount/state.answeredCount*100) : 0;
  document.getElementById("sRate").textContent = rate + "%";
  var bar = document.getElementById("progressBar");
  if(bar) bar.style.width = "100%";
}

/* ============ 事件绑定 ============ */
var chapSel = document.getElementById("chapSelect");
var typeSel = document.getElementById("typeSelect");
var progSel = document.getElementById("progSelect");
if(chapSel) chapSel.onchange = buildList;
if(typeSel) typeSel.onchange = buildList;
if(progSel) progSel.onchange = buildList;
if(document.getElementById("shuffleChk")) document.getElementById("shuffleChk").onchange = buildList;
if(document.getElementById("wrongChk")) document.getElementById("wrongChk").onchange = buildList;
if(document.getElementById("clearWrongBtn")) document.getElementById("clearWrongBtn").onclick = clearWrong;
if(document.getElementById("restartBtn")) document.getElementById("restartBtn").onclick = buildList;
if(document.getElementById("submitBtn")) document.getElementById("submitBtn").onclick = submit;
if(document.getElementById("nextBtn")) document.getElementById("nextBtn").onclick = next;
if(document.getElementById("againBtn")) document.getElementById("againBtn").onclick = buildList;
if(document.getElementById("exportBtn")) document.getElementById("exportBtn").onclick = exportProgress;
if(document.getElementById("importBtn")) document.getElementById("importBtn").onclick = function(){ document.getElementById("importFile").click(); };
if(document.getElementById("importFile")) document.getElementById("importFile").onchange = function(e){
  if(e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
  e.target.value = "";
};

/* 键盘快捷键：A–E 选择，Enter 提交 / 下一题 */
document.addEventListener("keydown", function(e){
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  var t = e.target || {};
  var tag = t.tagName || "";
  if(tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  if(!state.list.length || state.idx >= state.list.length) return;
  var q = state.list[state.idx].q;
  var letters = Object.keys(q.options);
  var L = null;
  if(/^[a-eA-E]$/.test(e.key)) L = e.key.toUpperCase();
  else if(/^[1-5]$/.test(e.key)) L = "ABCDE".charAt(parseInt(e.key,10)-1);
  if(L && letters.indexOf(L) >= 0){
    e.preventDefault();
    if(!state.answered) toggle(L, isMulti(q));
    return;
  }
  if(e.key === "Enter"){
    e.preventDefault();
    if(state.answered) next(); else submit();
  }
});

/* ============ 启动 ============ */
updateProgressUI();
buildSelect();
buildList();
})();
