/* Dehesa Index — Nitrato en aguas subterráneas y balance de nitrógeno (Eurostat) en 17 países de la UE sin bloque propio de nitratos.
   data/eu-nitrates.json (scripts/update-eu-nitrates.py). Ficha de país. ES5. */
(function (global) {
  'use strict';
  var NM = {
    ES: ['España', 'Spain', 'Espagne', 'Spagna'], DE: ['Alemania', 'Germany', 'Allemagne', 'Germania'], IT: ['Italia', 'Italy', 'Italie', 'Italia'], PL: ['Polonia', 'Poland', 'Pologne', 'Polonia'], AT: ['Austria', 'Austria', 'Autriche', 'Austria'],
    BG: ['Bulgaria', 'Bulgaria', 'Bulgarie', 'Bulgaria'], CY: ['Chipre', 'Cyprus', 'Chypre', 'Cipro'], CZ: ['Chequia', 'Czechia', 'Tchéquie', 'Cechia'], DK: ['Dinamarca', 'Denmark', 'Danemark', 'Danimarca'], EE: ['Estonia', 'Estonia', 'Estonie', 'Estonia'],
    FI: ['Finlandia', 'Finland', 'Finlande', 'Finlandia'], LT: ['Lituania', 'Lithuania', 'Lituanie', 'Lituania'], LV: ['Letonia', 'Latvia', 'Lettonie', 'Lettonia'],
    RO: ['Rumanía', 'Romania', 'Roumanie', 'Romania'], SE: ['Suecia', 'Sweden', 'Suède', 'Svezia'], SI: ['Eslovenia', 'Slovenia', 'Slovénie', 'Slovenia'], SK: ['Eslovaquia', 'Slovakia', 'Slovaquie', 'Slovacchia']
  };
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  var T = {
    es: { h: "Nitratos en el agua de {n}", gw: "Nitrato en aguas subterráneas, media nacional", nb: "Balance de nitrógeno por hectárea agraria", nb2: "kg N/ha", lim: "Límite de la UE para el agua potable: 50 mg/l", cg: "Nitrato en aguas subterráneas (mg/l NO₃, media nacional)", cn: "Balance bruto de nitrógeno (kg N por hectárea agraria)", hover: "Pasa el cursor por la gráfica.",
      note: "Dos series nacionales de Eurostat: la media anual de nitrato en aguas subterráneas y el balance bruto de nitrógeno (aportes menos extracciones de los cultivos; un valor alto indica exceso que puede acabar en el agua). La media nacional no dice cómo está cada acuífero, y los años disponibles dependen de lo que comunica cada país.", src: "Fuente:", srcA: "Eurostat (sdg_06_40, aei_pr_gnb), CC BY 4.0" },
    en: { h: "Nitrates in the water of {n}", gw: "Nitrate in groundwater, national mean", nb: "Nitrogen balance per hectare of farmland", nb2: "kg N/ha", lim: "EU drinking-water limit: 50 mg/l", cg: "Nitrate in groundwater (mg/l NO₃, national mean)", cn: "Gross nitrogen balance (kg N per hectare of farmland)", hover: "Hover over the chart.",
      note: "Two national Eurostat series: the annual mean of nitrate in groundwater and the gross nitrogen balance (inputs minus crop uptake; a high value means a surplus that can end up in water). The national mean does not say how each aquifer is doing, and the years available depend on what each country reports.", src: "Source:", srcA: "Eurostat (sdg_06_40, aei_pr_gnb), CC BY 4.0" },
    fr: { h: "Nitrates dans l’eau : {n}", gw: "Nitrate dans les eaux souterraines, moyenne nationale", nb: "Bilan d’azote par hectare agricole", nb2: "kg N/ha", lim: "Limite de l’UE pour l’eau potable : 50 mg/l", cg: "Nitrate dans les eaux souterraines (mg/l NO₃, moyenne nationale)", cn: "Bilan brut d’azote (kg N par hectare agricole)", hover: "Survolez le graphique.",
      note: "Deux séries nationales d’Eurostat : la moyenne annuelle de nitrate dans les eaux souterraines et le bilan brut d’azote (apports moins prélèvements des cultures ; une valeur élevée indique un excédent pouvant finir dans l’eau). La moyenne nationale ne dit pas l’état de chaque nappe, et les années disponibles dépendent de ce que déclare chaque pays.", src: "Source :", srcA: "Eurostat (sdg_06_40, aei_pr_gnb), CC BY 4.0" },
    it: { h: "Nitrati nell’acqua: {n}", gw: "Nitrato nelle acque sotterranee, media nazionale", nb: "Bilancio dell’azoto per ettaro agricolo", nb2: "kg N/ha", lim: "Limite UE per l’acqua potabile: 50 mg/l", cg: "Nitrato nelle acque sotterranee (mg/l NO₃, media nazionale)", cn: "Bilancio lordo dell’azoto (kg N per ettaro agricolo)", hover: "Passa il cursore sul grafico.",
      note: "Due serie nazionali di Eurostat: la media annua di nitrato nelle acque sotterranee e il bilancio lordo dell’azoto (apporti meno asportazioni delle colture; un valore alto indica un eccesso che può finire nell’acqua). La media nazionale non dice come sta ogni falda, e gli anni disponibili dipendono da quanto comunica ciascun paese.", src: "Fonte:", srcA: "Eurostat (sdg_06_40, aei_pr_gnb), CC BY 4.0" }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, CL = { gw: 't', nb: 'r' };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, lg, d) { d = d == null ? 1 : d; return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  // Líneas por año de las medias de cada región, con la línea del límite de 50 mg/l. S = {region: [[año, media, p50, p90, n]]}
  function chart(S, keys, limit, cls, title, t, lg) {
    var W = 560, H = 220, L = 40, Rr = 8, Tp = 10, B = 24, y0 = 1e9, y1 = 0, hi = limit, i, k;
    keys.forEach(function (key) { S[key].forEach(function (r) { y0 = Math.min(y0, r[0]); y1 = Math.max(y1, r[0]); hi = Math.max(hi, r[1]); }); });
    hi = Math.ceil(hi / 20) * 20; if (y1 <= y0) return { html: '' };
    var X = function (y) { return L + (y - y0) / (y1 - y0) * (W - L - Rr); }, Y = function (v) { return Tp + (hi - v) / hi * (H - Tp - B); }, g = '', v;
    for (v = 0; v <= hi; v += 20) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + v + '</text>';
    for (i = Math.ceil(y0 / 5) * 5; i <= y1; i += 5) g += '<text class="wp-tick" x="' + X(i).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="' + (X(i) > W - 16 ? 'end' : 'middle') + '">' + i + '</text>';
    if (limit > 0) g += '<line class="nl-lim" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(limit).toFixed(1) + '" y2="' + Y(limit).toFixed(1) + '"/>';
    var paths = keys.map(function (key) { return '<path class="wp-line wp-line-' + CL[key] + '" d="' + S[key].map(function (r, j) { return (j ? 'L' : 'M') + X(r[0]).toFixed(1) + ' ' + Y(r[1]).toFixed(1); }).join('') + '"/>'; }).join('');
    return { S: S, keys: keys, X: X, W: W, cls: cls, y0: y0, y1: y1, html: '<div class="di-info-card-title gb-sub">' + esc(title) + '</div><div class="wp-chart ' + cls + '"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(title) + '">' + g + paths + '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg><div class="wp-legend">' + keys.map(function (key) { return '<span><i class="wp-sw wp-sw-' + CL[key] + '"></i>' + esc(t[key]) + '</span>'; }).join('') + '<span><i class="wp-sw bn-sw-g"></i>' + esc(t.lim) + '</span></div></div>' };
  }
  function bind(el, c, t, lg) {
    if (!c.S) return; var box = el.querySelector('.' + c.cls); if (!box) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross');
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, y = Math.round(c.y0 + (vx - 40) / (c.W - 48) * (c.y1 - c.y0));
      y = Math.max(c.y0, Math.min(c.y1, y)); var px = c.X(y); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + y + '</b>' + c.keys.map(function (key) { var q = c.S[key].filter(function (r) { return r[0] === y; })[0]; return q ? ' · ' + esc(t[key]) + ' <b>' + nf(q[1], lg) + '</b>' : ''; }).join('');
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  var CACHE = null;
  function mount(el, lg, cc) {
    if (!el || !NM[cc]) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/eu-nitrates.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return CACHE.then(function (d) {
      var k = d && d.countries && d.countries[cc];
      if (!k || !k.groundwater || k.groundwater.length < 3 || !k.nBalance || k.nBalance.length < 3) return false;
      var t = T[lg], nm = NM[cc][LI[lg]], GW = k.groundwater, NB = k.nBalance, g = GW[GW.length - 1], gp = GW[GW.length - 2], nb = NB[NB.length - 1], nbp = NB[NB.length - 2];
      var c1 = chart({ gw: GW }, ['gw'], d.limit || 50, 'eu-gch', t.cg, t, lg), c2 = chart({ nb: NB }, ['nb'], 0, 'eu-nch', t.cn, t, lg);
      el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-eu-nitrates" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h.replace('{n}', nm)) + '</h2><div class="di-info-stat-list" style="max-width:720px">' +
        row(t.gw + ' · ' + g[0], '<b>' + nf(g[1], lg) + ' mg/l</b>' + (gp ? ' · ' + gp[0] + ': ' + nf(gp[1], lg) : '')) + row(t.nb + ' · ' + nb[0], '<b>' + nf(nb[1], lg, 0) + ' ' + esc(t.nb2) + '</b>' + (nbp ? ' · ' + nbp[0] + ': ' + nf(nbp[1], lg, 0) : '')) + '</div>' +
        '<p class="di-field-hint" style="margin:6px 0 0">' + esc(t.lim) + '</p>' + c1.html + c2.html + '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcA) + '</a></p></section>';
      bind(el, c1, t, lg); bind(el, c2, t, lg);
      return true;
    });
  }
  global.DIEuNitrates = { mount: mount };
})(window);
