import urllib.request, re
out=open('probe/out/mapa.txt','w')
u='https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/agricultura/superficies-producciones-anuales-cultivos/'
h=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)'}),timeout=90).read().decode('utf-8','replace')
for m in re.finditer(r'reglamento-n--543-2009/[^"]+\.xlsx', h):
    a=max(0,m.start()-900); out.write('-----\n'+re.sub(r'\s+',' ',h[a:m.end()+300])+'\n')
