import json,re,urllib.request,html,time,csv,io,subprocess
def get(u,n=50000000,t=120,retries=3,raw=False):
    last=''
    for i in range(retries):
        try:
            r=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'})
            with urllib.request.urlopen(r,timeout=t) as x:
                b=x.read(n); return b if raw else b.decode('utf-8-sig','replace')
        except Exception as e:
            last='ERR %s'%e; time.sleep(5)
    return last
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def txt(s): return re.sub(r'\\s+',' ',html.unescape(re.sub(r'<script.*?</script>|<style.*?</style>|<[^>]+>',' ',s,flags=re.S)))
# licence on dataset page
s=get('https://servicio.mapa.gob.es/ckan/es/dataset/esmapaindicespreciospreciopercibido')
t=txt(s); i=t.lower().find('licen'); P('PAGE LICENCE',t[max(0,i-200):i+500])
# dumps
for name,id_ in [('percibido','23939af3-475f-4a4b-b18e-48fa9dbc4f3b'),('pagado','bb45def4-7841-4fa8-9a56-b7f959a9a951'),('ind_percibido','9172de03-2332-4832-9c11-3e2c39617f18'),('ind_pagado','9c0c9db7-7855-4e8a-b460-88129eb589ad'),('recan','687a7bb1-ddf2-4cdd-8525-05cec40c6734'),('incubacion','aea63a88-6e51-4786-bac7-effee027c2db')]:
    s=get('https://servicio.mapa.gob.es/ckan/datastore/dump/'+id_)
    P('DUMP',name,len(s))
    lines=s.split('\\n'); P('  header',lines[0][:300]); 
    for l in lines[1:4]: P('  row',l[:300])
    try:
        rows=list(csv.DictReader(io.StringIO(s)))
        P('  nrows',len(rows),'cols',list(rows[0].keys()))
        for c in rows[0].keys():
            vals=sorted(set(r[c] for r in rows))
            if len(vals)<=60 and not re.search('valor|precio|indice',c,re.I): P('  col',c,len(vals),vals[:60])
            elif len(vals)>60: P('  col',c,'distinct',len(vals),vals[:5],vals[-3:])
    except Exception as e: P('  csv ERR',e)
# aviso legal completo
s=get('https://servicio.mapa.gob.es/siarweb/avisoLegal'); t=txt(s); i=t.find('Las presentes condiciones'); P('AVISO',t[i:i+6000])
# manual API
b=get('https://servicio.mapa.gob.es/siarweb/documentos/manuales/ManualTecnico_WEB_API_SIAR.pdf',raw=True)
if isinstance(b,bytes):
    open('/tmp/m.pdf','wb').write(b); subprocess.run(['sudo','apt-get','install','-y','-qq','poppler-utils'],capture_output=True)
    r=subprocess.run(['pdftotext','-layout','/tmp/m.pdf','-'],capture_output=True,text=True); P('MANUAL',len(b),r.stdout[:6000])
else: P('MANUAL ERR',b)
open('data/probe/es.txt','w').write('\\n'.join(out))
