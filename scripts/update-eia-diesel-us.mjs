#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(), dir=path.join(root,'data','snapshots');
const key=process.env.EIA_API_KEY||'DEMO_KEY';
const series='EMD_EPD2D_PTE_NUS_DPG';
const url='https://api.eia.gov/v2/petroleum/pri/gnd/data/?frequency=weekly&data[0]=value&facets[series][]='+series+'&sort[0][column]=period&sort[0][direction]=asc&offset=0&length=5000&api_key='+encodeURIComponent(key);
const r=await fetch(url); if(!r.ok) throw new Error('EIA HTTP '+r.status); const j=await r.json(); const rows=(j.response?.data||[]).filter(x=>Number.isFinite(Number(x.value)));
if(rows.length<30) throw new Error('EIA returned insufficient diesel history: '+rows.length);
const points=rows.map(x=>({period:String(x.period),value:Number(x.value)}));
const latest=points[points.length-1], prev=points[points.length-2]; const change=prev?Number(((latest.value/prev.value-1)*100).toFixed(4)):null;
const verifiedAt=new Date().toISOString(), obs={id:'di_diesel_us',product:'diesel',region:'us',sourceId:'eia',observationDate:latest.period,publicationDate:latest.period,status:'verified',verifiedAt,comparability:'directional',value:latest.value,currency:'USD',unit:'gal',frequency:'weekly',changePct:change,history:points.slice(-104).map(x=>({period:x.period.slice(5),year:Number(x.period.slice(0,4)),value:x.value}))};
await mkdir(dir,{recursive:true}); const stamp=new Date().toISOString().slice(0,10),file=path.join(dir,stamp+'.json'); let doc={schemaVersion:'1.0',generatedAt:new Date().toISOString(),observations:[]}; try{doc=JSON.parse(await readFile(file,'utf8'))}catch{} doc.observations=(doc.observations||[]).filter(o=>!(o.product==='diesel'&&o.region==='us')); doc.observations.push(obs); await import('node:fs/promises').then(fs=>fs.writeFile(file,JSON.stringify(doc,null,2)+'\n')); console.log('EIA diesel US: '+latest.period+' = '+latest.value);
