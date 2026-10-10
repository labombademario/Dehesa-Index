/* Dehesa Index — página de Contacto: el correo es la acción principal (no hay formulario hasta que pueda enviarse de verdad) */
(function () {
  'use strict';

  var STRINGS = {
    "es": {
      "title": "Contacto | Dehesa Index",
      "h1": "Contacto",
      "sub": "¿Preguntas, datos que quieras aportar o interés en colaborar? Escríbenos por correo: lo leemos nosotros.",
      "emailLabel": "CORREO",
      "write": "Escribir un correo",
      "copy": "Copiar la dirección",
      "copied": "Dirección copiada",
      "subject": "Consulta desde Dehesa Index",
      "note": "No hay formulario en la web ni guardamos esta consulta aquí: tu mensaje se tramita por correo, y lo que nos escribas queda en nuestro buzón. Consulta la información de privacidad."
    },
    "en": {
      "title": "Contact | Dehesa Index",
      "h1": "Contact",
      "sub": "Questions, data you would like to contribute or interest in working together? Email us: we read it ourselves.",
      "emailLabel": "EMAIL",
      "write": "Write an email",
      "copy": "Copy the address",
      "copied": "Address copied",
      "subject": "Enquiry from Dehesa Index",
      "note": "There is no form on the site and we do not store this enquiry here: your message is handled by email, and what you write stays in our mailbox. See the privacy information."
    },
    "fr": {
      "title": "Contact | Dehesa Index",
      "h1": "Contact",
      "sub": "Des questions, des données à partager ou envie de collaborer ? Écrivez-nous : nous lisons nous-mêmes.",
      "emailLabel": "E-MAIL",
      "write": "Écrire un e-mail",
      "copy": "Copier l'adresse",
      "copied": "Adresse copiée",
      "subject": "Demande depuis Dehesa Index",
      "note": "Il n'y a pas de formulaire sur le site et nous ne conservons pas cette demande ici : votre message est traité par courriel et ce que vous écrivez reste dans notre boîte. Voir les informations sur la vie privée."
    },
    "it": {
      "title": "Contatti | Dehesa Index",
      "h1": "Contatti",
      "sub": "Domande, dati da condividere o interesse a collaborare? Scrivici un'e-mail: la leggiamo noi.",
      "emailLabel": "E-MAIL",
      "write": "Scrivi un'e-mail",
      "copy": "Copia l'indirizzo",
      "copied": "Indirizzo copiato",
      "subject": "Richiesta da Dehesa Index",
      "note": "Non c’è un modulo sul sito e non conserviamo qui questa richiesta: il tuo messaggio viene gestito via email e ciò che scrivi resta nella nostra casella. Vedi l’informativa sulla privacy."
    }
  };

  function render() {
    var lang = window.DehesaShared.getLang();
    var t = STRINGS[lang] || STRINGS.es;
    document.title = t.title;
    document.getElementById('ct-h1').textContent = t.h1;
    document.getElementById('ct-sub').textContent = t.sub;
    document.getElementById('ct-email-label').textContent = t.emailLabel;
    var w = document.getElementById('ct-write'); w.textContent = t.write; w.setAttribute('href', 'mailto:hola@dehesaindex.com?subject=' + encodeURIComponent(t.subject));
    var c = document.getElementById('ct-copy'); c.textContent = t.copy;
    c.onclick = function () {
      var done = function () { document.getElementById('ct-copied').textContent = t.copied; };
      try { navigator.clipboard.writeText('hola@dehesaindex.com').then(done, function () {}); } catch (e) { /* sin portapapeles: el enlace de correo sigue funcionando */ }
    };
    document.getElementById('ct-note').textContent = t.note;
  }

  window.DehesaShared.init('contacto');
  window.DehesaShared.onLangChange = render;
  render();
})();
