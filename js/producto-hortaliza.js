/* Dehesa Index — Ficha de hortaliza (12-oct-2026; empieza por el tomate, a petición de Mario: «¿por qué no tenemos datos de los tomates?»).
   Junta lo que ya había repartido por la web y no se encontraba:
   1) precio semanal en origen por tipo y por país (Comisión Europea, portal agroalimentario; data/eu/fruta/<id>.json, días desde 2000-01-01);
   2) precio percibido por el agricultor en España, mensual desde 1990 (MAPA; data/series/ES/prices_fv-2.json), y su estacionalidad;
   3) superficie y producción por provincia de las dos últimas campañas (MAPA, Superficies y producciones anuales; data/spain-crops/crops-hortalizas.json).
   Cada bloque sale solo si hay dato. Precios en €/kg (los ficheros traen €/100 kg). ES5, sin librerías. Uso: DIVeg.has(p), DIVeg.mount(el, p, lang). */
(function (global) {
  'use strict';
  var CFG = {
    tomate: {
      name: { es: 'Tomate', en: 'Tomato', fr: 'Tomate', it: 'Pomodoro' },
      eu: { round: 'tomatoes-round', truss: 'tomatoes-trusses-vine-grappes', cherry: 'tomatoes-cherry-special' },
      perc: { file: 'data/series/ES/prices_fv-2.json', id: 'es-perc-tomate' },
      crops: { file: 'data/spain-crops/crops-hortalizas.json', tot: 'HO2500', fresh: 'HO2510', ind: 'HO2520', glass: 'HO2512', open: 'HO2511' },
      tag: 'tomato'
    }
  };
  var CN = { AT: ['Austria', 'Austria', 'Autriche', 'Austria'], BE: ['Bélgica', 'Belgium', 'Belgique', 'Belgio'], BG: ['Bulgaria', 'Bulgaria', 'Bulgarie', 'Bulgaria'], CY: ['Chipre', 'Cyprus', 'Chypre', 'Cipro'], CZ: ['Chequia', 'Czechia', 'Tchéquie', 'Cechia'], DE: ['Alemania', 'Germany', 'Allemagne', 'Germania'], DK: ['Dinamarca', 'Denmark', 'Danemark', 'Danimarca'], EL: ['Grecia', 'Greece', 'Grèce', 'Grecia'], ES: ['España', 'Spain', 'Espagne', 'Spagna'], FR: ['Francia', 'France', 'France', 'Francia'], HR: ['Croacia', 'Croatia', 'Croatie', 'Croazia'], HU: ['Hungría', 'Hungary', 'Hongrie', 'Ungheria'], IT: ['Italia', 'Italy', 'Italie', 'Italia'], LT: ['Lituania', 'Lithuania', 'Lituanie', 'Lituania'], NL: ['Países Bajos', 'Netherlands', 'Pays-Bas', 'Paesi Bassi'], PL: ['Polonia', 'Poland', 'Pologne', 'Polonia'], PT: ['Portugal', 'Portugal', 'Portugal', 'Portogallo'], RO: ['Rumanía', 'Romania', 'Roumanie', 'Romania'], SI: ['Eslovenia', 'Slovenia', 'Slovénie', 'Slovenia'], SK: ['Eslovaquia', 'Slovakia', 'Slovaquie', 'Slovacchia'] };
  var LI = { es: 0, en: 1, fr: 2, it: 3 }, LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
  var T = {
    es: { sub: 'Lo que cobra quien lo vende en origen, lo que cobra el agricultor y dónde se cultiva en España, con datos oficiales.',
      now: 'Precio en origen esta semana', nowWk: 'Tomate redondo en España, semana del {d}', perKg: '€/kg', w1: 'Hace una semana', y1: 'Hace un año', truss: 'Tomate en rama, misma semana', cherry: 'Tomate cereza, misma semana', farm: 'Precio en finca (redondo), semana del {d}',
      nowHow: 'Precio en origen: lo que cobra el almacén o la cooperativa al vender el tomate ya clasificado y envasado, sin IVA. El precio en finca es lo que recibe el agricultor antes de esa preparación. Los publica cada semana la Comisión Europea con datos de cada país.',
      chE: 'Precio en origen en España por tipo (semanal)', from: 'Desde', all: 'Todo', lR: 'Redondo', lT: 'En rama', lC: 'Cereza', hover: 'Pasa el cursor por la gráfica.',
      cmp: 'España frente a otros países (tomate redondo, precio en origen)', cmpHow: 'Último dato de cada país. Algunos países publican poco o han dejado de hacerlo: si el dato tiene más de dos meses sale en gris.', old: 'dato antiguo',
      perc: 'Lo que cobra el agricultor en España (MAPA)', percNow: 'Precio percibido, {m}', percY: 'Mismo mes del año anterior', percHow: 'Precio medio mensual que reciben los agricultores por el tomate, según el Ministerio de Agricultura. Cambia mucho según la época del año: en verano hay mucho tomate de campo y el precio baja. Es otra fuente y otra fase de venta que el precio en origen de arriba, así que no se deben comparar entre sí.', chP: 'Precio percibido por el agricultor (mensual, desde 1990)',
      sea: 'Precio medio de cada mes, {a}–{b}', seaHow: 'Así se ve la estacionalidad: la barra oscura es el mes actual.',
      crop: 'Dónde se cultiva en España (campaña {y})', area: 'Superficie', prod: 'Producción', yld: 'Rendimiento medio', prev: 'Campaña anterior', fresh: 'Para consumo en fresco', ind: 'Para industria (tomate frito, concentrado, zumo)', glass: 'Del tomate de mesa, en invernadero', top: 'Las 10 provincias que más producen', share: 'del total', prov: 'provisional', provNote: 'Datos de la campaña {y} provisionales del MAPA.',
      more: 'Más series de tomate', moreTxt: 'Ver todas las series de tomate de todos los países en el catálogo (EE. UU., Francia, Italia, Alemania, Países Bajos, Polonia, Portugal…)',
      src: 'Fuentes:', sEU: 'Comisión Europea, portal de datos agroalimentarios (precios de frutas y hortalizas)', sMAPA: 'MAPA, precios percibidos', sCrop: 'MAPA, superficies y producciones anuales de cultivos', t1000: 'mil t', ha: 'ha', none: 'Sin datos de este producto.' },
    en: { sub: 'What sellers get at origin, what farmers get and where it is grown in Spain, from official data.',
      now: 'Price at origin this week', nowWk: 'Round tomatoes in Spain, week of {d}', perKg: '€/kg', w1: 'A week ago', y1: 'A year ago', truss: 'Vine (truss) tomatoes, same week', cherry: 'Cherry tomatoes, same week', farm: 'Farm-gate price (round), week of {d}',
      nowHow: 'Price at origin: what the packing house or co-op gets when it sells the tomatoes graded and packed, before VAT. The farm-gate price is what the grower receives before that preparation. The European Commission publishes both every week with data from each country.',
      chE: 'Price at origin in Spain by type (weekly)', from: 'From', all: 'All', lR: 'Round', lT: 'Vine', lC: 'Cherry', hover: 'Hover over the chart.',
      cmp: 'Spain against other countries (round tomatoes, price at origin)', cmpHow: 'Latest figure for each country. Some countries report rarely or have stopped: figures older than two months are greyed out.', old: 'old figure',
      perc: 'What farmers get in Spain (MAPA)', percNow: 'Price received, {m}', percY: 'Same month a year earlier', percHow: 'Average monthly price farmers receive for tomatoes, according to the Ministry of Agriculture. It swings a lot with the season: in summer there are plenty of field tomatoes and the price falls. It comes from a different source and a different stage of sale than the price at origin above, so the two should not be compared.', chP: 'Price received by farmers (monthly, since 1990)',
      sea: 'Average price for each month, {a}–{b}', seaHow: 'This shows the seasonality: the dark bar is the current month.',
      crop: 'Where it is grown in Spain ({y} season)', area: 'Area', prod: 'Production', yld: 'Average yield', prev: 'Previous season', fresh: 'For fresh consumption', ind: 'For processing (sauce, paste, juice)', glass: 'Of fresh tomatoes, grown under glass or plastic', top: 'The 10 provinces that produce the most', share: 'of total', prov: 'provisional', provNote: 'MAPA figures for the {y} season are provisional.',
      more: 'More tomato series', moreTxt: 'See every tomato series from all countries in the catalogue (US, France, Italy, Germany, Netherlands, Poland, Portugal…)',
      src: 'Sources:', sEU: 'European Commission, agri-food data portal (fruit and vegetable prices)', sMAPA: 'MAPA, prices received', sCrop: 'MAPA, annual crop areas and production', t1000: 'thousand t', ha: 'ha', none: 'No data for this product.' },
    fr: { sub: 'Ce que touche le vendeur à l’origine, ce que touche l’agriculteur et où on le cultive en Espagne, avec des données officielles.',
      now: 'Prix à l’origine cette semaine', nowWk: 'Tomate ronde en Espagne, semaine du {d}', perKg: '€/kg', w1: 'Il y a une semaine', y1: 'Il y a un an', truss: 'Tomate en grappe, même semaine', cherry: 'Tomate cerise, même semaine', farm: 'Prix à la ferme (ronde), semaine du {d}',
      nowHow: 'Prix à l’origine : ce que touche la station de conditionnement ou la coopérative en vendant la tomate triée et emballée, hors TVA. Le prix à la ferme est ce que reçoit le producteur avant cette préparation. La Commission européenne les publie chaque semaine avec les données de chaque pays.',
      chE: 'Prix à l’origine en Espagne par type (hebdomadaire)', from: 'Depuis', all: 'Tout', lR: 'Ronde', lT: 'Grappe', lC: 'Cerise', hover: 'Survolez le graphique.',
      cmp: 'L’Espagne face aux autres pays (tomate ronde, prix à l’origine)', cmpHow: 'Dernière donnée de chaque pays. Certains pays publient peu ou ont arrêté : au-delà de deux mois, la donnée est en gris.', old: 'donnée ancienne',
      perc: 'Ce que touche l’agriculteur en Espagne (MAPA)', percNow: 'Prix perçu, {m}', percY: 'Même mois un an plus tôt', percHow: 'Prix mensuel moyen reçu par les agriculteurs pour la tomate, selon le ministère de l’Agriculture. Il varie beaucoup selon la saison : l’été, il y a beaucoup de tomate de plein champ et le prix baisse. C’est une autre source et un autre stade de vente que le prix à l’origine ci-dessus : les deux ne se comparent pas.', chP: 'Prix perçu par l’agriculteur (mensuel, depuis 1990)',
      sea: 'Prix moyen de chaque mois, {a}–{b}', seaHow: 'C’est la saisonnalité : la barre foncée est le mois en cours.',
      crop: 'Où on la cultive en Espagne (campagne {y})', area: 'Surface', prod: 'Production', yld: 'Rendement moyen', prev: 'Campagne précédente', fresh: 'Pour le marché du frais', ind: 'Pour l’industrie (sauce, concentré, jus)', glass: 'De la tomate de table, sous serre', top: 'Les 10 provinces qui produisent le plus', share: 'du total', prov: 'provisoire', provNote: 'Les données du MAPA pour la campagne {y} sont provisoires.',
      more: 'Plus de séries de tomate', moreTxt: 'Voir toutes les séries de tomate de tous les pays dans le catalogue (États-Unis, France, Italie, Allemagne, Pays-Bas, Pologne, Portugal…)',
      src: 'Sources :', sEU: 'Commission européenne, portail de données agroalimentaires (prix des fruits et légumes)', sMAPA: 'MAPA, prix perçus', sCrop: 'MAPA, surfaces et productions annuelles', t1000: 'milliers de t', ha: 'ha', none: 'Pas de données pour ce produit.' },
    it: { sub: 'Quanto incassa chi vende all’origine, quanto incassa l’agricoltore e dove si coltiva in Spagna, con dati ufficiali.',
      now: 'Prezzo all’origine questa settimana', nowWk: 'Pomodoro tondo in Spagna, settimana del {d}', perKg: '€/kg', w1: 'Una settimana fa', y1: 'Un anno fa', truss: 'Pomodoro a grappolo, stessa settimana', cherry: 'Pomodoro ciliegino, stessa settimana', farm: 'Prezzo in azienda (tondo), settimana del {d}',
      nowHow: 'Prezzo all’origine: quanto incassa il centro di confezionamento o la cooperativa vendendo il pomodoro selezionato e confezionato, IVA esclusa. Il prezzo in azienda è quanto riceve il produttore prima di questa preparazione. La Commissione europea li pubblica ogni settimana con i dati di ogni paese.',
      chE: 'Prezzo all’origine in Spagna per tipo (settimanale)', from: 'Dal', all: 'Tutto', lR: 'Tondo', lT: 'Grappolo', lC: 'Ciliegino', hover: 'Passa il cursore sul grafico.',
      cmp: 'La Spagna rispetto agli altri paesi (pomodoro tondo, prezzo all’origine)', cmpHow: 'Ultimo dato di ogni paese. Alcuni paesi pubblicano poco o hanno smesso: oltre i due mesi il dato è in grigio.', old: 'dato vecchio',
      perc: 'Quanto incassa l’agricoltore in Spagna (MAPA)', percNow: 'Prezzo percepito, {m}', percY: 'Stesso mese dell’anno prima', percHow: 'Prezzo medio mensile che ricevono gli agricoltori per il pomodoro, secondo il Ministero dell’Agricoltura. Cambia molto con la stagione: d’estate c’è molto pomodoro di pieno campo e il prezzo scende. È un’altra fonte e un’altra fase di vendita rispetto al prezzo all’origine qui sopra: i due non vanno confrontati.', chP: 'Prezzo percepito dall’agricoltore (mensile, dal 1990)',
      sea: 'Prezzo medio di ogni mese, {a}–{b}', seaHow: 'Ecco la stagionalità: la barra scura è il mese in corso.',
      crop: 'Dove si coltiva in Spagna (campagna {y})', area: 'Superficie', prod: 'Produzione', yld: 'Resa media', prev: 'Campagna precedente', fresh: 'Per il consumo fresco', ind: 'Per l’industria (salsa, concentrato, succo)', glass: 'Del pomodoro da mensa, in serra', top: 'Le 10 province che producono di più', share: 'del totale', prov: 'provvisorio', provNote: 'I dati del MAPA per la campagna {y} sono provvisori.',
      more: 'Altre serie sul pomodoro', moreTxt: 'Vedi tutte le serie sul pomodoro di tutti i paesi nel catalogo (USA, Francia, Italia, Germania, Paesi Bassi, Polonia, Portogallo…)',
      src: 'Fonti:', sEU: 'Commissione europea, portale dei dati agroalimentari (prezzi di frutta e ortaggi)', sMAPA: 'MAPA, prezzi percepiti', sCrop: 'MAPA, superfici e produzioni annuali', t1000: 'migliaia di t', ha: 'ha', none: 'Nessun dato per questo prodotto.' }
  };
  var DAY = 864e5, E0 = Date.UTC(2000, 0, 1);
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function get(f) { return fetch(f).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function iso(d) { return new Date(E0 + d * DAY).toISOString().slice(0, 10); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
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
  // Serie de un país: [[iso, €/kg]]
  function pts(doc, cc) { if (!doc) return []; var r = doc.regions.filter(function (x) { return x.c === cc; })[0]; return r ? r.d.map(function (d, i) { return [iso(d), r.v[i] / 100]; }) : []; }
  function near(P, isoD, maxDays) { var t = Date.parse(isoD), b = null, bd = 1e15; P.forEach(function (p) { var dd = Math.abs(Date.parse(p[0]) - t); if (dd < bd) { bd = dd; b = p; } }); return bd <= maxDays * DAY ? b : null; }
  // Gráfica de líneas con selector «Desde»: S = [{P:[[iso,v]], cls, lab}]
  function chart(S, from, t, F, cls, title, unit, sel) {
    S = S.map(function (s) { return { P: s.P.filter(function (p) { return +p[0].slice(0, 4) >= from; }), cls: s.cls, lab: s.lab }; }).filter(function (s) { return s.P.length > 1; });
    if (!S.length) return { html: '' };
    var W = 560, H = 220, L = 40, R = 8, Tp = 10, B = 24, t0 = 1e15, t1 = 0, hi = 0, v;
    S.forEach(function (s) { s.P.forEach(function (p) { var x = Date.parse(p[0]); t0 = Math.min(t0, x); t1 = Math.max(t1, x); hi = Math.max(hi, p[1]); }); });
    var step = hi > 4 ? 1 : hi > 2 ? 0.5 : hi > 1 ? 0.25 : 0.2; hi = Math.ceil(hi / step) * step;
    var X = function (s) { return L + (Date.parse(s) - t0) / Math.max(1, t1 - t0) * (W - L - R); }, Y = function (q) { return Tp + (hi - q) / hi * (H - Tp - B); }, g = '';
    for (v = 0; v <= hi + 1e-9; v += step) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + F.n(v, 2) + '</text>';
    var y0 = new Date(t0).getUTCFullYear(), y1 = new Date(t1).getUTCFullYear(), ev = y1 - y0 > 20 ? 5 : y1 - y0 > 8 ? 2 : 1;
    for (var yy = y0 + 1; yy <= y1; yy++) if (yy % ev === 0) { var xx = X(yy + '-01-01'); g += '<line class="wp-grid wp-grid-v" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '"/><text class="wp-tick" x="' + xx.toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + yy + '</text>'; }
    var paths = S.slice().reverse().map(function (s) { return '<path class="wp-line wp-line-' + s.cls + '" d="' + s.P.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join('') + '"/>'; }).join('');
    var fs = sel ? '<div class="wd-sels"><label class="wp-sel"><span>' + esc(t.from) + '</span><select class="di-compare-select vg-from" data-c="' + cls + '" aria-label="' + esc(t.from) + '">' + sel.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === from ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label></div>' : '';
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
  var CACHE = {};
  function load(p) {
    var c = CFG[p], ids = [];
    if (CACHE[p]) return CACHE[p];
    ['round', 'truss', 'cherry'].forEach(function (k) { ids.push(c.eu[k] + '-ex-packaging-station-price'); });
    ids.push(c.eu.round + '-farmgate-price');
    return (CACHE[p] = Promise.all(ids.map(function (id) { return get('data/eu/fruta/' + id + '.json'); }).concat([get(c.perc.file), get(c.crops.file)])).then(function (a) {
      var pf = a[4], perc = pf && pf.series ? pf.series.filter(function (s) { return s.id === c.perc.id; })[0] : null;
      return { round: a[0], truss: a[1], cherry: a[2], farm: a[3], perc: perc, crops: a[5] };
    }));
  }
  var ST = { from: 2021 };
  function mount(el, p, lg) {
    var c = CFG[p]; if (!el || !c) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    return load(p).then(function (D) {
      var t = T[lg], F = mk(lg), nm = c.name[lg], h = '', binds = [];
      var R = pts(D.round, 'ES'), TR = pts(D.truss, 'ES'), CH = pts(D.cherry, 'ES'), FG = pts(D.farm, 'ES');
      // 1) precio en origen
      if (R.length) {
        var x = R[R.length - 1], w = R[R.length - 2], y = near(R, new Date(Date.parse(x[0]) - 364 * DAY).toISOString().slice(0, 10), 10), tr = near(TR, x[0], 3), ch = near(CH, x[0], 3), fg = FG.length ? FG[FG.length - 1] : null;
        if (fg && Date.parse(x[0]) - Date.parse(fg[0]) > 60 * DAY) fg = null;
        h += '<section class="di-card ps-rm wp-card gb-card vg-card"><h2 class="ps-rm-h">' + esc(t.now) + '</h2><div class="di-info-stat-list" style="max-width:640px">' +
          row(t.nowWk.replace('{d}', F.day(x[0])), '<b>' + F.n(x[1], 2) + ' ' + t.perKg + '</b>') + (w ? row(t.w1, F.n(w[1], 2) + ' ' + t.perKg + pct(x[1], w[1], F)) : '') + (y ? row(t.y1, F.n(y[1], 2) + ' ' + t.perKg + pct(x[1], y[1], F)) : '') +
          (tr ? row(t.truss, F.n(tr[1], 2) + ' ' + t.perKg) : '') + (ch ? row(t.cherry, F.n(ch[1], 2) + ' ' + t.perKg) : '') + (fg ? row(t.farm.replace('{d}', F.day(fg[0])), F.n(fg[1], 2) + ' ' + t.perKg) : '') + '</div>' +
          '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.nowHow) + '</p>';
        var ec = chart([{ P: R, cls: 't', lab: t.lR }, { P: TR, cls: 'r', lab: t.lT }, { P: CH, cls: 'w', lab: t.lC }], ST.from, t, F, 'vg-ech', t.chE, '€/kg', [[2017, t.all], [2021, '2021'], [2024, '2024']]);
        h += ec.html; binds.push([ec, false]);
        // comparación entre países
        var cmp = D.round.regions.map(function (r0) { var n0 = r0.d.length - 1; return { c: r0.c, d: iso(r0.d[n0]), v: r0.v[n0] / 100 }; }).sort(function (a, b) { return b.v - a.v; });
        var mx = Math.max.apply(null, cmp.map(function (q) { return q.v; }));
        h += '<div class="di-info-card-title gb-sub">' + esc(t.cmp) + '</div><p class="di-field-hint" style="margin:0 0 6px">' + esc(t.cmpHow) + '</p><div class="vg-bars">' + cmp.map(function (q) {
          var old = Date.parse(x[0]) - Date.parse(q.d) > 60 * DAY;
          return '<div class="vg-br' + (q.c === 'ES' ? ' vg-es' : '') + (old ? ' vg-old' : '') + '"><span class="vg-bl">' + esc((CN[q.c] || [q.c])[LI[lg]]) + '</span><span class="vg-bt"><i style="width:' + (q.v / mx * 100).toFixed(1) + '%"></i></span><span class="vg-bv">' + F.n(q.v, 2) + ' €/kg <small>' + esc(F.day(q.d)) + (old ? ' · ' + t.old : '') + '</small></span></div>';
        }).join('') + '</div></section>';
      }
      // 2) precio percibido (MAPA) y estacionalidad
      if (D.perc && D.perc.points && D.perc.points.length > 24) {
        var P = D.perc.points.map(function (q) { return [q[0] + '-15', q[1] / 100]; }), lp = P[P.length - 1], ly = near(P, (+lp[0].slice(0, 4) - 1) + lp[0].slice(4), 5);
        var lastY = +lp[0].slice(0, 4), ya = lastY - 10, yb = lastY - 1, acc = [], m, i;
        for (m = 0; m < 12; m++) acc.push([0, 0]);
        P.forEach(function (q) { var yy = +q[0].slice(0, 4); if (yy >= ya && yy <= yb) { var mm = +q[0].slice(5, 7) - 1; acc[mm][0] += q[1]; acc[mm][1]++; } });
        var avg = acc.map(function (a) { return a[1] ? a[0] / a[1] : null; }), am = Math.max.apply(null, avg.filter(function (q) { return q != null; }).concat([0.01])), cm = new Date().getUTCMonth();
        var sea = '<div class="di-info-card-title gb-sub">' + esc(t.sea.replace('{a}', ya).replace('{b}', yb)) + '</div><p class="di-field-hint" style="margin:0 0 6px">' + esc(t.seaHow) + '</p><div class="vg-sea" role="img" aria-label="' + esc(t.sea.replace('{a}', ya).replace('{b}', yb)) + '">' +
          avg.map(function (q, k) { return '<span title="' + esc(F.mshort(k) + ': ' + F.n(q, 2) + ' €/kg') + '"><b>' + F.n(q, 2) + '</b><i class="' + (k === cm ? 'vg-cur' : '') + '" style="height:' + Math.max(2, (q || 0) / am * 90).toFixed(0) + 'px"></i><small>' + esc(F.mshort(k)) + '</small></span>'; }).join('') + '</div>';
        var pc = chart([{ P: P, cls: 't', lab: '' }], 1990, t, F, 'vg-pch', t.chP, '€/kg', null);
        h += '<section class="di-card ps-rm wp-card gb-card vg-card"><h2 class="ps-rm-h">' + esc(t.perc) + '</h2><div class="di-info-stat-list" style="max-width:640px">' + row(t.percNow.replace('{m}', F.mon(lp[0].slice(0, 7))), '<b>' + F.n(lp[1], 2) + ' ' + t.perKg + '</b>') + (ly ? row(t.percY, F.n(ly[1], 2) + ' ' + t.perKg + pct(lp[1], ly[1], F)) : '') + '</div>' +
          '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.percHow) + '</p>' + sea + pc.html + '</section>';
        binds.push([pc, true]);
      }
      // 3) dónde se cultiva (MAPA, por provincia)
      var CR = D.crops;
      if (CR && CR.campaigns) {
        var camps = Object.keys(CR.campaigns).sort(), cy = camps[camps.length - 1], cp = camps.length > 1 ? camps[camps.length - 2] : null;
        var find = function (camp, code) { return camp && CR.campaigns[camp] ? CR.campaigns[camp].crops.filter(function (q) { return q.c === code; })[0] : null; };
        var tot = find(cy, c.crops.tot), totP = find(cp, c.crops.tot), fr = find(cy, c.crops.fresh), ind = find(cy, c.crops.ind), gl = find(cy, c.crops.glass);
        if (tot && tot.t[4]) {
          var prodT = tot.t[4], areaT = tot.t[0], yl = tot.t[3] ? prodT / tot.t[3] : null, provis = CR.campaigns[cy].status === 'provisional';
          var top = Object.keys(tot.v).filter(function (k) { return tot.v[k] && tot.v[k][4]; }).sort(function (a, b) { return tot.v[b][4] - tot.v[a][4]; }).slice(0, 10), tm = top.length ? tot.v[top[0]][4] : 1;
          h += '<section class="di-card ps-rm wp-card gb-card vg-card"><h2 class="ps-rm-h">' + esc(t.crop.replace('{y}', cy)) + (provis ? ' <small class="vg-prov">' + esc(t.prov) + '</small>' : '') + '</h2><div class="di-info-stat-list" style="max-width:640px">' +
            row(t.prod, '<b>' + F.n(prodT / 1000, 0) + ' ' + esc(t.t1000) + '</b>' + (totP && totP.t[4] ? ' · ' + esc(t.prev) + ' ' + cp + ': ' + F.n(totP.t[4] / 1000, 0) + pct(prodT, totP.t[4], F) : '')) +
            row(t.area, F.n(areaT, 0) + ' ' + t.ha + (totP && totP.t[0] ? pct(areaT, totP.t[0], F) : '')) + (yl ? row(t.yld, F.n(yl, 0) + ' t/ha') : '') +
            (fr && fr.t[4] ? row(t.fresh, F.n(fr.t[4] / prodT * 100, 0) + ' %') : '') + (ind && ind.t[4] ? row(t.ind, F.n(ind.t[4] / prodT * 100, 0) + ' %') : '') + (gl && gl.t[4] && fr && fr.t[4] ? row(t.glass, F.n(gl.t[4] / fr.t[4] * 100, 0) + ' %') : '') + '</div>' +
            '<div class="di-info-card-title gb-sub">' + esc(t.top) + '</div><div class="vg-bars">' + top.map(function (k) { var v = tot.v[k][4]; return '<div class="vg-br"><span class="vg-bl">' + esc(CR.provinces[k] || k) + '</span><span class="vg-bt"><i style="width:' + (v / tm * 100).toFixed(1) + '%"></i></span><span class="vg-bv">' + F.n(v / 1000, 0) + ' ' + esc(t.t1000) + ' <small>' + F.n(v / prodT * 100, 0) + ' % ' + esc(t.share) + '</small></span></div>'; }).join('') + '</div>' +
            (provis ? '<p class="di-field-hint" style="margin:6px 0 0">' + esc(t.provNote.replace('{y}', cy)) + '</p>' : '') + '</section>';
        }
      }
      if (!h) { el.innerHTML = '<p class="di-movers-hint">' + esc(t.none) + '</p>'; return false; }
      h += '<section class="di-card ps-rm vg-card"><h2 class="ps-rm-h">' + esc(t.more) + '</h2><p style="margin:0"><a href="catalogo.html?p=' + c.tag + '">' + esc(t.moreTxt) + '</a></p>' +
        '<p class="di-field-hint" style="margin:10px 0 0">' + esc(t.src) + ' <a href="https://agridata.ec.europa.eu/" target="_blank" rel="noopener noreferrer">' + esc(t.sEU) + '</a>; <a href="https://servicio.mapa.gob.es/ckan/dataset/esmapaindicespreciospreciopercibido" target="_blank" rel="noopener noreferrer">' + esc(t.sMAPA) + '</a>; <a href="' + esc(CR && CR.source ? CR.source.url : '#') + '" target="_blank" rel="noopener noreferrer">' + esc(t.sCrop) + '</a></p></section>';
      el.innerHTML = h; var h1 = document.getElementById('pg-h1'), sb = document.getElementById('pg-sub'); if (h1) h1.textContent = nm; if (sb) sb.textContent = t.sub; document.title = nm + ' | Dehesa Index';
      binds.forEach(function (b) { bind(el, b[0], t, F, b[1]); });
      if (!el.getAttribute('data-vg')) { el.setAttribute('data-vg', '1'); el.addEventListener('change', function (ev) { if ((ev.target.className || '').indexOf('vg-from') >= 0) { ST.from = parseInt(ev.target.value, 10); mount(el, p, lg).then(function () { var f = el.querySelector('.vg-from'); if (f) f.focus(); }); } }); }
      return true;
    });
  }
  global.DIVeg = { has: function (p) { return !!CFG[p]; }, name: function (p, lg) { return CFG[p] ? CFG[p].name[lg] || CFG[p].name.es : ''; }, mount: mount };
})(window);
