/* Dehesa Index — Mercados USDA. Lee data/ams/*.json (USDA AMS Market News, API MARS). */
(function () {
  'use strict';
  var IDX = null, CACHE = {}, SEL = { s: '', fam: null, id: null, f: {}, q: '', all: false, sel: null, lim: 60, span: 0 };
  var COL = '#2a6f97';
  var T = {
    es: { title: 'Mercados USDA', sub: 'Precios de mercado de EE. UU. tal como los publica USDA AMS Market News: piensos y subproductos, etanol, granos, legumbres, aves, huevos, ganado, heno, lácteos, frutas y hortalizas. Unidades y monedas originales, sin convertir.',
      family: 'Sector', report: 'Informe', search: 'Buscar', searchPh: 'p. ej. soybean, Iowa, alfalfa…', all: 'Incluir series sin dato reciente', desc: 'Producto', unit: 'Unidad', date: 'Fecha', price: 'Precio', range: 'Rango', chg: 'Var.', mid: 'punto medio del rango', shown: 'series', of: 'de', more: 'Mostrar más', none: 'Ninguna serie coincide con estos filtros.', noData: 'Los datos de mercados USDA aún no están disponibles.',
      history: 'Histórico', cols: 'Últimos datos', allv: 'Todos', open: 'Ver el informe en USDA', updated: 'Último dato del informe', pts: 'puntos',
      caveat: 'Son precios de mercado de EE. UU. publicados por USDA AMS; no son un índice de Dehesa Index ni son comparables con los europeos: cada informe tiene su propia base (lugar, calidad, entrega, unidad). Cuando el informe no da un precio medio, se muestra el punto medio del rango y se indica.',
      src: 'Fuente: USDA AMS Market News (API MARS), datos públicos del Gobierno de EE. UU.', methodLink: 'Metodología', fams: { feed: 'Piensos y subproductos', bio: 'Etanol y coproductos', grain: 'Granos y algodón', oilseed: 'Oleaginosas', pulse: 'Legumbres', rice: 'Arroz', poultry: 'Aves y huevos', meat: 'Carne y subproductos', pig: 'Cerdos de recría y ovino', cattle: 'Ganado directo', hay: 'Heno', dairy: 'Lácteos', auction: 'Subastas de ganado', costs: 'Costes de producción', fv: 'Frutas y hortalizas', retail: 'Ofertas de supermercado' } },
    en: { title: 'USDA markets', sub: 'U.S. market prices as published by USDA AMS Market News: feed and by-products, ethanol, grains, pulses, poultry, eggs, livestock, hay, dairy, fruits and vegetables. Original units and currencies, not converted.',
      family: 'Sector', report: 'Report', search: 'Search', searchPh: 'e.g. soybean, Iowa, alfalfa…', all: 'Include series with no recent data', desc: 'Product', unit: 'Unit', date: 'Date', price: 'Price', range: 'Range', chg: 'Chg.', mid: 'midpoint of the range', shown: 'series', of: 'of', more: 'Show more', none: 'No series match these filters.', noData: 'USDA market data is not available yet.',
      history: 'History', cols: 'Latest data', allv: 'All', open: 'View the report at USDA', updated: 'Latest data in the report', pts: 'points',
      caveat: 'These are U.S. market prices published by USDA AMS; they are not a Dehesa Index measure and are not comparable with European ones: each report has its own basis (place, quality, delivery, unit). When a report gives no average price, the midpoint of the range is shown and flagged.',
      src: 'Source: USDA AMS Market News (MARS API), public U.S. Government data.', methodLink: 'Methodology', fams: { feed: 'Feed and by-products', bio: 'Ethanol and co-products', grain: 'Grains and cotton', oilseed: 'Oilseeds', pulse: 'Pulses', rice: 'Rice', poultry: 'Poultry and eggs', meat: 'Meat and by-products', pig: 'Feeder pigs and sheep', cattle: 'Direct cattle', hay: 'Hay', dairy: 'Dairy', auction: 'Cattle auctions', costs: 'Production costs', fv: 'Fruits and vegetables', retail: 'Grocery features' } },
    fr: { title: 'Marchés USDA', sub: 'Prix de marché américains tels que publiés par USDA AMS Market News : aliments et sous-produits, éthanol, céréales, légumineuses, volaille, œufs, bétail, foin, produits laitiers, fruits et légumes. Unités et devises d’origine, sans conversion.',
      family: 'Secteur', report: 'Rapport', search: 'Rechercher', searchPh: 'ex. soybean, Iowa, alfalfa…', all: 'Inclure les séries sans donnée récente', desc: 'Produit', unit: 'Unité', date: 'Date', price: 'Prix', range: 'Fourchette', chg: 'Var.', mid: 'milieu de la fourchette', shown: 'séries', of: 'sur', more: 'Afficher plus', none: 'Aucune série ne correspond à ces filtres.', noData: 'Les données des marchés USDA ne sont pas encore disponibles.',
      history: 'Historique', cols: 'Dernières données', allv: 'Tous', open: 'Voir le rapport chez l’USDA', updated: 'Dernière donnée du rapport', pts: 'points',
      caveat: 'Ce sont des prix de marché américains publiés par USDA AMS ; ils ne constituent pas un indicateur de Dehesa Index et ne sont pas comparables aux prix européens : chaque rapport a sa propre base (lieu, qualité, livraison, unité). Lorsqu’un rapport ne donne pas de prix moyen, le milieu de la fourchette est affiché et signalé.',
      src: 'Source : USDA AMS Market News (API MARS), données publiques du gouvernement américain.', methodLink: 'Méthodologie', fams: { feed: 'Aliments et sous-produits', bio: 'Éthanol et coproduits', grain: 'Céréales et coton', oilseed: 'Oléagineux', pulse: 'Légumineuses', rice: 'Riz', poultry: 'Volaille et œufs', meat: 'Viande et sous-produits', pig: 'Porcelets et ovins', cattle: 'Bétail direct', hay: 'Foin', dairy: 'Produits laitiers', auction: 'Ventes aux enchères de bétail', costs: 'Coûts de production', fv: 'Fruits et légumes', retail: 'Promotions en supermarché' } },
    it: { title: 'Mercati USDA', sub: 'Prezzi di mercato USA come pubblicati da USDA AMS Market News: mangimi e sottoprodotti, etanolo, cereali, legumi, pollame, uova, bestiame, fieno, latticini, frutta e verdura. Unità e valute originali, senza conversione.',
      family: 'Settore', report: 'Rapporto', search: 'Cerca', searchPh: 'es. soybean, Iowa, alfalfa…', all: 'Includi serie senza dati recenti', desc: 'Prodotto', unit: 'Unità', date: 'Data', price: 'Prezzo', range: 'Intervallo', chg: 'Var.', mid: 'punto medio dell’intervallo', shown: 'serie', of: 'di', more: 'Mostra altro', none: 'Nessuna serie corrisponde a questi filtri.', noData: 'I dati dei mercati USDA non sono ancora disponibili.',
      history: 'Storico', cols: 'Ultimi dati', allv: 'Tutti', open: 'Vedi il rapporto presso USDA', updated: 'Ultimo dato del rapporto', pts: 'punti',
      caveat: 'Sono prezzi di mercato USA pubblicati da USDA AMS; non sono un indicatore di Dehesa Index e non sono confrontabili con quelli europei: ogni rapporto ha la propria base (luogo, qualità, consegna, unità). Quando un rapporto non fornisce un prezzo medio, viene mostrato il punto medio dell’intervallo e segnalato.',
      src: 'Fonte: USDA AMS Market News (API MARS), dati pubblici del governo USA.', methodLink: 'Metodologia', fams: { feed: 'Mangimi e sottoprodotti', bio: 'Etanolo e coprodotti', grain: 'Cereali e cotone', oilseed: 'Semi oleosi', pulse: 'Legumi', rice: 'Riso', poultry: 'Pollame e uova', meat: 'Carne e sottoprodotti', pig: 'Suinetti e ovini', cattle: 'Bestiame diretto', hay: 'Fieno', dairy: 'Latticini', auction: 'Aste di bestiame', costs: 'Costi di produzione', fv: 'Frutta e verdura', retail: 'Offerte nei supermercati' } }
  };
  var FAM_ORDER = ['feed', 'bio', 'grain', 'oilseed', 'pulse', 'rice', 'poultry', 'meat', 'pig', 'cattle', 'hay', 'dairy', 'auction', 'costs', 'fv', 'retail'];
  function lang() { return window.DehesaShared.getLang(); }
  function t() { return T[lang()] || T.es; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return new Intl.NumberFormat(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(v); } catch (e) { return v.toFixed(d); } }
  function fmt(v) { var a = Math.abs(v); return nf(v, a >= 1000 ? 0 : a >= 100 ? 1 : 2); }
  function val(p) { if (p[1] !== null) return { v: p[1], mid: false }; if (p[2] !== null && p[3] !== null) return { v: (p[2] + p[3]) / 2, mid: true }; if (p[2] !== null) return { v: p[2], mid: false }; if (p[3] !== null) return { v: p[3], mid: false }; return null; }
  function dateTxt(d) { try { return new Date(d + 'T12:00:00Z').toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return d; } }
  function load(id) {
    if (CACHE[id]) return Promise.resolve(CACHE[id]);
    return fetch('data/ams/' + id + '.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d) CACHE[id] = d; return d; }).catch(function () { return null; });
  }
  function labelOf(doc, s) { var o = []; doc.dn.forEach(function (n, i) { if (n !== 'Section' && s.v[i]) o.push(s.v[i]); }); return o.join(' · '); }
  function pretty(n) { n = String(n).replace(/[_]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim(); return n.charAt(0).toUpperCase() + n.slice(1); }
  function reportsOf(fam) { return IDX.reports.filter(function (r) { return r.fam === fam; }).sort(function (a, b) { return a.title.localeCompare(b.title); }); }
  function cutoff(doc) { var d = new Date(doc.lastDate + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - (doc.freq === 'd' ? 10 : 24)); return d.toISOString().slice(0, 10); }

  function chart(s) {
    var pts = [];
    s.p.forEach(function (p) { var v = val(p); if (v) pts.push({ d: p[0], v: v.v, lo: p[2], hi: p[3], mid: v.mid }); });
    if (SEL.span && pts.length > 2) { var kk = DIRange.cut(pts.map(function (p) { return [p.d]; }), SEL.span).length; pts = pts.slice(-kk); }
    if (pts.length < 2) return '<p class="di-movers-hint">' + esc(t().history) + ': ' + pts.length + ' ' + esc(t().pts) + '</p>';
    var W = 640, H = 232, L = 68, R = 14, Tp = 12, B = 48, vs = pts.map(function (p) { return p.v; }), unit = s.u || '';
    var mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs);
    if (mx === mn) { mx += 1; mn -= 1; } else { var pad = (mx - mn) * 0.12; mn -= pad; mx += pad; }
    var x = function (i) { return L + i * (W - L - R) / (pts.length - 1); }, y = function (v) { return Tp + (mx - v) / (mx - mn) * (H - Tp - B); };
    var g = '', i, k, TX = 'font-size="11.5" fill="var(--text-faint)"';
    var raw = (mx - mn) / 4, ex = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), fr = raw / ex, step = (fr <= 1 ? 1 : fr <= 2 ? 2 : fr <= 2.5 ? 2.5 : fr <= 5 ? 5 : 10) * ex, sd = step >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log(step) / Math.LN10 - 1e-9));
    for (var gv = Math.ceil(mn / step) * step; gv <= mx + step / 1000; gv += step) { g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(gv).toFixed(1) + '" y2="' + y(gv).toFixed(1) + '" stroke="var(--border)"/><text x="' + (L - 7) + '" y="' + (y(gv) + 4).toFixed(1) + '" text-anchor="end" ' + TX + '>' + nf(gv, sd) + '</text>'; }
    var t0 = Date.parse(pts[0].d + 'T12:00:00Z'), t1 = Date.parse(pts[pts.length - 1].d + 'T12:00:00Z'), tk = [], seen = {};
    [0, 1, 2, 3].forEach(function (n) { var j = Math.round(n * (pts.length - 1) / 3); if (!seen[j]) { seen[j] = 1; tk.push(j); } });
    tk.forEach(function (j, n) { var ts = Date.parse(pts[j].d + 'T12:00:00Z'); g += '<line x1="' + x(j).toFixed(1) + '" x2="' + x(j).toFixed(1) + '" y1="' + (H - B) + '" y2="' + (H - B + 4) + '" stroke="var(--border)"/><text x="' + x(j).toFixed(1) + '" y="' + (H - B + 17) + '" text-anchor="' + (n === 0 ? 'start' : n === tk.length - 1 ? 'end' : 'middle') + '" ' + TX + '>' + esc(window.DehesaChart ? window.DehesaChart.fmtDate(ts, t1 - t0) : pts[j].d) + '</text>'; });
    var yt = unit.length > 26 ? unit.slice(0, 25) + '…' : unit;
    g += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" ' + TX + ' font-weight="600">' + esc(t().date) + '</text><text transform="translate(13 ' + ((Tp + H - B) / 2) + ') rotate(-90)" text-anchor="middle" ' + TX + ' font-weight="600">' + esc(yt) + '</text>';
    var path = ''; pts.forEach(function (p, j) { path += (j ? ' L' : 'M') + x(j).toFixed(1) + ',' + y(p.v).toFixed(1); });
    g += '<path d="' + path + '" fill="none" stroke="' + COL + '" stroke-width="2" stroke-linejoin="round"/><circle cx="' + x(pts.length - 1).toFixed(1) + '" cy="' + y(pts[pts.length - 1].v).toFixed(1) + '" r="4" fill="' + COL + '" stroke="var(--surface,#fff)" stroke-width="2"/>';
    var spec = { L: L, R: W - R, T: Tp, B: H - B, s: [{ n: yt, c: COL, p: pts.map(function (p, j) { return [+x(j).toFixed(1), +y(p.v).toFixed(1), fmt(p.v) + ' ' + unit + (p.mid ? ' (' + t().mid + ')' : '') + (p.lo !== null && p.hi !== null && !p.mid && p.lo !== p.hi ? ' · ' + t().range + ' ' + fmt(p.lo) + '–' + fmt(p.hi) : ''), dateTxt(p.d), p.v]; }) }] };
    var h = '<div><svg id="ms-ch" viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block;touch-action:pan-y" role="img" aria-label="' + esc(t().history) + '"' + (window.DehesaChart ? window.DehesaChart.attr(spec).replace(' style="touch-action:pan-y"', '') : '') + '>' + g + '</svg></div>';
    return { html: h, pts: pts, W: W, L: L, R: R };
  }

