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
import xlrd
def dumpxls(fileurl,maxrows=14):
    u=B+'OpenDocument.aspx?fileurl='+urllib.parse.quote(fileurl)+'&telechargersanscomptage=oui'
    b=req(u,raw=True); P('DLXLS',fileurl[-60:],len(b),b[:4])
    wb=xlrd.open_workbook(file_contents=b)
    for sh in wb.sheets():
        P(' SHEET',sh.name,sh.nrows,sh.ncols)
        for k in range(min(maxrows,sh.nrows)): P('   ',[ (round(c,2) if isinstance(c,float) else c) for c in sh.row_values(k)[:14]])
        if sh.nrows>maxrows:
            for k in range(sh.nrows-3,sh.nrows): P('   END',[ (round(c,2) if isinstance(c,float) else c) for c in sh.row_values(k)[:14]])
dumpxls('SeriesChronologiques/productions vegetales/grandes cultures/cotations/SCR-COT-CER_FR-A26.xls',18)
dump('SeriesChronologiques/productions animales/viandes/séries hebdomadaires/synthèse toutes espèces/SCR-VIA-SYNTHESE_COT_NAT_HEBDO-A26.xlsx',14)
dump('SeriesChronologiques/productions animales/viandes/gros bovins entrée abattoir/COT-VRO-GBEA-A26.xlsx',10)
open('data/probe/fr7.txt','w').write('\n'.join(out))
