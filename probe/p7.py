import urllib.request, re, io, json
import pdfplumber
UA={'User-Agent':'Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)'}
out=open('probe/out/p7.txt','w')
def w(s): out.write(s+'\n'); out.flush()
def get(u,t=120): return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t).read()
ids={'2025':'fb5fbe3d-5d6b-4603-b6ab-8e44c6c8e258','2024':'2acf92e7-f5c5-410e-b517-0a49c1ed2ed2','2021':'bf01c8c7-1ea8-40ce-a193-9fe1d51d9417','2019':'23f0bcb4-e5a8-4f1e-a4b2-25feb906dfae','2013':'0365b41b-843f-4902-a70c-d6e0cb3708f4'}
first={}
for y,i in ids.items():
    try:
        j=json.loads(get('https://open.alberta.ca/api/3/action/package_show?id='+i))['result']
        w('## %s %s lic=%s'%(y,j['title'],j.get('license_title')))
        for r in j['resources']: w('  %s | %s | %s'%(r.get('format'),r.get('name'),r.get('url')))
        first[y]=j['resources']
    except Exception as e: w('ERR %s %r'%(y,e))
def show(y,idx):
    r=first[y][idx]; u=r['url']; b=get(u)
    w('### %s %s %d bytes'%(y,u,len(b)))
    if u.lower().endswith('.pdf'):
        with pdfplumber.open(io.BytesIO(b)) as p: t='\n'.join((pg.extract_text() or '') for pg in p.pages); w('pages %d'%len(p.pages))
        w(t[:2500])
    elif u.lower().endswith(('.xlsx','.xls')):
        import openpyxl
        wb=openpyxl.load_workbook(io.BytesIO(b),data_only=True)
        for ws in wb.worksheets[:3]:
            w('sheet %s %s'%(ws.title,ws.dimensions))
            for row in list(ws.iter_rows(values_only=True))[:14]: w(str(row)[:300])
for y in ('2025','2021','2013'):
    try:
        for k,r in enumerate(first[y]):
            if r['url'].lower().endswith(('.pdf','.xlsx')): show(y,k); break
    except Exception as e: w('showERR %s %r'%(y,e))
