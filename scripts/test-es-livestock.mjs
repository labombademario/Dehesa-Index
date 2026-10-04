#!/usr/bin/env node
// España, ganadería por provincia (MAPA): las cifras que se ven = los JSON (total nacional y una provincia), selectores, atribución, 4 idiomas, 1280/390. Uso: node scripts/test-es-livestock.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process'; import { readFileSync } from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const J = JSON.parse(readFileSync('data/spain-livestock/livestock-bovino.json', 'utf8')), last = J.periods.length - 1;
const NAT = J.v.ES['01'][last], MAD = J.v['28']['01'][last];
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); localStorage.setItem('dehesaIndexLocation', 'us'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/ganaderia.html?c=ES&item=bovino%7C01', { waitUntil: 'networkidle' });
  await page.waitForSelector('#gn-esm:not([hidden]) table tbody tr', { timeout: 8000 }).catch(() => {});
  const m = await page.evaluate(() => { var c = document.getElementById('gn-esm'); return { txt: c ? c.innerText : '', rows: c ? c.querySelectorAll('table tbody tr').length : 0, items: c ? c.querySelectorAll('select option').length : 0, over: document.documentElement.scrollWidth > innerWidth + 1 }; });
  const digits = s => s.replace(/\D/g, '');
  const T = digits(m.txt);
  ok(tag + ' 50 provincias en la tabla', m.rows === 50);
  ok(tag + ' mas de 60 cifras elegibles', m.items > 60);
  ok(tag + ' total nacional del ultimo censo = JSON', T.indexOf(String(NAT)) > -1 || T.indexOf(String(Math.round(NAT / 1e4) / 100).replace('.', '')) > -1);
  ok(tag + ' fila de Madrid = JSON', T.indexOf(String(MAD)) > -1);
  ok(tag + ' cita de la fuente', /MAPA|Ministerio|Ministry|ministère|Ministero/.test(m.txt));
  ok(tag + ' sin desborde', !m.over); ok(tag + ' sin errores de consola', errs.length === 0); if (errs.length) console.log(errs);
  await ctx.close();
}
await browser.close(); console.log(fail ? 'test-es-livestock: ' + fail + ' fallos' : 'test-es-livestock: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
