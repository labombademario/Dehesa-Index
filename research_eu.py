import urllib.request, urllib.error, urllib.parse, os, json, re
os.makedirs('research_out', exist_ok=True)
UA='Mozilla/5.0 (compatible; DehesaIndexBot/1.0; +https://dehesaindex.com)'
log=[]
def get(n,u,data=None,hdr=None,keep=6000000):
    rec={'name':n,'url':u}
    try:
        h={'User-Agent':UA,'Accept':'*/*'}
        if hdr:h.update(hdr)
        with urllib.request.urlopen(urllib.request.Request(u,data=data,headers=h),timeout=120) as f:
            b=f.read(40000000); rec.update(status=f.status,bytes=len(b),ctype=f.headers.get('Content-Type'),final=f.geturl())
            open('research_out/r6_%s.bin'%n,'wb').write(b[:keep]); log.append(rec); print(n,f.status,len(b),flush=True); return b
    except urllib.error.HTTPError as e:
        rec.update(status=e.code,head=(e.read(300) or b'').decode('utf8','replace'))
    except Exception as e: rec.update(status=None,err=repr(e)[:200])
    print(n,rec.get('status'),rec.get('err'),flush=True); log.append(rec)
B='https://www.rvo.nl/sites/default/files/'
for n,p in [('prijs_varkens','2026-09/Prijswaarneming-vleesvarkens-en-biggen-tm-week-39.xlsx'),('prijs_runderen','2026-09/Prijswaarneming-runderen-tm-week-39-2026.xlsx'),('prijs_kalveren','2026-09/Prijswaarneming-vleeskalveren-tm-week-39-2026.xlsx'),('slacht_varkens','2026-09/Varkensslachtingen-tm-week-39-2026.xlsx'),('slacht_runderen','2026-09/Runderslachtingen-tm-week-39-2026.xlsx'),('melkontvangst','2026-09/Melkontvangst-Nederland-tm-augustus-2026.xlsx'),('melkaanvoer','2026-09/Nederlandse-melkaanvoer-en-productie-tm-juli-2026.xlsx')]: get(n,B+p)
rows=0
for y in range(1994,2027):
    b=get('cbs85636_%d'%y,"https://opendata.cbs.nl/ODataApi/odata/85636NED/TypedDataSet?$filter=Perioden%%20eq%%20%%27%dJJ00%%27"%y)
for y in range(2000,2027):
    get('cbs80780_%d'%y,"https://opendata.cbs.nl/ODataApi/odata/80780NED/TypedDataSet?$filter=Perioden%%20eq%%20%%27%dJJ00%%27"%y)
get('cbs_periods_85636','https://opendata.cbs.nl/ODataApi/odata/85636NED/Perioden')
for q in ['Cere%27Obs','%C3%A9tat+des+cultures+bl%C3%A9+tendre','cereobs+orge','FranceAgriMer+%C3%A9tat+des+cultures','Cere%27Obs+bl%C3%A9']:
    get('fr_dg_'+re.sub(r'\W','_',q),'https://www.data.gouv.fr/api/1/datasets/?q=%s&page_size=10'%q,keep=300000)
json.dump(log,open('research_out/_log6.json','w'),indent=1,ensure_ascii=False)
