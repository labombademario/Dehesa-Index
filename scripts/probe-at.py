import os, re, urllib.request, urllib.parse
os.makedirs('data/probe', exist_ok=True)
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=40)
        return r.read().decode('utf8','replace')
    except Exception as e: return 'ERR %s'%e
out=[]
sm=get('https://www.ama.at/allgemein/sitemap')
links=sorted(set(re.findall(r'href="([^"#]+)"',sm)))
out.append('sitemap links %d'%len(links))
out+= [l for l in links if re.search(r'markt|statist|preis|milch|getreide|fleisch|vieh|ei|bio|obst|gem',l,re.I)][:120]
for u in ['https://www.ama.at/marktinformationen/aktuelle-marktinformationen','https://www.ama.at/fachliche-informationen/marktinformationen']:
    h=get(u); out.append('=== '+u+' '+str(len(h)))
    out+= [l for l in sorted(set(re.findall(r'href="([^"#]+)"',h))) if re.search(r'xls|csv|pdf|statist|preis|markt',l,re.I)][:60]
open('data/probe/at12.txt','w').write('\n'.join(out))
