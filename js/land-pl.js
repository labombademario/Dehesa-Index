/* Dehesa Index — Precio de la tierra arable en Polonia por voivodía (GUS, Banco de Datos Locales, tema P1460).
   data/poland-land/land.json (scripts/update-land-pl.py). Se monta en la ficha de Polonia (paises.js): DILandPl.mount(el, lang).
   El mapa y su leyenda vienen de js/fr-dept-map.js (vendor/pl-voivodeships.js, cargados a petición). Si el fichero no existe el bloque no se dibuja. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: {
      h: 'Precio de la tierra arable en Polonia', badge: 'DATOS OFICIALES REALES', meas: 'Calidad de la tierra', year: 'Año',
      cls: { total: 'Tierra arable, total (zł/ha)', fertile: 'Tierra arable fértil (zł/ha)', medium: 'Tierra arable medianamente fértil (zł/ha)', barren: 'Tierra arable pobre (zł/ha)', meadow: 'Prados y pastos, total (zł/ha)', goodMeadow: 'Prados y pastos buenos (zł/ha)', badMeadow: 'Prados y pastos malos (zł/ha)' },
      natRow: 'Polonia, media nacional', vsPrev: 'Frente al año anterior', vsOld: 'Frente a {y}', hi: 'Más cara', lo: 'Más barata',
      map: 'Por voivodía', all: 'Ver todas las voivodías', reg: 'Voivodía', val: 'Precio', chg: 'Variación anual', evo: 'Evolución', evoIn: 'Evolución en', poland: 'Polonia (total)',
      hover: 'Pasa el cursor o toca el gráfico para ver cada año.', hoverMap: 'Pasa el cursor o toca una voivodía para ver su precio.', noData: 'Sin dato publicado',
      note: 'Precio medio por hectárea de la tierra arable en el tráfico privado (obrót prywatny), en zlotys corrientes, que publica la Oficina Central de Estadística (GUS) en su Banco de Datos Locales. GUS lo da en total y por calidad de la tierra (fértil, medianamente fértil, pobre); desde 2013 también los prados y pastos. Es un precio medio por voivodía, no el de una parcela. Las voivodías en gris no tienen dato publicado ese año.',
      src: 'Fuente:', srcN: 'GUS, Banco de Datos Locales: precios medios de la tierra arable (por 1 ha) en el tráfico privado', cite: 'Variaciones, máximos y mínimos: cálculo de Dehesa Index.',
      mk: 'Precio medio de la tierra arable por hectárea en el tráfico privado, por voivodía y calidad de la tierra, desde 1999', ty: 'Precio medio (zł/ha)',
      ob: 'Un dato por voivodía, año y calidad de la tierra; GUS deja huecos que aquí se muestran como «sin dato», nunca como cero',
      me: 'Dehesa Index lee la API del Banco de Datos Locales, publica solo el valor definitivo de cada año y comprueba que están las 16 voivodías, que no hay saltos absurdos y que el valor nacional cabe entre los regionales.'
    },
    en: {
      h: 'Arable land prices in Poland', badge: 'REAL OFFICIAL DATA', meas: 'Land quality', year: 'Year',
      cls: { total: 'Arable land, total (PLN/ha)', fertile: 'Fertile arable land (PLN/ha)', medium: 'Medium-fertile arable land (PLN/ha)', barren: 'Barren arable land (PLN/ha)', meadow: 'Meadows and pastures, total (PLN/ha)', goodMeadow: 'Good meadows and pastures (PLN/ha)', badMeadow: 'Poor meadows and pastures (PLN/ha)' },
      natRow: 'Poland, national average', vsPrev: 'Versus previous year', vsOld: 'Versus {y}', hi: 'Most expensive', lo: 'Cheapest',
      map: 'By voivodeship', all: 'Show all voivodeships', reg: 'Voivodeship', val: 'Price', chg: 'Annual change', evo: 'Trend', evoIn: 'Trend in', poland: 'Poland (total)',
      hover: 'Hover or tap the chart to read each year.', hoverMap: 'Hover or tap a voivodeship to read its price.', noData: 'No published figure',
      note: 'Average price per hectare of arable land in private turnover (obrót prywatny), in current zlotys, published by Statistics Poland (GUS) in its Local Data Bank. GUS gives it in total and by land quality (fertile, medium-fertile, barren); since 2013 also meadows and pastures. It is an average per voivodeship, not the price of a given plot. Voivodeships in grey have no published figure that year.',
      src: 'Source:', srcN: 'GUS, Local Data Bank: average prices of arable land (per 1 ha) in private turnover', cite: 'Changes, highs and lows: calculated by Dehesa Index.',
      mk: 'Average price of arable land per hectare in private turnover, by voivodeship and land quality, since 1999', ty: 'Average price (PLN/ha)',
      ob: 'One figure per voivodeship, year and land quality; GUS leaves gaps that are shown here as “no figure”, never as zero',
      me: 'Dehesa Index reads the Local Data Bank API, publishes only the final value of each year and checks that all 16 voivodeships are there, that there are no absurd jumps and that the national value sits between the regional ones.'
    },
    fr: {
      h: 'Prix des terres arables en Pologne', badge: 'DONNÉES OFFICIELLES RÉELLES', meas: 'Qualité de la terre', year: 'Année',
      cls: { total: 'Terres arables, total (zł/ha)', fertile: 'Terres arables fertiles (zł/ha)', medium: 'Terres arables moyennement fertiles (zł/ha)', barren: 'Terres arables pauvres (zł/ha)', meadow: 'Prairies et pâturages, total (zł/ha)', goodMeadow: 'Prairies et pâturages de bonne qualité (zł/ha)', badMeadow: 'Prairies et pâturages de mauvaise qualité (zł/ha)' },
      natRow: 'Pologne, moyenne nationale', vsPrev: 'Par rapport à l’année précédente', vsOld: 'Par rapport à {y}', hi: 'La plus chère', lo: 'La moins chère',
      map: 'Par voïvodie', all: 'Voir toutes les voïvodies', reg: 'Voïvodie', val: 'Prix', chg: 'Variation annuelle', evo: 'Évolution', evoIn: 'Évolution en', poland: 'Pologne (total)',
      hover: 'Survolez ou touchez le graphique pour lire chaque année.', hoverMap: 'Survolez ou touchez une voïvodie pour lire son prix.', noData: 'Pas de chiffre publié',
      note: 'Prix moyen à l’hectare des terres arables dans le commerce privé (obrót prywatny), en zlotys courants, publié par l’Office central de statistique (GUS) dans sa Banque de données locales. GUS le donne au total et par qualité de terre (fertile, moyennement fertile, pauvre) ; depuis 2013 aussi les prairies et pâturages. C’est une moyenne par voïvodie, pas le prix d’une parcelle. Les voïvodies en gris n’ont pas de chiffre publié cette année-là.',
      src: 'Source :', srcN: 'GUS, Banque de données locales : prix moyens des terres arables (par 1 ha) dans le commerce privé', cite: 'Variations, maxima et minima : calcul de Dehesa Index.',
      mk: 'Prix moyen des terres arables à l’hectare dans le commerce privé, par voïvodie et qualité de terre, depuis 1999', ty: 'Prix moyen (zł/ha)',
      ob: 'Un chiffre par voïvodie, année et qualité de terre ; GUS laisse des trous, affichés ici comme « pas de chiffre », jamais comme zéro',
      me: 'Dehesa Index lit l’API de la Banque de données locales, ne publie que la valeur définitive de chaque année et vérifie que les 16 voïvodies sont là, qu’il n’y a pas de sauts absurdes et que la valeur nationale tient entre les régionales.'
    },
    it: {
      h: 'Prezzi dei terreni arabili in Polonia', badge: 'DATI UFFICIALI REALI', meas: 'Qualità del terreno', year: 'Anno',
      cls: { total: 'Seminativi, totale (zł/ha)', fertile: 'Seminativi fertili (zł/ha)', medium: 'Seminativi mediamente fertili (zł/ha)', barren: 'Seminativi poveri (zł/ha)', meadow: 'Prati e pascoli, totale (zł/ha)', goodMeadow: 'Prati e pascoli buoni (zł/ha)', badMeadow: 'Prati e pascoli scadenti (zł/ha)' },
      natRow: 'Polonia, media nazionale', vsPrev: 'Rispetto all’anno precedente', vsOld: 'Rispetto al {y}', hi: 'Più caro', lo: 'Più economico',
      map: 'Per voivodato', all: 'Vedi tutti i voivodati', reg: 'Voivodato', val: 'Prezzo', chg: 'Variazione annua', evo: 'Andamento', evoIn: 'Andamento in', poland: 'Polonia (totale)',
      hover: 'Passa il cursore o tocca il grafico per vedere ogni anno.', hoverMap: 'Passa il cursore o tocca un voivodato per vederne il prezzo.', noData: 'Nessun dato pubblicato',
      note: 'Prezzo medio per ettaro dei seminativi nel commercio privato (obrót prywatny), in zloty correnti, pubblicato dall’Ufficio centrale di statistica (GUS) nella sua Banca dati locale. GUS lo fornisce in totale e per qualità del terreno (fertile, mediamente fertile, povero); dal 2013 anche prati e pascoli. È una media per voivodato, non il prezzo di un appezzamento. I voivodati in grigio non hanno un dato pubblicato quell’anno.',
      src: 'Fonte:', srcN: 'GUS, Banca dati locale: prezzi medi dei seminativi (per 1 ha) nel commercio privato', cite: 'Variazioni, massimi e minimi: calcolo di Dehesa Index.',
      mk: 'Prezzo medio dei seminativi per ettaro nel commercio privato, per voivodato e qualità del terreno, dal 1999', ty: 'Prezzo medio (zł/ha)',
      ob: 'Un dato per voivodato, anno e qualità del terreno; GUS lascia dei vuoti, mostrati qui come «nessun dato», mai come zero',
      me: 'Dehesa Index legge l’API della Banca dati locale, pubblica solo il valore definitivo di ogni anno e controlla che ci siano tutti i 16 voivodati, che non ci siano salti assurdi e che il valore nazionale stia tra quelli regionali.'
    }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, LX = { en: 0, es: 1, fr: 2, it: 3 };
  var ST = { c: 'total', year: null, reg: 'PL' }, SCR = {}, CACHE = null;
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(v, lg) { return v == null ? '—' : Math.round(v).toLocaleString(LOC[lg], { maximumFractionDigits: 0, useGrouping: 'always' }); }
  function pln(v, lg) { return v == null ? '—' : fmt(v, lg) + ' zł/ha'; }
  function pct(v, lg) { if (v == null || !isFinite(v)) return '—'; return (v > 0.05 ? '+' : v < -0.05 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function script(src, have) {
    if (have()) return Promise.resolve();
    return SCR[src] || (SCR[src] = new Promise(function (ok) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ok; document.head.appendChild(s); }));
  }
  function load() { return CACHE || (CACHE = fetch('data/poland-land/land.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  function rname(id, lg, map) {
    var N = global.DehesaRegionNames && global.DehesaRegionNames.PL, v = N && N[id];
    if (v) { var p = v.split('|'); return p[LX[lg]] || p[0]; }
    for (var i = 0; map && i < map.states.length; i++) if (map.states[i].id === id) return map.states[i].name;
    return id;
  }
  function chart(d, lg, MAP) {
    var t = T[lg], Y = d.years, s = d.classes[ST.c][ST.reg] || [], pts = [], i;
    for (i = 0; i < Y.length; i++) if (s[i] != null) pts.push([Y[i], s[i]]);
    var ids = Object.keys(d.classes[ST.c]).filter(function (k) { return k !== 'PL'; }).sort(function (a, b) { return rname(a, lg, MAP).localeCompare(rname(b, lg, MAP), LOC[lg]); });
    var opts = [['PL', t.poland]].concat(ids.map(function (k) { return [k, rname(k, lg, MAP)]; }));
    var sel = '<label class="wp-sel"><span>' + esc(t.evoIn) + '</span><select class="di-compare-select ll-reg" aria-label="' + esc(t.evoIn) + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === ST.reg ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
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
    for (i = 0; i < Y.length; i++) if (Y[i] % 5 === 0 || i === Y.length - 1) grid += '<text class="wp-tick" x="' + X(Y[i]).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + Y[i] + '</text>';
    var path = '', dots = '';
    for (i = 0; i < pts.length; i++) { path += (i ? 'L' : 'M') + X(pts[i][0]).toFixed(1) + ' ' + Yy(pts[i][1]).toFixed(1); if (i === pts.length - 1) dots += '<circle class="wp-dot wp-dot-t" cx="' + X(pts[i][0]).toFixed(1) + '" cy="' + Yy(pts[i][1]).toFixed(1) + '" r="3.5"/>'; }
    var nm = ST.reg === 'PL' ? t.poland : rname(ST.reg, lg, MAP);
    return { html: head + '<div class="wp-chart gb-chart"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t.evo + ' · ' + nm) + '">' + grid +
      '<path class="wp-line wp-line-t" d="' + path + '"/>' + dots + '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg></div>', pts: pts, X: X, W: W, name: nm };
  }
  function bindChart(root, c, lg) {
    var box = root.querySelector('.gb-chart'); if (!box || !c.pts) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross'), t = T[lg];
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, best = 0, bd = 1e9;
      for (var j = 0; j < c.pts.length; j++) { var dd = Math.abs(c.X(c.pts[j][0]) - vx); if (dd < bd) { bd = dd; best = j; } }
      var x = c.pts[best], px = c.X(x[0]); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + x[0] + '</b> · ' + esc(c.name) + ' <b>' + pln(x[1], lg) + '</b>';
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  function sel(label, cls, arr, cur) {
    return '<label class="wp-sel"><span>' + esc(label) + '</span><select class="di-compare-select ' + cls + '" aria-label="' + esc(label) + '">' + arr.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
  }
  function mount(el, lg) {
    if (!el) return Promise.resolve(false);
    lg = T[lg] ? lg : 'es';
    return Promise.all([load(), script('js/fr-dept-map.js', function () { return !!global.DIFrDeptMap; }), script('js/region-names.js', function () { return !!global.DehesaRegionNames; })]).then(function (r) {
      var d = r[0], M = global.DIFrDeptMap; if (!d || !d.years || !d.classes || !M) { el.hidden = true; return false; }
      return M.load('DEHESA_PL_VOIVODESHIPS', 'vendor/pl-voivodeships.js').then(function (MAP) {
        var t = T[lg], Y = d.years, last = Y.length - 1;
        function draw(focus) {
          if (ST.year == null || Y.indexOf(ST.year) < 0) ST.year = Y[last];
          var yi = Y.indexOf(ST.year), D = d.classes[ST.c], vals = {}, prevVals = {}, id, list = [], i;
          for (id in D) if (D.hasOwnProperty(id) && id !== 'PL') { vals[id] = D[id][yi]; prevVals[id] = yi > 0 ? D[id][yi - 1] : null; }
          for (id in vals) if (vals.hasOwnProperty(id) && vals[id] != null) list.push([id, rname(id, lg, MAP), vals[id], prevVals[id]]);
          var mx = null, mn = null;
          for (i = 0; i < list.length; i++) { if (!mx || list[i][2] > mx[2]) mx = list[i]; if (!mn || list[i][2] < mn[2]) mn = list[i]; }
          var nat = D.PL[yi], pv = yi > 0 ? D.PL[yi - 1] : null, o10 = yi >= 10 ? D.PL[yi - 10] : null;
          var stat = row(t.natRow + ' · ' + ST.year, nat != null ? '<b>' + pln(nat, lg) + '</b>' : esc(t.noData)) + (pv && nat ? row(t.vsPrev, pct((nat / pv - 1) * 100, lg) + ' · ' + pln(pv, lg)) : '') +
            (o10 && nat ? row(t.vsOld.replace('{y}', Y[yi - 10]), pct((nat / o10 - 1) * 100, lg) + ' · ' + pln(o10, lg)) : '') +
            (mx && mn ? row(t.hi, esc(mx[1]) + ' · <b>' + pln(mx[2], lg) + '</b>') + row(t.lo, esc(mn[1]) + ' · <b>' + pln(mn[2], lg) + '</b>') : '');
          var head = sel(t.meas, 'll-m', ['total', 'fertile', 'medium', 'barren', 'meadow', 'goodMeadow', 'badMeadow'].filter(function (k) { return d.classes[k]; }).map(function (k) { return [k, t.cls[k]]; }), ST.c) + sel(t.year, 'll-year', Y.slice().reverse().map(function (y) { return [y, String(y)]; }), ST.year);
          var mp = '';
          if (MAP && list.length) {
            var m = M.html(MAP, { values: vals, fmt: function (v, short) { return short ? Math.round(v).toLocaleString(LOC[lg], { useGrouping: 'always' }) : pln(v, lg); }, label: t.map + ' · ' + ST.year, none: t.noData });
            mp = '<div class="di-info-card-title gb-sub">' + esc(t.map + ' · ' + ST.year + ' · ' + t.cls[ST.c]) + '</div><div class="wp-readout ll-tip" aria-live="polite">' + esc(t.hoverMap) + '</div>' + m.html;
          }
          var rows = list.slice().sort(function (a, b) { return a[1].localeCompare(b[1], LOC[lg]); });
          var tbl = '<details class="gb-all"><summary>' + esc(t.all) + '</summary><div class="gb-tw"><table class="di-table"><thead><tr><th>' + esc(t.reg) + '</th><th>' + esc(t.val) + '</th><th>' + esc(t.chg) + '</th></tr></thead><tbody>' +
            rows.map(function (c) { return '<tr><td>' + esc(c[1]) + '</td><td>' + pln(c[2], lg) + '</td><td>' + (c[3] != null ? pct((c[2] / c[3] - 1) * 100, lg) : '—') + '</td></tr>'; }).join('') + '</tbody></table></div></details>';
          var c = chart(d, lg, MAP);
          var trust = global.DehesaDataTrust ? global.DehesaDataTrust.info({ src: t.srcN, url: d.source.url, fq: 'annual', mk: t.mk, ty: t.ty, ob: t.ob, me: t.me, st: 'official' }, lg) : '';
          el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-land-pl" style="max-width:none"><div class="di-badge di-badge-green di-info-badge">' + esc(t.badge) + '</div><h2 class="ps-rm-h">' + esc(t.h) + '</h2>' +
            '<div class="wd-sels">' + head + '</div><div class="di-info-stat-list" style="max-width:640px">' + stat + '</div>' + mp + tbl + c.html + trust +
            '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcN) + '</a>. ' + esc(t.cite) + '</p></section>';
          el.hidden = false;
          if (MAP && list.length) M.bind(el, el.querySelector('.ll-tip'), t.hoverMap, function (zid) {
            var v = vals[zid], p = prevVals[zid];
            return '<b>' + esc(rname(zid, lg, MAP)) + '</b> · ' + (v != null ? '<b>' + pln(v, lg) + '</b>' + (p != null ? ' · ' + esc(t.vsPrev) + ' ' + pct((v / p - 1) * 100, lg) : '') : esc(t.noData));
          });
          bindChart(el, c, lg);
          if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
        }
        draw();
        if (!el.getAttribute('data-ll')) {
          el.setAttribute('data-ll', '1');
          el.addEventListener('change', function (ev) {
            var cl = ' ' + (ev.target.className || '') + ' ', v = ev.target.value;
            if (cl.indexOf(' ll-m ') >= 0) { ST.c = v; draw('.ll-m'); }
            else if (cl.indexOf(' ll-year ') >= 0) { ST.year = parseInt(v, 10); draw('.ll-year'); }
            else if (cl.indexOf(' ll-reg ') >= 0) { ST.reg = v; draw('.ll-reg'); }
          });
        }
        return true;
      });
    });
  }
  global.DILandPl = { mount: mount };
})(window);
