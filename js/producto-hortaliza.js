/* Dehesa Index — Ficha de fruta, hortaliza o fruto seco (12-oct-2026). Empezó con el tomate («¿por qué no tenemos datos de los tomates?») y ahora
   sirve para los 52 productos de data/fv-products.json (scripts/build-fv-products.py: «que todos los cultivos que tenemos estén»).
   Bloques, cada uno solo si hay dato:
   1) precio semanal en el país elegido y por tipo (Comisión Europea, portal agroalimentario; data/eu/fruta/<id>.json, días desde 2000-01-01), y comparación entre países;
   2) precio percibido por el agricultor en España, mensual, y su estacionalidad (MAPA; data/series/ES/*.json);
   3) superficie y producción por provincia de las dos últimas campañas (MAPA; data/spain-crops/crops-<grupo>.json).
   Precios en €/kg (los ficheros traen €/100 kg). ES5, sin librerías. Uso: DIVeg.load() -> Promise<doc>; DIVeg.mount(el, id, lang). */
(function (global) {
  'use strict';
  var CN = { AT: ['Austria', 'Austria', 'Autriche', 'Austria'], BE: ['Bélgica', 'Belgium', 'Belgique', 'Belgio'], BG: ['Bulgaria', 'Bulgaria', 'Bulgarie', 'Bulgaria'], CY: ['Chipre', 'Cyprus', 'Chypre', 'Cipro'], CZ: ['Chequia', 'Czechia', 'Tchéquie', 'Cechia'], DE: ['Alemania', 'Germany', 'Allemagne', 'Germania'], DK: ['Dinamarca', 'Denmark', 'Danemark', 'Danimarca'], EL: ['Grecia', 'Greece', 'Grèce', 'Grecia'], ES: ['España', 'Spain', 'Espagne', 'Spagna'], FR: ['Francia', 'France', 'France', 'Francia'], HR: ['Croacia', 'Croatia', 'Croatie', 'Croazia'], HU: ['Hungría', 'Hungary', 'Hongrie', 'Ungheria'], IT: ['Italia', 'Italy', 'Italie', 'Italia'], LT: ['Lituania', 'Lithuania', 'Lituanie', 'Lituania'], LU: ['Luxemburgo', 'Luxembourg', 'Luxembourg', 'Lussemburgo'], LV: ['Letonia', 'Latvia', 'Lettonie', 'Lettonia'], MT: ['Malta', 'Malta', 'Malte', 'Malta'], NL: ['Países Bajos', 'Netherlands', 'Pays-Bas', 'Paesi Bassi'], PL: ['Polonia', 'Poland', 'Pologne', 'Polonia'], PT: ['Portugal', 'Portugal', 'Portugal', 'Portogallo'], RO: ['Rumanía', 'Romania', 'Roumanie', 'Romania'], SE: ['Suecia', 'Sweden', 'Suède', 'Svezia'], SI: ['Eslovenia', 'Slovenia', 'Slovénie', 'Slovenia'], SK: ['Eslovaquia', 'Slovakia', 'Slovaquie', 'Slovacchia'], EE: ['Estonia', 'Estonia', 'Estonie', 'Estonia'], FI: ['Finlandia', 'Finland', 'Finlande', 'Finlandia'], IE: ['Irlanda', 'Ireland', 'Irlande', 'Irlanda'] };
  var LI = { es: 0, en: 1, fr: 2, it: 3 }, LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
  // fase de venta y variantes más comunes (el resto se muestra con su nombre original)
  var STG = { pack: ['salida de almacén', 'packing-house price', 'sortie de station', 'uscita magazzino'], farm: ['en finca', 'farm-gate', 'à la ferme', 'in azienda'], retail: ['compra del minorista', 'retailer buying price', 'achat du détaillant', 'acquisto del dettagliante'] };
  var VAR = { 'All types and varieties': ['todos los tipos', 'all types', 'tous types', 'tutti i tipi'], 'Round': ['redondo', 'round', 'ronde', 'tondo'], 'Cherry/Special': ['cereza', 'cherry', 'cerise', 'ciliegino'], 'Trusses=Vine/"Grappes"': ['en rama', 'on the vine', 'en grappe', 'a grappolo'],
    'National weighted average of all types and varieties': ['media nacional', 'national average', 'moyenne nationale', 'media nazionale'], 'National weighted average of main varieties covering at least 70 % of the representative market in the reference period of the notification': ['media nacional', 'national average', 'moyenne nationale', 'media nazionale'],
    'Smooth varieties': ['lisos', 'smooth', 'lisses', 'lisci'], 'White': ['blanco', 'white', 'blanc', 'bianco'], 'Violet': ['morado', 'purple', 'violet', 'viola'], 'Spring': ['tierno', 'spring', 'nouveau', 'fresco'], 'Iceberg': ['iceberg', 'iceberg', 'iceberg', 'iceberg'], 'Navel': ['Navel', 'Navel', 'Navel', 'Navel'], 'Navelinas': ['Navelina', 'Navelina', 'Navelina', 'Navelina'], 'Valencia late': ['Valencia late', 'Valencia late', 'Valencia late', 'Valencia late'], 'Yellow flesh': ['carne amarilla', 'yellow flesh', 'chair jaune', 'polpa gialla'], 'White flesh': ['carne blanca', 'white flesh', 'chair blanche', 'polpa bianca'], 'Flat': ['plano (paraguayo)', 'flat', 'plate', 'piatta'], 'Closed': ['cerrado', 'closed', 'fermé', 'chiuso'], 'Hass': ['Hass', 'Hass', 'Hass', 'Hass'], 'Galia': ['Galia', 'Galia', 'Galia', 'Galia'], 'Conference': ['Conferencia', 'Conference', 'Conférence', 'Conference'], 'Blanquilla': ['Blanquilla', 'Blanquilla', 'Blanquilla', 'Blanquilla'], 'Golden delicious': ['Golden', 'Golden', 'Golden', 'Golden'], 'Gala': ['Gala', 'Gala', 'Gala', 'Gala'], 'Fuji': ['Fuji', 'Fuji', 'Fuji', 'Fuji'], 'Granny smith': ['Granny Smith', 'Granny Smith', 'Granny Smith', 'Granny Smith'] };
  var T = {
    es: { sub: 'Precio de cada semana en origen, lo que cobra el agricultor y dónde se cultiva en España, con datos oficiales.', ctry: 'País',
      now: 'Precio de esta semana', nowWk: '{p} en {c} ({v}, {s}), semana del {d}', perKg: '€/kg', w1: 'Semana anterior', y1: 'Hace un año', last: 'Último dato publicado: {d}. Es un producto de temporada o el país publica poco; fuera de temporada no hay cotización.',
      nowHow: 'Salida de almacén: lo que cobra el almacén o la cooperativa al vender el producto ya clasificado y envasado, sin IVA. En finca: lo que recibe el agricultor antes de esa preparación. Compra del minorista: lo que paga la tienda. Lo publica cada semana la Comisión Europea con datos de cada país.',
      chE: 'Precio semanal en {c} por tipo', from: 'Desde', all: 'Todo', hover: 'Pasa el cursor por la gráfica.',
      cmp: '{c} frente a otros países', cmpHow: 'Último dato de cada país, con el tipo y la fase de venta que publica. Si el dato tiene más de dos meses sale en gris.', old: 'dato antiguo', noEu: 'La Comisión Europea no publica precio semanal de este producto.',
      perc: 'Lo que cobra el agricultor en España (MAPA)', percNow: 'Precio percibido, {m}', percY: 'Mismo mes del año anterior', percOld: 'El MAPA dejó de publicar esta serie: el último dato es de {m}.', percHow: 'Precio medio mensual que reciben los agricultores, según el Ministerio de Agricultura. Es otra fuente y otra fase de venta que el precio semanal de arriba, así que no se deben comparar entre sí.', chP: 'Precio percibido por el agricultor (mensual)',
      sea: 'Precio medio de cada mes, {a}–{b}', seaHow: 'Así se ve la estacionalidad: la barra oscura es el mes actual.',
      crop: 'Dónde se cultiva en España (campaña {y})', area: 'Superficie', prod: 'Producción', yld: 'Rendimiento medio', prev: 'Campaña anterior', fresh: 'Para consumo en fresco', ind: 'Para industria (tomate frito, concentrado, zumo)', glass: 'Del tomate de mesa, en invernadero', top: 'Las provincias que más producen', share: 'del total', prov: 'provisional', provNote: 'Datos de la campaña {y} provisionales del MAPA.',
      all2: 'Todas las frutas y hortalizas', allTxt: 'Ver los precios de todas las frutas, hortalizas y frutos secos', cat: 'Buscar más series en el catálogo',
      src: 'Fuentes:', sEU: 'Comisión Europea, portal de datos agroalimentarios', sMAPA: 'MAPA, precios percibidos', sCrop: 'MAPA, superficies y producciones anuales de cultivos', t1000: 'mil t', t: 't', ha: 'ha', none: 'No hay datos de este producto.' },
    en: { sub: 'Weekly price at origin, what farmers get and where it is grown in Spain, from official data.', ctry: 'Country',
      now: 'This week’s price', nowWk: '{p} in {c} ({v}, {s}), week of {d}', perKg: '€/kg', w1: 'Previous week', y1: 'A year ago', last: 'Latest figure published: {d}. It is a seasonal product or the country reports rarely; there is no quote out of season.',
      nowHow: 'Packing-house price: what the packing house or co-op gets when selling the produce graded and packed, before VAT. Farm-gate: what the grower receives before that preparation. Retailer buying price: what the shop pays. The European Commission publishes them every week with data from each country.',
      chE: 'Weekly price in {c} by type', from: 'From', all: 'All', hover: 'Hover over the chart.',
      cmp: '{c} against other countries', cmpHow: 'Latest figure for each country, with the type and stage of sale it reports. Figures older than two months are greyed out.', old: 'old figure', noEu: 'The European Commission does not publish a weekly price for this product.',
      perc: 'What farmers get in Spain (MAPA)', percNow: 'Price received, {m}', percY: 'Same month a year earlier', percOld: 'MAPA stopped publishing this series: the latest figure is from {m}.', percHow: 'Average monthly price farmers receive, according to the Ministry of Agriculture. It is a different source and stage of sale than the weekly price above, so the two should not be compared.', chP: 'Price received by farmers (monthly)',
      sea: 'Average price for each month, {a}–{b}', seaHow: 'This shows the seasonality: the dark bar is the current month.',
      crop: 'Where it is grown in Spain ({y} season)', area: 'Area', prod: 'Production', yld: 'Average yield', prev: 'Previous season', fresh: 'For fresh consumption', ind: 'For processing (sauce, paste, juice)', glass: 'Of fresh tomatoes, grown under glass or plastic', top: 'The provinces that produce the most', share: 'of total', prov: 'provisional', provNote: 'MAPA figures for the {y} season are provisional.',
      all2: 'All fruit and vegetables', allTxt: 'See prices for all fruit, vegetables and nuts', cat: 'Find more series in the catalogue',
      src: 'Sources:', sEU: 'European Commission, agri-food data portal', sMAPA: 'MAPA, prices received', sCrop: 'MAPA, annual crop areas and production', t1000: 'thousand t', t: 't', ha: 'ha', none: 'No data for this product.' },
    fr: { sub: 'Prix hebdomadaire à l’origine, ce que touche l’agriculteur et où on le cultive en Espagne, avec des données officielles.', ctry: 'Pays',
      now: 'Prix de cette semaine', nowWk: '{p} en {c} ({v}, {s}), semaine du {d}', perKg: '€/kg', w1: 'Semaine précédente', y1: 'Il y a un an', last: 'Dernière donnée publiée : {d}. C’est un produit de saison ou le pays publie peu ; hors saison il n’y a pas de cotation.',
      nowHow: 'Sortie de station : ce que touche la station ou la coopérative en vendant le produit trié et emballé, hors TVA. À la ferme : ce que reçoit le producteur avant cette préparation. Achat du détaillant : ce que paie le magasin. La Commission européenne les publie chaque semaine avec les données de chaque pays.',
      chE: 'Prix hebdomadaire en {c} par type', from: 'Depuis', all: 'Tout', hover: 'Survolez le graphique.',
      cmp: '{c} face aux autres pays', cmpHow: 'Dernière donnée de chaque pays, avec le type et le stade de vente publiés. Au-delà de deux mois, la donnée est en gris.', old: 'donnée ancienne', noEu: 'La Commission européenne ne publie pas de prix hebdomadaire pour ce produit.',
      perc: 'Ce que touche l’agriculteur en Espagne (MAPA)', percNow: 'Prix perçu, {m}', percY: 'Même mois un an plus tôt', percOld: 'Le MAPA a cessé de publier cette série : la dernière donnée date de {m}.', percHow: 'Prix mensuel moyen reçu par les agriculteurs, selon le ministère de l’Agriculture. C’est une autre source et un autre stade de vente que le prix hebdomadaire ci-dessus : les deux ne se comparent pas.', chP: 'Prix perçu par l’agriculteur (mensuel)',
      sea: 'Prix moyen de chaque mois, {a}–{b}', seaHow: 'C’est la saisonnalité : la barre foncée est le mois en cours.',
      crop: 'Où on le cultive en Espagne (campagne {y})', area: 'Surface', prod: 'Production', yld: 'Rendement moyen', prev: 'Campagne précédente', fresh: 'Pour le marché du frais', ind: 'Pour l’industrie (sauce, concentré, jus)', glass: 'De la tomate de table, sous serre', top: 'Les provinces qui produisent le plus', share: 'du total', prov: 'provisoire', provNote: 'Les données du MAPA pour la campagne {y} sont provisoires.',
      all2: 'Tous les fruits et légumes', allTxt: 'Voir les prix de tous les fruits, légumes et fruits à coque', cat: 'Chercher d’autres séries dans le catalogue',
      src: 'Sources :', sEU: 'Commission européenne, portail de données agroalimentaires', sMAPA: 'MAPA, prix perçus', sCrop: 'MAPA, surfaces et productions annuelles', t1000: 'milliers de t', t: 't', ha: 'ha', none: 'Pas de données pour ce produit.' },
    it: { sub: 'Prezzo settimanale all’origine, quanto incassa l’agricoltore e dove si coltiva in Spagna, con dati ufficiali.', ctry: 'Paese',
      now: 'Prezzo di questa settimana', nowWk: '{p} in {c} ({v}, {s}), settimana del {d}', perKg: '€/kg', w1: 'Settimana precedente', y1: 'Un anno fa', last: 'Ultimo dato pubblicato: {d}. È un prodotto stagionale o il paese pubblica poco; fuori stagione non c’è quotazione.',
      nowHow: 'Uscita magazzino: quanto incassa il centro di confezionamento o la cooperativa vendendo il prodotto selezionato e confezionato, IVA esclusa. In azienda: quanto riceve il produttore prima di questa preparazione. Acquisto del dettagliante: quanto paga il negozio. La Commissione europea li pubblica ogni settimana con i dati di ogni paese.',
      chE: 'Prezzo settimanale in {c} per tipo', from: 'Dal', all: 'Tutto', hover: 'Passa il cursore sul grafico.',
      cmp: '{c} rispetto agli altri paesi', cmpHow: 'Ultimo dato di ogni paese, con il tipo e la fase di vendita pubblicati. Oltre i due mesi il dato è in grigio.', old: 'dato vecchio', noEu: 'La Commissione europea non pubblica un prezzo settimanale per questo prodotto.',
      perc: 'Quanto incassa l’agricoltore in Spagna (MAPA)', percNow: 'Prezzo percepito, {m}', percY: 'Stesso mese dell’anno prima', percOld: 'Il MAPA ha smesso di pubblicare questa serie: l’ultimo dato è di {m}.', percHow: 'Prezzo medio mensile che ricevono gli agricoltori, secondo il Ministero dell’Agricoltura. È un’altra fonte e un’altra fase di vendita rispetto al prezzo settimanale qui sopra: i due non vanno confrontati.', chP: 'Prezzo percepito dall’agricoltore (mensile)',
      sea: 'Prezzo medio di ogni mese, {a}–{b}', seaHow: 'Ecco la stagionalità: la barra scura è il mese in corso.',
      crop: 'Dove si coltiva in Spagna (campagna {y})', area: 'Superficie', prod: 'Produzione', yld: 'Resa media', prev: 'Campagna precedente', fresh: 'Per il consumo fresco', ind: 'Per l’industria (salsa, concentrato, succo)', glass: 'Del pomodoro da mensa, in serra', top: 'Le province che producono di più', share: 'del totale', prov: 'provvisorio', provNote: 'I dati del MAPA per la campagna {y} sono provvisori.',
      all2: 'Tutta la frutta e la verdura', allTxt: 'Vedi i prezzi di tutta la frutta, la verdura e la frutta secca', cat: 'Cerca altre serie nel catalogo',
      src: 'Fonti:', sEU: 'Commissione europea, portale dei dati agroalimentari', sMAPA: 'MAPA, prezzi percepiti', sCrop: 'MAPA, superfici e produzioni annuali', t1000: 'migliaia di t', t: 't', ha: 'ha', none: 'Nessun dato per questo prodotto.' }
  };
  var DAY = 864e5, E0 = Date.UTC(2000, 0, 1);
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function get(f) { return fetch(f).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function iso(d) { return new Date(E0 + d * DAY).toISOString().slice(0, 10); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function cname(c, lg) { return (CN[c] || [c])[LI[lg]] || c; }
  function vname(v, lg) { return VAR[v] ? VAR[v][LI[lg]] : v; }
  function sname(s, lg) { return STG[s] ? STG[s][LI[lg]] : s; }
  function mk(lg) {
    var L = LOC[lg];
    return {
      n: function (v, d) { return v == null || !isFinite(v) ? '—' : v.toLocaleString(L, { minimumFractionDigits: d, maximumFractionDigits: d }); },
      day: function (s) { return new Date(s + 'T12:00:00Z').toLocaleDateString(L, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); },
      mon: function (s) { return new Date(s + '-15T12:00:00Z').toLocaleDateString(L, { month: 'long', year: 'numeric', timeZone: 'UTC' }); },
      mshort: function (m) { return new Date(Date.UTC(2020, m, 15)).toLocaleDateString(L, { month: 'short', timeZone: 'UTC' }); }
    };
  }
  function pct(a, b, F) { if (a == null || b == null || !b) return ''; var p = (a / b - 1) * 100; return ' (' + (p > 0 ? '+' : p < 0 ? '−' : '') + F.n(Math.abs(p), 0) + ' %)'; }
  function pts(doc, cc) { if (!doc) return []; var r = doc.regions.filter(function (x) { return x.c === cc; })[0]; return r ? r.d.map(function (d, i) { return [iso(d), r.v[i] / 100]; }) : []; }
  function near(P, isoD, maxDays) { var t = Date.parse(isoD), b = null, bd = 1e15; P.forEach(function (p) { var dd = Math.abs(Date.parse(p[0]) - t); if (dd < bd) { bd = dd; b = p; } }); return bd <= maxDays * DAY ? b : null; }
  function dec(v) { return v != null && v < 10 ? 2 : 1; }
  // Gráfica de líneas con selector «Desde»: S = [{P:[[iso,v]], cls, lab}]
  function chart(S, from, t, F, cls, title, unit, sel) {
    S = S.map(function (s) { return { P: s.P.filter(function (p) { return +p[0].slice(0, 4) >= from; }), cls: s.cls, lab: s.lab }; }).filter(function (s) { return s.P.length > 1; });
    if (!S.length) return { html: '' };
    var W = 560, H = 220, L = 40, R = 8, Tp = 10, B = 24, t0 = 1e15, t1 = 0, hi = 0, v;
    S.forEach(function (s) { s.P.forEach(function (p) { var x = Date.parse(p[0]); t0 = Math.min(t0, x); t1 = Math.max(t1, x); hi = Math.max(hi, p[1]); }); });
    var step = hi > 16 ? 5 : hi > 8 ? 2 : hi > 4 ? 1 : hi > 2 ? 0.5 : hi > 1 ? 0.25 : 0.2; hi = Math.ceil(hi / step) * step || step;
    var X = function (s) { return L + (Date.parse(s) - t0) / Math.max(1, t1 - t0) * (W - L - R); }, Y = function (q) { return Tp + (hi - q) / hi * (H - Tp - B); }, g = '';
    for (v = 0; v <= hi + 1e-9; v += step) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + F.n(v, step < 1 ? 2 : 0) + '</text>';
    var y0 = new Date(t0).getUTCFullYear(), y1 = new Date(t1).getUTCFullYear(), ev = y1 - y0 > 20 ? 5 : y1 - y0 > 8 ? 2 : 1;
    for (var yy = y0 + 1; yy <= y1; yy++) if (yy % ev === 0) { var xx = X(yy + '-01-01'); g += '<line class="wp-grid wp-grid-v" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '"/><text class="wp-tick" x="' + xx.toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + yy + '</text>'; }
    var paths = S.slice().reverse().map(function (s) { return '<path class="wp-line wp-line-' + s.cls + '" d="' + s.P.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join('') + '"/>'; }).join('');
    var fs = sel ? '<div class="wd-sels"><label class="wp-sel"><span>' + esc(t.from) + '</span><select class="di-compare-select vg-from" aria-label="' + esc(t.from) + '">' + sel.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === from ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label></div>' : '';
    return { S: S, X: X, W: W, cls: cls, html: '<div class="di-info-card-title gb-sub">' + esc(title) + '</div>' + fs + '<div class="wp-chart ' + cls + '"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(title) + '">' + g + paths +
      '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg><div class="wp-legend">' + (S.length > 1 ? S.map(function (s) { return '<span><i class="wp-sw wp-sw-' + s.cls + '"></i>' + esc(s.lab) + '</span>'; }).join('') : '') + '<span class="wp-unit">' + esc(unit) + '</span></div></div>' };
  }
  function bind(el, c, t, F, monthly) {
    if (!c.S) return; var box = el.querySelector('.' + c.cls); if (!box) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross');
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, base = c.S[0].P, b = 0, bd = 1e9;
      for (var k = 0; k < base.length; k++) { var dd = Math.abs(c.X(base[k][0]) - vx); if (dd < bd) { bd = dd; b = k; } }
      var d = base[b][0], px = c.X(d); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + esc(monthly ? F.mon(d.slice(0, 7)) : F.day(d)) + '</b>' + c.S.map(function (s, i) { var p = near(s.P, d, monthly ? 20 : 4); return p ? ' · ' + (c.S.length > 1 ? esc(s.lab) + ' ' : '') + (i ? '' : '<b>') + F.n(p[1], 2) + ' €/kg' + (i ? '' : '</b>') : ''; }).join('');
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  var DOC = null, FILES = {};
  function load() { return DOC || (DOC = get('data/fv-products.json')); }
  function file(f) { return FILES[f] || (FILES[f] = get(f)); }
  var ST = { from: 2021, cc: null };
  function mount(el, pid, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es'; ST.lg = lg; ST.pid = pid;
    return load().then(function (DD) {
      var P = DD && DD.products.filter(function (x) { return x.id === pid; })[0]; if (!P) return false;
      var EU = P.eu || null, lat = EU ? EU.latest : {}, ccs = Object.keys(lat).sort(function (a, b) { return cname(a, lg).localeCompare(cname(b, lg), LOC[lg]); });
      var q = new URLSearchParams(location.search), cc = ST.cc || (q.get('c') || '').toUpperCase();
      if (!lat[cc]) cc = lat.ES ? 'ES' : ccs[0];
      ST.cc = cc;
      // series del país elegido: la de referencia y hasta dos tipos más con la misma fase de venta
      var ref = cc && lat[cc], want = [];
      if (ref) { want.push(ref.series); EU.series.forEach(function (s) { if (s.stage === ref.stage && s.id !== ref.series && want.length < 6) want.push(s.id); }); }
      var cropsF = P.crops ? 'data/spain-crops/crops-' + P.crops.group + '.json' : null;
      return Promise.all(want.map(function (id) { return file('data/eu/fruta/' + id + '.json'); }).concat([P.perc ? file(P.perc.file) : null, cropsF ? file(cropsF) : null])).then(function (a) {
        var t = T[lg], F = mk(lg), nm = P.name[lg] || P.name.es, h = '', binds = [], cN = cc ? cname(cc, lg) : '';
        var docs = a.slice(0, want.length), pf = a[want.length], CR = a[want.length + 1];
        // 1) precio semanal y comparación entre países
        if (ref) {
          var series = docs.map(function (d, i) { return { d: d, meta: EU.series.filter(function (s) { return s.id === want[i]; })[0] }; }).filter(function (x) { return x.d && x.meta; })
            .map(function (x) { return { P: pts(x.d, cc), lab: vname(x.meta.variant, lg) }; }).filter(function (x) { return x.P.length > 1; });
          series = series.slice(0, 1).concat(series.slice(1).sort(function (x, y) { return y.P.length - x.P.length; }).slice(0, 2));
          var R = series.length ? series[0].P : [], x = R.length ? R[R.length - 1] : null, w = R.length > 1 ? R[R.length - 2] : null, y = x ? near(R, new Date(Date.parse(x[0]) - 364 * DAY).toISOString().slice(0, 10), 10) : null;
          var stale = x && Date.now() - Date.parse(x[0]) > 42 * DAY;
          var sel = '<label class="vg-csel"><span>' + esc(t.ctry) + '</span><select class="di-compare-select vg-cc" aria-label="' + esc(t.ctry) + '">' + ccs.map(function (c) { return '<option value="' + c + '"' + (c === cc ? ' selected' : '') + '>' + esc(cname(c, lg)) + '</option>'; }).join('') + '</select></label>';
          h += '<section class="di-card ps-rm wp-card gb-card vg-card"><div class="vg-hrow"><h2 class="ps-rm-h">' + esc(t.now) + '</h2>' + sel + '</div>';
          if (x) {
            h += '<div class="di-info-stat-list" style="max-width:680px">' + row(t.nowWk.replace('{p}', nm).replace('{c}', cN).replace('{v}', vname(ref.variant, lg)).replace('{s}', sname(ref.stage, lg)).replace('{d}', F.day(x[0])), '<b>' + F.n(x[1], 2) + ' ' + t.perKg + '</b>') +
              (w ? row(t.w1, F.n(w[1], 2) + ' ' + t.perKg + pct(x[1], w[1], F)) : '') + (y ? row(t.y1, F.n(y[1], 2) + ' ' + t.perKg + pct(x[1], y[1], F)) : '') + '</div>' +
              (stale ? '<p class="sw-warn" style="margin:8px 0 0">' + esc(t.last.replace('{d}', F.day(x[0]))) + '</p>' : '');
          }
          h += '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.nowHow) + '</p>';
          var ec = chart(series.map(function (s, i) { return { P: s.P, cls: ['t', 'r', 'w'][i], lab: s.lab }; }), ST.from, t, F, 'vg-ech', t.chE.replace('{c}', cN), '€/kg', [[2005, t.all], [2021, '2021'], [2024, '2024']]);
          h += ec.html; binds.push([ec, false]);
          var cmp = ccs.map(function (c) { return { c: c, x: lat[c] }; }).sort(function (a2, b2) { return b2.x.v - a2.x.v; }), mx = Math.max.apply(null, cmp.map(function (q2) { return q2.x.v; }).concat([0.01]));
          if (cmp.length > 1) h += '<div class="di-info-card-title gb-sub">' + esc(t.cmp.replace('{c}', cN)) + '</div><p class="di-field-hint" style="margin:0 0 6px">' + esc(t.cmpHow) + '</p><div class="vg-bars">' + cmp.map(function (q2) {
            var old = Date.now() - Date.parse(q2.x.d) > 60 * DAY;
            return '<div class="vg-br' + (q2.c === cc ? ' vg-es' : '') + (old ? ' vg-old' : '') + '"><span class="vg-bl">' + esc(cname(q2.c, lg)) + '</span><span class="vg-bt"><i style="width:' + (q2.x.v / mx * 100).toFixed(1) + '%"></i></span><span class="vg-bv">' + F.n(q2.x.v, 2) + ' €/kg <small>' + esc(vname(q2.x.variant, lg) + ', ' + sname(q2.x.stage, lg) + ' · ' + F.day(q2.x.d)) + (old ? ' · ' + t.old : '') + '</small></span></div>';
          }).join('') + '</div>';
          h += '</section>';
        } else h += '<section class="di-card ps-rm vg-card"><p class="di-movers-hint" style="margin:0">' + esc(t.noEu) + '</p></section>';
        // 2) precio percibido (MAPA) y estacionalidad
        var perc = pf && pf.series && P.perc ? pf.series.filter(function (s) { return s.id === P.perc.id; })[0] : null;
        if (perc && perc.points && perc.points.length > 24) {
          var PP = perc.points.map(function (q2) { return [q2[0] + '-15', q2[1] / 100]; }), lp = PP[PP.length - 1], ly = near(PP, (+lp[0].slice(0, 4) - 1) + lp[0].slice(4), 5);
          var lastY = +lp[0].slice(0, 4), ya = lastY - 10, yb = lastY - 1, acc = [], m;
          for (m = 0; m < 12; m++) acc.push([0, 0]);
          PP.forEach(function (q2) { var yy = +q2[0].slice(0, 4); if (yy >= ya && yy <= yb) { var mm = +q2[0].slice(5, 7) - 1; acc[mm][0] += q2[1]; acc[mm][1]++; } });
          var avg = acc.map(function (a2) { return a2[1] ? a2[0] / a2[1] : null; }), am = Math.max.apply(null, avg.filter(function (q2) { return q2 != null; }).concat([0.01])), cm = new Date().getUTCMonth(), dead = Date.now() - Date.parse(lp[0]) > 400 * DAY;
          var sea = avg.filter(function (q2) { return q2 != null; }).length >= 6 ? '<div class="di-info-card-title gb-sub">' + esc(t.sea.replace('{a}', ya).replace('{b}', yb)) + '</div><p class="di-field-hint" style="margin:0 0 6px">' + esc(t.seaHow) + '</p><div class="vg-sea" role="img" aria-label="' + esc(t.sea.replace('{a}', ya).replace('{b}', yb)) + '">' +
            avg.map(function (q2, k) { return '<span title="' + esc(F.mshort(k) + ': ' + (q2 == null ? '—' : F.n(q2, 2) + ' €/kg')) + '"><b>' + (q2 == null ? '' : F.n(q2, dec(q2))) + '</b><i class="' + (k === cm && !dead ? 'vg-cur' : '') + '" style="height:' + Math.max(q2 == null ? 0 : 2, (q2 || 0) / am * 90).toFixed(0) + 'px"></i><small>' + esc(F.mshort(k)) + '</small></span>'; }).join('') + '</div>' : '';
          var pc = chart([{ P: PP, cls: 't', lab: '' }], 1990, t, F, 'vg-pch', t.chP, '€/kg', null);
          h += '<section class="di-card ps-rm wp-card gb-card vg-card"><h2 class="ps-rm-h">' + esc(t.perc) + '</h2><div class="di-info-stat-list" style="max-width:640px">' + row(t.percNow.replace('{m}', F.mon(lp[0].slice(0, 7))), '<b>' + F.n(lp[1], 2) + ' ' + t.perKg + '</b>') + (ly ? row(t.percY, F.n(ly[1], 2) + ' ' + t.perKg + pct(lp[1], ly[1], F)) : '') + '</div>' +
            (dead ? '<p class="sw-warn" style="margin:8px 0 0">' + esc(t.percOld.replace('{m}', F.mon(lp[0].slice(0, 7)))) + '</p>' : '') +
            '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.percHow) + '</p>' + sea + pc.html + '</section>';
          binds.push([pc, true]);
        }
        // 3) dónde se cultiva (MAPA, por provincia)
        if (CR && CR.campaigns && P.crops) {
          var camps = Object.keys(CR.campaigns).sort(), cy = camps[camps.length - 1], cp = camps.length > 1 ? camps[camps.length - 2] : null, ex = P.crops.extra || {};
          var find = function (camp, code) { return camp && code && CR.campaigns[camp] ? CR.campaigns[camp].crops.filter(function (q2) { return q2.c === code; })[0] : null; };
          var tot = find(cy, P.crops.code), totP = find(cp, P.crops.code), fr = find(cy, ex.fresh), ind = find(cy, ex.ind), gl = find(cy, ex.glass);
          if (tot && tot.t[4]) {
            var prodT = tot.t[4], areaT = tot.t[0], yl = tot.t[3] ? prodT / tot.t[3] : null, provis = CR.campaigns[cy].status === 'provisional', big = prodT >= 100000;
            var fmtP = function (v) { return big ? F.n(v / 1000, 0) + ' ' + t.t1000 : F.n(v, 0) + ' ' + t.t; };
            var top = Object.keys(tot.v).filter(function (k) { return tot.v[k] && tot.v[k][4]; }).sort(function (a2, b2) { return tot.v[b2][4] - tot.v[a2][4]; }).slice(0, 10), tm = top.length ? tot.v[top[0]][4] : 1;
            h += '<section class="di-card ps-rm wp-card gb-card vg-card"><h2 class="ps-rm-h">' + esc(t.crop.replace('{y}', cy)) + (provis ? ' <small class="vg-prov">' + esc(t.prov) + '</small>' : '') + '</h2><div class="di-info-stat-list" style="max-width:640px">' +
              row(t.prod, '<b>' + fmtP(prodT) + '</b>' + (totP && totP.t[4] ? ' · ' + esc(t.prev) + ' ' + cp + ': ' + fmtP(totP.t[4]) + pct(prodT, totP.t[4], F) : '')) +
              (areaT ? row(t.area, F.n(areaT, 0) + ' ' + t.ha + (totP && totP.t[0] ? pct(areaT, totP.t[0], F) : '')) : '') + (yl ? row(t.yld, F.n(yl, yl < 10 ? 1 : 0) + ' t/ha') : '') +
              (fr && fr.t[4] ? row(t.fresh, F.n(fr.t[4] / prodT * 100, 0) + ' %') : '') + (ind && ind.t[4] ? row(t.ind, F.n(ind.t[4] / prodT * 100, 0) + ' %') : '') + (gl && gl.t[4] && fr && fr.t[4] ? row(t.glass, F.n(gl.t[4] / fr.t[4] * 100, 0) + ' %') : '') + '</div>' +
              (top.length ? '<div class="di-info-card-title gb-sub">' + esc(t.top) + '</div><div class="vg-bars">' + top.map(function (k) { var v = tot.v[k][4]; return '<div class="vg-br"><span class="vg-bl">' + esc(CR.provinces[k] || k) + '</span><span class="vg-bt"><i style="width:' + (v / tm * 100).toFixed(1) + '%"></i></span><span class="vg-bv">' + fmtP(v) + ' <small>' + F.n(v / prodT * 100, 0) + ' % ' + esc(t.share) + '</small></span></div>'; }).join('') + '</div>' : '') +
              (provis ? '<p class="di-field-hint" style="margin:6px 0 0">' + esc(t.provNote.replace('{y}', cy)) + '</p>' : '') + '</section>';
          }
        }
        h += '<section class="di-card ps-rm vg-card"><p style="margin:0 0 6px"><a href="precios.html?tab=hortalizas">' + esc(t.allTxt) + '</a> · <a href="catalogo.html?q=' + encodeURIComponent(P.name.es) + '">' + esc(t.cat) + '</a></p>' +
          '<p class="di-field-hint" style="margin:10px 0 0">' + esc(t.src) + ' <a href="https://agridata.ec.europa.eu/" target="_blank" rel="noopener noreferrer">' + esc(t.sEU) + '</a>' + (P.perc ? '; <a href="https://servicio.mapa.gob.es/ckan/dataset/esmapaindicespreciospreciopercibido" target="_blank" rel="noopener noreferrer">' + esc(t.sMAPA) + '</a>' : '') + (P.crops ? '; <a href="https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/agricultura/superficies-producciones-anuales-cultivos/" target="_blank" rel="noopener noreferrer">' + esc(t.sCrop) + '</a>' : '') + '</p></section>';
        el.innerHTML = h;
        var h1 = document.getElementById('pg-h1'), sb = document.getElementById('pg-sub'); if (h1) h1.textContent = (P.emoji ? P.emoji + ' ' : '') + nm; if (sb) sb.textContent = t.sub; document.title = nm + ' | Dehesa Index';
        binds.forEach(function (b) { bind(el, b[0], t, F, b[1]); });
        if (!el.getAttribute('data-vg')) {
          el.setAttribute('data-vg', '1');
          el.addEventListener('change', function (ev) {
            var cl = ev.target.className || '';
            if (cl.indexOf('vg-from') >= 0) { ST.from = parseInt(ev.target.value, 10); mount(el, ST.pid, ST.lg).then(function () { var f = el.querySelector('.vg-from'); if (f) f.focus(); }); }
            if (cl.indexOf('vg-cc') >= 0) { ST.cc = ev.target.value; try { var u = new URL(location.href); u.searchParams.set('c', ST.cc); history.replaceState(null, '', u.toString()); } catch (e) {} mount(el, ST.pid, ST.lg).then(function () { var f = el.querySelector('.vg-cc'); if (f) f.focus(); }); }
          });
        }
        return true;
      });
    });
  }
  global.DIVeg = { load: load, mount: mount, has: function (p) { return load().then(function (d) { return !!(d && d.products.some(function (x) { return x.id === p; })); }); } };
})(window);
