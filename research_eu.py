import urllib.request, urllib.error, os, json, time, hashlib
os.makedirs('research_out', exist_ok=True)
UA = 'Mozilla/5.0 (compatible; DehesaIndexBot/1.0; +https://dehesaindex.com)'
T = [
# Denmark
('dk','retsinfo_bek1363','https://www.retsinformation.dk/eli/lta/2025/1363'),
('dk','retsinfo_bek1363_json','https://www.retsinformation.dk/api/document/eli/lta/2025/1363'),
('dk','retsinfo_bek1381','https://www.retsinformation.dk/eli/lta/2025/1381'),
('dk','statbank_hst88','https://api.statbank.dk/v1/tableinfo/HST88?format=JSON'),
('dk','statbank_hst88_data','https://api.statbank.dk/v1/data/HST88/CSV?lang=en&Tid=*&OMRÅDE=*&AFGRØDE=*'),
('dk','statbank_subjects','https://api.statbank.dk/v1/subjects/16?recursive=true&format=JSON'),
('dk','dmi_api','https://opendataapi.dmi.dk/v2/metObs/collections'),
('dk','landbrugsstyrelsen','https://lbst.dk/tilskud-selvbetjening/grundbetaling'),
# Netherlands
('nl','cbs_85636','https://opendata.cbs.nl/ODataApi/odata/85636NED/TableInfos'),
('nl','cbs_85636_data','https://opendata.cbs.nl/ODataApi/odata/85636NED/TypedDataSet?$top=5'),
('nl','cbs_80780','https://opendata.cbs.nl/ODataApi/odata/80780NED/TableInfos'),
('nl','cbs_80781','https://opendata.cbs.nl/ODataApi/odata/80781NED/TableInfos'),
('nl','cbs_7123slac','https://opendata.cbs.nl/ODataApi/odata/7123SLAC/TableInfos'),
('nl','rvo_varken','https://www.rvo.nl/onderwerpen/landbouw-tuinbouw/varkens/referentieprijs'),
('nl','rvo_ecoregeling','https://www.rvo.nl/onderwerpen/gemeenschappelijk-landbouwbeleid-glb/ecoregeling'),
('nl','knmi_neerslagtekort','https://www.knmi.nl/nederland-nu/klimatologie/daggegevens'),
('nl','knmi_opendata','https://api.dataplatform.knmi.nl/open-data/v1/datasets'),
# France
('fr','vigieau_api','https://api.vigieau.beta.gouv.fr/api/departements'),
('fr','datagouv_vigieau','https://www.data.gouv.fr/api/1/datasets/?q=vigieau&page_size=3'),
('fr','datagouv_cereobs','https://www.data.gouv.fr/api/1/datasets/?q=cere%27obs&page_size=3'),
('fr','datagouv_franceagrimer','https://www.data.gouv.fr/api/1/datasets/?q=franceagrimer+cotations&page_size=3'),
('fr','franceagrimer_cotations','https://www.franceagrimer.fr/rnm/'),
('fr','agreste_disar','https://agreste.agriculture.gouv.fr/agreste-web/disaron/'),
('fr','legifrance','https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000000000'),
('fr','meteofrance_api','https://donneespubliques.meteofrance.fr/'),
# Austria
('at','statistik_ods','https://www.statistik.at/en/statistics/agriculture-and-forestry'),
('at','statistik_open','https://data.statistik.gv.at/web/meta.jsp?dataset=OGD_fldb_flaechennutzung_1'),
('at','ama_oepul','https://www.ama.at/fachliche-informationen/oepul'),
('at','geosphere_api','https://dataset.api.hub.geosphere.at/v1/datasets'),
('at','ris_api','https://data.bka.gv.at/ris/api/v2.6/Bundesrecht'),
('at','data_gv_at','https://www.data.gv.at/api/3/action/package_search?q=landwirtschaft&rows=3'),
# Belgium
('be','landbouwcijfers','https://landbouwcijfers.vlaanderen.be/'),
('be','kmi_aws','https://opendata.meteo.be/'),
('be','statbel_open','https://statbel.fgov.be/en/open-data'),
('be','statbel_agri','https://statbel.fgov.be/en/themes/agriculture-fisheries'),
('be','wallonie_agri','https://agriculture.wallonie.be/'),
]
log=[]
for c,n,u in T:
    t=time.time(); rec={'country':c,'name':n,'url':u}
    try:
        r=urllib.request.Request(u,headers={'User-Agent':UA,'Accept':'*/*'})
        with urllib.request.urlopen(r,timeout=30) as f:
            b=f.read(400000)
            rec.update(status=f.status,ctype=f.headers.get('Content-Type'),bytes=len(b),final=f.geturl(),
                       lastmod=f.headers.get('Last-Modified'),head=b[:300].decode('utf8','replace'))
            open('research_out/%s_%s.bin'%(c,n),'wb').write(b[:60000])
    except urllib.error.HTTPError as e:
        rec.update(status=e.code,err=str(e),head=(e.read(200) or b'').decode('utf8','replace'))
    except Exception as e:
        rec.update(status=None,err=repr(e)[:200])
    rec['secs']=round(time.time()-t,1)
    log.append(rec); print(c,n,rec.get('status'),flush=True)
json.dump(log,open('research_out/_log.json','w'),indent=1,ensure_ascii=False)
