#!/usr/bin/env node
/*
 * Actualiza automáticamente el precio de EE. UU. del trigo (cereales:trigo,
 * región `us`) en js/data.js a partir de la API pública y gratuita de
 * USDA NASS Quick Stats (https://quickstats.nass.usda.gov/api), la misma
 * fuente ya citada en el sitio ("USDA NASS", tipo "referencia").
 *
 * PILOTO de automatización de datos: solo cubre este producto/región.
 * El resto de fuentes del sitio (Euronext/MATIF, AHDB, CME, Comisión
 * Europea, etc.) no está cubierto todavía -- ver charla con Mario del
 * 28-sep-2026: Euronext no tiene API pública gratuita, así que la región
 * `eu`/`uk` del trigo sigue actualizándose a mano por ahora.
 *
 * Requiere la variable de entorno NASS_API_KEY (clave gratuita, se pide en
 * https://quickstats.nass.usda.gov/api). No se admite ejecutar sin ella.
 *
 * Uso: NASS_API_KEY=xxxx node scripts/update-wheat-us.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_JS_PATH = path.join(__dirname, '..', 'js', 'data.js');

const API_KEY = process.env.NASS_API_KEY;
if (!API_KEY) {
  console.error('Falta la variable de entorno NASS_API_KEY (clave gratuita de https://quickstats.nass.usda.gov/api).');
  process.exit(1);
}

// Cadena EXACTA que usa NASS para el precio medio nacional de trigo (todas
// las clases), mensual, en $/bushel. Si NASS cambia su nomenclatura, este
// script fallará con un mensaje claro en vez de coger un valor equivocado.
const TARGET_SHORT_DESC = 'WHEAT - PRICE RECEIVED, MEASURED IN $ / BU';
const HISTORY_POINTS = 7; // últimos 7 meses publicados, para el minigráfico

function buildUrl() {
  const params = new URLSearchParams({
    key: API_KEY,
    commodity_desc: 'WHEAT',
    statisticcat_desc: 'PRICE RECEIVED',
    agg_level_desc: 'NATIONAL',
    freq_desc: 'MONTHLY',
    format: 'JSON'
  });
  return 'https://quickstats.nass.usda.gov/api/api_GET/?' + params.toString();
}

async function fetchWheatSeries() {
  const url = buildUrl();
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(function () { return ''; });
    throw new Error('NASS API respondió ' + res.status + ' ' + res.statusText + ': ' + body.slice(0, 300));
  }
  const json = await res.json();
  const rows = json.data || [];
  const matching = rows.filter(function (r) { return r.short_desc === TARGET_SHORT_DESC; });
  if (matching.length === 0) {
    throw new Error(
      'Ningún registro con short_desc="' + TARGET_SHORT_DESC + '". NASS puede haber cambiado su nomenclatura -- ' +
      'revisar a mano la respuesta de ' + url.replace(API_KEY, 'XXXX') + ' y ajustar TARGET_SHORT_DESC en este script.'
    );
  }
  // Ordena cronológicamente (año + mes) y se queda con los últimos N puntos.
  matching.sort(function (a, b) {
    var ay = parseInt(a.year, 10), by = parseInt(b.year, 10);
    if (ay !== by) return ay - by;
    return (parseInt(a.begin_code, 10) || 0) - (parseInt(b.begin_code, 10) || 0);
  });
  var cleaned = matching
    .filter(function (r) { return r.Value && r.Value !== '(D)' && r.Value !== '(NA)'; })
    .map(function (r) { return { year: r.year, period: r.reference_period_desc || r.period_desc, value: parseFloat(String(r.Value).replace(/,/g, '')) }; })
    .filter(function (r) { return !isNaN(r.value); });
  if (cleaned.length < 2) {
    throw new Error('Solo se encontraron ' + cleaned.length + ' puntos válidos -- no hay suficiente histórico para calcular la variación.');
  }
  return cleaned.slice(-HISTORY_POINTS);
}

function fmt(v) {
  // Mismo criterio de decimales que ya usa D.fmtNumber en data.js para precios de EE. UU.
  return Math.round(v * 100) / 100;
}

async function main() {
  console.log('Consultando USDA NASS Quick Stats (trigo, EE. UU., precio recibido mensual)...');
  var series = await fetchWheatSeries();
  var latest = series[series.length - 1];
  var prev = series[series.length - 2];
  var changePct = fmt(((latest.value - prev.value) / prev.value) * 100);
  var history = series.map(function (p) { return fmt(p.value); });
  var price = fmt(latest.value);

  console.log('Último dato: ' + latest.year + ' ' + latest.period + ' -> $' + price + '/bu (variación vs. mes anterior: ' + changePct + '%)');
  console.log('Histórico (' + history.length + ' meses): ' + history.join(', '));

  var src = await readFile(DATA_JS_PATH, 'utf8');

  // Ancla en el nameKey único 'trigo' y sustituye SOLO su bloque `us: {...}`,
  // dejando eu/uk/countryFactors/quoteTypes intactos.
  var re = /(nameKey: 'trigo'[\s\S]*?us: \{ price: )[\d.]+(, changePct: )-?[\d.]+(, history: \[)[^\]]+(\], currency: 'USD', kgPerUnit: 27\.2155 \})/;
  if (!re.test(src)) {
    throw new Error("No se encontró el bloque `us: {...}` de trigo en js/data.js con el patrón esperado -- puede que el archivo se haya reestructurado. Revisar a mano.");
  }
  var updated = src.replace(re, function (_, pre, mid1, mid2, post) {
    return pre + price + mid1 + changePct + mid2 + history.join(', ') + post;
  });

  if (updated === src) {
    console.log('Sin cambios: el valor ya estaba actualizado.');
    return;
  }

  await writeFile(DATA_JS_PATH, updated, 'utf8');
  console.log('js/data.js actualizado.');

  // Para que el workflow componga un mensaje de commit útil (formato moderno
  // de GitHub Actions: escribir en el archivo que apunta GITHUB_OUTPUT).
  if (process.env.GITHUB_OUTPUT) {
    await writeFile(process.env.GITHUB_OUTPUT, 'price=' + price + '\nchange=' + changePct + '\n', { flag: 'a' });
  }
}

main().catch(function (err) {
  console.error('Error actualizando el precio de trigo (EE. UU.):', err.message);
  process.exit(1);
});
