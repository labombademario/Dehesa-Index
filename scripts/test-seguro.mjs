#!/usr/bin/env node
// Pestaña «Seguro agrario» de Precios con navegador real (servidor local en :8123): cada cifra de la tarjeta de EE. UU. es la de data/crop-insurance.json,
// lo mismo con la tarjeta y las tablas de Canadá (data/crop-insurance-ca.json), las tablas tienen sus filas, el selector de año cambia el titulo, no hay undefined/NaN, no hay desbordes a 390 px y la tarjeta de España declara que esta pendiente.
// Uso: node scripts/test-seguro.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const D = JSON.parse(fs.readFileSync('data/crop-insurance.json', 'utf8')), E = JSON.parse(fs.readFileSync('data/insurance-es.json', 'utf8')), C = JSON.parse(fs.readFileSync('data/crop-insurance-ca.json', 'utf8')), N = JSON.parse(fs.readFileSync('data/enesa-contratacion.json', 'utf8'));
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const grp = (n, sep) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
const y = String(D.latestCompleteYear), v = D.national[y];

const mcad = (k, sep, lang) => { if (k < 1000) return grp(k, sep); const m = k / 1e3, n = m >= 100 ? grp(m, sep) : (lang === 'en' ? m.toFixed(1) : m.toFixed(1).replace('.', ',')); return n; };
const ci = C.years.indexOf(C.latestYear);
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
  /* Las tablas se identifican por su bloque (data-tbl), no por su posicion: la pagina puede ganar bloques sin romper la prueba. */
  const tb = await page.evaluate(() => { const o = {}; document.querySelectorAll('#pr-category table[data-tbl]').forEach(t => { o[t.getAttribute('data-tbl')] = [...t.querySelectorAll('tbody tr')].map(r => [...r.children].map(c => c.innerText.trim())); }); return o; });
  const top = (g, k) => Object.keys(g).filter(c => g[c][y]).sort((a, b) => g[b][y][k] - g[a][y][k]);
  ok(tag + ': hay tablas por bloque (' + Object.keys(tb).join(',') + ')', ['us-states', 'us-crops', 'us-causes', 'us-trend', 'ca-prov', 'ca-trend'].every(k => tb[k] && tb[k].length));
  ok(tag + ': estados: 10 filas y el primero es el mayor capital asegurado', (tb['us-states'] || []).length === 10 && (tb['us-states'][0][0] || '').startsWith(top(D.states, 0)[0] + ' ·'));
  ok(tag + ': cultivos: 10 filas y el primero es el mayor capital asegurado', (tb['us-crops'] || []).length === 10 && (tb['us-crops'][0][0] || '') === top(D.crops, 0)[0]);
  const nc = Object.keys(D.causeIndemnity).filter(k => D.causeIndemnity[k][y]).length;
  ok(tag + ': causas: ' + Math.min(8, nc) + ' filas, la primera es la mayor indemnizacion', (tb['us-causes'] || []).length === Math.min(8, nc) && (tb['us-causes'][0][0] || '') === Object.keys(D.causeIndemnity).filter(k => D.causeIndemnity[k][y]).sort((a, b) => D.causeIndemnity[b][y] - D.causeIndemnity[a][y])[0]);
  ok(tag + ': serie anual de EE. UU.: ' + D.cropYears.length + ' filas, la primera es el ultimo año', (tb['us-trend'] || []).length === D.cropYears.length && (tb['us-trend'][0][0] || '').startsWith(String(D.cropYears[D.cropYears.length - 1])));
  const provs = Object.keys(C.data).filter(k => k !== 'CA').length;
  ok(tag + ': Canadá por provincia: ' + provs + ' filas', (tb['ca-prov'] || []).length === provs);
  ok(tag + ': Canadá serie: ' + Math.min(15, C.years.length) + ' filas, la primera es el ultimo año', (tb['ca-trend'] || []).length === Math.min(15, C.years.length) && (tb['ca-trend'][0][0] || '') === String(C.years[C.years.length - 1]));
  /* ENESA historico: una fila por ejercicio del JSON y las pólizas de cada fila coinciden con el fichero */
  const en = (tb['es-enesa'] || []), ea = N.annual.slice().reverse();
  ok(tag + ': ENESA: ' + ea.length + ' filas, una por ejercicio', en.length === ea.length && en.every((r, i) => r[0].startsWith(String(ea[i].year))));
  ok(tag + ': ENESA: las pólizas de cada ejercicio son las del JSON', en.length === ea.length && en.every((r, i) => ea[i].polizas == null ? r[1] === '—' : r[1] === grp(ea[i].polizas, sep)));
  ok(tag + ': ENESA: se declara histórico y no actual', /31/.test(text) && await page.evaluate(() => !!document.querySelector('#pr-category .di-cite[data-src="enesa"]')));
  ok(tag + ': Canadá, indemnizaciones exactas', text.includes(mcad(C.data.CA.indemnities[ci], sep, lang)));
  ok(tag + ': Canadá, gasto exacto', text.includes(mcad(C.data.CA.farmPremiums[ci], sep, lang)));
  ok(tag + ': Canadá, granizo exacto', text.includes(mcad(C.data.CA.hailIndemnities[ci], sep, lang)));
  ok(tag + ': Canadá, Saskatchewan exacta', text.includes(mcad(C.data.SK.indemnities[ci], sep, lang)));
  ok(tag + ': Canadá, Terranova en miles (sin 0,0)', text.includes(grp(C.data.NL.farmPremiums[ci], sep) + (lang === 'en' ? 'K' : ' k CAD')) && !/\b0[.,]0 M/.test(text));
  ok(tag + ': Canadá, selector y hueco publicado como —', await page.$('#sg-ca-year') !== null && text.includes('—'));
  ok(tag + ': cita de Statistics Canada', await page.evaluate(() => !!document.querySelector('#pr-category .di-cite[data-src="statcan"]')));
  ok(tag + ': hay citas de la fuente', await page.evaluate(() => document.querySelectorAll('#pr-category .di-cite').length >= 2));
  if (w === 390) ok(tag + ': sin desborde horizontal de la pagina', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
  if (lang === 'es' && w === 1280) {
    await page.selectOption('#sg-year', String(D.latestCompleteYear - 1)); await page.waitForTimeout(150);
    const t2 = await page.evaluate(() => document.getElementById('pr-category').innerText), v2 = D.national[String(D.latestCompleteYear - 1)];
    ok('es: cambiar de año actualiza las cifras', t2.includes('año agrícola ' + (D.latestCompleteYear - 1)) && t2.includes(grp(v2[1] / 1e6, '.')));
    ok('es: el año provisional avisa', await page.evaluate(([yy]) => { const s = document.getElementById('sg-year'); s.value = yy; s.dispatchEvent(new Event('change')); return document.getElementById('pr-category').innerText.toLowerCase().includes('provisional'); }, [String(D.provisionalFrom)]));
    ok('es: la tarjeta de España avisa de que esta pendiente', /sin contrastar/i.test(text));
    const py = C.latestYear - 1, pi = C.years.indexOf(py);
    await page.selectOption('#sg-ca-year', String(py)); await page.waitForTimeout(150);
    const t3 = await page.evaluate(() => document.getElementById('pr-category').innerText);
    ok('es: cambiar el año de Canadá actualiza la tabla por provincia', t3.includes('Por provincia · ' + py) && t3.includes(mcad(C.data.AB.indemnities[pi], '.', 'es')));
    ok('es: la nota de Canadá aclara que el gasto no es la prima total', /no la prima total/i.test(t3));
  }
  ok(tag + ': sin errores de consola', errs.length === 0); if (errs.length) console.log('  ', errs.slice(0, 3));
  await ctx.close();
}
await browser.close(); console.log(fail ? fail + ' fallos' : 'Seguro agrario: OK'); process.exit(fail ? 1 : 0);
