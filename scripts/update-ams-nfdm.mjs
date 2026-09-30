#!/usr/bin/env node
/*
 * Leche desnatada en polvo (NDM) de EE. UU. desde el informe MARS 1049
 * "Nonfat Dry Milk - East and Central U.S." (semanal, USD/lb), que ya guarda
 * data/ams/1049.json (lo actualiza update-ams.mjs). No llama a ninguna API.
 *
 * Serie: calor bajo y medio ("Low & Medium Heat"), el equivalente del SMP europeo.
 * El informe publica un rango semanal (mínimo y máximo). El valor de la tarjeta es
 * el PUNTO MEDIO del rango publicado; se dice así en la metodología.
 * Si la serie es corta, vieja o rara, termina con error sin tocar nada.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_JS = path.join(root, 'js', 'data.js');
const SNAP_DIR = path.join(root, 'data', 'snapshots');
const HEAT = 'Low & Medium Heat';
const MARKET = 'USDA AMS (leche desnatada en polvo, Este y Centro, calor bajo/medio, punto medio del rango)';
const METHOD = 'USDA AMS Market News (API MARS, informe 1049 «Nonfat Dry Milk - East and Central U.S.», semanal): leche desnatada en polvo de calor bajo y medio, en USD por libra. El informe publica un rango semanal (mínimo y máximo) y el valor mostrado es el punto medio de ese rango, calculado por Dehesa Index. Es un mercado regional (Este y Centro de EE. UU.), no un futuro; el producto es equivalente en tipo al SMP europeo, pero no es idéntico.';
const HIST_SITE = 12, HIST_SNAP = 104;

function fail(msg) { console.error('NDM (EE. UU.): ' + msg); process.exit(1); }
const fmt = n => Math.round(n * 10000) / 10000;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const jsString = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const doc = JSON.parse(await readFile(path.join(root, 'data', 'ams', '1049.json'), 'utf8'));
const ser = (doc.series || []).find(s => (s.v || []).indexOf(HEAT) >= 0 && s.u === 'Dollars per Pound');
if (!ser) fail('no está la serie ' + HEAT);
const weeks = ser.p.filter(p => Number.isFinite(p[2]) && Number.isFinite(p[3]) && p[3] >= p[2])
  .map(p => ({ end: p[0], min: p[2], max: p[3], value: fmt((p[2] + p[3]) / 2) }))
  .sort((a, b) => a.end.localeCompare(b.end));
if (weeks.length < 26) fail('serie demasiado corta (' + weeks.length + ')');
for (const w of weeks) if (!(w.value > 0.5 && w.value < 5)) fail('dato fuera de rango: ' + JSON.stringify(w));
const last = weeks[weeks.length - 1], prev = weeks[weeks.length - 2];
if ((Date.now() - Date.parse(last.end + 'T00:00:00Z')) / 864e5 > 16) fail('el último dato (' + last.end + ') tiene más de 16 días');
if (Math.abs(last.value / prev.value - 1) > 0.25) fail('salto semanal mayor del 25 %');
const changePct = Math.round((last.value / prev.value - 1) * 1e4) / 100;
console.log('NDM semanas ' + weeks.length + ' | ' + last.end + ' -> ' + last.value + ' USD/lb (' + changePct + ' %), rango ' + last.min + '-' + last.max);

let src = await readFile(DATA_JS, 'utf8');
const hist = weeks.slice(-HIST_SITE).map(w => w.value);
const usRe = new RegExp("(nameKey: 'leche_polvo',(?:(?!\\{ nameKey:)[\\s\\S])*?us: \\{ price: )[\\d.]+(, changePct: )-?[\\d.]+(, history: \\[)[^\\]]+(\\], currency: 'USD', kgPerUnit: 0\\.453592 \\})");
if (!usRe.test(src)) fail('no se encontró el bloque us de leche_polvo');
src = src.replace(usRe, (_m, a, b, c, d) => a + last.value + b + changePct + c + hist.join(', ') + d);
const qRe = new RegExp("(nameKey: 'leche_polvo',(?:(?!\\{ nameKey:)[\\s\\S])*?quoteTypes: \\{ us: \\{ type: ')[^']*(', market: ')[^']*(')");
if (!qRe.test(src)) fail('quoteTypes.us de leche_polvo no encontrado');
src = src.replace(qRe, (_m, a, b, c) => a + 'referencia' + b + jsString(MARKET) + c);

const trustKey = 'lacteos-leche_polvo-us';
const tRe = new RegExp("('" + esc(trustKey) + "': \\{)([\\s\\S]*?)(\\n    \\})");
const t = tRe.exec(src);
if (!t) fail('no se encontró la ficha ' + trustKey);
const verifiedAt = new Date().toISOString();
const fieldsRe = /observationDate: [^,]+,\s*publicationDate: [^,]+,\s*status: '[^']*',\s*verifiedAt: [^\n]+/;
if (!fieldsRe.test(t[2])) fail('formato de la ficha no reconocido');
let body = t[2].replace(fieldsRe, () => "observationDate: '" + last.end + "', publicationDate: '" + last.end + "', status: 'verified', verifiedAt: '" + verifiedAt + "'");
body = body.replace(/methodology: '(?:[^'\\]|\\.)*'/, () => "methodology: '" + jsString(METHOD) + "'");
src = src.slice(0, t.index + t[1].length) + body + src.slice(t.index + t[1].length + t[2].length);
await writeFile(DATA_JS, src, 'utf8');

await mkdir(SNAP_DIR, { recursive: true });
const file = path.join(SNAP_DIR, new Date().toISOString().slice(0, 10) + '.json');
let snap = {}; try { snap = JSON.parse(await readFile(file, 'utf8')); } catch (e) {}
const obs = {
  id: 'di_lacteos_leche_polvo_us', product: 'leche_polvo', region: 'us', sourceId: 'usda_ams_mars',
  observationDate: last.end, publicationDate: last.end, status: 'verified', verifiedAt,
  comparability: 'directional', methodology: METHOD, value: last.value, currency: 'USD', unit: 'lb',
  frequency: 'weekly', changePct,
  history: weeks.slice(-HIST_SNAP).map(w => ({ period: w.end.slice(5), year: Number(w.end.slice(0, 4)), value: w.value }))
};
snap.schemaVersion = '1.0'; snap.generatedAt = new Date().toISOString();
snap.observations = (snap.observations || []).filter(o => !(o.product === obs.product && o.region === obs.region));
snap.observations.push(obs);
snap.observations.sort((a, b) => (a.product + a.region).localeCompare(b.product + b.region));
await writeFile(file, JSON.stringify(snap, null, 2) + '\n', 'utf8');
console.log('OK');
