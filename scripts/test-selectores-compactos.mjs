#!/usr/bin/env node
// Selectores compactos (evaluacion de interfaz 21-oct-2026): monitor de insumos con el selector de pais comun (boton + buscador + grupos + «Recientes»)
// y Lonjas con el producto en un desplegable en lugar de una pared de botones. Los datos entran en la primera pantalla del movil. 390 y 1280.
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { execSync } from 'node:child_process';
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const srv = http.createServer((q, a) => { const u = decodeURIComponent(q.url.split('?')[0]), f = path.join('.', u === '/' ? 'index.html' : u); fs.readFile(f, (e, d) => { if (e) { a.writeHead(404); return a.end('no'); } a.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); a.end(d); }); });
await new Promise(r => srv.listen(18133, '127.0.0.1', r)); const BASE = 'http://127.0.0.1:18133';
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch({ args: ['--no-sandbox'] }));
let fail = 0, n = 0; const ok = (m, c) => { n++; if (!c) { fail++; console.log('FALLA', m); if (process.env.GITHUB_ACTIONS) console.log('::error::test-selectores-compactos: ' + m); } };
for (const w of [390, 1280]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { try { localStorage.setItem('dehesaIndexLang', 'es'); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) { } });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  // monitor de insumos
  await p.goto(BASE + '/monitor-insumos.html', { waitUntil: 'networkidle' }); await p.waitForSelector('#mi-ratio', { timeout: 15000 }).catch(() => { });
  ok(w + ' monitor: sin pared de botones de pais', (await p.$$('[data-cc]')).length === 0 && !!(await p.$('.cp-b')));
  ok(w + ' monitor: el primer bloque de datos entra en la primera pantalla', await p.evaluate(() => { const e = document.querySelector('#mi-ratio'); return !!e && e.getBoundingClientRect().top < innerHeight; }));
  await p.click('.cp-b'); await p.waitForSelector('.cp-p:not([hidden])');
  ok(w + ' monitor: al pulsar, buscador y grupos', !!(await p.$('.cp-p .cp-q')) && /Zona euro/.test(await p.innerText('.cp-p')));
  await p.fill('.cp-p .cp-q', 'fran'); await p.click('.cp-p .cp-o:not([hidden])'); await p.waitForFunction(() => /c=FR/.test(location.search), null, { timeout: 10000 }).catch(() => { });
  await p.waitForSelector('#mi-ratio', { timeout: 15000 }).catch(() => { });
  ok(w + ' monitor: elegir Francia cambia la pagina', /c=FR/.test(p.url()) && /Francia/.test(await p.textContent('.cp-b')));
  ok(w + ' monitor: aparece «Recientes» con España', /Recientes: .*España/.test((await p.textContent('.cp-rec').catch(() => '')) || ''));
  await p.click('.cp-rec .cp-rl'); await p.waitForFunction(() => !/c=FR/.test(location.search), null, { timeout: 10000 }).catch(() => { });
  ok(w + ' monitor: el enlace de Recientes vuelve a España', !/c=FR/.test(p.url()));
  // lonjas
  await p.goto(BASE + '/lonjas.html', { waitUntil: 'networkidle' }); await p.waitForSelector('#lj-body table', { timeout: 15000 }).catch(() => { });
  ok(w + ' lonjas: producto en botones con emoticono (sin desplegable gigante)', !(await p.$('#lj-s')) && (await p.$$('#lj-body .lj-chips:not(.lj-chips2) [data-lp]')).length >= 3 && await p.evaluate(() => [...document.querySelectorAll('#lj-body .lj-chips:not(.lj-chips2) [data-lp]')].every(b => /[^\x00-\x7F]/.test(b.querySelector('span').textContent))));
  const ids = await p.$$eval('#lj-body .lj-chips:not(.lj-chips2) [data-lp]', o => o.map(x => x.getAttribute('data-lp'))), before = await p.innerText('#lj-body table');
  if (ids.length > 1) { await p.click('#lj-body .lj-chips:not(.lj-chips2) [data-lp="' + ids[1] + '"]'); await p.waitForTimeout(400); ok(w + ' lonjas: cambiar de producto cambia la tabla', (await p.innerText('#lj-body table')) !== before && new URL(p.url()).searchParams.get('s') === ids[1]); }
  ok(w + ' lonjas: la tabla entra en la primera o segunda pantalla', await p.evaluate(() => { const e = document.querySelector('#lj-body table'); return !!e && e.getBoundingClientRect().top < innerHeight * 1.6; }));
  ok(w + ' sin errores', !errs.length);
  await ctx.close();
}
await browser.close(); srv.close(); console.log('selectores compactos: ' + n + ' comprobaciones, ' + fail + ' fallos'); process.exit(fail ? 1 : 0);
