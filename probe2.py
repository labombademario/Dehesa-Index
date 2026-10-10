import json, urllib.request, urllib.parse, os, re, io, zipfile, csv
UA={'User-Agent':'DehesaIndex-research/1.0 (+https://dehesaindex.com)','Accept':'application/json,*/*'}
os.makedirs('probe',exist_ok=True); S=open('probe/summary2.txt','w')
def log(*a): s=' '.join(str(x) for x in a); print(s); S.write(s+'\n'); S.flush()
def get(u,t=150,data=None,hdr=None):
    try:
        h=dict(UA); h.update(hdr or {})
        with urllib.request.urlopen(urllib.request.Request(u,data=data,headers=h),timeout=t) as r: return r.status,r.read()
    except urllib.error.HTTPError as e: return e.code, e.read()[:3000]
    except Exception as e: return 0, repr(e).encode()[:500]
def save(n,b): open('probe/'+n,'wb').write(b)
# DST: KORN2, ANI303, ANI302, LPRIS10, LPRIS22 metadata + KORN2 data
for t in ('KORN2','ANI303','ANI302','ANI11','LPRIS22','LPRIS10','KORN'):
    st,b=get('https://api.statbank.dk/v1/tableinfo/%s?lang=en&format=JSON'%t); save('dst_%s_info.json'%t,b); log('DST info',t,st)
    try:
        j=json.loads(b); log('   ',j.get('text'),'| unit',j.get('unit'),'| updated',j.get('updated'))
        for v in j['variables']: log('    var',v['id'],v['text'],'|',[(x['id'],x['text']) for x in v['values']][:40], '... n=%d'%len(v['values']))
    except Exception as e: log('   parse',repr(e)[:200])
body=json.dumps({"table":"KORN2","format":"CSV","lang":"en","variables":[{"code":k,"values":["*"]} for k in []]}).encode()
st,b=get('https://api.statbank.dk/v1/data/KORN2/CSV?lang=en&'+'&'.join('%s=*'%v for v in ('AFGROEDE','LAGER','TAL','Tid','ENHED','BEHOLD')),t=150); save('dst_KORN2.csv',b); log('DST KORN2 data',st,b[:1500])
# CBS 7425zuiv: propiedades y ultimas filas
st,b=get('https://opendata.cbs.nl/ODataApi/odata/7425zuiv/DataProperties?$format=json'); save('cbs_7425_props.json',b); log('CBS 7425zuiv props',st)
try:
    for p in json.loads(b)['value']: log('   ',p.get('Key'),'|',p.get('Title'),'|',p.get('Unit'))
except Exception as e: log('   parse',repr(e)[:200])
st,b=get("https://opendata.cbs.nl/ODataApi/odata/7425zuiv/TypedDataSet?$format=json&$orderby=Perioden%20desc&$top=3"); save('cbs_7425_last.json',b); log('CBS 7425zuiv last',st,b[:2500])
# CBS 86125NED: que productos tiene
st,b=get('https://opendata.cbs.nl/ODataApi/odata/86125NED/DataProperties?$format=json'); save('cbs_86125_props.json',b); log('CBS 86125NED props',st)
try:
    for p in json.loads(b)['value']: log('   ',p.get('Key'),'|',p.get('Title'),'|',p.get('Type'))
except Exception as e: log('   parse',repr(e)[:200])
for dim in ('Landbouwproducten','Producten','LandbouwproductenInEnOutput','InputEnOutput'):
    st,b=get('https://opendata.cbs.nl/ODataApi/odata/86125NED/%s?$format=json'%dim)
    if st==200:
        log('CBS 86125 dim',dim)
        for p in json.loads(b)['value']: log('   ',p.get('Key'),'|',p.get('Title'))
