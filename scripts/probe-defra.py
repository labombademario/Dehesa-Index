import json,re,urllib.request,csv,io
def get(u): return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Dehesa-Index-data-bot/1.0'}),timeout=60).read()
api=json.loads(get('https://www.gov.uk/api/content/government/statistics/agricultural-price-indices'))
l=[x for x in sorted(set(re.findall(r'https://assets\.publishing\.service\.gov\.uk/[^"\\ ]+\.csv',json.dumps(api))))][-1]
rows=list(csv.DictReader(io.StringIO(get(l).decode('utf-8','replace'))))
cats={}
for r in rows: cats.setdefault((r['type'],r['category']),[]).append(r['date'])
out=['url '+l,'types: '+str(sorted({t for t,_ in cats}))]
for (t,c),d in cats.items():
    if t!='output' or re.search(r'milk|egg|poultry|wheat$|barley$|oilseed|pigs|cattle|sheep',c): out.append('%s|%s|n=%d|%s..%s'%(t,c,len(d),min(d),max(d)))
open('scripts/.probe-output.txt','w').write('\n'.join(out)+'\n')
