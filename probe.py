import json, urllib.request, urllib.parse, os, re, time, io, zipfile, csv
UA={'User-Agent':'DehesaIndex-research/1.0 (+https://dehesaindex.com)','Accept':'application/json,*/*'}
os.makedirs('probe',exist_ok=True); S=open('probe/summary.txt','w')
def log(*a): s=' '.join(str(x) for x in a); print(s); S.write(s+'\n'); S.flush()
def get(u,t=120,raw=False):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t) as r:
            b=r.read(); return r.status,b
    except urllib.error.HTTPError as e: return e.code, e.read()[:2000]
    except Exception as e: return 0, repr(e).encode()[:500]
def save(name,b): open('probe/'+name,'wb').write(b if isinstance(b,bytes) else b.encode())
ES='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
def eslast(ds,q):
    st,b=get(ES+ds+'?lang=EN&'+q)
    if st!=200: log('EUROSTAT',ds,q,'HTTP',st,b[:200]); return
    j=json.loads(b); ids=j['id']; size=j['size']; cats={}
    for d in ids:
        idx=j['dimension'][d]['category']['index']; o=[None]*len(idx)
        for k,v in (idx.items() if isinstance(idx,dict) else enumerate(idx)): o[v]=k
        cats[d]=o
    last={}
    for k,v in j.get('value',{}).items():
        k=int(k); rec={}
        for d,n in reversed(list(zip(ids,size))): rec[d]=cats[d][k%n]; k//=n
        key=tuple((d,rec[d]) for d in ids if d not in ('time','freq','unit'))
        if rec['time']>last.get(key,('',None))[0]: last[key]=(rec['time'],v)
    log('EUROSTAT',ds,q,'series',len(last))
    for key,(t,v) in sorted(last.items()): log('   ',' '.join(x[1] for x in key),t,v)
G='&geo=PT&geo=AT&geo=NL&geo=DK&geo=PL'
# 1 indices de precios: ultimo trimestre por pais y producto (nominal)
eslast('apri_pi20_outq','unit=I20&p_adj=NI'+G)
eslast('apri_pi_outq','unit=I20&p_adj=NI'+G)
# 2 existencias de cierre: confirmar ausencia en AT NL DK PT
for ds in ('apro_cbs_cer','apro_cbs_oil'): eslast(ds,'bal_item=STK_CL'+G); eslast(ds,'bal_item=STK_EMY'+G)
# 3 precios absolutos anuales
eslast('apri_ap_crpouta','currency=EUR&geo=PT&geo=NL&geo=DK&geo=AT&geo=PL')
eslast('apri_ap_anouta','currency=EUR&geo=PT&geo=NL&geo=DK&geo=AT&geo=PL')
# 4 productos lacteos y huevos
eslast('apro_mk_pobta','geo=NL&geo=AT&geo=DK&geo=PT&geo=PL&dairyprod=D6000&dairyprod=D7000&dairyprod=D7100')
eslast('apro_ec_poulm','geo=AT&geo=NL')
# 5 INE Portugal: metadatos del indice de precios
for v in ('0014466','0014463'):
    st,b=get('https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&Dim1=T&lang=EN&varcd='+v); save('ine_'+v+'.json',b[:300000]); log('INE',v,st,len(b))
    try:
        j=json.loads(b); x=j[0]; log('   keys',list(x.keys())[:20]); log('   UltimoPref',x.get('UltimoPref'),'DataUltimoAtualizacao',x.get('DataUltimoAtualizacao'),'periodicity',x.get('Periodicidade') or x.get('Periodicity'))
    except Exception as e: log('   parse',repr(e)[:100])
    st,b=get('https://www.ine.pt/ine/json_indicador/pindicaMeta.jsp?varcd=%s&lang=EN'%v); save('inemeta_'+v+'.json',b[:100000]); log('INEMETA',v,st,b[:600])
# 6 Statistics Denmark: catalogo de tablas
st,b=get('https://api.statbank.dk/v1/tables?lang=en&format=JSON'); save('dst_tables.json',b); log('DST tables',st,len(b))
try:
    for t in json.loads(b):
        tx=(t['id']+' '+t['text']).lower()
        if re.search(r'stock|butter|cheese|dairy|price|balance|cereal|grain|egg|wine|oil|fertil|feed',tx) and re.search(r'agri|farm|dairy|butter|cheese|cereal|grain|egg|crop|milk|fertil|feed|harvest|stock',tx): log('   DST',t['id'],t['text'],t.get('latestPeriod'),t.get('active'))
except Exception as e: log('DST parse',repr(e)[:100])
# 7 CBS StatLine: catalogo
st,b=get('https://opendata.cbs.nl/ODataCatalog/Tables?$format=json&$select=Identifier,Title,Period,Modified,Frequency&$top=10000',t=180); save('cbs_tables.json',b); log('CBS tables',st,len(b))
try:
    for t in json.loads(b)['value']:
        tx=t['Title'].lower()
        if re.search(r'zuivel|boter|kaas|voorraad|landbouw|akkerbouw|graan|eier|prijs.*landbouw|landbouwprijs|kunstmest|melk|wijn|veevoer|balans',tx): log('   CBS',t['Identifier'],t['Title'],t.get('Period'),t.get('Modified','')[:10],t.get('Frequency'))
