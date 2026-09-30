/* Dehesa Index — Producción y comercio por país. Lee data/country-stats.json (Statistics Denmark, CBS, ABS, MAPA España; CC BY 4.0).
   Solo series reales publicadas por la fuente; nada se estima ni se rellena. */
(function () {
  'use strict';
  var T = {
    es: { title: 'Producción y comercio por país', sub: 'España (precios percibidos por el agricultor, fertilizantes y piensos desde 1990), Francia (cereales, carne y precios pagados al productor, FranceAgriMer), Alemania (leche, sacrificio, fruta y hortaliza e índices, BLE y Destatis), Bélgica (leche, sacrificio, índices de precios; Statbel) y producción, sacrificio, cultivos, costes y exportaciones de Dinamarca, Países Bajos y Australia, con datos oficiales y su histórico completo.',
      country: 'País', group: 'Tipo', series: 'Serie', range: 'Periodo', all: 'Todos', production: 'Producción y sacrificio', crops: 'Cultivos', trade: 'Exportaciones', costs: 'Costes de explotación', prices_lv: 'Precios ganaderos', quotes: 'Cotizaciones de mercado', milk: 'Leche (precios y volúmenes)', milk_regions: 'Leche: precio por región', meat_regions: 'Sacrificio: precio por región', prices_paid: 'Precios pagados al productor', prices_fv: 'Precios de frutas y hortalizas', inputs_f: 'Fertilizantes (precios pagados)', inputs_a: 'Piensos (precios pagados)', idx_perc: 'Índices de precios percibidos', idx_pag: 'Índices de precios pagados', incub: 'Incubación avícola', inputs: 'Insumos (precios)', prices: 'Precios e índices', livestock: 'Censo ganadero', environment: 'Estiércol y medio ambiente', latest: 'Último dato', change: 'Var. vs. anterior', period: 'Periodo', unit: 'Unidad',
      r5: '5 años', r10: '10 años', r20: '20 años', rmax: 'Máximo', date: 'Fecha', table: 'Ver todas las series', src: 'Fuente', lic: 'Licencia', updated: 'Actualizado', note: 'Datos oficiales tal como los publica cada fuente; los nombres de las series se mantienen en inglés. Las exportaciones de Australia son valor en dólares australianos, no volumen. Los índices australianos usan la base que publica el ABS. El último periodo puede ser provisional.', none: 'Sin datos disponibles.',
      countries: { ES: 'España', FR: 'Francia', DE: 'Alemania', BE: 'Bélgica', DK: 'Dinamarca', NL: 'Países Bajos', AU: 'Australia' }, freq: { monthly: 'mensual', weekly: 'semanal', quarterly: 'trimestral', annual: 'anual', semiannual: 'semestral' } },
    en: { title: 'Production and trade by country', sub: 'Spain (farm-gate prices, fertiliser and feed prices since 1990), France (cereal and meat quotations, farm-gate prices paid, FranceAgriMer), Germany (milk, slaughter, fruit and vegetables, indices; BLE and Destatis), Belgium (milk, slaughter, price indices; Statbel) plus production, slaughter, crops, costs and exports for Denmark, the Netherlands and Australia, from official data with full history.',
      country: 'Country', group: 'Type', series: 'Series', range: 'Period', all: 'All', production: 'Production and slaughter', crops: 'Crops', trade: 'Exports', costs: 'Farm costs', prices_lv: 'Livestock prices', quotes: 'Market quotations', milk: 'Milk (prices and volumes)', milk_regions: 'Milk: price by region', meat_regions: 'Slaughter prices by region', prices_paid: 'Farm-gate prices paid', prices_fv: 'Fruit and vegetable prices', inputs_f: 'Fertiliser prices paid', inputs_a: 'Feed prices paid', idx_perc: 'Price indices received', idx_pag: 'Price indices paid', incub: 'Hatchery (poultry)', inputs: 'Input prices', prices: 'Prices and indices', livestock: 'Livestock census', environment: 'Manure and environment', latest: 'Latest', change: 'Change vs. previous', period: 'Period', unit: 'Unit',
      r5: '5 years', r10: '10 years', r20: '20 years', rmax: 'Max', date: 'Date', table: 'See all series', src: 'Source', lic: 'Licence', updated: 'Updated', note: 'Official data as published by each source. Australian exports are value in Australian dollars, not volume. The latest period may be provisional.', none: 'No data available.',
      countries: { ES: 'Spain', FR: 'France', DE: 'Germany', BE: 'Belgium', DK: 'Denmark', NL: 'Netherlands', AU: 'Australia' }, freq: { monthly: 'monthly', weekly: 'weekly', quarterly: 'quarterly', annual: 'annual', semiannual: 'twice a year' } },
    fr: { title: 'Production et commerce par pays', sub: 'Espagne (prix à la production, engrais et aliments depuis 1990), France (cotations des céréales et des viandes, prix payés aux producteurs, FranceAgriMer), Allemagne (lait, abattage, fruits et légumes, indices ; BLE et Destatis), Belgique (lait, abattages, indices de prix ; Statbel) et production, abattages, cultures, coûts et exportations du Danemark, des Pays-Bas et de l’Australie, avec données officielles et historique complet.',
      country: 'Pays', group: 'Type', series: 'Série', range: 'Période', all: 'Tous', production: 'Production et abattages', crops: 'Cultures', trade: 'Exportations', costs: 'Coûts d’exploitation', prices_lv: 'Prix de l’élevage', quotes: 'Cotations de marché', milk: 'Lait (prix et volumes)', milk_regions: 'Lait : prix par région', meat_regions: 'Abattage : prix par région', prices_paid: 'Prix payés aux producteurs', prices_fv: 'Prix des fruits et légumes', inputs_f: 'Prix des engrais payés', inputs_a: 'Prix des aliments payés', idx_perc: 'Indices des prix reçus', idx_pag: 'Indices des prix payés', incub: 'Couvoirs (volailles)', inputs: 'Prix des intrants', prices: 'Prix et indices', livestock: 'Recensement du cheptel', environment: 'Fumier et environnement', latest: 'Dernière donnée', change: 'Var. vs précédent', period: 'Période', unit: 'Unité',
      r5: '5 ans', r10: '10 ans', r20: '20 ans', rmax: 'Maximum', date: 'Date', table: 'Voir toutes les séries', src: 'Source', lic: 'Licence', updated: 'Mis à jour', note: 'Données officielles telles que publiées par chaque source ; les noms des séries restent en anglais. Les exportations australiennes sont en valeur (dollars australiens), pas en volume. La dernière période peut être provisoire.', none: 'Aucune donnée disponible.',
      countries: { ES: 'Espagne', FR: 'France', DE: 'Allemagne', BE: 'Belgique', DK: 'Danemark', NL: 'Pays-Bas', AU: 'Australie' }, freq: { monthly: 'mensuelle', weekly: 'hebdomadaire', quarterly: 'trimestrielle', annual: 'annuelle', semiannual: 'semestrielle' } },
    it: { title: 'Produzione e commercio per paese', sub: 'Spagna (prezzi alla produzione, fertilizzanti e mangimi dal 1990), Francia (quotazioni di cereali e carne, prezzi pagati ai produttori, FranceAgriMer), Germania (latte, macellazione, frutta e ortaggi, indici; BLE e Destatis), Belgio (latte, macellazioni, indici dei prezzi; Statbel) e produzione, macellazioni, colture, costi ed esportazioni di Danimarca, Paesi Bassi e Australia, con dati ufficiali e storico completo.',
      country: 'Paese', group: 'Tipo', series: 'Serie', range: 'Periodo', all: 'Tutti', production: 'Produzione e macellazioni', crops: 'Colture', trade: 'Esportazioni', costs: 'Costi aziendali', prices_lv: 'Prezzi zootecnici', quotes: 'Quotazioni di mercato', milk: 'Latte (prezzi e volumi)', milk_regions: 'Latte: prezzo per regione', meat_regions: 'Macellazione: prezzo per regione', prices_paid: 'Prezzi pagati ai produttori', prices_fv: 'Prezzi di frutta e ortaggi', inputs_f: 'Prezzi dei fertilizzanti pagati', inputs_a: 'Prezzi dei mangimi pagati', idx_perc: 'Indici dei prezzi ricevuti', idx_pag: 'Indici dei prezzi pagati', incub: 'Incubatoi (avicoli)', inputs: 'Prezzi degli input', prices: 'Prezzi e indici', livestock: 'Censimento del bestiame', environment: 'Letame e ambiente', latest: 'Ultimo dato', change: 'Var. vs precedente', period: 'Periodo', unit: 'Unità',
      r5: '5 anni', r10: '10 anni', r20: '20 anni', rmax: 'Massimo', date: 'Data', table: 'Vedi tutte le serie', src: 'Fonte', lic: 'Licenza', updated: 'Aggiornato', note: 'Dati ufficiali come pubblicati da ciascuna fonte; i nomi delle serie restano in inglese. Le esportazioni australiane sono in valore (dollari australiani), non in volume. L’ultimo periodo può essere provvisorio.', none: 'Nessun dato disponibile.',
      countries: { ES: 'Spagna', FR: 'Francia', DE: 'Germania', BE: 'Belgio', DK: 'Danimarca', NL: 'Paesi Bassi', AU: 'Australia' }, freq: { monthly: 'mensile', weekly: 'settimanale', quarterly: 'trimestrale', annual: 'annuale', semiannual: 'semestrale' } }
  };
  var DATA = null, ST = { c: 'ES', g: 'all', s: null, r: 'max' };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tt() { return T[lang()] || T.es; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function dec(v) { var a = Math.abs(v); return a >= 1000 ? 0 : a >= 100 ? 1 : a >= 10 ? 1 : 2; }
  function ts(p) { // "1995-01" | "2026-Q2" | "2026" -> ms UTC
    var m;
    if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(p))) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
    if ((m = /^(\d{4})-(\d{2})$/.exec(p))) return Date.UTC(+m[1], +m[2] - 1, 1);
    if ((m = /^(\d{4})-Q(\d)$/.exec(p))) return Date.UTC(+m[1], (+m[2] - 1) * 3, 1);
    if ((m = /^(\d{4})$/.exec(p))) return Date.UTC(+m[1], 0, 1);
    return NaN;
  }
  function plabel(p, freq) {
    if (freq === 'weekly' || /^\d{4}-\d{2}-\d{2}$/.test(p)) { try { return new Date(ts(p)).toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return p; } }
    if (freq === 'monthly' || /^\d{4}-\d{2}$/.test(p)) { try { return new Date(ts(p)).toLocaleDateString(lang(), { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return p; } }
    return p;
  }
  function chartFor(s) {
    var t = tt(), years = { '5': 5, '10': 10, '20': 20 }[ST.r], pts = s.points.slice();
    if (years) { var last = ts(pts[pts.length - 1][0]), from = last - years * 365.25 * 864e5; pts = pts.filter(function (p) { return ts(p[0]) >= from; }); }
    var series = [{ name: s.label, color: '#2f6b4a', pts: pts.map(function (p) { return { x: ts(p[0]), y: p[1], l: plabel(p[0], s.frequency) }; }) }];
    var d = dec(s.latest);
    return window.DehesaChart.render({ series: series, xMode: 'time', xTitle: t.date, yTitle: s.unit, aria: s.label + ' (' + s.unit + ')', noLegend: true, vFmt: function (v) { return nf(v, d); },
      xFmt: s.frequency === 'annual' ? function (x) { return new Date(x).getUTCFullYear(); } : undefined });
  }
  function build() {
    var root = document.getElementById('paises-body'); if (!root || !DATA) return;
    var t = tt(), c = DATA.countries[ST.c] || DATA.countries.ES || DATA.countries.DK;
    var list = c.series.filter(function (s) { return ST.g === 'all' || s.group === ST.g; });
    if (!list.some(function (s) { return s.id === ST.s; })) ST.s = list.length ? list[0].id : null;
    var cur = list.filter(function (s) { return s.id === ST.s; })[0];
    var countries = Object.keys(DATA.countries).filter(function (k) { return DATA.countries[k].series.length; }).sort(function (x, y) { var o = { ES: 0, FR: 1, DE: 2, BE: 3 }; return (o[x] == null ? 9 : o[x]) - (o[y] == null ? 9 : o[y]); });
    var groups = ['all'].concat(['production', 'crops', 'livestock', 'trade', 'quotes', 'prices', 'prices_paid', 'milk', 'milk_regions', 'prices_lv', 'meat_regions', 'prices_fv', 'inputs', 'inputs_f', 'inputs_a', 'idx_perc', 'idx_pag', 'costs', 'environment'].filter(function (g) { return c.series.some(function (s) { return s.group === g; }); }));
    var opt = function (arr, sel, lab) { return arr.map(function (k) { return '<option value="' + esc(k) + '"' + (k === sel ? ' selected' : '') + '>' + esc(lab(k)) + '</option>'; }).join(''); };
    var sel = function (id, label, inner) { return '<label style="font-size:13px;flex:1;min-width:150px">' + label + '<br><select id="' + id + '" class="di-compare-select">' + inner + '</select></label>'; };
    var rng = ['5', '10', '20', 'max'];
    var html = '<div style="display:flex;gap:14px;flex-wrap:wrap;margin:0 0 14px">' +
      sel('ps-c', t.country, opt(countries, ST.c, function (k) { return t.countries[k] || k; })) +
      sel('ps-g', t.group, opt(groups, ST.g, function (k) { return k === 'all' ? t.all : t[k]; })) +
      sel('ps-s', t.series, opt(list.map(function (s) { return s.id; }), ST.s, function (id) { return list.filter(function (s) { return s.id === id; })[0].label; })) +
      sel('ps-r', t.range, opt(rng, ST.r, function (k) { return k === 'max' ? t.rmax : t['r' + k]; })) + '</div>';
    if (cur) {
      var ch = cur.changePct;
      html += '<div class="di-card" style="padding:16px 18px"><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:4px">' + esc(cur.label.toUpperCase()) + ' (' + esc(cur.unit) + ')</div>' + chartFor(cur) +
        '<div class="di-movers-hint" style="margin-top:6px">' + t.latest + ' (' + esc(plabel(cur.latestPeriod, cur.frequency)) + '): <b>' + nf(cur.latest, dec(cur.latest)) + ' ' + esc(cur.unit) + '</b>' + (ch == null ? '' : ' · ' + (ch > 0 ? '+' : ch < 0 ? '−' : '') + nf(Math.abs(ch), 1) + ' %') + ' · ' + t.freq[cur.frequency] + '</div></div>';
    } else html += '<p class="di-movers-hint">' + t.none + '</p>';
    html += '<details style="margin-top:14px"><summary style="cursor:pointer;font-size:13px">' + t.table + '</summary><div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:8px"><table style="border-collapse:collapse;width:100%;min-width:520px;font-size:13.5px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:8px 6px">' + t.series.toUpperCase() + '</th><th style="padding:8px 6px;text-align:right">' + t.latest.toUpperCase() + '</th><th style="padding:8px 6px;text-align:right">' + t.change.toUpperCase() + '</th><th style="padding:8px 6px">' + t.period.toUpperCase() + '</th><th style="padding:8px 6px">' + t.unit.toUpperCase() + '</th></tr>' +
      c.series.map(function (s) { return '<tr style="border-top:1px solid var(--border)"><td style="padding:8px 6px">' + esc(s.label) + '</td><td style="padding:8px 6px;text-align:right">' + nf(s.latest, dec(s.latest)) + '</td><td style="padding:8px 6px;text-align:right">' + (s.changePct == null ? '' : (s.changePct > 0 ? '+' : s.changePct < 0 ? '−' : '') + nf(Math.abs(s.changePct), 1) + ' %') + '</td><td style="padding:8px 6px">' + esc(plabel(s.latestPeriod, s.frequency)) + '</td><td style="padding:8px 6px">' + esc(s.unit) + '</td></tr>'; }).join('') + '</table></div></details>' +
      '<p class="di-movers-hint" style="margin-top:12px">' + t.note + '</p><p class="di-movers-hint">' + t.src + ': <a href="' + esc(c.source.url) + '" target="_blank" rel="noopener">' + esc(c.source.name) + '</a> · ' + t.lic + ': ' + esc(c.source.license) + ' · ' + t.updated + ': ' + esc((DATA.generatedAt || '').slice(0, 10)) + '</p>';
    root.innerHTML = html;
    var bind = function (id, key) { var el = document.getElementById(id); if (el) el.onchange = function (e) { ST[key] = e.target.value; if (key === 'c') { ST.g = 'all'; ST.s = null; } if (key === 'g') ST.s = null; build(); var n = document.getElementById(id); if (n) n.focus(); }; };
    bind('ps-c', 'c'); bind('ps-g', 'g'); bind('ps-s', 's'); bind('ps-r', 'r');
  }
  function shell() { var t = tt(); var h = document.getElementById('pg-h1'), s = document.getElementById('pg-sub'); if (h) h.textContent = t.title; if (s) s.textContent = t.sub; document.title = 'Dehesa Index — ' + t.title; }
  window.DehesaShared.init('informacion');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); shell(); build(); };
  shell();
  var q = new URLSearchParams(window.location.search); if (q.get('c')) ST.c = q.get('c').toUpperCase();
  Promise.all([fetch('data/country-stats.json').then(function (r) { if (!r.ok) throw Error('x'); return r.json(); }), fetch('data/spain-stats.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), fetch('data/france-stats.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), fetch('data/germany-stats.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), fetch('data/belgium-stats.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })]).then(function (rs) { var d = rs[0]; [rs[1], rs[2], rs[3], rs[4]].forEach(function (x) { if (x && x.countries) { Object.keys(x.countries).forEach(function (k) { d.countries[k] = x.countries[k]; }); d.spainUpdated = d.spainUpdated || x.generatedAt; } }); DATA = d; if (!d.countries[ST.c] || !d.countries[ST.c].series.length) ST.c = 'ES'; build(); })
    .catch(function () { var b = document.getElementById('paises-body'); if (b) b.innerHTML = '<p class="di-movers-hint">' + tt().none + '</p>'; });
})();
