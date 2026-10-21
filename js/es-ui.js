/* Dehesa Index — ayudas de interfaz compartidas por los bloques de datos de España (MAPA). ES5. window.ESUI */
(function (global) {
  'use strict';
  var S = global.DehesaShared;
  var U = {
    lang: function () { return S && S.getLang ? S.getLang() : 'es'; },
    esc: function (x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); },
    nf: function (v, d) { if (v == null) return '–'; try { return v.toLocaleString(U.lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } },
    f: function (s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] == null ? m : o[k]; }); },
    chip: function (on, cls, data, label) { return '<button type="button" class="' + cls + '" ' + data + ' aria-pressed="' + on + '" style="font:inherit;cursor:pointer;padding:6px 11px;margin:0 6px 6px 0;border:1px solid var(--border);border-radius:16px;background:' + (on ? 'var(--accent)' : 'transparent') + ';color:' + (on ? '#fff' : 'inherit') + '">' + U.esc(label) + '</button>'; },
    sel: function (id, label, opts, cur) { return '<label class="di-movers-hint" style="display:inline-block;margin:0 14px 8px 0">' + U.esc(label) + '<select data-chips id="' + id + '" style="display:block;margin-top:4px;font:inherit;max-width:100%">' + opts + '</select></label>'; },
    opt: function (v, label, cur) { return '<option value="' + U.esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + U.esc(label) + '</option>'; },
    td: 'padding:7px 6px;border-top:1px solid var(--border);font-variant-numeric:tabular-nums;text-align:right;',
    th: 'padding:8px 6px;font-size:11px;font-weight:700;color:var(--text-faint);',
    /* rows: [label, value, hint] */
    bars: function (rows, mx, dec, unit) {
      if (!rows.length) return '';
      return '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:300px;font-size:13.5px"><tbody>' + rows.map(function (r) { return '<tr><td style="' + U.td + 'text-align:left">' + U.esc(r[0]) + (r[2] ? ' <span class="di-movers-hint">· ' + U.esc(r[2]) + '</span>' : '') + '</td><td style="' + U.td + 'width:46%"><span style="display:inline-block;height:8px;border-radius:4px;background:var(--accent);opacity:.55;width:' + Math.max(2, Math.round(r[1] / mx * 100)) + '%;vertical-align:middle;margin-right:8px"></span>' + U.esc(U.nf(r[1], dec || 0)) + (unit ? ' ' + U.esc(unit) : '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    },
    cite: function (id) { return global.DICite && global.DICite.html ? '<div class="pp-cites" style="margin-top:10px">' + global.DICite.html(id || 'mapa_es', {}) + '</div>' : ''; },
    json: function (u) { return fetch(u).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); },
    chart: function (series, labels, ytitle, aria, dec) {
      if (!global.DehesaChart || !global.DehesaChart.render) return '';
      var colors = ['#1d5178', '#b4541a', '#2f7d4f', '#7a4f9e'];
      return global.DehesaChart.render({ series: series.map(function (s, k) { return { name: s.name, color: colors[k % colors.length], pts: s.v.map(function (v, i) { return { x: i, y: v, l: String(labels[i]) }; }).filter(function (p) { return p.y != null; }) }; }), xLabels: (function () { var o = {}; labels.forEach(function (l, i) { o[i] = String(l); }); return o; })(), yTitle: ytitle, aria: aria, zero: true, noLegend: series.length < 2, vFmt: function (v) { return U.nf(v, dec || 0); } });
    },
    /* Monta un bloque dentro de una pestaña: sigue su atributo hidden y se redibuja al cambiar de idioma. load() devuelve una promesa; draw() pinta. */
    mount: function (tabId, elId, load, draw) {
      var tab = document.getElementById(tabId), el = document.getElementById(elId); if (!tab || !el) return;
      var drawn = false, ok = false;
      function sync() { el.hidden = tab.hidden; if (!tab.hidden && !drawn) { drawn = true; Promise.all([load(), global.DICite ? global.DICite.load().catch(function () { return null; }) : null]).then(function (a) { if (!a[0]) { el.hidden = true; return; } ok = true; draw(el); }); } }
      sync(); if (global.MutationObserver) new MutationObserver(sync).observe(tab, { attributes: true, attributeFilter: ['hidden'] });
      if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); if (drawn && ok) draw(el); }; }
    }
  };
  global.ESUI = U;
})(window);
