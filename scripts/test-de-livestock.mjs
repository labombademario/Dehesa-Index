#!/usr/bin/env node
// Pestaña «Ganadería, huevos y fruta» de la página de Alemania, con navegador real (servidor local en :8123): cada cifra de las tarjetas y tablas es la de
// data/germany-livestock.json, los selectores cambian el contenido, no hay undefined/NaN, y no hay desbordes a 390 px, en los 4 idiomas.
// Uso: node scripts/test-de-livestock.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const D = JSON.parse(fs.readFileSync('data/germany-livestock.json', 'utf8'));
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const last = a => a[a.length - 1], at = (a, p) => (a.find(x => x[0] === p) || [])[1];
const grp = (n, sep) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
const nat = D.slaughter.nat.pigs.heads.dom, ly = last(nat), tn = D.slaughter.nat.pigs.tonnes.dom;
const cat = last(D.herd.cattle.total), ag = last(D.eggs.nat.eggs), ap = last(D.fruit.apples.prod);
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/paises.html?c=DE', { waitUntil: 'networkidle' }); await page.waitForSelector('#ps-de details', { timeout: 8000 });
  await page.click('#ps-de details > summary'); await page.waitForSelector('[data-dt="live"]'); await page.click('[data-dt="live"]'); await page.waitForSelector('[data-lsub]', { timeout: 8000 });
  const sep = lang === 'en' ? ',' : lang === 'fr' ? ' ' : '.';
  const txt = async () => (await page.evaluate(() => document.querySelector('#ps-de .de-pane').innerText)).replace(/ | /g, ' ');
  const nrm = s => s.replace(/[., \s]/g, '');
  let t = await txt(), tt = nrm(t);
  ok(tag + ': sacrificio porcino, tabla con 16 filas como mucho y nacional', (await page.$$('#ps-de .de-pane tbody tr')).length >= 13);
  ok(tag + ': cerdos sacrificados, año y total', t.includes(ly[0]) && tt.includes(nrm((ly[1] / 1e6).toFixed(2))));
  ok(tag + ': peso medio de canal', tt.includes(String(Math.round(at(tn, ly[0]) * 1000 / ly[1]))));
  ok(tag + ': sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(t));
  await page.click('[data-lvn="tonnes"]'); t = await txt(); ok(tag + ': toneladas cambia el título', /t\b/.test(t) && !/undefined|NaN/.test(t));
  for (const sp of ['cattle', 'calves', 'sheep']) { await page.click('[data-lsp="' + sp + '"]'); t = await txt(); ok(tag + ': especie ' + sp, !/undefined|NaN/.test(t) && (await page.$$('#ps-de .de-pane svg')).length >= 1); }
  await page.click('[data-lsub="herd"]'); t = await txt(); tt = nrm(t);
  ok(tag + ': censo bovino, último dato', tt.includes(String(cat[1])) && t.includes(cat[0]));
  await page.click('[data-lhs="pigs"]'); await page.click('[data-dlc="sows"]'); t = await txt(); ok(tag + ': cerdas', tt !== nrm(t) && !/undefined|NaN/.test(t));
  await page.click('[data-lsub="eggs"]'); t = await txt(); tt = nrm(t);
  ok(tag + ': huevos, total en miles de millones', tt.includes(nrm((ag[1] / 1e6).toFixed(2))));
  ok(tag + ': gallinas por estado, Baviera', (await page.$$('#ps-de .de-pane table')).length === 2 && !/undefined|NaN/.test(t));
  await page.click('[data-lsub="fruit"]'); t = await txt(); tt = nrm(t);
  ok(tag + ': manzana, cosecha', tt.includes(String(Math.round(ap[1]))));
  ok(tag + ': cosecha en curso marcada como estimación', !((D.provisional || { fruit: [] }).fruit).includes(+ap[0]) || /\*/.test(t));
  await page.click('[data-lfr="pears"]'); t = await txt(); ok(tag + ': pera', tt !== nrm(t));
  const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2); ok(tag + ': sin desborde horizontal', !over);
  ok(tag + ': sin errores de consola (' + errs.join(' | ') + ')', errs.length === 0);
  await ctx.close();
}
await browser.close();
console.log(fail ? fail + ' fallos' : 'test-de-livestock: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
