#!/usr/bin/env node
/* Prueba en navegador del mapa para elegir la zona en «Mi mercado» (js/mi-mercado.js, mapHtml).
   En los 7 países: pulsar una zona elige esa zona en el desplegable y la resalta; las zonas sin datos no se pueden pulsar;
   el teclado (Enter) también elige; el desplegable mueve el resaltado; Reino Unido: Londres y Sudeste son una sola zona de DEFRA.
   Necesita un servidor estático en :8123 (python3 -m http.server 8123). Uso: node scripts/test-mi-mercado-map.mjs */
import { execSync } from 'node:child_process';
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const BASE = process.env.BASE || 'http://localhost:8123';
const fails = []; const ok = (n, c) => { if (!c) { fails.push(n); console.log('FALLA', n); } };
const b = await pw.chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(BASE + '/mi-mercado.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('dehesaIndexLang', 'es'); }); await p.reload(); await p.waitForTimeout(1200);
const CASES = [['ES', '41', 'Sevilla', 50, 2], ['US', 'IA', 'Iowa', 50, 0], ['CA', 'SK', 'Saskatchewan', 10, 3], ['DE', 'BY', 'Baviera', 16, 0], ['UK', 'south-east-and-london', 'Sudeste de Inglaterra y Londres', 12, 0], ['FR', 'OCC', 'Occitania', 13, 0], ['IT', 'EMR', 'Emilia-Romaña', 20, 0]];
for (const [cc, pick, name, minN, na] of CASES) {
  await p.click('[data-mm-cc="' + cc + '"]'); await p.waitForSelector('.mm-map-' + cc.toLowerCase() + ' svg', { timeout: 20000 });
  const n = await p.$$eval('.mm-map-' + cc.toLowerCase() + ' [data-mm-map]', a => a.length), nna = await p.$$eval('.mm-map-p.na', a => a.length);
  ok(cc + ': zonas pulsables (' + n + ')', n >= minN); ok(cc + ': zonas sin datos no pulsables (' + nna + ')', nna === na);
  await p.click('[data-mm-map="' + pick + '"]'); await p.waitForTimeout(1200);
  ok(cc + ': el mapa elige en el desplegable', (await p.inputValue('select[data-mm="r"]')) === pick);
  ok(cc + ': nombre elegido', ((await p.textContent('.mm-map-sel')) || '').indexOf(name) > -1);
  ok(cc + ': zona resaltada', (await p.$$eval('.mm-map-p.on', a => a.length)) === (cc === 'UK' ? 2 : 1));
}
// Francia e Italia: con región y cultivo salen superficie, producción y rendimiento de Eurostat, sin errores
for (const [cc, r, crop, txt] of [['FR', 'OCC', 'C1110', 'Trigo blando'], ['IT', 'LOM', 'C1500', 'Maíz grano']]) {
  await p.click('[data-mm-cc="' + cc + '"]'); await p.waitForSelector('[data-mm-map="' + r + '"]'); await p.click('[data-mm-map="' + r + '"]'); await p.waitForTimeout(600);
  await p.selectOption('select[data-mm="p"]', crop); await p.waitForTimeout(1500);
  const body = await p.textContent('#mm-root, body'); ok(cc + ': tarjeta del cultivo', body.indexOf(txt) > -1 && /Superficie[\s\S]*ha/.test(body) && /Rendimiento/.test(body) && /Eurostat/.test(body));
  ok(cc + ': sin «NaN» ni «undefined»', !/NaN|undefined/.test(body));
}
await p.click('[data-mm-cc="ES"]'); await p.waitForSelector('[data-mm-map="28"]'); await p.focus('[data-mm-map="28"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(1200);
ok('teclado: Enter elige Madrid', (await p.inputValue('select[data-mm="r"]')) === '28');
ok('teclado: el foco sigue en la zona', (await p.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-mm-map'))) === '28');
await p.selectOption('select[data-mm="r"]', '50'); await p.waitForTimeout(1200);
ok('el desplegable mueve el resaltado', (await p.$$eval('.mm-map-p.on', a => a.map(x => x.getAttribute('data-mm-map')).join())) === '50');
ok('sin errores de JavaScript', !errs.length); if (errs.length) console.log(errs.join('\n'));
await b.close();
console.log('test-mi-mercado-map:', fails.length ? fails.length + ' fallos' : 'OK'); process.exit(fails.length ? 1 : 0);
