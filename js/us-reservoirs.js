/* Dehesa Index — Embalses del oeste de EE. UU. (Bureau of Reclamation, RISE). Lee data/us-reservoirs.json y dibuja los puntos sobre vendor/us-states.js
   (proyeccion Albers de us-atlas: la misma formula que d3.geoAlbersUsa para los 48 estados). ES5. Datos provisionales de Reclamation. */
(function () {
  'use strict';
  var D = null, SEL = '';
  var T = {
    es: { h: 'Embalses del oeste de EE. UU.', sub: 'Agua almacenada en los embalses del Bureau of Reclamation, comparada con la misma fecha del año pasado y con la media 1990-2020 de ese día. Es la reserva de riego de los estados del oeste.', at: 'Dato al', reg: 'Región de Reclamation', all: 'Todas', full: 'Llenado', vsN: 'Frente a la media 1990-2020', ly: 'Hace un año', st: 'Almacenada / Capacidad (miles de acre-pies)', n: 'Embalses', total: 'Oeste de EE. UU. (todos)', hint: 'Cada punto es un embalse; el tamaño, su capacidad, y el color, lo lleno que está. Pasa el cursor o toca un punto. Pulsa una región en la tabla para resaltar sus embalses.', legend: 'Llenado', cap: 'capacidad', capT: { Total: 'total', Active: 'activa', Live: 'útil' }, ofN: 'de la media', mly: 'hace un año', note: 'Porcentaje = agua almacenada entre la capacidad que publica Reclamation para cada embalse (total, activa o útil, según el embalse; por eso alguno supera el 100 %). La media 1990-2020 de cada día la calcula Dehesa Index con la serie diaria de Reclamation. 1 acre-pie = 1.233 m³. Datos provisionales.', src: 'Fuente: Bureau of Reclamation (RISE), datos de dominio público; lista y ubicación de embalses: Western Water Data Hub.' },
    en: { h: 'Reservoirs in the western United States', sub: 'Water stored in Bureau of Reclamation reservoirs, compared with the same date last year and with the 1990-2020 average for that day. It is the irrigation reserve of the western states.', at: 'Data as of', reg: 'Reclamation region', all: 'All', full: 'Filled', vsN: 'Vs 1990-2020 average', ly: 'A year ago', st: 'Stored / Capacity (thousand acre-feet)', n: 'Reservoirs', total: 'Western US (all)', hint: 'Each dot is a reservoir; size shows its capacity and colour how full it is. Hover or tap a dot. Select a region in the table to highlight its reservoirs.', legend: 'Filled', cap: 'capacity', capT: { Total: 'total', Active: 'active', Live: 'live' }, ofN: 'of average', mly: 'a year ago', note: 'Percentage = stored water divided by the capacity Reclamation publishes for each reservoir (total, active or live, depending on the reservoir; that is why a few exceed 100 %). The 1990-2020 daily average is calculated by Dehesa Index from Reclamation’s daily series. 1 acre-foot = 1,233 m³. Provisional data.', src: 'Source: Bureau of Reclamation (RISE), public-domain data; reservoir list and locations: Western Water Data Hub.' },
    fr: { h: 'Retenues de l’ouest des États-Unis', sub: 'Eau stockée dans les retenues du Bureau of Reclamation, comparée à la même date l’an dernier et à la moyenne 1990-2020 de ce jour. C’est la réserve d’irrigation des États de l’ouest.', at: 'Donnée au', reg: 'Région de Reclamation', all: 'Toutes', full: 'Remplissage', vsN: 'Par rapport à la moyenne 1990-2020', ly: 'Il y a un an', st: 'Stockée / Capacité (milliers d’acre-pieds)', n: 'Retenues', total: 'Ouest des États-Unis (toutes)', hint: 'Chaque point est une retenue ; la taille indique sa capacité et la couleur son remplissage. Survolez ou touchez un point. Choisissez une région dans le tableau pour mettre ses retenues en évidence.', legend: 'Remplissage', cap: 'capacité', capT: { Total: 'totale', Active: 'active', Live: 'utile' }, ofN: 'de la moyenne', mly: 'il y a un an', note: 'Pourcentage = eau stockée divisée par la capacité publiée par Reclamation pour chaque retenue (totale, active ou utile selon la retenue ; d’où quelques valeurs au-dessus de 100 %). La moyenne 1990-2020 de chaque jour est calculée par Dehesa Index à partir de la série quotidienne de Reclamation. 1 acre-pied = 1 233 m³. Données provisoires.', src: 'Source : Bureau of Reclamation (RISE), données du domaine public ; liste et localisation des retenues : Western Water Data Hub.' },
    it: { h: 'Invasi degli Stati Uniti occidentali', sub: 'Acqua immagazzinata negli invasi del Bureau of Reclamation, confrontata con la stessa data dell’anno scorso e con la media 1990-2020 di quel giorno. È la riserva irrigua degli Stati dell’ovest.', at: 'Dato al', reg: 'Regione di Reclamation', all: 'Tutte', full: 'Riempimento', vsN: 'Rispetto alla media 1990-2020', ly: 'Un anno fa', st: 'Immagazzinata / Capacità (migliaia di acro-piedi)', n: 'Invasi', total: 'Ovest degli Stati Uniti (tutti)', hint: 'Ogni punto è un invaso; la dimensione indica la capacità e il colore quanto è pieno. Passa il cursore o tocca un punto. Scegli una regione nella tabella per evidenziarne gli invasi.', legend: 'Riempimento', cap: 'capacità', capT: { Total: 'totale', Active: 'attiva', Live: 'utile' }, ofN: 'della media', mly: 'un anno fa', note: 'Percentuale = acqua immagazzinata divisa per la capacità pubblicata da Reclamation per ogni invaso (totale, attiva o utile, secondo l’invaso; per questo alcuni superano il 100 %). La media 1990-2020 di ogni giorno è calcolata da Dehesa Index con la serie giornaliera di Reclamation. 1 acro-piede = 1.233 m³. Dati provvisori.', src: 'Fonte: Bureau of Reclamation (RISE), dati di pubblico dominio; elenco e posizione degli invasi: Western Water Data Hub.' }
  };
  var BINS = [20, 40, 60, 80], COLS = ['#e5eef6', '#b4d0e6', '#78aad2', '#3d7fb8', '#1b4f7d'];
  // d3.geoAlbersUsa (48 estados): conica equivalente de Albers, paralelos 29.5/45.5, rotate 96, center (-0.6, 38.7), escala 1300, translate (487.5, 305)
  var P0 = 29.5 * Math.PI / 180, P1 = 45.5 * Math.PI / 180, SY0 = Math.sin(P0), N = (SY0 + Math.sin(P1)) / 2, C = 1 + SY0 * (2 * N - SY0), R0 = Math.sqrt(C) / N, K = 1300;
  function raw(l, f) { var r = Math.sqrt(C - 2 * N * Math.sin(f)) / N; return [r * Math.sin(l * N), R0 - r * Math.cos(l * N)]; }
  var CEN = raw(-0.6 * Math.PI / 180, 38.7 * Math.PI / 180), DX = 487.5 - K * CEN[0], DY = 305 + K * CEN[1];
  function proj(lon, lat) { var p = raw((lon + 96) * Math.PI / 180, lat * Math.PI / 180); return [DX + K * p[0], DY - K * p[1]]; }
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d) { if (v == null || !isFinite(v)) return '—'; try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function sg(v) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1); }
  function day(iso) { var p = iso.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(lang(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function colorOf(p) { var i = 0; while (i < BINS.length && p >= BINS[i]) i++; return COLS[i]; }
  function agg(list) {
    var s = 0, c = 0, sy = 0, cy = 0, sn = 0, nn = 0;
    list.forEach(function (x) { s += x[6]; c += x[4]; if (x[8] != null) { sy += x[8] * x[4] / 100; cy += x[4]; } if (x[9]) { sn += x[6]; nn += x[6] * 100 / x[9]; } });
    var cn = 0; list.forEach(function (x) { if (x[9]) cn += x[4]; });
    // la comparacion solo se da si cubre al menos el 60 % de la capacidad del grupo (si no, mezclaria embalses distintos)
    return { s: s, c: c, p: c ? 100 * s / c : null, py: cy >= 0.6 * c ? 100 * sy / cy : null, pn: nn && cn >= 0.6 * c ? 100 * sn / nn : null, n: list.length };
  }
  function render() {
    var root = document.getElementById('ussq-emb'); if (!root || !D || !D.items) return;
    var t = T[lang()] || T.es, it = D.items, G = window.DEHESA_US_STATES;
    var regs = {}; it.forEach(function (x) { (regs[x[3]] = regs[x[3]] || []).push(x); });
    var keys = Object.keys(regs).sort(function (a, b) { return agg(regs[a]).p - agg(regs[b]).p; });
    var row = function (k, label, a, strong) {
      return '<tr style="' + (k === SEL ? 'background:rgba(29,81,120,.06)' : '') + '"><th scope="row"><button type="button" class="usemb-b" data-k="' + esc(k) + '" style="all:unset;cursor:pointer;font-weight:' + (strong ? 700 : 600) + '">' + esc(label) + '</button></th><td class="cof-n"><strong>' + nf(a.p, 1) + ' %</strong></td><td class="cof-n">' + (a.pn == null ? '—' : nf(a.pn, 0) + ' %') + '</td><td class="cof-n">' + (a.py == null ? '—' : nf(a.py, 1) + ' %') + '</td><td class="cof-n">' + nf(a.s / 1000, 0) + ' / ' + nf(a.c / 1000, 0) + '</td><td class="cof-n">' + a.n + '</td></tr>';
    };
    var tbl = '<div class="di-card" style="padding:6px 14px;overflow-x:auto"><table class="cof-tbl"><thead><tr><th scope="col">' + esc(t.reg) + '</th><th scope="col" class="cof-n">' + esc(t.full) + '</th><th scope="col" class="cof-n">' + esc(t.vsN) + '</th><th scope="col" class="cof-n">' + esc(t.ly) + '</th><th scope="col" class="cof-n">' + esc(t.st) + '</th><th scope="col" class="cof-n">' + esc(t.n) + '</th></tr></thead><tbody>' +
      row('', t.total, agg(it), true) + keys.map(function (k) { return row(k, k, agg(regs[k]), false); }).join('') + '</tbody></table></div>';
    var map = '';
    if (G) {
      var maxc = 0; it.forEach(function (x) { if (x[4] > maxc) maxc = x[4]; });
      var dots = it.filter(function (x) { return x[10] != null; }).slice().sort(function (a, b) { return b[4] - a[4]; }).map(function (x) {
        var q = proj(x[11], x[10]), r = Math.max(2.6, 13 * Math.sqrt(x[4] / maxc)), p = 100 * x[6] / x[4], dim = SEL && x[3] !== SEL;
        return '<circle class="usemb-dot" data-i="' + it.indexOf(x) + '" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + colorOf(p) + '" stroke="var(--surface,#fff)" stroke-width="1"' + (dim ? ' opacity=".15"' : '') + '/>';
      }).join('');
      var st = G.states.map(function (s) { return '<path d="' + s.d + '" fill="var(--surface-2,#f1eee6)" stroke="var(--border,#d9d3c4)" stroke-width="0.7"/>'; }).join('');
      var lg = COLS.map(function (c, i) { return '<span style="display:inline-flex;align-items:center;gap:5px;margin-right:12px"><i style="display:inline-block;width:11px;height:11px;border-radius:50%;background:' + c + ';border:1px solid var(--border)"></i>' + (i === 0 ? '< ' + BINS[0] : i === COLS.length - 1 ? '≥ ' + BINS[BINS.length - 1] : BINS[i - 1] + '–' + BINS[i]) + ' %</span>'; }).join(' ');
      map = '<div class="di-card usemb-map" style="padding:10px 12px;margin:0 0 14px;max-width:880px"><div class="cof-note usemb-tip" aria-live="polite" style="min-height:2.6em;margin:0 0 6px">' + esc(t.hint) + '</div><svg viewBox="0 60 640 470" role="img" aria-label="' + esc(t.h) + '" style="width:100%;height:auto;display:block">' + st + dots + '</svg><div class="cof-note" style="margin-top:6px"><strong>' + esc(t.legend) + ':</strong> ' + lg + '</div></div>';
    }
    root.innerHTML = '<h2 class="cof-h2">' + esc(t.h) + '</h2><p class="cof-sub">' + esc(t.sub) + ' ' + esc(t.at) + ' ' + esc(day(D.asOf)) + '.</p>' + map + tbl + '<p class="cof-note">' + esc(t.note) + '</p><p class="cof-note">' + esc(t.src) + '</p>';
    Array.prototype.forEach.call(root.querySelectorAll('.usemb-b'), function (b) { b.onclick = function () { SEL = b.getAttribute('data-k'); render(); }; });
    var box = root.querySelector('.usemb-map'); if (!box) return;
    var tip = box.querySelector('.usemb-tip'), svg = box.querySelector('svg'), last = null;
    function show(el) {
      if (last) last.setAttribute('stroke-width', '1'); last = el;
      if (!el) { tip.textContent = t.hint; return; }
      el.setAttribute('stroke-width', '2.5'); el.parentNode.appendChild(el);
      var x = it[+el.getAttribute('data-i')], p = 100 * x[6] / x[4];
      tip.innerHTML = '<strong>' + esc(x[0]) + '</strong> · ' + esc(x[2]) + ' · ' + esc(day(x[7])) + '<br><strong>' + nf(p, 1) + ' %</strong> (' + nf(x[6] / 1000, 0) + ' / ' + nf(x[4] / 1000, 0) + ' mil AF, ' + esc(t.cap) + ' ' + esc(t.capT[x[5]] || x[5]) + ')' + (x[9] != null ? ' · ' + nf(x[9], 0) + ' % ' + esc(t.ofN) : '') + (x[8] != null ? ' · ' + sg(p - x[8]) + ' pp ' + esc(t.mly) : '');
    }
    svg.addEventListener('mouseover', function (e) { if (e.target.classList && e.target.classList.contains('usemb-dot')) show(e.target); });
    svg.addEventListener('mouseleave', function () { show(null); });
    svg.addEventListener('click', function (e) {
      var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, px = vb.x + (e.clientX - r.left) / r.width * vb.width, py = vb.y + (e.clientY - r.top) / r.height * vb.height, best = null, bd = 1e9;
      Array.prototype.forEach.call(svg.querySelectorAll('.usemb-dot'), function (c) { if (c.getAttribute('opacity')) return; var dx = c.cx.baseVal.value - px, dy = c.cy.baseVal.value - py, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = c; } });
      show(bd < 300 ? best : null);
    });
  }
  function boot() {
    if (!document.getElementById('ussq-emb')) return;
    fetch('data/us-reservoirs.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (d) { D = d && d.items && d.items.length ? d : null; render(); });
    var prev = window.DehesaShared && window.DehesaShared.onLangChange;
    if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
