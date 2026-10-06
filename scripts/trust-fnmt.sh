#!/bin/bash
# El MAPA (servicio.mapa.gob.es) renovo su certificado el 2026-10-04 y envia la cadena FNMT con la raiz nueva
# "AC RAIZ FNMT-RCM SERVIDORES SEGUROS G2R", que el almacen de Ubuntu aun no incluye: OpenSSL falla con
# "self-signed certificate in certificate chain". Se anaden como confianza el intermedio y la raiz G2R *firmada de
# forma cruzada* por la AC RAIZ FNMT-RCM (que si esta en el almacen). La verificacion TLS sigue activa y la cadena se
# valida hasta una raiz ya confiable. Autorizado por Mario el 2026-10-06. El cruzado caduca el 2029-12-16;
# retirar este paso cuando Ubuntu incluya la raiz G2R.
set -e
D="$(cd "$(dirname "$0")" && pwd)"
sudo cp "$D/certs/fnmt-servidores-g2r-cruzado.pem" /usr/local/share/ca-certificates/fnmt-servidores-g2r-cruzado.crt
sudo update-ca-certificates >/dev/null
echo "FNMT G2R (cruzado) anadido al almacen de confianza"
