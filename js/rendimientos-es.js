/* Dehesa Index — Rendimientos y superficie por provincia de España (MAPA, «Superficies y producciones anuales de cultivos», data/spain-crops/).
   Pestaña «España» de rendimientos.html sobre js/ca-explorer.js. Solo lo que publica el MAPA; la campaña son datos provisionales; el rendimiento es producción ÷ superficie cosechada (derivado, rotulado). ES5. */
(function () {
  'use strict';
  var BASE = 'data/spain-crops/', GORDER = ['cereales', 'leguminosas', 'tuberculos', 'industriales', 'hortalizas', 'citricos', 'frutales', 'olivar', 'vinedo', 'otros_lenosos'];
  var KEY = { planted: 0, rainfed: 1, irrigated: 2, harvested: 3, production: 4 };
  var T = {
    es: { tabUS: 'EE. UU. y otros', tabCA: 'España (por provincia)', title: 'Rendimientos y superficie por provincia de España', sub: 'Superficie, secano y regadío, producción y rendimiento de los cultivos por provincia. Datos provisionales del Ministerio de Agricultura, Pesca y Alimentación (MAPA), tal como los publica.',
      item: 'Cultivo', measure: 'Cifra', period: 'Campaña', planted: 'Superficie total', rainfed: 'Superficie de secano', irrigated: 'Superficie de regadío', harvested: 'Superficie cosechada', production: 'Producción', yield: 'Rendimiento (derivado)', ca: 'España', vsPrev: 'frente a la campaña anterior', oneYear: 'El MAPA publica una sola campaña para este cultivo: todavía no hay evolución que mostrar.', hist: 'Evolución nacional', prov: 'Por provincia', share: 'Peso en España', value: 'Valor', change: 'Variación', province: 'Provincia', pick: 'Pulsa una provincia (mapa o tabla) para compararla con España.', clear: 'Quitar la provincia', open: 'Perfil', noData: 'Sin datos disponibles.', noProv: 'Sin dato publicado para esta cifra y campaña.', last: 'Última campaña',
      note: 'Datos provisionales que el MAPA publica según el Reglamento (CE) 543/2009; pueden cambiar. El MAPA solo ofrece una o dos campañas, así que la evolución nacional tiene pocos puntos. Superficie en hectáreas y producción en toneladas. El rendimiento se calcula aquí como producción ÷ superficie cosechada (en leñosos, superficie en producción) y no lo publica el MAPA. Los nombres de cultivo son los del MAPA; los resúmenes ya incluyen a sus variedades. No es el recuento ESYRCE. Un hueco es un hueco, nunca cero.', src: 'Fuente: MAPA, Superficies y producciones anuales de cultivos.', mapAlt: 'Mapa de provincias de España coloreado por la cifra elegida' },
    en: { tabUS: 'United States and others', tabCA: 'Spain (by province)', title: 'Yields and area by Spanish province', sub: 'Area, rainfed and irrigated land, production and yield of crops by province. Provisional data from the Ministry of Agriculture, Fisheries and Food (MAPA), as published.',
      item: 'Crop', measure: 'Measure', period: 'Campaign', planted: 'Total area', rainfed: 'Rainfed area', irrigated: 'Irrigated area', harvested: 'Harvested area', production: 'Production', yield: 'Yield (derived)', ca: 'Spain', vsPrev: 'vs. previous campaign', oneYear: 'MAPA publishes a single campaign for this crop: there is no trend to show yet.', hist: 'National trend', prov: 'By province', share: 'Share of Spain', value: 'Value', change: 'Change', province: 'Province', pick: 'Select a province (map or table) to compare it with Spain.', clear: 'Remove province', open: 'Profile', noData: 'No data available.', noProv: 'No published figure for this measure and campaign.', last: 'Latest campaign',
      note: 'Provisional data published by MAPA under Regulation (EC) 543/2009; they may change. MAPA offers only one or two campaigns, so the national trend has few points. Area in hectares and production in tonnes. Yield is calculated here as production ÷ harvested area (for tree and vine crops, area in production) and is not published by MAPA. Crop names are MAPA\'s own, in Spanish; summary rows already include their varieties. This is not the ESYRCE survey. A gap is a gap, never zero.', src: 'Source: MAPA, annual crop area and production statistics.', mapAlt: 'Map of Spanish provinces coloured by the chosen measure' },
    fr: { tabUS: 'États-Unis et autres', tabCA: 'Espagne (par province)', title: 'Rendements et surfaces par province espagnole', sub: 'Surface, sec et irrigué, production et rendement des cultures par province. Données provisoires du ministère espagnol de l’Agriculture (MAPA), telles que publiées.',
      item: 'Culture', measure: 'Chiffre', period: 'Campagne', planted: 'Surface totale', rainfed: 'Surface en sec', irrigated: 'Surface irriguée', harvested: 'Surface récoltée', production: 'Production', yield: 'Rendement (dérivé)', ca: 'Espagne', vsPrev: 'par rapport à la campagne précédente', oneYear: 'Le MAPA ne publie qu’une campagne pour cette culture : pas encore d’évolution à montrer.', hist: 'Évolution nationale', prov: 'Par province', share: 'Part de l’Espagne', value: 'Valeur', change: 'Variation', province: 'Province', pick: 'Sélectionnez une province (carte ou tableau) pour la comparer à l’Espagne.', clear: 'Retirer la province', open: 'Profil', noData: 'Aucune donnée disponible.', noProv: 'Aucun chiffre publié pour cette mesure et cette campagne.', last: 'Dernière campagne',
      note: 'Données provisoires publiées par le MAPA selon le règlement (CE) 543/2009 ; elles peuvent changer. Le MAPA ne propose qu’une ou deux campagnes : l’évolution nationale a donc peu de points. Surface en hectares et production en tonnes. Le rendement est calculé ici comme production ÷ surface récoltée (pour les ligneux, surface en production) et n’est pas publié par le MAPA. Les noms de cultures sont ceux du MAPA, en espagnol ; les résumés incluent déjà leurs variétés. Ce n’est pas l’enquête ESYRCE. Un manque est un manque, jamais zéro.', src: 'Source : MAPA, statistiques annuelles de surfaces et productions agricoles.', mapAlt: 'Carte des provinces espagnoles colorée selon le chiffre choisi' },
    it: { tabUS: 'Stati Uniti e altri', tabCA: 'Spagna (per provincia)', title: 'Rese e superfici per provincia spagnola', sub: 'Superficie, asciutto e irriguo, produzione e resa delle colture per provincia. Dati provvisori del ministero spagnolo dell’Agricoltura (MAPA), come pubblicati.',
      item: 'Coltura', measure: 'Dato', period: 'Campagna', planted: 'Superficie totale', rainfed: 'Superficie in asciutto', irrigated: 'Superficie irrigua', harvested: 'Superficie raccolta', production: 'Produzione', yield: 'Resa (derivata)', ca: 'Spagna', vsPrev: 'rispetto alla campagna precedente', oneYear: 'Il MAPA pubblica una sola campagna per questa coltura: non c’è ancora un andamento da mostrare.', hist: 'Andamento nazionale', prov: 'Per provincia', share: 'Peso sulla Spagna', value: 'Valore', change: 'Variazione', province: 'Provincia', pick: 'Seleziona una provincia (mappa o tabella) per confrontarla con la Spagna.', clear: 'Rimuovi la provincia', open: 'Profilo', noData: 'Nessun dato disponibile.', noProv: 'Nessun dato pubblicato per questo dato e questa campagna.', last: 'Ultima campagna',
      note: 'Dati provvisori pubblicati dal MAPA secondo il regolamento (CE) 543/2009; possono cambiare. Il MAPA offre solo una o due campagne, quindi l’andamento nazionale ha pochi punti. Superficie in ettari e produzione in tonnellate. La resa è calcolata qui come produzione ÷ superficie raccolta (per le colture legnose, superficie in produzione) e non è pubblicata dal MAPA. I nomi delle colture sono quelli del MAPA, in spagnolo; i riepiloghi includono già le loro varietà. Non è l’indagine ESYRCE. Un vuoto è un vuoto, mai zero.', src: 'Fonte: MAPA, statistiche annuali di superfici e produzioni agricole.', mapAlt: 'Mappa delle province spagnole colorata in base al dato scelto' }
  };
  function loadAll() {
    return fetch(BASE + 'index.json').then(function (r) { if (!r.ok) throw Error('x'); return r.json(); }).then(function (ix) {
      var gs = GORDER.filter(function (k) { return ix.groups[k]; });
      return Promise.all(gs.map(function (k) { return fetch(BASE + ix.groups[k].file).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); })).then(function (fs) {
        var D = { provinces: { ES: 1 }, names: {}, crops: {}, order: [], ids: {} };
        fs.forEach(function (g, i) {
          if (!g) return;
          Object.keys(g.provinces).forEach(function (p) { D.names[p] = g.provinces[p]; D.provinces[p] = 1; });
          Object.keys(g.campaigns).forEach(function (camp) {
            g.campaigns[camp].crops.forEach(function (c) {
              var id = gs[i] + '|' + c.c, e = D.crops[id] || (D.crops[id] = { id: id, name: c.n, lvl: c.l, byCamp: {} });
              e.byCamp[camp] = c; if (D.order.indexOf(id) < 0) D.order.push(id);
            });
          });
        });
        return D;
      });
    });
  }
  function pts(e, prov, m) {
    var out = [];
    Object.keys(e.byCamp).sort().forEach(function (camp) {
      var c = e.byCamp[camp], a = prov === 'ES' ? c.t : c.v[prov]; if (!a) return;
      var v = m === 'yield' ? (a[3] > 0 && a[4] != null ? a[4] * 1000 / a[3] : null) : a[KEY[m]];
      if (v != null) out.push([camp, v]);
    });
    return out.length ? out : null;
  }
  var items = []; // se rellena al cargar: el explorador pide los elementos en create(), así que se rellena una lista viva
  var ex = window.CAExplorer.create({
    id: 'rd-es', tabsHost: 'rd-ca-tabs', usBody: 'rd-body', country: 'ES', nat: 'ES', map: 'DEHESA_ES_PROVINCES', noRegionLink: true, texts: T, items: items, defaultItem: 'cereales|CE1100', defaultMeasure: 'production', cite: 'mapa_es',
    load: function () { return loadAll().then(function (D) { items.length = 0; D.order.forEach(function (id) { var e = D.crops[id], n = (e.lvl ? '– ' : '') + e.name.replace(/\.\s*Resumen General/i, ''); items.push({ id: id, label: [n, n, n, n] }); }); return D; }); },
    pname: function (id) { var D = window.__rdEsD; return (D && D.names[id]) || id; },
    provIds: function (D) { window.__rdEsD = D; return Object.keys(D.provinces).filter(function (k) { return k !== 'ES'; }); },
    measures: function (D, id) { window.__rdEsD = D; var e = D.crops[id]; return e ? ['planted', 'rainfed', 'irrigated', 'harvested', 'production', 'yield'].filter(function (m) { return pts(e, 'ES', m); }) : []; },
    series: function (D, prov, id, m) { window.__rdEsD = D; var e = D.crops[id]; return e ? pts(e, prov, m) : null; },
    fmt: function (m, v) {
      var d = function (x, n) { try { return x.toLocaleString(window.DehesaShared.getLang(), { minimumFractionDigits: n, maximumFractionDigits: n }); } catch (e) { return x.toFixed(n); } };
      if (m === 'yield') return d(v, 0) + ' kg/ha';
      if (m === 'production') return v >= 1e6 ? d(v / 1e6, 2) + ' Mt' : v >= 1e3 ? d(v / 1e3, 1) + ' kt' : d(v, 0) + ' t';
      return v >= 1e6 ? d(v / 1e6, 2) + ' M ha' : v >= 1e3 ? d(v / 1e3, 1) + ' kha' : d(v, 0) + ' ha';
    },
    yTitle: function (m) { return m === 'yield' ? 'kg/ha' : m === 'production' ? 't' : 'ha'; },
    shareMeasure: function (m) { return m !== 'yield'; }
  });
  window.RDSpain = ex;
})();
