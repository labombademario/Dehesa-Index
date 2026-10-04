/* Dehesa Index — visor de series de Canadá (Statistics Canada) para las páginas temáticas (insumos, costes). Segunda pestaña junto a la vista de EE. UU.
   CASeries.create({ id, usBody, usExtra, usRender, texts:{es,en,fr,it}, groups:[{id,label[4],pick(s)->bool}], defaultGroup, cite }). Usa el catálogo del país y la capa de series (solo baja la serie elegida). ES5. */
(function () {
  'use strict';
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function li() { var i = LI[lang()]; return i == null ? 0 : i; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function dec(v) { var a = Math.abs(v); return a >= 1000 ? 0 : a >= 100 ? 1 : a >= 10 ? 1 : 2; }
  function ts(p) { var m; if ((m = /^(\d{4})-(\d{2})$/.exec(p))) return Date.UTC(+m[1], +m[2] - 1, 1); if ((m = /^(\d{4})-Q(\d)$/.exec(p))) return Date.UTC(+m[1], (+m[2] - 1) * 3, 1); if ((m = /^(\d{4})$/.exec(p))) return Date.UTC(+m[1], 0, 1); return NaN; }
  function plabel(p, freq) { if (freq === 'monthly' || /^\d{4}-\d{2}$/.test(p)) { try { return new Date(ts(p)).toLocaleDateString(lang(), { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return p; } } return p; }
  function TL(l) { return window.DIClear && window.DIClear.tl ? window.DIClear.tl(l, lang()) : l; }
  function chg(p) { if (p == null) return '<span style="color:var(--text-faint)">—</span>'; var c = p > 0.05 ? 'var(--positive)' : p < -0.05 ? 'var(--negative)' : 'var(--text-faint)'; return '<span style="color:' + c + ';font-weight:600">' + (p > 0 ? '+' : p < 0 ? '−' : '') + nf(Math.abs(p), 1) + ' %</span>'; }
  function create(cfg) {
    var ST = { g: cfg.defaultGroup, s: null, r: '10' }, ACTIVE = false, CAT = null, PTS = {};
    function tr() { return cfg.texts[lang()] || cfg.texts.es; }
    function catalog() { if (CAT) return Promise.resolve(CAT); return window.DISeries.country('CA', true).then(function (c) { CAT = c.series; return CAT; }); }
    function points(id) { if (PTS[id]) return Promise.resolve(PTS[id]); return window.DISeries.series('CA', id).then(function (s) { PTS[id] = s; return s; }); }
    function card(l, v, sub) { return '<div class="di-card" style="padding:14px 16px;flex:1 1 200px;min-width:180px"><div style="font-size:11px;letter-spacing:.4px;color:var(--text-faint);font-weight:700">' + esc(l).toUpperCase() + '</div><div style="font-size:26px;font-weight:700;margin:6px 0 2px" class="serif">' + v + '</div><div class="di-movers-hint" style="margin:0">' + sub + '</div></div>'; }
    function prevOf(pts, p, freq) { var m = /^(\d{4})(.*)$/.exec(p); return m ? String(+m[1] - 1) + m[2] : null; }
    function val(pts, p) { for (var i = pts.length - 1; i >= 0; i--) if (pts[i][0] === p) return pts[i][1]; return null; }
    function chart(s, t) {
      var pts = s.points.slice(), yrs = { '5': 5, '10': 10, '20': 20 }[ST.r];
      if (yrs) { var last = ts(pts[pts.length - 1][0]), from = last - yrs * 365.25 * 864e5; pts = pts.filter(function (p) { return ts(p[0]) >= from; }); }
      var d = dec(s.latest != null ? s.latest : pts[pts.length - 1][1]);
      return window.DehesaChart.render({ series: [{ name: TL(s.label), color: '#8a2d2d', pts: pts.map(function (p) { return { x: ts(p[0]), y: p[1], l: plabel(p[0], s.frequency) }; }) }], xMode: 'time', xTitle: t.date, yTitle: s.unit, aria: TL(s.label) + ' (' + s.unit + ')', noLegend: true, vFmt: function (v) { return nf(v, d); }, xFmt: s.frequency === 'annual' ? function (x) { return new Date(x).getUTCFullYear(); } : undefined });
    }
    function render() {
      var el = document.getElementById(cfg.id); if (!el || !ACTIVE) return; var t = tr();
      catalog().then(function () {
        var groups = cfg.groups.filter(function (g) { return CAT.some(g.pick); }); if (!groups.length) { el.innerHTML = '<p class="di-movers-hint">' + esc(t.noData) + '</p>'; return; }
        if (!groups.some(function (g) { return g.id === ST.g; })) ST.g = groups[0].id;
        var G = groups.filter(function (g) { return g.id === ST.g; })[0], list = CAT.filter(G.pick);
        if (!list.some(function (s) { return s.id === ST.s; })) ST.s = list[0].id;
        var cur = list.filter(function (s) { return s.id === ST.s; })[0];
        return points(ST.s).then(function (s) {
          if (!ACTIVE || !el) return;
          var pts = s.points, lastp = pts[pts.length - 1], prev = pts.length > 1 ? pts[pts.length - 2] : null, py = val(pts, prevOf(pts, lastp[0])), pc = function (a, b) { return b ? (a / b - 1) * 100 : null; };
          var tabHtml = groups.map(function (g) { return '<button type="button" class="pt-chip" data-cag="' + g.id + '" aria-pressed="' + (g.id === ST.g) + '">' + esc(g.label[li()]) + '</button>'; }).join(' ');
          var d = dec(lastp[1]);
          var cards = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin:14px 0">' + card(t.latest + ' · ' + plabel(lastp[0], s.frequency), esc(nf(lastp[1], d)), '<span style="color:var(--text-faint)">' + esc(s.unit) + '</span>') +
            (prev ? card(t.vsPrev, chg(pc(lastp[1], prev[1])), '<span style="color:var(--text-faint)">' + esc(plabel(prev[0], s.frequency) + ': ' + nf(prev[1], dec(prev[1]))) + '</span>') : '') +
            (py != null ? card(t.vsYear, chg(pc(lastp[1], py)), '<span style="color:var(--text-faint)">' + esc(prevOf(pts, lastp[0]) + ': ' + nf(py, dec(py))) + '</span>') : '') + '</div>';
          var rng = ['5', '10', '20', 'max'].map(function (k) { return '<option value="' + k + '"' + (k === ST.r ? ' selected' : '') + '>' + esc(k === 'max' ? t.all : k + ' ' + t.years) + '</option>'; }).join('');
          var th = function (x, r) { return '<th scope="col" style="padding:10px 6px;font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:' + (r ? 'right' : 'left') + '">' + esc(x).toUpperCase() + '</th>'; };
          var tbl = '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:14px"><table class="pa-t" style="border-collapse:collapse;width:100%;min-width:480px;font-size:14px"><thead><tr>' + th(t.series) + th(t.latest, 1) + th(t.change, 1) + th(t.period, 1) + '</tr></thead><tbody>' +
            list.map(function (x) { var on = x.id === ST.s; return '<tr data-cas="' + x.id + '" style="border-top:1px solid var(--border);cursor:pointer;' + (on ? 'font-weight:700;background:var(--surface-alt)' : '') + '"><td style="padding:8px 6px">' + esc(TL(x.label)) + '</td><td style="padding:8px 6px;text-align:right">' + esc(x.latest == null ? '—' : nf(x.latest, dec(x.latest)) + ' ' + x.unit) + '</td><td style="padding:8px 6px;text-align:right">' + chg(x.changePct) + '</td><td style="padding:8px 6px;text-align:right">' + esc(plabel(x.latestPeriod, x.freq)) + '</td></tr>'; }).join('') + '</tbody></table></div>';
          el.innerHTML = '<div style="margin-bottom:12px;display:flex;gap:6px;flex-wrap:wrap">' + tabHtml + '</div>' + cards +
            '<div class="di-card" style="padding:14px 16px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline"><div style="font-weight:600">' + esc(TL(s.label)) + '</div><label style="font-size:13px">' + esc(t.range) + ' <select id="' + cfg.id + '-r" class="di-compare-select">' + rng + '</select></label></div>' + chart(s, t) + '</div>' + tbl +
            '<p class="di-info-api-notice" style="margin:14px 0 6px">' + esc(t.note) + '</p><p class="di-movers-hint">' + esc(t.src) + '</p>' + (window.DICite && window.DICite.html ? window.DICite.html(cfg.cite || 'statcan', {}) : '') + (cfg.extra ? cfg.extra(t) : '');
          Array.prototype.forEach.call(el.querySelectorAll('[data-cag]'), function (b) { b.onclick = function () { ST.g = b.getAttribute('data-cag'); ST.s = null; render(); }; });
          Array.prototype.forEach.call(el.querySelectorAll('[data-cas]'), function (r) { r.onclick = function () { ST.s = r.getAttribute('data-cas'); render(); }; });
          var rs = document.getElementById(cfg.id + '-r'); if (rs) rs.onchange = function (e) { ST.r = e.target.value; render(); var n = document.getElementById(cfg.id + '-r'); if (n) n.focus(); };
        });
      }).catch(function () { if (el) el.innerHTML = '<p class="di-movers-hint">' + esc(t.noData) + '</p>'; });
    }
    function heading() { if (!ACTIVE) return; var t = tr(), h = document.getElementById('pg-h1'), s = document.getElementById('pg-sub'); if (h) h.textContent = t.title; if (s) s.textContent = t.sub; document.title = t.title + ' | Dehesa Index'; }
    function tabs() {
      var host = document.getElementById(cfg.id + '-tabs'); if (!host) return; var t = tr();
      host.innerHTML = '<div class="pt-tabs" role="tablist"><button type="button" class="pt-chip" role="tab" data-catab="us" aria-selected="' + !ACTIVE + '">' + esc(t.tabUS) + '</button><button type="button" class="pt-chip" role="tab" data-catab="ca" aria-selected="' + ACTIVE + '">' + esc(t.tabCA) + '</button></div>';
      Array.prototype.forEach.call(host.querySelectorAll('[data-catab]'), function (b) { b.onclick = function () { setTab(b.getAttribute('data-catab') === 'ca'); }; });
    }
    function setTab(ca, noUrl) {
      ACTIVE = ca; var us = document.getElementById(cfg.usBody), el = document.getElementById(cfg.id); if (us) us.hidden = ca; if (el) el.hidden = !ca;
      if (cfg.usExtra) Array.prototype.forEach.call(document.querySelectorAll(cfg.usExtra), function (n) { n.hidden = ca; });
      tabs();
      if (ca) { heading(); (window.DICite ? window.DICite.load() : Promise.resolve()).then(render, render); } else if (cfg.usRender) cfg.usRender();
      if (!noUrl) { try { var q = new URLSearchParams(window.location.search); if (ca) q.set('c', 'CA'); else q.delete('c'); var s = q.toString(); history.replaceState(null, '', window.location.pathname + (s ? '?' + s : '') + window.location.hash); } catch (e) {} }
    }
    var prev = window.DehesaShared.onLangChange;
    window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); tabs(); if (ACTIVE) { render(); heading(); } };
    var q = new URLSearchParams(window.location.search);
    tabs(); if ((q.get('c') || '').toUpperCase() === 'CA') setTab(true, true);
    return { setTab: setTab, active: function () { return ACTIVE; } };
  }
  window.CASeries = { create: create };
})();
