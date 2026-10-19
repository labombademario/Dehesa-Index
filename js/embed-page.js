/* Dehesa Index — widget insertable (embed.html). Sin dependencias: lee data/api/v1 y dibuja el ultimo precio, sus variaciones y la evolucion.
   Parametros de la URL: s=serie (p. ej. eu/trigo), lang=es|en|fr|it, org=nombre a mostrar, c=color (6 hex), t=light|dark, y=anios del grafico (1-5).
   La atribucion de la fuente y el enlace a Dehesa Index NO se pueden quitar. ES5. */
(function () {
  'use strict';
  var Q = {}; (location.search || '').replace(/^\?/, '').split('&').forEach(function (p) { if (!p) return; var i = p.indexOf('='); var k = i < 0 ? p : p.slice(0, i); try { Q[k] = decodeURIComponent((i < 0 ? '' : p.slice(i + 1)).replace(/\+/g, ' ')); } catch (e) { } });
  var LANGS = ['es', 'en', 'fr', 'it'], L = LANGS.indexOf(Q.lang) > -1 ? Q.lang : (function () { var n = ((navigator.language || 'es') + '').slice(0, 2); return LANGS.indexOf(n) > -1 ? n : 'es'; })();
  var T = {
    es: { prev: 'Periodo anterior', yr: 'Hace 12 meses', rep: 'Informe de negociación', src: 'Fuente', lic: 'Licencia', data: 'Datos de Dehesa Index', err: 'No se pudo cargar este precio.', bad: 'Serie desconocida.', as: 'Dato de', nb: 'Sin dato', tr: ['Tercio bajo de sus últimos 5 años', 'Tercio medio de sus últimos 5 años', 'Tercio alto de sus últimos 5 años'] },
    en: { prev: 'Previous period', yr: '12 months ago', rep: 'Negotiation report', src: 'Source', lic: 'Licence', data: 'Data from Dehesa Index', err: 'This price could not be loaded.', bad: 'Unknown series.', as: 'Data of', nb: 'No data', tr: ['Lower third of its last 5 years', 'Middle third of its last 5 years', 'Upper third of its last 5 years'] },
    fr: { prev: 'Période précédente', yr: 'Il y a 12 mois', rep: 'Rapport de négociation', src: 'Source', lic: 'Licence', data: 'Données Dehesa Index', err: 'Ce prix n’a pas pu être chargé.', bad: 'Série inconnue.', as: 'Donnée du', nb: 'Pas de donnée', tr: ['Tiers bas de ses 5 dernières années', 'Tiers médian de ses 5 dernières années', 'Tiers haut de ses 5 dernières années'] },
    it: { prev: 'Periodo precedente', yr: '12 mesi fa', rep: 'Rapporto di negoziazione', src: 'Fonte', lic: 'Licenza', data: 'Dati di Dehesa Index', err: 'Impossibile caricare questo prezzo.', bad: 'Serie sconosciuta.', as: 'Dato del', nb: 'Nessun dato', tr: ['Terzo basso degli ultimi 5 anni', 'Terzo medio degli ultimi 5 anni', 'Terzo alto degli ultimi 5 anni'] }
  }[L];
  var UNIT = { tonelada: { es: 't', en: 't', fr: 't', it: 't' } };
  var root = document.documentElement, w = document.getElementById('w');
  root.lang = L;
  var theme = Q.t === 'dark' || Q.t === 'light' ? Q.t : ((window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light');
  root.setAttribute('data-theme', theme);
  if (/^[0-9a-fA-F]{6}$/.test(Q.c || '')) root.style.setProperty('--ac', '#' + Q.c);
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(n, d) { try { return Number(n).toLocaleString(L, { maximumFractionDigits: d == null ? 2 : d, minimumFractionDigits: d == null ? 0 : d }); } catch (e) { return String(n); } }
  function pct(a, b) { return (b && isFinite(a) && isFinite(b)) ? (a / b - 1) * 100 : null; }
  function height() { try { parent.postMessage({ type: 'dehesa-embed-height', h: Math.ceil(document.documentElement.getBoundingClientRect().height) + 2, s: Q.s || '' }, '*'); } catch (e) { } }
  function yearAgo(pts, freq) {
    var last = pts[pts.length - 1][0], y = parseInt(last.slice(0, 4), 10), want = (y - 1) + last.slice(4), i;
    for (i = 0; i < pts.length; i++) if (pts[i][0] === want) return pts[i];
    if (freq === 'monthly' || freq === 'quarterly' || last.length !== 10) return null;
    var t = new Date(want + 'T00:00:00Z').getTime(), best = null, bd = 1e12;
    pts.forEach(function (p) { var d = Math.abs(new Date(p[0] + 'T00:00:00Z').getTime() - t); if (d < bd) { bd = d; best = p; } });
    return bd <= (freq === 'daily' ? 7 : 14) * 864e5 ? best : null;
  }
  function tm(d) { var m = /^(\d{4})-Q(\d)$/.exec(d); if (m) return Date.UTC(+m[1], (+m[2] - 1) * 3, 1); if (/^\d{4}-\d{2}$/.test(d)) return new Date(d + '-01T00:00:00Z').getTime(); return new Date(d + 'T00:00:00Z').getTime(); }
  /* mismo calculo que el informe de negociacion: percentil del ultimo dato en los ultimos 5 anos (hace falta >= 24 datos y 4,5 anos de historia) */
  function tier(pts) {
    var last = pts[pts.length - 1], tl = tm(last[0]), w5 = pts.filter(function (p) { return tm(p[0]) >= tl - 5 * 365.25 * 864e5; });
    if (w5.length < 24 || tm(pts[0][0]) > tl - 4.5 * 365.25 * 864e5) return -1;
    var pos = Math.round(w5.filter(function (p) { return p[1] <= last[1]; }).length / w5.length * 100);
    return pos <= 33 ? 0 : pos >= 67 ? 2 : 1;
  }
  function draw(pts, years) {
    var last = pts[pts.length - 1][0], cut = (parseInt(last.slice(0, 4), 10) - years) + last.slice(4), v = pts.filter(function (p) { return p[0] >= cut; });
    if (v.length < 3) return '';
    var W = 360, H = 120, P = 4, mn = Infinity, mx = -Infinity, i;
    v.forEach(function (p) { if (p[1] < mn) mn = p[1]; if (p[1] > mx) mx = p[1]; });
    if (mx === mn) { mx += 1; mn -= 1; }
    var xy = v.map(function (p, k) { return [P + (W - 2 * P) * k / (v.length - 1), H - P - (H - 2 * P) * (p[1] - mn) / (mx - mn)]; });
    var d = xy.map(function (q, k) { return (k ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' ');
    W = W; window._dpts = v; window._dxy = xy;
    return '<svg id="ch" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(Q._n || '') + '"><path d="' + d + ' L' + xy[xy.length - 1][0].toFixed(1) + ' ' + (H - P) + ' L' + P + ' ' + (H - P) + ' Z" fill="var(--ac)" opacity=".12"/><path d="' + d + '" fill="none" stroke="var(--ac)" stroke-width="2" stroke-linejoin="round"/><circle id="dot" r="3.5" fill="var(--ac)" stroke="var(--bg)" stroke-width="2" cx="' + xy[xy.length - 1][0].toFixed(1) + '" cy="' + xy[xy.length - 1][1].toFixed(1) + '"/></svg><div class="tip" id="tip"></div>';
  }
  function hover(unit) {
    var ch = document.getElementById('ch'), tip = document.getElementById('tip'), dot = document.getElementById('dot'); if (!ch) return;
    function at(ev) {
      var r = ch.getBoundingClientRect(), x = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) / r.width * 360, best = 0, bd = 1e9;
      window._dxy.forEach(function (q, k) { var dd = Math.abs(q[0] - x); if (dd < bd) { bd = dd; best = k; } });
      var p = window._dpts[best]; dot.setAttribute('cx', window._dxy[best][0]); dot.setAttribute('cy', window._dxy[best][1]);
      tip.textContent = p[0] + ' · ' + nf(p[1]) + ' ' + unit;
    }
    ch.addEventListener('mousemove', at); ch.addEventListener('touchmove', at, { passive: true });
  }
  function run() {
    var id = Q.s || '', years = Math.max(1, Math.min(5, parseInt(Q.y, 10) || 3));
    if (!/^[a-z]{2}\/[a-z0-9_-]+$/.test(id)) { w.innerHTML = '<p class="err">' + esc(T.bad) + '</p>'; height(); return; }
    fetch('data/api/v1/series/' + id + '.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (s) {
      var pts = s.points || []; if (!pts.length) throw new Error('vacio');
      var last = pts[pts.length - 1], prev = pts.length > 1 ? pts[pts.length - 2] : null, ya = yearAgo(pts, s.frequency);
      var name = (s.name && (s.name[L] || s.name.es)) || s.product, place = (s.place && (s.place[L] || s.place.es)) || '', unit = s.currency + '/' + (s.unit === 'tonelada' ? 't' : s.unit);
      Q._n = name; var cP = prev ? pct(last[1], prev[1]) : null, cY = ya ? pct(last[1], ya[1]) : null;
      function chg(c) { return c == null ? '<span class="mut">' + esc(T.nb) + '</span>' : '<b class="' + (c >= 0 ? 'up' : 'dn') + '">' + (c >= 0 ? '+' : '−') + nf(Math.abs(c), 1) + ' %</b>'; }
      var org = (Q.org || '').slice(0, 60), rep = 'informe-negociacion.html?p=' + encodeURIComponent(s.product);
      var h = (org ? '<p class="org">' + esc(org) + '</p>' : '') + '<h1>' + esc(name) + '</h1><p class="pl">' + esc(place) + '</p>' +
        '<div class="big">' + nf(last[1]) + '<span class="u">' + esc(unit) + '</span></div><div class="row"><span><span class="mut">' + esc(T.as) + '</span> ' + esc(last[0]) + '</span></div>' +
        '<div class="row"><span><span class="mut">' + esc(T.prev) + '</span> ' + chg(cP) + '</span><span><span class="mut">' + esc(T.yr) + '</span> ' + chg(cY) + '</span></div>' + (tier(pts) > -1 ? '<div class="row"><span class="mut" id="tr">' + esc(T.tr[tier(pts)]) + '</span></div>' : '') + draw(pts, years) +
        '<div class="ft">' + esc(T.src) + ': ' + esc(s.sourceName) + ' · ' + esc(T.lic) + ': ' + esc(s.license) + '<br>' + esc(String(s.attribution || '').replace(/^Source:\s*/i, '')) +
        '<br><a href="' + esc(rep) + '" target="_blank" rel="noopener">' + esc(T.rep) + '</a> · <a href="./" target="_blank" rel="noopener">' + esc(T.data) + '</a></div>';
      w.innerHTML = h; document.title = name + ' | Dehesa Index'; hover(unit); height();
    }).catch(function () { w.innerHTML = '<p class="err">' + esc(T.err) + '</p>'; height(); });
  }
  run();
  if (window.ResizeObserver) { try { new ResizeObserver(height).observe(document.body); } catch (e) { } }
  window.addEventListener('load', height);
})();
