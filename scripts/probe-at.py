import os, json, urllib.request
os.makedirs('data/probe', exist_ok=True)
A='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
def get(u,t=170):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'DehesaIndex'}),timeout=t) as r: return json.load(r)
    except Exception as e: return 'ERR %s'%e
out=[]
d=get(A+'apri_pi_outq?lang=EN&geo=AT')
for k in ('p_adj','unit'): out.append('%s %s'%(k,d['dimension'][k]['category']['label']))
out.append('outq items %s'%d['dimension']['am_item']['category']['label'])
d=get(A+'apri_pi_inq?lang=EN&geo=AT'); out.append('inq items %s'%d['dimension']['am_item']['category']['label'])
d=get(A+'ef_lus_org?lang=EN&geo=AT')
if isinstance(d,str): out.append('ef_lus_org '+d[:100])
else:
    ids,size=d['id'],d['size']; out.append('ef_lus_org dims=%s size=%s n=%d'%(ids,size,len(d['value'])))
    for k in ids:
        c=d['dimension'][k]['category']; out.append('  %s: %s'%(k,str(c.get('label'))[:900]))
open('data/probe/at3.txt','w').write('\n'.join(out))
