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
            b=f.read(30000000); rec.update(status=f.status,bytes=len(b),ctype=f.headers.get('Content-Type'),final=f.geturl())
            open('research_out/r5_%s.bin'%n,'wb').write(b[:keep]); log.append(rec); print(n,f.status,len(b),flush=True); return b
    except urllib.error.HTTPError as e:
        rec.update(status=e.code,head=(e.read(300) or b'').decode('utf8','replace'))
    except Exception as e: rec.update(status=None,err=repr(e)[:200])
    print(n,rec.get('status'),rec.get('err'),flush=True); log.append(rec)
for n,u in [('rvo_stat','https://www.rvo.nl/onderwerpen/marktinformatie/statistieken'),('rvo_markt','https://www.rvo.nl/onderwerpen/marktinformatie'),('rvo_varken_stat','https://www.rvo.nl/onderwerpen/marktinformatie/statistieken/varkens'),('rvo_api_summary','https://www.rvo.nl/api/v1/opendata/summary'),('rvo_api_subjects','https://www.rvo.nl/api/v1/opendata/subjects')]: get(n,u)
b=get('rvo_stat_ctx','https://www.rvo.nl/onderwerpen/marktinformatie/statistieken')
for n,u in [('ret_about','https://www.retsinformation.dk/about'),('ret_copyright','https://www.retsinformation.dk/Forms/R0710.aspx?id=130000'),('ret_data','https://www.retsinformation.dk/api/document/eli/lta/2025/1363/info'),('dst_cc_en','https://www.dst.dk/en/Statistik/dokumentation/Citation'),('dst_rights','https://www.dst.dk/en/OmDS/rettigheder-og-brug-af-data')]: get(n,u)
for n,u in [('cbs_lpi_dim','https://opendata.cbs.nl/ODataApi/odata/86125NED/LandbouwInOutputGoederenDiensten'),('cbs_lpi_catalog','https://opendata.cbs.nl/ODataApi/odata/86125NED/TableInfos'),('cbs_80780_info','https://opendata.cbs.nl/ODataApi/odata/80780NED/TableInfos'),('cbs_7123_info','https://opendata.cbs.nl/ODataApi/odata/7123SLAC/TableInfos'),('cbs_licence_page','https://www.cbs.nl/en-gb/statline/dataportaal/informatie/general-information-on-the-use-of-cbs-open-data'),('cbs_disclaimer','https://www.cbs.nl/nl-nl/onze-diensten/open-data/statline-as-open-data/disclaimer'),('cbs_opendata_en','https://www.cbs.nl/en-gb/our-services/open-data'),('cbs_pg','https://www.cbs.nl/en-gb/about-us/website/copyright')]: get(n,u)
# NL 85636 by year with paging
rows=[]; u="https://opendata.cbs.nl/ODataApi/odata/85636NED/TypedDataSet"; n=0
while u and n<20:
    b=get('cbs_85636_p%d'%n,u); 
    if not b: break
    d=json.loads(b); rows+=d['value']; u=d.get('odata.nextLink'); n+=1
json.dump({'n':len(rows)},open('research_out/r5_cbs85636_count.json','w'))
# FR checks
get('fr_vigieau_dep_graph','https://api.vigieau.beta.gouv.fr/api/departements/34')
get('fr_vigieau_stats','https://api.vigieau.beta.gouv.fr/api/statistics/departements')
get('fr_dg_vigieau_ds','https://www.data.gouv.fr/api/1/datasets/donnee-secheresse-vigieau/')
get('fr_dg_cereobs_ble','https://www.data.gouv.fr/api/1/datasets/?q=Cere%27Obs+bl%C3%A9&page_size=10')
get('fr_dg_fam_org','https://www.data.gouv.fr/api/1/organizations/franceagrimer/datasets/?page_size=100')
get('fr_cereobs_ble_site','https://cereobs.franceagrimer.fr/cereobs-pub/')
json.dump(log,open('research_out/_log5.json','w'),indent=1,ensure_ascii=False)
