/* Dehesa Index — Ganadería por región de Portugal, Grecia, Bélgica, Países Bajos, Italia, Francia y Alemania (Eurostat, estadísticas agrarias regionales:
   efectivos y leche; data/eu-regions-<pais>.json). Una pestaña por país en ganaderia.html, igual que la de España (js/ganaderia-es.js), sobre js/ca-explorer.js.
   El total nacional es la suma de las regiones solo en los años en que todas tienen dato (nunca se rellena un hueco). El mapa se carga al abrir la pestaña. ES5. */
(function () {
  'use strict';
  if (!window.CAExplorer) return;
  var ITEMS = [['A2000', ['Vacuno · total', 'Cattle · total', 'Bovins · total', 'Bovini · totale']], ['A2300F', ['Vacas lecheras', 'Dairy cows', 'Vaches laitières', 'Vacche da latte']], ['A2300G', ['Vacas no lecheras', 'Other cows', 'Vaches allaitantes', 'Vacche non da latte']],
    ['A3100', ['Porcino', 'Pigs', 'Porcins', 'Suini']], ['A4100', ['Ovino', 'Sheep', 'Ovins', 'Ovini']], ['A4200', ['Caprino', 'Goats', 'Caprins', 'Caprini']], ['milk', ['Leche de vaca producida', 'Cow’s milk produced', 'Lait de vache produit', 'Latte vaccino prodotto']]];
  /* país: [fichero, mapa, script del mapa, nombres es/en/fr/it, unidad regional es/en/fr/it (singular|plural)] */
  var C = {
    PT: ['pt', 'DEHESA_PT_REGIONS', 'vendor/pt-regions.js', ['Portugal', 'Portugal', 'Portugal', 'Portogallo'], ['región|regiones', 'region|regions', 'région|régions', 'regione|regioni']],
    EL: ['el', 'DEHESA_EL_REGIONS', 'vendor/el-regions.js', ['Grecia', 'Greece', 'Grèce', 'Grecia'], ['región|regiones', 'region|regions', 'région|régions', 'regione|regioni']],
    BE: ['be', 'DEHESA_BE_PROVINCES', 'vendor/be-provinces.js', ['Bélgica', 'Belgium', 'Belgique', 'Belgio'], ['provincia|provincias', 'province|provinces', 'province|provinces', 'provincia|province']],
    NL: ['nl', 'DEHESA_NL_PROVINCES', 'vendor/nl-provinces.js', ['Países Bajos', 'Netherlands', 'Pays-Bas', 'Paesi Bassi'], ['provincia|provincias', 'province|provinces', 'province|provinces', 'provincia|province']],
    IT: ['it', 'DEHESA_IT_REGIONS', 'vendor/it-regions.js', ['Italia', 'Italy', 'Italie', 'Italia'], ['región|regiones', 'region|regions', 'région|régions', 'regione|regioni']],
    FR: ['fr', 'DEHESA_FR_REGIONS', 'vendor/fr-regions.js', ['Francia', 'France', 'France', 'Francia'], ['región|regiones', 'region|regions', 'région|régions', 'regione|regioni']],
    DE: ['de', 'DEHESA_DE_LAENDER', 'vendor/de-laender.js', ['Alemania', 'Germany', 'Allemagne', 'Germania'], ['estado federado|estados federados', 'state|states', 'Land|Länder', 'Land|Länder']]
  };
  function texts(cc) {
    var n = C[cc][3], u = C[cc][4].map(function (s) { return s.split('|'); });
    var mk = function (i, o) { return o; };
    return {
      es: mk(0, { tabUS: 'EE. UU.', tabCA: n[0], title: 'Ganadería de ' + n[0] + ' por ' + u[0][0], sub: 'Efectivos de vacuno, porcino, ovino y caprino y leche de vaca producida por ' + u[0][0] + '. Datos de Eurostat (estadísticas agrarias regionales), tal como los publica.',
        item: 'Ganado', measure: 'Cifra', period: 'Año', head: 'Efectivos', milk: 'Producción', ca: n[0] + ' (suma de ' + u[0][1] + ')', vsPrev: 'frente al año anterior', hist: 'Evolución nacional', prov: 'Por ' + u[0][0], share: 'Peso en ' + n[0], value: 'Valor', change: 'Variación', province: u[0][0].charAt(0).toUpperCase() + u[0][0].slice(1), pick: 'Pulsa en el mapa o en la tabla para comparar con el total.', clear: 'Quitar la selección', open: 'Perfil de la región', noData: 'Sin datos disponibles.', noProv: 'Sin dato publicado para esta cifra y año.', last: 'Último año',
        note: 'Unidades originales de Eurostat: miles de cabezas y miles de toneladas. El total es la suma de las ' + u[0][1] + ' solo en los años en que todas tienen dato. Las cifras proceden de las encuestas nacionales recopiladas por Eurostat y pueden revisarse. Un hueco es un hueco, nunca cero.', src: 'Fuente: Eurostat (estadísticas agrarias regionales).', mapAlt: 'Mapa coloreado por la cifra elegida' }),
      en: { tabUS: 'United States', tabCA: n[1], title: n[1] + ': livestock by ' + u[1][0], sub: 'Cattle, pig, sheep and goat numbers and cow’s milk produced by ' + u[1][0] + '. Eurostat data (regional agricultural statistics), as published.',
        item: 'Livestock', measure: 'Measure', period: 'Year', head: 'Numbers', milk: 'Production', ca: n[1] + ' (sum of ' + u[1][1] + ')', vsPrev: 'vs. previous year', hist: 'National trend', prov: 'By ' + u[1][0], share: 'Share of ' + n[1], value: 'Value', change: 'Change', province: u[1][0].charAt(0).toUpperCase() + u[1][0].slice(1), pick: 'Click the map or the table to compare with the total.', clear: 'Clear selection', open: 'Region profile', noData: 'No data available.', noProv: 'No published figure for this measure and year.', last: 'Latest year',
        note: 'Original Eurostat units: thousand head and thousand tonnes. The total is the sum of the ' + u[1][1] + ' only in years when all of them have data. Figures come from national surveys compiled by Eurostat and may be revised. A gap is a gap, never zero.', src: 'Source: Eurostat (regional agricultural statistics).', mapAlt: 'Map coloured by the chosen measure' },
      fr: { tabUS: 'États-Unis', tabCA: n[2], title: 'Élevage : ' + n[2] + ' par ' + u[2][0], sub: 'Effectifs de bovins, porcins, ovins et caprins et lait de vache produit par ' + u[2][0] + '. Données d’Eurostat (statistiques agricoles régionales), telles que publiées.',
        item: 'Cheptel', measure: 'Chiffre', period: 'Année', head: 'Effectifs', milk: 'Production', ca: n[2] + ' (somme des ' + u[2][1] + ')', vsPrev: 'par rapport à l’an dernier', hist: 'Évolution nationale', prov: 'Par ' + u[2][0], share: 'Part du pays', value: 'Valeur', change: 'Variation', province: u[2][0].charAt(0).toUpperCase() + u[2][0].slice(1), pick: 'Cliquez sur la carte ou le tableau pour comparer avec le total.', clear: 'Retirer la sélection', open: 'Profil de la région', noData: 'Aucune donnée disponible.', noProv: 'Aucun chiffre publié pour cette mesure et cette année.', last: 'Dernière année',
        note: 'Unités d’origine d’Eurostat : milliers de têtes et milliers de tonnes. Le total est la somme des ' + u[2][1] + ' uniquement les années où toutes ont une donnée. Chiffres des enquêtes nationales compilées par Eurostat, révisables. Un manque est un manque, jamais zéro.', src: 'Source : Eurostat (statistiques agricoles régionales).', mapAlt: 'Carte colorée selon le chiffre choisi' },
      it: { tabUS: 'Stati Uniti', tabCA: n[3], title: 'Zootecnia: ' + n[3] + ' per ' + u[3][0], sub: 'Consistenze di bovini, suini, ovini e caprini e latte vaccino prodotto per ' + u[3][0] + '. Dati Eurostat (statistiche agricole regionali), come pubblicati.',
        item: 'Bestiame', measure: 'Dato', period: 'Anno', head: 'Consistenze', milk: 'Produzione', ca: n[3] + ' (somma delle ' + u[3][1] + ')', vsPrev: 'rispetto all’anno scorso', hist: 'Andamento nazionale', prov: 'Per ' + u[3][0], share: 'Peso sul paese', value: 'Valore', change: 'Variazione', province: u[3][0].charAt(0).toUpperCase() + u[3][0].slice(1), pick: 'Fai clic sulla mappa o sulla tabella per confrontare con il totale.', clear: 'Rimuovi la selezione', open: 'Profilo della regione', noData: 'Nessun dato disponibile.', noProv: 'Nessun dato pubblicato per questo dato e anno.', last: 'Ultimo anno',
        note: 'Unità originali di Eurostat: migliaia di capi e migliaia di tonnellate. Il totale è la somma delle ' + u[3][1] + ' solo negli anni in cui tutte hanno il dato. Dati delle indagini nazionali raccolti da Eurostat, soggetti a revisione. Un vuoto è un vuoto, mai zero.', src: 'Fonte: Eurostat (statistiche agricole regionali).', mapAlt: 'Mappa colorata in base al dato scelto' }
    };
  }
  var items = ITEMS.map(function (i) { return { id: i[0], label: i[1] }; });
  function regSeries(r, id) { var a = id === 'milk' ? r.milk : r.animals && r.animals[id]; return a && a.length ? a.map(function (p) { return [String(p[0]), p[1]]; }) : null; }
  function mkSeries(cc) {
    return function (D, prov, id) {
      if (prov !== cc) return D.regions[prov] ? regSeries(D.regions[prov], id) : null;
      var ids = Object.keys(D.regions), by = {}, n = ids.length;
      ids.forEach(function (k) { (regSeries(D.regions[k], id) || []).forEach(function (p) { var e = by[p[0]] || (by[p[0]] = { s: 0, n: 0 }); e.s += p[1]; e.n++; }); });
      /* todos los años con dato en alguna región (para poder ver las regiones); el total nacional solo cuando todas tienen dato, si no queda vacío (nunca se completa un hueco) */
      var out = Object.keys(by).sort().map(function (y) { return [y, by[y].n === n ? Math.round(by[y].s * 10) / 10 : null]; });
      return out.some(function (p) { return p[1] != null; }) ? out : null;
    };
  }
  function script(src, glob) { return new Promise(function (ok) { if (window[glob]) return ok(); var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ok; document.head.appendChild(s); }); }
  ['FR', 'DE', 'IT', 'PT', 'BE', 'NL', 'EL'].forEach(function (cc) {
    var c = C[cc], ser = mkSeries(cc);
    window['GN' + cc] = window.CAExplorer.create({
      id: 'gn-' + c[0], tabsHost: 'gn-ca-tabs', usBody: 'gn-body', usExtra: '#cof, #nd, #nl', country: cc, tabKey: cc + '-EUROSTAT', nat: cc, map: c[1], texts: texts(cc), items: items, defaultItem: 'A2000', defaultMeasure: 'head', cite: 'eurostat',
      load: function () { return script(c[2], c[1]).then(function () { return fetch('data/eu-regions-' + c[0] + '.json'); }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (d) { if (d) { d.provinces = {}; d.provinces[cc] = 1; Object.keys(d.regions).forEach(function (k) { d.provinces[k] = 1; }); } return d; }); },
      pname: function (id, i) { var N = window.DehesaRegionNames && window.DehesaRegionNames[cc], v = N && N[id]; if (!v) return id; var p = v.split('|'), L = { 0: 1, 1: 0, 2: 2, 3: 3 }[i]; return p[L] || p[0]; },
      measures: function (D, id) { return ser(D, cc, id) ? [id === 'milk' ? 'milk' : 'head'] : []; },
      series: ser,
      fmt: function (m, v) { var l = window.DehesaShared.getLang(), d = function (x, k) { try { return x.toLocaleString(l, { minimumFractionDigits: k, maximumFractionDigits: k }); } catch (e) { return x.toFixed(k); } }; var u = m === 'milk' ? ' kt' : ' k'; return v >= 1000 ? d(v / 1000, 2) + (m === 'milk' ? ' Mt' : ' M') : d(v, v >= 100 ? 0 : 1) + u; },
      yTitle: function (m) { return m === 'milk' ? 'kt' : '1000'; },
      shareMeasure: function () { return true; }
    });
  });
})();
