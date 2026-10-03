#!/usr/bin/env node
// «PAC España» (pac.html) con navegador real (servidor local en :8123): los importes de las tablas y de la calculadora son los de data/cap/es/*.json (recalculados aquí
// de forma independiente), lo calculado se llama «estimación» y enseña su cuenta, se avisa de lo que no se sabe, la cita del BOE lleva su texto obligatorio (base de datos,
// carácter informativo, fecha de actualización), el seguimiento enseña los cambios pendientes sin esconderlos, la elección se guarda (URL + localStorage) y se borra,
// sin undefined/NaN ni desbordes a 390 px, en los 4 idiomas.
// Uso: node scripts/test-pac.mjs [--base http://localhost:8123]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const A = J('data/cap/es/amounts.json'), R = J('data/cap/es/rules.json'), W = J('data/cap/es/watch.json');
const nrm = s => s.replace(/[., \s  ]/g, '');
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };

// caso de cálculo, recalculado desde los JSON: campaña 2026, región 1, 20 ha, joven, y 10 ha de siembra directa de secano repitiendo la práctica con 30 €/ha de coste
const Y = 2026, i = A.campaigns.indexOf(Y), reg = A.regions['1'], HA = 20, ECO = 'eco-c-cultivo-secano-siembra-directa', EH = 10, COST = 30;
const bonus = R.rules.find(r => r.id === 'eco-bonus-25').values.bonusEurPerHa;
const e0 = A.ecoschemes.find(e => e.id === ECO);
const abrs = HA * reg.abrs.planned[i];
let prev = 0, red = 0; for (const t of reg.redistributiveTiers) { const h = Math.max(0, Math.min(HA, t.toHa) - prev); prev = t.toHa; red += h * t.planned[i]; }
const young = Math.min(HA, R.rules.find(r => r.id === 'young-farmers').values.maxHa) * reg.young.planned[i];
const ecoAmt = EH * Math.min(e0.planned[i] + bonus, e0.max[i]);
const total = abrs + red + young + ecoAmt, net = ecoAmt - EH * COST;
const loTotal = HA * reg.abrs.min[i] + reg.redistributiveTiers.reduce((s, t, k, a) => s + Math.max(0, Math.min(HA, t.toHa) - (k ? a[k - 1].toHa : 0)) * t.min[i], 0) + HA * reg.young.min[i] + EH * Math.min(e0.min[i] + bonus, e0.max[i]);
const hiTotal = HA * reg.abrs.max[i] + reg.redistributiveTiers.reduce((s, t, k, a) => s + Math.max(0, Math.min(HA, t.toHa) - (k ? a[k - 1].toHa : 0)) * t.max[i], 0) + HA * reg.young.max[i] + EH * e0.max[i];

const EST = { es: /estimaci/i, en: /estimate/i, fr: /estimation/i, it: /stima/i };
const BOE = /Basado en datos de la Agencia Estatal Bolet[ií]n Oficial del Estado/;
const INF = { es: /meramente informativo/, en: /merely informative/, fr: /purement informatif/, it: /mero titolo informativo/ };
const url = `/pac.html?y=${Y}&r=1&ha=${HA}&jv=y&e=${ECO}:${EH}:1:${COST}`;

