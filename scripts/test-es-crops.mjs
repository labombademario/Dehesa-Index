#!/usr/bin/env node
// Bloque «cultivos por provincia» de la ficha de España, con navegador real (servidor local en :8123): las cifras de las tarjetas y la primera fila de la tabla son las de
// data/spain-crops/*.json, los selectores y botones cambian el contenido, se avisa de que son datos provisionales, no hay undefined/NaN ni desbordes a 390 px, en los 4 idiomas.
// Uso: node scripts/test-es-crops.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const J = f => JSON.parse(fs.readFileSync('data/spain-crops/crops-' + f + '.json', 'utf8'));
const cer = J('cereales'), cit = J('citricos'), hor = J('hortalizas');
const camps = d => Object.keys(d.campaigns).sort();
const crop = (d, c, code) => d.campaigns[c].crops.find(x => x.c === code);
const topProv = (d, c, code, i) => { const x = crop(d, c, code); return Object.entries(x.v).filter(([, a]) => a[i] > 0).sort((a, b) => b[1][i] - a[1][i])[0]; };
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const nrm = s => s.replace(/[., \s ]/g, '');
const cc = camps(cer).pop(), tot = crop(cer, cc, 'CE0000'), tw = crop(cer, cc, 'CE1100');
const ci = camps(cit); const cityLast = ci[ci.length - 1], cityFirst = ci[0];
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/paises.html?c=ES', { waitUntil: 'networkidle' }); await page.waitForSelector('#ps-es details', { timeout: 8000 });
  ok(tag + ': cerrado no pide datos (no hay tabla)', (await page.$$('#ps-es table')).length === 0);
  await page.click('#ps-es details > summary'); await page.waitForSelector('#ps-es [data-ec="crop"]', { timeout: 8000 });
  const txt = async () => (await page.evaluate(() => document.querySelector('#ps-es .es-body').innerText));
  let t = await txt();
  ok(tag + ': superficie total de cereales', nrm(t).includes(nrm((tot.t[0] / 1e6).toFixed(2))));
  ok(tag + ': produccion total de cereales', nrm(t).includes(nrm((tot.t[4] / 1e6).toFixed(2))));
  const tp = topProv(cer, cc, 'CE0000', 0), first = await page.evaluate(() => document.querySelector('#ps-es tbody tr td').innerText);
  ok(tag + ': primera provincia por superficie = ' + cer.provinces[tp[0]] + ' (' + first + ')', first === cer.provinces[tp[0]]);
  ok(tag + ': aviso de datos provisionales con la campaña', /provision|provvisor|provisoire/i.test(t) && t.includes(cc));
  ok(tag + ': cita de la fuente MAPA', /MAPA|Ministerio|Ministry|Ministère|Ministero/.test(t));
  ok(tag + ': sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(t));
  await page.selectOption('#ps-es [data-ec="crop"]', 'CE1100'); t = await txt();
  ok(tag + ': trigo (resumen) cambia la superficie', nrm(t).includes(nrm((tw.t[0] / 1e6).toFixed(2))) && !nrm(t).includes(nrm((tot.t[0] / 1e6).toFixed(2))));
  ok(tag + ': rendimiento derivado = produccion / superficie cosechada', nrm(t).includes(nrm((tw.t[4] / tw.t[3]).toFixed(2))) || nrm(t).includes(nrm((tw.t[4] / tw.t[3]).toFixed(1))));
  await page.click('[data-ec="meas"][data-v="prod"]'); const tp2 = topProv(cer, cc, 'CE1100', 4);
  const f2 = await page.evaluate(() => document.querySelector('#ps-es tbody tr td').innerText); ok(tag + ': produccion, primera provincia = ' + cer.provinces[tp2[0]], f2 === cer.provinces[tp2[0]]);
  await page.click('[data-ec="meas"][data-v="yld"]'); t = await txt(); ok(tag + ': rendimiento por provincia sin undefined', !/undefined|NaN|Infinity/.test(t) && (await page.$$('#ps-es tbody tr')).length >= 5);
  await page.selectOption('#ps-es [data-ec="g"]', 'citricos'); await page.waitForFunction(() => document.querySelector('#ps-es [data-ec="g"]').value === 'citricos' && document.querySelector('#ps-es [data-ec="camp"]'), { timeout: 8000 });
  const nCamp = (await page.$$('#ps-es [data-ec="camp"]')).length; ok(tag + ': citricos tienen ' + ci.length + ' campañas', nCamp === ci.length);
  await page.click('#ps-es [data-ec="camp"][data-v="' + cityFirst + '"]'); t = await txt(); ok(tag + ': campaña ' + cityFirst + ' visible', t.includes(cityFirst) && !/undefined|NaN/.test(t));
  await page.click('#ps-es [data-ec="camp"][data-v="' + cityLast + '"]'); t = await txt(); ok(tag + ': campaña ' + cityLast + ' compara con ' + cityFirst, t.includes(cityFirst) && /[+−]\d/.test(t));
  await page.selectOption('#ps-es [data-ec="g"]', 'hortalizas'); await page.waitForFunction(() => document.querySelector('#ps-es [data-ec="g"]').value === 'hortalizas'); t = await txt();
  ok(tag + ': hortalizas, el total sin superficie no inventa cifra (HO0000)', !/undefined|NaN|Infinity/.test(t));
  const det = await page.$('#ps-es details details'); ok(tag + ': tabla completa plegada', !!det || (await page.$$('#ps-es tbody tr')).length <= 10);
  const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2); ok(tag + ': sin desborde horizontal', !over);
  ok(tag + ': sin errores de consola (' + errs.join(' | ') + ')', errs.length === 0);
  await ctx.close();
}
await browser.close();
console.log(fail ? fail + ' fallos' : 'test-es-crops: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
