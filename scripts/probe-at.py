import os, re, urllib.request
os.makedirs('data/probe', exist_ok=True)
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=40)
        return r.read().decode('utf8','replace')
    except Exception as e:
        return 'ERR %s'%e
h=get('https://data.statistik.gv.at/catalog.jsp')
out=['len %d'%len(h)]
out+= sorted(set(re.findall(r'href="([^"]+)"',h)))
out.append(re.sub(r'\s+',' ',re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S))[:3000])
open('data/probe/at6.txt','w').write('\n'.join(out))
