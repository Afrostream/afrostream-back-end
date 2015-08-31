'use strict';
var Promise = require('bluebird');
var config = require('../../config/environment');
var _ = require('lodash');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

exports = module.exports = {
  sendStandardEmail: function (res, account, planName, invoice) {

    var options = {
      auth: {
        api_user: config.sendgrid.api_user,
        api_key: config.sendgrid.api_key
      }
    };

    var client = nodemailer.createTransport(sgTransport(options));
    var firstName = (account['first_name'] !== 'undefined' ? account['first_name'] : '');
    var email = {
      from: 'abonnement@afrostream.tv',
      to: account['email'],
      bcc: ['abonnement@afrostream.tv'],
      subject: 'Confirmation d\'abonnement : Bienvenue dans la famille AFROSTREAM '
      + firstName,

      text: 'Bonjour ' + firstName + ', \n\n' +
      'Je  suis heureux de te compter parmi nous ! Dès aujourd‘hui '
      + '(le 1er octobre pour les abonnés "Think Like a Man"), tu peux profiter '
      + 'des films et séries afro en illimité.\n\n'
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
    var sendMailAsync = Promise.promisify(client.sendMail, client);

    return sendMailAsync(email);

  },
  handleError: function (res) {
    return function (err) {
      res.status(500).send(err);
    };
  }
};
