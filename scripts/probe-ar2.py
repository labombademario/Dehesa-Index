import urllib.request, re, ssl, json, sys
UA={'User-Agent':'Mozilla/5.0 (Dehesa-Index probe)'}
out=[]
def get(u,n=3000,binary=False):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=40); b=r.read()
        out.append('OK %s -> %s %d bytes %s'%(u,r.status,len(b),r.headers.get('content-type')))
        return b
    except Exception as e:
        out.append('ERR %s -> %r'%(u,e)); return None
for u in ['https://www.indec.gob.ar/ftp/ica_digital/ica_d_09_266E5973E036/','https://www.indec.gob.ar/ftp/ica_digital/ica_d_09_266E5973E036/index.html',
          'https://comex.indec.gob.ar/','https://comex.indec.gob.ar/#/search','https://www.indec.gob.ar/indec/web/Nivel3-Tema-3-2','https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-2-40',
          'https://www.indec.gob.ar/ftp/cuadros/economia/ica_cuadros_18_09_26.xls','https://www.indec.gob.ar/ftp/cuadros/economia/ica_anexo_cuadros_18_09_26.xls']:
    b=get(u)
    if b and (u.endswith('/') or u.endswith('html') or 'Nivel' in u):
        t=b.decode('utf-8','ignore'); out.append(t[:1500].replace('\n',' '))
        for m in sorted(set(re.findall(r'href="([^"]+\.(?:xls|xlsx|csv|zip|json))"',t)))[:40]: out.append('  LINK '+m)
open('data/probe-ar2.txt','w').write('\n'.join(out)+'\n')
