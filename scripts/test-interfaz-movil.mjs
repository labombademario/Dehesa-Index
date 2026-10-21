#!/usr/bin/env node
// Interfaz en movil (evaluacion del 21-oct-2026): tablas sin <thead> sin tarjeta de cabecera vacia, bloques plegados (titulo + una linea, se abren al tocar,
// los enlaces «#ancla» los abren) en sequia, insumos, ficha de pais y PAC, y la lista compacta de datos descargables. 390 px (y 1280 en lo que cambia).
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { execSync } from 'node:child_process';
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const srv = http.createServer((q, a) => { const u = decodeURIComponent(q.url.split('?')[0]), f = path.join('.', u === '/' ? 'index.html' : u); fs.readFile(f, (e, d) => { if (e) { a.writeHead(404); return a.end('no'); } a.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); a.end(d); }); });
await new Promise(r => srv.listen(18134, '127.0.0.1', r)); const BASE = 'http://127.0.0.1:18134';
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch({ args: ['--no-sandbox'] }));
let fail = 0, n = 0; const ok = (m, c) => { n++; if (!c) { fail++; console.log('FALLA', m); if (process.env.GITHUB_ACTIONS) console.log('::error::test-interfaz-movil: ' + m); } };
const page = async (w) => { const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, serviceWorkers: 'block' }); await ctx.addInitScript(() => { try { localStorage.setItem('dehesaIndexLang', 'es'); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) { } }); const p = await ctx.newPage(); p._errs = []; p.on('pageerror', e => p._errs.push(e.message)); return p; };
const scrollAll = async p => { for (let y = 0; y < 40000; y += 1500) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(80); } await p.waitForTimeout(600); };
const p = await page(390);
// 1) insumos: sin tarjeta de cabecera vacia ni etiqueta «Estado» en las filas de grupo
await p.goto(BASE + '/insumos.html', { waitUntil: 'networkidle' }); await p.waitForSelector('table.di-cards-m', { timeout: 15000 }).catch(() => { });
const hdr = await p.evaluate(() => { const t = document.querySelector('table.di-cards-m'); const r = t && [...t.querySelectorAll('tr')].find(tr => tr.querySelector(':scope>th[scope=col]') && !tr.querySelector(':scope>td')); return r ? r.getBoundingClientRect().height : -1; });
ok('insumos: la fila de cabecera no se ve como tarjeta en movil', hdr >= 0 && hdr <= 2);
ok('insumos: las filas de grupo no llevan etiqueta de columna', await p.evaluate(() => { const td = document.querySelector('table.di-cards-m td[colspan]:only-child'); return !td || getComputedStyle(td, '::before').content === 'none'; }));
// 2) bloques plegados
for (const [u, min] of [['/sequia.html', 10], ['/insumos.html', 1], ['/paises.html?c=ES', 5], ['/pac.html', 4]]) {
  await p.goto(BASE + u, { waitUntil: 'networkidle' }); await scrollAll(p);
  const r = await p.evaluate(() => ({ n: document.querySelectorAll('.df.df-closed').length, bars: [...document.querySelectorAll('.df-bar .df-t')].every(x => x.textContent.trim().length > 2), screens: document.documentElement.scrollHeight / innerHeight }));
  ok(u + ': al menos ' + min + ' bloques plegados con titulo (' + r.n + ')', r.n >= min && r.bars);
  ok(u + ': mucho mas corta en movil (' + r.screens.toFixed(1) + ' pantallas)', r.screens < ({ '/sequia.html': 12, '/insumos.html': 12, '/paises.html?c=ES': 22, '/pac.html': 8 })[u]);
  const b = await p.$('.df.df-closed > .df-bar'); await b.click(); await p.waitForTimeout(300);
  ok(u + ': tocar la barra abre el bloque', await p.evaluate(e => !e.parentElement.classList.contains('df-closed') && e.getAttribute('aria-expanded') === 'true', b));
  ok(u + ': sin errores', !p._errs.length);
  if (u.startsWith('/paises')) ok(u + ': el selector de sector (Agricultura/Ganaderia/Pesca) sigue visible', await p.evaluate(() => { const e = document.querySelector('#ps-sector [data-sec]'); return !e || e.getBoundingClientRect().height > 0; }));
}
// 2b) insumos, pestana Espana: gasoleo, tierra y fertilizantes plegados (en ordenador y en movil)
for (const w of [1280, 390]) {
  const e = await page(w); await e.goto(BASE + '/insumos.html', { waitUntil: 'networkidle' }); await e.click('#in-ca-tabs >> text=España'); await e.waitForTimeout(2500);
  const r = await e.evaluate(() => ({ closed: ['#in-es-gb', '#in-es-land', '#in-es-mapa'].filter(s => { const x = document.querySelector(s); return x && x.classList.contains('df') && x.classList.contains('df-closed'); }).length, screens: document.documentElement.scrollHeight / innerHeight }));
  ok('insumos Espana @' + w + ': gasoleo, tierra y fertilizantes plegados (' + r.closed + '/3)', r.closed === 3);
  ok('insumos Espana @' + w + ': pestana mas corta (' + r.screens.toFixed(1) + ' pantallas)', r.screens < (w < 500 ? 9 : 5.5));
  await e.click('#in-es-gb .df-bar'); await e.waitForTimeout(600);
  ok('insumos Espana @' + w + ': al abrir el gasoleo se ve su grafica', await e.evaluate(() => { const s = document.querySelector('#in-es-gb svg'); return !!s && s.getBoundingClientRect().width > 200; }));
  ok('insumos Espana @' + w + ': sin errores', !e._errs.length);
}
// el enlace de «En esta pagina» (#ancla) abre un bloque plegado
await p.goto(BASE + '/pac.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
const href = await p.evaluate(() => { const a = [...document.querySelectorAll('a[href^="#pac-"]')].find(a => { const t = document.getElementById(a.getAttribute('href').slice(1)); return t && t.classList.contains('df-closed'); }); return a ? a.getAttribute('href') : null; });
if (href) { await p.click('a[href="' + href + '"]'); await p.waitForTimeout(300); ok('pac: el enlace ' + href + ' abre su bloque', await p.evaluate(h => !document.querySelector(h).classList.contains('df-closed'), href)); }
// 3) datos descargables: lista compacta en movil, tabla en ordenador
await p.goto(BASE + '/datos-descargables.html', { waitUntil: 'networkidle' }); await p.waitForSelector('.dd-list li', { timeout: 15000 }).catch(() => { });
const dd = await p.evaluate(() => ({ list: getComputedStyle(document.querySelector('.dd-list')).display !== 'none', tbl: getComputedStyle(document.querySelector('.dd-tbl')).display === 'none', n: document.querySelectorAll('.dd-list li').length, links: document.querySelectorAll('.dd-list a[download]').length, screens: document.documentElement.scrollHeight / innerHeight }));
ok('datos descargables (movil): lista compacta con CSV y Excel por fichero', dd.list && dd.tbl && dd.n > 10 && dd.links === dd.n * 2);
ok('datos descargables (movil): mucho mas corta (' + dd.screens.toFixed(1) + ' pantallas)', dd.screens < 15);
const q = await page(1280); await q.goto(BASE + '/datos-descargables.html', { waitUntil: 'networkidle' }); await q.waitForSelector('.dd-tbl tbody tr', { timeout: 15000 }).catch(() => { });
ok('datos descargables (ordenador): sigue la tabla', await q.evaluate(() => getComputedStyle(document.querySelector('.dd-tbl')).display !== 'none' && getComputedStyle(document.querySelector('.dd-list')).display === 'none'));
await browser.close(); srv.close(); console.log('interfaz movil: ' + n + ' comprobaciones, ' + fail + ' fallos'); process.exit(fail ? 1 : 0);
