/* Dehesa Index — Detalle nacional de EE. UU. en la ficha de país (paises.html?c=US): sacrificio, existencias de grano, leche y huevos, tierra, renta agraria (ERS) y Censo 2022.
   Usa los mismos bloques que la ficha de estado (js/region-more.js) con el fichero nacional data/us-states/US.json (scripts/update-us-states.py). ES5. */
(function () {
  'use strict';
  var VS = { es: 'Variación', en: 'Change', fr: 'Variation', it: 'Variazione' };
  var HEAD = { es: ['Más datos de EE. UU.', 'Totales nacionales de USDA NASS y ERS. Cada estado tiene los suyos en su ficha (mapa de arriba).'], en: ['More U.S. data', 'National totals from USDA NASS and ERS. Each state has its own on its page (map above).'], fr: ['Plus de données des États-Unis', 'Totaux nationaux de l’USDA NASS et de l’ERS. Chaque État a les siens sur sa fiche (carte ci-dessus).'], it: ['Altri dati degli USA', 'Totali nazionali di USDA NASS ed ERS. Ogni Stato ha i suoi nella sua scheda (mappa in alto).'] };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return Number(v).toFixed(d); } }
  function pct(v) { return v == null || !isFinite(v) ? '' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1) + ' %'; }
  var CACHE = {};
  function get(u) { if (!CACHE[u]) CACHE[u] = fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }).catch(function () { return null; }); return CACHE[u]; }
  function card(title, sub, body, src) { return '<section class="di-card" style="padding:16px 18px;margin-top:14px"><h3 class="cof-h2" style="margin:0 0 4px;font-size:17px">' + esc(title) + '</h3>' + (sub ? '<p class="di-movers-hint" style="margin:0 0 10px">' + esc(sub) + '</p>' : '') + body + (src || '') + '</section>'; }
  function cite(id, period) { return window.DICite && window.DICite.html ? '<div class="pp-cites">' + window.DICite.html(id, period ? { period: period } : {}) + '</div>' : ''; }
  var TH = 'padding:8px 6px;', TD = 'padding:7px 6px;border-top:1px solid var(--border);';
  function table(heads, rows, min) { return '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:' + (min || 460) + 'px;font-size:13.5px"><tr style="font-size:11px;font-weight:700;color:var(--text-faint);text-align:left">' + heads.map(function (h, i) { return '<th style="' + TH + (i ? 'text-align:right' : '') + '">' + esc(h) + '</th>'; }).join('') + '</tr>' + rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td style="' + TD + (i ? 'text-align:right;font-variant-numeric:tabular-nums' : '') + '">' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>'; }
  function mon(p) { if (!/^\d{4}-\d{2}$/.test(String(p))) return String(p); var q = String(p).split('-'); try { return new Date(Date.UTC(+q[0], +q[1] - 1, 1)).toLocaleDateString(lang(), { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return String(p); } }
  var M = null;
  function mods() {
    if (M || !window.DehesaRegionMore) return M;
    var T = null;
    M = window.DehesaRegionMore({ get: get, card: card, cite: cite, table: table, nf: nf, esc: esc, pct: pct, dec: function (v) { return Math.abs(v) < 10 ? 2 : Math.abs(v) < 100 ? 1 : 0; }, day: function (s) { return s; }, lang: lang, plabel: mon,
      tt: function () { var x = M.T[lang()] || M.T.es; if (x.vs == null) x.vs = VS[lang()] || VS.es; return x; }, nameFr: function (r) { return r; }, yearWord: function () { return ''; } });
    return M;
  }
  /* Pliega cada tarjeta (section.di-card con h3 + subtítulo) en un <details> cerrado: se ve el título y una línea que explica qué es; el cuerpo se abre a demanda.
     No cambia ninguna cifra. El estado abierto/cerrado se recuerda por título para sobrevivir a los repintados (selectores del mercado). */
  var OPEN = {};
  function fold(root) {
    if (!root) return;
    Array.prototype.forEach.call(root.querySelectorAll('section.di-card'), function (c) {
      var h = c.firstElementChild; if (!h || h.tagName !== 'H3' || c.querySelector(':scope > details.di-fold')) return;
      var sub = h.nextElementSibling; if (sub && sub.tagName !== 'P') sub = null;
      var key = h.textContent.trim(), d = document.createElement('details'), sm = document.createElement('summary'), body = document.createElement('div');
      d.className = 'di-fold'; body.className = 'di-fold-body';
      sm.appendChild(h); if (sub) sm.appendChild(sub);
      while (c.firstChild) body.appendChild(c.firstChild);
      d.appendChild(sm); d.appendChild(body); c.appendChild(d);
      if (OPEN[key]) d.open = true;
      d.addEventListener('toggle', function () { OPEN[key] = d.open; });
    });
  }
  var ORDER = ['usslaughter', 'usstocks', 'usdairy', 'usland', 'usincome', 'uscensus'];
  function render(el) {
    var m = mods(); if (!el || !m || !m.us) return; var SEC = window.DehesaSector, h = HEAD[lang()] || HEAD.es;
    el.innerHTML = '<p class="di-movers-hint" role="status">…</p>';
    Promise.all(ORDER.map(function (k) { return m.us[k]({ c: 'US', r: 'US' }).catch(function () { return null; }); })).then(function (out) {
      var shown = [], folded = [];
      out.forEach(function (html, i) { if (!html) return; var sec = SEC ? SEC.ofModule(ORDER[i]) : 'common'; (SEC && !SEC.visible(sec) ? folded : shown).push(html); });
      el.innerHTML = (shown.length || folded.length ? '<section style="margin-top:18px"><p class="di-movers-hint" style="margin:0">' + esc(h[1]) + '</p>' + shown.join('') + (folded.length ? SEC.foldHtml(folded.length, folded.join('')) : '') + '</section>' : '') + '<div id="ps-usm"></div>';
      fold(el);
      market(document.getElementById('ps-usm'));
    });
  }
  /* mercado e insumos (CFTC, AgTransport, EIA): js/us-market.js, que se baja solo aquí */
  function market(box) {
    var go = function () { if (window.DehesaUsMarket) window.DehesaUsMarket.render(box, { sector: true }); };
    if (window.DehesaUsMarket) return go();
    var x = document.createElement('script'); x.src = 'js/us-market.js'; x.onload = go; x.onerror = function () {}; document.head.appendChild(x);
  }
  window.DehesaUsDepth = { render: render, fold: fold };
})();
