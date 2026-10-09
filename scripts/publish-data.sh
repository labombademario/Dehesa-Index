#!/usr/bin/env bash
# Publica datos: git add de las rutas, commit y push con reintentos.
# Uso: bash scripts/publish-data.sh "mensaje del commit" ruta [ruta...]
# Si otro workflow publico a la vez, se rebasa sobre origin/main; los conflictos en data/revisions.json y data/source-status.json
# se resuelven mezclando (scripts/merge-shared.py); cualquier otro conflicto aborta y reintenta. Tras 6 intentos falla en rojo.
set -u
MSG="$1"; shift
git config user.name "${PUBLISH_AUTHOR:-github-actions[bot]}"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
if [ "$#" -gt 0 ]; then git add -- "$@" || exit 1; fi   # sin rutas: se publica lo que el llamador ya dejo en el indice
git diff --cached --quiet && { echo "Sin cambios que publicar"; exit 0; }
git commit -qm "$MSG"
for i in 1 2 3 4 5 6; do
  if git fetch -q origin main && git rebase -q --autostash origin/main 2>/dev/null; then
    git push -q origin HEAD:main && exit 0
  elif git rebase --show-current-patch >/dev/null 2>&1; then
    # rebase detenido por conflicto
    if python3 scripts/merge-shared.py resolve && GIT_EDITOR=true git rebase --continue >/dev/null 2>&1; then
      git push -q origin HEAD:main && exit 0
    fi
    git rebase --abort 2>/dev/null || true
  fi
  sleep $(( (i * 5 + RANDOM % 10) / ${PUBLISH_SLEEP_DIV:-1} ))
done
echo '::error::no se pudo publicar tras 6 intentos'; exit 1
