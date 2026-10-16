#!/usr/bin/env node
// Edad de los jefes de explotacion en la ficha de pais (js/farm-managers.js): % de 65 o mas = data/views/farm-managers.json (calculo rotulado),
// barras por edad, comparativa de paises, fuente Eurostat, sin undefined/NaN ni desborde. ES, DE y SE x 4 idiomas x 1280/390. Servidor local en :8123.
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const D = JSON.parse(fs.readFileSync('data/views/farm-managers.json', 'utf8'));
ok('vista con >= 20 paises', Object.keys(D.countries).length >= 20);
const LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
for (const cc of ['ES', 'DE', 'SE']) for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const tag = cc + ' ' + lang + '@' + w, o = D.countries[cc]; ok(tag + ' datos', !!o);
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); localStorage.removeItem('di-sector-v1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 140)); });
  await page.goto(BASE + '/paises.html?c=' + cc, { waitUntil: 'networkidle' });
  for (let i = 0; i < 6 && !(await page.$('#ps-farm-managers')); i++) { await page.evaluate(() => { const e = document.getElementById('pp-managers'); if (e) e.scrollIntoView(); }); await page.waitForTimeout(700); }
  const r = await page.evaluate(() => { const s = document.getElementById('ps-farm-managers'); return s ? { t: s.innerText, bars: s.querySelectorAll('.fsh-age-r').length, rows: s.querySelectorAll('tbody tr').length, src: !!s.querySelector('a[href*="ef_fsi_agesex"]'), over: document.documentElement.scrollWidth > window.innerWidth + 2 } : null; });
  ok(tag + ' bloque presente', !!r);
  if (r && o) {
    const y = o.total[o.total.length - 1], old = o.y_ge65.find(p => p[0] === y[0]);
    const pct = (old[1] / y[1] * 100).toLocaleString(LOC[lang], { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    ok(tag + ' % de 65 o mas = JSON (' + pct + ')', r.t.indexOf(pct) > -1);
    ok(tag + ' barras por edad y comparativa', r.bars >= 6 && r.rows >= 20);
    ok(tag + ' fuente Eurostat', r.src);
    ok(tag + ' sin undefined/NaN ni desborde', !/undefined|NaN/.test(r.t) && !r.over);
  }
  ok(tag + ' sin errores de consola (' + errs.join('; ') + ')', errs.length === 0);
  await ctx.close();
}
// por region: Comunidad Valenciana y Emilia-Romagna (ficha de region, bloque de explotaciones)
for (const [cc, r] of [['ES', 'VC'], ['IT', 'EMR']]) for (const lang of ['es', 'it']) for (const w of [1280, 390]) {
  const tag = cc + '-' + r + ' ' + lang + '@' + w, R = JSON.parse(fs.readFileSync('data/eu-regions-' + cc.toLowerCase() + '.json', 'utf8')).regions[r].managers;
  ok(tag + ' datos por region', !!R);
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(BASE + '/region.html?c=' + cc + '&r=' + r, { waitUntil: 'networkidle' }); await page.waitForSelector('#rg-managers', { timeout: 15000 }).catch(() => {});
  const t = await page.evaluate(() => { const h = document.getElementById('rg-managers'); return h ? h.parentElement.innerText : null; });
  ok(tag + ' bloque de edad en la region', !!t);
  if (t && R) { const ys = Object.keys(R).sort(), m = R[ys[ys.length - 1]], pct = (m.Y_GE65 / m.TOTAL * 100).toLocaleString(lang === 'es' ? 'es-ES' : 'it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); ok(tag + ' % de 65 o mas = JSON (' + pct + ')', t.indexOf(pct) > -1 && !/undefined|NaN/.test(t)); }
  ok(tag + ' sin errores (' + errs.join('; ') + ')', errs.length === 0); await ctx.close();
}
await browser.close();
if (fail) { console.log('FALLOS', fail); process.exit(1); }
console.log('OK test-farm-managers');
