/* Dehesa Index — Bosque y madera (bosque.html).
   Datos: data/forest-timber-prices.json (precios oficiales por surtido: SI, CZ, LV, FI, PL), data/worldbank-timber.json (madera tropical, Banco Mundial),
   data/forest-fires.json (EFFIS y GWIS), data/forest-damage.json (cortas, daños y escarabajo), data/wood-energy.json (pellets y astillas).
   Cifras tal cual las publican las fuentes. Cálculos de esta página, rotulados como tales: variación frente al mismo periodo del año anterior y la media de
   superficie quemada de los 10 años completos anteriores. Los precios de países distintos NO están armonizados (IVA, tipo de precio y surtido varían). ES5. */
(function (global) {
  'use strict';
  var S = global.DehesaShared;
  var IX = { es: 0, en: 1, fr: 2, it: 3 }, LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
  function L(es, en, fr, it) { return [es, en, fr, it]; }
  function lg() { var l = S && S.getLang ? S.getLang() : 'es'; return IX[l] != null ? l : 'es'; }
  function tx(a) { return a[IX[lg()]]; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function num(v, d) { return v == null ? '—' : v.toLocaleString(LOC[lg()], { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function pct(v) { return v == null ? '—' : v.toLocaleString(LOC[lg()], { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' }).replace('-', '−') + ' %'; }
  var INT = { 'm3 (sin corteza)': 1, ha: 1, t: 1 };
  function dec(v, u) { var a = Math.abs(v); return INT[u] ? 0 : a >= 1000 ? 0 : a >= 100 ? 1 : a >= 10 ? 1 : 2; }
  var T = {
    title: L('Bosque y madera', 'Forests and timber', 'Forêts et bois', 'Foreste e legno'),
    sub: L('Precios oficiales de la madera por surtido, incendios forestales de 36 países, cortas, daños y escarabajo de la corteza, pellets y astillas. Cifras oficiales de cada fuente, sin armonizar entre países.',
           'Official timber prices by assortment, forest fires in 36 countries, felling, damage and bark beetle, pellets and wood chips. Official figures from each source, not harmonised between countries.',
           'Prix officiels du bois par assortiment, incendies de forêt dans 36 pays, coupes, dégâts et scolytes, granulés et plaquettes. Chiffres officiels de chaque source, non harmonisés entre pays.',
           'Prezzi ufficiali del legname per assortimento, incendi boschivi in 36 paesi, tagli, danni e bostrico, pellet e cippato. Dati ufficiali di ciascuna fonte, non armonizzati tra paesi.'),
    loading: L('Cargando datos del bosque…', 'Loading forest data…', 'Chargement des données forestières…', 'Caricamento dei dati forestali…'),
    fail: L('No se han podido cargar los datos. Vuelve a intentarlo más tarde.', 'The data could not be loaded. Please try again later.', 'Les données n’ont pas pu être chargées. Réessayez plus tard.', 'Impossibile caricare i dati. Riprova più tardi.'),
    tabs: { prices: L('Precios de la madera', 'Timber prices', 'Prix du bois', 'Prezzi del legname'), fires: L('Incendios', 'Fires', 'Incendies', 'Incendi'),
            damage: L('Cortas y daños', 'Felling and damage', 'Coupes et dégâts', 'Tagli e danni'), energy: L('Energía de la madera', 'Wood energy', 'Énergie du bois', 'Energia dal legno') },
    cty: { SI: L('Eslovenia', 'Slovenia', 'Slovénie', 'Slovenia'), CZ: L('Chequia', 'Czechia', 'Tchéquie', 'Cechia'), LV: L('Letonia', 'Latvia', 'Lettonie', 'Lettonia'), FI: L('Finlandia', 'Finland', 'Finlande', 'Finlandia'),
           PL: L('Polonia', 'Poland', 'Pologne', 'Polonia'), TR: L('Madera tropical', 'Tropical timber', 'Bois tropical', 'Legname tropicale'), SE: L('Suecia', 'Sweden', 'Suède', 'Svezia'),
           EE: L('Estonia', 'Estonia', 'Estonie', 'Estonia'), HU: L('Hungría', 'Hungary', 'Hongrie', 'Ungheria'), US: L('EE. UU.', 'United States', 'États-Unis', 'Stati Uniti') },
    freq: { M: L('mensual', 'monthly', 'mensuel', 'mensile'), Q: L('trimestral', 'quarterly', 'trimestriel', 'trimestrale'), H: L('semestral', 'half-yearly', 'semestriel', 'semestrale'),
            W: L('semanal', 'weekly', 'hebdomadaire', 'settimanale'), A: L('anual', 'annual', 'annuel', 'annuale') },
    vat: { incl: L('con IVA', 'incl. VAT', 'TVA incluse', 'IVA inclusa'), excl: L('sin IVA', 'excl. VAT', 'hors TVA', 'IVA esclusa'), 'n/d': L('IVA no indicado por la fuente', 'VAT not stated by the source', 'TVA non précisée par la source', 'IVA non indicata dalla fonte') },
    region: L('Región de precios', 'Price region', 'Région de prix', 'Regione di prezzo'), wholeCountry: L('Todo el país', 'Whole country', 'Tout le pays', 'Tutto il paese'),
    hSeries: L('Serie', 'Series', 'Série', 'Serie'), hLast: L('Último dato', 'Latest', 'Dernier', 'Ultimo'), hChg: L('Frente a un año antes', 'Vs a year earlier', 'Vs un an avant', 'Rispetto a un anno prima'),
    hPer: L('Periodo', 'Period', 'Période', 'Periodo'), vsNote: L('La variación frente a un año antes es un cálculo de Dehesa Index con las cifras publicadas.', 'The change against a year earlier is a Dehesa Index calculation from the published figures.',
            'La variation sur un an est un calcul de Dehesa Index à partir des chiffres publiés.', 'La variazione su un anno è un calcolo di Dehesa Index sui dati pubblicati.'),
    pickRow: L('Pulsa una fila para ver su gráfica.', 'Select a row to see its chart.', 'Sélectionnez une ligne pour voir son graphique.', 'Seleziona una riga per vedere il grafico.'),
    pricesNote: L('Cada país publica un precio distinto (de compra por las empresas, de venta por el propietario, en pie o de la tasa forestal), con o sin IVA y en su moneda. No compares países entre sí: compara cada serie con su propia historia. Los nombres de los surtidos están en inglés, como los publica la fuente.',
                  'Each country publishes a different price (bought by firms, sold by the owner, standing or forest-tax base), with or without VAT and in its own currency. Do not compare countries with each other: compare each series with its own history. Assortment names are in English, as the source publishes them.',
                  'Chaque pays publie un prix différent (d’achat par les entreprises, de vente par le propriétaire, sur pied ou base de la taxe forestière), avec ou sans TVA et dans sa monnaie. Ne comparez pas les pays entre eux : comparez chaque série à son propre historique. Les noms des assortiments sont en anglais, comme dans la source.',
                  'Ogni paese pubblica un prezzo diverso (d’acquisto delle imprese, di vendita del proprietario, in piedi o base dell’imposta forestale), con o senza IVA e nella propria valuta. Non confrontare i paesi tra loro: confronta ogni serie con la propria storia. I nomi degli assortimenti sono in inglese, come nella fonte.'),
    bgNote: L('Bulgaria no aparece: su instituto de estadística publica precios trimestrales por surtido, pero su licencia prohíbe difundir obras derivadas y está pendiente de decisión.',
              'Bulgaria is not shown: its statistics office publishes quarterly prices by assortment, but its licence bars disseminating derivative works and is pending a decision.',
              'La Bulgarie n’apparaît pas : son institut de statistique publie des prix trimestriels par assortiment, mais sa licence interdit la diffusion d’œuvres dérivées et reste à trancher.',
              'La Bulgaria non compare: il suo istituto di statistica pubblica prezzi trimestrali per assortimento, ma la licenza vieta di diffondere opere derivate ed è in attesa di decisione.'),
    trNote: L('Precios de exportación de maderas tropicales (FOB, Camerún y Malasia; contrachapado de Asia en centavos de dólar por hoja). No son precios de la madera europea.',
              'Export prices of tropical timber (FOB, Cameroon and Malaysia; Asian plywood in US cents per sheet). They are not European timber prices.',
              'Prix à l’exportation des bois tropicaux (FOB, Cameroun et Malaisie ; contreplaqué d’Asie en cents de dollar par feuille). Ce ne sont pas des prix du bois européen.',
              'Prezzi all’esportazione del legname tropicale (FOB, Camerun e Malesia; compensato asiatico in centesimi di dollaro per foglio). Non sono prezzi del legname europeo.'),
    country: L('País', 'Country', 'Pays', 'Paese'), ba: L('Superficie quemada', 'Burnt area', 'Surface brûlée', 'Superficie bruciata'), nf: L('Incendios cartografiados', 'Mapped fires', 'Incendies cartographiés', 'Incendi mappati'),
    ytd: L('del año en curso', 'year to date', 'depuis janvier', 'da inizio anno'), prevY: L('Año anterior', 'Previous year', 'Année précédente', 'Anno precedente'),
    avg10: L('Media de los 10 años anteriores', 'Average of the previous 10 years', 'Moyenne des 10 années précédentes', 'Media dei 10 anni precedenti'),
    vsAvg: L('Frente a la media', 'Vs the average', 'Vs la moyenne', 'Rispetto alla media'), ha: L('ha', 'ha', 'ha', 'ha'),
    fireTitle: L('Superficie quemada por año (ha)', 'Burnt area per year (ha)', 'Surface brûlée par an (ha)', 'Superficie bruciata per anno (ha)'),
    fireTbl: L('Ranking de países en el año en curso', 'Country ranking, current year', 'Classement des pays, année en cours', 'Classifica dei paesi, anno in corso'),
    fireNote: L('Estimaciones por satélite de los perímetros quemados (EFFIS para la UE, el Reino Unido y Suiza, desde 2006; GWIS para el resto, desde 2012). No son las estadísticas de los servicios de extinción de cada país y no son comparables entre los dos sistemas. El último año es el acumulado hasta hoy. La media de 10 años es un cálculo de Dehesa Index.',
                'Satellite estimates of burnt perimeters (EFFIS for the EU, the UK and Switzerland, since 2006; GWIS for the rest, since 2012). They are not national fire-service statistics and are not comparable between the two systems. The latest year is the total to date. The 10-year average is a Dehesa Index calculation.',
                'Estimations par satellite des périmètres brûlés (EFFIS pour l’UE, le Royaume-Uni et la Suisse, depuis 2006 ; GWIS pour les autres, depuis 2012). Ce ne sont pas les statistiques des services d’incendie nationaux et elles ne sont pas comparables entre les deux systèmes. La dernière année est le cumul à ce jour. La moyenne sur 10 ans est un calcul de Dehesa Index.',
                'Stime satellitari dei perimetri bruciati (EFFIS per l’UE, il Regno Unito e la Svizzera, dal 2006; GWIS per gli altri, dal 2012). Non sono le statistiche dei servizi antincendio nazionali e non sono confrontabili tra i due sistemi. L’ultimo anno è il cumulato a oggi. La media a 10 anni è un calcolo di Dehesa Index.'),
    EU: L('Unión Europea (27)', 'European Union (27)', 'Union européenne (27)', 'Unione europea (27)'),
    dmgNote: L('Cortas y daños tal como los publica cada país; las definiciones (tala fortuita, rodales destruidos, superficie dañada) no son equivalentes entre países. La media semanal de escarabajos por trampa de Suecia es un cálculo de Dehesa Index sobre las medias por trampa de Skogsstyrelsen.',
               'Felling and damage as each country publishes them; definitions (salvage felling, destroyed stands, damaged area) are not equivalent between countries. The Swedish weekly mean of beetles per trap is a Dehesa Index calculation over Skogsstyrelsen’s per-trap means.',
               'Coupes et dégâts tels que chaque pays les publie ; les définitions (coupe de salubrité, peuplements détruits, surface endommagée) ne sont pas équivalentes entre pays. La moyenne hebdomadaire de scolytes par piège en Suède est un calcul de Dehesa Index sur les moyennes par piège de Skogsstyrelsen.',
               'Tagli e danni come li pubblica ciascun paese; le definizioni (taglio fortuito, popolamenti distrutti, superficie danneggiata) non sono equivalenti tra paesi. La media settimanale di bostrici per trappola in Svezia è un calcolo di Dehesa Index sulle medie per trappola di Skogsstyrelsen.'),
    enNote: L('Pellets de EE. UU. (EIA): la EIA solo publica el año en curso, así que la serie se acumula desde el día en que Dehesa Index empezó a guardarla. Finlandia: pellet al consumidor con IVA y astillas forestales entregadas sin IVA, trimestrales.',
              'US pellets (EIA): the EIA only publishes the current year, so the series accumulates from the day Dehesa Index started storing it. Finland: consumer pellet price incl. VAT and delivered forest chips excl. VAT, quarterly.',
              'Granulés des États-Unis (EIA) : l’EIA ne publie que l’année en cours, la série s’accumule donc depuis le jour où Dehesa Index a commencé à la conserver. Finlande : granulés au consommateur TVA incluse et plaquettes forestières livrées hors TVA, trimestriels.',
              'Pellet degli Stati Uniti (EIA): l’EIA pubblica solo l’anno in corso, quindi la serie si accumula dal giorno in cui Dehesa Index ha iniziato a conservarla. Finlandia: pellet al consumatore IVA inclusa e cippato forestale consegnato IVA esclusa, trimestrali.'),
    src: L('Fuente:', 'Source:', 'Source :', 'Fonte:'), lic: L('Licencia:', 'Licence:', 'Licence :', 'Licenza:')
  };
  var CN = { EU: 0, AT: L('Austria', 'Austria', 'Autriche', 'Austria'), BE: L('Bélgica', 'Belgium', 'Belgique', 'Belgio'), BG: L('Bulgaria', 'Bulgaria', 'Bulgarie', 'Bulgaria'), HR: L('Croacia', 'Croatia', 'Croatie', 'Croazia'),
    CY: L('Chipre', 'Cyprus', 'Chypre', 'Cipro'), CZ: T.cty.CZ, DK: L('Dinamarca', 'Denmark', 'Danemark', 'Danimarca'), EE: T.cty.EE, FI: T.cty.FI, FR: L('Francia', 'France', 'France', 'Francia'),
    DE: L('Alemania', 'Germany', 'Allemagne', 'Germania'), EL: L('Grecia', 'Greece', 'Grèce', 'Grecia'), HU: T.cty.HU, IE: L('Irlanda', 'Ireland', 'Irlande', 'Irlanda'), IT: L('Italia', 'Italy', 'Italie', 'Italia'),
    LV: T.cty.LV, LT: L('Lituania', 'Lithuania', 'Lituanie', 'Lituania'), LU: L('Luxemburgo', 'Luxembourg', 'Luxembourg', 'Lussemburgo'), MT: L('Malta', 'Malta', 'Malte', 'Malta'),
    NL: L('Países Bajos', 'Netherlands', 'Pays-Bas', 'Paesi Bassi'), PL: T.cty.PL, PT: L('Portugal', 'Portugal', 'Portugal', 'Portogallo'), RO: L('Rumanía', 'Romania', 'Roumanie', 'Romania'),
    SK: L('Eslovaquia', 'Slovakia', 'Slovaquie', 'Slovacchia'), SI: T.cty.SI, ES: L('España', 'Spain', 'Espagne', 'Spagna'), SE: T.cty.SE, UK: L('Reino Unido', 'United Kingdom', 'Royaume-Uni', 'Regno Unito'),
    CH: L('Suiza', 'Switzerland', 'Suisse', 'Svizzera'), US: T.cty.US, CA: L('Canadá', 'Canada', 'Canada', 'Canada'), AU: L('Australia', 'Australia', 'Australie', 'Australia'),
    AR: L('Argentina', 'Argentina', 'Argentine', 'Argentina'), CL: L('Chile', 'Chile', 'Chili', 'Cile'), UY: L('Uruguay', 'Uruguay', 'Uruguay', 'Uruguay') };
  CN.EU = T.EU;
  var UNIT = { 'EUR/m3': '€/m³', 'CZK/m3': 'CZK/m³', 'PLN/m3': 'PLN/m³', 'USD/t': 'USD/t', 'EUR/t': '€/t', 'EUR/MWh': '€/MWh', 'USD/m3': 'USD/m³', 'USc/sheet': 'US¢/' + 'sheet', 't': 't', 'ha': 'ha',
    'm3 (sin corteza)': 'm³', 'milj. m3sk': 'M m³sk', 'milj. m3fub': 'M m³fub', 'escarabajos por trampa': '/trap' };
  function unit(u) { return UNIT[u] || u; }
  var DATA = null, ST = { s: 'prices', pc: 'SI', reg: '', sel: {}, fc: 'ES', dc: 'CZ', ec: 'us-pellet-domestic-price' };
  function getJ(f) { return fetch('data/' + f + '.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function loadAll() {
    return Promise.all([getJ('forest-timber-prices'), getJ('worldbank-timber'), getJ('forest-fires'), getJ('forest-damage'), getJ('wood-energy')]).then(function (r) {
      return { tp: r[0], wb: r[1], ff: r[2], fd: r[3], we: r[4] };
    });
  }
  /* periodo -> milisegundos UTC */
  function ts(p, f) {
    var y = +p.slice(0, 4), m;
    if (f === 'A') return Date.UTC(y, 0, 1);
    if (f === 'M') return Date.UTC(y, +p.slice(5, 7) - 1, 1);
    if (f === 'Q') return Date.UTC(y, (+p.slice(6, 7) - 1) * 3, 1);
    if (f === 'H') return Date.UTC(y, p.slice(6, 7) === '1' ? 0 : 6, 1);
    m = +p.slice(6, 8); return Date.UTC(y, 0, 4) + ((m - 1) * 7 - ((new Date(Date.UTC(y, 0, 4)).getUTCDay() + 6) % 7)) * 86400000;
  }
  var BACK = { A: 1, M: 12, Q: 4, H: 2, W: 52 };
  function lastIdx(v) { for (var i = v.length - 1; i >= 0; i--) if (v[i] != null) return i; return -1; }
  function yoy(s) {
    var i = lastIdx(s.values), j = i - BACK[s.freq]; if (i < 0 || j < 0 || s.values[j] == null || s.values[j] === 0) return null;
    return (s.values[i] / s.values[j] - 1) * 100;
  }
  function chart(series, o) {
    var C = global.DehesaChart; if (!C) return '';
    var pts = [], i; for (i = 0; i < series.periods.length; i++) if (series.values[i] != null) pts.push({ x: ts(series.periods[i], series.freq), y: series.values[i], l: series.periods[i] });
    if (pts.length < 2) return '';
    return C.render({ series: [{ name: o.name, color: '#2f6b4a', pts: pts }], xMode: 'time', yTitle: o.yTitle, aria: o.aria, noLegend: true, vFmt: function (v) { return num(v, o.d == null ? dec(v) : o.d); } });
  }
  function srcLine(s) {
    return '<div class="di-field-hint di-info-sources">' + esc(tx(T.src)) + ' <a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.name) + '</a> · ' + esc(tx(T.lic)) + ' ' + esc(s.license) + '</div>';
  }
  function chips(attr, items, cur) {
    return '<div class="dch"><div class="dch-row">' + items.map(function (o) { return '<button type="button" class="dch-b" data-' + attr + '="' + esc(o[0]) + '" aria-pressed="' + (o[0] === cur) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div></div>';
  }
  /* tabla de series + gráfica de la seleccionada */
  function seriesBlock(list, key, extra) {
    var selId = ST.sel[key], cur = null, i;
    for (i = 0; i < list.length; i++) if (list[i].id === selId) cur = list[i];
    if (!cur) cur = list[0];
    ST.sel[key] = cur.id;
    var rows = list.map(function (s) {
      var li = lastIdx(s.values), c = yoy(s), on = s.id === cur.id;
      return '<tr class="fsh-row' + (on ? ' on' : '') + '" tabindex="0" data-sid="' + esc(s.id) + '"><td>' + esc(s.label) + (s.tag ? ' <span class="fsh-m">' + esc(s.tag) + '</span>' : '') + '</td><td class="num">' + (li < 0 ? '—' : num(s.values[li], dec(s.values[li], s.unit)) + ' <span class="fsh-m">' + esc(unit(s.unit)) + '</span>') +
        '</td><td class="num">' + (li < 0 ? '' : esc(s.periods[li])) + '</td><td class="num"><span class="fsh-chg ' + (c == null ? '' : c >= 0 ? 'up' : 'dn') + '">' + pct(c) + '</span></td></tr>';
    }).join('');
    var ch = chart(cur, { name: cur.label, yTitle: unit(cur.unit), aria: cur.label, d: INT[cur.unit] ? 0 : null });
    return '<div class="fsh-sec"><div class="fsh-m">' + esc(tx(T.pickRow)) + '</div><div style="overflow-x:auto"><table class="fsh-tbl"><thead><tr><th>' + esc(tx(T.hSeries)) + '</th><th class="num">' + esc(tx(T.hLast)) + '</th><th class="num">' + esc(tx(T.hPer)) +
      '</th><th class="num">' + esc(tx(T.hChg)) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="fsh-m">' + esc(tx(T.vsNote)) + '</p></div>' +
      '<div class="di-card di-info-card wp-card"><div class="di-info-card-title">' + esc(cur.label) + ' · ' + esc(unit(cur.unit)) + (cur.freq ? ' · ' + esc(tx(T.freq[cur.freq])) : '') + '</div>' + (ch || '') + (extra ? extra(cur) : '') + '</div>' + (cur.source ? srcLine(cur.source) : '');
  }
  /* ---- precios ---- */
  function pricesView(D) {
    var tp = D.tp, cs = ['SI', 'CZ', 'LV', 'FI', 'PL'].filter(function (c) { return tp && tp.countries && tp.countries[c]; });
    var items = cs.map(function (c) { return [c, tx(T.cty[c])]; });
    if (D.wb && D.wb.series) items.push(['TR', tx(T.cty.TR)]);
    if (!items.length) return '';
    if (!items.some(function (o) { return o[0] === ST.pc; })) ST.pc = items[0][0];
    var html = chips('bq-pc', items, ST.pc), list, note, head = '';
    if (ST.pc === 'TR') {
      list = D.wb.series.map(function (s) { return { id: s.id, label: s.name[lg()] || s.name.en, unit: s.unit, freq: 'M', periods: s.points.map(function (p) { return p[0]; }), values: s.points.map(function (p) { return p[1]; }), source: D.wb.source }; });
      note = tx(T.trNote);
    } else {
      var c = tp.countries[ST.pc], regs = {}, hasReg = false;
      c.series.forEach(function (s) { if (s.region) { regs[s.region] = 1; hasReg = true; } });
      if (hasReg) {
        var ro = [['', tx(T.wholeCountry)]].concat(Object.keys(regs).sort().map(function (r) { return [r, r]; }));
        if (!ro.some(function (o) { return o[0] === ST.reg; })) ST.reg = '';
        head = '<div class="fsh-pick"><label>' + esc(tx(T.region)) + ' <select id="bq-reg">' + ro.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === ST.reg ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label></div>';
      }
      list = c.series.filter(function (s) { return hasReg ? (s.region || '') === ST.reg : true; }).map(function (s) {
        return { id: s.id, label: s.label, unit: c.unit, freq: c.freq, periods: c.periods, values: s.values, source: c.source, tag: s.bench ? '' : '' };
      });
      note = tx(T.pricesNote) + ' ' + c.note + ' (' + tx(T.freq[c.freq]) + ', ' + tx(T.vat[c.vat] || T.vat['n/d']) + ')';
    }
    return html + head + seriesBlock(list, 'p' + ST.pc + ST.reg) + '<div class="di-info-scope-note">' + esc(note) + '</div>' + (ST.pc === 'TR' ? '' : '<div class="di-info-scope-note">' + esc(tx(T.bgNote)) + '</div>');
  }
  /* ---- incendios ---- */
  function fireStats(ff, cc) {
    var c = ff.countries[cc], n = ff.years.length, cy = ff.currentYear, i = n - 1, prev = n >= 2 ? c.ba[n - 2] : null, s = 0, k = 0, j;
    for (j = n - 11; j < n - 1; j++) if (j >= 0 && c.ba[j] != null) { s += c.ba[j]; k++; }
    return { ba: c.ba[i], nf: c.nf[i], prev: prev, avg: k >= 5 ? s / k : null, cy: cy };
  }
  function firesView(D) {
    var ff = D.ff; if (!ff) return '';
    var keys = Object.keys(ff.countries);
    if (!ff.countries[ST.fc]) ST.fc = 'ES';
    var opts = keys.slice().sort(function (a, b) { return tx(CN[a] || [a, a, a, a]).localeCompare(tx(CN[b] || [b, b, b, b]), LOC[lg()]); }).map(function (k) {
      return '<option value="' + k + '"' + (k === ST.fc ? ' selected' : '') + '>' + esc(tx(CN[k] || [k, k, k, k])) + '</option>';
    }).join('');
    var st = fireStats(ff, ST.fc), c = ff.countries[ST.fc];
    var series = { freq: 'A', periods: ff.years.map(String), values: c.ba };
    var ch = chart(series, { name: tx(T.ba), yTitle: 'ha', aria: tx(T.fireTitle) });
    var kp = function (l, v, u, sub) { return '<div class="fsh-kpi"><div class="fsh-kl">' + esc(l) + '</div><div class="fsh-kv">' + v + ' <span class="fsh-ku">' + esc(u) + '</span></div>' + (sub ? '<div class="fsh-kp">' + sub + '</div>' : '') + '</div>'; };
    var vs = st.avg && st.ba != null ? pct((st.ba / st.avg - 1) * 100) : '—';
    var kpis = '<div class="fsh-kpis">' + kp(tx(T.ba) + ' ' + st.cy + ' (' + tx(T.ytd) + ')', num(st.ba), 'ha') + kp(tx(T.nf) + ' ' + st.cy, num(st.nf), '') + kp(tx(T.prevY) + ' ' + (st.cy - 1), num(st.prev), 'ha') +
      kp(tx(T.avg10), num(st.avg == null ? null : Math.round(st.avg)), 'ha', esc(tx(T.vsAvg)) + ': ' + vs) + '</div>';
    var rank = keys.map(function (k) { var x = fireStats(ff, k); x.k = k; return x; }).filter(function (x) { return x.ba != null; }).sort(function (a, b) { return b.ba - a.ba; });
    var rows = rank.map(function (x) {
      var v = x.avg ? (x.ba / x.avg - 1) * 100 : null;
      return '<tr class="fsh-row' + (x.k === ST.fc ? ' on' : '') + '" tabindex="0" data-fc="' + x.k + '"><td>' + esc(tx(CN[x.k] || [x.k, x.k, x.k, x.k])) + '</td><td class="num">' + num(x.ba) + '</td><td class="num">' + num(x.nf) + '</td><td class="num">' + num(x.prev) + '</td><td class="num">' + num(x.avg == null ? null : Math.round(x.avg)) +
        '</td><td class="num"><span class="fsh-chg ' + (v == null ? '' : v >= 0 ? 'up' : 'dn') + '">' + pct(v) + '</span></td></tr>';
    }).join('');
    return '<div class="fsh-pick"><label>' + esc(tx(T.country)) + ' <select id="bq-fc">' + opts + '</select></label></div>' + kpis +
      '<div class="di-card di-info-card wp-card"><div class="di-info-card-title">' + esc(tx(T.fireTitle)) + ' · ' + esc(tx(CN[ST.fc] || [ST.fc, ST.fc, ST.fc, ST.fc])) + ' · ' + esc(c.system.toUpperCase()) + '</div>' + ch + '</div>' +
      '<div class="fsh-sec"><h2 class="fsh-h2">' + esc(tx(T.fireTbl)) + ' (' + st.cy + ')</h2><div style="overflow-x:auto"><table class="fsh-tbl"><thead><tr><th>' + esc(tx(T.country)) + '</th><th class="num">' + esc(tx(T.ba)) + ' (ha)</th><th class="num">' + esc(tx(T.nf)) + '</th><th class="num">' + esc(tx(T.prevY)) +
      ' (ha)</th><th class="num">' + esc(tx(T.avg10)) + ' (ha)</th><th class="num">' + esc(tx(T.vsAvg)) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="di-info-scope-note">' + esc(tx(T.fireNote)) + '</div>' + srcLine(ff.source);
  }
  /* ---- cortas y daños ---- */
  function damageView(D) {
    var fd = D.fd; if (!fd) return '';
    var cs = ['CZ', 'SE', 'EE', 'HU'].filter(function (c) { return fd.series.some(function (s) { return s.country === c; }); });
    if (cs.indexOf(ST.dc) < 0) ST.dc = cs[0];
    var list = fd.series.filter(function (s) { return s.country === ST.dc; });
    return chips('bq-dc', cs.map(function (c) { return [c, tx(T.cty[c])]; }), ST.dc) + seriesBlock(list, 'd' + ST.dc) + '<div class="di-info-scope-note">' + esc(tx(T.dmgNote)) + '</div>';
  }
  /* ---- energia ---- */
  function energyView(D) {
    var we = D.we; if (!we) return '';
    var list = we.series.map(function (s) { return { id: s.id, label: s.label, unit: s.unit, freq: s.freq, periods: s.periods, values: s.values, source: s.source, tag: s.id.slice(0, 2).toUpperCase() }; });
    return seriesBlock(list, 'e') + '<div class="di-info-scope-note">' + esc(tx(T.enNote)) + '</div>';
  }
  function page() {
    var root = document.getElementById('bq-body'); if (!root) return;
    if (!DATA) return;
    var D = DATA, tabs = ['prices', 'fires', 'damage', 'energy'].map(function (k) { return [k, tx(T.tabs[k])]; });
    var body = ST.s === 'fires' ? firesView(D) : ST.s === 'damage' ? damageView(D) : ST.s === 'energy' ? energyView(D) : pricesView(D);
    root.innerHTML = '<div class="di-badge di-badge-green di-info-badge">' + esc(tx(L('DATOS OFICIALES REALES', 'REAL OFFICIAL DATA', 'DONNÉES OFFICIELLES RÉELLES', 'DATI UFFICIALI REALI'))) + '</div>' + chips('bq-s', tabs, ST.s) + (body || '<p class="di-movers-hint">' + esc(tx(T.fail)) + '</p>');
    document.getElementById('bq-h1').textContent = tx(T.title); document.getElementById('bq-sub').textContent = tx(T.sub);
    try { document.title = tx(T.title) + ' | Dehesa Index'; } catch (e) {}
  }
  function keep(fn) { var a = document.activeElement, id = a && a.getAttribute ? (a.getAttribute('data-bq-s') || a.getAttribute('data-bq-pc') || a.getAttribute('data-bq-dc') || a.getAttribute('data-sid') || a.getAttribute('data-fc')) : null; fn(); if (id) { var e = document.querySelector('[data-bq-s="' + id + '"],[data-bq-pc="' + id + '"],[data-bq-dc="' + id + '"],[data-sid="' + id + '"],[data-fc="' + id + '"]'); if (e && e.focus) e.focus(); } }
  function url() { try { var u = new URL(global.location.href); u.searchParams.set('s', ST.s); global.history.replaceState(null, '', u.toString()); } catch (e) {} }
  function bind() {
    var root = document.getElementById('bq-body');
    root.addEventListener('click', function (ev) {
      var t = ev.target, b = t.closest ? t.closest('[data-bq-s],[data-bq-pc],[data-bq-dc],tr[data-sid],tr[data-fc]') : null; if (!b) return;
      keep(function () {
        if (b.hasAttribute('data-bq-s')) { ST.s = b.getAttribute('data-bq-s'); url(); }
        else if (b.hasAttribute('data-bq-pc')) { ST.pc = b.getAttribute('data-bq-pc'); ST.reg = ''; }
        else if (b.hasAttribute('data-bq-dc')) ST.dc = b.getAttribute('data-bq-dc');
        else if (b.hasAttribute('data-fc')) ST.fc = b.getAttribute('data-fc');
        else if (b.hasAttribute('data-sid')) {
          var k = ST.s === 'prices' ? 'p' + ST.pc + ST.reg : ST.s === 'damage' ? 'd' + ST.dc : 'e'; ST.sel[k] = b.getAttribute('data-sid');
        }
        page();
      });
    });
    root.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && ev.target.getAttribute && (ev.target.getAttribute('data-sid') || ev.target.getAttribute('data-fc'))) ev.target.click(); });
    root.addEventListener('change', function (ev) {
      if (ev.target.id === 'bq-fc') { ST.fc = ev.target.value; page(); var e = document.getElementById('bq-fc'); if (e) e.focus(); }
      else if (ev.target.id === 'bq-reg') { ST.reg = ev.target.value; page(); var r = document.getElementById('bq-reg'); if (r) r.focus(); }
    });
  }
  if (document.getElementById('bq-body')) {
    if (S.init) S.init('production');
    try { var q = new URLSearchParams(global.location.search).get('s'); if (q && T.tabs[q]) ST.s = q; } catch (e) {}
    S.onLangChange = function () { page(); };
    document.getElementById('bq-body').innerHTML = '<p class="di-movers-hint">' + esc(tx(T.loading)) + '</p>';
    bind();
    loadAll().then(function (D) { DATA = D; if (!D.tp && !D.ff && !D.fd && !D.we) { document.getElementById('bq-body').innerHTML = '<p class="di-movers-hint">' + esc(tx(T.fail)) + '</p>'; return; } page(); });
  }
})(window);
