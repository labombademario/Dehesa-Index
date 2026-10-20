#!/usr/bin/env bash
# Sondeo puntual (no es un pipeline): descarga el CSV del Observatorio de precios agrarios de Castilla y León y las páginas con su licencia/aviso legal
set -u
O=probe-jcyl-out; mkdir -p $O
UA="Mozilla/5.0 (compatible; DehesaIndexProbe/1.0; +https://dehesaindex.com)"
get(){ curl -sSL -m 60 -A "$UA" -o "$O/$1" -w "$1 %{http_code} %{size_download} %{content_type}\n" "$2" >> $O/status.txt 2>&1 || echo "$1 FALLO $2" >> $O/status.txt; }
get observatorio.csv "https://datosabiertos.jcyl.es/web/jcyl/risp/es/medio-rural-pesca/observatorio-precios-agrarios/1284987653873.csv"
get dataset.html "https://datosabiertos.jcyl.es/web/jcyl/set/es/medio-rural-pesca/observatorio-precios-agrarios/1284987653873"
get robots.txt "https://datosabiertos.jcyl.es/robots.txt"
get lonjas2026.html "https://agriculturaganaderia.jcyl.es/web/es/estadistica-informacion-agraria/lonjas-2026.html"
get robots-agri.txt "https://agriculturaganaderia.jcyl.es/robots.txt"
python3 - <<'PY'
import csv,io,collections,re,os
O='probe-jcyl-out'
p=O+'/observatorio.csv'
if os.path.exists(p):
    raw=open(p,'rb').read()
    for enc in ('utf-8-sig','cp1252','latin-1'):
        try: txt=raw.decode(enc); break
        except: pass
    open(O+'/encoding.txt','w').write(enc)
    lines=txt.splitlines(); open(O+'/head.txt','w').write('\n'.join(lines[:25]))
    delim=';' if lines[0].count(';')>lines[0].count(',') else ','
    rows=list(csv.reader(io.StringIO(txt),delimiter=delim)); hdr=rows[0]
    out=['delim '+delim,'rows %d'%(len(rows)-1),'header '+repr(hdr)]
    for i,h in enumerate(hdr):
        c=collections.Counter(r[i] for r in rows[1:] if len(r)>i)
        out.append('COL %d %s: %d distintos; ejemplos %r'%(i,h,len(c),list(c.items())[:12]))
    open(O+'/structure.txt','w').write('\n'.join(out))
for f in ('dataset.html','lonjas2026.html'):
    p=O+'/'+f
    if os.path.exists(p):
        t=open(p,encoding='utf-8',errors='replace').read()
        ms=set(re.findall(r'(?i)[^<>]{0,160}(?:licencia|creative commons|aviso legal|reutiliza|condiciones de uso)[^<>]{0,200}',t))
        links=set(re.findall(r'href="([^"]*(?:aviso|licen|legal|creativecommons)[^"]*)"',t,re.I))
        open(O+'/'+f+'.legal.txt','w').write('\n'.join(sorted(ms))+'\n--- LINKS\n'+'\n'.join(sorted(links)))
PY
ls -la $O
