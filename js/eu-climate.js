/* Dehesa Index — Temperatura y lluvia mensual por pais frente a su media 1991-2020 (NASA POWER). Lee data/eu-climate.json. ES5. */
(function () {
  'use strict';
  var D = null, SEL = 'ES';
  var T = {
    es: { h: 'Temperatura y lluvia del mes frente a lo normal', sub: 'Cuánto se ha desviado cada mes de la temperatura y la lluvia medias de ese mismo mes entre 1991 y 2020. Una sequía suele empezar aquí: meses más cálidos y con menos lluvia de lo normal.', pick: 'País', tc: 'Temperatura frente a lo normal (°C)', pc: 'Lluvia frente a lo normal (mm)', tbl: 'Últimos seis meses', mo: 'Mes', t: 'Temp. media', tn: 'Normal', dt: 'Diferencia', p: 'Lluvia', pn: 'Normal', pp: 'Respecto a lo normal', note: 'Fuente: NASA POWER (reanálisis MERRA-2), uso libre citando la fuente. Rejilla de unos 50 km: describe el país, no una parcela. Media de las celdas del país ponderada por latitud; lo normal es la media de 1991–2020 de cada mes. Los datos llegan con unas semanas de retraso.', eu: 'Unión Europea (27)' },
    en: { h: 'Monthly temperature and rainfall against normal', sub: 'How far each month strayed from the average temperature and rainfall of the same calendar month over 1991–2020. A drought often begins here: months warmer and drier than usual.', pick: 'Country', tc: 'Temperature against normal (°C)', pc: 'Rainfall against normal (mm)', tbl: 'Last six months', mo: 'Month', t: 'Mean temp.', tn: 'Normal', dt: 'Difference', p: 'Rainfall', pn: 'Normal', pp: 'Against normal', note: 'Source: NASA POWER (MERRA-2 reanalysis), free use with credit to the source. Grid of about 50 km: it describes the country, not a single field. Latitude-weighted mean of the cells inside the country; normal is the 1991–2020 mean of each month. Data arrive a few weeks late.', eu: 'European Union (27)' },
    fr: { h: 'Température et pluie du mois par rapport à la normale', sub: 'Écart de chaque mois à la température et aux pluies moyennes du même mois sur 1991–2020. Une sécheresse commence souvent ici : des mois plus chauds et plus secs que d’habitude.', pick: 'Pays', tc: 'Température par rapport à la normale (°C)', pc: 'Pluie par rapport à la normale (mm)', tbl: 'Six derniers mois', mo: 'Mois', t: 'Temp. moyenne', tn: 'Normale', dt: 'Écart', p: 'Pluie', pn: 'Normale', pp: 'Par rapport à la normale', note: 'Source : NASA POWER (réanalyse MERRA-2), usage libre avec mention de la source. Grille d’environ 50 km : elle décrit le pays, pas une parcelle. Moyenne des cellules du pays pondérée par la latitude ; la normale est la moyenne 1991–2020 de chaque mois. Les données arrivent avec quelques semaines de retard.', eu: 'Union européenne (27)' },
    it: { h: 'Temperatura e pioggia del mese rispetto alla norma', sub: 'Di quanto ogni mese si è discostato dalla temperatura e dalla pioggia medie dello stesso mese nel 1991–2020. Una siccità spesso comincia qui: mesi più caldi e più asciutti del solito.', pick: 'Paese', tc: 'Temperatura rispetto alla norma (°C)', pc: 'Pioggia rispetto alla norma (mm)', tbl: 'Ultimi sei mesi', mo: 'Mese', t: 'Temp. media', tn: 'Norma', dt: 'Differenza', p: 'Pioggia', pn: 'Norma', pp: 'Rispetto alla norma', note: 'Fonte: NASA POWER (rianalisi MERRA-2), uso libero citando la fonte. Griglia di circa 50 km: descrive il paese, non un campo. Media delle celle del paese ponderata per la latitudine; la norma è la media 1991–2020 di ciascun mese. I dati arrivano con qualche settimana di ritardo.', eu: 'Unione europea (27)' }
  };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function sg(v, d) { return (v > 0.04 * (d === 0 ? 12 : 1) ? '+' : v < -0.04 * (d === 0 ? 12 : 1) ? '−' : '') + nf(Math.abs(v), d); }
  function mon(m, long) { var p = m.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, 1)).toLocaleDateString(lang(), { month: long ? 'long' : 'short', year: long ? 'numeric' : '2-digit', timeZone: 'UTC' }); } catch (e) { return m; } }
  function cname(c, t) {
    if (c === 'EU27') return t.eu;
    try { if (window.Intl && Intl.DisplayNames) { var n = new Intl.DisplayNames([lang()], { type: 'region' }).of(c === 'XK' ? 'XK' : c); if (n && n !== c) return n; } } catch (e) { }
    return D.countries[c].name;
  }
  function bars(diff, months, unit, hot, cold, label) {
    var n = diff.length, W = 640, H = 170, L = 40, R = 8, Tp = 10, B = 24, mx = 0, i;
    diff.forEach(function (v) { if (v != null && Math.abs(v) > mx) mx = Math.abs(v); }); if (!mx) mx = 1; mx = unit === 'mm' ? Math.ceil(mx * 1.1 / 10) * 10 : Math.ceil(mx * 1.1 * 2) / 2;
    var pw = (W - L - R) / n, y0 = Tp + (H - Tp - B) / 2, sc = (H - Tp - B) / 2 / mx, out = '';
    out += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y0 + '" y2="' + y0 + '" stroke="var(--text-faint)" stroke-width="1"/>';
    [mx, -mx].forEach(function (g) { out += '<text x="' + (L - 4) + '" y="' + (y0 - g * sc + 3).toFixed(1) + '" text-anchor="end" font-size="10" fill="var(--text-faint)">' + (g > 0 ? '+' : '−') + nf(Math.abs(g), unit === 'mm' ? 0 : 1) + '</text>'; });
    for (i = 0; i < n; i++) {
      var v = diff[i]; if (v == null) continue; var h = Math.abs(v) * sc, x = L + i * pw + 1;
      out += '<rect x="' + x.toFixed(1) + '" y="' + (v >= 0 ? y0 - h : y0).toFixed(1) + '" width="' + Math.max(1, pw - 2).toFixed(1) + '" height="' + Math.max(0.5, h).toFixed(1) + '" rx="1.5" fill="' + (v >= 0 ? hot : cold) + '"><title>' + esc(mon(months[i], true) + ': ' + sg(v, unit === 'mm' ? 0 : 1) + ' ' + unit) + '</title></rect>';
      if (i % 6 === 0 || i === n - 1) out += '<text x="' + (x + pw / 2 - 1).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="var(--text-faint)">' + esc(mon(months[i], false)) + '</text>';
    }
    return '<h4 class="cof-h3" style="font-size:14px">' + esc(label) + '</h4><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '" style="width:100%;height:auto;max-width:720px;display:block">' + out + '</svg>';
  }
  function render() {
    var root = document.getElementById('eucl'); if (!root || !D || !D.countries || !D.countries[SEL]) return;
    var t = T[lang()] || T.es, c = D.countries[SEL], n = c.t.length, i;
    var dt = [], dp = []; for (i = 0; i < n; i++) { dt.push(c.t[i] == null || c.tn[i] == null ? null : c.t[i] - c.tn[i]); dp.push(c.p[i] == null || c.pn[i] == null ? null : c.p[i] - c.pn[i]); }
    var codes = Object.keys(D.countries).filter(function (k) { return k !== 'EU27'; }).sort(function (a, b) { return cname(a, t).localeCompare(cname(b, t), lang()); }); codes.unshift('EU27');
    var opts = codes.map(function (k) { return '<option value="' + k + '"' + (k === SEL ? ' selected' : '') + '>' + esc(cname(k, t)) + '</option>'; }).join('');
    var rows = '', from = Math.max(0, n - 6);
    for (i = n - 1; i >= from; i--) {
      var pr = c.pn[i] > 0 ? 100 * (c.p[i] / c.pn[i] - 1) : null;
      rows += '<tr><th scope="row" style="font-weight:600">' + esc(mon(D.months[i], true)) + '</th><td class="cof-n">' + esc(nf(c.t[i], 1)) + ' °C</td><td class="cof-n">' + esc(nf(c.tn[i], 1)) + ' °C</td><td class="cof-n"><strong style="color:' + (dt[i] > 0.5 ? '#b03a2e' : dt[i] < -0.5 ? '#2a6f97' : 'inherit') + '">' + esc(sg(dt[i], 1)) + ' °C</strong></td><td class="cof-n">' + esc(nf(c.p[i], 0)) + ' mm</td><td class="cof-n">' + esc(nf(c.pn[i], 0)) + ' mm</td><td class="cof-n"><strong style="color:' + (pr != null && pr < -25 ? '#b03a2e' : pr != null && pr > 25 ? '#2a6f97' : 'inherit') + '">' + (pr == null ? '–' : esc(sg(pr, 0)) + ' %') + '</strong></td></tr>';
    }
    root.innerHTML = '<h2 class="cof-h2">' + esc(t.h) + '</h2><p class="cof-sub">' + esc(t.sub) + '</p><p class="cof-note"><label>' + esc(t.pick) + ' <select id="eucl-sel" style="font:inherit;padding:2px 6px">' + opts + '</select></label></p>' +
      '<div class="di-card" style="padding:10px 14px">' + bars(dt, D.months, '°C', '#b03a2e', '#2a6f97', t.tc) + bars(dp, D.months, 'mm', '#2a6f97', '#b8863b', t.pc) + '</div>' +
      '<h3 class="cof-h3">' + esc(t.tbl) + '</h3><div class="di-card" style="padding:6px 14px;overflow-x:auto"><table class="cof-tbl"><thead><tr><th scope="col">' + esc(t.mo) + '</th><th scope="col" class="cof-n">' + esc(t.t) + '</th><th scope="col" class="cof-n">' + esc(t.tn) + '</th><th scope="col" class="cof-n">' + esc(t.dt) + '</th><th scope="col" class="cof-n">' + esc(t.p) + '</th><th scope="col" class="cof-n">' + esc(t.pn) + '</th><th scope="col" class="cof-n">' + esc(t.pp) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="cof-note">' + esc(t.note) + '</p>';
    var s = document.getElementById('eucl-sel'); if (s) s.onchange = function () { SEL = s.value; render(); };
  }
  function boot() {
    if (!document.getElementById('eucl')) return;
    fetch('data/eu-climate.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d && d.countries) { D = d; render(); } }).catch(function () { });
    var prev = window.DehesaShared && window.DehesaShared.onLangChange;
    if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
