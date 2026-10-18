/* Dehesa Index — Rendimientos y superficie por región de los países de la zona euro (Eurostat, estadísticas agrarias regionales: data/eu-regions-XX.json).
   Una pestaña por país sobre js/ca-explorer.js. Superficie (miles de ha) y producción (miles de t) tal como las publica Eurostat; el rendimiento es producción ÷ superficie (derivado, rotulado).
   El total nacional es la suma de las regiones solo en los años en que todas tienen dato (nunca se rellena un hueco). España mantiene su pestaña con datos del MAPA. ES5. */
(function () {
  'use strict';
  var EA = ['AT', 'BE', 'BG', 'HR', 'FI', 'FR', 'DE', 'EL', 'IE', 'IT', 'LT', 'NL', 'PT', 'SK', 'SI'];
  // Contornos ya generados (scripts/build-region-maps.py): archivo en vendor/ y variable global; los ids coinciden con las regiones de eu-regions-XX.json. Se cargan al abrir la pestaña.
  var MAPS = { AT: ['at-laender', 'AT_LAENDER'], BE: ['be-provinces', 'BE_PROVINCES'], BG: ['bg-regions', 'BG_REGIONS'], HR: ['hr-regions', 'HR_REGIONS'], FI: ['fi-regions', 'FI_REGIONS'], FR: ['fr-regions', 'FR_REGIONS'], DE: ['de-laender', 'DE_LAENDER'], EL: ['el-regions', 'EL_REGIONS'], IE: ['ie-regions', 'IE_REGIONS'], IT: ['it-regions', 'IT_REGIONS'], LT: ['lt-regions', 'LT_REGIONS'], NL: ['nl-provinces', 'NL_PROVINCES'], PT: ['pt-regions', 'PT_REGIONS'], SK: ['sk-regions', 'SK_REGIONS'], SI: ['si-regions', 'SI_REGIONS'] };
  function loadMap(cc) { var m = MAPS[cc]; if (!m || window['DEHESA_' + m[1]]) return Promise.resolve(); return new Promise(function (ok) { var sc = document.createElement('script'); sc.src = 'vendor/' + m[0] + '.js'; sc.onload = sc.onerror = function () { ok(); }; document.head.appendChild(sc); }); }
  var ISO = { EL: 'GR' };
  var CROPS = [
    ['C0000', ['Cereales (grano)', 'Cereals (grain)', 'Céréales (grain)', 'Cereali (granella)']], ['C1110', ['Trigo blando', 'Common wheat', 'Blé tendre', 'Frumento tenero']], ['C1120', ['Trigo duro', 'Durum wheat', 'Blé dur', 'Frumento duro']],
    ['C1200', ['Centeno', 'Rye', 'Seigle', 'Segale']], ['C1300', ['Cebada', 'Barley', 'Orge', 'Orzo']], ['C1500', ['Maíz grano', 'Grain maize', 'Maïs grain', 'Mais da granella']],
    ['R1000', ['Patata', 'Potatoes', 'Pomme de terre', 'Patata']], ['R2000', ['Remolacha azucarera', 'Sugar beet', 'Betterave sucrière', 'Barbabietola da zucchero']],
    ['I1110', ['Colza', 'Rapeseed', 'Colza', 'Colza']], ['I1120', ['Girasol', 'Sunflower', 'Tournesol', 'Girasole']], ['I1130', ['Soja', 'Soya', 'Soja', 'Soia']],
    ['P0000', ['Leguminosas grano y proteaginosas', 'Dry pulses and protein crops', 'Légumineuses à grains et protéagineux', 'Legumi secchi e proteaginose']], ['G3000', ['Maíz forrajero', 'Green maize', 'Maïs fourrage', 'Mais da foraggio']],
    ['T0000', ['Cítricos', 'Citrus', 'Agrumes', 'Agrumi']], ['O1000', ['Olivar', 'Olives', 'Oliviers', 'Olivo']], ['F0000', ['Frutales, bayas y frutos secos', 'Fruit, berries and nuts', 'Fruits, baies et fruits à coque', 'Frutta, bacche e frutta a guscio']],
    ['W1000', ['Viñedo', 'Vines (grapes)', 'Vignes', 'Vite']], ['UAA', ['Superficie agraria útil', 'Utilised agricultural area', 'Surface agricole utilisée', 'Superficie agricola utilizzata']],
    ['ARA', ['Tierra arable', 'Arable land', 'Terres arables', 'Seminativi']], ['J0000', ['Prados y pastos permanentes', 'Permanent grassland', 'Prairies permanentes', 'Prati permanenti']]
  ];
  var LG = ['es', 'en', 'fr', 'it'];
  function cname(cc, lg) { try { return new Intl.DisplayNames([lg], { type: 'region' }).of(ISO[cc] || cc); } catch (e) { return cc; } }
  var B = {
    es: { tabUS: 'EE. UU. y otros', item: 'Cultivo', measure: 'Cifra', period: 'Año', area: 'Superficie', prod: 'Producción', yield: 'Rendimiento (derivado)', vsPrev: 'frente al año anterior', oneYear: 'Solo hay un año publicado para este cultivo: todavía no hay evolución que mostrar.', hist: 'Evolución nacional', prov: 'Por región', value: 'Valor', change: 'Variación', province: 'Región', pick: 'Pulsa una región en la tabla para compararla con el total.', clear: 'Quitar la región', open: 'Perfil', noData: 'Sin datos disponibles.', noProv: 'Sin dato publicado para esta cifra y año.', last: 'Último año' },
    en: { tabUS: 'United States and others', item: 'Crop', measure: 'Measure', period: 'Year', area: 'Area', prod: 'Production', yield: 'Yield (derived)', vsPrev: 'vs. previous year', oneYear: 'Only one year is published for this crop: there is no trend to show yet.', hist: 'National trend', prov: 'By region', value: 'Value', change: 'Change', province: 'Region', pick: 'Select a region in the table to compare it with the total.', clear: 'Clear region', open: 'Profile', noData: 'No data available.', noProv: 'No published value for this measure and year.', last: 'Latest year' },
    fr: { tabUS: 'États-Unis et autres', item: 'Culture', measure: 'Chiffre', period: 'Année', area: 'Surface', prod: 'Production', yield: 'Rendement (dérivé)', vsPrev: 'par rapport à l’an dernier', oneYear: 'Une seule année est publiée pour cette culture : pas encore d’évolution à montrer.', hist: 'Évolution nationale', prov: 'Par région', value: 'Valeur', change: 'Variation', province: 'Région', pick: 'Sélectionnez une région dans le tableau pour la comparer au total.', clear: 'Retirer la région', open: 'Profil', noData: 'Aucune donnée disponible.', noProv: 'Aucune valeur publiée pour ce chiffre et cette année.', last: 'Dernière année' },
    it: { tabUS: 'Stati Uniti e altri', item: 'Coltura', measure: 'Dato', period: 'Anno', area: 'Superficie', prod: 'Produzione', yield: 'Resa (derivata)', vsPrev: 'rispetto all’anno scorso', oneYear: 'Per questa coltura è pubblicato un solo anno: non c’è ancora un andamento da mostrare.', hist: 'Andamento nazionale', prov: 'Per regione', value: 'Valore', change: 'Variazione', province: 'Regione', pick: 'Seleziona una regione nella tabella per confrontarla con il totale.', clear: 'Rimuovi la regione', open: 'Profilo', noData: 'Nessun dato disponibile.', noProv: 'Nessun valore pubblicato per questo dato e anno.', last: 'Ultimo anno' }
  };
  var TIT = { es: ['Rendimientos y superficie por región: ', 'Superficie, producción y rendimiento de los cultivos por región. Eurostat, estadísticas agrarias regionales, tal como las publica.'], en: ['Yields and area by region: ', 'Area, production and yield of crops by region. Eurostat regional agricultural statistics, as published.'], fr: ['Rendements et surfaces par région : ', 'Surface, production et rendement des cultures par région. Statistiques agricoles régionales d’Eurostat, telles que publiées.'], it: ['Rese e superfici per regione: ', 'Superficie, produzione e resa delle colture per regione. Statistiche agricole regionali di Eurostat, come pubblicate.'] };
  var NOTE = { es: 'Unidades originales de Eurostat: miles de hectáreas y miles de toneladas. El total nacional suma las regiones que informan de ese cultivo, solo en los años en que todas ellas tienen dato. El rendimiento se calcula aquí como producción ÷ superficie y no lo publica Eurostat. Un hueco es un hueco, nunca cero.', en: 'Original Eurostat units: thousand hectares and thousand tonnes. The national total adds up the regions that report that crop, only in years when all of them have data. Yield is calculated here as production ÷ area and is not published by Eurostat. A gap is a gap, never zero.', fr: 'Unités d’origine d’Eurostat : milliers d’hectares et milliers de tonnes. Le total national additionne les régions qui déclarent cette culture, uniquement les années où toutes ont une donnée. Le rendement est calculé ici comme production ÷ surface et n’est pas publié par Eurostat. Un trou est un trou, jamais zéro.', it: 'Unità originali di Eurostat: migliaia di ettari e migliaia di tonnellate. Il totale nazionale somma le regioni che dichiarano quella coltura, solo negli anni in cui tutte hanno il dato. La resa è calcolata qui come produzione ÷ superficie e non è pubblicata da Eurostat. Un vuoto è un vuoto, mai zero.' };
  var items = CROPS.map(function (c) { return { id: c[0], label: c[1] }; });
  function texts(cc) {
    var T = {}; LG.forEach(function (lg) { var n = cname(cc, lg), t = {}, k; for (k in B[lg]) t[k] = B[lg][k]; t.tabCA = n; t.title = TIT[lg][0] + n; t.sub = TIT[lg][1]; t.ca = n; t.share = { es: 'Peso en ', en: 'Share of ', fr: 'Part de ', it: 'Peso su ' }[lg] + n; t.note = NOTE[lg]; t.src = 'Eurostat (aact_eaa01_r, apro_cpshr)'; t.mapAlt = n; T[lg] = t; }); return T;
  }
  function raw(r, id, k) { var c = r.crops && r.crops[id], a = c && c[k]; return a && a.length ? a : null; }
  function val(a, y) { for (var i = 0; i < a.length; i++) if (a[i][0] === y) return a[i][1]; return null; }
  function regSeries(r, id, m) {
    if (m === 'yield') { var A = raw(r, id, 'area'), P = raw(r, id, 'prod'); if (!A || !P) return null; var out = []; P.forEach(function (p) { var a = val(A, p[0]); if (a > 0 && p[1] != null) out.push([String(p[0]), Math.round(p[1] / a * 1e4) / 10]); }); return out.length ? out : null; }
    var a = raw(r, id, m); return a ? a.map(function (p) { return [String(p[0]), p[1]]; }) : null;
  }
  function make(cc) {
    var lc = cc.toLowerCase(), cache = null;
    function names(id, i) { var N = window.DehesaRegionNames && window.DehesaRegionNames[cc], v = N && N[id]; if (!v) return id; var p = v.split('|'), L = { 0: 1, 1: 0, 2: 2, 3: 3 }[i]; return p[L] || p[0]; }
    function series(D, prov, id, m) {
      if (prov !== cc) return regSeries(D.regions[prov], id, m);
      var ids = Object.keys(D.regions), by = {}, n = ids.length, base = m === 'yield' ? null : m;
      if (m === 'yield') { var a = series(D, cc, id, 'area'), p = series(D, cc, id, 'prod'); if (!a || !p) return null; var o = []; p.forEach(function (x) { var av = val(a, x[0]); if (av > 0) o.push([x[0], Math.round(x[1] / av * 1e4) / 10]); }); return o.length ? o : null; }
      // solo cuentan las regiones que alguna vez informan de este cultivo (Berlín o Hamburgo no siembran colza); nunca se rellena un hueco
      ids = ids.filter(function (k) { return regSeries(D.regions[k], id, base); }); n = ids.length; if (!n) return null;
      ids.forEach(function (k) { (regSeries(D.regions[k], id, base) || []).forEach(function (p) { var e = by[p[0]] || (by[p[0]] = { s: 0, n: 0 }); e.s += p[1]; e.n++; }); });
      var out = Object.keys(by).sort().filter(function (y) { return by[y].n === n; }).map(function (y) { return [y, Math.round(by[y].s * 10) / 10]; });
      return out.length ? out : null;
    }
    return window.CAExplorer.create({
      id: 'rd-eu-' + lc, tabsHost: 'rd-ca-tabs', usBody: 'rd-body', country: cc, tabKey: cc, nat: cc, map: 'DEHESA_' + MAPS[cc][1], texts: texts(cc), items: items, defaultItem: 'C0000', defaultMeasure: 'prod', cite: 'eurostat',
      load: function () { if (cache) return cache; return (cache = loadMap(cc).then(function () { return fetch('data/eu-regions-' + lc + '.json'); }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (d) { if (d) { d.provinces = {}; d.provinces[cc] = 1; Object.keys(d.regions).forEach(function (k) { d.provinces[k] = 1; }); } return d; })); },
      pname: names,
      provIds: function (D) { return Object.keys(D.regions); },
      measures: function (D, id) { var pr = series(D, cc, id, 'prod'); if (pr && !pr.some(function (x) { return x[1]; })) return []; return ['area', 'prod', 'yield'].filter(function (m) { return series(D, cc, id, m); }); },
      series: series,
      fmt: function (m, v) { var l = window.DehesaShared.getLang(), d = function (x, n) { try { return x.toLocaleString(l, { minimumFractionDigits: n, maximumFractionDigits: n }); } catch (e) { return x.toFixed(n); } }; return m === 'yield' ? d(v, 0) + ' kg/ha' : m === 'prod' ? d(v, 0) + ' kt' : d(v, 0) + ' kha'; },
      yTitle: function (m) { return m === 'yield' ? 'kg/ha' : m === 'prod' ? 'kt' : 'kha'; },
      shareMeasure: function (m) { return m !== 'yield'; }
    });
  }
  // texts() usa Intl.DisplayNames; las pestañas se crean en el orden de EA y el selector las ordena por país.
  EA.forEach(function (cc) { var host = document.getElementById('rd-eu-' + cc.toLowerCase()); if (!host) { host = document.createElement('div'); host.id = 'rd-eu-' + cc.toLowerCase(); host.hidden = true; var ref = document.getElementById('rd-es'); (ref && ref.parentNode ? ref.parentNode : document.body).insertBefore(host, ref ? ref.nextSibling : null); } make(cc); });
})();
