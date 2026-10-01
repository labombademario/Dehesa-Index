#!/usr/bin/env node
// E2E parametrico (variantes): lo que e2e.mjs prueba solo con el producto/regla/unidad por defecto, aqui se recorre entero.
//   products   TODOS los Product Profile 3.0 (data/products/*.json): bloques, sin errores, payload < 1 MB, identidad del instrumento visible
//   compare    cada producto del comparador (data/product-compare.json)
//   watchlist  cada tipo de regla de la Watchlist (above, below, pct, pctUp, pctDown, new, rev, fDELAYED, fSTALE, tw)
//   calc       calculadora: EUR/USD/CAD/GBP x ha/acre x t/ha-bu/ac x precio t/bu (mismos importes => mismo resultado)
//   fresh      estados LIVE/FRESH/EXPECTED_DELAY/DELAYED/STALE/HISTORICAL en el catalogo y en el Observatorio
//   obs        Observatorio: 20 iniciales, "Mostrar 20 mas" y filtros sobre todo el conjunto
// Modos: --smoke (por defecto; push: un subconjunto representativo) o --full (programado: todas las combinaciones).
// Uso: node scripts/e2e-variants.mjs [--smoke|--full] [--only products,calc] [--base http://localhost:8123]
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123'), ONLY = (arg('--only', '') || '').split(',').filter(Boolean), FULL = process.argv.includes('--full');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
const J = async (f) => JSON.parse(await readFile(path.join(root, 'data', f), 'utf8'));
const sameOrigin = u => { try { return new URL(u).origin === new URL(BASE).origin; } catch (e) { return false; } };
const fails = []; let ran = 0;
const want = n => !ONLY.length || ONLY.includes(n);
const pick = (all, smoke) => FULL ? all : all.filter(x => smoke.includes(x));

async function run(name, vpw, fn) {
  const ctx = await browser.newContext({ viewport: { width: vpw, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { try { localStorage.setItem('dehesaIndexLang', 'es'); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} });
  const page = await ctx.newPage(); const errs = []; const st = { bytes: 0 };
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::ERR_|Failed to load resource.*(tunnel|ERR_)/.test(m.text()) && sameOrigin(m.location().url || BASE)) errs.push('console: ' + m.text().slice(0, 140)); });
  page.on('response', async r => { if (!sameOrigin(r.url())) return; if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + new URL(r.url()).pathname); else if (/\/data\/.*\.json$/.test(r.url())) { const cl = +r.headers()['content-length']; if (cl) st.bytes += cl; else { try { st.bytes += (await r.body()).length; } catch (e) {} } } });
  try { await fn(page, st); } catch (e) { errs.push('flujo: ' + e.message.split('\n')[0]); }
  ran++; console.log((errs.length ? 'FAIL ' : 'ok   ') + (name + ' @' + vpw).padEnd(46) + (st.bytes ? Math.round(st.bytes / 1024) + ' KB datos' : ''));
  errs.forEach(e => { console.log('       - ' + e); fails.push(name + ' @' + vpw + ': ' + e); });
  await ctx.close();
}
const scrollAll = page => page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight + 1500; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } }).then(() => page.waitForTimeout(700));
const txt = (page, s) => page.evaluate(s => { const e = document.querySelector(s); return e ? (e.innerText || '').trim() : null; }, s);

// ---------------------------------------------------------------- 1) Product Profile 3.0: todos
if (want('products')) {
  const ids = (await readdir(path.join(root, 'data/products'))).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort();
  const meta = (await J('product-metadata.json')).products;
  if (ids.join() !== Object.keys(meta).filter(k => ids.includes(k)).sort().join()) fails.push('products: data/products/* no coincide con product-metadata.json');
  for (const w of FULL ? [1280, 390] : [1280]) for (const id of pick(ids, ['trigo', 'soja', 'pollo', 'azucar', 'diesel'])) {
    await run('producto 3.0 ' + id, w, async (page, st) => {
      await page.goto(BASE + '/producto.html?p=' + id, { waitUntil: 'load' }); await page.waitForSelector('#pt-head .pt-card', { timeout: 10000 });
      await scrollAll(page);
      const secs = await page.evaluate(() => [...document.querySelectorAll('section[id^=pt-]')].map(s => ({ id: s.id.slice(3), len: ((s.querySelector('.pt-body') || s).innerText || '').trim().length, err: !!s.querySelector('.pt-err') })));
      for (const s of secs) if (s.err) throw new Error('bloque ' + s.id + ' con error de carga');
      for (const need of ['head', 'changed', 'compare', 'hist']) { const s = secs.find(x => x.id === need); if (!s || s.len < 100) throw new Error('bloque ' + need + (s ? ' casi vacio (' + s.len + ')' : ' ausente')); }
      if (secs.find(x => x.id === 'legacy' && x.len > 300)) throw new Error('la ruta legacy pinta contenido: el producto no esta en el terminal 3.0');
      if (!(await page.$('#pt-hist svg'))) throw new Error('el historico no dibuja la grafica');
      if ((await page.locator('#pt-compare .pt-ident').count()) < 1) throw new Error('la comparacion no muestra la identidad del instrumento');
      if (st.bytes > 1000 * 1024) throw new Error('payload ' + Math.round(st.bytes / 1024) + ' KB > 1 MB crudo');
      const t = await txt(page, '#pt-compare'); if (/undefined|NaN/.test(t || '')) throw new Error('la comparacion muestra undefined/NaN');
    });
  }
}

