#!/usr/bin/env node
// Oferta y demanda, pestaña España (MAPA): cifras de la tabla y de las tarjetas = data/spain-balances/cereals.json, selectores, notas del total, cita, 4 idiomas, 1280/390. Uso: node scripts/test-od-es.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process'; import { readFileSync } from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const J = JSON.parse(readFileSync('data/spain-balances/cereals.json', 'utf8')), ys = Object.keys(J.campaigns).sort(), Y = ys[ys.length - 1];
const OL = JSON.parse(readFileSync('data/spain-balances/olive.json', 'utf8')), oys = Object.keys(OL.campaigns).sort(), OY = oys[oys.length - 1];
const WJ = JSON.parse(readFileSync('data/spain-wine/infovi.json', 'utf8')), WL = WJ.campaigns.length - 1, wk = (f, i) => String(Math.round(WJ.national[f][i] / 1000)), wy = WJ.campaigns[WL];
const MJ = JSON.parse(readFileSync('data/spain-wine/monthly.json', 'utf8')), ML = MJ.months.length - 1, mk = (f, k) => String(Math.round((k ? MJ.ccaa[k][f][ML] : MJ.national[f][ML]) / 1000));
const HJ = JSON.parse(readFileSync('data/spain-wine/balance-historic.json', 'utf8')), HN = HJ.campaigns.length, hk = (c, i) => String(Math.round(HJ.v[c].total.all[i]));
const digits = s => s.replace(/\D/g, '');
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); localStorage.setItem('dehesaIndexLocation', 'us'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/oferta-demanda.html?c=ES', { waitUntil: 'networkidle' });
  await page.waitForSelector('#od-es table tbody tr', { timeout: 8000 }).catch(() => {});
  const m = await page.evaluate(() => { var e = document.getElementById('od-es'); var rows = [].map.call(e.querySelectorAll('table')[0].querySelectorAll('tbody tr'), r => [].map.call(r.cells, c => c.innerText.trim())); return { txt: e.innerText, rows: rows, cmp: e.querySelectorAll('table')[1].querySelectorAll('tbody tr').length, svgs: e.querySelectorAll('svg').length, worldHidden: document.getElementById('od-body').hidden, tabs: document.querySelectorAll('[data-odtab]').length, over: document.documentElement.scrollWidth > innerWidth + 1 }; });
  const v = J.campaigns[Y].v.wheat_soft;
  ok(tag + ' pestañas (mundo, España y países) y el mundo oculto', m.tabs >= 2 && m.worldHidden);
  ok(tag + ' produccion trigo blando = JSON', m.rows.some(r => digits(r[1]) === String(v.production)));
  ok(tag + ' existencias finales = JSON', m.rows.some(r => digits(r[1]) === String(v.endingStocks)));
  ok(tag + ' 9 filas de cereales en la comparacion', m.cmp === 9);
  ok(tag + ' dos graficos', m.svgs >= 2);
  ok(tag + ' cita MAPA', /MAPA/.test(m.txt));
  if (w === 1280) {
    await page.selectOption('#od-es-p', 'olive'); await page.waitForSelector('#od-es-oy');
    const o = await page.evaluate(() => { var e = document.getElementById('od-es'); var tb = e.querySelectorAll('table'); var rows = [].map.call(tb[0].querySelectorAll('tbody tr'), r => [].map.call(r.cells, c => c.innerText.trim())); var ar = [].map.call(tb[1].querySelectorAll('tbody tr'), r => [].map.call(r.cells, c => c.innerText.trim())); return { rows: rows, ar: ar, svgs: e.querySelectorAll('svg').length, txt: e.innerText, h1: document.getElementById('pg-h1').textContent, over: document.documentElement.scrollWidth > innerWidth + 1 }; });
    const ov = OL.campaigns[OY].v.oil, A = OL.aforo;
    ok(tag + ' aceite: produccion = JSON', o.rows.some(r => digits(r[1]) === String(ov.production).replace(/\D/g, '')));
    ok(tag + ' aceite: existencias finales = JSON', o.rows.some(r => digits(r[1]) === String(ov.endingStocks).replace(/\D/g, '')));
    ok(tag + ' aforo: una fila por CCAA y el total', o.ar.length === A.ccaa.length + 1);
    ok(tag + ' aforo: total = JSON', digits(o.ar[o.ar.length - 1][3]) === String(A.total.estimate));
    ok(tag + ' aforo rotulado como estimacion', /ESTIMACI|ESTIMATE|ESTIMATION|STIMA/.test(o.txt));
    ok(tag + ' aceite: dos graficos y cita MAPA', o.svgs >= 2 && /MAPA/.test(o.txt));
    ok(tag + ' aceite: titulo propio', /aceite|olive|olive|olio|huile/i.test(o.h1));
    ok(tag + ' aceite: sin desborde', !o.over);
    await page.selectOption('#od-es-op', 'tableOlive');
    const tt = await page.evaluate(() => document.getElementById('od-es').innerText);
    ok(tag + ' aceituna de mesa: ajustes y perdidas = JSON', new RegExp(String(OL.campaigns[OY].v.tableOlive.lossesAdj).replace('.', '[.,]')).test(tt));
    await page.selectOption('#od-es-p', 'wine'); await page.waitForSelector('#od-es-wy');
    const wv = await page.evaluate(() => { var e = document.getElementById('od-es'); var tb = e.querySelectorAll('table'); var rows = [].map.call(tb[0].querySelectorAll('tbody tr'), r => [].map.call(r.cells, c => c.innerText.trim())); var cr = [].map.call(tb[1].querySelectorAll('tbody tr'), r => [].map.call(r.cells, c => c.innerText.trim())); return { rows: rows, cr: cr, svgs: e.querySelectorAll('svg').length, txt: e.innerText, h1: document.getElementById('pg-h1').textContent, over: document.documentElement.scrollWidth > innerWidth + 1 }; });
    const dg = s => s.replace(/\D/g, '');
    ok(tag + ' vino: produccion = JSON (miles de hl)', wv.rows.some(r => dg(r[1]) === wk('wine', WL)));
    ok(tag + ' vino: existencias de vino = JSON', wv.rows.some(r => dg(r[1]) === wk('stockWine', WL)));
    ok(tag + ' vino: exportaciones declaradas = JSON', wv.rows.some(r => dg(r[1]) === wk('exports', WL)));
    ok(tag + ' vino: 17 comunidades y España en la tabla', wv.cr.length === 18 && dg(wv.cr[17][1]) === wk('wine', WL));
    ok(tag + ' vino: Castilla-La Mancha primera', /Mancha/.test(wv.cr[0][0]));
    ok(tag + ' vino: dos graficos y cita MAPA', wv.svgs >= 2 && /MAPA/.test(wv.txt));
    ok(tag + ' vino: aviso de que son declaraciones y no un balance', /declaraciones|declarations|déclarations|dichiarazioni/.test(wv.txt) && /balance|bilan|bilancio/i.test(wv.txt));
    const mt = await page.evaluate(() => { var e = document.getElementById('od-es'); var tb = e.querySelectorAll('table'); return { rows: [].map.call(tb[tb.length - 2].querySelectorAll('tbody tr'), r => [].map.call(r.cells, c => c.innerText.trim())), hrows: [].map.call(tb[tb.length - 1].querySelectorAll('tbody tr'), r => [].map.call(r.cells, c => c.innerText.trim())), hhead: [].map.call(tb[tb.length - 1].querySelectorAll('thead th'), c => c.innerText.trim()), svgs: e.querySelectorAll('svg').length }; });
    ok(tag + ' vino mensual: 17 comunidades y España, existencias finales y salidas del ultimo mes = JSON', mt.rows.length === 18 && dg(mt.rows[17][1]) === mk('stockEnd') && dg(mt.rows[17][mt.rows[17].length - 1]) === mk('exitsTotal'));
    ok(tag + ' vino mensual: tres graficos en la vista', mt.svgs >= 3 && /perímetro|scope|périmètre|perimetro/.test(wv.txt));
    ok(tag + ' vino historico: 7 campañas en la cabecera y la ultima rotulada provisional', mt.hhead.length === HN + 1 && /provisional|provvisorio|provisoire/i.test(mt.hhead[HN]));
    ok(tag + ' vino historico: produccion, exportaciones y existencias finales de la primera y ultima campaña = JSON (miles de hl)', [['2', 1], ['5', 4], ['7', 8]].every(a => dg(mt.hrows[a[1]][1]) === dg(hk(a[0], 0)) && dg(mt.hrows[a[1]][HN]) === dg(hk(a[0], HN - 1))));
    ok(tag + ' vino historico: avisa del hueco 2016/17-2019/20, de que no es comparable con INFOVI y de que no hay desglose por comunidad', /2016\/17/.test(wv.txt) && /2019\/20/.test(wv.txt) && /INFOVI/.test(wv.txt) && /región|region|regione|comunidad|communauté|comunità/i.test(wv.txt));
    ok(tag + ' vino: titulo propio y sin desborde', /vino|wine|vin\b|vino/i.test(wv.h1) && !wv.over);
    await page.selectOption('#od-es-p', 'cer'); await page.waitForSelector('#od-es-y');
  }
  ok(tag + ' sin desborde', !m.over); ok(tag + ' sin errores de consola', errs.length === 0); if (errs.length) console.log(errs);
  if (w === 1280 && lang === 'es') {
    await page.selectOption('#od-es-y', '2019'); await page.selectOption('#od-es-c', 'total');
    const t2 = await page.evaluate(() => document.getElementById('od-es').innerText);
    ok('2019/20 total: la discrepancia del MAPA se ve', /36\.627/.test(t2) && /35\.827/.test(t2));
    await page.click('[data-odtab="world"]'); await page.waitForTimeout(300);
    ok('volver a Mundo muestra el balance mundial', await page.evaluate(() => !document.getElementById('od-body').hidden && document.getElementById('od-es').hidden && /Oferta y demanda$/.test(document.getElementById('pg-h1').textContent.trim())));
  }
  await ctx.close();
}
await browser.close(); console.log(fail ? 'test-od-es: ' + fail + ' fallos' : 'test-od-es: OK (4 idiomas x 2 anchos)'); process.exit(fail ? 1 : 0);
