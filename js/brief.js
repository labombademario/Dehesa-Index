/* Dehesa Index — Qué ha cambiado hoy: lee data/daily-brief.json (cambios reales de datos) y data/watch-index.json (lista de seguimiento local). ES5. */
(function () {
  'use strict';
  var T = {
    es: { title: 'Qué ha cambiado hoy', sub: 'No son noticias: son cambios reales en los datos de Dehesa durante las últimas 24 horas (comparando con el estado de hace un día), más los avisos de tu lista.',
      my: 'Mis avisos', mysub: 'Reglas locales de tu lista de seguimiento.', fired: 'Se ha cumplido', rev: 'revisado', seen: 'Marcar como visto', pick: 'Buscar una serie para seguir (p. ej. trigo Francia, leche Alemania, urea)', follow: 'Seguir', following: 'Siguiendo', nores: 'Sin resultados', nolist: 'Todavía no sigues nada. Busca una serie arriba o pulsa «Seguir» en un perfil de país.',
      cDs: 'datasets actualizados', cNew: 'series con dato nuevo', cRev: 'revisiones', cStale: 'con retraso', cUp: 'actualizaciones en 24 h', cNewDs: 'datasets nuevos',
      movers: 'Mayores movimientos (nuevo dato, ±2 % o más)', newd: 'Nuevos datos oficiales', ds: 'Datasets que han cambiado', revs: 'Revisiones de las fuentes', stale: 'Pasaron a retraso o error', up: 'Próximas actualizaciones (24 h)', newDs: 'Datasets creados en la ventana',
      none: 'Nada en este apartado.', nobrief: 'El resumen diario aún no está disponible.', gen: 'Generado', win: 'Ventana', prev: 'antes', isNew: 'nuevo', changed: 'series cambiadas', more: 'Ver más', less: 'Ver menos', open: 'Abrir', old: 'antes', hrs: 'h', mo: 'Estado de los datos',
      note: 'Los avisos se calculan en tu navegador con el último índice de series; puede tener hasta ~3 h de retraso respecto al dato publicado.' },
    en: { title: 'What changed today', sub: 'Not news: real changes in Dehesa data over the last 24 hours (compared with the state a day ago), plus the alerts from your watchlist.',
      my: 'My alerts', mysub: 'Local rules from your watchlist.', fired: 'Triggered', rev: 'revised', seen: 'Mark as seen', pick: 'Search a series to follow (e.g. wheat France, milk Germany, urea)', follow: 'Follow', following: 'Following', nores: 'No results', nolist: 'You are not following anything yet. Search a series above or press “Follow” on a country profile.',
      cDs: 'datasets updated', cNew: 'series with new data', cRev: 'revisions', cStale: 'late', cUp: 'updates in 24 h', cNewDs: 'new datasets',
      movers: 'Biggest moves (new data, ±2 % or more)', newd: 'New official data', ds: 'Datasets that changed', revs: 'Source revisions', stale: 'Moved to late or error', up: 'Upcoming updates (24 h)', newDs: 'Datasets created in the window',
      none: 'Nothing in this section.', nobrief: 'The daily brief is not available yet.', gen: 'Generated', win: 'Window', prev: 'before', isNew: 'new', changed: 'series changed', more: 'Show more', less: 'Show less', open: 'Open', old: 'before', hrs: 'h', mo: 'Data status',
      note: 'Alerts are computed in your browser from the latest series index; it can lag the published data by up to ~3 h.' },
    fr: { title: 'Ce qui a changé aujourd’hui', sub: 'Pas des actualités : de vrais changements dans les données de Dehesa sur les dernières 24 heures (par rapport à l’état d’il y a un jour), plus les alertes de votre liste.',
      my: 'Mes alertes', mysub: 'Règles locales de votre liste de suivi.', fired: 'Déclenchée', rev: 'révisé', seen: 'Marquer comme vu', pick: 'Chercher une série à suivre (p. ex. blé France, lait Allemagne, urée)', follow: 'Suivre', following: 'Suivi', nores: 'Aucun résultat', nolist: 'Vous ne suivez encore rien. Cherchez une série ci-dessus ou cliquez sur « Suivre » dans un profil de pays.',
      cDs: 'jeux de données mis à jour', cNew: 'séries avec nouvelle donnée', cRev: 'révisions', cStale: 'en retard', cUp: 'mises à jour en 24 h', cNewDs: 'nouveaux jeux',
      movers: 'Plus fortes variations (nouvelle donnée, ±2 % ou plus)', newd: 'Nouvelles données officielles', ds: 'Jeux de données modifiés', revs: 'Révisions des sources', stale: 'Passés en retard ou erreur', up: 'Prochaines mises à jour (24 h)', newDs: 'Jeux créés dans la fenêtre',
      none: 'Rien dans cette section.', nobrief: 'Le résumé quotidien n’est pas encore disponible.', gen: 'Généré', win: 'Fenêtre', prev: 'avant', isNew: 'nouveau', changed: 'séries modifiées', more: 'Voir plus', less: 'Voir moins', open: 'Ouvrir', old: 'avant', hrs: 'h', mo: 'État des données',
      note: 'Les alertes sont calculées dans votre navigateur avec le dernier index de séries ; il peut avoir jusqu’à ~3 h de retard sur la donnée publiée.' },
    it: { title: 'Cosa è cambiato oggi', sub: 'Non notizie: cambiamenti reali nei dati di Dehesa nelle ultime 24 ore (rispetto allo stato di un giorno fa), più gli avvisi della tua lista.',
      my: 'I miei avvisi', mysub: 'Regole locali della tua lista.', fired: 'Scattato', rev: 'rivisto', seen: 'Segna come visto', pick: 'Cerca una serie da seguire (es. grano Francia, latte Germania, urea)', follow: 'Segui', following: 'Segui già', nores: 'Nessun risultato', nolist: 'Non segui ancora nulla. Cerca una serie qui sopra o premi «Segui» in un profilo paese.',
      cDs: 'dataset aggiornati', cNew: 'serie con nuovo dato', cRev: 'revisioni', cStale: 'in ritardo', cUp: 'aggiornamenti in 24 h', cNewDs: 'nuovi dataset',
      movers: 'Maggiori variazioni (nuovo dato, ±2 % o più)', newd: 'Nuovi dati ufficiali', ds: 'Dataset cambiati', revs: 'Revisioni delle fonti', stale: 'Passati in ritardo o errore', up: 'Prossimi aggiornamenti (24 h)', newDs: 'Dataset creati nella finestra',
      none: 'Niente in questa sezione.', nobrief: 'Il riepilogo giornaliero non è ancora disponibile.', gen: 'Generato', win: 'Finestra', prev: 'prima', isNew: 'nuovo', changed: 'serie cambiate', more: 'Mostra altro', less: 'Mostra meno', open: 'Apri', old: 'prima', hrs: 'h', mo: 'Stato dei dati',
      note: 'Gli avvisi sono calcolati nel tuo browser con l’ultimo indice delle serie; può essere in ritardo fino a ~3 h rispetto al dato pubblicato.' }
  };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tt() { return T[lang()] || T.es; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v) { if (typeof v !== 'number') return esc(v); var d = Math.abs(v) >= 1000 ? 0 : Math.abs(v) >= 100 ? 1 : 2; try { return v.toLocaleString(lang(), { minimumFractionDigits: 0, maximumFractionDigits: d }); } catch (e) { return String(v); } }
  function pc(v) { if (typeof v !== 'number') return ''; var c = v >= 0 ? '#2f6b4a' : '#a33'; return '<span style="color:' + c + ';font-weight:600">' + (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v)) + ' %</span>'; }
  var KL = { PRICE: { es: 'Precios', en: 'Prices', fr: 'Prix', it: 'Prezzi' }, PRODUCTION: { es: 'Producción', en: 'Production', fr: 'Production', it: 'Produzione' }, TRADE: { es: 'Comercio', en: 'Trade', fr: 'Commerce', it: 'Commercio' },
    CROP: { es: 'Cultivos', en: 'Crop progress', fr: 'Cultures', it: 'Colture' }, CLIMATE: { es: 'Clima', en: 'Climate', fr: 'Climat', it: 'Clima' }, INPUT: { es: 'Insumos y energía', en: 'Inputs & energy', fr: 'Intrants et énergie', it: 'Input ed energia' },
    TARIFF: { es: 'Aranceles', en: 'Tariffs', fr: 'Droits de douane', it: 'Dazi' }, MACRO: { es: 'Macro y divisas', en: 'Macro & FX', fr: 'Macro et devises', it: 'Macro e valute' } };
  var CT = {
    es: { t: 'Mercados locales de grano de EE. UU. actualizados', h: 'USDA AMS · variación por mercado, sin mezclar mercados en una cifra única', n: 'nuevo precio USDA', rv: 'USDA revisó', mk: 'mercados', lead: 'mayor movimiento', all: 'Ver precios locales', bid: 'oferta', cm: { corn: 'Maíz', soybeans: 'Soja', wheat: 'Trigo', sorghum: 'Sorgo', barley: 'Cebada', oats: 'Avena' } },
    en: { t: 'US cash markets updated today', h: 'USDA AMS · change per market, never merged into a single figure', n: 'new USDA bid', rv: 'USDA revised', mk: 'markets', lead: 'largest move', all: 'See local prices', bid: 'bid', cm: { corn: 'Corn', soybeans: 'Soybeans', wheat: 'Wheat', sorghum: 'Sorghum', barley: 'Barley', oats: 'Oats' } },
    fr: { t: 'Marchés au comptant américains mis à jour', h: 'USDA AMS · variation par marché, sans fusion en un chiffre unique', n: 'nouveau prix USDA', rv: 'l’USDA a révisé', mk: 'marchés', lead: 'plus forte variation', all: 'Voir les prix locaux', bid: 'offre', cm: { corn: 'Maïs', soybeans: 'Soja', wheat: 'Blé', sorghum: 'Sorgho', barley: 'Orge', oats: 'Avoine' } },
    it: { t: 'Mercati a pronti USA aggiornati', h: 'USDA AMS · variazione per mercato, senza fonderli in un unico dato', n: 'nuovo prezzo USDA', rv: 'USDA ha rivisto', mk: 'mercati', lead: 'maggior variazione', all: 'Vedi prezzi locali', bid: 'offerta', cm: { corn: 'Mais', soybeans: 'Soia', wheat: 'Grano', sorghum: 'Sorgo', barley: 'Orzo', oats: 'Avena' } }
  };
  function cashBids() {
    var C = B && B.cashBids, t = CT[lang()] || CT.es; if (!C || (!C.groups.length && !C.newBids.length && !C.revisions.length)) return '';
    function nm(c) { return t.cm[c] || c; }
    function sg(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1).replace('.', lang() === 'en' ? '.' : ',') + ' %'; }
    function href(s, c) { return 'precios-locales.html?s=' + encodeURIComponent(s) + '&c=' + encodeURIComponent(c); }
    var h = '<div class="di-movers-hint" style="margin:0 0 6px">' + esc(t.h) + (C.asOf ? ' · ' + esc(C.asOf) : '') + '</div>';
    C.revisions.forEach(function (r) { h += '<div style="border-top:1px solid var(--border);padding:6px 0">✏️ <a href="' + esc(href(r.state, r.commodity)) + '" style="color:inherit">' + esc(t.rv) + ' ' + esc(r.state) + ' ' + esc(nm(r.commodity).toLowerCase()) + ' · ' + esc(r.locationName || '') + ' · ' + esc(r.observationDate) + '</a> <span>' + nf(r.oldValue) + ' → <strong>' + nf(r.newValue) + '</strong></span></div>'; });
    C.groups.slice(0, ST.more.cb ? 40 : 8).forEach(function (g) {
      var rng = g.min === g.max ? sg(g.min) : sg(g.min) + ' … ' + sg(g.max);
      h += '<div style="display:flex;gap:10px;align-items:baseline;border-top:1px solid var(--border);padding:6px 0;flex-wrap:wrap"><a href="' + esc(href(g.state, g.commodity)) + '" style="flex:1;min-width:200px;color:inherit;text-decoration:none"><strong>' + esc(g.stateName) + ' · ' + esc(nm(g.commodity).toLowerCase()) + '</strong> <span style="color:var(--text-faint);font-size:12px">' + esc([g.commodityClass, g.grade, g.deliveryPoint].filter(Boolean).join(' · ')) + '</span></a><span>' + esc(rng) + '</span><span style="color:var(--text-faint);font-size:12px">' + g.markets + ' ' + esc(t.mk) + (g.lead ? ' · ' + esc(t.lead) + ': ' + esc(g.lead.market) + ' ' + esc(sg(g.lead.pct)) : '') + '</span></div>';
    });
    var seen = {}; C.newBids.forEach(function (n) { var k = [n.state, n.commodity, n.market, n.commodityClass, n.grade, n.deliveryPoint].join('|'); if (seen[k]) return; seen[k] = 1; h += '<div style="border-top:1px solid var(--border);padding:6px 0">🆕 <a href="' + esc(href(n.state, n.commodity)) + '" style="color:inherit">' + esc(n.stateName) + ' · ' + esc(nm(n.commodity).toLowerCase()) + ' · ' + esc(n.market) + '</a> <span style="color:var(--text-faint);font-size:12px">' + esc(t.n) + '</span></div>'; });
    if (C.groups.length > 8 && !ST.more.cb) h += '<p style="margin:8px 0 0"><button type="button" class="di-link-btn" data-more="cb">' + esc(tt().more) + '</button></p>';
    return sec('cashbids', t.t, h + '<p style="margin:8px 0 0"><a href="precios-locales.html">' + esc(t.all) + ' →</a></p>');
  }
  var KT = { es: { t: 'Por tipo de dato', h: 'datasets con cambios / datasets vigilados · series con dato nuevo' }, en: { t: 'By data type', h: 'datasets changed / datasets tracked · series with new data' }, fr: { t: 'Par type de donnée', h: 'jeux modifiés / jeux suivis · séries avec nouvelle donnée' }, it: { t: 'Per tipo di dato', h: 'dataset cambiati / dataset monitorati · serie con nuovo dato' } };
  function byKind(b) { var l = lang(), k = KT[l] || KT.es; return '<div class="di-movers-hint" style="margin:0 0 8px">' + esc(k.h) + '</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">' + Object.keys(KL).map(function (x) { var v = b[x]; if (!v) return ''; return '<div style="border:1px solid var(--border);border-radius:8px;padding:8px 10px"><div style="font-size:12px;color:var(--text-faint)">' + esc(KL[x][l] || KL[x].es) + '</div><div style="font:700 18px/1.2 \'Source Serif 4\',serif">' + v.changed + ' / ' + v.datasets + '</div><div style="font-size:12px;color:var(--text-faint)">' + v.newPeriods + '</div></div>'; }).join('') + '</div>'; }
  var B = null, IDX = null, ST = { more: {} };
  function link(k) { var p = k.split('/'); if (p[0] === 'CB') return 'precios-locales.html?s=' + encodeURIComponent(p[1]) + '&c=' + encodeURIComponent(p[2]) + '&id=' + encodeURIComponent(p.slice(3).join('/')); if (p[0] === 'P') return 'producto.html?p=' + encodeURIComponent(p[1]); return 'paises.html?c=' + encodeURIComponent(p[0]) + '&s=' + encodeURIComponent(p.slice(1).join('/')); }
  function flag(c) { return window.DIProfile && window.DIProfile.flag ? window.DIProfile.flag(c) : ''; }
  function card(n, l) { return '<div class="di-card" style="padding:12px 14px;text-align:left"><div style="font:700 26px/1.1 \'Source Serif 4\',serif">' + n + '</div><div class="di-movers-hint" style="margin:2px 0 0">' + esc(l) + '</div></div>'; }
  function sec(id, title, inner) { return '<section id="' + id + '" class="di-card" style="padding:14px 18px;margin:0 0 18px"><h2 style="margin:0 0 8px;font-size:17px">' + esc(title) + '</h2>' + inner + '</section>'; }
  function sline(x, t) { var cc = x.k.split('/')[0]; return '<div style="display:flex;gap:10px;align-items:baseline;border-top:1px solid var(--border);padding:7px 0;flex-wrap:wrap"><span aria-hidden="true">' + (cc === 'P' ? '📈' : flag(cc)) + '</span><a href="' + esc(link(x.k)) + '" style="flex:1;min-width:200px;color:inherit;text-decoration:none">' + esc(x.label) + '</a><span style="color:var(--text-faint);font-size:12px">' + esc(x.period) + (x.prevPeriod ? ' · ' + esc(t.prev) + ' ' + esc(x.prevPeriod) : '') + '</span><span style="font-variant-numeric:tabular-nums"><strong>' + nf(x.value) + '</strong> <span style="font-size:12px;color:var(--text-faint)">' + esc(x.unit) + '</span></span> ' + pc(x.changePct) + '</div>'; }
  function list(id, arr, fn, n) { var t = tt(); if (!arr.length) return '<div class="di-movers-hint">' + esc(t.none) + '</div>'; var open = ST.more[id], shown = open ? arr : arr.slice(0, n); return shown.map(fn).join('') + (arr.length > n ? '<button type="button" data-more="' + id + '" style="margin-top:8px;font:inherit;padding:3px 12px;border:1px solid var(--border);border-radius:999px;background:transparent;color:inherit;cursor:pointer">' + esc(open ? t.less : t.more + ' (' + (arr.length - n) + ')') + '</button>' : ''); }
  function when(iso) { try { return new Date(iso).toLocaleString(lang(), { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return iso; } }
  function mine(t) {
    var W = window.DIWatch, l = W.list(), h = '', ev = W.evaluate(IDX), fired = {}; ev.forEach(function (e) { fired[W.key(e.c, e.s)] = e; });
    h += '<div class="di-movers-hint" style="margin:0 0 8px">' + esc(t.mysub) + '</div>';
    h += '<div style="position:relative;margin-bottom:10px"><input id="br-q" type="search" autocomplete="off" placeholder="' + esc(t.pick) + '" aria-label="' + esc(t.pick) + '" style="width:100%;box-sizing:border-box;font:inherit;padding:8px 12px;border:1px solid var(--border);border-radius:10px;background:var(--surface,#fff);color:inherit"><div id="br-res" style="margin-top:4px"></div></div>';
    if (!l.length) h += '<div class="di-movers-hint">' + esc(t.nolist) + '</div>';
    l.forEach(function (it) {
      var k = W.key(it.c, it.s), x = IDX[k], e = fired[k]; if (!x) return;
      h += '<div style="border-top:1px solid var(--border);padding:10px 0' + (e ? ';background:rgba(47,107,58,.07);margin:0 -10px;padding-left:10px;padding-right:10px' : '') + '"><div style="display:flex;gap:10px;align-items:baseline;flex-wrap:wrap"><span aria-hidden="true">' + (it.c === 'P' ? '📈' : it.c === 'CB' ? '🌾' : flag(it.c)) + '</span><a href="' + esc(link(k)) + '" style="flex:1;min-width:180px;color:inherit;text-decoration:none;font-weight:600">' + esc(x[0]) + '</a><span style="font-size:12px;color:var(--text-faint)">' + esc(x[4]) + '</span><strong>' + nf(x[5]) + '</strong> <span style="font-size:12px;color:var(--text-faint)">' + esc(x[1]) + '</span> ' + pc(x[6]) + '</div>';
      if (e) h += '<div style="margin:6px 0;font-size:13px">🔔 <strong>' + esc(t.fired) + (e.revised ? ' · ' + esc(t.rev) : '') + ':</strong> ' + e.hits.map(function (r) { return esc(W.ruleText(r, lang())); }).join(' · ') + (e.prev ? ' <span style="color:var(--text-faint)">(' + esc(t.old) + ': ' + esc(e.prev.p) + ' → ' + nf(e.prev.v) + ')</span>' : '') + ' <button type="button" data-ack="' + esc(it.c) + '|' + esc(it.s) + '" style="font:inherit;padding:2px 10px;border:1px solid var(--border);border-radius:999px;background:transparent;color:inherit;cursor:pointer;margin-left:6px">' + esc(t.seen) + '</button></div>';
      h += '<div style="margin-top:6px">' + W.editor(it.c, it.s, lang()) + '</div></div>';
    });
    return h;
  }
  function render() {
    var root = document.getElementById('brief-body'); if (!root) return; var t = tt();
    var hd = document.getElementById('br-h1'), sb = document.getElementById('br-sub'); if (hd) hd.textContent = t.title; if (sb) sb.textContent = t.sub; document.title = 'Dehesa Index — ' + t.title;
    var h = '';
    if (window.DIWatch && IDX) h += sec('watch', '🔔 ' + t.my, mine(t));
    if (!B) { root.innerHTML = h + '<p class="di-movers-hint">' + esc(t.nobrief) + '</p>'; bind(root); return; }
    var c = B.counts;
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:0 0 18px">' + card(c.datasetsUpdated, t.cDs) + card(c.newPeriods, t.cNew) + card(c.revisions, t.cRev) + card(c.stale, t.cStale) + card(c.upcoming, t.cUp) + (c.newDatasets ? card(c.newDatasets, t.cNewDs) : '') + '</div>';
    if (B.byKind) h += sec('bykind', (KT[lang()] || KT.es).t, byKind(B.byKind));
    h += cashBids();
    h += sec('movers', t.movers, list('movers', B.movers || [], function (x) { return sline(x, t); }, 12));
    h += sec('newd', t.newd, list('newd', B.newData || [], function (x) { return sline(x, t); }, 15));
    h += sec('ds', t.ds, list('ds', B.datasets || [], function (d) { return '<div style="display:flex;gap:10px;border-top:1px solid var(--border);padding:6px 0"><span style="flex:1">' + esc(d.name) + ' <span style="color:var(--text-faint);font-size:12px">' + esc(d.file.replace('data/', '')) + '</span></span><strong>' + d.changed + '</strong> <span style="font-size:12px;color:var(--text-faint)">' + esc(t.changed) + '</span></div>'; }, 10));
    h += sec('revs', t.revs, list('revs', B.revisions || [], function (r) { var p = r.series.split('/'); return '<div style="display:flex;gap:10px;border-top:1px solid var(--border);padding:6px 0;flex-wrap:wrap"><a href="' + esc(link(r.series)) + '" style="flex:1;color:inherit;text-decoration:none">' + esc((IDX && IDX[r.series] ? IDX[r.series][0] : r.series)) + ' · ' + esc(r.period) + '</a><span>' + nf(r.old) + ' → <strong>' + nf(r.new) + '</strong></span> ' + pc(r.pct) + '</div>'; }, 8));
    h += sec('stale', t.stale, list('stale', B.stale || [], function (s) { return '<div style="border-top:1px solid var(--border);padding:6px 0">⚠️ ' + esc(s.name) + ' <span style="color:var(--text-faint);font-size:12px">(' + esc(s.status) + ')</span>' + (s.isNew ? ' <strong style="color:#a33">· ' + esc(t.isNew) + '</strong>' : '') + ' · <a href="status.html" style="color:inherit">' + esc(t.mo) + '</a></div>'; }, 10));
    h += sec('up', t.up, list('up', B.upcoming || [], function (u) { return '<div style="display:flex;gap:10px;border-top:1px solid var(--border);padding:6px 0"><span style="min-width:120px;color:var(--text-faint);font-size:12.5px">' + esc(when(u.nextRun)) + '</span><span>' + esc(u.name) + '</span></div>'; }, 10));
    if (B.newDatasets && B.newDatasets.length) h += sec('nds', t.newDs, list('nds', B.newDatasets, function (d) { return '<div style="border-top:1px solid var(--border);padding:6px 0">' + esc(d.name) + ' <span style="color:var(--text-faint);font-size:12px">' + esc(d.file.replace('data/', '')) + ' · ' + d.series + ' ' + esc(t.changed.split(' ')[0]) + '</span></div>'; }, 6));
    h += '<p class="di-movers-hint">' + esc(t.gen) + ': ' + esc(when(B.generatedAt)) + ' · ' + esc(t.win) + ': ' + B.windowHours + ' ' + esc(t.hrs) + '. ' + esc(t.note) + '</p>';
    root.innerHTML = h; bind(root);
  }
  function bind(root) {
    var W = window.DIWatch, t = tt();
    Array.prototype.forEach.call(root.querySelectorAll('[data-more]'), function (b) { b.addEventListener('click', function () { var k = b.getAttribute('data-more'); ST.more[k] = !ST.more[k]; render(); }); });
    Array.prototype.forEach.call(root.querySelectorAll('[data-ack]'), function (b) { b.addEventListener('click', function () { var p = b.getAttribute('data-ack').split('|'); W.ack(p[0], p.slice(1).join('|')); render(); }); });
    if (W) W.bindEditor(root, render);
    var q = document.getElementById('br-q'), res = document.getElementById('br-res');
    if (q && res) q.addEventListener('input', function () {
      var v = q.value.toLowerCase().trim().split(/\s+/).filter(Boolean); if (!v.length) { res.innerHTML = ''; return; }
      var out = [], ks = Object.keys(IDX), i;
      for (i = 0; i < ks.length && out.length < 8; i++) { var k = ks[i], hay = (k.split('/')[0] + ' ' + IDX[k][0] + ' ' + (k.indexOf('P/') === 0 ? k : '')).toLowerCase(); if (v.every(function (w) { return hay.indexOf(w) > -1; })) out.push(k); }
      res.innerHTML = out.length ? out.map(function (k) { var p = k.split('/'), c = p[0] === 'P' ? 'P' : p[0], s = p[0] === 'P' ? p.slice(1).join('/') : p.slice(1).join('/'); return '<div style="display:flex;gap:8px;align-items:center;padding:3px 0"><span aria-hidden="true">' + (c === 'P' ? '📈' : flag(c)) + '</span><span style="flex:1;font-size:13px">' + esc(IDX[k][0]) + '</span><button type="button" data-fol="' + esc(c) + '|' + esc(s) + '" style="font:inherit;font-size:12px;padding:2px 10px;border:1px solid var(--border);border-radius:999px;background:transparent;color:inherit;cursor:pointer">' + esc(W.has(c, s) ? t.following : t.follow) + '</button></div>'; }).join('') : '<div class="di-movers-hint">' + esc(t.nores) + '</div>';
      Array.prototype.forEach.call(res.querySelectorAll('[data-fol]'), function (b) { b.addEventListener('click', function () { var p = b.getAttribute('data-fol').split('|'); if (!W.has(p[0], p.slice(1).join('|'))) W.toggle(p[0], p.slice(1).join('|')); W.ack(p[0], p.slice(1).join('|')); render(); }); });
    });
  }
  window.DehesaShared.init('informacion');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  render();
  Promise.all([fetch('data/daily-brief.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), window.DIWatch ? window.DIWatch.loadIndex() : Promise.resolve(null)]).then(function (a) { B = a[0]; IDX = a[1] || {}; render(); if (location.hash === '#watch') { var e = document.getElementById('watch'); if (e && e.scrollIntoView) e.scrollIntoView(); } });
})();
