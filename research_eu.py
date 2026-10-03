import urllib.request, urllib.error, urllib.parse, os, json, re
os.makedirs('research_out', exist_ok=True)
UA='Mozilla/5.0 (compatible; DehesaIndexBot/1.0; +https://dehesaindex.com)'
log=[]
def get(n,u,data=None,hdr=None):
    rec={'name':n,'url':u}
    try:
        h={'User-Agent':UA,'Accept':'*/*'}
        if hdr:h.update(hdr)
        with urllib.request.urlopen(urllib.request.Request(u,data=data,headers=h),timeout=60) as f:
            b=f.read(20000000); rec.update(status=f.status,bytes=len(b))
            open('research_out/r3_%s.bin'%n,'wb').write(b[:3000000]); log.append(rec); print(n,f.status,len(b),flush=True); return b
    except urllib.error.HTTPError as e:
        rec.update(status=e.code,head=(e.read(400) or b'').decode('utf8','replace'))
    except Exception as e: rec.update(status=None,err=repr(e)[:200])
    print(n,rec.get('status'),rec.get('err'),flush=True); log.append(rec)
# DK: full table list, filter locally
b=get('dk_all_tables','https://api.statbank.dk/v1/tables?lang=da&format=JSON&includeinactive=false')
if b:
    t=json.loads(b); out=[x for x in t if re.search(r'svin|kvæg|slagt|mælk|husdyr|høst|landbrug|økolog|æg|gris|får|fjerkræ|areal|afgrøde|grovfoder|jord',x['text'].lower())]
    json.dump(out,open('research_out/r3_dk_tables_filtered.json','w'),ensure_ascii=False,indent=0)
# DK HST88 data via GET-style with explicit codes
ti=json.loads(open('research_out/r3_dk_all_tables.bin','rb').read()[:0] or b'null') if False else None
info=json.loads(get('dk_hst88_info','https://api.statbank.dk/v1/tableinfo/HST88?lang=en&format=JSON'))
vars_=[{"code":v['id'],"values":["*"]} for v in info['variables']]
get('dk_hst88_data',"https://api.statbank.dk/v1/data",data=json.dumps({"table":"HST88","format":"CSV","lang":"en","variables":vars_}).encode(),hdr={'Content-Type':'application/json'})
json.dump([ {'id':v['id'],'text':v['text'],'n':len(v['values']),'sample':v['values'][:40]} for v in info['variables']],open('research_out/r3_dk_hst88_vars.json','w'),ensure_ascii=False,indent=0)
# DK amendment BEK 2026 and eco BEK
get('dk_amend','https://www.retsinformation.dk/eli/lta/2026/788/xml')
get('dk_bek1381','https://www.retsinformation.dk/eli/lta/2025/1381/xml')
# RVO
for n,u in [('rvo_open','https://www.rvo.nl/over-ons/open-data'),('rvo_sitemap','https://www.rvo.nl/sitemap.xml'),('rvo_pig','https://www.rvo.nl/onderwerpen/landbouwdieren/varkens')]:
    get(n,u)
# CBS pig / slaughter tables
get('nl_cat_varken','https://opendata.cbs.nl/ODataCatalog/Tables?$format=json&$filter=substringof(%27Varken%27,Title)%20eq%20true')
get('nl_cat_slacht','https://opendata.cbs.nl/ODataCatalog/Tables?$format=json&$filter=substringof(%27lacht%27,Title)%20eq%20true')
get('nl_cat_landb','https://opendata.cbs.nl/ODataCatalog/Tables?$format=json&$filter=substringof(%27Landbouw%27,Title)%20eq%20true&$top=100')
get('nl_7123_all','https://opendata.cbs.nl/ODataApi/odata/7123SLAC/TypedDataSet?$filter=Perioden%20ge%20%272024MM01%27')
get('nl_7123_dim','https://opendata.cbs.nl/ODataApi/odata/7123SLAC/Slachtdieren')
get('nl_80780_props','https://opendata.cbs.nl/ODataApi/odata/80780NED/DataProperties')
get('nl_80780_sample','https://opendata.cbs.nl/ODataApi/odata/80780NED/TypedDataSet?$top=3')
# FR: Céré'Obs
x=get('fr_dg_cereobs','https://www.data.gouv.fr/api/1/datasets/64930488d4141f679ae78d17/')
if x:
    d=json.loads(x)
    for r in d['resources']:
        print(r['format'],r['url'])
        if r['format'] in('xlsx','xls','csv') and 'visionet' in r['url']:
            get('fr_cereobs_file',r['url']); break
get('fr_vigieau_dep','https://api.vigieau.beta.gouv.fr/api/departements')
get('fr_vigieau_ref','https://api.vigieau.beta.gouv.fr/api/zones?profil=exploitation&lon=2.35&lat=48.85')
get('fr_dg_vigieau','https://www.data.gouv.fr/api/1/datasets/?q=arretes+restrictions+eau&page_size=5')
get('fr_dg_vig2','https://www.data.gouv.fr/api/1/datasets/?q=vigieau&page_size=10')
json.dump(log,open('research_out/_log3.json','w'),indent=1,ensure_ascii=False)
