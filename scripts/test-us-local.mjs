#!/usr/bin/env node
// Pestañas Ganado y Heno de precios-locales.html con navegador real (servidor local en :8123): las cifras de las tarjetas son las de data/us-local/*.json,
// los selectores cambian el contenido, el cambio de pestaña actualiza título y URL, no hay undefined/NaN y no hay desbordes a 390 px, en los 4 idiomas.
// Uso: node scripts/test-us-local.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const C = JSON.parse(fs.readFileSync('data/us-local/cattle-KS.json', 'utf8')), N = JSON.parse(fs.readFileSync('data/us-local/cattle-NE.json', 'utf8'));
const Hy = JSON.parse(fs.readFileSync('data/us-local/hay-KS.json', 'utf8')), HT = JSON.parse(fs.readFileSync('data/us-local/hay-TX.json', 'utf8'));
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const nrm = s => s.replace(/[., \s  −-]/g, '');
const fx = (n, d) => nrm(n.toFixed(d));
const last = a => a[a.length - 1];
const st = last(C.history['Steers|500']), rc = C.latest.receipts;
const hrow = Hy.latest.rows.find(r => r[0] === 'Alfalfa' && r[3] === 'Per Ton' && r[14] != null);
const titles = {};
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  const body = async () => (await page.evaluate(() => document.querySelector('#pl-ext').innerText)).replace(/ | /g, ' ');
  const wait = sel => page.waitForSelector(sel, { timeout: 8000 });
  await page.goto(BASE + '/precios-locales.html?t=cattle&s=KS', { waitUntil: 'networkidle' }); await wait('#pl-ext .de-tile');
  const h1 = await page.textContent('#pl-h1'); titles[lang] = titles[lang] || h1;
  ok(tag + ': título de ganado distinto del de grano', h1 && !/grano|grain|grains|cereali/i.test(h1));
  ok(tag + ': tres pestañas y Ganado activa', (await page.$$('#pl-tabs [data-pltab]')).length === 3 && (await page.getAttribute('#pl-tabs [data-pltab="cattle"]', 'aria-pressed')) === 'true');
  ok(tag + ': el cuerpo de grano está oculto', await page.$eval('#pl-body', e => e.offsetParent === null));
  let t = await body(), tt = nrm(t);
  ok(tag + ': Kansas, precio 500 lb steers', tt.includes(fx(st[1], 2)) && tt.includes(fx(st[2], 0)));
  ok(tag + ': cabezas totales de la semana', tt.includes(String(rc.week)) || tt.includes(nrm(rc.week.toLocaleString('en'))));
  ok(tag + ': tabla de referencia', (await page.$$('#pl-ext table tbody tr')).length >= 10);
  ok(tag + ': sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(t));
  ok(tag + ': hay gráfica', (await page.$$('#pl-ext svg')).length >= 1);
  await page.selectOption('[data-us="state"]', 'NE'); await page.waitForFunction(() => { const x = document.querySelector('#pl-ext [data-us="state"]'); return x && x.value === 'NE'; });
  await page.waitForTimeout(400); t = await body(); tt = nrm(t);
  const ns = last(N.history['Steers|500']);
  ok(tag + ': Nebraska cambia las cifras', tt.includes(fx(ns[1], 2)) && !tt.includes(fx(st[1], 2)));
  ok(tag + ': la URL guarda estado', /t=cattle&s=NE/.test(page.url()));
  await page.click('[data-uscls="Heifers"]'); await page.waitForTimeout(300); t = await body(); ok(tag + ': hembras', !/undefined|NaN/.test(t) && nrm(t) !== tt);
  await page.click('#pl-ext details > summary'); await page.waitForTimeout(200); t = await body(); ok(tag + ': tabla completa abre sin undefined', !/undefined|NaN/.test(t));
  // pestaña Heno
  await page.click('[data-pltab="hay"]'); await wait('#pl-ext [data-usk]'); await page.waitForTimeout(300);
  ok(tag + ': título cambia a heno', (await page.textContent('#pl-h1')) !== h1 && /t=hay/.test(page.url()));
  t = await body(); tt = nrm(t);
  ok(tag + ': heno, fila de alfalfa con media', tt.includes(fx(hrow[14], 2)));
  ok(tag + ': heno, filas', (await page.$$('#pl-ext [data-usk]')).length >= 10 && !/undefined|NaN|\[object/.test(t));
  const k1 = await page.$$eval('#pl-ext [data-usk]', e => e.map(x => x.getAttribute('data-usk'))); await page.click('#pl-ext [data-usk]:nth-of-type(3)').catch(() => {});
  await page.selectOption('[data-us="state"]', 'TX'); await page.waitForTimeout(500); t = await body();
  const cl = [...new Set(HT.latest.rows.map(r => r[0]))].sort(), un = [...new Set(HT.latest.rows.map(r => r[3]))];
  const tcl = cl.includes('Alfalfa') ? 'Alfalfa' : cl[0], tun = un.includes('Per Ton') ? 'Per Ton' : un[0];
  const tx = HT.latest.rows.find(r => r[0] === tcl && r[3] === tun);
  ok(tag + ': heno de Texas', !!tx && nrm(t).includes(fx(tx[12], 2)) && nrm(t).includes(fx(tx[13], 2)) && !/undefined|NaN/.test(t));
  // volver a grano
  await page.click('[data-pltab="grain"]'); await page.waitForSelector('#pl-body table, #pl-body .di-movers-hint', { timeout: 8000 }); await page.waitForTimeout(500);
  ok(tag + ': grano vuelve a verse', await page.$eval('#pl-body', e => e.offsetParent !== null) && await page.$eval('#pl-ext', e => e.offsetParent === null));
  // desborde
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok(tag + ': sin desborde horizontal de página (' + ov + ')', ov <= 1);
  await page.goto(BASE + '/precios-locales.html?t=hay&s=MT', { waitUntil: 'networkidle' }); await wait('#pl-ext [data-usk]');
  const ov2 = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok(tag + ': heno sin desborde (' + ov2 + ')', ov2 <= 1);
  for (const sc of ['MT', 'FL', 'TX', 'IA']) {
    const D = JSON.parse(fs.readFileSync('data/us-local/cattle-' + sc + '.json', 'utf8')), pt = last(D.history['Steers|500']);
    await page.goto(BASE + '/precios-locales.html?t=cattle&s=' + sc, { waitUntil: 'networkidle' }); await wait('#pl-ext .de-tile');
    const x = await body();
    ok(tag + ': ganado ' + sc + ' con precio 500 lb', nrm(x).includes(fx(pt[1], 2)) && !/undefined|NaN|\[object/.test(x));
  }
  ok(tag + ': sin errores de consola', errs.length === 0); if (errs.length) console.log(tag, errs.slice(0, 3));
  await ctx.close();
}
await browser.close();
if (fail) { console.log(fail + ' fallos'); process.exit(1); }
console.log('test-us-local: OK (cattle/hay × 4 idiomas × 2 anchos)');
