#!/usr/bin/env node
// España, precio de la tierra y canones (MAPA): las cifras que se ven = data/spain-land/land.json (media nacional, extremos, mapa de comunidades y de provincias, tabla, selectores, canon, grafico), atribucion, 4 idiomas, 1280/390. Uso: node scripts/test-es-land.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process'; import { readFileSync } from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
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
  let m = await get();
  ok(tag + ' bloque visible', !m.hidden && m.svgs >= 2);
  ok(tag + ' mapa de 17 comunidades', m.paths === 17);
  ok(tag + ' media nacional = JSON', norm(m.txt).includes(num(NAT, lang)));
  ok(tag + ' 17 comunidades y total en la tabla', m.rows >= 17);
  ok(tag + ' cita MAPA', /MAPA/.test(m.txt));
  ok(tag + ' sin desborde', !m.over);
  if (w === 1280) {
    await page.selectOption('#in-es-land .gb-lvl', 'prov'); m = await get();
    ok(tag + ' mapa de provincias (50 + Ceuta y Melilla sin dato)', m.paths === 52);
    ok(tag + ' provincia sin dato publicado de tierras arables: tabla con las que si', m.rows > 40 && m.rows <= 50);
    await page.selectOption('#in-es-land .gb-type', 'TAR'); m = await get();
    ok(tag + ' Baleares tierras arables regadio = JSON', BAL.TAR == null || norm(m.txt).includes(num(BAL.TAR, lang)));
    await page.selectOption('#in-es-land .gb-m', 'rent'); m = await get();
    ok(tag + ' canon general nacional = JSON', norm(m.txt).includes(num(RENT, lang)) && m.paths === 17);
    await page.selectOption('#in-es-land .gb-reg', 'GA'); m = await get();
    ok(tag + ' grafico con 5 anos', norm(m.txt).includes(String(J.years[0])));
  }
  ok(tag + ' sin errores de consola', errs.length === 0); if (errs.length) console.log(errs);
  await ctx.close();
}
await browser.close(); console.log(fail ? 'test-es-land: ' + fail + ' fallos' : 'test-es-land: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