except Exception as e: log('CBS parse',repr(e)[:100])
# 8 Austria: catalogo OGD (data.gv.at CKAN) y Statistik Austria OGD
for q in ('Versorgungsbilanz','Agrarpreis','Getreide','Milch Butter Käse','Lagerbestand'):
    st,b=get('https://www.data.gv.at/katalog/api/3/action/package_search?rows=40&q='+urllib.parse.quote(q)); log('DATA.GV.AT',q,st,len(b))
    try:
        for p in json.loads(b)['result']['results']:
            log('   AT',p.get('name'),'|',p.get('title'),'|',(p.get('organization') or {}).get('title'),'|',p.get('license_id'),'|',p.get('metadata_modified','')[:10])
    except Exception as e: log('   parse',repr(e)[:100])
st,b=get('https://data.statistik.gv.at/web/catalog.jsp'); save('statat_catalog.html',b); log('STATAT catalog',st,len(b))
for m in re.findall(rb'OGD_[a-z0-9_]+',b)[:0]: pass
ids=sorted(set(x.decode() for x in re.findall(rb'OGD_[A-Za-z0-9_]+',b))); log('   STATAT ids',len(ids)); [log('   ',i) for i in ids if re.search(r'agr|land|preis|getr|milch|vieh|ernte|lw|fleisch|bilanz|ei',i.lower())]
# 9 GUS BDL: buscar variables de existencias y precios
for q in ('zapasy','masło','ser','ceny produktów rolnych','skup','bilans'):
    st,b=get('https://bdl.stat.gov.pl/api/v1/subjects/search?name=%s&format=json&page-size=50&lang=pl'%urllib.parse.quote(q)); log('BDL subjects',q,st)
    try:
        for r in json.loads(b).get('results',[]): log('   BDL',r.get('id'),r.get('name'),r.get('parentId'))
    except Exception as e: log('   parse',repr(e)[:100])
# 10 FAOSTAT: API y descarga masiva, licencia
for u in ('https://faostatservices.fao.org/api/v1/en/definitions/domain/PP?output_type=json','https://fenixservices.fao.org/faostat/api/v1/en/data/PP?area=174&element=5532&item=27&output_type=json','https://bulks-faostat.fao.org/production/datasets_E.json'):
    st,b=get(u); log('FAO',u,st,b[:300])
st,b=get('https://bulks-faostat.fao.org/production/Prices_E_Europe.zip',t=300); log('FAO prices zip',st,len(b))
if st==200:
    z=zipfile.ZipFile(io.BytesIO(b)); log('   files',z.namelist())
    n=[x for x in z.namelist() if x.endswith('.csv') and 'Normalized' not in x and 'Flag' not in x and 'Element' not in x and 'Item' not in x and 'Area' not in x]
    f=n[0]; rd=csv.reader(io.TextIOWrapper(z.open(f),encoding='latin-1')); h=next(rd); log('   header',h[:12],'...',h[-4:])
    want={'Portugal','Austria','Netherlands (Kingdom of the)','Netherlands','Denmark','Poland'}; seen={}; ia=h.index('Area'); ii=h.index('Item'); ie=h.index('Element')
    yc=[i for i,x in enumerate(h) if re.match(r'^Y\d{4}$',x)]
    for r in rd:
        if r[ia] in want:
            ly=max([h[i][1:] for i in yc if i<len(r) and r[i].strip()] or ['-'])
            seen.setdefault((r[ia],r[ie]),[]).append(r[ii]+':'+ly)
    for k,v in seen.items(): log('   FAO',k,len(v),sorted(v))
st,b=get('https://www.fao.org/contact-us/terms/db-terms-of-use/en'); save('fao_terms.html',b); log('FAO terms',st,len(b)); 
for m in re.findall(rb'CC[ -]BY[^<"]{0,60}',b)[:6]: log('   ',m)
# 11 Banco Mundial
for ind in ('AG.PRD.CREL.MT','AG.YLD.CREL.KG','AG.CON.FERT.ZS','NV.AGR.TOTL.ZS','AG.LND.AGRI.ZS'):
    st,b=get('https://api.worldbank.org/v2/country/PL;AT;NL;DK;PT/indicator/%s?format=json&mrv=3'%ind); log('WB',ind,st)
    try:
        for r in json.loads(b)[1] or []: log('   ',r['country']['id'],r['date'],r['value'])
    except Exception as e: log('   parse',repr(e)[:100],b[:200])
st,b=get('https://api.worldbank.org/v2/sources?format=json&per_page=100'); log('WB sources',st)
# 12 USDA FAS: PSD (paises) y API
st,b=get('https://apps.fas.usda.gov/psdonline/downloads/psd_alldata_csv.zip',t=300); log('PSD zip',st,len(b))
if st==200:
    z=zipfile.ZipFile(io.BytesIO(b)); f=z.namelist()[0]; rd=csv.DictReader(io.TextIOWrapper(z.open(f),encoding='utf-8',errors='replace'))
    cs=set()
    for r in rd: cs.add(r.get('Country_Name'))
    log('   PSD countries with EU-ish',[c for c in cs if c and re.search(r'Europ|Poland|Austria|Netherl|Denmark|Portugal',c)])
for u in ('https://apps.fas.usda.gov/OpenData/api/psd/regions','https://api.fas.usda.gov/api/psd/regions'):
    st,b=get(u); log('FAS API',u,st,b[:200])
S.close()
