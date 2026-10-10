/* Dehesa Index — Aranceles agroalimentarios (EE. UU., UE, Canadá, México). Lee data/us-tariffs.json, tariffs-eu.json, tariffs-ca.json, tariffs-mx.json
   y las capas manuales fechadas data/us-tariff-measures.json y data/eu-tariff-measures.json. ES5, sin librerías. */
(function () {
  'use strict';
  var T = {
    es: { market: 'Mercado importador', markets: { us: 'EE. UU.', eu: 'Unión Europea', ca: 'Canadá', mx: 'México' }, cmp: 'Comparar los cuatro mercados', cmpSub: 'Media ad valorem simple de las líneas con tipo porcentual (no ponderada por comercio) y % de líneas libres. Cuando domina el arancel específico (€/kg, ¢/kg) la media no refleja el coste real.', headings: 'Partidas', noteGen: 'Medias ad valorem simples, no ponderadas por comercio. Las medidas adicionales temporales no están en estas tablas.', trq: 'Con cuota (TRQ)', pref: 'Preferencias', title: 'Aranceles agroalimentarios', sub: 'Arancel de importación por producto en EE. UU., la Unión Europea, Canadá y México: capítulos 01-24 (agroalimentario) y 31 (fertilizantes), con preferencias, cuotas y unidades. Elige mercado y busca por producto o código.', intro: {'us': 'Tarifa armonizada (HTS) de la USITC: arancel general o NMF, preferencias por tratados, columna 2 y unidades. Más una capa fechada con las medidas recientes.', 'eu': 'Arancel Aduanero Común (TARIC) de la Comisión Europea: derecho de tercer país (NMF), contingentes arancelarios (TRQ) y preferencias de acuerdos. Más una capa fechada con las medidas recientes.', 'ca': 'Customs Tariff de la CBSA: arancel NMF y preferencias (CUSMA, CETA, CPTPP…).', 'mx': 'Tarifa de la LIGIE (SNICE): arancel general de importación por fracción.'},
      measures: 'Medidas recientes (fechadas)', status: { active: 'Vigente', ended: 'Anulada', expired: 'Terminada', pending: 'En litigio' }, since: 'Desde', until: 'Hasta', asof: 'Revisado',
      chapters: 'Resumen por capítulo', chapter: 'Capítulo', lines: 'Líneas', avg: 'Media ad valorem', max: 'Máx. ad valorem', free: '% libre', fta: 'Con preferencia',
      search: 'Buscar producto o código HTS', all: 'Todos', rtype: 'Tipo de arancel', types: { free: 'Libre', adv: 'Ad valorem', spec: 'Específico (¢/kg, $/…)', comp: 'Compuesto', other: 'Otro' },
      code: 'Código HTS', desc: 'Descripción', general: 'General (NMF)', special: 'Preferencias', col2: 'Columna 2', unit: 'Unidad', results: 'resultados', more: 'Mostrar más', none: 'Sin resultados.',
      note: 'Las descripciones se publican en inglés. «General» es el tipo NMF; «Preferencias» lista los tratados que lo reducen (siglas de la USITC). Las cuotas arancelarias (TRQ) y los aranceles adicionales por orden ejecutiva no están en esta tabla base: la capa de arriba solo resume su estado. Valores ad valorem: media simple de las líneas con tipo porcentual, no ponderada por comercio.',
      src: 'Fuente', lic: 'Licencia', rel: 'Edición', upd: 'Actualizado', sources: 'Fuentes de las medidas' },
    en: { market: 'Importing market', markets: { us: 'United States', eu: 'European Union', ca: 'Canada', mx: 'Mexico' }, cmp: 'Compare the four markets', cmpSub: 'Simple average ad valorem rate of lines with a percentage rate (not trade-weighted) and share of duty-free lines. Where specific duties (€/kg, ¢/kg) dominate, the average does not reflect the real cost.', headings: 'Headings', noteGen: 'Simple ad valorem averages, not trade-weighted. Temporary additional measures are not in these tables.', trq: 'With quota (TRQ)', pref: 'Preferences', title: 'Agri-food tariffs', sub: 'Import tariffs by product in the United States, the European Union, Canada and Mexico: chapters 01-24 (agri-food) and 31 (fertilisers), with preferences, quotas and units. Pick a market and search by product or code.', intro: {'us': 'USITC Harmonized Tariff Schedule (HTS): general (MFN) rate, treaty preferences, column 2 and units. Plus a dated layer with recent measures.', 'eu': 'European Commission Common Customs Tariff (TARIC): third-country (MFN) duty, tariff quotas (TRQ) and agreement preferences. Plus a dated layer with recent measures.', 'ca': 'CBSA Customs Tariff: MFN rate and preferences (CUSMA, CETA, CPTPP…).', 'mx': 'LIGIE tariff (SNICE): general import duty by tariff line.'},
      measures: 'Recent measures (dated)', status: { active: 'In force', ended: 'Invalidated', expired: 'Ended', pending: 'In litigation' }, since: 'From', until: 'Until', asof: 'Reviewed',
      chapters: 'Summary by chapter', chapter: 'Chapter', lines: 'Lines', avg: 'Avg ad valorem', max: 'Max ad valorem', free: '% free', fta: 'With preference',
      search: 'Search product or HTS code', all: 'All', rtype: 'Rate type', types: { free: 'Free', adv: 'Ad valorem', spec: 'Specific (¢/kg, $/…)', comp: 'Compound', other: 'Other' },
      code: 'HTS code', desc: 'Description', general: 'General (MFN)', special: 'Preferences', col2: 'Column 2', unit: 'Unit', results: 'results', more: 'Show more', none: 'No results.',
      note: 'General is the MFN rate; Preferences lists the agreements that reduce it (USITC codes). Tariff-rate quotas and additional duties imposed by executive order are not in this base table: the layer above only summarises their status. Ad valorem figures are simple averages of lines with a percentage rate, not trade-weighted.',
      src: 'Source', lic: 'Licence', rel: 'Release', upd: 'Updated', sources: 'Sources for the measures' },
    fr: { market: 'Marché importateur', markets: { us: 'États-Unis', eu: 'Union européenne', ca: 'Canada', mx: 'Mexique' }, cmp: 'Comparer les quatre marchés', cmpSub: 'Moyenne ad valorem simple des lignes à taux en pourcentage (non pondérée par les échanges) et part des lignes en franchise. Quand les droits spécifiques (€/kg, ¢/kg) dominent, la moyenne ne reflète pas le coût réel.', headings: 'Positions', noteGen: 'Moyennes ad valorem simples, non pondérées. Les mesures additionnelles temporaires ne figurent pas dans ces tableaux.', trq: 'Avec contingent (TRQ)', pref: 'Préférences', title: 'Droits de douane agroalimentaires', sub: 'Droits d’importation par produit aux États-Unis, dans l’Union européenne, au Canada et au Mexique : chapitres 01-24 (agroalimentaire) et 31 (engrais), avec préférences, contingents et unités. Choisissez un marché et cherchez par produit ou code.', intro: {'us': 'Tarif harmonisé (HTS) de l’USITC : taux général (NPF), préférences par accord, colonne 2 et unités. Plus une couche datée des mesures récentes.', 'eu': 'Tarif douanier commun (TARIC) de la Commission européenne : droit pays tiers (NPF), contingents tarifaires (TRQ) et préférences par accord. Plus une couche datée des mesures récentes.', 'ca': 'Tarif des douanes de l’ASFC : taux NPF et préférences (ACEUM, AECG, PTPGP…).', 'mx': 'Tarif LIGIE (SNICE) : droit général d’importation par fraction.'},
      measures: 'Mesures récentes (datées)', status: { active: 'En vigueur', ended: 'Invalidée', expired: 'Terminée', pending: 'En litige' }, since: 'Depuis', until: 'Jusqu’au', asof: 'Révisé',
      chapters: 'Résumé par chapitre', chapter: 'Chapitre', lines: 'Lignes', avg: 'Moy. ad valorem', max: 'Max. ad valorem', free: '% libre', fta: 'Avec préférence',
      search: 'Chercher un produit ou un code HTS', all: 'Tous', rtype: 'Type de droit', types: { free: 'Libre', adv: 'Ad valorem', spec: 'Spécifique (¢/kg, $/…)', comp: 'Composé', other: 'Autre' },
      code: 'Code HTS', desc: 'Description', general: 'Général (NPF)', special: 'Préférences', col2: 'Colonne 2', unit: 'Unité', results: 'résultats', more: 'Afficher plus', none: 'Aucun résultat.',
      note: 'Descriptions en anglais. « Général » est le taux NPF ; « Préférences » liste les accords qui le réduisent. Les contingents tarifaires et les droits additionnels par décret ne figurent pas dans ce tableau de base. Les moyennes ad valorem sont simples, non pondérées par les échanges.',
      src: 'Source', lic: 'Licence', rel: 'Édition', upd: 'Mis à jour', sources: 'Sources des mesures' },
    it: { market: 'Mercato importatore', markets: { us: 'Stati Uniti', eu: 'Unione europea', ca: 'Canada', mx: 'Messico' }, cmp: 'Confronta i quattro mercati', cmpSub: 'Media ad valorem semplice delle linee con aliquota percentuale (non ponderata per gli scambi) e quota di linee esenti. Dove prevalgono i dazi specifici (€/kg, ¢/kg) la media non riflette il costo reale.', headings: 'Voci', noteGen: 'Medie ad valorem semplici, non ponderate. Le misure aggiuntive temporanee non sono in queste tabelle.', trq: 'Con contingente (TRQ)', pref: 'Preferenze', title: 'Dazi agroalimentari', sub: 'Dazi all’importazione per prodotto negli Stati Uniti, nell’Unione europea, in Canada e in Messico: capitoli 01-24 (agroalimentare) e 31 (fertilizzanti), con preferenze, contingenti e unità. Scegli un mercato e cerca per prodotto o codice.', intro: {'us': 'Tariffa armonizzata (HTS) della USITC: aliquota generale (NPF), preferenze per accordo, colonna 2 e unità. Più un livello datato con le misure recenti.', 'eu': 'Tariffa doganale comune (TARIC) della Commissione europea: dazio paesi terzi (NPF), contingenti tariffari (TRQ) e preferenze per accordo. Più un livello datato con le misure recenti.', 'ca': 'Customs Tariff della CBSA: aliquota NPF e preferenze (CUSMA, CETA, CPTPP…).', 'mx': 'Tariffa LIGIE (SNICE): dazio generale all’importazione per voce.'},
      measures: 'Misure recenti (datate)', status: { active: 'In vigore', ended: 'Invalidata', expired: 'Terminata', pending: 'In contenzioso' }, since: 'Dal', until: 'Fino al', asof: 'Rivisto',
      chapters: 'Riepilogo per capitolo', chapter: 'Capitolo', lines: 'Linee', avg: 'Media ad valorem', max: 'Max ad valorem', free: '% libero', fta: 'Con preferenza',
      search: 'Cerca prodotto o codice HTS', all: 'Tutti', rtype: 'Tipo di dazio', types: { free: 'Libero', adv: 'Ad valorem', spec: 'Specifico (¢/kg, $/…)', comp: 'Composto', other: 'Altro' },
      code: 'Codice HTS', desc: 'Descrizione', general: 'Generale (NPF)', special: 'Preferenze', col2: 'Colonna 2', unit: 'Unità', results: 'risultati', more: 'Mostra altri', none: 'Nessun risultato.',
      note: 'Descrizioni in inglese. «Generale» è l’aliquota NPF; «Preferenze» elenca gli accordi che la riducono. I contingenti tariffari e i dazi aggiuntivi per ordine esecutivo non sono in questa tabella di base. Le medie ad valorem sono semplici, non ponderate per gli scambi.',
      src: 'Fonte', lic: 'Licenza', rel: 'Edizione', upd: 'Aggiornato', sources: 'Fonti delle misure' }
  };
  var CH = { '01': ['Animales vivos', 'Live animals'], '02': ['Carne', 'Meat'], '03': ['Pescado y marisco', 'Fish and seafood'], '04': ['Lácteos, huevos y miel', 'Dairy, eggs and honey'], '05': ['Otros productos animales', 'Other animal products'], '06': ['Plantas vivas y flores', 'Live plants and flowers'], '07': ['Hortalizas', 'Vegetables'], '08': ['Fruta y frutos secos', 'Fruit and nuts'], '09': ['Café, té y especias', 'Coffee, tea and spices'], '10': ['Cereales', 'Cereals'], '11': ['Molinería y almidones', 'Milling products'], '12': ['Oleaginosas y semillas', 'Oilseeds and seeds'], '13': ['Gomas y resinas', 'Gums and resins'], '14': ['Materias vegetales', 'Vegetable plaiting materials'], '15': ['Grasas y aceites', 'Fats and oils'], '16': ['Preparados de carne y pescado', 'Meat and fish preparations'], '17': ['Azúcar', 'Sugar'], '18': ['Cacao', 'Cocoa'], '19': ['Preparados de cereales', 'Cereal preparations'], '20': ['Conservas de fruta y hortaliza', 'Fruit and vegetable preparations'], '21': ['Preparados alimenticios diversos', 'Misc. edible preparations'], '22': ['Bebidas y vinagre', 'Beverages and vinegar'], '23': ['Residuos y piensos', 'Feed and food residues'], '24': ['Tabaco', 'Tobacco'], '31': ['Fertilizantes', 'Fertilisers'] };
  var D = null, MS = {}, ST = { q: '', c: 'all', r: 'all', n: 100, k: 'us' }, CACHE = {};
  var FILES = { us: 'data/us-tariffs.json', eu: 'data/tariffs-eu.json', ca: 'data/tariffs-ca.json', mx: 'data/tariffs-mx.json' };
  function loadMkt(k) { if (!CACHE[k]) CACHE[k] = fetch(FILES[k]).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); return CACHE[k]; }
  function loadMeasures(k) { return fetch('data/' + k + '-tariff-measures.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function setMkt(k) { loadMkt(k).then(function (d) { if (!d) return; ST.k = k; D = d; ST.c = 'all'; ST.n = 100; build(); sync(); }); }
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tt() { return T[lang()] || T.es; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { if (v == null) return '–'; try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function chn(c) { var x = CH[c]; return x ? (lang() === 'es' ? x[0] : x[1]) : c; }
  function dt(s) { if (!s) return ''; try { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return s; } }
  var COL = { active: '#17703f', ended: '#8a8a8a', expired: '#8a8a8a', pending: '#8f5f12' };
  function sel(id, label, inner) { return '<label style="font-size:13px;flex:1;min-width:150px">' + label + '<br><select id="' + id + '" class="di-compare-select">' + inner + '</select></label>'; }
  function filtered() {
    var q = ST.q.trim().toLowerCase();
    return D.lines.filter(function (l) {
      if (ST.c !== 'all' && l.c !== ST.c) return false;
      if (ST.r !== 'all' && l.r !== ST.r) return false;
      if (q && (l.h + ' ' + l.d).toLowerCase().indexOf(q) < 0 && (D.headings[l.hd] || '').toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  function rows() {
    var t = tt(), f = filtered(), shown = f.slice(0, ST.n);
    var h = '<div class="di-movers-hint" id="ar-count" style="margin:8px 0">' + f.length.toLocaleString(lang()) + ' ' + t.results + '</div>';
    if (!f.length) return h + '<p class="di-movers-hint">' + t.none + '</p>';
    var th = 'padding:8px 6px';
    h += '<div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:760px;font-size:13px"><thead><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left">' +
      '<th style="' + th + '">' + t.code.toUpperCase() + '</th><th style="' + th + '">' + t.desc.toUpperCase() + '</th><th style="' + th + '">' + t.general.toUpperCase() + '</th><th style="' + th + '">' + t.special.toUpperCase() + '</th><th style="' + th + '">' + t.col2.toUpperCase() + '</th><th style="' + th + '">' + t.unit.toUpperCase() + '</th></tr></thead><tbody>';
    shown.forEach(function (l) {
      h += '<tr style="border-top:1px solid var(--border);vertical-align:top"><td style="' + th + ';white-space:nowrap;font-variant-numeric:tabular-nums">' + esc(l.h) + '</td><td style="' + th + '">' + esc(l.d) + '</td><td style="' + th + ';font-weight:600">' + esc(l.g || '–') + '</td><td style="' + th + ';font-size:12px;color:var(--text-muted)">' + esc(l.sp || '–') + '</td><td style="' + th + '">' + esc(l.o || '–') + '</td><td style="' + th + '">' + esc(l.u || '–') + '</td></tr>';
    });
    h += '</tbody></table></div>';
    if (f.length > shown.length) h += '<p style="margin-top:10px"><button type="button" id="ar-more" class="di-btn">' + t.more + '</button></p>';
    return h;
  }
  function build() {
    var root = document.getElementById('aranceles-body'); if (!root || !D) return;
    var t = tt(), h = '';
    var mk = '<div class="di-tabs-bar" role="tablist" aria-label="' + esc(t.market) + '" style="margin-top:4px">' + Object.keys(t.markets).map(function (k) { return '<button type="button" role="tab" class="di-tab-btn' + (k === ST.k ? ' active' : '') + '" aria-selected="' + (k === ST.k) + '" data-mk="' + k + '">' + esc(t.markets[k]) + '</button>'; }).join('') + '</div><p class="di-movers-hint" style="margin:0 0 6px">' + esc(t.intro[ST.k] || '') + '</p>';
    h += mk;
    var M = MS[ST.k];
    if (M) {
      h += '<h2 style="margin:18px 0 6px;font-size:18px">' + t.measures + '</h2><p class="di-movers-hint">' + esc((M.note[lang()] || M.note.es)) + ' ' + t.asof + ': ' + dt(M.asOf) + '.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin:10px 0 6px">';
      M.items.forEach(function (i) {
        var span = (i.from ? t.since + ' ' + dt(i.from) : '') + (i.from && i.to ? ' · ' : '') + (i.to ? t.until + ' ' + dt(i.to) : '');
        h += '<div class="di-card" style="padding:14px 16px;border-left:4px solid ' + COL[i.status] + '"><div style="font-size:11px;font-weight:700;letter-spacing:.4px;color:' + COL[i.status] + '">' + esc(t.status[i.status].toUpperCase()) + '</div><div style="font-weight:600;margin:4px 0">' + esc(i.title[lang()] || i.title.es) + '</div><div style="font-size:13px;color:var(--text-muted)">' + esc(i.text[lang()] || i.text.es) + '</div><div style="font-size:12px;color:var(--text-faint);margin-top:6px">' + esc(span) + '</div></div>';
      });
      h += '</div><p class="di-movers-hint">' + t.sources + ': ' + M.sources.map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>'; }).join(' · ') + '</p>';
    }
    h += '<h2 style="margin:26px 0 8px;font-size:18px">' + t.chapters + '</h2><div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:620px;font-size:13.5px"><thead><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:8px 6px">' + t.chapter.toUpperCase() + '</th><th style="padding:8px 6px;text-align:right">' + t.lines.toUpperCase() + '</th><th style="padding:8px 6px;text-align:right">' + t.avg.toUpperCase() + '</th><th style="padding:8px 6px;text-align:right">' + t.max.toUpperCase() + '</th><th style="padding:8px 6px;text-align:right">' + t.free.toUpperCase() + '</th><th style="padding:8px 6px;text-align:right">' + t.fta.toUpperCase() + '</th></tr></thead><tbody>';
    Object.keys(D.chapters).sort().forEach(function (c) {
      var s = D.chapters[c], pf = s.n ? s.free * 100 / s.n : null, pt = s.n ? s.fta * 100 / s.n : null;
      h += '<tr style="border-top:1px solid var(--border)"><td style="padding:8px 6px"><a href="#ar-explorer" data-ch="' + c + '">' + c + ' · ' + esc(chn(c)) + '</a></td><td style="padding:8px 6px;text-align:right">' + s.n + '</td><td style="padding:8px 6px;text-align:right">' + (s.avgadv == null ? '–' : nf(s.avgadv, 1) + ' %') + '</td><td style="padding:8px 6px;text-align:right">' + (s.maxadv ? nf(s.maxadv, 1) + ' %' : '–') + '</td><td style="padding:8px 6px;text-align:right">' + nf(pf, 0) + ' %</td><td style="padding:8px 6px;text-align:right">' + nf(pt, 0) + ' %</td></tr>';
    });
    h += '</tbody></table></div>';
    var co = '<option value="all">' + t.all + '</option>' + Object.keys(D.chapters).sort().map(function (c) { return '<option value="' + c + '"' + (ST.c === c ? ' selected' : '') + '>' + c + ' · ' + esc(chn(c)) + '</option>'; }).join('');
    var ro = '<option value="all">' + t.all + '</option>' + Object.keys(t.types).map(function (k) { return '<option value="' + k + '"' + (ST.r === k ? ' selected' : '') + '>' + esc(t.types[k]) + '</option>'; }).join('');
    h += '<details id="ar-cmp" style="margin-top:18px"' + (ST.cmp ? ' open' : '') + '><summary style="cursor:pointer;font-weight:600;font-size:15px">' + t.cmp + '</summary><p class="di-movers-hint">' + t.cmpSub + '</p><div id="ar-cmp-body"></div></details>';
    h += '<h2 id="ar-explorer" style="margin:26px 0 8px;font-size:18px">' + t.search + '</h2><div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:6px"><label style="font-size:13px;flex:2;min-width:220px">' + t.search + '<br><input id="ar-q" type="search" class="di-compare-select" value="' + esc(ST.q) + '" placeholder="beef, 0201, cheese…"></label>' + sel('ar-c', t.chapter, co) + sel('ar-r', t.rtype, ro) + '</div><div id="ar-rows">' + rows() + '</div>';
    h += '<p class="di-movers-hint" style="margin-top:14px">' + (ST.k === 'us' ? t.note : esc(D.note || '') + ' ' + t.noteGen) + '</p><p class="di-movers-hint">' + t.src + ': <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener">' + esc(D.source.name) + '</a> · ' + t.lic + ': ' + esc(D.source.license) + ' · ' + t.rel + ': ' + esc(D.release && D.release.title || '') + ' · ' + t.upd + ': ' + esc((D.generatedAt || '').slice(0, 10)) + '</p>';
    root.innerHTML = h;
    bind();
  }
  function sync() { try { var u = new URLSearchParams(); if (ST.k !== 'us') u.set('m', ST.k); if (ST.c !== 'all') u.set('ch', ST.c); if (ST.q) u.set('q', ST.q); if (ST.r !== 'all') u.set('r', ST.r); var qs = u.toString(); history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '')); } catch (e) {} }
  function refresh() { sync(); var r = document.getElementById('ar-rows'); if (r) { r.innerHTML = rows(); bindMore(); } }
  function bindMore() { var b = document.getElementById('ar-more'); if (b) b.onclick = function () { ST.n += 200; refresh(); }; }
  function cmpCell(x) {
    if (!x) return '–';
    var a = x.avgadv == null ? (x.free === x.n ? '0 %' : '–') : nf(x.avgadv, 1) + ' %';
    return '<span style="font-variant-numeric:tabular-nums">' + a + '</span> <span style="font-size:11px;color:var(--text-faint)">(' + nf(x.n ? x.free * 100 / x.n : 0, 0) + ' % ' + (lang() === 'es' ? 'libre' : lang() === 'fr' ? 'libre' : lang() === 'it' ? 'libero' : 'free') + (x.trq ? ' · TRQ ' + x.trq : '') + ')</span>';
  }
  function renderCmp() {
    var box = document.getElementById('ar-cmp-body'); if (!box) return;
    var ks = ['us', 'eu', 'ca', 'mx'], t = tt();
    Promise.all(ks.map(loadMkt)).then(function (ds) {
      var th = 'padding:8px 6px;text-align:right', h = '<div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:640px;font-size:13px"><thead><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint)"><th style="padding:8px 6px;text-align:left">' + t.chapter.toUpperCase() + '</th>' + ks.map(function (k) { return '<th style="' + th + '">' + esc(t.markets[k]).toUpperCase() + '</th>'; }).join('') + '</tr></thead><tbody>';
      Object.keys(CH).sort().forEach(function (c) {
        h += '<tr style="border-top:1px solid var(--border)"><td style="padding:8px 6px">' + c + ' · ' + esc(chn(c)) + '</td>' + ks.map(function (k, i) { var d = ds[i]; return '<td style="' + th + '">' + cmpCell(d && d.chapters[c]) + '</td>'; }).join('') + '</tr>';
      });
      box.innerHTML = h + '</tbody></table></div>';
    });
  }
  function bind() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-mk]'), function (b) { b.onclick = function () { setMkt(b.getAttribute('data-mk')); }; });
    var cm = document.getElementById('ar-cmp'); if (cm) { cm.ontoggle = function () { ST.cmp = cm.open; if (cm.open) renderCmp(); }; if (cm.open) renderCmp(); }
    var q = document.getElementById('ar-q'), tm;
    if (q) q.oninput = function () { clearTimeout(tm); tm = setTimeout(function () { ST.q = q.value; ST.n = 100; refresh(); }, 180); };
    var c = document.getElementById('ar-c'); if (c) c.onchange = function () { ST.c = c.value; ST.n = 100; refresh(); };
    var r = document.getElementById('ar-r'); if (r) r.onchange = function () { ST.r = r.value; ST.n = 100; refresh(); };
    Array.prototype.forEach.call(document.querySelectorAll('[data-ch]'), function (a) { a.onclick = function (e) { e.preventDefault(); ST.c = a.getAttribute('data-ch'); ST.n = 100; build(); var x = document.getElementById('ar-explorer'); if (x && x.scrollIntoView) x.scrollIntoView(); }; });
    bindMore();
  }
  function shell() { var t = tt(), h = document.getElementById('ar-h1'), s = document.getElementById('ar-sub'); if (h) h.textContent = t.title; if (s) s.textContent = t.sub; document.title = t.title + ' | Dehesa Index'; }
  (function () { var q = new URLSearchParams(window.location.search); if (FILES[q.get('m')]) ST.k = q.get('m'); if (q.get('ch') && CH[q.get('ch')]) ST.c = q.get('ch'); if (q.get('q')) ST.q = q.get('q'); if (T.es.types[q.get('r')]) ST.r = q.get('r'); })();
  window.DehesaShared.init('informacion');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); shell(); build(); };
  shell();
  Promise.all([loadMkt(ST.k).then(function (d) { if (!d) throw Error('x'); return d; }), loadMeasures('us'), loadMeasures('eu')])
    .then(function (rs) { D = rs[0]; MS.us = rs[1]; MS.eu = rs[2]; build(); })
    .catch(function () { var b = document.getElementById('aranceles-body'); if (b) b.innerHTML = '<p class="di-movers-hint">' + tt().none + '</p>'; });
})();
