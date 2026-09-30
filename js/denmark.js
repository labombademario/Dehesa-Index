/* Dehesa Index — Dinamarca (Statistics Denmark, StatBank, CC BY 4.0). Lee data/denmark-prices.json.
   Solo expone los productos con serie real; nada se rellena ni se deriva de otro mercado. */
(function (global) {
  'use strict';
  // nameKey de nuestro producto -> serie LPRIS10 de Statistics Denmark (DKK/100 kg) y unidad de publicación en la web
  var MAP = {
    trigo:   { id: 'LPRIS10:1000', unitKey: 'tonelada', unitKg: 1000 },
    centeno: { id: 'LPRIS10:1005', unitKey: 'tonelada', unitKg: 1000 },
    cebada:  { id: 'LPRIS10:1010', unitKey: 'tonelada', unitKg: 1000 },
    avena:   { id: 'LPRIS10:1015', unitKey: 'tonelada', unitKg: 1000 },
    colza:   { id: 'LPRIS10:1025', unitKey: 'tonelada', unitKg: 1000 },
    leche:   { id: 'LPRIS10:1325', unitKey: '100kg', unitKg: 100 },
    cerdo:   { id: 'LPRIS10:1290', unitKey: '100kg', unitKg: 100 },
    vaca:    { id: 'LPRIS10:1245', unitKey: '100kg', unitKg: 100 },
    pollo:   { id: 'LPRIS10:1315', unitKey: 'kg', unitKg: 1 }
  };
  var DATA = null, SERIES = {}, WAIT = [], STARTED = false;
  function index(d) {
    SERIES = {};
    (d && d.series || []).forEach(function (s) { SERIES[s.id] = s; });
    DATA = d;
  }
  function load(cb) {
    if (DATA) { cb && cb(DATA); return; }
    if (cb) WAIT.push(cb);
    if (STARTED) return;
    STARTED = true;
    fetch('data/denmark-prices.json').then(function (r) { if (!r.ok) throw Error('dk'); return r.json(); })
      .then(function (d) { index(d); }).catch(function () { DATA = { series: [] }; })
      .then(function () { var w = WAIT; WAIT = []; w.forEach(function (f) { try { f(DATA); } catch (e) {} }); });
  }
  // Bloque "raw" compatible con D.buildRegion (precio en DKK por 100 kg) o null si no hay serie real.
  function raw(nameKey) {
    var m = MAP[nameKey], s = m && SERIES[m.id];
    if (!s || !s.history || s.history.length < 2) return null;
    return { price: s.latest, changePct: s.changePct == null ? 0 : s.changePct, history: s.history.map(function (p) { return p.value; }), currency: 'DKK', kgPerUnit: 100, period: s.latestPeriod };
  }
  // Fila para el mapa: valor en DKK por la unidad del producto.
  function mapRow(nameKey) {
    var m = MAP[nameKey], s = m && SERIES[m.id];
    if (!s) return null;
    return { value: s.latest * m.unitKg / 100, currency: 'DKK', unit: m.unitKey, change: s.changePct, date: s.latestPeriod, freq: 'monthly' };
  }
  global.DehesaDenmark = { load: load, raw: raw, mapRow: mapRow, has: function (k) { return !!MAP[k]; } };
})(window);
