import subprocess, os
os.makedirs("tmp-probe/eu", exist_ok=True)
r = subprocess.run(["python3", "scripts/update-eurostat-regions.py", "--only", "nl,at", "--outdir", "tmp-probe/eu"], capture_output=True, text=True)
open("tmp-probe/run.txt", "w").write(r.stdout[-6000:] + "\n" + r.stderr[-3000:] + "\nrc=%d" % r.returncode)
