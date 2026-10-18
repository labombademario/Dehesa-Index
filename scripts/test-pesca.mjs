#!/usr/bin/env node
// Pesca y acuicultura (pesca.html y bloque de la ficha de pais; js/pesca.js): cifras = data/views/fish/<CC>.json, tablas y graficas presentes,
// cambiar de pais, especies traducidas en es (sin la etiqueta inglesa si el glosario la tiene), sin undefined/NaN ni desborde a 390 px,
// fuente citada, selector de sector con «Pesca». 4 idiomas, 1280/390. Servidor local en :8123.
// Uso: node scripts/test-pesca.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const nrm = s => s.replace(/[., \s  ]/g, '');
const V = cc => JSON.parse(fs.readFileSync('data/views/fish/' + cc + '.json', 'utf8'));
const last = a => { for (let i = (a || []).length - 1; i >= 0; i--) if (a[i][1] != null) return a[i]; return null; };
const idx = JSON.parse(fs.readFileSync('data/views/fish/index.json', 'utf8'));
ok('indice con >= 20 paises', idx.countries.length >= 20);
for (const cc of ['ES', 'US', 'AT']) ok('vista ' + cc, fs.existsSync('data/views/fish/' + cc + '.json'));
const es = V('ES'); ok('ES con especies desembarcadas', es.landings.length >= 5); ok('ES con capturas totales', !!last(es.series['ca-total']));
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
  // pagina, Espana
  let { ctx, page, errs } = await open('/pesca.html?c=ES', lang, w);
  await page.waitForSelector('#fsh-body .fsh-kpis', { timeout: 15000 }).catch(() => {});
  let r = await page.evaluate(() => { const b = document.getElementById('fsh-body'); return b ? { t: b.innerText, k: b.querySelectorAll('.fsh-kpi').length, tb: b.querySelectorAll('table.fsh-tbl').length, svg: b.querySelectorAll('svg.wp-svg').length, src: !!b.querySelector('a[href*="eurostat"]'), over: document.documentElement.scrollWidth > window.innerWidth + 2, h1: document.getElementById('fsh-h1').textContent } : null; });
  ok(tag + ' pagina presente', !!r);
  if (r) {
    ok(tag + ' >= 6 cifras, >= 5 tablas, 2 graficas', r.k >= 6 && r.tb >= 5 && r.svg === 2);
    ok(tag + ' sin undefined/NaN', !/undefined|NaN/.test(r.t));
    ok(tag + ' fuente Eurostat enlazada', r.src);
    ok(tag + ' sin desborde horizontal', !r.over);
    const c = last(es.series['ca-total']); ok(tag + ' capturas = JSON', nrm(r.t).indexOf(nrm(Math.round(c[1]).toLocaleString({ es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }[lang]))) > -1);
    if (lang === 'es') ok(tag + ' especie traducida (merluza)', /merluza/i.test(r.t) && !/European hake/.test(r.t));
  }
  // cambiar a EE. UU. desde el selector
  await page.evaluate(() => { const s = document.getElementById('fsh-cc'); s.value = 'US'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await page.waitForTimeout(800);   // el selector de pais es ahora el buscador de paises; el <select> original sigue oculto y recibe el cambio
  r = await page.evaluate(() => { const b = document.getElementById('fsh-body'); return { t: b.innerText, url: location.search, noaa: !!b.querySelector('a[href*="noaa"]') }; });
  ok(tag + ' EE. UU.: URL y fuente NOAA', /c=US/.test(r.url) && r.noaa);
  const us = V('US'), v = last(us.series['ld-total-usd']); ok(tag + ' EE. UU.: ano del total = JSON', r.t.indexOf(v[0]) > -1 && !/undefined|NaN/.test(r.t));
  ok(tag + ' pagina sin errores de consola (' + errs.join('; ') + ')', errs.length === 0);
  await ctx.close();
  // ficha de pais con el sector «Pesca»
  ({ ctx, page, errs } = await open('/paises.html?c=ES', lang, w));
  await page.waitForSelector('#ps-sector [data-sec="fish"]', { timeout: 15000 }).catch(() => {});
  ok(tag + ' ficha: boton Pesca en el selector de sector', !!(await page.$('#ps-sector [data-sec="fish"]')));
  await page.click('#ps-sector [data-sec="fish"]').catch(() => {});
  await page.waitForSelector('#pp-fish', { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(400);
  for (let i = 0; i < 6 && !(await page.$('#ps-fish .fsh-kpi')); i++) { await page.evaluate(() => { const e = document.getElementById('pp-fish'); if (e) e.scrollIntoView(); }); await page.waitForTimeout(700); }
  r = await page.evaluate(() => { const s = document.getElementById('ps-fish'); return s ? { t: s.innerText, k: s.querySelectorAll('.fsh-kpi').length, link: !!s.querySelector('a[href*="pesca.html?c=ES"]'), over: document.documentElement.scrollWidth > window.innerWidth + 2, pressed: document.querySelector('#ps-sector [data-sec="fish"]').getAttribute('aria-pressed') } : null; });
  ok(tag + ' ficha: bloque de pesca', !!r);
  if (r) {
    ok(tag + ' ficha: cifras y enlace a la pagina', r.k >= 6 && r.link);
    ok(tag + ' ficha: sector Pesca marcado', r.pressed === 'true');
    ok(tag + ' ficha: sin undefined/NaN ni desborde', !/undefined|NaN/.test(r.t) && !r.over);
  }
  ok(tag + ' ficha sin errores de consola (' + errs.join('; ') + ')', errs.length === 0);
  await ctx.close();
}
await browser.close();
if (fail) { console.log('FALLOS', fail); process.exit(1); }
console.log('OK test-pesca');
