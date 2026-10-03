#!/usr/bin/env node
// Bloque «Manitoba: ganado vacuno en subastas» de la ficha de Canadá, con navegador real (servidor local en :8123): cifras = data/mb-markets/cattle.json,
// selectores de clase y subasta, conversion a C$/kg, atribucion OpenMB, sin undefined/NaN ni desbordes a 390 px, en los 4 idiomas.
// Uso: node scripts/test-mb-cattle.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const D = JSON.parse(fs.readFileSync('data/mb-markets/cattle.json', 'utf8'));
const wk = Object.keys(D.weeks).sort(), W = D.weeks[wk[wk.length - 1]], P = D.weeks[wk[wk.length - 2]];
const ci = D.classes.indexOf('steer701'), sum = W.summary[ci], psum = P.summary[ci];
const mart = Object.keys(W.marts).find(m => W.marts[m].date && W.marts[m].rows[D.classes.indexOf('cowD12')]);
const mrow = W.marts[mart].rows[D.classes.indexOf('cowD12')];
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const nrm = s => s.replace(/[., \s ]/g, '');
const f2 = v => v.toFixed(2);
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/paises.html?c=CA', { waitUntil: 'networkidle' }); await page.waitForSelector('#ps-mb details', { timeout: 8000 });
  ok(tag + ': cerrado no carga el modulo', !(await page.evaluate(() => !!window.MBCattle)));
  await page.click('#ps-mb details > summary'); await page.waitForSelector('#ps-mb [data-mb="cls"]', { timeout: 8000 });
  const txt = async () => await page.evaluate(() => document.querySelector('#ps-mb .es-body').innerText);
  let t = await txt();
  ok(tag + ': media de novillos 701-800 en C$/cwt', nrm(t).includes(nrm(f2(sum[2]))));
  ok(tag + ': minimo y maximo', nrm(t).includes(nrm(f2(sum[0]))) && nrm(t).includes(nrm(f2(sum[1]))));
  ok(tag + ': conversion a C$/kg', nrm(t).includes(nrm(f2(sum[2] / 45.359237))));
  ok(tag + ': cambio semanal', nrm(t).includes(nrm((Math.abs((sum[2] / psum[2] - 1) * 100)).toFixed(1))));
  ok(tag + ': cabezas de la semana', nrm(t).includes(String(W.weekTotal)));
  ok(tag + ': fecha de la semana', t.includes(wk[wk.length - 1]));
  ok(tag + ': atribucion OpenMB', /OpenMB/.test(t));
  ok(tag + ': grafico de la serie', (await page.$$('#ps-mb svg')).length >= 1);
  ok(tag + ': sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(t));
  await page.selectOption('#ps-mb [data-mb="cls"]', 'cowD12'); await page.selectOption('#ps-mb [data-mb="mart"]', mart); t = await txt();
  ok(tag + ': ' + mart + ' vacas D1,2 media', nrm(t).includes(nrm(f2(mrow[2]))) && t.includes(W.marts[mart].date));
  ok(tag + ': cabezas de ' + mart, nrm(t).includes(String(W.head[mart])));
  const empty = Object.keys(P.marts).find(m => !P.marts[m].date);
  const rows = await page.$$('#ps-mb tbody tr'); ok(tag + ': tabla de 15 clases', rows.length === 15);
  const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2); ok(tag + ': sin desborde horizontal', !over);
  ok(tag + ': sin errores de consola (' + errs.join(' | ') + ')', errs.length === 0);
  await ctx.close();
}
await browser.close();
console.log(fail ? fail + ' fallos' : 'test-mb-cattle: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
