/* Dehesa Index — Identidad visible del instrumento (cliente y Node). Lee data/instrument-identity.json (curado; ver scripts/build-instrument-identity.py).
   DIIdentity.ready() -> Promise; .get(obsId) / .comparator(pid) -> entrada; .line(e, lang) -> "Harina de soja 46,5–48 % de proteína, Iowa (EE. UU.), FOB";
   .parts(e, lang); .key(e) -> clave de equivalencia (producto+forma+calidad+etapa); .compare(a, b, lang) -> { level, diffs[] } con level:
     'same'      mismo producto, forma, calidad y etapa (el lugar puede diferir: es otro mercado del MISMO instrumento)
     'qualified' misma forma pero difiere calidad, etapa o producto concreto: la diferencia de precio es solo orientativa y se enumera lo que difiere
     'different' difiere el concepto o la forma (p. ej. harina frente a grano, urea frente a fertilizante fosfatado) o uno es un indice: NO se calcula diferencia de precio entre ellos
   ES5. */
(function (root) {
  'use strict';
  var D = null, LANGS = ['es', 'en', 'fr', 'it'];
  var DIM = { product: ['producto', 'product', 'produit', 'prodotto'], form: ['forma', 'form', 'forme', 'forma'], grade: ['calidad', 'grade', 'qualité', 'qualità'], stage: ['etapa de mercado', 'market stage', 'étape de marché', 'fase di mercato'], market: ['mercado', 'market', 'marché', 'mercato'] };
  function li(l) { var i = LANGS.indexOf(l); return i < 0 ? 0 : i; }
  function tx(o, l) { return o ? (o[l] || o.es || '') : ''; }
  function parts(e, l) {
    if (!e) return null;
    return { product: tx(e.product, l), grade: e.grade ? tx(e.grade, l) : '', form: tx(D.forms[e.form], l), stage: tx(D.stages[e.stage], l), market: tx(e.market, l), location: e.location ? tx(e.location, l) : '', unspecifiedStage: e.stage === 'unspecified', index: e.kind === 'index' };
  }
  function line(e, l) {
    var p = parts(e, l); if (!p) return '';
    var where = p.location ? p.location + ' (' + p.market + ')' : p.market;
    return p.product + (p.grade ? ' ' + p.grade : '') + ', ' + where + ', ' + (/^[A-Z][a-z]/.test(p.stage) ? p.stage.charAt(0).toLowerCase() + p.stage.slice(1) : p.stage);
  }
  function key(e) { return e ? [e.concept, e.product.en, e.form, e.grade ? e.grade.en : '', e.stage].join('|') : ''; }
  function compare(a, b, l) {
    if (!a || !b) return { level: 'qualified', diffs: [] };
    var A = parts(a, l), B = parts(b, l), d = [], n = DIM, i = li(l);
    if (a.kind === 'index' || b.kind === 'index' || a.concept !== b.concept) return { level: 'different', diffs: [{ dim: 'product', a: A.product, b: B.product, label: n.product[i] }] };
    if (a.form !== b.form) return { level: 'different', diffs: [{ dim: 'form', a: A.form || A.product, b: B.form || B.product, label: n.form[i] }] };
    if (a.product.en !== b.product.en) d.push({ dim: 'product', a: A.product, b: B.product, label: n.product[i] });
    if ((a.grade ? a.grade.en : '') !== (b.grade ? b.grade.en : '')) d.push({ dim: 'grade', a: A.grade || '—', b: B.grade || '—', label: n.grade[i] });
    if (a.stage !== b.stage) d.push({ dim: 'stage', a: A.stage, b: B.stage, label: n.stage[i] });
    return { level: d.length ? 'qualified' : 'same', diffs: d };
  }
  var F = {
    data: function (d) { if (d) D = d; return D; },
    ready: function () {
      if (D) return Promise.resolve(F);
      if (F._p) return F._p;
      var u = root.DehesaShared && root.DehesaShared.sitePath ? root.DehesaShared.sitePath('data/instrument-identity.json') : 'data/instrument-identity.json';
      return F._p = fetch(u).then(function (r) { if (!r.ok) throw new Error('instrument-identity ' + r.status); return r.json(); }).then(function (d) { D = d; return F; }).catch(function (e) { F._p = null; throw e; });
    },
    get: function (id) { return D && D.instruments[id] || null; },
    comparator: function (pid) { return D && D.comparator[pid] || null; },
    parts: function (e, l) { return D ? parts(e, l) : null; },
    line: function (e, l) { return D ? line(e, l) : ''; },
    key: key,
    compare: function (a, b, l) { return D ? compare(a, b, l) : { level: 'qualified', diffs: [] }; },
    dimLabel: function (dim, l) { return DIM[dim] ? DIM[dim][li(l)] : dim; }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = F; else root.DIIdentity = F;
})(typeof window !== 'undefined' ? window : globalThis);
