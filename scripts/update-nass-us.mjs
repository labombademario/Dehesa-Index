#!/usr/bin/env node
/*
 * Actualiza automáticamente el precio de EE. UU. de un producto de
 * cereales (cereales:trigo/maiz/arroz, región `us`) en js/data.js a partir
 * de la API pública y gratuita de USDA NASS Quick Stats
 * (https://quickstats.nass.usda.gov/api) -- generalización de
 * update-wheat-us.mjs para reutilizar la misma fuente en varios productos.
 *
 * Solo cubre productos cuya región `us` ya cita "USDA NASS" como fuente
 * (referencia mensual nacional, no un futuro ni un precio AMS diario/
 * semanal) -- por ahora: trigo, maíz y arroz. Lácteos, ganado, porcino,
 * ovino, avicultura y azúcar usan otras agencias (USDA AMS Market News,
 * CME Group, USDA ERS), cada una con su propia API y sus propios
 * requisitos -- quedan fuera de este script.
 *
 * Requiere la variable de entorno NASS_API_KEY (clave gratuita, se pide en
 * https://quickstats.nass.usda.gov/api).
 *
 * Uso: NASS_API_KEY=xxxx node scripts/update-nass-us.mjs <trigo|maiz|arroz>
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_JS_PATH = path.join(__dirname, '..', 'js', 'data.js');
const HISTORY_POINTS = 7; // últimos 7 meses publicados, para el minigráfico
const SNAPSHOT_DIR = path.join(__dirname, '..', 'data', 'snapshots');

// Un producto por entrada: qué pedirle a NASS y cómo encontrar/sustituir su
// bloque `us: {...}` en js/data.js. `kgPerUnit` es el ancla que hace único
// el patrón de cada producto (coincide con imperialKgPerUnit en data.js).
const PRODUCTS = {
  trigo: {
    label: 'Trigo',
    commodity: 'WHEAT',
    shortDesc: 'WHEAT - PRICE RECEIVED, MEASURED IN $ / BU',
    kgPerUnit: '27\\.2155'
  },
  maiz: {
    label: 'Maíz',
    commodity: 'CORN',
    shortDesc: 'CORN, GRAIN - PRICE RECEIVED, MEASURED IN $ / BU',
    kgPerUnit: '25\\.401'
  },
  arroz: {
    label: 'Arroz',
    commodity: 'RICE',
    shortDesc: 'RICE - PRICE RECEIVED, MEASURED IN $ / CWT',
    kgPerUnit: '45\\.359'
  }
};

const key = process.argv[2];
const cfg = PRODUCTS[key];
if (!cfg) {
  console.error('Uso: node scripts/update-nass-us.mjs <' + Object.keys(PRODUCTS).join('|') + '>');
  process.exit(1);
}

const API_KEY = process.env.NASS_API_KEY;
if (!API_KEY) {
  console.error('Falta la variable de entorno NASS_API_KEY (clave gratuita de https://quickstats.nass.usda.gov/api).');
  process.exit(1);
}

function buildUrl() {
  const params = new URLSearchParams({
    key: API_KEY,
    commodity_desc: cfg.commodity,
    statisticcat_desc: 'PRICE RECEIVED',
    agg_level_desc: 'NATIONAL',
    freq_desc: 'MONTHLY',
    format: 'JSON'
  });
  return 'https://quickstats.nass.usda.gov/api/api_GET/?' + params.toString();
}

async function fetchSeries() {
  const url = buildUrl();
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(function () { return ''; });
    throw new Error('NASS API respondió ' + res.status + ' ' + res.statusText + ': ' + body.slice(0, 300));
  }
  const json = await res.json();
  const rows = json.data || [];
  const matching = rows.filter(function (r) { return r.short_desc === cfg.shortDesc; });
  if (matching.length === 0) {
    throw new Error(
      'Ningún registro con short_desc="' + cfg.shortDesc + '". NASS puede haber cambiado su nomenclatura -- ' +
      'revisar a mano la respuesta de ' + url.replace(API_KEY, 'XXXX') + ' y ajustar shortDesc en este script.'
    );
  }
  matching.sort(function (a, b) {
    var ay = parseInt(a.year, 10), by = parseInt(b.year, 10);
    if (ay !== by) return ay - by;
    return (parseInt(a.begin_code, 10) || 0) - (parseInt(b.begin_code, 10) || 0);
  });
  var cleaned = matching
    .filter(function (r) { return r.Value && r.Value !== '(D)' && r.Value !== '(NA)'; })
    .map(function (r) { return { year: r.year, period: r.reference_period_desc || r.period_desc, periodCode: r.period, value: parseFloat(String(r.Value).replace(/,/g, '')) }; })
    .filter(function (r) { return !isNaN(r.value); });
  if (cleaned.length < 2) {
    throw new Error('Solo se encontraron ' + cleaned.length + ' puntos válidos -- no hay suficiente histórico para calcular la variación.');
  }
  return cleaned.slice(-HISTORY_POINTS);
}

function observationDateFromNass(year, periodDesc, periodCode) {
  var y = String(year);
  var p = String(periodDesc || '').toLowerCase();
  var monthMap = {
    january: '01', february: '02', march: '03', april: '04',
    may: '05', june: '06', july: '07', august: '08',
    september: '09', october: '10', november: '11', december: '12'
  };
  for (var name in monthMap) {
    if (p.indexOf(name) !== -1) return y + '-' + monthMap[name];
  }
  // NASS period codes may be M01..M12 even when the description is localized.
  var m = String(periodCode || '').match(/^M(\\d{2})$/i);
  if (m) return y + '-' + m[1];
  return y;
}

function fmt(v) {
  return Math.round(v * 100) / 100;
}


async function writeSnapshot(observation) {
  await mkdir(SNAPSHOT_DIR, { recursive: true });
  var stamp = new Date().toISOString().slice(0, 10);
  var file = path.join(SNAPSHOT_DIR, stamp + '.json');
  var existing = {};
  try { existing = JSON.parse(await readFile(file, 'utf8')); } catch (e) {}
  existing.schemaVersion = '1.0';
  existing.generatedAt = new Date().toISOString();
  existing.observations = existing.observations || [];
  existing.observations = existing.observations.filter(function (o) {
    return !(o.product === observation.product && o.region === observation.region);
  });
  existing.observations.push(observation);
  existing.observations.sort(function (a, b) { return (a.product + a.region).localeCompare(b.product + b.region); });
  await writeFile(file, JSON.stringify(existing, null, 2) + '\n', 'utf8');
  console.log('Snapshot: data/snapshots/' + stamp + '.json');
}

async function main() {
  console.log('Consultando USDA NASS Quick Stats (' + cfg.label + ', EE. UU., precio recibido mensual)...');
  var series = await fetchSeries();
  var latest = series[series.length - 1];
  var observationDate = observationDateFromNass(latest.year, latest.period, latest.periodCode);
  var prev = series[series.length - 2];
  var changePct = fmt(((latest.value - prev.value) / prev.value) * 100);
  var history = series.map(function (p) { return fmt(p.value); });
  var price = fmt(latest.value);

  console.log('Último dato: ' + latest.year + ' ' + latest.period + ' -> $' + price + ' (variación vs. mes anterior: ' + changePct + '%)');
  console.log('Histórico (' + history.length + ' meses): ' + history.join(', '));

  var src = await readFile(DATA_JS_PATH, 'utf8');

  var re = new RegExp(
    "(nameKey: '" + key + "'[\\s\\S]*?us: \\{ price: )[\\d.]+(, changePct: )-?[\\d.]+(, history: \\[)[^\\]]+(\\], currency: 'USD', kgPerUnit: " + cfg.kgPerUnit + " \\})"
  );
  if (!re.test(src)) {
    throw new Error("No se encontró el bloque `us: {...}` de " + key + " en js/data.js con el patrón esperado -- puede que el archivo se haya reestructurado. Revisar a mano.");
  }
  var updated = src.replace(re, function (_, pre, mid1, mid2, post) {
    return pre + price + mid1 + changePct + mid2 + history.join(', ') + post;
  });

  // Data Trust v2: actualiza únicamente la fecha de observación NASS.
  // Publication date permanece null porque Quick Stats no la expone como
  // fecha de publicación de la observación en este endpoint.
  var trustKey = 'cereales-' + key + '-us';
  var trustRe = new RegExp("('" + trustKey + "': \\{[\\s\\S]*?observationDate: )null(, publicationDate: )null");
  if (!trustRe.test(updated)) {
    throw new Error('No se encontró el registro Data Trust `' + trustKey + '` en js/data.js. Se aborta para no actualizar el precio sin su trazabilidad.');
  }
  updated = updated.replace(trustRe, function (_, pre, pub) {
    return pre + "'" + observationDate + "'" + pub + 'null';
  });

  if (updated === src) {
    console.log('Sin cambios: el valor ya estaba actualizado.');
    return;
  }

  await writeFile(DATA_JS_PATH, updated, 'utf8');
  console.log('js/data.js actualizado (' + key + ').');

  await writeSnapshot({
    product: key,
    region: 'us',
    sourceId: 'usda_nass',
    observationDate: observationDate,
    publicationDate: null,
    value: price,
    currency: 'USD',
    unit: key === 'arroz' ? 'cwt' : 'bushel',
    frequency: 'monthly',
    changePct: changePct,
    history: series.map(function (p) { return { year: p.year, period: p.period, value: fmt(p.value) }; })
  });

  console.log('Data Trust: observationDate=' + observationDate + ' | publicationDate=pending');

  if (process.env.GITHUB_OUTPUT) {
    await writeFile(process.env.GITHUB_OUTPUT, 'price=' + price + '\nchange=' + changePct + '\nlabel=' + cfg.label + '\n', { flag: 'a' });
  }
}

main().catch(function (err) {
  console.error('Error actualizando el precio de ' + key + ' (EE. UU.):', err.message);
  process.exit(1);
});
