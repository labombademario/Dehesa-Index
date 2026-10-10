import json, urllib.request, urllib.parse, os, re, time, io, subprocess, sys, site
subprocess.run([sys.executable,'-m','pip','install','-q','--user','--break-system-packages','xlrd','pypdf','openpyxl'])
sys.path.append(site.getusersitepackages())
os.makedirs('probe',exist_ok=True); S=open('probe/summary_ar6.txt','w')
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

for q in ('sio granos','precios granos','granos precios','pizarra','camara arbitral','porcinos precios','precio capon','ovinos precios','lanar precio','aceite de oliva','olivo','colza','avena','precios agricolas','precios ganaderos','mercado agroganadero','canuelas','hacienda precios'):
    time.sleep(11)
    st,b,_=get('https://datos.gob.ar/api/3/action/package_search?rows=25&q='+urllib.parse.quote(q))
    if st!=200: log('CKAN',q,st); continue
    for p in json.loads(b)['result']['results']:
        mods=max([(r.get('last_modified') or '')[:10] for r in p.get('resources',[])] or [''])
        log('PKG',q,'|',p['name'],'|',p.get('title','')[:80],'|',(p.get('organization') or {}).get('name'),'|',p.get('license_id'),'| res',len(p.get('resources',[])),'| lastmod',mods)
for u in ('https://www.magyp.gob.ar/sitio/areas/ss_lecheria/estadisticas/_02_industrial/index.php','https://www.magyp.gob.ar/sitio/areas/ss_lecheria/'):
    st,b,fu=get(u); t=text(b); log('MAGYP tail',u,st); log('   ',t[-2500:])
    for h in sorted(set(re.findall(r'href="([^"]+)"',b.decode('utf-8','replace')))):
        if re.search(r'legal|termin|licen|aviso|condicion|privacidad|copyright',h,re.I): log('   H',h)
for u in ('https://www.argentina.gob.ar/inv/estadisticas-vitivinicolas/cosecha-y-elaboracion','https://www.argentina.gob.ar/inv/estadisticas-vitivinicolas/mercado-externo','https://www.argentina.gob.ar/inv/vinos/estadisticas/existencias'):
    st,b,fu=get(u); log('INV hrefs',u,st)
    for h in sorted(set(re.findall(r'href="([^"]+)"',b.decode('utf-8','replace')))):
        if not re.search(r'facebook|twitter|x\.com|linkedin|whatsapp|t\.me|\.css|/modules/|#',h): log('   H',h)
    for h in sorted(set(re.findall(r'(?:src|data-src)="([^"]+)"',b.decode('utf-8','replace')))):
        if re.search(r'iframe|tableau|powerbi|datastudio|lookerstudio|public\.|embed',h,re.I): log('   EMB',h)
    for m in re.findall(r'<iframe[^>]+>',b.decode('utf-8','replace')): log('   IFR',m[:300])
S.close()
