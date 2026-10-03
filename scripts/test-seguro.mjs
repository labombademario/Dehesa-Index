#!/usr/bin/env node
// Pestaña «Seguro agrario» de Precios con navegador real (servidor local en :8123): cada cifra de la tarjeta de EE. UU. es la de data/crop-insurance.json,
// las tablas tienen sus filas, el selector de año cambia el titulo, no hay undefined/NaN, no hay desbordes a 390 px y la tarjeta de España declara que esta pendiente.
// Uso: node scripts/test-seguro.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const D = JSON.parse(fs.readFileSync('data/crop-insurance.json', 'utf8')), E = JSON.parse(fs.readFileSync('data/insurance-es.json', 'utf8'));
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const grp = (n, sep) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
const y = String(D.latestCompleteYear), v = D.national[y];
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/precios.html?tab=seguro', { waitUntil: 'networkidle' }); await page.waitForSelector('#sg-year', { timeout: 8000 }).catch(() => {});
  const tag = lang + '@' + w;
  const text = await page.evaluate(() => (document.getElementById('pr-category') || document.body).innerText);
  ok(tag + ': selector de año presente', /\d{4}/.test(text) && await page.$('#sg-year') !== null);
  ok(tag + ': sin undefined/NaN/[object]', !/undefined|NaN|\[object/.test(text));
  const sep = lang === 'en' ? ',' : lang === 'fr' ? ' ' : '.';
  ok(tag + ': capital asegurado exacto', text.includes(grp(v[0] / 1e6, sep)));
  ok(tag + ': prima total exacta', text.includes(grp(v[1] / 1e6, sep)));
  ok(tag + ': indemnizaciones exactas', text.includes(grp(v[3] / 1e6, sep)));
  ok(tag + ': subvencion exacta', text.includes(grp(v[2] / 1e6, sep)));
  ok(tag + ': cifras de Espana de insurance-es.json', text.includes(grp(E.stats.premiumsMEur, sep)) && text.includes(grp(E.stats.indemnitiesMEur, sep)));
  const n = await page.evaluate(() => [...document.querySelectorAll('#pr-category table')].map(t => t.querySelectorAll('tbody tr').length));
  ok(tag + ': tablas 10/10/8/' + D.cropYears.length + ' filas (hay ' + n + ')', JSON.stringify(n) === JSON.stringify([10, 10, 8, D.cropYears.length]));
  ok(tag + ': hay citas de la fuente', await page.evaluate(() => document.querySelectorAll('#pr-category .di-cite').length >= 2));
  if (w === 390) ok(tag + ': sin desborde horizontal de la pagina', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
  if (lang === 'es' && w === 1280) {
    await page.selectOption('#sg-year', String(D.latestCompleteYear - 1)); await page.waitForTimeout(150);
    const t2 = await page.evaluate(() => document.getElementById('pr-category').innerText), v2 = D.national[String(D.latestCompleteYear - 1)];
    ok('es: cambiar de año actualiza las cifras', t2.includes('año agrícola ' + (D.latestCompleteYear - 1)) && t2.includes(grp(v2[1] / 1e6, '.')));
    ok('es: el año provisional avisa', await page.evaluate(([yy]) => { const s = document.getElementById('sg-year'); s.value = yy; s.dispatchEvent(new Event('change')); return document.getElementById('pr-category').innerText.toLowerCase().includes('provisional'); }, [String(D.provisionalFrom)]));
    ok('es: la tarjeta de España avisa de que esta pendiente', /sin contrastar/i.test(text));
  }
  ok(tag + ': sin errores de consola', errs.length === 0); if (errs.length) console.log('  ', errs.slice(0, 3));
  await ctx.close();
}
await browser.close(); console.log(fail ? fail + ' fallos' : 'Seguro agrario: OK'); process.exit(fail ? 1 : 0);
