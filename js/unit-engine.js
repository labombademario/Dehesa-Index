/* Dehesa Index — Unit Engine central (cliente y Node). Conversion de moneda y de unidad SIN suposiciones ocultas. ES5.
   Usado por comparador.js (y por la ficha de producto y la calculadora). Nunca rellena un hueco con "el ultimo tipo de cambio": si no hay conversion valida, devuelve null y el motivo.

   DIUnits.setFx(fxHistory)                      -> carga data/fx-history.json ({currencies:{USD:[[ym,rate],...]}}; unidades de moneda por 1 EUR, media mensual BCE)
   DIUnits.getHistoricalFx(cur, ym[, maxGap])    -> {rate, ym, method:'exact'|'previous'|'identity', gapMonths} | {rate:null, method:null, reason:'no_fx'}
        exacto del mes; si no existe, el mes ANTERIOR mas cercano dentro de maxGap meses (por defecto 2); si no, null. Nunca un mes posterior ni "el ultimo".
   DIUnits.convertValue(v, s, ym, mode)          -> {value, fx:[...]} | {value:null, reason}   s = {cur, kg} (moneda original y kg por unidad de precio); mode 'eur'|'usd'|'orig'
   DIUnits.convertSeries(points, s, mode, per)   -> {points:[[ym, valor]], skipped, fallbacks}  per: 1000 (por t) o 100 (por 100 kg)
   DIUnits.isConvertible(s, mode, ym)            -> boolean
   DIUnits.formatOriginal(v, unit, lang)         -> '13,50 USD/bu'
   DIUnits.mass.*, DIUnits.area.*                -> factores exactos (bushel por cultivo, cwt, lb, tonelada corta; ha<->acre) */
(function (root) {
  'use strict';
  var FXM = {}, DEFAULT_GAP = 2;
  // kg por bushel: estandar USDA por producto. Un bushel NO es una unidad de masa universal: sin producto no hay conversion.
  var BUSHEL_KG = { trigo: 27.2155, soja: 27.2155, maiz: 25.4012, sorgo: 25.4012, centeno: 25.4012, cebada: 21.7724, avena: 14.5149, arroz: 20.4117, linaza: 25.4012, colza: 22.6796 };
  var MASS = { kg: 1, t: 1000, '100kg': 100, lb: 0.45359237, cwt: 45.359237, short_ton: 907.18474, long_ton: 1016.0469088, q: 100 };
  var HA_PER_ACRE = 0.40468564224;
  function ymAdd(ym, n) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return y + '-' + (m < 9 ? '0' : '') + (m + 1); }
  function validYm(ym) { return typeof ym === 'string' && /^\d{4}-(0[1-9]|1[0-2])/.test(ym); }
  function getHistoricalFx(cur, ym, maxGap) {
    if (cur === 'EUR') return { rate: 1, ym: ym, method: 'identity', gapMonths: 0 };
    var m = FXM[cur]; ym = validYm(ym) ? ym.slice(0, 7) : null;
    if (!m || !ym) return { rate: null, method: null, reason: 'no_fx' };
    if (m[ym] != null) return { rate: m[ym], ym: ym, method: 'exact', gapMonths: 0 };
    var gap = maxGap == null ? DEFAULT_GAP : maxGap;
    for (var g = 1; g <= gap; g++) { var k = ymAdd(ym, -g); if (m[k] != null) return { rate: m[k], ym: k, method: 'previous', gapMonths: g }; }
    return { rate: null, method: null, reason: 'no_fx' };
  }
  function convertValue(v, s, ym, mode) {
    if (v == null || !isFinite(v)) return { value: null, reason: 'no_value' };
    if (mode === 'orig' || mode === 'idx') return { value: v, fx: [] };
    if (!s || !(s.kg > 0)) return { value: null, reason: 'no_unit' };
    var a = getHistoricalFx(s.cur, ym); if (a.rate == null) return { value: null, reason: 'no_fx' };
    var eur = v / a.rate, fx = [a];
    if (mode === 'usd') { var b = getHistoricalFx('USD', ym); if (b.rate == null) return { value: null, reason: 'no_fx' }; eur = eur * b.rate; fx.push(b); }
    return { value: eur, fx: fx };
  }
  function perUnit(value, s, per) { return value / s.kg * per; }
  function convertSeries(points, s, mode, per) {
    var out = [], skipped = 0, fallbacks = 0;
    (points || []).forEach(function (p) {
      var r = convertValue(p[1], s, p[0], mode);
      if (r.value == null) { skipped++; return; }
      if (r.fx.some(function (f) { return f.method === 'previous'; })) fallbacks++;
      out.push([p[0], mode === 'orig' || mode === 'idx' ? r.value : perUnit(r.value, s, per)]);
    });
    return { points: out, skipped: skipped, fallbacks: fallbacks };
  }
  function convert(v, s, ym, mode, per) { var r = convertValue(v, s, ym, mode); if (r.value == null) return r; r.value = (mode === 'orig' || mode === 'idx') ? r.value : perUnit(r.value, s, per); return r; }
  function isConvertible(s, mode, ym) { return convertValue(1, s, ym, mode).value != null; }
  function formatOriginal(v, unit, lang) {
    if (v == null || !isFinite(v)) return '–';
    var d = Math.abs(v) >= 1000 ? 0 : 2;
    try { return v.toLocaleString(lang || 'es', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' ' + unit; } catch (e) { return v.toFixed(d) + ' ' + unit; }
  }
  var U = {
    setFx: function (fx) {
      FXM = {};
      if (fx && fx.currencies) Object.keys(fx.currencies).forEach(function (k) { var m = {}; fx.currencies[k].forEach(function (x) { if (x[1] > 0) m[x[0]] = x[1]; }); FXM[k] = m; });
    },
    getHistoricalFx: getHistoricalFx, convertValue: convertValue, convert: convert, convertSeries: convertSeries, isConvertible: isConvertible, formatOriginal: formatOriginal,
    mass: {
      factors: MASS, bushelKg: function (product) { return BUSHEL_KG[product] || null; },
      // kg que representa una unidad de precio (null si no hay conversion agronomicamente valida: bushel sin cultivo, unidades desconocidas)
      kgPer: function (unit, product) { if (unit === 'bushel' || unit === 'bu') return BUSHEL_KG[product] || null; return MASS[unit] || null; },
      toKg: function (qty, unit, product) { var f = U.mass.kgPer(unit, product); return f == null ? null : qty * f; },
      fromKg: function (kg, unit, product) { var f = U.mass.kgPer(unit, product); return f == null ? null : kg / f; }
    },
    area: { HA_PER_ACRE: HA_PER_ACRE, acreToHa: function (a) { return a * HA_PER_ACRE; }, haToAcre: function (h) { return h / HA_PER_ACRE; } },
    DEFAULT_GAP: DEFAULT_GAP
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = U; else root.DIUnits = U;
})(typeof window !== 'undefined' ? window : globalThis);
