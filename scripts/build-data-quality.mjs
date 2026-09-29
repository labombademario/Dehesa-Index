#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const latest = JSON.parse(await readFile(path.join(root,'data','latest.json'),'utf8'));
const history = JSON.parse(await readFile(path.join(root,'data','history.json'),'utf8'));
const today = new Date();
const observations = latest.observations || [];
const historyRows = history.observations || [];

function daysSince(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((today.getTime()-d.getTime())/86400000));
}
function expectedGap(freq) {
  return ({daily:3,weekly:14,monthly:45,quarterly:120,annual:450}[freq] || 60);
}
const rows = observations.map(o => {
  const points = historyRows.filter(h => h.product===o.product && h.region===o.region && h.sourceId===o.sourceId);
  const latestAge = daysSince(o.observationDate);
  const stale = latestAge !== null && latestAge > expectedGap(o.frequency);
  return {
    id:o.id, product:o.product, region:o.region, sourceId:o.sourceId,
    status:o.status, comparability:o.comparability || 'review_required',
    observationDate:o.observationDate, publicationDate:o.publicationDate || null,
    verifiedAt:o.verifiedAt || null, frequency:o.frequency,
    historyPoints:points.length, ageDays:latestAge, stale
  };
});
const verified=rows.filter(r=>r.status==='verified').length;
const pending=rows.filter(r=>r.status!=='verified').length;
const stale=rows.filter(r=>r.stale).length;
const regions=[...new Set(rows.map(r=>r.region))];
const products=[...new Set(rows.map(r=>r.product))];
const output={
  schemaVersion:'1.0',
  generatedAt:new Date().toISOString(),
  scope:{latestObservations:rows.length,historyObservations:historyRows.length,verified,pending,stale,regions,products},
  observations:rows,
  policy:{
    staleThresholds:{daily:3,weekly:14,monthly:45,quarterly:120,annual:450},
    note:'Staleness is a QA signal, not a market-quality judgment. Comparability remains source-specific.'
  }
};
await writeFile(path.join(root,'data','quality.json'),JSON.stringify(output,null,2)+'\n','utf8');
console.log('Data quality: '+rows.length+' latest observations; '+verified+' verified; '+pending+' pending; '+stale+' stale.');
