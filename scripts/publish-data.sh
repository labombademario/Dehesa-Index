#!/usr/bin/env bash
# Publica datos: git add de las rutas, commit y push con reintentos.
# Uso: bash scripts/publish-data.sh "mensaje del commit" ruta [ruta...]
# Si otro workflow publico a la vez, se rebasa sobre origin/main; los conflictos en data/revisions.json y data/source-status.json
# se resuelven mezclando (scripts/merge-shared.py); cualquier otro conflicto aborta y reintenta. Tras 10 intentos (esperas crecientes, ~8 min en total) falla en rojo.
# Tras publicar avisa (repository_dispatch «data-published») para que el observatorio y el estado de los pipelines se rehagan solos
# (refresh-observatory.yml); los commits de GITHUB_TOKEN no disparan workflows por push, pero un repository_dispatch si. PUBLISH_NO_NOTIFY=1 lo desactiva.
set -u
MSG="$1"; shift
git config user.name "${PUBLISH_AUTHOR:-github-actions[bot]}"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
if [ "$#" -gt 0 ]; then
  # Rutas que ni existen ni estan en el indice (p. ej. un dataset opcional aun sin publicar) se ignoran: git add falla entero con una sola ruta inexistente.
  KEEP=(); for p in "$@"; do if [ -e "$p" ] || [ -n "$(git ls-files -- "$p" | head -1)" ]; then KEEP+=("$p"); fi; done
  if [ "${#KEEP[@]}" -gt 0 ]; then git add -- "${KEEP[@]}" || exit 1; fi
fi   # sin rutas: se publica lo que el llamador ya dejo en el indice
git diff --cached --quiet && { echo "Sin cambios que publicar"; exit 0; }
git commit -qm "$MSG"
# PUBLISH_DERIVED (rutas separadas por espacios) + PUBLISH_REGEN (comando): ficheros que son funcion de otros datos (motor de precios).
# Si chocan con otra publicacion no se mezclan a mano: se toma la version de origin/main y, terminado el rebase, se regeneran con
# PUBLISH_REGEN sobre el arbol ya unido. Sin estas variables el comportamiento es el de siempre (cualquier otro conflicto falla en rojo).
notify() {
  [ -n "${PUBLISH_NO_NOTIFY:-}" ] && return 0
  [ -n "${GITHUB_REPOSITORY:-}" ] || return 0
  local tok="${GH_TOKEN:-${GITHUB_TOKEN:-}}" h
  if [ -z "$tok" ]; then   # actions/checkout deja el token del job en la configuracion de git (cabecera basic x-access-token:TOKEN)
    h=$(git config --includes --get-regexp '^http\..*\.extraheader$' 2>/dev/null | sed -n 's/.*[Bb][Aa][Ss][Ii][Cc] //p' | head -1)
    [ -n "$h" ] && tok=$(printf '%s' "$h" | base64 -d 2>/dev/null | cut -d: -f2-)
  fi
  [ -n "$tok" ] || { echo "aviso al observatorio: sin token, se queda para su pasada programada"; return 0; }
  local code; code=$(curl -sS -m 15 -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $tok" -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$GITHUB_REPOSITORY/dispatches" -d '{"event_type":"data-published"}' 2>/dev/null) || true
  echo "aviso al observatorio: HTTP ${code:-sin respuesta}"
  return 0
}
is_derived() { local f="$1" d; for d in ${PUBLISH_DERIVED:-}; do case "$f" in "$d"|"$d"/*) return 0;; esac; done; return 1; }
for i in 1 2 3 4 5 6 7 8 9 10; do
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
      sleep $(( (i * 8 + RANDOM % 15) / ${PUBLISH_SLEEP_DIV:-1} )); continue
    fi
  else
    sleep $(( (i * 8 + RANDOM % 15) / ${PUBLISH_SLEEP_DIV:-1} )); continue
  fi
  if [ "$REGEN" = 1 ]; then
    echo "regenerando ficheros derivados tras conflicto"
    if ! bash -c "$PUBLISH_REGEN"; then echo '::error::fallo al regenerar tras el rebase'; exit 1; fi
    git add -- "$@" ${PUBLISH_DERIVED:-} 2>/dev/null || true
    git diff --cached --quiet || git commit -qm "$MSG (regenerado sobre origin/main)"
  fi
  git push -q origin HEAD:main && { notify; exit 0; }
  sleep $(( (i * 8 + RANDOM % 15) / ${PUBLISH_SLEEP_DIV:-1} ))
done
echo '::error::no se pudo publicar tras 10 intentos'; exit 1
