import os, re, urllib.request
os.makedirs('data/probe', exist_ok=True)
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=40)
        return r.read().decode('utf8','replace')
    except Exception as e: return 'ERR %s'%e
out=[]
B='https://www.ama.at'
for p in ['/allgemein/veroeffentlichungen/open-data/dokumentenliste-open-data','/allgemein/ueber-die-ama/ogd-open-government-data','/marktinformationen/rinder/marktbericht','/marktinformationen/preise-monitoring-indizes/marktbericht-kompakt','/marktinformationen/preistransparenz','/marktinformationen/milch-und-milchprodukte/marktbericht','/marktinformationen/dashboard']:
    h=get(B+p); out.append('=== %s len %d'%(p,len(h)))
    out.append(re.sub(r'\s+',' ',re.sub(r'<script.*?</script>|<style.*?</style>|<[^>]+>',' ',h))[300:1300])
    out+=['  LINK '+l for l in sorted(set(re.findall(r'href="([^"#]+\.(?:xlsx?|csv|pdf|zip|json)[^"]*)"',h)))][:25]
open('data/probe/at13.txt','w').write('\n'.join(out))
