#!/usr/bin/env node
// Ovino/caprino y porcino de Manitoba en paises.html?c=CA con navegador real (servidor local en :8123): cerrado no carga el modulo, las cifras son las de data/mb-markets/*.json,
// los selectores cambian el contenido, huecos = «–» (nunca cero), atribucion OpenMB, sin undefined/NaN ni desbordes a 390 px, en los 4 idiomas.
// Uso: node scripts/test-mb-smallstock.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const SG = JSON.parse(fs.readFileSync('data/mb-markets/sheep-goat.json', 'utf8')), HG = JSON.parse(fs.readFileSync('data/mb-markets/hogs.json', 'utf8'));
const lastWith = (m, i) => { const ks = Object.keys(SG.sales[m]).sort().filter(k => SG.sales[m][k][i]); return ks[ks.length - 1]; };
const wlk = Object.keys(HG.weeks).sort(), WL = wlk[wlk.length - 1], HW = HG.weeks[WL];
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const nrm = s => s.replace(/[., \s  ]/g, '');
const f2 = v => v.toFixed(2);
const li = SG.classes.indexOf('lamb80'), lk = lastWith('Winnipeg', li), lr = SG.sales.Winnipeg[lk][li];
const gk = lastWith('Grunthal', SG.classes.indexOf('kid')), gr = SG.sales.Grunthal[gk][SG.classes.indexOf('kid')];
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/paises.html?c=CA', { waitUntil: 'networkidle' }); await page.waitForSelector('#mb-sheep-goat', { timeout: 8000 });
  ok(tag + ': tres secciones de Manitoba', (await page.$$('#ps-mb > details')).length === 3);
  ok(tag + ': cerrado no carga el modulo', !(await page.evaluate(() => !!window.MBSmall)));
  await page.click('#mb-sheep-goat > summary'); await page.waitForSelector('#mb-sheep-goat [data-mbs="cls"]', { timeout: 8000 });
  const txt = async id => await page.evaluate(i => document.querySelector(i + ' .es-body').innerText, id);
  let t = await txt('#mb-sheep-goat');
  ok(tag + ': cordero 80-100 lb, media Winnipeg', nrm(t).includes(nrm(f2(lr[2]))) && nrm(t).includes(nrm(f2(lr[0]))) && nrm(t).includes(nrm(f2(lr[1]))));
  ok(tag + ': conversion a C$/kg', nrm(t).includes(nrm(f2(lr[2] / 45.359237))));
  ok(tag + ': fecha de la ultima venta', t.includes(lk));
  ok(tag + ': atribucion OpenMB', /OpenMB/.test(t));
  ok(tag + ': grafico', (await page.$$('#mb-sheep-goat svg')).length >= 1);
  ok(tag + ': tabla de 8 clases', (await page.$$('#mb-sheep-goat tbody tr')).length === 8);
  ok(tag + ': sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(t));
  await page.selectOption('#mb-sheep-goat [data-mbs="cls"]', 'kid'); await page.selectOption('#mb-sheep-goat [data-mbs="mart"]', 'Grunthal'); t = await txt('#mb-sheep-goat');
  ok(tag + ': cabrito Grunthal', nrm(t).includes(nrm(f2(gr[2]))) && t.includes(gk));
  // un hueco se enseña como «–», nunca como 0
  await page.selectOption('#mb-sheep-goat [data-mbs="cls"]', 'lamb100'); t = await txt('#mb-sheep-goat');
  const lastG = Object.keys(SG.sales.Grunthal).sort().pop(), emptyNow = SG.sales.Grunthal[lastG][SG.classes.indexOf('lamb100')] === null;
  if (emptyNow) { const tr = await page.$$eval('#mb-sheep-goat tbody tr', rs => rs.map(r => r.textContent.replace(/\s+/g, ' '))); ok(tag + ': hueco como «–» y no como 0', tr.some(x => /–\s*–\s*–/.test(x))); }
  await page.click('#mb-hogs > summary'); await page.waitForSelector('#mb-hogs [data-mbh="metric"]', { timeout: 8000 });
  t = await txt('#mb-hogs');
  ok(tag + ': porcino, all-in de la ultima semana', nrm(t).includes(nrm(f2(HW[0]))) && t.includes(WL));
  ok(tag + ': tabla de 8 semanas', (await page.$$('#mb-hogs tbody tr')).length === 8);
  ok(tag + ': grafico de porcino', (await page.$$('#mb-hogs svg')).length >= 1);
  ok(tag + ': atribucion OpenMB (porcino)', /OpenMB/.test(t));
  ok(tag + ': porcino sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(t));
  await page.selectOption('#mb-hogs [data-mbh="metric"]', 'pigs'); t = await txt('#mb-hogs');
  ok(tag + ': cerdos procesados', nrm(t).includes(String(HW[2])));
  const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2); ok(tag + ': sin desborde horizontal', !over);
  ok(tag + ': sin errores de consola (' + errs.join(' | ') + ')', errs.length === 0);
  await ctx.close();
}
await browser.close();
console.log(fail ? fail + ' fallos' : 'test-mb-smallstock: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
