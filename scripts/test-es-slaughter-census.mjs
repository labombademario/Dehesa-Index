#!/usr/bin/env node
// España, sacrificio anual por provincia (MAPA): las cifras que se ven = data/spain-slaughter/census.json (vacuno de España, Lugo, porcino, peso medio), provincias con DC fuera de la tabla y listadas, años 2004-2025, selectores, atribucion, 4 idiomas, 1280/390. Uso: node scripts/test-es-slaughter-census.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process'; import { readFileSync } from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const J = JSON.parse(readFileSync('data/spain-slaughter/census.json', 'utf8')), L = J.years.length - 1;
const sep = '[.,\\s\u00a0\u202f]?', f1 = x => { const [a, b] = x.toFixed(1).split('.'); return a.replace(/\B(?=(\d{3})+$)/g, sep) + '[.,]' + b; }, kt = v => f1(v / 1000), mm = v => (v / 1e6).toFixed(2).replace('.', '[.,]') + '\\s?M', ex = v => String(v).replace('.', '[.,]'), nm = v => String(Math.round(v)).replace(/\B(?=(\d{3})+$)/g, '[.,\\s  ]?');
const NAT = J.v.ES.bovino.heads[L], PIG = J.v.ES.porcino.meat[L];
const NR = Object.keys(J.provinces).filter(k => J.v[k].bovino.heads[L] !== null).length, NDC = Object.keys(J.provinces).length - NR;
const WT = J.v['15'].bovino.meat[L] * 1000 / J.v['15'].bovino.heads[L];
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); localStorage.setItem('dehesaIndexLocation', 'us'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  const get = () => page.evaluate(() => { var c = document.getElementById('gn-esc'); return { txt: c ? c.innerText : '', rows: c ? c.querySelectorAll('table tbody tr').length : 0, svgs: c ? c.querySelectorAll('svg').length : 0, hidden: c ? c.hidden : true, ess: document.getElementById('gn-ess').hidden, dc: (document.getElementById('gn-esc-dc') || {}).innerText || '', years: c && document.getElementById('gn-esc-per') ? document.getElementById('gn-esc-per').options.length : 0, over: document.documentElement.scrollWidth > innerWidth + 1 }; });
  await page.goto(BASE + '/ganaderia.html?c=ES-SACRIFICIO-PROV', { waitUntil: 'networkidle' });
  await page.waitForSelector('#gn-esc:not([hidden]) table tbody tr', { timeout: 8000 }).catch(() => {});
  let m = await get();
  ok(tag + ' solo esta pestaña visible', !m.hidden && m.ess);
  ok(tag + ' provincias con cifra en la tabla (las DC no salen, no son cero) = ' + NR, m.rows === NR && NR < 50);
  ok(tag + ' total de España del ultimo año = JSON', new RegExp(mm(NAT)).test(m.txt));
  ok(tag + ' ' + J.years.length + ' años en el selector (2004-2025)', m.years === J.years.length);
  ok(tag + ' lista de las ' + NDC + ' provincias sin cifra (DC)', m.dc.length > 40 && /Lugo|Cantabria/.test(m.dc));
  ok(tag + ' mapa y grafico', m.svgs >= 2);
  ok(tag + ' cita MAPA', /MAPA|Ministerio|Ministry|ministère|Ministero/.test(m.txt));
  ok(tag + ' sin desborde', !m.over);
  if (w === 1280) {
    await page.selectOption('#gn-esc-item', 'porcino'); await page.selectOption('#gn-esc-met', 'carcass'); m = await get();
    ok(tag + ' porcino peso canal de España = JSON', new RegExp(kt(PIG)).test(m.txt) && m.rows >= 10);
    await page.selectOption('#gn-esc-item', 'bovino'); await page.selectOption('#gn-esc-met', 'weight'); m = await get();
    ok(tag + ' peso medio del vacuno en A Coruña calculado = ' + WT.toFixed(1), new RegExp(ex(WT.toFixed(1))).test(m.txt));
    await page.selectOption('#gn-esc-met', 'heads'); await page.selectOption('#gn-esc-per', '2007'); m = await get();
    ok(tag + ' 2007: aviso de «sin elevar» y 50 provincias sin DC', m.rows >= 49 && /elevar|unraised|élevées|elevati/.test(m.dc));
    const i07 = J.years.indexOf(2007); ok(tag + ' 2007: vacuno de España = JSON', new RegExp(mm(J.v.ES.bovino.heads[i07])).test(m.txt));
    await page.selectOption('#gn-esc-per', '2004'); m = await get(); ok(tag + ' 2004: la tabla sigue con provincias', m.rows >= 49);
  }
  ok(tag + ' sin errores de consola', errs.length === 0); if (errs.length) console.log(errs);
  await ctx.close();
}
await browser.close(); console.log(fail ? 'test-es-slaughter-census: ' + fail + ' fallos' : 'test-es-slaughter-census: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
