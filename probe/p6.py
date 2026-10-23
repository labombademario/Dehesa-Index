import urllib.request, re, io, json
import pdfplumber
UA={'User-Agent':'Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)'}
out=open('probe/out/p6.txt','w')
def w(s): out.write(s+'\n'); out.flush()
def get(u,t=120): return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t).read()
def txt(b):
    with pdfplumber.open(io.BytesIO(b)) as p: return '\n'.join((pg.extract_text() or '') for pg in p.pages), len(p.pages)
base='https://open.alberta.ca/dataset/f2432af0-cffa-4a86-9c31-74e6ec5c5afa'
try:
    h=get(base).decode('utf-8','replace')
    links=sorted(set(re.findall(r'href="(https://open\.alberta\.ca/dataset/[^"]+\.pdf)"',h)))
    w('links %d'%len(links))
    u=[l for l in links if '2026-08' in l][0]; t,n=txt(get(u)); w('## 2026-08 pages=%d\n%s'%(n,t))
    u=[l for l in links if '2026-01' in l][0]; t,n=txt(get(u)); w('## 2026-01 first lines\n'+'\n'.join(t.splitlines()[:5]))
except Exception as e: w('ERR %r'%e)
# search for other years
for q in ('farm input prices alberta','alberta farm input prices 2024','alberta farm input prices 2019','alberta farm input prices 2013'):
    try:
        j=json.loads(get('https://open.alberta.ca/api/3/action/package_search?q=%s&rows=20'%q.replace(' ','+')))
        for r in j['result']['results']: w('Q %s | %s | %s | %s'%(q,r['id'],r['title'],len(r.get('resources',[]))))
    except Exception as e: w('Q ERR %s %r'%(q,e))
# publication page
for u in ('https://open.alberta.ca/publications/0704-917x','https://open.alberta.ca/publications/0704917x'):
    try:
        h=get(u).decode('utf-8','replace'); w('PUB %s len=%d'%(u,len(h))); w(' '.join(sorted(set(re.findall(r'href="([^"]*(?:dataset|publications)/[^"]+)"',h)))[:60]))
    except Exception as e: w('PUB ERR %s %r'%(u,e))
