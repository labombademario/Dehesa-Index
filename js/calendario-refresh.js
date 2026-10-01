/* Dehesa Index — Calendario: próximas actualizaciones de nuestros propios datos (de data/pipeline-status.json). ES5. */
(function () {
  'use strict';
  var T = { es: ['Próximas actualizaciones de Dehesa Index', 'Cuándo está previsto que cada proceso automático vuelva a buscar datos (hora estimada según su programación; si la fuente aún no ha publicado, el dato no cambia).', 'Proceso', 'Próxima ejecución', 'Última'],
    en: ['Upcoming Dehesa Index refreshes', 'When each automated job is due to fetch data again (estimated from its schedule; if the source has not published yet, the data does not change).', 'Job', 'Next run', 'Last'],
    fr: ['Prochaines actualisations de Dehesa Index', 'Quand chaque processus automatique doit relancer la collecte (heure estimée selon sa programmation ; si la source n’a pas publié, la donnée ne change pas).', 'Processus', 'Prochaine exécution', 'Dernière'],
    it: ['Prossimi aggiornamenti di Dehesa Index', 'Quando ogni processo automatico dovrebbe richiedere di nuovo i dati (ora stimata dalla programmazione; se la fonte non ha pubblicato, il dato non cambia).', 'Processo', 'Prossima esecuzione', 'Ultima'] };
  var P = null;
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fd(i) { try { return new Date(i).toLocaleString(lang(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'; } catch (e) { return String(i); } }
  function render() {
    var r = document.getElementById('cal-refresh'); if (!r || !P) return; var t = T[lang()] || T.es;
    var l = P.pipelines.filter(function (p) { return p.nextRun; }).sort(function (a, b) { return a.nextRun < b.nextRun ? -1 : 1; }).slice(0, 14);
    r.innerHTML = '<h2 style="margin:26px 0 6px;font-size:18px">' + esc(t[0]) + '</h2><p style="color:var(--text-muted);font-size:13px;max-width:760px">' + esc(t[1]) + '</p><div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:520px;font-size:13px"><thead><tr style="font-size:10.5px;font-weight:700;color:var(--text-faint);text-align:left"><th style="padding:8px 6px">' + esc(t[2]).toUpperCase() + '</th><th style="padding:8px 6px">' + esc(t[3]).toUpperCase() + '</th><th style="padding:8px 6px">' + esc(t[4]).toUpperCase() + '</th></tr></thead><tbody>' +
      l.map(function (p) { return '<tr style="border-top:1px solid var(--border)"><td style="padding:8px 6px">' + esc(p.name) + '</td><td style="padding:8px 6px">' + esc(fd(p.nextRun)) + '</td><td style="padding:8px 6px">' + (p.last ? esc(fd(p.last.startedAt)) : '–') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  fetch('data/pipeline-status.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { P = d; render(); }).catch(function () {});
  var prev = window.DehesaShared && window.DehesaShared.onLangChange;
  if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
})();