for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { if (!localStorage.getItem('dehesaIndexLang')) localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(), errs = [], tag = lang + '@' + w;
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  const txt = async sel => await page.evaluate(s => { const n = document.querySelector(s); return n ? n.innerText : ''; }, sel);

  await page.goto(BASE + '/pac.html', { waitUntil: 'networkidle' }); await page.waitForSelector('#pac-est');
  let body = await txt('#pac-body');
  ok(tag + ': aviso de que no son los importes del FEGA', /FEGA/.test(await txt('[role=note]')) && EST[lang].test(await txt('[role=note]')));
  ok(tag + ': sin región no hay estimación', (await page.$$('[data-pac-res] .de-tile')).length === 0);

  // importes de ecorregímenes de la campaña actual = JSON
  const iy = A.campaigns.indexOf(+(await page.$eval('[data-pac="y"]', n => n.value)));
  const e1 = A.ecoschemes.filter(e => e.scheme === 'a')[0], t1 = await txt('#pac-eco table tbody tr:nth-child(2)');
  ok(tag + ': primera fila de ecorregímenes = JSON (planificado, mínimo y máximo)', [e1.planned[iy], e1.min[iy], e1.max[iy]].every(v => nrm(t1).includes(nrm(v.toFixed(2)))));
  ok(tag + ': tantas filas como ecorregímenes', (await page.$$('#pac-eco table tbody tr')).length === A.ecoschemes.length + new Set(A.ecoschemes.map(e => e.scheme)).size);
  ok(tag + ': ayudas asociadas = JSON', (await page.$$('#pac-assoc table tbody tr')).length === A.associatedAid.length);
  ok(tag + ': calendario con ' + R.calendar.length + ' hitos', (await page.$$('#pac-cal table tbody tr')).length >= R.calendar.length);
  ok(tag + ': tantas reglas como en el JSON, cada una con su base legal', (await page.$$('#pac-rules > details')).length === R.rules.length && (await page.evaluate(() => document.getElementById('pac-rules').textContent)).split('RD 1048/2022').length > R.rules.length)

  // cita del BOE: base de datos + carácter informativo + fecha de actualización
  const fmt = (iso) => new Date(iso.slice(0, 10) + 'T00:00:00Z').toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const boe = await txt('[data-pac-boe]');
  ok(tag + ': cita del BOE con su texto obligatorio', BOE.test(boe) && INF[lang].test(boe));
  ok(tag + ': fecha de actualización de la consolidación', boe.includes(fmt(W.current.legal.consolidatedAt)));
  ok(tag + ': cita boe_es de la fuente en las secciones', (await page.evaluate(() => document.getElementById('pac-eco').innerHTML)).includes('Boletín Oficial'));

  // seguimiento
  const tk = await txt('#pac-track');
  ok(tag + ': seguimiento muestra las normas posteriores del BOE', W.current.legal.amendments.every(a => tk.includes(a.id)));
  ok(tag + ': sin cambios pendientes se dice', W.reviewNeeded.length === 0 && /(pendiente|attente|attesa|pending)/i.test(tk));

  // estimación con datos por URL
  await page.goto(BASE + url, { waitUntil: 'networkidle' }); await page.waitForSelector('[data-pac-res] .de-tile');
  const res = await txt('[data-pac-res]');
  ok(tag + ': total estimado = recalculado desde los JSON', nrm(res).includes(nrm(Math.round(total).toLocaleString('es')) ) || nrm(res).includes(nrm(total.toFixed(2))));
  ok(tag + ': rango mínimo-máximo = recalculado', nrm(res).includes(nrm(loTotal.toFixed(2))) && nrm(res).includes(nrm(hiTotal.toFixed(2))));
  ok(tag + ': ayuda básica y complemento joven = JSON', nrm(res).includes(nrm(abrs.toFixed(2))) && nrm(res).includes(nrm(young.toFixed(2))));
  ok(tag + ': ecorrégimen con el complemento de ' + bonus + ' €/ha', nrm(res).includes(nrm(ecoAmt.toFixed(2))));
  ok(tag + ': neto tras costes = recalculado', nrm(res).includes(nrm(Math.round(net).toLocaleString('es'))));
  ok(tag + ': la estimación se llama estimación y avisa de lo que no se sabe', EST[lang].test(await txt('#pac-est')) && (await page.$$('[data-pac-res] ul li')).length >= 3);
  ok(tag + ': cita derivada del BOE en la estimación', (await page.$$('[data-pac-res] .pp-cites')).length === 1);

  // cambio de campaña: la estimación cambia con la campaña
  const y2 = A.campaigns[0]; await page.selectOption('[data-pac="y"]', String(y2)); await page.waitForSelector('[data-pac-res] .de-tile');
  const res2 = await txt('[data-pac-res]'), tot2 = HA * reg.abrs.planned[0] + reg.redistributiveTiers.reduce((s, t, k, a) => s + Math.max(0, Math.min(HA, t.toHa) - (k ? a[k - 1].toHa : 0)) * t.planned[0], 0);
  ok(tag + ': otra campaña usa los importes de esa campaña', nrm(res2).includes(nrm((HA * reg.abrs.planned[0]).toFixed(2))) && tot2 > 0);

  // persistencia y borrado
  await page.goto(BASE + '/pac.html', { waitUntil: 'networkidle' }); await page.waitForSelector('#pac-est');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('di-pac-v1') || 'null'));
  ok(tag + ': la elección se guarda en el navegador', saved && saved.r === '1' && saved.ha === String(HA));
  ok(tag + ': y se recupera al volver sin parámetros', await page.$eval('[data-pac="r"]', n => n.value) === '1' && await page.$eval('[data-pac="ha"]', n => n.value) === String(HA));
  await page.click('[data-pac-reset]'); await page.waitForSelector('#pac-est');
  ok(tag + ': borrar mis datos vacía todo', (await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('di-pac-v1') || '{}'); return s.r || s.ha || (s.eco || []).length; })) == 0 && (await page.$$('[data-pac-res] .de-tile')).length === 0);

  // lo calculado nunca muestra undefined/NaN ni desborda
  await page.goto(BASE + url, { waitUntil: 'networkidle' }); await page.waitForSelector('[data-pac-res] .de-tile');
  body = await txt('#pac-body');
  ok(tag + ': sin undefined/NaN/null', !/undefined|NaN|\bnull\b|\{[a-z]\}/.test(body));
  ok(tag + ': sin desborde horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  ok(tag + ': sin errores de consola (' + errs.join('|') + ')', errs.length === 0);

  // avisos de límites: más hectáreas de ecorrégimen que de superficie y total bajo el mínimo
  await page.goto(BASE + `/pac.html?y=${Y}&r=1&ha=1&e=${ECO}:5:0:`, { waitUntil: 'networkidle' }); await page.waitForSelector('[data-pac-res] .de-tile');
  const lim = await txt('[data-pac-res]');
  ok(tag + ': avisa de más hectáreas de ecorrégimen que de superficie', /23\.6/.test(lim));
  await page.goto(BASE + `/pac.html?y=${Y}&r=1&ha=2`, { waitUntil: 'networkidle' }); await page.waitForSelector('[data-pac-res] .de-tile');
  ok(tag + ': avisa de que queda por debajo de 300 €', /art\. 13/.test(await txt('[data-pac-res]')));

  // reducción progresiva (art. 16): superficie enorme -> línea de reducción y aviso de costes laborales
  await page.goto(BASE + `/pac.html?y=${Y}&r=1&ha=2000`, { waitUntil: 'networkidle' }); await page.waitForSelector('[data-pac-res] .de-tile');
  ok(tag + ': ayuda básica muy alta muestra la reducción del art. 16', /art\. 16/.test(await txt('[data-pac-res]')));

  // seguimiento con cambios pendientes (se simula que el BOE cambió un artículo): no se puede esconder
  await page.route('**/data/cap/es/watch.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(Object.assign({}, W, { reviewNeeded: ['Artículo 13'] })) }));
  await page.goto(BASE + '/pac.html', { waitUntil: 'networkidle' }); await page.waitForSelector('#pac-track');
  ok(tag + ': un cambio pendiente del BOE se muestra', /Artículo 13/.test(await txt('#pac-track')));
  await ctx.close();
}
await browser.close();
console.log(fail ? fail + ' fallos' : 'PAC España: todo correcto'); process.exit(fail ? 1 : 0);
