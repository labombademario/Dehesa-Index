#!/usr/bin/env node
// Estados incompletos accionables: si algo no carga por la red, se dice que es un fallo (no «sin dato»), nada se pierde ni se queda cargando para siempre,
// no hay bucles de peticiones y Reintentar lo vuelve a pedir. Liquidacion, Cestas e Informe de negociacion (Mis compras y comparador: test-compras.mjs).
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { execSync } from 'node:child_process';
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const srv = http.createServer((q, a) => { const u = decodeURIComponent(q.url.split('?')[0]), f = path.join('.', u === '/' ? 'index.html' : u); fs.readFile(f, (e, d) => { if (e) { a.writeHead(404); return a.end('no'); } a.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); a.end(d); }); });
await new Promise(r => srv.listen(18131, '127.0.0.1', r)); const BASE = 'http://127.0.0.1:18131';
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch({ args: ['--no-sandbox'] }));
let fail = 0, n = 0; const ok = (m, c) => { n++; if (!c) { fail++; console.log('FALLA', m); if (process.env.GITHUB_ACTIONS) console.log('::error::test-retry-states: ' + m); } };
const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, serviceWorkers: 'block' });
await ctx.addInitScript(() => { try { localStorage.setItem('dehesaIndexLang', 'es'); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) { } });
const BLOCK = '**/data/eu/cereales/**';
const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(BASE + '/liquidacion.html', { waitUntil: 'networkidle' }); await p.waitForSelector('#lq-ex2', { timeout: 10000 }); await p.click('#lq-ex2'); await p.waitForSelector('[data-del]', { timeout: 15000 });
await ctx.route(BLOCK, r => r.abort()); await p.locator('[data-ref]:not(:checked)').first().click();   // segunda lonja con la red cortada
await p.waitForSelector('[data-lqretry]', { timeout: 15000 }).catch(() => { });
let t = await p.innerText('main');
ok('referencia caida: aviso de fallo (no «venta(s) sin dato de referencia» por esa lonja)', /No se pudo cargar la referencia/.test(t));
ok('la primera lonja sigue comparando', /Referencia en esas fechas|referencia/i.test(t) && (await p.$$('.lq-cmp')).length >= 1);
ok('hay boton Reintentar', !!(await p.$('[data-lqretry]')));
ok('las ventas siguen (tabla con filas)', (await p.$$('[data-del]')).length > 0);
await ctx.unroute(BLOCK); await p.click('[data-lqretry]'); await p.waitForFunction(() => !document.querySelector('[data-lqretry]'), null, { timeout: 15000 }).catch(() => { }); await p.waitForTimeout(300);
t = await p.innerText('main');
ok('tras reintentar sale la comparacion y desaparece el aviso', !(await p.$('[data-lqretry]')) && !/No se pudo cargar la referencia/.test(t) && /€|EUR/.test(t));
ok('liquidacion: sin undefined ni NaN ni errores de pagina', !/undefined|NaN/.test(t) && !errs.length);
// Cestas: una cesta que no carga no entra en bucle y se puede reintentar
{ const IX = JSON.parse(fs.readFileSync('data/indices/index.json', 'utf8')), id = IX.baskets[0].id, PAT = '**/data/indices/' + id + '.json'; let hits = 0;
  await ctx.route(PAT, r => { hits++; r.abort(); }); const q = await ctx.newPage(); await q.goto(BASE + '/cestas.html?c=' + id, { waitUntil: 'networkidle' }); await q.waitForSelector('#ce-retry', { timeout: 15000 }).catch(() => { }); await q.waitForTimeout(2000);
  ok('cestas: sin bucle de peticiones con la red caida (' + hits + ' peticiones)', hits <= 2); ok('cestas: aviso y boton Reintentar', !!(await q.$('#ce-retry')));
  await ctx.unroute(PAT); await q.click('#ce-retry'); await q.waitForFunction(() => !document.getElementById('ce-retry') && document.querySelector('.ce-sent'), null, { timeout: 15000 }).catch(() => { });
  ok('cestas: tras reintentar sale la cesta', !!(await q.$('.ce-sent')) && !(await q.$('#ce-retry'))); await q.close(); }
// Informe de negociacion: una serie caida ya no deja el informe en «Cargando…» para siempre
{ const IX = JSON.parse(fs.readFileSync('data/api/v1/index.json', 'utf8')), ids = IX.series.filter(x => x.product === 'trigo').map(x => x.id);
  if (ids.length >= 2) { const PAT = '**/data/api/v1/series/' + ids[0] + '.json'; await ctx.route(PAT, r => r.abort());
    const q = await ctx.newPage(); await q.goto(BASE + '/informe-negociacion.html?p=trigo', { waitUntil: 'networkidle' }); await q.waitForSelector('#nb-part', { timeout: 15000 }).catch(() => { });
    let tq = await q.innerText('main');
    ok('negociacion: dice cuantas series no cargaron (1 de ' + ids.length + ')', new RegExp('1 de ' + ids.length + ' series').test(tq)); ok('negociacion: el informe sale con el resto (no se queda cargando)', !!(await q.$('.ic-sheet')));
    const seen = []; q.on('requestfinished', r => { if (/api\/v1\/series/.test(r.url())) seen.push('ok ' + r.url().split('/').pop()); }); q.on('requestfailed', r => { if (/api\/v1\/series/.test(r.url())) seen.push('FAIL ' + r.url().split('/').pop() + ' ' + (r.failure() || {}).errorText); });
    await ctx.unroute(PAT); await q.waitForTimeout(300); await q.click('#nb-retry'); await q.waitForFunction(() => !document.getElementById('nb-part') && document.querySelector('.ic-sheet'), null, { timeout: 30000 })   /* el aviso se va al pulsar; el informe vuelve cuando llega la serie */.catch(() => { });
    const still = await q.$('#nb-part');
    ok('negociacion: tras reintentar desaparece el aviso' + (still ? ' [visto: ' + (await still.innerText()).slice(0, 80) + ' | peticiones: ' + seen.join(', ').slice(0, 300) + ']' : ''), !still && !!(await q.$('.ic-sheet'))); tq = await q.innerText('main'); ok('negociacion: sin undefined ni NaN', !/undefined|NaN/.test(tq)); await q.close(); }
  else ok('negociacion: hay al menos 2 series de trigo para probar', false); }
await browser.close(); srv.close(); console.log('estados incompletos (reintentar): ' + n + ' comprobaciones, ' + fail + ' fallos'); process.exit(fail ? 1 : 0);
