import json, urllib.request
A='https://ec.europa.eu/eurostat/api/comext/dissemination/statistics/1.0/data/'
out=[]
def log(*a):
    s=' '.join(str(x) for x in a); print(s); out.append(s)
def get(u): return json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'dehesa-index-probe'}),timeout=180).read())
for ds in ['DS-056120','DS-059358']:
    for prc in ['10513000','10514000','10515000','10512000','10511130']:
        u=A+'%s?format=JSON&lang=en&prccode=%s&indic_bt=PRODQNT'%(ds,prc)
        try:
            d=get(u); dim=d['dimension']
            tm=dim['time']['category']['index']
            log('HIT',ds,prc,{k:len(v['category']['index']) for k,v in dim.items()},'time',min(tm),max(tm),'values',len(d.get('value',{})))
            for k in ('prccode','indic_bt','decl'):
                if k in dim: log('   ',k,list(dim[k]['category']['label'].items())[:40] if k=='decl' else list(dim[k]['category']['label'].items())[:4])
            break
        except Exception as e: log('FAIL',ds,prc,str(e)[:160])
open('probe/probe-log.txt','w').write('\n'.join(out)+'\n')