// ---------------------------------------------------------------- 2) comparador: cada producto
if (want('compare')) {
  const ids = Object.keys((await J('product-compare.json')).products);
  for (const id of pick(ids, ['trigo', 'leche'])) await run('comparador ' + id, 1280, async (page) => {
    await page.goto(BASE + '/comparador.html?p=' + id, { waitUntil: 'load' }); await page.waitForSelector('#cmp-body table, #cmp-body svg', { timeout: 10000 });
    const t = await txt(page, '#cmp-body'); if (!t || t.length < 200) throw new Error('comparador casi vacio para ' + id);
    if (/undefined|NaN/.test(t)) throw new Error('undefined/NaN en el comparador de ' + id);
    if (!/p=/.test(page.url()) || !page.url().includes(id)) throw new Error('el producto no queda en la URL');
    if ((await page.locator('#cmp-body .pt-ident, #cmp-body .cmp-ident, #cmp-body [data-iid]').count()) < 1) throw new Error('el comparador no muestra la identidad de los instrumentos');
  });
}

// ---------------------------------------------------------------- 3) watchlist: cada tipo de regla
if (want('watchlist')) {
  const RULES = [{ t: 'cross', v: 1, d: 'above' }, { t: 'cross', v: 1e8, d: 'below' }, { t: 'pct', v: 0.01 }, { t: 'pct', v: 0.01, d: 'up' }, { t: 'pct', v: 0.01, d: 'down' }, { t: 'new' }, { t: 'rev' }, { t: 'fresh', v: 'DELAYED' }, { t: 'fresh', v: 'STALE' }, { t: 'tw' }];
  const LABEL = { 'cross:above': /sube de/i, 'cross:below': /baja de/i, pct: /cambio de/i, pctUp: /solo subidas/i, pctDown: /solo bajadas/i, new: /nuevo dato/i, rev: /revisi[oó]n oficial/i, fDELAYED: /frescura:?\s*retras/i, fSTALE: /frescura:?\s*desactual/i, tw: /transmission watch/i };
  for (const w of FULL ? [1280, 390] : [1280]) await run('watchlist: 10 tipos de regla', w, async (page) => {
    const seed = [{ c: 'P', s: 'trigo/eu', r: RULES, seen: { p: '2000-01', v: 1 }, ack: '2000-01' }];
    await page.addInitScript((v) => { if (!localStorage.getItem('di-watchlist-v1')) localStorage.setItem('di-watchlist-v1', JSON.stringify(v)); }, seed);
    await page.goto(BASE + '/mi-seguimiento.html', { waitUntil: 'load' }); await page.waitForSelector('#ms-body #series .ms-item', { timeout: 10000 });
    await page.waitForSelector('#alertas .ms-alert', { timeout: 10000 });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('di-watchlist-v1'))[0].r.map(r => r.t + (r.d ? ':' + r.d : '') + (r.t === 'fresh' ? ':' + r.v : '')));
    if (saved.length !== RULES.length) throw new Error('el saneado descarta reglas validas: ' + saved.join(','));
    const series = await txt(page, '#series') || '';
    for (const [k, rx] of Object.entries(LABEL)) if (!rx.test(series)) throw new Error('la regla ' + k + ' no se muestra en la lista');
    const alerts = await txt(page, '#alertas') || '';
    if (!/trigo|wheat|blé|frumento/i.test(alerts)) throw new Error('no hay alertas del item sembrado');
    if (/undefined|NaN/.test(series + alerts)) throw new Error('undefined/NaN en la lista de seguimiento');
  });
}

