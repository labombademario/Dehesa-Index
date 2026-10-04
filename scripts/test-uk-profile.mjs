#!/usr/bin/env node
// Perfil de Reino Unido (paises.html?c=UK, datos de Defra OGL v3.0) y perfil de EE. UU. con el grano local. Con navegador real (servidor local en :8123):
// cifras clave = data/uk-stats.json, nombres de serie traducidos (sin inglés en es/fr/it), Defra citado, sin undefined/NaN ni desborde a 390 px,
// «Reino Unido» en el menú de Países, y el grano local de EE. UU. enlazado desde el perfil de EE. UU. y ya no suelto en Mercados. 4 idiomas, 1280/390.
// Uso: node scripts/test-uk-profile.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const uk = JSON.parse(fs.readFileSync('data/uk-stats.json', 'utf8')).countries.UK.series;
const nrm = s => s.replace(/[., \s  ]/g, '');
const beef = uk.find(s => s.id === 'uk-meat-production-beef-and-veal');
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
ok('uk-stats tiene series de todas las familias', ['production', 'income', 'livestock', 'crops', 'crops_regions', 'milk', 'prices', 'trade'].every(g => uk.some(s => s.group === g)));
ok('uk-stats incluye huevos, aves, leche y cereales por región', ['uk-egg-production-total', 'uk-poultry-slaughter-broilers', 'uk-milk-sold-to-dairies', 'uk-reg-production-wheat-england', 'uk-reg-areas-winter-barley-england', 'uk-egg-imports-total', 'uk-egg-processing-output-total', 'uk-dairy-cheese-production', 'uk-auk-price-milling-wheat', 'uk-auk-trade-exports-cheese'].every(id => uk.some(s => s.id === id)));
{ // toda serie de Defra se traduce a es/fr/it con plantillas (nada se queda en inglés)
  const { createRequire } = await import('node:module'); const C = createRequire(import.meta.url)('../js/perfil-claro.js');
  for (const l of ['es', 'fr', 'it']) { const miss = uk.filter(s => C.tl(s.label, l) === s.label); ok('traducción ' + l + ' de todas las series UK (faltan ' + miss.length + (miss[0] ? ': ' + miss[0].label : '') + ')', miss.length === 0); }
}
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const tag = lang + '@' + w;
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/paises.html?c=UK', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => /Defra/.test(document.body.innerText), null, { timeout: 15000 });
  const t = await page.innerText('main');
  ok(tag + ': cifra de producción de carne = JSON', nrm(t).includes(nrm(Math.round(beef.latest).toLocaleString(lang))) || nrm(t).includes(String(Math.round(beef.latest))));
  ok(tag + ': cita a Defra', /Defra/.test(t));
  ok(tag + ': sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(t));
  if (lang !== 'en') ok(tag + ': resumen traducido (sin «Livestock on holdings» ni «Meat production»)', !/Livestock on holdings|Meat production|Slaughterings/.test(t));
  if (w === 390) ok(tag + ': sin desborde horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  ok(tag + ': sin errores de consola' + (errs.length ? ' ' + errs.join(' | ') : ''), errs.length === 0);
  // EE. UU.: tarjeta del grano local
  await page.goto(BASE + '/paises.html?c=US', { waitUntil: 'networkidle' });
  await page.waitForSelector('a[href="precios-locales.html"]', { timeout: 15000 });
  ok(tag + ': el perfil de EE. UU. enlaza el grano local', (await page.$$('main a[href="precios-locales.html"]')).length >= 1);
  if (w === 1280) {
    const nav = await page.$$eval('#di-nav-root a', a => a.map(x => x.getAttribute('href') || ''));
    ok(tag + ': «Reino Unido» en el menú de Países', nav.some(h => /paises\.html\?c=UK/.test(h)));
    ok(tag + ': el grano local ya no está suelto en Mercados', !nav.some(h => /^precios-locales\.html/.test(h)));
  }
  await ctx.close();
}
await browser.close();
console.log(fail ? 'FALLOS ' + fail : 'OK test-uk-profile');
process.exit(fail ? 1 : 0);
