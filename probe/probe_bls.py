import urllib.request, re
out=[]
def log(*a):
    s=' '.join(str(x) for x in a); print(s); out.append(s)
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'dehesa-index-research (labombademario@gmail.com)'}),timeout=90).read().decode('utf-8','replace')
for name in ['wp.item','pc.product']:
    try:
        t=get('https://download.bls.gov/pub/time.series/%s/%s'%(name.split('.')[0],name))
        log('FILE',name,len(t))
        for l in t.splitlines():
            if re.search(r'\brye\b|olive|grape|wine',l,re.I): log(name,l[:160])
    except Exception as e: log('FAIL',name,e)
try:
    t=get('https://download.bls.gov/pub/time.series/wp/wp.series')
    log('FILE wp.series',len(t))
    for l in t.splitlines():
        if re.search(r'rye|olive',l,re.I): log('wp.series',l[:200])
except Exception as e: log('FAIL wp.series',e)
open('probe/probe-log.txt','w').write('\n'.join(out)+'\n')
