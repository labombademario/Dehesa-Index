/* Dehesa Index — Ficha de producto (Commodity Page 2.0).
   Junta en una página lo que ya tenemos de un producto: precios (UE, EE. UU., Reino Unido), oferta y demanda (USDA PSD),
   ventas de exportación y comercio por país (USDA FAS), estado del cultivo o existencias de ganado (USDA NASS),
   sequía en los estados productores (U.S. Drought Monitor) y costes de producción (USDA ERS).
   Cada bloque solo aparece si hay dato; no rellena un mercado con datos de otro. */
(function () {
  'use strict';
  var P = window.DehesaPSD;
  var ST = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' };
  var CFG = {
    trigo: { eu: 'di_cereales_trigo_eu', us: 'di_trigo_us', uk: 'di_defra_wheat_output_index', euIdx: 'di_eurostat_cereals_output_index', psd: 'trigo', es: 107, gats: 'trigo', cp: ['wheat_winter', 'wheat_spring'], crop: { y: 'WHEAT - YIELD, MEASURED IN BU / ACRE', p: 'WHEAT - PRODUCTION, MEASURED IN BU', h: 'WHEAT - ACRES HARVESTED' }, ers: 'wheat', rend: 'wheat', kind: 'crop' },
    maiz: { eu: 'di_cereales_maiz_eu', us: 'di_maiz_us', euIdx: 'di_eurostat_cereals_output_index', psd: 'maiz', es: 401, gats: 'maiz', cp: ['corn'], crop: { y: 'CORN, GRAIN - YIELD, MEASURED IN BU / ACRE', p: 'CORN, GRAIN - PRODUCTION, MEASURED IN BU', h: 'CORN, GRAIN - ACRES HARVESTED' }, ers: 'corn', rend: 'corn', kind: 'crop' },
    vacuno: { eu: 'di_ganado_vaca_eu', us: 'di_vaca_us', uk: 'di_defra_cattle_output_index', psd: 'vacuno', es: 1701, gats: 'vacuno', inv: 'CATTLE, INCL CALVES - INVENTORY', live: ['CATTLE, INCL CALVES - INVENTORY', 'CATTLE, ON FEED - INVENTORY', 'BEEF, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB'], ers: 'cow-calf', kind: 'live', gan: 'vacuno' },
    cerdo: { eu: 'di_porcino_cerdo_eu', us: 'di_cerdo_us', uk: 'di_defra_pigs_output_index', psd: 'cerdo', es: 1702, gats: 'cerdo', inv: 'HOGS - INVENTORY', live: ['HOGS - INVENTORY', 'HOGS, BREEDING - INVENTORY', 'PORK, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB'], ers: 'hogs-all', kind: 'live', gan: 'cerdo' }
  };
  CFG.soja = { eu: 'di_pienso_harina_soja_eu', us: 'di_pienso_harina_soja_us', meal: true, psd: 'soja', es: 801, gats: 'soja', cp: ['soybeans'], crop: { y: 'SOYBEANS - YIELD, MEASURED IN BU / ACRE', p: 'SOYBEANS - PRODUCTION, MEASURED IN BU', h: 'SOYBEANS - ACRES HARVESTED', yu: 'bu', pu: 'bu' }, ers: 'soybeans', rend: 'soybeans', kind: 'crop', pp: 'harina_soja' };
  CFG.arroz = { eu: 'di_cereales_arroz_eu', us: 'di_arroz_us', psd: 'arroz', es: 1505, gats: 'arroz', cp: ['rice'], crop: { y: 'RICE - YIELD, MEASURED IN LB / ACRE', p: 'RICE - PRODUCTION, MEASURED IN CWT', h: 'RICE - ACRES HARVESTED', yu: 'lb', pu: 'cwt' }, ers: 'rice', rend: 'rice', kind: 'crop' };
  CFG.leche = { eu: 'di_leche_eu', us: 'di_leche_us', ukP: 'di_lacteos_leche_uk', euIdx: 'di_eurostat_milk_output_index', euIdxMilk: true, uk: 'di_defra_milk_output_index', psd: 'leche', gats: 'lacteos', inv: 'MILK - PRODUCTION, MEASURED IN LB', live: ['CATTLE, COWS, MILK - INVENTORY', 'MILK - PRODUCTION, MEASURED IN LB', 'BUTTER, COLD STORAGE - STOCKS, MEASURED IN LB', 'CHEESE, NATURAL, COLD STORAGE, CHILLED - STOCKS, MEASURED IN LB'], ers: 'milk', kind: 'live' };
  CFG.pollo = { eu: 'di_avicultura_pollo_eu', us: 'di_pollo_us', psd: 'pollo', gats: 'pollo', live: ['CHICKENS, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB', 'CHICKENS, BREASTS & BREAST MEAT, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB', 'CHICKENS, WINGS, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB'], kind: 'live' };
  CFG.cebada = { eu: 'di_cereales_cebada_eu', us: 'di_cebada_us', uk: 'di_defra_barley_output_index', euIdx: 'di_eurostat_cereals_output_index', psd: 'cebada', es: 301, gats: 'cebada', ers: 'barley', kind: 'other' };
  CFG.colza = { eu: 'di_cereales_colza_eu', us: 'di_colza_us', psd: 'colza', kind: 'other' };
  CFG.oliva = { eu: 'di_aceite_oliva_eu', psd: 'oliva', kind: 'other' };
  CFG.azucar = { eu: 'di_azucar_azucar_eu', psd: 'azucar', kind: 'other' };
  CFG.huevos = { eu: 'di_avicultura_huevos_eu', us: 'di_huevos_us', uk: 'di_defra_eggs_output_index', gats: 'huevos', kind: 'other' };
  var NMX = { es: { huevos: 'Huevos' }, en: { huevos: 'Eggs' }, fr: { huevos: 'Œufs' }, it: { huevos: 'Uova' } };
  function names() { var n = P.names(), x = NMX[lang()] || NMX.es, o = {}, k; for (k in n) o[k] = n[k]; for (k in x) o[k] = x[k]; return o; }
  CFG.trigo.crop.yu = CFG.trigo.crop.pu = CFG.maiz.crop.yu = CFG.maiz.crop.pu = 'bu';
  var ORDER = ['trigo', 'maiz', 'soja', 'arroz', 'cebada', 'colza', 'vacuno', 'cerdo', 'leche', 'pollo', 'huevos', 'oliva', 'azucar'];
  var T = {
    es: {
      title: 'Ficha de producto', sub: 'Todo lo que tenemos de un producto en una sola página: precio, oferta y demanda, comercio, cultivo o ganado, sequía y costes. Cada mercado muestra solo lo que sus datos permiten.',
      prices: 'Precios', pricesHint: 'Cada mercado con su propia fuente y unidad. No se convierten ni se suman entre sí.',
      eu: 'Europa', us: 'Estados Unidos', uk: 'Reino Unido', euIdx: 'Europa · índice de cereales (Eurostat)', ukIdx: 'Reino Unido · índice de precios de producción (Defra)',
      idxNote: 'Índice base 2020 = 100. Mide la evolución, no es un precio en moneda.', idxNoteEu: 'Índice base 2020 = 100 del conjunto de cereales, no solo de este producto. Mide la evolución, no es un precio en moneda.',
      directional: 'Referencia orientativa', notComp: 'No comparable con otros mercados', asOf: 'Dato de', vsPrev: 'frente al dato anterior', method: 'Cómo se mide',
      usTxt: { trigo: 'Precio recibido por el agricultor (USDA NASS), media nacional mensual, USD por bushel.', maiz: 'Precio recibido por el agricultor (USDA NASS), media nacional mensual, USD por bushel.', vacuno: 'Precio recibido por novillos y novillas de 500 lb o más, en peso vivo (USDA NASS), USD por cwt. No equivale al precio en canal europeo.', cerdo: 'Precio recibido por cerdos en peso vivo (USDA NASS), USD por cwt. No equivale al precio en canal europeo.' },
      sd: 'Oferta y demanda', sdHint: 'USDA (PSD), campaña más reciente (previsión que se revisa cada mes)', sdItem: 'Concepto', sdPrev: 'Anterior', sdChg: 'Var.', sdMy: 'Campaña', stu: 'Existencias / consumo', sdChart: 'Producción y consumo', sdEnt: 'Zona', sdMore: 'Ver el balance completo y el ranking de países',
      ex: 'Ventas de exportación de EE. UU.', exHint: 'USDA FAS, semana al', exAcc: 'Exportado en la campaña', exOut: 'Vendido pendiente de embarque', exCom: 'Total comprometido', exNet: 'Ventas netas de la semana', vsLY: 'frente al mismo momento del año pasado', exChart: 'Exportado acumulado en la campaña', exThis: 'Campaña actual', exLast: 'Campaña anterior', exWeek: 'Semana de campaña', exTop: 'Principales compradores', country: 'País', exMore: 'Ver todas las ventas de exportación', exMy: 'Campaña comercial',
      tr: 'Comercio de EE. UU. por país', trHint: 'USDA FAS GATS (datos del Census Bureau), valor en dólares corrientes', trEx: 'A quién vende EE. UU.', trIm: 'De quién compra EE. UU.', months: 'meses', to: 'a', trMore: 'Ver comercio por país y el mapa', value: 'Valor (USD)', share: 'Cuota',
      cr: 'Estado del cultivo en EE. UU.', crHint: 'USDA NASS, Crop Progress', ge: 'Buena + excelente', crWeek: 'Semana al', crOff: 'Fuera de temporada: la valoración se publica aproximadamente de abril a noviembre.', pp: 'pp', crStage: 'Avance', crMore: 'Ver el estado de los cultivos',
      stg: { planted: 'Sembrado', emerged: 'Nacido', silking: 'Espigado (sedas)', dough: 'Grano lechoso-pastoso', dented: 'Grano dentado', mature: 'Maduro', harvested: 'Cosechado', headed: 'Espigado' },
      crop: { wheat_winter: 'Trigo de invierno', wheat_spring: 'Trigo de primavera', corn: 'Maíz' },
      yl: 'Rendimiento y producción', yield: 'Rendimiento', prod: 'Producción', harv: 'Superficie cosechada', bu: 'bu/acre', mbu: 'millones de bu', acres: 'millones de acres', yrCur: 'previsión NASS del año en curso, se revisa cada mes', yMore: 'Ver rendimientos por estado',
      lv: 'Existencias de ganado', lvHint: 'USDA NASS', lvVs: 'frente al mismo periodo del año anterior', head: 'millones de cabezas', lb: 'millones de libras', lvMore: 'Ver ganadería y existencias en frío',
      lvN: { 'CATTLE, INCL CALVES - INVENTORY': 'Censo de vacuno (con terneros)', 'CATTLE, ON FEED - INVENTORY': 'Vacuno en cebo (censo)', 'BEEF, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB': 'Carne de vacuno congelada en cámaras', 'HOGS - INVENTORY': 'Censo de porcino', 'HOGS, BREEDING - INVENTORY': 'Porcino reproductor', 'PORK, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB': 'Carne de cerdo congelada en cámaras' },
      dr: 'Sequía en los estados productores', drHint: 'U.S. Drought Monitor, semana al', drTop: 'Los 5 mayores estados', drShare: 'Del total nacional', drNow: 'Sequía (D1+)', drYear: 'Vs año pasado', drW: 'Media ponderada por producción', drWNote: 'Cálculo de Dehesa: porcentaje de superficie del estado en sequía moderada o peor (D1+), ponderado por lo que produce cada estado entre los 5 mayores. Es porcentaje de la superficie del estado, no de la superficie cultivada ni un pronóstico de cosecha.', drMore: 'Ver el monitor de sequía', dPP: 'pp',
      inv: 'existencias', st: 'Estado',
      co: 'Costes de producción (EE. UU.)', coHint: 'USDA ERS, encuesta de costes y rentabilidad, total nacional, año', coGross: 'Valor bruto de la producción', coCost: 'Costes totales', coNet: 'Resultado neto', coOp: 'Costes operativos', coNote: 'Los costes totales incluyen partidas imputadas (coste de oportunidad de la tierra y del trabajo no remunerado), por eso el resultado neto suele ser más bajo que la caja real. Datos de años ya cerrados.', coMore: 'Ver costes de producción y punto de equilibrio',
      pl: { 'dollars per planted acre': 'USD por acre sembrado', 'dollars per hundredweight gain': 'USD por cwt de ganancia', 'dollars per cow': 'USD por vaca' },
      links: 'Sigue explorando', lMap: 'Mapa', lPrices: 'Panel de precios', noData: 'Sin datos de este producto por ahora.', pick: 'Producto',
      src: 'Fuentes: Comisión Europea, Eurostat, Defra, USDA (NASS, FAS, ERS, AMS) y U.S. Drought Monitor. Cada bloque enlaza a su página con la metodología completa. Más en', methodLink: 'Metodología', updated: 'Precios actualizados'
    },
    en: {
      title: 'Product page', sub: 'Everything we have on one product in a single page: price, supply and demand, trade, crop or livestock, drought and costs. Each market shows only what its own data allows.',
      prices: 'Prices', pricesHint: 'Each market with its own source and unit. They are not converted or added together.',
      eu: 'Europe', us: 'United States', uk: 'United Kingdom', euIdx: 'Europe · cereals index (Eurostat)', ukIdx: 'United Kingdom · producer price index (Defra)',
      idxNote: 'Index, 2020 = 100. It tracks the trend and is not a price in currency.', idxNoteEu: 'Index, 2020 = 100, for cereals as a group, not only this product. It tracks the trend and is not a price in currency.',
      directional: 'Indicative reference', notComp: 'Not comparable with other markets', asOf: 'As of', vsPrev: 'vs. previous reading', method: 'How it is measured',
      usTxt: { trigo: 'Price received by farmers (USDA NASS), monthly national average, USD per bushel.', maiz: 'Price received by farmers (USDA NASS), monthly national average, USD per bushel.', vacuno: 'Price received for steers and heifers of 500 lb or more, live weight (USDA NASS), USD per cwt. Not equivalent to the European carcass price.', cerdo: 'Price received for hogs, live weight (USDA NASS), USD per cwt. Not equivalent to the European carcass price.' },
      sd: 'Supply and demand', sdHint: 'USDA (PSD), latest marketing year (a forecast revised every month)', sdItem: 'Item', sdPrev: 'Previous', sdChg: 'Chg.', sdMy: 'Marketing year', stu: 'Stocks-to-use', sdChart: 'Production and consumption', sdEnt: 'Area', sdMore: 'See the full balance and country ranking',
      ex: 'U.S. export sales', exHint: 'USDA FAS, week ending', exAcc: 'Exported this marketing year', exOut: 'Sold, awaiting shipment', exCom: 'Total commitments', exNet: 'Net sales this week', vsLY: 'vs. same time last year', exChart: 'Cumulative exports in the marketing year', exThis: 'This year', exLast: 'Last year', exWeek: 'Marketing-year week', exTop: 'Main buyers', country: 'Country', exMore: 'See all export sales', exMy: 'Marketing year',
      tr: 'U.S. trade by country', trHint: 'USDA FAS GATS (Census Bureau data), current-dollar value', trEx: 'Who the U.S. sells to', trIm: 'Who the U.S. buys from', months: 'months', to: 'to', trMore: 'See trade by country and the map', value: 'Value (USD)', share: 'Share',
      cr: 'U.S. crop conditions', crHint: 'USDA NASS, Crop Progress', ge: 'Good + excellent', crWeek: 'Week ending', crOff: 'Off season: condition ratings are published roughly from April to November.', pp: 'pp', crStage: 'Progress', crMore: 'See crop conditions',
      stg: { planted: 'Planted', emerged: 'Emerged', silking: 'Silking', dough: 'Dough', dented: 'Dented', mature: 'Mature', harvested: 'Harvested', headed: 'Headed' },
      crop: { wheat_winter: 'Winter wheat', wheat_spring: 'Spring wheat', corn: 'Corn' },
      yl: 'Yield and production', yield: 'Yield', prod: 'Production', harv: 'Harvested area', bu: 'bu/acre', mbu: 'million bu', acres: 'million acres', yrCur: 'NASS forecast for the current year, revised every month', yMore: 'See yields by state',
      lv: 'Livestock inventories', lvHint: 'USDA NASS', lvVs: 'vs. same period a year earlier', head: 'million head', lb: 'million lb', lvMore: 'See livestock and cold storage',
      lvN: { 'CATTLE, INCL CALVES - INVENTORY': 'Cattle inventory (incl. calves)', 'CATTLE, ON FEED - INVENTORY': 'Cattle on feed (inventory)', 'BEEF, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB': 'Frozen beef in cold storage', 'HOGS - INVENTORY': 'Hog inventory', 'HOGS, BREEDING - INVENTORY': 'Breeding hogs', 'PORK, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB': 'Frozen pork in cold storage' },
      dr: 'Drought in the producing states', drHint: 'U.S. Drought Monitor, week of', drTop: 'Top 5 states', drShare: 'Of national total', drNow: 'Drought (D1+)', drYear: 'Vs last year', drW: 'Production-weighted average', drWNote: 'Dehesa calculation: share of each state’s area in moderate drought or worse (D1+), weighted by what each of the top 5 states produces. It is a share of the state’s area, not of the cropped area, and not a harvest forecast.', drMore: 'See the drought monitor', dPP: 'pp',
      inv: 'stocks', st: 'State',
      co: 'Cost of production (U.S.)', coHint: 'USDA ERS, costs and returns survey, national total, year', coGross: 'Gross value of production', coCost: 'Total costs', coNet: 'Net result', coOp: 'Operating costs', coNote: 'Total costs include imputed items (opportunity cost of land and unpaid labor), so the net result is usually lower than actual cash. Data for closed years.', coMore: 'See production costs and break-even',
      pl: { 'dollars per planted acre': 'USD per planted acre', 'dollars per hundredweight gain': 'USD per cwt of gain', 'dollars per cow': 'USD per cow' },
      links: 'Keep exploring', lMap: 'Map', lPrices: 'Price dashboard', noData: 'No data for this product yet.', pick: 'Product',
      src: 'Sources: European Commission, Eurostat, Defra, USDA (NASS, FAS, ERS, AMS) and the U.S. Drought Monitor. Each block links to its page with the full methodology. More in', methodLink: 'Methodology', updated: 'Prices updated'
    },
    fr: {
      title: 'Fiche produit', sub: 'Tout ce que nous avons sur un produit en une seule page : prix, offre et demande, commerce, culture ou élevage, sécheresse et coûts. Chaque marché montre seulement ce que ses données permettent.',
      prices: 'Prix', pricesHint: 'Chaque marché avec sa propre source et son unité. Ils ne sont ni convertis ni additionnés.',
      eu: 'Europe', us: 'États-Unis', uk: 'Royaume-Uni', euIdx: 'Europe · indice des céréales (Eurostat)', ukIdx: 'Royaume-Uni · indice des prix à la production (Defra)',
      idxNote: 'Indice base 2020 = 100. Il mesure l’évolution, ce n’est pas un prix en devise.', idxNoteEu: 'Indice base 2020 = 100 pour l’ensemble des céréales, pas seulement ce produit. Il mesure l’évolution, ce n’est pas un prix en devise.',
      directional: 'Référence indicative', notComp: 'Non comparable avec les autres marchés', asOf: 'Donnée du', vsPrev: 'par rapport à la donnée précédente', method: 'Comment c’est mesuré',
      usTxt: { trigo: 'Prix reçu par l’agriculteur (USDA NASS), moyenne nationale mensuelle, USD par bushel.', maiz: 'Prix reçu par l’agriculteur (USDA NASS), moyenne nationale mensuelle, USD par bushel.', vacuno: 'Prix reçu pour les bouvillons et génisses de 500 lb ou plus, poids vif (USDA NASS), USD par cwt. Pas équivalent au prix en carcasse européen.', cerdo: 'Prix reçu pour les porcs, poids vif (USDA NASS), USD par cwt. Pas équivalent au prix en carcasse européen.' },
      sd: 'Offre et demande', sdHint: 'USDA (PSD), campagne la plus récente (prévision révisée chaque mois)', sdItem: 'Poste', sdPrev: 'Précédente', sdChg: 'Var.', sdMy: 'Campagne', stu: 'Stocks / consommation', sdChart: 'Production et consommation', sdEnt: 'Zone', sdMore: 'Voir le bilan complet et le classement des pays',
      ex: 'Ventes à l’exportation des États-Unis', exHint: 'USDA FAS, semaine au', exAcc: 'Exporté sur la campagne', exOut: 'Vendu, en attente d’expédition', exCom: 'Total engagé', exNet: 'Ventes nettes de la semaine', vsLY: 'par rapport à la même période l’an dernier', exChart: 'Exportations cumulées sur la campagne', exThis: 'Cette campagne', exLast: 'Campagne précédente', exWeek: 'Semaine de campagne', exTop: 'Principaux acheteurs', country: 'Pays', exMore: 'Voir toutes les ventes à l’exportation', exMy: 'Campagne commerciale',
      tr: 'Commerce des États-Unis par pays', trHint: 'USDA FAS GATS (données du Census Bureau), valeur en dollars courants', trEx: 'À qui les États-Unis vendent', trIm: 'De qui les États-Unis achètent', months: 'mois', to: 'à', trMore: 'Voir le commerce par pays et la carte', value: 'Valeur (USD)', share: 'Part',
      cr: 'État des cultures aux États-Unis', crHint: 'USDA NASS, Crop Progress', ge: 'Bon + excellent', crWeek: 'Semaine au', crOff: 'Hors saison : la notation est publiée environ d’avril à novembre.', pp: 'pp', crStage: 'Avancement', crMore: 'Voir l’état des cultures',
      stg: { planted: 'Semé', emerged: 'Levé', silking: 'Soies', dough: 'Pâteux', dented: 'Denté', mature: 'Mûr', harvested: 'Récolté', headed: 'Épiaison' },
      crop: { wheat_winter: 'Blé d’hiver', wheat_spring: 'Blé de printemps', corn: 'Maïs' },
      yl: 'Rendement et production', yield: 'Rendement', prod: 'Production', harv: 'Surface récoltée', bu: 'bu/acre', mbu: 'millions de bu', acres: 'millions d’acres', yrCur: 'prévision NASS de l’année en cours, révisée chaque mois', yMore: 'Voir les rendements par État',
      lv: 'Effectifs de bétail', lvHint: 'USDA NASS', lvVs: 'par rapport à la même période un an plus tôt', head: 'millions de têtes', lb: 'millions de livres', lvMore: 'Voir l’élevage et le froid',
      lvN: { 'CATTLE, INCL CALVES - INVENTORY': 'Cheptel bovin (veaux inclus)', 'CATTLE, ON FEED - INVENTORY': 'Bovins à l’engrais (effectif)', 'BEEF, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB': 'Bœuf congelé en chambres froides', 'HOGS - INVENTORY': 'Cheptel porcin', 'HOGS, BREEDING - INVENTORY': 'Porcs reproducteurs', 'PORK, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB': 'Porc congelé en chambres froides' },
      dr: 'Sécheresse dans les États producteurs', drHint: 'U.S. Drought Monitor, semaine du', drTop: 'Les 5 premiers États', drShare: 'Du total national', drNow: 'Sécheresse (D1+)', drYear: 'Vs an dernier', drW: 'Moyenne pondérée par la production', drWNote: 'Calcul de Dehesa : part de la surface de chaque État en sécheresse modérée ou pire (D1+), pondérée par la production des 5 premiers États. C’est une part de la surface de l’État, pas de la surface cultivée, et pas une prévision de récolte.', drMore: 'Voir le moniteur de sécheresse', dPP: 'pp',
      inv: 'stocks', st: 'État',
      co: 'Coûts de production (États-Unis)', coHint: 'USDA ERS, enquête coûts et rentabilité, total national, année', coGross: 'Valeur brute de la production', coCost: 'Coûts totaux', coNet: 'Résultat net', coOp: 'Coûts d’exploitation', coNote: 'Les coûts totaux incluent des postes imputés (coût d’opportunité de la terre et du travail non rémunéré) ; le résultat net est donc souvent plus bas que la trésorerie réelle. Données d’années closes.', coMore: 'Voir les coûts de production et le seuil de rentabilité',
      pl: { 'dollars per planted acre': 'USD par acre semé', 'dollars per hundredweight gain': 'USD par cwt de gain', 'dollars per cow': 'USD par vache' },
      links: 'Continuer à explorer', lMap: 'Carte', lPrices: 'Tableau des prix', noData: 'Pas encore de données pour ce produit.', pick: 'Produit',
      src: 'Sources : Commission européenne, Eurostat, Defra, USDA (NASS, FAS, ERS, AMS) et U.S. Drought Monitor. Chaque bloc renvoie à sa page avec la méthodologie complète. Plus dans', methodLink: 'Méthodologie', updated: 'Prix mis à jour'
    },
    it: {
      title: 'Scheda prodotto', sub: 'Tutto quello che abbiamo su un prodotto in una sola pagina: prezzo, offerta e domanda, commercio, coltura o allevamento, siccità e costi. Ogni mercato mostra solo ciò che i suoi dati permettono.',
      prices: 'Prezzi', pricesHint: 'Ogni mercato con la propria fonte e unità. Non vengono convertiti né sommati.',
      eu: 'Europa', us: 'Stati Uniti', uk: 'Regno Unito', euIdx: 'Europa · indice dei cereali (Eurostat)', ukIdx: 'Regno Unito · indice dei prezzi alla produzione (Defra)',
      idxNote: 'Indice base 2020 = 100. Misura l’andamento, non è un prezzo in valuta.', idxNoteEu: 'Indice base 2020 = 100 per l’insieme dei cereali, non solo per questo prodotto. Misura l’andamento, non è un prezzo in valuta.',
      directional: 'Riferimento indicativo', notComp: 'Non confrontabile con altri mercati', asOf: 'Dato del', vsPrev: 'rispetto al dato precedente', method: 'Come viene misurato',
      usTxt: { trigo: 'Prezzo ricevuto dall’agricoltore (USDA NASS), media nazionale mensile, USD per bushel.', maiz: 'Prezzo ricevuto dall’agricoltore (USDA NASS), media nazionale mensile, USD per bushel.', vacuno: 'Prezzo ricevuto per manzi e giovenche da 500 lb o più, peso vivo (USDA NASS), USD per cwt. Non equivalente al prezzo in carcassa europeo.', cerdo: 'Prezzo ricevuto per i suini, peso vivo (USDA NASS), USD per cwt. Non equivalente al prezzo in carcassa europeo.' },
      sd: 'Offerta e domanda', sdHint: 'USDA (PSD), campagna più recente (previsione rivista ogni mese)', sdItem: 'Voce', sdPrev: 'Precedente', sdChg: 'Var.', sdMy: 'Campagna', stu: 'Scorte / consumo', sdChart: 'Produzione e consumo', sdEnt: 'Area', sdMore: 'Vedi il bilancio completo e la classifica dei paesi',
      ex: 'Vendite all’esportazione degli Stati Uniti', exHint: 'USDA FAS, settimana al', exAcc: 'Esportato nella campagna', exOut: 'Venduto, in attesa di spedizione', exCom: 'Totale impegnato', exNet: 'Vendite nette della settimana', vsLY: 'rispetto allo stesso momento dell’anno scorso', exChart: 'Esportazioni cumulate nella campagna', exThis: 'Questa campagna', exLast: 'Campagna precedente', exWeek: 'Settimana di campagna', exTop: 'Principali acquirenti', country: 'Paese', exMore: 'Vedi tutte le vendite all’esportazione', exMy: 'Campagna commerciale',
      tr: 'Commercio USA per paese', trHint: 'USDA FAS GATS (dati del Census Bureau), valore in dollari correnti', trEx: 'A chi vendono gli USA', trIm: 'Da chi comprano gli USA', months: 'mesi', to: 'a', trMore: 'Vedi il commercio per paese e la mappa', value: 'Valore (USD)', share: 'Quota',
      cr: 'Stato delle colture USA', crHint: 'USDA NASS, Crop Progress', ge: 'Buono + eccellente', crWeek: 'Settimana al', crOff: 'Fuori stagione: la valutazione è pubblicata circa da aprile a novembre.', pp: 'pp', crStage: 'Avanzamento', crMore: 'Vedi lo stato delle colture',
      stg: { planted: 'Seminato', emerged: 'Emerso', silking: 'Sete', dough: 'Pastoso', dented: 'Dentato', mature: 'Maturo', harvested: 'Raccolto', headed: 'Spigatura' },
      crop: { wheat_winter: 'Grano invernale', wheat_spring: 'Grano primaverile', corn: 'Mais' },
      yl: 'Resa e produzione', yield: 'Resa', prod: 'Produzione', harv: 'Superficie raccolta', bu: 'bu/acro', mbu: 'milioni di bu', acres: 'milioni di acri', yrCur: 'previsione NASS dell’anno in corso, rivista ogni mese', yMore: 'Vedi le rese per Stato',
      lv: 'Consistenza del bestiame', lvHint: 'USDA NASS', lvVs: 'rispetto allo stesso periodo di un anno prima', head: 'milioni di capi', lb: 'milioni di libbre', lvMore: 'Vedi allevamento e freddo',
      lvN: { 'CATTLE, INCL CALVES - INVENTORY': 'Patrimonio bovino (vitelli inclusi)', 'CATTLE, ON FEED - INVENTORY': 'Bovini all’ingrasso (consistenza)', 'BEEF, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB': 'Carne bovina congelata in celle', 'HOGS - INVENTORY': 'Patrimonio suino', 'HOGS, BREEDING - INVENTORY': 'Suini da riproduzione', 'PORK, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB': 'Carne suina congelata in celle' },
      dr: 'Siccità negli Stati produttori', drHint: 'U.S. Drought Monitor, settimana del', drTop: 'I 5 maggiori Stati', drShare: 'Del totale nazionale', drNow: 'Siccità (D1+)', drYear: 'Vs anno scorso', drW: 'Media ponderata per la produzione', drWNote: 'Calcolo di Dehesa: quota della superficie di ogni Stato in siccità moderata o peggiore (D1+), ponderata per la produzione dei 5 maggiori Stati. È una quota della superficie dello Stato, non di quella coltivata, e non una previsione di raccolto.', drMore: 'Vedi il monitor della siccità', dPP: 'pp',
      inv: 'scorte', st: 'Stato',
      co: 'Costi di produzione (USA)', coHint: 'USDA ERS, indagine costi e redditività, totale nazionale, anno', coGross: 'Valore lordo della produzione', coCost: 'Costi totali', coNet: 'Risultato netto', coOp: 'Costi operativi', coNote: 'I costi totali includono voci imputate (costo opportunità di terra e lavoro non retribuito), quindi il risultato netto è di solito più basso della cassa reale. Dati di anni chiusi.', coMore: 'Vedi costi di produzione e pareggio',
      pl: { 'dollars per planted acre': 'USD per acro seminato', 'dollars per hundredweight gain': 'USD per cwt di crescita', 'dollars per cow': 'USD per vacca' },
      links: 'Continua a esplorare', lMap: 'Mappa', lPrices: 'Pannello dei prezzi', noData: 'Ancora nessun dato per questo prodotto.', pick: 'Prodotto',
      src: 'Fonti: Commissione europea, Eurostat, Defra, USDA (NASS, FAS, ERS, AMS) e U.S. Drought Monitor. Ogni blocco rimanda alla sua pagina con la metodologia completa. Altro in', methodLink: 'Metodologia', updated: 'Prezzi aggiornati'
    }
  };
  var XT = {"es": {"meal": "harina de soja", "idxm": "Europa · índice de leche (Eurostat)", "ukp": "Reino Unido", "lbac": "lb/acre", "mcwt": "millones de cwt", "usx": {"soja": "Harina de soja, Iowa FOB, 46,5-48 % de proteína (USDA AMS, MARS informe 3511), USD por tonelada corta. Es harina, no grano de soja.", "arroz": "Precio recibido por el agricultor (USDA NASS), media nacional mensual, USD por cwt (100 libras).", "leche": "Precio recibido por toda la leche vendida a plantas (USDA NASS), media nacional mensual, USD por cwt; no es el precio Class III.", "pollo": "Precio recibido por pollos broiler en peso vivo (USDA NASS), USD por libra. No equivale al precio del pollo entero en canal de la UE."}, "stg": {"blooming": "Floración", "setting_pods": "Formación de vainas", "dropping_leaves": "Caída de hojas"}, "crop": {"soybeans": "Soja", "rice": "Arroz"}, "lvn": {"CATTLE, COWS, MILK - INVENTORY": "Vacas lecheras (censo)", "MILK - PRODUCTION, MEASURED IN LB": "Producción de leche", "BUTTER, COLD STORAGE - STOCKS, MEASURED IN LB": "Mantequilla en cámaras", "CHEESE, NATURAL, COLD STORAGE, CHILLED - STOCKS, MEASURED IN LB": "Queso natural en cámaras", "CHICKENS, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB": "Pollo congelado en cámaras", "CHICKENS, BREASTS & BREAST MEAT, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB": "Pechugas congeladas en cámaras", "CHICKENS, WINGS, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB": "Alas congeladas en cámaras"}}, "en": {"meal": "soybean meal", "idxm": "Europe · milk index (Eurostat)", "ukp": "United Kingdom", "lbac": "lb/acre", "mcwt": "million cwt", "usx": {"soja": "Soybean meal, Iowa FOB, 46.5-48 % protein (USDA AMS, MARS report 3511), USD per short ton. It is meal, not soybeans.", "arroz": "Price received by farmers (USDA NASS), monthly national average, USD per cwt (100 lb).", "leche": "Price received for all milk sold to plants (USDA NASS), monthly national average, USD per cwt; not the Class III price.", "pollo": "Price received for broilers, live weight (USDA NASS), USD per pound. Not equivalent to the EU whole-carcass chicken price."}, "stg": {"blooming": "Blooming", "setting_pods": "Setting pods", "dropping_leaves": "Dropping leaves"}, "crop": {"soybeans": "Soybeans", "rice": "Rice"}, "lvn": {"CATTLE, COWS, MILK - INVENTORY": "Milk cows (inventory)", "MILK - PRODUCTION, MEASURED IN LB": "Milk production", "BUTTER, COLD STORAGE - STOCKS, MEASURED IN LB": "Butter in cold storage", "CHEESE, NATURAL, COLD STORAGE, CHILLED - STOCKS, MEASURED IN LB": "Natural cheese in cold storage", "CHICKENS, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB": "Frozen chicken in cold storage", "CHICKENS, BREASTS & BREAST MEAT, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB": "Frozen breasts in cold storage", "CHICKENS, WINGS, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB": "Frozen wings in cold storage"}}, "fr": {"meal": "tourteau de soja", "idxm": "Europe · indice du lait (Eurostat)", "ukp": "Royaume-Uni", "lbac": "lb/acre", "mcwt": "millions de cwt", "usx": {"soja": "Tourteau de soja, Iowa FOB, 46,5-48 % de protéines (USDA AMS, rapport MARS 3511), USD par tonne courte. C’est du tourteau, pas du soja en grain.", "arroz": "Prix reçu par l’agriculteur (USDA NASS), moyenne nationale mensuelle, USD par cwt (100 livres).", "leche": "Prix reçu pour tout le lait vendu aux laiteries (USDA NASS), moyenne nationale mensuelle, USD par cwt ; ce n’est pas le prix Class III.", "pollo": "Prix reçu pour les poulets de chair, poids vif (USDA NASS), USD par livre. Pas équivalent au prix du poulet entier en carcasse de l’UE."}, "stg": {"blooming": "Floraison", "setting_pods": "Formation des gousses", "dropping_leaves": "Chute des feuilles"}, "crop": {"soybeans": "Soja", "rice": "Riz"}, "lvn": {"CATTLE, COWS, MILK - INVENTORY": "Vaches laitières (effectif)", "MILK - PRODUCTION, MEASURED IN LB": "Production de lait", "BUTTER, COLD STORAGE - STOCKS, MEASURED IN LB": "Beurre en chambres froides", "CHEESE, NATURAL, COLD STORAGE, CHILLED - STOCKS, MEASURED IN LB": "Fromage naturel en chambres froides", "CHICKENS, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB": "Poulet congelé en chambres froides", "CHICKENS, BREASTS & BREAST MEAT, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB": "Blancs congelés en chambres froides", "CHICKENS, WINGS, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB": "Ailes congelées en chambres froides"}}, "it": {"meal": "farina di soia", "idxm": "Europa · indice del latte (Eurostat)", "ukp": "Regno Unito", "lbac": "lb/acro", "mcwt": "milioni di cwt", "usx": {"soja": "Farina di soia, Iowa FOB, 46,5-48 % di proteine (USDA AMS, rapporto MARS 3511), USD per tonnellata corta. È farina, non soia in semi.", "arroz": "Prezzo ricevuto dall’agricoltore (USDA NASS), media nazionale mensile, USD per cwt (100 libbre).", "leche": "Prezzo ricevuto per tutto il latte venduto agli stabilimenti (USDA NASS), media nazionale mensile, USD per cwt; non è il prezzo Class III.", "pollo": "Prezzo ricevuto per i polli broiler, peso vivo (USDA NASS), USD per libbra. Non equivalente al prezzo del pollo intero in carcassa UE."}, "stg": {"blooming": "Fioritura", "setting_pods": "Formazione baccelli", "dropping_leaves": "Caduta foglie"}, "crop": {"soybeans": "Soia", "rice": "Riso"}, "lvn": {"CATTLE, COWS, MILK - INVENTORY": "Vacche da latte (consistenza)", "MILK - PRODUCTION, MEASURED IN LB": "Produzione di latte", "BUTTER, COLD STORAGE - STOCKS, MEASURED IN LB": "Burro in celle", "CHEESE, NATURAL, COLD STORAGE, CHILLED - STOCKS, MEASURED IN LB": "Formaggio naturale in celle", "CHICKENS, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB": "Pollo congelato in celle", "CHICKENS, BREASTS & BREAST MEAT, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB": "Petti congelati in celle", "CHICKENS, WINGS, COLD STORAGE, FROZEN - STOCKS, MEASURED IN LB": "Ali congelate in celle"}}};
  Object.keys(XT).forEach(function (l) { var x = XT[l], t = T[l]; t.meal = x.meal; t.euIdxMilk = x.idxm; t.ukP = x.ukp; t.lbac = x.lbac; t.mcwt = x.mcwt; Object.keys(x.usx).forEach(function (k) { t.usTxt[k] = x.usx[k]; }); Object.keys(x.stg).forEach(function (k) { t.stg[k] = x.stg[k]; }); Object.keys(x.crop).forEach(function (k) { t.crop[k] = x.crop[k]; }); Object.keys(x.lvn).forEach(function (k) { t.lvN[k] = x.lvn[k]; }); });
  var XT2 = { es: { date: 'Fecha', idxAxis: 'Índice (2020 = 100)', axMy: 'Campaña', axYear: 'Año', axKt: 'Miles de toneladas' }, en: { date: 'Date', idxAxis: 'Index (2020 = 100)', axMy: 'Marketing year', axYear: 'Year', axKt: 'Thousand tonnes' }, fr: { date: 'Date', idxAxis: 'Indice (2020 = 100)', axMy: 'Campagne', axYear: 'Année', axKt: 'Milliers de tonnes' }, it: { date: 'Data', idxAxis: 'Indice (2020 = 100)', axMy: 'Campagna', axYear: 'Anno', axKt: 'Migliaia di tonnellate' } };
  Object.keys(XT2).forEach(function (l) { Object.keys(XT2[l]).forEach(function (k) { T[l][k] = XT2[l][k]; }); });
  var MON = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
  var SEL = { p: 'trigo', ent: 'US' };
  var D = {}; // datos cargados

  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tr() { return T[lang()] || T.es; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); } catch (e) { return v.toFixed(d || 0); } }
  function sg(v, d, u) { return (v > 0.0001 ? '+' : v < -0.0001 ? '−' : '') + nf(Math.abs(v), d) + (u || ''); }
  function pct(a, b) { return b ? (a - b) / Math.abs(b) * 100 : null; }
  function delta(v, d, u) { if (v === null || v === undefined || isNaN(v)) return '<span style="color:var(--text-faint)">—</span>'; return '<span style="color:' + (v > 0.05 ? 'var(--positive)' : v < -0.05 ? '#a9491f' : 'var(--text-faint)') + ';font-weight:600">' + sg(v, d, u) + '</span>'; }
  function dtl(v, d, u) { if (v === null || v === undefined || isNaN(v)) return '<span style="color:var(--text-faint)">—</span>'; return '<span style="color:' + (v > 0.05 ? '#a9491f' : v < -0.05 ? 'var(--positive)' : 'var(--text-faint)') + ';font-weight:600">' + sg(v, d, u) + '</span>'; } // sube = peor (sequía)
  function dfmt(iso, opt) { var p = iso.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, +(p[2] || 1))).toLocaleDateString(lang(), opt || { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function mfmt(y, m) { try { return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(lang(), { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return m + '/' + y; } }
  function hlabel(h) { // etiqueta de un punto de histórico
    var p = String(h.period), y = h.year;
    if (/^\d\d-\d\d$/.test(p)) return dfmt(y + '-' + p, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    if (MON[p]) return mfmt(y, MON[p]);
    if (/^\d\d$/.test(p)) return mfmt(y, +p);
    if (/^Q\d$/.test(p)) return p + ' ' + y;
    return p + ' ' + y;
  }
  function obsById(id) { var o = D.latest && D.latest.observations; if (!o || !id) return null; for (var i = 0; i < o.length; i++) if (o[i].id === id) return o[i]; return null; }
  function card(label, value, sub) { return '<div class="di-card" style="padding:14px 16px;flex:1 1 190px;min-width:170px"><div style="font-size:11px;letter-spacing:.4px;color:var(--text-faint);font-weight:700">' + esc(label).toUpperCase() + '</div><div style="font-size:23px;font-weight:700;margin:4px 0 2px;font-family:\'Source Serif 4\',serif">' + value + '</div><div style="font-size:12.5px">' + (sub || '') + '</div></div>'; }
  function cards(arr) { return '<div style="display:flex;gap:12px;flex-wrap:wrap;margin:10px 0 14px">' + arr.join('') + '</div>'; }
  function ci(id, o) { return window.DICite && id ? window.DICite.html(id, o || {}) : ''; }
  function sec(title, hint, body, more, cite) { return '<section style="margin:30px 0 8px"><div class="di-movers-head-row"><h2>' + esc(title) + '</h2><span class="di-movers-hint">' + esc(hint || '') + '</span></div>' + body + (more ? '<p class="di-movers-hint" style="margin-top:8px">' + more + '</p>' : '') + (cite || '') + '</section>'; }
  function lnk(href, txt) { return '<a href="' + href + '">' + esc(txt) + ' →</a>'; }
  function th(s, right) { return '<th style="text-align:' + (right ? 'right' : 'left') + ';padding:6px 8px;font-size:11.5px;color:var(--text-faint);font-weight:700">' + esc(s) + '</th>'; }
  function td(s, right, bold) { return '<td style="text-align:' + (right ? 'right' : 'left') + ';padding:6px 8px;font-size:13.5px' + (bold ? ';font-weight:600' : '') + '">' + s + '</td>'; }
  function table(head, rows) { return '<div class="di-card" style="padding:6px 8px;overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>'; }
  var TR = 'border-top:1px solid var(--border)';

  /* gráfica de líneas con ejes y valor al pasar el ratón (js/chart.js) */
  function hts(h) { return window.DehesaChart.histTs(h); }
  function line(series, labels, fmt, aria, ex) {
    ex = ex || {};
    var S = series.map(function (s) { return { name: s.name, color: s.col, dash: s.dash, pts: s.pts.map(function (v, i) { return { x: ex.ts ? ex.ts[i] : i, y: v, l: labels[i] }; }) }; });
    return window.DehesaChart.render({ series: S, xMode: ex.ts ? 'time' : 'index', xLabels: labels, yFmt: fmt, vFmt: ex.vFmt, xTitle: ex.xTitle, yTitle: ex.yTitle, aria: aria, zero: ex.zero });
  }

  /* ---------- precios ---------- */
  function priceBlock(t, cfg, pid) {
    var out = [];
    function one(o, title, note, isIdx) {
      if (!o || o.status === 'pending' || typeof o.value !== 'number') return;
      var h = o.history || [], unit = o.unit === 'index_2020_100' ? '' : ' ' + o.currency + '/' + o.unit;
      var val = isIdx ? nf(o.value, 1) : nf(o.value, o.value < 20 ? 2 : 1);
      var badge = isIdx ? '' : '<span style="font-size:11px;font-weight:700;border:1px solid var(--border);border-radius:10px;padding:1px 8px;color:var(--text-faint);margin-left:8px">' + esc(o.comparability === 'not_comparable' ? t.notComp : t.directional) + '</span>';
      var date = o.observationDate.length === 7 ? mfmt(+o.observationDate.slice(0, 4), +o.observationDate.slice(5)) : dfmt(o.observationDate);
      var pts = h.map(function (r) { return r.value; }), labs = h.map(hlabel), ts = h.map(hts), ut = isIdx ? t.idxAxis : o.currency + '/' + o.unit;
      var chart = pts.length > 2 ? line([{ pts: pts, col: isIdx ? '#2a6f97' : '#a9491f', name: title }], labs, undefined, title, { ts: ts, xTitle: t.date, yTitle: ut, vFmt: function (v) { return nf(v, 2) + (isIdx ? '' : ' ' + ut); } }) : '';
      out.push('<div style="margin:12px 0 22px"><div style="font-weight:700;font-size:15px">' + esc(title) + badge + '</div>' +
        cards([card(esc(t.asOf) + ' ' + esc(date), val + '<span style="font-size:13px;font-weight:600;color:var(--text-faint)">' + esc(unit) + '</span>', (typeof o.changePct === 'number' ? delta(o.changePct, 1, ' %') + ' <span style="color:var(--text-faint)">' + esc(t.vsPrev) + '</span>' : ''))]) + chart +
        '<p class="di-movers-hint" style="margin-top:8px"><strong>' + esc(t.method) + ':</strong> ' + esc(note) + '</p>' + ci(o.sourceId, { period: o.observationDate, pub: o.publicationDate }) + '</div>');
    }
    var eu = obsById(cfg.eu), us = obsById(cfg.us);
    var sfx = cfg.meal ? ' · ' + t.meal : '';
    one(eu, t.eu + sfx, (eu && eu.methodology) || '', false);
    one(us, t.us + sfx, t.usTxt[pid], false);
    var ukp = obsById(cfg.ukP); one(ukp, t.ukP, (ukp && ukp.methodology) || '', false);
    one(obsById(cfg.euIdx), cfg.euIdxMilk ? t.euIdxMilk : t.euIdx, cfg.euIdxMilk ? t.idxNote : t.idxNoteEu, true);
    one(obsById(cfg.uk), t.ukIdx, t.idxNote, true);
    return out.length ? sec(t.prices, t.pricesHint, out.join(''), lnk('europa.html?f=' + ({ trigo: 'cereales', maiz: 'cereales', soja: 'oleaginosas', arroz: 'arroz', vacuno: 'vacuno', cerdo: 'cerdo', leche: 'lacteos', pollo: 'pollo' }[SEL.p] || 'cereales'), ({ es: 'Todos los precios de la UE', en: 'All EU prices', fr: 'Tous les prix de l’UE', it: 'Tutti i prezzi UE' }[lang()] || 'All EU prices')) + ' · ' + lnk('precios.html?product=' + (cfg.pp || (pid === 'vacuno' ? 'vaca' : pid)), t.lPrices)) : '';
  }

  /* ---------- oferta y demanda ---------- */
  function sdBlock(t, cfg) {
    var sd = D.sd; if (!sd) return '';
    var c = null; sd.commodities.forEach(function (x) { if (x.id === cfg.psd) c = x; });
    if (!c) return '';
    var my = c.latestMarketYear, pm = my - 1, A = P.attrs();
    var ents = { US: c.countries['United States'] && c.countries['United States'].years, EU: c.countries['European Union'] && c.countries['European Union'].years, WORLD: c.world };
    var names = { US: t.us, EU: t.eu, WORLD: P.world() };
    var keys = ['US', 'EU', 'WORLD'].filter(function (k) { return ents[k] && ents[k][my]; });
    if (!keys.length) return '';
    if (keys.indexOf(SEL.ent) < 0) SEL.ent = keys[0];
    var Y = ents[SEL.ent], cur = Y[my], prev = Y[pm] || {};
    var attrs = ['production', 'imports', 'exports', 'consumption', 'endingStocks'].filter(function (a) { return typeof cur[a] === 'number'; });
    var rows = attrs.map(function (a) { var ch = prev[a] ? pct(cur[a], prev[a]) : null; return '<tr style="' + TR + '">' + td(esc(A[a]), 0, 1) + td(P.big(cur[a]), 1) + td(prev[a] !== undefined ? P.big(prev[a]) : '—', 1) + td(delta(ch, 1, ' %'), 1) + '</tr>'; }).join('');
    var stu = cur.consumption && typeof cur.endingStocks === 'number' ? cur.endingStocks / cur.consumption * 100 : null, stuP = prev.consumption && typeof prev.endingStocks === 'number' ? prev.endingStocks / prev.consumption * 100 : null;
    var sel = '<select id="pr-ent" aria-label="Entity" class="di-compare-select" style="margin-bottom:8px">' + keys.map(function (k) { return '<option value="' + k + '"' + (k === SEL.ent ? ' selected' : '') + '>' + esc(names[k]) + '</option>'; }).join('') + '</select>';
    var yrs = c.marketYears.filter(function (y) { return Y[y] && typeof Y[y].production === 'number' && typeof Y[y].consumption === 'number'; }).slice(-10);
    var chart = line([{ pts: yrs.map(function (y) { return Y[y].production; }), col: '#2a6f97', name: A.production }, { pts: yrs.map(function (y) { return Y[y].consumption; }), col: '#b8651b', name: A.consumption }], yrs.map(function (y) { return P.myLabel(cfg.psd, y); }), function (v) { return nf(v, 0); }, t.sdChart, { xTitle: t.axMy, yTitle: t.axKt, vFmt: function (v) { return P.big(v); } });
    var body = sel + cards([card(t.sdMy, esc(P.myLabel(cfg.psd, my)), '<span style="color:var(--text-faint)">' + esc(names[SEL.ent]) + '</span>')].concat(stu === null ? [] : [card(t.stu, stu === null ? '—' : nf(stu, 1) + ' %', stuP === null ? '' : delta(stu - stuP, 1, ' pp') + ' <span style="color:var(--text-faint)">' + esc(P.myLabel(cfg.psd, pm)) + '</span>')])) +
      table(th(t.sdItem) + th(P.myLabel(cfg.psd, my), 1) + th(t.sdPrev, 1) + th(t.sdChg, 1), rows) + '<div style="height:12px"></div>' + chart;
    return sec(t.sd, t.sdHint + ' · ' + (c.publishedMonth || ''), body, lnk('oferta-demanda.html', t.sdMore), ci('usda_fas_psd', { period: c.publishedMonth }));
  }


  /* ---------- dependencia de importación / exportación (cálculo de Dehesa sobre USDA PSD) ---------- */
  var XD = {
    es: { dep: 'Dependencia de importación y exportación', depHint: 'Cálculo de Dehesa Index a partir de USDA PSD (campaña más reciente frente a la anterior).', imp: 'Dependencia de importación', impD: 'Importaciones / consumo', exp: 'Orientación exportadora', expD: 'Exportaciones / producción', self: 'Autosuficiencia', selfD: 'Producción / consumo', mkt: 'Mercado', vs: 'frente a la campaña anterior', note: 'Mismas unidades en numerador y denominador (las de PSD). Con existencias que varían, producción y consumo no cuadran exactamente con importaciones y exportaciones. No es un dato oficial: es una razón entre cifras del USDA.' },
    en: { dep: 'Import and export dependence', depHint: 'Dehesa Index calculation from USDA PSD (latest marketing year vs the previous one).', imp: 'Import dependence', impD: 'Imports / consumption', exp: 'Export orientation', expD: 'Exports / production', self: 'Self-sufficiency', selfD: 'Production / consumption', mkt: 'Market', vs: 'vs. previous marketing year', note: 'Same units in numerator and denominator (PSD’s). With changing stocks, production and consumption do not exactly match imports and exports. Not an official figure: a ratio between USDA numbers.' },
    fr: { dep: 'Dépendance à l’importation et à l’exportation', depHint: 'Calcul Dehesa Index à partir d’USDA PSD (dernière campagne contre la précédente).', imp: 'Dépendance à l’importation', impD: 'Importations / consommation', exp: 'Orientation exportatrice', expD: 'Exportations / production', self: 'Autosuffisance', selfD: 'Production / consommation', mkt: 'Marché', vs: 'vs. campagne précédente', note: 'Mêmes unités au numérateur et au dénominateur (celles de PSD). Avec des stocks variables, production et consommation ne bouclent pas exactement avec importations et exportations. Chiffre non officiel : un rapport entre données USDA.' },
    it: { dep: 'Dipendenza da import ed export', depHint: 'Calcolo Dehesa Index da USDA PSD (ultima campagna rispetto alla precedente).', imp: 'Dipendenza dall’import', impD: 'Importazioni / consumo', exp: 'Orientamento all’export', expD: 'Esportazioni / produzione', self: 'Autosufficienza', selfD: 'Produzione / consumo', mkt: 'Mercato', vs: 'vs. campagna precedente', note: 'Stesse unità a numeratore e denominatore (quelle di PSD). Con scorte variabili, produzione e consumo non quadrano esattamente con import ed export. Non è un dato ufficiale: un rapporto tra cifre USDA.' }
  };
  function depBlock(t, cfg) {
    var sd = D.sd, x = XD[lang()] || XD.es; if (!sd) return '';
    var c = null; sd.commodities.forEach(function (q) { if (q.id === cfg.psd) c = q; }); if (!c) return '';
    var my = c.latestMarketYear, names = { US: t.us, EU: t.eu }, E = { US: c.countries['United States'] && c.countries['United States'].years, EU: c.countries['European Union'] && c.countries['European Union'].years };
    function ratios(y) { if (!y || typeof y.production !== 'number' || typeof y.consumption !== 'number' || !y.consumption || !y.production) return null; return { imp: typeof y.imports === 'number' ? y.imports / y.consumption * 100 : null, exp: typeof y.exports === 'number' ? y.exports / y.production * 100 : null, self: y.production / y.consumption * 100 }; }
    var rows = '', any = false;
    ['US', 'EU'].forEach(function (k) {
      var Y = E[k]; if (!Y) return; var a = ratios(Y[my]), b = ratios(Y[my - 1]); if (!a) return; any = true;
      function cell(key) { return a[key] === null ? td('—', 1) : td(nf(a[key], 1) + ' % ' + (b && b[key] !== null ? '<span style="font-size:11.5px">' + dtl(a[key] - b[key], 1, ' pp') + '</span>' : ''), 1); }
      rows += '<tr style="' + TR + '">' + td(esc(names[k]), 0, 1) + cell('imp') + cell('exp') + cell('self') + '</tr>';
    });
    if (!any) return '';
    var body = '<div class="di-card" style="padding:6px 8px;overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr>' + th(x.mkt) + th(x.imp + ' · ' + x.impD, 1) + th(x.exp + ' · ' + x.expD, 1) + th(x.self + ' · ' + x.selfD, 1) + '</tr></thead><tbody>' + rows + '</tbody></table></div><p class="di-info-api-notice" style="margin:6px 0">' + esc(x.note) + '</p>';
    return sec(x.dep, x.depHint + ' ' + P.myLabel(cfg.psd, my) + ' ' + x.vs, body, '', window.DICite ? window.DICite.derived(['usda_fas_psd'], { what: x.depHint }) : '');
  }


  /* ---------- ofertas diarias de grano (USDA AMS) ---------- */
  var XA = {
    es: { t: 'Ofertas diarias en el mercado de EE. UU.', h: 'Mediana de las ofertas de compra (cash bids) de elevadores y terminales de EE. UU. con la misma calidad. Datos de USDA AMS.', med: 'Mediana', st: 'Estaciones', chg1: 'vs. ayer', chg30: 'vs. hace 30 días', rep: 'Informe', price: 'Oferta', date: 'Fecha', more: 'Todos los informes diarios de AMS', note: 'Precios de oferta locales, no cotización de bolsa; cada estación publica con su propia base y entrega. La mediana solo sirve como referencia nacional.', ch: 'Mediana últimos 90 días' },
    en: { t: 'Daily cash bids in the US market', h: 'Median of buy bids (cash bids) from US elevators and terminals for the same grade. USDA AMS data.', med: 'Median', st: 'Stations', chg1: 'vs. yesterday', chg30: 'vs. 30 days ago', rep: 'Report', price: 'Bid', date: 'Date', more: 'All daily AMS reports', note: 'Local bid prices, not exchange quotes; each station reports on its own basis and delivery. The median is only a national reference.', ch: 'Median, last 90 days' },
    fr: { t: 'Offres quotidiennes sur le marché américain', h: 'Médiane des offres d’achat (cash bids) des silos et terminaux américains pour une même qualité. Données USDA AMS.', med: 'Médiane', st: 'Stations', chg1: 'vs. hier', chg30: 'vs. il y a 30 jours', rep: 'Rapport', price: 'Offre', date: 'Date', more: 'Tous les rapports quotidiens AMS', note: 'Prix d’offre locaux, pas des cotations de bourse ; chaque station publie selon sa base et sa livraison. La médiane n’est qu’une référence nationale.', ch: 'Médiane, 90 derniers jours' },
    it: { t: 'Offerte giornaliere sul mercato USA', h: 'Mediana delle offerte d’acquisto (cash bids) di silos e terminal USA per la stessa qualità. Dati USDA AMS.', med: 'Mediana', st: 'Stazioni', chg1: 'vs. ieri', chg30: 'vs. 30 giorni fa', rep: 'Rapporto', price: 'Offerta', date: 'Data', more: 'Tutti i rapporti giornalieri AMS', note: 'Prezzi di offerta locali, non quotazioni di borsa; ogni stazione pubblica con la propria base e consegna. La mediana è solo un riferimento nazionale.', ch: 'Mediana, ultimi 90 giorni' }
  };
  function amsBlock(t, cfg) {
    var A = D.ams && D.ams.products && D.ams.products[SEL.p]; if (!A || !A.length) return '';
    var x = XA[lang()] || XA.es, body = '';
    A.forEach(function (c) {
      var m = c.median, n = m.length; if (n < 5) return;
      var last = m[n - 1][1], prev = m[n - 2][1], m30 = null, i, ld = Date.parse(m[n - 1][0]);
      for (i = 0; i < n; i++) if ((ld - Date.parse(m[i][0])) / 864e5 >= 28) m30 = m[i][1];
      var u = (c.unit || '').replace('Per', '/').replace('$ ', '$'), d = last < 20 ? 2 : 1;
      var chart = line([{ pts: m.map(function (r) { return r[1]; }), col: '#a9491f', name: x.med }], m.map(function (r) { return dfmt(r[0]); }), function (v) { return nf(v, 2); }, x.ch, { ts: m.map(function (r) { return Date.parse(r[0]); }), xTitle: '' });
      var rows = c.stations.slice(0, 10).map(function (s) {
        return '<tr style="' + TR + '">' + td(esc(s.title.replace(/ (Daily )?(Cash )?(Elevator )?Grain Bids?|Daily Grain Report|Daily Wheat Bids/i, '')), 0, 1) + td(nf(s.price, 2), 1) + td(dtl(s.chg1, 2, ''), 1) + td(dtl(s.chg30, 2, ''), 1) + td(dfmt(s.date), 1) + '</tr>';
      }).join('');
      body += '<div style="font-weight:700;font-size:14px;margin:10px 0 4px">' + esc(c.spec) + ' · ' + esc(u) + '</div>' + cards([card(x.med + ' · ' + dfmt(c.latest), nf(last, 2), delta(pct(last, prev), 1, ' %') + ' <span style="color:var(--text-faint)">' + esc(x.chg1) + '</span>'), card(x.chg30, m30 === null ? '—' : sg(last - m30, 2, ''), '<span style="color:var(--text-faint)">' + esc(x.st) + ': ' + c.n + '</span>')]) + chart +
        '<div style="height:10px"></div>' + table(th(x.rep) + th(x.price, 1) + th(x.chg1, 1) + th(x.chg30, 1) + th(x.date, 1), rows);
    });
    if (!body) return '';
    return sec(x.t, x.h, body + '<p class="di-info-api-notice" style="margin:6px 0">' + esc(x.note) + '</p>', lnk('mercados.html', x.more), ci('usda_ams_mars'));
  }

  /* ---------- ventas de exportación ---------- */
  function tonsF(v) { return P.big(v / 1000); }
  function exBlock(t, cfg) {
    var es = D.es; if (!es || !cfg.es) return '';
    var c = null; es.commodities.forEach(function (x) { if (x.code === cfg.es) c = x; });
    if (!c || !c.totals) return '';
    var tot = c.totals, ps = c.prevSameWeek;
    var com = tot.acc + tot.out;
    var body = cards([
      card(t.exAcc, tonsF(tot.acc), ps ? delta(pct(tot.acc, ps.acc), 1, ' %') + ' <span style="color:var(--text-faint)">' + esc(t.vsLY) + '</span>' : ''),
      card(t.exOut, tonsF(tot.out), ps ? delta(pct(tot.out, ps.out), 1, ' %') + ' <span style="color:var(--text-faint)">' + esc(t.vsLY) + '</span>' : ''),
      card(t.exNet, tonsF(tot.net), '')
    ]);
    var w = c.weekly || [], wp = c.weeklyPrev || [];
    if (w.length > 2) {
      var n = w.length; body += line([{ pts: wp.slice(0, Math.max(n, 0)).map(function (r) { return r.acc; }), col: '#b8a98a', name: t.exLast }, { pts: w.map(function (r) { return r.acc; }), col: '#a9491f', name: t.exThis }], w.map(function (r, i) { return t.exWeek + ' ' + (i + 1); }), function (v) { return nf(v / 1000, 0); }, t.exChart, { xTitle: t.exWeek, yTitle: t.axKt, vFmt: tonsF, zero: true });
      body = body.replace(/<div class="di-card" style="padding:10px 10px 8px">/, '<div style="font-weight:700;font-size:14px;margin:4px 0 6px">' + esc(t.exChart) + '</div><div class="di-card" style="padding:10px 10px 8px">');
    }
    var top = (c.countries || []).filter(function (r) { return r.i2 && !/^UNKNOWN/i.test(r.n); }).sort(function (a, b) { return (b.acc + b.out) - (a.acc + a.out); }).slice(0, 6);
    if (top.length) body += '<div style="height:12px"></div><div style="font-weight:700;font-size:14px;margin:4px 0 6px">' + esc(t.exTop) + '</div>' + table(th(t.country) + th(t.exAcc, 1) + th(t.exOut, 1), top.map(function (r) { return '<tr style="' + TR + '">' + td(esc(P.countryName(r.i2, r.n)), 0, 1) + td(tonsF(r.acc), 1) + td(tonsF(r.out), 1) + '</tr>'; }).join(''));
    return sec(t.ex, t.exHint + ' ' + dfmt(c.weekEnding) + ' · ' + t.exMy + ' ' + c.my, body, lnk('exportaciones.html?tab=esr&code=' + c.code, t.exMore), ci('usda_fas_esr', { period: c.weekEnding }));
  }

  /* ---------- comercio por país (GATS) ---------- */
  function gatsBlock(t, cfg) {
    var g = D.gats; if (!g || !g.months || !g.months.length) return '';
    var months = g.months.slice(-12);
    function top(flow) {
      var d = (g[flow] || {})[cfg.gats]; if (!d) return null;
      var rows = [], tot = 0;
      Object.keys(d).forEach(function (p) { var s = 0; months.forEach(function (m) { var a = d[p][m]; if (a) s += a[0]; }); if (s > 0) { rows.push({ p: p, v: s }); tot += s; } });
      rows.sort(function (a, b) { return b.v - a.v; });
      return rows.length ? { rows: rows.slice(0, 6), tot: tot } : null;
    }
    var ex = top('ex'), im = top('im');
    if (!ex && !im) return '';
    function tbl(x, title) {
      if (!x) return '';
      return '<div style="flex:1 1 320px;min-width:280px"><div style="font-weight:700;font-size:14px;margin:4px 0 6px">' + esc(title) + ' · ' + esc(nf(x.tot / 1e6, 0)) + ' M USD</div>' + table(th(t.country) + th(t.value, 1) + th(t.share, 1), x.rows.map(function (r) { var pn = g.partners[r.p] || {}; return '<tr style="' + TR + '">' + td(esc(P.countryName(pn.i2, pn.n || r.p)), 0, 1) + td(nf(r.v / 1e6, 1) + ' M', 1) + td(nf(r.v / x.tot * 100, 1) + ' %', 1) + '</tr>'; }).join('')) + '</div>';
    }
    var a = months[0], b = months[months.length - 1];
    var body = '<p class="di-movers-hint" style="margin:0 0 6px">' + months.length + ' ' + esc(t.months) + ': ' + esc(mfmt(+a.slice(0, 4), +a.slice(4))) + ' ' + esc(t.to) + ' ' + esc(mfmt(+b.slice(0, 4), +b.slice(4))) + '</p><div style="display:flex;gap:16px;flex-wrap:wrap">' + tbl(ex, t.trEx) + tbl(im, t.trIm) + '</div>';
    return sec(t.tr, t.trHint, body, lnk('exportaciones.html?tab=gats&group=' + cfg.gats, t.trMore) + ' · ' + lnk('mapa.html?layer=trade&group=' + cfg.gats, t.lMap), ci('usda_fas_gats'));
  }

  /* ---------- cultivo ---------- */
  function nearest(rows, iso, backDays) {
    var p = iso.split('-'), tgt = Date.UTC(+p[0], +p[1] - 1, +p[2]) - backDays * 86400000, best = null, bd = 5 * 86400000;
    rows.forEach(function (r) { var q = r[0].split('-'), d = Math.abs(Date.UTC(+q[0], +q[1] - 1, +q[2]) - tgt); if (d <= bd) { bd = d; best = r; } });
    return best;
  }
  function cropBlock(t, cfg) {
    var out = '';
    var cp = D.cp;
    if (cp) {
      var recent = Date.now() - 60 * 86400000;
      cfg.cp.forEach(function (id) {
        var c = null; cp.crops.forEach(function (x) { if (x.id === id) c = x; });
        if (!c) return;
        var ys = Object.keys(c.seasons).map(Number).sort(function (a, b) { return b - a; }), S = null, sy = null, i;
        for (i = 0; i < ys.length; i++) { if (c.seasons[ys[i]].condition.length || Object.keys(c.seasons[ys[i]].progress).length) { S = c.seasons[ys[i]]; sy = ys[i]; break; } }
        if (!S) return;
        var cs = [];
        var cond = S.condition.length ? S.condition[S.condition.length - 1] : null;
        if (cond) {
          var cd = cond[0].split('-'), fresh = Date.UTC(+cd[0], +cd[1] - 1, +cd[2]) >= recent;
          if (fresh) {
            var geNow = cond[4] + cond[5], PS = c.seasons[sy - 1], py = PS && PS.condition.length ? nearest(PS.condition, cond[0], 365) : null;
            cs.push(card(t.ge + ' · ' + dfmt(cond[0]), nf(geNow, 0) + ' %', py ? delta(geNow - (py[4] + py[5]), 0, ' ' + t.pp) + ' <span style="color:var(--text-faint)">' + esc(t.vsLY) + '</span>' : ''));
          }
        }
        var bestSt = null, bestD = '';
        Object.keys(S.progress).forEach(function (st) { var a = S.progress[st]; if (a.length && a[a.length - 1][0] >= bestD) { bestD = a[a.length - 1][0]; bestSt = st; } });
        if (bestSt) {
          var last = S.progress[bestSt][S.progress[bestSt].length - 1], PP = c.seasons[sy - 1], pp = PP && PP.progress[bestSt] ? nearest(PP.progress[bestSt], last[0], 365) : null;
          cs.push(card((t.stg[bestSt] || bestSt) + ' · ' + dfmt(last[0]), nf(last[1], 0) + ' %', pp ? delta(last[1] - pp[1], 0, ' ' + t.pp) + ' <span style="color:var(--text-faint)">' + esc(t.vsLY) + '</span>' : ''));
        }
        if (cs.length) out += '<div style="font-weight:700;font-size:14px;margin-top:8px">' + esc(t.crop[id] || id) + '</div>' + cards(cs);
      });
    }
    var body = out;
    var nc = D.crops && D.crops.series, K = cfg.crop;
    if (nc && nc[K.y] && nc[K.p]) {
      var Y = nc[K.y].n, Pn = nc[K.p].n, H = nc[K.h] && nc[K.h].n;
      var ly = Y[Y.length - 1], pyv = Y[Y.length - 2], lp = Pn[Pn.length - 1], ppv = Pn[Pn.length - 2];
      var yc = [card(t.yield + ' ' + ly[0], nf(ly[1], K.yu === 'lb' ? 0 : 1) + ' <span style="font-size:13px;color:var(--text-faint)">' + esc(K.yu === 'lb' ? t.lbac : t.bu) + '</span>', pyv ? delta(pct(ly[1], pyv[1]), 1, ' %') + ' <span style="color:var(--text-faint)">vs ' + pyv[0] + '</span>' : ''),
        card(t.prod + ' ' + lp[0], nf(lp[1] / 1e6, 0) + ' <span style="font-size:13px;color:var(--text-faint)">' + esc(K.pu === 'cwt' ? t.mcwt : t.mbu) + '</span>', ppv ? delta(pct(lp[1], ppv[1]), 1, ' %') + ' <span style="color:var(--text-faint)">vs ' + ppv[0] + '</span>' : '')];
      if (H && H.length) yc.push(card(t.harv + ' ' + H[H.length - 1][0], nf(H[H.length - 1][1] / 1e6, 1) + ' <span style="font-size:13px;color:var(--text-faint)">' + esc(t.acres) + '</span>', H.length > 1 ? delta(pct(H[H.length - 1][1], H[H.length - 2][1]), 1, ' %') + ' <span style="color:var(--text-faint)">vs ' + H[H.length - 2][0] + '</span>' : ''));
      var yrs = Y.slice(-8);
      body += '<div style="font-weight:700;font-size:14px;margin-top:14px">' + esc(t.yl) + '</div>' + cards(yc) + line([{ pts: yrs.map(function (r) { return r[1]; }), col: '#2a6f97', name: t.yield }], yrs.map(function (r) { return r[0]; }), function (v) { return nf(v, 0); }, t.yield, { xTitle: t.axYear, yTitle: t.yield + ' (' + (K.yu === 'lb' ? t.lbac : t.bu) + ')', vFmt: function (v) { return nf(v, 1); } }) + '<p class="di-movers-hint" style="margin-top:6px">' + esc(ly[0]) + ': ' + esc(t.yrCur) + '.</p>';
    }
    if (!body) return '';
    return sec(t.cr, t.crHint, body, lnk('cultivos.html', t.crMore) + ' · ' + lnk('rendimientos.html?crop=' + cfg.rend, t.yMore), ci('usda_nass'));
  }

  /* ---------- ganado ---------- */
  function liveBlock(t, cfg) {
    var nl = D.live && D.live.series; if (!nl || !cfg.live) return '';
    var cs = [];
    cfg.live.forEach(function (k) {
      var s = nl[k]; if (!s || !s.n || s.n.length < 2) return;
      var last = s.n[s.n.length - 1], prev = null, i;
      var ly = String(+last[0].slice(0, 4) - 1) + last[0].slice(4);
      for (i = 0; i < s.n.length; i++) if (s.n[i][0] === ly) prev = s.n[i];
      var isLb = /LB$/.test(k), v = last[1] / 1e6;
      var when = last[0].length === 7 ? mfmt(+last[0].slice(0, 4), +last[0].slice(5)) : last[0];
      cs.push(card((t.lvN[k] || k) + ' · ' + when, nf(v, v < 100 ? 1 : 0) + ' <span style="font-size:13px;color:var(--text-faint)">' + esc(isLb ? t.lb : t.head) + '</span>', prev ? delta(pct(last[1], prev[1]), 1, ' %') + ' <span style="color:var(--text-faint)">' + esc(t.lvVs) + '</span>' : ''));
    });
    if (!cs.length) return '';
    return sec(t.lv, t.lvHint, cards(cs), lnk('ganaderia.html', t.lvMore), ci('usda_nass'));
  }

  /* ---------- sequía en estados productores ---------- */
  function topStates(cfg) {
    var s = cfg.kind === 'crop' ? D.crops && D.crops.series[cfg.crop.p] : D.live && D.live.series[cfg.inv];
    if (!s || !s.s || !s.n) return null;
    var cnt = {}, per = null;
    Object.keys(s.s).forEach(function (st) { if (st === 'OT') return; s.s[st].forEach(function (r) { cnt[r[0]] = (cnt[r[0]] || 0) + 1; }); });
    var mx = 0; Object.keys(cnt).forEach(function (k) { if (cnt[k] > mx) mx = cnt[k]; });
    Object.keys(cnt).forEach(function (k) { if (cnt[k] >= Math.max(3, mx * 0.6) && (per === null || k > per)) per = k; });
    if (!per) return null;
    var tot = null, rows = [];
    s.n.forEach(function (r) { if (r[0] === per) tot = r[1]; });
    if (!tot) return null;
    Object.keys(s.s).forEach(function (st) { if (st === 'OT') return; s.s[st].forEach(function (r) { if (r[0] === per) rows.push({ st: st, v: r[1] }); }); });
    rows.sort(function (a, b) { return b.v - a.v; });
    return { rows: rows.slice(0, 5), tot: tot, when: per };
  }
  function droughtBlock(t, cfg) {
    var dr = D.dr, ts = topStates(cfg); if (!dr || !ts || ts.rows.length < 3) return '';
    var wsum = 0, wnow = 0, wyr = 0, wy = 0, rows = '';
    ts.rows.forEach(function (r) {
      var a = dr.states[r.st]; if (!a || !a.length) return;
      var now = a[a.length - 1][2], yr = a.length > 52 ? a[a.length - 53][2] : null;
      wsum += r.v; wnow += r.v * now; if (yr !== null) { wyr += r.v * yr; wy += r.v; }
      rows += '<tr style="' + TR + '">' + td(esc(ST[r.st] || r.st), 0, 1) + td(nf(r.v / ts.tot * 100, 1) + ' %', 1) + td(nf(now, 1) + ' %', 1) + td(dtl(yr === null ? null : now - yr, 1, ' ' + t.dPP), 1) + '</tr>';
    });
    if (!wsum) return '';
    var avg = wnow / wsum, avgY = wy ? wyr / wy : null;
    var body = cards([card(t.drW + ' · D1+', nf(avg, 1) + ' %', avgY === null ? '' : dtl(avg - avgY, 1, ' ' + t.dPP) + ' <span style="color:var(--text-faint)">' + esc(t.vsLY) + '</span>')]) +
      '<div style="font-weight:700;font-size:14px;margin:4px 0 6px">' + esc(t.drTop) + '</div>' + table(th(t.st) + th(t.drShare, 1) + th(t.drNow, 1) + th(t.drYear, 1), rows) + '<p class="di-info-api-notice" style="margin:12px 0 4px">' + esc(t.drWNote) + '</p>';
    var last = dr.states[ts.rows[0].st]; last = last && last[last.length - 1];
    return sec(t.dr, t.drHint + ' ' + (last ? dfmt(last[0]) : ''), body, lnk('sequia.html?state=' + ts.rows[0].st, t.drMore), ci('us_drought_monitor', { period: last ? last[0] : '' }));
  }

  /* ---------- costes ---------- */
  function costBlock(t, cfg) {
    var rows = D.ers && D.ers.costs && D.ers.costs[cfg.ers]; if (!rows) return '';
    var us = rows.filter(function (r) { return r[3] === 'U.S. total'; }); if (!us.length) return '';
    var yr = 0; us.forEach(function (r) { if (r[4] > yr) yr = r[4]; });
    function get(y, grp, name) { for (var i = 0; i < us.length; i++) if (us[i][4] === y && us[i][0] === grp && us[i][1] === name) return us[i]; return null; }
    var defs = [[t.coGross, 'Gross value of production', 'Total, gross value of production'], [t.coOp, 'Operating costs', 'Total, operating costs'], [t.coCost, 'Costs listed', 'Total, costs listed'], [t.coNet, 'Net value', 'Value of production less total costs listed']];
    var cs = [], unit = '';
    defs.forEach(function (d) {
      var a = get(yr, d[1], d[2]); if (!a) return; var b = get(yr - 1, d[1], d[2]);
      unit = a[2]; var neg = d[1] === 'Net value';
      cs.push(card(d[0] + ' · ' + yr, (a[5] < 0 ? '−' : '') + nf(Math.abs(a[5]), 2), (t.pl[a[2]] || a[2]) + (b ? '<br>' + (d[1] === 'Net value' ? delta(a[5] - b[5], 2, '') : d[1] === 'Costs listed' || d[1] === 'Operating costs' ? dtl(pct(a[5], b[5]), 1, ' %') : delta(pct(a[5], b[5]), 1, ' %')) + ' <span style="color:var(--text-faint)">vs ' + (yr - 1) + '</span>' : '')));
    });
    if (!cs.length) return '';
    return sec(t.co, t.coHint + ' ' + yr, cards(cs) + '<p class="di-info-api-notice" style="margin:4px 0">' + esc(t.coNote) + '</p>', lnk('costes.html?tab=costs&prod=' + cfg.ers, t.coMore), ci('usda_ers', { period: String(yr) }));
  }


  /* ---------- Product Profile 2.0: noticias, insumos y relaciones ---------- */
  var XN = {
    es: { news: 'Noticias del producto', newsHint: 'Últimos titulares de la sección Noticias que mencionan este producto.', newsMore: 'Todas las noticias', inp: 'Insumos y energía en las noticias', inpHint: 'Fertilizantes, diésel y pienso: lo último que afecta al coste de producir.', rel: 'Relaciones: dónde seguir', relHint: 'Aranceles del capítulo aduanero de este producto, datos por país y páginas de insumos y clima.', tar: 'Aranceles (capítulo %c)', mk: { us: 'EE. UU.', eu: 'UE', ca: 'Canadá', mx: 'México' }, ctry: 'Datos por país', ctrys: 'Comercio exterior y precios por país', inputs: 'Costes de insumos (EE. UU.)', fert: 'Fertilizantes (UE)', clim: 'Clima agrícola', trade: 'Comercio por socio' },
    en: { news: 'Product news', newsHint: 'Latest headlines from the News section that mention this product.', newsMore: 'All news', inp: 'Inputs and energy in the news', inpHint: 'Fertilisers, diesel and feed: the latest on production costs.', rel: 'Relations: where to go next', relHint: 'Tariffs for this product’s customs chapter, country data and inputs and climate pages.', tar: 'Tariffs (chapter %c)', mk: { us: 'US', eu: 'EU', ca: 'Canada', mx: 'Mexico' }, ctry: 'Country data', ctrys: 'Foreign trade and prices by country', inputs: 'Input costs (US)', fert: 'Fertilisers (EU)', clim: 'Farm weather', trade: 'Trade by partner' },
    fr: { news: 'Actualités du produit', newsHint: 'Derniers titres de la rubrique Actualités qui mentionnent ce produit.', newsMore: 'Toutes les actualités', inp: 'Intrants et énergie dans l’actualité', inpHint: 'Engrais, diesel et aliments : le dernier sur les coûts de production.', rel: 'Relations : où poursuivre', relHint: 'Droits de douane du chapitre douanier de ce produit, données par pays, pages intrants et climat.', tar: 'Droits de douane (chapitre %c)', mk: { us: 'États-Unis', eu: 'UE', ca: 'Canada', mx: 'Mexique' }, ctry: 'Données par pays', ctrys: 'Commerce extérieur et prix par pays', inputs: 'Coûts des intrants (É.-U.)', fert: 'Engrais (UE)', clim: 'Météo agricole', trade: 'Commerce par partenaire' },
    it: { news: 'Notizie sul prodotto', newsHint: 'Ultimi titoli della sezione Notizie che citano questo prodotto.', newsMore: 'Tutte le notizie', inp: 'Input ed energia nelle notizie', inpHint: 'Fertilizzanti, gasolio e mangimi: le ultime sui costi di produzione.', rel: 'Relazioni: dove proseguire', relHint: 'Dazi del capitolo doganale di questo prodotto, dati per paese, pagine input e clima.', tar: 'Dazi (capitolo %c)', mk: { us: 'USA', eu: 'UE', ca: 'Canada', mx: 'Messico' }, ctry: 'Dati per paese', ctrys: 'Commercio estero e prezzi per paese', inputs: 'Costi degli input (USA)', fert: 'Fertilizzanti (UE)', clim: 'Meteo agricolo', trade: 'Commercio per partner' }
  };
  var NK = { cebada: ['cebada'], colza: ['colza'], oliva: ['oliva'], azucar: ['azucar'], huevos: ['huevos'], trigo: ['trigo'], maiz: ['maiz'], soja: ['soja'], arroz: ['arroz'], vacuno: ['vaca', 'ganado'], cerdo: ['cerdo'], leche: ['leche'], pollo: ['pollo'] };
  var HS = { cebada: '10', colza: '12', oliva: '15', azucar: '17', huevos: '04', trigo: '10', maiz: '10', arroz: '10', soja: '12', vacuno: '02', cerdo: '02', pollo: '02', leche: '04' };
  function newsList(items, t, x, more) {
    if (!items.length) return '';
    return items.map(function (n) {
      var hd = (n.headline && (n.headline[lang()] || n.headline.en || n.headline.es)) || '';
      return '<div style="border-top:1px solid var(--border);padding:8px 0"><a href="' + esc(n.url) + '" target="_blank" rel="noopener" style="font-weight:600;color:inherit;text-decoration:none">' + esc(hd) + '</a><div style="font-size:12px;color:var(--text-muted)">' + esc(n.date) + ' · ' + esc(n.source) + '</div></div>';
    }).join('');
  }
  function newsBlock(t, x) {
    var N = D.news && D.news.items; if (!N) return '';
    var keys = NK[SEL.p] || [], l = N.filter(function (n) { return (n.products || []).some(function (p) { return keys.indexOf(p) > -1; }); }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (b.relevance || 0) - (a.relevance || 0); }).slice(0, 5);
    var ins = N.filter(function (n) { return (n.products || []).some(function (p) { return ['fertilizantes', 'diesel', 'pienso'].indexOf(p) > -1; }); }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 3);
    return (l.length ? sec(x.news, x.newsHint, '<div class="di-card" style="padding:4px 16px">' + newsList(l, t, x) + '</div>', lnk('noticias.html', x.newsMore)) : '') +
      (ins.length ? sec(x.inp, x.inpHint, '<div class="di-card" style="padding:4px 16px">' + newsList(ins, t, x) + '</div>', lnk('noticias.html', x.newsMore)) : '');
  }
  function relBlock(t, x) {
    var ch = HS[SEL.p], chips = [];
    if (ch) ['us', 'eu', 'ca', 'mx'].forEach(function (m) { chips.push('<a class="di-link-btn" href="aranceles.html?m=' + m + '&ch=' + ch + '">' + esc(x.tar.replace('%c', ch)) + ' · ' + esc(x.mk[m]) + '</a>'); });
    chips.push('<a class="di-link-btn" href="perfiles.html">' + esc(x.ctry) + '</a>', '<a class="di-link-btn" href="paises.html?c=ES&g=trade">' + esc(x.ctrys) + '</a>', '<a class="di-link-btn" href="insumos.html">' + esc(x.inputs) + '</a>', '<a class="di-link-btn" href="europa.html">' + esc(x.fert) + '</a>', '<a class="di-link-btn" href="clima.html">' + esc(x.clim) + '</a>');
    return sec(x.rel, x.relHint, '<div style="display:flex;gap:8px;flex-wrap:wrap">' + chips.join('') + '</div>');
  }

  function tabs(t) {
    var nm = names();
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 4px">' + ORDER.map(function (k) { return '<a class="di-link-btn" href="producto.html?p=' + k + '" data-p="' + k + '" style="' + (k === SEL.p ? 'font-weight:700;border-color:var(--gold,#a9491f);' : '') + '">' + esc(nm[k] || k) + '</a>'; }).join('') + '</div>';
  }

  // canonical y og:url propios por producto (la pagina es una sola con ?p=): cada URL del sitemap se declara a si misma
  function setCanonical() {
    var u = 'https://dehesaindex.com/producto.html?p=' + SEL.p, c = document.querySelector('link[rel="canonical"]'), o = document.querySelector('meta[property="og:url"]');
    if (c) c.setAttribute('href', u); if (o) o.setAttribute('content', u);
  }
  function render() {
    setCanonical();
    var t = tr(), root = document.getElementById(TERM ? 'pr-legacy-body' : 'pr-body'), cfg = CFG[SEL.p], nm = names();
    if (!root) return;
    if (!TERM) {
      document.title = 'Dehesa Index — ' + t.title + ': ' + (nm[SEL.p] || SEL.p);
      document.getElementById('pg-h1').textContent = t.title + ': ' + (nm[SEL.p] || SEL.p);
      document.getElementById('pg-sub').textContent = t.sub;
    }
    // con la terminal de producto 3.0 el precio, la oferta y demanda y las noticias los pinta ella; aqui queda el detalle ampliado de EE. UU.
    var parts = [TERM ? '' : priceBlock(t, cfg, SEL.p), TERM ? '' : sdBlock(t, cfg), depBlock(t, cfg), amsBlock(t, cfg), exBlock(t, cfg), gatsBlock(t, cfg), cfg.kind === 'crop' ? cropBlock(t, cfg) : liveBlock(t, cfg), droughtBlock(t, cfg), costBlock(t, cfg), TERM ? '' : newsBlock(t, XN[lang()] || XN.es), TERM ? '' : relBlock(t, XN[lang()] || XN.es)].filter(function (x) { return x; });
    var links = '<p class="di-movers-hint" style="margin-top:26px"><strong>' + esc(t.links) + ':</strong> ' + lnk('mapa.html', t.lMap) + ' · ' + lnk('precios.html?product=' + (cfg.pp || (SEL.p === 'vacuno' ? 'vaca' : SEL.p)), t.lPrices) + '</p>';
    root.innerHTML = (TERM ? '' : tabs(t)) + (parts.length ? parts.join('') : '<p class="di-movers-hint">' + esc(t.noData) + '</p>') + links + (TERM ? '' : '<p class="di-movers-hint" style="margin-top:6px">' + esc(t.src) + ' <a href="metodologia.html">' + esc(t.methodLink) + '</a>.</p>');
    var sel = document.getElementById('pr-ent'); if (sel) sel.onchange = function (e) { SEL.ent = e.target.value; render(); };
  }

  // Ultimo dato de todas las regiones (sin historico) + historico completo SOLO de las series de este producto
  function latestFor(cfg) {
    if (!window.DIPrices) return Promise.resolve(null);
    return window.DIPrices.latest().then(function (obs) {
      var ids = [cfg.eu, cfg.us, cfg.ukP, cfg.euIdx, cfg.uk].filter(Boolean), rows = obs.filter(function (o) { return ids.indexOf(o.id) > -1; });
      return window.DIPrices.histories(rows.map(function (o) { return { region: o.region, product: o.product }; })).then(function (hs) {
        rows.forEach(function (o, i) { o.history = hs[i] && hs[i].history ? hs[i].history : (o.recent || []); });
        return { observations: obs };
      });
    }).catch(function () { return null; });
  }
  function get(file) { return fetch(file).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  window.DehesaShared.init('informacion');
  var TERM = false, LEGACY_LOADED = false, PT = window.DIProductTerminal;
  var prevCb = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () {
    if (prevCb) prevCb.apply(this, arguments);
    if (TERM) { PT.relang(); } else render();
  };
  var q = new URLSearchParams(window.location.search);
  var wanted = q.get('p') || 'trigo';
  // Carga pesada (varios MB de USDA/ERS/NASS): solo la ficha clasica (pollo, azucar) o el "detalle ampliado" de la terminal, y este ultimo a peticion
  function loadLegacy() {
    var cfg0 = CFG[SEL.p];
    if (LEGACY_LOADED) return Promise.resolve();
    return Promise.all([latestFor(cfg0), get('data/supply-demand.json'), get('data/export-sales.json'), get('data/gats.json'), get('data/drought.json'), get('data/ers.json'),
      cfg0.kind === 'crop' ? get('data/crop-progress.json') : Promise.resolve(null), get('data/nass-crops.json'), get('data/nass-livestock.json'), (window.DINews ? window.DINews.items().then(function (it) { return { items: it }; }) : Promise.resolve(null)), get('data/ams-grain-daily.json'), (window.DICite ? window.DICite.load() : Promise.resolve(null))]).then(function (r) {
      D.latest = r[0]; D.sd = r[1]; D.es = r[2]; D.gats = r[3]; D.dr = r[4]; D.ers = r[5]; D.cp = r[6]; D.crops = r[7]; D.live = r[8]; D.news = r[9]; D.ams = r[10];
      LEGACY_LOADED = true;
    });
  }
  PT.ready().then(function () { return true; }, function () { return false; }).then(function (ok) {
    if (ok && PT.has(wanted)) {
      TERM = true; SEL.p = wanted; setCanonical();
      return PT.mount(wanted, { legacy: { has: !!CFG[wanted], loaded: function () { return LEGACY_LOADED; }, load: loadLegacy, render: function () { render(); } } });
    }
    if (CFG[wanted]) SEL.p = wanted;
    return loadLegacy().then(render);
  });
})();
