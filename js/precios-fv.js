/* Dehesa Index — Pestaña «Frutas y hortalizas» de precios.html (12-oct-2026; Mario: «que todos los cultivos que tenemos estén, y que estén en la página de precios»).
   Una tabla con los 52 productos de data/fv-products.json (scripts/build-fv-products.py): precio semanal por país de la Comisión Europea (€/kg, con la semana
   anterior y hace un año) y, para España, el último precio mensual que cobra el agricultor (MAPA). Cada producto enlaza a su ficha (producto.html?p=<id>).
   ES5, sin librerías. API: DehesaFV.render(el, {location, euCountry, lang}). */
(function (global) {
  'use strict';
  var CN = { AT: ['Austria', 'Austria', 'Autriche', 'Austria'], BE: ['Bélgica', 'Belgium', 'Belgique', 'Belgio'], BG: ['Bulgaria', 'Bulgaria', 'Bulgarie', 'Bulgaria'], CY: ['Chipre', 'Cyprus', 'Chypre', 'Cipro'], CZ: ['Chequia', 'Czechia', 'Tchéquie', 'Cechia'], DE: ['Alemania', 'Germany', 'Allemagne', 'Germania'], DK: ['Dinamarca', 'Denmark', 'Danemark', 'Danimarca'], EL: ['Grecia', 'Greece', 'Grèce', 'Grecia'], ES: ['España', 'Spain', 'Espagne', 'Spagna'], FR: ['Francia', 'France', 'France', 'Francia'], HR: ['Croacia', 'Croatia', 'Croatie', 'Croazia'], HU: ['Hungría', 'Hungary', 'Hongrie', 'Ungheria'], IT: ['Italia', 'Italy', 'Italie', 'Italia'], LT: ['Lituania', 'Lithuania', 'Lituanie', 'Lituania'], LU: ['Luxemburgo', 'Luxembourg', 'Luxembourg', 'Lussemburgo'], LV: ['Letonia', 'Latvia', 'Lettonie', 'Lettonia'], MT: ['Malta', 'Malta', 'Malte', 'Malta'], NL: ['Países Bajos', 'Netherlands', 'Pays-Bas', 'Paesi Bassi'], PL: ['Polonia', 'Poland', 'Pologne', 'Polonia'], PT: ['Portugal', 'Portugal', 'Portugal', 'Portogallo'], RO: ['Rumanía', 'Romania', 'Roumanie', 'Romania'], SE: ['Suecia', 'Sweden', 'Suède', 'Svezia'], SI: ['Eslovenia', 'Slovenia', 'Slovénie', 'Slovenia'], SK: ['Eslovaquia', 'Slovakia', 'Slovaquie', 'Slovacchia'], EE: ['Estonia', 'Estonia', 'Estonie', 'Estonia'], FI: ['Finlandia', 'Finland', 'Finlande', 'Finlandia'], IE: ['Irlanda', 'Ireland', 'Irlande', 'Irlanda'] };
  var LI = { es: 0, en: 1, fr: 2, it: 3 }, LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
  var STG = { pack: ['salida de almacén', 'packing house', 'sortie de station', 'uscita magazzino'], farm: ['en finca', 'farm-gate', 'à la ferme', 'in azienda'], retail: ['compra del minorista', 'retailer buying', 'achat détaillant', 'acquisto dettagliante'] };
  var T = {
    es: { intro: '{n} frutas, hortalizas y frutos secos. Precio semanal de cada país (Comisión Europea) en €/kg; en España, también lo que cobra el agricultor cada mes (MAPA). Pulsa un producto para ver su ficha: evolución, comparación entre países y dónde se cultiva.', ctry: 'País', find: 'Buscar producto', all: 'Todos', veg: 'Hortalizas', fruit: 'Frutas', nut: 'Frutos secos',
      cols: ['Producto', 'Precio semanal', 'Semana anterior', 'Hace un año', 'Qué precio es', 'Semana'], mapa: 'Agricultor (MAPA)', none: 'sin precio semanal', old: 'fuera de temporada o dato antiguo', hid: '{n} productos no tienen precio publicado en {c} y no se muestran.', noRow: 'Ningún producto coincide con la búsqueda.',
      note: 'Salida de almacén: lo que cobra el almacén o la cooperativa al vender el producto clasificado y envasado, sin IVA; en finca: lo que recibe el agricultor; compra del minorista: lo que paga la tienda. Cada país publica los tipos y fases que quiere, así que la comparación entre países es orientativa. El precio del MAPA es una media mensual de otra fuente y no se compara con el semanal.', src: 'Fuentes:', sEU: 'Comisión Europea, portal de datos agroalimentarios', sMAPA: 'MAPA, precios percibidos', n: 'productos' },
    en: { intro: '{n} fruits, vegetables and nuts. Weekly price in each country (European Commission) in €/kg; for Spain, also what farmers get each month (MAPA). Click a product to open its page: trend, comparison between countries and where it is grown.', ctry: 'Country', find: 'Find a product', all: 'All', veg: 'Vegetables', fruit: 'Fruit', nut: 'Nuts',
      cols: ['Product', 'Weekly price', 'Previous week', 'A year ago', 'Which price', 'Week'], mapa: 'Farmer (MAPA)', none: 'no weekly price', old: 'out of season or old figure', hid: '{n} products have no published price in {c} and are not shown.', noRow: 'No product matches the search.',
      note: 'Packing house: what the packing house or co-op gets when selling the produce graded and packed, before VAT; farm-gate: what the grower receives; retailer buying: what the shop pays. Each country reports the types and stages it chooses, so comparisons between countries are indicative. The MAPA price is a monthly average from another source and should not be compared with the weekly one.', src: 'Sources:', sEU: 'European Commission, agri-food data portal', sMAPA: 'MAPA, prices received', n: 'products' },
    fr: { intro: '{n} fruits, légumes et fruits à coque. Prix hebdomadaire de chaque pays (Commission européenne) en €/kg ; pour l’Espagne, aussi ce que touche l’agriculteur chaque mois (MAPA). Cliquez sur un produit pour ouvrir sa fiche : évolution, comparaison entre pays et lieux de culture.', ctry: 'Pays', find: 'Chercher un produit', all: 'Tous', veg: 'Légumes', fruit: 'Fruits', nut: 'Fruits à coque',
      cols: ['Produit', 'Prix hebdomadaire', 'Semaine précédente', 'Il y a un an', 'Quel prix', 'Semaine'], mapa: 'Agriculteur (MAPA)', none: 'pas de prix hebdomadaire', old: 'hors saison ou donnée ancienne', hid: '{n} produits n’ont pas de prix publié en {c} et ne sont pas affichés.', noRow: 'Aucun produit ne correspond à la recherche.',
      note: 'Sortie de station : ce que touche la station ou la coopérative en vendant le produit trié et emballé, hors TVA ; à la ferme : ce que reçoit le producteur ; achat du détaillant : ce que paie le magasin. Chaque pays publie les types et stades qu’il choisit : la comparaison entre pays est indicative. Le prix du MAPA est une moyenne mensuelle d’une autre source et ne se compare pas au prix hebdomadaire.', src: 'Sources :', sEU: 'Commission européenne, portail de données agroalimentaires', sMAPA: 'MAPA, prix perçus', n: 'produits' },
    it: { intro: '{n} tra frutta, ortaggi e frutta secca. Prezzo settimanale di ogni paese (Commissione europea) in €/kg; per la Spagna, anche quanto incassa l’agricoltore ogni mese (MAPA). Clicca un prodotto per aprire la sua scheda: andamento, confronto tra paesi e dove si coltiva.', ctry: 'Paese', find: 'Cerca un prodotto', all: 'Tutti', veg: 'Ortaggi', fruit: 'Frutta', nut: 'Frutta secca',
      cols: ['Prodotto', 'Prezzo settimanale', 'Settimana precedente', 'Un anno fa', 'Quale prezzo', 'Settimana'], mapa: 'Agricoltore (MAPA)', none: 'nessun prezzo settimanale', old: 'fuori stagione o dato vecchio', hid: '{n} prodotti non hanno un prezzo pubblicato in {c} e non sono mostrati.', noRow: 'Nessun prodotto corrisponde alla ricerca.',
      note: 'Uscita magazzino: quanto incassa il centro di confezionamento o la cooperativa vendendo il prodotto selezionato e confezionato, IVA esclusa; in azienda: quanto riceve il produttore; acquisto del dettagliante: quanto paga il negozio. Ogni paese pubblica i tipi e le fasi che sceglie, quindi il confronto tra paesi è indicativo. Il prezzo del MAPA è una media mensile di un’altra fonte e non va confrontato con quello settimanale.', src: 'Fonti:', sEU: 'Commissione europea, portale dei dati agroalimentari', sMAPA: 'MAPA, prezzi percepiti', n: 'prodotti' }
  };
  var DAY = 864e5, DOC = null, ST = { cc: null, g: 'all', q: '' };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function load() { return DOC || (DOC = fetch('data/fv-products.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  /* EE. UU.: precio recibido por el agricultor (USDA NASS), tal cual en su unidad publicada; data/views/fv-us.json (scripts/build-views.py). */
  var US = {
    es: { intro: '{n} frutas, hortalizas y frutos secos de EE. UU. Precio que recibe el agricultor (USDA NASS), media nacional, en dólares y en la unidad en que lo publica la fuente.', find: 'Buscar producto', all: 'Todos', veg: 'Hortalizas', fruit: 'Frutas', nut: 'Frutos secos',
      cols: ['Producto', 'Precio', 'Periodo anterior', 'Hace un año', 'Frecuencia', 'Periodo'], m: 'mensual', a: 'anual', none: 'Ningún producto coincide.', note: 'Unidades de la fuente: lb = libra (0,4536 kg); cwt = 100 libras (45,36 kg); short ton = tonelada corta (907 kg); box = caja (el peso varía según el producto); barrel = barril de arándano rojo (100 libras). «En el árbol» es el precio de la fruta sin recolectar ni envasar. Las series anuales son del año natural (o de la campaña) y se actualizan cuando NASS las publica.', src: 'Fuente' },
    en: { intro: '{n} U.S. fruits, vegetables and nuts. Price received by farmers (USDA NASS), national average, in dollars and in the unit the source publishes.', find: 'Find a product', all: 'All', veg: 'Vegetables', fruit: 'Fruit', nut: 'Nuts',
      cols: ['Product', 'Price', 'Previous period', 'A year ago', 'Frequency', 'Period'], m: 'monthly', a: 'annual', none: 'No product matches.', note: 'Source units: lb = pound (0.4536 kg); cwt = 100 pounds (45.36 kg); short ton = 2,000 pounds (907 kg); box = box (weight varies by product); barrel = cranberry barrel (100 pounds). “On tree” is the price of unharvested, unpacked fruit. Annual series cover the calendar year (or the marketing season) and update when NASS publishes them.', src: 'Source' },
    fr: { intro: '{n} fruits, légumes et fruits à coque des États-Unis. Prix reçu par l’agriculteur (USDA NASS), moyenne nationale, en dollars et dans l’unité publiée par la source.', find: 'Chercher un produit', all: 'Tous', veg: 'Légumes', fruit: 'Fruits', nut: 'Fruits à coque',
      cols: ['Produit', 'Prix', 'Période précédente', 'Il y a un an', 'Fréquence', 'Période'], m: 'mensuel', a: 'annuel', none: 'Aucun produit ne correspond.', note: 'Unités de la source : lb = livre (0,4536 kg) ; cwt = 100 livres (45,36 kg) ; short ton = tonne courte (907 kg) ; box = caisse (le poids varie selon le produit) ; barrel = baril de canneberges (100 livres). « Sur l’arbre » est le prix du fruit non récolté ni emballé. Les séries annuelles couvrent l’année civile (ou la campagne) et se mettent à jour quand NASS les publie.', src: 'Source' },
    it: { intro: '{n} tra frutta, ortaggi e frutta secca degli Stati Uniti. Prezzo ricevuto dall’agricoltore (USDA NASS), media nazionale, in dollari e nell’unità pubblicata dalla fonte.', find: 'Cerca un prodotto', all: 'Tutti', veg: 'Ortaggi', fruit: 'Frutta', nut: 'Frutta secca',
      cols: ['Prodotto', 'Prezzo', 'Periodo precedente', 'Un anno fa', 'Frequenza', 'Periodo'], m: 'mensile', a: 'annuale', none: 'Nessun prodotto corrisponde.', note: 'Unità della fonte: lb = libbra (0,4536 kg); cwt = 100 libbre (45,36 kg); short ton = tonnellata corta (907 kg); box = cassa (il peso varia per prodotto); barrel = barile di mirtilli rossi (100 libbre). «Sull’albero» è il prezzo della frutta non raccolta né imballata. Le serie annuali coprono l’anno solare (o la campagna) e si aggiornano quando NASS le pubblica.', src: 'Fonte' }
  };
  var USDOC = null;
  function renderUS(el, opt) {
    var lg = US[opt.lang] ? opt.lang : 'es', t = US[lg], L = LOC[lg], li = LI[lg];
    function n(v, d) { return v == null || !isFinite(v) ? '—' : v.toLocaleString(L, { minimumFractionDigits: d, maximumFractionDigits: d }); }
    function per(s) { return s.length === 7 ? new Date(s + '-15T12:00:00Z').toLocaleDateString(L, { month: 'short', year: 'numeric', timeZone: 'UTC' }) : s; }
    function chg(a, b) { if (a == null || b == null || !b) return '—'; var p = (a / b - 1) * 100; return '$' + n(b, b < 10 ? 3 : b < 1000 ? 2 : 0) + ' <small class="' + (p > 0.5 ? 'fv-up' : p < -0.5 ? 'fv-dn' : '') + '">' + (p > 0 ? '+' : p < 0 ? '−' : '') + n(Math.abs(p), 1) + ' %</small>'; }
    var go = function (D) {
      if (!D || !D.items) return false;
      var grp = [['all', t.all], ['veg', t.veg], ['fruit', t.fruit], ['nut', t.nut]];
      var head = '<p class="fv-intro">' + esc(t.intro.replace('{n}', D.items.length)) + '</p><div class="fv-ctl"><label><span>' + esc(t.find) + '</span><input type="search" class="di-compare-select fv-q" value="' + esc(ST.q) + '" placeholder="' + esc(t.find) + '"></label><div class="fv-chips" role="group">' + grp.map(function (g) { return '<button type="button" class="fv-chip' + (ST.g === g[0] ? ' on' : '') + '" data-g="' + g[0] + '">' + esc(g[1]) + '</button>'; }).join('') + '</div></div>';
      var qn = norm(ST.q), groups = ST.g === 'all' ? ['veg', 'fruit', 'nut'] : [ST.g], body = '', shown = 0;
      groups.forEach(function (g) {
        var L2 = D.items.filter(function (p) { return p.g === g && (!qn || norm(p.n.join(' ')).indexOf(qn) >= 0); }).sort(function (a, b) { return a.n[li].localeCompare(b.n[li], L); });
        if (!L2.length) return; shown += L2.length;
        body += '<tbody><tr class="fv-gh"><th colspan="6" scope="colgroup">' + esc(t[g]) + '</th></tr>' + L2.map(function (p) {
          var d = p.v < 10 ? 3 : p.v < 1000 ? 2 : 0;
          return '<tr><th scope="row">' + (p.e ? '<span class="fv-emo" aria-hidden="true">' + p.e + '</span>' : '') + esc(p.n[li]) + '</th><td class="cof-n"><b>$' + n(p.v, d) + '</b> <small>/' + esc(p.u) + '</small></td><td class="cof-n">' + chg(p.v, p.p) + '</td><td class="cof-n">' + chg(p.v, p.y) + '</td><td class="fv-k">' + esc(p.m ? t.m : t.a) + '</td><td class="fv-d">' + esc(per(p.d)) + '</td></tr>';
        }).join('') + '</tbody>';
      });
      var table = shown ? '<div style="overflow-x:auto"><table class="cof-tbl fv-tbl"><thead><tr>' + t.cols.map(function (c, i) { return '<th scope="col"' + (i && i < 4 ? ' class="cof-n"' : '') + '>' + esc(c) + '</th>'; }).join('') + '</tr></thead>' + body + '</table></div>' : '<p class="di-field-hint">' + esc(t.none) + '</p>';
      el.innerHTML = '<section class="di-card fv-card">' + head + table + '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:6px 0 0">' + esc(t.src) + ': <a href="' + esc(D.source.url) + '" rel="noopener">' + esc(D.source.name) + '</a></p></section>';
      var qi = el.querySelector('.fv-q'); if (qi) qi.oninput = function () { ST.q = qi.value; var pos = qi.selectionStart; renderUS(el, opt).then(function () { var f = el.querySelector('.fv-q'); if (f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (e) {} } }); };
      Array.prototype.forEach.call(el.querySelectorAll('.fv-chip'), function (b) { b.onclick = function () { ST.g = b.getAttribute('data-g'); renderUS(el, opt).then(function () { var f = el.querySelector('.fv-chip[data-g="' + ST.g + '"]'); if (f) f.focus(); }); }; });
      return true;
    };
    return (USDOC || (USDOC = fetch('data/views/fv-us.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }))).then(go);
  }
  function render(el, opt) {
    if (!el) return Promise.resolve(false); opt = opt || {};
    if (opt.location === 'us') return renderUS(el, opt);
    var lg = T[opt.lang] ? opt.lang : 'es', t = T[lg], L = LOC[lg];
    function n(v, d) { return v == null || !isFinite(v) ? '—' : v.toLocaleString(L, { minimumFractionDigits: d, maximumFractionDigits: d }); }
    function day(s) { return new Date(s + 'T12:00:00Z').toLocaleDateString(L, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
    function mon(s) { return new Date(s + '-15T12:00:00Z').toLocaleDateString(L, { month: 'short', year: 'numeric', timeZone: 'UTC' }); }
    function chg(a, b) { if (a == null || b == null || !b) return '—'; var p = (a / b - 1) * 100; return n(b, 2) + ' <small class="' + (p > 0.5 ? 'fv-up' : p < -0.5 ? 'fv-dn' : '') + '">' + (p > 0 ? '+' : p < 0 ? '−' : '') + n(Math.abs(p), 0) + ' %</small>'; }
    return load().then(function (D) {
      if (!D || !D.products) return false;
      var ccs = D.countries.slice().sort(function (a, b) { return (CN[a] || [a])[LI[lg]].localeCompare((CN[b] || [b])[LI[lg]], L); });
      var pref = opt.location === 'eu' && opt.euCountry ? String(opt.euCountry).toUpperCase() : 'ES'; if (!ST.cc || ST.pref !== pref) { ST.pref = pref; ST.cc = ccs.indexOf(pref) >= 0 ? pref : 'ES'; }
      var cc = ST.cc, isES = cc === 'ES', now = Date.now();
      var grp = [['all', t.all], ['veg', t.veg], ['fruit', t.fruit], ['nut', t.nut]];
      var head = '<p class="fv-intro">' + esc(t.intro.replace('{n}', D.products.length)) + '</p><div class="fv-ctl"><label><span>' + esc(t.ctry) + '</span><select class="di-compare-select fv-cc">' + ccs.map(function (c) { return '<option value="' + c + '"' + (c === cc ? ' selected' : '') + '>' + esc((CN[c] || [c])[LI[lg]]) + '</option>'; }).join('') + '</select></label>' +
        '<label><span>' + esc(t.find) + '</span><input type="search" class="di-compare-select fv-q" value="' + esc(ST.q) + '" placeholder="' + esc(t.find) + '"></label><div class="fv-chips" role="group">' + grp.map(function (g) { return '<button type="button" class="fv-chip' + (ST.g === g[0] ? ' on' : '') + '" data-g="' + g[0] + '" aria-pressed="' + (ST.g === g[0]) + '">' + esc(g[1]) + '</button>'; }).join('') + '</div></div>';
      var qn = norm(ST.q), groups = ST.g === 'all' ? ['veg', 'fruit', 'nut'] : [ST.g], body = '', shown = 0, hid = 0;
      /* solo productos con dato del país elegido: nunca se rellena con lo de otro país */
      var has = function (p) { return !!(p.eu && p.eu.latest && p.eu.latest[cc]) || (isES && !!p.perc); };
      groups.forEach(function (g) {
        var L2 = D.products.filter(function (p) { return p.group === g && (!qn || norm(p.name[lg] + ' ' + p.name.es + ' ' + p.name.en).indexOf(qn) >= 0); })
          .sort(function (a, b) { return (a.name[lg] || a.name.es).localeCompare(b.name[lg] || b.name.es, L); });
        hid += L2.filter(function (p) { return !has(p); }).length; L2 = L2.filter(has);
        if (!L2.length) return; shown += L2.length;
        body += '<tbody><tr class="fv-gh"><th colspan="' + (isES ? 7 : 6) + '" scope="colgroup">' + esc(t[g]) + '</th></tr>' + L2.map(function (p) {
          var x = p.eu && p.eu.latest && p.eu.latest[cc], old = x && now - Date.parse(x.d) > 56 * DAY, nm = p.name[lg] || p.name.es;
          var pc = isES && p.perc ? n(p.perc.v, 2) + ' <small>' + esc(mon(p.perc.m)) + '</small>' : isES ? '—' : null;
          return '<tr class="' + (old ? 'fv-old' : '') + (x ? '' : ' fv-nodata') + '"><th scope="row"><a href="producto.html?p=' + p.id + (cc !== 'ES' ? '&c=' + cc : '') + '">' + (p.emoji ? '<span class="fv-emo" aria-hidden="true">' + p.emoji + '</span>' : '') + esc(nm) + '</a></th>' +
            (x ? '<td class="cof-n"><b>' + n(x.v, 2) + '</b></td><td class="cof-n">' + chg(x.v, x.p) + '</td><td class="cof-n">' + chg(x.v, x.y) + '</td><td class="fv-k">' + esc(STG[x.stage][LI[lg]]) + '</td><td class="fv-d">' + esc(day(x.d)) + (old ? ' <small>· ' + esc(t.old) + '</small>' : '') + '</td>'
              : '<td class="cof-n">—</td><td colspan="4" class="fv-k">' + esc(t.none) + '</td>') + (pc != null ? '<td class="cof-n">' + pc + '</td>' : '') + '</tr>';
        }).join('') + '</tbody>';
      });
      var table = shown ? '<div style="overflow-x:auto"><table class="cof-tbl fv-tbl"><thead><tr>' + t.cols.map(function (c, i) { return '<th scope="col"' + (i && i < 4 ? ' class="cof-n"' : '') + '>' + esc(c) + (i === 1 ? ' (€/kg)' : '') + '</th>'; }).join('') + (isES ? '<th scope="col" class="cof-n">' + esc(t.mapa) + ' (€/kg)</th>' : '') + '</tr></thead>' + body + '</table></div>' : '<p class="di-movers-hint">' + esc(t.noRow) + '</p>';
      el.innerHTML = '<section class="di-card fv-card">' + head + table + (hid ? '<p class="di-field-hint" style="margin:8px 0 0">' + esc(t.hid.replace('{n}', hid).replace('{c}', (CN[cc] || [cc])[LI[lg]])) + '</p>' : '') + '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:6px 0 0">' + esc(t.src) + ' <a href="https://agridata.ec.europa.eu/" target="_blank" rel="noopener noreferrer">' + esc(t.sEU) + '</a>' + (isES ? '; <a href="https://servicio.mapa.gob.es/ckan/dataset/esmapaindicespreciospreciopercibido" target="_blank" rel="noopener noreferrer">' + esc(t.sMAPA) + '</a>' : '') + '</p></section>';
      var c = el.querySelector('.fv-cc'); if (c) c.onchange = function () { ST.cc = c.value; render(el, opt).then(function () { var f = el.querySelector('.fv-cc'); if (f) f.focus(); }); };
      var qi = el.querySelector('.fv-q'); if (qi) qi.oninput = function () { ST.q = qi.value; var pos = qi.selectionStart; render(el, opt).then(function () { var f = el.querySelector('.fv-q'); if (f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (e) {} } }); };
      Array.prototype.forEach.call(el.querySelectorAll('.fv-chip'), function (b) { b.onclick = function () { ST.g = b.getAttribute('data-g'); render(el, opt).then(function () { var f = el.querySelector('.fv-chip[data-g="' + ST.g + '"]'); if (f) f.focus(); }); }; });
      return true;
    });
  }
  global.DehesaFV = { render: render, load: load };
})(window);
