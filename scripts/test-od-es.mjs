#!/usr/bin/env node
// Oferta y demanda, pestaña España (MAPA): cifras de la tabla y de las tarjetas = data/spain-balances/cereals.json, selectores, notas del total, cita, 4 idiomas, 1280/390. Uso: node scripts/test-od-es.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process'; import { readFileSync } from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const J = JSON.parse(readFileSync('data/spain-balances/cereals.json', 'utf8')), ys = Object.keys(J.campaigns).sort(), Y = ys[ys.length - 1];
const digits = s => s.replace(/\D/g, '');
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); localStorage.setItem('dehesaIndexLocation', 'us'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/oferta-demanda.html?c=ES', { waitUntil: 'networkidle' });
  await page.waitForSelector('#od-es table tbody tr', { timeout: 8000 }).catch(() => {});
  const m = await page.evaluate(() => { var e = document.getElementById('od-es'); var rows = [].map.call(e.querySelectorAll('table')[0].querySelectorAll('tbody tr'), r => [].map.call(r.cells, c => c.innerText.trim())); return { txt: e.innerText, rows: rows, cmp: e.querySelectorAll('table')[1].querySelectorAll('tbody tr').length, svgs: e.querySelectorAll('svg').length, worldHidden: document.getElementById('od-body').hidden, tabs: document.querySelectorAll('[data-odtab]').length, over: document.documentElement.scrollWidth > innerWidth + 1 }; });
  const v = J.campaigns[Y].v.wheat_soft;
  ok(tag + ' 2 pestañas y el mundo oculto', m.tabs === 2 && m.worldHidden);
  ok(tag + ' produccion trigo blando = JSON', m.rows.some(r => digits(r[1]) === String(v.production)));
  ok(tag + ' existencias finales = JSON', m.rows.some(r => digits(r[1]) === String(v.endingStocks)));
  ok(tag + ' 9 filas de cereales en la comparacion', m.cmp === 9);
  ok(tag + ' dos graficos', m.svgs >= 2);
  ok(tag + ' cita MAPA', /MAPA/.test(m.txt));
  ok(tag + ' sin desborde', !m.over); ok(tag + ' sin errores de consola', errs.length === 0); if (errs.length) console.log(errs);
  if (w === 1280 && lang === 'es') {
    await page.selectOption('#od-es-y', '2019'); await page.selectOption('#od-es-c', 'total');
    const t2 = await page.evaluate(() => document.getElementById('od-es').innerText);
    ok('2019/20 total: la discrepancia del MAPA se ve', /36\.627/.test(t2) && /35\.827/.test(t2));
    await page.click('[data-odtab="world"]'); await page.waitForTimeout(300);
    ok('volver a Mundo muestra el balance mundial', await page.evaluate(() => !document.getElementById('od-body').hidden && document.getElementById('od-es').hidden && /Oferta y demanda$/.test(document.getElementById('pg-h1').textContent.trim())));
  }
  await ctx.close();
}
await browser.close(); console.log(fail ? 'test-od-es: ' + fail + ' fallos' : 'test-od-es: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
