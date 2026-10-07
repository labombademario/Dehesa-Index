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
  ok(Array.isArray(p.points) && p.points.every(x => iso(x[0]) && typeof x[1] === 'number'), p.id + ': puntos mal formados');
  ok(p.points.every((x, i, a) => i === 0 || a[i - 1][0] < x[0]), p.id + ': puntos desordenados');
  if (p.yearAgo) ok(iso(p.yearAgo.date) && typeof p.yearAgo.value === 'number', p.id + ': yearAgo mal formado');
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
const bytes = Object.values(man.files).reduce((a, f) => a + f.bytes, 0);
ok(bytes < 400 * 1024, 'app views: mas de 400 KB (' + bytes + ')');
console.log(`app views: ${checks} comprobaciones, ${fails} fallos`);
process.exit(fails ? 1 : 0);
