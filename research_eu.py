import subprocess, os, sys
os.makedirs('research_out/real', exist_ok=True)
for s in ['update-denmark-depth', 'update-cap-dk', 'update-nl-cbs', 'update-nl-rvo', 'update-fr-vigieau', 'update-fr-cereobs']:
    p = subprocess.run([sys.executable, 'scripts/%s.py' % s, '--outdir', 'research_out/real/' + s], capture_output=True, text=True, timeout=1500)
    open('research_out/real/%s.log' % s, 'w').write('exit %s\n--stdout--\n%s\n--stderr--\n%s\n' % (p.returncode, p.stdout[-6000:], p.stderr[-3000:]))
    print(s, p.returncode, flush=True)
