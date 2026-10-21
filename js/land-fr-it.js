/* Dehesa Index — Precio de la tierra agrícola en Francia (por departamento, Agreste/FNSafer) y valor de la tierra en Italia (por región, CREA).
   data/france-land/land.json y data/italy-land/land.json (scripts/update-land-fr-it.py). Se monta en la ficha del país (paises.js): DILandFrIt.mount(el, lang, 'FR' | 'IT').
   El mapa de departamentos/regiones y la leyenda vienen de js/fr-dept-map.js (vendor/fr-departements.js, vendor/it-regions.js, cargados a petición). Si el fichero no existe
   (p. ej. Italia mientras su licencia esté pendiente) el bloque no se dibuja. ES5. */
(function (global) {
  'use strict';
  var S = global.DehesaShared;
  var T = {
    es: {
      hFR: 'Precio de la tierra agrícola en Francia', hIT: 'Valor de la tierra agrícola en Italia', badge: 'DATOS OFICIALES REALES',
      meas: 'Tipo de tierra', free: 'Tierras y prados vendidos libres (€/ha)', rent: 'Tierras y prados vendidos con arrendatario (€/ha)', year: 'Año', unitHa: '€/ha',
      medRow: 'Mediana de los departamentos', natRow: 'Italia, media nacional', vsPrev: 'Frente al año anterior', vsOld: 'Frente a {y}', hi: 'Más cara', lo: 'Más barata', nDep: 'Departamentos con dato',
      mapFR: 'Por departamento', mapIT: 'Por región', all: 'Ver todas las zonas', reg: 'Zona', val: 'Valor', chg: 'Variación anual', evo: 'Evolución', evoIn: 'Evolución en',
      hover: 'Pasa el cursor o toca el gráfico para ver cada año.', hoverMap: 'Pasa el cursor o toca una zona para ver su valor.', noData: 'Sin dato publicado',
      median: 'Mediana de los departamentos', italy: 'Italia (total)', macroLbl: 'Zonas de Italia', macro: { NO: 'Noroeste', NE: 'Nordeste', CE: 'Centro', SU: 'Sur', IS: 'Islas' },
      noteFR: 'Precio medio trienal de las tierras y prados de más de 70 áreas, en euros por hectárea, que publican el SSP (ministerio de Agricultura) y la FNSafer a partir de las notificaciones de venta que los notarios envían a las Safer. Es el precio de proyectos de venta, no de escrituras. Se muestra la última edición con tablas por departamento (2023, años 2021-2023); la edición de 2024 solo publica la metodología. Los departamentos en gris no tienen dato fiable. No incluye viñedos.',
      noteIT: 'Valor medio de la hectárea de superficie agraria por región, estimado cada año por la red del CREA con testigos cualificados (intermediarios, técnicos, organizaciones agrarias): no es un registro de compraventas. Euros corrientes (euro-liras hasta 2000). Serie 1960-2023 con el método anterior: el CREA revisó en 2024 las superficies y las regiones agrarias y sus valores de 2024 no son comparables con esta serie.',
      src: 'Fuente:', srcFR: 'Agreste (SSP) con la FNSafer, «Valeur vénale des terres»', srcIT: 'CREA, Indagine sul mercato fondiario in Italia', cite: 'Medianas, variaciones, máximos y mínimos: cálculo de Dehesa Index.',
      mkFR: 'Precio medio trienal de las tierras y prados agrícolas, libres y arrendados, por departamento', mkIT: 'Valor medio de la tierra agrícola por región y total de Italia, desde 1960',
      ty: 'Precio o valor medio (€/ha)', obFR: 'Un dato por departamento, año y tipo de tierra (media de tres años); los departamentos sin dato fiable quedan en blanco', obIT: 'Un dato por región y año, desde 1960',
      meFR: 'Dehesa Index lee los PDF de «Valeur vénale des terres» que publica Agreste, comprueba que cada departamento es reconocido y que la variación impresa cuadra con los precios, y conserva los años anteriores.',
      meIT: 'Dehesa Index lee el libro Excel de la serie histórica del CREA, pasa todas las regiones a euros por hectárea (el libro cambia de unidades en 2000) y comprueba que no hay saltos absurdos ni huecos.'
    },
    en: {
      hFR: 'Farmland prices in France', hIT: 'Farmland values in Italy', badge: 'REAL OFFICIAL DATA',
      meas: 'Land type', free: 'Cropland and grassland sold vacant (€/ha)', rent: 'Cropland and grassland sold with a tenant (€/ha)', year: 'Year', unitHa: '€/ha',
      medRow: 'Median of departments', natRow: 'Italy, national average', vsPrev: 'Versus previous year', vsOld: 'Versus {y}', hi: 'Most expensive', lo: 'Cheapest', nDep: 'Departments with data',
      mapFR: 'By department', mapIT: 'By region', all: 'Show all areas', reg: 'Area', val: 'Value', chg: 'Annual change', evo: 'Trend', evoIn: 'Trend in',
      hover: 'Hover or tap the chart to read each year.', hoverMap: 'Hover or tap an area to read its value.', noData: 'No published figure',
      median: 'Median of departments', italy: 'Italy (total)', macroLbl: 'Italian macro-areas', macro: { NO: 'North-West', NE: 'North-East', CE: 'Centre', SU: 'South', IS: 'Islands' },
      noteFR: 'Three-year average price of cropland and grassland over 70 ares, in euros per hectare, published by the SSP (Ministry of Agriculture) and the FNSafer from the sale notifications that notaries send to the Safer. These are prices of planned sales, not of final deeds. This is the latest edition with tables by department (2023, covering 2021-2023); the 2024 edition only publishes the methodology. Grey departments have no reliable figure. Vineyards are not included.',
      noteIT: 'Average value per hectare of farmland by region, estimated every year by the CREA network from qualified witnesses (brokers, technicians, farm organisations): not a register of sales. Current euros (euro-lire until 2000). The 1960-2023 series uses the previous method: in 2024 the CREA revised surface areas and agrarian regions and its 2024 values are not comparable with this series.',
      src: 'Source:', srcFR: 'Agreste (SSP) with the FNSafer, “Valeur vénale des terres”', srcIT: 'CREA, Indagine sul mercato fondiario in Italia', cite: 'Medians, changes, highs and lows: calculated by Dehesa Index.',
      mkFR: 'Three-year average price of agricultural land, free and rented, by department', mkIT: 'Average value of agricultural land by region and for Italy as a whole, since 1960',
      ty: 'Average price or value (€/ha)', obFR: 'One figure per department, year and land type (three-year average); departments without a reliable figure are left blank', obIT: 'One figure per region and year, since 1960',
      meFR: 'Dehesa Index reads the “Valeur vénale des terres” PDFs published by Agreste, checks that every department is recognised and that the printed change matches the prices, and keeps earlier years.',
      meIT: 'Dehesa Index reads the CREA historical-series workbook, converts every region to euros per hectare (the workbook changes units in 2000) and checks for absurd jumps and gaps.'
    },
    fr: {
      hFR: 'Prix des terres agricoles en France', hIT: 'Valeur des terres agricoles en Italie', badge: 'DONNÉES OFFICIELLES RÉELLES',
      meas: 'Type de terre', free: 'Terres et prés vendus libres (€/ha)', rent: 'Terres et prés vendus loués (€/ha)', year: 'Année', unitHa: '€/ha',
      medRow: 'Médiane des départements', natRow: 'Italie, moyenne nationale', vsPrev: 'Par rapport à l’année précédente', vsOld: 'Par rapport à {y}', hi: 'Plus chère', lo: 'Moins chère', nDep: 'Départements avec donnée',
      mapFR: 'Par département', mapIT: 'Par région', all: 'Voir toutes les zones', reg: 'Zone', val: 'Valeur', chg: 'Variation annuelle', evo: 'Évolution', evoIn: 'Évolution en',
      hover: 'Survolez ou touchez le graphique pour lire chaque année.', hoverMap: 'Survolez ou touchez une zone pour lire sa valeur.', noData: 'Pas de donnée publiée',
      median: 'Médiane des départements', italy: 'Italie (total)', macroLbl: 'Zones de l’Italie', macro: { NO: 'Nord-Ouest', NE: 'Nord-Est', CE: 'Centre', SU: 'Sud', IS: 'Îles' },
      noteFR: 'Prix moyen triennal des terres et prés de plus de 70 ares, en euros par hectare, publié par le SSP (ministère de l’Agriculture) et la FNSafer à partir des notifications de vente que les notaires adressent aux Safer. Ce sont des prix de projets de vente, pas d’actes définitifs. C’est la dernière édition avec tableaux par département (2023, années 2021-2023) ; l’édition 2024 ne publie que la méthodologie. Les départements en gris n’ont pas de donnée fiable. Les vignes ne sont pas incluses.',
      noteIT: 'Valeur moyenne de l’hectare de surface agricole par région, estimée chaque année par le réseau du CREA auprès de témoins qualifiés (intermédiaires, techniciens, organisations agricoles) : ce n’est pas un registre de ventes. Euros courants (euro-lires jusqu’en 2000). Série 1960-2023 selon l’ancienne méthode : en 2024 le CREA a révisé les surfaces et les régions agraires et ses valeurs 2024 ne sont pas comparables à cette série.',
      src: 'Source :', srcFR: 'Agreste (SSP) avec la FNSafer, « Valeur vénale des terres »', srcIT: 'CREA, Indagine sul mercato fondiario in Italia', cite: 'Médianes, variations, maximums et minimums : calcul de Dehesa Index.',
      mkFR: 'Prix moyen triennal des terres et prés agricoles, libres et loués, par département', mkIT: 'Valeur moyenne des terres agricoles par région et pour l’ensemble de l’Italie, depuis 1960',
      ty: 'Prix ou valeur moyens (€/ha)', obFR: 'Une donnée par département, année et type de terre (moyenne sur trois ans) ; les départements sans donnée fiable restent vides', obIT: 'Une donnée par région et par année, depuis 1960',
      meFR: 'Dehesa Index lit les PDF « Valeur vénale des terres » publiés par Agreste, vérifie que chaque département est reconnu et que la variation imprimée correspond aux prix, et conserve les années précédentes.',
      meIT: 'Dehesa Index lit le classeur de la série historique du CREA, convertit toutes les régions en euros par hectare (le classeur change d’unité en 2000) et vérifie l’absence de sauts absurdes et de trous.'
    },
    it: {
      hFR: 'Prezzi dei terreni agricoli in Francia', hIT: 'Valori dei terreni agricoli in Italia', badge: 'DATI UFFICIALI REALI',
      meas: 'Tipo di terreno', free: 'Terreni e prati venduti liberi (€/ha)', rent: 'Terreni e prati venduti con affittuario (€/ha)', year: 'Anno', unitHa: '€/ha',
      medRow: 'Mediana dei dipartimenti', natRow: 'Italia, media nazionale', vsPrev: 'Rispetto all’anno precedente', vsOld: 'Rispetto al {y}', hi: 'Più caro', lo: 'Più economico', nDep: 'Dipartimenti con dato',
      mapFR: 'Per dipartimento', mapIT: 'Per regione', all: 'Mostra tutte le zone', reg: 'Zona', val: 'Valore', chg: 'Variazione annua', evo: 'Andamento', evoIn: 'Andamento in',
      hover: 'Passa il cursore o tocca il grafico per leggere ogni anno.', hoverMap: 'Passa il cursore o tocca una zona per leggerne il valore.', noData: 'Nessun dato pubblicato',
      median: 'Mediana dei dipartimenti', italy: 'Italia (totale)', macroLbl: 'Ripartizioni dell’Italia', macro: { NO: 'Nord-Ovest', NE: 'Nord-Est', CE: 'Centro', SU: 'Sud', IS: 'Isole' },
      noteFR: 'Prezzo medio triennale di terreni e prati di oltre 70 are, in euro per ettaro, pubblicato dall’SSP (ministero dell’Agricoltura) e dalla FNSafer sulla base delle notifiche di vendita che i notai inviano alle Safer. Sono prezzi di progetti di vendita, non di atti definitivi. È l’ultima edizione con tabelle per dipartimento (2023, anni 2021-2023); l’edizione 2024 pubblica solo la metodologia. I dipartimenti in grigio non hanno un dato affidabile. I vigneti non sono inclusi.',
      noteIT: 'Valore medio per ettaro di superficie agricola per regione, stimato ogni anno dalla rete del CREA con testimoni qualificati (mediatori, tecnici, organizzazioni agricole): non è un registro di compravendite. Euro correnti (euro-lire fino al 2000). Serie 1960-2023 con il metodo precedente: nel 2024 il CREA ha rivisto superfici e regioni agrarie e i suoi valori 2024 non sono confrontabili con questa serie.',
      src: 'Fonte:', srcFR: 'Agreste (SSP) con la FNSafer, «Valeur vénale des terres»', srcIT: 'CREA, Indagine sul mercato fondiario in Italia', cite: 'Mediane, variazioni, massimi e minimi: calcolo di Dehesa Index.',
      mkFR: 'Prezzo medio triennale dei terreni e prati agricoli, liberi e affittati, per dipartimento', mkIT: 'Valore medio dei terreni agricoli per regione e per l’Italia nel suo insieme, dal 1960',
      ty: 'Prezzo o valore medio (€/ha)', obFR: 'Un dato per dipartimento, anno e tipo di terreno (media su tre anni); i dipartimenti senza dato affidabile restano vuoti', obIT: 'Un dato per regione e anno, dal 1960',
      meFR: 'Dehesa Index legge i PDF «Valeur vénale des terres» pubblicati da Agreste, verifica che ogni dipartimento sia riconosciuto e che la variazione stampata corrisponda ai prezzi, e conserva gli anni precedenti.',
      meIT: 'Dehesa Index legge la cartella Excel della serie storica del CREA, converte tutte le regioni in euro per ettaro (la cartella cambia unità nel 2000) e controlla che non ci siano salti assurdi né buchi.'
    }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, LX = { en: 0, es: 1, fr: 2, it: 3 };
  var ST = { FR: { m: 'free', year: null, reg: 'MED' }, IT: { year: null, reg: 'IT' } };
  var SCR = {}, CACHE = {};
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(v, lg) { return v == null ? '—' : Math.round(v).toLocaleString(LOC[lg], { maximumFractionDigits: 0, useGrouping: 'always' }); }
  function eur(v, lg) { return v == null ? '—' : fmt(v, lg) + ' €/ha'; }
  function pct(v, lg) { if (v == null || !isFinite(v)) return '—'; return (v > 0.05 ? '+' : v < -0.05 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function script(src, have) {
    if (have()) return Promise.resolve();
    return SCR[src] || (SCR[src] = new Promise(function (ok) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ok; document.head.appendChild(s); }));
  }
  function load(cc) {
    var f = cc === 'FR' ? 'data/france-land/land.json' : 'data/italy-land/land.json';
    return CACHE[cc] || (CACHE[cc] = fetch(f).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }));
  }
  function median(a) { var v = a.slice().sort(function (x, y) { return x - y; }), n = v.length; return n ? (n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2) : null; }
  function rname(cc, id, lg, map) {
    var N = global.DehesaRegionNames && global.DehesaRegionNames[cc], v = N && N[id];
    if (v) { var p = v.split('|'); return p[LX[lg]] || p[0]; }
    for (var i = 0; map && i < map.states.length; i++) if (map.states[i].id === id) return map.states[i].name;
    return id;
  }
  // series de una zona: [valor por año]
  function seriesOf(d, cc, id) {
    if (cc === 'FR') {
      if (id === 'MED') return d.years.map(function (y, i) { var a = []; for (var k in d[ST.FR.m]) if (d[ST.FR.m].hasOwnProperty(k) && d[ST.FR.m][k][i] != null) a.push(d[ST.FR.m][k][i]); return a.length >= 20 ? median(a) : null; });
      return d[ST.FR.m][id] || d.years.map(function () { return null; });
    }
    if (id === 'IT') return d.italy;
    return d.regions[id] || d.macro[id] || d.years.map(function () { return null; });
  }
  function chart(d, cc, lg, mapObj) {
    var t = T[lg], Y = d.years, s = seriesOf(d, cc, ST[cc].reg), pts = [], i;
    for (i = 0; i < Y.length; i++) if (s[i] != null) pts.push([Y[i], s[i]]);
    var opts, cur = ST[cc].reg;
    if (cc === 'FR') {
      opts = [['MED', t.median]]; var ids = Object.keys(d[ST.FR.m]).sort(function (a, b) { return zoneName(cc, a, lg, mapObj).localeCompare(zoneName(cc, b, lg, mapObj), LOC[lg]); });
      for (i = 0; i < ids.length; i++) opts.push([ids[i], zoneName(cc, ids[i], lg, mapObj)]);
    } else {
      opts = [['IT', t.italy]]; var rs = Object.keys(d.regions).sort(function (a, b) { return zoneName(cc, a, lg, mapObj).localeCompare(zoneName(cc, b, lg, mapObj), LOC[lg]); });
      for (i = 0; i < rs.length; i++) opts.push([rs[i], zoneName(cc, rs[i], lg, mapObj)]);
      var mc = Object.keys(d.macro); for (i = 0; i < mc.length; i++) opts.push([mc[i], t.macro[mc[i]]]);
    }
    var sel = '<label class="wp-sel"><span>' + esc(t.evoIn) + '</span><select class="di-compare-select ll-reg" data-chips aria-label="' + esc(t.evoIn) + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
    var head = '<div class="di-info-card-title gb-sub">' + esc(t.evo) + '</div><div class="wd-sels">' + sel + '</div>';
    if (pts.length < 2) return { html: head + '<div class="wp-hist">' + esc(t.noData) + '</div>' };
    var W = 560, H = 200, L = 56, R = 14, Tp = 16, B = 24, lo = 1e18, hi = 0;
    for (i = 0; i < pts.length; i++) { lo = Math.min(lo, pts[i][1]); hi = Math.max(hi, pts[i][1]); }
    var rg = (hi - lo) || hi * 0.2, raw = rg / 3, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / mag, stp = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * mag;
    lo = Math.max(0, Math.floor(lo / stp) * stp); hi = Math.ceil(hi / stp) * stp; if (hi - lo < stp) hi = lo + stp;
    var y0 = Y[0], y1 = Y[Y.length - 1];
    var X = function (y) { return L + (y - y0) / Math.max(1, y1 - y0) * (W - L - R); }, Yy = function (v) { return Tp + (hi - v) / (hi - lo) * (H - Tp - B); };
    var grid = '', gv;
    for (gv = lo; gv <= hi + 1e-9; gv += stp) grid += '<line class="wp-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Yy(gv).toFixed(1) + '" y2="' + Yy(gv).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Yy(gv) + 3).toFixed(1) + '" text-anchor="end">' + esc(fmt(gv, lg)) + '</text>';
    var tick = Y.length > 12 ? 10 : 1;
    for (i = 0; i < Y.length; i++) if (tick === 1 || Y[i] % tick === 0 || i === Y.length - 1) grid += '<text class="wp-tick" x="' + X(Y[i]).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + Y[i] + '</text>';
    var path = '', dots = '';
    for (i = 0; i < pts.length; i++) { path += (i ? 'L' : 'M') + X(pts[i][0]).toFixed(1) + ' ' + Yy(pts[i][1]).toFixed(1); if (pts.length <= 12 || i === pts.length - 1) dots += '<circle class="wp-dot wp-dot-t" cx="' + X(pts[i][0]).toFixed(1) + '" cy="' + Yy(pts[i][1]).toFixed(1) + '" r="3.5"/>'; }
    var nm = cc === 'FR' ? (cur === 'MED' ? t.median : zoneName(cc, cur, lg, mapObj)) : (cur === 'IT' ? t.italy : (t.macro[cur] || zoneName(cc, cur, lg, mapObj)));
    var html = head + '<div class="wp-chart gb-chart"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t.evo + ' · ' + nm) + '">' + grid +
      '<path class="wp-line wp-line-t" d="' + path + '"/>' + dots + '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg></div>';
    return { html: html, pts: pts, X: X, W: W, name: nm };
  }
  function zoneName(cc, id, lg, mapObj) { return cc === 'FR' ? rname('', id, lg, mapObj) : rname('IT', id, lg, mapObj); }
  function bindChart(root, c, lg) {
    var box = root.querySelector('.gb-chart'); if (!box || !c.pts) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross'), t = T[lg];
    var pin = -1, VSL = { es: ['frente a', 'desde'], en: ['vs', 'since'], fr: ['par rapport à', 'depuis'], it: ['rispetto al', 'dal'] }[lg] || ['vs', 'since'],
      HP = { es: 'Pulsa un punto para ver su evolución en %.', en: 'Click a point to see its % change.', fr: 'Cliquez sur un point pour voir sa variation en %.', it: 'Fai clic su un punto per vedere la variazione in %.' }[lg] || '';
    function near(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, best = 0, bd = 1e9;
      for (var j = 0; j < c.pts.length; j++) { var dd = Math.abs(c.X(c.pts[j][0]) - vx); if (dd < bd) { bd = dd; best = j; } }
      return best;
    }
    function chg(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(lg, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
    function show(j, pinned) {
      var x = c.pts[j], px = c.X(x[0]); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      var s = '<b>' + x[0] + '</b> · ' + esc(c.name) + ' <b>' + eur(x[1], lg) + '</b>';
      if (pinned) {
        var ps = [];
        if (j > 0 && c.pts[j - 1][1]) ps.push('<b>' + chg((x[1] / c.pts[j - 1][1] - 1) * 100) + '</b> ' + VSL[0] + ' ' + c.pts[j - 1][0]);
        if (j > 1 && c.pts[0][1]) ps.push('<b>' + chg((x[1] / c.pts[0][1] - 1) * 100) + '</b> ' + VSL[1] + ' ' + c.pts[0][0]);
        if (ps.length) s += '<br>' + ps.join(' · ');
      }
      ro.innerHTML = s;
      Array.prototype.forEach.call(svg.querySelectorAll('.wp-dot'), function (d, k) { d.setAttribute('r', pinned && k === j ? 6 : 3.5); });
    }
    svg.addEventListener('mousemove', function (ev) { if (pin < 0) show(near(ev), false); });
    svg.addEventListener('touchstart', function (ev) { if (pin < 0) show(near(ev), false); }, { passive: true });
    svg.addEventListener('touchmove', function (ev) { if (pin < 0) show(near(ev), false); }, { passive: true });
    svg.addEventListener('click', function (ev) { var j = near(ev); pin = pin === j ? -1 : j; show(j, pin >= 0); });
    svg.addEventListener('mouseleave', function () { if (pin < 0) { cr.style.display = 'none'; ro.textContent = t.hover + ' ' + HP; } });
    ro.textContent = t.hover + ' ' + HP;
  }
  function opts(arr, cur) { return arr.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function sel(label, cls, arr, cur) { return '<label class="wp-sel"><span>' + esc(label) + '</span><select class="di-compare-select ' + cls + '" data-chips aria-label="' + esc(label) + '">' + opts(arr, cur) + '</select></label>'; }
  function mount(el, lg, cc) {
    if (!el || (cc !== 'FR' && cc !== 'IT')) return Promise.resolve(false);
    lg = T[lg] ? lg : 'es';
    var mapVar = cc === 'FR' ? 'DEHESA_FR_DEPTS' : 'DEHESA_IT_REGIONS', mapSrc = cc === 'FR' ? 'vendor/fr-departements.js' : 'vendor/it-regions.js';
    return Promise.all([load(cc), script('js/fr-dept-map.js', function () { return !!global.DIFrDeptMap; }), script('js/region-names.js', function () { return !!global.DehesaRegionNames; })]).then(function (r) {
      var d = r[0], M = global.DIFrDeptMap; if (!d || !d.years || !M) { el.hidden = true; return false; }
      return M.load(mapVar, mapSrc).then(function (MAP) {
        var t = T[lg], Y = d.years, last = Y.length - 1, st = ST[cc];
        function draw(focus) {
          if (st.year == null || Y.indexOf(st.year) < 0) st.year = Y[last];
          var yi = Y.indexOf(st.year), vals = {}, prevVals = {}, id, list = [], i;
          if (cc === 'FR') { var D = d[st.m]; for (id in D) if (D.hasOwnProperty(id)) { vals[id] = D[id][yi]; prevVals[id] = yi > 0 ? D[id][yi - 1] : null; } }
          else { for (id in d.regions) if (d.regions.hasOwnProperty(id)) { vals[id] = d.regions[id][yi]; prevVals[id] = yi > 0 ? d.regions[id][yi - 1] : null; } }
          for (id in vals) if (vals.hasOwnProperty(id) && vals[id] != null) list.push([id, rname(cc === 'FR' ? '' : 'IT', id, lg, MAP), vals[id], prevVals[id]]);
          var have = list.map(function (c) { return c[2]; }), mx = null, mn = null;
          for (i = 0; i < list.length; i++) { if (!mx || list[i][2] > mx[2]) mx = list[i]; if (!mn || list[i][2] < mn[2]) mn = list[i]; }
          var head, stat;
          if (cc === 'FR') {
            var md = median(have), pm = yi > 0 ? (function () { var a = []; for (var k in prevVals) if (prevVals.hasOwnProperty(k) && prevVals[k] != null && vals[k] != null) a.push(prevVals[k]); return a.length ? median(a) : null; })() : null;
            var mdSame = yi > 0 ? (function () { var a = []; for (var k in prevVals) if (prevVals.hasOwnProperty(k) && prevVals[k] != null && vals[k] != null) a.push(vals[k]); return a.length ? median(a) : null; })() : null;
            stat = row(t.medRow + ' · ' + st.year, md != null ? '<b>' + eur(md, lg) + '</b>' : esc(t.noData)) + (pm && mdSame ? row(t.vsPrev, pct((mdSame / pm - 1) * 100, lg) + ' · ' + eur(pm, lg)) : '') +
              (mx && mn ? row(t.hi, esc(mx[1]) + ' · <b>' + eur(mx[2], lg) + '</b>') + row(t.lo, esc(mn[1]) + ' · <b>' + eur(mn[2], lg) + '</b>') : '') + row(t.nDep, String(list.length));
            head = sel(t.meas, 'll-m', [['free', t.free], ['rent', t.rent]], st.m) + sel(t.year, 'll-year', Y.slice().reverse().map(function (y) { return [y, String(y)]; }), st.year);
          } else {
            var nat = d.italy[yi], pv = yi > 0 ? d.italy[yi - 1] : null, o10 = yi >= 10 ? d.italy[yi - 10] : null;
            stat = row(t.natRow + ' · ' + st.year, nat != null ? '<b>' + eur(nat, lg) + '</b>' : esc(t.noData)) + (pv && nat ? row(t.vsPrev, pct((nat / pv - 1) * 100, lg) + ' · ' + eur(pv, lg)) : '') +
              (o10 && nat ? row(t.vsOld.replace('{y}', Y[yi - 10]), pct((nat / o10 - 1) * 100, lg) + ' · ' + eur(o10, lg)) : '') +
              (mx && mn ? row(t.hi, esc(mx[1]) + ' · <b>' + eur(mx[2], lg) + '</b>') + row(t.lo, esc(mn[1]) + ' · <b>' + eur(mn[2], lg) + '</b>') : '');
            head = sel(t.year, 'll-year', Y.slice().reverse().map(function (y) { return [y, String(y)]; }), st.year);
          }
          var mp = '', tip = '';
          if (MAP && list.length) {
            var m = M.html(MAP, { values: vals, fmt: function (v, short) { return short ? Math.round(v).toLocaleString(LOC[lg], { useGrouping: 'always' }) : eur(v, lg); }, label: (cc === 'FR' ? t.mapFR : t.mapIT) + ' · ' + st.year, none: t.noData });
            mp = '<div class="di-info-card-title gb-sub">' + esc((cc === 'FR' ? t.mapFR : t.mapIT) + ' · ' + st.year + (cc === 'FR' ? ' · ' + (st.m === 'free' ? t.free : t.rent) : '')) + '</div><div class="wp-readout ll-tip" aria-live="polite">' + esc(t.hoverMap) + '</div>' + m.html;
          }
          var rows = list.slice().sort(function (a, b) { return a[1].localeCompare(b[1], LOC[lg]); });
          var tbl = '<details class="gb-all"><summary>' + esc(t.all) + '</summary><div class="gb-tw"><table class="di-table"><thead><tr><th>' + esc(t.reg) + '</th><th>' + esc(t.val) + '</th><th>' + esc(t.chg) + '</th></tr></thead><tbody>' +
            rows.map(function (c) { return '<tr><td>' + esc(c[1]) + '</td><td>' + eur(c[2], lg) + '</td><td>' + (c[3] != null ? pct((c[2] / c[3] - 1) * 100, lg) : '—') + '</td></tr>'; }).join('') + '</tbody></table></div></details>';
          var c = chart(d, cc, lg, MAP);
          var nm = cc === 'FR' ? { src: t.srcFR, mk: t.mkFR, ob: t.obFR, me: t.meFR } : { src: t.srcIT, mk: t.mkIT, ob: t.obIT, me: t.meIT };
          var trust = global.DehesaDataTrust ? global.DehesaDataTrust.info({ src: nm.src, url: d.source.url, fq: 'annual', mk: nm.mk, ty: t.ty, ob: nm.ob, me: nm.me, st: 'official' }, lg) : '';
          el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-land-' + cc.toLowerCase() + '" style="max-width:none"><div class="di-badge di-badge-green di-info-badge">' + esc(t.badge) + '</div><h2 class="ps-rm-h">' + esc(cc === 'FR' ? t.hFR : t.hIT) + '</h2>' +
            '<div class="wd-sels">' + head + '</div><div class="di-info-stat-list" style="max-width:640px">' + stat + '</div>' + mp + tbl + c.html + trust +
            '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(cc === 'FR' ? t.noteFR : t.noteIT) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(nm.src) + '</a>. ' + esc(t.cite) + '</p></section>';
          el.hidden = false;
          if (MAP && list.length) M.bind(el, el.querySelector('.ll-tip'), t.hoverMap, function (zid) {
            var v = vals[zid], p = prevVals[zid], zn = rname(cc === 'FR' ? '' : 'IT', zid, lg, MAP);
            return '<b>' + esc(zn) + '</b> · ' + (v != null ? '<b>' + eur(v, lg) + '</b>' + (p != null ? ' · ' + esc(t.vsPrev) + ' ' + pct((v / p - 1) * 100, lg) : '') : esc(t.noData));
          });
          bindChart(el, c, lg);
          if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
        }
        draw();
        if (!el.getAttribute('data-ll')) {
          el.setAttribute('data-ll', '1');
          el.addEventListener('change', function (ev) {
            var cl = ' ' + (ev.target.className || '') + ' ', v = ev.target.value;
            if (cl.indexOf(' ll-m ') >= 0) { st.m = v; if (st.reg !== 'MED' && !d[v][st.reg]) st.reg = 'MED'; draw('.ll-m'); }
            else if (cl.indexOf(' ll-year ') >= 0) { st.year = parseInt(v, 10); draw('.ll-year'); }
            else if (cl.indexOf(' ll-reg ') >= 0) { st.reg = v; draw('.ll-reg'); }
          });
        }
        return true;
      });
    });
  }
  global.DILandFrIt = { mount: mount };
})(window);
