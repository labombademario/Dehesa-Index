/* Dehesa Index — página de Contacto */
(function () {
  'use strict';

  var STRINGS = {
    es: {
      title: 'Dehesa Index — Contacto',
      h1: 'Contacto',
      sub: '¿Preguntas, datos que quieras aportar o interés en colaborar? Escríbenos.',
      emailLabel: 'EMAIL',
      formTitle: 'O ESCRÍBENOS DESDE AQUÍ',
      nameLabel: 'Nombre',
      namePlaceholder: 'Tu nombre',
      emailFieldLabel: 'Email',
      emailPlaceholder: 'tucorreo@ejemplo.com',
      messageLabel: 'Mensaje',
      messagePlaceholder: 'Cuéntanos en qué podemos ayudarte',
      submitButton: 'Enviar mensaje',
      formNote: 'Formulario en construcción — de momento, escríbenos directamente a hola@dehesaindex.com.'
    },
    en: {
      title: 'Dehesa Index — Contact',
      h1: 'Contact',
      sub: "Questions, data you'd like to contribute, or interested in collaborating? Get in touch.",
      emailLabel: 'EMAIL',
      formTitle: 'OR WRITE TO US HERE',
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      emailFieldLabel: 'Email',
      emailPlaceholder: 'youremail@example.com',
      messageLabel: 'Message',
      messagePlaceholder: 'Tell us how we can help',
      submitButton: 'Send message',
      formNote: 'Form under construction — for now, email us directly at hola@dehesaindex.com.'
    },
    fr: {
      title: 'Dehesa Index — Contact',
      h1: 'Contact',
      sub: "Des questions, des données à partager ou l'envie de collaborer ? Écrivez-nous.",
      emailLabel: 'E-MAIL',
      formTitle: 'OU ÉCRIVEZ-NOUS ICI',
      nameLabel: 'Nom',
      namePlaceholder: 'Votre nom',
      emailFieldLabel: 'E-mail',
      emailPlaceholder: 'votreemail@exemple.com',
      messageLabel: 'Message',
      messagePlaceholder: 'Dites-nous comment nous pouvons vous aider',
      submitButton: 'Envoyer le message',
      formNote: 'Formulaire en construction — en attendant, écrivez-nous directement à hola@dehesaindex.com.'
    },
    it: {
      title: 'Dehesa Index — Contatti',
      h1: 'Contatti',
      sub: 'Domande, dati che vuoi contribuire o interesse a collaborare? Scrivici.',
      emailLabel: 'EMAIL',
      formTitle: 'OPPURE SCRIVICI QUI',
      nameLabel: 'Nome',
      namePlaceholder: 'Il tuo nome',
      emailFieldLabel: 'Email',
      emailPlaceholder: 'tuaemail@esempio.com',
      messageLabel: 'Messaggio',
      messagePlaceholder: 'Raccontaci come possiamo aiutarti',
      submitButton: 'Invia messaggio',
      formNote: 'Modulo in costruzione — nel frattempo, scrivici direttamente a hola@dehesaindex.com.'
    }
  };

  function render() {
    var lang = window.DehesaShared.getLang();
    var t = STRINGS[lang] || STRINGS.es;

    document.title = t.title;
    document.getElementById('ct-h1').textContent = t.h1;
    document.getElementById('ct-sub').textContent = t.sub;
    document.getElementById('ct-email-label').textContent = t.emailLabel;
    document.getElementById('ct-form-title').textContent = t.formTitle;
    document.getElementById('ct-name-label').textContent = t.nameLabel;
    document.getElementById('ct-name-input').setAttribute('placeholder', t.namePlaceholder);
    document.getElementById('ct-email-field-label').textContent = t.emailFieldLabel;
    document.getElementById('ct-email-input').setAttribute('placeholder', t.emailPlaceholder);
    document.getElementById('ct-message-label').textContent = t.messageLabel;
    document.getElementById('ct-message-input').setAttribute('placeholder', t.messagePlaceholder);
    document.getElementById('ct-submit').textContent = t.submitButton;
    document.getElementById('ct-form-note').textContent = t.formNote;
  }

  window.DehesaShared.init('contacto');
  window.DehesaShared.onLangChange = render;
  render();
})();
