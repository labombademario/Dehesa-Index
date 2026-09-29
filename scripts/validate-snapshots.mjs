#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const contract = JSON.parse(await readFile(path.join(root, '..', 'data', 'snapshot-contract.json'), 'utf8'));
const dir = path.join(root, '..', 'data', 'snapshots');

let files = [];
try { files = (await readdir(dir)).filter(function (f) { return f.endsWith('.json'); }); } catch (e) {}
if (!files.length) {
  console.log('No snapshots yet; contract check skipped.');
  process.exit(0);
}

const errors = [];
for (const file of files) {
  const doc = JSON.parse(await readFile(path.join(dir, file), 'utf8'));
  if (doc.schemaVersion !== contract.schemaVersion) errors.push(file + ': invalid schemaVersion');
  for (const o of (doc.observations || [])) {
    for (const field of contract.requiredObservationFields) {
      if (o[field] === null || o[field] === undefined || o[field] === '') errors.push(file + ': ' + o.product + '/' + o.region + ': missing ' + field);
    }
    if (!contract.allowedRegions.includes(o.region)) errors.push(file + ': ' + o.product + ': invalid region ' + o.region);
    if (!contract.allowedFrequencies.includes(o.frequency)) errors.push(file + ': ' + o.product + ': invalid frequency ' + o.frequency);
    if (typeof o.value !== 'number' || !Number.isFinite(o.value)) errors.push(file + ': ' + o.product + ': value is not numeric');
    if (!/^\d{4}-\d{2}(-\d{2})?$/.test(String(o.observationDate))) errors.push(file + ': ' + o.product + ': invalid observationDate');
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Snapshot validation OK: ' + files.length + ' file(s).');
