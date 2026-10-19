#!/usr/bin/env node
/* Prueba en navegador del mapa para elegir la zona en «Mi mercado» (js/mi-mercado.js, mapHtml).
   En los 9 países: pulsar una zona elige esa zona en el desplegable y la resalta; las zonas sin datos no se pueden pulsar;
   el teclado (Enter) también elige; el desplegable mueve el resaltado; Reino Unido: Londres y Sudeste son una sola zona de DEFRA.
   Necesita un servidor estático en :8123 (python3 -m http.server 8123). Uso: node scripts/test-mi-mercado-map.mjs */
import { execSync } from 'node:child_process';
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const BASE = process.env.BASE || 'http://localhost:8123';
const fails = []; const ok = (n, c) => { if (!c) { fails.push(n); console.log('FALLA', n); } };
const b = await pw.chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(BASE + '/mi-mercado.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('dehesaIndexLang', 'es'); }); await p.reload(); await p.waitForTimeout(1200);
const CASES = [['ES', '41', 'Sevilla', 50, 2], ['US', 'IA', 'Iowa', 50, 0], ['CA', 'SK', 'Saskatchewan', 10, 3], ['DE', 'BY', 'Baviera', 16, 0], ['UK', 'south-east-and-london', 'Sudeste de Inglaterra y Londres', 12, 0], ['FR', 'OCC', 'Occitania', 13, 0], ['IT', 'EMR', 'Emilia-Romaña', 20, 0], ['PL', 'WP', 'Gran Polonia', 16, 0], ['EL', 'KMA', 'Macedonia Central', 13, 0]];
for (const [cc, pick, name, minN, na] of CASES) {
  await p.click('[data-mm-cc="' + cc + '"]'); await p.waitForSelector('.mm-map-' + cc.toLowerCase() + ' svg', { timeout: 20000 });
  const n = await p.$$eval('.mm-map-' + cc.toLowerCase() + ' [data-mm-map]', a => a.length), nna = await p.$$eval('.mm-map-p.na', a => a.length);
  ok(cc + ': zonas pulsables (' + n + ')', n >= minN); ok(cc + ': zonas sin datos no pulsables (' + nna + ')', nna === na);
  await p.click('[data-mm-map="' + pick + '"]'); await p.waitForTimeout(1200);
  ok(cc + ': el mapa elige en el desplegable', (await p.inputValue('select[data-mm="r"]')) === pick);
  ok(cc + ': nombre elegido', ((await p.textContent('.mm-map-sel')) || '').indexOf(name) > -1);
  ok(cc + ': zona resaltada', (await p.$$eval('.mm-map-p.on', a => a.length)) === (cc === 'UK' ? 2 : 1));
}
// Francia e Italia: con región y cultivo salen superficie, producción y rendimiento (Eurostat), precio de mercado de la Comisión
// (o el aviso de que no hay mercado en la región) y sequía de las zonas NUTS 2 de tu región (EDO), sin errores ni NaN.
// El precio depende de que el mercado haya publicado en las últimas 4 semanas: se acepta la fila o el aviso, nunca una sección vacía.
const EU_CASES = [
  ['FR', 'NOR', 'C1110', 'Trigo blando', /Rouen|no publica un mercado|no publica precios/, /Basse-Normandie[\s\S]*Haute-Normandie/],
  ['FR', 'BFC', 'C1110', 'Trigo blando', /Mercados de Francia con precio reciente|no publica precios/, /Bourgogne[\s\S]*Franche-Comté/],
  ['FR', 'OCC', 'R1000', 'Patata', /no tenemos un precio de mercado de referencia/, /Languedoc-Roussillon[\s\S]*Midi-Pyrénées/],
  ['IT', 'EMR', 'C1110', 'Trigo blando', /Bologna|no publica un mercado|no publica precios/, /Emilia-Romagna/],
  ['IT', 'PUG', 'O1000', 'Olivar', /Bari|no publica un mercado|no publica precios/, /Puglia/],
  ['IT', 'TAA', 'C1500', 'Maíz grano', /Mercados de Italia con precio reciente|no publica precios/, /Bolzano[\s\S]*Trento/],
  ['IT', 'LOM', 'C1500', 'Maíz grano', /Milano|Mantova|no publica un mercado|no publica precios/, /Lombardia/],
  // Polonia: la Comisión no publica mercados regionales vigentes; se muestra la media nacional, rotulada como tal
  ['PL', 'MZ', 'C1110', 'Trigo blando', /media nacional[\s\S]*Media nacional|no publica precios/, /Warszawski[\s\S]*Mazowiecki/],
  ['PL', 'SK', 'C1300', 'Cebada', /Media nacional|no publica precios/, /Świętokrzyskie/],
  ['PL', 'LU', 'R1000', 'Patata', /no tenemos un precio de mercado de referencia/, /Lubelskie/],
  // Grecia: mercados por prefectura asignados a su región; sin mercado en la región, aviso y lista
  ['EL', 'KRI', 'O1000', 'Olivar', /Heraklion|Ηράκλειο|Χανιά|no publica un mercado|no publica precios/, /Kriti/],
  ['EL', 'DMA', 'C1110', 'Trigo blando', /Kozani|Grevena|no publica un mercado|no publica precios/, /Dytiki Makedonia/],
  ['EL', 'ATT', 'C1110', 'Trigo blando', /Mercados de Grecia con precio reciente|no publica precios/, /Attiki/]
];
for (const [cc, r, crop, txt, rxPrice, rxDr] of EU_CASES) {
  await p.click('[data-mm-cc="' + cc + '"]'); await p.waitForSelector('[data-mm-map="' + r + '"]'); await p.locator('[data-mm-map="' + r + '"]').dispatchEvent('click'); await p.waitForTimeout(600);
  await p.selectOption('select[data-mm="p"]', crop); await p.waitForTimeout(1800);
  const sec = async id => (await p.$eval('[data-mm-sec="' + id + '"]', e => e.innerText).catch(() => ''));
  const body = await p.textContent('#mm-root, body'), price = await sec('price'), dr = await sec('dr'), tag = cc + ' ' + r + ' ' + crop;
  ok(tag + ': tarjeta del cultivo', body.indexOf(txt) > -1 && (crop === 'R1000' || /Superficie[\s\S]*ha/.test(body)) && /Eurostat/.test(body));
  ok(tag + ': sección de precio con fila o aviso', rxPrice.test(price));
  ok(tag + ': sequía con las zonas de la región y porcentajes', rxDr.test(dr) && /\d+,\d %/.test(dr) && /Observatorio Europeo de la Sequía/.test(dr));
  ok(tag + ': sin «NaN» ni «undefined»', !/NaN|undefined/.test(body));
}
await p.click('[data-mm-cc="ES"]'); await p.waitForSelector('[data-mm-map="28"]'); await p.focus('[data-mm-map="28"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(1200);
ok('teclado: Enter elige Madrid', (await p.inputValue('select[data-mm="r"]')) === '28');
ok('teclado: el foco sigue en la zona', (await p.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-mm-map'))) === '28');
await p.selectOption('select[data-mm="r"]', '50'); await p.waitForTimeout(1200);
ok('el desplegable mueve el resaltado', (await p.$$eval('.mm-map-p.on', a => a.map(x => x.getAttribute('data-mm-map')).join())) === '50');
ok('sin errores de JavaScript', !errs.length); if (errs.length) console.log(errs.join('\n'));
await b.close();
console.log('test-mi-mercado-map:', fails.length ? fails.length + ' fallos' : 'OK'); process.exit(fails.length ? 1 : 0);
