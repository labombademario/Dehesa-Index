#!/usr/bin/env bash
# Ejecuta un comando, muestra su salida y, si falla, publica las ultimas lineas como anotacion de error del job
# (visibles en el resumen de la ejecucion y por la API de check-runs, sin descargar los logs). Mantiene el codigo de salida.
# Uso: bash scripts/annotate-failure.sh <comando> [args...]
set -o pipefail
LOG="$(mktemp)"
"$@" 2>&1 | tee "$LOG"; rc=${PIPESTATUS[0]}
if [ "$rc" -ne 0 ]; then
  msg="$(tail -n 12 "$LOG" | cut -c1-300 | sed 's/%/%25/g' | awk 'BEGIN{ORS="%0A"} {print}')"
  echo "::error title=Fallo en $(basename -- "${2:-$1}") (salida $rc)::${msg}"
fi
rm -f "$LOG"; exit "$rc"
