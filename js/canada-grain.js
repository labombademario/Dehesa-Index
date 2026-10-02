/* Dehesa Index — Granos de Canadá (Canadian Grain Commission, Grain Statistics Weekly; Open Government Licence - Canada). ES5.
   Lee data/canada-grain.json. Cada cifra es la que publica la CGC en miles de toneladas; no se estima nada. Una semana sin dato es un hueco, no un cero. */
(function () {
  'use strict';
  var T = {
    es: { exS: 'Exportaciones', dlS: 'Entregas', stS: 'Existencias', h: 'Granos de Canadá: exportaciones, entregas y existencias', sub: 'Cifras semanales de la Canadian Grain Commission, en miles de toneladas: lo que sale por los terminales portuarios, lo que entregan los agricultores de las praderas y lo que hay almacenado.',
      grain: 'Cultivo', ex: 'Exportaciones por terminales portuarios', dl: 'Entregas de los agricultores (Manitoba, Saskatchewan, Alberta y Columbia Británica)', st: 'Existencias comerciales en silos y terminales', cum: 'Exportaciones acumuladas de la campaña',
      week: 'Semana', last: 'Última semana', prev: 'Semana anterior', yago: 'Hace un año', chg: 'Variación', none: 'No hay datos disponibles ahora mismo.', kt: 'miles de t', gap: 'sin dato', unit: 'miles de toneladas', table: 'Ver la tabla de las últimas 8 semanas', thisCrop: 'campaña actual',
      note: 'Las exportaciones son las que salen por terminales portuarios autorizados: no incluyen los envíos directos por ferrocarril o camión a Estados Unidos, así que no son las exportaciones totales del país. La CGC revisa las semanas recientes, por lo que una cifra puede cambiar. Una semana sin dato aparece como hueco, nunca como cero. Las existencias son las comerciales, no las de las granjas.', src: 'Fuente', updated: 'Actualizado', asof: 'Semana terminada el' },
    en: { exS: 'Exports', dlS: 'Deliveries', stS: 'Stocks', h: 'Canadian grain: exports, deliveries and stocks', sub: 'Weekly Canadian Grain Commission figures, in thousand tonnes: what leaves through port terminals, what Prairie farmers deliver, and what sits in storage.',
      grain: 'Crop', ex: 'Port terminal exports', dl: 'Farmer deliveries (Manitoba, Saskatchewan, Alberta and British Columbia)', st: 'Commercial stocks in elevators and terminals', cum: 'Crop-year exports to date',
      week: 'Week', last: 'Latest week', prev: 'Previous week', yago: 'A year ago', chg: 'Change', none: 'No data available right now.', kt: 'kt', gap: 'no data', unit: 'thousand tonnes', table: 'Show the table of the last 8 weeks', thisCrop: 'this crop year',
      note: 'Exports are those shipped through licensed port terminals: they exclude direct rail or truck shipments to the United States, so they are not Canada’s total exports. The CGC revises recent weeks, so a figure can change. A week with no data shows as a gap, never as zero. Stocks are commercial stocks, not on-farm stocks.', src: 'Source', updated: 'Updated', asof: 'Week ending' },
    fr: { exS: 'Exportations', dlS: 'Livraisons', stS: 'Stocks', h: 'Céréales du Canada : exportations, livraisons et stocks', sub: 'Chiffres hebdomadaires de la Commission canadienne des grains, en milliers de tonnes : ce qui part par les terminaux portuaires, ce que livrent les agriculteurs des Prairies et ce qui est stocké.',
      grain: 'Culture', ex: 'Exportations par les terminaux portuaires', dl: 'Livraisons des agriculteurs (Manitoba, Saskatchewan, Alberta et Colombie-Britannique)', st: 'Stocks commerciaux en silos et terminaux', cum: 'Exportations cumulées de la campagne',
      week: 'Semaine', last: 'Dernière semaine', prev: 'Semaine précédente', yago: 'Il y a un an', chg: 'Variation', none: 'Aucune donnée disponible pour le moment.', kt: 'kt', gap: 'pas de donnée', unit: 'milliers de tonnes', table: 'Voir le tableau des 8 dernières semaines', thisCrop: 'campagne en cours',
      note: 'Les exportations sont celles expédiées par les terminaux portuaires agréés : elles excluent les envois directs par rail ou camion vers les États-Unis et ne sont donc pas les exportations totales du pays. La CGC révise les semaines récentes, un chiffre peut donc changer. Une semaine sans donnée apparaît comme un trou, jamais comme un zéro. Les stocks sont les stocks commerciaux, pas ceux des exploitations.', src: 'Source', updated: 'Mis à jour', asof: 'Semaine se terminant le' },
    it: { exS: 'Esportazioni', dlS: 'Consegne', stS: 'Scorte', h: 'Cereali del Canada: esportazioni, consegne e scorte', sub: 'Cifre settimanali della Canadian Grain Commission, in migliaia di tonnellate: ciò che parte dai terminal portuali, ciò che consegnano gli agricoltori delle Praterie e ciò che è in magazzino.',
      grain: 'Coltura', ex: 'Esportazioni dai terminal portuali', dl: 'Consegne degli agricoltori (Manitoba, Saskatchewan, Alberta e Columbia Britannica)', st: 'Scorte commerciali in silos e terminal', cum: 'Esportazioni cumulate della campagna',
      week: 'Settimana', last: 'Ultima settimana', prev: 'Settimana precedente', yago: 'Un anno fa', chg: 'Variazione', none: 'Nessun dato disponibile al momento.', kt: 'kt', gap: 'nessun dato', unit: 'migliaia di tonnellate', table: 'Mostra la tabella delle ultime 8 settimane', thisCrop: 'campagna in corso',
      note: 'Le esportazioni sono quelle spedite dai terminal portuali autorizzati: escludono le spedizioni dirette in treno o camion verso gli Stati Uniti, quindi non sono le esportazioni totali del paese. La CGC rivede le settimane recenti, quindi una cifra può cambiare. Una settimana senza dato compare come vuoto, mai come zero. Le scorte sono quelle commerciali, non quelle aziendali.', src: 'Fonte', updated: 'Aggiornato', asof: 'Settimana terminata il' }
  };
  var N = { wheat: { es: 'Trigo (sin durum)', en: 'Wheat (excluding durum)', fr: 'Blé (hors durum)', it: 'Frumento (escluso duro)' }, durum: { es: 'Trigo duro', en: 'Amber durum', fr: 'Blé dur', it: 'Frumento duro' }, barley: { es: 'Cebada', en: 'Barley', fr: 'Orge', it: 'Orzo' },
    canola: { es: 'Canola (colza)', en: 'Canola', fr: 'Canola', it: 'Canola' }, oats: { es: 'Avena', en: 'Oats', fr: 'Avoine', it: 'Avena' }, peas: { es: 'Guisantes', en: 'Peas', fr: 'Pois', it: 'Piselli' }, lentils: { es: 'Lentejas', en: 'Lentils', fr: 'Lentilles', it: 'Lenticchie' },
    flaxseed: { es: 'Lino', en: 'Flaxseed', fr: 'Lin', it: 'Lino' }, soybeans: { es: 'Soja', en: 'Soybeans', fr: 'Soja', it: 'Soia' }, corn: { es: 'Maíz', en: 'Corn', fr: 'Maïs', it: 'Mais' }, rye: { es: 'Centeno', en: 'Rye', fr: 'Seigle', it: 'Segale' }, chickpeas: { es: 'Garbanzos', en: 'Chickpeas', fr: 'Pois chiches', it: 'Ceci' } };
  var D = null, ST = { g: 'wheat' };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tt() { return T[lang()] || T.es; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function gname(g) { return (N[g.id] && (N[g.id][lang()] || N[g.id].es)) || g.name; }
  function ms(iso) { var p = iso.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function dlab(iso) { try { return new Date(ms(iso)).toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function cur() { for (var i = 0; i < D.grains.length; i++) if (D.grains[i].id === ST.g) return D.grains[i]; return D.grains[0]; }
  function yearAgo(i) { var t = ms(D.weeks[i]) - 364 * 864e5, best = -1, bd = 1e18; for (var j = 0; j < D.weeks.length; j++) { var d = Math.abs(ms(D.weeks[j]) - t); if (d < bd) { bd = d; best = j; } } return bd <= 4 * 864e5 ? best : -1; }
  function lastIdx(a) { for (var i = a.length - 1; i >= 0; i--) if (a[i] != null) return i; return -1; }
  function pct(a, b) { if (a == null || b == null || b === 0) return ''; var c = (a / b - 1) * 100; return (c > 0 ? '+' : c < 0 ? '−' : '') + nf(Math.abs(c), 1) + ' %'; }
  function chartFor(g, key, title, color) {
    var pts = []; D.weeks.forEach(function (w, i) { var v = g[key][i]; pts.push({ x: ms(w), y: v == null ? null : v, l: w }); });
    pts = pts.slice(-78);
    var ok = pts.filter(function (p) { return p.y != null; }).length; if (ok < 4) return '';
    return '<div class="di-card" style="padding:16px 18px;margin-top:14px"><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:4px">' + esc(title.toUpperCase()) + ' (' + esc(tt().kt) + ')</div>' +
      window.DehesaChart.render({ series: [{ name: title, color: color, pts: pts }], xMode: 'time', yTitle: tt().unit, aria: gname(g) + ': ' + title, noLegend: true, zero: true,
        vFmt: function (x) { return nf(x, 1); }, yFmt: function (x) { return nf(x, 0); } }) + '</div>';
  }
  function build() {
    var root = document.getElementById('cg-body'); if (!root) return;
    var t = tt(); if (!D) { root.innerHTML = '<p class="di-movers-hint">' + t.none + '</p>'; return; }
    var g = cur(), n = D.weeks.length - 1, i0 = n - 1, iy = yearAgo(n);
    var html = '<label style="font-size:13px;display:block;max-width:320px;margin:0 0 6px">' + t.grain + '<br><select id="cg-g" class="di-compare-select">' + D.grains.map(function (x) { return '<option value="' + x.id + '"' + (x.id === g.id ? ' selected' : '') + '>' + esc(gname(x)) + '</option>'; }).join('') + '</select></label>' +
      '<p class="di-movers-hint">' + t.asof + ' ' + esc(dlab(D.asOf)) + '</p>';
    var th = 'padding:8px 6px;', rows = [['ex', t.ex], ['dl', t.dl], ['st', t.st], ['cum', t.cum]], keys = { ex: 'exports', dl: 'deliveries', st: 'stocks', cum: 'cumExports' };
    html += '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:8px"><table style="border-collapse:collapse;width:100%;min-width:560px;font-size:13.5px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="' + th + '">' + esc(gname(g).toUpperCase()) + ' · ' + esc(t.kt.toUpperCase()) + '</th><th style="' + th + 'text-align:right">' + t.last.toUpperCase() + '</th><th style="' + th + 'text-align:right">' + t.prev.toUpperCase() + '</th><th style="' + th + 'text-align:right">' + t.chg.toUpperCase() + '</th><th style="' + th + 'text-align:right">' + t.yago.toUpperCase() + '</th><th style="' + th + 'text-align:right">' + t.chg.toUpperCase() + '</th></tr>';
    rows.forEach(function (r) {
      var a = g[keys[r[0]]], v = a[n], p = a[i0], y = iy >= 0 ? a[iy] : null, cell = function (x) { return x == null ? '<span style="color:var(--text-faint)">' + t.gap + '</span>' : nf(x, 1); };
      html += '<tr style="border-top:1px solid var(--border)"><td style="' + th + '">' + esc(r[1]) + '</td><td style="' + th + 'text-align:right"><b>' + cell(v) + '</b></td><td style="' + th + 'text-align:right">' + cell(p) + '</td><td style="' + th + 'text-align:right">' + pct(v, p) + '</td><td style="' + th + 'text-align:right">' + cell(y) + '</td><td style="' + th + 'text-align:right">' + pct(v, y) + '</td></tr>';
    });
    html += '</table></div>';
    html += chartFor(g, 'exports', t.ex, '#2f6b4a') + chartFor(g, 'deliveries', t.dl, '#8a6d2f') + chartFor(g, 'stocks', t.st, '#3a5f8a');
    html += '<details style="margin-top:14px"><summary style="cursor:pointer;font-size:13px">' + t.table + '</summary><div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:8px"><table style="border-collapse:collapse;width:100%;min-width:480px;font-size:13.5px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="' + th + '">' + t.week.toUpperCase() + '</th><th style="' + th + 'text-align:right">' + t.exS.toUpperCase() + '</th><th style="' + th + 'text-align:right">' + t.dlS.toUpperCase() + '</th><th style="' + th + 'text-align:right">' + t.stS.toUpperCase() + '</th></tr>';
    for (var k = n; k > n - 8 && k >= 0; k--) {
      var c = function (a) { return a[k] == null ? '<span style="color:var(--text-faint)">' + t.gap + '</span>' : nf(a[k], 1); };
      html += '<tr style="border-top:1px solid var(--border)"><td style="' + th + '">' + esc(dlab(D.weeks[k])) + '</td><td style="' + th + 'text-align:right">' + c(g.exports) + '</td><td style="' + th + 'text-align:right">' + c(g.deliveries) + '</td><td style="' + th + 'text-align:right">' + c(g.stocks) + '</td></tr>';
    }
    html += '</table></div></details><p class="di-movers-hint" style="margin-top:12px">' + t.note + '</p>' +
      (window.DICite ? window.DICite.html('cgc', { period: D.asOf }) : '<p class="di-movers-hint">' + t.src + ': <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener">' + esc(D.source.name) + '</a> · ' + esc(D.source.license) + '</p>') +
      '<p class="di-movers-hint">' + t.updated + ': ' + esc((D.generatedAt || '').slice(0, 10)) + '</p>';
    root.innerHTML = html;
    var el = document.getElementById('cg-g'); if (el) el.onchange = function (e) { ST.g = e.target.value; build(); var m = document.getElementById('cg-g'); if (m) m.focus(); };
  }
  function shell() { var t = tt(), h = document.getElementById('pg-h1'), s = document.getElementById('pg-sub'); if (h) h.textContent = t.h; if (s) s.textContent = t.sub; document.title = 'Dehesa Index — ' + t.h; }
  window.DehesaShared.init('informacion');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); shell(); build(); };
  shell();
  Promise.all([fetch('data/canada-grain.json').then(function (r) { if (!r.ok) throw Error('x'); return r.json(); }), window.DICite ? window.DICite.load().catch(function () {}) : Promise.resolve()])
    .then(function (a) { D = a[0]; build(); }).catch(function () { build(); });
})();
