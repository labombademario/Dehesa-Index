/* Dehesa Index — Sequía de un país dentro de su ficha (paises.html): solo ese país. ES5.
   Europa: Indicador Combinado de Sequía del Observatorio Europeo de la Sequía (data/eu-drought.json y data/eu-drought-regions/{cc}.json);
   España añade los embalses (data/spain-reservoirs.json); EE. UU.: U.S. Drought Monitor (data/drought.json); Canadá: Canadian Drought Monitor.
   La página completa sigue en sequia.html. Si un país no tiene datos de sequía, no se dibuja nada. */
(function (global) {
  'use strict';
  var EU_ALIAS = { UK: 'GB', EL: 'GR' };   // la ficha usa UK y EL; el fichero del EDO, GB y GR
  var COL = ['#e0b84a', '#e08a3a', '#b03a2e', '#6aa6c8', '#8ec3a7', '#a8b86a'];
  var T = {
    es: { h: 'Sequía en {c}', inD: 'Superficie en sequía agrícola', ly: 'Misma década del año pasado', dec: 'Década del {d}', cls: ['Vigilancia', 'Aviso', 'Alerta', 'Recuperación', 'Recup. temporal de humedad', 'Recup. temporal de vegetación'], hist: 'Superficie en sequía (vigilancia, aviso o alerta), década a década', reg: 'Por región', regC: 'Región', all: 'Ver el monitor de sequía completo', src: 'Fuente:', edo: 'Observatorio Europeo de la Sequía (JRC), Indicador Combinado de Sequía', note: 'Porcentaje de la superficie del país en vigilancia, aviso o alerta según el Indicador Combinado de Sequía. Se actualiza cada diez días.', emb: 'Embalses', embT: 'Agua embalsada en España', embAvg: 'Frente a la media de 10 años', lyW: 'Misma semana del año pasado', usT: 'EE. UU. continental en sequía (D1 o peor)', usW: 'Semana al {d}', caT: 'Superficie agrícola en sequía (D1 o peor) por provincia', caM: 'Mes de {d}', pp: 'pp', hover: 'Pasa el cursor o toca el gráfico para ver cada década.' },
    en: { h: 'Drought in {c}', inD: 'Area in agricultural drought', ly: 'Same dekad last year', dec: 'Dekad of {d}', cls: ['Watch', 'Warning', 'Alert', 'Recovery', 'Temporary soil-moisture recovery', 'Temporary vegetation recovery'], hist: 'Area in drought (watch, warning or alert), dekad by dekad', reg: 'By region', regC: 'Region', all: 'Open the full drought monitor', src: 'Source:', edo: 'European Drought Observatory (JRC), Combined Drought Indicator', note: 'Share of the country’s area under watch, warning or alert according to the Combined Drought Indicator. Updated every ten days.', emb: 'Reservoirs', embT: 'Water stored in Spain’s reservoirs', embAvg: 'Vs 10-year average', lyW: 'Same week last year', usT: 'Contiguous U.S. in drought (D1 or worse)', usW: 'Week of {d}', caT: 'Agricultural area in drought (D1 or worse) by province', caM: 'Month of {d}', pp: 'pp', hover: 'Hover or tap the chart to read each dekad.' },
    fr: { h: 'Sécheresse : {c}', inD: 'Surface en sécheresse agricole', ly: 'Même décade l’an dernier', dec: 'Décade du {d}', cls: ['Vigilance', 'Avertissement', 'Alerte', 'Rétablissement', 'Rétablissement temporaire de l’humidité', 'Rétablissement temporaire de la végétation'], hist: 'Surface en sécheresse (vigilance, avertissement ou alerte), décade par décade', reg: 'Par région', regC: 'Région', all: 'Ouvrir le moniteur de sécheresse complet', src: 'Source :', edo: 'Observatoire européen de la sécheresse (JRC), indicateur combiné de sécheresse', note: 'Part de la surface du pays en vigilance, avertissement ou alerte selon l’indicateur combiné de sécheresse. Mis à jour tous les dix jours.', emb: 'Retenues', embT: 'Eau stockée dans les retenues espagnoles', embAvg: 'Par rapport à la moyenne sur 10 ans', lyW: 'Même semaine l’an dernier', usT: 'États-Unis continentaux en sécheresse (D1 ou pire)', usW: 'Semaine du {d}', caT: 'Surface agricole en sécheresse (D1 ou pire) par province', caM: 'Mois de {d}', pp: 'pt', hover: 'Survolez ou touchez le graphique pour lire chaque décade.' },
    it: { h: 'Siccità in {c}', inD: 'Superficie in siccità agricola', ly: 'Stessa decade dell’anno scorso', dec: 'Decade del {d}', cls: ['Attenzione', 'Allerta', 'Allarme', 'Recupero', 'Recupero temporaneo dell’umidità', 'Recupero temporaneo della vegetazione'], hist: 'Superficie in siccità (attenzione, allerta o allarme), decade per decade', reg: 'Per regione', regC: 'Regione', all: 'Apri il monitor della siccità completo', src: 'Fonte:', edo: 'Osservatorio europeo sulla siccità (JRC), indicatore combinato di siccità', note: 'Quota della superficie del paese in attenzione, allerta o allarme secondo l’indicatore combinato di siccità. Aggiornato ogni dieci giorni.', emb: 'Invasi', embT: 'Acqua negli invasi della Spagna', embAvg: 'Rispetto alla media di 10 anni', lyW: 'Stessa settimana dell’anno scorso', usT: 'Stati Uniti continentali in siccità (D1 o peggio)', usW: 'Settimana del {d}', caT: 'Superficie agricola in siccità (D1 o peggio) per provincia', caM: 'Mese di {d}', pp: 'pp', hover: 'Passa il cursore o tocca il grafico per leggere ogni decade.' }
  };
  var CACHE = {};
  function get(u) { return CACHE[u] || (CACHE[u] = fetch(u).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d, lg) { if (v == null || !isFinite(v)) return '—'; try { return v.toLocaleString(lg, { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function sg(v, lg) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1, lg); }
  function day(iso, lg) { var p = String(iso).split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, +(p[2] || 1))).toLocaleDateString(lg, p[2] ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function inD(r) { return r ? r[0] + r[1] + r[2] : null; }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + l + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function bar(r, t) {
    var s = '', i; for (i = 0; i < r.length; i++) if (r[i] > 0) s += '<span title="' + esc(t.cls[i] + ': ' + r[i] + ' %') + '" style="display:inline-block;height:100%;width:' + r[i] + '%;background:' + COL[i] + '"></span>';
    return '<div style="display:flex;height:12px;border-radius:6px;overflow:hidden;background:var(--border);min-width:120px">' + s + '</div>';
  }
  function legend(t) { return '<div class="cof-note" style="display:flex;flex-wrap:wrap;gap:4px 14px;margin:6px 0">' + t.cls.map(function (c, i) { return '<span><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:' + COL[i] + ';margin-right:5px;vertical-align:-1px"></i>' + esc(c) + '</span>'; }).join('') + '</div>'; }
  function chart(vals, labels, lg, t) {
    var n = vals.length, W = 640, H = 170, L = 36, R = 10, Tp = 10, B = 22; if (n < 4) return '';
    var X = function (i) { return L + i * (W - L - R) / (n - 1); }, Y = function (v) { return Tp + (100 - v) * (H - Tp - B) / 100; };
    var g = [0, 25, 50, 75, 100].map(function (v) { return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="var(--border)"/><text x="' + (L - 5) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="11" fill="var(--text-faint)">' + v + '</text>'; }).join('');
    var xt = '', d = '', pen = false;
    labels.forEach(function (l, i) { if (l.slice(5) === '01-01') xt += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="11" fill="var(--text-faint)">' + l.slice(0, 4) + '</text>'; });
    vals.forEach(function (v, i) { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); pen = true; });
    return '<div class="cd-chart"><div class="cof-note cd-ro" aria-live="polite" style="margin:4px 0">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t.hist) + '" style="width:100%;height:auto;max-width:720px" data-n="' + n + '">' + g + xt + '<path d="' + d + '" fill="none" stroke="#b03a2e" stroke-width="2"/><line class="cd-x" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" stroke="var(--text-muted)" style="display:none"/></svg></div>';
  }
  function bindChart(el, vals, labels, lg, t) {
    var svg = el.querySelector('.cd-chart svg'); if (!svg) return; var ro = el.querySelector('.cd-ro'), cr = svg.querySelector('.cd-x'), n = vals.length;
    function at(ev) { var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * 640, i = Math.max(0, Math.min(n - 1, Math.round((vx - 36) / (594) * (n - 1)))), px = 36 + i * 594 / (n - 1);
      cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = ''; ro.innerHTML = '<b>' + esc(day(labels[i], lg)) + '</b> · ' + nf(vals[i], 1, lg) + ' %'; }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  /* Mapa de «sequía por región» (21-oct-2026, norma: todos los países con regiones llevan mapa). Las regiones del EDO son NUTS 2; los mapas del sitio
     usan sus propios códigos: XW traduce. Donde varias regiones NUTS 2 caen en una región del mapa (Länder alemanes, regiones francesas, Reino Unido,
     Mazovia, Trentino-Alto Adigio) se colorea la que está peor (máximo) y se dice. Tramos fijos (% de superficie en sequía): 0–5, 5–15, 15–30, 30–50, 50–100. */
  var MAPS = { AT: ['DEHESA_AT_LAENDER', 'vendor/at-laender.js'], BE: ['DEHESA_BE_PROVINCES', 'vendor/be-provinces.js'], BG: ['DEHESA_BG_REGIONS', 'vendor/bg-regions.js'], CH: ['DEHESA_CH_REGIONS', 'vendor/ch-regions.js'],
    CZ: ['DEHESA_CZ_REGIONS', 'vendor/cz-regions.js'], DE: ['DEHESA_DE_LAENDER', 'vendor/de-laender.js'], DK: ['DEHESA_DK_REGIONS', 'vendor/dk-regions.js'], EL: ['DEHESA_EL_REGIONS', 'vendor/el-regions.js'], ES: ['DEHESA_ES_CCAA', 'vendor/es-ccaa.js'],
    FI: ['DEHESA_FI_REGIONS', 'vendor/fi-regions.js'], FR: ['DEHESA_FR_REGIONS', 'vendor/fr-regions.js'], HR: ['DEHESA_HR_REGIONS', 'vendor/hr-regions.js'], HU: ['DEHESA_HU_REGIONS', 'vendor/hu-regions.js'], IE: ['DEHESA_IE_REGIONS', 'vendor/ie-regions.js'],
    IT: ['DEHESA_IT_REGIONS', 'vendor/it-regions.js'], LT: ['DEHESA_LT_REGIONS', 'vendor/lt-regions.js'], NL: ['DEHESA_NL_PROVINCES', 'vendor/nl-provinces.js'], PL: ['DEHESA_PL_VOIVODESHIPS', 'vendor/pl-voivodeships.js'], PT: ['DEHESA_PT_REGIONS', 'vendor/pt-regions.js'],
    RO: ['DEHESA_RO_REGIONS', 'vendor/ro-regions.js'], SE: ['DEHESA_SE_REGIONS', 'vendor/se-regions.js'], SI: ['DEHESA_SI_REGIONS', 'vendor/si-regions.js'], SK: ['DEHESA_SK_REGIONS', 'vendor/sk-regions.js'], UK: ['DEHESA_UK_REGIONS', 'vendor/uk-regions.js'] };
  function xw(s) { var o = {}; s.split(' ').forEach(function (p) { var a = p.split(':'); o[a[0]] = a[1]; }); return o; }
  var XW = {
    DK: xw('DK01:HOV DK02:SJA DK03:SYD DK04:MID DK05:NJY'), AT: xw('AT11:B AT12:NO AT13:W AT21:K AT22:ST AT31:OO AT32:S AT33:T AT34:V'),
    ES: xw('ES11:GA ES12:AS ES13:CB ES21:PV ES22:NC ES23:RI ES24:AR ES30:MD ES41:CL ES42:CM ES43:EX ES51:CT ES52:VC ES53:IB ES61:AN ES62:MC ES70:CN'),
    IT: xw('ITC1:PIE ITC2:VDA ITC3:LIG ITC4:LOM ITF1:ABR ITF2:MOL ITF3:CAM ITF4:PUG ITF5:BAS ITF6:CAL ITG1:SIC ITG2:SAR ITH1:TAA ITH2:TAA ITH3:VEN ITH4:FVG ITH5:EMR ITI1:TOS ITI2:UMB ITI3:MAR ITI4:LAZ'),
    NL: xw('NL11:GR NL12:FR NL13:DR NL21:OV NL22:GE NL23:FL NL31:UT NL32:NH NL33:ZH NL34:ZE NL41:NB NL42:LI'),
    BE: xw('BE10:BRU BE21:VAN BE22:VLI BE23:VOV BE24:VBR BE25:VWV BE31:WBR BE32:WHT BE33:WLG BE34:WLX BE35:WNA'),
    PL: xw('PL21:MA PL22:SL PL41:WP PL42:ZP PL43:LB PL51:DS PL52:OP PL61:KP PL62:WN PL63:PM PL71:LD PL72:SK PL81:LU PL82:PK PL84:PD PL91:MZ PL92:MZ'),
    DE: xw('DE1:BW DE2:BY DE3:BE DE4:BB DE5:HB DE6:HH DE7:HE DE8:MV DE9:NI DEA:NW DEB:RP DEC:SL DED:SN DEE:ST DEF:SH DEG:TH'),
    FR: xw('FR1:IDF FRB:CVL FRC:BFC FRD:NOR FRE:HDF FRF:GES FRG:PDL FRH:BRE FRI:NAQ FRJ:OCC FRK:ARA FRL:PAC FRM:COR') };
  var MT = { es: ['Mapa: superficie en sequía agrícola por región', 'Pasa el cursor o toca una región.', 'sin dato', 'Donde una región del mapa reúne varias regiones europeas (NUTS 2), se colorea la que está peor.'],
    en: ['Map: area in agricultural drought by region', 'Hover or tap a region.', 'no data', 'Where a map region groups several European (NUTS 2) regions, the worst one sets the colour.'],
    fr: ['Carte : surface en sécheresse agricole par région', 'Survolez ou touchez une région.', 'pas de donnée', 'Quand une région de la carte réunit plusieurs régions européennes (NUTS 2), la plus touchée donne la couleur.'],
    it: ['Mappa: superficie in siccità agricola per regione', 'Passa il cursore o tocca una regione.', 'nessun dato', 'Dove una regione della mappa riunisce più regioni europee (NUTS 2), il colore è quello della più colpita.'] };
  function droughtMap(box, cc, R, lg) {
    if ({ HR: 1, IE: 1, IT: 1, NL: 1, PT: 1 }[cc]) return;   // ya tienen mapa del mismo indicador con regiones mas finas (js/hr-, ie-, nl-, pt-drought.js)
    var mp = MAPS[cc]; if (!mp || !box) return;
    var go = function () {
      global.DIFrDeptMap.load(mp[0], mp[1]).then(function (M) {
        if (!M || !M.states) return;
        var ids = {}, byName = {}; M.states.forEach(function (s) { ids[s.id] = 1; byName[s.name] = s.id; });
        var X = XW[cc], vals = {}, parts = {}, grouped = false;
        Object.keys(R.regions).forEach(function (nuts) {
          var x = R.regions[nuts], l = x.v[x.v.length - 1]; if (!l) return;
          var id = ids[nuts] ? nuts : byName[nuts] ? byName[nuts] : X ? (X[nuts] || X[nuts.slice(0, 3)]) : cc === 'UK' && ids[nuts.slice(0, 3)] ? nuts.slice(0, 3) : null;
          if (!id || !ids[id]) return;
          var d = inD(l); (parts[id] = parts[id] || []).push(x.name + ' ' + nf(d, 1, lg) + ' %');
          if (vals[id] != null) grouped = true;
          vals[id] = vals[id] == null ? d : Math.max(vals[id], d);
        });
        if (Object.keys(vals).length < 2) return;
        var m = MT[lg] || MT.es, fmt = function (v) { return nf(v, v < 10 ? 1 : 0, lg) + ' %'; };
        var r = global.DIFrDeptMap.html(M, { values: vals, cuts: [5, 15, 30, 50], fmt: fmt, label: m[0], none: m[2], labels: ['0–5 %', '5–15 %', '15–30 %', '30–50 %', '50–100 %'] });
        box.innerHTML = '<h3 style="margin:14px 0 6px;font-size:15px">' + esc(m[0]) + '</h3><div class="cd-map" style="max-width:560px">' + r.html + '</div><p class="di-movers-hint cd-tip" style="margin:4px 0 0">' + esc(m[1]) + '</p>' + (grouped ? '<p class="di-movers-hint" style="margin:2px 0 0">' + esc(m[3]) + '</p>' : '');
        global.DIFrDeptMap.bind(box, box.querySelector('.cd-tip'), m[1], function (id) { return '<b>' + esc(r.names[id] || id) + '</b>: ' + (vals[id] == null ? esc(m[2]) : '<b>' + fmt(vals[id]) + '</b>' + (parts[id] && parts[id].length > 1 ? ' · ' + esc(parts[id].join(' · ')) : '')); });
      });
    };
    if (global.DIFrDeptMap) go(); else { var sc = document.createElement('script'); sc.src = 'js/fr-dept-map.js?v=20261015'; sc.onload = go; document.head.appendChild(sc); }
  }
  function europe(el, cc, name, lg, t) {
    var k = EU_ALIAS[cc] || cc;
    /* Solo se pide el fichero regional si el pais esta en el EDO: evita un 404 con paises de fuera de Europa (p. ej. UY). */
    return get('data/eu-drought.json').then(function (D0) {
      if (!D0 || !D0.countries || !D0.countries[k]) return [D0, null, null];
      return Promise.all([D0, get('data/eu-drought-regions/' + cc + '.json'), cc === 'ES' ? get('data/spain-reservoirs.json') : Promise.resolve(null)]);
    }).then(function (a) {
      var D = a[0], R = a[1], E = a[2], c = D && D.countries && D.countries[k]; if (!c || !c.v || !c.v.length) return false;
      var v = c.v, n = v.length, last = v[n - 1], prev = n > 36 ? v[n - 37] : null, labels = D.periods.slice(-n);
      var h = '<section class="di-card ps-rm" id="ps-drought"><h2 class="ps-rm-h">' + esc(t.h.replace('{c}', name)) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.note) + ' ' + esc(t.dec.replace('{d}', day(D.asOf, lg))) + '.</p>' +
        '<div class="di-info-stat-list" style="max-width:640px">' + row(esc(t.inD), '<b>' + nf(inD(last), 1, lg) + ' %</b>') + row(esc(t.ly), prev ? nf(inD(prev), 1, lg) + ' % (' + sg(inD(last) - inD(prev), lg) + ' ' + t.pp + ')' : '—') + '</div>' +
        '<div style="max-width:640px;margin:10px 0 0">' + bar(last, t) + '</div>' + legend(t) +
        chart(v.map(inD), labels, lg, t);
      if (R && R.regions && Object.keys(R.regions).length > 1) {
        var rs = Object.keys(R.regions).map(function (id) { var x = R.regions[id], l = x.v[x.v.length - 1], p = x.v.length > 36 ? x.v[x.v.length - 37] : null; return { n: x.name, l: l, d: inD(l), p: p ? inD(p) : null }; }).filter(function (x) { return x.l; }).sort(function (a, b) { return b.d - a.d; });
        h += '<div class="cd-mapbox"></div>';
        h += '<h3 style="margin:14px 0 6px;font-size:15px">' + esc(t.reg) + '</h3><div style="overflow-x:auto"><table class="cof-tbl" style="min-width:420px"><thead><tr><th scope="col">' + esc(t.regC) + '</th><th scope="col" class="cof-n">' + esc(t.inD) + '</th><th scope="col"></th><th scope="col" class="cof-n">' + esc(t.ly) + '</th></tr></thead><tbody>' +
          rs.map(function (x) { return '<tr><th scope="row">' + esc(x.n) + '</th><td class="cof-n"><b>' + nf(x.d, 1, lg) + ' %</b></td><td style="width:40%">' + bar(x.l, t) + '</td><td class="cof-n">' + (x.p == null ? '—' : nf(x.p, 1, lg) + ' %') + '</td></tr>'; }).join('') + '</tbody></table></div>';
      }
      if (E && E.series && E.series.ES) {
        var s = E.series.ES, i = s.dates.length - 1, pc = 100 * s.stored[i] / s.capacity[i], wk = (function (iso) { var p = iso.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])), q = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - q); var y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); return Math.ceil(((d - y0) / 86400000 + 1) / 7); })(s.dates[i]), cl = E.climatology && E.climatology.ES && E.climatology.ES[String(wk)];
        h += '<h3 style="margin:14px 0 6px;font-size:15px">' + esc(t.emb) + '</h3><div class="di-info-stat-list" style="max-width:640px">' + row(esc(t.embT) + ' · ' + esc(day(s.dates[i], lg)), '<b>' + nf(pc, 1, lg) + ' %</b> (' + nf(s.stored[i], 0, lg) + ' / ' + nf(s.capacity[i], 0, lg) + ' hm³)') + (cl ? row(esc(t.embAvg), sg(pc - cl[0], lg) + ' ' + t.pp) : '') + '</div>';
      }
      h += '<p class="di-field-hint" style="margin:10px 0 0">' + esc(t.src) + ' ' + esc(t.edo) + (cc === 'ES' ? ' · MITECO, Boletín Hidrológico' : '') + ' · <a href="sequia.html?zona=eu">' + esc(t.all) + '</a></p></section>';
      el.innerHTML = h; bindChart(el, v.map(inD), labels, lg, t);
      if (R && R.regions && Object.keys(R.regions).length > 1) droughtMap(el.querySelector('.cd-mapbox'), cc, R, lg);
      if (cc === 'PL') {   // avisos de sequia hidrologica del IMGW (js/pl-drought.js), a peticion
        var pbox = document.createElement('div'); pbox.style.marginTop = '14px'; el.appendChild(pbox);
        var pgo = function () { if (global.DIPlDrought) global.DIPlDrought.mount(pbox, lg.slice(0, 2)); };
        var pjs = function (src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); };
        var pmod = function () { if (global.DIPlDrought) pgo(); else pjs('js/pl-drought.js?v=20261013', pgo); };
        if (global.DIFrDeptMap) pmod(); else pjs('js/fr-dept-map.js?v=20261015', pmod);
      }
      if (cc === 'AT') {   // SPEI de GeoSphere Austria y aguas subterraneas (js/at-drought.js), a peticion
        var abox = document.createElement('div'); abox.style.marginTop = '14px'; el.appendChild(abox);
        var ago = function () { if (global.DIAtDrought) global.DIAtDrought.mount(abox, lg.slice(0, 2)); };
        var ajs = function (src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); };
        var amod = function () { if (global.DIAtDrought) ago(); else ajs('js/at-drought.js?v=20261013', ago); };
        if (global.DIFrDeptMap) amod(); else ajs('js/fr-dept-map.js?v=20261015', amod);
      }
      if (cc === 'HR') {   // sequia por provincia (EDO calculado para las 21 zupanije, js/hr-drought.js), a peticion
        var hbox = document.createElement('div'); hbox.style.marginTop = '14px'; el.appendChild(hbox);
        var hgo = function () { if (global.DIHrDrought) global.DIHrDrought.mount(hbox, lg.slice(0, 2)); };
        var hjs = function (src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); };
        var hmod = function () { if (global.DIHrDrought) hgo(); else hjs('js/hr-drought.js?v=20261019', hgo); };
        if (global.DIFrDeptMap) hmod(); else hjs('js/fr-dept-map.js?v=20261015', hmod);
      }
      if (cc === 'IT') {   // sequia por provincia (EDO calculado para las 107 provincias NUTS 3, js/it-drought.js), a peticion
        var tbox = document.createElement('div'); tbox.style.marginTop = '14px'; el.appendChild(tbox);
        var tgo = function () { if (global.DIItDrought) global.DIItDrought.mount(tbox, lg.slice(0, 2)); };
        var tjs = function (src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); };
        var tmod = function () { if (global.DIItDrought) tgo(); else tjs('js/it-drought.js?v=0', tgo); };
        if (global.DIFrDeptMap) tmod(); else tjs('js/fr-dept-map.js?v=20261015', tmod);
      }
      if (cc === 'IE') {   // sequia por region (EDO calculado para las 8 regiones NUTS 3, js/ie-drought.js), a peticion
        var ibox = document.createElement('div'); ibox.style.marginTop = '14px'; el.appendChild(ibox);
        var igo = function () { if (global.DIIeDrought) global.DIIeDrought.mount(ibox, lg.slice(0, 2)); };
        var ijs = function (src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); };
        var imod = function () { if (global.DIIeDrought) igo(); else ijs('js/ie-drought.js?v=0', igo); };
        if (global.DIFrDeptMap) imod(); else ijs('js/fr-dept-map.js?v=20261015', imod);
      }
      if (cc === 'NL') {   // sequia por region COROP (EDO) y déficit de precipitación del KNMI (js/nl-drought.js), a peticion
        var nbox = document.createElement('div'); nbox.style.marginTop = '14px'; el.appendChild(nbox);
        var ngo = function () { if (global.DINlDrought) global.DINlDrought.mount(nbox, lg.slice(0, 2)); };
        var njs = function (src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); };
        var nmod = function () { if (global.DINlDrought) ngo(); else njs('js/nl-drought.js?v=0', ngo); };
        if (global.DIFrDeptMap) nmod(); else njs('js/fr-dept-map.js?v=20261015', nmod);
      }
      if (cc === 'PT') {   // sequia por region NUTS 3 del continente (EDO calculado para 23 regiones, js/pt-drought.js), a peticion
        var tbox = document.createElement('div'); tbox.style.marginTop = '14px'; el.appendChild(tbox);
        var tgo = function () { if (global.DIPtDrought) global.DIPtDrought.mount(tbox, lg.slice(0, 2)); };
        var tjs = function (src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); };
        var tmod = function () { if (global.DIPtDrought) tgo(); else tjs('js/pt-drought.js?v=0', tgo); };
        if (global.DIFrDeptMap) tmod(); else tjs('js/fr-dept-map.js?v=20261015', tmod);
      }
      if (cc === 'BE') {   // prohibiciones de captar agua y SPI-3 en Flandes (VMM, js/be-drought.js), a peticion
        var bbox = document.createElement('div'); bbox.style.marginTop = '14px'; el.appendChild(bbox);
        var bgo = function () { if (global.DIBeDrought) global.DIBeDrought.mount(bbox, lg.slice(0, 2)); };
        var bjs = function (src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); };
        var bmod = function () { if (global.DIBeDrought) bgo(); else bjs('js/be-drought.js?v=20261013', bgo); };
        if (global.DIFrDeptMap) bmod(); else bjs('js/fr-dept-map.js?v=20261015', bmod);
      }
      if (cc === 'IT') {   // severidad hidrica por distrito (ISPRA, js/it-severity.js), a peticion
        var ibox = document.createElement('div'); ibox.style.marginTop = '14px'; el.appendChild(ibox);
        var igo = function () { if (global.DIItSeverity) global.DIItSeverity.mount(ibox, lg.slice(0, 2)); };
        var ijs = function (src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); };
        var imod = function () { if (global.DIItSeverity) igo(); else ijs('js/it-severity.js?v=20261013', igo); };
        if (global.DIFrDeptMap) imod(); else ijs('js/fr-dept-map.js?v=20261015', imod);
      }
      if (cc === 'DE') {   // humedad del suelo por Land (DWD, js/de-soil.js, con el ayudante de mapas js/fr-dept-map.js), a peticion
        var dbox = document.createElement('div'); dbox.style.marginTop = '14px'; el.appendChild(dbox);
        var dgo = function () { if (global.DIDeSoil) global.DIDeSoil.mount(dbox, lg.slice(0, 2)); };
        var djs = function (src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); };
        var dmod = function () { if (global.DIDeSoil) dgo(); else djs('js/de-soil.js?v=20261014', dgo); };
        if (global.DIFrDeptMap) dmod(); else djs('js/fr-dept-map.js?v=20261015', dmod);
        var rbox = document.createElement('div'); rbox.style.marginTop = '14px'; el.appendChild(rbox);   // nivel de los rios alemanes (PEGELONLINE, js/de-rivers.js), a peticion
        var rgo = function () { if (global.DIDeRivers) global.DIDeRivers.mount(rbox, lg.slice(0, 2)); };
        if (global.DIDeRivers) rgo(); else djs('js/de-rivers.js?v=20261026', rgo);
      }
      if (cc === 'FR') {   // rios sin agua (ONDE, js/fr-onde.js, con el mapa de departamentos js/fr-dept-map.js), a peticion
        var fbox = document.createElement('div'); fbox.style.marginTop = '14px'; el.appendChild(fbox);
        var fgo = function () { if (global.DIFrOnde) global.DIFrOnde.mount(fbox, lg.slice(0, 2)); };
        var fjs = function (src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); };
        var fmod = function () { if (global.DIFrOnde) fgo(); else fjs('js/fr-onde.js?v=20261020', fgo); };
        if (global.DIFrDeptMap) fmod(); else fjs('js/fr-dept-map.js?v=20261015', fmod);
      }
      if (cc === 'ES') {   // escasez y sequia prolongada por unidad territorial (js/es-drought-ute.js, se carga a peticion)
        var box = document.createElement('div'); box.style.marginTop = '14px'; el.appendChild(box);
        var go = function () { if (global.DIEsDroughtUTE) global.DIEsDroughtUTE.mount(box, lg.slice(0, 2)); };
        if (global.DIEsDroughtUTE) go(); else { var sc = document.createElement('script'); sc.src = 'js/es-drought-ute.js?v=20261012'; sc.onload = go; document.head.appendChild(sc); }
      }
      return true;
    });
  }
  function us(el, name, lg, t) {
    return get('data/drought.json').then(function (D) {
      var r = D && D.us && D.us.conus; if (!r || !r.length) return false;
      var l = r[r.length - 1], y = r.length > 52 ? r[r.length - 53] : null, w = r.slice(-104);
      el.innerHTML = '<section class="di-card ps-rm" id="ps-drought"><h2 class="ps-rm-h">' + esc(t.h.replace('{c}', name)) + '</h2><div class="di-info-stat-list" style="max-width:640px">' + row(esc(t.usT) + ' · ' + esc(t.usW.replace('{d}', day(l[0], lg))), '<b>' + nf(l[2], 1, lg) + ' %</b>') + row(esc(t.lyW), y ? nf(y[2], 1, lg) + ' % (' + sg(l[2] - y[2], lg) + ' ' + t.pp + ')' : '—') + '</div>' +
        chart(w.map(function (x) { return x[2]; }), w.map(function (x) { return x[0]; }), lg, t).replace(esc(t.hist), esc(t.usT)) + '<p class="di-field-hint" style="margin:10px 0 0">' + esc(t.src) + ' U.S. Drought Monitor (NDMC, USDA, NOAA) · <a href="sequia.html?zona=us">' + esc(t.all) + '</a></p></section>';
      bindChart(el, w.map(function (x) { return x[2]; }), w.map(function (x) { return x[0]; }), lg, t); return true;
    });
  }
  function ca(el, name, lg, t) {
    return get('data/canada-drought.json').then(function (D) {
      if (!D || !D.provinces) return false;
      var rs = Object.keys(D.provinces).map(function (k) { var p = D.provinces[k], l = p.v[p.v.length - 1]; return { n: p.name, d: l ? l[1] : null }; }).filter(function (x) { return x.d != null; }).sort(function (a, b) { return b.d - a.d; });
      if (!rs.length) return false;
      el.innerHTML = '<section class="di-card ps-rm" id="ps-drought"><h2 class="ps-rm-h">' + esc(t.h.replace('{c}', name)) + '</h2><p class="di-movers-hint" style="margin:0 0 8px">' + esc(t.caT) + ' · ' + esc(t.caM.replace('{d}', day(String(D.asOf).slice(0, 7), lg))) + '</p><div class="di-info-stat-list" style="max-width:640px">' +
        rs.map(function (x) { return row(esc(x.n), '<b>' + nf(x.d, 1, lg) + ' %</b>'); }).join('') + '</div><p class="di-field-hint" style="margin:10px 0 0">' + esc(t.src) + ' Canadian Drought Monitor (AAFC) · <a href="sequia.html?zona=ca">' + esc(t.all) + '</a></p></section>';
      return true;
    });
  }
  // Devuelve una promesa: true si se ha dibujado algo (la barra de secciones solo enlaza «Sequía» entonces).
  function mount(el, cc, name, lg) {
    var t = T[lg] || T.es; if (!el) return Promise.resolve(false);
    if (cc === 'US') return us(el, name, lg, t);
    if (cc === 'CA') return ca(el, name, lg, t).then(function (ok) { rivers(el, cc, lg); return ok; });
    if (cc === 'EU' || cc === 'AU' || cc === 'AR' || cc === 'CL') return Promise.resolve(false);
    var p = europe(el, cc, name, lg, t);
    return p && p.then ? p.then(function (ok) { rivers(el, cc, lg); return ok; }) : p;
  }
  // nivel y caudal de los rios de Paises Bajos, Francia, Canada y Belgica (js/rivers.js, data/rivers-{cc}.json), a peticion
  function rivers(el, cc, lg) {
    if ({ NL: 1, FR: 1, CA: 1, BE: 1 }[cc] !== 1 || !el) return;
    var box = document.createElement('div'); box.style.marginTop = '14px'; el.appendChild(box);
    var go = function () { if (global.DIRivers) global.DIRivers.mount(box, lg.slice(0, 2), cc.toLowerCase()); };
    if (global.DIRivers) go(); else { var sc = document.createElement('script'); sc.src = 'js/rivers.js?v=20261026'; sc.onload = go; document.head.appendChild(sc); }
  }
  global.DIDroughtCountry = { mount: mount };
})(window);
