import subprocess, shutil
from pathlib import Path
O = Path('probe_es5'); O.mkdir(exist_ok=True)
for s in ('update-spain-siega.py', 'update-spain-hicp.py'):
    r = subprocess.run(['python3', 'scripts/' + s, '--out', str(O)], capture_output=True, text=True)
    (O / (s + '.out.txt')).write_text((r.stdout or '') + (r.stderr or '') + '\nrc=%d' % r.returncode)
print('ok')
