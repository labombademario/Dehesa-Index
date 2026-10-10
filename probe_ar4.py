import json, urllib.request, urllib.parse, os, re, time, io, subprocess, sys, site
subprocess.run([sys.executable,'-m','pip','install','-q','--user','--break-system-packages','xlrd','pypdf','openpyxl'])
sys.path.append(site.getusersitepackages())
os.makedirs('probe',exist_ok=True); S=open('probe/summary_ar4.txt','w')
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
# 1 metodologia SIPM
st,b,_=get('https://www.indec.gob.ar/ftp/cuadros/economia/metodologia1_8_sipm.pdf',120); log('METOD',st,len(b))
if st==200:
    t=pdftext(b)
    for w in ['arroz','avena','centeno','cebada','colza','girasol','soja','trigo','maíz','papa','manzana','uva','leche','huevo','pollo','aves','porcino','cerdo','ovino','lana','manteca','queso','urea','fosfato','gasoil','vino','azúcar','Cereales y oleaginosas','Ganado porcino y productos de granja','Hortalizas']:
        ms=[m.group(0) for m in re.finditer(r'.{0,140}'+w+r'.{0,140}',t,re.I)][:3]
        for m in ms: log('  M',w,'::',m)
# 2 OCLA
for u in ('https://www.ocla.org.ar/','https://www.ocla.org.ar/contents/news/terminos','https://www.ocla.org.ar/contents/institucional'):
    st,b,fu=get(u); t=text(b); log('OCLA',u,st,len(b),fu)
    for m in list(re.finditer(r'.{0,200}(derechos|licencia|Creative|reproduc|citar|fuente: ocla|uso de la informaci|t[eé]rminos).{0,200}',t,re.I))[:8]: log('   ',m.group(0))
    if 'ocla.org.ar/' == u[-10:]: pass
st,b,_=get('https://www.ocla.org.ar/NewsFiles/BaseDeDatosOCLA.xlsx',180); log('OCLA xlsx',st,len(b))
if st==200: xls_dump(b,'OCLA',6)
# 3 MAGyP lecheria
for u in ('https://www.magyp.gob.ar/sitio/areas/ss_lecheria/estadisticas/','https://www.magyp.gob.ar/sitio/areas/ss_lecheria/estadisticas/_01_primaria/index.php','https://www.magyp.gob.ar/sitio/areas/ss_lecheria/estadisticas/_02_industria/index.php','https://www.magyp.gob.ar/sitio/areas/ss_lecheria/estadisticas/_03_comercio_exterior/index.php','https://www.magyp.gob.ar/sitio/areas/ss_lecheria/','https://www.magyp.gob.ar/sitio/','https://www.argentina.gob.ar/agricultura/alimentos-y-bioeconomia/lecheria','https://www.argentina.gob.ar/agricultura/lecheria/estadisticas'):
    st,b,fu=get(u); log('MAGYP',u,st,len(b),fu)
    for l in links(b,fu)[:40]: log('   L',l)
    t=text(b)
    for m in list(re.finditer(r'.{0,150}(Creative|derechos reservados|licencia).{0,150}',t,re.I))[:3]: log('   LIC',m.group(0))
    for m in re.findall(r'href="([^"]*(?:estadistic|lecher)[^"]*)"',b.decode('utf-8','replace'))[:30]: log('   A',m)
# 4 INV estadisticas
for u in ('https://www.argentina.gob.ar/inv/vinos/estadisticas','https://www.argentina.gob.ar/inv/vinos','https://www.argentina.gob.ar/inv/estadisticas','https://www.argentina.gob.ar/inv'):
    st,b,fu=get(u); log('INV',u,st,len(b),fu)
    for l in links(b,fu)[:50]: log('   L',l)
    for m in re.findall(r'href="([^"]*(?:estadistic|informe|anuario|export|elabora|cosecha)[^"]*)"',b.decode('utf-8','replace'))[:40]: log('   A',m)
time.sleep(10)
st,b,_=get('https://datos.gob.ar/api/3/action/package_search?rows=50&fq=organization:secretaria-de-agricultura-ganaderia-y-pesca&q=INV')
if st==200:
    for p in json.loads(b)['result']['results']: log('PKG INV',p['name'],'|',p['title'],'|',len(p['resources']))
S.close()
