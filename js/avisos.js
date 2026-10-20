/* Dehesa Index — Avisos de precio: los movimientos mas fuertes (data/digest/weekly.json, scripts/build-digest.py), el feed Atom y el alta
   al resumen por correo. El correo lo envia un proveedor externo (ver docs/avisos-por-correo.md): mientras DIGEST.action este vacio, el formulario
   NO se muestra y la pagina lo dice. Nada se estima. ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared;
  var DIGEST = S.digest || { action: '', provider: '' };   /* se configura en js/shared.js */
  var T = {
    es: {
      wT: 'Elige cómo seguirlos', wF: 'En un lector de feeds', wM: 'En tu correo', wB: 'En este navegador', wFa: 'Sin dar datos',  wMa: 'Un resumen con lo nuevo', wBa: 'Para tus productos',
      title: 'Avisos de precio', h1: 'Avisos de precio',
      sub: 'Qué precios se han movido más, con su fuente y su fecha. Puedes seguirlos en un lector de feeds sin dar tu correo, recibir el resumen en tu bandeja o activar avisos en este navegador para tus propios productos.',
      loading: 'Cargando…', fail: 'No se pudo cargar el resumen. Vuelve a intentarlo en unos minutos.',
      up: 'Suben más', dn: 'Bajan más', none: 'Ninguna serie supera ahora el umbral de movimiento.', from: 'antes', src: 'Fuente', rep: 'Informe de negociación',
      note: 'La fecha es el periodo que mide la fuente, no el día en que se publicó. Cada movimiento compara un dato con el anterior de la misma serie. Umbrales: semanal y diaria 3 %, mensual 5 %, trimestral 8 %.',
      kM: 'Series con movimiento', kE: 'Movimientos recientes', kD: 'Datos a fecha de',
      fT: 'Seguir sin correo', fP: 'Un feed Atom con los últimos movimientos: se actualiza solo y no hace falta dar ningún dato.', fL: 'Feed en español', fE: 'Feed en inglés',
      mT: 'Recibir el resumen por correo', mP: 'Un correo con las mayores subidas y bajadas, solo con lo que no te habíamos enviado antes. Te puedes dar de baja en cada correo.',
      mOff: 'El envío por correo todavía no está activo. Mientras tanto, usa el feed o los avisos del navegador.', email: 'Tu correo', consent: 'Acepto recibir este resumen por correo. Mi dirección la gestiona {p}; puedo darme de baja en cualquier momento.', go: 'Suscribirme',
      bT: 'Avisos en tu navegador', bP: 'Para tus propios productos y umbrales, sin cuenta y sin dar el correo. Solo funcionan con el navegador abierto.', bL: 'Abrir Mi seguimiento',
      lg: 'Cómo tratamos tu correo', lgP: 'Solo se usa para enviarte este resumen. No lo vendemos ni lo cedemos. Lo guarda el proveedor de envío indicado arriba; consulta el aviso legal.', lgL: 'Aviso legal y privacidad',
      fin: 'Información de fuentes oficiales, no asesoramiento financiero.', M: { us: 'EE. UU.', eu: 'UE', uk: 'Reino Unido', ca: 'Canadá' }
    },
    en: {
      wT: 'Choose how to follow them', wF: 'In a feed reader', wM: 'In your inbox', wB: 'In this browser', wFa: 'No personal data', wMa: 'A summary of what is new', wBa: 'For your own products',
      title: 'Price alerts', h1: 'Price alerts',
      sub: 'Which prices moved most, with their source and date. Follow them in a feed reader without giving your email, get the summary in your inbox, or turn on alerts in this browser for your own products.',
      loading: 'Loading…', fail: 'Could not load the summary. Please try again in a few minutes.',
      up: 'Biggest rises', dn: 'Biggest falls', none: 'No series is currently above the move threshold.', from: 'before', src: 'Source', rep: 'Negotiation report',
      note: 'The date is the period the source measures, not the day it was published. Each move compares a data point with the previous one in the same series. Thresholds: weekly and daily 3%, monthly 5%, quarterly 8%.',
      kM: 'Series with a move', kE: 'Recent moves', kD: 'Data as of',
      fT: 'Follow without email', fP: 'An Atom feed with the latest moves: it updates by itself and needs no personal data.', fL: 'Spanish feed', fE: 'English feed',
      mT: 'Get the summary by email', mP: 'One email with the biggest rises and falls, only with what we had not sent you before. You can unsubscribe in every email.',
      mOff: 'Email delivery is not active yet. Meanwhile, use the feed or the browser alerts.', email: 'Your email', consent: 'I agree to receive this summary by email. My address is handled by {p}; I can unsubscribe at any time.', go: 'Subscribe',
      bT: 'Alerts in your browser', bP: 'For your own products and thresholds, no account and no email. They only work while the browser is open.', bL: 'Open My watchlist',
      lg: 'How we treat your email', lgP: 'It is used only to send you this summary. We do not sell or share it. It is stored by the sending provider named above; see the legal notice.', lgL: 'Legal notice and privacy',
      fin: 'Information from official sources, not financial advice.', M: { us: 'US', eu: 'EU', uk: 'UK', ca: 'Canada' }
    },
    fr: {
      wT: 'Choisissez comment les suivre', wF: 'Dans un lecteur de flux', wM: 'Dans votre boîte mail', wB: 'Dans ce navigateur', wFa: 'Sans donnée personnelle', wMa: 'Un résumé des nouveautés', wBa: 'Pour vos produits',
      title: 'Alertes de prix', h1: 'Alertes de prix',
      sub: 'Quels prix ont le plus bougé, avec leur source et leur date. Suivez-les dans un lecteur de flux sans donner votre e-mail, recevez le résumé dans votre boîte ou activez des alertes dans ce navigateur pour vos propres produits.',
      loading: 'Chargement…', fail: 'Impossible de charger le résumé. Réessayez dans quelques minutes.',
      up: 'Plus fortes hausses', dn: 'Plus fortes baisses', none: 'Aucune série ne dépasse actuellement le seuil de variation.', from: 'avant', src: 'Source', rep: 'Rapport de négociation',
      note: 'La date est la période mesurée par la source, pas le jour de publication. Chaque variation compare une donnée à la précédente de la même série. Seuils : hebdomadaire et quotidien 3 %, mensuel 5 %, trimestriel 8 %.',
      kM: 'Séries en mouvement', kE: 'Variations récentes', kD: 'Données au',
      fT: 'Suivre sans e-mail', fP: 'Un flux Atom avec les dernières variations : il se met à jour seul et ne demande aucune donnée personnelle.', fL: 'Flux en espagnol', fE: 'Flux en anglais',
      mT: 'Recevoir le résumé par e-mail', mP: 'Un e-mail avec les plus fortes hausses et baisses, uniquement ce que nous ne vous avions pas déjà envoyé. Vous pouvez vous désabonner dans chaque e-mail.',
      mOff: 'L’envoi par e-mail n’est pas encore actif. En attendant, utilisez le flux ou les alertes du navigateur.', email: 'Votre e-mail', consent: 'J’accepte de recevoir ce résumé par e-mail. Mon adresse est gérée par {p} ; je peux me désabonner à tout moment.', go: 'M’abonner',
      bT: 'Alertes dans votre navigateur', bP: 'Pour vos propres produits et seuils, sans compte ni e-mail. Elles ne fonctionnent que navigateur ouvert.', bL: 'Ouvrir Mon suivi',
      lg: 'Comment nous traitons votre e-mail', lgP: 'Il sert uniquement à vous envoyer ce résumé. Nous ne le vendons ni ne le cédons. Il est conservé par le prestataire d’envoi indiqué ci-dessus ; voir les mentions légales.', lgL: 'Mentions légales et confidentialité',
      fin: 'Information issue de sources officielles, pas un conseil financier.', M: { us: 'É.-U.', eu: 'UE', uk: 'Royaume-Uni', ca: 'Canada' }
    },
    it: {
      wT: 'Scegli come seguirli', wF: 'In un lettore di feed', wM: 'Nella tua casella', wB: 'In questo browser', wFa: 'Senza dati personali', wMa: 'Un riepilogo delle novità', wBa: 'Per i tuoi prodotti',
      title: 'Avvisi di prezzo', h1: 'Avvisi di prezzo',
      sub: 'Quali prezzi si sono mossi di più, con fonte e data. Puoi seguirli in un lettore di feed senza dare la tua e-mail, ricevere il riepilogo nella tua casella o attivare avvisi in questo browser per i tuoi prodotti.',
      loading: 'Caricamento…', fail: 'Impossibile caricare il riepilogo. Riprova tra qualche minuto.',
      up: 'Maggiori rialzi', dn: 'Maggiori ribassi', none: 'Nessuna serie supera ora la soglia di variazione.', from: 'prima', src: 'Fonte', rep: 'Rapporto di negoziazione',
      note: 'La data è il periodo misurato dalla fonte, non il giorno di pubblicazione. Ogni variazione confronta un dato con il precedente della stessa serie. Soglie: settimanale e giornaliera 3%, mensile 5%, trimestrale 8%.',
      kM: 'Serie in movimento', kE: 'Variazioni recenti', kD: 'Dati al',
      fT: 'Seguire senza e-mail', fP: 'Un feed Atom con le ultime variazioni: si aggiorna da solo e non richiede dati personali.', fL: 'Feed in spagnolo', fE: 'Feed in inglese',
      mT: 'Ricevere il riepilogo per e-mail', mP: 'Un’e-mail con i maggiori rialzi e ribassi, solo con ciò che non ti avevamo già inviato. Puoi annullare l’iscrizione in ogni e-mail.',
      mOff: 'L’invio per e-mail non è ancora attivo. Nel frattempo usa il feed o gli avvisi del browser.', email: 'La tua e-mail', consent: 'Accetto di ricevere questo riepilogo per e-mail. Il mio indirizzo è gestito da {p}; posso annullare l’iscrizione in qualsiasi momento.', go: 'Iscrivimi',
      bT: 'Avvisi nel tuo browser', bP: 'Per i tuoi prodotti e le tue soglie, senza account né e-mail. Funzionano solo a browser aperto.', bL: 'Apri Il mio seguito',
      lg: 'Come trattiamo la tua e-mail', lgP: 'Serve solo a inviarti questo riepilogo. Non la vendiamo né la cediamo. La conserva il fornitore di invio indicato sopra; vedi le note legali.', lgL: 'Note legali e privacy',
      fin: 'Informazioni da fonti ufficiali, non consulenza finanziaria.', M: { us: 'USA', eu: 'UE', uk: 'Regno Unito', ca: 'Canada' }
    }
  };
  var W = null, FAILED = false;
  function lang() { return S.getLang ? S.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(n, d) { try { return Number(n).toLocaleString(lang(), { maximumFractionDigits: d == null ? 2 : d }); } catch (e) { return String(n); } }
  function nm(o, k) { return (o && (o[lang()] || o.es)) || k || ''; }
  function cleanAttr(a) { return String(a == null ? '' : a).replace(/\s*\([^)]*<[^>]*>[^)]*\)/g, '').replace(/,\s*<[^>]+>/g, '').replace(/\s*<[^>]+>/g, '').replace(/\s+([.,])/g, '$1'); }
  function card(k, v) { return '<div class="di-card" style="padding:12px 16px"><div style="font-size:12px;color:var(--text-muted)">' + esc(k) + '</div><div style="font-size:22px;font-weight:700;margin-top:2px">' + esc(v) + '</div></div>'; }
  function list(w, title, items) {
    if (!items.length) return '';
    return '<h3 style="margin:18px 0 6px;font-size:16px">' + esc(title) + '</h3><div class="di-card" style="padding:4px 14px"><ul style="list-style:none;margin:0;padding:0">' + items.map(function (e) {
      var pl = nm(e.place), col = e.changePct > 0 ? '#17703f' : '#9a3b1a';
      return '<li style="padding:10px 0;border-top:1px solid var(--border)"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b>' + esc(nm(e.name, e.product)) + '</b><b style="color:' + col + '">' + (e.changePct > 0 ? '+' : '') + nf(e.changePct) + ' %</b></div>' +
        '<div style="font-size:13px">' + nf(e.value) + ' ' + esc(e.currency) + '/' + esc(S.unitLabel ? S.unitLabel(e.unit, lang()) : e.unit) + ' · ' + esc(e.date) + ' <span style="color:var(--text-muted)">(' + esc(w.from) + ' ' + nf(e.previous) + ', ' + esc(e.previousDate) + ')</span></div>' +
        '<div style="font-size:12px;color:var(--text-muted)">' + esc(w.M[e.region] || e.region) + (pl && pl !== nm(e.name) && pl !== (w.M[e.region] || '') ? ' · ' + esc(pl) : '') + ' · ' + esc(cleanAttr(e.attribution)) + ' · <a href="informe-negociacion.html?p=' + encodeURIComponent(e.product) + '">' + esc(w.rep) + '</a></div></li>';
    }).join('') + '</ul></div>';
  }
  function render() {
    var w = t(), root = document.getElementById('av-body'); if (!root) return;
    document.getElementById('av-h1').textContent = w.h1; document.getElementById('av-sub').textContent = w.sub; document.title = w.title + ' | Dehesa Index';
    if (FAILED) { root.innerHTML = '<p>' + esc(w.fail) + '</p>'; return; }
    if (!W) { root.innerHTML = '<p class="di-movers-hint">' + esc(w.loading) + '</p>'; return; }
    var h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:8px">' + card(w.kM, nf(W.summary.seriesWithMoves)) + card(w.kE, nf(W.summary.events)) + card(w.kD, S.fmtDate ? S.fmtDate(W.generatedAt) : W.generatedAt) + '</div>';
    h += (W.topUp.length || W.topDown.length) ? '<div class="av-two"><div>' + list(w, w.up, W.topUp) + '</div><div>' + list(w, w.dn, W.topDown) + '</div></div>' : '<p class="di-movers-hint">' + esc(w.none) + '</p>';
    h += '<p class="di-movers-hint">' + esc(w.note) + ' ' + esc(w.fin) + '</p>@@WAYS@@';
    var mail;
    if (DIGEST.action) mail = '<form style="display:grid;gap:8px;margin-top:8px" action="' + esc(DIGEST.action) + '" method="post" target="_blank"><label style="font-size:13px">' + esc(w.email) + '<br><input type="email" name="email" required autocomplete="email" class="di-compare-select" style="width:100%"></label>' +
      '<label style="font-size:12.5px;display:flex;gap:8px;align-items:flex-start"><input type="checkbox" required style="margin-top:3px"><span>' + esc(w.consent.replace('{p}', DIGEST.provider)) + '</span></label><input type="hidden" name="tag" value="' + (lang() === 'es' ? 'es' : 'en') + '"><button class="di-btn-gold-solid" type="submit">' + esc(w.go) + '</button></form>';
    else mail = '<p class="di-movers-hint">' + esc(w.mOff) + '</p>';
    var ways = '<h2 style="margin:22px 0 8px;font-size:18px">' + esc(w.wT) + '</h2><div class="av-ways">' +
      '<div class="di-card av-way"><b>' + esc(w.wF) + '</b><span class="av-tag">' + esc(w.wFa) + '</span><p class="di-emp-p">' + esc(w.fP) + '</p><p><a href="' + esc(S.sitePath('data/digest/feed.xml')) + '">' + esc(w.fL) + '</a> · <a href="' + esc(S.sitePath('data/digest/feed-en.xml')) + '">' + esc(w.fE) + '</a></p></div>' +
      '<div class="di-card av-way"><b>' + esc(w.wM) + '</b><span class="av-tag">' + esc(w.wMa) + '</span><p class="di-emp-p">' + esc(w.mP) + '</p>' + mail + '</div>' +
      '<div class="di-card av-way"><b>' + esc(w.wB) + '</b><span class="av-tag">' + esc(w.wBa) + '</span><p class="di-emp-p">' + esc(w.bP) + '</p><p><a class="di-btn-sec" href="mi-seguimiento.html">' + esc(w.bL) + '</a></p></div></div>';
    h = h.replace('@@WAYS@@', ways);
    h += '<h2 style="margin:26px 0 6px;font-size:18px">' + esc(w.lg) + '</h2><p class="di-emp-p">' + esc(w.lgP) + ' <a href="legal.html">' + esc(w.lgL) + '</a></p>';
    root.innerHTML = h;
  }
  S.init('data');
  S.onLangChange = render;
  render();
  fetch(S.sitePath('data/digest/weekly.json'), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (d) { W = d; render(); }).catch(function () { FAILED = true; render(); });
})();
