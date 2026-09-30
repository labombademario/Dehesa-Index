import time,urllib.request,urllib.parse,re,http.cookiejar,json,io
cj=http.cookiejar.CookieJar()
op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
def get(u,n=8000000):
    last=''
    for i in range(3):
        try:
            r=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) DehesaIndex','Accept':'*/*','Accept-Language':'fr,en'})
            with op.open(r,timeout=120) as x:
                b=x.read(n); ct=x.headers.get('content-type')
            return b,ct,x.geturl()
        except Exception as e: last='ERR %s'%e; time.sleep(5)
    return last.encode(),None,None
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
# 1) el xlsx de precios pagados a productores
g=json.loads(get('https://www.data.gouv.fr/api/1/datasets/historique-des-prix-moyens-mensuels-et-trimestriels-payes-aux-producteurs-depuis-2005-cereales-et-oleoproteagineux/')[0])
for r in g['resources']: P('RES',r['title'][:80],r['url'])
url=g['resources'][0]['url']
b,ct,fu=get(url); b0=b; P('DL',ct,len(b),fu,b[:8])
try:
    import openpyxl
    wb=openpyxl.load_workbook(io.BytesIO(b),data_only=True)
    for ws in wb.worksheets:
        P('SHEET',ws.title,ws.max_row,ws.max_column)
        for row in list(ws.iter_rows(values_only=True))[:12]: P('  ',[c for c in row[:10]])
except Exception as e: P('XLSX ERR',e)
# hojas completas
try:
    wb=openpyxl.load_workbook(io.BytesIO(b0),data_only=True)
except Exception as e: P('ERR',e)


for ws in wb.worksheets:
    P('SHEET2',ws.title,ws.max_row,ws.max_column)
    rows=list(ws.iter_rows(values_only=True))
    for k,row in enumerate(rows):
        if ws.title=='Infos' and k>=12: P('  INFO',[c for c in row if c is not None])
        elif ws.title!='Infos' and (10<=k<=16 or k>=len(rows)-3): P('  R%d'%k,[ (round(c,1) if isinstance(c,float) else c) for c in row[:24]])
# JS de la pagina Visionet: ajax
b,ct,fu=get('https://visionet.franceagrimer.fr/Pages/SeriesChronologiques.aspx?menuurl=SeriesChronologiques/productions%20vegetales/grandes%20cultures/cotations')
s=b.decode('utf-8','replace')
for m in re.finditer(r'(\.ajax|\$\.post|\$\.get|WebService|\.asmx|\.ashx|url\s*:)',s):
    P('AJAX',re.sub(r'\s+',' ',s[max(0,m.start()-150):m.start()+350])); 
    if len(out)>120: break
open('data/probe/fr4.txt','w').write('\n'.join(out))
