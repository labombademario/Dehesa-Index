#!/usr/bin/env node
/*
 * Harina de soja de EE. UU. desde la API MARS de USDA AMS Market News
 * (https://marsapi.ams.usda.gov/services/v1.2/reports), informe 3511
 * "National Grain and Oilseed Processor Feedstuff Report" (semanal).
 *
 * Serie elegida (una sola, siempre la misma, para que no salte entre filas):
 *   commodity "Soybean Meal", trade Loc "Iowa", proteína 46.5-48 %,
 *   FOB, venta (Ask), precio medio semanal (avg_price), USD por tonelada.
 *
 * Reglas del proyecto: no inventa nada. Si falta la clave, la API falla, la
 * serie tiene huecos raros, el último dato es viejo o el precio sale de rango,
 * termina con error SIN tocar ningún archivo.
 *
 * Requiere MARS_API_KEY (usuario de autenticación básica; contraseña vacía).
 * Uso: MARS_API_KEY=xxxx node scripts/update-mars-us.mjs
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_JS = path.join(root, 'js', 'data.js');
const SNAP_DIR = path.join(root, 'data', 'snapshots');
const KEY = process.env.MARS_API_KEY;
const BASE = 'https://marsapi.ams.usda.gov/services/v1.2/reports/3511';
const SERIES = { commodity: 'Soybean Meal', loc: 'Iowa', protein: '46.5-48%', freight: 'F.O.B.', sale: 'Ask', unit: '$ Per Ton' };
const HIST_SITE = 12;      // puntos del minigráfico
const HIST_SNAP = 104;     // dos años semanales como máximo
const MARKET = 'USDA AMS (harina de soja, Iowa, FOB, 46,5-48 % de proteína)';
const METHOD = 'USDA AMS Market News (API MARS, informe 3511 «National Grain and Oilseed Processor Feedstuff Report», semanal): precio medio semanal de la harina de soja de 46,5-48 % de proteína en Iowa, FOB, cotización de venta (ask), en USD por tonelada. El informe solo indica «$ Per Ton»; se trata como tonelada corta (2.000 lb) porque el precio se expresa como base sobre el futuro de harina de soja de CBOT, que cotiza en toneladas cortas. Es un mercado regional, no un futuro ni la media nacional, y no es exactamente el mismo producto que la referencia europea (España, 40-50 % de proteína, salida de fábrica, EUR/t).';

function fail(msg) { console.error('MARS harina de soja (EE. UU.): ' + msg); process.exit(1); }
if (!KEY) fail('falta MARS_API_KEY');

const mdy = s => { const m = /^(\d\d)\/(\d\d)\/(\d{4})/.exec(String(s || '')); return m ? m[3] + '-' + m[1] + '-' + m[2] : null; };
const fmt = n => Math.round(n * 100) / 100;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const jsString = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

async function fetchAll() {
  const today = new Date();
  const from = '09/01/2024';
  const to = String(today.getUTCMonth() + 1).padStart(2, '0') + '/' + String(today.getUTCDate()).padStart(2, '0') + '/' + today.getUTCFullYear();
  const url = BASE + '?q=report_begin_date=' + from + ':' + to + '&allSections=true';
  const res = await fetch(url, { headers: { Authorization: 'Basic ' + Buffer.from(KEY + ':').toString('base64'), Accept: 'application/json' } });
  if (!res.ok) fail('HTTP ' + res.status);
  const doc = await res.json();
  const sec = n => { const s = (Array.isArray(doc) ? doc : [doc]).find(x => x.reportSection === n); return s && Array.isArray(s.results) ? s.results : []; };
  return { detail: sec('Report Detail'), header: sec('Report Header') };
}

function buildSeries({ detail, header }) {
  const rows = detail.filter(r => r.commodity === SERIES.commodity && r['trade Loc'] === SERIES.loc && r.protein === SERIES.protein &&
    r.freight === SERIES.freight && r.sale_type === SERIES.sale && r.price_unit === SERIES.unit && Number.isFinite(Number(r.avg_price)));
  const byWeek = new Map();
  for (const r of rows) {
    const k = mdy(r.report_begin_date);
    if (!k) continue;
    if (!byWeek.has(k)) byWeek.set(k, []);
    byWeek.get(k).push(r);
  }
  const weeks = [];
  for (const [k, list] of byWeek) {
    // Una corrección publica la semana otra vez: manda la publicación más reciente.
    const latestPub = list.map(r => String(r.published_date)).sort().pop();
    const cand = list.filter(r => String(r.published_date) === latestPub);
    if (cand.length !== 1) continue; // ambigua: se descarta la semana, no se adivina
    const r = cand[0];
    weeks.push({ begin: k, end: mdy(r.report_end_date), published: mdy(r.published_date), value: fmt(Number(r.avg_price)) });
  }
  weeks.sort((a, b) => a.begin.localeCompare(b.begin));
  return weeks;
}

function checks(weeks) {
  if (weeks.length < 26) fail('serie demasiado corta (' + weeks.length + ' semanas)');
  for (const w of weeks) if (!(w.value > 150 && w.value < 900) || !w.end || !w.published) fail('dato fuera de rango o sin fechas: ' + JSON.stringify(w));
  const last = weeks[weeks.length - 1];
  const age = (Date.now() - Date.parse(last.end + 'T00:00:00Z')) / 864e5;
  if (age > 16) fail('el último dato (' + last.end + ') tiene más de 16 días');
  const prev = weeks[weeks.length - 2];
  if (Math.abs(last.value / prev.value - 1) > 0.25) fail('salto semanal mayor del 25 %: revisar a mano');
}

async function writeSnapshot(obs) {
  await mkdir(SNAP_DIR, { recursive: true });
  const file = path.join(SNAP_DIR, new Date().toISOString().slice(0, 10) + '.json');
  let doc = {};
  try { doc = JSON.parse(await readFile(file, 'utf8')); } catch (e) {}
  doc.schemaVersion = '1.0';
  doc.generatedAt = new Date().toISOString();
  doc.observations = (doc.observations || []).filter(o => !(o.product === obs.product && o.region === obs.region));
  doc.observations.push(obs);
  doc.observations.sort((a, b) => (a.product + a.region).localeCompare(b.product + b.region));
  await writeFile(file, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  console.log('Snapshot: ' + path.relative(root, file));
}

async function main() {
  console.log('Consultando USDA AMS MARS (informe 3511, harina de soja, Iowa)...');
  const weeks = buildSeries(await fetchAll());
  checks(weeks);
  const last = weeks[weeks.length - 1], prev = weeks[weeks.length - 2];
  const changePct = Math.round((last.value / prev.value - 1) * 1e4) / 100;
  console.log('Semanas: ' + weeks.length + ' | último ' + last.end + ' -> ' + last.value + ' USD/t (' + changePct + ' %)');

  let src = await readFile(DATA_JS, 'utf8');
  const hist = weeks.slice(-HIST_SITE).map(w => w.value);
  const usRe = new RegExp("(nameKey: 'harina_soja',(?:(?!\\{ nameKey:)[\\s\\S])*?us: \\{ price: )[\\d.]+(, changePct: )-?[\\d.]+(, history: \\[)[^\\]]+(\\], currency: 'USD', kgPerUnit: 907\\.185 \\})");
  if (!usRe.test(src)) fail('no se encontró el bloque us de harina_soja en js/data.js');
  src = src.replace(usRe, (_m, a, b, c, d) => a + last.value + b + changePct + c + hist.join(', ') + d);

  const qRe = new RegExp("(nameKey: 'harina_soja',(?:(?!\\{ nameKey:)[\\s\\S])*?quoteTypes: \\{ us: \\{ type: ')[^']*(', market: ')[^']*(')");
  if (!qRe.test(src)) fail('quoteTypes.us de harina_soja no encontrado');
  src = src.replace(qRe, (_m, a, b, c) => a + 'referencia' + b + jsString(MARKET) + c);

  const trustKey = 'pienso-harina_soja-us';
  const tRe = new RegExp("('" + esc(trustKey) + "': \\{)([\\s\\S]*?)(\\n    \\})");
  const t = tRe.exec(src);
  if (!t) fail('no se encontró la ficha Data Trust ' + trustKey);
  const verifiedAt = new Date().toISOString();
  const fieldsRe = /observationDate: [^,]+,\s*publicationDate: [^,]+,\s*status: '[^']*',\s*verifiedAt: [^\n]+/;
  if (!fieldsRe.test(t[2])) fail('formato de la ficha ' + trustKey + ' no reconocido');
  let body = t[2].replace(fieldsRe, () => "observationDate: '" + last.end + "', publicationDate: '" + last.published + "', status: 'verified', verifiedAt: '" + verifiedAt + "'");
  body = body.replace(/methodology: '(?:[^'\\]|\\.)*'/, () => "methodology: '" + jsString(METHOD) + "'");
  src = src.slice(0, t.index + t[1].length) + body + src.slice(t.index + t[1].length + t[2].length);
  await writeFile(DATA_JS, src, 'utf8');
  console.log('js/data.js actualizado.');

  await writeSnapshot({
    id: 'di_pienso_harina_soja_us', product: 'harina_soja', region: 'us', sourceId: 'usda_ams_mars',
    observationDate: last.end, publicationDate: last.published, status: 'verified', verifiedAt,
    comparability: 'directional', methodology: METHOD, value: last.value, currency: 'USD', unit: 'ton_corta',
    frequency: 'weekly', changePct,
    history: weeks.slice(-HIST_SNAP).map(w => ({ period: w.end.slice(5), year: Number(w.end.slice(0, 4)), value: w.value }))
  });
}
main().catch(e => fail(e.message));
