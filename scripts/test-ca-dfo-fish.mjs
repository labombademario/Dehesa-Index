#!/usr/bin/env node
// Canada en Pesca (pesca.html?c=CA y bloque de la ficha de Canada; js/pesca.js): cifras = data/views/fish/CA.json (valor en M C$, miles de t, valor medio por kilo),
// 2 graficas, tablas de especies (traducidas) y de provincias, fuente DFO con licencia, nota de supresiones, Canada fuera de la comparativa de la UE,
// sin undefined/NaN, sin desborde a 390 px ni errores de consola. 4 idiomas, 1280/390. Servidor local en :8123.
// Uso: node scripts/test-ca-dfo-fish.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const nrm = s => s.replace(/[., \s  ]/g, '');
const V = JSON.parse(fs.readFileSync('data/views/fish/CA.json', 'utf8'));
const idx = JSON.parse(fs.readFileSync('data/views/fish/index.json', 'utf8'));
const last = a => { for (let i = a.length - 1; i >= 0; i--) if (a[i][1] != null) return a[i]; return null; };
ok('indice con Canada', idx.countries.some(r => r.cc === 'CA'));
const val = last(V.series['ld-total-cad']), qty = last(V.series['ld-total-t']);
ok('mismo ano en valor y cantidad', val[0] === qty[0]);
const wantVal = String(Math.round(val[1] / 1e6)), wantQty = String(Math.round(qty[1] / 1e3)), wantAvg = (val[1] / (qty[1] * 1000)).toFixed(2).replace('.', '');
const TR = { es: ['bogavante', 'Lobster'], en: ['lobster', null], fr: ['homard', 'Lobster'], it: ['astice', 'Lobster'] };
const PR = { es: 'Nueva Escocia', en: 'Nova Scotia', fr: 'Nouvelle-Écosse', it: 'Nuova Scozia' };
async function open(url, lang, w) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); localStorage.removeItem('di-sector-v1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 140)); });
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  return { ctx, page, errs };
}
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const tag = lang + '@' + w;
  let { ctx, page, errs } = await open('/pesca.html?c=CA', lang, w);
  await page.waitForSelector('#fsh-body .fsh-kpis .fsh-kpi', { timeout: 15000 }).catch(() => {});
  let r = await page.evaluate(() => { const b = document.getElementById('fsh-body'); return b ? { t: b.innerText, k: b.querySelectorAll('.fsh-kpi').length, tb: b.querySelectorAll('table.fsh-tbl').length, svg: b.querySelectorAll('svg.wp-svg').length,
    src: !!b.querySelector('a[href*="open.canada.ca"]'), noaa: !!b.querySelector('a[href*="noaa"]'), eurostat: !!b.querySelector('a[href*="eurostat"]'), over: document.documentElement.scrollWidth > window.innerWidth + 1, rows: [].map.call(b.querySelectorAll('table.fsh-tbl tbody tr'), x => x.innerText) } : null; });
  ok(tag + ' pagina presente', !!r);
  if (r) {
    const t = nrm(r.t);
    ok(tag + ' 3 cifras, 3 tablas (especies, provincias, comparativa), 2 graficas', r.k === 3 && r.tb === 3 && r.svg === 2);
    ok(tag + ' valor = JSON (' + wantVal + ' M C$)', t.indexOf(wantVal) > -1 && /C\$/.test(r.t));
    ok(tag + ' cantidad = JSON (' + wantQty + ' kt)', t.indexOf(wantQty) > -1);
    ok(tag + ' valor medio por kilo = JSON (' + wantAvg + ')', t.indexOf(wantAvg) > -1);
    ok(tag + ' ano = JSON', r.t.indexOf(val[0]) > -1);
    ok(tag + ' sin undefined/NaN', !/undefined|NaN/.test(r.t));
    ok(tag + ' fuente DFO enlazada, sin NOAA ni Eurostat', r.src && !r.noaa && !r.eurostat);
    ok(tag + ' nota de Canada (supresiones) y no la de la UE', /DFO|MPO/.test(r.t) && !/Eurostat/.test(r.t));
    ok(tag + ' sin desborde horizontal', !r.over);
    ok(tag + ' especie traducida (' + TR[lang][0] + ')', new RegExp(TR[lang][0], 'i').test(r.t) && (!TR[lang][1] || r.t.indexOf(TR[lang][1]) < 0));
    ok(tag + ' provincia traducida (' + PR[lang] + ')', r.t.indexOf(PR[lang]) > -1);
    ok(tag + ' Canada en la comparativa de la UE', r.tb === 3);
    const top = V.landings[0]; ok(tag + ' primera especie = la de mayor valor del JSON', r.rows.some(x => nrm(x).indexOf(String(Math.round(last(top.value)[1] / 1e6))) > -1));
  }
  ok(tag + ' pagina sin errores de consola (' + errs.join('; ') + ')', errs.length === 0);
  // Canada desaparece de la comparativa de otro pais
  await page.evaluate(() => { const s = document.getElementById('fsh-cc'); s.value = 'ES'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await page.waitForTimeout(800);
  r = await page.evaluate(() => ({ cmp: [].map.call(document.querySelectorAll('#fsh-body .fsh-row'), x => x.getAttribute('data-cc')), opt: !![].find.call(document.querySelectorAll('#fsh-cc option'), o => o.value === 'CA') }));
  ok(tag + ' Canada en el selector pero no en la comparativa de la UE', r.opt && r.cmp.indexOf('CA') < 0 && r.cmp.length >= 20);
  await ctx.close();
  // ficha de Canada
  ({ ctx, page, errs } = await open('/paises.html?c=CA', lang, w));
  await page.waitForSelector('#pp-fish', { state: 'attached', timeout: 15000 }).catch(() => {});
  for (let i = 0; i < 8 && !(await page.$('#ps-fish .fsh-kpi')); i++) { await page.evaluate(() => { const e = document.getElementById('pp-fish'); if (e) e.scrollIntoView(); }); await page.waitForTimeout(700); }
  r = await page.evaluate(() => { const s = document.getElementById('ps-fish'); return s ? { t: s.innerText, k: s.querySelectorAll('.fsh-kpi').length, svg: s.querySelectorAll('svg.wp-svg').length, link: !!s.querySelector('a[href*="pesca.html?c=CA"]'), src: !!s.querySelector('a[href*="open.canada.ca"]'), over: document.documentElement.scrollWidth > window.innerWidth + 1 } : null; });
  ok(tag + ' ficha: bloque de pesca de Canada', !!r);
  if (r) {
    ok(tag + ' ficha: 3 cifras, 1 grafica, enlace a la pagina y fuente DFO', r.k === 3 && r.svg === 1 && r.link && r.src);
    ok(tag + ' ficha: cifras = JSON', nrm(r.t).indexOf(wantVal) > -1 && nrm(r.t).indexOf(wantQty) > -1);
    ok(tag + ' ficha: sin undefined/NaN ni desborde', !/undefined|NaN/.test(r.t) && !r.over);
    ok(tag + ' ficha: tres especies principales traducidas', new RegExp(TR[lang][0], 'i').test(r.t));
  }
  ok(tag + ' ficha sin errores de consola (' + errs.join('; ') + ')', errs.length === 0);
  await ctx.close();
}
await browser.close();
if (fail) { console.log('FALLOS', fail); process.exit(1); }
console.log('OK test-ca-dfo-fish');
