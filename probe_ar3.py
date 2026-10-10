import json, urllib.request, urllib.parse, os, re, time, io, subprocess, sys, site
subprocess.run([sys.executable,'-m','pip','install','-q','--user','--break-system-packages','xlrd','pypdf','openpyxl'])
sys.path.append(site.getusersitepackages())
os.makedirs('probe',exist_ok=True); S=open('probe/summary_ar3.txt','w')
def log(*a): s=' '.join(str(x) for x in a); print(s,flush=True); S.write(s+'\n'); S.flush()
UA={'User-Agent':'DehesaIndex-research/1.0 (+https://dehesaindex.com)','Accept':'*/*'}
def get(u,t=90,rng=None):
    h=dict(UA)
    if rng: h['Range']='bytes=0-%d'%rng
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u,headers=h),timeout=t) as r: return r.status,r.read()
        except urllib.error.HTTPError as e:
            if e.code in (502,503,504,429): time.sleep(15*(i+1)); continue
            return e.code,e.read()[:800]
        except Exception as e: time.sleep(10)
    return 0,b'fail'
def dec(b):
    try: return b.decode('utf-8-sig')
    except UnicodeDecodeError: return b.decode('cp1252','replace')
# 1 INDEC SIPM
st,b=get('https://www.indec.gob.ar/ftp/cuadros/economia/series_sipm_dic2015.xls',180)
log('SIPM',st,len(b),b[:8])
if st==200 and len(b)>50000:
    open('probe/sipm.xls','wb').write(b)
    import xlrd
    wb=xlrd.open_workbook(file_contents=b)
    for sh in wb.sheets():
        log('\n### SHEET',sh.name,sh.nrows,sh.ncols)
        for r in range(min(sh.nrows,12)): log('  H',r,[str(sh.cell_value(r,c))[:40] for c in range(min(sh.ncols,8))])
        # labels: first text column values across rows
        for r in range(sh.nrows):
            row=[sh.cell_value(r,c) for c in range(min(sh.ncols,4))]
            txt=' | '.join(str(x)[:60] for x in row if str(x).strip())
            if txt: log('  R',r,txt[:200])
        log('  LASTROW',[str(sh.cell_value(sh.nrows-1,c))[:20] for c in range(min(sh.ncols,10))])
        log('  LASTCOLS',[str(sh.cell_value(r,sh.ncols-1))[:20] for r in range(min(sh.nrows,8))])
# 2 INDEC licencia
st,b=get('https://www.indec.gob.ar/ftp/cuadros/publicaciones/politica_difusion_indec.pdf',120)
log('POLPDF',st,len(b))
if st==200:
    from pypdf import PdfReader
    t=' '.join(p.extract_text() or '' for p in PdfReader(io.BytesIO(b)).pages); t=re.sub(r'\s+',' ',t)
    for m in re.finditer(r'.{0,400}(Creative|licencia|Atribuci|reproduc|uso comercial|BY).{0,400}',t,re.I): log('   POL',m.group(0))
# 3 CKAN packages
for name in ['inv-elaboracion-de-mostos-y-vino','inv-actividad-vitivinicola','destino-produccion-leche','estimacion-variacion-interanual-e-intermensual-produccion-leche-cruda','precios-en-surtidor','anuario-exportaciones-frutas','molienda-granos','precios-de-comercio-exterior2','actividad-agricola']:
    time.sleep(12)
    st,b=get('https://datos.gob.ar/api/3/action/package_show?id='+name)
    if st!=200: log('PKGFAIL',name,st); continue
    p=json.loads(b)['result']; log('\n=== PKG',name,'|',p.get('license_id'),'|',p.get('title'),'|',(p.get('notes') or '')[:300].replace('\n',' '))
    for r in p['resources']:
        u=r.get('url') or ''
        log('  RES',(r.get('format') or ''),'|',(r.get('name') or '')[:90],'|',u,'|',(r.get('last_modified') or '')[:10])
        if (r.get('format') or '').upper() in ('CSV','XLSX','XLS') and u:
            st2,b2=get(u,90,rng=400000 if 'surtidor' in name or 'actividad-agricola' in name else None)
            if st2 not in (200,206): log('      GETFAIL',st2); continue
            if (r.get('format') or '').upper()=='CSV':
                L=dec(b2).splitlines()
                for l in L[:3]+['...']+L[-4:]: log('      >',l[:420])
            else:
                log('      bytes',len(b2))
                try:
                    import openpyxl
                    wb=openpyxl.load_workbook(io.BytesIO(b2),read_only=True,data_only=True)
                    for ws in wb.worksheets[:4]:
                        rows=list(ws.iter_rows(values_only=True))
                        log('      SHEET',ws.title,len(rows))
                        for rr in rows[:6]+rows[-3:]: log('        ',[str(x)[:25] for x in rr[:12]])
                except Exception as e: log('      xlsx err',repr(e)[:200])
S.close()
