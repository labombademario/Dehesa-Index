#!/usr/bin/env node
// USDA ERS: previsión de precios de alimentos (CPI/PPI), costes y rentabilidad por cultivo/ganado, previsión de costes de producción y renta agraria de EE. UU.
// Sin clave. Descarga los CSV oficiales del ERS y copia las cifras tal como se publican. Escribe data/ers.json.
import { writeFile, readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
const U = 'https://www.ers.usda.gov';
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; DehesaIndex/1.0)' };
async function get(path, bin) {
  let err = '';
  for (let i = 0; i < 6; i++) {
    try { const r = await fetch(path.startsWith('http') ? path : U + path, { headers: UA, signal: AbortSignal.timeout(120000) }); if (r.ok) return bin ? Buffer.from(await r.arrayBuffer()) : await r.text(); err = 'HTTP ' + r.status; } catch (e) { err = e.message; }
    await new Promise(z => setTimeout(z, 5000 * (i + 1)));
  }
  throw new Error(path + ' ' + err + (err ? '' : ''));
}
function csv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.length > 1);
}
const numv = v => { const s = String(v).replace(/,/g, '').trim(); return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null; };
async function link(page, re) { const h = await get(page); const m = [...h.matchAll(/href="([^"]+)"/g)].map(x => x[1]).map(x => x.split('?')[0]).filter(x => re.test(x)); return [...new Set(m)]; }
let OLD = {}; try { OLD = JSON.parse(await readFile('data/ers.json', 'utf8')); } catch (e) {}
const doc = { schemaVersion: '1.0', source: 'USDA Economic Research Service (ERS)', generatedAt: new Date().toISOString() };
// 1) Food Price Outlook
try {
  const links = await link('/data-products/food-price-outlook', /\/media\/\d+\/[^"?]+\.csv/);
  const find = re => links.filter(l => re.test(l))[0];
  const cpiL = find(/^\/media\/\d+\/changes-in-consumer-price-indexes/), ppiL = find(/^\/media\/\d+\/changes-in-producer-price-indexes/);
  const out = { cpi: [], ppi: [], asOf: null };
  if (cpiL) {
    const r = csv(await get(cpiL)); r.shift();
    const map = new Map();
    for (const c of r) {
      const path = c.slice(0, 5).filter(Boolean).join(' › '), attr = c[5], v = numv(c[7]);
      if (!map.has(path)) map.set(path, { n: path, lv: c.slice(0, 5).filter(Boolean).length, a: {} });
      map.get(path).a[attr] = v;
    }
    out.cpi = [...map.values()];
    const any = r.map(c => c[5]).find(a => /^Year-over-year/.test(a)); if (any) out.asOf = any.replace(/^Year-over-year /, '');
  }
  if (ppiL) {
    const r = csv(await get(ppiL)); r.shift(); const map = new Map();
    for (const c of r) { if (!map.has(c[0])) map.set(c[0], { n: c[0], lv: 1, a: {} }); map.get(c[0]).a[c[1]] = numv(c[3]); }
    out.ppi = [...map.values()];
  }
  doc.fpo = out; console.log('FPO cpi', out.cpi.length, 'ppi', out.ppi.length, out.asOf);
} catch (e) { console.log('FPO error', e.message); }
// 2) Costes y rentabilidad por producto
const CR = { corn: 'corn', soybeans: 'soybeans', wheat: 'wheat', cotton: 'cotton', barley: 'barley', oats: 'oats', sorghum: 'sorghum', rice: 'rice', peanuts: 'peanuts', milk: 'milk', 'cow-calf': 'cow-calf', 'hogs-all': 'hogs-all' };
try {
  const links = await link('/data-products/commodity-costs-and-returns', /\/media\/\d+\/[^"?]+\.csv/);
  doc.costs = {};
  for (const [k, slug] of Object.entries(CR)) {
    const l = links.find(x => new RegExp('/' + slug + '\\.csv$').test(x)); if (!l) { console.log('sin CSV', k); continue; }
    const r = csv(await get(l)); const h = r.shift(); const ix = n => h.indexOf(n);
    const y1 = new Date().getUTCFullYear() - 11, rows = [];
    for (const c of r) {
      const y = Number(c[ix('Year')]), v = numv(c[ix('Value')]); if (!(y >= y1) || v === null) continue;
      const reg = c[ix('Region')], item = c[ix('Item')].trim(); if (c[ix('Size')] !== 'No specific size') continue;
      if (reg !== 'U.S. total' && !/^Total, |less total|^Price|^Yield|^Output/i.test(item)) continue;
      rows.push([c[ix('Category')].trim(), item, c[ix('Units')], reg, y, v]);
    }
    doc.costs[k] = rows; console.log('costes', k, rows.length);
  }
} catch (e) { console.log('costes error', e.message); }
// 3) Previsión de costes de producción
try {
  const links = await link('/data-products/commodity-costs-and-returns', /cost-of-production-forecasts[^"]*\.csv/);
  const r = csv(await get(links[0])); const h = r.shift(); doc.forecast = r.map(c => { const v = numv(c[6]); return v === null ? null : [c[0], c[1], c[2].trim(), c[3], c[4], c[5], v]; }).filter(Boolean);
  console.log('previsión costes', doc.forecast.length);
} catch (e) { console.log('previsión error', e.message); }
// 4) Renta agraria (Farm Income and Wealth Statistics)
try {
  const links = await link('/data-products/farm-income-and-wealth-statistics/data-files-us-and-state-level-farm-income-and-wealth-statistics', /release\.zip$/);
  const zip = await get(links[0], true);
  await writeFile('/tmp/fi.zip', zip); execSync('rm -rf /tmp/fi && mkdir /tmp/fi && unzip -o -q /tmp/fi.zip -d /tmp/fi');
  const files = execSync('find /tmp/fi -name "*.csv"').toString().trim().split('\n');
  const f = files.find(x => /FarmIncome_WealthStatisticsData/i.test(x)) || files[0];
  const r = csv((await readFile(f)).toString('latin1')); const h = r.shift(); const ix = n => h.indexOf(n);
  const y1 = new Date().getUTCFullYear() - 12, rows = [];
  let asOf = '';
  for (const c of r) {
    const y = Number(c[ix('Year')]); if (c[ix('State')] !== 'US' || !(y >= y1)) continue;
    const v = numv(c[ix('Amount')]); if (v === null) continue;
    asOf = c[ix('PublicationDate')] || asOf;
    rows.push([c[ix('artificialKey')], c[ix('VariableDescriptionTotal')].trim(), y, v, String(c[ix('unit_desc')] || '').replace(/[^\x20-\x7e]/g, '').trim()]);
  }
  doc.income = { asOf, rows }; console.log('renta agraria', rows.length, asOf);
} catch (e) { console.log('renta error', e.message); }
for (const k of ['fpo', 'costs', 'forecast', 'income']) if (!doc[k] && OLD[k]) { doc[k] = OLD[k]; console.log('se conserva la última versión de', k); }
if (!doc.fpo && !doc.costs && !doc.income) { console.error('nada descargado'); process.exit(1); }
await writeFile('data/ers.json', JSON.stringify(doc) + '\n', 'utf8');
console.log('bytes', JSON.stringify(doc).length);
