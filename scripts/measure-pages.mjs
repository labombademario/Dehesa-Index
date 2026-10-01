#!/usr/bin/env node
// Mide el payload inicial real de las paginas criticas con un navegador (Playwright): bytes crudos y gzip de JS, CSS, JSON y el resto,
// la lista de ficheros de datos descargados y peticiones prohibidas. Uso: node scripts/measure-pages.mjs [--base http://localhost:8123] [--json out.json] [--check]
// Con --check aplica el presupuesto por pagina de scripts/page-budget.json y falla si se supera o si se pide un fichero prohibido.
import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123'), OUT = arg('--json', null), CHECK = process.argv.includes('--check');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || (await import('node:child_process')).execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const budget = JSON.parse(await readFile(path.join(root, 'scripts/page-budget.json'), 'utf8').catch(() => '{"pages":[]}'));
const PAGES = budget.pages.length ? budget.pages : [{ url: '/' }, { url: '/precios.html' }, { url: '/paises.html?c=ES' }, { url: '/perfiles.html' }, { url: '/comparador.html' }, { url: '/catalogo.html' }, { url: '/brief.html' }];
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
const results = []; const fails = [];
for (const pg of PAGES) {
  const ctx = await browser.newContext({ viewport: pg.mobile ? { width: 390, height: 800 } : { width: 1280, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { try { localStorage.setItem('dehesaIndexLang', 'es'); localStorage.setItem('di-tour-done', '1'); } catch (e) {} });
  const page = await ctx.newPage(); const files = [];
  page.on('response', async r => {
    const u = new URL(r.url()); if (u.origin !== new URL(BASE).origin) return;
    try { const b = await r.body(); files.push({ p: u.pathname + (u.search || ''), type: /\.json$/.test(u.pathname) ? 'data' : /\.js$/.test(u.pathname) ? 'js' : /\.css$/.test(u.pathname) ? 'css' : /\.html?$|\/$/.test(u.pathname) ? 'html' : 'other', raw: b.length, gz: gzipSync(b).length, status: r.status() }); } catch (e) {}
  });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(BASE + pg.url, { waitUntil: 'load' }).catch(() => {}); await page.waitForTimeout(pg.wait || 3500);
  const sum = t => files.filter(f => f.type === t).reduce((a, f) => ({ raw: a.raw + f.raw, gz: a.gz + f.gz }), { raw: 0, gz: 0 });
  const tot = files.reduce((a, f) => ({ raw: a.raw + f.raw, gz: a.gz + f.gz }), { raw: 0, gz: 0 });
  const data = files.filter(f => f.type === 'data').sort((a, b) => b.raw - a.raw);
  const r = { url: pg.url, mobile: !!pg.mobile, total: tot, js: sum('js'), css: sum('css'), data: sum('data'), dataFiles: data.length, topData: data.slice(0, 6).map(f => f.p + ' ' + Math.round(f.raw / 1024) + 'KB'), requests: files.length, errors: errs, notFound: files.filter(f => f.status >= 400).map(f => f.p) };
  results.push(r);
  const kb = n => Math.round(n / 1024);
  console.log((pg.mobile ? '[m] ' : '    ') + pg.url.padEnd(26) + ' total ' + String(kb(tot.raw)).padStart(6) + ' KB raw / ' + String(kb(tot.gz)).padStart(5) + ' KB gz | js ' + String(kb(r.js.raw)).padStart(5) + ' | data ' + String(kb(r.data.raw)).padStart(6) + ' KB (' + data.length + ' ficheros) | ' + r.topData.slice(0, 2).join(', '));
  if (CHECK) {
    if (pg.maxDataRawKB && r.data.raw > pg.maxDataRawKB * 1024) fails.push(pg.url + ': datos ' + kb(r.data.raw) + ' KB > ' + pg.maxDataRawKB + ' KB');
    if (pg.maxTotalGzKB && tot.gz > pg.maxTotalGzKB * 1024) fails.push(pg.url + ': total gzip ' + kb(tot.gz) + ' KB > ' + pg.maxTotalGzKB + ' KB');
    if (pg.maxJsRawKB && r.js.raw > pg.maxJsRawKB * 1024) fails.push(pg.url + ': JS ' + kb(r.js.raw) + ' KB > ' + pg.maxJsRawKB + ' KB');
    (pg.forbid || []).forEach(rx => { const re = new RegExp(rx); files.filter(f => re.test(f.p)).forEach(f => fails.push(pg.url + ': peticion prohibida ' + f.p)); });
    if (r.notFound.length) fails.push(pg.url + ': 404/errores ' + r.notFound.join(', '));
    if (errs.length) fails.push(pg.url + ': errores JS ' + errs.slice(0, 2).join(' | '));
  }
  await ctx.close();
}
await browser.close();
if (OUT) await writeFile(OUT, JSON.stringify({ base: BASE, measuredAt: new Date().toISOString(), pages: results }, null, 1));
if (fails.length) { console.error('Presupuesto de pagina superado:\n  ' + fails.join('\n  ')); process.exit(1); }
