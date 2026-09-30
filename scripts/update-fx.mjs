#!/usr/bin/env node
/*
 * Actualiza automáticamente los tipos de cambio (EUR/USD y GBP/USD) en
 * js/data.js a partir del feed diario y gratuito del Banco Central
 * Europeo (BCE) -- sin necesidad de clave de API:
 * https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
 *
 * El BCE publica 1 EUR = X USD y 1 EUR = Y GBP cada día laborable (TARGET)
 * sobre las 16:00 CET. A partir de esos dos valores se derivan las mismas
 * dos variables que ya usaba el sitio a mano:
 *   EURUSD = X            (dólares por 1 euro)
 *   GBPUSD = X / Y         (dólares por 1 libra)
 *
 * Uso: node scripts/update-fx.mjs   (no requiere variables de entorno)
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_JS_PATH = path.join(__dirname, '..', 'js', 'data.js');
const ECB_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

function fmt(v) {
  return Math.round(v * 10000) / 10000; // 4 decimales, igual que los valores actuales del sitio
}

async function fetchEcbRates() {
  const res = await fetch(ECB_URL);
  if (!res.ok) {
    throw new Error('El feed del BCE respondió ' + res.status + ' ' + res.statusText);
  }
  const xml = await res.text();

  // Fecha de la cotización, ej. <Cube time='2026-09-29'>
  var dateMatch = xml.match(/<Cube time="([\d-]+)">/) || xml.match(/<Cube time='([\d-]+)'>/);
  var quoteDate = dateMatch ? dateMatch[1] : null;

  function rateFor(ccy) {
    var re = new RegExp('<Cube currency=["\']' + ccy + '["\'] rate=["\']([\\d.]+)["\']');
    var m = xml.match(re);
    if (!m) throw new Error('No se encontró el tipo de cambio de ' + ccy + ' en el feed del BCE -- puede que haya cambiado el formato del XML.');
    return parseFloat(m[1]);
  }

  var usdRate = rateFor('USD'); // 1 EUR = usdRate USD
  var gbpRate = rateFor('GBP'); // 1 EUR = gbpRate GBP
  var cadRate = rateFor('CAD'); // 1 EUR = cadRate CAD

  return { quoteDate: quoteDate, usdRate: usdRate, gbpRate: gbpRate, cadRate: cadRate };
}

async function main() {
  console.log('Consultando el feed diario del BCE (eurofxref-daily.xml)...');
  var rates = await fetchEcbRates();
  var eurUsd = fmt(rates.usdRate);
  var gbpUsd = fmt(rates.usdRate / rates.gbpRate);
  var cadUsd = fmt(rates.usdRate / rates.cadRate);

  console.log('Fecha de la cotización del BCE: ' + rates.quoteDate);
  console.log('EUR/USD = ' + eurUsd + '  (BCE: 1 EUR = ' + rates.usdRate + ' USD)');
  console.log('CAD/USD = ' + cadUsd + '  (derivado de 1 EUR = ' + rates.cadRate + ' CAD)');
  console.log('GBP/USD = ' + gbpUsd + '  (derivado de 1 EUR = ' + rates.gbpRate + ' GBP)');

  var src = await readFile(DATA_JS_PATH, 'utf8');

  var reComment = /\/\/ --- Tipos de cambio \((?:BCE \/ Banco de Inglaterra|Banco Central Europeo), referencia del [^)]+\) -/;
  var reEurUsd = /var EURUSD = [\d.]+;/;
  var reGbpUsd = /var GBPUSD = [\d.]+;/;
  var reCadUsd = /var CADUSD = [\d.]+;/;
  var reFxDate = /var FX_DATE = '[\d-]+';.*/;

  if (!reEurUsd.test(src) || !reGbpUsd.test(src)) {
    throw new Error('No se encontraron las líneas `var EURUSD = ...;` / `var GBPUSD = ...;` en js/data.js -- puede que el archivo se haya reestructurado. Revisar a mano.');
  }
  if (!reFxDate.test(src)) {
    throw new Error("No se encontró la línea `var FX_DATE = '...';` en js/data.js -- puede que el archivo se haya reestructurado. Revisar a mano.");
  }

  var niceDate = rates.quoteDate ? formatSpanishDate(rates.quoteDate) : 'fecha desconocida';
  var updated = src
    .replace(reComment, '// --- Tipos de cambio (Banco Central Europeo, referencia del ' + niceDate + ') -')
    .replace(reEurUsd, 'var EURUSD = ' + eurUsd + ';')
    .replace(reGbpUsd, 'var GBPUSD = ' + gbpUsd + ';')
    .replace(reCadUsd, 'var CADUSD = ' + cadUsd + ';')
    .replace(reFxDate, "var FX_DATE = '" + (rates.quoteDate || '') + "'; // fecha ISO de la cotización, la actualiza scripts/update-fx.mjs");

  if (updated === src) {
    console.log('Sin cambios: los tipos de cambio ya estaban actualizados.');
    return;
  }

  await writeFile(DATA_JS_PATH, updated, 'utf8');
  console.log('js/data.js actualizado.');

  if (process.env.GITHUB_OUTPUT) {
    await writeFile(process.env.GITHUB_OUTPUT, 'eurusd=' + eurUsd + '\ngbpusd=' + gbpUsd + '\ndate=' + niceDate + '\n', { flag: 'a' });
  }
}

function formatSpanishDate(isoDate) {
  var MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var parts = isoDate.split('-');
  var y = parts[0], m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
  return d + ' ' + MONTHS[m - 1] + ' ' + y;
}

main().catch(function (err) {
  console.error('Error actualizando los tipos de cambio:', err.message);
  process.exit(1);
});
