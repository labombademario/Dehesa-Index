/* Alemania: producción por estado federado, precios y alquileres de la tierra, y «margen del agricultor» (relación de índices de precios).
   Fuentes: Destatis GENESIS (data/germany-agri.json; la pestaña de ganadería usa data/germany-livestock.json vía js/de-livestock.js) y data/germany-stats.json (índices de precios 2020=100). ES5, sin librerías.
   Uso: DEFarm.mount(el, lang). Los datos se cargan solo al abrir el desplegable. */
(function () {
  'use strict';
  var FA = 'data/germany-agri.json', FS = 'data/germany-stats.json', A = null, S = null, LA = null, LS = null;
  var LI = { en: 0, es: 1, fr: 2, it: 3 };
  var LANDS = { BW: 'Baden-Württemberg|Baden-Wurtemberg|Bade-Wurtemberg|Baden-Württemberg', BY: 'Bavaria|Baviera|Bavière|Baviera', BE: 'Berlin|Berlín|Berlin|Berlino', BB: 'Brandenburg|Brandeburgo|Brandebourg|Brandeburgo', HB: 'Bremen|Bremen|Brême|Brema', HH: 'Hamburg|Hamburgo|Hambourg|Amburgo', HE: 'Hesse|Hesse|Hesse|Assia', MV: 'Mecklenburg-Western Pomerania|Mecklemburgo-Pomerania Occidental|Mecklembourg-Poméranie-Occidentale|Meclemburgo-Pomerania Anteriore', NI: 'Lower Saxony|Baja Sajonia|Basse-Saxe|Bassa Sassonia', NW: 'North Rhine-Westphalia|Renania del Norte-Westfalia|Rhénanie-du-Nord-Westphalie|Renania Settentrionale-Vestfalia', RP: 'Rhineland-Palatinate|Renania-Palatinado|Rhénanie-Palatinat|Renania-Palatinato', SL: 'Saarland|Sarre|Sarre|Saarland', SN: 'Saxony|Sajonia|Saxe|Sassonia', ST: 'Saxony-Anhalt|Sajonia-Anhalt|Saxe-Anhalt|Sassonia-Anhalt', SH: 'Schleswig-Holstein|Schleswig-Holstein|Schleswig-Holstein|Schleswig-Holstein', TH: 'Thuringia|Turingia|Thuringe|Turingia' };
  var CROP = { cereals: 'Cereals (incl. grain maize)|Cereales (con maíz grano)|Céréales (avec maïs grain)|Cereali (con mais da granella)', wheat: 'Wheat|Trigo|Blé|Frumento', rye: 'Rye|Centeno|Seigle|Segale', barley: 'Barley|Cebada|Orge|Orzo', oats: 'Oats|Avena|Avoine|Avena', triticale: 'Triticale|Triticale|Triticale|Triticale', maize: 'Grain maize|Maíz grano|Maïs grain|Mais da granella', rapeseed: 'Rapeseed|Colza|Colza|Colza', sunflower: 'Sunflower|Girasol|Tournesol|Girasole', sugarbeet: 'Sugar beet|Remolacha azucarera|Betterave sucrière|Barbabietola da zucchero', potato: 'Potatoes|Patata|Pommes de terre|Patate', silage: 'Silage maize|Maíz forrajero|Maïs fourrage|Mais da foraggio' };
  var T = {
    es: { title: 'Alemania: producción, ganadería, tierra y margen del agricultor', open: 'Ver producción por estado federado, precios y alquileres de la tierra, y la relación entre lo que cobra y lo que paga el agricultor',
      hint: 'Destatis (GENESIS) y los índices de precios de Destatis. Los datos se cargan al abrir.', tabs: { prod: 'Producción por Land', land: 'Tierra: precios y alquileres', margin: 'Margen del agricultor', live: 'Ganadería, huevos y fruta' },
      crop: 'Cultivo', year: 'Año', vars: { prod: 'Producción', area: 'Superficie', yield: 'Rendimiento' }, de: 'Alemania', land: 'Estado federado', share: 'Peso en Alemania', yoy: 'Vs. año anterior', loading: 'Cargando…', err: 'No se han podido cargar los datos.',
      prov: 'Estimación provisional de la cosecha en curso: puede cambiar.', chartOf: 'Ver gráfico de', click: 'Pulsa una fila para ver su serie.', noLand: 'Sin dato publicado para este estado.',
      pnote: 'Hasta 1989 la serie nacional cubre solo la antigua RFA; el salto de 1990 es la reunificación. En 2010 cambia la base de la estadística (nueva encuesta agraria) y los datos por estado empiezan ese año; el centeno incluye el tranquillón de invierno desde 2010. El rendimiento nacional empieza en 1990.',
      buy: 'Precio de compra', rent: 'Alquiler', since21: 'Vs. 2021', since10: 'Vs. 2010', deals: 'Ventas', ratio: 'Alquiler ÷ compra', kinds: { lf: 'Toda la superficie agrícola', acker: 'Tierra de cultivo', gruen: 'Prado y pastizal' }, eurha: '€/ha',
      oldS: 'Serie hasta 2020 (otra clasificación)', newS: 'Serie desde 2021', rentS: 'Alquiler (años de censo agrario)',
      lnote: 'El precio es el medio de las ventas registradas ese año (en estados pequeños hay pocas operaciones: mira la columna «Ventas»). Las series nacionales de antes y después de 2021 vienen de tablas distintas y no se empalman. El alquiler solo se publica en los años del censo agrario (2010, 2013, 2016, 2020 y 2023) y es el medio de toda la tierra arrendada; el cociente alquiler ÷ compra (2023) es solo indicativo porque ambas cifras describen poblaciones distintas.',
      mTitle: 'Relación entre precios percibidos y pagados (2020 = 100)', outL: 'Lo que cobra el agricultor (índice de precios de productos)', inL: 'Lo que paga (índice de precios de insumos)', pre: 'Pares frecuentes', win: 'Periodo', w10: '10 años', w25: '25 años', wall: 'Todo',
      presets: { tot: 'Total', milk: 'Leche ↔ pienso compuesto', pig: 'Cerdo ↔ pienso para cerdos', cat: 'Vacuno ↔ pienso para vacuno', cer: 'Cereales ↔ fertilizantes', rape: 'Colza ↔ fertilizantes' },
      ratioS: 'Relación (cobrado ÷ pagado × 100)', outS: 'Productos (media trimestral)', inS: 'Insumos', now: 'Ahora', ago: 'Hace un año', lo: 'Mínimo desde 1968', hi: 'Máximo desde 1968', qtr: 'T',
      mnote: 'Es presión de precios, no beneficio: compara dos índices (2020 = 100) y no incluye volúmenes, costes fijos, subvenciones ni impuestos. Por encima de 100 significa que, frente a 2020, los precios que cobra el agricultor han subido más que los que paga; por debajo, menos. El índice de productos es mensual y aquí se promedia por trimestre completo; el de insumos es trimestral.', mnone: 'No hay datos para este par.' },
    en: { title: 'Germany: production, livestock, land and farmer’s margin', open: 'See production by federal state, land prices and rents, and how prices received compare with prices paid',
      hint: 'Destatis (GENESIS) and Destatis price indices. Data load when opened.', tabs: { prod: 'Production by state', land: 'Land: prices and rents', margin: 'Farmer’s margin', live: 'Livestock, eggs and fruit' },
      crop: 'Crop', year: 'Year', vars: { prod: 'Production', area: 'Area', yield: 'Yield' }, de: 'Germany', land: 'Federal state', share: 'Share of Germany', yoy: 'Vs. prior year', loading: 'Loading…', err: 'The data could not be loaded.',
      prov: 'Provisional estimate for the current harvest: it may change.', chartOf: 'Show chart of', click: 'Click a row to see its series.', noLand: 'No published figure for this state.',
      pnote: 'Up to 1989 the national series covers former West Germany only; the 1990 jump is reunification. In 2010 the statistics changed basis (new farm survey) and figures by state start that year; rye includes winter meslin from 2010. National yield starts in 1990.',
      buy: 'Purchase price', rent: 'Rent', since21: 'Vs. 2021', since10: 'Vs. 2010', deals: 'Sales', ratio: 'Rent ÷ purchase', kinds: { lf: 'All farmland', acker: 'Arable land', gruen: 'Grassland' }, eurha: '€/ha',
      oldS: 'Series to 2020 (other classification)', newS: 'Series from 2021', rentS: 'Rent (farm-census years)',
      lnote: 'The price is the average of the sales recorded that year (small states have few transactions: see the “Sales” column). The national series before and after 2021 come from different tables and are not spliced. Rent is only published in farm-census years (2010, 2013, 2016, 2020 and 2023) and is the average over all rented land; the rent ÷ purchase ratio (2023) is indicative only because the two figures describe different populations.',
      mTitle: 'Prices received versus prices paid (2020 = 100)', outL: 'What the farmer receives (output price index)', inL: 'What the farmer pays (input price index)', pre: 'Common pairs', win: 'Period', w10: '10 years', w25: '25 years', wall: 'All',
      presets: { tot: 'Total', milk: 'Milk ↔ compound feed', pig: 'Pigs ↔ pig feed', cat: 'Cattle ↔ cattle feed', cer: 'Cereals ↔ fertilisers', rape: 'Rapeseed ↔ fertilisers' },
      ratioS: 'Ratio (received ÷ paid × 100)', outS: 'Output (quarterly average)', inS: 'Inputs', now: 'Now', ago: 'A year ago', lo: 'Low since 1968', hi: 'High since 1968', qtr: 'Q',
      mnote: 'This is price pressure, not profit: it compares two indices (2020 = 100) and leaves out volumes, fixed costs, subsidies and taxes. Above 100 means that, compared with 2020, prices received have risen more than prices paid; below 100, less. The output index is monthly and is averaged here over complete quarters; the input index is quarterly.', mnone: 'No data for this pair.' },
    fr: { title: 'Allemagne : production, élevage, terres et marge de l’agriculteur', open: 'Voir la production par Land, les prix et loyers des terres, et le rapport entre prix reçus et prix payés',
      hint: 'Destatis (GENESIS) et indices de prix de Destatis. Les données se chargent à l’ouverture.', tabs: { prod: 'Production par Land', land: 'Terres : prix et loyers', margin: 'Marge de l’agriculteur', live: 'Élevage, œufs et fruits' },
      crop: 'Culture', year: 'Année', vars: { prod: 'Production', area: 'Surface', yield: 'Rendement' }, de: 'Allemagne', land: 'Land', share: 'Part de l’Allemagne', yoy: 'Vs. année préc.', loading: 'Chargement…', err: 'Impossible de charger les données.',
      prov: 'Estimation provisoire de la récolte en cours : elle peut changer.', chartOf: 'Voir le graphique de', click: 'Cliquez sur une ligne pour voir sa série.', noLand: 'Pas de donnée publiée pour ce Land.',
      pnote: 'Jusqu’en 1989 la série nationale ne couvre que l’ex-RFA ; le saut de 1990 est la réunification. En 2010 la base de la statistique change (nouvelle enquête agricole) et les chiffres par Land commencent cette année-là ; le seigle inclut le méteil d’hiver depuis 2010. Le rendement national commence en 1990.',
      buy: 'Prix d’achat', rent: 'Loyer', since21: 'Vs. 2021', since10: 'Vs. 2010', deals: 'Ventes', ratio: 'Loyer ÷ achat', kinds: { lf: 'Toute la surface agricole', acker: 'Terres arables', gruen: 'Prairies et pâturages' }, eurha: '€/ha',
      oldS: 'Série jusqu’en 2020 (autre classification)', newS: 'Série depuis 2021', rentS: 'Loyer (années de recensement agricole)',
      lnote: 'Le prix est la moyenne des ventes enregistrées dans l’année (les petits Länder ont peu de transactions : voir la colonne « Ventes »). Les séries nationales avant et après 2021 viennent de tableaux différents et ne sont pas raccordées. Le loyer n’est publié que les années de recensement agricole (2010, 2013, 2016, 2020 et 2023) et correspond à la moyenne de toutes les terres louées ; le rapport loyer ÷ achat (2023) n’est qu’indicatif car les deux chiffres décrivent des populations différentes.',
      mTitle: 'Prix reçus et prix payés (2020 = 100)', outL: 'Ce que reçoit l’agriculteur (indice des prix des produits)', inL: 'Ce qu’il paie (indice des prix des intrants)', pre: 'Paires courantes', win: 'Période', w10: '10 ans', w25: '25 ans', wall: 'Tout',
      presets: { tot: 'Total', milk: 'Lait ↔ aliment composé', pig: 'Porc ↔ aliment porcs', cat: 'Bovins ↔ aliment bovins', cer: 'Céréales ↔ engrais', rape: 'Colza ↔ engrais' },
      ratioS: 'Rapport (reçu ÷ payé × 100)', outS: 'Produits (moyenne trimestrielle)', inS: 'Intrants', now: 'Maintenant', ago: 'Il y a un an', lo: 'Minimum depuis 1968', hi: 'Maximum depuis 1968', qtr: 'T',
      mnote: 'C’est une pression sur les prix, pas un bénéfice : on compare deux indices (2020 = 100) sans les volumes, les coûts fixes, les subventions ni les impôts. Au-dessus de 100, les prix reçus ont davantage augmenté que les prix payés par rapport à 2020 ; en dessous, moins. L’indice des produits est mensuel et moyenné ici par trimestre complet ; celui des intrants est trimestriel.', mnone: 'Pas de données pour cette paire.' },
    it: { title: 'Germania: produzione, zootecnia, terra e margine dell’agricoltore', open: 'Vedi la produzione per Land, prezzi e affitti della terra, e il rapporto tra prezzi incassati e pagati',
      hint: 'Destatis (GENESIS) e indici dei prezzi di Destatis. I dati si caricano all’apertura.', tabs: { prod: 'Produzione per Land', land: 'Terra: prezzi e affitti', margin: 'Margine dell’agricoltore', live: 'Zootecnia, uova e frutta' },
      crop: 'Coltura', year: 'Anno', vars: { prod: 'Produzione', area: 'Superficie', yield: 'Resa' }, de: 'Germania', land: 'Land', share: 'Peso sulla Germania', yoy: 'Vs. anno prec.', loading: 'Caricamento…', err: 'Impossibile caricare i dati.',
      prov: 'Stima provvisoria del raccolto in corso: può cambiare.', chartOf: 'Vedi il grafico di', click: 'Tocca una riga per vedere la sua serie.', noLand: 'Nessun dato pubblicato per questo Land.',
      pnote: 'Fino al 1989 la serie nazionale copre solo la ex Germania Ovest; il salto del 1990 è la riunificazione. Nel 2010 cambia la base della statistica (nuova indagine agricola) e i dati per Land iniziano quell’anno; la segale include il frumento invernale misto dal 2010. La resa nazionale parte dal 1990.',
      buy: 'Prezzo d’acquisto', rent: 'Affitto', since21: 'Vs. 2021', since10: 'Vs. 2010', deals: 'Vendite', ratio: 'Affitto ÷ acquisto', kinds: { lf: 'Tutta la superficie agricola', acker: 'Seminativi', gruen: 'Prati e pascoli' }, eurha: '€/ha',
      oldS: 'Serie fino al 2020 (altra classificazione)', newS: 'Serie dal 2021', rentS: 'Affitto (anni di censimento agricolo)',
      lnote: 'Il prezzo è la media delle vendite registrate nell’anno (i Land piccoli hanno poche operazioni: vedi la colonna «Vendite»). Le serie nazionali prima e dopo il 2021 provengono da tabelle diverse e non sono raccordate. L’affitto è pubblicato solo negli anni di censimento agricolo (2010, 2013, 2016, 2020 e 2023) ed è la media di tutta la terra in affitto; il rapporto affitto ÷ acquisto (2023) è solo indicativo perché le due cifre descrivono popolazioni diverse.',
      mTitle: 'Prezzi incassati e prezzi pagati (2020 = 100)', outL: 'Cosa incassa l’agricoltore (indice dei prezzi dei prodotti)', inL: 'Cosa paga (indice dei prezzi dei mezzi tecnici)', pre: 'Coppie frequenti', win: 'Periodo', w10: '10 anni', w25: '25 anni', wall: 'Tutto',
      presets: { tot: 'Totale', milk: 'Latte ↔ mangime composto', pig: 'Suini ↔ mangime suini', cat: 'Bovini ↔ mangime bovini', cer: 'Cereali ↔ fertilizzanti', rape: 'Colza ↔ fertilizzanti' },
      ratioS: 'Rapporto (incassato ÷ pagato × 100)', outS: 'Prodotti (media trimestrale)', inS: 'Mezzi tecnici', now: 'Ora', ago: 'Un anno fa', lo: 'Minimo dal 1968', hi: 'Massimo dal 1968', qtr: 'T',
      mnote: 'È pressione sui prezzi, non utile: confronta due indici (2020 = 100) senza volumi, costi fissi, sussidi né imposte. Sopra 100 significa che, rispetto al 2020, i prezzi incassati sono saliti più di quelli pagati; sotto, meno. L’indice dei prodotti è mensile e qui è mediato per trimestre completo; quello dei mezzi tecnici è trimestrale.', mnone: 'Nessun dato per questa coppia.' }
  };
  var OUTN = { 'lwpr': 'Agricultural output, total|Total productos agrarios|Total des produits agricoles|Totale prodotti agricoli', 'lwpr-1': 'Crop output|Productos vegetales|Produits végétaux|Prodotti vegetali', 'lwpr-2': 'Animal output|Productos animales|Produits animaux|Prodotti animali', 'lwpr-121': 'Cereals|Cereales|Céréales|Cereali', 'lwpr-1211': 'Bread wheat|Trigo panificable|Blé tendre panifiable|Frumento panificabile', 'lwpr-1212': 'Bread rye|Centeno panificable|Seigle panifiable|Segale panificabile', 'lwpr-1213': 'Feed wheat|Trigo forrajero|Blé fourrager|Frumento da foraggio', 'lwpr-1214': 'Feed barley|Cebada forrajera|Orge fourragère|Orzo da foraggio', 'lwpr-1215': 'Malting barley|Cebada cervecera|Orge de brasserie|Orzo da birra', 'lwpr-1216': 'Grain maize|Maíz grano|Maïs grain|Mais da granella', 'lwpr-131': 'Rapeseed|Colza|Colza|Colza', 'lwpr-132': 'Sugar beet|Remolacha azucarera|Betterave sucrière|Barbabietola da zucchero', 'lwpr-14': 'Potatoes|Patata|Pommes de terre|Patate', 'lwpr-16': 'Fruit|Fruta|Fruits|Frutta', 'lwpr-151': 'Vegetables|Hortalizas|Légumes|Ortaggi', 'lwpr-21': 'Animals (livestock)|Ganado|Animaux|Animali', 'lwpr-211': 'Cattle|Vacuno|Bovins|Bovini', 'lwpr-2111': 'Young bulls|Añojos (machos jóvenes)|Jeunes bovins mâles|Giovani tori', 'lwpr-2112': 'Cows|Vacas|Vaches|Vacche', 'lwpr-212': 'Pigs|Cerdos|Porcs|Suini', 'lwpr-214': 'Poultry|Aves|Volailles|Pollame', 'lwpr-22': 'Milk|Leche|Lait|Latte', 'lwpr-23': 'Eggs|Huevos|Œufs|Uova' };
  var INN = { 'lwbm': 'Agricultural inputs, total|Total insumos agrarios|Total des intrants|Totale mezzi tecnici', 'lwbm-1': 'Goods and services for current consumption|Bienes y servicios de consumo corriente|Biens et services de consommation courante|Beni e servizi di consumo corrente', 'lwbm-11': 'Seeds and planting material|Semillas y plantones|Semences et plants|Sementi e piantine', 'lwbm-12': 'Energy and lubricants|Energía y lubricantes|Énergie et lubrifiants|Energia e lubrificanti', 'lwbm-122': 'Motor fuels|Carburantes|Carburants|Carburanti', 'lwbm-13': 'Fertilisers|Fertilizantes|Engrais|Fertilizzanti', 'lwbm-14': 'Plant protection products|Fitosanitarios|Produits phytosanitaires|Prodotti fitosanitari', 'lwbm-15': 'Animal feed|Piensos|Aliments pour animaux|Mangimi', 'lwbm-151': 'Straight feed|Piensos simples|Aliments simples|Mangimi semplici', 'lwbm-152': 'Compound feed|Pienso compuesto|Aliment composé|Mangime composto', 'lwbm-1522': 'Compound feed for cattle|Pienso para vacuno|Aliment composé pour bovins|Mangime per bovini', 'lwbm-1523': 'Compound feed for pigs|Pienso para cerdos|Aliment composé pour porcs|Mangime per suini', 'lwbm-1524': 'Compound feed for poultry|Pienso para aves|Aliment composé pour volailles|Mangime per pollame', 'lwbm-16': 'Veterinary services|Servicios veterinarios|Services vétérinaires|Servizi veterinari', 'lwbm-2': 'Goods and services for investment|Bienes y servicios de inversión|Biens et services d’investissement|Beni e servizi di investimento', 'lwbm-21': 'Machinery and equipment|Maquinaria y equipos|Machines et équipements|Macchinari e attrezzature' };
  var PAIRS = { tot: ['lwpr', 'lwbm'], milk: ['lwpr-22', 'lwbm-152'], pig: ['lwpr-212', 'lwbm-1523'], cat: ['lwpr-211', 'lwbm-1522'], cer: ['lwpr-121', 'lwbm-13'], rape: ['lwpr-131', 'lwbm-13'] };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d, lang) { try { return v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function pick(map, k, lang) { var v = map[k]; if (!v) return k; var a = v.split('|'); return a[LI[lang]] || a[0]; }
  function pc(v, lang) { if (v == null || !isFinite(v)) return '–'; if (Math.abs(v) < 0.05) v = 0; return (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1, lang) + ' %'; }
  function get(a, y) { if (!a) return null; for (var i = a.length - 1; i >= 0; i--) { if (a[i][0] === y) return a[i][1]; if (a[i][0] < y) break; } return null; }
  function lastPt(a) { return a && a.length ? a[a.length - 1] : null; }
  function ts(y) { return Date.UTC(y, 0, 1); }
  function fmtV(v, vn, lang) {
    if (v == null) return '–';
    if (vn === 'yield') return nf(v, 1, lang) + ' dt/ha';
    if (vn === 'prod') return v >= 1e6 ? nf(v / 1e6, 2, lang) + ' M t' : nf(v, 0, lang) + ' t';
    return v >= 1e6 ? nf(v / 1e6, 2, lang) + ' M ha' : nf(v, 0, lang) + ' ha';
  }
  function loadA() { if (A) return Promise.resolve(A); if (!LA) LA = fetch(FA).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { A = d; return d; }); return LA; }
  function loadS() { if (S) return Promise.resolve(S); if (!LS) LS = fetch(FS).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { var m = {}; ((d.countries && d.countries.DE && d.countries.DE.series) || []).forEach(function (s) { m[s.id] = s; }); S = { map: m, generatedAt: d.generatedAt }; return S; }); return LS; }
  function chart(series, o) {
    var C = window.DehesaChart; if (!C) return '';
    return C.render({ series: series, xMode: 'time', yTitle: o.unit, aria: o.aria, noLegend: series.length < 2, yMin: o.yMin, vFmt: o.vFmt, yFmt: o.yFmt || function (v) { return nf(v, Math.abs(v) >= 100 ? 0 : 1, o.lang); }, xFmt: o.xFmt || function (x) { return new Date(x).getUTCFullYear(); } });
  }
  function pts(a, from) { var r = []; (a || []).forEach(function (p) { if (from == null || p[0] >= from) r.push({ x: ts(p[0]), y: p[1], l: String(p[0]) }); }); return r; }
  function cite(ids, period, what) { var Q = window.DICite; if (!Q) return ''; var c = what ? Q.derived(ids, { what: what }) : Q.html(ids[0], { period: String(period || '') }); return c ? '<div class="pp-cites">' + c + '</div>' : ''; }

  /* ---------- pestaña 1: producción ---------- */
  function yearsFor(crop, vn) {
    var nat = (A.production.nat[crop] || {})[vn] || [], res = [];
    nat.forEach(function (p) { if (p[0] >= 2010) { var n = 0, lk; for (lk in (A.production.land[crop] || {})) if (get(A.production.land[crop][lk][vn], p[0]) != null) n++; if (n >= 6) res.push(p[0]); } });
    return res;
  }
  function renderProd(body, st, lang, t) {
    if (!A.production.nat[st.crop]) st.crop = 'wheat';
    var ys = yearsFor(st.crop, st.v); if (!ys.length) { body.innerHTML = '<p class="di-movers-hint">' + esc(t.noLand) + '</p>'; return; }
    if (ys.indexOf(st.year) < 0) st.year = ys[ys.length - 1];
    var y = st.year, nat = A.production.nat[st.crop][st.v], L = A.production.land[st.crop] || {};
    var h = '<div class="de-ctl"><label>' + esc(t.crop) + ' <select class="di-compare-select" data-dc="crop">' + A.crops.map(function (c) { return '<option value="' + c.k + '"' + (c.k === st.crop ? ' selected' : '') + '>' + esc(pick(CROP, c.k, lang)) + '</option>'; }).join('') + '</select></label> ' +
      '<label>' + esc(t.year) + ' <select class="di-compare-select" data-dc="year">' + ys.slice().reverse().map(function (x) { return '<option value="' + x + '"' + (x === y ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label></div>';
    h += '<div class="di-src-tabs" role="group">' + ['prod', 'area', 'yield'].map(function (v) { return '<button type="button" class="di-src-tab" data-dv="' + v + '" aria-pressed="' + (v === st.v) + '">' + esc(t.vars[v]) + '</button>'; }).join('') + '</div>';
    var rows = [], tot = get(nat, y);
    Object.keys(L).forEach(function (lk) { var v = get(L[lk][st.v], y); if (v != null) rows.push({ k: lk, v: v, p: get(L[lk][st.v], y - 1) }); });
    rows.sort(function (a, b) { return b.v - a.v; });
    var showShare = st.v !== 'yield';
    h += '<div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(t.land) + '</th><th scope="col" class="r">' + esc(t.vars[st.v]) + ' (' + y + ')</th>' + (showShare ? '<th scope="col" class="r">' + esc(t.share) + '</th>' : '') + '<th scope="col" class="r">' + esc(t.yoy) + '</th></tr></thead><tbody>';
    var row = function (k, name, v, p, bold) {
      var on = st.sel === k;
      return '<tr class="pa-r' + (on ? ' on' : '') + '" data-dl="' + k + '" tabindex="0" role="button" aria-pressed="' + on + '"><td>' + (bold ? '<b>' + esc(name) + '</b>' : esc(name)) + '</td><td class="r">' + (bold ? '<b>' : '') + esc(fmtV(v, st.v, lang)) + (bold ? '</b>' : '') + '</td>' + (showShare ? '<td class="r">' + (k === 'DE' ? '100 %' : (tot ? nf(v / tot * 100, v / tot < 0.1 ? 1 : 0, lang) + ' %' : '–')) + '</td>' : '') + '<td class="r">' + (p ? pc((v / p - 1) * 100, lang) : '–') + '</td></tr>';
    };
    h += row('DE', t.de, tot, get(nat, y - 1), true);
    rows.forEach(function (r) { h += row(r.k, pick(LANDS, r.k, lang), r.v, r.p, false); });
    h += '</tbody></table></div><p class="di-movers-hint">' + esc(t.click) + (y >= new Date().getFullYear() ? ' ' + esc(t.prov) : '') + '</p>';
    var sel = st.sel && st.sel !== 'DE' && L[st.sel] ? st.sel : 'DE', ser;
    if (sel === 'DE') {
      ser = [{ name: t.de, color: '#2f6b4a', pts: pts(nat) }];
    } else ser = [{ name: pick(LANDS, sel, lang), color: '#b7791f', pts: pts(L[sel][st.v]) }];
    var vn = st.v;
    h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + esc(t.chartOf) + ' ' + esc(sel === 'DE' ? t.de : pick(LANDS, sel, lang)) + '</b> · ' + esc(pick(CROP, st.crop, lang)) + ' · ' + esc(t.vars[vn]) + '</p>' +
      chart(ser, { lang: lang, unit: vn === 'yield' ? 'dt/ha' : vn === 'prod' ? 't' : 'ha', aria: pick(CROP, st.crop, lang) + ' ' + t.vars[vn] + ' ' + (sel === 'DE' ? t.de : pick(LANDS, sel, lang)), vFmt: function (v) { return fmtV(v, vn, lang); }, yFmt: function (v) { return v >= 1e6 ? nf(v / 1e6, 1, lang) + ' M' : nf(v, v < 100 ? 1 : 0, lang); } });
    h += '<p class="di-movers-hint">' + esc(t.pnote) + '</p>' + cite(['destatis'], y);
    body.innerHTML = h;
  }

  /* ---------- pestaña 2: tierra ---------- */
  function renderLand(body, st, lang, t) {
    var K = st.kind, LP = A.landPrice, R = A.rent, py = 0, ry = 0, rows = [];
    var natP = LP.nat[K] && LP.nat[K].p, natR = R.nat[K];
    if (natP && lastPt(natP)) py = lastPt(natP)[0]; if (natR && lastPt(natR)) ry = lastPt(natR)[0];
    Object.keys(LP.land).forEach(function (lk) {
      var p = LP.land[lk][K] && LP.land[lk][K].p, r = R.land[lk] && R.land[lk][K]; var pl = lastPt(p);
      if (!pl && !(r && lastPt(r))) return;
      rows.push({ k: lk, p: pl ? pl[1] : null, p0: p ? get(p, 2021) : null, n: pl && LP.land[lk][K].n ? get(LP.land[lk][K].n, pl[0]) : null, r: r ? get(r, ry) : null, r0: r ? get(r, 2010) : null, pr: p ? get(p, ry) : null });
    });
    rows.sort(function (a, b) { return (b.p || 0) - (a.p || 0); });
    var h = '<div class="di-src-tabs" role="group">' + ['lf', 'acker', 'gruen'].map(function (k) { return '<button type="button" class="di-src-tab" data-dk="' + k + '" aria-pressed="' + (k === K) + '">' + esc(t.kinds[k]) + '</button>'; }).join('') + '</div>';
    h += '<div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(t.land) + '</th><th scope="col" class="r">' + esc(t.buy) + ' (' + py + ')</th><th scope="col" class="r">' + esc(t.since21) + '</th><th scope="col" class="r">' + esc(t.deals) + '</th><th scope="col" class="r">' + esc(t.rent) + ' (' + ry + ')</th><th scope="col" class="r">' + esc(t.since10) + '</th><th scope="col" class="r">' + esc(t.ratio) + '</th></tr></thead><tbody>';
    var nl = function (k, name, p, p0, n, r, r0, pr, bold) {
      var on = st.sel === k, b = function (s) { return bold ? '<b>' + s + '</b>' : s; };
      return '<tr class="pa-r' + (on ? ' on' : '') + '" data-dl="' + k + '" tabindex="0" role="button" aria-pressed="' + on + '"><td>' + b(esc(name)) + '</td><td class="r">' + (p != null ? b(nf(p, 0, lang)) + ' ' + esc(t.eurha) : '–') + '</td><td class="r">' + (p != null && p0 ? pc((p / p0 - 1) * 100, lang) : '–') + '</td><td class="r">' + (n != null ? nf(n, 0, lang) : '–') + '</td><td class="r">' + (r != null ? b(nf(r, 0, lang)) + ' ' + esc(t.eurha) : '–') + '</td><td class="r">' + (r != null && r0 ? pc((r / r0 - 1) * 100, lang) : '–') + '</td><td class="r">' + (r != null && pr ? nf(r / pr * 100, 1, lang) + ' %' : '–') + '</td></tr>';
    };
    h += nl('DE', t.de, natP && lastPt(natP) ? lastPt(natP)[1] : null, natP ? get(natP, 2021) : null, LP.nat[K] && LP.nat[K].n && lastPt(LP.nat[K].n) ? lastPt(LP.nat[K].n)[1] : null, natR ? get(natR, ry) : null, natR ? get(natR, 2010) : null, natP ? get(natP, ry) : null, true);
    rows.forEach(function (r) { h += nl(r.k, pick(LANDS, r.k, lang), r.p, r.p0, r.n, r.r, r.r0, r.pr, false); });
    h += '</tbody></table></div><p class="di-movers-hint">' + esc(t.click) + '</p>';
    var sel = st.sel && LP.land[st.sel] ? st.sel : 'DE', nm = sel === 'DE' ? t.de : pick(LANDS, sel, lang), ps, rs;
    if (sel === 'DE') {
      ps = []; if (K === 'lf' && LP.natPre.length) ps.push({ name: t.oldS, color: '#8a8a8a', pts: pts(LP.natPre) });
      ps.push({ name: t.newS, color: '#2f6b4a', pts: pts(natP) }); rs = natR;
    } else { ps = [{ name: nm, color: '#b7791f', pts: pts(LP.land[sel][K] && LP.land[sel][K].p) }]; rs = R.land[sel] && R.land[sel][K]; }
    h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + esc(t.buy) + ' · ' + esc(nm) + '</b> · ' + esc(t.kinds[K]) + ' · ' + esc(t.eurha) + '</p>' + chart(ps, { lang: lang, unit: t.eurha, aria: t.buy + ' ' + nm, vFmt: function (v) { return nf(v, 0, lang) + ' ' + t.eurha; } });
    if (rs && rs.length > 1) h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + esc(t.rent) + ' · ' + esc(nm) + '</b> · ' + esc(t.kinds[K]) + ' · ' + esc(t.eurha) + '</p>' + chart([{ name: t.rentS, color: '#1f4e79', pts: pts(rs) }], { lang: lang, unit: t.eurha, aria: t.rent + ' ' + nm, vFmt: function (v) { return nf(v, 0, lang) + ' ' + t.eurha; } });
    h += '<p class="di-movers-hint">' + esc(t.lnote) + '</p>' + cite(['destatis'], py);
    body.innerHTML = h;
  }

  /* ---------- pestaña 3: margen ---------- */
  function quarterlyOut(s) {
    var m = {}, res = {}; s.points.forEach(function (p) { m[p[0]] = p[1]; });
    Object.keys(m).forEach(function (k) { var y = +k.slice(0, 4), mo = +k.slice(5, 7); if ((mo - 1) % 3 !== 0) return; var a = m[k], b = m[y + '-' + (mo < 9 ? '0' : '') + (mo + 1)], c = m[y + '-' + (mo + 2 < 10 ? '0' : '') + (mo + 2)]; if (a != null && b != null && c != null) res[k] = (a + b + c) / 3; });
    return res;
  }
  function renderMargin(body, st, lang, t) {
    var M = S.map, outs = [], ins = [], id;
    for (id in M) { var kk = id.replace(/^de-(out-m|in-q)-/, ''); if (id.indexOf('de-out-m-') === 0 && OUTN[kk]) outs.push(M[id]); else if (id.indexOf('de-in-q-') === 0 && INN[kk]) ins.push(M[id]); }
    var byId = function (list, k) { for (var i = 0; i < list.length; i++) if (list[i].id === k) return list[i]; return null; };
    var so = byId(outs, 'de-out-m-' + st.out), si = byId(ins, 'de-in-q-' + st.inp);
    var nmOf = function (s) { var k = s.id.replace(/^de-(out-m|in-q)-/, ''); return pick(s.id.indexOf('de-out') === 0 ? OUTN : INN, k, lang); };
    var opt = function (list, cur) { return list.slice().sort(function (a, b) { return a.id.length - b.id.length || (a.id < b.id ? -1 : 1); }).map(function (s) { var k = s.id.replace(/^de-(out-m|in-q)-/, ''); return '<option value="' + k + '"' + (k === cur ? ' selected' : '') + '>' + esc(nmOf(s)) + '</option>'; }).join(''); };
    var h = '<p class="di-movers-hint" style="margin:0 0 6px"><b>' + esc(t.mTitle) + '</b></p><div class="di-src-tabs" role="group" aria-label="' + esc(t.pre) + '">' + Object.keys(PAIRS).map(function (k) { return '<button type="button" class="di-src-tab" data-dpair="' + k + '" aria-pressed="' + (st.out === PAIRS[k][0] && st.inp === PAIRS[k][1]) + '">' + esc(t.presets[k]) + '</button>'; }).join('') + '</div>';
    h += '<div class="de-ctl"><label>' + esc(t.outL) + '<br><select class="di-compare-select" data-dm="out">' + opt(outs, st.out) + '</select></label> <label>' + esc(t.inL) + '<br><select class="di-compare-select" data-dm="inp">' + opt(ins, st.inp) + '</select></label></div>';
    if (!so || !si) { body.innerHTML = h + '<p class="di-movers-hint">' + esc(t.mnone) + '</p>'; return; }
    var qo = quarterlyOut(so), qi = {}; si.points.forEach(function (p) { qi[p[0]] = p[1]; });
    var per = Object.keys(qo).filter(function (k) { return qi[k] != null; }).sort();
    if (per.length < 8) { body.innerHTML = h + '<p class="di-movers-hint">' + esc(t.mnone) + '</p>'; return; }
    var x = function (k) { return Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, 1); };
    var ql = function (k) { return k.slice(0, 4) + ' ' + t.qtr + (((+k.slice(5, 7) - 1) / 3 | 0) + 1); };
    var win = st.win === 'all' ? per.length : Math.min(per.length, st.win * 4), use = per.slice(-win);
    var rat = function (k) { return qo[k] / qi[k] * 100; };
    var ser = [{ name: t.ratioS, color: '#1f4e79', pts: use.map(function (k) { return { x: x(k), y: rat(k), l: ql(k) }; }) },
      { name: t.outS, color: '#2f6b4a', pts: use.map(function (k) { return { x: x(k), y: qo[k], l: ql(k) }; }) },
      { name: t.inS, color: '#b7791f', pts: use.map(function (k) { return { x: x(k), y: qi[k], l: ql(k) }; }) }];
    var lk = per[per.length - 1], ago = per[per.length - 5], lo = per[0], hi = per[0];
    per.forEach(function (k) { if (rat(k) < rat(lo)) lo = k; if (rat(k) > rat(hi)) hi = k; });
    var tile = function (lab, v, sub) { return '<div class="de-tile"><div class="de-tl">' + esc(lab) + '</div><div class="de-tv">' + nf(v, 1, lang) + '</div><div class="de-ts">' + esc(sub) + '</div></div>'; };
    h += '<div class="de-tiles">' + tile(t.now, rat(lk), ql(lk)) + (ago ? tile(t.ago, rat(ago), ql(ago) + ' · ' + pc((rat(lk) / rat(ago) - 1) * 100, lang)) : '') + tile(t.lo, rat(lo), ql(lo)) + tile(t.hi, rat(hi), ql(hi)) + '</div>';
    h += '<div class="de-ctl"><span class="di-movers-hint">' + esc(t.win) + '</span><span class="di-src-tabs" role="group">' + [[10, t.w10], [25, t.w25], ['all', t.wall]].map(function (w) { return '<button type="button" class="di-src-tab" data-dw="' + w[0] + '" aria-pressed="' + (String(st.win) === String(w[0])) + '">' + esc(w[1]) + '</button>'; }).join('') + '</span></div>';
    h += chart(ser, { lang: lang, unit: '2020 = 100', aria: t.mTitle + ': ' + nmOf(so) + ' / ' + nmOf(si), vFmt: function (v) { return nf(v, 1, lang); }, yMin: 0 });
    h += '<p class="di-movers-hint">' + esc(t.mnote) + '</p>' + cite(['destatis'], lk.slice(0, 4), 'ratio of two Destatis price indices (' + pick(OUTN, st.out, 'en') + ' ÷ ' + pick(INN, st.inp, 'en') + ')');
    body.innerHTML = h;
  }

  var LL = null;
  function loadLive() {   /* la pestaña de ganadería vive en su propio fichero: solo se descarga al abrirla */
    if (window.DELive) return Promise.resolve();
    if (!LL) LL = new Promise(function (ok, ko) { var sc = document.createElement('script'); sc.src = 'js/de-livestock.js?v=20261003'; sc.onload = ok; sc.onerror = function () { LL = null; ko(new Error('de-livestock')); }; document.head.appendChild(sc); });
    return LL;
  }
  function helpers() { return { esc: esc, nf: nf, pc: pc, chart: function (s, o) { return chart(s, o); }, cite: function (ids, period) { return cite(ids, period); }, land: function (k, lang) { return pick(LANDS, k, lang); } }; }
  function render(el, lang, st) {
    var t = T[lang] || T.es, body = el.querySelector('.de-body'); if (!body) return;
    var tabs = '<div class="di-src-tabs" role="group">' + ['prod', 'land', 'margin', 'live'].map(function (k) { return '<button type="button" class="di-src-tab" data-dt="' + k + '" aria-pressed="' + (k === st.tab) + '">' + esc(t.tabs[k]) + '</button>'; }).join('') + '</div>';
    var p = st.tab === 'margin' ? loadS() : st.tab === 'live' ? loadLive() : loadA();
    body.innerHTML = tabs + '<div class="de-pane"><p class="di-movers-hint">' + esc(t.loading) + '</p></div>';
    p.then(function () {
      var pane = body.querySelector('.de-pane'); if (!pane) return;
      if (st.tab === 'prod') renderProd(pane, st, lang, t); else if (st.tab === 'land') renderLand(pane, st, lang, t); else if (st.tab === 'live') window.DELive.render(pane, st, lang, helpers()); else renderMargin(pane, st, lang, t);
    }).catch(function () { LA = null; LS = null; var pane = body.querySelector('.de-pane'); if (pane) pane.innerHTML = '<p class="di-movers-hint">' + esc(t.err) + '</p>'; });
  }
  function mount(el, lang) {
    if (!el) return; var t = T[lang] || T.es, st = { tab: 'prod', crop: 'wheat', v: 'prod', year: null, sel: 'DE', kind: 'lf', out: 'lwpr', inp: 'lwbm', win: 25, lv: 'sl', sp: 'pigs', vn: 'heads', lsel: 'DE', hsp: 'cattle', hc: 'total', fr: 'apples' };
    el.innerHTML = '<details class="pa-card di-card"><summary>' + esc(t.title) + ' · <span>' + esc(t.open) + '</span></summary><p class="di-movers-hint" style="margin:8px 0 10px">' + esc(t.hint) + '</p><div class="de-body"></div></details>';
    var det = el.querySelector('details');
    det.addEventListener('toggle', function () { if (det.open) render(el, lang, st); });
    el.addEventListener('click', function (e) {
      var tg = e.target.closest ? e.target : null; if (!tg) return;
      var b;
      if ((b = tg.closest('[data-dt]'))) { st.tab = b.getAttribute('data-dt'); st.sel = 'DE'; render(el, lang, st); }
      else if ((b = tg.closest('[data-dv]'))) { st.v = b.getAttribute('data-dv'); render(el, lang, st); }
      else if ((b = tg.closest('[data-dk]'))) { st.kind = b.getAttribute('data-dk'); render(el, lang, st); }
      else if ((b = tg.closest('[data-dw]'))) { st.win = b.getAttribute('data-dw') === 'all' ? 'all' : +b.getAttribute('data-dw'); render(el, lang, st); }
      else if ((b = tg.closest('[data-dpair]'))) { var pr = PAIRS[b.getAttribute('data-dpair')]; st.out = pr[0]; st.inp = pr[1]; render(el, lang, st); }
      else if ((b = tg.closest('[data-lsub]'))) { st.lv = b.getAttribute('data-lsub'); render(el, lang, st); }
      else if ((b = tg.closest('[data-lsp]'))) { st.sp = b.getAttribute('data-lsp'); st.lsel = 'DE'; render(el, lang, st); }
      else if ((b = tg.closest('[data-lvn]'))) { st.vn = b.getAttribute('data-lvn'); render(el, lang, st); }
      else if ((b = tg.closest('[data-lhs]'))) { st.hsp = b.getAttribute('data-lhs'); st.hc = 'total'; render(el, lang, st); }
      else if ((b = tg.closest('[data-dlc]'))) { st.hc = b.getAttribute('data-dlc'); render(el, lang, st); }
      else if ((b = tg.closest('[data-lfr]'))) { st.fr = b.getAttribute('data-lfr'); render(el, lang, st); }
      else if ((b = tg.closest('[data-dlf]'))) { st.fr = b.getAttribute('data-dlf'); render(el, lang, st); }
      else if ((b = tg.closest('[data-dll]'))) { st.lsel = b.getAttribute('data-dll'); render(el, lang, st); }
      else if ((b = tg.closest('[data-dl]'))) { st.sel = b.getAttribute('data-dl'); render(el, lang, st); }
    });
    el.addEventListener('keydown', function (e) { var g = e.target && e.target.getAttribute ? e.target : null; if (!g || (e.key !== 'Enter' && e.key !== ' ')) return; var r = g.getAttribute('data-dl'); if (r) { e.preventDefault(); st.sel = r; render(el, lang, st); } else if ((r = g.getAttribute('data-dll'))) { e.preventDefault(); st.lsel = r; render(el, lang, st); } else if ((r = g.getAttribute('data-dlc'))) { e.preventDefault(); st.hc = r; render(el, lang, st); } else if ((r = g.getAttribute('data-dlf'))) { e.preventDefault(); st.fr = r; render(el, lang, st); } });
    el.addEventListener('change', function (e) {
      var k = e.target && e.target.getAttribute && e.target.getAttribute('data-dc'), m = e.target && e.target.getAttribute && e.target.getAttribute('data-dm');
      if (k === 'crop') { st.crop = e.target.value; st.year = null; st.sel = 'DE'; render(el, lang, st); } else if (k === 'year') { st.year = +e.target.value; render(el, lang, st); } else if (m) { st[m] = e.target.value; render(el, lang, st); }
    });
  }
  window.DEFarm = { mount: mount, _quarterlyOut: quarterlyOut };
})();
