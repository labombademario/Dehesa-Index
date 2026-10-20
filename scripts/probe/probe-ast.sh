#!/usr/bin/env bash
# Sondeo puntual (2): ficheros del Principado de Asturias; descargas.asturias.es no respondió la primera vez, se prueba IPv4, HTTP/1.1 y SADEI
set -u
O=probe-ast-out; mkdir -p $O; : > $O/status.txt
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
B=https://descargas.asturias.es/asturias/opendata/MedioRural/precios_sector
get(){ for i in 1 2; do curl -4 --http1.1 -sSL -m 40 -A "$UA" -o "$O/$1" -w "$1 %{http_code} %{size_download} %{content_type}\n" "$2" >> $O/status.txt 2>&1 && break; echo "$1 intento $i FALLO" >> $O/status.txt; done; }
for f in dataset-precios-percibidos dataset-precio-medio-vacuno; do get $f.xlsx "$B/$f.xlsx"; done
get robots-descargas.txt "https://descargas.asturias.es/robots.txt"
get sadei-99040214.html "https://sadei.es/sadei/pxweb/en/01/99__04__02/99040214.px"
get sadei-robots.txt "https://sadei.es/robots.txt"
get sadei-api-root.json "https://sadei.es/sadei/api/v1/es/01/99__04__02/"
get sadei-api-root2.json "https://sadei.es/sadei/api/v1/en/01/99__04__02/"
python3 - <<'PY'
import re,os
O='probe-ast-out'
p=O+'/sadei-99040214.html'
if os.path.exists(p):
    t=open(p,encoding='utf-8',errors='replace').read()
    open(O+'/sadei.legal.txt','w').write('\n'.join(sorted(set(re.findall(r'(?i)[^<>]{0,160}(?:licen|reutiliz|creative|aviso legal|derechos|copyright|cita la fuente)[^<>]{0,200}',t))))+'\n--- LINKS\n'+'\n'.join(sorted(set(re.findall(r'href="([^"]+)"',t)))[:80]))
PY
ls -la $O