# Statistik Austria: pagina de versorgungsbilanzen (enlaces xlsx/ods/csv)
for u in ('https://www.statistik.at/statistiken/land-und-forstwirtschaft/landwirtschaftliche-bilanzen/versorgungsbilanzen',
          'https://www.statistik.at/statistiken/land-und-forstwirtschaft/landwirtschaftliche-bilanzen',
          'https://www.statistik.at/statistiken/land-und-forstwirtschaft/preise-und-preisindizes'):
    st,b=get(u); save('statat_%d.html'%len(u),b); log('STATAT',u,st,len(b))
    for m in sorted(set(re.findall(rb'href="([^"]+\.(?:xlsx|ods|csv|xls))"',b)))[:60]: log('   ',m.decode())
st,b=get('https://www.ama.at/marktinformationen/getreide-und-olsaaten/preise'); log('AMA preise',st,len(b))
for m in sorted(set(re.findall(rb'href="([^"]+\.(?:xlsx|pdf|csv|xls))"',b)))[:30]: log('   ',m.decode())
# INE Portugal: buscar indicadores de existencias / balanco
for q in ('existências','balanço de aprovisionamento','manteiga','queijo'):
    st,b=get('https://www.ine.pt/ine/json_indicador/pindica.jsp?op=1&lang=PT&termo='+urllib.parse.quote(q)); log('INE busca',q,st,b[:400])
# Eurostat: huevos AT, precios lacteos por pais (portal agro: queso NL/DK)
ES='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
for ds,q in (('apro_ec_egghen','geo=AT'),('apro_ec_eggpcm','geo=AT')):
    st,b=get(ES+ds+'?lang=EN&'+q); log('EUROSTAT',ds,q,st,b[:300] if st!=200 else len(b))
    if st==200:
        j=json.loads(b); log('   dims',j['id'],'times',list(j['dimension']['time']['category']['index'])[-4:])
st,b=get('https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/dataflow/ESTAT/all?format=JSON&compressed=false',t=200)
if st==200:
    try:
        j=json.loads(b); fl=j.get('link',{}).get('item',[]) or j.get('data',{}).get('dataflows',[])
        for f in fl:
            nm=json.dumps(f.get('label') or f.get('name') or '')
            idd=f.get('extension',{}).get('id') or f.get('id','')
            if re.search(r'stock|balance sheet|supply balance|butter|cheese',nm,re.I) and re.search(r'apro|agr|food|milk|dairy|cereal',idd+nm,re.I): log('   ESTAT flow',idd,nm[:140])
    except Exception as e: log('flows parse',repr(e)[:200])
else: log('ESTAT flows',st)
# FAOSTAT: guardar filas de los 5 paises (precios e indices) para analizar
st,b=get('https://bulks-faostat.fao.org/production/Prices_E_Europe.zip',t=300)
if st==200:
    z=zipfile.ZipFile(io.BytesIO(b)); rd=csv.reader(io.TextIOWrapper(z.open('Prices_E_Europe_NOFLAG.csv'),encoding='latin-1')); h=next(rd)
    out=io.StringIO(); w=csv.writer(out); w.writerow(h)
    for r in rd:
        if r[2] in ('Portugal','Austria','Netherlands (Kingdom of the)','Denmark','Poland') and r[9] in ('Annual value','Annual Value','') or (r[2] in ('Portugal','Austria','Netherlands (Kingdom of the)','Denmark','Poland') and 'Index' in r[7]): w.writerow(r)
    save('fao_prices_5.csv',out.getvalue().encode()); log('FAO 5 csv',len(out.getvalue()))
# USDA PSD: años por pais
st,b=get('https://apps.fas.usda.gov/psdonline/downloads/psd_alldata_csv.zip',t=300)
if st==200:
    z=zipfile.ZipFile(io.BytesIO(b)); rd=csv.DictReader(io.TextIOWrapper(z.open(z.namelist()[0]),encoding='utf-8',errors='replace')); yrs={}
    for r in rd:
        c=r.get('Country_Name')
        if c in ('Netherlands','Poland','Austria','Denmark','Portugal','European Union'):
            k=(c,r.get('Commodity_Description')); y=int(r.get('Market_Year') or 0); yrs[k]=max(yrs.get(k,0),y)
    for k in sorted(yrs): log('   PSD',k,yrs[k])
S.close()
