/* Dehesa Index — traducción de etiquetas de series (auditoría 8-oct-2026). ES5; navegador (window.DILabelTl) y Node (module.exports).
   Regla: una etiqueta se traduce solo si TODAS sus partes están en el glosario (data/label-gloss/<lang>.json) o son códigos, cifras,
   fuentes o nombres propios; si falta una sola parte se deja la etiqueta original en inglés. Nunca se traduce a ojo. */
(function (root) {
  'use strict';
  var G = {}, P = {};
  var SPLIT = /(\s*[:,()·;]\s*|\s+[-–]\s+)/;
  var PASS = /^([A-Z0-9][A-Z0-9 \/&.\-+]*|[\d=.,%\s\-–\/]+|HS [\d\-]+|\d{4}(-\d{2})?(\/\d{2,4})?|[A-Z][a-z]?\d*)$/;
  var TPL = { es: { to: 'exportaciones a {c}', dto: 'exportaciones nacionales a {c}', from: 'importaciones desde {c}', cexp: 'exportaciones de {c}', cimp: 'importaciones de {c}' },
    fr: { to: 'exportations vers {c}', dto: 'exportations nationales vers {c}', from: 'importations depuis {c}', cexp: 'exportations : {c}', cimp: 'importations : {c}' },
    it: { to: 'esportazioni verso {c}', dto: 'esportazioni nazionali verso {c}', from: 'importazioni da {c}', cexp: 'esportazioni: {c}', cimp: 'importazioni: {c}' } };
  function part(p, g) {
    var s = p.trim(); if (!s) return p;
    var k = s.toLowerCase();
    if (g.t[k] != null) return g.t[k];
    if (g.keepSet[s] || PASS.test(s) || /^\u00a7\d+\u00a7$/.test(s)) return s;
    var m, T = TPL[g.lang];
    if ((m = /^Domestic exports to (.+)$/.exec(s)) && g.t[m[1].toLowerCase()]) return T.dto.replace('{c}', g.t[m[1].toLowerCase()]);
    if ((m = /^Exports to (.+)$/i.exec(s)) && g.t[m[1].toLowerCase()]) return T.to.replace('{c}', g.t[m[1].toLowerCase()]);
    if ((m = /^Imports from (.+)$/i.exec(s)) && g.t[m[1].toLowerCase()]) return T.from.replace('{c}', g.t[m[1].toLowerCase()]);
    if ((m = /^(.+) (exports|imports)$/.exec(s)) && g.t[m[1].toLowerCase()]) return (m[2] === 'exports' ? T.cexp : T.cimp).replace('{c}', g.t[m[1].toLowerCase()]);
    return null;
  }
  function tl(label, lang) {
    var g = G[lang]; if (!g || !label) return label;
    // frases que contienen comas («farm, fishing and food»): se sustituyen enteras antes de partir la etiqueta
    var src = String(label), held = [];
    for (var q = 0; q < g.multi.length; q++) { var k0 = g.multi[q], at = src.toLowerCase().indexOf(k0); if (at > -1) { held.push(g.t[k0]); src = src.slice(0, at) + '\u00a7' + (held.length - 1) + '\u00a7' + src.slice(at + k0.length); } }
    var bits = src.split(SPLIT), out = [];
    for (var i = 0; i < bits.length; i++) {
      if (i % 2) { out.push(bits[i]); continue; }   // separador
      if (!bits[i].trim()) { out.push(bits[i]); continue; }
      var r = part(bits[i], g); if (r == null) return label;   // una parte sin traduccion: etiqueta original
      out.push(r);
    }
    var s = out.join('').replace(/\u00a7(\d+)\u00a7/g, function (m, i) { return held[+i]; });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function use(lang, doc) { var ks = {}; (doc.keep || []).forEach(function (k) { ks[k] = 1; }); var t0 = doc.t || {}; G[lang] = { lang: lang, t: t0, keepSet: ks, multi: Object.keys(t0).filter(function (k) { return /[,:(]/.test(k); }).sort(function (a, b) { return b.length - a.length; }) }; }
  function load(lang) {
    if (lang === 'en' || G[lang]) return Promise.resolve(true);
    if (P[lang]) return P[lang];
    var sp = root.DehesaShared && root.DehesaShared.sitePath ? root.DehesaShared.sitePath : function (u) { return u; };
    return P[lang] = fetch(sp('data/label-gloss/' + lang + '.json')).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d) use(lang, d); return !!d; }).catch(function () { P[lang] = null; return false; });
  }
  var API = { tl: tl, load: load, use: use, _part: function (p, lang) { return G[lang] ? part(p, G[lang]) : null; }, ready: function (lang) { return lang === 'en' || !!G[lang]; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.DILabelTl = API;
})(typeof window !== 'undefined' ? window : globalThis);
