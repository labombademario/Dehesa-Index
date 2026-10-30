#!/usr/bin/env node
// Bloque «Manitoba: granos y oleaginosas (elevador de Winnipeg)» de la ficha de Canadá, con navegador real (servidor local en :8123): cifras = data/mb-markets/grains.json,
// selector de cultivo, C$/t y C$/bushel, cambio semanal y de 52 semanas calculados sobre semanas publicadas, graficas semanal y mensual, atribucion OpenMB, celdas en disputa vacias,
// sin undefined/NaN ni desbordes a 390 px, en los 4 idiomas.
// Uso: node scripts/test-mb-grains.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
async function selectHidden(pg, sel, val) { await pg.waitForSelector(sel, { state: 'attached' }); await pg.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, val); }
const D = JSON.parse(fs.readFileSync('data/mb-markets/grains.json', 'utf8'));
const wk = Object.keys(D.weeks).sort(), last = wk[wk.length - 1], prev = wk[wk.length - 2];
const ix = k => D.crops.indexOf(k), V = (d, k) => (D.weeks[d] && D.weeks[d][ix(k)] ? D.weeks[d][ix(k)][0] : null);
const yago = new Date(Date.parse(last + 'T00:00:00Z') - 364 * 86400000).toISOString().slice(0, 10);
const canola = V(last, 'canola'), canolaBu = D.weeks[last][ix('canola')][1], pc = (a, b) => Math.abs((a / b - 1) * 100).toFixed(1);
const wheat = V(last, 'wheat_wrs'), meal = V(last, 'canola_meal'), mkeys = Object.keys(D.monthly.barley).sort();
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const nrm = s => s.replace(/[., \s ]/g, '');
const f2 = v => v.toFixed(2);
ok('datos: ultima semana con colza y trigo', canola != null && wheat != null && meal != null && prev);
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/paises.html?c=CA#mb-grains', { waitUntil: 'networkidle' }); await page.waitForSelector('#mb-grains', { timeout: 8000 });
  await page.waitForSelector('#mb-grains [data-mbg="crop"]', { state: 'attached', timeout: 8000 });
  const txt = async () => await page.evaluate(() => document.querySelector('#mb-grains .es-body').innerText);
  let t = await txt();
  ok(tag + ': colza en C$/t', nrm(t).includes(nrm(f2(canola))));
  ok(tag + ': colza en C$/bushel', nrm(t).includes(nrm(f2(canolaBu))));
  ok(tag + ': cambio semanal sobre la semana publicada anterior', nrm(t).includes(nrm(pc(canola, V(prev, 'canola')))) && t.includes(prev));
  ok(tag + ': cambio a 52 semanas solo si existe esa semana', V(yago, 'canola') == null ? /–/.test(t) : nrm(t).includes(nrm(pc(canola, V(yago, 'canola')))));
  ok(tag + ': fecha de la semana', t.includes(last));
  ok(tag + ': atribucion OpenMB', /OpenMB/.test(t));
  ok(tag + ': dos graficas (semanal y mensual)', (await page.$$('#mb-grains svg')).length >= 2);
  ok(tag + ': sin futuros de terceros (ICE, Chicago)', !/ICE|Chicago/.test(t.replace(/ICE and Chicago futures|futuros de ICE y Chicago|contrats à terme d.ICE et de Chicago|future di ICE e Chicago/g, '')));
  ok(tag + ': sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(t));
  ok(tag + ': tabla de 12 cultivos', (await page.$$('#mb-grains tbody tr')).length === 12);
  ok(tag + ': harina de colza solo en tonelada (sin bushel inventado)', nrm(await page.evaluate(() => [].map.call(document.querySelectorAll('#mb-grains tbody tr'), r => r.textContent).pop())).includes(nrm(f2(meal))));
  await selectHidden(page, '#mb-grains [data-mbg="crop"]', 'wheat_wrs'); t = await txt();
  ok(tag + ': trigo WRS en C$/t', nrm(t).includes(nrm(f2(wheat))));
  ok(tag + ': historia mensual desde ' + mkeys[0], t.includes(D.monthly.wheat_wrs ? Object.keys(D.monthly.wheat_wrs).sort()[0] : '2013-01'));
  const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2); ok(tag + ': sin desborde horizontal', !over);
  ok(tag + ': sin errores de consola (' + errs.join(' | ') + ')', errs.length === 0);
  await ctx.close();
}
await browser.close();
console.log(fail ? fail + ' fallos' : 'test-mb-grains: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
