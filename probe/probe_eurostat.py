import re, json, urllib.request, urllib.parse, sys
B='https://ec.europa.eu/eurostat/api/dissemination'
def get(u):
    r=urllib.request.Request(u,headers={'User-Agent':'dehesa-index-probe'})
    return urllib.request.urlopen(r,timeout=60).read().decode('utf-8','replace')
out=[]
def log(*a):
    s=' '.join(str(x) for x in a); print(s); out.append(s)
try:
    toc=get(B+'/catalogue/toc/txt?lang=en')
except Exception as e:
    log('TOC FAIL',e); toc=''
rows=[l.split('\t') for l in toc.splitlines()]
pat=re.compile(r'\begg|butter|cheese|milk|dairy|stock|oat|\brye\b|\bolive|potato|fruit',re.I)
cand=[]
for r in rows:
    if len(r)>=2:
        t=r[0].strip('"'); c=r[1].strip('"') if len(r)>1 else ''
        if re.match(r'^(apro|ef_|prc_hicp|apri|agr_|tag)',c) and pat.search(t): cand.append((c,t,r[-3] if len(r)>3 else ''))
log('candidatos',len(cand))
for c,t,_ in cand[:120]: log('CAND',c,'|',t)
for c in ['apro_mk_pobta','apro_mk_colm','apro_ec_egghatch','apro_ec_poula','apro_mt_lscatl','apri_pi15_outa','apri_pi20_outa']:
    u=B+'/statistics/1.0/data/%s?format=JSON&lang=en&geo=EU27_2020'%c
    try:
        d=json.loads(get(u)); tm=d['dimension'].get('time',{}).get('category',{}).get('index',{})
        dims={k:len(v['category']['index']) for k,v in d['dimension'].items()}
        log('DS',c,'time',min(tm) if tm else None,max(tm) if tm else None,'dims',dims,'values',len(d.get('value',{})))
    except Exception as e: log('DS',c,'FAIL',str(e)[:150])
open('probe/probe-log.txt','w').write('\n'.join(out)+'\n')
