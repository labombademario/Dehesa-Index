import urllib.request,json,io,os,collections
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=120) as r: return r.read(80000000)
    except Exception as e: return b'ERR %s'%str(e).encode()
def rows(u):
    b=get(u)
    if b[:4]==b'ERR ': P('ERR',u,b[:200]); return []
    try: t=b.decode('utf-8-sig')
    except Exception: t=b.decode('cp1252','replace')
    import csv
    return list(csv.reader(t.splitlines(),delimiter=';'))
O='https://open-data.ble.de/dataset/'
R=rows(O+'a617636f-28eb-4e6c-abb0-c45cbe8b22f1/resource/a50035d4-a14c-4677-8e65-2fc5b6c1eaf9/download/kuhmilchpreise-mengen.csv')
P('MILK gebiete',collections.Counter(r[2] for r in R[1:]).most_common(30)); P('MILK months',min((r[1][3:]+r[1][:2]) for r in R[1:]),max((r[1][3:]+r[1][:2]) for r in R[1:]))
P('MILK empty price cells',sum(1 for r in R[1:] if not r[6].strip()), 'of',len(R)-1)
R=rows(O+'c4eb6408-8cb2-42f9-b341-79fb57f81788/resource/214ea514-205b-4857-a78d-e254fae0983c/download/schlachtpreise-woche.csv')
c=collections.defaultdict(lambda:[0,'9','0'])
for r in R[1:]:
    k=(r[1],r[2],r[3],r[4],r[6],r[7]); x=c[k]; x[0]+=1; x[1]=min(x[1],r[0]); x[2]=max(x[2],r[0])
P('SCHLACHT gebiete',collections.Counter(r[5] for r in R[1:]).most_common(40))
P('SCHLACHT combos (tier,kat,haltung,klasse,einheit,erg): n first last')
for k,v in sorted(c.items()):
    if k[4]=='€/100 kg' or k[4]=='€/kg' or 'Stück' in k[4]: P('  ',k,v)
R=rows(O+'10824baf-7569-470c-95f2-c78f4facf5f1/resource/d92b81a6-af6a-482f-b1bc-0a7138bf11d1/download/marktundpreis-obstgemuese.csv')
P('FV weeks',min(r[1] for r in R[1:]),max(r[1] for r in R[1:])); P('FV gebiete',collections.Counter(r[6] for r in R[1:]).most_common(20)); P('FV einheit',collections.Counter(r[7] for r in R[1:]).most_common(6))
cc=collections.Counter((r[3],r[4],r[2]) for r in R[1:] if r[6]=='Deutschland'); P('FV groups',collections.Counter(r[3] for r in R[1:]).most_common(40))
P('FV top products (Verkaufsgebiet Deutschland) group,product,origin:n',cc.most_common(40))
for t in ['61211-0001','61211-0003','61221-0003','41141-0001','41141-0002','41141-0004']:
    b=get('https://genesis.destatis.de/genesisWS/downloads/00/tables/%s_00.csv'%t)
    try: s=b.decode('utf-8-sig')
    except Exception: s=b.decode('cp1252','replace')
    L=s.splitlines(); P('GEN',t,len(b),len(L)); 
    for l in L[:10]+['...']+L[-3:]: P('    ',l[:260])
os.makedirs('data/probe',exist_ok=True); open('data/probe/de3.txt','w').write('\n'.join(out))
