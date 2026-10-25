// Batería grande del buscador (scripts/search-bench.json, generada por gen-search-bench.mjs).
// Para cada pregunta calcula lo que abre Enter en la web: el primer enlace de la respuesta directa si la hay,
// si no el primer resultado de la lista (igual que js/search.js), y lo compara con el destino esperado.
//   node scripts/test-search-bench.mjs              -> resumen por categoría; falla si se baja del mínimo de scripts/search-bench-min.json
//   node scripts/test-search-bench.mjs --fails=cat  -> lista los fallos de una categoría (o «all»)
//   node scripts/test-search-bench.mjs --write-min  -> guarda los aciertos actuales como nuevo mínimo
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'), D = p => path.join(ROOT, 'data', p);
globalThis.window = undefined; globalThis.document = undefined;
require(path.join(ROOT, 'js/search.js'));
globalThis.DIIdentity = require(path.join(ROOT, 'js/instrument-identity.js'));
globalThis.DIUsdaCal = require(path.join(ROOT, 'js/usda-calendar.js'));
const DICite = require(path.join(ROOT, 'js/cite.js')); globalThis.DICite = DICite; DICite.use(JSON.parse(fs.readFileSync(D('license-registry.json'), 'utf8')));
const A = require(path.join(ROOT, 'js/answers.js'));
const S = globalThis.DehesaSearch;
const idx = JSON.parse(fs.readFileSync(D('search-index.json'), 'utf8')).entries; S._load(idx);
const products = A.productsFrom(idx);
const cache = {};
const env = { today: '2026-10-01', products, tokScore: S._tokScore, href: u => u,
  provider: { json: p => { if (!(p in cache)) { try { cache[p] = JSON.parse(fs.readFileSync(D(p), 'utf8')); } catch (e) { cache[p] = null; } } return cache[p] ? Promise.resolve(cache[p]) : Promise.reject(new Error(p)); } } };
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const cases = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/search-bench.json'), 'utf8'))
  // y unas 100 preguntas escritas a mano, revisadas una a una (scripts/search-natural-cases.json): destino exacto, o ninguna respuesta para las que no son del sitio
  .concat(JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/search-natural-cases.json'), 'utf8')).map(c => ({ cat: 'natural', q: c.q, lang: c.lang, exp: c.noAnswer ? { noAnswer: true } : { exact: c.u } })));
const clean = u => String(u || '').replace(/#.*$/, '');
async function dest(q, lang) {
  let a = null; try { a = await A.answer(q, lang, env); } catch (e) { a = null; }
  const t = S._enter(q, lang, a); return { u: t ? clean(t.u) : '', a };
}
// una sección de metodología con el mismo título que una página («Precios de la UE»): vale la página cuyo título empieza igual
const byU = {}; idx.forEach(e => { byU[clean(e.u)] = byU[clean(e.u)] || e; });
const bare = s => S._norm(s);
function sameLead(u, want, l) { const a = byU[u], w = idx.find(e => e.u === want); if (!a || !w || w.t !== 'section') return false; const t = bare(a.n[l]), q = bare(w.n[l]); return t.indexOf(q) === 0; }
function judge(c, r) {
  const e = c.exp, u = r.u;
  if (e.noAnswer) return r.a ? 'respondió (' + r.a.kind + ') a una pregunta que no es del sitio' : null;
  if (e.exact) { const k = x => x.replace(/([?&]s=)[^&]*/, '$1*'); return k(u) === k(e.exact) ? null : 'abre ' + (u || '(nada)') + ' (esperado ' + e.exact + ')'; }
  if (e.urls) { if (!e.urls.map(clean).includes(u) && !(c.cat === 'page' && sameLead(u, e.urls[0], c.lang))) return 'abre ' + (u || '(nada)'); if (e.region && r.a && (r.a.cards || []).some(k => k.region && k.region !== e.region)) return 'muestra otra región'; return null; }
  if (e.prefix) return u.indexOf(e.prefix) === 0 ? null : 'abre ' + (u || '(nada)');
  if (c.cat === 'cprice') {
    if (u.indexOf('paises.html?c=' + e.cc) !== 0) return 'abre ' + (u || '(nada)');
    if (e.none) { if (r.a && (r.a.cards || []).some(k => k.cc && k.cc !== e.cc || !k.cc && !/^de_/.test(r.a.kind))) return 'muestra precios de otro mercado'; return null; }
    const m = /[?&]s=([^&]+)/.exec(u); if (!m) return e.profileOk ? null : 'perfil sin la serie (hay ' + e.series.length + ')';
    return e.series.includes(decodeURIComponent(m[1])) ? null : 'serie que no es del producto: ' + decodeURIComponent(m[1]);
  }
  if (c.cat === 'country') return u.indexOf('paises.html?c=' + e.cc) === 0 ? null : 'abre ' + (u || '(nada)');
  return 'sin regla';
}
const t0 = Date.now(), tot = {}, ok = {}, fails = [];
for (const c of cases) {
  const r = await dest(c.q, c.lang), why = judge(c, r);
  tot[c.cat] = (tot[c.cat] || 0) + 1; if (!why) ok[c.cat] = (ok[c.cat] || 0) + 1; else fails.push({ c, why });
}
let all = 0, good = 0; const rows = Object.keys(tot).map(k => { all += tot[k]; good += ok[k] || 0; return k.padEnd(8) + String(ok[k] || 0).padStart(6) + ' / ' + String(tot[k]).padEnd(6) + ((100 * (ok[k] || 0) / tot[k]).toFixed(1) + ' %').padStart(8); });
console.log(rows.join('\n')); console.log('TOTAL   ' + String(good).padStart(6) + ' / ' + all + '  ' + (100 * good / all).toFixed(1) + ' %   (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
const fc = arg('fails');
if (fc) { const L = fails.filter(f => fc === 'all' || f.c.cat === fc); const lim = +(arg('n') || 60); L.slice(0, lim).forEach(f => console.log('FALLA [' + f.c.cat + '/' + f.c.lang + '] ' + JSON.stringify(f.c.q) + ' -> ' + f.why)); if (L.length > lim) console.log('… y ' + (L.length - lim) + ' más'); }
if (arg('dump')) fs.writeFileSync(arg('dump'), JSON.stringify(fails.map(f => ({ cat: f.c.cat, lang: f.c.lang, q: f.c.q, why: f.why })), null, 0));
const MIN = path.join(ROOT, 'scripts/search-bench-min.json');
// El mínimo es un PORCENTAJE de aciertos por categoría (la batería se regenera con los datos del día, así que el número de preguntas cambia).
// --write-min guarda el porcentaje actual menos 0,3 puntos de margen (las preguntas escritas a mano: 100 %).
const rate = k => (ok[k] || 0) / tot[k];
if (process.argv.includes('--write-min')) { fs.writeFileSync(MIN, JSON.stringify(Object.fromEntries(Object.keys(tot).sort().map(k => [k, k === 'natural' ? 1 : Math.max(0, Math.floor((rate(k) - 0.003) * 1000) / 1000)])), null, 1) + '\n'); console.log('mínimo guardado'); process.exit(0); }
if (fs.existsSync(MIN)) { const m = JSON.parse(fs.readFileSync(MIN, 'utf8')); const low = Object.keys(m).filter(k => tot[k] && rate(k) < m[k]);
  if (low.length) { console.log('POR DEBAJO DEL MÍNIMO: ' + low.map(k => k + ' ' + (100 * rate(k)).toFixed(1) + ' % < ' + (100 * m[k]).toFixed(1) + ' %').join(', ')); process.exit(1); } }
if (fails.some(f => f.c.cat === 'natural') && !fc) fails.filter(f => f.c.cat === 'natural').forEach(f => console.log('FALLA [natural/' + f.c.lang + '] ' + JSON.stringify(f.c.q) + ' -> ' + f.why));
