import urllib.request, json, io, zipfile, csv, collections
UA={'User-Agent':'Dehesa-Index-data-bot/1.0','Content-Type':'application/json'}
out=open('probe/out/p8.txt','w')
def w(s): out.write(s+'\n'); out.flush()
def tbl(pid):
    info=json.loads(urllib.request.urlopen(urllib.request.Request('https://www150.statcan.gc.ca/t1/wds/rest/getFullTableDownloadCSV/%d/en'%pid,headers=UA),timeout=60).read())
    raw=urllib.request.urlopen(urllib.request.Request(info['object'],headers={'User-Agent':UA['User-Agent']}),timeout=300).read()
    z=zipfile.ZipFile(io.BytesIO(raw)); n=[x for x in z.namelist() if x.endswith('.csv') and 'MetaData' not in x][0]
    return list(csv.DictReader(io.TextIOWrapper(z.open(n),encoding='utf-8-sig')))
for pid in (16100017,18100004,18100265,32100107,18100268):
    try:
        rows=tbl(pid); w('## %d rows=%d cols=%s'%(pid,len(rows),list(rows[0])))
        dims=[c for c in rows[0] if c not in ('REF_DATE','DGUID','UOM_ID','SCALAR_ID','VECTOR','COORDINATE','VALUE','STATUS','SYMBOL','TERMINATED','DECIMALS')]
        for c in dims:
            vals=collections.Counter(r[c] for r in rows)
            w('  %s: %d distinct%s'%(c,len(vals),'' if len(vals)>60 else ' -> '+' | '.join(list(vals)[:80])))
        w('  sample: %s'%json.dumps(rows[-1])[:500])
        w('  periods %s .. %s'%(min(r['REF_DATE'] for r in rows),max(r['REF_DATE'] for r in rows)))
    except Exception as e: w('## %d ERR %r'%(pid,e))
