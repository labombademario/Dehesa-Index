import os, re, json, urllib.request, urllib.parse
os.makedirs('data/probe', exist_ok=True)
A='https://ec.europa.eu/eurostat/api/dissemination/'
def get(u,n=3000000,t=120):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'DehesaIndex'}),timeout=t) as r: return r.read(n).decode('utf8','replace')
    except Exception as e: return 'ERR %s'%e
out=[]
toc=get(A+'catalogue/toc/txt?lang=en')
out.append('TOC len %d'%len(toc))
for l in toc.splitlines():
    if re.search(r'"(apri_pi|apri_ap|org_|apro_ec|prc_ppp)[a-z0-9_]*"',l,re.I) or re.search(r'organic',l,re.I) and 'dataset' in l.lower():
        out.append('TOC '+l[:230])
for ds in ['apri_pi20_outq','apri_pi20_inq','apri_pi20_outa','apri_pi20_ina','apri_pi15_outq','apri_pi15_inq']:
    j=get(A+'statistics/1.0/data/%s?lang=EN&geo=AT'%ds)
    if j.startswith('ERR'): out.append('%s %s'%(ds,j[:120])); continue
    try:
        d=json.loads(j); out.append('%s OK dims=%s size=%s time=%s..%s'%(ds,d['id'],d['size'],list(d['dimension']['time']['category']['index'])[:1],list(d['dimension']['time']['category']['index'])[-1:]))
    except Exception as e: out.append('%s parse %s'%(ds,j[:150]))
open('data/probe/at1.txt','w').write('\n'.join(out))
