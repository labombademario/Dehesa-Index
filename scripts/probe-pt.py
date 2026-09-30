import os, json, urllib.request, urllib.parse, re
os.makedirs('data/probe', exist_ok=True)
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=60)
        return r.read().decode('utf8','replace')
    except Exception as e: return 'ERR %s'%e
seen={}
qs=['preços produtor','preços agrícolas','índice de preços de produtos agrícolas','leite','abate','abates','efetivo','produção de','cereais','trigo','milho','arroz','vinho','azeite','azeitona','cortiça','carne','suínos','ovinos','caprinos','aves','ovos','hortícolas','fruta','batata','superfície','explorações agrícolas','meios de produção','adubos','rações','fertilizantes','agricultura biológica','contas económicas da agricultura','rendimento agrícola','pecuária','produção vegetal','produção animal','preços de bens e serviços de consumo corrente na agricultura','índice de preços de bens e serviços','gado','frango','vacas','bovinos','pastagens','floresta','pecuário']
for q in qs:
    for pg in (1,2,3,4):
        u='https://dados.gov.pt/api/1/datasets/?q=%s&page_size=50&page=%d'%(urllib.parse.quote(q),pg)
        try: j=json.loads(get(u))
        except Exception: break
        for d in j.get('data',[]):
            org=(d.get('organization') or {}).get('name')
            if org!='Instituto Nacional de Estatística': continue
            for r in d.get('resources',[]):
                m=re.search(r'pindica\.jsp\?op=2&varcd=(\d+)',r.get('url') or '')
                if m: seen[m.group(1)]=(d.get('title'),d.get('license'))
        if len(j.get('data',[]))<50: break
open('data/probe/pt3.txt','w').write('count %d\n'%len(seen)+'\n'.join('%s | %s | %s'%(k,v[0],v[1]) for k,v in sorted(seen.items())))
