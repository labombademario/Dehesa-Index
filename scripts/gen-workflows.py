#!/usr/bin/env python3
"""Genera los workflows de datos "estandar" a partir de sources.yml (un solo sitio donde cambiar cron, script, ficheros y mensaje).
Uso: python3 scripts/gen-workflows.py          # escribe .github/workflows/update-<id>.yml
     python3 scripts/gen-workflows.py --check  # sale con 1 si algun workflow generado difiere de sources.yml (para CI)
Cada workflow generado: checkout -> (pre) -> script -> validar con esquema y tests (descarta el cambio si falla) -> detectar revisiones -> commit con reintentos."""
import json, sys
from pathlib import Path
import yaml
ROOT = Path(__file__).resolve().parents[1]
def q(s): return "'" + str(s).replace("'", "''") + "'"
def render(x):
    L = ["# GENERADO por scripts/gen-workflows.py a partir de sources.yml. No editar a mano.", "name: " + x["name"], "on:", "  schedule:"]
    L += ["    - cron: " + q(c) for c in x["cron"]]
    L += ["  workflow_dispatch:"]
    if x.get("dispatch_inputs"):
        L.append("    inputs:")
        for k, v in x["dispatch_inputs"].items():
            L += ["      %s:" % k, "        description: " + q(v["description"]), "        required: " + ("true" if v.get("required") else "false"), "        default: " + q(v.get("default", ""))]
    L += ["permissions:", "  contents: write", "concurrency:", "  group: dehesa-data-writes", "  cancel-in-progress: false", "jobs:", "  update:", "    runs-on: ubuntu-latest"]
    if x.get("timeout"): L.append("    timeout-minutes: %d" % x["timeout"])
    L += ["    steps:", "      - uses: actions/checkout@v4"]
    for p in x.get("pre", []): L.append("      - run: " + p)
    cmd = ("python3 " + x["script"] + (" " + x["args"] if x.get("args") else "")).strip()
    L.append("      - run: " + cmd)
    if x.get("env"):
        L.append("        env:"); L += ["          %s: %s" % (k, v) for k, v in x["env"].items()]
    if x.get("script_timeout"): L.append("        timeout-minutes: %d" % x["script_timeout"])
    if x.get("continue"): L.append("        continue-on-error: true")
    always = ["        if: always()"] if x.get("continue") else []
    files = " ".join("data/" + f for f in x["data"])
    if x["data"]:
        L += ["      - name: Validar datos (esquema y tests) antes de commit"] + always + ["        run: |",
              "          python3 scripts/validate-data.py --no-report --files %s || { echo '::error::datos invalidos: se descarta el cambio'; git checkout -- %s; }" % (files, files),
              "          python3 scripts/detect-revisions.py %s || true" % files]
    adds = " ".join(["data/" + f for f in x["data"] + x.get("extra", [])] + (["data/" + x["log"]] if x.get("log") else []) + (["data/revisions.json"] if x["data"] else []))
    L += ["      - name: Publicar"] + always + ["        run: |", '          git config user.name "github-actions[bot]"', '          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"',
          "          git add " + adds, "          git diff --cached --quiet && exit 0", "          git commit -qm " + json.dumps(x["message"], ensure_ascii=False),
          "          for i in 1 2 3; do", "            git pull -q --rebase --autostash && git push && exit 0", "            sleep $((i * 5))", "          done", "          exit 1"]
    return "\n".join(L) + "\n"
def main():
    cfg = yaml.safe_load((ROOT / "sources.yml").read_text(encoding="utf-8")); bad = 0
    for x in cfg["sources"]:
        out = ROOT / ".github" / "workflows" / ("update-%s.yml" % x["id"]); txt = render(x)
        yaml.safe_load(txt)
        if "--check" in sys.argv:
            if not out.exists() or out.read_text(encoding="utf-8") != txt: print("DESINCRONIZADO:", out.name); bad += 1
        else: out.write_text(txt, encoding="utf-8"); print("generado", out.name)
    sys.exit(1 if bad else 0)
main()
