import os, io, csv, json, zipfile, urllib.request
os.makedirs('data/probe', exist_ok=True)
WDS="https://www150.statcan.gc.ca/t1/wds/rest/"
UA={"User-Agent":"Dehesa-Index-data-bot/1.0","Content-Type":"application/json"}
def call(p):
    with urllib.request.urlopen(urllib.request.Request(WDS+p,headers=UA),timeout=120) as r: return json.loads(r.read())
out=[]
IDS=[32100359,32100007,32100013,32100351,32100352,32100130,32100160,32100129,32100113,32100480,32100121,32100122,32100117,32100125,32100126,32100045,32100046,32100052,32100049,32100098,18100258,32100036,32100038,32100139,32100200]
for pid in IDS:
    try:
        info=call("getFullTableDownloadCSV/%d/en"%pid)
        raw=urllib.request.urlopen(urllib.request.Request(info["object"],headers={"User-Agent":UA["User-Agent"]}),timeout=300).read()
        z=zipfile.ZipFile(io.BytesIO(raw)); name=[n for n in z.namelist() if n.endswith('.csv') and 'MetaData' not in n][0]
        rd=csv.reader(io.TextIOWrapper(z.open(name),encoding='utf-8-sig'))
        hdr=next(rd); out.append('=== %d size=%dKB cols=%s'%(pid,len(raw)//1024,hdr))
        uniq={h:{} for h in hdr if h not in('REF_DATE','VALUE','VECTOR','COORDINATE','STATUS','SYMBOL','TERMINATED','DECIMALS','SCALAR_ID','UOM_ID','DGUID')}
        n=0; last=''
        ix={h:i for i,h in enumerate(hdr)}
        for r in rd:
            n+=1; last=max(last,r[0])
            for h,d in uniq.items():
                if len(d)<60: d[r[ix[h]]]=1
        out.append('rows=%d last=%s'%(n,last))
        for h,d in uniq.items():
            if h in('GEO',): out.append('  GEO: %s'%list(d)[:14])
            else: out.append('  %s (%d): %s'%(h,len(d),list(d)[:40]))
    except Exception as e: out.append('=== %d ERR %s'%(pid,e))
open('data/probe/ca2.txt','w').write('\n'.join(out))
