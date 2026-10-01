#!/usr/bin/env node
// E2E con navegador real (Playwright, escritorio 1280 y movil 390) + axe-core.
// Falla ante: errores de consola o de pagina del propio sitio, promesas rechazadas sin capturar, 4xx/5xx del propio origen,
// JSON invalido o vacio, componentes criticos vacios, enlaces internos rotos del menu y violaciones de accesibilidad serias.
// Uso: node scripts/e2e.mjs [--base http://localhost:8123] [--only index,precios] [--no-axe] [--json out.json]
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123'), ONLY = (arg('--only', '') || '').split(',').filter(Boolean), AXE = !process.argv.includes('--no-axe'), OUT = arg('--json', null);
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
let axeSrc = null;
if (AXE) {
  for (const p of [path.join(root, 'node_modules/axe-core/axe.min.js'), process.env.AXE_CORE, execSync('npm root -g').toString().trim() + '/axe-core/axe.min.js'].filter(Boolean)) {
    try { axeSrc = await readFile(p, 'utf8'); break; } catch (e) {}
  }
  if (!axeSrc) { console.error('axe-core no encontrado (npm i axe-core o AXE_CORE=ruta)'); process.exit(2); }
}
// selector: componentes que NO pueden quedar vacios tras cargar. min: minimo de caracteres de texto.
const PAGES = [
  { n: 'index', url: '/', crit: ['#home-stats', '#home-dehesa-index', '#home-explora'] },
  { n: 'precios', url: '/precios.html', crit: ['#pr-ticker', '#pr-category'] },
  { n: 'producto', url: '/producto.html', crit: ['#pr-body'] },
  { n: 'paises', url: '/paises.html?c=ES', crit: ['#paises-body'] },
  { n: 'perfiles', url: '/perfiles.html', crit: ['#perfiles-body'] },
  { n: 'comparador', url: '/comparador.html', crit: ['#cmp-body'] },
  { n: 'calculadora', url: '/calculadora.html', crit: ['#cc-body'] },
  { n: 'relaciones', url: '/relaciones.html', crit: ['#rl-body .rl-card'] },
  { n: 'catalogo', url: '/catalogo.html', crit: ['#cat-body'] },
  { n: 'brief', url: '/brief.html', crit: ['#brief-body'] },
  { n: 'noticias', url: '/noticias.html', crit: ['#nw-items'] },
  { n: 'mapa', url: '/mapa.html', crit: ['#mapa-body'] },
  { n: 'calendario', url: '/calendario.html', crit: ['#cal-events'] },
  { n: 'cultivos', url: '/cultivos.html', crit: ['#cu-body'] },
  { n: 'oferta-demanda', url: '/oferta-demanda.html', crit: ['#od-body'] },
  { n: 'clima', url: '/clima.html', crit: ['#clima-body'] },
  { n: 'mercados', url: '/mercados.html', crit: ['#ms-body'] },
  { n: 'status', url: '/status.html', crit: [] },
  { n: 'metodologia', url: '/metodologia.html', crit: [] },
];
const VIEWPORTS = [{ k: 'desktop', w: 1280, h: 900 }, { k: 'mobile', w: 390, h: 800 }];
const AXE_FAIL = new Set(['critical', 'serious']);
// Reglas de axe aceptadas de forma explicita y documentada (no se esconden: se listan en el informe). Vacio = todo cuenta.
const AXE_ACCEPT = JSON.parse(await readFile(path.join(root, 'scripts/e2e-axe-accepted.json'), 'utf8').catch(() => '{}'));
const sameOrigin = u => { try { return new URL(u).origin === new URL(BASE).origin; } catch (e) { return false; } };
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
const fails = [], report = [], notes = [];
for (const vp of VIEWPORTS) for (const pg of PAGES) {
  if (ONLY.length && !ONLY.includes(pg.n)) continue;
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { try { localStorage.setItem('dehesaIndexLang', 'es'); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {}
    window.__rej = []; window.addEventListener('unhandledrejection', e => window.__rej.push(String(e.reason && e.reason.message || e.reason))); });
  const page = await ctx.newPage(); const tag = vp.k + ' ' + pg.url; const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::ERR_|Failed to load resource.*(tunnel|ERR_)/.test(m.text()) && sameOrigin(m.location().url || BASE)) errs.push('console: ' + m.text().slice(0, 160)); });
  page.on('response', async r => {
    if (!sameOrigin(r.url())) return;
    const u = new URL(r.url());
    if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + u.pathname);
    else if (/\.json$/.test(u.pathname)) { try { const t = await r.text(); if (!t.trim()) errs.push('JSON vacio ' + u.pathname); else JSON.parse(t); } catch (e) { errs.push('JSON invalido ' + u.pathname); } }
  });
  page.on('requestfailed', r => { if (sameOrigin(r.url()) && !/ERR_ABORTED/.test(r.failure() && r.failure().errorText || '')) errs.push('requestfailed ' + r.url()); });
  await page.goto(BASE + pg.url, { waitUntil: 'load' }).catch(e => errs.push('goto: ' + e.message));
  await page.waitForTimeout(3000);
  const rej = await page.evaluate(() => window.__rej || []).catch(() => []); rej.forEach(m => errs.push('unhandledrejection: ' + m));
  const empties = [];
  for (const s of pg.crit) {
    const info = await page.evaluate(s => { const e = document.querySelector(s); if (!e) return { missing: true }; return { len: (e.innerText || '').trim().length, kids: e.children.length }; }, s);
    if (info.missing) empties.push(s + ' (no existe)'); else if (info.len < 20 && info.kids === 0) empties.push(s + ' (vacio)');
  }
  const nav = await page.evaluate(() => ({ h1: document.querySelectorAll('h1').length, title: document.title, lang: document.documentElement.lang, overflow: document.documentElement.scrollWidth > window.innerWidth + 2, links: Array.from(document.querySelectorAll('header a[href], nav a[href]')).map(a => a.getAttribute('href')).filter(h => h && !/^(https?:|mailto:|#|javascript:)/.test(h)) }));
  if (nav.overflow) errs.push('desbordamiento horizontal (scrollWidth > viewport)');
  if (!nav.title) errs.push('sin <title>');
  if (nav.h1 < 1) errs.push('sin <h1>');
  let ax = [];
  if (AXE) {
    await page.addScriptTag({ content: axeSrc });
    const res = await page.evaluate(async () => { const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }); return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, sample: v.nodes[0] && v.nodes[0].target.join(' ').slice(0, 90) })); }).catch(e => [{ id: 'axe-error', impact: 'critical', n: 1, help: e.message }]);
    ax = res;
    const acc = (AXE_ACCEPT[pg.n] || []).concat(AXE_ACCEPT['*'] || []);
    res.filter(v => AXE_FAIL.has(v.impact) && !acc.includes(v.id)).forEach(v => errs.push('axe ' + v.impact + ' ' + v.id + ' x' + v.n + ' (' + v.sample + ')'));
    res.filter(v => !AXE_FAIL.has(v.impact) || acc.includes(v.id)).forEach(v => notes.push(tag + ' axe ' + v.impact + ' ' + v.id + ' x' + v.n + (acc.includes(v.id) ? ' [aceptada]' : '')));
  }
  empties.forEach(e => errs.push('componente critico ' + e));
  report.push({ tag, errors: errs, axe: ax.length });
  console.log((errs.length ? 'FAIL ' : 'ok   ') + tag.padEnd(34) + (errs.length ? errs.length + ' problema(s)' : 'axe ' + ax.length + ' avisos menores'));
  errs.slice(0, 8).forEach(e => console.log('       - ' + e));
  errs.forEach(e => fails.push(tag + ': ' + e));
  await ctx.close();
}
// Flujos de interaccion (humo): lo que un usuario hace de verdad.
async function flow(name, vpw, fn) {
  const ctx = await browser.newContext({ viewport: { width: vpw, height: 850 }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { try { localStorage.setItem('dehesaIndexLang', 'es'); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('response', r => { if (sameOrigin(r.url()) && r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + new URL(r.url()).pathname); });
  try { await fn(page, errs); } catch (e) { errs.push('flujo: ' + e.message.split('\n')[0]); }
  console.log((errs.length ? 'FAIL ' : 'ok   ') + ('flow ' + name + ' @' + vpw).padEnd(34));
  errs.forEach(e => { console.log('       - ' + e); fails.push('flow ' + name + ' @' + vpw + ': ' + e); });
  await ctx.close();
}
const textLen = async (page, s) => page.evaluate(s => { const e = document.querySelector(s); return e ? (e.innerText || '').trim().length : -1; }, s);
for (const w of [1280, 390]) {
  if (!ONLY.length || ONLY.includes('flows')) {
    await flow('home->precios->producto', w, async (page, errs) => {
      await page.goto(BASE + '/', { waitUntil: 'load' }); await page.waitForTimeout(1500);
      await page.goto(BASE + '/precios.html', { waitUntil: 'load' }); await page.waitForTimeout(2500);
      const link = await page.$('#pr-category a[href*="producto.html"], a[href*="producto.html?"]');
      if (!link) throw new Error('precios.html sin enlace a una ficha de producto');
      const href = await link.getAttribute('href'); await page.goto(BASE + '/' + href.replace(/^\//, ''), { waitUntil: 'load' }); await page.waitForTimeout(2500);
      if ((await textLen(page, '#pr-body')) < 100) throw new Error('la ficha de producto no pinta contenido: ' + href);
    });
    await flow('producto 3.0: bloques, unidad y seguimiento', w, async (page) => {
      const scrollAll = async () => { await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight + 1500; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); } }); await page.waitForTimeout(700); };
      await page.goto(BASE + '/producto.html?p=trigo', { waitUntil: 'load' }); await page.waitForSelector('#pt-head .pt-card', { timeout: 8000 });
      await scrollAll();
      for (const id of ['changed', 'compare', 'hist', 'sd', 'trade', 'tariffs', 'costs', 'drivers']) {
        if ((await textLen(page, '#pt-' + id + ' .pt-body')) < 30) throw new Error('bloque ' + id + ' vacio');
        if (await page.$('#pt-' + id + ' .pt-err')) throw new Error('bloque ' + id + ' con error de carga');
      }
      if (!(await page.$('#pt-hist svg'))) throw new Error('el historico no dibuja la grafica');
      await page.click('#pt-compare [data-u=usd]'); await page.waitForTimeout(300);
      if (!/USD\/t/.test(await page.innerText('#pt-compare tbody'))) throw new Error('la unidad USD/t no se aplica a la comparacion');
      if (!/u=usd/.test(page.url())) throw new Error('la unidad no queda en la URL');
      await page.click('#pt-hist [data-r="6m"]'); await page.waitForTimeout(300);
      if (!/r=6m/.test(page.url())) throw new Error('el periodo no queda en la URL');
      await page.click('[data-follow="1"]'); await page.waitForTimeout(700);
      if (!(await page.$('#pt-follow .di-wl-ed'))) throw new Error('seguir producto no abre los avisos');
      await page.goto(BASE + '/producto.html?p=diesel', { waitUntil: 'load' }); await page.waitForSelector('#pt-head .pt-card', { timeout: 8000 }); await scrollAll();
      await page.waitForSelector('#pt-rels table, #pt-rels .pt-note', { timeout: 8000 });
      if (!/no publica un balance|does not publish|ne publie pas|non pubblica/.test(await page.innerText('#pt-sd'))) throw new Error('diesel deberia declarar que no hay balance PSD');
      // el detalle pesado no se descarga sin pedirlo
      const heavy = await page.evaluate(() => performance.getEntriesByType('resource').filter(e => /\/data\/(ers|gats|nass-crops|supply-demand)\.json/.test(e.name)).length);
      if (heavy) throw new Error('la ficha descargo ficheros pesados sin pedirlos');
    });
    await flow('calculadora: margen y unidades', w, async (page) => {
      await page.goto(BASE + '/calculadora.html?crop=trigo', { waitUntil: 'load' }); await page.waitForSelector('#cc-area', { timeout: 8000 });
      await page.fill('#cc-area', '100'); await page.fill('#cc-y', '7'); await page.fill('#cc-p', '250');
      for (const [k, v] of [['fert', '180'], ['seed', '90'], ['prot', '110'], ['energy', '70'], ['mach', '150'], ['labour', '60'], ['rent', '200'], ['other', '40']]) await page.fill('#cc-c-' + k, v);
      await page.waitForTimeout(300);
      const tx = await page.innerText('#cc-results');
      // coste 900/ha, 90.000 en total, 128,57/t, ingresos 1.750/ha, margen 850/ha (48,6 %), equilibrio 3,60 t/ha
      for (const must of ['90.000', '128,57', '1750', '850,00', '48,6', '3,60']) if (!tx.includes(must)) throw new Error('resultado esperado no encontrado: ' + must + ' en ' + tx.replace(/\s+/g, ' ').slice(0, 200));
      await page.click('[data-seg=areaU][data-v=ac]'); await page.waitForTimeout(200);
      if (Math.abs(parseFloat(await page.inputValue('#cc-area')) - 247.1054) > 0.001) throw new Error('100 ha no son 247,1054 acres');
      await page.click('[data-seg=yU][data-v=bu_ac]'); await page.waitForTimeout(200);
      if (Math.abs(parseFloat(await page.inputValue('#cc-y')) - 104.0911) > 0.01) throw new Error('7 t/ha de trigo no son 104,09 bu/acre');
      if (!(await page.innerText('#cc-results')).includes('90.000')) throw new Error('cambiar de unidad cambia el coste total');
      await page.click('[data-seg=pSrc][data-v=dehesa]'); await page.waitForSelector('#cc-ref .pt-card', { timeout: 8000 });
      if (!/EN DIRECTO|AL DÍA|RETRASO|RETRASADO|DESACTUALIZADO/.test(await page.innerText('#cc-ref'))) throw new Error('el precio de Dehesa no muestra su frescura');
      if (!/Fuente:/.test(await page.innerText('#cc-ref'))) throw new Error('el precio de Dehesa no muestra la fuente');
    });
    await flow('relaciones: filtros, descargo y enlace profundo', w, async (page) => {
      await page.goto(BASE + '/relaciones.html', { waitUntil: 'load' }); await page.waitForSelector('#rl-body .rl-card', { timeout: 8000 });
      const all = await page.$$eval('.rl-card', (e) => e.length);
      const tx0 = await page.innerText('#rl-body');
      if (!/no predictivo|not predictive|pas prédictif|non predittivo/i.test(tx0)) throw new Error('falta el descargo descriptivo/no predictivo');
      if (!/OBSERVED RELATIONSHIP/.test(tx0)) throw new Error('falta el estado OBSERVED RELATIONSHIP');
      for (const must of ['INPUT', 'CHANNEL', 'MARKET'].map((k) => ({ INPUT: /INSUMO|INPUT|INTRANT/, CHANNEL: /CANAL|CHANNEL/, MARKET: /MERCADO|MARKET|MARCH/ }[k]))) if (!must.test(tx0)) throw new Error('falta el esquema INSUMO>CANAL>MERCADO');
      await page.click('[data-f=ch][data-v=fertilizer]'); await page.waitForTimeout(150);
      const fert = await page.$$eval('.rl-card', (e) => e.length);
      if (!(fert > 0 && fert < all)) throw new Error('el filtro de canal no filtra (' + fert + ' de ' + all + ')');
      if (!/ch=fertilizer/.test(page.url())) throw new Error('el filtro no queda en la URL');
      await page.reload({ waitUntil: 'load' }); await page.waitForSelector('#rl-body .rl-card', { timeout: 8000 });
      if ((await page.$$eval('.rl-card', (e) => e.length)) !== fert) throw new Error('el filtro no se conserva al recargar');
      await page.goto(BASE + '/relaciones.html?id=fertiliser_to_grain__urea-eu__trigo-eu', { waitUntil: 'load' }); await page.waitForSelector('#rl-body .rl-card', { timeout: 8000 });
      if ((await page.$$eval('.rl-card', (e) => e.length)) !== 1) throw new Error('el enlace profundo ?id= no abre una sola relacion');
      if (!(await page.$('.rl-hyp')) || !(await page.$('.rl-expl'))) throw new Error('la correlacion y la hipotesis deben mostrarse separadas');
    });
    await flow('paises: cambiar de pais', w, async (page, errs) => {
      await page.goto(BASE + '/paises.html?c=FR', { waitUntil: 'load' }); await page.waitForTimeout(2500);
      if ((await textLen(page, '#paises-body')) < 100) throw new Error('paises.html?c=FR vacio');
      await page.goto(BASE + '/paises.html?c=XX', { waitUntil: 'load' }); await page.waitForTimeout(1500);
      if ((await textLen(page, '#paises-body')) < 20) throw new Error('pais desconocido deja la pagina en blanco (debe mostrar estado vacio)');
    });
    await flow('comparador: producto y unidad', w, async (page) => {
      await page.goto(BASE + '/comparador.html', { waitUntil: 'load' }); await page.waitForTimeout(2500);
      const sel = await page.$$('#cmp-body select'); if (!sel.length) throw new Error('comparador sin selectores');
      if ((await textLen(page, '#cmp-body')) < 100) throw new Error('comparador sin contenido');
    });
    await flow('catalogo: buscar', w, async (page) => {
      await page.goto(BASE + '/catalogo.html', { waitUntil: 'load' }); await page.waitForTimeout(2500);
      const inp = await page.$('#cat-body input[type=search], #cat-body input[type=text], #cat-body input'); if (!inp) throw new Error('catalogo sin buscador');
      await inp.fill('trigo'); await page.waitForTimeout(600);
      if ((await textLen(page, '#cat-body')) < 50) throw new Error('catalogo se vacia al buscar');
    });
    await flow('idioma: en/fr/it', w, async (page) => {
      for (const l of ['en', 'fr', 'it']) {
        await page.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); } catch (e) {} }, l);
        await page.goto(BASE + '/precios.html', { waitUntil: 'load' }); await page.waitForTimeout(1800);
        const lang = await page.evaluate(() => document.documentElement.lang); if (lang !== l) throw new Error('lang=' + lang + ' esperado ' + l);
      }
    });
    await flow('offline.html y 404', w, async (page) => {
      const r = await page.goto(BASE + '/offline.html', { waitUntil: 'load' }); if (!r.ok()) throw new Error('offline.html ' + r.status());
    });
  }
}
await browser.close();
notes.length && console.log('\nAvisos de accesibilidad no bloqueantes (' + notes.length + '):\n  ' + notes.slice(0, 40).join('\n  '));
if (OUT) await writeFile(OUT, JSON.stringify({ base: BASE, at: new Date().toISOString(), report, notes }, null, 1));
if (fails.length) { console.error('\nE2E FALLA: ' + fails.length + ' problema(s)'); process.exit(1); }
console.log('\nE2E OK');
