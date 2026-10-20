mkdir -p probe/corcho-out; cd probe/corcho-out
B=https://www.miteco.gob.es/content/dam/miteco/es/biodiversidad/estadisticas
i=0
for u in "$B/aef2022/Anuario%20Estadistica%20Forestal%202022.pdf" "$B/aef2021/Anuario%20Estadistica%20Forestal%202021.pdf" "$B/otros-aprovecha-forestales/Otros-Aprovechamientos-Forestales-IME.pdf" "$B/aef2023/Anuario%20Estadistica%20Forestal%202023.pdf" "$B/aef2024/Anuario%20Estadistica%20Forestal%202024.pdf"; do
  i=$((i+1)); curl -sL -m 120 -A "Mozilla/5.0" -o f$i.pdf -w "$i %{http_code} %{size_download} $u\n" "$u"
  file f$i.pdf | head -1
  pdftotext -layout f$i.pdf f$i.txt 2>/dev/null && grep -n -i "corcho" f$i.txt | head -40 > f$i.grep; wc -l f$i.grep
  rm -f f$i.pdf
done
