import json, urllib.request, urllib.parse, os, re
os.makedirs('probe',exist_ok=True); S=open('probe/summary_ar.txt','w')
def log(*a): s=' '.join(str(x) for x in a); print(s); S.write(s+'\n'); S.flush()
UA={'User-Agent':'DehesaIndex-research/1.0 (+https://dehesaindex.com)','Accept':'*/*'}
def get(u,t=120):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t) as r: return r.status,r.read()
    except urllib.error.HTTPError as e: return e.code,e.read()[:1500]
    except Exception as e: return 0,repr(e).encode()[:300]
seen=set()
for q in ('precios mayoristas','sistema de indices de precios mayoristas','IPIM','precios al productor','indice de precios','combustibles precios surtidor','fertilizantes','vino elaboracion','INV vitivinicola','lecheria','lacteos','existencias','stock granos','papa','frutas','exportaciones producto','importaciones producto','comercio exterior','precios granos','FOB','pizarra','girasol','carne ovina','porcino','miel','manteca queso'):
    st,b=get('https://datos.gob.ar/api/3/action/package_search?rows=40&q='+urllib.parse.quote(q))
    if st!=200: log('CKAN',q,st,b[:150]); continue
    for p in json.loads(b)['result']['results']:
        if p['name'] in seen: continue
        seen.add(p['name'])
        mods=[r.get('last_modified') or r.get('created') or '' for r in p.get('resources',[])]
        log('PKG',q,'|',p['name'],'|',p.get('title','')[:90],'|',(p.get('organization') or {}).get('name'),'|',p.get('license_id'),'|',p.get('metadata_modified','')[:10],'| res',len(p.get('resources',[])),'| accrual',p.get('accrualPeriodicity') or '')
# API de series
for q in ('precios mayoristas agropecuarios','IPIM','precio mayorista','indice precios productos agropecuarios','combustible gasoil precio','fertilizante','exportaciones manteca','exportaciones queso','exportaciones vino','existencias','leche','vino','papa','carne porcina','ovino'):
    st,b=get('https://apis.datos.gob.ar/series/api/search/?limit=50&q='+urllib.parse.quote(q))
    if st!=200: log('SERIES',q,st,b[:150]); continue
    for r in json.loads(b).get('data',[]):
        f=r.get('field',{}); ds=r.get('dataset',{})
        log('SER',q,'|',f.get('id'),'|',(f.get('description') or f.get('title') or '')[:90],'|',f.get('frequency'),'|',f.get('time_index_start'),'..',f.get('time_index_end'),'|',(ds.get('title') or '')[:60],'|',ds.get('source'))
st,b=get('https://datos.gob.ar/robots.txt'); log('ROBOTS datos.gob.ar',st,b[:600])
st,b=get('https://apis.datos.gob.ar/robots.txt'); log('ROBOTS apis',st,b[:600])
for u in ('https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-32','https://www.indec.gob.ar/indec/web/Institucional-Indec-PoliticaDifusion','https://www.magyp.gob.ar/sitio/areas/ss_mercados_agropecuarios/precios/','https://www.inv.gob.ar/','https://datos.magyp.gob.ar/dataset','https://www.bcr.com.ar/es/mercados/mercado-de-granos/cotizaciones/cotizaciones-locales-0','https://www.ocla.org.ar/'):
    st,b=get(u); t=re.sub(rb'<[^>]+>',b' ',b); t=re.sub(rb'\s+',b' ',t)
    log('WEB',u,st,len(b))
    for m in list(re.finditer(rb'.{0,120}(licencia|Creative Commons|derechos reservados|reproducci|Terminos|T\xc3\xa9rminos|copyright|uso de la informaci).{0,140}',t,re.I))[:5]: log('    ',m.group(0)[:260].decode('utf-8','replace'))
    for x in sorted(set(re.findall(rb'href="([^"]+\.(?:xlsx|xls|csv|zip))"',b)))[:20]: log('    file',x.decode('utf-8','replace'))
S.close()
