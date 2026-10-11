/* Dehesa Index — Revisiones y correcciones (idea de Mario, 8-oct-2026): qué cifra cambió, cuándo, por qué y cuál era la original,
   y qué publicaciones llegaron tarde. Lee data/revisions.json (revisiones detectadas al comparar cada actualización con la anterior),
   data/corrections.json (correcciones hechas por Dehesa) y data/observatory.json (calendario esperado de cada precio). ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared;
  var T = {
    es: { h1: 'Revisiones y correcciones', sub: 'Las cifras oficiales a veces cambian después de publicarse. Aquí está cada cambio que hemos detectado, con el valor original, el nuevo, la fecha y el motivo, y las publicaciones que llegaron más tarde de lo esperado.',
      cor: 'Correcciones hechas por Dehesa Index', corNone: 'Ninguna hasta ahora. Si corregimos un dato publicado, aparecerá aquí con el valor original y el motivo.',
      rev: 'Cambios detectados en datos ya publicados', revSub: 'Dehesa compara cada descarga con la anterior. Un valor distinto en un periodo ya publicado puede ser una revisión de la fuente, una corrección o un reajuste del propio histórico: la fuente no lo confirma. Dehesa no los corrige a mano.', why: 'Cambio detectado por Dehesa',
      cols: ['Serie', 'Periodo', 'Valor original', 'Valor nuevo', 'Cambio', 'Detectado', 'Motivo', ''], q: 'Buscar una serie', more: 'Ver más', shown: 'Mostrando {n} de {t}',
      late: 'Publicaciones que llegaron tarde', lateSub: 'Precios cuyo dato nuevo se esperaba según el calendario de su fuente y aún no ha llegado.', lateCols: ['Precio', 'Último dato', 'Se esperaba', 'Retraso'], days: '{n} días', lateNone: 'Ningún precio va retrasado ahora mismo.',
      report: '¿Has visto una cifra que no cuadra? Escríbenos con la serie y el periodo: lo comprobamos con la fuente y, si es un error nuestro, lo corregimos y lo anotamos aquí.' },
    en: { h1: 'Revisions and corrections', sub: 'Official figures sometimes change after publication. Here is every change we have detected, with the original value, the new one, the date and the reason, plus releases that arrived later than expected.',
      cor: 'Corrections made by Dehesa Index', corNone: 'None so far. If we correct a published figure it will appear here with the original value and the reason.',
      rev: 'Changes detected in already-published data', revSub: 'Dehesa compares each download with the previous one. A different value for an already-published period may be a source revision, a correction or a rebuild of the history itself: the source does not confirm which. Dehesa does not edit them by hand.', why: 'Change detected by Dehesa',
      cols: ['Series', 'Period', 'Original value', 'New value', 'Change', 'Detected', 'Reason', ''], q: 'Search a series', more: 'Show more', shown: 'Showing {n} of {t}',
      late: 'Releases that arrived late', lateSub: 'Prices whose next figure was expected by the source’s calendar and has not arrived yet.', lateCols: ['Price', 'Latest figure', 'Expected', 'Delay'], days: '{n} days', lateNone: 'No price is late right now.',
      report: 'Seen a figure that looks wrong? Email us the series and period: we check it with the source and, if it is our mistake, we fix it and log it here.' },
    fr: { h1: 'Révisions et corrections', sub: 'Les chiffres officiels changent parfois après publication. Voici chaque changement détecté, avec la valeur d’origine, la nouvelle, la date et le motif, ainsi que les publications arrivées plus tard que prévu.',
      cor: 'Corrections faites par Dehesa Index', corNone: 'Aucune pour l’instant. Si nous corrigeons une donnée publiée, elle apparaîtra ici avec la valeur d’origine et le motif.',
      rev: 'Changements détectés dans des données déjà publiées', revSub: 'Dehesa compare chaque téléchargement avec le précédent. Une valeur différente pour une période déjà publiée peut être une révision de la source, une correction ou un réajustement de l’historique lui-même : la source ne le confirme pas. Dehesa ne les modifie pas à la main.', why: 'Changement détecté par Dehesa',
      cols: ['Série', 'Période', 'Valeur d’origine', 'Nouvelle valeur', 'Variation', 'Détectée', 'Motif', ''], q: 'Chercher une série', more: 'Voir plus', shown: '{n} sur {t}',
      late: 'Publications arrivées en retard', lateSub: 'Prix dont la donnée suivante était attendue selon le calendrier de la source et n’est pas encore arrivée.', lateCols: ['Prix', 'Dernière donnée', 'Attendue', 'Retard'], days: '{n} jours', lateNone: 'Aucun prix n’est en retard en ce moment.',
      report: 'Un chiffre vous semble faux ? Écrivez-nous avec la série et la période : nous vérifions auprès de la source et, si l’erreur vient de nous, nous la corrigeons et la notons ici.' },
    it: { h1: 'Revisioni e correzioni', sub: 'I dati ufficiali a volte cambiano dopo la pubblicazione. Qui c’è ogni cambiamento rilevato, con il valore originale, il nuovo, la data e il motivo, e le pubblicazioni arrivate più tardi del previsto.',
      cor: 'Correzioni fatte da Dehesa Index', corNone: 'Nessuna finora. Se correggiamo un dato pubblicato comparirà qui con il valore originale e il motivo.',
      rev: 'Cambi rilevati in dati già pubblicati', revSub: 'Dehesa confronta ogni download con il precedente. Un valore diverso per un periodo già pubblicato può essere una revisione della fonte, una correzione o una ricostruzione dello storico stesso: la fonte non lo conferma. Dehesa non li modifica a mano.', why: 'Cambio rilevato da Dehesa',
      cols: ['Serie', 'Periodo', 'Valore originale', 'Nuovo valore', 'Variazione', 'Rilevata', 'Motivo', ''], q: 'Cerca una serie', more: 'Mostra altro', shown: '{n} di {t}',
      late: 'Pubblicazioni arrivate in ritardo', lateSub: 'Prezzi il cui dato successivo era atteso secondo il calendario della fonte e non è ancora arrivato.', lateCols: ['Prezzo', 'Ultimo dato', 'Atteso', 'Ritardo'], days: '{n} giorni', lateNone: 'Nessun prezzo è in ritardo in questo momento.',
      report: 'Hai visto un dato che non torna? Scrivici con la serie e il periodo: lo verifichiamo con la fonte e, se l’errore è nostro, lo correggiamo e lo annotiamo qui.' }
  };
  var D = { rev: null, cor: null, obs: null }, LIM = 60, Q = '';
  try { Q = (new URLSearchParams(location.search).get('q') || '').toLowerCase(); } catch (e) {}
  function lang() { return S.getLang(); }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return S.esc(x == null ? '' : String(x)); }
  function nf(v) { if (typeof v !== 'number') return '—'; try { return v.toLocaleString(lang(), { maximumFractionDigits: Math.abs(v) >= 100 ? 1 : 3 }); } catch (e) { return String(v); } }
  function pct(v) { if (typeof v !== 'number') return '—'; var s = (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2); return lang() === 'en' ? s + '%' : s.replace('.', ',') + ' %'; }
  function lab(l) { return window.DILabelTl && window.DILabelTl.ready(lang()) ? window.DILabelTl.tl(l, lang()) : l; }
  function get(u) { return fetch(S.sitePath(u), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function table(cols, rows) { return '<div class="di-table-wrap" style="overflow-x:auto"><table class="di-table" style="width:100%;font-size:13px;border-collapse:collapse"><thead><tr>' + cols.map(function (c) { return '<th style="text-align:left;padding:6px 8px">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function td(x, raw) { return '<td style="padding:6px 8px;border-top:1px solid var(--border)">' + (raw ? x : esc(x)) + '</td>'; }
  function render() {
    var w = t(); document.getElementById('rv-h1').textContent = w.h1; document.getElementById('rv-sub').textContent = w.sub; document.title = w.h1 + ' | Dehesa Index';
    var h = '';
    var C = (D.cor && D.cor.corrections) || [];
    h += '<section class="di-card" style="padding:14px 16px;margin:0 0 16px"><h2 style="font-size:18px;margin:0 0 6px">' + esc(w.cor) + '</h2>' + (C.length ? table(w.cols.slice(0, 7), C.map(function (c) { return '<tr>' + td(lab(c.label || c.series)) + td(c.period) + td(nf(c.old)) + td(nf(c.new)) + td(pct(c.pct)) + td(S.fmtDate(c.date || '')) + td(c.why || '') + '</tr>'; })) : '<p class="di-movers-hint" style="margin:0">' + esc(w.corNone) + '</p>') + '</section>';
    var R = ((D.rev && D.rev.revisions) || []).filter(function (r) { return !Q || (String(r.label || '') + ' ' + r.series).toLowerCase().indexOf(Q) > -1; });
    h += '<section class="di-card" style="padding:14px 16px;margin:0 0 16px"><h2 style="font-size:18px;margin:0 0 4px">' + esc(w.rev) + '</h2><p class="di-movers-hint" style="margin:0 0 8px">' + esc(w.revSub) + '</p>' +
      '<input type="search" id="rv-q" class="di-compare-select" aria-label="' + esc(w.q) + '" placeholder="' + esc(w.q) + '" value="' + esc(Q) + '" style="min-width:220px;margin:0 0 8px">' +
      table(w.cols, R.slice(0, LIM).map(function (r) { return '<tr>' + td(lab(r.label || r.series) + (r.unit ? ' (' + r.unit + ')' : '')) + td(r.period) + td(nf(r.old)) + td(nf(r.new)) + td(pct(r.pct)) + td(S.fmtDate(String(r.detectedAt || '').slice(0, 10))) + td(w.why) + td(S.reportLink({ id: r.series, label: r.label, period: r.period, value: r.new, unit: r.unit }), 1) + '</tr>'; })) +
      '<p class="di-movers-hint" style="margin:6px 0 0">' + esc(w.shown.replace('{n}', Math.min(LIM, R.length)).replace('{t}', R.length)) + (R.length > LIM ? ' <button type="button" class="di-link-btn" id="rv-more">' + esc(w.more) + '</button>' : '') + '</p></section>';
    var O = ((D.obs && D.obs.observations) || []).filter(function (o) { return o.type === 'PRICE' && (o.freshness === 'DELAYED' || o.freshness === 'STALE') && o.expectedNext; });
    var today = (D.obs && D.obs.today) || new Date().toISOString().slice(0, 10), dd = function (a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 864e5); };
    var L0 = (D.obs && D.obs.labels) || {};
    h += '<section class="di-card" style="padding:14px 16px;margin:0 0 16px"><h2 style="font-size:18px;margin:0 0 4px">' + esc(w.late) + '</h2><p class="di-movers-hint" style="margin:0 0 8px">' + esc(w.lateSub) + '</p>' +
      (O.length ? table(w.lateCols, O.sort(function (a, b) { return a.expectedNext < b.expectedNext ? -1 : 1; }).map(function (o) { var nm = L0[o.product] ? (L0[o.product][lang()] || L0[o.product].es) : o.product; return '<tr>' + td(nm + ' (' + String(o.region).toUpperCase() + ')') + td(S.fmtDate(o.observationDate)) + td(S.fmtDate(o.expectedNext)) + td(w.days.replace('{n}', Math.max(0, dd(o.expectedNext, today)))) + '</tr>'; })) : '<p class="di-movers-hint" style="margin:0">' + esc(w.lateNone) + '</p>') + '</section>';
    h += '<p>' + esc(w.report) + ' ' + S.reportLink({ label: w.h1 }) + '</p>';
    var root = document.getElementById('rv-body'); root.innerHTML = h;
    var q = document.getElementById('rv-q'); if (q) q.oninput = function () { Q = q.value.toLowerCase(); var pos = q.selectionStart; render(); var n = document.getElementById('rv-q'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} };
    var m = document.getElementById('rv-more'); if (m) m.onclick = function () { LIM += 100; render(); };
  }
  S.init('data');
  S.onLangChange = function () { render(); if (window.DILabelTl) window.DILabelTl.load(lang()).then(function (ok) { if (ok) render(); }); };
  Promise.all([get('data/revisions.json'), get('data/corrections.json'), get('data/observatory.json'), window.DILabelTl ? window.DILabelTl.load(lang()) : null]).then(function (a) { D.rev = a[0]; D.cor = a[1]; D.obs = a[2]; render(); });
})();
