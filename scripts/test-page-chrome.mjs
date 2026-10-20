#!/usr/bin/env node
// «Toda página tiene cabecera, menú y pie, y se puede encontrar». Recorre cada .html de la raiz en un navegador real (es y en, 1280 y 390):
//   1. #di-nav-root y #di-footer-root no estan vacios y hay un <h1> (cazaria una pagina nueva que olvida DehesaShared.init).
//   2. Cada pagina es alcanzable desde la portada en como mucho 3 clics siguiendo enlaces reales del DOM (menu, pie y los enlaces de las paginas por las que se pasa).
//   3. Cada pagina con menu propio esta ademas ENLAZADA DESDE EL MENU o figura en MENU_AUN_NO con el motivo (no se puede añadir una pagina en silencio).
// Paginas sin cabecera a proposito: embed.html (widget para otras webs) y offline.html (la sirve el service worker sin red).
// Uso: node scripts/test-page-chrome.mjs [--base http://localhost:8123]
import fs from 'node:fs'; import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const SIN_CABECERA = new Set(['embed.html', 'offline.html']);
// Paginas que existen y se encuentran por otro camino (pagina «hub» o pie) pero NO estan en el menu principal. Añadir aqui exige escribir por que.
const MENU_AUN_NO = JSON.parse(fs.readFileSync('scripts/page-chrome-menu-exempt.json', 'utf8'));
const pages = fs.readdirSync('.').filter(f => /\.html$/.test(f) && !/^(google|404)/.test(f)).sort();
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const bad = (n) => { fail++; console.log('FALLA', n); };
const norm = h => { try { const u = new URL(h, BASE + '/'); if (u.origin !== BASE) return null; let f = u.pathname.replace(/^\//, '') || 'index.html'; if (!/\.html$/.test(f)) f += '.html'; return f; } catch (e) { return null; } };
const edges = {}, menu = new Set();
for (const [lang, w] of [['es', 1280], ['es', 390], ['en', 1280]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage();
  for (const f of pages) {
    await page.goto(BASE + '/' + f, { waitUntil: 'load', timeout: 30000 }).catch(() => {}); await page.waitForTimeout(1200);
    const r = await page.evaluate(() => ({ nav: (document.getElementById('di-nav-root') || { innerHTML: '' }).innerHTML.length, foot: (document.getElementById('di-footer-root') || { innerHTML: '' }).innerHTML.length,
      h1: ((document.querySelector('h1') || {}).textContent || '').trim(), all: [].map.call(document.querySelectorAll('a[href]'), a => a.getAttribute('href')), menu: [].map.call(document.querySelectorAll('#di-nav-root a[href]'), a => a.getAttribute('href')) }));
    const tag = f + ' ' + lang + '@' + w;
    if (!SIN_CABECERA.has(f)) { if (r.nav < 500) bad(tag + ': sin menu (¿falta DehesaShared.init?)'); if (r.foot < 100) bad(tag + ': sin pie'); if (!r.h1) bad(tag + ': sin <h1>'); }
    if (lang === 'es' && w === 1280) { edges[f] = new Set(r.all.map(norm).filter(Boolean)); if (f === 'index.html') r.menu.map(norm).filter(Boolean).forEach(x => menu.add(x)); }
  }
  await ctx.close();
}
await browser.close();
// alcanzable desde la portada en <= 3 clics
const dist = { 'index.html': 0 }, q = ['index.html'];
while (q.length) { const a = q.shift(); if (dist[a] >= 3) continue; for (const b of edges[a] || []) if (!(b in dist)) { dist[b] = dist[a] + 1; q.push(b); } }
for (const f of pages) if (!SIN_CABECERA.has(f) && !(f in dist)) bad(f + ': no se llega desde la portada en 3 clics');
// en el menu, o exento con motivo
for (const f of pages) if (!SIN_CABECERA.has(f) && !menu.has(f) && !MENU_AUN_NO[f]) bad(f + ': no esta en el menu ni en scripts/page-chrome-menu-exempt.json (añadelo al menu o explica por que no)');
for (const f of Object.keys(MENU_AUN_NO)) { if (menu.has(f)) bad(f + ': ya esta en el menu; quitalo de page-chrome-menu-exempt.json'); if (!pages.includes(f)) bad(f + ': figura en page-chrome-menu-exempt.json pero la pagina no existe'); }
const dmax = Math.max(...Object.values(dist));
console.log(fail ? 'test-page-chrome: ' + fail + ' fallos' : 'test-page-chrome: OK (' + pages.length + ' paginas, ' + menu.size + ' en el menu, profundidad maxima ' + dmax + ')'); process.exit(fail ? 1 : 0);
