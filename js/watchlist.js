/* Dehesa Index — Lista de seguimiento local (localStorage, sin cuenta ni servidor). ES5.
   DIWatch.list() -> [{c:'ES', s:'es-perc-aceite'}]; has/toggle/remove. Todo en try/catch: sin almacenamiento la página sigue funcionando. */
(function () {
  'use strict';
  var KEY = 'di-watchlist-v1', MEM = [];
  function read() { try { var v = JSON.parse(window.localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return MEM.slice(); } }
  function write(l) { MEM = l.slice(); try { window.localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} }
  function idx(l, c, s) { for (var i = 0; i < l.length; i++) if (l[i].c === c && l[i].s === s) return i; return -1; }
  window.DIWatch = {
    list: read,
    has: function (c, s) { return idx(read(), c, s) > -1; },
    toggle: function (c, s) { var l = read(), i = idx(l, c, s); if (i > -1) l.splice(i, 1); else l.unshift({ c: c, s: s }); write(l.slice(0, 60)); return i === -1; },
    remove: function (c, s) { var l = read(), i = idx(l, c, s); if (i > -1) { l.splice(i, 1); write(l); } },
    labels: { es: { follow: '☆ Seguir', following: '★ Siguiendo', title: 'Mi lista de seguimiento', hint: 'Series que sigues en este navegador. Se guardan solo aquí (sin cuenta); si borras los datos del navegador se pierden.', empty: 'Aún no sigues ninguna serie. Abre un perfil de país y pulsa “☆ Seguir” en el gráfico.', remove: 'Quitar', open: 'Abrir' },
      en: { follow: '☆ Follow', following: '★ Following', title: 'My watchlist', hint: 'Series you follow in this browser. Stored only here (no account); clearing browser data removes them.', empty: 'You are not following any series yet. Open a country profile and press “☆ Follow” on the chart.', remove: 'Remove', open: 'Open' },
      fr: { follow: '☆ Suivre', following: '★ Suivi', title: 'Ma liste de suivi', hint: 'Séries suivies dans ce navigateur. Stockées uniquement ici (sans compte) ; effacer les données du navigateur les supprime.', empty: 'Vous ne suivez encore aucune série. Ouvrez un profil de pays et cliquez sur « ☆ Suivre » sur le graphique.', remove: 'Retirer', open: 'Ouvrir' },
      it: { follow: '☆ Segui', following: '★ Segui già', title: 'La mia lista', hint: 'Serie seguite in questo browser. Salvate solo qui (senza account); cancellando i dati del browser si perdono.', empty: 'Non segui ancora nessuna serie. Apri un profilo paese e premi “☆ Segui” sul grafico.', remove: 'Rimuovi', open: 'Apri' } }
  };
})();

/* ---------- Smart Watchlist 2.0: reglas de aviso combinables y locales (sin cuenta ni servidor) ----------
   Elemento: {c, s, r:[reglas], m:'any'|'all', seen:{p,v}, ack:periodo, ak:{f,tw}, hist:[{at,p,v,h:[reglas]}]}. Series de pais: c='ES', s=id. Productos: c='P', s='trigo/eu'.
   Reglas: {t:'cross',v,d:'above'|'below'} precio | {t:'pct',v,d?:'up'|'down'} cambio ±% del ultimo dato | {t:'new'} dato nuevo | {t:'rev'} revision oficial (mismo periodo, otro valor)
           | {t:'fresh',v:'DELAYED'|'STALE'} la frescura llega a ese estado | {t:'tw'} Transmission Watch elevado (relacion OBSERVED_RELATIONSHIP con un movimiento del insumo >= 10 %; descriptivo, no una prediccion).
   m='any' (por defecto): avisa si se cumple alguna regla; m='all': solo si se cumplen todas. Todo se evalua en el navegador contra data/watch-index.json (+ observatory.json y relationships.json solo si hay
   reglas de frescura o Transmission Watch). Exportar/importar JSON validado; nada se envia. */
(function () {
  'use strict';
  var KEY = 'di-watchlist-v1', META = 'di-watchlist-meta-v1', W = window.DIWatch; if (!W) return;
  var MAXITEMS = 60, MAXRULES = 12, MAXHIST = 20, TW_PCT = 10, RANK = { LIVE: 0, FRESH: 1, EXPECTED_DELAY: 2, DELAYED: 3, STALE: 4 };
  function read() { try { var v = JSON.parse(window.localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function write(l) { try { window.localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} }
  function find(l, c, s) { for (var i = 0; i < l.length; i++) if (l[i].c === c && l[i].s === s) return l[i]; return null; }
  function key(c, s) { return c === 'P' ? 'P/' + s : c + '/' + s; }
  function sp(f) { return window.DehesaShared && window.DehesaShared.sitePath ? window.DehesaShared.sitePath(f) : f; }
  var IDX = null, IP = null, CP = null;
  function load() { if (IP) return IP; IP = fetch(sp('data/watch-index.json')).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { IDX = d && d.series ? d.series : {}; return IDX; }).catch(function () { IDX = {}; return IDX; }); return IP; }
  function row(idx, c, s) { var a = idx[key(c, s)]; return a ? { label: a[0], unit: a[1], freq: a[2], group: a[3], period: a[4], value: a[5], change: a[6] } : null; }
  function cond(r, v) { return r.d === 'below' ? v <= r.v : v >= r.v; }
  function today() { return new Date().toISOString().slice(0, 10); }
  W.key = key; W.loadIndex = load; W.TW_PCT = TW_PCT;
  W.rules = function (c, s) { var it = find(read(), c, s); return it && it.r ? it.r : []; };
  W.mode = function (c, s) { var it = find(read(), c, s); return it && it.m === 'all' ? 'all' : 'any'; };
  W.setMode = function (c, s, m) { var l = read(), it = find(l, c, s); if (it) { if (m === 'all') it.m = 'all'; else delete it.m; write(l); } };
  W.addRule = function (c, s, rule) {
    var l = read(), it = find(l, c, s); if (!it) { it = { c: c, s: s }; l.unshift(it); }
    it.r = it.r || []; if (it.r.length >= MAXRULES) return Promise.resolve(it.r); it.r.push(rule);
    return load().then(function (idx) { var x = idx && row(idx, c, s); if (x) { it.seen = { p: x.period, v: x.value }; it.ack = x.period; } write(l.slice(0, MAXITEMS)); return it.r; });
  };
  W.delRule = function (c, s, i) { var l = read(), it = find(l, c, s); if (it && it.r) { it.r.splice(i, 1); write(l); } };
  W.ack = function (c, s) { var l = read(), it = find(l, c, s); if (!it) return; var x = IDX && row(IDX, c, s); if (x) { it.seen = { p: x.period, v: x.value }; it.ack = x.period; write(l); } };
  W.ackAll = function () { read().forEach(function (it) { W.ack(it.c, it.s); }); };
  // marca un aviso como visto y lo guarda en el historial local (ev = elemento devuelto por evaluate)
  W.markSeen = function (ev) {
    var l = read(), it = find(l, ev.c, ev.s); if (!it) return;
    it.seen = { p: ev.period, v: ev.value }; it.ack = ev.period; it.ak = it.ak || {}; if (ev.tokens) { if (ev.tokens.f) it.ak.f = ev.tokens.f; if (ev.tokens.tw) it.ak.tw = ev.tokens.tw; }
    it.hist = it.hist || []; it.hist.unshift({ at: new Date().toISOString(), p: ev.period, v: ev.value, h: ev.hits.slice(0, MAXRULES) }); it.hist = it.hist.slice(0, MAXHIST); write(l);
  };
  W.clearHist = function () { var l = read(); l.forEach(function (it) { delete it.hist; }); write(l); };
  W.meta = function () { try { var m = JSON.parse(window.localStorage.getItem(META) || 'null'); return m && typeof m === 'object' ? m : null; } catch (e) { return null; } };
  function stamp(n) { try { window.localStorage.setItem(META, JSON.stringify({ lastEval: new Date().toISOString(), active: n })); } catch (e) {} }

  /* ---- contexto opcional (frescura y Transmission Watch) ---- */
  function needs(l) { var n = { fresh: false, tw: false }; l.forEach(function (it) { (it.r || []).forEach(function (r) { if (r.t === 'fresh') n.fresh = true; else if (r.t === 'tw') n.tw = true; }); }); return n; }
  W.context = function (force) {
    var n = needs(read()); if (force && force.fresh) n.fresh = true; if (force && force.tw) n.tw = true; if (!n.fresh && !n.tw) return Promise.resolve({});
    if (CP) return CP;
    var ps = [];
    ps.push(n.fresh && window.DIFreshness && window.DIFreshness.ready ? window.DIFreshness.ready().catch(function () { return null; }) : Promise.resolve(null));
    ps.push(n.fresh ? fetch(sp('data/observatory.json')).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }) : Promise.resolve(null));
    ps.push(n.tw ? fetch(sp('data/relationships.json')).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }) : Promise.resolve(null));
    CP = Promise.all(ps).then(function (a) { var obs = {}; if (a[1]) a[1].observations.forEach(function (o) { obs[o.k] = o; }); return { fr: !!a[0], obs: obs, rel: a[2], loaded: { fresh: n.fresh, tw: n.tw } }; });
    return CP;
  };
  W.resetContext = function () { CP = null; };
  // estado de frescura de una serie: productos -> el calculado con la fuente real (observatory.json); series de pais -> el motor con el retraso por defecto (aproximado)
  W.freshOf = function (c, s, x, ctx) {
    var k = key(c, s); if (ctx && ctx.obs && ctx.obs[k]) return { state: ctx.obs[k].freshness, approx: false };
    if (ctx && ctx.fr && window.DIFreshness && x && x.period) { try { var e = window.DIFreshness.evaluate(x.period, x.freq, null, Date.now()); return { state: e.state, approx: true }; } catch (e2) { return null; } }
    return null;
  };
  // Transmission Watch elevado: relaciones OBSERVED_RELATIONSHIP de relationships.json donde la serie es insumo (o mercado) y el insumo se ha movido >= 10 % en su ultimo periodo
  W.twFor = function (c, s, ctx) {
    if (c !== 'P' || !ctx || !ctx.rel) return [];
    var k = key(c, s), out = [];
    ctx.rel.relationships.forEach(function (r) {
      if (r.status !== 'OBSERVED_RELATIONSHIP') return;
      var mv = r.last && r.last.input, ch = mv && mv.changePct;
      if (typeof ch !== 'number' || Math.abs(ch) < TW_PCT) return;
      if (r.input.key === k) out.push({ id: r.id, role: 'input', changePct: ch, other: r.market.key });
      else if (r.market.key === k) out.push({ id: r.id, role: 'market', changePct: ch, other: r.input.key });
    });
    return out;
  };
  // evalua todas las reglas: [{c,s,label,unit,period,value,change,prev,revised,mode,hits:[reglas],tokens:{f,tw},state,tw:[...]}]
  W.evaluate = function (idx, ctx) {
    var out = [];
    read().forEach(function (it) {
      if (!it.r || !it.r.length) return; var x = row(idx, it.c, it.s); if (!x) return;
      var seen = it.seen, ak = it.ak || {}, dataGate = !(x.period === it.ack && (!seen || seen.v === x.value)), revised = !!(seen && seen.p === x.period && seen.v !== x.value), hits = [], tokens = {}, fo = null, tw = null;
      it.r.forEach(function (r) {
        var hit = false;
        if (r.t === 'new') hit = dataGate && !!seen && x.period !== seen.p;
        else if (r.t === 'pct') hit = dataGate && typeof x.change === 'number' && Math.abs(x.change) >= r.v && (!r.d || (r.d === 'up' ? x.change > 0 : x.change < 0)) && (!seen || x.period !== seen.p);
        else if (r.t === 'cross') hit = dataGate && typeof x.value === 'number' && cond(r, x.value) && !(seen && typeof seen.v === 'number' && cond(r, seen.v));
        else if (r.t === 'rev') hit = dataGate && revised;
        else if (r.t === 'fresh') { fo = fo || W.freshOf(it.c, it.s, x, ctx); if (fo && RANK[fo.state] >= RANK[r.v]) { var tk = x.period + '|' + fo.state; if (tk !== ak.f) { hit = true; tokens.f = tk; } } }
        else if (r.t === 'tw') { tw = tw || W.twFor(it.c, it.s, ctx); if (tw.length) { var tt = x.period + '|' + tw.map(function (z) { return z.id; }).join(','); if (tt !== ak.tw) { hit = true; tokens.tw = tt; } } }
        if (hit) hits.push(r);
      });
      var fire = it.m === 'all' ? hits.length === it.r.length : hits.length > 0;
      if (fire) out.push({ revised: revised, c: it.c, s: it.s, label: x.label, unit: x.unit, period: x.period, value: x.value, change: x.change, prev: seen, mode: it.m === 'all' ? 'all' : 'any', hits: hits, tokens: tokens, state: fo, tw: tw || [] });
    });
    stamp(out.length); return out;
  };

  /* ---- exportar / importar (validacion estricta; nada se ejecuta ni se envia) ---- */
  var T = { cross: 1, pct: 1, 'new': 1, rev: 1, fresh: 1, tw: 1 };
  function num(v, lo, hi) { return typeof v === 'number' && isFinite(v) && v >= lo && v <= hi; }
  W.cleanRule = function (r) {
    if (!r || typeof r !== 'object' || !T[r.t]) return null;
    if (r.t === 'cross') return num(r.v, -1e9, 1e9) && (r.d === 'above' || r.d === 'below') ? { t: 'cross', v: r.v, d: r.d } : null;
    if (r.t === 'pct') { if (!num(r.v, 0.01, 1000)) return null; var o = { t: 'pct', v: r.v }; if (r.d === 'up' || r.d === 'down') o.d = r.d; return o; }
    if (r.t === 'fresh') return r.v === 'DELAYED' || r.v === 'STALE' ? { t: 'fresh', v: r.v } : null;
    return { t: r.t };
  };
  W.cleanItem = function (x) {
    if (!x || typeof x !== 'object') return null;
    if (typeof x.c !== 'string' || !/^([A-Z]{2,3}|P)$/.test(x.c) || typeof x.s !== 'string' || !x.s || x.s.length > 120 || /[<>"\u0000-\u001f]/.test(x.s)) return null;
    var it = { c: x.c, s: x.s }, rs = [];
    (Array.isArray(x.r) ? x.r : []).slice(0, MAXRULES).forEach(function (r) { var c = W.cleanRule(r); if (c) rs.push(c); });
    if (rs.length) it.r = rs; if (x.m === 'all') it.m = 'all';
    if (x.seen && typeof x.seen === 'object' && typeof x.seen.p === 'string' && x.seen.p.length <= 12 && (x.seen.v === null || typeof x.seen.v === 'number')) { it.seen = { p: x.seen.p, v: x.seen.v }; if (typeof x.ack === 'string' && x.ack.length <= 12) it.ack = x.ack; }
    if (Array.isArray(x.hist)) { var h = []; x.hist.slice(0, MAXHIST).forEach(function (e) { if (e && typeof e.at === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(e.at) && typeof e.p === 'string' && e.p.length <= 12 && Array.isArray(e.h)) { var hs = []; e.h.forEach(function (r) { var c = W.cleanRule(r); if (c) hs.push(c); }); h.push({ at: e.at.slice(0, 24), p: e.p, v: typeof e.v === 'number' ? e.v : null, h: hs }); } }); if (h.length) it.hist = h; }
    return it;
  };
  W.exportAll = function () { return { app: 'dehesa-index', kind: 'watchlist', version: 2, exportedAt: new Date().toISOString(), items: read().map(function (it) { return W.cleanItem(it) || null; }).filter(Boolean) }; };
  // mode: 'merge' (por defecto) o 'replace'. Devuelve {ok, added, updated, skipped, errors[]}; con errores fatales no toca nada.
  W.importAll = function (doc, mode) {
    var res = { ok: false, added: 0, updated: 0, skipped: 0, errors: [] };
    if (!doc || typeof doc !== 'object' || doc.app !== 'dehesa-index' || doc.kind !== 'watchlist') { res.errors.push('format'); return res; }
    if (doc.version !== 1 && doc.version !== 2) { res.errors.push('version'); return res; }
    if (!Array.isArray(doc.items)) { res.errors.push('items'); return res; }
    if (doc.items.length > 500) { res.errors.push('too_many'); return res; }
    var cur = mode === 'replace' ? [] : read(), seen = {};
    doc.items.forEach(function (raw) {
      var it = W.cleanItem(raw); if (!it) { res.skipped++; return; }
      var k = key(it.c, it.s); if (seen[k]) { res.skipped++; return; } seen[k] = 1;
      var ex = find(cur, it.c, it.s);
      if (ex) { for (var f in it) ex[f] = it[f]; res.updated++; } else { if (cur.length >= MAXITEMS) { res.skipped++; return; } cur.push(it); res.added++; }
    });
    write(cur); res.ok = true; return res;
  };

  var L = {
    es: { rules: 'Avisos', add: 'Añadir aviso', pct: 'Cambio de ±', pctU: '% en el último dato', neu: 'Nuevo dato', cross: 'Cruza', above: 'sube de', below: 'baja de', none: 'Sin avisos. Se evalúan en este navegador cada vez que abres Dehesa.', del: 'Quitar', ok: 'Visto', fired: 'Aviso', newd: 'nuevo dato', val: 'valor', chg: 'variación', pill: 'avisos de tu lista', hint: 'Local: sin cuenta. El aviso aparece cuando abres la web; no se envía nada.',
      rev: 'Revisión oficial', fresh: 'Frescura:', tw: 'Transmission Watch elevado', up: 'solo subidas', down: 'solo bajadas', any: 'Cualquier regla', all: 'Todas las reglas', mode: 'Avisar cuando se cumpla', priceAbove: 'Precio sube de', priceBelow: 'Precio baja de', changeAny: 'Cambio de ±%', changeUp: 'Subida ≥ %', changeDown: 'Bajada ≥ %', fDelayed: 'Retrasado', fStale: 'Desactualizado', twHint: 'Relación observada con un insumo que se ha movido ≥ 10 %; descriptivo, no es una predicción.' },
    en: { rules: 'Alerts', add: 'Add alert', pct: 'Change of ±', pctU: '% in the latest data', neu: 'New data', cross: 'Crosses', above: 'rises above', below: 'falls below', none: 'No alerts. They are checked in this browser whenever you open Dehesa.', del: 'Remove', ok: 'Seen', fired: 'Alert', newd: 'new data', val: 'value', chg: 'change', pill: 'alerts from your list', hint: 'Local only: no account. The alert shows when you open the site; nothing is sent.',
      rev: 'Official revision', fresh: 'Freshness:', tw: 'Transmission Watch elevated', up: 'rises only', down: 'falls only', any: 'Any rule', all: 'All rules', mode: 'Alert when', priceAbove: 'Price rises above', priceBelow: 'Price falls below', changeAny: 'Change of ±%', changeUp: 'Rise ≥ %', changeDown: 'Fall ≥ %', fDelayed: 'Delayed', fStale: 'Stale', twHint: 'Observed relationship with an input that moved ≥ 10 %; descriptive, not a forecast.' },
    fr: { rules: 'Alertes', add: 'Ajouter une alerte', pct: 'Variation de ±', pctU: '% sur la dernière donnée', neu: 'Nouvelle donnée', cross: 'Franchit', above: 'dépasse', below: 'passe sous', none: 'Aucune alerte. Elles sont évaluées dans ce navigateur à chaque visite.', del: 'Retirer', ok: 'Vu', fired: 'Alerte', newd: 'nouvelle donnée', val: 'valeur', chg: 'variation', pill: 'alertes de votre liste', hint: 'Local, sans compte. L’alerte s’affiche à l’ouverture du site ; rien n’est envoyé.',
      rev: 'Révision officielle', fresh: 'Fraîcheur :', tw: 'Transmission Watch élevé', up: 'hausses seulement', down: 'baisses seulement', any: 'Une règle', all: 'Toutes les règles', mode: 'Alerter quand', priceAbove: 'Le prix dépasse', priceBelow: 'Le prix passe sous', changeAny: 'Variation de ±%', changeUp: 'Hausse ≥ %', changeDown: 'Baisse ≥ %', fDelayed: 'En retard', fStale: 'Obsolète', twHint: 'Relation observée avec un intrant qui a bougé de ≥ 10 % ; descriptif, pas une prévision.' },
    it: { rules: 'Avvisi', add: 'Aggiungi avviso', pct: 'Variazione di ±', pctU: '% nell’ultimo dato', neu: 'Nuovo dato', cross: 'Supera', above: 'sale sopra', below: 'scende sotto', none: 'Nessun avviso. Vengono valutati in questo browser a ogni visita.', del: 'Rimuovi', ok: 'Visto', fired: 'Avviso', newd: 'nuovo dato', val: 'valore', chg: 'variazione', pill: 'avvisi dalla tua lista', hint: 'Solo locale, senza account. L’avviso appare quando apri il sito; non viene inviato nulla.',
      rev: 'Revisione ufficiale', fresh: 'Freschezza:', tw: 'Transmission Watch elevato', up: 'solo rialzi', down: 'solo ribassi', any: 'Una regola qualsiasi', all: 'Tutte le regole', mode: 'Avvisa quando', priceAbove: 'Il prezzo sale sopra', priceBelow: 'Il prezzo scende sotto', changeAny: 'Variazione di ±%', changeUp: 'Rialzo ≥ %', changeDown: 'Ribasso ≥ %', fDelayed: 'In ritardo', fStale: 'Obsoleto', twHint: 'Relazione osservata con un input che si è mosso ≥ 10 %; descrittivo, non una previsione.' }
  };
  W.rl = L;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function ruleText(r, t) {
    if (r.t === 'pct') return t.pct + r.v + t.pctU + (r.d ? ' (' + t[r.d] + ')' : '');
    if (r.t === 'new') return t.neu; if (r.t === 'rev') return t.rev;
    if (r.t === 'fresh') return t.fresh + ' ' + (r.v === 'STALE' ? t.fStale : t.fDelayed); if (r.t === 'tw') return t.tw;
    return t.cross + ' ' + (r.d === 'below' ? t.below : t.above) + ' ' + r.v;
  }
  W.ruleText = function (r, lang) { return ruleText(r, L[lang] || L.es); };
  var BASIC = ['above', 'below', 'pct', 'new'], FULL = ['above', 'below', 'pct', 'pctUp', 'pctDown', 'new', 'rev', 'fDELAYED', 'fSTALE', 'tw'];
  function optLabel(o, t) { return { above: t.priceAbove, below: t.priceBelow, pct: t.changeAny, pctUp: t.changeUp, pctDown: t.changeDown, 'new': t.neu, rev: t.rev, fDELAYED: t.fresh + ' ' + t.fDelayed, fSTALE: t.fresh + ' ' + t.fStale, tw: t.tw }[o]; }
  // editor HTML (lista de reglas + formulario). opts.full => todos los tipos y selector de modo. Se conecta con W.bindEditor(contenedor, onChange)
  W.editor = function (c, s, lang, opts) {
    var t = L[lang] || L.es, full = !!(opts && opts.full), rs = W.rules(c, s), types = full ? FULL : BASIC, h = '<div class="di-wl-ed" data-c="' + esc(c) + '" data-s="' + esc(s) + '" style="font-size:13px">';
    h += rs.length ? rs.map(function (r, i) { return '<span style="display:inline-flex;align-items:center;gap:6px;margin:0 6px 6px 0;padding:3px 10px;border:1px solid var(--border);border-radius:999px">🔔 ' + esc(ruleText(r, t)) + ' <button type="button" data-del="' + i + '" aria-label="' + esc(t.del) + '" style="font:inherit;border:0;background:none;cursor:pointer;padding:2px 6px;min-height:28px">✕</button></span>'; }).join('') : '<div class="di-movers-hint" style="margin:0 0 6px">' + esc(t.none) + '</div>';
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:4px"><select data-k="t" aria-label="' + esc(t.add) + '" style="font:inherit;padding:3px 6px;max-width:100%">' + types.map(function (o) { return '<option value="' + o + '">' + esc(optLabel(o, t)) + '</option>'; }).join('') + '</select>' +
      '<input data-k="v" type="number" step="any" value="5" aria-label="valor" style="width:84px;font:inherit;padding:3px 6px"><button type="button" data-add="1" style="font:inherit;padding:3px 12px;border:1px solid var(--border);border-radius:999px;background:var(--surface-alt);cursor:pointer;min-height:32px">' + esc(t.add) + '</button></div>';
    if (full && rs.length > 1) h += '<div style="margin-top:8px"><label style="font-size:13px">' + esc(t.mode) + ' <select data-k="m" aria-label="' + esc(t.mode) + '" style="font:inherit;padding:3px 6px"><option value="any"' + (W.mode(c, s) === 'any' ? ' selected' : '') + '>' + esc(t.any) + '</option><option value="all"' + (W.mode(c, s) === 'all' ? ' selected' : '') + '>' + esc(t.all) + '</option></select></label></div>';
    return h + '<div class="di-movers-hint" style="margin-top:6px">' + esc(t.hint) + (full ? ' ' + esc(t.twHint) : '') + '</div></div>';
  };
  W.bindEditor = function (root, onChange) {
    if (!root) return; var eds = root.querySelectorAll('.di-wl-ed');
    Array.prototype.forEach.call(eds, function (ed) {
      var c = ed.getAttribute('data-c'), s = ed.getAttribute('data-s');
      ed.addEventListener('change', function (e) { if (e.target.getAttribute && e.target.getAttribute('data-k') === 'm') { W.setMode(c, s, e.target.value); if (onChange) onChange(); } });
      ed.addEventListener('click', function (e) {
        var d = e.target.getAttribute && e.target.getAttribute('data-del'), a = e.target.getAttribute && e.target.getAttribute('data-add');
        if (d !== null && d !== undefined && d !== '') { W.delRule(c, s, +d); W.resetContext(); if (onChange) onChange(); return; }
        if (a) {
          var t = ed.querySelector('[data-k=t]').value, v = parseFloat(ed.querySelector('[data-k=v]').value), r;
          if (t === 'pct' || t === 'pctUp' || t === 'pctDown') { if (!(v > 0)) return; r = { t: 'pct', v: v }; if (t !== 'pct') r.d = t === 'pctUp' ? 'up' : 'down'; }
          else if (t === 'new') r = { t: 'new' }; else if (t === 'rev') r = { t: 'rev' }; else if (t === 'tw') r = { t: 'tw' }; else if (t === 'fDELAYED' || t === 'fSTALE') r = { t: 'fresh', v: t.slice(1) };
          else { if (isNaN(v)) return; r = { t: 'cross', v: v, d: t }; }
          if (!W.has(c, s)) W.toggle(c, s);
          W.addRule(c, s, r).then(function () { W.resetContext(); if (onChange) onChange(); });
        }
      });
    });
  };
  // aviso flotante en cualquier pagina cuando hay reglas disparadas
  W.pill = function (lang) {
    var any = read().some(function (it) { return it.r && it.r.length; }); if (!any || /brief\.html|mi-seguimiento\.html/.test(location.pathname)) return;
    Promise.all([load(), W.context()]).then(function (a) {
      if (!a[0]) return; var ev = W.evaluate(a[0], a[1]); if (!ev.length) return; var t = L[lang] || L.es;
      var el = document.createElement('a'); el.href = sp('mi-seguimiento.html') + '#alertas';
      el.setAttribute('role', 'status'); el.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:9000;background:#2f6b3a;color:#fff;padding:9px 14px;border-radius:999px;font:600 13px "Public Sans",system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.2)';
      el.textContent = '🔔 ' + ev.length + ' ' + t.pill; document.body.appendChild(el);
    });
  };
})();
