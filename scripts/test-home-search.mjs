#!/usr/bin/env node
// Buscador grande de la portada: caja visible, 6 ejemplos por idioma, cada ejemplo abre el buscador global con la consulta escrita, sin desborde a 390 px ni errores. Uso: node scripts/test-home-search.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  ok(tag + ' barra visible', await page.isVisible('#home-search-btn'));
  const n = (await page.$$('.di-hs-try button')).length; ok(tag + ' 6 ejemplos', n === 6);
  ok(tag + ' sin desborde', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  const q = await page.getAttribute('.di-hs-try button >> nth=1', 'data-q');
  await page.click('.di-hs-try button >> nth=1'); await page.waitForSelector('#ds-input', { timeout: 6000 });
  ok(tag + ' el ejemplo llega escrito al buscador', (await page.inputValue('#ds-input')) === q);
  await page.waitForTimeout(800); ok(tag + ' hay resultados o respuesta', (await page.evaluate(() => (document.getElementById('ds-body').innerText + document.getElementById('ds-ans').innerText).length)) > 20);
  await page.keyboard.press('Escape');
  await page.click('#home-search-btn'); await page.waitForSelector('#ds-input'); await page.waitForTimeout(200); ok(tag + ' la barra abre el buscador con el cursor dentro', await page.evaluate(() => document.activeElement && document.activeElement.id === 'ds-input'));
  ok(tag + ' sin errores de consola', errs.length === 0); if (errs.length) console.log(errs);
  await ctx.close();
}
await browser.close(); console.log(fail ? 'test-home-search: ' + fail + ' fallos' : 'test-home-search: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
