/* Dehesa Index — buscador global. Índice estático (data/search-index.json), sin servidor ni seguimiento.
   Entiende 4 idiomas, sinónimos, acentos y erratas. Se abre con la lupa, "/" o Ctrl/Cmd+K. */
(function (global) {
  'use strict';
  var TXT = {
    es: { ph: 'Busca un producto, país, dato o página…', hint: 'Prueba con', empty: 'Sin resultados para', tryTxt: 'Prueba con otro término, en cualquier idioma (p. ej. «trigo», «wheat», «exportaciones soja»).', partial: 'Coincidencias parciales', close: 'Cerrar', popular: 'Sugerencias', nav: '↑↓ moverse · Enter abrir · Esc cerrar', loadFail: 'No se pudo cargar el buscador.',
      types: { product: 'Precio', category: 'Categoría', supply: 'Oferta y demanda', map: 'Mapa', crop: 'Cultivos', market: 'Mercado USDA', country: 'País', climate: 'Clima', page: 'Página', section: 'Sección', concept: 'Explicación', news: 'Noticia' } },
    en: { ph: 'Search a product, country, dataset or page…', hint: 'Try', empty: 'No results for', tryTxt: 'Try another term, in any language (e.g. “wheat”, “trigo”, “soy exports”).', partial: 'Partial matches', close: 'Close', popular: 'Suggestions', nav: '↑↓ move · Enter open · Esc close', loadFail: 'The search could not be loaded.',
      types: { product: 'Price', category: 'Category', supply: 'Supply & demand', map: 'Map', crop: 'Crops', market: 'USDA market', country: 'Country', climate: 'Climate', page: 'Page', section: 'Section', concept: 'Explainer', news: 'News' } },
    fr: { ph: 'Cherchez un produit, un pays, une donnée ou une page…', hint: 'Essayez', empty: 'Aucun résultat pour', tryTxt: 'Essayez un autre terme, dans n’importe quelle langue (p. ex. « blé », « wheat », « exportations soja »).', partial: 'Correspondances partielles', close: 'Fermer', popular: 'Suggestions', nav: '↑↓ naviguer · Entrée ouvrir · Échap fermer', loadFail: 'La recherche n’a pas pu être chargée.',
      types: { product: 'Prix', category: 'Catégorie', supply: 'Offre et demande', map: 'Carte', crop: 'Cultures', market: 'Marché USDA', country: 'Pays', climate: 'Climat', page: 'Page', section: 'Section', concept: 'Explication', news: 'Actualité' } },
    it: { ph: 'Cerca un prodotto, un paese, un dato o una pagina…', hint: 'Prova', empty: 'Nessun risultato per', tryTxt: 'Prova un altro termine, in qualsiasi lingua (es. «grano», «wheat», «esportazioni soia»).', partial: 'Corrispondenze parziali', close: 'Chiudi', popular: 'Suggerimenti', nav: '↑↓ muovi · Invio apri · Esc chiudi', loadFail: 'Impossibile caricare la ricerca.',
      types: { product: 'Prezzo', category: 'Categoria', supply: 'Offerta e domanda', map: 'Mappa', crop: 'Colture', market: 'Mercato USDA', country: 'Paese', climate: 'Clima', page: 'Pagina', section: 'Sezione', concept: 'Spiegazione', news: 'Notizia' } }
  };
  var ICON = { product: '💶', category: '🏷️', supply: '⚖️', map: '🗺️', crop: '🌱', market: '📈', country: '🌍', climate: '🌦️', page: '📄', section: '📑', concept: '💡', news: '📰' };
  var BOOST = { product: 0.18, supply: 0.1, crop: 0.1, market: 0.06, category: 0.06, climate: 0.04, page: 0.05, concept: 0.05, news: -0.05, section: 0, map: -0.04 };
  var STOP = { de: 1, del: 1, la: 1, el: 1, los: 1, las: 1, en: 1, of: 1, the: 1, in: 1, and: 1, y: 1, e: 1, et: 1, le: 1, les: 1, du: 1, des: 1, di: 1, il: 1, lo: 1, da: 1, un: 1, una: 1, a: 1, to: 1, for: 1, por: 1, para: 1, con: 1, pour: 1, per: 1 };
  var SUGGEST = ['precios.html?tab=cereales&product=cereales%3Atrigo', 'precios.html?tab=cereales&product=cereales%3Amaiz', 'precios.html?tab=lacteos&product=lacteos%3Aleche', 'precios.html?tab=fertilizantes&product=fertilizantes%3Aurea', 'oferta-demanda.html?c=soja', 'cultivos.html?crop=corn', 'clima.html', 'mapa.html?layer=exp&sd=trigo'];
  var TRYQ = { h: { es: 'Pregunta directamente', en: 'Ask directly', fr: 'Posez la question', it: 'Chiedi direttamente' }, q: { es: ['precio del trigo', 'maíz en Iowa', 'exportaciones de España a Francia'], en: ['wheat price', 'corn in Iowa', 'Spain exports to Germany'], fr: ['prix du blé', 'maïs en Iowa', 'exportations de la France vers l’Allemagne'], it: ['prezzo del grano', 'mais in Iowa', 'esportazioni della Spagna'] } };
  var IDX = null, INDEX_URL = null, ROOT = null, STATE = { open: false, sel: 0, results: [], q: '' };

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function toks(s) { var n = norm(s); return n ? n.split(' ') : []; }
  function lev(a, b, max) { // distancia de edición con transposición (Damerau, variante OSA)
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
      var c = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  }
  // 0..1: cuánto encaja el término q con la palabra w
  function tokScore(q, w) {
    if (q === w) return 1;
    if (w.indexOf(q) === 0 && q.length >= 2) return 0.85;
    if (q.length >= 5 && w.indexOf(q) > 0) return 0.45;
    if (q.length >= 4 && q.charAt(0) === w.charAt(0)) { // las erratas casi nunca están en la primera letra
      var d = q.length <= 4 ? 0 : q.length <= 6 ? 1 : 2;
      if (q.length === 4 && q !== w && w.length === 4 && lev(q, w, 1) <= 1 && q.split('').sort().join('') === w.split('').sort().join('')) return 0.6; // solo transposiciones en palabras cortas
      if (d && lev(q, w, d) <= d) return 0.6;
      if (q.length >= 5 && w.length > q.length && lev(q, w.slice(0, q.length), 1) <= 1) return 0.5;
    }
    return 0;
  }
  function prep(entries) {
    entries.forEach(function (e) {
      e._t = {}; L.forEach(function (l) { e._t[l] = toks(e.n[l]); });
      e._k = toks(e.k || ''); e._s = {}; L.forEach(function (l) { e._s[l] = toks((e.s || {})[l] || ''); });
    });
  }
  var L = ['es', 'en', 'fr', 'it'];
  function fieldBest(q, arr) { var b = 0, i, s; for (i = 0; i < arr.length; i++) { s = tokScore(q, arr[i]); if (s > b) { b = s; if (b === 1) break; } } return b; }
  function scoreEntry(e, qs, lang, needAll) {
    var total = 0, hit = 0, i;
    for (i = 0; i < qs.length; i++) {
      var q = qs[i], best = fieldBest(q, e._t[lang]);
      if (best < 1) { var o = 0, k; for (k = 0; k < L.length; k++) if (L[k] !== lang) o = Math.max(o, fieldBest(q, e._t[L[k]]) * 0.85); best = Math.max(best, o); }
      if (best < 1) best = Math.max(best, fieldBest(q, e._k) * 0.7, fieldBest(q, e._s[lang]) * 0.3);
      if (best > 0) hit++;
      total += best;
    }
    if (needAll ? hit < qs.length : hit === 0) return 0;
    var s = total / qs.length + (BOOST[e.t] || 0) + (hit === qs.length ? 0.15 : 0);
    var title = e.n[lang] || ''; s -= Math.min(title.length, 80) / 1500;
    // frase completa dentro del título
    if (qs.length > 1 && norm(title).indexOf(qs.join(' ')) >= 0) s += 0.2;
    return s;
  }
  function search(query, lang) {
    var qs = toks(query).filter(function (t) { return !STOP[t]; });
    if (!qs.length) return { list: [], partial: false };
    var run = function (needAll) { var out = []; IDX.forEach(function (e) { var s = scoreEntry(e, qs, lang, needAll); if (s > 0.12) out.push({ e: e, s: s }); }); out.sort(function (a, b) { return b.s - a.s; }); return out; };
    var r = run(true), partial = false;
    if (!r.length && qs.length > 1) { r = run(false); partial = true; }
    return { list: r.slice(0, 10).map(function (x) { return x.e; }), partial: partial };
  }
  // Noticias: data/news.json se baja solo cuando se busca (>= 3 letras); no entra en el indice estatico porque cambia cada 3 h.
  var NEWS = { arr: null, p: null };
  function loadNews() {
    if (NEWS.p) return NEWS.p;
    NEWS.p = fetch(href('data/news.json')).then(function (r) { if (!r.ok) throw Error('x'); return r.json(); }).then(function (d) {
      NEWS.arr = (d.items || []).filter(function (x) { return x && x.url && x.headline; }).map(function (x) {
        var n = {}, s = {}; L.forEach(function (l) { n[l] = x.headline[l] || x.headline.en || ''; s[l] = (x.source || '') + (x.date ? ' · ' + x.date : ''); });
        return { t: 'news', u: x.url, ext: true, n: n, s: s, k: ((x.topics || []).concat(x.products || [])).join(' ') };
      });
      prep(NEWS.arr);
    }).catch(function () { NEWS.p = null; NEWS.arr = []; });
    return NEWS.p;
  }
  function newsFor(query, lang) {
    if (!NEWS.arr) return [];
    var qs = toks(query).filter(function (x) { return !STOP[x]; }), out = [];
    if (!qs.length) return out;
    NEWS.arr.forEach(function (e) { var s = scoreEntry(e, qs, lang, true); if (s > 0.5) out.push({ e: e, s: s }); });
    out.sort(function (a, b) { return b.s - a.s; });
    return out.slice(0, 3).map(function (x) { return x.e; });
  }
  function lang() { return global.DehesaShared && global.DehesaShared.getLang ? global.DehesaShared.getLang() : 'es'; }
  function tx() { return TXT[lang()] || TXT.es; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function href(u) { return (global.DehesaShared && global.DehesaShared.sitePath ? global.DehesaShared.sitePath(u) : u); }

  function css() {
    if (document.getElementById('di-search-css')) return;
    var st = document.createElement('style'); st.id = 'di-search-css';
    st.textContent = '#di-search{position:fixed;inset:0;z-index:2000;display:none}#di-search.is-open{display:block}#di-search .ds-back{position:absolute;inset:0;background:rgba(20,18,12,.55)}' +
      '#di-search .ds-panel{position:relative;max-width:640px;margin:8vh auto 0;background:var(--surface,#fffdf7);color:var(--text,#231f14);border:1px solid var(--border,#ddd6c4);border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.3);overflow:hidden;width:calc(100% - 24px)}' +
      '#di-search .ds-row{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--border,#ddd6c4)}#di-search input{flex:1;border:0;outline:0;background:transparent;font:inherit;font-size:17px;color:inherit;min-width:0}' +
      '#di-search .ds-x{border:0;background:transparent;color:var(--text-faint,#7a7466);font-size:20px;cursor:pointer;padding:4px 8px}' +
      '#di-search ul{list-style:none;margin:0;padding:6px;max-height:min(60vh,460px);overflow-y:auto}#di-search li a{display:flex;gap:12px;align-items:center;padding:10px 10px;border-radius:8px;text-decoration:none;color:inherit}' +
      '#di-search li a:hover,#di-search li.is-sel a{background:var(--bg-soft,rgba(120,110,80,.12))}#di-search .ds-ic{font-size:18px;width:26px;text-align:center;flex:none}#di-search .ds-t{font-weight:600;font-size:15px;line-height:1.25}' +
      '#di-search .ds-s{font-size:12.5px;color:var(--text-faint,#7a7466);margin-top:1px}#di-search .ds-badge{margin-left:auto;flex:none;font-size:10.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--text-faint,#7a7466);border:1px solid var(--border,#ddd6c4);border-radius:10px;padding:2px 8px}' +
      '#di-search .ds-msg{padding:16px 16px 18px;font-size:14px;color:var(--text-faint,#7a7466)}#di-search .ds-head{padding:8px 14px 2px;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--text-faint,#7a7466)}#di-search .ds-foot{padding:8px 14px;border-top:1px solid var(--border,#ddd6c4);font-size:12px;color:var(--text-faint,#7a7466)}' +
      '#di-search #ds-ans:empty{display:none}#di-search .ds-ans{padding:10px 12px 4px;border-bottom:1px solid var(--border,#ddd6c4);max-height:min(46vh,360px);overflow-y:auto}#di-search .ds-ans-h{font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--text-faint,#7a7466);padding:0 2px 6px}' +
      '#di-search .ds-card{display:block;padding:9px 12px;margin:0 0 8px;border:1px solid var(--border,#ddd6c4);border-radius:10px;text-decoration:none;color:inherit;background:var(--bg-soft,rgba(120,110,80,.08))}#di-search .ds-card:hover,#di-search .ds-card:focus-visible{border-color:var(--text-faint,#7a7466)}' +
      '#di-search .ds-c-r{font-size:13px;font-weight:700}#di-search .ds-c-r em{font-style:normal;font-weight:400;color:var(--text-faint,#7a7466);font-size:12px}#di-search .ds-c-id{font-size:12px;color:var(--text-faint,#7a7466)}#di-search .ds-c-v{font-size:22px;font-weight:700;line-height:1.25;font-variant-numeric:tabular-nums}#di-search .ds-c-v small{font-size:12.5px;font-weight:400;color:var(--text-faint,#7a7466)}' +
      '#di-search .ds-cites{padding:2px 2px 6px}#di-search .di-cite{font-size:12px;color:var(--text-faint,#7a7466)}#di-search .di-cite-b{background:var(--surface,#fff);border:1px solid var(--border,#ddd6c4);border-radius:8px;padding:8px 10px;margin:4px 0}#di-search .di-cite-r{display:flex;gap:8px}#di-search .di-cite-r>span:first-child{min-width:78px}#di-search .di-cite>summary{cursor:pointer;list-style:none;padding:2px 0}#di-search .di-cite>summary::-webkit-details-marker{display:none}#di-search .di-cite-s{font-weight:600;margin-top:4px}'+
      '#di-search .ds-c-s,#di-search .ds-c-s2,#di-search .ds-ans-n{font-size:12.5px;font-weight:400;color:var(--text-faint,#7a7466)}#di-search .ds-ans-n{padding:0 2px 6px}#di-search .ds-chg{font-weight:700;font-size:13px}#di-search .ds-chg.up{color:var(--up,#1b7f4b)}#di-search .ds-chg.dn{color:var(--down,#b3261e)}' +
      '#di-search .ds-try{display:flex;flex-wrap:wrap;gap:6px;padding:4px 14px 8px}#di-search .ds-try button{border:1px solid var(--border,#ddd6c4);background:transparent;color:inherit;border-radius:999px;padding:5px 12px;font:inherit;font-size:13px;cursor:pointer}#di-search .ds-try button:hover{border-color:var(--text-faint,#7a7466)}#di-search .ds-ans-l{display:inline-block;padding:2px 2px 10px;font-size:13px;font-weight:600;color:inherit;text-decoration:underline}' +
      '@media(max-width:600px){#di-search .ds-panel{margin-top:0;width:100%;border-radius:0 0 12px 12px}#di-search .ds-foot{display:none}#di-search .ds-badge{display:none}}';
    document.head.appendChild(st);
  }
  function build() {
    if (ROOT) return;
    css();
    ROOT = document.createElement('div'); ROOT.id = 'di-search'; ROOT.setAttribute('role', 'dialog'); ROOT.setAttribute('aria-modal', 'true');
    ROOT.innerHTML = '<div class="ds-back"></div><div class="ds-panel"><div class="ds-row"><span aria-hidden="true">🔍</span><input id="ds-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" role="combobox" aria-expanded="true" aria-controls="ds-list"><button type="button" class="ds-x" id="ds-close">✕</button></div><div id="ds-ans" aria-live="polite"></div><div id="ds-body"></div><div class="ds-foot" id="ds-foot"></div></div>';
    document.body.appendChild(ROOT);
    ROOT.querySelector('.ds-back').addEventListener('click', close);
    document.getElementById('ds-close').addEventListener('click', close);
    var input = document.getElementById('ds-input');
    input.addEventListener('input', function () { STATE.sel = 0; renderResults(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { var r = STATE.results[STATE.sel]; if (r) { e.preventDefault(); go(r); } }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    document.addEventListener('keydown', function (e) { if (STATE.open && e.key === 'Escape') close(); });
  }
  function move(d) { if (!STATE.results.length) return; STATE.sel = (STATE.sel + d + STATE.results.length) % STATE.results.length; mark(); }
  function mark() {
    var lis = ROOT.querySelectorAll('li'); Array.prototype.forEach.call(lis, function (li, i) { li.classList.toggle('is-sel', i === STATE.sel); li.setAttribute('aria-selected', i === STATE.sel ? 'true' : 'false'); if (i === STATE.sel && li.scrollIntoView) li.scrollIntoView({ block: 'nearest' }); });
  }
  function go(e) { close(); if (e.ext) global.open(e.u, '_blank', 'noopener,noreferrer'); else global.location.href = href(e.u); }
  function item(e, l, i) {
    var t = tx();
    return '<li role="option" data-i="' + i + '"><a href="' + esc(e.ext ? e.u : href(e.u)) + '"' + (e.ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '><span class="ds-ic" aria-hidden="true">' + (ICON[e.t] || '•') + '</span><span><div class="ds-t">' + esc(e.n[l]) + '</div><div class="ds-s">' + esc((e.s || {})[l] || '') + '</div></span><span class="ds-badge">' + esc(t.types[e.t] || e.t) + '</span></a></li>';
  }
  function renderResults() {
    var t = tx(), l = lang(), q = document.getElementById('ds-input').value, body = document.getElementById('ds-body'), html = '';
    STATE.q = q; if (!norm(q)) setAns('');
    if (!IDX) { body.innerHTML = '<div class="ds-msg">…</div>'; return; }
    if (!norm(q)) {
      var by = {}; IDX.forEach(function (e) { by[e.u] = e; });
      STATE.results = SUGGEST.map(function (u) { return by[u]; }).filter(Boolean);
      html = '<div class="ds-head">' + esc(TRYQ.h[l] || TRYQ.h.es) + '</div><div class="ds-try">' + (TRYQ.q[l] || TRYQ.q.es).map(function (q) { return '<button type="button" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div><div class="ds-head">' + esc(t.popular) + '</div><ul id="ds-list" role="listbox">' + STATE.results.map(function (e, i) { return item(e, l, i); }).join('') + '</ul>';
    } else {
      var r = search(q, l); r.list = r.list.concat(newsFor(q, l)); STATE.results = r.list;
      if (norm(q).length >= 3 && !NEWS.arr) loadNews().then(function () { if (STATE.open && STATE.q === q) renderResults(); });
      if (!r.list.length) html = '<div class="ds-msg">' + esc(t.empty) + ' «' + esc(q.trim()) + '». ' + esc(t.tryTxt) + '</div>';
      else html = (r.partial ? '<div class="ds-head">' + esc(t.partial) + '</div>' : '') + '<ul id="ds-list" role="listbox">' + r.list.map(function (e, i) { return item(e, l, i); }).join('') + '</ul>';
    }
    body.innerHTML = html; mark(); answerFor(q, l);
    Array.prototype.forEach.call(body.querySelectorAll('.ds-try button'), function (b) { b.addEventListener('click', function () { var i = document.getElementById('ds-input'); i.value = b.getAttribute('data-q'); STATE.sel = 0; renderResults(); i.focus(); }); });
    Array.prototype.forEach.call(body.querySelectorAll('li'), function (li) { li.addEventListener('mousemove', function () { var i = +li.getAttribute('data-i'); if (i !== STATE.sel) { STATE.sel = i; mark(); } }); li.querySelector('a').addEventListener('click', function () { close(); }); });
  }
  // Respuestas directas (fase 1): módulos y datos se cargan solo al buscar; sin servidor ni IA externa.
  var ANS = { mod: null, env: null, cache: {}, timer: null };
  function setAns(h) { var el = document.getElementById('ds-ans'); if (el) el.innerHTML = h; }
  function script(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = href(src); s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function ansReady() {
    if (ANS.mod) return Promise.resolve(ANS.mod);
    if (!ANS.p) ANS.p = (global.DIIdentity ? Promise.resolve() : script('js/instrument-identity.js')).then(function () { return global.DIUsdaCal ? 0 : script('js/usda-calendar.js'); }).then(function () { return global.DICite ? 0 : script('js/cite.js'); }).then(function () { return global.DICite ? global.DICite.load() : 0; }).then(function () { return global.DehesaAnswers ? 0 : script('js/answers.js'); }).then(function () {
      ANS.env = {
        products: (IDX || []).filter(function (e) { return e.t === 'product'; }).map(function (e) { var m = /product=([^&]+)/.exec(e.u); return m ? { slug: decodeURIComponent(m[1]).split(':')[1], names: e.n, kw: e.k, u: e.u } : null; }).filter(Boolean),
        tokScore: tokScore, href: href,
        provider: { json: function (p) { if (!ANS.cache[p]) ANS.cache[p] = fetch(href('data/' + p), /^(prices\/latest|us-cash-bids)\//.test(p) ? { cache: 'no-cache' } : undefined).then(function (r) { if (!r.ok) throw Error(p); return r.json(); }).catch(function (e) { delete ANS.cache[p]; throw e; }); return ANS.cache[p]; } }
      };
      ANS.mod = global.DehesaAnswers; return ANS.mod;
    }).catch(function () { ANS.p = null; return null; });
    return ANS.p;
  }
  function answerFor(q, l) {
    clearTimeout(ANS.timer); setAns('');
    if (!IDX || !norm(q) || norm(q).length < 3) return;
    ANS.timer = setTimeout(function () {
      ansReady().then(function (m) {
        if (!m || !ANS.env || STATE.q !== q || !STATE.open) return null;
        return m.answer(q, l, ANS.env).then(function (a) { if (STATE.q === q && STATE.open) setAns(a ? m.render(a, l, esc) : ''); });
      }).catch(function () { setAns(''); });
    }, 150);
  }
  function open() {
    build(); var t = tx(), input = document.getElementById('ds-input');
    input.placeholder = t.ph; input.setAttribute('aria-label', t.ph); document.getElementById('ds-close').setAttribute('aria-label', t.close); document.getElementById('ds-foot').textContent = t.nav;
    ROOT.classList.add('is-open'); STATE.open = true; document.documentElement.style.overflow = 'hidden'; STATE.sel = 0;
    renderResults(); setTimeout(function () { input.focus(); input.select(); }, 20);
    if (!IDX) load().then(renderResults);
  }
  function close() { if (!ROOT) return; ROOT.classList.remove('is-open'); STATE.open = false; document.documentElement.style.overflow = ''; }
  function load() {
    return fetch(href('data/search-index.json')).then(function (r) { if (!r.ok) throw Error('x'); return r.json(); }).then(function (d) { IDX = d.entries; prep(IDX); }).catch(function () { var b = document.getElementById('ds-body'); if (b) b.innerHTML = '<div class="ds-msg">' + esc(tx().loadFail) + '</div>'; });
  }
  global.DehesaSearch = { open: open, close: close, _tokScore: tokScore, _search: function (q, l) { return search(q, l || 'es'); }, _load: function (entries) { IDX = entries; prep(IDX); }, _norm: norm };
  if (global.__diSearchWantOpen) { global.__diSearchWantOpen = false; open(); }
})(typeof window !== 'undefined' ? window : globalThis);
