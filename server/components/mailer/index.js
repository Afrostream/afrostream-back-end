'use strict';
var Promise = require('bluebird');
var config = require('../../config');
var _ = require('lodash');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var sendgrid = require('sendgrid')(config.sendGrid.api_key);

exports = module.exports = {
  sendStandardEmail: function (res, account, planName, planCode, invoice) {

    var options = {
      auth: {
        api_user: config.sendGrid.api_user,
        api_key: config.sendGrid.api_key
      }
    };

    var client = nodemailer.createTransport(sgTransport(options));
    var firstName = (account['first_name'] && account['first_name'] !== 'undefined' ? account['first_name'] : '');
    var email = {
      from: 'abonnement@afrostream.tv',
      to: account['email'],
      bcc: ['abonnement@afrostream.tv'],
      subject: 'Confirmation d\'abonnement : Bienvenue dans la famille AFROSTREAM '
      + firstName,

      text: 'Bonjour ' + firstName + ', \n\n' +
      'Je  suis heureux de te compter parmi nous !'
      + (planCode === 'afrostreammonthly' ? 'Tu pourras profiter d’Afrostream à partir du 1er ocotbre.' : 'Tu peux dès maintenant profiter d’Afrostream en te connectant sur http://afrostream.tv.')
      + 'Pour satisfaire au mieux tes attentes, peux tu répondre à 6 questions (30 sec.) '
      + 'en cliquant ici: https://docs.google.com/a/afrostream.tv/forms/d/1KyfN8Ng25UZ8KZtNCAr3DPC-ldNwpESDNEig4UQ9LpQ/viewform \n\n'
      + 'Mais si tu le préfères, je peux t’appeler cette semaine pour quelques questions.\n\n'
      + 'À très vite,\n\n'
      + 'Tonjé BAKANG\n\n'
      + 'Fondateur d\'AFROSTREAM'
      + '-----------------------------------\n\n'
      + 'Votre sélection : Formule ' + planName + '\n\n'
      + 'Commande n° ' + invoice['invoice_number'] + '\n\n'
      + 'Sous-total:  ' + invoice['total_in_cents'] + invoice.currency + '\n\n'
      + 'Payé:      ' + invoice['total_in_cents'] + invoice.currency + '\n\n'
      + 'Valable jusqu\'au ' + invoice['closed_at'] + '\n\n\n'
      + 'Facturé à :\n\n'
      + firstName.toUpperCase() + '\n\n'
      + '-----------------------------------\n\n'
    };
    var sendMailAsync = Promise.promisify(sendgrid.send, sendgrid);
    var sendMailAsync = Promise.promisify(client.sendMail, client);

    return sendMailAsync(email).then(function (json) {
      console.log(json);
      return true;
    }).catch(this.handleError(res));

  },

  sendGiftEmail: function (purchaseDetails) {

    var options = {
      auth: {
        api_user: config.sendGrid.api_user,
        api_key: config.sendGrid.api_key
      }
    };

    var client = nodemailer.createTransport(sgTransport(options));
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

    var sendMailAsync = Promise.promisify(client.sendMail, client);

    return sendMailAsync(email).then(function (json) {
      console.log(json);
      return true;
    }).catch(function (e) {
      console.log(e);
    });

  },

  sendResetPasswordEmail: function (emailAddress, token) {
    var options = {
      auth: {
        api_user: config.sendGrid.api_user,
        api_key: config.sendGrid.api_key
      }
    };

    var client = nodemailer.createTransport(sgTransport(options));
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

    console.log('mailer: sending: ', email);

    // FIXME: testing email in dev / test env ?
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return Q(true);
    }

    // test/staging/prod
    var sendMailAsync = Promise.promisify(client.sendMail, client);
    return sendMailAsync(email)
      .then(function (json) {
        console.log('reset email sent ', json);
        return true;
      });
  },

  handleError: function (res) {
    return function (err) {
      console.log(err);
      res.status(500).send(err);
    };
  }
};
