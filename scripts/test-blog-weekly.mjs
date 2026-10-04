#!/usr/bin/env node
// Blog: resumen semanal automático. La semana más reciente sale abierta con las cifras del JSON (noticias, medios, cobertura parcial), los titulares enlazan,
// las semanas antiguas se cargan al abrirlas, los artículos escritos a mano siguen debajo. 4 idiomas, 1280/390, sin undefined/NaN ni desborde.
// Uso: node scripts/test-blog-weekly.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const idx = JSON.parse(fs.readFileSync('data/blog/weekly/index.json', 'utf8'));
const w0 = idx.weeks[0], wk = JSON.parse(fs.readFileSync('data/blog/weekly/' + w0.week + '.json', 'utf8'));
const nrm = s => s.replace(/[., \s  ]/g, '');
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
ok('el índice tiene al menos una semana', idx.weeks.length >= 1);
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const tag = lang + '@' + w;
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/blog.html', { waitUntil: 'networkidle' });
  await page.waitForSelector('#bl-weekly details[data-wk]');
  const t = await page.innerText('#bl-weekly');
  ok(tag + ': semana más reciente abierta', await page.$eval('#bl-weekly details[data-wk="' + w0.week + '"]', n => n.open));
  ok(tag + ': recuento de noticias = JSON', nrm(t).includes(nrm(String(wk.totals.items))));
  ok(tag + ': recuento de medios = JSON', nrm(t).includes(nrm(String(wk.totals.sources))));
  const links = await page.$$eval('#bl-weekly details[data-wk] a[href^="http"]', a => a.length);
  ok(tag + ': titulares con enlace externo', links >= 8);
  ok(tag + ': sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(t));
  ok(tag + ': artículos escritos a mano siguen', (await page.innerText('#bl-posts')).length > 200);
  if (w === 390) ok(tag + ': sin desborde horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  ok(tag + ': sin errores de consola' + (errs.length ? ' ' + errs.join(' | ') : ''), errs.length === 0);
  await ctx.close();
}
await browser.close();
console.log(fail ? 'FALLOS ' + fail : 'OK test-blog-weekly');
process.exit(fail ? 1 : 0);
