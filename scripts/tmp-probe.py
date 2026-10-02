import subprocess, os
os.makedirs("tmp-probe/eu", exist_ok=True)
r = subprocess.run(["python3", "scripts/update-eurostat-regions.py", "--outdir", "tmp-probe/eu"], capture_output=True, text=True)
open("tmp-probe/eu-run.txt", "w").write("rc=%s\n%s\n%s" % (r.returncode, r.stdout[-6000:], r.stderr[-3000:]))
