/* Dehesa Index — Capa de datos unificada (cliente). Registro de series -> manifiesto -> catalogo del pais -> fichero pequeño. ES5.
   DISeries.manifest()                 -> data/catalog/manifest.json (paises, metricas, productos)
   DISeries.country(cc)                -> data/catalog/<CC>.json (metadatos de las series del pais, sin puntos)
   DISeries.find({cc, group, tag, q})  -> filas del catalogo (carga solo los catalogos de pais necesarios)
   DISeries.series(cc, id)             -> {id,label,unit,frequency,points} (descarga solo el trozo que contiene esa serie)
   DISeries.stats()                    -> {files, bytes} descargados hasta ahora (para mostrar cuanto se ha bajado) */
(function () {
  'use strict';
  var C = {}, bytes = 0, files = 0;
  function base(p) { return (window.DehesaShared && window.DehesaShared.sitePath ? window.DehesaShared.sitePath('data/' + p) : 'data/' + p); }
  function get(p) {
    if (C[p]) return C[p];
    return C[p] = fetch(base(p)).then(function (r) { if (!r.ok) throw new Error(p); var n = +r.headers.get('content-length') || 0; files++; bytes += n; return r.json(); }).catch(function (e) { delete C[p]; throw e; });
  }
  var S = {
    manifest: function () { return get('catalog/manifest.json'); },
    // core=true: solo las series del pais y de producto; sin core se anaden los metadatos del catalogo Agri-food UE (fichero aparte)
    country: function (cc, core) {
      return S.manifest().then(function (m) {
        var e = m.countries[cc]; if (!e) throw new Error('country not found');
        if (core || !e.catalogEu) return get(e.catalog);
        return Promise.all([get(e.catalog), get(e.catalogEu)]).then(function (r) { return { schemaVersion: 1, country: r[0].country, name: r[0].name, sources: r[0].sources, series: r[0].series.concat(r[1].series) }; });
      });
    },
    find: function (o) {
      o = o || {};
      return S.manifest().then(function (m) {
        var ccs = o.cc ? [o.cc] : Object.keys(m.countries);
        return Promise.all(ccs.map(function (cc) { return m.countries[cc] ? S.country(cc) : { series: [] }; })).then(function (cats) {
          var q = (o.q || '').toLowerCase().split(/\s+/).filter(Boolean), out = [];
          cats.forEach(function (c) {
            (c.series || []).forEach(function (s) {
              if (o.group && s.group !== o.group) return;
              if (o.tag && s.tags.indexOf(o.tag) < 0) return;
              if (q.length) { var hay = (s.label + ' ' + s.unit + ' ' + s.id).toLowerCase(); if (!q.every(function (w) { return hay.indexOf(w) > -1; })) return; }
              out.push({ cc: c.country, s: s });
            });
          });
          return out;
        });
      });
    },
    series: function (cc, id) {
      return S.country(cc).then(function (c) {
        var row = c.series.filter(function (s) { return s.id === id; })[0]; if (!row) throw new Error('series not found');
        if (row.format === 'eu-regions') return get(row.file).then(function (f) {
          var rs = (f.regions || []).filter(function (r) { return r.c === row.c && (!row.m || r.m === row.m); }), r = rs[0]; if (!r) throw new Error('region not in file');
          var E = Date.UTC(2000, 0, 1), pts = r.d.map(function (d, i) { return [new Date(E + d * 864e5).toISOString().slice(0, 10), r.v[i]]; });
          return { id: row.id, label: row.label, unit: row.unit, frequency: row.freq, points: pts, meta: row };
        });
        return get(row.file).then(function (f) { var s = f.series.filter(function (x) { return x.id === id; })[0]; if (!s) throw new Error('series not in shard'); s.meta = row; return s; });
      });
    },
    stats: function () { return { files: files, bytes: bytes }; }
  };
  window.DISeries = S;
})();
