#!/usr/bin/env node
// Cifras clave de Irlanda (CSO) y Hungria (KSH) en la ficha de pais (js/farm-headlines.js): las cifras = data/views/farm-headlines/<CC>.json, 2 graficas,
// sin undefined/NaN ni desborde a 390 px, fuente citada con su licencia. 4 idiomas, 1280/390. Servidor local en :8123.
// Uso: node scripts/test-farm-headlines.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const nrm = s => s.replace(/[., \s  ]/g, '');
const V = cc => JSON.parse(fs.readFileSync('data/views/farm-headlines/' + cc + '.json', 'utf8'));
const KEY = { IE: ['ie-cso-ara02-median-price-p-all-land-types-ireland', 'ie-cso-aka01-intake-of-cows-milk-by-m-domestic'], HU: ['hu-ksh-0009-arable-land-agricultural-land-pr', 'hu-ksh-0015-wheat'] };
for (const cc of ['IE', 'HU']) {
  const d = V(cc); ok(cc + ' vista con >=6 series', d.series.length >= 6);
  for (const id of KEY[cc]) ok(cc + ' serie ' + id, d.series.some(s => s.id === id));
}
for (const cc of ['IE', 'HU']) for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const tag = cc + ' ' + lang + '@' + w;
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/paises.html?c=' + cc, { waitUntil: 'networkidle' });
  await page.evaluate(() => { const e = document.getElementById('pp-farm-head'); if (e) e.scrollIntoView(); });
  await page.waitForSelector('#ps-farm-headlines', { timeout: 15000 }).catch(() => {});
  const r = await page.evaluate(() => { const s = document.getElementById('ps-farm-headlines'); return s ? { t: s.innerText, rows: s.querySelectorAll('.di-info-stat-row').length, svg: s.querySelectorAll('svg.wp-svg').length, link: !!s.querySelector('a[href^="http"]'), over: document.documentElement.scrollWidth > window.innerWidth + 2 } : null; });
  ok(tag + ' bloque presente', !!r);
  if (r) {
    ok(tag + ' 11 cifras y 2 graficas', r.rows === 11 && r.svg === 2);
    ok(tag + ' sin undefined/NaN', !/undefined|NaN/.test(r.t));
    ok(tag + ' fuente enlazada con licencia', r.link && /CC BY 4\.0/.test(r.t));
    ok(tag + ' sin desborde horizontal', !r.over);
    const d = V(cc), s0 = d.series.find(s => s.id === KEY[cc][0]); ok(tag + ' cifra = JSON', nrm(r.t).indexOf(nrm(String(Math.round(s0.latest)))) > -1);
  }
  ok(tag + ' sin errores de consola (' + errs.join('; ') + ')', errs.length === 0);
  await ctx.close();
}
await browser.close();
if (fail) { console.log('FALLOS', fail); process.exit(1); }
console.log('OK test-farm-headlines');
