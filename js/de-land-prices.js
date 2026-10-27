/* Dehesa Index — Alemania: precio de compraventa de tierra agrícola por Regierungsbezirk (mapa de las 38 regiones NUTS 2 y tabla).
   data/de-land-prices.json (scripts/update-de-land-prices.py; Destatis GENESIS 61521-0020, dl-de/by-2-0). Mapa: vendor/de-nuts2.js con js/fr-dept-map.js.
   Bloque de la ficha de Alemania (paises.js deUp). ES5. window.DIDeLand */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Precio de la tierra agrícola por región', sub: 'Precio medio de las compraventas de tierra de cultivo y pastos de cada año, por Regierungsbezirk, tal como lo publica Destatis.', year: 'Año',
      map: 'Precio medio (€/ha) · {y}', hint: 'Pasa el cursor o toca una región para ver su detalle.', reg: 'Región', land: 'Land', price: '€/ha', chg: 'Frente al año anterior', area: 'Superficie vendida', sales: 'Compraventas',
      nat: 'Alemania', none: 'sin dato', few: 'Con pocas compraventas el precio medio puede variar mucho de un año a otro.', src: 'Fuente:', srcN: 'Destatis, GENESIS-Online, tabla 61521-0020', ha: 'ha', more: 'Ver las {n} regiones', less: 'Ver menos' },
    en: { h: 'Farmland price by region', sub: 'Average price of each year’s sales of cropland and grassland, by Regierungsbezirk, as published by Destatis.', year: 'Year',
      map: 'Average price (€/ha) · {y}', hint: 'Hover or tap a region to see its detail.', reg: 'Region', land: 'Land', price: '€/ha', chg: 'Versus previous year', area: 'Area sold', sales: 'Sales',
      nat: 'Germany', none: 'no data', few: 'Where there are few sales the average price can swing a lot from year to year.', src: 'Source:', srcN: 'Destatis, GENESIS-Online, table 61521-0020', ha: 'ha', more: 'Show all {n} regions', less: 'Show fewer' },
    fr: { h: 'Prix des terres agricoles par région', sub: 'Prix moyen des ventes de terres de culture et de prairies de chaque année, par Regierungsbezirk, tel que publié par Destatis.', year: 'Année',
      map: 'Prix moyen (€/ha) · {y}', hint: 'Survolez ou touchez une région pour voir le détail.', reg: 'Région', land: 'Land', price: '€/ha', chg: 'Par rapport à l’année précédente', area: 'Surface vendue', sales: 'Ventes',
      nat: 'Allemagne', none: 'sans donnée', few: 'Là où les ventes sont peu nombreuses, le prix moyen peut beaucoup varier d’une année à l’autre.', src: 'Source :', srcN: 'Destatis, GENESIS-Online, tableau 61521-0020', ha: 'ha', more: 'Voir les {n} régions', less: 'Voir moins' },
    it: { h: 'Prezzo dei terreni agricoli per regione', sub: 'Prezzo medio delle compravendite di seminativi e prati di ogni anno, per Regierungsbezirk, come lo pubblica Destatis.', year: 'Anno',
      map: 'Prezzo medio (€/ha) · {y}', hint: 'Passa il cursore o tocca una regione per vederne il dettaglio.', reg: 'Regione', land: 'Land', price: '€/ha', chg: 'Rispetto all’anno precedente', area: 'Superficie venduta', sales: 'Compravendite',
      nat: 'Germania', none: 'nessun dato', few: 'Dove le compravendite sono poche il prezzo medio può oscillare molto da un anno all’altro.', src: 'Fonte:', srcN: 'Destatis, GENESIS-Online, tabella 61521-0020', ha: 'ha', more: 'Mostra tutte le {n} regioni', less: 'Mostra meno' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, CACHE = null, ST = { y: null, all: false };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d, lg) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function row(u, y) { for (var i = 0; i < u.years.length; i++) if (u.years[i].year === y) return u.years[i]; return null; }
  function chg(u, y) { var a = row(u, y), b = row(u, String(+y - 1)); return a && b && a.priceEurHa && b.priceEurHa ? (a.priceEurHa / b.priceEurHa - 1) * 100 : null; }
  function pct(v, lg) { return v == null ? '—' : (v > 0 ? '+' : '') + nf(v, 1, lg) + ' %'; }
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es'; var t = T[lg], M = global.DIFrDeptMap;
    CACHE = CACHE || fetch('data/de-land-prices.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return Promise.all([CACHE, M ? M.load('DEHESA_DE_NUTS2', 'vendor/de-nuts2.js') : null]).then(function (a) {
      var D = a[0], MAP = a[1];
      if (!D || !D.units || !D.units.length) { el.innerHTML = ''; return false; }
      var years = {}; D.units.forEach(function (u) { u.years.forEach(function (r) { if (r.priceEurHa != null) years[r.year] = 1; }); });
      years = Object.keys(years).sort(); var y = ST.y && years.indexOf(ST.y) >= 0 ? ST.y : D.lastYear;
      var U = D.units.map(function (u) { return { u: u, r: row(u, y), c: chg(u, y) }; }).sort(function (p, q) { return ((q.r && q.r.priceEurHa) || -1) - ((p.r && p.r.priceEurHa) || -1); });
      var vals = {}; U.forEach(function (x) { vals[x.u.id] = x.r ? x.r.priceEurHa : null; });
      var nat = (D.totals || []).filter(function (x) { return x.name === 'Deutschland'; })[0], nr = nat ? row(nat, y) : null;
      var mp = MAP && M ? M.html(MAP, { values: vals, fmt: function (v) { return nf(v, 0, lg) + ' €/ha'; }, label: t.map.replace('{y}', y), none: t.none }) : null;
      var chips = years.slice(-6).map(function (yy) { return '<button type="button" class="esp-chip' + (yy === y ? ' on' : '') + '" data-dly="' + yy + '" aria-pressed="' + (yy === y) + '">' + yy + '</button>'; }).join('');
      var th = 'padding:6px;font-size:11px;font-weight:700;color:var(--text-faint);text-align:right', td = 'padding:6px;border-top:1px solid var(--border);text-align:right;font-variant-numeric:tabular-nums';
      var shown = ST.all ? U : U.slice(0, 12);
      var rows = shown.map(function (x) { var r = x.r || {}; return '<tr><td style="' + td + ';text-align:left">' + esc(x.u.name) + '</td><td style="' + td + ';text-align:left;color:var(--text-faint)">' + esc(x.u.land) + '</td><td style="' + td + '"><b>' + nf(r.priceEurHa, 0, lg) + '</b></td><td style="' + td + '">' + pct(x.c, lg) + '</td><td style="' + td + '">' + (r.areaHa != null ? nf(r.areaHa, 0, lg) + ' ' + t.ha : '—') + '</td><td style="' + td + '">' + nf(r.sales, 0, lg) + '</td></tr>'; }).join('');
      el.innerHTML = '<section class="di-card ps-rm gb-card" id="ps-de-land" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.sub) + '</p>' +
        '<div class="esp-tabs" role="group" aria-label="' + esc(t.year) + '" style="margin:0 0 10px">' + chips + '</div>' +
        (nr ? '<p style="margin:0 0 10px;font-size:14px">' + esc(t.nat) + ': <b>' + nf(nr.priceEurHa, 0, lg) + ' €/ha</b>' + (nat ? ' (' + pct(chg(nat, y), lg) + ')' : '') + '</p>' : '') +
        (mp ? '<h3 style="margin:4px 0 2px;font-size:14px">' + esc(t.map.replace('{y}', y)) + '</h3><p class="di-field-hint frc-tip" style="margin:0 0 6px;min-height:2.6em">' + esc(t.hint) + '</p><div style="max-width:520px">' + mp.html + '</div>' : '') +
        '<div style="overflow-x:auto;margin-top:12px"><table style="border-collapse:collapse;width:100%;min-width:560px;font-size:13.5px"><thead><tr><th scope="col" style="' + th + ';text-align:left">' + esc(t.reg) + '</th><th scope="col" style="' + th + ';text-align:left">' + esc(t.land) + '</th><th scope="col" style="' + th + '">' + esc(t.price) + '</th><th scope="col" style="' + th + '">' + esc(t.chg) + '</th><th scope="col" style="' + th + '">' + esc(t.area) + '</th><th scope="col" style="' + th + '">' + esc(t.sales) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        (U.length > 12 ? '<p style="margin:8px 0 0"><button type="button" class="esp-chip" data-dlall="1">' + esc(ST.all ? t.less : t.more.replace('{n}', U.length)) + '</button></p>' : '') +
        '<p class="di-movers-hint" style="margin:10px 0 0">' + esc((D.methodology && D.methodology[lg]) || t.few) + '</p>' +
        '<p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcN) + '</a> (Datenlizenz Deutschland – Namensnennung 2.0)</p></section>';
      if (mp) M.bind(el, el.querySelector('.frc-tip'), t.hint, function (id) {
        var x = U.filter(function (z) { return z.u.id === id; })[0]; if (!x) return esc(t.none); var r = x.r || {};
        return '<b>' + esc(x.u.name) + '</b> (' + esc(x.u.land) + '): ' + nf(r.priceEurHa, 0, lg) + ' €/ha · ' + esc(t.chg.toLowerCase()) + ' ' + pct(x.c, lg) + ' · ' + (r.areaHa != null ? nf(r.areaHa, 0, lg) + ' ' + t.ha : '—') + ', ' + nf(r.sales, 0, lg) + ' ' + esc(t.sales.toLowerCase());
      });
      Array.prototype.forEach.call(el.querySelectorAll('[data-dly]'), function (b) { b.onclick = function () { ST.y = b.getAttribute('data-dly'); mount(el, lg); }; });
      var all = el.querySelector('[data-dlall]'); if (all) all.onclick = function () { ST.all = !ST.all; mount(el, lg); };
      return true;
    });
  }
  global.DIDeLand = { mount: mount };
})(window);
