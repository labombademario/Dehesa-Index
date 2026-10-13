/* Dehesa Index — mapa de departamentos de Francia metropolitana (vendor/fr-departements.js, cargado a petición), compartido por
   js/fr-gnr.js, js/fr-onde.js y js/fr-nitrates.js. Colorea con 5 tramos (clases gb-c0…gb-c4 de css/style.css; gb-cx = sin dato). ES5. */
(function (global) {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var PS = {};
  // por defecto, Francia; para otro mapa: load('DEHESA_DE_LAENDER', 'vendor/de-laender.js')
  function load(v, src) {
    v = v || 'DEHESA_FR_DEPTS'; src = src || 'vendor/fr-departements.js';
    if (global[v]) return Promise.resolve(global[v]);
    return PS[v] || (PS[v] = new Promise(function (ok) { var s = document.createElement('script'); s.src = src; s.onload = function () { ok(global[v] || null); }; s.onerror = function () { ok(null); }; document.head.appendChild(s); }));
  }
  function quantiles(vals) { var v = vals.slice().sort(function (a, b) { return a - b; }), q = []; for (var i = 1; i < 5; i++) q.push(v[Math.min(v.length - 1, Math.floor(i * v.length / 5))]); return q; }
  function cls(v, cuts) { if (v == null) return 'gb-cx'; for (var i = 0; i < cuts.length; i++) if (v < cuts[i]) return 'gb-c' + i; return 'gb-c' + cuts.length; }
  // o = { values: {codigo: numero}, cuts: [4 cortes] (si falta, cuantiles), fmt: function(v) -> texto, label: título accesible, labels: [5 textos de leyenda] (opcional), none: texto sin dato }
  function html(M, o) {
    var vals = [], k; for (k in o.values) if (o.values.hasOwnProperty(k) && o.values[k] != null) vals.push(o.values[k]);
    var cuts = o.cuts || quantiles(vals), names = {};
    var paths = M.states.map(function (s) { names[s.id] = s.name; var v = o.values[s.id]; return '<path role="img" class="gb-prov ' + cls(v, cuts) + '" data-id="' + s.id + '" tabindex="0" aria-label="' + esc(s.name + ': ' + (v == null ? o.none : o.fmt(v))) + '" d="' + s.d + '"/>'; }).join('');
    var lo = vals.length ? Math.min.apply(null, vals) : 0, hi = vals.length ? Math.max.apply(null, vals) : 0;
    if (o.cuts) { lo = Math.min(lo, 0); hi = Math.max(hi, cuts[cuts.length - 1]); }   // tramos fijos: el primero empieza en 0
    var leg = '<div class="wp-legend gb-leg">' + [0, 1, 2, 3, 4].map(function (i) { var a = i ? cuts[i - 1] : lo, b = i < 4 ? cuts[i] : hi; return '<span><i class="gb-key gb-c' + i + '"></i>' + esc(o.labels ? o.labels[i] : o.fmt(a, true) + '–' + o.fmt(b, true)) + '</span>'; }).join('') + '<span><i class="gb-key gb-cx"></i>' + esc(o.none) + '</span></div>';
    return { html: '<svg class="gb-map fr-dmap" viewBox="' + M.viewBox + '" role="img" aria-label="' + esc(o.label) + '">' + paths + '</svg>' + leg, names: names };
  }
  // tip(id) -> html del rótulo; base = texto cuando no hay departamento señalado
  function bind(root, tipEl, base, tip) {
    var svg = root.querySelector('.fr-dmap'); if (!svg || !tipEl) return;
    var on = null;
    function show(el) { if (on) on.classList.remove('gb-on'); on = el; if (!el) { tipEl.textContent = base; return; } el.classList.add('gb-on'); tipEl.innerHTML = tip(el.getAttribute('data-id')); }
    function pick(ev) { var el = ev.target; show(el && el.getAttribute && el.getAttribute('data-id') ? el : null); }
    svg.addEventListener('mouseover', pick); svg.addEventListener('focusin', pick); svg.addEventListener('click', pick);
    svg.addEventListener('mouseleave', function () { show(null); });
  }
  global.DIFrDeptMap = { load: load, html: html, bind: bind, esc: esc };
})(window);
