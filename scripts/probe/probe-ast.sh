#!/usr/bin/env bash
# Sondeo puntual: ficheros abiertos del Principado de Asturias «Precios del sector agrario» (Medio Rural)
set -u
O=probe-ast-out; mkdir -p $O
UA="Mozilla/5.0 (compatible; DehesaIndexProbe/1.0; +https://dehesaindex.com)"
B=https://descargas.asturias.es/asturias/opendata/MedioRural/precios_sector
get(){ curl -sSL -m 90 -A "$UA" -o "$O/$1" -w "$1 %{http_code} %{size_download} %{content_type}\n" "$2" >> $O/status.txt 2>&1 || echo "$1 FALLO $2" >> $O/status.txt; }
for f in dataset-precio-tierras-agrario dataset-precio-medio-vacuno dataset-precios-vacuno-historico dataset-precios-percibidos; do get $f.xlsx "$B/$f.xlsx"; done
get robots-descargas.txt "https://descargas.asturias.es/robots.txt"
get dp.html "https://datos.gob.es/es/catalogo/a03002951-precios-sector-agrario"
pip install -q openpyxl 2>&1 | tail -1
python3 - <<'PY'
import glob,os,re
from openpyxl import load_workbook
O='probe-ast-out'
for f in sorted(glob.glob(O+'/*.xlsx')):
    out=[]
    try:
        wb=load_workbook(f,read_only=True,data_only=True)
        for ws in wb.worksheets:
            rows=list(ws.iter_rows(values_only=True))
            out.append('=== SHEET %r dims %s rows %d'%(ws.title,ws.dimensions,len(rows)))
            for i,r in enumerate(rows[:30]): out.append('%d: %r'%(i,[c for c in r][:16]))
            out.append('... ULTIMAS')
            for i,r in enumerate(rows[-8:]): out.append('%r'%([c for c in r][:16],))
    except Exception as e: out.append('ERROR %s'%e)
    open(f+'.txt','w').write('\n'.join(out))
t=open(O+'/dp.html',encoding='utf-8',errors='replace').read()
open(O+'/dp.legal.txt','w').write('\n'.join(sorted(set(re.findall(r'(?i)[^<>]{0,120}(?:licen|creativecommons|aviso legal)[^<>]{0,160}',t)))))
PY
ls -la $O
