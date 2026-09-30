import {writeFile} from 'node:fs/promises';
const out=[];const log=s=>{out.push(s);console.log(s)};
const B='https://power.larc.nasa.gov/api/temporal';
const pt='longitude=-93.6&latitude=42.0&community=AG&format=JSON';
async function get(u){const t=Date.now();try{const r=await fetch(u);const txt=await r.text();log('GET '+u.replace(B,'')+' -> '+r.status+' '+(Date.now()-t)+'ms len '+txt.length);return {status:r.status,txt}}catch(e){log('ERR '+u+' '+e.message);return null}}
const iso=d=>d.toISOString().slice(0,10).replace(/-/g,'');
const end=new Date(Date.now()-86400000), start=new Date(Date.now()-70*86400000);
let r=await get(`${B}/daily/point?parameters=PRECTOTCORR,T2M&${pt}&start=${iso(start)}&end=${iso(end)}`);
if(r&&r.status===200){const j=JSON.parse(r.txt);log(JSON.stringify(j.header||{}).slice(0,300));log(JSON.stringify(j.parameters||{}).slice(0,400));const p=j.properties.parameter;for(const k of Object.keys(p)){const d=Object.entries(p[k]);log(k+' n='+d.length+' first='+d[0]+' last3='+d.slice(-3).join(' | '))}log('messages '+JSON.stringify(j.messages||[]).slice(0,300));log('license '+JSON.stringify(j.header?.license||j.license||'').slice(0,200))}
else if(r) log(r.txt.slice(0,400));
r=await get(`${B}/monthly/point?parameters=PRECTOTCORR,T2M&${pt}&start=2025&end=2026`);
if(r&&r.status===200){const p=JSON.parse(r.txt).properties.parameter;for(const k of Object.keys(p))log(k+' '+JSON.stringify(p[k]).slice(0,700))}else if(r)log(r.txt.slice(0,300));
r=await get(`${B}/climatology/point?parameters=PRECTOTCORR,T2M&${pt}`);
if(r&&r.status===200){const j=JSON.parse(r.txt);const p=j.properties.parameter;for(const k of Object.keys(p))log(k+' '+JSON.stringify(p[k]).slice(0,500));log(JSON.stringify(j.header||{}).slice(0,300))}else if(r)log(r.txt.slice(0,300));
// daily 1991-2020 for climatology (size/time check)
r=await get(`${B}/daily/point?parameters=PRECTOTCORR,T2M&${pt}&start=19910101&end=20201231`);
await writeFile('scripts/.probe-output.txt',out.join('\n')+'\n');
