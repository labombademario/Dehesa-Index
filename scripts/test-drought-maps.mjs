#!/usr/bin/env node
// Norma (21-oct-2026): la «sequía por región» de cada ficha de país europeo lleva su mapa (js/country-drought.js). Comprueba con navegador real que
// el mapa aparece, colorea todas sus regiones con dato y que el cruce de códigos (NUTS 2 -> regiones del mapa) cubre cada región de la tabla. 1280/390.
import fs from 'node:fs'; import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
// EL, HR, IE, IT, NL y PT llevan un mapa por provincia propio (js/el-, hr-, ie-, it-, nl-, pt-drought.js), no el de regiones
const CC = ['DK', 'DE', 'FR', 'ES', 'PL', 'BE', 'AT', 'UK', 'CH', 'FI', 'SE', 'HU', 'CZ', 'RO', 'BG', 'SK', 'SI', 'LT'];
let fails = 0, n = 0; const ok = (m, c) => { n++; if (!c) { fails++; console.log('FALLO ' + m); } };
for (const w of [1280, 390]) for (const cc of CC) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { try { localStorage.setItem('dehesaIndexLang', 'es'); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} });
  await p.goto(BASE + '/paises.html?c=' + cc + '#ps-drought', { waitUntil: 'networkidle' });
  for (let i = 0; i < 8; i++) { const done = await p.evaluate(() => { const e = document.getElementById('ps-drought'); if (e) { let a = e; while (a) { if (a.tagName === 'DETAILS') a.open = true; a = a.parentElement; } e.scrollIntoView(); } else window.scrollBy(0, 2500); return !!document.querySelector('#ps-drought .cd-map path'); }); if (done) break; await p.waitForTimeout(700); }
  const r = await p.evaluate(() => { const m = document.querySelector('#ps-drought .cd-map'); return { map: !!m, paths: m ? m.querySelectorAll('path').length : 0, none: m ? m.querySelectorAll('path.gb-cx').length : 0, ow: document.documentElement.scrollWidth <= innerWidth + 1 }; });
  ok(cc + '@' + w + ': hay mapa', r.map && r.paths > 1);
  ok(cc + '@' + w + ': todas las regiones del mapa con dato (' + r.none + ' sin dato)', r.none === 0);
  ok(cc + '@' + w + ': sin desborde', r.ow);
  ok(cc + '@' + w + ': sin errores ' + errs.join(' | '), !errs.length);
  await p.close();
}
await b.close();
console.log(fails ? 'test-drought-maps: ' + fails + ' fallos de ' + n : 'test-drought-maps: OK (' + CC.length + ' países x 2 anchos)');
process.exit(fails ? 1 : 0);
