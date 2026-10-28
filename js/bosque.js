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
  var INT = { 'm3 (sin corteza)': 1, ha: 1, t: 1, 'ezer m3': 1, '1000 m3sk': 1, 'HUF/100 kg': 1 };
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
    region: L('Región', 'Region', 'Région', 'Regione'), wholeCountry: L('Todo el país', 'Whole country', 'Tout le pays', 'Tutto il paese'),
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
    enNote: L('Pellets de EE. UU. (EIA): años cerrados desde el informe de diciembre archivado por la EIA (2017 en adelante) y el año en curso desde el informe mensual vigente; la EIA revisa cifras. Finlandia: pellet al consumidor con IVA y astillas forestales entregadas sin IVA, trimestrales. Hungría: precio al consumidor de la leña aserrada estándar, con IVA, mensual.',
              'US pellets (EIA): closed years come from the December report archived by the EIA (2017 onwards) and the current year from the live monthly report; the EIA revises figures. Finland: consumer pellet price incl. VAT and delivered forest chips excl. VAT, quarterly. Hungary: consumer price of standard sawn firewood, incl. VAT, monthly.',
              'Granulés des États-Unis (EIA) : les années closes viennent du rapport de décembre archivé par l’EIA (2017 et suivantes), l’année en cours du rapport mensuel en vigueur ; l’EIA révise ses chiffres. Finlande : granulés au consommateur TVA incluse et plaquettes forestières livrées hors TVA, trimestriels. Hongrie : prix à la consommation du bois de chauffage scié standard, TVA incluse, mensuel.',
              'Pellet degli Stati Uniti (EIA): gli anni chiusi provengono dal rapporto di dicembre archiviato dall’EIA (dal 2017) e l’anno in corso dal rapporto mensile vigente; l’EIA rivede le cifre. Finlandia: pellet al consumatore IVA inclusa e cippato forestale consegnato IVA esclusa, trimestrali. Ungheria: prezzo al consumo della legna da ardere segata standard, IVA inclusa, mensile.'),
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
    'm3 (sin corteza)': 'm³', 'ezer m3': '1000 m³', '1000 m3sk': '1000 m³sk', 'HUF/100 kg': 'HUF/100 kg', '%': '%', 'milj. m3sk': 'M m³sk', 'milj. m3fub': 'M m³fub', 'escarabajos por trampa': '/trap' };
  function unit(u) { var t = typeof UNITL !== 'undefined' && UNITL[u]; return t ? tx(t) : UNIT[u] || u; }
  /* ---- nombres de surtidos y series en los 4 idiomas (las fuentes los publican en inglés; los datos siguen en inglés, se traduce al pintar) ---- */
  var SP = { 'pine': ['pino', 'pin', 'pino'], 'spruce': ['abeto rojo', 'épicéa', 'abete rosso'], 'birch': ['abedul', 'bouleau', 'betulla'], 'black alder': ['aliso negro', 'aulne noir', 'ontano nero'], 'asp': ['álamo temblón', 'tremble', 'pioppo tremulo'], 'oak': ['roble', 'chêne', 'quercia'], 'beech': ['haya', 'hêtre', 'faggio'] };
  var KIND = { 'sawlogs': ['Rollizos para aserrío', 'Grumes de sciage', 'Tronchi da sega'], 'logs': ['Rollizos para aserrío', 'Grumes de sciage', 'Tronchi da sega'], 'pulpwood': ['Madera para trituración', 'Bois de trituration', 'Legname da cellulosa'], 'veneer logs': ['Rollizos de desenrollo', 'Grumes de déroulage', 'Tronchi da sfogliatura'] };
  var DIA = [
    [/ up to (\d+) cm in diameter$/, [' hasta $1 cm de diámetro', ' jusqu’à $1 cm de diamètre', ' fino a $1 cm di diametro']],
    [/ more than (\d+) cm in diameter$/, [' de más de $1 cm de diámetro', ' de plus de $1 cm de diamètre', ' di oltre $1 cm di diametro']],
    [/ (\d+-\d+) cm in diameter$/, [' de $1 cm de diámetro', ' de $1 cm de diamètre', ' di $1 cm di diametro']]
  ];
  var QUAL = { 'total': ['total', 'total', 'totale'], 'coniferous': ['coníferas', 'résineux', 'conifere'], 'non-coniferous': ['frondosas', 'feuillus', 'latifoglie'], 'broadleaf': ['frondosas', 'feuillus', 'latifoglie'], 'non-coniferous, others': ['otras frondosas', 'autres feuillus', 'altre latifoglie'], 'round and split, total': ['rolliza y partida, total', 'ronds et fendus, total', 'tondo e spaccato, totale'], 'round and split, coniferous': ['rolliza y partida, coníferas', 'ronds et fendus, résineux', 'tondo e spaccato, conifere'], 'round and split, non-coniferous': ['rolliza y partida, frondosas', 'ronds et fendus, feuillus', 'tondo e spaccato, latifoglie'] };
  var EX = {
    'Hardwood pulpwood': ['Madera para trituración de frondosas', 'Bois de trituration de feuillus', 'Legname da cellulosa di latifoglie'],
    'Softwood pulpwood': ['Madera para trituración de coníferas', 'Bois de trituration de résineux', 'Legname da cellulosa di conifere'],
    'Pulpwood, total': ['Madera para trituración, total', 'Bois de trituration, total', 'Legname da cellulosa, totale'],
    'Sawlogs (pine and spruce)': ['Rollizos para aserrío (pino y abeto rojo)', 'Grumes de sciage (pin et épicéa)', 'Tronchi da sega (pino e abete rosso)'],
    'Roundwood from state forests, total': ['Madera en rollo de los bosques estatales, total', 'Bois rond des forêts domaniales, total', 'Tondame delle foreste statali, totale'],
    'Sawlogs': ['Rollizos para aserrío', 'Grumes de sciage', 'Tronchi da sega'],
    'Pulpwood': ['Madera para trituración', 'Bois de trituration', 'Legname da cellulosa'],
    'Fuelwood': ['Leña', 'Bois de chauffage', 'Legna da ardere'],
    'Spruce sawlogs': ['Rollizos para aserrío: abeto rojo', 'Grumes de sciage : épicéa', 'Tronchi da sega: abete rosso'],
    'Pine sawlogs': ['Rollizos para aserrío: pino', 'Grumes de sciage : pin', 'Tronchi da sega: pino'],
    'Beech sawlogs': ['Rollizos para aserrío: haya', 'Grumes de sciage : hêtre', 'Tronchi da sega: faggio'],
    'Oak sawlogs': ['Rollizos para aserrío: roble', 'Grumes de sciage : chêne', 'Tronchi da sega: quercia'],
    'Coniferous standing sales: average price': ['Ventas en pie de coníferas: precio medio', 'Ventes sur pied de résineux : prix moyen', 'Vendite in piedi di conifere: prezzo medio'],
    'Softwood sawlogs: average price': ['Rollizos de coníferas para aserrío: precio medio', 'Grumes de sciage résineuses : prix moyen', 'Tronchi da sega di conifere: prezzo medio'],
    'Small roundwood: average price': ['Madera en rollo de pequeño diámetro: precio medio', 'Petit bois rond : prix moyen', 'Tondame di piccolo diametro: prezzo medio'],
    'Lumber': ['Madera aserrada', 'Bois scié', 'Legname segato'],
    'Softwood lumber': ['Madera aserrada de coníferas', 'Sciages résineux', 'Segati di conifere'],
    'Hardwood lumber': ['Madera aserrada de frondosas', 'Sciages feuillus', 'Segati di latifoglie'],
    'Plywood': ['Contrachapado', 'Contreplaqué', 'Compensato'],
    'Logs, bolts, timber, pulpwood and wood chips': ['Trozas, madera en rollo, madera para trituración y astillas', 'Grumes, bois rond, bois de trituration et plaquettes', 'Tronchi, tondame, legname da cellulosa e cippato'],
    'Gross felling, 3-year mean (1996-2020)': ['Corta bruta, media de 3 años (1996-2020)', 'Coupe brute, moyenne sur 3 ans (1996-2020)', 'Taglio lordo, media su 3 anni (1996-2020)'],
    'Forest land, total': ['Superficie forestal, total', 'Terrains forestiers, total', 'Superficie forestale, totale'],
    'Forest land: state forests': ['Superficie forestal: bosques estatales', 'Terrains forestiers : forêts d’État', 'Superficie forestale: foreste statali'],
    'Forest land: municipal forests': ['Superficie forestal: bosques municipales', 'Terrains forestiers : forêts communales', 'Superficie forestale: foreste comunali'],
    'Forest land: private forests': ['Superficie forestal: bosques privados', 'Terrains forestiers : forêts privées', 'Superficie forestale: foreste private'],
    'Forest land: other owners': ['Superficie forestal: otros propietarios', 'Terrains forestiers : autres propriétaires', 'Superficie forestale: altri proprietari'],
    'Forest land': ['Superficie forestal', 'Terrains forestiers', 'Superficie forestale'],
    'Clearings (felled, not yet regenerated), area at 31 December': ['Claros (talados y sin regenerar), superficie a 31 de diciembre', 'Coupes rases (non régénérées), surface au 31 décembre', 'Superfici tagliate non rigenerate, area al 31 dicembre'],
    'New clearings: from felling': ['Claros nuevos: por cortas', 'Nouvelles coupes rases : par exploitation', 'Nuove superfici tagliate: da tagli'],
    'New clearings: from natural disasters': ['Claros nuevos: por catástrofes naturales', 'Nouvelles coupes rases : catastrophes naturelles', 'Nuove superfici tagliate: calamità naturali'],
    'Afforestation, total': ['Repoblación, total', 'Boisement, total', 'Rimboschimento, totale'],
    'Damaged forest stands, total': ['Masas forestales dañadas, total', 'Peuplements forestiers endommagés, total', 'Popolamenti forestali danneggiati, totale'],
    'Damaged stands: needle pests': ['Masas dañadas: plagas de las acículas', 'Peuplements endommagés : ravageurs des aiguilles', 'Popolamenti danneggiati: parassiti degli aghi'],
    'Damaged stands: leaf pests': ['Masas dañadas: plagas de las hojas', 'Peuplements endommagés : ravageurs des feuilles', 'Popolamenti danneggiati: parassiti delle foglie'],
    'Damaged stands: stem pests': ['Masas dañadas: plagas del tronco', 'Peuplements endommagés : ravageurs du tronc', 'Popolamenti danneggiati: parassiti del fusto'],
    'Damaged stands: root rot': ['Masas dañadas: podredumbre de raíz', 'Peuplements endommagés : pourridié', 'Popolamenti danneggiati: marciume radicale'],
    'Damaged stands: unfavourable weather': ['Masas dañadas: clima desfavorable', 'Peuplements endommagés : météo défavorable', 'Popolamenti danneggiati: meteo sfavorevole'],
    'Damaged stands: windfall': ['Masas dañadas: derribo por viento', 'Peuplements endommagés : chablis', 'Popolamenti danneggiati: schianti da vento'],
    'Damaged stands: forest fires': ['Masas dañadas: incendios forestales', 'Peuplements endommagés : incendies de forêt', 'Popolamenti danneggiati: incendi boschivi'],
    'Damaged stands: game damage': ['Masas dañadas: daños de la caza', 'Peuplements endommagés : dégâts de gibier', 'Popolamenti danneggiati: danni della fauna selvatica'],
    'Damaged stands: unfavourable water conditions': ['Masas dañadas: condiciones hídricas desfavorables', 'Peuplements endommagés : conditions hydriques défavorables', 'Popolamenti danneggiati: condizioni idriche sfavorevoli'],
    'Damaged stands: human activities': ['Masas dañadas: actividad humana', 'Peuplements endommagés : activités humaines', 'Popolamenti danneggiati: attività umane'],
    'Felling: total, all species': ['Cortas: total, todas las especies', 'Coupes : total, toutes essences', 'Tagli: totale, tutte le specie'],
    'Felling: oaks': ['Cortas: robles', 'Coupes : chênes', 'Tagli: querce'],
    'Felling: Turkey oak': ['Cortas: roble cerris', 'Coupes : chêne chevelu', 'Tagli: cerro'],
    'Felling: beech': ['Cortas: haya', 'Coupes : hêtre', 'Tagli: faggio'],
    'Felling: hornbeam': ['Cortas: carpe', 'Coupes : charme', 'Tagli: carpino'],
    'Felling: black locust': ['Cortas: robinia', 'Coupes : robinier', 'Tagli: robinia'],
    'Felling: improved poplars': ['Cortas: chopos mejorados', 'Coupes : peupliers améliorés', 'Tagli: pioppi selezionati'],
    'Felling: pines': ['Cortas: pinos', 'Coupes : pins', 'Tagli: pini'],
    'Felling as a share of increment (harvesting ratio)': ['Cortas como proporción del crecimiento (ratio de aprovechamiento)', 'Coupes en part de l’accroissement (taux de prélèvement)', 'Tagli in quota dell’incremento (tasso di utilizzazione)'],
    'Standard sawn firewood, consumer price (100 kg)': ['Leña aserrada estándar, precio al consumidor (100 kg)', 'Bois de chauffage scié standard, prix à la consommation (100 kg)', 'Legna da ardere segata standard, prezzo al consumo (100 kg)'],
    'Sawlogs, total': ['Rollizos para aserrío, total', 'Grumes de sciage, total', 'Tronchi da sega, totale'],
    'Sawlogs, coniferous': ['Rollizos para aserrío, coníferas', 'Grumes de sciage, résineux', 'Tronchi da sega, conifere'],
    'Sawlogs, oak': ['Rollizos para aserrío, roble', 'Grumes de sciage, chêne', 'Tronchi da sega, quercia'],
    'Sawlogs, beech': ['Rollizos para aserrío, haya', 'Grumes de sciage, hêtre', 'Tronchi da sega, faggio'],
    'Sawlogs, non-coniferous, others': ['Rollizos para aserrío, otras frondosas', 'Grumes de sciage, autres feuillus', 'Tronchi da sega, altre latifoglie'],
    'Pulpwood, round and split, total': ['Madera para trituración, rolliza y partida, total', 'Bois de trituration, ronds et fendus, total', 'Legname da cellulosa, tondo e spaccato, totale'],
    'Pulpwood, round and split, coniferous': ['Madera para trituración, rolliza y partida, coníferas', 'Bois de trituration, ronds et fendus, résineux', 'Legname da cellulosa, tondo e spaccato, conifere'],
    'Pulpwood, round and split, non-coniferous': ['Madera para trituración, rolliza y partida, frondosas', 'Bois de trituration, ronds et fendus, feuillus', 'Legname da cellulosa, tondo e spaccato, latifoglie'],
    'Other industrial roundwood, total': ['Otra madera industrial en rollo, total', 'Autres bois ronds industriels, total', 'Altro legname industriale in tondo, totale'],
    'Wood fuel, total': ['Leña y combustible de madera, total', 'Bois de chauffage et énergie, total', 'Legna e combustibile legnoso, totale'],
    'Sawlogs class III.A/B, spruce': ['Rollizos para aserrío clase III.A/B: abeto rojo', 'Grumes de sciage classe III.A/B : épicéa', 'Tronchi da sega classe III.A/B: abete rosso'],
    'Sawlogs class III.A/B, pine': ['Rollizos para aserrío clase III.A/B: pino', 'Grumes de sciage classe III.A/B : pin', 'Tronchi da sega classe III.A/B: pino'],
    'Sawlogs class III.A/B, oak': ['Rollizos para aserrío clase III.A/B: roble', 'Grumes de sciage classe III.A/B : chêne', 'Tronchi da sega classe III.A/B: quercia'],
    'Sawlogs class III.A/B, beech': ['Rollizos para aserrío clase III.A/B: haya', 'Grumes de sciage classe III.A/B : hêtre', 'Tronchi da sega classe III.A/B: faggio'],
    'Pulpwood (class V), spruce': ['Madera para trituración (clase V): abeto rojo', 'Bois de trituration (classe V) : épicéa', 'Legname da cellulosa (classe V): abete rosso'],
    'Pulpwood (class V), beech': ['Madera para trituración (clase V): haya', 'Bois de trituration (classe V) : hêtre', 'Legname da cellulosa (classe V): faggio'],
    'Fuelwood (class VI), coniferous': ['Leña (clase VI): coníferas', 'Bois de chauffage (classe VI) : résineux', 'Legna (classe VI): conifere'],
    'Fuelwood (class VI), broadleaf': ['Leña (clase VI): frondosas', 'Bois de chauffage (classe VI) : feuillus', 'Legna (classe VI): latifoglie'],
    'Packing case timber (hardwood)': ['Madera para embalajes (frondosas)', 'Bois d’emballage (feuillus)', 'Legname per imballaggi (latifoglie)'],
    'Average timber sale price of State Forests districts, Q1-Q3 (forest-tax base)': ['Precio medio de venta de madera de las direcciones de Bosques del Estado, T1-T3 (base del impuesto forestal)', 'Prix moyen de vente du bois des directions des Forêts d’État, T1-T3 (base de la taxe forestière)', 'Prezzo medio di vendita del legname delle direzioni delle Foreste di Stato, T1-T3 (base dell’imposta forestale)'],
    'Total felling': ['Cortas totales', 'Coupes totales', 'Tagli totali'],
    'Salvage (incidental) felling, total': ['Cortas de salvamento (accidentales), total', 'Coupes de sauvetage (accidentelles), total', 'Tagli di recupero (accidentali), totale'],
    'Salvage felling: natural causes (wind, snow, drought)': ['Cortas de salvamento: causas naturales (viento, nieve, sequía)', 'Coupes de sauvetage : causes naturelles (vent, neige, sécheresse)', 'Tagli di recupero: cause naturali (vento, neve, siccità)'],
    'Salvage felling: insects (bark beetle)': ['Cortas de salvamento: insectos (escarabajo de la corteza)', 'Coupes de sauvetage : insectes (scolyte)', 'Tagli di recupero: insetti (bostrico)'],
    'Salvage felling: air pollution': ['Cortas de salvamento: contaminación atmosférica', 'Coupes de sauvetage : pollution atmosphérique', 'Tagli di recupero: inquinamento atmosferico'],
    'Salvage felling: other causes': ['Cortas de salvamento: otras causas', 'Coupes de sauvetage : autres causes', 'Tagli di recupero: altre cause'],
    'Storm-felled forest (volume of trees blown down)': ['Arbolado derribado por tormentas (volumen)', 'Bois abattu par les tempêtes (volume)', 'Legname abbattuto dalle tempeste (volume)'],
    'Gross felling': ['Cortas brutas', 'Coupes brutes', 'Tagli lordi'],
    'Felling: sawlogs': ['Cortas: rollizos para aserrío', 'Coupes : grumes de sciage', 'Tagli: tronchi da sega'],
    'Felling: pulpwood': ['Cortas: madera para trituración', 'Coupes : bois de trituration', 'Tagli: legname da cellulosa'],
    'Felling: fuelwood': ['Cortas: leña', 'Coupes : bois de chauffage', 'Tagli: legna'],
    'Net felling': ['Cortas netas', 'Coupes nettes', 'Tagli netti'],
    'Spruce bark beetle (Ips typographus): mean catch per pheromone trap': ['Escarabajo de la corteza del abeto (Ips typographus): captura media por trampa de feromonas', 'Scolyte de l’épicéa (Ips typographus) : capture moyenne par piège à phéromones', 'Bostrico tipografo (Ips typographus): cattura media per trappola a feromoni'],
    'Destroyed forest stands, total': ['Masas forestales destruidas, total', 'Peuplements forestiers détruits, total', 'Popolamenti forestali distrutti, totale'],
    'Destroyed stands: insect pests': ['Masas destruidas: plagas de insectos', 'Peuplements détruits : insectes ravageurs', 'Popolamenti distrutti: insetti dannosi'],
    'Destroyed stands: windfall': ['Masas destruidas: derribo por viento', 'Peuplements détruits : chablis', 'Popolamenti distrutti: schianti da vento'],
    'Destroyed stands: forest fires': ['Masas destruidas: incendios forestales', 'Peuplements détruits : incendies de forêt', 'Popolamenti distrutti: incendi boschivi'],
    'Destroyed stands: forest diseases': ['Masas destruidas: enfermedades forestales', 'Peuplements détruits : maladies forestières', 'Popolamenti distrutti: malattie forestali'],
    'Destroyed stands: game damage': ['Masas destruidas: daños de la caza', 'Peuplements détruits : dégâts de gibier', 'Popolamenti distrutti: danni della fauna selvatica'],
    'Destroyed stands: unfavourable water conditions': ['Masas destruidas: condiciones hídricas desfavorables', 'Peuplements détruits : conditions hydriques défavorables', 'Popolamenti distrutti: condizioni idriche sfavorevoli'],
    'Forest damage, all groups': ['Daños forestales, todos los grupos', 'Dégâts forestiers, tous groupes', 'Danni forestali, tutti i gruppi'],
    'Forest damage: insects': ['Daños forestales: insectos', 'Dégâts forestiers : insectes', 'Danni forestali: insetti'],
    'Forest damage: abiotic (weather, drought, fire)': ['Daños forestales: abióticos (clima, sequía, fuego)', 'Dégâts forestiers : abiotiques (météo, sécheresse, feu)', 'Danni forestali: abiotici (meteo, siccità, fuoco)'],
    'Forest damage: vertebrates (game)': ['Daños forestales: vertebrados (caza)', 'Dégâts forestiers : vertébrés (gibier)', 'Danni forestali: vertebrati (fauna selvatica)'],
    'Forest damage: pathogens': ['Daños forestales: patógenos', 'Dégâts forestiers : agents pathogènes', 'Danni forestali: patogeni'],
    'Densified biomass fuel (pellets), domestic sales: average price': ['Biomasa densificada (pellets), ventas interiores: precio medio', 'Biomasse densifiée (granulés), ventes intérieures : prix moyen', 'Biomassa densificata (pellet), vendite interne: prezzo medio'],
    'Densified biomass fuel (pellets), exports: average price': ['Biomasa densificada (pellets), exportaciones: precio medio', 'Biomasse densifiée (granulés), exportations : prix moyen', 'Biomassa densificata (pellet), esportazioni: prezzo medio'],
    'Densified biomass fuel (pellets), domestic sales: quantity': ['Biomasa densificada (pellets), ventas interiores: cantidad', 'Biomasse densifiée (granulés), ventes intérieures : quantité', 'Biomassa densificata (pellet), vendite interne: quantità'],
    'Densified biomass fuel (pellets), exports: quantity': ['Biomasa densificada (pellets), exportaciones: cantidad', 'Biomasse densifiée (granulés), exportations : quantité', 'Biomassa densificata (pellet), esportazioni: quantità'],
    'Wood pellet, consumer price (heat production)': ['Pellet de madera, precio al consumidor (producción de calor)', 'Granulés de bois, prix à la consommation (production de chaleur)', 'Pellet di legno, prezzo al consumo (produzione di calore)'],
    'Forest chips delivered, energy production': ['Astillas forestales entregadas, producción de energía', 'Plaquettes forestières livrées, production d’énergie', 'Cippato forestale consegnato, produzione di energia']
  };
  function trl(s) {
    var k = IX[lg()] - (IX[lg()] > 0 ? 1 : 0); if (lg() === 'en' || !s) return s;
    k = { es: 0, fr: 1, it: 2 }[lg()];
    if (EX[s]) return EX[s][k];
    var tail = '', i, m;
    for (i = 0; i < DIA.length; i++) if (DIA[i][0].test(s)) { tail = s.replace(DIA[i][0], DIA[i][1][k]); s = s.replace(DIA[i][0], ''); tail = tail.slice(s.length); break; }
    m = /^(Pine|Spruce|Birch|Black alder|Asp|Oak|Beech) (sawlogs|logs|pulpwood|veneer logs)(?: \((\w) category\))?$/i.exec(s);
    if (m) { var cat = m[3] ? ({ es: ' (categoría ', fr: ' (catégorie ', it: ' (categoria ' })[lg()] + m[3] + ')' : '';
      return KIND[m[2].toLowerCase()][k] + ': ' + SP[m[1].toLowerCase()][k] + tail + cat; }
    return s + tail;
  }
  var DATA = null, ST = { s: 'prices', pc: 'SI', reg: '', dreg: '', rk: '', ry: '', sel: {}, fc: 'ES', dc: 'CZ', ec: 'us-pellet-domestic-price' };
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
  /* periodos por su etiqueta (no por posición: las series pueden saltarse semanas o meses sin dato) */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function isoWeekOf(ms) { var d = new Date(ms), day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day + 3); var y = d.getUTCFullYear(), j4 = Date.UTC(y, 0, 4); return y + '-W' + pad2(1 + Math.round((d.getTime() - j4) / 6048e5 - ((new Date(j4).getUTCDay() + 6) % 7 - 3) / 7)); }
  function perFreq(p) { p = String(p); return /^\d{4}$/.test(p) ? 'A' : /-Q\d$/.test(p) ? 'Q' : /-H\d$/.test(p) ? 'H' : /-W\d\d$/.test(p) ? 'W' : 'M'; }
  function shiftP(p, n) {   /* n periodos atrás */
    p = String(p); var f = perFreq(p), y = +p.slice(0, 4), k;
    if (f === 'A') return String(y - n);
    if (f === 'M') { k = y * 12 + (+p.slice(5, 7) - 1) - n; return Math.floor(k / 12) + '-' + pad2(k % 12 + 1); }
    if (f === 'Q') { k = y * 4 + (+p.slice(6) - 1) - n; return Math.floor(k / 4) + '-Q' + (k % 4 + 1); }
    if (f === 'H') { k = y * 2 + (+p.slice(6) - 1) - n; return Math.floor(k / 2) + '-H' + (k % 2 + 1); }
    return isoWeekOf(ts(p, 'W') - n * 6048e5);
  }
  function yearAgo(p) { p = String(p); var f = perFreq(p); return f === 'W' ? (+p.slice(0, 4) - 1) + p.slice(4) : shiftP(p, BACK[f]); }
  function findP(a, lab) { if (!a) return null; for (var i = a.length - 1; i >= 0; i--) if (String(a[i][0]) === String(lab)) return a[i]; return null; }
  function yoy(s) {
    var i = lastIdx(s.values); if (i < 0) return null;
    var j = s.periods ? s.periods.indexOf(yearAgo(s.periods[i])) : i - BACK[s.freq];
    if (j < 0 || s.values[j] == null || s.values[j] === 0) return null;
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
  /* ---- incendios ---- */
  function fireStats(ff, cc) {
    var c = ff.countries[cc], n = ff.years.length, cy = ff.currentYear, i = n - 1, prev = n >= 2 ? c.ba[n - 2] : null, s = 0, k = 0, j;
    for (j = n - 11; j < n - 1; j++) if (j >= 0 && c.ba[j] != null) { s += c.ba[j]; k++; }
    return { ba: c.ba[i], nf: c.nf[i], prev: prev, avg: k >= 5 ? s / k : null, cy: cy };
  }
  /* ---- cortas y daños ---- */
  /* ranking de regiones en un mismo año (cortas y daños: CZ y SE) */
  var RKT = { h: L('Ranking de regiones', 'Region ranking', 'Classement des régions', 'Classifica delle regioni'), ind: L('Indicador', 'Indicator', 'Indicateur', 'Indicatore'), yr: L('Año', 'Year', 'Année', 'Anno'),
    reg: L('Región', 'Region', 'Région', 'Regione'), val: L('Valor', 'Value', 'Valeur', 'Valore'), sh: L('% de la suma', '% of sum', '% de la somme', '% della somma'),
    note: L('Solo regiones con dato ese año; el porcentaje es sobre la suma de esas regiones (cálculo de Dehesa Index).', 'Only regions with data that year; the share is of the sum of those regions (Dehesa Index calculation).', 'Seules les régions avec donnée cette année ; la part est calculée sur la somme de ces régions (calcul de Dehesa Index).', 'Solo regioni con dato in quell’anno; la quota è sulla somma di quelle regioni (calcolo di Dehesa Index).') };
  function rankView(all) {
    var bases = {}, order = [];
    all.forEach(function (s) { if (!s.region) return; var b = s.id.replace(/-[^-]+$/, ''); if (!bases[b]) { bases[b] = []; order.push(b); } bases[b].push(s); });
    if (!order.length) return '';
    if (!bases[ST.rk]) ST.rk = order[0];
    var ss = bases[ST.rk], cnt = {}, ys = [];
    ss.forEach(function (x) { x.periods.forEach(function (p) { cnt[p] = (cnt[p] || 0) + 1; }); });
    ys = Object.keys(cnt).sort().reverse();
    if (ys.indexOf(ST.ry) < 0) { var best = ys[0]; ys.forEach(function (y) { if (cnt[y] > cnt[best]) best = y; }); ST.ry = ST.ryAuto = best; }
    var rows = [], tot = 0, mx = 0, u = ss[0].unit;
    ss.forEach(function (x) { var i = x.periods.indexOf(ST.ry); if (i >= 0 && x.values[i] != null) { rows.push({ r: x.region, v: x.values[i] }); tot += x.values[i]; if (x.values[i] > mx) mx = x.values[i]; } });
    rows.sort(function (a, b) { return b.v - a.v; });
    var d = INT[u] ? 0 : 2;
    var body = rows.map(function (x) { return '<tr><td>' + esc(x.r) + '</td><td class="num">' + num(x.v, d) + ' <span class="fsh-m">' + esc(unit(u)) + '</span></td><td class="num">' + (tot ? num(x.v / tot * 100, 1) : '—') + ' %</td><td><div style="height:8px;border-radius:2px;background:#2f6b4a;width:' + (mx ? Math.max(2, Math.round(x.v / mx * 100)) : 0) + '%"></div></td></tr>'; }).join('');
    var io = order.map(function (b) { return '<option value="' + esc(b) + '"' + (b === ST.rk ? ' selected' : '') + '>' + esc(trl(bases[b][0].label)) + '</option>'; }).join('');
    var yo = ys.map(function (y) { return '<option value="' + y + '"' + (y === ST.ry ? ' selected' : '') + '>' + y + '</option>'; }).join('');
    return '<div class="di-card di-info-card wp-card"><div class="di-info-card-title">' + esc(tx(RKT.h)) + '</div><div class="fsh-pick"><label>' + esc(tx(RKT.ind)) + ' <select id="bq-rk">' + io + '</select></label> <label>' + esc(tx(RKT.yr)) + ' <select id="bq-ry">' + yo + '</select></label></div>' +
      '<div class="fsh-tblw"><table class="fsh-tbl"><thead><tr><th>' + esc(tx(RKT.reg)) + '</th><th class="num">' + esc(tx(RKT.val)) + '</th><th class="num">' + esc(tx(RKT.sh)) + '</th><th></th></tr></thead><tbody>' + body + '</tbody></table></div><div class="di-info-scope-note">' + esc(tx(RKT.note)) + '</div></div>';
  }
  /* ==== Página por país, como pesca.html: selector de país y año, cifras clave, series largas, precios por surtido, precio frente al índice
     industrial, temporada de incendios, daños, energía, mapa y comparativa. Datos: data/views/forest/<CC>.json e index.json (scripts/build-views.py) ==== */
  var FX = {
    sub: L('Bosque y madera por país: cortas, superficie quemada, precio oficial de la madera por surtido, precios industriales de la madera, daños y energía de la madera. Cifras oficiales de cada fuente, sin armonizar entre países.',
           'Forests and timber by country: wood removals, burnt area, official timber prices by assortment, industrial wood prices, damage and wood energy. Official figures from each source, not harmonised between countries.',
           'Forêts et bois par pays : prélèvements de bois, surface brûlée, prix officiels du bois par assortiment, prix industriels du bois, dégâts et bois-énergie. Chiffres officiels de chaque source, non harmonisés entre pays.',
           'Foreste e legno per paese: prelievi di legname, superficie bruciata, prezzi ufficiali del legname per assortimento, prezzi industriali del legno, danni ed energia dal legno. Dati ufficiali di ciascuna fonte, non armonizzati tra paesi.'),
    year: L('Año', 'Year', 'Année', 'Anno'), latest: L('Último disponible', 'Latest available', 'Dernière disponible', 'Ultimo disponibile'),
    kRem: L('Madera cortada', 'Wood removals', 'Bois prélevé', 'Legname prelevato'), kRemU: L('miles de m³', 'thousand m³', 'milliers de m³', 'migliaia di m³'),
    kHa: L('Cortas por hectárea de bosque', 'Removals per hectare of forest', 'Prélèvements par hectare de forêt', 'Prelievi per ettaro di bosco'),
    kArea: L('Superficie forestal', 'Forest area', 'Surface forestière', 'Superficie forestale'), kAreaU: L('miles de ha', 'thousand ha', 'milliers d’ha', 'migliaia di ha'),
    kBa: L('Superficie quemada', 'Burnt area', 'Surface brûlée', 'Superficie bruciata'), kNf: L('Incendios cartografiados', 'Mapped fires', 'Incendies cartographiés', 'Incendi mappati'),
    kPrice: L('Precio de la madera', 'Timber price', 'Prix du bois', 'Prezzo del legname'), kPpi: L('Precios industriales de la madera', 'Industrial wood prices', 'Prix industriels du bois', 'Prezzi industriali del legno'),
    kCork: L('Corcho: exportaciones', 'Cork: exports', 'Liège : exportations', 'Sughero: esportazioni'),
    vsPrevY: L('frente al año anterior', 'vs previous year', 'vs année précédente', 'rispetto all’anno precedente'), vsYear: L('frente a un año antes', 'vs a year earlier', 'vs un an avant', 'rispetto a un anno prima'),
    vsAvgTo: L('frente a la media {a} a esta fecha', 'vs the {a} average to date', 'vs la moyenne {a} à cette date', 'rispetto alla media {a} a questa data'),
    vsAvgYr: L('frente a la media anual {a}', 'vs the {a} annual average', 'vs la moyenne annuelle {a}', 'rispetto alla media annuale {a}'),
    ytd: L('en lo que va de año', 'year to date', 'depuis janvier', 'da inizio anno'), est: L('estimación de Eurostat', 'Eurostat estimate', 'estimation d’Eurostat', 'stima di Eurostat'),
    idx: L('índice 2021 = 100', 'index 2021 = 100', 'indice 2021 = 100', 'indice 2021 = 100'),
    chRem: L('Madera cortada por año (miles de m³ sin corteza)', 'Wood removals per year (thousand m³ under bark)', 'Bois prélevé par an (milliers de m³ sous écorce)', 'Legname prelevato per anno (migliaia di m³ sotto corteccia)'),
    chBa: L('Superficie quemada por año (ha)', 'Burnt area per year (ha)', 'Surface brûlée par an (ha)', 'Superficie bruciata per anno (ha)'),
    sConif: L('Coníferas', 'Coniferous', 'Résineux', 'Conifere'), sBroad: L('Frondosas', 'Broadleaved', 'Feuillus', 'Latifoglie'), sTot: L('Total', 'Total', 'Total', 'Totale'),
    remSplit: L('Destino de la madera cortada', 'What the removed wood is used for', 'Usage du bois prélevé', 'Destinazione del legname prelevato'),
    uSaw: L('Rollizos para aserrío y chapa', 'Sawlogs and veneer logs', 'Grumes de sciage et de placage', 'Tronchi da sega e da tranciatura'), uPulp: L('Madera para trituración', 'Pulpwood', 'Bois de trituration', 'Legname da cellulosa'),
    uOther: L('Otra madera industrial', 'Other industrial roundwood', 'Autres bois ronds industriels', 'Altro legname industriale'), uFuel: L('Leña y combustible', 'Fuelwood', 'Bois de chauffage', 'Legna da ardere'),
    share: L('% del total', '% of total', '% du total', '% del totale'),
    hPrices: L('Precio de la madera por surtido', 'Timber price by assortment', 'Prix du bois par assortiment', 'Prezzo del legname per assortimento'),
    hPrev: L('Frente al periodo anterior', 'Vs previous period', 'Vs période précédente', 'Rispetto al periodo precedente'), hYear: L('Frente a un año antes', 'Vs a year earlier', 'Vs un an avant', 'Rispetto a un anno prima'),
    hSpark: L('Últimos 2 años', 'Last 2 years', '2 dernières années', 'Ultimi 2 anni'),
    noPrice: L('Sin precio oficial de la madera por surtido para este país en las fuentes que usamos. Abajo, los precios industriales de la madera (Eurostat) cuando existen.', 'No official timber price by assortment for this country in the sources we use. Below, industrial wood prices (Eurostat) where available.', 'Pas de prix officiel du bois par assortiment pour ce pays dans nos sources. Plus bas, les prix industriels du bois (Eurostat) lorsqu’ils existent.', 'Nessun prezzo ufficiale del legname per assortimento per questo paese nelle fonti che usiamo. Più sotto, i prezzi industriali del legno (Eurostat) dove esistono.'),
    noPrice2: L('Sin precio oficial de la madera para este territorio en las fuentes que usamos.', 'No official timber price for this territory in the sources we use.', 'Pas de prix officiel du bois pour ce territoire dans nos sources.', 'Nessun prezzo ufficiale del legname per questo territorio nelle fonti che usiamo.'),
    kNoteCalc: L('Las variaciones y las cortas por hectárea son cálculos de Dehesa Index con las cifras publicadas.', 'Changes and removals per hectare are Dehesa Index calculations from the published figures.', 'Les variations et les prélèvements par hectare sont des calculs de Dehesa Index à partir des chiffres publiés.', 'Le variazioni e i prelievi per ettaro sono calcoli di Dehesa Index sui dati pubblicati.'),
    hCross: L('Precio de la madera frente a los precios industriales de la madera', 'Timber price vs industrial wood prices', 'Prix du bois vs prix industriels du bois', 'Prezzo del legname rispetto ai prezzi industriali del legno'),
    crossSub: L('Cada surtido frente al índice de precios de producción de la industria de la madera del país (Eurostat, sts_inpp_m, C16), en el mismo periodo. Si el precio de la madera en rollo sube más que el de lo que se fabrica con ella, se estrecha el margen de la industria.',
                'Each assortment against the country’s producer price index for the wood industry (Eurostat, sts_inpp_m, C16), over the same period. If roundwood rises faster than what is made from it, the industry’s margin narrows.',
                'Chaque assortiment face à l’indice des prix à la production de l’industrie du bois du pays (Eurostat, sts_inpp_m, C16), sur la même période. Si le bois rond augmente plus vite que ce qu’on en fabrique, la marge de l’industrie se réduit.',
                'Ogni assortimento rispetto all’indice dei prezzi alla produzione dell’industria del legno del paese (Eurostat, sts_inpp_m, C16), nello stesso periodo. Se il tondame sale più di ciò che se ne produce, il margine dell’industria si restringe.'),
    hcPrice: L('Precio, 12 meses', 'Price, 12 months', 'Prix, 12 mois', 'Prezzo, 12 mesi'), hcPpi: L('Índice industrial, 12 meses', 'Industry index, 12 months', 'Indice industriel, 12 mois', 'Indice industriale, 12 mesi'),
    hcGap: L('Diferencia (puntos)', 'Gap (points)', 'Écart (points)', 'Differenza (punti)'),
    crossCh: L('{s} frente al índice industrial (100 = primer periodo común, {b})', '{s} vs the industry index (100 = first common period, {b})', '{s} face à l’indice industriel (100 = première période commune, {b})', '{s} rispetto all’indice industriale (100 = primo periodo comune, {b})'),
    crossNote: L('Cálculo de Dehesa Index con cifras oficiales: el índice mensual se promedia en el periodo de cada precio (trimestre, semestre, año o mes de la semana) y ambos se llevan a 100 en el primer periodo común. No son la misma cosa: uno es el precio de la madera en rollo y otro el de los productos de la industria (aserrado, tableros, embalaje).',
                 'Dehesa Index calculation with official figures: the monthly index is averaged over each price’s period (quarter, half-year, year or the month of the week) and both are set to 100 in the first common period. They are not the same thing: one is the roundwood price, the other the price of the industry’s products (sawn wood, panels, packaging).',
                 'Calcul de Dehesa Index à partir de chiffres officiels : l’indice mensuel est moyenné sur la période de chaque prix (trimestre, semestre, année ou mois de la semaine) et les deux sont ramenés à 100 sur la première période commune. Ce n’est pas la même chose : l’un est le prix du bois rond, l’autre celui des produits de l’industrie (sciages, panneaux, emballages).',
                 'Calcolo di Dehesa Index su dati ufficiali: l’indice mensile è mediato sul periodo di ciascun prezzo (trimestre, semestre, anno o mese della settimana) e i due sono portati a 100 nel primo periodo comune. Non sono la stessa cosa: uno è il prezzo del tondame, l’altro quello dei prodotti dell’industria (segati, pannelli, imballaggi).'),
    ppiOnly: L('Precios de producción de la industria de la madera ({u})', 'Producer prices of the wood industry ({u})', 'Prix à la production de l’industrie du bois ({u})', 'Prezzi alla produzione dell’industria del legno ({u})'),
    ppiC16: L('Industria de la madera y el corcho (sin muebles)', 'Wood and cork products (excl. furniture)', 'Industrie du bois et du liège (hors meubles)', 'Industria del legno e del sughero (esclusi mobili)'),
    ppiC161: L('Aserrado y cepillado de la madera', 'Sawmilling and planing of wood', 'Sciage et rabotage du bois', 'Taglio e piallatura del legno'),
    hSeason: L('Incendios de la temporada {y}', 'Fire season {y}', 'Saison des incendies {y}', 'Stagione degli incendi {y}'),
    seasonSub: L('Superficie quemada acumulada desde el 1 de enero, semana a semana, frente a la media y el máximo del mismo acumulado en {a} (cálculo de EFFIS/GWIS). Abajo, el cierre de cada mes; el porcentaje frente a la media es un cálculo de Dehesa Index.',
                 'Burnt area accumulated since 1 January, week by week, against the average and maximum of the same cumulative figure in {a} (calculated by EFFIS/GWIS). Below, the close of each month; the percentage against the average is a Dehesa Index calculation.',
                 'Surface brûlée cumulée depuis le 1er janvier, semaine après semaine, face à la moyenne et au maximum du même cumul sur {a} (calcul d’EFFIS/GWIS). Plus bas, la clôture de chaque mois ; le pourcentage par rapport à la moyenne est un calcul de Dehesa Index.',
                 'Superficie bruciata cumulata dal 1° gennaio, settimana per settimana, rispetto a media e massimo dello stesso cumulato nel {a} (calcolo EFFIS/GWIS). Sotto, la chiusura di ogni mese; la percentuale rispetto alla media è un calcolo di Dehesa Index.'),
    sThis: L('{y}', '{y}', '{y}', '{y}'), sAvg: L('Media {a}', 'Average {a}', 'Moyenne {a}', 'Media {a}'), sMax: L('Máximo {a}', 'Maximum {a}', 'Maximum {a}', 'Massimo {a}'),
    month: L('Mes', 'Month', 'Mois', 'Mese'), cumY: L('Acumulado {y} (ha)', 'Cumulative {y} (ha)', 'Cumul {y} (ha)', 'Cumulato {y} (ha)'), cumA: L('Media a esa fecha (ha)', 'Average to that date (ha)', 'Moyenne à cette date (ha)', 'Media a quella data (ha)'),
    vsA: L('Frente a la media', 'Vs the average', 'Vs la moyenne', 'Rispetto alla media'), fires: L('Incendios', 'Fires', 'Incendies', 'Incendi'),
    weekTo: L('semana hasta el {d}', 'week to {d}', 'semaine jusqu’au {d}', 'settimana fino al {d}'),
    zeroAvg: L('media inferior a 100 ha', 'average under 100 ha', 'moyenne inférieure à 100 ha', 'media inferiore a 100 ha'),
    hDmg: L('Cortas y daños', 'Felling and damage', 'Coupes et dégâts', 'Tagli e danni'), hEn: L('Energía de la madera', 'Wood energy', 'Bois-énergie', 'Energia dal legno'),
    hMap: L('Comparativa entre países', 'Country comparison', 'Comparaison entre pays', 'Confronto tra paesi'),
    mapSub: L('El país elegido, marcado. Pulsa un país del mapa o de la tabla para ver su ficha. Cifras de fuentes distintas: compara con cuidado.', 'The chosen country is outlined. Select a country on the map or in the table to see it. Figures come from different sources: compare with care.', 'Le pays choisi est entouré. Sélectionnez un pays sur la carte ou dans le tableau. Chiffres de sources différentes : comparez avec prudence.', 'Il paese scelto è evidenziato. Seleziona un paese sulla mappa o nella tabella. Dati di fonti diverse: confronta con cautela.'),
    mHa: L('Cortas por hectárea (m³/ha)', 'Removals per hectare (m³/ha)', 'Prélèvements par hectare (m³/ha)', 'Prelievi per ettaro (m³/ha)'),
    mFire: L('Quemado este año frente a la media (%)', 'Burnt this year vs average (%)', 'Brûlé cette année vs moyenne (%)', 'Bruciato quest’anno vs media (%)'),
    mPpi: L('Precios industriales de la madera, 12 meses (%)', 'Industrial wood prices, 12 months (%)', 'Prix industriels du bois, 12 mois (%)', 'Prezzi industriali del legno, 12 mesi (%)'),
    show: L('Ver en el mapa', 'Show on the map', 'Afficher sur la carte', 'Mostra sulla mappa'), noData: L('sin dato', 'no data', 'pas de donnée', 'nessun dato'),
    lower: L('menos', 'less', 'moins', 'meno'), higher: L('más', 'more', 'plus', 'più'),
    cRem: L('Madera cortada (miles de m³)', 'Removals (thousand m³)', 'Prélèvements (milliers de m³)', 'Prelievi (migliaia di m³)'),
    cHa: L('m³/ha', 'm³/ha', 'm³/ha', 'm³/ha'), cBa: L('Quemado este año (ha)', 'Burnt this year (ha)', 'Brûlé cette année (ha)', 'Bruciato quest’anno (ha)'),
    cPrice: L('Precio de referencia', 'Reference price', 'Prix de référence', 'Prezzo di riferimento'), cPpi: L('Índice industrial, 12 meses', 'Industry index, 12 months', 'Indice industriel, 12 mois', 'Indice industriale, 12 mesi'),
    none: L('Sin dato oficial para este país en las fuentes que usamos.', 'No official data for this country in the sources we use.', 'Pas de donnée officielle pour ce pays dans nos sources.', 'Nessun dato ufficiale per questo paese nelle fonti che usiamo.'),
    tropical: L('Madera tropical (precios de exportación del Banco Mundial)', 'Tropical timber (World Bank export prices)', 'Bois tropical (prix à l’exportation de la Banque mondiale)', 'Legname tropicale (prezzi all’esportazione della Banca mondiale)'),
    corkMore: L('Ver el corcho y los productos del monte en Mercados Dehesa', 'See cork and forest products in Dehesa markets', 'Voir le liège et les produits forestiers dans Marchés de la dehesa', 'Vedi il sughero e i prodotti forestali in Mercati della dehesa'),
    remNote: L('Madera cortada: Eurostat for_remov (cuestionario conjunto del sector forestal), miles de m³ sin corteza. Superficie forestal: Eurostat for_area. Las cortas por hectárea son un cálculo de Dehesa Index (cortas del año entre la superficie forestal de ese año o la última publicada).',
               'Wood removals: Eurostat for_remov (Joint Forest Sector Questionnaire), thousand m³ under bark. Forest area: Eurostat for_area. Removals per hectare are a Dehesa Index calculation (the year’s removals over that year’s forest area, or the latest published).',
               'Prélèvements : Eurostat for_remov (questionnaire conjoint du secteur forestier), milliers de m³ sous écorce. Surface forestière : Eurostat for_area. Les prélèvements par hectare sont un calcul de Dehesa Index (prélèvements de l’année sur la surface forestière de l’année ou la dernière publiée).',
               'Prelievi: Eurostat for_remov (questionario congiunto del settore forestale), migliaia di m³ sotto corteccia. Superficie forestale: Eurostat for_area. I prelievi per ettaro sono un calcolo di Dehesa Index (prelievi dell’anno sulla superficie forestale dello stesso anno o l’ultima pubblicata).')
  };
  var MINREF = 100;   /* por debajo de 100 ha de media de referencia el porcentaje no dice nada (1.164 ha frente a 44 = +2.545 %) */
  var PNOTE = {
    SI: L('Precio medio de compra de madera en rollo por las empresas (valor entre cantidad). Los dos últimos meses son provisionales.', 'Average purchase price of roundwood paid by firms (value over quantity). The last two months are provisional.', 'Prix moyen d’achat du bois rond par les entreprises (valeur sur quantité). Les deux derniers mois sont provisoires.', 'Prezzo medio d’acquisto del tondame da parte delle imprese (valore su quantità). Gli ultimi due mesi sono provvisori.'),
    CZ: L('Precio medio de venta de madera en rollo cuando el vendedor es el propietario del bosque, por clase de calidad y especie.', 'Average sale price of roundwood when the seller is the forest owner, by quality class and species.', 'Prix moyen de vente du bois rond lorsque le vendeur est le propriétaire de la forêt, par classe de qualité et essence.', 'Prezzo medio di vendita del tondame quando il venditore è il proprietario del bosco, per classe di qualità e specie.'),
    LV: L('Precio medio de compra de madera (sin IVA) por surtido y diámetro; semestral.', 'Average purchase price of wood (excl. VAT) by assortment and diameter; half-yearly.', 'Prix moyen d’achat du bois (hors TVA) par assortiment et diamètre ; semestriel.', 'Prezzo medio d’acquisto del legname (IVA esclusa) per assortimento e diametro; semestrale.'),
    FI: L('Precio de la madera en pie en las ventas con comprador (todas las clases de corta), semanal; país y regiones de precios.', 'Stumpage price in sales with a buyer (all felling types), weekly; country and price regions.', 'Prix du bois sur pied dans les ventes avec acheteur (tous types de coupe), hebdomadaire ; pays et régions de prix.', 'Prezzo del legname in piedi nelle vendite con acquirente (tutti i tipi di taglio), settimanale; paese e regioni di prezzo.'),
    PL: L('Precio medio de venta de la madera de las unidades de los Bosques Estatales en los tres primeros trimestres del año (base del impuesto forestal del año siguiente). Un dato al año.', 'Average timber sale price of State Forests units in the first three quarters of the year (base of the next year’s forest tax). One figure a year.', 'Prix moyen de vente du bois des unités des Forêts d’État sur les trois premiers trimestres (base de la taxe forestière de l’année suivante). Un chiffre par an.', 'Prezzo medio di vendita del legname delle unità delle Foreste di Stato nei primi tre trimestri (base dell’imposta forestale dell’anno successivo). Un dato all’anno.'),
    UK: L('Precio medio nominal de los doce meses terminados en marzo o septiembre (Gran Bretaña); cada dato es una media de 12 meses, así que dos datos seguidos se solapan. Solo el boletín más reciente de Forest Research.', 'Average nominal price for the twelve months to March or September (Great Britain); each figure is a 12-month average, so consecutive figures overlap. Only the latest Forest Research bulletin.', 'Prix nominal moyen des douze mois clos en mars ou septembre (Grande-Bretagne) ; chaque chiffre est une moyenne sur 12 mois, deux chiffres successifs se chevauchent donc. Seul le dernier bulletin de Forest Research.', 'Prezzo nominale medio dei dodici mesi chiusi a marzo o settembre (Gran Bretagna); ogni dato è una media di 12 mesi, quindi due dati consecutivi si sovrappongono. Solo l’ultimo bollettino di Forest Research.'),
    SE: L('Precio de la madera en rollo (sin corteza), trimestral (Skogsstyrelsen).', 'Roundwood price (under bark), quarterly (Skogsstyrelsen).', 'Prix du bois rond (sous écorce), trimestriel (Skogsstyrelsen).', 'Prezzo del tondame (sotto corteccia), trimestrale (Skogsstyrelsen).'),
    DE: L('Índice de precios de venta de la madera de los bosques estatales (2015 = 100), mensual (Destatis).', 'Price index of timber sold from state forests (2015 = 100), monthly (Destatis).', 'Indice des prix de vente du bois des forêts domaniales (2015 = 100), mensuel (Destatis).', 'Indice dei prezzi di vendita del legname delle foreste statali (2015 = 100), mensile (Destatis).'),
    US: L('Índices de precios de producción del BLS (1982 = 100): madera aserrada, contrachapado y madera en rollo; no son precios en dólares.', 'BLS producer price indices (1982 = 100): lumber, plywood and logs; they are not dollar prices.', 'Indices des prix à la production du BLS (1982 = 100) : sciages, contreplaqué et bois rond ; ce ne sont pas des prix en dollars.', 'Indici dei prezzi alla produzione del BLS (1982 = 100): segati, compensato e tondame; non sono prezzi in dollari.')
  };
  var UNITL = { 'SEK/m3 under bark': L('SEK/m³ sin corteza', 'SEK/m³ under bark', 'SEK/m³ sous écorce', 'SEK/m³ sotto corteccia'), 'GBP/m3 overbark (nominal)': L('GBP/m³ con corteza (nominal)', 'GBP/m³ over bark (nominal)', 'GBP/m³ sur écorce (nominal)', 'GBP/m³ con corteccia (nominale)'),
    'index 2015=100': L('índice 2015 = 100', 'index 2015 = 100', 'indice 2015 = 100', 'indice 2015 = 100'), 'index 1982=100': L('índice 1982 = 100', 'index 1982 = 100', 'indice 1982 = 100', 'indice 1982 = 100'),
    'escarabajos por trampa': L('por trampa', 'per trap', 'par piège', 'per trappola'), 'USc/sheet': L('US¢/hoja', 'US¢/sheet', 'US¢/feuille', 'US¢/foglio') };
  var VIEW = {}, IDX = null, CUR = 'ES', YR = null, PSEL = {}, CSEL = 0, MAPM = 'ha', PREG = '', DREG = '', DSEL = {}, ESEL = {}, TSEL = {}, WB = null;
  function getV(n) { if (!VIEW[n]) VIEW[n] = fetch(S && S.sitePath ? S.sitePath('data/views/forest/' + n + '.json') : 'data/views/forest/' + n + '.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); return VIEW[n]; }
  function cname(cc) { return tx(CN[cc] || [cc, cc, cc, cc]); }
  function flag(cc) { var iso = { EL: 'GR', UK: 'GB', EU: 'EU' }[cc] || cc; return /^[A-Z]{2}$/.test(iso) ? String.fromCodePoint(127397 + iso.charCodeAt(0), 127397 + iso.charCodeAt(1)) + ' ' : ''; }
  function chgSpan(v) { return '<span class="fsh-chg ' + (v == null ? '' : v >= 0 ? 'up' : 'dn') + '">' + pct(v) + '</span>'; }
  function freqOf(p) { return /^\d{4}$/.test(p) ? 'A' : /-Q\d$/.test(p) ? 'Q' : /-H\d$/.test(p) ? 'H' : /-W\d\d$/.test(p) ? 'W' : 'M'; }
  function plabel(p) { var f = freqOf(p); if (f === 'M') { try { return new Date(ts(p, 'M')).toLocaleDateString(LOC[lg()], { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return p; } } return p; }
  function rel(a, b) { return a && b && b[1] ? (a[1] / b[1] - 1) * 100 : null; }
  function yrPick(a) { if (!a || !a.length) return null; if (YR == null) return a[a.length - 1]; for (var i = a.length - 1; i >= 0; i--) if (+String(a[i][0]).slice(0, 4) <= YR) return a[i]; return null; }
  function kpi(l, v, u, sub) { return '<div class="fsh-kpi"><div class="fsh-kl">' + esc(l) + '</div><div class="fsh-kv">' + v + (u ? ' <span class="fsh-ku">' + esc(u) + '</span>' : '') + '</div>' + (sub ? '<div class="fsh-kp">' + sub + '</div>' : '') + '</div>'; }
  function src(s) { return s && s.url ? srcLine({ name: s.name, url: s.url, license: s.license || s.licence || '' }) : ''; }
  function sec(id, title, body, sub) { return '<section class="di-card fsh-sec wp-card" id="' + id + '"><h2 class="fsh-h2">' + esc(title) + '</h2>' + (sub ? '<p class="di-movers-hint" style="margin:0 0 10px">' + esc(sub) + '</p>' : '') + body + '</section>'; }
  function lineChart(series, o) {
    var C = global.DehesaChart; if (!C) return '';
    var ss = series.filter(function (s) { return s.pts.length > 1; }); if (!ss.length) return '';
    return C.render({ series: ss, xMode: 'time', yTitle: o.yTitle, aria: o.aria, noLegend: ss.length < 2, trend: o.trend, trendUnit: o.trendUnit, vFmt: o.vFmt || function (v) { return num(v, dec(v)); }, yMin: o.yMin });
  }
  function toPts(a) { return a.map(function (p) { var f = freqOf(String(p[0])); return { x: ts(String(p[0]), f), y: p[1], l: plabel(String(p[0])) }; }); }
  function spark(a, f) {
    var n = (BACK[f] || 12) * 2, v = a.slice(-n - 1); if (v.length < 4) return '';
    var mn = Math.min.apply(null, v.map(function (p) { return p[1]; })), mx = Math.max.apply(null, v.map(function (p) { return p[1]; })), rg = mx - mn || 1;
    return '<svg width="96" height="22" viewBox="0 0 96 22" aria-hidden="true"><polyline fill="none" stroke="currentColor" stroke-width="1.4" points="' + v.map(function (p, i) { return (i / (v.length - 1) * 94 + 1).toFixed(1) + ',' + (20 - (p[1] - mn) / rg * 18).toFixed(1); }).join(' ') + '"/></svg>';
  }
  /* ---- cifras clave ---- */
  function kpis(v) {
    var h = '', r = v.removals, f = v.fires, p = v.prices, q = v.ppi, ar = v.area;
    if (r) { var t = r.series.total, x = yrPick(t), px = x ? t.filter(function (z) { return z[0] === x[0] - 1; })[0] : null;
      if (x) h += kpi(tx(FX.kRem) + ' · ' + x[0], num(x[1], 0), tx(FX.kRemU), (px ? chgSpan(rel(x, px)) + ' ' + esc(tx(FX.vsPrevY)) : '') + (r.estimated.indexOf(x[0]) >= 0 ? ' · ' + esc(tx(FX.est)) : ''));
      var a = ar && yrPick(ar.points.filter(function (z) { return x && z[0] <= x[0]; }));
      if (x && a && a[1]) h += kpi(tx(FX.kHa) + ' · ' + x[0], num(x[1] / a[1], 2), 'm³/ha', esc(tx(FX.kArea)) + ': ' + num(a[1], 0) + ' ' + esc(tx(FX.kAreaU)) + ' (' + a[0] + ')'); }
    else if (ar) { var a2 = yrPick(ar.points); if (a2) h += kpi(tx(FX.kArea) + ' · ' + a2[0], num(a2[1], 0), tx(FX.kAreaU)); }
    if (f) { var fy = YR == null ? f.currentYear : YR, row = f.years.filter(function (z) { return z[0] === fy; })[0], se = f.season, sub = '';
      if (row) {
        if (se && se.year !== f.currentYear) se = null;
        if (fy === f.currentYear && se) { var w = se.weeks.filter(function (z) { return z[2] != null; }).pop(); if (w) { var dv = w[3] >= MINREF ? (w[2] / w[3] - 1) * 100 : null; sub = (dv == null ? esc(tx(FX.zeroAvg)) : chgSpan(dv) + ' ' + esc(tx(FX.vsAvgTo).replace('{a}', se.fromYear + '–' + (se.year - 1)))); } }
        else if (se) { var avg = se.weeks[se.weeks.length - 1][3]; sub = avg >= MINREF ? chgSpan((row[1] / avg - 1) * 100) + ' ' + esc(tx(FX.vsAvgYr).replace('{a}', se.fromYear + '–' + (se.year - 1))) : ''; }
        h += kpi(tx(FX.kBa) + ' · ' + fy + (fy === f.currentYear ? ' (' + tx(FX.ytd) + ')' : ''), num(row[1], 0), 'ha', sub);
        h += kpi(tx(FX.kNf) + ' · ' + fy, num(row[2], 0), '', f.system.toUpperCase());
      } }
    if (p && p.series.length) { var b = p.series.filter(function (s) { return s.bench && !s.region && s.pts.length; })[0] || p.series.filter(function (s) { return !s.region && s.pts.length; })[0];
      if (b) { var lp = yrPick(b.pts); if (lp) { var yb = findP(b.pts, yearAgo(lp[0]));
        h += kpi(tx(FX.kPrice) + (lg() === 'fr' ? ' : ' : ': ') + trl(b.label) + ' · ' + plabel(String(lp[0])), num(lp[1], dec(lp[1], p.unit)), unit(p.unit), yb ? chgSpan(rel(lp, yb)) + ' ' + esc(tx(FX.vsYear)) : ''); } } }
    if (q && q.C16.length) { var lq = yrPick(q.C16); if (lq) { var yq = findP(q.C16, yearAgo(lq[0])); h += kpi(tx(FX.kPpi) + ' · ' + plabel(lq[0]), num(lq[1], 1), tx(FX.idx), yq ? chgSpan(rel(lq, yq)) + ' ' + esc(tx(FX.vsYear)) : ''); } }
    if (v.cork && v.cork.exports && v.cork.exports.length) { var ce = yrPick(v.cork.exports.map(function (z) { return [z[0], z[1]]; })), cp = ce ? v.cork.exports.filter(function (z) { return z[0] === ce[0] - 1; })[0] : null;
      if (ce) h += kpi(tx(FX.kCork) + ' · ' + ce[0], num(ce[1], 1), tx(MC.meur), (cp ? chgSpan(rel(ce, cp)) + ' ' + esc(tx(FX.vsPrevY)) + ' · ' : '') + '<a href="dehesa.html#dh-cork">' + esc(tx(L('ver', 'see', 'voir', 'vedi'))) + '</a>'); }
    return h ? '<div class="fsh-kpis">' + h + '</div><p class="fsh-m" style="margin:-6px 0 12px">' + esc(tx(FX.kNoteCalc)) + '</p>' : '';
  }
  /* ---- series largas: cortas y superficie quemada (dos gráficas: unidades distintas) ---- */
  function longBlock(v) {
    var out = '', r = v.removals, f = v.fires;
    if (r) {
      var s = r.series, ser = [{ name: tx(FX.sTot), color: '#2f6b4a', pts: toPts(s.total.filter(function (z) { return z[0] >= 2000; })) }];
      if (s.conif && s.nonconif) { ser.push({ name: tx(FX.sConif), color: '#8a6d3b', pts: toPts(s.conif.filter(function (z) { return z[0] >= 2000; })) }); ser.push({ name: tx(FX.sBroad), color: '#6f8fa6', pts: toPts(s.nonconif.filter(function (z) { return z[0] >= 2000; })), dash: '4 3' }); }
      out += '<div class="di-info-card-title gb-sub">' + esc(tx(FX.chRem)) + '</div>' + lineChart(ser, { yTitle: tx(FX.kRemU), aria: tx(FX.chRem), vFmt: function (x) { return num(x, 0); } });
      var last = s.total[s.total.length - 1], parts = [['saw', FX.uSaw], ['pulp', FX.uPulp], ['other', FX.uOther], ['fuel', FX.uFuel]].map(function (k) { var a = (s[k[0]] || []).filter(function (z) { return z[0] === last[0]; })[0]; return a ? [tx(k[1]), a[1]] : null; }).filter(Boolean);
      if (parts.length > 1 && last[1]) out += '<div class="fsh-age" style="margin:10px 0 4px"><div class="fsh-kl" style="margin-bottom:4px">' + esc(tx(FX.remSplit)) + ' · ' + last[0] + '</div>' + parts.map(function (p) { var sh = p[1] / last[1] * 100; return '<div class="fsh-age-r"><span>' + esc(p[0]) + '</span><span class="fsh-bar wide"><i style="width:' + Math.max(1, Math.min(100, sh)).toFixed(1) + '%"></i></span><b>' + num(sh, 0) + ' %</b></div>'; }).join('') + '</div>';
      out += '<p class="di-movers-hint" style="max-width:860px">' + esc(tx(FX.remNote)) + (r.estimated.length ? ' ' + esc(tx(FX.est)) + ': ' + r.estimated.join(', ') + '.' : '') + '</p>' + src(r.src);
    }
    if (f) {
      out += '<div class="di-info-card-title gb-sub" style="margin-top:14px">' + esc(tx(FX.chBa)) + ' · ' + esc(f.system.toUpperCase()) + '</div>' + lineChart([{ name: tx(FX.kBa), color: '#b4552d', pts: toPts(f.years.map(function (z) { return [z[0], z[1]]; })) }], { yTitle: 'ha', aria: tx(FX.chBa), vFmt: function (x) { return num(x, 0); } });
    }
    return out ? '<section class="di-card fsh-sec wp-card" id="bq-long">' + out + '</section>' : '';
  }
  /* ---- precios por surtido (como la tabla de lonja de pesca) ---- */
  function pricesBlock(v) {
    var p = v.prices;
    if (!p || !p.series.length) return sec('bq-prices', tx(FX.hPrices), '<p class="di-movers-hint">' + esc(v.ppi ? tx(FX.noPrice) : tx(FX.noPrice2)) + '</p>');
    var regs = {}; p.series.forEach(function (s) { if (s.region) regs[s.region] = 1; });
    var rk = Object.keys(regs).sort(), head = '';
    if (rk.length) { if (PREG && !regs[PREG]) PREG = ''; head = '<div class="fsh-pick"><label>' + esc(tx(T.region)) + ' <select id="bq-reg"><option value="">' + esc(tx(T.wholeCountry)) + '</option>' + rk.map(function (r) { return '<option value="' + esc(r) + '"' + (r === PREG ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('') + '</select></label></div>'; } else PREG = '';
    var list = p.series.filter(function (s) { return (s.region || '') === PREG && s.pts.length; }), key = CUR + PREG, back = BACK[p.freq] || 1;
    if (!list.length) return '';
    var cur = list.filter(function (s) { return s.id === PSEL[key]; })[0] || list.filter(function (s) { return s.bench; })[0] || list[0]; PSEL[key] = cur.id;
    var rows = list.map(function (s) {
      var a = s.pts, l = a[a.length - 1];
      return '<tr class="fsh-row' + (s.id === cur.id ? ' on' : '') + '" tabindex="0" data-psid="' + esc(s.id) + '"><td>' + esc(trl(s.label)) + '</td><td class="num">' + esc(plabel(String(l[0]))) + '</td><td class="num"><b>' + num(l[1], dec(l[1], p.unit)) + '</b> <span class="fsh-m">' + esc(unit(p.unit)) + '</span></td><td class="num">' + chgSpan(rel(l, findP(a, shiftP(l[0], 1)))) + '</td><td class="num">' + chgSpan(rel(l, findP(a, yearAgo(l[0])))) + '</td><td class="num" style="color:var(--accent)">' + spark(a, p.freq) + '</td></tr>';
    }).join('');
    var tbl = '<div class="di-table-wrap"><table class="fsh-tbl"><thead><tr><th>' + esc(tx(T.hSeries)) + '</th><th class="num">' + esc(tx(T.hPer)) + '</th><th class="num">' + esc(tx(T.hLast)) + '</th><th class="num">' + esc(tx(FX.hPrev)) + '</th><th class="num">' + esc(tx(FX.hYear)) + '</th><th class="num">' + esc(tx(FX.hSpark)) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    var ch = lineChart([{ name: trl(cur.label), color: '#2f6b4a', pts: toPts(cur.pts) }], { yTitle: unit(p.unit), trendUnit: unit(p.unit), aria: trl(cur.label) });
    var note = (PNOTE[CUR] ? tx(PNOTE[CUR]) + ' ' : '') + '(' + tx(T.freq[p.freq] || T.freq.M) + (p.vat ? ', ' + tx(T.vat[p.vat] || T.vat['n/d']) : '') + '). ' + tx(T.vsNote) + ' ' + tx(T.pricesNote) + (p.preliminary && p.preliminary.length ? ' ' + tx(L('Provisional: ', 'Preliminary: ', 'Provisoire : ', 'Provvisorio: ')) + p.preliminary.join(', ') + '.' : '');
    return sec('bq-prices', tx(FX.hPrices), head + '<div class="fsh-m" style="margin-bottom:4px">' + esc(tx(T.pickRow)) + '</div>' + tbl + '<div class="di-info-card-title gb-sub" style="margin-top:14px">' + esc(trl(cur.label)) + ' · ' + esc(unit(p.unit)) + ' · ' + esc(tx(T.freq[p.freq] || T.freq.M)) + '</div>' + ch +
      '<p class="di-movers-hint" style="max-width:860px">' + esc(note) + '</p>' + (CUR === 'CZ' || CUR === 'SI' || CUR === 'LV' || CUR === 'FI' || CUR === 'PL' ? '<p class="di-movers-hint" style="max-width:860px">' + esc(tx(T.bgNote)) + '</p>' : '') + src(p.src));
  }
  /* ---- precio frente al índice industrial ---- */
  function ppiFor(q, per) {
    var f = freqOf(per), y = per.slice(0, 4), ms = [];
    if (f === 'M') ms = [per]; else if (f === 'A') for (var i = 1; i <= 12; i++) ms.push(y + '-' + (i < 10 ? '0' : '') + i);
    else if (f === 'Q') { var qq = +per.slice(6); for (var k = 1; k <= 3; k++) { var m = (qq - 1) * 3 + k; ms.push(y + '-' + (m < 10 ? '0' : '') + m); } }
    else if (f === 'H') { var h = +per.slice(6); for (var k2 = 1; k2 <= 6; k2++) { var m2 = (h - 1) * 6 + k2; ms.push(y + '-' + (m2 < 10 ? '0' : '') + m2); } }
    else { var d = new Date(ts(per, 'W') + 3 * 864e5); ms = [d.getUTCFullYear() + '-' + (d.getUTCMonth() < 9 ? '0' : '') + (d.getUTCMonth() + 1)]; }
    var mp = q.map || (q.map = (function () { var o = {}; q.C16.forEach(function (z) { o[z[0]] = z[1]; }); return o; })()), s = 0;
    for (var j = 0; j < ms.length; j++) { if (mp[ms[j]] == null) return null; s += mp[ms[j]]; }
    return s / ms.length;
  }
  function crossBlock(v) {
    var p = v.prices, q = v.ppi;
    if (!q || !q.C16.length) return '';
    if (!p || !p.series.length || p.priceType === 'index' && CUR === 'US') {
      var ser = [{ name: tx(FX.ppiC16), color: '#2f6b4a', pts: toPts(q.C16) }]; if (q.C161 && q.C161.length) ser.push({ name: tx(FX.ppiC161), color: '#b4552d', pts: toPts(q.C161), dash: '4 3' });
      return sec('bq-ppi', tx(FX.ppiOnly).replace('{u}', tx(FX.idx)), lineChart(ser, { yTitle: tx(FX.idx), aria: tx(FX.kPpi), vFmt: function (x) { return num(x, 1); } }) + src(q.src));
    }
    var back = BACK[p.freq] || 1, rows = [], list = p.series.filter(function (s) { return !s.region && s.pts.length > back; });
    list.forEach(function (s, i) {
      /* el último periodo con precio e índice a la vez (el índice va con dos meses de retraso) y el mismo periodo un año antes */
      var a = s.pts, l = null, o = null, pl = null, po = null, k;
      for (k = a.length - 1; k >= 0 && !l; k--) { var c0 = findP(a, yearAgo(a[k][0])), x1 = ppiFor(q, String(a[k][0])), x0 = c0 ? ppiFor(q, String(c0[0])) : null; if (x1 != null && x0 && c0) { l = a[k]; o = c0; pl = x1; po = x0; } }
      if (!l) return;
      var cp = rel(l, o), cq = (pl / po - 1) * 100;
      rows.push({ i: i, s: s, cp: cp, cq: cq, per: String(l[0]) });
    });
    if (!rows.length) return '';
    var rc = rows.filter(function (r) { return r.i === CSEL; })[0] || rows[0]; CSEL = rc.i;
    var c = rc.s, com = c.pts.filter(function (z) { return ppiFor(q, String(z[0])) != null; });
    var tb = '<div class="di-table-wrap"><table class="fsh-tbl"><thead><tr><th>' + esc(tx(T.hSeries)) + '</th><th class="num">' + esc(tx(T.hPer)) + '</th><th class="num">' + esc(tx(FX.hcPrice)) + '</th><th class="num">' + esc(tx(FX.hcPpi)) + '</th><th class="num">' + esc(tx(FX.hcGap)) + '</th></tr></thead><tbody>' +
      rows.map(function (r) { var g = r.cp != null && r.cq != null ? r.cp - r.cq : null; return '<tr class="fsh-row' + (r.i === CSEL ? ' on' : '') + '" tabindex="0" data-cx="' + r.i + '"><td>' + esc(trl(r.s.label)) + '</td><td class="num">' + esc(plabel(r.per)) + '</td><td class="num">' + chgSpan(r.cp) + '</td><td class="num">' + chgSpan(r.cq) + '</td><td class="num">' + (g == null ? '—' : (g > 0 ? '+' : '') + num(g, 1)) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    var ch = '';
    if (com.length > 2) { var b0 = com[0][1], q0 = ppiFor(q, String(com[0][0])), f0 = freqOf(String(com[0][0]));
      ch = '<div class="di-info-card-title gb-sub" style="margin-top:14px">' + esc(tx(FX.crossCh).replace('{s}', trl(c.label)).replace('{b}', plabel(String(com[0][0])))) + '</div>' +
        lineChart([{ name: trl(c.label), color: '#2f6b4a', pts: com.map(function (z) { return { x: ts(String(z[0]), f0), y: z[1] / b0 * 100, l: plabel(String(z[0])) }; }) },
                   { name: tx(FX.ppiC16), color: '#b4552d', pts: com.map(function (z) { return { x: ts(String(z[0]), f0), y: ppiFor(q, String(z[0])) / q0 * 100, l: plabel(String(z[0])) }; }) }], { yTitle: '100 = ' + plabel(String(com[0][0])), aria: tx(FX.hCross), vFmt: function (x) { return num(x, 1); } }); }
    return sec('bq-cross', tx(FX.hCross), tb + ch + '<p class="di-movers-hint" style="max-width:860px">' + esc(tx(FX.crossNote)) + '</p>' + src(q.src), tx(FX.crossSub));
  }
  /* ---- temporada de incendios ---- */
  function seasonBlock(v) {
    var f = v.fires, se = f && f.season; if (!se || se.year !== f.currentYear || (YR != null && YR !== se.year)) return '';
    var a = se.fromYear + '–' + (se.year - 1), W = se.weeks, done = W.filter(function (w) { return w[2] != null; });
    if (!done.length) return '';
    var dts = function (w) { var p = w[1].split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); };
    var lab = function (w) { try { return tx(FX.weekTo).replace('{d}', new Date(dts(w)).toLocaleDateString(LOC[lg()], { day: 'numeric', month: 'short', timeZone: 'UTC' })); } catch (e) { return w[1]; } };
    var ser = [{ name: tx(FX.sThis).replace('{y}', se.year), color: '#b4552d', pts: done.map(function (w) { return { x: dts(w), y: w[2], l: lab(w) }; }) },
               { name: tx(FX.sAvg).replace('{a}', a), color: '#2f6b4a', pts: W.map(function (w) { return { x: dts(w), y: w[3], l: lab(w) }; }) }];
    if (W[0][5] != null) ser.push({ name: tx(FX.sMax).replace('{a}', a), color: '#9a9284', pts: W.map(function (w) { return { x: dts(w), y: w[5], l: lab(w) }; }), dash: '4 3' });
    var ch = lineChart(ser, { yTitle: 'ha', aria: tx(FX.hSeason).replace('{y}', se.year), vFmt: function (x) { return num(x, 0); }, trend: false });
    var months = {}, ord = []; W.forEach(function (w) { var m = w[1].slice(0, 7); if (w[2] == null) return; if (!months[m]) ord.push(m); months[m] = w; });
    var rows = ord.filter(function (m) { return months[m][2] != null; }).map(function (m) { var w = months[m], d = w[3] >= MINREF ? (w[2] / w[3] - 1) * 100 : null;
      return '<tr><td>' + esc(plabel(m)) + ' <span class="fsh-m">' + esc(lab(w)) + '</span></td><td class="num">' + num(w[2], 0) + '</td><td class="num">' + num(w[3], 0) + '</td><td class="num">' + (d == null ? '<span class="fsh-m">' + esc(tx(FX.zeroAvg)) + '</span>' : chgSpan(d)) + '</td><td class="num">' + num(w[6], 0) + '</td></tr>'; }).join('');
    var tb = '<div class="di-table-wrap"><table class="fsh-tbl"><thead><tr><th>' + esc(tx(FX.month)) + '</th><th class="num">' + esc(tx(FX.cumY).replace('{y}', se.year)) + '</th><th class="num">' + esc(tx(FX.cumA)) + '</th><th class="num">' + esc(tx(FX.vsA)) + '</th><th class="num">' + esc(tx(FX.fires)) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    return sec('bq-season', tx(FX.hSeason).replace('{y}', se.year), ch + tb + '<p class="di-movers-hint" style="max-width:860px">' + esc(tx(T.fireNote).replace(/ La media de 10 años.*$| The 10-year average.*$| La moyenne sur 10 ans.*$| La media a 10 anni.*$/, '')) + (se.sumOf ? ' ' + esc(tx(L('UE: suma de los 27 países (el mínimo y el máximo no se pueden sumar).', 'EU: sum of the 27 countries (minimum and maximum cannot be summed).', 'UE : somme des 27 pays (le minimum et le maximum ne s’additionnent pas).', 'UE: somma dei 27 paesi (minimo e massimo non si possono sommare).'))) : '') + '</p>' + src(f.src), tx(FX.seasonSub).replace('{a}', a));
  }
  /* ---- daños y energía: tabla + gráfica de la fila elegida (formato de seriesBlock) ---- */
  function asOld(s) { return { id: s.id, label: trl(s.label), unit: s.unit, freq: s.freq, periods: s.pts.map(function (z) { return z[0]; }), values: s.pts.map(function (z) { return z[1]; }), source: s.src, region: s.region }; }
  function dmgBlock(v) {
    if (!v.damage || !v.damage.length) return '';
    var all = v.damage.map(asOld), regs = {}; all.forEach(function (s) { if (s.region) regs[s.region] = 1; });
    var rk = Object.keys(regs).sort(function (a, b) { return a.localeCompare(b, LOC[lg()]); }), head = '';
    if (rk.length) { if (DREG && !regs[DREG]) DREG = ''; head = '<div class="fsh-pick"><label>' + esc(tx(T.region)) + ' <select id="bq-dreg"><option value="">' + esc(tx(T.wholeCountry)) + '</option>' + rk.map(function (r) { return '<option value="' + esc(r) + '"' + (r === DREG ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('') + '</select></label></div>'; } else DREG = '';
    var list = all.filter(function (s) { return (s.region || '') === DREG; }); if (!list.length) return '';
    ST.sel = DSEL; return sec('bq-dmg', tx(FX.hDmg), head + seriesBlock(list, 'd' + CUR + DREG) + (DREG === '' ? rankView(all) : '') + '<p class="di-movers-hint" style="max-width:860px">' + esc(tx(T.dmgNote)) + '</p>');
  }
  function energyBlock(v) {
    if (!v.energy || !v.energy.length) return '';
    ST.sel = ESEL; return sec('bq-energy', tx(FX.hEn), seriesBlock(v.energy.map(asOld), 'e' + CUR) + '<p class="di-movers-hint" style="max-width:860px">' + esc(tx(T.enNote)) + '</p>');
  }
  function tropicalBlock() {
    if (!WB || !WB.series) return '';
    var list = WB.series.map(function (s) { return { id: s.id, label: s.name[lg()] || s.name.en, unit: s.unit, freq: 'M', periods: s.points.map(function (p) { return p[0]; }), values: s.points.map(function (p) { return p[1]; }), source: WB.source }; });
    ST.sel = TSEL; return '<details class="di-card fsh-sec wp-card" id="bq-tropical"><summary class="fsh-h2" style="cursor:pointer">' + esc(tx(FX.tropical)) + '</summary>' + seriesBlock(list, 'tr') + '<p class="di-movers-hint">' + esc(tx(T.trNote)) + '</p></details>';
  }
  /* ---- mapa de Europa y comparativa ---- */
  var MAPL = 0;
  function mval(r) {
    if (MAPM === 'ha') return r.removalsPerHa ? r.removalsPerHa[1] : null;
    if (MAPM === 'fire') return r.fireVsAvg && r.fireVsAvg[2] >= MINREF ? (r.fireVsAvg[1] / r.fireVsAvg[2] - 1) * 100 : null;
    return r.ppi ? r.ppi[2] : null;
  }
  function mapSvg() {
    var G = global.DEHESA_EU_COUNTRIES_MAP;
    if (!G) { if (!MAPL) { MAPL = 1; var s = document.createElement('script'); s.src = 'vendor/eu-countries-map.js'; s.onload = function () { var b = document.getElementById('bq-mapbox'); if (b) b.innerHTML = mapSvg(); }; document.head.appendChild(s); } return ''; }
    var by = {}; (IDX.countries || []).forEach(function (r) { by[{ EL: 'GR', UK: 'GB' }[r.cc] || r.cc] = r; });
    var vals = Object.keys(by).map(function (k) { return mval(by[k]); }).filter(function (x) { return x != null; }).sort(function (a, b) { return a - b; });
    var div = MAPM !== 'ha', pal = div ? ['#2f6b8a', '#8fb4c9', '#e8e2d4', '#e0a37a', '#b4552d'] : ['#eef0e2', '#c9d8b0', '#93b77f', '#5c8f57', '#2f6b4a'];
    var brk = div ? [-25, -5, 5, 25] : (function () { var q = function (f) { return vals.length ? vals[Math.min(vals.length - 1, Math.floor(f * vals.length))] : 0; }; return [q(.2), q(.4), q(.6), q(.8)]; })();
    var col = function (x) { if (x == null) return 'var(--border)'; for (var i = 0; i < brk.length; i++) if (x < brk[i]) return pal[i]; return pal[4]; };
    var curIso = { EL: 'GR', UK: 'GB' }[CUR] || CUR;
    var paths = G.countries.map(function (c) { var r = by[c.id], x = r ? mval(r) : null, cc = r ? r.cc : null;
      return '<path d="' + c.d + '" fill="' + col(x) + '" stroke="' + (c.id === curIso ? 'var(--text)' : 'var(--surface,#fff)') + '" stroke-width="' + (c.id === curIso ? 2 : .6) + '"' + (cc ? ' data-mcc="' + cc + '" style="cursor:pointer"' : '') + '><title>' + esc(cc ? cname(cc) : c.name) + ': ' + (x == null ? tx(FX.noData) : num(x, MAPM === 'ha' ? 2 : 1) + (MAPM === 'ha' ? ' m³/ha' : ' %')) + '</title></path>'; }).join('');
    var leg = pal.map(function (p, i) { var lo = i ? brk[i - 1] : null, hi = i < 4 ? brk[i] : null, f = function (z) { return num(z, MAPM === 'ha' ? 1 : 0); };
      return '<span style="display:inline-flex;align-items:center;gap:4px;margin-right:10px"><i style="width:12px;height:12px;border-radius:2px;background:' + p + ';display:inline-block"></i>' + (lo == null ? '< ' + f(hi) : hi == null ? '≥ ' + f(lo) : f(lo) + '–' + f(hi)) + (MAPM === 'ha' ? '' : ' %') + '</span>'; }).join('') +
      '<span style="display:inline-flex;align-items:center;gap:4px"><i style="width:12px;height:12px;border-radius:2px;background:var(--border);display:inline-block"></i>' + esc(tx(FX.noData)) + '</span>';
    return '<svg viewBox="' + G.viewBox + '" role="img" aria-label="' + esc(tx(FX.hMap)) + '" style="width:100%;max-width:640px;height:auto;display:block">' + paths + '</svg><div class="fsh-m" style="font-size:12px;margin-top:6px">' + leg + '</div>';
  }
  function compareBlock() {
    if (!IDX) return '';
    var opts = [['ha', FX.mHa], ['fire', FX.mFire], ['ppi', FX.mPpi]].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === MAPM ? ' selected' : '') + '>' + esc(tx(o[1])) + '</option>'; }).join('');
    var rows = IDX.countries.slice().sort(function (a, b) { return cname(a.cc).localeCompare(cname(b.cc), LOC[lg()]); });
    var tr = rows.map(function (r) {
      var fv = r.fireVsAvg && r.fireVsAvg[2] >= MINREF ? (r.fireVsAvg[1] / r.fireVsAvg[2] - 1) * 100 : null;
      return '<tr class="fsh-row' + (r.cc === CUR ? ' on' : '') + '" tabindex="0" role="button" data-cc="' + r.cc + '"><td><span aria-hidden="true">' + flag(r.cc) + '</span>' + esc(cname(r.cc)) + '</td>' +
        '<td class="num">' + (r.removals ? num(r.removals[1], 0) + ' <span class="fsh-m">' + r.removals[0] + (r.removals[2] ? '*' : '') + '</span>' : '—') + '</td>' +
        '<td class="num">' + (r.removalsPerHa ? num(r.removalsPerHa[1], 2) : '—') + '</td>' +
        '<td class="num">' + (r.fireYtd ? num(r.fireYtd[1], 0) : '—') + '</td><td class="num">' + (r.fireVsAvg ? (fv == null ? '<span class="fsh-m">—</span>' : chgSpan(fv)) : '—') + '</td>' +
        '<td class="num">' + (r.price ? num(r.price.value, dec(r.price.value, r.price.unit)) + ' <span class="fsh-m">' + esc(unit(r.price.unit)) + ' · ' + esc(plabel(String(r.price.period))) + '</span>' : '—') + '</td>' +
        '<td class="num">' + (r.ppi ? chgSpan(r.ppi[2]) : '—') + '</td></tr>';
    }).join('');
    return sec('bq-compare', tx(FX.hMap), '<div class="fsh-pick"><label>' + esc(tx(FX.show)) + ' <select id="bq-mapm">' + opts + '</select></label></div><div id="bq-mapbox">' + mapSvg() + '</div>' +
      '<div class="di-table-wrap" style="margin-top:12px"><table class="fsh-tbl"><thead><tr><th>' + esc(tx(T.country)) + '</th><th class="num">' + esc(tx(FX.cRem)) + '</th><th class="num">' + esc(tx(FX.cHa)) + '</th><th class="num">' + esc(tx(FX.cBa)) + '</th><th class="num">' + esc(tx(FX.vsA)) + '</th><th class="num">' + esc(tx(FX.cPrice)) + '</th><th class="num">' + esc(tx(FX.cPpi)) + '</th></tr></thead><tbody>' + tr + '</tbody></table></div>' +
      '<p class="di-movers-hint" style="max-width:860px">* ' + esc(tx(FX.est)) + '. ' + esc(tx(FX.kNoteCalc)) + ' ' + esc(tx(L('La comparación con la media de incendios solo se da si esa media llega a 100 ha.', 'The comparison with the fire average is only shown when that average reaches 100 ha.', 'La comparaison avec la moyenne des incendies n’apparaît que si cette moyenne atteint 100 ha.', 'Il confronto con la media degli incendi compare solo se tale media raggiunge 100 ha.'))) + ' ' + esc(tx(T.pricesNote)) + '</p>', tx(FX.mapSub));
  }
  /* ---- selector de país y año ---- */
  function yearsOf(v) {
    var m = {}; if (v.removals) v.removals.series.total.forEach(function (z) { m[z[0]] = 1; }); if (v.fires) v.fires.years.forEach(function (z) { m[z[0]] = 1; });
    return Object.keys(m).map(Number).filter(function (y) { return y >= 2000; }).sort(function (a, b) { return b - a; });
  }
  function header(v) {
    var cs = IDX.countries.map(function (r) { return r.cc; }).sort(function (a, b) { return a === 'EU' ? -1 : b === 'EU' ? 1 : cname(a).localeCompare(cname(b), LOC[lg()]); });
    var ys = yearsOf(v);
    return '<div class="fsh-pick"><label>' + esc(tx(T.country)) + ' <select id="bq-cc">' + cs.map(function (c) { return '<option value="' + c + '"' + (c === CUR ? ' selected' : '') + '>' + flag(c) + esc(cname(c)) + '</option>'; }).join('') + '</select></label>' +
      '<label>' + esc(tx(FX.year)) + ' <select id="bq-yr"><option value="">' + esc(tx(FX.latest)) + '</option>' + ys.map(function (y) { return '<option value="' + y + '"' + (y === YR ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select></label></div>';
  }
  function page() {
    var root = document.getElementById('bq-body'); if (!root) return;
    document.getElementById('bq-h1').textContent = tx(T.title); document.getElementById('bq-sub').textContent = tx(FX.sub);
    try { document.title = tx(T.title) + ' · ' + cname(CUR) + ' | Dehesa Index'; } catch (e) {}
    var want = CUR;
    return getV(CUR).then(function (v) {
      if (want !== CUR) return;   /* el usuario ya eligió otro país mientras llegaba este */
      if (!v) { root.innerHTML = '<p class="di-movers-hint">' + esc(tx(T.fail)) + '</p>'; return; }
      var body = kpis(v) + longBlock(v) + seasonBlock(v) + pricesBlock(v) + crossBlock(v) + dmgBlock(v) + energyBlock(v);
      root.innerHTML = '<div class="di-badge di-badge-green di-info-badge">' + esc(tx(L('DATOS OFICIALES REALES', 'REAL OFFICIAL DATA', 'DONNÉES OFFICIELLES RÉELLES', 'DATI UFFICIALI REALI'))) + '</div>' + header(v) +
        (body || '<p class="di-movers-hint">' + esc(tx(FX.none)) + '</p>') + compareBlock() + tropicalBlock();
      if (FOCUS) { var fs = FOCUS; FOCUS = null; refocus(fs); }
    });
  }
  function go(cc) { CUR = cc; PREG = ''; DREG = ''; CSEL = 0; YR = null; try { var u = new URL(global.location.href); u.searchParams.set('c', cc); u.searchParams.delete('s'); global.history.replaceState(null, '', u.toString()); } catch (e) {} page(); }
  var FOCUS = null;   /* control que recupera el foco cuando termina de pintarse la página */
  function refocus(sel) { var e = document.querySelector(sel); if (e && e.focus) e.focus(); }
  function bind() {
    var root = document.getElementById('bq-body');
    root.addEventListener('click', function (ev) {
      var t = ev.target, b = t.closest ? t.closest('tr[data-psid],tr[data-cx],tr[data-cc],tr[data-sid],path[data-mcc]') : null; if (!b) return;
      if (b.hasAttribute('data-mcc')) { go(b.getAttribute('data-mcc')); return; }
      if (b.hasAttribute('data-cc')) { go(b.getAttribute('data-cc')); global.scrollTo(0, 0); return; }
      if (b.hasAttribute('data-psid')) { var id = b.getAttribute('data-psid'); PSEL[CUR + PREG] = id; FOCUS = 'tr[data-psid="' + id + '"]'; page(); return; }
      if (b.hasAttribute('data-cx')) { CSEL = +b.getAttribute('data-cx'); FOCUS = 'tr[data-cx="' + CSEL + '"]'; page(); return; }
      if (b.hasAttribute('data-sid')) { var sid = b.getAttribute('data-sid'), box = b.closest('section,details'), k = box && box.id;
        if (k === 'bq-dmg') DSEL['d' + CUR + DREG] = sid; else if (k === 'bq-energy') ESEL['e' + CUR] = sid; else if (k === 'bq-tropical') TSEL.tr = sid;
        page(); setTimeout(function () { var d = document.getElementById('bq-tropical'); if (k === 'bq-tropical' && d) d.open = true; refocus('#' + k + ' tr[data-sid="' + sid + '"]'); }, 60); }
    });
    root.addEventListener('keydown', function (ev) { var t = ev.target; if ((ev.key === 'Enter' || ev.key === ' ') && t.tagName === 'TR') { ev.preventDefault(); t.click(); } });
    root.addEventListener('change', function (ev) {
      var id = ev.target.id;
      if (id === 'bq-cc') { FOCUS = '#bq-cc'; go(ev.target.value); }
      else if (id === 'bq-yr') { YR = ev.target.value ? +ev.target.value : null; FOCUS = '#bq-yr'; page(); }
      else if (id === 'bq-reg') { PREG = ev.target.value; FOCUS = '#bq-reg'; page(); }
      else if (id === 'bq-dreg') { DREG = ev.target.value; FOCUS = '#bq-dreg'; page(); }
      else if (id === 'bq-rk' || id === 'bq-ry') { if (id === 'bq-rk') { ST.rk = ev.target.value; ST.ry = ''; } else ST.ry = ev.target.value; FOCUS = '#' + id; page(); }
      else if (id === 'bq-mapm') { MAPM = ev.target.value; var bx = document.getElementById('bq-mapbox'); if (bx) bx.innerHTML = mapSvg(); }
    });
  }
  /* ---- bloque de la ficha de país (js/paises.js, forestUp) ---- */
  var MC = {
    h: L('Bosque y madera', 'Forests and timber', 'Forêts et bois', 'Foreste e legno'),
    fire: L('Incendios forestales', 'Forest fires', 'Incendies de forêt', 'Incendi boschivi'),
    price: L('Precio de la madera', 'Timber price', 'Prix du bois', 'Prezzo del legname'),
    dmg: L('Daños y cortas', 'Damage and felling', 'Dégâts et coupes', 'Danni e tagli'),
    more: L('Ver todo el bosque y la madera', 'See all forests and timber', 'Voir toutes les forêts et le bois', 'Vedi tutte le foreste e il legno'),
    en: L('Energía', 'Energy', 'Énergie', 'Energia'),
    vsPrev: L('año anterior', 'previous year', 'année précédente', 'anno precedente'),
    corkP: L('Corcho: producción', 'Cork: production', 'Liège : production', 'Sughero: produzione'),
    corkSum: L('suma de las comunidades con dato; no comparable sin más con años anteriores', 'sum of the regions with data; not directly comparable with earlier years', 'somme des régions disposant de données ; pas directement comparable aux années précédentes', 'somma delle regioni con dato; non direttamente confrontabile con gli anni precedenti'),
    corkX: L('Corcho y manufacturas: exportaciones', 'Cork and cork goods: exports', 'Liège et ouvrages en liège : exportations', 'Sughero e manufatti: esportazioni'),
    meur: L('millones de €', 'EUR million', 'millions d’€', 'milioni di €'),
    corkMore: L('Ver el corcho en Mercados Dehesa', 'See cork in Dehesa markets', 'Voir le liège dans Marchés de la dehesa', 'Vedi il sughero in Mercati della dehesa')
  };
  /* Corcho (solo España): producción del MITECO y exportaciones (Eurostat, capítulo 45) de data/dehesa.json, la misma fuente que dehesa.html */
  function corkRows(dh) {
    var c = dh && dh.cork, out = [];
    if (!c) return out;
    var p = c.production;
    if (p && p.years && p.total && p.years.length) {
      var i = p.years.length - 1, y = p.years[i];
      out.push('<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(tx(MC.corkP)) + ' (' + esc(String(y)) + ')</span><span class="di-info-stat-value"><b>' + num(p.total[i]) + '</b> t' + (y >= 2024 ? ' · ' + esc(tx(MC.corkSum)) : '') + '</span></div>');
    }
    var ex = c.countries && c.countries.ES && c.countries.ES.exports;
    if (ex && ex.length) {
      var a = ex[ex.length - 1], b = ex.length > 1 ? ex[ex.length - 2] : null, ch = b && b[1] ? (a[1] - b[1]) / b[1] * 100 : null;
      out.push('<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(tx(MC.corkX)) + ' (' + esc(String(a[0])) + ')</span><span class="di-info-stat-value"><b>' + num(a[1], 1) + '</b> ' + esc(tx(MC.meur)) + (ch == null ? '' : ' · ' + pct(ch) + ' ' + esc(tx(MC.vsPrev))) + '</span></div>');
    }
    return out;
  }
  function mountCountry(el, lang, cc) {
    if (!el) return Promise.resolve(false);
    var dhP = cc === 'ES' ? fetch('data/dehesa.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }) : Promise.resolve(null);
    return Promise.all([loadAll(), dhP]).then(function (res) {
      var D = res[0], cork = corkRows(res[1]);
      var rows = [], ff = D.ff && D.ff.countries && D.ff.countries[cc] ? D.ff : null, tp = D.tp && D.tp.countries && D.tp.countries[cc] ? D.tp.countries[cc] : null;
      var fd = D.fd && D.fd.series ? D.fd.series.filter(function (x) { return x.country === cc; }) : [];
      if (ff) {
        var st = fireStats(ff, cc);
        if (st.ba != null) rows.push('<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(tx(MC.fire)) + ' ' + st.cy + ' (' + esc(tx(T.ytd)) + ')</span><span class="di-info-stat-value"><b>' + num(st.ba) + '</b> ha · ' + num(st.nf) + ' · ' + esc(tx(MC.vsPrev)) + ' ' + num(st.prev) + ' ha</span></div>');
      }
      if (tp) {
        var b = tp.series.filter(function (x) { return !x.region && x.bench; })[0] || tp.series.filter(function (x) { return !x.region; })[0] || tp.series[0];
        var li = lastIdx(b.values);
        if (li >= 0) { var c = yoy({ freq: tp.freq, values: b.values, periods: tp.periods });
          rows.push('<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(tx(MC.price)) + ': ' + esc(trl(b.label)) + ' (' + esc(tp.periods[li]) + ')</span><span class="di-info-stat-value"><b>' + num(b.values[li], dec(b.values[li], tp.unit)) + '</b> ' + esc(unit(tp.unit)) + (c == null ? '' : ' · ' + pct(c)) + '</span></div>'); }
      }
      fd.filter(function (x) { return x.freq === 'A'; }).slice(0, 2).forEach(function (x) {
        var li = lastIdx(x.values); if (li < 0) return;
        rows.push('<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(tx(MC.dmg)) + ': ' + esc(trl(x.label)) + ' (' + esc(x.periods[li]) + ')</span><span class="di-info-stat-value"><b>' + num(x.values[li], INT[x.unit] ? 0 : 1) + '</b> ' + esc(unit(x.unit)) + '</span></div>');
      });
      (D.we && D.we.series ? D.we.series.filter(function (x) { return x.id.slice(0, 2) === cc.toLowerCase() && /price/.test(x.id); }) : []).forEach(function (x) {
        var li = lastIdx(x.values); if (li < 0) return; var c2 = yoy(x);
        rows.push('<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(tx(MC.en)) + ': ' + esc(trl(x.label)) + ' (' + esc(x.periods[li]) + ')</span><span class="di-info-stat-value"><b>' + num(x.values[li], dec(x.values[li], x.unit)) + '</b> ' + esc(unit(x.unit)) + (c2 == null ? '' : ' · ' + pct(c2)) + '</span></div>');
      });
      rows = rows.concat(cork);
      if (!rows.length) { el.innerHTML = ''; return false; }
      var tab = ff ? 'fires' : tp ? 'prices' : 'damage';
      el.innerHTML = '<section class="di-card di-info-card wp-card gb-card" id="ps-forest" style="max-width:none"><h2 class="ps-rm-h">' + esc(tx(MC.h)) + '</h2><div class="di-info-stat-list">' + rows.join('') + '</div>' +
        '<p style="margin:10px 0 0"><a href="bosque.html?c=' + encodeURIComponent(cc) + '">' + esc(tx(MC.more)) + '</a>' + (cork.length ? ' · <a href="dehesa.html#dh-cork">' + esc(tx(MC.corkMore)) + '</a>' : '') + '</p></section>';
      return true;
    });
  }
  global.DIForest = { mountCountry: mountCountry };
  if (document.getElementById('bq-body')) {
    if (S.init) S.init('production');
    try { var qs = new URLSearchParams(global.location.search), qc = (qs.get('c') || '').toUpperCase(); if (/^[A-Z]{2}$/.test(qc)) CUR = qc; } catch (e) {}
    S.onLangChange = function () { page(); };
    document.getElementById('bq-body').innerHTML = '<p class="di-movers-hint">' + esc(tx(T.loading)) + '</p>';
    bind();
    Promise.all([getV('index'), getJ('worldbank-timber')]).then(function (r) {
      IDX = r[0]; WB = r[1];
      if (!IDX || !IDX.countries) { document.getElementById('bq-body').innerHTML = '<p class="di-movers-hint">' + esc(tx(T.fail)) + '</p>'; return; }
      if (!IDX.countries.some(function (x) { return x.cc === CUR; })) CUR = 'ES';
      page();
    });
  }
})(window);
