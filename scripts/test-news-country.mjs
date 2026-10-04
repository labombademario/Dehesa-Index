#!/usr/bin/env node
// Noticias: filtro región → país (país del medio). El selector de país solo ofrece países con noticias en la región elegida,
// cada opción muestra su recuento real, filtrar por país deja solo noticias de ese país (= JSON), cambiar de región reinicia el país,
// la URL lleva ?country= y las noticias sin país solo aparecen con «Todos». 4 idiomas, 1280/390, sin undefined/NaN ni desborde.
// Uso: node scripts/test-news-country.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const feed = JSON.parse(fs.readFileSync('data/views/news-feed.json', 'utf8')).items;
const euCount = {}; feed.filter(i => i.r === 'eu' && i.c).forEach(i => { euCount[i.c] = (euCount[i.c] || 0) + 1; });
const top = Object.keys(euCount).sort((a, b) => euCount[b] - euCount[a])[0];
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
ok('hay países en el JSON de la UE', !!top);
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const tag = lang + '@' + w;
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/noticias.html?region=eu', { waitUntil: 'networkidle' });
  await page.waitForSelector('#nw-country-filter option', { state: 'attached' });
  const opts = await page.$$eval('#nw-country-filter option', o => o.map(x => ({ v: x.value, t: x.textContent })));
  ok(tag + ': opción «todos» + países de la UE', opts[0].v === 'all' && opts.length - 1 === Object.keys(euCount).length);
  ok(tag + ': solo países con noticias en la región', opts.slice(1).every(o => euCount[o.v]));
  ok(tag + ': recuento por país = JSON (' + top + ')', opts.some(o => o.v === top && o.t.endsWith('(' + euCount[top] + ')')));
  ok(tag + ': etiqueta traducida', !!(await page.innerText('label[for=nw-country-filter]')).trim());
  await page.selectOption('#nw-country-filter', top);
  await page.waitForFunction(() => /country=/.test(location.search));
  const summary = await page.innerText('#nw-filter-summary');
  const shown = +(summary.match(/\d+/) || [0])[0];
  const expected = feed.filter(i => i.r === 'eu' && i.c === top).length;
  ok(tag + ': recuento del resumen = JSON (' + shown + ' vs ' + expected + ')', shown === expected);
  const srcs = await page.$$eval('#nw-items a, #nw-items .di-news-source, #nw-items [class*=source]', n => n.length);
  ok(tag + ': hay titulares', srcs > 0);
  await page.selectOption('#nw-region-filter', 'us');
  ok(tag + ': cambiar de región reinicia el país', (await page.inputValue('#nw-country-filter')) === 'all' && !/country=/.test(page.url()));
  const t = await page.innerText('main');
  ok(tag + ': sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(t));
  if (w === 390) ok(tag + ': sin desborde horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  ok(tag + ': sin errores de consola' + (errs.length ? ' ' + errs.join(' | ') : ''), errs.length === 0);
  await ctx.close();
}
await browser.close();
console.log(fail ? 'FALLOS ' + fail : 'OK test-news-country');
process.exit(fail ? 1 : 0);
