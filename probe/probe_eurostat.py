import json, urllib.request
B='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
out=[]
def log(*a):
    s=' '.join(str(x) for x in a); print(s); out.append(s)
def get(u): return json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'dehesa-index-probe'}),timeout=90).read())
def dump(code,extra=''):
    try: d=get(B+code+'?format=JSON&lang=en&geo=EU27_2020'+extra)
    except Exception as e: log('FAIL',code,extra,e); return
    ids=d['id']; size=d['size']; dim=d['dimension']
    log('DS',code,dict(zip(ids,size)))
    for k in ids:
        if k not in ('time','geo','freq'):
            log('  DIM',k,{c:l for c,l in list(dim[k]['category']['label'].items())[:100]})
    # valores por serie (todas las dims salvo tiempo)
    tix=dim['time']['category']['index']; inv={v:k for k,v in tix.items()}
    ti=ids.index('time'); strides=[1]*len(ids)
    for i in range(len(ids)-2,-1,-1): strides[i]=strides[i+1]*size[i+1]
    series={}
    for pos,val in d['value'].items():
        p=int(pos); idx=[(p//strides[i])%size[i] for i in range(len(ids))]
        key=tuple((ids[i],[c for c,v in dim[ids[i]]['category']['index'].items() if v==idx[i]][0]) for i in range(len(ids)) if ids[i] not in('time','geo','freq'))
        series.setdefault(key,[]).append((inv[idx[ti]],val))
    for k,v in list(series.items())[:60]:
        v.sort(); log('  S',k,'n=%d'%len(v),v[0][0],'..',v[-1][0],'last',v[-1][1])
dump('apro_mk_pobta','&milkitem=PRD_ACT&dairyprod=BUTTER&dairyprod=CHEESE') 
dump('apro_mk_pobta')
dump('apro_ec_eggcon')
dump('apro_ec_egghen')
dump('tag00038'); dump('tag00040'); dump('tag00071')
open('probe/probe-log.txt','w').write('\n'.join(out)+'\n')
