import urllib.request, io, os, subprocess, sys, site, importlib
subprocess.run([sys.executable,'-m','pip','install','--break-system-packages','--user','-q','openpyxl'],check=False); sys.path.append(site.getusersitepackages()); importlib.invalidate_caches()
import openpyxl
os.makedirs('probe',exist_ok=True); S=open('probe/summary_ch5.txt','w')
for u in ('https://dam-api.bfs.admin.ch/hub/api/dam/assets/36210423/master','https://dam-api.bfs.admin.ch/hub/api/dam/assets/36840035/master'):
    b=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'DehesaIndex-research'}),timeout=120).read()
    wb=openpyxl.load_workbook(io.BytesIO(b),data_only=True)
    for ws in wb.worksheets[:1]:
        for r in ws.iter_rows(values_only=True):
            if r and r[0] is not None: S.write(repr(r[0])+'\n')
    S.write('-----\n')
S.close()
