import fs from 'fs';
const K=process.env.NASS_API_KEY; let out='';
const log=s=>{out+=s+'\n';console.log(s)};
async function q(p){const u='https://quickstats.nass.usda.gov/api/api_GET/?'+new URLSearchParams({key:K,format:'JSON',...p});const r=await fetch(u);const t=await r.text();try{return {status:r.status,j:JSON.parse(t)}}catch(e){return {status:r.status,txt:t.slice(0,200)}}}
for(const c of ['CORN','SOYBEANS','WHEAT','COTTON']){
  const r=await q({source_desc:'SURVEY',commodity_desc:c,agg_level_desc:'NATIONAL',freq_desc:'WEEKLY',year__GE:'2025',statisticcat_desc:'CONDITION'});
  log('== '+c+' CONDITION status '+r.status+' '+(r.txt||''));
  const d=(r.j&&r.j.data)||[];log('rows '+d.length);
  const sd={};d.forEach(x=>{sd[x.short_desc]=(sd[x.short_desc]||0)+1});log(JSON.stringify(sd));
  d.slice(-3).forEach(x=>log(JSON.stringify([x.short_desc,x.year,x.reference_period_desc,x.week_ending,x.Value,x.unit_desc,x.class_desc])));
  const r2=await q({source_desc:'SURVEY',commodity_desc:c,agg_level_desc:'NATIONAL',freq_desc:'WEEKLY',year__GE:'2025',statisticcat_desc:'PROGRESS'});
  const d2=(r2.j&&r2.j.data)||[];log('PROGRESS status '+r2.status+' rows '+d2.length);
  const s2={};d2.forEach(x=>{s2[x.short_desc]=(s2[x.short_desc]||0)+1});log(JSON.stringify(s2));
  d2.slice(-2).forEach(x=>log(JSON.stringify([x.short_desc,x.year,x.week_ending,x.Value])));
}
const rs=await q({source_desc:'SURVEY',commodity_desc:'CORN',agg_level_desc:'STATE',state_alpha:'IA',freq_desc:'WEEKLY',year:'2026',statisticcat_desc:'CONDITION'});
log('IA state rows '+((rs.j&&rs.j.data)||[]).length+' '+(rs.txt||''));
fs.writeFileSync('scripts/.probe-output.txt',out);
