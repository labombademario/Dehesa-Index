import urllib.request, urllib.error, urllib.parse, os, json, re
os.makedirs('research_out', exist_ok=True)
UA='Mozilla/5.0 (compatible; DehesaIndexBot/1.0; +https://dehesaindex.com)'
log=[]
def get(n,u,data=None,hdr=None,keep=3000000):
    rec={'name':n,'url':u}
    try:
        h={'User-Agent':UA,'Accept':'*/*'}
        if hdr:h.update(hdr)
        with urllib.request.urlopen(urllib.request.Request(u,data=data,headers=h),timeout=90) as f:
            b=f.read(30000000); rec.update(status=f.status,bytes=len(b),ctype=f.headers.get('Content-Type'))
            open('research_out/r4_%s.bin'%n,'wb').write(b[:keep]); log.append(rec); print(n,f.status,len(b),flush=True); return b
    except urllib.error.HTTPError as e:
        rec.update(status=e.code,head=(e.read(400) or b'').decode('utf8','replace'))
    except Exception as e: rec.update(status=None,err=repr(e)[:200])
    print(n,rec.get('status'),rec.get('err'),flush=True); log.append(rec)
def stat(t,lang='en'):
    b=get('dk_info_'+t,'https://api.statbank.dk/v1/tableinfo/%s?lang=%s&format=JSON'%(t,lang))
    if not b: return
    info=json.loads(b)
    vs=[]
    for v in info['variables']:
        vs.append({"code":v['id'],"values":["*"]})
    get('dk_csv_'+t,"https://api.statbank.dk/v1/data",data=json.dumps({"table":t,"format":"CSV","lang":lang,"variables":vs}).encode(),hdr={'Content-Type':'application/json'})
for t in ['HST77','ANI41','ANI51','ANI71','SVIN','KVAEG5','LPRIS10','AFG5','TILSKUD2','OEKO11','ANI81','HDYR1']: stat(t)
# DK licence / terms
for n,u in [('dst_en','https://www.dst.dk/en/OmDS/Rettigheder'),('dst_cc','https://www.dst.dk/en/Statistik/dokumentation/kildeangivelse'),('dst_cc2','https://www.dst.dk/da/Statistik/dokumentation/kildeangivelse'),('dst_cc3','https://www.dst.dk/en/OmDS/copyright'),('dst_api','https://www.dst.dk/en/Statistik/brug-statistikken/muligheder-i-statistikbanken/api'),('dmi_obs_terms','https://opendatadocs.dmi.dk/en/Data/Terms_of_use'),('dmi_docs','https://opendatadocs.dmi.dk/')]: get(n,u)
# DK amendment / eco
get('dk_amend_xml','https://www.retsinformation.dk/eli/lta/2026/788/xml')
for n,u in [('dk_bek1363_hist','https://www.retsinformation.dk/api/document/eli/lta/2025/1363/historik')]: get(n,u)
# NL RVO
for n,u in [('rvo_tarieven','https://www.rvo.nl/onderwerpen/glb-2026/tarieven-uitbetaling'),('rvo_eco','https://www.rvo.nl/subsidies-financiering/glb-2026/eco-regeling/eco-activiteiten-punten-en-waarde'),('rvo_basis','https://www.rvo.nl/subsidies-financiering/glb-2026/basispremie-en-extra-betaling-eerste-40-hectare'),('rvo_markt','https://www.rvo.nl/onderwerpen/marktinformatie/marktinformatie-melk-en-melkproducten'),('rvo_ecoreg','https://www.rvo.nl/subsidies-financiering/glb-2026/eco-regeling'),('rvo_jong','https://www.rvo.nl/subsidies-financiering/glb-2026/extra-betaling-jonge-landbouwers'),('rvo_agenda','https://www.rvo.nl/onderwerpen/glb-2026/glb-aanvraag-tot-uitbetaling'),('rvo_opendata','https://www.rvo.nl/onderwerpen/open-data'),('rvo_informatiehuis','https://www.rvo.nl/onderwerpen/open-data/informatiehuis'),('rvo_licentie','https://www.rvo.nl/onderwerpen/open-data/open-data-licentie')]: get(n,u)
# NL CBS full
get('nl_85636_all','https://opendata.cbs.nl/ODataApi/odata/85636NED/TypedDataSet?$top=100000')
get('nl_7123_all','https://opendata.cbs.nl/ODataApi/odata/7123SLAC/TypedDataSet?$top=100000')
get('nl_80780_all','https://opendata.cbs.nl/ODataApi/odata/80780NED/TypedDataSet?$filter=Perioden%20ge%20%272015JJ00%27&$top=100000')
get('nl_80780_regio','https://opendata.cbs.nl/ODataApi/odata/80780NED/RegioS')
get('nl_85933_info','https://opendata.cbs.nl/ODataApi/odata/86125NED/DataProperties')
get('nl_86125','https://opendata.cbs.nl/ODataApi/odata/86125NED/TypedDataSet?$top=100000')
get('nl_86125_dim','https://opendata.cbs.nl/ODataApi/odata/86125NED/Prijsindex')
# FR
get('fr_vigieau_all','https://api.vigieau.beta.gouv.fr/api/departements')
get('fr_vigieau_doc2','https://api.vigieau.beta.gouv.fr/api/doc')
get('fr_vigieau_swagger','https://api.vigieau.beta.gouv.fr/api-json')
get('fr_vigieau_zones2','https://api.vigieau.beta.gouv.fr/api/zones?profil=exploitation&departement=34')
x=get('fr_dg_vig','https://www.data.gouv.fr/api/1/datasets/?q=vigieau&page_size=10')
x=get('fr_cereobs_list','https://www.data.gouv.fr/api/1/datasets/?q=cereobs&page_size=20')
x=get('fr_cereobs_blé','https://www.data.gouv.fr/api/1/datasets/?q=%C3%A9tat+des+cultures+franceagrimer&page_size=20')
json.dump(log,open('research_out/_log4.json','w'),indent=1,ensure_ascii=False)
