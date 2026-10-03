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
        { h: 'Servicios de terceros', id: 'terceros', p: ['Las tipografías y las librerías, como la del mapa, se sirven desde este mismo sitio: al cargar la página no se envía tu dirección IP a terceros. La única excepción es el visor de parcelas de Portugal, que al abrirlo pide las imágenes de las capas al servidor del IFAP (www.ifap.pt), que recibe tu dirección IP y los datos técnicos habituales de cualquier petición. Los enlaces a noticias y fuentes te llevan a sitios externos con sus propias políticas.'] },
        { h: 'Propiedad intelectual y datos de terceros', id: 'licencias', p: ['El diseño y el código de Dehesa Index son de sus autores. Los datos pertenecen a sus fuentes y se usan según sus condiciones; las mostramos con su atribución:'], ul: [
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
        { h: 'Third-party services', id: 'terceros', p: ['Fonts and libraries, such as the map one, are served from this same site: loading a page does not send your IP address to third parties. The only exception is the Portugal parcel viewer, which, when opened, requests the layer images from the IFAP server (www.ifap.pt), which receives your IP address and the usual technical data of any request. Links to news and sources take you to external sites with their own policies.'] },
        { h: 'Intellectual property and third-party data', id: 'licencias', p: ['The design and code of Dehesa Index belong to its authors. The data belongs to its sources and is used under their terms; we display it with attribution:'], ul: [
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
        { h: 'Services tiers', id: 'terceros', p: ['Les polices et les bibliothèques, comme celle de la carte, sont servies depuis ce même site : le chargement d’une page n’envoie pas votre adresse IP à des tiers. La seule exception est le visualiseur de parcelles du Portugal qui, à son ouverture, demande les images des couches au serveur de l’IFAP (www.ifap.pt), lequel reçoit votre adresse IP et les données techniques habituelles de toute requête. Les liens vers des actualités et des sources mènent à des sites externes avec leurs propres politiques.'] },
        { h: 'Propriété intellectuelle et données de tiers', id: 'licencias', p: ['La conception et le code de Dehesa Index appartiennent à leurs auteurs. Les données appartiennent à leurs sources et sont utilisées selon leurs conditions ; nous les affichons avec attribution :'], ul: [
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
        { h: 'Servizi di terze parti', id: 'terceros', p: ['I caratteri e le librerie, come quella della mappa, sono serviti da questo stesso sito: il caricamento di una pagina non invia il tuo indirizzo IP a terzi. L’unica eccezione è il visualizzatore di particelle del Portogallo che, all’apertura, richiede le immagini dei livelli al server dell’IFAP (www.ifap.pt), che riceve il tuo indirizzo IP e i consueti dati tecnici di ogni richiesta. I link a notizie e fonti portano a siti esterni con proprie politiche.'] },
        { h: 'Proprietà intellettuale e dati di terzi', id: 'licencias', p: ['Il design e il codice di Dehesa Index appartengono ai loro autori. I dati appartengono alle loro fonti e sono usati secondo le loro condizioni; li mostriamo con attribuzione:'], ul: [
        ], after: 'Non mostriamo dati di fonti che vietano l’uso automatizzato o commerciale (ad esempio AHDB, CME o DTN); queste schede appaiono in attesa.' },
        { h: 'Modifiche', p: ['Possiamo aggiornare questo testo quando il sito cambia. Ultima revisione: 30 settembre 2026.'] }
      ],
      links: [{ href: 'metodologia.html', t: 'Metodologia' }, { href: 'contacto.html', t: 'Contatto' }]
    }
  };

  /* Privacidad de la suscripción por correo: solo se añade cuando el blog tiene un servicio configurado (DehesaShared.newsletter). */
  var NLP = {
    es: function (v) { return 'Suscripción al blog por correo: si te suscribes, tu dirección de correo la recibe y la guarda ' + v + ', el servicio que envía el blog, y la usamos solo para mandarte las entradas nuevas. La base legal es tu consentimiento (casilla del formulario), que puedes retirar en cualquier momento con el enlace de baja de cada correo; al darte de baja se borra tu dirección. No la cedemos a nadie más ni la usamos para publicidad. Ese servicio actúa como encargado del tratamiento y puede tratar los datos fuera de la UE; consulta su política de privacidad. Este párrafo sustituye a «no recogemos datos personales» solo en lo que se refiere a esta suscripción. Para ejercer tus derechos de acceso, rectificación o supresión escribe a hola@dehesaindex.com.'; },
    en: function (v) { return 'Blog email subscription: if you subscribe, your email address is received and stored by ' + v + ', the service that sends the blog, and we use it only to send you new posts. The legal basis is your consent (the form checkbox), which you can withdraw at any time with the unsubscribe link in every email; unsubscribing deletes your address. We do not share it with anyone else or use it for advertising. That service acts as data processor and may process data outside the EU; see its privacy policy. This paragraph overrides “we do not collect personal data” only for this subscription. To exercise your rights of access, rectification or erasure, write to hola@dehesaindex.com.'; },
    fr: function (v) { return 'Abonnement au blog par e-mail : si vous vous abonnez, votre adresse e-mail est reçue et conservée par ' + v + ', le service qui envoie le blog, et nous l’utilisons uniquement pour vous envoyer les nouveaux articles. La base légale est votre consentement (case du formulaire), que vous pouvez retirer à tout moment via le lien de désabonnement de chaque e-mail ; le désabonnement supprime votre adresse. Nous ne la partageons avec personne d’autre et ne l’utilisons pas pour de la publicité. Ce service agit comme sous-traitant et peut traiter les données hors de l’UE ; consultez sa politique de confidentialité. Ce paragraphe déroge à « nous ne collectons aucune donnée personnelle » uniquement pour cet abonnement. Pour exercer vos droits d’accès, de rectification ou d’effacement, écrivez à hola@dehesaindex.com.'; },
    it: function (v) { return 'Iscrizione al blog via email: se ti iscrivi, il tuo indirizzo email è ricevuto e conservato da ' + v + ', il servizio che invia il blog, e lo usiamo solo per inviarti i nuovi articoli. La base giuridica è il tuo consenso (la casella del modulo), che puoi ritirare in qualsiasi momento con il link di disiscrizione presente in ogni email; disiscrivendoti il tuo indirizzo viene cancellato. Non lo cediamo a nessun altro né lo usiamo per pubblicità. Quel servizio agisce come responsabile del trattamento e può trattare i dati fuori dall’UE; consulta la sua informativa. Questo paragrafo deroga a «non raccogliamo dati personali» solo per questa iscrizione. Per esercitare i tuoi diritti di accesso, rettifica o cancellazione scrivi a hola@dehesaindex.com.'; }
  };
  (function () {
    var nl = window.DehesaShared && window.DehesaShared.newsletter; if (!nl || !nl.provider) return;
    Object.keys(STRINGS).forEach(function (lg) { STRINGS[lg].sections.forEach(function (sec) { if (sec.id === 'privacidad' && NLP[lg]) sec.p.push(NLP[lg](nl.provider)); }); });
  })();

  /* Licencias: la lista se genera desde data/license-registry.json (fuente unica de verdad, con su gate de CI), no se escribe a mano. */
  var LS = {
    es: { VERIFIED: 'Licencia verificada', PENDING: 'Pendiente de confirmar', RESTRICTED: 'No se usa (restringida)', BLOCKED: 'No se usa (bloqueada)', lic: 'Licencia', att: 'Atribución', lim: 'Condiciones y límites', on: 'verificada el', ev: 'Los textos de licencia y atribución se citan tal como los publica cada fuente.', pend: 'Las fuentes marcadas como pendientes se usan con la atribución indicada mientras se confirma por escrito su alcance de reutilización; nunca damos por concedido un permiso que no esté publicado.', unused: 'Fuentes evaluadas y no usadas: ', fail: 'No se pudo cargar el registro de licencias (data/license-registry.json).' },
    en: { VERIFIED: 'Licence verified', PENDING: 'Pending confirmation', RESTRICTED: 'Not used (restricted)', BLOCKED: 'Not used (blocked)', lic: 'Licence', att: 'Attribution', lim: 'Conditions and limits', on: 'verified on', ev: 'Licence and attribution texts are quoted as each source publishes them.', pend: 'Sources marked pending are used with the attribution shown while their reuse scope is confirmed in writing; we never assume a permission that is not published.', unused: 'Sources assessed and not used: ', fail: 'The licence registry could not be loaded (data/license-registry.json).' },
    fr: { VERIFIED: 'Licence vérifiée', PENDING: 'En attente de confirmation', RESTRICTED: 'Non utilisée (restreinte)', BLOCKED: 'Non utilisée (bloquée)', lic: 'Licence', att: 'Attribution', lim: 'Conditions et limites', on: 'vérifiée le', ev: 'Les textes de licence et d’attribution sont cités tels que chaque source les publie.', pend: 'Les sources marquées en attente sont utilisées avec l’attribution indiquée en attendant la confirmation écrite de leur portée de réutilisation ; nous ne présumons jamais une autorisation non publiée.', unused: 'Sources évaluées et non utilisées : ', fail: 'Le registre des licences n’a pas pu être chargé (data/license-registry.json).' },
    it: { VERIFIED: 'Licenza verificata', PENDING: 'In attesa di conferma', RESTRICTED: 'Non usata (limitata)', BLOCKED: 'Non usata (bloccata)', lic: 'Licenza', att: 'Attribuzione', lim: 'Condizioni e limiti', on: 'verificata il', ev: 'I testi di licenza e attribuzione sono citati come li pubblica ciascuna fonte.', pend: 'Le fonti segnate come in attesa sono usate con l’attribuzione indicata finché non si conferma per iscritto l’ambito di riutilizzo; non presumiamo mai un permesso non pubblicato.', unused: 'Fonti valutate e non usate: ', fail: 'Impossibile caricare il registro delle licenze (data/license-registry.json).' }
  };
  function licenseItems(reg, lg) {
    var w = LS[lg] || LS.es, rank = { VERIFIED: 0, PENDING: 1 }, ids = Object.keys(reg.sources), used = [], unused = [];
    ids.forEach(function (k) { (reg.sources[k].used ? used : unused).push(k); });
    used.sort(function (a, b) { var x = reg.sources[a], y = reg.sources[b]; return ((rank[x.status] || 2) - (rank[y.status] || 2)) || x.name.localeCompare(y.name); });
    var items = used.map(function (k) {
      var x = reg.sources[k], t = w[x.status] + ' · ' + w.lic + ': ' + x.licenseName + (x.status === 'VERIFIED' && x.verifiedAt ? ' (' + w.on + ' ' + x.verifiedAt + ')' : '') + '.';
      if (x.attributionText) t += ' ' + w.att + ': ' + x.attributionText;
      if (x.additionalRestrictions) t += ' ' + w.lim + ': ' + x.additionalRestrictions;
      return { b: x.name + '.', t: t, u: x.licenseUrl, ul: x.licenseUrl.replace(/^https?:\/\//, '').slice(0, 60) };
    });
    return { ul: items, after: w.ev + ' ' + w.pend + ' ' + w.unused + unused.map(function (k) { return reg.sources[k].name.split(' (')[0]; }).join(', ') + '.' };
  }
  fetch('data/license-registry.json').then(function (r) { if (!r.ok) throw new Error('x'); return r.json(); }).then(function (reg) {
    Object.keys(STRINGS).forEach(function (lg) { STRINGS[lg].sections.forEach(function (sec) { if (sec.id === 'licencias') { var g = licenseItems(reg, lg); sec.ul = g.ul; sec.after = g.after; } }); });
    if (window.DehesaShared && window.DehesaShared.onLangChange) window.DehesaShared.onLangChange();
  }).catch(function () {
    Object.keys(STRINGS).forEach(function (lg) { STRINGS[lg].sections.forEach(function (sec) { if (sec.id === 'licencias') sec.after = (LS[lg] || LS.es).fail; }); });
    if (window.DehesaShared && window.DehesaShared.onLangChange) window.DehesaShared.onLangChange();
  });
  window.DehesaTextPage(STRINGS, 'informacion');
})();
