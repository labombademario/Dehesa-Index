import json, urllib.request
B='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
GEOS=['FI','IE','EL','CH','DE']
out=[]
def log(*a):
    s=' '.join(str(x) for x in a); print(s); out.append(s)
def get(u): return json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'dehesa-index-probe'}),timeout=120).read())
def decode(d):
    ids=d['id']; size=d['size']; dim=d['dimension']
    st=[1]*len(ids)
    for i in range(len(ids)-2,-1,-1): st[i]=st[i+1]*size[i+1]
    inv={k:{v:c for c,v in dim[k]['category']['index'].items()} for k in ids}
    rows={}
    for pos,val in d.get('value',{}).items():
        p=int(pos); ix=[(p//st[i])%size[i] for i in range(len(ids))]
        key=tuple((ids[i],inv[ids[i]][ix[i]]) for i in range(len(ids)) if ids[i] not in('time',))
        rows.setdefault(key,[]).append((inv['time'][ix[ids.index('time')]],val))
    return rows,dim
for code,extra in [('apri_ap_crpouta',''),('apri_ap_anouta',''),('apro_cpsh1',''),('apro_mt_lscatl',''),('apro_ec_eggcon',''),('apro_ec_poula',''),('apro_mk_pobta','&milkitem=PRO'),('apro_mt_pann','')]:
    try:
        d=get(B+code+'?format=JSON&lang=en&'+'&'.join('geo='+g for g in GEOS)+extra+'&sinceTimePeriod=2020')
        rows,dim=decode(d)
        log('==',code,'series',len(rows))
        agg={}
        for k,v in rows.items():
            geo=dict(k).get('geo'); rest=tuple(x for x in k if x[0] not in('geo','freq','unit'))
            agg.setdefault(rest,{})[geo]=max(t for t,_ in v)
        lab={ax:dim[ax]['category'].get('label',{}) for ax in dim}
        for rest,g in list(agg.items())[:400]:
            nm=' / '.join(lab[a].get(c,c)[:38] for a,c in rest if a not in('time',))
            log('  ',nm,'|',g)
    except Exception as e: log('FAIL',code,str(e)[:150])
open('probe/probe-log.txt','w').write('\n'.join(out)+'\n')
