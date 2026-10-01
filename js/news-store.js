/* Dehesa Index — Capa de noticias (cliente). Sustituye js/news-index.js (600 KB de JS bloqueante) y js/news-feed.js. ES5.
   DINews.index()  -> Promise<{ clave: [noticia] }>  (data/views/news-index.json; tambien deja window.DehesaNewsIndex)
   DINews.feed()   -> Promise<{generatedAt, items}>  (data/views/news-feed.json; tambien deja window.DehesaNewsFeed)
   DINews.items()  -> Promise<[{id,date,source,url,headline:{es,en,fr,it},products,relevance}]> para fichas de producto
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
    items: function () {
      return S.feed().then(function (d) {
        return (d.items || []).map(function (a) {
          return { id: a.id, date: a.d, source: a.s, url: a.u, products: a.p || [], relevance: a.v || 0, headline: { es: a.h, en: a.h, fr: a.h, it: a.h } };
        });
      });
    }
  };
  global.DINews = S;
})(window);
