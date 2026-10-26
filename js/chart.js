/* Dehesa Index — gráficas de línea compartidas.
   DehesaChart.render(opts)  -> HTML de una gráfica con ejes, títulos de ejes, rejilla, leyenda y valor al pasar el ratón.
   DehesaChart.attr(spec)    -> atributo data-dh para añadir el valor al pasar el ratón a una gráfica SVG que ya existe.
   El cursor y el globo de valores se dibujan con un solo controlador delegado (funciona tras cualquier re-render). */
(function () {
  'use strict';
  var FONT = '11.5px', TXT = 'var(--text-faint,#7a7466)', GRID = 'var(--border,#e2ddd0)';
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : (document.documentElement.lang || 'es'); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function niceStep(raw) { var e = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; }
  function decimals(step) { if (step >= 1) return 0; return Math.min(4, Math.ceil(-Math.log(step) / Math.LN10 - 1e-9)); }
  function fmtDate(ts, span) {
    var o = span > 500 * 86400000 ? { month: 'short', year: 'numeric' } : span > 60 * 86400000 ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' };
    o.timeZone = 'UTC';
    try { return new Date(ts).toLocaleDateString(lang(), o); } catch (e) { return new Date(ts).toISOString().slice(0, 10); }
  }
  function fmtDateFull(ts) { try { return new Date(ts).toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return new Date(ts).toISOString().slice(0, 10); } }
  var MONS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
  function histTs(h) { // punto de histórico { period, year } -> fecha UTC en ms
    var pe = String(h.period), y = +h.year, m;
    if (/^\d\d-\d\d$/.test(pe)) return Date.UTC(y, +pe.slice(0, 2) - 1, +pe.slice(3));
    if (MONS[pe]) return Date.UTC(y, MONS[pe] - 1, 1);
    if (/^\d{1,2}$/.test(pe) && +pe >= 1 && +pe <= 12) return Date.UTC(y, +pe - 1, 1);   // mes numerico 1-12 (Banco Mundial mensual: antes los meses 1-9 caian todos en enero)
    m = /^Q(\d)$/.exec(pe); if (m) return Date.UTC(y, (+m[1] - 1) * 3, 1);
    return Date.UTC(y, 0, 1);
  }
  function fmtMonth(ts) { try { return new Date(ts).toLocaleDateString(lang(), { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return new Date(ts).toISOString().slice(0, 7); } }
  function attrJson(o) { return esc(JSON.stringify(o)); }

  /* ---------- gráfica completa ---------- */
  var SUMW = { es: ['de', 'a', 'mín.', 'máx.'], en: ['from', 'to', 'min', 'max'], fr: ['de', 'à', 'min.', 'max.'], it: ['da', 'a', 'min.', 'max.'] };
  function summaryText(S, time, vFmt) { // resumen textual para lectores de pantalla: primer y ultimo punto, minimo y maximo por serie
    var w = SUMW[lang()] || SUMW.es;
    return S.slice(0, 6).map(function (s) {
      var pts = s.pts.filter(function (p) { return p.y !== null && p.y !== undefined && isFinite(p.y); }); if (!pts.length) return '';
      var a = pts[0], z = pts[pts.length - 1], mn = pts[0], mx = pts[0]; pts.forEach(function (p) { if (p.y < mn.y) mn = p; if (p.y > mx.y) mx = p; });
      var xl = function (p) { return time ? fmtDateFull(p.x) : String(p.x); };
      return (s.name ? s.name + ': ' : '') + w[0] + ' ' + xl(a) + ' (' + vFmt(a.y) + ') ' + w[1] + ' ' + xl(z) + ' (' + vFmt(z.y) + '); ' + w[2] + ' ' + vFmt(mn.y) + ', ' + w[3] + ' ' + vFmt(mx.y);
    }).filter(Boolean).join('. ');
  }
  var GAPW = { es: ['Hueco en la serie: sin dato publicado entre', 'y', 'Los valores de antes y de después pueden no ser comparables (cambio de cobertura o definición de la fuente).'], en: ['Gap in the series: no published data between', 'and', 'Values before and after may not be comparable (change in the source’s coverage or definition).'], fr: ['Rupture dans la série : aucune donnée publiée entre', 'et', 'Les valeurs avant et après peuvent ne pas être comparables (changement de couverture ou de définition de la source).'], it: ['Interruzione nella serie: nessun dato pubblicato tra', 'e', 'I valori prima e dopo potrebbero non essere confrontabili (cambio di copertura o di definizione della fonte).'] };
  /* Línea de tendencia (opcional, la activa el usuario): recta de mínimos cuadrados sobre los puntos mostrados de una serie temporal única. Descriptiva, no una previsión.
     La preferencia se recuerda en este navegador (localStorage 'dehesaTrend') y se aplica a todas las gráficas de la página. */
  var TRW = { es: ['Línea de tendencia', 'Tendencia', 'al año', 'R²', 'calculada sobre los {n} puntos mostrados', 'la recta apenas explica la serie', 'Es una descripción del pasado, no una previsión.'],
    en: ['Trend line', 'Trend', 'per year', 'R²', 'fitted to the {n} points shown', 'the line barely explains the series', 'It describes the past; it is not a forecast.'],
    fr: ['Ligne de tendance', 'Tendance', 'par an', 'R²', 'calculée sur les {n} points affichés', 'la droite explique à peine la série', 'C’est une description du passé, pas une prévision.'],
    it: ['Linea di tendenza', 'Tendenza', 'all’anno', 'R²', 'calcolata sui {n} punti mostrati', 'la retta spiega appena la serie', 'Descrive il passato, non è una previsione.'] };
  var TRK = 'dehesaTrend';
  function trendOn() { try { return window.localStorage.getItem(TRK) === '1'; } catch (e) { return false; } }
  function linFit(pts) {   // pts: [[x, y]] -> { a, b, r2, n } con y = a + b·x
    var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0, i;
    for (i = 0; i < n; i++) { sx += pts[i][0]; sy += pts[i][1]; }
    var mx = sx / n, my = sy / n;
    for (i = 0; i < n; i++) { var dx = pts[i][0] - mx, dy = pts[i][1] - my; sxx += dx * dx; sxy += dx * dy; syy += dy * dy; }
    if (!sxx) return null;
    var b = sxy / sxx; return { a: my - b * mx, b: b, r2: syy ? (sxy * sxy) / (sxx * syy) : 0, n: n };
  }
  function sig3(v) { var a = Math.abs(v); return a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : a > 0 ? Math.min(6, Math.ceil(-Math.log(a) / Math.LN10) + 2) : 0; }
  function render(o) {
    var S = (o.series || []).filter(function (s) { return s.pts && s.pts.length; });
    if (!S.length) return '';
    var time = o.xMode === 'time';
    var vw0 = window.innerWidth || 720, W = Math.max(320, Math.min(o.width || Math.min(960, vw0 - 96), vw0 - 48)), H = o.height || (o.width ? 250 : Math.round(Math.max(250, Math.min(320, W * 0.32))));
    var L = o.yTitle ? 66 : 54, R = 14, Tp = 12, Bt = o.xTitle ? 46 : 28;
    var xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
    S.forEach(function (s) { s.pts.forEach(function (p) { if (p.x < xmin) xmin = p.x; if (p.x > xmax) xmax = p.x; if (p.y !== null && p.y !== undefined && isFinite(p.y)) { if (p.y < ymin) ymin = p.y; if (p.y > ymax) ymax = p.y; } }); });
    if (!isFinite(ymin)) return '';
    if (o.zero) { if (ymin > 0) ymin = 0; if (ymax < 0) ymax = 0; }
    if (o.yMin !== undefined) ymin = o.yMin; if (o.yMax !== undefined) ymax = o.yMax;
    if (ymin === ymax) { ymin -= 1; ymax += 1; }
    var step = niceStep((ymax - ymin) / 4), lo = Math.floor(ymin / step) * step, hi = Math.ceil(ymax / step) * step;
    if (o.yMin === undefined && !o.zero && ymin >= 0 && lo < 0) lo = 0;
    if (xmin === xmax) { xmin -= 1; xmax += 1; }
    var x = function (v) { return L + (W - L - R) * (v - xmin) / (xmax - xmin); }, y = function (v) { return Tp + (H - Tp - Bt) * (1 - (v - lo) / (hi - lo)); };
    var yd = decimals(step), yFmt = o.yFmt || function (v) { return nf(v, yd); }, vFmt = o.vFmt || function (v) { return nf(v, Math.max(yd, Math.abs(v) < 100 ? 2 : 1)); };
    // margen izquierdo segun la etiqueta mas larga del eje y (cifras de 8+ digitos se cortaban o pisaban el titulo del eje)
    (function () { var w = 0, q; for (q = lo; q <= hi + step / 1000; q += step) w = Math.max(w, String(yFmt(q)).length); L = Math.max(L, Math.round(w * 6.7 + (o.yTitle ? 30 : 12))); })();
    // serie anual (todos los puntos a 1 de enero): marcas del eje x en anos enteros y etiqueta solo con el ano
    var annual = time && !o.xFmt && S.every(function (s) { return s.pts.every(function (p) { var d = new Date(p.x); return d.getUTCMonth() === 0 && d.getUTCDate() === 1; }); });
    var g = '', k, v;
    for (v = lo; v <= hi + step / 1000; v += step) {
      g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" stroke="' + GRID + '"/>' +
        '<text x="' + (L - 7) + '" y="' + (y(v) + 4).toFixed(1) + '" font-size="' + FONT + '" text-anchor="end" fill="' + TXT + '">' + esc(yFmt(v)) + '</text>';
    }
    g += '<line x1="' + L + '" x2="' + L + '" y1="' + Tp + '" y2="' + (H - Bt) + '" stroke="' + GRID + '"/><line x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - Bt) + '" y2="' + (H - Bt) + '" stroke="var(--text-faint,#9a9484)" stroke-opacity=".5"/>';
    // eje x
    var nt = Math.max(2, Math.min(6, Math.floor((W - L - R) / 100))), span = xmax - xmin, xt = [], i;
    var labelsIdx = o.xLabels;
    if (annual) { var y0 = new Date(xmin).getUTCFullYear(), y1 = new Date(xmax).getUTCFullYear(), ys = Math.max(1, Math.ceil((y1 - y0) / (nt - 1))); for (i = y0; i <= y1; i += ys) xt.push(Date.UTC(i, 0, 1)); if (xt[xt.length - 1] !== Date.UTC(y1, 0, 1) && y1 - new Date(xt[xt.length - 1]).getUTCFullYear() >= ys / 2) xt.push(Date.UTC(y1, 0, 1)); else if (xt[xt.length - 1] !== Date.UTC(y1, 0, 1)) xt[xt.length - 1] = Date.UTC(y1, 0, 1); }
    else if (time) { for (i = 0; i < nt; i++) xt.push(xmin + span * i / (nt - 1)); }
    else { for (i = 0; i < nt; i++) xt.push(Math.round(xmin + span * i / (nt - 1))); }
    xt.forEach(function (t, j) {
      var lab = time ? (o.xFmt ? o.xFmt(t, span) : annual ? String(new Date(t).getUTCFullYear()) : fmtDate(t, span)) : (labelsIdx && labelsIdx[t] !== undefined ? labelsIdx[t] : (o.xFmt ? o.xFmt(t) : String(t)));
      g += '<line x1="' + x(t).toFixed(1) + '" x2="' + x(t).toFixed(1) + '" y1="' + (H - Bt) + '" y2="' + (H - Bt + 4) + '" stroke="' + GRID + '"/><text x="' + x(t).toFixed(1) + '" y="' + (H - Bt + 17) + '" font-size="' + FONT + '" text-anchor="' + (j === 0 ? 'start' : j === xt.length - 1 ? 'end' : 'middle') + '" fill="' + TXT + '">' + esc(lab) + '</text>';
    });
    if (o.xTitle) g += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" font-size="' + FONT + '" text-anchor="middle" fill="' + TXT + '" font-weight="600">' + esc(o.xTitle) + '</text>';
    if (o.yTitle) g += '<text transform="translate(13 ' + ((Tp + H - Bt) / 2) + ') rotate(-90)" font-size="' + FONT + '" text-anchor="middle" fill="' + TXT + '" font-weight="600">' + esc(o.yTitle) + '</text>';
    // series
    var spec = { L: L, R: W - R, T: Tp, B: H - Bt, s: [], m: o.measurePp ? 'pp' : 'pct' }, breaks = [];
    S.forEach(function (s) {
      var d = '', pen = false, pts = [], dots = '', run = 0, lastX = null, lastXY = null;
      // Hueco en la serie (anos o meses sin dato publicado): la linea se corta en vez de unir los extremos con una recta enganosa.
      // Se considera hueco un salto de tiempo mayor que 3 veces la separacion habitual entre puntos (mediana).
      var gapMax = Infinity;
      if (time) { var dx = [], prevX = null; s.pts.forEach(function (p) { if (p.y === null || p.y === undefined || !isFinite(p.y)) return; if (prevX !== null) dx.push(p.x - prevX); prevX = p.x; }); if (dx.length >= 3) { dx.sort(function (a, b) { return a - b; }); gapMax = Math.max(dx[Math.floor(dx.length / 2)] * 3.01, 8 * 86400000); } }
      s.pts.forEach(function (p, idx) {
        if (p.y === null || p.y === undefined || !isFinite(p.y)) { if (run === 1 && lastXY) dots += lastXY; pen = false; run = 0; return; }
        var px = x(p.x), py = y(p.y);
        if (pen && lastX !== null && p.x - lastX > gapMax) { if (run === 1 && lastXY) dots += lastXY; pen = false; run = 0; if (breaks.length < 2) breaks.push([lastX, p.x]); }
        d += (pen ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1) + ' '; pen = true; run++; lastX = p.x;
        lastXY = '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="2.6" fill="' + s.color + '"/>';
        var lab = p.l || (time ? (annual ? String(new Date(p.x).getUTCFullYear()) : fmtDateFull(p.x)) : (labelsIdx && labelsIdx[p.x] !== undefined ? labelsIdx[p.x] : String(p.x)));
        pts.push([+px.toFixed(1), +py.toFixed(1), (o.vFmtS && o.vFmtS[s.name] ? o.vFmtS[s.name](p.y, p) : vFmt(p.y)), lab, p.y]);
      });
      if (run === 1 && lastXY) dots += lastXY;
      g += dots + '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"' + (s.dash ? ' stroke-dasharray="6 4"' : '') + '/>';
      spec.s.push({ n: s.name, c: s.color, p: pts });
    });
    var trendSvg = '', trendBox = '';
    if (time && S.length === 1 && o.trend !== false) {
      var tp = S[0].pts.filter(function (p) { return p.y !== null && p.y !== undefined && isFinite(p.y); }).map(function (p) { return [(p.x - xmin) / (365.25 * 864e5), p.y]; });
      var fit = tp.length >= 5 ? linFit(tp) : null;
      if (fit) {
        var on = trendOn(), tw = TRW[lang()] || TRW.es, yr = (xmax - xmin) / (365.25 * 864e5), cid = 'dhc' + Math.random().toString(36).slice(2, 8);
        trendSvg = '<clipPath id="' + cid + '"><rect x="' + L + '" y="' + Tp + '" width="' + (W - R - L) + '" height="' + (H - Bt - Tp) + '"/></clipPath><g class="dh-trend" clip-path="url(#' + cid + ')"' + (on ? '' : ' style="display:none"') + '><line x1="' + x(xmin).toFixed(1) + '" y1="' + y(fit.a).toFixed(1) + '" x2="' + x(xmax).toFixed(1) + '" y2="' + y(fit.a + fit.b * yr).toFixed(1) + '" stroke="var(--text,#3a352c)" stroke-opacity=".75" stroke-width="1.6" stroke-dasharray="7 5"/></g>';
        var unit = o.trendUnit || o.yTitle || '', sl = fit.b, txt = tw[1] + ': ' + (sl > 0 ? '+' : sl < 0 ? '−' : '') + nf(Math.abs(sl), sig3(sl)) + (unit ? ' ' + unit : '') + ' ' + tw[2] + ' · ' + tw[3] + ' ' + nf(fit.r2, 2) + ' (' + tw[4].replace('{n}', String(fit.n)) + (fit.r2 < 0.1 ? '; ' + tw[5] : '') + '). ' + tw[6];
        trendBox = '<div style="margin:6px 0 0 4px;font-size:12px;color:var(--text-faint,#7a7466)"><label style="display:inline-flex;gap:6px;align-items:center;cursor:pointer;color:var(--text,#3a352c)"><input type="checkbox" data-dh-trend="1"' + (on ? ' checked' : '') + '> ' + esc(tw[0]) + '</label><div class="dh-trend-txt" style="margin-top:3px' + (on ? '' : ';display:none') + '">' + esc(txt) + '</div></div>';
      }
    }
    var leg = !o.noLegend && (S.length > 1 || o.legend) ? '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;margin:6px 0 0 4px">' + S.map(function (s) { return '<span><span style="display:inline-block;width:14px;height:3px;background:' + s.color + ';vertical-align:middle;margin-right:6px' + (s.dash ? ';opacity:.7' : '') + '"></span>' + esc(s.name) + '</span>'; }).join('') + '</div>' : '';
    var gapNote = '';
    if (breaks.length && time) { var bl = function (t) { return annual ? String(new Date(t).getUTCFullYear()) : fmtMonth(t); }, gw = GAPW[lang()] || GAPW.es; gapNote = '<div style="margin:6px 0 0 4px;font-size:11.5px;color:var(--text-faint,#7a7466)">' + esc(gw[0] + ' ' + bl(breaks[0][0]) + ' ' + gw[1] + ' ' + bl(breaks[0][1]) + '.' + (annual ? ' ' + gw[2] : '')) + '</div>'; }
    return '<div class="di-card di-ch" style="padding:10px 10px 8px"><svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:' + W + 'px;margin:0 auto;height:auto;display:block;touch-action:pan-y" role="img" tabindex="0" aria-label="' + esc((o.aria ? o.aria + '. ' : '') + summaryText(S, time, vFmt)) + '" data-dh="' + attrJson(spec) + '">' + g + trendSvg + '</svg>' + leg + trendBox + gapNote + '</div>';
  }

  document.addEventListener('change', function (e) {
    var t = e.target; if (!t || !t.matches || !t.matches('input[data-dh-trend]')) return;
    var on = !!t.checked; try { window.localStorage.setItem(TRK, on ? '1' : '0'); } catch (er) {}
    [].forEach.call(document.querySelectorAll('.di-ch'), function (c) {
      var i = c.querySelector('input[data-dh-trend]'); if (i) i.checked = on;
      [].forEach.call(c.querySelectorAll('.dh-trend, .dh-trend-txt'), function (el) { el.style.display = on ? '' : 'none'; });
    });
  });

  /* ---------- atributo para gráficas ya existentes ----------
     spec = { L, R, T, B (área de dibujo en coordenadas del viewBox), s: [{ n, c, p: [[x, y, textoValor, etiqueta], ...] }] } */
  function attr(spec) { return ' data-dh="' + attrJson(spec) + '" style="touch-action:pan-y"'; }

  /* ---------- controlador de hover ---------- */
  var tip = null, ov = null, cur = null, cache = new WeakMap(), drag = null;
  var HINT = { es: 'Pulsa un punto para ver su variación · arrastra para medir', en: 'Click a point to see its change · drag to measure', fr: 'Cliquez sur un point pour voir sa variation · glissez pour mesurer', it: 'Fai clic su un punto per la variazione · trascina per misurare' };
  var VS = { es: ['frente a', 'desde'], en: ['vs', 'since'], fr: ['par rapport à', 'depuis'], it: ['rispetto a', 'da'] };
  /* Texto alternativo automatico: toda svg[role=img] sin nombre accesible (graficas ligeras con attr(), mapas de estados) recibe un aria-label
     con el titulo del bloque (primer encabezado del contenedor) y, si lleva datos (data-dh), primer y ultimo punto de la primera serie. */
  function autoLabel(root) {
    var list = (root || document).querySelectorAll('svg[role="img"]'), i, svg;
    for (i = 0; i < list.length; i++) {
      svg = list[i];
      if (svg.getAttribute('aria-label') || svg.getAttribute('aria-labelledby') || svg.querySelector(':scope > title')) continue;
      var n = svg.parentNode, h = null, k = 0;
      while (n && n !== document.body && k++ < 6 && !h) { h = n.querySelector('h2,h3,h4,.di-info-card-title,.di-card-title'); n = n.parentNode; }
      var txt = (h && h.textContent.replace(/\s+/g, ' ').trim()) || (document.querySelector('h1') ? document.querySelector('h1').textContent.replace(/\s+/g, ' ').trim() : document.title);
      var raw = svg.getAttribute('data-dh');
      if (raw) { try { var sp = JSON.parse(raw), s0 = (sp.s || [])[0], pts = s0 && s0.p; if (pts && pts.length) { var f = pts[0], l = pts[pts.length - 1]; txt += ': ' + (f[3] || '') + ' ' + (f[2] || '') + ' \u2192 ' + (l[3] || '') + ' ' + (l[2] || ''); } } catch (e) {} }
      svg.setAttribute('aria-label', txt.replace(/\s+/g, ' ').trim());
    }
  }
  (function () {
    var tm = null;
    function run() { tm = null; autoLabel(document); }
    function sched() { if (!tm) tm = setTimeout(run, 150); }
    function start() { run(); try { new MutationObserver(sched).observe(document.body, { childList: true, subtree: true }); } catch (e) {} }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  })();
  (function () { try { var st = document.createElement('style'); st.textContent = 'svg[data-dh]{-webkit-user-select:none;user-select:none;cursor:crosshair}'; document.head.appendChild(st); } catch (e) {} })();
  function pctTxt(v, pp) { var a = Math.abs(v), txt = nf(a, a < 10 ? 2 : 1) + (pp ? ' pp' : ' %'); return (v > 0 ? '+' : v < 0 ? '−' : '') + txt; }
  function nearestIdx(pts, x) { var bi = -1, d0 = Infinity; pts.forEach(function (p, i) { var d = Math.abs(p[0] - x); if (d < d0) { d0 = d; bi = i; } }); return bi; }
  function place(svg, t, gx, gy) {
    var r = svg.getBoundingClientRect(), sx = r.width / (svg.viewBox.baseVal.width || r.width), tx = r.left + gx * sx + 14, ty = r.top + gy * sx - t.offsetHeight / 2;
    if (tx + t.offsetWidth > window.innerWidth - 8) tx = r.left + gx * sx - t.offsetWidth - 14;
    if (tx < 8) tx = 8;
    ty = Math.max(8, Math.min(ty, window.innerHeight - t.offsetHeight - 8));
    t.style.left = tx + 'px'; t.style.top = ty + 'px';
  }
  // Arrastrar: mide el cambio entre el punto donde se pulsó y el punto actual (siempre de la fecha más antigua a la más reciente).
  function measure(svg, spec, ax, px) {
    var lo = Math.min(ax, px), hi = Math.max(ax, px), main = spec.s[0], a0 = nearestIdx(main.p, lo), b0 = nearestIdx(main.p, hi);
    if (a0 < 0 || b0 < 0 || a0 === b0) return false;
    var x1 = main.p[a0][0], x2 = main.p[b0][0], pp = spec.m === 'pp';
    if (cur !== svg || !ov) { clear(); cur = svg; ov = document.createElementNS('http://www.w3.org/2000/svg', 'g'); ov.setAttribute('pointer-events', 'none'); svg.appendChild(ov); }
    var html = '<rect x="' + x1 + '" y="' + spec.T + '" width="' + (x2 - x1) + '" height="' + (spec.B - spec.T) + '" fill="' + main.c + '" opacity="0.10"/>' +
      '<line x1="' + x1 + '" x2="' + x1 + '" y1="' + spec.T + '" y2="' + spec.B + '" stroke="var(--text-faint,#8a8578)" stroke-width="1"/>' +
      '<line x1="' + x2 + '" x2="' + x2 + '" y1="' + spec.T + '" y2="' + spec.B + '" stroke="var(--text-faint,#8a8578)" stroke-width="1"/>';
    var rows = '', lastY = main.p[b0][1];
    spec.s.forEach(function (sr) {
      var ia = nearestIdx(sr.p, x1), ib = nearestIdx(sr.p, x2);
      if (ia < 0 || ib < 0) return;
      var pa = sr.p[ia], pb = sr.p[ib];
      if (Math.abs(pa[0] - x1) > 45 || Math.abs(pb[0] - x2) > 45) return; // serie sin dato en ese tramo
      html += '<circle cx="' + pa[0] + '" cy="' + pa[1] + '" r="4" fill="' + sr.c + '" stroke="var(--surface,#fff)" stroke-width="2"/><circle cx="' + pb[0] + '" cy="' + pb[1] + '" r="4.5" fill="' + sr.c + '" stroke="var(--surface,#fff)" stroke-width="2"/>';
      var va = pa[4], vb = pb[4], chg = null;
      if (isFinite(va) && isFinite(vb) && va !== null && vb !== null) chg = pp ? vb - va : (Math.abs(va) > 1e-9 ? (vb - va) / Math.abs(va) * 100 : null);
      var col = chg === null || chg === 0 ? 'inherit' : (chg > 0 ? 'var(--positive,#2F7D4F)' : 'var(--negative,#B23A34)');
      rows += '<div style="margin-top:4px">' + (spec.s.length > 1 && sr.n ? '<div><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + sr.c + ';margin-right:6px"></span>' + esc(sr.n) + '</div>' : '') +
        '<div style="display:flex;gap:10px;align-items:baseline;justify-content:space-between"><span style="color:var(--text-faint,#7a7466)">' + esc(pa[2]) + ' → ' + esc(pb[2]) + '</span>' +
        (chg !== null ? '<strong style="color:' + col + ';font-size:14px;white-space:nowrap">' + esc(pctTxt(chg, pp)) + '</strong>' : '') + '</div></div>';
    });
    ov.innerHTML = html;
    var t = tipEl();
    t.innerHTML = '<div style="color:var(--text-faint,#7a7466);font-size:11.5px">' + esc(main.p[a0][3]) + ' → ' + esc(main.p[b0][3]) + '</div>' + rows;
    t.style.display = 'block';
    place(svg, t, x2, lastY);
    return true;
  }
  function plotPt(svg, e, spec, clampIt) {
    var m = svg.getScreenCTM(); if (!m) return null;
    var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; pt = pt.matrixTransform(m.inverse());
    if (clampIt) { pt.x = Math.max(spec.L, Math.min(spec.R, pt.x)); }
    return pt;
  }
  function down(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var svg = e.target && e.target.closest ? e.target.closest('svg[data-dh]') : null;
    if (!svg) return;
    pinnedAtDown = !!(pinned && pinned.svg === svg); if (pinned) clear(true);
    var spec = specOf(svg); if (!spec || !spec.s.length || spec.nm) return; // nm: solo valor al pasar, sin medir cambios entre barras
    var pt = plotPt(svg, e, spec, false); if (!pt) return;
    if (pt.x < spec.L - 4 || pt.x > spec.R + 4 || pt.y < spec.T - 6 || pt.y > spec.B + 6) return;
    drag = { svg: svg, ax: pt.x, id: e.pointerId, moved: false };
    try { svg.setPointerCapture(e.pointerId); } catch (er) {}
  }
  function up(e) {
    if (!drag) return;
    var d = drag; drag = null; lastMoved = !!d.moved;
    try { d.svg.releasePointerCapture(d.id); } catch (er) {}
    if (e.pointerType !== 'touch') { clear(); move(e); }
  }
  function tipEl() { if (!tip) { tip = document.createElement('div'); tip.setAttribute('role', 'tooltip'); tip.style.cssText = 'position:fixed;z-index:99999;pointer-events:none;display:none;background:var(--surface,#fff);color:var(--text,#222);border:1px solid var(--border,#d9d3c3);border-radius:8px;padding:8px 10px;font:12.5px/1.35 "Public Sans",system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.14);max-width:260px'; document.body.appendChild(tip); } return tip; }
  function specOf(svg) { var sp = cache.get(svg); var raw = svg.getAttribute('data-dh'); if (!sp || sp.raw !== raw) { try { sp = { raw: raw, v: JSON.parse(raw) }; } catch (e) { sp = { raw: raw, v: null }; } cache.set(svg, sp); } return sp.v; }
  function hide() { if (ov && ov.parentNode) ov.parentNode.removeChild(ov); ov = null; cur = null; if (tip) tip.style.display = 'none'; }
  // punto fijado con un clic o toque: lo suelta otro clic, Esc, el scroll o redibujar el gráfico
  var pinned = null, pinnedAtDown = false, lastMoved = false;
  function clear(force) { if (pinned && !force) return; pinned = null; hide(); }
  function move(e) {
    if (pinned) { if (!pinned.svg.isConnected) clear(true); else return; }
    var svg = drag ? drag.svg : (e.target && e.target.closest ? e.target.closest('svg[data-dh]') : null);
    if (!svg) { if (cur) clear(); return; }
    var spec = specOf(svg); if (!spec || !spec.s.length) return;
    var m = svg.getScreenCTM(); if (!m) return;
    var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; pt = pt.matrixTransform(m.inverse());
    if (drag) {
      var px = Math.max(spec.L, Math.min(spec.R, pt.x));
      if (Math.abs(px - drag.ax) > 3 && measure(svg, spec, drag.ax, px)) { drag.moved = true; return; }
      if (drag.moved) return;
    }
    if (pt.x < spec.L - 4 || pt.x > spec.R + 4 || pt.y < spec.T - 6 || pt.y > spec.B + 6) { if (cur === svg) { clear(); } return; }
    // punto más cercano de cada serie; la serie guía es la que tiene el punto más cerca en x
    var hits = [], best = null, bd = Infinity;
    spec.s.forEach(function (s) {
      var bi = -1, d0 = Infinity; s.p.forEach(function (p, i) { var d = Math.abs(p[0] - pt.x); if (d < d0) { d0 = d; bi = i; } });
      if (bi >= 0) { var h = { s: s, p: s.p[bi], d: d0 }; hits.push(h); if (d0 < bd) { bd = d0; best = h; } }
    });
    if (!best) return;
    var gx = best.p[0];
    if (cur !== svg || !ov) { clear(); cur = svg; ov = document.createElementNS('http://www.w3.org/2000/svg', 'g'); ov.setAttribute('pointer-events', 'none'); svg.appendChild(ov); }
    var html = '<line x1="' + gx + '" x2="' + gx + '" y1="' + spec.T + '" y2="' + spec.B + '" stroke="var(--text-faint,#8a8578)" stroke-width="1" stroke-dasharray="3 3"/>';
    hits.forEach(function (h) { if (Math.abs(h.p[0] - gx) < 40) html += '<circle cx="' + h.p[0] + '" cy="' + h.p[1] + '" r="4.5" fill="' + h.s.c + '" stroke="var(--surface,#fff)" stroke-width="2"/>'; });
    ov.innerHTML = html;
    var lines = hits.filter(function (h) { return Math.abs(h.p[0] - gx) < 40; }).map(function (h) {
      return '<div style="display:flex;gap:8px;align-items:baseline;justify-content:space-between"><span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + h.s.c + ';margin-right:6px"></span>' + (spec.s.length > 1 ? esc(h.s.n) : '') + '</span><strong>' + esc(h.p[2]) + '</strong></div>' + (h.p[3] !== best.p[3] ? '<div style="color:var(--text-faint,#7a7466);font-size:11.5px;margin:-2px 0 2px 15px">' + esc(h.p[3]) + '</div>' : '');
    }).join('');
    var hint = best.p[4] !== undefined && best.p[4] !== null && !spec.nm && !drag && e.pointerType === 'mouse' ? '<div style="margin-top:5px;color:var(--text-faint,#7a7466);font-size:11px">' + esc(HINT[lang()] || HINT.es) + '</div>' : '';
    var t = tipEl(); t.innerHTML = '<div style="color:var(--text-faint,#7a7466);font-size:11.5px;margin-bottom:3px">' + esc(best.p[3]) + '</div>' + lines + hint; t.style.display = 'block';
    place(svg, t, gx, best.p[1]);
  }
  document.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerdown', function (e) { if (pinned && !(e.target && e.target.closest && e.target.closest('svg[data-dh]'))) clear(true); down(e); move(e); }, { passive: true });
  function chgOf(a, b, pp) { return a == null || b == null || !isFinite(a) || !isFinite(b) ? null : pp ? a - b : (Math.abs(b) > 1e-9 ? (a - b) / Math.abs(b) * 100 : null); }
  function chgRow(label, v, pp) { var col = v === 0 ? 'inherit' : (v > 0 ? 'var(--positive,#2F7D4F)' : 'var(--negative,#B23A34)'); return '<div style="display:flex;gap:10px;justify-content:space-between;color:var(--text-faint,#7a7466)"><span>' + esc(label) + '</span><strong style="color:' + col + ';white-space:nowrap">' + esc(pctTxt(v, pp)) + '</strong></div>'; }
  document.addEventListener('click', function (e) {
    var svg = e.target && e.target.closest ? e.target.closest('svg[data-dh]') : null; if (!svg) return;
    if (lastMoved) { lastMoved = false; return; }
    if (pinnedAtDown) { pinnedAtDown = false; return; }
    var spec = specOf(svg); if (!spec || !spec.s.length || spec.nm) return;
    var pt = plotPt(svg, e, spec, false); if (!pt || pt.x < spec.L - 4 || pt.x > spec.R + 4 || pt.y < spec.T - 6 || pt.y > spec.B + 6) return;
    var pp = spec.m === 'pp', hits = [], best = null, bd = Infinity;
    spec.s.forEach(function (s) { var bi = nearestIdx(s.p, pt.x); if (bi >= 0) { var h = { s: s, i: bi, p: s.p[bi], d: Math.abs(s.p[bi][0] - pt.x) }; hits.push(h); if (h.d < bd) { bd = h.d; best = h; } } });
    if (!best || best.p[4] == null) return;
    var gx = best.p[0], vs = VS[lang()] || VS.es; hide(); cur = svg; ov = document.createElementNS('http://www.w3.org/2000/svg', 'g'); ov.setAttribute('pointer-events', 'none'); svg.appendChild(ov);
    var html = '<line x1="' + gx + '" x2="' + gx + '" y1="' + spec.T + '" y2="' + spec.B + '" stroke="var(--text-faint,#8a8578)" stroke-width="1"/>', rows = '';
    hits.filter(function (h) { return Math.abs(h.p[0] - gx) < 40; }).forEach(function (h) {
      html += '<circle cx="' + h.p[0] + '" cy="' + h.p[1] + '" r="6" fill="' + h.s.c + '" stroke="var(--surface,#fff)" stroke-width="2.5"/>';
      var prev = h.i > 0 ? h.s.p[h.i - 1] : null, first = h.i > 1 ? h.s.p[0] : null, c1 = prev ? chgOf(h.p[4], prev[4], pp) : null, c2 = first ? chgOf(h.p[4], first[4], pp) : null;
      rows += '<div style="margin-top:4px">' + (spec.s.length > 1 && h.s.n ? '<div><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + h.s.c + ';margin-right:6px"></span>' + esc(h.s.n) + '</div>' : '') + '<div style="font-weight:700">' + esc(h.p[2]) + '</div>' + (c1 !== null ? chgRow(vs[0] + ' ' + prev[3], c1, pp) : '') + (c2 !== null ? chgRow(vs[1] + ' ' + first[3], c2, pp) : '') + '</div>';
    });
    ov.innerHTML = html; var t = tipEl(); t.innerHTML = '<div style="color:var(--text-faint,#7a7466);font-size:11.5px">' + esc(best.p[3]) + '</div>' + rows; t.style.display = 'block'; place(svg, t, gx, best.p[1]); pinned = { svg: svg };
  });
  document.addEventListener('pointerup', up, { passive: true });
  // teclado: con el foco en el grafico, flechas/Inicio/Fin recorren los puntos y muestran el mismo tooltip que el raton
  var kbIdx = new WeakMap();
  document.addEventListener('keydown', function (e) {
    var svg = e.target && e.target.matches && e.target.matches('svg[data-dh]') ? e.target : null; if (!svg) return;
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].indexOf(e.key) < 0) return;
    if (e.key === 'Escape') { clear(true); return; }
    var spec = specOf(svg); if (!spec || !spec.s.length) return; var pts = spec.s[0].p, i = kbIdx.has(svg) ? kbIdx.get(svg) : pts.length - 1;
    i = e.key === 'Home' ? 0 : e.key === 'End' ? pts.length - 1 : Math.max(0, Math.min(pts.length - 1, i + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 10 : 1)));
    kbIdx.set(svg, i); e.preventDefault();
    var m = svg.getScreenCTM(); if (!m) return; var pt = svg.createSVGPoint(); pt.x = pts[i][0]; pt.y = pts[i][1]; pt = pt.matrixTransform(m);
    move({ target: svg, clientX: pt.x, clientY: pt.y, pointerType: 'key' });
  });
  document.addEventListener('focusout', function (e) { if (e.target && e.target.matches && e.target.matches('svg[data-dh]')) clear(); });
  document.addEventListener('pointercancel', function () { drag = null; clear(); }, { passive: true });
  document.documentElement.addEventListener('mouseleave', clear);
  document.addEventListener('scroll', function () { if (cur || pinned) clear(true); }, { passive: true, capture: true });
  document.addEventListener('pointerup', function (e) { if (e.pointerType === 'touch') setTimeout(clear, 1600); }, { passive: true });


  /* ---------- tarta (anillo) y selector Líneas / Tarta ----------
     pie({ items: [{ name, v, color? }], unit, aria, maxN, minShare })  -> HTML de un anillo con leyenda (porcentaje y valor). Los trozos pequeños se agrupan en «Otros».
     switcher({ line, pie, lineLabel, pieLabel })                       -> dos vistas del mismo dato con botones; la tarta solo se ofrece si hay >= 2 partes de un total. */
  var PIE_COL = ['#2f6b4a', '#e08a3a', '#3a5f8a', '#b03a2e', '#8a6d3b', '#6a8f5c', '#7b5ea7', '#c9a227', '#4f8f9a', '#9b9588'];
  var VW = { es: ['Líneas', 'Tarta', 'Otros'], en: ['Lines', 'Pie', 'Other'], fr: ['Lignes', 'Camembert', 'Autres'], it: ['Linee', 'Torta', 'Altri'] };
  function vw() { return VW[lang()] || VW.es; }
  function pie(o) {
    var items = (o.items || []).filter(function (i) { return i && isFinite(i.v) && i.v > 0; }).sort(function (a, b) { return b.v - a.v; });
    if (items.length < 2) return '';
    var tot = items.reduce(function (a, i) { return a + i.v; }, 0), maxN = o.maxN || 8, minS = o.minShare === undefined ? 0.03 : o.minShare, keep = [], rest = 0;
    items.forEach(function (i, k) { if (k < maxN && (i.v / tot >= minS || k < 3)) keep.push(i); else rest += i.v; });
    if (rest > 0) keep.push({ name: vw()[2], v: rest, color: '#b8b2a2' });
    var cx = 90, cy = 90, R = 84, r = 50, a0 = -Math.PI / 2, paths = '', unit = o.unit ? ' ' + o.unit : '', rows = '';
    keep.forEach(function (it, k) {
      it.color = it.color || PIE_COL[k % PIE_COL.length];
      var fr = it.v / tot, a1 = a0 + fr * 2 * Math.PI, big = fr > 0.5 ? 1 : 0, lab = it.name + ': ' + nf(fr * 100, fr < 0.1 ? 1 : 0) + ' % (' + nf(it.v, it.v < 100 ? 1 : 0) + unit + ')';
      if (fr > 0.9995) paths += '<circle cx="' + cx + '" cy="' + cy + '" r="' + ((R + r) / 2) + '" fill="none" stroke="' + it.color + '" stroke-width="' + (R - r) + '"><title>' + esc(lab) + '</title></circle>';
      else paths += '<path d="M' + (cx + R * Math.cos(a0)).toFixed(2) + ' ' + (cy + R * Math.sin(a0)).toFixed(2) + ' A' + R + ' ' + R + ' 0 ' + big + ' 1 ' + (cx + R * Math.cos(a1)).toFixed(2) + ' ' + (cy + R * Math.sin(a1)).toFixed(2) + ' L' + (cx + r * Math.cos(a1)).toFixed(2) + ' ' + (cy + r * Math.sin(a1)).toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + big + ' 0 ' + (cx + r * Math.cos(a0)).toFixed(2) + ' ' + (cy + r * Math.sin(a0)).toFixed(2) + ' Z" fill="' + it.color + '" stroke="var(--surface,#fff)" stroke-width="1.5"><title>' + esc(lab) + '</title></path>';
      rows += '<li style="display:flex;gap:8px;align-items:baseline;padding:2px 0"><span style="flex:none;width:10px;height:10px;border-radius:2px;background:' + it.color + ';align-self:center"></span><span style="flex:1">' + esc(it.name) + '</span><strong>' + nf(fr * 100, fr < 0.1 ? 1 : 0) + ' %</strong><span style="color:' + TXT + ';min-width:64px;text-align:right">' + nf(it.v, it.v < 100 ? 1 : 0) + esc(unit) + '</span></li>';
      a0 = a1;
    });
    var aria = (o.aria ? o.aria + '. ' : '') + keep.map(function (i) { return i.name + ' ' + nf(i.v / tot * 100, 0) + ' %'; }).join(', ');
    return '<div class="di-card di-ch" style="padding:12px 12px 10px"><div style="display:flex;gap:18px;flex-wrap:wrap;align-items:center;justify-content:center">' +
      '<svg viewBox="0 0 180 180" style="width:180px;height:180px;flex:none" role="img" aria-label="' + esc(aria) + '">' + paths + '<text x="90" y="86" text-anchor="middle" font-size="11" fill="' + TXT + '">' + esc(o.centerLabel || '') + '</text><text x="90" y="103" text-anchor="middle" font-size="14" font-weight="700" fill="var(--text,#222)">' + esc(o.center || '') + '</text></svg>' +
      '<ul style="list-style:none;margin:0;padding:0;font-size:12.5px;flex:1;min-width:200px;max-width:380px">' + rows + '</ul></div></div>';
  }
  function switcher(o) {
    if (!o.line) return o.pie || '';
    if (!o.pie) return o.line;
    var w = vw(), id = 'dhv' + Math.random().toString(36).slice(2, 8), b = function (v, lab, on) { return '<button type="button" role="tab" aria-selected="' + on + '" data-dhv="' + id + '" data-v="' + v + '" style="font:inherit;font-size:12.5px;padding:5px 12px;border:1px solid var(--border,#d9d3c3);background:' + (on ? 'var(--accent,#2f6b4a)' : 'var(--surface,#fff)') + ';color:' + (on ? '#fff' : 'var(--text,#222)') + ';cursor:pointer;' + (v === 'line' ? 'border-radius:8px 0 0 8px' : 'border-radius:0 8px 8px 0;margin-left:-1px') + '">' + esc(lab) + '</button>'; };
    return '<div data-dhvw="' + id + '" style="margin-top:10px"><div role="tablist" style="display:flex;margin:0 0 6px 2px">' + b('line', o.lineLabel || w[0], 'true') + b('pie', o.pieLabel || w[1], 'false') + '</div>' +
      '<div data-dhp="' + id + '-line">' + o.line + '</div><div data-dhp="' + id + '-pie" hidden>' + o.pie + '</div></div>';
  }
  document.addEventListener('click', function (e) {
    var bt = e.target && e.target.closest ? e.target.closest('button[data-dhv]') : null; if (!bt) return;
    var id = bt.getAttribute('data-dhv'), v = bt.getAttribute('data-v'), wrap = bt.closest('[data-dhvw]'); if (!wrap) return;
    ['line', 'pie'].forEach(function (k) { var pn = wrap.querySelector('[data-dhp="' + id + '-' + k + '"]'); if (pn) { if (k === v) pn.removeAttribute('hidden'); else pn.setAttribute('hidden', ''); } });
    Array.prototype.forEach.call(wrap.querySelectorAll('button[data-dhv]'), function (x) { var on = x === bt; x.setAttribute('aria-selected', on ? 'true' : 'false'); x.style.background = on ? 'var(--accent,#2f6b4a)' : 'var(--surface,#fff)'; x.style.color = on ? '#fff' : 'var(--text,#222)'; });
    clear(true);
  });

  /* ---- precios reales: deflactar con el IPC del país (data/cpi.json). Solo aritmética sobre datos publicados; lo que no se puede deflactar se omite y se cuenta ---- */
  var CPIDOC = null, CPIP = null;
  var EUR_CC = { AT: 1, BE: 1, BG: 1, CY: 1, DE: 1, EE: 1, EL: 1, ES: 1, FI: 1, FR: 1, HR: 1, IE: 1, IT: 1, LT: 1, LU: 1, LV: 1, MT: 1, NL: 1, PT: 1, SI: 1, SK: 1, EU: 1, EA: 1 };
  var CUR_CC = { USD: { US: 1 }, GBP: { UK: 1 }, CAD: { CA: 1 }, AUD: { AU: 1 }, DKK: { DK: 1 }, CHF: { CH: 1 }, EUR: EUR_CC };
  function curOfUnit(u) {
    u = String(u || ''); if (/index|%|unit as in source/i.test(u)) return null;
    if (/€|\bEUR\b/.test(u)) return 'EUR'; if (/^(USD|US\$|\$)|\bUSD\b/.test(u)) return 'USD'; if (/£|\bGBP\b|^p\//.test(u)) return 'GBP'; if (/^(CAD|C\$)|\bCAD\b/.test(u)) return 'CAD'; if (/^(A\$|AUD)|\bAUD\b/.test(u)) return 'AUD'; if (/\bDKK\b/.test(u)) return 'DKK'; if (/\bCHF\b/.test(u)) return 'CHF'; return null;
  }
  function realCan(cc, unit) { var c = curOfUnit(unit); return !!(c && CUR_CC[c] && CUR_CC[c][cc]); }
  function realLoad() { if (CPIDOC) return Promise.resolve(CPIDOC); if (!CPIP) CPIP = fetch('data/cpi.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { CPIDOC = d; return d; }).catch(function () { return null; }); return CPIP; }
  function cpiMonths(b) { var o = {}; if (!b) return o; var y = +b.s.slice(0, 4), m = +b.s.slice(5, 7); for (var i = 0; i < b.v.length; i++) if (b.v[i] != null) { var k = m - 1 + i; o[(y + Math.floor(k / 12)) + '-' + ('0' + (k % 12 + 1)).slice(-2)] = b.v[i]; } return o; }
  function cpiYears(b) { var o = {}; if (!b) return o; for (var i = 0; i < b.v.length; i++) if (b.v[i] != null) o[b.y0 + i] = b.v[i]; return o; }
  function mean(M, keys) { var s = 0; for (var i = 0; i < keys.length; i++) { if (M[keys[i]] == null) return null; s += M[keys[i]]; } return s / keys.length; }
  function mkeys(y, a, b) { var k = []; for (var m = a; m <= b; m++) k.push(y + '-' + ('0' + m).slice(-2)); return k; }
  // points: [[periodo, valor], ...] (periodo 'AAAA', 'AAAA-MM', 'AAAA-MM-DD', 'AAAA-Qn', 'AAAA-Sn'). Devuelve null si el país no tiene IPC utilizable para esa frecuencia.
  function realDeflate(cc, points, freq) {
    var c = CPIDOC && CPIDOC.countries && CPIDOC.countries[cc]; if (!c || !points || !points.length) return null;
    var M = cpiMonths(c.m), A = cpiYears(c.a), hasM = !!c.m, annual = /^\d{4}$/.test(points[0][0]) && (freq === 'annual' || !freq);
    var at, ref, refLabel, kind, src;
    if (annual) {
      if (c.a) { at = function (p) { return A[p] == null ? null : A[p]; }; var ys = Object.keys(A).map(Number).sort(function (x, y) { return x - y; }); ref = A[ys[ys.length - 1]]; refLabel = String(ys[ys.length - 1]); kind = 'a'; src = c.a; }
      else if (hasM) { var cy = {}, ks = Object.keys(M).sort(); ks.forEach(function (k) { cy[k.slice(0, 4)] = 1; }); at = function (p) { return mean(M, mkeys(p, 1, 12)); }; var last = null; Object.keys(cy).sort().forEach(function (y) { if (mean(M, mkeys(y, 1, 12)) != null) last = y; }); if (!last) return null; ref = mean(M, mkeys(last, 1, 12)); refLabel = last; kind = 'm'; src = c.m; }
      else return null;
    } else {
      if (!hasM) return null; var mk = Object.keys(M).sort(); ref = M[mk[mk.length - 1]]; refLabel = mk[mk.length - 1]; kind = 'm'; src = c.m;
      at = function (p) { var m = /^(\d{4})-(\d{2})/.exec(p), q = /^(\d{4})-Q([1-4])$/.exec(p), h = /^(\d{4})-S([12])$/.exec(p);
        if (q) return mean(M, mkeys(q[1], +q[2] * 3 - 2, +q[2] * 3)); if (h) return mean(M, mkeys(h[1], h[2] === '1' ? 1 : 7, h[2] === '1' ? 6 : 12)); if (m) return M[m[1] + '-' + m[2]] == null ? null : M[m[1] + '-' + m[2]]; return null; };
    }
    var out = [], miss = 0;
    points.forEach(function (p) { var d = p[1] == null ? null : at(p[0]); if (d && p[1] != null) out.push([p[0], p[1] * ref / d]); else miss++; });
    return out.length >= 2 ? { points: out, ref: refLabel, kind: kind, miss: miss, src: src.src, name: src.name, base: src.base } : null;
  }
  window.DehesaChart = { real: { load: realLoad, can: realCan, curOf: curOfUnit, deflate: realDeflate }, render: render, pie: pie, switcher: switcher, attr: attr, fmtDate: fmtDate, fmtDateFull: fmtDateFull, fmtMonth: fmtMonth, histTs: histTs, clear: function () { clear(true); } };
})();
