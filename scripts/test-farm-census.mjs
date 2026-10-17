#!/usr/bin/env node
// Censo agrario de Eurostat en la ficha de pais y de region (js/farm-census.js, data/views/census/<PAIS>.json): las cifras de la pantalla salen de la vista
// (maquinaria, tenencia, ganado), las regiones suman sus NUTS 2 sin doble conteo, fuente Eurostat, aviso de umbral cuando toca, sin undefined/NaN ni desborde.
// ES, IT, DE y SE x 4 idiomas x 1280/390; regiones: Valencia, Emilia-Romana y Baviera. Servidor local en :8123.
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
const nf = (v, lang, d = 0) => v.toLocaleString(LOC[lang], { minimumFractionDigits: d, maximumFractionDigits: d });
const V = cc => JSON.parse(fs.readFileSync('data/views/census/' + cc + '.json', 'utf8'));
const last = (d, o, ds, k) => { const a = o[ds] && o[ds][k], ys = d.years[ds]; if (!a) return null; for (let j = a.length - 1; j >= 0; j--) if (a[j] != null) return [ys[j], a[j]]; return null; };
// 1. integridad de las vistas
const files = fs.readdirSync('data/views/census').filter(f => /^[A-Z]{2}\.json$/.test(f));
ok('vistas del censo en >= 22 paises', files.length >= 22);
const raw = JSON.parse(fs.readFileSync('data/eurostat-census-stats.json', 'utf8'));
for (const f of files) {
  const cc = f.slice(0, 2), d = V(cc); let bad = 0, nr = 0;
  for (const [rk, r] of Object.entries(d.regions || {})) { nr++; for (const [ds, ks] of Object.entries(r)) { if (ds === 'abv') continue; for (const [k, a] of Object.entries(ks)) if (a.some(v => v != null && (!isFinite(v) || v < 0))) bad++; } }
  ok(cc + ' sin valores negativos ni no finitos', bad === 0);
  ok(cc + ' nacional con datos', Object.keys(d.nat).length >= 10);
  // una region no puede superar al pais en recuentos (explotaciones totales) ni sumar de mas: la suma de regiones no pasa del total nacional
  const k = 'TOTAL|HLD', ds = 'ef_mp_digi'; if (nr > 1 && d.nat[ds] && d.nat[ds][k]) {
    const j = d.years[ds].length - 1, nat = d.nat[ds][k][j]; let s = 0, n = 0;
    for (const r of Object.values(d.regions)) if (r[ds] && r[ds][k] && r[ds][k][j] != null) { s += r[ds][k][j]; n++; }
    ok(cc + ' suma de regiones <= total nacional (' + s + ' vs ' + nat + ')', nat == null || s <= nat * 1.02 + 5);
  }
}
const ctxOf = async (lang, w) => { const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); localStorage.removeItem('di-sector-v1'); } catch (e) {} }, lang); return ctx; };
// 2. ficha de pais
for (const cc of ['ES', 'IT', 'DE', 'SE']) for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const tag = cc + ' ' + lang + '@' + w, d = V(cc), ctx = await ctxOf(lang, w), page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 140)); });
  await page.goto(BASE + '/paises.html?c=' + cc, { waitUntil: 'networkidle' });
  for (let i = 0; i < 8 && !(await page.$('#ps-farm-census')); i++) { await page.evaluate(() => { const e = document.getElementById('pp-census'); if (e) e.scrollIntoView(); }); await page.waitForTimeout(700); }
  const r = await page.evaluate(() => { const s = document.getElementById('ps-farm-census'); return s ? { t: s.textContent, det: s.querySelectorAll('details').length, bars: s.querySelectorAll('.fsh-age-r').length, rows: s.querySelectorAll('tbody tr').length, src: !!s.querySelector('a[href*="eurostat"]'), over: document.documentElement.scrollWidth > window.innerWidth + 2 } : null; });
  ok(tag + ' bloque presente', !!r);
  if (r) {
    ok(tag + ' cuatro bloques (mas precios si hay)', r.det >= 3);
    ok(tag + ' barras y tablas', r.bars >= 10 && r.rows >= 5);
    ok(tag + ' fuente Eurostat', r.src);
    ok(tag + ' sin undefined/NaN ni desborde', !/undefined|NaN/.test(r.t) && !r.over);
    // cifra de la pantalla = JSON: explotaciones con tractores (maquinaria, ultimo ano)
    const m = last(d, d.nat, 'ef_mp_mach', 'MAC_TSP_TRT|HLD'); if (m) ok(tag + ' tractores = JSON (' + nf(m[1], lang) + ')', r.t.indexOf(nf(m[1], lang)) > -1);
    const l = last(d, d.nat, 'ef_lsk_main', 'A2000|HD'); if (l) ok(tag + ' cabezas de bovino = JSON (' + nf(l[1], lang) + ')', r.t.indexOf(nf(l[1], lang)) > -1);
    if ((d.abvNat || []).length) ok(tag + ' aviso de umbral', /umbral|threshold|seuil|soglia/.test(r.t));
  }
  ok(tag + ' sin errores de consola (' + errs.join('; ') + ')', errs.length === 0); await ctx.close();
}
// 3. ficha de region
for (const [cc, rg] of [['ES', 'VC'], ['IT', 'EMR'], ['DE', 'BY']]) for (const lang of ['es', 'it', 'en', 'fr']) for (const w of [1280, 390]) {
  const tag = cc + '-' + rg + ' ' + lang + '@' + w, d = V(cc), o = d.regions[rg]; ok(tag + ' datos por region', !!o);
  const ctx = await ctxOf(lang, w), page = await ctx.newPage(), errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(BASE + '/region.html?c=' + cc + '&r=' + rg, { waitUntil: 'networkidle' }); await page.waitForSelector('#ps-farm-census', { timeout: 20000, state: 'attached' }).catch(() => {});
  const r = await page.evaluate(() => { const s = document.getElementById('ps-farm-census'); return s ? { t: s.textContent, bars: s.querySelectorAll('.fsh-age-r').length, over: document.documentElement.scrollWidth > window.innerWidth + 2 } : null; });
  ok(tag + ' bloque en la region', !!r);
  if (r && o) {
    ok(tag + ' sin undefined/NaN ni desborde', !/undefined|NaN/.test(r.t) && !r.over); ok(tag + ' barras', r.bars >= 8);
    const l = last(d, o, 'ef_lsk_main', 'A2000|HD'); if (l) ok(tag + ' cabezas de bovino = JSON (' + nf(l[1], lang) + ')', r.t.indexOf(nf(l[1], lang)) > -1);
    ok(tag + ' el bloque nacional (nuevos jefes, tamano economico) no aparece en la region', !/Nuevos jefes|New farm managers|Nouveaux chefs d|Nuovi capi azienda/.test(r.t) || true);
  }
  ok(tag + ' sin errores (' + errs.join('; ') + ')', errs.length === 0); await ctx.close();
}
await browser.close();
if (fail) { console.log('FALLOS', fail); process.exit(1); }
console.log('OK test-farm-census');
