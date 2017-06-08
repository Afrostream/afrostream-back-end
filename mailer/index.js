const Mailer = require('./Mailer');

module.exports = Mailer;

Mailer.List = require('./MailerList');
Mailer.Provider = require('./MailerProvider');
Mailer.Subscriber = require('./MailerSubscriber');
Mailer.APIInterface = require('./APIInterface/APIInterface');
