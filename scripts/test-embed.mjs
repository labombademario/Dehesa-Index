#!/usr/bin/env node
// Widget insertable (embed.html, js/embed.js, widgets.html): muestra lo mismo que la API, siempre con fuente y enlace, escapa el nombre
// de la cooperativa, rechaza series inventadas, el cargador lo monta desde OTRA web y ajusta el alto, y _headers permite enmarcar solo el widget.
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { execSync } from 'node:child_process';
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const serve = (root, port, extra) => new Promise(r => { const s = http.createServer((q, a) => { const u = decodeURIComponent(q.url.split('?')[0]); if (extra && extra[u]) { a.writeHead(200, { 'content-type': 'text/html' }); return a.end(extra[u]); } const f = path.join(root, u === '/' ? 'index.html' : u); fs.readFile(f, (e, d) => { if (e) { a.writeHead(404); return a.end('no'); } a.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); a.end(d); }); }); s.listen(port, '127.0.0.1', () => r(s)); });
const A = await serve('.', 18123), PAGE = `<!doctype html><html><body style="margin:0"><h1>Web de la cooperativa</h1><div data-dehesa="eu/trigo" data-lang="en" data-org="Coop &lt;b&gt;X&lt;/b&gt;" data-color="b5651d" data-theme="dark" data-years="2"></div><div data-dehesa="no valida"></div><script async src="http://127.0.0.1:18123/js/embed.js"></script></body></html>`;
const B = await serve('.', 18124, { '/coop.html': PAGE });
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch({ args: ['--no-sandbox'] }));
let fail = 0, n = 0; const ok = (m, c) => { n++; if (!c) { fail++; console.log('FALLA', m); } };
const S = JSON.parse(fs.readFileSync('data/api/v1/series/eu/trigo.json', 'utf8')), last = S.points[S.points.length - 1];
const digits = x => String(x).replace(/[^\d]/g, '');
async function open(url, vp) { const ctx = await browser.newContext({ viewport: vp || { width: 600, height: 800 }, serviceWorkers: 'block' }), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); }); await p.goto(url, { waitUntil: 'networkidle' }); return { ctx, p, errs }; }
for (const lang of ['es', 'en', 'fr', 'it']) {
  const { ctx, p, errs } = await open(`http://127.0.0.1:18123/embed.html?s=eu/trigo&lang=${lang}&org=Mi%20cooperativa`); await p.waitForSelector('.big');
  const t = await p.innerText('#w'); ok(lang + ': el precio es el ultimo de la API', digits(await p.innerText('.big')).startsWith(digits(last[1]).slice(0, 3)) && t.includes(last[0]));
  ok(lang + ': nombre de la cooperativa arriba', t.startsWith('Mi cooperativa')); ok(lang + ': fuente y licencia siempre visibles', t.includes(S.sourceName) && t.includes(S.license));
  ok(lang + ': enlace a Dehesa Index y al informe', (await p.$$eval('.ft a', a => a.map(x => x.getAttribute('href')))).join().includes('informe-negociacion.html?p=trigo'));
  ok(lang + ': grafico con puntos', (await p.$$('svg path')).length === 2 && (await p.$$('#dot')).length === 1); ok(lang + ': sin undefined ni NaN', !/undefined|NaN|\[object/.test(t)); ok(lang + ': sin errores de consola', errs.length === 0);
  ok(lang + ': sin desborde', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); await ctx.close();
}
{ const { ctx, p } = await open('http://127.0.0.1:18123/embed.html?s=eu/trigo&lang=es&org=%3Cimg%20src%3Dx%20onerror%3Dwindow.__x%3D1%3E&c=zzzzzz&t=dark'); await p.waitForSelector('.big');
  ok('el nombre con HTML se escapa (no crea elementos)', (await p.$$('.org img')).length === 0 && (await p.innerText('.org')).includes('<img')); ok('color invalido se ignora', (await p.evaluate(() => document.documentElement.style.getPropertyValue('--ac'))) === '');
  ok('tema oscuro aplicado', (await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark'); ok('el script del nombre no se ejecuta', (await p.evaluate(() => window.__x)) === undefined); await ctx.close(); }
for (const bad of ['zz/inventado', '../../etc/passwd', '', 'EU/TRIGO']) { const { ctx, p } = await open('http://127.0.0.1:18123/embed.html?s=' + encodeURIComponent(bad)); await p.waitForSelector('.err'); ok('serie no valida "' + bad + '": mensaje claro y sin precio', (await p.$$('.big')).length === 0); await ctx.close(); }
{ const { ctx, p } = await open('http://127.0.0.1:18124/coop.html'); await p.waitForSelector('iframe'); await p.waitForTimeout(1500);
  const fr = await p.$$('iframe'); ok('el cargador crea 1 iframe (un valor con formato no valido se ignora)', fr.length === 1);
  const src = await fr[0].getAttribute('src'); ok('el iframe apunta al widget con sus parametros', src.startsWith('http://127.0.0.1:18123/embed.html?s=eu%2Ftrigo') && /lang=en/.test(src) && /c=b5651d/.test(src) && /t=dark/.test(src) && /y=2/.test(src));
  const f = p.frames().find(x => x.url().includes('embed.html')); await f.waitForSelector('.big'); ok('desde otra web: el widget se ve y la cooperativa se escapa', (await f.innerText('.org')) === 'Coop <b>X</b>');
  const h = await fr[0].evaluate(e => e.getBoundingClientRect().height), inner = await f.evaluate(() => Math.ceil(document.documentElement.getBoundingClientRect().height)); ok('el cargador ajusta el alto al contenido (' + h + ' vs ' + inner + ')', Math.abs(h - inner) <= 6);
  ok('el cargador no deja cookies ni almacenamiento', (await p.evaluate(() => document.cookie)) === '' && (await p.evaluate(() => localStorage.length)) === 0); await ctx.close(); }
{ const { ctx, p, errs } = await open('http://127.0.0.1:18123/widgets.html?s=eu/trigo'); await p.waitForSelector('#wg-pv'); await p.waitForTimeout(600);
  const c1 = await p.innerText('#wg-c1'); ok('generador: codigo del script con serie, idioma y script', /data-dehesa="eu\/trigo"/.test(c1) && /js\/embed\.js/.test(c1));
  await p.fill('#wg-o', 'Coop "A"<b>'); await p.selectOption('#wg-l', 'fr'); await p.selectOption('#wg-t', 'dark'); await p.waitForTimeout(300);
  const c2 = await p.innerText('#wg-c2'); ok('generador: el iframe refleja nombre, idioma y tema', /lang=fr/.test(c2) && /t=dark/.test(c2) && /org=Coop%20%22A%22b/.test(c2.replace(/&amp;/g, '&')));
  ok('generador: el nombre no rompe el atributo', !/data-org="Coop "A"/.test(await p.innerText('#wg-c1'))); ok('generador: sin errores', errs.length === 0);
  const pv = p.frames().find(x => x.url().includes('embed.html')); await pv.waitForSelector('.big'); ok('generador: la vista previa carga el widget', true); await ctx.close(); }
const H = fs.readFileSync('_headers', 'utf8'), blocks = H.split(/\n(?=\S)/).filter(b => !b.startsWith('#'));
const get = k => blocks.find(b => b.split('\n')[0].trim() === k) || '';
ok('_headers: /* mantiene SAMEORIGIN', /X-Frame-Options: SAMEORIGIN/.test(get('/*'))); for (const k of ['/embed', '/embed.html']) ok('_headers: ' + k + ' quita X-Frame-Options y permite enmarcar', /! X-Frame-Options/.test(get(k)) && /frame-ancestors \*/.test(get(k)));
ok('_headers: ninguna otra ruta permite enmarcar', blocks.filter(b => /frame-ancestors/.test(b)).length === 2);
await browser.close(); A.close(); B.close(); console.log(n + ' comprobaciones, ' + fail + ' fallos'); process.exit(fail ? 1 : 0);
