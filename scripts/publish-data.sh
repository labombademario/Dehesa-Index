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
# PUBLISH_DERIVED (rutas separadas por espacios) + PUBLISH_REGEN (comando): ficheros que son funcion de otros datos (motor de precios).
# Si chocan con otra publicacion no se mezclan a mano: se toma la version de origin/main y, terminado el rebase, se regeneran con
# PUBLISH_REGEN sobre el arbol ya unido. Sin estas variables el comportamiento es el de siempre (cualquier otro conflicto falla en rojo).
is_derived() { local f="$1" d; for d in ${PUBLISH_DERIVED:-}; do case "$f" in "$d"|"$d"/*) return 0;; esac; done; return 1; }
for i in 1 2 3 4 5 6; do
  REGEN=0
  if git fetch -q origin main && git rebase -q --autostash origin/main 2>/dev/null; then
    :
  elif git rebase --show-current-patch >/dev/null 2>&1; then
    # rebase detenido por conflicto
    if [ -n "${PUBLISH_DERIVED:-}" ] && [ -n "${PUBLISH_REGEN:-}" ]; then
      for f in $(git diff --name-only --diff-filter=U); do
        if is_derived "$f"; then
          { git checkout --ours -- "$f" 2>/dev/null && git add -- "$f"; } || git rm -q --cached -- "$f" 2>/dev/null || true
          REGEN=1
        fi
      done
    fi
    if python3 scripts/merge-shared.py resolve && { GIT_EDITOR=true git rebase --continue >/dev/null 2>&1 || git rebase --skip >/dev/null 2>&1; }; then
      :
    else
      git rebase --abort 2>/dev/null || true
      sleep $(( (i * 5 + RANDOM % 10) / ${PUBLISH_SLEEP_DIV:-1} )); continue
    fi
  else
    sleep $(( (i * 5 + RANDOM % 10) / ${PUBLISH_SLEEP_DIV:-1} )); continue
  fi
  if [ "$REGEN" = 1 ]; then
    echo "regenerando ficheros derivados tras conflicto"
    if ! bash -c "$PUBLISH_REGEN"; then echo '::error::fallo al regenerar tras el rebase'; exit 1; fi
    git add -- "$@" ${PUBLISH_DERIVED:-} 2>/dev/null || true
    git diff --cached --quiet || git commit -qm "$MSG (regenerado sobre origin/main)"
  fi
  git push -q origin HEAD:main && exit 0
  sleep $(( (i * 5 + RANDOM % 10) / ${PUBLISH_SLEEP_DIV:-1} ))
done
echo '::error::no se pudo publicar tras 6 intentos'; exit 1
