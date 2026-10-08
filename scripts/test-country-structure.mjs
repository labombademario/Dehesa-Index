#!/usr/bin/env node
// Estructura comun de las fichas de pais (paises.html?c=XX): todos los paises tienen las mismas secciones, con los mismos nombres y en el mismo orden,
// y la misma barra de secciones. Lo propio de cada pais va solo dentro de «Datos propios del pais». Mide la pagina real en 4 idiomas, escritorio y movil.
// Uso: node scripts/test-country-structure.mjs [--base http://localhost:8123] [--quick]
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123'), QUICK = process.argv.includes('--quick');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
const CC = ['ES', 'FR', 'DE', 'BE', 'AT', 'PT', 'IT', 'DK', 'NL', 'CA', 'US', 'EU', 'AU', 'UK', 'AR', 'CL', 'PL', 'CH', 'EL', 'IE', 'FI', 'BG', 'HR', 'LT', 'SK'];
const ORDER = ['ps-regmap', 'pp-kpi', 'pp-trade', 'pp-ask', 'ps-explorer', 'ps-detail', 'ps-own', 'ps-agri', 'ps-sources']; // orden en pantalla, igual en todos
const BAR = ['ps-regmap', 'pp-kpi', 'pp-trade', 'pp-ask', 'ps-explorer', 'ps-detail', 'ps-sources'];
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const combos = QUICK ? [['es', 1280]] : [['es', 1280], ['en', 1280], ['fr', 390], ['it', 390]];
for (const [lang, w] of combos) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const seen = {};
  for (const cc of CC) {
    const page = await ctx.newPage(), errs = [], tag = lang + '@' + w + ' ' + cc;
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(BASE + '/paises.html?c=' + cc, { waitUntil: 'networkidle' });
    await page.waitForSelector('#ps-sources', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(600);
    const m = await page.evaluate((order) => {
      const pos = id => { const e = document.getElementById(id); if (!e) return -1; let n = 0, el = e; /* posicion en el documento */ const all = document.getElementsByTagName('*'); for (let i = 0; i < all.length; i++) if (all[i] === e) return i; return -1; };
      const bar = Array.from(document.querySelectorAll('#pa-bar a')).map(a => (a.getAttribute('href') || '').replace('#', '') + '|' + a.textContent.trim());
      const own = document.getElementById('ps-own');
      return { pos: order.map(pos), bar, ownText: own ? own.textContent.trim() : null, h1: (document.querySelector('h1') || {}).textContent, ownSibs: own ? own.parentNode.id : null };
    }, ORDER);
    ok(tag + ': existen todas las secciones estandar (' + ORDER.filter((o, i) => m.pos[i] < 0).join(',') + ')', m.pos.every(p => p > -1));
    ok(tag + ': secciones en el mismo orden', m.pos.every((p, i) => i === 0 || p > m.pos[i - 1]));
    ok(tag + ': la barra de secciones tiene las 7 entradas en el orden comun', JSON.stringify(m.bar.map(b => b.split('|')[0])) === JSON.stringify(BAR));
    ok(tag + ': «Datos propios del pais» dentro del detalle', m.ownSibs === 'ps-detail');
    (seen.bar = seen.bar || {})[cc] = m.bar.map(b => b.split('|')[1]).join('/'); (seen.own = seen.own || {})[cc] = m.ownText;
    ok(tag + ': sin errores de JavaScript', !errs.length);
    await page.close();
  }
  ok(lang + '@' + w + ': los nombres de la barra son los mismos en todos los paises', new Set(Object.values(seen.bar)).size === 1);
  ok(lang + '@' + w + ': el titulo de «Datos propios» es el mismo en todos los paises', new Set(Object.values(seen.own)).size === 1);
  await ctx.close();
}
await browser.close();
console.log(fail ? 'FALLOS: ' + fail : 'test-country-structure: OK (' + CC.length + ' paises x ' + combos.length + ' combinaciones de idioma y ancho)');
process.exit(fail ? 1 : 0);
