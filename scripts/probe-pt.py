import os, json, urllib.request, urllib.parse, re
os.makedirs('data/probe', exist_ok=True)
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=60)
        return r.read().decode('utf8','replace')
    except Exception as e: return 'ERR %s'%e
out=[]; seen={}
qs=['preços produtor','preços agrícolas','leite','abate','efetivo','produção de','cereais','trigo','milho','arroz','vinho','azeite','azeitona','cortiça','carne','suínos','ovinos','caprinos','aves','ovos','hortícolas','fruta','batata','superfície','explorações agrícolas','preços dos meios de produção','adubos','rações','fertilizantes','agricultura biológica','contas económicas da agricultura','rendimento agrícola','terras','arrendamento','pecuária','produção vegetal','produção animal']
for q in qs:
    for pg in (1,2,3):
        u='https://dados.gov.pt/api/1/datasets/?q=%s&page_size=50&page=%d&organization=5ae9e0e6c8d8c9146b44ccf5'%(urllib.parse.quote(q),pg)
        try: j=json.loads(get(u))
        except Exception: break
        for d in j.get('data',[]):
            org=(d.get('organization') or {}).get('name')
            if org!='Instituto Nacional de Estatística': continue
            for r in d.get('resources',[]):
                m=re.search(r'pindica\.jsp\?op=2&varcd=(\d+)',r.get('url') or '')
                if m: seen[m.group(1)]=(d.get('title'),d.get('license'))
        if len(j.get('data',[]))<50: break
out.append('ORG FILTER count %d'%len(seen))
open('data/probe/pt2.txt','w').write('\n'.join(out+['%s | %s | %s'%(k,v[0],v[1]) for k,v in sorted(seen.items())]))
for v in ['0014461','0000918','0000543']:
    open('data/probe/pt2_%s.json'%v,'w').write(get('https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&varcd=%s&lang=PT'%v)[:6000])
    open('data/probe/pt2_%s_meta.json'%v,'w').write(get('https://www.ine.pt/ine/json_indicador/pindicaMeta.jsp?varcd=%s&lang=PT'%v)[:3000])