// ---------------------------------------------------------------- 4) calculadora: monedas x unidades (mismos importes => mismo resultado)
if (want('calc')) {
  const CURS = ['EUR', 'USD', 'CAD', 'GBP'], BU = 27.2155, HA_AC = 0.40468564224;   // kg/bushel de trigo; hectareas por acre
  // 100 ha, 5 t/ha, 200 /t  ==  247.105 ac, 74.35 bu/ac, 5.4431 /bu
  const COMBOS = [];
  for (const cur of CURS) for (const areaU of ['ha', 'ac']) for (const yU of ['t_ha', 'bu_ac']) for (const pUnit of ['t', 'bu']) COMBOS.push({ cur, areaU, yU, pUnit });
  const sel = FULL ? COMBOS : COMBOS.filter(c => (c.areaU === 'ha' && c.yU === 't_ha' && c.pUnit === 't') || (c.areaU === 'ac' && c.yU === 'bu_ac' && c.pUnit === 'bu'));
  await run('calculadora: ' + sel.length + ' combinaciones moneda/unidad', 1280, async (page) => {
    await page.goto(BASE + '/calculadora.html?crop=wheat', { waitUntil: 'load' }); await page.waitForSelector('#cc-body #cc-area', { timeout: 10000 });
    const crop = await page.evaluate(() => DICalc.state().cases[DICalc.state().cur].crop);
    let ref = null;
    for (const c of sel) {
      await page.selectOption('#cc-cur', c.cur);
      for (const [seg, v] of [['areaU', c.areaU], ['yU', c.yU], ['pUnit', c.pUnit]]) { await page.click('[data-seg="' + seg + '"][data-v="' + v + '"]'); }
      const kg = await page.evaluate(() => { const c = DICalc.state().cases[DICalc.state().cur]; const r = DICalc.calc(c); return r && r.k ? r.k.kgBu : null; }); if (!kg) throw new Error('el cultivo ' + crop + ' no tiene kg/bushel');
      const area = c.areaU === 'ha' ? 100 : 100 / HA_AC, y = c.yU === 't_ha' ? 5 : 5 * 1000 / kg * HA_AC, p = c.pUnit === 't' ? 200 : 200 * kg / 1000;
      await page.click('[data-seg="pSrc"][data-v="manual"]').catch(() => {});
      await page.fill('#cc-area', String(area)); await page.fill('#cc-y', String(y)); await page.fill('#cc-p', String(p)); await page.fill('#cc-c-seed', '0').catch(() => {});
      await page.waitForTimeout(60);
      const o = await page.evaluate(() => { const S = DICalc.state(), c = S.cases[S.cur]; const r = DICalc.calc(c); return { rev: r.rev, revHa: r.revHa, cur: c.cur, areaU: c.areaU, yU: c.yU, pUnit: c.pUnit }; });
      const tag = JSON.stringify(c);
      if (o.cur !== c.cur || o.areaU !== c.areaU || o.yU !== c.yU || o.pUnit !== c.pUnit) throw new Error('el estado no refleja la seleccion ' + tag + ' -> ' + JSON.stringify(o));
      if (typeof o.rev !== 'number' || !isFinite(o.rev)) throw new Error('ingresos no calculados ' + tag);
      if (ref === null) ref = o; else if (Math.abs(o.rev - ref.rev) / ref.rev > 0.002 || Math.abs(o.revHa - ref.revHa) / ref.revHa > 0.002) throw new Error('mismo caso en otra unidad da otro resultado ' + tag + ': ' + o.rev + ' vs ' + ref.rev);
      const shown = await txt(page, '#cc-results') || ''; const sym = { EUR: '€', USD: 'USD', CAD: 'CAD', GBP: 'GBP' }[c.cur];
      if (!shown.includes(sym)) throw new Error('el resultado no muestra la moneda ' + c.cur + ' ' + tag);
      if (/undefined|NaN|Infinity/.test(shown)) throw new Error('undefined/NaN en resultados ' + tag);
    }
    if (Math.abs(ref.rev - 100000) > 100) throw new Error('100 ha x 5 t/ha x 200 = 100.000, sale ' + ref.rev);
  });
}

