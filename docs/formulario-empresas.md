# Formulario de la página de empresas

Qué está hecho y qué falta para que el mensaje de contacto llegue sin abrir el programa de correo.

## Hecho
- **Lista de espera de la API**: envía de verdad. Usa la misma cuenta de Buttondown que los avisos (`DehesaShared.digest.action`) con la etiqueta `api-empresas`, de modo que quien se apunta recibe un correo de confirmación y **no** recibe el resumen semanal de precios (ese solo sale a las etiquetas `es` y `en`). Los campos «empresa», «actividad» e «intereses» viajan como `metadata__company`, `metadata__role` y `metadata__interests`; si Buttondown no los admite en el formulario de alta, simplemente se ignoran (comprobarlo con un alta de prueba).
- **Contacto**: el código está listo y envía con un `POST` a la dirección que se ponga en `DehesaShared.contact.action` (`js/shared.js`). Mientras esté vacía, se abre el programa de correo con el mensaje preparado, como antes.
- El aviso de privacidad de la página y el apartado de privacidad de `legal.html` nombran al proveedor en cuanto está configurado.
- La CSP ya permite enviar formularios a `https://formspree.io` (`form-action` en `_headers`).

## Lo que tiene que hacer una persona (tres pasos)
1. Crear una cuenta en https://formspree.io (gratis hasta 50 mensajes al mes) y un formulario nuevo; copiar su dirección (`https://formspree.io/f/<id>`). Indicar el correo donde quieres recibir los mensajes.
2. En `js/shared.js`, campo `contact`: `action` = esa dirección y `provider` = `Formspree (Formspree Inc., Estados Unidos)`.
3. Hacer un envío de prueba desde `/empresas` y comprobar que llega.

Con otro proveedor (Web3Forms, Getform…) hay que añadir su dominio a `form-action` en `_headers` y, si exige una clave pública, un campo oculto; el resto es igual.
