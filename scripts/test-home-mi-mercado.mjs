#!/usr/bin/env node
// Portada: panel «Mi mercado». Sin elección guardada ofrece empezar (4 ejemplos con enlace); con elección guardada carga el módulo en modo compacto con las mismas cifras que la página completa
// (precio local = JSON), sin tocar la URL de la portada, sin undefined/NaN ni desborde a 390 px, y el bloque «Más datos» queda plegado. 4 idiomas, 1280/390.
// Uso: node scripts/test-home-mi-mercado.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const cattle = J('data/us-local/cattle-KS.json'), st = cattle.history['Steers|500'], last = st[st.length - 1];
const nrm = s => s.replace(/[., \s  ]/g, '');
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const tag = lang + '@' + w;
  for (const saved of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
    await ctx.addInitScript(([l, sv]) => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); if (sv) localStorage.setItem('di-mi-mercado-v1', JSON.stringify({ c: 'US', r: 'KS', p: 'cattle', k: '' })); } catch (e) {} }, [lang, saved]);
    const page = await ctx.newPage(), errs = [], t2 = tag + (saved ? ' guardada' : ' vacía');
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
    let mm = 0; page.on('request', r => { if (/js\/mi-mercado\.js/.test(r.url())) mm++; });
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    if (!saved) {
      await page.waitForSelector('#home-mm a[href*="mi-mercado.html"]');
      ok(t2 + ': 4 ejemplos con enlace', (await page.$$('#home-mm a[href*="mi-mercado.html?c="]')).length === 4);
      ok(t2 + ': no descarga el módulo', mm === 0);
    } else {
      await page.waitForFunction(() => { const n = document.querySelector('#home-mm [data-mm-body="price"]'); return n && n.innerText.length > 40 && !/…$/.test(n.innerText.trim()); }, null, { timeout: 12000 });
      const t = await page.innerText('#home-mm');
      ok(t2 + ': precio novillos = JSON', nrm(t).includes(nrm(last[1].toFixed(2))));
      ok(t2 + ': cabecera con lugar y enlaces', /Kansas/.test(t) && (await page.$$('#home-mm a[href="calculadora.html"], #home-mm a[href="mi-seguimiento.html"], #home-mm a[href="mi-mercado.html"]')).length === 3);
      ok(t2 + ': sin lista de lo que falta (modo compacto)', (await page.$$('#home-mm [data-mm-body="missing"]')).length === 0);
      ok(t2 + ': la URL de la portada no cambia', new URL(page.url()).search === '');
      ok(t2 + ': sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(t));
    }
    ok(t2 + ': «Más datos» plegado', await page.$eval('#home-more', n => !n.open));
    ok(t2 + ': secciones plegadas siguen en el DOM', (await page.$$('#home-more #home-cultivos, #home-more #home-clima')).length === 2);
    if (w === 390) ok(t2 + ': sin desborde horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    ok(t2 + ': sin errores de consola' + (errs.length ? ' ' + errs.join(' | ') : ''), errs.length === 0);
    await ctx.close();
  }
}
await browser.close();
console.log(fail ? 'FALLAN ' + fail : 'test-home-mi-mercado: todo correcto');
process.exit(fail ? 1 : 0);
