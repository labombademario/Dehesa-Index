/* Dehesa Index — Pesca y acuicultura (pesca.html) y bloque de pesca de la ficha de país (DIFish.mountCountry).
   Datos: data/views/fish/index.json y data/views/fish/<CC>.json (scripts/build-views.py, desde data/eurostat-fish-stats.json y data/us-noaa-fish-stats.json).
   Cifras tal cual las publican Eurostat y NOAA Fisheries. Únicos cálculos de esta página, rotulados como tales: el reparto de las capturas por zona (%)
   y la proporción de buques de 25 años o más. Los nombres de especies se traducen con el glosario (js/label-tl.js); si falta alguno, se deja en inglés. ES5. */
(function (global) {
  'use strict';
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, IX = { es: 0, en: 1, fr: 2, it: 3 };
  function L(es, en, fr, it) { return [es, en, fr, it]; }
  var N = {
    ES: L('España', 'Spain', 'Espagne', 'Spagna'), FR: L('Francia', 'France', 'France', 'Francia'), DE: L('Alemania', 'Germany', 'Allemagne', 'Germania'), BE: L('Bélgica', 'Belgium', 'Belgique', 'Belgio'),
    AT: L('Austria', 'Austria', 'Autriche', 'Austria'), PT: L('Portugal', 'Portugal', 'Portugal', 'Portogallo'), IT: L('Italia', 'Italy', 'Italie', 'Italia'), DK: L('Dinamarca', 'Denmark', 'Danemark', 'Danimarca'),
    NL: L('Países Bajos', 'Netherlands', 'Pays-Bas', 'Paesi Bassi'), PL: L('Polonia', 'Poland', 'Pologne', 'Polonia'), EL: L('Grecia', 'Greece', 'Grèce', 'Grecia'), IE: L('Irlanda', 'Ireland', 'Irlande', 'Irlanda'),
    FI: L('Finlandia', 'Finland', 'Finlande', 'Finlandia'), BG: L('Bulgaria', 'Bulgaria', 'Bulgarie', 'Bulgaria'), HR: L('Croacia', 'Croatia', 'Croatie', 'Croazia'), LT: L('Lituania', 'Lithuania', 'Lituanie', 'Lituania'),
    SK: L('Eslovaquia', 'Slovakia', 'Slovaquie', 'Slovacchia'), CZ: L('Chequia', 'Czechia', 'Tchéquie', 'Cechia'), EE: L('Estonia', 'Estonia', 'Estonie', 'Estonia'), HU: L('Hungría', 'Hungary', 'Hongrie', 'Ungheria'),
    LV: L('Letonia', 'Latvia', 'Lettonie', 'Lettonia'), RO: L('Rumanía', 'Romania', 'Roumanie', 'Romania'), SE: L('Suecia', 'Sweden', 'Suède', 'Svezia'), SI: L('Eslovenia', 'Slovenia', 'Slovénie', 'Slovenia'),
    US: L('Estados Unidos', 'United States', 'États-Unis', 'Stati Uniti')
  };
  var T = {
    title: L('Pesca y acuicultura', 'Fishing and aquaculture', 'Pêche et aquaculture', 'Pesca e acquacoltura'),
    sub: L('Capturas, desembarques y precio en primera venta, acuicultura y flota pesquera por país: 24 países de la UE (Eurostat) y Estados Unidos (NOAA Fisheries). Cifras oficiales anuales.',
           'Catches, landings and first-sale prices, aquaculture and fishing fleet by country: 24 EU countries (Eurostat) and the United States (NOAA Fisheries). Official annual figures.',
           'Captures, débarquements et prix de première vente, aquaculture et flotte de pêche par pays : 24 pays de l’UE (Eurostat) et les États-Unis (NOAA Fisheries). Chiffres officiels annuels.',
           'Catture, sbarchi e prezzo di prima vendita, acquacoltura e flotta peschereccia per paese: 24 paesi dell’UE (Eurostat) e Stati Uniti (NOAA Fisheries). Dati ufficiali annuali.'),
    country: L('País', 'Country', 'Pays', 'Paese'),
    loading: L('Cargando datos de pesca…', 'Loading fisheries data…', 'Chargement des données de pêche…', 'Caricamento dei dati sulla pesca…'),
    fail: L('No se han podido cargar los datos de pesca. Vuelve a intentarlo más tarde.', 'Fisheries data could not be loaded. Please try again later.', 'Les données de pêche n’ont pas pu être chargées. Réessayez plus tard.', 'Non è stato possibile caricare i dati sulla pesca. Riprova più tardi.'),
    k: {
      catches: L('Capturas', 'Catches', 'Captures', 'Catture'), landValue: L('Valor de los desembarques', 'Value of landings', 'Valeur des débarquements', 'Valore degli sbarchi'),
      landQty: L('Pescado desembarcado', 'Fish landed', 'Poisson débarqué', 'Pesce sbarcato'), landPrice: L('Precio medio en primera venta', 'Average first-sale price', 'Prix moyen de première vente', 'Prezzo medio di prima vendita'),
      aqQty: L('Acuicultura', 'Aquaculture', 'Aquaculture', 'Acquacoltura'), aqValue: L('Valor de la acuicultura', 'Value of aquaculture', 'Valeur de l’aquaculture', 'Valore dell’acquacoltura'),
      fleet: L('Flota pesquera', 'Fishing fleet', 'Flotte de pêche', 'Flotta peschereccia'), fleetOld: L('Buques de 25 años o más', 'Vessels 25 years or older', 'Navires de 25 ans ou plus', 'Pescherecci di 25 anni o più'),
      usValue: L('Valor de los desembarques comerciales', 'Value of commercial landings', 'Valeur des débarquements commerciaux', 'Valore degli sbarchi commerciali'), usLb: L('Pescado desembarcado', 'Fish landed', 'Poisson débarqué', 'Pesce sbarcato')
    },
    u: { t: L('t peso vivo', 't live weight', 't poids vif', 't peso vivo'), tp: L('t peso producto', 't product weight', 't poids produit', 't peso prodotto'), eurt: L('€/t', '€/t', '€/t', '€/t'), ves: L('buques', 'vessels', 'navires', 'pescherecci'),
         mlb: L('millones de libras', 'million pounds', 'millions de livres', 'milioni di libbre'), meur: L('M€', '€m', 'M€', 'M€'), musd: L('M$', '$m', 'M$', 'M$'), pctFleet: L('% de la flota (cálculo de Dehesa Index)', '% of the fleet (Dehesa Index calculation)', '% de la flotte (calcul de Dehesa Index)', '% della flotta (calcolo di Dehesa Index)') },
    vs: L('frente a', 'vs', 'contre', 'rispetto a'),
    ch1: L('Capturas y acuicultura (toneladas de peso vivo)', 'Catches and aquaculture (tonnes live weight)', 'Captures et aquaculture (tonnes de poids vif)', 'Catture e acquacoltura (tonnellate di peso vivo)'),
    ch1c: L('Capturas (toneladas de peso vivo)', 'Catches (tonnes live weight)', 'Captures (tonnes de poids vif)', 'Catture (tonnellate di peso vivo)'),
    ch1a: L('Acuicultura (toneladas de peso vivo)', 'Aquaculture (tonnes live weight)', 'Aquaculture (tonnes de poids vif)', 'Acquacoltura (tonnellate di peso vivo)'),
    ch2: L('Precio medio en primera venta del pescado desembarcado (€/t)', 'Average first-sale price of fish landed (€/t)', 'Prix moyen de première vente du poisson débarqué (€/t)', 'Prezzo medio di prima vendita del pesce sbarcato (€/t)'),
    ch1us: L('Valor de los desembarques comerciales (millones de USD corrientes)', 'Value of commercial landings (USD million, current)', 'Valeur des débarquements commerciaux (millions d’USD courants)', 'Valore degli sbarchi commerciali (milioni di USD correnti)'),
    ch2us: L('Pescado desembarcado (millones de libras de peso vivo)', 'Fish landed (million pounds live weight)', 'Poisson débarqué (millions de livres de poids vif)', 'Pesce sbarcato (milioni di libbre di peso vivo)'),
    lc: L('Capturas', 'Catches', 'Captures', 'Catture'), la: L('Acuicultura', 'Aquaculture', 'Aquaculture', 'Acquacoltura'), lp: L('Precio medio', 'Average price', 'Prix moyen', 'Prezzo medio'), lv: L('Valor', 'Value', 'Valeur', 'Valore'), lq: L('Cantidad', 'Quantity', 'Quantité', 'Quantità'),
    hover: L('Pasa el cursor por la gráfica.', 'Hover over the chart.', 'Survolez le graphique.', 'Passa il cursore sul grafico.'),
    spT: L('Especies con más valor desembarcado', 'Species with the highest landed value', 'Espèces à plus forte valeur débarquée', 'Specie con il maggior valore sbarcato'),
    spS: L('Valor, cantidad y precio en primera venta del último año publicado. Las especies las elige Dehesa Index por la última cifra publicada.', 'Value, quantity and first-sale price in the latest published year. Dehesa Index picks the species from the latest published figure.', 'Valeur, quantité et prix de première vente de la dernière année publiée. Dehesa Index choisit les espèces d’après le dernier chiffre publié.', 'Valore, quantità e prezzo di prima vendita dell’ultimo anno pubblicato. Dehesa Index sceglie le specie in base all’ultimo dato pubblicato.'),
    spUS: L('Especies con más valor desembarcado (todos los estados)', 'Species with the highest landed value (all states)', 'Espèces à plus forte valeur débarquée (tous les États)', 'Specie con il maggior valore sbarcato (tutti gli stati)'),
    stUS: L('Estados con más valor desembarcado', 'States with the highest landed value', 'États à plus forte valeur débarquée', 'Stati con il maggior valore sbarcato'),
    hSp: L('Especie', 'Species', 'Espèce', 'Specie'), hSt: L('Estado', 'State', 'État', 'Stato'), hVal: L('Valor', 'Value', 'Valeur', 'Valore'), hQty: L('Cantidad', 'Quantity', 'Quantité', 'Quantità'),
    hPrice: L('Precio (€/t)', 'Price (€/t)', 'Prix (€/t)', 'Prezzo (€/t)'), hChg: L('Precio vs año anterior', 'Price vs previous year', 'Prix vs année précédente', 'Prezzo vs anno precedente'), hYear: L('Año', 'Year', 'Année', 'Anno'), latest: L('Último disponible', 'Latest available', 'Dernière disponible', 'Ultimo disponibile'),
    yrNote: L('Año elegido: las cifras son las de ese año; donde un dato no existe ese año aparece «—». Las especies listadas son las principales del último año, ordenadas aquí por el valor del año elegido. Las gráficas muestran siempre toda la serie.', 'Chosen year: figures are those of that year; “—” where no data exists for it. The species listed are the latest year’s main ones, ranked here by the chosen year’s value. Charts always show the full series.', 'Année choisie : chiffres de cette année ; « — » si la donnée n’existe pas. Les espèces listées sont les principales de la dernière année, classées ici selon la valeur de l’année choisie. Les graphiques montrent toujours toute la série.', 'Anno scelto: cifre di quell’anno; «—» dove il dato non esiste. Le specie elencate sono le principali dell’ultimo anno, ordinate qui per il valore dell’anno scelto. I grafici mostrano sempre tutta la serie.'),
    zT: L('Capturas por zona de pesca', 'Catches by fishing area', 'Captures par zone de pêche', 'Catture per zona di pesca'),
    zS: L('Toneladas de peso vivo del último año. El porcentaje sobre el total es un cálculo de Dehesa Index.', 'Tonnes live weight in the latest year. The share of the total is a Dehesa Index calculation.', 'Tonnes de poids vif de la dernière année. La part du total est un calcul de Dehesa Index.', 'Tonnellate di peso vivo dell’ultimo anno. La quota sul totale è un calcolo di Dehesa Index.'),
    hZone: L('Zona (FAO)', 'Area (FAO)', 'Zone (FAO)', 'Zona (FAO)'), hShare: L('% del total', '% of total', '% du total', '% del totale'),
    aT: L('Acuicultura: especies principales', 'Aquaculture: main species', 'Aquaculture : espèces principales', 'Acquacoltura: specie principali'),
    cT: L('Capturas: especies principales', 'Catches: main species', 'Captures : espèces principales', 'Catture: specie principali'),
    fT: L('Edad de la flota pesquera', 'Age of the fishing fleet', 'Âge de la flotte de pêche', 'Età della flotta peschereccia'),
    fS: L('Número de buques por antigüedad en el último año publicado.', 'Number of vessels by age in the latest published year.', 'Nombre de navires par âge, dernière année publiée.', 'Numero di pescherecci per età nell’ultimo anno pubblicato.'),
    eT: L('Comparativa de países', 'Country comparison', 'Comparaison des pays', 'Confronto tra paesi'),
    eS: L('Último año publicado de cada cifra (puede no ser el mismo en todos los países). Pulsa un país para verlo arriba.', 'Latest published year of each figure (it may differ between countries). Select a country to see it above.', 'Dernière année publiée de chaque chiffre (elle peut différer selon le pays). Sélectionnez un pays pour l’afficher ci-dessus.', 'Ultimo anno pubblicato di ogni dato (può variare tra paesi). Seleziona un paese per vederlo sopra.'),
    land: L('Sin costa: Eurostat solo publica acuicultura.', 'Landlocked: Eurostat only publishes aquaculture.', 'Sans littoral : Eurostat ne publie que l’aquaculture.', 'Senza sbocco sul mare: Eurostat pubblica solo l’acquacoltura.'),
    notes: [L('Capturas: pescado capturado por la flota del país en cualquier zona, en toneladas de peso vivo. Desembarques: lo que se vende en los puertos del país, en peso del producto, con su valor y su precio medio en primera venta (valor / cantidad, publicado por Eurostat).',
              'Catches: fish caught by the country’s fleet in any area, in tonnes live weight. Landings: what is sold in the country’s ports, in product weight, with its value and average first-sale price (value / quantity, published by Eurostat).',
              'Captures : poisson pêché par la flotte du pays dans toutes les zones, en tonnes de poids vif. Débarquements : ce qui est vendu dans les ports du pays, en poids de produit, avec sa valeur et son prix moyen de première vente (valeur / quantité, publié par Eurostat).',
              'Catture: pesce catturato dalla flotta del paese in qualsiasi zona, in tonnellate di peso vivo. Sbarchi: ciò che si vende nei porti del paese, in peso del prodotto, con il valore e il prezzo medio di prima vendita (valore / quantità, pubblicato da Eurostat).'),
            L('Estados Unidos: total de los registros comerciales que publica NOAA Fisheries, sumados por Dehesa Index e incluida la parte que NOAA no desglosa por confidencialidad. Libras de peso vivo y dólares corrientes. NOAA revisa los últimos años.',
              'United States: total of the commercial records published by NOAA Fisheries, summed by Dehesa Index and including the part NOAA withholds for confidentiality. Pounds live weight and current dollars. NOAA revises recent years.',
              'États-Unis : total des enregistrements commerciaux publiés par NOAA Fisheries, additionnés par Dehesa Index, y compris la part que NOAA ne détaille pas par confidentialité. Livres de poids vif et dollars courants. NOAA révise les dernières années.',
              'Stati Uniti: totale dei registri commerciali pubblicati da NOAA Fisheries, sommati da Dehesa Index e compresa la parte che NOAA non dettaglia per riservatezza. Libbre di peso vivo e dollari correnti. NOAA rivede gli ultimi anni.')],
    src: L('Fuentes:', 'Sources:', 'Sources :', 'Fonti:'),
    srcEu: L('Eurostat, estadísticas de pesca (fish_ca_main, fish_ld_main, fish_aq2a, fish_fleet_alt); reutilización según la Decisión 2011/833/UE', 'Eurostat, fisheries statistics (fish_ca_main, fish_ld_main, fish_aq2a, fish_fleet_alt); reuse under Decision 2011/833/EU', 'Eurostat, statistiques de la pêche (fish_ca_main, fish_ld_main, fish_aq2a, fish_fleet_alt) ; réutilisation selon la décision 2011/833/UE', 'Eurostat, statistiche della pesca (fish_ca_main, fish_ld_main, fish_aq2a, fish_fleet_alt); riutilizzo secondo la decisione 2011/833/UE'),
    srcUs: L('NOAA Fisheries, Fisheries One Stop Shop (FOSS), dominio público', 'NOAA Fisheries, Fisheries One Stop Shop (FOSS), public domain', 'NOAA Fisheries, Fisheries One Stop Shop (FOSS), domaine public', 'NOAA Fisheries, Fisheries One Stop Shop (FOSS), pubblico dominio'),
    cardH: L('Pesca y acuicultura', 'Fishing and aquaculture', 'Pêche et aquaculture', 'Pesca e acquacoltura'),
    more: L('Ver todos los datos de pesca de este país', 'See all fisheries data for this country', 'Voir toutes les données de pêche de ce pays', 'Vedi tutti i dati sulla pesca di questo paese'),
    age: { y_lt5: L('menos de 5 años', 'under 5 years', 'moins de 5 ans', 'meno di 5 anni'), 'y5-9': L('5 a 9 años', '5 to 9 years', '5 à 9 ans', '5-9 anni'), 'y10-14': L('10 a 14 años', '10 to 14 years', '10 à 14 ans', '10-14 anni'),
           'y15-19': L('15 a 19 años', '15 to 19 years', '15 à 19 ans', '15-19 anni'), 'y20-24': L('20 a 24 años', '20 to 24 years', '20 à 24 ans', '20-24 anni'), y_ge25: L('25 años o más', '25 years or more', '25 ans ou plus', '25 anni o più') }
  };
  var S = global.DehesaShared || {};
  function lg() { var l = S.getLang ? S.getLang() : 'es'; return IX[l] != null ? l : 'es'; }
  function tx(a) { return a[IX[lg()]]; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { return v == null || isNaN(v) ? '—' : (+v).toLocaleString(LOC[lg()], { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function sp(path) { return S.sitePath ? S.sitePath(path) : path; }
  function last(a) { if (!a) return null; for (var i = a.length - 1; i >= 0; i--) if (a[i] && a[i][1] != null) return a[i]; return null; }
  /* Filtro por año: YEAR=null => último dato disponible de cada serie; YEAR=2012 => solo el dato de ese año (si no existe, '—'). */
  var YEAR = null;
  function pick(a) { if (YEAR == null) return last(a); if (!a) return null; for (var i = a.length - 1; i >= 0; i--) if (a[i] && +a[i][0] === YEAR && a[i][1] != null) return a[i]; return null; }
  function yearsOf(d) {
    var m = {}, add = function (a) { (a || []).forEach(function (r) { if (r && r[1] != null) m[r[0]] = 1; }); };
    Object.keys(d.series || {}).forEach(function (k) { add(d.series[k]); });
    ['landings', 'catches', 'aquaculture', 'areas', 'states'].forEach(function (g) { (d[g] || []).forEach(function (o) { add(o.qty); add(o.value); }); });
    return Object.keys(m).map(Number).sort(function (a, b) { return b - a; });
  }
  function yearSel(d, id) {
    var ys = yearsOf(d); if (ys.length < 2) return '';
    if (YEAR != null && ys.indexOf(YEAR) < 0) YEAR = null;
    return '<span class="fsh-yr"><label for="' + id + '">' + esc(tx(T.hYear)) + '</label> <select id="' + id + '" class="di-compare-select"><option value="">' + esc(tx(T.latest)) + '</option>' +
      ys.map(function (y) { return '<option value="' + y + '"' + (y === YEAR ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select></span>';
  }
  function prevOf(a, p) { if (!a || !p) return null; for (var i = a.length - 1; i >= 0; i--) if (+a[i][0] === +p[0] - 1) return a[i]; return null; }
  function pct(a, b) { return a != null && b ? (a / b - 1) * 100 : null; }
  function chg(v) { if (v == null) return '<span class="fsh-m">—</span>'; var s = (v > 0 ? '+' : '') + nf(v, 1) + ' %'; return '<span class="fsh-chg ' + (v > 0 ? 'up' : v < 0 ? 'dn' : '') + '">' + esc(s) + '</span>'; }
  function spName(n) { var tl = global.DILabelTl; if (!tl) return n; var r = tl.tl(n, lg()); return r || n; }
  function money(v, cur) { if (v == null) return '—'; var m = v / 1e6; return nf(m, m < 100 ? 1 : 0) + ' ' + tx(cur === 'USD' ? T.u.musd : T.u.meur); }
  /* ---- gráfica de líneas (mismo patrón que js/farm-headlines.js) ---- */
  function niceStep(max) { var raw = max / 4, p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  var CL = ['t', 'b'];
  function chart(list, title, cls) {
    var W = 560, H = 220, Lm = 64, Rr = 8, Tp = 10, B = 24, y0 = 1e9, y1 = 0, hi = 0, k, j;
    list.forEach(function (o) { o.pts.forEach(function (r) { y0 = Math.min(y0, +r[0]); y1 = Math.max(y1, +r[0]); hi = Math.max(hi, r[1]); }); });
    if (y1 <= y0 || hi <= 0) return { html: '' };
    var st = niceStep(hi); hi = Math.ceil(hi / st) * st;
    var X = function (y) { return Lm + (y - y0) / (y1 - y0) * (W - Lm - Rr); }, Y = function (v) { return Tp + (hi - v) / hi * (H - Tp - B); }, g = '';
    for (k = 0; k <= hi + 1e-9; k += st) g += '<line class="wp-grid" x1="' + Lm + '" x2="' + (W - Rr) + '" y1="' + Y(k).toFixed(1) + '" y2="' + Y(k).toFixed(1) + '"/><text class="wp-tick" x="' + (Lm - 5) + '" y="' + (Y(k) + 3.5).toFixed(1) + '" text-anchor="end">' + nf(k, 0) + '</text>';
    var step = (y1 - y0) > 30 ? 10 : (y1 - y0) > 12 ? 5 : 2;
    for (j = Math.ceil(y0 / step) * step; j <= y1; j += step) g += '<text class="wp-tick" x="' + X(j).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="' + (X(j) > W - 20 ? 'end' : 'middle') + '">' + j + '</text>';
    var paths = list.map(function (o, n) { return '<path class="wp-line wp-line-' + CL[n] + '" d="' + o.pts.map(function (r, m) { return (m ? 'L' : 'M') + X(+r[0]).toFixed(1) + ' ' + Y(r[1]).toFixed(1); }).join('') + '"/>'; }).join('');
    var leg = list.length > 1 ? '<div class="wp-legend">' + list.map(function (o, n) { return '<span><i class="wp-sw wp-sw-' + CL[n] + '"></i>' + esc(o.name) + '</span>'; }).join('') + '</div>' : '';
    return { list: list, X: X, W: W, Lm: Lm, cls: cls, y0: y0, y1: y1,
      html: '<div class="di-info-card-title gb-sub">' + esc(title) + '</div><div class="wp-chart ' + cls + '"><div class="wp-readout" aria-live="polite">' + esc(tx(T.hover)) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(title) + '">' + g + paths + '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg>' + leg + '</div>' };
  }
  function bindChart(root, c) {
    if (!c.list) return; var box = root.querySelector('.' + c.cls); if (!box) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross');
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, y = Math.round(c.y0 + (vx - c.Lm) / (c.W - c.Lm - 8) * (c.y1 - c.y0));
      y = Math.max(c.y0, Math.min(c.y1, y)); var px = c.X(y); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + y + '</b>' + c.list.map(function (o) { var q = o.pts.filter(function (p) { return +p[0] === y; })[0]; return q ? ' · ' + esc(o.name) + ' <b>' + nf(q[1], o.d || 0) + '</b>' : ''; }).join('');
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = tx(T.hover); });
  }
  function scale(pts, f) { return (pts || []).filter(function (p) { return p[1] != null; }).map(function (p) { return [p[0], p[1] / f]; }); }
  /* ---- carga ---- */
  var CACHE = {};
  function getJSON(name) { CACHE[name] = CACHE[name] || fetch(sp('data/views/fish/' + name + '.json'), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); return CACHE[name]; }
  function glossary() { var tl = global.DILabelTl; return tl && tl.load ? tl.load(lg()).catch(function () { return false; }) : Promise.resolve(false); }
  /* ---- cifras clave ---- */
  function kpi(label, val, unit, per, ch) {
    return '<div class="fsh-kpi"><div class="fsh-kl">' + esc(label) + '</div><div class="fsh-kv">' + val + (unit ? ' <span class="fsh-ku">' + esc(unit) + '</span>' : '') + '</div><div class="fsh-kp">' + esc(per || '') + (ch != null ? ' · ' + chg(ch) : '') + '</div></div>';
  }
  function kpis(d) {
    var s = d.series, h = '', a, b;
    if (d.cc === 'US') {
      a = pick(s['ld-total-usd']); b = prevOf(s['ld-total-usd'], a); if (a) h += kpi(tx(T.k.usValue), money(a[1], 'USD'), '', a[0], pct(a[1], b && b[1]));
      a = pick(s['ld-total-lb']); b = prevOf(s['ld-total-lb'], a); if (a) h += kpi(tx(T.k.usLb), nf(a[1] / 1e6, 0), tx(T.u.mlb), a[0], pct(a[1], b && b[1]));
      return h;
    }
    var row = function (key, lab, fmt, unit) { var x = pick(s[key]), y = prevOf(s[key], x); if (x) h += kpi(lab, fmt(x[1]), unit, x[0], pct(x[1], y && y[1])); };
    row('ca-total', tx(T.k.catches), function (v) { return nf(v, 0); }, tx(T.u.t));
    row('ld-total-eur', tx(T.k.landValue), function (v) { return money(v, 'EUR'); }, '');
    row('ld-total-tpw', tx(T.k.landQty), function (v) { return nf(v, 0); }, tx(T.u.tp));
    row('ld-total-eur_t', tx(T.k.landPrice), function (v) { return nf(v, 0); }, tx(T.u.eurt));
    row('aq-total-tlw', tx(T.k.aqQty), function (v) { return nf(v, 0); }, tx(T.u.t));
    row('aq-total-eur', tx(T.k.aqValue), function (v) { return money(v, 'EUR'); }, '');
    row('fleet-nr', tx(T.k.fleet), function (v) { return nf(v, 0); }, tx(T.u.ves));
    var nr = pick(s['fleet-nr']), o = pick(s['fleet-age-y_ge25']);
    if (nr && o && nr[0] === o[0] && nr[1]) h += kpi(tx(T.k.fleetOld), nf(o[1] / nr[1] * 100, 0) + ' %', '', nr[0] + ' · ' + tx(T.u.pctFleet), null);
    return h;
  }
  function table(head, rows) { return '<div class="di-table-wrap"><table class="di-table fsh-tbl"><thead><tr>' + head.map(function (x, i) { return '<th' + (i ? ' class="num"' : '') + '>' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(cc) { cc = String(cc || '').toUpperCase(); var iso = { EL: 'GR', UK: 'GB' }[cc] || cc; return /^[A-Z]{2}$/.test(iso) ? '<span aria-hidden="true">' + String.fromCodePoint(127397 + iso.charCodeAt(0), 127397 + iso.charCodeAt(1)) + '</span> ' : ''; }
  function td(v, num) { return '<td' + (num ? ' class="num"' : '') + '>' + v + '</td>'; }
  function speciesBlock(d) {
    if (!d.landings || !d.landings.length) return '';
    var us = d.cc === 'US';
    var lst = d.landings.slice(); if (YEAR != null) lst.sort(function (a, b) { var x = pick(a.value), y = pick(b.value); return (y ? y[1] : -1) - (x ? x[1] : -1); });
    var rows = lst.map(function (o) {
      var v = pick(o.value), q = pick(o.qty);
      if (us) return '<tr>' + td(esc(spName(o.name))) + td(money(v && v[1], 'USD'), 1) + td(q ? nf(q[1] / 1e6, 1) + ' ' + esc(tx(T.u.mlb)) : '—', 1) + td(esc(v ? v[0] : ''), 1) + '</tr>';
      var p = pick(o.price), pp = prevOf(o.price, p);
      return '<tr>' + td(esc(spName(o.name))) + td(money(v && v[1], 'EUR'), 1) + td(q ? nf(q[1], 0) + ' t' : '—', 1) + td(p ? nf(p[1], 0) : '—', 1) + td(chg(p && pp ? pct(p[1], pp[1]) : null), 1) + td(esc(v ? v[0] : ''), 1) + '</tr>';
    });
    var head = us ? [tx(T.hSp), tx(T.hVal), tx(T.hQty), tx(T.hYear)] : [tx(T.hSp), tx(T.hVal), tx(T.hQty), tx(T.hPrice), tx(T.hChg), tx(T.hYear)];
    return '<section class="di-card fsh-sec"><h2 class="fsh-h2">' + esc(tx(us ? T.spUS : T.spT)) + '</h2><p class="di-movers-hint">' + esc(tx(T.spS)) + '</p>' + table(head, rows) + '</section>';
  }
  function statesBlock(d) {
    if (!d.states || !d.states.length) return '';
    var rows = d.states.map(function (o) { var v = pick(o.value), q = pick(o.qty); return '<tr>' + td(esc(o.name)) + td(money(v && v[1], 'USD'), 1) + td(q ? nf(q[1] / 1e6, 1) + ' ' + esc(tx(T.u.mlb)) : '—', 1) + td(esc(v ? v[0] : ''), 1) + '</tr>'; });
    return '<section class="di-card fsh-sec"><h2 class="fsh-h2">' + esc(tx(T.stUS)) + '</h2>' + table([tx(T.hSt), tx(T.hVal), tx(T.hQty), tx(T.hYear)], rows) + '</section>';
  }
  /* Mapa de zonas FAO (vendor/fao-areas.js: FAO 2024, CC BY 4.0): se colorean las zonas donde el pais capturo, por su peso en el total */
  var FAOC = { 'Northeast Atlantic': '27', 'Northwest Atlantic': '21', 'Eastern Central Atlantic': '34', 'Mediterranean and Black Sea': '37', 'Western Indian Ocean': '51', 'Southwest Atlantic': '41', 'Southeast Atlantic': '47' };
  var FM = { es: ['Más oscuro = mayor parte de las capturas del país. En gris claro, zonas sin capturas registradas.', 'Zonas principales de pesca: FAO (2024), CC BY 4.0.', 't'], en: ['Darker = larger share of the country’s catches. Light grey: areas with no recorded catches.', 'Major fishing areas: FAO (2024), CC BY 4.0.', 't'], fr: ['Plus foncé = plus grande part des captures du pays. Gris clair : zones sans captures enregistrées.', 'Zones de pêche principales : FAO (2024), CC BY 4.0.', 't'], it: ['Più scuro = quota maggiore delle catture del paese. Grigio chiaro: zone senza catture registrate.', 'Zone di pesca principali: FAO (2024), CC BY 4.0.', 't'] };
  function mountFaoMaps(root) {
    var boxes = root.querySelectorAll('.fsh-fmap'); if (!boxes.length) return;
    var draw = function () {
      var M = global.DEHESA_FAO_AREAS; if (!M) return; var tt = FM[lg()] || FM.es;
      [].forEach.call(boxes, function (b) {
        var z = {}; try { z = JSON.parse(b.getAttribute('data-z')); } catch (e) {}
        var mx = Math.max.apply(null, Object.keys(z).map(function (k) { return z[k][2]; }).concat([1]));
        b.innerHTML = '<svg viewBox="' + M.viewBox + '" role="img" aria-label="' + esc(tx(T.zT)) + '" style="width:100%;height:auto;display:block">' + M.areas.map(function (a) {
          var v = z[a.id], op = v ? (0.25 + 0.75 * (v[2] / mx)).toFixed(2) : 0;
          return '<path d="' + a.d + '" fill="' + (v ? 'var(--accent,#2f5d3a)' : 'var(--border,#e3dfd0)') + '"' + (v ? ' fill-opacity="' + op + '"' : ' fill-opacity=".55"') + ' stroke="var(--surface,#fff)" stroke-width="1"><title>' + esc(v ? v[0] + ' (FAO ' + a.id + ') · ' + nf(v[1], 0) + ' t · ' + nf(v[2], 1) + ' %' : 'FAO ' + a.id) + '</title></path>';
        }).join('') + '</svg><p class="di-movers-hint" style="margin:4px 0 10px">' + esc(tt[0]) + ' ' + esc(tt[1]) + '</p>';
      });
    };
    if (global.DEHESA_FAO_AREAS) draw(); else { var sc = document.createElement('script'); sc.src = sp('vendor/fao-areas.js'); sc.onload = draw; document.head.appendChild(sc); }
  }
  function zonesBlock(d) {
    var tot = pick(d.series['ca-total']); if (!d.areas || !d.areas.length || !tot) return '';
    var zmap = {};
    var rows = d.areas.map(function (o) { var q = pick(o.qty); if (!q || q[0] !== tot[0]) return ''; var sh = q[1] / tot[1] * 100; if (FAOC[o.name]) zmap[FAOC[o.name]] = [spName(o.name), q[1], sh];
      return '<tr>' + td(esc(spName(o.name))) + td(nf(q[1], 0) + ' t', 1) + td('<span class="fsh-bar"><i style="width:' + Math.max(1, Math.min(100, sh)).toFixed(1) + '%"></i></span> ' + nf(sh, 1) + ' %', 1) + '</tr>'; }).filter(Boolean);
    if (!rows.length) return '';
    return '<section class="di-card fsh-sec"><h2 class="fsh-h2">' + esc(tx(T.zT)) + ' · ' + esc(tot[0]) + '</h2><p class="di-movers-hint">' + esc(tx(T.zS)) + '</p>' + (Object.keys(zmap).length ? '<div class="fsh-fmap" data-z="' + esc(JSON.stringify(zmap)) + '"></div>' : '') + table([tx(T.hZone), tx(T.hQty), tx(T.hShare)], rows) + '</section>';
  }
  function listBlock(title, list, withPrice) {
    if (!list || !list.length) return '';
    var rows = list.map(function (o) { var q = pick(o.qty), p = withPrice ? pick(o.price) : null; return '<tr>' + td(esc(spName(o.name))) + td(q ? nf(q[1], 0) + ' t' : '—', 1) + (withPrice ? td(p ? nf(p[1], 0) : '—', 1) : '') + td(esc(q ? q[0] : ''), 1) + '</tr>'; });
    return '<section class="di-card fsh-sec"><h2 class="fsh-h2">' + esc(title) + '</h2>' + table(withPrice ? [tx(T.hSp), tx(T.hQty), tx(T.hPrice), tx(T.hYear)] : [tx(T.hSp), tx(T.hQty), tx(T.hYear)], rows) + '</section>';
  }
  function fleetBlock(d) {
    var keys = ['y_lt5', 'y5-9', 'y10-14', 'y15-19', 'y20-24', 'y_ge25'], s = d.series, nr = pick(s['fleet-nr']); if (!nr || !d.fleetAge) return '';
    var vals = keys.map(function (k) { var x = pick(d.fleetAge[k]); return x && x[0] === nr[0] ? x[1] : null; }); if (vals.every(function (v) { return v == null; })) return '';
    var mx = Math.max.apply(null, vals.map(function (v) { return v || 0; })) || 1;
    return '<section class="di-card fsh-sec"><h2 class="fsh-h2">' + esc(tx(T.fT)) + ' · ' + esc(nr[0]) + '</h2><p class="di-movers-hint">' + esc(tx(T.fS)) + '</p><div class="fsh-age">' + keys.map(function (k, i) {
      return '<div class="fsh-age-r"><span>' + esc(tx(T.age[k])) + '</span><span class="fsh-bar wide"><i style="width:' + ((vals[i] || 0) / mx * 100).toFixed(1) + '%"></i></span><b>' + nf(vals[i], 0) + '</b></div>'; }).join('') + '</div></section>';
  }
  function compareBlock(idx, cur) {
    var rows = idx.countries.filter(function (r) { return r.cc !== 'US'; }).sort(function (a, b) { return ((b.landValue || [0, 0])[1] - (a.landValue || [0, 0])[1]) || ((b.aqQty || [0, 0])[1] - (a.aqQty || [0, 0])[1]); });
    var v = function (p, f) { return p ? f(p[1]) + ' <span class="fsh-m">' + esc(p[0]) + '</span>' : '—'; };
    var tr = rows.map(function (r) {
      return '<tr class="fsh-row' + (r.cc === cur ? ' on' : '') + '" data-cc="' + esc(r.cc) + '" tabindex="0">' + td(flag(r.cc) + '<a href="' + esc(sp('pesca.html') + '?c=' + r.cc) + '">' + esc(tx(N[r.cc] || [r.cc, r.cc, r.cc, r.cc])) + '</a>') +
        td(v(r.catches, function (x) { return nf(x, 0); }), 1) + td(v(r.landValue, function (x) { return money(x, 'EUR'); }), 1) + td(v(r.landPrice, function (x) { return nf(x, 0); }), 1) +
        td(v(r.aqQty, function (x) { return nf(x, 0); }), 1) + td(v(r.fleet, function (x) { return nf(x, 0); }), 1) + td(r.fleetOld ? nf(r.fleetOld[1], 0) + ' %' : '—', 1) + '</tr>';
    });
    return '<section class="di-card fsh-sec"><h2 class="fsh-h2">' + esc(tx(T.eT)) + '</h2><p class="di-movers-hint">' + esc(tx(T.eS)) + '</p>' +
      table([tx(T.country), tx(T.k.catches) + ' (t)', tx(T.k.landValue), tx(T.k.landPrice) + ' (€/t)', tx(T.k.aqQty) + ' (t)', tx(T.k.fleet), tx(T.k.fleetOld)], tr) + '</section>';
  }
  function sources(d) {
    var eu = d.cc !== 'US';
    return '<p class="di-field-hint" style="margin:12px 0 0">' + esc(tx(T.src)) + ' ' + (eu ? '<a href="https://ec.europa.eu/eurostat/web/fisheries/database" target="_blank" rel="noopener noreferrer">' + esc(tx(T.srcEu)) + '</a>' :
      '<a href="https://www.fisheries.noaa.gov/foss" target="_blank" rel="noopener noreferrer">' + esc(tx(T.srcUs)) + '</a>') + '</p>';
  }
  function charts(d) {
    var s = d.series, out = [];
    if (d.cc === 'US') {
      out.push(chart([{ name: tx(T.lv), pts: scale(s['ld-total-usd'], 1e6), d: 0 }].filter(function (o) { return o.pts.length > 2; }), tx(T.ch1us), 'fsh-c1'));
      out.push(chart([{ name: tx(T.lq), pts: scale(s['ld-total-lb'], 1e6), d: 0 }].filter(function (o) { return o.pts.length > 2; }), tx(T.ch2us), 'fsh-c2'));
    } else {
      var a = [{ name: tx(T.lc), pts: scale(s['ca-total'], 1), d: 0 }, { name: tx(T.la), pts: scale(s['aq-total-tlw'], 1), d: 0 }].filter(function (o) { return o.pts.length > 2; });
      if (a.length) out.push(chart(a, a.length > 1 ? tx(T.ch1) : tx(a[0].name === tx(T.lc) ? T.ch1c : T.ch1a), 'fsh-c1'));
      var b = [{ name: tx(T.lp), pts: scale(s['ld-total-eur_t'], 1), d: 0 }].filter(function (o) { return o.pts.length > 2; });
      if (b.length) out.push(chart(b, tx(T.ch2), 'fsh-c2'));
    }
    return out.filter(function (c) { return c.html; });
  }
  /* ---- página ---- */
  var CUR = null;
  function pageRender() {
    var root = document.getElementById('fsh-body'); if (!root) return;
    var h1 = document.getElementById('fsh-h1'), sub = document.getElementById('fsh-sub');
    if (h1) h1.textContent = tx(T.title); if (sub) sub.textContent = tx(T.sub); document.title = tx(T.title) + ' | Dehesa Index';
    getJSON('index').then(function (idx) {
      if (!idx || !idx.countries) { root.innerHTML = '<p>' + esc(tx(T.fail)) + '</p>'; return; }
      var ccs = idx.countries.map(function (r) { return r.cc; });
      if (!CUR) { var q = ''; try { q = (new URLSearchParams(global.location.search).get('c') || '').toUpperCase(); } catch (e) {} CUR = ccs.indexOf(q) >= 0 ? q : 'ES'; }
      return Promise.all([getJSON(CUR), glossary()]).then(function (r) {
        var d = r[0]; if (!d) { root.innerHTML = '<p>' + esc(tx(T.fail)) + '</p>'; return; }
        var opts = ccs.slice().sort(function (a, b) { return tx(N[a] || [a, a, a, a]).localeCompare(tx(N[b] || [b, b, b, b]), LOC[lg()]); }).map(function (c) { return '<option value="' + c + '"' + (c === CUR ? ' selected' : '') + '>' + esc(tx(N[c] || [c, c, c, c])) + '</option>'; }).join('');
        var ch = charts(d), noSea = d.cc !== 'US' && !d.series['ca-total'] && !d.series['ld-total-eur'];
        var h = '<div class="fsh-pick"><label for="fsh-cc">' + esc(tx(T.country)) + '</label> <select data-cpick="1" id="fsh-cc" class="di-compare-select">' + opts + '</select> ' + yearSel(d, 'fsh-yr') + (YEAR != null ? ' <span class="di-movers-hint">' + esc(tx(T.yrNote)) + '</span>' : '') + (noSea ? ' <span class="di-movers-hint">' + esc(tx(T.land)) + '</span>' : '') + '</div>' +
          '<div class="fsh-kpis">' + kpis(d) + '</div>' +
          (ch.length ? '<section class="di-card fsh-sec wp-card">' + ch.map(function (c) { return c.html; }).join('') + '</section>' : '') +
          speciesBlock(d) + statesBlock(d) + zonesBlock(d) + listBlock(tx(T.cT), d.catches, false) + listBlock(tx(T.aT), d.aquaculture, true) + fleetBlock(d) +
          compareBlock(idx, CUR) +
          T.notes.map(function (n) { return '<p class="di-movers-hint" style="max-width:860px">' + esc(tx(n)) + '</p>'; }).join('') + sources(d) +
          (d.cc === 'US' ? '' : '<p class="di-field-hint" style="margin:4px 0 0"><a href="https://www.fisheries.noaa.gov/foss" target="_blank" rel="noopener noreferrer">' + esc(tx(T.srcUs)) + '</a></p>');
        root.innerHTML = h;
        ch.forEach(function (c) { bindChart(root, c); }); mountFaoMaps(root);
        var sel = document.getElementById('fsh-cc'); if (sel) sel.onchange = function () { go(sel.value); };
        var ysel = document.getElementById('fsh-yr'); if (ysel) ysel.onchange = function () { YEAR = ysel.value ? +ysel.value : null; pageRender(); };
        [].forEach.call(root.querySelectorAll('.fsh-row'), function (tr) {
          tr.onclick = function (e) { if (e.target.closest && e.target.closest('a')) { e.preventDefault(); } go(tr.getAttribute('data-cc')); };
          tr.onkeydown = function (e) { if (e.key === 'Enter') go(tr.getAttribute('data-cc')); };
        });
      });
    });
    function go(cc) {
      CUR = cc; try { var u = new URL(global.location.href); u.searchParams.set('c', cc); global.history.replaceState(null, '', u.toString()); } catch (e) {}
      pageRender(); try { global.scrollTo(0, 0); } catch (e) {}
    }
  }
  /* ---- bloque de la ficha de país ---- */
  function mountCountry(el, lang, cc, folded) {
    if (!el) return Promise.resolve(false);
    return getJSON('index').then(function (idx) {
      if (!idx || !idx.countries || !idx.countries.some(function (r) { return r.cc === cc; })) return false;
      return Promise.all([getJSON(cc), glossary()]).then(function (r) {
        var d = r[0]; if (!d) return false;
        var ch = charts(d).slice(0, 1);
        var top = (d.landings || []).slice(0, 3).map(function (o) { return esc(spName(o.name)); }).join(', ');
        var inner = '<section class="di-card ps-rm wp-card gb-card" id="ps-fish" style="max-width:none"><h2 class="ps-rm-h">' + esc(tx(T.cardH)) + '</h2><div class="fsh-pick" style="margin:0 0 8px">' + yearSel(d, 'fsh-yr-' + cc) + '</div><div class="fsh-kpis" id="fsh-k-' + cc + '">' + kpis(d) + '</div>' +
          (top ? '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(tx(d.cc === 'US' ? T.spUS : T.spT)) + ': ' + top + '</p>' : '') +
          ch.map(function (c) { return c.html; }).join('') +
          '<p style="margin:10px 0 0"><a href="' + esc(sp('pesca.html') + '?c=' + cc) + '">' + esc(tx(T.more)) + '</a></p>' + sources(d) + '</section>';
        var SEC = global.DehesaSector;
        el.innerHTML = folded && SEC ? SEC.foldHtml(1, inner) : inner;
        ch.forEach(function (c) { bindChart(el, c); });
        var ys = el.querySelector('#fsh-yr-' + cc);
        if (ys) ys.onchange = function () { YEAR = ys.value ? +ys.value : null; var k = el.querySelector('#fsh-k-' + cc); if (k) k.innerHTML = kpis(d); };
        return true;
      });
    });
  }
  global.DIFish = { mountCountry: mountCountry, render: pageRender, T: T };
  if (document.getElementById('fsh-body')) {
    if (S.init) S.init('countries');
    S.onLangChange = function () { pageRender(); };
    var root = document.getElementById('fsh-body'); if (root) root.innerHTML = '<p class="di-movers-hint">' + esc(tx(T.loading)) + '</p>';
    pageRender();
  }
})(window);
