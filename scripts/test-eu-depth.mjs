#!/usr/bin/env node
// Bloques «en profundidad» de Dinamarca, Países Bajos y Francia (js/eu-depth.js) con navegador real (servidor local en :8123): cada cifra pintada es la del JSON,
// los selectores cambian el contenido, no hay undefined/NaN/[object, sin desborde a 390 px ni errores de consola, en los 4 idiomas.
// Uso: node scripts/test-eu-depth.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const J = f => JSON.parse(fs.readFileSync('data/' + f, 'utf8'));
const DK = J('denmark-depth.json'), NF = J('netherlands-farm.json'), NM = J('netherlands-markets.json'), FV = J('france-vigieau.json'), FC = J('france-cereobs.json'), CAP = J('cap/dk/amounts.json');
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const last = a => a[a.length - 1], dig = s => s.replace(/[^\d]/g, '');
const d2 = (v, d) => dig(v.toFixed(d));
const BAD = /undefined|NaN|\[object|Infinity/;
const dkw = last(DK.harvest.data.wheat_winter['000'].yield), dkp = last(DK.harvest.data.wheat_winter['000'].prod);
const nlw = last(NF.crops.data.A042170.NL01.yield), pig = last(NM.pigPrice.pigs), dairy = last(NF.farms.data.dairy_cows.NL01);
const cap0 = CAP.schemes[0].items[0].amount, crise = FV.counts.crise;
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  const open = async (c, mod) => { await page.goto(BASE + '/paises.html?c=' + c, { waitUntil: 'networkidle' }); await page.waitForSelector('#eu-' + mod + ' > summary', { timeout: 8000 }); await page.click('#eu-' + mod + ' > summary'); await page.waitForSelector('#eu-' + mod + ' .de-t, #eu-' + mod + ' .de-tiles', { timeout: 8000 }); };
  const txt = mod => page.evaluate(m => document.querySelector('#eu-' + m + ' .es-body').innerText, mod);
  // Dinamarca: cosecha
  await open('DK', 'dk-harvest'); let t = await txt('dk-harvest');
  ok(tag + ' DK: rendimiento nacional del trigo de invierno', dig(t).includes(d2(dkw[1], 2)) && t.includes(dkw[0]));
  ok(tag + ' DK: tabla de regiones (>=12 filas)', (await page.$$('#eu-dk-harvest tbody tr')).length >= 12);
  await page.selectOption('#eu-dk-harvest select[data-k="m"]', 'prod'); t = await txt('dk-harvest');
  ok(tag + ' DK: producción nacional', dig(t).includes(d2(dkp[1], dkp[1] >= 100 ? 0 : 1)) && !BAD.test(t));
  await page.selectOption('#eu-dk-harvest select[data-k="crop"]', 'rapeseed'); t = await txt('dk-harvest'); ok(tag + ' DK: colza y nota de cambio de clasificación', !BAD.test(t) && /2025/.test(t));
  // Dinamarca: ganado
  await page.click('#eu-dk-live > summary'); await page.waitForSelector('#eu-dk-live .de-tiles'); t = await txt('dk-live'); ok(tag + ' DK: sacrificios sin undefined', !BAD.test(t) && (await page.$$('#eu-dk-live svg')).length >= 1);
  for (const v of ['milk', 'herd', 'sub']) { await page.selectOption('#eu-dk-live select[data-k="v"]', v); t = await txt('dk-live'); ok(tag + ' DK: vista ' + v, !BAD.test(t) && t.length > 80); }
  // Dinamarca: PAC
  await page.click('#eu-dk-cap > summary'); await page.waitForSelector('#eu-dk-cap .de-t'); t = await txt('dk-cap'); ok(tag + ' DK: importe de la ayuda básica', dig(t).includes(d2(cap0, 2)) && !BAD.test(t));
  ok(tag + ' DK: PAC con dos decretos', /1363/.test(t) && /1381/.test(t));
  // Países Bajos
  await open('NL', 'nl-crops'); t = await txt('nl-crops'); ok(tag + ' NL: rendimiento nacional de trigo', dig(t).includes(d2(nlw[1], 2)) && (await page.$$('#eu-nl-crops tbody tr')).length >= 17);
  await page.selectOption('#eu-nl-crops select[data-k="m"]', 'area'); t = await txt('nl-crops'); ok(tag + ' NL: superficie', !BAD.test(t));
  await page.click('#eu-nl-farms > summary'); await page.waitForSelector('#eu-nl-farms .de-tiles'); t = await txt('nl-farms'); ok(tag + ' NL: vacas lecheras', dig(t).includes(d2(dairy[1], 0)) && (await page.$$('#eu-nl-farms tbody tr')).length >= 12);
  await page.click('#eu-nl-markets > summary'); await page.waitForSelector('#eu-nl-markets .de-tiles'); t = await txt('nl-markets'); ok(tag + ' NL: precio del cerdo, última semana', t.includes(pig[0]) && dig(t).includes(d2(pig[1], 2)));
  for (const v of ['cattle', 'sl', 'cbs', 'idx']) { await page.selectOption('#eu-nl-markets select[data-k="v"]', v); t = await txt('nl-markets'); ok(tag + ' NL: vista ' + v, !BAD.test(t) && (await page.$$('#eu-nl-markets svg')).length >= 1); }
  // Francia
  await open('FR', 'fr-water'); t = await txt('fr-water'); ok(tag + ' FR: departamentos en crisis', t.includes(String(crise)) && (await page.$$('#eu-fr-water tbody tr')).length === FV.departments.length);
  await page.selectOption('#eu-fr-water select[data-k="f"]', '4'); ok(tag + ' FR: filtro de crisis', (await page.$$('#eu-fr-water tbody tr')).length === crise);
  await page.click('#eu-fr-maize > summary'); await page.waitForSelector('#eu-fr-maize .de-t'); t = await txt('fr-maize'); ok(tag + ' FR: maíz', !BAD.test(t) && (await page.$$('#eu-fr-maize svg')).length >= 1 && /2026/.test(t));
  await page.selectOption('#eu-fr-maize select[data-k="r"]', Object.keys(FC.regions)[0]); t = await txt('fr-maize'); ok(tag + ' FR: región', !BAD.test(t));
  ok(tag + ': sin desborde horizontal', !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)));
  ok(tag + ': sin errores de consola (' + errs.join(' | ') + ')', errs.length === 0);
  await ctx.close();
}
await browser.close();
console.log(fail ? fail + ' fallos' : 'test-eu-depth: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
