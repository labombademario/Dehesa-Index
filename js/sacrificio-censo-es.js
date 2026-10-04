/* Dehesa Index — Sacrificio anual de ganado en España por provincia, 2004-2025 (MAPA, Encuesta anual de sacrificio de ganado en mataderos; data/spain-slaughter/census.json).
   Pestaña «España (sacrificio por provincia)» de ganaderia.html sobre js/ca-explorer.js, con el mapa de provincias. Solo muestra lo que publica el MAPA: una provincia con dato confidencial (DC) es un hueco, nunca cero,
   y no se calcula restando. El peso medio es un cálculo (toneladas de canal / cabezas), no un dato publicado. ES5. */
(function () {
  'use strict';
  var ITEMS = [['bovino', ['Vacuno', 'Cattle', 'Bovins', 'Bovini']], ['ovino', ['Ovino', 'Sheep', 'Ovins', 'Ovini']], ['caprino', ['Caprino', 'Goats', 'Caprins', 'Caprini']], ['porcino', ['Porcino', 'Pigs', 'Porcins', 'Suini']], ['equino', ['Equino', 'Equines', 'Équidés', 'Equini']], ['aves', ['Aves', 'Poultry', 'Volailles', 'Pollame']], ['conejos', ['Conejos', 'Rabbits', 'Lapins', 'Conigli']]];
  var MEAS = ['heads', 'carcass', 'weight'];
  var T = {
    es: { tabUS: 'EE. UU.', tabCA: 'España (sacrificio por provincia)', title: 'Sacrificio de ganado en España por provincia, 2004-2025', sub: 'Cabezas sacrificadas y toneladas de peso canal por especie y provincia, año a año, según la Encuesta anual de sacrificio de ganado en mataderos del Ministerio de Agricultura, Pesca y Alimentación (MAPA), tal como la publica.',
      item: 'Especie', measure: 'Cifra', period: 'Año', heads: 'Cabezas sacrificadas', carcass: 'Peso canal (t)', weight: 'Peso canal medio (kg por cabeza)', ca: 'España', vsPrev: 'frente al año anterior', hist: 'Evolución nacional', prov: 'Por provincia', share: 'Peso en España', value: 'Valor', change: 'Variación', province: 'Provincia', pick: 'Pulsa una provincia (mapa o tabla) para compararla con España.', clear: 'Quitar la provincia', open: 'Perfil', noData: 'Sin datos disponibles.', noProv: 'Sin dato publicado (confidencial) para esta especie y año.', last: 'Último año',
      dcHead: 'Sin cifra publicada este año (dato confidencial, DC)', dcNone: 'Todas las provincias tienen cifra en esta especie y año.', basisU: 'El libro del MAPA de este año indica «datos sin elevar»: no es el censo completo de mataderos y no es plenamente comparable con los años censales.', basisN: 'El libro del MAPA de este año no indica si es un censo o una muestra.',
      note: 'Los datos salen de la Encuesta anual de sacrificio de ganado del MAPA (mataderos) y se asignan a la provincia del matadero, no a la de cría del animal. «España» es la cifra publicada por el MAPA y suma las provincias más los «otros sacrificios» que el MAPA no asigna a ninguna provincia (hasta 2007 son muy grandes en ovino y caprino), así que la suma de las provincias puede quedar por debajo y el peso en España es el de esa cifra. Aves y conejos se publican en miles de cabezas hasta 2024 y en cabezas desde 2025; aquí todo está en cabezas. El peso canal medio es un cálculo de Dehesa Index, no una cifra publicada. El MAPA declara confidenciales (DC) las cifras de provincias con pocos mataderos: son un hueco, nunca cero, y no se estiman restando, aunque el total de su comunidad sí las incluye; por eso algunas provincias no salen en el mapa ni en la tabla. Hasta 2013 el libro no distingue censo y muestra; en 2007, 2012, 2013 y 2015 dice «datos sin elevar»; desde 2016 es censal. Un cero publicado es un cero. Ceuta y Melilla no figuran. Las cifras pueden ser revisadas: prevalece el último libro.', src: 'Fuente: Ministerio de Agricultura, Pesca y Alimentación (MAPA), Encuesta anual de sacrificio de ganado en mataderos.', mapAlt: 'Mapa de provincias de España coloreado por la cifra elegida' },
    en: { tabUS: 'United States', tabCA: 'Spain (slaughter by province)', title: 'Livestock slaughter in Spain by province, 2004-2025', sub: 'Head slaughtered and tonnes of carcass weight by species and province, year by year, from the Annual Livestock Slaughter Survey of the Spanish Ministry of Agriculture, Fisheries and Food (MAPA), as published.',
      item: 'Species', measure: 'Measure', period: 'Year', heads: 'Head slaughtered', carcass: 'Carcass weight (t)', weight: 'Average carcass weight (kg per head)', ca: 'Spain', vsPrev: 'vs. the previous year', hist: 'National trend', prov: 'By province', share: 'Share of Spain', value: 'Value', change: 'Change', province: 'Province', pick: 'Select a province (map or table) to compare it with Spain.', clear: 'Remove province', open: 'Profile', noData: 'No data available.', noProv: 'No published figure (confidential) for this species and year.', last: 'Latest year',
      dcHead: 'No published figure this year (confidential data, DC)', dcNone: 'Every province has a figure for this species and year.', basisU: 'This year’s MAPA workbook says “unraised data”: it is not the full census of slaughterhouses and is not fully comparable with census years.', basisN: 'This year’s MAPA workbook does not say whether it is a census or a sample.',
      note: 'The data come from MAPA’s Annual Livestock Slaughter Survey (slaughterhouses) and are assigned to the province of the slaughterhouse, not the province where the animal was raised. “Spain” is the figure MAPA publishes: it adds the provinces plus the “other slaughter” that MAPA does not assign to any province (very large for sheep and goats until 2007), so the provinces can add up to less and the share of Spain is of that figure. Poultry and rabbits are published in thousands of head until 2024 and in head from 2025; here everything is in head. Average carcass weight is a Dehesa Index calculation, not a published figure. MAPA marks as confidential (DC) the figures of provinces with few slaughterhouses: they are a gap, never zero, and are not estimated by subtraction, although the total of their region does include them; that is why some provinces are missing from the map and the table. Until 2013 the workbook does not say census or sample; 2007, 2012, 2013 and 2015 say “unraised data”; from 2016 it is a census. A published zero is a zero. Ceuta and Melilla are not shown. Figures may be revised: the latest workbook prevails.', src: 'Source: Ministry of Agriculture, Fisheries and Food (MAPA), Annual Livestock Slaughter Survey.', mapAlt: 'Map of Spanish provinces coloured by the chosen measure' },
    fr: { tabUS: 'États-Unis', tabCA: 'Espagne (abattages par province)', title: 'Abattages de bétail en Espagne par province, 2004-2025', sub: 'Têtes abattues et tonnes de poids carcasse par espèce et par province, année après année, d’après l’enquête annuelle sur les abattages de bétail du ministère espagnol de l’Agriculture, de la Pêche et de l’Alimentation (MAPA), telle que publiée.',
      item: 'Espèce', measure: 'Chiffre', period: 'Année', heads: 'Têtes abattues', carcass: 'Poids carcasse (t)', weight: 'Poids carcasse moyen (kg par tête)', ca: 'Espagne', vsPrev: 'par rapport à l’année précédente', hist: 'Évolution nationale', prov: 'Par province', share: 'Part de l’Espagne', value: 'Valeur', change: 'Variation', province: 'Province', pick: 'Sélectionnez une province (carte ou tableau) pour la comparer à l’Espagne.', clear: 'Retirer la province', open: 'Profil', noData: 'Aucune donnée disponible.', noProv: 'Aucun chiffre publié (confidentiel) pour cette espèce et cette année.', last: 'Dernière année',
      dcHead: 'Sans chiffre publié cette année (donnée confidentielle, DC)', dcNone: 'Toutes les provinces ont un chiffre pour cette espèce et cette année.', basisU: 'Le classeur du MAPA de cette année indique « données non élevées » : ce n’est pas le recensement complet des abattoirs et il n’est pas pleinement comparable aux années de recensement.', basisN: 'Le classeur du MAPA de cette année n’indique pas s’il s’agit d’un recensement ou d’un échantillon.',
      note: 'Les données proviennent de l’enquête annuelle du MAPA sur les abattages de bétail (abattoirs) et sont attribuées à la province de l’abattoir, non à celle d’élevage de l’animal. « Espagne » est le chiffre publié par le MAPA : il additionne les provinces et les « autres abattages » que le MAPA n’attribue à aucune province (très importants pour les ovins et caprins jusqu’en 2007) ; la somme des provinces peut donc être inférieure et la part de l’Espagne se rapporte à ce chiffre. Volailles et lapins sont publiés en milliers de têtes jusqu’en 2024 et en têtes depuis 2025 ; ici tout est en têtes. Le poids carcasse moyen est un calcul de Dehesa Index, pas un chiffre publié. Le MAPA déclare confidentiels (DC) les chiffres des provinces comptant peu d’abattoirs : c’est un manque, jamais zéro, non estimé par soustraction, bien que le total de leur communauté les inclue ; c’est pourquoi certaines provinces manquent sur la carte et dans le tableau. Jusqu’en 2013 le classeur ne précise pas recensement ou échantillon ; 2007, 2012, 2013 et 2015 indiquent « données non élevées » ; depuis 2016 il s’agit d’un recensement. Un zéro publié est un zéro. Ceuta et Melilla ne figurent pas. Les chiffres peuvent être révisés : le dernier classeur prévaut.', src: 'Source : ministère de l’Agriculture, de la Pêche et de l’Alimentation (MAPA), enquête annuelle sur les abattages de bétail.', mapAlt: 'Carte des provinces espagnoles colorée selon le chiffre choisi' },
    it: { tabUS: 'Stati Uniti', tabCA: 'Spagna (macellazioni per provincia)', title: 'Macellazioni di bestiame in Spagna per provincia, 2004-2025', sub: 'Capi macellati e tonnellate di peso carcassa per specie e provincia, anno per anno, dall’indagine annuale sulle macellazioni di bestiame del ministero spagnolo dell’Agricoltura, della Pesca e dell’Alimentazione (MAPA), come pubblicata.',
      item: 'Specie', measure: 'Dato', period: 'Anno', heads: 'Capi macellati', carcass: 'Peso carcassa (t)', weight: 'Peso medio carcassa (kg per capo)', ca: 'Spagna', vsPrev: 'rispetto all’anno prima', hist: 'Andamento nazionale', prov: 'Per provincia', share: 'Peso sulla Spagna', value: 'Valore', change: 'Variazione', province: 'Provincia', pick: 'Seleziona una provincia (mappa o tabella) per confrontarla con la Spagna.', clear: 'Rimuovi la provincia', open: 'Profilo', noData: 'Nessun dato disponibile.', noProv: 'Nessun dato pubblicato (riservato) per questa specie e questo anno.', last: 'Ultimo anno',
      dcHead: 'Senza dato pubblicato quest’anno (dato riservato, DC)', dcNone: 'Tutte le province hanno un dato per questa specie e questo anno.', basisU: 'La cartella del MAPA di quest’anno indica «dati non elevati»: non è il censimento completo dei macelli e non è del tutto confrontabile con gli anni censuari.', basisN: 'La cartella del MAPA di quest’anno non indica se è un censimento o un campione.',
      note: 'I dati provengono dall’indagine annuale del MAPA sulle macellazioni di bestiame (macelli) e sono attribuiti alla provincia del macello, non a quella di allevamento dell’animale. «Spagna» è il dato pubblicato dal MAPA: somma le province più le «altre macellazioni» che il MAPA non attribuisce ad alcuna provincia (molto grandi per ovini e caprini fino al 2007); la somma delle province può quindi essere inferiore e il peso sulla Spagna si riferisce a quel dato. Pollame e conigli sono pubblicati in migliaia di capi fino al 2024 e in capi dal 2025; qui tutto è in capi. Il peso medio della carcassa è un calcolo di Dehesa Index, non un dato pubblicato. Il MAPA segna come riservati (DC) i dati delle province con pochi macelli: sono un vuoto, mai zero, e non si stimano per sottrazione, benché il totale della loro comunità li includa; per questo alcune province mancano nella mappa e nella tabella. Fino al 2013 la cartella non precisa censimento o campione; 2007, 2012, 2013 e 2015 indicano «dati non elevati»; dal 2016 è censuaria. Uno zero pubblicato è uno zero. Ceuta e Melilla non compaiono. I dati possono essere rivisti: prevale l’ultima cartella.', src: 'Fonte: Ministero dell’Agricoltura, della Pesca e dell’Alimentazione (MAPA), indagine annuale sulle macellazioni di bestiame.', mapAlt: 'Mappa delle province spagnole colorata in base al dato scelto' }
  };
  var items = ITEMS.map(function (i) { return { id: i[0], label: i[1] }; });
  var CUR = null;
  function lg() { return window.DehesaShared.getLang(); }
  function nf(x, n) { try { return x.toLocaleString(lg(), { minimumFractionDigits: n, maximumFractionDigits: n }); } catch (e) { return x.toFixed(n); } }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function src(D, prov) { return prov === 'ES' ? D.doc.v.ES : D.doc.v[prov]; }
  function series(D, prov, id, m) {
    var d = D.doc, s = src(D, prov), a = s && s[id]; if (!a) return null; var o = [], Y = d.years, i, h, t;
    for (i = 0; i < Y.length; i++) {
      h = a.heads[i]; t = a.meat[i];
      if (m === 'heads') { if (h != null) o.push([String(Y[i]), h]); }
      else if (m === 'carcass') { if (t != null) o.push([String(Y[i]), t]); }
      else if (h && t != null) o.push([String(Y[i]), t * 1000 / h]);
    }
    return o.length ? o : null;
  }
  function dcList(D, id, m, year) {
    var dc = D.doc.dc, out = [], k;
    for (k in D.doc.provinces) {
      var e = dc[k] && dc[k][id]; if (!e) continue;
      var hit = m === 'heads' ? e.heads && e.heads[year] != null : m === 'carcass' ? e.meat && e.meat[year] != null : (e.heads && e.heads[year] != null) || (e.meat && e.meat[year] != null);
      if (hit) out.push(D.names[k] || k);
    }
    return out;
  }
  function fillNote() {
    var D = CUR, n = document.getElementById('gn-esc-dc'); if (!D || !n) return;
    var g = function (s) { var x = document.getElementById('gn-esc-' + s); return x ? x.value : null; };
    var id = g('item'), m = g('met'), y = g('per'); if (!id || !m || !y) { n.innerHTML = ''; return; }
    var t = T[lg()] || T.es, l = dcList(D, id, m, y), b = D.doc.basis[y], h = '';
    h += '<p class="di-movers-hint" style="margin:10px 0 0"><strong>' + esc(t.dcHead) + ':</strong> ' + (l.length ? esc(l.join(', ')) : esc(t.dcNone)) + '</p>';
    if (b === 'unraised') h += '<p class="di-movers-hint" style="margin:6px 0 0">' + esc(t.basisU) + '</p>';
    else if (b === 'unspecified') h += '<p class="di-movers-hint" style="margin:6px 0 0">' + esc(t.basisN) + '</p>';
    n.innerHTML = h;
  }
  window.GNSlaughterCensus = window.CAExplorer.create({
    id: 'gn-esc', tabsHost: 'gn-ca-tabs', usBody: 'gn-body', usExtra: '#cof, #nd, #nl', country: 'ES', tabKey: 'ES-SACRIFICIO-PROV', nat: 'ES', map: 'DEHESA_ES_PROVINCES', noRegionLink: true, texts: T, items: items, defaultItem: 'bovino', defaultMeasure: 'heads', cite: 'mapa_es',
    load: function () {
      return fetch('data/spain-slaughter/census.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (d) {
        if (!d || !d.years || !d.v) return null;
        var D = { doc: d, provinces: { ES: 1 }, names: {} };
        Object.keys(d.v).forEach(function (k) { if (k !== 'ES') D.provinces[k] = 1; });
        ((window.DEHESA_ES_PROVINCES || {}).states || []).forEach(function (s) { D.names[s.id] = s.name; });
        CUR = D; return D;
      });
    },
    pname: function (id) { return (CUR && CUR.names[id]) || id; },
    provIds: function (D) { CUR = D; return Object.keys(D.provinces).filter(function (k) { return k !== 'ES'; }); },
    measures: function (D, id) { CUR = D; return series(D, 'ES', id, 'heads') ? MEAS : []; },
    series: function (D, prov, id, m) { CUR = D; return series(D, prov, id, m); },
    fmt: function (m, v) {
      if (m === 'weight') return nf(v, 1) + ' kg';
      if (m === 'carcass') return v >= 1000 ? nf(v / 1000, 1) + ' kt' : nf(v, 0) + ' t';
      return v >= 1e6 ? nf(v / 1e6, 2) + ' M' : v >= 1e4 ? nf(v / 1000, 1) + ' k' : nf(v, 0);
    },
    chartV: function (m, v) { return m === 'weight' ? nf(v, 1) : m === 'carcass' ? (v >= 1000 ? nf(v / 1000, 0) + ' kt' : nf(v, 0)) : v >= 1e6 ? nf(v / 1e6, 1) + ' M' : v >= 1e3 ? nf(v / 1000, 0) + ' k' : nf(v, 0); },
    yTitle: function (m) { return m === 'weight' ? 'kg' : m === 'carcass' ? 't' : ''; },
    shareMeasure: function (m) { return m !== 'weight'; },
    extra: function () { setTimeout(fillNote, 0); return '<div id="gn-esc-dc"></div>'; }
  });
})();
