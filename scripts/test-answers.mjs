// Respuestas del buscador (fase 1): cada pregunta de scripts/answers-cases.json debe producir la intención esperada y,
// cuando hay cifra, esa cifra debe ser EXACTAMENTE la del fichero de datos (nada inventado, nada convertido).
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'), D = p => path.join(ROOT, 'data', p);
globalThis.window = undefined;
globalThis.document = undefined;
require(path.join(ROOT, 'js/search.js'));
const DIIdentity = require(path.join(ROOT, 'js/instrument-identity.js')); globalThis.DIIdentity = DIIdentity;
globalThis.DIUsdaCal = require(path.join(ROOT, 'js/usda-calendar.js'));
const DICite = require(path.join(ROOT, 'js/cite.js')); globalThis.DICite = DICite; DICite.use(JSON.parse(fs.readFileSync(D('license-registry.json'), 'utf8')));
const A = require(path.join(ROOT, 'js/answers.js'));
const idx = JSON.parse(fs.readFileSync(D('search-index.json'), 'utf8')).entries;
const products = idx.filter(e => e.t === 'product').map(e => ({ slug: decodeURIComponent(e.u.split('product=')[1]).split(':')[1], names: e.n, kw: e.k, u: e.u }));
const env = { today: '2026-10-01', products, tokScore: globalThis.DehesaSearch._tokScore, href: u => u,
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
  if (e.calendarCheck) { // cada fecha mostrada es la del fichero oficial (la primera >= hoy)
    const doc = JSON.parse(fs.readFileSync(D('usda-calendar.json'), 'utf8'));
    for (const [id, want] of Object.entries(e.calendarCheck)) {
      const first = doc.releases.filter(r => r.id === id && r.date >= '2026-10-01')[0];
      const got = (a.releases || []).find(r => r.id === id);
      if (!first || first.date !== want) bad(c, 'fecha esperada ' + want + ' no es la del fichero (' + (first && first.date) + ')');
      else if (!got || got.date !== first.date) bad(c, 'respuesta sin la fecha oficial de ' + id);
    }
  }
  if (e.scopes && JSON.stringify((i.scopes || []).slice().sort()) !== JSON.stringify(e.scopes.slice().sort())) bad(c, 'ambitos ' + i.scopes + ' != ' + e.scopes);
  if (e.crop && i.crop !== e.crop) bad(c, 'cultivo ' + i.crop + ' != ' + e.crop);
  if (e.lands && JSON.stringify(i.lands) !== JSON.stringify(e.lands)) bad(c, 'estados ' + i.lands + ' != ' + e.lands);
  if (e.supplyCheck) { // cada cifra del balance USDA es la del fichero (y la campania anterior tambien)
    const sd = JSON.parse(fs.readFileSync(D('supply-demand.json'), 'utf8'));
    if (!a.cards.length) bad(c, 'sin tarjetas');
    for (const k of a.cards) { const com = sd.commodities.find(x => x.id === k.com); if (!com) { bad(c, 'materia ' + k.com); continue; }
      const KEY = { eu: 'European Union', us: 'United States', ca: 'Canada', CN: 'China', BR: 'Brazil', AR: 'Argentina', IN: 'India', UA: 'Ukraine', RU: 'Russia', MX: 'Mexico' };
      const rec = y => k.scope === 'world' ? com.world[y] : (com.countries[KEY[k.scope]] || { years: {} }).years[y];
      if (k.marketYear !== com.latestMarketYear) bad(c, 'campania ' + k.marketYear + ' != ' + com.latestMarketYear);
      for (const r of k.raw) { const cur = rec(k.marketYear), prev = rec(k.marketYear - 1); if (!cur || cur[r.k] !== r.v) bad(c, 'cifra ' + r.k + ' distinta del dato'); if (r.prev !== null && (!prev || prev[r.k] !== r.prev)) bad(c, 'campania anterior ' + r.k + ' distinta del dato'); }
      if (k.period !== com.publishedMonth) bad(c, 'periodo de la cita ' + k.period + ' != ' + com.publishedMonth); }
  }
  if (e.deProdCheck) {
    const ga = JSON.parse(fs.readFileSync(D('germany-agri.json'), 'utf8')), get = (arr, y) => { const f = (arr || []).find(p => p[0] === y); return f ? f[1] : null; };
    if (!a.cards.length) bad(c, 'sin tarjetas');
    for (const k of a.cards) for (const r of k.raw) {
      if (k.scope === 'top') { const lk = r.k.split(':')[1]; if (get(ga.production.land[k.crop][lk].prod, k.year) !== r.v) bad(c, 'top ' + lk + ' distinto del dato'); continue; }
      const src = k.scope === 'DE' ? ga.production.nat[k.crop] : ga.production.land[k.crop][k.scope];
      if (get(src[r.k], k.year) !== r.v) bad(c, r.k + ' de ' + k.scope + ' ' + k.year + ' distinto del dato');
    }
  }
  if (e.deLandCheck) {
    const ga = JSON.parse(fs.readFileSync(D('germany-agri.json'), 'utf8'));
    if (!a.cards.length) bad(c, 'sin tarjetas');
    for (const k of a.cards) { const r = k.raw[0], K = k.kindK, lk = k.scope === 'DE' ? null : k.scope;
      const arr = r.k === 'price' ? (lk ? ga.landPrice.land[lk][K].p : ga.landPrice.nat[K].p) : (lk ? ga.rent.land[lk][K] : ga.rent.nat[K]);
      const last = arr[arr.length - 1]; if (last[0] !== r.y || last[1] !== r.v) bad(c, r.k + ' distinto del ultimo dato publicado'); }
  }
  if (e.moversCheck) {
    const names = new Set(products.map(p => p.slug)), all = []; for (const rg of ['eu', 'us', 'ca', 'uk']) for (const o of latest(rg)) if (typeof o.changePct === 'number' && Math.abs(o.changePct) > 0.0001 && names.has(o.product)) all.push(o);
    const regs = i.regions && i.regions.length ? i.regions : ['eu', 'us', 'ca', 'uk'], pool = all.filter(o => regs.includes(o.region));
    for (const k of a.cards) { const r = k.raw[0], o = pool.find(x => x.id === r.id); if (!o || o.changePct !== r.v) bad(c, 'variacion de ' + r.id + ' distinta del dato'); }
    for (const side of ['up', 'down']) { const L = a.cards.filter(k => k.side === side); if (!L.length) continue;
      const want = pool.filter(o => side === 'up' ? o.changePct > 0 : o.changePct < 0).sort((x, y) => side === 'up' ? y.changePct - x.changePct : x.changePct - y.changePct).slice(0, L.length);
      if (JSON.stringify(L.map(k => k.raw[0].id)) !== JSON.stringify(want.map(o => o.id))) bad(c, 'el orden/seleccion de ' + side + ' no es el de los datos'); }
  }
  if (e.compareCheck) {
    if (!a.cards.length || a.cards.length % 2) bad(c, 'tarjetas de comparacion impares: ' + a.cards.length);
    for (const k of a.cards) { const o = latest(k.region).find(x => x.id === k.id); if (!o || o.value !== k.value) bad(c, 'cifra distinta del dato ' + k.id); }
    const prods = new Set(a.cards.map(k => k.product)); if (prods.size !== 2) bad(c, 'debian ser 2 productos y son ' + prods.size);
  }
  if (e.hasLink && !a.link) bad(c, 'sin enlace');
  const html = A.render(a, c.lang, s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'));
  if (!html || /undefined|NaN|\[object/.test(html)) bad(c, 'HTML con undefined/NaN');
  // cada cifra mostrada lleva su cita (fuente registrada + periodo del propio dato)
  for (const k of a.cards || []) {
    if (!k.sid) { bad(c, 'tarjeta sin fuente (sid)'); continue; }
    if (!DICite.entry(k.sid)) bad(c, 'fuente ' + k.sid + ' no esta en el registro de licencias');
    else if (!html.includes('data-src="' + k.sid + '"')) bad(c, 'cita de ' + k.sid + ' ausente en el HTML');
    const per = k.period || k.date || k.year; if (per && !html.includes(DICite.per(String(per)).replace(/&/g, '&amp;'))) bad(c, 'cita sin el periodo ' + per);
  }
  for (const k of a.cites || []) if (!html.includes('data-src="' + k.sid + '"')) bad(c, 'cita ' + k.sid + ' ausente');
}
console.log(cases.length + ' preguntas, ' + fail + ' fallos');
process.exit(fail ? 1 : 0);
