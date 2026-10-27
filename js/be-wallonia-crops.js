/* Dehesa Index — Valonia: superficie por cultivo del parcelario agrícola anónimo del SIGEC (SPW, PAC), campañas 2015 en adelante.
   data/be-wallonia-crops.json (scripts/update-be-wallonia-crops.py). Bloque de la ficha de Bélgica. ES5. window.DIBeWalCrops. Usa window.ESUI (js/es-ui.js). */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Cultivos en Valonia (SIGEC, parcelario de la PAC)', at: 'Campañas {a}–{b}. Superficie declarada a la PAC en Valonia, sumada por cultivo.', view: 'Ver', vc: 'Por cultivo', vg: 'Por grupo', trend: 'Evolución', crop: 'Cultivo', total: 'Superficie declarada', tot_n: '{p} % frente a {y}', parc: 'Parcelas', top: 'Cultivo principal', share: 'del total', byc: 'Superficie por cultivo, campaña {y}', byg: 'Superficie por grupo, campaña {y}', tw: 'Total declarado', ha: 'ha', since: 'Variación {a}–{b}', nom: 'Los códigos de cultivo se mantienen, pero el SPW cambió la clasificación durante la serie: por ejemplo «Otros» (código 99) baja de 42.000 ha en 2015 a 6.000 en 2022 al repartirse en cultivos nuevos, y desde 2022 hay códigos nuevos (mezclas de cereales). Una caída o subida brusca puede ser un cambio de clasificación y no de siembra.', sc: 'Es la superficie que los agricultores declaran a la PAC (parcelas agrícolas y forestales gestionadas por el organismo pagador de Valonia), no la superficie agraria total ni una estadística de cosecha. Los nombres de cultivos sin traducción se muestran en francés, como los publica el SPW. Agregación de Dehesa Index sobre los datos abiertos del SPW.', nd: 'Sin datos por ahora.', ter: 'Por provincia y región agrícola', kP: 'Provincias', kR: 'Regiones agrícolas', tcrop: 'Cultivo', tall: 'Todo lo declarado', tzone: 'Zona', ofzone: 'de la superficie de la zona', bz: 'Superficie en {z}', terN: 'Las regiones agrícolas son las zonas de rendimiento de la PAC definidas por el SPW (Limoneuse, Condroz, Ardenne, Famenne…). Una parcela que cruza el límite de dos zonas cuenta entera en las dos, por eso la suma de zonas supera al total de Valonia en torno a un 1 %. De cada zona solo se guardan los cultivos con al menos 50 ha en ella.' },
    en: { h: 'Crops in Wallonia (SIGEC, CAP parcel register)', at: 'Campaigns {a}–{b}. Area declared under the CAP in Wallonia, summed by crop.', view: 'View', vc: 'By crop', vg: 'By group', trend: 'Trend', crop: 'Crop', total: 'Declared area', tot_n: '{p} % vs {y}', parc: 'Parcels', top: 'Main crop', share: 'of the total', byc: 'Area by crop, {y} campaign', byg: 'Area by group, {y} campaign', tw: 'Declared total', ha: 'ha', since: 'Change {a}–{b}', nom: 'Crop codes are kept, but the SPW changed its classification during the series: for example “Other” (code 99) falls from 42,000 ha in 2015 to 6,000 in 2022 as it was split into new crops, and since 2022 there are new codes (cereal mixtures). A sudden rise or fall may be a reclassification, not a change in sowing.', sc: 'This is the area farmers declare under the CAP (agricultural and forest parcels handled by the Walloon paying agency), not total farmland nor a harvest statistic. Crop names without a translation are shown in French, as the SPW publishes them. Aggregation by Dehesa Index of the SPW open data.', nd: 'No data yet.', ter: 'By province and agricultural region', kP: 'Provinces', kR: 'Agricultural regions', tcrop: 'Crop', tall: 'All declared land', tzone: 'Area', ofzone: 'of the area’s land', bz: 'Area in {z}', terN: 'Agricultural regions are the CAP yield zones defined by the SPW (Limoneuse, Condroz, Ardenne, Famenne…). A parcel crossing the boundary of two zones counts in full in both, so the sum of zones exceeds the Wallonia total by about 1 %. Only crops with at least 50 ha in the zone are stored for it.' },
    fr: { h: 'Cultures en Wallonie (SIGEC, parcellaire de la PAC)', at: 'Campagnes {a}–{b}. Superficie déclarée à la PAC en Wallonie, additionnée par culture.', view: 'Voir', vc: 'Par culture', vg: 'Par groupe', trend: 'Évolution', crop: 'Culture', total: 'Superficie déclarée', tot_n: '{p} % par rapport à {y}', parc: 'Parcelles', top: 'Culture principale', share: 'du total', byc: 'Superficie par culture, campagne {y}', byg: 'Superficie par groupe, campagne {y}', tw: 'Total déclaré', ha: 'ha', since: 'Variation {a}–{b}', nom: 'Les codes de culture sont conservés, mais le SPW a modifié sa classification au fil de la série : par exemple « Autres » (code 99) passe de 42 000 ha en 2015 à 6 000 en 2022 en se répartissant en nouvelles cultures, et depuis 2022 il y a de nouveaux codes (mélanges de céréales). Une hausse ou une baisse brutale peut être un changement de classification et non de semis.', sc: 'Il s’agit de la superficie déclarée à la PAC par les agriculteurs (parcelles agricoles et forestières gérées par l’organisme payeur wallon), pas de la superficie agricole totale ni d’une statistique de récolte. Agrégation de Dehesa Index sur les données ouvertes du SPW.', nd: 'Pas encore de données.', ter: 'Par province et région agricole', kP: 'Provinces', kR: 'Régions agricoles', tcrop: 'Culture', tall: 'Toute la superficie déclarée', tzone: 'Zone', ofzone: 'de la superficie de la zone', bz: 'Superficie en {z}', terN: 'Les régions agricoles sont les zones de rendement de la PAC définies par le SPW (Limoneuse, Condroz, Ardenne, Famenne…). Une parcelle à cheval sur deux zones compte entièrement dans les deux ; la somme des zones dépasse donc le total de la Wallonie d’environ 1 %. Seules les cultures d’au moins 50 ha dans la zone y sont conservées.' },
    it: { h: 'Colture in Vallonia (SIGEC, particellare della PAC)', at: 'Campagne {a}–{b}. Superficie dichiarata alla PAC in Vallonia, sommata per coltura.', view: 'Vista', vc: 'Per coltura', vg: 'Per gruppo', trend: 'Andamento', crop: 'Coltura', total: 'Superficie dichiarata', tot_n: '{p} % rispetto al {y}', parc: 'Particelle', top: 'Coltura principale', share: 'del totale', byc: 'Superficie per coltura, campagna {y}', byg: 'Superficie per gruppo, campagna {y}', tw: 'Totale dichiarato', ha: 'ha', since: 'Variazione {a}–{b}', nom: 'I codici coltura restano, ma l’SPW ha cambiato la classificazione durante la serie: per esempio «Altri» (codice 99) scende da 42.000 ha nel 2015 a 6.000 nel 2022 perché ripartito in nuove colture, e dal 2022 ci sono codici nuovi (miscugli di cereali). Un balzo o un calo improvviso può essere una riclassificazione e non un cambio di semina.', sc: 'È la superficie che gli agricoltori dichiarano alla PAC (particelle agricole e forestali gestite dall’organismo pagatore vallone), non la superficie agricola totale né una statistica di raccolto. I nomi delle colture senza traduzione restano in francese, come li pubblica l’SPW. Aggregazione di Dehesa Index sui dati aperti dell’SPW.', nd: 'Ancora nessun dato.', ter: 'Per provincia e regione agricola', kP: 'Province', kR: 'Regioni agricole', tcrop: 'Coltura', tall: 'Tutta la superficie dichiarata', tzone: 'Zona', ofzone: 'della superficie della zona', bz: 'Superficie in {z}', terN: 'Le regioni agricole sono le zone di resa della PAC definite dall’SPW (Limoneuse, Condroz, Ardenne, Famenne…). Una particella a cavallo di due zone conta per intero in entrambe, perciò la somma delle zone supera il totale della Vallonia di circa l’1 %. Per ogni zona si conservano solo le colture con almeno 50 ha.' }
  };
  var LG = { es: 0, en: 1, fr: 2, it: 3 };
  var CR = {
    '6': 'Pradera y forraje|Grassland and fodder|Prairie et fourrage|Prato e foraggio',
    '311': 'Trigo blando de invierno|Winter wheat|Froment d\'hiver|Frumento tenero invernale',
    '201': 'Maíz de ensilado|Silage maize|Maïs ensilage|Mais da insilato',
    '202': 'Maíz grano|Grain maize|Maïs grain|Mais da granella',
    '901': 'Patata (no temprana)|Potato (maincrop)|Pomme de terre (non hâtive)|Patata (non precoce)',
    '91': 'Remolacha azucarera|Sugar beet|Betterave sucrière|Barbabietola da zucchero',
    '321': 'Cebada de invierno|Winter barley|Orge d\'hiver|Orzo invernale',
    '4111': 'Colza de invierno|Winter rapeseed|Colza d\'hiver|Colza invernale',
    '921': 'Lino textil|Fibre flax|Lin textile|Lino tessile',
    '36': 'Espelta|Spelt|Épeautre|Farro spelta',
    '931': 'Guisantes frescos (conserva)|Fresh peas (canning)|Pois frais (conserverie)|Piselli freschi (conserva)',
    '9811': 'Achicoria para inulina|Inulin chicory|Chicorée à inuline|Cicoria da inulina',
    '99': 'Otros (código 99)|Other (code 99)|Autres (code 99)|Altri (codice 99)',
    '73': 'Alfalfa|Lucerne|Luzerne|Erba medica',
    '351': 'Triticale de invierno|Winter triticale|Triticale d\'hiver|Triticale invernale',
    '80': 'Barbecho|Fallow|Jachère|Maggese',
    '342': 'Avena de primavera|Spring oats|Avoine de printemps|Avena primaverile',
    '9410': 'Judías|Beans|Haricots|Fagioli',
    '322': 'Cebada de primavera|Spring barley|Orge de printemps|Orzo primaverile',
    '312': 'Trigo blando de primavera|Spring wheat|Froment de printemps|Frumento tenero primaverile'
  };
  var GR = {
    'Production fourragère': 'Producción forrajera|Fodder production|Production fourragère|Produzione foraggera',
    'Céréales et assimilés': 'Cereales y asimilados|Cereals and similar|Céréales et assimilés|Cereali e assimilati',
    'Autres utilisations': 'Otros usos|Other uses|Autres utilisations|Altri usi',
    'Pommes de terre': 'Patatas|Potatoes|Pommes de terre|Patate',
    'Cultures horticoles et maraîchères': 'Hortalizas y horticultura|Horticulture and vegetables|Cultures horticoles et maraîchères|Orticoltura e ortaggi',
    'Oléagineux': 'Oleaginosas|Oilseeds|Oléagineux|Oleaginose',
    'Plantes à fibres': 'Plantas textiles|Fibre crops|Plantes à fibres|Piante da fibra',
    'Fruits à coque': 'Frutos de cáscara|Nuts|Fruits à coque|Frutta a guscio'
  };
  var AN = {
    'BE31': 'Brabante Valón|Walloon Brabant|Brabant wallon|Brabante Vallone', 'BE32': 'Henao|Hainaut|Hainaut|Hainaut', 'BE33': 'Lieja|Liège|Liège|Liegi', 'BE34': 'Luxemburgo|Luxembourg|Luxembourg|Lussemburgo', 'BE35': 'Namur|Namur|Namur|Namur',
    'Lim': 'Limoneuse (región limosa)|Limoneuse (loam belt)|Limoneuse (région limoneuse)|Limoneuse (fascia limosa)', 'Con': 'Condroz|Condroz|Condroz|Condroz', 'Ard': 'Ardenne|Ardenne|Ardenne|Ardenne', 'Fam': 'Famenne|Famenne|Famenne|Famenne',
    'Her': 'Región herbagera|Grassland region|Région herbagère|Regione erbosa', 'SLi': 'Arenolimosa|Sandy-loam region|Sablo-limoneuse|Sabbioso-limosa', 'Jur': 'Jurásica|Jurassic region|Jurassique|Giurassica', 'HAr': 'Alta Ardenne|Upper Ardennes|Haute Ardenne|Alta Ardenna',
    'Fag': 'Fagnes|Fagnes|Fagnes|Fagnes', 'CHe': 'Campiña de Henao|Hainaut Campine|Campine hennuyère|Campine dell’Hainaut'
  };
  var U = global.ESUI, ST = { view: 'crops', crop: '311', kind: 'province', acrop: 'all', zone: null }, D = null;
  function an(a, lg) { var s = AN[a.id]; return s ? (s.split('|')[LG[lg]] || a.name) : a.name; }
  function cn(c, lg) { var s = CR[c.code]; return s ? (s.split('|')[LG[lg]] || c.name) : c.name; }
  function gn(g, lg) { var s = GR[g]; return s ? (s.split('|')[LG[lg]] || g) : g; }
  function fx(s, o) { return U.f(s, o); }
  function card(n, v, note) { return '<div class="di-card cof-card"><div class="cof-lbl">' + n + '</div><div class="cof-val">' + v + '</div>' + (note ? '<div class="cof-note" style="margin:2px 0 0">' + note + '</div>' : '') + '</div>'; }
  function pct(a, b) { return b ? (a / b - 1) * 100 : null; }
  function sg(v, d) { return v == null ? '–' : (v > 0 ? '+' : v < 0 ? '−' : '') + U.nf(Math.abs(v), d); }
  function topCrops(d) {
    return d.crops.filter(function (c) { return Math.max.apply(null, c.ha.map(function (v) { return v || 0; })) >= 2000; }).sort(function (a, b) {
      return Math.max.apply(null, b.ha.map(function (v) { return v || 0; })) - Math.max.apply(null, a.ha.map(function (v) { return v || 0; }));
    });
  }
  function areaVal(a, code, i) { return code === 'all' ? a.ha[i] : (a.crops[code] ? a.crops[code][i] : null); }
  function territory(d, lg, t, list) {
    if (!d.areas || !d.areas.length) return '';
    var n = d.years.length, zs = d.areas.filter(function (a) { return a.kind === ST.kind; }), out, rows, code = ST.acrop, cur, opts, cc;
    if (code !== 'all' && !list.some(function (c) { return c.code === code; })) code = ST.acrop = 'all';
    cc = code === 'all' ? null : list.filter(function (c) { return c.code === code; })[0];
    out = '<h3 class="cof-h3">' + U.esc(t.ter) + '</h3>' + U.sel('bwc-kind', t.view, U.opt('province', t.kP, ST.kind) + U.opt('region', t.kR, ST.kind), ST.kind);
    opts = U.opt('all', t.tall, code) + list.map(function (c) { return U.opt(c.code, cn(c, lg), code); }).join('');
    out += U.sel('bwc-acrop', t.tcrop, opts, code);
    rows = zs.map(function (a) { var v = areaVal(a, code, n - 1); return [an(a, lg), v || 0, code === 'all' ? '' : U.nf((v || 0) / a.ha[n - 1] * 100, 1) + ' %']; }).sort(function (x, y) { return y[1] - x[1]; });
    out += U.bars(rows, rows.length && rows[0][1] ? rows[0][1] : 1, 0, t.ha);
    if (code !== 'all') out += '<p class="cof-note" style="margin:4px 0 0">' + U.esc(t.ofzone) + '</p>';
    cur = zs.filter(function (a) { return a.id === ST.zone; })[0] || zs.slice().sort(function (x, y) { return (areaVal(y, code, n - 1) || 0) - (areaVal(x, code, n - 1) || 0); })[0];
    if (cur) {
      ST.zone = cur.id;
      out += U.sel('bwc-zone', t.tzone, zs.map(function (a) { return U.opt(a.id, an(a, lg), cur.id); }).join(''), cur.id);
      out += U.chart([{ name: an(cur, lg), v: d.years.map(function (y, i) { return areaVal(cur, code, i); }) }], d.years, t.ha, an(cur, lg) + ' · ' + (cc ? cn(cc, lg) : t.tall), 0);
    }
    return out + '<p class="cof-note" style="margin:6px 0 0">' + U.esc(t.terN) + '</p>';
  }
  function html(d, lg, t) {
    var n = d.years.length, y0 = d.years[0], y1 = d.years[n - 1], tot = d.totals.ha[n - 1], c0 = d.crops[0], i;
    var out = '<p class="di-movers-hint" style="margin:0 0 10px">' + U.esc(fx(t.at, { a: y0, b: y1 })) + '</p>';
    out += '<div class="cof-cards">' + card(U.esc(t.total), U.nf(tot, 0) + ' ' + U.esc(t.ha), U.esc(fx(t.tot_n, { p: sg(pct(tot, d.totals.ha[0]), 1), y: y0 }))) + card(U.esc(t.parc), U.nf(d.totals.parcels[n - 1], 0), '') +
      card(U.esc(t.top), U.esc(cn(c0, lg)), U.nf(c0.ha[n - 1] / tot * 100, 1) + ' % ' + U.esc(t.share)) + '</div>';
    out += U.sel('bwc-view', t.view, U.opt('crops', t.vc, ST.view) + U.opt('groups', t.vg, ST.view), ST.view);
    var rows;
    if (ST.view === 'groups') rows = d.groups.map(function (g) { return [gn(g.name, lg), g.ha[n - 1], U.nf(g.ha[n - 1] / tot * 100, 1) + ' %']; });
    else rows = d.crops.slice(0, 15).map(function (c) { return [cn(c, lg), c.ha[n - 1], U.nf(c.ha[n - 1] / tot * 100, 1) + ' %']; });
    out += '<h3 class="cof-h3">' + U.esc(fx(ST.view === 'groups' ? t.byg : t.byc, { y: y1 })) + '</h3>' + U.bars(rows, rows.length ? rows[0][1] || 1 : 1, 0, t.ha);
    var list = topCrops(d), cur = list.filter(function (c) { return c.code === ST.crop; })[0] || list[0];
    var opts = list.map(function (c) { return U.opt(c.code, cn(c, lg), cur.code); }).join('');
    var first = null, last = null; for (i = 0; i < n; i++) if (cur.ha[i] != null) { if (first == null) first = i; last = i; }
    out += '<h3 class="cof-h3">' + U.esc(t.trend) + '</h3>' + U.sel('bwc-crop', t.crop, opts, cur.code) + U.chart([{ name: cn(cur, lg), v: cur.ha }], d.years, t.ha, cn(cur, lg), 0);
    if (first != null && last > first) out += '<p class="cof-note" style="margin:4px 0 0">' + U.esc(fx(t.since, { a: d.years[first], b: d.years[last] }) + ': ' + sg(pct(cur.ha[last], cur.ha[first]), 1) + ' %') + '</p>';
    out += territory(d, lg, t, list) + '<p class="cof-note" style="margin:10px 0 0">' + U.esc(t.nom) + '</p><p class="cof-note" style="margin:6px 0 0">' + U.esc(t.sc) + '</p>';
    return out;
  }
  function load() {
    if (D) return Promise.resolve(D);
    return U.json('data/be-wallonia-crops.json').then(function (r) { D = r || false; return D; });
  }
  function mount(el, lg) {
    if (!el || !U) return Promise.resolve(false);
    lg = T[lg] ? lg : 'es';
    function draw(focus) {
      var t = T[lg];
      return load().then(function (d) {
        if (!d) { el.hidden = true; return false; }
        el.hidden = false;
        var body; try { body = html(d, lg, t); } catch (e) { body = '<p class="cof-note">' + U.esc(t.nd) + '</p>'; }
        el.innerHTML = '<section class="di-card cof" id="ps-be-wallonia-crops" style="max-width:none"><h2 class="cof-h2">' + U.esc(t.h) + '</h2>' + body + U.cite('spw_sigec_anon') + '</section>';
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
        return true;
      });
    }
    if (!el.getAttribute('data-bwc')) {
      el.setAttribute('data-bwc', '1');
      el.addEventListener('change', function (ev) {
        var id = ev.target.id || '', v = ev.target.value;
        if (id === 'bwc-view') ST.view = v; else if (id === 'bwc-crop') ST.crop = v; else if (id === 'bwc-kind') { ST.kind = v; ST.zone = null; } else if (id === 'bwc-acrop') ST.acrop = v; else if (id === 'bwc-zone') ST.zone = v;
        draw('#' + id);
      });
    }
    return Promise.all([global.DICite && global.DICite.load ? global.DICite.load().catch(function () { return null; }) : null]).then(function () { return draw(); });
  }
  global.DIBeWalCrops = { mount: mount };
})(window);
