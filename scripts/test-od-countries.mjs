#!/usr/bin/env node
// Oferta y demanda, pestañas de balances por país (data/supply-balances/*.json): tabla, tarjetas y comparación = JSON, producto sin dato, cambio de pestaña y URL, cita, 4 idiomas, 1280/390.
// Uso: node scripts/test-od-countries.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process'; import { readFileSync, readdirSync } from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const digits = s => s.replace(/\D/g, '');
const files = readdirSync('data/supply-balances').filter(f => /^[a-z]{2}\.json$/.test(f));
ok('hay al menos un balance por país', files.length >= 1);
for (const f of files) {
  const J = JSON.parse(readFileSync('data/supply-balances/' + f, 'utf8')), CC = J.country, ys = Object.keys(J.campaigns).sort(), Y = ys[ys.length - 1];
  const lead = J.products.find(p => J.campaigns[Y].v[p.id]) || J.products[0], v = J.campaigns[Y].v[lead.id];
  const noData = J.products.find(p => !J.campaigns[Y].v[p.id]);
  for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, serviceWorkers: 'block' });
    await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); localStorage.setItem('dehesaIndexLocation', 'us'); } catch (e) {} }, lang);
    const page = await ctx.newPage(), errs = [], tag = CC + ' ' + lang + '@' + w;
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
    await page.goto(BASE + '/oferta-demanda.html?c=' + CC, { waitUntil: 'networkidle' });
    await page.waitForSelector('#od-cc table tbody tr', { timeout: 8000 }).catch(() => {});
    const m = await page.evaluate(() => { var e = document.getElementById('od-cc'); var tb = e.querySelectorAll('table'); var rows = [].map.call(tb[0].querySelectorAll('tbody tr'), r => [].map.call(r.cells, c => c.innerText.trim())); return {
      txt: e.innerText, rows: rows, cmp: tb[1] ? tb[1].querySelectorAll('tbody tr').length : 0, svgs: e.querySelectorAll('svg').length, h1: document.getElementById('pg-h1').textContent,
      worldHidden: document.getElementById('od-body').hidden, esHidden: document.getElementById('od-es').hidden, sel: [].map.call(document.querySelectorAll('[data-odtab][aria-selected=true]'), b => b.dataset.odtab), tabs: document.querySelectorAll('[data-odtab]').length,
      q: location.search, over: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }; });
    ok(tag + ' solo la pestaña del pais seleccionada y el resto oculto', m.sel.length === 1 && m.sel[0] === CC && m.worldHidden && m.esHidden);
    ok(tag + ' titulo propio (no el del mundo)', m.h1 && m.h1 !== 'Oferta y demanda' && !/^(Supply and demand|Offre et demande|Offerta e domanda)$/.test(m.h1));
    for (const k of J.items.map(i => i.id)) { const val = v[k]; if (typeof val === 'number') ok(tag + ' ' + k + ' = JSON (' + val + ')', m.rows.some(r => digits(r[1]) === digits(String(val)))); }
    ok(tag + ' una fila en la comparacion por cada producto con dato', m.cmp === J.products.filter(p => J.campaigns[Y].v[p.id]).length);
    ok(tag + ' dos graficos', m.svgs >= 2);
    ok(tag + ' cita de la fuente', new RegExp(J.source.name.split(' ')[0]).test(m.txt));
    ok(tag + ' sin desbordamiento horizontal', !m.over);
    ok(tag + ' sin errores de consola', errs.length === 0);
    if (w === 1280 && lang === 'es') {
      if (noData) { await page.selectOption('#od-cc-p', noData.id); await page.waitForTimeout(200); const t = await page.evaluate(() => document.getElementById('od-cc').innerText); ok(tag + ' producto sin dato: lo dice y no inventa tabla', /no publica/.test(t) && !/Balance ·/.test(t)); }
      await page.click('[data-odtab=es]'); await page.waitForTimeout(500);
      const a = await page.evaluate(() => ({ cc: document.getElementById('od-cc').hidden, es: document.getElementById('od-es').hidden, q: location.search }));
      ok(tag + ' al ir a España se oculta el pais y la URL cambia', a.cc && !a.es && /c=ES/.test(a.q));
      await page.click('[data-odtab=world]'); await page.waitForTimeout(500);
      const b = await page.evaluate(() => ({ body: document.getElementById('od-body').hidden, q: location.search, h1: document.getElementById('pg-h1').textContent }));
      ok(tag + ' al volver al mundo se limpia la URL y el titulo', !b.body && !/c=/.test(b.q) && b.h1 === 'Oferta y demanda');
    }
    await ctx.close();
  }
}
await browser.close(); console.log(fail ? 'test-od-countries: ' + fail + ' fallos' : 'test-od-countries: OK (' + files.length + ' paises x 4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
