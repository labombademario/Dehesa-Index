import json, urllib.request, urllib.parse, os, re, time, io, subprocess, sys, site
subprocess.run([sys.executable,'-m','pip','install','-q','--user','--break-system-packages','xlrd','pypdf','openpyxl'])
sys.path.append(site.getusersitepackages())
os.makedirs('probe',exist_ok=True); S=open('probe/summary_ar10.txt','w')
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

import csv
for u in ('https://www.magyp.gob.ar/sitio/areas/aves/estadistica/','https://www.magyp.gob.ar/sitio/areas/porcinos/estadistica/','https://www.magyp.gob.ar/sitio/areas/ovinos/estadistica/','https://www.magyp.gob.ar/sitio/areas/ovinos/'):
    st,b,fu=get(u,40); log('PAGE',u,st,fu)
    for h in sorted(set(re.findall(r'(?:href|src)=["\']([^"\']+)["\']',b.decode('utf-8','replace')))):
        if not re.search(r'\.(css|js|png|jpg|gif|ico|svg)$|facebook|twitter|google|argentina\.gob\.ar/(jefatura|agricultura/sub)',h): log('   H',urllib.parse.urljoin(fu,h))
time.sleep(10)
st,b,_=get('https://datos.gob.ar/api/3/action/package_show?id=estimaciones-agricolas')
if st==200:
    p=json.loads(b)['result']
    for r in p['resources']:
        log('RES',r.get('format'),r.get('url'))
        if (r.get('format') or '').upper()=='CSV' and 'estimaciones-agricolas' in (r.get('url') or ''):
            st2,b2,_=get(r['url'],180)
            rd=list(csv.reader(io.StringIO(b2.decode('utf-8-sig','replace'))))
            hd=rd[0]; log('HEAD',hd)
            ic=[i for i,h in enumerate(hd) if 'cultivo' in h.lower()]; ia=[i for i,h in enumerate(hd) if 'anio' in h.lower() or 'campa' in h.lower()]
            if ic and ia:
                from collections import defaultdict
                mx=defaultdict(str)
                for row in rd[1:]:
                    if len(row)>max(ic[0],ia[0]): mx[row[ic[0]]]=max(mx[row[ic[0]]],row[ia[0]])
                for k,v in sorted(mx.items()): log('   CULT',k,v)
            break
from pypdf import PdfReader
for u in ('https://www.argentina.gob.ar/sites/default/files/2018/10/comercializacion_mercado_externo_agosto_2026.pdf','https://www.argentina.gob.ar/sites/default/files/2018/10/anuario_cosecha_y_elaboracion_2025.pdf'):
    st,b,_=get(u,120); log('PDF',u,st,len(b))
    if st==200:
        R=PdfReader(io.BytesIO(b)); log('  pages',len(R.pages))
        for i,pg in enumerate(R.pages[:5]):
            t=pg.extract_text() or ''; log('  ---page',i); log(t[:2500])
S.close()
