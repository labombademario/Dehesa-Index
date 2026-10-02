import subprocess, os
os.makedirs("tmp-probe", exist_ok=True)
r = subprocess.run(["python3", "scripts/update-canada-drought.py"], capture_output=True, text=True)
open("tmp-probe/run20.txt", "w").write("rc=%s\n%s\n%s" % (r.returncode, r.stdout[-3000:], r.stderr[-3000:]))
