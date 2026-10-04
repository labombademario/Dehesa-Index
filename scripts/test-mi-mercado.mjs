#!/usr/bin/env node
// «Mi mercado» (mi-mercado.html) con navegador real (servidor local en :8123): las cifras de cada tarjeta son las de los JSON (ganado/heno/granos de USDA AMS, seguro de USDA RMA,
// sequía del US Drought Monitor, cultivos del MAPA), lo que no hay se dice y no se inventa, la elección se guarda (URL + localStorage) y se puede borrar, fuentes citadas,
// sin undefined/NaN ni desbordes a 390 px, en los 4 idiomas.
// Uso: node scripts/test-mi-mercado.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const cattle = J('data/us-local/cattle-KS.json'), hay = J('data/us-local/hay-KS.json'), ins = J('data/crop-insurance.json'), dr = J('data/drought.json');
const corn = J('data/us-cash-bids/KS/corn.json'), man = J('data/us-cash-bids/manifest.json'), status = J('data/us-local/status.json');
const es = J('data/spain-crops/crops-cereales.json');
const hogs = J('data/mb-markets/hogs.json'), hk = Object.keys(hogs.weeks).sort(), hl = hogs.weeks[hk[hk.length - 1]];
const nrm = s => s.replace(/[., \s\u00a0\u202f]/g, '');
const f = (v, d) => v.toFixed(d);
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };

// valores esperados
const st = cattle.history['Steers|500'], last = st[st.length - 1];
const L = ins.latestCompleteYear, ia = ins.states.KS[String(L)], ratio = ia[3] / ia[1], natR = ins.national[String(L)][3] / ins.national[String(L)][1];
const dRows = dr.states.KS, dLast = dRows[dRows.length - 1];
const hayRows = hay.latest.rows.filter(r => r[3] === 'Per Ton').sort((a, b) => (b[11] || 0) - (a[11] || 0));
const cs = corn.series.filter(s => ['LIVE', 'FRESH', 'EXPECTED_DELAY', 'DELAYED'].includes(s.freshness));
const vc = es.campaigns['2024'].crops.find(c => c.c === 'CE0000'), v47 = vc.v['47'];
const rank = Object.keys(vc.v).map(p => vc.v[p][0]).filter(x => x > 0).sort((a, b) => b - a).indexOf(v47[0]) + 1;
const cattleStates = status.reports.filter(r => r.kind === 'cattle' && r.latest).length;

