import json, re, urllib.request
A='https://ec.europa.eu/eurostat/api/dissemination/'
out=[]
def log(*a):
    s=' '.join(str(x) for x in a); print(s); out.append(s)
def get(u,j=True):
    t=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'dehesa-index-probe'}),timeout=120).read().decode('utf-8','replace')
    return json.loads(t) if j else t
toc=get(A+'catalogue/toc/txt?lang=en',False)
cands=[]
for l in toc.splitlines():
    r=l.split('\t')
    if len(r)>1 and re.search(r'sold production|prodcom',r[0],re.I) or r[1].strip('"').lower().startswith(('ds-056','ds-059','ds-066')): cands.append((r[1].strip('"'),r[0].strip().strip('"')[:100],r[-3] if len(r)>3 else ''))
ds=[l[:140] for l in toc.splitlines() if re.search(r'\tds[-_]',l,re.I)]
log('ds lines',len(ds))
for l in ds[:80]: log('DSL',l)
log('n cands',len(cands)); log('toc lines',len(toc.splitlines()))
for c in cands[:40]: log('CAND',*c)
for code in [c[0] for c in cands][:8]:
    try:
        d=get(A+'statistics/1.0/data/%s?format=JSON&lang=en&geo=EU27_2020&sinceTimePeriod=2022&lastTimePeriod=1'%code)
        dims={k:len(v['category']['index']) for k,v in d['dimension'].items()}
        log('DS',code,dims,'values',len(d.get('value',{})))
        for k,v in d['dimension'].items():
            if k in('prccode','indic_bt','unit'): log('  ',k,list(v['category']['label'].items())[:5])
    except Exception as e: log('FAIL',code,str(e)[:120])
# butter / cheese codes (PRODCOM 2023 list): probar varios
for code in [c[0] for c in cands][:8]:
    for prc in ['10513000','10514000','10515000','10511130','10512000','10513030','10514010','10515010']:
        try:
            d=get(A+'statistics/1.0/data/%s?format=JSON&lang=en&geo=EU27_2020&prccode=%s'%(code,prc))
            tm=d['dimension']['time']['category']['index']
            log('HIT',code,prc,'time',min(tm),max(tm),'values',len(d['value']),{k:list(v['category']['label'].values())[:3] for k,v in d['dimension'].items() if k in('prccode','indic_bt')})
        except Exception as e: pass
open('probe/probe-log.txt','w').write('\n'.join(out)+'\n')
