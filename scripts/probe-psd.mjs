import fs from 'node:fs'; import readline from 'node:readline';
const out=[];const log=s=>out.push(s);
const files=['grains_pulses','oilseeds','livestock','dairy','sugar'].map(n=>'/tmp/psd/psd_'+n+'.csv').filter(f=>fs.existsSync(f));
function parse(line){const r=[];let cur='',q=false;for(const c of line){if(c==='"')q=!q;else if(c===','&&!q){r.push(cur);cur=''}else cur+=c}r.push(cur);return r}
for(const f of files){
 const com=new Map(),attrs=new Map(),countries=new Map();let n=0,maxMY=0;
 const rl=readline.createInterface({input:fs.createReadStream(f)});let first=true;
 const rows=[];
 for await(const line of rl){if(first){first=false;continue}const c=parse(line);n++;
  com.set(c[0],c[1]);attrs.set(c[7]+'|'+c[8]+'|'+c[10],(attrs.get(c[7]+'|'+c[8]+'|'+c[10])||0)+1);countries.set(c[2],c[3]);if(+c[4]>maxMY)maxMY=+c[4];
  rows.push(c)}
 log('#### '+f+' rows '+n+' maxMY '+maxMY);
 log('commodities: '+[...com].map(x=>x.join('=')).join('; '));
 log('attributes: '+[...attrs].map(x=>x[0]+' x'+x[1]).join('; '));
 log('countries('+countries.size+'): '+[...countries].map(x=>x.join('=')).join('; '));
 if(/grains/.test(f)){
  // wheat production ranking latest MY, month and calendar year info
  const w=rows.filter(r=>r[1]==='Wheat'&&r[8]==='Production'&&r[4]==String(maxMY-1)).map(r=>[r[3],+r[11],r[5],r[6]]).sort((a,b)=>b[1]-a[1]).slice(0,30);
  log('wheat production MY'+(maxMY-1)+': '+w.map(x=>x.join(':')).join(' | '));
  const my=[...new Set(rows.filter(r=>r[1]==='Wheat'&&r[3]==='United States'&&r[8]==='Production').map(r=>r[4]))].sort();log('wheat US MY range '+my[0]+'-'+my[my.length-1]+' n='+my.length);
  const wl=rows.filter(r=>r[1]==='Wheat'&&r[3]==='World'&&r[4]===String(maxMY-1)).map(r=>r[8]+'='+r[11]);log('world wheat MY'+(maxMY-1)+': '+wl.join(', '));
  const ml=rows.filter(r=>r[1]==='Wheat'&&r[3]==='World'&&r[8]==='Production').map(r=>r[4]+':'+r[5]+'-'+r[6]).slice(-6);log('world wheat production last rows (MY:cal-month) '+ml.join(' '));
 }
}
fs.writeFileSync('scripts/.probe-output.txt',out.join('\n')+'\n');
