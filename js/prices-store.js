/* Dehesa Index — Capa de datos de precios (cliente). Sustituye la descarga de data/latest.json (3,7 MB) y data/history.json (10 MB). ES5.
   DIPrices.manifest()                  -> data/prices/manifest.json (regiones, productos)
   DIPrices.latest([regions])           -> observaciones SIN historico (con `spark`: ultimos 104 valores) de las regiones pedidas (todas por defecto)
   DIPrices.history(region, product)    -> {history:[{period,year,value}...]} historico completo de UN producto (solo al abrir su grafico)
   DIPrices.histories(list)             -> historicos de varios productos [{region, product}] con concurrencia limitada
   DIPrices.intelligence(region)        -> {series:{producto:{frequency,unit,currency,comparability,sourceId,points:[[fecha,valor]]}}} para el Relationship Engine
   DIPrices.stats()                     -> {files, bytes} descargados */
(function () {
  'use strict';
  var C = {}, files = 0, bytes = 0;
  function base(p) { return (window.DehesaShared && window.DehesaShared.sitePath ? window.DehesaShared.sitePath('data/' + p) : 'data/' + p); }
  function get(p, opts) {
    if (C[p]) return C[p];
    return C[p] = fetch(base(p), opts || {}).then(function (r) { if (!r.ok) throw new Error(p + ' ' + r.status); files++; bytes += +r.headers.get('content-length') || 0; return r.json(); }).catch(function (e) { delete C[p]; throw e; });
  }
  var S = {
    manifest: function () { return get('prices/manifest.json', { cache: 'no-cache' }); },
    latest: function (regions) {
      return S.manifest().then(function (m) {
        var rs = (regions && regions.length ? regions : Object.keys(m.regions)).filter(function (r) { return m.regions[r]; });
        return Promise.all(rs.map(function (r) { return get(m.regions[r].latest, { cache: 'no-cache' }); })).then(function (docs) {
          var out = []; docs.forEach(function (d) { out = out.concat(d.observations); });
          return out.sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
        });
      });
    },
    history: function (region, product) { return get('prices/history/' + region + '/' + product + '.json'); },
    histories: function (list) {
      var i = 0, out = new Array(list.length);
      function worker() { if (i >= list.length) return Promise.resolve(); var k = i++; return S.history(list[k].region, list[k].product).then(function (d) { out[k] = d; }, function () { out[k] = null; }).then(worker); }
      return Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]).then(function () { return out; });
    },
    intelligence: function (region) { return get('prices/intelligence/' + region + '.json'); },
    stats: function () { return { files: files, bytes: bytes }; }
  };
  window.DIPrices = S;
})();
