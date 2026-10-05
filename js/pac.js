/* Dehesa Index — PAC España: lo que fija el Real Decreto 1048/2022 (BOE), con calculadora, calendario y seguimiento de cambios. ES5, sin librerías.
   Todos los importes salen de data/cap/es/*.json (extraídos por scripts/update-cap-es.py del texto consolidado del BOE): aquí no hay ninguna cifra de importes escrita a mano.
   Reglas de la página: los importes son los del REAL DECRETO (planificado, mínimo y máximo), nunca los importes unitarios de cada campaña que publica el FEGA; lo que se calcula
   se llama «estimación» y enseña la cuenta, el rango y su base legal; los costes los escribe la persona; lo que no tenemos se dice. Texto consolidado del BOE: meramente informativo. */
(function () {
  'use strict';
  var LSK = 'di-pac-v1', D = 'data/cap/es/', BOE = 'https://www.boe.es/';
  var LIDX = { es: 0, en: 1, fr: 2, it: 3 };
  var BONUS_PRACTICES = ['siembra-directa', 'cubiertas-vegetales'];

  var T = {
    es: {
      title: 'PAC España: ayudas por hectárea, calendario y reglas', sub: 'Lo que fija el Real Decreto 1048/2022 para las ayudas directas de la PAC (2023-2027): importes planificados, mínimos y máximos por región y ecorrégimen, reglas, plazos y los cambios del BOE. Con una calculadora de estimación con tus hectáreas y tus costes.',
      notice: 'Los importes de esta página son los del real decreto (planificado, mínimo y máximo). No son los importes unitarios de cada campaña que publica el FEGA (provisionales, revisados y definitivos), que todavía no incorporamos. Lo que aparece como «estimación» lo calcula Dehesa Index con tus datos: no es lo que vas a cobrar.',
      boeLine: 'Basado en datos de la Agencia Estatal Boletín Oficial del Estado. Texto consolidado de carácter meramente informativo, no oficial: solo son auténticos los textos del diario oficial. Consolidación del BOE actualizada el {u}; datos extraídos y revisados por Dehesa Index el {v}.',
      nav: 'En esta página', n1: 'Tu estimación', n2: 'Ecorregímenes', n3: 'Calendario', n4: 'Reglas', n5: 'Ayudas asociadas', n6: 'Cambios en el BOE', n7: 'Lo que falta',
      campaign: 'Campaña (año de la solicitud única)', region: 'Región de la ayuda básica', ha: 'Hectáreas subvencionables', young: 'Joven agricultor/a', yNo: 'No', yYes: 'Sí', yW: 'Sí, joven agricultora con control efectivo', choose: 'Elige…',
      regionHelp: 'Las 20 regiones son las del RD 1045/2022; tu región figura en tus derechos de ayuda.',
      sEst: 'Tu estimación', estIntro: 'Hectáreas × importe del real decreto de tu región y campaña. Es una estimación para orientarte: tus derechos de ayuda tienen un valor propio, hay penalizaciones, ajustes y reducciones que no conocemos, y el importe final lo fija el FEGA.',
      eco: 'Ecorregímenes que piensas solicitar', addEco: 'Añadir práctica', rmEco: 'Quitar', ecoPick: 'Práctica y tipo de superficie', ecoHa: 'Hectáreas', ecoBonus: 'Repetiré la práctica el año siguiente (+{b} €/ha)', ecoCost: 'Mi coste adicional (€/ha)', ecoCostHelp: 'Lo introduces tú: Dehesa Index no tiene costes por finca.',
      cConcept: 'Concepto', cBase: 'Cuenta', cEst: 'Estimación', cRange: 'Rango (mín.–máx.)', cLegal: 'Base legal',
      lAbrs: 'Ayuda básica a la renta (valor regional)', lRed: 'Ayuda redistributiva (tramo {n})', lYoung: 'Complemento joven', lEco: 'Ecorrégimen', lCut: 'Reducción progresiva de la ayuda básica', lTotal: 'Total estimado de pagos directos', lCost: 'Costes adicionales que has indicado', lNet: 'Neto de ecorregímenes tras tus costes',
      haIn: '{h} ha × {a} €/ha', haTier: '{h} ha × {a} €/ha (tramo hasta {t} ha)',
      wEco: 'Has puesto más hectáreas de ecorrégimen ({e} ha) que hectáreas subvencionables ({h} ha). Cada hectárea cobra una sola ayuda de ecorrégimen (art. 23.6).',
      wDeg: 'Por encima de {t} ha de este tipo de superficie puede aplicarse degresividad si el dinero del ecorrégimen no alcanza (art. 25 y Anexo XII).',
      wMin: 'El total estimado queda por debajo del umbral mínimo de 300 € (cada comunidad puede subirlo hasta 500 €): en ese caso no se pagaría ningún pago directo (art. 13).',
      wDisc: 'Alguna intervención supera 2.000 €: puede aplicarse el ajuste de disciplina financiera que fije la Unión ese año (art. 119). No está descontado.',
      wAbrs: 'La ayuda básica se cobra por derechos de ayuda con valor propio; usamos el valor regional del real decreto. Tu valor real puede ser distinto (consulta tus derechos).',
      wLab: 'La reducción progresiva se calcula sobre la ayuda básica ANTES de descontar tus costes laborales declarados (art. 16.2), que no conocemos: la reducción real puede ser menor.',
      wYoung: 'El complemento joven exige requisitos de incorporación, alta en la Seguridad Social y formación (art. 21), y dura como máximo cinco años.',
      wBounds: 'El importe de cada campaña nunca baja del mínimo ni supera el máximo del real decreto (arts. 26.4 y 124): el rango muestra esos límites.',
      noReg: 'Elige tu región y tus hectáreas para ver la estimación.',
      sEco: 'Ecorregímenes: importes del real decreto', ecoIntro: 'Para la campaña {y}. Importe planificado, mínimo y máximo en €/ha (Anexo X). El importe real de la campaña lo publica el FEGA y siempre queda entre el mínimo y el máximo.',
      eName: 'Práctica · superficie', ePlan: 'Planificado', eMin: 'Mínimo', eMax: 'Máximo', eDeg: 'Umbral de degresividad', eBonus: '+{b} €/ha si repites la práctica el año siguiente', eBudget: 'Dotación anual indicativa (Anexo XI)', eTbl: 'Tabla de importes de ecorregímenes',
      sCal: 'Calendario de la solicitud única y los pagos', calIntro: 'Fechas de la campaña {y} según el real decreto. Cada comunidad autónoma puede cambiar algunas (ver la nota de cada fila): consulta la convocatoria de la tuya.',
      cDate: 'Fecha', cWhat: 'Hito', cKind: 'Tipo', cNote: 'Nota', exc: 'Excepción de esta campaña', onlyReg: 'Solo {r}', before: 'a más tardar el {d}', inDays: 'en {n} días', past: 'ya pasó', today: 'hoy',
      k_deadline: 'plazo', k_publication: 'publica el FEGA', k_window: 'periodo', 'k_window-start': 'inicio',
      sRules: 'Reglas que más te afectan', rulesNote: 'Resumen de Dehesa Index; el texto legal manda. Los resúmenes están en español, el idioma de la norma.', legal: 'Base legal',
      sAssoc: 'Ayudas asociadas: mínimo y máximo por unidad', assocIntro: 'Campaña {y}. Importes mínimo y máximo del real decreto (Anexos XX y XXII). El importe de cada campaña lo fija el FEGA entre esos límites; no tenemos todavía los de campaña.', assocNames: 'Denominaciones en español, tal como figuran en el real decreto.', aName: 'Ayuda', aUnitHa: '€/ha', aUnitAn: '€/animal', aCrop: 'Superficie', aLive: 'Ganadería',
      sTrack: 'Seguimiento de cambios en el BOE', trackOk: 'Sin cambios pendientes de revisión: el texto de los artículos y anexos que usamos coincide con el que revisamos el {v}.', trackBad: 'El BOE ha cambiado texto que usamos desde nuestra última revisión: {l}. Hasta revisarlo, las reglas y los importes de esta página pueden estar desactualizados.',
      trackChk: 'Última comprobación automática: {c}. Consolidación del BOE actualizada el {u}.', trackAmend: 'Normas posteriores que modifican, derogan o corrigen el real decreto (según el BOE)', tId: 'Norma', tRel: 'Relación', tTxt: 'Detalle (texto del BOE)', trackLog: 'Cambios de importes detectados', trackNone: 'Ningún cambio de importes desde la primera lectura ({v}).', trackDiscr: 'Los Anexos VIII y IX del propio real decreto difieren en unos céntimos en {n} importes de la ayuda redistributiva; la calculadora usa los importes del Anexo IX de la campaña y se muestran los dos en los datos.',
      sMiss: 'Lo que aún no tenemos',
      m1: 'Los importes unitarios de cada campaña (provisionales, revisados y definitivos) que publica el FEGA en su web: no hemos podido leer su aviso legal ni acceder a sus ficheros desde nuestros servidores. Hasta entonces, solo mostramos los importes del real decreto.',
      m2: 'El valor de tus derechos de ayuda básica: es individual y lo consultas en el sistema de derechos.',
      m3: 'Tus costes: no hay costes por finca; los escribes tú en la calculadora.',
      m4: 'Condicionalidad (requisitos de gestión y buenas condiciones agrarias) y la tabla de compatibilidad entre ecorregímenes y compromisos agroambientales del MAPA.',
      m5: 'Ayudas asociadas por campaña, región y número de solicitantes, y los beneficiarios por zona (el FEGA solo ofrece una consulta por nombre; no lo vamos a rascar).',
      m6: 'Otros países: Alemania (Öko-Regelungen) es el siguiente.',
      linksT: 'Fuentes oficiales', lBoe: 'Texto consolidado en el BOE', lFega: 'FEGA: importes unitarios y consulta de ayudas', lMapa: 'MAPA: PAC 2023-2027', lMi: 'Mi mercado', lCalc: 'Calculadora',
      err: 'No se han podido cargar los datos de la PAC. Inténtalo de nuevo más tarde.', saved: 'Tus datos se guardan solo en este navegador y en la dirección de esta página; no se envían a ningún sitio.', reset: 'Borrar mis datos',
      terr: { peninsula: 'Península', insular: 'insular', baleares: 'Illes Balears' },
      prac: { 'pastoreo-extensivo': 'Pastoreo extensivo', 'islas-biodiversidad': 'Islas de biodiversidad', 'siega-sostenible': 'Siega sostenible', 'rotacion-especies-mejorantes': 'Rotación con especies mejorantes', 'siembra-directa': 'Siembra directa', 'cubiertas-vegetales': 'Cubiertas vegetales', 'cubiertas-inertes': 'Cubiertas inertes', 'espacios-biodiversidad': 'Espacios de biodiversidad' },
      surf: { 'pastos-humedos': 'pastos húmedos', 'pastos-mediterraneos': 'pastos mediterráneos', 'cultivo-secano': 'cultivo de secano', 'cultivo-secano-humedo': 'cultivo de secano húmedo', 'cultivo-regadio': 'cultivo de regadío', 'lenosos-llano': 'leñosos en llano (< 5 %)', 'lenosos-pendiente-media': 'leñosos en pendiente media (5-10 %)', 'lenosos-pendiente-elevada': 'leñosos en pendiente elevada (≥ 10 %) y bancales', 'cultivo-y-permanentes': 'tierras de cultivo y cultivos permanentes', 'cultivo-bajo-agua': 'cultivo bajo agua' },
      rt: { 'min-payment': 'Pago mínimo: 300 €', 'abrs-reduction': 'Reducción progresiva y tope de la ayuda básica', 'abrs-entitlements': 'La ayuda básica se cobra por derechos', 'redistributive': 'Ayuda redistributiva en dos tramos', 'young-farmers': 'Complemento joven: 100 ha y 5 años', 'eco-one-per-hectare': 'Un ecorrégimen por hectárea', 'eco-registry': 'Registro REA/REGA en ecorregímenes', 'eco-degressivity': 'Degresividad de los ecorregímenes', 'eco-bonus-25': 'Complemento de 25 €/ha', 'unit-bounds': 'El importe nunca sale del mínimo-máximo', 'provisional-amounts': 'Importes provisionales', 'financial-discipline': 'Disciplina financiera', 'associated-compat': 'Compatibilidad con ayudas asociadas', 'late-application': 'Solicitud fuera de plazo' },
      cal: { 'su-open': 'Empieza la solicitud única', 'su-close': 'Termina la solicitud única', 'su-modify-end': 'Último día para modificar la solicitud', 'su-adapt': 'Último día para adaptar parcelas (monitorización)', 'withdrawal': 'Último día para retirar la solicitud', 'fega-provisional': 'Importes provisionales del FEGA', 'advance': 'Periodo de anticipos (hasta el 50 %)', 'fega-revised': 'Importes revisados del FEGA y primer saldo', 'balance': 'Periodo de pago del saldo', 'fega-final': 'Importes definitivos del FEGA' },
      reg: { 'su-open': 'Tu comunidad autónoma publica su convocatoria.', 'su-close': 'Tu comunidad puede ampliarlo, sin pasar del 15 de mayo.', 'su-modify-end': 'Tu comunidad puede fijar otro día: mínimo diez días hábiles después del cierre, sin pasar del 31 de mayo.', 'su-adapt': 'Tu comunidad puede ampliarlo.', 'withdrawal': 'Tu comunidad puede cambiarlo.', 'advance': 'Lo paga tu comunidad autónoma.', 'fega-provisional': 'El importe de la ayuda básica provisional coincide con el valor nominal de tus derechos.', 'balance': '', 'fega-revised': '', 'fega-final': '' },
      ecoN: { a: 'Pastos húmedos', b: 'Pastos mediterráneos', c: 'Tierras de cultivo de secano', d: 'Tierras de cultivo de secano húmedo', e: 'Tierras de cultivo de regadío', f: 'Leñosos en terrenos llanos', g: 'Leñosos en pendiente media', h: 'Leñosos en elevada pendiente y bancales', i: 'Espacios de biodiversidad' }
    },
    en: {
      title: 'Spain CAP: payments per hectare, calendar and rules', sub: 'What Royal Decree 1048/2022 sets for CAP direct payments in Spain (2023-2027): planned, minimum and maximum amounts by region and eco-scheme, rules, deadlines and changes in the official gazette. With an estimate calculator using your hectares and your costs.',
      notice: 'The amounts on this page are those of the royal decree (planned, minimum and maximum). They are not the per-campaign unit amounts the FEGA publishes (provisional, revised and final), which we do not include yet. Anything labelled "estimate" is calculated by Dehesa Index from your inputs: it is not what you will be paid.',
      boeLine: 'Basado en datos de la Agencia Estatal Boletín Oficial del Estado. Consolidated text of a merely informative nature, not official: only the texts of the official gazette are authentic. BOE consolidation updated on {u}; data extracted and reviewed by Dehesa Index on {v}.',
      nav: 'On this page', n1: 'Your estimate', n2: 'Eco-schemes', n3: 'Calendar', n4: 'Rules', n5: 'Coupled support', n6: 'BOE changes', n7: 'What is missing',
      campaign: 'Campaign (single-application year)', region: 'Basic income support region', ha: 'Eligible hectares', young: 'Young farmer', yNo: 'No', yYes: 'Yes', yW: 'Yes, young woman farmer with effective control', choose: 'Choose…',
      regionHelp: 'The 20 regions are those of RD 1045/2022; yours appears on your payment entitlements.',
      sEst: 'Your estimate', estIntro: 'Hectares × the royal decree amount for your region and campaign. A rough guide only: your payment entitlements have their own value, there are penalties, adjustments and reductions we do not know, and the final amount is set by the FEGA.',
      eco: 'Eco-schemes you plan to apply for', addEco: 'Add a practice', rmEco: 'Remove', ecoPick: 'Practice and type of land', ecoHa: 'Hectares', ecoBonus: 'I will repeat the practice next year (+{b} €/ha)', ecoCost: 'My extra cost (€/ha)', ecoCostHelp: 'You enter it: Dehesa Index has no per-farm costs.',
      cConcept: 'Item', cBase: 'Calculation', cEst: 'Estimate', cRange: 'Range (min–max)', cLegal: 'Legal basis',
      lAbrs: 'Basic income support (regional value)', lRed: 'Redistributive support (tier {n})', lYoung: 'Young farmer top-up', lEco: 'Eco-scheme', lCut: 'Progressive reduction of basic support', lTotal: 'Estimated total direct payments', lCost: 'Extra costs you entered', lNet: 'Eco-schemes net of your costs',
      haIn: '{h} ha × {a} €/ha', haTier: '{h} ha × {a} €/ha (tier up to {t} ha)',
      wEco: 'You entered more eco-scheme hectares ({e} ha) than eligible hectares ({h} ha). Each hectare receives only one eco-scheme payment (art. 23.6).',
      wDeg: 'Above {t} ha of this type of land, degressivity may apply if the eco-scheme budget falls short (art. 25 and Annex XII).',
      wMin: 'The estimated total is below the €300 minimum (each region may raise it up to €500): in that case no direct payment would be made (art. 13).',
      wDisc: 'An intervention exceeds €2,000: the financial discipline adjustment set by the Union that year may apply (art. 119). It is not deducted.',
      wAbrs: 'Basic support is paid per payment entitlement, each with its own value; we use the regional value from the royal decree. Your actual value may differ (check your entitlements).',
      wLab: 'The progressive reduction is calculated on basic support BEFORE deducting your declared labour costs (art. 16.2), which we do not know: the real reduction may be smaller.',
      wYoung: 'The young farmer top-up requires entry conditions, social-security registration and training (art. 21), and lasts five years at most.',
      wBounds: 'The amount for each campaign never goes below the minimum or above the maximum in the royal decree (arts. 26.4 and 124): the range shows those limits.',
      noReg: 'Choose your region and hectares to see the estimate.',
      sEco: 'Eco-schemes: royal decree amounts', ecoIntro: 'For campaign {y}. Planned, minimum and maximum amount in €/ha (Annex X). The actual campaign amount is published by the FEGA and always lies between the minimum and the maximum.',
      eName: 'Practice · land', ePlan: 'Planned', eMin: 'Minimum', eMax: 'Maximum', eDeg: 'Degressivity threshold', eBonus: '+{b} €/ha if you repeat the practice next year', eBudget: 'Indicative annual budget (Annex XI)', eTbl: 'Table of eco-scheme amounts',
      sCal: 'Calendar of the single application and payments', calIntro: 'Dates for campaign {y} under the royal decree. Each autonomous community may change some (see each row\'s note): check your own call.',
      cDate: 'Date', cWhat: 'Milestone', cKind: 'Type', cNote: 'Note', exc: 'Exception for this campaign', onlyReg: 'Only {r}', before: 'no later than {d}', inDays: 'in {n} days', past: 'past', today: 'today',
      k_deadline: 'deadline', k_publication: 'FEGA publishes', k_window: 'period', 'k_window-start': 'start',
      sRules: 'Rules that affect you most', rulesNote: 'Dehesa Index summary; the legal text prevails. Summaries are in Spanish, the language of the law.', legal: 'Legal basis',
      sAssoc: 'Coupled support: minimum and maximum per unit', assocIntro: 'Campaign {y}. Minimum and maximum amounts from the royal decree (Annexes XX and XXII). The FEGA sets each campaign\'s amount between those limits; we do not have the campaign amounts yet.', assocNames: 'Names in Spanish, as in the royal decree.', aName: 'Support', aUnitHa: '€/ha', aUnitAn: '€/animal', aCrop: 'Crops', aLive: 'Livestock',
      sTrack: 'Tracking changes in the BOE', trackOk: 'No changes pending review: the text of the articles and annexes we use matches what we reviewed on {v}.', trackBad: 'The BOE has changed text we use since our last review: {l}. Until we review it, the rules and amounts on this page may be out of date.',
      trackChk: 'Last automatic check: {c}. BOE consolidation updated on {u}.', trackAmend: 'Later rules that amend, repeal or correct the royal decree (according to the BOE)', tId: 'Rule', tRel: 'Relation', tTxt: 'Detail (BOE text)', trackLog: 'Amount changes detected', trackNone: 'No amount changes since the first reading ({v}).', trackDiscr: 'Annexes VIII and IX of the royal decree itself differ by a few cents in {n} redistributive amounts; the calculator uses the campaign\'s Annex IX amounts and both are in the data.',
      sMiss: 'What we do not have yet',
      m1: 'The per-campaign unit amounts (provisional, revised and final) that the FEGA publishes on its website: we could not read its legal notice or reach its files from our servers. Until then we only show the royal decree amounts.',
      m2: 'The value of your basic support entitlements: it is individual and you check it in the entitlements system.',
      m3: 'Your costs: there are no per-farm costs; you enter them in the calculator.',
      m4: 'Conditionality (statutory management requirements and good agricultural and environmental conditions) and MAPA\'s compatibility table between eco-schemes and agri-environment commitments.',
      m5: 'Coupled support by campaign, region and number of applicants, and beneficiaries by area (the FEGA only offers a search by name; we will not scrape it).',
      m6: 'Other countries: Germany (Öko-Regelungen) is next.',
      linksT: 'Official sources', lBoe: 'Consolidated text on the BOE', lFega: 'FEGA: unit amounts and payment search', lMapa: 'MAPA: CAP 2023-2027', lMi: 'My market', lCalc: 'Calculator',
      err: 'The CAP data could not be loaded. Please try again later.', saved: 'Your inputs are saved only in this browser and in the page address; they are not sent anywhere.', reset: 'Clear my data',
      terr: { peninsula: 'Mainland', insular: 'island', baleares: 'Balearic Islands' },
      prac: { 'pastoreo-extensivo': 'Extensive grazing', 'islas-biodiversidad': 'Biodiversity islands', 'siega-sostenible': 'Sustainable mowing', 'rotacion-especies-mejorantes': 'Rotation with improving species', 'siembra-directa': 'No-till (direct seeding)', 'cubiertas-vegetales': 'Vegetation covers', 'cubiertas-inertes': 'Inert covers', 'espacios-biodiversidad': 'Biodiversity spaces' },
      surf: { 'pastos-humedos': 'humid pastures', 'pastos-mediterraneos': 'Mediterranean pastures', 'cultivo-secano': 'rainfed cropland', 'cultivo-secano-humedo': 'humid rainfed cropland', 'cultivo-regadio': 'irrigated cropland', 'lenosos-llano': 'woody crops on flat land (< 5 %)', 'lenosos-pendiente-media': 'woody crops on medium slope (5-10 %)', 'lenosos-pendiente-elevada': 'woody crops on steep slope (≥ 10 %) and terraces', 'cultivo-y-permanentes': 'cropland and permanent crops', 'cultivo-bajo-agua': 'cropland under water' },
      rt: { 'min-payment': 'Minimum payment: €300', 'abrs-reduction': 'Progressive reduction and cap on basic support', 'abrs-entitlements': 'Basic support is paid per entitlement', 'redistributive': 'Redistributive support in two tiers', 'young-farmers': 'Young farmer top-up: 100 ha and 5 years', 'eco-one-per-hectare': 'One eco-scheme per hectare', 'eco-registry': 'REA/REGA registry for eco-schemes', 'eco-degressivity': 'Eco-scheme degressivity', 'eco-bonus-25': '€25/ha top-up', 'unit-bounds': 'The amount never leaves the min-max range', 'provisional-amounts': 'Provisional amounts', 'financial-discipline': 'Financial discipline', 'associated-compat': 'Compatibility with coupled support', 'late-application': 'Late applications' },
      cal: { 'su-open': 'Single application opens', 'su-close': 'Single application closes', 'su-modify-end': 'Last day to amend the application', 'su-adapt': 'Last day to adapt parcels (monitoring)', 'withdrawal': 'Last day to withdraw the application', 'fega-provisional': 'FEGA provisional amounts', 'advance': 'Advance payment period (up to 50 %)', 'fega-revised': 'FEGA revised amounts and first balance', 'balance': 'Balance payment period', 'fega-final': 'FEGA final amounts' },
      reg: { 'su-open': 'Your autonomous community publishes its call.', 'su-close': 'Your community may extend it, but not beyond 15 May.', 'su-modify-end': 'Your community may set another day: at least ten working days after the close, not beyond 31 May.', 'su-adapt': 'Your community may extend it.', 'withdrawal': 'Your community may change it.', 'advance': 'Paid by your autonomous community.', 'fega-provisional': 'The provisional basic support amount equals the nominal value of your entitlements.', 'balance': '', 'fega-revised': '', 'fega-final': '' },
      ecoN: { a: 'Humid pastures', b: 'Mediterranean pastures', c: 'Rainfed cropland', d: 'Humid rainfed cropland', e: 'Irrigated cropland', f: 'Woody crops on flat land', g: 'Woody crops on medium slope', h: 'Woody crops on steep slope and terraces', i: 'Biodiversity spaces' }
    },
    fr: {
      title: 'PAC Espagne : aides par hectare, calendrier et règles', sub: 'Ce que fixe le décret royal 1048/2022 pour les paiements directs de la PAC en Espagne (2023-2027) : montants planifiés, minimaux et maximaux par région et par écorégime, règles, échéances et changements au journal officiel. Avec un calculateur d\'estimation selon vos hectares et vos coûts.',
      notice: 'Les montants de cette page sont ceux du décret royal (planifié, minimal et maximal). Ce ne sont pas les montants unitaires de chaque campagne publiés par le FEGA (provisoires, révisés et définitifs), que nous n\'incluons pas encore. Ce qui est marqué « estimation » est calculé par Dehesa Index avec vos données : ce n\'est pas ce que vous toucherez.',
      boeLine: 'Basado en datos de la Agencia Estatal Boletín Oficial del Estado. Texte consolidé à titre purement informatif, non officiel : seuls les textes du journal officiel font foi. Consolidation du BOE mise à jour le {u} ; données extraites et vérifiées par Dehesa Index le {v}.',
      nav: 'Sur cette page', n1: 'Votre estimation', n2: 'Écorégimes', n3: 'Calendrier', n4: 'Règles', n5: 'Aides couplées', n6: 'Changements au BOE', n7: 'Ce qui manque',
      campaign: 'Campagne (année de la demande unique)', region: 'Région de l\'aide de base', ha: 'Hectares éligibles', young: 'Jeune agriculteur', yNo: 'Non', yYes: 'Oui', yW: 'Oui, jeune agricultrice avec contrôle effectif', choose: 'Choisir…',
      regionHelp: 'Les 20 régions sont celles du RD 1045/2022 ; la vôtre figure sur vos droits à paiement.',
      sEst: 'Votre estimation', estIntro: 'Hectares × montant du décret royal pour votre région et votre campagne. Simple repère : vos droits à paiement ont une valeur propre, il y a des pénalités, ajustements et réductions que nous ignorons, et le montant final est fixé par le FEGA.',
      eco: 'Écorégimes que vous comptez demander', addEco: 'Ajouter une pratique', rmEco: 'Retirer', ecoPick: 'Pratique et type de surface', ecoHa: 'Hectares', ecoBonus: 'Je répéterai la pratique l\'an prochain (+{b} €/ha)', ecoCost: 'Mon coût supplémentaire (€/ha)', ecoCostHelp: 'C\'est vous qui le saisissez : Dehesa Index n\'a pas de coûts par exploitation.',
      cConcept: 'Poste', cBase: 'Calcul', cEst: 'Estimation', cRange: 'Fourchette (min.–max.)', cLegal: 'Base légale',
      lAbrs: 'Aide de base au revenu (valeur régionale)', lRed: 'Aide redistributive (tranche {n})', lYoung: 'Complément jeunes', lEco: 'Écorégime', lCut: 'Réduction progressive de l\'aide de base', lTotal: 'Total estimé des paiements directs', lCost: 'Coûts supplémentaires que vous avez indiqués', lNet: 'Écorégimes nets de vos coûts',
      haIn: '{h} ha × {a} €/ha', haTier: '{h} ha × {a} €/ha (tranche jusqu\'à {t} ha)',
      wEco: 'Vous avez saisi plus d\'hectares d\'écorégime ({e} ha) que d\'hectares éligibles ({h} ha). Chaque hectare ne perçoit qu\'une aide d\'écorégime (art. 23.6).',
      wDeg: 'Au-delà de {t} ha de ce type de surface, une dégressivité peut s\'appliquer si l\'enveloppe de l\'écorégime ne suffit pas (art. 25 et annexe XII).',
      wMin: 'Le total estimé est inférieur au seuil minimal de 300 € (chaque communauté peut le relever jusqu\'à 500 €) : aucun paiement direct ne serait versé (art. 13).',
      wDisc: 'Une intervention dépasse 2 000 € : l\'ajustement de discipline financière fixé par l\'Union cette année-là peut s\'appliquer (art. 119). Il n\'est pas déduit.',
      wAbrs: 'L\'aide de base est versée par droit à paiement, chacun avec sa valeur ; nous utilisons la valeur régionale du décret. Votre valeur réelle peut différer (consultez vos droits).',
      wLab: 'La réduction progressive se calcule sur l\'aide de base AVANT déduction de vos coûts de main-d\'œuvre déclarés (art. 16.2), que nous ignorons : la réduction réelle peut être moindre.',
      wYoung: 'Le complément jeunes exige des conditions d\'installation, l\'affiliation à la sécurité sociale et une formation (art. 21), et dure cinq ans au maximum.',
      wBounds: 'Le montant de chaque campagne ne descend jamais sous le minimum ni ne dépasse le maximum du décret (art. 26.4 et 124) : la fourchette montre ces limites.',
      noReg: 'Choisissez votre région et vos hectares pour voir l\'estimation.',
      sEco: 'Écorégimes : montants du décret royal', ecoIntro: 'Pour la campagne {y}. Montant planifié, minimal et maximal en €/ha (annexe X). Le montant réel de la campagne est publié par le FEGA et reste toujours entre le minimum et le maximum.',
      eName: 'Pratique · surface', ePlan: 'Planifié', eMin: 'Minimum', eMax: 'Maximum', eDeg: 'Seuil de dégressivité', eBonus: '+{b} €/ha si vous répétez la pratique l\'an prochain', eBudget: 'Enveloppe annuelle indicative (annexe XI)', eTbl: 'Tableau des montants des écorégimes',
      sCal: 'Calendrier de la demande unique et des paiements', calIntro: 'Dates de la campagne {y} selon le décret royal. Chaque communauté autonome peut en changer certaines (voir la note de chaque ligne) : consultez l\'appel de la vôtre.',
      cDate: 'Date', cWhat: 'Étape', cKind: 'Type', cNote: 'Note', exc: 'Exception de cette campagne', onlyReg: 'Seulement {r}', before: 'au plus tard le {d}', inDays: 'dans {n} jours', past: 'passé', today: 'aujourd\'hui',
      k_deadline: 'échéance', k_publication: 'publication du FEGA', k_window: 'période', 'k_window-start': 'début',
      sRules: 'Règles qui vous concernent le plus', rulesNote: 'Résumé de Dehesa Index ; le texte légal prévaut. Les résumés sont en espagnol, langue de la norme.', legal: 'Base légale',
      sAssoc: 'Aides couplées : minimum et maximum par unité', assocIntro: 'Campagne {y}. Montants minimal et maximal du décret royal (annexes XX et XXII). Le FEGA fixe le montant de chaque campagne entre ces limites ; nous n\'avons pas encore ceux des campagnes.', assocNames: 'Dénominations en espagnol, telles qu\'elles figurent dans le décret royal.', aName: 'Aide', aUnitHa: '€/ha', aUnitAn: '€/animal', aCrop: 'Cultures', aLive: 'Élevage',
      sTrack: 'Suivi des changements au BOE', trackOk: 'Aucun changement en attente de revue : le texte des articles et annexes que nous utilisons correspond à celui que nous avons revu le {v}.', trackBad: 'Le BOE a modifié un texte que nous utilisons depuis notre dernière revue : {l}. Tant que nous ne l\'avons pas revu, les règles et montants de cette page peuvent être périmés.',
      trackChk: 'Dernière vérification automatique : {c}. Consolidation du BOE mise à jour le {u}.', trackAmend: 'Normes postérieures qui modifient, abrogent ou corrigent le décret royal (selon le BOE)', tId: 'Norme', tRel: 'Relation', tTxt: 'Détail (texte du BOE)', trackLog: 'Changements de montants détectés', trackNone: 'Aucun changement de montant depuis la première lecture ({v}).', trackDiscr: 'Les annexes VIII et IX du décret royal lui-même diffèrent de quelques centimes pour {n} montants de l\'aide redistributive ; le calculateur utilise les montants de l\'annexe IX de la campagne et les deux figurent dans les données.',
      sMiss: 'Ce qui nous manque encore',
      m1: 'Les montants unitaires de chaque campagne (provisoires, révisés et définitifs) que le FEGA publie sur son site : nous n\'avons pas pu lire son avis juridique ni accéder à ses fichiers depuis nos serveurs. D\'ici là, nous ne montrons que les montants du décret royal.',
      m2: 'La valeur de vos droits à l\'aide de base : elle est individuelle et vous la consultez dans le système des droits.',
      m3: 'Vos coûts : il n\'y a pas de coûts par exploitation ; vous les saisissez dans le calculateur.',
      m4: 'La conditionnalité (exigences de gestion et bonnes conditions agricoles et environnementales) et le tableau de compatibilité du MAPA entre écorégimes et engagements agroenvironnementaux.',
      m5: 'Les aides couplées par campagne, région et nombre de demandeurs, et les bénéficiaires par zone (le FEGA n\'offre qu\'une recherche par nom ; nous ne l\'aspirerons pas).',
      m6: 'Autres pays : l\'Allemagne (Öko-Regelungen) est la suivante.',
      linksT: 'Sources officielles', lBoe: 'Texte consolidé au BOE', lFega: 'FEGA : montants unitaires et consultation des aides', lMapa: 'MAPA : PAC 2023-2027', lMi: 'Mon marché', lCalc: 'Calculateur',
      err: 'Impossible de charger les données de la PAC. Réessayez plus tard.', saved: 'Vos données sont enregistrées uniquement dans ce navigateur et dans l\'adresse de la page ; elles ne sont envoyées nulle part.', reset: 'Effacer mes données',
      terr: { peninsula: 'Péninsule', insular: 'insulaire', baleares: 'Îles Baléares' },
      prac: { 'pastoreo-extensivo': 'Pâturage extensif', 'islas-biodiversidad': 'Îlots de biodiversité', 'siega-sostenible': 'Fauche durable', 'rotacion-especies-mejorantes': 'Rotation avec espèces améliorantes', 'siembra-directa': 'Semis direct', 'cubiertas-vegetales': 'Couverts végétaux', 'cubiertas-inertes': 'Couverts inertes', 'espacios-biodiversidad': 'Espaces de biodiversité' },
      surf: { 'pastos-humedos': 'pâturages humides', 'pastos-mediterraneos': 'pâturages méditerranéens', 'cultivo-secano': 'terres de culture en sec', 'cultivo-secano-humedo': 'terres de culture en sec humide', 'cultivo-regadio': 'terres de culture irriguées', 'lenosos-llano': 'ligneux en terrain plat (< 5 %)', 'lenosos-pendiente-media': 'ligneux en pente moyenne (5-10 %)', 'lenosos-pendiente-elevada': 'ligneux en forte pente (≥ 10 %) et terrasses', 'cultivo-y-permanentes': 'terres de culture et cultures permanentes', 'cultivo-bajo-agua': 'cultures sous eau' },
      rt: { 'min-payment': 'Paiement minimal : 300 €', 'abrs-reduction': 'Réduction progressive et plafond de l\'aide de base', 'abrs-entitlements': 'L\'aide de base est versée par droit', 'redistributive': 'Aide redistributive en deux tranches', 'young-farmers': 'Complément jeunes : 100 ha et 5 ans', 'eco-one-per-hectare': 'Un écorégime par hectare', 'eco-registry': 'Registre REA/REGA pour les écorégimes', 'eco-degressivity': 'Dégressivité des écorégimes', 'eco-bonus-25': 'Complément de 25 €/ha', 'unit-bounds': 'Le montant ne sort jamais de la fourchette min-max', 'provisional-amounts': 'Montants provisoires', 'financial-discipline': 'Discipline financière', 'associated-compat': 'Compatibilité avec les aides couplées', 'late-application': 'Demande hors délai' },
      cal: { 'su-open': 'Ouverture de la demande unique', 'su-close': 'Clôture de la demande unique', 'su-modify-end': 'Dernier jour pour modifier la demande', 'su-adapt': 'Dernier jour pour adapter les parcelles (suivi)', 'withdrawal': 'Dernier jour pour retirer la demande', 'fega-provisional': 'Montants provisoires du FEGA', 'advance': 'Période des avances (jusqu\'à 50 %)', 'fega-revised': 'Montants révisés du FEGA et premier solde', 'balance': 'Période de paiement du solde', 'fega-final': 'Montants définitifs du FEGA' },
      reg: { 'su-open': 'Votre communauté autonome publie son appel.', 'su-close': 'Votre communauté peut la prolonger, sans dépasser le 15 mai.', 'su-modify-end': 'Votre communauté peut fixer un autre jour : au moins dix jours ouvrables après la clôture, sans dépasser le 31 mai.', 'su-adapt': 'Votre communauté peut la prolonger.', 'withdrawal': 'Votre communauté peut la modifier.', 'advance': 'Versée par votre communauté autonome.', 'fega-provisional': 'Le montant provisoire de l\'aide de base coïncide avec la valeur nominale de vos droits.', 'balance': '', 'fega-revised': '', 'fega-final': '' },
      ecoN: { a: 'Pâturages humides', b: 'Pâturages méditerranéens', c: 'Terres de culture en sec', d: 'Terres de culture en sec humide', e: 'Terres de culture irriguées', f: 'Ligneux en terrain plat', g: 'Ligneux en pente moyenne', h: 'Ligneux en forte pente et terrasses', i: 'Espaces de biodiversité' }
    },
    it: {
      title: 'PAC Spagna: aiuti per ettaro, calendario e regole', sub: 'Cosa stabilisce il Real Decreto 1048/2022 per i pagamenti diretti della PAC in Spagna (2023-2027): importi pianificati, minimi e massimi per regione ed ecoschema, regole, scadenze e modifiche della gazzetta ufficiale. Con un calcolatore di stima con i tuoi ettari e i tuoi costi.',
      notice: 'Gli importi di questa pagina sono quelli del real decreto (pianificato, minimo e massimo). Non sono gli importi unitari di ogni campagna pubblicati dal FEGA (provvisori, rivisti e definitivi), che non includiamo ancora. Ciò che appare come «stima» è calcolato da Dehesa Index con i tuoi dati: non è ciò che riceverai.',
      boeLine: 'Basado en datos de la Agencia Estatal Boletín Oficial del Estado. Testo consolidato a mero titolo informativo, non ufficiale: fanno fede solo i testi della gazzetta ufficiale. Consolidamento del BOE aggiornato il {u}; dati estratti e verificati da Dehesa Index il {v}.',
      nav: 'In questa pagina', n1: 'La tua stima', n2: 'Ecoschemi', n3: 'Calendario', n4: 'Regole', n5: 'Aiuti accoppiati', n6: 'Modifiche al BOE', n7: 'Cosa manca',
      campaign: 'Campagna (anno della domanda unica)', region: 'Regione del sostegno di base', ha: 'Ettari ammissibili', young: 'Giovane agricoltore', yNo: 'No', yYes: 'Sì', yW: 'Sì, giovane agricoltrice con controllo effettivo', choose: 'Scegli…',
      regionHelp: 'Le 20 regioni sono quelle del RD 1045/2022; la tua figura nei tuoi diritti all\'aiuto.',
      sEst: 'La tua stima', estIntro: 'Ettari × importo del real decreto per la tua regione e campagna. Solo un\'indicazione: i tuoi diritti hanno un valore proprio, ci sono penalità, rettifiche e riduzioni che non conosciamo, e l\'importo finale lo fissa il FEGA.',
      eco: 'Ecoschemi che pensi di richiedere', addEco: 'Aggiungi pratica', rmEco: 'Rimuovi', ecoPick: 'Pratica e tipo di superficie', ecoHa: 'Ettari', ecoBonus: 'Ripeterò la pratica l\'anno prossimo (+{b} €/ha)', ecoCost: 'Il mio costo aggiuntivo (€/ha)', ecoCostHelp: 'Lo inserisci tu: Dehesa Index non ha costi per azienda.',
      cConcept: 'Voce', cBase: 'Calcolo', cEst: 'Stima', cRange: 'Intervallo (min.–max.)', cLegal: 'Base giuridica',
      lAbrs: 'Sostegno di base al reddito (valore regionale)', lRed: 'Sostegno redistributivo (scaglione {n})', lYoung: 'Complemento giovani', lEco: 'Ecoschema', lCut: 'Riduzione progressiva del sostegno di base', lTotal: 'Totale stimato dei pagamenti diretti', lCost: 'Costi aggiuntivi che hai indicato', lNet: 'Ecoschemi al netto dei tuoi costi',
      haIn: '{h} ha × {a} €/ha', haTier: '{h} ha × {a} €/ha (scaglione fino a {t} ha)',
      wEco: 'Hai inserito più ettari di ecoschema ({e} ha) che ettari ammissibili ({h} ha). Ogni ettaro riceve un solo aiuto di ecoschema (art. 23.6).',
      wDeg: 'Oltre {t} ha di questo tipo di superficie può applicarsi la degressività se la dotazione dell\'ecoschema non basta (art. 25 e allegato XII).',
      wMin: 'Il totale stimato è inferiore alla soglia minima di 300 € (ogni comunità può alzarla fino a 500 €): in tal caso non verrebbe pagato alcun pagamento diretto (art. 13).',
      wDisc: 'Un intervento supera 2.000 €: può applicarsi la rettifica di disciplina finanziaria fissata dall\'Unione quell\'anno (art. 119). Non è dedotta.',
      wAbrs: 'Il sostegno di base si paga per diritto, ciascuno con il suo valore; usiamo il valore regionale del real decreto. Il tuo valore reale può essere diverso (consulta i tuoi diritti).',
      wLab: 'La riduzione progressiva si calcola sul sostegno di base PRIMA di dedurre i tuoi costi di lavoro dichiarati (art. 16.2), che non conosciamo: la riduzione reale può essere minore.',
      wYoung: 'Il complemento giovani richiede requisiti di insediamento, iscrizione alla previdenza sociale e formazione (art. 21), e dura al massimo cinque anni.',
      wBounds: 'L\'importo di ogni campagna non scende mai sotto il minimo né supera il massimo del real decreto (artt. 26.4 e 124): l\'intervallo mostra questi limiti.',
      noReg: 'Scegli la tua regione e i tuoi ettari per vedere la stima.',
      sEco: 'Ecoschemi: importi del real decreto', ecoIntro: 'Per la campagna {y}. Importo pianificato, minimo e massimo in €/ha (allegato X). L\'importo reale della campagna lo pubblica il FEGA e resta sempre tra il minimo e il massimo.',
      eName: 'Pratica · superficie', ePlan: 'Pianificato', eMin: 'Minimo', eMax: 'Massimo', eDeg: 'Soglia di degressività', eBonus: '+{b} €/ha se ripeti la pratica l\'anno prossimo', eBudget: 'Dotazione annua indicativa (allegato XI)', eTbl: 'Tabella degli importi degli ecoschemi',
      sCal: 'Calendario della domanda unica e dei pagamenti', calIntro: 'Date della campagna {y} secondo il real decreto. Ogni comunità autonoma può cambiarne alcune (vedi la nota di ogni riga): consulta il bando della tua.',
      cDate: 'Data', cWhat: 'Tappa', cKind: 'Tipo', cNote: 'Nota', exc: 'Eccezione di questa campagna', onlyReg: 'Solo {r}', before: 'entro il {d}', inDays: 'tra {n} giorni', past: 'passato', today: 'oggi',
      k_deadline: 'scadenza', k_publication: 'pubblica il FEGA', k_window: 'periodo', 'k_window-start': 'inizio',
      sRules: 'Le regole che ti riguardano di più', rulesNote: 'Riepilogo di Dehesa Index; prevale il testo giuridico. I riepiloghi sono in spagnolo, la lingua della norma.', legal: 'Base giuridica',
      sAssoc: 'Aiuti accoppiati: minimo e massimo per unità', assocIntro: 'Campagna {y}. Importi minimo e massimo del real decreto (allegati XX e XXII). Il FEGA fissa l\'importo di ogni campagna tra questi limiti; non abbiamo ancora quelli di campagna.', assocNames: 'Denominazioni in spagnolo, come nel real decreto.', aName: 'Aiuto', aUnitHa: '€/ha', aUnitAn: '€/capo', aCrop: 'Colture', aLive: 'Zootecnia',
      sTrack: 'Monitoraggio delle modifiche al BOE', trackOk: 'Nessuna modifica in attesa di verifica: il testo degli articoli e degli allegati che usiamo coincide con quello verificato il {v}.', trackBad: 'Il BOE ha modificato testo che usiamo dalla nostra ultima verifica: {l}. Finché non lo verifichiamo, regole e importi di questa pagina possono essere superati.',
      trackChk: 'Ultimo controllo automatico: {c}. Consolidamento del BOE aggiornato il {u}.', trackAmend: 'Norme successive che modificano, abrogano o correggono il real decreto (secondo il BOE)', tId: 'Norma', tRel: 'Relazione', tTxt: 'Dettaglio (testo del BOE)', trackLog: 'Modifiche di importi rilevate', trackNone: 'Nessuna modifica di importi dalla prima lettura ({v}).', trackDiscr: 'Gli allegati VIII e IX del real decreto stesso differiscono di pochi centesimi in {n} importi dell\'aiuto redistributivo; il calcolatore usa gli importi dell\'allegato IX della campagna e entrambi sono nei dati.',
      sMiss: 'Cosa non abbiamo ancora',
      m1: 'Gli importi unitari di ogni campagna (provvisori, rivisti e definitivi) che il FEGA pubblica sul suo sito: non abbiamo potuto leggere il suo avviso legale né accedere ai suoi file dai nostri server. Fino ad allora mostriamo solo gli importi del real decreto.',
      m2: 'Il valore dei tuoi diritti al sostegno di base: è individuale e lo consulti nel sistema dei diritti.',
      m3: 'I tuoi costi: non ci sono costi per azienda; li inserisci tu nel calcolatore.',
      m4: 'La condizionalità (criteri di gestione obbligatori e buone condizioni agronomiche e ambientali) e la tabella di compatibilità del MAPA tra ecoschemi e impegni agroambientali.',
      m5: 'Gli aiuti accoppiati per campagna, regione e numero di richiedenti, e i beneficiari per zona (il FEGA offre solo una ricerca per nome; non la estrarremo).',
      m6: 'Altri paesi: la Germania (Öko-Regelungen) è la prossima.',
      linksT: 'Fonti ufficiali', lBoe: 'Testo consolidato sul BOE', lFega: 'FEGA: importi unitari e consultazione degli aiuti', lMapa: 'MAPA: PAC 2023-2027', lMi: 'Il mio mercato', lCalc: 'Calcolatore',
      err: 'Impossibile caricare i dati della PAC. Riprova più tardi.', saved: 'I tuoi dati sono salvati solo in questo browser e nell\'indirizzo della pagina; non vengono inviati da nessuna parte.', reset: 'Cancella i miei dati',
      terr: { peninsula: 'Penisola', insular: 'insulare', baleares: 'Isole Baleari' },
      prac: { 'pastoreo-extensivo': 'Pascolo estensivo', 'islas-biodiversidad': 'Isole di biodiversità', 'siega-sostenible': 'Sfalcio sostenibile', 'rotacion-especies-mejorantes': 'Rotazione con specie miglioratrici', 'siembra-directa': 'Semina diretta', 'cubiertas-vegetales': 'Coperture vegetali', 'cubiertas-inertes': 'Coperture inerti', 'espacios-biodiversidad': 'Spazi di biodiversità' },
      surf: { 'pastos-humedos': 'pascoli umidi', 'pastos-mediterraneos': 'pascoli mediterranei', 'cultivo-secano': 'seminativi in asciutto', 'cultivo-secano-humedo': 'seminativi in asciutto umido', 'cultivo-regadio': 'seminativi irrigui', 'lenosos-llano': 'legnose in pianura (< 5 %)', 'lenosos-pendiente-media': 'legnose a pendenza media (5-10 %)', 'lenosos-pendiente-elevada': 'legnose a forte pendenza (≥ 10 %) e terrazze', 'cultivo-y-permanentes': 'seminativi e colture permanenti', 'cultivo-bajo-agua': 'colture sommerse' },
      rt: { 'min-payment': 'Pagamento minimo: 300 €', 'abrs-reduction': 'Riduzione progressiva e tetto del sostegno di base', 'abrs-entitlements': 'Il sostegno di base si paga per diritto', 'redistributive': 'Aiuto redistributivo in due scaglioni', 'young-farmers': 'Complemento giovani: 100 ha e 5 anni', 'eco-one-per-hectare': 'Un ecoschema per ettaro', 'eco-registry': 'Registro REA/REGA per gli ecoschemi', 'eco-degressivity': 'Degressività degli ecoschemi', 'eco-bonus-25': 'Complemento di 25 €/ha', 'unit-bounds': 'L\'importo non esce mai dall\'intervallo min-max', 'provisional-amounts': 'Importi provvisori', 'financial-discipline': 'Disciplina finanziaria', 'associated-compat': 'Compatibilità con gli aiuti accoppiati', 'late-application': 'Domande fuori termine' },
      cal: { 'su-open': 'Apre la domanda unica', 'su-close': 'Chiude la domanda unica', 'su-modify-end': 'Ultimo giorno per modificare la domanda', 'su-adapt': 'Ultimo giorno per adattare le particelle (monitoraggio)', 'withdrawal': 'Ultimo giorno per ritirare la domanda', 'fega-provisional': 'Importi provvisori del FEGA', 'advance': 'Periodo degli anticipi (fino al 50 %)', 'fega-revised': 'Importi rivisti del FEGA e primo saldo', 'balance': 'Periodo di pagamento del saldo', 'fega-final': 'Importi definitivi del FEGA' },
      reg: { 'su-open': 'La tua comunità autonoma pubblica il suo bando.', 'su-close': 'La tua comunità può prorogarla, non oltre il 15 maggio.', 'su-modify-end': 'La tua comunità può fissare un altro giorno: almeno dieci giorni lavorativi dopo la chiusura, non oltre il 31 maggio.', 'su-adapt': 'La tua comunità può prorogarla.', 'withdrawal': 'La tua comunità può cambiarla.', 'advance': 'Lo paga la tua comunità autonoma.', 'fega-provisional': 'L\'importo provvisorio del sostegno di base coincide con il valore nominale dei tuoi diritti.', 'balance': '', 'fega-revised': '', 'fega-final': '' },
      ecoN: { a: 'Pascoli umidi', b: 'Pascoli mediterranei', c: 'Seminativi in asciutto', d: 'Seminativi in asciutto umido', e: 'Seminativi irrigui', f: 'Legnose in pianura', g: 'Legnose a pendenza media', h: 'Legnose a forte pendenza e terrazze', i: 'Spazi di biodiversità' }
    }
  };

  /* ---------- utilidades ---------- */
  var root = document.getElementById('pac-body'), DATA = null, TOK = 0;
  var ST = { y: 0, r: '', ha: '', jv: '', eco: [] };
  function lang() { var l = window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; return T[l] ? l : 'es'; }
  function tr() { return T[lang()]; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }); } catch (e) { return v.toFixed(d); } }
  function eur(v, d) { return nf(v, d == null ? 2 : d) + ' €'; }
  function dt(iso) { try { return new Date(iso.slice(0, 10) + 'T00:00:00Z').toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function dtS(iso) { try { return new Date(iso + 'T00:00:00Z').toLocaleDateString(lang(), { day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoOf(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function daysBetween(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5); }
  function get(f) { return fetch(D + f).then(function (r) { if (!r.ok) throw new Error(f + ' ' + r.status); return r.json(); }); }
  function cite(id, period) { var Q = window.DICite; if (!Q) return ''; var c = Q.html(id, { period: String(period || '') }); return c ? '<div class="pp-cites">' + c + '</div>' : ''; }
  function citeCalc(ids, what) { var Q = window.DICite; if (!Q) return ''; var c = Q.derived(ids, { what: what }); return c ? '<div class="pp-cites">' + c + '</div>' : ''; }
  function note(s) { return '<p class="di-movers-hint">' + esc(s) + '</p>'; }
  function sect(id, title, body) { return '<section class="di-card" id="pac-' + id + '" style="padding:14px 16px;margin:14px 0" aria-labelledby="pac-t-' + id + '"><h2 id="pac-t-' + id + '" style="font-size:18px;margin:0 0 6px">' + esc(title) + '</h2>' + body + '</section>'; }
  function opt(v, label, cur) { return '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  function idx() { return DATA.amounts.campaigns.indexOf(ST.y); }
  function ecoRow(id) { var a = DATA.amounts.ecoschemes; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function ruleById(id) { var a = DATA.rules.rules; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function ecoLabel(e) { var t = tr(); return t.prac[e.practice] + ' · ' + t.surf[e.surfaceType] + (e.territory !== 'peninsula' ? ' · ' + t.terr[e.territory] : ''); }
  function hasBonus(e) { return BONUS_PRACTICES.indexOf(e.practice) >= 0; }
  function degOf(e) { var a = DATA.amounts.degressivity; for (var i = 0; i < a.length; i++) if (a[i].surfaceType === e.surfaceType) return a[i].thresholdHa; return null; }
  function bonusEur() { return ruleById('eco-bonus-25').values.bonusEurPerHa; }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) && n >= 0 ? n : null; }

  /* ---------- estado: localStorage + dirección ---------- */
  function defaultYear() { var y = new Date().getUTCFullYear(), c = DATA.amounts.campaigns; return y < c[0] ? c[0] : y > c[c.length - 1] ? c[c.length - 1] : y; }
  function readSaved() {
    var s = {}, q = null;
    try { var raw = window.localStorage.getItem(LSK); if (raw) s = JSON.parse(raw) || {}; } catch (e) { s = {}; }
    try { var u = new URLSearchParams(location.search); if (u.get('y') || u.get('r') || u.get('ha') || u.get('e')) { q = { y: u.get('y'), r: u.get('r'), ha: u.get('ha'), jv: u.get('jv'), e: u.get('e') }; } } catch (e) { q = null; }
    var o = q ? { y: +q.y, r: q.r || '', ha: q.ha || '', jv: q.jv || '', eco: parseEco(q.e) } : { y: +s.y, r: s.r || '', ha: s.ha || '', jv: s.jv || '', eco: (s.eco && s.eco.length ? s.eco : []) };
    var c = DATA.amounts.campaigns;
    ST.y = c.indexOf(o.y) >= 0 ? o.y : defaultYear();
    ST.r = DATA.amounts.regions[String(o.r)] ? String(o.r) : '';
    ST.ha = num(o.ha) != null ? String(o.ha) : '';
    ST.jv = o.jv === 'y' || o.jv === 'w' ? o.jv : '';
    ST.eco = [];
    for (var i = 0; i < (o.eco || []).length && i < 12; i++) { var r = o.eco[i]; if (r && ecoRow(r.id)) ST.eco.push({ id: r.id, ha: num(r.ha) != null ? String(r.ha) : '', bonus: r.bonus ? 1 : 0, cost: num(r.cost) != null ? String(r.cost) : '' }); }
  }
  function parseEco(s) {
    var out = []; if (!s) return out;
    String(s).split('_').forEach(function (p) { var f = p.split(':'); if (f[0]) out.push({ id: f[0], ha: f[1] || '', bonus: f[2] === '1', cost: f[3] || '' }); });
    return out;
  }
  function save() {
    try { window.localStorage.setItem(LSK, JSON.stringify({ y: ST.y, r: ST.r, ha: ST.ha, jv: ST.jv, eco: ST.eco })); } catch (e) { /* sin almacenamiento: funciona igual */ }
    try {
      var es = estimate();
      if (es) window.localStorage.setItem('di-pac-est-v1', JSON.stringify({ y: ST.y, r: ST.r, ha: es.ha, mid: es.mid, lo: es.lo, hi: es.hi, at: new Date().toISOString().slice(0, 10) }));
      else window.localStorage.removeItem('di-pac-est-v1');
    } catch (e) { /* idem */ }
    try {
      var q = ['y=' + ST.y]; if (ST.r) q.push('r=' + ST.r); if (ST.ha) q.push('ha=' + encodeURIComponent(ST.ha)); if (ST.jv) q.push('jv=' + ST.jv);
      if (ST.eco.length) q.push('e=' + ST.eco.map(function (r) { return [r.id, r.ha, r.bonus ? 1 : 0, r.cost].join(':'); }).join('_'));
      history.replaceState(null, '', '?' + q.join('&'));
    } catch (e) { /* idem */ }
  }
  function clearSaved() { try { window.localStorage.removeItem(LSK); } catch (e) { /* idem */ } ST.r = ''; ST.ha = ''; ST.jv = ''; ST.eco = []; ST.y = defaultYear(); save(); }

  /* ---------- cálculo (todos los importes salen de los datos) ---------- */
  function estimate() {
    var A = DATA.amounts, i = idx(), reg = A.regions[ST.r], ha = num(ST.ha), lines = [], w = {};
    if (!reg || ha == null || ha <= 0) return null;
    var minp = ruleById('min-payment').values, cut = ruleById('abrs-reduction').values, yv = ruleById('young-farmers').values;
    function line(key, label, base, mid, lo, hi, legal, extra) { var l = { key: key, label: label, base: base, mid: mid, lo: lo, hi: hi, legal: legal }; if (extra) for (var k in extra) l[k] = extra[k]; lines.push(l); return l; }
    var b = reg.abrs;
    var abrs = line('abrs', tr().lAbrs, fill(tr().haIn, { h: nf(ha, 2), a: nf(b.planned[i], 2) }), ha * b.planned[i], ha * b.min[i], ha * b.max[i], 'Anexo IX · arts. 14-15');
    w.abrs = true;
    var tiers = reg.redistributiveTiers, prev = 0;
    for (var t = 0; t < tiers.length; t++) {
      var T0 = tiers[t], hh = Math.max(0, Math.min(ha, T0.toHa) - prev); prev = T0.toHa;
      if (hh > 0) line('red' + (t + 1), fill(tr().lRed, { n: t + 1 }), fill(tr().haTier, { h: nf(hh, 2), a: nf(T0.planned[i], 2), t: nf(T0.toHa, 2) }), hh * T0.planned[i], hh * T0.min[i], hh * T0.max[i], 'Anexo VIII y IX · art. 19');
    }
    if (ST.jv) {
      var yy = ST.jv === 'w' ? reg.youngWomen : reg.young, yh = Math.min(ha, yv.maxHa);
      line('young', tr().lYoung, fill(tr().haIn, { h: nf(yh, 2), a: nf(yy.planned[i], 2) }), yh * yy.planned[i], yh * yy.min[i], yh * yy.max[i], 'Anexo IX · arts. 21-22'); w.young = true;
    }
    var ecoHa = 0, costs = 0, ecoMid = 0, ecoHi = 0, degW = [];
    for (var k = 0; k < ST.eco.length; k++) {
      var r = ST.eco[k], e = ecoRow(r.id), eh = num(r.ha); if (!e || eh == null || eh <= 0) continue;
      var bn = (r.bonus && hasBonus(e)) ? bonusEur() : 0, mid = Math.min(e.planned[i] + bn, e.max[i]), lo = Math.min(e.min[i] + bn, e.max[i]);
      line('eco' + k, tr().lEco + ': ' + ecoLabel(e), fill(tr().haIn, { h: nf(eh, 2), a: nf(mid, 2) }) + (bn ? ' (+' + nf(bn, 0) + ')' : ''), eh * mid, eh * lo, eh * e.max[i], 'Anexo X · arts. 23-26');
      ecoHa += eh; ecoMid += eh * mid; ecoHi += eh * e.max[i];
      var th = degOf(e); if (th != null && eh > th) degW.push(th);
      var c = num(r.cost); if (c != null) costs += c * eh;
    }
    var sum = function (f) { var s = 0; for (var q = 0; q < lines.length; q++) s += lines[q][f]; return s; };
    var res = { lines: lines, ecoHa: ecoHa, ha: ha, costs: costs, ecoMid: ecoMid, warn: { eco: ecoHa > ha + 1e-9, deg: degW, abrs: true, young: !!ST.jv } };
    // reducción progresiva de la ayuda básica (art. 16): solo sobre la ayuda básica estimada, sin costes laborales
    var red = function (v) { var r = 0, tt = cut.tiers; for (var z = 0; z < tt.length; z++) { var hi = tt[z].toEur == null ? Infinity : tt[z].toEur; if (v > tt[z].fromEur) r += (Math.min(v, hi) - tt[z].fromEur) * tt[z].reduction; } return r; };
    var cutMid = red(abrs.mid), cutLo = red(abrs.lo), cutHi = red(abrs.hi);
    if (cutMid > 0 || cutHi > 0) {
      lines.splice(1, 0, { key: 'cut', label: tr().lCut, base: '', mid: -cutMid, lo: -cutHi, hi: -cutLo, legal: 'art. 16' }); res.warn.lab = true;
    }
    res.mid = sum('mid'); res.lo = sum('lo'); res.hi = sum('hi');
    res.warn.min = res.mid < minp.minEur; res.warn.disc = false;
    for (var z = 0; z < lines.length; z++) if (lines[z].key !== 'cut' && lines[z].mid > ruleById('financial-discipline').values.thresholdEur) res.warn.disc = true;
    res.net = res.ecoMid - costs;
    res.minEur = minp.minEur; res.maxRaised = minp.maxRaisedEur;
    return res;
  }

  /* ---------- pintado ---------- */
  function formHtml() {
    var t = tr(), A = DATA.amounts, h = '<div class="de-ctl" role="group" aria-label="' + esc(t.sEst) + '">';
    h += '<label>' + esc(t.campaign) + '<br><select class="di-compare-select" data-pac="y">' + A.campaigns.map(function (c) { return opt(c, c, ST.y); }).join('') + '</select></label>';
    h += '<label>' + esc(t.region) + '<br><select class="di-compare-select" data-pac="r">' + opt('', t.choose, ST.r) + Object.keys(A.regions).sort(function (a, b) { return a - b; }).map(function (k) { return opt(k, k, ST.r); }).join('') + '</select></label>';
    h += '<label>' + esc(t.ha) + '<br><input class="di-compare-select" data-pac="ha" type="text" inputmode="decimal" autocomplete="off" value="' + esc(ST.ha) + '" style="min-width:120px"></label>';
    h += '<label>' + esc(t.young) + '<br><select class="di-compare-select" data-pac="jv">' + opt('', t.yNo, ST.jv) + opt('y', t.yYes, ST.jv) + opt('w', t.yW, ST.jv) + '</select></label></div>' + note(t.regionHelp);
    h += '<h3 style="font-size:15px;margin:14px 0 4px">' + esc(t.eco) + '</h3>';
    var groups = {}; A.ecoschemes.forEach(function (e) { (groups[e.scheme] = groups[e.scheme] || []).push(e); });
    var options = function (cur) { return '<option value="">' + esc(t.choose) + '</option>' + Object.keys(groups).sort().map(function (g) { return '<optgroup label="' + esc(t.ecoN[g]) + '">' + groups[g].map(function (e) { return opt(e.id, ecoLabel(e), cur); }).join('') + '</optgroup>'; }).join(''); };
    ST.eco.forEach(function (r, k) {
      var e = ecoRow(r.id);
      h += '<div class="de-ctl" role="group" aria-label="' + esc(t.lEco + ' ' + (k + 1)) + '" style="border-top:1px solid var(--border);padding-top:8px">';
      h += '<label style="flex:2 1 260px">' + esc(t.ecoPick) + '<br><select class="di-compare-select" data-pac-eco="' + k + '" data-f="id">' + options(r.id) + '</select></label>';
      h += '<label>' + esc(t.ecoHa) + '<br><input class="di-compare-select" type="text" inputmode="decimal" autocomplete="off" data-pac-eco="' + k + '" data-f="ha" value="' + esc(r.ha) + '" style="min-width:90px"></label>';
      h += '<label>' + esc(t.ecoCost) + '<br><input class="di-compare-select" type="text" inputmode="decimal" autocomplete="off" data-pac-eco="' + k + '" data-f="cost" value="' + esc(r.cost) + '" style="min-width:110px"></label>';
      if (e && hasBonus(e)) h += '<label style="display:flex;gap:6px;align-items:center;max-width:260px"><input type="checkbox" data-pac-eco="' + k + '" data-f="bonus"' + (r.bonus ? ' checked' : '') + '> <span>' + esc(fill(t.ecoBonus, { b: nf(bonusEur(), 0) })) + '</span></label>';
      h += '<button type="button" class="di-src-tab" data-pac-rm="' + k + '">' + esc(t.rmEco) + '</button></div>';
    });
    h += '<p><button type="button" class="di-src-tab" data-pac-add="1">' + esc(t.addEco) + '</button></p>' + note(t.ecoCostHelp);
    return h;
  }
  function resultHtml() {
    var t = tr(), e = estimate();
    if (!e) return note(t.noReg);
    var h = '<div class="de-tiles" aria-live="polite">';
    h += '<div class="de-tile"><div class="de-tl">' + esc(t.lTotal) + '</div><div class="de-tv">' + eur(e.mid, 0) + '</div><div class="de-ts">' + esc(nf(e.lo, 0) + '–' + nf(e.hi, 0) + ' €') + '</div></div>';
    if (e.costs > 0) h += '<div class="de-tile"><div class="de-tl">' + esc(t.lNet) + '</div><div class="de-tv">' + eur(e.net, 0) + '</div><div class="de-ts">' + esc(t.lCost) + ': ' + eur(e.costs, 0) + '</div></div>';
    h += '</div><div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th>' + esc(t.cConcept) + '</th><th>' + esc(t.cBase) + '</th><th class="r">' + esc(t.cEst) + '</th><th class="r">' + esc(t.cRange) + '</th><th>' + esc(t.cLegal) + '</th></tr></thead><tbody>';
    e.lines.forEach(function (l) { h += '<tr><td>' + esc(l.label) + '</td><td>' + esc(l.base) + '</td><td class="r">' + eur(l.mid) + '</td><td class="r">' + esc(nf(l.lo, 2) + ' – ' + nf(l.hi, 2) + ' €') + '</td><td>' + esc(l.legal) + '</td></tr>'; });
    h += '<tr><td><strong>' + esc(t.lTotal) + '</strong></td><td></td><td class="r"><strong>' + eur(e.mid) + '</strong></td><td class="r">' + esc(nf(e.lo, 2) + ' – ' + nf(e.hi, 2) + ' €') + '</td><td></td></tr></tbody></table></div>';
    var w = [];
    if (e.warn.eco) w.push(fill(t.wEco, { e: nf(e.ecoHa, 2), h: nf(e.ha, 2) }));
    e.warn.deg.forEach(function (th) { w.push(fill(t.wDeg, { t: nf(th, 0) })); });
    if (e.warn.min) w.push(t.wMin);
    if (e.warn.disc) w.push(t.wDisc);
    w.push(t.wAbrs); if (e.warn.lab) w.push(t.wLab); if (e.warn.young) w.push(t.wYoung); w.push(t.wBounds);
    h += '<ul class="di-movers-hint" style="margin:6px 0 0 18px">' + w.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    return h + citeCalc(['boe_es'], 'estimate = hectares × amounts of Real Decreto 1048/2022');
  }
  function estHtml() {
    var t = tr();
    return note(t.estIntro) + '<div data-pac-form>' + formHtml() + '</div><div data-pac-res style="margin-top:8px">' + resultHtml() + '</div><p class="di-movers-hint">' + esc(t.saved) + ' <button type="button" class="di-src-tab" data-pac-reset="1">' + esc(t.reset) + '</button></p>';
  }
  function ecoHtml() {
    var t = tr(), A = DATA.amounts, i = idx(), h = note(fill(t.ecoIntro, { y: ST.y }));
    h += '<div class="de-sc"><table class="de-t" data-no-cards aria-label="' + esc(t.eTbl) + '"><thead><tr><th>' + esc(t.eName) + '</th><th class="r">' + esc(t.ePlan) + '</th><th class="r">' + esc(t.eMin) + '</th><th class="r">' + esc(t.eMax) + '</th><th class="r">' + esc(t.eDeg) + '</th></tr></thead><tbody>';
    var gs = {}; A.ecoschemes.forEach(function (e) { (gs[e.scheme] = gs[e.scheme] || []).push(e); });
    Object.keys(gs).sort().forEach(function (g) {
      h += '<tr><th colspan="5" scope="colgroup" style="background:var(--surface-2,transparent)">' + esc(t.ecoN[g]) + '</th></tr>';
      gs[g].forEach(function (e) {
      var th = degOf(e);
      h += '<tr><td>' + esc(ecoLabel(e)) + (hasBonus(e) ? '<br><span class="di-movers-hint">' + esc(fill(t.eBonus, { b: nf(bonusEur(), 0) })) + '</span>' : '') + '</td><td class="r">' + nf(e.planned[i], 2) + '</td><td class="r">' + nf(e.min[i], 2) + '</td><td class="r">' + nf(e.max[i], 2) + '</td><td class="r">' + (th != null ? nf(th, 0) + ' ha' : '–') + '</td></tr>';
      });
    });
    h += '</tbody></table></div>' + note(t.eBudget + ': ' + A.ecoschemeBudget.map(function (b) { return t.ecoN[b.scheme === 'i-agua' ? 'i' : b.scheme] + (b.scheme === 'i-agua' ? ' (' + t.surf['cultivo-bajo-agua'] + ')' : '') + ' ' + nf(b.amount[i] / 1e6, 1) + ' M€'; }).join(' · '));
    return h + cite('boe_es', DATA.amounts.source.consolidatedAt.slice(0, 10));
  }
  function calEvents() {
    var R = DATA.rules, y = ST.y, ev = [];
    R.calendar.forEach(function (c) {
      var date = isoOf(y + c.when.yearOffset, c.when.month, c.when.day), until = c.until ? isoOf(y + c.until.yearOffset, c.until.month, c.until.day) : null, exc = null;
      R.campaignOverrides.forEach(function (o) {
        if (o.campaign === y && o.calendarId === c.id && o.region == null) { date = o.date; exc = o; }
        else if (o.campaign === y && o.calendarId === c.id) ev.push({ id: c.id, kind: c.kind, date: o.date, until: null, before: false, exc: o, region: o.region, base: c });
      });
      ev.push({ id: c.id, kind: c.kind, date: date, until: until, before: !!c.before, exc: exc, region: null, base: c });
    });
    ev.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return ev;
  }
  function calHtml() {
    var t = tr(), td = todayISO(), h = note(fill(t.calIntro, { y: ST.y }));
    h += '<div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th>' + esc(t.cDate) + '</th><th>' + esc(t.cWhat) + '</th><th>' + esc(t.cKind) + '</th><th>' + esc(t.cNote) + '</th></tr></thead><tbody>';
    calEvents().forEach(function (e) {
      var d = e.until ? dtS(e.date) + ' – ' + dt(e.until) : (e.before ? fill(t.before, { d: dt(e.date) }) : dt(e.date)), end = e.until || e.date, st;
      var n = daysBetween(td, end);
      st = n < 0 ? t.past : n === 0 ? t.today : fill(t.inDays, { n: n });
      var badges = (e.exc ? ' <span class="di-movers-hint">· ' + esc(t.exc) + ' (' + esc(e.exc.legalBasis.replace(/^RD 1048\/2022, /, '')) + ')</span>' : '') + (e.region ? ' <strong>' + esc(fill(t.onlyReg, { r: e.region })) + '</strong>' : '');
      h += '<tr><td class="r" style="text-align:left">' + esc(d) + '<br><span class="di-movers-hint">' + esc(st) + '</span></td><td>' + esc(t.cal[e.id]) + badges + '<br><span class="di-movers-hint">' + esc(e.base.legalBasis) + '</span></td><td>' + esc(t['k_' + e.kind]) + '</td><td>' + esc(t.reg[e.id] || '') + '</td></tr>';
    });
    return h + '</tbody></table></div>' + cite('boe_es', DATA.amounts.source.consolidatedAt.slice(0, 10));
  }
  function rulesHtml() {
    var t = tr(), h = note(t.rulesNote);
    DATA.rules.rules.forEach(function (r) {
      h += '<details style="margin:6px 0"><summary style="cursor:pointer;font-weight:600">' + esc(t.rt[r.id] || r.id) + '</summary><p style="margin:6px 0 2px">' + esc(r.text) + '</p><p class="di-movers-hint">' + esc(t.legal) + ': ' + esc(r.legalBasis) + '</p></details>';
    });
    return h + cite('boe_es', DATA.amounts.source.consolidatedAt.slice(0, 10));
  }
  function assocHtml() {
    var t = tr(), i = idx(), h = note(fill(t.assocIntro, { y: ST.y })) + (lang() !== 'es' ? note(t.assocNames) : '');
    [['crop', t.aCrop], ['livestock', t.aLive]].forEach(function (g) {
      h += '<h3 style="font-size:15px;margin:10px 0 2px">' + esc(g[1]) + '</h3><div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th>' + esc(t.aName) + '</th><th class="r">' + esc(t.eMin) + '</th><th class="r">' + esc(t.eMax) + '</th></tr></thead><tbody>';
      DATA.amounts.associatedAid.forEach(function (a) { if (a.kind === g[0]) h += '<tr><td>' + esc(a.label) + '</td><td class="r">' + nf(a.min[i], 2) + ' ' + esc(a.unit === 'EUR/ha' ? t.aUnitHa : t.aUnitAn) + '</td><td class="r">' + nf(a.max[i], 2) + ' ' + esc(a.unit === 'EUR/ha' ? t.aUnitHa : t.aUnitAn) + '</td></tr>'; });
      h += '</tbody></table></div>';
    });
    return h + cite('boe_es', DATA.amounts.source.consolidatedAt.slice(0, 10));
  }
  function trackHtml() {
    var t = tr(), W = DATA.watch, A = DATA.amounts, h = '', L = W.current.legal;
    h += W.reviewNeeded.length ? '<p role="status" style="font-weight:600;color:#a33">' + esc(fill(t.trackBad, { l: W.reviewNeeded.join('; ') })) + '</p>' : '<p role="status" style="font-weight:600;color:#2f6b4a">' + esc(fill(t.trackOk, { v: dt(DATA.rules.verifiedAt) })) + '</p>';
    h += note(fill(t.trackChk, { c: dt(W.checkedAt), u: dt(L.consolidatedAt) }));
    h += '<h3 style="font-size:15px;margin:10px 0 2px">' + esc(t.trackAmend) + '</h3><div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th>' + esc(t.tId) + '</th><th>' + esc(t.tRel) + '</th><th>' + esc(t.tTxt) + '</th></tr></thead><tbody>';
    L.amendments.forEach(function (a) { h += '<tr><td><a href="' + BOE + 'buscar/doc.php?id=' + encodeURIComponent(a.id) + '" target="_blank" rel="noopener noreferrer">' + esc(a.id) + '</a></td><td>' + esc(a.relation) + '</td><td>' + esc(a.text) + '</td></tr>'; });
    h += '</tbody></table></div><h3 style="font-size:15px;margin:10px 0 2px">' + esc(t.trackLog) + '</h3>';
    h += A.changes.length ? '<ul class="di-movers-hint" style="margin-left:18px">' + A.changes.map(function (c) { return '<li>' + esc(dt(c.detectedAt)) + ': ' + esc(c.summary) + '</li>'; }).join('') + '</ul>' : note(fill(t.trackNone, { v: dt(A.verifiedAt) }));
    if (A.discrepancies.length) h += note(fill(t.trackDiscr, { n: A.discrepancies.length }));
    return h + cite('boe_es', L.consolidatedAt.slice(0, 10));
  }
  function missHtml() {
    var t = tr(), h = '<ul style="margin:4px 0 8px 18px;font-size:14px">' + ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].map(function (k) { return '<li style="margin:3px 0">' + esc(t[k]) + '</li>'; }).join('') + '</ul>';
    h += '<p class="di-movers-hint"><strong>' + esc(t.linksT) + ':</strong></p><p>';
    [[BOE + 'buscar/act.php?id=' + DATA.rules.source.boeRef, t.lBoe], ['https://www.fega.gob.es/', t.lFega], ['https://www.mapa.gob.es/es/pac/pac-2023-2027/plan-estrategico-pac', t.lMapa]].forEach(function (l) {
      h += '<a href="' + esc(l[0]) + '" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin:3px 8px 3px 0;padding:4px 12px;border:1px solid var(--border);border-radius:14px;font-size:13px">' + esc(l[1]) + '</a>';
    });
    [['mi-mercado.html?c=ES', t.lMi]].forEach(function (l) { h += '<a href="' + l[0] + '" style="display:inline-block;margin:3px 8px 3px 0;padding:4px 12px;border:1px solid var(--border);border-radius:14px;font-size:13px">' + esc(l[1]) + '</a>'; });
    return h + '</p>';
  }
  function notES() { return !!(window.DehesaPacEU && window.DehesaPacEU.country !== 'ES'); }   // js/pac-eu.js pinta la vista UE / otros países
  function draw() {
    if (notES()) return;
    var t = tr(), tok = ++TOK;
    document.getElementById('pac-h1').textContent = t.title; document.getElementById('pac-sub').textContent = t.sub; document.title = t.title + ' | Dehesa Index';
    if (!DATA) { root.innerHTML = note(t.err); return; }
    var L = DATA.watch.current.legal, h = '<div class="di-card" role="note" style="padding:12px 16px;margin:0 0 12px;border-left:4px solid var(--accent)"><p style="margin:0;font-size:14px">' + esc(t.notice) + '</p></div>';
    h += '<p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.nav) + ': ' + [['est', 'n1'], ['eco', 'n2'], ['cal', 'n3'], ['rules', 'n4'], ['assoc', 'n5'], ['track', 'n6'], ['miss', 'n7']].map(function (a) { return '<a href="#pac-' + a[0] + '">' + esc(t[a[1]]) + '</a>'; }).join(' · ') + '</p>';
    h += sect('est', t.sEst, estHtml()) + sect('eco', t.sEco, ecoHtml()) + sect('cal', t.sCal, calHtml()) + sect('rules', t.sRules, rulesHtml()) + sect('assoc', t.sAssoc, assocHtml()) + sect('track', t.sTrack, trackHtml()) + sect('miss', t.sMiss, missHtml());
    h += '<p class="di-movers-hint" data-pac-boe><a href="' + BOE + '" target="_blank" rel="noopener noreferrer">' + esc(fill(t.boeLine, { u: dt(L.consolidatedAt), v: dt(DATA.rules.verifiedAt) })) + '</a></p>';
    root.innerHTML = h;
  }
  function refresh() { var r = root.querySelector('[data-pac-res]'); if (r) r.innerHTML = resultHtml(); }

  /* ---------- eventos ---------- */
  function onInput(e) {
    var n = e.target, a = n.getAttribute && n.getAttribute('data-pac'), k = n.getAttribute && n.getAttribute('data-pac-eco');
    if (a === 'ha') { ST.ha = n.value.replace(/[^0-9.,]/g, ''); save(); refresh(); }
    else if (k != null && n.getAttribute('data-f') !== 'id' && n.getAttribute('data-f') !== 'bonus') { ST.eco[+k][n.getAttribute('data-f')] = n.value.replace(/[^0-9.,]/g, ''); save(); refresh(); }
  }
  function onChange(e) {
    var n = e.target, a = n.getAttribute && n.getAttribute('data-pac'), k = n.getAttribute && n.getAttribute('data-pac-eco');
    if (a === 'y') { ST.y = +n.value; save(); draw(); var f = root.querySelector('[data-pac="y"]'); if (f) f.focus(); }
    else if (a === 'r') { ST.r = n.value; save(); refresh(); }
    else if (a === 'jv') { ST.jv = n.value; save(); refresh(); }
    else if (k != null) {
      var fld = n.getAttribute('data-f');
      if (fld === 'id') { ST.eco[+k].id = n.value; var ee = ecoRow(n.value); if (!ee || !hasBonus(ee)) ST.eco[+k].bonus = 0; save(); root.querySelector('[data-pac-form]').innerHTML = formHtml(); refresh(); var s = root.querySelector('[data-pac-eco="' + k + '"][data-f="id"]'); if (s) s.focus(); }
      else if (fld === 'bonus') { ST.eco[+k].bonus = n.checked ? 1 : 0; save(); refresh(); }
    }
  }
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('[data-pac-add],[data-pac-rm],[data-pac-reset]') : null; if (!b) return;
    if (b.hasAttribute('data-pac-add')) { if (ST.eco.length < 12) { var first = DATA.amounts.ecoschemes[0]; ST.eco.push({ id: first.id, ha: '', bonus: 0, cost: '' }); save(); root.querySelector('[data-pac-form]').innerHTML = formHtml(); refresh(); var s = root.querySelector('[data-pac-eco="' + (ST.eco.length - 1) + '"][data-f="ha"]'); if (s) s.focus(); } }
    else if (b.hasAttribute('data-pac-rm')) { ST.eco.splice(+b.getAttribute('data-pac-rm'), 1); save(); root.querySelector('[data-pac-form]').innerHTML = formHtml(); refresh(); var a = root.querySelector('[data-pac-add]'); if (a) a.focus(); }
    else if (b.hasAttribute('data-pac-reset')) { clearSaved(); draw(); }
  }

  function boot() {
    if (notES()) return;
    Promise.all([get('amounts.json'), get('rules.json'), get('watch.json')]).then(function (r) { DATA = { amounts: r[0], rules: r[1], watch: r[2] }; readSaved(); draw(); }, function () { DATA = null; draw(); });
  }
  if (window.DehesaShared) { window.DehesaShared.init('tools'); var prevL = window.DehesaShared.onLangChange; window.DehesaShared.onLangChange = function () { if (prevL) prevL.apply(this, arguments); draw(); }; }
  root.addEventListener('input', onInput); root.addEventListener('change', onChange); root.addEventListener('click', onClick);
  var first = function () { boot(); };
  (window.DICite ? window.DICite.load().then(first, first) : first());
})();
