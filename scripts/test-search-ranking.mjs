// Orden de los resultados del buscador (js/search.js): cada consulta de scripts/search-cases.json debe traer la entrada esperada
// dentro de las N primeras (por URL o por titulo). Solo lee el indice estatico; no necesita navegador ni servidor.
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
globalThis.window = undefined; globalThis.document = undefined;
require(path.join(ROOT, 'js/search.js'));
const S = globalThis.DehesaSearch;
S._load(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/search-index.json'), 'utf8')).entries);
const cases = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/search-cases.json'), 'utf8'));
let fail = 0;
for (const c of cases) {
  if (c.none) { const got = S._search(c.q, c.lang).list; if (got.length) { fail++; console.log('FALLA', JSON.stringify(c.q), '(' + c.lang + '): no debía traer resultados y trajo', got.slice(0, 3).map(e => (e.n[c.lang] || e.n.es).slice(0, 30)).join(' ; ')); } continue; }
  const top = S._search(c.q, c.lang).list.slice(0, c.top);
  const ok = top.some(e => (c.u && new RegExp(c.u).test(e.u)) || (c.title && new RegExp(c.title).test(e.n[c.lang] || e.n.es)));
  if (!ok) { fail++; console.log('FALLA', JSON.stringify(c.q), '(' + c.lang + ', top ' + c.top + '):', top.map(e => (e.n[c.lang] || e.n.es).slice(0, 30) + ' [' + e.t + ']').join(' ; ') || '(nada)'); }
}
// Cada fruta, hortaliza y fruto seco con ficha propia debe salir en las 3 primeras al buscarlo por su nombre en los 4 idiomas, en singular y en plural
{
  const FV = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/fv-products.json'), 'utf8')).products;
  const PL = { es: n => /z$/.test(n) ? n.slice(0, -1) + 'ces' : /[aeiouáéíóú]$/.test(n) ? n + 's' : /[sx]$/.test(n) ? n : n + 'es', en: n => /(s|x|ch|sh|o)$/.test(n) ? n + 'es' : /[^aeiou]y$/.test(n) ? n.slice(0, -1) + 'ies' : n + 's', fr: n => /[sxz]$/.test(n) ? n : n + 's' };
  let n = 0;
  for (const p of FV) for (const l of ['es', 'en', 'fr', 'it']) {
    const base = p.name[l].replace(/ \(.*\)/, '').toLowerCase();
    for (const q of l === 'it' ? [base] : [base, PL[l](base)]) {
      n++; const top = S._search(q, l).list.slice(0, 3);
      if (!top.some(e => e.u === 'producto.html?p=' + p.id)) { fail++; console.log('FALLA', JSON.stringify(q), '(' + l + ') no trae la ficha ' + p.id + ':', top.map(e => (e.n[l] || e.n.es).slice(0, 25) + ' [' + e.t + ']').join(' ; ') || '(nada)'); }
    }
  }
  console.log(n + ' nombres de fichas de fruta, hortaliza y fruto seco comprobados');
}
// Cada país, producto, categoría, oferta/demanda y sección debe salir entre los 3 primeros al buscarlo por su título (hasta 3 palabras) en los 4 idiomas
{
  const E = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/search-index.json'), 'utf8')).entries; let n = 0; const cnt = {}; for (const e of E) for (const l of ['es', 'en', 'fr', 'it']) { const k = l + '|' + (e.n[l] || '').replace(/ \(.*\)/, ''); cnt[k] = (cnt[k] || 0) + 1; }
  const many = (l, q) => E.filter(e => (e.n[l] || '').toLowerCase().startsWith(q.toLowerCase() + ',')).length > 3;   // «Gasolio alla pompa, Regina…»: familia con muchas variantes
  for (const t of ['country', 'product', 'category', 'supply', 'section']) for (const e of E) { if (e.t !== t) continue;
    for (const l of ['es', 'en', 'fr', 'it']) { const q = (e.n[l] || '').replace(/ \(.*\)/, ''); if (!q || q.split(/\s+/).length > 3 || q.length < 3 || cnt[l + '|' + q] > 1 || many(l, q)) continue;   // títulos repetidos (p. ej. «Gasolio alla pompa» de varias ciudades) son ambiguos
      n++; const top = S._search(q, l).list.slice(0, 3);
      if (!top.some(x => x.u === e.u || x.n[l] === e.n[l])) { fail++; console.log('FALLA', JSON.stringify(q), '(' + l + ', ' + t + ') no trae su propia entrada:', top.map(x => (x.n[l] || x.n.es).slice(0, 25)).join(' ; ')); } } }
  console.log(n + ' títulos de países, productos, categorías, secciones y oferta/demanda comprobados');
}
// Erratas: cada ficha de fruta/hortaliza/fruto seco (nombres de una palabra, 6+ letras) debe salir en las 3 primeras con una letra cambiada de orden, quitada o repetida (tolerancia: 1 % de fallos)
{
  const FV = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/fv-products.json'), 'utf8')).products; let n = 0, bad = [];
  for (const p of FV) for (const l of ['es', 'en', 'fr', 'it']) { const w = p.name[l].replace(/ \(.*\)/, '').toLowerCase(); if (w.includes(' ') || w.length < 6) continue;
    const m = Math.floor(w.length / 2), v = [w.slice(0, m) + w[m + 1] + w[m] + w.slice(m + 2), w.slice(0, m) + w.slice(m + 1), w.slice(0, m) + w[m] + w.slice(m)];
    for (const q of v) { if (q === w) continue; n++; if (!S._search(q, l).list.slice(0, 3).some(e => e.u === 'producto.html?p=' + p.id)) bad.push(l + ':' + q + '→' + w); } }
  if (bad.length > Math.ceil(n * 0.01)) { fail++; console.log('FALLA erratas: ' + bad.length + ' de ' + n + ':', bad.join(' | ')); }
  console.log(n + ' erratas de nombres de fichas comprobadas (' + bad.length + ' sin resolver, tolerancia 1 %)');
}
console.log(cases.length + ' consultas, ' + fail + ' fallos');
process.exit(fail ? 1 : 0);
