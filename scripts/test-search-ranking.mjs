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
console.log(cases.length + ' consultas, ' + fail + ' fallos');
process.exit(fail ? 1 : 0);
