import json, urllib.request
B='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
EU=['AT','BE','BG','CY','CZ','DE','DK','EE','EL','ES','FI','FR','HR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK']
out=[]
def log(*a):
    s=' '.join(str(x) for x in a); print(s); out.append(s)
def get(u): return json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'dehesa-index-probe'}),timeout=90).read())
def table(code,q):
    u=B+code+'?format=JSON&lang=en&'+q+'&'+'&'.join('geo='+g for g in EU)
    d=get(u); ids=d['id']; size=d['size']; dim=d['dimension']
    inv={v:k for k,v in dim['time']['category']['index'].items()}
    gi={v:k for k,v in dim['geo']['category']['index'].items()}
    st=[1]*len(ids)
    for i in range(len(ids)-2,-1,-1): st[i]=st[i+1]*size[i+1]
    res={}
    for pos,val in d['value'].items():
        p=int(pos); ix=[(p//st[i])%size[i] for i in range(len(ids))]
        res.setdefault(inv[ix[ids.index('time')]],{})[gi[ix[ids.index('geo')]]]=val
    return res
for name,code,q in [('mantequilla','apro_mk_pobta','dairyprod=D6100&milkitem=PRO'),('queso','apro_mk_pobta','dairyprod=D7100&milkitem=PRO'),('huevos','apro_ec_eggcon','agriprod=D8210&unit=MIO')]:
    try:
        res=table(code,q)
        log('==',name,code)
        for y in sorted(res)[-6:]:
            miss=[g for g in EU if g not in res[y]]
            log(y,'paises',len(res[y]),'faltan',miss,'suma',round(sum(res[y].values()),1))
    except Exception as e: log('FAIL',name,e)
open('probe/probe-log.txt','w').write('\n'.join(out)+'\n')
