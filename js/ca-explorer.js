/* Dehesa Index — explorador por provincia de Canadá (mapa, tabla y evolución nacional) sobre data/canada-provinces.json (Statistics Canada).
   Lo usan rendimientos.html y ganaderia.html como segunda pestaña junto a la vista de EE. UU.
   CAExplorer.create(cfg): cfg = { id, usBody, texts:{es,en,fr,it}, items:[{id,label:[es,en,fr,it]}], defaultItem, defaultMeasure, measures(item)->[ids],
   series(prov,item,measure)->[[periodo,valor]], fmt(measure,v), yTitle(measure), shareMeasure(measure)->bool, cite:'statcan', usRender:function, palette:{line,line2,seq} }. ES5. */
(function () {
  'use strict';
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function li() { var i = LI[lang()]; return i == null ? 0 : i; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function val(a, y) { for (var i = 0; a && i < a.length; i++) if (a[i][0] === y) return a[i][1]; return null; }
  function pct(a, b) { return b ? (a / b - 1) * 100 : null; }
  function prevP(p) { var m = /^(\d{4})(-\d{2})?$/.exec(p); return m ? String(Number(m[1]) - 1) + (m[2] || '') : null; }
  function tsOf(p) { var m = /^(\d{4})(?:-(\d{2}))?$/.exec(p); return m ? Date.UTC(+m[1], m[2] ? +m[2] - 1 : 0, 1) : 0; }
  function chg(p) { if (p == null) return '<span style="color:var(--text-faint)">—</span>'; var c = p > 0.05 ? 'var(--positive)' : p < -0.05 ? 'var(--negative)' : 'var(--text-faint)'; return '<span style="color:' + c + ';font-weight:600">' + (p > 0 ? '+' : p < 0 ? '−' : '') + nf(Math.abs(p), 1) + ' %</span>'; }
  function pname(id) { var N = window.DehesaRegionNames && window.DehesaRegionNames.CA, v = N && N[id]; if (!v) return id; var p = v.split('|'), L = { en: 0, es: 1, fr: 2, it: 3 }[lang()]; return p[L == null ? 1 : L] || p[0]; }
  var REG = {};
  function drawTabs(G) {
    var host = null; Object.keys(REG).forEach(function (k) { if (REG[k] === G) host = document.getElementById(k); }); if (!host) return;
    var any = G.list.some(function (o) { return o.isOn(); });
    host.innerHTML = '<div class="pt-tabs" role="tablist"><button type="button" class="pt-chip" role="tab" data-catab="us" aria-selected="' + !any + '">' + esc(G.usLabel()) + '</button>' + G.list.map(function (o) { return '<button type="button" class="pt-chip" role="tab" data-catab="' + o.key.toLowerCase() + '" aria-selected="' + o.isOn() + '">' + esc(o.label()) + '</button>'; }).join('') + '</div>';
    Array.prototype.forEach.call(host.querySelectorAll('[data-catab]'), function (b) { b.onclick = function () { var k = b.getAttribute('data-catab'); if (k === 'us') { G.list.forEach(function (o) { if (o.isOn()) o.setTab(false); }); } else G.list.forEach(function (o) { if (o.key.toLowerCase() === k) o.setTab(true); }); }; });
  }
  var DATA = null, LOADING = null;
  function load() {
    if (DATA) return Promise.resolve();
    if (!LOADING) LOADING = fetch('data/canada-provinces.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (d) { DATA = d; var go = function () {}; return window.DICite ? window.DICite.load().then(go, go) : null; });
    return LOADING;
  }
  function create(cfg) {
    var SEL = { item: cfg.defaultItem, measure: cfg.defaultMeasure, per: null, prov: null }, ACTIVE = false, PAL = cfg.palette || {};
    var C1 = PAL.line || '#8a2d2d', C2 = PAL.line2 || '#b8a98a', SEQ = PAL.seq || ['#f6ecea', '#e6c3bd', '#cf8f86', '#b05a52', '#8a2d2d'];
    function tr() { return cfg.texts[lang()] || cfg.texts.es; }
    function itemLabel(id) { for (var i = 0; i < cfg.items.length; i++) if (cfg.items[i].id === id) return cfg.items[i].label[li()]; return id; }
    var NAT = cfg.nat || 'CA', CTRY = cfg.country || 'CA', KEY = (cfg.tabKey || CTRY).toUpperCase(), LOC = null;
    function getD() { return cfg.load ? LOC : DATA; }
    function loadD() { return cfg.load ? cfg.load().then(function (d) { LOC = d; return window.DICite ? window.DICite.load().catch(function () {}) : null; }) : load(); }
    function pnm(id) { return cfg.pname ? cfg.pname(id, li()) : pname(id); }
    function ser(prov, item, m) { return cfg.series(getD(), prov, item, m); }
    function card(l, v, sub) { return '<div class="di-card" style="padding:14px 16px;flex:1 1 200px;min-width:180px"><div style="font-size:11px;letter-spacing:.4px;color:var(--text-faint);font-weight:700">' + esc(l).toUpperCase() + '</div><div style="font-size:26px;font-weight:700;margin:6px 0 2px" class="serif">' + v + '</div><div class="di-movers-hint" style="margin:0">' + sub + '</div></div>'; }
    function chartHtml(t, nat, prov) {
      if (nat.length < 2) return '<p class="di-movers-hint">' + esc(t.oneYear || t.noData) + '</p>';
      var S = [{ name: t.ca, color: C1, pts: nat.map(function (p) { return { x: tsOf(p[0]), y: p[1], l: p[0] }; }) }];
      if (prov) { var ps = ser(prov, SEL.item, SEL.measure); if (ps) S.push({ name: pnm(prov), color: C2, pts: ps.map(function (p) { return { x: tsOf(p[0]), y: p[1], l: p[0] }; }) }); }
      var m = SEL.measure;
      return window.DehesaChart.render({ series: S, xMode: 'time', xTitle: t.period, yTitle: cfg.yTitle(m), aria: itemLabel(SEL.item) + ' · ' + t[m], noLegend: S.length < 2, vFmt: function (v) { return cfg.chartV ? cfg.chartV(m, v) : nf(v, 0); }, xFmt: function (x) { return cfg.chartX ? cfg.chartX(x) : new Date(x).getUTCFullYear(); } });
    }
    function render() {
      var el = document.getElementById(cfg.id); if (!el || !ACTIVE) return; var t = tr();
      var DATA = getD(); if (!DATA || !DATA.provinces || !DATA.provinces[NAT]) { el.innerHTML = '<p class="di-movers-hint">' + esc(t.noData) + '</p>'; return; }
      var items = cfg.items.map(function (i) { return i.id; }).filter(function (id) { return cfg.measures(getD(), id).length; });
      if (items.indexOf(SEL.item) < 0) SEL.item = items[0];
      var mets = cfg.measures(getD(), SEL.item); if (mets.indexOf(SEL.measure) < 0) SEL.measure = mets[0];
      var nat = ser(NAT, SEL.item, SEL.measure) || [], pers = nat.map(function (p) { return p[0]; }).sort().reverse();
      if (pers.indexOf(SEL.per) < 0) SEL.per = pers[0];
      var m = SEL.measure, pp = prevP(SEL.per), nv = val(nat, SEL.per), np = pp ? val(nat, pp) : null, rows = [];
      (cfg.provIds ? cfg.provIds(DATA) : Object.keys(DATA.provinces)).forEach(function (id) { if (id === NAT) return; var s = ser(id, SEL.item, m), v = val(s, SEL.per); if (v == null) return; var pv = pp ? val(s, pp) : null; rows.push({ id: id, v: v, y: pv == null ? null : pct(v, pv), share: !cfg.shareMeasure(m) || nv == null || !nv ? null : v / nv * 100 }); });
      rows.sort(function (a, b) { return b.v - a.v; });
      if (SEL.prov && !rows.some(function (r) { return r.id === SEL.prov; })) SEL.prov = null;
      var sorted = rows.map(function (r) { return r.v; }).sort(function (a, b) { return a - b; }), cuts = [1, 2, 3, 4].map(function (q) { return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q / 5))]; });
      var cls = function (v) { var i = 0; while (i < 4 && v >= cuts[i]) i++; return i; }, byId = {}; rows.forEach(function (r) { byId[r.id] = r; });
      var opt = function (arr, sel, lab) { return arr.map(function (k) { return '<option value="' + esc(k) + '"' + (k === sel ? ' selected' : '') + '>' + esc(lab(k)) + '</option>'; }).join(''); };
      var sel = function (id, label, inner) { return '<label style="font-size:13px">' + esc(label) + '<br><select id="' + id + '" class="di-compare-select">' + inner + '</select></label>'; };
      var cards = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin:14px 0">' + card(t.ca + ' · ' + SEL.per, nv == null ? '—' : esc(cfg.fmt(m, nv)), chg(nv == null ? null : pct(nv, np)) + ' ' + esc(t.vsPrev)) +
        (SEL.prov && byId[SEL.prov] ? card(pnm(SEL.prov) + ' · ' + SEL.per, esc(cfg.fmt(m, byId[SEL.prov].v)), chg(byId[SEL.prov].y) + ' ' + esc(t.vsPrev)) : '') + '</div>';
      var map = window[cfg.map || 'DEHESA_CA_PROVINCES'], svg = '';
      if (map && rows.length) svg = '<svg viewBox="' + map.viewBox + '" role="group" aria-label="' + esc(t.mapAlt) + '" style="width:100%;height:auto;max-width:620px;display:block;margin:0 auto">' + map.states.map(function (s) {
        var r = byId[s.id], fill = r ? SEQ[cls(r.v)] : '#e6e2d6', on = SEL.prov === s.id;
        return '<a href="#' + cfg.id + '" data-prov="' + s.id + '"' + (r ? ' tabindex="0"' : '') + '><path d="' + s.d + '" fill="' + fill + '" stroke="' + (on ? '#111' : '#fff') + '" stroke-width="' + (on ? 2.5 : 1) + '" style="cursor:' + (r ? 'pointer' : 'default') + '"><title>' + esc(pnm(s.id)) + ' — ' + (r ? esc(cfg.fmt(m, r.v)) : esc(t.noProv)) + '</title></path></a>'; }).join('') + '</svg>';
      var lg = rows.length >= 5 ? '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:8px;font-size:12px;color:var(--text-muted)">' + SEQ.map(function (c, i) { var lo = i === 0 ? sorted[0] : cuts[i - 1], hi = i === 4 ? sorted[sorted.length - 1] : cuts[i]; return '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:3px;background:' + c + ';border:1px solid rgba(0,0,0,.15)"></span>' + esc(cfg.fmt(m, lo)) + ' – ' + esc(cfg.fmt(m, hi)) + '</span>'; }).join('') + '</div>' : '';
      var th = function (x, r) { return '<th scope="col" style="padding:10px 6px;font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:' + (r ? 'right' : 'left') + '">' + esc(x).toUpperCase() + '</th>'; };
      var showShare = cfg.shareMeasure(m);
      var tbl = rows.length ? '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:14px"><table class="pa-t" style="border-collapse:collapse;width:100%;min-width:420px;font-size:14px"><thead><tr>' + th(t.province) + th(t.value, 1) + th(t.change, 1) + (showShare ? th(t.share, 1) : '') + '</tr></thead><tbody>' +
        rows.map(function (r) { var on = SEL.prov === r.id; return '<tr data-row="' + r.id + '" style="border-top:1px solid var(--border);cursor:pointer;' + (on ? 'font-weight:700;background:var(--surface-alt)' : '') + '"><td style="padding:8px 6px">' + esc(pnm(r.id)) + '</td><td style="padding:8px 6px;text-align:right">' + esc(cfg.fmt(m, r.v)) + '</td><td style="padding:8px 6px;text-align:right">' + chg(r.y) + '</td>' + (showShare ? '<td style="padding:8px 6px;text-align:right">' + (r.share == null ? '—' : esc(nf(r.share, 1)) + ' %') + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table></div>' : '<p class="di-movers-hint">' + esc(t.noProv) + '</p>';
      var provLine = SEL.prov ? '<p class="di-movers-hint" style="margin:8px 0 0">' + (cfg.noRegionLink ? '' : '<a href="region.html?c=' + CTRY + '&amp;r=' + SEL.prov + '">' + esc(t.open) + ': ' + esc(pnm(SEL.prov)) + '</a> · ') + '<button type="button" id="' + cfg.id + '-clear" class="pt-chip" style="min-height:28px;padding:2px 10px">' + esc(t.clear) + '</button></p>' : '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.pick) + '</p>';
      el.innerHTML = '<div style="display:flex;gap:16px;flex-wrap:wrap">' + sel(cfg.id + '-item', t.item, opt(items, SEL.item, itemLabel)) + sel(cfg.id + '-met', t.measure, opt(mets, SEL.measure, function (k) { return t[k]; })) + sel(cfg.id + '-per', t.period, opt(pers.slice(0, 80), SEL.per, function (y) { return y + (y === pers[0] ? ' *' : ''); })) + '</div>' + cards +
        '<div class="di-card" style="padding:14px 16px"><div style="font-weight:600;margin-bottom:6px">' + esc(itemLabel(SEL.item)) + ' · ' + esc(t[m]) + ' · ' + esc(t.hist) + (SEL.prov ? ' · ' + esc(pnm(SEL.prov)) : '') + '</div>' + chartHtml(t, nat, SEL.prov) + provLine + '</div>' +
        (rows.length ? '<div style="font-weight:600;margin:18px 0 6px">' + esc(t.prov) + ' · ' + esc(SEL.per) + '</div><div class="di-card" style="padding:12px">' + svg + lg + '</div>' : '') + tbl +
        '<p class="di-info-api-notice" style="margin:14px 0 6px">* ' + esc(t.last) + '. ' + esc(t.note) + '</p><p class="di-movers-hint">' + esc(t.src) + '</p>' + (window.DICite && window.DICite.html ? window.DICite.html(cfg.cite || 'statcan', {}) : '') + (cfg.extra ? cfg.extra(t) : '');
      var bind = function (id, key) { var n = document.getElementById(id); if (n) n.onchange = function (e) { SEL[key] = e.target.value; if (key === 'item') { SEL.per = null; } render(); var x = document.getElementById(id); if (x) x.focus(); }; };
      bind(cfg.id + '-item', 'item'); bind(cfg.id + '-met', 'measure'); bind(cfg.id + '-per', 'per');
      var cl = document.getElementById(cfg.id + '-clear'); if (cl) cl.onclick = function () { SEL.prov = null; render(); };
      Array.prototype.forEach.call(el.querySelectorAll('[data-row]'), function (r) { r.onclick = function () { SEL.prov = r.getAttribute('data-row'); render(); }; });
      Array.prototype.forEach.call(el.querySelectorAll('a[data-prov]'), function (a) { a.addEventListener('click', function (e) { e.preventDefault(); var id = a.getAttribute('data-prov'); if (byId[id]) { SEL.prov = id; render(); } }); });
    }
    function heading() { if (!ACTIVE) return; var t = tr(), h = document.getElementById('pg-h1'), s = document.getElementById('pg-sub'); if (h) h.textContent = t.title; if (s) s.textContent = t.sub; document.title = t.title + ' | Dehesa Index'; }
    var HOST = cfg.tabsHost || (cfg.id + '-tabs'), G = REG[HOST] || (REG[HOST] = { list: [], us: cfg.usBody, usExtra: cfg.usExtra, usRender: cfg.usRender, usLabel: null }), ME = null;
    if (!G.usLabel) G.usLabel = function () { return (cfg.texts[lang()] || cfg.texts.es).tabUS; };
    function tabs() { drawTabs(G); }
    function setTab(ca, noUrl) {
      ACTIVE = ca;
      G.list.forEach(function (o) { if (o !== ME && ca) o.off(); });
      var any = G.list.some(function (o) { return o.isOn(); }), us = document.getElementById(G.us), el = document.getElementById(cfg.id);
      if (us) us.hidden = any; if (el) el.hidden = !ca;
      Array.prototype.forEach.call(document.querySelectorAll(G.usExtra || '.ca-hide-in-ca'), function (n) { n.hidden = any; });
      tabs();
      if (ca) { heading(); loadD().then(function () { render(); heading(); }); } else if (!any && G.usRender) G.usRender();
      if (!noUrl) { try { var q = new URLSearchParams(window.location.search); if (ca) q.set('c', KEY); else if ((q.get('c') || '').toUpperCase() === KEY) q.delete('c'); var s = q.toString(); history.replaceState(null, '', window.location.pathname + (s ? '?' + s : '') + window.location.hash); } catch (e) {} }
    }
    function off() { if (!ACTIVE) return; ACTIVE = false; var el = document.getElementById(cfg.id); if (el) el.hidden = true; }
    ME = { setTab: setTab, off: off, isOn: function () { return ACTIVE; }, active: function () { return G.list.some(function (o) { return o.isOn(); }); }, label: function () { return tr().tabCA; }, key: KEY }; G.list.push(ME);
    var prev = window.DehesaShared.onLangChange;
    window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); tabs(); if (ACTIVE) { render(); heading(); } };
    var q = new URLSearchParams(window.location.search);
    if (q.get('item') && cfg.items.some(function (i) { return i.id === q.get('item'); })) SEL.item = q.get('item');
    tabs(); if ((q.get('c') || '').toUpperCase() === KEY) setTab(true, true);
    return ME;
  }
  window.CAExplorer = { create: create, load: load };
})();
