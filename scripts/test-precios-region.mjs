#!/usr/bin/env node
// Precios (precios.html): lo que se ve es coherente con el mercado elegido y con el idioma.
//  - Relaciones observadas y alertas: solo las del mercado elegido (UE → UE, Reino Unido → UK, EE. UU./Canadá → ninguna, con aviso).
//  - «Intelligence Engine 2.0» (índices de Eurostat): solo en el mercado UE.
//  - Ninguna frase en español cuando la página está en otro idioma (bloque de inteligencia).
// 4 idiomas × 4 mercados. Uso: node scripts/test-precios-region.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const ES = /Señales calculadas|Cargando observaciones|Último periodo|Pendiente|Confianza|Coste de insumos|Inteligencia basada|supera el umbral|presenta una asociación|Sin relación estadística/;
for (const lang of ['es', 'en', 'fr', 'it']) for (const loc of ['us', 'eu', 'uk', 'ca']) {
  const tag = lang + '/' + loc;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(([l, x]) => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); localStorage.setItem('dehesaIndexLocation', x); } catch (e) {} }, [lang, loc]);
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(BASE + '/precios.html', { waitUntil: 'networkidle' });
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } });
  await page.waitForFunction(() => document.querySelector('#pr-intel .di-relationships'), null, { timeout: 15000 }).catch(() => {});
  const r = await page.evaluate(() => ({ rel: Array.from(document.querySelectorAll('#pr-intel .di-rel-series')).filter(n => !/^(Shock|Choc)/.test(n.innerText)).map(n => n.innerText.replace(/\s+/g, ' ').trim()), eng: document.querySelectorAll('#pr-intel .di-intel-engine-card').length, txt: (document.getElementById('pr-intel') || { innerText: '' }).innerText }));
  const want = { eu: 'EU', uk: 'UK' }[loc];
  ok(tag + ': relaciones solo del mercado elegido', want ? r.rel.length > 0 && r.rel.every(x => new RegExp(want + '\\b.*→.*' + want + '\\s*$').test(x)) : r.rel.length === 0);
  ok(tag + ': Engine 2.0 solo en la UE', loc === 'eu' ? r.eng === 4 : r.eng === 0);
  if (lang !== 'es') ok(tag + ': sin frases en español', !ES.test(r.txt));
  ok(tag + ': sin errores de página', errs.length === 0);
  await ctx.close();
}
await browser.close();
console.log(fail ? 'FALLAN ' + fail : 'test-precios-region: todo correcto');
process.exit(fail ? 1 : 0);
