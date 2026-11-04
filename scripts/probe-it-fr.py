#!/usr/bin/env python3
import runpy, sys
sys.argv = ["update-fr-communes.py"]
sys.exit(runpy.run_path("scripts/update-fr-communes.py", run_name="__main__").get("rc", 0))
# 24
# 25
# 26
