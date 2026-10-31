/* 回忆自测：名词解释 / 填空题 / 简答题 / 判断题；答案与解析默认隐藏，按钮切换显示 */
(function () {
  "use strict";

  var CFG = window.RECALL_CONFIG || { subjects: [] };
  var SUBS = (CFG.subjects || []).filter(function (s) {
    return s && s.dataVar && window[s.dataVar] && window[s.dataVar].chapters && window[s.dataVar].chapters.length;
  });
  var META = {
    D: { label: "名词解释", cls: "D" },
    F: { label: "填空题", cls: "F" },
    S: { label: "简答题", cls: "S" },
    T: { label: "判断题", cls: "T" }
  };
  var SHOW_KEY = "recall_show_answers_v1";

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function storeKey(sub) { return (sub && sub.key) || ("recall_" + (sub && sub.id) + "_v1"); }

  function loadShow() {
    try { return localStorage.getItem(SHOW_KEY) === "1"; } catch (e) { return false; }
  }
  function saveShow(v) {
    try { localStorage.setItem(SHOW_KEY, v ? "1" : "0"); } catch (e) {}
  }
  function emptyStore() { return { known: {}, unknown: {}, seen: {} }; }
  function loadStore(sub) {
    var out = emptyStore();
    try {
      var o = JSON.parse(localStorage.getItem(storeKey(sub)) || "null");
      if (o && typeof o === "object") {
        ["known", "unknown", "seen"].forEach(function (k) {
          var arr = (o && Array.isArray(o[k])) ? o[k] : [];
          var map = {};
          arr.forEach(function (id) { if (typeof id === "string") map[id] = 1; });
          out[k] = map;
        });
      }
    } catch (e) {}
    return out;
  }
  function saveStore() {
    if (!state.sub) return;
    var o = {};
    ["known", "unknown", "seen"].forEach(function (k) {
      o[k] = Object.keys(state.prog[k]);
    });
    try { localStorage.setItem(storeKey(state.sub), JSON.stringify(o)); } catch (e) {}
  }

  var state = {
    sub: SUBS[0] || null,
    chapter: "all",
    type: "all",
    onlyUnknown: false,
    shuffle: false,
    show: loadShow(),
    prog: emptyStore()
  };

  function units() { return (state.sub && window[state.sub.dataVar].chapters) || []; }

  function flat() {
    var out = [];
    units().forEach(function (ch, ci) {
      (ch.questions || []).forEach(function (q) {
        out.push({ ch: ch.title, ci: ci, q: q });
      });
    });
    return out;
  }

  function filtered() {
    var list = flat();
    var ci = state.chapter === "all" ? -1 : parseInt(state.chapter, 10);
    if (ci >= 0) list = list.filter(function (x) { return x.ci === ci; });
    if (state.type !== "all") list = list.filter(function (x) { return x.q.type === state.type; });
    if (state.onlyUnknown) list = list.filter(function (x) {
      return state.prog.unknown[x.q.id] && !state.prog.known[x.q.id];
    });
    if (state.shuffle) {
      list = list.slice();
      for (var i = list.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = list[i]; list[i] = list[j]; list[j] = t;
      }
    }
    return list;
  }

  function typeBadge(t) {
    var m = META[t] || { label: t, cls: "D" };
    return '<span class="rc-badge rc-badge-' + m.cls + '">' + esc(m.label) + '</span>';
  }

  function cardHTML(item) {
    var q = item.q;
    var p = state.prog;
    var known = !!p.known[q.id], unknown = !!p.unknown[q.id];
    var revealed = state.show;
    var stateTag = known ? '<span class="rc-state ok">✅ 已会</span>' : (unknown ? '<span class="rc-state no">❌ 不会</span>' : '');
    var answer = q.answer;
    if (Array.isArray(answer)) answer = answer.join("");
    var optLine = "";
    if (q.type === "T" && q.options) {
      optLine = '<div class="rc-opts">' + Object.keys(q.options).map(function (L) {
        return '<span class="rc-opt' + (q.answer && q.answer.indexOf(L) >= 0 ? " ok" : "") + '">' + L + '. ' + esc(q.options[L]) + '</span>';
      }).join("") + '</div>';
    }
    var stem = String(q.stem || "");
    if (q.type === "T") stem = stem.replace(/^判断题[：:]\s*/, "");
    return '<div class="rc-card' + (revealed ? " revealed" : "") + '" data-id="' + esc(q.id) + '">' +
      '<div class="rc-head">' + typeBadge(q.type) + '<span class="rc-chip">' + esc(item.ch) + (q.num ? " · 第 " + q.num + " 题" : "") + '</span>' + stateTag + '</div>' +
      '<div class="rc-stem">' + esc(stem) + '</div>' + optLine +
      '<div class="rc-answer">' +
        '<div class="rc-a-label">参考答案</div><div class="rc-a-text">' + esc(answer) + '</div>' +
        (q.rationale ? '<div class="rc-rationale"><b>解析：</b>' + esc(q.rationale) + '</div>' : '') +
      '</div>' +
      '<div class="rc-actions">' +
        '<button type="button" class="rc-btn reveal" data-act="reveal">👀 ' + (revealed ? '隐藏' : '显示') + '答案与解析</button>' +
        '<button type="button" class="rc-btn ok" data-act="known">✅ 会了</button>' +
        '<button type="button" class="rc-btn no" data-act="unknown">❌ 不会</button>' +
      '</div>' +
    '</div>';
  }

  function renderList() {
    var box = $("recallList");
    if (!box) return;
    var list = filtered();
    if (!list.length) {
      box.innerHTML = '<div class="rc-empty">当前筛选条件下没有题目。试试「全部章节 / 全部题型」，或取消「只看不会」。</div>';
    } else {
      box.innerHTML = list.map(cardHTML).join("");
    }
    box.onclick = onListClick;
    renderStats(list);
  }

  function onListClick(e) {
    var t = e && e.target;
    if (!t) return;
    var act = t.getAttribute ? t.getAttribute("data-act") : null;
    var node = t;
    while (!act && node) {
      if (node.getAttribute) act = node.getAttribute("data-act");
      node = node.parentNode;
    }
    if (!act) return;
    while (node && node.getAttribute && !node.getAttribute("data-id")) node = node.parentNode;
    var id = node && node.getAttribute ? node.getAttribute("data-id") : null;
    if (!id) return;
    if (act === "reveal") {
      var card = node;
      if (card.classList) card.classList.toggle("revealed");
      if (t.tagName === "BUTTON") t.textContent = (card.classList && card.classList.contains("revealed")) ? "👀 隐藏答案与解析" : "👀 显示答案与解析";
    } else if (act === "known") {
      state.prog.known[id] = 1;
      delete state.prog.unknown[id];
      state.prog.seen[id] = 1;
      saveStore(); renderList();
    } else if (act === "unknown") {
      state.prog.unknown[id] = 1;
      delete state.prog.known[id];
      state.prog.seen[id] = 1;
      saveStore(); renderList();
    }
  }

  function renderStats(list) {
    var all = flat();
    var shown = list ? list.length : 0;
    var known = 0, unknown = 0;
    all.forEach(function (x) {
      if (state.prog.known[x.q.id]) known++;
      if (state.prog.unknown[x.q.id]) unknown++;
    });
    var el = $("recallStats");
    if (el) el.textContent = "共 " + all.length + " 题 · 当前筛选 " + shown + " 题 · 已会 " + known + " · 不会 " + unknown;
    var bar = $("recallBar");
    if (bar) bar.style.width = (all.length ? Math.round((known + unknown) / all.length * 100) : 0) + "%";
  }

  function renderChapters() {
    var sel = $("chapterSel");
    if (!sel) return;
    var opts = ['<option value="all">全部章节（' + flat().length + ' 题）</option>'];
    units().forEach(function (ch, i) {
      var n = (ch.questions || []).length;
      opts.push('<option value="' + i + '">' + esc(ch.title) + "（" + n + " 题）</option>");
    });
    sel.innerHTML = opts.join("");
    sel.value = state.chapter;
  }

  function renderTabs() {
    var box = $("subjectTabs");
    if (!box) return;
    box.innerHTML = SUBS.map(function (s) {
      var active = state.sub && s.id === state.sub.id;
      var d = window[s.dataVar];
      var count = 0;
      (d.chapters || []).forEach(function (ch) { count += (ch.questions || []).length; });
      return '<button type="button" class="rc-tab' + (active ? " active" : "") + '" data-subject="' + esc(s.id) + '" style="--rc:' + esc(s.color) + '">' +
        (s.emoji ? '<span class="rc-tab-emoji">' + esc(s.emoji) + '</span>' : "") + esc(s.name) +
        '<span class="rc-tab-count">' + count + " 题</span></button>";
    }).join("");
    box.onclick = function (e) {
      var t = e && e.target;
      while (t && t.getAttribute && !t.getAttribute("data-subject")) t = t.parentNode;
      if (t && t.getAttribute) selectSubject(t.getAttribute("data-subject"));
    };
  }

  function selectSubject(id) {
    var found = null;
    SUBS.forEach(function (s) { if (s.id === id) found = s; });
    if (!found) return;
    state.sub = found;
    state.chapter = "all";
    state.type = "all";
    state.onlyUnknown = false;
    state.prog = loadStore(found);
    var chk = $("unknownChk"); if (chk) chk.checked = false;
    renderAll();
  }

  function renderAll() {
    renderTabs();
    renderChapters();
    var tsel = $("typeSel"); if (tsel) tsel.value = state.type;
    var btn = $("showAllBtn");
    if (btn) {
      btn.textContent = state.show ? "🙈 隐藏答案与解析" : "👀 显示答案与解析";
      btn.classList.toggle("on", !!state.show);
    }
    renderList();
  }

  function refresh() {
    var ch = $("chapterSel"), ty = $("typeSel"), u = $("unknownChk"), sh = $("shuffleChk");
    if (ch) state.chapter = ch.value || "all";
    if (ty) state.type = ty.value || "all";
    if (u) state.onlyUnknown = !!u.checked;
    if (sh) state.shuffle = !!sh.checked;
    renderList();
  }

  function init() {
    if (!SUBS.length) {
      var box = $("recallList");
      if (box) box.innerHTML = '<div class="rc-empty">数据尚未生成，请先运行 <code>python scripts/build_recall.py</code>。</div>';
      return;
    }
    var params = {};
    try {
      (window.location && window.location.search || "").replace(/^\?/, "").split("&").forEach(function (kv) {
        if (!kv) return;
        var p = kv.split("=");
        params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || "");
      });
    } catch (e) {}
    var initial = null;
    if (params.subject) SUBS.forEach(function (s) { if (s.id === params.subject) initial = s; });
    if (!initial) SUBS.forEach(function (s) { if (s.id === CFG.initial) initial = s; });
    state.sub = initial || SUBS[0];
    state.prog = loadStore(state.sub);
    if (params.chapter) {
      var ci = parseInt(params.chapter, 10);
      if (ci >= 0) state.chapter = String(ci);
    }
    if (params.type && META[params.type]) state.type = params.type;
    renderAll();

    var ch = $("chapterSel"); if (ch) ch.onchange = refresh;
    var ty = $("typeSel"); if (ty) ty.onchange = refresh;
    var u = $("unknownChk"); if (u) u.onchange = refresh;
    var sh = $("shuffleChk"); if (sh) sh.onchange = refresh;
    var btn = $("showAllBtn");
    if (btn) btn.onclick = function () {
      state.show = !state.show;
      saveShow(state.show);
      renderAll();
    };
    var reset = $("resetBtn");
    if (reset) reset.onclick = function () {
      if (!window.confirm || window.confirm("确定清空当前科目的「会 / 不会」记录吗？")) {
        state.prog = emptyStore();
        saveStore();
        renderList();
      }
    };
  }

  window.RECALL_APP = {
    selectSubject: selectSubject,
    setShow: function (v) { state.show = !!v; saveShow(state.show); renderAll(); },
    toggleShow: function () { state.show = !state.show; saveShow(state.show); renderAll(); return state.show; },
    show: function () { return state.show; },
    subject: function () { return state.sub ? state.sub.id : null; },
    count: function () { return filtered().length; },
    known: function () { return Object.keys(state.prog.known).length; },
    markup: function () { var el = $("recallList"); return el ? el.innerHTML : ""; }
  };

  if (document.readyState === "loading" && document.addEventListener) {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
