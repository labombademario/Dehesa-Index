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

const url = process.argv[2];
if (!url) {
  console.error('Uso: node scripts/probe-eu-api.mjs "<url>"');
  process.exit(1);
}

async function main() {
  var lines = [];
  lines.push('URL: ' + url);
  lines.push('Fecha: ' + new Date().toISOString());
  try {
    var res = await fetch(url, { headers: { Accept: 'application/json' } });
    lines.push('STATUS: ' + res.status + ' ' + res.statusText);
    var text = await res.text();
    lines.push('BODY (primeros 6000 caracteres):');
    lines.push(text.slice(0, 6000));
  } catch (err) {
    lines.push('ERROR: ' + err.message);
  }
  await writeFile(OUT_PATH, lines.join('\n') + '\n', 'utf8');
  console.log('Resultado escrito en ' + OUT_PATH);
}

main();
