/* Dehesa Index — Empresas: landing honesta para la futura API. Casos de uso, muestra real de datos (data/home-tape.json), resumen de licencias
   (data/commercial-summary.json), formulario de contacto y lista de espera. No hay servidor: los dos formularios preparan un correo a
   dehesaindex@gmail.com y no guardan nada. ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared;
  var MAIL = 'dehesaindex@gmail.com';
  var T = {
    es: {
      title: 'Empresas | Dehesa Index', badge: 'PARA EMPRESAS', h1: 'Datos agrícolas listos para integrar en tu operación',
      sub: 'Dehesa Index está preparando una API de precios y estadísticas agrarias por producto y región, pensada para quien necesita estos datos dentro de su propio sistema y no solo en una web para consultar a mano. Aún no está a la venta: aquí ves qué hay, qué se podría ofrecer y cómo apuntarte.',
      whatTitle: 'QUÉ HAY DETRÁS',
      whatP1: 'El panel público reúne precios oficiales de EE. UU., la UE, Reino Unido y Canadá, y estadísticas agrarias de decenas de países. Cada cifra lleva su fuente, su fecha y su licencia, y lo que no es un dato oficial se marca como tal.',
      whatP2: 'La API llevará ese mismo modelo, con cada precio identificado por producto y región, a un formato pensado para hojas de cálculo, ERPs o sistemas de riesgo, en lugar de copiarlo a mano desde el panel.',
      stats: ['productos y variantes con precio', 'mercados de precios (EE. UU., UE, Reino Unido y Canadá)', 'fuentes con uso comercial permitido, algunas con condiciones (de {t} en uso)'],
      useTitle: 'PARA QUÉ SIRVE', useSub: 'Cuatro formas de usarlo, con los datos que ya publicamos.',
      lData: 'Datos que usaría', lLinks: 'Verlo en el sitio',
      cases: [
        { name: 'Cooperativas agrícolas', problem: 'Decidir con los socios cuándo vender y a qué precio, y saber si el margen aguanta.',
          data: ['Precios de referencia por producto y mercado, con histórico.', 'Lonjas y mercados regionales.', 'Coste por hectárea y precio de equilibrio.', 'Ayudas de la PAC por país.'],
          links: [['precios.html', 'Precios'], ['lonjas.html', 'Lonjas'], ['calculadora.html', 'Calculadora de margen'], ['pac.html', 'PAC']] },
        { name: 'Traders y brokers', problem: 'Alimentar sus modelos con series limpias y ver cuándo un mercado se mueve respecto a otro.',
          data: ['Precios por producto y región en un mismo formato (JSON y CSV).', 'Relaciones entre mercados, como leche/pienso o ganado/maíz.', 'Ventas semanales de exportación de EE. UU. y comercio por socio.', 'Calendario de publicaciones oficiales.'],
          links: [['relaciones.html', 'Relaciones entre mercados'], ['exportaciones.html', 'Exportaciones'], ['oferta-demanda.html', 'Oferta y demanda'], ['calendario.html', 'Calendario']] },
        { name: 'Aseguradoras', problem: 'Valorar el riesgo de cosecha: cuánto rinde un cultivo, cómo va la campaña y dónde aprieta la sequía.',
          data: ['Rendimientos y producción por región.', 'Progreso de cultivos de EE. UU. y datos de seguro de cosecha de EE. UU. y Canadá.', 'Indicadores de sequía de la UE y de varios países.', 'Clima histórico.'],
          links: [['rendimientos.html', 'Rendimientos'], ['cultivos.html', 'Cultivos'], ['sequia.html', 'Sequía'], ['clima.html', 'Clima']],
          note: 'Algunos conjuntos, como el U.S. Drought Monitor, quedan fuera de la oferta comercial por su licencia.' },
        { name: 'Bancos', problem: 'Evaluar financiación agraria: valor de la garantía, coste de producción, margen y entorno macro.',
          data: ['Precios y tendencias de los productos financiados.', 'Precio y alquiler de la tierra en varios países.', 'Indicadores macro y tipos de cambio por país.', 'Costes de producción y margen.'],
          links: [['precios.html', 'Precios'], ['paises.html', 'Países'], ['costes.html', 'Costes']] }
      ],
      others: 'También: fabricantes de fertilizantes y pienso (vigilar insumos), empresas de alimentación (costes de materia prima), y medios y analistas (series citables con fuente y fecha).',
      sampleTitle: 'MUESTRA DE DATOS', sampleSub: 'Estas filas son reales y salen del panel de hoy. El formato final de la API puede cambiar.',
      tabs: ['Tabla', 'JSON', 'CSV'], copy: 'Copiar', copied: 'Copiado', cols: ['Producto', 'Mercado', 'Valor', 'Fecha', 'Fuente', 'Uso comercial'],
      vApto: 'Apta', vCond: 'Con condiciones', vNo: 'No apta', sampleFail: 'No se pudo cargar la muestra ahora mismo.',
      apiTitle: 'QUÉ HAY HECHO Y QUÉ FALTA', apiStatus: 'API y descargas disponibles',
      apiFeatures: ['Ya disponible: precios actuales e histórico por producto y región en ficheros JSON públicos y en CSV y Excel descargables.', 'Ya disponible: se actualizan con la misma cadencia que el panel público, y la página de estado muestra qué fuente va al día y cuál no.', 'Ya disponible: el paquete descargable está dividido por mercado (UE, EE. UU., Reino Unido, Canadá) y cada fila lleva su tipo de precio y su veredicto de licencia.', 'Ya disponible: API de datos en JSON, gratis y sin clave, con fuente, licencia y atribución en cada serie (ver la página API).', 'Pendiente: avisos automáticos cuando un precio cruza un umbral. Necesitan un servicio de correo y de momento no hay servidor.', 'Pendiente: acceso con clave y límites propios, que no hacen falta mientras todo sean ficheros estáticos.'],
      apiNow: 'Mientras tanto, los ficheros JSON y CSV públicos del sitio, descritos en data/api.json, siguen disponibles. Su uso comercial depende de la licencia de cada fuente.',
      condTitle: 'QUÉ SE PODRÍA OFRECER', condBody: 'De las {t} fuentes en uso, {a} permiten uso comercial sin reservas, {c} lo permiten con condiciones y {n} se quedan fuera por tener la licencia pendiente o sin confirmar. Cada fichero y cada fuente tiene su veredicto público.', condBtn: 'Ver las condiciones',
      cTitle: 'Escríbenos', cBody: 'Cuéntanos qué datos necesitas y para qué. Lo leemos nosotros y te contestamos.',
      lTitle: 'Lista de espera', lBody: 'Déjanos tu correo y te avisamos cuando la API esté disponible. Tendrán prioridad quienes se apunten antes.',
      fName: 'Nombre', fCompany: 'Empresa', fRole: 'Tu actividad', fEmail: 'Correo', fMsg: 'Qué datos necesitas y para qué', fUse: 'Cómo los usarías', fInt: 'Datos de interés', opt: '(opcional)', pick: 'Elige una opción',
      roles: ['Cooperativa agrícola', 'Trader o broker', 'Banco', 'Aseguradora', 'Fabricante de fertilizantes o pienso', 'Empresa de alimentación', 'Medio o analista', 'Otra'],
      uses: ['Integrarlo en mi sistema (API)', 'Descargarlo en CSV o Excel', 'Un informe periódico', 'Todavía no lo sé'],
      ints: ['Precios', 'Producción y rendimientos', 'Comercio y aranceles', 'Clima y sequía', 'Insumos y costes', 'Tierra y renta', 'PAC y ayudas'],
      send: 'Preparar el correo', join: 'Apuntarme', errName: 'Escribe tu nombre.', errEmail: 'Escribe un correo válido.', errMsg: 'Cuéntanos en unas líneas qué necesitas.',
      done: 'Se ha abierto tu programa de correo con el mensaje listo. Pulsa enviar allí. Si no se ha abierto, copia el texto de abajo y mándalo a {m}.',
      privacy: 'No guardamos nada en esta web. El mensaje sale de tu programa de correo hacia {m}. Más en la', privacyLink: 'política de privacidad',
      subjC: 'Empresas: consulta de datos', subjL: 'Lista de espera de la API', hello: 'Mensaje enviado desde dehesaindex.com/empresas', lang: 'Idioma de la web', noInt: 'ninguno indicado'
    },
    en: {
      title: 'Business | Dehesa Index', badge: 'FOR BUSINESSES', h1: 'Agricultural data ready to plug into your operation',
      sub: 'Dehesa Index is preparing an API of agricultural prices and statistics by product and region, built for teams that need this data inside their own systems and not just on a dashboard to check by hand. It is not on sale yet: here you can see what exists, what could be offered and how to sign up.',
      whatTitle: "WHAT'S BEHIND IT",
      whatP1: 'The public dashboard brings together official prices for the US, the EU, the UK and Canada, plus agricultural statistics for dozens of countries. Every figure carries its source, date and licence, and anything that is not an official figure is labelled as such.',
      whatP2: 'The API will bring that same model, with each price identified by product and region, into a format meant for spreadsheets, ERPs or risk systems, instead of copying it by hand from the dashboard.',
      stats: ['products and variants with a price', 'price markets (US, EU, UK and Canada)', 'sources that allow commercial use, some with conditions (of {t} in use)'],
      useTitle: 'WHAT IT IS FOR', useSub: 'Four ways to use it, with the data we already publish.',
      lData: 'Data it would use', lLinks: 'See it on the site',
      cases: [
        { name: 'Agricultural cooperatives', problem: 'Deciding with members when to sell and at what price, and whether the margin holds.',
          data: ['Reference prices by product and market, with history.', 'Regional markets.', 'Cost per hectare and break-even price.', 'CAP payments by country.'],
          links: [['precios.html', 'Prices'], ['lonjas.html', 'Markets'], ['calculadora.html', 'Margin calculator'], ['pac.html', 'CAP']] },
        { name: 'Traders and brokers', problem: 'Feeding their models with clean series and seeing when one market moves against another.',
          data: ['Prices by product and region in one format (JSON and CSV).', 'Market relationships, such as milk/feed or cattle/corn.', 'Weekly US export sales and trade by partner.', 'Calendar of official releases.'],
          links: [['relaciones.html', 'Market relationships'], ['exportaciones.html', 'Exports'], ['oferta-demanda.html', 'Supply and demand'], ['calendario.html', 'Calendar']] },
        { name: 'Insurers', problem: 'Assessing crop risk: what a crop yields, how the season is going and where drought bites.',
          data: ['Yields and production by region.', 'US crop progress and crop-insurance data for the US and Canada.', 'Drought indicators for the EU and several countries.', 'Historical weather.'],
          links: [['rendimientos.html', 'Yields'], ['cultivos.html', 'Crops'], ['sequia.html', 'Drought'], ['clima.html', 'Weather']],
          note: 'Some datasets, such as the U.S. Drought Monitor, are left out of the commercial offer because of their licence.' },
        { name: 'Banks', problem: 'Assessing agricultural lending: collateral value, production cost, margin and the macro backdrop.',
          data: ['Prices and trends of the products being financed.', 'Land prices and rents in several countries.', 'Macro indicators and exchange rates by country.', 'Production costs and margin.'],
          links: [['precios.html', 'Prices'], ['paises.html', 'Countries'], ['costes.html', 'Costs']] }
      ],
      others: 'Also: fertilizer and feed makers (watching inputs), food companies (raw-material costs), and media and analysts (citable series with source and date).',
      sampleTitle: 'DATA SAMPLE', sampleSub: 'These rows are real and come from today’s dashboard. The final API format may change.',
      tabs: ['Table', 'JSON', 'CSV'], copy: 'Copy', copied: 'Copied', cols: ['Product', 'Market', 'Value', 'Date', 'Source', 'Commercial use'],
      vApto: 'Fit', vCond: 'With conditions', vNo: 'Not fit', sampleFail: 'The sample could not be loaded right now.',
      apiTitle: 'WHAT IS DONE AND WHAT IS MISSING', apiStatus: 'API and downloads available',
      apiFeatures: ['Available: current prices and history by product and region as public JSON files and downloadable CSV and Excel.', 'Available: updated at the same cadence as the public dashboard, and the status page shows which source is current and which is not.', 'Available: the downloadable pack is split by market (EU, US, UK, Canada) and every row carries its price type and licence verdict.', 'Available: JSON data API, free and no key, with source, licence and attribution on every series (see the API page).', 'Pending: automatic alerts when a price crosses a threshold. They need an email service and there is no server yet.', 'Pending: keyed access and custom limits, which are not needed while everything is static files.'],
      apiNow: 'Meanwhile, the site’s public JSON and CSV files, described in data/api.json, remain available. Commercial use of them depends on each source’s licence.',
      condTitle: 'WHAT COULD BE OFFERED', condBody: 'Of the {t} sources in use, {a} allow commercial use without reservations, {c} allow it with conditions and {n} are left out because their licence is pending or unconfirmed. Every file and every source has a public verdict.', condBtn: 'See the terms',
      cTitle: 'Write to us', cBody: 'Tell us what data you need and what for. We read every message and reply.',
      lTitle: 'Waiting list', lBody: 'Leave your email and we will tell you when the API is available. Those who sign up first get priority.',
      fName: 'Name', fCompany: 'Company', fRole: 'Your activity', fEmail: 'Email', fMsg: 'What data you need and what for', fUse: 'How you would use it', fInt: 'Data of interest', opt: '(optional)', pick: 'Choose one',
      roles: ['Agricultural cooperative', 'Trader or broker', 'Bank', 'Insurer', 'Fertilizer or feed manufacturer', 'Food company', 'Media or analyst', 'Other'],
      uses: ['Plug it into my system (API)', 'Download it as CSV or Excel', 'A periodic report', 'Not sure yet'],
      ints: ['Prices', 'Production and yields', 'Trade and tariffs', 'Weather and drought', 'Inputs and costs', 'Land and rents', 'CAP and payments'],
      send: 'Prepare the email', join: 'Sign me up', errName: 'Enter your name.', errEmail: 'Enter a valid email.', errMsg: 'Tell us in a few lines what you need.',
      done: 'Your email app has opened with the message ready. Press send there. If it did not open, copy the text below and send it to {m}.',
      privacy: 'We store nothing on this site. The message goes from your email app to {m}. More in the', privacyLink: 'privacy policy',
      subjC: 'Business: data enquiry', subjL: 'API waiting list', hello: 'Message sent from dehesaindex.com/empresas', lang: 'Site language', noInt: 'none given'
    },
    fr: {
      title: 'Entreprises | Dehesa Index', badge: 'POUR LES ENTREPRISES', h1: 'Des données agricoles prêtes à intégrer dans votre activité',
      sub: 'Dehesa Index prépare une API de prix et de statistiques agricoles par produit et par région, pour ceux qui ont besoin de ces données dans leur propre système et pas seulement sur un tableau de bord à consulter à la main. Elle n’est pas encore en vente : voici ce qui existe, ce qui pourrait être proposé et comment vous inscrire.',
      whatTitle: 'CE QUI EST DÉJÀ LÀ',
      whatP1: 'Le tableau de bord public réunit les prix officiels des États-Unis, de l’UE, du Royaume-Uni et du Canada, et des statistiques agricoles de dizaines de pays. Chaque chiffre porte sa source, sa date et sa licence, et ce qui n’est pas une donnée officielle est signalé comme tel.',
      whatP2: 'L’API reprendra ce même modèle, chaque prix étant identifié par produit et région, dans un format pensé pour les tableurs, ERP ou systèmes de risque, au lieu de le copier à la main depuis le tableau de bord.',
      stats: ['produits et variantes avec un prix', 'marchés de prix (États-Unis, UE, Royaume-Uni et Canada)', 'sources qui autorisent l’usage commercial, certaines sous conditions (sur {t} utilisées)'],
      useTitle: 'À QUOI ÇA SERT', useSub: 'Quatre façons de l’utiliser, avec les données que nous publions déjà.',
      lData: 'Données utilisées', lLinks: 'Voir sur le site',
      cases: [
        { name: 'Coopératives agricoles', problem: 'Décider avec les adhérents quand vendre et à quel prix, et savoir si la marge tient.',
          data: ['Prix de référence par produit et marché, avec historique.', 'Marchés régionaux.', 'Coût par hectare et prix d’équilibre.', 'Aides de la PAC par pays.'],
          links: [['precios.html', 'Prix'], ['lonjas.html', 'Marchés'], ['calculadora.html', 'Calculateur de marge'], ['pac.html', 'PAC']] },
        { name: 'Traders et courtiers', problem: 'Alimenter leurs modèles avec des séries propres et voir quand un marché bouge par rapport à un autre.',
          data: ['Prix par produit et région dans un même format (JSON et CSV).', 'Relations entre marchés, comme lait/aliment ou bétail/maïs.', 'Ventes hebdomadaires à l’export des États-Unis et commerce par partenaire.', 'Calendrier des publications officielles.'],
          links: [['relaciones.html', 'Relations entre marchés'], ['exportaciones.html', 'Exportations'], ['oferta-demanda.html', 'Offre et demande'], ['calendario.html', 'Calendrier']] },
        { name: 'Assureurs', problem: 'Évaluer le risque de récolte : le rendement d’une culture, l’état de la campagne et où la sécheresse frappe.',
          data: ['Rendements et production par région.', 'Avancement des cultures aux États-Unis et données d’assurance récolte des États-Unis et du Canada.', 'Indicateurs de sécheresse de l’UE et de plusieurs pays.', 'Météo historique.'],
          links: [['rendimientos.html', 'Rendements'], ['cultivos.html', 'Cultures'], ['sequia.html', 'Sécheresse'], ['clima.html', 'Météo']],
          note: 'Certains jeux de données, comme le U.S. Drought Monitor, sont exclus de l’offre commerciale à cause de leur licence.' },
        { name: 'Banques', problem: 'Évaluer le financement agricole : valeur de la garantie, coût de production, marge et contexte macro.',
          data: ['Prix et tendances des produits financés.', 'Prix et loyers des terres dans plusieurs pays.', 'Indicateurs macro et taux de change par pays.', 'Coûts de production et marge.'],
          links: [['precios.html', 'Prix'], ['paises.html', 'Pays'], ['costes.html', 'Coûts']] }
      ],
      others: 'Aussi : fabricants d’engrais et d’aliments pour bétail (suivi des intrants), entreprises agroalimentaires (coûts de matières premières), médias et analystes (séries citables avec source et date).',
      sampleTitle: 'ÉCHANTILLON DE DONNÉES', sampleSub: 'Ces lignes sont réelles et viennent du tableau de bord d’aujourd’hui. Le format final de l’API peut changer.',
      tabs: ['Tableau', 'JSON', 'CSV'], copy: 'Copier', copied: 'Copié', cols: ['Produit', 'Marché', 'Valeur', 'Date', 'Source', 'Usage commercial'],
      vApto: 'Apte', vCond: 'Sous conditions', vNo: 'Non apte', sampleFail: 'L’échantillon n’a pas pu être chargé pour l’instant.',
      apiTitle: 'CE QUI EST FAIT ET CE QUI MANQUE', apiStatus: 'API et téléchargements disponibles',
      apiFeatures: ['Disponible : prix actuels et historique par produit et région en fichiers JSON publics et en CSV et Excel téléchargeables.', 'Disponible : mise à jour au même rythme que le tableau de bord public, et la page d’état montre quelle source est à jour et laquelle ne l’est pas.', 'Disponible : le pack téléchargeable est découpé par marché (UE, États-Unis, Royaume-Uni, Canada) et chaque ligne porte son type de prix et son verdict de licence.', 'Disponible : API de données en JSON, gratuite et sans clé, avec source, licence et attribution sur chaque série (voir la page API).', 'À venir : alertes automatiques quand un prix franchit un seuil. Elles demandent un service d’e-mail et il n’y a pas encore de serveur.', 'À venir : accès avec clé et limites propres, inutiles tant que tout reste en fichiers statiques.'],
      apiNow: 'En attendant, les fichiers JSON et CSV publics du site, décrits dans data/api.json, restent disponibles. Leur usage commercial dépend de la licence de chaque source.',
      condTitle: 'CE QUI POURRAIT ÊTRE PROPOSÉ', condBody: 'Sur les {t} sources utilisées, {a} autorisent l’usage commercial sans réserve, {c} l’autorisent sous conditions et {n} sont exclues car leur licence est en attente ou non confirmée. Chaque fichier et chaque source a un verdict public.', condBtn: 'Voir les conditions',
      cTitle: 'Écrivez-nous', cBody: 'Dites-nous de quelles données vous avez besoin et pour quoi faire. Nous lisons chaque message et répondons.',
      lTitle: 'Liste d’attente', lBody: 'Laissez votre e-mail et nous vous prévenons quand l’API sera disponible. Les premiers inscrits seront prioritaires.',
      fName: 'Nom', fCompany: 'Entreprise', fRole: 'Votre activité', fEmail: 'E-mail', fMsg: 'De quelles données avez-vous besoin et pour quoi', fUse: 'Comment vous les utiliseriez', fInt: 'Données qui vous intéressent', opt: '(facultatif)', pick: 'Choisissez',
      roles: ['Coopérative agricole', 'Trader ou courtier', 'Banque', 'Assureur', 'Fabricant d’engrais ou d’aliments pour bétail', 'Entreprise agroalimentaire', 'Média ou analyste', 'Autre'],
      uses: ['L’intégrer dans mon système (API)', 'Le télécharger en CSV ou Excel', 'Un rapport périodique', 'Je ne sais pas encore'],
      ints: ['Prix', 'Production et rendements', 'Commerce et tarifs', 'Météo et sécheresse', 'Intrants et coûts', 'Terres et loyers', 'PAC et aides'],
      send: 'Préparer l’e-mail', join: 'M’inscrire', errName: 'Indiquez votre nom.', errEmail: 'Indiquez un e-mail valide.', errMsg: 'Dites-nous en quelques lignes ce dont vous avez besoin.',
      done: 'Votre messagerie s’est ouverte avec le message prêt. Appuyez sur envoyer là-bas. Si elle ne s’est pas ouverte, copiez le texte ci-dessous et envoyez-le à {m}.',
      privacy: 'Nous ne stockons rien sur ce site. Le message part de votre messagerie vers {m}. Plus d’informations dans la', privacyLink: 'politique de confidentialité',
      subjC: 'Entreprises : demande de données', subjL: 'Liste d’attente de l’API', hello: 'Message envoyé depuis dehesaindex.com/empresas', lang: 'Langue du site', noInt: 'aucune indiquée'
    },
    it: {
      title: 'Aziende | Dehesa Index', badge: 'PER LE AZIENDE', h1: 'Dati agricoli pronti da integrare nella tua attività',
      sub: 'Dehesa Index sta preparando un’API di prezzi e statistiche agricole per prodotto e regione, pensata per chi ha bisogno di questi dati nel proprio sistema e non solo in una dashboard da consultare a mano. Non è ancora in vendita: qui vedi cosa c’è, cosa si potrebbe offrire e come iscriverti.',
      whatTitle: "COSA C'È DIETRO",
      whatP1: 'La dashboard pubblica riunisce i prezzi ufficiali di Stati Uniti, UE, Regno Unito e Canada, e statistiche agricole di decine di paesi. Ogni dato riporta fonte, data e licenza, e ciò che non è un dato ufficiale è indicato come tale.',
      whatP2: 'L’API porterà lo stesso modello, con ogni prezzo identificato per prodotto e regione, in un formato pensato per fogli di calcolo, ERP o sistemi di rischio, invece di copiarlo a mano dalla dashboard.',
      stats: ['prodotti e varianti con un prezzo', 'mercati di prezzo (Stati Uniti, UE, Regno Unito e Canada)', 'fonti che consentono l’uso commerciale, alcune con condizioni (su {t} in uso)'],
      useTitle: 'A COSA SERVE', useSub: 'Quattro modi di usarlo, con i dati che già pubblichiamo.',
      lData: 'Dati che userebbe', lLinks: 'Vedilo sul sito',
      cases: [
        { name: 'Cooperative agricole', problem: 'Decidere con i soci quando vendere e a che prezzo, e capire se il margine regge.',
          data: ['Prezzi di riferimento per prodotto e mercato, con storico.', 'Mercati regionali.', 'Costo per ettaro e prezzo di pareggio.', 'Aiuti della PAC per paese.'],
          links: [['precios.html', 'Prezzi'], ['lonjas.html', 'Mercati'], ['calculadora.html', 'Calcolatore di margine'], ['pac.html', 'PAC']] },
        { name: 'Trader e broker', problem: 'Alimentare i modelli con serie pulite e vedere quando un mercato si muove rispetto a un altro.',
          data: ['Prezzi per prodotto e regione in un unico formato (JSON e CSV).', 'Relazioni tra mercati, come latte/mangime o bestiame/mais.', 'Vendite settimanali all’export degli Stati Uniti e commercio per partner.', 'Calendario delle pubblicazioni ufficiali.'],
          links: [['relaciones.html', 'Relazioni tra mercati'], ['exportaciones.html', 'Esportazioni'], ['oferta-demanda.html', 'Offerta e domanda'], ['calendario.html', 'Calendario']] },
        { name: 'Assicurazioni', problem: 'Valutare il rischio di raccolto: quanto rende una coltura, come va la campagna e dove la siccità si fa sentire.',
          data: ['Rese e produzione per regione.', 'Avanzamento delle colture negli Stati Uniti e dati sull’assicurazione del raccolto di Stati Uniti e Canada.', 'Indicatori di siccità dell’UE e di vari paesi.', 'Clima storico.'],
          links: [['rendimientos.html', 'Rese'], ['cultivos.html', 'Colture'], ['sequia.html', 'Siccità'], ['clima.html', 'Clima']],
          note: 'Alcuni insiemi di dati, come lo U.S. Drought Monitor, restano fuori dall’offerta commerciale per via della licenza.' },
        { name: 'Banche', problem: 'Valutare il credito agricolo: valore della garanzia, costo di produzione, margine e contesto macro.',
          data: ['Prezzi e tendenze dei prodotti finanziati.', 'Prezzi e affitti dei terreni in vari paesi.', 'Indicatori macro e tassi di cambio per paese.', 'Costi di produzione e margine.'],
          links: [['precios.html', 'Prezzi'], ['paises.html', 'Paesi'], ['costes.html', 'Costi']] }
      ],
      others: 'Anche: produttori di fertilizzanti e mangimi (monitoraggio degli input), aziende alimentari (costi delle materie prime), media e analisti (serie citabili con fonte e data).',
      sampleTitle: 'CAMPIONE DI DATI', sampleSub: 'Queste righe sono reali e vengono dalla dashboard di oggi. Il formato finale dell’API può cambiare.',
      tabs: ['Tabella', 'JSON', 'CSV'], copy: 'Copia', copied: 'Copiato', cols: ['Prodotto', 'Mercato', 'Valore', 'Data', 'Fonte', 'Uso commerciale'],
      vApto: 'Idonea', vCond: 'Con condizioni', vNo: 'Non idonea', sampleFail: 'Impossibile caricare il campione in questo momento.',
      apiTitle: 'COSA È FATTO E COSA MANCA', apiStatus: 'API e download disponibili',
      apiFeatures: ['Disponibile: prezzi attuali e storico per prodotto e regione in file JSON pubblici e in CSV ed Excel scaricabili.', 'Disponibile: aggiornamento con la stessa cadenza della dashboard pubblica, e la pagina di stato mostra quale fonte è aggiornata e quale no.', 'Disponibile: il pacchetto scaricabile è diviso per mercato (UE, USA, Regno Unito, Canada) e ogni riga porta il tipo di prezzo e il verdetto di licenza.', 'Disponibile: API dei dati in JSON, gratuita e senza chiave, con fonte, licenza e attribuzione su ogni serie (vedi la pagina API).', 'Da fare: avvisi automatici quando un prezzo supera una soglia. Servono un servizio e-mail e per ora non c’è un server.', 'Da fare: accesso con chiave e limiti propri, non necessari finché tutto resta in file statici.'],
      apiNow: 'Nel frattempo restano disponibili i file JSON e CSV pubblici del sito, descritti in data/api.json. L’uso commerciale dipende dalla licenza di ogni fonte.',
      condTitle: 'COSA SI POTREBBE OFFRIRE', condBody: 'Delle {t} fonti in uso, {a} consentono l’uso commerciale senza riserve, {c} lo consentono con condizioni e {n} restano fuori perché la licenza è in sospeso o non confermata. Ogni file e ogni fonte ha un verdetto pubblico.', condBtn: 'Vedi le condizioni',
      cTitle: 'Scrivici', cBody: 'Dicci di quali dati hai bisogno e per cosa. Leggiamo ogni messaggio e rispondiamo.',
      lTitle: 'Lista d’attesa', lBody: 'Lascia la tua email e ti avvisiamo quando l’API sarà disponibile. Chi si iscrive prima ha la priorità.',
      fName: 'Nome', fCompany: 'Azienda', fRole: 'La tua attività', fEmail: 'Email', fMsg: 'Di quali dati hai bisogno e per cosa', fUse: 'Come li useresti', fInt: 'Dati di interesse', opt: '(facoltativo)', pick: 'Scegli',
      roles: ['Cooperativa agricola', 'Trader o broker', 'Banca', 'Assicurazione', 'Produttore di fertilizzanti o mangimi', 'Azienda alimentare', 'Media o analista', 'Altro'],
      uses: ['Integrarlo nel mio sistema (API)', 'Scaricarlo in CSV o Excel', 'Un report periodico', 'Non lo so ancora'],
      ints: ['Prezzi', 'Produzione e rese', 'Commercio e dazi', 'Clima e siccità', 'Input e costi', 'Terra e affitti', 'PAC e aiuti'],
      send: 'Prepara l’email', join: 'Iscrivimi', errName: 'Scrivi il tuo nome.', errEmail: 'Scrivi un’email valida.', errMsg: 'Dicci in poche righe di cosa hai bisogno.',
      done: 'Il tuo programma di posta si è aperto con il messaggio pronto. Premi invia lì. Se non si è aperto, copia il testo qui sotto e mandalo a {m}.',
      privacy: 'Non conserviamo nulla su questo sito. Il messaggio parte dal tuo programma di posta verso {m}. Altro nella', privacyLink: 'informativa sulla privacy',
      subjC: 'Aziende: richiesta di dati', subjL: 'Lista d’attesa dell’API', hello: 'Messaggio inviato da dehesaindex.com/empresas', lang: 'Lingua del sito', noInt: 'nessuno indicato'
    }
  };
  var D = { tape: null, sum: null, labels: null, pm: null }, TAB = 0;
  function lang() { return S.getLang(); }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return S.esc(x == null ? '' : String(x)); }
  function get(u) { return fetch(S.sitePath(u), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] == null ? m : o[k]; }); }
  function nf(v) { try { return v.toLocaleString(lang(), { maximumFractionDigits: 2 }); } catch (e) { return String(v); } }
  function prodName(p) { var L = D.labels && D.labels.labels && D.labels.labels[p]; return L ? (L[lang()] || L.es || p) : p; }
  /* Alias de fuente: la leche cruda de la UE llega con sourceId «european_commission» (Milk Market Observatory), que es el mismo portal
     de DG AGRI registrado como «eu_agrifood» en las licencias; sin el alias la tabla mostraba el id interno y sin veredicto. */
  var SRC_ALIAS = { european_commission: 'eu_agrifood' };
  function srcKey(id) { return D.sum && D.sum.sources && !D.sum.sources[id] && SRC_ALIAS[id] ? SRC_ALIAS[id] : id; }
  function srcName(id) { var s = D.sum && D.sum.sources[srcKey(id)]; return s ? s.name : String(id).replace(/_/g, ' '); }
  function verdict(id) { var s = D.sum && D.sum.sources[srcKey(id)]; return s ? s.verdict : ''; }
  function vLabel(v, w) { return v === 'apto' ? w.vApto : v === 'condiciones' ? w.vCond : v === 'no-apto' ? w.vNo : '—'; }
  var UNITS = { tonelada: { es: 'tonelada', en: 'tonne', fr: 'tonne', it: 'tonnellata' }, bushel: { es: 'bushel', en: 'bushel', fr: 'boisseau', it: 'bushel' } };
  function unit(u) { return UNITS[u] ? UNITS[u][lang()] : u; }
  function ctext(r) { return Array.isArray(r.market) ? (r.market[{ es: 0, en: 1, fr: 2, it: 3 }[lang()] || 0] || '') : ''; }

  function sampleRows() { return (D.tape && D.tape.rows) || []; }
  function sampleJson() {
    return JSON.stringify(sampleRows().map(function (r) {
      return { product: r.product, region: r.region, value: r.value, currency: r.currency, unit: r.unit, observationDate: r.observationDate, sourceId: r.sourceId, commercialUse: verdict(r.sourceId) || null };
    }), null, 2);
  }
  function sampleCsv() {
    var q = function (x) { x = String(x == null ? '' : x); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
    return ['product,region,value,currency,unit,observationDate,sourceId,commercialUse'].concat(sampleRows().map(function (r) {
      return [r.product, r.region, r.value, r.currency, r.unit, r.observationDate, r.sourceId, verdict(r.sourceId)].map(q).join(',');
    })).join('\n');
  }
  function sampleHtml(w) {
    if (D.tape === false || (D.tape && !sampleRows().length)) return '<p class="di-emp-p">' + esc(w.sampleFail) + '</p>';
    if (!D.tape) return '<p class="di-movers-hint">…</p>';
    var tabs = '<div class="di-emp-tabs" role="tablist">' + w.tabs.map(function (n, i) {
      return '<button type="button" role="tab" class="di-emp-tab' + (TAB === i ? ' on' : '') + '" aria-selected="' + (TAB === i) + '" data-tab="' + i + '">' + esc(n) + '</button>'; }).join('') +
      (TAB > 0 ? '<button type="button" class="di-emp-copy" id="em-copy">' + esc(w.copy) + '</button>' : '') + '</div>';
    var body;
    if (TAB === 0) {
      body = '<div class="di-table-wrap" style="overflow-x:auto"><table class="di-table" data-no-cards data-no-rows style="width:100%;font-size:13px;border-collapse:collapse"><thead><tr>' + w.cols.map(function (c) {
        return '<th style="text-align:left;padding:6px 8px;white-space:nowrap">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + sampleRows().map(function (r) {
        var v = verdict(r.sourceId);
        return '<tr><td style="padding:6px 8px;border-top:1px solid var(--border)">' + esc(prodName(r.product)) + '</td><td style="padding:6px 8px;border-top:1px solid var(--border)">' + esc(ctext(r)) + '</td>' +
          '<td style="padding:6px 8px;border-top:1px solid var(--border);white-space:nowrap">' + esc(nf(r.value) + ' ' + r.currency + '/' + unit(r.unit)) + '</td><td style="padding:6px 8px;border-top:1px solid var(--border);white-space:nowrap">' + esc(r.observationDate) + '</td>' +
          '<td style="padding:6px 8px;border-top:1px solid var(--border)">' + esc(srcName(r.sourceId)) + '</td><td style="padding:6px 8px;border-top:1px solid var(--border)">' + esc(vLabel(v, w)) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    } else body = '<pre class="di-emp-pre" id="em-pre" tabindex="0">' + esc(TAB === 1 ? sampleJson() : sampleCsv()) + '</pre>';
    return tabs + body;
  }
  function field(id, label, input, opt, w) { return '<label class="di-emp-field" for="' + id + '"><span>' + esc(label) + (opt ? ' <em>' + esc(w.opt) + '</em>' : '') + '</span>' + input + '</label>'; }
  function select(id, items, w) { return '<select id="' + id + '" class="di-compare-select"><option value="">' + esc(w.pick) + '</option>' + items.map(function (x, i) { return '<option value="' + i + '">' + esc(x) + '</option>'; }).join('') + '</select>'; }
  function checks(pref, items, w) {
    return '<fieldset class="di-emp-checks"><legend>' + esc(w.fInt) + ' <em>' + esc(w.opt) + '</em></legend>' + items.map(function (x, i) {
      return '<label><input type="checkbox" id="' + pref + i + '" value="' + i + '"> ' + esc(x) + '</label>'; }).join('') + '</fieldset>';
  }
  function formHtml(kind, w) {
    var c = kind === 'c', p = c ? 'ec-' : 'el-';
    return '<form class="di-card di-emp-form" id="' + (c ? 'contacto' : 'lista') + '" novalidate data-kind="' + kind + '"><div class="di-emp-cta-title">' + esc(c ? w.cTitle : w.lTitle) + '</div><p class="di-emp-cta-body">' + esc(c ? w.cBody : w.lBody) + '</p>' +
      field(p + 'name', w.fName, '<input type="text" id="' + p + 'name" class="di-compare-select" autocomplete="name"' + '>', !c, w) +
      field(p + 'email', w.fEmail, '<input type="email" id="' + p + 'email" class="di-compare-select" autocomplete="email" required>', false, w) +
      field(p + 'company', w.fCompany, '<input type="text" id="' + p + 'company" class="di-compare-select" autocomplete="organization">', true, w) +
      field(p + 'role', w.fRole, select(p + 'role', w.roles, w), true, w) +
      (c ? field(p + 'msg', w.fMsg, '<textarea id="' + p + 'msg" class="di-compare-select" rows="4" required></textarea>', false, w) + field(p + 'use', w.fUse, select(p + 'use', w.uses, w), true, w) : '') +
      checks(p + 'int', w.ints, w) +
      '<div class="di-emp-actions"><button type="submit" class="di-btn-gold-solid">' + esc(c ? w.send : w.join) + '</button></div><p class="di-emp-status" role="status" aria-live="polite" id="' + p + 'status"></p>' +
      '<p class="di-emp-cta-note">' + esc(fill(w.privacy, { m: MAIL })) + ' <a href="legal.html#privacidad">' + esc(w.privacyLink) + '</a>.</p></form>';
  }
  function render() {
    var w = t(), esc2 = esc, tape = D.tape, n = D.pm ? D.pm.products : null, sm = D.sum && D.sum.summary;
    document.title = w.title;
    document.getElementById('em-badge').textContent = w.badge; document.getElementById('em-h1').textContent = w.h1; document.getElementById('em-sub').textContent = w.sub;
    var form = saveForm();
    var st = [n, D.pm ? D.pm.markets : null, sm ? sm.sourcesApto + sm.sourcesCondiciones : null];
    var stats = w.stats.map(function (l, i) {
      var v = st[i] == null ? '—' : String(st[i]);
      return '<div class="di-emp-stat"><div class="di-emp-stat-value">' + esc2(v) + '</div><div class="di-emp-stat-label">' + esc2(sm ? fill(l, { t: sm.sources }) : l.replace(/ \(.*\)$/, '')) + '</div></div>'; }).join('');
    var h = '';
    h += '<section class="di-card di-emp-section"><div class="di-emp-section-title">' + esc2(w.whatTitle) + '</div><p class="di-emp-p">' + esc2(w.whatP1) + '</p><p class="di-emp-p">' + esc2(w.whatP2) + '</p><div class="di-emp-stats">' + stats + '</div></section>';
    var NOW = {
      es: ['YA DISPONIBLE', 'Cinco cosas que puedes usar hoy, sin esperar a la API.', [['liquidacion.html', 'Justificar la liquidación', 'Vuestro precio de venta frente a las lonjas oficiales en las mismas fechas y volúmenes, con un informe para la asamblea. Se calcula en vuestro navegador.'], ['monitor-insumos.html', 'Monitor de insumos', 'Abonos, piensos y gasóleo frente a sus últimos 10 años, y cuántos kilos de abono compra el grano. Para preparar la compra agrupada.'], ['datos-descargables.html', 'Datos descargables', 'CSV y Excel por producto y mercado, con histórico, fuente y licencia en cada fila. Solo fuentes aptas para uso comercial.'], ['informe-cooperativas.html', 'Informe para cooperativas', 'Muestra de una hoja: qué sube y qué baja, insumos frente al precio de venta y próximos datos. Se imprime o guarda en PDF.'], ['status.html', 'Estado de los datos', 'Último dato y licencia de cada fuente, qué está al día y qué falla ahora mismo.']]],
      en: ['AVAILABLE NOW', 'Five things you can use today, without waiting for the API.', [['liquidacion.html', 'Settlement price check', 'Your selling price against official market quotations on the same dates and volumes, with a report for the general meeting. Computed in your browser.'], ['monitor-insumos.html', 'Input monitor', 'Fertiliser, feed and diesel against their last 10 years, and how much fertiliser grain buys. To prepare the group purchase.'], ['datos-descargables.html', 'Downloadable data', 'CSV and Excel by product and market, with history, source and licence in every row. Only sources fit for commercial use.'], ['informe-cooperativas.html', 'Report for cooperatives', 'One-page sample: risers and fallers, inputs against the selling price and upcoming data. Print it or save it as PDF.'], ['status.html', 'Data status', 'Latest data and licence of each source, what is up to date and what is failing right now.']]],
      fr: ['DÉJÀ DISPONIBLE', 'Cinq choses utilisables dès aujourd’hui, sans attendre l’API.', [['liquidacion.html', 'Justifier la liquidation', 'Votre prix de vente face aux cotations officielles aux mêmes dates et volumes, avec un rapport pour l’assemblée. Calculé dans votre navigateur.'], ['monitor-insumos.html', 'Moniteur des intrants', 'Engrais, aliments et gazole face à leurs 10 dernières années, et combien d’engrais achète le grain. Pour préparer l’achat groupé.'], ['datos-descargables.html', 'Données téléchargeables', 'CSV et Excel par produit et marché, avec historique, source et licence sur chaque ligne. Seulement des sources aptes à l’usage commercial.'], ['informe-cooperativas.html', 'Rapport pour coopératives', 'Exemple d’une page : hausses et baisses, intrants face au prix de vente et prochaines données. À imprimer ou enregistrer en PDF.'], ['status.html', 'État des données', 'Dernière donnée et licence de chaque source, ce qui est à jour et ce qui échoue en ce moment.']]],
      it: ['GIÀ DISPONIBILE', 'Cinque cose che puoi usare oggi, senza aspettare l’API.', [['liquidacion.html', 'Giustificare la liquidazione', 'Il vostro prezzo di vendita rispetto alle quotazioni ufficiali nelle stesse date e volumi, con un rapporto per l’assemblea. Calcolato nel vostro browser.'], ['monitor-insumos.html', 'Monitor dei mezzi tecnici', 'Concimi, mangimi e gasolio rispetto ai loro ultimi 10 anni, e quanto concime compra il grano. Per preparare l’acquisto collettivo.'], ['datos-descargables.html', 'Dati scaricabili', 'CSV ed Excel per prodotto e mercato, con storico, fonte e licenza in ogni riga. Solo fonti idonee all’uso commerciale.'], ['informe-cooperativas.html', 'Rapporto per cooperative', 'Esempio di una pagina: rialzi e ribassi, mezzi tecnici rispetto al prezzo di vendita e prossimi dati. Si stampa o si salva in PDF.'], ['status.html', 'Stato dei dati', 'Ultimo dato e licenza di ogni fonte, cosa è aggiornato e cosa non funziona in questo momento.']]]
    }[lang()] || null;
    if (NOW) h += '<section class="di-emp-audience-section" id="ya-disponible"><div class="di-emp-section-title">' + esc2(NOW[0]) + '</div><p class="di-emp-p" style="margin-bottom:14px">' + esc2(NOW[1]) + '</p><div class="di-emp-audience-grid">' +
      NOW[2].map(function (x) { return '<a class="di-card di-emp-audience-card" href="' + esc2(x[0]) + '" style="text-decoration:none;color:inherit"><div class="di-emp-audience-name">' + esc2(x[1]) + ' →</div><div class="di-emp-audience-desc">' + esc2(x[2]) + '</div></a>'; }).join('') + '</div></section>';
    var ALLT = { es: ['TODO PARA EMPRESAS', 'Datos, informes y herramientas, cada uno en su página.'], en: ['EVERYTHING FOR BUSINESS', 'Data, reports and tools, each on its own page.'], fr: ['TOUT POUR LES ENTREPRISES', 'Données, rapports et outils, chacun sur sa page.'], it: ['TUTTO PER LE AZIENDE', 'Dati, rapporti e strumenti, ciascuno nella sua pagina.'] }[lang()] || null, BZ = S.bizItems ? S.bizItems() : [];
    if (ALLT && BZ.length) h += '<section class="di-emp-audience-section" id="todo-empresas"><div class="di-emp-section-title">' + esc2(ALLT[0]) + '</div><p class="di-emp-p" style="margin-bottom:14px">' + esc2(ALLT[1]) + '</p><div class="di-emp-audience-grid">' +
      BZ.map(function (i) { return '<a class="di-card di-emp-audience-card" href="' + esc2(S.sitePath(i.file)) + '" style="text-decoration:none;color:inherit"><div class="di-emp-audience-name">' + esc2(i.label[lang()] || i.label.es) + ' →</div><div class="di-emp-audience-desc">' + esc2((i.d && (i.d[lang()] || i.d.es)) || '') + '</div></a>'; }).join('') + '</div></section>';
    h += '<section class="di-emp-audience-section"><div class="di-emp-section-title">' + esc2(w.useTitle) + '</div><p class="di-emp-p" style="margin-bottom:14px">' + esc2(w.useSub) + '</p><div class="di-emp-audience-grid">' + w.cases.map(function (c) {
      return '<div class="di-card di-emp-audience-card di-emp-case"><div class="di-emp-audience-name">' + esc2(c.name) + '</div><div class="di-emp-audience-desc">' + esc2(c.problem) + '</div>' +
        '<div class="di-emp-case-h">' + esc2(w.lData) + '</div><ul class="di-emp-list">' + c.data.map(function (d) { return '<li>' + esc2(d) + '</li>'; }).join('') + '</ul>' +
        (c.note ? '<p class="di-emp-case-note">' + esc2(c.note) + '</p>' : '') +
        '<div class="di-emp-links" aria-label="' + esc2(w.lLinks) + '">' + c.links.map(function (l) { return '<a href="' + esc2(l[0]) + '">' + esc2(l[1]) + '</a>'; }).join('') + '</div></div>'; }).join('') + '</div>' +
      '<p class="di-emp-p" style="margin-top:14px">' + esc2(w.others) + '</p></section>';
    h += '<section class="di-card di-emp-section"><div class="di-emp-section-title">' + esc2(w.sampleTitle) + '</div><p class="di-emp-p" style="margin-bottom:12px">' + esc2(w.sampleSub) + '</p><div id="em-sample">' + sampleHtml(w) + '</div></section>';
    h += '<section class="di-card di-emp-section di-emp-api-section"><div class="di-emp-api-head"><span class="di-emp-section-title">' + esc2(w.apiTitle) + '</span><span class="di-emp-api-status">' + esc2(w.apiStatus) + '</span></div><div class="di-emp-api-features">' +
      w.apiFeatures.map(function (f) { return '<div class="di-emp-api-feature"><span class="di-emp-api-arrow">' + (/^(Ya disponible|Available|Disponible|Disponibile)/.test(f) ? '✓' : '○') + '</span><span>' + esc2(f) + '</span></div>'; }).join('') + '</div><p class="di-emp-p" style="margin-top:14px">' + esc2(w.apiNow) + '</p></section>';
    if (sm) h += '<section class="di-card di-emp-section"><div class="di-emp-section-title">' + esc2(w.condTitle) + '</div><p class="di-emp-p">' + esc2(fill(w.condBody, { t: sm.sources, a: sm.sourcesApto, c: sm.sourcesCondiciones, n: sm.sourcesNoApto })) + '</p><a class="di-btn-gold-solid" href="condiciones.html">' + esc2(w.condBtn) + '</a></section>';
    h += '<div class="di-emp-forms">' + formHtml('c', w) + formHtml('l', w) + '</div>';
    document.getElementById('em-root').innerHTML = h;
    restoreForm(form);
    wire();
  }
  /* Al volver a pintar (cambio de idioma o llegada de datos) se conserva lo que la persona ya haya escrito. */
  function saveForm() {
    var o = { v: {}, focus: null, pos: 0 }, els = document.querySelectorAll('.di-emp-form input, .di-emp-form select, .di-emp-form textarea'), i;
    for (i = 0; i < els.length; i++) { var e = els[i]; if (!e.id || e.readOnly) continue; o.v[e.id] = e.type === 'checkbox' ? e.checked : e.value; }
    var a = document.activeElement; if (a && a.id && o.v.hasOwnProperty(a.id)) { o.focus = a.id; try { o.pos = a.selectionStart || 0; } catch (x) { o.pos = 0; } }
    return o;
  }
  function restoreForm(o) {
    if (!o) return; var k;
    for (k in o.v) if (o.v.hasOwnProperty(k)) { var e = document.getElementById(k); if (!e) continue; if (e.type === 'checkbox') e.checked = !!o.v[k]; else e.value = o.v[k]; }
    if (o.focus) { var f = document.getElementById(o.focus); if (f) { f.focus(); try { f.setSelectionRange(o.pos, o.pos); } catch (x) { /* sin cursor */ } } }
  }
  function renderSample() { var el = document.getElementById('em-sample'); if (el) { el.innerHTML = sampleHtml(t()); wireSample(); } }
  function wireSample() {
    var tabs = document.querySelectorAll('#em-sample .di-emp-tab'), i;
    for (i = 0; i < tabs.length; i++) (function (b) { b.onclick = function () { TAB = +b.getAttribute('data-tab'); renderSample(); }; })(tabs[i]);
    var c = document.getElementById('em-copy');
    if (c) c.onclick = function () {
      var txt = TAB === 1 ? sampleJson() : sampleCsv(), ok = function () { c.textContent = t().copied; setTimeout(function () { var x = document.getElementById('em-copy'); if (x) x.textContent = t().copy; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, function () { selectPre(); });
      else selectPre();
    };
  }
  function selectPre() { var p = document.getElementById('em-pre'); if (!p) return; try { var r = document.createRange(); r.selectNodeContents(p); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) { /* sin seleccion */ } }
  function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }
  function submit(kind) {
    var w = t(), c = kind === 'c', p = c ? 'ec-' : 'el-', st = document.getElementById(p + 'status'), email = val(p + 'email'), name = val(p + 'name'), msg = c ? val(p + 'msg') : '';
    var err = '';
    if (c && !name) err = w.errName; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) err = w.errEmail; else if (c && msg.length < 10) err = w.errMsg;
    if (err) { st.textContent = err; st.className = 'di-emp-status bad'; return; }
    var role = val(p + 'role') !== '' ? w.roles[+val(p + 'role')] : '', use = c && val(p + 'use') !== '' ? w.uses[+val(p + 'use')] : '', ints = [], i;
    for (i = 0; i < w.ints.length; i++) { var cb = document.getElementById(p + 'int' + i); if (cb && cb.checked) ints.push(w.ints[i]); }
    var lines = [w.hello, w.lang + ': ' + lang(), ''];
    lines.push(w.fName + ': ' + (name || '—'), w.fEmail + ': ' + email, w.fCompany + ': ' + (val(p + 'company') || '—'), w.fRole + ': ' + (role || '—'));
    if (c) lines.push(w.fUse + ': ' + (use || '—'));
    lines.push(w.fInt + ': ' + (ints.length ? ints.join(', ') : w.noInt));
    if (c) { if (msg.length > 1200) msg = msg.slice(0, 1200) + '…'; lines.push('', msg); }
    var body = lines.join('\n'), subject = (c ? w.subjC : w.subjL) + (val(p + 'company') ? ' — ' + val(p + 'company') : '');
    st.className = 'di-emp-status ok';
    st.innerHTML = esc(fill(w.done, { m: MAIL })) + '<textarea class="di-compare-select" rows="7" readonly aria-label="' + esc(subject) + '" style="margin-top:8px">' + esc(subject + '\n\n' + body) + '</textarea>';
    window.location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }
  function wire() {
    var fs = document.querySelectorAll('.di-emp-form'), i;
    for (i = 0; i < fs.length; i++) (function (f) { f.onsubmit = function (e) { e.preventDefault(); submit(f.getAttribute('data-kind')); }; })(fs[i]);
    wireSample();
    if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el && el.scrollIntoView) setTimeout(function () { el.scrollIntoView(); }, 50); }
  }
  S.init('empresas');
  S.onLangChange = render;
  render();
  Promise.all([get('data/home-tape.json'), get('data/commercial-summary.json'), get('data/product-labels.json'), get('data/prices/manifest.json')]).then(function (a) {
    D.tape = a[0] || false; D.sum = a[1]; D.labels = a[2];
    if (a[3] && a[3].regions) {
      var all = {}, k, j, regs = Object.keys(a[3].regions);
      for (k = 0; k < regs.length; k++) { var ps = a[3].regions[regs[k]].products || []; for (j = 0; j < ps.length; j++) all[ps[j]] = 1; }
      D.pm = { products: Object.keys(all).length, markets: regs.length };
    }
    render();
  });
})();
