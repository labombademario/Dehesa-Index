# ABARES Australian Crop Report (carga manual)

- Fuente: ABARES, Australian Crop Report, edicion de septiembre 2026 (No. 219). Original: https://doi.org/10.25814/5s62-8a44. Licencia CC BY 4.0.
- ABARES no es accesible desde GitHub Actions (agriculture.gov.au agota el tiempo), por eso la carga es manual cada trimestre (marzo, junio, septiembre, diciembre).
- Para actualizar: bajar el Excel "CropData" de la nueva edicion, ponerlo aqui, cambiar `XLSX` y `EDITION` en `scripts/build-abares-crop-report.py`, ejecutar `python3 scripts/build-abares-crop-report.py` y actualizar `attributionText` de `abares` en `data/license-registry.json`.
- Solo se cargan tablas de ABARES y valores unitarios de exportacion de ABS. No se cargan precios internacionales ni domesticos (compilados de terceros: CME, USDA, IGC, Farm Weekly, The Land).
