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
 * Uso: NASS_API_KEY=xxxx node scripts/update-nass-us.mjs <trigo|maiz|arroz|cebada|avena|colza|sorgo|leche|huevos|cerdo|vaca|pollo>
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_JS_PATH = path.join(__dirname, '..', 'js', 'data.js');
const HISTORY_POINTS = 7; // últimos 7 meses publicados, para el minigráfico de js/data.js
const SNAPSHOT_HISTORY_POINTS = 120; // hasta 10 años de meses publicados, para el histórico ampliado (solo datos reales de NASS)
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
  },
  cebada: {
    label: 'Cebada',
    commodity: 'BARLEY',
    shortDesc: 'BARLEY - PRICE RECEIVED, MEASURED IN $ / BU',
    kgPerUnit: '21\\.7724'
  },
  avena: {
    label: 'Avena',
    commodity: 'OATS',
    shortDesc: 'OATS - PRICE RECEIVED, MEASURED IN $ / BU',
    kgPerUnit: '14\\.515'
  },
  colza: {
    label: 'Colza',
    commodity: 'CANOLA',
    shortDesc: 'CANOLA - PRICE RECEIVED, MEASURED IN $ / CWT',
    kgPerUnit: '45\\.359',
    obsUnit: 'cwt',
    trustMethodology: 'National USDA NASS PRICE RECEIVED for canola; USD/cwt.'
  },
  sorgo: {
    label: 'Sorgo',
    commodity: 'SORGHUM',
    shortDesc: 'SORGHUM, GRAIN - PRICE RECEIVED, MEASURED IN $ / CWT',
    kgPerUnit: '45\\.359',
    obsUnit: 'cwt',
    trustMethodology: 'National USDA NASS PRICE RECEIVED for grain sorghum; USD/cwt.'
  },
  leche: {
    label: 'Leche',
    commodity: 'MILK',
    shortDesc: 'MILK - PRICE RECEIVED, MEASURED IN $ / CWT',
    kgPerUnit: '45\\.359',
    trustKey: 'lacteos-leche-us',
    obsUnit: 'cwt',
    trustMethodology: 'National USDA NASS PRICE RECEIVED for all milk sold to plants (not Class III); USD/cwt.'
  },
  huevos: {
    label: 'Huevos',
    commodity: 'EGGS',
    shortDesc: 'EGGS, TABLE - PRICE RECEIVED, MEASURED IN $ / DOZEN',
    kgPerUnit: '0\\.6804',
    trustKey: 'avicultura-huevos-us',
    obsUnit: 'docena',
    trustMethodology: 'National USDA NASS PRICE RECEIVED for table eggs (producer price, not retail); USD/dozen.'
  },
  // Precios al productor en PESO VIVO: reales pero NO equivalentes a la canal (UE) -> NO COMPARABLE
  cerdo: {
    label: 'Cerdo', commodity: 'HOGS', shortDesc: 'HOGS - PRICE RECEIVED, MEASURED IN $ / CWT',
    kgPerUnit: '45\\.359', trustKey: 'porcino-cerdo-us', obsUnit: 'cwt', comparability: 'not_comparable',
    market: 'USDA NASS (precio recibido, cerdos vivos)',
    trustMethodology: 'National USDA NASS PRICE RECEIVED for all hogs, live weight; USD/cwt. Not comparable with the EU carcass price (class S).'
  },
  vaca: {
    label: 'Vacuno', commodity: 'CATTLE', shortDesc: 'CATTLE, STEERS & HEIFERS, GE 500 LBS - PRICE RECEIVED, MEASURED IN $ / CWT',
    kgPerUnit: '45\\.359', trustKey: 'ganado-vaca-us', obsUnit: 'cwt', comparability: 'not_comparable', quoteType: 'referencia',
    market: 'USDA NASS (precio recibido, novillos y novillas, peso vivo)',
    trustMethodology: 'National USDA NASS PRICE RECEIVED for steers and heifers of 500 lb or more, live weight; USD/cwt. Not comparable with the EU carcass price (young bulls A-R3).'
  },
  pollo: {
    label: 'Pollo', commodity: 'CHICKENS', shortDesc: 'CHICKENS, BROILERS - PRICE RECEIVED, MEASURED IN $ / LB',
    kgPerUnit: '0\\.453592', trustKey: 'avicultura-pollo-us', obsUnit: 'lb', comparability: 'not_comparable',
    market: 'USDA NASS (precio recibido, broilers, peso vivo)',
    trustMethodology: 'National USDA NASS PRICE RECEIVED for broilers, live weight; USD/lb. Not comparable with the EU whole-carcass price (65 % yield).'
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
  var matching = rows.filter(function (r) { return r.short_desc === cfg.shortDesc; });
  var totals = matching.filter(function (r) { return r.domain_desc === 'TOTAL'; });
  if (totals.length) matching = totals;
  if (matching.length === 0) {
    var avail = Array.from(new Set(rows.map(function (r) { return r.short_desc; }))).slice(0, 25).join(' ; ');
    console.error('short_desc disponibles para ' + cfg.commodity + ': ' + avail);
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
  return cleaned.slice(-SNAPSHOT_HISTORY_POINTS);
}

function observationDateFromNass(year, periodDesc, periodCode) {
  var y = String(year);
  var p = String(periodDesc || '').toLowerCase();
  var monthMap = {
    january: '01', jan: '01', february: '02', feb: '02', march: '03', mar: '03', april: '04', apr: '04',
    may: '05', june: '06', jun: '06', july: '07', jul: '07', august: '08', aug: '08',
    september: '09', sep: '09', october: '10', oct: '10', november: '11', nov: '11', december: '12', dec: '12'
  };
  for (var name in monthMap) {
    if (p.indexOf(name) !== -1) return y + '-' + monthMap[name];
  }
  // NASS period codes may be M01..M12 even when the description is localized.
  var m = String(periodCode || '').match(/^M(\\d{2})$/i);
  if (m) return y + '-' + m[1];
  return y;
}

// NASS publica el informe Agricultural Prices del mes M el último día hábil de ese
// mes (p. ej. julio de 2026 -> 2026-07-31). Se usa como fecha de publicación.
function publicationDateFor(observationDate) {
  var m = String(observationDate).match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  var d = new Date(Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10), 0)); // último día del mes
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d = new Date(d.getTime() - 86400000);
  return d.toISOString().slice(0, 10);
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
  var fullSeries = await fetchSeries();
  var series = fullSeries.slice(-HISTORY_POINTS);
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

  // Data Trust v2: fecha de observación, fecha de publicación (último día hábil
  // del mes, ver publicationDateFor) y estado de verificación.
  var trustKey = cfg.trustKey || ('cereales-' + key + '-us');
  var verifiedAt = new Date().toISOString();
  var publicationDate = publicationDateFor(observationDate);
  var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var monthLabel = monthNames[parseInt(observationDate.slice(5, 7), 10) - 1] + ' ' + observationDate.slice(0, 4);
  var trustBlockRe = new RegExp("('" + trustKey + "': \\{)([\\s\\S]*?)(\\n    \\})");
  var tb = trustBlockRe.exec(updated);
  if (!tb) {
    throw new Error('No se encontró el registro Data Trust `' + trustKey + '` en js/data.js. Se aborta para no actualizar el precio sin su trazabilidad.');
  }
  var fieldsRe = /observationDate: [^,]+,\s*publicationDate: [^,]+,\s*status: '[^']*',\s*verifiedAt: [^\n]+/;
  if (!fieldsRe.test(tb[2])) {
    throw new Error('Formato del registro Data Trust `' + trustKey + '` no reconocido. Revisar a mano.');
  }
  if (cfg.comparability) tb[2] = tb[2].replace(/comparability: '[^']*'/, "comparability: '" + cfg.comparability + "'");
  var body = tb[2].replace(fieldsRe, function () {
    return "observationDate: '" + observationDate + "', publicationDate: '" + publicationDate + "', status: 'verified', verifiedAt: '" + verifiedAt + "'";
  });
  var baseMethod = cfg.trustMethodology || ('National USDA NASS PRICE RECEIVED observation; USD/' + (key === 'arroz' ? 'cwt' : 'bushel') + '.');
  body = body.replace(/methodology: '(?:[^'\\]|\\.)*'/, function () {
    return "methodology: '" + baseMethod + " Published in the " + monthLabel + " Agricultural Prices release.'";
  });
  updated = updated.slice(0, tb.index + tb[1].length) + body + updated.slice(tb.index + tb[1].length + tb[2].length);

  if (cfg.market) {
    var qRe = new RegExp("(nameKey: '" + key + "'[\\s\\S]*?quoteTypes: \\{ us: \\{ type: ')[^']*(', market: ')[^']*(')");
    if (!qRe.test(updated)) throw new Error('quoteTypes.us de ' + key + ' no encontrado');
    updated = updated.replace(qRe, function (_m, a, b, c) { return a + (cfg.quoteType || 'referencia') + b + cfg.market + c; });
  }

  if (updated === src) {
    console.log('Sin cambios: el valor ya estaba actualizado.');
    return;
  }

  await writeFile(DATA_JS_PATH, updated, 'utf8');
  console.log('js/data.js actualizado (' + key + ').');

  await writeSnapshot({
    id: 'di_' + key + '_us',
    product: key,
    region: 'us',
    sourceId: 'usda_nass',
    observationDate: observationDate,
    publicationDate: publicationDate,
    status: 'verified',
    verifiedAt: verifiedAt,
    comparability: cfg.comparability || 'directional',
    value: price,
    currency: 'USD',
    unit: cfg.obsUnit || (key === 'arroz' ? 'cwt' : 'bushel'),
    frequency: 'monthly',
    changePct: changePct,
    history: fullSeries.map(function (p) { return { year: p.year, period: p.period, value: fmt(p.value) }; })
  });

  console.log('Data Trust: observationDate=' + observationDate + ' | publicationDate=' + publicationDate);

  if (process.env.GITHUB_OUTPUT) {
    await writeFile(process.env.GITHUB_OUTPUT, 'price=' + price + '\nchange=' + changePct + '\nlabel=' + cfg.label + '\n', { flag: 'a' });
  }
}

main().catch(function (err) {
  console.error('Error actualizando el precio de ' + key + ' (EE. UU.):', err.message);
  process.exit(1);
});
