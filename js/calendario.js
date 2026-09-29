/* Dehesa Index — Calendario agrícola */
(function () {
  'use strict';

  var MONTHS = {
    es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
  };
  function fmtDate(iso, lg) {
    var parts = iso.split('-');
    var year = parts[0], month = parseInt(parts[1], 10), day = parseInt(parts[2], 10);
    var m = (MONTHS[lg] || MONTHS.es)[month - 1];
    if (lg === 'en') return m + ' ' + day + ', ' + year;
    return day + ' ' + m + ' ' + year;
  }

  // CALENDAR_EVENTS — una fila por informe RECURRENTE (no una por futura
  // ocurrencia). nextDate/lastDate son siempre fechas reales del calendario
  // oficial de cada organismo; cuando no se anuncia día fijo (los 2 de la
  // UE), hasDate queda en false y no se inventa una fecha para rellenar.
  var WATCH_PRIORITY = {
    publication: 2,
    harvest: 1
  };
  function isoDaysFromToday(iso) {
    if (!iso) return null;
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var parts = iso.split('-');
    var d = new Date(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10));
    return Math.round((d - today) / 86400000);
  }
  function priorityFor(ev) {
    var days = isoDaysFromToday(ev.nextDate);
    if (days === null) return 'watch';
    if (days <= 0) return 'today';
    if (days <= 3) return 'high';
    if (days <= 7) return 'watch';
    return 'later';
  }
  function productLink(product) {
    var map = { trigo:'trigo', maiz:'maiz', leche:'leche', fertilizantes:'urea', diesel:'diesel', arroz:'arroz' };
    return map[product] ? 'precios/' + map[product] + '/' : 'precios.html?product=' + product;
  }

  var CALENDAR_EVENTS = [
    {
      id: 'us-agricultural-prices', market: 'us', freq: 'monthly', type: 'publication', crops: ['trigo','maiz','leche'], impact: 'precios',
      hasDate: true, nextDate: '2026-09-29', isToday: true, lastDate: '2026-08-28',
      sourceUrl: 'https://www.nass.usda.gov/Publications/Calendar/reports_by_date.php',
      es: { name: 'USDA Agricultural Prices', desc: 'Precios recibidos y pagados por agricultores; útil para seguir márgenes, precios agrícolas e insumos.' },
      en: { name: 'USDA Agricultural Prices', desc: 'Prices received and paid by farmers; useful for tracking farm prices, margins and input costs.' },
      fr: { name: 'USDA Agricultural Prices', desc: 'Prix reçus et payés par les agriculteurs, utiles pour suivre les prix agricoles, les marges et les coûts des intrants.' },
      it: { name: 'USDA Agricultural Prices', desc: 'Prezzi ricevuti e pagati dagli agricoltori, utili per seguire prezzi agricoli, margini e costi degli input.' }
    },
    {
      id: 'eurostat-agri-prices', market: 'eu', freq: 'quarterly', type: 'publication', crops: ['trigo','maiz','leche','fertilizantes','diesel'], impact: 'precios',
      hasDate: false, nextDate: null, isToday: false, lastDate: '2026-09-10',
      sourceUrl: 'https://ec.europa.eu/eurostat/web/agriculture/information-data/agricultural-prices',
      es: { name: 'Eurostat — Precios agrícolas', desc: 'Índices de precios de productos agrícolas e insumos como energía y fertilizantes; sirve para medir presión sobre ingresos y costes.' },
      en: { name: 'Eurostat — Agricultural prices', desc: 'Price indices for agricultural output and inputs such as energy and fertilisers; useful for tracking revenue and cost pressure.' },
      fr: { name: 'Eurostat — Prix agricoles', desc: 'Indices des prix agricoles et des intrants comme l’énergie et les engrais, utiles pour suivre la pression sur les revenus et les coûts.' },
      it: { name: 'Eurostat — Prezzi agricoli', desc: 'Indici dei prezzi agricoli e degli input come energia e fertilizzanti, utili per seguire pressione su ricavi e costi.' }
    },
    {
      id: 'eurostat-crop-production', market: 'eu', freq: 'annual', type: 'harvest', crops: ['trigo','maiz','cebada','arroz'], impact: 'cosecha',
      hasDate: false, nextDate: null, isToday: false, lastDate: null,
      sourceUrl: 'https://ec.europa.eu/eurostat/web/agriculture/information-data/crop-production',
      es: { name: 'Eurostat — Producción de cultivos', desc: 'Datos anuales de superficie cosechada, producción y rendimiento. Las entregas de datos de cultivos se realizan en varias rondas y las finales llegan después.' },
      en: { name: 'Eurostat — Crop production', desc: 'Annual data on harvested area, production and yields. Crop data arrive in several rounds, with final deliveries later.' },
      fr: { name: 'Eurostat — Production végétale', desc: 'Données annuelles sur les surfaces récoltées, la production et les rendements, transmises en plusieurs vagues.' },
      it: { name: 'Eurostat — Produzione agricola', desc: 'Dati annuali su superfici raccolte, produzione e rese, trasmessi in più tornate.' }
    },
    {
      id: 'crop-progress', market: 'us', freq: 'weekly', type: 'publication', crops: ['trigo','maiz','arroz','soja'], impact: 'oferta',
      hasDate: true, nextDate: '2026-09-28', isToday: true, lastDate: '2026-09-21',
      sourceUrl: 'https://www.nass.usda.gov/Publications/National_Crop_Progress/',
      es: { name: 'USDA Crop Progress', desc: 'Porcentaje de siembra, desarrollo y cosecha de los principales cultivos de EE. UU., estado por estado.' },
      en: { name: 'USDA Crop Progress', desc: 'Weekly percentage of planting, crop development and harvest progress for major U.S. crops, state by state.' },
      fr: { name: 'USDA Crop Progress', desc: "Pourcentage hebdomadaire des semis, du développement et de la récolte des principales cultures américaines, État par État." },
      it: { name: 'USDA Crop Progress', desc: 'Percentuale settimanale di semina, sviluppo e raccolta delle principali colture statunitensi, Stato per Stato.' }
    },
    {
      id: 'grain-stocks', market: 'us', freq: 'quarterly', type: 'publication', crops: ['trigo','maiz','soja'], impact: 'stocks',
      hasDate: true, nextDate: '2026-09-30', isToday: false, lastDate: '2026-06-30',
      sourceUrl: 'https://www.nass.usda.gov/Surveys/Guide_to_NASS_Surveys/Off-Farm_Grain_Stocks/index.php',
      es: { name: 'USDA Grain Stocks', desc: 'Existencias trimestrales de maíz, trigo y soja almacenadas en EE. UU., dentro y fuera de las explotaciones.' },
      en: { name: 'USDA Grain Stocks', desc: 'Quarterly U.S. corn, wheat and soybean stocks held on and off farms.' },
      fr: { name: 'USDA Grain Stocks', desc: "Stocks trimestriels de maïs, de blé et de soja détenus aux États-Unis, à la ferme et hors ferme." },
      it: { name: 'USDA Grain Stocks', desc: 'Scorte trimestrali di mais, frumento e soia detenute negli Stati Uniti, nelle aziende agricole e fuori.' }
    },
    {
      id: 'export-sales', market: 'us', freq: 'weekly', type: 'publication', crops: ['trigo','maiz','soja'], impact: 'comercio',
      hasDate: true, nextDate: '2026-10-01', isToday: false, lastDate: '2026-09-24',
      sourceUrl: 'https://www.fas.usda.gov/programs/export-sales-reporting-program/about-export-sales-reporting-program',
      es: { name: 'USDA Export Sales', desc: 'Ventas semanales de exportación de cereales, oleaginosas y otros productos agrícolas de EE. UU., por país comprador.' },
      en: { name: 'USDA Export Sales', desc: 'Weekly U.S. export sales of grains, oilseeds and other farm products, by buying country.' },
      fr: { name: 'USDA Export Sales', desc: "Ventes hebdomadaires à l'exportation de céréales, d'oléagineux et d'autres produits agricoles américains, par pays acheteur." },
      it: { name: 'USDA Export Sales', desc: 'Vendite settimanali di cereali, semi oleosi e altri prodotti agricoli statunitensi verso l’estero, per paese acquirente.' }
    },
    {
      id: 'wasde', market: 'us', freq: 'monthly', type: 'publication', crops: ['trigo','maiz','soja'], impact: 'oferta-demanda',
      hasDate: true, nextDate: '2026-10-09', isToday: false, lastDate: '2026-09-11',
      sourceUrl: 'https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report',
      es: { name: 'USDA WASDE', desc: 'El informe mensual más seguido del mercado agrícola: producción, oferta, demanda y existencias finales de los principales cultivos, en EE. UU. y en el mundo.' },
      en: { name: 'USDA WASDE', desc: 'The most closely watched monthly agricultural report: production, supply, demand and ending-stocks estimates for major crops, in the U.S. and worldwide.' },
      fr: { name: 'USDA WASDE', desc: "Le rapport agricole mensuel le plus suivi : production, offre, demande et stocks finaux des principales cultures, aux États-Unis et dans le monde." },
      it: { name: 'USDA WASDE', desc: 'Il rapporto agricolo mensile più seguito: produzione, offerta, domanda e scorte finali delle principali colture, negli Stati Uniti e nel mondo.' }
    },
    {
      id: 'eu-cereals', market: 'eu', freq: 'weekly', type: 'publication', crops: ['trigo','maiz','cebada'], impact: 'precios',
      hasDate: false, nextDate: null, isToday: false, lastDate: null,
      sourceUrl: 'https://agridata.ec.europa.eu/extensions/DashboardCereals/ExtCerealsPrice.html',
      es: { name: 'Precios semanales de cereales — Comisión Europea', desc: 'Cotizaciones nacionales semanales de trigo, maíz y otros cereales en los países de la UE, publicadas en el Agri-food Data Portal.' },
      en: { name: 'EU weekly cereal prices — European Commission', desc: 'Weekly national quotations for wheat, maize and other cereals across EU countries, published on the Agri-food Data Portal.' },
      fr: { name: 'Prix hebdomadaires des céréales — Commission européenne', desc: "Cotations nationales hebdomadaires du blé, du maïs et d'autres céréales dans les pays de l'UE, publiées sur l'Agri-food Data Portal." },
      it: { name: 'Prezzi settimanali dei cereali — Commissione europea', desc: "Quotazioni nazionali settimanali di grano, mais e altri cereali nei paesi dell'UE, pubblicate sull'Agri-food Data Portal." }
    },
    {
      id: 'eu-mmo', market: 'eu', freq: 'quarterly', type: 'publication', crops: ['leche'], impact: 'lacteos',
      hasDate: false, nextDate: null, isToday: false, lastDate: null,
      sourceUrl: 'https://agriculture.ec.europa.eu/data-and-analysis/markets/overviews/market-observatories/milk/mmo-meeting-reports_en',
      es: { name: 'Milk Market Observatory — Comisión Europea', desc: 'Reunión trimestral de expertos que revisa precios y producción de leche y lácteos en la UE, con patrón habitual en marzo/abril, junio/julio, septiembre y diciembre.' },
      en: { name: 'Milk Market Observatory — European Commission', desc: 'Quarterly expert-group meeting reviewing EU milk and dairy prices and production, typically held in March/April, June/July, September and December.' },
      fr: { name: 'Milk Market Observatory — Commission européenne', desc: "Réunion trimestrielle du groupe d'experts sur les prix et la production de lait et de produits laitiers dans l'UE, généralement en mars/avril, juin/juillet, septembre et décembre." },
      it: { name: 'Milk Market Observatory — Commissione europea', desc: "Riunione trimestrale del gruppo di esperti sui prezzi e sulla produzione di latte e lattiero-caseari nell'UE, generalmente tra marzo/aprile, giugno/luglio, settembre e dicembre." }
    }
  ];

  var UPDATED_ISO = '2026-09-29';

  var STRINGS = {
    es: {
      title: 'Dehesa Index — Calendario agrícola', h1: 'Calendario agrícola',
      sub: 'Las próximas publicaciones de datos oficiales que mueven los mercados agrícolas de EE. UU. y Europa — para saber qué esperar antes de que salga el dato, como un calendario económico pero para el campo.',
      badge: 'FECHAS OFICIALES', updatedLabel: 'Actualizado',
      disclaimer: 'Las fechas de EE. UU. (USDA) siguen el calendario oficial que publica cada organismo — exacto para WASDE y Grain Stocks, y calculado a partir de su patrón habitual (lunes / jueves) para los semanales. Los informes de la Comisión Europea se publican con periodicidad conocida (semanal o trimestral) pero sin un día fijo anunciado con antelación, así que se muestran sin fecha exacta. A diferencia de un calendario económico financiero, aquí no hay columna de "consenso de mercado": ningún organismo publica gratis una previsión de consenso para estos informes agrícolas, así que no se inventa una.',
      filterAll: 'Todos', filterUs: 'EE. UU.', filterEu: 'Europa',
      freqWeekly: 'Semanal', freqMonthly: 'Mensual', freqQuarterly: 'Trimestral', freqAnnual: 'Anual', filterType: 'Tipo', filterCrop: 'Cultivo', filterImpact: 'Impacto', allCrops: 'Todos los cultivos', allTypes: 'Todos los eventos', allImpacts: 'Todos los impactos', typePublication: 'Publicación', typeHarvest: 'Cosecha / producción', impactLabels: {oferta:'Oferta',stocks:'Stocks',comercio:'Comercio', 'oferta-demanda':'Oferta / demanda',precios:'Precios',lacteos:'Lácteos',cosecha:'Cosecha'}, harvestStatus:'Ventana de cosecha / producción', relevance:'Por qué importa:',
      marketUs: '🇺🇸 EE. UU.', marketEu: '🇪🇺 Europa', todayTag: 'Hoy',
      lastLabelText: 'Última publicación:',
      noExactDateNote: 'Periodicidad conocida; fecha exacta de la próxima publicación aún no anunciada.',
      sourceLinkLabel: 'Ver fuente oficial',
      noResultsHint: 'No hay informes en esta categoría por ahora. Prueba con otro filtro.',
      sourcesTitle: 'Fuentes',
      sources: [
        { text: 'USDA — WASDE (Office of the Chief Economist)', url: 'https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report' },
        { text: 'USDA NASS — Crop Progress', url: 'https://www.nass.usda.gov/Publications/National_Crop_Progress/' },
        { text: 'USDA NASS — Grain Stocks', url: 'https://www.nass.usda.gov/Surveys/Guide_to_NASS_Surveys/Off-Farm_Grain_Stocks/index.php' },
        { text: 'USDA FAS — Export Sales Reporting Program', url: 'https://www.fas.usda.gov/programs/export-sales-reporting-program/about-export-sales-reporting-program' },
        { text: 'Comisión Europea — Agri-food Data Portal (cereales)', url: 'https://agridata.ec.europa.eu/extensions/DashboardCereals/ExtCerealsPrice.html' },
        { text: 'Comisión Europea — Milk Market Observatory', url: 'https://agriculture.ec.europa.eu/data-and-analysis/markets/overviews/market-observatories/milk/mmo-meeting-reports_en' }
      ]
    },
    en: {
      title: 'Dehesa Index — Agricultural Calendar', h1: 'Agricultural Calendar',
      sub: "Upcoming official data releases that move U.S. and European agricultural markets — know what's coming before the number lands, like an economic calendar for farming.",
      badge: 'OFFICIAL DATES', updatedLabel: 'Updated',
      disclaimer: "U.S. (USDA) dates follow each agency's own published schedule — exact for WASDE and Grain Stocks, and computed from their usual weekday pattern (Monday / Thursday) for the weekly ones. European Commission reports have a known cadence (weekly or quarterly) but no fixed day announced in advance, so they're shown without an exact date. Unlike a financial economic calendar, there's no \"market consensus\" column here: no agency publishes a free consensus forecast for these agricultural reports, so we don't invent one.",
      filterAll: 'All', filterUs: 'U.S.', filterEu: 'Europe',
      freqWeekly: 'Weekly', freqMonthly: 'Monthly', freqQuarterly: 'Quarterly', freqAnnual: 'Annual', filterType: 'Type', filterCrop: 'Crop', filterImpact: 'Impact', allCrops: 'All crops', allTypes: 'All events', allImpacts: 'All impacts', typePublication: 'Publication', typeHarvest: 'Harvest / production', impactLabels: {oferta:'Supply',stocks:'Stocks',comercio:'Trade','oferta-demanda':'Supply / demand',precios:'Prices',lacteos:'Dairy',cosecha:'Harvest'}, harvestStatus:'Harvest / production window', relevance:'Why it matters:',
      marketUs: '🇺🇸 U.S.', marketEu: '🇪🇺 Europe', todayTag: 'Today',
      lastLabelText: 'Last release:',
      noExactDateNote: 'Known cadence; exact date of the next release not yet announced.',
      sourceLinkLabel: 'View official source',
      noResultsHint: 'No reports in this category right now. Try another filter.',
      sourcesTitle: 'Sources',
      sources: [
        { text: 'USDA — WASDE (Office of the Chief Economist)', url: 'https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report' },
        { text: 'USDA NASS — Crop Progress', url: 'https://www.nass.usda.gov/Publications/National_Crop_Progress/' },
        { text: 'USDA NASS — Grain Stocks', url: 'https://www.nass.usda.gov/Surveys/Guide_to_NASS_Surveys/Off-Farm_Grain_Stocks/index.php' },
        { text: 'USDA FAS — Export Sales Reporting Program', url: 'https://www.fas.usda.gov/programs/export-sales-reporting-program/about-export-sales-reporting-program' },
        { text: 'European Commission — Agri-food Data Portal (cereals)', url: 'https://agridata.ec.europa.eu/extensions/DashboardCereals/ExtCerealsPrice.html' },
        { text: 'European Commission — Milk Market Observatory', url: 'https://agriculture.ec.europa.eu/data-and-analysis/markets/overviews/market-observatories/milk/mmo-meeting-reports_en' }
      ]
    },
    fr: {
      title: 'Dehesa Index — Calendrier agricole', h1: 'Calendrier agricole',
      sub: "Les prochaines publications de données officielles qui font bouger les marchés agricoles américains et européens — pour savoir à quoi s'attendre avant la sortie du chiffre, comme un calendrier économique mais pour le monde agricole.",
      badge: 'DATES OFFICIELLES', updatedLabel: 'Mis à jour',
      disclaimer: "Les dates américaines (USDA) suivent le calendrier officiel publié par chaque agence — exact pour le WASDE et le Grain Stocks, et calculé à partir de leur jour habituel (lundi / jeudi) pour les rapports hebdomadaires. Les rapports de la Commission européenne ont une périodicité connue (hebdomadaire ou trimestrielle) mais sans jour fixe annoncé à l'avance, ils sont donc affichés sans date exacte. Contrairement à un calendrier économique financier, il n'y a pas ici de colonne « consensus de marché » : aucune agence ne publie gratuitement une prévision de consensus pour ces rapports agricoles, nous n'en inventons donc pas.",
      filterAll: 'Tous', filterUs: 'É.-U.', filterEu: 'Europe',
      freqWeekly: 'Hebdomadaire', freqMonthly: 'Mensuel', freqQuarterly: 'Trimestriel', freqAnnual: 'Annuel', filterType: 'Type', filterCrop: 'Culture', filterImpact: 'Impact', allCrops: 'Toutes les cultures', allTypes: 'Tous les événements', allImpacts: 'Tous les impacts', typePublication: 'Publication', typeHarvest: 'Récolte / production', impactLabels: {oferta:'Offre',stocks:'Stocks',comercio:'Commerce','oferta-demanda':'Offre / demande',precios:'Prix',lacteos:'Lait',cosecha:'Récolte'}, harvestStatus:'Fenêtre de récolte / production', relevance:'Pourquoi c’est important :',
      marketUs: '🇺🇸 É.-U.', marketEu: '🇪🇺 Europe', todayTag: "Aujourd'hui",
      lastLabelText: 'Dernière publication :',
      noExactDateNote: "Périodicité connue ; date exacte de la prochaine publication pas encore annoncée.",
      sourceLinkLabel: 'Voir la source officielle',
      noResultsHint: "Aucun rapport dans cette catégorie pour l'instant. Essayez un autre filtre.",
      sourcesTitle: 'Sources',
      sources: [
        { text: 'USDA — WASDE (Office of the Chief Economist)', url: 'https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report' },
        { text: 'USDA NASS — Crop Progress', url: 'https://www.nass.usda.gov/Publications/National_Crop_Progress/' },
        { text: 'USDA NASS — Grain Stocks', url: 'https://www.nass.usda.gov/Surveys/Guide_to_NASS_Surveys/Off-Farm_Grain_Stocks/index.php' },
        { text: 'USDA FAS — Export Sales Reporting Program', url: 'https://www.fas.usda.gov/programs/export-sales-reporting-program/about-export-sales-reporting-program' },
        { text: 'Commission européenne — Agri-food Data Portal (céréales)', url: 'https://agridata.ec.europa.eu/extensions/DashboardCereals/ExtCerealsPrice.html' },
        { text: 'Commission européenne — Milk Market Observatory', url: 'https://agriculture.ec.europa.eu/data-and-analysis/markets/overviews/market-observatories/milk/mmo-meeting-reports_en' }
      ]
    },
    it: {
      title: 'Dehesa Index — Calendario agricolo', h1: 'Calendario agricolo',
      sub: 'Le prossime pubblicazioni di dati ufficiali che muovono i mercati agricoli di Stati Uniti ed Europa — per sapere cosa aspettarsi prima che esca il dato, come un calendario economico ma per il mondo agricolo.',
      badge: 'DATE UFFICIALI', updatedLabel: 'Aggiornato',
      disclaimer: "Le date statunitensi (USDA) seguono il calendario ufficiale pubblicato da ciascuna agenzia — esatto per il WASDE e il Grain Stocks, e calcolato in base al giorno abituale (lunedì / giovedì) per quelli settimanali. I rapporti della Commissione europea hanno una periodicità nota (settimanale o trimestrale) ma senza un giorno fisso annunciato in anticipo, quindi vengono mostrati senza data esatta. A differenza di un calendario economico finanziario, qui non c'è una colonna \"consenso di mercato\": nessuna agenzia pubblica gratuitamente una previsione di consenso per questi rapporti agricoli, quindi non ne inventiamo una.",
      filterAll: 'Tutti', filterUs: 'USA', filterEu: 'Europa',
      freqWeekly: 'Settimanale', freqMonthly: 'Mensile', freqQuarterly: 'Trimestrale', freqAnnual: 'Annuale', filterType: 'Tipo', filterCrop: 'Coltura', filterImpact: 'Impatto', allCrops: 'Tutte le colture', allTypes: 'Tutti gli eventi', allImpacts: 'Tutti gli impatti', typePublication: 'Pubblicazione', typeHarvest: 'Raccolta / produzione', impactLabels: {oferta:'Offerta',stocks:'Scorte',comercio:'Commercio','oferta-demanda':'Offerta / domanda',precios:'Prezzi',lacteos:'Lattiero-caseario',cosecha:'Raccolta'}, harvestStatus:'Finestra di raccolta / produzione', relevance:'Perché conta:',
      marketUs: '🇺🇸 USA', marketEu: '🇪🇺 Europa', todayTag: 'Oggi',
      lastLabelText: 'Ultima pubblicazione:',
      noExactDateNote: 'Periodicità nota; data esatta della prossima pubblicazione non ancora annunciata.',
      sourceLinkLabel: 'Vedi la fonte ufficiale',
      noResultsHint: 'Nessun rapporto in questa categoria al momento. Prova un altro filtro.',
      sourcesTitle: 'Fonti',
      sources: [
        { text: 'USDA — WASDE (Office of the Chief Economist)', url: 'https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report' },
        { text: 'USDA NASS — Crop Progress', url: 'https://www.nass.usda.gov/Publications/National_Crop_Progress/' },
        { text: 'USDA NASS — Grain Stocks', url: 'https://www.nass.usda.gov/Surveys/Guide_to_NASS_Surveys/Off-Farm_Grain_Stocks/index.php' },
        { text: 'USDA FAS — Export Sales Reporting Program', url: 'https://www.fas.usda.gov/programs/export-sales-reporting-program/about-export-sales-reporting-program' },
        { text: 'Commissione europea — Agri-food Data Portal (cereali)', url: 'https://agridata.ec.europa.eu/extensions/DashboardCereals/ExtCerealsPrice.html' },
        { text: 'Commissione europea — Milk Market Observatory', url: 'https://agriculture.ec.europa.eu/data-and-analysis/markets/overviews/market-observatories/milk/mmo-meeting-reports_en' }
      ]
    }
  };

  var params = new URLSearchParams(window.location.search);
  var state = { filter: params.get('region') || 'all', crop: params.get('crop') || 'all', type: params.get('type') || 'all', impact: params.get('impact') || 'all' };
  function syncUrl() {
    var p = [];
    if (state.filter !== 'all') p.push('region=' + encodeURIComponent(state.filter));
    if (state.crop !== 'all') p.push('crop=' + encodeURIComponent(state.crop));
    if (state.type !== 'all') p.push('type=' + encodeURIComponent(state.type));
    if (state.impact !== 'all') p.push('impact=' + encodeURIComponent(state.impact));
    var next = window.location.pathname + (p.length ? '?' + p.join('&') : '');
    if (window.history && window.history.replaceState) window.history.replaceState(null, '', next);
  }

  function render() {
    var lang = window.DehesaShared.getLang();
    var esc = window.DehesaShared.esc;
    var t = STRINGS[lang] || STRINGS.es;
    var FREQ_LABEL = { weekly: t.freqWeekly, monthly: t.freqMonthly, quarterly: t.freqQuarterly, annual: t.freqAnnual };

    document.title = t.title;
    document.getElementById('cal-badge').textContent = t.badge;
    document.getElementById('cal-updated').textContent = t.updatedLabel + ': ' + fmtDate(UPDATED_ISO, lang);
    document.getElementById('cal-h1').textContent = t.h1;
    document.getElementById('cal-sub').textContent = t.sub;
    document.getElementById('cal-disclaimer').textContent = t.disclaimer;

    var FILTER_OPTIONS = [
      { id: 'all', label: t.filterAll },
      { id: 'us', label: t.filterUs },
      { id: 'eu', label: t.filterEu }
    ];
    var cropLabels = {trigo:'Trigo',maiz:'Maíz',arroz:'Arroz',cebada:'Cebada',soja:'Soja',leche:'Leche',fertilizantes:'Fertilizantes',diesel:'Diésel'};
    var filtersHtml = '<div class="di-cal-filter-row"><div class="di-cal-filter-label">' + esc(t.filterType) + '</div><select data-cal-filter="type"><option value="all">' + esc(t.allTypes) + '</option><option value="publication">' + esc(t.typePublication) + '</option><option value="harvest">' + esc(t.typeHarvest) + '</option></select>' +
      '<div class="di-cal-filter-label">' + esc(t.filterCrop) + '</div><select data-cal-filter="crop"><option value="all">' + esc(t.allCrops) + '</option>' + Object.keys(cropLabels).map(function(k){return '<option value="'+k+'">'+esc(cropLabels[k])+'</option>';}).join('') + '</select>' +
      '<div class="di-cal-filter-label">' + esc(t.filterImpact) + '</div><select data-cal-filter="impact"><option value="all">' + esc(t.allImpacts) + '</option>' + Object.keys(t.impactLabels).map(function(k){return '<option value="'+k+'">'+esc(t.impactLabels[k])+'</option>';}).join('') + '</select></div>';
    document.getElementById('cal-filters').innerHTML =
      FILTER_OPTIONS.map(function (opt) { var active = state.filter === opt.id ? ' active' : ''; return '<button type="button" class="di-location-btn di-news-filter-btn' + active + '" data-filter="' + opt.id + '">' + esc(opt.label) + '</button>'; }).join('') + filtersHtml;
    Array.prototype.forEach.call(document.querySelectorAll('#cal-filters button'), function (btn) { btn.addEventListener('click', function () { state.filter = btn.getAttribute('data-filter'); syncUrl(); render(); }); });
    Array.prototype.forEach.call(document.querySelectorAll('#cal-filters select'), function (sel) { sel.value = state[sel.getAttribute('data-cal-filter')]; sel.addEventListener('change', function(){ state[sel.getAttribute('data-cal-filter')] = sel.value; syncUrl(); render(); }); });

    var filteredEvents = CALENDAR_EVENTS.filter(function (ev) {
      return (state.filter === 'all' || ev.market === state.filter) &&
        (state.type === 'all' || ev.type === state.type) &&
        (state.crop === 'all' || (ev.crops || []).indexOf(state.crop) >= 0) &&
        (state.impact === 'all' || ev.impact === state.impact);
    });
    var watchEvents = filteredEvents.filter(function(ev){ var d=isoDaysFromToday(ev.nextDate); return ev.hasDate && d !== null && d <= 7 && d >= -1; }).sort(function(a,b){ return isoDaysFromToday(a.nextDate) - isoDaysFromToday(b.nextDate); });
    var watchRoot = document.getElementById('cal-watch');
    if (watchRoot) {
      var watchTitle = lang === 'es' ? 'Qué vigilar esta semana' : lang === 'fr' ? 'À surveiller cette semaine' : lang === 'it' ? 'Cosa monitorare questa settimana' : 'What to watch this week';
      var watchSub = lang === 'es' ? 'Publicaciones y ventanas con impacto potencial en los mercados enlazados.' : lang === 'fr' ? 'Publications et fenêtres susceptibles d’affecter les marchés liés.' : lang === 'it' ? 'Pubblicazioni e finestre con potenziale impatto sui mercati collegati.' : 'Publications and windows with potential impact on linked markets.';
      var priorityLabels = {today:{es:'HOY',en:'TODAY',fr:'AUJOURD’HUI',it:'OGGI'},high:{es:'PRIORIDAD',en:'PRIORITY',fr:'PRIORITÉ',it:'PRIORITÀ'},watch:{es:'VIGILAR',en:'WATCH',fr:'SURVEILLER',it:'MONITORARE'}};
      watchRoot.innerHTML = '<section class="di-cal-watch"><div class="di-cal-watch-head"><div><span class="di-section-kicker">DEHESA WATCH</span><h2>' + esc(watchTitle) + '</h2><p>' + esc(watchSub) + '</p></div><span class="di-cal-watch-count">' + watchEvents.length + '</span></div>' +
        (watchEvents.length ? '<div class="di-cal-watch-grid">' + watchEvents.map(function(ev){
          var pr=priorityFor(ev), tr=ev[lang]||ev.es;
          var map={trigo:'trigo',maiz:'maiz',leche:'leche',fertilizantes:'urea',diesel:'diesel',arroz:'arroz'};
          var pLinks=(ev.crops||[]).slice(0,4).map(function(p){return '<a href="' + (map[p] ? 'precios/'+map[p]+'/' : 'precios.html') + '">' + esc(p) + '</a>';}).join('');
          var newsLinks=(ev.crops||[]).slice(0,2).map(function(p){return '<a href="noticias.html?product=' + encodeURIComponent(p) + '&region=' + ev.market + '">News Intelligence</a>';}).join('');
          return '<article class="di-cal-watch-card priority-' + pr + '"><div class="di-cal-watch-top"><span class="di-cal-priority">' + esc(priorityLabels[pr][lang]) + '</span><span>' + esc(fmtDate(ev.nextDate,lang)) + '</span></div><h3>' + esc(tr.name) + '</h3><p>' + esc(tr.desc) + '</p><div class="di-cal-watch-crops">' + pLinks + '</div><div class="di-cal-watch-links">' + newsLinks + '</div></article>';
        }).join('') + '</div>' : '<div class="di-cal-watch-empty">' + esc(lang==='es'?'No hay publicaciones fechadas dentro de los próximos 7 días con los filtros actuales.':'No dated publications fall within the next 7 days under the current filters.') + '</div>') + '</section>';
    }

    var sortedEvents = filteredEvents.slice().sort(function (a, b) {
      if (a.hasDate && b.hasDate) return a.nextDate < b.nextDate ? -1 : (a.nextDate > b.nextDate ? 1 : 0);
      if (a.hasDate && !b.hasDate) return -1;
      if (!a.hasDate && b.hasDate) return 1;
      return 0;
    });

    var html;
    if (sortedEvents.length > 0) {
      html = '<div class="di-cal-list">' + sortedEvents.map(function (ev) {
        var tr = ev[lang] || ev.es;
        var marketLabel = ev.market === 'eu' ? t.marketEu : t.marketUs;
        var freqLabel = FREQ_LABEL[ev.freq] || ev.freq;
        var dateHtml = '';
        if (ev.hasDate) {
          var dateDisplay = ev.isToday ? (t.todayTag + ' · ' + fmtDate(ev.nextDate, lang)) : fmtDate(ev.nextDate, lang);
          dateHtml = '<span class="di-cal-date' + (ev.isToday ? ' today' : '') + '">' + esc(dateDisplay) + '</span>';
        }
        var lastHtml = ev.lastDate ? '<div class="di-cal-last">' + esc(t.lastLabelText) + ' ' + esc(fmtDate(ev.lastDate, lang)) + '</div>' : '';
        var noDateHtml = !ev.hasDate ? '<div class="di-cal-nodate">' + esc(t.noExactDateNote) + '</div>' : '';
        return '<div class="di-card di-cal-event">' +
          '<div class="di-cal-event-head">' +
            '<div class="di-cal-event-head-left"><span class="di-cal-market">' + esc(marketLabel) + '</span><span class="di-cal-freq">' + esc(freqLabel) + '</span></div>' +
            dateHtml +
          '</div>' +
          '<div class="di-cal-name">' + esc(tr.name) + '</div>' +
          '<div class="di-cal-tags"><span class="di-cal-tag">' + esc(ev.type === 'harvest' ? t.typeHarvest : t.typePublication) + '</span>' + (ev.crops || []).slice(0,4).map(function(c){ return '<span class="di-cal-tag crop">' + esc(c) + '</span>'; }).join('') + '<span class="di-cal-tag impact">' + esc((t.impactLabels || {})[ev.impact] || ev.impact) + '</span></div>' +
          '<p class="di-cal-desc">' + esc(tr.desc) + '</p>' +
          '<div class="di-cal-impact"><strong>' + esc(t.relevance) + '</strong> ' + esc((t.impactLabels || {})[ev.impact] || ev.impact) + '</div>' +
          lastHtml + noDateHtml +
          '<a class="di-cal-source-link" href="' + esc(ev.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(t.sourceLinkLabel) + ' →</a>' +
        '</div>';
      }).join('') + '</div>';
    } else {
      html = '<div class="di-news-empty">' + esc(t.noResultsHint) + '</div>';
    }
    document.getElementById('cal-events').innerHTML = html;

    document.getElementById('cal-sources-title').textContent = t.sourcesTitle;
    document.getElementById('cal-sources-list').innerHTML = t.sources.map(function (s) {
      return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.text) + '</a></li>';
    }).join('');
  }

  window.DehesaShared.init('calendario');
  window.DehesaShared.onLangChange = render;
  render();
})();
