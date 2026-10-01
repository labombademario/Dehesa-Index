/* Dehesa Index — Observatorio de datos. ES5.
   Lee data/observatory.json (scripts/build-observatory.py, derivado de ficheros ya validados). No calcula ni inventa nada en el navegador salvo filtrar y ordenar.
   Filtros por pais (region del mercado), producto, fuente y tipo de dato; estado en la URL: ?c=&p=&s=&t=&w= y ancla de seccion (#new, #moves, #revisions, #freshness, #upcoming, #coverage, #quality, #pipelines). */
(function () {
  'use strict';
  var LANGS = ['es', 'en', 'fr', 'it'];
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function li() { var i = LANGS.indexOf(lang()); return i < 0 ? 0 : i; }
  var TX = {
    title: ['Observatorio de datos', 'Data observatory', 'Observatoire des données', 'Osservatorio dei dati'],
    sub: ['Qué se ha actualizado, qué es nuevo, los mayores movimientos, la frescura, las próximas observaciones esperadas, la cobertura y la salud de los pipelines. Todo sale de datos ya validados y cada cifra indica su fuente y su fecha.', 'What was updated, what is new, the biggest moves, freshness, the next expected observations, coverage and pipeline health. Everything comes from already-validated data and every figure states its source and date.', 'Ce qui a été mis à jour, ce qui est nouveau, les plus grands mouvements, la fraîcheur, les prochaines observations attendues, la couverture et la santé des pipelines. Tout provient de données déjà validées et chaque chiffre indique sa source et sa date.', 'Cosa è stato aggiornato, cosa è nuovo, i maggiori movimenti, la freschezza, le prossime osservazioni attese, la copertura e lo stato delle pipeline. Tutto proviene da dati già validati e ogni cifra indica fonte e data.'],
    updated: ['Actualizado', 'Updated', 'Mis à jour', 'Aggiornato'], series: ['series en el catálogo', 'series in the catalogue', 'séries au catalogue', 'serie nel catalogo'], priceLayer: ['series de precios', 'price series', 'séries de prix', 'serie di prezzi'],
    newObs: ['Nuevas observaciones oficiales', 'New official observations', 'Nouvelles observations officielles', 'Nuove osservazioni ufficiali'],
    newHint: ['publicadas (o recuperadas por primera vez) en los últimos {0} días', 'published (or first retrieved) in the last {0} days', 'publiées (ou récupérées pour la première fois) ces {0} derniers jours', 'pubblicate (o recuperate per la prima volta) negli ultimi {0} giorni'],
    moves: ['Mayores movimientos', 'Biggest moves', 'Plus grands mouvements', 'Maggiori movimenti'],
    movesHint: ['último dato frente al anterior dentro de la ventana, en moneda y unidad originales', 'latest value vs the previous one inside the window, in original currency and unit', 'dernière valeur par rapport à la précédente dans la fenêtre, en devise et unité d’origine', 'ultimo dato rispetto al precedente nella finestra, in valuta e unità originali'],
    w_d1: ['Diario (1–3 días)', 'Daily (1–3 days)', 'Quotidien (1–3 jours)', 'Giornaliero (1–3 giorni)'], w_d7: ['Semanal (5–10 días)', 'Weekly (5–10 days)', 'Hebdomadaire (5–10 jours)', 'Settimanale (5–10 giorni)'], w_d30: ['Mensual (25–40 días)', 'Monthly (25–40 days)', 'Mensuel (25–40 jours)', 'Mensile (25–40 giorni)'],
    noMoves: ['Ninguna serie de este filtro tiene un dato anterior dentro de esta ventana. Hoy ninguna serie de la capa de precios es diaria: la ventana diaria queda vacía en lugar de rellenarse.', 'No series in this filter has a previous value inside this window. Today no series in the price layer is daily: the daily window stays empty rather than being filled in.', 'Aucune série de ce filtre n’a de valeur précédente dans cette fenêtre. Aujourd’hui aucune série de la couche des prix n’est quotidienne : la fenêtre quotidienne reste vide au lieu d’être comblée.', 'Nessuna serie di questo filtro ha un dato precedente in questa finestra. Oggi nessuna serie del livello prezzi è giornaliera: la finestra giornaliera resta vuota invece di essere riempita.'],
    revisions: ['Revisiones oficiales', 'Official revisions', 'Révisions officielles', 'Revisioni ufficiali'], revCount: ['{0} revisiones registradas', '{0} revisions recorded', '{0} révisions enregistrées', '{0} revisioni registrate'],
    freshness: ['Frescura de los datos', 'Data freshness', 'Fraîcheur des données', 'Freschezza dei dati'], freshHint: ['Freshness Engine 2.0: el estado depende de la frecuencia y del retraso habitual de cada fuente', 'Freshness Engine 2.0: the state depends on each source’s frequency and usual lag', 'Freshness Engine 2.0 : l’état dépend de la fréquence et du retard habituel de chaque source', 'Freshness Engine 2.0: lo stato dipende da frequenza e ritardo abituale di ogni fonte'],
    priceLayerL: ['Capa de precios (según filtros)', 'Price layer (as filtered)', 'Couche des prix (selon filtres)', 'Livello prezzi (secondo i filtri)'], catalogL: ['Catálogo completo', 'Full catalogue', 'Catalogue complet', 'Catalogo completo'], catalogSrc: ['Catálogo de la fuente {0}', 'Catalogue for source {0}', 'Catalogue de la source {0}', 'Catalogo della fonte {0}'],
    notFresh: ['Series de precios que no están al día', 'Price series that are not up to date', 'Séries de prix qui ne sont pas à jour', 'Serie di prezzi non aggiornate'], allFresh: ['Todas las series de este filtro están EN DIRECTO o AL DÍA.', 'Every series in this filter is LIVE or FRESH.', 'Toutes les séries de ce filtre sont EN DIRECT ou À JOUR.', 'Tutte le serie di questo filtro sono LIVE o FRESCHE.'],
    upcoming: ['Próximas observaciones esperadas', 'Next expected observations', 'Prochaines observations attendues', 'Prossime osservazioni attese'], upHint: ['según la política de frescura; no es un calendario oficial de publicaciones', 'per the freshness policy; not an official release calendar', 'selon la politique de fraîcheur ; pas un calendrier officiel de publications', 'secondo la politica di freschezza; non è un calendario ufficiale di pubblicazioni'],
    pipeRuns: ['Próximas ejecuciones de pipelines', 'Next pipeline runs', 'Prochaines exécutions des pipelines', 'Prossime esecuzioni delle pipeline'],
    coverage: ['Cobertura', 'Coverage', 'Couverture', 'Copertura'], covHint: ['cambios frente a la instantánea anterior', 'changes vs the previous snapshot', 'changements par rapport à l’instantané précédent', 'variazioni rispetto all’istantanea precedente'],
    noCovChanges: ['Sin cambios de cobertura desde la instantánea anterior', 'No coverage changes since the previous snapshot', 'Aucun changement de couverture depuis l’instantané précédent', 'Nessuna variazione di copertura dall’istantanea precedente'], noSnap: ['Aún no hay una instantánea anterior con la que comparar.', 'There is no earlier snapshot to compare with yet.', 'Il n’y a pas encore d’instantané précédent à comparer.', 'Non c’è ancora un’istantanea precedente con cui confrontare.'],
    since: ['desde', 'since', 'depuis', 'da'],
    quality: ['Calidad de los datos', 'Data quality', 'Qualité des données', 'Qualità dei dati'], qHint: ['validación de contratos y anomalías conocidas', 'contract validation and known anomalies', 'validation des contrats et anomalies connues', 'validazione dei contratti e anomalie note'],
    qFiles: ['ficheros validados', 'files validated', 'fichiers validés', 'file validati'], qErr: ['errores', 'errors', 'erreurs', 'errori'], qWarn: ['avisos', 'warnings', 'avertissements', 'avvisi'], qUnexp: ['anomalías sin explicar', 'unexplained anomalies', 'anomalies non expliquées', 'anomalie non spiegate'], qVer: ['anomalías verificadas', 'verified anomalies', 'anomalies vérifiées', 'anomalie verificate'],
    pipelines: ['Salud de los pipelines', 'Pipeline health', 'Santé des pipelines', 'Stato delle pipeline'], allOk: ['Todos los pipelines están en orden.', 'All pipelines are healthy.', 'Tous les pipelines sont en ordre.', 'Tutte le pipeline sono in ordine.'], attention: ['Requieren atención', 'Need attention', 'Demandent de l’attention', 'Richiedono attenzione'],
    ok: ['en orden', 'ok', 'ok', 'ok'], late: ['con retraso', 'late', 'en retard', 'in ritardo'], error: ['con error', 'error', 'en erreur', 'in errore'], not_run: ['sin ejecutar', 'not run', 'non exécutés', 'non eseguiti'], unknown: ['desconocido', 'unknown', 'inconnu', 'sconosciuto'],
    fC: ['País / mercado', 'Country / market', 'Pays / marché', 'Paese / mercato'], fT: ['Tipo de dato', 'Data type', 'Type de donnée', 'Tipo di dato'], fS: ['Fuente', 'Source', 'Source', 'Fonte'], fP: ['Producto', 'Product', 'Produit', 'Prodotto'],
    all: ['Todos', 'All', 'Tous', 'Tutti'], reset: ['Quitar filtros', 'Clear filters', 'Effacer les filtres', 'Rimuovi filtri'], shown: ['de', 'of', 'sur', 'su'],
    ty_PRICE: ['Precios', 'Prices', 'Prix', 'Prezzi'], ty_INPUT: ['Insumos y energía', 'Inputs and energy', 'Intrants et énergie', 'Input ed energia'],
    cProd: ['Producto', 'Product', 'Produit', 'Prodotto'], cMkt: ['Mercado', 'Market', 'Marché', 'Mercato'], cObs: ['Observación', 'Observation', 'Observation', 'Osservazione'], cPub: ['Publicada', 'Published', 'Publiée', 'Pubblicata'], cVal: ['Valor', 'Value', 'Valeur', 'Valore'], cChg: ['Cambio', 'Change', 'Variation', 'Variazione'], cFresh: ['Frescura', 'Freshness', 'Fraîcheur', 'Freschezza'], cSrc: ['Fuente', 'Source', 'Source', 'Fonte'],
    cFrom: ['Desde', 'From', 'De', 'Da'], cDays: ['Días', 'Days', 'Jours', 'Giorni'], cExp: ['Esperada', 'Expected', 'Attendue', 'Attesa'], cFreq: ['Frecuencia', 'Frequency', 'Fréquence', 'Frequenza'], cAge: ['Antigüedad', 'Age', 'Ancienneté', 'Età'],
    retrieved: ['recuperada', 'retrieved', 'récupérée', 'recuperata'], none: ['Ningún resultado con estos filtros.', 'No results with these filters.', 'Aucun résultat avec ces filtres.', 'Nessun risultato con questi filtri.'],
    err: ['No se pudo cargar data/observatory.json.', 'Could not load data/observatory.json.', 'Impossible de charger data/observatory.json.', 'Impossibile caricare data/observatory.json.'],
    freq_daily: ['diaria', 'daily', 'quotidienne', 'giornaliera'], freq_weekly: ['semanal', 'weekly', 'hebdomadaire', 'settimanale'], freq_monthly: ['mensual', 'monthly', 'mensuelle', 'mensile'], freq_quarterly: ['trimestral', 'quarterly', 'trimestrielle', 'trimestrale'], freq_annual: ['anual', 'annual', 'annuelle', 'annuale'],
    fs_LIVE: ['EN DIRECTO', 'LIVE', 'EN DIRECT', 'LIVE'], fs_FRESH: ['AL DÍA', 'FRESH', 'À JOUR', 'AGGIORNATO'], fs_EXPECTED_DELAY: ['RETRASO HABITUAL', 'EXPECTED DELAY', 'RETARD HABITUEL', 'RITARDO ABITUALE'], fs_DELAYED: ['RETRASADO', 'DELAYED', 'EN RETARD', 'IN RITARDO'], fs_STALE: ['DESACTUALIZADO', 'STALE', 'OBSOLÈTE', 'OBSOLETO'], fs_HISTORICAL: ['HISTÓRICA', 'HISTORICAL', 'HISTORIQUE', 'STORICA'], fs_DISCONTINUED: ['DISCONTINUADA', 'DISCONTINUED', 'ARRÊTÉE', 'INTERROTTA'], fs_PENDING: ['PENDIENTE', 'PENDING', 'EN ATTENTE', 'IN SOSPESO'],
    an_UNEXPLAINED_ANOMALY: ['Sin explicar', 'Unexplained', 'Non expliquée', 'Non spiegata'], an_KNOWN_VERIFIED_ANOMALY: ['Verificada', 'Verified', 'Vérifiée', 'Verificata'],
    err404: ['—', '—', '—', '—'], link: ['Ver ficha', 'Open page', 'Voir la fiche', 'Apri scheda']
  };
  function t(k) { var a = TX[k]; if (!a) return k; var v = a[li()]; return v === undefined ? a[0] : v; }
  function tf(k, x) { return t(k).replace('{0}', x); }
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function dstr(iso) { if (!iso) return '—'; var p = String(iso).slice(0, 10).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso; }
  function L(o) { return o ? (o[lang()] || o.en || '') : ''; }
  var SRC = { eu_agrifood: 'Comisión Europea · Agri-food', usda_nass: 'USDA NASS', statcan: 'Statistics Canada', defra: 'DEFRA', eurostat: 'Eurostat', world_bank: 'World Bank', usda_ams_mars: 'USDA AMS', european_commission: 'Comisión Europea · Lácteo', eu_oil_bulletin: 'EU Oil Bulletin', eia: 'EIA', alberta_ag: 'Alberta Agriculture', ecb: 'BCE' };
  function srcName(id) { return SRC[id] || id || '—'; }
  var PAGE = { trigo: 'trigo', maiz: 'maiz', leche: 'leche', vaca: 'vacuno', urea: 'urea', diesel: 'diesel', harina_soja: 'soja', cerdo: 'cerdo', cebada: 'cebada', avena: 'avena', arroz: 'arroz', colza: 'colza', huevos: 'huevos', oliva: 'oliva' };
  var DOC = null, F = { c: '', p: '', s: '', t: '', w: 'd7' };
  function readUrl() { var q = new URLSearchParams(location.search); for (var k in F) F[k] = q.get(k) || (k === 'w' ? 'd7' : ''); if (!/^d(1|7|30)$/.test(F.w)) F.w = 'd7'; }
  function writeUrl() { var q = new URLSearchParams(); for (var k in F) if (F[k] && !(k === 'w' && F[k] === 'd7')) q.set(k, F[k]); var s = q.toString(); try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch (e) {} }
  function lab(p) { return L(DOC.labels[p]) || p; }
  function rg(r) { return DOC.regions[r] ? L(DOC.regions[r]) : r.toUpperCase(); }
  function fsB(st) { return '<span class="pt-badge pt-fs-' + esc(st) + '">' + esc(t('fs_' + st)) + '</span>'; }
  function chg(c) { if (c === null || c === undefined) return '<span class="pt-flat">—</span>'; return '<span class="' + (c > 0 ? 'pt-up' : c < 0 ? 'pt-down' : 'pt-flat') + '">' + (c > 0 ? '+' : '') + nf(c, 2) + ' %</span>'; }
  function ok(o) { return (!F.c || o.region === F.c) && (!F.p || o.product === F.p) && (!F.s || o.sourceId === F.s) && (!F.t || o.type === F.t); }
  function uniq(a) { var m = {}, r = []; a.forEach(function (x) { if (!m[x]) { m[x] = 1; r.push(x); } }); return r; }
  function chip(g, v, label, on) { return '<button type="button" class="pt-chip" aria-pressed="' + (!!on) + '" data-f="' + g + '" data-v="' + esc(v) + '">' + esc(label) + '</button>'; }
  function identOf(o) { var I = window.DIIdentity, e = I && I.data() && o.id ? I.get(o.id) : null; return e ? '<div class="pt-ident">' + esc(I.line(e, lang())) + '</div>' : ''; }
  function prodLink(o) { var pg = PAGE[o.product], n = esc(lab(o.product)); return (pg ? '<a href="producto.html?p=' + pg + '">' + n + '</a>' : n) + identOf(o); }
  function filters() {
    var obs = DOC.observations, regs = uniq(obs.map(function (o) { return o.region; })).sort(), prods = uniq(obs.map(function (o) { return o.product; })).sort(function (a, b) { return lab(a) < lab(b) ? -1 : 1; }), srcs = uniq(obs.map(function (o) { return o.sourceId; })).sort(), tys = uniq(obs.map(function (o) { return o.type; })).sort();
    var h = '<div class="pt-bar-ctl" role="group" aria-label="' + esc(t('fC')) + '"><span class="pt-lbl">' + esc(t('fC')) + '</span>' + chip('c', '', t('all'), !F.c) + regs.map(function (r) { return chip('c', r, rg(r), F.c === r); }).join('') + '</div>';
    h += '<div class="pt-bar-ctl" role="group" aria-label="' + esc(t('fT')) + '"><span class="pt-lbl">' + esc(t('fT')) + '</span>' + chip('t', '', t('all'), !F.t) + tys.map(function (x) { return chip('t', x, t('ty_' + x), F.t === x); }).join('') + '</div>';
    function sel(id, label, list, cur, text) { return '<label class="ob-sel"><span class="pt-lbl">' + esc(label) + '</span><select id="' + id + '" data-f="' + id.slice(3) + '"><option value="">' + esc(t('all')) + '</option>' + list.map(function (x) { return '<option value="' + esc(x) + '"' + (cur === x ? ' selected' : '') + '>' + esc(text(x)) + '</option>'; }).join('') + '</select></label>'; }
    h += '<div class="ob-selrow">' + sel('ob-p', t('fP'), prods, F.p, lab) + sel('ob-s', t('fS'), srcs, F.s, srcName) + '</div>';
    return h;
  }
  function sec(id, title, hint, body) { return '<section class="pt-sec" id="' + id + '" aria-labelledby="' + id + '-h"><div class="di-movers-head-row"><h2 id="' + id + '-h">' + esc(title) + '</h2>' + (hint ? '<span class="di-movers-hint">' + esc(hint) + '</span>' : '') + '</div>' + body + '</section>'; }
  function table(head, rows, cls) { return '<div class="pt-tblwrap"><table class="pt-table rs"><thead><tr>' + head.map(function (h) { return '<th' + (h[1] ? ' class="r"' : '') + '>' + esc(h[0]) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function td(label, html, right) { return '<td' + (right ? ' class="r"' : '') + ' data-l="' + esc(label) + '">' + html + '</td>'; }
  function oVal(o) { return nf(o.value, Math.abs(o.value) >= 100 ? 1 : 2) + ' <span class="pt-sub">' + esc(o.currency === 'INDEX' ? 'índice' : o.currency + '/' + o.unit) + '</span>'; }

  function secNew(obs) {
    var l = obs.filter(function (o) { return o.isNew; }).sort(function (a, b) { return (b.publicationDate || b.snapshotDate || '') < (a.publicationDate || a.snapshotDate || '') ? -1 : 1; });
    if (!l.length) return sec('new', t('newObs'), tf('newHint', DOC.newDays), '<p class="pt-note">' + esc(t('none')) + '</p>');
    var rows = l.slice(0, 40).map(function (o) {
      return '<tr>' + td(t('cProd'), '<strong>' + prodLink(o) + '</strong>') + td(t('cMkt'), esc(rg(o.region))) + td(t('cObs'), esc(dstr(o.observationDate))) +
        td(t('cPub'), esc(dstr(o.publicationDate || o.snapshotDate)) + (o.pubKnown ? '' : ' <span class="pt-sub">(' + esc(t('retrieved')) + ')</span>')) + td(t('cVal'), oVal(o), true) + td(t('cChg'), chg(o.changePct), true) + td(t('cFresh'), fsB(o.freshness)) + td(t('cSrc'), esc(srcName(o.sourceId))) + '</tr>';
    });
    return sec('new', t('newObs') + ' (' + l.length + ')', tf('newHint', DOC.newDays), table([[t('cProd')], [t('cMkt')], [t('cObs')], [t('cPub')], [t('cVal'), 1], [t('cChg'), 1], [t('cFresh')], [t('cSrc')]], rows) + (l.length > 40 ? '<p class="pt-sub">+ ' + (l.length - 40) + '</p>' : ''));
  }
  function secMoves(obs) {
    var w = F.w, l = obs.filter(function (o) { return o.moves[w]; }).sort(function (a, b) { return Math.abs(b.moves[w].pct) - Math.abs(a.moves[w].pct); });
    var ctl = '<div class="pt-bar-ctl" role="group" aria-label="' + esc(t('moves')) + '">' + ['d1', 'd7', 'd30'].map(function (k) { return chip('w', k, t('w_' + k), F.w === k); }).join('') + '</div>';
    if (!l.length) return sec('moves', t('moves'), t('movesHint'), ctl + '<p class="pt-note">' + esc(t('noMoves')) + '</p>');
    var rows = l.slice(0, 12).map(function (o) {
      var m = o.moves[w];
      return '<tr>' + td(t('cProd'), '<strong>' + prodLink(o) + '</strong>') + td(t('cMkt'), esc(rg(o.region))) + td(t('cFrom'), esc(dstr(m.from)) + ' → ' + esc(dstr(m.to))) + td(t('cDays'), m.days, true) + td(t('cChg'), chg(m.pct), true) + td(t('cVal'), oVal(o), true) + td(t('cFresh'), fsB(o.freshness)) + td(t('cSrc'), esc(srcName(o.sourceId))) + '</tr>';
    });
    return sec('moves', t('moves'), t('movesHint'), ctl + table([[t('cProd')], [t('cMkt')], [t('cFrom')], [t('cDays'), 1], [t('cChg'), 1], [t('cVal'), 1], [t('cFresh')], [t('cSrc')]], rows) + '<p class="pt-sub">' + l.length + ' / ' + obs.length + '</p>');
  }
  function secRev() {
    var r = DOC.revisions, b = '<p><strong>' + esc(tf('revCount', r.count)) + '</strong></p><p class="pt-sub">' + esc(r.note) + '</p>';
    if (r.items.length) b += '<ul class="pt-list">' + r.items.slice(0, 20).map(function (x) { return '<li>' + esc(typeof x === 'string' ? x : JSON.stringify(x)) + '</li>'; }).join('') + '</ul>';
    return sec('revisions', t('revisions'), '', b);
  }
  function bars(by, total) {
    var order = ['LIVE', 'FRESH', 'EXPECTED_DELAY', 'DELAYED', 'STALE', 'HISTORICAL', 'DISCONTINUED', 'PENDING'], h = '<div class="pt-bars">';
    order.forEach(function (s) { var n = by[s] || 0; if (!n) return; h += '<div class="pt-row"><span class="n" title="' + esc(t('fs_' + s)) + '">' + fsB(s) + '</span><span class="rl-barwrap"><i style="width:' + Math.max(1, Math.round(n / total * 100)) + '%"></i></span><span>' + n + ' <span class="pt-sub">(' + nf(n / total * 100, 0) + ' %)</span></span></div>'; });
    return h + '</div>';
  }
  function secFresh(obs) {
    var by = {}; obs.forEach(function (o) { by[o.freshness] = (by[o.freshness] || 0) + 1; });
    var cat = DOC.freshness.catalog, cb = F.s && cat.bySource[F.s] ? cat.bySource[F.s] : cat.byState, ct = Object.keys(cb).reduce(function (a, k) { return a + cb[k]; }, 0);
    var h = '<div class="pt-two"><div><h3 class="rl-h">' + esc(t('priceLayerL')) + ' · ' + obs.length + '</h3>' + (obs.length ? bars(by, obs.length) : '<p class="pt-sub">' + esc(t('none')) + '</p>') + '</div><div><h3 class="rl-h">' + esc(F.s && cat.bySource[F.s] ? tf('catalogSrc', srcName(F.s)) : t('catalogL')) + ' · ' + ct + '</h3>' + bars(cb, ct) + '</div></div>';
    var late = obs.filter(function (o) { return o.freshness !== 'LIVE' && o.freshness !== 'FRESH'; });
    h += '<h3 class="rl-h">' + esc(t('notFresh')) + '</h3>';
    if (!late.length) h += '<p class="pt-note">' + esc(t('allFresh')) + '</p>';
    else h += table([[t('cProd')], [t('cMkt')], [t('cObs')], [t('cAge'), 1], [t('cExp')], [t('cFresh')], [t('cSrc')]], late.map(function (o) { return '<tr>' + td(t('cProd'), '<strong>' + prodLink(o) + '</strong>') + td(t('cMkt'), esc(rg(o.region))) + td(t('cObs'), esc(dstr(o.observationDate))) + td(t('cAge'), o.ageDays === null ? '—' : o.ageDays + ' d', true) + td(t('cExp'), esc(dstr(o.expectedNext))) + td(t('cFresh'), fsB(o.freshness)) + td(t('cSrc'), esc(srcName(o.sourceId))) + '</tr>'; }));
    return sec('freshness', t('freshness'), t('freshHint'), h);
  }
  function secUp(obs) {
    var keys = {}; obs.forEach(function (o) { keys[o.k] = o; });
    var l = DOC.upcoming.filter(function (u) { return keys[u.k]; }).slice(0, 15), h = '';
    if (l.length) h += table([[t('cProd')], [t('cMkt')], [t('cExp')], [t('cFreq')], [t('cFresh')], [t('cSrc')]], l.map(function (u) { var o = keys[u.k]; return '<tr>' + td(t('cProd'), '<strong>' + prodLink(o) + '</strong>') + td(t('cMkt'), esc(rg(o.region))) + td(t('cExp'), esc(dstr(u.expectedNext))) + td(t('cFreq'), esc(t('freq_' + u.frequency))) + td(t('cFresh'), fsB(u.freshness)) + td(t('cSrc'), esc(srcName(u.sourceId))) + '</tr>'; }));
    else h += '<p class="pt-note">' + esc(t('none')) + '</p>';
    h += '<h3 class="rl-h">' + esc(t('pipeRuns')) + '</h3><ul class="pt-list">' + DOC.pipelines.next.slice(0, 8).map(function (p) { return '<li>' + esc(p.name) + ' · ' + esc(p.nextRun.replace('T', ' ').replace('Z', ' UTC')) + '</li>'; }).join('') + '</ul>';
    return sec('upcoming', t('upcoming'), t('upHint'), h);
  }
  function secCov() {
    var c = DOC.coverage, h = '<p><strong>' + nf(c.series, 0) + '</strong> ' + esc(t('series')) + ' · <strong>' + c.priceLayer + '</strong> ' + esc(t('priceLayer')) + '</p>';
    if (!c.since) h += '<p class="pt-note">' + esc(t('noSnap')) + '</p>';
    else if (!c.changes.length) h += '<p class="pt-note">' + esc(t('noCovChanges')) + ' (' + esc(t('since')) + ' ' + esc(dstr(c.since)) + ').</p>';
    else h += '<p class="pt-sub">' + esc(t('since')) + ' ' + esc(dstr(c.since)) + '</p><ul class="pt-list">' + c.changes.map(function (x) { var d = x.to - x.from; return '<li>' + esc(x.scope === 'total' ? t('series') : x.key) + ': ' + nf(x.from, 0) + ' → ' + nf(x.to, 0) + ' (<span class="' + (d > 0 ? 'pt-up' : 'pt-down') + '">' + (d > 0 ? '+' : '') + d + '</span>)</li>'; }).join('') + '</ul>';
    return sec('coverage', t('coverage'), t('covHint'), h);
  }
  function secQ() {
    var q = DOC.quality, h = '<div class="pt-cards"><div class="di-card pt-card"><div class="pt-k">' + esc(t('qFiles')) + '</div><div class="pt-v">' + (q.files === null || q.files === undefined ? '—' : q.files) + '</div></div><div class="di-card pt-card"><div class="pt-k">' + esc(t('qErr')) + ' / ' + esc(t('qWarn')) + '</div><div class="pt-v">' + (q.errors === null || q.errors === undefined ? '—' : q.errors) + ' / ' + (q.warnings === null || q.warnings === undefined ? '—' : q.warnings) + '</div></div><div class="di-card pt-card"><div class="pt-k">' + esc(t('qUnexp')) + '</div><div class="pt-v">' + q.unexplained + ' <small>· ' + q.verified + ' ' + esc(t('qVer')) + '</small></div></div></div>';
    if (q.anomalies.length) h += '<ul class="pt-list">' + q.anomalies.map(function (a) { return '<li><span class="pt-badge ' + (a.status === 'UNEXPLAINED_ANOMALY' ? 'pt-fs-DELAYED' : 'pt-fs-LIVE') + '">' + esc(t('an_' + a.status)) + '</span> <strong>' + esc(a.series) + '</strong> — ' + esc(a.detected) + '</li>'; }).join('') + '</ul>';
    return sec('quality', t('quality'), t('qHint'), h);
  }
  function secPipes() {
    var p = DOC.pipelines, s = p.summary, h = '<p>' + ['ok', 'late', 'error', 'not_run', 'unknown'].filter(function (k) { return s[k]; }).map(function (k) { return '<span class="pt-badge ' + (k === 'ok' ? 'pt-fs-LIVE' : k === 'error' ? 'pt-fs-STALE' : 'pt-fs-DELAYED') + '">' + s[k] + ' ' + esc(t(k)) + '</span>'; }).join(' ') + ' <span class="pt-sub">/ ' + p.total + ' · ' + esc(dstr(p.generatedAt)) + '</span></p>';
    if (!p.attention.length) h += '<p class="pt-note">' + esc(t('allOk')) + '</p>';
    else h += '<h3 class="rl-h">' + esc(t('attention')) + '</h3><ul class="pt-list">' + p.attention.map(function (x) { return '<li><span class="pt-badge ' + (x.status === 'error' ? 'pt-fs-STALE' : 'pt-fs-DELAYED') + '">' + esc(t(x.status)) + '</span> ' + (x.url ? '<a href="' + esc(x.url) + '" rel="noopener">' + esc(x.name) + '</a>' : esc(x.name)) + (x.lastAt ? ' <span class="pt-sub">· ' + esc(dstr(x.lastAt)) + '</span>' : '') + '</li>'; }).join('') + '</ul>';
    return sec('pipelines', t('pipelines'), '', h);
  }
  function render() {
    var body = document.getElementById('ob-body'); if (!body) return;
    document.getElementById('ob-h1').textContent = t('title'); document.getElementById('ob-sub').textContent = t('sub'); document.title = 'Dehesa Index — ' + t('title');
    if (!DOC) return;
    var obs = DOC.observations.filter(ok), any = F.c || F.p || F.s || F.t;
    var h = '<p class="pt-sub">' + esc(t('updated')) + ' ' + esc(DOC.generatedAt.replace('T', ' ').replace('Z', ' UTC')) + '</p>';
    h += '<div class="rl-filters">' + filters() + '</div><p class="pt-sub" aria-live="polite">' + obs.length + ' ' + esc(t('shown')) + ' ' + DOC.observations.length + ' ' + esc(t('priceLayer')) + (any ? ' · <button type="button" class="pt-chip" data-reset="1">' + esc(t('reset')) + '</button>' : '') + '</p>';
    h += '<nav class="pt-tabs" aria-label="' + esc(t('title')) + '">' + [['new', 'newObs'], ['moves', 'moves'], ['revisions', 'revisions'], ['freshness', 'freshness'], ['upcoming', 'upcoming'], ['coverage', 'coverage'], ['quality', 'quality'], ['pipelines', 'pipelines']].map(function (x) { return '<a class="pt-chip" href="#' + x[0] + '">' + esc(t(x[1])) + '</a>'; }).join('') + '</nav>';
    h += secNew(obs) + secMoves(obs) + secRev() + secFresh(obs) + secUp(obs) + secCov() + secQ() + secPipes();
    body.innerHTML = h;
    if (location.hash && /^#[a-z]+$/.test(location.hash)) { var el = document.getElementById(location.hash.slice(1)); if (el && el.scrollIntoView) el.scrollIntoView(); }
  }
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('button[data-f],button[data-reset]') : null; if (!b) return;
    if (b.getAttribute('data-reset')) { F = { c: '', p: '', s: '', t: '', w: F.w }; } else F[b.getAttribute('data-f')] = b.getAttribute('data-v');
    writeUrl(); render();
  }
  function onChange(e) { var el = e.target, f = el.getAttribute && el.getAttribute('data-f'); if (f && el.tagName === 'SELECT') { F[f] = el.value; writeUrl(); render(); } }
  var prevCb = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prevCb) prevCb.apply(this, arguments); render(); };
  window.DehesaShared.init('informacion');
  readUrl();
  var body = document.getElementById('ob-body'); body.addEventListener('click', onClick); body.addEventListener('change', onChange);
  render();
  fetch('data/observatory.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { DOC = d; return window.DIIdentity ? window.DIIdentity.ready().catch(function () { return null; }) : null; }).then(function () { render(); })
    .catch(function () { body.innerHTML = '<p class="pt-err">' + esc(t('err')) + '</p>'; });
  window.DIObservatory = { state: function () { return { F: F, doc: DOC }; } };
})();
