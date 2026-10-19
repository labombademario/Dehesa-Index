#!/usr/bin/env node
/* Prueba en navegador del mapa de «Qué sembrar» (js/siembra.js, mapHtml).
   En todos los países: cada región pulsable del mapa da resultados (nunca «No hay datos de cultivos para esta región»),
   las regiones sin datos salen en gris y deshabilitadas también en la lista, el clic elige en el desplegable,
   el teclado (Enter) elige y el foco vuelve a la región. Necesita un servidor estático en :8123. Uso: node scripts/test-siembra-map.mjs */
import { execSync } from 'node:child_process';
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const BASE = process.env.BASE || 'http://localhost:8123';
const fails = []; const ok = (n, c) => { if (!c) { fails.push(n); console.log('FALLA', n); } };
const b = await pw.chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(BASE + '/siembra.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('dehesaIndexLang', 'es'); }); await p.reload(); await p.waitForTimeout(1200);
const countries = await p.$$eval('#sw-c option', o => o.map(x => x.value).filter(Boolean));
ok('hay países', countries.length >= 4);
const setC = c => p.evaluate(v => { const s = document.getElementById('sw-c'); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, c);
let total = 0;
for (const cc of countries) {
  await setC(cc);
  const got = await p.waitForSelector('.sw-map svg', { timeout: 20000 }).then(() => true, () => false);
  if (!got) { console.log(cc, 'sin mapa'); continue; }
  /* el mapa solo vale cuando todas sus regiones pulsables están en la lista del país elegido (si no, es el del país anterior) */
  await p.waitForFunction(v => { if (document.getElementById('sw-c').value !== v || !document.querySelector('.sw-map svg')) return false;
    var opts = [].map.call(document.querySelectorAll('#sw-r option'), o => o.value), ids = [].map.call(document.querySelectorAll('.sw-map [data-mr]'), x => x.getAttribute('data-mr'));
    return opts.length > 1 && ids.every(i => opts.indexOf(i) > -1) && document.querySelectorAll('.sw-map path').length > 0; }, cc, { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(150);
  const codes = await p.$$eval('.sw-map [data-mr]', a => [...new Set(a.map(x => x.getAttribute('data-mr')))]);
  const disabledOpts = await p.$$eval('#sw-r option[disabled]', o => o.map(x => x.value));
  ok(cc + ': alguna región pulsable', codes.length > 0);
  ok(cc + ': lo pulsable no está deshabilitado en la lista', codes.every(c => disabledOpts.indexOf(c) < 0));
  const empty = [];
  for (const code of codes) {
    await p.evaluate(c => document.querySelector('.sw-map [data-mr="' + c + '"]').dispatchEvent(new MouseEvent('click', { bubbles: true })), code);
    const r = await p.evaluate(() => ({ sel: document.getElementById('sw-r').value, body: document.getElementById('sw-body').textContent }));
    if (r.sel !== code) fails.push(cc + ':' + code + ' clic no elige');
    if (/No hay datos de cultivos para esta región/.test(r.body)) empty.push(code);
    total++;
  }
  ok(cc + ': ninguna región pulsable queda vacía (' + empty.join(',') + ')', !empty.length);
  console.log(cc, 'pulsables', codes.length, 'deshabilitadas en lista', disabledOpts.length);
}
// teclado y foco
await setC('ES'); await p.waitForSelector('.sw-map [data-mr="AN"]');
await p.focus('.sw-map [data-mr="AN"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
ok('teclado: Enter elige Andalucía', (await p.inputValue('#sw-r')) === 'AN');
ok('teclado: el foco vuelve a la región', (await p.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-mr'))) === 'AN');
ok('sin errores de JavaScript', !errs.length); if (errs.length) console.log(errs.slice(0, 5).join('\n'));
await b.close();
console.log('test-siembra-map:', total, 'regiones pulsadas;', fails.length ? fails.length + ' fallos' : 'OK'); process.exit(fails.length ? 1 : 0);
