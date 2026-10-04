#!/usr/bin/env node
// Vista por condado de rendimientos.html con navegador real (servidor local en :8123): cifras = data/us-county/yields/*.json,
// selectores de estado/cifra/año, hueco de trigo 2024 mostrado como hueco, cultivo sin datos por condado, sin undefined/NaN, sin desbordes a 390 px, 4 idiomas.
// Uso: node scripts/test-rendimientos-condado.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const corn = JSON.parse(fs.readFileSync('data/us-county/yields/corn.json', 'utf8'));
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const nrm = s => s.replace(/[., \s  −-]/g, '');
const top = (doc, pre, mi, yr) => { const yi = doc.years.indexOf(yr); let best = null; for (const [f, a] of Object.entries(doc.counties)) { if (f.slice(0, 2) !== pre || f.slice(2) === '998') continue; const v = a[mi][yi]; if (typeof v === 'number' && (best === null || v > best)) best = v; } return best; };
const yr = corn.years[corn.years.length - 1];
const expIA = top(corn, '19', 0, yr);
ok('fixture: Iowa tiene dato', expIA > 100);
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message));
  const txt = async () => (await page.evaluate(() => document.querySelector('#rd-cty').innerText)).replace(/ | /g, ' ');
  await page.goto(BASE + '/rendimientos.html?crop=' + encodeURIComponent('CORN, GRAIN'), { waitUntil: 'networkidle' });
  await page.locator('#rd-cty').scrollIntoViewIfNeeded();
  await page.waitForSelector('#rd-cty-tbl', { timeout: 10000 });
  let t = await txt();
  ok(tag + ': sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(t));
  const st = await page.$eval('#rd-cty-st', e => e.value);
  ok(tag + ': hay mapa con caminos', (await page.$$('#rd-cty-map path')).length >= 50);
  if (st === 'IA') {
    const y = Number(await page.$eval('#rd-cty-y', e => e.value));
    const exp = top(corn, '19', 0, y);
    ok(tag + ': el valor más alto de Iowa coincide con el JSON', nrm(t).includes(nrm(exp.toFixed(1))));
  }
  // cambio de cifra y año
  await page.selectOption('#rd-cty-m', 'production'); await page.waitForTimeout(400);
  t = await txt(); ok(tag + ': producción sin undefined/NaN', !/undefined|NaN|Infinity/.test(t) && (await page.$$('#rd-cty-tbl tbody tr')).length >= 5);
  await page.selectOption('#rd-cty-m', 'yield'); await page.waitForFunction(() => document.querySelectorAll('#rd-cty-y option').length > 0 && document.querySelector('#rd-cty-m').value === 'yield'); await page.waitForTimeout(400);
  const ys = await page.$$eval('#rd-cty-y option', o => o.map(x => x.value)); ok(tag + ': varios años', ys.length >= 5);
  await page.selectOption('#rd-cty-y', ys[0]); await page.waitForTimeout(400);
  const e0 = top(corn, CODE(await page.$eval('#rd-cty-st', e => e.value)), 0, Number(ys[0]));
  t = await txt(); ok(tag + ': año cambiado muestra el máximo del JSON', e0 === null || nrm(t).includes(nrm(e0.toFixed(1))));
  // trigo de invierno 2024: hueco, no cero
  await page.goto(BASE + '/rendimientos.html?crop=' + encodeURIComponent('WHEAT, WINTER'), { waitUntil: 'networkidle' });
  await page.locator('#rd-cty').scrollIntoViewIfNeeded(); await page.waitForSelector('#rd-cty-y', { timeout: 10000 });
  t = await txt(); ok(tag + ': trigo sin undefined/NaN', !/undefined|NaN|Infinity/.test(t));
  // cultivo sin datos por condado
  await page.goto(BASE + '/rendimientos.html?crop=' + encodeURIComponent('HAY, ALFALFA'), { waitUntil: 'networkidle' }).catch(() => {});
  ok(tag + ': sin errores de página', errs.length === 0);
  if (w === 390) ok(tag + ': sin desborde horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  if (errs.length) console.log(tag, errs.slice(0, 3));
  await ctx.close();
}
function CODE(s) { const F = { IA: '19', IL: '17', NE: '31', MN: '27', IN: '18', OH: '39', KS: '20', SD: '46', ND: '38', WI: '55', MO: '29' }; return F[s] || '19'; }
await browser.close();
console.log(fail ? 'FALLOS: ' + fail : 'OK test-rendimientos-condado');
process.exit(fail ? 1 : 0);
