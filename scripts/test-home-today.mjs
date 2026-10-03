#!/usr/bin/env node
// Portada «Hoy»: tres bloques (qué cambió, qué viene, mi seguimiento) con las cifras de data/daily-brief.json, fechas oficiales del USDA, y la lista local; 4 idiomas, 1280/390, sin errores. Uso: node scripts/test-home-today.mjs [--base http://localhost:8123]
import fs from 'node:fs'; import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const B = JSON.parse(fs.readFileSync('data/daily-brief.json', 'utf8'));
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const dig = s => s.replace(/[^\d]/g, '');
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) for (const follow of [0, 2]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(([l, f]) => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); if (f) localStorage.setItem('di-watchlist-v1', JSON.stringify([{ c: 'ES', s: 'a' }, { c: 'FR', s: 'b' }])); } catch (e) {} }, [lang, follow]);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w + (follow ? ' con seguimiento' : '');
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' }); await page.waitForSelector('.di-today', { timeout: 8000 });
  ok(tag + ' tres columnas', (await page.$$('.di-today-col')).length === 3);
  const kv = await page.$$eval('.di-today-kv dd', e => e.map(x => x.textContent)); ok(tag + ' cifras del resumen diario', kv.length === 3 && dig(kv[0]) === String(B.counts.newPeriods) && dig(kv[1]) === String(B.counts.revisions) && dig(kv[2]) === String(B.counts.stale));
  const mv = await page.$$('.di-today-col:nth-child(1) .di-today-list li'); ok(tag + ' hasta 3 movimientos', mv.length <= 3);
  const txt = await page.innerText('#home-today'); ok(tag + ' sin undefined', !/undefined|NaN|\[object/.test(txt));
  const big = await page.$('.di-today-big'); ok(tag + ' mi seguimiento refleja la lista local', follow ? !!big && dig(await big.innerText()) === '2' : !big);
  ok(tag + ' sin desborde', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  ok(tag + ' sin errores de consola', errs.length === 0); if (errs.length) console.log(errs);
  await ctx.close();
}
await browser.close(); console.log(fail ? 'test-home-today: ' + fail + ' fallos' : 'test-home-today: OK (4 idiomas x 2 anchos x con/sin seguimiento)'); process.exit(fail ? 1 : 0);
