#!/usr/bin/env node
// Ficha de producto: barra contextual fija (un enlace por bloque que existe, salto al bloque, queda bajo la cabecera y el bloque activo se marca), y marcas Dato / Lectura de Dehesa / Relacion. 4 idiomas, 1280/390. Uso: node scripts/test-product-ctx.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/producto.html?p=trigo', { waitUntil: 'networkidle' }); await page.waitForSelector('.pt-ctx');
  const ids = await page.$$eval('.pt-ctx a[data-ctx]', e => e.map(x => x.getAttribute('data-ctx')));
  ok(tag + ' enlaces a bloques que existen', ids.length >= 6 && (await Promise.all(ids.map(id => page.$('#pt-' + id)))).every(Boolean));
  ok(tag + ' kinds en cabecera', !!(await page.$('#pt-drivers .pt-kind-insight')) && !!(await page.$('#pt-rels .pt-kind-rel')));
  await page.click('.pt-ctx a[data-ctx="rels"]'); await page.waitForTimeout(2200);
  const m = await page.evaluate(() => { var h = document.querySelector('.di-header'), st = h && getComputedStyle(h).position === 'sticky', hh = st ? h.offsetHeight : 0, bar = document.querySelector('.pt-ctx').getBoundingClientRect(), t = document.getElementById('pt-rels').getBoundingClientRect().top; return { hh: hh, barTop: bar.top, barH: bar.height, t: t, cur: (document.querySelector('.pt-ctx a[aria-current]') || {}).textContent }; });
  ok(tag + ' la barra queda justo bajo la cabecera', Math.abs(m.barTop - m.hh) <= 2);
  ok(tag + ' el bloque queda visible bajo la barra', m.t >= m.hh + m.barH - 4 && m.t < 800 * 0.5);
  ok(tag + ' el bloque activo se marca', !!m.cur);
  ok(tag + ' sin desborde', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  ok(tag + ' sin errores de consola', errs.length === 0); if (errs.length) console.log(errs);
  await ctx.close();
}
await browser.close(); console.log(fail ? 'test-product-ctx: ' + fail + ' fallos' : 'test-product-ctx: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
