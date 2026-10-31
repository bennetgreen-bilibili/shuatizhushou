/* 概念手册：按单元渲染 概念 / 要点 / 对比表 / 易混提示，支持科目切换、搜索、已背标记与打印 */
(function () {
  "use strict";

  var CFG = window.HANDBOOK_CONFIG || { subjects: [] };
  var SUBJECTS = (CFG.subjects || []).filter(function (s) {
    return window[s.dataVar] && window[s.dataVar].chapters && window[s.dataVar].chapters.length;
  });

  var state = { subject: SUBJECTS[0] || null, q: "", learned: {}, hideLearned: false, hits: {}, recite: false };

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function unitsOf(subject) {
    var d = subject && window[subject.dataVar];
    return (d && d.chapters) || [];
  }

  function blocksOf(unit, type) {
    return (unit.blocks || []).filter(function (b) { return b && b.t === type; });
  }

  function itemsOf(unit, type) {
    var arr = [];
    blocksOf(unit, type).forEach(function (b) {
      if (type === "table") arr.push(b);
      else (b.items || []).forEach(function (it) { arr.push(it); });
    });
    return arr;
  }

  function shortTitle(title) {
    return String(title || "").replace(/^第[一二三四五六七八九十百]+单元\s*/, "");
  }

  function tokens() {
    return state.q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  }

  function hit(text, toks) {
    if (!toks.length) return true;
    var t = String(text == null ? "" : text).toLowerCase();
    for (var i = 0; i < toks.length; i++) {
      if (t.indexOf(toks[i]) === -1) return false;
    }
    return true;
  }

  function mark(text, toks) {
    var out = esc(text);
    for (var i = 0; i < toks.length; i++) {
      var t = esc(toks[i]).replace(/[.*+?^$^{}()|[\]\\]/g, "\\$&");
      if (!t) continue;
      try {
        out = out.replace(new RegExp(t, "gi"), function (m) { return "<mark>" + m + "</mark>"; });
      } catch (e) { /* ignore bad pattern */ }
    }
    return out;
  }

  /* ---------- 进度存储 ---------- */
  function loadLearned(subject) {
    try {
      var o = JSON.parse(localStorage.getItem(subject.key) || "null");
      var arr = (o && Array.isArray(o.learned)) ? o.learned : [];
      var map = {};
      arr.forEach(function (i) { if (typeof i === "number" && i >= 0) map[i] = 1; });
      return map;
    } catch (e) { return {}; }
  }

  function saveLearned(subject) {
    try {
      var arr = Object.keys(state.learned).map(Number).sort(function (a, b) { return a - b; });
      localStorage.setItem(subject.key, JSON.stringify({ learned: arr, updated: Date.now() }));
    } catch (e) {}
  }

  function learnedCount() { return Object.keys(state.learned).length; }

  /* ---------- 科目切换 ---------- */
  function renderTabs() {
    var box = $("subjectTabs");
    if (!box) return;
    box.innerHTML = SUBJECTS.map(function (s) {
      var active = state.subject && s.id === state.subject.id;
      return '<button type="button" class="subject-tab' + (active ? " active" : "") + '" data-subject="' + esc(s.id) + '" style="--tab-color:' + esc(s.color) + '">' +
        '<span class="tab-emoji">' + esc(s.emoji || "") + '</span>' + esc(s.name) +
        '<span class="tab-count">' + unitsOf(s).length + ' 单元</span></button>';
    }).join("");
    box.onclick = function (e) {
      var b = e.target && e.target.closest ? e.target.closest("[data-subject]") : null;
      if (b) selectSubject(b.getAttribute("data-subject"));
    };
  }

  function selectSubject(id) {
    var found = null;
    SUBJECTS.forEach(function (s) { if (s.id === id) found = s; });
    if (!found) return;
    state.subject = found;
    state.learned = loadLearned(found);
    state.q = "";
    state.hits = {};
    var inp = $("searchInput");
    if (inp) inp.value = "";
    var hide = $("hideLearnedChk");
    if (hide) hide.checked = false;
    state.hideLearned = false;
    renderTabs();
    renderAll();
  }

  /* ---------- 侧栏 ---------- */
  function renderSide() {
    var units = unitsOf(state.subject);
    var toks = tokens();
    var list = $("sideList");
    if (!list) return;
    var html = units.map(function (u, i) {
      var shown = true;
      if (state.hideLearned && state.learned[i]) shown = false;
      if (toks.length && state.hits && state.hits[i] === 0) shown = false;
      var cls = "hb-side-item" + (state.learned[i] ? " learned" : "") + (toks.length && state.hits[i] ? " has-hit" : "");
      return '<li data-shown="' + (shown ? "1" : "0") + '"><button type="button" class="' + cls + '" data-unit="' + i + '">' +
        '<span class="hb-side-no">' + (i + 1) + '</span>' +
        '<span class="hb-side-title">' + esc(shortTitle(u.title)) + '</span>' +
        (state.learned[i] ? '<span class="hb-side-done" title="已背完">✓</span>' : '') +
        '</button></li>';
    }).join("");
    list.innerHTML = html;
    list.onclick = function (e) {
      var b = e.target && e.target.closest ? e.target.closest("[data-unit]") : null;
      if (!b) return;
      scrollToUnit(Number(b.getAttribute("data-unit")));
    };
    var sp = $("sideProgress");
    if (sp) sp.textContent = "已背 " + learnedCount() + "/" + units.length;
  }

  function scrollToUnit(i) {
    var el = $("unit-" + i);
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
    var items = $("sideList") && $("sideList").children;
    if (items) {
      for (var k = 0; k < items.length; k++) {
        var btn = items[k] && items[k].children && items[k].children[0];
        if (btn && btn.classList) {
          if (Number(btn.getAttribute("data-unit")) === i) btn.classList.add("active");
          else btn.classList.remove("active");
        }
      }
    }
  }

  /* ---------- 正文 ---------- */
  function unitHTML(u, idx, toks) {
    var hits = 0;
    var defsTitle = (blocksOf(u, "defs")[0] || {}).title || "核心概念";
    var pointsTitle = (blocksOf(u, "points")[0] || {}).title || "要点梳理";
    var notesTitle = (blocksOf(u, "notes")[0] || {}).title || "易混与记忆";

    var defs = itemsOf(u, "defs").map(function (it) {
      if (!hit(it.k, toks) && !hit(it.v, toks)) return "";
      hits++;
      return '<div class="hb-def"><dt>' + mark(it.k, toks) + '</dt><dd>' + mark(it.v, toks) + '</dd></div>';
    }).join("");

    var points = itemsOf(u, "points").map(function (it) {
      if (!hit(it, toks)) return "";
      hits++;
      return '<li>' + mark(it, toks) + '</li>';
    }).join("");

    var tables = blocksOf(u, "table").map(function (b) {
      var rows = (b.rows || []).map(function (row) {
        var rowHit = !toks.length || row.some(function (c) { return hit(c, toks); });
        if (!rowHit) return "";
        hits++;
        return '<tr>' + row.map(function (c) { return '<td>' + mark(c, toks) + '</td>'; }).join("") + '</tr>';
      }).join("");
      if (!rows) return "";
      return '<div class="hb-block hb-table-block"><h3>' + esc(b.title || "对比表") + '</h3><div class="hb-table-wrap"><table>' +
        '<thead><tr>' + (b.head || []).map(function (h) { return '<th>' + mark(h, toks) + '</th>'; }).join("") + '</tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div></div>';
    }).join("");

    var notes = itemsOf(u, "notes").map(function (it) {
      if (!hit(it, toks)) return "";
      hits++;
      return '<li>' + mark(it, toks) + '</li>';
    }).join("");

    if (toks.length && hits === 0) return "";

    var learned = !!state.learned[idx];
    return '<section class="hb-unit' + (learned ? " learned" : "") + '" id="unit-' + idx + '" data-unit="' + idx + '">' +
      '<div class="hb-unit-head">' +
        '<div class="hb-unit-titles"><h2>' + esc(u.title) + '</h2>' +
          (u.summary ? '<p class="hb-summary">' + mark(u.summary, toks) + '</p>' : '') + '</div>' +
        '<div class="hb-unit-actions">' +
          '<a class="hb-test-link" href="recall.html?subject=' + esc(state.subject ? state.subject.id : "pharm") + '&chapter=' + idx + '">🎯 本单元自测</a>' +
          '<label class="hb-learn"><input type="checkbox" data-learn="' + idx + '"' + (learned ? " checked" : "") + '> 已背完</label>' +
        '</div>' +
      '</div>' +
      (defs ? '<div class="hb-block hb-defs"><h3>' + esc(defsTitle) + ' <span class="hb-cnt">' + itemsOf(u, "defs").length + ' 条</span></h3><dl>' + defs + '</dl></div>' : '') +
      (points ? '<div class="hb-block hb-points"><h3>' + esc(pointsTitle) + '</h3><ol>' + points + '</ol></div>' : '') +
      tables +
      (notes ? '<div class="hb-block hb-notes"><h3>' + esc(notesTitle) + '</h3><ul>' + notes + '</ul></div>' : '') +
      '</section>';
  }

  function renderContent() {
    var box = $("content");
    if (!box) return;
    if (box.classList) box.classList.toggle("recite", !!state.recite);
    var units = unitsOf(state.subject);
    var toks = tokens();
    var html = [];
    state.hits = {};
    var shownUnits = 0, totalHits = 0;
    units.forEach(function (u, i) {
      if (state.hideLearned && state.learned[i]) return;
      var one = unitHTML(u, i, toks);
      state.hits[i] = one ? countMarks(one) : 0;
      if (!one) return;
      shownUnits++;
      totalHits += state.hits[i];
      html.push(one);
    });
    if (!html.length) {
      box.innerHTML = '<div class="hb-empty">' + (toks.length ? '没有找到匹配内容，换个关键词试试。' : '本单元已全部标记为已背完；取消勾选「隐藏已背完单元」可查看。') + '</div>';
    } else {
      box.innerHTML = html.join("");
    }
    var info = $("searchInfo");
    if (info) {
      info.textContent = toks.length ? ("命中 " + totalHits + " 处 · " + shownUnits + " 个单元") : "";
    }
    box.onclick = function (e) {
      var t = e.target;
      var attr = t && t.getAttribute ? t.getAttribute("data-learn") : null;
      if (attr !== null && attr !== undefined) {
        if (e.preventDefault) e.preventDefault();
        toggleLearned(Number(attr));
        return;
      }
      if (state.recite && t && t.closest) {
        var item = t.closest(".hb-def, .hb-points li, .hb-notes li");
        if (item && item.classList) item.classList.toggle("revealed");
      }
    };
    renderSide();
    updateStats();
  }

  function countMarks(html) {
    var m = String(html).match(/<mark>/g);
    return m ? m.length : 0;
  }

  function renderAll() {
    renderSide();
    renderContent();
  }

  /* ---------- 操作 ---------- */
  function toggleLearned(i) {
    if (!state.subject) return;
    if (state.learned[i]) delete state.learned[i];
    else state.learned[i] = 1;
    saveLearned(state.subject);
    var section = $("unit-" + i);
    if (section && section.classList) {
      if (state.learned[i]) section.classList.add("learned");
      else section.classList.remove("learned");
    }
    var cb = section && section.querySelector ? section.querySelector('input[data-learn="' + i + '"]') : null;
    if (cb) cb.checked = !!state.learned[i];
    renderSide();
    updateStats();
  }

  function updateStats() {
    var totalUnits = 0, totalDefs = 0;
    SUBJECTS.forEach(function (s) {
      var us = unitsOf(s);
      totalUnits += us.length;
      us.forEach(function (u) { totalDefs += itemsOf(u, "defs").length; });
    });
    var u = $("hbUnits"); if (u) u.textContent = totalUnits + " 个单元";
    var d = $("hbDefs"); if (d) d.textContent = totalDefs + " 条概念";
    var l = $("hbLearned"); if (l) l.textContent = learnedCount();
  }

  /* ---------- 搜索 / 打印 ---------- */
  var searchTimer = null;
  function onSearch() {
    var inp = $("searchInput");
    state.q = inp ? inp.value : "";
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { renderContent(); }, 120);
  }

  function init() {
    if (!SUBJECTS.length) {
      var box = $("content");
      if (box) box.innerHTML = '<div class="hb-empty">数据尚未生成，请先运行 <code>python scripts/build_handbook.py</code>。</div>';
      return;
    }
    var initial = null;
    SUBJECTS.forEach(function (s) { if (s.id === CFG.initial) initial = s; });
    state.subject = initial || SUBJECTS[0];
    state.learned = loadLearned(state.subject);
    try { state.recite = localStorage.getItem("handbook_recite_v1") === "1"; } catch (e) {}
    renderTabs();
    renderAll();

    var inp = $("searchInput");
    if (inp) inp.oninput = onSearch;
    var hide = $("hideLearnedChk");
    if (hide) hide.onchange = function () {
      state.hideLearned = !!hide.checked;
      renderContent();
    };
    var pr = $("printBtn");
    if (pr) pr.onclick = function () { if (window.print) window.print(); };
    var rb = $("reciteBtn");
    if (rb) {
      var paint = function () {
        rb.textContent = state.recite ? "🎴 自测模式：开" : "🎴 自测模式";
        if (rb.classList) rb.classList.toggle("on", !!state.recite);
      };
      paint();
      rb.onclick = function () {
        state.recite = !state.recite;
        try { localStorage.setItem("handbook_recite_v1", state.recite ? "1" : "0"); } catch (e) {}
        paint();
        renderContent();
      };
    }

    if (document.addEventListener) {
      document.addEventListener("keydown", function (e) {
        if (e.key === "/" && e.target && e.target.tagName !== "INPUT") {
          if (e.preventDefault) e.preventDefault();
          if (inp && inp.focus) inp.focus();
        } else if (e.key === "Escape" && inp) {
          inp.value = "";
          state.q = "";
          renderContent();
        }
      });
    }
  }

  window.HANDBOOK_APP = {
    selectSubject: selectSubject,
    toggleLearned: toggleLearned,
    isLearned: function (i) { return !!state.learned[i]; },
    learned: function () { return Object.keys(state.learned).map(Number); },
    setSearch: function (q) {
      state.q = String(q || "");
      var inp = $("searchInput");
      if (inp) inp.value = state.q;
      renderContent();
    },
    setRecite: function (v) {
      state.recite = !!v;
      try { localStorage.setItem("handbook_recite_v1", state.recite ? "1" : "0"); } catch (e) {}
      renderContent();
    },
    recite: function () { return !!state.recite; },
    setHideLearned: function (v) {
      state.hideLearned = !!v;
      var c = $("hideLearnedChk");
      if (c) c.checked = state.hideLearned;
      renderContent();
    },
    subject: function () { return state.subject ? state.subject.id : null; },
    hits: function () { return state.hits; },
    units: function () { return unitsOf(state.subject); },
    contentHTML: function () { var c = $("content"); return c ? c.innerHTML : ""; }
  };

  if (document.readyState === "loading" && document.addEventListener) {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
