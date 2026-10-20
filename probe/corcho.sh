mkdir -p probe/corcho-out; cd probe/corcho-out
B=https://www.miteco.gob.es/content/dam/miteco/es/biodiversidad/estadisticas
i=0
for u in "$B/otros-aprovecha-forestales/OTROS-APROVECHAMIENTOS-FORESTALES-Tablas-resumen-2005-2022.xlsx" "$B/otros-aprovecha-forestales/OTROS-APROVECHAMIENTOS-FORESTALES-Datos-desglosados-2022.xlsx" "$B/aef/aef2024/anuario-estadistica-forestal-2024-datos.pdf" "$B/anuario-estadistica-forestal-2022-avance.pdf"; do
  i=$((i+1)); ext=${u##*.}; curl -sL -m 180 -A "Mozilla/5.0" -o g$i.$ext -w "$i %{http_code} %{size_download} $u\n" "$u"
  file g$i.$ext | head -1
  if [ $ext = pdf ]; then pdftotext -layout g$i.pdf g$i.txt 2>/dev/null; rm -f g$i.pdf; fi
done
