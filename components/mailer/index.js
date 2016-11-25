'use strict';

var Q = require('q');
var config = rootRequire('config');
var sendgrid = require('sendgrid')(config.sendGrid.api_key);
var logger = rootRequire('logger').prefix('SENDGRID');

var send = function(email) {
  logger.log('sending email ' + JSON.stringify(email));

  if (config.sendGrid.doNotSend) {
    logger.log('sending email skipped');
    return Q({});
  }

  const request = sendgrid.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: email
  });

  return sendgrid.API(request)
    .then(function success(response) {
        logger.log('statusCode ', response.statusCode);
        logger.log('body ', response.body);
        logger.log('headers ', response.headers);
        return response;
      },
      function error(err) {
        logger.error(err.message);
        throw err;
      });
};

exports = module.exports = {
  sendGiftEmail: function(c, subscription) {

    var formattedTotal = subscription.internalPlan.amountInCents / 100;
    var gifterFullName = c.bodyFirstName + ' ' + c.bodyLastName;
    var recipientFullName = subscription.user.userOpts.firstName + ' ' + subscription.user.userOpts.lastName;

    var email = {
      personalizations: [{
        to: [{
          email: c.userEmail,
        }],
        subject: 'Confirmation de votre cadeau à ' + recipientFullName
      }],
      from: {
        email: 'abonnement@afrostream.tv'
      },
      content: [{
        type: 'text/plain',
        value: 'Bonjour ' + gifterFullName + ', \n\n' +
          'Grâce à vous, ' + recipientFullName + ' est maintenant abonné(e) à Afrostream et va profiter de 12 mois de séries et films afro en illimité.\n\n' +
          recipientFullName + ' vient de recevoir par email les informations nécessaires pour se connecter à Afrostream.\n\n' +
          'N\'hésitez pas à lui envoyer un message pour vérifier que notre email n\'est pas dans ses spams.\n\n' +
          'À bientôt\n\n' +
          'Tonjé BAKANG\n\n' +
          'Fondateur d\'AFROSTREAM' +
          '-----------------------------------\n\n' +
          'Votre sélection : Formule ' + subscription.internalPlan.name + '\n\n' +
          'Payé:      ' + formattedTotal + ' ' + subscription.internalPlan.currency + '\n\n' +
          'Valable jusqu\'au ' + subscription.subPeriodEndsDate + '\n\n\n' +
          'Facturé à :\n\n' +
          gifterFullName + '\n\n' +
          '-----------------------------------\n\n'
      }]
    };
    return send(email);
  },

  sendResetPasswordEmail: function(emailAddress, token) {
    var email = {
      personalizations: [{
        to: [{
          email: emailAddress,
        }],
        bcc: [{
          email: 'reset@afrostream.tv'
        }],
        subject: 'Mise à jour de votre mot de passe Afrostream'
      }],
      from: {
        email: 'no-reply@afrostream.tv'
      },
      content: [{
        type: 'text/plain',
        value: 'Bonjour, \n\n' +
          'Veuillez cliquer sur le lien suivant pour confirmer la mise à jour de votre mot de passe : ' +
          config.frontEnd.protocol + '://' + config.frontEnd.authority + '/reset?k=' + token + ' \n\n' +
          'Si le lien ne fonctionne pas, veuillez le copier-coller dans votre navigateur.\n\n' +
          '\n\n' +
          '--\n\n' +
          'AFROSTREAM'
      }]
    };
    return send(email);
  },

  sendPasswordEmail: function(emailAddress, password) {
    var email = {
      personalizations: [{
        to: [{
          email: emailAddress,
        }],
        subject: 'Votre mot de passe Afrostream'
      }],
      from: {
        email: 'no-reply@afrostream.tv'
      },
      content: [{
        type: 'text/plain',
        value: 'Bonjour, \n\n' +
          'Le mot de passe de votre compte afrostream est : ' + password + '\n\n' +
          '\n\n' +
          '--\n\n' +
          'AFROSTREAM'
      }]
    };
    return send(email);
  }
};
