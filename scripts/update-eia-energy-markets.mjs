#!/usr/bin/env node
// Gas natural Henry Hub, petróleo WTI y Brent (EIA API v2, precios spot semanales).
// Henry Hub: el historico sigue siendo semanal, pero el ultimo valor sale de la serie DIARIA de la EIA (retraso de pocos dias en lugar de ~2 semanas).
// Escribe observaciones en data/snapshots/<fecha>.json y un log en data/energy-markets-log.txt.
import {readFile,writeFile,mkdir} from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(), dir=path.join(root,'data','snapshots');
const key=process.env.EIA_API_KEY||'DEMO_KEY';
const SERIES=[
  {route:'natural-gas/pri/fut',series:'RNGWHHD',product:'gas_natural',region:'us',id:'di_gas_natural_us',unit:'mmbtu',label:'Henry Hub gas',daily:true},
  {route:'petroleum/pri/spt',series:'RWTC',product:'petroleo_wti',region:'us',id:'di_petroleo_wti_us',unit:'barril',label:'WTI crude'},
  {route:'petroleum/pri/spt',series:'RBRTE',product:'petroleo_brent',region:'eu',id:'di_petroleo_brent_eu',unit:'barril',label:'Brent crude'}
];
const log=[]; const stamp=new Date().toISOString().slice(0,10); const verifiedAt=new Date().toISOString();
const file=path.join(dir,stamp+'.json'); await mkdir(dir,{recursive:true});
let doc={schemaVersion:'1.0',generatedAt:verifiedAt,observations:[]}; try{doc=JSON.parse(await readFile(file,'utf8'))}catch{}
let ok=0;
for(const s of SERIES){
  try{
    const url='https://api.eia.gov/v2/'+s.route+'/data/?frequency=weekly&data[0]=value&facets[series][]='+s.series+'&sort[0][column]=period&sort[0][direction]=asc&offset=0&length=5000&api_key='+encodeURIComponent(key);
    const r=await fetch(url); if(!r.ok) throw new Error('HTTP '+r.status);
    const j=await r.json(); const rows=(j.response?.data||[]).filter(x=>Number.isFinite(Number(x.value)));
    if(rows.length<30) throw new Error('insufficient history: '+rows.length);
    const points=rows.map(x=>({period:String(x.period),value:Number(x.value)}));
    let latest=points[points.length-1], prev=points[points.length-2], dailyNote='';
    if(s.daily){
      try{
        const du='https://api.eia.gov/v2/'+s.route+'/data/?frequency=daily&data[0]=value&facets[series][]='+s.series+'&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=30&api_key='+encodeURIComponent(key);
        const dr=await fetch(du); if(!dr.ok) throw new Error('HTTP '+dr.status);
        const dj=await dr.json(); const d=(dj.response?.data||[]).filter(x=>Number.isFinite(Number(x.value))).map(x=>({period:String(x.period),value:Number(x.value)}));
        if(d.length>=2&&d[0].period>latest.period){
          const t0=Date.parse(d[0].period)-7*864e5; const wk=d.find(x=>Date.parse(x.period)<=t0)||d[d.length-1];
          prev=wk; latest=d[0]; points.push(latest); dailyNote=' (diario)';
        }
      }catch(e){log.push('WARN '+s.label+' diario no disponible, se usa el semanal: '+e.message)}
    }
    const change=prev&&prev.value?Number(((latest.value/prev.value-1)*100).toFixed(4)):null;
    const obs={id:s.id,product:s.product,region:s.region,sourceId:'eia',observationDate:latest.period,publicationDate:latest.period,status:'verified',verifiedAt,comparability:'directional',value:latest.value,currency:'USD',unit:s.unit,frequency:'weekly',changePct:change,history:points.filter(x=>Number(x.period.slice(0,4))>=1980).map(x=>({period:x.period.slice(5),year:Number(x.period.slice(0,4)),value:x.value}))};
    doc.observations=(doc.observations||[]).filter(o=>!(o.product===s.product&&o.region===s.region)); doc.observations.push(obs);
    log.push('OK '+s.label+' '+s.series+': '+latest.period+' = '+latest.value+' ('+points.length+' pts)'+dailyNote); ok++;
  }catch(e){log.push('FAIL '+s.label+' '+s.series+': '+e.message)}
}
await writeFile(file,JSON.stringify(doc,null,2)+'\n');
await writeFile(path.join(root,'data','energy-markets-log.txt'),verifiedAt+'\n'+log.join('\n')+'\n');
console.log(log.join('\n')); if(!ok) process.exit(1);
