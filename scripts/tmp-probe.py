import os, subprocess
os.makedirs("tmp-probe", exist_ok=True)
env = dict(os.environ, ONLY="costs balance fuel")
r = subprocess.run(["python3", "scripts/update-canada-stats.py"], env=env, capture_output=True, text=True)
open("tmp-probe/run8.txt", "w").write("rc=%s\n%s\n%s" % (r.returncode, r.stdout[-3000:], r.stderr[-3000:]))
