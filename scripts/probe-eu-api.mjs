#!/usr/bin/env node
/*
 * Herramienta de investigación, NO de producción: hace una petición GET a
 * una URL (pasada como argumento) y escribe la respuesta cruda (estado +
 * cuerpo, recortado) en scripts/.probe-output.txt.
 *
 * Existe porque mi entorno de desarrollo no tiene salida a internet salvo
 * npm/pip/GitHub, así que no puedo llamar directamente a la API del Agri-food
 * Data Portal de la Comisión Europea (api.tech.ec.europa.eu) para averiguar
 * el nombre exacto de sus endpoints y campos. GitHub Actions sí tiene
 * salida a internet completa, así que este script se ejecuta ahí
 * (.github/workflows/probe-eu-api.yml, disparado a mano con una URL
 * concreta) y el resultado se comitea a este mismo archivo para poder
 * leerlo después con un simple `git pull`.
 *
 * Uso: node scripts/probe-eu-api.mjs "<url>"
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '.probe-output.txt');

const urls = process.argv.slice(2).join(' ').split(/\s+/).filter(Boolean);
if (!urls.length) {
  console.error('Uso: node scripts/probe-eu-api.mjs "<url> [<url> ...]"');
  process.exit(1);
}

function dateKey(r) {
  var d = r.endDate || r.ym || null;
  if (r.endDate) { var m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(r.endDate); return m ? m[3] + '-' + m[2] + '-' + m[1] : r.endDate; }
  if (d) return String(d);
  return String(r.year || '') + '-' + String(r.month || '') + '-' + String(r.quarter || '');
}

async function probe(rawUrl) {
  var parts = rawUrl.split('#');
  var url = parts[0];
  var group = /group=([^&]+)/.exec(parts[1] || '');
  var lines = ['=== ' + rawUrl];
  try {
    var res = await fetch(url, { headers: { Accept: 'application/json' } });
    lines.push('STATUS: ' + res.status);
    var text = await res.text();
    try {
      var json = JSON.parse(text);
      if (Array.isArray(json) && json.length > 0 && typeof json[0] === 'object') {
        lines.push('FILAS: ' + json.length);
        if (!group) Object.keys(json[0]).forEach(function (f) {
          var values = Array.from(new Set(json.map(function (r) { return r[f]; })));
          lines.push('  ' + f + ' -> ' + (values.length <= 25 ? JSON.stringify(values) : '(' + values.length + ' valores; ej. ' + JSON.stringify(values.slice(0, 3)) + ')'));
        });
        lines.push('EJEMPLO: ' + JSON.stringify(json[0]));
        if (group) {
          var keys = group[1].split(',');
          var groups = {};
          json.forEach(function (r) {
            var k = keys.map(function (f) { return r[f]; }).join(' | ');
            var dk = dateKey(r);
            var g = groups[k] || (groups[k] = { n: 0, last: '', price: null });
            g.n++;
            if (dk >= g.last) { g.last = dk; g.price = r.price; }
          });
          Object.keys(groups).sort().forEach(function (k) {
            lines.push('  GRUPO [' + k + '] n=' + groups[k].n + ' ultimo=' + groups[k].last + ' precio=' + groups[k].price);
          });
        }
      } else {
        lines.push('BODY: ' + text.slice(0, 500));
      }
    } catch (e) { lines.push('BODY: ' + text.slice(0, 300)); }
  } catch (err) { lines.push('ERROR: ' + err.message); }
  return lines.join('\n');
}

async function main() {
  var out = [];
  for (var i = 0; i < urls.length; i++) {
    out.push(await probe(urls[i]));
    if (i < urls.length - 1) await new Promise(function (r) { setTimeout(r, 2500); });
  }
  await writeFile(OUT_PATH, out.join('\n\n') + '\n', 'utf8');
  console.log('Resultado escrito en ' + OUT_PATH);
}

main();
