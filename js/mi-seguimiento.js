/* Dehesa Index — Mi seguimiento (Smart Watchlist 2.0). ES5. Todo local: la lista vive en localStorage (di-watchlist-v1); no hay cuenta ni envio de datos.
   Muestra tus series/productos/paises, sus reglas combinables, las alertas activas, las vistas (historial local), la ultima evaluacion y exporta/importa la lista en JSON validado. */
(function () {
  'use strict';
  var LANGS = ['es', 'en', 'fr', 'it'];
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function li() { var i = LANGS.indexOf(lang()); return i < 0 ? 0 : i; }
  var TX = {
    title: ['Mi seguimiento', 'My watchlist', 'Mon suivi', 'Il mio seguito'],
    sub: ['Tus productos, países y series con avisos combinables. Se guarda solo en este navegador: sin cuenta, sin servidor y sin enviar nada. Los avisos se evalúan cuando abres Dehesa Index.', 'Your products, countries and series with combinable alerts. Stored only in this browser: no account, no server and nothing is sent. Alerts are evaluated when you open Dehesa Index.', 'Vos produits, pays et séries avec des alertes combinables. Stocké uniquement dans ce navigateur : sans compte, sans serveur et rien n’est envoyé. Les alertes sont évaluées à l’ouverture de Dehesa Index.', 'I tuoi prodotti, paesi e serie con avvisi combinabili. Salvato solo in questo browser: nessun account, nessun server e nulla viene inviato. Gli avvisi vengono valutati quando apri Dehesa Index.'],
    cItems: ['elementos', 'items', 'éléments', 'elementi'], cProducts: ['productos', 'products', 'produits', 'prodotti'], cSeries: ['series de país', 'country series', 'séries par pays', 'serie per paese'], cRules: ['reglas', 'rules', 'règles', 'regole'], cAlerts: ['alertas activas', 'active alerts', 'alertes actives', 'avvisi attivi'], cEval: ['última evaluación', 'last evaluation', 'dernière évaluation', 'ultima valutazione'],
    never: ['nunca', 'never', 'jamais', 'mai'],
    alerts: ['Alertas activas', 'Active alerts', 'Alertes actives', 'Avvisi attivi'], alertsHint: ['reglas cumplidas desde la última vez que marcaste «visto»', 'rules met since you last marked “seen”', 'règles remplies depuis votre dernier « vu »', 'regole soddisfatte dall’ultimo “visto”'],
    noAlerts: ['Ninguna alerta activa. Cuando una de tus reglas se cumpla, aparecerá aquí.', 'No active alerts. When one of your rules is met, it will show up here.', 'Aucune alerte active. Quand une de vos règles sera remplie, elle apparaîtra ici.', 'Nessun avviso attivo. Quando una tua regola sarà soddisfatta, comparirà qui.'],
    markSeen: ['Marcar como visto', 'Mark as seen', 'Marquer comme vu', 'Segna come visto'], markAll: ['Marcar todo como visto', 'Mark all as seen', 'Tout marquer comme vu', 'Segna tutto come visto'], revised: ['revisado', 'revised', 'révisé', 'rivisto'], prev: ['visto antes', 'seen before', 'vu avant', 'visto prima'],
    mine: ['Mis series y productos', 'My series and products', 'Mes séries et produits', 'Le mie serie e prodotti'], mineHint: ['edita las reglas de cada una; con varias puedes elegir si basta una o deben cumplirse todas', 'edit each one’s rules; with several you can choose whether one is enough or all must hold', 'modifiez les règles de chacune ; avec plusieurs, choisissez si une suffit ou si toutes doivent être remplies', 'modifica le regole di ognuna; con più regole puoi scegliere se basta una o devono valere tutte'],
    empty: ['Aún no sigues nada. Usa el buscador de abajo, o pulsa «Seguir» en una ficha de producto o de país.', 'You are not following anything yet. Use the search below, or press “Follow” on a product or country page.', 'Vous ne suivez encore rien. Utilisez la recherche ci-dessous ou appuyez sur « Suivre » sur une fiche produit ou pays.', 'Non segui ancora nulla. Usa la ricerca qui sotto, o premi “Segui” in una scheda prodotto o paese.'],
    latest: ['Último dato', 'Latest', 'Dernière donnée', 'Ultimo dato'], noData: ['sin dato en el índice actual', 'not in the current index', 'absent de l’index actuel', 'non nell’indice attuale'], rules: ['Reglas', 'Rules', 'Règles', 'Regole'], noRules: ['sin reglas: solo se sigue, no avisa', 'no rules: followed only, it will not alert', 'sans règle : suivi seulement, aucune alerte', 'nessuna regola: solo seguito, non avvisa'],
    remove: ['Dejar de seguir', 'Unfollow', 'Ne plus suivre', 'Smetti di seguire'], edit: ['Reglas', 'Rules', 'Règles', 'Regole'], open: ['Abrir', 'Open', 'Ouvrir', 'Apri'], approx: ['aprox.', 'approx.', 'approx.', 'appross.'],
    add: ['Añadir una serie', 'Add a series', 'Ajouter une série', 'Aggiungi una serie'], addPh: ['Busca una serie: trigo, leche, urea, ganado…', 'Search a series: wheat, milk, urea, cattle…', 'Cherchez une série : blé, lait, urée, bétail…', 'Cerca una serie: grano, latte, urea, bestiame…'], follow: ['Seguir', 'Follow', 'Suivre', 'Segui'], followed: ['Siguiendo', 'Following', 'Suivi', 'Seguito'], limit: ['Máximo 60 elementos.', 'Maximum 60 items.', 'Maximum 60 éléments.', 'Massimo 60 elementi.'],
    hist: ['Alertas vistas', 'Seen alerts', 'Alertes vues', 'Avvisi visti'], histHint: ['historial local de las últimas alertas que marcaste como vistas', 'local history of the latest alerts you marked as seen', 'historique local des dernières alertes marquées comme vues', 'cronologia locale degli ultimi avvisi segnati come visti'], noHist: ['Todavía no has marcado ninguna alerta como vista.', 'You have not marked any alert as seen yet.', 'Vous n’avez encore marqué aucune alerte comme vue.', 'Non hai ancora segnato nessun avviso come visto.'], clearHist: ['Borrar historial', 'Clear history', 'Effacer l’historique', 'Cancella cronologia'],
    data: ['Exportar e importar', 'Export and import', 'Exporter et importer', 'Esporta e importa'], dataHint: ['copia de seguridad de tu lista en JSON; la importación valida cada elemento y descarta lo que no cumple el formato', 'JSON backup of your list; import validates every item and discards whatever does not fit the format', 'sauvegarde JSON de votre liste ; l’importation valide chaque élément et écarte ce qui ne respecte pas le format', 'copia JSON della tua lista; l’importazione valida ogni elemento e scarta ciò che non rispetta il formato'],
    download: ['Descargar JSON', 'Download JSON', 'Télécharger le JSON', 'Scarica JSON'], copy: ['Copiar JSON', 'Copy JSON', 'Copier le JSON', 'Copia JSON'], copied: ['Copiado', 'Copied', 'Copié', 'Copiato'], pick: ['Elegir archivo JSON', 'Choose JSON file', 'Choisir un fichier JSON', 'Scegli file JSON'],
    mMerge: ['Fusionar con mi lista', 'Merge with my list', 'Fusionner avec ma liste', 'Unisci alla mia lista'], mReplace: ['Reemplazar mi lista', 'Replace my list', 'Remplacer ma liste', 'Sostituisci la mia lista'], doImport: ['Importar', 'Import', 'Importer', 'Importa'], confirmRep: ['Pulsa otra vez para reemplazar tu lista', 'Press again to replace your list', 'Appuyez encore pour remplacer votre liste', 'Premi di nuovo per sostituire la tua lista'],
    imported: ['Importado: {0} nuevos, {1} actualizados, {2} descartados.', 'Imported: {0} new, {1} updated, {2} discarded.', 'Importé : {0} nouveaux, {1} mis à jour, {2} écartés.', 'Importato: {0} nuovi, {1} aggiornati, {2} scartati.'],
    errFormat: ['El archivo no es una lista de seguimiento de Dehesa Index válida; no se ha cambiado nada.', 'The file is not a valid Dehesa Index watchlist; nothing was changed.', 'Le fichier n’est pas une liste de suivi Dehesa Index valide ; rien n’a été modifié.', 'Il file non è una lista di Dehesa Index valida; non è stato modificato nulla.'], errRead: ['No se pudo leer el archivo como JSON.', 'The file could not be read as JSON.', 'Le fichier n’a pas pu être lu comme JSON.', 'Impossibile leggere il file come JSON.'], errSize: ['El archivo es demasiado grande (máx. 300 KB).', 'The file is too large (max 300 KB).', 'Le fichier est trop volumineux (max 300 Ko).', 'Il file è troppo grande (max 300 KB).'],
    clear: ['Borrar toda mi lista', 'Delete my whole list', 'Supprimer toute ma liste', 'Cancella tutta la lista'], confirmClear: ['Pulsa otra vez para borrarla', 'Press again to delete it', 'Appuyez encore pour la supprimer', 'Premi di nuovo per cancellarla'], privacy: ['Privacidad: nada de esto sale de tu navegador. Si borras los datos del navegador, la lista se pierde: exporta una copia.', 'Privacy: none of this leaves your browser. If you clear browser data, the list is lost: export a copy.', 'Confidentialité : rien de tout cela ne quitte votre navigateur. Si vous effacez les données du navigateur, la liste est perdue : exportez une copie.', 'Privacy: nulla di tutto questo lascia il tuo browser. Se cancelli i dati del browser la lista si perde: esporta una copia.'],
    fs_LIVE: ['EN DIRECTO', 'LIVE', 'EN DIRECT', 'LIVE'], fs_FRESH: ['AL DÍA', 'FRESH', 'À JOUR', 'AGGIORNATO'], fs_EXPECTED_DELAY: ['RETRASO HABITUAL', 'EXPECTED DELAY', 'RETARD HABITUEL', 'RITARDO ABITUALE'], fs_DELAYED: ['RETRASADO', 'DELAYED', 'EN RETARD', 'IN RITARDO'], fs_STALE: ['DESACTUALIZADO', 'STALE', 'OBSOLÈTE', 'OBSOLETO'], fs_PENDING: ['PENDIENTE', 'PENDING', 'EN ATTENTE', 'IN SOSPESO'],
    twRel: ['relación', 'relationship', 'relation', 'relazione'], mode_all: ['deben cumplirse todas', 'all must hold', 'toutes doivent être remplies', 'devono valere tutte'], mode_any: ['basta una', 'any one', 'une suffit', 'ne basta una']
  };
  function t(k) { var a = TX[k]; if (!a) return k; var v = a[li()]; return v === undefined ? a[0] : v; }
  function tf(k) { var s = t(k), a = arguments; return s.replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return String(v); } }
  function when(iso) { try { return new Date(iso).toLocaleString(lang(), { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return iso; } }
  var W = window.DIWatch, IDX = null, CTX = {}, EV = [], ST = { q: '', confirm: '', msg: null };
  var PAGE = { vaca: 'vacuno', harina_soja: 'soja' };
  function link(c, s) { if (c === 'P') { var p = s.split('/')[0]; return 'producto.html?p=' + encodeURIComponent(PAGE[p] || p); } return 'paises.html?c=' + encodeURIComponent(c) + '&s=' + encodeURIComponent(s); }
  function fsB(st, approx) { return '<span class="pt-badge pt-fs-' + esc(st) + '">' + esc(t('fs_' + st)) + (approx ? ' ' + esc(t('approx')) : '') + '</span>'; }
  function chg(c) { if (typeof c !== 'number') return ''; return ' <span class="' + (c > 0 ? 'pt-up' : c < 0 ? 'pt-down' : 'pt-flat') + '">' + (c > 0 ? '+' : '') + nf(c, 2) + ' %</span>'; }
  function rowOf(it) { var a = IDX && IDX[W.key(it.c, it.s)]; return a ? { label: a[0], unit: a[1], freq: a[2], period: a[4], value: a[5], change: a[6] } : null; }
  function ruleChips(it) { return (it.r || []).map(function (r) { return '<span class="pt-badge">🔔 ' + esc(W.ruleText(r, lang())) + '</span>'; }).join(''); }
  function sec(id, title, hint, body) { return '<section class="pt-sec" id="' + id + '" aria-labelledby="' + id + '-h"><div class="di-movers-head-row"><h2 id="' + id + '-h">' + esc(title) + '</h2>' + (hint ? '<span class="di-movers-hint">' + esc(hint) + '</span>' : '') + '</div>' + body + '</section>'; }
  function card(n, l) { return '<div class="di-card pt-card"><div class="pt-v">' + n + '</div><div class="pt-k">' + esc(l) + '</div></div>'; }

  function secAlerts() {
    if (!EV.length) return sec('alertas', t('alerts'), t('alertsHint'), '<p class="pt-note">' + esc(t('noAlerts')) + '</p>');
    var h = '<div class="pt-bar-ctl"><button type="button" class="pt-chip" data-markall="1">' + esc(t('markAll')) + '</button></div><div class="ms-alerts">';
    EV.forEach(function (e, i) {
      h += '<article class="di-card ms-alert"><div class="ms-head"><a href="' + esc(link(e.c, e.s)) + '"><strong>' + esc(e.label) + '</strong></a> <span class="pt-sub">' + esc(e.period) + ' · ' + nf(e.value, Math.abs(e.value) >= 100 ? 1 : 2) + ' ' + esc(e.unit) + '</span>' + chg(e.change) + (e.revised ? ' <span class="pt-badge pt-fs-DELAYED">' + esc(t('revised')) + '</span>' : '') + '</div>';
      h += '<ul class="pt-list">' + e.hits.map(function (r) { return '<li>🔔 ' + esc(W.ruleText(r, lang())) + '</li>'; }).join('') + '</ul>';
      if (e.state) h += '<p class="pt-sub">' + fsB(e.state.state, e.state.approx) + '</p>';
      if (e.tw && e.tw.length) h += '<p class="pt-sub">' + e.tw.slice(0, 3).map(function (z) { return '<a href="relaciones.html?id=' + encodeURIComponent(z.id) + '">' + esc(t('twRel')) + ': ' + esc(z.other.replace(/^P\//, '')) + ' (' + (z.changePct > 0 ? '+' : '') + nf(z.changePct, 1) + ' %)</a>'; }).join(' · ') + '</p>';
      if (e.prev) h += '<p class="pt-sub">' + esc(t('prev')) + ': ' + esc(e.prev.p) + ' → ' + (typeof e.prev.v === 'number' ? nf(e.prev.v, 2) : '—') + '</p>';
      h += '<button type="button" class="pt-chip" data-seen="' + i + '">' + esc(t('markSeen')) + '</button></article>';
    });
    return sec('alertas', t('alerts') + ' (' + EV.length + ')', t('alertsHint'), h + '</div>');
  }
  function secMine(l) {
    if (!l.length) return sec('series', t('mine'), '', '<p class="pt-note">' + esc(t('empty')) + '</p>');
    var h = '<div class="ms-list">';
    l.forEach(function (it, i) {
      var x = rowOf(it), fo = x ? W.freshOf(it.c, it.s, x, CTX) : null, k = W.key(it.c, it.s);
      h += '<article class="di-card ms-item" data-k="' + esc(k) + '"><div class="ms-head"><span class="pt-badge">' + (it.c === 'P' ? esc(it.s.split('/')[1] ? it.s.split('/')[1].toUpperCase() : 'P') : esc(it.c)) + '</span> <a href="' + esc(link(it.c, it.s)) + '"><strong>' + esc(x ? x.label : it.s) + '</strong></a>' + (x ? ' <span class="pt-sub">' + esc(t('latest')) + ': ' + esc(x.period) + ' · ' + nf(x.value, Math.abs(x.value) >= 100 ? 1 : 2) + ' ' + esc(x.unit) + '</span>' + chg(x.change) : ' <span class="pt-sub">(' + esc(t('noData')) + ')</span>') + (fo ? ' ' + fsB(fo.state, fo.approx) : '') + '</div>';
      h += '<div class="ms-rules">' + ((it.r && it.r.length) ? ruleChips(it) + (it.r.length > 1 ? ' <span class="pt-sub">· ' + esc(t(it.m === 'all' ? 'mode_all' : 'mode_any')) + '</span>' : '') : '<span class="pt-sub">' + esc(t('noRules')) + '</span>') + '</div>';
      h += '<details class="rl-det"><summary>' + esc(t('edit')) + '</summary>' + W.editor(it.c, it.s, lang(), { full: true }) + '</details>';
      h += '<div class="pt-bar-ctl"><a class="pt-chip" href="' + esc(link(it.c, it.s)) + '">' + esc(t('open')) + '</a><button type="button" class="pt-chip" data-unfollow="' + i + '">' + esc(t('remove')) + '</button></div></article>';
    });
    return sec('series', t('mine') + ' (' + l.length + ')', t('mineHint'), h + '</div>');
  }
  function secAdd(l) {
    var h = '<input id="ms-q" class="ms-q" type="search" autocomplete="off" value="' + esc(ST.q) + '" placeholder="' + esc(t('addPh')) + '" aria-label="' + esc(t('addPh')) + '">';
    if (ST.q.length >= 2 && IDX) {
      var q = ST.q.toLowerCase(), out = [];
      for (var k in IDX) { if (IDX[k][0].toLowerCase().indexOf(q) > -1 || k.toLowerCase().indexOf(q) > -1) { out.push(k); if (out.length >= 15) break; } }
      h += '<ul class="pt-list ms-res">' + out.map(function (k) {
        var p = k.split('/'), c = p[0] === 'P' ? 'P' : p[0], s = p[0] === 'P' ? p.slice(1).join('/') : p.slice(1).join('/'), on = W.has(c, s);
        return '<li><strong>' + esc(IDX[k][0]) + '</strong> <span class="pt-sub">' + esc(IDX[k][1]) + ' · ' + esc(IDX[k][2]) + '</span> <button type="button" class="pt-chip' + (on ? ' on' : '') + '" data-fk="' + esc(k) + '"' + (on ? ' disabled' : '') + '>' + esc(on ? t('followed') : t('follow')) + '</button></li>';
      }).join('') + '</ul>';
    }
    if (l.length >= 60) h += '<p class="pt-sub">' + esc(t('limit')) + '</p>';
    return sec('anadir', t('add'), '', h);
  }
  function secHist(l) {
    var all = []; l.forEach(function (it) { (it.hist || []).forEach(function (e) { all.push({ it: it, e: e }); }); });
    all.sort(function (a, b) { return a.e.at < b.e.at ? 1 : -1; });
    var h = all.length ? '<ul class="pt-list">' + all.slice(0, 40).map(function (z) { var x = rowOf(z.it); return '<li><span class="pt-sub">' + esc(when(z.e.at)) + '</span> <a href="' + esc(link(z.it.c, z.it.s)) + '">' + esc(x ? x.label : z.it.s) + '</a> · ' + esc(z.e.p) + (typeof z.e.v === 'number' ? ' · ' + nf(z.e.v, 2) : '') + ' — ' + z.e.h.map(function (r) { return esc(W.ruleText(r, lang())); }).join(' · ') + '</li>'; }).join('') + '</ul><div class="pt-bar-ctl"><button type="button" class="pt-chip" data-clearhist="1">' + esc(t('clearHist')) + '</button></div>' : '<p class="pt-note">' + esc(t('noHist')) + '</p>';
    return sec('historial', t('hist'), t('histHint'), h);
  }
  function secData() {
    var h = '<div class="pt-bar-ctl"><button type="button" class="pt-chip" data-export="dl">' + esc(t('download')) + '</button><button type="button" class="pt-chip" data-export="cp">' + esc(t('copy')) + '</button></div>';
    h += '<div class="ms-imp"><label class="pt-chip" for="ms-file">' + esc(t('pick')) + '</label><input id="ms-file" type="file" accept="application/json,.json" class="ms-file"> ' +
      '<label class="ob-sel"><select id="ms-mode" aria-label="' + esc(t('mMerge')) + '"><option value="merge">' + esc(t('mMerge')) + '</option><option value="replace">' + esc(t('mReplace')) + '</option></select></label> <button type="button" class="pt-chip" data-import="1" id="ms-import" disabled>' + esc(ST.confirm === 'import' ? t('confirmRep') : t('doImport')) + '</button></div>';
    if (ST.msg) h += '<p class="pt-note" role="status">' + esc(ST.msg) + '</p>';
    h += '<div class="pt-bar-ctl"><button type="button" class="pt-chip" data-clear="1">' + esc(ST.confirm === 'clear' ? t('confirmClear') : t('clear')) + '</button></div><p class="pt-sub">' + esc(t('privacy')) + '</p>';
    return sec('datos', t('data'), t('dataHint'), h);
  }
  var PENDING = null;
  function render() {
    var body = document.getElementById('ms-body'); if (!body) return;
    document.getElementById('ms-h1').textContent = t('title'); document.getElementById('ms-sub').textContent = t('sub'); document.title = 'Dehesa Index — ' + t('title');
    if (!W) { body.innerHTML = '<p class="pt-err">watchlist.js</p>'; return; }
    var l = W.list(), nR = 0, nP = 0; l.forEach(function (it) { nR += (it.r || []).length; if (it.c === 'P') nP++; });
    var m = W.meta();
    var h = '<div class="pt-cards ms-cards">' + card(l.length, t('cItems')) + card(nP, t('cProducts')) + card(l.length - nP, t('cSeries')) + card(nR, t('cRules')) + card(EV.length, t('cAlerts')) + card(m && m.lastEval ? esc(when(m.lastEval)) : esc(t('never')), t('cEval')) + '</div>';
    h += '<nav class="pt-tabs">' + [['alertas', 'alerts'], ['series', 'mine'], ['anadir', 'add'], ['historial', 'hist'], ['datos', 'data']].map(function (x) { return '<a class="pt-chip" href="#' + x[0] + '">' + esc(t(x[1])) + '</a>'; }).join('') + '</nav>';
    h += secAlerts() + secMine(l) + secAdd(l) + secHist(l) + secData();
    var keepQ = document.activeElement && document.activeElement.id === 'ms-q', open = {};
    Array.prototype.forEach.call(body.querySelectorAll('.ms-item'), function (a) { var d = a.querySelector('details'); if (d && d.open) open[a.getAttribute('data-k')] = 1; });
    body.innerHTML = h;
    Array.prototype.forEach.call(body.querySelectorAll('.ms-item'), function (a) { if (open[a.getAttribute('data-k')]) { var d = a.querySelector('details'); if (d) d.open = true; } });
    if (keepQ) { var q = document.getElementById('ms-q'); if (q) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (e) {} } }
    var fi = document.getElementById('ms-file'); if (fi && PENDING) document.getElementById('ms-import').disabled = false;
    if (location.hash && /^#[a-z]+$/.test(location.hash)) { var el = document.getElementById(location.hash.slice(1)); if (el && el.scrollIntoView) el.scrollIntoView(); }
  }
  function evaluate() {
    return Promise.all([W.loadIndex(), W.context({ fresh: true })]).then(function (a) { IDX = a[0] || {}; CTX = a[1] || {}; EV = W.evaluate(IDX, CTX); render(); });
  }
  function download(name, text) { try { var b = new Blob([text], { type: 'application/json' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); } catch (e) { /* sin descarga */ } }
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('button') : null; if (!b) return;
    var l = W.list();
    if (b.hasAttribute('data-seen')) { W.markSeen(EV[+b.getAttribute('data-seen')]); evaluate(); return; }
    if (b.hasAttribute('data-markall')) { EV.slice().forEach(function (x) { W.markSeen(x); }); evaluate(); return; }
    if (b.hasAttribute('data-unfollow')) { var it = l[+b.getAttribute('data-unfollow')]; if (it) { W.remove(it.c, it.s); W.resetContext(); evaluate(); } return; }
    if (b.hasAttribute('data-fk')) { var p = b.getAttribute('data-fk').split('/'), c = p[0], s = p.slice(1).join('/'); if (!W.has(c, s)) W.toggle(c, s); W.ack(c, s); evaluate(); return; }
    if (b.hasAttribute('data-clearhist')) { W.clearHist(); render(); return; }
    var ex = b.getAttribute('data-export');
    if (ex) { var txt = JSON.stringify(W.exportAll(), null, 1); if (ex === 'dl') download('dehesa-index-seguimiento-' + new Date().toISOString().slice(0, 10) + '.json', txt); else { try { navigator.clipboard.writeText(txt).then(function () { b.textContent = t('copied'); }); } catch (err) { /* sin portapapeles */ } } return; }
    if (b.hasAttribute('data-import')) {
      if (!PENDING) return; var mode = document.getElementById('ms-mode').value;
      if (mode === 'replace' && ST.confirm !== 'import') { ST.confirm = 'import'; render(); return; }
      var r = W.importAll(PENDING, mode); ST.confirm = ''; PENDING = null;
      ST.msg = r.ok ? tf('imported', r.added, r.updated, r.skipped) : t('errFormat'); W.resetContext(); evaluate(); return;
    }
    if (b.hasAttribute('data-clear')) { if (ST.confirm !== 'clear') { ST.confirm = 'clear'; render(); return; } try { window.localStorage.removeItem('di-watchlist-v1'); window.localStorage.removeItem('di-watchlist-meta-v1'); } catch (err) { /* nada */ } ST.confirm = ''; ST.msg = null; W.resetContext(); evaluate(); }
  }
  function onInput(e) { if (e.target.id === 'ms-q') { ST.q = e.target.value; render(); } }
  function onChange(e) {
    if (e.target.id === 'ms-mode') { ST.confirm = ''; render(); document.getElementById('ms-mode').value = e.target.value; return; }
    if (e.target.id !== 'ms-file') return;
    var f = e.target.files && e.target.files[0]; PENDING = null; ST.msg = null; ST.confirm = '';
    if (!f) { render(); return; }
    if (f.size > 300 * 1024) { ST.msg = t('errSize'); render(); return; }
    var rd = new FileReader();
    rd.onload = function () { try { PENDING = JSON.parse(String(rd.result)); ST.msg = f.name; } catch (err) { PENDING = null; ST.msg = t('errRead'); } render(); };
    rd.onerror = function () { ST.msg = t('errRead'); render(); }; rd.readAsText(f);
  }
  var prevCb = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prevCb) prevCb.apply(this, arguments); render(); };
  window.DehesaShared.init('informacion');
  var body = document.getElementById('ms-body'); body.addEventListener('click', onClick); body.addEventListener('input', onInput); body.addEventListener('change', onChange);
  // el editor de reglas pinta y se conecta tras cada render
  var origRender = render; render = function () { origRender(); if (W) W.bindEditor(document.getElementById('ms-body'), function () { evaluate(); }); };
  render(); evaluate();
  window.DIMySeguimiento = { state: function () { return { EV: EV }; } };
})();
