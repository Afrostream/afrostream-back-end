'use strict';

var Q = require('q');
var config = rootRequire('/server/config');
var sendgrid = require('sendgrid')(config.sendGrid.api_key);

var send = function (email) {
  console.log('[INFO]: [SENDGRID]: sending email ' + JSON.stringify(email));

  if (config.sendGrid.doNotSend) {
    console.log('[INFO]: [SENDGRID]: sending email skipped');
    return Q({});
  }
  return Q.ninvoke(sendgrid, 'send', email)
    .then(
    function success(data) {
      console.log('[INFO]: [SENDGRID]: send ', data);
      return data;
    },
    function error(err) {
      console.error('[ERROR]: [SENDGRID]: error ', err);
      throw err;
    }
  );
};

exports = module.exports = {
  sendGiftEmail: function (purchaseDetails) {
    var giverFullName = (purchaseDetails['giverFirstName'] && purchaseDetails['giverLastName']
    !== 'undefined' ? (purchaseDetails['giverFirstName'] + ' ' + purchaseDetails['giverLastName']) : '');
    var recipientFullName = (purchaseDetails['recipientFirstName'] && purchaseDetails['recipientLastName']
    !== 'undefined' ? (purchaseDetails['recipientFirstName'] + ' ' + purchaseDetails['recipientLastName']) : '');
    var formattedSubtotal = (purchaseDetails['subtotalInCents'] / 100).toLocaleString('fr-FR');
    var formattedTotal = (purchaseDetails['totalInCents'] / 100).toLocaleString('fr-FR');
    var discountLineItem = (purchaseDetails['discountInCents'] > 0)
      ? 'Code Promo: -' + (purchaseDetails['discountInCents'] / 100).toLocaleString('fr-FR') +
    ' ' + purchaseDetails['invoiceCurrency'] + '\n\n' : '';

    var email = {
      from: 'abonnement@afrostream.tv',
      to: purchaseDetails['giverEmail'],
      //bcc: ['abonnement@afrostream.tv'],
      subject: 'Confirmation de votre cadeau à '
      + recipientFullName,

      text: 'Bonjour ' + giverFullName + ', \n\n' +
      'Grâce à vous, ' + recipientFullName + ' est maintenant abonné(e) à Afrostream et va profiter de 12 mois de séries et films afro en illimité.\n\n'
      + recipientFullName + ' vient de recevoir par email les informations nécessaires pour se connecter à Afrostream.\n\n'
      + 'N\'hésitez pas à lui envoyer un message pour vérifier que notre email n\'est pas dans ses spams.\n\n'
      + 'À bientôt\n\n'
      + 'Tonjé BAKANG\n\n'
      + 'Fondateur d\'AFROSTREAM'
      + '-----------------------------------\n\n'
      + 'Votre sélection : Formule ' + purchaseDetails['planName'] + '\n\n'
      + 'Commande n° ' + purchaseDetails['invoiceNumber'] + '\n\n'
      + 'Prix:' + formattedSubtotal + ' ' + purchaseDetails['invoiceCurrency'] + '\n\n'
      + 'Sous-total:  ' + formattedTotal + ' ' + purchaseDetails['invoiceCurrency'] + '\n\n'
      + discountLineItem
      + 'Payé:      ' + formattedTotal + ' ' + purchaseDetails['invoiceCurrency'] + '\n\n'
      + 'Valable jusqu\'au ' + purchaseDetails['closedAt'] + '\n\n\n'
      + 'Facturé à :\n\n'
      + giverFullName + '\n\n'
      + '-----------------------------------\n\n'
    };
    return send(email);
  },

  sendResetPasswordEmail: function (emailAddress, token) {
    var email = {
      from: 'no-reply@afrostream.tv',
      to: emailAddress,
      bcc: ['reset@afrostream.tv'],
      subject: 'Mise à jour de votre mot de passe Afrostream',
      text: 'Bonjour, \n\n' +
      'Veuillez cliquer sur le lien suivant pour confirmer la mise à jour de votre mot de passe : '
      + config.frontEnd.protocol + '://' + config.frontEnd.authority + '/reset?k=' + token + ' \n\n'
      + 'Si le lien ne fonctionne pas, veuillez le copier-coller dans votre navigateur.\n\n'
      + '\n\n'
      + '--\n\n'
      + 'AFROSTREAM'
    };
    return send(email);
  },

  sendPasswordEmail: function (emailAddress, password) {
    var email = {
      from: 'no-reply@afrostream.tv',
      to: emailAddress,
      bcc: [/*FIXME*/],
      subject: 'Votre mot de passe Afrostream',
      text: 'Bonjour, \n\n' +
      'Le mot de passe de votre compte afrostream est : ' + password + '\n\n'
      + '\n\n'
      + '--\n\n'
      + 'AFROSTREAM'
    };
    return send(email);
  }
};
