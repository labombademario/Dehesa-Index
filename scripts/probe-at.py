import os, re, urllib.request
os.makedirs('data/probe', exist_ok=True)
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=40)
        return r.read().decode('utf8','replace')
    except Exception as e:
        return 'ERR %s'%e
h=get('https://data.statistik.gv.at/catalog.jsp')
out=[re.sub(r'\s+',' ',h)[3000:9800]]
out.append('=== terms'); out.append(re.sub(r'\s+',' ',re.sub(r'<script.*?</script>|<[^>]+>',' ',get('https://data.statistik.gv.at/?page=terms')))[:3500])
for u in ['https://www.data.gv.at/katalog/api/3/action/package_search?q=organization:statistik-austria+landwirtschaft&rows=5','https://data.statistik.gv.at/data/OGD_f1000_LW_1.csv']:
    out.append('=== '+u); out.append(get(u)[:600])
open('data/probe/at5.txt','w').write('\n'.join(out))
