import urllib.request, re, io, json
UA={'User-Agent':'Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)'}
out=open('probe/out/p5.txt','w')
def w(s): out.write(s+'\n'); out.flush()
def get(u,t=120):
    r=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t); return r.read()
# AAFC slaughter JSON
for n,u in (('slaughter-weekly','https://od-do.agr.gc.ca/WeeklyRedMeatSlaughter_AbattageAnimauxViandeRougeHebdomadaire.json'),):
    try:
        b=get(u); j=json.loads(b); w('## %s len=%d type=%s n=%d'%(n,len(b),type(j).__name__,len(j)))
        rows=j if isinstance(j,list) else next(v for v in j.values() if isinstance(v,list))
        w(' first: %s'%json.dumps(rows[0])[:400]); w(' last: %s'%json.dumps(rows[-1])[:400])
        ks=list(rows[0]); 
        for k in ks[:8]:
            vals=sorted({str(r.get(k)) for r in rows})
            w('  %s: %d distinct, e.g. %s .. %s'%(k,len(vals),vals[:4],vals[-2:]))
    except Exception as e: w('## %s ERR %r'%(n,e))
# AAFC monthly dataset page -> resource links
try:
    t=get('https://open.canada.ca/data/en/dataset/43ea3719-f2ea-4c30-91d2-c8cf9b9b1cef').decode('utf-8','replace'); w('## monthly page links: '+' | '.join(sorted(set(re.findall(r'href="(https?://od-do[^"]+)"',t)))[:6]))
except Exception as e: w('monthly page ERR %r'%e)
# Ontario CKAN
for ds in ('average-weekly-cattle-prices','average-weekly-hog-prices','average-weekly-corn-prices','average-weekly-soybean-prices','average-weekly-winter-wheat-prices'):
    try:
        j=json.loads(get('https://data.ontario.ca/api/3/action/package_show?id=%s'%ds))['result']
        w('## %s lic=%s upd=%s'%(ds,j.get('license_title'),j.get('metadata_modified'))); 
        for r in j['resources'][:6]: w('   %s | %s | %s'%(r.get('format'),r.get('name'),r.get('url')))
    except Exception as e: w('## %s ERR %r'%(ds,e))
# Alberta farm input prices: latest PDF
try:
    t=get('https://open.alberta.ca/publications/0704-917x').decode('utf-8','replace')
    links=sorted(set(re.findall(r'href="(https://open\.alberta\.ca/dataset/[^"]+monthly-farm-input-prices-\d{4}-\d{2}\.pdf)"',t)),key=lambda u:u[-11:])
    w('## alberta pdfs: %d, months %s'%(len(links),[l[-11:-4] for l in links]))
    import subprocess; open('/tmp/ab.pdf','wb').write(get(links[-1])); w(' latest: '+links[-1])
    try:
        import pdfplumber
        with pdfplumber.open('/tmp/ab.pdf') as p:
            w(' pages=%d'%len(p.pages))
            for pg in p.pages[:2]: w(pg.extract_text()[:2500])
    except Exception as e: w(' pdfplumber ERR %r'%e)
except Exception as e: w('## alberta ERR %r'%e)
# Manitoba weekly max year
try:
    import openpyxl; wb=openpyxl.load_workbook(io.BytesIO(get('https://gov.mb.ca/agriculture/markets-and-statistics/crop-statistics/pubs/manitoba-markets-crops-prices-weekly.xlsx')),read_only=True,data_only=True)
    ws=wb.worksheets[0]; ys=set(); crops=set(); last=None
    for i,r in enumerate(ws.iter_rows(values_only=True)):
        if i==0: continue
        ys.add(r[0]); crops.add((r[4],r[3],r[6])); last=(r[0],r[1],r[2])
    w('## MB weekly years %s..%s last=%s crops=%d'%(min(ys),max(ys),last,len(crops))); w('  '+'; '.join(sorted(map(str,crops)))[:1800])
except Exception as e: w('## MB ERR %r'%e)
