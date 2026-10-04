#!/usr/bin/env node
// Canadá a nivel EE. UU.: pestaña Canadá en rendimientos, ganadería, insumos y costes. Comprueba pestañas, contenido, filas, h1, sin errores, sin desborde, 4 idiomas x 2 anchos. Uso: node scripts/test-canada-tabs.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const PAGES = [['rendimientos', 'rd-ca', 5, 'CA'], ['ganaderia', 'gn-ca', 5, 'CA'], ['insumos', 'in-ca', 3, 'CA'], ['costes', 'cs-ca', 3, 'CA'], ['exportaciones', 'ex-ca', 3, 'CA'],
  ['rendimientos', 'rd-es', 10, 'ES'], ['ganaderia', 'gn-esm', 10, 'ES'], ['ganaderia', 'gn-es', 10, 'ES'], ['insumos', 'in-es', 3, 'ES'], ['costes', 'cs-es', 3, 'ES'], ['exportaciones', 'ex-es', 3, 'ES']];
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); localStorage.setItem('dehesaIndexLocation', 'us'); } catch (e) {} }, lang);
  for (const [p, id, minRows, cc] of PAGES) {
    const page = await ctx.newPage(), errs = [], tag = p + ' ' + lang + '@' + w;
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
    await page.goto(BASE + '/' + p + '.html?c=' + (id === 'gn-es' ? 'ES-EUROSTAT' : cc), { waitUntil: 'networkidle' });
    await page.waitForSelector('#' + id + ':not([hidden]) table tbody tr', { timeout: 8000 }).catch(() => {});
    const m = await page.evaluate(id => { var c = document.getElementById(id), t = document.getElementById((id.replace(/-esm?$/, '-ca')) + '-tabs'); return { vis: !!c && !c.hidden, tabs: t ? t.querySelectorAll('[data-catab]').length : 0, rows: c ? c.querySelectorAll('table tbody tr').length : 0, h1: (document.querySelector('h1') || {}).textContent || '', over: document.documentElement.scrollWidth > innerWidth + 1, txt: c ? c.innerText : '' }; }, id);
    ok(tag + ' pestañas', m.tabs === (p === 'ganaderia' ? 4 : 3)); ok(tag + ' contenido Canadá visible', m.vis); ok(tag + ' filas>=' + minRows, m.rows >= minRows);
    ok(tag + ' h1 del país', (cc === 'CA' ? /Canad/i : /Espa|Spain|Spagn|Spanish/i).test(m.h1)); ok(tag + ' sin desborde', !m.over);
    if (lang === 'es' && cc === 'CA') ok(tag + ' sin etiquetas en inglés', !/Farm (operating|input|product|income|debt)|Fertilizer shipments|\(Jul-Jun/.test(m.txt));
    ok(tag + ' sin errores de consola', errs.length === 0); if (errs.length) console.log(errs);
    await page.close();
  }
  await ctx.close();
}
await browser.close(); console.log(fail ? 'test-canada-tabs: ' + fail + ' fallos' : 'test-canada-tabs: OK (5 páginas x Canadá y España x 4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
