#!/usr/bin/env node
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, '..', 'data');
const latest = JSON.parse(await readFile(path.join(dataDir, 'latest.json'), 'utf8'));
const history = JSON.parse(await readFile(path.join(dataDir, 'history.json'), 'utf8'));

function csvEscape(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const fields = ['product','region','sourceId','observationDate','snapshotDate','value','currency','unit','frequency','status','verifiedAt','comparability','changePct'];
const lines = [fields.join(',')];

for (const o of history.observations || []) {
  lines.push(fields.map(f => csvEscape(o[f])).join(','));
}

await mkdir(dataDir, { recursive: true });
await import('node:fs/promises').then(fs => fs.writeFile(path.join(dataDir, 'history.csv'), '\uFEFF' + lines.join('\n') + '\n'));
console.log('Generated data/history.csv with ' + Math.max(0, lines.length - 1) + ' observations.');
