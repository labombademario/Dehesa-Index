#!/usr/bin/env node
// Clima agrícola con navegador real (servidor local en :8123): chips para mostrar/ocultar regiones (con "Todas"/"Ninguna"), regiones plegables, mapa con un punto por región visible,
// clic en un punto lleva a su fila, la elección se recuerda al recargar, sin undefined/NaN ni desbordes a 390 px, en los 4 idiomas.
// Uso: node scripts/test-clima.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const C = JSON.parse(fs.readFileSync('data/climate.json', 'utf8'));
const count = r => C.locations.filter(l => l.region === r).length;
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  const markers = () => page.$$eval('#clima-map circle.jvm-marker', e => e.length);
  const rows = () => page.$$eval('.clima-row', e => e.length);
  await page.goto(BASE + '/clima.html', { waitUntil: 'networkidle' }); await page.waitForSelector('#clima-map svg');
  ok(tag + ': un punto por localización', (await markers()) === C.locations.length);
  ok(tag + ': una fila por localización', (await rows()) === C.locations.length);
  const chips = await page.$$('[data-creg]'); ok(tag + ': 5 chips de región', chips.length === 5);
  await page.click('[data-creg="eu"]'); await page.waitForSelector('#clima-reg-eu', { state: 'detached' });
  ok(tag + ': ocultar UE quita sus filas y puntos', (await rows()) === C.locations.length - count('eu') && (await markers()) === C.locations.length - count('eu'));
  ok(tag + ': chip UE desactivado', (await page.getAttribute('[data-creg="eu"]', 'aria-pressed')) === 'false');
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('#clima-map svg');
  ok(tag + ': la elección se recuerda al recargar', (await rows()) === C.locations.length - count('eu'));
  await page.click('[data-cregall="0"]'); await page.waitForSelector('.clima-row', { state: 'detached' });
  ok(tag + ': Ninguna deja el aviso y cero puntos', (await markers()) === 0 && /status/.test(await page.$eval('#clima-body .di-info-api-notice[role=status]', e => e.getAttribute('role'))));
  await page.click('[data-cregall="1"]'); await page.waitForSelector('#clima-reg-eu');
  ok(tag + ': Todas restaura', (await rows()) === C.locations.length && (await markers()) === C.locations.length);
  // plegar una región
  await page.click('#clima-reg-us > summary'); ok(tag + ': plegar región', !(await page.$eval('#clima-reg-us', e => e.open)));
  await page.click('[data-ckind="temp"]'); await page.waitForSelector('#clima-map svg');
  ok(tag + ': cambiar a temperatura mantiene el estado plegado y los puntos', !(await page.$eval('#clima-reg-us', e => e.open)) && (await markers()) === C.locations.length);
  // clic en un punto: abre la región y lleva a la fila
  const ia = C.locations.findIndex(l => l.region === 'us');
  await page.evaluate(i => { const m = document.querySelectorAll('#clima-map circle.jvm-marker')[i]; m.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, ia);
  await page.waitForTimeout(400);
  ok(tag + ': clic en un punto despliega la región', await page.$eval('#clima-reg-us', e => e.open));
  ok(tag + ': fila resaltada', await page.$eval('#clima-row-' + C.locations[ia].id, e => e.style.outline !== ''));
  const t = await page.evaluate(() => document.querySelector('#clima-body').innerText);
  ok(tag + ': sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(t));
  ok(tag + ': último mes visible', t.includes(C.lastPeriod));
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok(tag + ': sin desborde (' + ov + ')', ov <= 1);
  ok(tag + ': sin errores de consola', errs.length === 0); if (errs.length) console.log(tag, errs.slice(0, 3));
  await ctx.close();
}
await browser.close();
if (fail) { console.log(fail + ' fallos'); process.exit(1); }
console.log('test-clima: OK (regiones, mapa, plegado, memoria × 4 idiomas × 2 anchos)');
