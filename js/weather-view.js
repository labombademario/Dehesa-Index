/* Dehesa Index — vista «Tabla / Barras» de los últimos 12 meses de tiempo observado (lluvia y temperatura frente a lo normal). ES5.
   Lo usan js/nordic-weather.js (SMHI, DMI) y js/be-weather.js (KMI-IRM). La tabla la pinta cada módulo; aquí se añaden el conmutador y las barras.
   DIWeatherView.wrap(tableHtml, months, t, lg, nf) -> HTML. months = [{ label, rain, rainN, temp, tempN }]. La elección se recuerda en localStorage. */
(function (global) {
  'use strict';
  var KEY = 'di-wv-mode';
  var TXT = {
    es: { tbl: 'Tabla', bars: 'Barras', view: 'Ver como', rain: 'Lluvia (mm)', temp: 'Temperatura media (°C)', meas: 'Medido', norm: 'Normal', hint: 'Pasa el ratón o toca un mes para ver las cifras.', mm: 'mm' },
    en: { tbl: 'Table', bars: 'Bars', view: 'View as', rain: 'Rain (mm)', temp: 'Mean temperature (°C)', meas: 'Observed', norm: 'Normal', hint: 'Hover or tap a month to see the figures.', mm: 'mm' },
    fr: { tbl: 'Tableau', bars: 'Barres', view: 'Afficher', rain: 'Pluie (mm)', temp: 'Température moyenne (°C)', meas: 'Observé', norm: 'Normale', hint: 'Survolez ou touchez un mois pour voir les chiffres.', mm: 'mm' },
    it: { tbl: 'Tabella', bars: 'Barre', view: 'Visualizza', rain: 'Pioggia (mm)', temp: 'Temperatura media (°C)', meas: 'Osservato', norm: 'Normale', hint: 'Passa il mouse o tocca un mese per vedere le cifre.', mm: 'mm' }
  };
  var CSS = '.wv-seg{display:inline-flex;gap:0;border:1px solid var(--border);border-radius:999px;overflow:hidden;margin:0 0 10px;vertical-align:middle}.wv-seg button{font:inherit;font-size:13px;font-weight:600;padding:6px 16px;border:0;background:var(--surface,#fff);color:inherit;cursor:pointer}'
    + '.wv-seg button[aria-pressed="true"]{background:var(--accent,#1f3d2f);color:#fff}.wv-seg button:focus-visible{outline:2px solid var(--accent,#1f3d2f);outline-offset:-2px}.wv-lbl{font-size:13px;color:var(--text-muted);margin:0 8px 0 0}'
    + '.wv-pane[hidden]{display:none}.wv-svg{width:100%;max-width:720px;height:auto;display:block}.wv-t{font-size:12.5px;font-weight:700;margin:10px 0 2px}.wv-grid{stroke:var(--border);stroke-width:1}.wv-zero{stroke:var(--text-faint,#888);stroke-width:1}'
    + '.wv-tick{font-size:10.5px;fill:var(--text-muted)}.wv-b-r{fill:#3b7fb0}.wv-b-t{fill:#c0622e}.wv-n{stroke:var(--text,#222);stroke-width:2.4;stroke-linecap:round}.wv-hit{fill:transparent;cursor:pointer}.wv-hit:hover,.wv-hit:focus-visible,.wv-hit.on{fill:rgba(120,110,90,.12);outline:none}'
    + 'html[data-theme="dark"] .wv-b-r{fill:#6fa8d6}html[data-theme="dark"] .wv-b-t{fill:#e08a58}'
    + '.wv-leg{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:12.5px;margin:6px 0 2px}.wv-leg i{display:inline-block;width:12px;height:12px;border-radius:2px;vertical-align:-1px;margin-right:5px}.wv-leg i.n{height:0;border-top:2.4px solid var(--text,#222);border-radius:0;width:14px;vertical-align:3px}'
    + '.wv-ro{min-height:1.4em;font-size:13px;margin:4px 0 8px}';
  function css() { if (document.getElementById('wv-css')) return; var s = document.createElement('style'); s.id = 'wv-css'; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mode() { try { return localStorage.getItem(KEY) === 'bars' ? 'bars' : 'tbl'; } catch (e) { return 'tbl'; } }
  function nice(lo, hi) {
    var span = Math.max(hi - lo, 1e-9), raw = span / 4, p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / p, st = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
    return { lo: Math.floor(lo / st) * st, hi: Math.ceil(hi / st) * st, st: st };
  }
  function chart(ms, kind, title, dec, nf) {
    var key = kind, keyN = kind + 'N', vals = [], i;
    for (i = 0; i < ms.length; i++) { if (ms[i][key] != null) vals.push(ms[i][key]); if (ms[i][keyN] != null) vals.push(ms[i][keyN]); }
    if (!vals.length) return '';
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), r = nice(kind === 'rain' ? 0 : Math.min(0, mn), Math.max(mx, kind === 'rain' ? 1 : 0.5));
    var W = 640, H = 210, L = 42, R = 8, T = 10, B = 36, n = ms.length, sw = (W - L - R) / n, bw = Math.min(34, sw * 0.58);
    function Y(v) { return T + (r.hi - v) / (r.hi - r.lo) * (H - T - B); }
    var g = '', k, v;
    for (v = r.lo; v <= r.hi + r.st / 2; v += r.st) g += '<line class="wv-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wv-tick" x="' + (L - 6) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + esc(nf(Math.round(v * 100) / 100, r.st < 1 ? 1 : 0)) + '</text>';
    if (r.lo < 0) g += '<line class="wv-zero" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '"/>';
    var bars = '';
    for (k = 0; k < n; k++) {
      var m = ms[k], cx = L + sw * k + sw / 2, x0 = cx - bw / 2, y0 = Y(0);
      bars += '<rect class="wv-hit" tabindex="0" data-i="' + k + '" data-k="' + kind + '" x="' + (L + sw * k).toFixed(1) + '" y="' + T + '" width="' + sw.toFixed(1) + '" height="' + (H - T - B) + '"/>';
      if (m[key] != null) { var yv = Y(m[key]); bars += '<rect class="wv-b-' + (kind === 'rain' ? 'r' : 't') + '" x="' + x0.toFixed(1) + '" y="' + Math.min(yv, y0).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, Math.abs(yv - y0)).toFixed(1) + '" rx="2" style="pointer-events:none"/>'; }
      if (m[keyN] != null) bars += '<line class="wv-n" x1="' + (x0 - 3).toFixed(1) + '" x2="' + (x0 + bw + 3).toFixed(1) + '" y1="' + Y(m[keyN]).toFixed(1) + '" y2="' + Y(m[keyN]).toFixed(1) + '" style="pointer-events:none"/>';
      var pr = String(m.label).split(' '), mon = pr[0].replace(/\.$/, ''), yr = pr.length > 1 ? pr[pr.length - 1] : '', pj = k > 0 ? String(ms[k - 1].label).split(' ') : null;
      g += '<text class="wv-tick" x="' + cx.toFixed(1) + '" y="' + (H - 21) + '" text-anchor="middle">' + esc(mon) + '</text>';
      if (yr && (k === 0 || !pj || pj[pj.length - 1] !== yr)) g += '<text class="wv-tick" x="' + cx.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" style="font-weight:700">' + esc(yr) + '</text>';
    }
    return '<div class="wv-t">' + esc(title) + '</div><svg class="wv-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(title) + '">' + g + bars + '</svg>';
  }
  function wrap(tableHtml, months, t, lg, nf) {
    css(); var x = TXT[lg] || TXT.es, md = mode(), ms = months.map(function (m) { return { label: m.label, rain: m.rain, rainN: m.rainN, temp: m.temp, tempN: m.tempN }; });
    var data = esc(JSON.stringify(ms));
    var ch = chart(ms, 'rain', x.rain, 0, nf) + chart(ms, 'temp', x.temp, 1, nf);
    return '<div class="wv" data-wv data-lg="' + esc(lg) + '" data-m="' + data + '"><span class="wv-lbl">' + esc(x.view) + '</span><span class="wv-seg" role="group" aria-label="' + esc(x.view) + '">'
      + '<button type="button" data-mode="tbl" aria-pressed="' + (md === 'tbl') + '">' + esc(x.tbl) + '</button><button type="button" data-mode="bars" aria-pressed="' + (md === 'bars') + '">' + esc(x.bars) + '</button></span>'
      + '<div class="wv-pane" data-p="tbl"' + (md === 'tbl' ? '' : ' hidden') + '>' + tableHtml + '</div>'
      + '<div class="wv-pane" data-p="bars"' + (md === 'bars' ? '' : ' hidden') + '>' + (ch ? '<div class="wv-leg"><span><i class="wv-b-r" style="background:#3b7fb0"></i>' + esc(x.meas) + ' · ' + esc(x.rain) + '</span><span><i class="wv-b-t" style="background:#c0622e"></i>' + esc(x.meas) + ' · ' + esc(x.temp) + '</span><span><i class="n"></i>' + esc(x.norm) + '</span></div>' + ch + '<div class="wv-ro" aria-live="polite">' + esc(x.hint) + '</div>' : '') + '</div></div>';
  }
  function show(box, k) {
    var ms = JSON.parse(box.getAttribute('data-m')), x = TXT[box.getAttribute('data-lg')] || TXT.es, i = +k.getAttribute('data-i'), kind = k.getAttribute('data-k'), m = ms[i], ro = box.querySelector('.wv-ro');
    var f = function (v, d) { return v == null ? '—' : (global.ESUI && global.ESUI.nf ? global.ESUI.nf(v, d) : String(v)); };
    var d = kind === 'rain' ? 0 : 1, u = kind === 'rain' ? ' ' + x.mm : ' °C';
    [].forEach.call(box.querySelectorAll('.wv-hit.on'), function (e) { e.classList.remove('on'); }); k.classList.add('on');
    if (ro) ro.innerHTML = '<b>' + esc(m.label) + '</b> · ' + esc(x.meas) + ' <b>' + esc(f(m[kind], d)) + u + '</b> · ' + esc(x.norm) + ' ' + esc(f(m[kind + 'N'], d)) + u;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.wv [data-mode]') : null, box;
    if (b) {
      box = b.closest('[data-wv]'); var md = b.getAttribute('data-mode');
      [].forEach.call(box.querySelectorAll('[data-mode]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      [].forEach.call(box.querySelectorAll('.wv-pane'), function (p) { p.hidden = p.getAttribute('data-p') !== md; });
      [].forEach.call(document.querySelectorAll('[data-wv]'), function (o) { if (o === box) return; [].forEach.call(o.querySelectorAll('[data-mode]'), function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-mode') === md)); }); [].forEach.call(o.querySelectorAll('.wv-pane'), function (p) { p.hidden = p.getAttribute('data-p') !== md; }); });
      try { localStorage.setItem(KEY, md); } catch (er) { }
      return;
    }
    var k = e.target.closest ? e.target.closest('.wv .wv-hit') : null; if (k) show(k.closest('[data-wv]'), k);
  });
  document.addEventListener('mouseover', function (e) { var k = e.target.closest ? e.target.closest('.wv .wv-hit') : null; if (k) show(k.closest('[data-wv]'), k); });
  document.addEventListener('focusin', function (e) { var k = e.target.closest ? e.target.closest('.wv .wv-hit') : null; if (k) show(k.closest('[data-wv]'), k); });
  global.DIWeatherView = { wrap: wrap };
})(window);
