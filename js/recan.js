/* Dehesa Index — Costes y rentas de las explotaciones españolas (RECAN, MAPA, CC BY 4.0). Lee data/recan.json.
   Cada cifra es la que publica el MAPA para una comunidad, un tipo y una dimensión económica; no se promedia ni se estima nada. */
(function () {
  'use strict';
  var T = {
    es: { title: 'Costes y rentas de las explotaciones (España)', sub: 'Producción, costes, subvenciones y renta neta por explotación, según la Red Contable Agraria Nacional del MAPA: por comunidad autónoma, tipo de explotación y dimensión económica, de 2014 a 2024.',
      year: 'Ejercicio', ccaa: 'Comunidad', type: 'Tipo de explotación', dim: 'Dimensión económica', variable: 'Variable', chart: 'Evolución', all: 'Todas las variables del ejercicio', rank: 'Comparativa entre comunidades', value: 'Valor', prev: 'Ejercicio anterior', chg: 'Variación', farms: 'Explotaciones en la muestra', rep: 'Explotaciones representadas', none: 'Sin datos para esta combinación (el MAPA los marca como confidenciales o no hay muestra suficiente).', sample: 'Muestra',
      note: 'Los datos son valores medios por explotación tal como los publica el MAPA. Las celdas confidenciales no aparecen y no se rellenan ni se promedian entre comunidades. La dimensión económica es la clase de producción estándar de la explotación. Con pocas explotaciones en la muestra, la cifra es menos fiable. Las variaciones entre ejercicios pueden reflejar cambios en la muestra, no solo en la realidad del sector.', src: 'Fuente', lic: 'Licencia', updated: 'Actualizado', perFarm: 'por explotación' },
    en: { title: 'Farm costs and incomes (Spain)', sub: 'Output, costs, subsidies and net income per farm from the Spanish Farm Accountancy Data Network (RECAN, MAPA): by region, farm type and economic size, 2014 to 2024.',
      year: 'Year', ccaa: 'Region', type: 'Farm type', dim: 'Economic size', variable: 'Variable', chart: 'Trend', all: 'All variables for the year', rank: 'Comparison across regions', value: 'Value', prev: 'Previous year', chg: 'Change', farms: 'Farms in sample', rep: 'Farms represented', none: 'No data for this combination (MAPA marks it confidential or the sample is too small).', sample: 'Sample',
      note: 'Values are per-farm averages as published by MAPA. Confidential cells are not shown and are never filled or averaged across regions. Economic size is the farm’s standard-output class. With few farms in the sample the figure is less reliable. Year-on-year changes can reflect changes in the sample, not only in the sector. Variable names are in Spanish, as published.', src: 'Source', lic: 'Licence', updated: 'Updated', perFarm: 'per farm' },
    fr: { title: 'Coûts et revenus des exploitations (Espagne)', sub: 'Production, coûts, subventions et revenu net par exploitation selon le réseau comptable agricole espagnol (RECAN, MAPA) : par région, type d’exploitation et taille économique, de 2014 à 2024.',
      year: 'Exercice', ccaa: 'Région', type: 'Type d’exploitation', dim: 'Taille économique', variable: 'Variable', chart: 'Évolution', all: 'Toutes les variables de l’exercice', rank: 'Comparaison entre régions', value: 'Valeur', prev: 'Exercice précédent', chg: 'Variation', farms: 'Exploitations dans l’échantillon', rep: 'Exploitations représentées', none: 'Pas de données pour cette combinaison (le MAPA les marque confidentielles ou l’échantillon est trop petit).', sample: 'Échantillon',
      note: 'Valeurs moyennes par exploitation telles que publiées par le MAPA. Les cellules confidentielles ne sont pas affichées et ne sont ni remplies ni moyennées entre régions. Avec peu d’exploitations dans l’échantillon, le chiffre est moins fiable. Les variations d’un exercice à l’autre peuvent refléter un changement d’échantillon. Les noms des variables restent en espagnol.', src: 'Source', lic: 'Licence', updated: 'Mis à jour', perFarm: 'par exploitation' },
    it: { title: 'Costi e redditi delle aziende (Spagna)', sub: 'Produzione, costi, sussidi e reddito netto per azienda secondo la rete contabile agraria spagnola (RECAN, MAPA): per regione, tipo di azienda e dimensione economica, dal 2014 al 2024.',
      year: 'Esercizio', ccaa: 'Regione', type: 'Tipo di azienda', dim: 'Dimensione economica', variable: 'Variabile', chart: 'Andamento', all: 'Tutte le variabili dell’esercizio', rank: 'Confronto tra regioni', value: 'Valore', prev: 'Esercizio precedente', chg: 'Variazione', farms: 'Aziende nel campione', rep: 'Aziende rappresentate', none: 'Nessun dato per questa combinazione (il MAPA lo segnala come riservato o il campione è troppo piccolo).', sample: 'Campione',
      note: 'Valori medi per azienda come pubblicati dal MAPA. Le celle riservate non compaiono e non vengono riempite né mediate tra regioni. Con poche aziende nel campione la cifra è meno affidabile. Le variazioni tra esercizi possono riflettere cambi del campione. I nomi delle variabili restano in spagnolo.', src: 'Fonte', lic: 'Licenza', updated: 'Aggiornato', perFarm: 'per azienda' }
  };
  var D = null, ST = { c: null, t: null, d: null, y: null, v: 'SE420' };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tt() { return T[lang()] || T.es; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function dec(v) { return Math.abs(v) < 10 ? 2 : Math.abs(v) < 100 ? 1 : 0; }
  function tlabel(i) { var x = D.types[i]; return x[0] === x[1] ? x[0] : x[0] + ' — ' + x[1]; }
  function vidx(id) { for (var i = 0; i < D.vars.length; i++) if (D.vars[i][0] === id) return i; return 0; }
  function uniq(a) { var o = [], s = {}; a.forEach(function (x) { if (!s[x]) { s[x] = 1; o.push(x); } }); return o; }
  function num(a) { return a.sort(function (x, y) { return x - y; }); }
  // filas (ejercicio, comunidad, tipo, dimensión, muestra, representadas, [valores])
  function rowsWhere(f) { return D.rows.filter(f); }
  function fix() {
    var r = rowsWhere(function (x) { return true; });
    var cs = num(uniq(r.map(function (x) { return x[1]; })));
    if (cs.indexOf(ST.c) < 0) ST.c = cs.indexOf(D.ccaa.indexOf('Andalucía')) >= 0 ? D.ccaa.indexOf('Andalucía') : cs[0];
    var ts = num(uniq(rowsWhere(function (x) { return x[1] === ST.c; }).map(function (x) { return x[2]; })));
    if (ts.indexOf(ST.t) < 0) ST.t = ts[0];
    var ds = num(uniq(rowsWhere(function (x) { return x[1] === ST.c && x[2] === ST.t; }).map(function (x) { return x[3]; })));
    if (ds.indexOf(ST.d) < 0) ST.d = ds[0];
    var ys = num(uniq(rowsWhere(function (x) { return x[1] === ST.c && x[2] === ST.t && x[3] === ST.d; }).map(function (x) { return x[0]; })));
    if (ys.indexOf(ST.y) < 0) ST.y = ys[ys.length - 1];
    return { cs: cs, ts: ts, ds: ds, ys: ys };
  }
  function find(y, c, t, d) { for (var i = 0; i < D.rows.length; i++) { var x = D.rows[i]; if (x[0] === y && x[1] === c && x[2] === t && x[3] === d) return x; } return null; }
  function chartFor(vi, av) {
    var pts = [];
    av.ys.forEach(function (y) { var r = find(y, ST.c, ST.t, ST.d); if (r && r[6][vi] != null) pts.push({ x: Date.UTC(D.years[y], 0, 1), y: r[6][vi], l: String(D.years[y]) }); });
    if (pts.length < 2) return '';
    var v = D.vars[vi];
    return window.DehesaChart.render({ series: [{ name: v[1], color: '#2f6b4a', pts: pts }], xMode: 'time', xTitle: tt().year, yTitle: v[2], aria: v[1] + ' (' + v[2] + ')', noLegend: true,
      vFmt: function (x) { return nf(x, dec(x)); }, xFmt: function (x) { return new Date(x).getUTCFullYear(); } });
  }
  function build() {
    var root = document.getElementById('recan-body'); if (!root || !D) return;
    var t = tt(), av = fix(), vi = vidx(ST.v), cur = find(ST.y, ST.c, ST.t, ST.d);
    var opt = function (arr, sel, lab) { return arr.map(function (k) { return '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + esc(lab(k)) + '</option>'; }).join(''); };
    var sel = function (id, label, inner) { return '<label style="font-size:13px;flex:1;min-width:170px">' + label + '<br><select id="' + id + '" class="di-compare-select">' + inner + '</select></label>'; };
    var html = '<div style="display:flex;gap:14px;flex-wrap:wrap;margin:0 0 14px">' +
      sel('rc-c', t.ccaa, opt(av.cs, ST.c, function (k) { return D.ccaa[k]; })) +
      sel('rc-t', t.type, opt(av.ts, ST.t, tlabel)) +
      sel('rc-d', t.dim, opt(av.ds, ST.d, function (k) { return D.dims[k]; })) +
      sel('rc-y', t.year, opt(av.ys, ST.y, function (k) { return D.years[k]; })) +
      sel('rc-v', t.variable, D.vars.map(function (v) { return '<option value="' + v[0] + '"' + (v[0] === ST.v ? ' selected' : '') + '>' + esc(v[1]) + '</option>'; }).join('')) + '</div>';
    var v = D.vars[vi], val = cur ? cur[6][vi] : null;
    html += '<div class="di-card" style="padding:16px 18px"><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:4px">' + esc(v[1].toUpperCase()) + ' (' + esc(v[2]) + ') · ' + t.chart.toUpperCase() + '</div>';
    var ch = chartFor(vi, av);
    html += ch || '<p class="di-movers-hint">' + t.none + '</p>';
    if (val != null) html += '<div class="di-movers-hint" style="margin-top:6px">' + D.years[ST.y] + ': <b>' + nf(val, dec(val)) + ' ' + esc(v[2]) + '</b> · ' + t.farms + ': ' + (cur[4] != null ? nf(cur[4], 0) : '—') + ' · ' + t.rep + ': ' + (cur[5] != null ? nf(cur[5], 0) : '—') + '</div>';
    html += '</div>';
    // todas las variables del ejercicio
    var prevY = av.ys[av.ys.indexOf(ST.y) - 1], prev = prevY != null ? find(prevY, ST.c, ST.t, ST.d) : null;
    var th = 'padding:8px 6px;';
    html += '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:14px"><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);padding:10px 0 2px">' + t.all.toUpperCase() + ' · ' + D.years[ST.y] + '</div><table style="border-collapse:collapse;width:100%;min-width:520px;font-size:13.5px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="' + th + '">' + t.variable + '</th><th style="' + th + 'text-align:right">' + t.value + '</th><th style="' + th + '">&nbsp;</th><th style="' + th + 'text-align:right">' + t.chg + (prevY != null ? ' vs ' + D.years[prevY] : '') + '</th></tr>';
    D.vars.forEach(function (vv, i) {
      var a = cur ? cur[6][i] : null, b = prev ? prev[6][i] : null;
      if (a == null) return;
      var c = b != null && b !== 0 ? (a - b) / Math.abs(b) * 100 : null;
      html += '<tr style="border-top:1px solid var(--border)"><td style="' + th + '">' + esc(vv[1]) + '</td><td style="' + th + 'text-align:right">' + nf(a, dec(a)) + '</td><td style="' + th + 'color:var(--text-faint);font-size:12px">' + esc(vv[2]) + '</td><td style="' + th + 'text-align:right">' + (c == null ? '' : (c > 0 ? '+' : c < 0 ? '−' : '') + nf(Math.abs(c), 1) + ' %') + '</td></tr>';
    });
    html += '</table></div>';
    // comparativa entre comunidades (mismo tipo, dimensión y ejercicio)
    var rk = D.rows.filter(function (x) { return x[0] === ST.y && x[2] === ST.t && x[3] === ST.d && x[6][vi] != null; }).sort(function (a, b) { return b[6][vi] - a[6][vi]; });
    if (rk.length > 1) {
      var max = Math.max.apply(null, rk.map(function (x) { return Math.abs(x[6][vi]); })) || 1;
      html += '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:14px"><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);padding:10px 0 6px">' + t.rank.toUpperCase() + ' · ' + esc(v[1]) + ' (' + esc(v[2]) + ') · ' + D.years[ST.y] + '</div><table style="border-collapse:collapse;width:100%;min-width:480px;font-size:13.5px">';
      rk.forEach(function (x) {
        var w = Math.max(2, Math.round(Math.abs(x[6][vi]) / max * 100)), me = x[1] === ST.c;
        html += '<tr style="border-top:1px solid var(--border)' + (me ? ';font-weight:700' : '') + '"><td style="padding:7px 6px;width:34%">' + esc(D.ccaa[x[1]]) + '</td><td style="padding:7px 6px;width:38%"><div style="height:8px;border-radius:4px;background:' + (x[6][vi] < 0 ? '#b5483a' : '#2f6b4a') + ';width:' + w + '%;opacity:' + (me ? 1 : .55) + '"></div></td><td style="padding:7px 6px;text-align:right;white-space:nowrap">' + nf(x[6][vi], dec(x[6][vi])) + '</td><td style="padding:7px 6px;text-align:right;color:var(--text-faint);font-size:12px;white-space:nowrap">' + t.sample + ': ' + (x[4] != null ? nf(x[4], 0) : '—') + '</td></tr>';
      });
      html += '</table></div>';
    }
    html += '<p class="di-movers-hint" style="margin-top:12px">' + t.note + '</p><p class="di-movers-hint">' + t.src + ': <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener">' + esc(D.source.name) + '</a> · ' + t.lic + ': ' + esc(D.source.license) + ' · ' + t.updated + ': ' + esc((D.generatedAt || '').slice(0, 10)) + '</p>';
    root.innerHTML = html;
    var bind = function (id, key, numeric) { var el = document.getElementById(id); if (el) el.onchange = function (e) { ST[key] = numeric ? +e.target.value : e.target.value; if (key === 'c') { ST.t = null; ST.d = null; ST.y = null; } if (key === 't') { ST.d = null; ST.y = null; } if (key === 'd') ST.y = null; build(); var n = document.getElementById(id); if (n) n.focus(); }; };
    bind('rc-c', 'c', true); bind('rc-t', 't', true); bind('rc-d', 'd', true); bind('rc-y', 'y', true); bind('rc-v', 'v', false);
  }
  function shell() { var t = tt(); var h = document.getElementById('pg-h1'), s = document.getElementById('pg-sub'); if (h) h.textContent = t.title; if (s) s.textContent = t.sub; document.title = 'Dehesa Index — ' + t.title; }
  window.DehesaShared.init('informacion');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); shell(); build(); };
  shell();
  fetch('data/recan.json').then(function (r) { if (!r.ok) throw Error('x'); return r.json(); }).then(function (d) { D = d; build(); })
    .catch(function () { var b = document.getElementById('recan-body'); if (b) b.innerHTML = '<p class="di-movers-hint">' + tt().none + '</p>'; });
})();
