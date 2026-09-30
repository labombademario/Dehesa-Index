import fs from 'fs';
const K=process.env.NASS_API_KEY; let out='';
const log=s=>{out+=s+'\n'};
async function q(p){const u='https://quickstats.nass.usda.gov/api/api_GET/?'+new URLSearchParams({key:K,format:'JSON',source_desc:'SURVEY',freq_desc:'WEEKLY',...p});const r=await fetch(u);try{return (await r.json()).data||[]}catch(e){return []}}
for(const c of ['SORGHUM','BARLEY','RICE','OATS','PEANUTS','SUGARBEETS']){
 for(const cat of ['CONDITION','PROGRESS']){
  const d=await q({commodity_desc:c,agg_level_desc:'NATIONAL',statisticcat_desc:cat,year__GE:'2019'});
  const sd={};d.forEach(x=>{const k=x.short_desc+' | '+x.class_desc;sd[k]=sd[k]||{n:0,yrs:new Set()};sd[k].n++;sd[k].yrs.add(x.year)});
  log('== '+c+' '+cat+' rows '+d.length);Object.entries(sd).forEach(([k,v])=>log('  '+k+' n='+v.n+' yrs='+[...v.yrs].sort().join(',')));
  const st=await q({commodity_desc:c,agg_level_desc:'STATE',statisticcat_desc:cat,year:'2026'});log('  states rows '+st.length+' '+[...new Set(st.map(x=>x.state_alpha))].join(','));
 }}
fs.writeFileSync('scripts/.probe-output.txt',out);
