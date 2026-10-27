/* Dehesa Index — Mercados Dehesa (dehesa.html): cerdo ibérico, pastos y corcho con cifras oficiales ya publicadas (data/dehesa.json, scripts/build-dehesa.py).
   Lo que no tiene fuente abierta (precio del ibérico, de la bellota, del corcho) se declara PENDIENTE; nada se estima. Bloques cerrados por defecto. ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared, DOC = null, ERR = false;
  var T = {
    es: { yAn: 'animales', yMe: 'millones de €', title: 'Mercados Dehesa', sub: 'Cerdo ibérico, pastos y corcho: lo que publican las fuentes oficiales y lo que todavía no tiene precio público.',
      loading: 'Cargando…', fail: 'No se han podido cargar los datos. Vuelve a intentarlo en unos minutos.',
      pigH: 'Cerdo ibérico', pigS: 'Censo oficial por provincia y evolución en España.', pigK: 'Cerdos ibéricos en España', pigShare: 'del total de cerdos', pigSince: 'Frente a hace un año',
      pigEvo: 'Evolución del censo ibérico en España (animales)', sTotal: 'Total ibérico', sFat: 'Ibérico de cebo', sSows: 'Cerdas reproductoras ibéricas',
      prov: 'Provincia', iber: 'Ibéricos', tot: 'Todos los cerdos', share: 'Ibérico sobre el total', pigNote: 'Encuesta ganadera del MAPA (mayo y noviembre). «Ibérico» es la clasificación de la propia encuesta; no distingue bellota, cebo de campo y cebo.',
      pastH: 'Pastos', pastS: 'Precio de la tierra de pastizal y canon de arrendamiento (MAPA).', pastPrice: 'Precio del pastizal (€/ha)', pastRent: 'Canon del pastizal (€/ha y año)', area: 'Zona', chg: 'Frente al año anterior',
      pastProv: 'Precio del pastizal en provincias de dehesa', pastEvo: 'Precio del pastizal por zona (€/ha)', pastNote: 'Medias de la encuesta del MAPA, no un registro de ventas. El pastizal no es lo mismo que la dehesa arbolada: el MAPA no publica un precio de «dehesa» como tipo propio.',
      corkPH: 'Producción de corcho por comunidad (toneladas)', fH: 'Productos del monte: piñón, castaña, trufa, setas y resina (Anuario forestal 2021)', fS: 'Producción 2006-2021, dato puntual del MITECO', fN: 'Dato puntual del Anuario de Estadística Forestal 2021, no una serie que se actualice. Muchas cifras las estima el MITECO a partir de superficies o de lo que facilitan las comunidades, y parte de la producción (autoconsumo, venta directa) no queda registrada. 2004 no tiene dato. No es un precio: el Anuario calcula el valor con un precio medio estimado, por eso no se muestra.', fP: 'Piñón con cáscara (t)', fC: 'Castaña (t)', fT: 'Trufa (kg)', fM: 'Otros hongos (kg)', fR: 'Resina (t)', fE: 'Evolución de la producción de piñón y castaña', aH: 'Valor y precio del corcho: dato puntual del Anuario forestal 2021', aN: 'Es una fotografía publicada una sola vez en el Anuario de 2021, no una serie que se actualice. El valor de los últimos años lo estima el MITECO a nivel estatal. En 2005 la producción publicada es muy baja y en 2004 no hay dato.', aY: 'Año', aF: ["valor estimado a nivel estatal por el MITECO (falta el valor de algunas provincias)", "incluye producción estimada de montes privados de Andalucía", "sin cifras de Extremadura de 2008-2010: el MITECO usa un valor medio", "Andalucía no facilitó 2017: estimado por el MITECO"], aP: 'Producción (t)', aV: 'Valor (miles de €)', aR: 'Precios por comunidad en 2021 (corcho de reproducción)', aPr: 'Precio medio (€/t)', aPt: 'Producción (t)', aT: 'Total', aRn: 'Los precios los facilitan las comunidades; el total lo estima el MITECO. Castilla y León y la Comunidad Valenciana no tienen valor publicado.',  corkPEvo: 'Producción de corcho en España (toneladas)', corkPYear: 'Año', corkPTot: 'Total', corkPNote: 'Fuente: comunidades autónomas, recopilado por el MITECO. Andalucía no aporta el monte privado: 35.000 t (2020-2022) son una estimación del propio ministerio. 2023 no está publicado. En 2008-2010 el total incluye una estimación de Extremadura sin desglosar (19.032 t cada año, según el MITECO), y 2005 y 2007 son muy inferiores al resto; el ministerio las publica así. El total de 2024 es la suma de las comunidades con dato (no hay total nacional) y no puede compararse sin más con los años anteriores. En 2022 el total que publica el MITECO (55.405 t) es 1.860,55 t mayor que la suma de las comunidades; aquí se usa la suma.', corkPNoAN: 'Andalucía (estimado)', corkH: 'Corcho', corkS: 'Producción por comunidad (MITECO) y comercio exterior de corcho y manufacturas (Eurostat).', corkExp: 'Exportaciones', corkImp: 'Importaciones', corkEvo: 'Exportaciones de corcho y manufacturas (millones de €)', corkYear: 'Último año completo', corkNote: 'Capítulo 45 del arancel (corcho y sus manufacturas), valor en euros; la suma anual es un cálculo de Dehesa Index y solo usa años completos. No incluye toneladas ni precio.', corkNoES: 'España aparecerá cuando termine la primera carga de datos.',
      stH: 'Qué precios existen y cuáles no', stS: 'Estado de cada mercado de la dehesa.', mkt: 'Mercado', st: 'Estado', why: 'Por qué',
      real: 'REAL', pend: 'PENDIENTE', rows: [
        ['Cerdo ibérico (censo)', 'REAL', 'Encuesta ganadera del MAPA, por provincia.'],
        ['Pastizal (precio y canon)', 'REAL', 'Encuesta de precios de la tierra del MAPA, por comunidad y provincia.'],
        ['Corcho (producción)', 'REAL', 'MITECO, toneladas por comunidad (2005-2022 y 2024); Andalucía es estimación del ministerio.'],
        ['Corcho (comercio exterior)', 'REAL', 'Eurostat Comext, en valor. Es comercio, no precio.'],
        ['Cerdo ibérico (precio)', 'PENDIENTE', 'Las lonjas que lo cotizan (Extremadura, Salamanca, Mercolleida) no publican datos abiertos con permiso de reutilización.'],
        ['Bellota / montanera (precio)', 'PENDIENTE', 'Sin serie oficial abierta; solo cotizaciones de lonja de pago o de acceso restringido.'],
        ['Corcho (precio en plancha)', 'PENDIENTE', 'No hay serie oficial de precio abierta. Solo hay un dato puntual del Anuario forestal de 2021 (valor 2002-2021 y precio por comunidad de 2021, abajo); no hay serie continua.']],
      src: 'Fuente:', cite: 'Sumas, cuotas y variaciones: cálculo de Dehesa Index.', rel: 'Relacionado:', relL: [['Ganadería de España por provincia', 'ganaderia'], ['Precio de la tierra en España', 'insumos'], ['Comercio exterior', 'comercio']] },
    en: { yAn: 'animals', yMe: 'EUR million', title: 'Dehesa markets', sub: 'Iberian pigs, pastures and cork: what official sources publish, and what still has no public price.',
      loading: 'Loading…', fail: 'The data could not be loaded. Please try again in a few minutes.',
      pigH: 'Iberian pigs', pigS: 'Official census by province and trend in Spain.', pigK: 'Iberian pigs in Spain', pigShare: 'of all pigs', pigSince: 'Versus a year ago',
      pigEvo: 'Iberian pig census in Spain (animals)', sTotal: 'Iberian total', sFat: 'Iberian fattening pigs', sSows: 'Iberian breeding sows',
      prov: 'Province', iber: 'Iberian', tot: 'All pigs', share: 'Iberian share', pigNote: 'MAPA livestock survey (May and November). “Iberian” is the survey’s own classification; it does not separate acorn-fed, free-range fattened and feed-fattened.',
      pastH: 'Pastures', pastS: 'Pasture land price and rental rate (MAPA).', pastPrice: 'Pasture price (€/ha)', pastRent: 'Pasture rent (€/ha per year)', area: 'Area', chg: 'Versus previous year',
      pastProv: 'Pasture price in dehesa provinces', pastEvo: 'Pasture price by area (€/ha)', pastNote: 'Survey averages from MAPA, not a register of sales. Pasture is not the same as wooded dehesa: MAPA does not publish a separate “dehesa” land price.',
      corkPH: 'Cork production by region (tonnes)', fH: 'Forest products: pine nuts, chestnuts, truffles, mushrooms and resin (2021 forestry yearbook)', fS: 'Production 2006-2021, one-off MITECO figures', fN: 'One-off figures from the 2021 Forestry Statistics Yearbook, not a series that gets updated. Many figures are MITECO estimates built from areas or from what the regions supply, and part of the output (self-consumption, direct sales) is not recorded. 2004 has no data. This is not a price: the yearbook computes value from an estimated average price, so it is not shown.', fP: 'Pine nuts in shell (t)', fC: 'Chestnuts (t)', fT: 'Truffles (kg)', fM: 'Other mushrooms (kg)', fR: 'Resin (t)', fE: 'Pine nut and chestnut production', aH: 'Cork value and price: one-off figures from the 2021 forestry yearbook', aN: 'This is a snapshot published once in the 2021 yearbook, not a series that gets updated. MITECO estimates the value of recent years at national level. 2005 production is published as very low and 2004 has no data.', aY: 'Year', aF: ["value estimated nationally by MITECO (some provinces have no value data)", "includes estimated production from private forests in Andalusia", "no Extremadura figures for 2008-2010: MITECO uses an average value", "Andalusia did not supply 2017: estimated by MITECO"], aP: 'Production (t)', aV: 'Value (€ thousand)', aR: 'Prices by region in 2021 (reproduction cork)', aPr: 'Average price (€/t)', aPt: 'Production (t)', aT: 'Total', aRn: 'Prices are supplied by the regions; the total is estimated by MITECO. Castilla y León and the Valencian Community have no published value.',  corkPEvo: 'Cork production in Spain (tonnes)', corkPYear: 'Year', corkPTot: 'Total', corkPNote: 'Source: regional governments, compiled by MITECO. Andalusia does not report private forest: 35,000 t (2020-2022) is the ministry’s own estimate. 2023 is not published. In 2008-2010 the total includes an undivided estimate for Extremadura (19,032 t each year, per MITECO), and 2005 and 2007 are far below the rest; the ministry publishes them that way. The 2024 total is the sum of the regions with data (there is no national total) and is not directly comparable with earlier years. For 2022 the total published by MITECO (55,405 t) is 1,860.55 t above the sum of the regions; the sum is used here.', corkPNoAN: 'Andalusia (estimate)', corkH: 'Cork', corkS: 'Production by region (MITECO) and foreign trade in cork and cork goods (Eurostat).', corkExp: 'Exports', corkImp: 'Imports', corkEvo: 'Exports of cork and cork goods (EUR million)', corkYear: 'Last full year', corkNote: 'Tariff chapter 45 (cork and articles of cork), value in euros; the annual sum is calculated by Dehesa Index and uses full years only. No tonnes and no price.', corkNoES: 'Spain will appear once the first data load finishes.',
      stH: 'Which prices exist and which do not', stS: 'Status of each dehesa market.', mkt: 'Market', st: 'Status', why: 'Why',
      real: 'REAL', pend: 'PENDING', rows: [
        ['Iberian pigs (census)', 'REAL', 'MAPA livestock survey, by province.'],
        ['Pasture (price and rent)', 'REAL', 'MAPA land price survey, by region and province.'],
        ['Cork (production)', 'REAL', 'MITECO, tonnes by region (2005-2022 and 2024); Andalusia is the ministry’s estimate.'],
        ['Cork (foreign trade)', 'REAL', 'Eurostat Comext, in value. It is trade, not price.'],
        ['Iberian pig (price)', 'PENDING', 'The exchanges that quote it (Extremadura, Salamanca, Mercolleida) do not publish open data with a reuse permit.'],
        ['Acorn / montanera (price)', 'PENDING', 'No open official series; only paid or restricted exchange quotes.'],
        ['Cork (price per slab)', 'PENDING', 'No open official price series. Only one-off figures from the 2021 forestry yearbook (value 2002-2021 and price by region for 2021, below); there is no continuous series.']],
      src: 'Source:', cite: 'Sums, shares and changes: calculated by Dehesa Index.', rel: 'Related:', relL: [['Spain livestock by province', 'ganaderia'], ['Land prices in Spain', 'insumos'], ['Foreign trade', 'comercio']] },
    fr: { yAn: 'animaux', yMe: 'millions d’€', title: 'Marchés de la dehesa', sub: 'Porc ibérique, pâturages et liège : ce que publient les sources officielles et ce qui n’a pas encore de prix public.',
      loading: 'Chargement…', fail: 'Impossible de charger les données. Réessayez dans quelques minutes.',
      pigH: 'Porc ibérique', pigS: 'Recensement officiel par province et évolution en Espagne.', pigK: 'Porcs ibériques en Espagne', pigShare: 'de l’ensemble des porcs', pigSince: 'Par rapport à il y a un an',
      pigEvo: 'Recensement des porcs ibériques en Espagne (animaux)', sTotal: 'Total ibérique', sFat: 'Porcs ibériques à l’engrais', sSows: 'Truies ibériques reproductrices',
      prov: 'Province', iber: 'Ibériques', tot: 'Tous les porcs', share: 'Part ibérique', pigNote: 'Enquête d’élevage du MAPA (mai et novembre). « Ibérique » est la classification de l’enquête ; elle ne distingue pas gland, engraissement en plein air et engraissement à l’aliment.',
      pastH: 'Pâturages', pastS: 'Prix des terres de pâturage et fermage (MAPA).', pastPrice: 'Prix du pâturage (€/ha)', pastRent: 'Fermage du pâturage (€/ha par an)', area: 'Zone', chg: 'Par rapport à l’année précédente',
      pastProv: 'Prix du pâturage dans les provinces de dehesa', pastEvo: 'Prix du pâturage par zone (€/ha)', pastNote: 'Moyennes d’enquête du MAPA, pas un registre de ventes. Le pâturage n’est pas la dehesa arborée : le MAPA ne publie pas de prix « dehesa » à part.',
      corkPH: 'Production de liège par région (tonnes)', fH: 'Produits du monde forestier : pignons, châtaignes, truffes, champignons et résine (annuaire forestier 2021)', fS: 'Production 2006-2021, chiffres ponctuels du MITECO', fN: 'Chiffres ponctuels de l’annuaire de statistique forestière 2021, pas une série mise à jour. Beaucoup de chiffres sont des estimations du MITECO à partir des surfaces ou de ce que fournissent les régions, et une partie de la production (autoconsommation, vente directe) n’est pas enregistrée. 2004 n’a pas de donnée. Ce n’est pas un prix : l’annuaire calcule la valeur avec un prix moyen estimé, elle n’est donc pas affichée.', fP: 'Pignons avec coque (t)', fC: 'Châtaignes (t)', fT: 'Truffes (kg)', fM: 'Autres champignons (kg)', fR: 'Résine (t)', fE: 'Production de pignons et de châtaignes', aH: 'Valeur et prix du liège : chiffres ponctuels de l’annuaire forestier 2021', aN: 'C’est un instantané publié une seule fois dans l’annuaire 2021, pas une série mise à jour. Le MITECO estime la valeur des dernières années au niveau national. La production de 2005 est publiée très basse et 2004 n’a pas de donnée.', aY: 'Année', aF: ["valeur estimée au niveau national par le MITECO (valeur manquante pour certaines provinces)", "inclut la production estimée des forêts privées d’Andalousie", "pas de chiffres d’Estrémadure pour 2008-2010 : le MITECO utilise une valeur moyenne", "l’Andalousie n’a pas fourni 2017 : estimé par le MITECO"], aP: 'Production (t)', aV: 'Valeur (milliers d’€)', aR: 'Prix par région en 2021 (liège de reproduction)', aPr: 'Prix moyen (€/t)', aPt: 'Production (t)', aT: 'Total', aRn: 'Les prix sont fournis par les régions ; le total est estimé par le MITECO. La Castille-et-León et la Communauté valencienne n’ont pas de valeur publiée.',  corkPEvo: 'Production de liège en Espagne (tonnes)', corkPYear: 'Année', corkPTot: 'Total', corkPNote: 'Source : communautés autonomes, compilé par le MITECO. L’Andalousie ne déclare pas les forêts privées : 35 000 t (2020-2022) est une estimation du ministère. 2023 n’est pas publié. En 2008-2010 le total inclut une estimation non ventilée pour l’Estrémadure (19 032 t chaque année, selon le MITECO), et 2005 et 2007 sont très inférieurs aux autres ; le ministère les publie ainsi. Le total 2024 est la somme des régions disposant de données (pas de total national) et n’est pas directement comparable aux années précédentes. En 2022, le total publié par le MITECO (55 405 t) dépasse de 1 860,55 t la somme des régions ; la somme est utilisée ici.', corkPNoAN: 'Andalousie (estimation)', corkH: 'Liège', corkS: 'Production par région (MITECO) et commerce extérieur de liège et ouvrages en liège (Eurostat).', corkExp: 'Exportations', corkImp: 'Importations', corkEvo: 'Exportations de liège et ouvrages en liège (millions d’€)', corkYear: 'Dernière année complète', corkNote: 'Chapitre 45 du tarif (liège et ouvrages en liège), valeur en euros ; la somme annuelle est un calcul de Dehesa Index sur années complètes. Ni tonnes ni prix.', corkNoES: 'L’Espagne apparaîtra à la fin du premier chargement de données.',
      stH: 'Quels prix existent et lesquels non', stS: 'État de chaque marché de la dehesa.', mkt: 'Marché', st: 'État', why: 'Pourquoi',
      real: 'RÉEL', pend: 'EN ATTENTE', rows: [
        ['Porc ibérique (recensement)', 'RÉEL', 'Enquête d’élevage du MAPA, par province.'],
        ['Pâturage (prix et fermage)', 'RÉEL', 'Enquête du MAPA sur le prix des terres, par région et province.'],
        ['Liège (production)', 'RÉEL', 'MITECO, tonnes par région (2005-2022 et 2024) ; l’Andalousie est une estimation du ministère.'],
        ['Liège (commerce extérieur)', 'RÉEL', 'Eurostat Comext, en valeur. C’est du commerce, pas un prix.'],
        ['Porc ibérique (prix)', 'EN ATTENTE', 'Les bourses qui le cotent (Estrémadure, Salamanque, Mercolleida) ne publient pas de données ouvertes avec permis de réutilisation.'],
        ['Gland / montanera (prix)', 'EN ATTENTE', 'Pas de série officielle ouverte ; seulement des cotations payantes ou à accès restreint.'],
        ['Liège (prix de la planche)', 'EN ATTENTE', 'Pas de série de prix officielle ouverte. Seulement des chiffres ponctuels de l’annuaire forestier 2021 (valeur 2002-2021 et prix par région en 2021, ci-dessous) ; il n’y a pas de série continue.']],
      src: 'Source :', cite: 'Sommes, parts et variations : calcul de Dehesa Index.', rel: 'À voir aussi :', relL: [['Élevage espagnol par province', 'ganaderia'], ['Prix des terres en Espagne', 'insumos'], ['Commerce extérieur', 'comercio']] },
    it: { yAn: 'capi', yMe: 'milioni di €', title: 'Mercati della dehesa', sub: 'Suino iberico, pascoli e sughero: cosa pubblicano le fonti ufficiali e cosa non ha ancora un prezzo pubblico.',
      loading: 'Caricamento…', fail: 'Impossibile caricare i dati. Riprova tra qualche minuto.',
      pigH: 'Suino iberico', pigS: 'Censimento ufficiale per provincia e andamento in Spagna.', pigK: 'Suini iberici in Spagna', pigShare: 'del totale dei suini', pigSince: 'Rispetto a un anno fa',
      pigEvo: 'Censimento dei suini iberici in Spagna (capi)', sTotal: 'Totale iberico', sFat: 'Suini iberici da ingrasso', sSows: 'Scrofe iberiche riproduttrici',
      prov: 'Provincia', iber: 'Iberici', tot: 'Tutti i suini', share: 'Quota iberica', pigNote: 'Indagine zootecnica del MAPA (maggio e novembre). «Iberico» è la classificazione dell’indagine; non distingue ghianda, ingrasso all’aperto e ingrasso a mangime.',
      pastH: 'Pascoli', pastS: 'Prezzo dei terreni a pascolo e canone d’affitto (MAPA).', pastPrice: 'Prezzo del pascolo (€/ha)', pastRent: 'Canone del pascolo (€/ha all’anno)', area: 'Zona', chg: 'Rispetto all’anno precedente',
      pastProv: 'Prezzo del pascolo nelle province di dehesa', pastEvo: 'Prezzo del pascolo per zona (€/ha)', pastNote: 'Medie d’indagine del MAPA, non un registro di compravendite. Il pascolo non è la dehesa alberata: il MAPA non pubblica un prezzo «dehesa» a parte.',
      corkPH: 'Produzione di sughero per regione (tonnellate)', fH: 'Prodotti del bosco: pinoli, castagne, tartufi, funghi e resina (annuario forestale 2021)', fS: 'Produzione 2006-2021, dati puntuali del MITECO', fN: 'Dati puntuali dell’Annuario di statistica forestale 2021, non una serie aggiornata. Molte cifre sono stime del MITECO basate sulle superfici o su quanto forniscono le regioni, e parte della produzione (autoconsumo, vendita diretta) non è registrata. Il 2004 non ha dato. Non è un prezzo: l’annuario calcola il valore con un prezzo medio stimato, perciò non viene mostrato.', fP: 'Pinoli con guscio (t)', fC: 'Castagne (t)', fT: 'Tartufi (kg)', fM: 'Altri funghi (kg)', fR: 'Resina (t)', fE: 'Produzione di pinoli e castagne', aH: 'Valore e prezzo del sughero: dati puntuali dell’annuario forestale 2021', aN: 'È un’istantanea pubblicata una sola volta nell’annuario 2021, non una serie aggiornata. Il MITECO stima il valore degli ultimi anni a livello nazionale. La produzione del 2005 è pubblicata molto bassa e il 2004 non ha dato.', aY: 'Anno', aF: ["valore stimato a livello nazionale dal MITECO (manca il valore di alcune province)", "include la produzione stimata dei boschi privati dell’Andalusia", "nessun dato dell’Estremadura per 2008-2010: il MITECO usa un valore medio", "l’Andalusia non ha fornito il 2017: stimato dal MITECO"], aP: 'Produzione (t)', aV: 'Valore (migliaia di €)', aR: 'Prezzi per regione nel 2021 (sughero di riproduzione)', aPr: 'Prezzo medio (€/t)', aPt: 'Produzione (t)', aT: 'Totale', aRn: 'I prezzi sono forniti dalle regioni; il totale è stimato dal MITECO. Castilla y León e Comunità Valenciana non hanno valore pubblicato.',  corkPEvo: 'Produzione di sughero in Spagna (tonnellate)', corkPYear: 'Anno', corkPTot: 'Totale', corkPNote: 'Fonte: comunità autonome, raccolto dal MITECO. L’Andalusia non comunica i boschi privati: 35.000 t (2020-2022) è una stima del ministero. Il 2023 non è pubblicato. Nel 2008-2010 il totale include una stima dell’Estremadura non ripartita (19.032 t ogni anno, secondo il MITECO), e il 2005 e il 2007 sono molto inferiori agli altri; il ministero li pubblica così. Il totale 2024 è la somma delle regioni con dato (non c’è un totale nazionale) e non è direttamente confrontabile con gli anni precedenti. Nel 2022 il totale pubblicato dal MITECO (55.405 t) supera di 1.860,55 t la somma delle regioni; qui si usa la somma.', corkPNoAN: 'Andalusia (stima)', corkH: 'Sughero', corkS: 'Produzione per regione (MITECO) e commercio estero di sughero e manufatti (Eurostat).', corkExp: 'Esportazioni', corkImp: 'Importazioni', corkEvo: 'Esportazioni di sughero e manufatti (milioni di €)', corkYear: 'Ultimo anno completo', corkNote: 'Capitolo 45 della tariffa (sughero e lavori di sughero), valore in euro; la somma annua è un calcolo di Dehesa Index su anni completi. Né tonnellate né prezzo.', corkNoES: 'La Spagna comparirà al termine del primo caricamento dei dati.',
      stH: 'Quali prezzi esistono e quali no', stS: 'Stato di ogni mercato della dehesa.', mkt: 'Mercato', st: 'Stato', why: 'Perché',
      real: 'REALE', pend: 'IN SOSPESO', rows: [
        ['Suino iberico (censimento)', 'REALE', 'Indagine zootecnica del MAPA, per provincia.'],
        ['Pascolo (prezzo e canone)', 'REALE', 'Indagine del MAPA sui prezzi dei terreni, per regione e provincia.'],
        ['Sughero (produzione)', 'REALE', 'MITECO, tonnellate per regione (2005-2022 e 2024); l’Andalusia è una stima del ministero.'],
        ['Sughero (commercio estero)', 'REALE', 'Eurostat Comext, in valore. È commercio, non prezzo.'],
        ['Suino iberico (prezzo)', 'IN SOSPESO', 'Le borse che lo quotano (Estremadura, Salamanca, Mercolleida) non pubblicano dati aperti con permesso di riuso.'],
        ['Ghianda / montanera (prezzo)', 'IN SOSPESO', 'Nessuna serie ufficiale aperta; solo quotazioni a pagamento o ad accesso limitato.'],
        ['Sughero (prezzo della tavola)', 'IN SOSPESO', 'Nessuna serie ufficiale di prezzo aperta. Solo dati puntuali dell’annuario forestale 2021 (valore 2002-2021 e prezzo per regione nel 2021, sotto); non c’è una serie continua.']],
      src: 'Fonte:', cite: 'Somme, quote e variazioni: calcolo di Dehesa Index.', rel: 'Vedi anche:', relL: [['Zootecnia spagnola per provincia', 'ganaderia'], ['Prezzi dei terreni in Spagna', 'insumos'], ['Commercio estero', 'comercio']] }
  };
  function lang() { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; }
  function t() { return T[lang()]; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { if (v === null || v === undefined || !isFinite(v)) return '—'; try { return Number(v).toLocaleString(lang(), { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0, useGrouping: 'always' }); } catch (e) { return String(v); } }
  function pct(a, b) { if (!a || !b) return null; return (a / b - 1) * 100; }
  function chgHtml(c) { if (c === null) return '<span class="di-movers-hint">—</span>'; var up = c >= 0; return '<span style="color:var(--' + (up ? 'up' : 'down') + ',' + (up ? '#1e6b3a' : '#9b2c2c') + ')">' + (up ? '▲ +' : '▼ −') + nf(Math.abs(c), 1) + ' %</span>'; }
  function perTs(p) { var y = +p.slice(0, 4), m = +p.slice(5, 7); return Date.UTC(y, m - 1, 1); }
  function perLbl(p) { try { return new Date(perTs(p)).toLocaleDateString(lang(), { month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return p; } }
  function th(s, right) { return '<th style="text-align:' + (right ? 'right' : 'left') + ';padding:6px 8px;font-weight:600;font-size:12.5px;color:var(--text-faint)">' + esc(s) + '</th>'; }
  function td(s, right) { return '<td style="text-align:' + (right ? 'right' : 'left') + ';padding:6px 8px;border-top:1px solid var(--border);font-variant-numeric:tabular-nums">' + s + '</td>'; }
  function table(head, rows) { return '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;max-width:760px"><thead><tr>' + head.join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  var EMO = { 'dh-pigs': '🐖', 'dh-past': '🌿', 'dh-cork': '🌳', 'dh-cork1': '💶', 'dh-forest': '🍄', 'dh-st': '🔎' };
  function sec(id, h, sub, inner) {
    return '<details class="di-card" id="' + id + '" style="margin:0 0 12px;padding:0"><summary style="cursor:pointer;padding:14px 16px;list-style-position:inside"><b style="font-size:16px">' + (EMO[id] ? '<span aria-hidden="true">' + EMO[id] + '</span> ' : '') + esc(h) + '</b><span class="di-movers-hint" style="display:block;margin:2px 0 0 18px">' + esc(sub) + '</span></summary><div style="padding:0 16px 16px">' + inner + '</div></details>';
  }
  function srcLine(src) { var tt = t(); return '<p class="di-field-hint" style="margin:10px 0 0">' + esc(tt.src) + ' ' + (src.url ? '<a href="' + esc(src.url) + '" target="_blank" rel="noopener">' + esc(src.name) + '</a>' : esc(src.name)) + (src.licence ? ' · ' + esc(src.licence) : '') + '. ' + esc(tt.cite) + '</p>'; }
  function chart(series, o) {
    if (!window.DehesaChart) return '';
    o.series = series; return window.DehesaChart.render(o);
  }
  var COL = ['#8a2d2d', '#2d6a4f', '#b07d1f', '#355c9a', '#6b4a8a'];

  function pigs() {
    var tt = t(), P = DOC.pigs, es = P.es, last = es.iberian[es.iberian.length - 1], tot = es.total[es.total.length - 1], ago = es.iberian.length > 2 ? es.iberian[es.iberian.length - 3] : null;
    var h = '<p style="margin:0 0 10px"><b style="font-size:22px">' + nf(last[1]) + '</b> <span class="di-movers-hint">' + esc(tt.pigK) + ' · ' + esc(perLbl(last[0])) + ' · ' + nf(100 * last[1] / tot[1], 1) + ' % ' + esc(tt.pigShare) + (ago ? ' · ' + esc(tt.pigSince) + ': ' : '') + '</span>' + (ago ? chgHtml(pct(last[1], ago[1])) : '') + '</p>';
    function ser(name, arr, c) { return { name: name, color: c, pts: arr.map(function (p) { return { x: perTs(p[0]), y: p[1], l: perLbl(p[0]) }; }) }; }
    h += chart([ser(tt.sTotal, es.iberian, COL[0]), ser(tt.sFat, es.iberianFattening, COL[1]), ser(tt.sSows, es.iberianSows, COL[2])], { xMode: 'time', yTitle: tt.yAn, aria: tt.pigEvo, vFmt: function (v) { return nf(v); }, xFmt: function (x) { return new Date(x).getUTCFullYear(); } });
    h += table([th(tt.prov), th(tt.iber, 1), th(tt.tot, 1), th(tt.share, 1)], P.provinces.map(function (r) { return '<tr>' + td(esc(r.name)) + td(nf(r.iberian), 1) + td(nf(r.total), 1) + td(r.share === null ? '—' : nf(r.share, 1) + ' %', 1) + '</tr>'; }));
    h += '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(tt.pigNote) + '</p>' + srcLine(P.source);
    return h;
  }
  function pasture() {
    var tt = t(), Pa = DOC.pasture, L = lang(), ks = Object.keys(Pa.areas), yrs = Pa.years;
    var rows = ks.map(function (k) {
      var a = Pa.areas[k], p = a.price || [], r = a.rent || [], pl = p[p.length - 1], rl = r[r.length - 1];
      return '<tr>' + td('<b>' + esc(a.name[L]) + '</b>') + td(nf(pl), 1) + td(chgHtml(pct(pl, p[p.length - 2])), 1) + td(nf(rl, 1), 1) + td(chgHtml(pct(rl, r[r.length - 2])), 1) + '</tr>';
    });
    var h = '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(yrs[yrs.length - 1]) + '</p>' + table([th(tt.area), th(tt.pastPrice, 1), th(tt.chg, 1), th(tt.pastRent, 1), th(tt.chg, 1)], rows);
    h += chart(ks.filter(function (k) { return Pa.areas[k].price; }).map(function (k, i) { return { name: Pa.areas[k].name[L], color: COL[i % COL.length], pts: Pa.areas[k].price.map(function (v, j) { return { x: Date.UTC(yrs[j], 0, 1), y: v, l: String(yrs[j]) }; }) }; }), { xMode: 'time', yTitle: '€/ha', aria: tt.pastEvo, vFmt: function (v) { return nf(v); }, xFmt: function (x) { var y = Math.round(1970 + x / 31556952000); return Math.abs(x - Date.UTC(y, 0, 1)) < 100 * 86400000 ? y : ''; } });
    h += '<h3 style="font-size:14px;margin:16px 0 6px">' + esc(tt.pastProv) + ' · ' + esc(Pa.provYear) + '</h3>' + table([th(tt.prov), th(tt.pastPrice, 1)], Pa.provinces.map(function (r) { return '<tr>' + td(esc(r.name)) + td(nf(r.price), 1) + '</tr>'; }));
    h += '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(tt.pastNote) + '</p>' + srcLine({ name: Pa.source.name, url: Pa.source.url, licence: Pa.source.licence });
    return h;
  }
  function corkProd() {
    var tt = t(), Q = DOC.cork.production; if (!Q) return '';
    var ys = Q.years, n = ys.length, L = lang(), order = Object.keys(Q.ccaa).sort(function (a, b) { var x = Q.ccaa[a][n - 3], y = Q.ccaa[b][n - 3]; return (y || 0) - (x || 0); });
    var cols = [n - 2, n - 1], i22 = ys.indexOf(2022), i24 = ys.indexOf(2024); cols = [i22, i24].filter(function (k) { return k >= 0; });
    function nm(c) { return esc(Q.names[c]) + (c === 'AN' ? ' *' : ''); }
    var rows = order.filter(function (c) { return cols.some(function (k) { return Q.ccaa[c][k] !== null; }); }).map(function (c) { return '<tr>' + td('<b>' + nm(c) + '</b>') + cols.map(function (k) { var v = Q.ccaa[c][k]; return td(v === null ? '—' : nf(v, 0), 1); }).join('') + '</tr>'; });
    rows.push('<tr>' + td('<b>' + esc(tt.corkPTot) + '</b>') + cols.map(function (k) { return td('<b>' + nf(Q.total[k], 0) + '</b>', 1); }).join('') + '</tr>');
    var h = '<h3 style="font-size:14px;margin:0 0 6px">' + esc(tt.corkPH) + '</h3>' + table([th(tt.area)].concat(cols.map(function (k) { return th(String(ys[k]), 1); })), rows);
    function ser(name, arr, c) { var pts = []; for (var j = 0; j < arr.length; j++) if (arr[j] !== null) pts.push({ x: Date.UTC(ys[j], 0, 1), y: arr[j], l: String(ys[j]) }); return { name: name, color: c, pts: pts }; }
    h += chart([ser(tt.corkPTot, Q.total, COL[3]), ser(Q.names.AN + ' *', Q.ccaa.AN, COL[2]), ser(Q.names.EX, Q.ccaa.EX, COL[1]), ser(Q.names.CT, Q.ccaa.CT, COL[0])], { xMode: 'time', yTitle: 't', aria: tt.corkPEvo, vFmt: function (v) { return nf(v, 0); }, xFmt: function (x) { return Math.round(1970 + x / 31556952000); } });
    return h + '<p class="di-movers-hint" style="margin:8px 0 0">* ' + esc(tt.corkPNote) + '</p>' + srcLine(Q.source) + '<div style="height:14px"></div>';
  }
  function forest() {
    var tt = t(), F = DOC.forest; if (!F) return '';
    var ys = F.pineNut.map(function (r) { return r.year; });
    function at(a, y) { for (var i = 0; i < a.length; i++) if (a[i].year === y) return a[i].production; return null; }
    function c(v) { return td(v === null || v === undefined ? '—' : nf(v, 0), 1); }
    var rows = ys.slice().reverse().map(function (y) { return '<tr>' + td('<b>' + y + '</b>', 1) + c(at(F.pineNut, y)) + c(at(F.chestnut, y)) + c(at(F.truffle, y)) + c(at(F.mushrooms, y)) + c(at(F.resin, y)) + '</tr>'; });
    function ser(name, a, col) { return { name: name, color: col, pts: a.map(function (r) { return { x: Date.UTC(r.year, 0, 1), y: r.production, l: String(r.year) }; }) }; }
    return '<p class="di-movers-hint" style="margin:0 0 8px"><b>' + esc(tt.fN) + '</b></p>' + table([th(tt.aY, 1), th(tt.fP, 1), th(tt.fC, 1), th(tt.fT, 1), th(tt.fM, 1), th(tt.fR, 1)], rows) +
      chart([ser(tt.fC, F.chestnut, COL[1]), ser(tt.fP, F.pineNut, COL[2])], { xMode: 'time', yTitle: 't', aria: tt.fE, vFmt: function (v) { return nf(v, 0); }, xFmt: function (x) { return Math.round(1970 + x / 31556952000); } }) + srcLine(F.source);
  }
  function corkOnce() {
    var tt = t(), A = DOC.cork.anuario2021; if (!A) return '';
    var rows = A.series.map(function (r) { return '<tr>' + td(String(r.year) + (r.flag && r.flag !== 'S.D.' ? ' ' + esc(r.flag) : ''), 1) + td(r.production === null ? 'S.D.' : nf(r.production, 0), 1) + td(r.value === null ? 'S.D.' : nf(r.value, 0) + (r.year >= 2005 ? ' *' : ''), 1) + '</tr>'; });
    var P = A.prices2021, pr = P.ccaa.map(function (c) { return '<tr>' + td('<b>' + esc(c.name) + '</b>') + td(nf(c.production, 0), 1) + td(nf(c.price, 0), 1) + '</tr>'; });
    pr.push('<tr>' + td('<b>' + esc(tt.aT) + '</b>') + td('<b>' + nf(P.total.production, 0) + '</b>', 1) + td('<b>' + nf(P.total.price, 0) + '</b>', 1) + '</tr>');
    var fl = ['*', '**', '***', '****'].map(function (k, j) { return k + ' ' + tt.aF[j]; }).join('; ');
    return '<p class="di-movers-hint" style="margin:0 0 8px"><b>' + esc(tt.aN) + '</b></p>' + table([th(tt.aY, 1), th(tt.aP, 1), th(tt.aV, 1)], rows) +
      '<p class="di-movers-hint" style="margin:6px 0 14px">* ' + esc(fl) + '</p><h3 style="font-size:14px;margin:0 0 6px">' + esc(tt.aR) + '</h3>' + table([th(tt.area), th(tt.aPt, 1), th(tt.aPr, 1)], pr) +
      '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(tt.aRn) + '</p>' + srcLine(A.source);
  }
  function cork() {
    var tt = t(), C = DOC.cork, cs = Object.keys(C.countries), names = { ES: { es: 'España', en: 'Spain', fr: 'Espagne', it: 'Spagna' }, PT: { es: 'Portugal', en: 'Portugal', fr: 'Portugal', it: 'Portogallo' } }, L = lang();
    if (!cs.length) return '<p class="di-movers-hint">—</p>';
    var rows = cs.map(function (cc) {
      var e = C.countries[cc].exports || [], i = C.countries[cc].imports || [], le = e[e.length - 1], li = i[i.length - 1];
      return '<tr>' + td('<b>' + esc(names[cc][L]) + '</b>') + td(le ? le[0] : '—', 1) + td(le ? nf(le[1], 1) : '—', 1) + td(le && e.length > 1 ? chgHtml(pct(le[1], e[e.length - 2][1])) : '—', 1) + td(li ? nf(li[1], 1) : '—', 1) + '</tr>';
    });
    var h = corkProd() + table([th(tt.area), th(tt.corkYear, 1), th(tt.corkExp + ' (M€)', 1), th(tt.chg, 1), th(tt.corkImp + ' (M€)', 1)], rows);
    h += chart(cs.filter(function (cc) { return C.countries[cc].exports; }).map(function (cc, i) { return { name: names[cc][L], color: COL[i], pts: C.countries[cc].exports.map(function (p) { return { x: Date.UTC(p[0], 0, 1), y: p[1], l: String(p[0]) }; }) }; }), { xMode: 'time', yTitle: tt.yMe, aria: tt.corkEvo, vFmt: function (v) { return nf(v, 0); }, xFmt: function (x) { return new Date(x).getUTCFullYear(); } });
    h += '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(tt.corkNote) + (cs.indexOf('ES') < 0 ? ' ' + esc(tt.corkNoES) : '') + '</p>' + srcLine(C.source);
    return h;
  }
  function status() {
    var tt = t(), rows = tt.rows.map(function (r) {
      var real = r[1] === tt.real; return '<tr>' + td(esc(r[0])) + td('<b style="color:' + (real ? '#1e6b3a' : '#8a5a00') + '">' + esc(r[1]) + '</b>') + td(esc(r[2])) + '</tr>';
    });
    return table([th(tt.mkt), th(tt.st), th(tt.why)], rows);
  }
  function links() {
    var tt = t(); return '<p class="di-movers-hint" style="margin:14px 0 0">' + esc(tt.rel) + ' ' + tt.relL.map(function (r) { return '<a href="' + esc(r[1]) + '">' + esc(r[0]) + '</a>'; }).join(' · ') + '</p>';
  }
  var FIRST = false;
  function open() { var o = {}; var ds = document.querySelectorAll('#dh-body details'); for (var i = 0; i < ds.length; i++) o[ds[i].id] = ds[i].open; return o; }
  function render() {
    var tt = t(), body = document.getElementById('dh-body'); if (!body) return;
    document.getElementById('dh-h1').textContent = tt.title; document.getElementById('dh-sub').textContent = tt.sub; document.title = tt.title + ' | Dehesa Index';
    if (ERR) { body.innerHTML = '<p>' + esc(tt.fail) + '</p>'; return; }
    if (!DOC) { body.innerHTML = '<p class="di-movers-hint">' + esc(tt.loading) + '</p>'; return; }
    var was = open();
    body.innerHTML = sec('dh-pigs', tt.pigH, tt.pigS, pigs()) + sec('dh-past', tt.pastH, tt.pastS, pasture()) + sec('dh-cork', tt.corkH, tt.corkS, cork()) + sec('dh-cork1', tt.aH, '', corkOnce()) + sec('dh-forest', tt.fH, tt.fS, forest()) + sec('dh-st', tt.stH, tt.stS, status()) + links();
    var hs = (window.location.hash || '').slice(1), jump = null;
    if (!FIRST) { FIRST = true; was = { 'dh-pigs': true }; if (/^dh-[a-z0-9]+$/.test(hs) && document.getElementById(hs)) { was = {}; was[hs] = true; jump = hs; } }   /* enlace con ancla (p. ej. desde la ficha de España): abre ese bloque */
    for (var k in was) if (was[k]) { var d = document.getElementById(k); if (d) d.open = true; }
    if (jump) { var j = document.getElementById(jump); if (j && j.scrollIntoView) j.scrollIntoView(); }
  }
  if (S && S.init) S.init('informacion');
  if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); }; }
  render();
  fetch('data/dehesa.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { DOC = d; render(); }).catch(function () { ERR = true; render(); });
})();
