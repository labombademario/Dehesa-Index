/* Dehesa Index — selector de periodo comun para graficas de serie temporal (3 m, 6 m, 1, 3, 5, 10 anos, Max). ES5.
   DIRange.title(lang)              -> texto de la etiqueta ("Periodo")
   DIRange.options(sel, lang, len)  -> <option>... ; sel = meses seleccionados (0 = maximo); len = meses que cubre la serie (oculta rangos mayores que ella)
   DIRange.cut(arr, n)              -> puntos [['YYYY-MM...', v]] de los ultimos n meses (0 = todos) */
(function () {
  'use strict';
  var R = [3, 6, 12, 36, 60, 120, 0];
  var L = {
    es: { t: 'Periodo', 3: '3 meses', 6: '6 meses', 12: '1 año', 36: '3 años', 60: '5 años', 120: '10 años', 0: 'Máx.' },
    en: { t: 'Period', 3: '3 months', 6: '6 months', 12: '1 year', 36: '3 years', 60: '5 years', 120: '10 years', 0: 'Max' },
    fr: { t: 'Période', 3: '3 mois', 6: '6 mois', 12: '1 an', 36: '3 ans', 60: '5 ans', 120: '10 ans', 0: 'Max' },
    it: { t: 'Periodo', 3: '3 mesi', 6: '6 mesi', 12: '1 anno', 36: '3 anni', 60: '5 anni', 120: '10 anni', 0: 'Max' }
  };
  function ym(p) { var m = /^(\d{4})(?:-(\d{2}))?/.exec(String(p)); return m ? (+m[1]) * 12 + (m[2] ? +m[2] - 1 : 0) : NaN; }
  function span(arr) { return arr && arr.length > 1 ? ym(arr[arr.length - 1][0]) - ym(arr[0][0]) + 1 : 0; }
  function cut(arr, n) {
    if (!n || !arr || !arr.length) return arr;
    var lim = ym(arr[arr.length - 1][0]) - n; if (lim !== lim) return arr;
    var out = arr.filter(function (x) { return ym(x[0]) > lim; });
    return out.length >= 2 ? out : arr.slice(-2);
  }
  function options(sel, lang, arr) {
    var l = L[lang] || L.es, len = typeof arr === 'number' ? arr : span(arr), shown = [], hasBigger = false;
    R.forEach(function (n) { if (n === 0 || !len || n < len || !hasBigger) { shown.push(n); if (n && len && n >= len) hasBigger = true; } });
    if (shown.indexOf(sel) < 0) shown.push(sel);
    shown.sort(function (a, b) { return (a || 1e9) - (b || 1e9); });
    return shown.map(function (n) { return '<option value="' + n + '"' + (n === sel ? ' selected' : '') + '>' + l[n] + '</option>'; }).join('');
  }
  window.DIRange = { title: function (lang) { return (L[lang] || L.es).t; }, options: options, cut: cut, span: span };
})();
