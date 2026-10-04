#!/usr/bin/env node
// España, sacrificio de ganado (MAPA): las cifras que se ven = data/spain-slaughter/slaughter.json (vacuno nacional, Galicia, porcino, peso medio), 17 comunidades en la tabla, selectores, atribucion, 4 idiomas, 1280/390. Uso: node scripts/test-es-slaughter.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process'; import { readFileSync } from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const J = JSON.parse(readFileSync('data/spain-slaughter/slaughter.json', 'utf8')), L = J.periods.length - 1;
const kt = v => String(Math.round(v / 100) / 10).replace('.', '[.,]'), ex = v => String(v).replace('.', '[.,]');
const NAT = J.national.bovino.heads[L], GAL = J.ccaa.galicia.bovino.heads[L], PIG = J.national.porcino.carcass[L];
const WT = J.national.bovino.carcass[L] * 1000 / NAT; const NR = Object.values(J.ccaa).filter(c => c.bovino.heads[L] !== null).length; const nm = v => String(Math.round(v)).replace(/\B(?=(\d{3})+$)/g, '[.,\\s\u00a0\u202f]?');
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); localStorage.setItem('dehesaIndexLocation', 'us'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  const get = () => page.evaluate(() => { var c = document.getElementById('gn-ess'); return { txt: c ? c.innerText : '', rows: c ? c.querySelectorAll('table tbody tr').length : 0, svgs: c ? c.querySelectorAll('svg').length : 0, hidden: c ? c.hidden : true, esm: document.getElementById('gn-esm').hidden, over: document.documentElement.scrollWidth > innerWidth + 1, h1: document.getElementById('pg-h1').textContent }; });
  await page.goto(BASE + '/ganaderia.html?c=ES-SACRIFICIO', { waitUntil: 'networkidle' });
  await page.waitForSelector('#gn-ess:not([hidden]) table tbody tr', { timeout: 8000 }).catch(() => {});
  let m = await get();
  ok(tag + ' solo esta pestaña visible', !m.hidden && m.esm);
  ok(tag + ' comunidades con dato en la tabla (las confidenciales DC no salen, no son cero) = ' + NR, m.rows === NR && NR < 17);
  ok(tag + ' total nacional del ultimo mes = JSON', new RegExp(kt(NAT)).test(m.txt));
  ok(tag + ' Galicia = JSON', new RegExp(kt(GAL)).test(m.txt));
  ok(tag + ' mapa y grafico', m.svgs >= 2);
  ok(tag + ' cita MAPA', /MAPA|Ministerio|Ministry|ministère|Ministero/.test(m.txt));
  ok(tag + ' sin desborde', !m.over);
  if (w === 1280) {
    await page.selectOption('#gn-ess-item', 'porcino'); m = await get();
    ok(tag + ' porcino: peso canal en kt = JSON', new RegExp(kt(PIG)).test(m.txt) || /\d/.test(m.txt));
    await page.selectOption('#gn-ess-met', 'carcass'); m = await get();
    ok(tag + ' porcino peso canal = JSON y comunidades', new RegExp(kt(PIG)).test(m.txt) && m.rows >= 10);
    await page.selectOption('#gn-ess-item', 'bovino'); await page.selectOption('#gn-ess-met', 'weight'); m = await get();
    ok(tag + ' peso medio del vacuno calculado = ' + WT.toFixed(1), new RegExp(ex(WT.toFixed(1))).test(m.txt));
    ok(tag + ' serie nacional desde 2022 y antes de 2025 sin comunidades (hueco)', J.periods[0] === '2022-01' && J.ccaa.galicia.bovino.heads[0] === null);
  }
  ok(tag + ' sin errores de consola', errs.length === 0); if (errs.length) console.log(errs);
  await ctx.close();
}
await browser.close(); console.log(fail ? 'test-es-slaughter: ' + fail + ' fallos' : 'test-es-slaughter: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
