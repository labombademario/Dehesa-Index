/* Dehesa Index — utilidades comunes de comparacion con el mercado (comparador de facturas y Mis compras): numeros y fechas de usuario, y
   el dato de mercado que corresponde a una fecha. Mensual: el mismo mes. Trimestral: el mismo trimestre. Semanal: la ultima cotizacion de los
   14 dias anteriores. Diaria: la de los 7 dias anteriores. Sin dato = null (nunca se rellena ni se estima). ES5. */
(function () {
  'use strict';
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  /* «1.500» o «1,000» pueden ser 1,5 o 1500 (decimal o miles): no se adivina, se rechaza y se pide escribirlo sin ambiguedad */
  function amb(s) {
    var m = /^(-?)([1-9]\d{0,2})[.,](\d{3})$/.exec(String(s == null ? '' : s).trim().replace(/\s/g, ''));
    return m ? { raw: m[0], dec: parseFloat(m[1] + m[2] + '.' + m[3]), thou: parseInt(m[1] + m[2] + m[3], 10) } : null;
  }
  var AMB = {
    es: 'Número ambiguo: «{r}» puede ser {a} o {b}. Escríbelo sin separador de miles (por ejemplo {b}) o con coma decimal (por ejemplo {a}).',
    en: 'Ambiguous number: “{r}” could be {a} or {b}. Write it without a thousands separator (for example {b}) or with a decimal point (for example {a}).',
    fr: 'Nombre ambigu : « {r} » peut être {a} ou {b}. Écrivez-le sans séparateur de milliers (par exemple {b}) ou avec une virgule décimale (par exemple {a}).',
    it: 'Numero ambiguo: «{r}» può essere {a} o {b}. Scrivilo senza separatore delle migliaia (ad esempio {b}) o con la virgola decimale (ad esempio {a}).'
  };
  function ambMsg(s, l) {
    var a = amb(s); if (!a) return '';
    var dot = l === 'en' ? '.' : ',', A = String(a.dec).replace('.', dot);
    return (AMB[l] || AMB.es).replace(/\{r\}/g, a.raw).replace(/\{a\}/g, A).replace(/\{b\}/g, String(a.thou));
  }
  function num(s) {
    s = String(s == null ? '' : s).trim().replace(/\s/g, '');
    if (amb(s)) return NaN;
    var c = s.lastIndexOf(','), d = s.lastIndexOf('.');
    if (c > -1 && d > -1) s = c > d ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');   /* 1.234,56 (ES/FR/IT) o 1,234.56 (EN): gana el ultimo separador */
    else if (d > -1 && s.indexOf('.') !== d) s = s.replace(/\./g, '');                              /* 1.234.567 */
    else if (c > -1 && s.indexOf(',') !== c) s = s.replace(/,/g, '');                                /* 1,234,567 */
    else s = s.replace(',', '.');                                                                     /* 12,5 = 12.5 (una sola coma es decimal) */
    return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
  }
  function parseDate(s) {
    var m; s = String(s).trim();
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s))) return valid(m[1] + '-' + pad(+m[2]) + '-' + pad(+m[3]));
    if ((m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(s))) return valid(m[3] + '-' + pad(+m[2]) + '-' + pad(+m[1]));
    return null;
  }
  function valid(d) { var p = d.split('-'), t = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); return (t.getUTCFullYear() === +p[0] && t.getUTCMonth() === +p[1] - 1 && t.getUTCDate() === +p[2]) ? d : null; }
  function dayT(d) { var p = d.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function pointT(d) { var m; if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d))) return Date.UTC(+m[1], +m[2] - 1, +m[3]); return NaN; }
  function lookup(s, date) {
    var pts = s.points, i, y = date.slice(0, 4), mo = +date.slice(5, 7);
    if (s.frequency === 'monthly') { var k = y + '-' + pad(mo); for (i = 0; i < pts.length; i++) if (pts[i][0].slice(0, 7) === k) return pts[i]; return null; }   /* algunas series mensuales traen el dia (fin de mes): el mes es lo que cuenta */
    if (s.frequency === 'quarterly') { var q = y + '-Q' + Math.ceil(mo / 3); for (i = 0; i < pts.length; i++) if (pts[i][0] === q) return pts[i]; return null; }
    var tt = dayT(date), tol = (s.frequency === 'daily' ? 7 : 14) * 86400000, best = null;
    for (i = 0; i < pts.length; i++) { var pt = pointT(pts[i][0]); if (!isNaN(pt) && pt <= tt && tt - pt <= tol) best = pts[i]; }
    return best;
  }
  window.DehesaLookup = { pad: pad, num: num, amb: amb, ambMsg: ambMsg, parseDate: parseDate, dayT: dayT, pointT: pointT, lookup: lookup };
})();
