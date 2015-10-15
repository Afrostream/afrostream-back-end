'use strict';

var BluebirdPromise = require('bluebird');
var config = require('../../config/environment');
var sendgrid = require('sendgrid')(config.sendGrid.api_key);

exports = module.exports = {
  sendStandardEmail: function (res, account, planName, planCode, invoice) {
    // FIXME: account.first_name !== 'undefined' <= ??
    var firstName = (account.first_name && account.first_name !== 'undefined' ? account.first_name : '');
    var email = {
      from: 'abonnement@afrostream.tv',
      to: account.email,
      bcc: ['abonnement@afrostream.tv'],
      subject: 'Confirmation d\'abonnement : Bienvenue dans la famille AFROSTREAM ' +
      firstName,

      text: 'Bonjour ' + firstName + ', \n\n' +
      'Je  suis heureux de te compter parmi nous !' +
      ((planCode === 'afrostreammonthly' ? 'Tu pourras profiter d’Afrostream à partir du 1er ocotbre.' : 'Tu peux dès maintenant profiter d’Afrostream en te connectant sur http://beta.afrostream.tv.')) +
      'Pour satisfaire au mieux tes attentes, peux tu répondre à 6 questions (30 sec.) ' +
      'en cliquant ici: https://docs.google.com/a/afrostream.tv/forms/d/1KyfN8Ng25UZ8KZtNCAr3DPC-ldNwpESDNEig4UQ9LpQ/viewform \n\n' +
      'Mais si tu le préfères, je peux t’appeler cette semaine pour quelques questions.\n\n' +
      'À très vite,\n\n' +
      'Tonjé BAKANG\n\n' +
      'Fondateur d\'AFROSTREAM' +
      '-----------------------------------\n\n' +
      'Votre sélection : Formule ' + planName + '\n\n' +
      'Commande n° ' + invoice.invoice_number + '\n\n' +
      'Sous-total:  ' + invoice.total_in_cents + invoice.currency + '\n\n' +
      'Payé:      ' + invoice.total_in_cents + invoice.currency + '\n\n' +
      'Valable jusqu\'au ' + invoice.closed_at + '\n\n\n' +
      'Facturé à :\n\n' +
      firstName.toUpperCase() + '\n\n' +
      '-----------------------------------\n\n'
    };
    var sendMailAsync = BluebirdPromise.promisify(sendgrid.send, sendgrid);

    return sendMailAsync(email).then(function (json) {
      console.log(json);
      return true;
    }).catch(this.handleError(res));

  },
  handleError: function (res) {
    return function (err) {
      res.status(500).send(err);
    };
  }
};
