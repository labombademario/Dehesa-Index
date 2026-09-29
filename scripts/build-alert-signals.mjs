#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(); const q=JSON.parse(await readFile(path.join(root,'data','quality.json'),'utf8')); const i=JSON.parse(await readFile(path.join(root,'data','intelligence.json'),'utf8'));
const rules=[];
for(const o of q.observations||[]) if(o.stale) rules.push({type:'stale_data',product:o.product,region:o.region,sourceId:o.sourceId,severity:'watch',message:'Latest observation is older than the configured freshness threshold.'});
for(const s of i.series||[]) if(s.periodChangePct!==null && Math.abs(s.periodChangePct)>=5) rules.push({type:'period_move',product:s.product,region:s.region,sourceId:s.sourceId,severity:Math.abs(s.periodChangePct)>=10?'high':'watch',changePct:Number(s.periodChangePct.toFixed(2)),observationDate:s.observationDate});
const out={schemaVersion:'1.0',generatedAt:new Date().toISOString(),status:'informational',rules,policy:{noPredictions:true,noCausalInference:true,noAutomaticExternalNotifications:true,triggerThresholds:'absolute period change >=5%; stale according to quality threshold'},note:'These are data-quality and market-movement signals. User alerts are evaluated locally from verified observations.'};
await writeFile(path.join(root,'data','alerts.json'),JSON.stringify(out,null,2)+'\n'); console.log('Alerts: '+rules.length+' informational signals.');
