#!/usr/bin/env bash
# Sondeo manual de fuentes de Rumania desde un runner de GitHub Actions (INS/TEMPO, MADR, data.gov.ro).
# Solo comprueba alcanzabilidad y formato (codigo HTTP, tipo, tamano, primeros caracteres); no guarda datos ni ingiere nada.
# Escribe docs/probes/ro-sources.md. Las licencias hay que leerlas en las paginas de condiciones: aqui solo se baja su texto inicial.
set -u
OUT=docs/probes/ro-sources.md
{ echo "# Sondeo de fuentes de Rumania desde GitHub Actions"; echo; echo "Ejecutado: $(date -u +%Y-%m-%dT%H:%MZ). Solo alcanzabilidad y formato, no es ingesta."; echo; } > "$OUT"
probe() {  # nombre url [max_bytes]
  local n="$1" u="$2" tmp; tmp=$(mktemp)
  local r; r=$(curl -sS -L --max-time 40 --max-filesize 3000000 -A "DehesaIndex/1.0 (+https://dehesaindex.com)" -H "Accept-Language: en,ro;q=0.8" -o "$tmp" -w '%{http_code} %{content_type} %{size_download}B %{time_total}s final=%{url_effective}' "$u" 2>&1 | tail -1)
  { echo "## $n"; echo; echo "- URL: \`$u\`"; echo "- Resultado: \`$r\`"; echo '- Inicio de la respuesta:'; echo '```'; head -c 600 "$tmp" | tr -d '\000' | sed 's/\r//' | head -12; echo; echo '```'; echo; } >> "$OUT"
  rm -f "$tmp"
}
probe "INS portada" "https://insse.ro/cms/en"
probe "INS TEMPO online (443)" "https://statistici.insse.ro/tempo-online/"
probe "INS TEMPO API matrices (puerto 8077)" "http://statistici.insse.ro:8077/tempo-ins/matrix/matrices"
probe "INS TEMPO API matriz ejemplo (8077)" "http://statistici.insse.ro:8077/tempo-ins/matrix/AGR101A"
probe "INS TEMPO API por 443" "https://statistici.insse.ro/tempo-ins/matrix/matrices"
probe "INS datos abiertos / condiciones" "https://insse.ro/cms/en/content/terms-and-conditions"
probe "MADR portada" "https://www.madr.ro/"
probe "MADR estadistica / preturi" "https://www.madr.ro/horticultura/legume-fructe.html"
probe "MADR datos abiertos" "https://www.madr.ro/date-deschise.html"
probe "data.gov.ro portada" "https://data.gov.ro/"
probe "data.gov.ro CKAN busqueda agricultura" "https://data.gov.ro/api/3/action/package_search?q=agricultura&rows=5"
probe "data.gov.ro CKAN organizaciones" "https://data.gov.ro/api/3/action/organization_list"
probe "data.gov.ro licencia (OGL)" "https://data.gov.ro/pages/licenta-guvernare-deschisa"
echo "Sondeo terminado"
