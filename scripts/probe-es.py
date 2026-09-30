import csv,io,time,urllib.request,collections
def get(u):
    for i in range(4):
        try:
            r=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'})
            with urllib.request.urlopen(r,timeout=300) as x: b=x.read()
            try: return b.decode('utf-8-sig')
            except: return b.decode('cp1252')
        except Exception as e: last='ERR %s'%e; time.sleep(10)
    return last
s=get('https://servicio.mapa.gob.es/ckan/datastore/dump/687a7bb1-ddf2-4cdd-8525-05cec40c6734')
out=['LEN %d'%len(s), s[:300]]
rows=list(csv.DictReader(io.StringIO(s)))
out.append('ROWS %d'%len(rows))
def cnt(k): return collections.Counter(r[k] for r in rows)
for k in ['ejercicio','desc_ccaa','tipo_explotacion_n1','dimension_economica']:
    out.append('## '+k+' '+str(dict(cnt(k))))
vs=collections.OrderedDict()
for r in rows: vs.setdefault((r['id_variable'],r['variable'],r['unidades']),0); vs[(r['id_variable'],r['variable'],r['unidades'])]+=1
out.append('## VARIABLES %d'%len(vs))
for k,v in vs.items(): out.append('VAR %s | %s | %s | %d'%(k[0],k[1],k[2],v))
# sample: total nacional? 
sm=[r for r in rows if r['ejercicio']=='2024' and r['desc_ccaa']==rows[0]['desc_ccaa'] and r['id_variable'] in('SE010','SE131','SE275')][:30]
for r in sm: out.append('S %s | %s | %s | %s | %s %s | rep %s'%(r['tipo_explotacion_n1'],r['tipo_explotacion_n3'],r['dimension_economica'],r['id_variable'],r['valor'],r['unidades'],r['num_explotaciones_representadas']))
open('data/probe/es4.txt','w').write('\n'.join(out))
