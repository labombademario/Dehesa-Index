#!/usr/bin/env node
// Precios semanales en España (lonjas.html #esp): lista con buscador, sectores con emoticono, filas desplegables, grupo «Sin dato reciente», panel de grafica en ordenador, CSV. 4 idiomas x 1280/390.

import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { execSync } from 'node:child_process';
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const srv = http.createServer((q, a) => { const u = decodeURIComponent(q.url.split('?')[0]), f = path.join('.', u === '/' ? 'index.html' : u); fs.readFile(f, (e, d) => { if (e) { a.writeHead(404); return a.end('no'); } a.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); a.end(d); }); });
await new Promise(r => srv.listen(18134, '127.0.0.1', r)); const BASE = 'http://127.0.0.1:18134';
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch({ args: ['--no-sandbox'] }));

let fail = 0, n = 0; const ok = (m, c) => { n++; if (!c) { fail++; console.log('FALLA', m); if (process.env.GITHUB_ACTIONS) console.log('::error::test-precios-semanales: ' + m); } };
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const tag = lang + '@' + w, wide = w >= 900;
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block', acceptDownloads: true });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) { } }, lang);
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/lonjas.html', { waitUntil: 'networkidle' }); await p.waitForSelector('#esp .esp-row', { timeout: 15000 }).catch(() => { });
  ok(tag + ': sin desplegable gigante de productos', await p.evaluate(() => !document.querySelector('#esp select')));
  const top = await p.evaluate(() => ({ chips: document.querySelectorAll('#esp .esp-s').length, emo: [...document.querySelectorAll('#esp .esp-s')].every(b => /[^\x00-\x7F]/.test(b.querySelector('span').textContent)), q: !!document.querySelector('#esp #esp-q'), rows: document.querySelectorAll('#esp .esp-row').length, opened: document.querySelectorAll('#esp .esp-row.on').length }));
  ok(tag + ': 13 sectores con emoticono y conteo (' + top.chips + ')', top.chips >= 12 && top.emo);
  ok(tag + ': buscador y filas', top.q && top.rows >= 3);
  ok(tag + ': ' + (wide ? 'ordenador abre el primero' : 'movil empieza con todo cerrado'), wide ? top.opened === 1 : top.opened === 0);
  if (wide) ok(tag + ': panel con grafica al lado de la tabla', await p.evaluate(() => { const d = document.querySelector('#esp .esp-det'), l = document.querySelector('#esp .esp-row'); const svg = d && d.querySelector('svg'); return !!svg && svg.getBoundingClientRect().width > 250 && d.getBoundingClientRect().left > l.getBoundingClientRect().right - 5; }));
  else { await p.click('#esp .esp-row'); await p.waitForTimeout(500); ok(tag + ': tocar una fila abre su grafica justo debajo', await p.evaluate(() => { const r = document.querySelector('#esp .esp-row.on'), d = document.querySelector('#esp .esp-det'); const svg = d && d.querySelector('svg'); return !!r && r.nextElementSibling === d && !!svg && svg.getBoundingClientRect().width > 200; })); await p.click('#esp .esp-row.on'); ok(tag + ': tocar otra vez la cierra', await p.evaluate(() => !document.querySelector('#esp .esp-det'))); }
  // sector: Frutas tiene grupo sin dato reciente
  await p.click('#esp .esp-s[data-s="FRUTAS"]'); await p.waitForTimeout(300);
  const fr = await p.evaluate(() => ({ old: !!document.querySelector('#esp .esp-old'), n: document.querySelectorAll('#esp .esp-grid > .esp-row').length, on: document.querySelector('#esp .esp-s.on') && document.querySelector('#esp .esp-s.on').getAttribute('data-s') }));
  ok(tag + ': sector Frutas marcado con sus filas', fr.on === 'FRUTAS' && fr.n > 10);
  ok(tag + ': grupo plegado de productos sin dato reciente', fr.old && await p.evaluate(() => !document.querySelector('#esp .esp-old').open));
  await p.click('#esp .esp-old > summary'); await p.waitForTimeout(200); ok(tag + ': el grupo se abre con sus filas', await p.evaluate(() => document.querySelectorAll('#esp .esp-old .esp-row').length > 3));
  // buscador: todos los sectores
  await p.fill('#esp-q', 'aguacate'); await p.waitForTimeout(300);
  ok(tag + ': buscar «aguacate» da solo coincidencias', await p.evaluate(() => { const r = [...document.querySelectorAll('#esp .esp-row .esp-n')]; return r.length >= 1 && r.every(x => /aguacate/i.test(x.textContent)); }));
  await p.fill('#esp-q', 'zzzz'); await p.waitForTimeout(300); ok(tag + ': sin coincidencias dice que no hay', await p.evaluate(() => !document.querySelector('#esp .esp-row') && /zzzz/.test(document.querySelector('#esp-list').textContent)));
  await p.fill('#esp-q', ''); await p.waitForTimeout(200);
  // descarga CSV
  await p.click('#esp .esp-s[data-s="CEREALES"]'); await p.waitForTimeout(300); if (!wide) { await p.click('#esp .esp-row'); await p.waitForTimeout(300); }
  const dlp = p.waitForEvent('download', { timeout: 5000 }).catch(() => null); await p.click('#esp .esp-csv'); const dl = await dlp;
  ok(tag + ': el CSV se descarga', !!dl && /\.csv$/.test(dl.suggestedFilename()));
  // origen y destino
  await p.click('#esp .esp-t[data-t="obs"]'); await p.waitForTimeout(400);
  const ob = await p.evaluate(() => ({ rows: document.querySelectorAll('#esp .esp-row').length, chips: document.querySelectorAll('#esp .esp-s').length }));
  ok(tag + ': origen y destino lista productos sin chips de sector (' + ob.rows + ')', ob.rows >= 20 && ob.chips === 0);
  if (!wide) { await p.click('#esp .esp-row'); await p.waitForTimeout(400); }
  ok(tag + ': origen y destino abre su grafica', await p.evaluate(() => { const svg = document.querySelector('#esp .esp-det svg'); return !!svg && svg.getBoundingClientRect().width > 200; }));
  ok(tag + ': sin errores', !errs.length); if (errs.length) console.log(errs[0]);
  await ctx.close();
}
// el bloque es de España: no debe verse con otro pais elegido
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' }); await ctx.addInitScript(() => { try { localStorage.setItem('dehesaIndexLang', 'es'); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) { } });
  const p = await ctx.newPage(); await p.goto(BASE + '/lonjas.html?c=ES', { waitUntil: 'networkidle' }); await p.waitForSelector('#esp .esp-row', { timeout: 15000 }).catch(() => { });
  const vis = () => p.evaluate(() => { const e = document.getElementById('esp'); return !!e && e.getBoundingClientRect().height > 50; });
  ok('lonjas: con España elegida se ven los precios semanales', await vis());
  await p.evaluate(() => { const s = document.getElementById('lj-c'); s.value = 'AT'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(1200);
  ok('lonjas: con Austria elegida NO se ven los precios semanales de España', !(await vis()));
  await p.evaluate(() => { const s = document.getElementById('lj-c'); s.value = 'ES'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(1200);
  ok('lonjas: al volver a España vuelven a verse', await vis());
  await p.goto(BASE + '/lonjas.html?c=AT', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
  ok('lonjas: abrir directamente con Austria no los muestra', !(await vis()));
  await ctx.close(); }
await browser.close(); srv.close(); console.log('precios semanales: ' + n + ' comprobaciones, ' + fail + ' fallos'); process.exit(fail ? 1 : 0);
