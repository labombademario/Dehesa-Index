/* Dehesa Index — Mi mercado: precio de mercado cercano (Comisión Europea) y sequía (EDO, JRC) de tu región, para Francia e Italia. ES5.
   Se descarga solo al elegir Francia o Italia en js/mi-mercado.js (que le pasa sus ayudantes con DIMmEu.init). Nada se estima:
   cada mercado se asigna a su región administrativa y las zonas de sequía se muestran tal cual las publica el fichero, sin promediar. */
(function (global) {
  'use strict';
  var H = null;
  function lang() { return H.lang(); }
  function esc(s) { return H.esc(s); }
  function note(s) { return H.note(s); }
  function fill(s, o) { return H.fill(s, o); }
  function nf(v, d) { return H.nf(v, d); }
  function pc(v) { return H.pc(v); }
  function pct(a, b) { return H.pct(a, b); }
  function days(a, b) { return H.days(a, b); }
  function dt(iso) { return H.dt(iso); }
  function cite(id, period) { return H.cite(id, period); }
  function putSec(tok, id, html) { H.putSec(tok, id, html); }
  function get(u) { return H.get(u); }
  function pick4(map, k) { return H.pick4(map, k); }
  function tesp() { return H.tesp(); }
  function te() { return H.te(); }
  /* ---------- Francia e Italia: precio de mercado cercano (Comisión Europea) y sequía de tu región (EDO, JRC) ---------- */
  var EPT = {
    es: { sP: 'Precio de mercado cerca de ti', sDr: 'Sequía en tu región', stage: 'Etapa',
      note: 'Precio semanal que la Comisión Europea publica para mercados de {c}. No es la media de tu región ni el precio de tu cooperativa o de tu finca: es una referencia. Cuando el portal indica la etapa de la cadena (en finca, en silo, en puerto…), la tabla la muestra.',
      noMarket: 'La Comisión Europea no publica un mercado de este producto en tu región. Mercados de {c} con precio reciente: {l}.', noAny: 'La Comisión Europea no publica precios de mercado recientes de este producto en {c}.',
      pick: 'Para «{c}» no tenemos un precio de mercado de referencia. Hay precios para trigo blando, trigo duro, cebada, maíz grano, colza, girasol, soja y olivar.',
      stages: { farmgate: 'Precio en finca', depfarm: 'Salida de finca o de la zona de producción', firstcust: 'Entregado al primer cliente (silo o planta)', port: 'Entregado en el silo del puerto', fob: 'FOB (franco a bordo)', proc: 'Entregado a la planta de transformación' },
      pn: { rapeseed: 'Colza', sunflower: 'Girasol alto oleico', soya: 'Soja (haba)' },
      miss1: 'Precio local: solo para los cultivos con mercado de referencia en tu región (trigo, cebada, maíz, colza, girasol, soja, aceite de oliva). Es una referencia de la Comisión Europea, no el precio de tu cooperativa; para el resto no lo tenemos.',
      miss2: 'Seguro agrario: no tenemos cifras por región. No hemos encontrado una fuente abierta y descargable por región (solo informes en PDF).',
      dInD: 'Superficie en sequía agrícola', dLy: 'Misma década del año pasado', dZone: 'Zona', dBar: 'Reparto por clase', dPp: 'pp', dAll: 'Ver el monitor de sequía completo',
      dCls: ['Vigilancia', 'Aviso', 'Alerta', 'Recuperación', 'Recup. temporal de humedad', 'Recup. temporal de vegetación'],
      dNote: 'Indicador Combinado de Sequía del Observatorio Europeo de la Sequía (JRC): porcentaje de la superficie de la zona en vigilancia, aviso o alerta (suma de las tres clases). Es la superficie total de la zona, no solo la cultivada, y no es tu parcela. Se actualiza cada diez días; última década con dato: {d}.',
      dMulti: 'El indicador se publica en {n} zonas que forman tu región; se muestran por separado, sin promediarlas.', dFr: 'Francia unió sus regiones en 2016, pero el indicador sigue publicándose por las 22 regiones anteriores.', dNo: 'No hay datos de sequía para esta región.' },
    en: { sP: 'Market price near you', sDr: 'Drought in your region', stage: 'Stage',
      note: 'Weekly price the European Commission publishes for {c} markets. It is not your region’s average nor your co-op’s or farm’s price: it is a reference. When the portal states the stage of the chain (farm, silo, port…), the table shows it.',
      noMarket: 'The European Commission publishes no market for this product in your region. {c} markets with a recent price: {l}.', noAny: 'The European Commission publishes no recent market prices for this product in {c}.',
      pick: 'We have no reference market price for “{c}”. Prices exist for common wheat, durum wheat, barley, grain maize, rapeseed, sunflower, soya and olives.',
      stages: { farmgate: 'Farm-gate price', depfarm: 'Departure from farm or production area', firstcust: 'Delivered to the first customer (silo or plant)', port: 'Delivered to a port silo', fob: 'Free on board (FOB)', proc: 'Delivered to the processor' },
      pn: { rapeseed: 'Rapeseed', sunflower: 'High-oleic sunflower', soya: 'Soya beans' },
      miss1: 'Local price: only for crops with a reference market in your region (wheat, barley, maize, rapeseed, sunflower, soya, olive oil). It is a European Commission reference, not your co-op’s price; for other crops we do not have it.',
      miss2: 'Crop insurance: no regional figures. We have not found an open, downloadable source by region (only PDF reports).',
      dInD: 'Area in agricultural drought', dLy: 'Same dekad last year', dZone: 'Zone', dBar: 'Split by class', dPp: 'pp', dAll: 'Open the full drought monitor',
      dCls: ['Watch', 'Warning', 'Alert', 'Recovery', 'Temporary soil-moisture recovery', 'Temporary vegetation recovery'],
      dNote: 'Combined Drought Indicator of the European Drought Observatory (JRC): share of the zone’s area under watch, warning or alert (the three classes added). It is the zone’s total area, not just cropland, and it is not your field. Updated every ten days; latest dekad with data: {d}.',
      dMulti: 'The indicator is published in {n} zones that make up your region; they are shown separately, not averaged.', dFr: 'France merged its regions in 2016, but the indicator is still published for the 22 former regions.', dNo: 'No drought data for this region.' },
    fr: { sP: 'Prix de marché près de chez vous', sDr: 'Sécheresse dans votre région', stage: 'Stade',
      note: 'Prix hebdomadaire que la Commission européenne publie pour des marchés en {c}. Ce n’est ni la moyenne de votre région ni le prix de votre coopérative ou de votre exploitation : c’est une référence. Quand le portail indique le stade de la chaîne (ferme, silo, port…), le tableau l’affiche.',
      noMarket: 'La Commission européenne ne publie pas de marché de ce produit dans votre région. Marchés en {c} avec un prix récent : {l}.', noAny: 'La Commission européenne ne publie pas de prix de marché récents de ce produit en {c}.',
      pick: 'Nous n’avons pas de prix de marché de référence pour « {c} ». Il existe des prix pour le blé tendre, le blé dur, l’orge, le maïs grain, le colza, le tournesol, le soja et l’olivier.',
      stages: { farmgate: 'Prix départ ferme', depfarm: 'Départ ferme ou zone de production', firstcust: 'Livré au premier client (silo ou usine)', port: 'Livré au silo du port', fob: 'FOB (franco à bord)', proc: 'Livré à l’usine de transformation' },
      pn: { rapeseed: 'Colza', sunflower: 'Tournesol oléique', soya: 'Fèves de soja' },
      miss1: 'Prix local : seulement pour les cultures avec un marché de référence dans votre région (blé, orge, maïs, colza, tournesol, soja, huile d’olive). C’est une référence de la Commission européenne, pas le prix de votre coopérative ; pour les autres cultures nous ne l’avons pas.',
      miss2: 'Assurance récolte : pas de chiffres par région. Nous n’avons pas trouvé de source ouverte et téléchargeable par région (seulement des rapports PDF).',
      dInD: 'Surface en sécheresse agricole', dLy: 'Même décade l’an dernier', dZone: 'Zone', dBar: 'Répartition par classe', dPp: 'pt', dAll: 'Ouvrir le moniteur de sécheresse complet',
      dCls: ['Vigilance', 'Avertissement', 'Alerte', 'Rétablissement', 'Rétablissement temporaire de l’humidité', 'Rétablissement temporaire de la végétation'],
      dNote: 'Indicateur combiné de sécheresse de l’Observatoire européen de la sécheresse (JRC) : part de la surface de la zone en vigilance, avertissement ou alerte (somme des trois classes). C’est la surface totale de la zone, pas seulement cultivée, et ce n’est pas votre parcelle. Mis à jour tous les dix jours ; dernière décade avec donnée : {d}.',
      dMulti: 'L’indicateur est publié pour {n} zones qui composent votre région ; elles sont montrées séparément, sans moyenne.', dFr: 'La France a fusionné ses régions en 2016, mais l’indicateur est toujours publié pour les 22 anciennes régions.', dNo: 'Pas de données de sécheresse pour cette région.' },
    it: { sP: 'Prezzo di mercato vicino a te', sDr: 'Siccità nella tua regione', stage: 'Fase',
      note: 'Prezzo settimanale che la Commissione europea pubblica per mercati in {c}. Non è la media della tua regione né il prezzo della tua cooperativa o azienda: è un riferimento. Quando il portale indica la fase della filiera (azienda, silo, porto…), la tabella la mostra.',
      noMarket: 'La Commissione europea non pubblica un mercato di questo prodotto nella tua regione. Mercati in {c} con un prezzo recente: {l}.', noAny: 'La Commissione europea non pubblica prezzi di mercato recenti di questo prodotto in {c}.',
      pick: 'Non abbiamo un prezzo di mercato di riferimento per «{c}». Ci sono prezzi per frumento tenero, frumento duro, orzo, mais da granella, colza, girasole, soia e olivo.',
      stages: { farmgate: 'Prezzo in azienda', depfarm: 'Partenza da azienda o zona di produzione', firstcust: 'Consegnato al primo cliente (silo o impianto)', port: 'Consegnato al silo del porto', fob: 'FOB (franco a bordo)', proc: 'Consegnato all’impianto di trasformazione' },
      pn: { rapeseed: 'Colza', sunflower: 'Girasole alto oleico', soya: 'Semi di soia' },
      miss1: 'Prezzo locale: solo per le colture con un mercato di riferimento nella tua regione (frumento, orzo, mais, colza, girasole, soia, olio d’oliva). È un riferimento della Commissione europea, non il prezzo della tua cooperativa; per le altre colture non lo abbiamo.',
      miss2: 'Assicurazione dei raccolti: nessuna cifra per regione. Non abbiamo trovato una fonte aperta e scaricabile per regione (solo rapporti in PDF).',
      dInD: 'Superficie in siccità agricola', dLy: 'Stessa decade dell’anno scorso', dZone: 'Zona', dBar: 'Ripartizione per classe', dPp: 'pp', dAll: 'Apri il monitor della siccità completo',
      dCls: ['Attenzione', 'Allerta', 'Allarme', 'Recupero', 'Recupero temporaneo dell’umidità', 'Recupero temporaneo della vegetazione'],
      dNote: 'Indicatore combinato di siccità dell’Osservatorio europeo sulla siccità (JRC): quota della superficie della zona in attenzione, allerta o allarme (somma delle tre classi). È la superficie totale della zona, non solo quella coltivata, e non è il tuo campo. Aggiornato ogni dieci giorni; ultima decade con dato: {d}.',
      dMulti: 'L’indicatore è pubblicato per {n} zone che compongono la tua regione; sono mostrate separatamente, senza fare la media.', dFr: 'La Francia ha unito le sue regioni nel 2016, ma l’indicatore è ancora pubblicato per le 22 regioni precedenti.', dNo: 'Nessun dato di siccità per questa regione.' }
  };
  function epr() { return EPT[lang()] || EPT.es; }
  var EU_PR = {
    C1110: { f: 'cereales', k: [['milling-wheat', /^milling-wheat/], ['feed-wheat', /^feed-wheat/]] },
    C1120: { f: 'cereales', k: [['durum-wheat', /^durum-wheat/]] },
    C1300: { f: 'cereales', k: [['feed-barley', /^feed-barley/], ['malting-barley', /^malting-barley/]] },
    C1500: { f: 'cereales', k: [['feed-maize', /^feed-maize/]] },
    I1110: { f: 'oleaginosas', k: [['rapeseed', /^rapeseed-(?!meal)/]] },
    I1120: { f: 'oleaginosas', k: [['sunflower', /^sunflower-seed-(?!meal)/]] },
    I1130: { f: 'oleaginosas', k: [['soya', /^soya-beans/]] },
    O1000: { f: 'aceite', k: [['extra-virgin', /^extra-virgin/], ['virgin-olive', /^virgin-olive/], ['lampante', /^lampante/]] }
  };
  /* mercado -> región (claves de Mi mercado): geografía administrativa, nada estimado */
  var FR_MK = { 'la pallice': 'NAQ', 'rouen': 'NOR', 'port-la-nouvelle': 'OCC', 'bordeaux': 'NAQ', 'bayonne': 'NAQ', 'dunkerque': 'HDF', 'creil': 'HDF', 'metz': 'GES', 'marne': 'GES', 'eure-et-loir': 'CVL', 'loiret': 'CVL', 'le meriot': 'GES', 'montoir': 'PDL', 'saint nazaire': 'PDL', 'brest': 'BRE', 'lorient': 'BRE', 'sete': 'OCC', 'lezoux': 'ARA' };
  var IT_MK = { 'bologna': 'EMR', 'milano': 'LOM', 'napoli': 'CAM', 'torino': 'PIE', 'mantova': 'LOM', 'reggio emilia': 'EMR', 'roma': 'LAZ', 'treviso': 'VEN', 'udine': 'FVG', 'verona': 'VEN', 'alessandria': 'PIE', 'firenze': 'TOS', 'grosseto': 'TOS', 'perugia': 'UMB', 'foggia': 'PUG', 'catania': 'SIC', 'gioia tauro': 'CAL' };
  /* región de Mi mercado -> zonas NUTS 2 del fichero de sequía (data/eu-drought-regions) */
  var FR_ID = { IDF: ['FR10'], CVL: ['FRB0'], BFC: ['FRC1', 'FRC2'], NOR: ['FRD1', 'FRD2'], HDF: ['FRE1', 'FRE2'], GES: ['FRF1', 'FRF2', 'FRF3'], PDL: ['FRG0'], BRE: ['FRH0'], NAQ: ['FRI1', 'FRI2', 'FRI3'], OCC: ['FRJ1', 'FRJ2'], ARA: ['FRK1', 'FRK2'], PAC: ['FRL0'], COR: ['FRM0'] };
  var IT_ID = { PIE: ['ITC1'], VDA: ['ITC2'], LIG: ['ITC3'], LOM: ['ITC4'], ABR: ['ITF1'], MOL: ['ITF2'], CAM: ['ITF3'], PUG: ['ITF4'], BAS: ['ITF5'], CAL: ['ITF6'], SIC: ['ITG1'], SAR: ['ITG2'], TAA: ['ITH1', 'ITH2'], VEN: ['ITH3'], FVG: ['ITH4'], EMR: ['ITH5'], TOS: ['ITI1'], UMB: ['ITI2'], MAR: ['ITI3'], LAZ: ['ITI4'] };
  var IT_N2 = {}; Object.keys(IT_ID).forEach(function (k) { IT_ID[k].forEach(function (id) { IT_N2[id] = k; }); });
  function normK(m) { return String(m || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s*\(it[a-z0-9]{3}\)\s*$/i, '').trim(); }
  function mkName(m) { return String(m || '').replace(/\s*\(IT[A-Z0-9]{3}\)\s*$/i, '').trim(); }
  function mkRegion(c, m) {
    var code = /\((IT[A-Z0-9]{3})\)/i.exec(String(m));
    if (c === 'IT' && code && IT_N2[code[1].toUpperCase().slice(0, 4)]) return IT_N2[code[1].toUpperCase().slice(0, 4)];
    return (c === 'FR' ? FR_MK : IT_MK)[normK(m)] || '';
  }
  function stageOf(sid) {
    if (/farm-gate/.test(sid)) return 'farmgate'; if (/departure-from-farm|depprod/.test(sid)) return 'depfarm';
    if (/deliver-to-first-customer|delfirst/.test(sid)) return 'firstcust'; if (/delivered-to-port/.test(sid)) return 'port';
    if (/free-on-board/.test(sid)) return 'fob'; if (/delproc/.test(sid)) return 'proc'; return '';
  }
  function euPrice(tok) {
    var C = H.ST().c, R = H.ST().r, P = H.ST().p, x = epr(), tt = tesp(), rule = EU_PR[P], ctry = H.EUN[C][lang()] || H.EUN[C].es;
    var link = function (f) { return '<p class="di-movers-hint"><a href="lonjas.html?c=' + C + (f ? '&amp;f=' + f : '') + '">' + esc(tt.all) + '</a></p>'; };
    if (!rule) { putSec(tok, 'price', note(fill(x.pick, { c: pick4(H.EU_CROPN, P) })) + link('cereales')); return Promise.resolve(); }
    return get('data/eu/' + rule.f + '.json').then(function (d) {
      if (tok !== H.TOK()) return;
      var cand = [], newest = '';
      d.series.forEach(function (s) {
        if (/national-average/.test(s.id)) return;
        var key = null; rule.k.forEach(function (q) { if (!key && q[1].test(s.id)) key = q[0]; });
        if (!key) return;
        s.regions.forEach(function (r) { if (r.c === C && r.m && r.last && mkRegion(C, r.m)) { cand.push({ k: key, s: s, r: r }); if (r.last[0] > newest) newest = r.last[0]; } });
      });
      var cur = cand.filter(function (q) { return days(q.r.last[0], newest) <= 28; });
      var rows = cur.filter(function (q) { return mkRegion(C, q.r.m) === R; });
      if (!rows.length) {
        var near = {}; cur.forEach(function (q) { near[normK(q.r.m)] = mkName(q.r.m); });
        var l = Object.keys(near).map(function (k) { return near[k]; }).sort();
        putSec(tok, 'price', note(l.length ? fill(x.noMarket, { c: ctry, l: l.join(', ') }) : fill(x.noAny, { c: ctry })) + link(rule.f)); return;
      }
      var order = rule.k.map(function (q) { return q[0]; }), hasSt = rows.some(function (q) { return !!stageOf(q.s.id); });
      rows.sort(function (a, b) { return order.indexOf(a.k) - order.indexOf(b.k) || mkName(a.r.m).localeCompare(mkName(b.r.m)); });
      var h = note(fill(x.note, { c: ctry })) + '<div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(tt.prod) + '</th>' + (hasSt ? '<th scope="col">' + esc(x.stage) + '</th>' : '') + '<th scope="col">' + esc(tt.mk) + '</th><th scope="col" class="r">' + esc(tt.price) + '</th><th scope="col" class="r">' + esc(tt.wk) + '</th><th scope="col" class="r">' + esc(tt.date) + '</th></tr></thead><tbody>' +
        rows.map(function (q) {
          var r = q.r, wk = r.prev && Math.abs(days(r.prev[0], r.last[0]) - 7) <= 1 ? pct(r.last[1], r.prev[1]) : null, st = stageOf(q.s.id);
          return '<tr><td>' + esc(x.pn[q.k] || tt.names[q.k] || q.k) + '</td>' + (hasSt ? '<td>' + (st ? esc(x.stages[st]) : '—') + '</td>' : '') + '<td>' + esc(mkName(r.m)) + '</td><td class="r">' + nf(r.last[1], q.s.unit === '€/t' ? 1 : 2) + ' ' + esc(q.s.unit) + '</td><td class="r">' + pc(wk) + '</td><td class="r">' + esc(dt(r.last[0])) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      putSec(tok, 'price', h + link(rule.f) + cite('eu_agrifood', newest));
    });
  }
  var DR_COL = ['#e0b84a', '#e08a3a', '#b03a2e', '#6aa6c8', '#8ec3a7', '#a8b86a'];
  function drBar(r, x) {
    var s = '', i; for (i = 0; i < r.length; i++) if (r[i] > 0) s += '<span title="' + esc(x.dCls[i] + ': ' + nf(r[i], 1) + ' %') + '" style="display:inline-block;height:100%;width:' + r[i] + '%;background:' + DR_COL[i] + '"></span>';
    var lbl = r.map(function (v, k) { return v > 0 ? x.dCls[k] + ' ' + nf(v, 1) + ' %' : ''; }).filter(Boolean).join(', ');
    return '<div role="img" aria-label="' + esc(lbl) + '" style="display:flex;height:12px;border-radius:6px;overflow:hidden;background:var(--border);min-width:120px">' + s + '</div>';
  }
  function euDrought(tok) {
    var C = H.ST().c, R = H.ST().r, x = epr(), ids = (C === 'FR' ? FR_ID : IT_ID)[R];
    if (!ids) { putSec(tok, 'dr', note(x.dNo)); return Promise.resolve(); }
    return Promise.all([get('data/eu-drought.json'), get('data/eu-drought-regions/' + C + '.json')]).then(function (a) {
      if (tok !== H.TOK()) return;
      var D = a[0], G = a[1], zones = ids.filter(function (id) { return G && G.regions && G.regions[id] && G.regions[id].v && G.regions[id].v.length; });
      if (!D || !D.periods || !zones.length) { putSec(tok, 'dr', note(x.dNo)); return; }
      var n = G.regions[zones[0]].v.length, labels = D.periods.slice(-n), last = labels[labels.length - 1];
      var inD = function (r) { return r ? r[0] + r[1] + r[2] : null; };
      var h = note(fill(x.dNote, { d: dt(last) })) + (zones.length > 1 ? note(fill(x.dMulti, { n: zones.length }) + (C === 'FR' ? ' ' + x.dFr : '')) : '') +
        '<div class="de-sc"><table class="de-t" style="min-width:0" data-no-cards data-no-rows><thead><tr><th scope="col">' + esc(x.dZone) + '</th><th scope="col" class="r" style="white-space:normal">' + esc(x.dInD) + '</th></tr></thead><tbody>' +
        zones.map(function (id) {
          var z = G.regions[id], v = z.v, l = v[v.length - 1], p = v.length > 36 ? v[v.length - 37] : null, dl = p ? inD(l) - inD(p) : null;
          return '<tr><th scope="row"><div>' + esc(z.name) + '</div><div style="margin-top:6px;font-weight:400" title="' + esc(x.dBar) + '">' + drBar(l, x) + '</div></th><td class="r" style="white-space:normal"><b>' + nf(inD(l), 1) + ' %</b><div class="di-movers-hint" style="margin:2px 0 0">' + esc(x.dLy) + ': ' + (p ? nf(inD(p), 1) + ' % (' + (dl > 0 ? '+' : dl < 0 ? '−' : '') + nf(Math.abs(dl), 1) + ' ' + esc(x.dPp) + ')' : '—') + '</div></td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<p class="di-movers-hint" style="display:flex;flex-wrap:wrap;gap:4px 14px;margin:6px 0">' + x.dCls.map(function (c, i) { return '<span><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:' + DR_COL[i] + ';margin-right:4px"></i>' + esc(c) + '</span>'; }).join('') + '</p>' +
        '<p class="di-movers-hint"><a href="sequia.html?zona=eu">' + esc(x.dAll) + '</a></p>';
      putSec(tok, 'dr', h + cite('edo_cdi', last));
    });
  }
  function missingFRIT() { var x = epr(), t = te(); return Promise.resolve('<ul style="margin:4px 0 0 18px;padding:0;font-size:14px;line-height:1.5">' + [x.miss1, x.miss2, t.no_3].map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>'); }
  global.DIMmEu = { init: function (h) { H = h; }, price: euPrice, drought: euDrought, missing: missingFRIT };
})(window);
