/* Dehesa Index — «¿Puedo fiarme del precio que veo?»: respuesta en lenguaje normal para agricultores, antes del diagnóstico técnico
   (auditoría 8-oct-2026). Lee data/observatory.json (estado de cada precio según el calendario de su fuente, con nombres de producto traducidos). ES5, sin librerías. */
(function () {
  'use strict';
  var T = {
    es: { h: '¿Puedo fiarme del precio que veo?', ok: '{n} de {t} precios están al día con el calendario de su fuente.', wait: '{n} llegan con el retraso habitual de su fuente (no es un fallo).', late: '{n} van retrasados o desactualizados: {l}.', none: 'Ninguno va retrasado.', how: 'Cada precio muestra su fecha de observación y su fuente oficial. Si un dato llega tarde lo marcamos; nunca lo sustituimos por otro mercado ni lo rellenamos.', more: 'Ver el estado de cada fuente', tech: 'Detalles técnicos: fuentes, procesos y registros' },
    en: { h: 'Can I trust the price I am looking at?', ok: '{n} of {t} prices are up to date with their source’s calendar.', wait: '{n} arrive with their source’s usual delay (not a fault).', late: '{n} are late or out of date: {l}.', none: 'None is late.', how: 'Every price shows its observation date and official source. If a figure is late we flag it; we never replace it with another market or fill it in.', more: 'See the status of each source', tech: 'Technical details: sources, processes and logs' },
    fr: { h: 'Puis-je me fier au prix que je vois ?', ok: '{n} prix sur {t} sont à jour selon le calendrier de leur source.', wait: '{n} arrivent avec le retard habituel de leur source (ce n’est pas une panne).', late: '{n} sont en retard ou obsolètes : {l}.', none: 'Aucun n’est en retard.', how: 'Chaque prix indique sa date d’observation et sa source officielle. Une donnée en retard est signalée ; elle n’est jamais remplacée par un autre marché ni complétée.', more: 'Voir l’état de chaque source', tech: 'Détails techniques : sources, processus et journaux' },
    it: { h: 'Posso fidarmi del prezzo che vedo?', ok: '{n} prezzi su {t} sono aggiornati secondo il calendario della loro fonte.', wait: '{n} arrivano con il ritardo abituale della fonte (non è un guasto).', late: '{n} sono in ritardo o non aggiornati: {l}.', none: 'Nessuno è in ritardo.', how: 'Ogni prezzo mostra la data di osservazione e la fonte ufficiale. Se un dato arriva tardi lo segnaliamo; non lo sostituiamo mai con un altro mercato né lo completiamo.', more: 'Vedi lo stato di ogni fonte', tech: 'Dettagli tecnici: fonti, processi e registri' }
  };
  var PN = { es: 'es', en: 'en', fr: 'fr', it: 'it' };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function f(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function render(el, d, lang, link) {
    var t = T[lang] || T.es, L = d && d.freshness && d.freshness.latest; if (!L) { el.innerHTML = ''; return; }
    var b = L.byState || {}, ok = (b.LIVE || 0) + (b.FRESH || 0), wait = b.EXPECTED_DELAY || 0;
    var late = (d.observations || []).filter(function (o) { return o.type === 'PRICE' && (o.freshness === 'DELAYED' || o.freshness === 'STALE'); });
    var Sh = window.DehesaShared, nm = function (o) { var m = Sh && Sh.marketLabel ? Sh.marketLabel(o, lang) : ''; var pl = d.labels && d.labels[o.product]; return (pl ? (pl[lang] || pl.es) : String(o.product).replace(/_/g, ' ')) + (m ? ' (' + m + ')' : ' (' + String(o.region).toUpperCase() + ')'); };
    el.innerHTML = '<section class="di-card" style="padding:16px 18px;margin:0 0 18px"><h2 style="font-size:19px;margin:0 0 8px">' + esc(t.h) + '</h2>' +
      '<p style="margin:0 0 4px"><b>' + esc(f(t.ok, { n: ok, t: L.total })) + '</b></p>' + (wait ? '<p style="margin:0 0 4px">' + esc(f(t.wait, { n: wait })) + '</p>' : '') +
      '<p style="margin:0 0 8px">' + esc(late.length ? f(t.late, { n: late.length, l: late.map(nm).join(', ') }) : t.none) + '</p>' +
      '<p class="di-movers-hint" style="margin:0">' + esc(t.how) + (link ? ' <a href="status.html">' + esc(t.more) + '</a>' : '') + '</p></section>';
  }
  window.DITrustBox = {
    T: T,
    mount: function (id, opts) {
      var el = document.getElementById(id); if (!el) return;
      var lang = function () { return window.DehesaShared ? window.DehesaShared.getLang() : 'es'; };
      var sp = window.DehesaShared && window.DehesaShared.sitePath ? window.DehesaShared.sitePath : function (u) { return u; };
      var lm = Promise.resolve();   // sin cargar market-labels: la región basta aquí y la página no se encarece
      Promise.all([window.DIObsDoc || fetch(sp('data/observatory.json'), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }), lm]).then(function (a) {
        var d = a[0], go = function () { render(el, d, PN[lang()] || 'es', opts && opts.link); var s = document.getElementById(id + '-tech'); if (s) s.textContent = (T[lang()] || T.es).tech; };
        go(); var prev = window.DehesaShared && window.DehesaShared.onLangChange;
        if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); go(); };
      }).catch(function () { el.innerHTML = ''; });
    }
  };
  var auto = document.getElementById('trust-box'); if (auto) window.DITrustBox.mount('trust-box', { link: auto.getAttribute('data-link') === '1' });
})();
