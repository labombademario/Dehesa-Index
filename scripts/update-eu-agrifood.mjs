#!/usr/bin/env node
/*
 * Precios semanales de la UE desde el Agri-food Data Portal de la Comisión
 * Europea (API pública, sin clave): https://api.tech.ec.europa.eu/agrifood
 *
 * Uso: node scripts/update-eu-agrifood.mjs cerdo
 *
 * Por cada producto configurado en PRODUCTS:
 *   1. descarga la serie del Estado miembro indicado (y clase, si aplica),
 *   2. escribe la observación en data/snapshots/<hoy>.json (formato del contrato),
 *   3. actualiza en js/data.js el bloque eu: del producto y su ficha de Data Trust
 *      mediante expresiones regulares ancladas (si no encuentra el bloque, falla
 *      en lugar de escribir a ciegas).
 * No inventa nada: si la API no devuelve datos válidos, el script termina con error
 * y no toca ningún archivo.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const DATA_JS = path.join(root, 'js', 'data.js');
const SNAP_DIR = path.join(root, 'data', 'snapshots');
const BASE = 'https://api.tech.ec.europa.eu/agrifood/api';

export const PRODUCTS = {
  cerdo: {
    commodity: 'pigmeat',
    member: 'ES',
    filter: { pigClass: 'S' },
    unitExpected: '100 KG',
    obsUnit: '100kg',
    rawNameKey: 'cerdo',
    trustKey: 'porcino-cerdo-eu',
    id: 'di_porcino_cerdo_eu',
    product: 'cerdo',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la canal de cerdo clasificada S (≥60 % magro) en España, EUR/100 kg de canal. Es la referencia española; no es la media de la UE. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.'
  }
};

export function parseEuDate(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || '').trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}
export function parsePrice(s) {
  const n = Number(String(s || '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function buildSeries(rows, cfg) {
  const byDate = new Map();
  for (const r of rows) {
    if (r.memberStateCode !== cfg.member) continue;
    if (cfg.filter && Object.entries(cfg.filter).some(([k, v]) => r[k] !== v)) continue;
    if (r.unit !== cfg.unitExpected) continue;
    const end = parseEuDate(r.endDate); const price = parsePrice(r.price);
    if (end && price !== null) byDate.set(end, price);
  }
  return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export function patchDataJs(data, cfg, latest, changePct, history, verifiedAt, publicationDate) {
  const euRe = new RegExp("(nameKey: '" + cfg.rawNameKey + "',[\\s\\S]*?\\n\\s*eu: \\{)([^\\n]*?)(\\},\\n\\s*uk: \\{)");
  const m = euRe.exec(data);
  if (!m) throw new Error('Bloque eu: de ' + cfg.rawNameKey + ' no encontrado en js/data.js');
  const body = ' price: ' + latest[1] + ', changePct: ' + changePct + ', history: [' + history.join(', ') + "], currency: 'EUR', kgPerUnit: 100 ";
  data = data.slice(0, m.index + m[1].length) + body + data.slice(m.index + m[1].length + m[2].length);
  const trustRe = new RegExp("('" + cfg.trustKey + "': \\{)([\\s\\S]*?)(\\n    \\})");
  const t = trustRe.exec(data);
  if (!t) throw new Error("Ficha Data Trust '" + cfg.trustKey + "' no encontrada en js/data.js");
  const fieldsRe = /comparability: '[^']*',\s*observationDate: [^,]+,\s*publicationDate: [^,]+,\s*status: '[^']*',\s*verifiedAt: [^\n]+/;
  if (!fieldsRe.test(t[2])) throw new Error('Formato de la ficha Data Trust no reconocido');
  const newFields = "comparability: 'directional', observationDate: '" + latest[0] + "', publicationDate: '" + publicationDate + "',\n      status: 'verified', verifiedAt: '" + verifiedAt + "'";
  const newBody = t[2].replace(fieldsRe, () => newFields);
  return data.slice(0, t.index + t[1].length) + newBody + data.slice(t.index + t[1].length + t[2].length);
}

async function updateProduct(name) {
  const cfg = PRODUCTS[name];
  if (!cfg) throw new Error('Producto no configurado: ' + name + ' (' + Object.keys(PRODUCTS).join(', ') + ')');
  const url = BASE + '/' + cfg.commodity + '/prices?memberStateCodes=' + cfg.member;
  let res;
  for (let attempt = 1; attempt <= 3; attempt++) {
    res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.ok) break;
    await new Promise(r => setTimeout(r, 15000 * attempt));
  }
  if (!res.ok) throw new Error('Agri-food API HTTP ' + res.status);
  const rows = await res.json();
  const series = buildSeries(rows, cfg);
  if (series.length < 30) throw new Error('Serie insuficiente para ' + name + ': ' + series.length + ' semanas');
  const latest = series[series.length - 1], prev = series[series.length - 2];
  const changePct = Number(((latest[1] / prev[1] - 1) * 100).toFixed(4));
  const verifiedAt = new Date().toISOString();
  // La API no expone fecha de publicación: se reutiliza la ya registrada para esta
  // misma observación o, si es nueva, el día en que se recuperó por primera vez.
  let publicationDate = verifiedAt.slice(0, 10);
  try {
    const prevDoc = JSON.parse(await readFile(path.join(root, 'data', 'latest.json'), 'utf8'));
    const prevObs = (prevDoc.observations || []).find(o => o.id === cfg.id && o.observationDate === latest[0] && o.publicationDate);
    if (prevObs) publicationDate = prevObs.publicationDate;
  } catch (e) {}
  const last104 = series.slice(-104);
  const obs = {
    id: cfg.id, product: cfg.product, region: 'eu', sourceId: 'eu_agrifood',
    observationDate: latest[0], publicationDate, status: 'verified', verifiedAt,
    comparability: 'directional', methodology: cfg.methodology,
    value: latest[1], currency: 'EUR', unit: cfg.obsUnit, frequency: 'weekly', changePct,
    history: last104.map(([d, v]) => ({ period: d.slice(5), year: Number(d.slice(0, 4)), value: v }))
  };
  await mkdir(SNAP_DIR, { recursive: true });
  const file = path.join(SNAP_DIR, verifiedAt.slice(0, 10) + '.json');
  let doc = { schemaVersion: '1.0', generatedAt: verifiedAt, observations: [] };
  try { doc = JSON.parse(await readFile(file, 'utf8')); } catch (e) {}
  doc.observations = (doc.observations || []).filter(o => !(o.product === cfg.product && o.region === 'eu')).concat([obs]);
  const data = patchDataJs(await readFile(DATA_JS, 'utf8'), cfg, latest, changePct, series.slice(-12).map(x => x[1]), verifiedAt, publicationDate);
  await writeFile(DATA_JS, data, 'utf8');
  await writeFile(file, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  console.log(name + ' UE (' + cfg.member + '): ' + latest[0] + ' = ' + latest[1] + ' EUR/100kg (' + changePct + '%)');
}

if (process.argv[1] && process.argv[1].endsWith('update-eu-agrifood.mjs')) {
  const names = process.argv.slice(2);
  if (!names.length) { console.error('Uso: node scripts/update-eu-agrifood.mjs <producto...>'); process.exit(1); }
  for (const n of names) await updateProduct(n);
}
