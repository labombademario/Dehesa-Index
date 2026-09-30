import os, re, urllib.request
os.makedirs('data/probe', exist_ok=True)
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=40)
        return r.read().decode('utf8','replace')
    except Exception as e:
        return 'ERR %s'%e
out=[]
h=get('https://data.statistik.gv.at/web/catalog.jsp')
out.append('catalog len %d'%len(h))
rows=re.findall(r'<(?:tr|li|div)[^>]*>.*?</(?:tr|li|div)>',h,flags=re.S)
txt=re.sub(r'\s+',' ',re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S))
out.append(' '.join(sorted(set(re.findall(r'href="([^"]+)"',h))))[:6000])
for m in re.finditer(r'(?i)(landw|agrar|milch|schlacht|vieh|getreide|ernte|düng|bio)',txt):
    out.append(txt[max(0,m.start()-120):m.end()+120]); 
    if len(out)>60: break
open('data/probe/at7.txt','w').write('\n'.join(out))
