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
    if (/^\d\d$/.test(pe)) return Date.UTC(y, +pe - 1, 1);
    m = /^Q(\d)$/.exec(pe); if (m) return Date.UTC(y, (+m[1] - 1) * 3, 1);
    return Date.UTC(y, 0, 1);
  }
  function fmtMonth(ts) { try { return new Date(ts).toLocaleDateString(lang(), { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return new Date(ts).toISOString().slice(0, 7); } }
  function attrJson(o) { return esc(JSON.stringify(o)); }

  /* ---------- gráfica completa ---------- */
  var SUMW = { es: ['de', 'a', 'mín.', 'máx.'], en: ['from', 'to', 'min', 'max'], fr: ['de', 'à', 'min.', 'max.'], de: ['von', 'bis', 'Min.', 'Max.'] };
  function summaryText(S, time, vFmt) { // resumen textual para lectores de pantalla: primer y ultimo punto, minimo y maximo por serie
    var w = SUMW[lang()] || SUMW.es;
    return S.slice(0, 6).map(function (s) {
      var pts = s.pts.filter(function (p) { return p.y !== null && p.y !== undefined && isFinite(p.y); }); if (!pts.length) return '';
      var a = pts[0], z = pts[pts.length - 1], mn = pts[0], mx = pts[0]; pts.forEach(function (p) { if (p.y < mn.y) mn = p; if (p.y > mx.y) mx = p; });
      var xl = function (p) { return time ? fmtDateFull(p.x) : String(p.x); };
      return (s.name ? s.name + ': ' : '') + w[0] + ' ' + xl(a) + ' (' + vFmt(a.y) + ') ' + w[1] + ' ' + xl(z) + ' (' + vFmt(z.y) + '); ' + w[2] + ' ' + vFmt(mn.y) + ', ' + w[3] + ' ' + vFmt(mx.y);
    }).filter(Boolean).join('. ');
  }
  function render(o) {
    var S = (o.series || []).filter(function (s) { return s.pts && s.pts.length; });
    if (!S.length) return '';
    var time = o.xMode === 'time';
    var W = Math.max(320, Math.min(o.width || 720, (window.innerWidth || 720) - 48)), H = o.height || 250;
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
    var g = '', k, v;
    for (v = lo; v <= hi + step / 1000; v += step) {
      g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" stroke="' + GRID + '"/>' +
        '<text x="' + (L - 7) + '" y="' + (y(v) + 4).toFixed(1) + '" font-size="' + FONT + '" text-anchor="end" fill="' + TXT + '">' + esc(yFmt(v)) + '</text>';
    }
    g += '<line x1="' + L + '" x2="' + L + '" y1="' + Tp + '" y2="' + (H - Bt) + '" stroke="' + GRID + '"/><line x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - Bt) + '" y2="' + (H - Bt) + '" stroke="var(--text-faint,#9a9484)" stroke-opacity=".5"/>';
    // eje x
    var nt = Math.max(2, Math.min(6, Math.floor((W - L - R) / 100))), span = xmax - xmin, xt = [], i;
    var labelsIdx = o.xLabels;
    if (time) { for (i = 0; i < nt; i++) xt.push(xmin + span * i / (nt - 1)); }
    else { for (i = 0; i < nt; i++) xt.push(Math.round(xmin + span * i / (nt - 1))); }
    xt.forEach(function (t, j) {
      var lab = time ? (o.xFmt ? o.xFmt(t, span) : fmtDate(t, span)) : (labelsIdx && labelsIdx[t] !== undefined ? labelsIdx[t] : (o.xFmt ? o.xFmt(t) : String(t)));
      g += '<line x1="' + x(t).toFixed(1) + '" x2="' + x(t).toFixed(1) + '" y1="' + (H - Bt) + '" y2="' + (H - Bt + 4) + '" stroke="' + GRID + '"/><text x="' + x(t).toFixed(1) + '" y="' + (H - Bt + 17) + '" font-size="' + FONT + '" text-anchor="' + (j === 0 ? 'start' : j === xt.length - 1 ? 'end' : 'middle') + '" fill="' + TXT + '">' + esc(lab) + '</text>';
    });
    if (o.xTitle) g += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" font-size="' + FONT + '" text-anchor="middle" fill="' + TXT + '" font-weight="600">' + esc(o.xTitle) + '</text>';
    if (o.yTitle) g += '<text transform="translate(13 ' + ((Tp + H - Bt) / 2) + ') rotate(-90)" font-size="' + FONT + '" text-anchor="middle" fill="' + TXT + '" font-weight="600">' + esc(o.yTitle) + '</text>';
    // series
    var spec = { L: L, R: W - R, T: Tp, B: H - Bt, s: [], m: o.measurePp ? 'pp' : 'pct' };
    S.forEach(function (s) {
      var d = '', pen = false, pts = [];
      s.pts.forEach(function (p, idx) {
        if (p.y === null || p.y === undefined || !isFinite(p.y)) { pen = false; return; }
        var px = x(p.x), py = y(p.y);
        d += (pen ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1) + ' '; pen = true;
        var lab = p.l || (time ? fmtDateFull(p.x) : (labelsIdx && labelsIdx[p.x] !== undefined ? labelsIdx[p.x] : String(p.x)));
        pts.push([+px.toFixed(1), +py.toFixed(1), (o.vFmtS && o.vFmtS[s.name] ? o.vFmtS[s.name](p.y, p) : vFmt(p.y)), lab, p.y]);
      });
      g += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"' + (s.dash ? ' stroke-dasharray="6 4"' : '') + '/>';
      spec.s.push({ n: s.name, c: s.color, p: pts });
    });
    var leg = !o.noLegend && (S.length > 1 || o.legend) ? '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;margin:6px 0 0 4px">' + S.map(function (s) { return '<span><span style="display:inline-block;width:14px;height:3px;background:' + s.color + ';vertical-align:middle;margin-right:6px' + (s.dash ? ';opacity:.7' : '') + '"></span>' + esc(s.name) + '</span>'; }).join('') + '</div>' : '';
    return '<div class="di-card di-ch" style="padding:10px 10px 8px"><svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block;touch-action:pan-y" role="img" tabindex="0" aria-label="' + esc((o.aria ? o.aria + '. ' : '') + summaryText(S, time, vFmt)) + '" data-dh="' + attrJson(spec) + '">' + g + '</svg>' + leg + '</div>';
  }

  /* ---------- atributo para gráficas ya existentes ----------
     spec = { L, R, T, B (área de dibujo en coordenadas del viewBox), s: [{ n, c, p: [[x, y, textoValor, etiqueta], ...] }] } */
  function attr(spec) { return ' data-dh="' + attrJson(spec) + '" style="touch-action:pan-y"'; }

  /* ---------- controlador de hover ---------- */
  var tip = null, ov = null, cur = null, cache = new WeakMap(), drag = null;
  var HINT = { es: 'Arrastra para medir el cambio', en: 'Drag to measure the change', fr: 'Faites glisser pour mesurer la variation', it: 'Trascina per misurare la variazione' };
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
    var spec = specOf(svg); if (!spec || !spec.s.length || spec.nm) return; // nm: solo valor al pasar, sin medir cambios entre barras
    var pt = plotPt(svg, e, spec, false); if (!pt) return;
    if (pt.x < spec.L - 4 || pt.x > spec.R + 4 || pt.y < spec.T - 6 || pt.y > spec.B + 6) return;
    drag = { svg: svg, ax: pt.x, id: e.pointerId, moved: false };
    try { svg.setPointerCapture(e.pointerId); } catch (er) {}
  }
  function up(e) {
    if (!drag) return;
    var d = drag; drag = null;
    try { d.svg.releasePointerCapture(d.id); } catch (er) {}
    if (e.pointerType !== 'touch') { clear(); move(e); }
  }
  function tipEl() { if (!tip) { tip = document.createElement('div'); tip.setAttribute('role', 'tooltip'); tip.style.cssText = 'position:fixed;z-index:99999;pointer-events:none;display:none;background:var(--surface,#fff);color:var(--text,#222);border:1px solid var(--border,#d9d3c3);border-radius:8px;padding:8px 10px;font:12.5px/1.35 "Public Sans",system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.14);max-width:260px'; document.body.appendChild(tip); } return tip; }
  function specOf(svg) { var sp = cache.get(svg); var raw = svg.getAttribute('data-dh'); if (!sp || sp.raw !== raw) { try { sp = { raw: raw, v: JSON.parse(raw) }; } catch (e) { sp = { raw: raw, v: null }; } cache.set(svg, sp); } return sp.v; }
  function clear() { if (ov && ov.parentNode) ov.parentNode.removeChild(ov); ov = null; cur = null; if (tip) tip.style.display = 'none'; }
  function move(e) {
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
  document.addEventListener('pointerdown', function (e) { down(e); move(e); }, { passive: true });
  document.addEventListener('pointerup', up, { passive: true });
  // teclado: con el foco en el grafico, flechas/Inicio/Fin recorren los puntos y muestran el mismo tooltip que el raton
  var kbIdx = new WeakMap();
  document.addEventListener('keydown', function (e) {
    var svg = e.target && e.target.matches && e.target.matches('svg[data-dh]') ? e.target : null; if (!svg) return;
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].indexOf(e.key) < 0) return;
    if (e.key === 'Escape') { clear(); return; }
    var spec = specOf(svg); if (!spec || !spec.s.length) return; var pts = spec.s[0].p, i = kbIdx.has(svg) ? kbIdx.get(svg) : pts.length - 1;
    i = e.key === 'Home' ? 0 : e.key === 'End' ? pts.length - 1 : Math.max(0, Math.min(pts.length - 1, i + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 10 : 1)));
    kbIdx.set(svg, i); e.preventDefault();
    var m = svg.getScreenCTM(); if (!m) return; var pt = svg.createSVGPoint(); pt.x = pts[i][0]; pt.y = pts[i][1]; pt = pt.matrixTransform(m);
    move({ target: svg, clientX: pt.x, clientY: pt.y, pointerType: 'key' });
  });
  document.addEventListener('focusout', function (e) { if (e.target && e.target.matches && e.target.matches('svg[data-dh]')) clear(); });
  document.addEventListener('pointercancel', function () { drag = null; clear(); }, { passive: true });
  document.documentElement.addEventListener('mouseleave', clear);
  document.addEventListener('scroll', function () { if (cur) clear(); }, { passive: true, capture: true });
  document.addEventListener('pointerup', function (e) { if (e.pointerType === 'touch') setTimeout(clear, 1600); }, { passive: true });

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
  window.DehesaChart = { real: { load: realLoad, can: realCan, curOf: curOfUnit, deflate: realDeflate }, render: render, attr: attr, fmtDate: fmtDate, fmtDateFull: fmtDateFull, fmtMonth: fmtMonth, histTs: histTs, clear: clear };
})();
