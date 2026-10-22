import urllib.request, re
out=open('probe/out/mapa.txt','w')
u='https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/agricultura/superficies-producciones-anuales-cultivos/'
import traceback
try:
  h=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)'}),timeout=90).read().decode('utf-8','replace')
except Exception as e:
  out.write('ERR %r\n'%e); h=''
out.write('len %d\n'%len(h))
for m in re.finditer(r'\.xlsx', h):
    a=max(0,m.start()-900); out.write('-----\n'+re.sub(r'\s+',' ',h[a:m.end()+300])+'\n')