for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { if (!localStorage.getItem('dehesaIndexLang')) localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  const body = async () => await page.evaluate(() => document.getElementById('mm-body').innerText);
  const sec = async id => await page.evaluate(i => { const n = document.querySelector('[data-mm-body="' + i + '"]'); return n ? n.innerText : ''; }, id);
  const ready = async id => page.waitForFunction(i => { const n = document.querySelector('[data-mm-body="' + i + '"]'); return n && !/…$/.test(n.innerText.trim()) && n.innerText.length > 30; }, id, { timeout: 12000 });

  // vacío: sin elección no hay datos y se ofrecen ejemplos
  await page.goto(BASE + '/mi-mercado.html', { waitUntil: 'networkidle' }); await page.waitForSelector('#mm-body [data-mm="c"]');
  ok(tag + ': sin elección no hay tarjetas', (await page.$$('[data-mm-sec]')).length === 0 && (await page.$$('[data-mm-ex]')).length === 7);

  // Kansas · ganado (por URL)
  await page.goto(BASE + '/mi-mercado.html?c=US&r=KS&p=cattle', { waitUntil: 'networkidle' }); await ready('price'); await ready('ins'); await ready('dr');
  let t = await sec('price');
  ok(tag + ': precio novillos 500-550 = JSON', nrm(t).includes(nrm(f(last[1], 2))));
  ok(tag + ': cabezas y fecha', nrm(t).includes(String(last[2])) && t.length > 100);
  const prev = st[st.length - 2], chg = (last[1] / prev[1] - 1) * 100;
  ok(tag + ': cambio semanal = JSON', nrm(t).includes(nrm(Math.abs(chg).toFixed(1))));
  ok(tag + ': fuente AMS citada', /USDA AMS/.test(await page.evaluate(() => document.querySelector('[data-mm-body="price"]').parentNode.innerHTML.replace(/<[^>]+>/g, ' '))));
  ok(tag + ': gráfico de la serie', (await page.$$('[data-mm-body="price"] svg')).length >= 1);
  t = await sec('ins');
  ok(tag + ': indemnizaciones ' + L + ' = JSON', nrm(t).includes(nrm(f(ia[3] / 1e6, ia[3] / 1e6 >= 1000 ? 0 : 1))));
  ok(tag + ': ratio indemnización/prima = JSON y total EE. UU.', nrm(t).includes(nrm(f(ratio, 2))) && nrm(t).includes(nrm(f(natR, 2))));
  ok(tag + ': años provisionales marcados', ins.cropYears.some(y => y > L) && /\b2026\b/.test(t) && /(provisional|provisoire|provvisorio)/i.test(t));
  t = await sec('dr');
  ok(tag + ': sequía D1+ = JSON', nrm(t).includes(nrm(f(dLast[2], 1))) && nrm(t).includes(nrm(f(dLast[3], 1))));
  ok(tag + ': sequía fecha de la semana', t.length > 100 && (await page.evaluate(() => document.querySelector('[data-mm-body="dr"]').parentNode.innerHTML)).includes('us_drought_monitor'));
  ok(tag + ': seguro cita USDA RMA', (await page.evaluate(() => document.querySelector('[data-mm-body="ins"]').parentNode.innerHTML)).includes('usda_rma'));
  ok(tag + ': lista de lo que falta con ' + cattleStates + ' estados de ganado', nrm(await sec('missing')).includes(String(cattleStates)) && (await sec('missing')).length > 150);
  ok(tag + ': sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(await body()));
  ok(tag + ': URL conserva la elección', /c=US/.test(page.url()) && /r=KS/.test(page.url()) && /p=cattle/.test(page.url()));
  if (w === 390) ok(tag + ': sin desborde horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));

  // cambiar de banda de peso cambia la cifra
  const wbs = await page.$$eval('[data-mm-wb] option', os => os.map(o => o.value));
  if (wbs.includes('700')) { await page.selectOption('[data-mm-wb]', '700'); await page.waitForTimeout(200); const s7 = cattle.history['Steers|700'], l7 = s7[s7.length - 1]; ok(tag + ': banda 700 = JSON', nrm(await sec('price')).includes(nrm(f(l7[1], 2)))); }

  // heno
  await page.selectOption('[data-mm="p"]', 'hay'); await ready('price'); t = await sec('price');
  ok(tag + ': heno: la fila de más cantidad = JSON', nrm(t).includes(nrm(f(hayRows[0][14], 2))) && nrm(t).includes(String(hayRows[0][11])));
  // maíz: ofertas al contado
  await page.selectOption('[data-mm="p"]', 'corn'); await ready('price'); t = await sec('price');
  ok(tag + ': maíz: ofertas = JSON y se rotula región/terminal', cs.every(s => nrm(t).includes(nrm(f(s.avg, 2)))) && /(region|región|région|regione)/i.test(t) && /terminal/i.test(t));
  ok(tag + ': maíz: basis publicado', cs.some(s => s.bLo != null && nrm(t).includes(String(Math.abs(s.bLo)))));
  // estado sin dato: se dice y no se inventa
  await page.selectOption('[data-mm="r"]', 'AL'); await page.selectOption('[data-mm="p"]', 'wheat'); await ready('price'); t = await sec('price');
  ok(tag + ': trigo en Alabama: sin cifras, lista de estados con dato', (await page.$$('[data-mm-body="price"] .de-tile')).length === 0 && (await page.$$('[data-mm-body="price"] a[data-mm-go]')).length >= 5);
  await page.selectOption('[data-mm="p"]', 'cattle'); await ready('price');
  ok(tag + ': ganado en Alabama: sin cifras y con {n} estados', (await page.$$('[data-mm-body="price"] .de-tile')).length === 0 && (await page.$$('[data-mm-body="price"] a[data-mm-go]')).length === cattleStates);
  ok(tag + ': seguro y sequía de Alabama sí están', (await page.$$('[data-mm-body="ins"] .de-tile')).length >= 3 && (await page.$$('[data-mm-body="dr"] .de-tile')).length === 3);
  // los enlaces de estados con dato cambian de estado
  await page.click('[data-mm-body="price"] a[data-mm-go="KS"]'); await ready('price');
  ok(tag + ': enlace a un estado con dato lo selecciona', (await page.$$('[data-mm-body="price"] .de-tile')).length >= 4 && /r=KS/.test(page.url()));

  // persistencia: sin parámetros se recupera lo guardado; borrar lo limpia
  await page.goto(BASE + '/mi-mercado.html', { waitUntil: 'networkidle' }); await ready('price');
  ok(tag + ': la elección se recuerda sin parámetros', (await page.$eval('[data-mm="r"]', n => n.value)) === 'KS' && (await page.$eval('[data-mm="p"]', n => n.value)) === 'cattle');
  await page.click('[data-mm-reset]'); await page.waitForSelector('[data-mm-ex]');
  ok(tag + ': borrar mi elección', (await page.evaluate(() => localStorage.getItem('di-mi-mercado-v1'))) === null || /"c":""/.test(await page.evaluate(() => localStorage.getItem('di-mi-mercado-v1'))));

  // España: Valladolid · cereales
  await page.goto(BASE + '/mi-mercado.html?c=ES&r=47&p=cereales&k=CE0000', { waitUntil: 'networkidle' }); await ready('crop'); t = await sec('crop');
  ok(tag + ': ES superficie total de Valladolid = JSON', nrm(t).includes(String(v47[0])));
  ok(tag + ': ES puesto ' + rank + ' entre provincias', new RegExp('\\b' + rank + '\\b').test(t.split('\n').find(l => /50/.test(l) && new RegExp('\\b' + rank + '\\b').test(l)) || ''));
  ok(tag + ': ES rendimiento = producción ÷ cosechada', nrm(t).includes(nrm(f(v47[4] / v47[3], 2))));
  ok(tag + ': ES media de España = JSON', nrm(t).includes(nrm(f(vc.t[4] / vc.t[3], 2))));
  ok(tag + ': ES datos provisionales y fuente MAPA', /(provisional|provisoire|provvisori)/i.test(t) && (await page.evaluate(() => document.querySelector('[data-mm-body="crop"]').parentNode.innerHTML)).includes('mapa_es'));
  ok(tag + ': ES lista de lo que falta (5 puntos)', (await page.$$('[data-mm-body="missing"] li')).length === 5);
  ok(tag + ': ES no inventa seguro ni precio provincial', (await page.$$('[data-mm-body="ins"], [data-mm-body="dr"], [data-mm-body="price"]')).length === 0);
  await page.selectOption('[data-mm="k"]', 'CE1100'); await page.waitForTimeout(300);
  const wh = es.campaigns['2024'].crops.find(c => c.c === 'CE1100').v['47'];
  ok(tag + ': ES cambiar de cultivo (trigo) = JSON', nrm(await sec('crop')).includes(String(wh[0])));
  await page.selectOption('[data-mm="p"]', 'hortalizas'); await page.waitForFunction(() => /2025/.test((document.querySelector('[data-mm-body="crop"]') || {}).innerText || ''), null, { timeout: 12000 }).catch(() => {});
  ok(tag + ': ES grupo con campaña 2025 la usa', /2025/.test(await sec('crop')));
  ok(tag + ': ES sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(await body()));
  if (w === 390) ok(tag + ': ES sin desborde horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  // Canadá: Manitoba · porcino (precio local), Ontario (sin precio local, se dice), Alberta · cebada
  await page.goto(BASE + '/mi-mercado.html?c=CA&r=MB&p=hogs', { waitUntil: 'networkidle' }); await ready('price'); t = await sec('price');
  ok(tag + ': CA porcino MB: precio todo incluido = JSON', nrm(t).includes(nrm(f(hl[0], 2))) && nrm(t).includes(hk[hk.length - 1]));
  ok(tag + ': CA porcino MB: fuente Manitoba Agriculture', (await page.evaluate(() => document.querySelector('[data-mm-body="price"]').parentNode.innerHTML)).includes('mb_agri'));
  ok(tag + ': CA seguro y sequía de provincia', (await page.$$('[data-mm-body="ins"] .de-tile')).length >= 3 && (await page.$$('[data-mm-body="dr"] .de-tile')).length === 3);
  await page.goto(BASE + '/mi-mercado.html?c=CA&r=MB&p=sheep', { waitUntil: 'networkidle' }); await ready('price'); t = await sec('price');
  ok(tag + ': CA ovino MB: hay cifras y gráfico', /\d/.test(t) && (await page.$$('[data-mm-body="price"] svg')).length >= 1);
  await page.goto(BASE + '/mi-mercado.html?c=CA&r=ON&p=cattle', { waitUntil: 'networkidle' }); await ready('price');
  ok(tag + ': CA Ontario: sin precio local (sin tarjetas de precio)', (await page.$$('[data-mm-body="price"] .de-tile')).length === 0);
  await page.goto(BASE + '/mi-mercado.html?c=CA&r=AB&p=barley', { waitUntil: 'networkidle' }); await ready('price'); t = await sec('price');
  ok(tag + ': CA cebada AB: precio semanal', /\d{3}[.,]\d{2}/.test(t) && (await page.$$('[data-mm-body="price"] .de-tile')).length >= 3);
  ok(tag + ': CA sin undefined/NaN', !/undefined|NaN|\[object|Infinity/.test(await body()));
  if (w === 390) ok(tag + ': CA sin desborde horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  ok(tag + ': sin errores de consola' + (errs.length ? ' ' + errs.join(' | ') : ''), errs.length === 0);
  // idioma: los títulos cambian
  const h1 = await page.$eval('#mm-h1', n => n.textContent);
  ok(tag + ': título en el idioma', { es: /Mi mercado/, en: /My market/, fr: /Mon marché/, it: /Il mio mercato/ }[lang].test(h1));
  await ctx.close();
}
await browser.close();
console.log(fail ? 'FALLAN ' + fail : 'test-mi-mercado: todo correcto');
process.exit(fail ? 1 : 0);
