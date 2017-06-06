const sqldb = rootRequire('sqldb');

class MailerSubscriber {
  constructor () {

  }

  getDbModel() {
    return sqldb.MailerSubscriber;
  }

  loadByEmail() {

  }
}

module.exports = MailerSubscriber;
