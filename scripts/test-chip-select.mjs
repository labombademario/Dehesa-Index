#!/usr/bin/env node
// Norma del sitio (21-oct-2026): los desplegables con data-chips se ven como botones con emoticono (js/chip-select.js). Prueba con navegador real en la
// ficha de Dinamarca (cosecha por región): hay botones, el elegido va marcado, «Ver todos» despliega el resto, pulsar un botón cambia el bloque,
// el <select> original queda oculto y sincronizado, y no hay desborde a 390 px. 4 idiomas x 2 anchos. Uso: node scripts/test-chip-select.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : (await import('node:fs')).existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
let fails = 0, n = 0; const ok = (m, c) => { n++; if (!c) { fails++; console.log('FALLO ' + m); } };
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const tag = lang + '/' + w, ctx = await b.newContext({ viewport: { width: w, height: 900 } }); const page = await ctx.newPage();
  await page.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(BASE + '/paises.html?c=DK#eu-dk-harvest', { waitUntil: 'networkidle' });
  await page.evaluate(() => { const d = document.getElementById('eu-dk-harvest'); let a = d; while (a) { if (a.tagName === 'DETAILS') a.open = true; a = a.parentElement; } });
  await page.waitForSelector('#eu-dk-harvest .dch', { timeout: 15000 });
  const s0 = await page.evaluate(() => { const g = [...document.querySelectorAll('#eu-dk-harvest .dch')]; return { groups: g.length, crop: g[0].querySelectorAll('[data-dch-v]').length, vis: [...g[0].querySelectorAll('[data-dch-v]')].filter(x => x.offsetParent).length,
    emo: [...g[0].querySelectorAll('[data-dch-v] span[aria-hidden]')].length, sel: document.querySelector('#eu-dk-harvest select[data-k="crop"]').offsetParent === null, pressed: g[0].querySelectorAll('[aria-pressed="true"]').length }; });
  ok(tag + ': dos grupos de botones (cultivo y medida)', s0.groups >= 2);
  ok(tag + ': lista larga recortada a 8 + el elegido', s0.crop > 9 && s0.vis <= 9);
  ok(tag + ': los cultivos llevan emoticono', s0.emo >= s0.crop - 3);
  ok(tag + ': el desplegable original queda oculto', s0.sel);
  ok(tag + ': un solo botón marcado', s0.pressed === 1);
  await page.click('#eu-dk-harvest [data-dch-more]');
  ok(tag + ': «Ver todos» enseña todos', await page.evaluate(() => { const g = document.querySelector('#eu-dk-harvest .dch'); return [...g.querySelectorAll('[data-dch-v]')].every(x => x.offsetParent); }));
  const before = await page.evaluate(() => document.querySelector('#eu-dk-harvest .de-tiles').innerText);
  await page.click('#eu-dk-harvest .dch:nth-of-type(1) [data-dch-v]:not([aria-pressed="true"]) >> nth=2');
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => ({ t: document.querySelector('#eu-dk-harvest .de-tiles').innerText, v: document.querySelector('#eu-dk-harvest select[data-k="crop"]').value, p: document.querySelector('#eu-dk-harvest .dch [aria-pressed="true"]').textContent }));
  ok(tag + ': pulsar un cultivo cambia las cifras', after.t !== before);
  ok(tag + ': el <select> oculto sigue sincronizado', !!after.v);
  ok(tag + ': sin desborde horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  ok(tag + ': sin errores de consola ' + errs.join(' | '), !errs.length);
  await ctx.close();
}
await b.close();
console.log(fails ? 'test-chip-select: ' + fails + ' fallos de ' + n : 'test-chip-select: OK (' + n + ' comprobaciones, 4 idiomas x 2 anchos)');
process.exit(fails ? 1 : 0);
