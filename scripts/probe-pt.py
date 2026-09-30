import os, json, urllib.request, urllib.parse, re
os.makedirs('data/probe', exist_ok=True)
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=60)
        return r.read().decode('utf8','replace')
    except Exception as e: return 'ERR %s'%e
out=[]
# data.gov CKAN search (dados.gov.pt)
for q in ['preços agrícolas produtor','produção de leite','índice de preços agrícolas','abate de animais','efetivo bovino','produção vegetal','preços no produtor']:
    u='https://dados.gov.pt/api/1/datasets/?q=%s&page_size=12'%urllib.parse.quote(q)
    out.append('=== '+q)
    try:
        for d in json.loads(get(u)).get('data',[]):
            org=(d.get('organization') or {}).get('name')
            out.append('- %s | %s | %s | lic=%s'%(d.get('id'),d.get('title'),org,d.get('license')))
            for r in d.get('resources',[])[:3]: out.append('     res %s | %s | %s'%(r.get('title'),r.get('format'),r.get('url')))
    except Exception as e: out.append(str(e))
for u in ['https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&varcd=0008206&lang=PT','https://www.ine.pt/ine/json_indicador/pindicaMeta.jsp?varcd=0008206&lang=EN']:
    out.append('=== '+u); out.append(get(u)[:1500])
open('data/probe/pt1.txt','w').write('\n'.join(out))
