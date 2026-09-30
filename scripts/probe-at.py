import os, re, json, urllib.request
os.makedirs('data/probe', exist_ok=True)
A='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
def get(u,t=150):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'DehesaIndex'}),timeout=t) as r: return json.load(r)
    except Exception as e: return 'ERR %s'%e
out=[]
for ds,extra in [('apri_pi_outq',''),('apri_pi_inq',''),('org_cropar','&agprdmet=TOTAL'),('org_coptyp',''),('org_lstspec',''),('org_croppro',''),('org_aprod',''),('apro_mt_lsorg',''),('apro_mt_porg',''),('apro_ec_eggorg','')]:
    d=get(A+ds+'?lang=EN&geo=AT'+extra)
    if isinstance(d,str): out.append('%s %s'%(ds,d[:100])); continue
    ids,size=d['id'],d['size']; out.append('== %s dims=%s size=%s nvalues=%d'%(ds,ids,size,len(d.get('value',{}))))
    cats={}
    for k in ids:
        c=d['dimension'][k]['category']; idx=c['index']; order=list(idx) if not isinstance(idx,dict) else sorted(idx,key=idx.get); cats[k]=(order,c.get('label',{}))
    # último año con valor por combinación (sin time)
    last={}
    for pos,v in d.get('value',{}).items():
        pos=int(pos); rec={}
        for k,n in reversed(list(zip(ids,size))): rec[k]=cats[k][0][pos%n]; pos//=n
        key=tuple(rec[k] for k in ids if k!='time'); t=rec['time']
        f=last.setdefault(key,[t,t,0]); f[0]=min(f[0],t); f[1]=max(f[1],t); f[2]+=1
    out.append('  combos with data: %d; max time overall %s'%(len(last),max((x[1] for x in last.values()),default=None)))
    for key,(a,b,n) in list(last.items())[:40]:
        lab=' | '.join(cats[k][1].get(c,c)[:38] for k,c in zip([k for k in ids if k!='time'],key))
        out.append('  %s..%s n=%d :: %s'%(a,b,n,lab))
open('data/probe/at2.txt','w').write('\n'.join(out))
