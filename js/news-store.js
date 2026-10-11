/* Dehesa Index — Capa de noticias (cliente). Sustituye js/news-index.js (600 KB de JS bloqueante) y js/news-feed.js. ES5.
   DINews.index()  -> Promise<{ clave: [noticia] }>  (data/views/news-index.json; tambien deja window.DehesaNewsIndex)
   DINews.feed()   -> Promise<{generatedAt, items}>  (data/views/news-feed.json; tambien deja window.DehesaNewsFeed)
   DINews.tr(lang) -> Promise<{id: [titular, resumen]}> traduccion automatica (data/views/news-tr-<idioma>.json); nunca falla: {} si no hay
   DINews.items()  -> Promise<[{id,date,source,url,headline:{es,en,fr,it},products,relevance}]> feed completo (pagina Noticias)
   DINews.product()-> mismo formato, solo los 8 primeros por clave de producto (data/views/news-product.json) para fichas de producto
   Los fallos no rompen la pagina: devuelven un objeto vacio y se emite 'dehesa:news-error'. */
(function (global) {
  'use strict';
  var C = {};
  function url(p) { return global.DehesaShared && global.DehesaShared.sitePath ? global.DehesaShared.sitePath('data/views/' + p) : 'data/views/' + p; }
  function get(p) {
    if (C[p]) return C[p];
    return C[p] = fetch(url(p), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); });
  }
  function fail(e, empty) {
    try { global.dispatchEvent(new CustomEvent('dehesa:news-error', { detail: String(e && e.message || e) })); } catch (x) { /* sin eventos */ }
    return empty;
  }
  var S = {
    index: function () {
      if (S._i) return S._i;
      return S._i = get('news-index.json').then(function (d) {
        var st = (d.stories || []).map(function (s) {
          return { id: s.id, date: s.date, region: s.region, source: s.source, url: s.url, products: s.products || [],
            impactChannel: s.impactChannel, marketLinks: s.marketLinks || [], headline: { es: s.h, en: s.h, fr: s.h, it: s.h } };
        });
        var idx = {}; Object.keys(d.keys || {}).forEach(function (k) { idx[k] = d.keys[k].map(function (i) { return st[i]; }); });
        global.DehesaNewsIndex = idx; return idx;
      }).catch(function (e) { S._i = null; return fail(e, {}); });
    },
    feed: function () {
      if (S._f) return S._f;
      return S._f = get('news-feed.json').then(function (d) { global.DehesaNewsFeed = d; return d; })
        .catch(function (e) { S._f = null; return fail(e, { generatedAt: null, items: [] }); });
    },
    // Traduccion automatica de los titulares al idioma de la web (scripts/translate_news.py): {id: [titular, resumen]}. Si falta o falla, se ven los originales.
    tr: function (lang) {
      if (!/^(es|en|fr|it)$/.test(lang || '')) return Promise.resolve({});
      S._t = S._t || {};
      if (S._t[lang]) return S._t[lang];
      return S._t[lang] = get('news-tr-' + lang + '.json').then(function (d) { return d.items || {}; }).catch(function () { S._t[lang] = null; return {}; });
    },
    items: function () {
      return S.feed().then(function (d) { return S._map(d.items); });
    },
    _map: function (items) {
      return (items || []).map(function (a) {
        return { id: a.id, date: a.d, source: a.s, url: a.u, products: a.p || [], relevance: a.v || 0, headline: { es: a.h, en: a.h, fr: a.h, it: a.h } };
      });
    },
    // Lo que necesita la ficha de producto: los 8 primeros titulares de cada clave de producto (43 KB frente a 231 KB del feed completo). Si falla, cae al feed completo.
    product: function () {
      if (S._p) return S._p;
      return S._p = get('news-product.json').then(function (d) { return S._map(d.items); }).catch(function () { S._p = null; return S.items(); });
    }
  };
  global.DINews = S;
})(window);
