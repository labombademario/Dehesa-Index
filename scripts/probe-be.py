import urllib.request,re,os,io
import openpyxl
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=120) as r: return r.read()
h=get('https://statbel.fgov.be/en/open-data').decode('utf-8','replace')
t=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S); t=re.sub(r'<[^>]+>',' ',t); t=re.sub(r'\s+',' ',t)
for m in re.finditer(r'commercial',t): P('LIC',t[max(0,m.start()-500):m.end()+500]); break
for m in re.finditer(r'(?i)source|cite|citation|reference the',t[:200000]): pass
b=get('https://statbel.fgov.be/sites/default/files/files/documents/landbouw/8.3%20Landbouwprijzen%20%28output-%20en%20input-%29/agriprices_BY2020_STATBEL_en.xlsx')
wb=openpyxl.load_workbook(io.BytesIO(b),data_only=True,read_only=True)
for ws in wb.worksheets:
    rows=[list(r) for r in ws.iter_rows(values_only=True)]
    P('SHEET',ws.title,len(rows),'maxcols',max(len(r) for r in rows))
    P('HEADER',rows[0])
    # filas con cabecera (col0 None y resto años)
    for i,r in enumerate(rows):
        if r and r[0] in (None,'') and any(isinstance(x,(int,float,str)) for x in r[1:3]) and i>0 and i<len(rows): P('  HDRROW',i,r[:20])
    labs=[r[0] for r in rows if r and r[0]]; P('NLABELS',len(labs)); 
    for i,r in enumerate(rows[:40]): P('  R',i,[x if not isinstance(x,float) else round(x,1) for x in r[:3]],'...',[x if not isinstance(x,float) else round(x,1) for x in r[-4:]])
    if ws.title=='output':
        for i in range(60,len(rows),220): P('  MID',i,[x if not isinstance(x,float) else round(x,1) for x in rows[i][:4]],'...',[x if not isinstance(x,float) else round(x,1) for x in rows[i][-3:]])
open('data/probe/be12.txt','w').write('\n'.join(out))
