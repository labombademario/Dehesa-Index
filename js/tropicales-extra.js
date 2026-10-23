/* Dehesa Index — complemento de la pestaña «Café, cacao y otros» de precios.html: posiciones de los fondos en los seis blandos de ICE Futures U.S. (CFTC,
   data/us-markets/cot.json) y euro frente al dólar (media mensual del BCE, data/fx-history.json). Son POSICIONES y un tipo de cambio, no precios de ICE.
   Solo lee ficheros ya publicados en data/. ES5, sin dependencias. */
(function (global) {
  'use strict';
  var IDS = ['sugar11', 'coffee_c', 'cocoa', 'cotton2', 'fcoj', 'canola'];
  var NAMES = {
    sugar11: { es: 'Azúcar n.º 11', en: 'Sugar No. 11', fr: 'Sucre n° 11', it: 'Zucchero n. 11' }, coffee_c: { es: 'Café C (arábica)', en: 'Coffee C (arabica)', fr: 'Café C (arabica)', it: 'Caffè C (arabica)' },
    cocoa: { es: 'Cacao', en: 'Cocoa', fr: 'Cacao', it: 'Cacao' }, cotton2: { es: 'Algodón n.º 2', en: 'Cotton No. 2', fr: 'Coton n° 2', it: 'Cotone n. 2' },
    fcoj: { es: 'Zumo de naranja concentrado', en: 'Frozen concentrated orange juice', fr: 'Jus d’orange concentré congelé', it: 'Succo d’arancia concentrato congelato' }, canola: { es: 'Canola', en: 'Canola', fr: 'Canola', it: 'Canola' }
  };
  var TX = {
    es: { h: 'Fondos y dólar', cot: 'Posiciones de los fondos en los futuros de ICE (CFTC)', sub: 'Gestores de dinero (managed money) en los futuros de ICE Futures U.S., a cierre del martes. Son posiciones, no precios: ICE no permite publicar sus cotizaciones sin licencia.', mkt: 'Mercado', net: 'Fondos netos', wk: 'Cambio semanal', oi: '% de contratos abiertos', ct: 'contratos', fx: 'Euro frente al dólar', fxSub: 'Media mensual del tipo de referencia del BCE (dólares por 1 euro).', now: 'Último mes', ya: 'Hace un año', chg: 'Variación', src: 'Fuentes', none: 'Sin datos de posiciones por ahora.' },
    en: { h: 'Funds and the dollar', cot: 'Fund positions in ICE futures (CFTC)', sub: 'Managed money in ICE Futures U.S. contracts, as of Tuesday close. These are positions, not prices: ICE does not allow its quotes to be published without a licence.', mkt: 'Market', net: 'Net funds', wk: 'Weekly change', oi: '% of open interest', ct: 'contracts', fx: 'Euro against the dollar', fxSub: 'Monthly average of the ECB reference rate (US dollars per 1 euro).', now: 'Latest month', ya: 'A year ago', chg: 'Change', src: 'Sources', none: 'No position data yet.' },
    fr: { h: 'Fonds et dollar', cot: 'Positions des fonds sur les contrats à terme ICE (CFTC)', sub: 'Gestionnaires de fonds (managed money) sur les contrats d’ICE Futures U.S., à la clôture du mardi. Ce sont des positions, pas des prix : ICE n’autorise pas la publication de ses cotations sans licence.', mkt: 'Marché', net: 'Fonds nets', wk: 'Variation hebdo', oi: '% des positions ouvertes', ct: 'contrats', fx: 'Euro face au dollar', fxSub: 'Moyenne mensuelle du taux de référence de la BCE (dollars pour 1 euro).', now: 'Dernier mois', ya: 'Il y a un an', chg: 'Variation', src: 'Sources', none: 'Pas encore de données de positions.' },
    it: { h: 'Fondi e dollaro', cot: 'Posizioni dei fondi sui future ICE (CFTC)', sub: 'Gestori di fondi (managed money) sui contratti di ICE Futures U.S., alla chiusura del martedì. Sono posizioni, non prezzi: ICE non consente di pubblicare le sue quotazioni senza licenza.', mkt: 'Mercato', net: 'Fondi netti', wk: 'Variazione settimanale', oi: '% dei contratti aperti', ct: 'contratti', fx: 'Euro contro dollaro', fxSub: 'Media mensile del tasso di riferimento della BCE (dollari per 1 euro).', now: 'Ultimo mese', ya: 'Un anno fa', chg: 'Variazione', src: 'Fonti', none: 'Ancora nessun dato sulle posizioni.' }
  };
  function lang() { var l = global.DehesaShared && global.DehesaShared.getLang ? global.DehesaShared.getLang() : 'es'; return TX[l] ? l : 'es'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d) { try { return new Intl.NumberFormat(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(v); } catch (e) { return Number(v).toFixed(d); } }
  function sgn(v, d) { return (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d); }
  function url(p) { return global.DehesaShared && global.DehesaShared.sitePath ? global.DehesaShared.sitePath(p) : p; }
  function get(p) { return fetch(url(p)).then(function (r) { if (!r.ok) throw new Error(p); return r.json(); }); }
  function table(head, rows) {
    return '<div style="overflow-x:auto"><table class="di-table" style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr>' + head.map(function (h, i) { return '<th scope="col" style="text-align:' + (i ? 'right' : 'left') + ';padding:6px 8px;border-bottom:1px solid var(--border);font-weight:600">' + esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td style="text-align:' + (i ? 'right' : 'left') + ';padding:6px 8px;border-bottom:1px solid var(--border)">' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function render(el) {
    if (!el) return;
    Promise.all([get('data/us-markets/cot.json').catch(function () { return null; }), get('data/fx-history.json').catch(function () { return null; })]).then(function (res) {
      var cot = res[0], fx = res[1], x = TX[lang()], html = '';
      if (cot && cot.markets) {
        var F = cot.fields, iL = F.indexOf('mmL') + 1, iS = F.indexOf('mmS') + 1, iO = F.indexOf('oi') + 1, last = '';
        var net = function (p) { return p && p[iL] != null && p[iS] != null ? p[iL] - p[iS] : null; };
        var rows = [];
        IDS.forEach(function (id) {
          var m = cot.markets.filter(function (q) { return q.id === id; })[0]; if (!m) return;
          var P = m.points, z = P[P.length - 1], y = P[P.length - 2], n = net(z), np = net(y); if (z[0] > last) last = z[0];
          rows.push([(NAMES[id] || {})[lang()] || m.label, n == null ? '—' : sgn(n, 0), n == null || np == null ? '—' : sgn(n - np, 0), n == null || !z[iO] ? '—' : sgn(100 * n / z[iO], 1) + ' %']);
        });
        if (rows.length) html += '<h3 style="margin:0 0 4px;font-size:16px">' + esc(x.cot) + '</h3><p class="di-movers-hint" style="margin:0 0 8px">' + esc(x.sub) + ' · ' + esc(last.slice(0, 10)) + ' · ' + esc(x.ct) + '</p>' + table([x.mkt, x.net, x.wk, x.oi], rows);
      }
      var u = fx && fx.currencies && fx.currencies.USD;
      if (u && u.length > 13) {
        var a = u[u.length - 1], b = u[u.length - 13], chg = 100 * (a[1] / b[1] - 1);
        html += '<h3 style="margin:16px 0 4px;font-size:16px">' + esc(x.fx) + '</h3><p class="di-movers-hint" style="margin:0 0 8px">' + esc(x.fxSub) + '</p>' + table(['', x.now, x.ya, x.chg], [['EUR/USD', nf(a[1], 4) + ' (' + a[0] + ')', nf(b[1], 4) + ' (' + b[0] + ')', sgn(chg, 1) + ' %']]);
      }
      if (!html) html = '<p class="di-movers-hint">' + esc(x.none) + '</p>';
      el.innerHTML = '<section class="di-card" style="margin-top:16px;padding:14px"><h2 style="margin:0 0 10px;font-size:18px">' + esc(x.h) + '</h2>' + html +
        '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(x.src) + ': <a href="https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm" rel="noopener">CFTC</a> · <a href="https://data.ecb.europa.eu/data/datasets/EXR" rel="noopener">' + (lang() === 'en' ? 'ECB' : 'BCE') + '</a></p></section>';
    });
  }
  global.DehesaSofts = { render: render };
})(window);
