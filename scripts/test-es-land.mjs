#!/usr/bin/env node
// España, precio de la tierra y canones (MAPA): las cifras que se ven = data/spain-land/land.json (media nacional, extremos, mapa de comunidades y de provincias, tabla, selectores, canon, grafico), atribucion, 4 idiomas, 1280/390. Uso: node scripts/test-es-land.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process'; import { readFileSync } from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
// los desplegables con data-chips quedan ocultos tras sus botones (js/chip-select.js): se elige en el <select> y se lanza «change», como hace el boton
async function selectHidden(pg, sel, val) { await pg.waitForSelector(sel, { state: 'attached' }); await pg.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, val); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const J = JSON.parse(readFileSync('data/spain-land/land.json', 'utf8')), L = J.years.length - 1;
const num = (v, lang) => { const d = v >= 100 ? 0 : 1; return v.toLocaleString({ es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }[lang], { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }).replace(/[  ]/g, ' '); };
const norm = s => s.replace(/[  ]/g, ' ');
const NAT = J.price.ccaa.ES.PT[L], RENT = J.rent.ccaa.ES.GEN[L], GA = J.price.ccaa.GA.PT[L], BAL = J.price.prov.values['07'];
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  const get = () => page.evaluate(() => { var c = document.getElementById('in-es-land'); return { txt: c ? c.innerText : '', paths: c ? c.querySelectorAll('path.gb-prov').length : 0, rows: c ? c.querySelectorAll('table tbody tr').length : 0, svgs: c ? c.querySelectorAll('svg').length : 0, hidden: c ? c.hidden : true, over: document.documentElement.scrollWidth > window.innerWidth + 2 }; });
  await page.goto(BASE + '/insumos.html', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('[data-catab="es"]', { timeout: 10000, state: 'attached' }).catch(() => {}); await page.click('[data-catab="es"]');
  await page.waitForSelector('#in-es-land:not([hidden]) .gb-card', { timeout: 8000 }).catch(() => {});
  // tras cambiar un selector el bloque puede cargar otro fichero: se espera hasta 6 s a que se cumpla la condicion (antes fallaba a ratos en la CI)
  const until = async pred => { let x; for (let i = 0; i < 30; i++) { x = await get(); if (pred(x)) return x; await page.waitForTimeout(200); } return x; };
  // si el bloque se vuelve a pintar (llega otro fichero) el selector se sustituye y pierde el valor: se vuelve a elegir hasta que se cumpla
  const pick = async (sel, val, pred) => { let x; for (let i = 0; i < 30; i++) { const cur = await page.$eval(sel, e => e.value).catch(() => null); if (cur !== val) await selectHidden(page, sel, val); x = await get(); if (pred(x)) return x; await page.waitForTimeout(200); } return x; };
  let m = await get();
  ok(tag + ' bloque visible', !m.hidden && m.svgs >= 2);
  ok(tag + ' mapa de 17 comunidades', m.paths === 17);
  ok(tag + ' media nacional = JSON', norm(m.txt).includes(num(NAT, lang)));
  ok(tag + ' 17 comunidades y total en la tabla', m.rows >= 17);
  ok(tag + ' cita MAPA', /MAPA/.test(m.txt));
  ok(tag + ' sin desborde', !m.over);
  if (w === 1280) {
    m = await pick('#in-es-land .gb-lvl', 'prov', x => x.paths === 52);
    ok(tag + ' mapa de provincias (50 + Ceuta y Melilla sin dato)', m.paths === 52);
    ok(tag + ' provincia sin dato publicado de tierras arables: tabla con las que si', m.rows > 40 && m.rows <= 50);
    m = await pick('#in-es-land .gb-type', 'TAR', x => BAL.TAR == null || norm(x.txt).includes(num(BAL.TAR, lang)));
    ok(tag + ' Baleares tierras arables regadio = JSON', BAL.TAR == null || norm(m.txt).includes(num(BAL.TAR, lang)));
    m = await pick('#in-es-land .gb-m', 'rent', x => norm(x.txt).includes(num(RENT, lang)) && x.paths === 17);
    ok(tag + ' canon general nacional = JSON', norm(m.txt).includes(num(RENT, lang)) && m.paths === 17);
    m = await pick('#in-es-land .gb-reg', 'GA', x => norm(x.txt).includes(String(J.years[0])));
    ok(tag + ' grafico con 5 anos', norm(m.txt).includes(String(J.years[0])));
  }
  ok(tag + ' sin errores de consola', errs.length === 0); if (errs.length) console.log(errs);
  await ctx.close();
}
await browser.close(); console.log(fail ? 'test-es-land: ' + fail + ' fallos' : 'test-es-land: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