// ---------------------------------------------------------------- 5) estados de frescura en la interfaz
if (want('fresh')) {
  const STATES = ['LIVE', 'FRESH', 'EXPECTED_DELAY', 'DELAYED', 'STALE', 'HISTORICAL'];
  await run('catalogo: 6 estados de frescura', 1280, async (page) => {
    await page.goto(BASE + '/catalogo.html', { waitUntil: 'load' }); await page.waitForSelector('#ct-f', { timeout: 10000 });
    const labels = await page.evaluate(() => Object.fromEntries(['LIVE', 'FRESH', 'EXPECTED_DELAY', 'DELAYED', 'STALE', 'HISTORICAL'].map(s => [s, DIFreshness.label[s].es])));
    for (const s of STATES) {
      await page.selectOption('#ct-f', s); await page.waitForFunction(() => !/Cargando/.test(document.getElementById('ct-list').innerText), null, { timeout: 8000 }); await page.waitForTimeout(150);
      const rows = await page.$$eval('#ct-list tr[data-i]', e => e.length); if (!rows) throw new Error('ningun resultado para ' + s + ' (el catalogo real tiene series en ese estado)');
      const bad = await page.$$eval('#ct-list tr[data-i] .pt-badge', (e, l) => e.filter(x => x.textContent.trim() !== l).length, labels[s]); if (bad) throw new Error(bad + ' filas con una etiqueta distinta de ' + labels[s]);
      const cls = await page.$$eval('#ct-list tr[data-i] .pt-badge', (e, s) => e.filter(x => !x.classList.contains('pt-fs-' + s)).length, s); if (cls) throw new Error('clase CSS pt-fs-' + s + ' ausente en ' + cls + ' filas');
    }
    await page.selectOption('#ct-f', 'active'); await page.waitForTimeout(300);
    const hist = await page.$$eval('#ct-list .pt-fs-HISTORICAL, #ct-list .pt-fs-DISCONTINUED', e => e.length); if (hist) throw new Error('"Activas" incluye series historicas');
  });
  await run('observatorio: estados de frescura del catalogo', 1280, async (page) => {
    await page.goto(BASE + '/observatorio.html#freshness', { waitUntil: 'load' }); await page.waitForSelector('#freshness .pt-bars', { timeout: 10000 });
    const by = await page.evaluate(() => DIObservatory.state().doc.freshness.catalog.byState);
    const shown = await page.$$eval('#freshness .pt-badge', e => e.map(x => x.textContent.trim()));
    for (const s of Object.keys(by).filter(k => by[k] > 0)) { const l = await page.evaluate(s => DIFreshness && DIFreshness.label[s] ? DIFreshness.label[s].es : null, s).catch(() => null); if (l && !shown.includes(l)) throw new Error('el estado ' + s + ' (' + by[s] + ' series) no aparece en el panel'); }
    if (!('HISTORICAL' in by) || !('STALE' in by)) throw new Error('el catalogo del observatorio no distingue STALE de HISTORICAL');
  });
}

// ---------------------------------------------------------------- 6) Observatorio: paginacion + filtros sobre todo el conjunto
if (want('obs')) {
  for (const w of [390, 1280]) await run('observatorio: 20 iniciales, mostrar mas y filtros', w, async (page) => {
    await page.goto(BASE + '/observatorio.html', { waitUntil: 'load' }); await page.waitForSelector('#new tbody tr', { timeout: 10000 });
    const st = await page.evaluate(() => { const d = DIObservatory.state().doc.observations; return { n: d.length, newN: d.filter(o => o.isNew).length }; });
    const rows = id => page.locator('#' + id + ' tbody tr').count();
    if (await rows('new') !== Math.min(20, st.newN)) throw new Error('nuevas: ' + await rows('new') + ' filas, esperadas ' + Math.min(20, st.newN));
    if (st.newN > 20) { await page.click('#new [data-more="new"]'); if (await rows('new') !== Math.min(40, st.newN)) throw new Error('"Mostrar 20 mas" no anade 20'); }
    const region = await page.evaluate(() => DIObservatory.state().doc.observations[0].region);
    const expect = await page.evaluate(r => DIObservatory.state().doc.observations.filter(o => o.region === r && o.isNew).length, region);
    await page.click('button[data-f="c"][data-v="' + region + '"]'); await page.waitForTimeout(200);
    if (await rows('new') !== Math.min(20, expect)) throw new Error('el filtro no se aplica a TODO el conjunto: ' + await rows('new') + ' filas, esperadas ' + Math.min(20, expect));
    const h = await page.evaluate(() => document.documentElement.scrollHeight); if (w === 390 && h > 30000) throw new Error('pagina movil de ' + h + ' px');
  });
}

await browser.close();
console.log('\nE2E variantes (' + (FULL ? 'full' : 'smoke') + '): ' + ran + ' casos, ' + fails.length + ' fallos');
process.exit(fails.length ? 1 : 0);
