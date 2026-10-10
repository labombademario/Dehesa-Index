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
  var T2 = {
    es: { kLines: 'Líneas arancelarias', kAvg: 'Arancel medio', kFree: 'Sin arancel', kPref: 'Con preferencia', kMeas: 'Medidas vigentes', kAvgSub: 'ad valorem, media simple', shortcuts: 'Atajos',
      chips: [['Vacuno', 'beef|bovine|bovino'], ['Cerdo', 'swine|pig|porcino'], ['Trigo', 'wheat|trigo'], ['Leche y queso', 'milk|cheese|leche|queso'], ['Aceite de oliva', 'olive oil|aceite de oliva'], ['Azúcar', 'sugar|azúcar|azucar'], ['Fertilizantes', 'fertili|abonos']],
      prompt: 'Busca un producto o elige un capítulo para ver los códigos y su arancel.', clear: 'Borrar filtros', byChap: 'Arancel medio por capítulo', byChapSub: 'Media simple de las líneas con tipo porcentual. Pulsa un capítulo para ver el detalle.', viewProducts: 'Ver productos', specDom: 'Domina el arancel específico: la media se queda corta', noPct: 'sin tipo %', cmpHint: 'Arancel medio por capítulo en los cuatro mercados. La barra es proporcional dentro de esta tabla.', moreCnt: 'más', quota: 'Con cuota', col2: 'Columna 2', unit: 'Unidad', allMeasures: 'ver detalle', measCount: 'medidas vigentes' },
    en: { kLines: 'Tariff lines', kAvg: 'Average tariff', kFree: 'Duty-free', kPref: 'With preference', kMeas: 'Measures in force', kAvgSub: 'ad valorem, simple average', shortcuts: 'Shortcuts',
      chips: [['Beef', 'beef|bovine|bovino'], ['Pork', 'swine|pig|porcino'], ['Wheat', 'wheat|trigo'], ['Milk and cheese', 'milk|cheese|leche|queso'], ['Olive oil', 'olive oil|aceite de oliva'], ['Sugar', 'sugar|azúcar|azucar'], ['Fertilisers', 'fertili|abonos']],
      prompt: 'Search for a product or pick a chapter to see codes and their tariff.', clear: 'Clear filters', byChap: 'Average tariff by chapter', byChapSub: 'Simple average of lines with a percentage rate. Tap a chapter for details.', viewProducts: 'View products', specDom: 'Specific duties dominate: the average understates the cost', noPct: 'no % rate', cmpHint: 'Average tariff by chapter across the four markets. Bars are scaled within this table.', moreCnt: 'more', quota: 'With quota', col2: 'Column 2', unit: 'Unit', allMeasures: 'details', measCount: 'measures in force' },
    fr: { kLines: 'Lignes tarifaires', kAvg: 'Droit moyen', kFree: 'En franchise', kPref: 'Avec préférence', kMeas: 'Mesures en vigueur', kAvgSub: 'ad valorem, moyenne simple', shortcuts: 'Raccourcis',
      chips: [['Bœuf', 'beef|bovine|bovino'], ['Porc', 'swine|pig|porcino'], ['Blé', 'wheat|trigo'], ['Lait et fromage', 'milk|cheese|leche|queso'], ['Huile d’olive', 'olive oil|aceite de oliva'], ['Sucre', 'sugar|azúcar|azucar'], ['Engrais', 'fertili|abonos']],
      prompt: 'Cherchez un produit ou choisissez un chapitre pour voir les codes et leur droit.', clear: 'Effacer les filtres', byChap: 'Droit moyen par chapitre', byChapSub: 'Moyenne simple des lignes à taux en pourcentage. Touchez un chapitre pour le détail.', viewProducts: 'Voir les produits', specDom: 'Les droits spécifiques dominent : la moyenne sous-estime le coût', noPct: 'sans taux %', cmpHint: 'Droit moyen par chapitre dans les quatre marchés. Les barres sont proportionnelles dans ce tableau.', moreCnt: 'de plus', quota: 'Avec contingent', col2: 'Colonne 2', unit: 'Unité', allMeasures: 'détail', measCount: 'mesures en vigueur' },
    it: { kLines: 'Linee tariffarie', kAvg: 'Dazio medio', kFree: 'Esenti', kPref: 'Con preferenza', kMeas: 'Misure in vigore', kAvgSub: 'ad valorem, media semplice', shortcuts: 'Scorciatoie',
      chips: [['Manzo', 'beef|bovine|bovino'], ['Suino', 'swine|pig|porcino'], ['Grano', 'wheat|trigo'], ['Latte e formaggio', 'milk|cheese|leche|queso'], ['Olio d’oliva', 'olive oil|aceite de oliva'], ['Zucchero', 'sugar|azúcar|azucar'], ['Fertilizzanti', 'fertili|abonos']],
      prompt: 'Cerca un prodotto o scegli un capitolo per vedere i codici e il dazio.', clear: 'Cancella i filtri', byChap: 'Dazio medio per capitolo', byChapSub: 'Media semplice delle linee con aliquota percentuale. Tocca un capitolo per il dettaglio.', viewProducts: 'Vedi i prodotti', specDom: 'Prevalgono i dazi specifici: la media sottostima il costo', noPct: 'senza aliquota %', cmpHint: 'Dazio medio per capitolo nei quattro mercati. Le barre sono proporzionali all’interno di questa tabella.', moreCnt: 'altri', quota: 'Con contingente', col2: 'Colonna 2', unit: 'Unità', allMeasures: 'dettaglio', measCount: 'misure in vigore' }
  };
  Object.keys(T2).forEach(function (l) { Object.keys(T2[l]).forEach(function (k) { T[l][k] = T2[l][k]; }); });
  var COL = { active: '#17703f', ended: '#8a8a8a', expired: '#8a8a8a', pending: '#8f5f12' };
  var MCOL = { us: '#2f6f9f', eu: '#b07a12', ca: '#b24a3a', mx: '#3e7d50' };
  var BAR = 'height:8px;border-radius:4px;background:var(--border)', FILL = 'display:block;height:100%;border-radius:4px;';
  function sel(id, label, inner) { return '<label style="font-size:13px;flex:1;min-width:150px">' + label + '<br><select id="' + id + '" class="di-compare-select">' + inner + '</select></label>'; }
  function active() { return ST.q.trim() !== '' || ST.c !== 'all' || ST.r !== 'all'; }
  function filtered() {
    var qs = ST.q.trim().toLowerCase().split('|').filter(Boolean);
    return D.lines.filter(function (l) {
      if (ST.c !== 'all' && l.c !== ST.c) return false;
      if (ST.r !== 'all' && l.r !== ST.r) return false;
      if (qs.length) { var hay = (l.h + ' ' + l.d + ' ' + (D.headings[l.hd] || '')).toLowerCase(); if (!qs.some(function (x) { return hay.indexOf(x) >= 0; })) return false; }
      return true;
    });
  }
  function card(l, t) {
    var parts = l.d.split(' › '), title = parts.pop(), parent = parts.join(' › ');
    var sp = l.sp ? (l.sp.indexOf(';') >= 0 ? l.sp.split(/;\s*/) : [l.sp]) : [], chips = sp.slice(0, 3).map(function (s) { return '<span style="display:inline-block;margin:2px 4px 2px 0;padding:2px 8px;border-radius:999px;background:var(--bg-soft,rgba(0,0,0,.05));font-size:11.5px;color:var(--text-muted)">' + esc(s) + '</span>'; }).join('');
    if (sp.length > 3) chips += '<details style="display:inline"><summary style="display:inline;cursor:pointer;font-size:11.5px;color:var(--text-muted)">+' + (sp.length - 3) + ' ' + t.moreCnt + '</summary><div>' + sp.slice(3).map(function (s) { return '<span style="display:inline-block;margin:2px 4px 2px 0;padding:2px 8px;border-radius:999px;background:var(--bg-soft,rgba(0,0,0,.05));font-size:11.5px;color:var(--text-muted)">' + esc(s) + '</span>'; }).join('') + '</div></details>';
    var g = l.g || '–', big = g.length > 14 ? 'font-size:15px' : 'font-size:24px';
    var meta = [l.o && l.o !== l.g ? t.col2 + ': ' + l.o : '', l.u ? t.unit + ': ' + l.u : ''].filter(Boolean).join(' · ');
    return '<div class="di-card" style="padding:14px 16px;display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><span style="font-size:12px;color:var(--text-faint);font-variant-numeric:tabular-nums">' + esc(l.h) + '</span>' + (l.q ? '<span style="font-size:11px;font-weight:700;color:#8f5f12">' + esc(t.quota) + '</span>' : '') + '</div>' +
      '<div style="font-weight:600;line-height:1.3">' + esc(title) + '</div>' + (parent ? '<div style="font-size:12px;color:var(--text-faint);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden" title="' + esc(parent) + '">' + esc(parent) + '</div>' : '') +
      '<div style="' + big + ';font-weight:700;margin-top:2px;line-height:1.15">' + esc(g) + '</div>' + (chips ? '<div>' + chips + '</div>' : '') + (meta ? '<div style="font-size:12px;color:var(--text-muted)">' + esc(meta) + '</div>' : '') + '</div>';
  }
  function rows() {
    var t = tt();
    if (!active()) return '<p class="di-movers-hint" style="margin:10px 0">' + t.prompt + '</p>';
    var f = filtered(), shown = f.slice(0, ST.n);
    var h = '<div class="di-movers-hint" id="ar-count" style="margin:8px 0">' + f.length.toLocaleString(lang()) + ' ' + t.results + '</div>';
    if (!f.length) return h + '<p class="di-movers-hint">' + t.none + '</p>';
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px">' + shown.map(function (l) { return card(l, t); }).join('') + '</div>';
    if (f.length > shown.length) h += '<p style="margin-top:12px"><button type="button" id="ar-more" class="di-tab-btn" style="border-color:var(--border)">' + t.more + '</button></p>';
    return h;
  }
  function totals() {
    var n = 0, free = 0, fta = 0, sum = 0, adv = 0;
    Object.keys(D.chapters).forEach(function (c) { var s = D.chapters[c]; n += s.n; free += s.free; fta += s.fta; sum += s.sumadv || 0; adv += s.adv || 0; });
    return { n: n, free: n ? free * 100 / n : null, fta: n ? fta * 100 / n : null, avg: adv ? sum / adv : null };
  }
  function kpi(v, label, sub) { return '<div class="di-card" style="padding:14px 16px"><div style="font-size:28px;font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums">' + v + '</div><div style="font-size:13px;font-weight:600;margin-top:4px">' + esc(label) + '</div>' + (sub ? '<div style="font-size:11.5px;color:var(--text-faint)">' + esc(sub) + '</div>' : '') + '</div>'; }
  function measuresHtml(M, t) {
    var act = M.items.filter(function (i) { return i.status === 'active'; }).length;
    var h = '<h2 style="margin:26px 0 4px;font-size:18px">' + t.measures + '</h2><p class="di-movers-hint" style="margin:0 0 8px">' + esc(M.note[lang()] || M.note.es) + ' ' + t.asof + ': ' + dt(M.asOf) + '.</p><div class="di-card" style="padding:4px 16px">';
    M.items.forEach(function (i, ix) {
      var span = (i.from ? t.since + ' ' + dt(i.from) : '') + (i.from && i.to ? ' · ' : '') + (i.to ? t.until + ' ' + dt(i.to) : '');
      h += '<details style="' + (ix ? 'border-top:1px solid var(--border);' : '') + 'padding:10px 0"><summary style="cursor:pointer;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span aria-hidden="true" style="width:10px;height:10px;border-radius:50%;background:' + COL[i.status] + ';flex:none"></span><span style="font-weight:600;flex:1;min-width:200px">' + esc(i.title[lang()] || i.title.es) + '</span><span style="font-size:12px;font-weight:600;color:' + COL[i.status] + '">' + esc(t.status[i.status]) + '</span><span style="font-size:12px;color:var(--text-faint)">' + esc(span) + '</span></summary><p style="font-size:13px;color:var(--text-muted);margin:8px 0 0 20px">' + esc(i.text[lang()] || i.text.es) + '</p></details>';
    });
    return h + '</div><p class="di-movers-hint">' + t.sources + ': ' + M.sources.map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>'; }).join(' · ') + '</p>';
  }
  function chaptersHtml(t) {
    var cs = Object.keys(D.chapters), mx = 0;
    cs.forEach(function (c) { var a = D.chapters[c].avgadv; if (a != null && a > mx) mx = a; });
    cs.sort(function (a, b) { var x = D.chapters[a].avgadv, y = D.chapters[b].avgadv; return (y == null ? -1 : y) - (x == null ? -1 : x); });
    var h = '<h2 style="margin:26px 0 4px;font-size:18px">' + t.byChap + '</h2><p class="di-movers-hint" style="margin:0 0 8px">' + t.byChapSub + '</p><div class="di-card" style="padding:4px 16px">';
    cs.forEach(function (c, ix) {
      var s = D.chapters[c], pf = s.n ? s.free * 100 / s.n : 0, pt = s.n ? s.fta * 100 / s.n : 0, w = s.avgadv != null && mx ? Math.max(2, s.avgadv * 100 / mx) : 0, spec = s.n && (s.spec + s.comp) * 2 > s.n;
      h += '<details style="' + (ix ? 'border-top:1px solid var(--border);' : '') + 'padding:9px 0"><summary style="cursor:pointer;display:grid;grid-template-columns:minmax(120px,210px) 1fr 70px;gap:12px;align-items:center"><span style="font-size:13.5px">' + c + ' · ' + esc(chn(c)) + '</span><span style="' + BAR + '"><span style="' + FILL + 'width:' + w + '%;background:var(--accent)"></span></span><span style="text-align:right;font-weight:600;font-variant-numeric:tabular-nums">' + (s.avgadv == null ? '<span style="font-weight:400;color:var(--text-faint);font-size:12px">' + t.noPct + '</span>' : nf(s.avgadv, 1) + ' %') + '</span></summary>' +
        '<div style="margin:8px 0 2px;display:flex;flex-wrap:wrap;gap:6px 22px;font-size:12.5px;color:var(--text-muted)"><span>' + t.lines + ': <b>' + s.n + '</b></span><span>' + t.max + ': <b>' + (s.maxadv ? nf(s.maxadv, 1) + ' %' : '–') + '</b></span><span>' + t.free + ': <b>' + nf(pf, 0) + ' %</b></span><span>' + t.fta + ': <b>' + nf(pt, 0) + ' %</b></span>' + (s.trq ? '<span>TRQ: <b>' + s.trq + '</b></span>' : '') + '<a href="#ar-explorer" data-ch="' + c + '">' + t.viewProducts + '</a></div>' + (spec ? '<p style="font-size:12px;color:#8f5f12;margin:6px 0 0">' + t.specDom + '</p>' : '') + '</details>';
    });
    return h + '</div>';
  }
  function build() {
    var root = document.getElementById('aranceles-body'); if (!root || !D) return;
    var t = tt(), h = '', K = totals(), M = MS[ST.k], nAct = M ? M.items.filter(function (i) { return i.status === 'active'; }).length : null;
    h += '<div class="di-tabs-bar" role="tablist" aria-label="' + esc(t.market) + '" style="margin-top:4px">' + Object.keys(t.markets).map(function (k) { return '<button type="button" role="tab" class="di-tab-btn' + (k === ST.k ? ' active' : '') + '" aria-selected="' + (k === ST.k) + '" data-mk="' + k + '">' + esc(t.markets[k]) + '</button>'; }).join('') + '</div><p class="di-movers-hint" style="margin:0 0 12px">' + esc(t.intro[ST.k] || '') + '</p>';
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">' + kpi(K.n.toLocaleString(lang()), t.kLines) + kpi(K.avg == null ? '–' : nf(K.avg, 1) + ' %', t.kAvg, t.kAvgSub) + kpi(nf(K.free, 0) + ' %', t.kFree) + kpi(nf(K.fta, 0) + ' %', t.kPref) + (nAct != null ? kpi(String(nAct), t.kMeas) : '') + '</div>';
    var co = '<option value="all">' + t.all + '</option>' + Object.keys(D.chapters).sort().map(function (c) { return '<option value="' + c + '"' + (ST.c === c ? ' selected' : '') + '>' + c + ' · ' + esc(chn(c)) + '</option>'; }).join('');
    var ro = '<option value="all">' + t.all + '</option>' + Object.keys(t.types).map(function (k) { return '<option value="' + k + '"' + (ST.r === k ? ' selected' : '') + '>' + esc(t.types[k]) + '</option>'; }).join('');
    h += '<h2 id="ar-explorer" style="margin:26px 0 8px;font-size:18px">' + t.search + '</h2><input id="ar-q" type="search" class="di-compare-select" style="width:100%;font-size:16px;padding:12px 14px" value="' + esc(ST.q) + '" placeholder="beef, 0201, cheese…" aria-label="' + esc(t.search) + '">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0" aria-label="' + esc(t.shortcuts) + '">' + t.chips.map(function (c) { return '<button type="button" class="di-tab-btn" style="border-color:var(--border)" data-q="' + esc(c[1]) + '">' + esc(c[0]) + '</button>'; }).join('') + '</div>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:6px;align-items:flex-end">' + sel('ar-c', t.chapter, co) + sel('ar-r', t.rtype, ro) + '<button type="button" id="ar-clear" class="di-tab-btn" style="border-color:var(--border)">' + t.clear + '</button></div><div id="ar-rows">' + rows() + '</div>';
    h += chaptersHtml(t);
    if (M) h += measuresHtml(M, t);
    h += '<h2 style="margin:26px 0 4px;font-size:18px">' + t.cmp + '</h2><p class="di-movers-hint" style="margin:0 0 8px">' + t.cmpHint + ' ' + t.cmpSub + '</p><div id="ar-cmp-body"></div>';
    h += '<p class="di-movers-hint" style="margin-top:14px">' + (ST.k === 'us' ? t.note : esc(D.note || '') + ' ' + t.noteGen) + '</p><p class="di-movers-hint">' + t.src + ': <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener">' + esc(D.source.name) + '</a> · ' + t.lic + ': ' + esc(D.source.license) + ' · ' + t.rel + ': ' + esc(D.release && D.release.title || '') + ' · ' + t.upd + ': ' + esc((D.generatedAt || '').slice(0, 10)) + '</p>';
    root.innerHTML = h;
    bind(); renderCmp();
  }
  function sync() { try { var u = new URLSearchParams(); if (ST.k !== 'us') u.set('m', ST.k); if (ST.c !== 'all') u.set('ch', ST.c); if (ST.q) u.set('q', ST.q); if (ST.r !== 'all') u.set('r', ST.r); var qs = u.toString(); history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '')); } catch (e) {} }
  function refresh() { sync(); var r = document.getElementById('ar-rows'); if (r) { r.innerHTML = rows(); bindMore(); } }
  function bindMore() { var b = document.getElementById('ar-more'); if (b) b.onclick = function () { ST.n += 200; refresh(); }; }
  function renderCmp() {
    var box = document.getElementById('ar-cmp-body'); if (!box) return;
    var ks = ['us', 'eu', 'ca', 'mx'], t = tt();
    Promise.all(ks.map(loadMkt)).then(function (ds) {
      var mx = 0; ds.forEach(function (d) { if (d) Object.keys(d.chapters).forEach(function (c) { var a = d.chapters[c].avgadv; if (a != null && a > mx) mx = a; }); });
      var leg = ks.map(function (k) { return '<span style="display:inline-flex;align-items:center;gap:6px;margin-right:14px"><span aria-hidden="true" style="width:10px;height:10px;border-radius:2px;background:' + MCOL[k] + '"></span>' + esc(t.markets[k]) + '</span>'; }).join('');
      var g = 'display:grid;grid-template-columns:minmax(130px,1.2fr) repeat(4,minmax(70px,1fr));gap:10px;align-items:center';
      var h = '<div style="font-size:12.5px;margin-bottom:8px">' + leg + '</div><div class="di-card" style="padding:6px 16px;overflow-x:auto"><div style="min-width:560px">';
      Object.keys(CH).sort().forEach(function (c, ix) {
        h += '<div style="' + g + ';padding:8px 0;' + (ix ? 'border-top:1px solid var(--border)' : '') + '"><span style="font-size:13px">' + c + ' · ' + esc(chn(c)) + '</span>' + ks.map(function (k, i) {
          var x = ds[i] && ds[i].chapters[c], a = x ? x.avgadv : null, w = a != null && mx ? Math.max(2, a * 100 / mx) : 0;
          return '<span><span style="font-size:12.5px;font-weight:600;font-variant-numeric:tabular-nums">' + (!x ? '–' : a == null ? (x.free === x.n ? '0 %' : '–') : nf(a, 1) + ' %') + '</span><span style="' + BAR + ';display:block;margin-top:3px"><span style="' + FILL + 'width:' + (x && a == null && x.free === x.n ? 0 : w) + '%;background:' + MCOL[k] + '"></span></span></span>';
        }).join('') + '</div>';
      });
      box.innerHTML = h + '</div></div>';
    });
  }
  function bind() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-mk]'), function (b) { b.onclick = function () { setMkt(b.getAttribute('data-mk')); }; });
    var q = document.getElementById('ar-q'), tm;
    if (q) q.oninput = function () { clearTimeout(tm); tm = setTimeout(function () { ST.q = q.value; ST.n = 100; refresh(); }, 180); };
    var c = document.getElementById('ar-c'); if (c) c.onchange = function () { ST.c = c.value; ST.n = 100; refresh(); };
    var r = document.getElementById('ar-r'); if (r) r.onchange = function () { ST.r = r.value; ST.n = 100; refresh(); };
    var cl = document.getElementById('ar-clear'); if (cl) cl.onclick = function () { ST.q = ''; ST.c = 'all'; ST.r = 'all'; ST.n = 100; sync(); build(); };
    Array.prototype.forEach.call(document.querySelectorAll('[data-q]'), function (b) { b.onclick = function () { ST.q = b.getAttribute('data-q'); ST.n = 100; build(); sync(); var x = document.getElementById('ar-rows'); if (x && x.scrollIntoView) x.scrollIntoView({ block: 'nearest' }); }; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-ch]'), function (a) { a.onclick = function (e) { e.preventDefault(); ST.c = a.getAttribute('data-ch'); ST.n = 100; build(); sync(); var x = document.getElementById('ar-explorer'); if (x && x.scrollIntoView) x.scrollIntoView(); }; });
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
