import os, json, urllib.request, urllib.parse
os.makedirs('data/probe', exist_ok=True)
def get(u):
    try: return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=90).read().decode('utf8','replace')
    except Exception as e: return 'ERR %s'%e
out=[]; seen=set()
for q in ['iSIP','Sistema de Identificação Parcelar','IFAP parcelas','ocupação cultural','culturas declaradas IFAP','ocupação do solo IFAP']:
    j=get('https://dados.gov.pt/api/1/datasets/?q=%s&page_size=20'%urllib.parse.quote(q))
    try: data=json.loads(j).get('data',[])
    except Exception: out.append(q+' '+j[:200]); continue
    for d in data:
        org=(d.get('organization') or {}).get('name','')
        if d['id'] in seen or 'IFAP' not in org and 'Financiamento' not in org: continue
        seen.add(d['id'])
        out.append('%s | %s | %s | lic=%s | updated %s'%(d['id'],d.get('title'),org,d.get('license'),d.get('last_modified')))
        out.append('   '+(d.get('description') or '')[:300].replace('\n',' '))
        for r in d.get('resources',[]):
            out.append('   RES %s | %s | %s | %s bytes | %s'%(r.get('title'),r.get('format'),r.get('filesize'),r.get('filesize'),r.get('url')))
open('data/probe/pt6.txt','w').write('\n'.join(out))
