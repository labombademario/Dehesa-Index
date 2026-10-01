/* Dehesa Index — Capa de datos unificada (cliente). Registro de series -> manifiesto -> catalogo del pais -> fichero pequeño. ES5.
   DISeries.manifest()                 -> data/catalog/manifest.json (paises, metricas, productos)
   DISeries.country(cc)                -> data/catalog/<CC>.json (metadatos de las series del pais, sin puntos)
   DISeries.index()                    -> data/catalog/series-index.json (indice global compacto de busqueda)
   DISeries.find({cc, group, tag, q, fs}) -> filas del catalogo SOLO desde el indice (sin bajar catalogos de pais)
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
    // indice global compacto (data/catalog/series-index.json): filas [id,label,cc,group,unit,freq,latestPeriod,fs,tags,canonical,kind]
    index: function () {
      return get('catalog/series-index.json').then(function (d) {
        if (d._rows) return d;
        var D = d.dict; d._rows = d.rows.map(function (r) {
          return { cc: D.cc[r[2]], kind: r[10], s: { id: r[0], label: r[1], group: D.group[r[3]], unit: D.unit[r[4]], freq: D.freq[r[5]], latestPeriod: r[6], fs: D.fs[r[7]], tags: r[8].map(function (i) { return D.tag[i]; }), canonical: r[9], kind: r[10] }, hay: (r[1] + ' ' + D.unit[r[4]] + ' ' + r[0] + ' ' + r[9]).toLowerCase() };
        }); return d;
      });
    },
    // find usa solo el indice: no descarga ningun catalogo de pais. fs: 'active' (excluye HISTORICAL/DISCONTINUED) o un estado concreto
    find: function (o) {
      o = o || {};
      return S.index().then(function (d) {
        var q = (o.q || '').toLowerCase().split(/\s+/).filter(Boolean);
        return d._rows.filter(function (r) {
          var s = r.s;
          if (o.cc && r.cc !== o.cc) return false;
          if (o.group && s.group !== o.group) return false;
          if (o.tag && s.tags.indexOf(o.tag) < 0) return false;
          if (o.fs === 'active' ? (s.fs === 'HISTORICAL' || s.fs === 'DISCONTINUED') : (o.fs && s.fs !== o.fs)) return false;
          return !q.length || q.every(function (w) { return r.hay.indexOf(w) > -1; });
        });
      });
    },
    series: function (cc, id) {
      // las series del pais y de producto estan en el catalogo base; solo las 'eu:' necesitan el catalogo UE (fichero aparte, mas grande)
      return S.country(cc, id.indexOf('eu:') !== 0).then(function (c) {
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
