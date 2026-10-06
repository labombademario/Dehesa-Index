/* Dehesa Index — Busqueda del catalogo sobre el indice TROCEADO por entidad (data/catalog/index/<CC>.json, mismo nombre que catalog/<CC>.json). Amplia window.DISeries; solo la carga catalogo.html. ES5.
   DISeries.index(cc)                     -> filas del trozo de una entidad
   DISeries.find({cc, group, tag, q, fs}) -> filas de los trozos que pueden coincidir (pais elegido, o entidades con ese grupo/producto segun el manifiesto; texto libre: todos)
   DISeries.browse(lim)                   -> {rows, total} sin filtros: baja trozos en orden hasta tener lim filas */
(function () {
  'use strict';
  var S = window.DISeries; if (!S) return;
  // trozo del indice: filas [id,label,cc,group,unit,freq,latestPeriod,fs,tags,kind,src]
  S.index = function (cc) {
    return S.manifest().then(function (m) {
      var e = m.countries[cc]; if (!e) return [];
      return S._get(e.catalog.replace('catalog/', 'catalog/index/')).then(function (d) {
        if (d._rows) return d._rows;
        var D = d.dict; d._rows = d.rows.map(function (r) {
          return { cc: D.cc[r[2]], kind: r[9], s: { id: r[0], label: r[1], group: D.group[r[3]], unit: D.unit[r[4]], freq: D.freq[r[5]], latestPeriod: r[6], fs: D.fs[r[7]], tags: r[8].map(function (i) { return D.tag[i]; }), kind: r[9], sourceId: D.src[r[10]] },
            hay: (r[1] + ' ' + D.unit[r[4]] + ' ' + r[0] + ' ' + D.cc[r[2]] + ' ' + D.group[r[3]] + ' ' + D.freq[r[5]]).toLowerCase() };
        }); return d._rows;
      });
    });
  };
  // entidades que pueden coincidir (segun el manifiesto)
  S.ccsFor = function (o) {
    return S.manifest().then(function (m) {
      var all = Object.keys(m.countries).sort();
      if (o.cc) return all.indexOf(o.cc) > -1 ? [o.cc] : [];
      var out = all;
      if (o.group) out = out.filter(function (c) { return m.countries[c].metrics && m.countries[c].metrics[o.group]; });
      if (o.tag) { var w = {}; (m.products[o.tag] || []).forEach(function (x) { w[x.split('/')[0]] = 1; }); out = out.filter(function (c) { return w[c]; }); }
      return out;
    });
  };
  // fs: 'active' (sin HISTORICAL/DISCONTINUED) o un estado
  S.find = function (o) {
    o = o || {};
    return S.ccsFor(o).then(function (cs) { return Promise.all(cs.map(S.index)); }).then(function (parts) {
      var q = (o.q || '').toLowerCase().split(/\s+/).filter(Boolean), rows = [].concat.apply([], parts);
      return rows.filter(function (r) {
        var s = r.s;
        if (o.cc && r.cc !== o.cc) return false;
        if (o.group && s.group !== o.group) return false;
        if (o.tag && s.tags.indexOf(o.tag) < 0) return false;
        if (o.fs === 'active' ? (s.fs === 'HISTORICAL' || s.fs === 'DISCONTINUED') : (o.fs && s.fs !== o.fs)) return false;
        return !q.length || q.every(function (w) { return r.hay.indexOf(w) > -1; });
      });
    });
  };
  S.browse = function (lim) {
    return S.manifest().then(function (m) {
      var cs = Object.keys(m.countries).sort(), rows = [], i = 0;
      function next() { if (rows.length >= lim || i >= cs.length) return { rows: rows, total: m.seriesTotal }; return S.index(cs[i++]).then(function (r) { rows = rows.concat(r); return next(); }); }
      return next();
    });
  };
})();
