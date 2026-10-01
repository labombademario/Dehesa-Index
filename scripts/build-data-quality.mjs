#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const Freshness = createRequire(import.meta.url)('../js/freshness.js');

const root = process.cwd();
const latest = JSON.parse(await readFile(path.join(root,'data','latest.json'),'utf8'));
const history = JSON.parse(await readFile(path.join(root,'data','history.json'),'utf8'));
const today = new Date();
Freshness.policy(JSON.parse(await readFile(path.join(root,'data','freshness-policy.json'),'utf8')));
const observations = latest.observations || [];
const historyRows = history.observations || [];

const rows = observations.map(o => {
  const points = historyRows.filter(h => h.product===o.product && h.region===o.region && h.sourceId===o.sourceId);
  const fr = Freshness.evaluate(o.observationDate, o.frequency, o.sourceId, today.getTime());
  const latestAge = fr.ageDays;
  const stale = fr.state === 'DELAYED' || fr.state === 'STALE';
  return {
    id:o.id, product:o.product, region:o.region, sourceId:o.sourceId,
    status:o.status, comparability:o.comparability || 'review_required',
    observationDate:o.observationDate, publicationDate:o.publicationDate || null,
    verifiedAt:o.verifiedAt || null, frequency:o.frequency,
    historyPoints:points.length, ageDays:latestAge, freshness:fr.state, stale
  };
});
const verified=rows.filter(r=>r.status==='verified').length;
const pending=rows.filter(r=>r.status!=='verified').length;
const stale=rows.filter(r=>r.stale).length;
const freshness={}; rows.forEach(r=>{freshness[r.freshness]=(freshness[r.freshness]||0)+1;});
const regions=[...new Set(rows.map(r=>r.region))];
const products=[...new Set(rows.map(r=>r.product))];
const output={
  schemaVersion:'1.0',
  generatedAt:new Date().toISOString(),
  scope:{latestObservations:rows.length,historyObservations:historyRows.length,verified,pending,stale,freshness,regions,products},
  observations:rows,
  policy:{
    engine:'freshness-policy.json (Freshness Engine 2.0: age measured against each source publication calendar)',
    note:'stale = DELAYED or STALE. Staleness is a QA signal, not a market-quality judgment. Comparability remains source-specific.'
  }
};
await writeFile(path.join(root,'data','quality.json'),JSON.stringify(output,null,2)+'\n','utf8');
console.log('Data quality: '+rows.length+' latest observations; '+verified+' verified; '+pending+' pending; '+stale+' stale.');
