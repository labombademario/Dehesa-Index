import json, urllib.request, urllib.parse, os, re, time, io, csv
os.makedirs('probe',exist_ok=True); S=open('probe/summary_ar2.txt','w')
def log(*a): s=' '.join(str(x) for x in a); print(s,flush=True); S.write(s+'\n'); S.flush()
UA={'User-Agent':'DehesaIndex-research/1.0 (+https://dehesaindex.com)','Accept':'*/*'}
def get(u,t=120,rng=None):
    h=dict(UA)
    if rng: h['Range']='bytes=0-%d'%rng
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u,headers=h),timeout=t) as r: return r.status,r.read()
        except urllib.error.HTTPError as e:
            if e.code in (502,503,429): time.sleep(15*(i+1)); continue
            return e.code,e.read()[:800]
        except Exception as e: last=e; time.sleep(10)
    return 0,b'fail'
def dec(b):
    try: return b.decode('utf-8-sig')
    except UnicodeDecodeError: return b.decode('cp1252','replace')
def tail_rows(b,n=3):
    t=dec(b).splitlines(); return t[:2]+['...']+t[-n:]
PK=['indice-de-precios-internos-al-por-mayor-ipim-dic-2015-100','indice-de-precios-internos-basicos-del-productor-dic-2015-100','indice-de-precios-internos-basicos-al-por-mayor-dic-2015-100',
 'lacteos-exportaciones','lacteos-balanza-comercial','precios-mayoristas-resolucion-1104-04','precios-fob-oficiales','datos-comercio-exterior','precios-mayoristas-frutas-hortalizas',
 'exportaciones-segun-el-nomenclador-comun-del-mercosur-ncm','importaciones-segun-el-nomenclador-comun-del-mercosur-ncm','indices-de-valor-precio-y-cantidad-de-las-exportaciones-de-bienes',
 'precios-de-biodiesel','precio-promedio-litro-leche-pagado-al-productor','indicadores-economicos-para-ganaderia-bovina','molienda-granos','warrants-evolucion-certificados-vigentes-desagregados-por-productos']
for name in PK:
    time.sleep(11)
    st,b=get('https://datos.gob.ar/api/3/action/package_show?id='+name)
    if st!=200: log('PKGFAIL',name,st); continue
    p=json.loads(b)['result']; log('\n=== PKG',name,'|',p.get('license_id'),'|',p.get('title'))
    for r in p['resources']:
        log('  RES',(r.get('format') or ''),'|',(r.get('name') or '')[:80],'|',r.get('url'),'|',(r.get('last_modified') or '')[:10])
        u=r.get('url') or ''
        if (r.get('format') or '').upper()=='CSV' and u:
            st2,b2=get(u,180)
            if st2==200:
                for l in tail_rows(b2): log('      >',l[:400])
            else: log('      GETFAIL',st2)
for q in ('fertilizantes','vino','vitivinicola','lacteos produccion','porcinos','ovinos','existencias granos','stock lacteos','papa produccion','combustibles surtidor','precios en surtidor','urea','frutas produccion','manzana pera','aceituna olivo','miel exportaciones','avena precio','pizarra rosario','camara arbitral'):
    time.sleep(11)
    st,b=get('https://datos.gob.ar/api/3/action/package_search?rows=30&q='+urllib.parse.quote(q))
    if st!=200: log('CKAN',q,st); continue
    for p in json.loads(b)['result']['results']:
        log('PKG',q,'|',p['name'],'|',p.get('title','')[:90],'|',(p.get('organization') or {}).get('name'),'|',p.get('license_id'),'| res',len(p.get('resources',[])))
st,b=get('https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-32')
for x in sorted(set(re.findall(rb'(?:href|src)="([^"]*(?:ftp|cuadros|\.xls)[^"]*)"',b)))[:40]: log('INDEC link',x.decode())
for u in ('https://www.indec.gob.ar/ftp/cuadros/economia/sh_sipm_2016.xls','https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipim_productos_2016.xls'):
    st,b=get(u); log('INDEC',u,st,len(b))
st,b=get('https://apis.datos.gob.ar/robots.txt'); log('ROBOTS apis full', dec(b)[:3000])
S.close()
