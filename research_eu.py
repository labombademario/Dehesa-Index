import urllib.request, urllib.error, urllib.parse, os, json, time, re
os.makedirs('research_out', exist_ok=True)
UA='Mozilla/5.0 (compatible; DehesaIndexBot/1.0; +https://dehesaindex.com)'
log=[]
def get(c,n,u,data=None,keep=200000,hdr=None):
    rec={'country':c,'name':n,'url':u}
    try:
        h={'User-Agent':UA,'Accept':'*/*'}
        if hdr:h.update(hdr)
        r=urllib.request.Request(u,data=data,headers=h)
        with urllib.request.urlopen(r,timeout=40) as f:
            b=f.read(5000000)
            rec.update(status=f.status,ctype=f.headers.get('Content-Type'),bytes=len(b),final=f.geturl())
            open('research_out/r2_%s_%s.bin'%(c,n),'wb').write(b[:keep])
            rec['head']=b[:200].decode('utf8','replace')
            print(c,n,f.status,len(b),flush=True); log.append(rec); return b
    except urllib.error.HTTPError as e:
        rec.update(status=e.code,head=(e.read(300) or b'').decode('utf8','replace'))
    except Exception as e:
        rec.update(status=None,err=repr(e)[:200])
    print(c,n,rec.get('status'),rec.get('err'),flush=True); log.append(rec)
q=urllib.parse.quote
# DK: HST88 data via POST
body=json.dumps({"table":"HST88","format":"CSV","lang":"en","variables":[{"code":"LANDSDEL","values":["*"]},{"code":"AFGRØDE","values":["*"]},{"code":"ENHED","values":["*"]},{"code":"Tid","values":["*"]}]}).encode()
get('dk','hst88_data','https://api.statbank.dk/v1/data',data=body,hdr={'Content-Type':'application/json'},keep=400000)
# DK livestock/slaughter tables search
for s in ['kvæg','svin','slagtning','husdyr']:
    get('dk','tables_'+q(s),'https://api.statbank.dk/v1/tables?lang=da&format=JSON&query='+q(s))
get('dk','subjects','https://api.statbank.dk/v1/subjects?lang=en&format=JSON&recursive=true&includeTables=false',keep=100000)
# DK retsinformation
for u in ['https://www.retsinformation.dk/api/document/eli/lta/2025/1363','https://www.retsinformation.dk/eli/lta/2025/1363/xml','https://www.retsinformation.dk/eli/lta/2025/1363/da/xml','https://www.retsinformation.dk/api/document/eli/lta/2025/1363/da','https://www.retsinformation.dk/api/documentsearch']:
    get('dk','ret_'+re.sub(r'\W','_',u[-40:]),u,keep=400000)
get('dk','sgav','https://sgav.dk/')
get('dk','dst_kilde','https://www.dst.dk/da/Statistik/kilde-angivelse')
get('dk','dmi_terms','https://opendatadocs.dmi.dk/en/Data/Terms_of_use')
get('dk','dmi_obs','https://opendataapi.dmi.dk/v2/metObs/collections/observation/items?limit=2')
# NL
get('nl','cbs_85636_props','https://opendata.cbs.nl/ODataApi/odata/85636NED/DataProperties',keep=100000)
get('nl','cbs_85636_gew','https://opendata.cbs.nl/ODataApi/odata/85636NED/Gewassen',keep=100000)
get('nl','cbs_85636_reg','https://opendata.cbs.nl/ODataApi/odata/85636NED/RegioS')
get('nl','cbs_85636_full','https://opendata.cbs.nl/ODataApi/odata/85636NED/TypedDataSet?$filter=Perioden%20ge%20%272020JJ00%27',keep=1000000)
get('nl','cbs_7123_props','https://opendata.cbs.nl/ODataApi/odata/7123SLAC/DataProperties')
get('nl','cbs_7123_data','https://opendata.cbs.nl/ODataApi/odata/7123SLAC/TypedDataSet?$top=20')
get('nl','cbs_license','https://www.cbs.nl/nl-nl/onze-diensten/open-data/open-data-v4/open-data-v4-overzicht')
get('nl','cbs_copyright','https://www.cbs.nl/en-gb/about-us/website/copyright')
get('nl','rvo_open','https://www.rvo.nl/over-ons/open-data')
get('nl','rvo_dataset','https://data.rvo.nl/')
get('nl','rvo_search','https://www.rvo.nl/zoeken?query=referentieprijs+varkens')
get('nl','ndw_cbs_cat','https://opendata.cbs.nl/ODataCatalog/Tables?$filter=substringof(%27varken%27,Title)&$format=json',keep=100000)
get('nl','cbs_cat_melk','https://opendata.cbs.nl/ODataCatalog/Tables?$filter=substringof(%27melk%27,Title)&$format=json',keep=100000)
get('nl','pdok','https://api.pdok.nl/rvo/brpgewaspercelen/ogc/v1')
# FR
get('fr','cereobs_xlsx','https://visionet.franceagrimer.fr/Pages/OpenDocument.aspx?fileurl=SeriesChronologiques')
d=get('fr','datagouv_cereobs_full','https://www.data.gouv.fr/api/1/datasets/?q=cere%27obs&page_size=10',keep=300000)
get('fr','cereobs_site','https://cereobs.franceagrimer.fr/')
get('fr','vigieau_zones','https://api.vigieau.beta.gouv.fr/api/zones?profil=exploitation&commune=34172')
get('fr','vigieau_csv','https://www.data.gouv.fr/api/1/datasets/?q=vigieau+restrictions&page_size=5',keep=300000)
get('fr','vigieau_doc','https://vigieau.gouv.fr/donnees-ouvertes')
get('fr','fam_rnm','https://rnm.franceagrimer.fr/')
get('fr','fam_prix','https://rnm.franceagrimer.fr/prix?BOVINS')
get('fr','datagouv_bovins','https://www.data.gouv.fr/api/1/datasets/?q=cotations+bovins&page_size=5',keep=200000)
json.dump(log,open('research_out/_log2.json','w'),indent=1,ensure_ascii=False)
