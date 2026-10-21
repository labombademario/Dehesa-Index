import urllib.request, re, io, subprocess, sys
UA={'User-Agent':'Mozilla/5.0 (Dehesa-Index probe)'}
out=[]
def get(u):
    try:
        b=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=90).read(); out.append('OK %s %d'%(u,len(b))); return b
    except Exception as e: out.append('ERR %s %r'%(u,e)); return None
h=get('https://www.indec.gob.ar/ftp/ica_digital/ica_d_09_266E5973E036/')
if h:
    t=h.decode('utf-8','ignore')
    for m in sorted(set(re.findall(r'["\'(]([^"\'()\s]*data/[^"\'()\s]+)',t)))[:80]: out.append('  DATA '+m)
    for m in sorted(set(re.findall(r'["\']([^"\']+\.(?:xlsx|xls|csv|zip|json))["\']',t)))[:80]: out.append('  FILE '+m)
subprocess.run([sys.executable,'-m','pip','install','-q','xlrd','--break-system-packages'])
import xlrd
for u in ['https://www.indec.gob.ar/ftp/cuadros/economia/ica_cuadros_18_09_26.xls','https://www.indec.gob.ar/ftp/cuadros/economia/ica_anexo_cuadros_18_09_26.xls']:
    b=get(u)
    if not b: continue
    wb=xlrd.open_workbook(file_contents=b)
    for s in wb.sheets():
        t=' | '.join(str(c.value)[:90] for c in s.row_slice(0)[:2] if str(c.value).strip()) or ' | '.join(str(c.value)[:90] for c in s.row_slice(1)[:2] if str(c.value).strip())
        out.append('SHEET %s [%dx%d] %s'%(s.name,s.nrows,s.ncols,t))
open('data/probe-ar2.txt','w').write('\n'.join(out)+'\n')
