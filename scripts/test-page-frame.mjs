#!/usr/bin/env node
// Marco comun de pagina (paises): migas, barra de secciones fija con enlaces a bloques que existen, "Fuentes y metodologia" al final del cuerpo. 4 idiomas, 1280/390. Uso: node scripts/test-page-frame.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) for (const c of ['ES', 'US']) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w + ' ' + c;
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(BASE + '/paises.html?c=' + c, { waitUntil: 'networkidle' }); await page.waitForSelector('#pa-bar a', { timeout: 15000 }).catch(() => {});
  const ids = await page.$$eval('#pa-bar a[data-fr]', e => e.map(x => x.getAttribute('data-fr')));
  ok(tag + ' barra con >=3 secciones', ids.length >= 3);
  ok(tag + ' cada enlace apunta a un bloque', (await Promise.all(ids.map(id => page.$('#' + id)))).every(Boolean));
  ok(tag + ' fuentes es la ultima seccion', ids[ids.length - 1] === 'ps-sources');
  ok(tag + ' migas con 3 niveles', (await page.$$eval('#pa-crumbs li', e => e.length)) === 3);
  const order = await page.evaluate(ids => ids.map(id => document.getElementById(id).getBoundingClientRect().top + scrollY), ids);
  ok(tag + ' orden de la barra = orden del documento', order.every((v, i) => i === 0 || v >= order[i - 1]));
  if (ids.length) { await page.click('#pa-bar a[data-fr="ps-sources"]'); await page.waitForTimeout(600); const cur = await page.$eval('#pa-bar a[aria-current]', a => a.getAttribute('data-fr')).catch(() => null); ok(tag + ' el bloque activo se marca', cur === 'ps-sources' || cur === ids[ids.length - 1]); }
  ok(tag + ' sin errores JS', !errs.length); if (errs.length) console.log(errs.join('\n'));
  await ctx.close();
}
// Filas de mercado en movil (europa) y vista Filas/Tarjetas del panel de precios
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { try { localStorage.setItem('dehesaIndexLang', 'es'); localStorage.setItem('dehesaIndexTourSeen', '1'); localStorage.setItem('dehesaIndexLocation', 'us'); localStorage.removeItem('dehesaIndexPrView'); } catch (e) {} });
  const page = await ctx.newPage(); await page.goto(BASE + '/europa.html', { waitUntil: 'networkidle' });
  await page.waitForSelector('table.di-rows-m tbody tr', { timeout: 15000 }).catch(() => {});
  const tr = await page.$('table.di-rows-m tbody tr');
  ok('europa movil: tabla en filas', !!tr);
  if (tr) {
    const hid = await tr.$eval('td:nth-child(5), th:nth-child(5)', e => getComputedStyle(e).display).catch(() => 'none');
    ok('europa movil: columnas extra ocultas', hid === 'none');
    await tr.click({ position: { x: 10, y: 10 } }); await page.waitForTimeout(200);
    ok('europa movil: tocar abre la fila', (await tr.getAttribute('aria-expanded')) === 'true' && (await tr.$eval('td:nth-child(5), th:nth-child(5)', e => getComputedStyle(e).display).catch(() => 'none')) !== 'none');
  }
  await page.goto(BASE + '/precios.html', { waitUntil: 'networkidle' }); await page.waitForSelector('.di-view-bar', { timeout: 15000 }).catch(() => {});
  ok('precios: vista en filas por defecto', !!(await page.$('.di-product-grid.di-rows')));
  await page.click('.di-view-bar [data-view="cards"]'); ok('precios: conmutador a tarjetas', !(await page.$('.di-product-grid.di-rows')));
  await ctx.close();
}
await browser.close(); console.log(fail ? 'FALLOS: ' + fail : 'PAGE FRAME OK'); process.exit(fail ? 1 : 0);
