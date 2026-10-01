/* Producto x socio del comercio exterior agroalimentario (Eurostat Comext, CC BY 4.0) - ES5, sin librerías.
   Lee data/eu-trade-products.json. Uso: DITradePartners.mount(el, 'ES', lang) */
(function () {
  var T = {
    es: { title: 'Comercio por producto y socio', product: 'Producto', flow: 'Flujo', year: 'Año', exp: 'Exportaciones (destinos)', imp: 'Importaciones (orígenes)', partner: 'País', value: 'Millones de €', share: '% del total', chg: 'Var. vs año anterior',
      world: 'Total mundo', extra: 'Fuera de la UE', intra: 'Dentro de la UE', top: 'Principales socios', none: 'Sin datos de comercio por socio para este país.',
      note: 'Valor en millones de euros; el ranking muestra los 10 mayores socios del último año completo. Comercio dentro de la UE incluido. En Países Bajos y Bélgica una parte importante es tránsito y reexportación.', note2: 'Valor en moneda local (millones); el ranking muestra los 10 mayores socios del último año completo.', note3: 'Para Canadá los «socios» son acuerdos de libre comercio (cada importación o exportación se asigna al acuerdo aplicable); millones de dólares canadienses.', src: 'Fuente', lic: 'Licencia' },
    en: { title: 'Trade by product and partner', product: 'Product', flow: 'Flow', year: 'Year', exp: 'Exports (destinations)', imp: 'Imports (origins)', partner: 'Country', value: 'EUR million', share: '% of total', chg: 'Change vs previous year',
      world: 'World total', extra: 'Outside the EU', intra: 'Within the EU', top: 'Main partners', none: 'No partner trade data for this country.',
      note: 'Value in EUR million; the ranking shows the 10 largest partners of the latest complete year. Intra-EU trade included. For the Netherlands and Belgium a large share is transit and re-exports.', note2: 'Value in local currency (millions); the ranking shows the 10 largest partners of the latest complete year.', note3: 'For Canada the “partners” are free trade agreements (each import or export is assigned to the applicable agreement); CAD million.', src: 'Source', lic: 'Licence' },
    fr: { title: 'Commerce par produit et partenaire', product: 'Produit', flow: 'Flux', year: 'Année', exp: 'Exportations (destinations)', imp: 'Importations (origines)', partner: 'Pays', value: 'Millions d’€', share: '% du total', chg: 'Var. vs année précédente',
      world: 'Total monde', extra: 'Hors UE', intra: 'Dans l’UE', top: 'Principaux partenaires', none: 'Pas de données par partenaire pour ce pays.',
      note: 'Valeur en millions d’euros ; le classement montre les 10 premiers partenaires de la dernière année complète. Commerce intra-UE inclus. Aux Pays-Bas et en Belgique, une part importante est du transit et de la réexportation.', note2: 'Valeur en monnaie locale (millions) ; le classement montre les 10 premiers partenaires de la dernière année complète.', note3: 'Pour le Canada, les « partenaires » sont les accords de libre-échange (chaque importation ou exportation est affectée à l’accord applicable) ; millions de CAD.', src: 'Source', lic: 'Licence' },
    it: { title: 'Commercio per prodotto e partner', product: 'Prodotto', flow: 'Flusso', year: 'Anno', exp: 'Esportazioni (destinazioni)', imp: 'Importazioni (origini)', partner: 'Paese', value: 'Milioni di €', share: '% del totale', chg: 'Var. vs anno precedente',
      world: 'Totale mondo', extra: 'Fuori dalla UE', intra: 'Dentro la UE', top: 'Principali partner', none: 'Nessun dato per partner per questo paese.',
      note: 'Valore in milioni di euro; la classifica mostra i 10 maggiori partner dell’ultimo anno completo. Commercio intra-UE incluso. Nei Paesi Bassi e in Belgio una quota importante è transito e riesportazione.', note2: 'Valore in valuta locale (milioni); la classifica mostra i 10 maggiori partner dell’ultimo anno completo.', note3: 'Per il Canada i «partner» sono gli accordi di libero scambio (ogni importazione o esportazione è assegnata all’accordo applicabile); milioni di CAD.', src: 'Fonte', lic: 'Licenza' }
  };
  var P = {
    es: { '0': 'Total agroalimentario', '001': 'Animales vivos', '011': 'Carne de vacuno', '012': 'Otras carnes (incl. ovino)', '022': 'Leche y nata', '024': 'Queso y cuajada', '041': 'Trigo', '043': 'Cebada', '044': 'Maíz', '061': 'Azúcar', '112': 'Bebidas alcohólicas (incl. vino)', '222': 'Oleaginosas (colza, etc.)', '263': 'Algodón', '268': 'Lana', '56': 'Fertilizantes', '01': 'Animales vivos', '02': 'Carne', '04': 'Lácteos, huevos y miel', '07': 'Hortalizas', '08': 'Fruta y frutos secos', '10': 'Cereales', '12': 'Oleaginosas', '15': 'Grasas y aceites', '17': 'Azúcar', '22': 'Bebidas (incl. vino)', '23': 'Piensos y residuos alimentarios', '31': 'Fertilizantes', '1509': 'Aceite de oliva', '45': 'Corcho' },
    en: { '0': 'Agri-food total', '001': 'Live animals', '011': 'Bovine meat', '012': 'Other meat (incl. sheep meat)', '022': 'Milk and cream', '024': 'Cheese and curd', '041': 'Wheat', '043': 'Barley', '044': 'Maize', '061': 'Sugar', '112': 'Alcoholic beverages (incl. wine)', '222': 'Oilseeds (canola etc.)', '263': 'Cotton', '268': 'Wool', '56': 'Fertilisers', '01': 'Live animals', '02': 'Meat', '04': 'Dairy, eggs and honey', '07': 'Vegetables', '08': 'Fruit and nuts', '10': 'Cereals', '12': 'Oilseeds', '15': 'Fats and oils', '17': 'Sugar', '22': 'Beverages (incl. wine)', '23': 'Animal feed and food residues', '31': 'Fertilisers', '1509': 'Olive oil', '45': 'Cork' },
    fr: { '0': 'Total agroalimentaire', '001': 'Animaux vivants', '011': 'Viande bovine', '012': 'Autres viandes (dont ovine)', '022': 'Lait et crème', '024': 'Fromage et caillé', '041': 'Blé', '043': 'Orge', '044': 'Maïs', '061': 'Sucre', '112': 'Boissons alcoolisées (dont vin)', '222': 'Oléagineux (colza, etc.)', '263': 'Coton', '268': 'Laine', '56': 'Engrais', '01': 'Animaux vivants', '02': 'Viande', '04': 'Produits laitiers, œufs et miel', '07': 'Légumes', '08': 'Fruits et fruits à coque', '10': 'Céréales', '12': 'Oléagineux', '15': 'Graisses et huiles', '17': 'Sucre', '22': 'Boissons (dont vin)', '23': 'Aliments pour animaux et résidus', '31': 'Engrais', '1509': 'Huile d’olive', '45': 'Liège' },
    it: { '0': 'Totale agroalimentare', '001': 'Animali vivi', '011': 'Carne bovina', '012': 'Altre carni (incl. ovina)', '022': 'Latte e panna', '024': 'Formaggio e cagliata', '041': 'Grano', '043': 'Orzo', '044': 'Mais', '061': 'Zucchero', '112': 'Bevande alcoliche (incl. vino)', '222': 'Semi oleosi (colza, ecc.)', '263': 'Cotone', '268': 'Lana', '56': 'Fertilizzanti', '01': 'Animali vivi', '02': 'Carne', '04': 'Latticini, uova e miele', '07': 'Ortaggi', '08': 'Frutta e frutta secca', '10': 'Cereali', '12': 'Semi oleosi', '15': 'Grassi e oli', '17': 'Zucchero', '22': 'Bevande (incl. vino)', '23': 'Mangimi e residui alimentari', '31': 'Fertilizzanti', '1509': 'Olio d’oliva', '45': 'Sughero' }
  };
  var FILES = { AU: 'data/au-trade-products.json', CA: 'data/ca-trade-products.json' }, CACHE = {};
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, lang) { if (v == null) return '–'; try { return v.toLocaleString(lang, { maximumFractionDigits: v >= 100 ? 0 : 1 }); } catch (e) { return String(Math.round(v)); } }
  function load(cc) {
    var f = FILES[cc] || 'data/eu-trade-products.json';
    if (!CACHE[f]) CACHE[f] = fetch(f).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return CACHE[f];
  }
  function mount(el, cc, lang) {
    var t = T[lang] || T.es, pn = P[lang] || P.es;
    load(cc).then(function (d) {
      if (!d || !d.reporters || !d.reporters[cc]) { el.innerHTML = ''; return; }
      var prods = d.reporters[cc], keys = Object.keys(prods), st = { p: prods['10'] ? '10' : keys[0], f: 'exp', y: d.years.length - 1 };
      function draw() {
        var node = prods[st.p][st.f], i = st.y, last = d.years.length - 1;
        var opts = function (arr, sel, lab) { return arr.map(function (k) { return '<option value="' + esc(k) + '"' + (String(k) === String(sel) ? ' selected' : '') + '>' + esc(lab(k)) + '</option>'; }).join(''); };
        var sl = function (id, label, inner) { return '<label style="font-size:13px;flex:1;min-width:150px">' + label + '<br><select id="' + id + '" class="di-compare-select">' + inner + '</select></label>'; };
        var html = '<div class="di-card" style="padding:16px 18px;margin-top:18px"><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:10px">' + esc(t.title.toUpperCase()) + '</div>' +
          '<div style="display:flex;gap:14px;flex-wrap:wrap;margin:0 0 12px">' +
          sl('tp-p', t.product, opts(keys, st.p, function (k) { return pn[k] || prods[k].name; })) +
          sl('tp-f', t.flow, opts(['exp', 'imp'], st.f, function (k) { return t[k]; })) +
          sl('tp-y', t.year, opts(d.years.map(function (y, n) { return n; }).reverse(), st.y, function (n) { return d.years[n]; })) + '</div>';
        if (!node) { el.innerHTML = html + '<p class="di-movers-hint">' + t.none + '</p></div>'; bind(); return; }
        var tot = node.world ? node.world[i] : null, mx = 0;
        node.partners.forEach(function (r) { if (r.v[i] > mx) mx = r.v[i]; });
        var row = function (name, v, prev, bold, bar) {
          var sh = tot && v != null ? v / tot * 100 : null, ch = prev ? (v / prev - 1) * 100 : null;
          return '<tr style="border-top:1px solid var(--border)' + (bold ? ';font-weight:700' : '') + '"><td style="padding:7px 6px">' + esc(name) + (bar && mx && v ? '<div style="height:5px;margin-top:4px;border-radius:3px;background:#2f6b4a;width:' + Math.max(2, Math.round(v / mx * 100)) + '%"></div>' : '') + '</td>' +
            '<td style="padding:7px 6px;text-align:right;white-space:nowrap">' + nf(v, lang) + '</td><td style="padding:7px 6px;text-align:right">' + (sh == null ? '' : nf(sh, lang) + ' %') + '</td>' +
            '<td style="padding:7px 6px;text-align:right;white-space:nowrap;color:' + (ch == null ? 'inherit' : ch >= 0 ? '#2f6b4a' : '#a33') + '">' + (ch == null || i === 0 ? '' : (ch > 0 ? '+' : ch < 0 ? '−' : '') + nf(Math.abs(ch), lang) + ' %') + '</td></tr>';
        };
        var pv = function (arr) { return arr && i > 0 ? arr[i - 1] : null; };
        html += '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:460px;font-size:13.5px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:6px">' + esc(t.partner) + '</th><th style="padding:6px;text-align:right">' + esc(t.value) + '</th><th style="padding:6px;text-align:right">' + esc(t.share) + '</th><th style="padding:6px;text-align:right">' + esc(t.chg) + '</th></tr>';
        if (node.world) html += row(t.world, node.world[i], pv(node.world), true);
        if (node.intra) html += row(t.intra, node.intra[i], pv(node.intra), false);
        if (node.extra) html += row(t.extra, node.extra[i], pv(node.extra), false);
        node.partners.slice().sort(function (a, b) { return (b.v[i] || 0) - (a.v[i] || 0); }).forEach(function (r) { if (r.v[i]) html += row(r.n, r.v[i], pv(r.v), false, true); });
        html += '</table></div><p class="di-movers-hint" style="margin-top:10px">' + (cc === 'CA' ? t.note3 : cc === 'AU' ? t.note2 : t.note) + '</p><p class="di-movers-hint">' + t.src + ': <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener">' + esc(d.source.name) + '</a> · ' + t.lic + ': ' + esc(d.source.license) + '</p></div>';
        el.innerHTML = html; bind();
      }
      function bind() {
        var m = { 'tp-p': 'p', 'tp-f': 'f', 'tp-y': 'y' };
        Object.keys(m).forEach(function (id) { var e = document.getElementById(id); if (e) e.onchange = function (ev) { st[m[id]] = id === 'tp-y' ? parseInt(ev.target.value, 10) : ev.target.value; draw(); var n = document.getElementById(id); if (n) n.focus(); }; });
      }
      draw();
    });
  }
  window.DITradePartners = { mount: mount };
})();
