/* Alemania: ganadería, huevos, aves y fruta de árbol (Destatis GENESIS, data/germany-livestock.json).
   Se carga solo al abrir la pestaña «Ganadería» de DEFarm. ES5, sin librerías. Uso: DELive.render(pane, st, lang, H) con H = { esc, nf, pc, land, chart, cite }. */
(function () {
  'use strict';
  var F = 'data/germany-livestock.json', D = null, LD = null;
  var T = {
    es: { sub: { sl: 'Sacrificios', herd: 'Censos', eggs: 'Huevos y aves', fruit: 'Fruta de árbol' }, sp: { cattle: 'Vacuno adulto', calves: 'Terneros', pigs: 'Porcino', sheep: 'Ovino' },
      hsp: { cattle: 'Vacuno', pigs: 'Porcino', sheep: 'Ovino' }, vn: { heads: 'Cabezas', tonnes: 'Peso de canal (t)' }, de: 'Alemania', land: 'Estado federado', share: 'Peso en Alemania', yoy: 'Vs. año anterior', click: 'Pulsa una fila para ver su serie.',
      yr: 'Año', month: 'Último mes', sameM: 'Mismo mes del año anterior', cw: 'Peso medio de canal', kg: 'kg/animal', total: 'Total anual', loading: 'Cargando…', err: 'No se han podido cargar los datos.',
      slNote: 'Sacrificio comercial de animales de origen alemán en mataderos alemanes; no incluye animales importados para sacrificio ni sacrificios en casa. El peso es peso de canal (Schlachtgewicht), no peso vivo. La serie de vacuno adulto empieza en 2008 por un cambio de clasificación; el detalle por estado, en 2010 (vacuno, 2024). Los 12 meses suman exactamente el año.',
      mChart: 'Evolución mensual en Alemania', aChart: 'Evolución anual',
      cat: { total: 'Total', dairy: 'Vacas lecheras', suckler: 'Vacas nodrizas, de cría y de engorde', sows: 'Cerdas reproductoras' }, last: 'Último censo', ago: 'Hace un año', since10: 'Vs. 2010', nSel: 'Serie',
      hNote: 'Censo ganadero de Destatis: vacuno y porcino en mayo y noviembre; ovino solo en noviembre. Cifras de cabezas. En el censo de ovino de 2011 y 2013 solo se contaron explotaciones de cierto tamaño.',
      eggT: 'Huevos', hens: 'Gallinas ponedoras', per: 'Huevos por gallina y año', eggU: 'mil millones de huevos', henU: 'M gallinas', lt: 'Por estado federado', poult: 'Aves sacrificadas', poSp: { total: 'Total', broilers: 'Pollos de engorde', turkeys: 'Pavos', ducks: 'Patos', geese: 'Ocas', hens: 'Gallinas de desecho' }, heads: 'Cabezas', tn: 'Peso (t)',
      eNote: 'Producción de huevos de explotaciones con 3 000 o más plazas de gallinas, publicada por Destatis; el detalle por estado empieza en 2023 y los estados con pocas granjas ocultan parte de los datos (Bremen y Sarre solo publican los huevos por gallina). Las aves son sacrificio comercial en Alemania, sin incluir sacrificios en casa.',
      fruitSp: { apples: 'Manzana', pears: 'Pera', sweetcherries: 'Cereza dulce', sourcherries: 'Guinda', plums: 'Ciruela', mirabelles: 'Mirabel' }, prod: 'Cosecha (t)', area: 'Superficie (ha)', yld: 'Rendimiento (t/ha)',
      fNote: 'Cosecha y superficie de fruta de árbol en cultivo comercial (Destatis). El año en curso es la estimación de la cosecha y puede cambiar; las cifras de superficie se actualizan con cada encuesta.', est: 'estimación' },
    en: { sub: { sl: 'Slaughter', herd: 'Herd counts', eggs: 'Eggs and poultry', fruit: 'Orchard fruit' }, sp: { cattle: 'Adult cattle', calves: 'Calves', pigs: 'Pigs', sheep: 'Sheep' },
      hsp: { cattle: 'Cattle', pigs: 'Pigs', sheep: 'Sheep' }, vn: { heads: 'Head', tonnes: 'Carcass weight (t)' }, de: 'Germany', land: 'Federal state', share: 'Share of Germany', yoy: 'Vs. prior year', click: 'Click a row to see its series.',
      yr: 'Year', month: 'Latest month', sameM: 'Same month a year earlier', cw: 'Average carcass weight', kg: 'kg/animal', total: 'Annual total', loading: 'Loading…', err: 'The data could not be loaded.',
      slNote: 'Commercial slaughter of animals of German origin in German slaughterhouses; excludes animals imported for slaughter and home slaughter. Weight is carcass weight (Schlachtgewicht), not live weight. The adult-cattle series starts in 2008 because of a classification change; state detail starts in 2010 (cattle: 2024). The 12 months add up exactly to the year.',
      mChart: 'Monthly, Germany', aChart: 'Annual',
      cat: { total: 'Total', dairy: 'Dairy cows', suckler: 'Suckler, nurse and beef cows', sows: 'Breeding sows' }, last: 'Latest count', ago: 'A year ago', since10: 'Vs. 2010', nSel: 'Series',
      hNote: 'Destatis livestock survey: cattle and pigs in May and November; sheep in November only. Head counts. The 2011 and 2013 sheep counts only covered farms above a size threshold.',
      eggT: 'Eggs', hens: 'Laying hens', per: 'Eggs per hen per year', eggU: 'billion eggs', henU: 'M hens', lt: 'By federal state', poult: 'Poultry slaughtered', poSp: { total: 'Total', broilers: 'Broilers', turkeys: 'Turkeys', ducks: 'Ducks', geese: 'Geese', hens: 'Spent hens' }, heads: 'Head', tn: 'Weight (t)',
      eNote: 'Egg production on farms with 3,000 or more hen places, published by Destatis; state detail starts in 2023 and states with few farms withhold part of the data (Bremen and Saarland publish only eggs per hen). Poultry is commercial slaughter in Germany, excluding home slaughter.',
      fruitSp: { apples: 'Apples', pears: 'Pears', sweetcherries: 'Sweet cherries', sourcherries: 'Sour cherries', plums: 'Plums', mirabelles: 'Mirabelles' }, prod: 'Harvest (t)', area: 'Area (ha)', yld: 'Yield (t/ha)',
      fNote: 'Harvest and area of orchard fruit under commercial cultivation (Destatis). The current year is an estimate of the harvest and may change; area figures update with each survey.', est: 'estimate' },
    fr: { sub: { sl: 'Abattages', herd: 'Cheptel', eggs: 'Œufs et volailles', fruit: 'Fruits à pépins et à noyau' }, sp: { cattle: 'Gros bovins', calves: 'Veaux', pigs: 'Porcins', sheep: 'Ovins' },
      hsp: { cattle: 'Bovins', pigs: 'Porcins', sheep: 'Ovins' }, vn: { heads: 'Têtes', tonnes: 'Poids de carcasse (t)' }, de: 'Allemagne', land: 'Land', share: 'Part de l’Allemagne', yoy: 'Vs. année préc.', click: 'Cliquez sur une ligne pour voir sa série.',
      yr: 'Année', month: 'Dernier mois', sameM: 'Même mois un an plus tôt', cw: 'Poids moyen de carcasse', kg: 'kg/animal', total: 'Total annuel', loading: 'Chargement…', err: 'Impossible de charger les données.',
      slNote: 'Abattage commercial d’animaux d’origine allemande dans des abattoirs allemands ; hors animaux importés pour l’abattage et hors abattage à la ferme. Le poids est le poids de carcasse (Schlachtgewicht), pas le poids vif. La série des gros bovins débute en 2008 (changement de classification) ; le détail par Land en 2010 (bovins : 2024). Les 12 mois totalisent exactement l’année.',
      mChart: 'Évolution mensuelle, Allemagne', aChart: 'Évolution annuelle',
      cat: { total: 'Total', dairy: 'Vaches laitières', suckler: 'Vaches allaitantes, nourrices et d’engraissement', sows: 'Truies reproductrices' }, last: 'Dernier recensement', ago: 'Il y a un an', since10: 'Vs. 2010', nSel: 'Série',
      hNote: 'Recensement du cheptel de Destatis : bovins et porcins en mai et novembre ; ovins en novembre seulement. Nombre de têtes. Les recensements ovins de 2011 et 2013 ne couvraient que les exploitations d’une certaine taille.',
      eggT: 'Œufs', hens: 'Poules pondeuses', per: 'Œufs par poule et par an', eggU: 'milliards d’œufs', henU: 'M poules', lt: 'Par Land', poult: 'Volailles abattues', poSp: { total: 'Total', broilers: 'Poulets de chair', turkeys: 'Dindes', ducks: 'Canards', geese: 'Oies', hens: 'Poules de réforme' }, heads: 'Têtes', tn: 'Poids (t)',
      eNote: 'Production d’œufs des exploitations de 3 000 places de poules ou plus, publiée par Destatis ; le détail par Land débute en 2023 et les Länder avec peu d’élevages masquent une partie des données (Brême et Sarre ne publient que les œufs par poule). Les volailles sont l’abattage commercial en Allemagne, hors abattage à la ferme.',
      fruitSp: { apples: 'Pommes', pears: 'Poires', sweetcherries: 'Cerises douces', sourcherries: 'Griottes', plums: 'Prunes', mirabelles: 'Mirabelles' }, prod: 'Récolte (t)', area: 'Surface (ha)', yld: 'Rendement (t/ha)',
      fNote: 'Récolte et surface de fruits d’arbre en culture commerciale (Destatis). L’année en cours est une estimation de la récolte et peut changer ; les surfaces sont mises à jour à chaque enquête.', est: 'estimation' },
    it: { sub: { sl: 'Macellazioni', herd: 'Consistenze', eggs: 'Uova e avicoli', fruit: 'Frutta da albero' }, sp: { cattle: 'Bovini adulti', calves: 'Vitelli', pigs: 'Suini', sheep: 'Ovini' },
      hsp: { cattle: 'Bovini', pigs: 'Suini', sheep: 'Ovini' }, vn: { heads: 'Capi', tonnes: 'Peso carcassa (t)' }, de: 'Germania', land: 'Land', share: 'Peso sulla Germania', yoy: 'Vs. anno prec.', click: 'Tocca una riga per vedere la sua serie.',
      yr: 'Anno', month: 'Ultimo mese', sameM: 'Stesso mese dell’anno prima', cw: 'Peso medio carcassa', kg: 'kg/capo', total: 'Totale annuo', loading: 'Caricamento…', err: 'Impossibile caricare i dati.',
      slNote: 'Macellazione commerciale di animali di origine tedesca in macelli tedeschi; esclusi gli animali importati per la macellazione e la macellazione domestica. Il peso è il peso della carcassa (Schlachtgewicht), non il peso vivo. La serie dei bovini adulti inizia nel 2008 (cambio di classificazione); il dettaglio per Land nel 2010 (bovini: 2024). I 12 mesi sommano esattamente l’anno.',
      mChart: 'Andamento mensile, Germania', aChart: 'Andamento annuale',
      cat: { total: 'Totale', dairy: 'Vacche da latte', suckler: 'Vacche nutrici, da riproduzione e da ingrasso', sows: 'Scrofe riproduttrici' }, last: 'Ultimo censimento', ago: 'Un anno fa', since10: 'Vs. 2010', nSel: 'Serie',
      hNote: 'Rilevazione del patrimonio zootecnico di Destatis: bovini e suini a maggio e novembre; ovini solo a novembre. Numero di capi. I censimenti ovini del 2011 e 2013 coprivano solo le aziende oltre una certa dimensione.',
      eggT: 'Uova', hens: 'Galline ovaiole', per: 'Uova per gallina e anno', eggU: 'miliardi di uova', henU: 'M galline', lt: 'Per Land', poult: 'Avicoli macellati', poSp: { total: 'Totale', broilers: 'Polli da carne', turkeys: 'Tacchini', ducks: 'Anatre', geese: 'Oche', hens: 'Galline a fine carriera' }, heads: 'Capi', tn: 'Peso (t)',
      eNote: 'Produzione di uova delle aziende con 3.000 o più posti per galline, pubblicata da Destatis; il dettaglio per Land inizia nel 2023 e i Land con poche aziende nascondono parte dei dati (Brema e Saarland pubblicano solo le uova per gallina). Gli avicoli sono macellazione commerciale in Germania, esclusa quella domestica.',
      fruitSp: { apples: 'Mele', pears: 'Pere', sweetcherries: 'Ciliegie dolci', sourcherries: 'Amarene', plums: 'Prugne', mirabelles: 'Mirabelle' }, prod: 'Raccolto (t)', area: 'Superficie (ha)', yld: 'Resa (t/ha)',
      fNote: 'Raccolto e superficie di frutta da albero in coltura commerciale (Destatis). L’anno in corso è una stima del raccolto e può cambiare; le superfici si aggiornano a ogni rilevazione.', est: 'stima' }
  };
  var SPS = ['pigs', 'cattle', 'calves', 'sheep'], HERD = { cattle: ['total', 'dairy', 'suckler'], pigs: ['total', 'sows'], sheep: ['total'] };
  function load() { if (D) return Promise.resolve(D); if (!LD) LD = fetch(F).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { D = d; return d; }); return LD; }
  function at(a, p) { if (!a) return null; for (var i = a.length - 1; i >= 0; i--) { if (a[i][0] === p) return a[i][1]; if (a[i][0] < p) break; } return null; }
  function last(a) { return a && a.length ? a[a.length - 1] : null; }
  function tms(p) { return Date.UTC(+p.slice(0, 4), p.length > 4 ? +p.slice(5, 7) - 1 : 0, 1); }
  function pts(a, from) { var r = []; (a || []).forEach(function (p) { if (!from || p[0] >= from) r.push({ x: tms(p[0]), y: p[1], l: p[0] }); }); return r; }
  function prevYear(p) { return (+p.slice(0, 4) - 1) + p.slice(4); }
  function xm(x) { var d = new Date(x), m = d.getUTCMonth() + 1; return d.getUTCFullYear() + '-' + (m < 10 ? '0' : '') + m; }
  function xy(x) { return new Date(x).getUTCFullYear(); }
  function btns(attr, keys, labels, cur) { return '<div class="di-src-tabs" role="group">' + keys.map(function (k) { return '<button type="button" class="di-src-tab" ' + attr + '="' + k + '" aria-pressed="' + (k === cur) + '">' + labels[k] + '</button>'; }).join('') + '</div>'; }
  function tile(H, lab, val, sub) { return '<div class="de-tile"><div class="de-tl">' + H.esc(lab) + '</div><div class="de-tv">' + val + '</div><div class="de-ts">' + sub + '</div></div>'; }
  function big(v, lang, H, unit) { return v >= 1e6 ? H.nf(v / 1e6, 2, lang) + ' M' + (unit || '') : H.nf(v, 0, lang) + (unit || ''); }
  function fmt(v, vn, lang, H) { return v == null ? '–' : vn === 'tonnes' ? (v >= 1e6 ? H.nf(v / 1e6, 2, lang) + ' M t' : H.nf(v, 0, lang) + ' t') : big(v, lang, H, ''); }
  function th(s, r) { return '<th scope="col"' + (r ? ' class="r"' : '') + '>' + s + '</th>'; }

  function slaughter(h, st, lang, t, H) {
    var sp = SPS.indexOf(st.sp) >= 0 ? st.sp : 'pigs', vn = st.vn === 'tonnes' ? 'tonnes' : 'heads', S = D.slaughter;
    var nat = (S.nat[sp] && S.nat[sp][vn] && S.nat[sp][vn].dom) || [], mon = (S.month[sp] && S.month[sp][vn] && S.month[sp][vn].dom) || [];
    var Hd = (S.nat[sp] && S.nat[sp].heads && S.nat[sp].heads.dom) || [], Tn = (S.nat[sp] && S.nat[sp].tonnes && S.nat[sp].tonnes.dom) || [];
    h += btns('data-lsp', SPS, t.sp, sp) + btns('data-lvn', ['heads', 'tonnes'], t.vn, vn);
    var ly = last(nat), lm = last(mon), tl = '';
    if (ly) { var py = at(nat, String(+ly[0] - 1)); tl += tile(H, t.total + ' ' + ly[0], fmt(ly[1], vn, lang, H), H.esc(t.yoy) + ': ' + (py ? H.pc((ly[1] / py - 1) * 100, lang) : '–')); }
    if (lm) { var pm = at(mon, prevYear(lm[0])); tl += tile(H, t.month + ' ' + lm[0], fmt(lm[1], vn, lang, H), H.esc(t.sameM) + ': ' + (pm ? H.pc((lm[1] / pm - 1) * 100, lang) : '–')); }
    var lh = last(Hd), lt = lh && at(Tn, lh[0]);
    if (lh && lt && lh[1] > 0) tl += tile(H, t.cw + ' ' + lh[0], H.nf(lt * 1000 / lh[1], 0, lang) + ' kg', H.esc(t.kg));
    h += '<div class="de-tiles">' + tl + '</div>';
    var L = S.land[sp] || {}, ys = {}, y, lk;
    for (lk in L) (((L[lk][vn] || {}).dom) || []).forEach(function (p) { ys[p[0]] = (ys[p[0]] || 0) + 1; });
    var yl = Object.keys(ys).filter(function (k) { return ys[k] >= 6; }).sort(); y = yl.length ? yl[yl.length - 1] : null;
    var sel = st.lsel && st.lsel !== 'DE' && L[st.lsel] ? st.lsel : 'DE';
    if (y) {
      var rows = [], tot = at(nat, y);
      for (lk in L) { var a = (L[lk][vn] || {}).dom, v = at(a, y); if (v != null) rows.push({ k: lk, v: v, p: at(a, String(+y - 1)) }); }
      rows.sort(function (a, b) { return b.v - a.v; });
      var row = function (k, nm, v, p, b) { var on = sel === k, w = function (s) { return b ? '<b>' + s + '</b>' : s; }; return '<tr class="pa-r' + (on ? ' on' : '') + '" data-dll="' + k + '" tabindex="0" role="button" aria-pressed="' + on + '"><td>' + w(H.esc(nm)) + '</td><td class="r">' + w(H.esc(fmt(v, vn, lang, H))) + '</td><td class="r">' + (tot && k !== 'DE' ? H.nf(v / tot * 100, 1, lang) + ' %' : '') + '</td><td class="r">' + (p ? H.pc((v / p - 1) * 100, lang) : '–') + '</td></tr>'; };
      h += '<div class="de-sc"><table class="de-t" data-no-cards><thead><tr>' + th(H.esc(t.land)) + th(H.esc(t.vn[vn]) + ' (' + y + ')', 1) + th(H.esc(t.share), 1) + th(H.esc(t.yoy), 1) + '</tr></thead><tbody>' + row('DE', t.de, tot, at(nat, String(+y - 1)), true) + rows.map(function (r) { return row(r.k, H.land(r.k, lang), r.v, r.p, false); }).join('') + '</tbody></table></div><p class="di-movers-hint">' + H.esc(t.click) + '</p>';
    }
    var ser = sel === 'DE' ? nat : ((L[sel][vn] || {}).dom || []), nm = sel === 'DE' ? t.de : H.land(sel, lang);
    h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + H.esc(t.aChart) + ' · ' + H.esc(nm) + '</b> · ' + H.esc(t.sp[sp]) + ' · ' + H.esc(t.vn[vn]) + '</p>' +
      H.chart([{ name: nm, color: sel === 'DE' ? '#2f6b4a' : '#b7791f', pts: pts(ser) }], { lang: lang, unit: vn === 'tonnes' ? 't' : '', aria: t.sp[sp] + ' ' + t.vn[vn] + ' ' + nm, vFmt: function (v) { return fmt(v, vn, lang, H); }, yFmt: function (v) { return H.nf(v >= 1e6 ? v / 1e6 : v, v >= 1e6 ? 1 : 0, lang) + (v >= 1e6 ? ' M' : ''); }, xFmt: xy });
    if (mon.length > 12) h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + H.esc(t.mChart) + '</b> · ' + H.esc(t.sp[sp]) + ' · ' + H.esc(t.vn[vn]) + '</p>' +
      H.chart([{ name: t.de, color: '#1f4e79', pts: pts(mon) }], { lang: lang, unit: vn === 'tonnes' ? 't' : '', aria: t.mChart + ' ' + t.sp[sp] + ' ' + t.vn[vn], vFmt: function (v) { return fmt(v, vn, lang, H); }, yFmt: function (v) { return H.nf(v >= 1e6 ? v / 1e6 : v, v >= 1e6 ? 1 : 0, lang) + (v >= 1e6 ? ' M' : ''); }, xFmt: xm });
    return h + '<p class="di-movers-hint">' + H.esc(t.slNote) + '</p>' + H.cite(['destatis'], ly ? ly[0] : '');
  }

  function herd(h, st, lang, t, H) {
    var sp = HERD[st.hsp] ? st.hsp : 'cattle', cats = HERD[sp], cur = cats.indexOf(st.hc) >= 0 ? st.hc : 'total', Hh = D.herd[sp] || {};
    h += btns('data-lhs', Object.keys(HERD), t.hsp, sp);
    var rows = '', lp = null;
    cats.forEach(function (c) {
      var a = Hh[c]; if (!a || !a.length) return; var l = last(a), ag = at(a, prevYear(l[0])), f = a[0], on = cur === c; lp = lp || l[0];
      rows += '<tr class="pa-r' + (on ? ' on' : '') + '" data-dlc="' + c + '" tabindex="0" role="button" aria-pressed="' + on + '"><td>' + H.esc(t.cat[c]) + '</td><td class="r">' + H.nf(l[1], 0, lang) + '</td><td class="r">' + (ag ? H.pc((l[1] / ag - 1) * 100, lang) : '–') + '</td><td class="r">' + (f[0].slice(0, 4) === '2010' ? H.pc((l[1] / f[1] - 1) * 100, lang) : '–') + '</td></tr>';
    });
    h += '<div class="de-sc"><table class="de-t" data-no-cards><thead><tr>' + th(H.esc(t.hsp[sp])) + th(H.esc(t.last) + (lp ? ' (' + lp + ')' : ''), 1) + th(H.esc(t.yoy), 1) + th(H.esc(t.since10), 1) + '</tr></thead><tbody>' + rows + '</tbody></table></div><p class="di-movers-hint">' + H.esc(t.click) + '</p>';
    h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + H.esc(t.cat[cur]) + '</b> · ' + H.esc(t.hsp[sp]) + ' · ' + H.esc(t.vn.heads) + '</p>' +
      H.chart([{ name: t.cat[cur], color: '#2f6b4a', pts: pts(Hh[cur]) }], { lang: lang, unit: '', aria: t.hsp[sp] + ' ' + t.cat[cur], vFmt: function (v) { return big(v, lang, H, ''); }, yFmt: function (v) { return H.nf(v / 1e6, 1, lang) + ' M'; }, xFmt: xm });
    return h + '<p class="di-movers-hint">' + H.esc(t.hNote) + '</p>' + H.cite(['destatis'], lp ? lp.slice(0, 4) : '');
  }

  function eggs(h, st, lang, t, H) {
    var E = D.eggs, en = E.nat.eggs || [], hn = E.nat.hens || [], pn = E.nat.perHen || [], l = last(en), tl = '';
    if (l) {
      var pe = at(en, String(+l[0] - 1)), lh = at(hn, l[0]), lp = at(pn, l[0]);
      tl += tile(H, t.eggT + ' ' + l[0], H.nf(l[1] / 1e6, 2, lang) + ' ' + H.esc(t.eggU), H.esc(t.yoy) + ': ' + (pe ? H.pc((l[1] / pe - 1) * 100, lang) : '–'));
      if (lh) tl += tile(H, t.hens, H.nf(lh / 1e6, 1, lang) + ' ' + H.esc(t.henU), H.esc(t.yoy) + ': ' + (at(hn, String(+l[0] - 1)) ? H.pc((lh / at(hn, String(+l[0] - 1)) - 1) * 100, lang) : '–'));
      if (lp) tl += tile(H, t.per, H.nf(lp, 0, lang), l[0]);
    }
    h += '<div class="de-tiles">' + tl + '</div>';
    h += '<p class="di-movers-hint" style="margin:6px 0 2px"><b>' + H.esc(t.eggT) + ' · ' + H.esc(t.de) + '</b> · ' + H.esc(t.eggU) + '</p>' +
      H.chart([{ name: t.eggT, color: '#b7791f', pts: pts(en) }], { lang: lang, unit: '', aria: t.eggT + ' ' + t.de, vFmt: function (v) { return H.nf(v / 1e6, 2, lang) + ' ' + t.eggU; }, yFmt: function (v) { return H.nf(v / 1e6, 1, lang); }, xFmt: xy });
    var LK = Object.keys(E.land), ly = null;
    LK.forEach(function (k) { var x = last(E.land[k].eggs || E.land[k].perHen); if (x && (!ly || x[0] > ly)) ly = x[0]; });
    if (ly) {
      var rows = LK.map(function (k) { return { k: k, e: at(E.land[k].eggs, ly), n: at(E.land[k].hens, ly), p: at(E.land[k].perHen, ly) }; }).filter(function (r) { return r.p != null; });
      rows.sort(function (a, b) { return (b.e || 0) - (a.e || 0); });
      h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + H.esc(t.lt) + '</b> · ' + ly + '</p><div class="de-sc"><table class="de-t" data-no-cards><thead><tr>' + th(H.esc(t.land)) + th(H.esc(t.eggT), 1) + th(H.esc(t.hens), 1) + th(H.esc(t.per), 1) + '</tr></thead><tbody>' +
        rows.map(function (r) { return '<tr><td>' + H.esc(H.land(r.k, lang)) + '</td><td class="r">' + (r.e != null ? H.nf(r.e / 1e6, 2, lang) + ' ' + H.esc(lang === 'en' ? 'bn' : lang === 'es' ? 'mil M' : lang === 'fr' ? 'Md' : 'mld') : '–') + '</td><td class="r">' + (r.n != null ? H.nf(r.n / 1e6, 2, lang) + ' M' : '–') + '</td><td class="r">' + H.nf(r.p, 0, lang) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    var P = D.poultry, pl = last((P.total || {}).heads), py = pl ? pl[0] : null;
    if (py) {
      h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + H.esc(t.poult) + '</b> · ' + py + '</p><div class="de-sc"><table class="de-t" data-no-cards><thead><tr>' + th('') + th(H.esc(t.heads), 1) + th(H.esc(t.tn), 1) + th(H.esc(t.yoy), 1) + '</tr></thead><tbody>' +
        ['total', 'broilers', 'turkeys', 'ducks', 'geese', 'hens'].filter(function (k) { return P[k]; }).map(function (k) { var hv = at(P[k].heads, py), tv = at(P[k].tonnes, py), pv = at(P[k].tonnes, String(+py - 1)); return '<tr><td>' + (k === 'total' ? '<b>' + H.esc(t.poSp[k]) + '</b>' : H.esc(t.poSp[k])) + '</td><td class="r">' + H.esc(fmt(hv, 'heads', lang, H)) + '</td><td class="r">' + (tv != null ? H.nf(tv, 0, lang) : '–') + '</td><td class="r">' + (tv != null && pv ? H.pc((tv / pv - 1) * 100, lang) : '–') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    return h + '<p class="di-movers-hint">' + H.esc(t.eNote) + '</p>' + H.cite(['destatis'], l ? l[0] : '');
  }

  function fruit(h, st, lang, t, H) {
    var F2 = D.fruit, ks = Object.keys(t.fruitSp).filter(function (k) { return F2[k]; }), cur = F2[st.fr] ? st.fr : 'apples', prov = (D.provisional && D.provisional.fruit) || [];
    h += btns('data-lfr', ks, t.fruitSp, cur);
    var ly = last(F2[cur].prod), y = ly ? ly[0] : null, isE = y && prov.indexOf(+y) >= 0;
    var rows = ks.map(function (k) {
      var p = F2[k].prod, a = F2[k].area, l = last(p); if (!l) return ''; var av = at(a, l[0]), pv = at(p, String(+l[0] - 1)), on = k === cur;
      return '<tr class="pa-r' + (on ? ' on' : '') + '" data-dlf="' + k + '" tabindex="0" role="button" aria-pressed="' + on + '"><td>' + H.esc(t.fruitSp[k]) + '</td><td class="r">' + H.nf(l[1], 0, lang) + (prov.indexOf(+l[0]) >= 0 ? ' *' : '') + '</td><td class="r">' + (av ? H.nf(av, 0, lang) : '–') + '</td><td class="r">' + (av ? H.nf(l[1] / av, 1, lang) : '–') + '</td><td class="r">' + (pv ? H.pc((l[1] / pv - 1) * 100, lang) : '–') + '</td></tr>';
    }).join('');
    h += '<div class="de-sc"><table class="de-t" data-no-cards><thead><tr>' + th('') + th(H.esc(t.prod) + (y ? ' (' + y + ')' : ''), 1) + th(H.esc(t.area), 1) + th(H.esc(t.yld), 1) + th(H.esc(t.yoy), 1) + '</tr></thead><tbody>' + rows + '</tbody></table></div><p class="di-movers-hint">' + H.esc(t.click) + (isE ? ' * ' + H.esc(t.est) + '.' : '') + '</p>';
    h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + H.esc(t.fruitSp[cur]) + '</b> · ' + H.esc(t.prod) + '</p>' +
      H.chart([{ name: t.fruitSp[cur], color: '#2f6b4a', pts: pts(F2[cur].prod) }], { lang: lang, unit: 't', aria: t.fruitSp[cur] + ' ' + t.prod, vFmt: function (v) { return H.nf(v, 0, lang) + ' t'; }, xFmt: xy });
    return h + '<p class="di-movers-hint">' + H.esc(t.fNote) + '</p>' + H.cite(['destatis'], y || '');
  }

  function render(pane, st, lang, H) {
    var t = T[lang] || T.es;
    pane.innerHTML = '<p class="di-movers-hint">' + H.esc(t.loading) + '</p>';
    load().then(function () {
      var sub = ['sl', 'herd', 'eggs', 'fruit'].indexOf(st.lv) >= 0 ? st.lv : 'sl';
      var h = btns('data-lsub', ['sl', 'herd', 'eggs', 'fruit'], t.sub, sub);
      h = sub === 'sl' ? slaughter(h, st, lang, t, H) : sub === 'herd' ? herd(h, st, lang, t, H) : sub === 'eggs' ? eggs(h, st, lang, t, H) : fruit(h, st, lang, t, H);
      pane.innerHTML = h;
    }).catch(function () { LD = null; pane.innerHTML = '<p class="di-movers-hint">' + H.esc(t.err) + '</p>'; });
  }
  window.DELive = { render: render, _text: T };
})();
