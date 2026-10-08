/* Dehesa Index — Mi mercado: una página por tu lugar y tu producto. ES5, sin librerías.
   El agricultor elige país (EE. UU. o España), estado/provincia y producto; la página junta lo que YA tenemos para esa combinación:
   precio local (USDA AMS), seguro agrario (USDA RMA), sequía (US Drought Monitor) o superficie/producción por provincia (MAPA), cada cifra con su fuente y fecha.
   Reglas: no se inventa ni se estima nada; lo que falta se dice (sección «Lo que aún no tenemos para tu zona»); un precio de región/terminal no se presenta como de un elevador local;
   la elección se guarda solo en este navegador (localStorage) y en la dirección de la página; sin cuentas. Los datos se leen de los JSON que ya generan las tuberías; cada tarjeta se carga por separado. */
(function () {
  'use strict';
  var LSK = 'di-mi-mercado-v1', GR = 'data/us-cash-bids/', LOC = 'data/us-local/', SC = 'data/spain-crops/';
  var US_PROD = ['cattle', 'hay', 'corn', 'soybeans', 'wheat', 'sorghum', 'barley', 'oats'];
  var ES_GORDER = ['cereales', 'leguminosas', 'tuberculos', 'industriales', 'hortalizas', 'citricos', 'frutales', 'olivar', 'vinedo', 'otros_lenosos'];
  var LIDX = { en: 0, es: 1, fr: 2, it: 3 };

  var T = {
    es: {
      title: 'Mi mercado: tu zona y tu producto', sub: 'Elige dónde estás y qué produces. Verás en una sola página el precio local, el seguro agrario, la sequía o la producción de tu provincia, con la fuente y la fecha de cada dato. Se guarda solo en este navegador; no hace falta cuenta.',
      country: 'País', place: 'Estado', placeES: 'Provincia', product: 'Producto', group: 'Grupo de cultivos', crop: 'Cultivo', choose: 'Elige…', us: 'Estados Unidos', es: 'España',
      intro: 'Elige tu lugar y tu producto para empezar, o prueba un ejemplo:', ex: 'Ejemplos', loading: 'Cargando…', err: 'No se han podido cargar los datos de esta tarjeta.', saved: 'Tu elección se guarda en este navegador y en la dirección de la página: puedes añadirla a favoritos o compartirla.', reset: 'Borrar mi elección',
      sPrice: 'Precio cerca de ti', sIns: 'Seguro agrario en tu estado', sDrought: 'Sequía en tu estado', sCrop: 'Tu provincia en este cultivo', sMissing: 'Lo que aún no tenemos para tu zona', sMore: 'Ir más a fondo',
      cattle: 'Ganado vacuno (terneros y cebo)', hay: 'Heno', corn: 'Maíz', soybeans: 'Soja', wheat: 'Trigo', sorghum: 'Sorgo', barley: 'Cebada', oats: 'Avena',
      grp: { cereales: 'Cereales', leguminosas: 'Leguminosas', tuberculos: 'Tubérculos', industriales: 'Cultivos industriales', hortalizas: 'Hortalizas', citricos: 'Cítricos', frutales: 'Frutales no cítricos', olivar: 'Olivar', vinedo: 'Viñedo', otros_lenosos: 'Otros leñosos' },
      Steers: 'Novillos', Heifers: 'Terneras', Bulls: 'Toros', cls: 'Clase', wb: 'Peso (lb)', lb: 'lb', usdcwt: 'USD/cwt', cwtNote: 'cwt = 100 lb. Peso vivo.', head: 'Cabezas', avgw: 'peso medio', lastRep: 'Último informe', report: 'Informe original',
      vsW: 'Vs. semana anterior', vs4: 'Vs. 4 semanas', vsY: 'Vs. hace un año', noCmp: 'sin dato comparable',
      cattleNote: 'Subastas de ganado del estado, resumen semanal de USDA AMS: media de las medias publicadas, ponderada por cabezas, para {f}, grado {g}. Cada banda de peso es una serie propia: el cambio compara siempre la misma banda y la misma clase.',
      cattleNo: 'USDA AMS publica resumen semanal de subastas de ganado solo para {n} estados, y {s} no es uno de ellos. Estados con dato:', hayNo: 'USDA AMS publica el informe directo de heno solo para {n} estados, y {s} no es uno de ellos. Estados con dato:',
      grainNo: 'No tenemos precios de {p} en {s} (USDA no publica un informe de este producto en el estado). Estados con dato:',
      hayCls: 'Clase de heno', hayRows: 'Las {n} entradas con más cantidad de la última semana de informe', hayUnit: 'USD/t', hQ: 'Calidad', hP: 'Formato', hR: 'Región', hS: 'Venta', hAvg: 'Media', hRng: 'Rango', hQty: 'Cantidad', hChg: 'Vs. informe previo',
      hayNote: 'Informe directo de heno del estado (USDA AMS). Cada fila es una especificación distinta (calidad, formato, venta, región); no se mezclan. Solo filas con precio por tonelada.',
      gMk: 'Mercado', gSpec: 'Especificación', gBid: 'Oferta al contado', gBasis: 'Basis', gChg: 'Cambio', gDate: 'Fecha', gSeries: 'Gráfico de', gMore: 'Ver las {n} series', gOld: 'Ninguna cotización reciente en este estado; se muestran las últimas disponibles.', gShow: 'cotizaciones recientes',
      gNote: 'Oferta al contado (cash bid), no futuros. USDA publica regiones, terminales o estados, no elevadores concretos: la columna «Mercado» dice qué es cada uno. El basis es la diferencia con el contrato de referencia.',
      tREGION: 'región', tTERMINAL: 'terminal', tSTATE: 'estado', tCITY: 'ciudad', tELEVATOR: 'elevador', tEXPORT_MARKET: 'exportación',
      insLast: 'Último año completo', indem: 'Indemnizaciones pagadas', prem: 'Prima total', farmerP: 'Prima neta del agricultor', ratio: 'Indemnizaciones por dólar de prima', pol: 'Pólizas con prima', y: 'Año', subs: 'Subsidio federal', prov: 'provisional',
      insNote: 'Seguro de cosechas federal (USDA RMA, Summary of Business), todos los cultivos del estado juntos. «Prima neta del agricultor» = prima total − subsidio, calculado por Dehesa Index. Un año de campaña puede cambiar mientras no esté completo: los años marcados como provisionales no se comparan con los completos. No es una predicción de lo que cobrarías: depende de tu póliza y tu cultivo.',
      insNo: 'No hay cifras de seguro para este estado.', natCol: 'Total EE. UU. (misma ratio)', vsNat: 'media de EE. UU.',
      drNow: 'Ahora', dr4: 'Hace 4 semanas', drY: 'Hace 1 año', d0: 'D0+ anormalmente seco', d1: 'D1+ sequía moderada o peor', d2: 'D2+ sequía severa o peor', d3: 'D3+ sequía extrema o peor', pp: 'pp', drWeek: 'Semana del', drChart: 'Superficie del estado en sequía (D1+ y D2+)', pctArea: '% de la superficie del estado',
      drNote: 'US Drought Monitor: porcentaje de la superficie del ESTADO en cada categoría (acumulado: D1+ incluye D2 a D4). No es tu condado ni tu finca: el mapa por condados está en droughtmonitor.unl.edu. Variación en puntos porcentuales (pp).',
      drNo: 'No hay datos de sequía para este estado.',
      area: 'Superficie total', irr: 'Regadío', prd: 'Producción', yl: 'Rendimiento', th: 't/ha', ha: 'ha', t: 't', rank: 'Puesto {r} de {n} provincias', shareES: 'del total de España', vsC: 'Vs. campaña',
      topP: 'Mayores provincias en superficie', provT: 'Provincia', camp: 'Campaña', cropNo: 'El MAPA no publica {c} en {p} para la campaña {k}. Provincias con dato (mayores en superficie):', provisional: 'Datos provisionales',
      cropNote: 'Superficies y producciones anuales de cultivos del MAPA (datos provisionales de la campaña indicada; pueden cambiar). El rendimiento = producción ÷ superficie cosechada, calculado por Dehesa Index. Los nombres de cultivo son los del MAPA. Es la provincia entera: no se publica por comarca ni por municipio en esta estadística.',
      yHigher: 'Rendimiento de {p}', natAvg: 'media de España',
      no_us1: 'Precios por condado o por elevador concreto: USDA solo publica regiones, terminales o estados; no inventamos distancias ni coordenadas.',
      no_us2: 'Ganado: resumen semanal de subastas en {a} estados; heno en {b} estados; granos en {g} estados o mercados.',
      no_us3: 'Seguro: solo el total del estado (todos los cultivos juntos), no por cultivo y estado.',
      no_us4: 'Sequía: porcentaje del estado, no de tu condado.',
      no_us5: 'Costes (fertilizante, diésel, pienso) y clima: solo cifras nacionales o mundiales, no por estado.',
      no_es1: 'Precios por provincia o por lonja: todavía no incorporamos lonjas provinciales; los precios que seguimos son nacionales, europeos o mundiales.',
      no_es2: 'Seguro agrario (Agroseguro): solo cifras nacionales y pendientes de contraste; no por provincia.',
      no_es3: 'Sequía y clima por provincia: solo las páginas generales de clima y sequía; no una vista por provincia.',
      no_es4: 'Ganadería por provincia: no hay datos de censos ni de producción ganadera por provincia en esta página.',
      no_es5: 'Campaña 2025: solo los grupos que el MAPA ya ha publicado (hortalizas, cítricos, frutales, olivar, viñedo y otros leñosos); el resto está en la campaña 2024.',
      mPrice: 'Precios locales detallados', mIns: 'Seguro agrario (EE. UU.)', mDrought: 'Sequía por estado', mCrops: 'Cultivos de España por provincia', mClima: 'Clima', mPrices: 'Precios de referencia', mCosts: 'Costes e insumos'
    },
    en: {
      title: 'My market: your area and your product', sub: 'Pick where you farm and what you produce. One page shows local price, crop insurance, drought or your province\'s production, with the source and date of every figure. Your choice is stored only in this browser; no account needed.',
      country: 'Country', place: 'State', placeES: 'Province', product: 'Product', group: 'Crop group', crop: 'Crop', choose: 'Choose…', us: 'United States', es: 'Spain',
      intro: 'Pick your place and product to start, or try an example:', ex: 'Examples', loading: 'Loading…', err: 'This card\'s data could not be loaded.', saved: 'Your choice is saved in this browser and in the page address: you can bookmark or share it.', reset: 'Clear my choice',
      sPrice: 'Price near you', sIns: 'Crop insurance in your state', sDrought: 'Drought in your state', sCrop: 'Your province in this crop', sMissing: 'What we do not have yet for your area', sMore: 'Go deeper',
      cattle: 'Cattle (feeder calves)', hay: 'Hay', corn: 'Corn', soybeans: 'Soybeans', wheat: 'Wheat', sorghum: 'Sorghum', barley: 'Barley', oats: 'Oats',
      grp: { cereales: 'Cereals', leguminosas: 'Pulses', tuberculos: 'Tubers', industriales: 'Industrial crops', hortalizas: 'Vegetables', citricos: 'Citrus', frutales: 'Other fruit trees', olivar: 'Olive groves', vinedo: 'Vineyards', otros_lenosos: 'Other woody crops' },
      Steers: 'Steers', Heifers: 'Heifers', Bulls: 'Bulls', cls: 'Class', wb: 'Weight (lb)', lb: 'lb', usdcwt: 'USD/cwt', cwtNote: 'cwt = 100 lb. Live weight.', head: 'Head', avgw: 'average weight', lastRep: 'Latest report', report: 'Original report',
      vsW: 'Vs. previous week', vs4: 'Vs. 4 weeks', vsY: 'Vs. a year ago', noCmp: 'no comparable data',
      cattleNote: 'State cattle auctions, weekly USDA AMS summary: head-weighted average of the published averages, for {f} frame, grade {g}. Each weight band is its own series: change always compares the same band and class.',
      cattleNo: 'USDA AMS publishes a weekly auction summary for only {n} states, and {s} is not one of them. States with data:', hayNo: 'USDA AMS publishes the direct hay report for only {n} states, and {s} is not one of them. States with data:',
      grainNo: 'We have no {p} prices for {s} (USDA publishes no report for this product there). States with data:',
      hayCls: 'Hay class', hayRows: 'The {n} entries with the most volume in the latest report', hayUnit: 'USD/ton', hQ: 'Quality', hP: 'Package', hR: 'Region', hS: 'Sale', hAvg: 'Average', hRng: 'Range', hQty: 'Quantity', hChg: 'Vs. previous report',
      hayNote: 'The state\'s direct hay report (USDA AMS). Each row is a different specification (quality, package, sale, region); they are never mixed. Only rows priced per ton.',
      gMk: 'Market', gSpec: 'Specification', gBid: 'Cash bid', gBasis: 'Basis', gChg: 'Change', gDate: 'Date', gSeries: 'Chart of', gMore: 'See all {n} series', gOld: 'No recent quotes in this state; the latest available are shown.', gShow: 'recent quotes',
      gNote: 'Cash bid, not futures. USDA publishes regions, terminals or states, not individual elevators: the "Market" column says what each one is. Basis is the difference from the reference futures contract.',
      tREGION: 'region', tTERMINAL: 'terminal', tSTATE: 'state', tCITY: 'city', tELEVATOR: 'elevator', tEXPORT_MARKET: 'export',
      insLast: 'Last complete year', indem: 'Indemnities paid', prem: 'Total premium', farmerP: 'Farmer-paid premium', ratio: 'Indemnity per premium dollar', pol: 'Policies earning premium', y: 'Year', subs: 'Federal subsidy', prov: 'provisional',
      insNote: 'Federal crop insurance (USDA RMA, Summary of Business), all of the state\'s crops together. "Farmer-paid premium" = total premium − subsidy, calculated by Dehesa Index. A crop year can still change until complete: years marked provisional are not compared with complete ones. This does not predict what you would collect: it depends on your policy and crop.',
      insNo: 'No insurance figures for this state.', natCol: 'US total (same ratio)', vsNat: 'US average',
      drNow: 'Now', dr4: '4 weeks ago', drY: '1 year ago', d0: 'D0+ abnormally dry', d1: 'D1+ moderate drought or worse', d2: 'D2+ severe drought or worse', d3: 'D3+ extreme drought or worse', pp: 'pp', drWeek: 'Week of', drChart: 'Share of the state in drought (D1+ and D2+)', pctArea: '% of state area',
      drNote: 'US Drought Monitor: share of the STATE\'s area in each category (cumulative: D1+ includes D2 to D4). It is not your county or farm: the county map is at droughtmonitor.unl.edu. Changes in percentage points (pp).',
      drNo: 'No drought data for this state.',
      area: 'Total area', irr: 'Irrigated', prd: 'Production', yl: 'Yield', th: 't/ha', ha: 'ha', t: 't', rank: 'Rank {r} of {n} provinces', shareES: 'of Spain\'s total', vsC: 'Vs. campaign',
      topP: 'Largest provinces by area', provT: 'Province', camp: 'Campaign', cropNo: 'MAPA does not publish {c} in {p} for campaign {k}. Provinces with data (largest by area):', provisional: 'Provisional data',
      cropNote: 'Annual crop areas and production from MAPA (provisional data for the campaign shown; they may change). Yield = production ÷ harvested area, calculated by Dehesa Index. Crop names are MAPA\'s own. This is the whole province: this statistic is not published by district or municipality.',
      yHigher: 'Yield of {p}', natAvg: 'Spain average',
      no_us1: 'Prices by county or individual elevator: USDA publishes only regions, terminals or states; we do not invent distances or coordinates.',
      no_us2: 'Cattle: weekly auction summaries for {a} states; hay for {b} states; grains for {g} states or markets.',
      no_us3: 'Insurance: only the state total (all crops together), not by crop and state.',
      no_us4: 'Drought: share of the state, not of your county.',
      no_us5: 'Costs (fertiliser, diesel, feed) and weather: national or world figures only, not by state.',
      no_es1: 'Prices by province or by auction hall: we do not yet include provincial markets; the prices we follow are national, European or world.',
      no_es2: 'Crop insurance (Agroseguro): national figures only, still pending verification; not by province.',
      no_es3: 'Drought and weather by province: only the general weather and drought pages; no per-province view.',
      no_es4: 'Livestock by province: no census or livestock production data by province on this page.',
      no_es5: 'Campaign 2025: only the groups MAPA has already published (vegetables, citrus, fruit trees, olive groves, vineyards and other woody crops); the rest is campaign 2024.',
      mPrice: 'Detailed local prices', mIns: 'Crop insurance (US)', mDrought: 'Drought by state', mCrops: 'Spain crops by province', mClima: 'Weather', mPrices: 'Reference prices', mCosts: 'Costs and inputs'
    },
    fr: {
      title: 'Mon marché : votre zone et votre produit', sub: 'Choisissez où vous êtes et ce que vous produisez. Une seule page montre le prix local, l\'assurance récolte, la sécheresse ou la production de votre province, avec la source et la date de chaque donnée. Votre choix reste uniquement dans ce navigateur ; aucun compte.',
      country: 'Pays', place: 'État', placeES: 'Province', product: 'Produit', group: 'Groupe de cultures', crop: 'Culture', choose: 'Choisir…', us: 'États-Unis', es: 'Espagne',
      intro: 'Choisissez votre lieu et votre produit pour commencer, ou essayez un exemple :', ex: 'Exemples', loading: 'Chargement…', err: 'Impossible de charger les données de cette fiche.', saved: 'Votre choix est enregistré dans ce navigateur et dans l\'adresse de la page : vous pouvez l\'ajouter aux favoris ou le partager.', reset: 'Effacer mon choix',
      sPrice: 'Prix près de chez vous', sIns: 'Assurance récolte dans votre État', sDrought: 'Sécheresse dans votre État', sCrop: 'Votre province pour cette culture', sMissing: 'Ce qui manque encore pour votre zone', sMore: 'Aller plus loin',
      cattle: 'Bovins (veaux et engraissement)', hay: 'Foin', corn: 'Maïs', soybeans: 'Soja', wheat: 'Blé', sorghum: 'Sorgho', barley: 'Orge', oats: 'Avoine',
      grp: { cereales: 'Céréales', leguminosas: 'Légumineuses', tuberculos: 'Tubercules', industriales: 'Cultures industrielles', hortalizas: 'Légumes', citricos: 'Agrumes', frutales: 'Autres arbres fruitiers', olivar: 'Oliveraies', vinedo: 'Vignobles', otros_lenosos: 'Autres cultures ligneuses' },
      Steers: 'Bouvillons', Heifers: 'Génisses', Bulls: 'Taureaux', cls: 'Catégorie', wb: 'Poids (lb)', lb: 'lb', usdcwt: 'USD/cwt', cwtNote: 'cwt = 100 lb. Poids vif.', head: 'Têtes', avgw: 'poids moyen', lastRep: 'Dernier rapport', report: 'Rapport original',
      vsW: 'Vs. semaine préc.', vs4: 'Vs. 4 semaines', vsY: 'Vs. il y a un an', noCmp: 'pas de donnée comparable',
      cattleNote: 'Encans de bovins de l\'État, résumé hebdomadaire USDA AMS : moyenne des moyennes publiées, pondérée par les têtes, pour {f}, grade {g}. Chaque tranche de poids est une série à part : la variation compare toujours la même tranche et la même catégorie.',
      cattleNo: 'USDA AMS ne publie un résumé hebdomadaire des encans que pour {n} États, et {s} n\'en fait pas partie. États avec données :', hayNo: 'USDA AMS ne publie le rapport direct sur le foin que pour {n} États, et {s} n\'en fait pas partie. États avec données :',
      grainNo: 'Nous n\'avons pas de prix de {p} pour {s} (l\'USDA ne publie pas de rapport pour ce produit dans cet État). États avec données :',
      hayCls: 'Classe de foin', hayRows: 'Les {n} lignes avec le plus de volume du dernier rapport', hayUnit: 'USD/t', hQ: 'Qualité', hP: 'Conditionnement', hR: 'Région', hS: 'Vente', hAvg: 'Moyenne', hRng: 'Fourchette', hQty: 'Quantité', hChg: 'Vs. rapport préc.',
      hayNote: 'Rapport direct sur le foin de l\'État (USDA AMS). Chaque ligne est une spécification différente (qualité, conditionnement, vente, région) ; elles ne sont jamais mélangées. Seulement les lignes au prix par tonne.',
      gMk: 'Marché', gSpec: 'Spécification', gBid: 'Offre au comptant', gBasis: 'Base', gChg: 'Variation', gDate: 'Date', gSeries: 'Graphique de', gMore: 'Voir les {n} séries', gOld: 'Aucune cotation récente dans cet État ; les dernières disponibles sont affichées.', gShow: 'cotations récentes',
      gNote: 'Offre au comptant (cash bid), pas les contrats à terme. L\'USDA publie des régions, terminaux ou États, pas des silos précis : la colonne « Marché » indique de quoi il s\'agit. La base est l\'écart avec le contrat à terme de référence.',
      tREGION: 'région', tTERMINAL: 'terminal', tSTATE: 'État', tCITY: 'ville', tELEVATOR: 'silo', tEXPORT_MARKET: 'export',
      insLast: 'Dernière année complète', indem: 'Indemnités versées', prem: 'Prime totale', farmerP: 'Prime nette payée par l\'agriculteur', ratio: 'Indemnités par dollar de prime', pol: 'Polices avec prime', y: 'Année', subs: 'Subvention fédérale', prov: 'provisoire',
      insNote: 'Assurance récolte fédérale (USDA RMA, Summary of Business), toutes les cultures de l\'État réunies. « Prime nette » = prime totale − subvention, calculée par Dehesa Index. Une campagne peut encore changer tant qu\'elle n\'est pas complète : les années provisoires ne sont pas comparées aux années complètes. Ce n\'est pas une prévision de ce que vous toucheriez : cela dépend de votre contrat et de votre culture.',
      insNo: 'Aucun chiffre d\'assurance pour cet État.', natCol: 'Total É.-U. (même ratio)', vsNat: 'moyenne É.-U.',
      drNow: 'Maintenant', dr4: 'Il y a 4 semaines', drY: 'Il y a 1 an', d0: 'D0+ anormalement sec', d1: 'D1+ sécheresse modérée ou pire', d2: 'D2+ sécheresse sévère ou pire', d3: 'D3+ sécheresse extrême ou pire', pp: 'pp', drWeek: 'Semaine du', drChart: 'Part de l\'État en sécheresse (D1+ et D2+)', pctArea: '% de la surface de l\'État',
      drNote: 'US Drought Monitor : part de la surface de l\'ÉTAT dans chaque catégorie (cumulé : D1+ inclut D2 à D4). Ce n\'est pas votre comté ni votre exploitation : la carte par comté est sur droughtmonitor.unl.edu. Variations en points de pourcentage (pp).',
      drNo: 'Aucune donnée de sécheresse pour cet État.',
      area: 'Surface totale', irr: 'Irrigué', prd: 'Production', yl: 'Rendement', th: 't/ha', ha: 'ha', t: 't', rank: '{r}e sur {n} provinces', shareES: 'du total de l\'Espagne', vsC: 'Vs. campagne',
      topP: 'Plus grandes provinces par surface', provT: 'Province', camp: 'Campagne', cropNo: 'Le MAPA ne publie pas {c} pour {p} pour la campagne {k}. Provinces avec données (plus grandes en surface) :', provisional: 'Données provisoires',
      cropNote: 'Surfaces et productions annuelles de cultures du MAPA (données provisoires de la campagne indiquée ; elles peuvent changer). Rendement = production ÷ surface récoltée, calculé par Dehesa Index. Les noms de cultures sont ceux du MAPA. Il s\'agit de la province entière : cette statistique n\'est pas publiée par canton ni par commune.',
      yHigher: 'Rendement de {p}', natAvg: 'moyenne de l\'Espagne',
      no_us1: 'Prix par comté ou par silo précis : l\'USDA ne publie que des régions, terminaux ou États ; nous n\'inventons ni distances ni coordonnées.',
      no_us2: 'Bovins : résumés hebdomadaires d\'encans pour {a} États ; foin pour {b} États ; céréales pour {g} États ou marchés.',
      no_us3: 'Assurance : seulement le total de l\'État (toutes cultures réunies), pas par culture et par État.',
      no_us4: 'Sécheresse : part de l\'État, pas de votre comté.',
      no_us5: 'Coûts (engrais, diesel, aliments) et météo : chiffres nationaux ou mondiaux seulement, pas par État.',
      no_es1: 'Prix par province ou par lonja : nous n\'incluons pas encore les marchés provinciaux ; les prix suivis sont nationaux, européens ou mondiaux.',
      no_es2: 'Assurance agricole (Agroseguro) : chiffres nationaux seulement, encore à vérifier ; pas par province.',
      no_es3: 'Sécheresse et météo par province : seulement les pages générales météo et sécheresse ; pas de vue par province.',
      no_es4: 'Élevage par province : pas de recensement ni de production animale par province sur cette page.',
      no_es5: 'Campagne 2025 : seulement les groupes déjà publiés par le MAPA (légumes, agrumes, arbres fruitiers, oliveraies, vignobles et autres ligneux) ; le reste est en campagne 2024.',
      mPrice: 'Prix locaux détaillés', mIns: 'Assurance récolte (É.-U.)', mDrought: 'Sécheresse par État', mCrops: 'Cultures d\'Espagne par province', mClima: 'Météo', mPrices: 'Prix de référence', mCosts: 'Coûts et intrants'
    },
    it: {
      title: 'Il mio mercato: la tua zona e il tuo prodotto', sub: 'Scegli dove sei e cosa produci. Una sola pagina mostra prezzo locale, assicurazione dei raccolti, siccità o produzione della tua provincia, con fonte e data di ogni dato. La scelta resta solo in questo browser; nessun account.',
      country: 'Paese', place: 'Stato', placeES: 'Provincia', product: 'Prodotto', group: 'Gruppo di colture', crop: 'Coltura', choose: 'Scegli…', us: 'Stati Uniti', es: 'Spagna',
      intro: 'Scegli luogo e prodotto per iniziare, o prova un esempio:', ex: 'Esempi', loading: 'Caricamento…', err: 'Impossibile caricare i dati di questa scheda.', saved: 'La tua scelta è salvata in questo browser e nell\'indirizzo della pagina: puoi aggiungerla ai preferiti o condividerla.', reset: 'Cancella la mia scelta',
      sPrice: 'Prezzo vicino a te', sIns: 'Assicurazione dei raccolti nel tuo Stato', sDrought: 'Siccità nel tuo Stato', sCrop: 'La tua provincia in questa coltura', sMissing: 'Cosa non abbiamo ancora per la tua zona', sMore: 'Approfondisci',
      cattle: 'Bovini (vitelli e ingrasso)', hay: 'Fieno', corn: 'Mais', soybeans: 'Soia', wheat: 'Frumento', sorghum: 'Sorgo', barley: 'Orzo', oats: 'Avena',
      grp: { cereales: 'Cereali', leguminosas: 'Leguminose', tuberculos: 'Tuberi', industriales: 'Colture industriali', hortalizas: 'Ortaggi', citricos: 'Agrumi', frutales: 'Altra frutta da albero', olivar: 'Oliveti', vinedo: 'Vigneti', otros_lenosos: 'Altre colture legnose' },
      Steers: 'Manzi', Heifers: 'Manze', Bulls: 'Tori', cls: 'Categoria', wb: 'Peso (lb)', lb: 'lb', usdcwt: 'USD/cwt', cwtNote: 'cwt = 100 lb. Peso vivo.', head: 'Capi', avgw: 'peso medio', lastRep: 'Ultimo rapporto', report: 'Rapporto originale',
      vsW: 'Vs. settimana prec.', vs4: 'Vs. 4 settimane', vsY: 'Vs. un anno fa', noCmp: 'nessun dato confrontabile',
      cattleNote: 'Aste di bovini dello Stato, riepilogo settimanale USDA AMS: media delle medie pubblicate, ponderata per capi, per {f}, grado {g}. Ogni fascia di peso è una serie a sé: la variazione confronta sempre la stessa fascia e la stessa categoria.',
      cattleNo: 'USDA AMS pubblica un riepilogo settimanale delle aste solo per {n} Stati, e {s} non è tra questi. Stati con dati:', hayNo: 'USDA AMS pubblica il rapporto diretto sul fieno solo per {n} Stati, e {s} non è tra questi. Stati con dati:',
      grainNo: 'Non abbiamo prezzi di {p} per {s} (l\'USDA non pubblica un rapporto per questo prodotto nello Stato). Stati con dati:',
      hayCls: 'Classe di fieno', hayRows: 'Le {n} righe con più volume dell\'ultimo rapporto', hayUnit: 'USD/t', hQ: 'Qualità', hP: 'Confezione', hR: 'Regione', hS: 'Vendita', hAvg: 'Media', hRng: 'Intervallo', hQty: 'Quantità', hChg: 'Vs. rapporto prec.',
      hayNote: 'Rapporto diretto sul fieno dello Stato (USDA AMS). Ogni riga è una specifica diversa (qualità, confezione, vendita, regione); non si mescolano mai. Solo righe con prezzo per tonnellata.',
      gMk: 'Mercato', gSpec: 'Specifica', gBid: 'Offerta a pronti', gBasis: 'Basis', gChg: 'Variazione', gDate: 'Data', gSeries: 'Grafico di', gMore: 'Vedi tutte le {n} serie', gOld: 'Nessuna quotazione recente in questo Stato; sono mostrate le ultime disponibili.', gShow: 'quotazioni recenti',
      gNote: 'Offerta a pronti (cash bid), non future. L\'USDA pubblica regioni, terminal o Stati, non singoli elevatori: la colonna «Mercato» dice di cosa si tratta. Il basis è la differenza dal contratto future di riferimento.',
      tREGION: 'regione', tTERMINAL: 'terminal', tSTATE: 'Stato', tCITY: 'città', tELEVATOR: 'elevatore', tEXPORT_MARKET: 'export',
      insLast: 'Ultimo anno completo', indem: 'Indennizzi pagati', prem: 'Premio totale', farmerP: 'Premio netto pagato dall\'agricoltore', ratio: 'Indennizzi per dollaro di premio', pol: 'Polizze con premio', y: 'Anno', subs: 'Sussidio federale', prov: 'provvisorio',
      insNote: 'Assicurazione federale dei raccolti (USDA RMA, Summary of Business), tutte le colture dello Stato insieme. «Premio netto» = premio totale − sussidio, calcolato da Dehesa Index. Un anno può ancora cambiare finché non è completo: gli anni provvisori non si confrontano con quelli completi. Non è una previsione di quanto incasseresti: dipende dalla tua polizza e dalla tua coltura.',
      insNo: 'Nessuna cifra assicurativa per questo Stato.', natCol: 'Totale USA (stesso rapporto)', vsNat: 'media USA',
      drNow: 'Ora', dr4: '4 settimane fa', drY: '1 anno fa', d0: 'D0+ anormalmente secco', d1: 'D1+ siccità moderata o peggio', d2: 'D2+ siccità severa o peggio', d3: 'D3+ siccità estrema o peggio', pp: 'pp', drWeek: 'Settimana del', drChart: 'Quota dello Stato in siccità (D1+ e D2+)', pctArea: '% della superficie dello Stato',
      drNote: 'US Drought Monitor: quota della superficie dello STATO in ogni categoria (cumulativa: D1+ include da D2 a D4). Non è la tua contea né la tua azienda: la mappa per contea è su droughtmonitor.unl.edu. Variazioni in punti percentuali (pp).',
      drNo: 'Nessun dato di siccità per questo Stato.',
      area: 'Superficie totale', irr: 'Irrigua', prd: 'Produzione', yl: 'Resa', th: 't/ha', ha: 'ha', t: 't', rank: '{r}º su {n} province', shareES: 'del totale della Spagna', vsC: 'Vs. campagna',
      topP: 'Province maggiori per superficie', provT: 'Provincia', camp: 'Campagna', cropNo: 'Il MAPA non pubblica {c} per {p} nella campagna {k}. Province con dati (maggiori per superficie):', provisional: 'Dati provvisori',
      cropNote: 'Superfici e produzioni annuali delle colture dal MAPA (dati provvisori della campagna indicata; possono cambiare). Resa = produzione ÷ superficie raccolta, calcolata da Dehesa Index. I nomi delle colture sono quelli del MAPA. È l\'intera provincia: questa statistica non è pubblicata per comarca né per comune.',
      yHigher: 'Resa di {p}', natAvg: 'media della Spagna',
      no_us1: 'Prezzi per contea o per singolo elevatore: l\'USDA pubblica solo regioni, terminal o Stati; non inventiamo distanze né coordinate.',
      no_us2: 'Bovini: riepiloghi settimanali delle aste per {a} Stati; fieno per {b} Stati; cereali per {g} Stati o mercati.',
      no_us3: 'Assicurazione: solo il totale dello Stato (tutte le colture insieme), non per coltura e Stato.',
      no_us4: 'Siccità: quota dello Stato, non della tua contea.',
      no_us5: 'Costi (fertilizzanti, gasolio, mangimi) e meteo: solo cifre nazionali o mondiali, non per Stato.',
      no_es1: 'Prezzi per provincia o per borsa merci: non includiamo ancora i mercati provinciali; i prezzi che seguiamo sono nazionali, europei o mondiali.',
      no_es2: 'Assicurazione agraria (Agroseguro): solo cifre nazionali, ancora da verificare; non per provincia.',
      no_es3: 'Siccità e meteo per provincia: solo le pagine generali su meteo e siccità; nessuna vista per provincia.',
      no_es4: 'Zootecnia per provincia: nessun censimento né produzione zootecnica per provincia in questa pagina.',
      no_es5: 'Campagna 2025: solo i gruppi già pubblicati dal MAPA (ortaggi, agrumi, frutta da albero, oliveti, vigneti e altre legnose); il resto è nella campagna 2024.',
      mPrice: 'Prezzi locali dettagliati', mIns: 'Assicurazione dei raccolti (USA)', mDrought: 'Siccità per Stato', mCrops: 'Colture della Spagna per provincia', mClima: 'Meteo', mPrices: 'Prezzi di riferimento', mCosts: 'Costi e input'
    }
  };

  /* ---------- utilidades ---------- */
  var COMPACT = !document.getElementById('mm-body') && !!document.getElementById('home-mm'), root = document.getElementById('mm-body') || document.getElementById('home-mm'), TOK = 0, CACHE = {};
  if (!root) return;
  function lang() { var l = window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; return T[l] ? l : 'es'; }
  function tr() { return T[lang()]; }

  /* ---------- Canadá: textos propios (es, en, fr, it) ---------- */
  var TCA = {
    es: { ca: 'Canadá', sIns: 'Seguro agrario en tu provincia', sDr: 'Sequía en tu provincia', sProd: 'Tu provincia en este producto', cattle: 'Vacuno', hogs: 'Porcino', sheep: 'Ovino', loadingMod: 'Cargando…',
      pNo: 'No tenemos un precio local para {p} en {s}. Lo que sí seguimos: Manitoba (vacuno, ovino y caprino en subastas y porcino de las procesadoras) y Alberta (precios semanales de cereales, novillos y cerdo).', pAbNote: 'Boletines semanales de Alberta Agriculture and Irrigation (Open Government Licence - Alberta): ofertas de elevador o al contado, y ventas directas de ganado. Es un precio de Alberta, no de toda la provincia ni de un elevador concreto. Cambios sobre nuestra propia serie semanal.',
      pAbSrc: 'Precio de Alberta', last: 'Última semana', vsW: 'Vs. semana anterior', vs4: 'Vs. 4 semanas', vsY: 'Vs. hace un año', noCmp: 'sin dato comparable', chart: 'Evolución semanal',
      ab: { canola_elevador: 'Canola, oferta de elevador (Alberta centro)', trigo_pienso_ab: 'Trigo forrajero, oferta de elevador', cebada_pienso_ab: 'Cebada forrajera, oferta de elevador', avena_pienso_ab: 'Avena forrajera, oferta de elevador', trigo_cwrs_ab: 'Trigo CWRS n.º 1/2, oferta media de elevador', lenteja_laird_ab: 'Lenteja Laird n.º 1, oferta al contado', guisante_verde_ab: 'Guisante verde n.º 2, oferta al contado', novillo_ab: 'Novillos, ventas directas (peso vivo)', cerdo_ab: 'Cerdo en canal, precio al contado (Index 100)' },
      insIndem: 'Indemnizaciones del seguro de cosechas', insHail: 'Indemnizaciones de granizo (seguro privado)', insPrem: 'Primas de seguro de cosecha y granizo pagadas por las explotaciones', insShare: 'de Canadá', y: 'Año', mc: 'M C$', insVs: 'Vs. año anterior',
      insNote: 'Statistics Canada, tablas 32-10-0045-01 (pagos del seguro de cosechas y del seguro privado de granizo) y 32-10-0049-01 (gasto de las explotaciones en seguro de cosecha y granizo). Son totales de la provincia, todos los cultivos juntos; no un cociente por cultivo. Miles de dólares canadienses convertidos a millones. Un hueco es un dato que Statistics Canada no publica.', insNo: 'No hay cifras de seguro para esta provincia.',
      drNow: 'Fin del último mes', dr1: 'Hace 1 mes', dr12: 'Hace 12 meses', d1: 'D1+ sequía moderada o peor', d2: 'D2+ sequía severa o peor', d3: 'D3+ sequía extrema o peor', pp: 'pp', drNote: 'Canadian Drought Monitor (Agriculture and Agri-Food Canada y socios): porcentaje de la SUPERFICIE TOTAL de la provincia (tierra y aguas interiores) en cada categoría, acumulado (D1+ incluye D2 a D4), a fin de cada mes. No es tu municipio ni tu finca.', drNo: 'No hay datos de sequía para esta provincia.', drChart: 'Superficie de la provincia en D1+ y D2+ (fin de mes)',
      area: 'Superficie sembrada', harea: 'Superficie cosechada', yl: 'Rendimiento', prod: 'Producción', kha: 'miles de ha', kgha: 'kg/ha', kt: 'miles de t', rank: 'Puesto {r} de {n} provincias', shareCa: 'del total de Canadá', vsPrev: 'Vs. año anterior', year: 'Año',
      pNoCrop: 'Statistics Canada no publica {p} en {s}. Provincias con dato:', stock: 'Existencias (miles de cabezas)', stockNote: 'Existencias de ganado de Statistics Canada (encuesta semestral, enero y julio): cabezas vivas, no precio. Cambio frente al mismo mes del año anterior.', cropNote: 'Statistics Canada: superficie, rendimiento y producción por provincia. El último año puede ser una estimación o previsión hasta que se cierre la campaña. Puesto y porcentaje calculados por Dehesa Index sobre las provincias que publican dato.',
      cattleItems: { 'total-cattle': 'Total vacuno', 'beef-cows': 'Vacas de carne', 'dairy-cows': 'Vacas lecheras', 'total-heifers': 'Novillas', 'calves-under-1-year': 'Terneros de menos de 1 año' }, hogsItems: { 'hogs-total': 'Total porcino', 'sows-and-gilts-6-months-and-over': 'Cerdas reproductoras (6 meses o más)' }, sheepItems: { 'sheep-and-lambs-total': 'Total ovino', 'ewes': 'Ovejas', 'lambs-for-marketing': 'Corderos para sacrificio' },
      crops: { 'wheat-all': 'Trigo (total)', 'wheat-durum': 'Trigo duro', barley: 'Cebada', oats: 'Avena', 'rye-all': 'Centeno', 'canola-rapeseed': 'Canola (colza)', 'corn-for-grain': 'Maíz grano', soybeans: 'Soja', 'peas-dry': 'Guisantes secos', lentils: 'Lentejas', flaxseed: 'Lino', 'sunflower-seed': 'Girasol', 'mustard-seed': 'Mostaza', 'chick-peas': 'Garbanzos', 'canary-seed': 'Alpiste' },
      no_ca1: 'Precios locales: solo Manitoba (subastas de vacuno, ovino y caprino y porcino de las procesadoras) y Alberta (cereales, novillos y cerdo semanales). Para el resto de provincias no tenemos precio local.', no_ca2: 'Seguro agrario: solo el total de la provincia (todos los cultivos y el granizo), no por cultivo ni por póliza.', no_ca3: 'Sequía: porcentaje de la provincia, no de tu municipio.', no_ca4: 'Costes (fertilizante, diésel, pienso) y clima: solo cifras nacionales o mundiales, no por provincia.',
      mCa: 'Canadá: detalle del país', mMb: 'Manitoba: ganado y porcino', mRend: 'Rendimientos de Canadá', mGan: 'Ganadería de Canadá' },
    en: { ca: 'Canada', sIns: 'Crop insurance in your province', sDr: 'Drought in your province', sProd: 'Your province in this product', cattle: 'Cattle', hogs: 'Hogs', sheep: 'Sheep', loadingMod: 'Loading…',
      pNo: 'We have no local price for {p} in {s}. What we do follow: Manitoba (cattle, sheep and goats at auction and processor hog prices) and Alberta (weekly grain, steer and hog prices).', pAbNote: 'Weekly reviews by Alberta Agriculture and Irrigation (Open Government Licence - Alberta): elevator or cash bids, and direct livestock sales. It is an Alberta price, not the whole province or a specific elevator. Changes computed from our own weekly series.',
      pAbSrc: 'Alberta price', last: 'Latest week', vsW: 'Vs. previous week', vs4: 'Vs. 4 weeks', vsY: 'Vs. a year ago', noCmp: 'no comparable data', chart: 'Weekly evolution',
      ab: { canola_elevador: 'Canola, elevator bid (central Alberta)', trigo_pienso_ab: 'Feed wheat, elevator bid', cebada_pienso_ab: 'Feed barley, elevator bid', avena_pienso_ab: 'Feed oats, elevator bid', trigo_cwrs_ab: 'CWRS wheat no. 1/2, average elevator bid', lenteja_laird_ab: 'Laird lentils no. 1, cash bid', guisante_verde_ab: 'Green peas no. 2, cash bid', novillo_ab: 'Steers, direct sales (live weight)', cerdo_ab: 'Hogs (carcass), cash price (Index 100)' },
      insIndem: 'Crop insurance indemnities', insHail: 'Hail indemnities (private insurance)', insPrem: 'Crop and hail insurance premiums paid by farms', insShare: 'of Canada', y: 'Year', mc: 'C$ M', insVs: 'Vs. previous year',
      insNote: 'Statistics Canada, tables 32-10-0045-01 (crop insurance and private hail insurance payments) and 32-10-0049-01 (farm spending on crop and hail insurance). Province totals, all crops together; not a per-crop ratio. Thousands of Canadian dollars converted to millions. A gap is a figure Statistics Canada does not publish.', insNo: 'No insurance figures for this province.',
      drNow: 'End of the latest month', dr1: '1 month ago', dr12: '12 months ago', d1: 'D1+ moderate drought or worse', d2: 'D2+ severe drought or worse', d3: 'D3+ extreme drought or worse', pp: 'pp', drNote: 'Canadian Drought Monitor (Agriculture and Agri-Food Canada and partners): share of the province\'s TOTAL area (land and inland water) in each category, cumulative (D1+ includes D2 to D4), at the end of each month. It is not your municipality or farm.', drNo: 'No drought data for this province.', drChart: 'Share of the province in D1+ and D2+ (month end)',
      area: 'Planted area', harea: 'Harvested area', yl: 'Yield', prod: 'Production', kha: 'thousand ha', kgha: 'kg/ha', kt: 'thousand t', rank: 'Rank {r} of {n} provinces', shareCa: 'of Canada\'s total', vsPrev: 'Vs. previous year', year: 'Year',
      pNoCrop: 'Statistics Canada does not publish {p} in {s}. Provinces with data:', stock: 'Inventories (thousand head)', stockNote: 'Statistics Canada livestock inventories (semi-annual survey, January and July): live animals, not price. Change against the same month a year earlier.', cropNote: 'Statistics Canada: area, yield and production by province. The latest year may be an estimate or forecast until the crop year closes. Rank and share calculated by Dehesa Index over the provinces that publish a figure.',
      cattleItems: { 'total-cattle': 'Total cattle', 'beef-cows': 'Beef cows', 'dairy-cows': 'Dairy cows', 'total-heifers': 'Heifers', 'calves-under-1-year': 'Calves under 1 year' }, hogsItems: { 'hogs-total': 'Total hogs', 'sows-and-gilts-6-months-and-over': 'Sows and gilts (6 months and over)' }, sheepItems: { 'sheep-and-lambs-total': 'Total sheep and lambs', 'ewes': 'Ewes', 'lambs-for-marketing': 'Lambs for marketing' },
      crops: { 'wheat-all': 'Wheat (all)', 'wheat-durum': 'Durum wheat', barley: 'Barley', oats: 'Oats', 'rye-all': 'Rye', 'canola-rapeseed': 'Canola', 'corn-for-grain': 'Grain corn', soybeans: 'Soybeans', 'peas-dry': 'Dry peas', lentils: 'Lentils', flaxseed: 'Flaxseed', 'sunflower-seed': 'Sunflower seed', 'mustard-seed': 'Mustard seed', 'chick-peas': 'Chickpeas', 'canary-seed': 'Canary seed' },
      no_ca1: 'Local prices: only Manitoba (cattle, sheep and goat auctions and processor hog prices) and Alberta (weekly grains, steers and hogs). For the other provinces we have no local price.', no_ca2: 'Crop insurance: only the province total (all crops plus hail), not by crop or policy.', no_ca3: 'Drought: share of the province, not of your municipality.', no_ca4: 'Costs (fertiliser, diesel, feed) and weather: national or world figures only, not by province.',
      mCa: 'Canada: country detail', mMb: 'Manitoba: livestock and hogs', mRend: 'Canada yields', mGan: 'Canada livestock' },
    fr: { ca: 'Canada', sIns: 'Assurance récolte dans votre province', sDr: 'Sécheresse dans votre province', sProd: 'Votre province pour ce produit', cattle: 'Bovins', hogs: 'Porcs', sheep: 'Ovins', loadingMod: 'Chargement…',
      pNo: 'Nous n\'avons pas de prix local pour {p} en {s}. Ce que nous suivons : le Manitoba (bovins, ovins et caprins aux encans et porcs des transformateurs) et l\'Alberta (prix hebdomadaires des grains, bouvillons et porcs).', pAbNote: 'Revues hebdomadaires d\'Alberta Agriculture and Irrigation (Open Government Licence - Alberta) : offres d\'élévateur ou au comptant et ventes directes de bétail. C\'est un prix d\'Alberta, pas de toute la province ni d\'un élévateur précis. Variations calculées sur notre propre série hebdomadaire.',
      pAbSrc: 'Prix de l\'Alberta', last: 'Dernière semaine', vsW: 'Vs. semaine préc.', vs4: 'Vs. 4 semaines', vsY: 'Vs. il y a un an', noCmp: 'pas de donnée comparable', chart: 'Évolution hebdomadaire',
      ab: { canola_elevador: 'Canola, offre d\'élévateur (centre de l\'Alberta)', trigo_pienso_ab: 'Blé fourrager, offre d\'élévateur', cebada_pienso_ab: 'Orge fourragère, offre d\'élévateur', avena_pienso_ab: 'Avoine fourragère, offre d\'élévateur', trigo_cwrs_ab: 'Blé CWRS n° 1/2, offre moyenne d\'élévateur', lenteja_laird_ab: 'Lentilles Laird n° 1, offre au comptant', guisante_verde_ab: 'Pois verts n° 2, offre au comptant', novillo_ab: 'Bouvillons, ventes directes (poids vif)', cerdo_ab: 'Porcs (carcasse), prix au comptant (Index 100)' },
      insIndem: 'Indemnités de l\'assurance récolte', insHail: 'Indemnités de grêle (assurance privée)', insPrem: 'Primes d\'assurance récolte et grêle payées par les exploitations', insShare: 'du Canada', y: 'Année', mc: 'M $ CA', insVs: 'Vs. année précédente',
      insNote: 'Statistique Canada, tableaux 32-10-0045-01 (paiements de l\'assurance récolte et de l\'assurance privée contre la grêle) et 32-10-0049-01 (dépenses des exploitations en assurance récolte et grêle). Totaux de la province, toutes cultures réunies ; pas un ratio par culture. Milliers de dollars canadiens convertis en millions. Un vide est un chiffre que Statistique Canada ne publie pas.', insNo: 'Aucun chiffre d\'assurance pour cette province.',
      drNow: 'Fin du dernier mois', dr1: 'Il y a 1 mois', dr12: 'Il y a 12 mois', d1: 'D1+ sécheresse modérée ou pire', d2: 'D2+ sécheresse sévère ou pire', d3: 'D3+ sécheresse extrême ou pire', pp: 'pp', drNote: 'Moniteur canadien de la sécheresse (Agriculture et Agroalimentaire Canada et partenaires) : part de la superficie TOTALE de la province (terres et eaux intérieures) dans chaque catégorie, cumulée (D1+ inclut D2 à D4), à la fin de chaque mois. Ce n\'est pas votre municipalité ni votre ferme.', drNo: 'Aucune donnée de sécheresse pour cette province.', drChart: 'Part de la province en D1+ et D2+ (fin de mois)',
      area: 'Superficie ensemencée', harea: 'Superficie récoltée', yl: 'Rendement', prod: 'Production', kha: 'milliers d\'ha', kgha: 'kg/ha', kt: 'milliers de t', rank: 'Rang {r} sur {n} provinces', shareCa: 'du total du Canada', vsPrev: 'Vs. année précédente', year: 'Année',
      pNoCrop: 'Statistique Canada ne publie pas {p} en {s}. Provinces avec données :', stock: 'Inventaires (milliers de têtes)', stockNote: 'Inventaires de bétail de Statistique Canada (enquête semestrielle, janvier et juillet) : animaux vivants, pas un prix. Variation par rapport au même mois un an plus tôt.', cropNote: 'Statistique Canada : superficie, rendement et production par province. La dernière année peut être une estimation ou une prévision tant que la campagne n\'est pas close. Rang et part calculés par Dehesa Index sur les provinces qui publient un chiffre.',
      cattleItems: { 'total-cattle': 'Total bovins', 'beef-cows': 'Vaches de boucherie', 'dairy-cows': 'Vaches laitières', 'total-heifers': 'Génisses', 'calves-under-1-year': 'Veaux de moins d\'un an' }, hogsItems: { 'hogs-total': 'Total porcs', 'sows-and-gilts-6-months-and-over': 'Truies et cochettes (6 mois et plus)' }, sheepItems: { 'sheep-and-lambs-total': 'Total ovins', 'ewes': 'Brebis', 'lambs-for-marketing': 'Agneaux de marché' },
      crops: { 'wheat-all': 'Blé (total)', 'wheat-durum': 'Blé dur', barley: 'Orge', oats: 'Avoine', 'rye-all': 'Seigle', 'canola-rapeseed': 'Canola', 'corn-for-grain': 'Maïs-grain', soybeans: 'Soja', 'peas-dry': 'Pois secs', lentils: 'Lentilles', flaxseed: 'Lin', 'sunflower-seed': 'Tournesol', 'mustard-seed': 'Moutarde', 'chick-peas': 'Pois chiches', 'canary-seed': 'Alpiste' },
      no_ca1: 'Prix locaux : seulement le Manitoba (encans de bovins, ovins et caprins et porcs des transformateurs) et l\'Alberta (grains, bouvillons et porcs hebdomadaires). Pour les autres provinces, nous n\'avons pas de prix local.', no_ca2: 'Assurance récolte : seulement le total de la province (toutes cultures et grêle), pas par culture ni par police.', no_ca3: 'Sécheresse : part de la province, pas de votre municipalité.', no_ca4: 'Coûts (engrais, diesel, aliments) et météo : chiffres nationaux ou mondiaux seulement, pas par province.',
      mCa: 'Canada : détail du pays', mMb: 'Manitoba : bétail et porcs', mRend: 'Rendements du Canada', mGan: 'Élevage du Canada' },
    it: { ca: 'Canada', sIns: 'Assicurazione dei raccolti nella tua provincia', sDr: 'Siccità nella tua provincia', sProd: 'La tua provincia in questo prodotto', cattle: 'Bovini', hogs: 'Suini', sheep: 'Ovini', loadingMod: 'Caricamento…',
      pNo: 'Non abbiamo un prezzo locale per {p} in {s}. Ciò che seguiamo: il Manitoba (bovini, ovini e caprini alle aste e suini dei trasformatori) e l\'Alberta (prezzi settimanali di cereali, manzi e suini).', pAbNote: 'Rassegne settimanali di Alberta Agriculture and Irrigation (Open Government Licence - Alberta): offerte di elevatore o a pronti e vendite dirette di bestiame. È un prezzo dell\'Alberta, non di tutta la provincia né di un elevatore preciso. Variazioni calcolate sulla nostra serie settimanale.',
      pAbSrc: 'Prezzo dell\'Alberta', last: 'Ultima settimana', vsW: 'Vs. settimana prec.', vs4: 'Vs. 4 settimane', vsY: 'Vs. un anno fa', noCmp: 'nessun dato confrontabile', chart: 'Andamento settimanale',
      ab: { canola_elevador: 'Canola, offerta elevatore (Alberta centrale)', trigo_pienso_ab: 'Grano da foraggio, offerta elevatore', cebada_pienso_ab: 'Orzo da foraggio, offerta elevatore', avena_pienso_ab: 'Avena da foraggio, offerta elevatore', trigo_cwrs_ab: 'Grano CWRS n. 1/2, offerta media elevatore', lenteja_laird_ab: 'Lenticchie Laird n. 1, offerta a pronti', guisante_verde_ab: 'Piselli verdi n. 2, offerta a pronti', novillo_ab: 'Manzi, vendite dirette (peso vivo)', cerdo_ab: 'Suini (carcassa), prezzo a pronti (Index 100)' },
      insIndem: 'Indennizzi dell\'assicurazione dei raccolti', insHail: 'Indennizzi grandine (assicurazione privata)', insPrem: 'Premi di assicurazione raccolto e grandine pagati dalle aziende', insShare: 'del Canada', y: 'Anno', mc: 'M C$', insVs: 'Vs. anno precedente',
      insNote: 'Statistics Canada, tabelle 32-10-0045-01 (pagamenti dell\'assicurazione dei raccolti e dell\'assicurazione privata contro la grandine) e 32-10-0049-01 (spesa delle aziende per assicurazione raccolto e grandine). Totali della provincia, tutte le colture insieme; non un rapporto per coltura. Migliaia di dollari canadesi convertite in milioni. Un vuoto è un dato che Statistics Canada non pubblica.', insNo: 'Nessuna cifra assicurativa per questa provincia.',
      drNow: 'Fine dell\'ultimo mese', dr1: '1 mese fa', dr12: '12 mesi fa', d1: 'D1+ siccità moderata o peggio', d2: 'D2+ siccità severa o peggio', d3: 'D3+ siccità estrema o peggio', pp: 'pp', drNote: 'Canadian Drought Monitor (Agriculture and Agri-Food Canada e partner): quota della superficie TOTALE della provincia (terra e acque interne) in ciascuna categoria, cumulata (D1+ include D2-D4), a fine mese. Non è il tuo comune né la tua azienda.', drNo: 'Nessun dato di siccità per questa provincia.', drChart: 'Quota della provincia in D1+ e D2+ (fine mese)',
      area: 'Superficie seminata', harea: 'Superficie raccolta', yl: 'Resa', prod: 'Produzione', kha: 'migliaia di ha', kgha: 'kg/ha', kt: 'migliaia di t', rank: 'Posto {r} su {n} province', shareCa: 'del totale del Canada', vsPrev: 'Vs. anno precedente', year: 'Anno',
      pNoCrop: 'Statistics Canada non pubblica {p} in {s}. Province con dato:', stock: 'Consistenze (migliaia di capi)', stockNote: 'Consistenze di bestiame di Statistics Canada (indagine semestrale, gennaio e luglio): animali vivi, non prezzo. Variazione rispetto allo stesso mese dell\'anno prima.', cropNote: 'Statistics Canada: superficie, resa e produzione per provincia. L\'ultimo anno può essere una stima o previsione finché la campagna non è chiusa. Posto e quota calcolati da Dehesa Index sulle province che pubblicano un dato.',
      cattleItems: { 'total-cattle': 'Totale bovini', 'beef-cows': 'Vacche da carne', 'dairy-cows': 'Vacche da latte', 'total-heifers': 'Giovenche', 'calves-under-1-year': 'Vitelli sotto 1 anno' }, hogsItems: { 'hogs-total': 'Totale suini', 'sows-and-gilts-6-months-and-over': 'Scrofe e scrofette (6 mesi e oltre)' }, sheepItems: { 'sheep-and-lambs-total': 'Totale ovini', 'ewes': 'Pecore', 'lambs-for-marketing': 'Agnelli da macello' },
      crops: { 'wheat-all': 'Frumento (totale)', 'wheat-durum': 'Frumento duro', barley: 'Orzo', oats: 'Avena', 'rye-all': 'Segale', 'canola-rapeseed': 'Canola', 'corn-for-grain': 'Mais da granella', soybeans: 'Soia', 'peas-dry': 'Piselli secchi', lentils: 'Lenticchie', flaxseed: 'Lino', 'sunflower-seed': 'Girasole', 'mustard-seed': 'Senape', 'chick-peas': 'Ceci', 'canary-seed': 'Scagliola' },
      no_ca1: 'Prezzi locali: solo Manitoba (aste di bovini, ovini e caprini e suini dei trasformatori) e Alberta (cereali, manzi e suini settimanali). Per le altre province non abbiamo un prezzo locale.', no_ca2: 'Assicurazione dei raccolti: solo il totale della provincia (tutte le colture e la grandine), non per coltura né per polizza.', no_ca3: 'Siccità: quota della provincia, non del tuo comune.', no_ca4: 'Costi (fertilizzanti, gasolio, mangimi) e meteo: solo cifre nazionali o mondiali, non per provincia.',
      mCa: 'Canada: dettaglio del paese', mMb: 'Manitoba: bestiame e suini', mRend: 'Rese del Canada', mGan: 'Zootecnia del Canada' }
  };
  var CA_LIVE = ['cattle', 'hogs', 'sheep'], CA_CROP_ORDER = ['wheat-all', 'wheat-durum', 'barley', 'oats', 'rye-all', 'canola-rapeseed', 'corn-for-grain', 'soybeans', 'peas-dry', 'lentils', 'flaxseed', 'sunflower-seed', 'mustard-seed', 'chick-peas', 'canary-seed'];
  var CA_AB = { barley: ['cebada_pienso_ab'], oats: ['avena_pienso_ab'], 'wheat-all': ['trigo_cwrs_ab', 'trigo_pienso_ab'], 'canola-rapeseed': ['canola_elevador'], lentils: ['lenteja_laird_ab'], 'peas-dry': ['guisante_verde_ab'], cattle: ['novillo_ab'], hogs: ['cerdo_ab'] };
  var CA_AB_UNIT = { novillo_ab: 'C$/cwt', cerdo_ab: 'C$/kg' };
  function tc() { return TCA[lang()]; }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }); } catch (e) { return v.toFixed(d); } }
  function pc(v) { if (v == null || !isFinite(v)) return '–'; if (Math.abs(v) < 0.05) v = 0; var c = v > 0 ? '#2f6b4a' : v < 0 ? '#a33' : 'inherit'; return '<span style="color:' + c + ';font-weight:600">' + (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1) + ' %</span>'; }
  function pp(v) { if (v == null || !isFinite(v)) return '–'; if (Math.abs(v) < 0.05) v = 0; return (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1) + ' ' + tr().pp; }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function days(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5); }
  function addDays(d, n) { return new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
  function near(pts, date, tol) { var best = null, bd = 1e9; for (var i = 0; i < pts.length; i++) { var dd = Math.abs(days(pts[i][0], date)); if (dd <= tol && dd < bd) { bd = dd; best = pts[i]; } } return best; }
  function pct(a, b) { return (b > 0 && a != null) ? (a / b - 1) * 100 : null; }
  function dt(iso) { try { return new Date(iso + 'T00:00:00Z').toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function get(path) { if (!CACHE[path]) CACHE[path] = fetch(path).then(function (r) { if (!r.ok) throw new Error(path + ' ' + r.status); return r.json(); }).catch(function (e) { delete CACHE[path]; throw e; }); return CACHE[path]; }
  function tile(lab, val, sub) { return '<div class="de-tile"><div class="de-tl">' + esc(lab) + '</div><div class="de-tv">' + val + '</div><div class="de-ts">' + (sub || '&nbsp;') + '</div></div>'; }
  function cite(id, period) { var Q = window.DICite; if (!Q) return ''; var c = Q.html(id, { period: String(period || '') }); return c ? '<div class="pp-cites">' + c + '</div>' : ''; }
  function citeCalc(ids, what) { var Q = window.DICite; if (!Q) return ''; var c = Q.derived(ids, { what: what }); return c ? '<div class="pp-cites">' + c + '</div>' : ''; }
  function note(s) { return '<p class="di-movers-hint">' + esc(s) + '</p>'; }
  function usName(code) { var N = window.DehesaRegionNames && window.DehesaRegionNames.US; var v = N && N[code]; return v ? (v.split('|')[LIDX[lang()]] || v.split('|')[0]) : code; }
  function stateLink(code, p) { return '<a href="?c=US&amp;r=' + code + '&amp;p=' + p + '" data-mm-go="' + code + '">' + esc(usName(code)) + '</a>'; }
  function listStates(codes, p) { return '<p class="di-movers-hint">' + codes.sort(function (a, b) { return usName(a).localeCompare(usName(b), lang()); }).map(function (c) { return stateLink(c, p); }).join(' · ') + '</p>'; }
  var FRAMES = { es: { 'Medium and Large': 'tamaño mediano y grande', 'Large': 'tamaño grande', 'Medium': 'tamaño mediano', 'Small and Medium': 'tamaño pequeño y mediano', 'Small': 'tamaño pequeño' }, fr: { 'Medium and Large': 'gabarit moyen et grand', 'Large': 'grand gabarit', 'Medium': 'gabarit moyen', 'Small and Medium': 'petit et moyen gabarit', 'Small': 'petit gabarit' }, it: { 'Medium and Large': 'telaio medio e grande', 'Large': 'telaio grande', 'Medium': 'telaio medio', 'Small and Medium': 'telaio piccolo e medio', 'Small': 'telaio piccolo' } };
  function frameName(f) { var m = FRAMES[lang()]; return m && m[f] ? m[f] : f; }
  function prodName(p) { return tr()[p] || p; }
  function link(href, label) { return '<a href="' + esc(href) + '" style="display:inline-block;margin:3px 8px 3px 0;padding:4px 12px;border:1px solid var(--border);border-radius:14px;font-size:13px">' + esc(label) + '</a>'; }
  function sect(id, title) { return '<section class="di-card" style="padding:14px 16px;margin:14px 0" data-mm-sec="' + id + '" aria-labelledby="mm-t-' + id + '"><h2 id="mm-t-' + id + '" style="font-size:18px;margin:0 0 6px">' + esc(title) + '</h2><div data-mm-body="' + id + '"><p class="di-movers-hint">' + esc(tr().loading) + '</p></div></section>'; }
  function secBody(id) { return root.querySelector('[data-mm-body="' + id + '"]'); }
  function putSec(tok, id, html) { if (tok !== TOK) return; var b = secBody(id); if (b) b.innerHTML = html; }
  function failSec(tok, id) { putSec(tok, id, '<p class="di-movers-hint" role="status">' + esc(tr().err) + '</p>'); }
  function chart(series, o) {
    if (!window.DehesaChart) return '';
    return window.DehesaChart.render({ series: series, xMode: 'time', yTitle: o.y, aria: o.aria, noLegend: series.length < 2, vFmt: function (v) { return nf(v, o.d == null ? 2 : o.d); }, yFmt: function (v) { return nf(v, 0); },
      xFmt: function (x) { var d = new Date(x); return (d.getUTCMonth() + 1) + '/' + String(d.getUTCFullYear()).slice(2); } });
  }

  /* ---------- estado: URL > localStorage ---------- */
  var ST = { c: '', r: '', p: '', k: '', cl: 'Steers', wb: 0, hc: 'all', se: 0 };
  function readSaved() {
    var s = {}, q = {};
    try { var raw = window.localStorage.getItem(LSK); if (raw) s = JSON.parse(raw) || {}; } catch (e) { s = {}; }
    try { var u = new URLSearchParams(location.search); ['c', 'r', 'p', 'k'].forEach(function (k) { if (u.get(k)) q[k] = u.get(k); }); } catch (e) { q = {}; }
    var o = q.c ? q : s;
    ST.c = o.c === 'US' || o.c === 'ES' || o.c === 'CA' || o.c === 'DE' || o.c === 'UK' ? o.c : ''; ST.r = o.r || ''; ST.p = o.p || ''; ST.k = o.k || '';
  }
  function save() {
    try { window.localStorage.setItem(LSK, JSON.stringify({ c: ST.c, r: ST.r, p: ST.p, k: ST.k })); } catch (e) { /* sin almacenamiento: la página funciona igual */ }
    if (COMPACT) return;
    try { var q = []; if (ST.c) q.push('c=' + ST.c); if (ST.r) q.push('r=' + encodeURIComponent(ST.r)); if (ST.p) q.push('p=' + encodeURIComponent(ST.p)); if (ST.k) q.push('k=' + encodeURIComponent(ST.k)); history.replaceState(null, '', q.length ? '?' + q.join('&') : location.pathname); } catch (e) { /* idem */ }
  }
  function clearSaved() { try { window.localStorage.removeItem(LSK); } catch (e) { /* idem */ } ST.c = ST.r = ST.p = ST.k = ''; save(); }

  /* ---------- selectores ---------- */
  var ES_PROV = null, ES_IDX = null, CAD = null;
  function caName(code) { var N = window.DehesaRegionNames && window.DehesaRegionNames.CA, v = N && N[code]; return v ? (v.split('|')[LIDX[lang()]] || v.split('|')[0]) : code; }
  function caPlaces() { return CAD ? Object.keys(CAD.provinces).filter(function (k) { return k !== 'CA'; }).sort(function (a, b) { return caName(a).localeCompare(caName(b), lang()); }) : []; }
  function caProdName(p) { var c = tc(); return CA_LIVE.indexOf(p) >= 0 ? c[p] : (c.crops[p] || p); }
  function caProducts() { var have = {}; if (CAD) Object.keys(CAD.provinces).forEach(function (k) { Object.keys(CAD.provinces[k].crops || {}).forEach(function (c) { have[c] = 1; }); }); return CA_LIVE.concat(CA_CROP_ORDER.filter(function (c) { return have[c]; })); }
  function usPlaces() { var N = window.DehesaRegionNames && window.DehesaRegionNames.US || {}; return Object.keys(N).sort(function (a, b) { return usName(a).localeCompare(usName(b), lang()); }); }
  function opt(v, l, cur) { return '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(l) + '</option>'; }
  function selectors() {
    var t = tr(), h = '<div class="de-ctl" role="group" aria-label="' + esc(t.title) + '">';
    h += '<label>' + esc(t.country) + '<br><select class="di-compare-select" data-mm="c">' + opt('', t.choose, ST.c) + opt('US', t.us, ST.c) + opt('CA', tc().ca, ST.c) + opt('ES', t.es, ST.c) + opt('DE', TEU[lang()].de, ST.c) + opt('UK', TEU[lang()].uk, ST.c) + '</select></label>';
    if (ST.c === 'US') {
      h += '<label>' + esc(t.place) + '<br><select class="di-compare-select" data-mm="r">' + opt('', t.choose, ST.r) + usPlaces().map(function (k) { return opt(k, usName(k), ST.r); }).join('') + '</select></label>';
      h += '<label>' + esc(t.product) + '<br><select class="di-compare-select" data-mm="p">' + opt('', t.choose, ST.p) + US_PROD.map(function (k) { return opt(k, prodName(k), ST.p); }).join('') + '</select></label>';
    } else if (ST.c === 'CA') {
      h += '<label>' + esc(t.placeES) + '<br><select class="di-compare-select" data-mm="r">' + opt('', t.choose, ST.r) + caPlaces().map(function (k) { return opt(k, caName(k), ST.r); }).join('') + '</select></label>';
      h += '<label>' + esc(t.product) + '<br><select class="di-compare-select" data-mm="p">' + opt('', t.choose, ST.p) + caProducts().map(function (k) { return opt(k, caProdName(k), ST.p); }).join('') + '</select></label>';
    } else if (ST.c === 'DE') {
      var e1 = te();
      h += '<label>' + esc(e1.land) + '<br><select class="di-compare-select" data-mm="r">' + opt('', t.choose, ST.r) + deLands().map(function (k) { return opt(k, deName(k), ST.r); }).join('') + '</select></label>';
      h += '<label>' + esc(e1.crop) + '<br><select class="di-compare-select" data-mm="p">' + opt('', t.choose, ST.p) + DE_CROPS.map(function (k) { return opt(k, pick4(DE_CROPN, k), ST.p); }).join('') + '</select></label>';
    } else if (ST.c === 'UK') {
      var e2 = te();
      h += '<label>' + esc(e2.region) + '<br><select class="di-compare-select" data-mm="r">' + opt('', t.choose, ST.r) + ukRegions().map(function (k) { return opt(k, ukRegName(k), ST.r); }).join('') + '</select></label>';
      h += '<label>' + esc(e2.crop) + '<br><select class="di-compare-select" data-mm="p">' + opt('', t.choose, ST.p) + UK_CROPS.map(function (k) { return opt(k, pick4(UK_CROPN, k), ST.p); }).join('') + '</select></label>';
    } else if (ST.c === 'ES') {
      var provs = ES_PROV ? Object.keys(ES_PROV).sort(function (a, b) { return ES_PROV[a].localeCompare(ES_PROV[b], 'es'); }) : [];
      h += '<label>' + esc(t.placeES) + '<br><select class="di-compare-select" data-mm="r">' + opt('', t.choose, ST.r) + provs.map(function (k) { return opt(k, ES_PROV[k], ST.r); }).join('') + '</select></label>';
      var gs = ES_IDX ? ES_GORDER.filter(function (k) { return ES_IDX.groups[k]; }) : [];
      h += '<label>' + esc(t.group) + '<br><select class="di-compare-select" data-mm="p">' + opt('', t.choose, ST.p) + gs.map(function (k) { return opt(k, t.grp[k] || k, ST.p); }).join('') + '</select></label>';
      h += '<label>' + esc(({ es: 'Buscar cultivo', en: 'Find crop', fr: 'Chercher une culture', it: 'Cerca coltura' })[lang()] || 'Buscar cultivo') + '<br><input type="search" class="di-compare-select" data-mm-filter="mm-crop" autocomplete="off" style="min-width:150px"></label>';
      h += '<label>' + esc(t.crop) + '<br><select class="di-compare-select" data-mm="k" id="mm-crop">' + (ES_CROPS ? ES_CROPS : opt('', t.choose, '')) + '</select></label>';
    }
    return h + '</div>';
  }
  var ES_CROPS = '';

  /* ---------- EE. UU.: precio ---------- */
  var LOCST = null;
  function locStatus() { return LOCST ? Promise.resolve(LOCST) : get(LOC + 'status.json').then(function (s) { LOCST = s; return s; }); }
  function statesOf(kind) { return (LOCST ? LOCST.reports : []).filter(function (r) { return r.kind === kind && r.latest; }).map(function (r) { return r.state; }); }

  function priceCattle(tok) {
    var t = tr();
    return locStatus().then(function () {
      var have = statesOf('cattle');
      if (have.indexOf(ST.r) < 0) { putSec(tok, 'price', note(fill(t.cattleNo, { n: have.length, s: usName(ST.r) })) + listStates(have, 'cattle')); return; }
      return get(LOC + 'cattle-' + ST.r + '.json').then(function (doc) {
        if (tok !== TOK) return;
        var L = doc.latest, hist = doc.history, avail = ['Steers', 'Heifers', 'Bulls'].filter(function (c) { return Object.keys(hist).some(function (k) { return k.indexOf(c + '|') === 0; }); });
        if (avail.indexOf(ST.cl) < 0) ST.cl = avail[0];
        var wbs = Object.keys(hist).filter(function (k) { return k.indexOf(ST.cl + '|') === 0 && days(hist[k][hist[k].length - 1][0], L.date) <= 28; }).map(function (k) { return +k.split('|')[1]; }).sort(function (a, b) { return a - b; });
        var h = '<p class="di-movers-hint">' + esc(t.lastRep) + ': ' + esc(dt(L.date)) + ' · <a href="' + esc(doc.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.report) + ' (' + esc(doc.source.reportId) + ')</a></p>';
        if (!wbs.length) { putSec(tok, 'price', h + note(t.noCmp)); return; }
        if (wbs.indexOf(ST.wb) < 0) ST.wb = wbs.indexOf(500) >= 0 ? 500 : wbs[0];
        var hi = {}; L.rows.forEach(function (r) { if (r[1] === ST.cl && r[6] != null && r[7] != null) hi[r[6]] = r[7]; });
        h += '<div class="de-ctl"><span><span class="di-movers-hint">' + esc(t.cls) + '</span><br><span class="di-src-tabs" role="group">' + avail.map(function (c) { return '<button type="button" class="di-src-tab" data-mm-cl="' + c + '" aria-pressed="' + (c === ST.cl) + '">' + esc(t[c]) + '</button>'; }).join('') + '</span></span>' +
          '<label>' + esc(t.wb) + '<br><select class="di-compare-select" data-mm-wb="1">' + wbs.map(function (w) { return opt(w, w + (hi[w] != null ? '–' + hi[w] : '+') + ' ' + t.lb, ST.wb); }).join('') + '</select></label></div>';
        var pts = hist[ST.cl + '|' + ST.wb], last = pts[pts.length - 1], prev = near(pts, addDays(last[0], -7), 3), p4 = near(pts, addDays(last[0], -28), 5), yr = near(pts, addDays(last[0], -364), 10);
        var cmp = function (x) { return x ? pc(pct(last[1], x[1])) : '<span class="di-movers-hint">' + esc(t.noCmp) + '</span>'; };
        h += '<div class="de-tiles">' + tile(t[ST.cl] + ' · ' + t.usdcwt, nf(last[1], 2), esc(dt(last[0])) + ' · ' + esc(t.head) + ' ' + nf(last[2], 0) + (last[3] ? ' · ' + esc(t.avgw) + ' ' + nf(last[3], 0) + ' ' + t.lb : '')) +
          tile(t.vsW, cmp(prev), prev ? esc(dt(prev[0])) + ': ' + nf(prev[1], 2) : '') + tile(t.vs4, cmp(p4), p4 ? esc(dt(p4[0])) + ': ' + nf(p4[1], 2) : '') + tile(t.vsY, cmp(yr), yr ? esc(dt(yr[0])) + ': ' + nf(yr[1], 2) : '') + '</div>';
        if (pts.length > 1) h += chart([{ name: t.usdcwt, color: '#2f6b4a', pts: pts.map(function (p) { return { x: Date.parse(p[0] + 'T00:00:00Z'), y: p[1], l: p[0] + ' · ' + p[2] + ' ' + t.head.toLowerCase() }; }) }], { y: t.usdcwt, aria: t.cattle + ' ' + usName(ST.r) + ' ' + t[ST.cl], d: 2 });
        h += note(fill(t.cattleNote, { f: frameName(doc.headline.frame), g: doc.headline.grade }) + ' ' + t.cwtNote) + cite('usda_ams_mars', L.date);
        putSec(tok, 'price', h);
      });
    });
  }

  function priceHay(tok) {
    var t = tr();
    return locStatus().then(function () {
      var have = statesOf('hay');
      if (have.indexOf(ST.r) < 0) { putSec(tok, 'price', note(fill(t.hayNo, { n: have.length, s: usName(ST.r) })) + listStates(have, 'hay')); return; }
      return get(LOC + 'hay-' + ST.r + '.json').then(function (doc) {
        if (tok !== TOK) return;
        var L = doc.latest, hist = doc.history, rows = L.rows.filter(function (r) { return r[3] === 'Per Ton'; });
        var classes = []; rows.forEach(function (r) { if (classes.indexOf(r[0]) < 0) classes.push(r[0]); }); classes.sort();
        if (ST.hc !== 'all' && classes.indexOf(ST.hc) < 0) ST.hc = 'all';
        var sel = rows.filter(function (r) { return ST.hc === 'all' || r[0] === ST.hc; }).sort(function (a, b) { return (b[11] || 0) - (a[11] || 0); }).slice(0, 8);
        var h = '<p class="di-movers-hint">' + esc(t.lastRep) + ': ' + esc(dt(L.date)) + ' · <a href="' + esc(doc.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.report) + ' (' + esc(doc.source.reportId) + ')</a></p>';
        h += '<div class="de-ctl"><label>' + esc(t.hayCls) + '<br><select class="di-compare-select" data-mm-hc="1">' + opt('all', '—', ST.hc) + classes.map(function (c) { return opt(c, c, ST.hc); }).join('') + '</select></label></div>';
        if (!sel.length) { putSec(tok, 'price', h + note(t.noCmp)); return; }
        h += '<p class="di-movers-hint" style="margin:6px 0 2px"><b>' + esc(fill(t.hayRows, { n: sel.length })) + '</b></p><div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(t.hayCls) + '</th><th scope="col">' + esc(t.hQ) + ' · ' + esc(t.hP) + '</th><th scope="col">' + esc(t.hR) + '</th><th scope="col">' + esc(t.hS) + '</th><th scope="col" class="r">' + esc(t.hAvg) + ' (' + esc(t.hayUnit) + ')</th><th scope="col" class="r">' + esc(t.hRng) + '</th><th scope="col" class="r">' + esc(t.hQty) + '</th><th scope="col" class="r">' + esc(t.hChg) + '</th></tr></thead><tbody>';
        sel.forEach(function (r) {
          var key = r.slice(0, 11).join('|'), p = hist[key] || [], n = p.length, ch = null;
          if (n > 1 && p[n - 1][0] === L.date) ch = pct(p[n - 1][3], p[n - 2][3]);
          h += '<tr><td>' + esc(r[0]) + '</td><td>' + esc([r[1], r[2]].filter(function (x) { return x; }).join(' · ')) + '</td><td>' + esc([r[6], r[7], r[8]].filter(function (x) { return x; }).join(' · ')) + '</td><td>' + esc([r[4], r[5]].filter(function (x) { return x; }).join(' · ')) + '</td><td class="r"><b>' + nf(r[14], 2) + '</b></td><td class="r">' + nf(r[12], 0) + '–' + nf(r[13], 0) + '</td><td class="r">' + (r[11] != null ? nf(r[11], 0) : '–') + '</td><td class="r">' + (ch == null ? '–' : pc(ch)) + '</td></tr>';
        });
        h += '</tbody></table></div>' + note(t.hayNote) + cite('usda_ams_mars', L.date);
        putSec(tok, 'price', h);
      });
    });
  }

  var FRESH_OK = { LIVE: 1, FRESH: 1, EXPECTED_DELAY: 1, DELAYED: 1 }, LT_ORD = { ELEVATOR: 0, CITY: 1, REGION: 2, STATE: 3, TERMINAL: 4, EXPORT_MARKET: 5 };
  function grainMissing(tok, p) {
    var t = tr();
    return get(GR + 'manifest.json').then(function (m) {
      var c = m.commodities && m.commodities[p], st = c ? c.states.filter(function (s) { return m.states[s] && /^[A-Z]{2}$/.test(s) && window.DehesaRegionNames && window.DehesaRegionNames.US[s]; }) : [];
      putSec(tok, 'price', note(fill(t.grainNo, { p: prodName(p).toLowerCase(), s: usName(ST.r) })) + listStates(st, p));
    });
  }
  function priceGrain(tok) {
    var t = tr(), p = ST.p;
    return get(GR + 'manifest.json').then(function (m) {
      var has = m.states && m.states[ST.r] && m.states[ST.r].commodities && m.states[ST.r].commodities[p];
      if (!has) return null;
      return get(GR + ST.r + '/' + p + '.json');
    }).then(function (doc) {
      if (!doc) return grainMissing(tok, p);
      if (tok !== TOK) return;
      var all = doc.series.slice(), cur = all.filter(function (s) { return FRESH_OK[s.freshness]; }), old = false;
      if (!cur.length) { cur = all.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 12); old = true; }
      cur.sort(function (a, b) { return (LT_ORD[a.locationType] != null ? LT_ORD[a.locationType] : 9) - (LT_ORD[b.locationType] != null ? LT_ORD[b.locationType] : 9) || String(a.locationName).localeCompare(String(b.locationName)) || String(a.grade).localeCompare(String(b.grade)); });
      var spec = function (s) { return [s.commodityClass, s.grade, s.deliveryPeriod, s.deliveryPoint, s.protein].filter(function (x) { return x; }).join(' · '); };
      var mk = function (s) { return String(s.locationName) + ' (' + (t['t' + s.locationType] || String(s.locationType).toLowerCase()) + ')'; };
      var row = function (s, i) {
        var bs = s.bLo == null ? '–' : (s.bLo === s.bHi || s.bHi == null ? nf(s.bLo, 0) : nf(s.bLo, 0) + ' / ' + nf(s.bHi, 0)) + ' ' + esc(s.basisUnit || '') + (s.futuresContract ? ' <span class="di-movers-hint">' + esc(s.futuresContract) + '</span>' : '');
        var bid = s.avg != null ? '<b>' + nf(s.avg, 2) + '</b>' + (s.lo != null && s.hi != null && s.lo !== s.hi ? ' <span class="di-movers-hint">' + nf(s.lo, 2) + '–' + nf(s.hi, 2) + '</span>' : '') : (s.lo != null ? nf(s.lo, 2) + '–' + nf(s.hi, 2) : '–');
        return '<tr><td>' + esc(mk(s)) + '</td><td>' + esc(spec(s)) + '</td><td class="r">' + bid + ' <span class="di-movers-hint">' + esc(s.currency || '') + '/' + esc(s.unit || '') + '</span></td><td class="r">' + bs + '</td><td class="r">' + (s.changePct == null ? '–' : pc(s.changePct)) + '</td><td class="r">' + esc(dt(s.date)) + '</td></tr>';
      };
      var head = '<thead><tr><th scope="col">' + esc(t.gMk) + '</th><th scope="col">' + esc(t.gSpec) + '</th><th scope="col" class="r">' + esc(t.gBid) + '</th><th scope="col" class="r">' + esc(t.gBasis) + '</th><th scope="col" class="r">' + esc(t.gChg) + '</th><th scope="col" class="r">' + esc(t.gDate) + '</th></tr></thead>';
      var h = old ? '<p class="di-movers-hint" role="status">' + esc(t.gOld) + '</p>' : '';
      h += '<div class="de-sc"><table class="de-t" data-no-cards>' + head + '<tbody>' + cur.slice(0, 8).map(row).join('') + '</tbody></table></div>';
      if (cur.length > 8) h += '<details><summary style="cursor:pointer;font-size:13px">' + esc(fill(t.gMore, { n: cur.length })) + '</summary><div class="de-sc"><table class="de-t" data-no-cards>' + head + '<tbody>' + cur.slice(8).map(row).join('') + '</tbody></table></div></details>';
      if (ST.se >= cur.length || ST.se < 0) ST.se = 0;
      var s0 = cur[ST.se];
      h += '<div class="de-ctl"><label>' + esc(t.gSeries) + '<br><select class="di-compare-select" data-mm-se="1">' + cur.map(function (s, i) { return opt(i, mk(s) + (spec(s) ? ' · ' + spec(s) : ''), ST.se); }).join('') + '</select></label></div>';
      var pts = (s0.pts || []).filter(function (x) { return x[1] != null; }).map(function (x) { return { x: Date.parse(x[0] + 'T00:00:00Z'), y: x[1], l: x[0] }; });
      if (pts.length > 1) h += chart([{ name: t.gBid, color: '#2f6b4a', pts: pts }], { y: (s0.currency || 'USD') + '/' + (s0.unit || ''), aria: prodName(p) + ' ' + usName(ST.r) + ' ' + mk(s0), d: 2 });
      h += note(t.gNote) + cite('usda_ams_mars', cur.reduce(function (m, s) { return s.date > m ? s.date : m; }, ''));
      putSec(tok, 'price', h);
    });
  }

  /* ---------- EE. UU.: seguro y sequía ---------- */
  function usdM(v) { var m = v / 1e6; return '$' + nf(m, Math.abs(m) >= 1000 ? 0 : 1) + ' M'; }
  function insurance(tok) {
    var t = tr();
    return get('data/crop-insurance.json').then(function (d) {
      var s = d.states[ST.r];
      if (!s) { putSec(tok, 'ins', note(t.insNo)); return; }
      var ly = String(d.latestCompleteYear), a = s[ly], n = d.national[ly];
      if (!a) { putSec(tok, 'ins', note(t.insNo)); return; }
      var r = function (x) { return x && x[1] > 0 ? x[3] / x[1] : null; };
      var h = '<div class="de-tiles">' + tile(t.indem + ' · ' + ly, usdM(a[3]), esc(t.ratio) + ': <b>' + (r(a) == null ? '–' : nf(r(a), 2)) + '</b> · ' + esc(t.vsNat) + ' ' + (r(n) == null ? '–' : nf(r(n), 2))) +
        tile(t.prem + ' · ' + ly, usdM(a[1]), esc(t.subs) + ': ' + usdM(a[2]) + ' (' + (a[1] > 0 ? nf(a[2] / a[1] * 100, 0) : '–') + ' %)') + tile(t.farmerP + ' · ' + ly, usdM(a[1] - a[2]), esc(t.pol) + ': ' + nf(a[4], 0)) + '</div>';
      var yrs = d.cropYears.filter(function (y) { return s[String(y)]; }).slice(-6).reverse();
      h += '<div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(t.y) + '</th><th scope="col" class="r">' + esc(t.prem) + '</th><th scope="col" class="r">' + esc(t.indem) + '</th><th scope="col" class="r">' + esc(t.ratio) + '</th><th scope="col" class="r">' + esc(t.natCol) + '</th></tr></thead><tbody>' + yrs.map(function (y) {
        var x = s[String(y)], nn = d.national[String(y)], prov = y > d.latestCompleteYear;
        return '<tr><td>' + y + (prov ? ' <span class="di-movers-hint">(' + esc(t.prov) + ')</span>' : '') + '</td><td class="r">' + usdM(x[1]) + '</td><td class="r">' + usdM(x[3]) + '</td><td class="r"><b>' + (r(x) == null ? '–' : nf(r(x), 2)) + '</b></td><td class="r">' + (r(nn) == null ? '–' : nf(r(nn), 2)) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
      h += note(t.insNote) + cite('usda_rma', ly) + citeCalc(['usda_rma'], 'premium − subsidy; indemnity ÷ premium');
      putSec(tok, 'ins', h);
    });
  }

  function drought(tok) {
    var t = tr();
    return get('data/drought.json').then(function (d) {
      var rows = d.states && d.states[ST.r];
      if (!rows || !rows.length) { putSec(tok, 'dr', note(t.drNo)); return; }
      var last = rows[rows.length - 1], ts = last[0];
      var at = function (n) { return near(rows, addDays(ts, -n), 4); }, a4 = at(28), ay = at(364);
      var ds = [[1, t.d1], [2, t.d2], [3, t.d3]];
      var h = '<p class="di-movers-hint">' + esc(t.drWeek) + ' ' + esc(dt(ts)) + '</p><div class="de-tiles">' + ds.map(function (c) {
        var i = c[0] + 1, v = last[i], sub = (a4 ? esc(t.dr4) + ': ' + nf(a4[i], 1) + ' % (' + pp(v - a4[i]) + ')' : '') + (ay ? '<br>' + esc(t.drY) + ': ' + nf(ay[i], 1) + ' % (' + pp(v - ay[i]) + ')' : '');
        return tile(c[1], nf(v, 1) + ' %', sub);
      }).join('') + '</div>';
      var win = rows.slice(-157);
      h += chart([{ name: 'D1+', color: '#c9822b', pts: win.map(function (r) { return { x: Date.parse(r[0] + 'T00:00:00Z'), y: r[2], l: r[0] }; }) }, { name: 'D2+', color: '#a33', pts: win.map(function (r) { return { x: Date.parse(r[0] + 'T00:00:00Z'), y: r[3], l: r[0] }; }) }], { y: t.pctArea, aria: t.drChart + ' ' + usName(ST.r), d: 1 });
      h += note(t.drNote) + cite('us_drought_monitor', ts);
      putSec(tok, 'dr', h);
    });
  }


  /* ---------- Canadá ---------- */
  function mountMod(tok, id, src, glob, kind) {
    var b = secBody(id); if (!b || tok !== TOK) return;
    b.innerHTML = '<div data-mm-mod="1"><p class="di-movers-hint">' + esc(tc().loadingMod) + '</p></div>';
    var go = function () { var d = b.querySelector('[data-mm-mod]'); if (tok === TOK && d && window[glob]) window[glob].mount(d, lang(), kind); };
    if (window[glob]) go(); else { var sc = document.createElement('script'); sc.src = src; sc.onload = go; sc.onerror = function () { failSec(tok, id); }; document.head.appendChild(sc); }
  }
  function caList(p) {
    if (!CAD) return '';
    var have = Object.keys(CAD.provinces).filter(function (k) { return k !== 'CA' && CAD.provinces[k].crops && CAD.provinces[k].crops[p]; });
    return '<p class="di-movers-hint">' + have.sort(function (a, b) { return caName(a).localeCompare(caName(b), lang()); }).map(function (c) { return '<a href="?c=CA&amp;r=' + c + '&amp;p=' + encodeURIComponent(p) + '" data-mm-go="' + c + '">' + esc(caName(c)) + '</a>'; }).join(' · ') + '</p>';
  }
  function priceCa(tok) {
    var t = tr(), c = tc(), p = ST.p, keys = ST.r === 'AB' ? CA_AB[p] : null;
    if (ST.r === 'MB' && p === 'cattle') { mountMod(tok, 'price', 'js/mb-cattle.js?v=20261003', 'MBCattle'); return; }
    if (ST.r === 'MB' && p === 'sheep') { mountMod(tok, 'price', 'js/mb-smallstock.js?v=20261004', 'MBSmall', 'sg'); return; }
    if (ST.r === 'MB' && p === 'hogs') { mountMod(tok, 'price', 'js/mb-smallstock.js?v=20261004', 'MBSmall', 'hog'); return; }
    if (!keys) { putSec(tok, 'price', note(fill(c.pNo, { p: caProdName(p).toLowerCase(), s: caName(ST.r) }))); return; }
    return get('data/alberta-weekly.json').then(function (d) {
      if (tok !== TOK) return;
      var ds = Object.keys(d.issues).sort(), h = '', lastAll = '';
      keys.forEach(function (k) {
        var pts = []; ds.forEach(function (x) { var iss = d.issues[x], v = iss.crop && iss.crop[k] != null ? iss.crop[k] : (iss.livestock && iss.livestock[k] != null ? iss.livestock[k] : null); if (v != null) pts.push([x, v]); });
        if (!pts.length) return;
        var last = pts[pts.length - 1], prev = near(pts, addDays(last[0], -7), 3), p4 = near(pts, addDays(last[0], -28), 5), yr = near(pts, addDays(last[0], -364), 10), u = CA_AB_UNIT[k] || 'C$/t', dec = u === 'C$/kg' ? 3 : 2;
        var cmp = function (x) { return x ? pc(pct(last[1], x[1])) : '<span class="di-movers-hint">' + esc(c.noCmp) + '</span>'; };
        lastAll = last[0] > lastAll ? last[0] : lastAll;
        h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + esc(c.ab[k]) + '</b></p><div class="de-tiles">' + tile(c.last + ' · ' + u, nf(last[1], dec), esc(dt(last[0]))) + tile(c.vsW, cmp(prev), prev ? esc(dt(prev[0])) + ': ' + nf(prev[1], dec) : '') +
          tile(c.vs4, cmp(p4), p4 ? esc(dt(p4[0])) + ': ' + nf(p4[1], dec) : '') + tile(c.vsY, cmp(yr), yr ? esc(dt(yr[0])) + ': ' + nf(yr[1], dec) : '') + '</div>';
        if (pts.length > 1) h += chart([{ name: c.ab[k], color: '#2f6b4a', pts: pts.map(function (x) { return { x: Date.parse(x[0] + 'T00:00:00Z'), y: x[1], l: x[0] }; }) }], { y: u, aria: c.chart + ' ' + c.ab[k], d: dec });
      });
      putSec(tok, 'price', (h || note(fill(c.pNo, { p: caProdName(p).toLowerCase(), s: caName(ST.r) }))) + (h ? note(c.pAbNote) + cite('alberta_ag', lastAll) : ''));
    });
  }
  function mc(v) { return v == null ? '–' : nf(v / 1000, Math.abs(v) >= 1e5 ? 0 : 1) + ' ' + tc().mc; }
  function insuranceCa(tok) {
    var c = tc();
    return get('data/crop-insurance-ca.json').then(function (d) {
      var s = d.data[ST.r], n = d.data.CA;
      if (!s) { putSec(tok, 'ins', note(c.insNo)); return; }
      var yi = d.years.length - 1; while (yi >= 0 && s.indemnities[yi] == null && s.farmPremiums[yi] == null) yi--;
      if (yi < 0) { putSec(tok, 'ins', note(c.insNo)); return; }
      var yr = d.years[yi], share = function (m) { return s[m][yi] != null && n[m][yi] > 0 ? nf(s[m][yi] / n[m][yi] * 100, 1) + ' % ' + c.insShare : ''; };
      var vs = function (m) { return yi > 0 && s[m][yi] != null && s[m][yi - 1] > 0 ? esc(c.insVs) + ': ' + pc(pct(s[m][yi], s[m][yi - 1])) : ''; };
      var h = '<div class="de-tiles">' + [['indemnities', c.insIndem], ['hailIndemnities', c.insHail], ['farmPremiums', c.insPrem]].map(function (m) { return tile(m[1] + ' · ' + yr, mc(s[m[0]][yi]), [esc(share(m[0])), vs(m[0])].filter(function (x) { return x; }).join('<br>')); }).join('') + '</div>';
      var rows = d.years.map(function (y, i) { return i; }).slice(-6).reverse();
      h += '<div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(c.y) + '</th><th scope="col" class="r">' + esc(c.insIndem) + '</th><th scope="col" class="r">' + esc(c.insHail) + '</th><th scope="col" class="r">' + esc(c.insPrem) + '</th></tr></thead><tbody>' +
        rows.map(function (i) { return '<tr><td>' + d.years[i] + '</td><td class="r">' + mc(s.indemnities[i]) + '</td><td class="r">' + mc(s.hailIndemnities[i]) + '</td><td class="r">' + mc(s.farmPremiums[i]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      h += note(c.insNote) + cite('statcan', yr);
      putSec(tok, 'ins', h);
    });
  }
  function droughtCa(tok) {
    var c = tc();
    return get('data/canada-drought.json').then(function (d) {
      var pr = d.provinces && d.provinces[ST.r];
      if (!pr || !pr.v || !pr.v.length) { putSec(tok, 'dr', note(c.drNo)); return; }
      var n = pr.v.length, last = pr.v[n - 1], p1 = n > 1 ? pr.v[n - 2] : null, p12 = n > 12 ? pr.v[n - 13] : null, per = d.periods[n - 1] || d.asOf;
      var ds = [[1, c.d1], [2, c.d2], [3, c.d3]];
      var pp2 = function (v) { if (v == null || !isFinite(v)) return '–'; if (Math.abs(v) < 0.05) v = 0; return (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1) + ' ' + c.pp; };
      var h = '<p class="di-movers-hint">' + esc(c.drNow) + ': ' + esc(dt(per)) + '</p><div class="de-tiles">' + ds.map(function (x) {
        var i = x[0], v = last[i], sub = (p1 ? esc(c.dr1) + ': ' + nf(p1[i], 1) + ' % (' + pp2(v - p1[i]) + ')' : '') + (p12 ? '<br>' + esc(c.dr12) + ': ' + nf(p12[i], 1) + ' % (' + pp2(v - p12[i]) + ')' : '');
        return tile(x[1], nf(v, 1) + ' %', sub);
      }).join('') + '</div>';
      var xs = function (i) { return Date.parse(d.periods[i] + 'T00:00:00Z'); };
      if (n > 1) h += chart([{ name: 'D1+', color: '#c9822b', pts: pr.v.map(function (r, i) { return { x: xs(i), y: r[1], l: d.periods[i] }; }) }, { name: 'D2+', color: '#a33', pts: pr.v.map(function (r, i) { return { x: xs(i), y: r[2], l: d.periods[i] }; }) }], { y: '%', aria: c.drChart + ' ' + caName(ST.r), d: 1 });
      h += note(c.drNote) + cite('aafc_drought', per);
      putSec(tok, 'dr', h);
    });
  }
  function lastOf(a) { return a && a.length ? a[a.length - 1] : null; }
  function prodCa(tok) {
    var c = tc(), P = CAD.provinces[ST.r], p = ST.p;
    if (CA_LIVE.indexOf(p) >= 0) {
      var grp = P[p], items = p === 'cattle' ? c.cattleItems : p === 'hogs' ? c.hogsItems : c.sheepItems;
      if (!grp) { putSec(tok, 'crop', note(c.insNo)); return; }
      var tl = '', lastP = '';
      Object.keys(items).forEach(function (k) {
        var s = grp[k]; if (!s || !s.pts || !s.pts.length) return;
        var l = lastOf(s.pts), py = l[0].replace(/^(\d{4})/, function (m) { return String(+m - 1); }), pv = null; s.pts.forEach(function (x) { if (x[0] === py) pv = x[1]; });
        lastP = l[0] > lastP ? l[0] : lastP;
        tl += tile(items[k], nf(l[1], l[1] < 100 ? 1 : 0), esc(l[0]) + (pv != null ? '<br>' + esc(c.vsPrev) + ': ' + pc(pct(l[1], pv)) : ''));
      });
      putSec(tok, 'crop', '<p class="di-movers-hint"><b>' + esc(c.stock) + '</b> · ' + esc(caName(ST.r)) + '</p><div class="de-tiles">' + tl + '</div>' + note(c.stockNote) + cite('statcan', lastP));
      return;
    }
    var cr = P.crops && P.crops[p];
    if (!cr) { putSec(tok, 'crop', note(fill(c.pNoCrop, { p: caProdName(p).toLowerCase(), s: caName(ST.r) })) + caList(p)); return; }
    var yr = lastOf(cr.prod || cr.area || []); yr = yr && yr[0]; if (!yr) { putSec(tok, 'crop', note(fill(c.pNoCrop, { p: caProdName(p).toLowerCase(), s: caName(ST.r) })) + caList(p)); return; }
    var at = function (a, y) { var v = null; (a || []).forEach(function (x) { if (x[0] === y) v = x[1]; }); return v; }, py = String(+yr - 1);
    var peers = Object.keys(CAD.provinces).filter(function (k) { return k !== 'CA' && CAD.provinces[k].crops && CAD.provinces[k].crops[p] && at(CAD.provinces[k].crops[p].prod, yr) != null; }).map(function (k) { return { k: k, v: at(CAD.provinces[k].crops[p].prod, yr) }; }).sort(function (a, b) { return b.v - a.v; });
    var tot = peers.reduce(function (m, x) { return m + x.v; }, 0), rank = peers.map(function (x) { return x.k; }).indexOf(ST.r) + 1;
    var m = function (key, lab, unit, dec) { var v = at(cr[key], yr), q = at(cr[key], py); if (v == null) return ''; return tile(lab + ' · ' + yr, nf(v, dec) + ' <span class="di-movers-hint">' + esc(unit) + '</span>', q != null && q > 0 ? esc(c.vsPrev) + ': ' + pc(pct(v, q)) : ''); };
    var h = '<div class="de-tiles">' + m('area', c.area, c.kha, 1) + m('harea', c.harea, c.kha, 1) + m('yield', c.yl, c.kgha, 0) + m('prod', c.prod, c.kt, 1) + '</div>';
    if (rank) h += '<p class="di-movers-hint">' + esc(fill(c.rank, { r: rank, n: peers.length })) + (tot > 0 ? ' · ' + nf(at(cr.prod, yr) / tot * 100, 1) + ' % ' + esc(c.shareCa) : '') + '</p>';
    putSec(tok, 'crop', h + note(c.cropNote) + cite('statcan', yr) + citeCalc(['statcan'], 'rank and share of provincial production'));
  }

  /* ---------- España: cultivo en tu provincia ---------- */
  function spainGroup(g) { return get(SC + ES_IDX.groups[g].file); }
  function yl(a) { return a && a[3] > 0 && a[4] != null ? a[4] / a[3] : null; }
  function big(v, u) { return v == null ? '–' : (v >= 1e6 ? nf(v / 1e6, 2) + ' M ' : nf(v, 0) + ' ') + u; }
  function cropOptions(g) {
    var camps = Object.keys(g.campaigns).sort(), camp = camps[camps.length - 1], crops = g.campaigns[camp].crops;
    var cur = crops.filter(function (x) { return x.c === ST.k; })[0];
    if (!cur) { cur = crops.filter(function (x) { return x.v && x.v[ST.r]; })[0] || crops[0]; ST.k = cur.c; }
    ES_CROPS = opt('', tr().choose, '') + crops.map(function (x) { var pad = ''; for (var i = 0; i < x.l; i++) pad += '  '; return '<option value="' + esc(x.c) + '"' + (x.c === ST.k ? ' selected' : '') + '>' + pad + esc(x.n) + '</option>'; }).join('');
    return { camps: camps, camp: camp, crops: crops, cur: cur };
  }
  function spainCrop(tok) {
    var t = tr();
    return spainGroup(ST.p).then(function (g) {
      if (tok !== TOK) return;
      var o = cropOptions(g), cur = o.cur, camp = o.camp, prevC = o.camps[o.camps.indexOf(camp) - 1], pv = prevC && g.campaigns[prevC].crops.filter(function (x) { return x.c === cur.c; })[0];
      var sel = document.getElementById('mm-crop'); if (sel) sel.innerHTML = ES_CROPS;
      var a = cur.v[ST.r], pn = g.provinces[ST.r] || ST.r, h = '';
      var topAll = Object.keys(cur.v).map(function (p) { return { p: p, v: cur.v[p][0] }; }).filter(function (x) { return x.v > 0; }).sort(function (x, y) { return y.v - x.v; });
      var tbl = function (hl) {
        var rows = topAll.slice(0, 5); if (hl && !rows.some(function (x) { return x.p === hl; })) { var me = topAll.filter(function (x) { return x.p === hl; })[0]; if (me) rows.push(me); }
        return '<p class="di-movers-hint" style="margin:8px 0 2px"><b>' + esc(t.topP) + ' · ' + esc(camp) + '</b></p><div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(t.provT) + '</th><th scope="col" class="r">' + esc(t.area) + '</th><th scope="col" class="r">' + esc(t.shareES) + '</th></tr></thead><tbody>' + rows.map(function (x) {
          return '<tr' + (x.p === hl ? ' style="font-weight:700"' : '') + '><td>' + esc(g.provinces[x.p]) + '</td><td class="r">' + big(x.v, t.ha) + '</td><td class="r">' + (cur.t[0] ? nf(x.v / cur.t[0] * 100, 1) + ' %' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      };
      h += '<p class="di-movers-hint"><b>' + esc(cur.n) + '</b> · ' + esc(pn) + ' · ' + esc(t.camp) + ' ' + esc(camp) + ' · ' + esc(t.provisional) + '</p>';
      if (!a || !(a[0] > 0)) { h += note(fill(t.cropNo, { c: cur.n, p: pn, k: camp })) + tbl(null); }
      else {
        var rank = topAll.map(function (x) { return x.p; }).indexOf(ST.r) + 1, dv = function (x, y) { return x != null && y != null && y > 0 ? esc(t.vsC + ' ' + prevC) + ': ' + pc((x / y - 1) * 100) : ''; }, pa = pv && pv.v[ST.r];
        var y0 = yl(a), yN = yl(cur.t);
        h += '<div class="de-tiles">' + tile(t.area, big(a[0], t.ha), esc(fill(t.rank, { r: rank, n: topAll.length })) + ' · ' + nf(a[0] / cur.t[0] * 100, 1) + ' % ' + esc(t.shareES) + (pa ? '<br>' + dv(a[0], pa[0]) : ''));
        if (a[1] != null && a[2] != null) h += tile(t.irr, nf(a[2] / a[0] * 100, 0) + ' %', big(a[2], t.ha));
        if (a[4] != null) h += tile(t.prd, big(a[4], t.t), pa ? dv(a[4], pa[4]) : '');
        if (y0 != null) h += tile(t.yl, nf(y0, y0 < 10 ? 2 : 1) + ' ' + t.th, yN != null ? esc(t.natAvg) + ': ' + nf(yN, yN < 10 ? 2 : 1) + ' ' + t.th : '');
        h += '</div>' + tbl(ST.r);
      }
      h += note(t.cropNote) + cite('mapa_es', camp) + (cur.t && yl(cur.t) != null ? citeCalc(['mapa_es'], 'production ÷ harvested area (MAPA)') : '');
      putSec(tok, 'crop', h);
    });
  }

  /* ---------- Alemania y Reino Unido: producción por Land / región (Destatis, Defra) + tierra en Alemania ---------- */
  var DEF = null, UKD = null;
  var DE_CROPS = ['wheat', 'rye', 'barley', 'oats', 'triticale', 'maize', 'rapeseed', 'sunflower', 'sugarbeet', 'potato', 'silage', 'cereals'];
  var DE_CROPN = { cereals: 'Cereals (incl. grain maize)|Cereales (con maíz grano)|Céréales (avec maïs grain)|Cereali (con mais da granella)', wheat: 'Wheat|Trigo|Blé|Frumento', rye: 'Rye|Centeno|Seigle|Segale', barley: 'Barley|Cebada|Orge|Orzo', oats: 'Oats|Avena|Avoine|Avena', triticale: 'Triticale|Triticale|Triticale|Triticale', maize: 'Grain maize|Maíz grano|Maïs grain|Mais da granella', rapeseed: 'Rapeseed|Colza|Colza|Colza', sunflower: 'Sunflower|Girasol|Tournesol|Girasole', sugarbeet: 'Sugar beet|Remolacha azucarera|Betterave sucrière|Barbabietola da zucchero', potato: 'Potatoes|Patata|Pommes de terre|Patate', silage: 'Silage maize|Maíz forrajero|Maïs fourrage|Mais da foraggio' };
  var UK_CROPS = ['wheat', 'barley', 'winter-barley', 'spring-barley', 'oats', 'oilseed-rape'];
  var UK_CROPN = { wheat: 'Wheat|Trigo|Blé|Frumento', barley: 'Barley (all)|Cebada (total)|Orge (total)|Orzo (totale)', 'winter-barley': 'Winter barley|Cebada de invierno|Orge d’hiver|Orzo invernale', 'spring-barley': 'Spring barley|Cebada de primavera|Orge de printemps|Orzo primaverile', oats: 'Oats|Avena|Avoine|Avena', 'oilseed-rape': 'Oilseed rape|Colza|Colza|Colza' };
  var UK_REGN = { england: 'England|Inglaterra|Angleterre|Inghilterra', scotland: 'Scotland|Escocia|Écosse|Scozia', wales: 'Wales|Gales|Pays de Galles|Galles', 'northern-ireland': 'Northern Ireland|Irlanda del Norte|Irlande du Nord|Irlanda del Nord' };
  var TEU = {
    es: { de: 'Alemania', uk: 'Reino Unido', land: 'Estado federado', region: 'Región', crop: 'Cultivo', sCropDE: 'Tu estado federado en este cultivo', sLand: 'Precio y alquiler de la tierra en tu estado', sCropUK: 'Tu región en este cultivo', area: 'Superficie', prd: 'Producción', yl: 'Rendimiento', ha: 'ha', t: 't', dtha: 'dt/ha', tha: 't/ha', share: 'del total de Alemania', shareUK: 'de la producción del Reino Unido', rank: 'puesto {r} de {n} por superficie', vs: 'vs.', top: 'Mayores por superficie', unitT: 'Territorio', prov: 'Estimación provisional de la cosecha en curso: puede cambiar.', noData: 'Sin dato publicado de {c} para {p}.', buy: 'Precio de compra', rent: 'Alquiler', deals: 'ventas', natL: 'media nacional', arable: 'Tierra de cultivo', grass: 'Prado y pastizal', eurha: '€/ha', noLand: 'Sin dato publicado de precio de la tierra para este estado (los estados-ciudad no tienen suficientes operaciones).', rentNote: 'El alquiler solo se publica en los años de censo agrario.',
      deNote: 'Fuente: Destatis (GENESIS). Los datos por estado empiezan en 2010. ',landNote: 'Fuente: Destatis (GENESIS). El precio es el medio de las ventas registradas ese año; con pocas ventas conviene tomarlo con cautela.', ukNote: 'Fuente: Defra, estadísticas de cereales y colza. El Reino Unido no publica la superficie total en la misma serie regional; el reparto se calcula solo con la producción.', no_1: 'Precio local de tu producto: no lo tenemos para esta zona; los precios que seguimos son nacionales o europeos.', no_2: 'Seguro agrario y sequía de tu zona: aún no están en esta página.', no_3: 'Costes y margen: usa la calculadora, que trabaja con cifras nacionales.', mCountry: 'Ficha del país', mClima: 'Clima y sequía', mPrices: 'Precios', mCosts: 'Costes e insumos' },
    en: { de: 'Germany', uk: 'United Kingdom', land: 'Federal state', region: 'Region', crop: 'Crop', sCropDE: 'Your federal state in this crop', sLand: 'Land price and rent in your state', sCropUK: 'Your region in this crop', area: 'Area', prd: 'Production', yl: 'Yield', ha: 'ha', t: 't', dtha: 'dt/ha', tha: 't/ha', share: 'of Germany’s total', shareUK: 'of UK production', rank: '{r} of {n} by area', vs: 'vs.', top: 'Largest by area', unitT: 'Territory', prov: 'Provisional estimate for the current harvest: it may change.', noData: 'No published {c} figure for {p}.', buy: 'Purchase price', rent: 'Rent', deals: 'sales', natL: 'national average', arable: 'Arable land', grass: 'Grassland', eurha: '€/ha', noLand: 'No published land-price figure for this state (city-states have too few transactions).', rentNote: 'Rent is only published in farm-census years.',
      deNote: 'Source: Destatis (GENESIS). State figures start in 2010. ',landNote: 'Source: Destatis (GENESIS). The price is the average of the sales recorded that year; with few sales, treat it with caution.', ukNote: 'Source: Defra, cereal and oilseed rape statistics. The UK total area is not in the same regional series, so the share is computed for production only.', no_1: 'Local price for your product: we do not have it for this area; the prices we follow are national or European.', no_2: 'Crop insurance and drought for your area: not on this page yet.', no_3: 'Costs and margin: use the calculator, which works with national figures.', mCountry: 'Country page', mClima: 'Climate and drought', mPrices: 'Prices', mCosts: 'Costs and inputs' },
    fr: { de: 'Allemagne', uk: 'Royaume-Uni', land: 'Land', region: 'Région', crop: 'Culture', sCropDE: 'Votre Land pour cette culture', sLand: 'Prix et loyer des terres dans votre Land', sCropUK: 'Votre région pour cette culture', area: 'Surface', prd: 'Production', yl: 'Rendement', ha: 'ha', t: 't', dtha: 'dt/ha', tha: 't/ha', share: 'du total allemand', shareUK: 'de la production du Royaume-Uni', rank: '{r}e sur {n} par surface', vs: 'vs.', top: 'Plus grandes surfaces', unitT: 'Territoire', prov: 'Estimation provisoire de la récolte en cours : elle peut changer.', noData: 'Pas de donnée publiée de {c} pour {p}.', buy: 'Prix d’achat', rent: 'Loyer', deals: 'ventes', natL: 'moyenne nationale', arable: 'Terres arables', grass: 'Prairies et pâturages', eurha: '€/ha', noLand: 'Pas de prix des terres publié pour ce Land (les villes-États ont trop peu de transactions).', rentNote: 'Le loyer n’est publié que les années de recensement agricole.',
      deNote: 'Source : Destatis (GENESIS). Les chiffres par Land commencent en 2010. ',landNote: 'Source : Destatis (GENESIS). Le prix est la moyenne des ventes de l’année ; avec peu de ventes, à prendre avec prudence.', ukNote: 'Source : Defra, statistiques des céréales et du colza. La surface totale du Royaume-Uni n’est pas dans la même série régionale ; la part est calculée sur la production seulement.', no_1: 'Prix local de votre produit : nous ne l’avons pas pour cette zone ; les prix suivis sont nationaux ou européens.', no_2: 'Assurance récolte et sécheresse de votre zone : pas encore sur cette page.', no_3: 'Coûts et marge : utilisez le calculateur, qui travaille avec des chiffres nationaux.', mCountry: 'Fiche pays', mClima: 'Climat et sécheresse', mPrices: 'Prix', mCosts: 'Coûts et intrants' },
    it: { de: 'Germania', uk: 'Regno Unito', land: 'Land', region: 'Regione', crop: 'Coltura', sCropDE: 'Il tuo Land in questa coltura', sLand: 'Prezzo e affitto della terra nel tuo Land', sCropUK: 'La tua regione in questa coltura', area: 'Superficie', prd: 'Produzione', yl: 'Resa', ha: 'ha', t: 't', dtha: 'dt/ha', tha: 't/ha', share: 'del totale tedesco', shareUK: 'della produzione del Regno Unito', rank: '{r}º su {n} per superficie', vs: 'vs.', top: 'Maggiori per superficie', unitT: 'Territorio', prov: 'Stima provvisoria del raccolto in corso: può cambiare.', noData: 'Nessun dato pubblicato di {c} per {p}.', buy: 'Prezzo d’acquisto', rent: 'Affitto', deals: 'vendite', natL: 'media nazionale', arable: 'Seminativi', grass: 'Prati e pascoli', eurha: '€/ha', noLand: 'Nessun prezzo della terra pubblicato per questo Land (le città-Stato hanno troppe poche operazioni).', rentNote: 'L’affitto è pubblicato solo negli anni di censimento agricolo.',
      deNote: 'Fonte: Destatis (GENESIS). I dati per Land partono dal 2010. ',landNote: 'Fonte: Destatis (GENESIS). Il prezzo è la media delle vendite registrate nell’anno; con poche vendite va preso con cautela.', ukNote: 'Fonte: Defra, statistiche su cereali e colza. La superficie totale del Regno Unito non è nella stessa serie regionale; la quota è calcolata solo sulla produzione.', no_1: 'Prezzo locale del tuo prodotto: non lo abbiamo per questa zona; i prezzi che seguiamo sono nazionali o europei.', no_2: 'Assicurazione dei raccolti e siccità della tua zona: non ancora in questa pagina.', no_3: 'Costi e margine: usa il calcolatore, che lavora con cifre nazionali.', mCountry: 'Scheda paese', mClima: 'Clima e siccità', mPrices: 'Prezzi', mCosts: 'Costi e input' }
  };
  function te() { return TEU[lang()]; }
  function pick4(map, k) { var v = map[k]; return v ? (v.split('|')[LIDX[lang()]] || v.split('|')[0]) : k; }
  function deName(c) { var N = window.DehesaRegionNames && window.DehesaRegionNames.DE; return N && N[c] ? pick4(N, c) : c; }
  function deLands() { return DEF ? Object.keys(DEF.production.land.wheat || {}).sort(function (a, b) { return deName(a).localeCompare(deName(b), lang()); }) : []; }
  function ukRegName(slug) { return UKD && UKD.reg[slug] ? (UK_REGN[slug] ? pick4(UK_REGN, slug) : UKD.reg[slug]) : slug; }
  function ukRegions() { return UKD ? Object.keys(UKD.reg).filter(function (k) { return k !== 'united-kingdom'; }).sort(function (a, b) { return ukRegName(a).localeCompare(ukRegName(b), lang()); }) : []; }
  function atY(a, y) { if (a) for (var i = 0; i < a.length; i++) if (String(a[i][0]) === String(y)) return a[i][1]; return null; }
  function loadUK() {
    return get('data/series/UK/crops_regions.json').then(function (d) {
      var ix = {}, reg = {}; d.series.forEach(function (s) { ix[s.id] = s.points; var m = /^uk-reg-(areas|yields|production)-(.+)$/.exec(s.id); if (!m) return; var nm = s.label.split(', ').slice(1).join(', ').replace(/ \([^)]*\)$/, ''), slug = null; UK_CROPS.forEach(function (c) { if (m[2].indexOf(c + '-') === 0 && (!slug || c.length > slug.length)) slug = c; }); if (slug) reg[m[2].slice(slug.length + 1)] = nm; });
      UKD = { ix: ix, reg: reg };
    });
  }
  function dePrep() { return DEF ? Promise.resolve() : get('data/germany-agri.json').then(function (d) { DEF = d; }); }
  function eurM(v, d) { return nf(v, d == null ? 0 : d) + ' ' + te().eurha; }
  function deCrop(tok) {
    var t = te(), c = ST.p, L = ST.r, nat = DEF.production.nat[c] || {}, node = (DEF.production.land[c] || {})[L], pl = deName(L), cn = pick4(DE_CROPN, c), h = '';
    var yr = node ? Math.max.apply(null, [].concat((node.area || []).map(function (x) { return x[0]; }), (node.prod || []).map(function (x) { return x[0]; }))) : null;
    if (!node || !isFinite(yr)) { putSec(tok, 'crop', note(fill(t.noData, { c: cn, p: pl })) + cite('destatis', '')); return; }
    var a = atY(node.area, yr), p = atY(node.prod, yr), y = atY(node.yield, yr), a0 = atY(node.area, yr - 1), p0 = atY(node.prod, yr - 1), y0 = atY(node.yield, yr - 1), na = atY(nat.area, yr), np = atY(nat.prod, yr), ny = atY(nat.yield, yr);
    var ranks = Object.keys(DEF.production.land[c]).map(function (k) { return { k: k, v: atY(DEF.production.land[c][k].area, yr) }; }).filter(function (x) { return x.v > 0; }).sort(function (x, z) { return z.v - x.v; });
    var rk = ranks.map(function (x) { return x.k; }).indexOf(L) + 1, dv = function (x, z) { return x != null && z != null && z > 0 ? esc(t.vs + ' ' + (yr - 1)) + ': ' + pc((x / z - 1) * 100) : ''; };
    h += '<p class="di-movers-hint"><b>' + esc(cn) + '</b> · ' + esc(pl) + ' · ' + yr + '</p><div class="de-tiles">';
    if (a != null) h += tile(t.area, nf(a, 0) + ' ' + t.ha, (na ? nf(a / na * 100, a / na < 0.001 ? 2 : 1) + ' % ' + esc(t.share) : '') + (rk ? '<br>' + esc(fill(t.rank, { r: rk, n: ranks.length })) : '') + (dv(a, a0) ? '<br>' + dv(a, a0) : ''));
    if (p != null) h += tile(t.prd, big(p, t.t), (np ? nf(p / np * 100, p / np < 0.001 ? 2 : 1) + ' % ' + esc(t.share) : '') + (dv(p, p0) ? '<br>' + dv(p, p0) : ''));
    if (y != null) h += tile(t.yl, nf(y, 1) + ' ' + t.dtha, (ny != null ? esc(t.natL) + ': ' + nf(ny, 1) + ' ' + t.dtha : '') + (dv(y, y0) ? '<br>' + dv(y, y0) : ''));
    h += '</div>';
    var rows = ranks.slice(0, 5); if (rk > 5) rows.push(ranks[rk - 1]);
    h += '<p class="di-movers-hint" style="margin:8px 0 2px"><b>' + esc(t.top) + ' · ' + yr + '</b></p><div class="de-sc"><table class="de-t" data-no-cards data-no-rows><thead><tr><th scope="col">' + esc(t.land) + '</th><th scope="col" class="r">' + esc(t.area) + '</th></tr></thead><tbody>' + rows.map(function (x) { return '<tr' + (x.k === L ? ' style="font-weight:700"' : '') + '><td>' + esc(deName(x.k)) + '</td><td class="r">' + nf(x.v, 0) + ' ' + esc(t.ha) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    h += (yr >= new Date().getFullYear() ? note(t.prov) : '') + note(t.deNote) + cite('destatis', yr);
    putSec(tok, 'crop', h);
  }
  function deLand(tok) {
    var t = te(), L = ST.r, lp = DEF.landPrice, rn = DEF.rent, node = lp.land[L], nat = lp.nat, kinds = [['acker', t.arable], ['gruen', t.grass]], h = '', any = false, per = '';
    if (!node) { putSec(tok, 'land', note(t.noLand) + cite('destatis', '')); return; }
    h += '<div class="de-sc"><table class="de-t" data-no-cards data-no-rows><thead><tr><th scope="col"></th><th scope="col" class="r">' + esc(t.buy) + '</th><th scope="col" class="r">' + esc(t.deals) + '</th><th scope="col" class="r">' + esc(t.natL) + '</th><th scope="col" class="r">' + esc(t.rent) + '</th></tr></thead><tbody>';
    kinds.forEach(function (k) {
      var n = node[k[0]], pp = n && n.p && n.p.length ? n.p[n.p.length - 1] : null, nn = pp && n.n ? atY(n.n, pp[0]) : null, np = pp && nat[k[0]] && nat[k[0]].p ? atY(nat[k[0]].p, pp[0]) : null, rr = rn.land && rn.land[L] && rn.land[L][k[0]] && rn.land[L][k[0]].length ? rn.land[L][k[0]][rn.land[L][k[0]].length - 1] : null;
      if (pp) { any = true; per = pp[0]; }
      h += '<tr><td>' + esc(k[1]) + '</td><td class="r">' + (pp ? eurM(pp[1]) + ' <span class="di-movers-hint">(' + pp[0] + ')</span>' : '–') + '</td><td class="r">' + (nn != null ? nf(nn, 0) : '–') + '</td><td class="r">' + (np != null ? eurM(np) : '–') + '</td><td class="r">' + (rr ? eurM(rr[1]) + ' <span class="di-movers-hint">(' + rr[0] + ')</span>' : '–') + '</td></tr>';
    });
    h += '</tbody></table></div>' + (any ? '' : note(t.noLand)) + note(t.rentNote) + note(t.landNote) + cite('destatis', per);
    putSec(tok, 'land', h);
  }
  function ukCrop(tok) {
    var t = te(), c = ST.p, R = ST.r, ix = UKD.ix, cn = pick4(UK_CROPN, c), rn = ukRegName(R), h = '';
    var id = function (k, r) { return 'uk-reg-' + k + '-' + c + '-' + r; };
    var ar = ix[id('areas', R)], pr = ix[id('production', R)], yd = ix[id('yields', R)];
    var yr = Math.max.apply(null, [].concat((ar || []).map(function (x) { return +x[0]; }), (pr || []).map(function (x) { return +x[0]; })));
    if (!isFinite(yr)) { putSec(tok, 'crop', note(fill(t.noData, { c: cn, p: rn })) + cite('defra', '')); return; }
    var a = atY(ar, yr), p = atY(pr, yr), y = atY(yd, yr), a0 = atY(ar, yr - 1), p0 = atY(pr, yr - 1), y0 = atY(yd, yr - 1), uk = atY(ix[id('production', 'united-kingdom')], yr);
    var ranks = ukRegions().filter(function (k) { return k !== 'england'; }).map(function (k) { return { k: k, v: atY(ix[id('areas', k)], yr) }; }).filter(function (x) { return x.v > 0; }).sort(function (x, z) { return z.v - x.v; });
    var rk = ranks.map(function (x) { return x.k; }).indexOf(R) + 1, dv = function (x, z) { return x != null && z != null && z > 0 ? esc(t.vs + ' ' + (yr - 1)) + ': ' + pc((x / z - 1) * 100) : ''; };
    h += '<p class="di-movers-hint"><b>' + esc(cn) + '</b> · ' + esc(rn) + ' · ' + yr + '</p><div class="de-tiles">';
    if (a != null) h += tile(t.area, nf(a, 0) + ' ' + t.ha, (rk ? esc(fill(t.rank, { r: rk, n: ranks.length })) : '') + (dv(a, a0) ? (rk ? '<br>' : '') + dv(a, a0) : ''));
    if (p != null) h += tile(t.prd, big(p, t.t), (uk ? nf(p / uk * 100, 1) + ' % ' + esc(t.shareUK) : '') + (dv(p, p0) ? (uk ? '<br>' : '') + dv(p, p0) : ''));
    if (y != null) h += tile(t.yl, nf(y, 2) + ' ' + t.tha, dv(y, y0));
    h += '</div>';
    var rows = ranks.slice(0, 5); if (rk > 5) rows.push(ranks[rk - 1]);
    h += '<p class="di-movers-hint" style="margin:8px 0 2px"><b>' + esc(t.top) + ' · ' + yr + '</b></p><div class="de-sc"><table class="de-t" data-no-cards data-no-rows><thead><tr><th scope="col">' + esc(t.region) + '</th><th scope="col" class="r">' + esc(t.area) + '</th></tr></thead><tbody>' + rows.map(function (x) { return '<tr' + (x.k === R ? ' style="font-weight:700"' : '') + '><td>' + esc(ukRegName(x.k)) + '</td><td class="r">' + nf(x.v, 0) + ' ' + esc(t.ha) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    h += note(t.ukNote) + cite('defra', yr);
    putSec(tok, 'crop', h);
  }
  function missingEU() { var t = te(); return Promise.resolve('<ul style="margin:4px 0 0 18px;padding:0;font-size:14px;line-height:1.5">' + [t.no_1, t.no_2, t.no_3].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'); }

  /* ---------- lo que falta + enlaces ---------- */
  function missingUS() {
    var t = tr(), a = statesOf('cattle').length, b = statesOf('hay').length;
    return get(GR + 'manifest.json').then(function (m) { return Object.keys(m.states).filter(function (s) { return /^[A-Z]{2}$/.test(s) && window.DehesaRegionNames && window.DehesaRegionNames.US[s]; }).length; }, function () { return null; }).then(function (g) {
      var l = [t.no_us1, fill(t.no_us2, { a: a, b: b, g: g == null ? '?' : g }), t.no_us3, t.no_us4, t.no_us5];
      return '<ul style="margin:4px 0 0 18px;padding:0;font-size:14px;line-height:1.5">' + l.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    });
  }
  function missingCA() { var c = tc(); return Promise.resolve('<ul style="margin:4px 0 0 18px;padding:0;font-size:14px;line-height:1.5">' + [c.no_ca1, c.no_ca2, c.no_ca3, c.no_ca4].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'); }
  function missingES() { var t = tr(); return Promise.resolve('<ul style="margin:4px 0 0 18px;padding:0;font-size:14px;line-height:1.5">' + [t.no_es1, t.no_es2, t.no_es3, t.no_es4, t.no_es5].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'); }
  /* ---------- EE. UU.: proximos informes USDA y margen de referencia ERS ---------- */
  var TN = {
    es: { sNext: 'Próximos informes de USDA para este producto', nextNone: 'No hay fechas cargadas de los informes de este producto después de hoy (el calendario cargado llega hasta {d}).', nextNote: 'Fechas del calendario oficial de USDA NASS y del WASDE (hora del este de EE. UU.). USDA puede cambiar una fecha.', cal: 'Calendario completo',
      sMarg: 'Margen de referencia (USDA ERS, media de EE. UU.)', gv: 'Valor de la producción', mOp: 'Menos costes operativos', mTot: 'Menos costes totales', perAc: 'USD por acre sembrado', impNote: 'Los costes totales incluyen {v} $/acre imputados (coste de oportunidad de la tierra y de la mano de obra no pagada), no desembolsos.', margNote: 'Cifras publicadas por USDA ERS (Commodity Costs and Returns) para el total de EE. UU., año {y}. No son tu estado ni tu explotación: para tu caso, usa la calculadora.', calc: 'Calcular mi margen', margNo: 'ERS no publica una referencia de costes y márgenes para este producto en la tabla cargada.' },
    en: { sNext: 'Upcoming USDA reports for this product', nextNone: 'No dates loaded for this product’s reports after today (the loaded calendar runs to {d}).', nextNote: 'Dates from the official USDA NASS calendar and the WASDE (US Eastern time). USDA may change a date.', cal: 'Full calendar',
      sMarg: 'Reference margin (USDA ERS, U.S. average)', gv: 'Value of production', mOp: 'Less operating costs', mTot: 'Less total costs', perAc: 'USD per planted acre', impNote: 'Total costs include {v} $/acre of imputed costs (opportunity cost of land and unpaid labour), not cash outlays.', margNote: 'Figures published by USDA ERS (Commodity Costs and Returns) for the U.S. total, year {y}. They are not your state or your farm: for your case, use the calculator.', calc: 'Calculate my margin', margNo: 'ERS does not publish a cost and return reference for this product in the loaded table.' },
    fr: { sNext: 'Prochains rapports de l’USDA pour ce produit', nextNone: 'Aucune date chargée pour les rapports de ce produit après aujourd’hui (le calendrier chargé va jusqu’au {d}).', nextNote: 'Dates du calendrier officiel de l’USDA NASS et du WASDE (heure de l’Est des États-Unis). L’USDA peut modifier une date.', cal: 'Calendrier complet',
      sMarg: 'Marge de référence (USDA ERS, moyenne des États-Unis)', gv: 'Valeur de la production', mOp: 'Moins les coûts opérationnels', mTot: 'Moins les coûts totaux', perAc: 'USD par acre semé', impNote: 'Les coûts totaux incluent {v} $/acre de coûts imputés (coût d’opportunité de la terre et du travail non rémunéré), pas des décaissements.', margNote: 'Chiffres publiés par l’USDA ERS (Commodity Costs and Returns) pour l’ensemble des États-Unis, année {y}. Ce n’est ni votre État ni votre exploitation : pour votre cas, utilisez le calculateur.', calc: 'Calculer ma marge', margNo: 'L’ERS ne publie pas de référence de coûts et de marges pour ce produit dans la table chargée.' },
    it: { sNext: 'Prossimi rapporti USDA per questo prodotto', nextNone: 'Nessuna data caricata per i rapporti di questo prodotto dopo oggi (il calendario caricato arriva al {d}).', nextNote: 'Date dal calendario ufficiale di USDA NASS e del WASDE (ora della costa est degli USA). L’USDA può cambiare una data.', cal: 'Calendario completo',
      sMarg: 'Margine di riferimento (USDA ERS, media USA)', gv: 'Valore della produzione', mOp: 'Meno costi operativi', mTot: 'Meno costi totali', perAc: 'USD per acro seminato', impNote: 'I costi totali includono {v} $/acro di costi imputati (costo opportunità della terra e del lavoro non retribuito), non esborsi.', margNote: 'Cifre pubblicate da USDA ERS (Commodity Costs and Returns) per il totale USA, anno {y}. Non sono il tuo stato né la tua azienda: per il tuo caso, usa il calcolatore.', calc: 'Calcola il mio margine', margNo: 'L’ERS non pubblica un riferimento di costi e margini per questo prodotto nella tabella caricata.' }
  };
  function tn() { return TN[lang()] || TN.es; }
  var GRAIN_REL = ['crop-progress', 'crop-production', 'wasde', 'grain-stocks', 'small-grains-summary', 'agricultural-prices'];
  var USDA_REL = { cattle: ['cattle-on-feed', 'livestock-slaughter', 'wasde', 'agricultural-prices'], hay: ['crop-production', 'agricultural-prices'], corn: GRAIN_REL, soybeans: GRAIN_REL.concat(['fats-oils']), wheat: GRAIN_REL.concat(['flour-milling']), sorghum: GRAIN_REL, barley: GRAIN_REL, oats: GRAIN_REL };
  var ERS_KEY = { corn: 'maiz', soybeans: 'soja', wheat: 'trigo', barley: 'cebada', oats: 'avena' };
  function isoToday() { var d = new Date(); return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2); }
  function dayLabel(iso) { var p = String(iso).split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(lang(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function nextReports(tok) {
    var x = tn(), ids = USDA_REL[ST.p] || [];
    return get('data/usda-calendar.json').then(function (d) {
      var today = isoToday(), last = '';
      (d.releases || []).forEach(function (r) { if (r.date > last) last = r.date; });
      var up = (d.releases || []).filter(function (r) { return r.date >= today && ids.indexOf(r.id) >= 0; }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
      var seen = {}, list = [];
      up.forEach(function (r) { if (list.length < 4 && !seen[r.id]) { seen[r.id] = 1; list.push(r); } }); // la proxima fecha de cada informe
      var h = list.length ? '<ul style="margin:4px 0 6px 18px;padding:0;font-size:14px;line-height:1.6">' + list.map(function (r) { return '<li><b>' + esc(dayLabel(r.date)) + '</b>' + (r.time ? ' · ' + esc(r.time) : '') + ' · ' + esc(r.name) + ' <span class="di-movers-hint">(' + esc(r.agency) + ')</span></li>'; }).join('') + '</ul>'
        : note(fill(x.nextNone, { d: last ? dayLabel(last) : '–' }));
      h += note(x.nextNote) + '<p style="margin:4px 0">' + link('calendario.html', x.cal) + '</p>' + cite('usda_nass', '') + (ids.indexOf('wasde') >= 0 ? cite('usda_oce_wasde', '') : '');
      putSec(tok, 'next', h);
    });
  }
  function ersMargin(tok) {
    var x = tn(), k = ERS_KEY[ST.p];
    return get('data/ers-cost-reference.json').then(function (d) {
      var c = k && d.crops && d.crops[k];
      if (!c || typeof c.grossValue !== 'number' || typeof c.netOperating !== 'number' || typeof c.netTotal !== 'number') { putSec(tok, 'marg', note(x.margNo)); return; }
      var sg = function (v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + '$' + nf(Math.abs(v), 0); };
      var h = '<div class="de-tiles">' + tile(x.gv + ' · ' + c.year, '$' + nf(c.grossValue, 0), esc(x.perAc)) + tile(x.mOp + ' · ' + c.year, sg(c.netOperating), esc(x.perAc)) + tile(x.mTot + ' · ' + c.year, sg(c.netTotal), esc(x.perAc)) + '</div>';
      if (typeof c.imputed === 'number' && c.imputed > 0) h += note(fill(x.impNote, { v: nf(c.imputed, 0) }));
      h += note(fill(x.margNote, { y: c.year })) + '<p style="margin:4px 0">' + link('calculadora.html', x.calc) + '</p>' + cite('usda_ers', c.year);
      putSec(tok, 'marg', h);
    });
  }
  function moreLinks() {
    var t = tr(), h = '';
    if (ST.c === 'US') {
      var tab = ST.p === 'cattle' || ST.p === 'hay' ? ST.p : 'grain';
      h += link('precios-locales.html?' + (tab === 'grain' ? 's=' + ST.r + '&c=' + ST.p : 't=' + tab + '&s=' + ST.r), t.mPrice) + link('precios.html?tab=seguro', t.mIns) + link('sequia.html?state=' + encodeURIComponent(ST.r), t.mDrought) + link('insumos.html', t.mCosts) + link('clima.html', t.mClima);
    } else if (ST.c === 'CA') {
      var cc = tc(); h += link('paises.html?c=CA', cc.mCa) + (ST.r === 'MB' ? link('paises.html?c=CA#' + (ST.p === 'hogs' ? 'mb-hogs' : ST.p === 'sheep' ? 'mb-sheep-goat' : 'mb-cattle'), cc.mMb) : '') + link('rendimientos.html', cc.mRend) + link('ganaderia.html', cc.mGan) + link('clima.html', t.mClima) + link('insumos.html', t.mCosts);
    } else if (ST.c === 'DE' || ST.c === 'UK') {
      var ee = te(); h += link('paises.html?c=' + ST.c, ee.mCountry) + link('clima.html', ee.mClima) + link('precios.html', ee.mPrices) + link('insumos.html', ee.mCosts);
    } else h += link('paises.html?c=ES#es-crops', t.mCrops) + link('clima.html', t.mClima) + link('precios.html', t.mPrices) + link('insumos.html', t.mCosts);
    return h;
  }

  /* ---------- pintado ---------- */
  // Qué hay en cada país antes de elegir (auditoría 8-oct-2026): prometer solo lo disponible.
  var AV = {
    es: { h: 'Qué verás según el país', now: 'Disponible ahora', not: 'Todavía no', rows: [['EE. UU.', 'Precio local, margen por cultivo, próximos informes, seguro y sequía', '—'], ['Canadá', 'Precio, producción, seguro y sequía', '—'], ['Alemania', 'Producción por estado federado, precio y renta de la tierra', 'Precio local, seguro'], ['Reino Unido', 'Producción por región', 'Precio local, seguro, sequía'], ['España', 'Producción por provincia', 'Precio provincial, seguro, sequía local']] },
    en: { h: 'What you will see by country', now: 'Available now', not: 'Not yet', rows: [['US', 'Local price, crop margin, upcoming reports, insurance and drought', '—'], ['Canada', 'Price, production, insurance and drought', '—'], ['Germany', 'Production by federal state, land price and rent', 'Local price, insurance'], ['United Kingdom', 'Production by region', 'Local price, insurance, drought'], ['Spain', 'Production by province', 'Provincial price, insurance, local drought']] },
    fr: { h: 'Ce que vous verrez selon le pays', now: 'Disponible', not: 'Pas encore', rows: [['États-Unis', 'Prix local, marge par culture, prochains rapports, assurance et sécheresse', '—'], ['Canada', 'Prix, production, assurance et sécheresse', '—'], ['Allemagne', 'Production par Land, prix et fermage des terres', 'Prix local, assurance'], ['Royaume-Uni', 'Production par région', 'Prix local, assurance, sécheresse'], ['Espagne', 'Production par province', 'Prix provincial, assurance, sécheresse locale']] },
    it: { h: 'Cosa vedrai secondo il paese', now: 'Disponibile', not: 'Non ancora', rows: [['Stati Uniti', 'Prezzo locale, margine per coltura, prossimi rapporti, assicurazione e siccità', '—'], ['Canada', 'Prezzo, produzione, assicurazione e siccità', '—'], ['Germania', 'Produzione per Land, prezzo e affitto dei terreni', 'Prezzo locale, assicurazione'], ['Regno Unito', 'Produzione per regione', 'Prezzo locale, assicurazione, siccità'], ['Spagna', 'Produzione per provincia', 'Prezzo provinciale, assicurazione, siccità locale']] }
  };
  function availability() {
    var a = AV[lang()] || AV.es;
    return '<details class="di-fold" style="margin:10px 0"><summary><b>' + esc(a.h) + '</b></summary><div class="di-table-wrap"><table class="di-table" style="font-size:13px"><thead><tr><th></th><th>' + esc(a.now) + '</th><th>' + esc(a.not) + '</th></tr></thead><tbody>' +
      a.rows.map(function (r) { return '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>'; }).join('') + '</tbody></table></div></details>';
  }
  var ACT = { es: ['Zona activa', 'Cambiar mi zona'], en: ['Active area', 'Change my area'], fr: ['Zone active', 'Changer de zone'], it: ['Zona attiva', 'Cambia zona'] };
  function examples() {
    var t = tr();
    return availability() + '<p class="di-movers-hint">' + esc(t.intro) + '</p><p>' + [
      ['US', 'KS', 'cattle', usName('KS') + ' · ' + prodName('cattle')], ['US', 'IA', 'corn', usName('IA') + ' · ' + prodName('corn')], ['CA', 'MB', 'cattle', caName('MB') + ' · ' + tc().cattle], ['CA', 'SK', 'canola-rapeseed', caName('SK') + ' · ' + tc().crops['canola-rapeseed']], ['ES', '47', 'cereales', 'Valladolid · ' + (t.grp.cereales)], ['DE', 'BY', 'wheat', deName('BY') + ' · ' + pick4(DE_CROPN, 'wheat')], ['UK', 'eastern', 'wheat', 'Eastern · ' + pick4(UK_CROPN, 'wheat')]
    ].map(function (e) { return '<button type="button" class="di-src-tab" data-mm-ex="' + e.slice(0, 3).join('|') + '">' + esc(e[3]) + '</button> '; }).join('') + '</p>';
  }
  var HM = {
    es: { t: 'Tu mercado', all: 'Ver todo y cambiar', margin: 'Calcular margen', track: 'Seguimiento y alertas' },
    en: { t: 'Your market', all: 'See all and change', margin: 'Calculate margin', track: 'Tracking and alerts' },
    fr: { t: 'Votre marché', all: 'Tout voir et changer', margin: 'Calculer la marge', track: 'Suivi et alertes' },
    it: { t: 'Il tuo mercato', all: 'Vedi tutto e cambia', margin: 'Calcola il margine', track: 'Monitoraggio e avvisi' }
  };
  function placeName() { return ST.c === 'US' ? usName(ST.r) : ST.c === 'CA' ? caName(ST.r) : ST.c === 'DE' ? deName(ST.r) : ST.c === 'UK' ? ukRegName(ST.r) : (ES_PROV && ES_PROV[ST.r]) || ST.r; }
  function prodTitle() { return ST.c === 'US' ? prodName(ST.p) : ST.c === 'CA' ? caProdName(ST.p) : ST.c === 'DE' ? pick4(DE_CROPN, ST.p) : ST.c === 'UK' ? pick4(UK_CROPN, ST.p) : ST.p; }
  function compactHead() {
    var m = HM[lang()] || HM.es;
    return '<p style="margin:0 0 4px;font-size:15px"><b>' + esc(m.t) + ' · ' + esc(placeName()) + ' · ' + esc(prodTitle()) + '</b> ' +
      '<a class="di-link-btn" href="mi-mercado.html">' + esc(m.all) + '</a> <a class="di-link-btn" href="calculadora.html">' + esc(m.margin) + '</a> <a class="di-link-btn" href="mi-seguimiento.html">' + esc(m.track) + '</a></p>';
  }
  function draw() {
    var t = tr(), tok = ++TOK;
    var h, ready = ST.c && ST.r && ST.p;
    if (COMPACT) {
      if (!ready) { root.innerHTML = ''; return; }
      h = compactHead();
    } else {
      document.getElementById('mm-h1').textContent = t.title; document.getElementById('mm-sub').textContent = t.sub; document.title = t.title + ' | Dehesa Index';
      var ac = ACT[lang()] || ACT.es;
      h = (ready ? '<p class="mm-active" style="margin:0 0 10px;font-size:15px"><b>' + esc(ac[0]) + ': ' + esc(placeName()) + ' · ' + esc(prodTitle()) + '</b> <a class="di-link-btn" href="#mm-sel" onclick="var e=document.querySelector(\'[data-mm-sel] select\');if(e){e.focus();}return false;">' + esc(ac[1]) + '</a></p>' : '') + '<div data-mm-sel id="mm-sel">' + selectors() + '</div>';
      if (!ready) { root.innerHTML = h + examples(); return; }
      h += '<p class="di-movers-hint">' + esc(t.saved) + ' <button type="button" class="di-src-tab" data-mm-reset="1">' + esc(t.reset) + '</button></p>';
    }
    if (ST.c === 'US') {
      h += sect('price', t.sPrice + ' · ' + prodName(ST.p)) + (ERS_KEY[ST.p] ? sect('marg', tn().sMarg) : '') + sect('next', tn().sNext) + sect('ins', t.sIns) + sect('dr', t.sDrought);
    } else if (ST.c === 'CA') {
      h += sect('price', t.sPrice + ' · ' + caProdName(ST.p)) + sect('crop', tc().sProd) + sect('ins', tc().sIns) + sect('dr', tc().sDr);
    } else if (ST.c === 'DE') {
      h += sect('crop', te().sCropDE) + sect('land', te().sLand);
    } else if (ST.c === 'UK') {
      h += sect('crop', te().sCropUK);
    } else h += sect('crop', t.sCrop);
    if (!COMPACT) h += sect('missing', t.sMissing) + '<section class="di-card" style="padding:14px 16px;margin:14px 0"><h2 style="font-size:18px;margin:0 0 6px">' + esc(t.sMore) + '</h2>' + moreLinks() + '</section>';
    root.innerHTML = h;
    var run = function (id, fn) { Promise.resolve().then(fn).catch(function () { failSec(tok, id); }); };
    if (ST.c === 'US') {
      run('price', function () { return ST.p === 'cattle' ? priceCattle(tok) : ST.p === 'hay' ? priceHay(tok) : priceGrain(tok); });
      if (ERS_KEY[ST.p]) run('marg', function () { return ersMargin(tok); });
      run('next', function () { return nextReports(tok); });
      run('ins', function () { return insurance(tok); }); run('dr', function () { return drought(tok); });
      if (!COMPACT) run('missing', function () { return locStatus().then(missingUS).then(function (x) { putSec(tok, 'missing', x); }); });
    } else if (ST.c === 'CA') {
      run('price', function () { return priceCa(tok); }); run('crop', function () { prodCa(tok); }); run('ins', function () { return insuranceCa(tok); }); run('dr', function () { return droughtCa(tok); });
      if (!COMPACT) run('missing', function () { return missingCA().then(function (x) { putSec(tok, 'missing', x); }); });
    } else if (ST.c === 'DE') {
      run('crop', function () { return deCrop(tok); }); run('land', function () { return deLand(tok); });
      if (!COMPACT) run('missing', function () { return missingEU().then(function (x) { putSec(tok, 'missing', x); }); });
    } else if (ST.c === 'UK') {
      run('crop', function () { return ukCrop(tok); });
      if (!COMPACT) run('missing', function () { return missingEU().then(function (x) { putSec(tok, 'missing', x); }); });
    } else {
      run('crop', function () { return spainCrop(tok); });
      if (!COMPACT) run('missing', function () { return missingES().then(function (x) { putSec(tok, 'missing', x); }); });
    }
  }

  /* ---------- eventos ---------- */
  function refocus(sel) { var n = root.querySelector(sel); if (n && n.focus) n.focus(); }
  function prepare() {
    if (ST.c === 'CA') {
      return (CAD ? Promise.resolve(CAD) : get('data/canada-provinces.json').then(function (d) { CAD = d; return d; })).then(function (d) {
        if (ST.r && !d.provinces[ST.r]) ST.r = ''; if (ST.p && caProducts().indexOf(ST.p) < 0) ST.p = '';
      });
    }
    if (ST.c === 'DE') { return dePrep().then(function () { if (ST.r && deLands().indexOf(ST.r) < 0) ST.r = ''; if (ST.p && DE_CROPS.indexOf(ST.p) < 0) ST.p = ''; }); }
    if (ST.c === 'UK') { return (UKD ? Promise.resolve() : loadUK()).then(function () { if (ST.r && ukRegions().indexOf(ST.r) < 0) ST.r = ''; if (ST.p && UK_CROPS.indexOf(ST.p) < 0) ST.p = ''; }); }
    // España: hace falta el índice y un grupo cargados para los selectores
    if (ST.c === 'ES') {
      var need = function () { return ES_IDX ? Promise.resolve(ES_IDX) : get(SC + 'index.json').then(function (ix) { ES_IDX = ix; return ix; }); };
      return need().then(function (ix) {
        if (ST.p && !ix.groups[ST.p]) { ST.p = ''; ST.k = ''; }
        var g = ST.p ? ST.p : 'cereales';
        return spainGroup(g).then(function (gd) { ES_PROV = gd.provinces; if (ST.p) cropOptions(gd); else ES_CROPS = ''; });
      });
    }
    return Promise.resolve();
  }
  function change(e) {
    var n = e.target, a = n.getAttribute && n.getAttribute('data-mm'), f = null;
    if (!a) {
      if (n.hasAttribute('data-mm-wb')) { ST.wb = +n.value; draw(); refocus('[data-mm-wb]'); }
      else if (n.hasAttribute('data-mm-hc')) { ST.hc = n.value; draw(); refocus('[data-mm-hc]'); }
      else if (n.hasAttribute('data-mm-se')) { ST.se = +n.value; draw(); refocus('[data-mm-se]'); }
      return;
    }
    if (a === 'c') { ST.c = n.value; ST.r = ''; ST.p = ''; ST.k = ''; f = '[data-mm="c"]'; }
    else if (a === 'r') { ST.r = n.value; f = '[data-mm="r"]'; }
    else if (a === 'p') { ST.p = n.value; if (ST.c === 'ES') ST.k = ''; ST.se = 0; f = '[data-mm="p"]'; }
    else if (a === 'k') { ST.k = n.value; f = '[data-mm="k"]'; }
    save(); prepare().then(function () { draw(); refocus(f); }, function () { draw(); });
  }
  function click(e) {
    var b = e.target.closest ? e.target.closest('[data-mm-cl],[data-mm-ex],[data-mm-reset],[data-mm-go]') : null; if (!b) return;
    if (b.hasAttribute('data-mm-cl')) { ST.cl = b.getAttribute('data-mm-cl'); draw(); refocus('[data-mm-cl="' + ST.cl + '"]'); }
    else if (b.hasAttribute('data-mm-ex')) { b.setAttribute('aria-busy', 'true'); b.textContent = ({ es: 'Cargando…', en: 'Loading…', fr: 'Chargement…', it: 'Caricamento…' })[lang()] || 'Cargando…'; var x = b.getAttribute('data-mm-ex').split('|'); ST.c = x[0]; ST.r = x[1]; ST.p = x[2]; ST.k = ''; save(); prepare().then(draw, draw); }
    else if (b.hasAttribute('data-mm-reset')) { clearSaved(); prepare().then(draw, draw); }
    else if (b.hasAttribute('data-mm-go')) { e.preventDefault(); ST.r = b.getAttribute('data-mm-go'); save(); draw(); }
  }

  readSaved();
  if (window.DehesaShared) { if (!COMPACT) window.DehesaShared.init('tools'); var prevL = window.DehesaShared.onLangChange; window.DehesaShared.onLangChange = function () { if (prevL) prevL.apply(this, arguments); draw(); }; }
  root.addEventListener('change', change); root.addEventListener('click', click);
  // Listas largas de cultivos: el filtro oculta las opciones que no contienen el texto (sin acentos)
  root.addEventListener('input', function (e) {
    var id = e.target && e.target.getAttribute && e.target.getAttribute('data-mm-filter'); if (!id) return;
    var sel = document.getElementById(id); if (!sel) return; var q = String(e.target.value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    Array.prototype.forEach.call(sel.options, function (o) { if (!o.value) return; var tx = o.textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); o.hidden = !!q && tx.indexOf(q) < 0; });
  });
  var first = function () { prepare().then(draw, draw); };
  (window.DICite ? window.DICite.load().then(first, first) : first());
})();
