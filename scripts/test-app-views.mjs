#!/usr/bin/env node
// Contrato de data/app/v1 (lo que lee la app movil). Si un pipeline cambia un campo, esto falla antes de romper la app publicada.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data', 'app', 'v1');
const LANGS = ['es', 'en', 'fr', 'it'];
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'license-registry.json'), 'utf8')).sources;
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('FALLA', m); } };
const load = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const four = (o, m) => ok(o && LANGS.every(l => typeof o[l] === 'string' && o[l].trim()), m + ': faltan idiomas');
const iso = s => typeof s === 'string' && /^\d{4}-\d{2}(-\d{2})?$/.test(s);
const today = new Date().toISOString().slice(0, 10);

const man = load('manifest.json');
ok(man.schemaVersion === 1, 'manifest: schemaVersion');
for (const f of ['prices.json', 'today.json', 'news.json', 'countries.json', 'sections.json']) {
  ok(man.files[f] && man.files[f].hash, 'manifest: falta ' + f);
  const d = load(f); ok(d.hash === man.files[f].hash, f + ': hash distinto del manifiesto');
}
const P = load('prices.json').prices;
ok(P.length >= 20, 'prices: menos de 20 precios');
const ids = new Set();
for (const p of P) {
  ok(!ids.has(p.id), 'prices: id repetido ' + p.id); ids.add(p.id);
  four(p.name, p.id + '.name'); four(p.place, p.id + '.place'); four(p.unit, p.id + '.unit');
  ok(typeof p.value === 'number' && isFinite(p.value), p.id + ': valor no numerico');
  ok(iso(p.date) && p.date.slice(0, 10) <= today, p.id + ': fecha invalida o futura ' + p.date);
  ok(reg[p.sourceId] && reg[p.sourceId].status === 'VERIFIED', p.id + ': fuente sin licencia verificada ' + p.sourceId);
  ok(typeof p.sourceName === 'string' && p.sourceName.length > 1, p.id + ': sin nombre de fuente');
  ok(Array.isArray(p.points) && p.points.every(x => iso(x[0]) && typeof x[1] === 'number'), p.id + ': puntos mal formados');
  ok(p.points.every((x, i, a) => i === 0 || a[i - 1][0] < x[0]), p.id + ': puntos desordenados');
  if (p.yearAgo) ok(iso(p.yearAgo.date) && typeof p.yearAgo.value === 'number', p.id + ': yearAgo mal formado');
}
// Historico completo (data/app/v1/history/<id>.json): ordenado, sin fechas repetidas y consistente con el precio
for (const p of P) {
  const f = path.join(DIR, 'history', p.id.replace(/[^A-Za-z0-9_.-]/g, '_') + '.json');
  if (!fs.existsSync(f)) continue;
  const h = JSON.parse(fs.readFileSync(f, 'utf8'));
  ok(h.id === p.id, 'history ' + p.id + ': id');
  ok(h.points.length >= p.points.length, 'history ' + p.id + ': menos puntos que el grafico corto');
  ok(h.points.every((x, i, a) => iso(x[0]) && typeof x[1] === 'number' && (i === 0 || a[i - 1][0] < x[0])), 'history ' + p.id + ': puntos mal formados o desordenados');
  ok(p.points.length === 0 || h.points.at(-1)[0] === p.points.at(-1)[0], 'history ' + p.id + ': el ultimo punto no coincide');
}
const T = load('today.json');
ok(!T.index || typeof T.index.value === 'number', 'today: indice');
ok(Array.isArray(T.calendar) && T.calendar.every(e => /Z$/.test(e.at) && e.name), 'today: calendario sin hora UTC');
const N = load('news.json').news;
ok(N.every(n => n.title && /^https?:\/\//.test(n.url) && n.source), 'news: titular, medio o enlace');
ok(N.every(n => !('x' in n) && !('text' in n)), 'news: no se publica el texto de las noticias');
const C = load('countries.json').countries;
ok(C.length >= 10, 'countries: menos de 10');
C.forEach(c => { four(c.name, 'country ' + c.code); ok(c.coveragePct === null || (c.coveragePct >= 0 && c.coveragePct <= 100), 'country ' + c.code + ': cobertura'); });
const S = load('sections.json').sections;
ok(S.length >= 15, 'sections: menos de 15');
S.forEach(s => { four(s.name, 'section ' + s.id); ok(/^https:\/\/dehesaindex\.com\//.test(s.url), 'section ' + s.id + ': url');
  if (s.figure) { four(s.figure.label, 'section ' + s.id + '.label'); ok(s.figure.sourceId === 'dehesa' || (reg[s.figure.sourceId] && reg[s.figure.sourceId].status === 'VERIFIED'), 'section ' + s.id + ': fuente ' + s.figure.sourceId); } });
// Fichas de pais (data/app/v1/country/<CC>.json): se bajan una a una al abrir el pais, no cuentan en el tope de arriba
const PC = man.countries || {}; const LT = { n: 0, ok: 0 };
ok(Object.keys(PC).length >= 10, 'country profiles: menos de 10');
for (const [cc, m] of Object.entries(PC)) {
  const d = load('country/' + cc + '.json');
  ok(d.hash === m.hash && d.country === cc, 'country ' + cc + ': hash o codigo distinto del manifiesto');
  ok(C.some(c => c.code === cc), 'country ' + cc + ': no esta en countries.json');
  ok(m.bytes < 150 * 1024, 'country ' + cc + ': ficha de mas de 150 KB (' + m.bytes + ')');
  ok(Array.isArray(d.groups) && d.groups.length > 0, 'country ' + cc + ': sin grupos');
  const sid = new Set();
  for (const g of d.groups) {
    four(g.title, 'country ' + cc + ' grupo ' + g.id);
    ok(g.series.length > 0 && g.series.length <= 8, 'country ' + cc + ' ' + g.id + ': numero de series');
    for (const sr of g.series) {
      ok(!sid.has(sr.id), 'country ' + cc + ': serie repetida ' + sr.id); sid.add(sr.id);
      ok(sr.label && sr.unit && typeof sr.latest === 'number' && isFinite(sr.latest), 'country ' + cc + ' ' + sr.id + ': etiqueta, unidad o valor');
      if (sr.labelT) four(sr.labelT, 'country ' + cc + ' ' + sr.id + '.labelT'); LT.n++; if (sr.labelT) LT.ok++;
      ok(typeof sr.period === 'string' && /^\d{4}/.test(sr.period), 'country ' + cc + ' ' + sr.id + ': periodo');
      ok(reg[sr.sourceId] && reg[sr.sourceId].status === 'VERIFIED', 'country ' + cc + ' ' + sr.id + ': fuente ' + sr.sourceId);
      ok(Array.isArray(sr.points) && sr.points.every(x => typeof x[0] === 'string' && typeof x[1] === 'number'), 'country ' + cc + ' ' + sr.id + ': puntos');
    }
  }
}
ok(LT.n === 0 || LT.ok / LT.n >= 0.9, 'country profiles: solo ' + LT.ok + '/' + LT.n + ' etiquetas traducidas (falta anadir a data/app/labels-i18n.json)');
const bytes = Object.values(man.files).reduce((a, f) => a + f.bytes, 0);
ok(bytes < 400 * 1024, 'app views: mas de 400 KB (' + bytes + ')');
console.log(`app views: ${checks} comprobaciones, ${fails} fallos`);
process.exit(fails ? 1 : 0);
