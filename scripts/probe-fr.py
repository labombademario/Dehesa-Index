import time,urllib.request,urllib.parse,re,http.cookiejar,json,io
import openpyxl
cj=http.cookiejar.CookieJar()
op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
def req(u,data=None,raw=False,n=30000000):
    last=''
    for i in range(3):
        try:
            d=urllib.parse.urlencode(data).encode() if data else None
            r=urllib.request.Request(u,data=d,headers={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) DehesaIndex','Accept':'*/*','Accept-Language':'fr,en'})
            with op.open(r,timeout=120) as x: b=x.read(n)
            return b if raw else b.decode('utf-8','replace')
        except Exception as e: last='ERR %s'%e; time.sleep(4)
    return last.encode() if raw else last
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
B='https://visionet.franceagrimer.fr/Pages/'
def listing(menu,root='SeriesChronologiques'):
    req(B+'SeriesChronologiques.aspx?menuurl='+urllib.parse.quote(menu))
    r=req(B+'SeriesChronologiquesDetail.aspx',dict(niveau='1',dossierRacine=root,menuId='',menuTitre=menu.split('/')[-1],menuUrl=menu,niveauMax='4'))
    # titulos + ficheros
    rows=re.findall(r'fileurl=([^"\'&<> ]+)',r)
    return list(dict.fromkeys(urllib.parse.unquote(x) for x in rows)),r
def dump(fileurl,maxrows=14):
    u=B+'OpenDocument.aspx?fileurl='+urllib.parse.quote(fileurl)+'&telechargersanscomptage=oui'
    b=req(u,raw=True); P('DL',fileurl[-70:],len(b),b[:4])
    if fileurl.endswith('.xlsx'):
        try:
            wb=openpyxl.load_workbook(io.BytesIO(b),data_only=True)
            for ws in wb.worksheets:
                P(' SHEET',ws.title,ws.max_row,ws.max_column)
                for k,row in enumerate(ws.iter_rows(values_only=True)):
                    if k>=maxrows: break
                    P('   ',[ (round(c,2) if isinstance(c,float) else c) for c in row[:14]])
        except Exception as e: P(' ERR',e)

for sm in ['productions animales','productions vegetales','produits transformes','multi-filieres','contexte economique']:
    h=req(B+'SeriesChronologiques.aspx?sousmenu='+urllib.parse.quote(sm))
    ms=list(dict.fromkeys(re.findall(r'menuurl="([^"]+)"',h)))
    P('#### SOUSMENU',sm,len(h),len(ms))
    for m in ms[:120]: P('  M',m)
# hojas de la sintesis de carnes
b=req(B+'OpenDocument.aspx?fileurl='+urllib.parse.quote('SeriesChronologiques/productions animales/viandes/séries hebdomadaires/synthèse toutes espèces/SCR-VIA-SYNTHESE_COT_NAT_HEBDO-A26.xlsx')+'&telechargersanscomptage=oui',raw=True)
wb=openpyxl.load_workbook(io.BytesIO(b),data_only=True)
P('#### SYNTH SHEETS',len(wb.worksheets))
for ws in wb.worksheets:
    rows=list(ws.iter_rows(values_only=True))
    hdr=[r for r in rows[:6] if r and r[0]]
    P(' SH',ws.title,ws.max_row,'|',str(rows[0][0])[:150].replace('\n',' '),'| first',[c for c in rows[[k for k,r in enumerate(rows) if hasattr(r[0],'year')][0]][:3]] if any(hasattr(r[0],'year') for r in rows) else '', '| last',[c for c in [r for r in rows if r and hasattr(r[0],'year')][-1][:3]] if any(hasattr(r[0],'year') for r in rows) else '')
# notas de la hoja Publication nacional de precios pagados
g=json.loads(req('https://www.data.gouv.fr/api/1/datasets/historique-des-prix-moyens-mensuels-et-trimestriels-payes-aux-producteurs-depuis-2005-cereales-et-oleoproteagineux/'))
b=req(g['resources'][0]['url'],raw=True)
wb=openpyxl.load_workbook(io.BytesIO(b),data_only=True)
P('#### PAGADOS SHEETS',[w.title for w in wb.worksheets])
ws=wb['Publication nationale']
for k,row in enumerate(ws.iter_rows(values_only=True)):
    if k>=96 or k<10:
        c=[x for x in row if x is not None]
        if c: P('  R%d'%k,[ (round(x,1) if isinstance(x,float) else x) for x in c][:14])
open('data/probe/fr8.txt','w').write('\n'.join(out))
