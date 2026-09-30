import urllib.request,json,io,os,collections,csv,traceback
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=120) as r: return r.read(80000000)
    except Exception as e: return b'ERR %s'%str(e).encode()
def dec(b):
    try: return b.decode('utf-8-sig')
    except Exception: return b.decode('cp1252','replace')
def rows(u):
    b=get(u)
    if b[:4]==b'ERR ': P('ERR',u,b[:200]); return []
    return [r for r in csv.reader(dec(b).splitlines(),delimiter=',') if len(r)>=9]
O='https://open-data.ble.de/dataset/'
def milk():
    R=[r for r in csv.reader(dec(get(O+'a617636f-28eb-4e6c-abb0-c45cbe8b22f1/resource/a50035d4-a14c-4677-8e65-2fc5b6c1eaf9/download/kuhmilchpreise-mengen.csv')).splitlines()) if len(r)>=11]
    P('MILK gebiete',collections.Counter(r[2] for r in R[1:]).most_common(30)); ms=[r[1][3:]+r[1][:2] for r in R[1:]]; P('MILK months',min(ms),max(ms),len(R))
    P('MILK empty price',sum(1 for r in R[1:] if not r[6].strip()))
def schlacht():
    R=rows(O+'c4eb6408-8cb2-42f9-b341-79fb57f81788/resource/214ea514-205b-4857-a78d-e254fae0983c/download/schlachtpreise-woche.csv')
    c=collections.defaultdict(lambda:[0,'9','0'])
    for r in R[1:]:
        k=(r[1],r[2],r[3],r[4],r[6],r[7]); x=c[k]; x[0]+=1; x[1]=min(x[1],r[0]); x[2]=max(x[2],r[0])
    P('SCHLACHT rows',len(R),'gebiete',collections.Counter(r[5] for r in R[1:]).most_common(40))
    for k,v in sorted(c.items()):
        if k[4] in ('€/100 kg','€/kg'): P('  ',k,v)
def fv():
    R=rows(O+'10824baf-7569-470c-95f2-c78f4facf5f1/resource/d92b81a6-af6a-482f-b1bc-0a7138bf11d1/download/marktundpreis-obstgemuese.csv')
    P('FV rows',len(R),'weeks',min(r[1] for r in R[1:]),max(r[1] for r in R[1:])); P('FV gebiete',collections.Counter(r[6] for r in R[1:]).most_common(20)); P('FV einheit',collections.Counter(r[7] for r in R[1:]).most_common(6))
    P('FV groups',collections.Counter(r[3] for r in R[1:]).most_common(40))
    cc=collections.Counter((r[3],r[4],r[2]) for r in R[1:] if r[6]=='Deutschland'); P('FV top',cc.most_common(40))
def gen():
    for t in ['61211-0001','61211-0003','61221-0003','41141-0001','41141-0002','41141-0004']:
        b=get('https://genesis.destatis.de/genesisWS/downloads/00/tables/%s_00.csv'%t); s=dec(b); L=s.splitlines(); P('GEN',t,len(b),len(L))
        for l in L[:10]+['...']+L[-3:]: P('    ',l[:260])
for f in (milk,schlacht,fv,gen):
    try: f()
    except Exception: P('ERR',f.__name__,traceback.format_exc()[-400:])
os.makedirs('data/probe',exist_ok=True); open('data/probe/de3.txt','w').write('\n'.join(out))
