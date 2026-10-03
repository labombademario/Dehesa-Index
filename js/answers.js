/* Dehesa Index — respuestas directas del buscador (fase 1). ES5, funciona en el navegador y en Node (pruebas).
   Entiende una pregunta con REGLAS (producto, región, estado de EE. UU., qué se pregunta) y la resuelve leyendo los ficheros de data/.
   No usa ningún modelo ni servidor y NUNCA calcula nada que no esté en los datos: cada cifra sale de una observación publicada,
   con su unidad y moneda originales, su fecha y su fuente. Si no sabe responder, devuelve null y el buscador sigue como siempre.

   DehesaAnswers.answer(query, lang, env) -> Promise<respuesta | null>
     env = { products: [{slug, names:{es,en,fr,it}, kw, u}], tokScore(q, w), provider: { json(rutaRelativaADatos) -> Promise }, href(u), identity? }
   DehesaAnswers.parse(query, lang, env) -> intención (sin leer datos)
   DehesaAnswers.render(respuesta, lang, esc) -> HTML */
(function (root) {
  'use strict';
  var LANGS = ['es', 'en', 'fr', 'it'];

  /* ---------- textos ---------- */
  var T = {
    es: { head: 'Respuesta', tradeHead: 'Comercio agroalimentario', tExp: 'Exportaciones a', tImp: 'Importaciones desde', tTopExp: 'Mayor país de destino', tTopImp: 'Mayor país de origen', tNone: 'No tenemos ese comercio publicado para {c}.', tNote: 'Valores anuales de la fuente oficial, en su moneda y unidad; no son una previsión.', tOpen: 'Ver comercio de {c}', price: 'Último dato publicado', since: 'vs dato anterior', y12: 'en 12 meses', noY12: 'sin 12 meses de histórico', date: 'Dato de', src: 'Fuente', open: 'Abrir la ficha', directional: 'Orientativa',
      notComp: 'Cada precio va en la unidad y la moneda de su fuente: no se comparan entre regiones.', none: 'No tenemos ese dato publicado', noneReg: 'No tenemos {p} publicado para {r}.', noneProd: 'Tenemos {p} en: {r}.',
      localHead: 'Precios locales (cash bids)', range: 'Rango entre mercados', markets: 'mercados', on: 'el', localLink: 'Ver todos los mercados', noLocal: 'No hay precios locales publicados de {p} en {s}.', localNoProd: 'Precios locales de grano en {s}',
      localNote: 'Precio al contado de compradores locales; no se calcula una media del estado.', premHead: 'Prima orgánica frente a convencional', prem: 'Orgánico', conv: 'Convencional', premium: 'Prima', sample: 'series', premNote: 'Comparación indicativa entre dos informes USDA (cobertura geográfica distinta); no es un precio oficial.', premNone: 'Todavía no hay datos suficientes para calcular la prima orgánica de {p}.',
      costHead: 'Coste de producción (USDA ERS, EE. UU., media nacional)', costTotal: 'Total de costes listados', perAcre: 'USD por acre sembrado', imputed: 'Imputados (tierra y mano de obra no remunerada)', yld: 'rendimiento', costNote: 'Es una referencia nacional, no el coste de tu explotación. Puedes cargarla en la calculadora.', costLink: 'Abrir la calculadora',
      calHead: 'Calendario de publicaciones', calText: 'Las fechas de los informes oficiales están en el calendario.', calLink: 'Abrir el calendario', calNone: 'No hay una fecha de {r} en el calendario oficial cargado.', calSrc: 'Fechas del calendario oficial de USDA (NASS y WASDE), en hora del este de EE. UU. (ET).', countryHead: 'Perfil de país', countryText: 'Producción, comercio, costes y precios de {c}.', countryLink: 'Abrir el perfil', month: 'Datos mensuales', multi: 'Dos productos distintos: pregunta por uno cada vez.' },
    en: { head: 'Answer', tradeHead: 'Agri-food trade', tExp: 'Exports to', tImp: 'Imports from', tTopExp: 'Largest destination country', tTopImp: 'Largest source country', tNone: 'We have no published trade for {c}.', tNote: 'Annual values from the official source, in its currency and unit; not a forecast.', tOpen: 'See trade of {c}', price: 'Latest published figure', since: 'vs previous reading', y12: 'over 12 months', noY12: 'less than 12 months of history', date: 'Data from', src: 'Source', open: 'Open the product page', directional: 'Indicative',
      notComp: 'Each price is in the unit and currency of its source: they are not compared across regions.', none: 'We do not have that figure published', noneReg: 'We have no published {p} for {r}.', noneProd: 'We have {p} for: {r}.',
      localHead: 'Local prices (cash bids)', range: 'Range across markets', markets: 'markets', on: 'on', localLink: 'See all markets', noLocal: 'No local prices published for {p} in {s}.', localNoProd: 'Local grain prices in {s}',
      localNote: 'Spot prices from local buyers; no state average is computed.', premHead: 'Organic premium over conventional', prem: 'Organic', conv: 'Conventional', premium: 'Premium', sample: 'series', premNote: 'Indicative comparison between two USDA reports (different geographic coverage); not an official price.', premNone: 'There is not yet enough data to compute the organic premium for {p}.',
      costHead: 'Production cost (USDA ERS, U.S., national average)', costTotal: 'Total costs listed', perAcre: 'USD per planted acre', imputed: 'Imputed (land and unpaid labour)', yld: 'yield', costNote: 'A national reference, not the cost of any particular farm. You can load it in the calculator.', costLink: 'Open the calculator',
      calHead: 'Release calendar', calText: 'The dates of official reports are in the calendar.', calLink: 'Open the calendar', calNone: 'There is no date for {r} in the official calendar loaded.', calSrc: 'Dates from the official USDA calendar (NASS and WASDE), in U.S. Eastern time (ET).', countryHead: 'Country profile', countryText: 'Production, trade, costs and prices for {c}.', countryLink: 'Open the profile', month: 'Monthly data', multi: 'Two different products: ask about one at a time.' },
    fr: { head: 'Réponse', tradeHead: 'Commerce agroalimentaire', tExp: 'Exportations vers', tImp: 'Importations depuis', tTopExp: 'Premier pays de destination', tTopImp: 'Premier pays d’origine', tNone: 'Nous n’avons pas ce commerce publié pour {c}.', tNote: 'Valeurs annuelles de la source officielle, dans sa devise et son unité ; ce n’est pas une prévision.', tOpen: 'Voir le commerce de {c}', price: 'Dernière donnée publiée', since: 'vs donnée précédente', y12: 'sur 12 mois', noY12: 'moins de 12 mois d’historique', date: 'Donnée :', src: 'Source', open: 'Ouvrir la fiche', directional: 'Indicative',
      notComp: 'Chaque prix est dans l’unité et la devise de sa source : ils ne sont pas comparés entre régions.', none: 'Nous n’avons pas cette donnée', noneReg: 'Nous n’avons pas de {p} publié pour {r}.', noneProd: 'Nous avons {p} pour : {r}.',
      localHead: 'Prix locaux (cash bids)', range: 'Fourchette entre marchés', markets: 'marchés', on: 'le', localLink: 'Voir tous les marchés', noLocal: 'Pas de prix locaux publiés pour {p} en {s}.', localNoProd: 'Prix locaux des grains : {s}',
      localNote: 'Prix comptant d’acheteurs locaux ; aucune moyenne de l’État n’est calculée.', premHead: 'Prime bio par rapport au conventionnel', prem: 'Bio', conv: 'Conventionnel', premium: 'Prime', sample: 'séries', premNote: 'Comparaison indicative entre deux rapports de l’USDA (couverture géographique différente) ; ce n’est pas un prix officiel.', premNone: 'Pas encore assez de données pour calculer la prime bio de {p}.',
      costHead: 'Coût de production (USDA ERS, États-Unis, moyenne nationale)', costTotal: 'Total des coûts listés', perAcre: 'USD par acre semé', imputed: 'Imputés (terre et travail non rémunéré)', yld: 'rendement', costNote: 'Une référence nationale, pas le coût d’une exploitation précise. Vous pouvez la charger dans le calculateur.', costLink: 'Ouvrir le calculateur',
      calHead: 'Calendrier des publications', calText: 'Les dates des rapports officiels sont dans le calendrier.', calLink: 'Ouvrir le calendrier', calNone: 'Aucune date pour {r} dans le calendrier officiel chargé.', calSrc: 'Dates du calendrier officiel de l\'USDA (NASS et WASDE), en heure de l\'Est des États-Unis (ET).', countryHead: 'Profil de pays', countryText: 'Production, commerce, coûts et prix : {c}.', countryLink: 'Ouvrir le profil', month: 'Données mensuelles', multi: 'Deux produits différents : posez la question pour un seul à la fois.' },
    it: { head: 'Risposta', tradeHead: 'Commercio agroalimentare', tExp: 'Esportazioni verso', tImp: 'Importazioni da', tTopExp: 'Primo paese di destinazione', tTopImp: 'Primo paese di origine', tNone: 'Non abbiamo questo commercio pubblicato per {c}.', tNote: 'Valori annuali della fonte ufficiale, nella sua valuta e unità; non è una previsione.', tOpen: 'Vedi il commercio di {c}', price: 'Ultimo dato pubblicato', since: 'vs dato precedente', y12: 'in 12 mesi', noY12: 'meno di 12 mesi di storico', date: 'Dato:', src: 'Fonte', open: 'Apri la scheda', directional: 'Indicativa',
      notComp: 'Ogni prezzo è nell’unità e nella valuta della sua fonte: non si confrontano tra regioni.', none: 'Non abbiamo questo dato', noneReg: 'Non abbiamo {p} pubblicato per {r}.', noneProd: 'Abbiamo {p} per: {r}.',
      localHead: 'Prezzi locali (cash bids)', range: 'Intervallo tra mercati', markets: 'mercati', on: 'il', localLink: 'Vedi tutti i mercati', noLocal: 'Nessun prezzo locale pubblicato per {p} in {s}.', localNoProd: 'Prezzi locali dei cereali: {s}',
      localNote: 'Prezzo a pronti di acquirenti locali; nessuna media dello stato viene calcolata.', premHead: 'Premio biologico rispetto al convenzionale', prem: 'Biologico', conv: 'Convenzionale', premium: 'Premio', sample: 'serie', premNote: 'Confronto indicativo tra due rapporti USDA (copertura geografica diversa); non è un prezzo ufficiale.', premNone: 'Non ci sono ancora dati sufficienti per calcolare il premio biologico di {p}.',
      costHead: 'Costo di produzione (USDA ERS, USA, media nazionale)', costTotal: 'Totale dei costi elencati', perAcre: 'USD per acro seminato', imputed: 'Imputati (terra e lavoro non retribuito)', yld: 'resa', costNote: 'Un riferimento nazionale, non il costo di una specifica azienda. Puoi caricarlo nel calcolatore.', costLink: 'Apri il calcolatore',
      calHead: 'Calendario delle pubblicazioni', calText: 'Le date dei rapporti ufficiali sono nel calendario.', calLink: 'Apri il calendario', calNone: 'Nessuna data per {r} nel calendario ufficiale caricato.', calSrc: 'Date del calendario ufficiale USDA (NASS e WASDE), in ora della costa orientale USA (ET).', countryHead: 'Profilo paese', countryText: 'Produzione, commercio, costi e prezzi: {c}.', countryLink: 'Apri il profilo', month: 'Dati mensili', multi: 'Due prodotti diversi: chiedi di uno alla volta.' }
  };
  /* ---------- textos de las respuestas nuevas (oferta y demanda, Alemania, mayores variaciones, comparar) ---------- */
  var T2 = {
    es: { camp: 'Campaña {y}/{y2}', prev: 'campaña anterior', world: 'Mundo', supNote: 'Balance del USDA (PSD), en miles de toneladas tal como lo publica la fuente. La campaña más reciente es una previsión que el USDA revisa cada mes.', supNone: 'No tenemos {a} de {p} para {c} en el balance del USDA.', supOpen: 'Ver oferta y demanda de {p}',
      attrs: { production: 'Producción', consumption: 'Consumo', endingStocks: 'Existencias finales', beginningStocks: 'Existencias iniciales', exports: 'Exportaciones', imports: 'Importaciones', area: 'Superficie', feed: 'Pienso', totalSupply: 'Oferta total', crush: 'Trituración' },
      deProd: 'Producción', deYield: 'Rendimiento', deArea: 'Superficie', deHarv: 'Cosecha {y}', deProv: 'estimación provisional', deTop: 'Mayores estados productores', de: 'Alemania', deLandHead: 'Tierra agrícola · {l}', dePrice: 'Precio de compra', deRent: 'Alquiler', deSales: 'ventas', deIn: 'en', deKinds: { lf: 'toda la tierra agrícola', acker: 'tierra de cultivo', gruen: 'pastos' }, deNoPrice: 'No hay precio de compra publicado para {l}.', deNoRent: 'No hay alquiler publicado para {l}.', deNoProd: 'No hay {c} publicado para {l}.',
      deLandNote: 'El precio es la media de las ventas registradas ese año (los estados pequeños tienen pocas operaciones). El alquiler solo se publica en los años de censo agrario y es la media de toda la tierra arrendada.', deProdNote: 'Datos de Destatis. La cosecha del año en curso es una estimación provisional.', deOpen: 'Abrir el perfil de Alemania',
      movUp: 'Mayores subidas', movDn: 'Mayores bajadas', movNote: 'Variación respecto al dato anterior de cada fuente: el intervalo (semanal o mensual) y la fecha cambian de un producto a otro, así que no es un ranking estricto.', movNone: 'No hay variaciones publicadas.', movOpen: 'Abrir el panel de precios',
      cmpNote: 'Cada precio va en la unidad y la moneda de su fuente: no se comparan cifras de productos distintos.', cmpHead: 'Comparación' },
    en: { camp: 'Marketing year {y}/{y2}', prev: 'previous year', world: 'World', supNote: 'USDA balance sheet (PSD), in thousand tonnes as published by the source. The latest marketing year is a forecast that USDA revises every month.', supNone: 'We have no {a} of {p} for {c} in the USDA balance sheet.', supOpen: 'See supply and demand of {p}',
      attrs: { production: 'Production', consumption: 'Consumption', endingStocks: 'Ending stocks', beginningStocks: 'Beginning stocks', exports: 'Exports', imports: 'Imports', area: 'Area', feed: 'Feed use', totalSupply: 'Total supply', crush: 'Crush' },
      deProd: 'Production', deYield: 'Yield', deArea: 'Area', deHarv: 'Harvest {y}', deProv: 'provisional estimate', deTop: 'Largest producing states', de: 'Germany', deLandHead: 'Farmland · {l}', dePrice: 'Purchase price', deRent: 'Rent', deSales: 'sales', deIn: 'in', deKinds: { lf: 'all farmland', acker: 'arable land', gruen: 'grassland' }, deNoPrice: 'No purchase price is published for {l}.', deNoRent: 'No rent is published for {l}.', deNoProd: 'No {c} is published for {l}.',
      deLandNote: 'The price is the average of the sales recorded that year (small states have few transactions). Rent is only published in farm-census years and is the average over all rented land.', deProdNote: 'Data from Destatis. The current year’s harvest is a provisional estimate.', deOpen: 'Open the Germany profile',
      movUp: 'Biggest rises', movDn: 'Biggest falls', movNote: 'Change versus each source’s previous reading: the interval (weekly or monthly) and the date differ between products, so this is not a strict ranking.', movNone: 'No changes are published.', movOpen: 'Open the price dashboard',
      cmpNote: 'Each price is in the unit and currency of its source: figures of different products are not compared.', cmpHead: 'Comparison' },
    fr: { camp: 'Campagne {y}/{y2}', prev: 'campagne précédente', world: 'Monde', supNote: 'Bilan de l’USDA (PSD), en milliers de tonnes tel que publié par la source. La campagne la plus récente est une prévision que l’USDA révise chaque mois.', supNone: 'Nous n’avons pas {a} de {p} pour {c} dans le bilan de l’USDA.', supOpen: 'Voir l’offre et la demande de {p}',
      attrs: { production: 'Production', consumption: 'Consommation', endingStocks: 'Stocks finaux', beginningStocks: 'Stocks initiaux', exports: 'Exportations', imports: 'Importations', area: 'Surface', feed: 'Alimentation animale', totalSupply: 'Offre totale', crush: 'Trituration' },
      deProd: 'Production', deYield: 'Rendement', deArea: 'Surface', deHarv: 'Récolte {y}', deProv: 'estimation provisoire', deTop: 'Principaux Länder producteurs', de: 'Allemagne', deLandHead: 'Terres agricoles · {l}', dePrice: 'Prix d’achat', deRent: 'Loyer', deSales: 'ventes', deIn: 'en', deKinds: { lf: 'toutes les terres agricoles', acker: 'terres arables', gruen: 'prairies' }, deNoPrice: 'Aucun prix d’achat publié pour {l}.', deNoRent: 'Aucun loyer publié pour {l}.', deNoProd: 'Pas de {c} publié pour {l}.',
      deLandNote: 'Le prix est la moyenne des ventes enregistrées dans l’année (les petits Länder ont peu de transactions). Le loyer n’est publié que les années de recensement agricole et c’est la moyenne de toutes les terres louées.', deProdNote: 'Données de Destatis. La récolte de l’année en cours est une estimation provisoire.', deOpen: 'Ouvrir le profil de l’Allemagne',
      movUp: 'Plus fortes hausses', movDn: 'Plus fortes baisses', movNote: 'Variation par rapport à la donnée précédente de chaque source : l’intervalle (hebdomadaire ou mensuel) et la date changent d’un produit à l’autre ; ce n’est pas un classement strict.', movNone: 'Aucune variation publiée.', movOpen: 'Ouvrir le tableau des prix',
      cmpNote: 'Chaque prix est dans l’unité et la devise de sa source : les chiffres de produits différents ne sont pas comparés.', cmpHead: 'Comparaison' },
    it: { camp: 'Campagna {y}/{y2}', prev: 'campagna precedente', world: 'Mondo', supNote: 'Bilancio USDA (PSD), in migliaia di tonnellate come pubblicato dalla fonte. La campagna più recente è una previsione che l’USDA rivede ogni mese.', supNone: 'Non abbiamo {a} di {p} per {c} nel bilancio USDA.', supOpen: 'Vedi offerta e domanda di {p}',
      attrs: { production: 'Produzione', consumption: 'Consumo', endingStocks: 'Scorte finali', beginningStocks: 'Scorte iniziali', exports: 'Esportazioni', imports: 'Importazioni', area: 'Superficie', feed: 'Uso zootecnico', totalSupply: 'Offerta totale', crush: 'Frantumazione' },
      deProd: 'Produzione', deYield: 'Resa', deArea: 'Superficie', deHarv: 'Raccolto {y}', deProv: 'stima provvisoria', deTop: 'Principali Land produttori', de: 'Germania', deLandHead: 'Terra agricola · {l}', dePrice: 'Prezzo di acquisto', deRent: 'Affitto', deSales: 'vendite', deIn: 'nel', deKinds: { lf: 'tutta la terra agricola', acker: 'seminativi', gruen: 'prati e pascoli' }, deNoPrice: 'Nessun prezzo di acquisto pubblicato per {l}.', deNoRent: 'Nessun affitto pubblicato per {l}.', deNoProd: 'Nessun dato di {c} pubblicato per {l}.',
      deLandNote: 'Il prezzo è la media delle vendite registrate nell’anno (i Land piccoli hanno poche operazioni). L’affitto è pubblicato solo negli anni di censimento agricolo ed è la media di tutta la terra in affitto.', deProdNote: 'Dati di Destatis. Il raccolto dell’anno in corso è una stima provvisoria.', deOpen: 'Apri il profilo della Germania',
      movUp: 'Maggiori rialzi', movDn: 'Maggiori ribassi', movNote: 'Variazione rispetto al dato precedente di ciascuna fonte: l’intervallo (settimanale o mensile) e la data cambiano da un prodotto all’altro, quindi non è una classifica rigorosa.', movNone: 'Nessuna variazione pubblicata.', movOpen: 'Apri il pannello dei prezzi',
      cmpNote: 'Ogni prezzo è nell’unità e nella valuta della sua fonte: le cifre di prodotti diversi non si confrontano.', cmpHead: 'Confronto' }
  };
  function t2(lang) { return T2[lang] || T2.es; }
  var REGN = { eu: { es: 'Unión Europea', en: 'European Union', fr: 'Union européenne', it: 'Unione europea' }, us: { es: 'EE. UU.', en: 'United States', fr: 'États-Unis', it: 'Stati Uniti' }, ca: { es: 'Canadá', en: 'Canada', fr: 'Canada', it: 'Canada' }, uk: { es: 'Reino Unido', en: 'United Kingdom', fr: 'Royaume-Uni', it: 'Regno Unito' } };
  var UNIT = { tonelada: 't', bushel: 'bu', cwt: 'cwt', '100kg': '100 kg', kg: 'kg', litro: 'L', mmbtu: 'MMBtu', barril: 'bbl', docena: { es: 'docena', en: 'dozen', fr: 'douzaine', it: 'dozzina' }, lb: 'lb', gal: 'gal', ton_corta: 'short ton', index_2020_100: '2020 = 100' };
  var SRC = { eu_agrifood: 'Comisión Europea · Agri-food Data Portal', usda_nass: 'USDA NASS (Quick Stats)', statcan: 'Statistics Canada', defra: 'DEFRA', eurostat: 'Eurostat', world_bank: 'Banco Mundial', usda_ams_mars: 'USDA AMS', european_commission: 'Comisión Europea', eu_oil_bulletin: 'Boletín Petrolero de la UE', eia: 'U.S. EIA', usda_ers: 'USDA ERS' };

  /* ---------- léxicos (texto normalizado: minúsculas, sin acentos) ---------- */
  var REGION_WORDS = [
    ['eu', ['union europea', 'european union', 'union europeenne', 'unione europea', 'europa', 'europe', 'europea', 'europeo', 'europeenne', 'europeen', 'ue', 'eu', 'ue 27']],
    ['us', ['estados unidos', 'united states', 'etats unis', 'stati uniti', 'ee uu', 'eeuu', 'usa', 'us', 'u s', 'americano', 'estadounidense', 'american', 'americain', 'americana']],
    ['ca', ['canada', 'canadian', 'canadiense', 'canadese', 'canadien']],
    ['uk', ['reino unido', 'united kingdom', 'royaume uni', 'regno unito', 'gran bretana', 'great britain', 'britain', 'british', 'uk', 'britanico']]
  ];
  var COUNTRY_WORDS = [ // país con perfil propio (no es una región de precios)
    ['ES', { es: 'España', en: 'Spain', fr: 'Espagne', it: 'Spagna' }, ['espana', 'spain', 'espagne', 'spagna', 'espanol', 'spanish']], ['FR', { es: 'Francia', en: 'France', fr: 'France', it: 'Francia' }, ['francia', 'france', 'frances', 'french', 'francais']],
    ['DE', { es: 'Alemania', en: 'Germany', fr: 'Allemagne', it: 'Germania' }, ['alemania', 'germany', 'allemagne', 'germania', 'aleman', 'german']], ['PT', { es: 'Portugal', en: 'Portugal', fr: 'Portugal', it: 'Portogallo' }, ['portugal', 'portogallo', 'portugues']],
    ['NL', { es: 'Países Bajos', en: 'Netherlands', fr: 'Pays-Bas', it: 'Paesi Bassi' }, ['paises bajos', 'netherlands', 'pays bas', 'paesi bassi', 'holanda', 'holland']], ['BE', { es: 'Bélgica', en: 'Belgium', fr: 'Belgique', it: 'Belgio' }, ['belgica', 'belgium', 'belgique', 'belgio']],
    ['AT', { es: 'Austria', en: 'Austria', fr: 'Autriche', it: 'Austria' }, ['austria', 'autriche']], ['DK', { es: 'Dinamarca', en: 'Denmark', fr: 'Danemark', it: 'Danimarca' }, ['dinamarca', 'denmark', 'danemark', 'danimarca']],
    ['AU', { es: 'Australia', en: 'Australia', fr: 'Australie', it: 'Australia' }, ['australia', 'australie', 'australiano']], ['IT', { es: 'Italia', en: 'Italy', fr: 'Italie', it: 'Italia' }, ['italia', 'italy', 'italie', 'italiano']]
  ];
  var STATES = [ // [código, [nombres normalizados]]
    ['AR', ['arkansas']], ['CA', ['california']], ['CO', ['colorado']], ['IA', ['iowa']], ['IL', ['illinois']], ['IN', ['indiana']], ['KS', ['kansas']], ['KY', ['kentucky']], ['MD', ['maryland']], ['MN', ['minnesota']], ['MO', ['missouri']], ['MS', ['mississippi']],
    ['MT', ['montana']], ['NC', ['carolina del norte', 'north carolina', 'caroline du nord', 'carolina del nord']], ['ND', ['dakota del norte', 'north dakota', 'dakota du nord', 'dakota del nord']], ['NE', ['nebraska']], ['OH', ['ohio']], ['OK', ['oklahoma']],
    ['PA', ['pensilvania', 'pennsylvania', 'pennsylvanie', 'pennsylvania']], ['SC', ['carolina del sur', 'south carolina', 'caroline du sud', 'carolina del sud']], ['SD', ['dakota del sur', 'south dakota', 'dakota du sud', 'dakota del sud']], ['TN', ['tennessee']], ['TX', ['texas']], ['VA', ['virginia']], ['WY', ['wyoming']]
  ];
  var STATE_NAME = { AR: 'Arkansas', CA: 'California', CO: 'Colorado', IA: 'Iowa', IL: 'Illinois', IN: 'Indiana', KS: 'Kansas', KY: 'Kentucky', MD: 'Maryland', MN: 'Minnesota', MO: 'Missouri', MS: 'Mississippi', MT: 'Montana', NC: 'North Carolina', ND: 'North Dakota', NE: 'Nebraska', OH: 'Ohio', OK: 'Oklahoma', PA: 'Pennsylvania', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', VA: 'Virginia', WY: 'Wyoming' };
  var CASH = { maiz: 'corn', soja_grano: 'soybeans', trigo: 'wheat', sorgo: 'sorghum', cebada: 'barley', avena: 'oats' };
  var CASH_NAME = { corn: { es: 'maíz', en: 'corn', fr: 'maïs', it: 'mais' }, soybeans: { es: 'soja', en: 'soybeans', fr: 'soja', it: 'soia' }, wheat: { es: 'trigo', en: 'wheat', fr: 'blé', it: 'frumento' }, sorghum: { es: 'sorgo', en: 'sorghum', fr: 'sorgho', it: 'sorgo' }, barley: { es: 'cebada', en: 'barley', fr: 'orge', it: 'orzo' }, oats: { es: 'avena', en: 'oats', fr: 'avoine', it: 'avena' } };
  var ERS = { maiz: 'maiz', soja_grano: 'soja', trigo: 'trigo', cebada: 'cebada', avena: 'avena' };
  var PREM = { maiz: ['corn-yellow'], soja_grano: ['soybeans'], trigo: ['wheat-hrw', 'wheat-srw'] };
  var KIND_WORDS = {
    change: 'subido sube subir subida sube bajado baja bajar bajada caido caida cae variacion variaciones cambio cambios evolucion evoluciono tendencia rose rise risen rising rises up down fell fall falling drop dropped change changes changed trend moved movement evolution gain gained loss lost augmente augmenter baisse baisser hausse variation variations tendance evolue evolution monte descendu aumentato aumento aumentare sceso scendere salito salita calo variazione variazioni cambiamento tendenza ano anos year years annee annees anno anni mes meses month months mois mese mesi semana semanas week weeks ytd',
    premium: 'organico organicos organica organic organique organiques biologico biologici bio premium prima primas',
    cost: 'coste costes costo costos costi costs cout couts',
    calendar: 'cuando sale salen publica publican publicacion publicaciones calendario informe informes wasde release releases publie publient quand uscita esce calendrier calendar report reports'
  };
  var REPORT_WORDS = [ // informes oficiales de USDA que se pueden preguntar por su nombre (solo se reconocen si la pregunta lleva palabras de calendario)
    ['wasde', ['wasde']], ['crop-progress', ['crop progress', 'progreso de cultivos', 'progreso de los cultivos', 'estado de los cultivos']],
    ['crop-production', ['crop production', 'produccion de cultivos']], ['cattle-on-feed', ['cattle on feed', 'ganado en cebo', 'cebaderos']],
    ['milk-production', ['milk production', 'produccion de leche', 'production de lait', 'produzione di latte']], ['hogs-and-pigs', ['hogs and pigs']],
    ['grain-stocks', ['grain stocks', 'existencias de granos', 'existencias de cereales']], ['agricultural-prices', ['agricultural prices', 'precios agricolas']], ['cold-storage', ['cold storage']]
  ];
  var FILLER = 'vers verso depuis desde hacia principal principales mayor mayores main largest biggest top premier première principale principaux plus grand grande primo prima principali maggiore della delle degli dei qui quien quienes who whom chi quoi an ans locales local locali locaux perfil perfiles profile profil profilo does do did sur sul sulla sullo nel nella nello negli dans au aux pour avec con per at from durante en el sobre hace precio precios price prices prix prezzo prezzi cuanto cuesta cuestan vale valen costar cost costa combien coute quanto how much is are what whats the cual cuales que quel quelle quali che es son hoy actual actuales ultimo ultima ultimos ultimas reciente recientes latest current now today aujourd hui dernier derniere derniers attuale oggi dato datos data dame dime muestrame muestra show me tell give donne dimmi mostrami ahora del de la el los las en of in for por para al y and et e le les du des di il lo da un una un l a to el cuando sale when what\'s del sobre about on a ver vs versus frente contra entre between con with compara comparar compare comparer confronta confronto when next is quand sort rapport quando prossimo prochain proximo proxima'.split(' ');

  var TRADE_EXP = toSet('exportaciones exportacion exportar exporta exportan exports export exportations exportation exporte exportent esportazioni esportazione esporta esportano destino destinos destination destinations destinazione destinazioni vende venden vender sell sells selling vend vendent vendre vendono');
  var TRADE_IMP = toSet('importaciones importacion importar importa importan imports import importations importation importe importent importazioni importazione importano origen origenes origin origins origine origini compra compran comprar buy buys buying achete achetent acheter comprano');
  var TRADE_GEN = toSet('comercio trade commerce commercio');
  var TRADE_CC = { ES: 1, FR: 1, DE: 1, BE: 1, AT: 1, PT: 1, DK: 1, NL: 1, CA: 1, AU: 1 };
  var PARTY_EN = { ES: ['Spain'], FR: ['France'], DE: ['Germany'], PT: ['Portugal'], NL: ['Netherlands'], BE: ['Belgium'], AT: ['Austria'], DK: ['Denmark'], AU: ['Australia'], IT: ['Italy'], US: ['United States', 'United States of America'], GB: ['United Kingdom'], CA: ['Canada'] };
  var PW = toSet0('producir produccion production producing produce produire produrre produzione produrre growing cultivar');
  function toSet0(s) { var o = {}; s.split(' ').forEach(function (w) { if (w) o[w] = 1; }); return o; }
  function toSet(s) { var o = {}; s.split(' ').forEach(function (w) { if (w) o[w] = 1; }); return o; }
  var KW = {}; Object.keys(KIND_WORDS).forEach(function (k) { KW[k] = toSet(KIND_WORDS[k]); });
  var FILL = {}; FILLER.forEach(function (w) { if (w) FILL[w] = 1; });

  /* ---------- léxicos de las respuestas nuevas ---------- */
  function addW(map, val, str) { str.split(' ').forEach(function (w) { if (w) map[w] = val; }); }
  var PSD = { trigo: 'trigo', maiz: 'maiz', arroz: 'arroz', cebada: 'cebada', soja_grano: 'soja', harina_soja: 'harina_soja', colza: 'colza', oliva: 'oliva', cerdo: 'cerdo', pollo: 'pollo', leche: 'leche', azucar: 'azucar' };
  var PSD_KEY = { eu: 'European Union', us: 'United States', ca: 'Canada', CN: 'China', BR: 'Brazil', AR: 'Argentina', IN: 'India', UA: 'Ukraine', RU: 'Russia', MX: 'Mexico' };
  var XC = [ // países que solo existen en el balance mundial del USDA (no tienen perfil propio)
    ['CN', { es: 'China', en: 'China', fr: 'Chine', it: 'Cina' }, ['china', 'chine', 'cina', 'chino']], ['BR', { es: 'Brasil', en: 'Brazil', fr: 'Brésil', it: 'Brasile' }, ['brasil', 'brazil', 'bresil', 'brasile']],
    ['AR', { es: 'Argentina', en: 'Argentina', fr: 'Argentine', it: 'Argentina' }, ['argentina', 'argentine']], ['IN', { es: 'India', en: 'India', fr: 'Inde', it: 'India' }, ['india', 'inde']],
    ['UA', { es: 'Ucrania', en: 'Ukraine', fr: 'Ukraine', it: 'Ucraina' }, ['ucrania', 'ukraine', 'ucraina']], ['RU', { es: 'Rusia', en: 'Russia', fr: 'Russie', it: 'Russia' }, ['rusia', 'russia', 'russie']],
    ['MX', { es: 'México', en: 'Mexico', fr: 'Mexique', it: 'Messico' }, ['mexico', 'mexique', 'messico']]
  ];
  var SUPW = {}; addW(SUPW, 'endingStocks', 'existencias stocks stock inventario inventarios reservas reserves scorte'); addW(SUPW, 'consumption', 'consumo consumption consommation consumi'); addW(SUPW, 'area', 'superficie superficies area areas surface superficie'); addW(SUPW, 'generic', 'oferta demanda balance supply demand offre demande offerta domanda psd');
  var WORLDW = toSet('mundo mundial world global monde mondial mondo');
  var LANDW = toSet('tierra tierras terreno terrenos farmland land lands terre terres terra terreni'), RENTW = toSet('alquiler alquileres arrendamiento arrendamientos rent rents rental pacht loyer loyers fermage affitto affitti');
  var HARVW = toSet('cosecha cosechas harvest harvests recolte recoltes raccolto raccolti rendimiento rendimientos yield yields rendement resa'), ACKERW = toSet('labor labranza arable arables cultivable acker seminativi seminativo cropland'), GRUENW = toSet('pasto pastos prado prados grassland pasture pastures prairie prairies pascoli');
  var LAND_ROWS = [ // el orden importa: los nombres largos antes que los cortos que contienen
    ['NW', ['renania del norte westfalia', 'north rhine westphalia', 'rhenanie du nord westphalie', 'renania settentrionale vestfalia', 'nordrhein westfalen']], ['RP', ['renania palatinado', 'rhineland palatinate', 'rhenanie palatinat', 'renania palatinato', 'rheinland pfalz']],
    ['NI', ['baja sajonia', 'lower saxony', 'basse saxe', 'bassa sassonia', 'niedersachsen']], ['ST', ['sajonia anhalt', 'saxony anhalt', 'saxe anhalt', 'sassonia anhalt', 'sachsen anhalt']],
    ['MV', ['mecklemburgo pomerania occidental', 'mecklenburg western pomerania', 'mecklembourg pomeranie occidentale', 'meclemburgo pomerania anteriore', 'mecklenburg vorpommern', 'mecklemburgo']],
    ['BW', ['baden wurttemberg', 'baden wurtemberg', 'bade wurtemberg']], ['SH', ['schleswig holstein']], ['BY', ['baviera', 'bavaria', 'baviere', 'bayern']], ['BE', ['berlin', 'berlino']], ['BB', ['brandeburgo', 'brandenburg', 'brandebourg']],
    ['HB', ['bremen', 'breme', 'brema']], ['HH', ['hamburgo', 'hamburg', 'hambourg', 'amburgo']], ['HE', ['hesse', 'hessen', 'assia']], ['SL', ['sarre', 'saarland']], ['SN', ['sajonia', 'saxony', 'saxe', 'sassonia', 'sachsen']], ['TH', ['turingia', 'thuringia', 'thuringe', 'thuringen']]
  ];
  var LNAME = { BW: 'Baden-Württemberg|Baden-Wurtemberg|Bade-Wurtemberg|Baden-Württemberg', BY: 'Bavaria|Baviera|Bavière|Baviera', BE: 'Berlin|Berlín|Berlin|Berlino', BB: 'Brandenburg|Brandeburgo|Brandebourg|Brandeburgo', HB: 'Bremen|Bremen|Brême|Brema', HH: 'Hamburg|Hamburgo|Hambourg|Amburgo', HE: 'Hesse|Hesse|Hesse|Assia', MV: 'Mecklenburg-Western Pomerania|Mecklemburgo-Pomerania Occidental|Mecklembourg-Poméranie-Occidentale|Meclemburgo-Pomerania Anteriore', NI: 'Lower Saxony|Baja Sajonia|Basse-Saxe|Bassa Sassonia', NW: 'North Rhine-Westphalia|Renania del Norte-Westfalia|Rhénanie-du-Nord-Westphalie|Renania Settentrionale-Vestfalia', RP: 'Rhineland-Palatinate|Renania-Palatinado|Rhénanie-Palatinat|Renania-Palatinato', SL: 'Saarland|Sarre|Sarre|Saarland', SN: 'Saxony|Sajonia|Saxe|Sassonia', ST: 'Saxony-Anhalt|Sajonia-Anhalt|Saxe-Anhalt|Sassonia-Anhalt', SH: 'Schleswig-Holstein|Schleswig-Holstein|Schleswig-Holstein|Schleswig-Holstein', TH: 'Thuringia|Turingia|Thuringe|Turingia' };
  var CROPN = { cereals: 'Cereals|Cereales|Céréales|Cereali', wheat: 'Wheat|Trigo|Blé|Frumento', rye: 'Rye|Centeno|Seigle|Segale', barley: 'Barley|Cebada|Orge|Orzo', oats: 'Oats|Avena|Avoine|Avena', triticale: 'Triticale|Triticale|Triticale|Triticale', maize: 'Grain maize|Maíz grano|Maïs grain|Mais da granella', rapeseed: 'Rapeseed|Colza|Colza|Colza', sunflower: 'Sunflower|Girasol|Tournesol|Girasole', sugarbeet: 'Sugar beet|Remolacha azucarera|Betterave sucrière|Barbabietola da zucchero', potato: 'Potatoes|Patata|Pommes de terre|Patate', silage: 'Silage maize|Maíz forrajero|Maïs fourrage|Mais da foraggio' };
  var LI = { en: 0, es: 1, fr: 2, it: 3 };
  function pickN(map, k, lang) { var v = map[k]; if (!v) return k; var a = v.split('|'); return a[LI[lang]] || a[0]; }
  var DE_CROP = { trigo: 'wheat', maiz: 'maize', cebada: 'barley', avena: 'oats', centeno: 'rye', colza: 'rapeseed' };
  var CROP_X = [ // cultivos alemanes que no son un producto de precios; se buscan solo cuando la pregunta es sobre Alemania o un Land
    ['silage', ['maiz de silo', 'maiz forrajero', 'maiz para ensilar', 'silage maize', 'silage', 'maize silage', 'mais fourrage', 'ensilage', 'mais da foraggio', 'insilato', 'silomais']], ['sugarbeet', ['remolacha azucarera', 'remolacha', 'sugar beet', 'sugarbeet', 'sugar beets', 'betterave sucriere', 'betterave', 'barbabietola da zucchero', 'barbabietola']],
    ['potato', ['patatas', 'patata', 'potatoes', 'potato', 'pommes de terre', 'pomme de terre', 'patate', 'patata']], ['sunflower', ['girasol', 'sunflower', 'tournesol', 'girasole']], ['triticale', ['triticale']], ['cereals', ['cereales', 'cereals', 'cereal', 'cereales', 'cereali', 'cereale']]
  ];
  var DEFILL = toSet('agricola agricolas agricole agricoles agricolo agricoli agricultural agrarian farm farms'), PRICEW = toSet('precio precios price prices prix prezzo prezzi cotiza cotizacion');
  var RANKW = toSet('mas mayor mayores top biggest largest most plus piu maggiori maggiore principales best worst mejores peores');
  var UPW = toSet('subido sube suben subida subidas subir rise rises rising risen up gain gains gainers gainer climbed hausse hausses monte rialzo rialzi salito salita'), DNW = toSet('bajado baja bajan bajada bajadas bajar caido caida cae caen fell fall falls falling down drop drops dropped losers loser baisse baisses ribasso ribassi sceso scesa calo');
  var MOVW = toSet('movers'), CONNW = toSet('y and et e vs versus con with contra compara comparar compare comparer confronta confronto frente entre between o or ou');
  var MOVFILL = toSet('mas mayor mayores top biggest largest most plus piu maggiori maggiore principales best worst mejores peores fortes forte fuertes fuerte strongest strong ha han has have hoy esta este this producto productos product products produit produits prodotto prodotti gainers gainer losers loser movers hausses hausse baisses baisse rialzo rialzi ribasso ribassi cuales cual which quels quelle quali is');

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function toks(s) { var n = norm(s); return n ? n.split(' ') : []; }
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? o[k] : m; }); }
  function tx(lang) { return T[lang] || T.es; }

  /* ---------- formato ---------- */
  function nf(v, lang, d) { try { return v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function numFmt(v, lang) { var a = Math.abs(v); return nf(v, lang, a >= 1000 ? 0 : a >= 100 ? 1 : 2); }
  function pct(v, lang) { return (v > 0.0001 ? '+' : v < -0.0001 ? '−' : '') + nf(Math.abs(v), lang, 1) + ' %'; }
  function dateTxt(s, lang) {
    var p = String(s || '').split('-'); if (p.length < 2) return String(s || '');
    try { return new Date(Date.UTC(+p[0], +p[1] - 1, p[2] ? +p[2] : 1)).toLocaleDateString(lang, p[2] ? { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' } : { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return s; }
  }
  function unitTxt(u, lang) { var x = UNIT[u]; if (x && typeof x === 'object') return x[lang] || x.es; return x || u; }
  function money(v, cur, lang, d) { var s = nf(v, lang, d === undefined ? 2 : d); return cur === 'USD' ? '$' + s : cur === 'EUR' ? s + ' €' : s + ' ' + cur; }

  /* ---------- análisis de la pregunta ---------- */
  function takePhrases(n, table, lenientCodes) {
    var found = [];
    table.forEach(function (row) {
      var code = row[0], words = row[row.length - 1];
      words.slice().sort(function (a, b) { return b.length - a.length; }).forEach(function (w) {
        var re = ' ' + w + ' ';
        if (n.indexOf(re) >= 0) { if (found.indexOf(code) < 0) found.push(code); n = n.split(re).join(' '); }
      });
    });
    return { n: n, found: found };
  }
  function bestProduct(pt, env) {
    var best = null;
    (env.products || []).forEach(function (p) {
      if (!p._w) { p._w = []; LANGS.forEach(function (l) { p._w = p._w.concat(toks(p.names[l])); }); p._w = p._w.concat(toks(p.kw || '')); p._t = {}; LANGS.forEach(function (l) { p._t[l] = toks(p.names[l]).length; }); }
      var tot = 0, ok = true;
      for (var i = 0; i < pt.length; i++) {
        var b = 0; for (var j = 0; j < p._w.length; j++) { var s = env.tokScore(pt[i], p._w[j]); if (s > b) b = s; if (b === 1) break; }
        if (b < 0.6) { ok = false; break; } tot += b;
      }
      if (!ok) return;
      var sc = tot / pt.length - Math.min(p._t.es + p._t.en, 12) / 200;
      if (!best || sc > best.sc) best = { p: p, sc: sc };
    });
    return best && best.sc >= 0.55 ? best.p : null;
  }
  function firstPos(n, aliases) { var best = -1; aliases.forEach(function (a) { var i = n.indexOf(' ' + a + ' '); if (i >= 0 && (best < 0 || i < best)) best = i; }); return best; }
  function parse(query, lang, env) {
    var raw = String(query || ''), n = ' ' + norm(raw) + ' ';
    if (n.trim().length < 2) return null;
    var states = [], m;
    var up = raw.match(/\b[A-Z]{2}\b/g) || [];
    up.forEach(function (c) { if (STATE_NAME[c] && c !== 'CA' && c !== 'IN' && c !== 'OK' && c !== 'US' && c !== 'EU' && c !== 'UK') n = n.split(' ' + c.toLowerCase() + ' ').join(' '); });
    up.forEach(function (c) { if (c !== 'CA' && c !== 'IN' && c !== 'OK' && c !== 'US' && c !== 'EU' && c !== 'UK' && STATE_NAME[c] && states.indexOf(c) < 0) states.push(c); });
    m = takePhrases(n, STATES); n = m.n; m.found.forEach(function (c) { if (states.indexOf(c) < 0) states.push(c); });
    m = takePhrases(n, LAND_ROWS); n = m.n; var lands = m.found; // estados federados alemanes
    var n0 = n, parties = []; // países nombrados, en el orden en que aparecen (el primero es el sujeto del comercio)
    COUNTRY_WORDS.forEach(function (c) { var pos = firstPos(n, c[2]); if (pos >= 0) parties.push({ code: c[0], pos: pos }); });
    REGION_WORDS.forEach(function (r) { var code = { us: 'US', uk: 'GB', ca: 'CA' }[r[0]]; if (!code) return; var pos = firstPos(n, r[1].filter(function (a) { return a !== 'us' && a !== 'uk' || /[A-Z]{2}/.test(raw); })); if (pos >= 0) parties.push({ code: code, pos: pos }); });
    parties.sort(function (a, b) { return a.pos - b.pos; });
    m = takePhrases(n, REGION_WORDS); n = m.n; var regions = m.found;
    var cm = takePhrases(n, COUNTRY_WORDS.map(function (c) { return [c[0], c[2]]; })); n = cm.n; var countries = cm.found;
    var xm = takePhrases(n, XC.map(function (c) { return [c[0], c[2]]; })); n = xm.n; var xcountries = xm.found;
    var deCtx = lands.length > 0 || countries.indexOf('DE') >= 0, xcrops = [];
    if (deCtx) { m = takePhrases(n, CROP_X); n = m.n; xcrops = m.found; }
    var calHit = n.trim().split(' ').some(function (w) { return KW.calendar && KW.calendar[w]; });
    var rp = calHit ? takePhrases(n, REPORT_WORDS) : { found: [], n: n }; n = rp.n; var reports = rp.found;
    var words = n.trim() ? n.trim().split(' ') : [], kinds = {}, rest = [], prodW = false, weakCost = false, tdir = {}, sup = {}, df = {}, world = false;
    words.forEach(function (w) {
      if (TRADE_EXP[w]) { tdir.exp = 1; return; } if (TRADE_IMP[w]) { tdir.imp = 1; return; } if (TRADE_GEN[w]) { tdir.gen = 1; return; }
      if (PW[w]) { prodW = true; return; }
      if (WORLDW[w]) { world = true; return; }
      if (deCtx && DEFILL[w]) return;
      if (LANDW[w]) { df.land = 1; return; } if (RENTW[w]) { df.rent = 1; return; } if (HARVW[w]) { df.harv = 1; return; } if (ACKERW[w]) { df.acker = 1; return; } if (GRUENW[w]) { df.gruen = 1; return; }
      if (SUPW[w]) { if (SUPW[w] === 'area') { df.area = 1; } sup[SUPW[w]] = 1; return; }
      if (w === 'cost' || w === 'costa') weakCost = true;
      var hit = false; Object.keys(KW).forEach(function (k) { if (KW[k][w]) { kinds[k] = 1; hit = true; } });
      if (hit || FILL[w] || /^\d+$/.test(w) || w.length < 2) return;
      rest.push(w);
    });
    if (reports.length) kinds.calendar = 1;
    if (weakCost && prodW) kinds.cost = 1;
    // mayores subidas / bajadas: sin producto, estado ni país distinto de una región de precios
    var mv = { rank: 0, up: 0, dn: 0, mov: 0 };
    n.trim().split(' ').forEach(function (w) { if (RANKW[w]) mv.rank = 1; if (UPW[w]) mv.up = 1; if (DNW[w]) mv.dn = 1; if (MOVW[w]) mv.mov = 1; });
    var restM = rest.filter(function (w) { return !MOVFILL[w] && !UPW[w] && !DNW[w]; });
    if ((mv.up || mv.dn || mv.mov) && (mv.rank || mv.mov) && !restM.length && !states.length && !countries.length && !lands.length && !xcountries.length && !tdir.exp && !tdir.imp && !prodW && !kinds.calendar && !kinds.cost && !kinds.premium)
      return { kind: 'movers', dir: mv.up && !mv.dn ? 'up' : mv.dn && !mv.up ? 'down' : mv.mov && !mv.up && !mv.dn ? 'both' : 'both', reports: [], product: null, regions: regions, states: [], countries: [], parties: [], tdir: {} };
    var product = rest.length ? bestProduct(rest, env) : null, pair = null, i;
    var conn = toks(raw).some(function (w) { return CONNW[w]; });
    if (!product && rest.length >= 2 && conn) for (i = 1; i < rest.length && !pair; i++) { var pa = bestProduct(rest.slice(0, i), env), pb = bestProduct(rest.slice(i), env); if (pa && pb && pa.slug !== pb.slug) pair = [pa, pb]; }
    if (rest.length && !product && !pair) return null; // palabras que no entendemos: mejor no responder
    var priceHit = toks(raw).some(function (w) { return PRICEW[w]; });
    var crop = xcrops[0] || (product && DE_CROP[product.slug]) || null, deKind = null;
    if (deCtx && !states.length && !pair) {
      if (df.rent || df.land) deKind = 'land';
      else if (crop && (prodW || df.harv || df.area || (!priceHit && (lands.length || xcrops.length || countries.indexOf('DE') >= 0)))) deKind = 'prod';
      else if (lands.length && !crop && !product && !tdir.exp && !tdir.imp && !tdir.gen) deKind = 'land';
    }
    var attrs = Object.keys(sup).filter(function (k) { return k !== 'generic'; });
    if (prodW && attrs.indexOf('production') < 0) attrs.push('production'); if (tdir.exp) attrs.push('exports'); if (tdir.imp) attrs.push('imports');
    var scopes = [], badParty = parties.some(function (p) { return p.code !== 'US' && p.code !== 'CA'; }) || regions.some(function (r) { return !PSD_KEY[r]; });
    regions.forEach(function (r) { if (PSD_KEY[r]) scopes.push(r); }); xcountries.forEach(function (c) { scopes.push(c); });
    var supOk = !!(product && PSD[product.slug] && (attrs.length || sup.generic) && !states.length && !kinds.cost && !kinds.premium && !deKind && !badParty && !countries.length);
    var kind = null, tradeOk = (tdir.exp || tdir.imp || tdir.gen) && !product && !states.length && parties.length && TRADE_CC[parties[0].code] && !lands.length;
    if (tradeOk && parties.length === 1 && /(^| )(a|to|vers|verso|para|hacia)$/.test(n0.slice(0, parties[0].pos).trim())) tradeOk = false; // «exportaciones a España»: el sujeto sería otro país
    if ((tdir.exp || tdir.imp || tdir.gen) && !tradeOk && !deKind && !supOk) return null; // comercio sin sujeto claro (p. ej. «exports to Spain»): mejor la búsqueda normal
    if (tradeOk) kind = 'trade';
    else if (deKind) kind = deKind === 'land' ? 'de_land' : 'de_prod';
    else if (states.length) kind = 'local';
    else if (supOk) kind = 'supply';
    else if (kinds.premium && product && PREM[product.slug]) kind = 'premium';
    else if (kinds.cost && product && ERS[product.slug]) kind = 'cost';
    else if (pair && !kinds.calendar) kind = 'compare';
    else if (kinds.calendar && !product) kind = 'calendar';
    else if (product && kinds.change) kind = 'change';
    else if (product) kind = 'price';
    else if (countries.length && !regions.length) kind = 'country';
    else if (kinds.calendar) kind = 'calendar';
    if (!kind) return null;
    if (kind === 'price' && countries.length && !regions.length) kind = 'country';
    return { kind: kind, reports: reports, product: product, pair: pair, regions: regions, states: states, countries: countries, parties: parties.map(function (x) { return x.code; }), tdir: tdir,
      lands: lands, crop: crop, de: { land: !!df.land, rent: !!df.rent, acker: !!df.acker, gruen: !!df.gruen, area: !!df.area, harv: !!df.harv, prod: prodW }, attrs: attrs, scopes: scopes, world: world, wantChange: !!kinds.change };
  }

  /* ---------- lectura de datos ---------- */
  function J(env, p) { return env.provider.json(p).catch(function () { return null; }); }
  function obsFor(env, slug, regions) {
    var rs = regions && regions.length ? regions : ['eu', 'us', 'ca', 'uk'];
    return Promise.all(rs.map(function (r) { return J(env, 'prices/latest/' + r + '.json'); })).then(function (docs) {
      var out = []; docs.forEach(function (d) { (d && d.observations || []).forEach(function (o) { if (o.product === slug) out.push(o); }); });
      return out;
    });
  }
  function identityLine(env, o, lang) {
    var I = root.DIIdentity; if (!I || !env.identityData) return '';
    try { I.data(env.identityData); var e = I.get(o.id); return e ? I.line(e, lang) : ''; } catch (e) { return ''; }
  }
  var MONTHS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
  function histDate(h) {
    var p = String(h.period), mo, d = 1;
    if (MONTHS[p]) mo = MONTHS[p]; else if (/^\d{1,2}-\d{1,2}$/.test(p)) { mo = +p.split('-')[0]; d = +p.split('-')[1]; } else if (/^\d{1,2}$/.test(p)) mo = +p; else return null;
    return Date.UTC(h.year, mo - 1, d);
  }
  function yoy(hist, o) { // variación a 12 meses SOLO si existe un dato del año anterior (±21 días); nada se interpola
    var pts = (hist && hist.history || []).map(function (h) { return { t: histDate(h), v: h.value }; }).filter(function (x) { return x.t && typeof x.v === 'number'; });
    if (!pts.length) return null;
    var last = pts[pts.length - 1], target = last.t - 365 * 86400000, best = null;
    pts.forEach(function (x) { var dd = Math.abs(x.t - target); if (dd <= 21 * 86400000 && (!best || dd < best.dd)) best = { dd: dd, v: x.v }; });
    if (!best || !best.v) return null;
    if (o && typeof o.value === 'number' && Math.abs(last.v - o.value) > Math.abs(o.value) * 0.001 + 1e-9) return null; // el histórico no cuadra con el último dato: no se calcula
    return (last.v / best.v - 1) * 100;
  }
  function card(env, o, lang, withY12) {
    var t = tx(lang), idl = identityLine(env, o, lang);
    var c = { region: o.region, regionName: REGN[o.region] ? REGN[o.region][lang] : o.region, ident: idl, value: o.value, valueTxt: unitCurrency(o, lang), date: o.observationDate, dateTxt: dateTxt(o.observationDate, lang), changePct: typeof o.changePct === 'number' ? o.changePct : null, sid: o.sourceId, pub: o.publicationDate,
      directional: o.comparability === 'directional', source: SRC[o.sourceId] || o.sourceId, href: env.href('producto.html?p=' + encodeURIComponent(o.product)), y12: null, y12Known: false, id: o.id, product: o.product };
    return c;
  }
  function unitCurrency(o, lang) {
    if (o.unit === 'index_2020_100') return numFmt(o.value, lang) + ' (2020 = 100)';
    return numFmt(o.value, lang) + ' ' + o.currency + '/' + unitTxt(o.unit, lang);
  }
  function pname(p, lang) { return p.names[lang] || p.names.es; }

  /* ---------- resolutores ---------- */
  function rPrice(intent, lang, env, wantY12) {
    var t = tx(lang), slug = intent.product.slug, pn = pname(intent.product, lang);
    return obsFor(env, slug, intent.regions).then(function (obs) {
      if (!obs.length) {
        if (intent.regions.length) return obsFor(env, slug, null).then(function (all) {
          var where = all.map(function (o) { return REGN[o.region][lang]; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ');
          return { kind: 'price', heading: pn, cards: [], notes: [fmt(t.noneReg, { p: pn, r: intent.regions.map(function (r) { return REGN[r][lang]; }).join(', ') }) + (where ? ' ' + fmt(t.noneProd, { p: pn, r: where }) : '')], link: { href: env.href('producto.html?p=' + encodeURIComponent(slug)), label: t.open } };
        });
        return { kind: 'price', heading: pn, cards: [], notes: [t.none + ': ' + pn + '.'], link: null };
      }
      return J(env, 'instrument-identity.json').then(function (d) { env.identityData = d; }).then(function () {
        var cards = obs.map(function (o) { return card(env, o, lang); });
        var done = Promise.resolve();
        if (wantY12) done = Promise.all(obs.map(function (o, i) { return J(env, 'prices/history/' + o.region + '/' + o.product + '.json').then(function (h) { var y = yoy(h, o); cards[i].y12 = y; cards[i].y12Known = y !== null; }); }));
        return done.then(function () {
          return { kind: wantY12 ? 'change' : 'price', heading: pn, cards: cards, notes: cards.length > 1 ? [t.notComp] : [], link: { href: env.href('producto.html?p=' + encodeURIComponent(slug)), label: t.open }, y12: !!wantY12 };
        });
      });
    });
  }
  function rLocal(intent, lang, env) {
    var t = tx(lang), st = intent.states[0], sn = STATE_NAME[st], slug = intent.product && intent.product.slug, com = slug && CASH[slug];
    var base = 'precios-locales.html?s=' + st + (com ? '&c=' + com : '');
    if (!intent.product) return Promise.resolve({ kind: 'local', heading: fmt(t.localNoProd, { s: sn }), cards: [], notes: [], link: { href: env.href('precios-locales.html?s=' + st), label: t.localLink } });
    var pn = pname(intent.product, lang);
    if (!com) return Promise.resolve({ kind: 'local', heading: t.localHead, cards: [], notes: [fmt(t.noLocal, { p: pn, s: sn })], link: { href: env.href('precios-locales.html?s=' + st), label: t.localLink } });
    return J(env, 'us-cash-bids/' + st + '/' + com + '.json').then(function (d) {
      if (!d || !d.series || !d.series.length) return { kind: 'local', heading: t.localHead, cards: [], notes: [fmt(t.noLocal, { p: pn, s: sn })], link: { href: env.href('precios-locales.html?s=' + st), label: t.localLink } };
      var latest = d.series.reduce(function (m, s) { return s.date && s.date > m ? s.date : m; }, '');
      var cur = d.series.filter(function (s) { return s.date === latest && typeof s.avg === 'number'; });
      // misma especificación: la más frecuente (clase, grado, comprador); no se mezclan especificaciones distintas
      var cnt = {}; cur.forEach(function (s) { var k = [s.commodityClass, s.grade, s.deliveryPoint, s.unit].join('|'); cnt[k] = (cnt[k] || 0) + 1; });
      var key = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0];
      var grp = cur.filter(function (s) { return [s.commodityClass, s.grade, s.deliveryPoint, s.unit].join('|') === key; });
      if (!grp.length) return { kind: 'local', heading: t.localHead, cards: [], notes: [fmt(t.noLocal, { p: pn, s: sn })], link: { href: env.href(base), label: t.localLink } };
      var avgs = grp.map(function (s) { return s.avg; }), lo = Math.min.apply(null, avgs), hi = Math.max.apply(null, avgs), s0 = grp[0];
      var spec = [s0.commodityClass, s0.grade, s0.deliveryPoint].filter(Boolean).join(' · ');
      return { kind: 'local', heading: sn + ' · ' + (CASH_NAME[com] ? CASH_NAME[com][lang] : com), cards: [{ sid: 'usda_ams_mars', localRange: true, lo: lo, hi: hi, n: grp.length, cur: s0.currency, unit: s0.unit, date: latest, dateTxt: dateTxt(latest, lang), spec: spec, loTxt: money(lo, s0.currency, lang), hiTxt: money(hi, s0.currency, lang), unitTxt: unitTxt(s0.unit, lang), source: SRC.usda_ams_mars, href: env.href(base) }],
        notes: [t.localNote], link: { href: env.href(base), label: t.localLink } };
    });
  }
  function rPremium(intent, lang, env) {
    var t = tx(lang), pn = pname(intent.product, lang);
    return J(env, 'premium-tracker.json').then(function (d) {
      var ids = PREM[intent.product.slug], cells = d && d.cells ? d.cells.filter(function (c) { return ids.indexOf(c.id) >= 0; }) : [];
      var link = { href: env.href('producto.html?p=' + encodeURIComponent(intent.product.slug)), label: t.open };
      if (!cells.length) return { kind: 'premium', heading: t.premHead, cards: [], notes: [fmt(t.premNone, { p: pn })], link: link };
      var cards = [], notes = [];
      cells.forEach(function (c) {
        if (c.premium === null) { notes.push(fmt(t.premNone, { p: pn + (c['class'] ? ' ' + c['class'] : '') })); return; }
        cards.push({ sid: 'usda_ams_mars', date: c.date, premium: true, name: pn + (c['class'] ? ' · ' + c['class'] : ''), orgTxt: money(c.organic.median, 'USD', lang) + '/' + unitTxt(c.unit === 'bu' ? 'bushel' : c.unit, lang), convTxt: money(c.conventional.median, 'USD', lang) + '/' + unitTxt(c.unit === 'bu' ? 'bushel' : c.unit, lang), diffTxt: (c.premium >= 0 ? '+' : '−') + money(Math.abs(c.premium), 'USD', lang), pctTxt: pct(c.premiumPct, lang), nOrg: c.organic.n, nConv: c.conventional.n, dateTxt: dateTxt(c.date, lang), source: SRC.usda_ams_mars, href: link.href });
      });
      notes.unshift(t.premNote);
      return { kind: 'premium', heading: t.premHead, cards: cards, notes: notes, link: link };
    });
  }
  function rCost(intent, lang, env) {
    var t = tx(lang), pn = pname(intent.product, lang);
    return J(env, 'ers-cost-reference.json').then(function (d) {
      var c = d && d.crops && d.crops[ERS[intent.product.slug]];
      if (!c) return null;
      return { kind: 'cost', heading: t.costHead, cards: [{ sid: 'usda_ers', cost: true, name: pn, year: c.year, totalTxt: '$' + nf(c.totalCostsListed, lang, 0), unitTxt: t.perAcre, imputedTxt: '$' + nf(c.imputed, lang, 0), yieldTxt: c.yieldBuPerAcre ? nf(c.yieldBuPerAcre, lang, 0) + ' bu/ac' : null, source: SRC.usda_ers, href: env.href('calculadora.html') }],
        notes: [t.costNote], link: { href: env.href('calculadora.html'), label: t.costLink } };
    });
  }
  function rCalendar(intent, lang, env) {
    var t = tx(lang), U = root.DIUsdaCal, link = { href: env.href('calendario.html'), label: t.calLink };
    var base = { kind: 'calendar', heading: t.calHead, cards: [], notes: [t.calText], link: link };
    if (!U) return Promise.resolve(base);
    return J(env, 'usda-calendar.json').then(function (doc) {
      if (!doc) return base;
      var td = env.today || U.today(), ids = intent.reports && intent.reports.length ? intent.reports : null, rel = [], notes = [];
      function line(r) { return ((U.NAMES[r.id] || {})[lang] || r.name) + ': ' + U.fmtDate(r.date, lang) + (r.time ? ' · ' + r.time + ' ET' : ''); }
      if (ids) ids.forEach(function (id) { var n = U.next(doc, id, td); if (n) { rel.push(n); notes.push(line(n)); } else notes.push(fmt(t.calNone, { r: (U.NAMES[id] || {})[lang] || id })); });
      else { rel = U.upcoming(doc, td, 14).slice(0, 8); rel.forEach(function (r) { notes.push(line(r)); }); if (!rel.length) return base; }
      notes.push(t.calSrc);
      var cs = [], seen = {}; rel.forEach(function (r) { var sid = r.agency === 'OCE' ? 'usda_oce_wasde' : 'usda_nass'; if (!seen[sid]) { seen[sid] = 1; cs.push({ sid: sid }); } });
      return { kind: 'calendar', heading: t.calHead, cards: [], notes: notes, releases: rel, cites: cs, link: link };
    });
  }
  var REGN2 = null;
  function partnerName(en, lang) { // nombre del país socio en el idioma de la pantalla (Intl.DisplayNames), o el original si no se reconoce
    try {
      if (!REGN2) { REGN2 = {}; var dn = new Intl.DisplayNames(['en'], { type: 'region' }), A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', i, j, c, x; for (i = 0; i < 26; i++) for (j = 0; j < 26; j++) { c = A.charAt(i) + A.charAt(j); try { x = dn.of(c); } catch (e) { x = null; } if (x && x !== c) REGN2[x.toLowerCase()] = c; } REGN2['united states of america'] = 'US'; REGN2['united states'] = 'US'; REGN2['united kingdom'] = 'GB'; REGN2['south korea'] = 'KR'; REGN2['korea, republic of'] = 'KR'; REGN2['czechia'] = 'CZ'; }
      var cc = REGN2[String(en).toLowerCase()]; if (!cc) return en; var r = new Intl.DisplayNames([lang], { type: 'region' }).of(cc); return r && r !== cc ? r : en;
    } catch (e) { return en; }
  }
  function moneyUnit(v, u, lang) {
    var m = /^(\S+) million(?: \(.*\))?$/.exec(u), d = v >= 100 ? 0 : 1; if (!m) return nf(v, lang, d) + ' ' + u;
    return { es: nf(v, lang, d) + ' millones de ' + m[1], en: m[1] + ' ' + nf(v, lang, d) + ' million', fr: nf(v, lang, d) + ' millions de ' + m[1], it: nf(v, lang, d) + ' milioni di ' + m[1] }[lang];
  }
  function rTrade(intent, lang, env) {
    var t = tx(lang), subj = intent.parties[0], partner = intent.parties[1] || null, row = COUNTRY_WORDS.filter(function (c) { return c[0] === subj; })[0];
    var sname = row ? row[1][lang] : { CA: { es: 'Canadá', en: 'Canada', fr: 'Canada', it: 'Canada' } }[subj][lang];
    var dirs = intent.tdir.exp && !intent.tdir.imp ? ['exp'] : intent.tdir.imp && !intent.tdir.exp ? ['imp'] : ['exp', 'imp'];
    return Promise.all([env.provider.json('catalog/' + subj + '.json'), env.provider.json('license-registry.json').catch(function () { return null; })]).then(function (r) {
      var S = (r[0].series || []).filter(function (x) { return x.group === 'partners' && x.latest != null; }), reg = r[1] && r[1].sources || {}, cards = [];
      var nameOf = function (x) { var m = /^(Exports to|Imports from) (.+?):/.exec(x.label); return m ? m[2] : null; };
      dirs.forEach(function (d) {
        var pre = d === 'exp' ? 'Exports to ' : 'Imports from ', L = S.filter(function (x) { return x.label.indexOf(pre) === 0 && nameOf(x) !== 'European Union'; }), an = L.filter(function (x) { return x.freq === 'annual'; }); if (an.length) L = an;
        var pick = null;
        if (partner) { var ens = PARTY_EN[partner] || []; pick = L.filter(function (x) { return ens.indexOf(nameOf(x)) >= 0; }).sort(function (a, b) { return b.latestPeriod < a.latestPeriod ? -1 : 1; })[0]; }
        else pick = L.sort(function (a, b) { return b.latest - a.latest; })[0];
        if (!pick) return;
        var nm = partnerName(nameOf(pick), lang), sr = reg[pick.sourceId];
        cards.push({ sid: pick.sourceId, trade: true, label: partner ? (d === 'exp' ? t.tExp : t.tImp) + ' ' + nm : (d === 'exp' ? t.tTopExp : t.tTopImp) + ': ' + nm, id: pick.id, value: pick.latest, valueTxt: moneyUnit(pick.latest, pick.unit, lang), unit: pick.unit, date: pick.latestPeriod, dateTxt: pick.latestPeriod, src: sr ? sr.name : '', cc: subj, region: subj, href: env.href('paises.html?c=' + subj + '&g=partners&s=' + encodeURIComponent(pick.id)) });
      });
      if (!cards.length) return null;
      return { kind: 'trade', heading: sname + ' · ' + t.tradeHead, cards: cards, notes: [t.tNote], link: { href: env.href('paises.html?c=' + subj + '&g=partners'), label: fmt(t.tOpen, { c: sname }) } };
    });
  }
  function rCountry(intent, lang, env) {
    var t = tx(lang), cc = intent.countries[0], row = COUNTRY_WORDS.filter(function (c) { return c[0] === cc; })[0], name = row[1][lang];
    return Promise.resolve({ kind: 'country', heading: t.countryHead + ' · ' + name, cards: [], notes: [fmt(t.countryText, { c: name })], link: { href: env.href('paises.html?c=' + cc), label: t.countryLink } });
  }

  /* ---------- resolutores nuevos: oferta y demanda (USDA PSD), Alemania (Destatis), mayores variaciones, comparar productos ---------- */
  function kv(o) { o.kv = true; return o; }
  function scopeName(sc, lang) { if (REGN[sc]) return REGN[sc][lang]; var r = XC.filter(function (c) { return c[0] === sc; })[0]; return r ? r[1][lang] : sc; }
  function rSupply(intent, lang, env) {
    var t = tx(lang), u = t2(lang), slug = PSD[intent.product.slug], pn = pname(intent.product, lang);
    var link = { href: env.href('oferta-demanda.html?c=' + slug), label: fmt(u.supOpen, { p: pn }) };
    return J(env, 'supply-demand.json').then(function (d) {
      var com = d && (d.commodities || []).filter(function (c) { return c.id === slug; })[0];
      if (!com) return null;
      var y = com.latestMarketYear, scopes = intent.scopes.length ? intent.scopes.slice(0, 3) : ['world'];
      var attrs = intent.attrs.length ? intent.attrs : ['production', 'consumption', 'endingStocks', 'exports', 'imports'];
      var cards = [], notes = [], rawAll = [];
      scopes.forEach(function (sc) {
        var nm = sc === 'world' ? u.world : scopeName(sc, lang), rec, prev;
        if (sc === 'world') { rec = com.world && com.world[y]; prev = com.world && com.world[y - 1]; }
        else { var c = com.countries && com.countries[PSD_KEY[sc]]; rec = c && c.years && c.years[y]; prev = c && c.years && c.years[y - 1]; }
        if (!rec) { notes.push(fmt(u.supNone, { a: attrs.map(function (a) { return u.attrs[a].toLowerCase(); }).join(', '), p: pn, c: nm })); return; }
        var lines = [], raw = [];
        attrs.forEach(function (a) {
          if (typeof rec[a] !== 'number') { notes.push(fmt(u.supNone, { a: u.attrs[a].toLowerCase(), p: pn, c: nm })); return; }
          raw.push({ k: a, v: rec[a], prev: prev && typeof prev[a] === 'number' ? prev[a] : null });
          lines.push(u.attrs[a] + ': ' + nf(rec[a], lang, 0) + ' ' + com.unit + (prev && typeof prev[a] === 'number' ? ' (' + u.prev + ': ' + nf(prev[a], lang, 0) + ')' : ''));
        });
        if (!raw.length) return;
        var first = raw[0];
        cards.push(kv({ sid: 'usda_fas_psd', title: pn + ' · ' + nm + ' · ' + fmt(u.camp, { y: y, y2: y + 1 }), big: lines.length === 1 ? nf(first.v, lang, 0) : null, bigUnit: com.unit, lines: lines.length === 1 ? (prev && first.prev !== null ? [u.prev + ': ' + nf(first.prev, lang, 0) + ' ' + com.unit] : []) : lines, period: String(com.publishedMonth || ''), dateTxt: dateTxt(com.publishedMonth, lang), source: 'USDA FAS · PSD Online', href: link.href, raw: raw, scope: sc, marketYear: y, com: slug }));
      });
      if (!cards.length) { if (!notes.length) return null; return { kind: 'supply', heading: pn, cards: [], notes: notes, link: link }; }
      notes.unshift(u.supNote);
      return { kind: 'supply', heading: u.attrs[attrs[0]] && attrs.length === 1 ? u.attrs[attrs[0]] + ' · ' + pn : pn, cards: cards, notes: notes, link: link };
    });
  }
  function ptGet(a, y) { for (var i = 0; i < (a || []).length; i++) if (a[i][0] === y) return a[i][1]; return null; }
  function ptLast(a) { return a && a.length ? a[a.length - 1] : null; }
  function yrsOk(A, crop, vn) { // años con al menos 6 estados publicados (igual que la pestaña de producción)
    var nat = (A.production.nat[crop] || {})[vn] || [], L = A.production.land[crop] || {}, res = [];
    nat.forEach(function (p) { if (p[0] >= 2010) { var c = 0, k; for (k in L) if (ptGet(L[k][vn], p[0]) != null) c++; if (c >= 6) res.push(p[0]); } });
    return res;
  }
  function rDEProd(intent, lang, env) {
    var t = tx(lang), u = t2(lang), crop = intent.crop, cn = pickN(CROPN, crop, lang), lk = intent.lands[0], link = { href: env.href('paises.html?c=DE'), label: u.deOpen };
    return J(env, 'germany-agri.json').then(function (A) {
      if (!A || !A.production || !A.production.nat[crop]) return null;
      var ys = yrsOk(A, crop, 'prod'); if (!ys.length) return null;
      var y = ys[ys.length - 1], now = (env.today ? +String(env.today).slice(0, 4) : new Date().getFullYear()), prov = y >= now;
      var yl = String(y) + (prov ? ' (' + u.deProv + ')' : '');
      var L = A.production.land[crop] || {}, N = A.production.nat[crop], cards = [], notes = prov ? [u.deProdNote] : [];
      function lines(src) { var o = [], raw = []; [['yield', u.deYield, 'dt/ha', 1], ['area', u.deArea, 'ha', 0]].forEach(function (x) { var v = ptGet(src[x[0]], y); if (v != null) { o.push(x[1] + ': ' + nf(v, lang, x[3]) + ' ' + x[2]); raw.push({ k: x[0], v: v }); } }); return { o: o, raw: raw }; }
      function card(title, src, scope) {
        var p = ptGet(src.prod, y); if (p == null) return null; var l = lines(src);
        return kv({ sid: 'destatis', title: title, big: nf(p, lang, 0), bigUnit: 't', lines: l.o, period: String(y), dateTxt: yl, source: 'Destatis (GENESIS-Online)', href: link.href, raw: [{ k: 'prod', v: p }].concat(l.raw), scope: scope, year: y, crop: crop });
      }
      if (lk) {
        var c = L[lk] ? card(cn + ' · ' + pickN(LNAME, lk, lang), L[lk], lk) : null;
        if (c) cards.push(c); else notes.unshift(fmt(u.deNoProd, { c: cn.toLowerCase(), l: pickN(LNAME, lk, lang) }));
        var cn2 = card(cn + ' · ' + u.de, N, 'DE'); if (cn2 && c) cards.push(cn2);
      } else {
        var cn3 = card(cn + ' · ' + u.de, N, 'DE'); if (cn3) cards.push(cn3);
        var rows = []; Object.keys(L).forEach(function (k) { var v = ptGet(L[k].prod, y); if (v != null) rows.push({ k: k, v: v }); }); rows.sort(function (a, b) { return b.v - a.v; });
        if (rows.length >= 3) cards.push(kv({ sid: 'destatis', title: u.deTop + ' · ' + cn, big: null, bigUnit: 't', lines: rows.slice(0, 3).map(function (r, i) { return (i + 1) + '. ' + pickN(LNAME, r.k, lang) + ': ' + nf(r.v, lang, 0) + ' t'; }), period: String(y), dateTxt: yl, source: 'Destatis (GENESIS-Online)', href: link.href, raw: rows.slice(0, 3).map(function (r) { return { k: 'top:' + r.k, v: r.v }; }), scope: 'top', year: y, crop: crop }));
      }
      if (!cards.length) return { kind: 'de_prod', heading: cn + ' · ' + u.de, cards: [], notes: notes, link: link };
      return { kind: 'de_prod', heading: cn + ' · ' + (lk ? pickN(LNAME, lk, lang) : u.de), cards: cards, notes: notes, link: link };
    });
  }
  function rDELand(intent, lang, env) {
    var t = tx(lang), u = t2(lang), lk = intent.lands[0], K = intent.de.acker ? 'acker' : intent.de.gruen ? 'gruen' : 'lf', link = { href: env.href('paises.html?c=DE'), label: u.deOpen };
    var wantP = intent.de.land || !intent.de.rent, wantR = intent.de.rent || !intent.de.land, nm = lk ? pickN(LNAME, lk, lang) : u.de;
    return J(env, 'germany-agri.json').then(function (A) {
      if (!A || !A.landPrice || !A.rent) return null;
      var cards = [], notes = [u.deLandNote], kn = u.deKinds[K];
      if (wantP) {
        var P = lk ? (A.landPrice.land[lk] && A.landPrice.land[lk][K]) : A.landPrice.nat[K], pl = P && ptLast(P.p);
        if (pl) {
          var n = P.n ? ptGet(P.n, pl[0]) : null, p21 = ptGet(P.p, 2021), lines = [kn];
          if (n != null) lines.push(nf(n, lang, 0) + ' ' + u.deSales); if (p21 != null && pl[0] !== 2021) lines.push(u.deIn + ' 2021: ' + nf(p21, lang, 0) + ' €/ha');
          cards.push(kv({ sid: 'destatis', title: u.dePrice + ' · ' + nm, big: nf(pl[1], lang, 0), bigUnit: '€/ha', lines: lines, period: String(pl[0]), dateTxt: String(pl[0]), source: 'Destatis (GENESIS-Online)', href: link.href, raw: [{ k: 'price', v: pl[1], y: pl[0] }, { k: 'sales', v: n }], scope: lk || 'DE', kindK: K }));
        } else notes.unshift(fmt(u.deNoPrice, { l: nm }));
      }
      if (wantR) {
        var R = lk ? (A.rent.land[lk] && A.rent.land[lk][K]) : A.rent.nat[K], rl = R && ptLast(R);
        if (rl) cards.push(kv({ sid: 'destatis', title: u.deRent + ' · ' + nm, big: nf(rl[1], lang, 0), bigUnit: '€/ha', lines: [kn, u.deIn + ' 2010: ' + (ptGet(R, 2010) != null ? nf(ptGet(R, 2010), lang, 0) + ' €/ha' : '—')].slice(0, ptGet(R, 2010) != null && rl[0] !== 2010 ? 2 : 1), period: String(rl[0]), dateTxt: String(rl[0]), source: 'Destatis (GENESIS-Online)', href: link.href, raw: [{ k: 'rent', v: rl[1], y: rl[0] }], scope: lk || 'DE', kindK: K }));
        else notes.unshift(fmt(u.deNoRent, { l: nm }));
      }
      return { kind: 'de_land', heading: fmt(u.deLandHead, { l: nm }), cards: cards, notes: notes, link: link };
    });
  }
  function rMovers(intent, lang, env) {
    var t = tx(lang), u = t2(lang), rs = intent.regions.length ? intent.regions : ['eu', 'us', 'ca', 'uk'], names = {};
    (env.products || []).forEach(function (p) { names[p.slug] = p; });
    return Promise.all(rs.map(function (r) { return J(env, 'prices/latest/' + r + '.json'); })).then(function (docs) {
      var all = []; docs.forEach(function (d) { (d && d.observations || []).forEach(function (o) { if (typeof o.changePct === 'number' && isFinite(o.changePct) && Math.abs(o.changePct) > 0.0001 && names[o.product]) all.push(o); }); });
      if (!all.length) return { kind: 'movers', heading: u.movUp, cards: [], notes: [u.movNone], link: { href: env.href('precios.html'), label: u.movOpen } };
      var sides = intent.dir === 'up' ? ['up'] : intent.dir === 'down' ? ['down'] : ['up', 'down'], cards = [], per = sides.length === 1 ? 5 : 3;
      sides.forEach(function (s) {
        var L = all.filter(function (o) { return s === 'up' ? o.changePct > 0 : o.changePct < 0; }).sort(function (a, b) { return s === 'up' ? b.changePct - a.changePct : a.changePct - b.changePct; }).slice(0, per);
        L.forEach(function (o) { var pn = pname(names[o.product], lang); cards.push(kv({ sid: o.sourceId, title: (s === 'up' ? '▲ ' : '▼ ') + pn + ' · ' + (REGN[o.region] ? REGN[o.region][lang] : o.region), big: pct(o.changePct, lang), bigUnit: t.since, lines: [unitCurrency(o, lang)], period: o.observationDate, date: o.observationDate, dateTxt: dateTxt(o.observationDate, lang), source: SRC[o.sourceId] || o.sourceId, href: env.href('producto.html?p=' + encodeURIComponent(o.product)), raw: [{ k: 'changePct', v: o.changePct, id: o.id, region: o.region }], side: s, pub: o.publicationDate })); });
      });
      return { kind: 'movers', heading: sides.length === 1 ? (sides[0] === 'up' ? u.movUp : u.movDn) : u.movUp + ' / ' + u.movDn, cards: cards, notes: [u.movNote], link: { href: env.href('precios.html'), label: u.movOpen } };
    });
  }
  function rCompare(intent, lang, env) {
    var t = tx(lang), u = t2(lang), A = intent.pair[0], B = intent.pair[1], pa = pname(A, lang), pb = pname(B, lang), wantY = intent.wantChange;
    return Promise.all([obsFor(env, A.slug, intent.regions), obsFor(env, B.slug, intent.regions)]).then(function (r) {
      var oa = r[0], ob = r[1];
      if (!oa.length || !ob.length) return { kind: 'compare', heading: pa + ' · ' + pb, cards: [], notes: [t.none + ': ' + (!oa.length ? pa : pb) + '.'], link: null };
      var common = {}; oa.forEach(function (o) { ob.forEach(function (q) { if (q.region === o.region) common[o.region] = 1; }); });
      var keep = Object.keys(common).length ? function (o) { return common[o.region]; } : function () { return true; };
      var obs = oa.filter(keep).concat(ob.filter(keep));
      obs.sort(function (a, b) { return a.region === b.region ? (a.product === A.slug ? -1 : 1) : (a.region < b.region ? -1 : 1); });
      return J(env, 'instrument-identity.json').then(function (d) { env.identityData = d; }).then(function () {
        var cards = obs.map(function (o) { var c = card(env, o, lang); c.regionName = pname(o.product === A.slug ? A : B, lang) + ' · ' + c.regionName; return c; });
        var done = wantY ? Promise.all(obs.map(function (o, i) { return J(env, 'prices/history/' + o.region + '/' + o.product + '.json').then(function (h) { var y = yoy(h, o); cards[i].y12 = y; cards[i].y12Known = y !== null; }); })) : Promise.resolve();
        return done.then(function () { return { kind: 'compare', heading: pa + ' · ' + pb, cards: cards, notes: [u.cmpNote], link: { href: env.href('producto.html?p=' + encodeURIComponent(A.slug)), label: t.open + ': ' + pa }, y12: wantY }; });
      });
    });
  }

  function answer(query, lang, env) {
    lang = LANGS.indexOf(lang) >= 0 ? lang : 'es';
    var intent; try { intent = parse(query, lang, env); } catch (e) { return Promise.resolve(null); }
    if (!intent) return Promise.resolve(null);
    var p;
    switch (intent.kind) {
      case 'price': p = rPrice(intent, lang, env, false); break;
      case 'change': p = rPrice(intent, lang, env, true); break;
      case 'local': p = rLocal(intent, lang, env); break;
      case 'premium': p = rPremium(intent, lang, env); break;
      case 'cost': p = rCost(intent, lang, env); break;
      case 'calendar': p = rCalendar(intent, lang, env); break;
      case 'country': p = rCountry(intent, lang, env); break;
      case 'trade': p = rTrade(intent, lang, env); break;
      case 'supply': p = rSupply(intent, lang, env); break;
      case 'de_prod': p = rDEProd(intent, lang, env); break;
      case 'de_land': p = rDELand(intent, lang, env); break;
      case 'movers': p = rMovers(intent, lang, env); break;
      case 'compare': p = rCompare(intent, lang, env); break;
      default: p = Promise.resolve(null);
    }
    return p.then(function (a) { if (a) a.intent = { kind: intent.kind, product: intent.product && intent.product.slug, pair: intent.pair && intent.pair.map(function (x) { return x.slug; }), lands: intent.lands, crop: intent.crop, scopes: intent.scopes, attrs: intent.attrs, dir: intent.dir, regions: intent.regions, states: intent.states, countries: intent.countries }; return a; }, function () { return null; });
  }

  /* ---------- HTML ---------- */
  function render(a, lang, esc) {
    if (!a) return '';
    var t = tx(lang), h = '<div class="ds-ans" role="region" aria-label="' + esc(t.head) + '"><div class="ds-ans-h">' + esc(a.heading || t.head) + '</div>';
    (a.cards || []).forEach(function (c) {
      if (c.localRange) {
        h += '<a class="ds-card" href="' + esc(c.href) + '"><div class="ds-c-v">' + esc(c.loTxt) + ' — ' + esc(c.hiTxt) + '<small>/' + esc(c.unitTxt) + '</small></div><div class="ds-c-s">' + esc(t.range) + ' · ' + c.n + ' ' + esc(t.markets) + ' ' + esc(t.on) + ' ' + esc(c.dateTxt) + '</div><div class="ds-c-s">' + esc(c.spec) + ' · ' + esc(t.src) + ': ' + esc(c.source) + '</div></a>';
      } else if (c.kv) {
        var big = c.big ? '<div class="ds-c-v">' + (c.side ? '<span class="ds-chg ' + (c.side === 'up' ? 'up' : 'dn') + '" style="font-size:22px">' + esc(c.big) + '</span>' : esc(c.big)) + ' <small>' + esc(c.bigUnit) + '</small></div>' : '';
        h += '<a class="ds-card" href="' + esc(c.href) + '"><div class="ds-c-r">' + esc(c.title) + '</div>' + big + (c.lines || []).map(function (l) { return '<div class="ds-c-s">' + esc(l) + '</div>'; }).join('') + '<div class="ds-c-s">' + esc(t.date) + ' ' + esc(c.dateTxt) + ' · ' + esc(t.src) + ': ' + esc(c.source) + '</div></a>';
      } else if (c.trade) {
        h += '<a class="ds-card" href="' + esc(c.href) + '"><div class="ds-c-r">' + esc(c.label) + '</div><div class="ds-c-v">' + esc(c.valueTxt) + '</div><div class="ds-c-s">' + esc(t.date) + ' ' + esc(c.dateTxt) + (c.src ? ' · ' + esc(t.src) + ': ' + esc(c.src) : '') + '</div></a>';
      } else if (c.premium) {
        h += '<a class="ds-card" href="' + esc(c.href) + '"><div class="ds-c-r">' + esc(c.name) + '</div><div class="ds-c-v">' + esc(c.pctTxt) + ' <small>' + esc(t.premium) + ' (' + esc(c.diffTxt) + ')</small></div><div class="ds-c-s">' + esc(t.prem) + ' ' + esc(c.orgTxt) + ' (' + c.nOrg + ' ' + esc(t.sample) + ') · ' + esc(t.conv) + ' ' + esc(c.convTxt) + ' (' + c.nConv + ')</div><div class="ds-c-s">' + esc(t.date) + ' ' + esc(c.dateTxt) + ' · ' + esc(t.src) + ': ' + esc(c.source) + '</div></a>';
      } else if (c.cost) {
        h += '<a class="ds-card" href="' + esc(c.href) + '"><div class="ds-c-r">' + esc(c.name) + ' · ' + c.year + '</div><div class="ds-c-v">' + esc(c.totalTxt) + ' <small>' + esc(c.unitTxt) + '</small></div><div class="ds-c-s">' + esc(t.costTotal) + ' · ' + esc(t.imputed) + ': ' + esc(c.imputedTxt) + (c.yieldTxt ? ' · ' + esc(t.yld) + ' ' + esc(c.yieldTxt) : '') + '</div><div class="ds-c-s">' + esc(t.src) + ': ' + esc(c.source) + '</div></a>';
      } else {
        var ch = c.changePct === null ? '' : ' <span class="ds-chg ' + (c.changePct > 0 ? 'up' : c.changePct < 0 ? 'dn' : '') + '">' + esc(pct(c.changePct, lang)) + '</span> <span class="ds-c-s2">' + esc(t.since) + '</span>';
        var y = a.y12 ? '<div class="ds-c-s">' + (c.y12Known ? '<span class="ds-chg ' + (c.y12 > 0 ? 'up' : c.y12 < 0 ? 'dn' : '') + '">' + esc(pct(c.y12, lang)) + '</span> ' + esc(t.y12) : esc(t.noY12)) + '</div>' : '';
        h += '<a class="ds-card" href="' + esc(c.href) + '"><div class="ds-c-r">' + esc(c.regionName) + (c.directional ? ' <em>' + esc(t.directional) + '</em>' : '') + '</div>' + (c.ident ? '<div class="ds-c-id">' + esc(c.ident) + '</div>' : '') + '<div class="ds-c-v">' + esc(c.valueTxt) + ch + '</div>' + y + '<div class="ds-c-s">' + esc(t.date) + ' ' + esc(c.dateTxt) + ' · ' + esc(t.src) + ': ' + esc(c.source) + '</div></a>';
      }
    });
    (a.notes || []).forEach(function (n) { h += '<div class="ds-ans-n">' + esc(n) + '</div>'; });
    var Q = root.DICite, seenC = {}, ch = '';
    if (Q) (a.cards || []).concat(a.cites || []).forEach(function (c) { // la cita va fuera de las tarjetas (son enlaces): una por fuente y periodo
      var per = c.period || c.date || c.year || '', k = (c.sid || '') + '|' + per; if (!c.sid || seenC[k]) return; seenC[k] = 1;
      ch += Q.html(c.sid, { period: per ? String(per) : '', pub: c.pub });
    });
    if (ch) h += '<div class="ds-cites">' + ch + '</div>';
    if (a.link) h += '<a class="ds-ans-l" href="' + esc(a.link.href) + '">' + esc(a.link.label) + ' →</a>';
    return h + '</div>';
  }

  var API = { answer: answer, parse: parse, render: render, _norm: norm, _yoy: yoy };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.DehesaAnswers = API;
})(typeof window !== 'undefined' ? window : globalThis);
