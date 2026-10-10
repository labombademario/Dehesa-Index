import json, urllib.request, urllib.parse, os, re, time, io, subprocess, sys, site
subprocess.run([sys.executable,'-m','pip','install','-q','--user','--break-system-packages','xlrd','pypdf','openpyxl'])
sys.path.append(site.getusersitepackages())
os.makedirs('probe',exist_ok=True); S=open('probe/summary_ar5.txt','w')
def log(*a): s=' '.join(str(x) for x in a); print(s,flush=True); S.write(s+'\n'); S.flush()
UA={'User-Agent':'Mozilla/5.0 (compatible; DehesaIndex-research/1.0; +https://dehesaindex.com)','Accept':'*/*'}
def get(u,t=90):
    for i in range(2):
        try:
            with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t) as r: return r.status,r.read(),r.geturl()
        except urllib.error.HTTPError as e:
            if e.code in (502,503,504,429): time.sleep(15); continue
            return e.code,e.read()[:800],u
        except Exception as e: time.sleep(5); err=repr(e)
    return 0,b'fail',u
def text(b): t=re.sub(rb'<script.*?</script>',b' ',b,flags=re.S); t=re.sub(rb'<[^>]+>',b' ',t); return re.sub(r'\s+',' ',t.decode('utf-8','replace'))
def links(b,base,rx=r'\.(xlsx?|csv|zip|pdf)'):
    out=[]
    for h in re.findall(rb'href="([^"]+)"',b):
        h=h.decode('utf-8','replace')
        if re.search(rx,h,re.I): out.append(urllib.parse.urljoin(base,h))
    return sorted(set(out))
def pdftext(b):
    from pypdf import PdfReader
    return re.sub(r'\s+',' ',' '.join(p.extract_text() or '' for p in PdfReader(io.BytesIO(b)).pages))
def xls_dump(b,nm,maxr=8):
    try:
        if b[:4]==b'PK\x03\x04':
            import openpyxl; wb=openpyxl.load_workbook(io.BytesIO(b),read_only=True,data_only=True)
            for ws in wb.worksheets[:25]:
                rows=list(ws.iter_rows(values_only=True)); log('   SHEET',nm,'|',ws.title,len(rows))
                for rr in rows[:maxr]+rows[-3:]: 
                    v=[str(x)[:22] for x in rr[:14] if x is not None]
                    if v: log('      ',v)
        else:
            import xlrd; wb=xlrd.open_workbook(file_contents=b)
            for sh in wb.sheets()[:25]:
                log('   SHEET',nm,'|',sh.name,sh.nrows,sh.ncols)
                for r in list(range(min(sh.nrows,maxr)))+list(range(max(0,sh.nrows-3),sh.nrows)):
                    v=[str(sh.cell_value(r,c))[:22] for c in range(min(sh.ncols,14)) if str(sh.cell_value(r,c)).strip()]
                    if v: log('      ',v)
    except Exception as e: log('   xls err',repr(e)[:200])

B='https://www.magyp.gob.ar/sitio/areas/ss_lecheria/estadisticas/'
pages=[B+x for x in ('_02_industrial/index.php','existencias/index.php','_05_externo/index.php','_04_interno/index.php','balance/index.php','_03_precios/index.php')]
I='https://www.argentina.gob.ar/inv/'
pages+=[I+x for x in ('estadisticas-vitivinicolas/cosecha-y-elaboracion','estadisticas-vitivinicolas/mercado-externo','estadisticas-vitivinicolas/importaciones','vinos/estadisticas/existencias','estadisticas-vitivinicolas/principales-datos-vitivinicolas','vinos/estadisticas/estadisticas-varias')]
seen=set()
for u in pages:
    st,b,fu=get(u); t=text(b); log('\n#### PAGE',u,st,len(b))
    for m in list(re.finditer(r'.{0,160}(Creative|derechos reservados|licenciad).{0,160}',t,re.I))[:2]: log('   LIC',m.group(0))
    log('   TXT',t[:200])
    ls=[l for l in links(b,fu,r'\.(xlsx?|csv|zip)') if l not in seen]
    for l in links(b,fu,r'\.(xlsx?|csv|zip|pdf)')[:60]: log('   L',l)
    for l in ls[:14]:
        seen.add(l)
        st2,b2,_=get(l,120); log('  >> FILE',l,st2,len(b2))
        if st2==200 and l.lower().endswith(('xls','xlsx')): xls_dump(b2,l.rsplit('/',1)[-1],7)
        elif st2==200 and l.lower().endswith('csv'):
            L=b2.decode('utf-8','replace').splitlines()
            for x in L[:4]+L[-3:]: log('      >',x[:300])
S.close()
