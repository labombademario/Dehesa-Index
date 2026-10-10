/* Dehesa Index — «Hoy» en la portada: qué cambió (data/daily-brief.json), qué viene (fechas oficiales del USDA, data/usda-calendar.json) y mi seguimiento (lista local).
   ES5. Sin cuentas: la lista de seguimiento se lee del almacenamiento del navegador. Si un dato no carga, ese bloque lo dice y el resto sigue. */
(function () {
  'use strict';
  var T = {
    es: { h: 'Qué está pasando hoy', ch: 'Qué cambió', up: 'Qué viene', my: 'Mi seguimiento', np: 'series con dato nuevo', rv: 'revisiones oficiales', st: 'con retraso', mv: 'Mayores movimientos', all: 'Ver todos los cambios', cal: 'Ver el calendario', today: 'hoy', tom: 'mañana', inN: 'en {0} días', none: 'Sin fechas oficiales del USDA en los próximos 14 días.', nodata: 'No se pudo cargar este bloque.', upn: 'Fechas oficiales del USDA (hora ET); un festivo puede moverlas.', win: 'últimas 24 h',
      n1: 'serie seguida', nn: 'series seguidas', nz: 'Todavía no sigues ninguna serie. Marca ☆ en un precio para recibir avisos.', alerts: 'Ver mis avisos', manage: 'Gestionar mi seguimiento', asof: 'Actualizado' },
    en: { h: 'What is happening today', ch: 'What changed', up: 'What is coming', my: 'My watchlist', np: 'series with new data', rv: 'official revisions', st: 'running late', mv: 'Biggest moves', all: 'See all changes', cal: 'See the calendar', today: 'today', tom: 'tomorrow', inN: 'in {0} days', none: 'No official USDA dates in the next 14 days.', nodata: 'This block could not be loaded.', upn: 'Official USDA dates (ET); a holiday can shift them.', win: 'last 24 h',
      n1: 'followed series', nn: 'followed series', nz: 'You are not following any series yet. Star ☆ a price to get alerts.', alerts: 'See my alerts', manage: 'Manage my watchlist', asof: 'Updated' },
    fr: { h: 'Ce qui se passe aujourd’hui', ch: 'Ce qui a changé', up: 'Ce qui arrive', my: 'Mon suivi', np: 'séries avec nouvelle donnée', rv: 'révisions officielles', st: 'en retard', mv: 'Plus fortes variations', all: 'Voir tous les changements', cal: 'Voir le calendrier', today: 'aujourd’hui', tom: 'demain', inN: 'dans {0} jours', none: 'Aucune date officielle de l’USDA dans les 14 prochains jours.', nodata: 'Ce bloc n’a pas pu être chargé.', upn: 'Dates officielles de l’USDA (heure ET) ; un jour férié peut les décaler.', win: '24 dernières heures',
      n1: 'série suivie', nn: 'séries suivies', nz: 'Vous ne suivez encore aucune série. Cochez ☆ sur un prix pour recevoir des alertes.', alerts: 'Voir mes alertes', manage: 'Gérer mon suivi', asof: 'Mis à jour' },
    it: { h: 'Cosa succede oggi', ch: 'Cosa è cambiato', up: 'Cosa arriva', my: 'Il mio seguito', np: 'serie con nuovo dato', rv: 'revisioni ufficiali', st: 'in ritardo', mv: 'Maggiori variazioni', all: 'Vedi tutti i cambiamenti', cal: 'Vedi il calendario', today: 'oggi', tom: 'domani', inN: 'tra {0} giorni', none: 'Nessuna data ufficiale USDA nei prossimi 14 giorni.', nodata: 'Impossibile caricare questo blocco.', upn: 'Date ufficiali USDA (ora ET); un giorno festivo può spostarle.', win: 'ultime 24 ore',
      n1: 'serie seguita', nn: 'serie seguite', nz: 'Non segui ancora nessuna serie. Segna ☆ su un prezzo per ricevere avvisi.', alerts: 'Vedi i miei avvisi', manage: 'Gestisci il mio seguito', asof: 'Aggiornato' }
  };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return String(v); } }
  function getJ(u) { return fetch(u).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function mine() { try { var v = JSON.parse(window.localStorage.getItem('di-watchlist-v1') || '[]'); return Array.isArray(v) ? v.length : 0; } catch (e) { return 0; } }
  function col(title, body, link) { return '<div class="di-today-col"><h3>' + esc(title) + '</h3>' + body + (link ? '<p class="di-today-more">' + link + '</p>' : '') + '</div>'; }
  function a(href, txt) { return '<a href="' + href + '">' + esc(txt) + ' →</a>'; }
  function changed(B, t) {
    if (!B || !B.counts) return col(t.ch, '<p class="di-today-note">' + esc(t.nodata) + '</p>', a('brief.html', t.all));
    var c = B.counts, rows = '<dl class="di-today-kv"><div><dt>' + esc(t.np) + '</dt><dd>' + esc(nf(c.newPeriods || 0, 0)) + '</dd></div><div><dt>' + esc(t.rv) + '</dt><dd>' + esc(nf(c.revisions || 0, 0)) + '</dd></div><div><dt>' + esc(t.st) + '</dt><dd>' + esc(nf(c.stale || 0, 0)) + '</dd></div></dl>';
    var mv = (B.movers || []).filter(function (x) { return typeof x.changePct === 'number'; }).sort(function (x, y) { return Math.abs(y.changePct) - Math.abs(x.changePct); }).slice(0, 3);
    if (mv.length) rows += '<ul class="di-today-list" aria-label="' + esc(t.mv) + '">' + mv.map(function (x) { return '<li><span' + (window.DILabel && window.DILabel.t(x.label).changed ? ' title="' + esc(x.label) + '"' : '') + '>' + esc(window.DILabel ? window.DILabel.t(x.label).text : x.label) + '</span><b class="' + (x.changePct > 0 ? 'up' : 'dn') + '">' + (x.changePct > 0 ? '+' : '−') + esc(nf(Math.abs(x.changePct), 1)) + ' %</b></li>'; }).join('') + '</ul>';
    return col(t.ch + ' · ' + t.win, rows, a('brief.html', t.all));
  }
  function coming(U, CAL, t) {
    var l = lang(), body;
    if (!U || !CAL) body = '<p class="di-today-note">' + esc(t.nodata) + '</p>';
    else {
      var td = U.today(), rs = U.upcoming(CAL, td, 14).slice(0, 4);
      body = rs.length ? '<ul class="di-today-list">' + rs.map(function (r) { var n = U.days(td, r.date), w = n === 0 ? t.today : n === 1 ? t.tom : t.inN.replace('{0}', n); return '<li><span>' + esc((U.NAMES[r.id] || {})[l] || r.name || r.id) + '</span><b>' + esc(w) + '</b></li>'; }).join('') + '</ul><p class="di-today-note">' + esc(t.upn) + '</p>' : '<p class="di-today-note">' + esc(t.none) + '</p>';
    }
    return col(t.up, body, a('calendario.html', t.cal));
  }
  function watching(t) {
    var n = mine(), body = n ? '<p class="di-today-big">' + esc(nf(n, 0)) + ' <span>' + esc(n === 1 ? t.n1 : t.nn) + '</span></p>' : '<p class="di-today-note">' + esc(t.nz) + '</p>';
    return col(t.my, body, n ? a('brief.html#watch', t.alerts) + ' · ' + a('mi-seguimiento.html', t.manage) : a('mi-seguimiento.html', t.manage));
  }
  function render() {
    var box = document.getElementById('home-today'); if (!box) return;
    var t = T[lang()] || T.es, U = window.DIUsdaCal;
    Promise.all([getJ('data/views/home-brief.json'), U ? U.load().catch(function () { return null; }) : Promise.resolve(null)]).then(function (r) {
      box.innerHTML = '<div class="di-movers-head-row"><h2>' + esc(t.h) + '</h2>' + (r[0] && r[0].generatedAt ? '<span class="di-movers-hint">' + esc(t.asof) + ': ' + esc((function (g) { try { return new Date(g).toLocaleString(lang(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return String(g).slice(0, 16).replace('T', ' ') + ' UTC'; } })(r[0].generatedAt)) + '</span>' : '') + '</div><div class="di-today">' + changed(r[0], t) + coming(U, r[1], t) + watching(t) + '</div>';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