function ci(id, o) { return window.DICite && id ? window.DICite.html(id, o || {}) : ''; }
  /* ---- Rediseño: buscador primero, filtros por pasos, tabla legible, URL compartible ---- */
  var U = {
    es: { q: '¿Qué precio buscas?', qh: 'Escribe un producto y, si quieres, un lugar: «maíz Iowa», «heno», «huevos». Los lugares se buscan en el nombre del informe.', go: 'Buscar', reset: 'Empezar de nuevo', prods: 'Productos frecuentes', secs: 'O explora por sector', rn: 'informes', rn1: 'informe', adv: 'Modo avanzado: elegir sector e informe', mf: 'Más filtros', cf: 'Borrar filtros', fs: 'Filtrar series', fsPh: 'p. ej. novillos, Texas…',
      sum: '{n} series', sumR: '{n} series en {m} informes', last: 'último dato {d}', load: 'Cargando informes… {a} de {b}', loadErr: '{n} informes no se pudieron cargar.',
      stale: 'Este informe no se actualiza desde el {d} (hace {n} días): los precios pueden no estar vigentes.', skipped: 'Se han omitido {n} informes sin datos recientes.', incl: 'Incluirlos', hid: '{n} series ocultas por no tener dato reciente.', show: 'Mostrarlas', old: 'Sin dato reciente', capped: 'Encajan {n} informes; se muestran los {m} más recientes. Añade un lugar para afinar.',
      nores: 'No hemos encontrado «{q}». Prueba con uno de los productos de arriba o añade un lugar, por ejemplo «maíz Iowa».', close: 'Cerrar gráfico', cap: 'Series de precios de mercado. Pulsa el nombre de una serie para ver su histórico.', up: 'sube', dn: 'baja', in: 'En', sector: 'Sector' },
    en: { q: 'What price are you looking for?', qh: 'Type a product and, if you like, a place: “corn Iowa”, “hay”, “eggs”. Places are matched against the report name.', go: 'Search', reset: 'Start over', prods: 'Popular products', secs: 'Or browse by sector', rn: 'reports', rn1: 'report', adv: 'Advanced mode: choose sector and report', mf: 'More filters', cf: 'Clear filters', fs: 'Filter series', fsPh: 'e.g. steers, Texas…',
      sum: '{n} series', sumR: '{n} series in {m} reports', last: 'latest data {d}', load: 'Loading reports… {a} of {b}', loadErr: '{n} reports could not be loaded.',
      stale: 'This report has not been updated since {d} ({n} days ago): prices may not be current.', skipped: '{n} reports with no recent data were left out.', incl: 'Include them', hid: '{n} series hidden because they have no recent data.', show: 'Show them', old: 'No recent data', capped: '{n} reports match; the {m} most recent are shown. Add a place to narrow it down.',
      nores: 'We found nothing for “{q}”. Try one of the products above or add a place, for example “corn Iowa”.', close: 'Close chart', cap: 'Market price series. Press a series name to see its history.', up: 'up', dn: 'down', in: 'In', sector: 'Sector' },
    fr: { q: 'Quel prix cherchez-vous ?', qh: 'Saisissez un produit et, si vous voulez, un lieu : « maïs Iowa », « foin », « œufs ». Les lieux sont cherchés dans le nom du rapport.', go: 'Rechercher', reset: 'Recommencer', prods: 'Produits courants', secs: 'Ou parcourez par secteur', rn: 'rapports', rn1: 'rapport', adv: 'Mode avancé : choisir secteur et rapport', mf: 'Plus de filtres', cf: 'Effacer les filtres', fs: 'Filtrer les séries', fsPh: 'ex. bouvillons, Texas…',
      sum: '{n} séries', sumR: '{n} séries dans {m} rapports', last: 'dernière donnée {d}', load: 'Chargement des rapports… {a} sur {b}', loadErr: '{n} rapports n’ont pas pu être chargés.',
      stale: 'Ce rapport n’est plus mis à jour depuis le {d} (il y a {n} jours) : les prix peuvent ne plus être valables.', skipped: '{n} rapports sans données récentes ont été écartés.', incl: 'Les inclure', hid: '{n} séries masquées faute de donnée récente.', show: 'Les afficher', old: 'Sans donnée récente', capped: '{n} rapports correspondent ; les {m} plus récents sont affichés. Ajoutez un lieu pour affiner.',
      nores: 'Aucun résultat pour « {q} ». Essayez l’un des produits ci-dessus ou ajoutez un lieu, par exemple « maïs Iowa ».', close: 'Fermer le graphique', cap: 'Séries de prix de marché. Appuyez sur le nom d’une série pour voir son historique.', up: 'hausse', dn: 'baisse', in: 'Dans', sector: 'Secteur' },
    it: { q: 'Quale prezzo cerchi?', qh: 'Scrivi un prodotto e, se vuoi, un luogo: «mais Iowa», «fieno», «uova». I luoghi si cercano nel nome del rapporto.', go: 'Cerca', reset: 'Ricomincia', prods: 'Prodotti frequenti', secs: 'Oppure sfoglia per settore', rn: 'rapporti', rn1: 'rapporto', adv: 'Modalità avanzata: scegli settore e rapporto', mf: 'Altri filtri', cf: 'Cancella i filtri', fs: 'Filtra le serie', fsPh: 'es. manzi, Texas…',
      sum: '{n} serie', sumR: '{n} serie in {m} rapporti', last: 'ultimo dato {d}', load: 'Caricamento dei rapporti… {a} di {b}', loadErr: '{n} rapporti non si sono potuti caricare.',
      stale: 'Questo rapporto non viene aggiornato dal {d} ({n} giorni fa): i prezzi potrebbero non essere attuali.', skipped: '{n} rapporti senza dati recenti sono stati esclusi.', incl: 'Includili', hid: '{n} serie nascoste perché senza dato recente.', show: 'Mostrale', old: 'Nessun dato recente', capped: 'Corrispondono {n} rapporti; si mostrano i {m} più recenti. Aggiungi un luogo per restringere.',
      nores: 'Nessun risultato per «{q}». Prova uno dei prodotti qui sopra o aggiungi un luogo, ad esempio «mais Iowa».', close: 'Chiudi il grafico', cap: 'Serie di prezzi di mercato. Premi il nome di una serie per vedere lo storico.', up: 'sale', dn: 'scende', in: 'In', sector: 'Settore' }
  };
  var L4 = { es: 0, en: 1, fr: 2, it: 3 }, LI = { es: 0, fr: 1, it: 2 };
  function u() { return U[lang()] || U.es; }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] === undefined ? m : o[k]; }); }
  function nz(s) { s = String(s).toLowerCase(); try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {} return s; }
  function rxe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* Traducciones: solo equivalentes seguros; lo que no está aquí se deja con el nombre original de USDA. [es, fr, it] */
  var DV = {
    'corn': ['Maíz', 'Maïs', 'Mais'], 'soybeans': ['Soja', 'Soja', 'Soia'], 'wheat': ['Trigo', 'Blé', 'Frumento'], 'hay': ['Heno', 'Foin', 'Fieno'], 'alfalfa': ['Alfalfa', 'Luzerne', 'Erba medica'],
    'cattle': ['Ganado bovino', 'Bovins', 'Bovini'], 'steers': ['Novillos', 'Bouvillons', 'Manzi'], 'heifers': ['Novillas', 'Génisses', 'Manze'], 'cows': ['Vacas', 'Vaches', 'Vacche'], 'bulls': ['Toros', 'Taureaux', 'Tori'],
    'bred cows': ['Vacas gestantes', 'Vaches gestantes', 'Vacche gravide'], 'bred heifers': ['Novillas gestantes', 'Génisses gestantes', 'Manze gravide'], 'cow-calf pairs': ['Vacas con cría', 'Vaches avec veau', 'Vacche con vitello'],
    'stock cows': ['Vacas de cría', 'Vaches allaitantes', 'Vacche da riproduzione'], 'feeder cattle': ['Ganado de cebo', 'Bovins d’engraissement', 'Bovini da ingrasso'], 'slaughter cattle': ['Ganado de sacrificio', 'Bovins d’abattage', 'Bovini da macello'], 'replacement cattle': ['Ganado de reposición', 'Bovins de renouvellement', 'Bovini da rimonta'],
    'sheep': ['Ovino', 'Ovins', 'Ovini'], 'goats': ['Caprino', 'Caprins', 'Caprini'], 'dairy': ['Lácteos', 'Produits laitiers', 'Latticini'], 'apples': ['Manzanas', 'Pommes', 'Mele'], 'potatoes': ['Patatas', 'Pommes de terre', 'Patate'],
    'frozen': ['Congelado', 'Surgelé', 'Congelato'], 'fresh': ['Fresco', 'Frais', 'Fresco'], 'conventional': ['Convencional', 'Conventionnel', 'Convenzionale'], 'organic': ['Ecológico', 'Biologique', 'Biologico'],
    'delivered': ['Entregado', 'Livré', 'Consegnato'], 'cash': ['Al contado', 'Comptant', 'Contanti'], 'new crop': ['Cosecha nueva', 'Nouvelle récolte', 'Nuovo raccolto'], 'old crop': ['Cosecha anterior', 'Ancienne récolte', 'Vecchio raccolto'],
    'yellow': ['Amarillo', 'Jaune', 'Giallo'], 'large round': ['Redonda grande', 'Ronde grande', 'Rotonda grande'], 'small square': ['Cuadrada pequeña', 'Carrée petite', 'Quadrata piccola'], 'large': ['Grande', 'Grand', 'Grande'], 'medium': ['Mediano', 'Moyen', 'Medio'], 'small': ['Pequeño', 'Petit', 'Piccolo'],
    'national': ['Nacional', 'National', 'Nazionale'], 'midwest': ['Medio Oeste', 'Midwest', 'Midwest'], 'northeast': ['Noreste', 'Nord-Est', 'Nord-Est'], 'southeast': ['Sureste', 'Sud-Est', 'Sud-Est'], 'southwest': ['Suroeste', 'Sud-Ouest', 'Sud-Ovest'], 'northwest': ['Noroeste', 'Nord-Ouest', 'Nord-Ovest'], 'central': ['Centro', 'Centre', 'Centro'], 'mexico': ['México', 'Mexique', 'Messico'], 'canada': ['Canadá', 'Canada', 'Canada'],
    'average': ['Medio', 'Moyen', 'Medio'], 'premium': ['Premium', 'Premium', 'Premium'], 'good': ['Bueno', 'Bon', 'Buono'], 'choice': ['Choice', 'Choice', 'Choice']
  };
  var DU = {
    'per cwt': ['por cwt (100 lb)', 'par cwt (100 lb)', 'per cwt (100 lb)'], '$ per cwt': ['$ por cwt (100 lb)', '$ par cwt (100 lb)', '$ per cwt (100 lb)'], 'per unit': ['por unidad', 'par unité', 'per unità'], 'per lb': ['por libra', 'par livre', 'per libbra'],
    '$ per bushel': ['$ por bushel', '$ par boisseau', '$ per bushel'], 'per ton': ['por tonelada', 'par tonne', 'per tonnellata'], '$ per ton': ['$ por tonelada', '$ par tonne', '$ per tonnellata'], 'dollars per ton': ['$ por tonelada', '$ par tonne', '$ per tonnellata'], 'per bale': ['por paca', 'par balle', 'per balla'], 'per carton': ['por caja', 'par carton', 'per cartone'],
    'usd per package (see package)': ['USD por envase (ver «Envase»)', 'USD par emballage (voir « Emballage »)', 'USD per confezione (vedi «Confezione»)'], 'dollars per pound': ['$ por libra', '$ par livre', '$ per libbra'], '$ per pound': ['$ por libra', '$ par livre', '$ per libbra'], 'cents per lb': ['centavos por libra', 'cents par livre', 'centesimi per libbra'], 'cents per dozen': ['centavos por docena', 'cents par douzaine', 'centesimi per dozzina'],
    'dollars per metric ton': ['$ por tonelada métrica', '$ par tonne métrique', '$ per tonnellata metrica'], 'each': ['por unidad', 'à l’unité', 'cadauno'], 'per head': ['por cabeza', 'par tête', 'per capo'], '$ per gallon': ['$ por galón', '$ par gallon', '$ per gallone'], 'dollars per gallon': ['$ por galón', '$ par gallon', '$ per gallone'], 'per bundle': ['por fardo', 'par botte', 'per fascio']
  };
  var DD = {
    'class': ['Clase', 'Classe', 'Classe'], 'commodity': ['Producto', 'Produit', 'Prodotto'], 'lot_desc': ['Tipo de lote', 'Type de lot', 'Tipo di lotto'], 'frame': ['Tamaño (frame)', 'Gabarit (frame)', 'Taglia (frame)'], 'muscle_grade': ['Musculatura', 'Musculature', 'Muscolosità'], 'quality_grade_name': ['Calidad', 'Qualité', 'Qualità'],
    'age': ['Edad', 'Âge', 'Età'], 'pregnancy_stage': ['Fase de gestación', 'Stade de gestation', 'Fase di gravidanza'], 'offspring_weight_est': ['Peso estimado de la cría', 'Poids estimé du veau', 'Peso stimato del vitello'], 'yield_grade': ['Rendimiento (yield)', 'Rendement (yield)', 'Resa (yield)'], 'weight_collect': ['Peso', 'Poids', 'Peso'],
    'grade': ['Grado', 'Grade', 'Grado'], 'package': ['Envase', 'Emballage', 'Confezione'], 'pkg': ['Envase', 'Emballage', 'Confezione'], 'item_size': ['Tamaño', 'Calibre', 'Calibro'], 'category': ['Categoría', 'Catégorie', 'Categoria'], 'quality': ['Calidad', 'Qualité', 'Qualità'], 'variety': ['Variedad', 'Variété', 'Varietà'],
    'freight': ['Flete', 'Fret', 'Trasporto'], 'origin': ['Origen', 'Origine', 'Origine'], 'district': ['Distrito', 'District', 'Distretto'], 'desc': ['Descripción', 'Description', 'Descrizione'], 'region': ['Región', 'Région', 'Regione'], 'protein': ['Proteína', 'Protéine', 'Proteine'], 'condition': ['Condición', 'État', 'Condizione'],
    'trade_loc': ['Lugar de entrega', 'Lieu de livraison', 'Luogo di consegna'], 'appearance': ['Aspecto', 'Aspect', 'Aspetto'], 'properties': ['Propiedades', 'Propriétés', 'Proprietà']
  };
  function tr3(map, key, orig) { var L = lang(); if (L === 'en') return orig; var e = map[String(key).toLowerCase().trim()]; return e && e[LI[L]] ? e[LI[L]] : orig; }
  function tv(v) { return tr3(DV, v, v); }
  function tu(v) { return tr3(DU, v, v); }
  function td(n) { return tr3(DD, n, pretty(n)); }
  function descOf(doc, s) { var o = []; doc.dn.forEach(function (n, i) { if (n !== 'Section' && s.v[i]) o.push(tv(s.v[i])); }); return o.join(' · ') || doc.title; }

  /* Productos frecuentes: l = [es,en,fr,it]; syn = palabras (sin acentos) que los identifican en los 4 idiomas; rx = cómo aparece en los datos USDA; fams = sectores donde buscar; nf = palabras que significan «todo el sector» (sin filtrar series) */
  var P = [
    { k: 'corn', e: '🌽', l: ['Maíz', 'Corn', 'Maïs', 'Mais'], syn: ['maiz', 'corn', 'mais'], rx: 'corn', fams: ['grain', 'feed', 'bio'] },
    { k: 'soy', e: '🫘', l: ['Soja', 'Soybeans', 'Soja', 'Soia'], syn: ['soja', 'soya', 'soia', 'soy', 'soybean', 'soybeans'], rx: 'soy(bean)?s?', fams: ['grain', 'feed', 'oilseed'] },
    { k: 'wheat', e: '🌾', l: ['Trigo', 'Wheat', 'Blé', 'Frumento'], syn: ['trigo', 'wheat', 'ble', 'frumento'], rx: 'wheat', fams: ['grain'] },
    { k: 'rice', e: '🍚', l: ['Arroz', 'Rice', 'Riz', 'Riso'], syn: ['arroz', 'rice', 'riz', 'riso'], rx: 'rice', fams: ['rice'], nf: ['arroz', 'rice', 'riz', 'riso'] },
    { k: 'cattle', e: '🐄', l: ['Vacuno', 'Cattle', 'Bovins', 'Bovini'], syn: ['vacuno', 'bovino', 'bovinos', 'ganado', 'vaca', 'vacas', 'novillo', 'novillos', 'bovins', 'betail', 'bovini', 'bestiame', 'cattle', 'beef', 'ternera'], rx: 'cattle|steers?|heifers?|cows?|beef|bulls?|calves|calf', fams: ['cattle', 'meat'], nf: ['vacuno', 'cattle', 'bovins', 'bovini', 'ganado', 'betail', 'bestiame'] },
    { k: 'pig', e: '🐖', l: ['Porcino', 'Hogs', 'Porc', 'Suini'], syn: ['cerdo', 'cerdos', 'porcino', 'porc', 'porcs', 'maiale', 'suini', 'hog', 'hogs', 'pork', 'swine', 'pig', 'pigs'], rx: 'hogs?|pork|swine|pigs?', fams: ['pig', 'meat'], nf: ['porcino', 'hogs', 'porc', 'suini', 'cerdo', 'cerdos'] },
    { k: 'sheep', e: '🐑', l: ['Ovino', 'Sheep', 'Ovins', 'Ovini'], syn: ['ovino', 'cordero', 'corderos', 'oveja', 'ovejas', 'ovins', 'agneau', 'ovini', 'agnello', 'sheep', 'lamb', 'lambs', 'goat', 'goats', 'cabra'], rx: 'sheep|lambs?|goats?', fams: ['pig', 'meat'], nf: ['ovino', 'sheep', 'ovins', 'ovini'] },
    { k: 'poultry', e: '🐔', l: ['Aves', 'Poultry', 'Volaille', 'Pollame'], syn: ['ave', 'aves', 'pollo', 'pollos', 'pavo', 'volaille', 'poulet', 'dinde', 'pollame', 'tacchino', 'poultry', 'chicken', 'turkey', 'broiler'], rx: 'chicken|broilers?|turkeys?|poultry|fowl', fams: ['poultry'], nf: ['aves', 'ave', 'poultry', 'volaille', 'pollame'] },
    { k: 'eggs', e: '🥚', l: ['Huevos', 'Eggs', 'Œufs', 'Uova'], syn: ['huevo', 'huevos', 'oeuf', 'oeufs', 'uovo', 'uova', 'egg', 'eggs'], rx: 'eggs?', fams: ['poultry'] },
    { k: 'dairy', e: '🥛', l: ['Lácteos', 'Dairy', 'Produits laitiers', 'Latticini'], syn: ['lacteos', 'lacteo', 'leche', 'lait', 'latte', 'queso', 'fromage', 'formaggio', 'mantequilla', 'beurre', 'burro', 'suero', 'dairy', 'milk', 'cheese', 'butter', 'whey'], rx: 'dairy|milk|cheese|butter|whey|cream', fams: ['dairy'], nf: ['lacteos', 'lacteo', 'dairy', 'produits', 'latticini'] },
    { k: 'hay', e: '🌿', l: ['Heno', 'Hay', 'Foin', 'Fieno'], syn: ['heno', 'foin', 'fieno', 'hay', 'alfalfa', 'luzerne'], rx: 'hay|alfalfa', fams: ['hay'], nf: ['heno', 'foin', 'fieno', 'hay'] },
    { k: 'feed', e: '🧺', l: ['Piensos', 'Feed', 'Aliments', 'Mangimi'], syn: ['pienso', 'piensos', 'aliments', 'mangime', 'mangimi', 'feed', 'feedstuff'], rx: 'feed', fams: ['feed'], nf: ['pienso', 'piensos', 'aliments', 'mangime', 'mangimi', 'feed', 'feedstuff'] },
    { k: 'ethanol', e: '⛽', l: ['Etanol', 'Ethanol', 'Éthanol', 'Etanolo'], syn: ['etanol', 'ethanol', 'etanolo'], rx: 'ethanol', fams: ['bio'], nf: ['etanol', 'ethanol', 'etanolo'] },
    { k: 'fv', e: '🍎', l: ['Fruta y verdura', 'Fruit and veg', 'Fruits et légumes', 'Frutta e verdura'], syn: ['fruta', 'frutas', 'verdura', 'verduras', 'hortalizas', 'fruit', 'fruits', 'legumes', 'vegetables', 'frutta'], sector: 'fv' }
  ];
  var EX = { es: ['maíz Iowa', 'soja Illinois', 'trigo Kansas', 'heno', 'huevos', 'leche'], en: ['corn Iowa', 'soybeans Illinois', 'wheat Kansas', 'hay', 'eggs', 'milk'], fr: ['maïs Iowa', 'soja Illinois', 'blé Kansas', 'foin', 'œufs', 'lait'], it: ['mais Iowa', 'soia Illinois', 'frumento Kansas', 'fieno', 'uova', 'latte'] };
  var FAME = { feed: '🧺', bio: '⛽', grain: '🌾', oilseed: '🌻', pulse: '🫘', rice: '🍚', poultry: '🐔', meat: '🥩', pig: '🐖', cattle: '🐄', hay: '🌿', dairy: '🥛', auction: '🔨', costs: '🧾', fv: '🍎', retail: '🛒' };
  function prodOf(tok) { for (var i = 0; i < P.length; i++) if (P[i].syn.indexOf(tok) >= 0) return P[i]; return null; }
  function prodByLabel(s) { var n = nz(s).trim(); for (var i = 0; i < P.length; i++) for (var j = 0; j < 4; j++) if (nz(P[i].l[j]) === n) return P[i]; return null; }

  /* ---- Búsqueda: de lo que escribe la persona a la lista de informes que hay que abrir ---- */
  var RXC = {};
  function titleHas(r, tk) { var k = 't' + tk; if (!RXC[k]) RXC[k] = new RegExp('\\b' + rxe(tk)); return RXC[k].test(nz(r.title)); }
  function ageDays(d) { return Math.floor((Date.now() - Date.parse(d + 'T12:00:00Z')) / 864e5); }
  function repStale(r, wide) { var a = ageDays(r.lastDate); return a > (r.freq === 'd' ? (wide ? 21 : 7) : (wide ? 60 : 21)); }
  function resolve(s) {
    var toks = nz(s).replace(/[«»"“”‘’,;:()¿?¡!]/g, ' ').split(/\s+/).filter(Boolean), prods = [], raws = [], i;
    toks.forEach(function (tk) { var p = prodOf(tk); if (p) prods.push({ p: p, tk: tk }); else raws.push(tk); });
    if (prods.length === 1 && !raws.length && prods[0].p.sector) return { sector: prods[0].p.sector };
    var pf = null; for (i = 0; i < prods.length; i++) if (!prods[i].p.sector) { pf = prods[i].p; break; }
    var pool = pf ? IDX.reports.filter(function (r) { return pf.fams.indexOf(r.fam) >= 0; }) : IDX.reports;
    var tt = [], st = [];
    raws.forEach(function (tk) { if (pool.some(function (r) { return titleHas(r, tk); })) tt.push(tk); else st.push(tk); });
    var cands = pool.filter(function (r) { return tt.every(function (tk) { return titleHas(r, tk); }); });
    if (!cands.length && tt.length) { cands = pool; st = st.concat(tt); tt = []; }
    if (!pf && !tt.length) cands = [];
    var tests = [];
    prods.forEach(function (o) { if (o.p.rx && !(o.p.nf && o.p.nf.indexOf(o.tk) >= 0)) { var rx = new RegExp('\\b(' + o.p.rx + ')'); tests.push(function (h) { return rx.test(h.en); }); } });
    st.forEach(function (tk) { tests.push(function (h) { return h.all.indexOf(tk) >= 0; }); });
    var omitted = 0;
    if (!SEL.all) { var keep = cands.filter(function (r) { return !repStale(r, true); }); omitted = cands.length - keep.length; cands = keep; }
    cands = cands.slice().sort(function (a, b) { return a.lastDate < b.lastDate ? 1 : a.lastDate > b.lastDate ? -1 : b.series - a.series; });
    var total = cands.length; if (cands.length > 60) cands = cands.slice(0, 60);
    return { cands: cands, tests: tests, omitted: omitted, total: total };
  }

  /* ---- Estado compartido de la vista ---- */
  var MODE = 'home', CANDS = [], TESTS = [], LOADING = 0, LOADERR = 0, RUN = 0, MFOPEN = false, ADVOPEN = false, META = {};
  function curDocs() {
    if (MODE === 'report') return CACHE[SEL.id] ? [CACHE[SEL.id]] : [];
    var o = []; CANDS.forEach(function (c) { if (CACHE[c.id]) o.push(CACHE[c.id]); }); return o;
  }
  function syncUrl() {
    if (!window.history || !history.replaceState) return;
    try {
      var p = new URLSearchParams(window.location.search), del = [];
      p.forEach(function (v, k) { if (/^(s|fam|r|q|all|sel|span)$/.test(k) || k.indexOf('f_') === 0) del.push(k); });
      del.forEach(function (k) { p.delete(k); });
      if (MODE === 'report') { p.set('r', SEL.id); } else if (MODE === 'search') p.set('s', SEL.s);
      if (MODE === 'home' && SEL.fam) p.set('fam', SEL.fam);
      if (SEL.q) p.set('q', SEL.q);
      if (SEL.all) p.set('all', '1');
      if (SEL.sel) p.set('sel', SEL.sel);
      if (SEL.span) p.set('span', SEL.span);
      Object.keys(SEL.f).forEach(function (n) { if (SEL.f[n]) p.set('f_' + n, SEL.f[n]); });
      var qs = p.toString();
      history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
    } catch (e) {}
  }
  function activeFilters() { var n = 0; Object.keys(SEL.f).forEach(function (k) { if (SEL.f[k]) n++; }); return n + (SEL.all ? 1 : 0); }

  function hero() {
    var x = t(), y = u(), L = L4[lang()] || 0, act = prodByLabel(SEL.s);
    var dl = EX[lang()].concat(P.map(function (p) { return p.l[L]; })).map(function (s) { return '<option value="' + esc(s) + '"></option>'; }).join('');
    var pb = P.map(function (p) {
      return '<button type="button" class="um-prod" data-p="' + p.k + '" aria-pressed="' + (act === p ? 'true' : 'false') + '"><span class="um-emo" aria-hidden="true">' + p.e + '</span><span>' + esc(p.l[L]) + '</span></button>';
    }).join('');
    return '<section class="um-hero" aria-labelledby="um-h"><h2 id="um-h" class="um-q">' + esc(y.q) + '</h2>' +
      '<form id="um-form" class="um-form" role="search" autocomplete="off"><label class="visually-hidden" for="um-s">' + esc(y.q) + '</label><input id="um-s" class="um-input" type="search" list="um-dl" value="' + esc(MODE === 'search' ? SEL.s : '') + '" placeholder="' + esc(EX[lang()][0]) + '" enterkeyhint="search" aria-describedby="um-hint"><button type="submit" class="di-btn-gold um-go">' + esc(y.go) + '</button></form>' +
      '<datalist id="um-dl">' + dl + '</datalist><p id="um-hint" class="um-hint">' + esc(y.qh) + '</p>' +
      '<div class="um-prods" role="group" aria-label="' + esc(y.prods) + '">' + pb + '</div></section>';
  }
  function filtersBox(doc) {
    var x = t(), y = u(), n = activeFilters(), dims = '', rowsAll = [];
    if (MODE === 'report' && doc) {
      var co = cutoff(doc); doc.series.forEach(function (s) { if (SEL.all || s.p[s.p.length - 1][0] >= co) rowsAll.push(s); });
      doc.dn.forEach(function (name, di) {
        if (name === 'Section') return;
        var vals = {}; rowsAll.forEach(function (s) { vals[s.v[di]] = 1; });
        var list = Object.keys(vals).filter(Boolean).sort();
        if (list.length < 2 || list.length > 60) return;
        dims += '<div class="um-fld"><label for="um-d-' + di + '">' + esc(td(name)) + '</label><select id="um-d-' + di + '" class="di-compare-select" data-dim="' + esc(name) + '"><option value="">' + esc(x.allv) + '</option>' + list.map(function (v) { return '<option value="' + esc(v) + '"' + (SEL.f[name] === v ? ' selected' : '') + '>' + esc(tv(v)) + '</option>'; }).join('') + '</select></div>';
      });
    }
    return '<details class="um-mf" id="um-mf"' + (MFOPEN || n ? ' open' : '') + '><summary>' + esc(y.mf) + (n ? ' (' + n + ')' : '') + '</summary><div class="um-mfb">' + dims +
      '<div class="um-fld um-chk"><label><input id="ms-all" type="checkbox"' + (SEL.all ? ' checked' : '') + '> ' + esc(x.all) + '</label></div></div></details>' +
      '<div class="um-fs"><div class="um-fld um-grow"><label for="ms-q">' + esc(y.fs) + '</label><input id="ms-q" type="search" class="di-compare-select" value="' + esc(SEL.q) + '" placeholder="' + esc(y.fsPh) + '"></div>' +
      ((n || SEL.q) ? '<button type="button" class="di-btn-outline um-cf" id="um-cf">' + esc(y.cf) + '</button>' : '') + '</div>';
  }
  function chrome(doc) {
    var x = t(), y = u(), h = '';
    if (MODE === 'report') {
      var fams = FAM_ORDER.filter(function (f) { return IDX.reports.some(function (r) { return r.fam === f; }); }), reps = reportsOf(SEL.fam);
      var fo = fams.map(function (f) { return '<option value="' + f + '"' + (f === SEL.fam ? ' selected' : '') + '>' + esc((FAME[f] || '') + ' ' + x.fams[f]) + '</option>'; }).join('');
      var ro = reps.map(function (r) { return '<option value="' + r.id + '"' + (r.id === SEL.id ? ' selected' : '') + '>' + esc(r.title) + '</option>'; }).join('');
      var age = ageDays(doc.lastDate), warn = repStale({ lastDate: doc.lastDate, freq: doc.freq }, false) ? '<p class="um-warn" role="note"><span aria-hidden="true">⚠️</span> ' + esc(fill(y.stale, { d: dateTxt(doc.lastDate), n: age })) + '</p>' : '';
      h += '<div class="um-ctx"><div><h2 class="um-rt">' + esc((FAME[doc.fam] || '') + ' ' + doc.title) + '</h2><p class="um-meta">' + esc(x.fams[doc.fam] || '') + ' · ' + esc(x.updated) + ': ' + esc(dateTxt(doc.lastDate)) + ' · <a href="https://mymarketnews.ams.usda.gov/viewReport/' + doc.id + '" target="_blank" rel="noopener">' + esc(x.open) + ' →</a></p></div><button type="button" class="di-link-btn um-reset">' + esc(y.reset) + '</button></div>' + warn +
        '<details class="um-adv" id="um-adv"' + (ADVOPEN ? ' open' : '') + '><summary>' + esc(y.adv) + '</summary><div class="um-mfb"><div class="um-fld"><label for="ms-f">' + esc(x.family) + '</label><select id="ms-f" class="di-compare-select">' + fo + '</select></div><div class="um-fld um-grow"><label for="ms-r">' + esc(x.report) + '</label><select id="ms-r" class="di-compare-select">' + ro + '</select></div></div></details>';
    } else {
      h += '<div class="um-ctx"><div><h2 class="um-rt">' + esc(SEL.s) + '</h2></div><button type="button" class="di-link-btn um-reset">' + esc(y.reset) + '</button></div><div id="um-warn"></div>';
    }
    return h + filtersBox(doc) + '<p id="um-sum" class="um-sum" role="status" aria-live="polite"></p><div id="um-res"></div>';
  }

  function chartBlock(doc, s) {
    var x = t(), y = u(), c = chart(s), span = s.p.length > 1 ? DIRange.span([[s.p[0][0]], [s.p[s.p.length - 1][0]]]) : 0;
    return '<div class="di-card um-chart"><div class="um-chead"><div><h3 id="um-chh" tabindex="-1">' + esc(descOf(doc, s)) + '</h3><p class="di-movers-hint" style="margin:0 0 6px">' + esc(tu(s.u)) + ' · ' + esc(doc.title) + ' · ' + s.p.length + ' ' + esc(x.pts) + '</p></div><button type="button" class="di-link-btn" id="um-close">' + esc(y.close) + '</button></div>' +
      '<div class="um-fld" style="max-width:220px"><label for="ms-span">' + esc(DIRange.title(lang())) + '</label><select id="ms-span" class="di-compare-select">' + DIRange.options(SEL.span, lang(), span) + '</select></div>' + (c.html || c) + '</div>';
  }

  function view() {
    var res = document.getElementById('um-res'), sumEl = document.getElementById('um-sum'); if (!res) return;
    var x = t(), y = u(), docs = curDocs(), rows = [], hidden = 0;
    docs.forEach(function (doc) {
      var co = cutoff(doc);
      doc.series.forEach(function (s, i) { var last = s.p[s.p.length - 1], old = last[0] < co; if (old) hidden++; if (SEL.all || !old) rows.push({ doc: doc, i: i, s: s, last: last, old: old }); });
    });
    var dimIx = {};
    if (MODE === 'report' && docs[0]) docs[0].dn.forEach(function (n, i) { dimIx[n] = i; });
    Object.keys(SEL.f).forEach(function (n) { if (SEL.f[n] && dimIx[n] !== undefined) rows = rows.filter(function (r) { return r.s.v[dimIx[n]] === SEL.f[n]; }); });
    var qw = nz(SEL.q).split(/\s+/).filter(Boolean);
    if (MODE === 'search' || qw.length) rows.forEach(function (r) {
      var en = nz(r.s.v.join(' ') + ' ' + r.doc.title);
      r.h = { en: en, all: nz(descOf(r.doc, r.s) + ' ' + r.s.v.join(' ') + ' ' + r.s.u + ' ' + r.doc.title) };
    });
    if (MODE === 'search') rows = rows.filter(function (r) { return TESTS.every(function (f) { return f(r.h); }); });
    if (qw.length) rows = rows.filter(function (r) { return qw.every(function (w) { return r.h.all.indexOf(w) >= 0; }); });
    var total = rows.length, shown = rows.slice(0, SEL.lim), lastD = '';
    rows.forEach(function (r) { if (r.last[0] > lastD) lastD = r.last[0]; });
    var nrep = {}; rows.forEach(function (r) { nrep[r.doc.id] = 1; });
    var sum = MODE === 'search' ? fill(y.sumR, { n: total, m: Object.keys(nrep).length }) : fill(y.sum, { n: total });
    if (lastD) sum += ' · ' + fill(y.last, { d: dateTxt(lastD) });
    if (LOADING) sum += ' · ' + fill(y.load, { a: CANDS.length - LOADING, b: CANDS.length });
    sumEl.textContent = sum;
    var h = '';
    if (MODE === 'search' && !LOADING && !CANDS.length) h += '<p class="di-movers-hint um-none">' + esc(fill(y.nores, { q: SEL.s })) + '</p>';
    if (hidden && !SEL.all) h += '<p class="um-note">' + esc(fill(y.hid, { n: hidden })) + ' <button type="button" class="di-link-btn" id="um-showold">' + esc(y.show) + '</button></p>';
    if (SEL.sel) {
      var pr = SEL.sel.split(':'), dd = CACHE[pr[0]];
      if (dd && dd.series[+pr[1]]) h += chartBlock(dd, dd.series[+pr[1]]);
    }
    if (total) {
      var rp = MODE === 'search';
      h += '<div class="um-wrap"><table class="um-tbl" data-no-cards data-no-rows><caption class="visually-hidden">' + esc(y.cap) + '</caption><thead><tr><th scope="col">' + esc(x.desc) + '</th>' + (rp ? '<th scope="col">' + esc(x.report) + '</th>' : '') + '<th scope="col">' + esc(x.unit) + '</th><th scope="col">' + esc(x.date) + '</th><th scope="col" class="um-n">' + esc(x.price) + '</th><th scope="col" class="um-n">' + esc(x.range) + '</th><th scope="col" class="um-n">' + esc(x.chg) + '</th></tr></thead><tbody>';
      shown.forEach(function (r) {
        var pv = val(r.last), prev = r.s.p.length > 1 ? val(r.s.p[r.s.p.length - 2]) : null, ch = pv && prev && prev.v ? (pv.v / prev.v - 1) * 100 : null, k = r.doc.id + ':' + r.i, on = SEL.sel === k;
        var d = descOf(r.doc, r.s), orig = r.s.v.filter(Boolean).join(' · '), cc = ch === null || Math.abs(ch) < 0.05 ? 'flat' : ch > 0 ? 'up' : 'dn';
        h += '<tr class="um-row' + (on ? ' on' : '') + '" data-k="' + k + '"><th scope="row" data-l="' + esc(x.desc) + '"><button type="button" class="um-name" aria-expanded="' + (on ? 'true' : 'false') + '"' + (orig && orig !== d ? ' title="' + esc(orig) + '"' : '') + '>' + esc(d) + '</button>' + (r.old ? ' <span class="um-badge">' + esc(y.old) + '</span>' : '') + '</th>' +
          (rp ? '<td data-l="' + esc(x.report) + '" class="um-rep">' + esc(r.doc.title) + '</td>' : '') +
          '<td data-l="' + esc(x.unit) + '" class="um-un">' + esc(tu(r.s.u)) + '</td><td data-l="' + esc(x.date) + '">' + esc(dateTxt(r.last[0])) + '</td><td data-l="' + esc(x.price) + '" class="um-n um-p">' + (pv ? (pv.mid ? '≈ ' : '') + fmt(pv.v) : '—') + '</td>' +
          '<td data-l="' + esc(x.range) + '" class="um-n um-rg">' + (r.last[2] !== null && r.last[3] !== null && r.last[2] !== r.last[3] ? fmt(r.last[2]) + '–' + fmt(r.last[3]) : '') + '</td>' +
          '<td data-l="' + esc(x.chg) + '" class="um-n um-c ' + cc + '">' + (ch === null ? '' : '<span aria-hidden="true">' + (cc === 'up' ? '▲' : cc === 'dn' ? '▼' : '■') + '</span> ' + (ch > 0 ? '+' : ch < 0 ? '−' : '') + nf(Math.abs(ch), 1) + ' %<span class="visually-hidden"> (' + (cc === 'up' ? y.up : cc === 'dn' ? y.dn : '') + ')</span>') + '</td></tr>';
      });
      h += '</tbody></table></div><p class="di-movers-hint" style="margin-top:6px">' + shown.length + ' ' + esc(x.of) + ' ' + total + ' ' + esc(x.shown) + (total > shown.length ? ' · <button type="button" class="di-link-btn" id="ms-more">' + esc(x.more) + '</button>' : '') + '</p>';
    } else if (MODE === 'report' || (MODE === 'search' && CANDS.length && !LOADING)) h += '<p class="di-movers-hint um-none">' + esc(x.none) + '</p>';
    res.innerHTML = h;
    var ed = document.getElementById('um-warn');
    if (ed) {
      var wh = '';
      if (META.omitted) wh += '<p class="um-note">' + esc(fill(y.skipped, { n: META.omitted })) + ' <button type="button" class="di-link-btn" id="um-incl">' + esc(y.incl) + '</button></p>';
      if (META.total > CANDS.length) wh += '<p class="um-note">' + esc(fill(y.capped, { n: META.total, m: CANDS.length })) + '</p>';
      if (LOADERR) wh += '<p class="um-warn" role="note"><span aria-hidden="true">⚠️</span> ' + esc(fill(y.loadErr, { n: LOADERR })) + '</p>';
      ed.innerHTML = wh;
      var inc = document.getElementById('um-incl'); if (inc) inc.onclick = function () { SEL.all = true; page(); };
    }
    var so = document.getElementById('um-showold'); if (so) so.onclick = function () { SEL.all = true; page(); };
    var spEl = document.getElementById('ms-span'); if (spEl) spEl.onchange = function (e) { SEL.span = parseInt(e.target.value, 10); view(); syncUrl(); };
    var cl = document.getElementById('um-close'); if (cl) cl.onclick = function () { SEL.sel = null; view(); syncUrl(); };
    var mb = document.getElementById('ms-more'); if (mb) mb.onclick = function () { SEL.lim += 120; view(); };
    Array.prototype.forEach.call(res.querySelectorAll('tr[data-k]'), function (tr) {
      tr.onclick = function () {
        var k = tr.getAttribute('data-k'); SEL.sel = SEL.sel === k ? null : k; view(); syncUrl();
        var hh = document.getElementById('um-chh'); if (hh) { try { hh.focus({ preventScroll: true }); } catch (e) { hh.focus(); } hh.scrollIntoView({ block: 'center' }); }
      };
    });
    syncUrl();
  }

  function bind(body) {
    var form = document.getElementById('um-form'), inp = document.getElementById('um-s');
    form.onsubmit = function (e) { e.preventDefault(); go(inp.value); };
    Array.prototype.forEach.call(body.querySelectorAll('.um-prod'), function (b) {
      b.onclick = function () { var p = P.filter(function (q) { return q.k === b.getAttribute('data-p'); })[0], L = L4[lang()] || 0; if (p.sector) { startSector(p.sector); } else go(p.l[L]); };
    });
    Array.prototype.forEach.call(body.querySelectorAll('[data-fam]'), function (b) { b.onclick = function () { startSector(b.getAttribute('data-fam')); }; });
    Array.prototype.forEach.call(body.querySelectorAll('.um-reset'), function (b) { b.onclick = function () { resetAll(); }; });
    var mf = document.getElementById('um-mf'); if (mf) mf.ontoggle = function () { MFOPEN = mf.open; };
    var adv = document.getElementById('um-adv'); if (adv) adv.ontoggle = function () { ADVOPEN = adv.open; };
    var al = document.getElementById('ms-all'); if (al) al.onchange = function () { SEL.all = al.checked; MFOPEN = true; page('ms-all'); };
    var qi = document.getElementById('ms-q'), tm = null; if (qi) qi.oninput = function () { SEL.q = qi.value; SEL.lim = 60; clearTimeout(tm); tm = setTimeout(function () { view(); }, 160); };
    if (qi) qi.onchange = function () { page('ms-q'); };
    var cf = document.getElementById('um-cf'); if (cf) cf.onclick = function () { SEL.f = {}; SEL.all = false; SEL.q = ''; SEL.lim = 60; page('um-s'); };
    Array.prototype.forEach.call(body.querySelectorAll('[data-dim]'), function (el) { el.onchange = function () { SEL.f[el.getAttribute('data-dim')] = el.value; SEL.lim = 60; MFOPEN = true; view(); syncUrl(); var s = el.parentNode.parentNode.parentNode.querySelector('summary'); if (s) s.firstChild.nodeValue = u().mf + (activeFilters() ? ' (' + activeFilters() + ')' : ''); }; });
    var ff = document.getElementById('ms-f'); if (ff) ff.onchange = function () { SEL.fam = ff.value; SEL.id = null; SEL.f = {}; SEL.sel = null; SEL.q = ''; SEL.lim = 60; ADVOPEN = true; page('ms-f'); };
    var rr = document.getElementById('ms-r'); if (rr) rr.onchange = function () { SEL.id = parseInt(rr.value, 10); SEL.f = {}; SEL.sel = null; SEL.q = ''; SEL.lim = 60; ADVOPEN = true; page('ms-r'); };
  }
  function resetAll() { SEL.s = ''; SEL.fam = null; SEL.id = null; SEL.f = {}; SEL.q = ''; SEL.sel = null; SEL.lim = 60; SEL.span = 0; page('um-s'); }
  function startSector(f) { SEL.s = ''; SEL.fam = f; SEL.id = null; SEL.f = {}; SEL.q = ''; SEL.sel = null; SEL.lim = 60; page(); window.scrollTo({ top: 0 }); }
  function go(v) {
    v = String(v || '').trim(); if (!v) { resetAll(); return; }
    SEL.s = v; SEL.fam = null; SEL.id = null; SEL.f = {}; SEL.q = ''; SEL.sel = null; SEL.lim = 60; page('um-s');
  }

  function page(refocus) {
    var x = t(), y = u(); document.title = x.title + ' | Dehesa Index';
    document.getElementById('pg-h1').textContent = x.title; document.getElementById('pg-sub').textContent = x.sub;
    var body = document.getElementById('ms-body'), run = ++RUN;
    if (SEL.id && !IDX.reports.some(function (r) { return r.id === SEL.id; })) SEL.id = null;
    var rs = null;
    if (!SEL.id && SEL.s) { rs = resolve(SEL.s); if (rs.sector) { SEL.fam = rs.sector; SEL.s = ''; rs = null; } }
    if (SEL.id) { MODE = 'report'; SEL.fam = (IDX.reports.filter(function (r) { return r.id === SEL.id; })[0] || {}).fam || SEL.fam; }
    else if (SEL.s) MODE = 'search';
    else if (SEL.fam && reportsOf(SEL.fam).length) { MODE = 'report'; SEL.id = reportsOf(SEL.fam)[0].id; }
    else MODE = 'home';
    var done = function () { if (refocus) { var el = document.getElementById(refocus); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } } } };
    if (MODE === 'home') {
      var fams = FAM_ORDER.filter(function (f) { return IDX.reports.some(function (r) { return r.fam === f; }); });
      var sec = fams.map(function (f) { var n = IDX.reports.filter(function (r) { return r.fam === f; }).length; return '<button type="button" class="um-sec" data-fam="' + f + '"><span class="um-emo" aria-hidden="true">' + (FAME[f] || '') + '</span><span><strong>' + esc(x.fams[f]) + '</strong><br><span class="um-cnt">' + n + ' ' + esc(n === 1 ? y.rn1 : y.rn) + '</span></span></button>'; }).join('');
      body.innerHTML = hero() + '<h2 class="um-h2">' + esc(y.secs) + '</h2><div class="um-secs">' + sec + '</div>' + foot();
      bind(body); syncUrl(); done(); return;
    }
    if (MODE === 'report') {
      body.innerHTML = hero() + '<p class="di-movers-hint" role="status">…</p>';
      bind(body);
      load(SEL.id).then(function (doc) {
        if (run !== RUN) return;
        if (!doc) { body.innerHTML = hero() + '<p class="di-movers-hint">' + esc(x.noData) + '</p>'; bind(body); return; }
        var dimNames = {}; doc.dn.forEach(function (n) { dimNames[n] = 1; }); Object.keys(SEL.f).forEach(function (n) { if (!dimNames[n]) delete SEL.f[n]; });
        META = {}; LOADING = 0; LOADERR = 0;
        body.innerHTML = hero() + chrome(doc) + foot(); bind(body); view(); done();
      });
      return;
    }
    // búsqueda
    CANDS = rs.cands; TESTS = rs.tests; META = { omitted: rs.omitted, total: rs.total }; LOADERR = 0; LOADING = CANDS.length;
    body.innerHTML = hero() + chrome(null) + foot(); bind(body); view(); done();
    var queue = CANDS.map(function (c) { return c.id; }), active = 0, tick = null;
    function pump() {
      while (active < 6 && queue.length) {
        (function (id) {
          active++;
          load(id).then(function (d) { if (run !== RUN) return; if (!d) LOADERR++; }).then(function () {
            if (run !== RUN) return; active--; LOADING--; if (!tick) tick = setTimeout(function () { tick = null; if (run === RUN) view(); }, 140);
            if (!LOADING) { clearTimeout(tick); tick = null; view(); } else pump();
          });
        })(queue.shift());
      }
    }
    if (CANDS.length) pump(); else { LOADING = 0; view(); }
  }
  function foot() {
    var x = t();
    return '<p class="di-info-api-notice" style="margin:18px 0 14px">' + esc(x.caveat) + '</p><p class="di-movers-hint">' + esc(x.src) + ' <a href="metodologia.html#mercados">' + esc(x.methodLink) + '</a>.</p>' + ci('usda_ams_mars');
  }
  var HT = {
    es: { h: 'Mercados USDA', hint: 'Precios de mercado de EE. UU. (USDA AMS)', more: 'Ver todos los mercados', n: 'informes' },
    en: { h: 'USDA markets', hint: 'U.S. market prices (USDA AMS)', more: 'See all markets', n: 'reports' },
    fr: { h: 'Marchés USDA', hint: 'Prix de marché américains (USDA AMS)', more: 'Voir tous les marchés', n: 'rapports' },
    it: { h: 'Mercati USDA', hint: 'Prezzi di mercato USA (USDA AMS)', more: 'Vedi tutti i mercati', n: 'rapporti' }
  };
  function teaser() {
    var el = document.getElementById('home-mercados'); if (!el || !IDX) return;
    var h = HT[lang()] || HT.es, x = t();
    var cnt = function (f) { return IDX.families ? (IDX.families[f] || 0) : IDX.reports.filter(function (r) { return r.fam === f; }).length; };
    var chips = FAM_ORDER.filter(function (f) { return cnt(f) > 0; }).map(function (f) {
      var n = cnt(f);
      return '<a class="di-link-btn" href="mercados.html?fam=' + f + '" style="display:inline-block;margin:0 14px 8px 0">' + esc(x.fams[f]) + ' <span style="color:var(--text-faint)">(' + n + ')</span></a>';
    }).join('');
    el.innerHTML = '<div class="di-movers-head-row"><h2>' + esc(h.h) + '</h2><span class="di-movers-hint">' + esc(h.hint) + '</span></div><div class="di-card" style="padding:18px 20px">' + chips + '</div><p class="di-movers-hint" style="margin-top:10px"><a href="mercados.html">' + esc(h.more) + ' →</a> · ' + (IDX.total || IDX.reports.length) + ' ' + esc(h.n) + '</p>';
  }
  var isPage = !!document.getElementById('ms-body');
  if (!isPage && !document.getElementById('home-mercados')) return;
  if (!isPage) {
    (window.DIHome ? window.DIHome.summary().then(function (s) { return s.markets; }) : fetch('data/ams/index.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; })).then(function (d) {
      if (!d || !((d.reports && d.reports.length) || d.total)) return; IDX = d; teaser();
      var prev = window.DehesaShared.onLangChange;
      window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); teaser(); };
    }).catch(function () {});
    return;
  }
  window.DehesaShared.init('informacion');
  fetch('data/ams/index.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (!d || !d.reports || !d.reports.length) { document.getElementById('pg-h1').textContent = t().title; document.getElementById('ms-body').innerHTML = '<p class="di-movers-hint">' + esc(t().noData) + '</p>'; return; }
    IDX = d;
    var qp = new URLSearchParams(window.location.search), r = parseInt(qp.get('r'), 10), fam = qp.get('fam');
    if (r) { var m = IDX.reports.filter(function (x) { return x.id === r; })[0]; if (m) { SEL.fam = m.fam; SEL.id = m.id; } } else if (fam) SEL.fam = fam;
    if (qp.get('s')) SEL.s = qp.get('s');
    if (qp.get('q')) { if (!r && !fam && !SEL.s) SEL.s = qp.get('q'); else SEL.q = qp.get('q'); }
    if (qp.get('all') === '1') SEL.all = true;
    if (/^\d+:\d+$/.test(qp.get('sel') || '')) SEL.sel = qp.get('sel');
    if (parseInt(qp.get('span'), 10) > 0) SEL.span = parseInt(qp.get('span'), 10);
    qp.forEach(function (v, k) { if (k.indexOf('f_') === 0 && v) SEL.f[k.slice(2)] = v; });
    var go0 = function () { page(); }; (window.DICite ? window.DICite.load() : Promise.resolve()).then(go0, go0);
    var prev = window.DehesaShared.onLangChange;
    window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); page(); };
  }).catch(function () { document.getElementById('ms-body').innerHTML = '<p class="di-movers-hint">' + esc(t().noData) + '</p>'; });
})();
