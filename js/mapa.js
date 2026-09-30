/* Dehesa Index — Mapa agrícola. Capas: precios verificados (data/latest.json) y clima (data/climate.json).
   Solo pinta lo que tiene dato verificado; cada valor va en su moneda y unidad (no se convierten monedas en el mapa). */
(function () {
  'use strict';
  var EU27 = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
  // Ámbito geográfico real de cada serie UE (según su metodología en data/latest.json).
  var EU_SPAIN = { arroz: 1, cerdo: 1, cordero: 1, harina_soja: 1, huevos: 1, leche: 1, maiz: 1, oliva: 1, pollo: 1, trigo: 1, vaca: 1 };
  var EU_WIDE = { azucar: 1, dap: 1, potasa: 1, diesel: 1 };
  var UK_CODE = 'GB';
  var UP = '#b4341f', DOWN = '#2a6f97', FLAT = '#9c968a';
  var PRECIP_CLASSES = [[-Infinity, -40, '#8a4a12'], [-40, -15, '#c98a4b'], [-15, 15, '#cfcac0'], [15, 40, '#6fa3c0'], [40, Infinity, '#1f5f88']];
  var TEMP_CLASSES = [[-Infinity, -1.5, '#1f6d6b'], [-1.5, -0.5, '#7fb5b3'], [-0.5, 0.5, '#cfcac0'], [0.5, 1.5, '#e0946f'], [1.5, Infinity, '#b4341f']];
  var T = {
    es: { title: 'Mapa agrícola', noVerified: 'sin dato verificado', sub: 'Dónde están los datos: precios verificados por país y cómo va el clima en las regiones productoras.',
      views: { world: 'Mundo', all: 'Atlántico', us: 'EE. UU.', eu: 'Europa' }, layers: { crops: 'Cultivos EE. UU.', price: 'Precios', precip: 'Lluvia', temp: 'Temperatura', prod: 'Producción', exp: 'Exportaciones', imp: 'Importaciones', stock: 'Existencias' }, sdNote: 'Datos de USDA (PSD), miles de toneladas. Cada país se pinta según su cifra de la campaña elegida; el color va por tramos de igual número de países. La UE aparece como un solo agregado y se pinta en sus 27 países. Un país sin color no tiene dato en PSD. La última campaña es una previsión.', sdMy: 'Campaña', sdForecast: 'previsión', sdMore: 'Balance completo y series', sdCountry: 'País', sdValue: 'Cifra', sdNoData: 'sin dato PSD', sdLess: 'menos', sdMore2: 'más', sdEu: 'Unión Europea (agregado)', cropsL: 'Cultivos EE. UU.', cropNames: { corn: 'Maíz', soybeans: 'Soja', wheat_winter: 'Trigo de invierno', wheat_spring: 'Trigo de primavera', cotton: 'Algodón' }, cropNote: 'Porcentaje de superficie en estado bueno o excelente en la última semana con dato de cada estado (USDA NASS, Crop Progress). Un estado sin color no tiene valoración publicada en las últimas semanas para este cultivo. La valoración es subjetiva y no es una previsión de cosecha ni de precios.', cropGe: 'Buena + excelente', cropWeek: 'Semana al', cropMore: 'Avance, histórico y comparación con otros años', cropState: 'Estado', product: 'Producto', scopeEs: 'España (referencia UE)', scopeEu: 'Media UE', scopeUs: 'EE. UU.', scopeUk: 'Reino Unido',
      change: 'Variación', date: 'Fecha', price: 'Precio', area: 'Ámbito', real: 'REAL', nc: 'NO COMPARABLE', up: 'sube', down: 'baja', flat: 'sin cambio',
      priceNote: 'Cada precio va en su moneda y unidad de origen: el mapa no convierte monedas. El color indica solo si el precio subió o bajó frente al periodo anterior (semanal o mensual según la fuente). Un país sin color no tiene dato verificado para este producto.',
      noData: 'Este producto no tiene datos verificados.', region: 'Región', vsNormal: 'vs. media 2001-2020', legendTitle: 'Leyenda',
      climateNote: 'Último mes cerrado, frente a la media 2001-2020 (NASA POWER). Cada punto es una celda de unos 50 km representativa de la región, no una estación. Es contexto, no predice cosechas ni precios.', more: 'Más detalle e histórico desde 2000',
      wet: 'más húmedo', dry: 'más seco', hot: 'más cálido', cool: 'más fresco', normal: 'cerca de lo normal', mm: 'mm', mapFail: 'No se pudo cargar el mapa; los datos siguen disponibles en la tabla.',
      names: { arroz: 'Arroz', azucar: 'Azúcar', cerdo: 'Cerdo', cordero: 'Cordero', dap: 'Fertilizante fosfatado', diesel: 'Diésel', harina_soja: 'Harina de soja', huevos: 'Huevos', leche: 'Leche', maiz: 'Maíz', oliva: 'Aceite de oliva', pollo: 'Pollo', potasa: 'Fertilizante potásico', trigo: 'Trigo', vaca: 'Vacuno' },
      units: { tonelada: 'tonelada', '100kg': '100 kg', cwt: 'cwt', bushel: 'bushel', docena: 'docena', litro: 'litro', gal: 'galón', kg: 'kg', lb: 'lb' } },
    en: { title: 'Agricultural map', noVerified: 'no verified data', sub: 'Where the data is: verified prices by country and how the climate looks in producing regions.',
      views: { world: 'World', all: 'Atlantic', us: 'U.S.', eu: 'Europe' }, layers: { crops: 'U.S. crops', price: 'Prices', precip: 'Rainfall', temp: 'Temperature', prod: 'Production', exp: 'Exports', imp: 'Imports', stock: 'Stocks' }, sdNote: 'USDA data (PSD), thousand tonnes. Each country is coloured by its figure for the chosen marketing year; colour bands hold an equal number of countries. The EU is a single aggregate painted on its 27 members. A country without colour has no PSD data. The latest year is a forecast.', sdMy: 'Marketing year', sdForecast: 'forecast', sdMore: 'Full balance and series', sdCountry: 'Country', sdValue: 'Figure', sdNoData: 'no PSD data', sdLess: 'less', sdMore2: 'more', sdEu: 'European Union (aggregate)', cropsL: 'U.S. crops', cropNames: { corn: 'Corn', soybeans: 'Soybeans', wheat_winter: 'Winter wheat', wheat_spring: 'Spring wheat', cotton: 'Cotton' }, cropNote: 'Share of acreage rated good or excellent in each state’s latest week with data (USDA NASS, Crop Progress). A state without colour has no published rating in recent weeks for this crop. Ratings are subjective and not a crop or price forecast.', cropGe: 'Good + excellent', cropWeek: 'Week ending', cropMore: 'Progress, history and comparison with other years', cropState: 'State', product: 'Product', scopeEs: 'Spain (EU reference)', scopeEu: 'EU average', scopeUs: 'United States', scopeUk: 'United Kingdom',
      change: 'Change', date: 'Date', price: 'Price', area: 'Scope', real: 'REAL', nc: 'NOT COMPARABLE', up: 'up', down: 'down', flat: 'unchanged',
      priceNote: 'Each price is in its original currency and unit: the map does not convert currencies. Colour only shows whether the price rose or fell versus the previous period (weekly or monthly depending on the source). A country without colour has no verified data for this product.',
      noData: 'This product has no verified data.', region: 'Region', vsNormal: 'vs. 2001-2020 average', legendTitle: 'Legend',
      climateNote: 'Latest closed month vs. the 2001-2020 average (NASA POWER). Each point is a ~50 km grid cell representing the region, not a station. Context only: it does not forecast crops or prices.', more: 'More detail and history since 2000',
      wet: 'wetter', dry: 'drier', hot: 'warmer', cool: 'cooler', normal: 'near normal', mm: 'mm', mapFail: 'The map could not be loaded; the data is still available in the table.',
      names: { arroz: 'Rice', azucar: 'Sugar', cerdo: 'Pork', cordero: 'Lamb', dap: 'Phosphate fertiliser', diesel: 'Diesel', harina_soja: 'Soya meal', huevos: 'Eggs', leche: 'Milk', maiz: 'Corn', oliva: 'Olive oil', pollo: 'Chicken', potasa: 'Potash fertiliser', trigo: 'Wheat', vaca: 'Beef' },
      units: { tonelada: 'tonne', '100kg': '100 kg', cwt: 'cwt', bushel: 'bushel', docena: 'dozen', litro: 'litre', gal: 'gallon', kg: 'kg', lb: 'lb' } },
    fr: { title: 'Carte agricole', noVerified: 'pas de donnée vérifiée', sub: 'Où se trouvent les données : prix vérifiés par pays et état du climat dans les régions productrices.',
      views: { world: 'Monde', all: 'Atlantique', us: 'États-Unis', eu: 'Europe' }, layers: { crops: 'Cultures USA', price: 'Prix', precip: 'Pluie', temp: 'Température', prod: 'Production', exp: 'Exportations', imp: 'Importations', stock: 'Stocks' }, sdNote: 'Données USDA (PSD), milliers de tonnes. Chaque pays est coloré selon son chiffre de la campagne choisie ; les tranches de couleur contiennent autant de pays. L’UE est un agrégat unique peint sur ses 27 pays. Un pays sans couleur n’a pas de donnée PSD. La dernière campagne est une prévision.', sdMy: 'Campagne', sdForecast: 'prévision', sdMore: 'Bilan complet et séries', sdCountry: 'Pays', sdValue: 'Chiffre', sdNoData: 'pas de donnée PSD', sdLess: 'moins', sdMore2: 'plus', sdEu: 'Union européenne (agrégat)', cropsL: 'Cultures USA', cropNames: { corn: 'Maïs', soybeans: 'Soja', wheat_winter: 'Blé d’hiver', wheat_spring: 'Blé de printemps', cotton: 'Coton' }, cropNote: 'Part de la surface notée bonne ou excellente lors de la dernière semaine avec données de chaque État (USDA NASS, Crop Progress). Un État sans couleur n’a pas de notation publiée récemment pour cette culture. La notation est subjective et ne constitue pas une prévision de récolte ni de prix.', cropGe: 'Bon + excellent', cropWeek: 'Semaine au', cropMore: 'Avancement, historique et comparaison avec d’autres années', cropState: 'État', product: 'Produit', scopeEs: 'Espagne (référence UE)', scopeEu: 'Moyenne UE', scopeUs: 'États-Unis', scopeUk: 'Royaume-Uni',
      change: 'Variation', date: 'Date', price: 'Prix', area: 'Périmètre', real: 'RÉEL', nc: 'NON COMPARABLE', up: 'hausse', down: 'baisse', flat: 'stable',
      priceNote: 'Chaque prix est dans sa devise et son unité d’origine : la carte ne convertit pas les devises. La couleur indique seulement si le prix a monté ou baissé par rapport à la période précédente (hebdomadaire ou mensuelle selon la source). Un pays sans couleur n’a pas de donnée vérifiée pour ce produit.',
      noData: 'Ce produit n’a pas de données vérifiées.', region: 'Région', vsNormal: 'vs. moyenne 2001-2020', legendTitle: 'Légende',
      climateNote: 'Dernier mois clos, par rapport à la moyenne 2001-2020 (NASA POWER). Chaque point est une maille d’environ 50 km représentative de la région, pas une station. Contexte uniquement : cela ne prévoit ni récoltes ni prix.', more: 'Plus de détails et historique depuis 2000',
      wet: 'plus humide', dry: 'plus sec', hot: 'plus chaud', cool: 'plus frais', normal: 'proche de la normale', mm: 'mm', mapFail: 'La carte n’a pas pu être chargée ; les données restent disponibles dans le tableau.',
      names: { arroz: 'Riz', azucar: 'Sucre', cerdo: 'Porc', cordero: 'Agneau', dap: 'Engrais phosphaté', diesel: 'Diesel', harina_soja: 'Tourteau de soja', huevos: 'Œufs', leche: 'Lait', maiz: 'Maïs', oliva: 'Huile d’olive', pollo: 'Poulet', potasa: 'Engrais potassique', trigo: 'Blé', vaca: 'Bœuf' },
      units: { tonelada: 'tonne', '100kg': '100 kg', cwt: 'cwt', bushel: 'boisseau', docena: 'douzaine', litro: 'litre', gal: 'gallon', kg: 'kg', lb: 'lb' } },
    it: { title: 'Mappa agricola', noVerified: 'nessun dato verificato', sub: 'Dove sono i dati: prezzi verificati per paese e stato del clima nelle regioni produttrici.',
      views: { world: 'Mondo', all: 'Atlantico', us: 'USA', eu: 'Europa' }, layers: { crops: 'Colture USA', price: 'Prezzi', precip: 'Pioggia', temp: 'Temperatura', prod: 'Produzione', exp: 'Esportazioni', imp: 'Importazioni', stock: 'Scorte' }, sdNote: 'Dati USDA (PSD), migliaia di tonnellate. Ogni paese è colorato in base al suo valore della campagna scelta; le fasce di colore contengono lo stesso numero di paesi. La UE è un unico aggregato dipinto sui suoi 27 paesi. Un paese senza colore non ha dati PSD. L’ultima campagna è una previsione.', sdMy: 'Campagna', sdForecast: 'previsione', sdMore: 'Bilancio completo e serie', sdCountry: 'Paese', sdValue: 'Valore', sdNoData: 'nessun dato PSD', sdLess: 'meno', sdMore2: 'più', sdEu: 'Unione europea (aggregato)', cropsL: 'Colture USA', cropNames: { corn: 'Mais', soybeans: 'Soia', wheat_winter: 'Grano invernale', wheat_spring: 'Grano primaverile', cotton: 'Cotone' }, cropNote: 'Quota di superficie valutata buona o eccellente nell’ultima settimana con dati di ogni Stato (USDA NASS, Crop Progress). Uno Stato senza colore non ha una valutazione pubblicata di recente per questa coltura. La valutazione è soggettiva e non è una previsione di raccolto né di prezzi.', cropGe: 'Buono + eccellente', cropWeek: 'Settimana al', cropMore: 'Avanzamento, storico e confronto con altri anni', cropState: 'Stato', product: 'Prodotto', scopeEs: 'Spagna (riferimento UE)', scopeEu: 'Media UE', scopeUs: 'Stati Uniti', scopeUk: 'Regno Unito',
      change: 'Variazione', date: 'Data', price: 'Prezzo', area: 'Ambito', real: 'REALE', nc: 'NON COMPARABILE', up: 'in aumento', down: 'in calo', flat: 'invariato',
      priceNote: 'Ogni prezzo è nella sua valuta e unità di origine: la mappa non converte le valute. Il colore indica solo se il prezzo è salito o sceso rispetto al periodo precedente (settimanale o mensile secondo la fonte). Un paese senza colore non ha dati verificati per questo prodotto.',
      noData: 'Questo prodotto non ha dati verificati.', region: 'Regione', vsNormal: 'vs. media 2001-2020', legendTitle: 'Legenda',
      climateNote: 'Ultimo mese chiuso, rispetto alla media 2001-2020 (NASA POWER). Ogni punto è una cella di circa 50 km rappresentativa della regione, non una stazione. Solo contesto: non prevede raccolti né prezzi.', more: 'Più dettagli e storico dal 2000',
      wet: 'più umido', dry: 'più secco', hot: 'più caldo', cool: 'più fresco', normal: 'vicino alla norma', mm: 'mm', mapFail: 'Impossibile caricare la mappa; i dati restano disponibili nella tabella.',
      names: { arroz: 'Riso', azucar: 'Zucchero', cerdo: 'Maiale', cordero: 'Agnello', dap: 'Fertilizzante fosfatico', diesel: 'Gasolio', harina_soja: 'Farina di soia', huevos: 'Uova', leche: 'Latte', maiz: 'Mais', oliva: 'Olio d’oliva', pollo: 'Pollo', potasa: 'Fertilizzante potassico', trigo: 'Grano', vaca: 'Bovino' },
      units: { tonelada: 'tonnellata', '100kg': '100 kg', cwt: 'cwt', bushel: 'bushel', docena: 'dozzina', litro: 'litro', gal: 'gallone', kg: 'kg', lb: 'lb' } }
  };
  var LATEST = null, CLIMATE = null, SD = null, CROPS = null, MAP = null;
  var SD_ATTR = { prod: 'production', exp: 'exports', imp: 'imports', stock: 'endingStocks' };
  var SEQ = ['#e3edf3', '#b4cfe0', '#7fabc9', '#3f7fa8', '#1d5178'];
  var SEL = { layer: 'price', product: 'trigo', view: 'all', sd: 'trigo', my: null, crop: 'corn' };
  var VIEWS = { world: {}, all: { regions: ['US', 'GB', 'ES', 'FR', 'DE', 'IT', 'PL'] }, us: { coords: [39, -97], scale: 2.6 }, eu: { coords: [48, 9], scale: 4.2 } };
  var SYM = { EUR: '€', USD: '$', GBP: '£' };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tr() { return T[lang()] || T.es; }
  function num(v, d) { return v.toFixed(d).replace('.', ','); }
  function sgn(v, d, unit) { return (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), d) + unit; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function priceDecimals(v) { return Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2; }
  function inClass(v, classes) { for (var i = 0; i < classes.length; i++) if (v >= classes[i][0] && v < classes[i][1]) return classes[i][2]; return classes[classes.length - 1][2]; }

  function priceRows(product) {
    var t = tr(), out = [];
    LATEST.forEach(function (o) {
      if (o.product !== product || o.status !== 'verified') return;
      var codes, scope;
      if (o.region === 'us') { codes = ['US']; scope = t.scopeUs; }
      else if (o.region === 'uk') { codes = [UK_CODE]; scope = t.scopeUk; }
      else if (EU_SPAIN[product]) { codes = ['ES']; scope = t.scopeEs; }
      else if (EU_WIDE[product]) { codes = EU27; scope = t.scopeEu; }
      else return;
      out.push({ codes: codes, scope: scope, value: o.value, currency: o.currency, unit: o.unit, change: o.changePct, date: o.observationDate, nc: o.comparability === 'not_comparable', freq: o.frequency });
    });
    return out;
  }
  function priceProducts() {
    var seen = {};
    LATEST.forEach(function (o) { if (o.status === 'verified' && (EU_SPAIN[o.product] || EU_WIDE[o.product] || (o.region !== 'eu' && T.es.names[o.product]))) seen[o.product] = 1; });
    return Object.keys(seen).sort(function (a, b) { return tr().names[a].localeCompare(tr().names[b]); });
  }
  function changeColor(c) { return c > 0 ? UP : c < 0 ? DOWN : FLAT; }
  function changeWord(c, t) { return c > 0 ? t.up : c < 0 ? t.down : t.flat; }

  function paintMap(codesColors, markers) {
    if (MAP) { try { MAP.destroy(); } catch (e) {} MAP = null; }
    var host = document.getElementById('mapa-canvas'), fb = document.getElementById('mapa-fallback');
    if (!host) return;
    host.innerHTML = '';
    if (typeof window.jsVectorMap !== 'function') { fb.textContent = tr().mapFail; fb.style.display = 'block'; return; }
    fb.style.display = 'none';
    try {
      MAP = new window.jsVectorMap({
        selector: '#mapa-canvas', map: 'world', backgroundColor: 'transparent', zoomButtons: true, zoomOnScroll: false, showTooltip: true,
        regionStyle: { initial: { fill: '#e6e2d6', stroke: '#c8c3b4', strokeWidth: 0.4, fillOpacity: 1 }, hover: { fillOpacity: 0.85 } },
        markers: markers || [], markerStyle: { initial: { r: 8, stroke: '#ffffff', strokeWidth: 1.5, fillOpacity: 1 }, hover: { r: 10 } },
        onMarkerTooltipShow: function (e, tip, idx) { if (markers && markers[idx]) tip.text(markers[idx].html, true); },
        onRegionTooltipShow: function (e, tip, code) { var h = codesColors && codesColors[code] && codesColors[code].html; if (h) tip.text(h, true); }
      });
      try { var vw = VIEWS[SEL.view] || VIEWS.all; if (vw.regions || vw.coords) MAP.setFocus(vw.regions ? { regions: vw.regions, animate: false } : { coords: vw.coords, scale: vw.scale, animate: false }); } catch (e) {}
      Object.keys(codesColors || {}).forEach(function (code) {
        var r = MAP.regions && MAP.regions[code]; if (r) { try { r.element.setStyle('fill', codesColors[code].color); } catch (e) {} }
      });
    } catch (e) { MAP = null; fb.textContent = tr().mapFail; fb.style.display = 'block'; }
  }

  function legend(items) {
    return '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;margin:8px 0">' + items.map(function (i) { return '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:3px;background:' + i[0] + ';display:inline-block;border:1px solid rgba(0,0,0,.15)"></span>' + esc(i[1]) + '</span>'; }).join('') + '</div>';
  }

  function renderPrice(t) {
    var prods = priceProducts();
    if (prods.indexOf(SEL.product) < 0) SEL.product = prods[0];
    var rows = priceRows(SEL.product);
    var opts = prods.map(function (p) { return '<option value="' + p + '"' + (p === SEL.product ? ' selected' : '') + '>' + esc(t.names[p]) + '</option>'; }).join('');
    var colors = {};
    rows.forEach(function (r) {
      var html = '<strong>' + esc(r.scope) + '</strong><br>' + esc(SYM[r.currency] || r.currency) + num(r.value, priceDecimals(r.value)) + ' / ' + esc(t.units[r.unit] || r.unit) + '<br>' + esc(t.change) + ': ' + sgn(r.change, 1, ' %') + ' (' + changeWord(r.change, t) + ')';
      r.codes.forEach(function (c) { colors[c] = { color: changeColor(r.change), html: html }; });
    });
    var table = '<div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:560px;font-size:14px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:10px 6px">' + t.area.toUpperCase() + '</th><th style="padding:10px 6px;text-align:right">' + t.price.toUpperCase() + '</th><th style="padding:10px 6px;text-align:right">' + t.change.toUpperCase() + '</th><th style="padding:10px 6px">' + t.date.toUpperCase() + '</th><th style="padding:10px 6px"></th></tr>' +
      rows.map(function (r) { return '<tr style="border-top:1px solid var(--border)"><td style="padding:10px 6px;font-weight:600">' + esc(r.scope) + '</td><td style="padding:10px 6px;text-align:right">' + esc(SYM[r.currency] || r.currency) + num(r.value, priceDecimals(r.value)) + ' / ' + esc(t.units[r.unit] || r.unit) + '</td><td style="padding:10px 6px;text-align:right;font-weight:600;color:' + changeColor(r.change) + '">' + sgn(r.change, 1, ' %') + '</td><td style="padding:10px 6px">' + esc(r.date) + '</td><td style="padding:10px 6px"><span class="di-movers-hint">' + (r.nc ? t.nc : t.real) + '</span></td></tr>'; }).join('') + '</table></div>';
    document.getElementById('mapa-controls').innerHTML = '<label style="font-size:13px">' + t.product + '<br><select id="mapa-sel-prod" class="di-compare-select">' + opts + '</select></label>';
    document.getElementById('mapa-sel-prod').onchange = function (e) { SEL.product = e.target.value; render(); };
    document.getElementById('mapa-legend').innerHTML = legend([[UP, t.up], [DOWN, t.down], [FLAT, t.flat], ['#e6e2d6', t.noVerified]]);
    document.getElementById('mapa-table').innerHTML = rows.length ? table : '<p class="di-movers-hint">' + t.noData + '</p>';
    document.getElementById('mapa-note').textContent = t.priceNote;
    paintMap(colors, null);
  }

  function renderClimate(t, kind) {
    if (!CLIMATE) { SEL.layer = 'price'; return renderPrice(t); }
    var isP = kind === 'precip', classes = isP ? PRECIP_CLASSES : TEMP_CLASSES;
    var locs = CLIMATE.locations, last = CLIMATE.lastPeriod;
    var markers = locs.map(function (l) {
      var m = l.months[l.months.length - 1], v = isP ? m.precipAnomalyPct : m.tempAnomalyC;
      var line = isP ? sgn(v, 0, ' %') + ' (' + num(m.precipMm, 0) + ' ' + t.mm + ')' : sgn(v, 1, ' °C') + ' (' + num(m.tempC, 1) + ' °C)';
      return { name: l.name, coords: [l.lat, l.lon], style: { initial: { fill: inClass(v, classes) } }, html: '<strong>' + esc(l.name) + '</strong><br>' + esc(m.period) + ': ' + line + '<br>' + t.vsNormal, v: v, m: m, l: l };
    });
    var rows = markers.slice().sort(function (a, b) { return isP ? a.v - b.v : b.v - a.v; });
    var table = '<div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:480px;font-size:14px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:10px 6px">' + t.region.toUpperCase() + ' (' + esc(last) + ')</th><th style="padding:10px 6px;text-align:right">' + (isP ? t.layers.precip : t.layers.temp).toUpperCase() + ' ' + t.vsNormal.toUpperCase() + '</th></tr>' +
      rows.map(function (r) { var c = inClass(r.v, classes); return '<tr style="border-top:1px solid var(--border)"><td style="padding:10px 6px"><span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:' + c + ';margin-right:8px;border:1px solid rgba(0,0,0,.15)"></span><b>' + esc(r.l.name) + '</b></td><td style="padding:10px 6px;text-align:right;font-weight:600">' + (isP ? sgn(r.v, 0, ' %') : sgn(r.v, 1, ' °C')) + '</td></tr>'; }).join('') + '</table></div>';
    document.getElementById('mapa-controls').innerHTML = '';
    var lg = isP ? [[classes[0][2], '< −40 % ' + t.dry], [classes[1][2], '−40 … −15 %'], [classes[2][2], t.normal], [classes[3][2], '+15 … +40 %'], [classes[4][2], '> +40 % ' + t.wet]] : [[classes[0][2], '< −1,5 °C ' + t.cool], [classes[1][2], '−1,5 … −0,5 °C'], [classes[2][2], t.normal], [classes[3][2], '+0,5 … +1,5 °C'], [classes[4][2], '> +1,5 °C ' + t.hot]];
    document.getElementById('mapa-legend').innerHTML = legend(lg);
    document.getElementById('mapa-table').innerHTML = table + '<p class="di-movers-hint" style="margin-top:8px"><a href="clima.html">' + t.more + ' →</a></p>';
    document.getElementById('mapa-note').textContent = t.climateNote;
    paintMap(null, markers);
  }


  function sdCom() { for (var i = 0; i < SD.commodities.length; i++) if (SD.commodities[i].id === SEL.sd) return SD.commodities[i]; return SD.commodities[0]; }
  function renderSD(t, kind) {
    if (!SD) { SEL.layer = 'price'; return renderPrice(t); }
    var P = window.DehesaPSD, attr = SD_ATTR[kind], c = sdCom(); SEL.sd = c.id;
    var mys = []; Object.keys(c.countries).forEach(function (k) { Object.keys(c.countries[k].years).forEach(function (y) { if (mys.indexOf(+y) < 0) mys.push(+y); }); });
    mys.sort(function (a, b) { return b - a; });
    if (mys.indexOf(SEL.my) < 0) SEL.my = c.latestMarketYear;
    var rows = [];
    Object.keys(c.countries).forEach(function (iso) { var y = c.countries[iso].years[SEL.my], v = y && y[attr]; if (typeof v === 'number' && v > 0) rows.push({ iso: iso, name: iso === 'EU' ? t.sdEu : P.countryName(iso, c.countries[iso].name), v: v }); });
    rows.sort(function (a, b) { return b.v - a.v; });
    var sorted = rows.map(function (r) { return r.v; }).sort(function (a, b) { return a - b; }), n = sorted.length, cuts = [];
    for (var q = 1; q < 5; q++) cuts.push(n ? sorted[Math.min(n - 1, Math.floor(n * q / 5))] : 0);
    function cls(v) { var k = 0; while (k < 4 && v >= cuts[k]) k++; return k; }
    var unitTxt = c.unit.indexOf('CWE') >= 0 ? 'kt CWE' : 'kt';
    var colors = {};
    rows.forEach(function (r) {
      var html = '<strong>' + esc(r.name) + '</strong><br>' + esc(t.layers[kind]) + ': ' + P.nf(r.v, 0) + ' ' + unitTxt + '<br>' + esc(P.myLabel(c.id, SEL.my));
      var codes = r.iso === 'EU' ? EU27 : [r.iso]; codes.forEach(function (code) { colors[code] = { color: SEQ[cls(r.v)], html: html }; });
    });
    var nm = P.names();
    var opts = SD.commodities.map(function (d) { return '<option value="' + d.id + '"' + (d.id === c.id ? ' selected' : '') + '>' + esc(nm[d.id] || d.id) + '</option>'; }).join('');
    var yopts = mys.map(function (y) { return '<option value="' + y + '"' + (y === SEL.my ? ' selected' : '') + '>' + P.myLabel(c.id, y) + (y === c.latestMarketYear ? ' (' + t.sdForecast + ')' : '') + '</option>'; }).join('');
    document.getElementById('mapa-controls').innerHTML = '<div style="display:flex;gap:16px;flex-wrap:wrap"><label style="font-size:13px">' + t.product + '<br><select id="mapa-sel-sd" class="di-compare-select">' + opts + '</select></label><label style="font-size:13px">' + t.sdMy + '<br><select id="mapa-sel-my" class="di-compare-select">' + yopts + '</select></label></div>';
    document.getElementById('mapa-sel-sd').onchange = function (e) { SEL.sd = e.target.value; SEL.my = null; render(); };
    document.getElementById('mapa-sel-my').onchange = function (e) { SEL.my = parseInt(e.target.value, 10); render(); };
    function short(v) { return v >= 1000 ? P.nf(v / 1000, v >= 10000 ? 0 : 1) + ' Mt' : P.nf(v, 0) + ' kt'; }
    var lg = n ? [[SEQ[0], '< ' + short(cuts[0]) + ' (' + t.sdLess + ')']].concat([1, 2, 3].map(function (k) { return [SEQ[k], short(cuts[k - 1]) + ' – ' + short(cuts[k])]; })).concat([[SEQ[4], '≥ ' + short(cuts[3]) + ' (' + t.sdMore2 + ')'], ['#e6e2d6', t.sdNoData]]) : [['#e6e2d6', t.sdNoData]];
    document.getElementById('mapa-legend').innerHTML = legend(lg);
    var top = rows.slice(0, 12), mx = top.length ? top[0].v : 1;
    document.getElementById('mapa-table').innerHTML = top.length ? '<div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:420px;font-size:14px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:10px 6px">' + t.sdCountry.toUpperCase() + '</th><th></th><th style="padding:10px 6px;text-align:right">' + esc(t.layers[kind].toUpperCase()) + ' (' + unitTxt + ')</th></tr>' +
      top.map(function (r) { return '<tr style="border-top:1px solid var(--border)"><td style="padding:9px 6px;font-weight:600;white-space:nowrap">' + esc(r.name) + '</td><td style="padding:9px 6px;width:40%"><div style="height:8px;border-radius:2px 4px 4px 2px;background:' + SEQ[3] + ';width:' + (r.v / mx * 100).toFixed(1) + '%"></div></td><td style="padding:9px 6px;text-align:right">' + P.nf(r.v, 0) + '</td></tr>'; }).join('') + '</table></div><p class="di-movers-hint" style="margin-top:8px"><a href="oferta-demanda.html">' + t.sdMore + ' →</a></p>' : '<p class="di-movers-hint">' + t.noData + '</p>';
    document.getElementById('mapa-note').textContent = t.sdNote;
    paintMap(colors, null);
  }

  var CROP_CLASSES = [[-Infinity, 40, '#e3edf3'], [40, 55, '#b4cfe0'], [55, 70, '#7fabc9'], [70, 85, '#3f7fa8'], [85, Infinity, '#1d5178']];
  function renderCrops(t) {
    if (!CROPS || !window.DEHESA_US_STATES) { SEL.layer = 'price'; return renderPrice(t); }
    var nf = function (v) { try { return v.toLocaleString(lang()); } catch (e) { return String(v); } };
    var ids = ['corn', 'soybeans', 'wheat_winter', 'wheat_spring', 'cotton'].filter(function (id) { return CROPS.crops.some(function (c) { return c.id === id; }); });
    if (ids.indexOf(SEL.crop) < 0) SEL.crop = ids[0];
    var c = CROPS.crops.filter(function (x) { return x.id === SEL.crop; })[0];
    var maxWe = ''; Object.keys(c.states).forEach(function (k) { var a = c.states[k]; if (a[a.length - 1].we > maxWe) maxWe = a[a.length - 1].we; });
    var minWe = maxWe ? new Date(new Date(maxWe).getTime() - 35 * 86400000).toISOString().slice(0, 10) : '';
    var vals = {}, rows = [];
    Object.keys(c.states).forEach(function (k) { var a = c.states[k], l = a[a.length - 1]; if (l.we < minWe) return; var v = l.g + l.e; vals[k] = { v: v, we: l.we }; rows.push({ k: k, v: v, we: l.we }); });
    rows.sort(function (a, b) { return b.v - a.v; });
    var col = function (v) { return inClass(v, CROP_CLASSES); };
    var svg = '<svg id="mapa-us" viewBox="' + window.DEHESA_US_STATES.viewBox + '" style="width:100%;height:auto;display:block" role="img" aria-label="' + esc(t.cropsL) + '">' + window.DEHESA_US_STATES.states.map(function (s) {
      var x = vals[s.id]; return '<path data-st="' + s.id + '" d="' + s.d + '" fill="' + (x ? col(x.v) : '#e6e2d6') + '" stroke="#ffffff" stroke-width="0.8" stroke-linejoin="round"></path>';
    }).join('') + '</svg><div id="mapa-us-tip" style="display:none;position:absolute;pointer-events:none;background:var(--surface,#fff);border:1px solid var(--border);border-radius:6px;padding:6px 9px;font-size:12.5px;box-shadow:0 2px 8px rgba(0,0,0,.12);white-space:nowrap"></div>';
    document.getElementById('mapa-controls').innerHTML = '<label style="font-size:13px">' + t.product + '<br><select id="mapa-sel-crop" class="di-compare-select">' + ids.map(function (id) { return '<option value="' + id + '"' + (id === SEL.crop ? ' selected' : '') + '>' + esc(t.cropNames[id]) + '</option>'; }).join('') + '</select></label>';
    document.getElementById('mapa-sel-crop').onchange = function (e) { SEL.crop = e.target.value; render(); };
    document.getElementById('mapa-legend').innerHTML = legend([[CROP_CLASSES[0][2], '< 40 %'], [CROP_CLASSES[1][2], '40–55 %'], [CROP_CLASSES[2][2], '55–70 %'], [CROP_CLASSES[3][2], '70–85 %'], [CROP_CLASSES[4][2], '≥ 85 %'], ['#e6e2d6', t.noVerified]]);
    document.getElementById('mapa-canvas').style.height = 'auto'; document.getElementById('mapa-canvas').style.position = 'relative'; document.getElementById('mapa-canvas').innerHTML = svg;
    var box = document.getElementById('mapa-canvas'), tip = document.getElementById('mapa-us-tip');
    Array.prototype.forEach.call(box.querySelectorAll('path'), function (p) {
      var st = p.getAttribute('data-st'), x = vals[st];
      p.addEventListener('mousemove', function (e) { var r = box.getBoundingClientRect(); tip.innerHTML = '<strong>' + esc(st) + '</strong><br>' + (x ? esc(t.cropGe) + ': ' + nf(x.v) + ' %<br>' + esc(t.cropWeek) + ' ' + esc(x.we) : esc(t.noVerified)); tip.style.display = 'block'; tip.style.left = Math.min(e.clientX - r.left + 12, r.width - 150) + 'px'; tip.style.top = (e.clientY - r.top + 12) + 'px'; });
      p.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
    });
    document.getElementById('mapa-table').innerHTML = rows.length ? '<div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:420px;font-size:14px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:10px 6px">' + esc(t.cropState.toUpperCase()) + '</th><th></th><th style="padding:10px 6px;text-align:right">' + esc(t.cropGe.toUpperCase()) + '</th><th style="padding:10px 6px">' + esc(t.cropWeek.toUpperCase()) + '</th></tr>' +
      rows.slice(0, 12).map(function (r) { return '<tr style="border-top:1px solid var(--border)"><td style="padding:9px 6px;font-weight:600">' + esc(r.k) + '</td><td style="padding:9px 6px;width:38%"><div style="height:8px;border-radius:2px 4px 4px 2px;background:' + CROP_CLASSES[3][2] + ';width:' + r.v + '%"></div></td><td style="padding:9px 6px;text-align:right">' + nf(r.v) + ' %</td><td style="padding:9px 6px;color:var(--text-faint)">' + esc(r.we) + '</td></tr>'; }).join('') + '</table></div><p class="di-movers-hint" style="margin-top:8px"><a href="cultivos.html">' + esc(t.cropMore) + ' →</a></p>' : '<p class="di-movers-hint">' + t.noData + '</p>';
    document.getElementById('mapa-note').textContent = t.cropNote;
  }

  function shell() {
    var t = tr();
    var btn = function (k) { return '<button type="button" class="di-link-btn" data-layer="' + k + '" aria-pressed="' + (SEL.layer === k) + '" style="' + (SEL.layer === k ? 'font-weight:700;text-decoration:underline;' : '') + 'margin-right:14px">' + t.layers[k] + '</button>'; };
    document.getElementById('mapa-body').innerHTML = '<div style="margin-bottom:12px">' + btn('price') + btn('precip') + btn('temp') + (SD ? btn('prod') + btn('exp') + btn('imp') + btn('stock') : '') + (CROPS && window.DEHESA_US_STATES ? btn('crops') : '') + '</div><div id="mapa-controls" style="margin-bottom:10px"></div><div id="mapa-legend"></div>' +
      '<div style="margin:0 0 6px;font-size:13px">' + (SEL.layer === 'crops' ? [] : SD_ATTR[SEL.layer] ? ['world', 'us', 'eu'] : ['all', 'us', 'eu']).map(function (v) { return '<button type="button" class="di-link-btn" data-view="' + v + '" aria-pressed="' + (SEL.view === v) + '" style="' + (SEL.view === v ? 'font-weight:700;text-decoration:underline;' : '') + 'margin-right:12px">' + t.views[v] + '</button>'; }).join('') + '</div><div class="di-card" style="padding:8px"><div id="mapa-canvas" style="height:420px;width:100%"></div><p id="mapa-fallback" class="di-movers-hint" style="display:none;padding:12px"></p></div><p id="mapa-note" class="di-info-api-notice" style="margin:10px 0 18px"></p><div id="mapa-table"></div>';
    Array.prototype.forEach.call(document.querySelectorAll('#mapa-body [data-view]'), function (b) { b.onclick = function () { SEL.view = b.getAttribute('data-view'); shell(); render(); }; });
    Array.prototype.forEach.call(document.querySelectorAll('#mapa-body [data-layer]'), function (b) { b.onclick = function () { SEL.layer = b.getAttribute('data-layer'); if (SD_ATTR[SEL.layer] && SEL.view === 'all') SEL.view = 'world'; else if (!SD_ATTR[SEL.layer] && SEL.view === 'world') SEL.view = 'all'; shell(); render(); }; });
  }
  function render() {
    var t = tr();
    document.title = 'Dehesa Index — ' + t.title;
    document.getElementById('pg-h1').textContent = t.title;
    document.getElementById('pg-sub').textContent = t.sub;
    if (!document.getElementById('mapa-canvas')) shell();
    if (SEL.layer === 'price') renderPrice(t); else if (SEL.layer === 'crops') renderCrops(t); else if (SD_ATTR[SEL.layer]) renderSD(t, SEL.layer); else renderClimate(t, SEL.layer);
  }
  window.DehesaShared.init('informacion');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); shell(); render(); };
  Promise.all([
    fetch('data/latest.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
    fetch('data/climate.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
    window.DehesaPSD ? window.DehesaPSD.load('data/supply-demand-map.json') : null,
    fetch('data/crop-progress.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
  ]).then(function (a) {
    SD = a[2] || null; CROPS = a[3] && a[3].crops && a[3].crops.length ? a[3] : null;
    LATEST = (a[0] && a[0].observations) || []; CLIMATE = a[1] && a[1].locations && a[1].locations.length ? a[1] : null;
    if (!LATEST.length && !CLIMATE) return;
    shell(); render();
  });
})();
