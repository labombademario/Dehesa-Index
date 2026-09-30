import os, json, urllib.request
os.makedirs('data/probe', exist_ok=True)
out=[]
for v in ['0013162','0000709']:
    try:
        j=None
        for t in range(3):
            try:
                j=json.load(urllib.request.urlopen(urllib.request.Request('https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&lang=EN&varcd='+v,headers={'User-Agent':'Mozilla/5.0'}),timeout=200))[0]; break
            except Exception as e: out.append('try %d %s'%(t,e))
        if j is None: continue
        out.append('%s %s'%(v,j['IndicadorDsg']))
        seen={}
        for k,l in j['Dados'].items():
            for r in l: seen.setdefault((r.get('geocod'),r.get('geodsg')),set()).add(r.get('dim_3_t'))
        for g,c in sorted(seen.items(), key=lambda x:str(x)): out.append('  %s -> %s'%(g,sorted(c)[:6]))
    except Exception as e: out.append('%s ERR %s'%(v,e))
open('data/probe/pt5.txt','w').write('\n'.join(out))
