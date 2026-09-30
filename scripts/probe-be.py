import urllib.request,urllib.parse,re,os,io,traceback
import openpyxl,xlrd
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=120) as r: return r.read()
R='https://statbel.fgov.be/sites/default/files/files/documents/landbouw/'
def dump(rel,maxr=12,maxc=16,sheets=None):
    u=R+rel.replace(' ','%20')
    try: b=get(u)
    except Exception as e: P('ERR',rel,e); return
    P('####',rel,len(b))
    try:
        if b[:2]==b'PK':
            wb=openpyxl.load_workbook(io.BytesIO(b),data_only=True,read_only=True)
            for ws in wb.worksheets:
                rows=list(ws.iter_rows(values_only=True)); P(' SHEET',ws.title,len(rows))
                for r in rows[:maxr]:
                    c=[(round(x,2) if isinstance(x,float) else x) for x in r[:maxc]]
                    if any(x is not None for x in c): P('   ',c)
        else:
            wb=xlrd.open_workbook(file_contents=b)
            for sh in wb.sheets():
                P(' SHEET',sh.name,sh.nrows,sh.ncols)
                for i in range(min(maxr,sh.nrows)):
                    c=[(round(x,2) if isinstance(x,float) else x) for x in sh.row_values(i)[:maxc]]
                    if any(x not in ('',None) for x in c): P('   ',c)
    except Exception: P('PARSE ERR',traceback.format_exc()[-300:])
dump('8.3 Landbouwprijzen (output- en input-)/agriprices_BY2020_STATBEL_en.xlsx',14,14)
dump('8.7 Zuivelstatistieken/milk_monthlyresults2026_en.xls',14,12)
dump('8.7 Zuivelstatistieken/milk_yearlyresults_en.xls',10,12)
dump('8.5 Slachtstatistieken/slaughtering_monthlyresults2026_STATBEL_en.xls',14,12)
dump('8.9 Pachten in de landbouw/L17_1998-2017_RESULTS_WEB_EN.xlsx',12,12)
os.makedirs('data/probe',exist_ok=True); open('data/probe/be11.txt','w').write('\n'.join(out))
