/* Dehesa Index — Aviso legal, privacidad y almacenamiento local (4 idiomas). Describe lo que el sitio hace de verdad. */
(function () {
  'use strict';
  var STRINGS = {
    es: {
      title: 'Aviso legal y privacidad',
      sub: 'Quién está detrás del sitio, qué guardamos (casi nada), qué terceros intervienen y con qué licencias usamos los datos.',
      sections: [
        { h: 'Aviso legal', id: 'aviso-legal', p: ['Dehesa Index (dehesaindex.com) es un sitio informativo que reúne precios agrícolas de EE. UU., la UE y el Reino Unido. Contacto: hola@dehesaindex.com.', 'El contenido se ofrece «tal cual», con fines informativos. Aunque se verifica cada dato en su fuente oficial, no garantizamos que esté libre de errores, retrasos o revisiones de la fuente.'] },
        { h: 'No es asesoramiento', id: 'terminos', p: ['Nada en este sitio es asesoramiento financiero, de inversión, legal ni comercial. Los precios no son cotizaciones en tiempo real ni ofertas de compra o venta. Toma tus decisiones con tu propio asesor y con los datos de tu mercado.'] },
        { h: 'Privacidad', id: 'privacidad', p: ['No hay registro de usuarios ni cuentas, y el sitio no incluye analítica ni publicidad. No recogemos datos personales en nuestros servidores.', 'El formulario de contacto aún no envía nada: si nos escribes por correo, usaremos tu mensaje y tu dirección solo para responderte. Como cualquier web, el proveedor de alojamiento puede registrar datos técnicos de la visita (como la dirección IP) en sus registros de servidor.', 'Las alertas de precio son una vista previa: el correo o teléfono que escribes en ellas se guarda solo en tu navegador y no se envía a ninguna parte.'] },
        { h: 'Cookies y almacenamiento local', id: 'cookies', p: ['Dehesa Index no usa cookies. Guarda unas pocas preferencias en el almacenamiento local de tu navegador, solo para que el sitio recuerde lo que has elegido; no salen de tu dispositivo:'], ul: [
          { b: 'dehesaIndexLang, dehesaIndexTheme:', t: 'idioma y tema (claro/oscuro).' },
          { b: 'dehesaIndexLocation, dehesaIndexEuCountry:', t: 'ubicación y país de la UE que elijas para ver los precios.' },
          { b: 'dehesaIndexTourSeen:', t: 'que ya has visto la bienvenida.' },
          { b: 'dehesaIndexFavorites, dehesaIndexAlerts:', t: 'tus productos favoritos y las alertas de prueba.' }
        ], after: 'Como son preferencias que tú eliges para usar el servicio y no se usan para rastrearte, no mostramos un aviso de cookies. Puedes borrarlas cuando quieras desde los ajustes de tu navegador (datos del sitio).' },
        { h: 'Servicios de terceros', id: 'terceros', p: ['Al cargar la página, tu navegador pide las tipografías a Google Fonts (fonts.googleapis.com), que recibe tu dirección IP y los datos técnicos habituales de cualquier petición. Las librerías, como la del mapa, se sirven desde este mismo sitio. Los enlaces a noticias y fuentes te llevan a sitios externos con sus propias políticas.'] },
        { h: 'Propiedad intelectual y datos de terceros', id: 'licencias', p: ['El diseño y el código de Dehesa Index son de sus autores. Los datos pertenecen a sus fuentes y se usan según sus condiciones; las mostramos con su atribución:'], ul: [
          { b: 'USDA NASS.', t: 'This product uses the NASS API but is not endorsed or certified by NASS.' },
          { b: 'Comisión Europea.', t: 'Datos del Agri-food Data Portal y del Oil Bulletin, reutilizados según la política de reutilización de la Comisión.' },
          { b: 'Defra (Reino Unido).', t: 'Contains public sector information licensed under the Open Government Licence v3.0.' },
          { b: 'Statistics Canada (Canadá).', t: 'Contains information licensed under the Open Government Licence – Canada.' },
          { b: 'Alberta Agriculture and Irrigation.', t: 'Contains information licensed under the Open Government Licence – Alberta.' },
          { b: 'Statistics Denmark (Dinamarca).', t: 'Source: Statistics Denmark (StatBank), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Ministerio de Agricultura, Pesca y Alimentación — MAPA (España).', t: 'Source: Ministerio de Agricultura, Pesca y Alimentación (MAPA), Precios percibidos y pagados por agricultores y ganaderos, and Red Contable Agraria Nacional (RECAN), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'FranceAgriMer — Francia.', t: 'Source : FranceAgriMer – Données originales téléchargées depuis https://visionet.franceagrimer.fr/ (cotations des céréales, prix payés aux producteurs, cotations viandes) – Licence Ouverte 2.0 (Etalab). Données retraitées par Dehesa Index (échantillonnage hebdomadaire, regroupement par campagne).' },
          { b: 'BLE / Destatis — Francia.', t: 'Quelle: © Bundesanstalt für Landwirtschaft und Ernährung (BLE), Kuhmilchpreise und -mengen, Schlachtpreise, Markt- und Preisbericht Obst und Gemüse; © Statistisches Bundesamt (Destatis), Erzeugerpreisindizes und Einkaufspreisindizes landwirtschaftlicher Betriebsmittel – Datenlizenz Deutschland – Namensnennung – Version 2.0 (www.govdata.de/dl-de/by-2-0) bzw. Zero – Version 2.0. Daten von Dehesa Index verarbeitet (Auswahl, Umrechnung von ISO-Wochen, Zusammenführung von Zeiträumen).' },
          { b: 'Statbel — Belgium.', t: 'Source: Statbel (Belgian statistical office), open data, free reuse including commercial use with attribution. Data last updated: see the update date shown on each series.' },
          { b: 'Eurostat — Austria.', t: 'Source: Eurostat (official data from Statistik Austria and the Austrian federal ministry), reuse policy with attribution (CC BY 4.0). Processed by Dehesa Index.' },
          { b: 'INE — Portugal.', t: 'Source: Instituto Nacional de Estatística (INE, Statistics Portugal), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Statistics Netherlands (CBS).', t: 'Source: Statistics Netherlands (CBS StatLine), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Australian Bureau of Statistics.', t: 'Source: Australian Bureau of Statistics (ABS Data API), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Eurostat, EIA y Banco Mundial.', t: 'Datos públicos, con su fuente citada en cada ficha.' },
          { b: 'USDA PSD.', t: 'Datos de oferta y demanda de USDA Foreign Agricultural Service (PSD Online), publicados con licencia CC BY 4.0; se cita la fuente y se indica que las cifras de “Mundo” son cálculo propio.' },
          { b: 'USDA AMS Market News.', t: 'Precios de la harina de soja de EE. UU. obtenidos de la API MARS de USDA AMS Market News (informe 3511); datos públicos del Gobierno de EE. UU., con la fuente citada.' },
          { b: 'USDA FAS (exportaciones y comercio).', t: 'Ventas de exportación y comercio de EE. UU. por país obtenidos de las API abiertas de USDA FAS (Export Sales Reporting y GATS, con datos del Census Bureau); datos públicos del Gobierno de EE. UU., con la fuente citada.' },
          { b: 'U.S. Drought Monitor.', t: 'Datos de sequía por estado del U.S. Drought Monitor (National Drought Mitigation Center de la Universidad de Nebraska-Lincoln, USDA y NOAA); datos públicos, se cita la fuente.' },
          { b: 'USDA ERS.', t: 'Previsión de precios de alimentos, costes de producción y renta agraria del Economic Research Service del USDA; datos públicos del Gobierno de EE. UU., se cita la fuente.' },
          { b: 'NASA POWER.', t: 'Datos de clima del proyecto Prediction Of Worldwide Energy Resources (NASA), reanálisis MERRA-2. Datos de NASA de uso libre; se cita la fuente.' },
          { b: 'Banco Central Europeo.', t: 'Tipos de cambio de referencia, que el BCE publica solo con fines informativos.' }
        ], after: 'No mostramos datos de fuentes que prohíben su uso automatizado o comercial (por ejemplo AHDB, CME o DTN); esas tarjetas figuran como pendientes.' },
        { h: 'Cambios', p: ['Podemos actualizar este texto cuando cambie el sitio. Última revisión: 30 de septiembre de 2026.'] }
      ],
      links: [{ href: 'metodologia.html', t: 'Metodología' }, { href: 'contacto.html', t: 'Contacto' }]
    },
    en: {
      title: 'Legal notice & privacy',
      sub: 'Who is behind the site, what we store (almost nothing), which third parties are involved and under which licences we use the data.',
      sections: [
        { h: 'Legal notice', id: 'aviso-legal', p: ['Dehesa Index (dehesaindex.com) is an information site gathering farm prices for the U.S., the EU and the UK. Contact: hola@dehesaindex.com.', 'Content is provided “as is”, for information. Although each data point is verified at its official source, we do not guarantee it is free of errors, delays or revisions by the source.'] },
        { h: 'Not advice', id: 'terminos', p: ['Nothing on this site is financial, investment, legal or commercial advice. Prices are not real-time quotes or offers to buy or sell. Make your decisions with your own adviser and your own market data.'] },
        { h: 'Privacy', id: 'privacidad', p: ['There are no user accounts or sign-ups, and the site has no analytics or advertising. We do not collect personal data on our servers.', 'The contact form does not send anything yet: if you email us, we use your message and address only to reply. Like any website, the hosting provider may log technical data about a visit (such as the IP address) in its server logs.', 'Price alerts are a preview: the email or phone you type into them is stored only in your browser and is not sent anywhere.'] },
        { h: 'Cookies and local storage', id: 'cookies', p: ['Dehesa Index does not use cookies. It keeps a few preferences in your browser’s local storage, only so the site remembers what you chose; they never leave your device:'], ul: [
          { b: 'dehesaIndexLang, dehesaIndexTheme:', t: 'language and theme (light/dark).' },
          { b: 'dehesaIndexLocation, dehesaIndexEuCountry:', t: 'the location and EU country you pick for viewing prices.' },
          { b: 'dehesaIndexTourSeen:', t: 'that you have already seen the welcome.' },
          { b: 'dehesaIndexFavorites, dehesaIndexAlerts:', t: 'your favourite products and preview alerts.' }
        ], after: 'Since these are preferences you choose to use the service and are not used to track you, we do not show a cookie banner. You can delete them at any time from your browser settings (site data).' },
        { h: 'Third-party services', id: 'terceros', p: ['When the page loads, your browser requests fonts from Google Fonts (fonts.googleapis.com), which receives your IP address and the usual technical data of any request. Libraries, such as the map one, are served from this same site. Links to news and sources take you to external sites with their own policies.'] },
        { h: 'Intellectual property and third-party data', id: 'licencias', p: ['The design and code of Dehesa Index belong to its authors. The data belongs to its sources and is used under their terms; we display it with attribution:'], ul: [
          { b: 'USDA NASS.', t: 'This product uses the NASS API but is not endorsed or certified by NASS.' },
          { b: 'European Commission.', t: 'Agri-food Data Portal and Oil Bulletin data, reused under the Commission’s reuse policy.' },
          { b: 'Defra (UK).', t: 'Contains public sector information licensed under the Open Government Licence v3.0.' },
          { b: 'Statistics Canada (Canada).', t: 'Contains information licensed under the Open Government Licence – Canada.' },
          { b: 'Alberta Agriculture and Irrigation.', t: 'Contains information licensed under the Open Government Licence – Alberta.' },
          { b: 'Statistics Denmark (Denmark).', t: 'Source: Statistics Denmark (StatBank), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Ministerio de Agricultura, Pesca y Alimentación — MAPA (Spain).', t: 'Source: Ministerio de Agricultura, Pesca y Alimentación (MAPA), Precios percibidos y pagados por agricultores y ganaderos, and Red Contable Agraria Nacional (RECAN), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'FranceAgriMer — France.', t: 'Source : FranceAgriMer – Données originales téléchargées depuis https://visionet.franceagrimer.fr/ (cotations des céréales, prix payés aux producteurs, cotations viandes) – Licence Ouverte 2.0 (Etalab). Données retraitées par Dehesa Index (échantillonnage hebdomadaire, regroupement par campagne).' },
          { b: 'BLE / Destatis — France.', t: 'Quelle: © Bundesanstalt für Landwirtschaft und Ernährung (BLE), Kuhmilchpreise und -mengen, Schlachtpreise, Markt- und Preisbericht Obst und Gemüse; © Statistisches Bundesamt (Destatis), Erzeugerpreisindizes und Einkaufspreisindizes landwirtschaftlicher Betriebsmittel – Datenlizenz Deutschland – Namensnennung – Version 2.0 (www.govdata.de/dl-de/by-2-0) bzw. Zero – Version 2.0. Daten von Dehesa Index verarbeitet (Auswahl, Umrechnung von ISO-Wochen, Zusammenführung von Zeiträumen).' },
          { b: 'Statbel — Belgium.', t: 'Source: Statbel (Belgian statistical office), open data, free reuse including commercial use with attribution. Data last updated: see the update date shown on each series.' },
          { b: 'Eurostat — Austria.', t: 'Source: Eurostat (official data from Statistik Austria and the Austrian federal ministry), reuse policy with attribution (CC BY 4.0). Processed by Dehesa Index.' },
          { b: 'INE — Portugal.', t: 'Source: Instituto Nacional de Estatística (INE, Statistics Portugal), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Statistics Netherlands (CBS).', t: 'Source: Statistics Netherlands (CBS StatLine), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Australian Bureau of Statistics.', t: 'Source: Australian Bureau of Statistics (ABS Data API), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Eurostat, EIA and World Bank.', t: 'Public data, with its source cited on each card.' },
          { b: 'USDA PSD.', t: 'Supply and demand data from the USDA Foreign Agricultural Service (PSD Online), published under a CC BY 4.0 licence; the source is cited and the “World” figures are marked as our own calculation.' },
          { b: 'USDA AMS Market News.', t: 'US soybean meal prices obtained from the USDA AMS Market News MARS API (report 3511); public U.S. Government data, with the source cited.' },
          { b: 'USDA FAS (export sales and trade).', t: 'U.S. export sales and trade by country obtained from the USDA FAS open APIs (Export Sales Reporting and GATS, with Census Bureau data); public U.S. Government data, with the source cited.' },
          { b: 'U.S. Drought Monitor.', t: 'State drought data from the U.S. Drought Monitor (National Drought Mitigation Center at the University of Nebraska-Lincoln, USDA and NOAA); public data, source credited.' },
          { b: 'USDA ERS.', t: 'Food price outlook, production costs and farm income from USDA’s Economic Research Service; public U.S. Government data, source credited.' },
          { b: 'NASA POWER.', t: 'Climate data from NASA’s Prediction Of Worldwide Energy Resources project, MERRA-2 reanalysis. NASA data free to use; the source is cited.' },
          { b: 'European Central Bank.', t: 'Reference exchange rates, which the ECB publishes for information purposes only.' }
        ], after: 'We do not show data from sources that prohibit automated or commercial use (for example AHDB, CME or DTN); those cards appear as pending.' },
        { h: 'Changes', p: ['We may update this text when the site changes. Last reviewed: 30 September 2026.'] }
      ],
      links: [{ href: 'metodologia.html', t: 'Methodology' }, { href: 'contacto.html', t: 'Contact' }]
    },
    fr: {
      title: 'Mentions légales et confidentialité',
      sub: 'Qui est derrière le site, ce que nous stockons (presque rien), quels tiers interviennent et sous quelles licences nous utilisons les données.',
      sections: [
        { h: 'Mentions légales', id: 'aviso-legal', p: ['Dehesa Index (dehesaindex.com) est un site d’information réunissant les prix agricoles des États-Unis, de l’UE et du Royaume-Uni. Contact : hola@dehesaindex.com.', 'Le contenu est fourni « tel quel », à titre informatif. Bien que chaque donnée soit vérifiée à sa source officielle, nous ne garantissons pas l’absence d’erreurs, de retards ou de révisions de la source.'] },
        { h: 'Pas de conseil', id: 'terminos', p: ['Rien sur ce site ne constitue un conseil financier, d’investissement, juridique ou commercial. Les prix ne sont ni des cotations en temps réel ni des offres d’achat ou de vente. Prenez vos décisions avec votre propre conseiller et vos propres données de marché.'] },
        { h: 'Confidentialité', id: 'privacidad', p: ['Il n’y a ni compte utilisateur ni inscription, et le site n’intègre ni analytique ni publicité. Nous ne collectons aucune donnée personnelle sur nos serveurs.', 'Le formulaire de contact n’envoie encore rien : si vous nous écrivez par e-mail, nous utilisons votre message et votre adresse uniquement pour répondre. Comme tout site, l’hébergeur peut consigner des données techniques de la visite (comme l’adresse IP) dans ses journaux serveur.', 'Les alertes de prix sont un aperçu : l’e-mail ou le téléphone saisi n’est conservé que dans votre navigateur et n’est envoyé nulle part.'] },
        { h: 'Cookies et stockage local', id: 'cookies', p: ['Dehesa Index n’utilise pas de cookies. Il conserve quelques préférences dans le stockage local de votre navigateur, uniquement pour que le site se souvienne de vos choix ; elles ne quittent jamais votre appareil :'], ul: [
          { b: 'dehesaIndexLang, dehesaIndexTheme :', t: 'langue et thème (clair/sombre).' },
          { b: 'dehesaIndexLocation, dehesaIndexEuCountry :', t: 'le lieu et le pays de l’UE choisis pour afficher les prix.' },
          { b: 'dehesaIndexTourSeen :', t: 'que vous avez déjà vu l’accueil.' },
          { b: 'dehesaIndexFavorites, dehesaIndexAlerts :', t: 'vos produits favoris et les alertes d’essai.' }
        ], after: 'Comme il s’agit de préférences que vous choisissez pour utiliser le service et qui ne servent pas à vous suivre, nous n’affichons pas de bandeau cookies. Vous pouvez les supprimer à tout moment dans les réglages de votre navigateur (données du site).' },
        { h: 'Services tiers', id: 'terceros', p: ['Au chargement de la page, votre navigateur demande les polices à Google Fonts (fonts.googleapis.com), qui reçoit votre adresse IP et les données techniques habituelles de toute requête. Les bibliothèques, comme celle de la carte, sont servies depuis ce même site. Les liens vers des actualités et des sources mènent à des sites externes avec leurs propres politiques.'] },
        { h: 'Propriété intellectuelle et données de tiers', id: 'licencias', p: ['La conception et le code de Dehesa Index appartiennent à leurs auteurs. Les données appartiennent à leurs sources et sont utilisées selon leurs conditions ; nous les affichons avec attribution :'], ul: [
          { b: 'USDA NASS.', t: 'This product uses the NASS API but is not endorsed or certified by NASS.' },
          { b: 'Commission européenne.', t: 'Données de l’Agri-food Data Portal et de l’Oil Bulletin, réutilisées selon la politique de réutilisation de la Commission.' },
          { b: 'Defra (Royaume-Uni).', t: 'Contains public sector information licensed under the Open Government Licence v3.0.' },
          { b: 'Statistique Canada (Canada).', t: 'Contains information licensed under the Open Government Licence – Canada.' },
          { b: 'Alberta Agriculture and Irrigation.', t: 'Contains information licensed under the Open Government Licence – Alberta.' },
          { b: 'Statistics Denmark (Danemark).', t: 'Source: Statistics Denmark (StatBank), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Ministerio de Agricultura, Pesca y Alimentación — MAPA (Espagne).', t: 'Source: Ministerio de Agricultura, Pesca y Alimentación (MAPA), Precios percibidos y pagados por agricultores y ganaderos, and Red Contable Agraria Nacional (RECAN), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'FranceAgriMer — France.', t: 'Source : FranceAgriMer – Données originales téléchargées depuis https://visionet.franceagrimer.fr/ (cotations des céréales, prix payés aux producteurs, cotations viandes) – Licence Ouverte 2.0 (Etalab). Données retraitées par Dehesa Index (échantillonnage hebdomadaire, regroupement par campagne).' },
          { b: 'BLE / Destatis — France.', t: 'Quelle: © Bundesanstalt für Landwirtschaft und Ernährung (BLE), Kuhmilchpreise und -mengen, Schlachtpreise, Markt- und Preisbericht Obst und Gemüse; © Statistisches Bundesamt (Destatis), Erzeugerpreisindizes und Einkaufspreisindizes landwirtschaftlicher Betriebsmittel – Datenlizenz Deutschland – Namensnennung – Version 2.0 (www.govdata.de/dl-de/by-2-0) bzw. Zero – Version 2.0. Daten von Dehesa Index verarbeitet (Auswahl, Umrechnung von ISO-Wochen, Zusammenführung von Zeiträumen).' },
          { b: 'Statbel — Belgium.', t: 'Source: Statbel (Belgian statistical office), open data, free reuse including commercial use with attribution. Data last updated: see the update date shown on each series.' },
          { b: 'Eurostat — Austria.', t: 'Source: Eurostat (official data from Statistik Austria and the Austrian federal ministry), reuse policy with attribution (CC BY 4.0). Processed by Dehesa Index.' },
          { b: 'INE — Portugal.', t: 'Source: Instituto Nacional de Estatística (INE, Statistics Portugal), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Statistics Netherlands (CBS).', t: 'Source: Statistics Netherlands (CBS StatLine), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Australian Bureau of Statistics.', t: 'Source: Australian Bureau of Statistics (ABS Data API), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Eurostat, EIA et Banque mondiale.', t: 'Données publiques, avec leur source citée sur chaque fiche.' },
          { b: 'USDA PSD.', t: 'Données d’offre et de demande de l’USDA Foreign Agricultural Service (PSD Online), publiées sous licence CC BY 4.0 ; la source est citée et les chiffres « Monde » sont indiqués comme un calcul propre.' },
          { b: 'USDA AMS Market News.', t: 'Prix du tourteau de soja des États-Unis obtenus via l’API MARS d’USDA AMS Market News (rapport 3511) ; données publiques du gouvernement américain, source citée.' },
          { b: 'USDA FAS (exportations et commerce).', t: 'Ventes à l’exportation et commerce des États-Unis par pays obtenus via les API ouvertes de l’USDA FAS (Export Sales Reporting et GATS, avec des données du Census Bureau) ; données publiques du gouvernement américain, source citée.' },
          { b: 'U.S. Drought Monitor.', t: 'Données de sécheresse par État du U.S. Drought Monitor (National Drought Mitigation Center de l’Université du Nebraska-Lincoln, USDA et NOAA) ; données publiques, source citée.' },
          { b: 'USDA ERS.', t: 'Prévision des prix alimentaires, coûts de production et revenu agricole de l’Economic Research Service de l’USDA ; données publiques du gouvernement américain, source citée.' },
          { b: 'NASA POWER.', t: 'Données climatiques du projet Prediction Of Worldwide Energy Resources de la NASA, réanalyse MERRA-2. Données NASA d’usage libre ; la source est citée.' },
          { b: 'Banque centrale européenne.', t: 'Taux de change de référence, publiés par la BCE à titre informatif uniquement.' }
        ], after: 'Nous n’affichons pas de données de sources qui interdisent l’usage automatisé ou commercial (par exemple AHDB, CME ou DTN) ; ces fiches apparaissent en attente.' },
        { h: 'Modifications', p: ['Nous pouvons mettre à jour ce texte lorsque le site évolue. Dernière révision : 30 septembre 2026.'] }
      ],
      links: [{ href: 'metodologia.html', t: 'Méthodologie' }, { href: 'contacto.html', t: 'Contact' }]
    },
    it: {
      title: 'Note legali e privacy',
      sub: 'Chi c’è dietro il sito, cosa conserviamo (quasi nulla), quali terze parti intervengono e con quali licenze usiamo i dati.',
      sections: [
        { h: 'Note legali', id: 'aviso-legal', p: ['Dehesa Index (dehesaindex.com) è un sito informativo che raccoglie i prezzi agricoli di USA, UE e Regno Unito. Contatto: hola@dehesaindex.com.', 'I contenuti sono forniti «così come sono», a scopo informativo. Anche se ogni dato è verificato alla fonte ufficiale, non garantiamo l’assenza di errori, ritardi o revisioni della fonte.'] },
        { h: 'Nessuna consulenza', id: 'terminos', p: ['Nulla in questo sito è consulenza finanziaria, di investimento, legale o commerciale. I prezzi non sono quotazioni in tempo reale né offerte di acquisto o vendita. Prendi le tue decisioni con il tuo consulente e i tuoi dati di mercato.'] },
        { h: 'Privacy', id: 'privacidad', p: ['Non ci sono account utente né registrazioni, e il sito non include analisi né pubblicità. Non raccogliamo dati personali sui nostri server.', 'Il modulo di contatto non invia ancora nulla: se ci scrivi per e-mail, useremo il messaggio e l’indirizzo solo per risponderti. Come ogni sito, il provider di hosting può registrare dati tecnici della visita (come l’indirizzo IP) nei log del server.', 'Gli avvisi di prezzo sono un’anteprima: l’e-mail o il telefono che inserisci resta solo nel tuo browser e non viene inviato da nessuna parte.'] },
        { h: 'Cookie e archiviazione locale', id: 'cookies', p: ['Dehesa Index non usa cookie. Conserva alcune preferenze nell’archiviazione locale del tuo browser, solo perché il sito ricordi le tue scelte; non lasciano mai il tuo dispositivo:'], ul: [
          { b: 'dehesaIndexLang, dehesaIndexTheme:', t: 'lingua e tema (chiaro/scuro).' },
          { b: 'dehesaIndexLocation, dehesaIndexEuCountry:', t: 'la posizione e il paese UE scelti per vedere i prezzi.' },
          { b: 'dehesaIndexTourSeen:', t: 'che hai già visto il benvenuto.' },
          { b: 'dehesaIndexFavorites, dehesaIndexAlerts:', t: 'i tuoi prodotti preferiti e gli avvisi di prova.' }
        ], after: 'Trattandosi di preferenze che scegli per usare il servizio e che non servono a tracciarti, non mostriamo un banner cookie. Puoi eliminarle in qualsiasi momento dalle impostazioni del browser (dati del sito).' },
        { h: 'Servizi di terze parti', id: 'terceros', p: ['Al caricamento della pagina, il tuo browser richiede i caratteri a Google Fonts (fonts.googleapis.com), che riceve il tuo indirizzo IP e i consueti dati tecnici di ogni richiesta. Le librerie, come quella della mappa, sono servite da questo stesso sito. I link a notizie e fonti portano a siti esterni con proprie politiche.'] },
        { h: 'Proprietà intellettuale e dati di terzi', id: 'licencias', p: ['Il design e il codice di Dehesa Index appartengono ai loro autori. I dati appartengono alle loro fonti e sono usati secondo le loro condizioni; li mostriamo con attribuzione:'], ul: [
          { b: 'USDA NASS.', t: 'This product uses the NASS API but is not endorsed or certified by NASS.' },
          { b: 'Commissione europea.', t: 'Dati dell’Agri-food Data Portal e dell’Oil Bulletin, riutilizzati secondo la politica di riutilizzo della Commissione.' },
          { b: 'Defra (Regno Unito).', t: 'Contains public sector information licensed under the Open Government Licence v3.0.' },
          { b: 'Statistics Canada (Canada).', t: 'Contains information licensed under the Open Government Licence – Canada.' },
          { b: 'Alberta Agriculture and Irrigation.', t: 'Contains information licensed under the Open Government Licence – Alberta.' },
          { b: 'Statistics Denmark (Danimarca).', t: 'Source: Statistics Denmark (StatBank), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Ministerio de Agricultura, Pesca y Alimentación — MAPA (Spagna).', t: 'Source: Ministerio de Agricultura, Pesca y Alimentación (MAPA), Precios percibidos y pagados por agricultores y ganaderos, and Red Contable Agraria Nacional (RECAN), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'FranceAgriMer — Francia.', t: 'Source : FranceAgriMer – Données originales téléchargées depuis https://visionet.franceagrimer.fr/ (cotations des céréales, prix payés aux producteurs, cotations viandes) – Licence Ouverte 2.0 (Etalab). Données retraitées par Dehesa Index (échantillonnage hebdomadaire, regroupement par campagne).' },
          { b: 'BLE / Destatis — Francia.', t: 'Quelle: © Bundesanstalt für Landwirtschaft und Ernährung (BLE), Kuhmilchpreise und -mengen, Schlachtpreise, Markt- und Preisbericht Obst und Gemüse; © Statistisches Bundesamt (Destatis), Erzeugerpreisindizes und Einkaufspreisindizes landwirtschaftlicher Betriebsmittel – Datenlizenz Deutschland – Namensnennung – Version 2.0 (www.govdata.de/dl-de/by-2-0) bzw. Zero – Version 2.0. Daten von Dehesa Index verarbeitet (Auswahl, Umrechnung von ISO-Wochen, Zusammenführung von Zeiträumen).' },
          { b: 'Statbel — Belgium.', t: 'Source: Statbel (Belgian statistical office), open data, free reuse including commercial use with attribution. Data last updated: see the update date shown on each series.' },
          { b: 'Eurostat — Austria.', t: 'Source: Eurostat (official data from Statistik Austria and the Austrian federal ministry), reuse policy with attribution (CC BY 4.0). Processed by Dehesa Index.' },
          { b: 'INE — Portugal.', t: 'Source: Instituto Nacional de Estatística (INE, Statistics Portugal), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Statistics Netherlands (CBS).', t: 'Source: Statistics Netherlands (CBS StatLine), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Australian Bureau of Statistics.', t: 'Source: Australian Bureau of Statistics (ABS Data API), licensed under CC BY 4.0. Processed by Dehesa Index.' },
          { b: 'Eurostat, EIA e Banca mondiale.', t: 'Dati pubblici, con la fonte citata in ogni scheda.' },
          { b: 'USDA PSD.', t: 'Dati di offerta e domanda dell’USDA Foreign Agricultural Service (PSD Online), pubblicati con licenza CC BY 4.0; la fonte è citata e le cifre “Mondo” sono indicate come calcolo proprio.' },
          { b: 'USDA AMS Market News.', t: 'Prezzi della farina di soia degli Stati Uniti ottenuti dall’API MARS di USDA AMS Market News (rapporto 3511); dati pubblici del governo USA, fonte citata.' },
          { b: 'USDA FAS (esportazioni e commercio).', t: 'Vendite all’esportazione e commercio degli Stati Uniti per paese ottenuti dalle API aperte dell’USDA FAS (Export Sales Reporting e GATS, con dati del Census Bureau); dati pubblici del governo USA, fonte citata.' },
          { b: 'U.S. Drought Monitor.', t: 'Dati di siccità per Stato dell’U.S. Drought Monitor (National Drought Mitigation Center dell’Università del Nebraska-Lincoln, USDA e NOAA); dati pubblici, fonte citata.' },
          { b: 'USDA ERS.', t: 'Previsione dei prezzi alimentari, costi di produzione e reddito agricolo dell’Economic Research Service dell’USDA; dati pubblici del governo USA, fonte citata.' },
          { b: 'NASA POWER.', t: 'Dati climatici del progetto Prediction Of Worldwide Energy Resources della NASA, rianalisi MERRA-2. Dati NASA di uso libero; la fonte è citata.' },
          { b: 'Banca centrale europea.', t: 'Tassi di cambio di riferimento, che la BCE pubblica solo a scopo informativo.' }
        ], after: 'Non mostriamo dati di fonti che vietano l’uso automatizzato o commerciale (ad esempio AHDB, CME o DTN); queste schede appaiono in attesa.' },
        { h: 'Modifiche', p: ['Possiamo aggiornare questo testo quando il sito cambia. Ultima revisione: 30 settembre 2026.'] }
      ],
      links: [{ href: 'metodologia.html', t: 'Metodologia' }, { href: 'contacto.html', t: 'Contatto' }]
    }
  };
  window.DehesaTextPage(STRINGS, 'informacion');
})();
