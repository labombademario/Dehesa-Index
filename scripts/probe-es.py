import json,time,urllib.request,csv,io
def get(u,n=40000000):
    for i in range(4):
        try:
            r=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'})
            with urllib.request.urlopen(r,timeout=120) as x:
                b=x.read(n)
            try: return b.decode('utf-8-sig')
            except: return b.decode('cp1252')
        except Exception as e: last='ERR %s'%e; time.sleep(8)
    return last
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
b='https://servicio.mapa.gob.es/ckan/api/3/action/'
for pk in ['esmaparecanredcontable','esmapasalasincubaciondatosincubacion','esmapaindicespreciosindicepercibido']:
    s=get(b+'package_show?id='+pk)
    try:
        d=json.loads(s)['result']; P('##',pk,d.get('title')); P('NOTES',(d.get('notes') or '')[:900])
        for r in d['resources']:
            P('RES',r.get('name'),r.get('id'),r.get('format'),r.get('datastore_active'))
            if r.get('datastore_active'):
                q=get(b+'datastore_search?limit=3&resource_id='+r['id'])
                try:
                    j=json.loads(q)['result']; P('TOTAL',j.get('total'),'FIELDS',[f['id'] for f in j['fields']]); 
                    for rec in j['records']: P('REC',json.dumps(rec,ensure_ascii=False)[:600])
                except Exception as e: P('ERR',q[:200])
    except Exception as e: P('ERR',s[:200])
open('data/probe/es3.txt','w').write('\n'.join(out))
