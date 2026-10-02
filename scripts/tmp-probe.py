import subprocess, os
os.makedirs("tmp-probe/au", exist_ok=True)
r = subprocess.run(["python3", "scripts/update-au-states.py", "--outdir", "tmp-probe/au"], capture_output=True, text=True)
open("tmp-probe/au-run.txt", "w").write("rc=%s\n%s\n%s" % (r.returncode, r.stdout[-6000:], r.stderr[-3000:]))
