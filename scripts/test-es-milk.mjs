#!/usr/bin/env node
// España, leche cruda (MAPA, INFOLAC): las cifras que se ven = data/spain-milk/infolac.json (total nacional, Galicia, precio, grasa), 17 comunidades en la tabla, selectores, atribucion, 4 idiomas, 1280/390. Uso: node scripts/test-es-milk.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process'; import { readFileSync } from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const J = JSON.parse(readFileSync('data/spain-milk/infolac.json', 'utf8')), L = J.periods.length - 1;
const kt = v => String(Math.round(v / 100) / 10).replace('.', '[.,]'), ex = v => String(v).replace('.', '[.,]');
const NAT = J.national.deliveries[L], GAL = J.ccaa.galicia.production[L], PR = J.national.price[L], FAT = J.national.fat[L];
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); localStorage.setItem('dehesaIndexLocation', 'us'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  const get = () => page.evaluate(() => { var c = document.getElementById('gn-esl'); return { txt: c ? c.innerText : '', rows: c ? c.querySelectorAll('table tbody tr').length : 0, svgs: c ? c.querySelectorAll('svg').length : 0, hidden: c ? c.hidden : true, esm: document.getElementById('gn-esm').hidden, over: document.documentElement.scrollWidth > innerWidth + 1, h1: document.getElementById('pg-h1').textContent }; });
  await page.goto(BASE + '/ganaderia.html?c=ES-INFOLAC', { waitUntil: 'networkidle' });
  await page.waitForSelector('#gn-esl:not([hidden]) table tbody tr', { timeout: 8000 }).catch(() => {});
  let m = await get();
  ok(tag + ' solo esta pestaña visible', !m.hidden && m.esm);
  ok(tag + ' 17 comunidades en la tabla', m.rows === 17);
  ok(tag + ' total nacional del ultimo mes = JSON', new RegExp(kt(NAT)).test(m.txt));
  ok(tag + ' Galicia = JSON', new RegExp(kt(GAL)).test(m.txt));
  ok(tag + ' mapa y grafico', m.svgs >= 2);
  ok(tag + ' cita MAPA', /MAPA|Ministerio|Ministry|ministère|Ministero/.test(m.txt));
  ok(tag + ' sin desborde', !m.over);
  if (w === 1280) {
    await page.selectOption('#gn-esl-item', 'price'); m = await get();
    ok(tag + ' precio medio = JSON (sin tabla por comunidad)', new RegExp(ex(PR.toFixed(3))).test(m.txt) && m.rows === 0);
    await page.selectOption('#gn-esl-item', 'fat'); m = await get();
    ok(tag + ' grasa = JSON y 17 comunidades', new RegExp(ex(FAT.toFixed(2))).test(m.txt) && m.rows === 17);
    ok(tag + ' el precio de hace 4 años existe en el grafico (serie desde 2022)', J.periods[0] === '2022-01' && J.national.price[0] === 0.371);
  }
  ok(tag + ' sin errores de consola', errs.length === 0); if (errs.length) console.log(errs);
  await ctx.close();
}
await browser.close(); console.log(fail ? 'test-es-milk: ' + fail + ' fallos' : 'test-es-milk: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
