// Respuestas del buscador (fase 1): cada pregunta de scripts/answers-cases.json debe producir la intención esperada y,
// cuando hay cifra, esa cifra debe ser EXACTAMENTE la del fichero de datos (nada inventado, nada convertido).
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'), D = p => path.join(ROOT, 'data', p);
globalThis.window = undefined;
globalThis.document = undefined;
require(path.join(ROOT, 'js/search.js'));
const DIIdentity = require(path.join(ROOT, 'js/instrument-identity.js')); globalThis.DIIdentity = DIIdentity;
const A = require(path.join(ROOT, 'js/answers.js'));
const idx = JSON.parse(fs.readFileSync(D('search-index.json'), 'utf8')).entries;
const products = idx.filter(e => e.t === 'product').map(e => ({ slug: decodeURIComponent(e.u.split('product=')[1]).split(':')[1], names: e.n, kw: e.k, u: e.u }));
const env = { products, tokScore: globalThis.DehesaSearch._tokScore, href: u => u,
  provider: { json: p => new Promise((res, rej) => { try { res(JSON.parse(fs.readFileSync(D(p), 'utf8'))); } catch (e) { rej(e); } }) } };
const cases = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/answers-cases.json'), 'utf8'));
const latest = r => JSON.parse(fs.readFileSync(D('prices/latest/' + r + '.json'), 'utf8')).observations;
let fail = 0;
const bad = (c, m) => { fail++; console.log('FALLA', JSON.stringify(c.q), '(' + c.lang + '):', m); };
for (const c of cases) {
  const a = await A.answer(c.q, c.lang, env);
  if (c.expect === null) { if (a) bad(c, 'no debía responder y devolvió ' + a.intent.kind); continue; }
  if (!a) { bad(c, 'no respondió (esperaba ' + c.expect.kind + ')'); continue; }
  const e = c.expect, i = a.intent;
  if (e.kind && i.kind !== e.kind) bad(c, 'kind ' + i.kind + ' != ' + e.kind);
  if (e.product && i.product !== e.product) bad(c, 'producto ' + i.product + ' != ' + e.product);
  if (e.regions && JSON.stringify(i.regions.slice().sort()) !== JSON.stringify(e.regions.slice().sort())) bad(c, 'regiones ' + i.regions + ' != ' + e.regions);
  if (e.state && i.states[0] !== e.state) bad(c, 'estado ' + i.states + ' != ' + e.state);
  if (e.cardRegions) { const got = a.cards.map(x => x.region).sort(); if (JSON.stringify(got) !== JSON.stringify(e.cardRegions.slice().sort())) bad(c, 'tarjetas de ' + got + ' != ' + e.cardRegions); }
  if (e.noCards && a.cards.length) bad(c, 'no debía haber tarjetas');
  if (e.mustMatchData && a.cards.length) { // cada cifra mostrada es la observación original
    for (const k of a.cards) { const o = latest(k.region).find(x => x.id === k.id); if (!o || o.value !== k.value || o.observationDate !== k.date) bad(c, 'cifra distinta de la del dato ' + k.id); }
  }
  if (e.nCards !== undefined && a.cards.length !== e.nCards) bad(c, 'tarjetas ' + a.cards.length + ' != ' + e.nCards);
  if (e.tradeCheck) { // cada cifra de comercio es la última observación del catálogo del país
    for (const k of a.cards) { const cat = JSON.parse(fs.readFileSync(D('catalog/' + k.cc + '.json'), 'utf8')).series.find(x => x.id === k.id); if (!cat || cat.latest !== k.value || cat.latestPeriod !== k.date) bad(c, 'cifra de comercio distinta del dato ' + k.id); }
  }
  if (e.hasLink && !a.link) bad(c, 'sin enlace');
  const html = A.render(a, c.lang, s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'));
  if (!html || /undefined|NaN|\[object/.test(html)) bad(c, 'HTML con undefined/NaN');
}
console.log(cases.length + ' preguntas, ' + fail + ' fallos');
process.exit(fail ? 1 : 0);
