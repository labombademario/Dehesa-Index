import os, re, urllib.request
os.makedirs('data/probe', exist_ok=True)
out=[]
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=40)
        return r.read().decode('utf8','replace')
    except Exception as e:
        return 'ERR %s'%e
h=get('https://data.statistik.gv.at/catalog.jsp')
out.append('catalog len %d'%len(h))
rows=re.findall(r'<tr.*?</tr>',h,flags=re.S)
for r in rows:
    t=re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',r)).strip()
    hr=re.findall(r'href="([^"]+)"',r)
    if re.search(r'landw|agrar|milch|schlacht|vieh|getreide|ernte|bio|preis|dünge|futter|forst|ernährung',t,re.I):
        out.append(t[:200]+' || '+' '.join(hr)[:200])
out.append('=== terms')
out.append(re.sub(r'\s+',' ',re.sub(r'<script.*?</script>|<[^>]+>',' ',get('https://data.statistik.gv.at/?page=terms')))[:2500])
out.append('=== ama marktinformation links')
h=get('https://www.ama.at/marktinformationen/')
out.append(' '.join(sorted(set(re.findall(r'href="([^"]+)"',h))))[:4000])
open('data/probe/at4.txt','w').write('\n'.join(out))
