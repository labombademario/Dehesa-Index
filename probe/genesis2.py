import os, json, io, zipfile, urllib.request, urllib.parse
exec(open("probe/genesis.py").read().split("for n in [")[0])
c, r = post("metadata/table", name="41141-0110", area="all", language="de")
print("meta", c, len(r)); print(r[:3500].decode("utf-8", "replace"))
for kw in [dict(regionalvariable="DLAND", regionalkey="01"), dict(regionalvariable="DLAND", regionalkey="01", classifyingvariable1="BNZAT4", classifyingkey1="BNZAT-2")]:
    tf("41141-0110-test", startyear="2010", **kw)
